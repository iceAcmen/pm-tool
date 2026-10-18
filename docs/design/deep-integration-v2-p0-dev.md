# P0 开发规格 · 深度融合（底座+采集闭环）

> 性质：真实代码开发。用户已拍板「按推荐执行」；P0 范围 = 推荐组合五层主线的第 0 层底座 + 第 1 层采集闭环，对应效果图 S1/S2。
> 依据：`docs/design/deep-integration-v2-designs-rework/SPEC.md`（界面）、`docs/design/deep-integration-brainstorm-v2-20261018.md` 第七部分（能力结论）、`docs/decision-log.md`（C3 人裁决/ADL-032 无常驻推送等）。
> 硬约束：不影响运行中 3172 实例（--profile pm --port 3172 --no-open，不重启）；H6 常驻推送本期不实现（P3 立项）；K2 第 3 项（approved-pending 队列）+H5 直写扩界本期不开通；K18 不预设 GitHub；所有写操作保留人确认与可撤销；示例数据禁止进真实 UI（UI 只展示真实数据，无示例数据注入）。

---

## 一、P0 八项能力 → 文件级改动契约

| 能力 | 技术落点 | 涉及文件（新建/修改） |
|---|---|---|
| K1 上下文读取增强 | ask 上下文补 description/证据/交付物连接/逾期临期派生行 | 改 `src/core/ask-copilot.ts`、`src/commands/ask.ts` |
| K2 受限直写窄集 | task.update 白名单扩 description/evidenceUrl/repoUrl/branch + 类型闸；系统提示同步 | 改 `src/core/copilot.ts`、`src/core/ask-copilot.ts`（COPILOT_SYSTEM）；`src/core/task.ts` 校验已具备 |
| K4 对话补档 | 新命令 capture（草稿观察模式）+ capture-apply（确认落库） | 新 `src/commands/capture.ts`、`src/core/capture.ts`；provenance kind 加 `'capture'`（改 `src/core/provenance-store.ts`） |
| K3 证据闭环 | capture 草稿含证据候选（title/url），apply 时挂到任务 evidenceUrl（走 task.update 白名单）；另 `/pm attach-evidence <taskId> <url>` 单条确认直挂 | capture.ts 内含；新 `src/core/evidence.ts` |
| K9 会话结存 | 新表 sessions（绑定 task/session + 沉淀 note）+ bind/list 命令 | 新 `src/commands/session.ts`、`src/core/session-bind.ts`；`src/core/storage.ts` 注册表 |
| K12 自我计量 | 新命令 metric：汇总 provenance 账本（按 kind/undo 结果/时间）+ 采纳计数 | 新 `src/commands/metric.ts`、`src/core/metric.ts`；只读 |
| X6-L1 即时复盘草稿 | task.deliverableId 新字段；新表 reflections；task done 事件自动建草稿（模板，句级已核/待核/留白）；reflect 命令 | 改 `src/core/task.ts`（字段+校验）；新 `src/core/reflect.ts`、`src/commands/reflect.ts`；`src/core/storage.ts` 注册表；触发钩子接 `src/core/tasks.ts`（updateTask 内）与 `src/commands/ask.ts`（ask-apply dispatch task.update 后） |
| K6 交付检查 | 新命令 check：规则纯函数（逾期未动/临期未动/完成但有未完成清单项/完成但缺证据/进度100状态不符），复用 reminders/derived | 新 `src/commands/check.ts`、`src/core/check.ts` |

统一注册：`src/index.ts` 增加 5 个命令路由（capture/capture-apply/session/reflect/check/metric，+attach-evidence 并入 capture.ts 导出）。storage.ts 表注册与 task.ts 字段由组织者先行（契约层）。

---

## 二、数据契约（契约层先行实现，各分片只消费）

### 2.1 storage.ts 新表（schema 写在各分片 core 文件并导入 storage.ts 注册）

```ts
// sessions：K9 会话结存绑定
export const sessionRecordSchema = z.object({
  id: z.string(),               // session-<ts36>-<rand6>
  projectId: z.string(),
  taskId: z.string(),           // 绑定任务
  sessionId: z.string(),        // 会话标识（用户提供，如 s-0411）
  note: z.string().optional(),  // 结存摘要（沉淀结果，可追加）
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

// reflections：X6-L1 即时复盘草稿（克制文本，无积分/连胜/徽章）
export const reflectionRecordSchema = z.object({
  id: z.string(),               // ref-<ts36>-<rand6>
  projectId: z.string(),
  taskId: z.string(),
  status: z.enum(['draft', 'final']),   // 默认 draft；final 只由人定稿
  sourceEvent: z.enum(['task-done']),
  draft: z.object({
    title: z.string(),
    at: z.iso.datetime(),
    lines: z.array(z.object({          // 句级标注：已核/待核/留白
      text: z.string(),
      mark: z.enum(['known', 'pending', 'blank']),
    })),
    gaps: z.array(z.string()),          // 证据不足留白清单（不编造）
  }),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
```
表名：`sessions`、`reflections`。注册到 `pmDomainSpec.tables`（domainTable(sessionRecordSchema) 等）。**注意 pmtool 领域 version=2、layout per-record**——新表照现有模式注册即可，无需 bump version（新表无兼容问题，旧数据不受影响）。

### 2.2 task.ts 新字段（X6 连接）

```ts
// task → deliverable 连接（本期补，供复盘草稿判断里程碑/交付物级别）
import { deliverableIdSchema } from './deliverable.js'  // 确认该 schema 导出名，否则用本文件等价正则
deliverableId: deliverableIdSchema.nullable().optional(),
```
- 加入 `taskFields`、`taskCreateSchema`、`taskUpdateSchema`、`describeTaskValidation` 标签（「关联交付物 ID 或 null」）。
- 写校验：存在性/同项目由 `tasks.ts`（或新增校验函数）负责——参照 `milestoneId` 的既有做法（TaskMilestoneNotFoundError 模式），新增 `TaskDeliverableNotFoundError` / `TaskDeliverableProjectMismatchError` 或在 updateTask 内复用同一处校验。

### 2.3 provenance-store.ts 扩展（K4 落库留痕）

`ProvenanceKind` 联合类型加 `'capture'`（只读兼容，旧数据不受影响）。

---

## 三、命令契约（各分片实现，统一注册在 index.ts）

### K2/K1（分片A）
- `copilot.ts` task.update 分支：allowed 字段从 5 个扩为 `status/progress/dueDate/startDate/assignee/description/evidenceUrl/repoUrl/branch`：
  - `description`：字符串（strField），上限 2000 字（截断/拒超长）
  - `evidenceUrl` / `repoUrl`：合法 URL 形状（http/https）或相对路径，上限 2048
  - `branch`：字符串，上限 128
  - 其余字段（如 `title/priority/effortHours/manualProgress/checklist` 等）仍拒绝——关键状态/排期不扩写（用户拍板窄集 2 项）。**注意**：现有 status/progress/dueDate/startDate/assignee 是既有白名单，保持不动（本期不收紧也不扩）。
- `ask-copilot.ts` COPILOT_SYSTEM：task.update 的 patch 字段说明同步补 description/evidenceUrl/repoUrl/branch 及其约束；AskContext.tasks 类型加可选字段 `description?: string`、`hasEvidence?: boolean`、`deliverableId?: string | null`；buildAskContext 任务行尾追加 `备注=有/无`（description 存在即「有备注」，截断 40 字）、`证据=有/无`、`交付物=ID 或「无」`——保持 joinOrNote 风格，缺则如实标注，不编造。
- `commands/ask.ts` 的 ctxText 构造：tasks map 增加上述三字段透传。
- `commands/metric.ts` + `core/metric.ts`：`/pm metric <projectId>` 只读汇总：
  ```json
  { "projectId": "...", "total": n, "byKind": {"ask-apply": n, "capture": n, ...},
    "undoOutcomes": {"undone": n, "conflict": n, "failed": n},
    "appliedSteps": n,   // 从账本条目 refs 聚合（读 provenance.ts 的 refs 结构定实现）
    "rejected": n,       // 若账本含 rejected 信息则聚合，否则省略
    "pendingCount": n, "last": "2026-..T.." }
  ```
  实现细节以 provenance-store.ts 的 listProvenance/RecordProvenanceInput/audit 结构为准（分片先读）。

### K4/K3/K9（分片B）
- `commands/capture.ts`：
  - `/pm capture <projectId> "<会话文本>"` → 调 LLM（generateDraft，参照 ask.ts 用法）提取待办候选 + 证据候选，返回 JSON 草稿：`{"candidates":[{"title","dueDate?","assignee?","description?","evidence?":["url..."]}],"evidenceCandidates":[{"title","url"}],"note":"观察模式：未落库，确认后经 capture-apply 落库"}`。**观察模式：只展示不落库**；LLM 缺失/失败返回中文降级（参照 PROD_KEY_MISSING_TEXT 模式）。
  - `/pm capture-apply <projectId> "<json草稿>"` → 逐条校验（title 非空/日期合法/字段白名单，复用 capture.ts 内 checkEntityFields 式校验）→ `addTask` 落库（projectId 注入）→ evidenceCandidates 中带 taskId 映射的挂 `evidenceUrl`（走 updateTask + 白名单校验）→ `recordProvenance(kind:'capture')` → 返回创建的任务 id 列表 + provenance 摘要。可撤销：返回任务 id，撤销经 `/pm task delete <id>` + 溯源留痕（不建第二 undo 体系，规格注明）。
  - `/pm attach-evidence <taskId> <url>` → 校验任务存在 + URL 合法 → updateTask evidenceUrl → provenance（kind:'ask-apply' 或 'capture'，取合适者；实现时若 attach 无 projectId 上下文则从任务反查 projectId）→ 返回确认+可撤销提示（复用 ask-apply 的 undo 或提示 task 命令撤销路径——**本期最小：返回成功文本 + 溯源记录**）。
- `commands/session.ts` + `core/session-bind.ts`：
  - `/pm session bind <taskId> <sessionId> [note]` → 校验任务存在 → 建 sessions 记录（同 task 同 session 已存在则追加 note 合并，updatedAt 刷新）→ 返回绑定 id。
  - `/pm session list <projectId>` → 列出该项目的会话绑定（taskId/sessionId/note/时间），JSON 文本。
  - `/pm session notes <taskId>` → 该任务的全部结存摘要。
  - 追加沉淀：`/pm session append <sessionId记录id> "<note>"`（可选，若时间允许；最小集可只做 bind/list/notes）。

### X6-L1/K6（分片C）
- `core/reflect.ts`：
  - `ensureReflectionOnDone(domain, task)`：任务 status 变 done 且该 task 无 reflections 记录时，创建草稿：title=`${task.title} · 完成即时复盘（草稿）`，at=now，lines=[]（待核占位：`{"text":"完成时刻 ${task.completedDate ?? today}","mark":"known"}` + 若 task.description 有内容追加 known 行；证据/交付物信息放 gaps 或 pending），gaps=['待补：交付验收材料', ...仅当确实缺失]，克制文本、无徽章。best-effort：失败不阻断任务落库（catch 记日志）。
  - 触发点 1：`core/tasks.ts` updateTask 内 status 变为 done 时（在写库成功后 best-effort 调用）。触发点 2：`commands/ask.ts` applyCore dispatch task.update 落库后若 status done 同样调用（通过 tasks.ts 内建钩子即可覆盖，ask-apply 走 updateTask 领域路径——确认 updateTask 是唯一写入口后只需一处钩子；若 ask-apply 有直写路径则两处都接）。
  - `/pm reflect <taskId>` → 查看草稿（无则提示「任务未完成或无复盘草稿」）；`/pm reflect <taskId> final` → 人定稿（status draft→final）；`/pm reflect <taskId> edit "<markdown>"` → 人补材料更新草稿（重写 lines，句级 mark 由人/实现保守标注）；`/pm reflect-list <projectId>` → 列出草稿状态。
- `core/check.ts` + `commands/check.ts`：
  - `/pm check <taskId>` 或 `/pm check <projectId>` → 纯函数规则输出：
    a) 逾期未动：dueDate < today 且 status != done
    b) 临期未动：dueDate - today <= 2 天 且 status == todo（临界口径与 reminders.ts 一致，读其实现对齐）
    c) 完成却有未完成清单项：status=done 且 checklist 存在且任一 done=false
    d) 完成但缺材料：status=done 且无 evidenceUrl 且无 checklist 且无 deliverableId →「提示：缺交付/证据材料，未覆盖≠未完成」
    e) 进度与状态不符：progress=100 且 status != done
  - 输出 JSON 列表（每条 rule/taskId/原因/措辞含「最终验收由人判断」）；只读不写。复用 `core/reminders.ts` 的逾期/临期派生，不重复造轮子。

---

## 四、验证与纪律

### 4.1 每分片必须
- 读 AGENTS.md 第 6 节硬约束与 `docs/knowledge-base.md` 已验证模式（uuid/日期/写入队列 enqueueDomainWrite 等）；新表写入必须 await 落盘（参照 selftest 的 put/await/get）。
- 新增/修改后跑：`cd packages/dsh-pm-tool && pnpm run build`（tsc 严格模式通过）+ 为新增 core 纯函数写 vitest 单测（参照既有 *.test.ts 风格，离线不依赖宿主）。
- 不触碰：`src/client/`（前端视图 P1 再做）、运行中 3172、上游 deepseek-harness 仓库、docs/design 下既有设计文档（可新增 P0 文档）。
- 修改后跑 `pnpm test`（vitest 全量）确认无回归（集成阶段由组织者统一跑）。

### 4.2 真实实例验证（组织者统一执行，独立于 3172）
- 用独立 profile/数据根（如 PM_STORAGE_ROOT 指向 `pm-tool/data-p0-verify/` 或独立 --profile p0verify）启动 dsh 实例（端口避开 3172），跑真实请求链：
  1. `/pm capture <project> "<会话文本>"` → 返回草稿（真实 LLM 或 DSH_PM_E2E 缝降级——若无 prod key，用 E2E 缝+固定候选验证落库链路；有 key 则真实生成）
  2. `/pm capture-apply <project> <json>` → 真实入库（HTTP 200 语义 + 数据文件真实出现）
  3. `/pm ask <project> "..."` + ask-apply 写 description/evidenceUrl → 入库 + provenance 记录 + undo 可用
  4. task done → reflections 草稿自动出现；`/pm reflect` 可见
  5. `/pm check`、`/pm metric` 输出真实数据
  6. `/pm session bind/list` 真实读写
  7. 溯源：/pm ask-provenance 看到 capture/apply 条目
- 全程不动 3172（不重启、不写其数据根）。

### 4.3 交付与提交
- 完成后组织者统一：build + vitest 全量 + 真实实例验证记录写入 `docs/design/deep-integration-v2-p0-verify.md`；更新 `docs/progress.md`/`docs/changelog.md`/`docs/onboarding-prompt.md` 交接快照；一次清晰提交 + `git push`（用户已授权）。

## 五、禁做清单（红线）
1. 不实现 H6 常驻推送；不引入常驻后台/系统通知（ADL-032）。
2. 不开通 K2 第 3 项（approved-pending 队列）与 H5 直写扩界（status/排期类 AI 自动改仍不在本期新增语义内；既有 5 字段白名单保持现状）。
3. 不做双向同步/外部平台接入（K18 只读导出语义，P0 不涉及）。
4. 不删改既有 ask-apply/undo/provenance 语义；新增全部走既有领域路径（enqueueDomainWrite/updateTask/addTask），禁止 table.put 绕过。
5. UI 不注入示例数据；前端新视图 P1。
6. 不修改上游宿主仓库；不重启/不写 3172 数据。

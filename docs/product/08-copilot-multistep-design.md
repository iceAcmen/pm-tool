<!--
产出角色：资深产品经理 / 只读设计裁决落档
日期：2026-10-13
变更摘要：PROD-20（AI 项目副驾）的「多步规划」增量定稿为 P0 设计稿。仅产品文档，不改 src/、不改 docs/testing/、不动任何 living 完成状态；实现待开发。执行裁决已由所有者拍板（见下「P0 裁决边界」）。
-->

# 08 · 副驾多步规划（Copilot Multi-Step Plan）设计稿 · 契约已定 · 未开发

> 本文是 **PROD-20 的多步规划增量（PROD-24）**：把 v0.5 已上线的「单轮扁平动作数组」升级为**带步骤、带理由、带依赖排序、可勾选可编辑的多步计划卡**，面向 Persona A/C 一次处理「这批收尾/这次重排」这类多任务联动诉求。
> **状态（2026-10-13）：设计定稿（评审稿），尚未开发。** 本文件只定义契约与验收，不改任何 living 完成状态；实现排在 v0.6 架构演进窗口（domain v2 之前），与人员负载视图（PROD-07）同期零冲突。
> **三条红线不可破**：离线优先 / AI 草稿确认制 / 单用户本地——多步规划是这三条的延伸，不是松动。

## 一、需求定位与编号

- **复用并升级 PROD-20**（权威表见 `05-roadmap-and-tasks.md`）：v0.5 的 ask/ask-apply 已跑通「模型提议→后端校验→用户确认→确定性落盘」四段链路（Round3 证据 s1-12 取消零写、s1-13 确认落库已验证）。本稿**不换执行引擎**，只升级「计划的表达、排序、选择与解释」。
- **编号 PROD-24**：副驾多步规划 P0。与 R##/ADL/KB/OPT 不冲突；roadmap 权威表同步登记一行。
- **迭代归属**：归 v0.6 架构演进窗口内的**体验增量**，但本 P0 **不动 domain/schema**（domain 仍 v1、9 张表）；计划持久化才是 domain v2 的事，见 P1。
- **对应痛点**：UX-10（对话式副驾只能一次出一团动作，多步联动时用户看不清先后、不敢整批确认）。

### P0 裁决边界（所有者拍板，设计不可越线）

1. **计划不持久化**：不写 settings 表、不新增计划表、不新增命令级服务端缓存；计划随模型响应返回，只活在**前端内存**（CopilotPanel state），关面板即消散。
2. **执行路径不变**：确认时仍走既有 `ask-apply <projectId> <selected ordered actions> --base <baseline>`；**不新增执行命令、不新增计划命令**。
3. **命令行长 JSON 风险 P0 接受**：selected actions 以 JSON 字面量拼进命令行——靠**预算护栏 ≤8 步**控制行长，不为它单独搞文件传参或命令缓存。
4. **旧输出兼容**：模型若仍只输出 `{"actions":[...]}`，解析器自动包成平凡计划（无依赖、无理由），v0.5 全部 E2E 用例不破。
5. **DAG 坏步拒、而非整份全拒**：依赖环 / 悬空 stepId / 自指 → 只拒该步并给原因，其余步照常可执行；**但整份 >8 步（或触及 >10 任务）整份拒绝**，让模型拆小。
6. **同任务链式 baseline**：整批提交内，两条步 patch 同一 taskId 时，后者用前者落库后的新 updatedAt 做冲突基线，不被误判为「他人已改」。
7. **整批 + 逐步两种确认**：同一 selected 集合，整批一次 ask-apply；逐步为前端逐步调 ask-apply（每次都重读 domain）。
8. **取消零写**：关掉草稿卡磁盘字节零变化（沿用 s1-12 断言法）。
9. **唯一写动作 `task.update`**：patch 白名单 5 字段（status/progress/assignee/startDate/dueDate）；其余 op 一律拒绝。

## 二、用户故事

- **US-1（多步联动收尾）**：PM 问「帮我把本周该收尾的理顺」→ 模型出 4 步计划卡（t-0003 收尾 → 释放赵六 → t-0007 派活 → 改其起期），每步理由可见 →【整批执行】→ 一行逐行汇报结果。
- **US-2（只跑一半）**：PM 看卡后觉得 s3 不急 → 取消勾选 s3 → 只提交其余步。
- **US-3（他人抢先改了）**：PM 打开草稿卡期间台账被改 → 确认时仅该步被链式冲突拒绝、其余步落库，文案逐行说明哪步被挡、为什么。
- **US-4（模型想删任务）**：计划里出现 `task.delete` 步 → 红行「已拒绝：不允许的操作」，绝不出现在可勾选列表。
- **US-5（模型抽风）**：输出无法解析 → 只有诊断正文 +「模型未给出可执行步骤」，零落库。
- **US-6（改主意）**：点【再聊聊/取消】→ 关卡，磁盘字节不变。
- **US-7（逐步求稳）**：PM 点【逐步执行】→ s1 跑完展示结果 → 满意再继续 s2。

## 三、数据契约（计划 / 步骤）

```ts
// 落在 core/copilot.ts（纯函数、离线可测），复用既有 CopilotAction
interface CopilotStep {
  stepId: string          // 模型给（s1/s2…）；重复 stepId 后者拒
  title: string           // 人话一句
  reason: string           // 为什么：可解释；空则该步标黄「模型未说明原因」但不拒
  action: CopilotAction    // 复用：{ op:'task.update', id, patch }
  needs: string[]          // 前置 stepId（可空）
  riskNote?: string        // 模型自评软风险（仅展示，绝不阻断）
}

interface CopilotPlan {
  projectId: string
  question: string
  steps: CopilotStep[]                      // 拓扑排序后的展示顺序
  rejected: { stepId?: string, reason: string }[]  // 计划级被拒的步
  baseline: Record<string, string>          // 快照时刻 taskId→updatedAt（原样走 --base）
}
```

**模型输出格式（COPILOT_SYSTEM 升级）**：

```json
{"plan":[
 {"stepId":"s1","title":"把 t-0003 收尾","reason":"进度100且阻塞已解",
  "action":{"op":"task.update","id":"t-0003","patch":{"status":"done","progress":100}},
  "needs":[]},
 {"stepId":"s2","title":"把 t-0007 排入下周","reason":"s1 释放了赵六带宽",
  "action":{"op":"task.update","id":"t-0007","patch":{"assignee":"赵六","startDate":"2026-10-20"}},
  "needs":["s1"]}
]}
```

- 抽不到 `plan` 但抽到旧 `{"actions":[...]}` → 包成 `needs:[]` 的平凡计划（裁决 4）。
- 两者都抽不到 → `steps=[]、rejected` 记录原因，前端只显示诊断正文。

## 四、依赖与拓扑顺序

1. **模型声明 needs[]**：做 DAG 拓扑；**环 / 指向不存在 stepId / 自指 → 该步进 rejected**（理由「依赖 sX 无法解析，已跳过该步」），其余步照常（裁决 5）。
2. **同目标任务的写顺序（我方推断，优先于模型声明）**：两条步 patch 同一 taskId → 无论模型怎么写 needs，按数组先后强制串行，走链式 baseline（裁决 6）。
3. **预算护栏**：整份步数 >8 或触及任务数 >10 → **整份拒绝**，文案「计划过大（N 步），请拆成 ≤8 步」，一条不发（裁决 5 后半）。这是命令行长 JSON 风险（裁决 3）的唯一控制手段。

## 五、确认交互（整批 / 逐步 / 编辑 / 跳过 / 取消）

| 操作 | P0 形态 |
|---|---|
| **整批执行** | 把勾选步按拓扑序拼成 action 数组，一次 `ask-apply ... --base baseline` |
| **逐步执行** | 前端循环：执行 s1 → 展示该步结果 → 用户确认 → 再 s2；每步独立 ask-apply、每次重读 domain |
| **跳过** | 每步一行 checkbox，默认全选；取消勾选 = 不进本次提交 |
| **编辑（最小集）** | 行内只允许改白名单标量：status（下拉四态）、progress（0–100）、assignee、start/dueDate；改完即时重跑前端 `validateActions`，非法行标红并禁用确认 |
| **取消** | 【再聊聊/取消】关卡，磁盘零变化（裁决 8） |
| 不支持 | 拖拽改序、跨步合并、改 op、模型未给的新步 |

## 六、冲突重读（链式 baseline）

- 计划生成时刻快照 `baseline = {taskId: updatedAt}` 原样透传 `--base`（v0.5 既有机制）。
- **链式**：整批提交内，某步成功后服务端把该 task 的**新 updatedAt** 刷进 baseline，供同目标后续步做冲突比较——s1 改 t-0003 成功不致 s2 改同一任务被误拒。
- **跨调用**（逐步模式、或用户在面板手动改过台账）：仍按原始 baseline 比较；他人动过 → 该步按 v0.5 原样拒「内容已被他人更新，为避免覆盖未执行」，其余步继续。
- 卡片打开期间若 snapshot 关键任务 updatedAt 变化，**前端不自动重发模型**（省额度原则），只在卡顶显示一行琥珀提示「你打开草稿后台账有变化，确认时将逐行重新核对」。

## 七、部分成功 / 补偿 / 幂等

- **部分成功**：复用 v0.5 逐条 try/catch；结果文案带 stepId+title，例如「已应用 2 步（s1 t-0003 收尾；s2 t-0007 排期）；未执行 1 步（s3：t-0010 已被他人更新）；拒绝 1 步（task.delete：不允许的操作）」。
- **补偿/回滚：P0 明确不做自动回滚**。唯一写动作是 5 个标量字段 update（无删除/无级联/无创建），失败步不污染他人；已成功步如需还原由用户手工改。自动补偿 = 第二次未经确认的写，违反草稿确认制。「撤销上次计划」命令列 P1。
- **幂等**：复用 v0.5 `recentDrafts`（60s TTL）+ `inFlight`（Promise 去重）；幂等键从 `projectId+JSON(actions)` 扩为 `projectId+JSON(selectedOrderedActions)+JSON(baseline)`。同一勾选集合 60s 内重复确认 →「该计划已确认过，未再次执行」。逐步模式每步 action 子集不同，键天然不同、互不干扰。

## 八、非法动作拒绝（白名单红线）

- **唯一允许写：`task.update`**；patch ∈ {status(todo/in_progress/blocked/done)、progress 0–100 整数、assignee 字符串、startDate/dueDate 合法 YYYY-MM-DD 且 start≤due}。
- 模型输出 `task.delete/task.create/task.move`、改 milestone/risk/meeting/report/deliverable/project → 该步进 rejected，红行展示「已拒绝：不允许的操作 task.delete」，**不进可勾选列表**。
- 空 patch、未知字段、目标不存在/不属于本项目 → 同 v0.5 逐条拒绝。

## 九、模型失败降级（复用 AiDraftError 码，不新造）

| 故障 | 行为 |
|---|---|
| 无 Key / 鉴权失败 | 复用 PROD_KEY_MISSING_TEXT；计划卡不出现，聊天给中文降级 +「你仍可手工录入」 |
| 限流 / 额度尽 | 「免费模型限流/额度用完，稍后再试」 |
| 输出乱码 / 抽不到 plan | 诊断正文照常显示；卡区显示「模型未给出可执行步骤」+ rejected 原因；零落库 |
| 0 步通过校验 | 等价于 v0.5「没有建议动作」 |
| 上下文超长 | 「项目数据太大，请缩小范围后重试」 |

一次提问只发一次模型请求；计划卡状态全在前端内存，「再聊聊」不重调模型。

## 十、可解释风险（确定性提示，只提示不阻断）

每行除 title/reason 外，前端**确定性**计算 3 条软风险（琥珀色、不禁用确认）：

1. progress 设 100 但 status≠done（或 status=done 但 progress<100）→「口径可能不一致」；
2. 目标 dueDate 早于今天且步要改成 in_progress →「该任务已逾期」；
3. assignee 是全项目从未出现过的人名 →「新负责人，确认不是错别字」。

模型给的 `riskNote` 原样展示一行；用户始终是最终裁决者。

## 十一、页面草图（CopilotPanel 草稿卡升级）

```
┌─ 操作计划（4 步，将影响 4 条任务，需确认）────────────┐
│ ☑ s1 · t-0003 收尾           为什么：进度100、阻塞已解 │
│     [status: done ▾] [progress: 100]                 │
│ ☑ s2 · t-0007 排入下周       为什么：s1 释放赵六       │
│     [assignee: 赵六] [startDate: 2026-10-20]          │
│     ⚠ 该任务已逾期                                   │
│ ☐ s3 · t-0010 标记受阻        为什么：…                 │
│ ✗ 已拒绝：不允许的操作 task.delete（t-0099）            │
│ ────────────────────────────────────────────────     │
│ [整批执行(3步)]  [逐步执行]    [再聊聊/取消]           │
│ 你打开草稿后台账有变化，确认时将逐行重新核对。            │
└────────────────────────────────────────────────────────┘
```

## 十二、P0 / P1 边界

| 能力 | P0 | P1（后续） |
|---|---|---|
| 计划解析 / DAG 拓扑 / 环检测 / 预算护栏 | ✅ 内存草稿 | — |
| 计划卡勾选 / 跳过 / 标量行内编辑 / 取消 | ✅ | — |
| 整批 + 逐步确认（复用 ask-apply） | ✅ | — |
| 链式 baseline / 冲突逐行拒绝 | ✅ | — |
| 部分成功逐行汇报 / 60s 幂等 | ✅ | — |
| 软风险确定性提示（3 条） | ✅ | 扩充规则 |
| 旧 actions 输出兼容 | ✅ | — |
| **计划持久化**（plan 表 / 重开面板见旧计划） | ❌ | domain v2 窗口 |
| **「撤销上次计划」补偿命令** | ❌ | P1 |
| 扩充 op（milestone.update / risk 关闭） | ❌ | 待单独立项 |
| 计划执行后自动追问 / 多轮重规划 | ❌ | P1 |

## 十三、验收标准（可测试）

1. 计划含一正一反依赖：拓扑序正确；环依赖步被拒且不影响其余步（裁决 5）。
2. 同目标两步：整批执行时第二步用链式 baseline，不被误判冲突（裁决 6）。
3. 打开草稿期间他人改 t-X → 确认时仅该步拒「已被他人更新」，其余落库。
4. 模型输出 task.delete 步 → 红行拒绝，不进可勾选列表（唯一 task.update）。
5. 取消勾选 s3 → 提交只含其余步；把 status 编成非法值（如 doing）→ 行标红、确认禁用。
6. 取消草稿 → tasks 目录字节级零变化（沿用 s1-12 断言法）。
7. 乱码输出 → 诊断正文在、卡区「未给出可执行步骤」、零落库。
8. 同一勾选集合 60s 内重复确认 → 幂等拦截，不二次写。
9. 无 Key / 限流 → 中文降级文案，台账不受影响。
10. 步数 >8 → 整份拒绝「建议拆分」，一条不发（预算护栏）。
11. 旧格式 `{"actions":[...]}` 输出 → 包成平凡计划正常执行（向后兼容）。

## 十四、反例（明确不做）

- 不新增计划表 / 不写 settings / 不新增命令级服务端计划缓存（计划只在前端内存）。
- 不新增执行命令；确认仍走 ask-apply 传 selected ordered actions + baseline。
- 不把命令行 JSON 拆成文件传参或命令缓存（行长风险靠 ≤8 步预算吸收）。
- 不自动回滚 / 不自动补偿 / 不自动重试失败步。
- 不放开 task.update 之外的任何 op；不自动改 milestone/risk/会议/汇报/交付物/项目。
- 不拖拽改序、不合并步、不让模型自己加步。
- 不在计划卡状态做持久化写盘；关面板计划即消散。

## 十五、文件级落地计划（未开发，实现时按此改）

| 文件 | 动作 | 说明 |
|---|---|---|
| `src/core/copilot.ts` | 新增纯函数 | `CopilotStep/CopilotPlan`、`parseCopilotPlan`（兼容旧 actions）、`validatePlan`（DAG/环/预算）；保留现有导出 |
| `src/core/ask-copilot.ts` | 小改 | `COPILOT_SYSTEM` 升级为计划块格式；`AskResult.plan`；空计划回退诊断 |
| `src/commands/ask.ts` | 小改 | `handleAskApplyCommand`：链式刷新 baseline、逐行带 stepId/title 结果；幂等键加 baseline；E2E fixture 缝扩成多步（含 delete 步 + 环依赖） |
| `src/client/panel.tsx` | 小改 | `CopilotPanel` 草稿卡→计划卡：拓扑列表、checkbox、行内标量编辑、整批/逐步按钮、软风险行、拒绝红行 |
| `scripts/verify-copilot.mjs` | 扩展断言 | 计划解析/拓扑/预算；新增 `verify-copilot-plan-cancel.mjs`（字节零变化） |
| **不改** | — | `core/storage.ts` domain 版本、任何 schema、`docs/testing/`、上游 deepseek-harness |

> 实现与验收待开发窗口开启后按本稿逐条执行；本文件状态随实现进度更新（当前：未开发）。

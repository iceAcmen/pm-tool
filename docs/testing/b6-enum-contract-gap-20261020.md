# B6 枚举 / 字段合同缺口（U5 具体化 + UI↔backend 对齐）· 2026-10-20

> QA 只读源码核对，不改业务；静态枚举对齐 ≠ GUI PASS。owner：后端枚举/字段归 data，选项/分组显示归 records 分片。

## 0. 路线原文（B6 §122，PM工作台新版实施路线图-20261020.md）

> “New report-type 枚举（U5）、deliverable.milestoneId 关联、note 字段。”

三项均为 **B6 路线内新增实现项（implementation）**，非待用户决策、不得隐形 out-of-route。

## 1. U5 具体化：report-type 枚举（实体/字段/现值/目标）

| 项 | 值 |
|---|---|
| 实体 | `progressReportRecord`（`core/progress-report.ts:108`） |
| 字段 | `sourceType`（`progress-report.ts:117`），现 `z.literal('manual')` 单一字面量；伴生 `sourceSessionId: z.null()`（L118） |
| 当前 backend | 仅 manual；generate（L126-144）不接受其它来源；无枚举 |
| 目标实现（data） | `sourceType` 由 literal 扩为 `z.enum([...])`（manual 及其余 report-type，取值以 data 定并写回合同）；非 manual 时填 `sourceSessionId`（对齐 `meetingSourceTypeSchema = z.enum(['manual','session'])`，`core/meeting.ts:11` 的既有模式）；manual 保持默认与现行为兼容；旧记录缺键不回填 |
| 验收 | 非法 sourceType 拒绝零写；manual 生成路径行为不变；枚举值在 records 表单只读/选择器与 core 真源同源，不另造状态词 |

## 2. UI↔backend 枚举对齐核查（records-options.ts / 视图 vs core schema）

| 域 | backend schema（core） | UI 选项/分组（records） | 缺口判定 |
|---|---|---|---|
| 会议状态 | `meetingStatusSchema = draft\|final`（meeting.ts:9） | MEETING_STATUS_OPTIONS draft/final（records-options.ts:23-26） | 对齐，无缺口 |
| 会议行动项 | `meetingActionStatusSchema = todo\|in_progress\|done\|cancelled`（meeting.ts:10） | MEETING_ACTION_STATUS_OPTIONS 四项（:28-33） | 对齐，无缺口 |
| 汇报状态 | `progressReportStatusSchema = draft\|final`（progress-report.ts:9） | REPORT_STATUS_OPTIONS draft/final（:35-38） | 对齐（**注意：这是 report status，不等于 U5 的 sourceType/report-type**） |
| 交付物状态 | `deliverableStatusSchema = planned\|in_progress\|submitted\|accepted\|wrapped`（deliverable.ts:12，**5 值含 wrapped**） | 表单 DELIVERABLE_STATUS_OPTIONS 仅 4 值，**无 wrapped**（:40-45）；视图 STATUS_ORDER=`[accepted,submitted,in_progress,planned]`（deliverables.tsx:47）**也无 wrapped** | **GAP-R1** |

### GAP-R1（开给 records 分片 / data 知会）
- 现象：backend 允许 `wrapped`（人显式收尾、非正式验收），但①表单选择器不提供（records-options.ts:12-13 注释明确“表单选择器不提供”，写入口有意省略，可接受）；②**视图分组 STATUS_ORDER 也不含 wrapped**，已存在于库中的 wrapped 交付物不落任何分组，静默丢失展示。
- 要求：视图层至少把 wrapped 作为只读分组/标签呈现（写入口可不提供），不得让 wrapped 记录在列表中无归属；若决定本批不展示，须在 mapping 显式标注 out-of-route 并说明，禁止隐形丢弃。
- 验收：造一条 wrapped 交付物，列表可见其状态与归属，不被过滤；表单仍不提供写 wrapped。

## 3. B6 New 字段缺口（backend 未实现，开给 data）

| 路线项 | 现 schema 事实 | 缺口 |
|---|---|---|
| `deliverable.milestoneId` 关联 | deliverableRecordSchema（deliverable.ts:43-50）无 milestoneId 键；create/update schema（:53-83）也无 | 待加可选关联字段 + 校验目标里程碑存在/同项目 + 软删可恢复；records 表单/视图再接 |
| `note` 字段 | 仅 history 内 `changeNote`（留痕，非业务列）+ `description`；无独立 note 业务列 | 待明确 note 语义（独立备注列 vs 复用 description），定后扩 schema + 迁移兼容旧记录 |

## 4. 边界
- 以上为后端合同/枚举/字段与 records 选项对齐的静态缺口；UI panel 接入、selectedRefs 全量复测、GUI 采证仍 NOT_RUN，待 panel 集成后 QA 复测 API full，不当 G PASS。
- 不改上游 deepseek-harness，不改业务源码。

## 5. 复跑关闭（2026-10-20 独立）
- **U5 已实现关闭（仅限 report 后端）**：`progressReportSourceTypeSchema = z.enum(['manual','session'])`（progress-report.ts:13），record/generate schema 对齐；refine 强制 session 必带非空 sourceSessionId、manual 必为 null，互不混用；progress-report.test.ts 12 例 PASS。
- 范围边界：U5 本轮只覆盖 report 后端枚举；**deliverable.milestoneId 关联 / note 字段的 UI（records 表单/视图）未覆盖，精确合同 pending**，待合同到位后 targeted 复测，不计入 U5 关闭。
- 仍 open：GAP-R1 交付物 wrapped 视图分组缺；deliverable.milestoneId 关联、note 字段（§3）仍待 data 实现；records panel/selectedRefs 全量复测 NOT_RUN。

## 6. 待后端 gaps 1-4 / front 集成后 targeted（冻结 backlog，现不跑）
精确合同已收到；QA 等后端补齐 + front 集成稳定后，再做 targeted（不 full rerun）：
1. legacy reports 缺 source（sourceType/sourceSessionId）补更新口径。
2. exports 导出对 sourceType/session 字段的携带与一致性。
3. 表单条件渲染（forms conditional）按 sourceType/状态条件显隐。
4. deliverable.milestoneId 跨项目拒绝 + note 字段（§3）：校验里程碑存在/同项目、软删可恢复，records 表单/视图再接。
- 验收口径：上述逐项 targeted 断言；未稳定前不重跑 full。
- 待后端 legacy/export/help 就绪后，独立 targeted 跑完整 U5；并补 UI 测试：source 条件渲染（sourceType/session 条件显隐）、milestone 清空（milestoneId clear 交互）、note 安全 markdown（转义、禁裸 HTML/注入）、note 可被搜索。front（records 两端）已完成，仅待后端补齐后复测。

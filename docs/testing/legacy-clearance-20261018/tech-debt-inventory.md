# 技术债清点表（只读盘点 · 2026-10-18）

> 范围：`packages/dsh-pm-tool/src`、`packages/dsh-pm-tool/scripts`、仓库根遗留物。
> 本批**只读**：未 build、未 test、未写业务文件、未 git 提交；唯一落盘即本表。
> 方法：导出/导入符号引用计数（人工复核）+ 文档在册项逐条对账 + git status / git ls-files / git check-ignore 判定归属。
> 风险级别说明：高=影响数据写路径或线上 UI 渲染；中=口径漂移/维护成本；低=死码/注释/本地杂物，不影响运行。

## 一、历史技术债复核结论（动作 1）

| 历史项 | 结论 | 依据 |
|---|---|---|
| a) 状态枚举 / nextStatus 状态轮转死码 | **已消除** | `src` 全量 grep 无 `nextStatus`、无旧状态字面量 `doing`；`core/status.ts:2` 枚举仅 `todo/in_progress/blocked/done` 四成员且全部被消费（task.ts zod、copilot.ts 白名单、war-room 谓词、task-inline 转发）。仅 `scripts/verify-task-inline.mjs:4` 以注释形式说明「旧 nextStatus 状态轮转已移除，不再测」，非代码残留。 |
| b) 重复 clamp | **部分存在（轻微）** | 存在两个同名 `clampProgress`，但语义有意区分（见新债 #5）；真正可合并的重复是 `task-inline.ts:23-29` `parseProgressInput` 第 28 行与 `clampProgress`（:12-16）重复同一 round+0..100 钳制体。其余内联 clamp（健康分/比例/列表索引）为领域专属，非重复。 |
| c) 甘特依赖连线重叠缺陷 | **已消除 / 无在册 OPEN** | `core/gantt.ts:289 routeEdge` 已实现「严重重叠大 U 绕行（overlap）+ 轻度重叠小凹形（overlap-tight）+ 同前置多线 lane 错峰（laneStep）」，并有专属单测 `src/core/gantt.routeEdge.test.ts`；`docs/optimization-backlog.md`、`issues-and-solutions.md`、`decision-log.md`、`handoff.md` 均无登记在册的 OPEN 连线重叠缺陷。 |
| d) 在册 OPEN / MANUAL_PENDING 项 | **均非源码债** | 剩余在册待办全部为仓库外/人工项：prod 真实 Key（M-01/A5，所有者配 Key）、vendored skills 中 grill-me/tdd/diagnosing-bugs 三份试点报告 NOT_RUN（毕业流程）、真实模型实机限流目视、OPT-09 真实键盘手感目视。GI-WEB-14 真 390px 窄窗已由 #25 / ADL-053 修复。源码内无对应未清缺陷。 |

## 二、新债全量清单（动作 2）

### A. 死代码 · 未渲染组件（panel.tsx 旧面板遗留，views/ 已接管）

| 位置(file:line) | 类型 | 证据 | 建议动作 | 风险 |
|---|---|---|---|---|
| `src/client/panel.tsx:1686` `BoardPeopleSection` | 死代码 | 定义仅包裹 `CrossProjectPeople`，全文件 JSX 引用 0 次 | 删（确认 CrossProjectPeople 他处仍用） | 低 |
| `src/client/panel.tsx:1936` `BatchField` | 死代码 | 批量改 assignee/dueDate 旧表单字段，JSX 引用 0 次 | 删 | 低 |
| `src/client/panel.tsx:2028` `DeltaBadge` | 死代码 | 汇报相邻对比徽标，已由 reports 视图接管，JSX 引用 0 | 删 | 低 |
| `src/client/panel.tsx:2035` `TableToolbar` | 死代码 | 旧表工具栏（新增按钮+搜索），JSX 引用 0 | 删 | 低 |
| `src/client/panel.tsx:2058` `StatusTag` | 死代码 | 旧状态标签，集中消费各 label map，JSX 引用 0（label map 本身仍被表单 select 使用，删本组件不孤立 map） | 删 | 低 |
| `src/client/panel.tsx:2077` `Progress` | 死代码 | 旧进度单元格（证据不足/百分比条），JSX 引用 0 | 删 | 低 |
| `src/client/panel.tsx:2086` `TableEmpty` | 死代码 | 旧空态占位，JSX 引用 0 | 删 | 低 |

### B. 死代码 · 未使用导入（panel.tsx，视图迁移后残留）

| 位置(file:line) | 类型 | 证据 | 建议动作 | 风险 |
|---|---|---|---|---|
| `panel.tsx:1` `panelKeyboard, fromKeyboardEvent` | 死导入 | 仅 import 行出现，无调用 | 删导入 | 低 |
| `panel.tsx:6` `buildUpdate`（同块 writeClampProgress/parseProgressInput 在用） | 死导入 | 仅 import 行 | 删 buildUpdate | 低 |
| `panel.tsx:8` `diffAgainstPrevious` | 死导入 | 仅 import 行 | 删 | 低 |
| `panel.tsx:9` `computeKPI, buildAgenda, groupRiskMatrix` | 死导入 | 已由 overview/war-room 视图接管，仅 import 行 | 删 | 低 |
| `panel.tsx:10` `scoreFromInputs(healthFromInputs), blockingPredecessors`（同块 localTodayIso/isTaskOverdue 在用） | 死导入 | 仅 import 行；这两个函数在 views/overview.tsx、views/tasks.tsx 仍活跃，勿删源 | 仅删 panel 导入 | 低 |
| `panel.tsx:17-21` 整组 gantt 函数（dateRange/shiftDatesByDrag/barGeometry/todayOffset/daysFrom/progressFill/barLabelPolicy/shortDate/dependencyEdges/parentBarRange/milestoneOffset/taskDurationDays） | 死导入 | 甘特已迁至 views/gantt.tsx，panel 内 0 调用 | 删整组导入 | 低 |
| `panel.tsx:23` `parseCopilotActions`（同块 validateActions/parseCopilotPlan/validatePlan/forStepwiseApply 在用） | 死导入 | 仅 import 行 | 删 | 低 |
| `panel.tsx:24` `shouldHandleGlobalKbd, sampleGanttTicks, nextRowId`（同块 formatNoticeLines/extractBackupPath/parseActiveModelLane 在用） | 死导入 | 仅 import 行 | 删 | 低 |
| `panel.tsx:25` `diagnosisCounts`（同块 buildDiagnosis/DiagnosisBubble 在用） | 死导入 | 仅 import 行 | 删 | 低 |
| `panel.tsx:69` `setRowOpener`（同块 setPointerOpener/takeOpenerSpec/resolveDrawerFocusTarget 在用） | 死导入 | 仅 import 行 | 删 | 低 |

### C. 死代码 · core 未被引用的导出（src/scripts 均 0 调用）

| 位置(file:line) | 类型 | 证据 | 建议动作 | 风险 |
|---|---|---|---|---|
| `src/core/ask-copilot.ts:76` `askCopilot()` | 死代码 | `commands/ask.ts` 直接调 `generateDraft`，不经过此包装；仅定义处 | 删（或确认是否预留公共 API） | 低 |
| `src/core/settings.ts:148` `settingField(key)` | 死代码 | FIELD_MAP 内部自用，此查找包装无调用方 | 删 | 低 |
| `src/core/meetings.ts:228` `findMeetingActionByTask` | 死代码 | 任务来源会议直达在 panel 前端反查，不走此 core 函数；0 调用 | 删 | 低 |
| `src/core/meetings.ts:236` `findMeetingActionByRiskIssue` | 死代码 | 同上，0 调用 | 删 | 低 |
| `src/core/csv-import.ts:125` `readCsvFile(path)` | 死代码 | 无调用（读文件走命令层 fs / xlsx 通道） | 删 | 低 |
| `src/core/export.ts:74` `resolveExportPath(dir,file)` | 死代码 | 各导出函数内联 `resolve(expandDirectory(...),...)`，此包装 0 调用 | 删 | 低 |
| `src/core/model-route.ts:120` `effortLabel(effort)` | 死代码 | 思考档位人读标签，UI 未消费；0 调用 | 删（或接入模型 lane 文案） | 低 |
| `src/core/task-checklist.ts:29` `ChecklistValidationError` | 死代码 | 定义但从不 throw（同类其它 *Error 均有抛出点） | 删 | 低 |
| `src/client/board/formula-expr.ts:105` `FORMULA_HELP` | 死代码 | 公式帮助文案常量，无渲染/无引用 | 删 | 低 |
| `src/client/views/types.ts:68` `MilestoneStatus` 类型 | 死代码 | 仅定义；里程碑状态在各处内联比较，未引用此类型 | 删 | 低 |
| `src/core/task.ts:31` `ChecklistItem` 类型 | 死代码 | checklistItemSchema 直接使用，此 z.infer 别名 0 引用 | 删 | 低 |
| `src/core/provenance-store.ts:175` `appendUndoAudit` | 死代码 | F14 审计追加函数，无调用方（撤销审计走其它路径） | 删（先核对是否预留） | 低 |
| `src/core/backup.ts:34` `BackupTable` 类型 | 死代码 | BACKUP_TABLES 元组的 z 类型别名，0 引用 | 删 | 低 |
| `src/core/csv-import.ts:112` `planCsvImport` / `:117` `importTasksFromCsv` | 死代码 | 旧 CSV 字符串入口；现行走网格路径 `planGridCsvImport`/`importTasksFromGrid`（task.ts:376/387/493/503），此二者 0 调用 | 删 | 低 |
| `src/core/csv-import.ts:66` `parseCsvTasks` | 死代码（仅测试） | 生产 0 调用，仅 `task-inline.test.ts` 引用 | 随测试一并清理或保留为测试夹具 | 低 |

### D. 死代码 · 命令层未使用导入

| 位置(file:line) | 类型 | 证据 | 建议动作 | 风险 |
|---|---|---|---|---|
| `src/commands/stats.ts:8` `riskImpactLabels` | 死导入 | 仅 import 行 | 删 | 低 |
| `src/commands/task.ts:36` `planCsvImport, importTasksFromCsv` | 死导入 | 网格函数在用，这两个仅 import 行 | 删 | 低 |
| `src/index.ts:31` `modelHelp`（同块 handleModelCommand 在用） | 死导入 | 仅 import 行 | 删 | 低 |

### E. 重复 · 中文状态标签字典多处拷贝

| 位置(file:line) | 类型 | 证据 | 建议动作 | 风险 |
|---|---|---|---|---|
| `panel.tsx:292-298` projectStatus；`views/overview.tsx:31-37` PROJECT_STATUS_LABEL；`board/widgets.tsx:257-259` projectStatusLabel | 重复 | 三份均拷贝 `core/project.ts:8 projectStatusLabels`（planning/active/paused/done/archived），改枚举需多处同步 | 改为从 core 导入单一来源 | 中（口径漂移） |
| `panel.tsx:299-304` taskStatus；`views/overview.tsx:39-44` TASK_STATUS_LABEL；`views/tasks.tsx:54-59` taskStatus | 重复 | 三份拷贝 `core/status.ts:4 taskStatusLabels`（todo/in_progress/blocked/done） | 改为从 core 导入 | 中（口径漂移） |
| `panel.tsx:305-310` milestoneStatus；`views/overview.tsx:46-51` MILESTONE_STATUS_LABEL | 重复 | 拷贝 `core/milestone.ts:11 milestoneStatusLabels`（planned/at_risk/achieved/missed） | 改为从 core 导入 | 中 |
| `panel.tsx:324-326` deliverableStatus | 重复 | 拷贝 `core/deliverable.ts:12 deliverableStatusLabels`（planned/in_progress/submitted/accepted） | 改为从 core 导入 | 中 |
| `task-inline.ts:23-29` `parseProgressInput` 钳制体 vs `:12-16` `clampProgress` | 重复 | 两段均做 Number→非有限判 0→round→0..100，仅空串/空值前置处理不同；可让 parseProgressInput 复用 clampProgress | 重构复用 | 低 |

### F. 重复 · 甘特日期钳制内联多处

| 位置(file:line) | 类型 | 证据 | 建议动作 | 风险 |
|---|---|---|---|---|
| `views/gantt.tsx:185,189,208,213,250` | 重复 | 「开始不得晚于截止 / 截止不得早于开始」钳制在指针预览、提交、键盘 Shift 三处各写一遍同义 if | 抽纯函数 `clampRange(start,due)` 复用 | 低 |

### G. 过时注释

| 位置(file:line) | 类型 | 证据 | 建议动作 | 风险 |
|---|---|---|---|---|
| `views/gantt.tsx:6-7` | 过时注释 | 称「与 panel.tsx 旧 GanttView 并存…不污染旧实现」，但 panel.tsx 已无旧 GanttView（仅 import views/gantt.js），并存前提消失 | 更新/删除注释 | 低 |

### H. 仓库根 / 本地遗留物（gitignore 已覆盖，非入库物）

| 位置 | 类型 | 证据（git 归属） | 建议动作 | 风险 |
|---|---|---|---|---|
| `verify-run-20261012-152121/`（目录）+ `verify-run-20261012-152121.tar.gz`（54 KB） | 遗留物 | `git ls-files` 0 命中；`git check-ignore` 命中；.gitignore「回归验证运行产物 verify-run-*/ 不入库、不删除（本地留存证据）」策略 | 保留（策略性留存）；所有者确认无需归档后可手动清 | 低（不影响仓库） |
| `.tmp/`（195 项工作 scratch） | 遗留物 | gitignore `!! .tmp/` 忽略；含多轮 worktree 副本 | 保留，可按需清空 | 低 |
| `data/`、`exports/`、`packages/backups/`（80+ 本地备份 JSON） | 运行时/备份 | gitignore 忽略（data/、exports/、backups/），非数据源 | 保留，勿入库 | 低 |
| `scripts/gen-valid-backup-fixture.mjs` | 非遗留物 | 位于 scripts/（非根目录），tracked，R3 fixture 生成器，被备份校验链路使用 | 保留 | — |
| `scripts/e2e-web-real.mjs` | 冗余候选（手动） | 旧手动 GUI E2E（OPT-12/08/03），未进 CI；#24 `e2e.mjs` 为确定性自动门但不覆盖其 GUI 点击 | 保留为手动脚本，标注不进自动门 | 低 |

### I. 冗余 / 脱节 verify 脚本

- **未发现**与 src 契约脱节的 verify 脚本：77 个 `verify-*.mjs` 全部被 `verify-isolation.mjs:135` 的目录 glob 纳入（仅 `verify-real-model.mjs` 按 ADL-056 显式排除为手动出网 smoke，属设计）。全量 grep 无 `progressRatio`/`nextStatus` 等已删符号残留（仅 1 处历史注释）。

### J. TODO / FIXME / HACK / XXX

- **无活跃项**：src 全量扫描无 TODO/FIXME/HACK/XXX/@deprecated；现存「旧版/legacy」字样均为说明性历史注释（如 legacyProgress 旁注口径），非待办标记。

## 三、清理建议排序（先易后难 / 先低风险）

1. **删死导入（最低风险，纯删 import 行）**：panel.tsx B 组 10 处 + stats.ts:8 / task.ts:36 / index.ts:31。
2. **删 panel.tsx 7 个死组件（A 组）**：删后顺带核对对应 CSS 类（.pm-batch-field-wrap/.pm-delta/.pm-table-toolbar/.pm-tag/.pm-progress-cell/.pm-table-empty）是否成孤儿，按需清 CSS。
3. **删 core C 组无调用导出**：按表逐个删，删前对每个符号再做一次全仓（含 scripts/lib）引用确认；`askCopilot`/`appendUndoAudit`/`BackupTable` 等先判断是否预留公共 API。
4. **标签字典单一来源（E 组，中风险）**：panel/overview/tasks/widgets 改为从 core 各 `*Labels` 导入，消除三处拷贝；改后跑 verify-isolation + 浅深目视。
5. **抽 `clampRange`（F 组）+ parseProgressInput 复用 clampProgress（E 末行）**：纯函数重构，补/跑既有单测。
6. **修过时注释（G）**：成本极低，随手改。
7. **本地遗留物（H）**：不动仓库；仅由所有者决定是否手动清 `verify-run-20261012-152121*` 与 `.tmp/`。

> 备注：本批未启用 `noUnusedLocals`，扫描外可能仍有少量仅类型位的未使用 import（core 各实体仓库文件居多），建议清理时在 tsconfig 开启该选项做一轮机扫兜底，本清单未逐项担保此类。

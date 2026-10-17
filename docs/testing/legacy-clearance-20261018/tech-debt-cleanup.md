# 技术债清理执行记录（第 4 个 commit）

> 依据 `tech-debt-inventory.md` 执行；只读盘点已完成，本阶段只删/改清单中已证明死的项。
> 门禁：`pnpm run build`（退出 0）、`pnpm vitest run`（209 通过 / 18 文件）、`pnpm run verify:isolation-only`（2/2 通过，172 文件零污染）。
> 实例：3172 重启后保持运行，token 见文末。

## 1. 删/改项逐条（位置 → 证据 → 动作 → 门禁/冒烟）

### A. panel.tsx 死导入删除（清单 B 组）
| 位置 | 证据（删除前引用计数=1，仅 import 行） | 动作 |
|---|---|---|
| `client/panel.tsx:1` `panelKeyboard, fromKeyboardEvent` | 仅 import 行，无调用 | 删整行导入 |
| `panel.tsx:6` `buildUpdate` | 仅 import 行（同块 writeClampProgress/parseProgressInput 在用，保留） | 删 buildUpdate |
| `panel.tsx:8` `diffAgainstPrevious` | 仅 import 行 | 删整行 |
| `panel.tsx:9` `computeKPI, buildAgenda, groupRiskMatrix` | 仅 import 行（已由 overview/war-room 视图接管） | 删整行 |
| `panel.tsx:10` `healthFromInputs(scoreFromInputs), blockingPredecessors` | 仅 import 行（二者在 views/overview.tsx、views/tasks.tsx 仍活跃，勿删源；同块 localTodayIso/isTaskOverdue 保留） | 仅删这两个 |
| `panel.tsx:17-21` gantt 整组（dateRange/shiftDatesByDrag/barGeometry/todayOffset/daysFrom/progressFill/barLabelPolicy/shortDate/dependencyEdges/parentBarRange/milestoneOffset/taskDurationDays） | 仅 import 行，甘特已迁至 views/gantt.tsx | 删整组 |
| `panel.tsx:23` `parseCopilotActions` | 仅 import 行（同块 validateActions 等保留） | 删 |
| `panel.tsx:24` `shouldHandleGlobalKbd, sampleGanttTicks, nextRowId` | 仅 import 行（同块 formatNoticeLines/extractBackupPath/parseActiveModelLane 保留） | 删 |
| `panel.tsx:25` `diagnosisCounts` | 仅 import 行（buildDiagnosis/DiagnosisBubble 保留） | 删 |
| `panel.tsx:69` `setRowOpener` | 仅 import 行（setPointerOpener/takeOpenerSpec/resolveDrawerFocusTarget 保留） | 删 |

### B. panel.tsx 死组件删除（清单 A 组，均 JSX 引用 0）
| 位置 | 证据 | 动作 |
|---|---|---|
| `panel.tsx:1686` `BoardPeopleSection` | 仅包裹 CrossProjectPeople（后者在 panel.tsx:1509 导出、被 board/BoardBento.tsx:183 使用，保留） | 删包装组件 |
| `panel.tsx:1936` `BatchField` | 旧批量改 assignee/dueDate 表单，JSX 0 | 删 |
| `panel.tsx:2028` `DeltaBadge` | PROD-09 相邻周期徽标，已由汇报视图接管，JSX 0 | 删 |
| `panel.tsx:2035` `TableToolbar` | 旧表工具栏，JSX 0 | 删 |
| `panel.tsx:2058` `StatusTag` | 旧状态标签，JSX 0（各 label map 仍被表单 select 使用，未孤立） | 删 |
| `panel.tsx:2077` `Progress` | 旧进度单元格，JSX 0 | 删 |
| `panel.tsx:2086` `TableEmpty` | 旧空态，JSX 0 | 删 |

### C. core / 命令层死导出、死导入删除（清单 C/D 组；删前 src+scripts 非定义引用=0）
| 位置 | 证据 | 动作 |
|---|---|---|
| `core/ask-copilot.ts:76` `askCopilot`（连带仅被它使用的 `AskResult` 接口、generateDraft/LlmGateway/ModelRoute/parseCopilotActions/validateActions/CopilotAction 导入） | ask.ts 直接用 generateDraft，不经此包装 | 删函数 + 连带死导入/接口 |
| `core/settings.ts:148` `settingField`（连带仅它使用的 FIELD_MAP） | 0 调用 | 删 |
| `core/meetings.ts:228` `findMeetingActionByTask` | 0 调用（前端直达在 panel 反查） | 删 |
| `core/meetings.ts:236` `findMeetingActionByRiskIssue` | 0 调用 | 删 |
| `core/csv-import.ts:112` `planCsvImport` | 0 调用（现走网格 planGridCsvImport） | 删 |
| `core/csv-import.ts:117` `importTasksFromCsv` | 0 调用（现走 importTasksFromGrid） | 删 |
| `core/csv-import.ts:125` `readCsvFile`（连带 node:fs readFileSync 导入） | 0 调用 | 删 |
| `core/export.ts:74` `resolveExportPath` | 0 调用（各导出函数内联 resolve） | 删 |
| `core/model-route.ts:120` `effortLabel` | 0 调用 | 删 |
| `core/task-checklist.ts:29` `ChecklistValidationError` | 定义但从不 throw | 删 |
| `client/board/formula-expr.ts:105` `FORMULA_HELP` | 0 引用 | 删 |
| `client/views/types.ts:68` `MilestoneStatus` 类型 | 0 引用 | 删 |
| `core/task.ts:31` `ChecklistItem` 类型别名 | 0 引用（checklistItemSchema 直接用） | 删 |
| `core/provenance-store.ts:175` `appendUndoAudit` | 0 调用 | 删 |
| `core/backup.ts:34` `BackupTable` 类型 | 0 引用（BACKUP_TABLES 元组保留） | 删 |
| `commands/stats.ts:8` `riskImpactLabels` 导入 | 仅 import 行 | 删导入（core/risk-issue.ts 导出本身被 commands/risk-issue.ts 使用，保留） |
| `commands/task.ts:36` `planCsvImport, importTasksFromCsv` 导入 | 仅 import 行（网格函数保留） | 删导入 |
| `index.ts:31` `modelHelp` 导入 | 仅 import 行（commands/model.ts 内 modelHelp 自用，导出保留） | 删导入 |

### D. 标签单一来源（清单 E 组，中风险；渲染文案逐字不变）
- 新增 zod-free `core/labels.ts`：projectStatusLabels / taskStatusLabels / milestoneStatusLabels / deliverableStatusLabels 单一来源。
- `core/project.ts`、`core/milestone.ts`、`core/deliverable.ts`、`core/status.ts` 删除本地重复字典，改为从 `./labels.js` 再导出（兼容既有服务端引用）。
- 客户端 `panel.tsx`、`views/overview.tsx`、`views/tasks.tsx`、`board/widgets.tsx` 改为从 `core/labels.js` 导入；调用点不动，仅把字面量联合键 Record 转 `Record<string,string>` 视图以兼容 string 索引。
- **关键修复**：直接从 zod 实体模块（project/milestone/deliverable）引标签会把 zod schema 打进入口包，rolldown 抽出共享 zod 静态块 `client.schemas.js`，入口同步 `require` 命中宿主模块表缺失导致 web boot 失败；抽到 zod-free labels.ts 后入口同步 schemas 依赖归零（build 后 `grep -c "require('./client.schemas.js')" lib/client.js` = 0）。

### E. 小重复重构（清单 F + parseProgressInput）
| 位置 | 动作 |
|---|---|
| `views/gantt.tsx` 5 处内联日期钳制（预览 start/end、提交 start/end、Shift+←/→） | 抽 `clampStart(start,due)` / `clampDue(due,start)` 两个纯函数，5 处改调用 |
| `core/task-inline.ts:23` `parseProgressInput` 钳制体 | 复用 `clampProgress(n)`，不再重复 round+0..100 |

### F. 过时注释
| 位置 | 动作 |
|---|---|
| `views/gantt.tsx:6-7`「与 panel.tsx 旧 GanttView 并存/不污染旧实现」 | 并存前提已消失，删除该句（保留自包含样式说明） |

## 2. 保留 + 理由（未删）
- `core/csv-import.ts:66 parseCsvTasks`：生产 0 调用，但被 `task-inline.test.ts` 引用（测试夹具），保留避免改测试。
- `core/risk-issue.ts riskImpactLabels`、`commands/model.ts modelHelp`：导出在各自命令文件内自用，仅删除了别处的死导入，本体保留。
- panel 本地 `riskIssueStatus / riskIssueType / probabilityLabels / impactLabels / meetingStatus / meetingActionStatus / progressReportStatus`：core 无对应单一来源，保留。
- 仓库根 `verify-run-20261012-152121*`、`.tmp/`、`data/`、`exports/`、`packages/backups/`：gitignore 已覆盖的本地留存/运行时物，按要求**不删除、仅登记**。
- `scripts/e2e-web-real.mjs`：旧手动 GUI 脚本，被 #24 e2e.mjs 取代但仍覆盖其 GUI 点击，保留为手动门。
- 77 个 verify 脚本：全部被 runner glob 纳入，无脱节/无已删符号残留，未改动。

## 3. 门禁结果
- `pnpm run build`：退出 0（tsc + tsdown 成功，8 产物）。
- `pnpm vitest run`：18 文件 / 209 测试全绿。
- `pnpm run verify:isolation-only`：2/2 通过；before=172 after=172，污染 0。

## 4. 冒烟（3172 实例）
- 宿主 web boot 0 错误（修掉 zod 静态块同步 require 后恢复）。
- 「项目管理」面板挂载；全部任务视图渲染 22 任务行；任务状态标签 未开始/进行中/受阻/已完成 逐字呈现。
- 项目概览：计划中/进行中/已完成/已达成；里程碑视图：计划中/有风险/已达成；与 core 文案一致。
- 控制台 0 error；截图留证 `task-view-smoke.png`。
- 抽屉 Tab：标题点击打开抽屉在本自动化会话无可达 ref，未强制触发（不影响上述渲染/标签结论）。

## 5. 实例
- 重启后保持运行（node pid 见进程表），日志 `/tmp/dsh-p2-iso-3172.log`。
- 最新 token：`8dw0cHn5oIW1Eca62s21yUCDgUIatbUp2Z0-iDwM-YQ`

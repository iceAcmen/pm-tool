# B6 records · panel↔分片 props 命令映射（前端 owner 冻结）

> 类型来源：`src/client/shared/records-props.ts`（records 组件 `import type { ... } from '../shared/records-props.js'`）。
> 命令行由 panel 实现并注入回调；records 只调回调、不拼命令、不 localmock 写。
> 现状命令在 panel.tsx 既有抽屉（MeetingForm / ReportForm / DeliverableForm），下方为对账口径。

## Meetings（meeting*）

| 回调 | 命令 | payload 口径 |
|---|---|---|
| onSaveMeeting(new) | `meeting add {projectId, ...MeetingPayload}` | title/meetingDate/startTime?/durationMinutes?/location/facilitator/recorder/participants[]/status(draft\|final)/summary/topics[]/decisions[]/notes |
| onSaveMeeting(edit) | `meeting update {meetingId} {MeetingPayload}` | 同上 |
| onDeleteMeeting | `meeting delete {meetingId} confirm` | — |
| onSaveAction(new) | `meeting action add {meetingId} {MeetingActionPayload}` | title/owner/dueDate?/status(todo\|in_progress\|done\|cancelled)/taskId?/riskIssueId? |
| onSaveAction(edit) | `meeting action update {meetingId} {actionId} {MeetingActionPayload}` | 同上 |
| onPromoteAction | `meeting action promote {meetingId} {actionId} confirm` | 已转后显示「已转」，重复点击不再建任务 |
| onDeleteAction | `meeting action delete {meetingId} {actionId} confirm` | — |

## Reports（report*）

| 回调 | 命令 | payload 口径 |
|---|---|---|
| onGeneratePeriod | `report generate {projectId} {periodStart} {periodEnd} {ReportPayload}` | title?（留空自动）/status(draft\|final)/executiveSummary/completedWork[]/nextPlans[]/blockers[]；周期在命令位，不进 payload；另带复合 `selectedRefs:[{taskId,entryId,revisionId?}]` 原样透传，不裸 pl-N、不丢版本 |
| onUpdateReport | `report update {reportId} {ReportPayload}` | 周期 periodStart/periodEnd 编辑态禁用、不可改 |
| onDeleteReport | `report delete {reportId} confirm` | — |
| onExportReport | `report export {reportId}` | 导出 Markdown，fire-and-forget |
| onPreviewPeriod | data B6 dry-run（可选） | 返回候选三元组 `{taskId,entryId,revisionId?,author,date,content,refs,taskTitle?}`；未传 selector=all；源已变后端报 error 零写，须重预览，不 drop revisionId |
| onSnapshotSelection | data sourceExcerpt（可选） | P3 摘录 freeze 选复合 `selectedRefs`（取代旧 selectedEntryIds）；不做 report revisions/restore |

## Deliverables（deliverable*）

| 回调 | 命令 | payload 口径 |
|---|---|---|
| onSaveDeliverable(new) | `deliverable add {projectId, ...DeliverablePayload}` | name/version/owner/status(planned\|in_progress\|submitted\|accepted)/location/description/dueDate?/changeNote?/repoUrl/branch（清空传 ''） |
| onSaveDeliverable(edit) | `deliverable update {deliverableId} {DeliverablePayload}` | 同上；状态+changeNote 写留痕 |
| onViewStatusHistory | 只读 `deliverable.history` | field=created\|status\|version，from→to，by，at，note；无独立 status 命令 |
| onDeleteDeliverable | `deliverable delete {deliverableId} confirm` | 只删登记，不删本地文件 |

## 接线约定

- panel 在 records 视图挂载处注入 `RecordsPanelCallbacks`；分片只消费 props，不直接调 `run`，不并写 panel.tsx。
- 写成功 → 回调内刷新快照并调 `onSaved()`；失败保留输入、走壳层 error/stale 原语。
- 待 data 的两个可选回调缺失时，records 以视觉 selector + 本地 derived 只读呈现，禁用写入口不得伪装可点。

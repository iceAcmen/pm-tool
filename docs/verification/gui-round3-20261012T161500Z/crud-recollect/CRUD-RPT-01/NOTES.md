# CRUD-RPT-01 — 快照报告（不判 PASS）

实际 ID **rpt-0003**。

- 生成动作：进度汇报 tab →「生成快照」→ 抽屉填周期 2026-10-01~2026-10-12、title「R3T快照汇报」→「生成固定快照」
- 生成 JSON：snapshot 完整（tasks total=17、milestones 1/1、meetings inPeriod=3/decisions=2、periodMilestones、periodMeetings、exceptions）
- **stage 顺序注意**：before 基线在生成后才采（含 rpt-0003 初始态），create-vs-before diff 因此不成立；create 产物 rpt-0003.json 已完整落盘保存
- edit vs before contentModified=1：title R3T快照汇报→R3T快照汇报-改、executiveSummary ""→"R3T执行摘要"（period 字段 disabled 不可改）
- 原生 confirm: "删除进度汇报 R3T快照汇报-改？"
- cancel vs edit cancellationUnchanged=true
- delete vs edit deleted=[rpt-0003.json]；ls reports/ 只剩 rpt-0001/rpt-0002；toast"进度汇报已删除 rpt-0003"

# CRUD-RISK-01 — 全生命周期采证完成（不判 PASS）

环境：3091 PID 45417；lib/client.js a3ba4f39；data-root .tmp/e2e-3082/data；console 窗口 0 起。
实际 ID：**ri-0002**。

阶段与采集器输出：
- before：27 JSON 基线
- create vs before：added=1（ri-0002.json）；JSON 落盘 type=risk, title=R3T-Risk, probability=high, impact=high, status=open
- edit vs create：contentModified=1；title→R3T-Risk-改、status open→closed（JSON 实测确认）
- cancel vs edit：cancellationUnchanged=true（added=0 contentModified=0 touchOnly=0 deleted=0, 28 unchanged）→ 取消保护干净
- delete vs edit：deleted=[pmtool/risk_issues/ri-0002.json]，27 不变；ls 证明 risk_issues/ 只剩 ri-0001.json；toast"风险已删除 ri-0002"

截图：shots/delete-confirmed-<ts>.png（看图：toast + 风险列表回到 1 条）。

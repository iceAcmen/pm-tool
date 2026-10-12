# CRUD-DLV-01 — 全生命周期采证完成（不判 PASS）

实际 ID **dlv-0002**。

阶段：
- before 27 基线；create vs before added=1（dlv-0002.json，version=v1.0，history[0]=created）
- edit vs create contentModified=1：version v1.0→v1.1，变更注"R3T变更说明"；**history 数组 2 条快照完整**（created + version v1.0→v1.1）
- cancel vs edit cancellationUnchanged=true
- delete vs edit deleted=[dlv-0002.json]；ls 证明 deliverables/ 只剩 dlv-0001；toast"交付物已删除 dlv-0002"

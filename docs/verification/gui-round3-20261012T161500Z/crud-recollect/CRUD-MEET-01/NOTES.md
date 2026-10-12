# CRUD-MEET-01 — 全生命周期采证完成（不判 PASS）

实际 ID **mtg-0004**。

阶段：
- before 27 基线；create vs before added=1（mtg-0004.json）
- edit vs create contentModified=1：title→R3T-Meeting-改、status draft→final、summary 落盘"R3T正式纪要"；participants 数组保留
- cancel vs edit cancellationUnchanged=true
- delete vs edit deleted=[mtg-0004.json]；ls 证明 meetings/ 只剩 mtg-0001/2/3；toast"会议纪要已删除 mtg-0004"

注：create 时把文字填进了 participants 输入（非 notes），edit 阶段把摘要写入 summary 字段并保留了原 participants。

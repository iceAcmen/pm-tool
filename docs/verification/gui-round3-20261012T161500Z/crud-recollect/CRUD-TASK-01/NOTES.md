# CRUD-TASK-01 — 级联删除父子（不判 PASS）

实际 ID：父 **t-0018**（R3T父任务，parentId=null）、子 **t-0019**（R3T子任务，parentId=t-0018，code=9.1）。

阶段：
- before 27 基线；**旁支 t-0001 before SHA256 = de13650c1740171eca981f2375f1ac7634a7b55e554e4aa341b9875890bbe7b5**
- create vs before added=2（t-0018 + t-0019，关联 parentId 已落盘）
- 删父原生 confirm（accept=False 时 bu 原样返回 message）：
  > 任务「R3T父任务」含 1 个子任务。确定删除该任务及其全部 1 个子任务吗？旁支任务不受影响，此操作不可撤销。
- cancel vs create cancellationUnchanged=true；父子 hash 3123cd99/edd54856，旁支仍 de13650c
- delete vs cancel：ls tasks/ 证明 t-0018/t-0019 absent（只剩 t-0001~t-0017）；toast"已级联删除 2 个任务（9 及其 1 个后代）；旁支任务不受影响"；**旁支 t-0001 hash 仍 de13650c（全程不变）**

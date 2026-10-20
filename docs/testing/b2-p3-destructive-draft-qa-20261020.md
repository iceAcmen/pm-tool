# B2-P3 HARDFAIL：draft 整区替换重分配 ID / 塌缩修订 / 丢软删与历史 · QA 复现 · 2026-10-20

> QA 独立临时探针复现（跑完即删，未留仓库）+ 源码只读；**不改业务，开给 data owner 重做原子操作/stable IDs**。静态复现 ≠ GUI；此为后端数据完整性 hardfail，阻塞 B2 编辑区不得用当前 draft 路径。

## 1. 复现结果（隔离临时 domain，零正式数据）

种子：task `t-0001`；2 条 link 资料（at-1/at-2）；进展 pl-1（v1→编辑追加 v2，2 修订）后软删；pl-2 active（rev1）。随后 `commitTaskDraft` 把现有 active 数组当 draft 整区回传（mainform 编辑场景）。

| 项 | BEFORE | AFTER | 破坏 |
|---|---|---|---|
| 资料 ID | at-1, at-2 | **at-3, at-4** | P3-a 整批重分配，既有 at-ID 变号 |
| 软删 pl-1（2 修订） | 存在(deletedAt) | **消失（0 条软删）** | P3-b 软删条目+历史整段丢失 |
| active 进展 | pl-2/rev1 | **pl-3/rev1** | P3-c 条目 ID 重分配；pl-1 多修订历史不保留 |

三项同时命中：`ID 重分配=true / 软删历史丢失=true / 修订塌缩 rv-1=true`。

## 2. 根因（源码定位）

- `updateTask`（core/tasks.ts:230）携带 `draft` 时，`draft.attachments` → `normalizeAttachmentDrafts(..., existing=undefined, ...)`（:265），`draft.progressLog` → `normalizeProgressDrafts(..., existing=undefined, ...)`（:269），整体替换。
- `commitTaskDraft`（core/task-materials.ts:256）同样整区替换：先 normalize 全部 draft，再 `...record, attachments, progressLog` 覆盖（:279-283）。
- `normalizeAttachmentDrafts`（task-materials.ts:153-201）：`existing` 仅用于算 max，`out=[]` 只遍历 `drafts`，每条新发 `at-${++max}`（:174/187）；**既有项不保留、原 ID 不沿用**。
- `normalizeProgressDrafts`（:204-236）：`existing` 仅算 max，每条 draft 新发 `pl-${++max}` 且 `revisions:[{id:'rv-1',...}]`（:226-230）；**多修订历史/软删 deletedAt 不保留**。

## 3. 为何既有原子测试漏掉（P3 缺口）

此前 atomic 测试只在**初始空数组**上提交 draft（首次建区），从未对「已存在富数组（多修订、软删、历史、既有 at/pl ID）」做 round-trip 整区回传，故未暴露重分配/塌缩/丢失。属测试种子缺口，非行为已正确。

## 4. 对 data owner 的重做要求（redesign，QA 不修）

1. **stable IDs**：既有 attachment/progress 项的 at-N/pl-N 一经分配永不重排；整区替换不得改变既有项 ID。
2. **保留非提交区/既有事实**：未在 draft 中提交的项、软删项（deletedAt）、每条进展的完整 revisions 历史必须原样保留，不得塌缩为 rv-1。
3. **原子操作改为按项 diff/patch**（add/remove/edit/revise/softdelete/restore 逐条，沿用现有 material/progress 即时命令路径的稳定语义），避免「整数组整体替换」这一破坏性模型；同事务校验失败整体零写（现有 enqueueDomainWrite 临界区保留）。
4. 新增回归种子：带「多修订 + 软删 + 既有 ID」的富任务，round-trip 后断言 ID 不变、修订数不变、软删仍在、历史可回看。

## 5. Main GUI 护栏（本批必须遵守）

- **B2 mainform 编辑现有任务不得走当前 draft 整区替换路径**（会触发 P3-a/b/c）；编辑 basic 走 `task update` basic payload，资料/进展走现有逐条即时命令。
- 新建任务 raw draft（无既有数组）可接受，但 temp refs 悬空 gap 需显式标注（创建后 refs 指向未持久化 at-ID 的问题），不得冒充完整原子。

## 6. 边界

- 本 finding 为后端数据完整性 hardfail；GUI 200%/拖缩/取消零写快照比对仍 NOT_RUN，待 Main 隔离 candidate 采证。
- 不改上游、不改业务源码、不 commit。

## 7. 待 data owner ops 重做完成后，QA 独立复测（不重复 current 复现）

> 现处 HELD：ops 进行中，QA 不重复跑当前破坏性路径；ops 交付后按下列独立用例复测，全部通过方可解除 P3 blocker。

1. **富数组 round-trip 保持**：种子含「多修订进展 + 软删条目 + 既有 at/pl ID + alias/refs」；编辑提交后断言既有 at-N/pl-N ID 不变、每条 revisions 数与正文不变、软删 deletedAt 仍在、历史可回看，无 rv-1 塌缩、无变号。
2. **rollback 零写**：任一按项操作校验失败（重复链接/非法 URL/空作者正文/悬空 refs/跨项目交付物）→ 整批零写，已成功项不回滚、未成功项不落库，basic 原值保持。
3. **alias/refs 完整性**：进展 refs 只指向本任务当前 active at-N；别名/重排后引用不悬空、不错配；软删/恢复后 refs 仍可解析。
4. **新建 raw draft temp refs gap**：单独记录创建后临时 at-ID 悬空问题的处置（持久化后回填或显式拒绝），不冒充完整原子。
5. Preview route 安全测试（inject availability / same-origin auth·CSRF / max50·date schema / no-cache·nosniff / error 无栈无路径 / softdelete·跨项目·stale）另立，不在本 P3 复测内。

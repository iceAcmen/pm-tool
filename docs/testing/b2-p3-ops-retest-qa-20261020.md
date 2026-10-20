# B2-P3 ops 引擎独立复测（HELD 解除）· 2026-10-20

> data owner 重做原子 ops 信封后，QA 独立复测（不信作者 7 例）：纯引擎 vitest 7 + 真实 domain 探针 2，全 PASS；core tsc EXIT0。临时文件已删，未改业务、未启服务/GUI。

## 引擎定位
- `applyTaskDraftOps`（task-materials.ts:313）：克隆既有数组按序应用 attachmentOps/progressOps，全量校验后单次返回；`rejectRawAndOpsMixed`(:154)；updateTask（tasks.ts:267-282）拒绝 raw、强制 ops。

## 独立复测清单（P3 §7）结果

| # | 项 | 结果 | 证据 |
|---|---|---|---|
| Q1 | no-op：稳定 ID/修订/软删原样保留，不原地改基 | PASS | 空 ops 输出深等 base，pl-1 仍 2 修订 |
| Q2 | 混合成功：未提及项 stable ID/历史/deletedAt 不动；新项续号；edit 追加 rv-3；restore 清 deletedAt | PASS | at-1 原样；pl-1=rv1/rv2/rv3 首版不覆；pl-2 恢复；新 pl-3 refs→at-2 |
| Q3 | 前向 alias 解析真实 at-N；向后引用（clientId 在后）拒绝 | PASS | c-1→at-2；c-later 抛「引用」 |
| Q4 | raw+ops 同区互斥（attachments/attachmentOps、progressLog/progressOps）；空 draft 不抛 | PASS | TaskOpsError/互斥 |
| Q5 | 重复 url（撞既有）/跨项目交付物/重复 clientId | PASS | 各自抛错零写 |
| Q6 | refs 必须 active：未知 at-N 抛错；remove 后旧 ref 悬空抛错 | PASS | resolveRef 仅认现存 |
| Q7 | create 空基 ops+alias：addLink c-1→at-1，progress refs c-1 解析成功 | PASS | — |
| R1 | 真实 updateTask raw 数组进 draft → TaskOpsError，零写（attachments 未变） | PASS | 真实 domain 探针 |
| R2 | basic + 末尾坏 op → 整批抛错，basic title 不落、数组未变（invalid last op basic zero） | PASS | ProgressAuthorEmptyError，title/数组原样 |

## 作者测试独立复跑
- task-ops.test.ts 7 例 PASS（no-op/attachment/progress alias/delete-restore/互斥）。

## 残留 follow-up（非 mainform 阻塞，开给 data）
- `commitTaskDraft`（task-materials.ts:453）仍为 raw 整体替换语义，被 CLI `commands/material.ts:103` 调用；该 CLI draft 路径未迁 ops，富编辑仍会触发旧 P3 破坏（重分配/塌缩/丢软删）。**mainform 不得走此路径**；data owner 应将 CLI draft 迁 ops 或退役，避免旁路复用。
- 新建 raw draft temp refs 悬空 gap 仍单列（create 持久化后回填或显式拒绝）。

## 边界
- 本复测为后端引擎/真实 domain 零写；GUI 排序/取消零写快照、200%/拖缩仍 NOT_RUN，待 Main 隔离 candidate 采证。

# 成功信封接受与导入全行预检收口

父持续授权及独立 `docs/testing/a9-existing-entries-independent-retest-20261021.md` §4 是本批依据。A9-F01/F02是既有校验/反馈接缝，不扩事务或新功能。

1. Main认领 `core/ui-feedback.ts`/原测试：`commandAccepted` 复用已生效结构化信封解析/分类。已结构化success中的合法标题含“失败/错误/未找到”必须接受；裸真实拒绝仍false、preview仍只读接受，不改meeting保存链或用户标题。先同例红再修绿，交新独立复验I03组合及受影响反馈。
2. 导入开发仅认领 `core/csv-import.ts` 与对应测试，必要 `commands/task.ts` 只行错误呈现。preview/confirm共用当前字段映射及 `taskCreateSchema` 全行预检，发现可预校验坏日期/字段在首次addTask之前拒绝并标行。合法仍依次addTask树，不做I/O全文件事务、未知成功重试去重、历史半写删除、模板/U4。
3. Main已按独立A8-TW01局部合同在 `views/tasks.css` data段加wrap/max-width；动作及标签保全，真实390浅深工具条/长preview可达由专家再签，不隐藏横滚。
4. 所有新源各自独占，收束后Main唯一隔离同步/build，重新绑定产物/实例/开关。原A8/A9红及设施错保留，完整GUI/受影响回归/全部验证后统一普通commit，无push/tag/正式切换。

运行环境：macOS、nvm Node22、pnpm11.28.5。brainstorming/writing-plans按既有目的和最小合同执行，既有持续授权无需逐轮询问。

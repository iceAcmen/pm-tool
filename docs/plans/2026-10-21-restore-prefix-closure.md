# 恢复组合场景前缀最小修复

目标是关闭独立 GUI 确证 A8-RV02；沿父持续修复授权及 `docs/testing/a8-gui-supplement-independent-review-20261021-repair-contract.md`，不改恢复协议或成功分类。

- `src/core/ui-feedback.ts`：仅当调用场景为“恢复失败/备份失败”且下层确为“备份/恢复失败”前缀，保留原文；不正则清洗原因或多行正文。
- `src/core/ui-feedback.test.ts`：先红复现组合前缀与两种冒号、原因正文包含失败但须原样保留；修后原错误分类/成功信封/前缀用例全回归。
- `src/client/panel-restore-path.test.ts`：真实PmPanel收到三类型组合错误只显示一次前缀、保完整输入、无confirm。原空项目不渲染结果卡造成首设施失败保留；改合法项目fixture后同断言复测，不改产品展示分支。
- 新源/产物/运行重新认领，独立组件复验后Main逐种真实预检拒绝与关闭/复制接缝采证；旧A8FAIL不覆盖。样式toolbar28px原证另交专家定合同，不以本prefix修复掩盖溢出。

macOS、nvm Node22、pnpm11.28.5。最后完整回归/独立门及统一commit；无push/tag/正式切换。

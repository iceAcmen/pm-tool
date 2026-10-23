# 总览完成卡状态口径修复

依据 `docs/testing/a10-objective-gui-independent-review-20261021.md` A10-OP-G01，父授权为继续收口全部已实现未验完功能。仅修已有总览状态完成卡：F2十任务done2/wrapped1应20%，不能上卡30%下卡20%。不改变客观清单、人工双轨、权重、自动完成或其他功能。

文件级边界：`src/client/views/overview.tsx` 的该状态完成卡计数/比率与同页权威统计一致；必要小纯派生 helper及对应真实组件测试，必要CSS无新布局。共享 `core/war-room.ts` 旧口径需先核用途，不顺带全改上游模块。

步骤：原F2同源真实组件先红 → 最小修改 → 原F2与人工30/0/clear、清单100/50不掺状态完成率回归 → 独立SOURCE/AUTO复验 → Main新冻结/唯一build/实例/原截图上下卡及相关完整wrapped旅程。原A10FAIL保留；最终统一commit，不push/tag/切正式。

环境macOS、nvm Node22、pnpm11.28.5，独占源/私有缓存、Main唯一GUI/builder，专家不开发自己验收。

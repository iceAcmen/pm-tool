# 副驾重复错误前缀最小闭环计划

**Goal:** 关闭独立确证 S112-PREFIX-01，副驾错误原因完整保留、同场景前缀只出现一次。

**Architecture:** 复用已生效 `prefixFeedbackOnce`，仅副驾展示 catch 接线改变。保留命令层错误原文和真实发送/恢复/写边界。

**Tech Stack:** macOS、nvm Node22.23.3、pnpm11.28.5既有独占依赖，Vitest2.1.9、React18.3.1。

父授权持续验全部、修确证缺陷、最后普通commit；本修不另申请批准，不push/tag/release/正式切换。按原独立计划先行2绿3必要红，开发和验收分别执行。方案选择沿[先行计划](../testing/successor112-auth-gui-prefix-20261022-r1-plan.md)：复用现有helper；不移动命令层前缀、不全局replace，以免影响其他错误/兼容。

1. 不同开发只改 `packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx` 的helper导入和send catch调用：`prefixFeedbackOnce('副驾暂不可用', e)`。旧112该文件已认领，仅hash替换。
2. 新专项测试路径 `packages/dsh-pm-tool/src/client/copilot-error-prefix.test.tsx`，由开发认领，逐字节复制独立R2真实组件用例；归档AUTH/RATE/normal transcript作为自有测试fixture `packages/dsh-pm-tool/src/client/copilot-error-prefix-fixture.json`。只将原外部transcript加载替为相对fixture读取，观察输出改为可选；断言/组件/五例/成功恢复和零写保持。这两个新文件纳完整后继认领，不能按旧112冒最终。
3. 开发在自有tmp新冻结/独占复制原112包依赖验证：原5项、sidecar相关既有受影响测试、noEmit；真实退出/stdout/stderr/源码patch与完整输入清单留自有报告。不整包build、不开服务、不操作GUI、不touch其他testing/livingdocs。源改变若超两行/专test设施即停。
4. 另一独立SOURCE/AUTO专家只新冻结复验这五例及受影响集合，直接核原必要红/修后exact单前缀；不得引用开发绿自签或改变旧oracle。
5. Main唯一后继builder认领新增test/fixture+窄改及完整包、build/必要完整回归，新实例采原401/429/正常完整提示；GUI由不同专家给有限结论。新修不假旧112已加载，原112证据按影响继承。
6. Main同步changelog/progress/handoff/onboarding及执行记录。父全部原可执行门及总出口齐才exactstage并普通commit；本修开发不commit，旧封包/实例/业务根/微信在途保。

验证命令由开发自有runner完整记录，以直接Node执行冻结Vitest/noEmit为准；不得原地重跑覆盖先行RED。原先行5项为2绿3红，旧首oracle设施失败保。后继声明以实际去重为准，不猜113/114。

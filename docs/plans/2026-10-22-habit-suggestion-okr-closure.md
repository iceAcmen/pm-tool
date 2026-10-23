# 习惯建议自身关联目标展示的有限修复计划

> 2026-10-22，trae。沿负责人“全部未验功能验完、修确证缺陷、最后统一普通提交”的持续授权，仅补既有 RA-P3001 展示缺口；不新增成长能力。先行独立合同与原红：[A19计划](../testing/a19-habit-suggestion-okr-contract-20261022-plan.md)、[原红报告](../testing/a19-habit-suggestion-okr-contract-20261022.md)，GUI确证 [A18-GM-01](../testing/a18-growth-more-gui-review-20261022.md)。

目标：每条有自身 `okrId` 的习惯建议，在 pending、confirmed、ignored 三态均显示“关联 OKR”、准确标题及原 ID。当前同项目目标缺失时保原 ID并诚实提示；不借其他建议、习惯或另一项目同名目标。无关联建议保原行为。确认前可辨建议所指对象，处理后留痕仍可辨。

实施文件只限 `packages/dsh-pm-tool/src/client/views/habits.tsx` 与新增同域建议展示测试。优先复用已验证的标题解析函数，但解析候选必须按建议项目过滤，再按准确 ID查找；建议展示同时保 ID。使用普通只读块文本和必要局部可收缩、自然换行规则，不新增链接、动作、统计或错误播报，不改 panel.css、共享组件、后端/schema、confirm/ignore、final、快照、聚合或周期占位。

执行顺序：

1. 等当前 A18 verify接口与 integration审证释放不可变主源保护；A18导入GUI只绑定冻结输出，可继续审证。A18 SOURCE/AUTO 已独立有限通过，但旧95脚本两项失效静态断言另有独立合同，不能冒全部回归绿。
2. 独立冻结完整当时输入，复跑原A19必要13红/组件10/原模型10。原先共享10个`.bin`前缀变化保 BLOCKED，依据[只读诊断](../../reports/a19-shared-bin-drift-diagnosis-20261022.md)采用完整自有依赖副本或禁重整的明确工具入口；不恢复或覆盖旧共享文件，不通过安装器修保护记录。
3. 开发仅上述有限文件，先测三态自身目标、准确ID、missing/无清单、同名不同ID及跨项目保护、目标改名重挂、长普通文本与原动作接口。原专家测试只读，必要adapter只能由独立专家处理。
4. 自有 no-cache 单fork、白名单HOME/TMP/cache运行同原13、组件10、模型10及受影响习惯/OKR/表单/反馈回归、完整noEmit。保存原红新绿、候选差异及保护，开发释放，不build/GUI/提交。
5. 不同独立专家 SOURCE/AUTO复验。Main 唯一另建新候选输出，固定现有 pnpm11.28.5和独占依赖/产物，完整build/coverage/全部verify及隔离保护后启动新宿主，绑定完整实际下发。
6. 新候选真实两建议 pending→confirm/ignore→重进，逐条核标题/ID/理由/状态及预期写入；另原1440深色与390局部核长目标和missing/无关联可读、不压操作、不产生外壳横滚。GUI执行只采原证，独立专家审签，不以DOM或作者测试代签。

环境：macOS、Node22.23.3、pnpm11.28.5。独立PASS只限本缺陷；全部已批准旅程、矩阵、读屏、U4、最终总门及普通commit仍继续，无push/tag/发布/正式切换。

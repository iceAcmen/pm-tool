# O4 Strict 邻接观察与原合同范围

2026-10-23，trae，独立任务域专家。此片只澄清本轮审证与原动作，不新增产品需求/StrictMode GUI门，不修改既有 O4/stale 合同。

- 原 [O4-5](main-o3-o5-samepage-assertions-20261020.md#o4-未保存草稿-dirty-确认重点) / [RA-TOOL04](remaining-journey-cases-20261021.md#7-ci与工具试点) 要求实际任务流程确认 Escape 保内容/归触发控件、Enter 放弃退出/归 opener。没有要求人为包 StrictMode 的 TaskForm GUI；RA-F02 的 StrictMode AUTO 是上传清理用例，不可移作 O4 新门。负责人也明确“原GUI实际任务不是Strict假设”。
- 开发初 red-o4 的第三红是 Strict Enter 后 body 焦点，初原版/修后和本专家同oracle复测均保此观察。最终只非Strict断言退出归opener，Strict仍断言 Escape 取消确认/保draft/归trigger、Enter退出，**没有断言其最终焦点通过**。这是 oracle范围收窄，不是第三红被修复；不得宣称“所有焦点已修完”。
- 裁定：该额外Strict观察**不新增本SOURCE/AUTO有限门的阻塞项**，也不能据此撤销原真实GUI已签的取消/Enter有限子段；它仍为 `NOT_PASS_OBSERVATION`，不是豁免原合同、不是整O4 PASS。插件入口未显式包Strict，不据此推断宿主整个运行树必非Strict，未读活runtime查证。
- Main新包按[既有O4先行合同§3](tasks-failure-gui-timed-20261023-r3-o4-escape-plan.md#3-原分支的最小复验)采真实确认Escape→保description/归trigger→再确认Enter→双层退出/最终归同任务opener，记录最终焦点/业务零写。**这是原已必需步骤，不加新矩阵**；若新包实际流程落body，按原O4-5判失败，交唯一开发最小修复并复验，不得拿本11绿替代。
- 原stale四viewport、旧error恢复及其余O4未采分支状态不变。此片随report封交Main即停止，不改产品/其他testing。

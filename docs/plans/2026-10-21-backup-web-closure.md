# 网页备份恢复既有接缝收口

> Main协调与GUI，开发修复，独立专家另验。持续授权见父执行记录，独立MFR-B01/B02红例见`materials-files-reports-independent-auto-20261021.md`及findings。2026-10-21，trae。

当前网页FileReader只传JSON文本，标准附件备份的侧车字节未进入后端；预检仅validateBackup，确认才完整precheck。只关闭已有本机备份能力缺口，不把字节守卫降级或删除file_assets。

1. `commands/backup.ts`：JSON内容演练也完整调用precheckBackup；含附件且缺可验证侧车时明确说明尚未检字节/需本机路径，不能回“预检通过”。现路径restore演练调用完整schema/关系/字节校验，与confirm同级。
2. `core/backup.ts`：必要抽共用只读路径预检（读JSON及其真实侧车/precheckBackupBytes），confirm仍现全表/字节事务与安全快照，不新增恢复模式、不把浏览器文件名猜成本机路径。
3. `client/panel.tsx`：在已有恢复入口提供本机标准备份路径的明确输入/演练动作，显示完整预检结果，取消零写，双确认才调用既有restore路径；仍保无附件JSON文件导入。路径可完整复制或选择后手填，不读取File.path、不给假路径默认，不自动上传或执行任意命令。路径token引号按现命令解析安全拒绝不支持形状，避免注入confirm。
4. 先行独立专家补冻两红的最小合同：合法F5本机路径UI预检/双确认真字节恢复、content越界先拒、缺侧车/hash/关系拒零写、JSON-only无file保持兼容、cancel/safetySnapshot/fullmanifest、输入错误保留，候选实际pack/bytes/恢复新实例绑定。源修前测试先红再绿，不改原F5。
5. 产品独占命令/core交领域开发，panel仍Main独占，具体最小前端接口由Main实施；禁止共享lib/build、上游/正式/commit。Main统一新产物/实例GUI，专家复验，不用路径CLI成功替代新增实际网页入口过程。

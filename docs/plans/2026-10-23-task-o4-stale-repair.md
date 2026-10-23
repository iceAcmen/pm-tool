# 任务确认 Escape 与陈旧通知最小修复

2026-10-23，trae，Main。沿父“所有已实现未验收口至全部本批普通提交”的授权，仅修已独立确证缺陷。首读开发已释放，独立 SOURCE/AUTO 有限通过，原 GUI 红项仍保留。

- `packages/dsh-pm-tool/src/client/panel.tsx`：确认层打开时，底层 DrawerPanel 不重复处理同次 Escape；保留说明草稿、确认取消与 Enter 放弃语义。将原陈旧通知放入 `.pm-main` 的纵向内容位置，保持旧数据、原原因与重试。
- `packages/dsh-pm-tool/src/client/panel-transport-error-feedback.test.tsx`：按专家合同补通知位置和原数据/重试红绿。
- 新增 `packages/dsh-pm-tool/src/client/panel-confirm-escape.test.tsx`：真实组件核 dirty 确认 Escape、保草稿、重新确认 Enter、干净关闭。实际最小机制调查如需确认模块导出只读可见查询，先报精确额外文件与原因，由 Main 认领后实施，禁止擅自扩大源写面。
- 本批开发仅写自有 plan/handoff，不改 CSS、其他功能、livingdocs 或 testing，不做整 build/GUI/git。

先行合同：[O4](../testing/tasks-failure-gui-timed-20261023-r3-o4-escape-plan.md)、[stale](../testing/tasks-failure-gui-timed-20261023-r3-stale-layout-plan.md)。不声称已确定两个同 window listener 的注册顺序；只修确认动作归属的已证行为。旧错误卡恢复 BLOCKED 保留。

唯一 panel 写者接首读 `b83eba55…`；两处修复以同指纹真实组件先红后绿，相关窄类型与退出/首读邻接回归，记录每步真实起止与耗时，封回释放。Main 再将 L8、首读、本修复唯一冻结、一次整构建/完整回归及原合同真实 GUI，独立专家审签。普通提交须父适用门全齐，未授权 push/release/正式切。

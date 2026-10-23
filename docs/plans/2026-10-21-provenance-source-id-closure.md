# 来源行 ID 收口

依据独立 `docs/testing/a11-governance-source-gui-review-20261021.md` AGUI-01 与原 RA-AI01；沿负责人持续验收修复授权，Main 唯一 builder/GUI，不扩产品能力。

限定 `packages/dsh-pm-tool/src/client/provenance-panel.tsx` 及同组件测试：有 label 时同时呈现标题与 ref.id；无 label 时 ID 不重复。保表、角色、冻结版本、点击 ref.id、失效来源无跳转和旧 refs/history，不增加页面或字段。若必要只新增局部现有样式类，不改全局 CSS。先保同测试旧红，再限定修复及作者/独立 SOURCE/AUTO。

Main 冻结下一候选、新实例及完整 uncached 响应，按原非空十来源/逐跳返回/changed/missing/重校历史步骤补 GUI；另补首保存原 JSON、请求/返回脱敏结构、刷新/真实新进程回读等已登记缺证。旧 A10 失败与缺失 result 不覆盖、不倒填。

最后全回归和普通 commit，无 push/tag/正式切换。macOS、nvm Node22、pnpm11.28.5。

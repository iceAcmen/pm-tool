# A8 反馈与恢复预检有限独立复验计划

> 2026-10-21，trae，新独立复验专家。给 Main 与后继审证者使用：仅按已有 A8/A7 合同复验本轮 SOURCE/AUTO，GUI 单列，不代签全部积压。

## 授权与终点

- 本派单原句：“只写docs/testing/a8-feedback-precheck-independent-retest-20261021*和自有tmp，不改产品/Main测试/其他testing/livingdocs、不build/noGUI/no服务/credentials/commit。”
- 父持续授权验完所有在途并最后统一 commit；Main 唯一 builder/GUI。本专家不继承提交、构建、GUI、服务或凭据权限。
- 只取实际主树新字节；不等待 Main build。不得更改 scope、persistence、refresh 策略或 fixture/oracle 逃红。
- 终点：“给本轮有限SOURCE/AUTO PASS/FAIL及精确影响，新确证给小合同，任务就此结束，不自动等无限GUI。”
- 因限定写根与 Main 所有权，本轮不 fetch/pull、install/build、全包 verify、改 livingdocs 或全包提交。GUI 缺证仍 BLOCKED，不转 MANUAL_PENDING。

## 执行步骤

1. 已完成：读 AGENTS/collaboration、批准收口计划、A6 GUI 报告、A7 repair contract、A8 合同/review/main-author；核作者红绿旧日志与实际测试路径。
2. 已完成：本前缀 selftmp 冻结406份输入、tracked diff、新文件指纹、原 fixture、package/lock/config、旧专家 r3 精确测试副本和作者日志；实解析 React/renderer18.3.1、Vitest2.1.9，记录四个共享缓存观察根。
3. 已完成：原专家27项全绿，原 path6+launch5=11全绿，Main Board作者9项全绿，各exit0；副本/依赖/已枚举共享缓存不变，主树读取输入无漂移。独立执行作者例不等独立设计用例。
4. 已完成：SOURCE7项通过；成功CSS specificity(0,2,0)高于旧错误(0,1,0)，原恢复callback AST与A7相同，原业务链未改。真实长路径危险确认取消/提交2项与原bridge23项全绿，exit0。不签几何、GUI、真实恢复或POST。
5. 已完成：本轮72次测试执行全绿，精确argv/退出/日志/副本/依赖与四共享缓存根检查已归档；406份输入/副本无漂移，最终八项语法/diff命令全0。报告有限SOURCE/AUTO PASS，GUI BLOCKED；未确证新产品缺陷，不开新修复合同。本子单结束，不等待无限GUI。

## 环境与证据

- macOS，nvm Node22；pnpm11.28.5 为项目口径，本轮不调用安装或 pnpm build。
- 只读链接 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`；实际解析版本及指纹由 freeze 记录，不能只引用 package 声明。
- 私有 root/cache/TMP/Node compile cache，Vitest `--no-cache`、单 worker、禁 watch/coverage；仅 transform 和真实 React renderer 执行，不产 lib。
- 原 A6/A7 GUI FAIL、旧专家27项17绿10红、作者设施失败日志保原件。本轮新结果不能覆盖、倒签旧证。
- SOURCE/AUTO PASS 不代表实际 CSS 计算、布局横滚、真实 BoardEditor/RGL、chunk、落盘、reload、保护、GUI、全集或发布 PASS。

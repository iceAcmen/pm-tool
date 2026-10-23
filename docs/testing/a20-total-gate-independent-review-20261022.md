# A20 文件附件反思计数总门独立审证

> 2026-10-22，角色：A20 总门独立审证专家。本文只读既有候选与证据，不运行或停止服务/测试，不修改产品，不改写旧报告；只裁决候选继承、RA-P0007 与 A20 总门，不授权提交、推送、tag、发布或正式服务切换。

## 1. 总结论

| 裁决对象 | 状态 | 独立结论 |
| --- | --- | --- |
| 旧 A20 GUI 正文不可见 FAIL | **已被定向取代，旧记录保留** | A20V2 是 `A20 → A20V → A20V2` 的同一候选链；同一业务反思产物未变，A20V2 SOURCE/AUTO 与 GUI G01-G06 已独立 PASS，足以取代“slash-only 正文不可见”这一项的旧 FAIL，但不得删除或回写旧报告 |
| RA-P0007 | **PASS_LIMITED** | 原 A20 的真实落盘、命令重读、重启重进、GUI 输入执行可继承；A20V2 补齐结果正文可见。限定范围见第 4 节 |
| A20V2 定向修复 | **PASS** | SOURCE S01-S07、AUTO A01-A10、GUI G01-G06 均已独立 PASS；G07 因宿主无合法卸载 UI 为 NOT_APPLICABLE，生命周期由 AUTO A06 覆盖 |
| A20 总门 | **BLOCKED** | A20V2 增量后没有绑定最终候选的完整整包回归；且 package composition 与 `apply()` 已直接影响至少两个既有 verify，旧 95 guard 不能继承 |
| 是否允许进入 U4 | **不允许** | A20 总门未 PASS。只能继续当前候选的验证设施修正、补回归、独立审证与文档工作 |

**最终判定：RA-P0007 可按明确边界整体记 `PASS_LIMITED`；A20 总门仍为 `BLOCKED`，不得进入 U4。**

## 2. 候选链与身份

- 基线提交：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`
- A20 manifest：`reports/all-pending-evidence-20261021/A20/candidate.json`
- A20 manifest SHA256：`1bc7b72472e24f5ab3b193c3da87a5d76a175e081191be55cc2c4b6b66de6995`
- A20V2 manifest：`reports/all-pending-evidence-20261021/A20V2/candidate.json`
- A20V2 manifest SHA256：`c0e678055ee2dee6be40f99ebe52f88843a7de9933a26c87007d1678f834946b`
- A20V2 父候选为 A20V；A20V 的父候选明确绑定上述 A20 manifest，因此继承链闭合。
- A20V2 `lib/core/reflect.js` SHA256 仍为 `6b53e4534de33f327978fcebe7886a1571febecf6945f2fac4910b53852703c5`，与 A20 完全一致。
- A20V2 相对 A20 的实质产品增量是客户端本地回显接缝、同域测试及 `package.json` 的 conversation inject；未改反思构造、命令后端、存储、schema 或业务数据语义。

因此，A20 的业务持久化证据不是被另一个不相干候选借用，而是可按“后端与数据语义未变”继承到 A20V2。客户端可见性旧 FAIL 则属于受影响范围，必须由 A20V2 新证据取代，不能沿用旧结论。

## 3. 旧 GUI FAIL 的取代裁决

旧报告的 FAIL 是明确事实：A20 冻结候选中 composer 请求和 `command/done` 成功，但四张截图及 DOM 均无结果正文。

A20V2 对同一缺陷建立了新的、候选绑定完整的证据链：

1. SOURCE S01-S07 PASS：只增加 `command/executed` 到事件所属 session 的本地通知接缝，不重跑命令、不改后端。
2. AUTO A01-A10 PASS：覆盖成功、错误、非 pm、跨 session、能力缺失、卸载、面板单双发及空正文边界。
3. GUI G01-G06 PASS：真实宿主中成功与错误正文可见、session 不串线、非 pm 不误收、面板成功/失败均无双请求或双反馈。
4. A20V2 GUI 使用的业务正文仍指向 A20 运行时生成的 `ref-mvj42quw-uq3nhz`，而 `lib/core/reflect.js` 字节未变。

据此，旧“GUI 结果正文不可见”FAIL 已被同候选链的新证据**有效取代**。取代只改变当前候选的门状态，不改变历史事实：旧 FAIL 报告、旧截图与旧 DOM 必须永久保留，不能改写为当时通过。

## 4. RA-P0007 裁决与限定

RA-P0007 可整体判为 **PASS_LIMITED**，覆盖：

- file-only、mixed、empty 三条新 reflection 的真实落盘与正文；
- `/pm reflect` 命令重读；
- file-only 重复 done/reflect 的 ID、生成时刻与 raw SHA 幂等；
- 同一隔离根重启后重新读取三条 reflection；
- 宿主 composer 输入与真实请求、事件、命令结果对应；
- A20V2 中成功/错误正文真实可见、session 归属正确、非 pm 隔离；
- 面板成功/失败链均保持一次请求、一次既有反馈。

限制不得省略：

- 只覆盖本批三条任务、`/pm reflect` 及合同指定的 slash/面板旅程，不外推其他命令。
- 重启证据没有另附精确 PID/启动日志，只证明同根重进后的业务读回，不扩称完整宿主恢复门。
- 运行时 `finals={}` 前后均为空；非空历史 final 不回写仅由 SOURCE/AUTO 覆盖。
- 不覆盖输入法、键盘可达性、响应式、视觉质量、跨刷新历史消息保留或附件内容质量。
- G07 为 NOT_APPLICABLE；合法卸载后的监听释放由同候选 AUTO A06 覆盖。

## 5. A20 总门为何仍 BLOCKED

A20 原业务候选的 `152 files / 1570 tests`、95 guard、guard selftest、Launcher 56 项均已有独立有限 PASS，可以作为继承基线，但不能直接写成 A20V2 最终候选的完整回归。

A20V2 改动了两个会影响整包验证面的接缝：

1. `package.json` 的 `dsh.client.inject` 新增 `@deepseek-ai/dsh-client-ui-conversation`；冻结候选内 `scripts/verify-web.mjs` 仍对旧四项列表做 `deepEqual`，没有该项。该 verify 已被直接影响。
2. `src/client/index.tsx` 的 `apply()` 新增 `client.on(...)` 注册；冻结候选内 `scripts/verify-client-bundle.mjs` 的最小 mock 没有 `on/get/sessions.scope`。该 bundle 激活 verify 同样已被直接影响。

这两点是静态可确定的验证合同漂移，不需要执行命令才能确认。它们不推翻 A20V2 已取得的真实宿主 GUI PASS，却证明旧 95 guard 不能按“未受影响”继承。当前也没有 A20V2 后续完整 coverage、全部 verify 与 guard selftest 的独立记录。

因此，A20 总门不是 PASS，也不能以“客户端改动很小”豁免；状态必须保持 **BLOCKED**。

## 6. 解除 BLOCKED 的最小补件

先由开发在 A20V2 后继候选中仅修正受影响的验证设施：

- 更新 `scripts/verify-web.mjs` 的 manifest inject 精确预期；
- 更新 `scripts/verify-client-bundle.mjs` 的最小宿主 mock，使其提供新接缝所需的真实最小能力，并保留 bundle 激活、slot 注册及无外部泄漏断言；
- 不借机修改反思业务、存储、schema、命令语义或扩大 UI 功能。

随后冻结新的后继候选，manifest 必须绑定：

- A20V2 父 manifest 及 SHA256；
- 完整 tracked patch、新文件清单与逐文件 SHA256；
- `package.json`、`index.tsx`、同域测试、两个受影响 verify 的 SHA256；
- 构建目录、完整 source/artifact 清单、`lib/client.js` 与仍应不变的 `lib/core/reflect.js` SHA256；
- `sourceDrift=[]`、`protectedDrift=[]`、依赖来源与正式资产保护结果。

在该冻结候选的包目录执行并保留原始退出码、stdout/stderr、JSON reporter：

```sh
pnpm run build
node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
node_modules/vitest/vitest.mjs run --coverage --maxWorkers=1 --minWorkers=1 --no-cache
node scripts/verify-isolation.mjs
node scripts/test-isolation-guard.mjs
```

其中 `verify-isolation.mjs` 必须默认运行全部离线确定性 `verify-*.mjs`，不得只点跑两个已知受影响脚本；完整 Vitest 应包含 A20V2 新增同域测试。任一失败均继续阻塞。

Launcher 源码与测试未被 A20V/A20V2 增量触及，原 A20 的 56/56 与 `verify-launcher` 可在后继 manifest 证明 Launcher 文件逐字节不变后继承；若无法给出完整不变指纹，则须补跑：

```sh
node --test launcher/test/app.loopback.test.mjs launcher/test/browsers.controller.test.mjs launcher/test/cli.integration.test.mjs launcher/test/control-html.test.mjs launcher/test/launcher-app.test.mjs launcher/test/launcher-core.test.mjs launcher/test/local-app.test.mjs launcher/test/start-local.test.mjs launcher/test/tray.test.mjs
node launcher/scripts/verify-launcher.mjs
```

最后须由未修改产品的独立测试专家审查新候选绑定、完整回归、两个 verify 修正的合理性、警告与失败原文、保护清单，并明确给出 A20 总门 PASS。开发自验、命令退出码摘要或本报告均不能代替该签字。

## 7. 失效规则与 U4

- A20V2 或后继候选的产品源码、测试 Oracle、构建产物、package composition、profile 目标或运行实例发生变化，相关证据按影响范围失效。
- `lib/core/reflect.js`、命令后端、存储或 schema 一旦变化，本文对 A20 业务持久化证据的继承立即失效，RA-P0007 必须重做受影响旅程。
- 客户端事件路由、conversation inject、通知级别、session 定位或面板执行链一旦变化，A20V2 SOURCE/AUTO/GUI 结论失效。
- 仅修正上述两个验证设施时，RA-P0007 与 A20V2 GUI 可继承，但新的完整整包回归及独立总门审证仍不可省略。
- 纯文档变化不使行为证据自动失效，但必须由总门专家记录继承理由。

在上述补件全部完成并由独立专家签署 A20 总门 PASS 前，**不得进入 U4**。允许继续的工作仅限本候选验证设施修正、补测、独立审证与相关文档。

## 8. 引用证据

- [A20 文件资料反思声明独立限定复验](a20-file-reflection-independent-retest-20261022.md)
- [A20 完整回归独立审证](a20-full-regression-independent-review-20261022.md)
- [A20 运行时重进与 GUI 原始证据独立审查](a20-runtime-reentry-gui-independent-review-20261022.md)
- [A20V2 SOURCE/AUTO 独立复验](a20v2-source-auto-independent-retest-20261022.md)
- [A20V2 GUI 独立复核](a20v2-gui-independent-review-20261022.md)
- [A20 slash 命令结果可见性合同](a20-slash-command-result-visibility-contract-20261022.md)


# A11 箭头修复有限独立复验

> 给 Main、负责人和接续专家使用：仅签冻结启动器 SOURCE / 新 headless Chrome 受控 HTTP fixture 的真实 DOM AUTO；不签实际 Finder GUI、个人浏览器、整项 Launcher/B8 或发布。2026-10-21，trae，独立限定测试专家。

## 1. 有限结论

**A10-FG-V01 的新候选 SOURCE / AUTO 局部 PASS。实际新 Finder/control GUI：NOT_RUN。旧 A10 视觉 FAIL 与加载/旅程 BLOCKED 原样保留。**

| 对象 | 本轮结论 | 边界 |
| --- | --- | --- |
| 新旧生产模板差异 | SOURCE 局部 PASS | 相对 A10 冻结只新增一条局部 CSS；六份模板的实际内联脚本原字节不变 |
| 原 Launcher 全集 | AUTO 56/56，exit0 | 自有副本、fake open/controller、临时 HTTP；不等 OS 投递/登录 |
| 原 control DOM 专项 | AUTO 8/8，exit0 | 原测试源码不改，生产内联脚本在新 headless Chrome 执行 |
| 独立追加四档及 SVG 对照 | AUTO 5/5，exit0 | 1440/390 × light/dark 的受控真实 DOM；不是 Main 实际 GUI |
| 最终身份/日志/资源检查 | 24/24，exit0 | 源码、日志、私有依赖链接和本单资源；没有全系统写根 WATCH |
| A10 control60787 / N1 / N2 | 不扩签 | 不访问、不停、不将旧 control 当修后实例；保持旧 A10 归属 |
| actual new Finder GUI / PM mount / loaded bytes | NOT_RUN | Main 唯一 GUI；本单未采实际 Finder 双击、PM 快照或 nonce 回告 |

审签依据：[A10 Finder 专家报告](a10-finder-reopen-gui-independent-review-20261021.md) §5 A10-FG-V01、[最小修复计划](../plans/2026-10-21-launcher-chevron-closure.md)、[协作规则](../collaboration.md) §9/11。本结论不关闭仍缺实际 GUI 的整项门，不继承父任务 commit 权限。

## 2. 授权和执行边界

父负责人原句：“好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”

本单原句：“新独立限定SOURCE/真实DOM审验，仅写docs/testing/a11-chevron-independent-retest-20261021*及selftmp，无product/otherdocs/livingdocs/sharedcache/build/真实GUI/服务/credentials/commit。父持续修在途，Main唯一GUI。”

本单另明确允许：冻结实际 source/inline/template 和同域 tests，复制自有临时目录内 Puppeteer 依赖；仅新 headless Chrome 作为受控 HTTP fixture 真实 DOM，不使用 Main 实际 GUI/用户 profile；重跑原 56+8，追加四档/Chrome/焦点/状态/无全局 SVG 影响；原 FAIL 不抹，actual new Finder GUI 未采记 NOT_RUN，有限结论后释放。

已读 AGENTS/collaboration、onboarding 当前交接、handoff/progress、相关 changelog/requirements/ADL/KB/ISS、父执行记录与以上专家合同。按本次更具体授权，没有 fetch/pull、install、插件 build、整包 verify、服务启动、真实 GUI、credentials、其他文档或 Git 写入。未运行 launcher bin/start/make-app；原 56 的 local-app 用例仅在私有 TMPDIR 生成测试壳并作语法/变量解析，不执行 Finder app，不产生产物到共享目录。

## 3. 冻结候选

最终原件目录：[selftmp/r3](a11-chevron-independent-retest-20261021-selftmp/r3/)，[candidate](a11-chevron-independent-retest-20261021-selftmp/r3/candidate.json)、[24 文件清单](a11-chevron-independent-retest-20261021-selftmp/r3/source-manifest.json)、[tracked patch](a11-chevron-independent-retest-20261021-selftmp/r3/tracked.patch)、[最终检查](a11-chevron-independent-retest-20261021-selftmp/r3-final-check.json)。

| 字段 | 绑定值 |
| --- | --- |
| 产品基线 | `2a7603023bc54ef13d788e50069ee3fde4671bf3` |
| dirty 工作树 HEAD | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；不能单独代表本次候选 |
| 冻结时间 UTC | `2026-10-21T16:19:45.277Z` |
| 新 control-html SHA256 | `6994cdd109d7258f14b0283a8e2f0b1d55e6cacc34b80ed5d39736c6dd90a205` |
| A10 旧 control-html SHA256 | `3b4a30c7b6393b3c2131e62a038358763bd3f8fa20a05aa09bf7562275289a9e` |
| 原 control-html-sync 测试 SHA256 | `739e79616cf6caba764b6fcd90c57648400e7145d2c0d2d92b41b1ea3566d6a3` |
| 独立追加用例 SHA256 | `30f81173c9c13c41bd634df7f47895f9f563bb3cf9300bfedebd85e94375fa4a` |
| 最终 candidate.json SHA256 | `3d5dbf6c879df488e2920107a2cd6d755ff2ba6544b92737aad7256ffa1bf95e` |

冻结 launcher/src、bin、test、scripts、package.json 共 24 个文件；冻结前后和结束时同域主树 24/24 一致。父其他文件仍在途，本检查不签整个 dirty 仓库。10 个生产 src 文件对 A10：9 个相同，仅 control-html 不同；删除下面这一条 CSS 后，完整新旧 control-html 字符串严格相等：

```css
.browser-select>svg{width:18px;height:18px;flex:0 0 18px;color:var(--muted)}
```

[精确差异](a11-chevron-independent-retest-20261021-selftmp/r3/a10-to-a11.diff)只含该新增行。没有全局 `svg` 尺寸规则，没有 nonce/CORS/TTL/首投/open/reopen/同步逻辑变更。冻结 S0/S1/S4 × 浅深的完整 HTML 与 inline，共六组；新旧 HTML 去掉该行严格相同，inline 严格相同，逐份 SHA 在 candidate.templates。

独立追加 fixture 的完整实际 HTTP HTML 响应与上述冻结生产 renderer 输出全字节 SHA 相等；DOM 执行真实生产内联脚本，不是重写 UI、vm 假 DOM 或断言字符串。响应和状态都是本单 fixture，不是 Main/control60787 的下发证据。

## 4. 原失败与本轮失败保留

[原 A11 chevron](../../reports/all-pending-evidence-20261021/A11/chevron/)六份原件未改，指纹与冻结副本一致：

- 原 red：`node --test --test-name-pattern=浏览器选择框实际SVG test/control-html-sync.test.mjs`，exit1，`239.78125 !== 18`。
- 原 green：`node --test test/control-html-sync.test.mjs`，8/8，exit0。原尺寸用例虽然标题含“菜单选择后”，实际仅初态两宽度；本单追加用例补足，不改原用例冒充覆盖。
- 本单 r1：依赖复制器误把 Node 内置 `buffer` 当未安装包，准备阶段异常 exit1；尚未启动 Chrome/执行产品用例。[设施记录](a11-chevron-independent-retest-20261021-selftmp/r1-facility-failure.md)和部分副本保留。只修自有复制器。
- 本单 r2：原 56/8 均 exit0；追加四档 4 项通过，旧新双页对照菜单步骤 10s 超时，1 cancelled、外层 exit1。[原 stdout](a11-chevron-independent-retest-20261021-selftmp/r2/independent-dom.stdout.txt)、summary 和调整前用例保存，未改退出码。超时发生于双页操作设施，不能据此认产品缺陷；仅给自有对照加显式页激活、focus/Enter 和 3s 等待，r3 同对象成功。
- 本单 r3：重新冻结同字节源，56/8/5 全部 exit0。旧源同 fixture 仍实际复现 SVG `239.78125×239.78125`、trigger 高 `241.78125`，不是把旧 FAIL 删除或签成旧版 PASS。

## 5. 独立 DOM 原证

原始数值、焦点、请求和实际响应 SHA：[independent-observations.json](a11-chevron-independent-retest-20261021-selftmp/r3/independent-observations.json)。四档均经过 S0 → 菜单 → 鼠标选择 Chrome → Enter 重开菜单 → Escape → S1 同步 → 菜单选项同态焦点 → open → fixture S4 → 同态 S4 → reopen → fixture S4 → switch-browser 回 S1。

| 档位 | trigger 宽/高 | chooser SVG | muted 实际值 | Escape 后焦点 |
| --- | --- | --- | --- | --- |
| 1440 light | 370 / 48 | 18×18，shrink0，basis18px | rgb(104,116,131) | browser-toggle，solid 3px |
| 1440 dark | 370 / 48 | 同上 | rgb(173,182,195) | 同上 |
| 390 light | 300 / 48 | 同上 | rgb(104,116,131) | 同上 |
| 390 dark | 300 / 48 | 同上 | rgb(173,182,195) | 同上 |

初态、展开菜单、选择 Chrome、焦点、S1 权威变化/同态、返回选择入口均保持 18px，无外壳横滚。菜单三 option、expanded 开/关、选择请求 browser=Chrome、选择后 focus 归还均有实际 DOM/fixture 请求原证。同态读取后 trigger / focused option 元素身份保持；S4 同态也保留原 reopen 元素。

**S4 不存在选择框箭头，不能写“S4 所有 SVG=18”。** S4 的成功 check 保持既有 25×25；app 30×30、privacy 14×14 未被局部规则影响。旧新 app/privacy 实际尺寸/颜色一致。菜单 selected SVG 对照为双方 0×0，仅记“相同、不被该规则改写”，不签该未呈现图标的视觉质量；不把这项扩成所有 SVG 的 GUI 通过。

reopen 实际 fixture POST payload 为 `{type:"reopen",browser:"Chrome"}`；返回 S3，再由受控 `/api/state` 提供 S4。未走真实 DSH、未铸造或重发真实 nonce、未调用实际 `/api/entered`、无 cookie；本单仅证明生产 control 的同步/动作接线未因 CSS 退化，不是认证成功、TTL、新 mount 或真实 hash-only 旅程证据。

## 6. 环境、命令与结果

macOS/darwin arm64，Darwin24.6.0，nvm Node `v22.23.3`，Puppeteer-core `23.11.1`（已安装包的自有副本）、Chrome `139.0.7258.155`，1440/390×900 CSS px、deviceScaleFactor1。未运行 pnpm，项目声明 pnpm11.28.5。所有测试子进程用白名单环境；HOME/TMPDIR/XDG/DSH_HOME/npm/Puppeteer/Corepack 根均在本前缀 selftmp/r3，未继承 API/认证环境。

实际整轮命令（仓库根）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-chevron-independent-retest-20261021-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-chevron-independent-retest-20261021-run.mjs r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-chevron-independent-retest-20261021-run.mjs r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-chevron-independent-retest-20261021-final-check.mjs r3
```

退出分别为 1 / 1 / 0 / 0；r1、r2 缺口见上节。runner 不覆盖既有目录；再次复现须选新 r4，不删除旧证据。

最终子命令实际 cwd 为 `docs/testing/a11-chevron-independent-retest-20261021-selftmp/r3/frozen/launcher`；完整 argv/UTC/exit 和 stdout/stderr SHA 在[summary](a11-chevron-independent-retest-20261021-selftmp/r3/summary.json)，以下为实际运行参数，不应在共享主树原地执行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --test test/contract.state.test.mjs test/browsers.controller.test.mjs test/app.loopback.test.mjs test/control-html.test.mjs test/cancel.race.test.mjs test/journey-race.test.mjs test/loopback-security.test.mjs test/local-app.test.mjs test/browser-open.test.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --test test/control-html-sync.test.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --test /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/a11-chevron-independent-retest-20261021-cases.test.mjs
```

| 执行 | UTC 起止 | 结果 |
| --- | --- | --- |
| 原56 | 16:19:48.690 → 49.113 | 56/56，fail/cancelled/skipped 均0，exit0 |
| 原DOM8 | 16:19:49.115 → 57.927 | 8/8，同上，exit0 |
| 独立5 | 16:19:57.928 → 16:20:11.878 | 5/5，同上，exit0 |
| final-check | 原件 checkedAt | 24/24，exit0；SOURCE_AUTO_LIMITED_PASS_NOT_GUI |

三份原 stdout 和空 stderr 均已归档并校 SHA，不以“命令已发”代替结束。

## 7. 写根、资源与释放

只新增本前缀报告、runner、observer、cases、final-check 及 selftmp；没有产品/其他 testing/其他 docs/livingdocs 修改，没有 install、共享 lib、正式 root/profile、credential 或 commit。依赖只从已声明临时测试树解析已安装包，复制后 115 条运行链接全部指向 selftmp/r3 内；没有 installer/setup 或共享依赖运行写入。私有复制清单与逐文件指纹见 dependencies.json。

最终新 Chrome PID `27125` / `27194` 的 argv 均含 `--headless=new`、全新本单 user-data-dir、remote-debugging-port0；没有 attach 旧 browser 或用户 profile。test after 经各自 browser handle 关闭，两 PID exit0 且最终不存在。cancel 测试的自有瞬时 Node27101 按原用例 SIGTERM 退出，未操作正式进程。最终 22 个 fixture listener 均已 close，逐端口 lsof 无 LISTEN；资源原件见 resources.ndjson 和 r3-final-check.json。

r2 Chrome26650/26759 亦有原 exit0，结束时精确 PID 存活回读均 false；临时 Node26627 已按原用例退出，22 listen/22 close。r1 未启动这些资源。没有保留本单后台执行；私有原件/profile 留在 selftmp，不删除在途/旧证据。

未查询 control60787 API、未使用它的旧画面或 old A10 loaded 绑定证明修后通过；只读 A10 声明 source 文件用于对比。没有监测全系统/所有共享根，因此不作全盘零污染保证；本报告只陈述实际使用的隔离环境、源码一致性和本单资源。

**本独立限定任务完成并释放；父持续任务仍在途。** 下一动作仍由 Main 按 A10-FG-V01 §5 在实际新候选 control 采 1440/390 的原证，绑定实际 HTML/实例后交专家审证；未采项保持 NOT_RUN，旧 A10 FAIL/BLOCKED 不抹，不扩大到整项 PASS、提交、push/tag 或正式切换。

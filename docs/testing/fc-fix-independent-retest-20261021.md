# FC 修复候选独立复验

> 给 Main 和独立验收协调者使用。2026-10-21，平台 trae，独立测试专家；只判 A1 的 AUTO 与真实 Chrome DOM/模拟 HTTP，不判 Finder、真实 S4 认证或完整 batchA。

## 即时结论

**A1 的 FC 收口不通过（FAIL）。** 17 源身份一致，原 launcher 49/49、新 DOM 3/3 独立通过；补充真实 DOM 8 项中 5 过、3 失败。原测试通过不豁免新增失败，不能据此关闭 FC-04 或放行 batchA。

| 缺陷 | 级别 | 独立证据与后果 |
| --- | --- | --- |
| FC-RT-01：动作等待锁住状态读取及取消 | P1 / FAIL | `control-html.mjs:L91-103`：`actionBusy` 同时阻止后续动作和所有读，POST 没有 3s Abort。慢 open 在途 4s，server S2、DOM S0、GET 仅首载 1 次、无取消入口。既定 S2 取消路径无法及时使用；挂起 POST 还会持续阻断同步。 |
| FC-RT-02：可见的第二次浏览器选择被静默丢弃 | P1 / FAIL | `control-html.mjs:L92,L138`：先修改本地选择并 render，再调用会被 busy 拦掉的 act，未排队也未禁用。真实点击 Chrome 后暂缓第一 POST 响应，再选 Safari：页面先显 Safari，仅发送 Chrome；释放响应后回退 Chrome。 |
| FC-RT-03：同步重绘丢失菜单选项焦点 | P2 / FAIL | `control-html.mjs:L126,L134-141`：只保存 DOM id，选项没有 id；有效 S0→S1 更新替换 root。Chrome 选项聚焦时收到更新，菜单仍展开但 activeElement 变 BODY，原键盘操作位置丢失。 |

补充原证：[r1 日志](fc-fix-independent-retest-20261021-r1-additional.txt)、[命令与指纹](fc-fix-independent-retest-20261021-r1-additional.json)。所有探针执行生产 `renderControlHtml`，不向页面注入替代状态机/事件处理器；HTTP 是隔离受控 fixture。原证中的 S4 由模拟状态提供，不是认证结论。

补充探针按字节归档为 [probes.test.mjs](fc-fix-independent-retest-20261021-probes.test.mjs)，SHA256 `4599aa376bbc2d349da9956fec48c85f50593e66fbf90dfe96a5c661143de740`。该文件保留原布局相对 import，必须复制到独立候选的 `launcher/test/` 再运行，不直接在 docs/testing 执行。不修改生产测试原件。

## 范围与身份

用户本次派单明确：只写 `docs/testing/fc-fix-independent-retest-20261021*` 和自有 tmp；不改产品、他人 testing、living docs、vendor；不 build/install/启产品服务/共享 lib/commit/push；不接 Main Chrome 或正式服务，不读 runtime/private 认证文件。按本次只读角色派单，不执行通用 fetch/pull 或构建 SOP。

依据：[AGENTS](../../AGENTS.md) §6A、[collaboration](../collaboration.md) §9/§11、[FC-01..04 专家合同](finder-control-ui-review-20261021.md) §5、[已批准实施计划](../plans/2026-10-21-launcher-control-closure.md)。本报告是同一控制页修复复验，不扩到 U4。

- A1 `candidate.json` SHA256：`d9edb7cbe5ee79a5bce4dc4a95a5aeb10244a5916ca4ac8e39481caff2840dc2`。
- 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`。
- A1 `tracked.patch` SHA256：`e9db3adcd68f45ae77a90134aaf05b0064a342f6bf502630564dfc7b8d9aa96e`，与当前 `git diff <productBase> -- launcher packages/dsh-pm-tool` 原始字节一致。
- 新 control SHA256：`adc77e145e6113b7114063e67d25a2df439a971cb78a3b4ec2f55d402f89ae53`；新 DOM test：`ef0de2e4880edf9221c7ccc890d8098ce3475e95ffce7e50a791cc0580008afd`。
- 17 项逐核：manifest=主树=Main 隔离树=独立副本；测试前后无变化。额外全部 launcher src 也三树一致。
- A0 `all-built-files.json` 所列 453 产物在 Main 隔离 lib 逐核一致且测试前后未变；只读字节校验，未复制、执行或写产品 lib。只证明本轮产物身份，不代替发布版本或先前功能门。
- 未跟踪新增文件不在 tracked.patch 内，由 17 项 manifest 绑定；不把 patch 单独当完整候选。
- 本轮只链接 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules` 供模块解析，没有安装或写依赖；软链不是操作系统只读挂载，不虚称已建立文件权限防护。

完整 17 源和 453 产物逐项期望/实际值、命令时间、日志指纹见 [r1-result.json](fc-fix-independent-retest-20261021-r1-result.json)。

收尾 11:27:45.950Z [final-check.json](fc-fix-independent-retest-20261021-final-check.json)：17 源和 453 产物仍无差异，两自有 mjs `node --check` 均 exit0，自有 Chrome PID96622 已退出。candidate.json 在原49+3复跑期间稳定，收尾时发生运行元数据追加：Main 写新 launcherPid95870/controlPort52477 并更新 launcherRuntimeBoundary；源码/patch/产物字段未变，因此不撤销绑定相同字节的本轮 AUTO/DOM结论。新运行/Finder记录只是新候选声明，本专家未连接、未审其原证，不转运行或认证PASS。下文“待重新认领”按本轮起始身份描述，不冒充已验证最新运行。

## 原 49 与新 3 项

环境：macOS/darwin，Node `v22.23.3`。Chrome headless，独立新 user-data-dir，未连接任何既有浏览器。补充执行记录 Chrome `139.0.7258.155`，自有 PID `96622`，测试结束用 `browser.close()` 回收。

独立根：`/var/folders/hk/r3xm2t6x7b9c_g_rg7cbw55w0000gn/T/pmtool-independent-fc-3ngENT`。复制完整 launcher/src、launcher/test 和 package.json；按原 `createRequire('../../packages/dsh-pm-tool/package.json')` 布局建包与依赖链接。子测试 TMPDIR/TMP/TEMP 均落自有根 `/tmp` 子目录，测试端口全部 `listen(0)`，不触及 Main 或正式端口。原 local-app 测试仅写自有临时 bundle/检查 shell 赋值，不执行启动器主体；原取消测试只拉起自有瞬时假 Node 子进程，不是 dsh。

| 组 | 命令 / 结果 | 原证 |
| --- | --- | --- |
| 原 launcher 全部 | 原 package.json 的 8 文件 `node --test`，49/49，exit0，11:22:37.736Z→11:22:41.098Z | [launcher49.txt](fc-fix-independent-retest-20261021-r1-launcher49.txt) |
| 新真实 DOM | `node --test test/control-html-sync.test.mjs`，3/3，exit0，11:22:41.099Z→11:22:54.791Z | [chrome-dom3.txt](fc-fix-independent-retest-20261021-r1-chrome-dom3.txt) |
| 专家补充 DOM | `node --test test/fc-independent-probes.test.mjs`，8 项：5 过/3 失败，exit1，11:24:56.372Z→11:25:16.182Z | [additional.txt](fc-fix-independent-retest-20261021-r1-additional.txt) |

原测试复跑入口，无安装/构建：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-fix-independent-retest-20261021-run.mjs r2
```

该命令另建独立 tmp 与新轮次原证，禁止覆盖 r1。完整原 49 项命令参数见 result.commands，不用 pnpm，故不声称独立执行或核验 pnpm 版本。

## DOM 测试有效性

新增 3 项使用 Puppeteer 新开真实 Chrome，以 `page.click`、原生键盘、生产页面脚本和真实 fetch 测 DOM；不是空 `querySelectorAll` stub，独立通过可认可其有限断言。

- 第 1 项覆盖鼠标展开、三个 fixture 选项、一次 Chrome 选择和重绘后 Enter/Escape；未覆盖 Space、选项键盘激活、完整 Tab 顺序、选择后 open 的最终负载、在途连选或焦点保持。
- 第 2 项覆盖晚到模拟 S4、菜单和 body theme 保留、关闭后停止 GET；未核根节点身份和实际 focus。`f.setState(S4)` 绕过真实 app/entered/Origin/认证，不是 FC-02 的真实工作台回告。
- 第 3 项确实延迟 GET，再动作 S3，再释放旧 GET，能覆盖旧读不倒灌。但 L121 在关闭前已释放旧读；L124 后只改 fixture，不形成明确“关闭时在途响应”有序链，其测试名称后半段证明不足。
- 3 项 fixture 的 action 全部立即响应、GET 全部 200；无 503、超时 Abort、pagehide 或慢 open，因此不能覆盖 FC-03/04 全部。
- 第 1 项读取 Chrome label 可能是乐观本地值，waitForResponse 也不等页面消费完响应；它等待真实 200，但不证明最新选择已最终保存。
- DOM3 测试未监听 pageerror、统计最大在途读或记录精确 Chrome PID；不影响已经断言的 DOM 事实，但不能扩大为生命周期/无异常全集。

专家补充通过的五项：Space/键盘选项/Escape归焦及同态节点身份；503 即使携带 S4 也拒绝且有效后继读恢复；3s GET Abort 后串行恢复（最大在途1）；关闭时确有 GET 在途、迟到结果不重建且不再读；真实导航触发 pagehide 后迟到 action 不更新离开页面。pageerror 收集均为空。这些仍是模拟 HTTP，不是认证或 Finder。

A1 作者历史日志保持原件：首轮 DOM 有 timeout/cancelled=1 与设施告警，后续 r2/r3 为 3/3；本专家 r1 是另一次独立执行，不改写历史失败，也不将所有历史错误无证据归因设施。

## 后续与停止条件

Main 修产品，本专家不自修。最小修复仍限 `control-html.mjs` 与相关测试：保串行只读但不能以动作忙长期禁读；动作/旅程与偏好请求分别管理或明确排队/禁用，保 latest selection；焦点须绑定选项稳定身份或明确可操作的回退，不只认 id。必须继续拒旧、关闭清理与失败恢复，不用时间模拟 S4。

Main 交新 manifest/patch/两树指纹后，复跑原49、新3、本轮3失败和受影响5通过；若进一步动 server/编排，另列受影响安全/取消回归。任何产品新字节使相应 A1 结论失效，不能拿此报告认证修后。

FC-01 的有限 AUTO/DOM事实可保留；FC-02 只认可“动作结束后晚到模拟 S4 可同步”；FC-03 的本轮网络恢复断言通过，不等安全 GUI全集；**FC-04 FAIL**。Finder 与真实 mount/snapshot/合法 entered S4、原 BA-JOURNEY 和完整 batchA 仍未获本报告 PASS；旧 PID83992 不是 A1 装载证明，新 PID95870 也不由本轮模拟测试背书。

本轮不启停任何产品实例，不读 runtime/private、凭据、home/profile，不改正式服务或 Main Chrome；不改他人 testing、living docs、vendor、产品，不 commit/push。开发侧继续当前修复与补测，不以本报告放行 U4、发布或正式切换。

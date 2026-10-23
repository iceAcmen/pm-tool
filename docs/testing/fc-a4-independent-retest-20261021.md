# A4 独立复验有限报告

> 给 Main、项目负责人及后继专家使用：记录 A4 两项修复的独立复跑、确证缺陷与有限 AUTO 裁决；不替 Finder/真实认证完整门签字。

2026-10-21，trae，独立测试专家。依据本轮派单、[父任务与分工授权](../../reports/all-pending-acceptance-execution-20261021.md)、[A3 报告](fc-a3-independent-retest-20261021.md)、AGENTS §6A、collaboration §9/11。先写[计划](fc-a4-independent-retest-20261021-plan.md)，只在获授权范围执行。

## 1. 结论

**有限 AUTO：FAIL。** A3 两项确定 P1 在原指定条件及扩展等待点已局部 PASS；既定原件全部 exit0。新增同根因 P1 一项，不能用既定回归全绿覆盖。

| 对象 | 有限裁决 |
| --- | --- |
| FC-A3-01 固定旅程浏览器 | 局部 PASS：probe/start/OS await 改偏好后，当前 argv、browser、nonce、回告仍归 Chrome，selectedBrowser 可为 Safari，下一旅程才采用 Safari |
| FC-A3-02 旧 S4 reopen | 局部 PASS：新旅程清 S4/confirmed/detail；无本轮回告只到 S3/false；当前回告早到 + OS 成功保持 S4；晚到回告正确到 S4 |
| 原 package 九文件、DOM、专家原件 | 局部 PASS：55/55、7/7、8/8、A2 9/9 + 实际10/10、最终 A3 13/13；全部 exit0，无 skipped/cancelled |
| 必要新探针 | 初轮24过/1失败；补验24过/2失败，两失败是同一产品根因，不是两独立缺陷 |
| FC-A4-01 / P1 | **FAIL：本轮有效回告已经 S4，迟到 OS 失败覆盖为 S6 且 confirmed=true；真实 DOM/生产 loopback/open 接线三路确证** |
| JSDoc | 局部 PASS：open 接缝注释已写 `void \| Promise<void>`；未运行静态类型门，不声称已完成类型检查 |
| A4 Finder/3212实际认证旅程 | 本轮 NOT_RUN，不签；Main-only 可补门仍待采证，不转 MANUAL_PENDING |
| batchA、发布、提交 | 不在本专家有限结论范围；未签整门，不 commit/push |

## 2. FC-A4-01 / P1

位置：`launcher/src/launcher-app.mjs:L160-173,L191-198,L235-242` 三路 catch；`launcher/src/launcher-core.mjs:L234-237` 的 failure 未清 confirmed。成功分支已保 S4，失败分支未检查是否本轮有效回告已进入。

最小顺序：

1. open 或旧 S4 reopen 开始新旅程；OS open Promise 尚未完成。
2. 生产 loopback 接收**本轮当前 nonce + 精确 expectedOrigin**，返回200、响应 state=S4；真实生产 control DOM 自动显示 S4。
3. OS 接缝 child 发 `exit(17)`；生产 `browser-open.mjs` Promise 正常转为安全错误。
4. app catch 把状态写为 S6，但 `confirmed` 仍为 true；同页 DOM `status=S6,confirmed=true,h2=暂时无法打开`。

初轮 P04-early-failure 在旧 S4 reopen 内存序列发现 `S6/true`，原日志[首轮原证](fc-a4-independent-retest-20261021-probes-additional.txt)。补验 P10 使用**生产 app/core/control-html/loopback/browser-open**，只替换 spawn 为自有 EventEmitter，不运行 macOS open；existing/owned/reopen 三路均 `enteredHttp=200,osExit=17,S6/true`，errors=[]，owned finally 仍正确丢一次 URL。见[补验原证](fc-a4-independent-retest-20261021-probes-r2-additional.txt)的 `current-S4-overwritten-by-OS-failure` 三条。

这是当前已确认进入后可见失败与权威字段矛盾，不依赖旧 S4 偷继承、不需要真实凭据；真实 OS 发生概率未测，不声称某实际 Finder 旅程已经遇到。受控 HTTP 来源与 nonce 是 fixture，仅签应用顺序/协议/DOM，不冒称真实 dsh 完整认证成功。

**最小修复合同给 Main：**

- 同一当前旅程已有有效回告 S4 时，迟到 OS 失败/超时不能覆盖为未打开；推荐保 S4，安全错误若记录仅作非阻断诊断。仅清 confirmed 不能恢复已经进入的权威事实。
- 无本轮回告的失败仍 S6/false，nonce 撤销；旧旅程失败、取消、替换后仍不得倒灌。
- owned finally 无论成功失败仍丢认证 URL 一次，不复投、不杀就绪服务、不改变认证/Origin/TTL模型。
- 重测三路当前 S4→OS成功/非零/error/timeout、普通无回告失败、旧S4重开四路、cancel/retry、完整既定原件。只修当前确证缺陷，不追加新功能。

## 3. 候选、复制与写根

- 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`。
- A4 candidate SHA256 `df94ef965b2d9dfc5d3ecc5d3fae15e975097bdeb550e18735d15ca6df50e87f`。
- tracked.patch SHA256 `ec841d28712dadf3b747225f09ecfe1f68db4952a0a4d3eadd88952cf2e3556c`，与当前 `git diff <productBase> -- launcher packages/dsh-pm-tool` 原始字节一致。
- A3→A4 实际差异恰为 `launcher-app.mjs`、`launcher-core.mjs`、`browser-open.test.mjs` 三文件，与 manifest 声明吻合。
- 每轮前后23源 manifest=主树=Main隔离树=专家副本；完整 launcher src/bin/test另核。既有453插件产物全项只读 hash 与 A0认领一致，零变化；不是插件全量回归。
- 自有副本 `/var/folders/hk/r3xm2t6x7b9c_g_rg7cbw55w0000gn/T/pmtool-independent-fc-a4-KGojXX`，复制 launcher src/test/bin/package 和23源；仅链接 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，不是 OS 只读保护。
- TMPDIR/TMP/TEMP 指向副本 `tmp`，headless Chrome 全新 user-data-dir，loopback listen(0)。不连 Main/个人Chrome/CDP、不读 runtime/private/真实凭据、不运行生产入口或 macOS open、不启 dsh。
- 原55含 local-app 只在自有 tmp 写壳、sh语法/变量头检查，不运行壳主体；cancel假Node子进程只在自有tmp，非产品服务。
- 本轮写根为 A4 前缀文件和自有 tmp；未监测全业务/系统目录，不声明全盘零污染。合成 token 字符串仅 fixture 标记，不是真实凭据。

## 4. 实际命令、环境与原证

环境 macOS/darwin、Node `v22.23.3`、独立 Chrome `139.0.7258.155`；不install/build，未独立核 pnpm版本。表中 UTC 时间可直接与原日志关联；完整 argv/cwd/退出码/日志 SHA256 在各轮 result 与[最终审证索引](fc-a4-independent-retest-20261021-evidence-check-r2.json)，初版索引原件保留。

| 实际子命令（专家副本 launcher cwd） | UTC 起止 | 结果 |
| --- | --- | --- |
| package.test 九原文件 `node --test` | 12:26:24.046→24.862 | 55/55，exit0 |
| `node --test test/control-html-sync.test.mjs` | 12:26:24.863→36.966 | 7/7，exit0 |
| `node --test test/fc-original-probes.test.mjs` | 12:26:36.967→55.622 | 8/8，exit0 |
| `node --test test/fc-a2-additional.test.mjs` | 12:27:56.413→12:28:41.841 | 9/9，exit0 |
| `node --test test/fc-a2-followup.test.mjs` | 12:28:41.842→12:29:28.051 | 实际10/10，exit0 |
| `node --test test/fc-a3-probes.test.mjs` | 12:29:56.289→12:30:41.213 | 13/13，exit0 |
| `node --test test/fc-a4-probes.test.mjs` 初轮 | 12:30:41.617→59.015 | 24/25，exit1；P04-early-failure |
| 同命令补验 r2，追加 P10 | 12:33:03.285→24.298 | 24/26，exit1；P04/P10同根因 |
| `node --check …-probes.test.mjs` | 执行时exit0 | 仅语法，不是测试PASS |
| final / evidence-check | 各JSON at/finishedAt | exit0，身份/归档检查，不代表 AUTO 通过 |

原专家8、A2两文件、最终A3 probes **逐字节复制且前后hash未改**；没有调整期望。A3-P11/P12 原内存与真实DOM现在都 Chrome/有效nonce，P13 无新回告 S3/false。A3-P03 默认真实5003ms；P10 偏好真实35001ms、70次读取、无先行投递。新增 P08 existing/reopen默认真实约5s，迟到exit/error不升级，nonce撤销。

原55 TTL例**在测试进程中替换 Date.now**，不是实际等10分钟、没有改系统时钟；本专家未新增10分钟实等待、不把A0/A3真实TTL旧证改签为A4完整门。受影响的nonce绑定/撤销/Origin在新例及原件重跑；TTL常数/时间判断未改，仅该逻辑有限继承。本轮明确禁启产品服务，不为补TTL越界。

复跑入口见计划与[runner](fc-a4-independent-retest-20261021-run.mjs)，轮次拒覆盖。最终现有原件：initial、a2、a3、probes、probes-r2、final；另 evidence-check。再次执行须新轮次/新前缀保历史，不覆盖这些日志。

## 5. 必要覆盖与边界

| 新例 | 实际覆盖 |
| --- | --- |
| P01两路/P02 | probe与owned start await偏好变化；S0/S2归属冻结，首投Chrome，下一轮Safari clean URL，不复投owned认证URL |
| P03六路 | existing/owned/reopen OS await + 早/晚回告，argv/browser/nonce一致，selectedBrowser独立可变 |
| P04八路 | 旧S4 reopen无/早/晚回告、普通失败、取消后迟到成功/失败、替换后旧失败；early-failure确定缺陷 |
| P05/P06 | begin-journey清旧confirmed/detail/step；probe/start八组取消/替换 + 迟到成功/失败；只自有接缝 |
| P07 | 生产loopback错误/无/control/null/跨authority Origin拒绝，旧nonce/重复/未verify拒绝，偏好变化后当前nonce仍200/S4 |
| P08两路 | 生产open默认真实5s，当前Chrome归属、nonce撤销、迟到不污染、不投第二次 |
| P09三路 | 生产DOM/app/loopback旧S4重开，菜单偏好变Safari不改当前Chrome；同页新回告S4/navigation1；关闭/pagehide后不重建不再读，不cancel/stop现有服务 |
| P10 | 生产DOM/app/loopback/open三路当前200/S4后非零覆盖S6/true，确证P1 |

既定原DOM7/专家8/A2两文件覆盖 latest串行、偏好503/网络/真实35s、读取503/3s abort恢复、关闭/旧响应、键盘菜单与焦点。新增检查仅针对A3修复及受影响窗口，不扩成全浏览器/全产品体验验收。

## 6. 作者原件及 Main 下一步

只读审 A4 author-red：旧实现两例确实分别 Safari≠Chrome、S4≠S3，TAP4过2失败，作者exit1；author-execution两个exit0，绿原件55及DOM7+原8+A3 probes合并28。索引保存每原件hash；红候选未完整独立认领，仅说明作者日志相容，真正独立结论以上述新副本执行为准。

A4 manifest 明确旧4194/A3首次3212原证仅历史，不作A4装载；本专家未动3212、launcher或个人Chrome，也未改他人报告。Main继续同一既有已认证owned3212 clean reopen采新证，**只能按新候选绑定**；本报告不能用一次S4截图证明新的本轮回告。

真实原证最小脱敏建议，Main可在 environment-only fixture wrapper 装**被动观察**：

1. 开始记录 wrapper正文安全副本/hash、A4/后继candidate hash、launcher PID/controlPort、既有3212归属与目标browser；旧A3记录不覆盖。
2. 包裹生产app的 verifyEntered/onEntered 仅转调一次并**原样返回**；nonce值只在内存映射N1/N2别名，记录时间、别名、verify布尔、before/after status/browser/confirmed。不改认证/状态/TTL，不额外调用verify消费nonce。
3. 对生产server挂被动 `request` / `response finish` 观察，仅记录方法、pathname=`/api/entered`、精确Origin类别、HTTP状态、时间及上述N1别名。不读/复制cookie、token、原始body/nonce，不新增请求、不替换返回、不手工POST假装真实workbench回告。
4. 若需要 body关联，必须靠原生产verify接缝已经收到的值内存别名关联同一次请求；无可靠关联写unknown，不能靠近似时间伪造N1关联。记录错误Origin/replay时仅安全类别/HTTP403。
5. 生产OS接缝可只记录浏览器标签/OS应用名、clean-vs-auth类别、调用与完成时间、exit/error类别；**不落argv完整URL/fragment/query**。真实control点击、3212新导航/PM进入、控制页S0/S3→S4及navigation数用现有Main GUI采证。

先修本报告P1后认领新candidate，原所有成功与失败历史保留；专家重跑受影响AUTO，Main再交新Finder/entered原证审签。当前允许继续缺陷修复/补测，不据有限报告开未授权新功能。

## 7. 收尾

[final-result](fc-a4-independent-retest-20261021-final-result.json)与审证索引核23源/完整launcher/453产物零变化，旧测试原件零变，所有命令已结束。日志可识别自有Chrome PID10614/10763/10842/11062/11177/11879全部ps不存在；DOM7未打印PID，不虚称完整PID清单。正常fixture清理，tmp保留供复核。

本报告只写A4前缀与自有tmp，不改产品/他人testing/living docs；不pull/install/build、不启产品服务/正式profile、不读runtime/private/凭据、不操作Main GUI、不commit/push。有限AUTO因FC-A4-01为FAIL；旧两项修复局部PASS与Finder未签分别保留，不混为整项通过。

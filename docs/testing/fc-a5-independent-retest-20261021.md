# A5 独立复验有限报告

> 给 Main、负责人及后继专家使用：记录 FC-A4-01 的 A5 修复、原件期望裁定和受影响 AUTO 复验；不替 Finder、真实认证或 GUI 总门签字。

2026-10-21，平台 trae，独立测试专家。依据本轮负责人派单、[父持续分工授权](../../reports/all-pending-acceptance-execution-20261021.md)、AGENTS §6A、collaboration §9/11、[A4 报告](fc-a4-independent-retest-20261021.md)。先写[计划与最小裁定](fc-a5-independent-retest-20261021-plan.md)，仅写本轮前缀和自有 tmp。

## 1. 有限结论

**有限 AUTO：PASS。FC-A4-01 在本轮认领的 A5 源码及受影响自动化范围内关闭；未发现新的本范围阻断缺陷。**

- 三路 existing/owned/reopen，本轮有效回告先到 S4 后，OS success/nonzero/error/default 真实5秒 timeout 均保留 S4/true；生产 control DOM、app 与返回状态一致。
- 无本轮回告失败仍 S6/false、nonce撤销；仅 verify 而未 onEntered 不算 confirmed；取消/替换后旧失败不倒灌。
- owned finally 成功、失败、超时均只弃一次首投 URL；生产 controller 已 ready 不终止、不再次启动，后续 reopen 只用 clean URL。
- 原56、DOM7、专家原8、A2原9+实际10、A3原13、自有最小纠正A4副本26、A5专项40全部 exit0，无 skipped/cancelled/todo。这些适用套件共169项执行，不是去重后的169个业务场景。
- **A4 原件26中25过/1失败、exit1保留**：唯一失败是 P04-early-failure 的旧错误期望；不改原件、不把原命令写成全绿。最小裁定见§3。

不签 Main A4 N1 correctOrigin200/S4、N2 reopen仍S3的真实旅程/client桥诊断，不把该项归入本轮纯AUTO或因AUTO通过而关闭。Finder、真实 dsh 完整认证、GUI/样式/UX总门、batchA整门、发布与提交均不在本结论范围。

## 2. 候选与影响

| 项 | 本轮绑定 |
| --- | --- |
| 基线提交 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` |
| 产品基线 | `2a7603023bc54ef13d788e50069ee3fde4671bf3` |
| A5 candidate SHA256 | `9b0afc17ac171543184d3d885ce8ebd470c9d532855038c4b6dd063e841a9f6a` |
| A5 tracked.patch SHA256 | `3b12aa7b5ce3582a1fe291dd775981d4cb31ad010ce82cb767e56bab083b17b7` |
| 主树与隔离树 | 主树23源=manifest=隔离 `/private/tmp/pmtool-all-closure-20261021`=专家副本，各轮前后一致 |
| A4→A5 | 恰为 `launcher/src/launcher-app.mjs`、`launcher/src/launcher-core.mjs`、`launcher/test/browser-open.test.mjs`，与声明一致 |
| 插件产物 | A0 all-built-files认领的453项逐项hash一致、前后未变，仅作身份/不变性检查，非插件全量回归 |

tracked.patch 与当前 `git diff <productBase> -- launcher packages/dsh-pm-tool` 原始字节一致；新增文件另由23源manifest认领，不用patch或HEAD替代dirty候选。完整 launcher src/bin/test另行比较，包含原package九文件；源码副本没有任何产品修改。

只读审查：app三路catch均先保持原同journey检查，再以本轮 `S4 && confirmed` 保留已进入事实；core failure显式清confirmed，owned finally仍弃URL。默认OS超时、Origin/nonce/TTL模型及插件产物未改变。没有据此宣称静态类型或全部状态模型通过。

## 3. P04 旧期望最小裁定

[A4 报告§2](fc-a4-independent-retest-20261021.md)原修复合同已经明确：“同一当前旅程已有有效回告S4时，迟到OS失败/超时不能覆盖为未打开；推荐保S4”。P04 的 `outcome.endsWith('failure')` 将 `early-failure` 也要求为S6，与同报告P10及新合同矛盾。

本专家先逐字节复制、独立复跑原件，确证其唯一失败为 **actual S4 / expected S6**；随后仅在自有 `fc-a4-corrected.test.mjs` 加三行：

```js
    } else if (outcome === 'early-failure') {
      assertState(f.app, 'S4', 'Chrome', true)
      assert.equal(f.app.verifyEntered(current), false)
```

这是在原failure分支前单独分流，不删除或放松普通failure的S6/false、取消/替换、nonce single-use及P10断言。审证器验证“删去这唯一三行”后副本与原件全文完全相同。纠正副本26/26 exit0；原件与原exit1保持。

| 原件/副本 | SHA256 |
| --- | --- |
| A4原件及原样副本 | `9a3e015baecea113a415f778299a16266a525044e03395c911422d8ba3af7ab6` |
| 最小纠正副本 | `a6504222bb9f8ad29015a32d8403294632c45c5571d55b947cc1e97cfce3267e` |
| [完整统一diff](fc-a5-independent-retest-20261021-a4-oracle.diff) | `c8d935e0e91716cb2ab09c25ba49cbf82cdc0a43f6b403afded4a9a31b8dc22f` |

原8/A2两文件/A3/A4五个专家原件前后hash均不变，完整hash索引在[独立审证](fc-a5-independent-retest-20261021-evidence-check.json)。本裁定不扩产品需求，也不豁免真正失败。

## 4. 实际命令与结果

环境 macOS/darwin，Node `v22.23.3`、全新独立 headless Chrome `139.0.7258.155`。未install/build，未核pnpm版本。子命令cwd为专家副本 `…/pmtool-independent-fc-a5-H4S4qu/launcher`，完整绝对路径、可执行文件、argv、UTC起止、退出码、日志hash见[审证索引](fc-a5-independent-retest-20261021-evidence-check.json)及各轮result。

| 实际子命令，均以Node22执行 | UTC起止 | 结果 |
| --- | --- | --- |
| `--test` package.test九原文件 | 12:51:13.571→14.492 | 56/56 exit0 |
| `--test test/control-html-sync.test.mjs` | 12:51:14.493→24.692 | 7/7 exit0 |
| `--test test/fc-original-probes.test.mjs` | 12:51:24.693→46.052 | 8/8 exit0 |
| `--test test/fc-a2-additional.test.mjs` | 12:51:54.846→12:52:39.718 | 9/9 exit0 |
| `--test test/fc-a2-followup.test.mjs` | 12:52:39.721→12:53:28.651 | 实际10/10 exit0 |
| `--test test/fc-a3-probes.test.mjs` | 12:53:12.577→58.673 | 13/13 exit0 |
| `--test test/fc-a4-original.test.mjs` | 12:53:12.577→35.002 | 25/26 exit1，唯一旧期望P04 |
| `--test test/fc-a4-corrected.test.mjs` | 12:53:36.306→56.774 | 26/26 exit0 |
| `--test test/fc-a5-probes.test.mjs` | 12:54:02.843→52.289 | 40/40 exit0 |

package九文件完整argv如下，在专家副本launcher目录执行；其余单文件命令使用同一Node绝对路径。复跑应使用新自有目录/轮次，不覆盖本轮原证。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --test \
  test/contract.state.test.mjs test/browsers.controller.test.mjs \
  test/app.loopback.test.mjs test/control-html.test.mjs \
  test/cancel.race.test.mjs test/journey-race.test.mjs \
  test/loopback-security.test.mjs test/local-app.test.mjs \
  test/browser-open.test.mjs
```

仓库根[runner](fc-a5-independent-retest-20261021-run.mjs)的setup/initial/a2/a3/a4-original/a4-corrected/probes/final均完成。a4-original外层exit0只表示已归档且仅有已裁定旧期望失败，**内层原测试exit1不改变**；不把外层绿当测试绿。`node --check`本轮专项exit0仅是语法；evidence-check exit0是审计完成，业务结论仍限定§1。

A3与A4套件各自拥有全新Chrome和fixture，A3/A4原件曾并行；无共享browser/profile/业务写根，复制的产品文件只读。A2及A3真实35秒偏好等待保持原件，不改系统时钟。package原TTL例只替测试进程Date.now，不声称本轮实际等待10分钟。

## 5. 专项原证与边界

[专项40原日志](fc-a5-independent-retest-20261021-probes-additional.txt) SHA256 `b6a1b3420a303822920007cbcee042059e5ca6e1d51cbb325f01cda14bb01614`。

| 用例 | 覆盖与结果 |
| --- | --- |
| P01 12组 | 生产DOM点击open/reopen→生产loopback当前nonce、精确expectedOrigin回告200/S4→OS success/nonzero/error/默认timeout；app与同页DOM始终S4/true/Chrome，navigationCount1、errors=[]；偏好Safari不改旅程归属 |
| P02 9组 | 无本轮回告，三路nonzero/error/默认timeout均S6/false；迟到entered403、nonce无效；迟到exit/error不升级、不复投 |
| P03 3组 | verify消费句柄但无onEntered，不等confirmed；失败S6/false、句柄撤销 |
| P04 6组 | 当前S4后cancel，迟到nonzero/error仍S0/false；owned finally仍弃一次 |
| P05 6组 | 新Safari旅程S3或S4，旧Chrome失败不覆盖；旧nonce拒绝，新S3句柄仍有效；owned后续clean reopen不重投token |
| P06 3组 | 生产controller仅fake child缝就绪；nonzero/error/默认timeout保S4，finally弃一次；cancel两次仍无terminate；后续clean reopen不再spawn |
| P07 1组 | core failure从相关旧状态明确清confirmed、保browser；begin清旧detail/confirmed。仅检查本次failure影响，不签其他状态全集 |

默认真实5秒原证：P01 existing **5048ms**、owned **5034ms**、reopen **5039ms**；P02三路均 **5002ms**；P06生产controller **5001ms**。未注入timeoutMs或替换时钟，仅将生产spawn替为自有EventEmitter。late exit/error吸收及nonce single-use另测。A4原与纠正副本P10三路真实生产DOM非零保S4均绿。

所有HTTP回告都明确属于可重建的协议fixture，不是真实已认证工作台；不以自造POST证明Main N1/N2或浏览器认证。原件安全/nonce/Origin负例重跑；TTL时间常数及逻辑未改，本轮不新增10分钟实等待、不接产品服务补门。

## 6. 指纹、写根与收尾

自有根：`/var/folders/hk/r3xm2t6x7b9c_g_rg7cbw55w0000gn/T/pmtool-independent-fc-a5-H4S4qu`。复制launcher src/test/bin/package和23源；仅链接已存在的隔离包node_modules，不安装、非OS只读保护。子进程TMPDIR/TMP/TEMP指向本根tmp。headless Chrome全新user-data-dir、loopback listen(0)，无Main/个人浏览器连接；合成token仅fixture标记。

[最终结果](fc-a5-independent-retest-20261021-final-result.json)及审证确认：每轮前后candidate/patch、23源、完整launcher、453产物和五个原专家测试件零变化。WATCH另外覆盖AGENTS、README、docs排除自有前缀、A4/A5原证；收尾观察到其他分工路径**14项变化（一修改十三新增，无删除）**，仅reopen-handshake-diagnosis前缀及A5/board。每项前后hash已原样保留；本专家未写这些文件、不为消除差异改回。living docs及A4/A5原candidate/patch/作者文件未变化。

未WATCH依赖内容、全系统/正式profile/业务数据根，亦未读private/runtime/真实凭据，**不声明全盘零污染**。原56中的local-app只在自有tmp写壳、语法检查，不运行壳主体；cancel原件只拉瞬时假Node，不启动dsh。

所有测试命令结束。日志明确的Chrome PID **16284/16427/16508/16618/16617/16714/16789**均经ps证实不存在；自有root及runner无活动残留。原DOM7不打印PID，不虚称完整Chrome PID清单。fixture正常清理，tmp保留供复核。

作者红原件6/7 exit1、作者launcher56/56 exit0、合并DOM7+原8+A4原26为40/41 exit1，与其[author-probe-boundary](../../reports/all-pending-evidence-20261021/A5/author-probe-boundary.md)声明相容；仅只读审相容性，不借作者绿替独立复跑，红候选未完整独立认领。

## 7. 最小后继

1. Main只读接收本报告、审证JSON和oracle.diff，将FC-A4-01记为**本候选有限AUTO关闭**；原A4 FAIL及作者/本专家原探针exit1历史保留，不改写为原件PASS。
2. 另专家继续其 `reopen-handshake-diagnosis-20261021*` 自有范围审N2 client桥；本专家不接MainGUI、不推导新产品需求、不签GUI总门。N1真实原证与N2缺口依各自候选/原证判定，不能因本轮AUTO绿而继承成功。
3. 若后继修产品，先认领新candidate/patch与受影响产物，重测相应AUTO和真实旅程；若只补证且源码不变，独立专家按collaboration §11.5裁定继承。本轮无需追加产品文件改动或新功能。

本专家只写指定A5 testing前缀及自有tmp；未改产品、他人testing、living docs、build/install/pull、产品服务/profile/private/凭据/MainGUI或commit/push。有限PASS不是整项交付、发布或提交授权。

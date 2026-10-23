# A3 独立复验有限报告

2026-10-21，平台 trae，独立测试专家。只签本轮实际执行/审证范围；不签 Finder/S4 完整门、全 batchA、发布或提交。父任务持续执行与最终普通 commit 由 Main 协调，不授予本专家 commit/push 权限。

## 1. 结论与新发现

**A3 收口为 FAIL。** A2 三项原缺陷指定条件已获局部 PASS，既定回归全部 exit0；新增两项确定 P1，不能用原回归全绿或 Main 首次真实 S4 豁免。

| 项 | 有限裁决 |
| --- | --- |
| FC-A2-01 偏好失败/directopen/在途latest | 局部 PASS：原 X05/X06B 修复；两次503仅一次重试、就近alert且无open；网络失败/真实35s偏好超时后实际app/argv一致 |
| FC-A2-02 生产异步open | 局部 PASS：真实模块捕获throw/error/非零/信号退出及默认5s超时；app消费Promise，失败S6、撤nonce、owned finally弃URL；迟到与cancel不倒灌 |
| FC-A2-03 Chrome映射/投递模式 | 局部 PASS：发现label→生产app/core→`-a Google Chrome`；ordinary URL单参数；显式appWindow保留历史能力；实际OS兼容范围不扩到所有浏览器 |
| FC-A3-01 / P1 | **FAIL：existing投递等待中改偏好，实际Chrome却标Safari，原nonce失效。** 生产app及真实DOM均复现 |
| FC-A3-02 / P1 | **FAIL：从旧S4 reopen，无本轮回告仍S4。** 新nonce/clean URL不等新进入，旧成功态被误保留 |
| 原53、DOM7、原专家8、A2两文件 | 局部 PASS：53/53、7/7、8/8、9/9、实际10/10，均exit0 |
| Main首次3212流程 | 有限 PASS：允许原件显示菜单/Chrome选择、S2→S3、实际PM界面、server与control S4、control导航数1；Finder动作/逐命令OS结果/直接entered仍有缺证，不签完整门 |
| Main加载/current zoom | 有限 PASS：CDP保存响应含唯一同字节插件执行段；原生菜单仅该帧100%，不追溯旧GUI |

### FC-A3-01：投递归属在 await 期间被偏好改写

位置：`launcher/src/launcher-app.mjs:L124-130,L55-70,L199-201`，另有同类读取闭包风险于 `L147-154/L227-228`；页面 `control-html.mjs:L119-142` 的select分支在actionBusy前，browser-toggle未禁用。

最小真实DOM条件：生产app初始S1，选Chrome成功→点open→实际open接缝已收到`-a Google Chrome`，等待结果期间控制页仍有选择菜单→选Safari成功→释放OS成功。结果：仅一次投递Google Chrome，app/DOM均`S3.browser=Safari`，原Chrome nonce校验false，errors=[]。不需要认证、产品服务或操作Main GUI。

源码原因：`selectedBrowser`同时承担可变偏好和旅程归属；nonce已按Chrome铸造，await之后delivered读的却是Safari。journey未变，不能靠代际检查拒绝这种同旅程偏好变动。P11连续两轮、P12真实DOM两轮均失败，见 [r2原证](fc-a3-independent-retest-20261021-probes-r2-new-probes.txt)、[r3原证](fc-a3-independent-retest-20261021-followup-r3-new-probes.txt)。

Main最小修复合同：固定每次已批准投递的浏览器归属，用同一份值铸nonce/构argv/消费结果；后续偏好可保留给下一旅程，不篡改已投递归属。若改选被定义为撤销，应明确撤销旧旅程，不标Safari已投递、不复投owned认证URL。仅禁页面按钮不足以覆盖生产app并发入口。重测existing/owned/reopen、probe/start/open各await、cancel/retry、原latest串行及nonce绑定。

### FC-A3-02：reopen 误继承上次 S4

位置：`launcher/src/launcher-app.mjs:L40-45,L221-228`，关联 `launcher-core.mjs` 的confirmed字段生命周期。

最小条件：初次open→合法当前nonce验证/onEntered→S4；随后reopen，投递新的clean URL及新nonce，OS exit0，但**从未**验证或回告新nonce。结果仍`status=S4,confirmed=true`。P13 exit1，旧nonce已拒绝、新nonce不同、URL无query；这不是重放token问题。

原因：invalidateEntered增加journey并清nonce，却未清当前S4/confirmed；reopen结束以`status !== 'S4'`守卫，无法区分“旧旅程S4”与“当前新回告先到S4”。P06的早到新回告PASS不能覆盖此反例。

Main最小修复合同：新旅程开始撤销旧成功态，OS成功无本轮回告只到等待态；当前journey真实回告先到S4后OS exit0仍保持S4。confirmed同样不得沿用旧旅程。先保P13无回告红例，再补旧S4→新回告/无回告/失败/取消与reopen早到新S4四路，不改变认证模型。

## 2. 授权、候选与隔离

最新派单：只写 `docs/testing/fc-a3-independent-retest-20261021*` 及自有tmp，不改产品/他人testing/living docs；不build/install/pull/产品服务/正式profile/commit/push，不读runtime/private/凭据/个人Chrome，不操作Main GUI。按 [AGENTS](../../AGENTS.md) §6A、[collaboration](../collaboration.md) §9/11及父 [执行记录](../../reports/all-pending-acceptance-execution-20261021.md) §1/2。计划先写 [本轮清单](fc-a3-independent-retest-20261021-plan.md)，A2报告与mapping-plan只读引用。

- 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`。
- A3 candidate SHA256 `a614d2c827b4ad18e0acb39d57dd5c699f152928533d2544c29cce96341b84b4`。
- tracked.patch SHA256 `2977846ed45454463d1efa811e9d13b5a772a7a45abcfc5a864b111bcef90863`，与当前`git diff <productBase> -- launcher packages/dsh-pm-tool`原始字节相等。
- 每轮23源 manifest=主树=Main隔离树=专家副本，完整launcher src/bin/test另核，前后均一致；453产物沿A0 all-built-files逐项核，零变化。新增文件由manifest认领，不能以patch/HEAD代替全候选。
- 自有副本 `/var/folders/hk/r3xm2t6x7b9c_g_rg7cbw55w0000gn/T/pmtool-independent-fc-a3-QJTpA9`，完整复制launcher/src/test/bin/package及23认领文件；只链接Main隔离依赖 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，不是OS只读保护。
- 子进程TMPDIR/TMP/TEMP全部指向副本`tmp`。Chrome独立headless user-data-dir，HTTP `listen(0)`；未连接Main/个人profile/CDP，不执行macOS open。合成秘密字符串只是自造标记，不是任何真实凭据。
- 原53内local-app仅自有壳语法/变量检查，cancel仅自有假Node子进程；不启动dsh。既有lib仅读hash和插件执行段，不build或执行插件。
- 未监测全系统/业务目录前后，不以本轮未主动触碰宣称“全盘零污染”。链接依赖未安装或写保护；不读禁止根来补此声明。

## 3. 实际命令与结果

环境：macOS/darwin，Node `v22.23.3`；独立Chrome `139.0.7258.155`。未install/build，未独立核pnpm版本。各命令/UTC时间/退出码/日志SHA256均在 [审证索引](fc-a3-independent-retest-20261021-evidence-check.json) 与各轮result。

| 轮次 / 实际子命令 | UTC时间 | 结果 |
| --- | --- | --- |
| initial 原package.test的9文件 `node --test` | 12:00:52.896→53.772 | 53/53，exit0 |
| `node --test test/control-html-sync.test.mjs` | 12:00:53.773→12:01:03.730 | 7/7，exit0 |
| `node --test test/fc-original-probes.test.mjs` | 12:01:03.734→22.870 | 8/8，exit0 |
| `node --test test/fc-a2-additional.test.mjs` | 12:02:11.536→56.785 | 9/9，exit0；POST真实35000ms |
| `node --test test/fc-a2-followup.test.mjs` | 12:02:56.797→12:03:42.727 | **实际10/10**，exit0；POST真实35002ms |
| probes `node --test test/fc-a3-probes.test.mjs` | 12:04:07.607→51.354 | 9过/2失败，exit1；其中P02是探针条件错误，P11产品失败 |
| probes-r2 同命令 | 12:06:54.385→12:07:40.295 | 10过/2失败，exit1；P11/P12产品失败 |
| followup-r3 `node --test --test-name-pattern=A3-P(02\|11\|12\|13) test/fc-a3-probes.test.mjs` | 12:09:16.526→22.003 | 1过/3失败，exit1；P02修正后绿，P11/P12/P13产品失败 |
| evidence-check / final-runner | 结果JSON中的at/finishedAt | exit0，只说明身份/归档检查完成，**不代表A3通过** |

原专家8和A2两文件逐字节复制，不改原件/期望。runner标签`followup11`为错误命名，TAP实际10/10；本专家两次过程更新曾误报11/11，已纠正，不修改历史日志。

| 新probe | 覆盖与边界 |
| --- | --- |
| P01 | discover真实label→生产app/core映射、默认/四浏览器ordinary argv、显式Chrome/Edge app能力；静态审bin接线 |
| P02 | 生产模块spawn throw/error/非零/信号/exit0，Promise与安全错误；迟到error/exit不重抛。首轮错误在throw后给“根本未返回”的假child emit error，产品无法持有；修正仅该不存在事件，原失败保留 |
| P03 | **默认真实5s**：首轮5002ms、r2 5003ms，owned S6/finally弃一次URL/nonce撤销，迟到error/exit不升级、不杀或复投 |
| P04 | existing/owned/reopen分别用生产open error/非零，S6、nonce撤销、无敏感标记进state/HTML、owned丢一次URL |
| P05/P06 | 三类cancel迟到成功/失败、早到当前nonce回告S4不降S3；替换后旧失败不覆盖新S4。是app内存/接缝测试，不是认证GUI |
| P07 | 生产loopback自有端口：错误/无/control/null Origin、失败旧nonce、类型、成功一次、replay、精确CORS；Host/action负例由原53覆盖 |
| P08 | 两次503→directopen只补一次保存→alert/无投递/无无限写；再选Safari实际投递恢复 |
| P09 | 网络断开后directopen实际Chrome；浏览器有透明重发，actions原证保留，不把网络请求次数当页面重试次数 |
| P10 | 偏好真实35003ms/r2 35002ms中止，70读、无先行投递；directopen重新保存Chrome后单投。未改时钟 |
| P11/P12/P13 | 确证FC-A3-01/02，详§1；P12真实生产HTML/app、仅OS结果为挂起接缝 |

复跑入口（仓库根，Node22）如下；原证已存在，runner拒覆盖，需新轮次才可再次归档：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a3-independent-retest-20261021-run.mjs initial
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a3-independent-retest-20261021-run.mjs a2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a3-independent-retest-20261021-run.mjs probes
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a3-independent-retest-20261021-run.mjs probes-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a3-independent-retest-20261021-run.mjs followup-r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a3-independent-retest-20261021-evidence-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a3-independent-retest-20261021-run.mjs final
```

## 4. 生产接线、类型与安全审查

`bin/pm-launcher.mjs`实际import新`browser-open.mjs`，把同一函数交给app，control首开也await；旧detached spawn实现已移除。未只修闲置helper。app三路await真实结果，有失败nonce清理和owned finally，不执行入口测试来冒险拉服务。

旧合同变化清晰：Chrome/Edge默认从`--args --app=`改ordinary URL；README、core与原参数断言已同步，显式appWindow仍可用。稳定Chrome→Google Chrome映射属于落实既有选择承诺。`resolveBrowserOpen`仍非生产app入口，未知选择helper回退不等生产app回退；本轮不以helper测试宣称生产所有不可用浏览器兼容。

类型说明尚欠：`launcher-app.mjs:L24`仍注释`(argv)=>void`，新模块实际`Promise<void>`，无明确`@returns`；运行测试验证了Promise，不构成TypeScript静态类型门PASS。最小建议修JSDoc，允许测试的void接缝时注明`void | Promise<void>`，不需要新增类型框架。

生产open不读stdout/stderr，throw/error统一安全文案；上述生产模块错误进入app不含合成秘密。app仍拼接其他probe/controller err.message，本轮不将生产open的脱敏结论泛化为所有上游错误源安全。超时仅结束等待/unref，不杀浏览器/dsh，也不保证OS命令/已投URL被撤销；迟到结果不更新状态不等撤销已发生外部导航。

## 5. Main 真实 Finder 首次流程只读审证

新增负责人/Main事实：“指针双击app→4194/control49483→选Chrome→owned3212/PID4480（5s就绪、生产open exit0）→个人Chrome12221收到合法首投→Swift AXPress项目管理→server/control自动S4”；专家**未操作/连接**这些进程或个人Chrome，只读允许的脱敏reports。

原件 [control-open-result](../../reports/all-pending-evidence-20261021/A3/finder/control-open-result.json) 有Chrome选择200、连续S2及step2、12:01:56.412Z动作200/S3；[s4-proof](../../reports/all-pending-evidence-20261021/A3/finder/s4-proof.json) 12:03:43.791Z DOM S4/confirmed、navigationCount1/polls248，与server S4吻合。host AX含地址3212与PM“项目工作台/建立第一个项目”，Chrome PID12221；[host-mount-ax](../../reports/all-pending-evidence-20261021/A3/finder/host-mount-ax.txt)文字一致。

专家实际看过menu.png/control-auto-s4.png：菜单含默认/Chrome/Safari，S4页明确“已由受认证工作台回告进入（Chrome）”。结合记录，**只签本次实际PM界面出现和同control自动显示S4的局部事实**，不以S4替代完整HTTP/认证门。首次来自S0→S2→S3的新owned流程，不被FC-A3-02的“旧S4 reopen”反例否定。

缺证最小项：

1. safe-app.json声明environment-only wrapper和文件hash，写的是“created only; no Finder action yet”；缺可审的非敏感wrapper正文/持续Finder指针动作原始记录。本专家禁读runtime，不为核hash越界。
2. 未到首次生产open逐调用argv/exit/时间独立原件；S3源码语义可作相容证据，不包装成已捕获OS exit日志。
3. entered HTTP响应未直接捕获，proof也明确承认；无直接本轮nonce关联/状态转换响应原证，不声称完整认证门通过。
4. 此一次真实Chrome收页可支持本次已运行Chrome路由，不覆盖冷Chrome、Safari/Edge/Firefox、关闭/失败/过期/replay全部GUI旅程。

Main后继reopen最小建议：只由当前control真实点“再次打开”，clean URL首投、不用旧token；保生产OS命令安全类别/exit/时间、目标3212收到新导航及PM进入、control导航数与轮询。**当前候选旧S4保持，单张S4或“仍S4”不能签新成功**；可补受控接收端本轮回告的非敏感关联标识/响应，不落盘nonce、认证URL、cookie。FC-A3-02修复后用新候选重新采当前旅程等待→新S4；不得为补证复制凭据或手工POST冒充真实工作台回告。

## 6. Main 加载和 current zoom 原证

[combo-exact-response](../../reports/all-pending-evidence-20261021/A2/loaded/combo-exact-response.json)及2,549,909字节响应原件hash `e9404eb6f474b191b7b284aa04cfe3211440fb5a74f526d1c6ff3e657c1b1d60`，与meta一致。独立比对：lib/client.js hash仍`5ae7808...`；剥末尾sourceMappingURL的执行核心1,671,075字节在响应offset875361唯一出现；meta所谓1,671,077字节segment是核心加combo `;\n`分隔符，hash `547a930...`正确。**整lib文件并非逐字包含**，不能把sourceMappingURL差异称产品不同。

事件是实际page Script/status200，`fromDiskCache:true/fromServiceWorker:false`。结合 [actual-response](../../reports/all-pending-evidence-20261021/A2/loaded/actual-response.json) 的PM mount及native-menu图PM可见，局部签“浏览器载入同字节插件执行段、PM实际显示”；不声称新的网络传输、全部插件模块图/所有页面完整门PASS。

[native-menu-100](../../reports/all-pending-evidence-20261021/A2/loaded/native-menu-100.png)专家实际目视菜单“缩放100%”，hash与JSON `1891b258...`一致，URL3205、PID29351/window23677。仅签2026-10-21 19:50该帧100%；cmd0是本次新动作，不证明早先截图一直100%，不得追溯所有布局/拖动/复制GUI。

## 7. 收尾与 Main 接续

[final-result](fc-a3-independent-retest-20261021-final-result.json)再次确认23源、完整launcher和453产物零变，candidate/patch未变。自有Chrome日志PID4385/4665/5107/5281/6429/6928均已不存在，关闭日志/ps核在审证索引；DOM7旧测试未打印PID，不虚称完整Chrome PID清单。所有runner子命令已结束，HTTP fixture清理，无需要等待的测试；tmp保留供复核。

Main接续只做本轮缺陷修复/补测/必要原证，继续既有父任务但不得以此报告开启新功能或签全门。文件级建议：`launcher-app.mjs`固定旅程浏览器与重置成功态，必要`launcher-core.mjs/control-html.mjs`同步状态/在途交互，相关测试加P11/P12/P13及早到S4反例；另修JSDoc。变更后新candidate/patch认领，重跑53/DOM7/原8/A2两文件/新负例并审受影响GUI继承。

本报告不改产品，不修改他人testing/living docs，不pull/install/build，不读runtime/private/凭据/个人Chrome，不启停3211/PID510、3212/Main或任何正式服务，不commit/push。A3暂冻结的本轮复验已结束；可以由Main依上述合同接续修复，旧失败原证与局部事实保留。

# ATF Combined Runtime GUI R1 有限独立审证

> 2026-10-22，trae，独立 GUI 审证专家，非开发、非执行。只审 Main 原件，供父协调者和后续专家领取子断言；不签 RA-AI06 整项、真实外网模型或父普通 commit。授权见[边界](atf-combined-runtime-gui-review-20261022-r1-plan.md)，逐文件/RPC/运行原码见[审计](atf-combined-runtime-gui-review-20261022-r1-audit.json)。

## 1. 有限裁决

**认证原因 FAIL；限流、部分失败不冒成功、正常恢复、busy 关闭保 PM 与 fresh 输入解锁有限 GUI PASS。真实取消 signal 未签，RA-AI06 整门未放行，release STOP。**

| 原合同切片 / 原件 | 结论 | 精确支持范围 |
| --- | --- | --- |
| 31/32、33/34：真实401中文原因 | **FAIL** | 两次真实网关请求已到，却返回并目视显示 `PROD_KEY_MISSING`，不是实际无 Key/gate 未接线。另门 ASK-AUTH-01 已确证，未签其修后 |
| 同两认证：停候选、无假计划/业务写 | **有限 PASS** | 每次仅 flash 一次网关请求；RPC kind=error，暂无确认落库结果，业务及文件前后相等。不能把此安全子签当原因通过 |
| 35/36：真实429与硬失败停链 | **有限 GUI PASS** | 单次 flash，中文“模型服务限流，请稍后再试”真实可见，kind=error、无本次成功/确认写。重复“副驾暂不可用”保留，未签完整文案/UX |
| 37/38：完整可解析计划正文后 terminal error | **有限 GUI PASS** | 两次网关 partial_error，RPC 汇总三个候选错误，失败没有变成正文成功或可确认计划，原业务不写；不虚称第三次 HTTP 已采 |
| 39/40：错误后正常诊断 | **有限 GUI PASS** | 同 r2 页面新请求成功，真实正文及“模型未给出可执行步骤”可见，业务不写；只签正常诊断，不冒合法计划确认/来源生成 |
| 41→42：busy、可达关闭、PM 保持 | **有限 GUI PASS** | 原状态/图见等待；执行原 log 明确 input/send/两模型车道及快捷问题 disabled，关闭按钮未 disabled，关闭后 copilot=false、shell=true，PM 原任务仍在 |
| 43：延迟结束后 fresh 新开 | **有限 GUI PASS** | 原 log inputDisabled=false，原图新空对话/输入区，无迟到诊断残留；不是保留旧对话/草稿，未实发关闭后下一问，不签完整重试旅程 |
| 41–43：关闭导致真正模型 signal abort | **未签 / 缺证 BLOCKED** | 关闭后 gateway seq7 正常完成且 close.finished=true；缺 caller signal/aborted finish 原件。关闭、UI 清空、迟到不显示均不等取消协议 PASS |
| RA-AI06、全部未验功能、父 commit/发布 | **NOT_SIGNED** | 原余件继续，不能以本轮子签或 SOURCE/AUTO 绿代替总门 |

依据为[RA-AI06 原合同](remaining-governance-cases-20261021.md#1-ai来源失效与确认守卫)、[最终对账 §4.3/§6](final-remaining-acceptance-reconcile-20261022.md)、[terminal 先行合同](ai-terminal-failure-20261022-plan.md)。未新增测试、mock、需求或取消按钮要求。

## 2. 声明、源码、产物和实例认领

原证根：[CombinedGuiR1](../../reports/all-pending-evidence-20261021/CombinedGuiR1/)。完整性核验针对 [continuation-index.json](../../reports/all-pending-evidence-20261021/CombinedGuiR1/continuation-index.json) **1537 声明**，不扩大产品签署范围；原 J03/O3/备份和其他 GUI 不在本次裁决内。

| 对象 | 核验结果与边界 |
| --- | --- |
| 1537 索引 | 逐 bytes/SHA 全相等；index SHA `2c1dd6628834258893c4ae8a36e656f71006cda455b29f6ab933746fd602ceb9`。审计时已有并行70+新增，另列 undeclaredAtRead，未读取内容、未纳旧声明、不判污染 |
| 候选 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` + `CombinedRepairR1/r2` 未提交冻结，version0.7.4，Main builder；不是 HEAD/version 单独证明 |
| 冻结 | `/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool`；107 去重声明中92插件项逐 SHA 匹配，15 launcher 仅认原声明，不冒全部在冻结树 |
| 编译输入/产物 | 515 包输入逐 bytes/SHA匹配；453 lib产物完整集合和 bytes/SHA 匹配。只审身份，不重复回归 |
| terminal 源 | `ai-client.ts` SHA `b0348f33a6a38202147819d9d8128f12c46f024fde08cb94258508faefcd0448`，等已签独立 SOURCE/AUTO 对象；保留原8/10/43/175和legacy/noEmit有限签，不新执行、不累计成GUI通过 |
| ask 原源 | SHA `3db897be1275cbbc2473f73e8eb71bb061365a2ddd882008b33698972905bf26`，仍为 ASK-AUTH-01 修前接缝；后继主树/修复不倒签这次实例 |
| compiled client | 1719054 bytes，SHA `09219cf81820294161dbdbdced09e73094b000a7d7e1d2e5b8c42f399fabb0db`，等 host-start、r2-start 与 loaded-binding 声明 |
| loaded 原完整响应 | 2597854 bytes，SHA `14414cd388b1c638a4c75863ea1f26972eab88d48f696b3d330d6b48785516f1`。仅去 compiled 尾部 sourceMappingURL 后1719019字节，SHA `a2dccdb9733c4df76f10ef8b6f792e0ad1aa42980f1458ffb8b14e99a16e3da5`；完整唯一段 offset875361/second=-1 |
| 本段历史实例 | host3260/PID60387→64680，gateway3261/PID60386，runtime `/private/tmp/pmtool-combined-gui-runtime-20261022-r1`。归档认领，不探活/启停 |
| 开关/同页 | `DSH_PM_E2E=0`，隔离 provider指3261、重试maxRetries0；production车道由真实设置记录prod，14状态pilot={}，深色1458×734/DPR2。执行log注明唯一EGO space13/p3 |

loaded 原件是12:16的 r1响应字节，ATF30–32 timeOrigin=`1792672220383.7`，33–43为重进后的 `1792672395333`。r2声明沿同冻结、同bundle，实际GUI/RPC可以有限关联；**没有另采 r2 完整 uncached 下发的 requestId/frame/cache/wire时点及 resolver 实际软链回读，不冒完整首载/缓存门**。resource transferSize 和 deliveryType=""也不等独立 uncached证明。host argv/cwd可核，不以插件身份代宿主 Git 身份。

continuation 后续新宿主 PID71922/备份新页属于别段，不当 ATF已运行实例。原 frozen107没有后继renderer或auth修复的新字节；不锁主树、活日志、服务或其他专家写面。

## 3. RPC与网关实际链

六个原事件文件按真实 requestId/rpcId 配对，五个响应已归档；42只有请求、未采返回。宿主HTTP200是RPC信封传输，前四业务kind=error，不当模型200或成功。event.at是排空时点，不用于反推wire因果。

| 原件 | requestId | rpcId | 实际依赖与命令结果 |
| --- | --- | --- | --- |
| 32-auth | `24317.761` | `5a588dec-f3a7-4749-931a-28fbdd942ecf` | seq1/auth/flash；PROD_KEY_MISSING |
| 34-r2-auth | `24317.927` | `2fb9b095-f93e-429b-9edc-008c8ddc5eb6` | seq2/auth/flash；同错误 |
| 36-rate | `24317.928` | `9196e270-e676-4c60-a792-80ea0ba9aace` | seq3/rate_limit/flash；中文限流error |
| 38-partial | `24317.929` | `29bcdfb6-9d57-4bea-91e4-b2df0f7f766c` | seq4 flash→seq5 pro；kind=error，汇总flash/pro/glm三候选失败 |
| 40-normal | `24317.930` | `2d3874a6-90dd-4938-814e-965b1ca2a6e5` | seq6/success/flash；原文正常诊断 |
| 42-close | `24317.931` | `06c1686c-b909-41c5-9324-2ca527df049a` | seq7/success/delay8000；无本次RPC返回原件 |

每条模型BODY的用户问题与宿主request对应，不是用seq推猜。gateway脚本真实 auth/rate分支发401/429，partial分支先发完整正文再error/end；请求/close原日志及独立命令RED交叉支持。**本包未归档模型HTTP响应body/status抓包，401/429不伪装成完整wire原件**。partial文本含合法task.update/assignee、t-0004真实存在和完整JSONplan；未重跑parser/validator，原合法性协议门仍按既有独立签。

第三候选glm只在RPC错误汇总中，没有第三次网关POST/partial响应，原因不再诊断、不编造。35/36仅单候选中文限流语义与停链通过；36/38双“副驾暂不可用”、38“免费池”措辞仍留原件，不自动宣称文案去重/生产车道所有文案PASS。

## 4. 认证误诊与另门

[raw-continuation.md](../../reports/all-pending-evidence-20261021/CombinedGuiR1/raw-continuation.md)明确纠正 Main 原“缺环境key gate”误诊：seq1于12:31:45.995Z已到gateway。随后精确认领60387的argv/cwd/3260、TERM与listenerGone，r2于12:32:53启动64680，增加dummy套餐变量仍seq2真实401/同PROD_KEY_MISSING。

这不是补真实用户Key，不是系统认证必须本人动作，不转MANUAL_PENDING；r2启动记录里的“dummy enables provider selection”是当时设施解释，**不是已经验证的根因**。prod设置和第一请求已经反证“原gate未通”。本轮仅认归档restart记录，未采独立原lsof/ps/TERM逐命令stdout，不扩大为完整停服务安全链PASS。

[ASK-AUTH-01 独立RED](ask-auth-feedback-red-20261022-r1-report.md)另门已有11用例：8控制绿/3必要红，exit0/1；错误定位到ask消息正则吞真实INVALID_CREDENTIAL。本报告只加GUI对应反证，不重复其诊断/tests、不修业务、不签修后；原terminal源级有限PASS不被上层新FAIL改写。

## 5. busy、关闭与取消分层

seq7请求12:36:46.177Z，41 busy状态12:36:49.323Z，42关闭状态12:36:52.228Z；gateway12:36:54.204Z记success、54.205Z记close.finished=true；43 fresh12:37:30.715Z，原log inputDisabled=false。

41图见三个等待点，输入/发送及模型禁用依据 execution12原log，关闭按钮disabled=false；42图PM原任务仍在，43图新对话为空。fresh空输入的发送按钮不可用不等busy仍挂；本次只签输入解锁，不虚报又发新请求或旧稿保留。

**seq7正常写完响应，不是早断流。** gateway监听的是response.close，finished=true只能说明该响应完成，不能证明caller signal曾触发/传播。42原events只有request、缺response，不补造abort/错误返回；也不能仅由其缺失判取消成功。未见caller signal、production aborted finish、cancel后禁止fallback等GUI绑定原件，原RA-AI06取消硬门保留。原ATF-03已签的模型协议SOURCE/AUTO不替代UI→signal链。

## 6. 逐图目视、零写与Runtime边界

14张原PNG **30–43逐张直接打开目视**：30开空副驾、31填鉴权问题、32错误指引、33重进填问题、34同错误、35填限流问题、36限流、37填partial问题、38失败汇总、39填恢复问题、40正常诊断、41等待、42PM保持、43fresh空输入。其文件SHA在审计中逐项绑定。

六组各三张原JPEG亦 **18/18直接打开**，文件名/sha/metadata见审计frames。32/34/38/40帧为输入与发问等待片段；36主要是输入清空的起始段；42三帧仍是发问前输入状态，不是关闭/abort全过程录像。最终结果由对应PNG/状态/RPC补足，不能把18帧说成完整连续旅程。没有重拍/拼接/缩放生成代证；未签浅色、多视口、200%、VoiceOver或matrix。

14状态对应293个pmtool原JSON，集合和 bytes/SHA逐项等roots。30–43全部业务（排除settings）及files/backups指纹相等，t-0004不变，没有本次确认账本写入。30→31真实prod设置及宿主session变化、后续新session/聊天变化另列rootChanges；故**不是全data零写**。原helper只扫描data/files/backups，不签exports/private/cache/正式资产或全盘零污染。

六事件文件观察到exceptionThrown=0仅是该捕获窗口事实。helper仅保commands网络、screencast与exceptionThrown，**不保consoleAPICalled**；没有全时段Runtime或console原件，禁止宣称“Runtime/console零错误”。原25.console的TaskForm null.checked崩溃是O3独立缺陷，仍归[另门](task-predecessor-checkbox-red-20261022-r1-report.md)，不混ATF、不重诊断、不用其旧缺证洗成无崩溃。

## 7. 原执行码与本角色验证

continuation **25原execution**逐项exited/outputComplete=true，18 exit0/7 exit1；0是采集执行成功，不是自动GUI验收。七个非零按原ordinal保留：

| ordinal / executionId | 原exit | 原失败内容（不扩大归因） |
| --- | --- | --- |
| 1 / `5cb17ecd91d48014e2303d81faba836b` | 1 | contenteditable不存在，fill3000ms |
| 2 / `30fc9b7712b1363a64089ab94790f57b` | 1 | “保存更改”不存在，click3000ms |
| 14 / `3794f31780b24bf71fd770a2c40c8760` | 1 | waitForFunction15000ms |
| 16 / `2ea41a9ca46064d5dec8c99ecb08110f` | 1 | “更多”被div拦截，3000ms |
| 18 / `e05bba719ce24fea9995143670871788` | 1 | waitForFunction10000ms |
| 23 / `f7de52a73bf8d98a13d47fabb0e6361e` | 1 | 等编辑任务10000ms |
| 24 / `6e5205f46d508cee97b410a089da8d15` | 1 | “全部任务”button0匹配，3000ms |

这里“七个非零”不是execution7失败：ordinal7 `bc0e73137b0f78a5b5fac1c191750b26` 的r2启动exit0，原log ready=true/PID64680。完整argv/GUI源码不在execution元数据中，不制造原命令历史；原失败不因后补成功改码。

本角色环境macOS/bash、现有nvm Node v22.23.3；未执行pnpm/install/build/产品tests/verify/模型/browser/services/Git。沿既有pnpm11.28.5产物只读审证。实际自有命令（仓库根）：

```sh
node --check docs/testing/atf-combined-runtime-gui-review-20261022-r1-audit.mjs
node docs/testing/atf-combined-runtime-gui-review-20261022-r1-audit.mjs before
node docs/testing/atf-combined-runtime-gui-review-20261022-r1-audit.mjs audit
node docs/testing/atf-combined-runtime-gui-review-20261022-r1-audit.mjs close
```

语法检查exit0，before exit0；audit实际三次为**1/1/0**。首设施错误把raw子目录293JSON算进状态得到307而非14，已限顶层选择器；第二错误将RPC带缩进正文与DOM innerText作逐字比较，两auth空白归一后内容相同，其余三响应原文精确相同；仅读视图折叠空白，RPC/raw文件不改。两份`failure-audit-*`原exit1/stack保留，本轮未重跑产品测试。读取探索还保留rg缺失127、记忆路径缺失1及30未存缺省设置路径读取1，均非产品失败。

最终audit exit0：1537声明、515输入、453产物、293raw、14状态、18帧、6RPC及25原执行核实，**2518列明保护对象零漂移**。close结果见[释放原件](atf-combined-runtime-gui-review-20261022-r1-close.json)，不把审计绿或close绿改写为产品整项PASS。

## 8. 真正最小余步与释放

1. **认证另门闭环**：由不同开发及独立SOURCE/AUTO owner沿ASK-AUTH-01已派单修复/复验，Main统一认领新候选后只补一条真实401中文无效原因、停候选/零写及恢复的原GUI链。现有401已到，不重复配置诊断/加dummy或旧11tests；本角色不执行。
2. **取消原门**：先找已有GUI→caller signal→production aborted finish/不fallback原件；没有则Main按原合同补最小在途取消链，交专家判断。找不到保BLOCKED，不把关闭当abort、不擅改按钮/加mock。正常关闭保PM与fresh输入子签不重采。
3. **RA-AI06原余件**：真正无key、乱码、超长/上下文、原120s请求超时范围、取消及一次合法真实外网模型非空来源+重校仍按原合同/原证继续，未签处保NOT_RUN/BLOCKED；没有必须本人动作的实际证明，不自动MANUAL_PENDING。真实网关依赖成功不等外网模型。36/38完整文案/UX及关闭后下一问未被本子签覆盖，按原余件映射，不新开测试需求。

四create、实际再生成base和原来源已签范围照[AIremaining有限报告](ai-remaining-gui-review-20261022-r1.md)保留，不重做、不扩大。原SOURCE/AUTO236项及完整159文件1667/95verify签字各保其原范围，不是本轮重新执行，更不签父全部完成或普通commit。

**交回 Main，release STOP。** 仅新增本前缀自有文件；原证/产品/tests/其他testing/livingdocs/Git未写，服务/浏览器未探未动，无本角色待运行任务。不push/tag/release/service，不签父commit，不结束父持续验全部任务。

# A2 控制页独立复验与投递诊断

> 给 Main、负责人及独立验收协调者使用。2026-10-21，平台 trae，独立测试专家。本报告只签冻结 A2 的指定 AUTO、真实 Chrome DOM/隔离 HTTP 和源码诊断，不签 Finder、真实认证 S4 或 batchA 全门。

## 1. 有限结论

**A2 的控制页失败恢复收口为 FAIL。** 原 launcher 49/49、作者 DOM6 及原专家探针8独立通过；A1 三项失败的原复现条件均已修复。新增偏好失败路径仍有确定 P1，不以原测试全绿豁免。

| 项目 | 裁决与范围 |
| --- | --- |
| 原49、DOM6、原探针8 | **有限 PASS**；三组独立 exit0，分别49/49、6/6、8/8 |
| 慢 open 时读 S2、DOM 点 cancel、旧 POST 拒绝 | **有限 PASS**；生产 app 旅程被撤销，释放 ready 后无投递；另送明确旧 S3 响应，页面仍 S0 |
| 偏好成功路径串行 latest + open 等待 | **有限 PASS**；三次选择合并为 Chrome→Safari，两个等待 open 只执行一个，生产 app/argv 均 Safari |
| 偏好失败后再次选择 | **有限 PASS**；503 后不自动无限写，再选 Safari 可保存和投递 |
| 偏好失败后直接 open / 已等待 open | **FAIL / P1，FC-A2-01**；POST.browser 为 Chrome/Safari，但生产 app 实际 browser 与投递 argv 为系统默认 |
| 关闭、在途、pagehide、焦点 | **有限 PASS**；指定用例无 pageerror，停止本页读写/DOM；关闭不是 cancel/停服务；菜单及普通 action 焦点可保留 |
| POST 35s 请求边界 | **有限 PASS**；真实 elapsed=35003ms，68 次读，动作解锁，无 S4；未修改时钟 |
| Chrome `--args --app=` 实际收页 | **GUI 分支待原证 / BLOCKED**；源码与 macOS 手册确认参数路径，不确认“已运行 Chrome 忽略参数”是唯一根因 |
| `open` 异步失败处理 | **FAIL / P1，FC-A2-02（源码/接缝范围）**；精确生产投递函数不处理异步非零退出，模拟 exit17 后仍 S3 |
| Chrome显示名→OS应用名映射 | **FAIL / P1，FC-A2-03**；新Main干净probe明确exit1、`Unable to find application named 'Chrome'`，源码将label而非Google Chrome真实应用送给`-a` |

FC-A2-01 阻塞 FC-04 失败恢复收口。FC-A2-02 是旧基线投递接缝缺口，不是本次 control 新引入；两者均不等于已证明 Main 那次 GUI 的完整因果。未开 U4，不作提交/发布/正式切换放行。

**新到件纠正**：上表映射结论来自新增干净OS原证；§5保留到件前的待证诊断，不再将“已有Chrome忽略--args”置于已确定命名失败之前。先行[映射P1最小测试单](fc-a2-independent-retest-20261021-mapping-plan.md)给Main；映射后仍须OS exit与真实收页，不签GUI/S4。

## 2. 授权与身份

本轮负责人派单：独立复验 A2、不开发；只写 `docs/testing/fc-a2-independent-retest-20261021*` 与自有 tmp；不得修改产品/他人 testing/living docs，禁止 build/install/pull/启产品服务/正式 profile/commit/push，不读 runtime/private/凭据、不操作 Main GUI。追加只读诊断 Chrome 投递，同样不读 auth、不重放。

父任务来源：[全部在途执行记录](../../reports/all-pending-acceptance-execution-20261021.md) §1/2，持续验完与最终普通 commit 由 Main 协调；不自动赋予本专家提交权限。依据：[AGENTS](../../AGENTS.md) §6A、[collaboration](../collaboration.md) §9/11、[FC 合同](finder-control-ui-review-20261021.md) §5、[A1 复验](fc-fix-independent-retest-20261021.md)、[实施计划](../plans/2026-10-21-launcher-control-closure.md)。

- 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`。
- A2 candidate SHA256：`af8eabaff027b0e8ea0feedd9b4900fcf64ae2fbf2de339633b0c7b4e366d5c6`；各测试轮前后均相同。
- A2 tracked.patch：`02f1e3373b361a82b8384b79c4e2257aa7a49eec21affccf024ef5309dbda518`；与 `git diff <productBase> -- launcher packages/dsh-pm-tool` 原始字节一致。
- control：`dd0ad4253f648259658bde4e08699858d6d2e04fe12a80eae9a08cd5f81d2f64`；DOM6：`9c7af716bf2baee83059326996fe521b66ce2b363c0558fb78c46122471e715b`。
- 17 项 manifest=主树=Main隔离树=专家副本，测试前后相同；全部 launcher/src 额外逐核一致。未跟踪文件由 manifest 绑定，patch 不单独代表完整候选。
- A0 `all-built-files.json` 的453项，Main隔离 lib 实际hash均一致，前后无变；只读核验，未复制、执行或写 lib。仅认可同字节身份，不由此新签插件功能/正式版本。
- 副本根：`/var/folders/hk/r3xm2t6x7b9c_g_rg7cbw55w0000gn/T/pmtool-independent-fc-a2-XoRAaQ`；完整 launcher/src/test/package 复制，plugin声明与17认领文件复制；仅链接 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`。链接不是系统只读挂载，不虚称依赖已写保护。
- 子进程 TMPDIR/TMP/TEMP 均为自有根 `tmp`；HTTP均 `listen(0)`。fixture 状态中的3211只是纯数据，未连接/占用真实3211；openBrowser接缝仅记录argv，未执行 `open`。
- 原49内 local-app 仅写自有测试壳及运行壳语法/赋值检查，不启动入口；cancel仅用自有瞬时假 Node子进程，不是 dsh。

原证：[initial-result](fc-a2-independent-retest-20261021-initial-result.json)、[additional-result](fc-a2-independent-retest-20261021-additional-result.json)、[followup-result](fc-a2-independent-retest-20261021-followup-result.json)、[final-result](fc-a2-independent-retest-20261021-final-result.json) 包含逐源/产物hash、命令、时间、exit及日志hash。

## 3. 实际执行与逐项结果

环境：macOS/darwin，Node `v22.23.3`，真实 headless Chrome `139.0.7258.155`，新自有 user-data-dir。未用任何既有浏览器 profile/CDP，不声明独立核验 pnpm 版本。参考浏览器技能只读取指南；未连接 Ego/Main space，未安装/升级。

| 组 | UTC时间、命令、结果 | 原证 |
| --- | --- | --- |
| 原 launcher49 | 11:37:32.260Z→32.800Z；原 package.scripts.test 的8文件 `node --test`；49/49，exit0 | [launcher49](fc-a2-independent-retest-20261021-initial-launcher49.txt) |
| DOM6 | 11:37:32.801Z→42.512Z；`node --test test/control-html-sync.test.mjs`；6/6，exit0 | [DOM6](fc-a2-independent-retest-20261021-initial-dom6.txt) |
| 原专家8 | 11:37:42.513Z→11:38:00.831Z；`node --test test/fc-original-probes.test.mjs`；8/8，exit0 | [原8](fc-a2-independent-retest-20261021-initial-original8.txt) |
| 补充9 | 11:38:41.078Z→11:39:25.613Z；`node --test test/fc-a2-additional.test.mjs`；8过/1失败，exit1 | [补充9](fc-a2-independent-retest-20261021-additional-additional.txt) |
| 有序失败/焦点复核3 | 11:42:40.766Z→44.027Z；`node --test --test-name-pattern=A2-X(05\|06B\|10) test/fc-a2-followup.test.mjs`；1过/2失败，exit1 | [后继3](fc-a2-independent-retest-20261021-followup-ordered-failure-focus.txt) |

原专家8按字节复制 A1 原件，SHA256 `4599aa376bbc2d349da9956fec48c85f50593e66fbf90dfe96a5c661143de740`；未修改原 runner/report/probes。DOM6执行生产内联脚本，fixture是模拟权威状态，不是认证；仍保留A1报告对旧DOM3关闭在途断言偏弱的边界，由原专家8实际在途关闭用例补足，不改写旧用例证明范围。

| 补充ID | 步骤与实测裁决 |
| --- | --- |
| X01 | 生产app、假owned start等待ready；DOM open→S2→cancel→S0，cancelStartup计数增加；释放ready后app/DOM S0、opened=[]。PASS，真实进程回收另由原49覆盖 |
| X02 | cancel后释放旧open响应，响应明确为S3；DOM保持S0/actionBusy=false。PASS，证明actionTicket而非仅fixture代际守卫 |
| X03 | Chrome在途→默认→Safari→两次open→释放；只发送Chrome/Safari偏好和一个open；最大偏好在途1，实际argv Safari。PASS |
| X04 | Chrome偏好503、不改app；两次后继读无额外写；再选Safari保存成功并open。PASS |
| X05 | Chrome偏好503后直接open；payload Chrome、app.browser默认、argv只有`open URL`。FAIL；后继原条件再次FAIL |
| X06 | 首轮网络断开后浏览器自动重发Chrome，随后Safari已保存，实际Safari。仅有限PASS，不证明“仍未保存的latest” |
| X06B | 延迟503固定顺序：pending Safari、preferenceFlight=true、open在等待→释放503；无Safari保存，open.payload Safari但实际默认。FAIL，同FC-A2-01第二条件 |
| X07 | 偏好在途/open等待→close；连接中止，迟到偏好可改变fixture后端，但无open/投递/续读/重建，errors=[]。PASS，不声称已接收的后端写被撤销 |
| X08 | app慢open→close；本页POST断开，释放ready后app S3且投递一次；cancel计数不增、页不重建。PASS，关闭仅停止本页，不取消或杀ready服务 |
| X09 | 挂起POST，真实等35s；连接35003ms断开、actionBusy解锁、68次GET、DOM S1非S4；随后close再释放fixture。PASS，不把Abort当后端取消 |
| X10 | app到S5，展开details、聚焦finish-login；GET提供新的非敏感detail，生产render更新，焦点仍finish-login/details仍开。PASS，GET变更为fixture，不是认证 |

新增测试仍执行生产 `renderControlHtml` 和 `createLauncherApp`。只有探测、owned start、浏览器OS投递与有序网络条件为隔离接缝；不向页面注入替代处理器/状态机。X02故意旧S3、X10非敏感detail分别为拒旧/焦点 fixture；不能被解释为真实server认证。

A2作者首轮13/14、exit1原件保留，具体原异常为 `Node is either not clickable or not an Element`；作者r2 14/14与原49 exit0另存。本轮独立原8含同态节点身份断言通过，未复现原节点问题；不能因作者说明就把历史失败无条件归设施、也不抹除它。

## 4. FC-A2-01 最小失败条件与修复合同

源码因果：

1. `control-html.mjs:L104-117`：503使postAction返回null，saveBrowser退出，保留pendingBrowser，但finally把preferenceFlight清空。
2. `L119-132`：open只等待已有preferenceFlight，未为残留pending发起新保存；即使等待的是失败保存，也继续发open，browser只是payload字段。
3. `launcher-app.mjs:L191-196`：select-browser才改变闭包selectedBrowser；open忽略payload.browser。
4. `L124-128,L165-173`：决策及真实投递均用闭包旧selectedBrowser。页面乐观选值和open请求正确，不等于实际投递正确。

最小复现：初始app默认、页面S1→选Chrome→该select-browser返回503且未执行写→等保存退出→点open。实测`select-browser Chrome / open Chrome`，实际`["open","http://127.0.0.1:3211/"]`、server S3.browser默认。无需Finder、认证、服务重启或竞态就能发生。

第二条件：Chrome偏好挂起→选择Safari→点open→返回503；释放前page pending Safari/waiting true/actionBusy false，动作只有第一个Chrome写。释放后直接open Safari，但server仍默认。

**建议Main的最小修复范围**：优先 `launcher/src/control-html.mjs` 的偏好/open接缝及独立测试。open/retry在pending未保存时进行有界重试并核latest；如果保存仍失败，诚实保留选择和可重试入口，不静默改用默认。不得无限写或靠乐观payload自称成功。若改app使open显式接受browser，须同步认领该接缝、校browser白名单/旅程/取消/回告归属，不能未经测试只赋值。

重测：原49+DOM6+原8，X01/02/03/04/05/06B/07/08/10；偏好请求网络错误/503/35s超时后“重选”和“直接open”两路；核实际app.browser与open argv，不只核payload。若改POST超时/控制器，重测X09与cancel/ready所有权。产品新字节须新manifest/patch，不覆盖本A2/A1原证。

## 5. 附加 Chrome 投递只读诊断

负责人追加事实：新真实Finder wrapper launcher99281/control57895、owned dsh3211/PID510；真实CU选Chrome→open后server S3，Main核既有普通Chrome12221及隔离29351均无新3211页。**这些是本次负责人/Main说明，非本专家独立GUI事实**。本专家未连接上述进程/端口，不读 `finder/runtime-current.json`、safe runtime、auth或凭据。Main正在准备3212 Safari旅程，本专家未操作它或510。

### 已确认与未确认

- `launcher-core.mjs` 的 `openBrowserArgs('Chrome', url)`默认 `appWindow=true`，返回 `open -a Chrome --args --app=<url>`；所有app投递调用均未传false。URL不是`open`的URL操作数。
- 本机 `/usr/bin/man open` 明确：`--args`后参数送给应用main argv，**不由open作为待打开对象解释**。手册不承诺“给既有Chrome送新argv一定打开页面”，也不证明必然忽略。
- `pm-launcher.mjs` `openBrowser` 精确函数字节是detached spawn/stdio ignore/unref，未监听error/exit、未返回可等待Promise；`launcher-app`立即delivered→S3，owned首投后forget。S3仍不等S4，不能定性成伪造已认证。
- [delivery-check](fc-a2-independent-retest-20261021-delivery-check.json)执行精确投递函数字节，spawn仅记录并模拟后继exit17；返回S3且最终仍S3。**FC-A2-02确定缺口是不能反馈明确OS投递失败**，并非已经独立证明Main此次open命令exit非零。
- 四项依赖core/browsers/bin/loopback的主树=隔离树=产品基线hash，详情在checker；不是A2 control新增行为。
- [launcher README](../../launcher/README.md)同时写普通control tab与Chrome专用窗非原生，现有browsers测试明确assert `--app=`。因此不能将control容器合同偷换成“禁止工作台专用窗”。[Finder合同](independent-acceptance-batch1-closure-plan-20261021.md) §9/§13要实际收到工作台及认证回告，不以argv/S3为替代。

**有限裁决**：实际投递/收页分支待Main原证，仍BLOCKED；“已有Chrome忽略--args”是与源码/手册相容的待证解释，非唯一确证根因。源码确认当前没有URL事件投递保证和异步失败反馈，足以给Main最小修复方案与用例，但本报告不签OS收页或GUI根因。

### 最小修复方案与测试用例

推荐Main将Chrome/Edge生产投递改为普通URL操作数，复用现有 `openBrowserArgs(...,{appWindow:false})` 或把默认切tab；使用已发现的明确app路径/bundle标识可减少名称解析歧义。限 core/browsers/入口spawn与相应测试，不改认证、不读/保留/重放旧token。现有专用窗参数断言须作为本次明确行为修订同步，不当旧全绿自动继承。

异步spawn应返回有界可等待结果，捕获error及open命令非零exit并诚实落失败/建议；**只等待open命令结束，不用`open -W`等待浏览器退出**。exit0只证明LaunchServices接收，不等新页、mount或S4。对owned认证URL仍只进行批准的首投，失败后不偷偷再次投递，恢复用全新旅程/合法认证，不读旧内存或private文件。

| ID | 最小用例，由Main执行真实OS/GUI；独立专家审证 |
| --- | --- |
| FC-DEL-01 | 纯函数Chrome/Edge/Safari/默认的ordinary argv，无`--args/--app`；URL含空格/中文/&/#按单一参数，期望mode=tab |
| FC-DEL-02 | 生产投递函数注入spawn error及exit非零；有界失败、不S4、不复投、不泄密；exit0仍只S3 |
| FC-DEL-03 | **自有无敏感冷Chrome**，非敏感临时HTTP页首投一次，核页面URL/title/请求到达和进程身份 |
| FC-DEL-04 | **同一自有无敏感已运行Chrome**，第二个普通URL首投，核真实新页面/请求；对旧`--args`方式做有界对照，禁止命令路由到Main/个人Chrome |
| FC-DEL-05 | 原Finder入口、全新owned旅程、所选Chrome收到首投→真实mount/snapshot→合法entered→control自动S4；仅脱敏alias/hash/时间，不保存/重放句柄 |
| FC-DEL-06 | 已运行服务走干净URL，未认证不S4；关闭不杀ready服务；cancel/旧回告/replay仍沿原安全合同 |

本专家没有另跑LaunchServices实验：`open -a Chrome`可能路由到现有Main/个人Chrome，单建user-data-dir不足以保证OS URL路由隔离。当前已有明确源码结论；不为扩证越过Main唯一GUI边界。上述OS用例仍NOT_RUN，不能被模拟argv或Safari后继结果代替。

## 6. 复跑、收尾与交接

新runner按原布局复制测试并逐轮保留日志；已有轮次禁止覆写。以下为本次实际命令（仓库根，macOS+Node22）：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a2-independent-retest-20261021-run.mjs initial
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a2-independent-retest-20261021-run.mjs additional
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a2-independent-retest-20261021-run.mjs followup
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a2-independent-retest-20261021-delivery-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a2-independent-retest-20261021-run.mjs final
```

runner正常归档不等测试通过：补充/后继的子命令exit1如实登记，外层未抛不应当绿。完整原49的8文件参数、执行时间、日志hash均在initial-result.commands。投递checker exit0只表示诊断执行完成，其中FC-A2-02仍FAIL。

最终17源/453产物/全部launcher/src身份无差异。已记录自有Chrome PID99789（原8）、99912（补充）、706（后继）均不存在；后两者browser.close日志exitCode0。DOM6只有原before/after关闭代码且子命令exit0，未记录该Chrome PID，不虚称完整PID清单。全部测试runner子命令均已结束，HTTP fixture清理、记录inFlight0。未清除自有tmp以便复核。

Main接续：认领FC-A2-01和投递接缝修复，按最小用例补测、交新候选，再由专家判受影响复验；Main继续3212原证不等本报告授予Safari兼容/认证PASS。A2真实Finder/S4全门和batchA仍未获本报告PASS。不改产品、不build/install/pull、不启停产品/正式服务、不读auth/profile/runtime/private、不操作Main/个人浏览器、不commit/push、不改其他testing/living docs。

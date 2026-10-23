# 反馈剩余 GUI R3 独立封包审证

> 2026-10-22，trae，独立 GUI 审证专家，非开发、非 GUI 执行端。仅审 Main 已封原件，签实际有限切片；不签全部反馈、整页、父任务或 commit。R1 原件与 R2 更正均保留。

## 1. 结论与边界

**有限 PASS：普通精确 catch 的原文保真/错误 DOM/保稿，X02 普通标记正文及系统复制，X04 同值 quiet 新通知隔离迟到 copy resolve/reject，当前复制状态、可达关闭卡，O4 干净 ESC/X/scrim 与 description-only 按钮取消/明确放弃，O3 拒后保稿/解除关系后真实重试，O5 权威 S0→S1 的陈旧只读/明确重试更新。**

这些结论只覆盖下文切片。**完整反馈 GUI 门未闭**：原图没有覆盖错误全文的完整可见性；quiet 两轮不能合并成 60 秒；当前 copy 拒绝重试、同值完整 success 重计时、同世界卸载等仍缺证。O4 确认 ESC 本次未达预期，保留失败；O3 原因泛化及权限误导另归既有先行角色，不因保稿通过而关闭原因质量门。

本轮原句约束包括：

> 独立GUI审证专家，非开发非GUI执行。唯一写面docs/testing/feedback-remaining-gui-20261022-r3*新件，其他testing/产品/livingdocs/原证/Git禁写。不fetch/pull/build/install/test/浏览器/服务/凭据。
>
> 只读验证指纹、真实完整loaded段+source-binding102、U4r2freeze3257 PID88698、EGO13p1多reload及p2权威S1，不假时间段拼接。独立目视原图，签实际切片。
>
> 发现明显错误不要自己改；循环原因泛化/误权限已有独立先行cycle-feedback-reason-20261022角色审，勿重复必要红。
>
> 不签全反馈或commit，X06X09X10/焦点多选等缺段明列；R2将X03/X05精确M GUI N/A/X07AUTO-only须正确引用批准source，不再加fake-successGUI要求。收尾只自有报告seal，Main父goal继续。

具体授权覆盖通用拉取、构建、回归、livingdocs 与提交 SOP。本角色只新增本文、[只读文件审计脚本](feedback-remaining-gui-20261022-r3-audit.mjs)和[自有 seal](feedback-remaining-gui-20261022-r3-seal.json)。未执行 Main helper/seal、原测试、浏览器、服务或 Git；没有修改旧测试、原证、产品或上游。

## 2. 合同与候选绑定

已读 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[R1 原计划](feedback-remaining-gui-20261022-r1-plan.md)/[报告](feedback-remaining-gui-20261022-r1.md)、[R2 方法](feedback-remaining-gui-20261022-r2-method.md)、[A18 context 计划](a18-feedback-context-independent-retest-20261022-plan.md)/[原报告](a18-feedback-context-independent-retest-20261022.md)/[原16反例](a18-feedback-context-independent-retest-20261022-cases.test.tsx)、[TF-X08 原件](a17-transport-feedback-independent-retest-20261022-cases.test.tsx)、[O3/O4/O5 原同页合同](main-o3-o5-samepage-assertions-20261020.md)和[原静态/AUTO报告](oil-o3-o4-o5-patch-qa-20261020.md)。只按有效合同，不追加未生效设计矩阵。

原证根为 [FeedbackRemainingR1](../../reports/all-pending-evidence-20261021/FeedbackRemainingR1/)，以下简称 `E/`。实际读取 [raw-report](../../reports/all-pending-evidence-20261021/FeedbackRemainingR1/raw-report.md)、helper、seal 源文、执行索引/日志、49 状态及请求/响应/根索引；没有运行它们。原文是采集方事实，本文才是有限独立判定。

| 对象 | 本轮文件核验 |
| --- | --- |
| baseline/候选 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` + 102 项声明输入，不以 HEAD 单独代表 dirty 候选 |
| 102 来源 | A20V3 95 项 + U4 10 项覆盖去重；87 插件归 U4r2，15 Launcher 归 A20V3 父冻结。主树与各冻结逐项相等，missing/mismatch=0 |
| U4r2 | `/private/tmp/pmtool-u4-closure-20261022-r2`；runtime `/private/tmp/pmtool-u4-runtime-20261022-r2` |
| 运行实例 | [原 U4 manifest](../../reports/all-pending-evidence-20261021/U4/candidate-evidence-manifest.json)记 3257/PID88698，上游 cwd；本角色不探活、不读取 profile 凭据、不称现场重验 PID/宿主提交 |
| 原封包 | index 声明 230 文件，bytes/SHA 全相等，未列文件=0；index SHA `c3bedc14c65cf627432a7055a682ae2dbd074db906fe881c32bdde7fc18afc23` |
| source-binding | 102 项，SHA `91f2e1f2f46c6c100898054e39fbb2734031f546684d5554ac26a185a6cbff4b`，逐项回读与两份声明一致 |
| 完整 loaded | 2597521 byte，SHA `7d4312dae04a9e979246a6cd241fc51e2312c4b15b8ed3361ff2212e67d8b0e1` |
| 冻结 client | 1718721 byte，SHA `51234141fa6b34182492dbd294b60cb62320aa68aa8004111d6e5b12a6eee055` |
| 完整执行段 | 仅去末尾 sourceURL/sourceMappingURL、补宿主换行分号：1718689 byte，SHA `a0e29f76337ed9c509134e520e436bd866848f320ccc5cedd0fe6a4ec84d62c7`；offset875361，second=-1，唯一完整匹配，非短哨兵 |
| 执行/状态 | 27 个 exited/outputComplete 记录，21 个 exit0、6 个 exit1；副本与索引一致，49 状态与 observation-index 一致。这不是 27 个用例 PASS |

EGO `space13/p1`，最终 target `31B8437E488BC66089B89FE88199928C`，origin3257；[51-page-binding](../../reports/all-pending-evidence-20261021/FeedbackRemainingR1/51-page-binding.json)与原日志绑定 p2 同实例权威写入。前段状态00..27的 timeOrigin 为 `1792663660887.6`，30..51为 `1792664607721.4`；中间多次 reload/重入的失败保留，**不声称跨 reload 草稿或 Promise 延续**。只有16..24同执行世界的迟到复制可作连续链。

33 张本轮目视原 PNG 均为 **1470×746、深色、100%**；DPR2不当200%文字缩放。33张不是49状态全部图片或全部矩阵。若当前代码/产物再变，这些结论仍仅归上述冻结候选；受影响新候选须另绑定重审。

## 3. 错误正文、复制与关闭

| 原 ID/实际切片 | 原件和独立判定 | 不扩大的范围 |
| --- | --- | --- |
| TF-X08 / A18-X01 普通 catch | 07草稿→08精确 RPC error→09确认→10取消。原raw146 byte，与原测试逐字相等；生产只加一次“执行失败：”，DOM alert/assertive/error/警告，无Check/toast/详情/动作。08→10同正文 **70.167秒**，全部可见字段相等，根59项相等。**上述切片有限 PASS** | 原 TF-X08 自动反例走 quiet；本段实际普通，不能写“原TF-X08所有GUI通过”。该无action精确raw的单独系统复制未采；08/10图卡在视口外，不签完整错误可见性 |
| X02 普通 marker/TAB | 11精确action与空白原因→12明确discard→13 native copy→14/15保留。11→15 **71.005秒**；原marker大小写、LF/实际TAB/尾两空格/末两LF均完整。只关闭/复制、不执行正文删除命令；业务根相等。**原文/复制/持久切片 PASS** | 13/15只拍到卡下部，不称全文均在屏内。discard是真放弃，不是原草稿穿越关闭 |
| X04 resolve | 16真实copy pending（后定位失败保留）→17同世界恢复→18实际Gantt ArrowRight/quiet产生同一完整正文→19释放旧copy。旧完成后新卡copyStates仍空，无toast/详情/action；20当前复制显示已复制。**代际隔离及当前复制状态 PASS** | 未直接采真实generation数值；以同值新请求、copy清除、旧Promise晚到后不污染的实际链证明行为，不从短标记编造代际 |
| X04 reject | 21旧copy pending→22同值quiet error→23旧Promise拒绝→24当前复制。新卡不出现旧复制失败/已复制，当前复制显示已复制。**该切片 PASS** | 旧copy拒绝不是X09“当前copy拒绝”；不替X03同M success链、X07 timer或X10卸载链 |
| X02 quiet有限段 | 18/22原marker全值、alert/assertive/警告/两按钮/无动作，根相等。focus是实际Gantt `DIV`任务条，请求只改t9日期；冻结 `gantt.tsx` 的 `commitDates` 实际 `run(...,{quiet:true})` 接缝吻合。**通知/保真切片 PASS** | 18→21下一轮前24.901秒，22→24当前复制43.382秒；不能与普通71.005秒或两quiet轮拼成“quiet60秒PASS”。quiet不带action的精确raw全链仍未单采 |
| 实际可达close | 24当前复制后→24-closed，无modal，实际卡消失、无toast；**可达关闭卡 PASS** | 不签modal背后卡关闭、不签保稿穿越卸载、完整context后续恢复或旧copy跨close竞态 |

系统复制原件 [13-native-clipboard.txt](../../reports/all-pending-evidence-20261021/FeedbackRemainingR1/13-native-clipboard.txt)实读 **235 byte**，SHA `af456680d7845d3321d11320547a093511f988943512fd2cfe25fd1cbc0d58ab`，等于单次前缀+原220byte marker正文，包含真实TAB与末LF。不是把“已复制”当回读。20/24有当前native按钮成功状态，但没有各自独立系统文本回读，故仅签相应复制状态；不能把13的回读冒作后两次物理字节回读。

`19-copy-adapter.json`的旧调用1792664330449→controlled resolve1792664366055；`23-copy-adapter.json`的旧调用1792664390782→controlled reject1792664391173；value均等于完整235byte文本。前者19状态10:19:26.056Z、后者23状态10:19:51.174Z，晚到后copyStates=[]。这两个释放是**受控依赖完成/拒绝，不是系统剪贴板成功**。最终51记copy/copyReject=null，仅证明最终上下文无该对象，不冒每次恢复的全程日志。

RPC故障原件08/11/18/22均有唯一实际暂停请求、对应rpcId的 `server-response/result.ok=false/error.message`，正文逐字相等；HTTP200承载RPC失败，**不是假业务成功、不是host业务回滚**。实际line分别是t9完整save或仅日期变更，根不写。helper匹配器实际是 `/pm task update ` 前缀，未实现R1所要求的完整line/session精确白名单；本报告只认这四段实际命中的单请求，**不认证拦截器对任意其他请求的约束能力**。无自动refresh的结论也仅限实存事件/根，不从监听空数组证明全程无请求。

原helper在drain时给Network事件加`at`，不是原wire时间；45/46/50事件时间晚于相应状态图是队列回读，不据此倒造“响应在图后才发生”的时间轴或拼接虚假间隔。

## 4. O4 干净与未保存说明

| 原切片 | 实证判定 |
| --- | --- |
| O4-1干净ESC/X/scrim | 30干净新增→31ESC关闭；32实际X关闭；38干净scrim关闭。均无确认，**三入口有限 PASS**。31图可见新建任务按钮焦点环，仅认该次可见归还，不扩到全部关闭/焦点合同 |
| 原标题dirty取消保稿 | 09“放弃未保存修改？”→10取消，仅确认关闭，编辑抽屉仍在，title及其余可见字段不变，根零写；**有限 PASS** |
| O4-7/3 description-only | 33仅非控说明→34 ESC弹确认，不直接丢弃。36a真实按钮取消后确认消失，说明原值保留、焦点环在textarea；**dirty识别与按钮取消有限 PASS** |
| 同一说明X/明确discard | 36b X弹确认→37明确放弃后抽屉关闭，35/37根相等；**有限 PASS**，不是“取消之后未提交数据已保存” |
| O4确认ESC | 34→35 ESC后原图/JSON仍有同一确认层，未达“只关确认”。之后X被overlay截获而exit1。**本次未通过保留（FAIL观察，根因未判）**；36a按钮成功不能洗绿ESC或证明键盘全通过 |
| O4-6保存后不二次确认 | 44/46真实success图无抽屉、无放弃确认；**只签这两次成功出口的有限切片** |

description原值为“`O4 description-only：这一段未提交说明必须保留`”，33/35/36a相等。34图可见初始“放弃修改”焦点环；36a取消后的焦点在说明而非X，不能据此给原O4-5全链归还PASS。多选集合顺序/内容增减、dirty scrim、确认Enter、全部纯键盘与关闭焦点缺段均列在§8；不拿SOURCE/AUTO代替。

## 5. O3 真实拒绝保稿与显式重试

合法种子：26真实保存t8 `predecessorIds:["t-0009"]`；44真实snapshot再次回读t8同项目p-0001且同前置关系。41反选t9→t8形成循环，输入适配只按 [R2 §2](feedback-remaining-gui-20261022-r2-method.md)：当前真实input原生checked准备、当前生产onChange；**不是物理click/Space PASS**。保存仍为实际按钮，后续真实command/host，无合成响应。

- **41→42→43→44有限保稿/重试 PASS**：42仍是编辑t9、原title/description/assignee/status/priority/date等可见字段与41相等、已选1项、无成功toast；43解除该关系，其他草稿保留；44真实success、抽屉关闭、可见成功toast，实际snapshot回读相同稳定ID与新title，只有t9业务文件变化。
- **45→46有限补证 PASS**：45 RPC `663c0d3d-864e-4388-b18f-8133817702f7`，requestId16824.520，command `cmd-4f9b3673-31`。**外层ok:true仅为RPC成功传递，内层CommandResult.kind=error**；原文“任务操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。”不是注入、不是业务成功。45抽屉/前置选择保留；46解除后rpc `6d7ec3e5-01f0-4796-b754-a92de7d518a0`、command32真实success，command33 snapshot回读，抽屉关、toast可见。
- 原42等待“循环”exit1保留，`42-business-events-events.json`实际为空。后续42状态与45真实响应证明确有拒绝及泛化原因，**不能倒补42当时完整RPC response或把超时改为exit0**。45是补采，非42的同一个rpc。
- 41/42根59项无增删，业务根全相同；唯一变化是session_projcache日志文件。45前/拒后根全相同；44重试仅t9业务文件变化，46重试为t9与session。session日志与业务零写分层；封包没有session前后全文，**不宣称逐字验证了append-only或全盘零写**。

42/45原图的错误卡完全在视口外，title也可能因抽屉内部滚动离开当前画面；字段原值靠实存JSON绑定，不能称原图已目视全部原输入/错误原因。**有限保稿与重试通过不等O3原因质量、即时可见性、完整3秒TTL或全错误分支通过。**

原因泛化/“权限不足”误导已由 [cycle-feedback-reason先行计划](cycle-feedback-reason-20261022-plan.md)认领真实command+ResultCard必要红与最小修复合同。本角色只引用原45，不重跑红、不修产品、不额外关闭原因质量门、不假称先行角色已给最终结果。

## 6. O5 权威 S0→S1

**O5-1/2 的陈旧只读与明确retry更新有限 PASS**，不含刷新错误本身分类、全矩阵或恢复测试。

| 状态/动作 | 原证 |
| --- | --- |
| S0权威生成 | 47实际 `/pm task checklist add t-0009 O5权威清单检查点`，command34 success返回稳定UUID `08ca928f-7105-4de8-bee9-4019e5fdf8fe`，0/1；p1图/JSON为0%（0/1） |
| 原p1读取失败 | 48精确暂停 `/pm web snapshot`、ConnectionFailed控制；p1仍S0，出现“数据陈旧，重试后更新”。不是假snapshot |
| p2真实写S1 | 同space13/3257，49真实toggle该UUID true，rpc `cb4d9dcf-fe43-4192-b2d9-77c72d9c1003`、command36 success为1项已勾1；权威根只t9业务文件变化 |
| 原p1仍S0 | 49-original-still-stale-s0图/JSON仍0%（0/1）及陈旧标注，证明p2写入未被直接塞进p1 state |
| p1明确retry | 50取消干净表单/真实retry snapshot再开，同task显示100%（1/1）、陈旧标注消失。command37真实snapshot回读UUID done=true、progress仍0/manualProgress=null；49→50业务根相等，仅session日志变 |

客观值在相应状态中是只读展示，不在主save的named fields内；本次retry只发snapshot，不提交客观值、不改变既有progress。清单add/toggle本身是明确隔离fixture写入，**不称整个O5旅程零写**。39/40初轮只是证据不足→陈旧、未有值变化，不拿来替代47..50权威链。

48/49原图可见0/1陈旧标注、50原图可见100%1/1且无标注；47/48/50有打开抽屉过渡透明帧，不能据其签稳定整页样式或动画质量。

## 7. 原失败与独立目视记录

六个原exit1全部仍在 `E/executions/`，bytes/SHA核对相等：

| executionId | 原失败与有限解释 |
| --- | --- |
| `4741dace66fa3a597edd62fef7792da0` | focus选择器`button[aria-label^="任务 TF-X08"]`0命中；实际Gantt条为DIV/rolebutton，后同世界续采，不覆盖原失败 |
| `0bf179fdad29f04bc8e72855e2a1767f` | 保存更改0命中；不称成功提交或业务拒绝 |
| `0af1cd1fef32b17a33bdd396a833d50a` | 等.pm-shell 7000ms超时 |
| `618a7f804e173d995cf3e8a70c109b1c` | “全部任务”2处歧义，未成功执行目标动作 |
| `d98ddabc5a237938d413c72412df68d4` | X被div截获；35确认仍在，不称ESC取消或关闭通过 |
| `7c50034e906d6798a0aa9054aa6a1f62` | 42等循环原因8000ms超时；后状态/独立45响应明确为泛化原因，仍保原exit1 |

02..06两轮故障未命中/未持续，有实际正常save和写根变化；不计故障零写，不洗为TF-X08。**27-business-draft原图无PM，JSON fields/cards/dialogs为空**；是原物理前置交互失败/消失观察，不是O3业务拒绝成功，也不能从它确定根因归EGO。后reload的41不是原27草稿延续。

本轮通过本地图像工具实际目视33张，未生成替代图、未运行浏览器。以下文件均在E/，指纹继承已全核的index：

| 图组 | 实际目视文件及观察 |
| --- | --- |
| 精确原文/确认/复制 | `08-exact-error.png`、`09-dirty-confirm.png`、`10-confirm-cancel-retained.png`、`13-native-copy.png`、`15-marked-after-60-seconds.png`；抽屉/确认保留，后两张卡下部有红色原文、警告及已复制；错误卡顶部不全可见 |
| quiet/copy/close | `18-same-error-quiet-notification.png`、`19-late-copy-resolved.png`、`20-current-native-copy.png`、`22-same-error-quiet.png`、`23-late-copy-rejected.png`、`24-current-copy-after-reject.png`、`24-closed.png`；旧晚到无复制反馈，当前有已复制，最后无卡 |
| O4/原失败 | `27-business-draft.png`、`30-clean-new-task.png`、`31-clean-escape-closed.png`、`32-clean-x-closed.png`、`33-description-only-draft.png`、`34-description-only-confirm.png`、`35-description-confirm-cancel-retained.png`、`36a-confirm-button-cancel.png`、`36b-description-x-confirm.png`、`37-description-discarded.png`、`38-clean-scrim-closed.png`；35仍确认，36a说明留存/textarea焦点，37关闭，27无PM |
| O3 | `41-o3-checkbox-adapter-draft.png`、`42-o3-after-attempt.png`、`43-o3-same-draft-corrected.png`、`44-o3-retry-saved.png`、`45-business-refusal.png`、`46-business-retry-success.png`；拒后抽屉保留，修正后成功toast/关闭，错误卡不在画内 |
| O5 | `47-s0-task-objective.png`、`48-stale-s0-objective.png`、`49-original-still-stale-s0.png`、`50-retry-s1-current.png`；只读值与陈旧弱标注变化可见，过渡帧不当整页样式完成 |

不签其他未目视图片、有限screencast JPG为全程录像、console零error或整页颜色/读屏门。原执行索引经过sanitize，封包未单列完整argv/采证脚本；不虚称逐行审过全部执行命令或finally全过程。

## 8. 层级更正与缺证清单

**按R2更正，不恢复R1误加的fake-success GUI要求。** 批准依据为 [错误context最小方案执行顺序2/3/4](../plans/2026-10-22-feedback-error-context-closure.md)、[原SOURCE/AUTO计划授权/Oracle5](a18-feedback-context-independent-retest-20261022-plan.md)、[原16反例X03/X05/X07](a18-feedback-context-independent-retest-20261022-cases.test.tsx)及 [R2 §3](feedback-remaining-gui-20261022-r2-method.md)。原mock `success(message)` 与手动timer callback是AUTO fixture，不是host返回。

| 项 | 本轮状态 |
| --- | --- |
| X03/X05精确error M→success M→error M | 当前task update精确M GUI支链 **N/A**；原mock全链 **AUTO-only**，不是GUI PASS。真实可达close/普通真实success清卡仅按§3/5有限签；不声称所有宿主入口永远不能返回M |
| X07人为旧timer多次晚到 | **AUTO-only**，本次GUI不要求注入fake timers/手调callback；没有GUI PASS。自然等待不替旧timer竞争 |
| X06同完整真实success第二轮完整TTL | **GUI BLOCKED/未采**；不顺带判N/A，不把同标题或普通真实重试toast当同完整信封 |
| X08 error后真实quiet success/refresh | **GUI BLOCKED/未采完整链**；18/22是quiet失败，非quiet成功 |
| X09当前copy拒绝→明确copy retry | **GUI BLOCKED/未采**；23是旧copy拒绝，不替当前拒绝 |
| X10真实卸载/重挂/同世界旧Promise晚到 | **GUI BLOCKED/未采**；reload销毁世界不替该链 |
| X01普通/quiet精确全链 | 普通catch/保真持久切片有限PASS；精确无action原文系统复制、quiet对应完整切片及错误全文屏内可见性未全签 |
| X02 quiet60秒 | **GUI BLOCKED/缺完整独立时段**；两轮24.901/43.382秒不拼接，普通71.005秒不继承成quiet60秒 |
| O4-5确认ESC/Enter/关闭焦点 | 本次ESC未通过保留，Enter未采；按钮取消只签有限留稿，全部焦点合同未闭 |
| O4-8 predecessor集合顺序/内容增减、dirty scrim、全部纯键盘 | **GUI BLOCKED/缺段**；O3单input适配不外推物理click/Space或多选顺序 |
| O3原因质量/错误即时可见/全分支/3秒完整TTL | **未闭**；保稿/真实retry有限PASS不豁免原因泛化、权限误导和目视缺口 |

继承 [A18原报告](a18-feedback-context-independent-retest-20261022.md)的范围仍是 SOURCE PASS、独立context adapter20与新增16有限AUTO PASS；**原样20始终19绿1红FAIL保留**。没有重跑或改原第60行，不转述“原20全绿”，不以AUTO补未采GUI。

## 9. 本角色核验与交回

环境macOS/bash + 既有Node `v22.23.3`。pnpm11.28.5仅引用被测环境，未调用。产品测试/构建/GUI执行 **NOT_RUN（本派单禁止）**；这不否认Main原GUI执行，也不等本角色又执行又自验。

实际核验命令为只读 `cat/sed/grep/find/ls/wc`、Node内联fs/path/crypto/JSON解析和本地原图查看；两次内联指纹/完整段/正文/根差异核验exit0，非产品测试。可重复的本轮完整文件审计命令（仓库根、macOS）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/feedback-remaining-gui-20261022-r3-audit.mjs
```

18:39:22 +0800实际exit0：230文件issues=[]/extra=[]，102 sourceDrift=[]，27执行副本/49状态一致、六失败保留，四精确error-response相等、235byte系统原文相等、16组根差异分层、33目视图片尺寸相等。完整stdout保留于本次命令执行输出；脚本无写函数/子进程/网络/产品导入，不是执行原helper或seal。

探索错误如实保留：rg不存在exit127，改find/grep；指定memory文件不存在exit1，未创建或读其他项目；两次宽目录/日志输出过大，改限深度和定长输出；首次`ls`本新前缀不存在exit1是新文件定位，不是产品失败。没有因此安装工具、重跑产品或删除在途成果。

最终终核及自有文件指纹见[本报告seal](feedback-remaining-gui-20261022-r3-seal.json)。seal只认领本角色报告/审计脚本，不封或改Main目录，不把其他角色合法新件当污染。原index、R1/R2、原反例与102输入均按终核回读；原证不复制、不重写。没有服务/浏览器连接/builder占用或长运行任务，不操作正式与3248/3249/3255/3256/3257。

**交回Main：父goal继续，有限切片可按本文引用；未闭门与剩余补证沿原owner/原合同处理。** 原因质量先行角色继续其既有红测/修复合同；其余由Main在已有授权内补真实缺段，遇候选变更重新绑定。本文不是全部反馈、全部积压、普通commit、push/release或正式切换放行。

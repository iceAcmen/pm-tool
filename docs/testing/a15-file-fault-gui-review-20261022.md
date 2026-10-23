# F02 真文件故障补件有限独立 GUI 审证

> 给 Main 与接续专家核对 A13 冻结产品的 F02 原证、判定范围及最小补件；平台 `trae`，独立测试专家，2026-10-22。仅审证，不开发、不执行 GUI；本报告不签 A15/A16 新产品、整 RA-F02 或发布。

## 1. 有限结论

**本次“上传中明确取消/放弃并卸载、三根零残留”和“传输失败后同文件原生重选、真实暂存、唯一主保存、正确任务重开”切片有限 GUI PASS。没有本范围已确证的产品 FAIL。RA-F02 整 AUTO+GUI 门仍 BLOCKED。**

忙态文件 input 的 `disabled` 原探针未采；迟到宿主 201 分支未执行；StrictMode AUTO 未由本轮复验。不得以源码保护、224 帧校验或脚本成功退出冒充这些项通过。原 RA-F01/fresh-file/three-supplements 的已签切片、历史缺证和失败均只读保留。

| 原合同 / 精确切片 | 判定 | 范围与未覆盖边界 |
| --- | --- | --- |
| RA-F02 / 原生选件→请求延迟≥3秒→忙态→明确 cancel/discard→卸载 | 有限 GUI PASS | 真实原 UI、“上传暂存中…”、确认放弃及关闭均有原帧；生产清理与失效 interception 相互印证，三根全零差异。请求停在浏览器 Request 阶段，不证明宿主已接收字节 |
| RA-F02 / 取消后无悬挂抽屉忙态、无本区间卸载警告 | 有限 PASS | 抽屉消失、焦点回“新建任务”、后续 fresh 草稿可用；监听区间仅1条预期网络错误。不是全浏览器/所有卸载/所有 React 警告可靠性保证 |
| RA-F02 / 失败保标题、重置文件输入、错误可见、零写 | 有限 GUI PASS | ConnectionFailed 后真实 alert 与同标题，file input 为空；data/files/backups新增、删除、变更均0。不称“文件仍被选中”，实际需重选 |
| RA-F02 / 同原生22字节中文文件重新选取→真实POST201→stage | 有限 GUI PASS | 原 chooser/AX 精确路径、seq3 pass、真实201与暂存行/根相接；仅两个 staging 文件，无任务/资产提前写 |
| RA-F02 / 主添加一次→t2单附件共享fa1→正确任务重开 | 有限 GUI PASS | 唯一 task add/成功信封、原 raw、真实 `button.pt-name` 重开标题吻合；保存到重开/结束三根不变。重开 PNG/帧拍到表单顶部，附件在完整 DOM/raw，不谎称附件行也在该 PNG 可见 |
| RA-F02 / 文件 input 忙态 disabled及恢复 | BLOCKED，缺探针 | buttons原数据有disabled，但fields没有；源码 `disabled={staging}` 只作SOURCE旁证，不签真实控件属性。主“添加任务”原值false，不能写已禁用 |
| RA-F02 / 宿主已接收后迟到201回收 | BLOCKED / 本轮 NOT_RUN | hold release是Invalid InterceptionId，未发生宿主201。不能用seq3重试201或源码迟到保护替代该分支 |
| RA-F02 / StrictMode真实组件AUTO、整门 | BLOCKED / 本轮未复验 | 本轮限定GUI审证，不运行组件测试、不搭自建模型；无本轮StrictMode AUTO签字 |
| RA-F01 / 新切片及历史 | 仅上述相交切片可引用 | 本次复用已有fa1，支持本次保存/卸载不删共享源；不补旧最初native取消动作，不签所有刷新/卸载/共享GC或整F01 |
| 当前Main/A15/A16/全GUI/全功能/发布 | 不审签 | A15是补件目录，不是新client。A16并行panel开发不能倒签这个A13页面 |

切片拆分用于限定原 RA-F02 证明范围，不改用例、Oracle或新增全局禁用/取消按钮要求；可由 Main 采证的缺口不转 `MANUAL_PENDING`。

## 2. 授权、输入与方法

负责人本轮原句保留：

> 独立F02真实GUI限定审证，非开发非GUI端。只写docs/testing/a15-file-fault-gui-review-20261022*；不产品/其他testing/livingdocs/build/install/GUI/services/credentials/commit。读AGENTS/collab/remaining-journey RA-F02及RA-F01、a14-fresh-file/three-supplements已有原范围。Main原证reports/all-pending-evidence-20261021/A15/file-fault内观察/index/raw/execution/frames/console/commands；actual PRODUCT仍A13 frozen/private/tmp/pmtool-a13-closure-20261022、main3243/PID8391/target6D0411984B826559D61A327AF288F035。A15目录只是补件不认新A15 client。先前loaded完整uncached已独立审证A14/fresh-file-supplement/loaded，与本观察timeOrigin按实录核，不倒造旧时点。真实new F02上传中取消，CDP request hold31528ms→原UI上传暂存中→明确cancel/discard，生产abort令interception消失，release Invalid InterceptionId保；无host201/late201声称。next fresh task F02失败后重选保存，同原生22byte中文文件：CDP ConnectionFailed注入→真实alert保title/fileinput重置/零写→重新nativepick同文件→原productionPOST201/stage→明确主添加一次→raw新t2挂共享fa1一附件→真实pt-name重开。roots失败/取消均全0写，staged只有两staging，save只增t2+session，final字节/fa1/t1不改。observer33305准确argv/cwd核后TERM/end/ps exit1无进程，no host stop。原设施失败完整在observations：首次new旧drawer未关只dirty已cancel，错误原chooser不存在path后正确新图才Open；save type属性未显式selector失败但修设施exactbutton成功；raw未解record失败；secondreopen误点copycode不是reopen保，finalcorrected真实抽屉。不得把原exit0当每次成功，真实supplement缺父终码诚实保。请核冻结/src/lib/index/raw/events/时点与原PNGs/compositor目视，F02有限PASS/FAIL/BLOCKED细分，错误原件保留，是否缺busy disabled探针/迟201严格边界给最小补件，不伪GUI全项或整门PASS。产品A16开发并行只panel，新源不能倒签该旧GUI。保护所读A13/A14lib及全部输入，有限结论报告后释放。

依据 [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)、[remaining-journey RA-F01/F02](remaining-journey-cases-20261021.md)、[fresh原报告](a14-fresh-file-gui-review-20261022.md)、[three-supplements原报告](a14-three-supplements-gui-review-20261022.md)及其原计划。独立审证与GUI采集分离；本次限定优先于通用fetch/pull、build/install、完整产品回归、livingdocs及提交步骤。脏树不清理、不覆盖。

下文路径相对原证根 `reports/all-pending-evidence-20261021/A15/file-fault/`。只读原 JSON/NDJSON/raw/执行脚本/PNG/合成帧，以及 A13/A14候选与声明清单；不导入产品代码，不执行采证脚本，不读凭据文件、不连服务/browser、不中止任何进程、不加载vendor skill。自行新增专用审计脚本只读取数据、计算指纹，写本前缀审计/封存。

## 3. 冻结与实际下发

| 对象 | 独立实核 |
| --- | --- |
| A13候选基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；dirty候选不由HEAD单独认领 |
| 实际产品树 | `/private/tmp/pmtool-a13-closure-20261022`，514源/脚本/配置输入、453产物逐文件SHA全部匹配；包含394项src |
| 宿主归档声明 | `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`，来自候选/环境，本轮不操作宿主或探live git |
| candidate / tracked patch SHA | `d70267f974fb9aa8aaf496a4f1d49abef33d26d410b6a453eb4569fadaa9a51f` / `824d9c3c96095731580fac8edffbaced9998d5b8e245affbbb8c342e07df507b` |
| A13 client | 1702759字节，SHA `7f037fce5115157101afb64cef7b7fd0e470742ac3eb96a11cabe0a43e56ae7c` |
| A14仅保护核验 | `/private/tmp/pmtool-a14-closure-20261022`，515输入、453产物匹配；不是F02被测产品，不由此签A14功能 |
| 运行实例归档 | A13 main3243/PID8391，runtime声明 `/private/tmp/pmtool-a13-main-runtime-20261022`；本轮只读归档、不探活或直接读运行库 |
| 页面身份 | ready target `6D0411984B826559D61A327AF288F035`；全部19份有timeOrigin的页面JSON均为origin3243、`1792622511513.4`，与已审loaded一致 |
| 实际尺寸/开关 | CSS1440×718，PM1160×718，深色，DPR2；沿loaded pilot OFF。不是loaded记录的1440×900、原生200%或全矩阵 |

重新实读 `A14/fresh-file-supplement/loaded/combo-1.txt` 全字节：2581559 / SHA `69656e3d1164c9a26bea86a31138adc42167fc8abcacb66941ef7ed211b405fa`。按原loader去末尾sourceURL/sourceMappingURL并补换行/分号，完整A13段1702727字节 / SHA `c29382ca1c7f2e5f2a1ddbcbbccb4b0e92258142e585ab3b122ac0fd1c28289d`，offset875361、second=-1；200/fromDiskCache=false、requestId22802.160、frameId同target，非短哨兵匹配。

原reload wallTime=`1792622511.630559`，loaded结果22:41:53.285Z；本次observer22:52:05.179Z后观测沿同新timeOrigin。该新下发合法绑定本次F02，不倒造旧fresh首次上传页timeOrigin=`1792620662287.9`或旧上传时点。client hash用于本轮字节身份，不冒充tag。

关键源均包含在全清单核验：`stage-client.ts=3d47b8fb194cb221b7518c4f121aea93dc650b3bc1bdc1aaa8749b11b954b5d1`；`task-draft-materials.tsx=66af8221d089a2ad65fa4d831be218c4a78d3299c23239cfaf750497c4edc2ae`。只读源码确认cleanup中abort、generation/current防陈旧回填、失败input重置、input disabled及迟到stage回收；**SOURCE存在不替代这些分支的GUI/AUTO实测**。A16新panel不进入本次身份。

## 4. 原时间链与写入边界

### 4.1 延迟与明确取消

首次new22:52:14.108Z是在未关闭旧抽屉时改变草稿，随后 `cancel-1792623142866`保留；`before-abort.json`由第二次new覆盖，只认22:52:30.045Z的新空草稿基线，不认作首次new前态。初库已有合法p1/t1/fa1及最终字节，取消后“零写”不是空库，不能说剩0任务。

`abort-picker/path-action.txt`、path/selected均仍是不存在的 `pmtool-a13-native-input` 路径，原chooser图显示GoTo浮层。采集程序只查文件名子串和打开sheet而误报成功，不据该exit0认原生选件。`chooser-corrected.png`才真实蓝选 `pmtool-a11-native-files/QA 文件 原件.md`、22字节、打开控件可见；纠正路径完整AX转录未另落本包，不能把旧AX原文改成新路径。图、随后file input原名及暂停事件共同支持纠正后的有限选件链，不谎称静态图录到了Open点击全过程。

原 `faults.ndjson`：

- seq1 **22:54:10.706Z**，POST upload，Request阶段hold。`held.json.minimumHoldMs=3000`是计划值；实际releaseAfterMs **31528**才是实测。
- `held-busy.json` **22:54:23.610Z**：正确取消草稿标题、原file input名、“上传暂存中…”、无暂存行；roots与before全相同。
- compositor000074 **22:54:33.378Z**：真实“放弃未保存修改？”及放弃/取消；000075和 `abort-closed.json` **22:54:33.393Z**：抽屉消失、仍1项旧任务，焦点回新建任务。
- 原action明确查可见“取消”按钮→点击→“放弃”按钮→等待标题input隐藏。源cleanup在卸载时abort；后续失效interception与此行为相符。没有单独生产abort事件探针，不虚造网络loadingFailed/abort日志。
- release **22:54:42.235Z**，**22:54:42.399Z Invalid InterceptionId**。`abort-release.json`22:54:42.191Z早于实际release/错误，不能当错误后截图；其后三根不变由22:54:56新草稿基线及后续根支持。

请求未到宿主201，取消阶段未产生stage。`before-abort→closed`、`before-abort→release` data/files/backups新增/删除/变化全0；下一fresh基线仍相同。**只签所监视根与这一浏览器在途取消分支，不签“宿主收到字节后迟201已清理”或全盘零污染。**

### 4.2 失败、同文件重选与唯一主提交

22:54:56.611Z新草稿标题为“F02 失败后重选保存”，file input空。failure-picker与retry-picker的AX路径都精确为 `/private/tmp/pmtool-a11-native-files/QA 文件 原件.md`；两原chooser图蓝选同文件22字节。原件和既有真实下载独立回读均SHA **`87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`**，未复制源字节冒充GUI上传。

| 原事件/状态 UTC | 独立核对 |
| --- | --- |
| 22:55:45.541 seq2 fail | CDP `Fetch.failRequest(ConnectionFailed)`，真实连接拒绝；仅传输注入，不改业务fixture，不fulfill产品成功 |
| 22:55:45.551 console | 唯一原错误 `Failed to load resource: net::ERR_CONNECTION_FAILED`，属于该预期故障 |
| 22:55:54.276 failed-input-retained | 同标题保留、真实就近“暂存上传失败：Failed to fetch”、file input `value=""`；三根对before全0 |
| 22:56:29.268 seq3 pass | 重新原生选同文件；observer调用continueRequest原样放行，不替换响应/body/header |
| 22:56:29.292 response22802.293 | 唯一归档upload201；不是seq1/seq2成功。此包没有该响应body及staging sidecar内容原件，不倒造201信封 |
| 22:56:37.402 retry-staged | 真实一行“QA 文件 原件.md /22 B/sha87ef7d4f”，待提交1变更，错误消失，标题不丢 |
| 22:57:24.233 command run15 | 唯一 `cmd-8e972fe3-7 task add`，draft恰一个 `addFile(stageId=b3cb6d2ec4f56176c72d1d1c494603c5,clientId=c-1)` |
| 22:57:24.426 done16 | 同commandId success，t2/WBS2；随后snapshot17/18只有旧t1和新t2，唯一fa1 |
| 22:57:24.542 retry-main-saved | 真成功反馈、抽屉关闭、列表2项；000141短暂“提交中…”仅此主提交的旁证，不签延迟主保存/双点防重 |
| 22:59:10.157 corrected reopen | `button.pt-name`正确任务入口，真实编辑抽屉、input标题吻合、焦点输入；完整状态含“文件 fa-0001” |

根差异独立重算与observations逐项一致：

| 比较 | data | files | backups |
| --- | --- | --- | --- |
| before-retry→failed | 全0 | 全0 | 全0 |
| before-retry→staged | 全0 | 仅新增 `staging/b3cb6d2ec4f56176c72d1d1c494603c5.{bin,json}` | 全0 |
| before-retry→saved | 仅新增 `pmtool/tasks/t-0002.json`、宿主session内容变；无删除 | 全0 | 全0 |
| staged→saved | 同上 | 仅删除两个staging，既有最终字节无变 | 全0 |
| saved→corrected reopen→end | 全0 | 全0 | 全0 |

真实raw都有 `{version:2,record:...}`，本专家按结构解析，不把wrapper当task。四份raw指纹与end对应根全吻合；saved-task与raw t2语义一致。t2仅 `at-1→fa-0001` 一附件、progressLog空；fa1还是22:17:43的既有资产，**不是新fa2**。t1/fa1/p1/最终文件hash前后不变，既有资产与字节复用，没有重复资产或额外任务。本包未保存新stage bin/sidecar正文，本次字节不变依据归档根hash、原件/旧实际下载、资产raw，不声称本专家直接读了当前runtime字节。

## 5. 目视与console

实际目视 **12个PNG路径/12种内容hash、8个JPG路径/8种内容hash**，指纹在 `audit-r2.json.visual`；复看同图不增加数量。机器核验 **224/224 compositor帧**，22:52:05.268Z至22:59:41.362Z，非224帧全部目视或native系统sheet连续录像。

- 4个原生PNG：abort-picker旧chooser、chooser-corrected，failure-picker/chooser，retry-picker/chooser。旧GoTo失败与新真实选择分别保留；native窗口不在CDP合成帧中，不混称。
- 8个页面PNG：held-busy、failed-input-retained、retry-staged、retry-reopened-corrected、retry-reopened、retry-main-saved、abort-closed、new-1792623296611。看到了忙态、真实错误/恢复、保存反馈、误复制和真正重开。corrected重开图仅顶部可见，附件行由DOM/raw交叉核验，不用整innerText声称它在视口内。
- 8个compositor帧：000071忙态，000074放弃确认，000075关闭，000119网络拒绝UI，000127暂存/提交前，000141提交中，000159重开转场，000160稳定编辑抽屉。逐帧原时间/SHA在审计，不把转场当稳定布局验收。

observer确实注册console/pageerror监听，归档 `console.ndjson`存在且只有上述连接失败。限定区间没有记录unmounted setState、Abort错误UI或pageerror；这支持本次取消后无所录警告，不等于证明所有console事件永不丢失，亦不覆盖StrictMode AUTO。没有完整键盘/VoiceOver、四视口浅深200%、主保存长延迟/重复点击测试，不签全样式/UX。

## 6. 错误与退出原件保全

| 原执行/设施 | 保留与结论 |
| --- | --- |
| 首次new旧drawer未关 | 只dirty旧草稿，随后明确取消；原new/baseline覆盖事实保留，不将两次new都叫成功建立fresh |
| abort原chooser误报0 | 仍GoTo不存在path；只使用纠正新图与后续事件，不抹旧图/AX |
| 首次save | `failure-1792623408600.json`22:56:48.600Z “main submit missing”；观测说明原type选择器找不到省略属性的button。原失败不删，后件只修设施精确可见“添加任务”按钮，真实click一次，不改产品 |
| 首次reopen | `failure-1792623466564.json`22:57:46.564Z “real saved task missing”，未解raw record；不是t2没保存 |
| second reopen原exit0 | 22:58:25.240Z无title input、focus编号2、真实图“已复制”；**不是重开PASS**。不把后来归档的修正执行脚本追认成旧次真正步骤 |
| finalcorrected | 正确pt-name与22:59:10真抽屉才补重开；不覆盖两旧错误 |
| 父终端终码缺失 | observations明确部分执行只返回execution ID而未采父终码；原包没有每次独立exit文件，本专家不填造0/1，不以run/done代shell码 |
| seq1 release错误 | Invalid InterceptionId是已取消Request失效，原件保留；不捏造成host201/late201或新产品FAIL |

observer原ready PID33305，end22:59:41.483Z `held=false`，帧manifest收尾；seal原脚本的 `ps -p 33305 -o pid=,command=`在23:00:46.757889Z返回 **exit1/stdout空/stderr空**，支持该查询时无此进程。**本专家没有运行ps或TERM。**

负责人及collector-exit文字声明“精确argv/cwd核后TERM、无host stop”；本包只有该叙述，未落原argv/cwd/TERM工具输出。故仅签end与ps查询切片，**精确身份核验→TERM全链独立审证仍BLOCKED**，不把字符串声明算原命令输出、不要求再次停进程。observer脚本收到SIGTERM写end、停录、detach/disconnect后exit0是代码路径，不等已保存其实际父终码0。宿主8391不是33305，不由observer结束推断停过宿主。

## 7. 最小补件

1. **忙态探针**：Main沿原F02在同一冻结产品的fresh草稿，≥3秒真实请求延迟期间及失败/恢复后，只读采 `input[type=file].disabled`、原选件label/input关联、当时可见文案及取消可达状态，与同页target/timeOrigin/帧/roots绑定。现有buttons disabled可继承，不需重造；不要新增“上传中主保存必须disabled”的Oracle。主按钮原false照实保留。
2. **迟到201仅补未测分支**：若关闭这一分支，Main须在隔离传输/宿主测试设施按既有合同安排“真实宿主已收到并生成stage、关闭后原201才抵达”的事件链，保原201/body/stageId→生产迟到清理→实际根归零/零业务写和console。不得fulfill伪成功、移用seq3、把Invalid InterceptionId改成201或重释放同一失效ID。若设施不能达成，继续BLOCKED，不扩大为新产品功能。
3. **StrictMode AUTO**：由有授权的独立AUTO角色绑定同源真实组件的严格模式cleanup/陈旧generation/重试测试与原退出证据；本轮GUI限定角色不运行、不自建模型补绿。主保存双点及其它RA-N01仍留各自原范围。
4. **可追溯性小补件**：补已有observer33305原argv/cwd/单PID TERM的脱敏工具原输出及能找回的父terminal最终码，找不回诚实缺失，不再次停服务；补corrected原生GoTo转录仅当要签完整AX链。若要签重开附件行“真实可见”，滚入同t2文件行补原图/bbox即可，不重新save、复制或下载凑证。

上述补件不给本角色开发、GUI或服务权，不把用户本人配合当默认解决方案。已签切片可只读引用；其余原门/失败与当前新候选仍按专家独立复验。

## 8. 本轮验证、保护与释放

环境：macOS darwin/arm64，实际Node `v22.23.3`；pnpm11.28.5是项目约定，本轮未调用。仓库根实际验证：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-file-fault-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a15-file-fault-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-file-fault-gui-review-20261022-audit.mjs r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-file-fault-gui-review-20261022-audit.mjs seal r2
git diff --check -- docs/testing/a15-file-fault-gui-review-20261022.md docs/testing/a15-file-fault-gui-review-20261022-audit.mjs
```

首轮审计exit0、21项证据断言成立：A13/A14全声明输入/产物、完整唯一loader、同新页面、325补件（index324项+index本身）、224帧hash、根差异、唯一task add、raw、源字节、故障/真实201与正确重开、限定console及保护。第二轮exit0、21项仍全部成立，保留首轮audit，增加实际目视明细与所有额外已读输入、原真实下载核验；语法检查和上述diff检查均exit0。结果见 [audit-r2](a15-file-fault-gui-review-20261022-audit-r2.json)，终核见 [seal](a15-file-fault-gui-review-20261022-seal.json)。diff对未跟踪新文件不替代内容验证；报告计数另按审计回读校正，19份页面状态一致。**证据断言成立不是全GUI门PASS。**

保护首次登记2590个输入，其后补登记已读旧审计脚本与/tmp装载helper共2592个；包括原报告/合同、所有本包原证与原fresh/loaded/download/headers、源文件/真实下载、候选/patch/环境以及两个冻结树全声明源/产物，逐文件保存SHA/字节/mtime。终核同时比较首次2590交集及第二轮2592全集，变化/新增/删除均须为0才封存。保护从首次登记时点起，不冒称未登记前整机监视或未列个人profile/运行库零污染。所读helper仅源码，未读取其引用的browser-ws/entry-url等凭据。

本轮探索错误照实保留：系统 `rg`不可用转find/grep；memory指定路径不存在；一条旧execution路径grep退出2、随后有界find无结果，不用它证明进程链；首个状态摘要输出过宽仅收窄只读字段。无为消除错误而安装、改权限、改系统或触碰产品。

**只新增本前缀报告/专用脚本/审计/封存；未改原证、A13/A14lib、其他testing、livingdocs或产品，未fetch/pull/build/install/产品verify/GUI/services/credentials/commit/push。所有自有命令已退出，本角色未持有GUI、builder、服务资源，有限审证后释放。父任务不因本报告被宣称全部验完或可提交发布。**

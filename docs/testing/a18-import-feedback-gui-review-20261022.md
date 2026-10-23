# A18 导入故障错误反馈独立 GUI 审证

> 2026-10-22，trae，独立测试专家，非开发、非 GUI 执行端。给 Main 与接续专家复核当前 A18 有限错误反馈/恢复结论、原件和缺口；不是整项导入、全矩阵、习惯修复、发布或 commit 放行。

## 1. 有限结论与剩余缺口

**当前 A18 的 CSV/XLSX：全局错误全文、红色错误卡/警告图标、alert/assertive、原时点持续、真实复制67字节、失败保预览/零业务写、busy三控件禁用、明确同预览生产重试、新父子真实ID重开，分别有限 GUI PASS。** 旧 `A15-IM-GUI-01` 的英文传输错误误画成功缺陷，在这两个当前实际故障场景中修复已确证；旧 A15 报告/FAIL 原样保留，不倒签旧产品。

**完整 A18 错误上下文 GUI 合同仍 BLOCKED。** 本包没有真实 GUI 的“合法成功标题含失败/Failed/Error”、catch 原因含成功信封/动作标记、关闭错误卡后重开/同值代际/复制竞争控制。不能借独立 SOURCE/AUTO 的 adapter20和16反例全签 GUI。重试成功后只签可观察的旧错误消失/新成功文案，不把 DOM 观察写成内存 context 清除实测。

| 原合同精确切片 | 独立结论 | 原证/边界 |
| --- | --- | --- |
| A15-IM-GUI-01 / A17 TF-F01 / RA-N01：当前两格式英文传输错误诚实反馈 | **有限 GUI PASS** | 两 `*-failed.png`、copy.before role/live/class、复制/关键帧：红卡、警告非成功Check、完整原文；只签实际 Failed to fetch 场景 |
| 两格式全文复制、不截断 | **有限 GUI PASS** | copy脚本真实按钮→`pbpaste` exit0，两clipboard原文各67 UTF-8字节逐byte一致，显示“已复制”，不重发命令、不写业务根 |
| 两格式错误不自动消失 | **有限 GUI PASS，原时点** | CSV失败→复制前46.151s，重试前一帧仍在56.563s附近；XLSX失败→复制前29.621s/随后复制图仍在。不是两格式各50s，不签无限期 |
| RA-IM01 / LG-G05：busy三控件、失败保预览与恢复按钮 | **有限 GUI PASS** | 两busy-probe三disabled/ariaBusy=true，失败同outline/原名、局部重试alert、确认/取消恢复可用，故障与八步根/raw互证 |
| RA-IM01：同预览明确retry→生产一次写入→新父子真ID重开 | **有限 GUI PASS** | CSV新t4/t5、XLSX新t6/t7；同完整命令/原文件载荷、成功run/done、snapshot、九表单字段/raw全字段吻合，无其他任务变更 |
| 成功retry替换错误反馈 | **有限 GUI PASS，仅可观察效果** | retry实际JSON中旧错误/alert消失、新成功全文存在；源码默认清context支持，不声称GUI读取了内部state或已覆盖成功特殊标题 |
| A17 TF-C01/C02：成功标题含失败/Failed/Error不误红 | **GUI BLOCKED，本包未采** | 本包标题是QA原生导入根/子；原独立AUTO控制不能代替新GUI |
| A18 TF-X08相关：catch原因含summary/detail/action标记、无动作、持续全文 | **GUI BLOCKED，本包未采** | 实际原因没有这些标记；仅原独立SOURCE/AUTO覆盖，不据此扩大已修场景 |
| 关闭卡→正常消息、同值消息/复制/timer代际竞争 | **GUI BLOCKED，本包未采** | 采证脚本只有复制/重试/编辑取消，无点击“关闭结果卡”原件。编辑器取消不是关闭错误卡 |
| LG-G05同帧同步双点GUI | **历史 BLOCKED 保留** | 第二真实点在等待busy后且按钮已disabled，不是同帧；无精确第二点时刻，不补造100ms |
| 宿主收件后false/reject/I/O失败事务、全并发入口 | **相关 GUI BLOCKED 保留，未覆盖** | 本次RequestStage预host ConnectionFailed，没有业务已开始后失败/回滚证据 |
| 全RA-IM01/N01/LG-G05、旧漏trace、全矩阵/读屏/全部积压与普通commit | **不放行** | 子项PASS不代替整门；本单不新增产品计划或启动补测动作 |

本包已采反馈/恢复切片未发现新的产品 FAIL；缺证为 BLOCKED，不是默认豁免或 MANUAL_PENDING。原95两红、旧原20一红和A19设施门分别保留。结构实核见 [audit](a18-import-feedback-gui-review-20261022-audit.json)，固定原证根：[A18/import-fault](../../reports/all-pending-evidence-20261021/A18/import-fault/)。

## 2. 授权、角色与有效合同

负责人本轮原句节录：

> 独立A18导入故障错误反馈GUI审证，非开发GUI端。用户持续全部未验/修确证独立最后普通commit。只docs/testing/a18-import-feedback-gui-review-20261022*及自有evidence;禁产品/其他testing/livingdocs/build/install/GUI/service/credential/commit。
>
> 原A15失败/旧SOURCEcounter20原红保，只当前A18GUI所采错误feedback/恢复PASSFAILBLOCKED限定签；成功含Failed标题控制若本包无真实GUI原证明确最小缺口不要借AUTO全签。
>
> 报告后释放，不签全导入/矩阵/新habitfix/commit。

已读 [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)、[remaining-journey RA-IM01/N01](remaining-journey-cases-20261021.md)、[旧A15报告](a15-import-fault-gui-review-20261022.md)、[A17先行合同](a17-transport-feedback-contract-20261022-plan.md)、[A18批准方案](../plans/2026-10-22-feedback-error-context-closure.md)、[A18独立SOURCE/AUTO报告](a18-feedback-context-independent-retest-20261022.md)及原TF-X08。先行审证计划：[本单计划](a18-import-feedback-gui-review-20261022-plan.md)。沿既有oracle，不自改用例，不用待表决设计矩阵扩大本单硬门。

Main是既有GUI执行/唯一builder，仅采原始证据、无PASS。本角色只读源、脚本、JSON、PNG/JPG并独立判断；没有产品函数/采证器import，没有浏览器/桌面/RPC/HTTP/服务探活/凭据读取。具体本批禁令优先于通用fetch/pull脏树、install/build、全verify、livingdocs与提交步骤。没有加载vendor或安装工具，没有启动其他Agent。记忆指定入口不存在，以仓库为准。

## 3. 冻结候选与实际运行绑定

实际产品树 `/private/tmp/pmtool-a18-closure-20261022`，package version0.7.4；dirty基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，宿主原认领 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`。HEAD/version不代替完整候选；宿主来源仅引用，不追认上游改动授权。

| 对象 | 独立SHA256/字节核定 |
| --- | --- |
| candidate / tracked patch | `2d533a1d214c0ae68739b354aac2e0d85b37ca6735c256d3dd3820bce3c191b9` / `1b2becbaa4c910d0d7052ec42127bd3856e57cf49d30c72ec4d3ad55a6921fd4` |
| panel.tsx | `fa07af612db1546e8df66cb31fb081087eb8aefcf60fd58d8484dca6664a0947` |
| result-card.tsx / ui-feedback.ts | `3bf14c4de117ce5e9577f7db0ed8e4bf81196492fd794be95f6df40310dca352` / `94bab4055958c6abb22caf6343173b8e643c58c9da85a28e421b5ef7f86d35d7` |
| lib/client.js | `9ab0c3e0d94751870a53507530d899d4a711bda4fbe5c2b474ebd66127cc06bb`，完整执行段另计 |
| loaded完整响应 | 2584301字节，`b4a54301e085753ab4193ae1284156ac779064ec097d7e775970a3d6a9e9f708` |
| 唯一完整执行段 | 1705469字节，`21d941ca10d41935a5416b58f6da29f2b5520e8bf93396e850de526a68eea343`；offset875361，second=-1 |
| import-fault/index.json | `feedb0bc3454717f00f9650579a9a72e26bbab0848760c0ab8b7a83f1907e547` |

**520声明输入与453产物全部实核吻合，pinned11 proof的source/artifacts逐项等同candidate。** 完整loaded响应按原loader去末尾sourceURL/sourceMappingURL、补宿主分隔符独立重算，非短哨兵匹配；status200/fromDiskCache=false不单独构成GUI证据。

原host-start/ready：00:36:22.708Z启动 **3248/PID63429**，cwd只读上游目录，plugin指本A18树；00:36:29.199Z ready。`final/environment.json` 的“no service started”是更早骨架说明，不与随后真实启动混同。运行根 `/private/tmp/pmtool-a18-feedback-runtime-20261022`。loaded target **BA817F66FCE81BD58357C4B50BFFDF2C**，`timeOrigin=1792629512672.7`；八步、busy/copy与其同页。

loaded名义1440×900/DPR1；实际native之后故障轮inner **1440×718、outer1440×857、DPR2、深色**，原帧设备1440×718。不是200%文本缩放，不拿loaded名义高度签故障布局。A16/A13旧页面与源不能替新A18激活；Main在途新src/input不纳本单候选或零写根，即便后续fix也不重写本冻结身份。

## 4. 合法F5种子、原生选择与设施副作用

原 `final/seed` 脚本实际路径为既有 **fixtures/F5/backup.json**：正常“更多”→填路径→预检→首次确认→确认对话框第二次“确认恢复”→真实恢复。seed.exit的“original F6”及ready的“A15 supplementary directory”是旧字样，实际路径、截图、候选/端口均明确F5/A18，未据错字换对象。仅认领合法种子链，不签恢复页面样式或整项恢复门。

F5备份含 **全库3任务**，当前p-0001视图显示2任务，另一个属p-0002；不是全库只有2任务。原三task ID与CSV失败raw逐字段吻合；未手造refs/数据。预检/第一次确认中间根没有pmtool业务/文件/备份写入，第二确认后恢复。两真实附件各 **22字节**，侧车原件SHA分别 `875a72ee9315a77dc0407dbfe29ce8823dfd2671e3c785ee69ffc6e18dbb2522`、`87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`，与seed-after、ready、end files根逐项一致。只读字节核验，不访问当前业务runtime或宣称全机零写。

两native chooser完整3104×1938原PNG/AX path-action/selected目视：原 `QA 原生导入.csv/.xlsx`，169/16561字节，SHA与旧原件一致；系统XLSX显示17KB。真实GoTo路径→选择→后续真实preview生产命令证明通道；picker脚本本身停在选中截图，**未归档独立Open点击回执**，不称OS连续录像记录了Open。不是setInputFiles或另造fixture。

observer静态核：CDP Fetch **RequestStage** 匹配精确3248命令URL，再从POST BODY取 `payload.args.line`，Map对**整条合成confirm命令等值**；其他请求原样continue。仅读取payload，不保存authheaders，不替换成功返回、DOM或业务handler。初次仅两个确认请求hold/fail，重试请求原样continue生产。observer可写原件、带前台、截图/录合成帧、读取runtime三根；动作重试真实写任务/session。不是“采证设施没有副作用”。

原helper `pmtool-a18-gui` 复用A6的observe/manifest/recordPage，浏览器依赖来自既有A16 node_modules，是设施依赖而非产品A16；observe仅取可见控件且pm.text限10000字符，本批文本未达截断。hidden file input失败后没有专门false探针，不补造；busy-probe实际覆盖它、失败按钮恢复/源码finally/随后retry支持有限解锁结论。

## 5. 原故障、复制、重试与落盘

原错误全文及两次真实剪贴板全文：

```text
执行失败：client api: commands/execute failed: Failed to fetch
```

前缀没有删原英文原因；67 UTF-8字节均由生产“复制原文”按钮→真实pbpaste回读，非只核网页文字。两个copy.before为`role=alert`、`aria-live=assertive`、`pm-result-card--error`，原图红边/红全文/警告图标而非成功Check。只见关闭/复制操作，没有把普通错误原因变为可执行动作；带action标记原因未实测另列BLOCKED。

| 格式 | 首次暂停→预host失败 UTC | 复制前 UTC / 持续 | 明确原请求retry / 原生产事件 |
| --- | --- | --- | --- |
| CSV | 00:40:50.393→00:40:53.493，**3100ms** | 00:41:39.668，距failed观察46.151s | 00:41:50.111 continue；seq15/16，cmd-2b310026-7，00:41:50.236→421成功 |
| XLSX | 00:43:11.466→00:43:14.568，**3102ms** | 00:43:44.215，距failed观察29.621s | 00:43:59.525 continue；seq23/24，cmd-2b310026-11，00:43:59.820→937成功 |

CSV `000189.jpg` 在复制前仍完整红卡，`000190.jpg` 已复制；XLSX `000408.jpg` 已复制。CSV `000192.jpg` 的metadata时点00:41:50.079985Z（回执at00:41:50.141Z）发生retry点击/滚动前后、业务成功之前；同页只滚离全局卡，结合无关闭动作/无新消息和原常驻代码可支持持续窗口，**不称该帧看见了视口外的卡**。两copy.before相距124.547s，不把两格式两次复制间隔说成同一错误持续。XLSX原观测不能签50s。

失败首请求没有业务command/run/done；fault pause→fail三根、confirm-fail before→after、failed-roots全0，原task raw全保。仅预host零写，不是宿主事务回滚。

原preview seq13/14 CSV、seq21/22 XLSX，完整载荷解码分别169/16561字节；retry同confirm全行hash分别 `c1123cdebaa817d8c2b821de6351329cc792e51aa79884e9b58029b394ec7b0d`、`625dbdd814c7fc2cef2d0324632ba3dc0522a7a5d904a887fd1cfa24293a90d6`。失败后到retry没有新preview/换文件命令，fail-after/copy-roots/retry-before全等；整个commands16条仅两preview、两retry和四snapshot各run/done，无额外确认。

CSV只增 **t-0004/t-0005，3/3.1**；XLSX只增 **t-0006/t-0007，4/4.1**。根p-0001/null父、测试甲/todo/P1/start10-22/due11-01/progress0；子对应新根、测试乙/in_progress/P2/start10-22/due10-30/progress10。description空、milestoneId null；全部ID/code/order/时间与raw、target、至少两真实snapshot一致。四ID九表单字段逐项吻合，编辑器退出是取消、零写；不借同名标题误选旧CSV目标。旧t1..t3及XLSX前的t4/t5全部JSON保持。

ready→end精确仅新增四task、另仅宿主session内容变化，files2→2/backups0→0，其他原业务和workspace hash保持。copy/fail/reopen动作零写不扩大成整采集期data零写；采证raw复制属于报告写，不是产品写。成功retry实际DOM中旧error/alerts消失、新成功全文存在；PNG因自动滚动卡可在视口外，不能据此声称成功卡role/颜色已在同一PNG目视或签其特殊标题控制。

## 6. SOURCE/AUTO、原红、完整verify与漂移分层

独立A18 SOURCE PASS/有限AUTO PASS只按其原报告范围引用：原20 **exit1，19绿1红保留**；独立唯一adapter取真实card.context后20/20，独立16反例与原五/恢复/当前72/开发14/PC及扩展/87/53/noEmit均按原件列明，不是本角色重跑、不是GUI补证。源默认string成功行为保持，不能扫英文/改旧expect洗绿。

冻结panel run catch实际仍名为 **setMessage**，调用 `setMessage(prefixFeedbackOnce('执行失败', error), { kind: 'error' })`；不是本冻结中的publishMessage。用户/其他任务计划该别名描述与实际冻结源不同，本报告以冻结字节为准；不纳Main后续实现来解释旧输出。Notice/ResultCard/Toast真实classify带context，普通setMessage/关闭默认清context；这是静态及旧独立AUTO事实，关闭GUI缺口仍保。

| 原Main执行，本角色未重跑 | 原退出/结果 | 边界 |
| --- | --- | --- |
| build：`pnpm exec tsc --noEmit`、`pnpm run build`、`pnpm exec vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache` | 各0 | 首轮Corepack实际pnpm12.14自动install尝试/warning保留；不称pnpm11 |
| pinned11：固定Node + `/Users/bytedance/.cache/node/corepack/v1/pnpm/11.28.5/bin/pnpm.mjs`，`--version`及同三命令 | 各0，version11.28.5；149files/1552tests绿 | source/artifacts同candidate，453产物不变；不证明共享依赖从未被写 |
| `node scripts/verify-isolation.mjs` | **1，95中93绿2红** | 原gantt-drag:105 expect setMessage(error...)、ui-feedback:234 expect classifyFeedback(message)两静态形态不匹配；不替另一独立接口审证签字/adapter |
| 原八action内exit.json | 各0 | 到达采证器结束，不是产品PASS或父工具真实最终退出码 |
| 两pbpaste | 各0，stderr空 | 原argv/文本/JSON可核，不是本角色操作剪贴板 |
| seed.exit | 0 | 内写采集结束值，非完整恢复门 |
| collector-stop中ps/cwd/host查询 / 最后ps | 0/0/0 / **1且stdout空** | 原进程链事实，不推collector父终端最终0 |

完整原argv/cwd/env/start/end/exits在audit.originalExitFiles、[build](../../reports/all-pending-evidence-20261021/A18/build/)、[proof](../../reports/all-pending-evidence-20261021/A18/build-pinned11/proof.json)、[guard完整日志](../../reports/all-pending-evidence-20261021/A18/full-verify/guard.stdout.txt)与stderr。95 guard已列原逐项命令/退出；保护0是其已列范围，不解除两红或签本GUI整门。

[A19共享.bin只读诊断](../../reports/a19-shared-bin-drift-diagnosis-20261022.md)确证十件content漂移、共享链A18→A16→A14→A13→A12→all，强支持首轮pnpm12自动install尝试窗口，未锁写入PID。它与本520source/453artifact保护分开；本角色没有读取全依赖、更没修/还原.bin。A18独立AUTO最后保护早于漂移，不追溯伪改其历史PASS；A19原保护FAIL/BLOCKED亦不洗绿。pinned11原输出一致与本GUI切片通过不解除A19/完整95门。

## 7. 原进程退出、脱敏与目视边界

collector **64565** 与host **63429**分别认领。原collector-stop记录：ps-before确认observer完整argv与PPID64563、cwd仓库根；host-before确认3248仍63429 LISTEN；00:45:06.535321Z只TERM64565；end内部时点00:45:06.535Z为毫秒截断；00:45:06.760030Z ps-after **exit1/空输出**。可签这条原精确退出链事实，结束时间精度差不伪造成先结束后TERM。脚本finish写end、Fetch.disable、停screencast、detach/disconnect，**父终端final未归档者未知，不因源码process.exit(0)填0**。本角色不重查PID、不停host，当前服务健康未测。

原console两条注入预期 `net::ERR_CONNECTION_FAILED` 保留，非“console全绿”；faults无额外错误，听取范围仅ready→end。原ready.source/A15、seed/F6和汇总3100ms错误字样分列纠正；不修改原件或oracle。八步/两copy/命令/脚本覆盖并非每个OS动作都有父工具末码或连续录像。

原597索引文件全部bytes/hash一致，不含index自身，目录598件；455原合成帧全部hash一致。**实际独立目视17个PNG、8个JPG**：两native chooser、两busy、两failed、两copied、两retry、四真实ID重开，另seed预检/首次确认与loaded实际PNG；JPG `000186/000188/000189/000190/000192/000403/000408/000434`。000186/000403是状态转换时刻，不以瞬时无error帧推最终未反馈；failed/copy更晚原件给最终态。重开抽屉个别PNG有动画叠影，不拿它签完整样式或开无因新缺陷。

只对实际尺寸错误卡全文/入口/图标目视，不称全455逐帧目视、OS全程录屏、200%/四视口浅深、长文/全键盘/读屏通过。两chooser地址栏无认证query，合成帧不含浏览器地址栏；169个A18固定文本按Bearer/带token URL/sk值模式扫描无命中，脚本只含私有入口路径不含真实凭据值。**启发式无命中不是所有秘密绝对不存在的证明**；本报告不复制密钥/入口URL，不读private内容。

## 8. 自有执行、保护与释放

环境macOS darwin/arm64，现有Node **v22.23.3**；本角色未调用pnpm。只有Node内置文件审计，不执行产品/原动作。自有语法检查0；首次审计 **1**（扫描原独立selftmp软链未支持），未写audit；仅本前缀扫描器改为记录link target/mtime、不遍历依赖，后续审计 **0，33项断言成立**。没有改fixture/expect/product补绿。

实际命令：

```sh
# macOS，仓库根；纯文件审计，不重跑产品
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a18-import-feedback-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-import-feedback-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-import-feedback-gui-review-20261022-audit.mjs seal
```

另一次只读Node对F5三task全字段/两侧车真实字节/两中间根/命令及时间核定，exit0；数字/原数据均在audit输入及§4/5，不视为产品测试。探索时rg不可用两次127后换find/grep，指定memory路径ls1；不安装/创建memory或误称产品失败。初次扫描器设施错原输出保留，不声称本轮所有命令全0。

保护 **2051个固定输入**（含登记软链，不充唯一普通文件数）、另A18完整520声明输入/453产物；旧A15整包、原20/独立报告和r3原证、F5/两fixture、固定build/final/fullverify也保护。前后bytes/hash/mtime比较见 [seal](a18-import-feedback-gui-review-20261022-seal.json)。Main在途src/input、新GUI/runtime、共享依赖全树未列零写根，不把合法并行改动算污染；不据本单声称全盘零写或清除了历史污染。

只新增本前缀plan/audit脚本/audit/报告/seal；没有产品、其他testing、livingdocs、原证、fixture、冻结源/lib修改；没有build/install/GUI/service/credential/commit/push/tag/发布/正式切换。本角色只有已结束的同步读文件命令，无子测试/GUI连接/builder/服务资源，**审证交回后释放、STOP**。

下一步由Main沿现有合同补最小真实GUI控制原件：成功特殊标题、标记原因、关闭后新消息；同候选绑定原文/role/持续/复制/根。原同帧/host后事务/旧trace/矩阵与完整95/A19门分别继续，不以本有限PASS启动新功能或最终普通commit。本角色不实施补证、不签全导入或新habitfix。

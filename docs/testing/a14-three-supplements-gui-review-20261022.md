# A14 三组最小补证有限独立 GUI 审证

> 2026-10-22，平台 trae，独立测试专家；给 Main 与接续专家核对精确补证范围使用。只读 Main 原件和冻结候选，采证与判定分离；不是新主树、整 RA-AI04、整包或发布审签。父派单全文、允许写域与停止条件见[本轮计划](a14-three-supplements-gui-review-20261022-plan.md)。

## 1. 有限结论

**三组指定补证切片有限 PASS：新 A13/main 完整下发认领、刷新后重开/下载/取消卸载再重开保最终文件、授权安全响应头及本次匿名完整错误正文；A13/materials 六次新预览/拒绝的实际载荷 trace 与缺标题列 GUI；A14 原 clean 成功句真实可见。**

**历史原件与原 BLOCKED/FAIL 不改。** 新 preview 不补造历史漏采事件；新 reload 不补造旧 load；clean 补图不冒充旧结束业务态。没有本补证范围新确证产品 FAIL，不意味着其他功能无缺陷。PC01/02 原独立 FAIL 继续有效，不签修后、整 RA-AI04 或发布。

| 原 ID / 精确缺口 | 本轮独立判定 | 本次覆盖与保留边界 |
| --- | --- | --- |
| RA-F01/F04 / 3243 actual-client-main 完整绑定 | **PASS，仅新 reload** | A13 全源/产物与新 uncached 完整唯一 client 段吻合；新 timeOrigin 绑定本次重开/下载。旧首次上传/保存前缺 load 原件仍不可倒造 |
| RA-F01 / 显式刷新→重开→finalized 文件取消卸载→再次重开 | **有限 GUI PASS** | 同 `t-0001/fa-0001`，真实下载22字节，文件/资产/任务始终保留；本次 before→after 三根全零差异。没有重启、全部卸载/StrictMode/在途取消放行 |
| RA-F04 / 授权新 asset 的实际 GET 安全头及中文下载字节 | **有限 PASS** | 原响应暂停后原样继续，200/Markdown/22/no-store/nosniff/UTF-8 filename 全齐，真实下载源 hash 一致；不补造 NetworkExtra |
| RA-F04 / 匿名同资源完整 body 不泄本次文件 | **有限 PASS** | 原401/73字节完整 JSON 仅认证错误，无源文件名/正文/字节。不是权限全集或任意错误正文审签 |
| RA-F01 / 最初原生 sheet 取消动作、完整 AUTO+GUI 门 | **BLOCKED 保留** | 本次没有补最初原生“取消”动作原证，也未运行全部 AUTO/其他分支；不能用局部结果签整门 |
| RA-F04 / 全权限/文件类型/最新主树整门 | **不审签，BLOCKED 保留** | 指定 A13 文件下载缺口已补，未覆盖全集及后续主树 |
| RA-IM01 / CSV、XLSX 新 preview 实际 trace | **有限 PASS** | seq41/42、43/44完整原名/原内容/成功预览，未 confirm，零业务/files/backups写 |
| RA-IM01 / CSV、XLSX 新非法日期 preview trace | **有限 PASS** | seq45/46、47/48原非法后行日期，真实行3 dueDate拒绝、无确认入口、零业务写 |
| RA-IM01 / CSV、XLSX 缺标题列 GUI+trace | **有限 GUI PASS** | seq49/50、51/52；原两行不变，仅标题表头改未知字段；真实“表头缺少标题列”拒绝、无确认、零业务写 |
| RA-IM01 / 先前各 preview 相邻 confirm、纠正重开原动作 trace | **历史 BLOCKED 保留** | 新六对事件是22:33–22:39Z的新观测，不能当21:59/22:03Z旧确认前的已采 preview；原六功能 GUI PASS 仍按原报告范围保留 |
| LG-G05 / RA-N01 / busy、同帧双点、false/reject保预览→重试 | **GUI BLOCKED 保留** | 未采上述故障旅程；本次快速 preview/reject、零 confirm 不证明忙态与失败恢复 |
| SM-G02 / clean 原成功句进入实际视口 | **有限 GUI PASS** | 同原 A14 页面、原 command48句子，PNG与滚动前后帧真实可见；补图期间已监视 data manifest全零变化 |
| SM-G01/02 全项 / RA-AI04 全项 / PC01/02修后 / 发布 | **不签；原 FAIL/BLOCKED 保留** | 不重 undo/reapply，不以可见旧消息解释后续任务状态或解除冲突缺陷 |

表内切片是原合同缺口的审证拆分，不新增用例或修改 Oracle。原报告：[fresh](a14-fresh-file-gui-review-20261022.md)、[import](a13-native-import-gui-review-20261022.md)、[SM01](a14-sm01-clean-mixed-gui-review-20261022.md)；既有合同：[RA-F01/F04/IM01](remaining-journey-cases-20261021.md)、[RA-AI04](remaining-governance-cases-20261021.md)。原报告结论只读，本报告新增精确补证判定。

## 2. 角色、授权与方法

负责人已给持续授权及 Main GUI/专家判定分离；本次明确只写 `docs/testing/a14-three-supplements-gui-review-20261022*`。按 [AGENTS](../../AGENTS.md) 与 [collaboration §9/11](../collaboration.md)，本角色只读原图/帧/JSON、冻结源码/产物和执行脚本，不执行原脚本，不访问浏览器、RPC、runtime 根、服务、profile 或鉴权内容。Main 继续父任务，未被本角色重新启动或要求暂停不受影响部分。

具体限定优先于通用 fetch/pull、install/build、全回归、livingdocs及提交步骤，本轮均未执行。工作树已有他方改动，未清树、回退或覆盖。仅使用现有 Node 与 A13 现有 `xlsx` 库读取 fixture 字节；不导入产品代码、不安装、不生成/改写 fixture、不执行 vendor skill。

独立核验记录：[首轮 audit-r1](a14-three-supplements-gui-review-20261022-audit-r1.json)、[修正设施后的 audit-r2](a14-three-supplements-gui-review-20261022-audit-r2.json)、[专用只读脚本](a14-three-supplements-gui-review-20261022-audit.mjs)。所有量化事实按实际磁盘原件交叉核验，不用 Main 摘要替代事件、图片或字节。

## 3. 源码、产物与实例身份

两个 dirty 候选基线均为 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，宿主归档声明提交为 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`。不以 HEAD/包版本代表完整候选，也不由宿主声明追认上游写权。

| 对象 | 独立实核 |
| --- | --- |
| 第一、二组实际产品 | `/private/tmp/pmtool-a13-closure-20261022`，**514源输入、453产物逐文件SHA全部一致** |
| A13 manifest / tracked patch | `d70267f974fb9aa8aaf496a4f1d49abef33d26d410b6a453eb4569fadaa9a51f` / `824d9c3c96095731580fac8edffbaced9998d5b8e245affbbb8c342e07df507b` |
| A13完整 client 原字节 | 1702759字节，`7f037fce5115157101afb64cef7b7fd0e470742ac3eb96a11cabe0a43e56ae7c` |
| 第三组实际产品 | `/private/tmp/pmtool-a14-closure-20261022`，**515源输入、453产物逐文件SHA全部一致** |
| A14 manifest / tracked patch | `f89160400a28ba78af722303c01fe9caf3f596657b3d9767f4984a3569d85284` / `1746ea63883466106ed8c33a6c6aeecf43dee887b780b026efeee3e8564a8041` |
| A14完整 client 原字节 | 1702898字节，`8e245e9da8a5a720617f305f5875c343662b4727513e2a21474902ee7d53d056` |
| 端口/PID归档 | A13 main3243/PID8391、materials3242/PID8390；A14 host3245/PID25245。来源为原报告及环境原件，本轮不探活、不独立声称PID当前存活 |

三个完整 loader 段均重新按原装载规则去末尾 sourceURL/sourceMappingURL、补分隔换行与分号，实读整个响应匹配，第一offset875361、第二次出现=-1，非短哨兵命中：

| 下发原件 | 响应字节与SHA | 完整唯一执行段 |
| --- | --- | --- |
| [fresh新loaded](../../reports/all-pending-evidence-20261021/A14/fresh-file-supplement/loaded/result.json) | 2581559 / `69656e3d1164c9a26bea86a31138adc42167fc8abcacb66941ef7ed211b405fa` | 1702727 / `c29382ca1c7f2e5f2a1ddbcbbccb4b0e92258142e585ab3b122ac0fd1c28289d` |
| [原materials loaded](../../reports/all-pending-evidence-20261021/A13/final/materials/loaded/result.json) | 同上原A13字节 | 同上原A13段 |
| [原A14 loaded](../../reports/all-pending-evidence-20261021/A14/final/loaded/result.json) | 2581698 / `b30de32c9e74f28e0fb1213e71476eeffa8a719c32e036c5b176b9ed8bcc773f` | 1702866 / `59b27555e5516020fba3cce8ae5b63937d77e66f0be77b680f9657d5cfbec658` |

三者status200/fromDiskCache=false。combo不等于单包client SHA；哈希认领本轮字节，不当正式版本 tag。未采 editor chunk，不签其装载或完整启动矩阵。

## 4. 第一组：fresh 下发与文件补证

原证根：[A14/fresh-file-supplement](../../reports/all-pending-evidence-20261021/A14/fresh-file-supplement/)，共13文件。`loaded/execution.mjs`是真实归档采证脚本，本专家只读。它关闭缓存并真实 reload，记录requestId `22802.160`、frame/target `6D0411984B826559D61A327AF288F035`、wallTime `1792622511.630559`，保存完整 `combo-1.txt`；最终状态origin3243、default context、PM mounted、pilot off。

**新 timeOrigin=`1792622511513.4`，新loaded记录22:41:53.285Z；旧fresh页面=`1792620662287.9`。** 新观测早于本次22:42:27重开和22:42:28下载/再重开，不是旧06:14上传/保存时已有 load 证据。两页面可证明同冻结产品的新接续，但不能把新timeOrigin填写进旧原件。

`download/result.json exit0`：新页面真任务行重开→真 `fa-0001` 链接点击→新下载目录等到22字节文件→新无cookie browser context同路径请求→关编辑器真实“取消”、等待抽屉卸载→同任务行再次重开。只读执行脚本没有 copy源文件、task save或RPC补件步骤。两重开PNG/JSON均为同origin/timeOrigin、正确任务标题、单“文件 fa-0001”资料行；链接滚入视口后点击。重开后截图滚回表单顶部，资料行仍由完整状态与目录交叉证明，不伪称两张PNG均拍到最下方文件行。

实际下载原件独立回读：

- 原件、同字节副本、旧fresh finish下载、新download目录、新headers目录五文件均 **22字节**、SHA256 **`87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`**。
- 本次before/after：data5/files1/backups0，新增/删除/变化全空；旧finish→新reload后before只原宿主session变，项目/task/file_assets/final字节与备份不变。证明既有成功finalize不会在本次刷新/取消卸载分支被删，不声称所有卸载或跨任务GC安全。
- 下载名保持 `QA 文件 原件.md`，不是把“文件 fa-0001”页面标签说成已验中文原名展示。

`headers/result.json exit0` 与 `responses.json`逐对象一致。只读脚本对唯一 asset路径启用 **CDP Fetch Response阶段**；原响应暂停事件记录允许的五项响应头后调用 `Fetch.continueRequest({requestId})`，没有 fulfill/replaceResponse/改body/改header，没有保存Cookie/Authorization/请求鉴权头。这是实际链接默认GET的原响应观测，不是合成响应，也不是零暂停纯被动Network事件。

| 真实授权响应字段 | 原值 |
| --- | --- |
| 路径/状态 | `/api/pm/v1/assets/fa-0001` / 200 |
| Content-Type / Length | `text/markdown` / `22` |
| Cache-Control / X-Content-Type-Options | `no-store` / `nosniff` |
| Content-Disposition | `attachment; filename*=UTF-8''QA%20%E6%96%87%E4%BB%B6%20%E5%8E%9F%E4%BB%B6.md` |

UTF-8扩展名参数独立解码为上述中文/空格原名；同轮实际下载hash一致。原事件22:43:19.303Z，下载结果22:43:19.446Z。`networkId`在该原事件不存在，不填造；安全头与真实新下载相接，不拿upload201或匿名401头替代。

`download/result.responses=[]`、`downloadEvents=[]`仍保持空，旧fresh `finish/result.responses=[]`也保留。原两轮NetworkExtra未收到事件的缺失事实不改变；后来的Fetch原事件仅补本次真实响应，不能“回填”空数组或重建旧响应。

匿名原件 [anonymous-body.txt](../../reports/all-pending-evidence-20261021/A14/fresh-file-supplement/download/anonymous-body.txt)完整73字节，SHA256 `1eecfe2c26d0a555ec4d1eb4217ec77f7883bcf49185602c9530b2d203baee70`，实际401，JSON/no-store/nosniff：

```json
{"error":{"code":"unauthorized","message":"请求未通过宿主认证"}}
```

本次完整正文仅认证错误，无源文/文件名或源字节；未共享认证内容。有限签该请求拒绝与不泄原文件，不签其他任务ID、别项目、任意错误和完整权限矩阵。

## 5. 第二组：新 import trace 与缺标题列

原证根：[A14/import-supplement](../../reports/all-pending-evidence-20261021/A14/import-supplement/)，共107文件；它是**A13产品**，不因A14目录名升格为A14前端证据。observer ready `2026-10-21T22:32:28.244Z`、PID28155、target `2EDCCF4D81671D87CBBD9934F50CF274`、origin3242。六current均 timeOrigin=`1792618531950.5`，与原materials完整loaded一致，深色CSS1440×718/DPR2，不把DPR2当200%。

六份原生chooser图逐张目视，均真实macOS打开sheet、蓝选准确原名/扩展和“打开”控件；AX `set 0 value`回读精确fixture路径，selected原树含文件名。Main看图后Open的功能链由随后同页原命令/结果/预览支持，**不是这张静态图录到了Open点击过程，也不是帧录到了系统sheet**。没有 `setInputFiles` 替代原生选择；只读执行脚本点击导入label并观察，没有confirm步骤。

| 新分支 / run→done | 原run UTC / 文件 | 原结果与目视 |
| --- | --- | --- |
| csv-trace / 41→42 | 22:33:26.365Z / `QA 原生导入.csv` | 完整名、2行 `1/1.1`、当前未写入、确认/取消可见 |
| xlsx-trace / 43→44 | 22:34:22.068Z / `QA 原生导入.xlsx` | 同两行成功预览，未确认 |
| csv-invalid-trace / 45→46 | 22:35:24.035Z / `QA 非法日期.csv` | 行3 dueDate有效日期及先后关系拒绝，仅取消 |
| xlsx-invalid-trace / 47→48 | 22:36:32.994Z / `QA 非法日期.xlsx` | 同拒绝，仅取消 |
| csv-header / 49→50 | 22:38:24.509Z / `QA 缺标题列.csv` | 表头缺少标题列、约定表头中文可见，仅取消 |
| xlsx-header / 51→52 | 22:39:26.124Z / `QA 缺标题列.xlsx` | 同表头拒绝，仅取消 |

12条真实原WebSocket事件按commandId逐对吻合；四个非法 `kind=error`是预期拒绝，不是产品 FAIL。六个完整 `task import-content p-0001 <JSON名> <JSON内容>`都无confirm后缀，原名/载荷与fixture逐字节核对：

- 原合法CSV169字节/SHA `9ff4d80a312a90a2f09c3c31805aad7796341ade44e2944fa5c690cb07010501`；合法XLSX16561字节/SHA `1181f20b5bfe4400608bc85415b8ffeeadd70f51ac4035099fc4dfc1ed0ff4a8`。
- 原非法CSV169字节/SHA `6a4990f56b81438a6c24aa0b1e21ae68eeb616377f2a736bdbca0ba148d337ee`；非法XLSX16561字节/SHA `0d446fdcc112b4cb718f974938f31517869839ce63fb717a507511783e412e68`。
- CSV实际提交文本独立回读为169/175字节，与对应原UTF-8文件全字节/hash一致；本组原件没有被trim掉的尾空白，不凭通用归一化读法推断字节减少。XLSX由原base64解码，合法/非法16561字节与原fixture全字节一致，未重编码原输入。

`header-fixture.json`与磁盘新fixture全字节/hash相符：

| 原件 | 字节 / SHA256 |
| --- | --- |
| `QA 缺标题列.csv` | 175 / `e96e1f252c53bc52ada0d3c01e386568d3f50224c6a55f03e292be3ced127b68` |
| `QA 缺标题列.xlsx` | 16719 / `f12321172260b46cd52bbf4108d50c73cf582358b0cdc90f40c01da26e83b4f0` |

本专家只读复用A13现有 `xlsx` 库：UTF-8 CSV按string、XLSX按buffer解析完整网格；两种格式均仅原标题列名变“未知字段”，其他表头及两行全部相同（标题/负责人/优先级/日期/进度不变）。Main fixture脚本只在 `/private/tmp/pmtool-a14-native-import`写新文件，读旧xlsx现依赖，没有产品修改。库原入口SHA `f3366db1313e47985ddd23c57989a35298ca613124f2971513fd0efca9e50df6`亦列入保护。

**缺标题列是既有非法表头合同，不是要求“含标题时出现未知额外列也拒绝”。** 未新增列白名单规则，不据额外列忽略行为开FAIL。

每条before/after：data25/files2/backups0，只有 `session_projcache/sessions/session-792b22a6-e1db-428a-8816-4e86592a7262.json`内容变；新增/删除空，所有业务JSON、workspace/files/backups保持。observer ready→end同样只session变，旧确认创建的t4/t5/t6/t7及旁路对象全保留。没有新任务写。

observer `end.json`实际存在，时间22:44:38.623Z；47帧最终manifest已完成。只读脚本收到SIGTERM后写end、stop recorder、detach/disconnect并process.exit(0)。**本包没有单独原argv/cwd/TERM/ps退出结果或observer exit文件**；负责人说明Main已精确核PID收尾，本专家只签结束原件与根差异，不现场查进程、不补造退出码或声称完整精确停服操作链已独立PASS。

**console边界**：observer监听console/pageerror并仅在事件发生时append；实际没有 `console.ndjson`，不是交了一个可审的 `[]`原console文件。可表述“归档监听脚本在该区间未记录console事件”，不可签完整console捕获可靠性或旧21:54–22:07Z全段无错误。本次新原事件补足对应重新预览/拒绝的trace，**旧历史遗漏仍留BLOCKED**。没有confirm、旧confirm相邻preview或XLSX纠正重开的新动作记录，更没有busy/双点/故障重试证据。

## 6. 第三组：clean 原消息可见

原证根：[visible-supplement](../../reports/all-pending-evidence-20261021/A14/final/clean/visible-supplement/)，共7文件。`clean-message-visible.json`：origin3245、timeOrigin=`1792621414936.9`，与原A14 loaded及clean同页；target从该原loaded认领为 `F3D7C0806992644F07EFE3B011B7C604`，补件自身未重复保存target字段，不补造。

原PNG实际可读整句：

> 已撤销 3 项（tasks/t-0002；tasks/t-0001；tasks/t-0001）

该句与原clean command48 `kind=success/text`全字相同，位于原clean已应用结果之后、新“逐步执行三步”消息之前，非后来冲突结果替代。原bbox `x1023.6484 / y400.7266 / w323.6953 / h19.9453`在**真实CSS1440×718**内；原PNG2880×1436，与DPR2一致。不是沿旧1440×900或整个innerText推可见。

PNG SHA256 `0a496461a9d876ac832ec1898f04abb91ec27c2cc1505558323dca2b395458ef`；实际目视PNG及帧000000/000001：第一帧滚动前诊断上方，第二帧滚到同原成功句，文字完整，无遮挡。第三帧hash同000001，机器核验但不重复计为新增目视覆盖。3帧仅约23ms的合成帧变化，不称完整clean旅程录像。

`result.exit0`、action=`read-only scroll original clean result`；before/after **19个data文件manifest新增/删除/hash变化均0**。该补件未另交files/backups manifest、完整console、独立actions日志或执行脚本，故不扩大成全根/全时段零写或完整键盘/console PASS。原PNG/帧/同页状态、原成功命令与本次根差异足以签指定“原句真正可见”子断言，不依口述另造动作。

**旧clean结束→补图before，已有六个文件变更**：t1/t2、askApplyIdempotency、pmProvenanceLedger、pmProvenancePending及宿主session。原补图也显示后续逐步/冲突消息，当前t2进度44，而原clean结束为35。它们是明确不同时间的业务态；本报告不将补图raw冒充clean已还原态、不要求回滚后续工作。

原clean结束完整任务/账本还原仍引用原SM01有限报告；本次仅补可见性。**不再undo/reapply，不捞旧handle，不恢复fixture掩盖后续变化。** [PC01/02原独立报告](a14-preconfirm-conflict-contract-20261022.md)的P1 FAIL保持，本补证没有修后验证，不审签整RA-AI04。

## 7. 原退出码与目视数量

| 原执行 / 原件 | 真实原码与解释 |
| --- | --- |
| fresh save / finish | **1 / 0**：前者错读表目录`fileAssets`设施ENOENT，成功保存已发生；后件独立补重开/下载。原错不抹 |
| fresh 新download / headers | **result.exit0 / result.exit0**；loaded只有结果文件，无独立exit文件，不填0 |
| 旧CSV / XLSX confirm | **0 / 0**；XLSX旧同名重开纠正边界仍按原报告，不用本次新preview改旧对象 |
| import 六新分支 / observer | 无各自独立exit原件；run/done不是shell退出码，end也不等ps退出 |
| mixed首轮 / mixed-r2 | **1 / 0**；首轮draft模式误查diagnosis输入，保设施失败 |
| clean原runner /旧supplement /新visible | **1 / result.exit0 / result.exit0**；原timeout发生于业务undo success后，不能改原1或称runner全程0 |

历史首轮中文文件名/预检/SM01 FAIL与其他专家原失败不改；此前responseBody evicted和NetworkExtra空数组不补造。上述4条非法import `kind=error`均预期负例成功拒绝，不是缺陷。

本轮机器核验 **50/50帧hash**：import47帧（22:32:28.356Z至22:39:41.422Z）、visible3帧（22:43:37.867Z至22:43:37.882Z）。不是50帧全部逐帧目视，也不是原生OS从选择到结束连续录像。

实际目视 **15个PNG路径 / 13种唯一内容hash**、**8个JPG路径 / 6种唯一内容hash**：

- fresh `download/{reopened-after-reload,after-unmount-reentry}.png`，2图。
- import六目录各 `chooser/chooser.png`与`current.png`，12图；两拒绝当前图及两header当前图分别内容重复，按各路径与事件对证，不把重复字节计新增视觉覆盖。
- clean `clean-message-visible.png`，1图；original分辨率复看不增加图数。
- import observer帧 `000007/000016/000022/000032/000038/000046.jpg`，6路径，其中后两组分别同hash；clean visible帧 `000000/000001.jpg`，2路径。

目视范围只支持本视口文案/入口/指定结果，不签四视口浅深/200%、全样式、Tab/VoiceOver、所有loading/error及整旅程。

## 8. 本轮验证、保护与释放

环境：macOS darwin/arm64，实际Node **v22.23.3**；原Main环境约定pnpm11.28.5，本角色未调用pnpm。本轮仓库根实际命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a14-three-supplements-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-three-supplements-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-three-supplements-gui-review-20261022-audit.mjs r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-three-supplements-gui-review-20261022-audit.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-three-supplements-gui-review-20261022-audit.mjs seal r2
```

语法0。首轮审计**exit1**：15项断言成立，仅headerFixture断言因审计把UTF-8 CSV按buffer交xlsx（默认编码错误）未成立；真实XLSX/载荷/hash/根均已吻合。仅修改自有审计CSV读法为string，原audit-r1不改。第二轮**exit0，16项断言全成立**：两候选全部源/产物、三完整唯一loader、下载/匿名/安全头、六命令原载荷/AX路径/零业务写、header全行、clean同页/bbox/原句/data零变、50帧全部一致。两轮相同918输入指纹无漂移。

原Main验证仅审磁盘原件，**本轮没有重跑**：

| 原命令（各冻结包cwd） | A13 / A14 |
| --- | --- |
| `pnpm exec tsc --noEmit` | 原exit0 / 0 |
| `pnpm run build` | 原exit0 / 0，现产物453 / 453实核 |
| `pnpm exec vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache` | 原exit0 / 0；原报告145文件1467项 / 146文件1479项 |
| `node scripts/verify-isolation.mjs` | 原exit0 / 0，各95条verify原码全0，完整脚本名逐条索引在audit-r2 `buildOriginal.*.guardRows` |
| `node scripts/test-isolation-guard.mjs` | 原exit0 / 0 |
| launcher `pnpm test`、`pnpm run verify` | 原0/0、0/0，原报告各56/56 |

原argv/cwd/起止/exit完整保存在audit-r2与原build/full-verify文件；不是本专家独立重跑绿，也不能替GUI。guard已按合同排除真实模型烟测，不称全部真实模型/全97门已验。

保护清单：**918个固定输入**，含127个本批补证文件、原fresh/import/SM01原证、三份原专家报告及其本前缀产物、关键合同、原候选/patch/环境、只读采证脚本、原fixture/下载字节与xlsx入口；另逐项保护两个冻结候选源/产物及mtime。audit-r2读前读后新增/删除/内容或mtime变化全空；[seal-r1](a14-three-supplements-gui-review-20261022-seal-r1.json)实际退出0，同样零漂移。其后仅本前缀收尾补记与seal轮次参数，最终文档指纹和再次保护终核见[seal-r2](a14-three-supplements-gui-review-20261022-seal-r2.json)。不监视未列全盘、正式runtime/个人profile，不能据此宣称全机零污染。

本轮只读探索还保留设施事实：`rg`不可用后改find/grep；memory标准路径不存在且本机查无相关文件；一次`find /private/tmp`遇其他mount权限拒绝退出1，随后只定位明确证据路径；两次窄grep无匹配退出1不构成产品FAIL。没有为了消除这些错误安装、扩权限或修改系统配置。

**仅本前缀新增/更新，未改产品、其他testing、livingdocs、原证、A13/A14lib或fixture；未build/install/GUI/服务/凭据/commit/push。** 自有只读命令均已退出，无运行测试会话、GUI连接、builder或服务资源占用，有限审证完成并释放。Main可只读引用已签切片，继续既有未验/修复；仍须保留历史trace、最初原生取消、busy/故障重试、PC01/02修后及全门边界，不能提前宣布父任务全部验完或发布。

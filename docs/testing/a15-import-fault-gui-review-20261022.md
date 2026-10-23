# A15 导入忙态、传输失败与同预览重试独立 GUI 审证

> 2026-10-22，平台 trae，独立测试专家，非开发、非 GUI 执行端。给 Main 与接续专家按原合同核对有限结果、原件和未闭边界使用；不是 A16、新主树、整功能或发布放行。

## 1. 有限结论

**旧 A13 实际页面的 CSV、XLSX：确认在途三控件禁用、约 3.1 秒宿主前传输失败零写、保同一预览并恢复确认/取消、明确重试生产链一次写入、按真实 ID 重开父子，分别有限 GUI PASS。**

**另确证一个反馈缺陷 `A15-IM-GUI-01`，P2 / GUI+SOURCE FAIL：原英文传输错误被全局 ResultCard 画成成功勾号、`role=status`，而不是错误态。** CSV 失败原图中局部中文重试提示与按钮落到视口下方。不把局部恢复性 PASS 写成错误呈现/整体验 PASS，也不凭严重度默认豁免。

**同帧双点 GUI、宿主已收到请求后的业务 false/reject 或新 I/O 失败事务、旧漏采 trace、完整 RA-IM01/LG-G05/RA-N01及全矩阵仍不放行。** 保留原有限 PASS 与历史 FAIL/BLOCKED，不修改旧报告或原件，不转 MANUAL_PENDING。

| 原合同 / 本次精确断言 | 独立结论 | 原证与可关闭范围 |
| --- | --- | --- |
| RA-IM01 / LG-G05，CSV busy 三控件锁 | **有限 GUI PASS** | `csv-busy-probe.json`、原 PNG/帧：`ariaBusy=true`，file input、确认、取消均 disabled；第二次真实 mouse 点已禁用按钮，无第二请求/业务写 |
| 同上，XLSX busy 三控件锁 | **有限 GUI PASS** | 对应 `xlsx-busy-probe.json`、原 PNG/帧，同样三控件禁用 |
| RA-IM01 / RA-N01 导入接缝，CSV 传输失败保预览、可重试 | **有限 GUI PASS，仅恢复性** | 原 ConnectionFailed、局部 alert、两个恢复按钮、三根零写；不签全局错误卡样式 |
| 同上，XLSX 传输失败保预览、可重试 | **有限 GUI PASS，仅恢复性** | 原错误及完整同预览、恢复按钮在对应 PNG/帧可见，三根零写 |
| RA-IM01，CSV 同预览明确 retry→生产确认→真实 ID 父子重开 | **有限 GUI PASS** | seq83/84，只增 `t-0008/t-0009`；`5/5.1`，原字段/raw/snapshot/重开一致，无其他任务变更 |
| 同上，XLSX retry→确认→真实 ID 重开 | **有限 GUI PASS** | seq91/92，只增 `t-0010/t-0011`；`6/6.1`，同样全部字段一致，旧 CSV 目标不改 |
| 故障页全局错误呈现 / RA-N01 诚实反馈接缝 | **FAIL，A15-IM-GUI-01 / P2** | 原英文 failed/error text 被中文词匹配遗漏，成功勾号和 status 可实证；不等价于失败被提交成功 |
| LG-G05 / RA-N01，同一帧同步双点 ref 锁 GUI | **BLOCKED 保留** | 本次第二点发生于 wait busy 后已 disabled，不是同帧；SOURCE/AUTO 旧证可继承，不能换成 GUI PASS |
| 宿主后业务 false/reject、磁盘中途失败、全入口并发 | **未覆盖，相关 GUI 门 BLOCKED 保留** | 首请求在 RequestStage、预 host 失败；没有事务已开始/失败回滚证据，本单不新增或扩展这些用例 |
| RA-IM01，旧确认相邻 preview / 旧纠正重开 trace | **历史 BLOCKED 保留** | 本次 seq81..96 是新观测；不回填旧缺失事件 |
| observer ready/end/原 ps 无进程 | **有限证据成立；完整停进程动作链 BLOCKED** | ready PID39103、end、原 `ps` exit1空输出有证；索引内无独立 ps/cwd→TERM 动作原件，不补造 observer/父终端 exit0 |
| 整 RA-IM01/LG-G05/RA-N01、新 A16、整包/发布 | **不放行** | 以上为旧 A13 的有限切片，反馈 FAIL 及缺证仍存在 |

表内是原合同断言拆分，不改变 oracle。原证根：[A15/import-fault](../../reports/all-pending-evidence-20261021/A15/import-fault/)，结构化实核见 [audit.json](a15-import-fault-gui-review-20261022-audit.json)，全部固定原件指纹、候选与前后保护均在其中。

## 2. 授权、合同与执行边界

负责人本轮原句：

> 独立真实导入busy/传输失败→重试GUI审证，非开发/非GUI端。只写docs/testing/a15-import-fault-gui-review-20261022*；禁产品/其他testing/livingdocs/build/install/GUI/services/credentials/commit。读AGENTS/collab/remaining-journey RA-IM01/N01、a13-native-import与a14-three-supplements既有有限PASS/BLOCKED；Main新原证reports/all-pending-evidence-20261021/A15/import-fault/index/observations/ready/end/execution/commands/console/frames及csv/xlsx子目录/busyprobe。actual仍A13 materials3242/PID8390/timeOrigin1792618531950.5、全client原loadedA13/final/materials/loaded，独立已核；A16新panel不能倒签此旧页。native同原169bytesCSV/16561XLSX chooser完整图/AX/Open；actual confirm CDP Fetch exact完整syntheticline等值匹配，仅request BODY提line不读authheaders，3101ms RequestStage hold（预host）→原真实busy/ariaBusytrue/fileinput+confirm+cancel disabledtrue→mouse第二点已disabled（约100ms后，不称sameframe）；原ConnectionFailed，原消息保preview/controls恢复，前后data/files/backups全0。samepreview明确retry原请求continue unmodified production→CSV只增t8/t9、XLSX只增t10/t11，父子分别按真实IDs编辑重开/raw保全部字段，无重复/旧目标不改。observer39103精准ps/cwd→TERM/end→ps1无进程，hosts不动。604原件指纹封，commands preview/retry真实run/done，失败阶段没业务run；parentterminal未取final者不推0，action各exit.json只采集结束不PASS。静态handler/source/fixtures/完整loaded/hash/candidate/独立目视PNGs与frames/roots审证，给busy/fail/retry重开有限PASS/FAIL/BLOCKED与旧trace/happy子项关联可闭哪些，不擅扩sameframe/newI/O事务。不可新造旧trace/改oracle原件；明确source/script副作用/所有异常。保护A13/A14源/lib及原件，报告后释放。Main继续无关F02 busyprobe/习惯与A16等待。

已读 [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)、[remaining-journey RA-IM01/N01](remaining-journey-cases-20261021.md)、[A13 原生导入有限报告](a13-native-import-gui-review-20261022.md)、[A14 三组补证报告/计划](a14-three-supplements-gui-review-20261022.md)及其独立 A13/A10 接缝结论。具体写域与禁令优先于通用拉取、install/build、全回归、livingdocs和提交步骤，本轮均未执行；已有脏树不清理、不覆盖。

Main 是既有原生 GUI 采集者；本角色只读本机源/脚本/图/JSON并判定。没有调用浏览器、桌面、RPC、HTTP、服务/端口、private凭据文件或产品函数；没有重新执行原采证脚本。只调用自有文件审计脚本，写入本前缀，未加载 vendor skill，也未安装依赖。

## 3. 候选与实际页面绑定

实际被测产品仍 `/private/tmp/pmtool-a13-closure-20261022`，包版本0.7.4；dirty 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，宿主原认领 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`。HEAD/版本/目录“A15”均不能代表整候选；宿主声明仅引用，不追认上游改权。

| 对象 | 本轮 SHA256 实核 |
| --- | --- |
| A13 candidate-final / tracked patch | `d70267f974fb9aa8aaf496a4f1d49abef33d26d410b6a453eb4569fadaa9a51f` / `824d9c3c96095731580fac8edffbaced9998d5b8e245affbbb8c342e07df507b` |
| A13 `src/client/views/tasks.tsx` | `c37f046188f763486010e9867117ca90899c4983b09fd163f4d004007f6f2dc1` |
| A13 `src/client/panel.tsx` | `8618d9091d3544a4236e9ae92fa0225e3914ea065b910ff1f3cb55013d0bc506` |
| A13 `src/core/ui-feedback.ts` | `3808eef79e34595754ea9d8970d62c5c5da87feb1f42722eba593a061f1bbde7` |
| A13 `src/client/result-card.tsx` | `c7c2578c2b3799c422ff202bde7b2003492e3688a30dac3ee84c9e3b4c9e517b` |
| A13 `lib/client.js` | 1702759字节 / `7f037fce5115157101afb64cef7b7fd0e470742ac3eb96a11cabe0a43e56ae7c` |
| 原 CSV / 原 XLSX | 169字节 / `9ff4d80a312a90a2f09c3c31805aad7796341ade44e2944fa5c690cb07010501`；16561字节 / `1181f20b5bfe4400608bc85415b8ffeeadd70f51ac4035099fc4dfc1ed0ff4a8` |
| 本批 `index.json` / `commands.ndjson` | `1f5de137687287a5f8e04fe93e57c387fae5bd4a48f2a4ace2fa070e061546ae` / `5c3496ac17f1d10715ec742b777095cc734cea6d398138143e003ea4ca865c8b` |

两冻结候选实读：**A13 514源/453产物、A14 515源/453产物全部声明hash一致**，patch吻合，前后内容/mtime无漂移。A14仅作保护对象，不是这次导入产品，不借其结果签 A13 或 A16。

原 [materials loaded](../../reports/all-pending-evidence-20261021/A13/final/materials/loaded/result.json) 完整响应重读：2581559字节，SHA `69656e3d1164c9a26bea86a31138adc42167fc8abcacb66941ef7ed211b405fa`，status200/fromDiskCache=false。按原装载规则去末尾 sourceURL/sourceMappingURL、补宿主分隔符，完整执行段1702727字节，SHA `c29382ca1c7f2e5f2a1ddbcbbccb4b0e92258142e585ab3b122ac0fd1c28289d`，offset875361、second=-1，唯一全段匹配，非短哨兵。

ready23:11:05.481Z，target=`2EDCCF4D81671D87CBBD9934F50CF274`，origin3242；所有实际状态 `timeOrigin=1792618531950.5`，与旧 loaded同页。materials宿主 **3242/PID8390**来自原环境认领，observer **39103**另计，本轮不探活。CSS实际1440×718、outer1440×857、DPR2、深色；不是loaded名义1440×900，不把DPR2当200%。

**A16新 panel 没有在此旧页加载。** 本轮不读新产品来覆盖旧 identity、不倒签新入口、样式、父层基线或冲突修后；同字节导入模板/预检语义和旧独立自动证据可按原影响论保留，完整新client仍须另认领。

## 4. 原生选择、故障方式与实际副作用

原169/16561字节 fixture 都在 `/private/tmp/pmtool-a11-native-import/QA 原生导入.csv/.xlsx`。两份完整3104×1938 OS chooser PNG逐张以原分辨率目视：蓝选正确完整原名，CSV169字节/XLSX系统显示17KB，含“取消/打开”；AX path-action `set 0 value <精确路径>`、selected树与后续真实preview命令共同证明原生选择功能链。

picker脚本向 Chrome29351/window23677发送 Cmd+Shift+G、AX填路径、Enter退出GoTo、回读树与截图，**脚本结束于选中截图，并未在自身调用打开按钮**。Main后续Open由同页真实run/done/preview证实；没有单独Open点击回执/从OS sheet开始的连续录像，不伪称静态chooser图录到了点击。未用 setInputFiles 或复制 fixture 替代原生选择。

原 observer 用 **CDP Fetch RequestStage** 匹配 `/api/commands/execute`，仅解析 POST BODY 的 `payload.args.line`，从 Map 对**完整 `/pm task import-content ... confirm` 合成行等值匹配**。不是按 contains/短标题拦截，更不是把 command/run当WebSocket请求。其他请求 `continueRequest` 原样放行；不读保存请求鉴权headers，不改载荷/body/header，不mock业务模块或成功返回。

| 格式 | 首次原确认暂停→失败 UTC | 原精确确认行 SHA | 本次失败范围 |
| --- | --- | --- | --- |
| CSV | 23:12:38.526→23:12:41.627 | `c1123cdebaa817d8c2b821de6351329cc792e51aa79884e9b58029b394ec7b0d` | 3101ms，`Fetch.failRequest(ConnectionFailed)`，预host |
| XLSX | 23:14:22.445→23:14:25.546 | `625dbdd814c7fc2cef2d0324632ba3dc0522a7a5d904a887fd1cfa24293a90d6` | 3101ms，同预host |

两个probe分别在暂停后40/46ms记录真实 `ariaBusy=true` 和三控件disabled=true。action执行第一次真实按钮点击→wait busy→取bbox→`page.mouse.click`第二点；“约100ms”来自本次派单描述，原动作没有单独第二点timestamp，**只独立证明第二点是在busy/disabled后，不签精确100ms或同帧**。两格式 each首失败请求1、重试请求2，共两次命中，没有第三请求/重复任务。

observer有受控副作用：暂停和失败这两个网络请求、带前台/截图/录合成帧、读取指定runtime三根hash、写报告原件；正常重试真实写任务和宿主session。失败未调用业务处理，不能据零写证明“已经进入事务后回滚”。collector finish在SIGTERM写end、禁Fetch、停录、detach/disconnect；不停止host。

action：pick会导航“全部任务”、取消旧本地preview并打开chooser；confirm-fail真实点确认/已禁第二点；retry只点同确认；reopen读取raw选最高order对应本轮根及其child，再按 `[data-pm-row="<ID>"]` 的编辑按钮逐个重开/取消，**不是再按同名标题误选旧CSV目标**。它复制任务raw到证据目录，属于采集写，不改业务raw；没有产品save或手工修fixture动作。共享connect读取private browser endpoint/必要入口配置是原采集器合法接入行为，本专家只看脚本、不读这些凭据；本次initialize=false已有页分支没有新goto/reload。

## 5. 失败、重试与原数据对证

**失败零写精确成立。** 两轮首暂停→失败瞬间、confirm-fail before→after、failed-roots对照，data/files/backups新增/删除/hash变化均0，含宿主session也0。CSV data25/files2/backups0；XLSX data27/files2/backups0。未过滤变化文件、不手改原manifest。失败前后全部已有task raw逐字段一致。

两个failed状态包含相同原文件名、2行outline、当前未写入及局部“导入失败，预览已保留，请重试。”alert，确认/取消恢复disabled=false。`observe`只收可见field，hidden file input不会进fields，也未记录失败后独立ariaBusy probe；action成功结束前明确wait `aria-busy=false`，恢复按钮/源码finally与随后真retry共同支持有限恢复结论。**不补造三控件false的failed探针或前端内存快照。**

| 新原事件 | 原ID / 时间 UTC | 结果与后续原证 |
| --- | --- | --- |
| CSV preview seq81/82 | cmd-65d01e89-40 / 23:12:27.213 | 完整原名/169字节文本逐byte相同，无confirm后缀，2行成功预览 |
| CSV retry confirm seq83/84 | cmd-65d01e89-41 / 23:13:11.941→23:13:12.071 | 原暂停记录23:13:11.889 continue-original，完整相同行/fixture，只增t8/t9 |
| CSV snapshot seq85/86、87/88 | cmd42/43 / 23:13:12.105..144 | 两真实snapshot与t8/t9全部record字段吻合 |
| XLSX preview seq89/90 | cmd-65d01e89-44 / 23:14:12.403→466 | base64解码16561字节与原件一致，2行成功预览 |
| XLSX retry confirm seq91/92 | cmd-65d01e89-45 / 23:14:48.695→858 | 原暂停记录23:14:48.504 continue-original，完整相同行，只增t10/t11 |
| XLSX snapshot seq93/94、95/96 | cmd46/47 / 23:14:48.879..984 | 两真实snapshot与t10/t11全部字段吻合 |

**失败窗口没有 command/run/done**符合预host注入；真实命令事件仅preview/重试/snapshot，共16条。失败后到retry没有重新preview/chooser事件，action没有替换输入，fail.after与retry.before三根完全相同；samepreview有原文保留、源码保state、无中间载荷和同一精确确认行交叉支持，不是假造一次新preview叫重试。

CSV retry只新增 `/pmtool/tasks/t-0008.json`和`t-0009.json`，XLSX只新增`t-0010.json`和`t-0011.json`，各动作其余data/文件/备份全0差异。raw重开与retry全部JSON信封一致，所有旧raw包括此前t4..t7、XLSX前的t8/t9全保留；旁路项目、其他类型manifest不改。

四条新记录：根parentId=null、p-0001、测试甲/P1/todo/start2026-10-22/due2026-11-01/progress0；子parentId指对应新根、测试乙/P2/in_progress/start2026-10-22/due2026-10-30/progress10。description空、milestoneId null；`id/code/order/createdAt/updatedAt`与target/raw/真实snapshot全字段一致。逐父子重开9个既有表单字段匹配raw，退出编辑器是取消、零写，未主save制造字段。

从observer ready→end：**只增4条本轮任务、另仅原宿主session内容变**；files2→2、backups0→0，原有业务记录与workspace全保留。不能把“失败动作全0”扩大为整个采集期data全0。

## 6. 反馈缺陷与其他异常

### A15-IM-GUI-01：英文传输错误被画成成功

**P2，GUI+SOURCE FAIL；责任交开发，不在本单修复。** 原 `csv-confirm-fail-1792624358103/actual.png`、`csv-failed.png`和帧000190可见上方全文：

```text
client api: commands/execute failed: Failed to fetch
```

该卡旁是成功Check。冻结 `ui-feedback.ts:116-118/164-176` 仅中文失败词匹配，原英文没有命中，`result-card.tsx:25-39`按非error选择Check、status/polite。冻结 `panel.tsx:823-826` catch仍返回false，所以本缺陷是**错误呈现语义和播报分型不正确，不是错误命令当成功落盘**。不导入执行函数也能按实际分支、原文和原图核定。旧合同的失败不误称成功与§9五类门适用，不借待表决设计提议开新需求。

CSV原failed/actual PNG在新全局卡占位后，中文重试alert与确认/取消在视口下方；frame000190同步支持。后续retry滚入按钮并成功，证明可达，不证明原失败结束时中文提示已完整可见。XLSX原failed/帧000406已在较下滚动位置，中文提示与按钮完整可见；其完整JSON仍含同英文全局卡，不能因卡在视口外就签其分类正确。**本轮不签完整页面error格、读屏或无阻体验；CSV就近错误可见性不能宣称PASS。**

### 原件与设施异常

1. **摘要错层**：原seal读取 `event.args/commandId`，真实在 `event.data`，故 `observations.businessConfirmEvents=[]`。原run83/91明确存在；本audit单列correctedBusinessConfirmEvents，不修改摘要或oracle，不把空数组当没有生产确认。
2. **原console确有两条error**：23:12:41.629Z、23:14:25.561Z `Failed to load resource: net::ERR_CONNECTION_FAILED`，对应注入负例，不称“console全绿”。无其他归档console/pageerror；监听覆盖ready至finish有限期，不证明历史全程监控可靠性。
3. **完整进程动作链未归档于本包**：负责人说明精准ps/cwd→TERM，原ready39103/end23:15:32.676Z与封存script后 `ps -p 39103 -o pid=,command=` exit1/stdout空可核。缺原TERM/cwd命令独立回执，有限签原结束与无进程记录，不据此重查/停止服务，也不猜observer/父终端0。
4. **动作exit0不等PASS**：八个exit.json是采集器自己写的已结束值，不是parentterminal最终工具退出码；未取final者不推0。各raw/图本专家独立对证后才给功能切片结论。
5. **即时snapshot与动画时序**：retry脚本等preview hidden立即observe，PNG仍可见旧任务行集合，JSON导航计数已增加且局部控件尚busy；原后续snapshot与ID重开完成证明最终状态。帧000204/000422恰在preview收起前后、抽屉帧有过渡叠影；不以单转场帧新开半写/抽屉透明缺陷，不把它当最终已settled的全页图。
6. **本专家只读设施错误**：`rg`不存在，两次exit127后改find/grep；标准memory路径不存在（ls exit1），未创建或使用过期记忆。一次误定位`shared/result-card.tsx` grep exit2，随后找到真实`client/result-card.tsx`；一次查panel内函数无匹配grep exit1。均不是产品测试失败，未安装、扩权限或改原件。自有审计语法/执行均0，没有修oracle或fixture。

## 7. 旧结果关联与保留门

| 旧结果 / 缺口 | 本次关联 | 可闭与不可闭 |
| --- | --- | --- |
| A13原生六功能 GUI PASS：两格式cancel/confirm/非法日期 | 同A13全源/产物/loaded/fixture，故障轮旧任务全保留 | 原六有限PASS保留；新retry是额外两组，不替旧确认trace/旧XLSX纠正动作 |
| A14 import补件新六preview/拒绝及缺标题列 PASS | 第二组实际也为A13；已保护原件 | 表头/日期负例与新trace有限PASS保留，未知额外列忽略不新增FAIL |
| A13/A14报告“真实busy/传输失败→同预览重试未交” | 本次两格式完整新链 | **关闭该精确缺证为有限恢复性GUI PASS**，但新增反馈FAIL使完整error体验仍不能放行 |
| 旧 preview/confirm相邻trace漏采 | 本次全是23:12–23:14Z事件 | 可签新轮完整载荷/事件/ID/根；历史缺失原件仍缺，不重建/回填 |
| 同帧ref锁 / handler false及reject / 预检 SOURCE/AUTO | 原A13独立new-r3与本冻结hash一致 | 仅继承旧自动范围；新网络错误真实经过PmPanel catch返回false，本轮不签TaskTable catch独立reject或服务返回业务false |
| 新I/O/事务、其他task/OKR/habit并发、完整GUI矩阵 | 非本轮预host请求场景 | 未测继续原BLOCKED/NOT_RUN，不扩本单新计划，不拿注入传输失败替代后端事务 |
| A16 panel、F02 busyprobe、习惯及父最终出口 | 非本审证对象 | Main继续既有派单，本角色不启动、不改门、不替其commit或放行 |

## 8. 原退出码、实核与保护释放

本轮环境macOS darwin/arm64，Node **v22.23.3**，cwd仓库根；原Main使用Node22/pnpm11.28.5，本角色未调用pnpm。实际自有审计命令：

```sh
# macOS，仓库根；仅文件读取/本前缀输出，不执行产品或GUI
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a15-import-fault-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-import-fault-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-import-fault-gui-review-20261022-audit.mjs seal
```

语法/首轮文件审计 **0/0**，24项断言成立：604索引文件bytes/hash、447合成帧hash、两个候选全部声明源/产物、完整唯一loaded、两格式精确原名/载荷、busy/probe/根零写、同preview生产retry、全字段raw/snapshot/真ID重开、旧对象保留和前后保护。**审计0并未给反馈GUI FAIL变绿**；脚本不运行产品或自动用例。index604不含index自身，实际本包605文件。

| 原执行，仅读历史原件，未重跑 | 原真实码 / 边界 |
| --- | --- |
| A13/A14 `pnpm exec tsc --noEmit` | 各0 |
| A13/A14 `pnpm run build` | 各0；各453产物实核 |
| 各 `pnpm exec vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache` | 各0；原A13 145files/1467tests、A14 146files/1479tests，不替本GUI |
| 各 `node scripts/verify-isolation.mjs`、`node scripts/test-isolation-guard.mjs` | 原各0、95verify全0；监测范围沿原guard，不声称全97/真实模型 |
| 各launcher `pnpm test` / `pnpm run verify` | 原各0/0、56/56，不签launcher GUI |
| import八action内写exit.json | 各0，仅采集器到达结束；父工具末码未归档者不填0 |
| observer / nativeOpen单动作父终端 | 未交独立final码，不填0；end/ps另列 |
| observer封存后原ps | **1**、空输出，含义是目标查询无进程，不是产品FAIL |
| A13/A10早期红证、旧同名重开/旧trace等 | 保原报告与原件，不抹红、不以本轮24断言改写 |

原argv/cwd/起止/退出码见audit.originalExitFiles及原build/full-verify/summary；95verify原逐项命令/码在其guard日志与A14既有audit索引，完整文件本轮保护。原采集命令和脚本只作静态审证，未重新执行。

**实际目视13个PNG路径、8个JPG路径**：两chooser（另原分辨率复看不增数）、两busy/两failed、CSV fail-action实际图、两retry实际图、四ID重开；帧 `000009/000190/000232/000406/000204/000422/000209/000440`。机器核447/447帧，不称全部逐帧目视；采集期23:11:05.532Z→23:14:59.476Z是事件驱动compositor，不含OS chooser/地址栏、不是完整固定帧率OS录像。独立目视支持本尺寸指定文案/入口/状态；四档浅深/200%、全键盘/读屏与全页密集/长内容未覆盖。

保护范围：**944个固定输入**，含本包605文件、旧A13原生/import loaded、A14原补件、旧专家报告/合同/历史自动/构建/回归、两原fixture、只读helper；另A13/A14完整声明源/产物逐文件内容/mtime前后比较。审计前后无新增/删除/内容或mtime变化；最终封存见 [seal.json](a15-import-fault-gui-review-20261022-seal.json)。只保护所列范围，不读取正式runtime/profile或宣称全机零写。

**只新增本前缀审计脚本、audit、报告和seal；未改产品、其他testing、livingdocs、旧原证、fixture或A13/A14源/lib；无build/install/GUI/services/credentials/commit/push。审证完成后释放本角色。** 自有命令均已退出，无GUI连接、builder或服务资源占用；Main继续无关F02 busyprobe/习惯，A16沿原独立等待。下一步仅由开发处理本报告反馈缺陷、专家安排受影响复验/原缺口补证，不启动新功能、不改变父任务整门。

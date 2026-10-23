# 备份、非空恢复与新进程回读有限 GUI 审证 R1

> 给 Main、原合同 owner 和后续专家使用。2026-10-22，平台 trae，不同独立 GUI 审证角色，非开发、非执行；仅写本前缀自有审计与报告。有限签字，不签整 F06/J06、父提交或发布。release **STOP**。

## 1. 有限结论

**PASS_GUI_LIMITED**：实际网页更多→备份危险确认→真实备份成功；合法非空目标预检→取消零写→再次预检→第二危险确认→真实恢复成功并保存恢复前安全快照；恢复后及新进程中实际任务、进展内容、会议、汇报、交付物、习惯、OKR 回读；下载副本与源字节相等。

**PASS_DATA_LIMITED**：本源包七 core 表、六 extra 表的全体 **21 行**逐字段保全；源与安全包 **8 件原件**完整、每包两份不同 SHA 的 22 byte 文件与相应侧车清单一致。安全包全部 13 表对应确认前状态，t-0004 的不同标题真实保留。不是只比行数或 HTTP 200。

这些实际有限功能断言未发现新的阻断产品 FAIL。**不签 RA-F06 / RA-J06 整项**：原空目标完整 GUI 分支、本包未采失败回滚 F07、共享 unlink/GC、旧包兼容 F08、全部历史内容展开、全部 GUI/样式/UX、父全部余项和普通 commit 仍不由本件关闭。

## 2. 授权与原合同

本角色负责人原句，按本次对象生效：

> “父多角色/持续验全部授权普通commit在全门后，无push/tag/release/正式。”
>
> “你不同独立GUI审证非开发非执行，只写docs/testing/ui-backup-nonempty-reentry-gui-review-20261022-r1*自有audit，禁止业务/Git/服务/browser/testing旁改/livingdocs。”
>
> “只签实际有限备份/非空恢复/新进程回读子断言，原失败回滚F07/共享unlink/旧compat等未采保，不签整F06/J06/父commit。”
>
> “原gate新renderer/taskpred/askauth并行合法不锁；实际被测107。1537声明终核保护，后未来add不报污染。”
>
> “25续execution7非零保，只目视实际图片不全帧冒通过。报告releaseSTOP精确PASS/缺口与后继动作。”

已读 AGENTS、collaboration §9/§11、[父原 scope](../../reports/all-pending-acceptance-execution-20261021.md)、[原总登记](remaining-acceptance-register-20261021.md)、[原旅程 §2 J06 / §4 F06–08](remaining-journey-cases-20261021.md)，并核 progress/handoff/onboarding 接续。原 F06/J06 要求空目标、两步确认、安全快照、全表/字节和重进；**本次非空恢复仅补签实际子断言，不自行替换原合同或增加 sessions/checks 备份表**。

通用 fetch/pull/install/build/全回归/livingdocs 写 SOP 不扩大这次限定审证授权。父全门后普通 commit 授权属于父协调者，不移交本角色。先前 [J03 独立有限审签](j03-combined-gui-review-20261022-r1.md)保留，本件只核其 468 原件不变，不重签 J03。

## 3. 原件与候选绑定

原根 `reports/all-pending-evidence-20261021/CombinedGuiR1/`，下文数字前缀均相对此根。结构化指纹、逐表原行、RPC 配对、执行失败和实际目视清单见[自有 audit](ui-backup-nonempty-reentry-gui-review-20261022-r1-audit.json)。

| 对象 | 独立核对与边界 |
| --- | --- |
| [continuation-index](../../reports/all-pending-evidence-20261021/CombinedGuiR1/continuation-index.json) | 声明时间 `2026-10-22T12:54:44.173Z`；270825 byte，SHA `2c1dd6628834258893c4ae8a36e656f71006cda455b29f6ab933746fd602ceb9`。**1537/1537**普通文件逐 bytes/SHA 相等，索引自身另核。包括先前 J03 **468**，不是1537+468；不将未来新增纳入本签字或报污染 |
| [107 source-binding](../../reports/all-pending-evidence-20261021/CombinedGuiR1/j03-source-binding.json) | 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` + dirty `CombinedRepairR1/r2`；声明107，其中92包路径在冻结树重新核SHA，15 Launcher只保声明，不签新Launcher运行。父 candidate/diff/新文件清单与515输入的认领继承[原独立回归审证](combined-repair-full-regression-review-20261022-r1.md)，本件不重SOURCE/AUTO |
| 实际包与 profile | `/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool`，version口径0.7.4；自有 runtime `/private/tmp/pmtool-combined-gui-runtime-20261022-r1`。只读实际 pm 插件软链精确指向该包；不读取活业务库、不改软链 |
| 实际字节 | compiled client **1719054 byte**，SHA `09219cf81820294161dbdbdced09e73094b000a7d7e1d2e5b8c42f399fabb0db`；组合原件 **2597854 byte**，SHA `14414cd388b1c638a4c75863ea1f26972eab88d48f696b3d330d6b48785516f1`；去 sourceMap 尾片段1719019 byte，在组合中 offset875361唯一完整匹配 |
| 64680→71922 | 44–59 为原 r2 host3260/PID64680；原[精确停止记录](../../reports/all-pending-evidence-20261021/CombinedGuiR1/host-r2-exact-stop.json)及只读 executor 明确 lsof 3260取得64680→核argv/cwd→仅TERM该PID→listener gone。原[r3-start](../../reports/all-pending-evidence-20261021/CombinedGuiR1/host-r3-start.json)/ready与原执行7677…exit0绑定新 **71922/3260**，同107包/隔离roots/profile，无新build，不是正式3080/3091 |
| 浏览器与视口 | 原 EGO space13/p3，同origin3260；44–59 timeOrigin=`1792672395333`，60r3–67=`1792673515397.8`。所有21状态实际1458×734、深色、DPR2，outer1470×857、pilot记录`{}`、host E2E=0。不签原生200%、四档浅深/键盘/读屏矩阵 |
| 宿主与新下发限制 | 原包未给宿主commit/补丁全集；r3未另抓整组合client。只签实际新进程、同包hash/profile及页面回读，不说r3每个请求都重抓完整bundle/首载绝无缓存，更不签整个宿主 |

本件绑定的是107旧renderer，后继 renderer/taskpred/askauth 并行合法；不锁其源码、构建、服务或 GUI，也不把本签字外推到新候选。

## 4. 原断言逐项裁决

| 实际子断言 | 有限裁决及原证 |
| --- | --- |
| UI备份明确提交 | **PASS**。44更多菜单中真实备份；45r2/46r2是“开始备份？”确认层，不是失败页。47成功toast/卡真实可见；`24317.934`请求 `/pm backup` 与同rpc响应 `ok=true / kind=success`，返回源完整路径。45等待“已生成”超时没有完成确认，不能洗成产品FAIL，也不能算该次已备份 |
| 合法非空目标 | **PASS**。48真实 task update `24317.937`，t-0004标题从“J03修后三资料原子任务”改成“恢复前可辨不同标题”；GUI行、toast、RPC与原JSON同向。源title未变，目标真非空；目标额外manualProgress:null与updatedAt变化保留，不静默抹掉 |
| 预检与取消零写 | **PASS**。49r2/50原PNG是平面预检区，显示七core及六extra数量、尚未恢复、确认恢复/取消。50→51预检区消失，**全部已记录 data/files/backups roots 逐项相等**；目标不同title保全。49原监听空数组不证明全程零请求，仅没有该段捕获；错等role dialog的timeout保 |
| 再预检、第二危险确认 | **PASS（实际按钮路径）**。52再次预检，`24317.940`真实不带confirm的restore与业务success响应；53实际“确认整体恢复？”第二层，写明覆盖和恢复前安全快照。54才发 `24317.941`带confirm，RPC配对、`ok=true / kind=success`，返回“已恢复备份”及安全路径；54toast/成功卡与弹层关闭相符。不签其他取消入口或键盘焦点 |
| 恢复与安全快照 | **PASS**。54原21行业务与源七core/六extra逐字段相等，t4原title回来。安全包13表全体逐字段等于53确认前原行，包含目标不同title、manualProgress:null与目标updatedAt；不是仅多出一个文件或同title快照 |
| 恢复后任务/文件/成长回读 | **PASS（可见内容有限）**。56编辑任务下部真实进展日期2026-10-21、作者“修后验收作者”、正文及一版历史入口；背景t4原title。57下载副本22byte与源fa1逐字相等；58习惯“F5习惯”草稿、关联F5目标、空checkIns三计数0；59“F5目标”objective草稿。不能拿56下部截图证明资料列表每一行均展开 |
| 新进程实际回读 | **PASS（实际页面内容/原库限定）**。60r3任务页三条A任务，t4原title；61下部作者/日期/正文、“J03资料甲/乙/文件”引用候选；62下载副本22byte。63会议mtg-0001、F5会议、决议“保留标准来源”；64已存周期汇报、来源qa-f5-session、冻结total2；65交付物V1/v1、m-0001、F3关联/合法备注；66习惯草稿空打卡；67目标草稿。全库含B项目任务/交付物，逐表全回读证明，不伪称这些B记录也逐个GUI展开 |
| 全表/文件一致 | **PASS（实际源集合）**。47及54/56/58/59/60r3/61/63–67共12个采集状态，全部13表逐行deepEqual源包；不是只核55作者结果中的expected/actual数。六extra按原 `[key,value]`保schema，不把settings误当id表。双文件原侧车字节、manifest、恢复/重进原files指纹均同源，62下载fa1实字节再次一致；共享refs/多修订/软删数组逐字段保全不等相应操作GUI都已验 |

原helper的事件`at`是**drain读取时点**，不当作CDP原请求发生时刻。52页面状态时间早于drain记录时间不证明先成功后请求。7条实际配对RPC及47/48/54的三个snapshot逐表分别对应**各自时点**；不把恢复前不同title快照错比为源包。以上判定同时依据目视、实际动作结果和JSON内容，不以status200代业务kind或GUI。

## 5. 全表与字节明细

| 表 | 源/54/新进程末67行数 | 对照范围 |
| --- | --- | --- |
| projects / tasks / milestones / risk_issues | 2 / 4 / 1 / 1 | 七core所有字段、稳定ID、关系、task附件/修订/软删与B项目记录 |
| meetings / reports / deliverables | 1 / 1 / 2 | 会议来源/决议、report固定snapshot及session来源、交付物history/关联 |
| settings | 3 | aiModelMode、pmExportAudit、pmExportSent原key/value，包括旧隔离导出路径原值 |
| reflections / okrs / lessons / habits | 各1 | 全字段、草稿语义、关联、lines/gaps、checkIns与streak |
| file_assets | 2 | 两asset原id/name/mediaType/size/sha/relPath/addedAt |

当前冻结源码 `core/backup.ts` 明确七core与上面六extra；**排除宿主sessions/checks/密钥**。不因fixture总描述有session而自加一个backup表；reports.sourceSessionId保存与宿主session备份不是一事。

源 `pmtool-backup-2026-10-22T12-41-19-715Z.json`：16761byte，SHA **`bf685cd0eec617a8d6f01c1de1b5fd69bb83fbd921c062915b8b8effe672a489`**，侧车bundleId=`69ba8b57a76af04c`。

安全 `pmtool-backup-2026-10-22T12-44-16-675Z.json`：16788byte，SHA **`fc8a60fdff86e4d7964b7cafe6dab2a7f2623298dd59f4046df9c03fd6cc07b0`**，侧车bundleId=`8d4c9aae0affa755`。

每包均为JSON+manifest+两文件，共8件。两manifest各598byte，jsonSha256绑定各自JSON；本角色实际读取两包的4份文件字节、两manifest与两JSON：

- fa-0001：22byte，SHA `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`。
- fa-0002：22byte，SHA `875a72ee9315a77dc0407dbfe29ce8823dfd2671e3c785ee69ffc6e18dbb2522`。
- relPath分别为`87/<完整sha>.md`，清单相等；57/62实际下载副本均与fa1源逐字相等。fa2没有第二次独立GUI下载，不宣称两个asset都逐个网页下载。

[55原观察](../../reports/all-pending-evidence-20261021/CombinedGuiR1/55-backup-observation.json)的core结果及extra原行，本角色均另解析全部原JSON复核；[continuation-observation](../../reports/all-pending-evidence-20261021/CombinedGuiR1/continuation-observation.json)的extra6/bytes2重核与原seal reader相符。原helper在每态实际读取两个final文件并记录SHA，但**只复制data/pmtool正文**。本角色不再读取活files：独立字节核来自备份侧车/专门下载原副本，恢复后两个final文件来自已声明原清单与Main原读取链，不能混称本角色独立重新打开了活fa2文件。

## 6. 目视能力与保留缺口

实际逐张 `view_image` 查看 **21 PNG**：44、45r2、46r2、47、48、49r2、50、51、52、53、54、56、58、59、60r3、61、63、64、65、66、67。每张路径及SHA在audit；**本件目视JPEG帧为0**，全帧仍受1537指纹保护但不冒全帧已看、不用PNG数量折算用例数。

56实际存在背景内容透叠、53长路径及背景层叠、64快照最右栏在当前图边缘截断；不把真实原图洗成完整样式/UX PASS。这些观测保留交原B8/层映射owner按已有范围核，不新增本备份合同门、不代替其裁决。54顶部图不完整显示t4行，title回来依据56/60r3及54原JSON，不能凭54顶部截屏补造可见性。

本包没有恢复失败/提升回滚、坏hash/缺字节/越界、共享断联/末引用GC、旧binary往返、全部历史展开、全视口/主题/原生缩放/读屏原件。按原登记保持 **未采/NOT_RUN或原BLOCKED**，不自动MANUAL_PENDING，不由本件升PASS。此前旧3257备份缺字节失败与其他原门保留，本次合法完整源成功不追溯消除旧FAIL。

helper只采commands/execute请求响应与exceptionThrown，不是全console/上传下载HTTP头日志。原execution captureStderr=false、outputComplete=true只按其真实含义；不声称全部stderr/异常/请求捕获完备。data/files/backups三个观察根的50→51全等，不签全机/正式资产或全程宿主零写。

## 7. 25份执行与7次非零保真

25原execution metadata全部status=exited、outputComplete=true；**18 exit0、7 exit1**，包含O3/ATF续段不等25个备份用例。本角色逐份读取metadata及7个非零完整原log，审计保存失败尾段并绑定声明原log指纹；不删除、覆盖或合并成一次绿。

| 原execution ID | 原失败及有限归属 |
| --- | --- |
| 5cb17ecd91d48014e2303d81faba836b | O3前置contenteditable matched0，fill 3s超时；不签本备份范围或洗成成功 |
| 30fc9b7712b1363a64089ab94790f57b | O3保存按钮matched0超时；另有真实t1 update响应，不等这次TaskForm主save完成；交原owner |
| 3794f31780b24bf71fd770a2c40c8760 | 首备份等待15s超时；45r2/46r2明确只开危险确认，无request原监听保。随后47另有明确确认成功，不能倒推首轮产品失败 |
| 2ea41a9ca46064d5dec8c99ecb08110f | 更多matched1但div截获点击；确认层未关时无法点底层，实际失败保，不当恢复已执行 |
| e05bba719ce24fea9995143670871788 | 预检错等dialog 10s超时；49r2原平面确认区保，不判产品预检失败 |
| f7de52a73bf8d98a13d47fabb0e6361e | 新host首次等编辑t4按钮10s超时；当时路线仍OKR，首60未完成tasks回读。60r3真任务页是后续原件，不洗首超时 |
| 6e5205f46d508cee97b410a089da8d15 | 猜button:text-is全部任务matched0，3s超时；之后df1…exit0对应60r3–67实际回读，不把此前不存在定位器当产品错 |

执行7677…exit0只证明原精确重启链完成；r3-ready/新timeOrigin和实际页面内容共同证明本次新进程回读。执行945c…原输出仍OKR，不能拿那次输出替60r3任务截图。[raw-continuation](../../reports/all-pending-evidence-20261021/CombinedGuiR1/raw-continuation.md)与原observation均是Main实际记录，不当专家PASS来源；本报告才给上述有限裁决。

## 8. 自有验证、偏离与终核

审证环境macOS/bash、已有Node **v22.23.3**；pnpm11.28.5为项目原环境口径，本角色未调用。只运行fs/path/crypto/assert证据reader与文档检查，不导入产品、不重新执行原executor，不运行autotests/build/verify/browser/fixture，也未启停或探活服务。

本角色启动时**误调用一次只读`git status --short`**，违反本次禁止Git调用边界；未改Git状态，之后未再调用Git。排查自身广域find结束时另误用广域只读ps清单，没有服务动作；最终以自有execution `28533b0b9c5ae8d08fced82ce03bba54` metadata确认PID73524 exited/exit0/outputComplete，不留运行中find。这些是本角色执行偏离，不虚报完全未调用Git/进程清单，也不记作产品FAIL。rg缺失exit127、记忆路径缺失exit1、误拼observation路径exit1均为读取探索失败。

仓库根自有命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check \
  docs/testing/ui-backup-nonempty-reentry-gui-review-20261022-r1-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  docs/testing/ui-backup-nonempty-reentry-gui-review-20261022-r1-audit.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  docs/testing/ui-backup-nonempty-reentry-gui-review-20261022-r1-audit.mjs close
```

语法检查exit0；首次audit **exit1**：reader旧第196行误把48恢复前RPC snapshot同源比较，实际不同title/manualProgress:null/updatedAt差异符合目标改变。只修自有reader按47/48/54真实时点对照，保留原目标差异；第二audit **exit0**，1537原件/468保护、21PNG索引、12态13表、8件包、双asset/两下载、25执行7非零、107声明92冻结包SHA均核实。没有首audit结果文件写出。审计绿仅表示证据一致，有限产品PASS来自上述独立目视与业务审证。

报告写定后顺序执行close：重核1537声明及旧468，不要求目录无未来新件；核报告/reader/audit指纹与本报告相对链接，结果只新增[自有close](ui-backup-nonempty-reentry-gui-review-20261022-r1-close.json)。终核不覆盖原封包、不补写原执行成功。

## 9. 交回与 release STOP

1. Main/原owner登记本次**有限**备份创建、非空预检取消、危险confirm、安全快照、13表/双byte保全及新进程实际回读签字；不重复已签J03或这些具体成功动作。
2. 原空目标完整GUI/失败回滚F07、共享unlink/GC、旧compat/F08及其他未采子断言继续按原合同补证；本角色不执行、不预先签，也不自加sessions/checks新表。原样式/UX观测交既有B8owner，不以本功能PASS覆盖。
3. 后继renderer/taskpred/askauth和其他原gate合法并行，按新候选绑定做受影响审签，不借107旧bundle签新修。父全门对账/最后普通commit归协调者，本件不签父完成或Git放行。

仅新增本前缀reader/audit/报告/close；不改业务、其他testing、livingdocs或原1537，不操作正式fixture/服务/browser，无Git写、push/tag/release/正式切换。没有本角色运行中的测试/服务命令。**本审证角色交回有限结果、释放STOP；父任务仍持续，release STOP。**

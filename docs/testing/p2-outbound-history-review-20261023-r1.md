# P2 出站历史与只读素材独立审证 R1

> 2026-10-23，平台 trae，独立测试专家，非开发、非 GUI 执行端。**P2001 恶意标题 web 打开、P2002 合法历史恢复与日志分流、P2007 本窗口 done/wrapped 量化及 review 重进分别有限 PASS；P2002 任务出站关联位 FAIL。原 K16 known/gaps FAIL 保留，不重裁、不虚签。整 P2、总候选、ordinarycommit 均不准入；无 push/release。**

## 1. 父授权、对象与停止条件

负责人原句：“父授权持续已实现未验/修确证缺陷至ordinarycommit，无push/release。独立测试专家非开发/GUI，只审新reports/all-pending-evidence-20261021/P2OutboundFixtureR1/index-r1.json封1690件。”

本子单仅审 [P2OutboundFixtureR1 索引](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/index-r1.json)，不重三档成功/覆盖、不签整 P2。Main 唯一 GUI/builder；本角色仅新增 `docs/testing/p2-outbound-history-review-20261023-r1*` 与自有 `/tmp` reader，没有产品执行、build/install、GUI、服务、Git、凭据或 private 活目录访问，没有修改原 testing、封件、living docs、plans。通用 SOP 的 Git/构建/更新档案动作不适用于本次明确只读审证子单。

依据：[AGENTS](../../AGENTS.md) §6A、[协作规则](../collaboration.md) §9/11、[原治理合同](remaining-governance-cases-20261021.md) §4、[最终 inheritance](op-growth-final-inheritance-20261022-r1.md) §4/§5 第5组，以及 [P2 规格](../design/deep-integration-v2-p2-dev.md) §二/六/七。历史 deferred 与当前有效合同分别解释，不追溯抹掉旧判定，也不把未接线自动转 N/A。

## 2. 独立 reader 与候选绑定

自有 reader 仅 import `node:fs/path/crypto`，结构化读取 JSON、独立计算 SHA256/size、配对 RPC、对照原 DB envelope 的 `record`；没有 import/执行产品或采证器。正文引用采证脚本只用于解释采集边界，不把 Main 的 observations 当专家结论。

| 对象 | 独立结果 | 限定 |
| --- | --- | --- |
| 索引1690件 | 1690/1690 SHA/size 一致，合计46,230,761 bytes | 核件数不是用例数 |
| 索引本身 | 273009 bytes；SHA `95ba302c14bd3cdd306ea712d4a863c9ac8d983b9a810954f40eeba70711d565` | 不冒称第1691件 |
| 原 seal | files1690、index SHA一致、productVerdict=`NOT_JUDGED` | 原 seal 单独存在，不在索引内；不是多余污染文件 |
| 冻结声明 | source 清单114、complete-inputs521；9份 frozen-source 副本逐项与 binding/complete 声明一致 | 未读 private 冻结树，不签114/521份当前源码全同 |
| 候选 | baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，version0.7.4 | 不运行 Git，不以 HEAD/version代 dirty 候选 |
| 原宿主 | port3264/PID10975、E2E0/pilotOFF；host-start 的 candidate/source SHA回绑一致 | 不探活、不签当前 PID 存活；旧宿主未装 Main 新 P1004/P1005/K16 修复 |
| client bundle 声明 | 1719089 bytes；SHA `e4bda1dba6cd0d0110fa8eafb9f60e58b8a5cef9c6e1390b2016317b31b5c2d3` | built-artifacts 与 host-start 元数据一致，不重读活服务字节 |
| 原根快照 | 22份 roots、686份 DB 原字节复制，均与每轮 roots 声明一致 | files/backups 除包内明确复制件外，仅核元数据；exports 不在该 roots 扫描范围 |
| RPC/图帧 | 21组唯一同 RPC 配对；19份 command副本与原响应一致，另2组真实 `/pm web snapshot`；863帧全部回核SHA | 无 exception/unavailable 事件记录，不外推整宿主零错误；没有全部逐帧目视 |

冻结副本 [tasks.tsx](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/frozen-source/src/client/views/tasks.tsx) SHA `2dc92884cac5d86a3e8a3a2dd7aa4614d2232ea13dba633e6399fda5f4f300ec`；[panel.tsx](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/frozen-source/src/client/panel.tsx) SHA `581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d`。其余7份全指纹、逐件输入、RPC完整原句与时刻见 [终审 audit-r2](p2-outbound-history-review-20261023-r1-audit-r2.json)。

旧 candidate 的 `runtimeLoaded:false` 是冻结时状态，不据此否认后续真实 RPC，也不据后续 RPC 倒改该历史字段。前19组及round07 snapshot属 `session-b0369fd4-f954-4415-95b5-5a3394dc60db`；round09重进 snapshot属 `session-e1f997f7-d0cf-44a7-bd9a-1714119b61d9`，不伪称21组同一session。

## 3. P2001 恶意标题真实 file 打开

**有限 PASS：本合法标题在此次 web 导出与真实本地打开中按字面显示，无执行性注入/额外请求。** 不重签三档、覆盖或全字段安全矩阵。

round01真实生产命令先 add `t-0007`，再 update done100；标题为 `P2正式完成出站 <img src=x onerror=alert(20261023)>`，description含script/svg文本。不是手改 DB、不是伪造导出原件。独立根差异仅新增 `tasks/t-0007.json`、`tasks/t-0008.json`、`reflections/ref-mvk1iw2k-wd8ueq.json`，原 t1/t3/t6 等及其他既有业务/file均保字节。

| 链 | 原 RPC/证据 | 核验 |
| --- | --- | --- |
| web显式导出 | rpc `e5ecd786-c8e9-4294-b638-3c07a7a5f812`，cmd87 | `/pm export web p-0001 p2-outbound-web-r1`，响应与command副本一致 |
| 导出原字节复制 | [HTML](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/exported-originals/web/p-0001-snapshot.html) 12091 bytes，SHA `2abc4003e523618a67944de14ed0c7e147306835f0b92abffd32d939cfeb02f8` | 与round02-export-originals复制声明一致，标签以 `&lt;img ...&gt;` 转义 |
| 真实打开 | [file状态](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/round03-web-open.json)、[安全事件](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/round03-safety-events.json) | URL为原隔离exports的真实 `file://`；标题literaltext存在，scripts0/images0/onattr0/dialogs0，静态svg1且无onload、buttons0 |
| 请求与零写 | requests仅1条document，URL与file状态一致；round02-after-web→round03-after-web-open | 没有img请求/alert/外依赖；原根零差异 |

description没有进入本 web 导出可见列。它在真实任务字段及review known文本中存在，**不据此声称web可见description已受测**。目视 [原完整HTML截图](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/round03-web-open.png) 可见只读声明、生成时刻、done100/wrapped65及字面恶意标题，无破图；地址由状态JSON/唯一document请求回绑，不冒称截图地址栏可见。

## 4. P2002 标准历史恢复与日志

**有限 PASS：真实backup→明确合法历史测试包→生产precheck/confirm→两次export→audit/sent/archive保真及只读复读。** 历史两行是获准测试记录，不是31/29天前曾真实发送的事实，历史targetPath不是已存在历史导出文件的证明。

round04真实 `/pm backup`：rpc `6554d00c-b0ce-4d69-8343-fb651bb9238c`、cmd89，输出时间 `2026-10-22T21:20:18.589Z`。包内 [原backup复制](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/history-fixture/original-backup.json) SHA `3b3e56098c53a9d6a63583063ac7c264af1e51d2efd6e19ad533fda9e25db7c7` 与该轮原根指纹一致。

[prepared包](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/history-fixture/standard-history-backup.json) SHA `3e83f61be0a6cede7484f69a31c251e55c083e5042ee06c39d1e00d91468c720`：只在 `extra.settings` 的 `pmExportAudit/pmExportSent.value` 各append两行。源行、顺序、原updatedAt、七类实体和其余额外表不变；JSON语义差异仅四个新增数组索引。声明UTC `2026-10-22T21:21:32.007Z` 减31/29×86400000毫秒得 `2026-09-21T21:21:32.007Z` / `2026-09-23T21:21:32.007Z`；没有修改Date.now或GUI墙钟。

sidecar两原文件各22 bytes，sha为 `875a72ee…b2522` / `87ef7d4f…72d1a`，与原files指纹一致；manifest只有 `jsonSha256` 重绑prepared包，bundleId/文件清单/count/size/SHA保真。原bundle未改；manifest本身不是原字节完全不变。

| 实际阶段 | 原根/业务差异 | 结论 |
| --- | --- | --- |
| round05 precheck，rpc `7b50af08-0f27-4c0b-8416-053198093768` / cmd90 | 全45项原根零变化 | 完整预检提示“演练，尚未恢复”，含真实confirm命令 |
| confirm，rpc `5f06be04-305f-45c7-9fc0-a4e343fec735` / cmd91 | 仅2个settings业务文件变化，另新安全快照JSON+2附件+manifest共4文件 | 31条备份记录逐项对应真实恢复前/后DB；其他业务/files字节同 |
| 恢复后audit/sent读取 | 全49项原根零变化 | 两日志各4行，历史行真实读回 |
| 第一次plain，rpc `45058824-4d8c-4224-841d-0ced6271d572` / cmd94 | 3个日志settings变化，其他业务/file同 | audit4→5，active4→4，31天行进入archive1，29天留active |
| first audit/sent复读 | 全50项原根零变化 | 读出口与原DB行逐条对应 |
| 第二次plain，rpc `54625443-7390-4f62-9fc6-e97fed09c8ac` / cmd97 | 3个日志settings变化，其他业务/file同 | audit5→6，active4→5，archive仍仅原31天行 |
| tasklist→drawer→close→重进 | 原根均零差异 | 不等于出站标识已经显示，见第5节 |

第二次 `pmExportSentArchive.json` 的 `record.value` 全对象相同，但 `updatedAt` 从 `2026-10-22T21:23:06.801Z` 变为 `2026-10-22T21:23:08.315Z`；**不是byteexactarchive**。audit旧前缀保留，两次active分别为旧未过期集合+当前行，31天行不重复归档、不丢历史。两新增行at均位于各自真实request/response区间。

两份 [first plain](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/exported-originals/history-first-plain.txt) / [second plain](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/exported-originals/history-second-plain.txt) 原复制件各3499 bytes，SHA分别 `f1fd66b1e6d1f68e22681cc9ba73b1a2482877fed070455a9cea49d9a61adbf1` / `70a85445ffe995e7281e5f43778aba815badf2fad534e503404fda4a1b38e7b2`；正文差异仅两处真实生成时间。它们不是file打开采证，不能替代HTML真实file链。

## 5. P2002 任务出站位红项与范围裁决

**RA-P2002-OUTBOUND-SLOT：FAIL，已有能力未接线及现任务顶层行未呈现。** 不是新功能，也不是N/A；不修改历史P2/P3结论。

范围沿革：[P2规格](../design/deep-integration-v2-p2-dev.md) §二第4条明确“按项目审计最近时间显示已导出/未导出、只显示不回写”。[P2验证](../design/deep-integration-v2-p2-verify.md) §四/§六确实记载“panel未传latestExport、安全缺省未导出；P3可接线”；这是历史implemented-but-unwired/deferred事实，不能说当时已完成真源接线。[P3规格](../design/deep-integration-v2-p3-dev.md)/[P3验证](../design/deep-integration-v2-p3-verify.md)没有证明这项接线已交付。后来原RA-P2002合同及最终inheritance §5第5组明确把“合法历史恢复后export→task出站关联位→重开”列为有效余链，因此本批不能继续自动豁免。

| Expected | Observed |
| --- | --- |
| p-0001已有audit6，任务出站位按该项目最新记录 `2026-10-22T21:23:08.315Z` 显示“已导出 · 最近… · 外部为唯一事实源”，重进保持，只读 | round07任务表、round08编辑抽屉均无出站说明；round09在snapshot成功后取样，7个真实标题、`slots=[]`、outboundTexts=[] |
| 真无记录项目显示“未导出”，不借其他项目时间 | 本包没有用B项目界面验此反例，不签B展示PASS；当前接口无audit派生字段 |
| 标识覆盖实际任务行，不因顶层/子层入口变成不可达 | 冻结tasks.tsx的leafRow含slot，但7条A任务均parentId=null，实际走groupRow，无slot |

精确原证：[round09 slots](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/round09-task-slot-observation.json)，观测时刻 `21:25:05.347Z` 晚于真实snapshot response `.188Z`；rpc `09348a3a-dc94-4670-a56d-9ab4b63bc3a6` / cmd101。snapshot有8条全项目任务，逐条与原DB相同，A的7条均为顶层任务。无需依赖标题中含“出站”来伪充状态位。

冻结源码定位：[tasks:257–267](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/frozen-source/src/client/views/tasks.tsx#L257-L267)定义latestExport缺省；[leafRow:947–957](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/frozen-source/src/client/views/tasks.tsx#L947-L957)含既有slot；[groupRow:967–1011](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/frozen-source/src/client/views/tasks.tsx#L967-L1011)缺slot；[实际渲染:1553–1558](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/frozen-source/src/client/views/tasks.tsx#L1553-L1558)顶层走groupRow；[panel:1346–1367](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/frozen-source/src/client/panel.tsx#L1346-L1367)未传latestExport。实际snapshot只带口径settings，不带pmExportAudit或最近出站投影。既有 [core/export](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/frozen-source/src/core/export.ts#L129-L255)已提供日志只读与TTL逻辑，不是缺后台出站功能。

负责人提及U4 unifiedRows；**本包冻结正文实际命名为leafRow/groupRow/treeRows**，这里按被冻结源码定位，不读取Main当前unifiedRows，也不据口述给其当前行号。当前顶层路径缺位已由原件确证，但本包未提供迁移前后源码比较，**不无证归因“U4删除了原标识”**。修复应适配Main当前实际统一行路径，不能恢复旧树实现或只改不可达占位。

### 5.1 最小 source 与复验合同

以下是Main/开发按持续父授权修既有缺陷的合同，不是本角色执行动作；不新增页面、按钮、调度、外部平台、迁移或三档重验。

| 文件/动作 | 最小改动 | 必要复验 |
| --- | --- | --- |
| `src/client/views/tasks.tsx` | 在当前实际任务行路径复用既有只读出站文本，包括顶层/子层/状态分组，不能仅修改旧占位；不改变排序/编号/状态/清单 | 真audit项目有“已导出/最新时间/外部唯一”，无记录为“未导出”；实际行及重进可见、长文本不遮编辑；原U4行/排序受影响回归 |
| `src/client/panel.tsx` | Snapshot类型消费真实项目出站投影，按selected project传入既有latestExport；不伪造时间、不借规范化口径settings猜audit、不将含fs的core/export导入浏览器 | 项目A最新记录、项目B无记录隔离；refresh/重进相同，读取和切项目均零业务写 |
| `src/index.ts`现有web snapshot分支，仅确实无只读audit来源时必要 | 本包真实snapshot确无该来源；Main先核其冻结/候选实现位置，再沿既有snapshot补最窄只读项目最近出站投影，复用已有readExportAudit，勿暴露全settings或新增路由 | request→真实投影→panel→任务位同源同项目；记录时间晚旧值，null不造值；不能让读取触发TTL/归档或写task |
| 当前相邻专项测试及候选绑定 | 按实际所有文件清单补真源传值/有效行渲染/无记录/项目隔离/零写测试；唯一builder或隔离输出 | Main新候选baseline/diff/新增指纹→产物→宿主/PID/flags→原GUI与DB证据→独立复验；不直接继承旧host本红项 |

`src/index.ts`不在本包9份冻结源码内，不能伪称本角色已审其当前实现或指定具体新增字段名/行号；上表是沿真实RPC缺源的最小接线合同，由Main确认落点。不改本已签TTL/backup实现，不要求重做31/29历史标准恢复、三档覆盖或K16修复；优先复用本有效原证，只补source变更受影响的接线/GUI/只读回归。

## 6. P2007 done/wrapped、量化与重进

**有限 PASS：本窗口 `2026-10-16..2026-10-23` 的真实done/wrapped素材、量化与known来源，以及真实浏览器重进同读。** 不签整review周期边界矩阵、X6内容质量/人工final或新素材页面。

round02 `/pm review p-0001 2026-10-16 2026-10-23` rpc `9c2c03a8-a1dd-401f-a898-3e3308999776` / cmd85；round04重进同命令 rpc `d3bddb8c-a57e-45e4-bbc6-20488cf467f2` / cmd88。两完整返回text逐字相同，JSON按同一数据渲染，前后原根零写。timeOrigin从 `1792702378676.4` 变为 `1792704014941.6`；不是用after截图冒重进、也不是新宿主PID证明。

| 原源 | 返回口径 |
| --- | --- |
| t-0007：done100、completedDate2026-10-23、真实evidence | kind=done、done=true；正式完成仅1，平均100 |
| t-0008：人wrapped65、updatedAt2026-10-22 | kind=wrapped、done=false；单列收尾1，不计正式完成平均 |
| m-0001：achieved、achievedDate2026-10-22 | 达成里程碑1 |
| 原3反思+本次task-done新反思 | known4+1+2+3=10；按id/title/sourceEvent逐句匹配真实draft.lines，JSON/MD一致；不把旧task-done草稿当旧任务当前done |

量化为done1/wrapped1/ms1/known10/avg100，review行来自p-0001，B任务不混入。done本地完成日与UTC记录日不同属原值，未调整墙钟。既有t1/t3/t6及三原反思未改，本次只有t7完成触发1条新草稿，t8收尾没有追加task-done草稿。

round02真实archive rpc `589deb65-a9d7-446a-a90f-6358c115b5ed` / cmd86：[package原复制](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/exported-originals/archive/package.json) 8882 bytes、SHA `5898502dbb608e9716fd483756e2393cef25f43e16c7b4ed20342f222c8c747a`；[字段README](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/exported-originals/archive/README-字段说明.md) 1290 bytes、SHA `3f5b60e6d3e60775e5c1c9ff02c8337cd4a473c1b419aadecc8898d5e2e95f02`。均回绑原复制清单；包中done/wrapped状态保真、project一致；archive前后全37项原根零差异，不写K18。新archive文件本次没有真实file打开事件，不冒称目视打开该JSON；旧文件入口事实不在本轮重裁。

**K16 known/gaps原FAIL沿 [原红证](p2007-archive-known-gaps-red-20261023-r1.md) 保留。** 冻结archive/review源码仍对应原旧host；当前Main修复未装此host。新done/wrapped/known10正例不洗旧红、不替代修后复验，不重做原缺陷裁决。P2007整项仍未PASS。

## 7. 原图目视与时序限制

独立专家实际调用view_image看了7件原PNG/JPEG，非浏览器操作：

| 原图 | 实际可见与限制 |
| --- | --- |
| round03-web-open.png | 完整只读HTML、字面标题、无破图；fileURL/onattr/请求数量来自配对JSON/事件，不靠截图推断 |
| round04-after-read.png | 现有composer反馈可见done/wrapped及1/1/1/10/100、MD和JSON文本；不称专用素材卡或整个呈现/UX通过 |
| round05-after-precheck.png | 可见结构/关系/侧车预检、尚未恢复、confirm原命令；零写来自roots |
| round06-after-second-read.png | 可见active5，29天行保留、31天不在active；archive保真来自完整DB，不冒称截图看到了archive |
| round07-task-list.png | 真实A项目7条，顶部任务行操作仅编辑，无出站标识；视口未容纳全部7条，完整集合来自JSON |
| round08-task-detail.png | t7真实名称/description/done100字段，抽屉及后方任务行无出站说明；不能把名称中“出站”当功能标识 |
| [round09末帧54](../../reports/all-pending-evidence-20261021/P2OutboundFixtureR1/frames/round09-readonly-reentry-54.jpg) | reload后A项目/7条真实任务已呈现，当前入镜行无出站位，与晚于snapshot返回的slots观测配对 |

round09 `task-reentry.json` 在snapshot返回前抓到了“暂无项目”的加载空态，不用该JSON/同名PNG单独证明缺位；其timeOrigin只证明重进时间。后续真实RPC、七标题/bbox、末帧形成已加载证据，且第5节有效渲染源码解释该观察。超视口标题bbox不冒称全部目视可见。

未覆盖边界：没有整P2/P3/全部GUI矩阵、全安全字段、31天旧文件真实发送、全备份失败恢复、安全快照原完整正文复读、当前Main修复后的source/运行实例、ordinarycommit准入。没有因为本包合法历史记录使用测试fixture而声称历史真实发生；没有为补缺证新增功能。

## 8. 实际命令、封存与释放

实际运行环境macOS/darwin、现有nvm Node `v22.23.3`；pnpm未调用。以下只运行自有reader，不运行产品脚本。工作目录为仓库根，各命令独立执行：

```sh
node /tmp/p2-outbound-history-review-20261023-r1-reader.mjs verify
node --check /tmp/p2-outbound-history-review-20261023-r1-reader.mjs
node /tmp/p2-outbound-history-review-20261023-r1-reader.mjs capture
node --check /tmp/p2-outbound-history-review-20261023-r1-reader.mjs
node /tmp/p2-outbound-history-review-20261023-r1-reader.mjs capture-r2
node /tmp/p2-outbound-history-review-20261023-r1-reader.mjs seal
```

verify/两次语法/capture/capture-r2均exit0。首capture63项满足；补充31条备份记录映射、零写链、6项恢复差异、真实导出时刻/active前缀后，终审r2为70项满足，unsatisfied0，**包括确证任务位红，非70产品用例PASS**。首audit保留，不用它代替终审r2。探索性Node输出曾多写一个右花括号，SyntaxError exit1，未执行/未写文件；纠正后exit0，不作产品失败。

有效机器结果见 [audit-r2](p2-outbound-history-review-20261023-r1-audit-r2.json)；最终 `p2-outbound-history-review-20261023-r1-seal.json` 对1708明确输入、原包物理清单及本前缀输出做漂移/链接/空白复核。不声称全机或并行Main改动零变化。自有reader唯一imports为fs/path/crypto；不读取未封产品源码，不访问原件中列出的private运行路径。

本轮产品执行NOT_RUN、GUI执行NOT_RUN；原图独立目视已完成。有限PASS仅第3/4/6节指定断言，FAIL为第5节原承诺任务位；K16旧红保留。Main按第5.1节与原K16合同修复、提交新绑定原证后再独立审签，本角色不ordinarycommit、不push、不release。未持有源码/builder/GUI/端口/profile/业务根资源，没有长运行子进程。**released，STOP。**

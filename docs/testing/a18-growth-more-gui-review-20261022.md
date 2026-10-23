# A18 旧 A13 成长补证有限独立 GUI 审证

> 独立测试专家，平台 `trae`，2026-10-22。A18 是证据目录，不是新产品候选；Main 只采证，本报告独立判定。仅本前缀可写，不开发、不操作 GUI、不签 A16 或整门。

## 1. 有限结论

**所审切片有 1 项有限 GUI FAIL：习惯建议收件区不显示建议自己的关联 OKR。确认/忽略写入守卫、未来/超窗拒绝、人 final 幂等、F5 解绑后正常表单重新关联分别有限 PASS；错误视觉与按 OKR 聚合 GUI 未覆盖。不能据此放行全 P3001/P3002/P3004、全习惯或发布。**

| 原合同与切片 | 判定 | 覆盖边界 |
| --- | --- | --- |
| RA-P3001：两 suggest 未确认不建档→真实 PM confirm/ignore→重复 confirm→重进 | 有限 GUI PASS | suggest 只写 settings；confirm 新建一条关联 draft，ignore 不建记录且保留；重复确认错误/零写，重进保留；不自动 final |
| RA-P3001：rationale / 关联 OKR 可见 | **有限 GUI FAIL，A18-GM-01** | 两条 rationale、状态与操作可见，但建议条目不显示各自 okrId/目标；确认后的 habit 关联可见不替代建议确认前/忽略后的关联可见 |
| RA-P3002：D+1、D-3 拒绝与零写 | 有限命令通道 GUI PASS | 真实可见 composer 输入→请求→user run/done error→raw 保原三天，四根每步零差异；**不签错误文案视觉** |
| RA-P3004：人 final / 重复 final / PM 重进 | 有限 GUI PASS | 显式人命令，draft→final；仅 status/updatedAt 变化；重复完整 raw 不变；PM 显示“已定稿”、原三条打卡与两条补记 |
| RA-P3004：真实 B 项目 OKR / 跨项目关联拒绝 | 有限命令通道 GUI PASS | B 目标经真实 add 新建，不是伪 seed；A habit 更新 B 目标返回 error，四根每步零写；不签失败表单保输入或错误视觉 |
| RA-P3004：F5 取消关联→PM 未关联→正常表单选原 OKR→主保存→重开/cancel | 有限 GUI PASS | null 命令实际删除关联键；后段按 F5 标题定位，不以首 edit 冒充；主保存只变 okrId/updatedAt，ID/final/普通字段/三天历史全保 |
| RA-P3004：按 OKR 聚合 / 完整关系门 | BLOCKED / 未覆盖 | 无该 GUI 入口，不发明控件；旧 AUTO 只读筛选断言只引用，不移签到 A13 GUI |
| 宿主 hero 中错误视觉、全 AUTO+GUI、样式矩阵、长历史、A16、其他在途门、发布 | BLOCKED 或不在本批 | 空 hero 没有命令结果卡，不能假图；本角色不重复原 A15、Strict、G04 |

原 [A15 有限报告](a15-busy-habit-gui-review-20261022.md) 保持原时点与原 215 条索引范围，不扩签。原正例 D/D-1/D-2、重复今日及普通字段编辑结果只按其已签范围引用；本次仅对新补件作判定。

## 2. 授权与审证方法

负责人本轮原句，保留对象与停止条件：

> 独立A18目录的A13旧产品growth补证GUI审证，非开发/GUI端。用户持续验已有范围/最后统一commit/独立分工。读AGENTS/collab§9/11、docs/testing/remaining-governance-cases-20261021.mdP3001/2/4、a15-busy-habit-gui-review-20261022.md，原A15habit215索引与新reports/all-pending-evidence-20261021/A18/growth-more/{index.json,observations.json,execution,各33step全部原证}。只写docs/testing/a18-growth-more-gui-review-20261022*;禁产品/其他testing/livingdocs/build/install/GUI/service/credential/commit。
>
> 仅上述必要子范围有限PASS/FAIL/BLOCKED；P3004按OKR聚合contract若GUI无入口，不发明控件，核源与原AUTO只只读引用，明确未覆。命令hero结果不可见不能假图，评判命令承诺可用真实输入/事件/raw+PM变化，错误视觉仍缺明示。A16新context/build全门不签。
>
> 保护原证/完整A13/A14/A16源lib及旧报告，Main其他新增不纳零写；有证据质疑具體最小补件。完成释放，本角色不重复原A15/Strict/G04在途任务。

依据 [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)、[原 P3001/2/4](remaining-governance-cases-20261021.md#5-p3习惯与周期占位)、[原 Main GUI 步骤](governance-growth-independent-auto-20261021-gui-handoff.md)。明确专项授权优先于通用 fetch/pull、install/build、产品回归、livingdocs 同步与提交要求；脏树不清理、不整树认领。

原证根 `reports/all-pending-evidence-20261021/A18/growth-more/`：读取 index、observations、两版采证 execution、封存脚本与 33 step 的全部归档原件。独立 Node 内建 fs/crypto 解析、哈希、重算四根差异、完整 raw 字段/请求事件相接；只读源作为机制旁证。没有导入产品、执行采证脚本、浏览器连接、服务请求、读取 private 凭据或 live data。

## 3. 候选、装载与原 A15 保真

| 对象 | 实核 |
| --- | --- |
| 插件基线 / 宿主声明 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` / `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；不把 HEAD 当 dirty 候选 |
| A13 实存候选 | `A13/candidate-final.json`，SHA `d70267f974fb9aa8aaf496a4f1d49abef33d26d410b6a453eb4569fadaa9a51f`；tree `/private/tmp/pmtool-a13-closure-20261022`；514 输入、453 产物逐文件匹配 |
| 候选路径笔误 | 新 observations 写 `A13/candidate.json`，该路径不存在；原 A15 与实存 final 候选、源/产物、环境及完整 loaded 相接明确，非换候选。此处纠正引用，不改原件 |
| A13 tracked patch | SHA `824d9c3c96095731580fac8edffbaced9998d5b8e245affbbb8c342e07df507b`；继续原候选，不补造提交 |
| 原 client | 1702759 字节，SHA `7f037fce5115157101afb64cef7b7fd0e470742ac3eb96a11cabe0a43e56ae7c` |
| 完整 combo | 2581559 字节，SHA `69656e3d1164c9a26bea86a31138adc42167fc8abcacb66941ef7ed211b405fa` |
| loader 完整规范化段 | 去末尾 sourceURL/sourceMappingURL 后补换行/分号，1702727 字节，SHA `c29382ca1c7f2e5f2a1ddbcbbccb4b0e92258142e585ab3b122ac0fd1c28289d`；offset875361、第二处=-1，唯一完整 client，非短哨兵 |
| 原 loaded | `A13/final/materials/loaded/result.json`；target/frame `2EDCCF4D81671D87CBBD9934F50CF274`，request94843.126，200、非 disk cache；开关 pilot OFF |
| 本补件页 | 30 份成功 actual/host-state 全部 origin `http://127.0.0.1:3242`、原 `timeOrigin=1792618531950.5`；采证 helper 查找已有同 origin 页、不初始化新页；step 未单列 target，不谎称逐步采了 target |
| 环境/尺寸 | 原 A13 materials 隔离 root；CSS1440×718、DPR2、深色、outer1440×857；原 loaded1440×900不是本轮实测矩阵 |
| 原 A15 索引 | 原 index SHA `9688cf711976ae5d93ff391df56992664fc39f80b74a2aff78f37ff26dfcc3bd`，215 条全匹配；加 index 共216项与原 r2 封存的 SHA/bytes/mtime 全相等 |
| 原索引后额外件 | `habit-inspect-1792627187642`、`habit-nav-1792627217555` 共25文件，只声明/保护；不倒填旧 index、不用于扩签 A15 |
| A14 / A16 保护 | 各515/519声明输入、各453产物匹配并保护；不代表其业务、context、build 或完整门 PASS |

旧 A15 最后 cancel 的 F5 完整 raw 与本次首次成功命令 raw 深相等，含 goal/frequency/notes、三条 checkIns、streak、原同项目 OKR、draft。合法 F5 备份/生产 seed 链只引用原 A15；本次未手改历史、绕补记窗、调整系统时钟或另恢复数据。

## 4. 命令输入、请求与事件

完整原件共 **46 个事件 / 23 对 run-done / 23 个请求**：13 次 habit/OKR 业务命令、10 次 `web snapshot`。每个 request 的 line 与 run.args 完整相等；name=pm、source.kind=user、commandId 与 done 一一配对；agentId 全为原 session `session-792b22a6-e1db-428a-8816-4e86592a7262`，submittedAttachments=[]。

`requests.json` 保存路径 `/api/commands/execute` 与真实 `client-request`/rpcId/method/payload，不包含 HTTP method/status/header。**POST 有宿主声明提交的 RPC 源码佐证**：`packages/client/connection/src/client/rpc.ts:33-55` 对该信封走 `method:'POST'`/JSON body；不冒称本包另保存了 Network.requestWillBeSent.method 或 HTTP 200。真实动作来自可见编辑器 type→Enter，非审证端 fetch/直接调用 command。

10 次成功 composer 业务提交均有 `before-submit.json/png`：known session、hero 可见、完整输入、editable=true；提交后 editor 空、cards=[]；各步只出现一对对应业务 run/done，没有 double submit。恢复使用正常 Meta down + a + Meta up，原 r1 的 `Meta+A` 失败未被覆盖。

### 4.1 日期与人 final

以下为原证 UTC；业务 D=2026-10-22，和原三天正例一致，不依审证机器当前时钟重算。

| step / run seq | 真实提交与结果 | 独立 raw / PM |
| --- | --- | --- |
| `command-1792627408204` / 97→98 | checkin F5 `2026-10-23`；error“不能为未来日期…打卡” | 四根每步零差异；habit 全字段与原末态相等 |
| `command-1792627427738` / 99→100 | checkin F5 `2026-10-19`；error“只能…过去2天内（10/20~10/22）…超出补记窗” | 同上；streak/checkIns/updatedAt 不变 |
| `pm-habit-1792627446124` | PM 实际重进 | F5 仍draft/原三条；只读 snapshot |
| `command-1792627469653` / 103→104 | `habit final`，user / success | 仅 status=draft→final、updatedAt 变，原关系/普通字段/创建时间/历史/streak 保留 |
| `command-1792627492581` / 105→106 | 重复相同 final，success | 含 updatedAt 的完整 habit 字节/字段不变，四根零写 |
| `pm-habit-1792627509634` | PM 重进 | 原 PNG 明确“已定稿”、3天、10/22/21/20及两条“补记”；无伪 command 结果图 |

## 5. 建议确认与可见性缺陷

| step / run seq | 写入与保留 |
| --- | --- |
| `command-1792627571916` / 109→110 | 真 suggest：QA采纳建议、rationale、原同项目okrId；只新增 settings/pmHabitInbox，不建 habit |
| `command-1792627588135` / 111→112 | 真第二 suggest：QA忽略建议/理由/同一okrId；只改 inbox，仍唯一 F5 habit |
| `pm-habit-1792627598950` | PM 两 pending/理由/两操作可见，未创建记录；与 full snapshot、settings 原件相接 |
| `habit-confirm-1792627633171` / 115→116 | 真点击匹配标题的“采纳并建习惯草稿”；只新增 `habit-mvis7j18-8evvof` + 改 inbox |
| `habit-ignore-1792627649060` / 121→122 | 真点击第二建议“忽略”；只改 inbox，无新 habit，既有两 habit 完整不变 |
| `command-1792627678652` / 127→128 | 重复确认，error“该建议已确认过”；四根每步零差异 |
| `pm-habit-1792627703623` | 真重进，原两 habit/final与draft、两processed建议保留；完整 raw 不变 |

confirm 新档为 p-0001、原 `okr-mvi5z847-33y3xk`、draft、空 checkIns、streak0、稳定新 ID；不自动定稿。inbox 第一项只新增 confirmedHabitId/processedAt 并改 status；第二项只新增 ignoredAt 并改 status。两项原 id/at/projectId/title/rationale/okrId 全保留；settings 信封 `{version:2, record:{value:{entries},updatedAt}}` 仍完整。其他 `pmExportAudit/pmExportSent` 从首件至末件全文深相等，OKR/F5不因建议额外变化。

### 5.1 A18-GM-01：建议关联 OKR 未展示

**有限 GUI FAIL，建议按 P2 排修；严重度不构成豁免。** 原合同 [RA-P3001](remaining-governance-cases-20261021.md#5-p3习惯与周期占位) 明确“rationale/关联OKR可见”。两建议 raw 与实际 snapshot 都有原同项目 okrId，rationale 原图可见；但 pending/confirmed/ignored 的建议条目仅 ID、title、时间、理由、状态/操作，**没有各自关联目标或 ID**。

关键原证：`pm-habit-1792627598950/actual.png`、`habit-confirm-1792627633171/frames/000003.jpg`、`habit-ignore-1792627649060/actual.png`及其`frames/000002.jpg`；actual.pm.text 与 settings 全字段交叉核对。只读 A13 `src/client/views/habits.tsx:271-309` 的 map 同样没有渲染 `s.okrId`；不是数据缺失或截图顶部被裁。F5 卡片显示目标、采纳后的新 habit 也显示目标，均不能说明被忽略建议自己的关联。

最小补件/修复边界：由开发/Main 补已有合同要求的建议关联展示，不由审证角色改代码；同候选重采原两建议 pending→confirm/ignore→重进的关联标题/ID可见及原字段/零额外 habit 写，交独立复验。若已有原图可证明该建议自己的关联入口，只需指明原路径/步/对应 ID，不必重跑整批。该 FAIL 不改写功能守卫的有限 PASS，也不授权继续新功能/发布。

## 6. 关系选择与 33 step 完整覆盖

| step / run seq | 原链与范围 |
| --- | --- |
| `habit-edit-1792627721162` | 首 edit 使用 r1 first-card，实际名称“QA采纳习惯草稿”，不是F5；零写 |
| `habit-select-none-1792627731447` | 仅打开该草稿 listbox，没选择空关联、没提交；不能当 F5解绑证据 |
| `habit-cancel-1792627760851` | 关闭抽屉，零写；后续宿主打开失败单独保留 |
| `command-1792627846925` / 131→132 | 真实 `okr add p-0002`，新增 objective `okr-mvisc3xm-tam2uc`，draft；只有该 OKR 新行，不改 habit |
| `command-1792627862888` / 133→134 | A/F5 update B目标，error“关联目标不属于指定项目”；四根每步零差异，F5仍原关联 |
| `command-1792627870395` / 135→136 | F5 `okrId:null`，success；仅删除 okrId 和 updatedAt变，不是写空字符串 |
| `pm-habit-1792627878219` | F5 无关联行；新QA草稿仍显示原关联，未误解绑另一记录 |
| `habit-edit-1792627906983` | 新版 execution 按精确F5标题定位；原图名称/普通字段明确、关联“不关联”，零写 |
| `habit-select-original-1792627914207` | 真实打开 listbox→点击原 `F5目标（okr-mvi5z847-33y3xk）`→关闭；PNG及frame000001相接，未保存时raw仍无okrId |
| `habit-save-1792627921818` / 139→140 | 主“保存”，frame000004“保存中…”→实际关闭/成功toast；只变F5的okrId/updatedAt |
| `habit-edit-1792627947128` | 精确F5真重开，名称/goal/frequency/notes/原关系回读；不是QA草稿 |
| `habit-cancel-1792627954370` | 真cancel关闭；含inbox/两habit/两OKR完整raw与保存后相等，零写 |

以上加§4/5共25步骤，其余8步全部纳入原件核验：

| step | 原件与判定口径 |
| --- | --- |
| `host-open-1792627347246`、`host-open-1792627457527`、`host-open-1792627562245`、`host-open-1792627663509`、`host-open-1792627831081` | 5次成功切回原session/composer；原actual/host/四根/raw/frames齐全，逐步零写 |
| `command-1792627367137` | exit1 `Unknown key: "Meta+A"`，编辑器click后、提交前失败；commands/requests空，无actual/after/raw，不填造零写或成功 |
| `host-open-1792627776097` | exit1，等待contenteditable composer30秒超时；原帧仍PM页，不判已切宿主 |
| `command-1792627784917` | exit1 `visible owned composer missing`，无请求/事件；与并发host-open归档时间交叠，不按文件名捏造完成先后。后成功host-open及B add是独立恢复件 |

33集合实际为 **30成功 + 3原失败**。失败原件只证明执行设施/定位未完成；产品拒绝命令的done.error发生在exit0步骤，不把采证exit0当业务success。

F5重新关联保存前后只变 `okrId/updatedAt`；原id/projectId/title/goal/frequency/notes/createdAt、final、checkIns/streak全保。新QA draft从confirm至最终cancel全文不变；原同项目OKR全文不变。这里验证“无关联→原同项目关联”，不是切换到第二个合法同项目目标、missing目标、所有OKR kind或新建手工habit表单。

## 7. 未覆盖与最小缺口

**按 OKR 聚合 GUI：BLOCKED/未覆盖，不开产品 FAIL。** A13 `index.ts:218-251` 的 web snapshot 透传 habits/okrs/habitInbox；`habits.tsx:100-113,155-182` 按项目筛选、按时间排序及逐习惯显示目标，无按OKR分组/聚合按钮。本包只重进习惯页，没有聚合操作原证。

原 [治理成长 AUTO 报告](governance-growth-independent-auto-20261021-report.md) 的 RA-P3004 只读引用，其冻结对象为 soAcAa，不是本 A13。原 worker `902-919` 的“aggregate”实际为 `snap.habits.filter(h=>h.okrId===objectiveB.id).length===1` 与业务零写；并非生产聚合UI控件或聚合结果页。既不抹掉其原有限AUTO，也不据此把A13 GUI聚合签绿。需要继续该既有子项时，由协调者明确现有只读通道与呈现证据；不为采证发明入口/新增需求。

**错误视觉：BLOCKED/未覆盖。** future/D-3/重复confirm/跨项目的真实done.error与raw充分支持命令守卫；before输入可见、after空hero/cards=[]，无可见错误文案。不能把done.text排版成截图、把PM成功toast借作宿主错误。要关闭视觉缺口，最小是同候选真实可见错误呈现原件与输入/返回关联；本角色不操作GUI或改宿主。

不签长历史/断签/月折叠、四宽浅深/200%/读屏/全键盘/全部error-loading、重启新进程恢复、非人来源final拒绝、跨项目失败表单保输入、A16全context/build门。原合同状态不因本报告自动全绿，其他专家既有工作不重复、不暂停。

## 8. 原证完整性、差异与独立目视

新 index **970/970 SHA与字节匹配**，加index共971文件，未列原件0；33份frame manifest、**460/460 compositor JPG SHA匹配**。原 A15 215索引/216封存文件保持，25额外原件不纳旧索引。不能以原件/帧数量冒充用例通过数。

实际独立目视 **17 PNG + 5 JPG = 22路径**，路径/SHA/bytes/mtime见 [r2.visual](a18-growth-more-gui-review-20261022-audit-r2.json)。包括真实composer未来/超窗/final/跨项目输入、空hero、final三天、pending与理由、confirm/ignore前动作及后留痕、首错对象编辑、F5未关联/选择/主保存busy/成功/reopen/cancel。抽屉有半透明转场，仍只签可观测字段与流程，不签稳定动画/全样式；reopen图不称新进程恢复。

所有30成功step原四根diff独立重算吻合：**8个预期写step、22个零写step**。写step分别为final、两suggest、confirm、ignore、B add、unlink、save；不把业务成功记零写。files/backups/exports各步均零新增/删除/变化，data保既有任务/字节侧车/session等，不等空库。

步骤间相邻成功采样另有 **18处 session_projcache 原session指纹变化**，其他业务表/文件/备份/导出无间隙额外变化；未归档session正文，不猜测确定根因，不宣称全旅程四根零漂移。33份console数组为空，仅支持各监听窗口无所录警告，非步骤间连续监听或全宿主无警告。

observations 摘要刻意过滤 snapshot；**8个步骤内合计10对snapshot被过滤**，摘要保13对业务事件，完整23对始终以每step commands/requests原件为准。r2按完整原件相接后，摘要的业务事件/exit/diff均吻合；过滤摘要不是完整事件账，不能拿其数目作总事件数。

## 9. 验证、保护与释放

本轮运行环境 macOS darwin/arm64、Node `v22.23.3`，cwd仓库根；pnpm11.28.5为项目约定，未调用。实际专项命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a18-growth-more-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-growth-more-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-growth-more-gui-review-20261022-audit.mjs r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-growth-more-gui-review-20261022-audit.mjs seal
git diff --check -- 'docs/testing/a18-growth-more-gui-review-20261022*'
```

首轮审计 exit1、27/28证据断言成立，保留 [audit.json](a18-growth-more-gui-review-20261022-audit.json)：错误假设为observations保完整snapshot事件。读取原封存脚本明确过滤后，仅修本前缀审计口径；不改原件。r2 exit0、**31/31证据断言成立**；语法/diff检查exit0。它们是证据一致性检查，不是产品完整测试门、也不消除 A18-GM-01。

保护集合 **4179文件**：新包全部原件、原A15包括额外件、原loaded/seed/F5备份、A13/A14/A16全声明源与453产物、已读旧报告/约定/脚本。首轮、r2与终封存的新增/删除/SHA/bytes/mtime变化均0，见 [seal](a18-growth-more-gui-review-20261022-seal.json)。不监控整个主脏树或其他Main新增，不据此声称全盘零写。审证产物仅本前缀，原失败、报告与证据不覆盖。

未fetch/pull/install/build/产品verify/GUI/service/credential/commit/push，不写livingdocs或其他testing。仅只读git定位、Node内建证据检查与本前缀报告/审计结果。探索rg不可用转标准命令，指定memory路径不存在均未安装/修改环境。所有本角色命令结束，未持有GUI、builder、端口/服务；**完成审证即释放本角色**。Main与开发按上述既有缺陷/缺口继续补件并交独立复验，最后统一commit仍由负责人/协调者处理，本角色不提交、不启动下一功能。

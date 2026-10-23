# A15 文件忙态与习惯补件有限独立 GUI 审证

> 记录两组 A13 冻结产品原证的独立判定，给 Main 与接续专家引用；平台 `trae`，独立测试专家，2026-10-22。只审证、只写本前缀，不开发、不执行 GUI、不签整门或 A16。

## 1. 限定结论

**文件忙态输入禁用→明确取消/放弃→新草稿空输入恢复，以及习惯三天显式打卡/重复今日/编辑主保存与重开保历史，均为有限 GUI PASS。所审切片未确证产品 FAIL。F02 整门、全习惯和全矩阵不由本报告放行。**

| 原合同与切片 | 独立判定 | 精确边界 |
| --- | --- | --- |
| RA-F02 / 真任务文件 input 忙态 disabled 与可见文案 | 有限 GUI PASS | 正确 aria 输入 `false→true`，真实原生中文22字节文件、Request hold及“上传暂存中…”原图相接；不是隐藏导入 input |
| RA-F02 / 明确取消、放弃、关闭→fresh draft恢复 | 有限 GUI PASS | 确认框原帧、关闭、同页新草稿 `disabled=false/value=""`；全部已监视 data/files/backups零差异。新空图只拍顶部，恢复文件控件属性来自原探针，不谎称该行在PNG可见 |
| RA-F02 / 上传中主“添加任务”禁用 | 不作 PASS/FAIL 要求 | 原值 **false**，如实保留；原合同不要求其禁用，本轮未点击主保存，不新增 Oracle |
| RA-F02 / 宿主收件后迟201、自动 Strict effects、整 AUTO+GUI | BLOCKED / 本报告不签整门 | 本轮只停Request，无宿主201；另一专家AUTO到件仅只读引用，不自运行、不复判。自动严格effects仍为其报告的BLOCKED |
| RA-P3002 / 今日D、D-1、D-2显式打卡、重复今日 | 有限 GUI PASS | 本地今日10/22、昨天10/21、前天10/20；三条raw、两条backfilled，streak逐步1/2/3；重复同日无新增、不改raw |
| RA-P3002 / D+1及D-3拒绝、整个两天补记门 | BLOCKED，未执行负例 | 无对应命令/原证，不把三次正例或重复今日替代拒绝与零写 |
| RA-P3004相交 / 既有关联展示、编辑保存保ID/OKR/历史/status | 有限 GUI PASS | F5合法同项目objective，三个普通字段保存、真重开、cancel，状态一直draft；不是新建/改选关联或人final |
| RA-P3004 / 新关联、跨项目拒绝、按OKR聚合、人final及幂等 | BLOCKED，未执行 | 原OKR不变只支持本次保留/展示，不证明上述通道；不给整个P3004 PASS |
| 建议确认、长历史/断签、全习惯、全GUI矩阵、新A16 client、发布 | 不审签 | 收件区空展示不等suggest/confirm/ignore已验；未执行未来、D-3、final或新候选 |
| collector40456精确argv/cwd→TERM完整原命令链 | BLOCKED，缺工具原输出 | 原end和事后ps无此进程可引用；用户叙述与脚本SIGTERM路径不能冒充实际argv/cwd/TERM输出，不要求再停进程 |

原 [file-fault报告](a15-file-fault-gui-review-20261022.md) 的已签切片、错误原件与其他缺口保持。这里只补其§7.1实际文件输入忙态与取消后fresh恢复；不修改旧报告，不倒签旧时点，更不替全F01/F02发布门。

## 2. 授权与方法

负责人本轮边界原句：

> 独立两个无代码GUI补件审证，非开发/GUI。只写docs/testing/a15-busy-habit-gui-review-20261022*；不产品/其他testing/livingdocs/build/install/GUI/services/credentials/commit。
>
> 请实核A13源/artifacts完整loaded/所有index帧hash、独立目视输入busy/empty和habit主要状态/原rawdiff，给限定切片PASS/FAIL/BLOCKED及未覆边界，不签F02整门/全习惯/全矩阵/newA16client。保护原证/A13/A14源lib，报告后释放。
>
> Main唯一GUI继续A16准备，F02严格AUTO另一专家在跑，不重复其用例/结论；可只读引用到件不自启动。

按 [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)、[remaining-journey RA-F02](remaining-journey-cases-20261021.md)、[remaining-governance P3002/P3004](remaining-governance-cases-20261021.md)及原file-fault最小补件执行。明确限定优先于通用fetch/pull、install/build、整包回归、livingdocs同步和提交流程；脏树不清理。

原证根分别为 `reports/all-pending-evidence-20261021/A15/file-busy/` 与 `growth-habit/`。读取原index、observations、execution、各step/raw/commands/console/frames/PNG，另核A13/A14声明源与产物、两份完整loaded、F5备份及原恢复预检/落盘。专用审计仅用Node内建fs/crypto解析与哈希，不导入产品、执行原采证脚本、连接浏览器/服务、读取凭据或live runtime。本报告的PASS由独立审证角色给出，不把Main exit0/文字观察当PASS。

## 3. 候选与完整装载身份

| 对象 | 实核 |
| --- | --- |
| 产品基线/宿主声明 | 插件基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；宿主归档 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`。本轮不探live宿主；HEAD不单独代表dirty候选 |
| A13产品树 | `/private/tmp/pmtool-a13-closure-20261022`；**514声明输入、453产物逐文件SHA匹配** |
| A13候选/原tracked patch SHA | `d70267f974fb9aa8aaf496a4f1d49abef33d26d410b6a453eb4569fadaa9a51f` / `824d9c3c96095731580fac8edffbaced9998d5b8e245affbbb8c342e07df507b` |
| A14保护核验 | `/private/tmp/pmtool-a14-closure-20261022`；**515输入、453产物匹配**。不以此签A14业务，本次两页均A13 |
| client完整原件 | 1702759字节 / SHA `7f037fce5115157101afb64cef7b7fd0e470742ac3eb96a11cabe0a43e56ae7c` |
| 两份实际combo | 各2581559字节 / SHA `69656e3d1164c9a26bea86a31138adc42167fc8abcacb66941ef7ed211b405fa` |
| 完整loader规范化段 | 按原loader去末尾sourceURL/sourceMappingURL并补换行与分号：1702727字节 / SHA `c29382ca1c7f2e5f2a1ddbcbbccb4b0e92258142e585ab3b122ac0fd1c28289d`，offset875361、第二处=-1；不是短哨兵匹配 |
| file-busy实际页 | A13 main3243；target `6D0411984B826559D61A327AF288F035`；10份状态/探针一致 `timeOrigin=1792622511513.4` |
| file-busy loaded来源 | `A14/fresh-file-supplement/loaded`，request22802.160、frame同target、200且fromDiskCache=false；22:41:53.285Z归档，早于本补件 |
| growth-habit实际页 | A13 materials3242；loaded target `2EDCCF4D81671D87CBBD9934F50CF274`，request94843.126、200非diskcache；10份成功状态一致 `timeOrigin=1792618531950.5`。各habit actual未单列target，不伪称每step均采target |
| 实际尺寸/开关 | 两组均CSS1440×718、PM容器1160×718、深色、DPR2；loaded pilot OFF。不是loaded时1440×900、原生200%或全视口矩阵 |

两份response均重新读取全部字节，独立计算client/segment/response SHA及唯一完整位置，且与各原loaded事件一致。目录“A15”只是补件，不是新A15产品；A16新panel不在本次认领范围。原宿主main PID8391属此前file-fault归档，本轮未探活；collector40456不是宿主PID。

原F5备份 `materials-files-reports-independent-auto-20261021-evidence/...-fiKpOr/fixtures/F5/backup.json` 的habit/OKR内容与首个成功nav raw逐字段相等。`A13/final/materials/seed/precheck.json`显示结构/关系/附件侧车预检通过；`boundary.after`对应habit/OKR哈希与原raw相符。habit `habit-mvi5z84q-32ztau`、p1、同项目objective `okr-mvi5z847-33y3xk/F5目标`，初始checkIns空、streak全0、draft；不是为补记手改历史或墙钟。

## 4. 文件忙态与取消恢复原链

以下时间为原证UTC，非本机当地日期。

| 时间/原件 | 独立核对 |
| --- | --- |
| 23:17:06.070/128 initial-probe/initial | 既有t2编辑抽屉，标题“F02 失败后重选保存”，不是fresh；PNG目视一致 |
| 23:17:06.825/834 new-before | 原execution先cancel既有抽屉再new；新标题“F02 控件忙态补证取消”，任务file输入空且disabled=false；不是仅在旧t2改标题 |
| chooser/path-action、path、selected、chooser.png | 原生GoTo精确 `/private/tmp/pmtool-a11-native-files/QA 文件 原件.md`；图显示原件蓝选、22字节、Open控件。后续fakepath与真实暂停支持选件完成；图本身不单独证明Open点击 |
| 23:17:41.983 held / 23:17:42.000 busy-probe | `/api/pm/v1/assets/upload` Request阶段hold，明确aria输入disabled=true，value为原名；“上传暂存中…”与busy.png目视相符 |
| 同busy-probe | 另一aria=null文件输入disabled=false/空，是独立隐藏import通道；任务源码input与 `tasks.tsx`隐藏`.pm-import-file`交叉核对，不误认其busy |
| 同busy-probe/图 | 主“添加任务”disabled=false且可见蓝色，取消可见；没有本轮主保存或双点测试，不能签主按钮禁用 |
| 23:18:11.203 compositor000020 | “放弃未保存修改？”、“放弃修改/取消”原帧真实可见；不是取消即静默写入 |
| 23:18:11.113/116 closed-probe/state，000021 | 抽屉消失，只剩隐藏import输入、无submit；focus回“新建任务”，原两条任务保留 |
| 23:18:11.571/572 new-after | 再次真实new，标题空，任务file输入disabled=false/value空，文案回选择文件，focus输入。PNG目视空标题；文件行不在这张顶部视口 |
| 23:18:11.733/746 last frame/end | 最后新草稿cancel后列表原帧，end三根仍同初态；无新增任务、staging或字节 |

hold至closed探针约 **29.130秒**，超过原合同3秒；busy探针仅记录hold开始附近的控件状态，不捏造“3秒后又采一次disabled”。全部 `initial→new-before/busy/closed/new-after/end` data/files/backups新增、删除、变化均0。data内原p1/t1/t2/fa1及session/workspace仍存在，files原22字节final不变，**零差异不等空库**。原件SHA `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`独立回读一致。

原end `held=true`源于脚本 `!!held`，只证明曾赋过Request ID；它不检查Request是否仍存活、不证明悬挂请求、没有release成功或宿主201。原execution的finish从SIGTERM路径点击cancel/discard、新建/探针再cancel、disable Fetch并detach，但**代码路径不等实际TERM原输出**。观察归档23:19:11仅保存 `ps -p 40456 -o pid=,command=` exit1/stdout空，支持当时无该进程；缺原argv/cwd、单PID TERM及父shell终码，本项诚实BLOCKED。审证端未跑ps、TERM或重停服务。

源码active/generation、cleanup abort、current守卫、input reset与 `disabled={staging}`只作身份/机制旁证。本包没有console监听产物，不用另一file-fault包的console代称“本轮所有卸载警告已验”，亦无宿主收字节后迟201证据。

## 5. 习惯逐步提交与原raw差异

成功步骤共10份、原失败2份；每step原 `exit.json`、`commands.json`、`console.json`保留。原28个command/run/done事件共14对：4次checkin、1次update、9次snapshot；不能将snapshot对数当额外打卡。

| 原step后缀 / UTC命令 | 原生产动作与结果 |
| --- | --- |
| nav3856145 / 23:04:16.510 | 成功导航原图：F5习惯、draft、关联F5目标、空打卡/streak0，无业务写 |
| check3865275 / 23:04:25.460 run26→done26 | `habit checkin habit-mvi5z84q-32ztau`，今日返回2026-10-22；raw1条、backfilled=false、streak1/1/1 |
| check3876778 / 23:04:36.951 run29→done29 | 显式2026-10-21，raw2条、补记true；可见“补记”，streak2/2/2 |
| check3890757 / 23:04:50.895 run32→done32 | 显式2026-10-20，raw3条、补记true；可见两条补记，streak3/3/3、lastDate10/22 |
| check3899775 / 23:04:59.928 run35→done35 | 再点今天，成功文案“已打卡，未重复追加”；raw SHA与前步一致，含updatedAt也不变，仍3条/两补记/3天 |
| inspect3996846 / 23:06:36.898 | 已打开GF抽屉，只读状态/原raw，无命令/三根零差异；不是另一次产品开发或save |
| input4006185 / 23:06:46.873 | `#gf-habit-goal/freq/notes`真实输入；页面已变、raw仍旧，无命令/三根零差异 |
| save4015835 / 23:06:56.204 run38→done38 | 可见主“保存”实际click，唯一habit update携title/goal/frequency/notes/okrId，done success；raw普通字段新增、抽屉关闭、卡片更新、原exit0 |
| edit4026132 / 23:07:06.275 | 在同F5卡片点击“编辑此习惯”，真实reopen GF；三个值及原OKR回读吻合，无命令/无本步写 |
| cancel4035698 / 23:07:15.807 | cancel真实抽屉关闭，raw与保存后完全相等，无命令/本步三根零差异 |

“今日10/22”由不带日期的真实生产checkin返回、页面日期与raw共同成立；UTC仍10/21不等业务今日10/21，不修改系统时钟、不用审证日重算历史streak。

保存前后按 `{version:2,record:...}`结构解析，唯一变化字段为 **`frequency, goal, notes, updatedAt`**。新值分别为“每天一次”“每天留下可核查的项目进展”“F5 人工补充记录；保关联与历史。”；title、id、projectId、okrId、createdAt、draft状态、三checkIns、streak完全保留。命令“已修改：标题…关联OKR”列的是提交字段，不证明名称/关联真的改成另一值。10份成功raw habit/OKR字节SHA全部对应各after-roots；OKR全程原SHA `47479a44552c8071e93bc5ab50805c421faeaa4d70a2259930b3b5af60a0f2bd`，非KR、非跨项目。

原raw从空档→1→2→3→重复→编辑→重开/取消相接，前三次和save各步内只改habit；repeat/nav/inspect/input/reopen/cancel各步内三根零差异。**全旅程不能声称三根零漂移**：today→yesterday、yesterday→prior、prior→repeat、repeat→inspect、save→reopen这5个采样间隙中，唯一额外变化是宿主 `session-792b22a6-e1db-428a-8816-4e86592a7262.json` 指纹；无业务表/文件/备份额外变化。未归档这些session正文，不将“延迟宿主日志写”猜测写成确定根因，也不声称无任何宿主副作用。

两原错误单独保留：

1. `habit-nav-1792623814802` exit1/null click，原data-nav-route定位不存在；未保存actual/after/raw，不填造零写或业务成功。后件使用真实可见导航，不改产品。
2. `habit-edit-1792623916903` exit1，等待旧 `input[name="title"]`30秒超时；真实GF字段无该name，后inspect/input/save/reopen按 `gf-habit-*`实核补件。不得把归档最终修正execution倒认为旧失败步骤已成功；该失败有9原帧而无actual/after/raw。

12份原console数组都空，仅支持各已监听窗口无所录console/pageerror；step之间未连续监听，不能签全程无警告。future/D-3、人final、建议均无命令，不捏造其PASS/FAIL。未重启宿主或reload，因此reopen持久化切片不称“新进程恢复测试”。

## 6. 指纹、目视与到件边界

原file-busy index **64条全匹配**，加index本身共65文件；habit index **215条全匹配**，加index共216文件。index外未列原证0、hash/bytes不符0。**29/29 + 103/103 = 132/132 compositor帧SHA匹配**，12份habit frame manifest包括两原失败帧；不以文件数冒充用例数或全帧目视。

实际独立目视 **12个PNG路径、3个JPG路径**，逐路径SHA记录在 [audit-r2.visual](a15-busy-habit-gui-review-20261022-audit-r2.json)：

- busy四PNG：initial、busy、new-after、native chooser；两JPG000020/000021：放弃确认与关闭。
- habit八PNG：成功nav、三天逐步、重复今日、input、save、reopen；一JPG：reopen000008。确认空档/草稿、关联目标、两条“补记”、3天、重复提示、真实普通字段与保存后卡片。reopen PNG/帧含转场半透明背景，**只签字段与流程，不签稳定动画/全样式质量**。
- 新空任务PNG仅顶部可见，不用全DOM innerText谎称文件行在视口；原探针独立证明空文件恢复。没有键盘、读屏、浅色、四宽度、200%、dense/long/error/loading全矩阵目视。

另一专家 [StrictMode到件报告](a15-f02-strictmode-auto-20261022.md)仅只读引用：其自身有限SOURCE/AUTO结果与自动严格effects BLOCKED边界保持。没有执行其脚本/用例、复判其原证或把显式重挂当自动effect replay；该报告也不签本GUI或真实宿主迟201。该到件不改变本报告的整门范围。

## 7. 本轮验证与释放

环境macOS darwin/arm64、实际Node `v22.23.3`，cwd仓库根；pnpm11.28.5为项目约定，本轮未调用。实际命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-busy-habit-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a15-busy-habit-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-busy-habit-gui-review-20261022-audit.mjs r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-busy-habit-gui-review-20261022-audit.mjs seal r2
git diff --check -- 'docs/testing/a15-busy-habit-gui-review-20261022*'
```

首轮审计exit1保留 [audit](a15-busy-habit-gui-review-20261022-audit.json)：25/27证据断言成立，两处错误假设是把index条目数当总文件数、误要求habit步骤间全根无变。复核原件后仅修本前缀审计口径，保留实际5个session间隙；没有改原证、忽略业务变化或产品修复。第二轮exit0、27/27断言成立，语法/diff检查exit0；终核 [seal](a15-busy-habit-gui-review-20261022-seal.json) exit0、首轮/第二轮保护集合新增/删除/内容或mtime变化均0。**这些是证据检查，不是整门AUTO/GUI PASS。**

保护清单共2276项，包含两包全部原证、两份loaded、F5 seed/backup、原件字节、约定与原file-fault输入、A13/A14全声明源/产物、candidate/patch/environment及已读采证helper。范围按审计清单逐文件SHA/字节/mtime封存；不声称全盘、live data/credentials或未列动态livingdocs被监控。探索时rg缺失（exit127）转find/grep、memory指定路径不存在（exit1）均未通过安装/全局改动消除。

仅新增本前缀报告/审计脚本/首轮与r2 JSON/封存，无产品、原证、其他testing或livingdocs编辑，无fetch/pull/install/build/产品verify/GUI/services/credentials/commit/push。所有本角色命令已结束；未持有GUI、builder、端口或服务，**审证完成后释放本角色，不停止Main/A16或其他专家**。

剩余由Main与对应独立专家按原合同继续：宿主迟201、自动严格effects、习惯future/D-3/跨项目/聚合/人final/建议/长历史及矩阵。这里只列既有缺口，不启动下一功能、补造用例或签全部积压完成。

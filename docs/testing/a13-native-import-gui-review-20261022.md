# A13 原生 CSV/XLSX 导入独立 GUI 审证

> 给 Main、开发与接续专家使用：只审已采原证、实际冻结源码和产物，逐项给有限结论及缺证边界。2026-10-22，平台 trae，角色独立测试专家；不是采证端自验，不是新主树或整包放行。

## 1. 结论

**A13 原生 CSV/XLSX 的预览取消、明确确认并重开、非法后行日期拒绝，六个功能 GUI 子项 PASS。当前限定范围未发现新产品 FAIL。** 旧文件名拒绝与后行日期半写的历史 FAIL 保留；本次只关闭上述冻结候选对应的修后 GUI 子项。

**RA-IM01 完整采证交付 / LG-G05 全分支仍限定 BLOCKED**：部分预览与拒绝的原命令 trace 未采、非法列 GUI 未交、真实 busy/传输失败保预览与重试未交。它们不等于六个已证功能失败，不撤回已证子项；也不得凭六个子项宣布全部导入、完整矩阵、SM01、新主树、父持续任务或发布 PASS。不转 MANUAL_PENDING。

| 原合同 / 子项 | 独立结论 | 证据与实际结束点 |
| --- | --- | --- |
| RA-IM01 / LG-G05：CSV 原生选择→预览→取消 | **GUI PASS** | `csv-cancel/chooser.png` 选中完整原名；`preview-current.{json,png}` 完整名、2行 outline、当前未写入；`cancelled.{json,png}` 预览消失。before→preview→after 仅宿主会话变，业务/文件/备份零变化 |
| RA-IM01 / LG-G05：CSV 重选→确认→WBS 父子重开 | **GUI PASS** | `csv-confirm` 原 chooser、preview、确认命令/done、snapshot、两次抽屉与任务 JSON；只增 `t-0004/t-0005`，代码 `3/3.1`，原退出码 **0** |
| RA-IM01 / LG-G05：XLSX 原生选择→预览→取消 | **GUI PASS** | `xlsx-cancel` chooser/路径 AX、preview、cancelled；完整 XLSX 原名和2行 outline。before→preview→after 仅宿主会话变，业务/文件/备份零变化 |
| RA-IM01 / LG-G05：XLSX 重选→确认→实际父子重开 | **GUI PASS，采用纠正补证** | `xlsx-confirm` 命令/done/snapshot只增 `t-0006/t-0007`、代码 `4/4.1`；实际 `t-0006/t-0007-actual-reopened.{json,png}` 与两份 raw 对证。原 runner 退出码 **0** 保留，旧同名重开不用于本结论 |
| RA-IM01 / A9-F02 / I10-I11：CSV 非法后行日期 | **GUI PASS** | `csv-invalid` 原生选中原非法文件；`rejected.{json,png}` 第3行 `dueDate` 错误、没有确认按钮；before→after 仅会话变化，业务/文件/备份零写 |
| RA-IM01 / A9-F02 / I10-I11：XLSX 非法后行日期 | **GUI PASS** | `xlsx-invalid` 原生选中原非法文件；同第3行 `dueDate` 拒绝、无确认；before→after 同样零业务/文件/备份写 |
| RA-IM01：上述六分支完整命令/console/动作 trace | **限定 BLOCKED** | 确认两组 run/done/snapshot 和首次 CSV preview 有原件；其余缺口见 §5。不把已有截图、目录数或源码当缺失事件 |
| RA-IM01：非法列/表头 GUI | **限定 BLOCKED** | 本包仅交非法日期样例，没有原合同非法列/表头真实 GUI；未知额外列的既有“忽略”行为不是 FAIL，不能另发明严格列合同 |
| LG-G05 / RA-N01 导入确认：busy、同帧双点、false/reject→重试 | **SOURCE/AUTO 继承 PASS；GUI BLOCKED** | A13 `new-r3` 有真实组件独立自动证据；本包只有快速成功确认，不能证明浏览器失败恢复、锁或完整忙态 |

表内子项名称只是原 RA-IM01/LG-G05 的证据拆分，不是修改专家用例。原件根为 [A13/final/materials/native-import](../../reports/all-pending-evidence-20261021/A13/final/materials/native-import/)；逐文件长度/hash见 [inputs](a13-native-import-gui-review-20261022-inputs.json)，结构化比较、原事件摘要见 [observations](a13-native-import-gui-review-20261022-observations.json)。

## 2. 授权、合同与角色

负责人本次原句：

> 独立限定原生CSV/XLSX导入GUI审证。先读AGENTS/collab/remaining-journey-cases、a13-import-filename合同及独立retest、a10-preflight-success独立复验。Main新A13实际3242/PID8390/pkg/private/tmp/pmtool-a13-closure-20261022，reports/all-pending-evidence-20261021/A13/candidate-final/environment-final/full-verify及final/materials/loaded完整uncachedclient绑定。原证final/materials/native-import/{csv-cancel,csv-confirm,xlsx-cancel,xlsx-confirm,csv-invalid,xlsx-invalid}：真实Chrome29351 nativechooser/GoTo/Open（AX、OS截图）；CSV与XLSX同原169byte/16561byte fixture。preview未写→cancel仅hostsession日志变化；确认CSV t4/t5、XLSX t6/t7，逐父子重开。XLSX原runner按同名label误选CSV t4/t5，保原exit0但不当XLSXreentry；补t6/t7-actual-reopened、raw/correction.json。非法日期均第3行dueDate2026-02-30拒，无confirm，前后业务JSON/files/backups相同仅hostsession变化。csvcancel before Python路径无前导/after JS有，comparison只normalize表示、保原。命令确认events见各confirm/command-events；首preview/cancel部分见native-files/save-round/commands.ndjson（被动collector已精确TERM/终核end）；xlsx后续部分事件未采，不补造。Main未自签PASS。只读审原证/实际frozen源/构建、目视按原合同，需缺证明确限定BLOCKED，不将缺trace扩大全功能坏。只写docs/testing/a13-native-import-gui-review-20261022*；不可产品/GUI/build/install/services/credentials/commit/其他testing/livingdocs。保护旧FAIL/原证/A13lib，当前main新SM01panel与旧A13不同需按影响论继承，不倒签新主树。给具体RA/子项PASS/FAIL/BLOCKED、hash/原退出码/边界并释放。用户持续任务Main继续fresh文件与SM01独立等待，不重复启动。

已读 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[remaining-journey §2/§8](remaining-journey-cases-20261021.md)、A13 [plan](a13-import-filename-contract-20261021-plan.md)/[cases](a13-import-filename-contract-20261021-cases.md)/[red](a13-import-filename-contract-20261021-red.md)/[独立复验](a13-import-filename-independent-retest-20261021.md)、[A10 独立复验](a10-preflight-success-independent-retest-20261021.md) 与 A9 原结论。

依本单具体授权，不执行通用 fetch/pull/install/build/回归/提交，不改 livingdocs、其他 testing、产品或副本产品。Main 是既有 GUI 采证者，本角色仅从磁盘读原图/帧/JSON、比较源码和产物后独立判定；没有操作浏览器、桌面、服务、正式数据、profile、凭据或重新启动任务。没有执行 vendor skill。

## 3. 候选、实例、同字节输入

冻结根 `/private/tmp/pmtool-a13-closure-20261022`，包 `packages/dsh-pm-tool`。Git 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 不是 dirty 候选身份；宿主认领提交 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`，此处仅引用原认领，不追认上游写权。包版本仍为既有 `0.7.4`，不是本轮新发布。

| 对象 | 完整 SHA256 |
| --- | --- |
| `A13/candidate-final.json` | `d70267f974fb9aa8aaf496a4f1d49abef33d26d410b6a453eb4569fadaa9a51f` |
| `A13/product-tracked.patch` | `824d9c3c96095731580fac8edffbaced9998d5b8e245affbbb8c342e07df507b` |
| frozen `src/client/views/tasks.tsx` | `c37f046188f763486010e9867117ca90899c4983b09fd163f4d004007f6f2dc1` |
| frozen `src/commands/task.ts` | `223472a8580a78ff1aa18468c3d3560ca05eebef0d4d7066d518eabe91901f44` |
| frozen `src/core/csv-import.ts` | `389c127aefb81fb08215512a168fd978928ec41e814faca2b6e6e26d066dabe5` |
| frozen `lib/client.js` | `7f037fce5115157101afb64cef7b7fd0e470742ac3eb96a11cabe0a43e56ae7c` |
| 原169-byte 合法 CSV | `9ff4d80a312a90a2f09c3c31805aad7796341ade44e2944fa5c690cb07010501` |
| 原16561-byte 合法 XLSX | `1181f20b5bfe4400608bc85415b8ffeeadd70f51ac4035099fc4dfc1ed0ff4a8` |
| 原169-byte 非法日期 CSV | `6a4990f56b81438a6c24aa0b1e21ae68eeb616377f2a736bdbca0ba148d337ee` |
| 原16561-byte 非法日期 XLSX | `0d446fdcc112b4cb718f974938f31517869839ce63fb717a507511783e412e68` |

候选清单认领的 **514 项源/配置/脚本与 453 项产物逐 hash 零漂移**；patch 与声明一致。未重建，不用 hash 代替正式版本身份，不宣称 map 以外全机零变更。

`environment-final` 的 `materials` 实例为 **3242 / Main 原登记 PID8390**，运行根 `/private/tmp/pmtool-a13-materials-runtime-20261022`，插件解析上述冻结包；不是旁路 `main` 的 3243/PID8391。本轮没有实时服务探测，PID引用采证时记录。实际窗口原采证为 Chrome29351/window23677；picker原脚本与 AX 路径回读、原 OS 图共同支持原生 chooser/GoTo→选中→随后页面预览，而非 `setInputFiles`。

`loaded/result.json`：target/frame `2EDCCF4D81671D87CBBD9934F50CF274`，default browser context，origin3242，`timeOrigin=1792618531950.5`，pilot OFF、PM mounted。`fromDiskCache=false` 的真实 combo **2581559 bytes**，响应 SHA `69656e3d1164c9a26bea86a31138adc42167fc8abcacb66941ef7ed211b405fa`。独立重新读 frozen client 与原响应，按原执行器只去末尾 sourceURL/sourceMappingURL、补宿主分隔符：完整执行段 **1702727 bytes**、SHA `c29382ca1c7f2e5f2a1ddbcbbccb4b0e92258142e585ab3b122ac0fd1c28289d`，first875361/second-1，唯一完整匹配。combo 不应与单包 client hash 相等；该匹配不是 substring 哨兵。

导入原证均同 `timeOrigin`、origin3242，实际 viewport **1440×718**、outer1440×857、DPR2、深色；不能沿 loaded 的1440×900冒充每次旅程尺寸，也不能把 DPR2 当200%或补出原生缩放证据。

## 4. 功能、落盘与目视审证

**选择与预览。** 四个合法 chooser 原图显示准确选中 `QA 原生导入.csv/.xlsx`，取消/确认均是重新选择后的实际预览。AX `path-action` 的 set返回0并回读精确原路径，selected树有打开 sheet；picker脚本仅选中/截图，不能单独当 Open 执行证据，后续同页实际 preview与命令/库原件共同补足功能链。首 CSV cancel 没有同目录 path-action原件，不补造；该分支的 OS chooser、原 preview事件、页面与快照已足够支持其有限功能结果。

合法预览完整文件名、`1｜QA原生导入根 / 1.1｜QA原生导入子`、2项、当前未写入、可见确认/取消；预览 code 是输入局部 outline，确认在已有项目续号 `3/3.1` 和 `4/4.1`，不是编号失败。CSV/XLSX 确认原 args 分别 JSON解出169/16561 bytes，与上述合法原件逐字节 hash 相同；XLSX没有重新编码 fixture。非法日期原件与已审合同 hash一致，后行保持 `2026-02-30`，不改日期让它通过。

**零写。** `csv-cancel` data21→21、`xlsx-cancel`23→23，非法两分支25→25；文件均2→2，备份0→0。每个 before/preview/after 对照仅 `session_projcache/sessions/session-792b22a6-e1db-428a-8816-4e86592a7262.json` 内容变。业务 JSON、workspace、文件和备份没有新增/删除/hash变化。CSV取消 before由Python记相对路径、后件由JS带 `/`；本审计仅去键名前导 `/` 后逐项比较，保原件及 hash，不过滤宿主变化、也不改 hash/业务路径。其余原快照直接同规则比较。

**确认。** CSV preview→confirmed 的 data21→23仅增t4/t5；XLSX23→25仅增t6/t7；两组 existing任务逐字段不变、旁路p-0002不变、文件/备份不变。确认后与重开所读任务 JSON相同；真实 `web snapshot` 返回同ID/项目/父子/字段，不以页面标题代替存储。两组根任务为测试甲/P1/start2026-10-22/due2026-11-01/progress0/todo；子为测试乙/P2/start2026-10-22/due2026-10-30/progress10/in_progress。原父子关系、字段、续号和状态正确。

**XLSX 错对象纠正。** 原 `/private/tmp/pmtool-a13-import-confirm-20261022.mjs` 通过 `.pt-name` 首个同标题找对象，故 XLSX原 `root-reopened/child-reopened` 实际是 CSV t4/t5；原 exit0只是 runner结束，不证明 XLSX重开。原件不改，纠正文件实际名为 `reentry-correction.json`，不是另造 `raw/correction.json`。补图/页面实际 t6/t7 与同名raw JSON一致，raw又与confirmed任务一致；候选任务表单排除自身的 predecessor候选分别保t4/t5、排t6或t7，也支持非旧同名对象。纠正补证没有单独原exit文件，不替它造0。

**错误与可见性。** 原 `rejected.png/json` 两种格式均显示“第3行：dueDate：日期须为有效的 YYYY-MM-DD；…截止日期不得早于开始日期”，仅取消、无确认入口；有限错误显示 PASS。沿 A10专家已核定步骤，不点击不存在按钮；直接原命令确认两次守卫属于继承 SOURCE/AUTO，不谎称本轮浏览器执行。

独立目视六张 chooser、四张合法预览/两张拒绝、两张取消、CSV两张重开、XLSX两张实际重开、确认后列表；并抽样查看 CSV帧 `000000/000002/000012/000023/000029`、XLSX帧 `000000/000002/000010/000021/000029` 的预览/确认/列表/滚动取消/抽屉转场。两组原frames各30帧，声明hash均复核；它们是约1秒的真实合成帧序列，**不是从chooser开始的完整OS录像，也不是XLSX纠正重开的录像**。本尺寸导入文案/确认/取消可读可达；重开字段与记录相符。转场有叠影，不凭瞬时转场帧开产品缺陷；未签稳定态抽屉全样式、焦点/键盘、长文案、四档/浅深/200%或 RA-V任务整格 PASS。

## 5. 原事件与限定缺证

| 原 trace | 原记录 | 可证明 / 不可扩大 |
| --- | --- | --- |
| `native-files/save-round/commands.ndjson` | CSV首preview，seq17/18，`cmd-65d01e89-8`，21:54:10Z，success“当前未写入” | 原 args 的169-byte内容/完整原名可核；没有cancel命令并非漏写，取消是本地动作。不能拿它当第二次CSV预览或XLSX预览 |
| `csv-confirm/command-events.json` | seq21/22，`cmd-65d01e89-10`，21:59:40Z，confirm→success t4/t5；其后两次snapshot | confirm原args保同原名/字节、单一末尾suffix；减suffix的SHA `5c0cdc1f28274ae36019f1f7bd5c6433420ffc556f683fb1b87c2f71f23f78b0` 与首次CSV preview同。第二次preview cmd9未在本包独立采到，不称已逐事件对证 |
| `xlsx-confirm/command-events.json` | seq31/32，`cmd-65d01e89-15`，22:03:25Z，confirm→success t6/t7；两次snapshot | base64解出的16561-byte原件hash正确；确认命令可信。没有XLSX preview原args，不能由减suffix重建一个“已采preview” |
| collector生命周期 | start/ready PID12607；`end.json`21:56:18Z；原脚本SIGTERM收尾 | 支持被动collector有限采集期已收尾；没有后续XLSX/非法preview事件。用户已给精确TERM/终核，本角色不再探测/停止服务；end不是完整退出码记录 |

**最小缺证边界：**

1. 第二次CSV preview、两次XLSX preview及两次非法日期preview的run/done/实际提交载荷未交；XLSX实际纠正重开无连续帧/独立动作log。其功能可由已交chooser/页面/库/snapshot/raw有限判定，但这些精确trace字段仍 BLOCKED。
2. 原console/error监测只覆盖被动collector有限期间；不能写整个21:54–22:07Z“console无错误”。确认执行器只收命令事件，不补造全段console；截图无白屏不等console全绿。
3. busy禁确认/取消/重选、同帧双点与false/reject后保preview/重试，缺真实浏览器受控失败旅程，GUI BLOCKED。原独立自动PASS保留，单次快速确认不能冒充这些分支。
4. RA-IM01非法列/表头GUI仍未交。按已有效schema/映射验，额外未知列既有忽略不是新错误；不要为了补证修改产品schema或旧专家合同。

这些是已生效合同的证据缺口，非新需求或新产品FAIL。本单结束后只能新采原合同缺口或由独立专家明确核定证据替代，不修改/覆盖旧失败、原事件或原截图。无需为这些缺口重复启动当前Main任务。

## 6. 影响论继承

| 接缝 → 原结果 | A13 frozen与旧独立冻结关系 | 本轮继承 / 新主树边界 |
| --- | --- | --- |
| 文件名两模板、command解析、相关tests → A13 new-r3 | tasks/command及两test hash均一致 | 原文件名矩阵/quote协议/ASCII兼容 SOURCE/AUTO PASS可继承；实际GUI本轮仅中文空格CSV/XLSX，不扩大为所有六种名字GUI |
| csv-import/task/schema → A10/A13预检 | csv-import `389c…`、core/task `ad71…`保持同字节；新解析接缝已由A13复验 | 首后行/同级schema/直接confirm拒绝 SOURCE/AUTO仍可继承；本轮GUI只后行非法日期，不声称所有路径入口GUI |
| PmPanel/client入口/task样式 → A13 new-r3 | old A13 panel `8618d909…`、client入口 `e5702c69…`、tasks.css `101a5f01…`一致 | 原真实组件busy/失败保preview AUTO可继承给该冻结；完整真实浏览器分支依然待补 |
| 当前main SM01 panel/全局样式 → 本轮旧A13 GUI | main panel现为 `0d2a4560e74adb137084d2e37b34625e4b2e5b1801ec76e72fce5b689ccffe03`，panel.css `87ca4fc9f0899d87b3103fcc279a791839a23e921de6511a81086d85d9e54246` | 只读diff显示sidecar条件卸载改为hidden保子树与`.pm-sidecar[hidden]`，两diff原exit1表示差异，不是产品FAIL。导入模板/解析/预检未变，局部语义证明保留；本轮不倒签新main整体client/GUI/SM01，仍由其独立门新认领接缝 |

新main共享入口/样式发生修改不能冒充本冻结整包。反过来，SM01副驾限定修改也不自动证明导入后端坏、不无理由重开全部不相干旧PASS。任何进一步修改以上import接缝，按文件→用例→证据影响重新认领。

## 7. 原退出码、审计命令与保护

运行环境：原构建/自动记录 macOS + Node22.23.3 + pnpm11.28.5；本审计 darwin/arm64、Node22.23.3，仅Node读磁盘、`git diff --no-index`和原图查看，未调用pnpm/install/build。完整原 argv/cwd/起止/exit在 `build-final/*.exit.json` 与 `full-verify/summary.json`，逐95项verify的原命令/退出码在guard stdout，已入本轮inputs指纹。

| 原执行 | 原exit / 实际结果 | 审签边界 |
| --- | --- | --- |
| `pnpm exec tsc --noEmit` | **0** | 原A13 frozen类型检查，不是本轮重跑 |
| `pnpm run build` | **0** | 唯一Main隔离产物，453项本轮读回一致 |
| `pnpm exec vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache` | **0，145 files / 1467 tests** | 原自动覆盖结果，不替GUI |
| `node scripts/verify-isolation.mjs` | **0，95/95，所监测5文件污染0** | 原guard有限watch；不扩大为全机或全97/真实模型烟测 |
| `node scripts/test-isolation-guard.mjs` | **0** | 原guard设施自检 |
| launcher `pnpm test` / `pnpm run verify` | **0 / 0，56/56** | 原launcher验证，不签本单外launcher GUI |
| CSV / XLSX confirm runner | **0 / 0** | CSV重开正确；XLSX旧同名重开不采信，实际补证另审且无单独exit文件 |
| chooser/cancel/invalid与XLSX实际纠正 | **没有各自独立exit文件** | 依原图/AX/JSON审功能，不补造0 |
| A13旧独立 `old-r1/old-r2` names-protocol | **1 / 1，22红4绿** | 历史FAIL只读保留 |
| A13独立 `new-r1` safety | **1，32绿1误判** | 原AST设施误判保留；new-r2/new-r3安全33例exit0，本轮不改其证据 |
| A13独立 `new-r3` | fixture/base/names/safety/handler/related/noEmit **全0** | 1/10/26/33/24/117的原分组，handler已含于related，不累加重跑成独立用例数 |
| A10原I10旧步骤 | **1，6绿2红10未运行** | 原动作不适用于预检已拒；后两轮独立33/33各exit0、相关348/四verify/noEmit0保留，不改写红证 |

本轮仓库根、macOS/bash只读审计入口：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a13-native-import-gui-review-20261022-audit.mjs
node docs/testing/a13-native-import-gui-review-20261022-audit.mjs --seal
```

首轮审计原exit **1**：`TypeError: independent.source.files.find is not a function`，发生于读取旧manifest格式；不涉及产品执行。只修本审计读取对象索引、不改任何oracle/产品，保首次inputs。随后两次审计原exit **0 / 0**：源514/产物453零漂移、203个输入指纹、完整client段匹配；第二次增加原frames声明hash与实际纠正raw对照，无产品执行。两个panel只读diff原exit **1 / 1**，仅表示有差异。最终封存的原证/源/产物复核见 [final-check](a13-native-import-gui-review-20261022-final-check.json)，不能将审计exit0当缺失GUI分支绿。

只写本前缀脚本、报告、inputs/observations/final-check。旧FAIL和其他专家文件、原证、A13lib未改；本轮没有产品/GUI/build/install/services/credentials/commit/push/发布动作。不声称未监测的全机零写。

## 8. 释放与交回

**限定独立审证完成并释放。** 本角色没有持有GUI连接、产品写权、共享builder或服务；自有同步审计命令均已退出，不重启/重复采证、不模糊杀进程。本报告六个功能子项PASS、trace/未交分支BLOCKED均仅绑定§3冻结及本轮原证。

Main继续既有fresh文件旅程，SM01独立等待照原派单运行；它们不由本角色启动、审签或改状态。本次结果可被Main只读引用，剩余import证据按§5有界补齐后另审；不要求Main停掉不受影响的已授权工作，也不替父任务最后commit或整门放行。

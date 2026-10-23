# A16 G04 选择取消与四扩展 GUI 有限独立审证

> 2026-10-22，trae 独立测试专家，非开发、非 GUI 执行端。供 Main 接续 A17 和剩余独立门；只签本报告绑定的 A16 子范围，不签整 RA、commit 或发布。[先行计划与授权](a16-extension-selection-gui-review-20261022-plan.md)。

## 1. 有限结论

| 子范围 | 独立结论 | 实际边界 |
| --- | --- | --- |
| PC-G04 选择/编辑/最小化/取消 | **有限 GUI PASS** | 新三步，Space 取消 s1，s3.progress55；最小化/展开保留；取消零 apply/undo、业务/来源历史不变 |
| PC-G04 正常外改后明确再生成、再取消 | **有限 GUI PASS** | 正常 TaskForm 主保存负责人，新 ask 返回三步，未自动重发，取消零业务写；最新 props/人工值可见 |
| 上项再生成后的隐藏执行 base/实际发包值 | **BLOCKED（局部原证缺）** | 原采集未序列化 openedAt，且再生成后直接取消、没有 ask-apply；raw 最新时间戳不是执行 base 证据。同冻结 SOURCE/AUTO 有限 PASS 仍保留，不冒称本 GUI 发包已证 |
| EXT-BASE 四类 update clean | **有限 GUI PASS** | 显式整批应用4，四个字段/updatedAt真实写入，完整十键生成 base，applied 来源仅本轮四条 |
| EXT-BASE 四类 update conflict | **有限 GUI PASS** | 生成后四正常表单主保存；确认仍传旧十键 base，实际0应用、四条完整保存后 JSON/updatedAt/历史保全，无新 applied 来源 |
| EXT-BASE 本轮 fresh clean undo | **有限 GUI PASS** | 本轮新句柄真实点击撤销4，四个完整原 JSON 逐字节恢复，旧账本/history保留，新 audit 只追加 undone |
| 旧 gateway43579 停进程原链 | **NOT_CAPTURED（设施归档边界）** | 新 ready47374:3246已在原件；原 lsof/argv/cwd/TERM/端口空工具输出未另存，不推定完整停链通过，不扩大为上述业务失败 |

未签：四 create、delete/未知字段/wrapped/跨项目/资料数组写等白名单负例、全部 RA-AI05、RA-AI04整门、四扩展 changed/mixed undo、growth、全矩阵、结果卡全实体文案、pilot开关、真实云模型、重启/句柄全部生命周期、commit/push/发布。历史 A14/A15 FAIL、旧 PC Oracle FAIL、A16早期clean选择器失败不覆盖、不倒签。A17 新 catch 不属于本 A16，另候选另证。

## 2. 独立性与候选绑定

本角色只新增本文件前缀计划/审计脚本/JSON/报告。未改产品或任何产品冻结副本、其他 testing/livingdocs；未 fetch/pull 在途脏树、install/build/产品测试、浏览器/GUI/模型调用/服务启停、profile/凭据文件或 commit。原采证脚本只作文本审读，不执行。内置 Node fs/path/crypto/assert 只读原件、写自有审计输出；当前 Main 活动源码不设置不可变锁。

有效依据：[AGENTS §6A](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[RA-AI04/05](remaining-governance-cases-20261021.md#1-ai来源失效与确认守卫)、[A14原合同 §4](a14-preconfirm-conflict-contract-20261022-plan.md#4-main-修后复验合同本次-not_run)、[A16 SOURCE/AUTO](a16-extension-base-independent-retest-20261022.md)、[既有PC-G01～03 GUI](a16-pc-gui-independent-review-20261022.md)。不借待表决设计矩阵新设门，也不将原始 Main collection boundary 当 Main verdict。

| 身份 | 本轮复算 |
| --- | --- |
| 基线/宿主声明 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` / `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；宿主声明不等本角色审全部上游 |
| A16唯一冻结树 | `/private/tmp/pmtool-a16-closure-20261022` |
| candidate SHA / patch SHA | `284dfbf509bcb286a935d60f3d6dc07161c1fbc3dcbfb6e6165f91f29fdadadb` / `be49baaee1850b169933cce31fb27cf51675805fe9aeaa1a14a683f70e851360` |
| extension-index | **1008项，bytes/SHA漂移0**；索引SHA `799fe3d0fd2eaf1c5f0cc13cb7e2a9af0090f6102d39de6b4460e492da60c781` |
| PC旧封存索引 | **989项，漂移0**；SHA `2551c6bcb942957dd4d8f9651ee4475be272be4a07eacf96f1162a702919827d` |
| 完整声明输入/产物 | **519 / 453，逐件SHA全部一致**；495个插件输入及完整387 src路径/字节与独立SOURCE冻结一致，另24声明输入不借SOURCE结论扩大覆盖 |
| 完整uncached combo | **2,583,245 bytes**，SHA `0fab03b720bceadceae2204a5916bf826bb1bb03eabbe94865a1c31d57cfb3aa` |
| lib/client.js | SHA `32ba861cde983dedeeaf171ae45da9a5f57dfb2bab9d506fd22dba492b50c738` |
| 唯一完整client段 | **1,704,413 bytes**，SHA `e7db7986c05575ed46815d6b153411028d9ce447f6df5c00c3cdc38f42185a0a`；first875361/second-1，尾调试URL按真实宿主规则归一化 |
| 实际上下文 | target/frame=`3712802793249D4D6625CB0247CD2A86`，request=`44174.126`，context=`default`，fromDiskCache=false |
| 实际页面 | origin=`http://127.0.0.1:3247`，timeOrigin=`1792625471494.4`，loaded=`2026-10-21T23:31:13.586Z`，早于本轮全部ask；各状态同origin/timeOrigin |
| 进程认领 | 原host-start-r2：3247/PID44014；四扩展ready：3246/PID47374，runtime=`/private/tmp/pmtool-a16-governance-runtime-20261022`；本角色不探测当前服务存活 |

不以 HEAD/version/关键词命中/HTTP200代替完整字节与实际GUI链。现有冻结仍匹配原独立SOURCE，故不把并行 A17 catch 写入当 A16冻结污染或修复生效。

## 3. PC-G04 原始旅程

原证：[selection-cancel](../../reports/all-pending-evidence-20261021/A16/final/selection-cancel/actions.json)。run/done唯一commandId、顺序对应：ask81/82 → 正常 task update83/84 → snapshot85/86 → 明确新ask87/88。无 ask-apply、无 ask-undo；两 ask 都返回合法 s1/s2/s3 与 needs=`[]/["s1"]/[]`，并非人工拼计划。

首ask后实际 Space取消s1、编辑s3进度55；selection-edit/selection-retained原PNG显示未勾s1、仍勾s2/s3、按钮“整批执行（2）”和55。selection-hidden显示侧边标签，展开原编辑保留。JSON采集没有checkbox.checked，不能把value="on"当勾选状态；该项由实际图像、动作脚本Space和数量2交叉证明。

initial→selection-edit/hidden/retained/cancelled及regenerate-external-draft，各业务records、files/backups均相同。pmProvenanceLedger完整entries/history/undo.used从initial到regenerated-cancelled不变；旧“撤销s3/整批1步”只是保留入口，不是本次新来源或撤销。

正常 TaskForm 主保存将t1负责人改成“A16 再生成前人工值”，updatedAt从 `2026-10-21T23:34:23.810Z` 到 `2026-10-21T23:37:20.934Z`；全record仅assignee/updatedAt变化，attachments/pl-1三修订/pl-2两修订与deletedAt保持。主保存toast/最新任务投影可见，83/84完成后才发87；未因外改自动ask。再生成三行恢复原模型44，不继续携带已取消55；再次取消无业务写。

**采证文件名保真**：原ask()每次写同名draft，因此现存 `draft.json/png/raw/roots` 是第二次再生成，不是首轮draft。首轮依据initial/selection-*、81/82和实际帧；不伪造被覆盖的独立首draft原件，不修改原采集顺序。再生成后的base只可核raw当前十键和同源码独立SOURCE控制；隐藏openedAt/实际发包未采，局部BLOCKED如§1。

## 4. 四扩展 clean 与 fresh undo

原封存[gateway fixture](../../reports/all-pending-evidence-20261021/A16/extensions/gateway/plan.json)四步：

| 步/对象 | 单字段 | 原时间 | clean应用时间 | 正常外改时间 |
| --- | --- | --- | --- | --- |
| e1 milestone.update m-0001 | description | `14:07:53.844Z` | `23:40:46.349Z` | `23:42:41.574Z` |
| e2 risk.update ri-0001 | responsePlan | `14:07:53.853Z` | `23:40:46.381Z` | `23:43:28.709Z` |
| e3 deliverable.update dlv-0001 | description | `14:07:53.870Z` | `23:40:46.395Z` | `23:45:21.437Z` |
| e4 meeting.update mtg-0001 | summary | `14:07:53.879Z` | `23:40:46.405Z` | `23:46:38.627Z` |

全表时间均为2026-10-21 UTC。fixture使用原只读上游startMockLlmServer确定性依赖，未注册产品不会提供的业务模块；四op/字符串字段对当前ALLOWED_OPS及validateActions合法，不含task/资料数组写。生产车道、真实宿主/dispatch/repo/存储，不冒称云模型质量验证。

ask-clean89/90返回原四plan；初态→草稿业务/files/backups零变。apply91/92真实“已应用4步”，传参四action逐项与plan相同；十键base全值等生成raw，各target旧值如表；不是只核四键contains。四record仅本表字段和updatedAt变化；原ID/项目/其他字段，dlv创建history和meeting全部数组保留。task附件/多修订/软删历史完全不写。

新账本恰一条 `prv-mvir9hvz-6qdyuo`，refs/postimages按milestones/risk_issues/deliverables/meetings四目标，updatedAt逐条等实际落盘，postimage.kind全update；旧entries原样保留。不存在create/task或未applied目标假来源。

fresh句柄=`undo-mvir9hvy-ayroac`，来自本轮apply后93/94原list和新ledger，未捞历史旧handle。实际原帧显示“撤销 · 整批4步”并真实点击，99/100“已撤销4项”；四目标撤销后的**完整原JSON字节与ask-clean draft逐一相同**，非只还原文字/时间。其余业务/files/backups不变；settings合法undo/idempotency/ledger留痕分开核。旧entries/history保留，新entry仅undo.used=true、audit追加undone，未烧其他旧handle。

## 5. 四扩展确认前外改

ask-conflict103/104重新生成旧base后min；依次正常外改：

| 正常主保存 | 原run/done | 保存后字段 |
| --- | --- | --- |
| milestone表单 | 105/106 | `A16 人工里程碑说明保留` |
| risk-issue表单 | 109/110 | `A16 人工风险响应保留` |
| deliverable表单 | 113/114 | `A16 人工交付说明保留` |
| meeting表单 | 121/122 | `A16 人工会议摘要保留` |

四external-*-save均有initial/draft/saved原PNG、raw、roots、commands和帧。draft零业务写，主保存后仅该record字段/updatedAt变化；其它字段不丢、保存完成后snapshot回读。不是改库/API替正常UI。风险/交付物/会议原open错aria均exit1、commands空；随后真实title/role控件打开已在save初态PNG/帧和完整记录绑定中确认。交付物实际“说明”label找到textarea；会议实际“编辑会议”恢复。**原wrong-aria错误未删/改、不把首次失败写成成功，恢复打开的单独工具动作日志没有另造。**

expand保原四步，当前显示人工新值→AI建议值，说明只读展示继续用最新props；apply129/130仍发原生成**完整十键base**和相同四步，四target base均不等外改时间。实际“已应用0步；未执行4步”，四项均明确他人更新拒覆盖。

对每目标，external saved→expand后apply initial→apply final完整raw SHA/bytes一致；全五类业务/files/backups同样零变。dlv.history及其他全部字段/updatedAt保全。ask-conflict draft→最终ledger entries/history/undo.used完全相同，无新来源/refs/句柄，不把上次clean历史账本错认成这次0应用的新成功。

## 6. 原证、退出码与目视范围

独立审计[原JSON输出](a16-extension-selection-gui-review-20261022-selftmp/audit.json)保留全部run/done、base/action、原exit、raw records、账本、frame索引与根差异。**39快照/585个raw逐件对应各时点roots哈希；255/255 compositor帧SHA一致**。全部hash校验不等全部255张逐帧目视。

直接目视原PNG：selection-edit/retained/hidden/cancelled/regenerated/regenerate-external-saved，四external draft，ask-clean draft、apply-conflict applied、undo-clean undone。直接目视JPEG：selection-cancel000024，apply-clean000002，undo-clean000002，external-meeting-save000000，apply-conflict000002；结合全部动作/时序/命令/原帧作限定旅程判定，非DOM或单张截图代替全旅程。原1440×900深色、后续DPR2；不签浅色/200%/四视口/纯键盘全程/读屏/全UI。

| 原命令/分支 | 已存原结果 |
| --- | --- |
| `pnpm exec tsc --noEmit` | 0 |
| `pnpm run build` | 0；453产物已另核 |
| `pnpm exec vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache` | 0；148files/1522tests |
| `node scripts/verify-isolation.mjs` | 0；原95条guard输出已核，不包括真实模型 |
| `node scripts/test-isolation-guard.mjs` | 0 |
| launcher `pnpm test` / `pnpm run verify` | 0/0；56passed/0failed |
| selection-cancel | 0 |
| ask-clean/apply-clean/undo-clean/ask-conflict/min/expand/apply-conflict | 全0 |
| 四external-*-save | 全0 |
| risk/deliverable/meeting原external-*-open | **1/1/1**；各错误aria选择器原错误保留 |

本角色没有重跑这些产品命令，只核原exit/日志，0不等Main自验收。原build/noEmit日志有Corepack下载pnpm12.14.0和workspace hoist directory依赖预检查失败警告；业务脚本实际0，不称install通过或“全无警告”，不按项目默认补写实际pnpm11.28.5。selection监听console=[]仅该时段零捕获；四扩展脚本未监听console/pageerror，记 **NOT_CAPTURED**，不造空数组或“全无错误”。collector/旧工具parents未归档末码仍 **NOT_CAPTURED**。

## 7. 最小补件与交回

1. **只补再生成base局部GUI**：在另新合法分支记录同候选/载入→生成→取消→正常外改主保存→明确再生成，采真实前端生成base或确认发包完整base与生成raw绑定。现存直接取消分支不补造发送命令；必要新采由Main按原合同执行，本专家不操作GUI。若新候选是A17，必须另归属，不倒签本A16。
2. **旧停进程历史原件**：能找回时仅补当时lsof定位43579、argv/cwd、单PID TERM及端口空原工具输出/时间；找不回保持NOT_CAPTURED。今天重新探测不能证明旧链，ready的边界文字也不能替工具原件。该归档缺口不扩为clean/conflict/undo业务失败。
3. **完整门另处理**：四create/负例、changed/mixed undo、其余AI04/AI05/growth/matrix及全结果卡UX沿原登记，不因本局部PASS自动转绿；如需console专项另保原日志/监听范围。原工具父末码缺失只能补真实历史或新执行，不能推定0。

gateway保护明确分层：PC原14400bytes/3请求按旧989索引；selection两请求是其后append，本次以**开审已有24017bytes** SHA=`d07f4435f33f4681df21816f52cffb8c3ea59be8c354d35e0863b6ffd899c270`认领五请求，**不谎称这两条含在1008封存**。新四扩展请求9593bytes/2条与events602bytes由1008索引认领；均production model=`deepseek-v4-1-flash-260910`、stream=true、确定性success，BODY仅原合法上下文，不读取headers/key。开审已有四文件前缀保护，允许后续追加，不操作gateway或host。

自有只读审计命令（macOS，仓库根，nvm Node22.23.3；不调用pnpm；输出存在即拒覆盖）：

```sh
node --check docs/testing/a16-extension-selection-gui-review-20261022-audit.mjs
node docs/testing/a16-extension-selection-gui-review-20261022-audit.mjs before
node docs/testing/a16-extension-selection-gui-review-20261022-audit.mjs audit
git diff --check -- docs/testing/a16-extension-selection-gui-review-20261022-plan.md docs/testing/a16-extension-selection-gui-review-20261022-audit.mjs docs/testing/a16-extension-selection-gui-review-20261022.md
node docs/testing/a16-extension-selection-gui-review-20261022-audit.mjs final
```

语法0；首audit **1**（自有脚本误用extension-index取未封存的旧gateway键，TypeError reading bytes，未写audit.json）；修自有索引读取，保原assert/原件不变，重审 **0**。before父工具返回execution ID未捕获末态，记NOT_CAPTURED，不以清单落盘补造0。其完整9386文件保护清单实际回读；diff检查0、自有审计进程无残留检查0、报告链接检查0（final链接在生成前明确待落盘）。final以真实工具结果与[final释放记录](a16-extension-selection-gui-review-20261022-selftmp/final.json)为准。

保护包含A16完整声明输入/lib、1008/989封存原件及脚本、main旧lib/A12/A13/A14 lib、A14原证、A14/A15/A16相关专家原件/旧冻结/原FAIL及AGENTS/collab/治理合同。A11旧lib不在盘上，不假称保护已不存在目录，不推定原因。未保护所有全局cache/间接依赖/正式data/profile/主活动A17源码，不声称全机零污染。

`final.released=true`表示释放本前缀独立审证执行；没有产品/GUI/builder/端口或服务写锁。本报告仅提供上述有限GUI结论及必要缺证，Main继续既有A17独立等待、新输出准备和未闭门原证，不重派本任务，不据此commit或发布。

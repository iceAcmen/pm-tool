# OP 与 P0–P3 最终候选有限继承映射

> 2026-10-22，trae，独立测试专家，非开发、非 GUI 执行端。只审既有报告和已存原件；唯一写面为 `docs/testing/op-growth-final-inheritance-20261022-r1*` 新文件。Main 唯一 GUI/builder，当前工作 EGO13；本角色不运行产品、不写 Git。

## 1. 裁决与授权边界

**有证且未变的 SOURCE/AUTO 与指定 GUI 切片，按第 3–4 节有限继承；OP 整域、P0–P3 整域及全部代码普通 commit 均不予 PASS/准入。** 原未采 GUI 保持 NOT_RUN，原已知缺证保持 BLOCKED；不是新增产品 FAIL。本报告不重新签已闭切片，也不重复派动作。

父授权为持续盘点、分工补全未验，全部实际适用证据充分后由 Main 普通 commit。本子单明确“不 fetch/pull/install/build/vitest/verify/GUI/服务/凭据/Git 写”，覆盖通用开工/收尾流程；不更新 livingdocs、原 testing 报告或原证。共享 dirty 不删不清。

本轮只裁原 OP 57 ID＋RA-OP01..06，及 P0 8、P1 6、P2 7、P3 5，共 **89 个原 ID 的断言映射**。不是 89 个 PASS。AI04/AI05、反馈专项、材料/文件专项、页面/层/卡矩阵不在本轮；来源动作只保留原关闭事实，不重审或重派。

依据：[AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[最终对账 §4.2/4.3/5/7](final-remaining-acceptance-reconcile-20261022.md)、[OP 合同](remaining-objective-cases-20261021.md)、[成长合同](remaining-governance-cases-20261021.md)、[总登记](remaining-acceptance-register-20261021.md)、[delta-ledger §4/§5](remaining-acceptance-delta-20261022-ledger.md)。不新增按钮、功能、全阈值/全失败矩阵或待表决设计硬门。

## 2. 候选与原证回绑

只读核对截点：**2026-10-22 18:19:38 +0800**。HEAD 实读 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；不拿 HEAD 或版本代 dirty 候选。

| 当前认领对象 | 实读 SHA256 / 结果 |
| --- | --- |
| [A20V3 candidate](../../reports/all-pending-evidence-20261021/A20V3/candidate.json) | `6409de168a76a72d8ad691cf96a44ac7d0b4f9f2dae0f43886326ef63f23bec2` |
| [A20V3 95 项 source 清单](../../reports/all-pending-evidence-20261021/A20V3/source-files.sha256) | `777158a46c889acc38884af33f2eb114ec93b52e3ecedb4863f739ff63dbde0c` |
| [U4 10 项 increment 清单](../../reports/all-pending-evidence-20261021/U4/increment-files.sha256) | `4730ef5f81b4c1deb9da16966eb1ea48cdb51940e2eeb2117902ff91fbd191fb` |
| [U4 r2 manifest](../../reports/all-pending-evidence-20261021/U4/candidate-evidence-manifest.json) | `26f093c3f8fbc243a28cb736f452b6fc8aa1ed90ec7403bc14a94fac4948fba9` |
| 主树候选 | 95＋10，覆盖同路径以 U4 增量为准，去重 **102**；missing=0、differences=0 |
| [本轮机器映射/字节审计 r2](op-growth-final-inheritance-20261022-r1-audit-r2.json) | `95f88179d95165521df1e6802a9e879c40a2f1f432bf16b30725271b9fc74ac8` |

`/private/tmp/pmtool-u4-closure-20261022-r2`、3257/PID88698 只记录 manifest 元数据，不探活、不访问运行库/profile；3256/3248/3249/3255 未触。旧候选宿主声明 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2` 按原独立报告保留，不由插件 HEAD 替代。本报告不声称当前浏览器装载了历史 bundle。

机器映射保留 `originalIdMap.op[*].original/evidenceRows/exactOriginalAssertions/repaired` 与 `growth[*].original.probes/rawCommands`。原断言名、动作序号、起末时间、真实参数/返回均来自原件，不另造 ID。JSON 的逐行“原 GUI NOT_RUN”是历史记录；有效后续 GUI 继承按第 3–4 节引用的独立报告解释，不覆写原状态。

| 原件组 | 本次字节核对 | 原证指针与有效解释 |
| --- | --- | --- |
| OP 原独立领域 | 23/23 原封存件 SHA/大小相符 | [9dg1J5 disposition](objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/case-disposition.json)、[domain rows/actions](objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/domain-results.json)、[reopen](objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/reopen-results.json) |
| OP 修后独立 | 28/28 原封存件 SHA 相符 | [qCokWR disposition](objective-number-independent-retest-20261021-evidence/run-qCokWR/case-disposition.json)、[events](objective-number-independent-retest-20261021-evidence/run-qCokWR/current-independent-boundary.events.ndjson)；原 3 FAIL 由修后限定断言取代，不洗旧红 |
| 治理修后交件 | 3411/3411 原交件索引 SHA/大小相符 | [原交件索引](governance-fix-independent-retest-20261021-deliverable-index.json)、[32-ID probes](governance-fix-independent-retest-20261021-id-status.json)、[真实 commands-domain](governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected/commands-domain.json)；本轮只取 26 个 P ID |
| A11 OP 五态 | 256/256 原件 SHA 相符 | [原签报告](a11-overview-visible-final-review-20261021.md)，`A11/objective/manual-visible-r3` 149 件、`checklist-visible-r3` 107 件；按旧专家输入快照回核 |
| P0–P2 补件 | 5755/5755 SHA/大小相符 | [integration 原索引](../../reports/all-pending-evidence-20261021/A18/integration-more/index.json)、[独立报告](a18-integration-more-gui-review-20261022.md) §4/5/6，实际 **A13** 候选 |
| P3 补件 | 970/970 SHA/大小相符 | [growth 原索引](../../reports/all-pending-evidence-20261021/A18/growth-more/index.json)、[独立报告](a18-growth-more-gui-review-20261022.md)，实际 **A13** 候选 |
| OKR 建议 | 797/797 SHA/大小相符 | [原索引](../../reports/all-pending-evidence-20261021/A18/okr-journey/index.json)、[独立报告](a18-okr-journey-gui-review-20261022.md)，实际 **A18** 候选 |
| P0008 三余件 | 1107/1107 SHA/大小相符 | [原索引](../../reports/all-pending-evidence-20261021/A19/check-remainder/index.json)、[独立报告](a19-p0008-check-remainder-review-20261022.md)，实际 **A18** 候选 |

这些是文件核对数，不是功能数、通过率或再次 GUI 目视。本次没有重新目视截图；视觉结论沿原独立签字，不以图片存在、哈希或 SOURCE/AUTO 替代未采视觉。

## 3. OP 原断言最小继承

记号：**继承**仅指本行明确的原签断言；**余证**沿原合同，不新开门。完整 63 行及每行原断言/动作指针在机器映射。

### 3.1 文件与接缝

原 OP 364 个存档源码指纹：317 同、47 异、0 缺；治理修后 374：342 同、32 异、0 缺。不能凭“大多数未变”签整域。

| 接缝 | 实核/理由 | 可继承与限制 |
| --- | --- | --- |
| `progress-derivation.ts`＋`status.ts` | 原 OP 至当前逐 SHA 同；纯派生不依赖 task-tree 排序。前者 `c0d6177b96ce702d0c5bea17d8bbea47bc4b16ad3b1f58acc886e6d6d0032c1b` | 深树、环防御、等权最终一次 round、null/0/legacy/wrapped 集合原 AUTO 继承；不重造 10000 节点 |
| `task-checklist.ts`＋`projects.ts`＋storage/JSON 写层 | 原 OP 至当前同；checklist 自己 enqueue→读最新→put，不经新的 file publish | 清单 CRUD、目标态幂等、分歧串行/EIO 原 AUTO 继承。`task-checklist.ts` SHA `76cae4a935cba7a1f2e879d79543aa52e9d2404b11cfc29dea92930046a49146` |
| `commands/task.ts` | 原治理 SHA `7f02fbd6…f4f63e` 与 HEAD 原件 SHA 全同；当前 diff 仅 import-content 文件名解析分支 | 原 checklist/move/status 命令分支没有行为差异；不继承 import-content 旧字段拆分结果 |
| `core/task.ts`、`core/tasks.ts` | 原 OP 与当前不同；qCokWR 已签新 schema，治理修后已签当前 tasks=`c3e0d8a…723fe3`。变更为 file/draft 原子 publish；完成日期/manual 清除逻辑保留 | 用 qCokWR＋治理修后取代旧写接缝；不靠旧 OP 整文件相同假说。原父子 guard/move/delete 未改分支可继承；文件事务不在本单扩大审签 |
| report/doctor | `derived.ts`、`doctor.ts`、`progress-report.ts`、`progress-reports.ts` 原 OP 至当前同 | calcVersion/delta、历史不回填、doctor 零写原 AUTO 继承；旧包真实 GUI 不随之通过 |
| TaskForm/任务表/甘特/总览 | A11→当前 511 中 30 异；A18→当前 520 中16异。U4 改 tasks/tree/views/CSS，不改客观算法；当前 TaskForm 仍明确主 save 与 checklist 即时写两路 | A11 主 save 目标字段/两 Space/甘特数值与完成卡指定事实保留；不沿旧任务表布局、全部人工徽标/标签可读性。U4 排序 PASS 不代 OP 全消费点 |

最新回归旁证只引用 [U4 独立总门](a13-u4-gui-total-retest-r2-20261022.md) 与 [原 r5 vitest.json](../../reports/all-pending-evidence-20261021/U4/full-regression-r5/vitest.json)，SHA `00bd2d9940cf969dfda014e1ba441bec72a24cec48bf7b84ed5471f6c88e8616`。本次只读解析：`objective-consumers.test.tsx` 13、`task-evidence-protocol.test.ts` 9、`progress-meta.test.ts` 5、`progress-report.test.ts` 14 均原 passed。这是接缝受影响 AUTO 回归旁证，不是新产品执行或 GUI PASS。

### 3.2 原 ID 到签字与余证

| 原 ID | 本轮有效继承 | 原未签边界/最小处置 |
| --- | --- | --- |
| OP-CK-01 | 原 item 三键/唯一 ID＋qCokWR 当前 task schema 合法；不恢复“task 只新增 checklist”的旧限制 | 不要求重做 schema；GUI 只走原展示/提交合同 |
| OP-CK-02/03/04/05 | 父有子拒清单、非空清单 leaf 拒加子、单项 CRUD、expected=true 重试 AUTO | 无新增 GUI CRUD/幂等矩阵；原即时清单失败恢复若缺证保留 |
| OP-CK-06 | 原保兄弟/status/legacy AUTO；A11 第二 UUID Space100→50 指定 GUI | 报告消费者/尚缺失败恢复，不重两次 Space |
| OP-LEG-01/02/03/04 | legacy40/80不造 objective、50＋无清单父50/1of2、旧 record 领域浏览零写 AUTO | 原合法旧包 GUI 旁注与只 browse 零写；1of2 实际标签，不拿2of3替代 |
| OP-DV-01/02/03/04/05/06/07 | 25/50/75/100、全勾 todo pending、done2/5软告警、done无清单null、3/5≠coverage1/1、空/缺null≠零勾0、status不改比率 AUTO；A11全勾指定事实 | 一次 F2 读出口补 pending/软告警/null/0/3of5 标签；不是七轮新 GUI |
| OP-RU-01/02/03/04/05/06/07 | 原63/等权、部分覆盖1of3命名、全覆盖50/2of2、全legacy null、多层仅leaf、move/delete重算 AUTO；A11父63↔88指定事实 | 原1of3实际 task/board命名、合法迁父后的集合；不要求再次深树 |
| OP-EX-01/02/03/04/05 | 原100/1000/10000计数、环/缺ID/跨项目防御、pending＋环 AUTO | 无原 GUI 门，不导入坏库，不重测纯函数 |
| OP-EV-01/02/03 | null/0、derive只读、新报告仅新增、doctor软告警不自修 AUTO；A10 report66真实 raw | null/0实际标签及 report66入镜不足沿原边界保留；doctor 不添 GUI |
| OP-SRC-01/02/03/04 | qCokWR 真源接回；新calc1/旧0/无覆盖null、delta、历史不回填 AUTO | 当前实际消费标签/旧报告只读原件不足保留；不派材料/汇报专项 |
| OP-SRC-05/06 | qCokWR 40/null/manual70/0组件与日期唯一写；A11 manual30/0、clear50、100/50三页指定 GUI | 精确甘特40/null/70及 reports 目标manual30/0时客观项目66；不把30替70，也不要求汇报新增未承诺人工列 |
| OP-Q-01/02/03/04 | 原 enqueue 到 put、目标态幂等、分歧并发、JSON publish EIO 零半写 AUTO | 原同逻辑未变，无新多人协议或 GUI 并发门 |
| OP-BD-01 | 原新 Node 领域进程全字段/derive回读 | 真实 dsh 新 PID 清单/派生回读尚缺；可与 Main 已有新宿主证据合并，不为证明旧 STOP 重启 |
| OP-BD-02/03/04 | 原 JSON支持通道/清单往返、doctor旧库不迁移；修后当前备份兼容范围沿原专家限定保留 | 备份接缝已改变，不把原旧固定formatVersion当完整当前恢复PASS；其专域待对应专家继承，本单不派文件恢复 |
| OP-BD-05/06 | 最新 U4 原全回归/guard限定五保护根结果沿原专家引用，102输入未变 | 不声称全机零污染；纯文档继承不要求再跑全套 |
| OP-GUI-01/02/03 | GUI01 的 A11 两 Space/三页/重开有限继承；GUI02/03 只有旧 AUTO/局部非F2历史可保 | reports/必要原失败恢复、合法旧包只浏览、F2真实390标签与新宿主回读仍未签 |
| OP-DEFER-01/02/03/04 | ADL055替代者对应 RA-OP01..05：manual、effort、evidence、task completedDate；原 AUTO 如实继承 | 不能把已实现双轨当N/A；item doneAt、effort权重、Git自动裁决仍后置 |
| OP-DEFER-05/06 | 原多人实时合并、独立 war-room 热修 N/A/后置 | 不写PASS，不启动功能 |
| RA-OP01 | A11 L1 manual30/0主save/重开、objective50/P63保真 | reports消费者与原未露出徽标；项目客观66不掺manual |
| RA-OP02 | A11 有清单0→clear→主save→null/50 | 无清单manual40→clear→null、cancel-clear零写；不重有清单clear |
| RA-OP03 | 原 wrapped自身事实不抹、排除聚合/验收/催办、改todo重新纳入 AUTO | F2真迁父/改todo各实际消费者；与 P2005 合并，check原已签不重复 |
| RA-OP04 | qCokWR effort3.5/http(s)/trim、非法协议/负值拒、旧非法record可读且无关更新保键 AUTO | 真表单合法主save/重开/既有出口，非法保输入/零写 |
| RA-OP05 | qCokWR done本地当天/显式纠正/revert AUTO | 真 L1 done→日期只读→命令纠正→非done清除/reopen；旧无日期不自动补 |
| RA-OP06 | 原分数最终一次round50、重组不重复leaf AUTO | AUTO-only，没有新GUI动作 |

本节原 AUTO 主证为 [OP 原签](objective-independent-auto-20261021.md) 及 [修后签](objective-number-independent-retest-20261021.md)；指定 GUI 主证为 [A10](a10-objective-gui-independent-review-20261021.md)、[A11 五态](a11-overview-visible-final-review-20261021.md)。原52/3、旧总览FAIL/错图、原PID/STOP缺档保留，后证只定向取代原缺陷，不能证明旧缺档当时发生了什么。

## 4. P0–P3 逐 ID 继承

治理修后核心 `commands/ask.ts`、provenance、capture、metric、session、queue、check、okr、lesson、archive/review、habits/cycle-hooks 至当前未变的原 AUTO 接缝，继承 [GG 修后报告 §5](governance-fix-independent-retest-20261021-report.md) 的 exact probes。当前 `reflect.ts` 已变，按 A20 最新签字取代；task写接缝按第3节；全局 panel/index/CSS 与 U4 task表不视为历史整页未变。

| 原 ID | 继承与实际原证 | 原未签/最小余证 |
| --- | --- | --- |
| RA-P0001 | `production-context-real-materials-and-empty-no-secret-refs` AUTO，原真实投影只读 | 有/无材料各 ask 可见 context/相关task投影后不确认退出；不借来源台账关闭此项 |
| RA-P0002 | 窄集＋旧5标量保留、branch单独合法、12真实命令负例 AUTO；以最终对账/实际 schema 纠正旧“branch必须repo” | 合法窄集明确确认；原非法URL/长度/unknown/wrapped拒；不扩 AI04/05 |
| RA-P0003 | 真实 capture 草稿/draftId确认/新任务/来源，坏候选零写 AUTO | 宿主真实 capture→不确认退出→再草稿明确 capture-apply→任务/来源/重进 |
| RA-P0004 | attach https/非法协议＋TaskForm读回已签。原步 `command-1792628258613/8266445`、`task-open-1792628337556` | 仅 capture 候选附 evidence 支路，与 P0003 合并；不重 attach |
| RA-P0005 | 同 task/session 两bind、notes/项目隔离、新host回读已签；`command-1792628217125/8225795/8234077/8242049/8250016/9326047/9328329` | **本有限同对链无剩余动作**；不称 sessions 属 F5 备份恢复 |
| RA-P0006 | metric账本/byKind/最近时间/空0-null/只读 AUTO | 原 applied/rejected/undo/kind真实账本与 `/pm metric`逐条对应、重进复读；不造统计页 |
| RA-P0007 | 原已有反思 edit/final/repeat/新host链；[A20V2](a20v2-gui-independent-review-20261022.md) SR-G01..06及[A20V3](a20v3-total-gate-independent-review-20261022.md)限定继承 | **不重 file-only/mixed/empty 三新反思**；非空历史人final的AUTO与GUI边界、旧PID缺档按原签保留，不外推J05/L2 |
| RA-P0008 | [五规则25步](a18-check-five-gui-review-20261022.md)＋[三余件](a19-p0008-check-remainder-review-20261022.md)已闭；task t12、叙事t13、wrapped t14命令/卡动作 | **不再补五规则或三余件**。未签全层/键盘/矩阵属于其他派单；不追加全阈值/失败门 |
| RA-P1001 | 原 list/open、排序/queue/rest GUI；GG absence-only不top AUTO。原 list/open `command-1792628379122/8386306`，rest见E21 | 仅 absence-only/缺席历史与正常跟进→刷新目标；不重加queue/open |
| RA-P1002 | mute/unmute/关键豁免已签；`command-1792628512618`、`queue-rest-1792628540593/8551676/8565203/8747685`；TTL AUTO | 合法过去mute经标准包恢复的到期实际呈现；不改时钟、不再普通mute |
| RA-P1003 | 当前08..09 quiet/rest/off GUI，`command-1792628596520/8611332/8678447/8691332`、`queue-rest-1792628657288`；跨午夜 AUTO | **已签切片无余动作**，不等午夜、不再quiet/off |
| RA-P1004 | update后snapshot最新/零模型 AUTO；K13 `ask-projection`与刷新接口机制未改语义 | 原旧 ask 投影→正常用户改task→刷新→最新值/时间→目标→返回旧卡；不要求重做来源动作 |
| RA-P1005 | 两L2事件/幂等/非法关联 AUTO；当前reflect file计数修正不改两事件定义 | achieved/accepted分别真实主save→新反思 sourceEvent/关联材料→repeat→人edit/final；不由A20 task-done代两事件 |
| RA-P1006 | 标准历史恢复、MAX/阈值/烂尾/未分配事实 AUTO | 人员页同fixture事实/建议/烂尾筛选→目标返回；不加WIP/倦怠评分 |
| RA-P2001 | 三档相对export/覆盖拒-confirm/静态只读不跟随源已签；`command-1792629336046/9338595/9340797`及后confirm组 | 原恶意内容安全GUI尚缺；绝对web原无done只保缺档，不补造旧成功 |
| RA-P2002 | 31/29历史归档 AUTO＋本次audit/sent前缀只增GUI；`command-1792629345226/9347928` | 合法31/29历史标准恢复后export→task出站位/归档重开；不是等31天 |
| RA-P2003 | 原三suggest、页面confirm新draftKR、ignore、repeat拒、clear2保pending及重进已签；`confirm-1792633127005`、`ignore-1792633142753`、`command-1792633199812/3237373`、`reenter-1792633271342` | 异项目动态隔离/clear反例及原错误正文可见缺证；**不重同项目confirm/ignore/clear** |
| RA-P2004 | 单主父/related不计权重/人confirmed/自指跨项目missing拒 AUTO | 同项目primaryA＋relatedB真实树/切关联/人确认，非法保输入；不重复P2003建议处理 |
| RA-P2005 | 原人wrapped、stats/queue/check/reflect命令切片与AI拒AUTO；`command-1792628835147/8836440/8837783/8839354/8840950` | people/board/objective实际消费者＋改todo；与RA-OP03同fixture合并；原AI拒GUI未签，不扩成AI04/05拒绝全集 |
| RA-P2006 | lesson来源、known/pending/blank、人final/repeat/newhost已签；`command-1792628854464/8876155/8878290/8880174/8882475/9331496`，structured `1792630015691/0045861/0049214` | **本有限核心链无余动作**；早期literal `\n`不冒三行edit，不重lesson |
| RA-P2007 | archive最小包/review周期/known素材/不写K18 audit/wrapped非done AUTO | 真实 archive/review命令JSON/MD＋已有素材/文件读出口；不称完整backup、不建页面 |
| RA-P3001 | confirm/ignore/repeat守卫与新draft已签；[GM01](a19-habit-association-gui-review-20261022.md)＋[补正](a19-habit-association-gui-review-20261022-correction.md)＋[HC01](a19hc-gui-independent-review-20261022.md)指定关联展示继承 | 不重GM01/HC01或建议守卫；原错误正文可见/键盘未签。五旧Launcher probes只保存，不能扩成已执行 |
| RA-P3002 | [A15正例](a15-busy-habit-gui-review-20261022.md) D/D-1/D-2/repeat；A18未来/超窗真实拒零写，`command-1792627408204/7427738` | 原拒绝错误正文可见缺证；不重复三天打卡 |
| RA-P3003 | 原合法F7、14日边界/月份展开局部及D+3纯派生AUTO | 只补收起→刷新/重进、同origin/实例、原历史字段/字节保全；不重月份展开或用新空三天代F7 |
| RA-P3004 | 原人final/repeat、跨项目命令拒、解绑→正常主save重新关联原OKR已签；`command-1792627469653/7492581/7862888/7870395`、`habit-save-1792627921818`与reopen/cancel | 第二合法同项目目标/missing/失败表单保输入、按OKR只读聚合。无聚合按钮不是FAIL，按第5节现有读出口采 |
| RA-P3005 | `cycle-hook-disabled-real-return-no-timer-registration`原AUTO：两hook均enabled=false。当前cycle-hooks逐SHA同 `d629d57e…8600a6` | 原snapshot/cycleDue占位读出口尚缺；现UI无调度/聚合控件，不要求后台、H6或新增“已提醒”展示 |

HC01三签字文件与当前逐SHA同；A19HC527项514同/13异。GM01建议行经HC01原 SOURCE审查保留，当前habits SHA `ab7e625808b6c4308068c26376c02d7fae9b59fc812ab9b77484c29633bd4964`，panel.css SHA `3cc0b0ed08ea34462ded8154b05f394a46f02c6577dea5da12c495aafa0f700b`。仅继承指定展示，不据两文件未变签习惯整页、聚合或F7。

## 5. 给 Main 的最小合并动作

下面是原断言的 fixture 归并，不是新用例或新硬门。**先交已有未映原件，足够就补签；确无原件才补采。** 所有ID取当轮实际返回/ids映射，不向既有库盲重放示例ID。不改正式数据/时钟、不手seed成功来源。

1. **F2 一组 OP 余链，兼 P2005。** 任务→目标“编辑”→“排期与进度”：无清单L3人工40主save→“清除人工设定”→取消并核零写，再合法清除主save→null；L1 manual30/0时只补reports客观66/目标盘状态与原未露出标签。L8 wrapped真实迁父（现 `/pm task move <L8> <P> confirm`）→现有task/board/objective/people读出口→改todo后集合；stats/queue/check只补尚缺段，原check切片复用。effort3.5/合法evidence主save/reopen/既有出口；负数/非法协议拒保输入。L1 done日期只读→`/pm task update <L1> {"completedDate":"<合法日期>"}`→非done清除/reopen。顺带精确40/null/manual70、pending/软告警/coverage/null与0，F2真390、合法旧v0.7.4包仅browse零写、新宿主PID回读。新宿主已有足证优先复用，不再两Space/深树/有清单clear。
2. **F6/F3 的 P0 capture＋context＋metric。** 现有副驾只读 ask 的有/无材料 context后不确认退出；合法窄集与规定非法行只补原未签确认/拒绝。宿主 composer `/pm capture <项目ID> "<会话文本>"`，先草稿不调用capture-apply退出，再真实生成含evidence候选、明确 `/pm capture-apply <项目ID> <真实draftId>`，查任务/生产来源/重进；无取消按钮时“不确认退出”即可，不造按钮。`/pm metric <项目ID>`与真实applied/rejected/undo账本逐条核并复读，不重attach/session/来源跳转。模型fixture仅用已有获准通道；不能用手写计划冒真实生成。
3. **F1＋合法历史一组 P1。** 原queue卡/rest补absence-only/缺席历史及跟进目标刷新；标准历史包含过去mute时刻，`/pm queue list <项目ID>`及原queue/rest真实到期呈现。人员页同MAX/未分配/烂尾/建议筛选→目标返回。旧副驾ask投影保留时正常改task→副驾现有“刷新”→最新值/数据截至→目标→返回原卡。当前quiet/off、普通mute/unmute、queue已签list/open不重采。
4. **F5 两 L2 事件，仅 P1005。** 里程碑编辑四态现有“已达成”主save、交付物现有“已验收”主save，各保实际ID/关联任务→`/pm reflect <任务ID>`、`/pm reflect-list <项目ID>`读实际新sourceEvent→重复同状态→`/pm reflect <任务ID> edit "<合法Markdown>"`→`/pm reflect <任务ID> final`及重进。命令以任务ID定位，原raw仍记录反思ID/sourceId；若沿原实现产多条，按真实sourceId映，不拼不同task-done片段。A20三新反思不重做。
5. **F5 出站＋archive/review，共用只读文件。** 原恶意内容由合法正常字段写入fixture，再现 `/pm export web <项目ID> [隔离目录]`生成文件并真实本地只读打开核安全；31/29历史经标准恢复后现 `/pm export audit <项目ID>`、`/pm export sent <项目ID>`及task出站位重开，归档由隔离库原 `settings/pmExportSentArchive.json` 回读（没有 `export archive` 命令，也不新增）。`/pm archive <项目ID> [隔离目录]`、`/pm review <项目ID> <起日> <止日>`核最小包/README及JSON/MD周期/known量化与源零写，再已有素材/文件入口读。不是固定汇报三档或完整备份；三档普通成功/覆盖/源改不跟随已签不重采。
6. **F5 OKR关系＋F7习惯，两组分别保history。** 原OKR收件处理全复用；只补B项目动态隔离/clear反例及重复拒绝原错误正文。目标页新/编辑KR的“主要归属/关联目标”实际primaryA+relatedB→树→切关联→人确认；非法保输入按原schema。习惯编辑换第二同项目目标、missing提交/保稿，只补未签段；F7收起刷新/重进原历史字段/bytes，不能与新习惯空史混算。按OKR聚合无按钮：现 `/pm web snapshot`读实际habits/okrs，用原AUTO同 `habits.filter(h=>h.okrId===目标ID)`身份集合对照现习惯页关联行/`/pm habit list <项目ID>`，明确只是现有只读投影，不称新增聚合UI。cycleDue同snapshot真实字段及原disabled返回绑定，不伪“已提醒”、不要求触发后台。

入口只读查证：[index.ts 命令路由](../../packages/dsh-pm-tool/src/index.ts)、[TaskForm/OKR/HabitForm](../../packages/dsh-pm-tool/src/client/panel.tsx)、[capture](../../packages/dsh-pm-tool/src/commands/capture.ts)、[metric](../../packages/dsh-pm-tool/src/commands/metric.ts)、[queue](../../packages/dsh-pm-tool/src/commands/queue.ts)、[reflect](../../packages/dsh-pm-tool/src/commands/reflect.ts)、[archive](../../packages/dsh-pm-tool/src/commands/archive.ts)、[review](../../packages/dsh-pm-tool/src/commands/review.ts)、[habit](../../packages/dsh-pm-tool/src/commands/habit.ts)。确认精确参数应读原help/原真实请求，不猜patch字段；本报告未实际发命令。

原“错误正文可见”仅列P2003/P3001/2/4已有未签断言，不接手反馈专项或新增错误按钮；若Main当前真实呈现已有足证，直接指原请求/返回/可见正文，勿重做守卫。无合法入口/fixture记具体BLOCKED，不自动转MANUAL_PENDING。

## 6. 运行核验与释放

环境 macOS/darwin、bash、现有 nvm Node `v22.23.3`；pnpm `11.28.5`只引用被测环境，未调用。记忆指定入口不存在，权威结论来自仓库；`rg` exit127，改find/grep。探索性不存在路径只算定位失败，不当产品缺证。

本轮真实命令（macOS、仓库根，各条独立执行）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/op-growth-final-inheritance-20261022-r1-audit.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/op-growth-final-inheritance-20261022-r1-audit.mjs capture-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/op-growth-final-inheritance-20261022-r1-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/op-growth-final-inheritance-20261022-r1-audit.mjs seal
git diff --check -- 'docs/testing/op-growth-final-inheritance-20261022-r1*'
```

首次capture exit1：误把OKR数组索引的序号`0`当路径，ENOENT，未生成结果；只修本前缀解析器。随后首版capture exit0但qCokWR“路径→SHA字符串”索引被跳过、核件数0，保留 [首版audit](op-growth-final-inheritance-20261022-r1-audit.json)，**该空核不算PASS**。r2纠正字符串索引并增加治理交件/A11原件回核，exit0；结果为102同、89原ID映射、12921声明输入指纹、上述原索引零差异。SHA批量探索曾含不存在的`core/session-notes.ts`而exit1；有效SHA逐文件成功与机器映射一致，不假称该命令全0。

语法、正文链接/空白及最终输入漂移检查以 [seal](op-growth-final-inheritance-20261022-r1-seal.json)实际结果为准。审计仅内置fs/path/crypto；没有import产品、执行归档采证器/旧audit、构建、Vitest/verify、网络/GUI/服务/凭据/配置/Git写。旧报告/原证/SHA清单均只读，指纹保护只覆盖明确输入，不声称全盘零污染；并行新增证据未纳冻结，不被删除、清理或判FAIL。

**本轮产品测试 NOT_RUN、GUI NOT_RUN。** 本文签有证限定继承，不签 OP/P0–P3 整域、总目标、普通commit或发布。SOURCE/AUTO全绿不补未采GUI；Main继续第5节既有缺证动作，足证交独立签字后再由总出口裁commit。唯一新增为本前缀自有审证文件；无源码、builder、GUI、端口/profile/业务根锁，无长运行子进程。**资源释放，STOP。**

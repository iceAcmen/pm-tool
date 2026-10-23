# 材料、会议与固定汇报有限 GUI 审证 R1

> 2026-10-22，trae，独立 GUI 审证专家，非开发、非执行端。给 Main、原合同 owner 和负责人按子断言接续使用。只审封存原件，不重跑测试或 GUI，不给整域、父任务或普通 commit 放行。

## 1. 结论与反证

**有限 PASS / 一项有限 FAIL / 余件 BLOCKED；不签 RA-M02、RA-J02、RA-J04、RA-R01..05 或 D10 整项。**

**MRR-R05-EXPORT-EXCERPTS：FAIL，仅“固定 MD 带出已选冻结摘录/来源”子断言。** 原 [57-fixed-export.md](../../reports/all-pending-evidence-20261021/MaterialRemainingR1/57-fixed-export.md) 实读全文 1415 字节，SHA256 `b9f324f6f253efad713d3a127767ec07a346c5526c27fbb699110473d772ac9e`，有报告标题、手工来源、摘要、快照、会议及异常项，但**没有**已存 `rpt-0002` 的：

- `t-0001/pl-3/rv-1`，测试乙，2026-10-19，`E3 rv1同日异ID`；
- `t-0001/pl-1/rv-3`，测试甲，2026-10-21，`E1 rv3正文`。

这两条存在于 [50 原报告 record.excerpts](../../reports/all-pending-evidence-20261021/MaterialRemainingR1/50-report-fixed-saved-raw/data/pmtool/reports/rpt-0002.json)，源改版/软删后报告全字节未变。MD 中两正文及 entry/revision ID 均不存在。按[原旅程 §2 RA-J04](remaining-journey-cases-20261021.md#2-完整用户旅程)“导出与已存汇报正文/来源一致”、[最终对账 §7 第3项](final-remaining-acceptance-reconcile-20261022.md#7-最小剩余动作与交回-main)，**不能签“导出含两条固定摘录”**。raw-report 的该概括被原副本反证；不覆盖原说明、不改产品、不诊断实现根因、不撤销旧 SOURCE/AUTO 的其他断言。固定 MD 的实际生成、拒覆盖、confirm 覆盖仍分别有限 PASS。此 FAIL 不代表整报告生成失败或资料丢失。

其余重要限制：

- 07 空作者错误卡 bbox 全在视口上方，不签即时错误可见。14 重开只拍任务顶部，不签新资料行的完整目视。
- 35/36/37/38、41/43 的关联行在当前 PNG 视口下方。真实保存、关联字段回读与入口返回可有限签，但不拿 DOM text 或哈希签“双向关联完整可见/焦点闭环”。
- 53/54/55 拍到旧报告摘要、手工来源及安全预览，未拍到下方两条冻结摘录。旧记录不变可签，摘录在详情/编辑中的完整目视仍 BLOCKED。
- J03 修前引用崩溃已有不同独立 MPRC 判定，修后 SOURCE/AUTO 另已签；本件不重复签 J03。新 GUI 候选在途，不用旧3257冒新修生效。

## 2. 授权、合同与身份

负责人本次原句要点：

> “父授权持续多角色余项验收/普通commit，无push/tag/release。”
> “你是不同独立GUI审证专家，非开发非执行，唯一写docs/testing/material-meeting-report-gui-review-20261022-r1*。”
> “只签实际有限部分……不签整域/commit。”
> “主tree合法新修108在途Main唯一builder，你不冻结锁它。”
> “资源releaseSTOP，先读AGENTS/collaboration既授权限制不fetch/pull/测试。”

已读 AGENTS 与 collaboration §9、§11，按同动作/对象/范围及最新明确授权执行，不套用通用开工 fetch、build、全回归或 livingdocs 写要求。已读 onboarding/handoff/progress 当前接续、原 journey §3 M02、§2 J02/J04、§5 R/D10、最终对账 §4.2/§7 第3项、有效 Oracle 纠正及原专家边界。livingdocs 的“未封包/新修在途”按历史时点保留；本件只认新封存原证，不修改他人状态。

| 绑定对象 | 原件与核对 |
| --- | --- |
| 原根 | `reports/all-pending-evidence-20261021/MaterialRemainingR1/` |
| 封存索引 | [index.json](../../reports/all-pending-evidence-20261021/MaterialRemainingR1/index.json)，封存 `2026-10-22T11:48:08.532Z`；SHA256 `759b9f6147386b815c33aaacae81f60e1aaf194be78dec2454597789d3aa9e9b` |
| 原件完整性 | 2852 声明文件，不含索引自身；实有2853件含索引，逐 bytes/SHA、路径集合核对，missing/differences/extras 全0。不是2852个功能或用例 |
| 被测旧候选 | 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` + 旧 U4 r2 未提交候选；冻结树 `/private/tmp/pmtool-u4-closure-20261022-r2`，runtime `/private/tmp/pmtool-u4-runtime-20261022-r2` |
| 旧候选元数据 | [U4 manifest](../../reports/all-pending-evidence-20261021/U4/candidate-evidence-manifest.json)，SHA256 `26f093c3f8fbc243a28cb736f452b6fc8aa1ed90ec7403bc14a94fac4948fba9`；其 client hash 与本包 compiled 认领一致 |
| 源认领 | [source-binding.json](../../reports/all-pending-evidence-20261021/MaterialRemainingR1/source-binding.json)，SHA256 `c553157850d33602071715f1cc9f3935f8a742ca4716c8bf5bd4000e3b398457`；原执行者核旧87插件输入+未变15 Launcher，共102，recorded differences=[]。本角色只审记录，未重读/冻结主树108或源码执行 |
| 实例/浏览器 | 原件登记 host3257/PID88698、Main EGO space13，p1 UI/p2宿主命令；不是本角色探活。GUI状态同origin3257、深色、p1 1470×746/DPR2，p2 1458×734/DPR2，不冒1440×900或原生200% |

p1 的 timeOrigin 分段为 `1792664607721.4`（M02至首J03）、`1792667724096.1`（J03重载后）、`1792667904806.6`（J02至末状态）；p2 `1792665115668.9`。只串同实体、同 runtime 和原段，不宣称全包同一文档时间原点。所有限定 PASS/FAIL/BLOCKED 均只绑定此旧候选与封存原件，不外推 Main 108 或后续新 bundle。

## 3. 分段裁决

下列 MRR 子号只是原合同的审证标签，不新建用例。`PASS（数据/动作有限）`不等完整 GUI、样式/UX 或整旅程通过。状态前缀均在本封存根，完整对应原 PNG/JSON/roots/raw；[自有审计](material-meeting-report-gui-review-20261022-r1-audit.json)逐项列差异与请求。

### 3.1 M02 两拒与合法重建

| 子断言 | 有限结论、原证与缺口 |
| --- | --- |
| MRR-M02-DATE：真实非法basic+合法ops | **PASS（拒绝/零写/就近错误/保稿有限）**。04/05 日期真实值 start=`2026-11-20`、due=`2026-11-10`；05 PNG 可见“截止日期不得早于开始日期”，焦点dueDate；原标题/草稿仍在。04→05 data/files/backups全清单等值，pmtool raw全等；05监听段只有3帧、无commands请求，不绕前端校验 |
| MRR-M02-AUTHOR：合法basic+空author op | **PASS（拒绝状态/保稿/零写有限），GUI错误可见 BLOCKED**。06/07 合法排期、排队ops不丢；07 alert text为“进展操作 1：作者不能为空”，06→07全根清单/pmtool raw等值。bbox top=-135.359375、bottom=-43.0625，07 PNG无该卡。没有07完整请求/响应文件，不声称原响应已逐RPC捕获；08/09既有错误重复观察无新响应，不算第二次完整拒绝 |
| MRR-M02-DISCARD：正常取消/放弃 | **PASS（取消与零写有限）**。10确认→11实际放弃；09→11全根等值。不扩 O4 的ESC/scrim/X/保留/焦点分支 |
| MRR-M02-SAVE：合法重建、一次保存、重开 | **PASS（单信封/落盘/重开顶部有限）**。12丢弃后重新建合法link/作者/正文，13 `16824.572` 一次 `/pm task update t-0001`，`draft.attachmentOps/addLink` + `progressOps/add`，随后`16824.573`只读snapshot，两响应匹配RPC、kind=success。12→13仅t1变化；新at-6/pl-4，旧at-1..5/pl-1..3逐字段全保，E2 deletedAt和全部修订、E3、冻结V1均不变；13→14全根等值。13成功toast/关层、14顶部合法标题及日期可见。14新link/pl4未在PNG视口，**不签它们在14的完整目视**；49候选后来实际可见pl4不等任务资料行重开 |

**初02/03保真**：日期fill实际两空；随后合法任务保存改标题并新增at-5，且宿主session清单变化。是执行设施误操作，不是“非法日期被放行”，也不是M02非法PASS。成功文字中含“非法”不改变实际输入合法性。不能把02原库当04基线；后续始终从修正后的明确before比较。合法重建不是在原排队空author中原地修改，本件不虚构该UI入口或“同一草稿原地修复成功”。

### 3.2 J02 会议、转换、双关联与问题

| 子断言 | 有限结论、原证与缺口 |
| --- | --- |
| MRR-J02-CREATE/ACTION | **PASS（真实会议/稳定行动项有限）**。23/24正常`meeting add`→mtg-0002，24请求`16824.817`；25行保存→26r2 raw actions[0].id=`ai-001`。26r2 PNG可见该会议、行动标题/负责人/截止/待办；等待DOM显示ai-001而超时保，不因表单未画ID判创建失败 |
| MRR-J02-PROMOTE | **PASS（确认、真转换与回写有限）**。27/28真实确认，29 `16824.825` 执行`/pm meeting action promote mtg-0002 ai-001 confirm`，success真实建t-0012并回写；前后仅会议/t12业务变化，29成功toast目视，稳定ai-001.taskId=t12；非仅改一个关联select |
| MRR-J02-DRAFT-CANCEL/SAVE | **PASS（draft取消零写、主保存有限）**。30 ms1+dlv1 draft→31放弃确认→32任务页，30→32全根等值；33重建→34 `16824.829` 一次task update含m-0001与draft addDeliverable dlv-0001，仅t12变。持久at-1固定name/version v1，源m1/dlv1全字节保。35重开标题与来源入口可见，关联字段回读成立；ms/dlv行在35 PNG下方，**不签双向完整可见或交付物页面往返** |
| MRR-J02-RETURN/REPEAT | **PASS（同源返回顶部与同源幂等执行有限）**。35“来自会议mtg-0002”入口→36同会议标题，原record保ai-001/t12；37→38全根零变。重复转换实际通过p2宿主命令`22091.158`，返回“已转为任务t-0012 / 无需重复转换”，38-command PNG可见原输出。不是第二次点击已转行动项GUI转换按钮；36/37/38未拍到下方已转行，不签它的完整目视/焦点 |
| MRR-J02-ISSUE-LINK/UNLINK | **PASS（真问题正关联/重开字段/断联保源有限）**。ri-0001是risk，选项不存在不算产品坏例；39r2/40r2正常create issue ri-0002。41/42 `16824.847`行update写riskIssueId=ri2，43重开字段仍ri2；44/45 `16824.851`写null，仅mtg2变，ri2/t12/ai-001其他字段全保。41/43 PNG只拍顶部，45可见成功toast和行动行；**不签ri2关联行的完整目视或问题页返回** |

旧/新 MeetingForm 嵌套导致“新增会议纪要截取pointer”有真实原失败；保留逐层关闭及随后fresh观察，不把失败洗成全部关闭链/焦点门PASS。本段不补即时task加/移/跨项目非法或 OKR 全kind；没有在本件宣称RA-J02整程完成。

### 3.3 Current、固定摘录、MD 与 Session

| 子断言 | 有限结论、原证与缺口 |
| --- | --- |
| MRR-R-CURRENT/CANCEL | **PASS（current候选/重选/安全预览/取消零写有限）**。46候选三条pl3/rv1、pl1/rv3、pl4/rv1，无软删E2/QA-B；47取消第三后预览，48退出全根零变；49重新建立，PNG真实可见已选2/3、两正确三元组和第三未勾选。47表格/代码/危险链接原文可见，原exec `7bb6ff2ce949f7a08ebc433c606cff23-output.log`记录scriptExecuted:null/scripts:0/jsLinks:0，仅本探针范围。没有跨项目非法提交，不以不可选签后端所有拒绝 |
| MRR-R-FIXED/SOURCE-CHANGE | **PASS（真实固定record与重入摘要/预览有限）**。50 `16824.857`一次report generate selectedRefs=[t1/pl3/rv1,t1/pl1/rv3]，没有excerpts并存；仅rpt2落盘，manual/null。51 `22091.173`真progress edit→pl1/rv4、新作者/正文；52真softdelete，旧三版全保。rpt2从50至59八个关键状态全字节不变，两摘录日期/作者/正文/三元组固定。53/54/55真实旧详情、编辑、preview的摘要与manual来源可见，**下方冻结摘录和日期控件未目视，不签该视觉余断言** |
| MRR-R-MD-SAVE/PREVIEW | **PASS（本恶意字段的实存/重开安全呈现有限）**。49原输入script标签；50提交/persist正文去标签保文本，危险协议仍文本；53表/代码摘要、54源码、55预览实际可见，不冒脚本执行。未做旧报告title/MD update主保存，也未做全协议/键盘矩阵；persist正文清理不说成原标签全文原样保留 |
| MRR-R-EXPORT/OVERWRITE | **PASS（MD生成、默认拒、confirm覆盖有限）；摘录缺失 FAIL见§1**。57真实relative export `22091.176`成功且有原1415byte副本；58r2 before/after同SHA/bytes，原58等待设施失败保。59 `22091.178`显式confirm响应“已生成或覆盖”。60另真实`22091.193`默认请求/原response kind=error，中文“已存在…追加confirm”，60 PNG toast可见。HTTP200/outer ok=true不是业务成功。未将58未drain原请求补造为60；56absolute failclosed未捕原response、无常驻snapshot，**历史NOT_CAPTURED/BLOCKED保** |
| MRR-R-SESSION-EMPTY/SAVE/READONLY | **PASS（空ID前置拒/零写、合法存、来源只读有限）**。61 PNG空ID且source=session；62段零请求、全根零写，标题/合法周期仍保；62错误位于上方未拍，即时可见 **BLOCKED**。63输入`session-38e1de91-9a43-45d0-a9dd-09a27ae8c56b`，64 `16824.877`一次generate→仅rpt3，sourceType=session/ID持久；65 PNG可见来源“不可改”及完整ID/摘要。63在合法值下仍见前次错误，是提交前原状态，保真不自行诊断。未验证session/title/MD update实存、日期与两摘录控件目视。合同仅非空，不新增“宿主必须存在”门；helper未复制host session原JSON，本角色不独立认证其存在 |

current与历史路径按[有效Oracle](materials-files-reports-independent-auto-20261021-oracle-correction.md)分开：本件选当时current，不强求selectedRefs历史rv2成功，不重M01四版可见、旧append/首次restore或既有SOURCE/AUTO。source软删后新session候选PNG62可见仅pl3/pl4，不能冒旧rpt2自动更新为这两条。

## 4. 原件能力与目视边界

**实际目视34张原PNG**，未生成接触表/替代图，未操作GUI，也未逐帧审60张JPEG。可复核目视路径：

| 原图组 | 看见与不能由图证明的内容 |
| --- | --- |
| 05、07、12、13、14 | 日期就近错、作者卡不可见、合法重建/成功toast/顶部重开；不拿14顶部证明资料下部 |
| 26r2、28、29、30、31、32、33、35、36、37、38-after、38-command | 行动项/确认、成功toast、dirty放弃和任务页、来源入口/同源标题/重复输出；部分draft行/关联项不在视口 |
| 41、43、45 | 会议顶部与断联成功/行动行；不是问题关联项完整照片 |
| 46、47、48、49、53、54、55 | 源码/安全预览、取消终态、准确current复合选择、旧摘要重开；旧报告下方摘录未拍 |
| 57、60、61、62、63、65 | 原MD成功输出/中文拒覆盖toast、空ID、合法来源值和只读；62即时错未拍到 |
| 22 | PM区域消失与宿主壳仍在，仅核原缺陷画面；不在本件签J03 |

首 66 抓到的是client-modules **40691byte bootstrap**，原full segment offset=-1，失败保留。67使用实际performance resource带`dsh-pm-tool/client.js`的组合URL，decodedBodySize=**2597521**，fullfetch字节SHA256 `7d4312dae04a9e979246a6cd241fc51e2312c4b15b8ed3361ff2212e67d8b0e1`。唯一[loaded-binding-r2](../../reports/all-pending-evidence-20261021/MaterialRemainingR1/loaded-binding-r2.json) SHA256 `06a73042bfa3d336184ed97ec844aa76d4394d8d598bd530bbb62572f9f35d40`，compiled1718721/hash51234141…，去sourceMap尾的执行段**1718689byte/offset875361/second=-1**。终核脚本独立重算sealed loaded段SHA/first/second，与旧U4 bundle元数据hash一致；没有重新读取live/frozen compiled正文、没有fetch。**这是旧client字节接续辅助绑定，不是首载无缓存或所有时段每次响应证明。** 原resource deliveryType=cache/transferSize=0，uncachedFirstLoad仍NOT_CAPTURED；66与67不合并冒首载成功。

存储证据的真实范围：

- helper只复制 `data/pmtool/` 原JSON，67份完整业务状态均按version=2/record解析，逐bytes/SHA与相应roots一致；不是对裸数组猜结构。
- data的host sessions/workspace及files根仅有当时清单指纹，**未复制原字节**；backups起初不存在，明确absent-root:backups，不能把absent说成完整备份通过。不得据此声称全盘零污染、全部host原JSON/附件字节被本角色再读。
- 导出不在helper三根清单；57专门MD副本与58r2哈希是单独证据。没有独立raw导出全根before/after，也没有59覆盖后另一全文副本，不伪造“所有exports零变/覆盖后全字节再次回读”。
- 21份events仅各自enable/drain/disable段，60有请求/响应无录帧；失败finally部分没有drain。没有原响应的07/56/58/动作段不填空日志代零错误；原console未覆盖的时段不称零异常。
- 本包执行索引57个exited/outputComplete=true，其中15个exit1/42个exit0。`outputComplete`只证明外层输出封存，不能证明CDP队列全部drain或全部命令成功。负责人所述原command58/初statehelper partial属于原历史数量/边界，**不把索引57改成58、不补造第58份metadata/末码**。

## 5. 保留缺口与真正余动作

| 原范围 | 接续最小动作；不授权本角色执行 |
| --- | --- |
| 固定MD摘录/来源 | 原owner/Main核本次FAIL与已批准出口；如要带出两冻结摘录，按既有独立门处理当前确证问题，再独立审新产物。不要重复57..60已有生成/覆盖动作，也不能以旧AUTO字节相等签内容完整 |
| M02 | 优先已有其他原段能否拍到作者拒卡/合法重开新at6/pl4；确无原件才只补错误可见与任务资料下部。07完整原RPC缺档按历史保，不反复重造非法写；原地修queued空author未执行不冒通过 |
| J02 / D11 | 只补已存t12的m1/dlv1与会议ai001已转行目视、交付物实际双向返回/原非法保稿、既有即时关联加/移/跨项目。不要再创建mtg2、转换第二task或再重复issue正关联/断联数据证明 |
| R / D10 | 旧rpt2两摘录详情/编辑/preview下方、日期控件实际只读、session空ID错误在当时视口、manual/session旧标题/MD实际update与来源不改。当前选择/取消/固定record不再重复；absolute/旧未drain仅保历史缺档 |
| J03/M06 | 保修前PM消失与原staging清理不当取消PASS；引用[原MPRC报告](material-progress-ref-crash-20261022-r1-report.md)、[修后不同专家SOURCE/AUTO](material-progress-ref-independent-retest-20261022-r1-report.md)。新候选GUI另在途：两link+progress refs+真文件取消/保留/放弃、重建一次主save/重开。**本角色不签J03、不重复诊断/复验SOURCE/AUTO** |
| 其余原总合同 | task/OKR全kind、共享文件断联/下载/末引用、完整备份恢复/失败回滚、RA-V/DR/MENU/W/320/VoiceOver/全Matrix等均保原未签。未采不新增产品FAIL，不转MANUAL_PENDING，不追溯待表决提议 |

按final-reconcile §7.3，仅解除本表已证实的子断言，不解除全部材料/会议/汇报/整旅程/父总门。新108候选合法在途，由Main唯一builder认领、构建和采必要新GUI；本件不要求冻结主树、停builder或暂停其他不受影响的已授权工作。普通commit门仍归最终对账，不由本件签。

## 6. 本轮审计、失败与释放

实际运行环境：macOS/bash，现有 Node **v22.23.3**，工具只读文件解析/fs/crypto、jq、shasum与本地图查看。pnpm11.28.5只引用原环境，未调用；未fetch/pull、Git（包括status/diff/commit）、install/build/Vitest/verify/e2e、产品导入、模型/key/credentials、活数据、上游、浏览器/GUI工具、服务探活/启停。

实际自有审计命令（仓库根）：

```sh
node docs/testing/material-meeting-report-gui-review-20261022-r1-audit.mjs audit
# 首exit1：误把25个仅manifest的host session/workspace路径要求为raw副本；
# 次exit1：错误按裸record读version=2信封，attachments.slice遇undefined；
# 第三exit0：按原helper采集范围/真实version+record解析，2852完整性、67业务raw、
# 24个前后区间、21事件文件、57执行/15非零、旧rpt2八状态一致。
node docs/testing/material-meeting-report-gui-review-20261022-r1-audit.mjs close
# 只再核封存原件与自有产物、loaded段唯一性、旧candidate元数据、导出缺摘录；
# 结果写同前缀-close.json，不覆盖-audit.json或封存index。
```

前两次是**本角色审计设施错误**，精确原因保在本文，不能算产品失败、不能删去后报“首轮全绿”。没有执行产品测试；所有PASS来自对原GUI/真实业务证据的有限独立判定，审计exit0本身不是产品PASS。原15条timeout/selector/弹层截取/error已在自有audit列完整execution ID/原exit/错误首段：包括日期等待、空author等待、取消selector、1px文件控件、stale文件ref、PM消失等待、action ID等待、risk误作issue、嵌套drawer、错误入口词、“删除/软删”等等待和58观察null。不得全部归为工具故障：J03关联PM消失已另专家确证产品缺陷；此处只保存外层原错误，不重新定根因。

只写本前缀脚本、audit、本文及close；原index/所有原件/其他testing/livingdocs不改。封签核对与Markdown相对链接/空白/标题自检只管本件可复核，不构成产品全回归。本报告的实际34图目视与声明原件完整性分开，未称67图/60帧全部目视。

**交回：有限结果与精确缺口归Main登记；本角色不接管新GUI、源码、build、端口、profile、数据、模型或Git。资源释放，STOP。**

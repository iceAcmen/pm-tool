# A13 治理消费入口与既有合同澄清

> 给 Main 恢复原 RA-AI01..03 采证、给独立专家辨别合同范围使用。trae，独立测试专家；父批次名义日期 20261021，实际核读为本地 2026-10-22 凌晨。仅澄清入口、schema、合法 fixture 和原承诺，不执行产品或 GUI，不判 Main PASS，不改旧报告。

## 1. 授权与恢复范围

负责人本次原句：

> 独立专家只澄清原remaining-governance RA-AI02“四消费点不自动重调模型”的具体四入口与schema/既有承诺。原a11/a12governancesourceGUI要求另外三点但未命名，Main已台账完整+源改删重校+restart、需精确既定动作继续。只写docs/testing/a13-governance-consumer-contract-clarify-20261021前缀，禁止产品/GUI/build/services/credentials/commit，不改旧报告。读AGENTS/collab/原P2-6 r8/F06/F12/requirements/代码调用链，确认是WBS/report/meeting/ask消费，还是OP四点误串；给既有source失效不自动生成可采路径/真实fixture目标、名义时间与来源ID字段要求、同名UI用例最小合法生成办法(生产gateway确认后refs不是手seed)。不新增UI字段/把未承诺粒度作新缺陷，不替MainPASS。允许只读源码具体查命令与呈现，不重复开发。此clarification为此前BLOCKED恢复条件，Main其他GUI照常。

本次明确授权覆盖通用 SOP：不 fetch/pull、install、build、产品测试、GUI、服务、凭据、commit/push；不更新 living docs，不碰其他专家前缀。依据 `AGENTS.md` §6A、`collaboration.md` §9、§11.1/11.4/11.5/11.7，只有有歧义的采证部分等待澄清，不阻塞 Main 其他已授权 GUI。

核读基线 HEAD=`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，工作树有其他角色在途改动；HEAD 不代表当前产品。37 个明确输入见 [输入指纹](a13-governance-consumer-contract-clarify-20261021-inputs.json)。本报告只认领所读源码，不认领新的 bundle、运行实例或实际页面。

本澄清完成后，“另外三点未命名”“冻结时间粒度未定”的合同歧义可以恢复采证。A11/A12 原 FAIL/BLOCKED、有限 PASS 及缺件原文保留；实际证据是否足够、完整 ID 是否关闭，仍须另由独立专家审证。

## 2. 四链与实际消费位置

**原 P2-6 的四链是 WBS AI 草稿确认、report 叙述确认、meeting 归纳确认、ask 应用；没有四个独立治理面板的既有承诺。**

[原 P2-6 报告](p2-6-independent-verification-20261017.md) §11.2、§12.2、§13.2 明确核过 `task.ts` 的 AI WBS confirm 挂点，以及 report/meeting/ask 挂点。§10 将“人工 Markdown import”移出 AI 链，§11.2 又明确区分 AI WBS confirm 与人工 import。不能把 §10 的人工导入裁定扩大为取消 AI WBS 来源。

[remaining-governance](remaining-governance-cases-20261021.md) RA-AI02 只写“四消费点不自动重调模型”，未列四个 UI 控件；A11 §4、A12 §5 把 F6 的 `kind=ask-apply` 称为只采“AI 助手台账”后，留下“其他三消费点”。这个数量不能据此推导为三个尚未实现的专用来源页。

实际源码是两处展示消费位置：

| 位置 | 入口与读取 | 已有呈现与边界 |
| --- | --- | --- |
| 项目 AI 内容助手，共用治理台账 | `panel.tsx:1608-1613` 挂 `AiAssistant`；其能力卡为 WBS / 进度汇报叙述 / 会议纪要归纳，`ai-assistant.tsx:181/307` 两个互斥返回分支挂同一个 `ProvenancePanel` | 台账按项目读全部 kind，不按当前能力过滤；三个能力视图和确认回执共用同一组件。已有 A12 F6 的 ask-apply 行也显示在这里，不因行 kind 就成为 ask 专用组件 |
| 项目副驾，ask 结果只读投影 | `CopilotPanel`，`sidecar-portal.tsx:303-340` 的 `loadApplied/refreshProjection` → `ask-provenance` / 父级 `web snapshot` | 仅取最近 ask-apply 批次及任务身份，现值取最新 tasks；这是 K13 / RA-P1004 的呈现，不是第二个完整 F06/F12 台账，不要求在此新增重校按钮、失效列或历史面板 |

完整治理读链：

```text
ProvenancePanel 打开 / 刷新
  -> ask-provenance <projectId>
  -> index.ts 路由 -> handleAskProvenanceCommand
  -> sweepPending + listProvenance + evaluateStale
  -> 按 table:id 查来源 -> classifyStale
  -> 同一台账显示结论、失效原因、来源分组

ProvenancePanel 立即重校
  -> ask-recheck <projectId>
  -> handleAskRecheckCommand -> recordRecheck
  -> validateSourceRefs + recheckProvenance
  -> 只追加 history -> 重读 ask-provenance
```

`commands/ask.ts:305-345` 和 `core/provenance-store.ts:220-248` 的治理处理器没有 `llm` 参数，没有调用四类生成器；`recordRecheck` 不按 kind 分叉。`ProvenancePanel` 的读取、刷新、重校也不触发父级 generate。

OP 是另一个明确命名的四处：甘特、任务树、概览、汇报，见 [原 OP 合同](objective-progress-acceptance.md) §0.2/§7 `OP-SRC-01/06` 与 [OP 当前澄清](remaining-objective-cases-20261021.md)。它们消费 `progress-derivation` 的 objective/display/coverage，不消费 SourceRef。治理验收不能转去四个 OP 页面补进度截图；仅凭“四”字不能认定历史作者发生了误串，能确认的是两组合同不可混用。

## 3. 四入口精确命令与来源边界

下面列生成入口用于辨认已有能力，**不是要求 Main 为 RA-AI02 再生成四轮**。正常浏览已确认记录、来源失效评估、重校与“人明确新生成/确认”必须分开登记。

| 链与真实 kind | 草稿及明确确认入口 | 真实 refs 与可选失效目标 | 现有 UI 路径 |
| --- | --- | --- | --- |
| WBS / `wbs-import` | `/pm task wbs <项目ID> <目标>` → 同项目、同目标、同进程 `/pm task wbs <项目ID> <目标> confirm` | `task.ts:625-700`：真实新建任务为 `task.create` basis；同 table:id 的 context 被去重，最终是新任务来源。改其中一个真实新任务 title → changed；合法删除独立叶子 → missing | AI 内容助手 → WBS 任务拆解可浏览共用台账。但 Web 自身生成为 `task wbs ... --raw`，确认为 `task importmd ... confirm`；后者是人工文本导入，无 `recordProvenance`，不能把 Web 这次入库伪标为 `wbs-import` |
| report / `report-narrate` | `/pm report narrate <项目ID>` → `/pm report narrate <项目ID> confirm`；Web 编辑确认走 `/pm report narrateuse <项目ID> <JSON编码叙述>` | `progress-report.ts:77-194`：报告自身 + 本项目 tasks 进 context；源码虽然有“basis”注释，实际 `actions=[]`，任务角色为 context。正常修改真实被引 task 的 title 可采 changed；报告自身可作为真实来源，但不能改固定 snapshot | AI 内容助手 → 进度汇报叙述 → 同一台账；也可从正常汇报列表打开已存报告，只浏览不重新 narrate |
| meeting / `meeting-summarize` | `/pm meeting summarize <项目ID> <速记>` → 原速记不变的 `... confirm`；Web 可另带 JSON 编码正文作 notes | `meeting.ts:166-195`：仅拟从解析后 actions 的 taskId 收 context；`meeting-summarize.ts:24-77` 的真实 parser 不保留 taskId，recMap 又只含 meetings，故当前正常归纳 refs 可以是 `[]`。不制造 transcript ref、自身 basis 或伪任务来源 | AI 内容助手 → 会议纪要归纳 → 同一台账；已存会议按正常会议列表查看。此链没有合法的非空 refs changed GUI 目标，见本节下方限界 |
| ask / `ask-apply` | `/pm ask <项目ID> <问题>` 经生产 gateway 返回、生产 parse/validate 后，人明确确认实际选中的动作 → `/pm ask-apply <项目ID> <实际解析动作数组> [--base <实际基线JSON>]` | `ask.ts:480-509`：只收 appliedActions/真实落库 undoChanges；basis 为实际改/建目标，不扫全项目、不收拒绝步。F6 有两任务 + 四类旧 update + 四类 create，十 refs | 副驾执行提议；完整来源/重校在项目 AI 内容助手共用台账。副驾“刷新”只刷新 K13，不重新发问 |

WBS、report、meeting 的 confirm 优先复用进程内草稿；**缓存缺失时代码允许人明确 confirm 再现场生成**。重启后仅读已存数据和台账，不发这类 confirm，才是在测“不自动重调”；不能把冷缓存的显式 confirm 当刷新，更不能为追求零调用修改生产缓存或绕过模型校验。report `narrateuse` 不调用模型，但单独手填该命令不足以证明此前经过 gateway 的 AI 生成。

会议原承诺是如实说明“原始逐字稿不持久化”，缓存非磁盘以及 report 任务 context 角色在原 r8 §13.4 都列为非阻塞观察。当前 refs=[] 可以验证条目、历史和无自动模型调用；其空集合评估为 consistent **不代表结论有非空来源支持**。不得把该空条目用于 RA-AI01 非空来源验收，也不得要求其缺失目标变 missing。

F6 的 `meetings:mtg-0001/mtg-0002` 是 **ask-apply 的真实会议对象来源**，可证明共享台账对 meetings 表的失效行为；不能冒充 `meeting-summarize` 的上游来源。本澄清不为后者新增非空 refs、持久逐字稿或任务 ID 字段缺陷。

## 4. Main 现在可继续的最小路径

已收到的 A12 改源、删源、四次重校及新 PID 回读，仍按 [A12 原报告](a12-governance-source-gui-retest-20261021.md) 的有限结论和缺件边界使用。本次不重放其动作，不再要求对同一 task 重改、重删、重建旧 before 或再重启。

| 对象 | 精确续采动作 | 原证与限界 |
| --- | --- | --- |
| 原 F6 十来源台账，A12 当前后态 | 在已认领的同一隔离候选/项目打开 AI 助手；不点生成/重新生成/确认入库。依次进入 WBS、进度汇报叙述、会议纪要归纳能力视图，查看同一台账；需要更新时只点台账“刷新” | 逐视图保存实际 mode、台账 id、同一旧 refs、changed/missing 与原 history、命令请求/回包；这是三个现有能力视图复用共享消费链，不是三份新 kind 的生成证明。切能力只改本地视图，可能不发新读取；不得虚记一次 ask-provenance |
| ask 消费 | 已有副驾结果则打开它，只点“刷新”并查看现值/数据截至；如不存在旧会话，只用宿主实际 `/pm ask-provenance p-0001` 查看原 ask-apply 行，再回共用台账，不为补历史而重新 ask | K13 的完整刷新旅程仍属原 RA-P1004。无旧消息 fixture 就如实不签旧消息场景，不手拼消息、不把共用台账当独立 ask 专页 |
| 原 changed/missing 重校 | 优先交已有原四次重校的参数/回包、raw ledger 前后及历史。确需新轮可在共用台账再点一次“立即重校”，明确它会对本项目全部 entries 各追加一条 history | 不要求三能力各重校一次；只计算 entries 中 conclusion=consistent 的 supported，不把八个有效 ref 数量当该失效结论仍 supported。新轮只补新证据，不追补当时未归档的旧件 |
| 四链无隐式生成 | SOURCE 以 §2 共用处理链及 §3 四入口映射交证；GUI 以实际读取/刷新/重校区间交原命令/回包、实际 adapter 调用前后计数或现有模型调用日志 | 从操作前 n0 到操作后 n1，期望 n1-n0=0；只覆盖该区间和已认领实例。没有 adapter 日志只能证明命令链未发新生成，不能声称“所有网络绝无模型调用”。不读取认证头、token 或正式 profile |

这组动作澄清 A11/A12“其他三点”的合法呈现路径。F6 只有 ask-apply 行，仍不得签“已生成四类 AI 记录”。若另一个原 F15 用例要验 WBS/report/meeting 各自落账，由原用例分别准备真实 gateway→草稿→明确确认；不把 F15 的全部生产旅程追加为 RA-AI02 的四个新 GUI 门。

若 Main 的当前能力视图与这里核读的源码不一致，先核候选/装载而非开发新入口；SOURCE 与实际 GUI 分层交证。本澄清不替 A12 缺失的 resolver/context、新 PID 下发绑定或原 TERM/port-free 输出签字，这些按原报告独立补件，无法取得旧件时另采新轮并注明时间。

## 5. F6 真实目标

标准包目录：

```text
/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected/
```

`F6-ui-standard/pmtool-backup-2026-10-21T14-08-30-668Z.json` SHA=`c786212c1a5b0023d4a5b8e75b32ed4f4c3dde192b9b0e3901eeb857c1490035`；`F6-ui-ids.json` / `F6-ui-expected.json` 为实际目标字典。原备份与 sidecar、合法恢复说明见 [修后 F6 交件](governance-fix-independent-retest-20261021-gui-handoff.md)。

项目 A=`p-0001`，显示名 QA-G A；原账本 `prv-mvi6srwe-mwn8sn`，kind=ask-apply，十 refs、全部 basis。t-0001/t-0002 为任务源；旧 m-0001/ri-0001/dlv-0001/mtg-0001 和新 m-0002/ri-0002/dlv-0002/mtg-0002 都是实际确认对象，不能用账本 id 代替来源 id。

原标准初态 t-0001 保留 at-1 链接、pl-1 三版、pl-2 两版及软删；正文为“确认后描述”。A12 后态 t-0001 标题已改、t-0002 已删，old refs10/history4 仍在。为当前刷新/重校使用已有后态；为同名新 fixture 使用独立副本的标准初态，避免把 missing 源重新创建成另一对象。

F6 reports=0、meeting-summarize 条目=0、wbs-import 条目=0。不能在 expected 或 raw ledger 人工新增这三 kind 来消除缺证。需要时 WBS 新 ID 由实际导入返回，report 新 ID 由实际 narrate 确认返回，meeting 新 ID 由实际 summarize 确认返回；不要按“通常 rpt-0001”等推算后直接写库。

## 6. 时间、版本与 ID 字段

真实结构由 `core/provenance.ts`、`core/provenance-store.ts` 定义；settings 表是自由 value，非新增 provenance 领域表。

| 层与字段 | 已有含义 | 原可要求的呈现 / 原证 |
| --- | --- | --- |
| 存储 `{version,record}`，settings `record.value.entries` | domain 当前 version=2；固定行 `pmProvenanceLedger` / `pmProvenancePending` | 不与 entry.schemaVersion 或 snapshotVersion 混比；回读 raw wrapper 时取正确层 |
| entry：`id/projectId/kind/status/schemaVersion/confidence/summary/createdAt/refs/history`，另可有 undo、audit | 账本身份、归属、确认/待补偿状态；当前 schemaVersion=1，confidence=未提供 | 当前组件显示“记录号 entry.id”、kind、结论、置信说明与 entry.createdAt。账本 ID 不可替代 ref.id |
| ref：`table/id/projectId/label/role/snapshotVersion/ruleRevision/updatedAt/basisFingerprint/fullFingerprint` | 表/稳定来源身份/项目/冻结标签/角色；updatedAt 是建 ref 时捕获的源记录更新时间，可为 null | 来源行须同时能辨认 label 与 ref.id、表、角色、快照/口径版本，跳转按表类型+ref.id，不按名称。AGUI-01 修后仅在 A12 有限关闭，不改旧 FAIL |
| history：`at/conclusion/snapshotVersion/ruleRevision/rows`；row=`ref/state/reason` | 人点击重校后真实追加；生产 at 是 ISO 时间，纯函数类型允许 null | 展开历史应显示原结论和时间；at=null 诚实“时间未记录”。历史 ref 与旧标签保留，不借新 source title 重写旧历史 |

“冻结时间”不得默认为一个并不存在的 `ref.frozenAt`：本系统有 entry.createdAt（账本登记时刻）、ref.updatedAt（捕获的源修订时刻）、history.at（本次重校时刻），三者不同。`snapshotVersion/ruleRevision` 当前均引用常量1，不是逐记录修订次数；原 r7 已认可该版本合同。OP calcVersion 也不是这里的口径版本。

名义 UI 时间按已有 `isoDatePart/isoTimePart` 截取 ISO 的日期与 HH:mm，**不做本地时区换算**。entry 的 `<time dateTime={entry.createdAt}>` 保留原完整 ISO；历史用原 h.at 切片显示。本批父文件名日期 20261021 与本地凌晨 2026-10-22 共存，不据此认定时间错误。

原 RA-AI01 的“冻结时间与版本”以及 F12 的“重校时间/人可溯”在本候选可要求上述现有时间准确、原 ISO/执行身份可回查；**未明确承诺每个 ref 行显示秒/毫秒、源 updatedAt 全串、本地时区、哈希，或 history 每行再显示来源 ID**。a11/a12 对时间 UI 粒度的待澄清项不能自动变第二个缺陷。HistoryEntry 没有 actor/by 字段，本轮操作人从采证角色、实例与真实命令链留证，不新增 UI/存储字段。若要更细粒度，属于另行产品选择，不作为本次补采前置。

## 7. 同名 GUI 的最小合法新 fixture

同名防错仍是原 RA-AI01 / F05/F10 的来源身份要求。原 A12 十条不同名路径不能推广同名；本节给准备办法，不声称已经生成或测试。

1. 在 Main 已授权、与当前后态隔离的副本使用原 F6 标准初态，绑定包/sidecar/候选。保留 t-0001/t-0002 的稳定 ID、材料与历史；通过正常 TaskForm 主保存或实际 `/pm task update`，在 **生成新 refs 之前**把两任务标题都改为“同名来源核验”。两者同项目、不同 ID，负责人保持可辨。不能先改旧 refs.label，也不能只改标题后沿用旧 F6 标签称同名来源。
2. 用现有隔离 gateway adapter 输出两条合法、确有改动的 task.update：目标分别为实际 t-0001/t-0002，patch 可仅为不同的新 assignee；title 不属于 AI task.update 白名单，正常用户改标题与 AI patch 分开。经真实 `/pm ask p-0001 核对两项同名来源任务的负责人更新` 的生产生成/解析/校验得到计划。保存 adapter 原输出与实际 parse/validate 结果；不得把手写 actions 直接作为“模型已生成”提交。
3. 在真实计划控件明确确认实际两动作，或宿主命令确认实际解析载荷及实际 baseline；真实 dispatch 成功后等 best-effort 台账稳定，取新 ledger id。核新 refs 两行都是相同 label、不同 `tasks:id`、同 projectId、basis、真实 captured updatedAt/指纹，且指向实际已应用记录。**模型输出可以是确定性 fixture；refs 必须是生产 buildSourceRefs/recordProvenance 的结果，不能手 seed。**
4. 新条目在 AI 助手台账展开：按可见来源 ID 分别点两条同名链接，记录每次 callback/实际目标 ID、完整目标表单/负责人、项目、返回台账；同名标题本身不足以辨认点对。目标 ID以原请求/快照/回读交叉证明，不为此新增表单 ID 标签。仅导航区间对照业务/ledger前后字节，不能把前面的正常改标题和确认写入也声称零写。

仅为该原同名用例安排一次新生成/确认，不与 RA-AI02 的零模型读取区间混算；先结束 fixture 生成再记录 n0。不必重跑十条不同名跳转，不增加同名项目创建、跨项目搬移、四 kind 各一份同名矩阵。跨项目/version白盒负例仍按原 remaining-governance 范围执行，不绕 production。

这套准备不使用旧 undo handle；不删除旧账本，不改标准包/expected、旧报告或历史。原 `verify-provenance-disk.mjs` 含直接 seed/prefill 的深度观察测试，不能充本同名 GUI 的生产生成证据。

## 8. 核证与交接

本批只读核 AGENTS/collab、requirements、原 P2-6 r8/F06/F12、remaining/两份交件、a11/a12 和四链/呈现源码；没有执行归档 runner 或导入产品模块。静态搜索发现 `rg` 不可用，改用限定路径 grep/sed；早期宽递归搜索被本专家按其精确 grep PID 停止，未停止任何服务。缺失的探索路径未用作证据，未安装工具。

macOS，Node `v22.23.3`；产品约定 pnpm `11.28.5`，本专家未调用 pnpm。仅执行以下自有文档审计及语法/空白检查，结果以 [输入指纹](a13-governance-consumer-contract-clarify-20261021-inputs.json) 和 [终核漂移](a13-governance-consumer-contract-clarify-20261021-drift-final.json) 为准：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a13-governance-consumer-contract-clarify-20261021-audit.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a13-governance-consumer-contract-clarify-20261021-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a13-governance-consumer-contract-clarify-20261021-audit.mjs finish
git diff --check -- 'docs/testing/a13-governance-consumer-contract-clarify-20261021*'
```

`git diff --check` 不全面检查未跟踪正文，新文档另回读；审计只 hash 37 个明确输入、只写本前缀 JSON，不扫 runtime/config/private URL，不调用产品、GUI或模型。不以本审计退出0代替完整产品回归、GUI 或 Main PASS。

Main 继续 §4 的既有入口采证及 §7 的同名合法准备，其余 GUI 照常；独立专家再按实际新原件审签。未签真实四类生成、会议非空来源、任何新 GUI、完整实例安全链、治理32项、发布或提交。此次合同澄清及本前缀写入权交件后释放；没有占用 GUI、builder、服务、端口或凭据。

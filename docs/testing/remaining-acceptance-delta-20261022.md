# 截至 A18 的有限余项证据对账

> 2026-10-22，平台 trae，独立证据对账角色，非开发、非 GUI 执行端。给 Main 按必要顺序收集剩余证据、防止重复已完成子范围使用。本文引用已有专家判定，不新签产品、整个目标或提交门 PASS。

## 1. 授权、截点与结论

负责人持续原句：“按之前盘点和分工直到所有没验完功能验完再全部提交、中途不要停”。[持续执行记录](../../reports/all-pending-acceptance-execution-20261021.md) §1 保留完整原句及已批准分工。Main 唯一 builder/GUI；本角色仅新增 `docs/testing/remaining-acceptance-delta-20261022*`。未 fetch/pull、install/build、运行产品测试、操作 GUI/服务、访问 credentials、commit/push；不修改产品、原报告、其他 testing 前缀或 livingdocs。

读取截点：执行记录最新 **09:25**；本次只读时间 **09:35:49 +0800**，HEAD=`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，工作树 dirty。A18 冻结树 `/private/tmp/pmtool-a18-closure-20261022`，不能用 HEAD/version 代替其差异与产物。A19 当前唯一开发仅 habits/必要同域 tests；A20 只交先行红与控制，未实施。此任务不重新派单、不测试这两个对象。

**对账结论：尚未全部验完，但不能把余证缺口概括为功能 FAIL。** 大量 AUTO、真实 GUI 子旅程已经独立签署；需保留其范围，补剩余动作与最终候选继承链。明确仍开的产品问题包括 A19 建议自身 OKR 展示、A20 文件材料数量声明、U4 任务表既有承诺缺口、GNHD-01 编号反馈的修后真实视觉缺口；其他多为限定 BLOCKED/NOT_RUN，见逐 ID 台账。

**在途状态差异**：09:25 执行记录仍称五类 check“在审”；读取时 [五类专家报告](a18-check-five-gui-review-20261022.md) 已落盘，§1/§5/§7 明确五规则按 ID 打开目标→取消有限 PASS，**这 25 步无必要重采**。Main 收到后同步其协调记录即可；本角色不改原记录，也不据文件存在替代角色运行状态。完整 P0008 尚有 task 单项入口、wrapped/叙事分支的证据映射，不重做五规则。

只读目录核对另见 `A18/okr-journey/`，未在本截点独立报告内审签；只登记“已有采证目录、待原分工交件/审证”，不把存在写为PASS，也不另派重复OKR采证。

**收尾接续补记（09:44执行报告）**：Main已同步五类check有限PASS。A19原开发仅habits/同域test交回，开发原13红与修后自测保留，`a19_habit_suggestion_okr_independent_retest` 已接单，**独立复验尚在途、新A19未build**；本台账的FAIL_OPEN表示尚无该修后独立关闭，不是否定开发已交件。OKR建议/confirm-ignore/clear保pending的14步797原件交 `a18_okr_journey_gui_review`，**在审，不签PASS、不重派或重复采证**。A20仍先行等待。r2索引实际读到该追加，主判定仍限A18及明确原报告；补记不扩本角色到A19复验。

## 2. 使用方法与有效合同

1. 先看本文 §5 顺序，再按 [逐 ID 台账](remaining-acceptance-delta-20261022-ledger.md) 找具体剩余动作。证据代码 E01..E24 在 §3 同时指向独立报告与原证根；行内的“已签”都属于原专家，不是本角色重签。
2. [总登记](remaining-acceptance-register-20261021.md)、[journey](remaining-journey-cases-20261021.md)、[objective](remaining-objective-cases-20261021.md)、[governance](remaining-governance-cases-20261021.md)、[layer-map](remaining-layer-map-20261021.md) 是既有合同。台账不删除 ID、不改变动作/预期、不用设计参考图当生产 GUI 证据。
3. “有限已签/仍缺”可以同 ID 并存。旧 FAIL/BLOCKED 原件保留；新候选复验只关闭其具体失败或缺口，不回写旧报告。历史未重跑不等产品失败；继承须独立核接缝差异，不能默认全重测或默认全继承。
4. 只使用已生效门：[AGENTS](../../AGENTS.md) §6A 与 [collaboration](../collaboration.md) §9/§11。AGENTS §6A.1 待表决设计签字/全组件矩阵不升硬门。本文展开的 B8 页面矩阵来自既有 journey §6，不将其扩大至每个新控件。
5. `selectedRefs` 只选当时 current revision，旧 rv2 stale 拒绝；合法历史版本另走 excerpts。active 重复 restore 是错误零写，不新增幂等成功。固定报告实际出口 MD；web/plain 是项目出口。branch 单独合法，不新增“必须 repo”规则。详见 E05/E08 的纠正，不按早期错误 oracle 修产品。
6. 纯命令承诺用真实 composer→POST/run/done/raw 回读可证业务；空 hero 不能称错误/反思文字已可见。先核已有呈现通道，缺口报具体能力/证据，不发明新页面、不自动判产品 FAIL。

机器最终展开在本前缀 `-index-r2.json`：每个普通 ID 对应台账行、原合同；页面 `RA-V-*` 逐格列出原参数与应补步骤。初版 `-index.json` 保留为补列 B1-B8 汇总域之前的文档快照，不覆盖。没有精确格的独立完整签署时不将局部截图映成整格 PASS。文档索引校验不是产品回归。

## 3. 已签证据与原证指针

以下根均在仓库，非私有凭据/活数据路径；相同原证可按实际动作区间复用，不重复计通过率。原专家报告内的 audit/index/manifest/raw/frames 是详细指针。

| 代码 | 独立签署来源 / 候选 | 原证指针与可复用范围 |
| --- | --- | --- |
| E01 | [A0路径/TTL](a0-paths-board-review-20261021.md)、[A0 GUI](a0-gui-raw-review-20261021.md) / A0 | `reports/all-pending-evidence-20261021/A0/`：四路径12命令、130/601秒 HTTP、复制A/B75/43字节；PATH完整字段与原片遮挡仍缺 |
| E02 | [batchA复验](batcha-independent-retest-findings-20261021.md)、[FC-A5](fc-a5-independent-retest-20261021.md) / 各自冻结 | `docs/testing/batcha-independent-retest-result-20261021-r5.json`、`fc-a5-independent-retest-20261021-final-result.json`：引用原SOURCE/AUTO，不升级Finder |
| E03 | [A8 GUI补证](a8-gui-supplement-independent-review-20261021.md) / A8；[A10恢复工具条](a10-restore-toolbar-gui-independent-review-20261021.md) / A10 | `reports/all-pending-evidence-20261021/A8/main/loaded-r2/`、`A8/board/{original-three-r2,save-cancel-r2}/`、`A8/restore/`、`A10/restore/{loaded-r1,negative,width}/`：三拖三undo、save/cancel内容、恢复/单前缀/390裁切局部 |
| E04 | [编号/历史/深色](gui-numbers-habit-dark-review-20261021.md) / A3/A5；[OP与编号复验](objective-number-independent-retest-20261021.md) | `reports/all-pending-evidence-20261021/A3/{numbers-r2,habit}/`、`A5/dark/`；编号值/焦点及F7历史局部；GNHD-01仅结构AUTO修后 |
| E05 | [材料AUTO](materials-files-reports-independent-auto-20261021.md)、[纠正](materials-files-reports-independent-auto-20261021-oracle-correction.md) | `docs/testing/materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr/`，`materials-files-reports-independent-auto-20261021-id-map.json`：M/F/R逐断言、合法F3/F4/F5、current/excerpts分路 |
| E06 | [备份复验](backup-web-independent-retest-20261021.md) / 新冻结 | `docs/testing/backup-web-independent-retest-20261021*` 报告所链 evidence：MFR-B01/B02 SOURCE/AUTO关闭，99/99；GUI用E03 |
| E07 | [OP AUTO](objective-independent-auto-20261021.md)、[OP修后](objective-number-independent-retest-20261021.md) | 原57+6逐ID：`objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/case-disposition.{md,json}`；修后 `objective-number-independent-retest-20261021-evidence/run-qCokWR/case-disposition.{md,json}`，均位于 `docs/testing/` |
| E08 | [材料/报告GUI](a13-materials-report-gui-review-20261021.md) / 实际 A11 | `reports/all-pending-evidence-20261021/A11/materials/{progress-journey,fixed-report,report-freeze-reentry}/`：rv4追加、软删/恢复、current摘录rpt2、rv5后固定、预览取消data |
| E09 | [OP GUI](a10-objective-gui-independent-review-20261021.md)、[可见补审](a11-overview-visible-final-review-20261021.md) / A10/A11 | `A10/objective/{manual-r1,checklist-r1,report-r3}/`、`A11/objective/{manual-visible-r3,checklist-visible-r3}/`，根同上：人工30/0、有清单clear、Space100/50、五态上下卡20% |
| E10 | [会议GUI](a11-meeting-layout-gui-review-20261021.md) / A11 | `A11/meeting/{actions,network-newcancel,widths100-r3,native-zoom}/`：稳定ID、一次主save/取消及局部8档；仅ai001真实task正关联，issue正例未采 |
| E11 | [Finder修后](a10-finder-reopen-gui-independent-review-20261021.md)、[箭头GUI](a11-finder-chevron-gui-review-20261021.md) / A10/A11 | `A10/finder/`、`A11/finder/{control,reopen}/`：N1/N2/S4与18px四档；个人Chrome PM完整动作/loaded/hash-only仍缺 |
| E12 | [治理修后AUTO](governance-fix-independent-retest-20261021-report.md) | `docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/` 与 `governance-fix-independent-retest-20261021-id-status.json`：32ID的有限AUTO、GG四缺陷修后、合法10refs F6 |
| E13 | [来源余项GUI](a13-source-remaining-gui-review-20261021.md) / 实际 A12 | `A12/governance/{source-jumps,source-stale,restart,consumer-read,resolver,loaded-r4}/`、`A13/gateway/`：AI01..03原合同来源GUI关闭，同名/三mode共用台账；历史停止原输出缺档保 |
| E14 | [PC修后GUI](a16-pc-gui-independent-review-20261022.md)、[选择/扩展GUI](a16-extension-selection-gui-review-20261022.md) / A16 | `A16/{pc-index,final/selection-cancel,extensions}/`：原base整批/逐步冲突、clean/freshundo、勾选编辑取消、四update clean/conflict；再生成后执行base局部仍缺 |
| E15 | [fresh文件GUI](a14-fresh-file-gui-review-20261022.md)、[三补件](a14-three-supplements-gui-review-20261022.md) / 实际 A13，clean消息A14 | `A13/final/main/fresh-files/`、`A14/{fresh-file-supplement,import-supplement,final/clean/visible-supplement}/`：取消、同hash新任务保存/下载、后续loaded/安全头/匿名、缺标题列 |
| E16 | [文件故障GUI](a15-file-fault-gui-review-20261022.md)、[忙态/习惯GUI](a15-busy-habit-gui-review-20261022.md)、[严格effects AUTO](a15-f02-strict-effects-dom-retest-20261022.md) | `A15/{file-fault,file-busy,growth-habit}/`；严格effects原证在其报告自有前缀：取消/失败重选一次save、正确file disabled、ReactDOM自动双effect14/14；不是host迟201 GUI |
| E17 | [原生导入GUI](a13-native-import-gui-review-20261022.md)、[导入故障GUI](a15-import-fault-gui-review-20261022.md) | `A13/final/materials/native-import/`、`A14/import-supplement/`、`A15/import-fault/`：两格式六功能、缺标题列/新trace、故障保preview重试；旧trace不可补造 |
| E18 | [A18 context AUTO](a18-feedback-context-independent-retest-20261022.md)、[接口完整原证](a18-interface-full-regression-review-20261022.md) / A18与interface-output | `A18/{candidate.json,build,build-pinned11,interface-regression}/`（原精确接口根见该报告链接）、`A19/dependencies/`：原20红保、真实context adapter20/新16、95/95、453原产物不变、自有完整依赖复制 |
| E19 | [导入反馈GUI](a18-import-feedback-gui-review-20261022.md)、[反馈控制GUI](a18-feedback-controls-gui-review-20261022.md) / A18 | `A18/{import-fault,feedback-controls}/`：两格式常驻红全文/67byte复制/重试，正常失败词标题成功、明确弃稿close后新编辑成功；模态后台close未成功保 |
| E20 | [成长补证](a18-growth-more-gui-review-20261022.md) / 实际 A13 | `A18/growth-more/`：33步970件，建议confirm/ignore守卫、D+1/D-3真实拒、人final/重复、解绑后正常重关联；建议自身OKR FAIL |
| E21 | [P0-P2补证](a18-integration-more-gui-review-20261022.md) / 实际 A13 | `A18/integration-more/`：83步5755件，session/attach/queue/quiet、既有reflect人final、wrapped命令、lesson/三档静态出站；file-count FAIL与未完成绝对web命令保 |
| E22 | [真空材料](a18-true-no-material-gui-review-20261022.md)、[五类check](a18-check-five-gui-review-20261022.md) / A18 | `A18/{no-material,check-five}/`：482/1628索引原件，新t8 gap/重复反思幂等、五条规则真实目标往返；不签反思文字可见/完整P0008 |
| E23 | [A19先行](a19-habit-suggestion-okr-contract-20261022.md)、[A20先行](a20-file-reflection-contract-20261022.md) | 各自 `-selftmp/r1/`：13展示红/20控制、4计数红/12+31控制；原共享10bin BLOCKED保，新依赖copy证明E18另归属 |
| E24 | [执行记录](../../reports/all-pending-acceptance-execution-20261021.md) §21:19与 [工具盘点](../../reports/ego-oil-pilot-status-20261021.md) | `reports/all-pending-evidence-20261021/C0/ci/`：run39557586592/commit9b1a8c5，core绿/e2e明确SKIP；EGO两有界无返回及后期401/挂起是工具事实，不是产品FAIL |

表中省略公共根的 `A*/` 都相对 `reports/all-pending-evidence-20261021/`。具体文件/动作区间以独立报告原链接和索引为准；不据别名制造新目录或认定原证丢失。本对账没有重算以上全部原图/字节，也没有重复 GUI 目视审签；来源指纹与文档链接自检在本前缀索引中明示。

## 4. 失败、复验与历史边界

| 原问题 | 截至本截点的新证 | 当前处置 |
| --- | --- | --- |
| BA-DEF01/02/03 路径/旧nonce/复制代际 | E02 SOURCE/AUTO，E01复制；后FinderE11 | 原失败保；具体自动缺陷已有限修后签。完整stub argv、替换浏览器真实回告/Finder门仍按台账补 |
| FC历轮菜单/同步/慢open/偏好/OS失败/Chrome映射/迟到失败覆盖S4 | FC-A2/A3/A4/A5报告、E02最终有限AUTO | 原历轮红保；不要再按旧源码派同修复。完整真实GUI不由AUTO代替 |
| reopen hash retrier/panel接线 | bridge独立42/42；E11新tabN1/N2 | SOURCE/AUTO已复验；same-mounted hash-only真实GUI尚未签，不用新tab替代 |
| B1-FW01同值RGL压实 | A6/board修后36+9；E03 A8三原动作 | 原失败保；三拖三undo及save/cancel内容已签，不再重复三拖；精准cancel保护/全部16卡另项 |
| OP三AUTO缺陷、ON-DEP-COMPILE01 | E07修后消费者/协议/类型检查 | 已有限复验；原52绿/3红不洗。未变派生断言先做继承核定，不强迫全部深树重新跑 |
| GNHD-01编号反馈裁切 | E07结构AUTO修后 | **修后真实视觉未签，仍开此视觉范围**；原code/clipboard/焦点E04保留，不再怀疑剪贴板值 |
| MFR五文件P1、staging symlink/中文header | E05与A13 staging/Unicode独立复验；E15/E16 | 指定SOURCE/AUTO及中文GUI局部已闭，原红保；不是全权限/迟201/所有类型GUI完成 |
| MFR-B01/B02恢复接缝 | E06 AUTO，E03两确认/13表/双字节/安全快照 | 原FAIL保；具体接缝有限修后签，完整UI备份→非空恢复→新进程全重进/故障回滚仍缺 |
| A6-BGUI01、A7-RV01、A8-RV02 | E03/E19相关新候选局部GUI | 保存误红/preview第三列/组合前缀已有限复验；BF-G02..04仍未全部采 |
| A8-TW01分享裁切 | E03 A10 390浅深四按钮入镜通过 | 当前局部裁切已修；键盘/菜单/中宽/原生缩放等整TW仍BLOCKED，不重新判分享必然仍被裁 |
| A9-F01失败词行动项标题误拒、A9-F02非法后行半写、import文件名空格拒 | A10/A13 SOURCE/AUTO与E10/E17 | 指定修后通过；旧失败保，当前六导入/会议保存不重做；旧preview trace缺档不可洗 |
| A10-OP-G01 | E09 A11五态上下卡20% | **局部关闭**；原误归因wrapped已更正为todo/legacy100，保原ID/FAIL，不反向改历史标题 |
| A10-MGUI-F01、A10-FG-V01 | E10行动项局部、E11箭头四档 | 局部关闭；会议issue正例/长菜单/200%、Finder完整PMloaded/hash-only另补 |
| GG01..04 | E12全四修后有限AUTO；E13 AI01..03 GUI | 原红保；来源三个ID限定GUI门已关闭，不能再派“补十来源/changed/missing/同名” |
| SM01、PC01/02、四扩展base | A14/A15/A16 SOURCE/AUTO；E14、E15clean可见补图 | 指定修后有限GUI通过；再生成实际base、四create/负例/其余undo生命周期另缺 |
| A15-IM-GUI01、A17 TF-X08 | E18/E19显式context AUTO、真实两格式失败红卡 | 普通Failed to fetch场景已有限GUI修后；**标记catch原因/同值竞争GUI仍BLOCKED**，原20/旧93/95失败保 |
| A18-GM01 / A19 | E23原13红/控制；A19开发在途 | **FAIL_OPEN，等待原开发交回与独立复验**，不重派/不自验 |
| A18-IM01 / A20 | E23原4红/控制；E22真空材料另已签 | **FAIL_OPEN，A20尚未实施**；t3有file不是empty，修计数不回算历史反思，真t8 gap不必再造 |
| RA-GAP-U4 | 原总登记裁决、A13先行32红 | **SOURCE FAIL，有限承诺未闭**；仍等待当前缺陷门后既有分工实施，不借本对账开第二开发 |
| A0 assets缺根变空/全data含微信变化、共享10bin漂移 | 旧失败保；E18新95五缺根哨兵0/自有copy另签 | 不改成历史零污染，不归因无证PID；后续限定写根保护，不碰并行微信成果 |

历史停止链/父工具末码、旧被覆盖draft/缺帧、绝对web导出未完成均单列 `NOT_CAPTURED/BLOCKED`。找不到原件就保缺档；今天重查/重演不能证明历史发生什么，也不应将这些缺档扩成整个业务功能 FAIL。

## 5. Main 最小必要顺序

下面是**既有合同的余动作排序，不是新派单或新测试计划**。遇未关闭产品缺陷继续该修复/复验，未受影响的采证照常推进；不把角色交回当整个父任务停止。

| 顺序 | 对象与具体最小动作 | 复用/停止边界 |
| --- | --- | --- |
| 1 | 接收五类check既有报告；等待A19原开发交回→独立SOURCE/AUTO→Main新候选build/实际下发→原两建议自身关联行pending/confirm/ignore重进、1440深/390局部→原独立专家复验 | 不重复25步check；不在A19未闭时实施A20/U4，不扩后台/聚合/全CSS |
| 2 | A19门闭后按A20原计划只修reflect材料行file计数，保质量由人复核→4红及12+31受影响复验→新file-only/mixed合法任务done→原入口读新声明/重复保历史 | 原t3错行不迁移；t8真空gap已签复用。未批准前仅保先行，不由本角色授权写 |
| 3 | A18反馈剩余：按原context合同采真正catch reason含summary/detail/action标记的错误，全文/常驻/复制且无原因动作；另按原代际/关闭控制采同值切换与迟到copy/timer | 正常失败词成功、两格式普通网络故障67byte复制、弃稿close后新编辑均复用E19；模态后台close未成功不能改成保稿成功；设施不能达到时明确具体BLOCKED |
| 4 | 先补RA-J03：原F3/F4合法资料两link+progress/filealias，取消/保留/放弃与一次主save组合；再补M01 basic+link备注+append组合和M02失败保输入→合法修正 | E08仅append，E15仅同hash文件保存，不能拼成完整组合PASS；不要重复已签软删/首次restore及fresh下载 |
| 5 | 补RA-J04/R：current候选主动选/取消重勾→固定报告；source再软删后旧报告保持；manual/session无ID拒/合法ID保存/编辑只读；安全MD实际保存/重开/固定MD导出覆盖拒/confirm | E08 rv4→rv5固定、preview安全、E09新report66可复用；不再用rv2 selectedRefs或把项目三档冒固定报告三档 |
| 6 | 一条RA-J02会议→同稳定行动项转task确认→补milestone/deliverable主save→回会议重复转换；顺带采issue正关联/解除、D11 draft与quick即时两路、D12合法全kind | E10稳定主save/新行cancel/布局局部复用；不把ai002一直null当两次有效解绑，不拿普通risk当issue |
| 7 | OP余GUI合并一次合法F2旅程：无清单manual40→clear及cancel-clear；manual30/0时报告；wrapped迁父/改todo后各消费者；effort/evidence合法+拒/完成日期revert；390与真实新宿主回读 | 先映射E07/E09/E22，保已有52子断言及修后类型/协议；未变纯derive/深树由专家按diff继承，不全重跑 |
| 8 | AI04补再生成后的真实完整执行base与生成raw；AI05补四create+每类合法update/拒delete/unknown/跨项目/wrapped/资料数组，映射applied refs；AI06既有故障/取消/恢复GUI | AI01..03来源门与A16 task整批/逐步/四update clean/conflict/freshundo已签，勿重派；真实模型条件见§6 |
| 9 | P0/P1/P2余命令旅程：capture cancel/confirm/任务来源；metric逐账；K13旧投影刷新/目标返回；L2 achieved/accepted→反思→人final；absence-only/正常跟进、mute历史TTL、31/29天出站位、OKR建议/clear与单父软联、archive/review、习惯聚合既有通道/周期占位 | E20/E21/E22已签session/attach/quiet/lesson/真空与五check复用；OKR先收已存在的okr-journey原分工交件/独立报告，不重复采；聚合无GUI控件先由原owner明确现有只读通道，不创造按钮或判FAIL |
| 10 | 文件剩余：原生sheet取消的未采动作；共享asset断一/下载另一/断末/GC原命令；合法非空UI备份→预检cancel→confirm→安全快照→新进程全表/双字节重进；隔离故障提升/落盘→回滚及旧格式/pilotOFF保键 | E15/E16实际新task同hash保存/安全下载/取消/失败重选/严格effects已签，别重做；host迟201 GUI与AUTO分层，不能以Request hold冒收件 |
| 11 | 界面余证并入上述旅程：BF失败/重置/queue/加载关闭重试，GNHD修后实际长反馈，D02/03/07/危险确认/O3O5；按原RA-V及DR/MENU/W逐格映射补未签动作，320填充、VoiceOver、U4原有限合同 | 可同次原证映多个ID，逐时间段/对象绑定；已有会议局部8档/Finder箭头4档不叫全页矩阵；工具效率观察不挡产品主线 |
| 12 | 最终候选唯一冻结→全部现有可执行build/typecheck/coverage/95发现集+guard/Launcher专项及其余实际适用verify→独立逐域受影响复验/继承→Main同步档案与统一普通commit | E18原95/453只对该接口输出；最终源码有A19/A20/U4等差异不可直接沿用。真实模型/本人条件另列，push/tag/发布/正式切换不在本授权 |

每个回件仍带候选/fixture真实ID、初末原JSON/byte manifest、明确主提交点、原请求/run/done及连续动作/可见状态；不新增全球字段模板门，不补造旧父末码。无法执行项列具体条件并继续可执行项。

## 6. 模型与本人条件

| 既有ID | 当前事实与最小条件 | 判定边界 |
| --- | --- | --- |
| RA-AI06真实授权模型、real-model verify | E12/E24均未执行当次真实云模型；先由Main核已合法配置/授权可用性，仅记录状态，不取正式profile/key、复制credentials | 未尝试/未证本人必要前为NOT_RUN或条件待核，不自动MANUAL_PENDING；可用则Main执行一次非空来源确认/重校，结果只支持当次 |
| 模型登录/授权确须本人 | 若工具实际拒绝或认证页必须本人操作，交明确URL所属服务、必要动作与真实错误，不落token/key | 才按ADL047列MANUAL_PENDING；非PASS、不阻可自动门，用户反馈失败重开 |
| RA-AT02 VoiceOver/RA-V原生缩放/Finder/原生filechooser | Main当前桌面能力已在持续记录声明可用 | Main-only不是user-only，不整轮转本人；真实OS授权确阻才单列必要本人动作 |
| RA-CI01 | 原commit已有run39557586592可复用，只覆盖9b1a8c5；本轮禁止push/触发新workflow | 新候选CI未跑非FAIL；现有只读访问需本人登录时才MANUAL_PENDING。e2e SKIP不变PASS |
| 删除/恢复/覆盖等高风险动作 | 即使隔离仍沿原明确确认范围；正式数据/部署本轮不操作 | 不以人工分层免确认；不为全部验完越过系统门或伪造PASS |

## 7. 候选影响范围与证据继承

| 文件/接缝变化 | 最小受影响ID与需重绑定 | 可保留、不机械重测 |
| --- | --- | --- |
| A19 `views/habits.tsx`+同域tests | RA-P3001建议自身关联、DR19/相关habit页矩阵/列表标签；P3004既有卡关系呈现回归 | check/OP/file后台不受只读关联行改动直接影响；原suggest确认守卫由专家按diff继承 |
| A20 `core/reflect.ts`+必要tests | RA-P0007材料行、P1005共用构造、J05、W关联反思素材；新file-only/mixed/真empty与旧历史不回写 | 文件上传/字节安全及真t8旧草稿不必重采；但不能用旧错材料行作修后oracle |
| U4 `task-views*`/`tasks.tsx`/相关tests（尚待既有流程） | U401/402、命名视图/sort/export相关MENU16/18/36/38、tasks矩阵/旧tree/项目隔离/编号 | 原board multiSort已签，不重开max3；无任意列/团队同步新合同 |
| A18 `panel.tsx`/`result-card.tsx`/`ui-feedback.ts` | 全共享反馈/复制/恢复/导入/来源入口的受影响呈现；TF-X08与代际GUI、O3O5/相关RA-N | domain只读derive/已签文件字节断言按依赖diff继承，不能笼统废全部AUTO |
| sidecar/panel扩展base | AI04/05确认前快照、选择/取消/undo、DR01..03/MENU30..33 | AI01..03来源原证保A12签字；最终新导航/样式须重绑定，不必重删来源/重校历史 |
| records/meeting/report表单 | J02/J04、D10、M/R、对应DR/MENU与页面矩阵 | 稳定domain守卫按diff可继承；字段实际写/全部长期历史不靠表单存在证明 |
| staging/asset/backup事务 | J03/J06、F01..08、material原子写及备份旧新键 | Strict effects已独立自动复验，准确继承原组件字节；新真宿主迟201另证 |
| 全局CSS/入口/lib/宿主/flags/实例改变 | 原受影响RA-V/DR/MENU/W与完整load/source解析链重新认领；editor chunk单独 | 不因bundle路径不同hash自动判污染；原签署所属冻结候选保历史 |
| 两verify断言+AST helper，无产品/453变化 | E18已独立核oracle/发现集95/产物/依赖copy | 原产品AUTO按已签范围继承，不能把旧93/95/19绿1红改绿；后续产品改动另候选 |

A18 candidate SHA=`2d533a1d214c0ae68739b354aac2e0d85b37ca6735c256d3dd3820bce3c191b9`；原520输入/453产物，3248/PID63429、target=`BA817F66FCE81BD58357C4B50BFFDF2C`、timeOrigin=`1792629512672.7`来自原报告，不是本角色探活。A13旧P0/P2补件不因放在A18目录变A18产品；A16旧扩展不变A18context证据。

## 8. 文档自检与释放

实际仅 macOS 内置只读shell/git与既有Node22.23.3文件解析；pnpm11.28.5是项目约定，本角色未调用。`rg`不可用exit127，改find/grep；指定记忆入口不存在，未安装、搜私有目录或补写记忆。这些是探索边界，不是产品FAIL。

本前缀索引校验只核普通ID/矩阵展开、引用存在、源文档哈希及输出范围。它不导入产品、重放任何原执行器、连接浏览器/网络/服务、判断GUI或运行回归。初版检查退出0：297台账ID/244原合同普通ID、1184矩阵格、24证据代码、60执行记录所链报告、84源文档/53链接、问题0；随后补列8个批次汇总域，保初版另出r2。**这些计数是文档索引行数，不是独立功能分母或产品PASS数。** 产品测试本轮 **NOT_RUN（明确禁止）**，不能说本轮“测试全通过”。

命令均在macOS仓库根，现有nvm Node22.23.3，无安装或产品导入：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/remaining-acceptance-delta-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/remaining-acceptance-delta-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/remaining-acceptance-delta-20261022-audit.mjs r2
git diff --check -- 'docs/testing/remaining-acceptance-delta-20261022*'
```

初次语法检查/初版audit/diff检查均退出0；r2与最终语法/范围检查的真实退出及最终文件hash另新增同前缀 `-verification.json`，不改旧index。未跟踪文件空白/相对链接另由audit逐字读取核验，不能只凭git diff-check无输出。源文档指纹仅绑定读取时点；持续执行记录/其他专家合法追加不当冻结污染，未来结论须按新报告补充。r2已退出0：305台账ID（含8批次汇总）/252原合同普通ID、1184矩阵格、24证据代码、62执行记录链接/85源文档/53链接、问题0；62中含Main新追加的本对账链接，**本角色自引用不算新增独立证据**。最终补记使本主报告新hash不同于r2读取时快照，唯一自有更新在verification中登记，不假称r2锁定其后字节。一次本前缀手工补记patch因行上下文不匹配被拒、没有写入，重读后修正；是文档操作错误，不是产品FAIL。

仅本前缀新增文档/纯文件索引产物，未覆盖其他专家成果。不取得主源码、builder、GUI、端口、活数据或依赖锁，无长运行会话/子测试/服务需接管；**本有限对账完成后释放**。Main持续父目标不停止，本对账不自签整个目标PASS、不授权提前commit或push。

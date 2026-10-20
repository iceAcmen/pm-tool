# B1–B8 持续验收映射（需求 → owner → tests → 尚缺能力）· 2026-10-20

> 独立 QA 只读压缩映射，非实现、非 GUI PASS。依据：路线图 `PM工作台新版实施路线图-20261020.md`、规格 `reports/任务资料与进展记录规格.md`、设计 `master-manifest.json`（covered 180 / referenced 177 / unique 175；page34·drawer42·menu39·state60·note3·receipt2；light155/dark25；wb79/planning31/records28/growth42）、当前源码只读扫描。
> 口径：code complete ≠ tests passed ≠ deployed ≠ CDP observed；所有 GUI/像素/200%/拖缩/刷新重启归 Main 采证，QA 静态/AUTO 绿不替代。

> **QA 当前姿态（2026-10-20）**：当前工作树全量 **98 files / 909 tests 全 PASS**；build EXIT0、module-table PASS、client-bundle smoke PASS、verify-isolation **94/94 污染 0**（before=after=228）；U5 targeted、records 与 B7 AI 只读投影专项均绿。**最终精确冻结 RUN=`run-20261020-093657`**；`run-20261020-092529:3194` 是与最终业务代码一致、仅比精确冻结多两处 CSS 尾部空行的 GUI 证据候选（旧 fix2/083110、fix3/084528 均被后续改动取代，**勿启动、不发布其启动命令**）。Main GUI 已采证：最终业务候选 12 个业务入口全部可达、可见内容、无错误页、无外壳横向溢出（`candidate-b8-final/final-route-smoke.json`，最慢约 1.1 秒）；任务 dirty 取消确认在 092529:3194 真实通过并完成服务重启读回；会议空态顶栏打开新版 records 表单、交付物顶栏显示里程碑解除与备注字段；B2/B3 真实资料+文件+Markdown 进展闭环在前一冻结候选 091129 完成，随后仅 O4 dirty 守卫和 CSS 尾部空行调整。B4 拖缩/持久化证据来自 083515:3191，B6 冻结摘录证据来自 082503:3190。**原生浏览器 200% 仍 NOT_RUN**：旧证据仅约 150%，Ego/Aha 的 `⌘+`/`⌘=` 均未改变视口，不得用 DPR=2 冒充 200%。

## 0. 决策闸门现状（覆盖路线图 §1，用户已批准项不再当待确认）

| 闸门 | 路线图原标 | 当前状态 | QA 备注 |
|---|---|---|---|
| P1 本地相对路径+清单 | 待确认 | **已批准** | 不硬编码云/对象存储 |
| P2 冻结 version 快照+手动更新最新 | 待确认 | **已批准** | 不自动跟随覆盖历史 |
| P3 append revision+软删+report freeze | 待确认 | **已批准** | revision 强制非 proposal，可恢复 |
| U1 attachments/progressLog 挂法 | B2 前闸门 | **已批准方案 A**（task 可选 arrays，author 非空文本/deletedAt 可恢复） | B2 已据此实现 |
| U2 真文件后端/白名单/上限/content sniff/位置 | B3 前 | **工程默认已定**（10MiB 可配/扩展名+声明 mediaType+magic 三重白名单/拒 active/sha256/root 防穿越）；非产品待决 | 核心模块已实现 11 测试 PASS，route/UI 未接 = NOTRUN，不叫「待用户」 |
| U3 snapshotRef 选取器联动 | Proposal | 提案，不当已实现 | 不进 B2 验收 |
| U4 多字段排序/列显隐持久化 | B4 New | **路线清楚，属 B4 新增实现项**（现引擎仅单字段 sort），非用户开放决策；本批不做须明确标 out-of-current-route | 待实现或显式排除 |
| U5 report-type 枚举（B6 New，路线内实现项非待用户） | B6 New | **已实现关闭**：`core/progress-report.ts:13` `progressReportSourceTypeSchema=z.enum(['manual','session'])`，refine 强制 session 带 sourceSessionId/manual 为 null；progress-report.test.ts 12 例 PASS；详见 `b6-enum-contract-gap-20261020.md` §5 | CLOSED（后端）；records panel/全量复测 NOT_RUN |
| U6 宿主主面板宽度契约 | 宿主/工程 | PM 不自控，不硬编码整窗 vw | 跨批视觉，真外依赖宿主 |

## 1. 批次压缩映射（需求 → owner → tests → 尚缺）

| 批 | 需求要点 | owner | 已有测试门（QA） | 当前状态 | 尚缺能力 / blocker |
|---|---|---|---|---|---|
| **B1** 共享 dark + tasks 试点 1 页（flag） | 共享控件 dark 对比/边框/焦点；tasks 页项目切换/深链/列表/抽屉/表单；空/加载/陈旧/局部失败/错误重试/无结果六态；pilot localStorage `pm-b1-pilot` 默认 OFF；共享 dark safety 全页 applied；busy+aria-busy；陈旧保旧数据+原因+retry；permission-denied 显原因保输入 | 前端 client `s_000E60G3Zfb` | §1 计划；contract-pilot.test.ts；AUTO 624 绿；**GUI 全 NOT_RUN** | 静态/AUTO 绿；GUI 待 Main | host slots 不 new URL routing（真 deep URL 归 U6 后续 NOT_RUN）；200%/拖缩/save-restart 待 Main |
| **B2** 资料软引用+链接多数组+progressLog 闭环（不做真文件） | attachments[]=deliverable/link；progressLog[] append revision/软删/汇报 freeze；schema 链 record/create/update strict + 写层 + archive/export/前端镜像；非法协议拦截保输入；取消零写；移除只断联；串行写队列+busy | data core `s_000E60ePRfA`（schema/持久）；前端接线 | §2 计划；**QA 23/23 PASS**；C8 三向关闭；作者门 PASS；AUTO 绿；回调命令精确参数+selectedRefs 合并 QA 探针 6/6 PASS | **后端 atomic 接口 ready（basic 区）**；编辑即时动作已接线，**B2-P3 原 HARDFAIL 已由 ops 信封重做，QA 独立复测 PASS（`b2-p3-ops-retest-qa-20261020.md`：Q1-Q7 纯引擎 + R1 raw 拒绝/R2 坏 op basic 零写真实 domain）；mainform 编辑走 ops 不走 raw；**TaskForm submit 信封 10/10 静态 PASS（`b2-ops-ui-qa-20261020.md`：单层 draft/单命令/create 别名/noops 省略/dirty baseline/成功 onSaved/失败不关层保留/既有分支不动/旧即时编辑器无挂载无双写）**；残留：raw 数组=create-only 整体重建（编辑禁用，by design）、编辑统一走 ops 信封且 update 拒 raw（task-materials.ts:153/277/278，client b2-ops 统一 ops）；旧 task-materials-editor 死代码待清理**；新建 single-draft/取消零写 + basic 非法全零写合同见 `b2-p0-ui-cases-20261020.md`，UI 写操作 GUI NOT_RUN | 修 P3 stable IDs/按项 patch；UI（新建 pending draft、basic 非法全零写、quick-manage 不伪装主原子）；U3 snapshotRef 提案不做；editedAt 留痕提案 |
| **B3** 文件存储/安全上传（slice1 starting，U2 工程默认已定） | 默认 10MiB 可配置；扩展名+声明 mediaType+magic 三重白名单 pdf/png/jpeg/gif/webp/md/txt/csv；拒 active exe/html/svg；归档不解包；sha256 content-address；tmp/取消清理；幂等并发；root nofollow 拒 symlink；file+db 备份往返；引用计数 unlink/GC | data（storage/adapter/安全）；UI 后续 | §2.8 B3-A01…A10/G01-G02（先用例后验）；**core `file-assets.ts` 11 单测 QA 复跑 PASS**；产品备份 verify-backup PASS；备份 L1-L4 PASS | core 静态 PASS；**全量独立：98 files / 909 tests 全 PASS；build EXIT0、module-table PASS、client-bundle smoke PASS、verify-isolation 94/94 污染 0**；B3 文件域 targeted 29/29（file-assets 11 幂等+root、file-promotion 2 含 production 事务同 hash 去重两 stage 同时 finalize、file-staging 7、file-backup 9 字节往返/损坏零写/提升回滚/穿越拒）；**prepareFilePromotion 与生产 applyTaskOpsWithFiles 均查 existingRows+newRows**；`src/core/file-promotion.test.ts` 含生产事务回归（同 hash 去重、两 stage 同时 finalize）；脚本 verify-b3-asset / verify-b3-bytes / verify-backup / verify-promote / verify-cascade 均 exit0 PASS；dashboard 静态合同 closed/code-ready（前端 web 集成非阻塞）；GUI NOT_RUN；就绪清单 `b3-audit-readiness-checklist-20261020.md` | U2 非待决（工程默认已定）；直挂仅适合已保存任务 quickmanage；存储 adapter/白名单/上限/穿越/zip/GC/F2 已落地；真文件选择/拖入 UI 联调；file_assets 备份一致包已含（#41 备份 extra 表+file_assets 实现+测试完成） |
| **B4** 总览+项目概览混合卡片迁移（16 卡） | 两入口单 scope；16 类卡全保留；自定义 source/formula/filter/sort/history；drag 宽高/跨断点 canonical/刷新重启；不自动搬位；customMarkdown 安全；取消失败保 layout；五态计数同源 fixture v1.2（24=done7/in6/blocked2/todo8/wrapped1，open16，29%） | 前端 board/overview（B4 切片） | §2.5 计划；b4-guard 26 + board 全量 89 例 QA 独立复跑 PASS；16 卡关键事实逐项源码核（wrapped 中性不计完成环/projectScale 真实%/objective 清单无 fake/people 同 MAX+未分配单列/risk 走 core/weekly 空态/overdue pill/record filter·sort/公式错误·空态/ring 不含 wrapped·trend 真实/Markdown 安全/引擎 RGL·layout 未改） | **静态 widget 视觉层 PASS，B4 非 complete**；GUI NOT_RUN | **overview project-scoped front 已落地**：scopeSnapshot 全数组收窄 + fileAssets 清空、PROJECT_DEFAULT 7 卡、回退链 byProject>legacy只读>projectDefault、save/reset 仅 project:<id>、全局不变、旧布局不重置（独立 targeted 24/24，`b4-project-board-final-qa-20261020.md`，静态 code-ready 非 Gpass，GUI NOT_RUN）；U4 多字段 sort 引擎 QA PASS（`b4-u4-multisort-qa-20261020.md`，作者11+QA8）；max3 三层闸门（UI+zod.max3+引擎slice3），priority/milestoneId 已实填充可排（上一版误判已撤销）；残留 minor：引擎/zod 不校白名单，手写未知字段静默 tie；列显隐持久化待实现或显式 out-route；新字段联动依赖 B2；200%/拖缩/save-restart/断点 Main 采证 |
| **B5** gantt/milestones/risk-issues/people（全 Migrate 视觉） | gantt 真实跨度/依赖/关键路径/今天线/刻度，拖拽只改起止；milestones 四态+achievedDate；risk 全枚举 closed 不入矩阵；people 只读派生同 MAX 刻度零写；写操作未接明确禁用不伪装 | planning owner（B5 切片） | §2.7 计划；派生/计数测试已有 | 现有视图 Reuse 基线在；视觉迁移进行中 | 无 New schema；禁用态不得用原型假 disabled；GUI 待 Main |
| **B6** meetings/reports/deliverables 记录交付 | meeting 行动项 4 态/draft·final；report 冻结 snapshotAt+snapshot/异常 5kind×warning/critical/不自动入报；deliverable 负责人/版本/5态/仓库链接/只增变更史；汇报按周期选进展→预览→存独立摘录，源日志改不改已存；旧快照缺键不回填；0 裸 ID | records front-slice `s_000EuZNBH3B`（views+CSS+tests，props 交 front）；**持久 API 归 data（合同已交：selectedRefs 复合）** | §2.6 计划；records front 37/37 已 QA 过（非待复测）；作者 verify-b6-report 8 例 QA 复跑 PASS；**D1 跨项目/D2 软删/D3 excerpts+refs 互斥已修，QA 探针复验全拒**；**preview-route P0：R-a…R-f 全 PASS（作者15+QA补3，R1 冲突注册 flag 已修复复测关闭，`b6-preview-route-qa-20261020.md`）；core tsc EXIT0，full build/verify bundle PASS；**records/reports entry-guard 本轮独立复跑 6/6（records-entry-guard.test.ts 3、reports-entry-guard.test.ts 3，入口守卫/必填/互斥）** | **backend API ready**；selectedRefs panel+preview 已集成（records-callbacks/records-props/报表表单透传复合三元组，非裸 pl-N）；**Main 真实 GUI 已 PASS B6（run-20261020-082503:3190，rpt-0002，excerpts 含 t-0001/pl-1/rv-2 冻结正文，详情安全 Markdown/作者日期/复合来源）**；G 门待其余路由 Main 采证，非「无合同 BLOCKED」 | U5 targeted 本轮独立复跑 13/13（u5-help 2、deliverable-u5 2、deliverable-export-u5 3、progress-report-markdown-u5 2、ask-copilot-b7 4；legacy 归一/exports/help/milestoneId 跨项目拒绝/note 持久化清空，`u5-b7-targeted-qa-20261020.md`）；仍 open：source error UI；真附件联调依赖 B3。全量 98 files/909 tests、build、module-table、bundle、isolation 94/94 污染 0 均 PASS。
| **B7** okrs/habits（已实现仅视觉）+AI 副驾/Key 通道 | okr 创建/编辑/draft→confirmed 仅人触发/单父/软关联；habit 打卡/2天补记窗/确认/streak（周期调度预留不实现）；AI 对 attachments[]/progressLog[] **只读投影不提议写**；ALLOWED_OPS 不变（仅 task.update/milestone/risk/deliverable/meeting create-update，无 delete、无新字段写） | **视觉=planning/growth owner；AI 新来源投影+汇报联动=需 data owner（勿只划给视觉）** | 待补 B7 门；现有 okr/habit 模型测试；**growth 面板注入 6/6 静态 PASS（`b7-growth-panel-qa-20261020.md`：无重复表单/prefill·status 保留/命令精确/校验·busy·取消零写/共享 listbox 键盘/AI 白名单不动；作者16例复跑；复跑 growth-form-props 11+okr-model 5+U5 13=29/29）**；B7 AI 只读投影裁剪 ask-copilot-b7 本轮 4/4 PASS（trim 白名单字段/剥 url·assetId/note/仅 basename、排 deleted、最新5条、截80字、UNTRUSTED 包裹；`u5-b7-targeted-qa-20261020.md`），执行白名单 ALLOWED_OPS 未变 | okrs.tsx/habits.tsx/okr-model/habit 命令已 Reuse 存在 | **外部表单（ExtOkrForm/ExtHabitForm）已注入 panel，静态 QA PASS；growth 面板 6/6、B7 AI 只读投影 4/4（白名单 ALLOWED_OPS 未变）**；**B7 放行前必须有 okrs/habits/settings 可恢复 snapshot/export+回滚证据**（BACKUP_TABLES 现仅 7 表不含 okrs/habits/lessons/reflections/sessions/settings）；AI 写新字段须另立授权+扩白名单审批；GUI 表单交互 NOT_RUN |
| **B8** 独立集成验收+分批放行（全量） | 12 页×1440/1024/768/390×浅深、200%、键盘、拖缩、跨宽、save/restart、URL/XSS/file 注入、并发取消、备份恢复、汇报-AI 全链路；observed/customer validated 分开 | 独立 QA（非实现者） | 本映射+各批门 | 未开始，依赖 B1–B7 | 迁移清单旧键→新键；每批放行标准/回滚；7 表+B3 文件包恢复一致，其余将改域按各自 snapshot |

## 2. 12 页 → 批次归属（路线图 §7.1，已对 master 12 路由浅深成对核）

| 路由 | verdict | 批 | New |
|---|---|---|---|
| dash 看板 | Reuse 引擎/Migrate 视觉 | B4 | 多字段排序、列持久化(U4) |
| overview 项目概览 | Migrate 保留混合卡片 | B4 | 新资料/日志联动按 B2；新增统计先核口径 |
| tasks 全部任务 | Migrate 试点 | B1 | 多字段排序/列显隐(U4) |
| gantt | Migrate 派生 Reuse | B5 | 无 |
| milestones | Migrate Reuse | B5 | 无 |
| risk-issues | Migrate Reuse | B5 | 无 |
| people | Migrate Reuse 零写 | B5 | 无 |
| meetings | Migrate Reuse | B6 | 无 |
| reports | Migrate Reuse 快照 | B6 | report-type 枚举(U5) |
| deliverables | Migrate Reuse | B6 | milestoneId 关联、note |
| okrs | Reuse 已实现 | B7 | 无 |
| habits | Reuse 已实现 | B7 | 无 |

> master-manifest 12 路由浅/深 0 缺页（§15 成对地图）；12 抽屉 project-create/project-edit/task/milestone/risk-issue/meeting/report/deliverable/okr/habit/ai/settings 均在 covered（records/growth 用 `drawers.x` 点式 sourceId，与 inventory 英文 id 命名不同，**非缺口**）。

## 3. 关键能力点覆盖核对

- **16 卡（B4）**：completionHero/completionTrend/divider/formulaCard/kpiMetric/milestoneDeliverable/objectiveProgress/overdueSoon/peopleLoad/projectScale/queueCard/recordList/riskMatrix/statusRing/textNote/weeklyPlan；引擎全 Reuse（RGL 拖拽/clamp、minW/minH、zod configSchema、惰性公式 AST 禁 compile、FilterOp 白名单、单字段 sort、≤5 版历史、canonical 断点），仅视觉 Migrate。
- **资料 3 sources（B2）**：①deliverable 软引用(只存 id, P2 冻结版本) ②link(http/https, evidence normalize, ≤2048, 不联网) ③file(**B3 才真实现**，本批无)。
- **多 MD**：attachments/progressLog 的 content 走同一安全 renderer（零 DOM/innerHTML/eval），B2 已复算；预览/编辑/详情同 renderer。
- **报告 freeze（B6/P3）**：report snapshotAt+snapshot 独立摘录，源 progressLog 编辑不改已存汇报；旧快照缺键不回填。
- **AI 边界（B7）**：只读投影、不提议写；`core/copilot.ts` ALLOWED_OPS={task.update, milestone.create/update, risk.create/update, deliverable.create/update, meeting.create/update}，**无 delete、无 attachments/progressLog 写权限**；改白名单须另批审批。

## 4. 需即时上报父的未分配项 / 真外依赖（非产品开放决策）

1. **B7 AI 新来源投影+汇报联动依赖**：视觉归 growth/planning owner，但对 attachments[]/progressLog[] 的只读投影与 schema 读取需 **data owner** 参与，勿仅划视觉。
2. **U2（B3）工程默认已定**：10MiB 可配/扩展名+mediaType+magic 三重白名单/拒 active/sha256/root 防穿越，非产品待决；core 已实现 11 测试，续做 adapter/GC/UI 联调，不得削成假上传。
3. **U4（B4 New）多字段排序/列显隐持久化**：路线清楚属 B4 实现项（现引擎仅单字段 sort），非用户开放决策；本批不做须显式标 out-of-current-route。**U5（B6 New）**=`progressReportRecord.sourceType` literal('manual')→z.enum 扩值（data），实体/字段/枚举见 `b6-enum-contract-gap-20261020.md`；同文 GAP-R1（交付物 wrapped 视图分组缺，已修）、milestoneId/note 字段缺口（已实现，U5）一并开给 records/data。
4. **备份扩表决策（B7/B8）**：BACKUP_TABLES 7 表 + EXTRA_BACKUP_TABLES（settings/reflections/okrs/lessons/habits）；QA 探针 L1-L4 已 PASS（legacy 无 extra 不清空、显式空数组仅清指定表、白名单外表拒绝回滚、显式行替换未列表保留）；checks/sessions 宿主表不进 pm 备份合理。B3 file_assets 待追加实现文件包+db 一致；B7 放行前 okrs/habits/settings 回滚证据不得延后。
5. `nav-rail-search`（宿主全局刷新/侧栏搜索）属宿主侧，PM 不自控，不列为 PM 门。
6. records 分片菜单 select 用中文 `selects.会议状态` 等 sourceId，与 inventory 英文 id 命名不一致——仅登记卫生项，非覆盖缺口。

## 5. 状态口径

- 静态/AUTO/构建绿（全量 98 files/909 tests PASS、build EXIT0、module-table PASS、client-bundle PASS、verify-isolation 94/94 污染0、B2 23/23、Oil gate PASS、B3 文件域 29/29、B4 board 89、B6 D1-D3 复验全拒）**不等于 GUI PASS**；200%/拖缩/布局重启/B2 UI 写/B6 全链路/Oil 同页/Ego 效率全部 NOT_RUN，待 Main 隔离 candidate 采证。
- **缺口三分法**：未实现（路线内待写，如 U4 多字段 sort/列显隐、U5 枚举扩值、B3 adapter/GC）/ NOTRUN（代码在但 route·UI·GUI 未接，如 B3 route/UI、B6 panel、200%/拖缩）/ 真外依赖（宿主宽度契约 U6、nav-rail-search、真附件联调）；不统称「待用户」。

## 6. B8 逐页 actual 矩阵（route → owner → view 文件 → prod 存储表 → 写路径 → 已有状态 → 剩余缺口）

> 口径：静态源码 census（2026-10-20 04:0x，并发仍在变，仅稳定 checkpoint 复核）；「写路径」指抽屉表单是否已接线；状态列只标源码可见，未实现的留给 B8 Main 采证。全局共享：panel `busy` 禁用 + `stale` 陈旧横幅（refresh 失败保旧数据），非每页独立 loading/error。

| route | 批/owner | view 文件 | prod 存储表 | 写路径接线 | 已有状态（源码） | B8 剩余缺口 |
|---|---|---|---|---|---|---|
| dash（BoardBento 16 卡） | B4 / front board | `client/board/BoardBento.tsx` | 全表聚合（只读布局） | 无写，仅 openRecord/runCommand | 卡片引擎 Reuse；16 卡静态 QA 89 例 PASS（wrapped 中性/真实率/清单派生/同 MAX/core 矩阵/公式错误空态/ring 不含 wrapped/trend 真实/Markdown 安全/引擎 RGL·layout 未改） | 跨断点 canonical/刷新重启 drag 宽高、customMarkdown 安全、取消失败保 layout、**U4 多字段 sort/列显隐（B4 New，待实现或显式 out-route）**；**overview project-scoped front 未做，B4 非 complete**；GUI NOT_RUN |
| overview 项目概览 | B4 / front | `views/overview.tsx`(488) | projects+tasks+milestones+risk_issues+meetings/reports/deliverables 计数+settings | project-edit 抽屉 | 空态 | 新资料/日志联动按 B2；新增统计口径先核；1440/1024/768/390 浅深/200%/save-restart GUI |
| tasks 全部任务 | B1/B2 / front 视图 + data 持久 | `views/tasks.tsx`(1272) | tasks（+attachments[]/progressLog[] 随 task） | TaskForm 已接线（O3/O4/O5 补丁）；**O4 已修**：`panel.tsx` 原 formDirty 误写成 `!snapshotIsDirty`（干净时确认、改过反而不确认），现提取 `shouldConfirmDiscard` 纯函数（`shared/form-dirty.ts:60`）+ 4 组合测试（`form-dirty.test.ts:40-43`）；最终 run-20261020-092529:3194 实际 GUI 已出现「放弃未保存修改？」且未保存值保留 | 空态、busy disabled、错误提示、全局 stale | B2 UI 写（资料多选/链接/进展编辑卡）待接线 NOT_RUN；六态局部失败/重试/无结果 GUI；200%/拖缩 |
| gantt | B5 / planning | `views/gantt.tsx`(532) | tasks+milestones 派生（只读） | 拖拽只改起止（run），无独立写 | 空态、disabled、只读、陈旧字 | 真实跨度/依赖/关键路径/今天线/刻度；空/无数据引导；写未接明确禁用；GUI |
| milestones | B5 / planning | `views/milestones.tsx`(225) | milestones | MilestoneForm 接线 | 空态、disabled | 四态+achievedDate；禁用态不得原型假 disabled；长/密/空/错、save-restart GUI |
| risk-issues | B5 / planning | `views/risk-issues.tsx`(274) | risk_issues | RiskIssueForm 接线 | 空态、disabled | 全枚举 closed 不入矩阵；GUI |
| people | B5 / planning | `views/people.tsx`(507) | tasks+risk_issues+settings 派生 | **零写只读** | 空态、只读、加载字、stale 字 | 同 MAX 刻度派生、零写证明；不得出现写按钮；GUI |
| meetings | B6 / records slice（视图+CSS+tests），持久 data | `views/meetings.tsx`(309) | meetings | MeetingForm 接线（视图层） | 空态 | 行动项 4 态/draft·final；**backend API ready（selectedRefs 合同已交，panel+preview 已集成）**；records front 37/37 已 QA；GUI |
| reports | B6 / records slice + data | `views/reports.tsx`(329) | reports（snapshotAt+snapshot 冻结） | report 抽屉接线（视图层） | 空态、只读字 | **backend API ready，非 BLOCKED 合同；selectedRefs panel+preview 已集成，G 门待 Main 采证**；D1 跨项目/D2 软删/D3 互斥已修 QA 复验全拒；U5 report-type 枚举扩值（B6 New）；源改不改已存对照；GUI |
| deliverables | B6 / records slice + data | `views/deliverables.tsx`(284) | deliverables（+milestones/tasks 软引用） | DeliverableForm 接线（视图层） | 空态 | 负责人/版本/5态/仓库链接/只增变更史；**wrapped 状态分组已修（分组+筛选）**；`milestoneId` 关联/note 已实现（U5，跨项目/不存在拒绝、note 持久化清空）；真附件依赖 B3；GUI |
| okrs | B7 / growth 视觉（AI 投影需 data） | `views/okrs.tsx`(212)+`okr-form.tsx` | okrs（+settings inbox） | OkrForm 接线 | 空态、只读、disabled | draft→confirmed 仅人触发/单父/软关联；**B7 放行前 okrs/settings 可恢复 snapshot/回滚证据**；AI 只读投影不写；GUI |
| habits | B7 / growth 视觉 | `views/habits.tsx`(291)+`habit-form.tsx` | habits+okrs+settings | HabitForm 接线 | 空态、只读、disabled | 打卡/2天补记窗/确认/streak；周期调度预留不实现；备份回滚证据；GUI |

### 6.1 跨页横向缺口（B8 全量，不堆首批）
- **状态完备性**：除 tasks/people 有局部加载/stale 字，多数页仅空态+disabled；每页独立 loading/局部失败/permission-denied/无结果态待 B8 核；全局 stale 横幅不等于页内错误态。
- **视口/缩放**：1440/1024/768/390 × 浅深、200% 原生、鼠标拖缩、跨宽无横溢、save/restart 状态保留——全部 NOT_RUN，归 Main。
- **安全**：URL/XSS/file 注入、并发取消、非法协议拦截保输入、取消零写快照比对——B2/B3 门已列，GUI 待采。
- **备份恢复**：7 表+B3 文件包一致恢复演练；okrs/habits/settings 按各自 snapshot/export（B7 前置）；legacy 无 extra 不清空已 PASS（L1-L4）。
- **AI 边界**：copilot ALLOWED_OPS 无 delete/无 attachments·progressLog 写；新来源投影需 data owner，勿只划视觉。
- **真外依赖（非 PM 门、非待用户）**：U6 宿主主面板宽度契约、nav-rail-search 宿主侧；U2/U4/U5 均为路线内工程/实现项，非开放待决。

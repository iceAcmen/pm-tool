# A11 资料与固定报告独立有界审证

> 给 Main、负责人及独立测试接续者使用：只判 A11 已采材料修订、软删恢复及固定汇报子路径，不签完整 GUI。平台 trae，独立测试专家；任务日期 2026-10-21，实际审证 2026-10-22。Main 为原 GUI 采集者及唯一 builder。

## 1. 结论

**以下已采子范围有限 PASS；完整 RA-M01/03、RA-R01/03/05、RA-J04 及父总门仍 BLOCKED。没有按旧 rv2 oracle 新发产品缺陷，不改原报告、原记录或历史结果。**

| 子 ID / 原 ID | 独立结果与覆盖边界 |
| --- | --- |
| A13-M01-APPEND / RA-M01、RA-J04 | **有限 GUI/data PASS**：E1 三旧版保全、单层 draft 追加 rv4、一次主保存。没有修改基本字段/link 备注，不签原 M01 组合修改全步骤 |
| A13-M03-DELETE-RESTORE / RA-M03、RA-J04 | **有限 GUI/data PASS**：主保存软删→已删区回读→首次恢复主保存→重开四版历史；stable ID/E2/E3/资料保全。不签重复 restore/unknown，或软删时报告候选 |
| A13-R01-CURRENT-FREEZE / RA-R01、RA-J04 | **有限 GUI/data PASS**：实际周期 19..22，默认全选两当前候选 E3 rv1/E1 rv4、preview 零写→固定保存原 rpt-0002→详情。不是逐条取消/重勾选或历史 rv2 selectedRefs 成功 |
| A13-R03-SOURCE-APPEND / RA-R03、RA-J04 | **有限 GUI/data PASS**：正常主保存源追加 rv5/修订作者改为测试甲后，旧报告原文件完整同字节，重入详情仍 rv4。未做源再软删、export/重启 |
| A13-R05-PREVIEW-CANCEL / RA-R05 | **预览有限 GUI PASS；取消 DATA 有限 PASS**：标题/表格可见、危险协议与 script 原文显示且执行探针 false；取消段 22 项 data manifest 等值。末帧仍在预览、无取消终态图，**取消完整 GUI NOT_RUN**；未保存恶意 MD、未导出 |
| 编辑 source/period/frozen excerpts 只读补证 | 来源标签及原 source 输入只读接线、冻结摘录只读说明有证；两日期 disabled=true 属原 DOM 辅证，日期控件没有可见原 PNG，不签日期控件完整目视/尝试修改 |

局部绿不得填成整项 PASS、全部 GUI/样式/UX、提交或发布准入。session/export/invalid/其他 ops 尚缺，本专家不新开功能、不豁免剩余门、不转 MANUAL_PENDING。Main 新中文原生文件 `rawheaderinvalid`、文件/恢复及 A12 来源旅程均不属本审件。

## 2. 授权与方法

本次原句：“独立限定A11资料/固定报告已采子范围审证，不产品/GUI/build/services/credentials/commit。仅写docs/testing/a13-materials-report-gui-review-20261021前缀。”父 goalcontinue 保留 [既有全部收口原句](../../reports/all-pending-acceptance-execution-20261021.md#1-父任务与授权)，Main 唯一 GUI/builder，最终普通 commit 由 Main 另按总门执行，本专家不继承该动作。

已读 AGENTS、collaboration §9/11、[原余合同](remaining-journey-cases-20261021.md)、原材料专家 [计划](materials-files-reports-independent-auto-20261021-plan.md)、[报告](materials-files-reports-independent-auto-20261021.md)、[GUI交接](materials-files-reports-independent-auto-20261021-gui-handoff.md)与 [Oracle纠正](materials-files-reports-independent-auto-20261021-oracle-correction.md)。原余单 RA-J04/RA-R01 的 rv2 要求与纠正冲突时，按有效 current/stale 合同分路；active 重复 restore 成功也不是已生效要求。

只读指定归档、F5 原备份、允许 start.json 与 candidate 所列冻结文件；仅写本前缀。不 fetch/pull/install，不跑产品 build/verify，不启停服务、不操作 GUI、不读凭据、不改业务数据/livingdocs/其他专家产物、不 commit/push。仓库 dirty 成果保留。

原 PNG 和连续帧为目视依据，原 run/done、wrapper JSON、manifest 为写入依据；hash/DOM/HTTP仅辅助。[审证计划](a13-materials-report-gui-review-20261021-plan.md)、[1390输入冻结](a13-materials-report-gui-review-20261021-selftmp/inputs.json)、[机械审计](a13-materials-report-gui-review-20261021-selftmp/audit.json)可复核。联系表只缩放解码原图，不是生成新实测。

## 3. A11 身份与合法初态

| 层 | 本轮核对 |
| --- | --- |
| 基线/dirty patch | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；patch SHA `6e09d16e991120ec21a3e88bf26bd4a3e93e6d432e5c1941e53c79ce9d5312fd`，不以 HEAD 单独代表候选 |
| 冻结/build | candidate、sync、artifacts 一致；511 源与 453 产物匹配，postDrift=[]；本专家未构建 |
| 实际实例原件 | materials3226/PID32661，start=`2026-10-21T16:30:44.777Z`，插件解析 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool`；只核原 start，不声称实时健康 |
| 宿主 | `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`，candidate/start一致，不借此重签上游权限 |
| client/实际下发 | client SHA `279d952a9652eb2dd075c9b449bb0201184c90fe27da3dde94e86efbd8d62219`；loaded-r2 完整 2575876bytes、200/uncached、响应 SHA `47d0dda7ee578570218b6890b7bbaeca887ad936bf36a075db9548074602f7c2` |
| 完整唯一片段 | 归一化源加宿主原尾注，1697044bytes、first875361/second=-1，SHA `7c4818aef0d6132a3157fcb2c2f4879edc72234e8c678ccb93187bbe0bff87f4`；非关键词命中、非 combo 等于 client |
| 页上下文 | 13 状态记录同 origin3226/timeOrigin=`1792600688705.2`，1440×900、dark、DPR2；loaded-r2 pilot=off/PM mounted。DPR/帧 pageScale 不证明原生100%或200% |
| 当前主树/其他在途 | audit时仅 `src/client/provenance-panel.tsx` 差异；final时另有 `src/core/http/asset-route.ts`、`asset-route.test.ts`、`src/client/shared/stage-client.ts`、`stage-client.test.ts`，共五项。A11冻结树/产物不变；只签A11，不继承到A12或新增文件上传修复 |

seed 指向原专家 fiKpOr/F5，备份 SHA `8f9bf659a59077af3753900b9fec43dbca752673e59516d025f649a1982f8b4c`；初始原 t-0001 record 与合法备份逐字段一致。E1=pl-1/rv1..3 active；E2=pl-2/两版/deletedAt；E3=pl-3/rv1 active；at-1..4 原样。不是将不同 F3 包的碰号 ID 混进同一库。

seed 首预检只宿主 session hash 变化，files/backups不变；不称全根零写。后续分段 manifest 均独立核。原 UTC10/21 与本地10/22分列，不改时钟或历史。

## 4. 原记录与命令链

### 4.1 主保存修订、软删与恢复

`progress-journey` 12原事件/6对 run-done，seq253..264：三次 `pm task update t-0001` 各跟一 snapshot，全部 success。写 cmd 尾号126/128/130，draft只有单层 progressOps、单条 edit/delete/restore；无 raw attachments/progressLog 覆盖。三个 snapshot record 与各次原磁盘 wrapper.record 完全相同。

| 原文件检查点 | SHA256 / 不变量 |
| --- | --- |
| initial、revision-before、revision-draft | `ce1565dc6a39d5e3236448f58feb3319f90d2ac4c16b865b4a0490edf477fae9`；draft原文件与21项manifest零写 |
| rv4主save | `f010044e5db304a6c6c7561c07dc484acb1100d1da4a11b4b0f6060410111607`；rv1..3全字段不变，仅append rv4=`E1 rv4正文，A11真实主保存`/测试乙/2026-10-21 |
| softdelete主save | `b8d751089bf9ff83003c545390215ae24a5325cade09553187f990ac29d1c79a`；仅E1 deletedAt=`2026-10-21T20:36:14.446Z`与task updatedAt变化，四版全留 |
| restore主save/final | `b49b1b5bbfcc3ed0b88a2889c5bd3b0919a897bc652eae3f36db2ee08d81669a`；E1清deletedAt、与rv4后条目完全同，历史未重排/重写 |

每步data差异仅 `/pmtool/tasks/t-0001.json`；at-1..4/E2全部含deletedAt/E3逐字段不变，legacy evidenceUrl/deliverableId 保留。首次保存补 `manualProgress:null` 为可空表示，基本字段实际未改，不假称“basic+link备注一并修改”。

73帧逐格目视显示：打开旧三版→填写修订→“保存修订”仅入draft→主保存关闭→重开→软删draft→主保存→重开已删除区（四版保留）→恢复draft→主保存→重开历史显示rv1..4。[历史原图](../../reports/all-pending-evidence-20261021/A11/materials/progress-journey/history-reopened.png)和 [恢复前原图](../../reports/all-pending-evidence-20261021/A11/materials/progress-journey/restore-draft.png)支持同实体回读。没有证据要求物理删除或新增成功幂等；本专家没有改保存 RAW、已软删/恢复历史。

### 4.2 当前候选固定保存

`fixed-report` 8原事件/4对，seq265..272：cmd132真实 `pm report generate p-0001 2026-10-19 2026-10-22`，selectedRefs 按 E3rv1、E1rv4 顺序；随后三个 snapshot reports 的 rpt-0002 与原记录完全同。原 before=preview（21项），save后只新增rpt-0002。

两摘录严格三元组 `t-0001/pl-3/rv-1`、`t-0001/pl-1/rv-4`，内容/作者/日期与当时当前修订一致；ex-1/ex-2 capturedAt与snapshotAt同。源entry E1外层author/date仍旧值，摘录正确取当前rv4的测试乙/2026-10-21，不拿外层字段替代。

16帧及 [候选](../../reports/all-pending-evidence-20261021/A11/materials/fixed-report/candidates.png)、[详情](../../reports/all-pending-evidence-20261021/A11/materials/fixed-report/detail.png)原图显示实际19..22、默认已选2/2、保存关闭、手动来源和两冻结摘录。候选图第二行部分在footer下，完整DOM/原载荷/保存后原画面共同核对，不据该单图签整表单布局。E2/QA-B未列；不签主动跨项目/软删/旧版拒绝GUI或独立单选操作。

### 4.3 源追加rv5与旧报告重入

`report-freeze-reentry` 4原事件/2对，seq273..276：cmd136主save E1 edit=`E1 rv5正文，不得改旧汇报`/测试甲/2026-10-21，cmd137 snapshot同时含源rv5和原rpt-0002。rv1..4原样，E2/E3/attachments仍全保。

固定报告原 `rpt-0002.json`、before-report、after-source-report 三原文件 SHA 同：
`639f8d1e0126e9348fb457671c7c50c7366ae98158bd8e5d01f9d287ab98a747`。不只是摘录同：snapshot、snapshotAt、来源、正文、ID、createdAt/updatedAt全部原字节不变。source前后data只t-0001变；原报告没有随源抓rv5。

52帧逐格目视确认正常改源主保存→回汇报→原rv4详情；中间误开生成抽屉随即关闭，再正确打开编辑，未新增第三报告。原 [旧报告重入图](../../reports/all-pending-evidence-20261021/A11/materials/report-freeze-reentry/old-fixed-report-reopened.png)仍显示rv4/测试乙，与源rv5/测试甲区分。是正常写通道实证，不是手改JSON造freeze。

### 4.4 安全预览、只读与取消边界

原 [safe-preview.png](../../reports/all-pending-evidence-20261021/A11/materials/report-freeze-reentry/safe-preview.png)显示标题/表格，`[危险协议](javascript:alert(1))`及 `<script>window.__qa_report_executed=true</script>` 按原文显示，未成为执行脚本；原执行探针 executed=false、无alert原观察。仅此输入与该次预览，不签协议攻击全集或点击危险链接实测。

原编辑 source 标签“来源（不可改）”、手动只读输入、冻结摘录标“只读保护，更新不覆盖”；冻结 `records-report-form.tsx` 的source readOnly/disabled接线相符。原 readonly-source.json 两日期 disabled=true，日期控件未在原PNG中可见，故只记DOM支持，不伪称日期目视/改值操作完成。

cancelBefore=after的22项data清单相同，report SHA仍原值，四事件仅此前改源/snapshot，无report update。**最后000051帧仍在预览，未归档取消后关闭图/完整动作，因此取消DATA零写可签、取消GUI不签**。不以清单或采集者文字替代缺失终态；没有安全MD保存/重开、export、覆盖拒绝及confirm。

## 5. 继承、验证与释放

原材料专家末轮九个直接相关源指纹与A11同：task/tasks/task-materials/progress-reports、commands material/task、draft-materials、report-form、reports；仅继承其对应 AUTO 守卫支持，不重新宣称执行。`client/views/tasks.tsx` 与旧材料轮已变，旧全页GUI不存在，也不以相同domain覆盖当前GUI；本次主保存实证重新链接。完整源/产物终核及九指纹列表见 [final.json](a13-materials-report-gui-review-20261021-selftmp/final.json)。

运行环境macOS/bash、Node `v22.23.3`；项目约定pnpm `11.28.5`（本专家未运行）。仓库根执行：

```sh
node docs/testing/a13-materials-report-gui-review-20261021-audit.mjs audit
swift -Onone \
  -module-cache-path docs/testing/a13-materials-report-gui-review-20261021-selftmp/swift-cache \
  docs/testing/a13-materials-report-gui-review-20261021-contact.swift
node docs/testing/a13-materials-report-gui-review-20261021-audit.mjs final
```

| 命令/执行层 | 实际结果 |
| --- | --- |
| 本专家 audit | exit0；1390输入、511源/453产物、141帧SHA、原wrapper/命令/snapshot/各data边界一致；机械绿不是GUI签字 |
| 本专家 Swift 本地解码 | exit0/outputComplete；15联系表，73+16+52=141原帧及7+3+3=13状态图均目视，关键原图另放大。只索引原图、不操作应用 |
| 本专家 final | exit0；`2026-10-21T20:53:54.949Z`，1390输入内容/mtime、511源/453产物零漂移，九旧源一致、missingLinks=[]；310个自有输出指纹登记，主树五项在途差异单列 |
| Main 原 noEmit/build/coverage | 仅读既有exit均0：`pnpm exec tsc --noEmit`、`pnpm run build`、`pnpm exec vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache`；原142files/1329tests，不是本专家运行或全门放行 |

只读摘要首试误把pm对象当字符串 `.slice` 出 TypeError、exit1，改用对象读取后exit0，无写入，不是产品失败；rg缺失已换现有工具，记忆指定路径不存在，仓库规则为准。未跑产品完整回归/全部verify，未读取活跃数据/凭据或实时探服务。

本前缀 `git diff --check` exit0；本轮 Swift 执行记录明确 exited/exitCode0/outputComplete=true，末 `pgrep` 精确自有Swift签名 exit1/空输出，没有遗留审证进程。正式/隔离服务均未操作。

终核只覆盖列入输入的归档/fixture/start/冻结源/产物，不称全机、全部业务根零污染。剩余 session、导出/覆盖、非法输入/refs拒绝、其他ops组合、重复恢复、失败重试/并发、软删后汇报候选/旧报告、完整原生缩放/矩阵/读屏仍由 Main 按原合同采证，专家审签；不要求本人代做Main可做项。

本角色完成有限审证后释放，不持有GUI/build/服务资源、不commit/push；父goalcontinue全部收口尚未完成，Main继续既定积压与最终普通提交，不以本报告提前关闭总门。

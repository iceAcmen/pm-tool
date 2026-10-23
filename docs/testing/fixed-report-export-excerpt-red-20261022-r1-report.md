# 固定汇报摘录导出独立 RED 报告

> 本文记录 MRR-R05-EXPORT-EXCERPTS 的独立测试先行结果，给 Main 与另一开发角色接续；只判该有限 RED，不改产品、不执行 GUI、不签 RA-J04/R05 整旅程、整域或 commit。2026-10-22，trae。

## 1. 结论

**必要 RED 成立，release STOP。** 最终单文件 13 项实际执行：**7 个控制通过，6 个必要 RED 失败，无 skipped/pending，Vitest 与执行器均 exit 1**。不等整域验收完成。

直接生产 `renderProgressReportMarkdown()` 和真实 `handleProgressReportCommand('export …') → exportProgressReportMarkdown() → writeExportFile()` 都遗漏 `record.excerpts`。真实 JSON 中两冻结摘录已正确生成，源随后追加修订、改作者/日期/正文并软删两条后，报告 raw 全字节不变；真实导出仍没有旧正文及完整来源。不是生成失败、JSON 资料丢失或调用了不存在的新出口。

未使用当前 Markdown 作为 oracle；值来自原合同与独立合法 seed。前后 MD 相等只作稳定性控制，不能代替字段完整性。选当时 current 的 `rv-3`，不改变历史修订选择的冲突规则。

## 2. 授权与候选

授权原句、角色/写面、停止条件及已批准合同见[先行计划 §1–2](fixed-report-export-excerpt-red-20261022-r1-plan.md)。已读 AGENTS、collaboration §9/§11、当前交接/livingdocs、原 journey RA-J04/RA-R03..05、[原有限 GUI FAIL §1/§3.3](material-meeting-report-gui-review-20261022-r1.md)。本件不写 livingdocs 或他人 testing，不加载 vendor，不执行通用开工 fetch/install/build/全回归。

| 项目 | 绑定 |
| --- | --- |
| 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` |
| 父候选 | `CombinedRepairR1/r2`，107 去重声明、515 包输入，Main 唯一整包 builder |
| 冻结参考 | `/private/tmp/pmtool-combined-repair-20261022-r2`；本件不写它，也不重构建 |
| 实际源码引用 | 主树 TypeScript；515 输入与107声明逐哈希匹配上述冻结 manifest，运行前/后及 close 无差异 |
| 本件唯一源码增量 | `packages/dsh-pm-tool/src/core/report-export-excerpts.test.ts`，SHA256 `c777b88dc003414f483a0c2f4360b845483d0a662710d9a43f351405027bbe8a`，**单独认领，不冒原107已验** |
| 最终原证 | [run-rtV1dy](../../reports/all-pending-evidence-20261021/ReportExportRedR1/run-rtV1dy/summary.json)，[绑定](../../reports/all-pending-evidence-20261021/ReportExportRedR1/run-rtV1dy/binding.json)、tracked diff/新增清单及命令 exit 同目录 |
| 源快照 | 最终 run 保存 `test-source.ts.txt`、`config-source.mjs.txt`、`runner-source.mjs.txt`，与实际执行字节一致 |
| 运行实例 | 不启动宿主，不探活或使用3260/正式服务；本件是生产函数/命令处理器+真实本地 JSON/文件 AUTO，不是宿主路由/GUI |

原 `MaterialRemainingR1/57-fixed-export.md` 的1415 byte/SHA与原 rpt-0002 信封仅作缺陷来源绑定，未把原 MD 当期望模板，未覆盖原封包。父整回归审证 `combined_repair_full_regression_review_r1` 与3260 GUI仍归原 owner，在途任务不重跑、不重复派。

## 3. Fixture 与测试路径

真实 Context、Storage、JsonStorageBackend、DomainFacility 打开 `run-rtV1dy/tmp/<case>/data` 的 pmtool 领域，复用真实 `pmDomainSpec`。

1. 生产 `addProject/addTask/progressAppend/progressEditRevision/progressSoftDelete` 建合法项目与 `t-0001`。E1 从rv1经两次edit得到rv3；E2未选且软删；E3为rv1。另建同项目 `t-0002/pl-1` 撞号进展，正文 `OTHER_TASK_BODY`。
2. 真实 report generate 先建无摘录 rpt-0001，再以 selectedRefs 生成 rpt-0002。selectedRefs/excerpts 不同传。两摘录期望逐字段核对：

| task/entry/rev | 作者 | 日期 | 冻结正文 |
| --- | --- | --- | --- |
| t-0001/pl-3/rv-1 | 测试乙 | 2026-10-19 | E3 rv1同日异ID |
| t-0001/pl-1/rv-3 | 测试甲 | 2026-10-21 | E1 rv3正文 |

3. R02 manual/session 分别在源变更前真实 export 一次；之后生产 edit 改两条的作者/日期/正文，E1追加rv4、E3追加rv2，再软删两条。全部旧 revisions 保留、报告 raw 全字节不变。
4. 源变更后再次真实 export 到不同相对子目录；原文件/新文件与领域 JSON实际回读。以冻结六字段完整性、正文仅一次、无新源/未选正文判断内容，不只比前后 MD。
5. R01 各只传一条冻结摘录给生产 render，检查六字段及不得错配另一条来源/作者/日期/正文，不固定新标题、段落或格式。
6. R03 另一个合法 frozen body 含多行、管道/反斜线、表格、围栏 JSON、script 原文字与危险协议。实际 render/export 的内容不能整体丢失；消费生产 Markdown AST 验证协议链接与节点种类。不执行script、不使用DOM/GUI代用品。

每次 beforeEach 分配自有独立根，afterEach `Domain.close()`；所有领域/导出/日志与 Vite/Vitest cache 均在本件证据根。正常 export 逐次核 **所有领域 JSON** 不变，不只是 rpt-0002。

## 4. 最终逐项结果

| 用例 | 预期 | 实际 |
| --- | --- | --- |
| C01 | 真生成两 current，改源/软删保旧修订与报告字节 | **通过**；源确实变，报告字节/字段全保 |
| C02 manual/session，2项 | 来源准确，pure render 不改输入且确定 | **2通过**；手工/null、会话/完整session ID |
| C03 missing/empty，2项 | 无摘录旧形状可render且实际export；不回填来源/快照/摘录 | **2通过**；纯归一缺source键不物理改，实际命令无摘录/空数组正常写MD，所有领域JSON不变 |
| C04 | 真export、默认拒覆盖、confirm同字节覆盖、0600、无tmp残留 | **通过**；来源仍session，原记录与源未写 |
| C05 | 真命令绝对/~ /越界三负例零导出目录写 | **通过**；三次kind=error，报告JSON不变；生产catch原日志保留 |
| R01 两单条render，2项 | 每条task/entry/rev、author/date/body齐全 | **2必要 RED**；各缺6字段 |
| R02 manual/session，2项 | 真export在源改/软删后两条旧摘录/来源齐全 | **2必要 RED**；各缺11字段字符串，两条正文及ID/作者均无 |
| R03 render/command，2项 | 复杂body安全降级不整体丢弃 | **2必要 RED**；9个独特正文/链接文字标记均无 |

R02只有11项而非12项，因为周期头本来含 `2026-10-19`，不能把它算作摘录日期展示通过；R01的周期头不含两摘录日期，分别精确证实两条日期也缺失。R03虽执行了安全AST断言且未出现危险href，该MD本来缺摘录，**不据空安全结果签修后或完整安全门**。

实际主要错误原文：

```text
导出须含每条冻结 task/entry/rev、作者、日期、正文:
expected [ …(6) ] to deeply equal []          # R01
expected [ …(11) ] to deeply equal []         # R02
安全降级不得把整条复杂摘录丢弃:
expected [ 'SAFE_EXCERPT_START', …(8) ] to deeply equal []  # R03
```

完整缺项、堆栈与每用例错误不截断归档于 [vitest.stderr.txt](../../reports/all-pending-evidence-20261021/ReportExportRedR1/run-rtV1dy/vitest.stderr.txt)、[vitest.result.json](../../reports/all-pending-evidence-20261021/ReportExportRedR1/run-rtV1dy/vitest.result.json) 与 summary。初末合法数据库、冻结前/源变后状态、commands.jsonl、真实MD与export-observation在各case下。

R02 manual 的真实文件915 byte、session为942 byte；与原GUI1415 byte不同，因为是独立最小fixture，不冒原GUI复验。manual根 `tmp/report-export-excerpts-Bynr2S`，session根 `tmp/report-export-excerpts-NwrMRL`；两根各before/after源变更导出同SHA，缺11项仍RED。具体JSON/MD SHA见 [close-r1.json](../../reports/all-pending-evidence-20261021/ReportExportRedR1/close-r1.json)。

## 5. 命令、首轮设施失败与保护

实际环境 macOS/bash、Node **v22.23.3**、现有 Vitest **2.1.9**。pnpm **11.28.5**仅引用项目环境，未调用。未build/install/noEmit/coverage、未跑verify或父整回归、未Git写/服务动作/GUI/网络/模型。

仓库根实际执行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpt-red-20261022-r1-run.mjs
# 三轮：run-cd8PO9 / run-cKdR56 / run-rtV1dy

/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpt-red-20261022-r1-close.mjs
# exit 0，只做原证/绑定核对，不是产品PASS

/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/fixed-report-export-excerpt-red-20261022-r1-config.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/fixed-report-export-excerpt-red-20261022-r1-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/fixed-report-export-excerpt-red-20261022-r1-close.mjs
# 三项均 exit 0，仅自有执行设施语法检查，不是 noEmit 或产品构建
```

执行器的实际子命令为 Node运行 `packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config <自有config>`，cwd为插件包；`REPORT_EXPORT_RED_TMP/CACHE/RESULT` 均由执行器指到本轮根，单fork、仅本test。每轮 `vitest.command.json` 保存 argv、cwd、start/end、exit、signal、config hash；只读Git `rev-parse/diff/ls-files` 的exit均0，结果保在同目录。

| 轮次 | Vitest / 外层exit | 结果与性质 |
| --- | --- | --- |
| run-cd8PO9 | 1 / 2 | 0通过/13失败；**本角色设施失败** `TypeError: active.ctx.dispose is not a function` 污染全部afterEach，不接受作合格产品RED。底层内容失败也保原，但不先宣布7绿 |
| run-cKdR56 | 1 / 1 | 修自有清理为Domain.close并完善真旧报告export，7通过/6必要红，保护漂移0 |
| run-rtV1dy | 1 / 1 | 最终单条来源防错配、真源变更前后export与源码快照归档；7通过/6必要红，无挂起/跳过，保护漂移0 |
| close-r1 | 0 | 96声明原件全SHA/bytes匹配，test实际字节=归档字节，sourceNowDifferences=[]；不判产品绿 |

首轮 `cache.dir` deprecated警告保，后续只用自有cacheDir；C05三条预期ExportIsolationError原stderr保，不说“零日志”。探路阶段 `rg` 不可用exit127、猜测 `commands/report.ts` 等不存在exit1均为读取设施/路径纠正，实际生产命令在 `commands/progress-report.ts`，不计产品FAIL。配置、测试设施的修正没有改产品。

运行保护：515包输入+107声明（去重）+本test与主树lib逐文件前后对比，**drift=[]**；close再次核源码无变。不读取正式data/profile/vendor/key，故不冒正式全盘资产核验。未删除临时数据库、MD、旧失败或他人成果；本件全部自有产物保留。未冻结Main、未重写旧CombinedRepair/MaterialRemaining封包。

## 6. 给 Main 的最小开发建议

**建议最小业务文件只有 `packages/dsh-pm-tool/src/core/progress-report-markdown.ts`。** 根因证据：该函数13–76行枚举摘要/快照/事件/异常后返回，**没有读取 `report.excerpts`**。`export.ts` 800–810行已经正确读取固定报告、调用同一renderer并写MD；`commands/progress-report.ts` 284–305行已有原export/confirm接线；控制组证明生成和冻结数据链可用。无需先动schema、存储、selectedRefs、源删除逻辑或新增导出类型。

开发建议（不是本角色执行/授权扩大）：

1. 在既有MD渲染中消费 **已存** `report.excerpts`，带两冻结正文、task/entry/rev、作者与日期；不查询当前task/progressLog，不因源软删而过滤冻结摘录。
2. 延续既有Markdown安全/转义纪律并保复杂正文文字，不以丢摘录“实现安全”。缺键/空数组兼容，不回填旧快照/来源，不规定新的出口、格式或版式。
3. 开发用本13项转绿后，交**另一独立角色**复验；受影响旧来源/Markdown/报告/导出专项由Main按当前候选另安排。本件不改产品后自验。
4. Main认领实际新修增量并安排唯一build及必要新GUI审证。原combined回归已封包仍是107输入，不撤销其不受影响结论，也不能拿它证明后来的renderer/test增量已验。原在途GUI与报告余项仍归owner。

## 7. 边界与交接

未完整GUI、样式/UX、安全外部Markdown阅读器、宿主路由、全量历史v1导入/恢复、整包回归；不把AUTO代替GUI。实际旧报告compat命令覆盖当前schema的缺excerpts/空数组，缺source字段的旧形状只测纯读取归一、不声称物理旧库重开全门。

本件源码只新增/修正指定test；文档只本前缀plan/config/run/close/report；原证仅ReportExportRedR1。最小开发根因建议与有限RED交Main登记，不签整域/父任务/commit，不push/tag/release/正式切换。**资源释放，release STOP。**

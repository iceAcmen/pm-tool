# 固定汇报摘录导出独立 SOURCE/AUTO 复验 R1

> 2026-10-22，trae，不同独立复验专家，非开发、非 GUI。授权及执行步骤见[本件计划](fixed-report-export-excerpts-independent-retest-20261022-r1-plan.md)。仅写本前缀与 `ReportExportRetestR1`，不改业务、原test、他人testing、livingdocs、Git或service。

## 1. 结论与发现

**FAIL_SOURCE_AUTO_LIMITED，release STOP。** 原13项及受影响54项可有限签 PASS，但新增 renderer 的合法长作者边界有一个确证产品红，不能把本门写成全绿或给 Main 后继构建通过准入。GUI、父goal、普通commit均不由本件签。

**RER1-SOURCE-01 / P2：合法冻结来源字段使整个 renderer 抛 RangeError。**

- 位置：`packages/dsh-pm-tool/src/core/progress-report-markdown.ts:85`，新补丁 `Math.max(3, ...Array.from(frozen.matchAll(...)))`。
- `frozenExcerptSchema.author` 和任务进展作者没有长度上限。自有合法种子作者为 `AUTHOR_START ` + `` `x `` 重复150000次 + ` AUTHOR_END`，总300024字符；正文仍是合法原短摘录。真实 `progressReportRecordSchema.parse()` 接受完整报告。
- 冻结真实生产 renderer 随后抛 **`RangeError: Maximum call stack size exceeded`**，堆栈精确指向本件冻结的 `progress-report-markdown.ts:85:37`。大量匹配段被spread为函数参数，不是递归、无效fixture或测试设施异常。
- 1项实际执行/1失败/0跳过，Vitest与 `test-r2` 外层exit1。[完整输入与原异常](../../reports/all-pending-evidence-20261021/ReportExportRetestR1/runs/stress/observations/author-stress.json)、[命令](../../reports/all-pending-evidence-20261021/ReportExportRetestR1/runs/stress/command.json)、[stderr](../../reports/all-pending-evidence-20261021/ReportExportRetestR1/runs/stress/stderr.txt)、[原独立用例](fixed-report-export-excerpts-independent-retest-20261022-r1-stress.test.ts)均保留。
- 本红是**真实schema + 真实renderer**，不冒“巨大作者已走真实export命令”。原正常manual/session的真实生成、源改/软删、export路径另已实测。
- 最小开发范围仍仅该renderer：迭代匹配求最大围栏长度，避免spread匹配数组。无需扩大schema/存储/命令/UI或新增作者截断规则。本角色不实施修复、不另spawn。

原遗漏冻结摘录的6红已在本候选转绿，不撤销其有限事实；新P2不默认豁免。原GUI FAIL仍是旧实例上的有效历史失败，等待后继GUI原证，不由本AUTO注销。

## 2. 精确候选与独立性

原依据：[闭环计划](../plans/2026-10-22-fixed-report-export-excerpts-closure.md)、[原RED](fixed-report-export-excerpt-red-20261022-r1-report.md)、[有限GUI FAIL](material-meeting-report-gui-review-20261022-r1.md)、[开发释放](../../reports/all-pending-evidence-20261021/ReportExportDevR1/report.md)。按本次明确动作/范围，不执行通用fetch/install/build/全verify/Git提交/livingdocs规则。

| 绑定 | 实际 |
| --- | --- |
| Git基线，运行前/close只读复核 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` |
| 父候选 | `CombinedRepairR1/r2`：107声明、515包输入，Main唯一整包builder |
| “108”准确口径 | 原107声明 + 原独立test = **108继承子集**；原107不含未改过的renderer |
| 本次完整后继声明 | 上述108 + 本次renderer = **109**；本件不改父107原manifest |
| 完整自有冻结 | 516包输入 + 15 Launcher声明 = **531文件**，逐bytes/SHA核对，非整包测试数量 |
| 唯一相对父业务差异 | renderer **+15/-1**；3721byte/SHA `8ddea982eac50078f999acfec17910f01687737dd200c00413abd7df32f575de` →4428byte/SHA `6ee3daf16d5572ea74a69b4b42b3a25ab3c1a03693e80ff07f8b258fb69edcac` |
| 原独立test，不改oracle | 16703byte/SHA `c777b88dc003414f483a0c2f4360b845483d0a662710d9a43f351405027bbe8a` |
| exactpatch，与开发raw-WGSqdt逐字节相同 | 1881byte/SHA `9acf99590a6007f4a3aa12b61695db0d949a64470004080c66a0d068cef06cf7` |
| 自有证据/冻结根 | `reports/all-pending-evidence-20261021/ReportExportRetestR1/frozen/`，不是Git worktree |
| 依赖 | 父r2既有node_modules复制13579文件/1030软链；逐字节相同、共享inode=0、外部软链=0 |
| 实际执行 | 自有冻结TS + 自有依赖/cache/tmp；无共享lib、无宿主/浏览器/3260装载认领 |

[candidate.json](../../reports/all-pending-evidence-20261021/ReportExportRetestR1/candidate.json)完整包含108/109清单、531冻结文件与516包输入逐指纹、父差异、其他新文件清单；tracked diff/新增清单/index diff/HEAD命令原件在 `prepare/`。依赖来源是父r2冻结树，不安装，不硬链，不链接回主树或上游。

## 3. 有限通过项

| 原用例 | 结论与实际覆盖 |
| --- | --- |
| C01 | PASS，真生成两current摘录，源追加修订/改作者日期正文/软删，旧修订与报告raw全字节保 |
| C02 manual/session，2项 | PASS，来源/sourceSessionId准确，纯render输入不改且确定 |
| C03 missing/empty，2项 | PASS，旧形状读取及实际无摘录export，不回填来源/快照/摘录，领域JSON不改 |
| C04 | PASS，实际export/default拒覆盖/confirm同字节覆盖，0600，无tmp残留、原报告及源不改 |
| C05 | PASS，绝对/~ /越界三负例真实拒绝零导出写，原catch日志保，不称零stderr |
| R01 两单条，2项 | PASS，每条task/entry/rev、作者/日期/正文六字段齐全，不错配另一条 |
| R02 manual/session，2项 | PASS，真实生成→导出→源改/软删→再export，旧六字段完整、正文仅一次、无当前源/未选/撞号任务正文 |
| R03 render/command，2项 | PASS，原9复杂正文标记保留，生产安全AST不生成危险href，不改原oracle |
| 受影响5文件54项 | PASS，来源2/冻结报告14/隔离导出7/出站10/安全Markdown21；用例字节未改 |
| 独立补充6项 | PASS，missing/empty各覆盖manual/session，与归档修前renderer输出**全字节相等**；反引号段0/3/17/1800及多行作者中六字段字面保全，外围栏严格更长 |
| 自有noEmit | exit0，原tsconfig产品类型检查及归档旧renderer；不含test类型全门、不写lib |

直接审exactpatch：新增分支只消费保存的 `report.excerpts` 顺序与六字段，没有读当前任务、按软删过滤、存储写入或新出口。missing/empty不走新分支，旧输出由独立修前比较额外证明。复杂正文安全判断只到实际MD及现有AST；不称所有外部Markdown阅读器或GUI视觉都通过。

**真实命令回读见证：** [audit.json](../../reports/all-pending-evidence-20261021/ReportExportRetestR1/audit.json)保存两合法fixture、源变后全task、commands及报告raw指纹；原13逐次断言export前后**所有领域JSON**不变。

| R02自有case | 源改/软删前后MD | 报告JSON，前后字节保 |
| --- | --- | --- |
| `nFAiUt` manual | 1196byte，两次SHA `10792b55f43c629a6cdd07495dc60d47fcfbc1816aae395ea539d2c8ef861169` | SHA `413118182ee1f715bc73c175902af176efef21326565bf8dfd069b6304043575` |
| `u3KCDA` session | 1223byte，两次SHA `37057da5c39fd64559b7c0865b5d5b992e0d6736b67e68d77299e8b69f3b252e` | SHA `e7840725208f52fea856c7cbca28a65657c524f4e645b0e5a2914615b6400402` |

两case位于 `runs/raw/tmp/report-export-excerpts-<case>/`。冻结正文是 `E3 rv1同日异ID`/`E1 rv3正文`，三元组为`t-0001/pl-3/rv-1`与`t-0001/pl-1/rv-3`，作者测试乙/测试甲、日期2026-10-19/2026-10-21。不是以修前MD模板或只比前后相等替代内容oracle。

## 4. 全部执行与失败保真

运行环境：macOS/bash、直接使用nvm已有Node **v22.23.3**、冻结Vitest **2.1.9**/TypeScript **5.9.3**；pnpm11.28.5仅为项目约定，未调用。子命令的executable/argv/cwd/完整白名单env/PID/start/end/exit/signal在各 `command.json`，stdout/stderr/result不截断。

仓库根外层命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1-run.mjs prepare
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1-run.mjs test
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1-run.mjs test-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1-run.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1-run.mjs audit-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1-run.mjs close
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1-run.mjs seal
```

| 执行 | exit与性质 |
| --- | --- |
| prepare | 0，精确冻结/依赖复制，不是产品PASS |
| test | 外层1；raw13/13子0、affected53/54子1、probes5/6子1、noEmit子0 |
| test-r2 | 外层1；affected54/54子0、probes6/6子0、**stress0/1子1产品红** |
| audit | 1，本角色审计把实际行85误写86，断言失配；不是产品的新失败 |
| audit-r2 | 0，校正自有审计行号，审签**有限FAIL**；审计0不等产品全绿 |
| close | 0，保护/基线/index不变，释放；不是PASS |
| --check | 0，仅最终执行设施语法 |
| seal | 仅本件15321原证逐指纹与5文档封签，实际结果见自有 `seal.json`，不改变产品FAIL |

实际Vitest子命令为冻结Node运行 `frozen/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config <runs/<name>/config.mjs>`，cwd冻结包，单fork、仅列明测试、不coverage。noEmit为同一冻结环境运行 `node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false`。没有build、tsdown、verify全回归、install、网络或模型。

首轮两设施失败不洗绿：[affected原stderr](../../reports/all-pending-evidence-20261021/ReportExportRetestR1/runs/affected/stderr.txt)是本角色给全局环境添加 `DSH_PM_ISOLATED_ROOT`，导致原legacy出站test的自有TMPDIR绝对路径被正常拒；r2只去该全局开关，各隔离用例仍自行设置原开关，TMP/HOME/cache仍自有。原test不改。[probes原stderr](../../reports/all-pending-evidence-20261021/ReportExportRetestR1/runs/probes/stderr.txt)是1900反引号加其他正文超过2000字，schema正常拒；仅本件补充种子改1800，旧probe字节保在冻结的 `retest-probes.test.ts`，新probe另存 `retest-probes-r2.test.ts`。

初audit原脚本 `runner-audit.mjs`、初执行器 `runner-r1.mjs`、r2执行器 `runner-r2.mjs`与最终审计 `runner-audit-r2.mjs`都保。原RED首轮dispose设施失败0/13，后两轮7/13绿、6必要红/exit1，全部原件未改、未重跑。探路rg不可用exit127及首次write_stdin参数协议失配属于读工具设施纠正，不计产品失败，不改全局配置。

## 5. 保护、边界与 Main 接续

[close.json](../../reports/all-pending-evidence-20261021/ReportExportRetestR1/close.json)：531主树认领输入前后0新增/删除/变化；12保护对象下899文件（主旧lib、原RED全根/5文档、开发全根、原GUIFAIL、父3manifest）逐字节无漂移；依赖源无漂移；自有冻结除明确3个补充测试新增外没有变化。原归档renderer仅用于旧输出对比，非候选业务增量。全部同步子进程均已返回，PID/exit保，不操作service。

当前另外两合法新件 `src/client/task-predecessor-refs-dom.test.tsx`、`src/commands/ask-auth-feedback.test.ts`归其他owner；后者本运行期间新增。本件只记录，不冻结锁主树、不认领测试结论，也不报污染。Main应另行合并其有效声明，不能把本109直接当所有并行成果总候选。

不读取正式data/profile/key/vendor；不称全盘零污染或service健康。所有可写根只本前缀及自有ReportExportRetestR1；测试清理仅其自建临时根，不删除原失败或他人成果。未Git写/普通commit/push/tag/release/正式切换。

**Main后继：** 原13修复有限通过可保；本门因RER1-SOURCE-01不授后继构建通过准入。由开发只修renderer迭代求最大围栏，再由独立专家在新候选复验新增红及必要受影响项。精确绑定新renderer SHA与109声明/516输入及其他并行增量，不搬旧父107回归为新修证据。之后Main唯一新build/受影响回归/新GUI导出回读，再由相应独立专家审签。

3260/J03/ATF仍归Main旧107在途实例，本件没有启停、覆盖其产物或冒新renderer已装载。GUI/样式/UX/外部阅读器目视、巨大作者真实命令、整包运行回归、完整历史迁移恢复、父总门及commit均未由本件覆盖。原GUI摘录缺失仍等待后继原证；本报告不把任何BLOCKED转为MANUAL_PENDING。

**资源释放，release STOP。** 不重复spawn，不接管开发/GUI/Main的Git动作。

# 固定汇报摘录导出独立复验 R1 计划

> 2026-10-22，trae，不同独立 SOURCE/AUTO 专家，非开发、非 GUI。沿用父已批准修复计划；writing-plans 仅用于步骤化组织，不执行其通用 worktree/提交/再派单建议。

**目标：** 独立核单 renderer 的冻结摘录导出修复及必要受影响自动化门。

**架构：** 自有完整源码冻结、复制依赖，原 13 项逐字节不改 oracle；不使用共享 lib 或旧宿主。

**技术：** macOS/bash、nvm Node v22.23.3、既有 Vitest 2.1.9、TypeScript 5.9.3；不调用 pnpm。

## 授权

负责人本次原句：

> 父授权多角色/持续确证修复/全部验完普通commit，无push/tag/release/正式切换。你是不同独立SOURCE/AUTO复验专家，非开发非GUI。唯写 docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1*及自有ReportExportRetestR1；不动业务/test/他人testing/livingdocs/Git/service。
> 独立完整自有冻结/依赖/cache/tmp，测试原13（别改oracle）+必要受影响54/审exactpatch+类型可单noEmit自有不写共lib；仅新renderer消已存excerpts、source六字段、安全复杂markdown、missing/empty不改旧输出，truecommand冻结源改/软删后输出旧值。
> Main3260/107实例J03/ATF在途不冒新renderer；另前置checkboxred不同test可能并行新增，不锁全主也不把合法其他新件当污染。
> 禁build/install/全回归共享lib/GUI/services/key/vendor/正式data/Gitwrite，原红设施失败保。结果绑定精确基线+108候选/test/完整input/commands/exit/保护；SOURCE/AUTO只签本有限门不GUI/父goal/commit。结束releaseSTOP给Main后继可构建准入/准确差异，不重复spawn。

补充事实：闭环计划、原 RED/GUIFAIL、开发释放报告与 exactpatch 已读；原107声明实际不含 renderer，因此“原107+独立test=108”是继承子集，加本次 renderer 后完整改动声明应为109，不以文字108漏认领业务补丁。原515包输入含原 renderer，修后加test为516输入。

## 步骤与写面

1. 新增本前缀 `-run.mjs`，只写 `reports/all-pending-evidence-20261021/ReportExportRetestR1/`。保存基线、tracked diff、新文件列表、原107/515与后继108/109/516，逐哈希匹配；exactpatch SHA与修改前后源码留存。
2. `prepare`：复制上述完整输入与声明到自有 frozen，无Git worktree；既有 node_modules 独立字节复制，核共享inode/外链为0。只登记其他新test，不冒其已验或污染。
3. `test`：自有env/cache/tmp/data/export执行原13及原5文件54项。原test SHA必须等于 `c777b88dc003414f483a0c2f4360b845483d0a662710d9a43f351405027bbe8a`。补充独立探针核缺键/空数组与修前renderer全字节输出一致及字面围栏；不改原oracle。自有noEmit，无build、verify、coverage。
4. `audit`：逐项审原执行JSON与真实命令/业务JSON/MD回读，区分自动断言与独立审证，保首轮设施失败及原必要红；签有限 SOURCE/AUTO，不签GUI/父goal/commit。
5. `close`：核冻结源/依赖、主树已认领输入、主旧lib、原RED及开发原件不变；合法未认领新件单列。保存本件索引与资源release/STOP，Main唯一安排后继build和GUI。

执行环境为仓库根 macOS/bash，命令固定：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1-run.mjs prepare
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1-run.mjs test
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1-run.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpts-independent-retest-20261022-r1-run.mjs close
```

预期各exit0；若失败，原stdout/stderr/command保存，不覆盖失败轮、不修业务。报告只写本前缀 `-report.md`。不修改livingdocs/他人testing/Git/service，不读取key/vendor/正式data，不以本门代替后继整包回归、GUI或普通commit门。

## 执行状态

- 已完成：只读接手、原证/exactpatch、候选完整冻结与依赖独立性核对；`prepare` exit0。
- 已完成：原13全绿、受影响54重跑全绿、旧输出/围栏补充6全绿、自有noEmit exit0；首轮affected/probes各1设施失败原证保留。
- 已完成：作者字段未限长边界补充1项实际失败，合法schema接受300024字符/150000反引号段后renderer抛RangeError；不改原13 oracle。
- 已完成：`audit-r2` exit0，独立判定 `FAIL_SOURCE_AUTO_LIMITED`，不授Main后继构建通过门。初audit行号误写86导致exit1，仅修自有审计为实际85，旧脚本保。
- 已完成：运行保护close exit0，有限FAIL报告已交，release STOP；Main接单修单renderer迭代求最大围栏，再按独立门接续，不新增schema限制。
- 封签：执行器只核本件原证/文档，不重跑产品或spawn；实际退出码与结果以自有 `seal.json` 为准。

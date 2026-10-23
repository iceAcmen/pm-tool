# A9-F02 导入全行预检开发交回

> 给 Main 与独立测试专家使用：记录本角色最小修复、精确候选、同测试红绿、旧步骤失效与未覆盖边界。2026-10-21，平台 trae，开发角色；不作独立 PASS 或整包放行判定。

## 1. 授权与范围

负责人本次原句：

> 开发角色有界A9-F02全行预检修复。父持续修确证验完在途Main最后commit不push。只写packages/dsh-pm-tool/src/core/csv-import.ts及新/现同目录相关csv/import tests，必要commands/task.ts仅错误呈现且先报Main；reports/a10-import-preflight-developer-20261021*。不写client/tasks/panel/ui-feedback或其他business/testing/livingdocs，不build共享lib/sharedcache/GUI/service/credentials/commit。读AGENTS/collab、docs/testing/a9-existing-entries-independent-retest-20261021.md§4 A9F02+原selftmp/I10I11、docs/plans/2026-10-21-success-envelope-import-preflight-closure.md。先旧同测试红再修：preview与confirm使用同任务字段映射/现taskCreateSchema做全行预检，后行非法dueDate等可预判在任何addTask前拒并给行/字段；CSV/XLSX路径/网页共同planGridCsvImport/importTasksFromGrid，合法序列依旧addTask/层级/default/编号/percent，不新事务/IOfailure回滚/idempotentunknown提交/历史半写删除/schema/U4。2行首合法后2026-02-30 preview/confirm0；合法已有项目/树及原测试回归。自有tmp完整复制source+fixture repo层级，只读link/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules，私有cache no-cache/Node22，不install/sharedcache。交sourcehash/argvexit/红绿原日志/受影响与noemit/边界，释放。不要仅改期望日期oracle；已有guard拒绝应真正preflight。

已读 AGENTS/collaboration、指定计划、A9 §4/原冻结 I09-I11、现 schema/任务写入/命令链及当前接续。多角色 dirty 树不 fetch/pull/install/build；遵从本次有界合同，不写 livingdocs 或 testing。产品只改：

- `packages/dsh-pm-tool/src/core/csv-import.ts`：共享全行预检与行/字段错误。
- 新 `packages/dsh-pm-tool/src/core/csv-import.test.ts`：真实领域/JSON、公开网格与路径/内容命令测试。

`commands/task.ts` 未改，不需要报备追加写权；原 catch 已透传 `CsvImportError.message`。client/tasks/panel/ui-feedback、schema、其他业务源和原专家用例均未改。

## 2. 修复与候选

- preview 与 confirm 均调用私有 `preflightGridTasks`；复用现有 priority 大小写/回退、progress 百分号/钳制/缺省、status/assignee/date 映射和现 `taskCreateSchema.safeParse`，检查全部候选行并汇总坏行。
- 全行预检返回有效字段列表后才开始首条 `addTask`；不借逐行守卫的后行拒绝冒充预检。父 ID 由原 stack/真实 addTask 顺序产生，预检不伪造未来 ID；编号、领域关系和落盘仍由 addTask 负责。
- 错误例如 `第 3 行：dueDate：日期须为有效的 YYYY-MM-DD；dueDate：截止日期不得早于开始日期`。行号按传入网格计数、包含表头；无标题记录仍跳过，但不压缩其网格行号。CSV 原解析器对空白物理行/引号内换行的处理未变，不承诺物理文本行定位。
- 合法树/编号/默认/进度序列不变；没有新事务、I/O 回滚、未知提交结果去重、历史半写清理、新 schema 或 U4。

基线 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅为基线，不是 dirty 候选身份。自有冻结在 `reports/a10-import-preflight-developer-20261021-selftmp/{red,green}/repo/`，完整插件源码/脚本/配置，保持 repo 层级并复制原 F2/f2-backup 和引用合同。源379文件；排除依赖/lib/cache/data/coverage/.tmp/.verify-tmp，不复制真实数据。只读软链指定父 node_modules。

| 对象 | SHA256 |
| --- | --- |
| red 全 src 清单 | `a57d5c03baf0a0fb74f657d492cb480c951d916368555ad0c5e1868eb0a23cdb` |
| green 全 src 清单 | `fc8c55d5834fa7f613ed8fe2d314d55db299aa17a2f44661ea1bd8087186f389` |
| 新 csv-import.ts | `389c127aefb81fb08215512a168fd978928ec41e814faca2b6e6e26d066dabe5` |
| 新 csv-import.test.ts（红绿同字节） | `d31c5587c590aa01cab2efc550384c9c97b1577175861d7b5e05a98176d95d92` |
| 原 A9 独立 probe（红绿同字节） | `b324c45277badad8b01f7e90d59f4cf4ae936b979c1d6d2fe239a61c1e8b4f81` |
| 未改 commands/task.ts | `7f02fbd6daaac985958cb3ea789c7597c7b9e4f72307eeee72efa4713af4f63e` |

red→green 全 src 差异只有 `core/csv-import.ts`；主树认领两文件与 green 冻结字节一致。两轮各有 `freeze.json`、全包 tracked.patch、新文件清单/hash、依赖版本/hash、合同/fixture 指纹；不以 HEAD 替代这些认领。

## 3. 命令与结果

环境：macOS/bash、nvm Node `v22.23.3`、现有 pnpm `11.28.5` 依赖；Vitest `2.1.9`、React/renderer `18.3.1`。每轮 TMPDIR/XDG_CACHE_HOME/NODE_COMPILE_CACHE/DSH_HOME/文件根均在自有 round；Vitest `cache:false` + `--no-cache`，没有安装、写共享缓存或使用主树 lib。

全部实际命令从仓库根运行：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node reports/a10-import-preflight-developer-20261021-run.mjs freeze
node reports/a10-import-preflight-developer-20261021-run.mjs red-core
node reports/a10-import-preflight-developer-20261021-run.mjs red-original -t 'A9-I09|A9-I10|A9-I11'
node reports/a10-import-preflight-developer-20261021-run.mjs green-freeze
node reports/a10-import-preflight-developer-20261021-run.mjs green-core
node reports/a10-import-preflight-developer-20261021-run.mjs green-original -t 'A9-I09|A9-I10|A9-I11'
node reports/a10-import-preflight-developer-20261021-run.mjs green-noemit
node reports/a10-import-preflight-developer-20261021-run.mjs green-regression
node reports/a10-import-preflight-developer-20261021-run.mjs green-verify-csv
node reports/a10-import-preflight-developer-20261021-run.mjs green-verify-import-content
node reports/a10-import-preflight-developer-20261021-run.mjs green-verify-r12
node reports/a10-import-preflight-developer-20261021-run.mjs red-regression
node reports/a10-import-preflight-developer-20261021-run.mjs green-verify-importmd
node reports/a10-import-preflight-developer-20261021-summarize.mjs
node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
git diff --check -- packages/dsh-pm-tool/src/core/csv-import.ts
```

| 轮次 | 原 exit / 实测结果 |
| --- | --- |
| freeze / green-freeze | 0 / 0，完整 src 复制字节一致 |
| red-core → green-core | 1（9红/2绿）→ 0（11绿）；同 testHash |
| red-original | 1，I09两绿、I10/I11四红、其他12未运行 |
| green-original | **1**，I09/I11四绿、I10两条旧确认步骤失败、其他12未运行 |
| red-regression | 1，20文件203绿/9红；除新增9红外，所有旧测试原基线均绿 |
| green-regression | **1**，20文件211绿/1红；首行非法日期旧确认步骤失败 |
| green-noemit | 0，全复制产品 src `tsc --noEmit --incremental false`；包 tsconfig 排除测试，非 build |
| green-verify-csv | 0，原 CSV 解析/树/字段/坏表头/预览零写/新进程读回 |
| green-verify-import-content | 0，原 CSV/XLSX 内容/坏内容/类型/预览/树/新进程读回 |
| green-verify-r12 | 0，原 Markdown 导入/层级/编号/勾选/负例及检索统计控制 |
| green-verify-importmd | 0，原编辑清单/树/勾选/新进程读回 |
| summarize / external-skills 静态 / diff-check | 0 / 0 / 0；不是产品独立签字 |

原 verify 四脚本保持字节不变，使用本前缀私有 loader 将该冻结包内 lib 模块引用映射为 src，内存 TypeScript transpile，不落 lib。新进程通过 NODE_OPTIONS 继承同 SOURCE 设施；这些是 **SOURCE 脚本回归，不是打包产物回归**。Node loader ExperimentalWarning 保留。原脚本/loader hash、完整 argv/cwd/exit/signal、stdout/stderr 在各 round `execution.json`/原日志；采证完成不掩盖原 exit1。

证据总索引：[selftmp/evidence-index.json](a10-import-preflight-developer-20261021-selftmp/evidence-index.json)。逐断言、原 stdout/stderr/hash、原 A9 observations、冻结前后 WATCH 都在索引及各 round，不覆盖红轮。

## 4. 关键证据与旧步骤失效

新专项证明：两行首合法/后 `2026-02-30`，直接 preview/confirm 都以 CsvImportError 拒绝，真实 addTask 观察次数0，JSON 前后字节/记录一致。CSV/XLSX 两种路径与网页内容命令，preview + 两次 confirm 每次 error、行3/dueDate、重开零写；还覆盖首/后 startDate、首 dueDate、日期倒置、跳过无标题记录后行定位和两个坏日期字段。

合法控制证明：已有本项目根/子与跨项目任务不变，CSV路径/XLSX内容真实 confirm 创建4条，ID `t-0004..t-0007`、编号 `2/2.1/2.1.1/3`，三层/父ID、负责人、p0→P0、无效优先级回P1、80%/100%/0/空值、status/default 字段及JSON重开一致。原合法 I09 两格式 preview/cancel0→confirm2→snapshot/WBS/重开均绿；作者原 busy/取消/false/reject 的8项也绿。

**没有声称原回归全绿**：原 I10 的两个格式，以及作者 `tasks-import-confirm.test.tsx` 的首行非法日期例，均先上传非法文件再点“确认落盘”。新预检返回 `导入失败` 后，现未改 `tasks.tsx` 既有逻辑把 confirm 清空，按钮不存在。green 原日志为 `确认落盘: expected undefined to be truthy` / `Cannot read properties of undefined (reading 'props')`，不是后行半写再现；I11预览结果已正确error，I10未执行到confirm实态观察。

原测试字节、`2026-02-30` 和 zero-write oracle 一律未改。**交 Main/独立专家核定 I10 的步骤适配**：预览拒绝后的真实页面保错误/无确认/可取消；如需直接confirm/重试验证，由专家约定独立命令步骤，不能要求产品给非法计划保确认入口。开发新的真实命令 zero-write 证据只作补充，不替原 I10 签 PASS，不自行改专家用例或非认领 client 测试。

## 5. 保护、方法与释放

- 每轮冻结 src 前后不变；WATCH 主包 lib、主依赖 .vite/.cache、父依赖 .vite/.cache 五根的内容/mtime 前后均相同。只证明这些受监测根，不声称全机零污染或正式服务已探测。
- 未触真实数据/凭据/服务/GUI/上游；未 build、install、共享缓存、全量 verify、commit/push/tag/发布，也未删除任何历史半写记录。React 原 key warning 保留，不扩修。
- 已读 brainstorming/writing-plans，按已有目的/最小合同执行，不另写禁止目录计划、不做其中冲突的commit/worktree动作。vendor manifest 锁 `49dd158d1076134a641b33efb035946536778336`，verify-external-skills exit0核全部hash，`vendorIntegrityVerified=true`。taskKind=feature（可测修复）采用tdd，同例红后修；交付阶段按code-review标准/合同两轴本角色自查，无可用独立子代理工具，不冒称双代理review或独立PASS。项目要求的 addTask/JSON观测优先于vendor通用“避免内部调用次数断言”建议；仅spy真实实现，生产领域不mock。未跑setup/installer、不写home/global/vendor、不找缺失skill。
- 自查：共享 schema/映射、错误行定位、合法序列保持和范围符合合同；测试步骤失效仍是待独立核定项。没有以11绿抵销旧回归红或宣告交付门关闭。
- 本角色所有测试/类型检查子进程均已退出。产品两文件与私有证据均交回；**释放 csv-import.ts 与 csv-import.test.ts，不再写共享产品或等待 GUI**。

下一步由 Main/独立专家：核定失效步骤→新精确候选SOURCE/AUTO复验→Main唯一隔离build/全量回归与全部verify→按原LG05 GUI合同采证审签→父范围满足后Main统一commit，不push。此为父已有在途接续，不开新功能、不新增提交授权。

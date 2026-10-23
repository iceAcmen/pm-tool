# 后继114整回归独立审证 R1

> 2026-10-22，trae，不同独立整回归审证专家。Main 唯一 builder/GUI；本角色只读审证，不执行 Main 脚本或产品测试。只写本报告同名前缀文件。

## 有限裁决

**PASS_LIMITED_COMBINED_REGRESSION_EVIDENCE。**

仅签 `CombinedSuccessor114R1` 精确冻结候选的构建、产品 noEmit、普通全量、三组 DOM、原 stress/probes、默认95 verify、guard、设施来源、输入/产物/依赖字节保护及真实退出回执。终核 reader 九组核验通过，真实外层 exit0；不是引用 Main 的自判。

**GUI / 样式 / UX / B8 / 父全部目标 / 父 ordinarycommit 均 NOT_SIGNED_THIS_ROLE。** 本门没有产品测试失败，不等于没有归档或 reader 设施失败，也不等于零警告。旧112双前缀 GUI FAIL 不由本门升级或豁免。本角色 **released/STOP**。

## 授权与依据

负责人本轮原句关键范围：“父持续多角色验全部授权”“不同独立完整回归审证专家”“只docs/testing/combined-successor114-regression-review-20261022-r1*”“不业务/Git/browser/service/key/other testing/livingdocs/build/install/test重复执行”“不原执行任何Main script/test；只selfreader”“先审等待最后索引后终核”“source-count实核114不是featurecount”“done STOP”。

后续负责人明确新 `index-r1.json` 1687已封、8份外层收据与 guard/close 实际工具0可终核；首封 EISDIR exit1必须保留，新3264/PID10975与标准F5恢复由 Main/不同GUI专家继续，不属于本门。

依据：[AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md#十一深度复盘后的执行合同与证据规则adl-0572026-10-21)、[本轮计划](../plans/2026-10-22-successor114-prefix-regression.md)、[前缀独立5/250/noEmit](copilot-error-prefix-independent-retest-20261022-r1-report.md)、[旧112整回归报告](combined-successor112-regression-independent-review-20261022-r1-report.md)。本次限定分工不触发通用拉取、安装、测试、livingdocs同步或提交动作；不锁 Main 或并行 OP943 专家的写面。

## 精确对象

证据根：`reports/all-pending-evidence-20261021/CombinedSuccessor114R1/`。冻结：`/private/tmp/pmtool-combined-successor114-20261022-r1`，包目录为其 `packages/dsh-pm-tool`。

| 字段 | 独立核实 |
| --- | --- |
| 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；不能单以 HEAD 代表 dirty 候选 |
| version | `0.7.4`，仅身份字段，不冒新发布或宿主版本 |
| source 声明 | 实数 **114**：99包路径与15 launcher路径；不是114功能或114项业务修改 |
| 完整包输入 | 实数 **521**，逐普通文件 bytes/SHA核主包与冻结；不得将软链或缓存作为产品输入 |
| 相对112 | 原519输入只改 sidecar，新增 test/fixture 两项；原112声明只替 sidecar SHA，再增两声明；无删除 |
| 构建产物 | 独占冻结 lib **455** 条逐bytes核 [built-artifacts](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/built-artifacts.json)；不证明已装载 |
| 最终证据索引 | **1687条 = 1643普通文件 + 44 fixture软链**；不包含本角色selfinput，也不认领其他专家/livingdocs |

[source-files](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/source-files.json)、[complete-inputs](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/complete-inputs.json)、[tracked diff](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/tracked-product.diff)、[new files](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/new-product-files.txt)、[index-r1](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/index-r1.json)共同绑定候选。

| 本次变动 | bytes | SHA256 |
| --- | ---: | --- |
| `src/client/shared/drawers/sidecar-portal.tsx` | 45837 | `e2e9054e9ad0d7a7e9f3c0020760a2c48a8c477ae44af6b01c2a509e8e4204dc` |
| `src/client/copilot-error-prefix.test.tsx` | 4319 | `40aab2a19f34bb82a97cd1e7510ccbc187c8a9218bd03c47e0ab0b133f118e90` |
| `src/client/copilot-error-prefix-fixture.json` | 403 | `54386e800c3262e5bcfd67ef325ab32a3ec11f7ad8fc59c0f3a075d03169fb97` |

全文反推及实际 diff 确认业务恰两行：import追加 `prefixFeedbackOnce`，catch使用 `prefixFeedbackOnce('副驾暂不可用', e)`；旧原句是模板字符串，不是字符串拼接。三项 SHA 与先行不同 SOURCE/AUTO 专家签名一致；不重跑其5/250、不把其窄门冒成本轮全回归门。

## 原设施与隔离

独立 reader 只用 fs/path/crypto/assert，未 import 产品、adapter、配置或测试模块，未 spawn 产品进程。

| 对象 | 独立核验 |
| --- | --- |
| 原包依赖 | 原 r2普通副本 **13579文件/1030软链**，逐bytes/SHA一致、共享inode0、外链0、内部真实目标相对归属一致 |
| DOM依赖 | 原独立TaskPred设施普通副本 **1595文件/2软链**，真实React18/DOM18/jsdom25，无替换产品组件 |
| 补充upstream依赖 | 从旧112自有upstream-deps复制 **14394文件/1031软链**，逐bytes/inode/内部目标核同；原25份upstream源码逐bytes核同 |
| 裸import | dsh-llm指新candidate包依赖；dsh-brand/pi-ai指新自有upstream-deps；三个入口均freeze内部相对链，首full前已齐 |
| privateexecutor | [executor-source](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/executor-source.mjs)与私有原件逐bytes同；相对112只重定位、更新认领计数/来源、前置已验证upstream设施及close结果名。execute通用实现与tsc以后执行段独立全文核同 |
| C02 | adapter JSON与adapted test均与旧112原独立专家产物逐bytes同；原六例/helper不改，仅既定C02 DOM/FormData前提适配；未执行adapter |
| scheduler/document | 仅原r3设施路径重定位；checklist适配反推到原 `activeElement:null` 后全文相同，不改oracle或产品callback |
| DOM入口 | 仅虚拟 `export { TaskForm }`、React18 alias及lucide inline；不替业务/hook |
| report专项 | 原stress1/probes6与legacy设施三份逐SHA同；单列设施输入，不混521产品输入或普通/DOM集合 |

普通 config 与旧112基础 config只重定位；旧r2薄包装仅换cache，不把薄包装错当完整配置。每组缓存/JSON/日志/observations分根；singleFork/fileParallelism=false是组内配置，不声称不同Main组全局串行。Main只有tsc/bundle写独占lib，full/DOM/special不写共享主lib。

env按原命令逐键核：HOME/TMPDIR/TMP/TEMP/XDG cache/config/data与npm cache均指本轮runtime，无 Key/token/secret字段。44条索引软链均是 `runtime/tmp/` 的失败/越界等fixture，按lstat/readlink/real字段校验，不follow为产品文件。证据根缓存、临时数据、report-probes均纳入最终索引字节保护。

## 命令与实测结果

环境：macOS/bash，既有 nvm Node **22.23.3**、Vitest **2.1.9**、TypeScript **5.9.3**，DOM React/ReactDOM **18.3.1**、jsdom **25.0.1**；pnpm **11.28.5**为原依赖产物环境，本角色没有安装或调用pnpm。

以下是已发生的 Main 命令，**不是本角色执行步骤**。真实cwd均为新冻结包，完整绝对argv、白名单env、子PID、起止、exit/signal及stdout/stderr位于原 `*.command.json` 和 [终核审计](combined-successor114-regression-review-20261022-r1-audit-final-r2.json) 的 `commands_stdout_stderr_default95_watch.commands`。

| Main实际动作 | 子PID | 实际结果 |
| --- | ---: | --- |
| `node node_modules/typescript/bin/tsc -p tsconfig.json` | 9751 | exit0；原配置产品编译 |
| CSS普通复制后 `node node_modules/tsdown/dist/run.mjs --config tsdown.config.ts` | 10136 | exit0；新lib/client bundle |
| `node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false` | 10135 | exit0；产品noEmit |
| Vitest `run --config <证据根>/vitest-full.config.mjs --no-cache --coverage --reporter=default --reporter=json --outputFile=<证据根>/full.result.json` | 9752 | **161文件/1691用例，全部通过，exit0** |
| Vitest `run --config <证据根>/vitest-dom.config.mjs --no-cache --reporter=default --reporter=json --outputFile=<证据根>/dom.result.json` | 9750 | **3文件/17用例，全部通过，exit0** |
| Vitest `run --config <证据根>/vitest-special.config.mjs --no-cache --reporter=default --reporter=json --outputFile=<证据根>/special.result.json` | 10144 | **2文件/7用例，全部通过，exit0** |
| `node scripts/verify-isolation.mjs`，未追加argv | 10329 | **原默认95/95，失败0，exit0** |
| `node scripts/test-isolation-guard.mjs` | 10327 | exit0；guard fixture增改删与缺根语义 |
| privateexecutor `close` | 外层11353 | **真实exit0**，原输出恰 `CLOSE exit=0` |

普通+DOM文件并集精确等冻结src的 **164** 个产品test文件，无重叠/遗漏；用例实例 **1708**。专项7另列，不合成新业务覆盖。普通旧160文件及DOM/special每文件的完整 `fullName` 集合均与旧112原结果核同，普通只新增前缀5例；三组JSON均success=true，failed/pending/todo=0。563/7/3子suite不是文件数。

coverage原合同仅 `settings/copilot/progress-derivation/gantt` 四模块，保原全局 lines40/branches80/functions35/statements40；实际 **lines/statements89.40%、branches83.15%、functions85.89%**，满足原门。不称全包coverage、不称两行修复模块100%。原tsconfig排除test.ts/tsx，不把noEmit冒作新测试静态类型全门。

默认95逐个命令/exit0与原 `pickTargets`核同，完整95列表在终核审计 `defaultTargets`。原脚本默认排除guard自身和 **verify-real-model.mjs**；这是原合同，不是本轮增加skip，更不意味着realmodel/取消/B8通过。

## 日志、原失败与边界

full原stderr **13073 bytes**仍含 `TaskTable`唯一key警告及worker **PID9766**的11 keydown listeners/MaxListenersExceededWarning，与旧112已有类别一致；不修、不压制、不认定豁免。verify原stderr **7711 bytes**保留既定无效输入、写入失败、导出失败负向控制日志；目标exit0事实逐项核实。tsc/bundle/noEmit/DOM/special/guard stderr为空；不能写整轮零warning或所有stderr为空。

本轮产品测试、构建/noEmit、默认verify均首轮0，未重复旧112的bareimport collect FAIL；旧112首freeze/full设施失败和旧GUI双前缀FAIL均保留。**本轮归档首封却实际exit1**：

- 首封：工具 `12965595262ca7a27b594856c6f77f6a`，PID11739，真实exited/outputComplete/exit1；`EISDIR`源于索引扫描对目录软链作普通文件read。执行收据、executor-source、summary已先落盘，不因此当产品FAIL，也不删除或洗成0。
- r2封索引：工具 `c7fdc10da19b9db12dd7d99e4c8e179f`，PID11779，真实exit0，输出恰 `{ sealed: 1687 }`；lstat/软链字段不follow的索引已被本角色逐条核实。

默认verify打印“before=5/after=5/污染0”及“正式”字样，实际WATCH五根全部位于 **本freeze**，状态均 **MISSING**：data、packages/backups、packages/backup、exports、assets。不是正式root五文件，不证明全盘零污染或真实正式数据未变；主包/主lib等保护另以明确指纹表为证。

## 原件保护与收据

主包521、冻结521与原config完整表逐bytes核实；主lib463、旧107lib453、旧112lib455、新lib455、冻结launcher26条与对应保护表全量核同。旧112519产品输入及三份专项设施另核，未改旧lib、旧test或其他testing。依赖每个普通文件bytes/SHA/dev/ino和每条内链归属实际核查，并在reader窗口前后重扫不变。

[execution-receipts](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/execution-receipts.json)的 **8份外层原收据/24文件**与真实工具execution.json/output.log/stderr.log逐bytes同，全部exited/outputComplete=true/exit0；freeze/tsc/full/DOM/bundle/noEmit/special/verify的工具PID与产品子PID分层，起止关联核同。

guard和close最初仅结构化命令及Main工具观察，没有捏造UUID。本角色另找真实元数据核实：

- guard：`958c478fd3a27e03b0b76e0fbd19f222`，外层PID10320，exit0，原START/END与子PID10327时间绑定。
- close：`acb4a4eaccfe770213477133c3264560`，外层PID11353，exit0，时间覆盖close JSON；不是close文件存在就算退出。

所有上述真实metadata、stdout/stderr/metadata指纹、索引完整1687字段均存终核审计。索引原件、source/config/lib/依赖/缓存/fixture/observations在终核前后不变；前两轮reader已读原证也逐项核未改写。只签明确范围，不冻结livingdocs/其他专家、不扫描Key/正式data或宣称全盘零污染。

## 自有reader与STOP

本角色实际执行以下只读审证，产品执行次数均为0：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/combined-successor114-regression-review-20261022-r1-reader.mjs preflight
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/combined-successor114-regression-review-20261022-r1-reader.mjs final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/combined-successor114-regression-review-20261022-r1-reader.mjs final-r2
```

以上审计不可原地重跑覆盖。preflight真实exit1：reader把哈希字符串的原型link误当软链字段、错比旧r2薄包装、漏计原默认realmodel排除；第一次final真实exit1：sidecar原模板字符串及freeze stdout换行的匹配错误。均为本角色读设施定位，不是产品失败，未改oracle/产品/原证；两份失败审计保留为NOT_SIGNED。修正后的final-r2工具 `232c57bea1810a27a8f078a6171cebb1`、PID12706，**九组通过、errors=[]、真实exit0**。

准备偏差如实保留：一次只读 `git status --short`、额外读取非本门GUI脚本文本，超出本子单最小读面；未执行Git写/任何GUI脚本，不纳入本门证据。`rg`不可用127、缺省memory路径缺失1、尝试读取不存在的seal-r2脚本1以及diff差异1均为工具/读设施事实，不计产品红。实际Main脚本/产品build/install/test/verify执行0，浏览器/服务/Key/业务/其他testing/livingdocs写入0。

自有报告/reader/审计及真实工具退出绑定见 [seal](combined-successor114-regression-review-20261022-r1-seal.json)。Main不需把本报告selfinput补入其索引。

**本角色released/STOP，仅有限整回归PASS。** 新3264/PID10975、标准F5、原401/429/正常完整提示及恢复旅程由Main补证、不同GUI专家审签；该信息来自负责人，不是本角色浏览器实测。并行OP943仍绑定其原112对象，不冒本114。父全部适用门、B8和普通commit出口归Main汇合，本件不接续开发、不重复GUI、不签父结项、不push/tag/release/正式切换。

# 六修组合整回归独立原证审查 R1

2026-10-23，平台 trae，独立整回归原证审查专家，非开发、非 GUI、非产品测试重执行端。

## 有限裁决

**PASS_LIMITED_COMBINED_REGRESSION_EVIDENCE。**

仅签 `CombinedSixRepairsR1/index-r1.json` 绑定的精确冻结候选、构建/noEmit、full、DOM、报告专项纠正后结果、原默认95 verify、guard、设施来源、收据及明确输入/产物/依赖保护。自有 reader 最终 **11组核验通过，errors=[]，真实外层 exit0**；不是把 Main 的绿色 summary 直接冒作独立 PASS。

**新 host / 六修 GUI / 样式 / UX / 父全部目标 / 父 ordinarycommit：NOT_SIGNED_THIS_ROLE。** 各原 GUI FAIL/BLOCKED 保留，不转 MANUAL_PENDING，不签父结项，不执行 Git、push/release/tag 或正式切换。本角色 **released / STOP**，不要求 Main 等待或停父 goal。

## 授权与依据

负责人原句核心范围：

> 父goal持续授权按EGO/OIL分工，全部已实现未验收口至ordinarycommit，无push/release/正式切/新暂停功能。你为独立整回归原证审查专家，非开发/GUI，不重执行产品测试。
>
> 新唯一对象 reports/all-pending-evidence-20261021/CombinedSixRepairsR1/index-r1.json（1822成员；Main seal实际exit0）及其中candidate/source/full inputs/diff/newlist/config/executor/command/raw results/protection/lib/summary。
>
> 唯一仓库写 docs/testing/combined-six-repairs-regression-review-20261023-r1*新文件+自有/tmp reader，禁产品/oldtesting/plans/livingdocs/原封件修改、build/install/noEmit/producttest/GUI/service/Git/删改。
>
> 不用Main绿直接冒独立PASS，必要字节/范围核实后仅有限整回归PASS或真实FAIL/BLOCKED；不签新host/六修GUI/父ordinarycommit。完成seal/全部命令exit/failed设施保/released STOP。Main会继续新host GUI，不等你停父goal。

依据为 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[本轮计划](../plans/2026-10-23-six-repairs-regression.md)；[旧114报告](combined-successor114-regression-review-20261022-r1-report.md)仅继承已核设施，不继承其候选的整回归 PASS。本轮明确子单覆盖通用拉取、安装、重测、livingdocs同步、提交等默认流程。本角色未加载/执行 vendor skill，未扫整个 testing 历史。

## 精确候选

证据根为 `reports/all-pending-evidence-20261021/CombinedSixRepairsR1/`；Main 独占冻结为 `/private/tmp/pmtool-combined-six-repairs-20261023-r1`，产品包位于该根 `packages/dsh-pm-tool`。

| 字段 | 独立实核及边界 |
| --- | --- |
| baseline | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；Main freeze 源码明确实际 `rev-parse HEAD` 后断言一致。本角色不执行 Git；HEAD 不替代 dirty 候选 |
| source 声明 | **124**：109包路径＋15 launcher路径，不是124功能 |
| 完整产品包输入 | **525**，逐普通文件 bytes/SHA 核 Main 与 freeze，实际输入集合无遗漏；补充 legacy renderer 单列为设施 |
| 相对旧114 | **521→525，12项 delta：8修改＋4新增，删除0**；逐条重算旧/新 SHA |
| tracked diff | 文件集合与 changed list 全等；自有 reader 反向应用全部 hunks，从旧114 diff 和字节重建同一 baseline，再核本轮反向恢复字节全等。不执行 Git/diff/旧代码 |
| 新文件/source | parent 声明＋changed＋newlist 的去重并集恰124；source JSON、sha256文本与 Main/freeze 逐项一致 |
| version | `0.7.4`，只是包身份字段，不是新发布/装载身份；candidate 明确 `runtimeLoaded=false` |
| 新 lib | **455**条，逐bytes/SHA、完整集合核同 built-artifacts |
| 索引 | **1822＝1778普通文件＋44 fixture软链**，索引自排除；逐条 lstat/hash/readlink，物理成员集合相同 |
| index SHA256 | `4f281d7291ff76aa32f422d638c916da75892777fc34493bafee2e28e3e30548` |

12项 delta 为：新增 `panel-sidecar-task-handoff.test.tsx`、`views/okrs-related.test.tsx`、`views/records/records-deliverable-pointer-dom.test.tsx`、`commands/reflect-l2-entry.test.ts`；修改 `panel.tsx`、`views/okrs.tsx`、`views/records/records-listbox.tsx`、`views/tasks.tsx`、`commands/reflect.ts`、`core/archive.test.ts`、`core/archive.ts`、`index.ts`。完整 bytes/SHA及差分重建结果见 [最终审计](combined-six-repairs-regression-review-20261023-r1-audit-final.json) 的 `identity_inputs_diff_newlist_delta`，不以数量代替字节。

## 六份窄门与继承限制

[independent-source-reports](../../reports/all-pending-evidence-20261021/CombinedSixRepairsR1/independent-source-reports.json) 六份报告逐bytes/SHA核同，12项当前 delta 的 SHA 均在这些报告中有明确绑定。

| 原报告 | 本轮处理 |
| --- | --- |
| P1004 handoff SOURCE/AUTO | 原 `panel` 的191668字节窄门不直接签当前191954字节；其 test 不变。P2002报告另绑当前 panel，新 full/DOM 重新覆盖组合 |
| P1005 reflect-entry SOURCE/AUTO | command/test当前SHA一致；原报告的旧 index 不冒当前路由。当前 index由P2002报告及本轮输入/构建/full绑定 |
| P1005 listbox backdrop SOURCE/AUTO | listbox及7案test当前SHA一致；原 F02 GUI FAIL仍保留，不能凭此修称原根因已证/GUI关闭 |
| P2007 archive projection SOURCE/AUTO | archive两文件当前SHA一致；原 K16 GUI/archive 主chain未关闭 |
| P2002 outbound-slot SOURCE/AUTO | 当前 index/panel/tasks 三源一致；窄门不替新host/真实行可见/重进 |
| P2004 KR related SOURCE/AUTO | view/test当前SHA一致；原 r1 AUTO child0/19绿但 outer1的设施/非目标漂移事实仍在原报告，不洗成0 |

本轮没有重新运行六份窄测，也没有改写其报告或豁免其原未决门。原窄门只证明其字节/范围；本组合判定来自本轮完整原证的独立核查。

## 设施与隔离

自有 reader 仅使用内置 `fs/path/crypto/assert`，不 import 产品、测试、adapter或配置，不 spawn 产品进程。

| 核验对象 | 实核结果 |
| --- | --- |
| 包 node_modules | 旧114普通副本 **13579文件/1030软链**；全量bytes/SHA一致、共享inode0、外链0 |
| DOM node_modules | 旧114普通副本 **1595文件/2软链**；全量bytes/SHA/inode/内部真实目标相对归属一致 |
| upstream node_modules | 旧114普通副本 **14394文件/1031软链**；同上 |
| 每条依赖link | 原相对链接保持；原绝对内链只重定位到新根；real目标均在对应依赖根内、相对归属完全一致。完整逐链结果在最终审计 |
| upstream | 原25份源码逐bytes/SHA核同；dsh-brand/pi-ai/dsh-llm三个入口为freeze内部相对链，不用正式profile |
| executor | 旧114原executor SHA与derivation一致；新包装器不等于executor。自有受限字面量解析重建包装器12次replace与声明替换，派生源码全文等新executor，不执行包装器 |
| 执行段 | tsc至guard段与旧设施全文同；通用execute只新增三个observations目录准备，未改子进程执行/退出语义 |
| scheduler/checklist/C02 | scheduler仅旧114→新freeze路径重定位；checklist及C02 adapter/adapted test与旧114逐字节相同；checklist逆向仅恢复document前提后等产品原test，不改oracle |
| full/DOM config | 旧配置逐字节重定位后，仅将三个新DOM文件加到排除/include对应集合；统一自有React/DOM/JSDOM、lucide内联，仅TaskForm虚拟export，不替业务/hook |
| special config/三设施 | 旧114 config仅重定位，stress/probes/legacy renderer三份SHA完全不变，单列设施不混525产品输入 |

44条索引软链都位于本轮 `runtime/tmp/`；按 `lstat/readlink` 校验，不follow目标、不把软链当产品输入。各command白名单 HOME/TMP/TEMP/XDG/npm cache均指本轮runtime，无Key/token/secret/password变量名；full/DOM/special各缓存分组，原JSON/日志/原始observations均封入索引。

计划写“依次”，但原收据证明 full、DOM、special、verify **跨组并行**；singleFork/fileParallelism=false只证明组内串行。本报告不把计划代实际时序。并行早跑special的后果与纠正如下。

## 全部 Main 命令与原结果

环境：macOS，既有 Node **22.23.3**、Vitest **2.1.9**、TypeScript **5.9.3**；DOM React/ReactDOM **18.3.1**、JSDOM **25.0.1**。pnpm **11.28.5**为原计划/依赖环境声明，本角色未运行pnpm/install。

以下是已发生的 Main 命令，**不是本角色重执行**。原完整绝对argv、cwd、白名单env、PID、时刻、signal/error、stdout/stderr及指纹都在 [最终审计](combined-six-repairs-regression-review-20261023-r1-audit-final.json) 的 `commands_outer_child_stdout_stderr`；全部95子命令列表及exit0逐项在 `default95_verify_guard_watch_boundary`。

| 动作 | 产品/被调用子PID | 已核实际退出及分母 |
| --- | ---: | --- |
| 包装器 `freeze` | 5800 | outer spawnSync exit0；Main实际HEAD与dirty输入认领 |
| `node <pkg>/node_modules/typescript/bin/tsc -p tsconfig.json` | 5943 | child0；对应outer5942/0 |
| CSS复制后 `node <pkg>/node_modules/tsdown/dist/run.mjs --config tsdown.config.ts` | 5982 | child0；outer5981/0 |
| `node <pkg>/node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false` | 5988 | child0；outer5986/0 |
| Vitest `run --config <out>/vitest-full.config.mjs --no-cache --coverage --reporter=default --reporter=json --outputFile=<out>/full.result.json` | 6479 | **162文件/1707案，全部passed，child0；outer6474/0** |
| Vitest `run --config <out>/vitest-dom.config.mjs --no-cache --reporter=default --reporter=json --outputFile=<out>/dom.result.json` | 6480 | **6文件/39案，全部passed，child0；outer6473/0** |
| Vitest `run --config <out>/vitest-special.config.mjs --no-cache --reporter=default --reporter=json --outputFile=<out>/special.result.json` | 6481 | **原首轮1，2文件7案全部failed；outer6475/1，完整保留** |
| after-full独立脚本调用同一Vitest/config，仅结果名`special-r2.result.json` | 7047 | **2文件/7案全部passed，child0；Main实际脚本exit0由本轮明确授权事实给出，不捏造未封outer metadata** |
| `node scripts/verify-isolation.mjs`，未追加argv | 6483 | **默认95/95，失败0，child0；outer6482/0** |
| `node scripts/test-isolation-guard.mjs` | 7009 | child0；outer7007/0 |
| close-executor `close` | 7291 | 真实spawnSync0、原输出`CLOSE exit=0`，保护/依赖/产物收尾 |
| Main close脚本 `seal` | 本索引未单列 | 负责人明确实际exit0；1822索引及seal算法独立核同，不补造UUID/PID/outer metadata |

full＋DOM文件并集精确等525输入中的 **168个产品test文件**，无重叠/遗漏，实例 **1746**；旧114全部文件的完整fullName集合仍在，没有删旧oracle。四新增test中反思11案归full，新增三DOM为7/8/7；archive从4到9。special的7另列，不冒新业务或GUI覆盖。

原四模块 coverage 门未改：settings/copilot/progress-derivation/gantt，阈值lines40/branches80/functions35/statements40；原full stdout实际 **89.40/83.15/85.89/89.40**，满足此子集门，不称全包coverage。产品tsconfig本来排除test，不把noEmit称全test类型检查。

## special 原失败与同7纠正

原special `22:34:20.125Z→22:34:22.740Z`，早于full `22:35:07.563Z`实际完成。首stress错误为 `expected undefined to be defined`，其余原日志为 `missing original legal fixture: manual/session`；两文件7失败全部保留，不洗成产品绿或零失败历史。

封存的 `2026-10-23-six-repairs-special-after-full.mjs` 先要求原special1及full0，核未改三设施SHA，再确认原 `R1_RAW_TMP` 中manual/session的合法 `frozen-before.json`。8份原fixture逐bytes/SHA及sourceType实核；实际专项通过真实schema解析，不执行自造mirrorhelper。

`special-r2` 于 `22:35:46.425Z` 开始，晚于full0；原argv逐项相同，只替结果文件名，env唯一变化为 `R1_PROBE_OUTPUT`→`runtime/report-probes-r2`。same7 fullName集合全等，产品/oracle不变。9份输出另封：作者150000段/300024长度schema接受且返回；4份manual/session旧renderer等bytes；4种0/3/17/1800反引号边界保完整literal block。

close-executor与原executor全文只替 required-successful receipt 的 `special`→`special-r2` 一处。原special1仍在索引、summary及审计，close不以失败原件消失或伪造首轮0通过。

## 原始 DOM、日志与保护边界

必要原始DOM记录逐项核读：handoff 28条、7 first-open hidden=true/display=none/title focus、7 direct-return原副驾可见；pointer D01–D07封存React18事件/回调，D01/D02明确save一次、submit capture1/bubble3 preventDefault，D04/D06/D07等backdrop零提交，D05同参数两次save后saved；8份OKR记录零run/save/edit/fetch。这里只证JSDOM组件接缝，不证浏览器trusted pointer、bbox/布局/可见焦点、RPC/正式DB、新host或完整旅程。

原stderr **full13022 B、DOM860 B、verify7663 B** 保留；full含TaskTable key与MaxListenersExceededWarning，DOM也含TaskTable key，verify保负向无效输入/写入/导出错误控制日志。不得称无警告/所有stderr为空。special-r2 stderr为空不清洗原special3928 B失败stderr。

原默认verify打印“正式”“before=5/after=5/污染0”，但实际WATCH五根 **都在本freeze且MISSING**：data、packages/backups、packages/backup、exports、assets。这是五个缺根标记，不是正式五文件，不能证明未访问的正式数据或全机零污染。默认排除guard自身及原 nondeterministic `verify-real-model.mjs`，没有本轮新增skip，也不证明real model/B8通过。

明确保护表实核：Main产品525、Main lib463、旧114 lib455、新lib455、冻结launcher26、upstream25；三组依赖旧副本/新副本全量bytes、内部link归属及文件inode不共享。最终reader窗口前后再核索引/inputs/lib/三依赖无变化。不访问服务、profile、凭据、正式业务或其他角色private runtime；只读本角色工具真实收据，不由子退出或文件存在倒推outer。

## 自有 reader、失败保留与停止

实际自有执行，产品build/install/noEmit/test/verify、GUI、service、Git均 **0次**：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/combined-six-repairs-regression-review-20261023-r1-reader.mjs attempt1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/combined-six-repairs-regression-review-20261023-r1-reader.mjs facility-check
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/combined-six-repairs-regression-review-20261023-r1-reader.mjs final
```

attempt1真实外层 **1**：reader错把派生包装器等同executor，9/10组通过；[原失败审计](combined-six-repairs-regression-review-20261023-r1-audit-attempt1.json)不覆盖、不计产品FAIL。仅修改/tmp reader，受限解析字面量而不eval/import/执行Main，重建完整派生后设施单组 **0**，最终11组 **0**。真实工具结束回执分别为attempt1 `fb4c7dca76774ebfb11ce771b357fe89`/PID8242/exit1，final `73e01bd0c0705e658b7cd72ac578a463`/PID9200/exit0，均exited/outputComplete=true。终核审计不是自填exit0取代实际工具末码。

只读准备中 `rg`缺失 **127**、早读未落盘审计的`ls` **1**保留；其余已完成cat/head/sed/grep/Node内置读证命令 **0**。工具初次返回string execution ID不能传给integer轮询schema，未伪造poll；仅读自有实际execution.json核结束，未重执行产品。详见 [命令审计](combined-six-repairs-regression-review-20261023-r1-command-audit.md)。报告/审计/reader指纹、实际tool终码及终封见 [seal](combined-six-repairs-regression-review-20261023-r1-seal.json)。

**released / STOP。** 后继仅由Main沿六份原GUI合同继续新host证据与不同GUI专家审签；父全部适用出口齐后ordinarycommit的汇合不由本件裁定。本角色不扩新功能、不补GUI、不改旧testing/plans/livingdocs、不停服务、不提交推送。

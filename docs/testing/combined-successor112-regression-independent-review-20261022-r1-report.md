# 后继112整回归独立审证 R1

> 2026-10-22，trae，不同独立整回归审证专家；Main 唯一 builder/GUI。本角色不开发、不采 GUI、不重跑 build/install/test/verify。只写 `docs/testing/combined-successor112-regression-independent-review-20261022-r1*`，原证只读。

## 结论与停止范围

**PASS_LIMITED_COMBINED_REGRESSION_EVIDENCE。**

仅签 `CombinedSuccessor112R1` 精确候选的构建、产品 noEmit、普通全量、三组 DOM、原 stress/probes、默认95 verify、guard、设施合法性、指纹保护与退出收据这一有限整回归门。未发现本门新增阻断；不是转述 Main 自判。

**GUI / 样式 / UX / 父全部目标 / 普通 commit 均 NOT_SIGNED_THIS_ROLE；release STOP，角色 released/STOP。** 新3262 setup 仅准备，不作为已起服、已载112或 GUI 证据。本件不重复或撤销其他专家已签 GUI，不扩大为发布或正式切换许可；旧3260/PID87385与其 F07 blocker/data 保留，不冒新修装载。

## 授权和候选

负责人本轮派单关键原句：“Main唯一builder/GUI”“只docs/testing/combined-successor112-regression-independent-review-20261022-r1*自有reader/audit/report”“不build/install/test重复执行”“等待Main交close/实际外层收据再终核”“只整回归有限门，不GUI/父totalcommit”“独立审结后releaseSTOP”。后续明确 close 与12项收据已齐，可继续有限审签。

依据 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md#十一深度复盘后的执行合同与证据规则adl-0572026-10-21)、[Main执行计划](../plans/2026-10-22-combined-successor-112-regression.md)。本角色不执行通用 fetch/pull/build/install/全回归/Git写/livingdocs同步，遵守本次限定角色与唯一 writer 分工，不新增 global 门。

| 身份字段 | 独立核实 |
| --- | --- |
| 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不单以 HEAD 代表 dirty 候选 |
| 冻结 | `/private/tmp/pmtool-combined-successor112-20261022-r1` |
| 声明沿革 | 原107逐条保留；panel/ask替换 hash，四新 tests + renderer首次认领，去重112 |
| 包输入 | 原515 + 四新 tests = 519；不是519业务修改 |
| 版本 | `0.7.4`，只认输入，非新发布/tag/宿主身份 |
| 源/新文件/patch | [source-files](../../reports/all-pending-evidence-20261021/CombinedSuccessor112R1/source-files.json)、[complete-inputs](../../reports/all-pending-evidence-20261021/CombinedSuccessor112R1/complete-inputs.json)、[tracked diff](../../reports/all-pending-evidence-20261021/CombinedSuccessor112R1/tracked-product.diff)、[new files](../../reports/all-pending-evidence-20261021/CombinedSuccessor112R1/new-product-files.txt) |
| 冻结产物 | [built-artifacts](../../reports/all-pending-evidence-20261021/CombinedSuccessor112R1/built-artifacts.json)，455条逐字节核实；不当运行已载证明 |

三修 SHA 独立对齐原不同专家 SOURCE/AUTO 签名，而非继承旧107整包 PASS：

- panel：`581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d`，[原独立21文件199](task-predecessor-selection-independent-retest-20261022-r1-report.md)。
- ask：`084efb5b33e7cda7368b87c4708f87f460d28588f3e7476cadfad2de0fd35884`，[原独立210/noEmit](ask-auth-feedback-independent-retest-20261022-r1-report.md)。
- renderer：`94290aaf54764628161e84f11d1bd495f7cb965c4178ea155d52b2d28ac99fbf`，[原独立74/noEmit](fixed-report-export-fence-independent-retest-20261022-r2-report.md)。

## 设施合法性

独立 reader 不 import 产品/测试模块、不 spawn 子进程。直接读取清单、实际字节、inode、软链目标、JSON计数、配置、stdout/stderr与收据交叉核对：

| 设施 | 实际核查与边界 |
| --- | --- |
| 原包依赖 | 原 CombinedRepairR1/r2 普通独占副本13579文件/1030软链；没有替换为 ask deps，逐文件字节相等、共享inode0、外链0 |
| DOM依赖 | 原 TaskPredSelectionRetestR1/r1 普通副本1595文件/2软链；真实 React18/DOM18/jsdom25，字节及内链合法 |
| 上游 r2 设施 | 单独复制 AskAuthRetestR1 依赖14394文件/1031软链；共享inode0、外链0；上游源码副本原字节不变 |
| 裸 import 三入口 | freeze内部相对链 dsh-brand/pi-ai 指自有upstream-deps；dsh-llm 指本candidate原包依赖，与真实runtime使用同一解析身份；不链实时上游，不替 classifier，不作product transform |
| C02 | 原专家 adapter 与既定 adapted test逐字节相同，仅校正“隐藏原生FormData代表完整提交集合”的测试前提；六例/helper不改。恢复、干净取消和另次remount真实payload保原合同，不恢复旧裸 oracle 为产品阻断 |
| DOM产品入口 | 虚拟 transform仅 `export { TaskForm }`；不替组件/hook/业务 |
| checklist/RAF | 原专家 r3真实document/RAF setup仅重定位自有路径；checklist一行 document设施适配与原专家全文相同，断言不改，产品callback不替换 |
| stress/probes | 原独立stress1/probes6及归档legacy renderer字节完全相同；属于设施追加输入，不冒519产品清单或112变更声明，不混全量计数 |

初 freeze 文本核错 exit1 原执行及 `executor-initial-preserved/facility-resume` 保留；发生在产品测试前。full首轮159通过文件/1675通过实例，但 ask-auth文件0项 collect FAIL、`success=false`、子及外层exit1，不能写首轮全PASS。r2仅补裸import设施与自有cache路径，普通产品源码、旧test/断言和包依赖不改；另留新结果，不覆盖首红。

## 实际结果和覆盖

环境 macOS，直接既有 nvm Node **22.23.3**、Vitest **2.1.9**、TypeScript **5.9.3**；DOM React/ReactDOM **18.3.1**、jsdom **25.0.1**。pnpm **11.28.5** 为原依赖成果环境，本角色未调用。完整 argv/cwd/白名单 env/PID/起止/exit 在原 `*.command.json` 及 [终核审计](combined-successor112-regression-independent-review-20261022-r1-audit-final.json) 的 commands。

| Main实际命令/组 | 实际结果 | 本件核验 |
| --- | --- | --- |
| `tsc -p tsconfig.json` | exit0，PID91341 | 原配置产品编译；tests排除，不称test类型全门 |
| `tsdown --config tsdown.config.ts` | exit0，PID91527 | 自有lib/bundle；非主lib写入 |
| `tsc -p tsconfig.json --noEmit --incremental false` | exit0，PID91833 | 产品noEmit |
| Vitest `vitest-full-r2.config.mjs --no-cache --coverage` | **160文件1686实例、0失败/0pending/0todo、success=true、exit0**，PID92297 | JSON逐文件/逐assertion与stdout核同 |
| Vitest `vitest-dom.config.mjs --no-cache` | **3文件17实例、exit0**，PID91526 | refs5 + 适配C02等7 + hidden-submit5 |
| Vitest `vitest-special.config.mjs --no-cache` | **2文件7实例、exit0**，PID92188 | 原stress1/probes6，单列不重复计入普通 |
| `node scripts/verify-isolation.mjs` | **95/95、失败0、exit0**，PID92187 | 默认目标逐个对账；不另指定filter/skip |
| `node scripts/test-isolation-guard.mjs` | exit0，PID92296 | 原guard实际stdout与结构化子收据 |
| `executor.mjs close` | **真实外层exit0** | 13:50:08.463Z close与产物/保护绑定；非产品测试或GUI审签 |

普通160与DOM3的文件并集精确等于冻结src全部 **163** 个test文件，无遗漏/重叠；普通+DOM **1703** 用例实例。专项7另计，不将原多轮执行/子suite数/expect数充作不同文件或新tests。

coverage仅原定 `settings/copilot/progress-derivation/gantt` 四模块，原全局阈值 lines40/branches80/functions35/statements40不改。本轮 lines/statements **89.40%**、branches **82.62%**、functions **85.89%**，均达原门；copilot单文件branches79.84%不是违反原全局80%门。不声称全包或三修模块coverage100%。

本轮 full-r2 stderr 仍含 **TaskTable key warning、Node EventTarget 11 keydown listeners warning**，以及预置拒绝控制日志；不称零warning、不默示豁免其他归属门。未检出原RAF/detached/`document.querySelector is not a function`或未捕获异常设施错误。DOM/special stderr为空。原 C02裸测试6绿1红仍在原专家原件，不改色、不删失败、不重复执行。

## 保护和实际收据

[Main close](../../reports/all-pending-evidence-20261021/CombinedSuccessor112R1/close.json) 与独立二次字节核对一致：主包519输入、主lib463条、旧107lib453条、冻结Launcher26条保持原保护表；新自有lib455条与built manifest相符。终核再验前审读取的62个原证文件无改写。只签列明对象，不称全盘零污染或旧故障数据已修。

verify stdout 的 `before=5/after=5/污染0` 具体是 **freeze下5个缺失WATCH根的MISSING条目**，不是主正式data的5个文件，更不是全盘扫描；原默认95目标全部exit0的事实另核。

[execution-receipts](../../reports/all-pending-evidence-20261021/CombinedSuccessor112R1/execution-receipts.json) 共 **12项**。前10项execution.json/output.log/stderr.log共30文件逐SHA及原工具字节对账，status exited/outputComplete=true；初freeze与full首轮两项实际exit1，其余8项exit0。guard/close没有捏造UUID：guard按实际结构化子PID92296/exit0及Main原外层观察标明边界，close另由本专家找到并核实真实外层原件，不以“close文件存在”代替退出。

本专家定位的真实外层凭证：

- close：`f4363581092d19bd5486cd48e45a858c`，PID92855，exited/outputComplete=true/exit0，原输出 `CLOSE exit=0`。
- Main archive：`94160b8fbcf3f9bc44edc92950c31117`，PID92999，exited/outputComplete=true/exit0，原输出 `{ archived: 12, originalNonzero: 2 }`。
- 独立preflight：`6074d80c4c9e66e087a38c4311a7dbf2`，PID93350，实际exit0，8组核验，产品测试执行0。
- 独立final：`cbf1b39fb7a33b6eeaba4f9368de3e7e`，PID93513，实际exit0，10组核验，产品测试执行0。

close/archive的实际metadata及输出指纹持久化于终核审计；本角色两轮真实收据见 [audit-receipts](combined-successor112-regression-independent-review-20261022-r1-audit-receipts.json)。工具UUID与子PID分层，不混为产品test执行ID。receipt索引所列结果/候选/产物SHA逐项匹配；Main的close明确 `NOT_SIGNED_BY_EXECUTOR`，不自署GUI/父门。

## 本角色执行与交回

仅执行两轮只读reader，未运行任何产品构建/安装/测试/默认verify，没有Git写、服务、浏览器、业务/旧tests、其他testing或livingdocs写入：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/combined-successor112-regression-independent-review-20261022-r1-reader.mjs preflight
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/combined-successor112-regression-independent-review-20261022-r1-reader.mjs final
```

以上是已经发生的审证命令，不应对既有audit文件原地重跑覆盖。两轮实际exit0；[前审](combined-successor112-regression-independent-review-20261022-r1-audit-preflight.json)保当时未签状态，[终审](combined-successor112-regression-independent-review-20261022-r1-audit-final.json)在最终收据到齐后有限PASS。reader前后SHA变化只因补最终收据核验，前审原件未覆盖。

准备时 `rg`缺失exit127、指定memory路径不存在exit1、定位未生成index的ls exit1为读设施事实，不计产品红；工具轮询未提供可用UUID参数时改读真实execution元数据，未停止任何服务。独立diff exit1仅差异事实，不洗原失败。

Main继续本来获批的3262候选runtime/profile/API/model绑定、既定GUI采证与各域独立门汇合；本件不增新任务或GUI矩阵。父总出口未由本角色签完，不能用此有限整回归PASS替代全部目标或普通commit前置门。**本角色至此停止；不push/tag/release/正式切换，不接续开发或重复其他GUI。**

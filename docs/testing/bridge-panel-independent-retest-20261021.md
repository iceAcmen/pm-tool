# Bridge 与真实 PmPanel 独立复验

> 给 Main、项目负责人和后继专家使用：绑定本轮冻结源码、真实组件自动化、开发原件和漂移边界；不签新构建、装载、Finder 或整包 dirty。2026-10-21，trae，独立测试角色。

## 1 有限结论

**冻结 bridge/panel 跨旅程修复的源码与指定 AUTO：PASS。未发现本合同内仍需 Main 修复的确定缺陷。新 build、实际装载/下发、真实 Finder N2 旅程：NOT_RUN，不予审签。**

- 原 23 个 bridge + 5 个真实 PmPanel 测试，不改期望独立复跑全绿。
- 独立补充 14 项，共 **42/42，两轮实际 exit0，signal null，pending0**。
- 换入旧公开 bridge/panel：25绿/17红；其中原28项仍 **20绿/8红**，四 bridge 红 R05/R06/R07/R08与四 panel 红均复现。
- ready 门、卸载响应门、旧 finally 归属各自弱化的自有负对照：分别5/2/2红，实际exit1，证明相关断言能检出退化，不是当前产品FAIL。
- 主树重点两实现、入口、两测试、config/package/lock/tsconfig与冻结一致。主树 `views/tasks.tsx`、OP测试已经并行变化；本结果不代表最新全部导入图，更不代表整个dirty候选PASS。

依据：[先行计划](bridge-panel-independent-retest-20261021-plan.md)、[原专家合同完整§5](reopen-handshake-diagnosis-20261021.md#5-最小修复与测试合同)、[Main修复计划§1](../plans/2026-10-21-bridge-board-objective-closure.md)、AGENTS §6A、collaboration §9/11。

## 2 授权与身份

父负责人原句来自 [持续执行记录§1](../../reports/all-pending-acceptance-execution-20261021.md)：“好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”

本专家本次另明确限制：“独立测试复验，不开发”，“只写docs/testing/bridge-panel-independent-retest-20261021*与自有tmp”，禁止 install/build/共享lib/启服务/MainGUI/private凭据/commit/push。父普通提交授权不移交本专家。Main并行board/OP与后续panel props不是本专家开发范围。

产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`，文档 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。未提交对象用实际源码字节认领，不能用HEAD或version代表；无本轮bundle/runtime身份。

独立冻结 `/tmp/pmtool-bridge-panel-independent-retest-20261021.PudVGM/frozen`，macOS/darwin arm64（OS release24.6.0），Node `v22.23.3`、Vitest `2.1.9`、React/test-renderer `18.3.1`、Vite `5.4.21`；依赖版本/真实路径/包声明hash见[freeze](bridge-panel-independent-retest-20261021-freeze.json)。未调用pnpm/安装器。

只读复用 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`。每轮独立目录链接既有依赖，wrapper保原include，另设自有cacheDir、cache=false、关闭deps optimizer；见[wrapper](bridge-panel-independent-retest-20261021-config.mjs)。子进程只传 PATH、独立 HOME/TMPDIR、CI和色彩设置，不继承凭据环境。Vitest内部源码已核cache=false分支。

## 3 源码认领

原诊断四文件为bridge、panel、index、原bridge test，本轮逐一冻结，并另加新panel test与配置声明。下表全部SHA256；原字节已按本前缀归档为 `-frozen-<路径下划线>.txt`，不会只剩tmp或平台摘要。

| 包内路径 | SHA256 |
| --- | --- |
| `src/client/launch-handshake.ts` | `fd4466ba53668864268f983b75c65b1cf8ae74369513ab08fbb73052c6b0d95b` |
| `src/client/panel.tsx` | `eebdc234b339f52012f0ec2cf7bd0f947332570418658b41d95a34423b689af9` |
| `src/client/index.tsx` | `e5702c69f788e4513a78f2e2861ef87d08f1bfa7ea2dce3807ed600505340f89` |
| `src/client/launch-handshake.test.ts` | `0a9f531153385906d0a265a626a975d735280a881a18f7e0d994de0f85786d9a` |
| `src/client/panel-launch-handshake.test.tsx` | `f338a24048fed1a43fa96847a9e5525f2601958da1c6b30a1269a77ddac2cb2b` |
| `vitest.config.ts` | `ef1b61eba0c112e523e535e6794c85612874522e4413665c8970a997ab4124c8` |

package/lock/tsconfig与全部复制src的指纹、复制前/副本/复制后对比在freeze；重点diff在[tracked.patch](bridge-panel-independent-retest-20261021-tracked.patch)，新panel test原件另归档。复制期零漂移、全部执行副本运行前后源码零变化。`check mid`核主树重点零漂移，[证据自检](bridge-panel-independent-retest-20261021-evidence-check-pre-report.json)再核一致。

**漂移与继承**：主树 `src/client/views/tasks.tsx` 与 `views/objective-consumers.test.tsx` 已由并行Owner修改；冻结副本没有跟改。空快照组件证据绑定冻结依赖图，不对后续任务视图、OP人工/客观props或整项GUI作继承判定。若panel/bridge/config再变，应以新hash重新认领并补受影响回归，不能只保留此PASS标题。

## 4 实际组件与不变量

生产 `PmPanel`、生产bridge与实际index直接import，未mock这些业务模块；React test renderer执行真实hooks、effect、render、button handler和unmount。替身只提供宿主`execute`、fetch响应、EventTarget/hash/history、document、storage、matchMedia。fixture为七类空数组合法Snapshot，`execute`精确调用`web snapshot`，没有提前注册宿主不存在的业务模块。

| 合同 | 实际步骤和观察 | 结论/证据 |
| --- | --- | --- |
| B01同token并发/failed retry | 两次ready共用同Promise；失败保hash，下一次再发。N1成功不掩盖失败N2，N2可再试 | PASS，原bridge及补充B01 |
| B02新nonce/跨port | N1后N2分别发；相同nonce新port独立发；真实panel只hash事件，无额外snapshot | PASS，原R05/R06、补充B02/P02 |
| B03旧flight/finally | N1在途N2不同Promise；N1完成后N2仍共用其flight；N2先完成再N1仍保业务hash | PASS，原R07/R08、补充B03/P05 |
| B04路由保留 | 成功只清本轮token，保`#/tasks`与pathname/search；旧成功不清新token或新普通业务路由 | PASS，原strip/history、补充B04/P02 |
| P01未就绪/快照失败 | pending期间N2/重复事件零POST；reject/非法JSON不回告；真实重试成功只处理当前token | PASS，原panel2、补充P01/P03 |
| P02已就绪hash-only | 同一个真实挂载N1成功后N2事件立即发；实际execute只一次 | PASS，原panel1、补充P02 |
| P03刷新重设ready | 曾成功后第二read在途/失败，新N2保留；成功read/retry才发 | PASS，原panel3、补充P03 |
| P04普通/非法/重复hash | 业务hash重复、非法端口/nonce零POST；同token在途合并；失败重复事件重试，已完成token不再POST | PASS，原panel1/4、补充P04 |
| P05卸载/实际复挂 | 监听数1→0→1→0；旧mount快照迟到，新mount自己的快照尚pending，零POST；新mount成功才发N2 | PASS，原panel5、补充两P05 |
| P06入口不全局ready | 真实index.apply仅slots注册实际PmPanel，零execute/POST/hash listener | PASS，补充P06 |
| S01请求模型 | 精确loopback URL、POST、content-type JSON、body仅nonce、credentials omit；未人为加Origin/auth | PASS，原reportEntered、补充S01 |
| S02内存/token边界 | 无setItem；仅合法旧项目选择键清理；所有storage调用/log/history URL无合成token，query不变，无cookie属性写入 | PASS，静态闭包Set/Map与补充S02 |

源码审读：`launch-handshake.ts`约82–89行在完成后比较当前port+nonce再清参数；约105–123行用Set/Map按key归属，finally只delete该key。`panel.tsx`约728–799行保存真实挂载active/generation，refresh开始撤下snapshotReady，成功分支及catch/finally检查active与generation；mount递增generation，cleanup关闭active/ready、递增并移listener。index无握手全局调用。

generation是**挂载代际**，不是每次refresh的序号。本轮确实测试实际卸载/新实例挂载与迟到旧响应；未执行真实浏览器StrictMode同fiber effect重放、连续业务并发read或目标tab整页reload，不把源注释当这些场景原证。

## 5 命令与原始结果

仓库根，macOS，固定Node22。实际Vitest完整argv/cwd/UTC/exit/signal、42项逐项status和stdout/stderr hash均在每轮 `-execution.json`；逐项JSON与完整文本也按同前缀原字节归档。执行入口：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/bridge-panel-independent-retest-20261021-run.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/bridge-panel-independent-retest-20261021-run.mjs run current-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/bridge-panel-independent-retest-20261021-run.mjs run current-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/bridge-panel-independent-retest-20261021-run.mjs run legacy-r1 legacy
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/bridge-panel-independent-retest-20261021-run.mjs run ready-negative no-ready
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/bridge-panel-independent-retest-20261021-run.mjs run unmount-negative no-unmount-guard
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/bridge-panel-independent-retest-20261021-run.mjs run finally-negative wrong-finally
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/bridge-panel-independent-retest-20261021-run.mjs run current-r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/bridge-panel-independent-retest-20261021-run.mjs check mid
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/bridge-panel-independent-retest-20261021-check.mjs pre-report
```

上述是已运行命令记录，**不是让下一人覆盖重跑**。原件flag=wx；重跑须用新label、保旧原件及新候选认领。legacy/ready/unmount/finally各独立目录，不写同一冻结目录。三个负对照并行但每组内部单worker/no-file-parallelism。

| 轮次 | 实际exit | 绿/红/pending | 原件 |
| --- | --- | --- | --- |
| freeze首次 | 1 | 未启动产品测试 | Vite为transitive而非顶层入口，见下方设施说明 |
| freeze修正后 | 0 | 重点/全部src复制零漂移 | [freeze](bridge-panel-independent-retest-20261021-freeze.json) |
| current-r1 | 1 | 41/1/0 | [执行JSON](bridge-panel-independent-retest-20261021-current-r1-execution.json) |
| current-r2 | 0 | 42/0/0 | [执行JSON](bridge-panel-independent-retest-20261021-current-r2-execution.json) |
| legacy-r1 | 1 | 25/17/0 | [执行JSON](bridge-panel-independent-retest-20261021-legacy-r1-execution.json) |
| ready-negative | 1 | 37/5/0 | [执行JSON](bridge-panel-independent-retest-20261021-ready-negative-execution.json) |
| unmount-negative | 1 | 40/2/0 | [执行JSON](bridge-panel-independent-retest-20261021-unmount-negative-execution.json) |
| finally-negative | 1 | 40/2/0 | [执行JSON](bridge-panel-independent-retest-20261021-finally-negative-execution.json) |
| current-r3 | 0 | 42/0/0 | [执行JSON](bridge-panel-independent-retest-20261021-current-r3-execution.json) |
| check mid | 0 | 重点零漂移；并行OP两文件变化 | [漂移JSON](bridge-panel-independent-retest-20261021-drift-mid.json) |
| check pre-report | 0 | 98证据检查绿/0红 | [校验JSON](bridge-panel-independent-retest-20261021-evidence-check-pre-report.json) |

设施纠正明确保留：

1. 首次freeze实际exit1，错误为 `ENOENT …/node_modules/vite/package.json`；仅指纹解析假定顶层Vite入口，未启动测试。改runner为从Vitest真实包位置解析已装transitive依赖；没有install。首份tmp `/tmp/pmtool-bridge-panel-independent-retest-20261021.rONxL9`保留，新冻结不覆盖它。首次错误来自工具原始返回，未伪造一份当时未采集的spawn日志。
2. current-r1的唯一红是自有S02误要求removeItem零调用；真实空项目snapshot正常 `removeItem('pm-selected-project')`（panel约581–584行）。本专家只修自有测试，改为精确允许该业务清理且全部storage调用不含token。原件与旧测试副本保留在current-r1。原28项该轮已全绿；不把此红报为产品缺陷，也不抹掉首轮exit1。

自有负对照改动仅发生在执行副本，原字符串/替换串/改后hash在其execution.changes中：删snapshotReady条件、删成功/catch active-generation守卫、把inflight.delete(key)换inflight.clear()。各自相关断言确实红，不是用不同模型复现。

## 6 Main 原件审查

已读 [开发记录](../../reports/bridge-panel-developer-20261021.md) 与 `reports/all-pending-evidence-20261021/A6/bridge/` 全部8份公开日志/退出/指纹文件，逐字节另存本前缀 `-A6-*`；索引/校验在evidence-check。Main后续补归档不视为源变化。

Main修前冻结bridge hash `c7303c993809b41790f9f299d9818c73facbcb888dbe058aab414b20a1081057`、panel `195c3cababcbca069b2c47e3042f667736e3c4038bdc78c341d55989849ed90d`，与原诊断一致；独立legacy副本确实换入这两字节。Main退出原件真实spawn exit1/0，红stdout为原28项20绿8红，绿stdout28/28；五source hash逐项与本独立冻结一致。

Main首次主树缺renderer入口的失败仍是设施未加载，不冒称真实panel红。本专家只读主树源，不在其node_modules补链接或重装；在自有tmp按授权使用完整依赖后真实执行组件。

这些开发原件支持作者红绿历史，不能单独证明新build/生产运行。旧3205/3212加载旧bundle事实按Main开发记录保留，本专家没有访问其浏览器/服务/凭据。

## 7 未覆盖与交接

| 门/对象 | 本轮状态 | 接续 |
| --- | --- | --- |
| 冻结bridge/panel/index指定源码与AUTO | 有限PASS | 本报告与对应hash，不升级整个dirty |
| 新bundle build、types、全集tests/coverage/verify | NOT_RUN，明确禁止 | Main唯一隔离builder另做并认领 |
| 新bundle实际下发/装载、宿主身份/开关 | NOT_RUN | Main绑定新候选/产物/实例，再交专家 |
| 真实Finder N1→control reopen→N2/目标tab文档代际/snapshot/S4 | NOT_RUN | Main按原诊断§5真实合同采证，不手工POST/重放旧nonce |
| receiver精确Origin/CORS/single-use/TTL | 未运行 | 本轮仅保持客户端请求模型；服务端不继承客户端测试 |
| 页面样式/UX/键盘/视口矩阵、OP/board完整旅程 | 未审签 | 各Owner/独立门继续，不由此报告关闭 |

没有改产品、其他testing、livingdocs、上游、正式服务/profile或业务数据；未install/build/共享lib/启服务/操作MainGUI/读取private凭据/commit/push。所有测试命令已有实际spawn结束状态；未启动浏览器或产品服务，无需清理共享进程。只核自有输出/冻结字节和配置限制，未监测全系统与所有依赖目录，**不声明全盘零污染**。

本轮交付检查采用已校验vendor `code-review`两轴方法作附加自查：taskKind=delivery，vendorIntegrityVerified=true；commit `49dd158d1076134a641b33efb035946536778336`，正文SHA256 `09eb147f793e4647949edd32dbad278f0554dfb56e0d46b699cd4c2c55bf0357`。标准轴按AGENTS/协作限制核写根、凭据、证据表达；合同轴按原§5核不变量与NOT_RUN。没有可调用子Agent机制，不伪称并行独立两审；不运行setup、不套HEAD三点diff遗漏dirty、不复制vendor正文，不将此review/静态verifier作为独立产品门或skill毕业。

最终 `node …-run.mjs check final` exit0，重点和冻结图零漂移，主树并行两文件变化保留；`node …-check.mjs final1` exit0，[105/105证据校验](bridge-panel-independent-retest-20261021-evidence-check-final1.json)。该JSON的auxiliary保存完整命令/exit/signal/stdout/stderr：Node22 `--check`本runner/checker/config各exit0；`node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` exit0，两注册vendor静态校验通过，未注册树不受本门审计；code-review两个文件另由shasum确认。报告围栏/链接均核通过。这些是证据/语法/完整性检查，不是GUI或全集功能门。

收尾 `node …-check.mjs final2` exit0，[119/119](bridge-panel-independent-retest-20261021-evidence-check-final2.json)：另逐轮归档实际执行的补充测试原字节，含current-r1旧断言，并核其hash与当轮additional一致。该时点主树新增 `src/client/views/tasks.css` 漂移，连同tasks.tsx/OP测试共三项；重点源码/config和冻结图仍零漂移。这三项均不继承本轮证据。

下一步由Main合并并行修复后重新冻结最新完整候选，唯一隔离build与全量回归、合法新实例/下发身份、真实Finder新旅程；专家再签受影响门。本专家任务在完成本前缀报告/原件校验后结束，不替父全部验收/最后commit任务宣告完成。

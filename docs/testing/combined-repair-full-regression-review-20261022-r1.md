# CombinedRepairR1 r2 完整自动回归与候选继承独立审证

> 2026-10-22，平台 trae，独立审证角色，非开发、非执行。仅写本前缀，不运行重复回归，不签全部 GUI、父目标、普通 commit 或发布。结构化对账见[审证记录](combined-repair-full-regression-review-20261022-r1-audit.json)。

## 1. 有限结论

**PASS_LIMITED_REGRESSION_REVIEW**：Main 的 r2 七项原执行记录退出码均为 0、signal=null；普通组 **158 文件/1662 项**，独立 DOM 组 **1 文件/5 项**，每条 JSON assertion 都为 passed，失败/pending/todo 均 0。两组文件互斥，并集逐项等于冻结包全部 **159 个 `src/**/*.test.ts(x)` 文件**，没有漏测、重复文件或以 SKIP 凑 PASS。默认 verify **95/95** 的实际开始、成功、顺序与源码发现规则完全对应；原四模块 coverage 门通过，noEmit、guard 自测通过。

39 个顶层封存文件、107 条去重声明、515 个包输入、453 个最终产物的 bytes/SHA 全部匹配；原三位专家签过的 9 条增量路径与本候选相等，允许限定 SOURCE/AUTO 继承。旧 U4 的 155 文件/1590 个用例名完整保留，本轮已实际重跑，不再把旧轮或专家分组结果加到 1667 中。

**本范围未发现新阻断产品缺陷。** 这不是“全系统无缺陷/无警告/全输入均已封存/正式资产全盘零写”的结论。以下边界必须保留：

- 新 bundle 的宿主激活、实际下发、浏览器上下文和修后 GUI 不在本包；O3/ATF/J03 等仍交 Main 新证及不同 GUI 专家判定。
- r1 确有自动 install、333 包下载、postinstall、网络与警告；不冒称整批离线、原依赖同字节或所有命令无失败。
- guard 的 before=5/after=5 是**五个缺失根的 MISSING 标记**，不是五份真实业务文件，也不是本机正式 data/附件的保护证明。
- `complete-inputs.json` 的 515 是包输入，不包含另复制的 docs/vendor、既有外部 fixture、DOM 配置与依赖；本次补充只读对账，不追写成 Main 原封包已覆盖这些输入。

## 2. 授权与方法

本子任务授权：“独立完整回归/候选继承审证，非开发非执行，唯一写 `docs/testing/combined-repair-full-regression-review-20261022-r1*`”；不改产品/原证/服务/Git/活业务，不重跑全回归，不 fetch/pull/install/build/test/verify/e2e/模型/browser/credential/vendor 运行。

按 AGENTS、collaboration §9 与 §11.3–11.6 的执行/判定分离、候选认领和受影响继承规则，只读解析 JSON、读取源码/配置/原日志及复算字节指纹。一般 SOP 不扩大本次明确限制；未更新 livingdocs，由 Main 接续同步。父普通 commit 授权不移交本角色。

审证环境为 **macOS/bash，Node v22.23.3**，只使用 Node 内建 fs/path/crypto 等读操作与 shell 文本工具。Main 原执行为 Node v22.23.3、TypeScript 5.9.3、Vitest 2.1.9、tsdown 0.15.10；pnpm 11.28.5 仅 r1 实际调用，r2 未进入 pnpm run。DOM 使用 React/ReactDOM 18.3.1、JSDOM 25.0.1；普通组使用原 React/react-test-renderer 18.3.1。

只读摘要采集时点约 `2026-10-22T12:15:06Z`；不要求后继主树持续保持本快照，不锁后继合法源码、服务或 GUI 工作。曾遇 `rg` 缺失 exit127、记忆文件不存在 exit1、探索 glob 无文件 exit2；均为读取探索失败，不是产品测试失败。耗时依赖哈希读取 PID59245 已由工具执行凭证确认 exited/exit0/outputComplete，无本角色待运行测试进程。

## 3. 候选、封存与产物绑定

原证根：[CombinedRepairR1/r2](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/)，以下文件名均相对此根。

| 对象 | 核验 |
| --- | --- |
| 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，来自候选原件；不执行 Git，不用 HEAD 代表 dirty 候选 |
| 冻结/包 | `/private/tmp/pmtool-combined-repair-20261022-r2` / `packages/dsh-pm-tool`，version `0.7.4`，builder=Main |
| 顶层 index | [artifact-index.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/artifact-index.json)，SHA `0d754c7efc974cdda5a17a895607ebd722a94437fcfdba5c0df26dbeff0b27c1`；39/39 bytes/SHA 相等，无未列顶层文件（索引自身除外） |
| 107 声明 | [source-files.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/source-files.json) 与 `.sha256` 107 行逐项相等；当前读取时主树对应107字节相等 |
| 515 包输入 | [complete-inputs.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/complete-inputs.json)：src398、scripts105、locale2、根文件10；冻结/主树对应515均相等 |
| 453 产物 | [built-artifacts.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/built-artifacts.json)：实际 lib 文件集合453、无额外/缺失/失配 |
| 新 client | `lib/client.js` 1719054 bytes，SHA `09219cf81820294161dbdbdced09e73094b000a7d7e1d2e5b8c42f399fabb0db` |
| close | [close.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/close.json) 三项 true；当前另核主旧lib463和U4旧lib453无增删/字节变化 |

107 是声明路径数，不是107个新产品文件；其中15条是 launcher 路径，由原 Main seal 对主树读取认领，**没有复制 launcher 到本 r2 冻结，也没有新跑 Launcher56**。插件声明92条，另由515包输入补足完整编译/测试读取范围。102→104→106→107 是声明去重演进；106→107 仅已有材料组件字节变化及新增 refs-dom 测试，不能估108。

与旧 U4 r2 完整 src 比较：**5 个已有产品文件变化、4 个新增测试，共9路径，无删除**。不是7个新产品文件，也不是5个新测试。scripts、locale、package/lock、原 Vitest/tsconfig/tsdown 配置均未变。453产物相对旧U4仅8路径变化：5个对应 JS、`types/core/tasks.d.ts`、`client.js`、`client.js.map`，无新增/删除产物；其余445相等。

完整 input→build→产物接缝有以下原证与交叉核对：

- [只读的 Main executor 源码](../../reports/all-pending-evidence-20261021/CombinedRepairR1/executor-build.mjs) r2 freeze 不复制旧 lib；tsc 从本包 src 输出 lib，13份CSS按实际源码复制后直接 tsdown，入口 `lib/client/index.js`。本角色未运行 executor。
- 原 tsc/bundle/noEmit 的 argv/cwd 都指向同一 r2；起止顺序是 tsc→CSS/bundle→full→DOM→verify→noEmit→guard→close。
- 13份复制CSS源/产物逐字相等；bundle sourcemap 的206 sources/content中193条可直接对应当前文件，全部内容相等，包括本轮 ResultCard/TaskDraftMaterials JS。其余13条未作磁盘直接对应，不虚报206条全对应。
- 原 verify-client-bundle/module-table 均 exit0，验证构建 factory/apply/平台模块/分块契约；它们是 VM/宿主适配器，不是真宿主已加载或真实 ReactDOM 渲染证明。
- `close.json` 没有单独 `close.command.json`，freeze也无独立退出凭证；本角色能核封存声明及当前字节，**不能仅凭三项true另造 close 原退出码0**。`ownOutputOnly` 不等全盘写根穷尽；原 executor 的 close实际只核主包输入、主lib及旧U4lib。

## 4. 原执行结果与配置覆盖

所有原命令在包 cwd `/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool`；可执行文件均为 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`。完整 argv/env/PID/起止见下列 `*.command.json`，与 summary逐结构相等，不在本报告提供重新执行入口。

| 原记录 | 实际关键 argv（node 后） | 原exit / signal | 审证 |
| --- | --- | --- | --- |
| [tsc.command.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/tsc.command.json) | `<r2包>/node_modules/typescript/bin/tsc -p tsconfig.json` | 0 / null | stdout/stderr空 |
| [bundle.command.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/bundle.command.json) | `<r2包>/node_modules/tsdown/dist/run.mjs --config tsdown.config.ts` | 0 / null | 构建6个bundle/map文件，stderr空 |
| [full.command.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/full.command.json) | `<r2包>/node_modules/vitest/vitest.mjs run --config <原证根>/vitest-full.config.mjs --no-cache --coverage --reporter=default --reporter=json --outputFile=<原证根>/full.result.json` | 0 / null | 158文件1662断言全passed；success=true |
| [dom.command.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/dom.command.json) | 同Vitest入口，`run --config <原证根>/vitest-dom.config.mjs --no-cache --reporter=default --reporter=json --outputFile=<原证根>/dom.result.json` | 0 / null | 1文件5断言全passed；success=true，stderr空 |
| [verify.command.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/verify.command.json) | `scripts/verify-isolation.mjs`，无目标筛选参数 | 0 / null | 95开始/95成功，顺序等于默认源码清单 |
| [noemit.command.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/noemit.command.json) | `<r2包>/node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false` | 0 / null | stdout/stderr空，按原配置排除tests |
| [guard.command.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/guard.command.json) | `scripts/test-isolation-guard.mjs` | 0 / null | fixture增改删/缺根→新增/整根消失均有断言原输出 |

原 JSON 的 `numTotalTestSuites=556/2` 是嵌套 suite 数，不是文件数。文件数按 `testResults` 的158/1计算；assertion数1662/5与numTotal/numPassed逐项一致，failureMessages均空，所有文件status=passed，pending/todo/failed均0。[普通JSON](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/full.result.json)与[DOM JSON](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/dom.result.json)是计数依据。

普通配置展开原base.test，只额外排除 `src/client/shared/task-draft-materials-refs-dom.test.tsx` 并限制单fork/单worker/不并行；DOM配置只include这个文件，React/JSX/ReactDOM/test-utils统一alias到同一独占18.3.1，JSDOM25.0.1，测试自己创建DOM。普通组不施加DOM alias，避免原renderer与另React实例混用。**配置分组并未丢文件**：冻结159个源内测试逐项对账缺失0、额外0、交集0；旧155文件/1590用例名在新结果逐项未删未改。

本轮新增77项=command11+permission18+terminal43+DOM5；与旧1590组成1667，只描述本轮一次执行。原专家Cycle10/29/134、ATF8/10/43/175、MaterialRef7/5/194各有自己的对象与结果，不能重复累计，也不把其中按name filter未执行的ATF10/8 pending签成PASS。

coverage继承原ADL-056四模块include与全局阈值 lines40/branches80/functions35/statements40。原[full.stdout](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/full.stdout.txt)记 statements89.4、branches82.41、functions85.89、lines89.4，过门；copilot单文件branches79.84不违反未设perFile的全局80阈值。本次只读coverage-summary与原输出相符，但该summary位于冻结coverage，**不在Main顶层seal**；不声称新修的tasks/ai-client/组件已获100%或全产品覆盖率。noEmit亦不检查被排除的test类型。

默认verify发现97个脚本，排guard自身和真实网络smoke后95个。95逐一原退出0、没有子脚本失败；完整名单见审证JSON。`verify-real-model.mjs`和e2e/真实宿主/GUI未执行，不算PASS。vendor静态输出仅原已签两注册profile；`product-os/ui-ux-pro-max/ux-ui-skills`的SKIPPED_UNREGISTERED明确不属于此静态门。原board futureUnknown skipped=1是有效业务断言，不是测试跳过。

## 5. 依赖、辅助输入与资产边界

[package-dependencies](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/package-dependencies.json)/[dependency-after](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/dependency-after.json)声明原U4复制13579普通文件/1030内链、shared/external/changed/extra为空；本角色重新读源/目的并集核 bytes/hash、inode及链接，亦无缺失/多余/漂移/共享/外链。DOM1595文件/2内链同样符合原[DOM复制声明](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/dom-dependencies.json)，当前只读核对成立；无单独DOM after封存记录，不能扩大成完整历史持续监控。

515之外实际还有旧U4复制的根docs36文件、vendor252文件、包docs2文件；当前与旧源逐字相等。本角色在审证JSON补记读时树摘要，**不把它们伪装为Main原515或39项封存的一部分**。用于测试的Board/F2/F2-backup/F5及F5完整三文件侧车与旧U4逐字相等；A11固定外部22byte原件SHA=`87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`，测试读原件并断言SHA。这是旧只读fixture依赖，不是活业务；不宣称本包无需仓库外fixture可在任意机器复跑。

原verify stdout五个WATCH路径全在**r2冻结根**且均缺失；before/after各5条MISSING、污染0，结合guard自测只证明这些缺失根未被默认verify污染及guard判别机制。没有读取正式 data/附件或服务，不能据此签“5份正式文件零变化/主机全盘零污染”。Main旧lib463、U4旧lib453及当时515包输入的close保护另列，不混为WATCH资产。

[原r1纠正](../../reports/all-pending-evidence-20261021/CombinedRepairR1/facility-r1-correction.md)、[原build.command](../../reports/all-pending-evidence-20261021/CombinedRepairR1/build.command.json)、[stdout](../../reports/all-pending-evidence-20261021/CombinedRepairR1/build.stdout.txt)/[stderr](../../reports/all-pending-evidence-20261021/CombinedRepairR1/build.stderr.txt)确认：pnpm复制身份触发重建node_modules、下载333包、esbuild postinstall后build exit0。r1不作最终依赖身份；r2新freeze直接工具和原依赖复制成立，但不能因此把整个批次写成无install/网络/warning。

## 6. stderr定位与阻断判断

| 原日志 | 核查与有限判定 |
| --- | --- |
| TaskTable缺key | r2 `sidecar-minimize-retention`出现，旧U4同类原warning存在；tasks.tsx/panel.tsx未变，SM01原12断言全执行。保留既有告警，不据warning新增或豁免产品缺陷，不签运行态长时渲染 |
| MaxListeners 11 keydown | 旧U4有同原warning，本轮单fork/EventTarget复用；既有相关源码未变，未见新失败。不能由静态读取定案真实内存泄漏根因，未提高listener上限或压日志 |
| detached tree + requestAnimationFrame未定义 | 旧U4原stderr同两条；本轮panel-checklist-toggle两assertion组全passed，其测试stub window/document但无全局rAF，产品DrawerPanel未变。定位为既有renderer/卸载设施边界；不签真实浏览器焦点/卸载无异常，也不当新产品修复已完成 |
| unknown Error/空AggregateError | 新command用例明确注入未知异常，核返回不泄漏原文/路径，11项passed；与Cycle原门一致。console.error保原栈，不把栈当command泄漏 |
| preview register冲突 | 原负例要求ok=false，15项passed；是预期拒绝，不冒路由已可用 |
| verify故意写失败/非法URL/缺记录/EEXIST | 原源码注入与拒绝、补偿/回滚断言对应，95原退出0；不是删除stderr后凑绿，亦不把所有未来同类错误一概豁免 |

上述定位同时依据原JSON、既有测试源码和旧U4专家报告/原stderr；未发现需要由本轮新开产品缺陷的证据。原警告、设施失败、历史必要红全部保留。

## 7. 精准继承与未签门

| 原门/接缝 | 本候选对应 | 继承与停止范围 |
| --- | --- | --- |
| [Cycle独立](cycle-feedback-independent-retest-20261022-r1-report.md) | tasks/command/ResultCard及2测试，五SHA与107相等；typed原因→命令→显式error/权限建议接缝 | 有限SOURCE/AUTO10/29/134保；新全回归11+18及受影响原测试再绿。新O3可见具体原因/保稿/零写/retry不签 |
| [ATF独立](ai-terminal-independent-retest-20261022-r1-report.md) | ai-client+terminal测试两SHA相等；真实finish先判、分型及停链接缝 | 有限8/10/43/175和legacy/noEmit保；原独立用例未搬进本src不算漏测，本轮43重跑。新bundle认证/限流/部分失败/取消/恢复/GUI13不签 |
| [MaterialRef独立](material-progress-ref-independent-retest-20261022-r1-report.md) | 组件+新DOMtest两SHA相等；checked同步快照、当前journal每render重算 | 原7/新5/affected194保；本轮DOM5重跑。真实shell/native chooser/TaskForm一次主save/J03完整旅程不签 |
| [U4原总门](a13-u4-gui-total-retest-r2-20261022.md) | manifest九文件SHA全等，排序/列显隐/持久化/任务grid/CSS、panel入口未变 | 保原候选RA-U401/U402有限已签事实及未变源码接缝，不要求重采32旧GUI；**不移签新client下载/激活**。原回调适配非物理点击边界保 |
| [HC01 SOURCE/AUTO](a19-habit-card-wrap-independent-retest-20261022.md) | panel.css/habits.tsx/card-wrap test三SHA全等；全局CSS本轮无变 | 可保原限定SOURCE/AUTO及后续既有独立签字的原范围；本角色不重签HC01视觉。新bundle运行态另证，不借GM01旧视觉扩大 |
| 材料/文件/报告未变部分 | core task-materials/file store/backup/report/provenance/schema及相应测试、侧车与旧U4相等 | 保已签稳定ID/历史/软删/固定refs/excerpts/安全MD等原限定断言，且本轮相关原测试/verify重跑。共享tasks/command与材料组件已变，主保存、上传回收、双引用/取消接缝必须按新证审；不签MaterialRemaining整包/备份恢复GUI |
| Launcher、vendor静态 | 15条Launcher声明字节相等、无本修入口改动；vendor树字节相等，原静态两profile范围不扩 | Launcher56仅继承原专家已签范围，不造本轮执行；vendor只读引用原静态，不加载/运行skill，不作毕业结论 |

继承的是已验证的**未变行为接缝和原范围**，不是把旧实例变成新实例。任一冻结输入/依赖/config/产物/fixture变化，按受影响面重新认领；历史PASS与新GUI、父goal、commit互不替代。

## 8. 交回与 STOP

**交回Main，释放STOP。** 可领取本报告的有限原回归审证与继承索引，继续已授权的新host/GUI及其他余项并行；没有要求重跑本轮完整回归或锁住主树。Main需另认领新宿主/实际bundle下发/实例与开关，按原合同采O3、ATF、J03等修后证，交不同GUI专家。

本角色不签父全部余项完成、不允许以本报告直接普通commit，不做push/tag/release/正式切换；主服务、旧3257/3258及其他旧实例全部保留，未探活/停止/改配置。未改产品/原证/Git/活业务，也未留下运行中的回归或服务任务。最终对账与普通commit仍由父协调者按各门完成状态处理。

# A18 两项 Verify 接口契约独立报告

> 2026-10-22，trae 独立测试角色，非开发。给 Main 核原红、最小 adapter、反对照与保护；仅签这两项接口 oracle 的有限 SOURCE/AUTO，不签全部验收门或 commit。

## 结论

**两条原静态断言已失效，建议下述准确 adapter；有限 SOURCE/AUTO PASS。原两个脚本仍 FAIL，各 exit1，105/234 行原红完整保留。Main 原95仍93绿2红、guard exit1，不撤销。** 本轮没有改产品或主脚本，没有全95重跑、build/install/GUI/services/credentials/commit；已释放。

在本次完整冻结候选上，新 adapter 两脚本均 exit0，原其他断言逐字不变。真实 PmPanel 补证6、既有独立16、同域62分别全绿；八组反对照均被对应 oracle 检出，其中六组另以同一真实面板用例得到行为断言红，而非导入或设施失败。不把重叠组相加充独立总数。

派单完整保真见 [本次计划](a18-verify-interface-contract-review-20261022-plan.md)。已读 AGENTS/collaboration §9/11、批准 A18 plan、六文件 delta、开发与独立报告及 Main 原 full-verify。具体派单限制覆盖通用开工/收尾流程：不 fetch/pull 在途树、不构建/安装、不写 livingdocs、不提交。只写本 testing 前缀与自有 selftmp；memory 指定入口不存在，仓库为准。没有其他 Agent、vendor 或新产品设计。

## 原因与准确建议

派单摘要称 `publishMessage`，但冻结的实际生产名称仍是 **`setMessage`**，不是另有新 publisher。它已经不是旧 `useState('')` 的 setter，而是同次发布 `{ message, context, generation }` 的包装器：

- 甘特原105行要求 `catch ... setMessage(error`，实际为无条件 `setMessage(prefixFeedbackOnce('执行失败', error), { kind: 'error' })`。原完整 Error.message/String(error) 与一次前缀仍在；新增显式类别使原因中的成功/动作标记不反转、不吞全文。不能要求去掉 prefix 或 context 来迁就旧 regex。
- UI反馈原234行要求 `classifyFeedback(message)`，实际 FeedbackToast/ResultCard 都为 `classifyFeedback(message, context)`，而 context 来自真实 PmPanel 同一 feedback state。只把正则改成可选第二参数会漏掉假的 context、quiet 吞错、状态未存 context、组件未接线等回归。

**Main 可接受的最小写面**：只在 `scripts/verify-gantt-drag.mjs` 与 `scripts/verify-ui-feedback.mjs` 各加一条 import、替换一条旧断言；新增 `scripts/feedback-context-contract.mjs` 为本次 helper 的逐字内容。无需产品改动、无需 package/lock 或新依赖。TypeScript 已是现有开发依赖，只用 parser 不编译、不 emit。

```diff
+import { verifyCatchFeedback } from './feedback-context-contract.mjs'
-assert.match(runBlock, /catch \(error\)[\s\S]*setMessage\(error/,
-  'run catch 必须仍 setMessage——quiet 不得吞掉全局错误提示')
+verifyCatchFeedback(panel, join(here, '..'))
```

```diff
+import { verifyNoticeContext } from './feedback-context-contract.mjs'
-assert.match(panelSrc, /classifyFeedback\(message\)/, 'Notice 须经 classifyFeedback 分型，不整体平铺')
+verifyNoticeContext(panelSrc, join(here, '..'))
```

准确完整diff：`selftmp/r3/adapter-diff-verify-{gantt-drag,ui-feedback}.stdout.log`。原/副本 SHA 和唯一替换契约：`r3/verify-*-adapter-contract.json`。移除 import 并反向替换该唯一断言，即逐字原件；其余断言、fixture、成功quiet、单refresh、Gantt内联失败/无失败refresh、并发/ARIA/payload以及原分类纯函数全部执行且不减语义。

helper原件：[独立helper](a18-verify-interface-contract-review-20261022-helper.mjs)，完整 SHA256 `27b834a2786ea6b71615bf6d24dc67888f79321b4bb10160a392e97f225d4e03`。两函数用 AST 核实际 `run` catch 首条无条件发布完整 caught reason/显式kind/error、catch false/不refresh；核 `setMessage` 同一反馈 state 真存 message/context、真实 FeedbackToast/ResultCard 接同一 feedbackContext、两组件消费实际参数并传生产分类器。结构要求是当前已批准接口的保守冻结，未来有意重构须重新独立审 oracle，不声称任意等价实现均可自动识别。

helper 名必须是 **`feedback-context-contract.mjs`，不以 `verify-` 开头**。Main现发现器只收 `verify-*.mjs`（扣guard/real-model），本次 `proposed-discovery.json`核新增helper后目标清单仍与原95逐字一致。自有 `.adapter.mjs` 文件只留本 testing tmp，不移入 Main scripts；否则也会增加目标。

## 实际验证

环境：macOS Darwin24.6.0 arm64，Node22.23.3；既有 pnpm11.28.5 依赖只读，未执行pnpm。env白名单 PATH/HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME/LANG/TZ/CI/NODE_DISABLE_COMPILE_CACHE，测试仅追加自有TF_OBSERVATIONS，git仅追加GIT_OPTIONAL_LOCKS=0。无凭据继承。node禁compile cache，Vitest `--no-cache/cache:false/node/单fork/1worker`，所有HOME/cache/tmp位于自有r3。只mock宿主execute/clipboard/浏览器globals，不mock产品、不自建状态模型、禁止网络。

| 命令/组 | 原exit | 结果/覆盖 |
| --- | --- | --- |
| `original-verify-gantt-drag` | 1 | 原105行AssertionError，FAIL保留 |
| `original-verify-ui-feedback` | 1 | 原234行AssertionError，FAIL保留 |
| `adapted-verify-gantt-drag` | 0 | 全原静态/纯函数断言及新catch契约执行 |
| `adapted-verify-ui-feedback` | 0 | 全原静态/纯函数断言及新生产context接线执行 |
| `real-panel6` | 0 | 6绿/0红/0pending |
| `previous-independent16` | 0 | 16绿/0红/0pending，原TF-X08精确正文/代际/复制/timer等 |
| `same-area62` | 0 | 62绿/0红/0pending，当前三个同域原文件 |
| `final r3` / `check` | 0 / 0 | 完整保护、原证审计、原95索引审计、PID与释放 |

`IV-01`实际挂载 PmPanel→TaskTable.run→真实ResultCard/FeedbackToast，普通/quiet × marked Error/opaque string：false、解锁、完整含空白原文显示/复制、role alert/assertive、20秒持久、无toast/无错误动作、失败只snapshot+一次写命令无refresh；`IV-02` quiet成功一refresh不发布新全局消息；`IV-03`同字符串正常成功清context、保默认string成功信封/TTL3000/action/toast。

| 自有反对照 | 甘特adapter exit | UIadapter exit | 同一IV-01动态结果（exit均1） |
| --- | --- | --- | --- |
| `historical-a17` 开发before-r1三个产品文件逐字原样 | 1 | 1 | 0绿4红 |
| `old-broken` catch移除显式context | 1 | 0 | 0绿4红 |
| `quiet-swallowed` catch加quiet条件 | 1 | 0 | 2绿2红，quiet错误必红 |
| `reason-lost` 截断caught reason | 1 | 0 | 0绿4红 |
| `notice-context-missing` Toast分类不传context | 0 | 1 | 2绿2红，marked出现错误toast |
| `card-context-missing` ResultCard分类不传context | 0 | 1 | 2绿2红，marked错误card失效 |
| `card-disconnected` JSX改context=undefined | 1 | 1 | 未跑动态，仅静态负例 |
| `context-state-lost` publisher不存context | 1 | 1 | 未跑动态，仅静态负例 |

每组动态仅过滤 IV-01，其余2项pending不记PASS。静态负例中另一脚本0只说明不属该oracle范围，不当成该负例通过。六组负例均有test reporter行为failureMessages/用例名，真实历史三文件与before-r1逐字相同；所有单行变体只改自有副本，逐个完整diff和指纹见 `counterexamples.json`与各 `mutant-*`日志。

完整可复制入口（仓库根、macOS；子进程由执行器重设白名单）：

```sh
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-verify-interface-contract-review-20261022-run.mjs freeze r3
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-verify-interface-contract-review-20261022-run.mjs original r3
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-verify-interface-contract-review-20261022-run.mjs adapted r3
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-verify-interface-contract-review-20261022-run.mjs final r3
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-verify-interface-contract-review-20261022-check.mjs
```

r3阶段退出均0，其中original阶段0只是执行器确认捕获两个预期原exit1，**不把原脚本改记0**；diff exit1为预期差异。准确全部argv/cwd/env/PID/时间/原exit/signal/stdout/stderr/reporter见 `final-r3/commands.json`与 `review-r3/review.json`。执行器拒覆盖已有轮；复现另选未用轮次，并另建check输出，不覆旧证。

## 候选、保护与交回

基线 HEAD/origin `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`不单独代表dirty候选。完整388源文件/src/scripts/package/lock/配置认领在r3 candidate/manifest/tracked binary patch/new-input manifest，与既有独立A18产品一致；六文件delta与批准记录一致，classifier缺省分支全文逐字旧版。最终主完整输入与 Main `/private/tmp/pmtool-a18-closure-20261022`完整输入相同、其sourceHashes/453artifacts均匹配声明。lib仅复制既有Main产物，无build或共享输出写入。

| 证据 | SHA256 |
| --- | --- |
| candidate.json | `3c3fd5d8a3c7fa5d02fae454433a779479f82772e7e31aa8e2e0498815a9f844` |
| 完整frozen-inputs.json | `e0f2c6ee187843ed9184b3016705817c3cb67ddea95ecb50a3d14cb87ebc06f8` |
| summary.json | `bd1e6cd996589efe644ed1f48cb8a384e3e6a9e842d8e6f94cacb03c68bc2fc6` |
| 甘特完整adapter diff | `ea1d006cc3cd7427159641356a4832606bebfacc35433f40f6d56b47a72274b2` |
| UI完整adapter diff | `e5d5bf193feebf50e63b96601685352ec0964319514ccc2a8dfc44c36b636f7a` |
| 甘特原红stderr | `97433d40e0182aec0ac4e012ffe311de56e2ace846c8948a13aa7a3c98f6b21f` |
| UI原红stderr | `270a18c7dc8972468139d002195aeb88e40f5aa15545d68ddbce6eee19b43900` |

`final-r3/final.json`、`review-r3/review.json`：保护56根（有重叠）、`protectedDrift={}`、`frozenDrift={}`、`frozenLibDrift=[]`、`testsDrift=[]`、`liveDrift=[]`、`noRecordedChildren=true`、`released=true`。包括完整主输入/主lib、Main A18输入/lib、所有本轮引用A18原开发/独立证据、原两脚本及Main full-verify日志、实际依赖与声明既有cache。仅这些声明根零漂移，不声称全盘零写。Main新GUI/selfruntime不纳零写根、不访问服务/凭据、不误报其合法新增。精确ps exit1/空输出证明记录PID已退出，不杀任何服务。

首轮r1原红/二adapter绿/7反对照/6+16+62及最终保护全保，但helper初名`verify-...`会增发现目标，**不作为最终推荐**。独立改名另开r2；其freeze因Main同步pin后输入已完全一致而执行器仍要求一处package差异产生设施exit1，候选/日志未覆盖，不是产品失败。r3纠正该自有检查再完整冻结、原红、全部新绿/8反对照与收尾。r1完整sealed目录复核不变；r2完整残留清单已存，不删旧轮。

**Main下一步**：自行决定采纳上述两脚本唯一断言替换与非verify前缀helper，审新tracked diff；使用同一候选的完整95重跑和保护重新取得证据。不要复制自有adapter文件名、不要改产品迁就旧regex。本轮没有全95新结果、GUI/样式/UX/读屏/真实网络恢复/宿主下发审签，不替其他专家签门；全部积压适用门与最后统一普通commit仍归Main后续收口，无push/tag/发布。

# AI 终止错误必要红独立报告

> 给 Main、修复开发与后续独立专家使用：报告 RA-AI06 现合同下真实生产协议的源级必要红和最小修复面。平台 trae；角色独立先行错误分型专家，非开发、非 GUI。2026-10-22。

## 结论

**FAIL_NECESSARY_RED：是真实产品缺陷，不是需要新增全局需求才能成立。** r2 八类协议/反证控制全绿，十项必要红全红；旧验证脚本原样仍绿。本签仅限下述源级缺陷，不签修复后结果、当前服务 GUI、RA-AI06 整项或总门。

| 发现 / 优先级 | 证据与结果 | 现合同违反点 |
| --- | --- | --- |
| ATF-01 / P1：error/aborted 后的部分正文被当成功 | N02、N08-partial 实际返回 `{"actions":[{"op":"task.update","id":"t-0001","patch":{"progress":50}}]}`，只调用 first。C08 已由原生产 parser/validator 证明这不是被 parser 自动剔除的乱码；N02 允许的一般错误 fallback 根本没执行 | RA-AI06“无假计划成功”。`attempt` 不读 finish，只读 blocks 并返回。**不声称业务已自动写入**，人工确认/后端守卫仍存在 |
| ATF-02 / P2：硬故障被伪 EMPTY，中文分型/降级及禁止换池失效 | N03 AUTH、N04 RATE_LIMIT、N05 CONTEXT_WINDOW_EXCEEDED、N06 QUOTA 实际都调用 first→second 并返回 HEALTHY_ONLY；N01 一般 error、N07 TIMEOUT、N09 404 全失败实际均报“模型 first 未返回正文；模型 second 未返回正文”，丢失故障类别 | RA-AI06 中文故障诊断，ai-client 现有“限流/容量、鉴权不换池”承诺。硬码的 prepare 抛错控制 C03/C04 却能正确停止，反驳“当前所有失败路径都坏”的扩大归因 |
| ATF-03 / P2：模型已取消仍发新候选 | N08-empty 的真实 aborted finish 后实际 prepare/stream second 并返回 HEALTHY_ONLY；N08-partial 则直接返回部分计划 | RA-AI06 cancel/abort 恢复；不能把取消变成另一份成功请求。仅签模型返回取消协议，不签 UI 取消是否已接到模型 signal |

产品位置：[ai-client.ts:113–125](../../packages/dsh-pm-tool/src/core/ai-client.ts#L113-L125)、[132–167](../../packages/dsh-pm-tool/src/core/ai-client.ts#L132-L167)、[183–194](../../packages/dsh-pm-tool/src/core/ai-client.ts#L183-L194)。

## 协议与精确码

原合法形状是：

```ts
{
  type: 'finish',
  reason: {
    kind: 'error', // 取消为 'aborted'
    failure: { code: 'RATE_LIMIT', message: '429 isolated rate limit' }
  }
}
```

不是 `chunk.finish.kind`，也不是必然 throw。真实 `BlockAssembler.finish` 持有 reason；`blocks()` 在 error/aborted 后仍可保留已收到的正文，保留字节不等于判成功。真实 `LlmRuntime.prepareCall(config, signal)` 返回冻结 controls 的一次性 call；生产 adapter 迭代 throw 也会被 runtime 转成 terminal finish。

| 生产 pi 输入 | 真实 `finish.kind / failure.code` | 签字边界 |
| --- | --- | --- |
| 401/403 authentication failure | error / AUTH | 不冒写 INVALID_CREDENTIAL；产品可兼容映射为该已有内部码 |
| 429 rate limit | error / RATE_LIMIT | 当前稳定码，必须保留限流分类并停候选 |
| prompt is too long | error / CONTEXT_WINDOW_EXCEEDED | 产品已有 CONTEXT_OVERFLOW 别名可以保留，但须接受真实协议 |
| insufficient quota | error / QUOTA | 上游 `QUOTA_EXCEEDED_CODE` 的实际值是 QUOTA，不是 QUOTA_EXCEEDED |
| request timeout | error / TIMEOUT | 最终中文需诚实超时，不另要求每次 TIMEOUT 都禁止 bounded fallback |
| 原生 aborted / caller-aborted error | aborted / ABORTED | 不返回部分成功、不发 fallback；不要求本批扩 UI/API |
| 一般失败 / 404 (no body) | error / PI_AI_ERROR | 404 不新增独立 HTTP404 产品码；可允许通用失败 fallback，不能误报正常空完成 |
| stop 无 content blocks | error / EMPTY_RESPONSE | 区分真正空结果与其他失败，保留有意义的空正文重试 |

生产来源：上游只读 `packages/llm/llm-pi-ai/src/stream.ts:42–64,80–128,216–230`；`llm/src/types.ts:43–68,155–164,443–459`；`llm/src/assembler.ts:89–92,186–190`；`llm/src/index.ts:933–996,1041–1129,1161–1169`。冻结原件见 r2 `frozen/upstream/`，执行 runtime/assembler 为既有生产依赖包，不是 mock。

**次级修复注意**：只补 `throw assembler.finish.failure` 不足以闭环。现 `NON_RETRYABLE/normalizeError` 不接受 AUTH、CONTEXT_WINDOW_EXCEEDED、QUOTA，ABORTED 也不在停链集合；结构化 TIMEOUT 不应依赖其原文恰含 timeout。这是对应真实码的源码兼容缺口，不另立新错误 taxonomy 需求。

## 候选与合法设施

- 基线提交 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；相关 tracked diff 为空，完整插件 dirty 输入另逐文件冻结/认领，**不以 HEAD 代表全候选**。
- 源级测试直接消费冻结 `src/core/ai-client.ts`，SHA256 `08e2a80154acd782db6236eca64be9e899dd1b59c23d2926b7d6bf7069a92950`。
- `copilot.ts` SHA256 `9059ab4de0c46398c180f24a9928f4b2de670fee5a2cdc5d317ea26e5a389c25`。确切 schema：`parseCopilotPlan(text).rawSteps`，`validatePlan(rawSteps,{taskIds:['t-0001']})` 返回 `{steps,rejected}`。t-0001 只作 parser 已有合法 ID 集的纯函数 fixture，**不是已在 Main F6 落库的真实任务声明**。
- 当前主 lib、原 U4r2 lib、自有冻结 `lib/core/ai-client.js` 均为 `c5bb5cf35e5a7de000a4e6023e58277dcd95a4e81614b1ddf4c8e2af40a98611`。这只认领本轮字节，不证明 Main 当前 bundle 激活。
- 测试原件 SHA256 `f5d9f47a8e007f206e2c0534bb0ded4c2b9c686fd949d37b1d74ff27b8413ed9`；真实 pi stream 源 `e3563cc091cc2e6b0c2bdbd4c1614339d7cbb01f747a956931b43f3256e0c640`；真实 dsh-llm 依赖 bundle `aa958631d989ea6ef9b6d0399261e7c52361c8137da33d13cfad6ebd36af41d9`。
- 完整冻结插件 src/scripts/lib/配置/locale；U4r2 既有依赖采用独占普通复制，加只读上游已安装 pi-ai 包副本，共 14394 文件、1031 内部软链。零外链、零共享 inode；没有 build/install，也没写共享缓存。
- 执行环境 macOS、Node v22.23.3、pnpm 11.28.5（版本只读核实）、Vitest 2.1.9、Cordis 4.0.5-alpha.1、dsh-llm 0.2.1-alpha.2、pi-ai 1.0.2。测试 singleFork，min/maxWorkers=1，显式 `--no-cache`；白名单环境仅自有 HOME/TMPDIR/cache/DSH_HOME 等，不继承任何模型凭据变量。
- adapter 只提供合法 pi 事件或结构化 throw；真正运行 `toStreamChunks→LlmRuntime→BlockAssembler→generateDraft`，不 mock prepareCall、assembler、错误映射或 parser。

## 执行与原证

运行环境同上，从仓库根执行：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/ai-terminal-failure-20261022-runner.mjs freeze r1
node docs/testing/ai-terminal-failure-20261022-runner.mjs controls r1
node docs/testing/ai-terminal-failure-20261022-runner.mjs close r1
node docs/testing/ai-terminal-failure-20261022-runner.mjs freeze r2
node docs/testing/ai-terminal-failure-20261022-runner.mjs controls r2
node docs/testing/ai-terminal-failure-20261022-runner.mjs red r2
node docs/testing/ai-terminal-failure-20261022-runner.mjs legacy r2
node docs/testing/ai-terminal-failure-20261022-runner.mjs close r2
```

freeze 用 exclusive-create，已存轮不可重跑/覆盖；复验另开 r3 等新轮。

| 命令 | 原退出码 | 结果 |
| --- | --- | --- |
| freeze r1 / close r1 | 0 / 0 | 封存与释放；必要红未运行 |
| controls r1 | 1 | 3绿/5设施失败，详见 [设施纠正](ai-terminal-failure-20261022-r1-fixture-review.md)，**不计产品红** |
| freeze r2 | 0 | 完整冻结，所用输入保护成立 |
| controls r2 | 0 | C01–C08 共8控制全绿 |
| red r2 | 1 | N01–N09（N08空/部分两个参数）共10必要红全失败 |
| legacy r2 | 0 | 原 verify-ai-client 未改副本仍 PASS；不证明 terminal finish 覆盖 |
| close r2 | 0 | 所用输入、主 lib/U4r2 lib、原用例和依赖零漂移；子进程退出，已释放 |

两个 Vitest 运行用 name filter 分组，各自出现的 10/8 skipped 是另一组，**合起来18项全部执行**，不冒充跳过项 PASS。八类控制内部含多个码/正文分支，不声称只有八条输入。

原证入口：[r2 close](ai-terminal-failure-20261022-selftmp/r2/close.json)、[controls](ai-terminal-failure-20261022-selftmp/r2/controls.result.json)、[必要红](ai-terminal-failure-20261022-selftmp/r2/red.result.json)、[真实返回与候选调用](ai-terminal-failure-20261022-selftmp/r2/red.observations.ndjson)、[候选](ai-terminal-failure-20261022-selftmp/r2/candidate.json)、[封存索引](ai-terminal-failure-20261022-selftmp/r2/sealed-evidence.json)。同目录 command/stdout/stderr 保存 argv、白名单 env、PID、起止时间及原退出码；不吞掉 red 的退出码 1。

旧脚本的盲区：`chunkText` 不带生产协议必需的 index，mock 从 stream 直接 throw；behavior 的 finish 字段没有发为 chunk，也未模拟 runtime 将 throw 转为 terminal finish。原脚本和全部失败证据只读保留，不在本角色修它。

## Main 新封存补证

Main 于本轮结束时通知新 `AIremainingR1/index.json` 已封存506件，并将全包 GUI 交另一独立专家。本角色只读核验错误归因相关88件，不重做 AUTO、不执行 GUI、不签全包；新增 [补证核验结果](ai-terminal-failure-20261022-main-supplement.json)。索引 SHA256 `3fe52ee68461ee19c3144018accd2fc9d5398f5bd030a1f4bd1762cbb84790b0`，相关件按索引逐一验 bytes/hash，并核前后指纹不变。只读 `frozen-gateway-log/`，索引排除的活日志没有读写。

| 原 Main 步骤 | 冻结 BODY 与实际错误响应 | 根回读与本报告用途 |
| --- | --- | --- |
| 26-auth-after | gateway sequence10、11 同一问题，实际接收 deepseek-v4-1-flash-260910→deepseek-v4-pro-ga-260813；fixture=auth，对应已执行网关固定401分支。匹配 requestId/rpcId 的原 RPC 内部 `kind:error`，两模型“未返回正文” | 26-before→26-after 封存根全等；页面 JSON 有相同错误正文。增强 ATF-02，不是旧网关未收到请求的假阳性 |
| 27-rate-after | sequence12、13 同一问题，实际接收同样两模型；fixture=rate_limit，对应固定429分支。RPC 内部 `kind:error`，两模型仍“未返回正文”，不是中文限流诊断 | 27-before→27-after 根全等；页面 JSON 保留错误。增强 ATF-02 限流后错误继续候选的实链归因 |
| 28-normal-recovered | sequence14 首模型，fixture=success，冻结事件 outcome=success；原 RPC `kind:success`，“正常恢复…此次仅只读诊断”，页面记录“模型未给出可执行步骤” | 27-after→28-recovered 根全等；是用户明确正常重试后只读恢复，不证明401/429已正确分型，不撤销必要红 |

原包：`reports/all-pending-evidence-20261021/AIremainingR1/26-auth-after.{json,png}`、`27-rate-after.{json,png}`、`28-normal-recovered.{json,png}` 及对应 `*-roots.json`、`*-events-events.json`；冻结请求/事件与 `executor-gateway-r2.mjs` 已核验。PNG 仅指纹引用，未在本角色做 GUI 目视判定。

证据口径：宿主 RPC 的 HTTP200 只是包着内部业务 error，不是模型401/429。模型侧401/429的依据为真实接收 BODY + 已执行固定响应分支 + 原错误 RPC；冻结 gateway events 只对成功记 outcome，不虚构不存在的401/429 wire-status event。页面 observation.at 早于所采 RPC event.at，因此只用同问题、内容和 RPC ID 做关联，**不编造“新鲜 response 后截图”时间链**；具体 GUI 时序由全包独立专家审。

Main source-binding 为102声明、differences=[]、候选旧 U4r2；该候选 ai-client 源/lib 与本轮冻结 SHA256 一致。`29-page-binding.json` 指明 space13/p3、host24242、gateway26667，是封存时身份，不是本角色探测服务。其 `mainTreeNow="Cycle successor104; not runtime identity"` 明示合法后继：104及仅三产品文件+两测试的改动按负责人新说明保留，**不算本专家污染、不误锁、不替换旧 ai-client 被测身份**。

补证核验命令（同前述 macOS/nvm Node22 环境）：

```sh
node docs/testing/ai-terminal-failure-20261022-main-supplement.mjs
```

原退出码0，相关88件指纹匹配、三段封存根变化均为空。仅 ATF-02 获实际接线补证；ATF-01/03 仍为源级必要红，不将这些 Main 原证升级为本角色 GUI PASS。

## 最小开发交接

1. `packages/dsh-pm-tool/src/core/ai-client.ts`：取正文前检查 terminal error/aborted；使用稳定 failure code 做中文分型并兼容上述既有内部别名；取消停链，硬故障停链，真正空响应/可恢复一般错误仍可 bounded fallback。继续保持 controls 原样、原有120s单候选合同、无原始英文堆栈/凭据泄露。不新增全局 SLA、路由体系或上游改动。
2. `packages/dsh-pm-tool/scripts/verify-ai-client.mjs`：由开发补生产合法 chunk/真实 runtime 反例，保留原正常/prepare 错误控制；或新增官方 ai-client 单测作为等价最小测试面。**本专家没有改产品或原脚本**。

无需进入 CycleFeedback 所有的 tasks/command/ResultCard，也无需先改 ask 命令/UI/存储 schema；如修复后实际 GUI 仍失效，交独立专家按新原证另定最小面，不提前扩大。

Main 已交修设施后真实 gateway 的26/27/28原证，全包506件由另一独立 GUI 专家审；不要求重复本轮 AUTO。开发后新候选重新认领，先复验这些必要红及受影响 AI 入口，再由 GUI 执行端补修后中文降级、busy/abort恢复、故障零业务写。新源码/新 bundle 不继承本轮修前证据为修后 PASS。

## 边界与释放

两份 `/private/tmp/pmtool-ai-remaining-r1-gateway*.mjs` 仅只读理解 fixture：旧版对含 query 的 req.url 直接 endsWith，r2 改用 URL.pathname，支持 Explorer 提出的设施解释；本轮**不运行它们、不验证 live HTTP404 时点**。独立复现的 N09 从真实 pi 映射与生产客户端证明通用 terminal error 会被误 EMPTY，已与网关设施修复分开。

RA-AI06 原真实网络模型项 **NOT_RUN**：本批没有授权/执行其网络动作，不读正式 key。Main 应先核当前合法授权并尝试；未尝试不能直接 MANUAL_PENDING，确需本人动作须实际拦截证据。正常模型来源生成/重校、F6全旅程、数据库完整写根不变量、真实UI取消连线、busy恢复、120s墙钟超时、GUI/样式/UX均不在本轮签字范围，不以源测试替代。Main26/27/28仅引用其限定封存根全等，不推广为全链/全盘零写。

唯一写面为 `docs/testing/ai-terminal-failure-20261022*` 新件与其自有子目录。无产品/其他 testing/living docs/原证/服务/凭据/Git 写；所用主输入和原 U4r2 lib 已核保护。完整生产快照的并行变化只登记，不锁 CycleFeedback 合法变更；本轮 close 时登记为空，也不推广成“全主树绝对零变”。

2026-10-22T10:57:42.375Z close：controls PID30522、red PID31119、legacy PID31582 均已退出；r1 PID28940 亦已退出，`released=true`。不删除冻结、失败或他人在途成果。**STOP：本独立必要红任务已释放，交 Main/独立开发修复；不自行实施或签修后总门。**

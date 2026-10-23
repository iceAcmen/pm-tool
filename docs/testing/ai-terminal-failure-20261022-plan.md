# AI 终止错误分型先行合同

> 记录 RA-AI06 现合同的窄化测试设计，供 Main、修复开发与独立专家交接；不增加全局产品需求，不替 GUI 或总门签字。平台：trae，角色：独立必要红专家，2026-10-22。

## 授权与对象

负责人本次原句摘要保真：“独立先行错误分型合同/必要红专家，非开发非GUI”；“唯一写面docs/testing/ai-terminal-failure-20261022*新件”；“不build/install”；“原cases readonly/失败保”；“Main会新原件，当前可先sourceauto”；“中文释放STOP”。

本批只新增本前缀文件和自有冻结目录。禁止写产品、其他 testing、living docs、原证、服务、凭据与 Git；不运行 `/private/tmp/pmtool-ai-remaining-r1-gateway*.mjs`，不探测或操作 3258/3259、3257/3256/3248/3249/3255 或正式服务。老网关 PID24241 已被 Main 精确终止、新网关 PID26667 为派单事实，不用本批源测试倒证服务状态。

基线 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 不是 dirty 候选身份；冻结完整插件输入、既有依赖及上游相关输入并登记逐文件 SHA256。推断只认领本轮实际消费的 ai-client、copilot parser、上游流映射和生产 LlmRuntime/BlockAssembler 字节，不锁住 CycleFeedback 合法并行修改。禁止 fetch/pull、install/build、共享缓存与全主树“绝对零变”断言。

## 合同依据与精确协议

- `remaining-governance-cases-20261021.md` RA-AI06：故障零业务写、无假计划成功、中文降级/诊断、busy/abort 恢复；正常后续请求；真实授权模型另验。
- `src/core/ai-client.ts`：任何失败归一中文 AiDraftError；限流/容量和鉴权/无适配器不可盲目换池；120000ms 是单候选请求超时，不是 launcher TTL。
- 上游 `llm/src/types.ts`：`{type:'finish', reason:{kind:'error'|'aborted', failure:{message:string, code:string, ...}}}`，不是 `{finish:{kind:'error'}}`。
- pi-ai 原生 `error` 事件携带完整 AssistantMessage；真实 `toStreamChunks` 发 usage 后 finish，生产 BlockAssembler 保存 finish，blocks 保留正文。生产 LlmRuntime 的 prepareCall 是单次、冻结 controls 的真实入口；adapter 的 throw 也被其转为 terminal finish。
- upstream AUTH 不等 INVALID_CREDENTIAL；CONTEXT_WINDOW_EXCEEDED 不等 CONTEXT_OVERFLOW；QUOTA 不等 QUOTA_EXCEEDED。应审精确有效协议，不以自己 mock 的旧码证明已兼容。

## 八类控制与必要红

| 类别 | 控制 | 现合同窄化预期 |
| --- | --- | --- |
| C01 正常输出 | 合法 prepareCall controls、一发 stream、正文加 stop；后续健康请求 | 原文返回，reasoning/maxTokens 一致；不要求新 API |
| C02 空/一般终止错误 | pi error，无正文 / 合法可解析计划前缀后 error；HTTP404 文本 | 不把 error 当正常 EMPTY；有部分正文仍不可冒充成功。可重试一般错误允许后续健康候选，不另规定全部错误不重试 |
| C03 鉴权 | pi 401/403 → AUTH；prepare INVALID_CREDENTIAL/MISSING_CREDENTIAL | 中文凭据类降级，硬错误不换池；允许产品内部 AUTH 或 INVALID_CREDENTIAL 统一码，但必须明确兼容 |
| C04 限流 | pi 429 → RATE_LIMIT；prepare RATE_LIMIT 反证 | RATE_LIMIT 保留，中文限流，禁止换候选放大 |
| C05 容量/额度 | pi context overflow / quota → CONTEXT_WINDOW_EXCEEDED / QUOTA | 分别归现有上下文/额度类，不换池；可统一旧内部码，不要求传播原始报文 |
| C06 超时 | pi timeout → TIMEOUT；runtime throw LlmError(...,'TIMEOUT')；raw TimeoutError → UNKNOWN 只作协议反证 | 结构化超时不能返回部分计划成功或伪 EMPTY；允许 bounded fallback 后成功，失败需诚实中文超时诊断。不新增整体超时 SLA |
| C07 取消 | pi aborted / caller signal aborted error → ABORTED；无/有正文 | 不接受部分计划成功，不再发健康 fallback。这里只测模型取消协议，不声称 UI 的取消已连到模型 signal |
| C08 乱码/计划验证 | 成功 stop 的非 JSON 与合法旧 actions schema | 生产 parseCopilotPlan 拒乱码、接受合法任务更新；客户端无需替 parser 校验每份计划 |

控制只验证设施和现有反例，必要红单独断言产品是否违反现合同。期望不依赖自编错误分类器：采用真实 pi stream 映射、真实 LlmRuntime、真实 BlockAssembler、原生产 generateDraft 与 parseCopilotPlan。确定性 adapter 只提供合法 pi 事件或真实 throw，不 mock assembler、generateDraft、prepareCall、parser 或错误 oracle。

## 步骤与交付

1. 新建冻结轮 r1，完整复制插件 src/scripts/配置/locale/lib，只使用既有 U4r2 node_modules 的独占普通副本；pi-ai overflow 使用只读上游已安装包副本。所有 symlink 必须仅在自有依赖根内，不能共享 inode。
2. 白名单环境：自有 HOME/TMPDIR/DSH_HOME/cache，无凭据变量；Vitest `--no-cache`、singleFork/minWorkers=maxWorkers=1。显式只运行本批用例。
3. 控制组和必要红分开跑；stdout/stderr/result/argv/真实退出码分别以 exclusive-create 保存，不覆盖失败。原 `verify-ai-client.mjs` 原样副本另跑，保留其证据盲区，不当 GUI 通过。
4. 核验冻结及所用未改输入、共享主 lib/原 U4r2 lib、原用例前后指纹；其他生产源的合法并行变化只登记，不泛化为污染或冻结违约。
5. 报告必要红、精确候选和开发最小文件面。不得改产品、修复后复验、自签 GUI、签 RA-AI06 整项、签总门。

本轮不尝试真实网络模型，不读正式 key；其状态为 NOT_RUN，仍由 Main 核合法授权并尝试。只有明确必需本人动作的证据才能标 MANUAL_PENDING，不能因本角色未执行而豁免。

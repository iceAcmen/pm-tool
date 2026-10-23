# AI终止失败与取消分型修复计划

> 2026-10-22，trae，沿全部既有余项验收/确证修复持续授权。依据独立[ATF先行报告](../testing/ai-terminal-failure-20261022-report.md)：8控制绿、10必要红；原文件/失败不改。开发与验收分离，Main唯一builder/GUI；不push/tag/release。

**目标：** 终止error/aborted后不能返回部分正文成功，硬故障按真实协议码中文诊断并停候选，取消不重新发起下一模型。

**方案：** 保留现有generateDraft/prepareCall/120秒/候选列表，取文本前读取真实BlockAssembler.finish；根据现有failure稳定码转换现有AiDraftError。备选一律抛普通Error丢失分类，备选靠英文文本扫描不能稳定识别硬码；用结构化协议最小兼容。未知/正常空结果仍按既有bounded fallback，绝不透出凭据或堆栈。

**环境：** macOS + nvm Node22.23.3 + pnpm11.28.5，现有独占依赖，no-cache单worker。Cycle后继104已由另一开发释放，其SOURCE/AUTO独立在途；本修不进入tasks/command/ResultCard。无需重问已授权确证修复。

1. 开发仅写 `packages/dsh-pm-tool/src/core/ai-client.ts` 和必要同域新单测；可新增真实协议官方tests作为等价最小验证面。`scripts/verify-ai-client.mjs`若改只纠合法协议反例，不弱化旧控制，优先新tests减少范围。独立原testing/cases/report只读。
2. 自有完整冻结先重现原8控制/10红；记录原码AUTH/RATE_LIMIT/CONTEXT_WINDOW_EXCEEDED/QUOTA/TIMEOUT/ABORTED/PI_AI_ERROR/EMPTY_RESPONSE，不能臆造旧别名。
3. `attempt`在返回任何正文前处理finish error/aborted：抛带稳定code的内部错误；aborted停链，不能返回部分可解析计划。正常finish有正文/真正EMPTY沿原正常返回/有界fallback。
4. `normalizeError`兼容真实上游码到既有内部分类，NON_RETRYABLE纳硬故障及取消；TIMEOUT结构码中文超时、是否bounded fallback按原合同，不扩新SLA/UI取消API。
5. 开发自测原专家不可改用例、必要新tests、原verify与精准受影响ai/copilot/capture/provenance路径，在自有输出跑，不build/共享cache/服务/Git写。交增量patch/SHA/保护/完整结果，不自判独立PASS。
6. 不同独立专家自有新冻结复验后，Main合并Cycle与ATF认领新候选、隔离build/必要完整回归，再真实gateway认证/限流/部分失败/取消/正常恢复GUI原证独立审签。旧U4r2/Feedback230/AI506封包不改，不冒旧运行新修。
7. 所有可执行余门闭且总出口签字后才按父授权普通commit，未提交期间继续材料/会议/恢复/B8原范围，正式/旧服务及无关微信成果保留。

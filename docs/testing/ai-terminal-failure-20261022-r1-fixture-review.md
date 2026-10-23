# 首轮设施纠正

> 记录本专家自有 fixture 的失败与纠正，供独立复核；不将测试设施错误判给产品，不覆盖 r1 证据。2026-10-22，trae。

- r1 controls 原退出码 1：3 控制通过、5 失败；10 necessary-red 未运行。五个失败均被 `ctx.dispose is not a function` 清理异常覆盖，不是产品错误分型证据。
- 正确 Cordis API：上游 `packages/llm/llm/tests/service.spec.ts` 使用 `await ctx.fiber.dispose()`，不是 `ctx.dispose()`。
- 另经真实生产 runtime 实现校正 C06：普通 `Error`/`TimeoutError` 非 HarnessError，`harnessErrorCode` 返回 `UNKNOWN`。`new LlmError(message, 'TIMEOUT')` 保留 `TIMEOUT`；pi timeout 则由真实映射产生 `TIMEOUT`。原先将 raw TimeoutError 预期为 TIMEOUT 的 oracle 不成立；取消该错误预期，不修改上游。
- `r1/frozen/docs/testing/ai-terminal-failure-20261022-cases.test.ts`、stdout/stderr/result/command 和原退出码均保留。r1 不执行必要红，不签产品结论；修正只影响本批测试，r2 新冻结重新运行。
- 先行合法 schema 也已读准：`parseCopilotPlan(text).rawSteps`，`validatePlan(rawSteps, {taskIds:[...]})` 返回 `{steps,rejected}`。不使用虚构 `tasks` 输入或 `ordered` 返回值作 oracle。
- 本纠正没有改产品、原用例、原测试证据、主 lib、U4r2 lib、服务、凭据或 Git。

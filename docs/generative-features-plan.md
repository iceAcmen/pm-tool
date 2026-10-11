# 生成型功能立项设计 generative-features-plan.md（评审稿）

> **本文件记录什么 / 给谁用 / 怎么用**：本文件是 pm-tool 三个生成型功能——**①智能 WBS 任务拆解、②会议纪要归纳、③进度汇报 AI 叙述**——的立项设计与技术依据。给项目所有者评审、给后续编码/验收照做。标注「评审稿·待所有者确认开工」。LLM 通道已打通（OpenRouter 免费自动路由 `openrouter/free`，见 `docs/model-providers.md`），本设计把它安全地接到核心台账之上。

---

## 0. 统一设计原则（已写入 ADL-036）

1. **LLM 只做文本生成、不依赖 function calling**：模型每次只产出一段纯文本（Markdown / JSON 围栏块），不挂 `tools`。原因：OpenRouter 免费池**随机分配模型、稳定 function-calling 不保证**（KB-034）。
2. **确定性采集 / 校验 / 落盘全在我方代码**：给模型的输入数字由我方确定性采集（复用 `collectProjectReport` 等）；模型输出只当「草稿」，经我方 Zod/schema 与 `parseTaskChecklist` 校验后，由用户 confirm 才入库。
3. **AI 结果一律是「草稿」，绝不自动改台账**：每个生成动作产出预览，用户确认/编辑后才落盘；无 key 或模型失败优雅降级到手工 / 确定性路径，核心台账始终离线可用。
4. **省额度**：每次生成**只发一次**模型请求；草稿在内存/一次性输出里缓存，重复预览不重复调用；免费档约 50 次/天。
5. **模型显式路由**：pm-tool 命令无交互会话上下文，**显式配置** provider/model（默认 `openrouter-free` / `openrouter/free`），可在 profile `cordis.patch.yml` 覆盖。

---

## 1. 一次性 LLM 调用的真实 API（上游源码依据，已核实）

**范本**：`deepseek-harness/packages/session/session-title-llm/src/index.ts:246-284`（内置「会话起名」就是一次性文本生成，与我们要做的完全同构）。

- **服务**：`ctx.llm`（由 `@deepseek-ai/dsh-llm` 提供，base bundle 已装载，【官方明确】）。
- **最小可照抄骨架**：
  ```ts
  import { createUserMessage, BlockAssembler } from '@deepseek-ai/dsh-llm'

  // provider/model 显式指定；maxTokens 给足（推理型模型会先吃 reasoning tokens，KB-034）
  const call = await ctx.llm.prepareCall(
    { provider: 'openrouter-free', model: 'openrouter/free', maxTokens: 800 },
    signal,
    (controls) => controls,          // 不传 tools / 不挂 function calling
  )
  const options = {
    ...call.config,
    system: systemPrompt,            // one-shot 专用系统提示
    messages: [ createUserMessage({
      content: [{ type: 'text', text: userPrompt }],
      source: { kind: 'dsh-pm-tool-ai' },
    }) ],
    signal,
  }
  const asm = new BlockAssembler()
  for await (const chunk of call.stream(options)) asm.push(chunk)
  const text = asm.blocks().filter(b => b.type === 'text').map(b => b.text).join('')
  // asm.finish.kind: 'stop' | 'max-tokens' | 'error' | 'aborted'
  ```
- **`GenerateOptions`**（`packages/llm/llm/src/types.ts:511`）：`provider`/`model`/`messages` 必填；`system?`（one-shot 用）、`tools?`（**省略=不挂工具**）、`temperature?`/`maxTokens?`/`stop?`/`signal?`、`sessionId?`（**可选**，命令场景省略）、`purpose?`（普通 one-shot 不设）。
- **结构化输出**：靠「系统提示要求模型输出 Markdown 缩进勾选清单 / ```json 围栏」+ 我方**防御性提取**（剥围栏、容错解析）。【待验证】pi-ai 是否透传 OpenAI `response_format`；保守起见**不依赖**强制 JSON mode，免费模型也不稳定。
- **错误归一**（`packages/llm/llm/src/error.ts`）：失败抛 `LlmError`，`error.code` 机器可读：`RATE_LIMIT` / `QUOTA` / `ACCOUNT_QUOTA` / `INVALID_CREDENTIAL` / `CONTEXT_WINDOW_EXCEEDED` / `EMPTY_RESPONSE` / `NO_ADAPTER`；源码注释明确「**按 code 路由、勿解析 message**」。优雅降级 = `try/catch` 后按 code 给中文提示（如「免费额度已用完/今天请明天再试」「未配置 OPENROUTER_API_KEY」）。
- **模型继承说明**：dsh 把「当前选中模型」绑定在交互会话上，**未对外暴露「默认模型」解析服务**（grep 无 default/current route，【源码推断】）；故 pm-tool 命令显式指定路由（与 session-title-llm 的 `config.provider`/`config.model` 配对覆盖同一机制，【官方明确】）。

---

## 2. 三功能设计

### 2.1 智能 WBS 任务拆解（建议先行）
- **用户流程**：`/pm task wbs <projectId> <一句话目标/需求文本>` → AI 产出 Markdown 缩进勾选清单 → **复用现有 dry-run 预览** → 用户在输出里看到「将创建哪些任务（树形）」→ 加 `confirm` 才落盘。
- **命令语法**：
  - `/pm task wbs <projectId> "<目标文本>"`：生成并 dry-run 预览（**调用一次模型**），不落盘。
  - `/pm task wbs <projectId> "<目标文本>" confirm`：同一文本重新生成并直接落盘（或在预览基础上追加 confirm；为省额度，实现为预览即生成草稿，`confirm` 复用内存草稿）。
- **复用落点**（`packages/dsh-pm-tool/src/core/task-import.ts`）：`parseTaskChecklist(markdown)`（缩进→树，KB-031）、`planTaskImport(domain, projectId, markdown)`（dry-run 计划）、`importTasksFromMarkdown(...)`（confirm 落盘）。**不新增任务表结构**。
- **提示词策略**：系统提示要求「只输出 `- [ ]` 缩进勾选清单，第一行为最高层任务，不要解释、不要代码围栏外的文字」；目标文本作 user message。
- **防御解析**：模型输出先 `parseTaskChecklist`；若解析出 0 条，判为 `EMPTY_RESPONSE` 类失败，提示用户「模型没产出可用清单，请换说法重试或手工用 `/pm task add`」。
- **降级**：无 key / `INVALID_CREDENTIAL` / `RATE_LIMIT` → 中文提示 + 引导到 `/pm task add` 手工；核心任务 CRUD 不受影响。
- **验收**：离线命令生成草稿→预览树形正确（缩进层级与 `planTaskImport` 一致）；`confirm` 后任务入库、编号/父子关系正确；无 key 时降级提示不崩；新增 `scripts/verify-wbs.mjs`。

### 2.2 会议纪要归纳
- **用户流程**：`/pm meeting summarize <projectId> "<粘贴的原始速记/录音转写文本>"` → AI 归纳为 **议题 / 结论 / 行动项(标题·负责人·截止日)** → 预览成 meeting 草稿（title/summary/topics/decisions/actions）→ 用户 `confirm` 存为一条 draft meeting。
- **命令语法**：`/pm meeting summarize <projectId> "<速记>" [confirm]`。
- **复用落点**（`core/meeting.ts`）：meeting 实体已自带 `summary`/`topics[]`/`decisions[]`/`actions[]`（行动项含 title/owner/dueDate），并预留 `sourceType`/`sourceSessionId` 来源字段（注释「生成型来源字段仅预留」）。AI 输出映射到既有 `meetingCreateSchema`，**不新增表**。
- **提示词策略**：要求输出 ```json 围栏，结构 `{title, summary, topics[], decisions[], actions:[{title, owner, dueDate?}]}`；dueDate 尽量相对日期（本周五→我方在解析期转为 ISO）。
- **防御解析**：剥 ```json 围栏 → `JSON.parse` → 用 `meetingCreateSchema` 子集 Zod 校验；校验失败则降级为「把原文塞进 summary 的 draft」并提示用户手工补。
- **降级**：模型失败 → 提示可手工 `/pm meeting add`；既有 meeting CRUD 不受影响。
- **验收**：归纳出的行动项负责人/截止日能落到 actions[]；confirm 后 meeting 入库为 draft、可被 `/pm meeting list/get` 读到；新增 `scripts/verify-meeting-ai.mjs`。

### 2.3 进度汇报 AI 叙述
- **用户流程**：`/pm report narrate <projectId>` → 我方**确定性采集**该项目数据（复用 `collectProjectReport`）→ AI 只基于这些数字写「本周进展 / 风险 / 下周计划」叙述段落 → 预览 → `confirm` 把叙述**并入**该项目 R9 固定快照（report 记录的叙述字段）与 Markdown 导出。**AI 不改动任何台账数字**。
- **命令语法**：`/pm report narrate <projectId> [confirm]`。
- **复用落点**：`core/report.ts` 的 `collectProjectReport(domain, projectId)`（确定性采集）+ `renderProjectMarkdown`；`core/progress-reports.ts` 的 `generateProgressReport`（固定快照）。
- **提示词策略**：把确定性采集到的 JSON（任务总数/完成率/逾期/未关闭风险/临近里程碑）作为 user message，系统提示「只用我给的数字写三段中文叙述，不要编造数字、不要输出 JSON」。
- **防御**：叙述为纯文本段落，不参与数据校验；落库时只写进 report 的 `aiNarrative`（新增可选字段，nullable，不影响既有快照 schema）。
- **降级**：模型失败 → 仍能生成**无叙述**的确定性快照（既有 `generateProgressReport` 行为不变），提示「AI 叙述暂不可用，已生成确定性快照」。
- **验收**：narrate 输出的段落数字与 `collectProjectReport` 一致；confirm 后 report 的 `aiNarrative` 可被读、导出 Markdown 含该段；失败时确定性快照照常生成；新增 `scripts/verify-report-ai.mjs`。

---

## 3. 推荐开发顺序与理由

1. **先做智能 WBS（2.1）**：最能体现「AI 直接产出可落盘结构」，且**完整复用**现成 `task-import` dry-run/confirm 链路，落盘路径零新代码，风险最低、最快能演示。
2. **再做进度汇报 AI 叙述（2.3）**：最安全——输入是我方确定性数字、输出是纯文本段落、失败时退化为既有确定性快照，几乎不碰数据结构。
3. **最后做会议纪要归纳（2.2）**：涉及 JSON 围栏解析 + 行动项负责人/日期归一，防御解析最复杂，放在前两个把「一次模型调用 + 草稿确认 + 降级」模式跑顺之后最稳。

## 4. 文件级改动计划（packages/dsh-pm-tool/src）

- **新增 core**：
  - `src/core/ai-client.ts`：封装「一次模型调用」（`ctx.llm.prepareCall` + `BlockAssembler` + 按 `error.code` 归一为中文错误），默认 provider/model 可配置；供三个功能复用。
  - `src/core/wbs-ai.ts`：目标文本→系统提示→模型输出→`parseTaskChecklist`/`planTaskImport`。
  - `src/core/report-narrate.ts`：`collectProjectReport`→构造 user message→模型输出三段叙述。
  - `src/core/meeting-summarize.ts`：速记→```json 围栏→`JSON.parse`→meeting 草稿校验。
- **改 commands**：`task.ts`（加 `wbs` 子命令）、`meeting.ts`（加 `summarize`）、`progress-report.ts`（加 `narrate`）；`index.ts` 的 `inject` 增加 `'llm'`、help 文本补三行。
- **改 package.json**：`peerDependencies`/`devDependencies` 增加 `@deepseek-ai/dsh-llm: 0.2.1-alpha.2`（沿用 ADL-034 版本锁定）。
- **Web（后置，可放第二里程碑）**：`client/panel.tsx` 为三功能各加一个「AI 生成草稿」按钮（调已有命令/新 route）；v1 先保证斜杠命令。
- **新增 verify**：`scripts/verify-wbs.mjs`、`scripts/verify-report-ai.mjs`、`scripts/verify-meeting-ai.mjs`（离线注入 mock llm adapter，断言「生成→草稿→confirm 落盘」与「失败降级」）。
- **文档**：本设计稿、requirements R13/R14/R15、ADL-036、changelog/progress/handoff/onboarding。

## 5. 里程碑验收方式（每个功能）

离线命令（生成/预览/confirm）+ 持久化（草稿确认才落库）+ 专项 `verify-*.mjs`（含 mock 成功与失败降级两条路径）+ `pnpm run build` + 全部 verify 退出 0 + `git diff --check`；再用隔离 DSH_HOME + 系统 Chrome（KB-032）做一次真实浏览器冒烟（Web 入口若已做则点按钮，否则验证命令输出在面板可用）。真实模型调用每个功能**只在最终演示时发 1 次**（省免费额度），专项 verify 用 mock adapter。

## 6. 需要所有者拍板的决策点（v1 默认推荐）

1. **v1 是否只做斜杠命令、Web 按钮后置**？——推荐：**是**（先把命令链路跑稳，Web 按钮第二里程碑）。
2. **AI 结果是否一律草稿、confirm 才入库**？——推荐：**是**（绝不自动改台账）。
3. **三功能排序**？——推荐：**智能 WBS → 进度汇报叙述 → 会议纪要归纳**。
4. **默认模型路由**？——推荐：固定 `openrouter-free`/`openrouter/free`，可在 profile 覆盖；不为免费随机模型做工具调用。

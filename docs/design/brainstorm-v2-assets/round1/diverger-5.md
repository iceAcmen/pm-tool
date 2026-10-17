# D5 · 阶段1 开放发散 · 第1轮盲发（diverger-5）

> 规则自觉：无视角、无评分、无批评、无可行性筛选；以下每条都照单全收，不写「不可行/太复杂」。
> 素材全部来自本人对插件源码、`docs/`（已避开两份禁读文件）与宿主包 README/cookbook 的自行阅读。
> 标注约定：【反向/不融合】【疯狂】为自愿标记，便于后续阶段分拣，不代表评价。

---

## D5-01 只读工具进 agent loop：让对话里的模型能「查台账」

- **机制**：用 `defineTool` 向宿主工具注册表注册一批**纯只读**工具（`pm_board` 看板总览、`pm_search` 关键字检索、`pm_task_get` 单任务、`pm_milestones`、`pm_risks`），schema 自动进系统提示词、自动校验；模型在对话循环里可以调用它们读台账，**不注册任何写工具**。
- **具体场景**：PM 在 dsh 主对话里随口问「官网改版项目现在卡在哪？谁手上有逾期任务？」，模型自己调 `pm_search`/`pm_board` 拿到真实记录，用中文回答并把相关任务 id 引用出来；PM 全程在聊天窗口完成「查台账」，不用先切到面板、也不消耗 `/pm ask` 的一次性草稿配额。台账一个字不改。
- **触点**：`ctx.tools.register` / `defineTool`（cookbook `adding-a-tool.zh.md`）；只读消费现有七表，不写库；与现有 `/pm search`、`/pm stats` 同一套确定性纯函数（`core/search.ts`、`core/stats.ts`）。
- **来源观察**：现状全仓零 `ctx.tools.register`（问题框定 §0 共识5、事实包 §3）；模型与台账完全隔绝，连「读」都做不到；R2 把「模型只读面」列为待开启空间。

## D5-02 写工具走 approval seam：聊天里一键批准草稿，台账仍是唯一事实源

- **机制**：注册一个 `pm_propose` 写草稿工具，模型产出的 `task.update/milestone.create/risk.create` 动作**不落库**，而是经 `tools/pre-execute` 返回 `ask`、走 `ctx.approval` 一次性审批 seam 推给 PM；PM 在聊天里点允许/拒绝后，由插件自己的串行写队列落库，拒绝与纠正都记入溯源台账。
- **具体场景**：模型在对话里说「我建议把 t-0007 标为 in_progress、负责人改为张三」，聊天里弹出一张审批卡（动作、影响字段、依据哪条记录）；PM 点「允许」才落库，点「拒绝」模型看到拒绝原因，下次不再提；整条链路模型从不直接写库。
- **触点**：`tools/pre-execute` 门禁返回 `ask`、`ctx.approval`（extension-cookbook「权限系统 / AskUserQuestion」行）；写库复用现有 `enqueueDomainWrite` + ask-apply baseline 乐观并发（`docs/product/11` §审计、`commands/ask.ts`）。
- **来源观察**：现有草稿确认制（C3、ADL-036、`ask-copilot.ts`）只存在于面板内；approval seam 是宿主现成的「运行中 agent 暂停等人类决定」能力，目前零使用；R2 的 HITL 契约可直接落在这条缝上。

## D5-03 【疯狂】把看板摘要「推」进系统提示词：模型不调工具也看得到项目现状

- **机制**：用 `ctx.systemPrompt.section()` 注册一个持久、模型可见的上下文段，内容是插件确定性派生的精简看板（逾期 N 条、临期里程碑、高影响未关闭风险、下一个里程碑日期），每轮请求自动带上；模型不需要任何工具就能在回答里引用现状，段内容随读时派生刷新、不落盘、不进会话历史。
- **具体场景**：PM 开一个新会话随口说「帮我看看这个项目这周怎么安排」，模型一上来就知道「3 条逾期、M2 三天后到期、风险 R-0002 未关闭」，直接在回答里点出，而不是说「我没有项目信息」；会话压缩（compaction）后该 section 仍在，因为它是装配段而非历史消息。
- **触点**：`ctx.systemPrompt.section()`（extension-cookbook「系统提示词可配置性」行；`context/agent-instructions` 是同机制先例）；派生复用 `core/derived.ts`、`core/health.ts`、`core/reminders.ts`。
- **来源观察**：现状模型对台账零可见（无事件、无工具、无上下文）；context 包的定位就是「不定义工具、为每次请求添加持久且模型可见上下文」，目前完全未用；与 D5-01 的拉取式相反，这是推送式单向投影。

## D5-04 监听会话轮次结束，把 workspace-changes 的 git 快照变成「执行证据草稿」

- **机制**：插件 `ctx.on('session/event')` 监听轮次结束，读取宿主 `ctx.workspaceChanges.summary(sessionId, seq)` 与逐文件 diff；按任务上的 `repoUrl/branch`（PROD-21 已有字段）做仓库/路径匹配，把「本轮改了哪些文件、多少行」合成一条只读证据草稿，挂到匹配任务的证据区，PM 确认后才在任务上留痕。
- **具体场景**：PM 在某个会话里让 agent 把登录接口联调完，轮次结束后面板对应任务旁出现一条建议「本轮在 `feature/login` 改了 6 个文件，是否把 t-0003 标记为进行中并附上文件清单？」；PM 点确认，证据进台账，不点就只是提示。
- **触点**：`session/event` 监听（extension-cookbook「遥测/可回放 trace」行）；`deliverables/workspace-changes` 的 `summary()/diff()`（其 README §使用本包）；任务 `repoUrl/branch` 字段（`core/repo.ts`、requirements v0.6 PROD-21）。
- **来源观察**：UX-11「台账↔Git/MR 两张皮」是唯一未被面板内改进解决的断点（问题框定 §0 共识4）；workspace-changes 已经替每轮记录 git 工作树快照+整文件捕获+diff，是现成的证据管道，插件从未消费；注意它只记文件工具编辑与 git 快照，shell 改动不出现。

## D5-05 用 session-query 回捞历史会话，给周报/纪要提供「过去说过什么」的只读候选

- **机制**：接入 `ctx.sessionQuery`（需 sqlite 后端），在生成周报草稿或会议归纳时，按项目名/负责人/关键字 `searchSessions/searchEvents` 捞取最近 N 天的会话片段，作为只读候选列给 PM，由 PM 勾选哪些进快照/纪要，模型不直接改写台账。
- **具体场景**：周五下午 PM 生成本周报告时，插件列出「本周会话中提到『支付改造』的 4 个片段（来自 3 个历史会话）」，PM 勾两段贴进已完成事项；周报快照仍是冻结的，片段只是素材。
- **触点**：`packages/session-query/session-query`（listSessions/readSession/filterEvents/searchSessions，FTS 需 `session-query-sqlite`）；只读，不落盘；与 R9 冻结快照、R15 纪要归纳并存。
- **来源观察**：`meeting` 实体预留了 `sourceType/sourceSessionId` 形状但「不读取会话、不调用模型」（ADL-025 边界）；现状台账与历史对话零联动，而 PM 真实工作散落在过去几十个会话里；session-reference 包也提供「引用其他会话有界快照」的先例。

## D5-06 借宿主 schedule 做周期周报/例会触发，自己不养常驻定时器

- **机制**：不做自己的 daemon，而是调用宿主持久 `schedule` 服务，按 weekly/cron 规则把一条 prompt 投递回原会话（如每周五 17:30「生成本周项目快照草稿」）；到期由宿主冷会话恢复、投递一条 followup 消息，插件再走现有确定性快照+narrate 草稿链路。
- **具体场景**：PM 周日早上打开 dsh，发现周五傍晚自动投递了一条「本周官网改版快照草稿已生成，待确认」，点开面板确认落库；dsh 没开的时段由宿主补发最近一次（schedule README「每个重复任务只补发最近一次错过的发生时点」）。
- **触点**：`packages/schedule/schedule`（daily/weekly/cron/at/after_seconds，`schedule_create/list/update/delete` 工具，持久定时器属宿主）；注意它投递需要 Web Session controller + 持久化后端、headless 不可用，且投递的是消息不是系统通知。
- **来源观察**：R11 提醒与周期触发被 ADL-032 暂缓，理由是「常驻调度与离线优先冲突」；但 schedule 是**宿主拥有**的持久定时器，插件自己零常驻进程，这是对 ADL-032 原始顾虑的另一种解；ADL-039 已用「打开面板即派生」覆盖提醒，周期触发是另一个诉求。

## D5-07 【疯狂】给每个项目开一个专属 PM subagent 长会话，副驾在独立线程里常驻

- **机制**：通过 `ctx.subagents` + spawn-in-process 后端，为选定项目委派一个带台账摘要种子的子 agent；PM 在子线程里连续追问、让它做多轮诊断，子 agent 只回诊断与草稿提议，写动作仍回主线程走 ask-apply 确认；子级保留持久会话可继续对话。
- **具体场景**：PM 为「官网改版」开一个 PM 专员子线程，连续问三轮「延期风险？谁过载？把排期拉一下」，子线程记得前面的上下文，最后给出一组批量调整草稿；PM 回到主面板一次性确认。
- **触点**：`packages/subagent`（spawn/fork-in-process、`dsh-tool-subagent`，子级保留持久会话接受后续消息）；种子内容复用 `buildAskContext`（`core/ask-copilot.ts`）。
- **来源观察**：R4 直指「subagent 设计前提是多 agent，单机单写者有没有调用主体存疑」；这条想法本身就是一次主体检验——用了才知道 PM 是否真会在独立线程里聊项目，没人用即证伪。

## D5-08 workflow 扇出：多项目周审一次并行跑完，装配成周报草稿

- **机制**：用 `ctx.workflowEngine` 跑一段纯 JS 编排脚本，`parallel()` 里每个项目一个 agent 产出一段健康度叙述，脚本 return 汇总 JSON；插件把结果装配进各项目周报草稿，仍走确认制。
- **具体场景**：PM 周一早晨对 6 个项目发起「周审」，workflow 并行让 6 个子 agent 各自读自己项目的确定性数字写一段，插件合并成一份跨项目概览草稿，PM 逐项目确认。
- **触点**：`packages/workflow/workflow`（`agent()/parallel()/pipeline()/phase()/log()`，模型经 `workflow` 工具触达，阻塞父级直到结算）；只读诊断为主。
- **来源观察**：当前 `/pm ask` 是单项目单轮调用；多项目并行是 workflow 的设计场景；同样属 R4 主体待验——单 PM 同时管 6 项目时才有主体。

## D5-09 聊天里渲染台账业务节点：任务卡/会议卡/逾期条成为对话内原生元素

- **机制**：注册 `ConversationNodeDefinition` + `conversation.chat.node` keyed renderer，把台账实体（任务、行动项、里程碑、证据草稿）渲染成对话内业务节点卡片，而不是一段纯文本；工具调用侧用 `presentCall/presentResult` 声明 pending/完成卡片。
- **具体场景**：模型回答里提到 t-0007 时，聊天流里出现一张可点的任务卡（标题、状态、负责人、截止），点开直达面板记录；审批草稿在聊天里就是一张带「允许/拒绝」按钮的卡片，而不是命令行文本。
- **触点**：extension-cookbook「Web Client Chat 业务节点」行；`adding-a-tool.zh.md` 的 presentCall/presentResult（注意：内置 Web Client 不消费这两个方法，需在 `tool.call.toolview` keyed slot 注册自己的 renderer）。
- **来源观察**：现状面板与对话是两个互不照面的世界；插件 client 只注入了 `main` 面板与侧栏入口（`client/index.tsx`），对话区零渲染；这是交互形态层的缺口。

## D5-10 图片附件直接挂台账：白板拍照、截图成为任务/纪要的持久素材

- **机制**：复用宿主 `ctx.attachments` 内容寻址本地存储，让会议纪要、任务、风险问题能挂图片（站会白板照片、设计截图、报错截图）；视觉模型读图后产出行动项/问题草稿，PM 确认落库，图片本身持久化、重启仍在。
- **具体场景**：例会时 PM 拍一张会议室白板照片附到会议纪要，模型从中识别出 3 条行动项草稿，PM 勾选转任务；报错截图挂到一条 issue 上，下次打开仍在。
- **触点**：`packages/attachment` + `attachment-local`（内容寻址、永久不自动删、只收光栅图片）；R15 纪要归纳链路。
- **来源观察**：台账目前全是文本实体，无任何附件位；attachment 是默认组合即开的能力，零配置；PM 现场素材天然是图片而非先打字。

## D5-11 skill-office 出 Word/PPTX 汇报，office-to-pdf 出 PDF 分发版

- **机制**：周报/项目计划导出不再只产 Markdown，而是经宿主 `skill-office`（docx/pptx/xlsx 工作流）渲染成可直接发领导的 Word/PPTX，再用 `document/office-to-pdf` 转 PDF；模板与数字仍来自确定性快照。
- **具体场景**：PM 对项目概览点「出汇报稿」，面板产出一份按公司口径写好的 PPTX（现状页、风险页、下周计划页）和一份 PDF，直接发群；Markdown 版仍保留。
- **触点**：`packages/skill/skill-office`（office-docx/pptx/xlsx，内置 Python 环境、LibreOffice Kit 可渲染预览）；`packages/document/office-to-pdf`；R4/R9 现有导出（`core/export.ts`）。
- **来源观察**：requirements §5.2 已留「后续可接 office-to-pdf 出 PDF」的话头；现状导出只有 Markdown/JSON 打包（`commands/export.ts`、ADL-042 Blob 下载）；向上汇报是 PM 高频动作而产物止于 md。

## D5-12 官方设置卡片 + 插件详情页徽标：把逾期数和口径配置放到宿主原生位置

- **机制**：用插件 Config schema（schemastery `z.object` + `Volatile`）声明一张宿主设置卡片承载健康分权重/临期窗口/过载阈值；再向 `plugins.detail.badge` 注入一个「逾期 N」徽标、向 `plugins.detail.section` 注入一块迷你看板。
- **具体场景**：PM 在宿主插件列表页看到 pm-tool 徽标上写着「逾期 3」；点进插件详情页就能看到迷你异常清单并改口径，不必进自己的深色面板；设置项走宿主表单保存，替代部分面板 SettingsPanel。
- **触点**：cookbook `adding-a-settings-card.zh.md`（Config/Volatile/form.state/mutate、`role('secret')`）；`plugins.detail.actions/badge/section` 三插槽；现有 13 个口径字段（ADL-052、`core/settings.ts`）平移。
- **来源观察**：插件目前只有自己的独立面板与侧栏项，没用任何官方设置卡片/详情插槽；ADL-052 的口径配置藏在面板「更多」菜单抽屉里，发现性弱。

## D5-13 【反向/不融合】生成一份静态 `pm-board.md` 写进工作区，靠 AGENTS.md 机制被任何 agent 读到

- **机制**：完全不碰宿主 API，插件（或一个离线脚本）把确定性看板渲染成一份普通 Markdown 写到工作区 `AGENTS.md` 同级位置；宿主 `agent-instructions` 天然把 AGENTS.md 加载进上下文，其他编程工具（Claude Code/Cursor）也认这份文件；插件不订阅、不推送、不注册工具。
- **具体场景**：PM 在任何工具里开会话，只要工作区里有这份看板文件，模型开场就看得到逾期与风险；换工具、换平台文件都在，不依赖 dsh 存活。
- **触点**：`context/agent-instructions`（读 AGENTS.md/CLAUDE.md、文件变更刷新）；纯文件读写，可离线脚本生成；不接 `ctx.systemPrompt`。
- **来源观察**：这是「用文件而非 API 做上下文」的可移植路线；与 D5-03 效果相似但零宿主契约，反而更贴合 C5 可读可迁移、10 年尺度档案（问题框定 §5）。

## D5-14 【反向/不融合】切最小独立内核：core 脱离 cordis，宿主插件降级为薄适配层

- **机制**：把实体/schema/派生/导入导出/校验从 `storage-domain` 依赖里抽出来，做成零 cordis 的纯内核（自己的 JSON 文件读写层）；dsh 插件只保留「打开领域、注册 `/pm` 命令、把内核接到 storageDomain」这层薄壳；内核可独立跑 CLI/TUI/静态页。
- **具体场景**：上游一次 breaking change 砸下来，只需要重写薄适配层（估计几十处接线），七实体业务、派生、健康分、导入导出全部不动；甚至脱离 dsh 用一个自带命令行就能维护台账。
- **触点**：反向操作——剥除 `inject: ['commands','storageDomain']`（`src/index.ts`）；`PmDomain` 抽象已在 `core/storage.ts`，11 号契约 §一「域接口是唯一边界」已经为此预留。
- **来源观察**：R3 最小独立内核命题；ADL-034 列出的升级断点（clientBundle preset、合并路由、web snapshot 协议、storage 装配）全在适配层；C6 上游 alpha 破坏性变更、2 年尺度单人维护带宽（问题框定 §5）。

## D5-15 【反向/不融合】pm-tool 自己当 MCP server：dsh 退化成众多消费端之一

- **机制**：把七实体 + 派生 + 草稿确认包成一个标准 MCP server（stdio），对外暴露 `search/get/propose/confirm` 等工具；任何 MCP 客户端（Claude Code、Cursor、另一个 dsh）都能读台账、提草稿；dsh 插件只作为其中一个客户端接线。
- **具体场景**：PM 离职后在 Claude Code 里直接问台账；或未来团队成员用自己的工具连接同一个本地台账；dsh 不在时台账依然被消费，生命周期不绑在宿主上。
- **触点**：`packages/mcp/mcp-client` 是「连进来」的一方；本想法反方向是「自己当 server」，stdio 传输；写仍走本地确认制。注意 `docs/personal-billing-plan.md` §1.1/§4：脱离 dsh 独立部署持 key 属违规，需走标准 API——这是该路线自带的商业代价，记录在案。
- **来源观察**：R5 平台存在性；问题框定 R5 开启空间明确列了「把 pm-tool 自身暴露为 MCP server（任意客户端消费）」；现状插件强绑 dsh 装载链路（cordis.patch.yml、link 软链、clientBundle）。

## D5-16 【反向/不融合】刻意保持现状：冻结一切宿主接线，只做面板内完整性，并显式登记「评估过但不接」

- **机制**：不注册工具、不订阅事件、不注入上下文、不接 schedule/mcp/subagent；本轮把宿主未用能力逐项过一遍，每条在决策日志里写「评估过、主体不存在/收益为空、不接」；后续工时全部投给面板内 S1 痛点。
- **具体场景**：下一轮评审时，pm-tool 仍是今天这个离线孤岛插件；决策日志里多了一份「能力裁减清单」，明确写着 subagent/workflow/mcp/telemetry 为何无主体；产品方向就是把现有九视图做扎实。
- **触点**：无（维持现状）。
- **来源观察**：R4 主张以真实高频动作为筛子逐项过能力清单、显式记录「评估过但不接」；问题框定 §5「3 个月：面板自身完整性最重要，深度融合是分心」；ADL-031/032/039 已有多条「裁剪/暂缓」先例。

## D5-17 【反向/不融合】把 AI 通道整体迁出 dsh，插件退回纯离线 CRUD

- **机制**：移除 `ctx.reflect.get('llm')` 懒读与 `generateDraft` 调用，插件不再向宿主要模型；WBS/纪要/周报叙述改由独立脚本 + 本地 Ollama（`docs/model-providers.md` 已预留 Ollama 通道）完成，插件只收「已确认的文本」落库；宿主依赖只剩 commands/storageDomain。
- **具体场景**：无 Key、无网络时插件是完整的离线台账；AI 草稿是另一个本地小工具的事，dsh 挂了或换了，台账和草稿链路都不塌；模型成本与 dsh 套餐彻底解耦。
- **触点**：剥除 `core/ai-client.ts`、`model-route.ts` 的宿主 llm 懒读（`src/index.ts` optionalLlm）；保留 confirm 落库链路。
- **来源观察**：现状 AI 只是 `/pm ask` 一次性草稿、不进 agent loop（问题框定 §0 共识5）；ADL-036 早已把「创造性文本」与「确定性台账」解耦；个人兜底 Ollama 在 billing plan §3 已规划为免费本地通道。

## D5-18 【反向/不融合】脱离 dsh Web 壳：面板做成静态 SPA 直接读 JSON 文件

- **机制**：把 `client/` 面板抽成不依赖宿主 remote/slots 的静态包，直接读取 `data/pmtool/**/*.json`（file:// 或一个零依赖静态服务器）；dsh Web 只是可选入口之一；产物本身就是一份可归档、可移植的只读档案。
- **具体场景**：十年后 dsh 不存在，PM 双击一个 HTML 或用任意静态服务打开 data 目录，九视图照常渲染；数据文件人可读、页面可离线看，不欠任何平台债。
- **触点**：剥除 `client/index.tsx` 的 `inject=['slots','remote','remote.commands','sessions']` 与 `remote.commands.execute` 命令字符串通道；snapshot 结构已在面板内定义（`panel.tsx` Snapshot 类型）。
- **来源观察**：C5 人类可读 JSON 可迁移；问题框定 §5「10 年：平台必然更替，与当前 dsh 的具体对接不存在，深度绑定是迁移负债」；现状面板唯一写通道是命令字符串、唯一读通道是一次性全量 snapshot（共识5），与宿主耦合点其实很薄。

## D5-19 【疯狂】台账吃对话：会话日志是可丢弃的证据，台账反向吸收它

- **机制**：颠倒「agent 消费 PM 数据」的方向：插件周期性（或打开面板时）把近期 ephemeral 会话里的决策、完成动作，经 session-query 抽取成候选，喂进会议纪要/周报/任务证据区待确认；会话生灭由宿主管，台账是唯一长寿记忆。
- **具体场景**：PM 这周在三个会话里零散敲定了若干决定，周五打开面板，看到一份「本周对话里可能的决策清单」候选，勾选后并入周报；那些会话关闭、压缩甚至删除，决定已经留在台账里。
- **触点**：`session/event` + `ctx.sessionQuery`；R8 纪要、R9 快照的草稿位；与 D5-05 不同，D5-05 是报告素材候选，本条是把对话当作台账的**写入来源**。
- **来源观察**：R3 寿命分层——宿主 plan/goal/todo/session 全是短命 agent 拥有、随对话生灭，七实体是跨会话人拥有；现状证据（commit/MR/agent 轮次/会议）如何回台账正是 R1 未答问题；这条把「谁是记忆」整个反过来。

## D5-20 【疯狂】把选中项目的开放子树临时镜像进会话 tool-todo，结束即丢弃，禁止回写

- **机制**：开会话时把当前项目未完成任务树整表替换进宿主 `tool-todo`，作为本次会话的工作清单；会话结束/换项目即丢弃，todo 任何勾选都**不回写**台账，纯演示性临时投影。
- **具体场景**：PM 开始一个开发会话前，面板上选「镜像到当前会话」，聊天侧 todo 列表出现项目任务；会话里 agent 勾掉几项只是会话内行为，台账状态分毫不动，会话结束列表消失。
- **触点**：`packages/todo/tool-todo`（整表替换、会话归属、`allowParallelInProgress`）；单向、只读投影、无绑定；故意不做同步。
- **来源观察**：feasibility-map 已判定 todo 是会话级、随对话存在，不能当跨会话 WBS；这条想法故意做一次「临时投影」实验，用来检验 R4：会话 todo 对 PM 到底有没有主体价值，没有就彻底放弃这条接线。

## D5-21 【疯狂】把下一个里程碑绑成会话 goal，让 goal-round-driver 自动续行推一把，观察后丢弃

- **机制**：一次性实验：把项目最近的未达成里程碑设为宿主同会话 goal，借 goal 的自动续行驱动让 agent 围绕它多轮推进；PM 随时 block/clear；goal 状态绝不写回台账，实验完即清。
- **具体场景**：PM 说「盯着 M2 发布」，会话 goal 挂到 M2，agent 每轮自动检查缺口、续行直到 PM 叫停；实验结束记录「goal 状态机对单里程碑有没有真实增益」，然后不再用。
- **触点**：`packages/goal`（create/pause/resume/complete/block/clear、Round 上限、goal-round-driver）；会话级、进程本地续行权限；与里程碑实体单向引用。
- **来源观察**：feasibility-map 借鉴过 goal 状态机但判定它是每会话一个目标；R4 要求无主体能力显式记录评估结果；本条就是一次低成本的「试了再判」。

## D5-22 先量后接：采纳率计量仪表，用既有溯源台账统计 AI 草稿被接受/拒绝/纠正比例

- **机制**：扩展现有 provenance 账本（`pmProvenanceLedger`），按草稿 kind（ask-apply/wbs-import/narrate/summarize）统计 accepted/rejected/corrected 计数，提供 `/pm stats adoption` 与面板一块小仪表；在接任何 agent loop 能力之前先积累 N（被读次数）与 M（被采用次数）。
- **具体场景**：三个月后面板上能看到「ask 草稿共 87 条，采纳 12、拒绝 61、纠正 14」；若 N≈0、采纳率低于阈值，任何「让 agent 自主 PM」的形态直接被证伪，不必建。
- **触点**：`core/provenance-store.ts`（已有 accepted/rejected/audit 事件、`commands/ask.ts` 的 v.accepted/v.rejected）；`core/stats.ts` 派生；纯读时统计不落新表。
- **来源观察**：问题框定 §3 可证伪成功标准——消费方命题「agent 循环实际读台账 N 次、结果被采用 M 次，N≈0 即证伪」、正确性命题「接受/拒绝/纠正比例可统计」；现状账本已存 apply/undo/conflict/failed 审计，只差聚合视图。

## D5-23 【分发/商业】把「留在 dsh」显式登记为 ¥40 套餐合规选择，背后留一个可换标准 API 的端口

- **机制**：在架构上把 provider/传输/计费合规封在一个适配端口后（core 不直接读 `llm`、不直接读环境变量 key）；文档明确写「当前留 dsh 是为了方舟 Coding Plan ¥40/月合规（billing plan §1.1），不是技术必然」；未来独立部署只换端口为标准 API，业务零改动。
- **具体场景**：离职切换清单（billing plan §8）执行时，发现「留在 dsh」当初是一笔有意识的合规账，而不是沉没成本合理化；换通道是一次配置动作，不是重写。
- **触点**：`core/model-route.ts`（三档模型/降级链已是抽象层）、`core/ai-client.ts`（LlmGateway 接口）；`docs/personal-billing-plan.md` 全文。
- **来源观察**：H9（继续以 dsh 为载体是有意选择还是沉没成本）待确认；billing plan §1.1 红线：脱离 dsh 独立部署持 Coding Plan key 违规、需标准 API；这是把商业约束显性化而非藏起来。

## D5-24 面板内接线：用 domain/changed 增量事件替代每次全量 `web snapshot` 重取

- **机制**：面板不再每次动作后整条命令重拉全量 snapshot，而是订阅 storage-domain 的 `domain/changed` 事件做增量刷新（局部替换变更表）；写仍走命令字符串，读变成事件驱动；不涉及 agent、不涉及新实体。
- **具体场景**：PM 在面板连续改 5 条任务，网络/命令往返从 5 次全量七表 JSON 变成 5 次小增量；大库（未来数十项目）下面板不再每次重传全量。
- **触点**：storage-domain 的变更事件（feasibility-map §三「带 schema 校验、可发变更事件的类型化键值域」；11 号契约 §审计「domain/changed 是现成原料，是后续跨进程推送的事件源」）；现状 `panel.tsx` `run()` 成功后一律 `execute('web snapshot')` 全量重取（678/714 行）。
- **来源观察**：这是纯面板内优化，不回答融合问题，但它是唯一已经「贴在存储层上」的现成事件流，先摸清它的成本收益；也为 D5-04/D5-19 的事件监听打底。

---

## 自检计数

- 总数：24（≥18 ✓）
- 【反向/不融合】：D5-13、D5-14、D5-15、D5-16、D5-17、D5-18（6 条，≥3 ✓）
- 【疯狂/反常识】：D5-03、D5-07、D5-19、D5-20、D5-21（5 条，≥3 ✓）
- 抽象层覆盖：数据/存储（D5-22、D5-24）、能力接线（D5-01、02、03、04、05、06、07、08）、交互形态（D5-09、10、12）、工作流（D5-06、07、08）、产品形态（D5-14、15、18）、分发与商业（D5-15、23）、反向剥离（D5-13~18）。

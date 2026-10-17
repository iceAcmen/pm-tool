# 阶段1 开放发散 · 第1轮盲发 —— D2

> 规则遵守声明：无视角框架、无评分、无批评、无可行性筛选；不套用「护城河/第二大脑/平台化」等现成范式；所有想法照单全收。本文纯设计探讨，未改任何代码/配置/依赖。
> 素材全部来自本人阅读：插件 `packages/dsh-pm-tool/src/`、`docs/`、上游 `deepseek-harness/packages/*` 的 README 与源码片段。两个被禁文件未读。
> 标记：【反向/独立】= 不融合、反向、剥离、独立、刻意保持现状一侧；【疯狂】= 初看疯狂或反常识。

---

## 一、数据与存储层

### D2-01 台账摘要作为「持久、模型可见、有界」的系统提示词段（只读注入）
- **机制**：插件以 `ctx.systemPrompt.section()` 方式，把当前 active 项目的一小段确定性摘要（逾期任务 N 条、临期里程碑、未关闭高影响风险、今日议程）注入每次请求的系统提示词；只读、有字数预算、设置里可开关，任何写动作都不进这段。
- **具体场景**：PM 在 dsh 主对话里让 agent「帮我把这周计划排一下」，agent 开口前就已经知道「官网改版项目有 2 条逾期任务、10-25 里程碑只完成 60%、王五 open 8 项过载」，不用 PM 先 `/pm ask` 复述台账；PM 关掉开关后，模型完全看不到台账，回到现状。
- **触点**：宿主 `systemPrompt/assemble` 装配变换（`docs/cookbook/extension-cookbook.zh.md`「系统提示词可配置性 `ctx.systemPrompt.section()`」）；数据来自现有 `war-room.computeKPI/buildAgenda` 纯函数（`src/core/war-room.ts`）。
- **来源观察**：现状 agent 循环与台账完全隔绝，全仓无 `ctx.tools.register`、无 `ctx.on(...)`（事实包 §3；本人 grep `src/` 确认零命中）；而 host 的 `context` 组定义就是「不定义工具、为每次请求添加持久且模型可见上下文」（`packages/context/README.zh.md`）。

### D2-02 台账渲染成一份可按需加载的 PM skill（不常驻上下文）
- **机制**：与 D2-01 相反的另一条路——不常驻注入，而是把全量台账快照（或按项目切片）渲染成一份 `SKILL.md` 放到被 `skill-filesystem` 扫描的目录，agent 需要时用 `skill` 工具主动加载完整指令与台账，用完即释放。
- **具体场景**：PM 在对话里问「上周那个风控项目风险都关了吗」，agent 先看到技能目录里有一份 `pm-ledger` 条目，调用 `skill` 加载该项目台账片段后回答；没被问到的项目不占 token。面板侧每次保存后重渲染该文件。
- **触点**：`packages/skill/skill-filesystem`（扫描项目/自定义/用户根目录的 `SKILL.md` 或平铺 md，监视目录变更免重启）、`packages/skill/tool-skill`（会话目录 + `skill` 加载工具）。
- **来源观察**：本仓库 `skills/` 目录已存在且只有一份占位 README（`skills/README.md`），规划了「项目初始化/WBS 拆解/里程碑风险检查/周报」四个空 skill；现状 AI 是三个一次性固定按钮、读不懂当前选区（UX-10，`docs/product/02-ux-evaluation.md`）。

### D2-03 订阅 `domain/changed` 事件，面板从「写完手动全量刷新」改为增量推送
- **机制**：Host 侧插件订阅 storage-domain 的 `domain/changed` 事件，把变更的表/键推给 client；面板不再靠每次操作后重新拉一次全量 `web snapshot`，而是局部替换对应记录。
- **具体场景**：PM 在另一个会话或另一处改了一条任务（未来多端场景），打开面板时那条记录已经是新的；面板里 A 设备改完，B 设备的面板无需手动点刷新就局部更新。读侧解耦，不涉及对话写。
- **触点**：`packages/storage/storage-domain/src/domain.ts` L253 落盘成功后 `this.ctx.emit('domain/changed', change)`；事件类型见 `src/events.ts`。
- **来源观察**：现状面板唯一读通道是启动一次全量 `/pm web snapshot`，之后所有派生都在浏览器内存算，写操作后靠 `refresh()` 再拉全量（`src/client/panel.tsx` L675-714；`src/client/index.tsx` L20-31）；`docs/product/11-collaboration-ready-architecture.md` 明确写「`domain/changed` 事件注释写明是后续跨进程推送（RPC frame）的事件源」。

### D2-04 项目档案/周报导出为可被 `@` 引用的跨会话只读快照
- **机制**：把一份冻结的项目档案或周期周报，按 host session-reference 的 mention 形态导出为有界、不可变的只读快照，其他会话可以 `@项目名` 引用它作为背景，快照带「不受信任背景」警告，引用方向单向（档案→对话），对话不回写档案。
- **具体场景**：PM 新开一个会话讨论下个季度规划，输入 `@官网改版项目档案`，该项目的目标、里程碑、已关闭风险清单作为有界快照进入背景；旧会话里的讨论不被搬进台账，台账也不被对话污染。
- **触点**：`packages/context/session-reference`（`@label` mention → 规范 URI → 有界只读快照，固定不可信背景警告，spill 后端存全文）。
- **来源观察**：现状报告快照是自闭环的 `reports` 表冻结 JSON（R9，`src/core/progress-reports.ts`），与其他会话零关系；host session-reference 已提供跨会话只读引用地基。

### D2-05 【反向/独立】把七实体抽成不依赖 dsh 的纯文件内核，宿主只剩一层薄适配
- **机制**：把 `core/` 里不碰 cordis 的部分（schema、WBS 树、关键路径、健康分、承诺对账、导入导出）编译成一个零宿主依赖的纯 npm 包；`commands/` 与 `client/` 变成两个可选适配层，分别挂到 dsh 和别的壳上。
- **具体场景**：内核包单测全部离线跑通；dsh 适配层只做「把 `/pm` 命令翻译成内核调用」「把内核记录喂给面板」；未来换壳时业务代码一行不改。上游一次 breaking change 只砸适配层。
- **触点**：无（内核层）；适配层才碰 `commands`/`storageDomain`。
- **来源观察**：`docs/product/11-collaboration-ready-architecture.md` 已审计出「业务代码只允许碰 `PmDomain` 接口、永不直接 import `KvUnit`」的边界；`src/core/` 大量纯函数（`derived.ts/health.ts/war-room.ts/completion-history.ts/suggestion-engine.ts`）本就无 React、无 cordis。

### D2-06 数据渲染成仓库内 `PROJECTS.md`，借 host 现有 AGENTS.md 装载零代码进上下文
- **机制**：一个离线脚本/命令把台账渲染成仓库根的 `PROJECTS.md`（类似 AGENTS.md），host 的 `agent-instructions` 本来就会自动加载工作区指令文件；插件不需要写任何系统提示词代码，模型自然读到当前项目板。
- **具体场景**：PM 在仓库里开任何 agent 会话，agent-instructions 自动把 `PROJECTS.md` 带进背景；人改完台账跑一次渲染命令，文件即更新；不挂载本插件时这份 md 依然可读、可被别的工具消费。
- **触点**：`packages/context/agent-instructions`（加载 AGENTS.md/CLAUDE.md，文件编辑后刷新）。
- **来源观察**：仓库根已有 `AGENTS.md` 且 host 自动加载（`packages/context/agent-instructions/README.zh.md`）；`docs/requirements.md` §5.2 已有「Markdown 概览由数据渲染导出、JSON 为准」的双写原则，只是现在渲染产物只进 `exports/` 不进工作区。

---

## 二、能力接线（工具 / 事件 / 调度 / 委派）

### D2-07 注册一组纯只读模型工具（pm_search / pm_get / pm_list），写操作永远不进工具
- **机制**：`ctx.tools.register` 暴露只读工具族：按关键词搜七实体、读单条记录、列某项目任务/风险/议程；schema 自动进系统提示词；所有写（增删改、状态推进、草稿落库）仍只走 `/pm ask` 草稿+人确认，工具侧一个写口子都不开。
- **具体场景**：agent 在会话里被问到「王五手上还有哪些没关的风险」，自己调 `pm_search` 读到答案并回答；它想把某任务标完成时，工具列表里没有这个能力，只能建议、由人在面板或命令里确认。
- **触点**：`ctx.tools.register` / `defineTool`（`docs/cookbook/adding-a-tool.zh.md`）；只读逻辑复用 `src/core/search.ts`、`stats.ts`。
- **来源观察**：现状全仓无工具注册（事实包 §3）；`docs/requirements.md` §七早就预留了 `pm-tools` 包「MVP 仅预留接口、不实现」；R2 根问题要求先回答「agent 只读面边界在哪」。

### D2-08 草稿工具 + 一次性审批 seam：模型只产改动草案，人在审批卡片里批/拒
- **机制**：注册一个 `pm_draft_changes` 工具，返回的不是落库结果而是一张改动草案（参照现有 ask-apply 多步计划卡）；真正落库前经 host `user-approval` 一次性批准/拒绝（默认拒绝），批准后才复用现有 baseline 乐观并发与 60s 幂等标记落库。
- **具体场景**：agent 说「我建议把两个低优任务从王五挪给赵六」，弹出宿主原生审批卡，PM 看一眼影响范围点批准或拒绝；拒绝后台账零变化，草案连同拒绝理由留在 provenance 账本。
- **触点**：`packages/interaction/user-approval`（一次性允许/拒绝，未决定默认拒绝）、`tool-ask-user`；复用 `src/commands/ask.ts` 的 ask-apply/baseline、`src/core/idempotency.ts`、`src/core/provenance-store.ts`。
- **来源观察**：现有 PROD-24 副驾多步计划卡已是「步骤/理由/拓扑/整批+逐步确认」，但确认发生在面板内存里（`docs/requirements.md` PROD-24 段）；host interaction 组的 approval seam 从未被使用。

### D2-09 对话流里渲染台账业务节点卡片（任务号/风险号在聊天里变成可点卡片）
- **机制**：注册 `ConversationNodeDefinition` + `conversation.chat.node` keyed renderer；模型提到 `t-0003`、`ri-0002` 这类记录号时，聊天流里渲染成宿主风格卡片（标题/负责人/状态/截止/健康色），卡片按钮直达面板对应记录抽屉；工具调用行也可在 `tool.call.toolview` slot 挂自定义卡片。
- **具体场景**：agent 在答复里写「`t-0003` 联调已逾期 1 天」，那句话下面直接出现一张任务卡片，PM 点卡片左侧栏跳到该任务抽屉，不用去全局搜索再二次找（UX-04 二次找痛点顺带被吃掉）。
- **触点**：`docs/cookbook/extension-cookbook.zh.md`「Web Client Chat 业务节点：注册 ConversationNodeDefinition 与 conversation.chat.node keyed renderer」；`adding-a-tool.zh.md` 的 `presentCall/presentResult` 纯函数投影、`tool.call.toolview` slot。
- **来源观察**：现状面板与对话是两个空间，聊天里出现任务号只是纯文本；`src/core/record-location.ts` 已有 type→视图/抽屉的直达映射，缺的只是对话侧渲染入口。

### D2-10 用 host schedule 把「今日议程」作为会话内消息到点投递（不是系统推送）
- **机制**：人在面板勾选「每日 9:30 回顾本项目」，插件经 host schedule 建一条绑定当前会话的 daily/cron 任务；到期时 host 把一条 follow-up 消息投回原对话（「今天有 1 条逾期、2 条临期」），模型据此读台账生成今日待办草稿；不引入常驻进程、不发 OS 通知。
- **具体场景**：早上打开 dsh 原会话，收件箱里躺着一条到期议程消息，PM 看到今日清单后决定处理哪条；host 重启后任务仍在，错过只补发最近一次。
- **触点**：`packages/schedule`（一次性/every/daily/weekly/cron，到期作为普通 follow-up 进入原会话，重启保留，`packages/schedule/schedule/README.zh.md`）；议程复用 `war-room.buildAgenda`。
- **来源观察**：R11/ADL-032 暂缓的是「系统级常驻推送」，ADL-039 用「打开面板即派生」替代；而 host schedule 的投递形态本来就是「回到原对话的一条消息」，与常驻后台进程/系统通知不是一回事。

### D2-11 重活走 jobs 后台任务，完成后会话内通知，不阻塞当前轮次
- **机制**：把全库备份、历史趋势回填、大批量 CSV/XLSX 导入、跨项目健康分重算这类长动作注册为 `ctx.jobs` 后台任务；当前轮次立即返回任务句柄，完成时以会话内通知送达，PM 可在任务列表看状态。
- **具体场景**：PM 一次导入 300 行旧任务表，面板不再转圈等；任务在后台跑，完成时会话里出现「导入完成：286 条入库，14 行格式问题」通知，点开看失败行清单。
- **触点**：`packages/jobs`（注册表约定、`jobs-local` 进程本地存储、完成时会话内通知、按所有者隔离）；复用 `src/core/csv-import.ts` 已有解析/计划/落库链路。
- **来源观察**：feasibility-map §辅助能力已标注「jobs 用于批量导入、报告生成等长任务」但未接；现状批量导入是同步阻塞在面板操作里。

### D2-12 【疯狂】每个里程碑派一个全新 subagent 做「独立验收审计」，报告回面板
- **机制**：里程碑达成前，插件经 `subagent-spawn-in-process` 派一个全新进程内子 agent（不带父对话历史），只喂给它该里程碑的目标描述 + 关联任务快照 + 交付物清单，让它独立判断「是否真的达成、证据够不够」，结论以结构化报告回面板，不改库。
- **具体场景**：PM 想把 M1「首版发布」标达成，面板弹出「审计员认为：3 个关联任务里 1 个只有进度文字无证据链接、交付物 dlv-0001 仍在 submitted」；PM 看完自己决定标达成还是补证据。
- **触点**：`packages/subagent/subagent-spawn-in-process`（全新进程内子级）；审计报告只读挂里程碑详情。
- **来源观察**：host subagent 家族支持「全新进程内、无父历史」隔离工作（`packages/subagent/README.zh.md`）；本项目已有 provenance 账本与「独立测试门」文化（ADL-045），审计员是把这个文化搬到业务侧。

### D2-13 【疯狂】把当前关键任务写进 host goal 状态机，让 goal-round-driver 自动续行围着它跑
- **机制**：选定一条 P0 任务后，插件把它的目标文本同步进 host 会话的 goal（创建/暂停/恢复/完成/阻塞状态机），开启可选的自动续行，让 agent 连续多轮围着这条目标推进，PM 在旁边验收。
- **具体场景**：PM 说「把登录风控这个任务推完」，goal 挂上该任务，agent 一轮轮自动干活直到 complete/blocked/budget-limited，面板上任务状态随 goal 回写草稿；阻塞时 goal 停在 blocked 等人解除。
- **触点**：`packages/goal`（ctx.goals、tool-goal、command-goal、goal-round-driver 自动续行）。
- **来源观察**：goal 是「每会话一个持久完成目标 + 自动续行」（`packages/goal/README.zh.md`），与跨会话长寿项目天然错配（问题框定 §0 共识3），但把「单条任务」而非「整个项目」挂上去是一种窄用法；现状 goal 完全未被使用。

### D2-14 【疯狂】WBS 树编译成可扇出的 workflow DAG 脚本，agent 按依赖自动执行
- **机制**：把一个项目的任务树 + predecessorIds 依赖图，编译成 host workflow 引擎能跑的编排脚本；叶子任务按拓扑扇出给 subagent，完成状态回传，PM 只批计划、不逐单下指令。
- **具体场景**：一个调研类项目拆成 8 个叶子任务，PM 批准计划后 workflow 自动跑前置完成的分支，每步结果以有界报告回传；遇到缺信息的步停住等人，不静默编。
- **触点**：`packages/workflow`（模型编写/脚本化扇出 subagent、PTC Node 沙箱运行时、`tool-workflow`）；依赖图复用 v0.6 已落地的 `predecessorIds[]` 与环检测（PROD-11）。
- **来源观察**：workflow 设计前提是多 agent 编排（`packages/workflow/README.zh.md`），单人单机下主体存疑（R4）；但把它当「一次性项目执行器」是另一种用法，先记录不评判。

### D2-15 【疯狂/反向】让 pm-tool 面板反过来嵌一个宿主对话，pm-tool 当壳、dsh 当组件
- **机制**：不再追求「面板并进 dsh」，而是在 pm-tool 自己的面板区域里开一条受控的 agent 对话槽位（复用 host chat 节点/session 创建能力），台账为主体、对话为附属；对话产物以草稿形式回到台账。
- **具体场景**：PM 停在任务抽屉里，抽屉底部就是一个小输入框直接问「这个任务怎么拆」，回答以草稿卡落在抽屉里，不用切到主对话再跳回面板（顺带治 ISS-026 跳转割裂）。
- **触点**：`packages/client/ui-chat`、`ui-conversation` 的节点渲染；`sessions.create()`（现状 client/index.tsx 已经会借 sessionId 当命令句柄，只是没展示对话）。
- **来源观察**：现状 client 已经 `sessions.list.getSnapshot().ids[0] || sessions.create()` 借会话当投递句柄（`src/client/index.tsx` L21-22），会话本身从未被展示；方向上是把「借壳」反转为「自带对话位」。

### D2-16 【疯狂】取消手工录入，台账只做会话日志的自动投影（承诺抽取 → 人确认入库）
- **机制**：不维护独立录入表单；插件监听会话结束，从 session 日志里确定性+模型混合抽取「承诺/决议/行动项」，生成待入库队列，人逐条确认后才落台账；台账成为对话的投影而非独立本子。
- **具体场景**：一场例会对话结束，队列里躺着 5 条候选行动项，PM 在面板里逐条勾「入台账/丢弃/改字」，确认后变成任务；再也没有空白表单让人从零填。
- **触点**：`packages/session-query`（读持久会话日志）、`session/event` 监听；确认制复用现有草稿/confirm 范式。
- **来源观察**：现状 R8 会议纪要、R17 行动项 promote 已经是「会议→任务」的半自动桥（`src/core/meeting-source.ts`、ADL-040）；再推一步就是「所有记录都从对话里长出来」。

### D2-17 【疯狂·dogfood】把 pm-tool 自己的开发 backlog 当第一个真实项目，git 提交即执行证据
- **机制**：用本工具管理本仓库的开发任务（S1 痛点、backlog、版本条目），任务号写进 git commit message，插件读本地仓库 git log 把 commit/MR 关联到任务作为只读证据草稿，形成「自己吃自己狗粮」的闭环。
- **具体场景**：`t-0042 修复甘特窄屏溢出`，提交信息带 `#t-0042`，面板任务抽屉里出现「最近提交 abc1234 触碰此任务」的只读提示；版本发布时自动汇总本周期完成任务成 release note 草稿。
- **触点**：本地 git 只读（host `subprocess`/`fs` 能力）；任务 `evidenceUrl` 字段已存在但无人填（`src/core/task.ts` L67）。
- **来源观察**：本项目真实运行环境本身就是多 agent（TRAE/豆包工作/Cursor）协作改同一 git 仓库（`docs/collaboration.md` §平台标识注册表）；UX-11「台账↔Git 两张皮」在自己仓库上最先可观测。

### D2-18 捕获 agent 真实执行证据：监听 workspace/changes 与 present，回填任务 evidenceUrl 草稿
- **机制**：订阅 host 的 `workspace/changes` 事件与 present 声明，把本轮 agent 真实改动的文件清单/git diff、声明产物，整理成一条只读证据草稿挂到当前任务的 `evidenceUrl`/交付物 `location`，人确认才写；不自动改状态。
- **具体场景**：agent 一轮改完登录页面文件，任务抽屉里出现「本轮改动 3 个文件、present 了 login.html」的证据草稿，PM 确认后证据链接留在任务上，周报里能直接引用「哪轮对话产出了什么」。
- **触点**：`packages/deliverables/workspace-changes`（每顶层轮次 git 工作树快照、文件清单+numstat+hunk，`ctx.workspaceChanges.summary/diff`，session 内、不对模型可见）；`packages/deliverables/tool-present`。
- **来源观察**：任务 schema 早留了 `evidenceUrl`、`effortHours`、`completedDate`、`manualProgress` 字段（`src/core/task.ts` L66-71）但全产品没有任何地方自动填；R1「计划↔执行证据闭环」的断点在证据捕获，workspace-changes 是现成的捕获管道之一。

### D2-19 用 session-query FTS5 回捞历史对话，把旧承诺作为只读证据链回挂任务
- **机制**：人给任务挂一句承诺关键词，插件经 `session-query` 的 SQLite FTS5 全文搜历史会话日志，捞出相关对话片段，生成只读引用列表挂在任务旁（不复制正文、不回写会话），供对账「当时到底答应了什么」。
- **具体场景**：季度复盘时 PM 想确认「三月份答应客户的那个交付物谈成什么样了」，面板列出历史会话里提到该关键词的片段链接，点开跳到对应会话轮次。
- **触点**：`packages/session-query/session-query-sqlite`（FTS5 索引、精确读取/过滤/关系追踪）；只读引用，不落正文进台账。
- **来源观察**：host 会话日志 `session.vN.jsonl` 持久且可全文检索（`packages/session-query/README.zh.md`），现状插件对会话历史零读取（事实包 §0 共识5）。

---

## 三、交互形态与界面接线

### D2-20 把插件设置搬进 host 设置卡片与插件详情页插槽，不自绘设置页
- **机制**：模型车道、临期窗口天数、过载阈值、各开关改用 host Config schema 声明成设置卡片；在 `plugins.detail.section/badge/actions` 插槽注入本插件的健康摘要、快捷按钮，复用宿主表单与主题，不再自己维护一套设置 UI。
- **具体场景**：PM 在 dsh 原生设置里翻到 pm-tool 卡片，调临期窗口 7→14 天；插件详情页标题旁出现「2 条逾期」徽标，页头有「一键备份」按钮。
- **触点**：`docs/cookbook/adding-a-settings-card.zh.md`（Config schema、Volatile 易失字段、`plugins.detail.actions/badge/section`）；现有设置值存 settings 自由表（`src/core/settings.ts`）。
- **来源观察**：现状面板自绘设置区（`panel.tsx` 顶栏「更多」下拉 + 设置视图），host 已提供稳妥的设置卡片路径而未使用（feasibility-map §四）。

### D2-21 计划↔执行「承诺对账」纯派生视图，不依赖任何外部系统
- **机制**：用已有的 `completion-history`（按周统计真实 completedDate）+ 相邻报告快照 diff，纯派生算出「上期计划了 N 项、实际完成 M 项、延期 K 项、本期新增 L 项」的对账表，不联网、不接 Git，数字全部来自本地台账。
- **具体场景**：周报页多一张「上周承诺兑现」表：计划 6 项、完成 4、延期 2、新增 3；PM 写周报时直接抄这张表，不用自己翻两个快照对。
- **触点**：`src/core/completion-history.ts`（只认真实 completedDate、空态不造假曲线）、`src/core/report-diff.ts`（相邻快照对比徽标，PROD-09 已落地三指标）。
- **来源观察**：R9 快照冻结但「任务没有状态变更历史，首版只存生成瞬间状态，不能推断本周期完成任务」（`docs/requirements.md` §4.6）；而 completedDate 字段与完成历史已存在，对账可在本地先做一版。

### D2-22 注册宿主全局快捷键，把高频动作从面板键盘提升到应用级
- **机制**：通过 host shortcuts 注册应用级命令（打开本面板、新建任务、刷新议程、复制今日清单），进入宿主快捷键速查目录，可自定义键位。
- **具体场景**：PM 在任何界面按一个组合键直接呼出「今日议程」小条，不用先点左侧栏图标再切项目；快捷键录键走宿主原生录键框。
- **触点**：`packages/client/ui-shortcuts`（已注册命令进速查、自定义绑定、Mod+/ 打开目录）；面板内部已有 j/k 纯键盘导航（`src/core/panel-kbd.ts`，OPT-09）。
- **来源观察**：现状键盘操作只在面板内部生效（`panel-kbd.ts`），出了面板就是死的；host 有全局快捷键注册面。

### D2-23 模型答案的采纳/拒绝/纠正率接 host feedback 通道，留可统计信号
- **机制**：把副驾草稿的接受/拒绝/纠正动作，写进 host message-feedback 或自己的有界计数（不进模型历史），累积出「AI 建议被采纳比例」，作为该形态是否成立的可证伪信号；feedback 是单向信号、绝不回喂模型。
- **具体场景**：跑一个月后面板角落显示「本月副驾建议采纳 31/47、纠正 9、拒绝 7」，PM 据此判断还要不要扩大 AI 面；这些数字不改变模型看到的任何东西。
- **触点**：`packages/feedback/message-feedback`（逐消息评分/分类/备注，存权威日志，绝不进模型历史）、`command-feedback`；现有 provenance 账本已记 applied/undone/conflict/failed 审计事件（`src/core/provenance-store.ts` F14）。
- **来源观察**：问题框定 §3 正确性命题要求「AI 读写建议被接受/拒绝/纠正比例可统计」；现状 provenance 审计事件只按项目留 20 条有界账本，没有跨月聚合统计。

---

## 四、独立 / 反向 / 保持现状一侧（≥3）

### D2-24 【反向/独立】冻结融合面，把「隔离」本身做成产品原则并写进自动门
- **机制**：明确宣布不再接 session/context/tool/event 任何宿主运行时，维持 `inject = ['commands','storageDomain']` 现状；把 `verify-isolation` 脚本升级为发布门：每次构建断言插件没新增宿主服务依赖、没新增 `ctx.on`、没 `ctx.tools.register`，违者构建失败。
- **具体场景**：未来任何人（包括自己）想往插件里塞宿主耦合，CI/verify 直接红灯；产品叙事从「深度融合」改为「一个离线、可移植、零运行时依赖的台账」。
- **触点**：无新增；现有 `scripts/verify-isolation.mjs`、`src/index.ts` 的 inject 声明。
- **来源观察**：仓库已有隔离自检脚本与 verify 体系（`package.json` scripts.verify；事实包 §2）；ADL-034 已锁上游 v0.2.1-alpha.2 并备升级冒烟，耦合越深升级回归面越大（C6）。

### D2-25 【反向】拆掉 Web 面板，退回纯斜杠命令 + 宿主原生文本输出
- **机制**：砍掉自绘 React 面板与 panel.css/design tokens，所有视图（看板/甘特/风险矩阵/负载）都渲染成宿主命令的文本/Markdown 输出，由 host 原生渲染或导出文件查看；client bundle 整个不发布。
- **具体场景**：PM 在终端式对话里 `/pm agenda` 得到一份今日清单文本，`/pm gantt p-0001` 得到 ASCII 时间线；维护面从 3900 行 panel.tsx 缩到命令渲染函数。
- **触点**：仅 `ctx.commands`；`docs/cookbook/extension-cookbook.zh.md` 命令「由人直接触发、不消耗模型轮次」。
- **来源观察**：现状真实操作都在面板（ADL-038/ISS-026：第三方 `/pm` 不进首页补全、发送后不自动跳转），面板是为绕开宿主限制长出来的；反向假设是「这些限制不值得养一个 3900 行前端」。

### D2-26 【独立】编译成无宿主静态站：直接读 JSON 目录/备份包，dsh 可装可不装
- **机制**：把面板 + 纯内核打包成一个静态 HTML（或本地小服务），直接读取 `data/pmtool/**/*.json` 或导入备份 JSON 包，不需要 dsh 进程、不需要 profile、不需要 storage-domain；dsh 插件变成静态站的一个可选导入器。
- **具体场景**：十年后 dsh 不存在了，PM 双击一个 HTML 打开旧台账，七视图照常浏览、搜索、导出 Markdown；数据文件原样可读。
- **触点**：无宿主（纯静态）；复用现有 JSON per-record 布局（`docs/requirements.md` §5.1）与备份格式（`docs/backup-sync.md`）。
- **来源观察**：C5/10 年尺度要求「宿主消失后长寿记录仍可读可迁移」（问题框定 §5）；现状数据虽是可读 JSON，但查看它必须先跑起整个 dsh。

### D2-27 【独立】把 pm-tool 作为本地 MCP server 发布，dsh 只是消费方之一
- **机制**：七实体内核包一层 stdio/HTTP MCP server，对外暴露只读（及草稿写）工具；任意 MCP 客户端（其他 IDE、手机客户端、未来工具）都能连台账；dsh 内插件改为该 server 的一个薄客户端。只读浏览不调模型、不碰 Coding Plan key，生成动作仍回 dsh 内完成以保计费合规。
- **具体场景**：换一台电脑或换个工具，配一行 MCP 地址就能读同一份台账；pm-tool 不再因为「只能在 dsh 里活」而被平台绑架。
- **触点**：host `mcp-client` 可作为第一个消费方（`packages/mcp`）；server 本体独立于 dsh。
- **来源观察**：R5「平台存在性」开启空间明确列了「把 pm-tool 自身暴露为 MCP server，任意客户端消费」（问题框定 §4 R5）；`docs/personal-billing-plan.md` 红线：独立脚本直连 Coding Plan key 违规，故生成留 dsh 内、只读开放。

### D2-28 【独立】公开分发为 npm `dsh-plugin` 包，脱离本人 profile 与私有数据假设
- **机制**：按 feasibility-map §七的发布路径，把插件打成公开 npm 包（`dsh-plugin` topic），他人 profile 一键安装；默认空数据、自带示例工程，模型 Key 走各自配置；本人台账数据永不打包。
- **具体场景**：别的 dsh 用户装上后得到一个干净 PM 工作台；本人继续用私有 profile，两者解耦；维护者身份从「自用工具作者」变成「公开插件维护者」。
- **触点**：profile/bundle patch 装载机制（`docs/feasibility-map.md` §七）。
- **来源观察**：feasibility-map §七已写「后续可选择发布为 npm 包（打 dsh-plugin topic）」；现状包 private:true、link 本地装载（`package.json`）。

### D2-29 【什么都不做】冻结 v0.7.4，把「是否融合」存证为一个不需要回答的问题
- **机制**：不新增任何宿主接线，把时间全部投回面板内完整性（看板、视觉基准、prod Key 稳定性）；同时把本轮脑暴的所有融合想法存档为「待真实使用信号触发」，N≈0 的消费方命题直接判不启动。
- **具体场景**：三个月后回看，台账使用条数/耗时基线无下降则价值证伪，议题关闭；产品停在一个离线、完整、自洽的单机本子。
- **触点**：无。
- **来源观察**：问题框定 §3 成功标准已含「消费方 N≈0 即证伪」「无下降则价值证伪」；阶段0 §5 结论指出深度融合只在 2 年窄窗口条件性成立，当前 3 个月尺度面板内完整性最重要。

---

## 五、其他拉宽层（商业/通道/时间尺度）

### D2-30 外部 Git/MR 经 host mcp-client 只读接入，状态拉成草稿建议而非自动写回
- **机制**：配置一个外部 Git 服务商 MCP 服务器（公司 GitLab/GitHub），插件以只读工具读取指定仓库的 MR 状态/分支，结合任务 `repoUrl/branch` 生成「MR 已合并→建议任务标完成」的草稿，人确认才动；绝不轮询、不常驻、不自动改库。
- **具体场景**：PM 打开任务抽屉看到「关联分支 feature/login 有 2 个 MR，1 个已合并」的只读提示，决定是否采纳完成建议；离线或未配 MCP 时该区块隐藏，台账 CRUD 不受影响。
- **触点**：`packages/mcp/mcp-client`（连接外部 MCP、暴露工具与资源）；任务/项目已有 `repoUrl/branch`（PROD-21，v0.6.0）。
- **来源观察**：UX-11 台账↔Git 两张皮（`docs/product/02-ux-evaluation.md`）；构想二方案 B「Git 桥自动同步」被标长期观望（`docs/product/04-disruptive-concepts.md`），mcp-client 是比自建轮询更轻的通道。

### D2-31 报告/计划一键转 PDF，复用 host office-to-pdf 与 skill-office 模板
- **机制**：导出 Markdown 报告后，经 host document 包转 PDF；周报/计划的固定版式用 skill-office 的 Word/PPT/Excel 工作流模板生成，人拿成品去汇报。
- **具体场景**：PM 点「导出汇报包」，得到一份排版好的 PDF 周报和一份可编辑 Word 版，直接发出去；离线无 Key 时仍只给 Markdown。
- **触点**：`packages/document/office-to-pdf`（LibreOffice kit 转换、有界队列缓存）、`packages/skill/skill-office`（Word/PPT/Excel 工作流）。
- **来源观察**：feasibility-map §辅助能力已列「office-to-pdf 导出 PDF、skill-office 导入/导出 Office」；R4 规划里写了「后续可接 office-to-pdf 出 PDF」（`docs/requirements.md` §5.2）一直未接。

### D2-32 附件/图片进台账：会议截图、白板照片走 host attachment 内容寻址存储
- **机制**：任务/纪要/风险可挂图片证据（现场截图、白板照），经 host attachment 持久化内容寻址存储，重启仍在、回到历史；台账只存引用地址，不复制二进制。
- **具体场景**：PM 把会上拍的白板照贴到那条风险上，下次打开风险卡片图还在；图片随会话历史一并可见。
- **触点**：`packages/attachment`（持久图片附件、内容寻址、重启不删、只支持光栅图）。
- **来源观察**：现状七实体全是文本字段，无任何附件能力（schema 见 `docs/requirements.md` §4）；host attachment 是现成地基。

### D2-33 【疯狂】把「人」也变成台账实体之外的第二视图：用 host workspace 注册表把会话按项目归组
- **机制**：不新建人员表，而是把 host workspace 注册表的「命名目录→会话归组」与 pm 项目做只读映射：一个项目名下聚合所有讨论过它的会话，面板提供「项目相关对话」入口；人不登录、不协作，只是把对话历史挂到项目上浏览。
- **具体场景**：PM 在项目概览看到「该项目有 6 个相关会话」，点进去按时间序回看当时怎么决策的，会话不被改、不被导入台账。
- **触点**：`packages/workspace/workspace`（命名有序项目、按目录归组会话、对模型不可见、不增 token）；只读映射。
- **来源观察**：host workspace 与 pm 项目都叫「project」但生命周期不同（会话短命、台账长寿），这里只做单向聚合视图，不双向绑定。

### D2-34 【疯狂】台账反向给 host 会话当「工作区档案」：项目目录即 session 工作目录，双向只读锚定
- **机制**：每个 pm 项目对应一个本地目录，项目创建时建议/记录该目录，host 会话的 working-directory 锚到它；agent 在该目录里干活，台账项目页显示这个目录的文件树（只读，经 workspace-files）。
- **具体场景**：PM 为「官网改版」项目开会话时工作目录就在项目文件夹，agent 产出的文件天然落在项目域里；项目概览能直接列出该目录内容，不用手动贴路径。
- **触点**：`packages/session/working-directory`（每会话有效执行目录）、`packages/api/workspace-files`（有界读、list、changes 监听）。
- **来源观察**：host workspace 按目录归组会话（D2-33 同源）；现状项目 `repoUrl/branch` 只是文本链接，没有真实目录锚点。

---

## 计数自检
- 总数：34 个（D2-01 ~ D2-34）。
- 【反向/独立/保持现状】：D2-05、D2-24、D2-25、D2-26、D2-27、D2-28、D2-29（7 个，≥3）。
- 【疯狂/反常识】：D2-12、D2-13、D2-14、D2-15、D2-16、D2-17、D2-33、D2-34（8 个，≥3）。
- 覆盖层：数据/存储（01-06）、能力接线（07-19）、交互/界面（20-23）、独立反向（24-29）、商业/通道/时间尺度（30-34）。

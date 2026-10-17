# 阶段1 第1轮盲发 · 原始想法池（D1–D5 全文，共 146 条）

> 五名发散者独立盲发，互不可见。本文件为原文汇编，未做任何删改、筛选或重排（除拼接）。

==================== 发散者 D1 ====================

# 阶段1 开放发散 · 第1轮盲发 · D1

> 规则：无视角、无评分、无批评、无可行性筛选；再疯狂也保留。以下想法按我自己漫游源码/文档/宿主 README 的观察自然生长，刻意不塞进 R1–R5 分类框。共 32 个。
> 标注约定：【独立/反向/现状】= 不融合、反向、剥离、保持现状一侧；【疯狂】= 初看反常识。
> 取证范围：pm-tool 源码 `packages/dsh-pm-tool/src/`、`docs/`（requirements/decision-log/feasibility-map/collaboration/personal-billing-plan/backup-sync/delivery/product/02-ux-evaluation/11-collaboration-ready-architecture/issues-and-solutions/optimization-backlog/external-skills）、deepseek-harness `packages/` 各 README 与 cookbook。两个被禁设计稿未读。

---

## 一、对话与模型接线（让台账进对话，而不是只待在面板）

### D1-01 只读模型工具族 `pm_read_*`（把台账变成 agent 可按需查的工具）
- **机制**：用 `ctx.tools.register(defineTool(...))` 注册一组只读工具（`pm_projects` / `pm_tasks(projectId?, status?)` / `pm_milestones` / `pm_risks` / `pm_meetings` / `pm_reports` / `pm_deliverables` / `pm_search(keyword)`），schema 自动进入系统提示词；模型在任意对话里自行调用读取，写动作仍走现有草稿确认制。
- **具体场景**：用户在普通开发对话里随口问「我 X 项目现在卡在哪几条？逾期的是谁？」，模型不用打开面板，自己调 `pm_tasks` 拿到清单、直接在对话里答出来；用户说「把 t-12 标进行中」时模型不直接写，而是产出一张现有样式的草稿卡等确认。读不消耗确认轮次，写仍然有人把关。
- **触点**：`defineTool`/`ctx.tools.register`、`output.schema`+`output.render`；Web 侧如需自定义卡片再挂 `tool.call.toolview`。
- **来源观察**：现状零工具注册（问题框定共识5；`grep ctx.tools` 全仓为空）；`ask-copilot.ts` 现在是手工把全量项目快照压进 user 文本，工具化后可按需取数、避免全量快照每轮灌进上下文；feasibility-map §五已列工具机制。

### D1-02 持久轻上下文注入（今日议程 + 异常 Top N + 健康灯，而不是全量快照）
- **机制**：用宿主 context 组的持久模型可见上下文（`ctx.systemPrompt.section()` / context section 提供方），每轮自动注入一小段：今天的临期/逾期清单（复用 `reminders.ts` 纯派生）、异常 Top N（复用 `collectProjectReport` exceptions）、各项目健康灯（复用 `health.ts` scoreFromInputs）。数字全由我方确定性纯函数产出，模型不许改。
- **具体场景**：用户一打开 dsh 开始任何任务，模型上下文里始终带着「今天有 2 条逾期、1 个项目黄灯」，不用用户先 `/pm` 问；模型在聊别的工作时能顺口提醒「你那条 t-12 今天到期了」。注入量控制在几百字，不挤爆主任务。
- **触点**：`context` 组（agent-instructions / systemPrompt.section）、现有 reminders/health 纯函数。
- **来源观察**：`ask-copilot.ts` 已用「项目快照在前、问题在后」的稳定前缀打 prompt cacheReadTokens，但只在 ask 当轮有效；context README「为每次请求添加持久且模型可见上下文，不创建会话」正好补这个洞；compaction/spill 限制注入预算（见 D1-32）。

### D1-03 写动作工具 + interaction 审批 seam（人不在面板也能批草稿）
- **机制**：注册一个 `pm_apply` 写动作工具，白名单 op 直接复用 `copilot.ts validateActions`（task/milestone/risk/deliverable/meeting 的 create/update，拒绝 delete、拒环依赖），模型产出动作后走 `interaction/user-approval` 一次性 approve/deny seam 落库；乐观锁 baseline、60s 幂等标记、冲突拒绝全部复用现有 ask-apply 链路。
- **具体场景**：用户正在对话里聊方案，模型说「我建议把这个里程碑日期调到 11-28、登记一条限流风险」，屏幕上弹出宿主原生的一次审批选择（同意/拒绝），点同意即落库并写 provenance；用户根本不需要切到 Web 面板操作。
- **触点**：`interaction/user-approval`（未获决定默认拒绝）、`ctx.tools.register`、现有 ask-apply baseline/幂等/provenance。
- **来源观察**：`core/copilot.ts` 已有完整白名单+环检测；`idempotency.ts` 60s 标记与 baseline 冲突跳过已冻结；interaction README「一次性 approve/deny，未获得决定默认拒绝」；现状草稿确认只能在面板/A1 助手里点。

### D1-04 对话内业务节点卡片（台账记录直接渲染在聊天流里）
- **机制**：注册 `ConversationNodeDefinition` 并在 `conversation.chat.node` keyed slot 挂自己的 renderer，把任务卡/里程碑卡/风险卡/会议卡作为对话业务节点渲染；卡片可点，点了跳到面板对应抽屉。工具结果卡另在 `tool.call.toolview` 自渲染。
- **具体场景**：模型在对话里引用「t-12 登录页改造」时，聊天流里出现一张带状态色、负责人、截止日的任务小卡，而不是一行纯文本；用户点卡片，侧边面板自动定位到该任务抽屉。回放历史时卡片原样重现。
- **触点**：`conversation.chat.node`、`tool.call.toolview`、面板 openRecord 能力。
- **来源观察**：extension-cookbook L39/L133「浏览器插件向 Web Client 贡献业务行需注册 ConversationNodeDefinition + keyed renderer」；adding-a-tool L97「内置 Web Client 不消费 presentCall，插件在 tool.call.toolview 注册」；现状面板与对话流完全隔绝（UX-11 两张皮的一面）。

### D1-05 会话内多轮副驾（当前项目会话变量 + 记忆续问，结束即消散）
- **机制**：在一次 dsh 会话内维持一个「当前项目」会话变量，副驾支持多轮追问（「那它的里程碑呢？」「再看下风险」），项目快照作稳定前缀继续命中 prompt cache；不跨会话持久，符合寿命分层。
- **具体场景**：用户先问「分析一下 X 项目」，模型答完；接着追问「哪条任务阻塞最多？」「把阻塞的那条帮我拟个风险登记草稿」，不用每次重报项目名；会话关掉，副驾记忆随之消散，下次重开是干净的。
- **触点**：会话内状态/context；现有 buildAskContext。
- **来源观察**：UX-10「三个一次性按钮、不能多轮追问」；`ask-copilot.ts` 是单轮 Q&A、面板不读选区；session 寿命短，刻意不做成跨会话记忆（问题框定 R3 寿命错配警示）。

---

## 二、证据闭环（让「做过什么」被客观捕获，而不是只靠手填）

### D1-06 workspace-changes 回写任务证据（本地 git 工作树对账）
- **机制**：对已填 `repoUrl/branch` 的本地仓库，订阅 `workspace/changes` 事件或读 git 工作树快照，把「本轮改了哪些文件、行数 diff、提交」作为只读证据候选挂到任务的 evidenceUrl/证据区，人确认后附链接；不自动改进度。
- **具体场景**：用户在 dsh 里让 agent 改完 t-12 的代码，回到任务抽屉，里面多一条候选证据「本轮改动 3 个文件、+120/-40，对应分支 feature/x-1」；用户看一眼认可，点一下把链接附到任务上，周报快照就能引用这条客观痕迹。
- **触点**：`deliverables/workspace-changes`（git 快照+整文件捕获+逐文件对比+Web 改动文件卡）、fs；不联网探测。
- **来源观察**：UX-11「PM 天天被问 MR 合了没、代码写了没，台账和实际工作两张皮」；`project.ts` 已有 repoUrl/branch（PROD-21）但全程离线正则校验、从不探测（repo-format.ts）；ADL-028 deliverable.location 自由文本已留口。

### D1-07 会话日志反查证据（session-query FTS5 关联「为它工作过几轮」）
- **机制**：用实验性 session-query（SQLite FTS5 全文检索）/tool-session-query，按任务关键词、项目标签反查历史会话，把「本机为这条任务工作过 N 轮、累计 M 工具调用、墙钟 T 分钟」作为只读证据挂抽屉；只陈述事实，不据此宣称完成。
- **具体场景**：任务 t-12 详情里多一栏「本机痕迹：相关会话 3 段、最近一次 10-16、工具调用 41 次」；PM 复盘时能区分「真做过」和「只是嘴上说」，但完成状态仍由 checklist/人确认。
- **触点**：`experimental/tool-session-query`（五个只读工具、cwd 匹配）、`session-turn-outline`（轮次预览）、`session-stats`（轮次/墙钟计数）。
- **来源观察**：KB-100「没有状态事件历史，不能仅凭 updatedAt 宣称本周期完成」；R9 现状只能生成时拍当前状态；session-query README「opt-in、只读、排除调用方会话」；cwd 亲和与单用户本地天然吻合。

### D1-08 附件即证据（白板照/截图/设计稿挂任务）
- **机制**：任务/交付物可附加宿主持久图片附件，pm-tool 只存引用句柄；附件由 harness 落盘、重启仍在、后续轮次可再发给模型识别。
- **具体场景**：用户把白板会议照拖进对话，让 agent 顺手挂到对应会议纪要；或把设计稿截图贴到交付物上，模型下次讨论时能直接看见这张图，不用重新描述。
- **触点**：`attachment` 组（持久光栅图片、重启存在、后续轮次重发）。
- **来源观察**：现状 evidenceUrl 只存文字链接、没有图片通道；attachment README「图片附加到提示词和命令、保存到本机、重新显示在历史、后续轮次发给模型、重启不删」；单用户本地无隐私外发问题。

### D1-09 GitHub 事件：webhook 正向 + 轮询反向两条变体
- **机制（正向，附前提）**：用 `webhook-github` 适配器在 `ctx.webServer` 注册精确路由、验签、202 回执，webhook 规则把 PR opened/merged 事件变成一条新会话或一条任务状态候选草稿；**备注**：localhost 无公网入口，需内网穿透/部署才有意义。
- **机制（反向，本地可跑）**：不接 webhook，改用 `web_fetch` 或 GitHub MCP 按周期/手动拉取仓库 PR/commit 状态，回填任务证据草稿。
- **具体场景**：正向：PR 一合并，dsh 里自动出现一条「t-12 对应 PR #34 已 merged」候选，人确认后挂到任务。反向：用户在面板点「刷新仓库状态」，模型经 web_fetch 读 GitHub API 给出最新 PR 清单草稿。
- **触点**：`experimental/webhook`+`webhook-github`（正向）；`web` 组 web_fetch / mcp（反向）。
- **来源观察**：webhook-github README「精确 HTTP 路由、验证 GitHub 原始 JSON、投影后 dispatch、不等待返回 202」；webhook README「唯一内置动作：在 Web Workspace 创建普通根会话」；UX-11 MR 问题；本地单机使正向天然受限，故并列反向变体。

### D1-10 【独立/反向】pm-tool 自己暴露成一台 MCP server（反向融合：被别人消费）
- **机制**：把台账作为本地 MCP server 暴露（工具+资源），任意 MCP 客户端（Claude Code、其他 agent、甚至 dsh 自己的 mcp-client 连自己）都能读台账、提草稿；融合方向反过来——不是 dsh 吸收 pm-tool，而是 pm-tool 向所有 MCP 世界供货。
- **具体场景**：用户换一个 MCP 原生工具聊项目，那边的 agent 通过 MCP 直接读到本机台账并回答「哪些逾期」；pm-tool 不关心调用方是谁，dsh 只是众多客户端之一。
- **触点**：对外 MCP server（`mcp/mcp-client` 是消费侧；暴露侧另立进程）；现有 PmDomain 接口。
- **来源观察**：mcp README「连接外部 MCP 服务器、调用工具、读取资源、服务器指令」；问题框定 R5 平台存在性——「离开 dsh 后台账是否仍可被机器读」；product/11 契约「域接口是唯一边界，换后端零改动」天然适合被外挂。

### D1-11 消费外部 MCP 服务器取证据（GitHub/日历/工单）
- **机制**：在 profile 里配一台 GitHub（或飞书/日历）MCP server，agent 经 mcp-client 读其工具与资源，把 commit/PR/会议时间作为证据源写进草稿，pm-tool 自己不实现对接。
- **具体场景**：用户配好 GitHub MCP 后，问「这周合并了哪些和 X 项目相关的 PR」，模型调 MCP 工具读到列表，汇总成周报草稿候选。
- **触点**：`mcp/mcp-client`、`mcp-resources`（按需发现读取）。
- **来源观察**：mcp README「只有作用域中存在已配置服务器的调用方才看到其工具与提示词文本」；PM 天天被问的 Git/MR/群消息（UX-11）不必自研对接，借外部 server。

---

## 三、时间与调度（宿主已有的时钟，借不借）

### D1-12 借 schedule 做「到点进会话的提醒」（不是系统推送）
- **机制**：把临期/逾期任务注册为 schedule 的 at/daily/weekly/cron 规则，到期作为一条普通 follow-up 消息投递进原会话（不是 OS 弹窗/邮件/短信）；schedule 宿主持久化、重启保留、补发最近一次错过时点。面板派生提醒仍保留作双轨。
- **具体场景**：周五下午 17:00，原会话里自动收到一条「t-12 明天到期、尚未完成」的消息，用户在同一对话里顺手处理；dsh 重启过也不会漏。注意：headless/纯 SDK 组合挂不了，且投递要等 session/flush 才提交。
- **触点**：`schedule/tool-schedule`（at/every/daily/weekly/cron、compare-and-set、冷会话恢复）。
- **来源观察**：ADL-032/039 暂缓常驻推送是因为当时评「无主体、脆弱」；schedule README「提醒作为后续消息进入原对话、宿主重启后任务仍可用、只补发最近一次错过时点」「无法在 headless 或仅 SDK 组合单独挂载，需 Web Session controller + 持久化后端」；`reminders.ts` 现状是纯读时派生、零调度。

### D1-13 周报自动触发：schedule 周期 + jobs 后台 + 确定性快照 + narrate 草稿
- **机制**：每周固定时刻 schedule 触发一次内置流程：`collectProjectReport` 确定性采集数字 → `report-narrate` AI 只写叙述 → 生成待确认快照草稿进会话；无人确认不落库；长采集跑在 `ctx.jobs.start` 后台任务里，完成通知进会话。
- **具体场景**：每周五 16:00 自动开始汇总，jobs 跑完后会话里出现一张「本周周报草稿（数字已锁定、叙述待润色）」，用户点开确认或改两句；不用自己记着写周报。
- **触点**：`schedule`、`jobs`（JobHandle/cancel/done/输出环/owner cleanup）、现有 R9 快照 + R14 narrate。
- **来源观察**：R9/R14 已完成确定性快照+AI 叙述分离；feasibility-map「schedule 负责到点触发、内容自研」；jobs README「后台任务、完成通知、owner cleanup」；现状周报全靠人手动触发。

---

## 四、导出、形态与分发

### D1-14 报告直出 PDF / PPT（office-to-pdf + skill-office）
- **机制**：把 R9 固定快照/里程碑汇报经 `document/office-to-pdf` 或 `skill-office` 的 Word/PPT/Excel 工作流转成可直接外发的 PDF 周报或 PPT 里程碑汇报；数字仍取自有不可变快照。
- **具体场景**：用户在面板点「导出本周周报 PDF」，直接得到一份排版好、可发领导的文件；里程碑阶段自动拼几页 PPT。LibreOffice 缺失时退化为 WASM 或纯 Markdown。
- **触点**：`document/office-to-pdf`（DOC/DOCX/XLS/XLSX/PPT/PPTX，原生 LibreOffice 或 Node WASM）、`skill/skill-office`。
- **来源观察**：requirements R4「后续可接 office-to-pdf 出 PDF」；skill-office README「Word/PPT/Excel 工作流、LibreOffice Kit CLI 渲染/转 PDF」；现状 export 只有 Markdown/JSON。

### D1-15 看板导出为单文件静态 HTML / 图片（给不装 dsh 的人看）
- **机制**：客户端 bento 看板（7 卡 + filter DSL + 公式引擎）加一个「导出本看板」：序列化成自包含单文件 HTML（或截图 PNG），经现有 Blob 通道下载；不要求对方有 dsh。
- **具体场景**：要给协作方看当前项目态势，用户一键导出一张只读看板图/HTML，微信里发出去对方直接打开；对方不需要装任何东西，也读不到可写台账。
- **触点**：纯客户端（现有 `web snapshot` + Blob 下载通道 ADL-042）；board/query.ts、formula.ts、widgets.tsx 已就绪。
- **来源观察**：`client/board/` 已有 7 卡 WidgetDescriptor、字段白名单 filter DSL、惰性 expr-eval 公式引擎、user/project 两档布局持久化；ADL-042 Blob 直接下载；H11「潜在他人阅读」未满足。

### D1-16 本地消费自检：telemetry/feedback 埋 N/M 计数（自我证伪用，不上报）
- **机制**：本地记录「台账被 agent 读 N 次、草稿被采用 M 次、被拒/纠正 K 次」，用 `feedback` 逐消息评分当接受/拒绝信号，本地聚合成一张自检表；不接远程上报。直接服务问题框定的可证伪成功标准。
- **具体场景**：主人每隔一阵看一眼「这个月 agent 读台账 87 次、采纳草稿 12 次、拒 3 次、纠正 5 次」；若 N≈0，就按框定标准判定融合命题失败，而不是自我感觉良好。
- **触点**：`telemetry`（本地事件选择/脱敏，不上传）、`feedback`（逐消息评分，且评分永不回喂模型）。
- **来源观察**：问题框定成功标准「N≈0 即证伪；接受/拒绝/纠正比例」；feedback README「逐消息评分不会到达模型，是关于输出的信号」；telemetry README「业务插件选择事件、身份、授权和脱敏规则」。

### D1-17 preset 打包：随插件发一个「PM 专用 agent 能力包」
- **机制**：用 `agent-preset` 在 Cordis YAML 里声明一套子插件组合（只读工具 + 审批 + 模型路由 + PM skill），用户在会话里选这个 preset 就一次性获得全部 PM 能力，不必逐个开关。
- **具体场景**：新装 dsh 的人在插件页选一次「PM 模式」preset，工具、模型车道、提示词一起就位；普通会话不加载，零负担。
- **触点**：`preset/agent-preset`（普通 YAML 定义子插件列表、可声明多个、会话选择、提前加载）。
- **来源观察**：preset README「定义 Agent 子插件列表，修改只影响之后创建的 Agent」；现状能力散落在命令/面板里，没有「成套交付」的分发形态；分发与商业层需要一个打包单元。

---

## 五、独立 / 反向 / 剥离 / 保持现状（刻意不融合一侧）

### D1-18 【独立/反向·现状】刻意冻结：评估过但一律不接新宿主能力，只磨面板内完整性
- **机制**：显式维护一份「已评估、不接」清单（schedule/mcp/subagent/webhook/telemetry/工具注册全部标注无主体），路线收敛为纯前端 + 离线命令打磨：补 checklist、客观进度、窄屏、键盘、导入导出；不向宿主借任何新能力。
- **具体场景**：每个新宿主能力冒出来时，团队只在清单里记一行「评估结论：单人本地无主体，不接」，产品保持现在的样子稳步抛光；不做架构押注。
- **触点**：无新增宿主依赖。
- **来源观察**：R4 调用主体根问题；decision-log 里 ADL-032/039/031/030 一连串「暂缓/裁剪」裁决；optimization-backlog 结构性长期项；问题框定把「深度融合」列为候选答案而非前提。

### D1-19 【独立/反向】剥离成独立纯文件应用：pm-core 抽 npm 包 + 自带静态壳
- **机制**：把已经是无 I/O 纯函数的派生/校验/导入导出层抽成独立 npm 包，配一个自带静态 Web/CLI 壳直接读 `data/pmtool/*.json`；dsh 插件降级为薄薄适配层；AI 改为可选直连标准 API。
- **具体场景**：三年后 dsh 无人维护了，用户仍能用独立壳打开同一份 JSON 台账、跑全部视图；dsh 只是可选的 AI 增强，不是运行前提。
- **触点**：无宿主（PmDomain 接口已抽象，11 号契约「换后端注入 PmDomain、业务零改动」）。
- **来源观察**：product/11 协作契约「域接口是唯一边界，永远不直接 import KvUnit，远程化=换后端」；personal-billing-plan §4「脱离 dsh 需改走标准 API 按量付费」；R3 最小独立内核、R5 离开平台是否仍可读；现状 core 大量纯函数（health/derived/people-load/completion-history/report-diff/progress-derivation）天然可抽。

### D1-20 【独立/反向】反向薄壳：dsh 只当一次性模型计算器，其余全是自己的文件
- **机制**：不注册工具、不订阅事件、不读会话、不接调度；宿主只提供「调一次 LLM 生成草稿」这条通道，数据形态、界面、存储、校验全部自己的文件；宿主整体可替换。
- **具体场景**：换任何一个能调模型的壳，同一套文件和面板照常工作；dsh 消失不影响台账本身。AI 永远是一次性文本生成，确定性落盘全在自己代码里。
- **触点**：仅懒读 LLM（现状已是 `ctx.reflect.get('llm',false)`）。
- **来源观察**：ADL-036「LLM 只做一次性文本生成，确定性落盘在我方代码，AI 绝不直接写库」；C2 离线红线；现状已经是这个形态，本想法是把它自觉化、声明为产品立场而非过渡态。

### D1-21 【独立/反向】退化成格式供应商：台账写成通用开放格式，让用户已有的工具消费
- **机制**：不做融合、不做协同，把台账导出为 iCal 日历订阅、CSV/Excel、Markdown，pm-tool 退化为「校验器+编辑器」，消费方是用户已有的日历、Excel、笔记软件。
- **具体场景**：用户把导出的 iCal 订阅进自己的日历，到期自然出现在手机日历；CSV 拖进 Excel 自己做透视；pm-tool 不争夺展示位。
- **触点**：无新宿主能力（现有 export MD/JSON、csv-import 反向导出、Blob 下载）。
- **来源观察**：R4 人类可读 JSON 原则；backup-sync.md 单写者同步指引；现状 export 已有 MD/JSON；问题框定「为什么必须经由宿主」的反面回答。

### D1-22 【独立/反向】零遥测零上报作为合规卖点（与 D1-16 对照池）
- **机制**：显式不接 telemetry/feedback/任何外发，把「本地无上报、密钥不入库、台账不出本机」写成明确承诺；采集仅限本机自检且可关。
- **具体场景**：个人/敏感项目负责人被问及数据去向时，一句话答「全在你本机 JSON，没有任何上报通道」；与 D1-16 的「本地计数」区分：D1-16 是本地自看，本想法是把「绝不外发」当身份。
- **触点**：无（刻意不接 telemetry/feedback）。
- **来源观察**：ADL-035 密钥不入库、credentials 只存引用；personal-billing-plan 本地敏感台账；telemetry README 虽支持上报，但本想法是主动选择不用。

---

## 六、疯狂 / 反常识

### D1-23 【疯狂】让 agent 自主执行 PM，台账退化成只读账本 + 异常升级给人
- **机制**：注册全套工具后，允许 subagent/workflow 在边界内自主按台账推进（标完成、提风险草稿、挪日期），pm-tool 只做校验、留痕、provenance 审计，只有异常（冲突/高风险/超期）才升级给人批准。**与现有「草稿确认制」红线正面相撞，标注为边界探索。**
- **具体场景**：派一个子 agent 围绕项目目标迭代，它自己把已完成的 checklist 勾上、把解除阻塞的风险关掉；人只在它判定「要改交付日期」时被叫醒一次。
- **触点**：`subagent`（ACP 进程外委派）、`workflow`（模型编写的扇出编排）、`goal`、provenance 审计链。
- **来源观察**：R2「是否存在 agent 无人逐次指示自主完成 PM 动作并被接受的真实场景」；goal README「每会话持久完成目标、自动续行、重启/fork 恢复」；ralph 固定全新 agent 循环；反常识点：直接挑战 ADL-036/ADL-054 的人门确认红线。

### D1-24 【疯狂·反常识】极致沉默哲学：拒绝一切提醒/推送，只靠「打开时的差异」制造回顾
- **机制**：反向于 D1-12/D1-13——显式拒绝 schedule、拒绝后台、拒绝常驻；产品身份就是「无常驻、无推送、无打扰」。打开面板时用 `domain/changed` 进程内事件对比两次快照，把「你不在的这段时间变化了什么」做成一份差异回顾。
- **具体场景**：用户两周没打开，再点开时看到一页「这两周：新增任务 3、逾期 2、里程碑临近 1」的静默差异，而不是被推送追着跑；产品主动选择不打扰。
- **触点**：`storage-domain` 的 `domain/changed` 进程内事件（单进程内可见）、纯快照对比。
- **来源观察**：ADL-039 读时派生、无常驻；storage-domain README「domain/changed 是进程内事件，第二进程观察不到」；反常识点：别人都在做提醒推送，这里把「沉默」做成主张。

### D1-25 【疯狂】被动捕获：人不主动录任务，从会话日志/git/速记里自动抽候选进草稿箱
- **机制**：人几乎不手动建任务；插件从 agent 会话日志（session-query）、git 提交、粘贴的速记、白板照附件里自动抽取候选任务/风险/行动项，全部进「待认领草稿箱」，人只做归类和确认；台账从「录入手册」变成「收件箱」。
- **具体场景**：一次开发对话结束后，草稿箱里出现 4 条候选：「修复登录超时」「补单测」「记一条第三方限流风险」，用户扫一眼留两条、删两条，台账就这样长出来。
- **触点**：`session-query`、`web_fetch`、`attachment`、现有 meeting-summarize 抽取链路、task-import 落盘。
- **来源观察**：UX-11 两张皮（工作发生在对话里，台账靠人另录）；R1 断点「证据从哪捕获」；meeting-summarize 已验证「粘贴速记→结构化→confirm 落盘」可行，本想法把同一链路扩到会话与 git。

### D1-26 【疯狂·反潮流】把「单机单写者、10 年可读」做成硬卖点，逆多人协作潮流
- **机制**：拒绝多人/实时协作/云端，反向把「一台机器、一个人、一份人类可读 JSON、十年后照样打开」做成产品身份；随附「dsh 卸载后自检包」：doctor 体检 + 全量导出 + 独立只读 viewer。
- **具体场景**：宣传语不是「团队协作平台」，而是「你的项目记忆不被任何平台绑架，换电脑、换软件、十年后都能读」；交付时给一个不依赖 dsh 的静态 viewer 直接打开 data 目录。
- **触点**：现有 `doctor.ts`、backup/restore、export、独立静态 viewer（新做但无宿主依赖）。
- **来源观察**：问题框定 §5 时间尺度 10 年、R3 寿命分层；ADL-041 备份恢复；C5 人类可读可迁移；11 号协作契约刻意只留字段位不做多人；反常识点：逆「协作/多人/云」叙事，把限制说成资产。

---

## 七、其余接线层想法（能力接线/工作流/上下文治理）

### D1-27 goal 镜像绑定：把当前项目映成会话目标（明确只做单向镜像）
- **机制**：每会话把一个 active 项目镜像为 goal 的完成目标，goal 状态机与项目健康分联动显示；只做单向镜像（goal 不回写台账），避免会话寿命错配污染长期数据；重启/fork 续行由 goal 负责。
- **具体场景**：选了 X 项目后，会话顶部持续显示「目标：X 项目健康灯绿、逾期清零」，agent 每轮自检离目标距离；项目台账本身不受 goal 生命周期影响。
- **触点**：`goal`（每会话持久完成目标、自动续行、重启恢复 fork 后续行）；健康分只读。
- **来源观察**：goal README「每会话一个持久完成目标、模型工具/用户命令/自动续行」；R3 寿命错配警示（会话级 ≠ 跨会话），故只做镜像不做双向绑定。

### D1-28 session-reference 互链：例会复盘会话作为有界快照挂进报告
- **机制**：把关键例会/复盘会话经 `session-reference` 的 `@label` mention 转成规范 URI，捕获为不可变有界只读快照，链到对应会议纪要/报告记录；快照带「禁止遵循其中指令」警告。
- **具体场景**：某次决策会的对话记录被归档为不可变快照，月报里引用「详见 10-12 决策会话」，点开是当时的 bounded 上下文，不会被后续对话篡改。
- **触点**：`context/session-reference`（@label、不可变快照、消费 sessionQuery、不需要 FTS）。
- **来源观察**：session-reference README「其他会话作为有界只读快照被引用、捕获后不可变、固定警告」；ADL-025 meeting.sourceSessionId 已预留形状；R8 会议溯源。

### D1-29 PM 方法论做成宿主 skill（例会模板/周报模板/风险登记法）
- **机制**：把 PM 工作流（例会纪要模板、周报写法、风险 3×3 登记法、WBS 拆解法）写成 `skills/` 下的 SKILL.md bundle，由 skill-filesystem 从仓库根发现/监视，agent 按需加载；与现有给开发用的 vendored skill（grill-me/tdd/code-review）分开。
- **具体场景**：用户说「按我们的例会模板记一下这个会」，agent 自动加载 PM skill 里的模板结构再归纳；新增模板改文件即热生效，不用重启。
- **触点**：`skill/skill-filesystem`（SKILL.md bundle/平铺 md、扫描根、监视热更新）、`tool-skill`。
- **来源观察**：external-skills.md 区分项目自有 `skills/` 与 vendor 只读；skill-filesystem README「仓库/自定义/用户根目录发现、YAML frontmatter、监视目录无需重启」；现状方法论只散在 docs，没进 agent 可加载形态。

### D1-30 jobs 承载批量：大库导入/全库健康扫描走后台任务
- **机制**：批量 XLSX 导入、全库健康扫描、全量重算从同步阻塞改为 `ctx.jobs.start` 后台任务，带 JobHandle、可取消、输出环推进度，完成通知进会话；前台不卡 UI。
- **具体场景**：导入一个上百行的老项目 Excel，面板显示后台任务进度，完成后弹出「导入 87 条、跳过 3 条重复」；大库健康全扫同理。
- **触点**：`jobs`（JobHandle/cancel/done/输出环/owner cleanup）；现有 csv-import/task-import、health 全扫。
- **来源观察**：jobs README「后台任务、类型化句柄、拉取式输出环、owner cleanup」；feasibility-map「jobs 批量导入、报告生成长任务」；现状导入同步执行，大文件会堵。

### D1-31 【独立/反向】SDK 形态：独立 CLI/TUI 壳经 JSON-RPC 借 dsh 的模型，UI 全自己的
- **机制**：写一个独立终端壳，经 `sdk`（换行分帧 JSON-RPC，TS/Python 同协议）拉起 dsh 会话只借模型能力，界面与存储全在自己进程；不依赖 Web 面板。
- **具体场景**：用户习惯终端，在自己的 TUI 里管台账，需要 AI 草稿时经 SDK 拉起一次 dsh 会话取文本；dsh 的 Web UI 根本不开。
- **触点**：`sdk`（进程外 JSON-RPC、打开会话/发提示词/观察事件、Python SDK 同协议）。
- **来源观察**：sdk README「另一进程驱动完整运行时、TS 客户端+Python SDK 同协议」；personal-billing-plan 个人开发者成本敏感；R5 离开平台形态的又一选项（与 D1-19 纯离线并列：D1-31 仍借模型，D1-19 连模型都不依赖）。

### D1-32 注入预算治理：上下文小到不挤压主任务（compaction/spill 配套）
- **机制**：给 D1-02 的持久上下文设硬性字节预算，超长台账走 spill offload 而不是全量进上下文；监控 compaction 触发频率，防止 PM 元数据把主开发任务挤出窗口。
- **具体场景**：项目涨到几百条任务时，注入上下文始终只有几十行摘要，细节靠 D1-01 工具按需取；用户观察不到 PM 数据拖慢主对话。
- **触点**：`compaction`（自动/手动压缩、输出修剪）、`spill`（大结果存储服务+本地后端+结果策略）。
- **来源观察**：compaction/spill README；C2 免费额度约 50 次/天、预算敏感；现状 ask 已压快照前缀打缓存，但持久注入若不加预算会反噬。

---

## 附：本轮自我盘点（供组织者分组用，不做评价）
- 独立/反向/现状侧：D1-10、D1-18、D1-19、D1-20、D1-21、D1-22、D1-31（7 个，≥3 达标）
- 疯狂/反常识：D1-23、D1-24、D1-25、D1-26（4 个，≥3 达标）
- 覆盖层：数据/存储（D1-19/21/22）、能力接线（D1-01/02/03/10/11/17/27/28/29/30/32）、交互形态（D1-04/05/15）、工作流（D1-12/13/23/25）、产品形态（D1-14/26/31）、分发商业（D1-16/17）、反面（D1-10/18/20/21/22）。

==================== 发散者 D2 ====================

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

==================== 发散者 D3 ====================

# 阶段1 开放发散 · 第1轮盲发 · D3

> 规则声明：无视角、无评分、无批评、无可行性筛选。以下想法全部保留，包括疯狂与反向。
> 素材均来自本人对源码与文档的亲自阅读，未阅读两份禁用设计稿。
> 标注约定：【反向/独立】= 不融合、反向、剥离、独立、保持现状一侧；【疯狂】= 初看反常识。

---

## D3-01 只读台账工具包：让 agent 在对话里「查得到」，但一个字都写不进

- **机制**：用宿主 `defineTool` 注册一组纯只读工具（如 `pm_list_projects`、`pm_get_tasks(projectId, status?)`、`pm_get_milestones`、`pm_search_records(keyword)`），工具 execute 只从 storageDomain 读快照并返回规范 JSON；schema 自动进入模型系统提示词，参数由宿主自动校验。所有写工具一个都不注册。
- **具体场景**：PM 在 dsh 对话里随口问「官网改版项目现在还有几个逾期、卡在谁手上」，模型调 `pm_get_tasks` 拿回结构化任务清单，直接在对话里回答并顺带指出逾期的两条；PM 全程没开面板，模型也没有任何途径改台账。写动作仍只能走面板草稿确认或 `/pm` 命令。
- **触点**：宿主 `ctx.tools.register(defineTool(...))`（docs/cookbook/adding-a-tool.zh.md）、`storageDomain` 只读读口、自动生成的工具 schema。不触碰写队列、不碰 provenance。
- **来源观察**：现状 pm-tool `inject=['commands','storageDomain']`，源码里没有任何 `ctx.tools.register`（index.ts 头部；fact-pack R2 事实2）；面板是唯一写通道（client/index.tsx 第12-30行，所有写经 `remote.commands.execute(sessionId,'/pm ...')`）。对话目前对台账是「瞎」的，只读接线成本最低、且天然守住草稿确认红线。

## D3-02 写动作审批卡搬进对话：pm_propose 草稿工具 + userQuestions 单选确认

- **机制**：注册一个 `pm_propose` 写草稿工具，模型只能产出「动作建议数组」（复用 copilot.ts 的 ALLOWED_OPS 白名单与 validateActions 校验），真正落库前调用宿主 `interaction/user-questions` 的 `ask()` 渲染一张审批卡（逐条勾选/全采纳/拒绝），PM 在对话里点确认才经 `/pm` 落库；工具 execute 本身不写。
- **具体场景**：PM 在对话里说「把这礼拜能收尾的任务帮我推进到完成」，模型返回 3 条建议，对话里弹出一张卡列出「T-12 改 done ✅ / T-18 改派赵六 ✅ / 建议删除 T-21 ❌（被白名单拒）」，PM 勾选后点确认，台账落库并写一条 provenance applied 记录。
- **触点**：`defineTool`、`ctx.interaction.userQuestions.ask()`（单选/多选/自由回答）、既有 copilot.ts 解析校验纯函数、provenance-store 落账。
- **来源观察**：copilot.ts 已有完整的 8 个白名单 op、字段白名单、环依赖局部拒、模型输出不可信只抽动作；ask-copilot.ts 是一次性压缩快照上下文+草稿确认。现状草稿确认只发生在 Web 面板（P1-7 内嵌建议层 copilotMode='diagnosis'|'draft'），对话里连提议都发不出。

## D3-03 对话流里的业务卡片：工具结果渲染成任务卡/里程碑菱形，可点采纳

- **机制**：给只读/提议工具写 `presentCall`/`presentResult` 纯函数投影，让工具结果在对话流里渲染成台账原生样式的卡片（任务行、里程碑、风险徽章），卡片上带「采纳/忽略」按钮，点采纳即转 D3-02 的审批流；实时流式与会话回放都由同一纯函数派生。
- **具体场景**：模型回答「逾期清单」时，对话里直接出现三张和面板同款的任务卡（编号、标题、负责人、逾期天数红色徽章），PM 不用切到面板对照；对其中一张点「推进完成」，卡片原地变成待确认草稿态。
- **触点**：adding-a-tool.zh.md 的 presentCall/presentResult、ToolCallView、`tool.call.toolview` keyed slot；复用面板已有卡片样式（client/panel.tsx 的任务/里程碑渲染）。
- **来源观察**：adding-a-tool.zh.md 明确「UI 卡片是独立关注点，通过纯展示投影 + presentCall/presentResult 声明」；现状 CommandResult 契约只透传 kind/text（client/index.tsx 第25-26行注释），对话里看到的永远是纯文本，台账的视觉身份在对话侧完全丢失。

## D3-04 周期到点的「该写周报了」：复用宿主持久 schedule，只投草稿不落库

- **机制**：PM 在面板给项目设一个「每周五 17:00 周报提醒」，pm-tool 调宿主 `schedule_create` 注册一条持久提醒；到期宿主把它作为一条普通 follow-up 消息投递进原会话（不是系统推送、不常驻进程），pm-tool 只生成周报草稿文本交 PM，不落库、不替人写。
- **具体场景**：周五下午 17 点，dsh 会话里自己冒出来一条「本周 XX 项目：完成 3 条、逾期 2 条、待写周报，要我拟一稿吗？」，PM 回复「拟」，模型基于快照出草稿，PM 改完再手动存 progress-report。host 没开的日子提醒不会自启，也不需要 pm-tool 自己养后台进程。
- **触点**：宿主 `@deepseek-ai/dsh-schedule` + `dsh-tool-schedule`（schedule_create/list/update/delete，存储调度投递由宿主负责，重启保留）、既有 progress-reports 快照与 report-narrate 成稿逻辑。
- **来源观察**：ADL-032（decision-log.md）曾因「常驻调度进程与离线优先冲突」暂缓周期提醒；但宿主 schedule 的语义是「host 自身调度、到期进原对话、host 不开不触发」，与 R18/R19 保护的「常驻后台守护进程」其实不是一回事，值得重新评估。reminders.ts 现状提醒只是面板内本地高亮（记录在 session 内存，重启失效）。

## D3-05 代码改动只读旁路：把宿主 workspace-changes 的本轮 diff 列进任务证据区

- **机制**：pm-tool 不自动回写，只在任务抽屉的「代码证据」区只读调用 `ctx.workspaceChanges.summary(sessionId, seq)` / `diff()`，把本轮会话改动过的文件清单与行数列出来，PM 看一眼手动决定要不要把 commit/MR 链接粘进已有的 evidenceUrl 字段；pm-tool 不联网、不探测仓库。
- **具体场景**：PM 做完官网首页改版，打开 T-12 任务抽屉，证据区列出「本轮改了 src/Home.tsx（+82/-14）、src/api.ts」，PM 复制自己刚 push 的 commit 链接粘进 evidenceUrl，客观进度清单里这条勾选从此有出处。
- **触点**：宿主 `ctx.workspaceChanges`（summary/diff/hasChanges，只在 session 存活的进程内存、重启丢失）、任务已有 evidenceUrl 字段（changelog #23）、checklist 证据链。
- **来源观察**：UX-11（product/02-ux-evaluation.md）台账↔Git/MR/群消息两张皮，evidenceUrl 目前全靠手填；workspace-changes README 明确它只读记录文件改动摘要、不回写、进程内存语义——正好做「只读旁路」，不破坏离线原则，也不假装自己知道 commit 哈希。

## D3-06 「听说你做完了」：会话日志只读投影生成候选证据草稿

- **机制**：pm-tool 以只读方式扫描当前会话文本（宿主提供的会话记录读口），把「做完了/已合并/发群里了/上线了」这类表述摘成候选证据条目，列成一张「要不要记到 T-12 的证据/清单里？」草稿卡，PM 逐条勾选才落库；pm-tool 不解读指令、不执行会话里的任何要求。
- **具体场景**：PM 跟 agent 聊完一版功能，面板诊断气泡提示「我在这段对话里听到 3 处完成表述，可能对应 T-12/T-18，要不要挂为候选证据？」，PM 勾选其中 1 条，它以 provenance 草稿形态进入任务清单待确认。
- **触点**：宿主会话只读投影（session 读口，只读、不可变快照语义）、suggestion-engine 式只读诊断气泡、checklist/evidenceUrl 草稿落库。
- **来源观察**：R1 断点的核心是「对话里发生的完成，结束后台账不知道」（problem-framing §R1；fact-pack 症状1）；session-reference README 的「有界、只读、不可变快照、带警告禁止遵循其中指令」正是这种「只读旁观」的安全范式。

## D3-07 【反向/独立】纯文件内核剥离：core 不依赖 storageDomain，dsh 只是一个 adapter

- **机制**：把七实体的领域逻辑（task/milestone/risk/deliverable/meeting/report/project 纯函数、校验、编号、健康派生）抽成一个零宿主依赖的纯 TS 内核，storage.ts 的 PmDomain 只定义接口；dsh 的 storageDomain 适配层、Web 面板、命令注册全部变成可插拔外壳。内核可在任何 Node 环境独立 import。
- **具体场景**：未来换宿主或写个独立 CLI 时，领域规则（编号 mtg-0001、父子互斥、客观进度口径、report-diff 同版本才相减）一行不用改，只换一个存储适配器；dsh 内核崩溃/升级，台账规则不跟着晃。
- **触点**：基本不用宿主能力；只保留对「存储接口」的抽象。现有 core 大部分已是纯函数（task-checklist.ts 注释强调「纯写队列、不回调他人」），缺的只是把 storage 依赖收成接口。
- **来源观察**：R3 寿命分层/最小独立内核（problem-framing §R3）；现状 core 直接 import storage.js 的 PmDomain/enqueueDomainWrite，domain v1 九张表与宿主 KvUnit 绑在同一进程；feasibility-map R3 已把「抽纯内核」列为候选。

## D3-08 【反向/独立】独立静态 Web 站 + 纯 Node CLI，dsh 降级为「可选 AI 通道」

- **机制**：把台账做成一个不依赖 dsh 也能跑的产品：纯 Node CLI 管 CRUD，另出一个纯静态只读/只读看板站（data/ JSON 直接喂）；dsh 只是可选挂载的 AI 生成后端之一，接别的 agent 或不用 AI 都能活。
- **具体场景**：PM 在没开 dsh 的另一台机器上用 `pmcli list --project prj-01 --overdue` 查逾期，或手机浏览器打开静态看板看本周完成曲线；想让 AI 拆解 WBS 时才把 dsh 接上。
- **触点**：无（产品主体脱离宿主）；AI 通道通过 stdin/文件交换。注意：personal-billing-plan.md 明确脱离 dsh 后用 Coding Plan key 违规、必须换标准 API key——这是这条路线自带的真实成本，记录在案不筛选。
- **来源观察**：R5 平台存在性（problem-framing §R5：先问离开 dsh 还剩什么）；backup-sync.md 已给出 data/ 目录放同步盘、单写者禁令；personal-billing-plan.md 独立部署合规前提；R18/R19 备份恢复/本地存储本来就是为「带走数据」设计的。

## D3-09 【反向/独立】什么都不做：挂起「深度融合」命题 3 个月，用本机计数证伪 H1/H3

- **机制**：不新增任何接线，先在现有面板上埋极轻的本机计数（打开次数、ask 草稿被采纳条数、周报实际写成份数），3 个月后用真实数字对照 H1（高频写台账）/H3（AI 有用），数字不达标就把融合命题正式降级为「面板工具」。
- **具体场景**：3 个月后 PM 自己看计数：ask 一个季度只被采纳 2 次、周报全是手填——于是结论自然是「不需要接对话」，避免为想象中的融合投入开发。
- **触点**：无新宿主能力；计数写在本地一个小 JSON，不上传（对照 telemetry 的可选项，这里明确选不上传）。
- **来源观察**：H1/H3 目前是未被验证的假设（problem-framing 校准注释：深度融合是候选答案不是前提）；personal-billing-plan.md 的成功标准本来就要求可计数；现状用户就是作者本人、无二手证据，先测量再接线比先融合更省。

## D3-10 【反向/独立】拒绝注册任何模型写工具，把「一次性文本生成」路线焊死

- **机制**：明确决定不做工具写、不做对话提议，AI 永远只走 ask-copilot/wbs-ai/meeting-summarize 三条「一次性生成草稿文本、人去面板确认」的固定模式；模型在对话里连台账都查不到，台账与对话在物理上隔一道墙。
- **具体场景**：PM 想让 AI 出 WBS，就在对话框粘 `/pm ask ...` 或面板点智能拆解，拿到 Markdown 清单去面板 confirm；模型不会在自己的循环里顺手改任何一条记录，免费车道 function-calling 不稳也无所谓，因为根本不依赖它。
- **触点**：无新增；维持现有三条一次性生成通道。
- **来源观察**：generative-features-plan.md §0 与 KB-034：免费车道不保证 function-calling，所以现设计全部采用「一次往返 + 文本草稿」；这是一条被现实约束反复强化过的路线，反向把它当作原则而非临时妥协，也是一个自洽选择。

## D3-11 【疯狂】台账即 AGENTS.md：项目计划作为只读持久上下文，每次开工自动在场

- **机制**：把「当前项目的未完成任务 + 今日议程 + 逾期清单」渲染成一份 AGENTS.md 式的只读上下文块，经宿主 agent-instructions 机制持久注入，agent 每次开工先看到项目状态；台账是源，上下文是只读投影，反向不允许 agent 写。
- **具体场景**：PM 新开一个会话写代码，agent 一上来就知道「你在做官网改版，T-12 进行中、T-18 逾期、今天 15:00 站会」，不用 PM 口头复述项目背景；agent 做完想更新状态，仍然只能建议、由人去面板确认。
- **触点**：宿主 context/agent-instructions（AGENTS.md/CLAUDE.md 加载、文件编辑后刷新）、project 快照只读渲染；只读，不挂写工具。
- **来源观察**：agent-instructions README 讲的正是「持久、随每次步骤可见的模型上下文」；R2 机器可操作性的反面问法是「台账能不能变成 agent 的工作背景」，而现状对话对项目一无所知（fact-pack 症状2）。疯狂点在于：不是 agent 操作台账，而是台账一直盯着 agent。

## D3-12 【疯狂】取消 Web 面板，退回斜杠命令 + 导出 Markdown，面板只留只读看板

- **机制**：主动砍掉面板的全部编辑能力（抽屉表单、行内编辑、确认按钮都下线），写动作只认 `/pm` 斜杠命令与 confirm；面板降级为只读看板（列表、看板、曲线、风险矩阵展示），编辑叙事让给命令历史。
- **具体场景**：PM 改任务状态只敲 `/pm task update T-12 --status done`，想核对就开面板看一眼；面板不再是「第二个表单」，只是橱窗。已投入的面板编辑层被当作可回退的实验，不心疼。
- **触点**：无新宿主能力；保留 web snapshot 只读投影，写全部回 commands。
- **来源观察**：ISS-026（issues-and-solutions.md）/UX-15：顶栏 8 按钮主次不分、欢迎页补全不可达；命令体系其实已经完整（task/project/milestone/risk/deliverable/meeting/report/warroom/people/import/export/backup），面板是后来长出来的；反向砍掉编辑层能把「对话读写边界」问题直接消解。

## D3-13 【疯狂】任务反向开工：抽屉里点「开工」，自动按任务标题建一个 dsh 会话并携带上下文

- **机制**：任务抽屉加一个「开工」按钮，pm-tool 通过 sessions 服务新建一个会话，把任务标题、验收口径、checklist、相关交付物拼成初始上下文发进去；会话结束 agent 产出的文件经 present 回到任务，人确认后才勾清单。方向是「任务→会话」而不是「会话→台账」。
- **具体场景**：PM 在 T-12 抽屉点「开工」，自动弹出一个新会话，开场就是「任务：完成首页改版；验收：清单 4 项；交付物：首页设计稿」；干完后会话末尾的交付卡片出现在任务证据区，PM 勾选对应清单项。
- **触点**：宿主 `sessions.create()`（client/index.tsx 第22行已经在缺会话时 create，说明会话可程序化建）、present 交付卡片、checklist 勾选回写。
- **来源观察**：现状 client/index.tsx 只是借第一个会话当命令句柄、从不利用会话语义；R4 调用主体（problem-framing §R4）问「谁来发起」，疯狂答案是让台账主动发起会话，而不是等 PM 在会话里想起来台账。

## D3-14 【疯狂】Markdown 为唯一真源，JSON 降级为派生缓存（10 年档案尺度）

- **机制**：台账实体直接以 Markdown 文件落盘（每任务一个 md、每会议一个 md、每周报一个 md，frontmatter 存结构化字段），JSON/SQLite 只是渲染看板时生成的缓存，可随时从 md 重建；目标是 dsh 消失十年后用任何文本编辑器/grep 都能读懂档案。
- **具体场景**：换了软件、dsh 停运，PM 打开 archives/ 目录，直接用 VS Code 读「2026-Q4-官网改版.md」，历史会议决议、行动项、完成证据全是可读文字；缓存 JSON 删了也能重建。
- **触点**：无（纯文件格式选择）；复用现有 export.ts 的 Markdown 渲染能力反转为真源。
- **来源观察**：R3 寿命分层（problem-framing §R3：短命会话 vs 长命档案）；export.ts/report-narrate.ts 已经能把台账渲染成 Markdown；R18 备份恢复、backup-sync 同步盘指引都暗示「文件可携带」是底层信仰；疯狂点是把现在的「导出格式」升格为「存储格式」。

## D3-15 台账包装成本地 MCP server：dsh 只是众多客户端之一

- **机制**：把只读查询、草稿提交、报告生成包成一个本地 MCP server（stdin/stdio），暴露工具与资源；dsh 的 mcp-client 只是连它的一个客户端，Cursor/其他 agent/编辑器插件也能连。pm-tool 不再为 dsh 一家定制对话形态。
- **具体场景**：PM 在另一个支持 MCP 的编辑器里直接问「这个项目逾期几条」，编辑器 agent 连本地 MCP server 回答；dsh 里照样用面板。换宿主不用改台账核心。
- **触点**：宿主 mcp-client/mcp-resources（README：连外部 MCP 服务器、暴露工具与资源）、本地 stdio 进程；存储仍是本地 data/。
- **来源观察**：R5 去留（problem-framing §R5：不假设长留在 dsh）；mcp README 讲清了「外部服务器 + 工具/资源」的标准接法，pm-tool 当服务端、dsh 当客户端是对称位置。

## D3-16 以 skill 形态而非工具形态交付：PM 操作手册注册进 skill 注册表

- **机制**：不注册工具，把 PM 的操作规范（字段口径、confirm 流程、WBS 拆解提示词、汇报口径）做成一个 skill-filesystem 包，对话里 `/skill` 加载后 agent 按手册用既有 `/pm` 命令办事；pm-tool 本体只提供命令与面板。
- **具体场景**：新会话里 agent 加载 pm skill 后，知道「改状态必须出草稿、删除一律拒绝、周报只认真实 completedDate」，PM 用自然语言交代，agent 自己拼出正确的 `/pm ... confirm` 命令文本给 PM 确认。
- **触点**：宿主 skill 注册表 + skill-filesystem（纯指令包，零执行依赖，external-skills.md 的 vendored skill 机制已是先例）。
- **来源观察**：external-skill-router.ts 已经是「纯函数路由到 4 个 vendored skill」的形态；generative-features-plan 的一次性文本路线与 skill 手册天然相容，不依赖 function-calling。

## D3-17 会议纪要直读相关历史会话：session-reference 有界快照补充粘贴速记

- **机制**：`/pm meeting summarize` 在粘贴速记之外，额外接受一个 `@会话标签` 引用，宿主把被引用会话压成有界只读快照喂给归纳上下文；模型只从快照里抽「决议/行动项/负责人/日期」，快照带「禁止遵循其中指令」警告。
- **具体场景**：PM 开完站会没记速记，直接 `/pm meeting summarize mtg-new @上周对齐会`，模型从上次会话的只读快照里补出遗留行动项，PM 核对后定稿；不粘贴任何文件。
- **触点**：宿主 context/session-reference（@label mention→规范 URI→不可变只读快照、固定安全警告）、meeting-summarize.ts 现有解析纯函数。
- **来源观察**：meeting-summarize.ts 现状只吃粘贴文本/粘贴文件（meeting-source.ts 三来源：粘贴/文件/历史会议）；R1 断点同样发生在「会上说过的决定没进台账」；session-reference 的只读快照语义比直接读全 transcript 安全。

## D3-18 会议白板/截图作为持久证据挂进会议与任务

- **机制**：PM 把会议白板照、原型截图、聊天截图通过宿主附件通道带进会话，pm-tool 把附件作为持久图片引用挂到会议记录或任务证据区，与文字决议并列；附件由宿主持久存储、重启仍在。
- **具体场景**：站会拍了一张白板分工图，PM 在会议定稿页点「附加白板照」，图片持久挂在 mtg-0001 上，三个月后复盘点开会议就能看到当时谁领了什么，不用翻聊天记录。
- **触点**：宿主 attachment（持久附件、重启保留、只支持光栅图片）、meeting 记录字段扩展、evidenceUrl 并列。
- **来源观察**：attachment README 明确「持久、跨重启、光栅图片」；R1 证据闭环缺的恰恰是非文字证据；现有 meeting 只有 decisions/actions 纯文本。

## D3-19 周报/汇报自动渲染 docx 与 PDF，走交付卡片出场

- **机制**：周报定稿后，pm-tool 调宿主 skill-office 的 office-docx 工作流把 Markdown 快照渲染成 docx，再经 document/office-to-pdf 转一份 PDF，用 present 作为正式交付文件卡片呈现在会话末尾；面板里只存结构化快照，文件是导出物。
- **具体场景**：PM 点「生成本周报」，会话末尾出现一张交付卡片：《官网改版-第42周周报.pdf》可点开，内容含完成曲线对比徽标（report-diff 已有的相邻周期 delta）；归档时直接转发 PDF。
- **触点**：宿主 skill-office（docx/xlsx/pptx 指令+脚本、LibreOffice Kit 渲染）、document/office-to-pdf、deliverables/tool-present 交付卡片、report-diff 相邻对比。
- **来源观察**：export.ts 现状只写 Markdown 文件到 exports/；progress-report-markdown.ts 已有成稿；ui-deliverables README 讲「显式交付文件卡片、从记录摘要派生」，现状 pm-tool 的导出文件从没以交付卡片形式出场。

## D3-20 本机自用计数：把 H1/H3 成功标准变成可测量的本地事件日志

- **机制**：在不联网、不上传的前提下，记录几个本地计数事件：面板打开、ask 草稿生成/被采纳/被拒、周报写成、会议定稿、清单勾选；面板上一个极小的「使用计数」页只读展示，3 个月后供自己对照成功标准。不接 telemetry 上传。
- **具体场景**：PM 每月底扫一眼计数页：ask 采纳 5 次、周报手写 8 份、会议定稿 3 次——哪些高频、哪些摆设一目了然，为后续接线决策提供数字而不是感觉。
- **触点**：无宿主依赖（本地小 JSON）；刻意不接 telemetry/README 的上传通道。
- **来源观察**：personal-billing-plan.md 成功标准要求「可计数」；telemetry README 是可选上传通道，单人自用不需要；provenance-store.ts 已有 applied/undone/conflict/failed 的 applied 子集可直接复用为「采纳」计数来源。

## D3-21 按需 pull 的只读上下文块：PM 问「当前项目」才喂快照，不每轮注入

- **机制**：与 D3-11 的常驻注入相反，只在 PM 显式说「看一下当前项目」或工具被调用时，把压缩快照（复用 ask-copilot.buildAskContext 的中文压缩口径）作为一次性上下文返回，不进入持久 agent-instructions、不占每轮 token。
- **具体场景**：对话进行到一半 PM 说「对了，官网项目现在啥情况」，模型临时取一份压缩快照回答，下一轮上下文里不再残留项目细节；token 成本只为一次提问付。
- **触点**：ask-copilot.buildAskContext 纯函数（已把五实体压成中文块）、只读工具（D3-01 的拉取版）；不用 agent-instructions 常驻。
- **来源观察**：R2 读写边界（problem-framing §R2：机器可操作但不越界）；compaction README 讲上下文窗口预算紧张，常驻全量快照对单人项目是浪费；buildAskContext 现成的压缩口径让 pull 成本很低。

## D3-22 subagent 只读巡检：跨项目扫一遍出一份「异常清单草稿」

- **机制**：在显式评估后（对照 feasibility-map 主体一节），把「全项目健康巡检」交给一个只读 subagent：它只调只读工具扫全部项目的逾期/风险/里程碑偏差，产出一份异常清单草稿，主会话 PM 确认；subagent 不持写队列、不直接落库。
- **具体场景**：PM 说「扫一下我手头所有项目」，一个只读子代理返回「prj-01 逾期 2、prj-03 里程碑 at_risk、prj-05 无活动 14 天」，PM 在主会话里逐条决定是否处理；单人场景主体偏弱，此想法先记录待验证。
- **触点**：宿主 subagent（只读子代理、独立上下文、结果回父）、D3-01 只读工具、suggestion-engine 诊断规则。
- **来源观察**：feasibility-map 主体一栏明确「subagent 现状单人单会话，调用主体弱，需先显式评估」；suggestion-engine.ts 已有确定性只读诊断气泡，巡检只是把它从单项目扩到跨项目。

## D3-23 jobs 后台长任务：批量 CSV/Markdown 导入、全库健康重算走后台进度

- **机制**：把 csv-import、task-import Markdown 批量落盘、全库健康分重算这类可能耗时的操作注册为宿主后台 job，面板/对话显示进度条与结果，不阻塞交互；单次小操作仍同步完成。
- **具体场景**：PM 导入一份 200 行 CSV 旧项目台账，面板显示「导入中 47/200」，可以先去别的页，完成后弹结果摘要（新增 X、跳过 Y 重复）；失败批次单独列。
- **触点**：宿主 jobs（后台任务、独立会话、进度、完成通知）、csv-import.ts/task-import.ts 现有预览→confirm 链路。
- **来源观察**：csv-import.ts 现状是同步一次性解析+confirm 落盘；单人小量其实秒完，此想法属于「先评估再决定要不要」的候选，照单全收不筛。

## D3-24 会话→台账单向人工导出：dsh 自己的 todo/goal 快照一次性搬进台账，不双向绑定

- **机制**：提供一个「从当前会话导入待办」动作：把宿主会话里的 todo/goal 列表快照一次性拉成 PM 任务草稿，人在面板 confirm 后落库；此后两边各管各的，不做双向同步、不回写宿主 todo。
- **具体场景**：PM 在会话里用宿主 todo 列了一串临时事项，收尾时一键把它们转成项目任务草稿，宿主 todo 照旧留在会话里当会话记忆，台账是正式档案，两层寿命分开。
- **触点**：宿主 todo/goal 只读快照、task-import 草稿落盘；明确不接双向同步（对照 backup-sync 的单写者原则）。
- **来源观察**：R3 寿命分层（会话级短命 vs 档案级长命，problem-framing §R3）；现状两套待办（宿主 todo、pm 任务）并存且零关系；单向搬运比双向同步简单得多，也避开协作契约里无 CAS/无 rev 的冲突问题。

## D3-25 看板公式引擎本地长出风险矩阵热力图与个人负载（纯前端，不接宿主）

- **机制**：不动后端，仅用看板 bento 已有的筛选 DSL（query.ts 字段白名单）与惰性公式引擎（formula.ts expr-eval），在 Web 面板里拼出概率×影响风险热力图、按人聚合的负载卡、本期 vs 上期完成趋势；全部本地 snapshot 计算。
- **具体场景**：PM 打开项目概览，直接看到风险矩阵 3×3 热力分布和「赵六手上 5 条、逾期 1」的负载条，不用自己数；公式卡片支持 PM 自定义「逾期且高影响」这种本地表达式。
- **触点**：纯面板端 board/query.ts、board/formula.ts（已惰性加载 expr-eval）、people-candidates.ts 五来源人员聚合；零宿主接线。
- **来源观察**：UX-07 概览太薄、UX-08 风险矩阵只渲染两个标签、UX-09 无按人聚合（product/02-ux-evaluation.md）；board 阶段②已经交付筛选 DSL 与公式引擎，这些视图是已有能力的组合而非新接线。

## D3-26 提醒/搜索直达记录（UX-03/04）：面板内闭环，证明「不融合也能修好断点」

- **机制**：纯面板内修：提醒点击直接打开对应任务/里程碑抽屉（而不是只切项目），全局搜索命中直接打开那条记录抽屉；不依赖任何宿主事件或通知。
- **具体场景**：PM 在提醒列表点「T-18 明天到期」，面板直接弹出 T-18 抽屉，而不是先切到项目还要自己找；搜索「首页」直接打开命中任务。
- **触点**：纯面板（panel.tsx 已有 openRecord 抽屉机制）、reminders.ts 记录补 recordType 指针；无宿主。
- **来源观察**：UX-03 提醒可点但只切项目、UX-04 搜索命中不直达（product/02-ux-evaluation.md）；这是「不接宿主也能显著提升闭环感」的对照组想法，用于检验融合命题是否被高估。

---

## 自检
- 总数：26 个，彼此不同。
- 【反向/独立】：D3-07、D3-08、D3-09、D3-10、D3-12（5 个，≥3）。
- 【疯狂】：D3-11、D3-12、D3-13、D3-14（4 个，≥3；D3-12 同时属反向）。
- 抽象层覆盖：数据/存储（D3-07、D3-14、D3-24）、能力接线（D3-01、02、04、05、06、15、16、17、22、23）、交互形态（D3-03、12、13、18、25、26）、工作流（D3-19、21）、产品形态/分发商业（D3-08、15、20）、反面（D3-09、10、12、14）。

==================== 发散者 D4 ====================

# D4 发散清单 · 阶段1 开放发散 · 第1轮盲发

> 发散者编号：D4。纯设计探讨，未改任何代码/配置/依赖。无视角、无评分、无批评、无可行性筛选；疯狂想法照单全收。
> 基线：dsh-pm-tool v0.7.4；上游 deepseek-harness v0.2.1-alpha.2 只读。
> 标注约定：【反向】= 不融合/剥离/独立/保持现状侧；【疯狂】= 初看反常识。其余为常规发散。

---

## 一、能力接线：让 agent 循环「读得到」台账（工具/上下文/事件）

### D4-01 只读台账工具组（模型可读面，写面一律不注册）
- **机制**：用 `defineTool` / `ctx.tools.register` 注册一组纯只读工具——`pm_project_list`、`pm_task_get`、`pm_project_health`、`pm_overdue_list`、`pm_report_snapshot`——参数 schema 自动进系统提示词、自动校验，返回规范 JSON；不注册任何写工具。模型在任意 agent 会话里可以主动「查台账」，但改台账仍只能走人的 `/pm` 命令或面板草稿确认。
- **具体场景**：PM 在 dsh 主对话里说「帮我看看官网改版项目现在哪三个任务逾期、谁手上过载」，模型调用只读工具取回确定性数字与清单，用自然语言回答；回答里引用的每条任务带 id，人想改时点回面板对应抽屉。整个过程台账零写入，无 Key 时这些只读工具依然可用（读的是本地 storage-domain）。
- **触点**：`ctx.tools.register` / `defineTool`（host `packages/core/tools`、cookbook `adding-a-tool.zh.md`）；`output.schema` + `output.render`；本地 `storage-domain` 表；不依赖 llm。
- **来源观察**：现状全仓无 `ctx.tools.register` / `defineTool`（事实包 §3、问题框定书 §0 共识5）；`commands/ask.ts` 里 `buildAskContext` 已有确定性采集逻辑可复用；cookbook `adding-a-tool.zh.md` 证明 schema 自动进提示词、只读工具不依赖模型往返。

### D4-02 写工具 + 审批 seam：模型起草、人在对话里按批准才落库
- **机制**：在只读面之外，注册极少量写工具（如 `pm_propose_status_change`），execute 内部不直接写库，而是经 `ctx.approval` / `ask_user_question` 挂起等人一次性批准；批准后才走既有 `ask-apply` 领域写链（含 baseline updatedAt 冲突比较、白名单字段、幂等键）。默认拒绝，超时不批即不落库。
- **具体场景**：模型在会话里发现 t-0003 已完成，发起一条「建议把 t-0003 置为 done、progress=100」的提议，对话里弹出一次性批准卡片；人点同意才落库，点拒绝/忽略就什么都没发生。落库动作与现有 `/pm ask` 草稿同构，只是触发点从面板草稿卡挪到对话内。
- **触点**：`packages/interaction/user-approval`（一次性审批、默认拒绝）、`tool-ask-user`（`ask_user_question` 暂停等待）；复用 `commands/ask.ts` 的 validateActions / ask-apply 写链与幂等。
- **来源观察**：interaction README（一次性审批未获决定默认拒绝、agent 可暂停等待人类决定）；现状 ask-apply 已有 baseline 冲突比较、60s 幂等、in-flight 去重（`commands/ask.ts`、`docs/product/11` §一）；C3 草稿确认制红线要求人始终是最终裁决者。

### D4-03 对话内 PM 业务节点卡片（ConversationNodeDefinition）
- **机制**：注册 `ConversationNodeDefinition` + `conversation.chat.node` keyed renderer，把台账事实渲染成对话流里的结构化业务行：项目健康灯卡、逾期清单卡、周报草稿卡、行动项闭环卡；卡片上带「打开面板对应记录」「确认草稿」按钮，按钮回调仍走 `/pm` 命令通道。
- **具体场景**：PM 在主对话随口问一句，模型回答下方挂一张「官网改版 · 黄灯 · 2 逾期 / 1 高影响风险」卡片，点卡片上的任务chip直接跳到面板抽屉；周报 narrate 草稿以卡片形式出现在对话流，人在卡片上编辑、确认，不必切到面板 AI 抽屉。
- **触点**：`ConversationNodeDefinition`、`conversation.chat.node` keyed renderer（cookbook `extension-cookbook.zh.md` Web Client Chat 业务节点行）；`presentCall`/`presentResult` 卡片渲染；写回仍走 `remote.commands.execute`。
- **来源观察**：feasibility-map §四第3条「对话业务节点/工具卡片」为官方明确扩展路径；现状 AI 是面板里三个固定按钮、不读选区上下文（UX-10，`product/02-ux-evaluation.md`）。

### D4-04 有界只读上下文注入：当前项目摘要成为模型可见的持久背景
- **机制**：借鉴 `context` 组「不定义工具、为每次请求添加模型可见上下文」的做法，把「当前选中项目的精简台账摘要（逾期项数、临期里程碑、未关闭高影响风险、过载人）」以有界字节预算注入为持久 user 角色上下文；稳定前缀放在最前以命中 prompt caching，用户问题在最后。只读，不含任何写指令。
- **具体场景**：人新开一个会话聊官网改版，模型不用主动调工具就已经知道「这个项目有 2 个逾期任务、1 个 critical 风险」，开口就能问「要不要先处理登录联调」；摘要随快照刷新，被压缩/回放时与其他上下文一样持久保留。
- **触点**：`packages/context`（agent-instructions 的「加载指令并在文件编辑后刷新」模式）；`core/model-route.ts` 已实践的「稳定前缀放 user 最前、命中 cacheReadTokens」；注入面与工具面二选一或并存。
- **来源观察**：context README（注入指令以 user 角色消息进入会话历史、持久可回放可压缩）；model-route.ts 注释「副驾项目快照是稳定前缀，必须放 user 最前」；现状 `/pm ask` 每次手工拼全量 ctxText（`commands/ask.ts` buildAskContext）。

### D4-05 【事件接线】订阅宿主 session/event，把轮次 workspace-changes 聚合成任务执行证据
- **机制**：插件以观察者身份 `ctx.on('session/event')` 只读订阅宿主事件流，拾取 `workspace/changes`（git 工作树快照 + 文件 diff 摘要），按会话工作目录/项目标签归组；人在面板里把某轮改动「挂到」某任务的证据区，只产生只读链接摘要，绝不自动改任务状态。
- **具体场景**：PM 在 dsh 会话里让 agent 改完登录接口代码，那一轮的改动文件清单被 pm-tool 看到；PM 打开 t-0003 抽屉，证据区出现「2026-10-18 会话 #312 改了 auth/login.ts 等 3 个文件」，人判断完成后手动置 done；系统不替人宣布完成。
- **触点**：`packages/deliverables/workspace-changes`（监听 session/event、git 快照、逐文件 diff、Web 轮尾卡片）；插件侧事件订阅（现状为零）；任务已有的 `evidenceUrl` 字段（`core/task.ts`）。
- **来源观察**：现状 host 侧 `src/core`、`src/commands` 无任何 `ctx.on(...)`（事实包 §3）；workspace-changes README（轮次 git 快照+整文件捕获+对比）；v0.8 任务已新增 `evidenceUrl`（≤2048 佐证链接，`core/task.ts` L67）；R1 断点「计划↔执行证据闭环」。

### D4-06 session-query FTS5 反查：把历史会话轮次挂为任务证据链接
- **机制**：调用 `ctx.sessionQuery`（SQLite FTS5 全文搜索 + 关系追踪），按任务标题/行动项关键词检索历史会话日志，把命中轮次作为只读引用列在任务/会议的证据区；人可点开原始会话回看。pm-tool 自己不存对话，只持有「指向会话的引用句柄」。
- **具体场景**：「上周会上说的『做登录风控』跟进了吗？」PM 在面板点开该任务，证据区列出 3 个历史会话命中轮次（含标题与日期），点链接跳到宿主会话原文对照；不用在自己脑内回忆当时聊没聊过。
- **触点**：`packages/session-query`（ctx.sessionQuery、FTS5、关系追踪、独立于 compaction）；任务/会议只读证据区；不写会话日志。
- **来源观察**：session-query README（统一查询服务、FTS5 全文搜索、搜索结果与模型看到的历史一致）；R9 限制「任务没有状态事件历史，不能推断本周期完成任务」（requirements §4.6）；会议行动项 promote 已有 taskId 回写（ADL-040），反向链接目前只到会议、到不了对话原文。

### D4-07 attachment 持久附件挂到会议纪要与交付物
- **机制**：把宿主 `ctx.attachments` 的内容寻址持久图片/文件引用接进 meeting 与 deliverable 实体：白板拍照、会议截图、验收材料 PDF 作为附件句柄挂到对应记录；模型经保存的只读路径按需读取，pm-tool 不复制字节。
- **具体场景**：站会上拍一张白板分工照，附到会议纪要；验收时把设计稿截图挂到 submitted 状态的交付物，验收人（未来的协作方）在记录里直接看到图片；重启 dsh 后附件仍在。
- **触点**：`packages/attachment`（ctx.attachments、内容寻址本地存储、重启保留、永不自动删除、只读路径给模型）；meeting/deliverable 只读附件数组（可选新字段位）。
- **来源观察**：attachment README（持久图片附件、回到历史、后续轮次发给模型；其他文件按字节原样保存）；feasibility-map 辅助表已列 attachment 为「交付物/纪要附件」候选但未用；现状纪要只有文字速记。

---

## 二、能力接线：时间、调度与周期动作

### D4-08 【schedule】到点以 follow-up 消息落回原对话的轻提醒（不做系统推送）
- **机制**：临期/逾期项不发系统通知、不起常驻 daemon，而是调用宿主 `ctx.schedule` 为每个临期里程碑/任务注册一条一次性或周期提醒；到期时宿主把提示作为普通 follow-up 消息投递回原会话，人打开对话才看到。宿主负责持久化与重启保留，插件不养定时器。
- **具体场景**：周五下午 PM 没开面板，周六 dsh 重启后，周一早上打开那个会话，看到一条宿主投递的 follow-up：「里程碑 M1 首版发布 targetDate=10-25，还有 7 天」；人回复或切面板处理。没有弹窗、没有后台进程、没有邮件短信。
- **触点**：`packages/schedule`（Host 拥有的持久提醒、重启保留、到期作为普通 follow-up 进原对话、无需打开原 Session）；`tool-schedule` 四工具；现有 `core/reminders.computeReminders` 派生结果作为注册输入。
- **来源观察**：ADL-039（提醒读时派生、不做后台常驻/定时器）、ADL-032（R11 暂缓，理由是常驻调度与离线优先冲突）；schedule README 明确「到期提醒作为普通 follow-up 消息进入原对话，而不是电子邮件、短信或推送通知」——恰好是被否方案的温和变体。

### D4-09 【schedule】周期自动出快照 + narrate 草稿，人确认才成文
- **机制**：用 schedule 的 weekly/cron 选择器，每周固定时间触发一次 follow-up，携带 `collectProjectReport` 的确定性数字（完成率、逾期、异常项），预填一份 narrate 叙述草稿到会话；人在对话里改两句、确认后才写入 reports 表冻结快照。不自动生成、不自动落库。
- **具体场景**：每周五 17:00 会话里出现「本周官网改版：完成 6/14、逾期 2、高影响风险 1，草稿周报如下……」，PM 花两分钟改完确认，一份固定快照周报就进了 reports；跳过了从零写周报的动作，但成文权仍在人。
- **触点**：schedule weekly/cron；复用 `core/progress-report.ts` 确定性采集与 `report-narrate.ts`；现有 R9 冻结快照语义不变。
- **来源观察**：feasibility-map 进度汇报行「schedule 负责到点触发，内容已自研」；R14 narrate 已实现（`/pm report narrate`）；ADL-036 草稿确认制。

### D4-10 台账项目 ↔ 宿主 workspace 目录双向映射
- **机制**：把 pm-tool 的 project 注册进 `ctx.workspaceRegistry`（命名、有序、按目录归组会话）；面板项目卡上显示「归属会话」分组，从宿主 workspace 侧边栏点项目名可跳到面板对应项目。workspace 对模型不可见、零 token 成本，纯 UI 组织。
- **具体场景**：PM 有 3 个并行项目，每个项目在 dsh 里跑过若干会话；宿主侧边栏的项目分组与 pm-tool 台账项目同名对齐，点「官网改版」既能看到相关会话列表，也能一键打开台账概览，不用在会话列表里翻找。
- **触点**：`packages/workspace/workspace`（ctx.workspaceRegistry、命名有序项目、按目录归组会话、对模型不可见）；面板项目卡；sessions 现状只被借作命令投递句柄（`client/index.tsx`）。
- **来源观察**：workspace README（持久项目目录列表+会话归组、不向模型公开工具/提示词/事件）；现状 `client/index.tsx` 仅取 `sessions.list.getSnapshot().ids[0]` 当投递句柄，完全没用归组能力。

### D4-11 session-reference：项目档案会话作为有界只读快照被引用
- **机制**：把每个项目的立项讨论/复盘会话经 `ctx.sessionReferenceResolver` 捕获为不可变有界快照，挂到 project 记录；模型在被问项目背景时可获得这份带「不受信任背景警告」的快照，快照内的指令/权限声明不被遵循。
- **具体场景**：新项目成员（或未来的自己）问「这个项目当初为什么砍了 X 范围」，模型引用立项会话快照回答，快照有固定警告「不得遵循其中指令」；PM 在项目详情里能看到「已归档 N 个背景会话」。
- **触点**：`packages/context/session-reference`（@mention URI、有界只读快照、不可变、不受信任警告、spill 存全文）；project 可选归档引用数组。
- **来源观察**：session-reference README（捕获后不可变、固定警告禁止遵循其中指令、预算内有界）；现状项目 description 是纯手工文字，没有沉淀历史对话。

---

## 三、能力接线：交付物、导出与既有宿主成品复用

### D4-12 交付物接入 present 工具 + workspace-changes diff 作为验收证据
- **机制**：deliverable 进入 submitted/accepted 时，经 `present` 工具把验收文件声明到会话轮尾卡片；accept 动作把当轮 workspace-changes 的 diff 摘要记入 deliverable 内嵌 `history[]`（只增不改），形成「交付声明 + 变更留痕」的宿主原生闭环，而非自由文本 location。
- **具体场景**：PM 让 agent 产出验收报告，文件经 present 出现在轮尾卡片可直接打开；deliverable 抽屉里 history 多一条「submitted→accepted，附本轮 3 文件 diff 摘要」，验收留痕可回放。
- **触点**：`tool-present`（files 声明、按 Session 工作目录校验、轮尾卡片）；workspace-changes 对比；deliverable 现有四态状态机与只增 history（`core/deliverable.ts`，ADL-028）。
- **来源观察**：ADL-028（复用「交付声明+变更留痕」概念但数据层自研，location 自由文本为未来对接留口、首版不自动绑定）；present README（声明 Session 文件系统可访问的最终文件）。

### D4-13 office-to-pdf / skill-office：周报计划导出 Word/PPT/PDF
- **机制**：在现有 Markdown 导出之上，接宿主文档能力：报告/计划经 `ctx.officeToPdf` 转 PDF，或经 skill-office 的 Word/PPT 工作流生成可直接发给上级的排版稿；导出仍走「人点按钮、落本地文件、不自动发送」。
- **具体场景**：PM 要给 leader 汇报，面板点「导出董事会版」，得到一份排版好的 PPT/PDF（项目健康灯、里程碑时间线、风险矩阵、本周完成），而不是一份需要自己再排版的 Markdown。
- **触点**：`packages/document/office-to-pdf`（LibreOffice kit/WASM、有界队列缓存）；`packages/skill/skill-office`（Word/PPT/Excel 工作流、结构检查、转 PDF）；现有 `core/export.ts`。
- **来源观察**：feasibility-map 辅助表（document office-to-pdf 出 PDF、skill-office 导入导出 Office）；requirements §5.2「后续可接 office-to-pdf 出 PDF」；现状导出仅 Markdown/JSON（`core/export.ts`、`commands/export.ts`）。

### D4-14 插件详情页插槽：不打开主面板也能看到最紧急三件事
- **机制**：向 `plugins.detail.badge` 注入健康灯徽标、向 `plugins.detail.section` 注入紧凑的「逾期 N / 临期 M / 高影响风险 K」只读区块与「打开面板」按钮；在宿主插件管理页即可扫一眼盘子状态。
- **具体场景**：PM 在 dsh 设置/插件页扫一眼 pm-tool 条目，标题旁的黄灯徽标和下方三行数字就告诉自己今天要盯什么，不必先进顶级面板。
- **触点**：`plugins.detail.actions / badge / section` 三个 list slot（`packages/client/ui-plugin-manager/README.zh.md` L85-89）；只读派生（health/reminders）。
- **来源观察**：feasibility-map §四第2条（插件详情页插槽官方路径）；ui-plugin-manager README 三个 slot 的 subject 契约；现状入口只有左侧栏顶级面板（`client/index.tsx` sidebar.panellist）。

### D4-15 宿主设置卡片承载 13 项口径配置
- **机制**：把 settings 表现有的 13 项口径（健康分权重/封顶/灯线、临期窗口、过载阈值）从面板设置抽屉搬到宿主 Config schema 派生的设置卡片，与宿主模型/通用设置同处编辑；插件读自己的 volatile 引用，默认值逐值等于现值。
- **具体场景**：PM 在 dsh「设置」里找到 pm-tool 卡片，直接调临期窗口 7→14 天、过载阈值 5→4，不必进面板再开抽屉；无设置记录时行为与今天逐值一致。
- **触点**：`packages/settings`（Config schema 派生表单、profile patch 保存、volatile 引用）；现有 `core/settings.ts` DEFAULT_PROJECT_SETTINGS 与 normalizeProjectSettings（ADL-052）。
- **来源观察**：feasibility-map §四第1条设置卡片路径；ADL-052（13 项口径已配置化、默认值=硬编码现值、局部合并持久化）；现状设置 UI 在面板内单抽屉（ADL-052）。

### D4-16 工具结果观测埋点：计量「被读 N 次 / 草稿被采用 M 次 / 被拒纠正比例」
- **机制**：用 `tools/result` 观察者与 `tools/post-execute` 记录台账工具调用次数、ask 草稿的 apply/undo/recheck 结局；结合 `feedback`（逐消息评分/备注，不进模型历史）形成采纳率统计，面板或日志里可查。直接服务阶段0 的可证伪成功标准。
- **具体场景**：跑一个月后，PM 能看到「agent 只读台账 47 次，草稿 12 份，采用 7、拒绝 3、纠正 2」；数字接近 0 即证明该形态无消费方，而非凭感觉判断融合有没有价值。
- **触点**：`tools/result` / `tools/post-execute`（cookbook 执行策略与观测）；`packages/feedback/message-feedback`（评分/分类/备注落 session 日志、不进模型历史）；`packages/telemetry`；现有 provenance ledger 已记 applied/undone/conflict/failed 审计事件。
- **来源观察**：问题框定书 §3 可证伪成功标准（消费方命题 N≈0 证伪、正确性命题采纳/拒绝/纠正比例）；provenance-store.ts 已有 audit 事件（applied/undone/conflict/failed）但未汇总成统计。

### D4-17 模型路由成本与降级链计量
- **机制**：按 AiTaskKind（copilot/wbs/meeting/narrative/title）统计每次调用命中候选链第几档、降级几次、失败归一为什么错误码，面板显示本周免费/生产车道消耗与降级路径；为「要不要配 prod Key、切哪个模型」提供自己的数据。
- **具体场景**：面板状态条显示「本周副驾调用 9 次：主力 Flash 7、升级 Pro 1、GLM 兜底 1；narrative 全部走 Lite 降本」，PM 据此决定模型组合，而不是凭账单猜测。
- **触点**：`core/model-route.ts`（三档候选链、reasoningEffort、场景分档）；`core/ai-client.ts`（候选链依次尝试、AiDraftError code 归一）；本地 settings 表落统计行。
- **来源观察**：model-route.ts（5 场景、primary+降级链、只在检测到 Key 时入链、不静默回退）；ADL-035/KB-034（免费池约 50 次/天、随机模型、工具调用不保证）；现状 `/pm model status` 只看模式不看用量。

---

## 四、编排与多智能体（主体存疑侧，照单全收）

### D4-18 【疯狂】一次性「巡检员」subagent：spawn-in-process 只读诊断后交草稿
- **机制**：用 `subagent-spawn-in-process`（全新进程内子级、无父历史）起一个一次性子 agent，喂入只读快照，让它独立产出「本项目风险清单/排期冲突清单」草稿，返回后由人在主会话确认；不使用进程外后端，不常驻，不持写权限。
- **具体场景**：PM 说「让另一个脑子挑挑这个项目的毛病」，子 agent 独立读快照列出 5 条它看到的隐患，主会话人逐条接受/拒绝；像请了一个不参与日常的外部评审，而不是让它自己动手改。
- **触点**：`packages/subagent/subagent-spawn-in-process`（全新进程内子级）；`tool-subagent`；只读快照；写仍回主会话草稿确认。
- **来源观察**：subagent README（全新进程内子级、父级可见、终态结果返回）；R4 提醒多 agent 设计前提，本想法刻意只保留「一次性只读评审」最小主体；现状 suggestion-engine 已是确定性只读诊断，本想法是它的模型版对照。

### D4-19 【疯狂】WBS 编译为 workflow 可执行蓝图 DAG
- **机制**：把任务树 + predecessorIds 依赖编译成模型可运行的 workflow 扇出脚本：依赖拓扑即 DAG，叶子任务作为可委派单元；workflow 引擎扇出 subagent 执行，产出物回汇；pm-tool 只提供编译结果与验收口径，不替人宣布完成。
- **具体场景**：一个拆好的三级 WBS 被「运行」：引擎按依赖把可并行叶子分给子级，每步结果回传，主会话汇总成进度草稿；PM 看到的是一份「计划被机器跑了一遍的模拟」，真实完成仍靠人确认。
- **触点**：`packages/workflow`（模型编写扇出脚本、PTC Node 运行时、遵守调用 Session 文件策略）；subagent 扇出；现有 predecessorIds[] 与 CPM 关键路径（ADL-051）。
- **来源观察**：workflow README（模型编写、可扇出 subagent 的编排脚本）；ADL-051 已有只读依赖图/环检测/slack 计算，是编译 DAG 的现成原料；单人单机下执行主体存疑，按规则保留不筛选。

### D4-20 pm-tool 自曝为本地 MCP server，dsh 只是消费方之一
- **机制**：把七实体 CRUD/只读查询包装成本地 MCP server（stdio），dsh 经 mcp-client 连接，其他 MCP 客户端（Claude Code、Codex、任意 IDE）也能连；pm-tool 数据仍是本地 JSON，dsh 从「宿主」降级为「一个客户端」。
- **具体场景**：未来换工具或团队扩到多人，PM 不必把台账迁进新工具；任何支持 MCP 的环境都能读这份台账、起草修改，写回仍经同一套草稿确认契约。dsh 消失后台账服务继续存在。
- **触点**：`packages/mcp/mcp-client`（连接外部 MCP 服务器、暴露工具与资源）作为对等参照；本地 JSON 存储；定义自己的 MCP 工具面。
- **来源观察**：R5 平台存在性（问题框定书 §4 已列「把 pm-tool 自身暴露为 MCP server」为开启空间）；mcp README（配置一条 mcp-client 即可连外部服务器、仅作用域内可见）；现状插件深度依赖 dsh 内部契约（ADL-034 KB-028/023）。

---

## 五、产品形态与分发/商业

### D4-21 board bento 导出静态 HTML 简报（可脱离宿主分享）
- **机制**：现有 react-grid-layout 可拖拽看板布局（已持久化到 dashboard 表）渲染成一份自包含静态 HTML（健康灯/逾期/风险矩阵/完成曲线/里程碑时间线），双击即可在任意浏览器打开，可邮件/IM 发出；不依赖 dsh 运行。
- **具体场景**：周会前 PM 导出一份单文件 HTML 简报发给 leader，对方不用装 dsh、不用开本机 loopback，浏览器直接看到盘子状态；数据是导出瞬间快照，与台账脱钩。
- **触点**：现有 `client/board/`（BoardBento、widgets、layout 持久化 `dashboard put`）；纯前端渲染；`document`/`attachment` 非必需。
- **来源观察**：board/persist.ts（布局经 `dashboard put/reset` 落盘、web snapshot 读回）；dsh Web 只信任本机 loopback、无局域网远程（KB-014、delivery.md §9），对外分享目前无路。

### D4-22 【反向】刻意保持现状：冻结接入面，产出正式「评估过但不接」清单
- **机制**：把 inject 永久冻结为 `['commands','storageDomain']`，不注册工具、不订事件、不接 schedule/mcp/subagent；把宿主能力清单逐项过一遍，每项写「评估过、无调用主体、不接」及理由，落进 decision-log；精力全部投到面板内完整性与离线内核。
- **具体场景**：决策文档里出现一份显式的「不接清单」（subagent/workflow/mcp/遥测/多人/常驻 jobs 逐条注明单人单机无主体），未来任何人（包括未来的自己）想接某项，先翻清单看当初为什么不接；产品不再被「深度融合」命题牵引。
- **触点**：无新增；维持现状的 commands + storageDomain + 独立面板。
- **来源观察**：R4 调用主体（问题框定书 §4：无主体的能力接进来维护成本由一人承担、收益侧为空）；optimization-backlog.md「结构性长期项里没有一项以融合宿主能力为解法」；ADL-038（主入口已是 Web 面板，命令通道仅兜底）。

### D4-23 【反向·剥离】core 抽成零宿主依赖独立库 pm-core，插件只剩薄适配层
- **机制**：把七实体、schema、派生纯函数（health/reminders/CPM/people-load/objective progress/narrate 采集）从插件包抽成不 import 任何 `@deepseek-ai/*` 的独立 npm 库；插件只做「命令注册 + storage-domain 接线 + 面板」三层薄适配。dsh 升级/消失时库不动，换一个壳即可复用。
- **具体场景**：两年后上游 breaking change 或不再维护，pm-core 原样搬到独立应用或 MCP server，业务规则、校验、派生公式零改动；插件适配层单独修或弃用。
- **触点**：无宿主新能力；反向拆分现有 `src/core/*`；存储后端以接口抽象（呼应 `product/11` 的 PmDomain 唯一边界原则）。
- **来源观察**：R3 最小独立内核（问题框定书 §4：抛开 dsh 的最小内核是什么）；product/11 §一「业务代码只碰 PmDomain，远程化=换后端，业务零改动」；§5 时间尺度 10 年（宿主不存在时数据仍可读可迁移）；ADL-034 耦合内部契约的升级回归面。

### D4-24 【反向】脱离 dsh 的独立本地应用，AI 走标准 API
- **机制**：做成独立 Electron/本地 Web 应用，自带 JSON 存储与七实体 UI，不依赖 dsh 运行时；AI 通道改用方舟标准 API 按量计费，放弃 Coding Plan 套餐合规便利换平台自由；离线 CRUD 红线不变。
- **具体场景**：离职后个人开发者直接分发一个独立 App，数据落用户目录，AI 按量；不再需要装 dsh、配 profile、link 插件、等上游升级。
- **触点**：无（离开宿主）；标准 API（personal-billing-plan §4.1）。
- **来源观察**：personal-billing-plan.md §1.1/§4.1（脱离 dsh 独立部署走 Coding Plan 属违规、需标准 API；团队协作也须标准 API）；R5 平台存在性（留在 dsh 是否沉没成本+计费合理化，H9）。

### D4-25 【反向】纯开放文件 + 静态只读查看器，dsh 仅作可选草稿器
- **机制**：产品身份退化为「一组人类可读 JSON + 一份纯静态只读查看器（甚至直接用 VS Code/Obsidian 打开）」；dsh 插件可选挂载，只在被挂载时提供 AI 草稿与写命令，不挂载时数据照样可读、可 git、可被任意工具消费。
- **具体场景**：不启动 dsh，直接在编辑器里翻 `data/pmtool/tasks/*.json` 看台账、用 git 看变更；dsh 只是偶尔用来生成 WBS/周报草稿的一个可选前端，不是台账的容器。
- **触点**：无新增依赖；现有 per-record 扁平 JSON（ADL-011）天然满足；查看器可为零构建静态页。
- **来源观察**：C5 人类可读 JSON/可 git/可逆（问题框定书 §3）；requirements §5 落盘约定；R5「纯开放文件+任意前端」开启空间；现状数据已经是每条记录一个可读 JSON 文件。

### D4-26 【反向·疯狂】极致被动：连 schedule 都不接，台账只在被打开时存在
- **机制**：把 ADL-039「打开面板即派生」推到极限——不接任何宿主时间/事件/上下文能力，不注册工具，不注入上下文；系统零活动，只有人主动开面板、敲命令时才算出当前状态。接受「不开就不知道」作为明确产品取舍。
- **具体场景**：产品文档里白纸黑字写「本工具不主动找你，你来看它它才在」；没有提醒、没有后台、没有 agent 主动感知，所有状态计算都是读时纯函数，可复算、零状态漂移。
- **触点**：无；维持并强化纯读时派生（core/derived.ts、reminders.ts、health.ts 全是纯函数）。
- **来源观察**：ADL-039（读时派生、不新增表、不做定时器）；ADL-032（拒绝常驻 daemon）；guard/离线优先基调；本想法是对 D4-08/D4-09 的反向极端对照。

### D4-27 【疯狂】台账反过来考核 agent 会话：PM 是管理者，agent 是被跟踪资源
- **机制**：角色反转——不用台账服务 agent 执行，而是用台账管理 agent：把每个 dsh 会话当作一个「执行单元」登记，session-query 统计其产出轮次、workspace-changes 文件量、feedback 评分，汇入人员/资源负载视图；台账成为衡量 agent 工作的管理面。
- **具体场景**：人员负载视图里除了真人 assignee，还出现「agent#312：本轮改 8 文件、完成 2 任务、评分 4/5」；PM 像管人力一样看哪个 agent 会话产出高、哪个空转。
- **触点**：session-query、workspace-changes、feedback；people-load.ts 聚合范式扩展一个「执行单元」桶。
- **来源观察**：people-load.ts 已按 assignee 跨项目聚合未完成任务；feedback 可对单条消息评分；现状 agent 与台账完全隔绝（问题框定书 §0 共识5），本想法把隔绝改成「被管理对象」。

### D4-28 【疯狂】assignee 建模为可 spawn 的虚拟子 agent（团队仿真）
- **机制**：把人员负载视图里的每个名字（张三/赵六）建模成一个可实例化的子 agent 角色：spawn 后以该负责人视角「自报进度/提出阻塞」，产出草稿供 PM 核对；真人不登录，仿真只是 PM 的推演工具，不代表真人真实状态。
- **具体场景**：排期冲突时，PM 让「虚拟张三」汇报它手上 P0 任务的预计完成度，得到一份带假设标注的草稿，用来推演负载，而不是真的问张三；结果明确标注「仿真自陈，非真人确认」。
- **触点**：subagent-spawn-in-process；people-load/people-candidates（已有名字归一与候选池）；仿真结果不落正式字段、只进草稿。
- **来源观察**：people-candidates.ts 五来源名字归一、displayForm 选举；UX-09（assignee 自由文本、无人员字典、过载不可见）；R4 多 agent 主体存疑，本想法是纯个人推演玩具，按规则保留。

---

## 六、数据机制与存储层想法

### D4-29 台账自身的全局审计流：把 deliverable history 推广为全实体只增事件日志
- **机制**：参照 deliverable 内嵌只增 history 的成功经验，为所有实体维护一条全局只增事件流（谁、何时、改了哪个字段、前后值、来源：命令/面板/ask 草稿/导入），落为独立 append-only JSONL；面板「活动」视图可回放，撤销不删事件只追加补偿事件。
- **具体场景**：PM 想知道「这个任务这周被改过几次、哪次是 AI 草稿改的」，打开活动流按时间回放；provenance ledger 目前每项目有界 20 条会丢最旧，全局事件流不丢。
- **触点**：本地 storage-domain 新表或独立 JSONL；现有 provenance-store.ts（有界账本+pending 补偿+audit 事件）；不接宿主。
- **来源观察**：product/11 §二「审计只有 deliverables 内嵌 history，无全局审计表，task/project 变更不发审计事件」；provenance-store 每项目 cap=20 丢最旧（`PROVENANCE_PER_PROJECT_CAP`）；现状只有 updatedAt 墙钟、无变更历史。

### D4-30 备份目录即版本链：自动时间戳副本 + 相邻副本 diff 视图
- **机制**：把现有 `/pm backup` 手动时间戳快照升级为「每次大动作后自动留一份薄副本」，面板里展示备份链与相邻副本 diff（哪些记录变了）；恢复仍两步 confirm + 自动安全快照，单写者原则不变。
- **具体场景**：误操作一批删除后，PM 在备份链里找到出事前那份，预览 diff 确认范围，两步恢复；不必记得自己上次手动备份是哪天。
- **触点**：现有 `core/backup.ts`、restore-content、安全快照；纯本地文件；不接云（遵守 backup-sync.md 单写者指引）。
- **来源观察**：ADL-041/backup-sync.md（两步恢复、恢复前自动安全快照、云同步只给指引不内置）；现状备份是手动触发、无 diff 视图；product/09 已有相邻快照对比徽标（report-diff.ts）可复用口径。

---

## 覆盖自检（供组织者核对，非自评）
- 不融合/反向/剥离/独立/保持现状：D4-22、D4-23、D4-24、D4-25、D4-26（5 个，≥3 达标）。
- 初看疯狂/反常识：D4-18、D4-19、D4-27、D4-28、D4-26（5 个，≥3 达标）。
- 抽象层覆盖：数据机制/存储（D4-29、D4-30）；能力接线·工具（D4-01、D4-02）；事件（D4-05）；上下文（D4-04）；调度（D4-08、D4-09）；MCP（D4-20）；subagent/workflow（D4-18、D4-19）；交互形态（D4-03、D4-14、D4-15）；工作流（D4-06、D4-07、D4-10、D4-11、D4-12）；导出/分发（D4-13、D4-21）；观测计量（D4-16、D4-17）；产品形态/商业（D4-20、D4-24、D4-25）；反面（D4-22、D4-26）。

==================== 发散者 D5 ====================

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

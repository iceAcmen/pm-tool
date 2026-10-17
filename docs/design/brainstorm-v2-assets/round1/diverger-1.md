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

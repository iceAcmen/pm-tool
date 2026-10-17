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

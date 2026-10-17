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

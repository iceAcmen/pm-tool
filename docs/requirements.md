# 需求分析文档 requirements.md

> 本文件记录产品「要做哪些功能、优先级如何、怎样算验收通过」，并给出 MVP 的数据模型与落盘约定；给开发与验收使用，按模块增删条目。本文档经项目所有者评审确认后作为阶段 3 开发依据。

- 文档状态：**MVP需求基线（v0.9，保留历史）**。当前实现/验收/提交状态见[2026-10-21整体盘点](plans/2026-10-21-project-status-and-next-implementation.md)，后续PROD、ADL及专项合同补充本基线。
- 最后状态校准：2026-10-21（trae，仅核既有实现，不新增需求）。CSV/XLSX已按ADL-043实现，取代ADL-030；R13–R18已按ADL-036/039–041实现；人员补全、只读关键路径、客观进度、AI来源治理、OKR/习惯、资料/文件已有后续实现。R11常驻调度与多人实时协作仍暂缓。下文旧“待编码/生成型暂缓/Excel裁剪”按发生时间读取，不能否认后续有效决策。
- 数据模型口径：下文为早期MVP七实体快照；当前`src/core/storage.ts`领域version=2、compatibleVersions=[1]，已含settings/sessions/reflections/okrs/lessons/habits/file_assets，任务有可选资料/进展等字段。当前字段与验收范围须同时核对应设计合同及源码，不能用旧表推定当前只有七表。
- 技术可行性依据：见 [feasibility-map.md](./feasibility-map.md)
- **需求变更追溯**：任何需求/范围调整都在 [decision-log.md](./decision-log.md) 记录「时间、变更、原因、替代方案、结果、改动平台」（v0.1→v0.2 见 ADL-007/008，v0.2→v0.3 见 ADL-009，v0.3→v0.4 见 ADL-011，v0.4→v0.5 见 ADL-024，v0.5→v0.6 见 ADL-025，v0.6→v0.7 见 ADL-026，v0.7→v0.8 见 ADL-028，v0.8→v0.9 见 ADL-029/030/031/032），并在 [changelog.md](./changelog.md) 留痕；多平台协作规则见根 `AGENTS.md` 与 [collaboration.md](./collaboration.md)。

## 一、目标用户与核心场景

- 目标用户：项目经理 / 项目负责人（PM），含非纯技术背景使用者。
- 核心价值：在 dsh 智能体框架之上，提供一套**可视化、可沉淀、可追踪、可迁移**的项目管理工作台，覆盖项目从计划到交付的关键动作。
- 使用前提（MVP）：**单用户、本地 macOS 使用**；数据保存在本地文件，可用 git 管理。

## 二、已确认的关键决策（2026-10-10，项目所有者拍板）

| # | 决策项 | 结论 |
|---|---|---|
| D1 | 模型接入 | **离线优先的混合模式**：项目/任务/里程碑等结构化增删改查不依赖模型、本地可用；会议纪要、智能 WBS 建议、周报等「生成型」功能按需配置 `DEEPSEEK_API_KEY` 后启用 |
| D2 | 数据存储 | **人类可读的 Markdown/JSON 文件**：底层用 dsh `storage-domain` + `storage-json` 落盘为 JSON，再渲染 Markdown 概览/报告；可直接阅读、可 git 版本管理、可迁移 |
| D3 | 交互形态 | **先做 dsh Web 可视化界面**（插件卡片/区块起步），斜杠命令作为离线操作入口；对话式生成能力后续叠加 |
| D4 | 首批范围 | **最小闭环 MVP**：项目计划 → WBS 任务拆解 → 里程碑 → 保存/导出，先端到端跑通，其余模块迭代 |

默认假设（项目所有者未反对，如需调整请指出）：MVP 单用户本地；**导入 Excel/Markdown、多项目检索/看板、多人协作**列为 P2。

## 三、功能模块清单（含优先级与验收标准）

优先级：**P0 = MVP 必做；P1 = 重要、第二梯队；P2 = 增强、后续**。

| 编号 | 模块 | 优先级 | 关键能力 | 验收标准（可测试） | 状态 |
|---|---|---|---|---|---|
| R1 | 项目计划 | P0 | 新建/查看/编辑/删除项目：名称、目标描述、负责人、起止日期、状态；项目列表与项目概览 | ① 不配置 API Key 也能新建项目；② 项目列表可见、可进入详情；③ 字段写入 JSON 文件，重启 dsh 后仍在；④ 支持编辑更新；⑤ 删除须带 `confirm` 关键字二次确认（`/pm project delete <id> confirm`，不带只提示不执行，见 ADL-012）；⑥ 新增/更新校验 `targetDate` 不早于 `startDate`；⑦ 同名项目默认阻止、命令末尾加 `confirm` 才允许创建 | 已完成：离线完整 CRUD、持久化与 Web 项目列表/详情/新建/编辑/删除均已实现并自动验证 |
| R2 | WBS 任务拆解 | P0 | 在项目下逐层新增/编辑/删除任务，支持**至少 3 层**父子结构；字段：标题、负责人、状态、优先级、起止日期、进度；自动 WBS 编号（如 1.2.1） | ① 能搭出 ≥3 层任务树并增删改；② 父子关系正确、删除父任务有明确处理策略（见 5.3）；③ 编号自动生成且唯一；④ 持久化到 JSON、重启不丢 | 已完成（离线）：tasks 表、完整命令、三级树、移动/循环保护、显式重编号与重启读回均通过 |
| R3 | 里程碑管理 | P0 | 新建/编辑里程碑：标题、目标日期、状态（计划中/有风险/已达成/已错过）、说明；可关联相关任务；时间线视图 | ① 能创建并标记里程碑达成；② 项目视图可见按日期排序的里程碑时间线；③ 状态随日期/任务进展可手动更新；④ 持久化、重启不丢 | 已完成：离线完整命令与 Web 日期时间线、新建、标记达成、删除均已实现并自动验证 |
| R4 | 数据持久化与导出 | P0 | JSON 文件可靠落盘（原子写）；每个项目生成可读 Markdown 概览；一键导出 Markdown 报告与 JSON 打包 | ① 重启后数据完整；② 直接打开数据文件是人能看懂的 JSON/Markdown；③ 可导出一份含计划/WBS/里程碑的 Markdown 报告；④ 数据目录可被 git 跟踪 | 已完成：三类实体持久化、单项目 Markdown 和整库 JSON 数据包均通过回归 |
| R5 | Web 可视化界面（MVP 版） | P0 | 在 dsh Web 中提供项目管理面板：项目列表 → 项目详情（计划信息 / WBS 任务树 / 里程碑时间线），支持基础新建/编辑表单 | ① `pnpm dsh web` 后能在浏览器看到并操作上述界面；② 核心增删改查通过界面即可完成、无需命令行；③ 无 API Key 时界面功能可用。**排序（ADL-013）：排在 R2/R3/R4 之后；先做设置卡片/插件详情区块，再 spike 独立顶级页面；若外部包无法稳定新增顶级页面，第一版接受「设置卡片/区块 + 离线斜杠命令」作为演示形态** | 已完成并验收：外部 clientBundle 顶级面板支持项目/WBS/里程碑核心操作，无 Key 可用；2026-10-10 项目所有者手动验收通过 |
| R6 | 离线斜杠命令 | P0 | 提供 `/pm` 系列用户命令（projects/tasks/milestones 的增查改），作为离线与无界面时的入口 | ① 不配置模型即可用命令完成 R1–R3 的增查改；② 命令输出中文、可读 | 已完成：project/task/milestone 离线命令均已实现并回归通过 |
| R7 | 风险与问题管理 | P1 | 共用风险问题台账：风险含概率/影响/应对，问题含影响/解决方案，通用负责人/截止日期/状态；支持类型与状态筛选 | 能离线新增、查看、编辑、关闭、筛选和确认删除风险与问题；JSON 持久化且重启不丢；Web 无 Key 可完成核心操作 | 已完成：离线命令、`risk_issues` 持久化、高密度 Web 表格与右侧抽屉均已实现并回归通过 |
| R8 | 会议纪要 | P1 | 首版离线录入结构化纪要，包含议题、决议和稳定 ID 的内嵌行动项；行动项关联任务/问题/责任人，未来可转 WBS 任务 | 能离线完成纪要与行动项 CRUD、关联同项目任务/问题、筛选并持久化；未来新增转任务能力时无需迁移现有纪要 | 已实现并验收 |
| R9 | 进度汇报 | P1 | 自定义日期范围生成固定快照，汇总任务、里程碑、会议及异常项；人工维护摘要/计划/阻塞并导出精简 Markdown | 无 Key 可生成、查询、编辑人工字段、确认删除和导出；源数据变化不改写旧快照，新快照反映最新状态；Web 可操作 | 已完成：trae 实现，doubao-work 独立复核（冻结安装/构建/十项 verify/隔离真实宿主启动与下发 bundle）通过并随提交推送；本机浏览器目视项以所有者手动确认为准（KB-014） |
| R10 | 交付物管理 | P1 | 复用 dsh deliverables「交付声明 + 变更留痕」概念，在自研 pmtool 领域补项目维度交付物台账：名称/版本/负责人/状态/位置/计划交付日期，版本与状态变化自动留痕（ADL-028） | 能离线增删改查交付物、按状态筛选、查看变更历史；有交付物的项目禁止删除；含 Web 标签与专项验证 | ✅ 已完成（doubao-work，2026-10-10） |
| R11 | 里程碑提醒 | P2（暂缓） | 复用 dsh schedule，对临近/逾期里程碑提醒 | 阶段 2 决策：第一版不做，后续迭代再启用；ADL-032 进一步说明暂缓理由（依赖常驻调度与 Key，与离线优先定位冲突） | 暂缓 |
| R12 | 多项目与检索 / 导入 / 协作 | P2 | 多项目切换（Web 已有）、关键字检索、统计看板；导入外部任务表（Markdown 清单）；多人协作 | ① `/pm search <关键字> [--type ...]` 跨七类实体不区分大小写子串匹配、按类型分组输出；② `/pm stats [项目ID]` 全项目/单项目只读聚合（完成率、逾期、未关闭风险按严重度、交付物四态）；③ `/pm task import <项目ID> <清单.md> [confirm]` 按 GitHub 缩进勾选清单导入为 WBS 任务，dry-run 不写盘、confirm 落盘、重启读回；④ Web「总览看板」与全局搜索基于 snapshot 派生。**裁剪**：Excel 导入（ADL-030）、多人实时协作（ADL-031）本期不做 | ✅ 已完成（doubao-work，2026-10-11）：检索/看板只读、Markdown 导入落盘、Web 看板与全局搜索、verify-r12 + 扩展 verify-web 及隔离真实宿主 bundle 断言通过；Excel 导入与多人协作为「裁剪/暂缓」 |

### 拟新增（评审稿·待编码，ADL-036，详见 docs/generative-features-plan.md）

> 以下三条为**生成型功能立项评审稿**：LLM 只做一次性文本生成、不依赖 function calling；AI 输出一律为「草稿」，经 confirm 才入库；无 key/模型失败优雅降级到手工/确定性路径；核心台账始终离线可用。设计与技术依据见 `docs/generative-features-plan.md`。

| 编号 | 名称 | 优先级 | 功能 | 验收标准 | 数据模型影响 |
| --- | --- | --- | --- | --- | --- |
| R13 | 智能 WBS 任务拆解 | P1 | `/pm task wbs <项目ID> "<目标文本>" [confirm]`：AI 产出 Markdown 缩进勾选清单，复用现有 dry-run 预览→confirm 落盘 | 预览树形与 `planTaskImport` 一致；confirm 后任务入库、编号/父子正确；无 key/失败给中文降级提示不崩；新增 verify-wbs | ✅ 已实现（doubao-work）：AI 草稿预览不落盘、confirm 复用草稿落盘；限流/空正文降级；不新增表 |
| R14 | 进度汇报 AI 叙述 | P1 | `/pm report narrate <项目ID> [confirm]`：基于 `collectProjectReport` 确定性数字，AI 写「本周进展/风险/下周计划」叙述段落，并入 R9 快照与 Markdown 导出 | 叙述数字与确定性采集一致；confirm 后叙述可被读、导出含该段；失败时仍生成无叙述的确定性快照 | ✅ 已实现（doubao-work）：叙述写入既有 `executiveSummary` 字段（零 schema 改动）；失败降级确定性快照 |
| R15 | 会议纪要归纳 | P1 | `/pm meeting summarize <项目ID> "<速记>" [confirm]`：AI 归纳议题/结论/行动项(负责人/截止日)，映射既有 meeting 草稿 | 行动项负责人/截止日落入 actions[]；confirm 后存为 draft meeting、可被 list/get 读到；JSON 解析失败降级为「原文入 summary」 | ✅ 已实现（doubao-work）：```json ``` 围栏防御解析；confirm 建 draft 会议并挂行动项；复用 addMeeting/addMeetingAction |
| R16 | 临期/逾期提醒 | P1 | `/pm due [天数] [项目ID?]`（默认全部项目 7 天）：派生逾期（未完成任务 dueDate<今天 / 未达成里程碑 targetDate<今天）与临期；Web 面板打开即显示提醒条 | 已完成/已达成不计；按日期升序跨项目分组；第 7/8 天边界正确；Web 逾期红临期黄仅用宿主 token；不新增表 | ✅ 已实现（doubao-work）：`core/reminders.computeReminders` 读时派生；Web `ReminderStrip` 基于 snapshot；见 ADL-039 |
| R17 | 会议行动项转任务 | P1 | `/pm meeting action promote <会议ID> <行动项ID> [confirm]`：在会议所属项目下创建任务并回写 `action.taskId`（幂等） | dry-run 不落盘；confirm 任务标题/负责人/截止正确并回写；重复 promote 不重复建；Web 行动项加「转任务」按钮、已转禁用 | ✅ 已实现（doubao-work）：复用 `addTask` 编号链路；见 ADL-040 |
| R18 | 数据备份/恢复 + 云同步指引 | P1 | `/pm backup [目录?]` / `/pm restore <文件> [confirm]`：备份七类实体为带时间戳 JSON；恢复两步且恢复前自动安全快照；Web 一键备份入口 | 备份含七实体、不含 checks/密钥；恢复往返一致；缺 confirm 不执行；恢复后续号/读回正常；云同步单写者指引 | ✅ 已实现（doubao-work）：见 `docs/backup-sync.md` 与 ADL-041 |

### 变更提案（Change Proposal）：PROD-07 顶层「人员与负载」视图（v0.5.1，已实现·独立验收 PASS）

> 不新增 R 编号，复用并升级产品档案 PROD-07。**已实现（2026-10-13）**：自动化 + GUI 核心通过独立测试矩阵 **28 PASS / 0 NOT_RUN / 0 FAIL**。原「真实 390px 窄屏目视」MANUAL_PENDING 已由 **#25（2026-10-17，真 390px 窄窗响应式正式修复，GI-WEB-14/PROD-07）**正式关闭：人员负载固定 6 列网格在 390px 改可换行卡片，隔离真实 Chrome 浅/深实测无外壳溢出（证据 `docs/verification/narrow390-20261016/`）。

- **一句话**：新增顶层「人员」tab，跨项目按 `task.assignee` 归一化聚合未完成任务，按风险（逾期→受阻→临期→最近截止）排序，未分配置顶，点任务直达详情；全程只读派生。
- **数据模型影响：无**。分组键＝`assignee` 经 `trim()`+空白折叠+`casefold()`；不建人员表、不持久花名册、domain 仍 v1、不改任何 schema。不拆分多负责人字符串。
- **P0**：人员卡（未完成/待办·进行中·受阻/逾期/临期/P0/跨项目数/最近截止）、风险排序、未分配桶、项目过滤+姓名搜索+只看有风险、任务行 `openRecord` 直达、空态。
- **P1**：近相似名软提示（不自动合并）、j/k 导航+记忆、`project.owner/riskIssues.owner` 涉众提示。
- **与版本规划关系**：归 **v0.5.1 体验增量**，不并入 v0.6（v0.6 才动 domain v2）；与 v0.6 零冲突。
- **完整契约/验收/反例/建议文件清单**：见 [`docs/product/07-people-load-view-design.md`](product/07-people-load-view-design.md)；状态见 [`docs/product/05-roadmap-and-tasks.md`](product/05-roadmap-and-tasks.md) 2026-10-13 勘误。

### 变更提案（Change Proposal）：PROD-24 副驾多步规划（已实现·独立验收 PASS）

> 不新增 R 编号，复用并升级产品档案 PROD-20（AI 项目副驾）。**状态（2026-10-13）：已实现并通过独立验收**——总门 PASS：49 项 AUTO/GUI 可自动项全绿、0 FAIL/BLOCKED/NOT_RUN；2 项 MANUAL_PENDING（真实免费模型实机降级、真 390px 窄窗目视）待所有者反馈。

- **一句话**：把 v0.5 副驾「扁平动作数组草稿卡」升级为**多步计划卡**（步骤/理由/依赖拓扑、勾选跳过、行内标量编辑、整批+逐步确认），执行仍复用既有 `ask-apply`。
- **数据模型影响：无**。不写 settings、不新增计划表、不新增命令级服务端缓存；计划随模型响应返回，只活在前端内存、关面板即消散；domain 仍 v1、不改任何 schema。
- **P0 裁决边界**：①执行仍 `ask-apply <项目ID> <selected ordered actions> --base <baseline>`，不新增执行命令；②命令行长 JSON 风险靠**预算护栏 ≤8 步（触及 >10 任务）整份拒绝**吸收；③旧 `{"actions":[...]}` 输出自动包成平凡计划，v0.5 E2E 不破；④DAG 依赖环/悬空/自指只拒该步（坏步拒而非整拒）；⑤同任务链式 baseline（整批内后者用前者落库后的新 updatedAt）；⑥取消草稿磁盘零变化；⑦唯一写动作 `task.update`（patch 仅 status/progress/assignee/startDate/dueDate）。
- **P1**：计划持久化（domain v2 窗口）、「撤销上次计划」补偿命令、扩充 op（milestone/risk）、执行后自动追问/多轮重规划。
- **验收**：见设计稿 11 条（拓扑/环、链式基线、冲突逐行拒、delete 步红行拒、行内编辑非法禁用、取消零写、乱码零落库、60s 幂等、降级、>8 整拒、旧格式兼容）。
- **完整契约/页面草图/反例/文件级计划**：见 [`docs/product/08-copilot-multistep-design.md`](product/08-copilot-multistep-design.md)；roadmap 登记见 [`docs/product/05-roadmap-and-tasks.md`](product/05-roadmap-and-tasks.md) PROD-24 行。

### 变更提案（Change Proposal）：Web polish 三件套 PROD-10 → 09 → 04（v0.5.2，已实现·独立验收 27/27 PASS）

> 不新增 R 编号，复用产品档案 PROD-10 / PROD-09 / PROD-04。**状态（2026-10-13）：已实现并通过独立验收总门 PASS——27/27，0 FAIL/BLOCKED/NOT_RUN/MANUAL_PENDING**（testedCommit `85cb651`；矩阵 `docs/testing/web-polish-acceptance.md`，证据 `docs/verification/gui-web-polish-20261013/`）。完整契约见 [`docs/product/09-web-polish-design.md`](product/09-web-polish-design.md)。

- **一句话**：补齐 v0.5 留在 Web 侧的三个高频缺口——任务抽屉显示「来自会议 mtg-xxx」直达（PROD-10）、汇报表相邻快照对比徽标（PROD-09）、Web「移动到…」改父（PROD-04）。
- **数据模型影响：无**。domain 仍 v1、9 表不变；PROD-04 的原子化是 core 写队列内编排与回滚，非字段变更。
- **落地顺序（所有者拍板）：PROD-10 → PROD-09 → PROD-04**（10 数据链路最全改动最小，09 纯展示，04 交互与后端原子最重）。
- **PROD-10**：前端反查 `meetings.actions[].taskId`（promote 已回写、`findMeetingActionByTask` 已在 core）；多来源按会议列表口径（meetingDate 倒序→id 倒序）确定性取第一条并提示「另关联 N 场会议」；只读行、复用既有 `openRecord` 直达；来源会议删除则安全隐藏。
- **PROD-09**：全量按 periodEnd/id 排序对相邻**固定快照** diff（不受顶部搜索/状态筛选影响）三指标＝完成率(averageProgress)、overdue_task 异常数、总异常数；首份无徽标；delta=0 显示「持平0」；文字+箭头，不靠颜色单独传达。
- **PROD-04**：Web 树选择器排除自身/后代（后端环检测仍为硬门）；**一次确认＝改父＋本项目全量 renumber 同一用户动作**，后端单写队列内原子复合、失败整体回滚，**禁止「move 成功 renumber 失败」半状态**；取消零写；P0 不做拖拽/中间插序。
- **完整契约/用户故事/验收条件/文件级计划**：见 [`docs/product/09-web-polish-design.md`](product/09-web-polish-design.md)；roadmap 登记见 [`docs/product/05-roadmap-and-tasks.md`](product/05-roadmap-and-tasks.md) PROD-04/09/10 行。**下一步主线＝schema v2**：PROD-11（`predecessorIds[]` 依赖）、PROD-21（repoUrl/branch）、PROD-23（健康分 + 崩溃原子恢复）。

### 变更提案（Change Proposal）：schema v2 批 PROD-11 / PROD-21 / PROD-23 + 崩溃原子恢复（v0.6.0，已实现·独立验收总门 PASS）

> 不新增 R 编号，复用产品档案 PROD-11 / PROD-21 / PROD-23。**状态（2026-10-13）：已实现并通过独立验收总门 PASS——50 用例 = 48 PASS + 2 MANUAL_PENDING（V2-G8 / V2-H5 不可逆人工确认，按 ADL-047 分层不阻塞）**（绑定提交 `17ccc82` + `4b533ad`；矩阵 `docs/testing/schema-v2-acceptance.md`）。完整契约见 [`docs/product/10-schema-v2-design.md`](product/10-schema-v2-design.md)。

- **一句话**：v0.6.0 才动的 domain v2——任务加可选前置依赖、项目加可选仓库地址/分支、概览加确定性红黄绿灯健康分，并把备份/恢复与启动体检做成「打得开、查得清、可回滚」。
- **数据模型影响：domain v1→v2，同 commit 兼容 [1]**。新字段全部 optional（任务 `predecessorIds[]`、项目 `repoUrl`/`branch`），旧 v1 记录读回不报错、零迁移重写；健康分纯派生不落盘。
- **PROD-11**：可选前置依赖、同项目、环检测、删除引用保护（新错误类，仿 TaskReferencedByMeetingError）、「等待前置」只读标签（不自动改 status）；甘特依赖箭头=P1。
- **PROD-21**：项目级 repoUrl/branch，格式校验、概览只读链接、**全程不联网验证**；任务/交付物级=P1。
- **PROD-23**：基于既有 stats 的确定性扣分公式（逾期/受阻/高影响风险/逾期里程碑，各项封顶），概览红黄绿灯+扣分项可见；空项目灰灯「数据不足」；文案注明「仅供排期参考，不做绩效评价」。
- **崩溃恢复裁决**：坏记录 clean fail + 中文路径诊断（**不启用 backup-and-skip 静默移走**）；createBackup 临时文件+fsync+rename；restore 失败内存快照自动回滚；backup formatVersion 保持 1 且兼容旧备份；`/pm doctor` P0 只读体检，悬空引用只报告、显式 confirm 才修。
- **明确不做**：跨进程/跨记录 ACID、WAL、自动自愈悬空引用、联网验证仓库、甘特关键路径**自动排期/压缩/改期**（关键路径**只读高亮** GI-CP-01~05 已于 2026-10-16 交付，见 `docs/verification/gui-critical-path-20261016/`；自动排期仍属长期观望）。

### R12 命令与格式约定（v0.9 补充）

```text
/pm search 需求                       # 跨全部七类实体（项目/任务/里程碑/风险问题/会议/汇报/交付物）不区分大小写子串匹配
/pm search 验收 --type task           # 限定类型：project / task / milestone / risk / meeting / report / deliverable
/pm stats                            # 全项目汇总（项目状态计数 + 各实体总量 + 逐项目明细）
/pm stats p-0001                     # 单个项目明细（任务完成率、逾期、未关闭风险按严重度、交付物四态）
/pm task import p-0001 任务表.md     # 解析并预览将创建的任务树（不落盘），[x] 记为已完成
/pm task import p-0001 任务表.md confirm   # 真正导入；缩进层级决定 WBS 父子关系，复用 addTask 编号
```

- 检索与统计均为**只读派生**，不新增表、领域版本仍为 1；只有 `task import` 是写操作。
- Web 顶部「总览看板」为浏览器端基于最新 snapshot 的跨项目统计卡片与全局搜索，不新增宿主路由、配色只用宿主 token。

## 四、MVP 数据模型（字段定义）

> 数据经 `storage-domain` 做 schema 校验；下列字段即 schema 与 JSON 落盘字段。枚举值固定，便于界面渲染与迁移。
>
> 2026-10-10 进度同步（trae 实现 → doubao-work 独立复核）：R1–R9 已完成；R9 通过十项回归、隔离真实宿主启动与下发 bundle 复核并已随提交推送（ADL-026/027）；本机浏览器目视项以所有者手动确认为准（KB-014）。实现细节见 ADL-026 与两份 R9 计划文档。

### 4.1 Project（项目）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 唯一标识，键名仅用 `[a-zA-Z0-9_-]+` |
| name | string | 项目名称（必填） |
| description | string | 目标与范围描述 |
| owner | string | 项目负责人 |
| status | enum | `planning` 计划中 / `active` 进行中 / `paused` 已暂停 / `done` 已完成 / `archived` 已归档 |
| startDate | date(YYYY-MM-DD) | 计划开始日期（必填） |
| targetDate | date | 计划完成日期（必填，且不得早于 startDate） |
| tags | string[] | 标签（可选） |
| createdAt / updatedAt | datetime | 创建/更新时间（自动） |

### 4.2 Task（WBS 任务节点）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 唯一标识 |
| projectId | string | 所属项目（必填） |
| parentId | string \| null | 父任务，根任务为 null，构成 WBS 树 |
| code | string | 自动 WBS 编号，如 `1`、`1.2`、`1.2.1` |
| title | string | 任务标题（必填） |
| description | string | 任务说明 |
| assignee | string | 负责人 |
| status | enum | `todo` 未开始 / `in_progress` 进行中 / `blocked` 受阻 / `done` 已完成 |
| priority | enum | `P0` / `P1` / `P2` |
| startDate / dueDate | date | 计划起止（可选） |
| progress | int 0–100 | 完成进度（默认 0） |
| milestoneId | string \| null | 关联里程碑（可选） |
| order | int | 同级排序 |
| createdAt / updatedAt | datetime | 自动 |

### 4.3 Milestone（里程碑）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 唯一标识 |
| projectId | string | 所属项目（必填） |
| title | string | 里程碑标题（必填） |
| targetDate | date | 目标日期（必填） |
| status | enum | `planned` 计划中 / `at_risk` 有风险 / `achieved` 已达成 / `missed` 已错过 |
| achievedDate | date \| null | 实际达成日期 |
| description | string | 说明/达成标准 |
| createdAt / updatedAt | datetime | 自动 |

关系：Project 1—N Task（通过 `parentId` 自引用成树）；Project 1—N Milestone；Task 可经 `milestoneId` 关联到 Milestone。

### 4.4 RiskIssue（风险与问题）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | `ri-0001` 形式的全局递增短 ID |
| projectId | string | 所属项目（必填） |
| type | enum | `risk` 风险 / `issue` 问题；创建后不可修改 |
| title / description | string | 标题必填，说明可为空 |
| owner | string | 负责人 |
| dueDate | date \| null | 截止日期，可清空 |
| status | enum | `open` 待处理 / `monitoring` 跟进中 / `closed` 已关闭 |
| impact | enum | `low` / `medium` / `high` / `critical` |
| probability | enum \| null | 风险必填 `low/medium/high`；问题固定为 `null` |
| responsePlan | string | 风险应对措施；问题固定为空字符串 |
| solution | string | 问题解决方案；风险固定为空字符串 |
| createdAt / updatedAt | datetime | 自动 |

关系：Project 1—N RiskIssue。风险与问题共用一张表，以 `type` 区分；类型专有字段保持稳定结构并在写盘前严格校验。

### 4.5 Meeting（会议纪要）

会议字段：`id`、`projectId`、`title`、`meetingDate`、可选开始时间/时长、地点、主持人、记录人、参会人、`draft/final` 状态、摘要、议题、决议、内嵌行动项、来源和审计时间。完整字段与约束见 `docs/plans/2026-10-10-r8-meeting-notes-design.md`。

行动项使用稳定 `ai-NNN` ID，包含标题、负责人、截止日期、状态、可选 `taskId` 和 `riskIssueId`。首版只关联已有同项目任务或问题；未来通过显式 `promote` 操作创建 WBS 任务并回写 `taskId`，不按数组下标定位、不重复创建。

### 4.6 ProgressReport（进度汇报）

汇报字段：`id`、`projectId`、自定义 `periodStart/periodEnd`、标题、`draft/final` 状态、管理摘要、已完成事项、下期计划、阻塞说明、`snapshotAt`、固定 `snapshot`、来源和审计时间。快照包含项目元信息、任务/里程碑/周期会议汇总、周期里程碑与会议决议，以及受阻/逾期任务、有风险或错过里程碑、高影响未关闭风险问题、逾期行动项。

生成后项目、周期和快照不可修改；源数据变化不回写旧报告。任务没有状态变更历史，首版只保存生成瞬间的全量任务当前状态，不推断“本周期完成任务”。

### 4.7 Deliverable（交付物台账）

交付物字段：`id`（`dlv-NNNN`）、`projectId`、`name`（非空）、`version`（文本，可空，如 `v1.0`）、`owner`、`status`、`location`（文件路径 / URL / 存放位置的文字说明，离线优先不强制可访问）、`description`、`dueDate`（计划交付日期，可空）、内嵌 `history[]` 变更留痕、`createdAt/updatedAt`。

状态机四态：`planned`（计划中）→ `in_progress`（制作中）→ `submitted`（已提交，待验收）→ `accepted`（已验收）。`history[]` 只增不改：创建时写一条 `created`；此后仅当 `status` 或 `version` 实际变化时各追加一条 `{at, field, from, to, by, note}`，可带 `operator/changeNote` 记录操作人与说明；仅改名称、负责人、位置、说明、计划日期不产生留痕。项目归属、ID、变更历史与时间戳不可由用户直接改写；有交付物的项目禁止删除。

定位说明（ADL-028）：dsh 原生 `deliverables`（tool-present / workspace-changes / ui-deliverables）绑定 agent 轮次与 git 快照，是「智能体跑完一轮声明产物」的机制，不适合无 API Key 的离线手工台账，故 R10 复用其「交付声明 + 变更留痕」**概念**，数据层按 R7–R9 同款 pmtool 领域模式自研；`location` 自由文本可指向 dsh present 产物或任意文件/链接，为未来对接保留空间，首版不做运行时自动绑定。

## 五、数据落盘与目录约定（人类可读、可 git）

### 5.1 目录布局（已定稿，2026-10-10，决策见 ADL-011）

采用 dsh `storage-domain` 的 **per-record（逐条记录）扁平布局**：在单一存储领域 `pmtool` 下按「实体类型分表、一条记录一个可读 JSON 文件」组织。物理路径规则为 `<root>/<领域 unit>/<表 table>/<键 key>.json`，文件内容 `{ "version": n, "record": <值> }`，目录权限 `0700`、原子写。

```
pm-tool/
├── data/                          # storage-json 的 root（ADL-009：不纳入 git、已 gitignore，首次写入自动创建）
│   └── pmtool/                    # 存储领域 unit = pmtool（与第 0 步自检同一领域）
│       ├── checks/                # 第 0 步自检表（selftest.json，保留）
│       ├── projects/
│       │   └── <projectId>.json   # 一条项目一个文件（表 projects，键 = projectId）
│       ├── tasks/
│       │   └── <taskId>.json      # 一条任务一个文件（表 tasks；记录含 projectId / parentId / 同级顺序 / WBS 编号）
│       ├── milestones/
│       │   └── <milestoneId>.json # 一条里程碑一个文件（表 milestones；记录含 projectId）
│       ├── risk_issues/
│       │   └── <riskIssueId>.json # 一条风险或问题一个文件（表 risk_issues；记录含 projectId / type）
│       ├── meetings/
│       │   └── <meetingId>.json   # 一条会议纪要一个文件，行动项内嵌并使用稳定 ID
│       ├── reports/
│       │   └── <reportId>.json    # 一份固定快照进度汇报一个文件
│       └── deliverables/
│           └── <deliverableId>.json # 一项交付物台账一个文件（表 deliverables，内嵌 history 留痕）
└── packages/dsh-pm-tool/          # 自研插件包
```

- **不设手工 `index.json`**：storage-domain 的表提供 `keys()` / `entries()` 迭代器（上游 `storage-domain/src/domain.ts` 已确认），项目列表、某项目下的任务/里程碑通过遍历表并按 `projectId` 过滤得到，避免双写索引导致不一致。
- 项目 `README.md` 概览、周报等 Markdown 是 **R4 的渲染导出产物**（导出到用户指定目录或随 JSON 打包），**不写入存储域、不作为数据源**；数据始终以上述 JSON 为准。
- 记录键名仅允许 `[a-zA-Z0-9_-]+`：各实体使用短 id（如 `p-0001`、`t-0001`、`m-0001`、`ri-0001`、`mtg-0001`、`rpt-0001`、`dlv-0001`）。storage-domain 表名仅允许小写字母、数字和下划线，因此风险问题表使用 `risk_issues`。
- 本布局替代早期「按项目聚合的嵌套目录（`projects/<id>/project.json` 等）」设想——嵌套目录与 per-record 扁平键规则不兼容，故不采用（见 ADL-011）。

### 5.2 读写原则

- 写入一律经 `storage-domain`（schema 校验）→ `storage-json`（原子写、美化缩进），不手写裸 JSON。
- `README.md` 概览由数据**渲染导出**（数据以 JSON 为准、Markdown 为可读视图），避免双写不一致。
- 导出功能：单项目导出为一份 Markdown 报告；整库导出为 JSON 打包；后续可接 office-to-pdf 出 PDF。
- Markdown 默认导出到 `pm-tool/exports/<projectId>-report.md`（可指定目录）；已有文件默认拒绝覆盖，末尾 `confirm` 才原子覆盖。`exports/` 是可再生产物，默认不入 git。

### 5.3 关键业务规则（实现前明确，避免歧义）

- 删除父任务：MVP 采用**要求先处理子任务**（有子任务时禁止直接删除，提示先移动或删除子任务），不做静默级联删除，防止误删。
- WBS 编号：按同级顺序自动生成；移动/删除后提供「重新编号」动作（不自动改写，避免引用混乱）。
- 任务移动：命令须带 `confirm`；目标父任务必须同项目，禁止移动到自身或子孙任务下。`root` 表示移到根层级。
- 任务更新：只允许业务字段；项目归属、父任务、编号、顺序和时间戳由独立动作或系统维护。`startDate` / `dueDate` 可用 `null` 清空。
- 里程碑状态：默认手动维护；`missed/at_risk` 的自动判定作为 P1 增强。
- 里程碑达成一致性：`status=achieved` 时必须填写 `achievedDate`；其他状态必须为 `null`。
- 任务关联里程碑：`milestoneId` 必须指向同项目已存在里程碑；有关联任务时禁止删除里程碑，须先解除关联。
- 所有删除/覆盖类操作在界面与命令中都需二次确认（呼应行为准则的风险操作约定）。
- **项目删除（ADL-012）**：离线命令形态为 `/pm project delete <id> confirm`；不带 `confirm` 仅返回将删除内容的中文提示、不落盘；任务/里程碑等后续删除命令统一沿用该关键字确认模式。
- **日期校验（ADL-012）**：项目新增与更新都校验 `targetDate >= startDate`，不满足则中文报错、不写入。
- **同名项目（ADL-012）**：默认阻止同名新增并中文提示；确需重名时在命令末尾追加 `confirm` 关键字才创建（ID 仍是唯一主键，名称不去重，仅做防呆）。
- **同名比较与更新（ADL-015）**：名称 `trim` 后区分大小写精确比较；更新仅在实际改名撞到其他项目时拦截，末尾 `confirm` 可放行。已确认的重名项目更新其他字段不重复确认。
- **风险问题规则（ADL-024）**：风险与问题共用 `risk_issues` 表，创建后不可改变 `projectId` 和 `type`；删除必须带 `confirm`；项目仍有风险或问题时禁止删除。R7 暂不修改已发布的 Markdown 与整库 JSON 导出格式。
- **会议纪要规则（ADL-025）**：会议使用 `meetings` 表，行动项内嵌但以稳定 ID 操作；行动项只可关联同项目任务或问题。首版不调用模型、不自动创建任务，未来以幂等 `promote` 动作转为 WBS 任务。
- **进度汇报规则（ADL-026）**：报告使用 `reports` 表；自定义日期范围筛选周期会议和里程碑，任务统计取生成瞬间当前状态；快照生成后不可修改。Markdown 默认只含摘要、周期事件和异常项，不输出完整业务明细。
- **开发顺序（ADL-013）**：先完成 R2/R3/R4 离线能力，再做 R5 Web；R5 先卡片/区块、后独立顶级页面 spike，顶级页面不可行时按 ADL-013 降级交付。

## 六、非功能需求

- **可运行可演示**：阶段 3 每个迭代都能 `pnpm dsh web` 现场演示，附命令、退出码、页面结果等验证证据。
- **不破坏上游**：`deepseek-harness/` 只读；所有自研能力为独立外挂插件包 + 专属 profile，不改上游源码。
- **离线可用**：MVP 核心功能不配置任何 API Key 即可运行；生成型能力缺失 Key 时给出友好提示而非报错崩溃。
- **可迁移**：数据为通用 JSON/Markdown；仓库 clone 后按 README 即可复现；不依赖私有二进制格式。
- **安全**：密钥/token 不入库（`.gitignore` 覆盖）；遵循 dsh 沙箱与文件权限（存储目录 `0o700`）。
- **质量与表达**：命名规范、关键逻辑有中文注释；界面与命令输出为简体中文、术语附白话说明。

## 七、插件分包的初步设想（阶段 3 细化，开发前另行报备）

- `pm-core`：存储域与 Project/Task/Milestone 实体、schema、Markdown 渲染/导出；
- `pm-commands`：离线 `/pm` 斜杠命令；
- `pm-web`：Web 卡片/区块界面；
- `pm-tools`（**MVP 仅预留接口、不实现**，第二梯队）：供模型调用的生成型工具（智能拆解、纪要、周报），配置 `DEEPSEEK_API_KEY` 后再启用。
- 装载：独立仓库内插件包 + 专属 dsh profile（本地 `file:`/工作区依赖联调，后续可发布 npm）。

## 八、阶段 3 开工前需先验证的两个技术点（不阻塞本文档定稿）

1. 第三方插件在 dsh Web 中可达的界面形态已验证：独立包通过 `dsh.client` + `./client` 动态 bundle 注册顶级主面板与侧栏入口，无需修改上游（ADL-022）。
2. 独立仓库插件包被本地 dsh profile 成功装载的完整链路已验证（`dsh plugin` / `cordis.patch.yml` / `--dump-config`）。

## 九、补充决策（2026-10-10 项目所有者已确认，见 ADL-009）

1. **业务数据目录 `data/` 暂不纳入 git**：已在 `.gitignore` 忽略；目录由存储后端首次写入时自动创建（权限 `0o700`）。日后若需共享示例数据再单独决策。
2. **里程碑到期提醒（R11）第一版不做**：优先级调整为 P2（暂缓），MVP 严格保持最小闭环。
3. **生成型能力第一版仅预留接口、不实现**：智能 WBS 建议、会议纪要归纳、周报撰写（R8/R9 的生成部分）在 MVP 不开发，仅在架构上预留模型工具（`ctx.tools`）位置，待配置 `DEEPSEEK_API_KEY` 后于第二梯队启用。
   - **更新（2026-10-11，ADL-035）**：模型**通道**已就绪——已通过 `@deepseek-ai/dsh-llm-pi-ai` 配好零成本 OpenRouter 免费自动路由（`openrouter/free`，详见 `docs/model-providers.md`），但**具体生成型业务功能仍待单独立项**；免费随机模型不保证稳定工具调用，核心台账始终离线不依赖该通道。

# 全系统 UI 改进 · 规范草案与逐项走查覆盖清单（准备稿）

> 日期：2026-10-17　状态：**草案 / 未冻结 / 静态准备**
> 适用仓库：`/Users/bytedance/Projects/dsh-pm/pm-tool`（只读宿主 `/Users/bytedance/Projects/dsh-pm/deepseek-harness`）
> 本文件只做「读现状、盘点、准备」，**不实现产品代码、不改现存文档/AGENTS/模板/样式**。

## 0. 本稿状态与硬边界（先读）

1. **未冻结，不宣称后续已完成。** 本稿是全系统优化的**静态准备材料**，在 P2-2 剩余 G3 真实 GUI 采证通过、且 P2-6（AI 溯源治理）落地独立验收之后才进入冻结、再展开优化。现况（2026-10-17）：P2-2 自动/静态已 PASS（164 例、73 verify），仅 G3 真实 GUI 目视门受阻；P2-6 未启动。设计/代码最终基线未定，本稿所有视觉/状态判断均为**静态待验证假设**，不是实测结论，更不是验收 PASS。
2. **静态、不冒充实机。** 本稿基于源码、静态样式与既有测试/走查文档盘点；真实浅/深 × 1440/768/390 目视、键盘与读屏实测、慢请求/禁用/加载/成功态取证，统一留待具备真实浏览器采集通道的主执行端完成。通道受限期间相关项保持 BLOCKED / NOT_RUN，**不得以 DOM 断言、计算色值或 mockup 标注代替目视**（沿用 `docs/testing/p2-batch-test-plan.md` G3 门口径）。
3. **安全只读。** 不改动宿主模型/凭据、不接外部收费服务、不新增 CRDT、不读取输出敏感信息、不触真实台账；无 git fetch/pull/commit。
4. **不与实施者抢文件。** 本稿在仓库内只新建本文件这一个 docs 文件；现存 AGENTS、PR/测试模板、组件示例、视觉基线、自动检查脚本一律**只提后续建议、现在不改**。
5. **缺陷三分类（本稿口径，登记时映射既有 `docs/testing/defect-format.md`）：**
   - **可复现缺陷**：可重复最小步骤、绑定被测提交、有证据、与验收不符 → 对应 defect-format S1/S2/S3，走 OPEN→FIXED→RE-VERIFIED 生命周期。
   - **视觉一致性偏差（System drift）**：同一角色在不同表面/实例取值或处理方式无正当理由地分叉，功能可用但破坏一致性 → 偏 S3/S4，按系统根因统一，不单点修补。
   - **主观机会（Opportunity）**：无已观察缺陷、值得做的改进假设，单独列，不赋缺陷严重度，需先定义成功度量。
   - 当前静态阶段三类**全部标注「待验证假设」**，不写成已成立问题。

## 1. 目的、范围与非目标

### 1.1 目的
- 在冻结前产出一份**可进入真实工作流**的 UI 规范草案 + 逐项走查覆盖清单，使 P2-2/P2-6 落地后，全系统优化可按真实分母逐项取证、独立验收，而不是按截图数量走查。
- 以公共组件/语义 token 为根因优先收敛；未来新增功能从同一系统复用，不在页面层各自分叉。

### 1.2 范围（对象边界，来自源码盘点）
- Web 面板（Cordis 插件注入宿主 `main` 槽）：10 个导航目标（总览看板 overlay + 9 视图）、10 类抽屉、9 组表单/设置、公共组件与视图内可复用模式、看板 15 类卡片与编辑态。
- 桌面优先的专家 PM 工具；单人单机、owner 自用，不以消费级 App 极简标准衡量。

### 1.3 非目标（本稿不做）
- 不重画产品、不追潮流改版、不编造用户研究/使用指标、不用理想 mockup 充当实际控件。
- 不改写 P2-2 Token 2.0 数值与迁移映射；不提前推进 P2-6；不替代独立测试专家的 PASS/FAIL。
- 不在本稿声称 WCAG 合规；无障碍只列待验证检查点。

## 2. 依据（已完整读取，方法留痕，不贴内部指令）

### 2.1 仓库治理与现行规范（仓库内，已读）
- `AGENTS.md`（零 schema、单写队列、隔离、零污染、角色与验收门控）。
- `docs/handoff.md` §0 移交说明（当前阶段、硬门、红线）。
- `docs/external-skills.md`（vendor 指纹、只读方法、禁止执行其中联网/写系统指令、manifest sha256 校验）。
- `docs/design/forward-design-proposal-20261017.md`（视觉体系、Token 2.0、IA、P2-6 AI 溯源、路线图）。
- `docs/design/p2-2-visual-token-baseline-20261017.md`（单层语义 token、四阶段、闭合清单、对比度实测口径）。
- `docs/design/p2-2-token-migration-map.md`（旧别名→新 token 映射、保留/废弃、验证）。
- 既有测试与证据：`docs/testing/defect-format.md`（S1–S4 + 缺陷字段/生命周期）、`docs/testing/p2-batch-test-plan.md`（G1–G5 门、G3 BLOCKED）、`docs/verification/full-regression-20261017/`（91 张既有截图 + 走查报告，作为**待刷新证据线索**，不直接复用为最终结论）。

### 2.2 外部 vendor 技能（只读方法，指纹已校验 201 文件 0 不符）
本稿只吸收其方法框架，不复制其内部指令；每条规范建议在 §5 标注「影响哪条规范」，不罗列技能名。
- 组件视觉/状态/适配：组件契约（目的/解剖/变体/独立状态轴/键盘与焦点/响应式/设计-代码对等/状态覆盖表）、视觉工艺（层次/排版/间距/色彩/控件/数据密集与响应式，区分沟通缺陷/无障碍风险/系统漂移/工艺机会）、可检索 UX 准则（焦点可见、内联校验贴近字段、空态给去向、防重复提交的禁用+加载、对比、窄表横滑/卡片化）。
- PM 任务流程与决策负担：需求契约（问题/结果/可测行为/质量约束/非目标/未决决策，事实-假设-承诺-提议分开）、最小连贯发布（砍广度先保核心结果，保无障碍/可恢复/可测量）、人-AI 工作流（角色与自主权、预览/审批/撤销/恢复、无上下文的批准不算控制）。
- 一致性与 AI 治理审查：设计系统四层（基础 token/组件模式/文档工具/治理采纳）、证据清单 `Pattern|Instances|Intended source|Observed variants|State gaps|A11y risk|Adoption|Owner`；AI 能力契约与风险（建议/起草/推荐/决定/行动/编排分权、来源与不确定性可检视、拒绝/撤销/恢复、失败矩阵）；审计证据分级 observed > measured > DOM/源码 > 截图，S0–S3 + Opportunity 校准。

## 3. 覆盖分母（真实盘点，不以截图数为分母）

> **本稿 AU×48 是一级分组盘点（族级落点）；已用 AST 把它向下展开为控件级候选位置（原始扫描基数 291 = 9 契约聚合 + 8 消费点 + 274 集成，见 §3.5.1），本版再把契约聚合细化为 46 契约子条目、11 消费点、12 个非原生语义点（甘特平移/resize/点击分列、看板拖拽源/落点成对）、5 个背景容器，共 348 行台账（控件行 343，背景容器另计）。这些都不是最终验收分母、更不是全覆盖率。** 验收分母须在 G3 采证后逐条核对位置真实存在、补齐运行实例与状态矩阵；当前 342 行 `NOT_RUN/待证`、6 行 `BLOCKED/待GUI-AT`（§7 已源码核真的 a11y 缺口，待独立 AT/键盘复验），无任何 PASS，不得当作已覆盖全部控件。状态/主题/视口是对同一单元的验证维度，不另计单元数。既有 91 张截图只是证据存量，不是分母。

**盘点对象汇总（一级分组，静态，待 G3/P2-6 后刷新）：** 导航目标 10（看板 overlay + 9 视图）；抽屉 10 类；表单/设置 9 组；看板卡片类型 15；公共组件契约点 10 组（C1–C10）；一级分组走查单元 **AU × 48**（全局 8 / 视图 17 / 抽屉表单弹层 11 / 看板 5 / 公共组件核对 7）。该 48 须向下展开为逐控件分母后才用于覆盖率计算。

### 3.1 导航目标（无 URL 路由，面板内 state 切换）——10
| 族 | ID | 源码入口 | 说明 |
|---|---|---|---|
| 看板 | DASH-00 | `src/client/board/BoardBento.tsx`（顶栏按钮开关 overlay） | 总览看板，全屏 overlay，15 类卡片 |
| 视图 | V01 | `src/client/views/overview.tsx` | 项目概览（健康环/元信息/4 KPI/阶段/负载） |
| 视图 | V02 | `src/client/views/tasks.tsx` | 全部任务（主工作区，行内编辑最密集） |
| 视图 | V03 | `src/client/views/gantt.tsx` | 甘特排期（粒度 seg/依赖线/拖拽/今日线） |
| 视图 | V04 | `src/client/views/milestones.tsx` | 里程碑（统计带/时间线） |
| 视图 | V05 | `src/client/views/risk-issues.tsx` | 风险与问题（类型 seg/概率×影响矩阵/列表） |
| 视图 | V06 | `src/client/views/people.tsx` | 人员负载（堆叠条/未分配置顶/展开明细） |
| 视图 | V07 | `src/client/views/meetings.tsx` | 会议纪要（搜索/状态 seg/双栏/行动项） |
| 视图 | V08 | `src/client/views/reports.tsx` | 进度汇报（搜索/状态 seg/双栏/三卡） |
| 视图 | V09 | `src/client/views/deliverables.tsx` | 交付物（状态 chip 过滤/搜索/分组列表） |

### 3.2 抽屉（10 kind，`panel.tsx` Drawer 联合类型）——10
D01 project-create · D02 project-edit · D03 task · D04 milestone · D05 risk-issue · D06 meeting · D07 report · D08 deliverable · D09 ai（AI 助手）· D10 settings。
视图内非抽屉弹层另计：M01 任务移动选择器、M02 保存命名视图、M03 管理视图、M04 看板卡片库抽屉、M05 看板配置面板、M06 恢复预览、M07 副驾计划确认（CopilotPanel 内联，非独立抽屉）。

### 3.3 表单/设置（抽屉内，与抽屉同位置、不同验证维度）——9
- F1 ProjectForm（D01/D02）：name、description、repoUrl、branch。
- F2 TaskForm（D03）：title*、description、status、priority、assignee(+datalist)、parentId、startDate、dueDate、progress、effortHours、evidenceUrl、manualProgress+manualNote、milestoneId、repoUrl、branch、predecessorIds 多选树。
- F3 MilestoneForm（D04）：title、dueDate、status、owner、description。
- F4 RiskIssueForm（D05）：type(risk/issue)、probability、impact、dueDate、owner、mitigation、contingency。
- F5 MeetingForm（D06）：title、date、attendees、location、sourceUrl、summary。
- F6 MeetingActions（D06 内联）：action title、owner、status、due、taskId、riskIssueId。
- F7 ProgressReportForm（D07）：period、summary、completed、nextPlan、blockers、evidenceUrl。
- F8 DeliverableForm（D08）：name、type、owner、dueDate、status、acceptanceCriteria、repoUrl、branch。
- F9 SettingsPanel（D10）：13 个数值字段分 3 组（健康分 11 / 临期窗口 1 / 人员负载 1），min/max/step/unit 已在 `src/core/settings.ts`。

### 3.4 公共/可复用组件（定义在 `panel.tsx` 或视图；复用点逐处保留，不单点修）
C1 ProjectSwitcher 项目下拉 · C2 Notice 全局反馈条（role=status，error 变体）· C3 EmptyWorkspace（0 项目空态）· C4 DrawerPanel（遮罩/焦点落入/关闭归还）· C5 Field+FormSection（label/required/hint/内联错误；panel 内源码出现次数 Field 71、FormSection 17，非挂载计数，逐处以展开为准）· C6 ReminderCapsule（popover：范围 seg + 完成/延期+1天/+1周）· C7 CopilotPanel 副驾（**已存在，以现有多步计划验收为准**：计划卡/整批/逐步/勾选/拒绝；**P2-6 待实现，不得因源码有名就当实装**：来源溯源、不确定性标注、撤销/恢复、失效行治理）· C8 AiAssistant（草稿预览/编辑/确认入库）· C9 GlobalBoard/BoardBento 壳（搜索/统计条/15 卡/编辑模式/布局 JSON 导入导出）· C10 MarkdownView / WbsTreeView（渲染复用）。
视图内待收敛模式：状态 chip 组、搜索框、类型 seg、空态块、统计带/健康环、堆叠条形图、列表+详情双栏、行内编辑（全选/完成开关/status 下拉/日期/进度）、导出下拉、命名视图菜单、全局密度切换。
> 静态注记（待验证，非缺陷）：**已挂载**：ViewSwitcher@1026（窄窗视图切换，已入 CONSUMER-PLACEMENT）。**静态未发现 JSX 消费者、待冻结前判死代码/待启用（F-6，不计入复用契约）**：BatchField(1918)、TableToolbar(2017)、StatusTag(2040)、Progress(2059)、TableEmpty(2068)、Summary(2509)、DeltaBadge(2010)。注意 `ProgressReportTable/Form` 是另一个已挂载组件，勿与未挂载的 `Progress` 条形组件混淆。

### 3.5 源码标签/词形匹配计数（仅盘点线索，不是控件数量，更不是分母）
> 下表是对源码做原生标签/关键词的**文本匹配次数**，可能包含组件声明、未挂载定义、模板重复与注释，**不等于 JSX 挂载数，更不等于运行时实例数**；不可当作「控件有多少个」，仅用于粗估各文件密度，逐控件数量以冻结后展开为准。

| 文件 | button | select | input | textarea | checkbox |
|---|---|---|---|---|---|
| panel.tsx | 283 | 54 | 78 | 19 | 35 |
| views/tasks.tsx | 90 | 8 | 30 | 4 | 24 |
| views/gantt.tsx | 38 | 4 | 5 | 0 | 5 |
| views/overview.tsx | 33 | 5 | 8 | 1 | 3 |
| views/meetings.tsx | 33 | 15 | 9 | 2 | 2 |
| views/reports.tsx | 28 | 13 | 4 | 2 | 0 |
| views/milestones.tsx | 24 | 2 | 4 | 1 | 1 |
| views/risk-issues.tsx | 23 | 12 | 5 | 2 | 4 |
| views/deliverables.tsx | 19 | 1 | 3 | 0 | 0 |
| views/people.tsx | 18 | 3 | 1 | 0 | 0 |

### 3.5.1 控件级候选分母（AST 分层展开，静态 NOT_RUN，非覆盖率）
> 方法：用包内 TypeScript 编译器做 **JSX AST 遍历**（非 grep 词频），收录原生交互元素（button/select/input/textarea）、命名公共组件消费点，以及逐类核真的非原生语义交互点；每条带 `文件:行号 + 所属组件 + 定位上下文`。除 6 行已源码核真缺口标 `BLOCKED/待GUI-AT` 外，其余 `NOT_RUN/待证`，须 G3 采证后逐条核对存在性与状态，**不得当作已验收覆盖率**。

**分层口径（去重方式，共 348 行台账 = CONTRACT-SUB 46 + CONSUMER-PLACEMENT 11 + INTEGRATION 274 + SEMANTIC 12 + BACKDROP 5）：**
- **RAW-BASE 原始扫描基数 = 291（保留为上一版口径，非最终全分母）** = 9 契约聚合 + 8 消费点 + 274 集成；后续细化只增列不改写该基数。
- **CONTRACT-SUB（46，契约内部控件逐条展开，状态/焦点按真实代码裁剪）**：9 个公共契约（Notice/DrawerPanel/ProjectSwitcher/ViewSwitcher/LaneSwitcher/ReminderCapsule/EmptyWorkspace/CopilotPanel/AiAssistant）内部每个原生/语义控件单独成行；状态只列适用子集（如 range seg 标 `aria-pressed` 选中、完成/+1/+7 仅 disabled-only、send/generate 带 Loading 防重复提交），焦点圈落到各契约真实行为（listbox/tablist/dialog 陷阱/popover 归还），不适用项在 note 写明。
- **CONSUMER-PLACEMENT（11，消费者集成点单列）**：基础 8 处（Notice@785、ProjectSwitcher@827、EmptyWorkspace@1012、ViewSwitcher@1026、CopilotPanel@1112、DrawerPanel@1135、AiAssistant@1206、ReminderCapsule@1502）+ LaneSwitcher 3 处挂载（AiAssistant 能力选择@1832、创作头 compact@1854、CopilotPanel 头部 compact@2327）；内部控件不重复计数。
- **INTEGRATION（274，原生控件挂载点）**：button/input/select/textarea；表单内每个字段是独立集成位置（Field 为契约包裹，不单列）。
- **SEMANTIC（12，非原生语义交互点，按 onClick/onKeyDown/role/pointer/drag 逐类核真）**：①跨项目任务行 li[role=button]@1578（Enter/Space）；②甘特条体点击打开/Esc@338、③整体平移 move（←/→1天）@149、④左右 resize 手柄 data-rs（Shift+←/→改工期）@154——三种手势分列不合并；⑤看板卡片库拖拽源@328（HTML5 drag）、⑥栅格画布 drop 落点@261（成对）；⑦交付物卡片 div[role=button]@196；⑧看板状态柱@151、⑨人员堆叠条@332（可点联动筛选，无 role/键盘=a11y 缺口待证）；⑩看板配置 span 伪 tab@365；⑪里程碑关联任务 chip@204；⑫甘特未排期行@457。
- **BACKDROP（5，环境容器，非控件，不计控件分母）**：提醒弹层@1424、移动选择/保存视图/管理视图对话框、看板编辑器弹层等 click-outside 容器。
- **循环实例规则**：`.map` 列表行控件只登记一条「数据驱动规则」，静态不逐行枚举；验收按行类型核真，不把数据行数当控件数。**条件渲染**：`&&`/三元标 COND，按分支核真。
- **排除（定义未挂载·待判死代码/待启用，F-6）**：`BatchField`(1918)、`TableToolbar`(2017)、`StatusTag`(2040)、`Progress`(2059)、`TableEmpty`(2068)、`Summary`(2509)、`DeltaBadge`(2010) 静态未发现 JSX 消费者；`ViewSwitcher` 已挂载@1026，不在此列。

**INTEGRATION+SEMANTIC 按页面族分布（契约/消费点/背景另计）：**

| 页面族 | 数 | 页面族 | 数 |
|---|---|---|---|
| V02 任务（主工作区） | 53 | F4 风险问题表单 | 13 |
| DASH 看板编辑模式 | 34 | F8 交付物表单 | 13 |
| F2 任务表单 | 23 | F7 汇报表单 | 12 |
| F5 会议表单 | 16 | F1 项目表单 | 11 |
| F6 会议行动项 | 16 | DASH-00 看板壳 | 8 |
| GLOBAL 顶栏/全局 | 15 | F3 里程碑表单 | 8 |
| V03 甘特排期 | 8 | V07 会议纪要 | 8 |
| V06 跨项目人员面板 | 7 | DASH 看板卡片（15类） | 7 |
| V08 进度汇报 | 7 | V05 风险问题 | 6 |
| V09 交付物 | 6 | NAV 左侧导航 | 4 |
| V04 里程碑 | 4 | F9 口径设置 | 3 |
| V01 项目概览 | 2 | V06 人员负载 | 2 |

> P2-6 区（CopilotPanel 溯源/不确定性标注/撤销恢复/失效行治理）在 CONTRACT-SUB 标「待刷新，不凭 mockup 填」；已存在的计划卡/整批/逐步/勾选/拒绝属现有多步计划，待 GUI 采证，不与 P2-6 混算。机器台账：`docs/design/system-ui-control-inventory-20261017.csv`（本稿专属，16 列，含 layer 分层列）。

### 3.6 环境/适配静态事实（待实测复核）
- 主题：面板不自带第二套开关；深色跟随宿主 `body[data-ds-dark-theme]`，token 走「宿主别名优先 → fallback」，浅色 fallback 在 `.pm-shell` 作用域（不得新建本地 dark 切换）。
- 断点：现存 `@media` 以 560 / 900 / 980 / 1100 为主，另有 4 处 `@container`；**1440 / 768 / 390 三档是验收目标，不是现有断点**，需按内容定义回流。
- 动效：已有 `prefers-reduced-motion` 全局降级块。
- 虚拟化：列表无窗口化/虚拟滚动，大量数据性能为待验证假设。
- 无障碍：仅局部 `aria-live/role=status/role=alert/role=log`，焦点环、菜单/抽屉焦点管理、读屏名称需实测。

## 4. 可观察标准（把「国际一流」翻译成可检查项，不编指标）

| 标准 | 可观察含义（验收时据此取证） |
|---|---|
| 一致性 | 同一语义角色（主操作/次操作/危险/选中/禁用/成功/警告/错误）在所有表面取同一 token；间距/圆角/边框/字阶来自同一尺度；不出现两套主按钮、两套次要文字色。 |
| 可发现性 | 当前位置可辨；动作入口就近放在所作用内容旁；窄窗当前标签/选中态不滚出视野；空态给下一步去向，不伪装零值。 |
| 效率 | 专家工具保持高信息密度，行/卡高度贴合内容；常用动作键盘可达；批量操作就近可用；不为装饰留白抬高卡片。 |
| 可恢复 | 错误保留已输入、给重试与撤销；取消零写；AI 草稿/副驾计划可拒绝/撤销/回退；保存后返回原上下文（视图/筛选/滚动位置）。 |
| 无障碍 | 键盘可完成关键路径、`:focus-visible` 可见、焦点落/还、Esc 关闭；正文对比 ≥4.5:1、组件/图形 ≥3:1（实测，不采信标注）；不单靠颜色传达状态；目标尺寸达标；读屏有名称/角色/状态。 |
| 性能 | 无明显布局抖动（CLS）；大量数据列表不卡顿/不塌列；慢请求有加载与禁用反馈，防重复提交。 |
| 稳定性 | 派生口径同源（统计=卡片）；过滤后详情随作用域收敛；刷新/重启状态可复现；隔离实例零污染。 |

**审美硬标准（用户认可基准）：** 任务页/dsh 主题字体为认可基准，合理多色允许；拒绝暖黄、廉价大数字卡、贴边、重复信息、窄窗错位、无意义留白（里程碑大 padding 为反例）；卡片高度贴合内容，留白围绕高价值决策而非均分。

## 5. 规范条目（NS 编号；每条给可观察验收 + 静态假设）

> 「来源方法」列只记方法归属，对应 §2.2，不复制外部原文。

### NS-1 色彩与语义 token
- 要求：一个语义角色一个单层 token；主操作统一中性（浅近黑字/深反白），不出现视图蓝 CTA 与抽屉中性 primary 并存；浅色 muted/faint 实测 ≥4.5:1，深色不回退；状态色（成功/警告/错误/选中）深浅双值且不单靠颜色。
- 可观察验收：全产品主操作按钮色值一致；抽测次要文字 computed 对比达标；状态 chip 同时带文字标签。
- 静态假设（待验证）：现状存在视图蓝 CTA vs 抽屉中性 primary 分叉；浅色次要文字对比不足（既有走查实测线索，需在新 token 下重测）。
- 来源方法：语义分层 token + 设计-代码对等；对比实测。

### NS-2 排版
- 要求：字阶（页题/区块题/正文/标签/元信息/数据/代码）克制且相邻可辨；数字 tabular-nums 对齐；长名截断处给 hover 全名/title；不通过放大所有标题解决层次。
- 可观察验收：同角色字号/字重/颜色一致；数据列等宽数字；超长项截断可获知全名。
- 静态假设（待验证）：部分信息格窄屏 ellipsis 无 title；看板超长项目名截断。
- 来源方法：视觉工艺-排版。

### NS-3 间距、圆角与容器
- 要求：内边距绑定组件、外边距分隔概念，取自小尺度；容器为结构/交互服务，不为装内容而加卡；卡片 align-start 贴合内容，禁止单行卡被 stretch 拉高。
- 可观察验收：单行卡片无内部大片留白；无贴边、无无意义空场；重复模块解剖一致。
- 静态假设（待验证）：汇报三卡等高拉伸、看板空卡大片留白（既有线索，待刷新）。
- 来源方法：视觉工艺-间距/布局。

### NS-4 组件契约（公共组件根因优先）
- 要求：每个公共组件登记 Purpose/Anatomy/Variants/States/Behavior/Semantics/Content/Responsive/Tokens/Events/Tests/Status；独立状态轴（层级/密度/内容/强调/校验/主题），杜绝布尔属性爆炸；允许组合，不做一个万能组件吞掉所有变体。
- 可观察验收：复用点全部走共享组件；分叉实例登记为「有意例外（含 owner/理由/到期）」而非无声 drift。
- 静态假设（待验证）：部分定义组件未挂载，需先判定死代码/待启用。
- 来源方法：组件契约 + 设计系统证据清单。

### NS-5 状态完整（默认/hover/focus/active/disabled/loading/empty/error/success + 开关态）
- 要求：每个可交互控件覆盖默认/hover/focus-visible/active/选中/禁用/加载/空/错误/成功；禁用与只读分开；异步提交立即禁用并给加载，防重复提交；空态诚实并给 CTA；错误贴近字段 + 可聚焦错误摘要；成功有可见且可编程的反馈。
- 可观察验收：逐单元状态矩阵（§6）无遗漏；触发慢请求可取证加载/禁用；提交中二次提交不可能。
- 静态假设（待验证）：本地数据秒开，加载/禁用/成功 toast 未触发过；视图内多数控件无 `disabled=`，禁用态覆盖缺口待验。
- 来源方法：组件状态轴 + 表单反馈/防重复提交准则。

### NS-6 表单与校验、保存返回上下文
- 要求：可见 label（禁止 placeholder 当 label）；内联错误贴近字段并用 aria-describedby 关联；必填/格式校验统一受控内联（不混用原生 required 气泡与受控错误）；取消零写、出错保留输入；保存成功 Notice 后返回原视图/筛选/滚动上下文。
- 可观察验收：每表单校验态与保存成功态可复现；刷新后回到原列表位置。
- 静态假设（待验证）：TaskForm 同时存在原生 required 与受控 repoUrl 错误，策略待统一。
- 来源方法：表单/校验/恢复准则。

### NS-7 导航与信息架构
- 要求：顶栏/导航分组/折叠/搜索/真实计数/选中态一致；视图标签切换后当前项滚入可视区并给可发现提示；菜单点外部/Esc 关闭；项目下拉同名项给 id/日期/负责人消歧副标。
- 可观察验收：390 下当前视图始终可见；键盘可达导航；下拉项可消歧。
- 静态假设（待验证）：390 标签横滚无 scrollIntoView/渐隐；同名项目无消歧。
- 来源方法：导航可发现性 + 证据清单。

### NS-8 响应式（浅/深 × 1440 / 768 / 390）
- 要求：1440 桌面高密度；768 多列按内容回流、工具条换行、身份列保留不叠印；390 表格卡片化/抽屉单列、按钮 nowrap 不折行、无外壳横向溢出（甘特时间轴横滚除外）；内容决定断点，定义何处换行/截断/折叠/滚动/变形态；200% 缩放与 320CSS px 回流不失内容。
- 可观察验收：三档 × 浅深逐视图无破版/叠印/溢出；窄窗标题列可读。
- 静态假设（待验证）：任务表 390 标题列塌缩为 0（既有 S1 线索，需在新基线重测）。
- 来源方法：数据密集响应式工艺 + 回流/目标尺寸。

### NS-9 无障碍（待验证，不声称合规）
- 要求：纯键盘完成关键路径；焦点环可见、顺序合理、无陷阱；抽屉/菜单打开焦点落入、关闭归还；拖拽有单指针替代；状态变化经 live region 宣布；名称/角色/状态可编程获取。
- 可观察验收：键盘走查 + AT 实测记录浏览器/视口/路径；自动检查只作输入。
- 静态假设（待验证）：焦点管理、读屏名称、拖拽替代未实测。
- 来源方法：WCAG 2.2 AA 基线 + 焦点/键盘准则。

### NS-10 AI 功能治理（对接 P2-6）
- 要求：区分建议/起草/推荐/决定/行动/编排；生成内容与用户/已核实内容可区分； consequential 动作前给预览/diff/影响对象；拒绝/撤销/恢复/非 AI 兜底可达；来源与不确定性可检视，不显示未校准置信分；无上下文的批准不算控制。
- 可观察验收：已存在项（计划卡/整批/逐步/勾选/拒绝，以现有多步计划验收为准）待 GUI 采证；P2-6 待实现项（来源溯源、不确定性标注、撤销/恢复、失效行治理）须落地后另取证，不得因源码/方案有名就算实装。
- 静态假设（待验证）：真实模型生成闭环未实测；P2-6 治理项未启动，当前不列入已覆盖。
- 来源方法：AI 能力契约/风险/失败矩阵 + 人-AI 工作流。

### NS-11 性能与大量数据
- 要求：无布局抖动；长列表（任务/记录）给虚拟化或分页策略；超长文本/大量日期不塌列、不溢出；慢路径给加载与取消。
- 可观察验收：构造大样本（超长名/大量任务）取证渲染与滚动。
- 静态假设（待验证）：无虚拟滚动，大数据表现未知。
- 来源方法：性能/虚拟列表准则。

### NS-12 稳定性与派生同源
- 要求：统计数字与卡片同一派生函数；过滤后右侧详情随 filtered 收敛；刷新/重启布局与筛选可复现；隔离实例零写；失败可回滚。
- 可观察验收：概览=卡片口径；空过滤不残留上一条；看板布局刷新保持。
- 静态假设（待验证）：里程碑延期两套口径、会议过滤残留（既有线索，待刷新）。
- 来源方法：可恢复/稳定性 + 系统根因。

### 5.1 可执行公共组件契约矩阵（候选 · 非最终视觉认可）

> 以下 C1–C10 把 NS-1～NS-9 落成可检查的组件契约候选；**视觉取值（色/字阶/px 间距）待 P2-2 G3 冻结后回填，本稿不锁定像素、不构成最终视觉认可**。每条约给：角色 / 解剖 / 适用状态 / 间距与响应式 / 交互 / 无障碍 / 异常恢复 / 视觉责任 / 验收证据（对应台账 control_id）。状态记号沿用 §6 图例；「待 G3」=需真实 GUI/AT 采证，自动检查只是输入。

#### C1 ProjectSwitcher 项目下拉（panel.tsx）
- **角色**：作用域切换 listbox；当前项目名 + 下拉，非表单提交。
- **解剖**：触发器（`aria-haspopup=listbox`、`aria-expanded`、ChevronDown）+ 选项列表（选中项、同名项消歧副标：id/日期/负责人）。
- **状态**：Def / Hover / Focus-visible / Active / Expanded / Selected / 空（`暂无项目`）。
- **间距/响应式**：列表内项贴合同项目名与副标两层；390 下不横向溢出，超长名截断给 title；选项不随窄窗折行错位。
- **交互**：ArrowUp/Down 移动 activeIndex、Enter 选中、Esc 关闭、点外部关闭；选中后 `onPick` 并关闭。
- **无障碍**：trigger 为原生 button；选项具备 role=option/aria-selected；只读名不含装饰；Esc/外部关闭已存在，关闭后是否显式 `focus()` 归还 trigger 属待验证假设（H-4，未登记为缺陷）。
- **异常恢复**：无项目时空态给「新建项目」去向，不伪装零值；切换失败保留原选中。
- **视觉责任**：选中与未选中用 token 区分，不单靠颜色。
- **验收证据**：CONTRACT-SUB（ProjectSwitcher 2 条）+ CONSUMER-PLACEMENT@827；键盘/AT 待 G3。

#### C2 Notice 全局反馈条（panel.tsx，role=status）
- **角色**：异步成功/错误/复制路径/长文反馈，非模态。
- **解剖**：图标 + 消息正文 + 复制路径按钮 + 关闭按钮（均已有 aria-label，待全量复核）。
- **状态**：成功 / 错误（error 变体）/ 信息 / 长文可滚动；Def / Focus-visible / Hover。
- **间距/响应式**：贴边但留安全距；390 不裁切长文，长文内部滚动而非整条溢出。
- **交互**：复制、关闭；错误条不自动消失诱导用户漏掉。
- **无障碍**：容器 `role=status`（成功/信息）与 `role=alert`（错误）分流；关闭按钮有可访问名；状态变化不抢焦点。
- **异常恢复**：错误可复制路径便于排查；关闭后内容可在记录中回看（待 G3）。
- **视觉责任**：成功/错误色取语义 token，错误同时带文字，不单靠颜色。
- **验收证据**：CONTRACT-SUB（Notice 2 条）+ CONSUMER-PLACEMENT@785；长文/变体待 G3。

#### C3 EmptyWorkspace（0 项目空态，panel.tsx@1012）
- **角色**：零数据第一屏，给下一步去向，不伪装有内容。
- **解剖**：空态说明 + 主 CTA「新建项目」+ 次 CTA「用 AI 一键生成 WBS」（AI 入口，P2-6 前按现有链路验收）。
- **状态**：Def / Focus / Hover / Active；空态本身即 Emp。
- **间距/响应式**：说明与 CTA 居中贴合，390 单列堆叠；无大片无意义留白。
- **交互**：主/次 CTA 区分层级，次 CTA 不与主 CTA 争色。
- **无障碍**：按钮原生、有可读名；键盘顺序 主→次。
- **异常恢复**：AI 生成失败回到可手动新建，不卡死。
- **视觉责任**：不做大数字卡、不加装饰渐变。
- **验收证据**：CONTRACT-SUB（EmptyWorkspace 2 条）+ PLACEMENT@1012。

#### C4 DrawerPanel（10 类抽屉，panel.tsx@1135）
- **角色**：右侧模态面板容器（遮罩/焦点落入/Esc/外部点击/关闭归还）。
- **解剖**：遮罩 scrim + 面板体 + 标题 + 关闭按钮（已有 aria-label）+ 内容插槽。
- **状态**：Open / Closed；遮罩 hover；面板内内容态由各表单自带。
- **间距/响应式**：1440 固定宽度贴合表单；390 单列、全宽；内部不贴边。
- **交互**：Esc 关闭、点遮罩关闭（Destructive/不可逆确认内除外）；关闭经 rAF 归还 openerRef 焦点（已读源码存在）。
- **无障碍**：dialog 语义/焦点陷阱待 AT 确认；打开焦点落入第一个字段，关闭归还触发元素。
- **异常恢复**：取消零写；出错保留已输入，不整盘清空。
- **视觉责任**：面板与遮罩层级用 token（surface/overlay），不靠默认阴影堆叠。
- **验收证据**：CONTRACT-SUB（DrawerPanel 2 条）+ PLACEMENT@1135；焦点陷阱/归还待 AT。

#### C5 Field + FormSection（9 表单包裹，panel.tsx）
- **角色**：字段行（label/required/hint/内联错误）与分区标题的共享包裹；消除各表单标签策略分叉。
- **解剖**：可见 label（禁止 placeholder 当 label）+ 控件 + hint + 内联错误（`aria-describedby` 关联）。
- **状态**：Def / Focus / 校验错误 / 成功（若有）/ 禁用；只读与禁用分开。
- **间距/响应式**：label 与控件成组，错误贴近字段；390 label 上控件下。
- **交互**：受控内联校验统一，不混用原生 required 气泡与受控错误。
- **无障碍**：label 可编程关联控件（for/id 或包裹）；错误文本进入 aria 描述。
- **异常恢复**：出错保留输入，错误可聚焦；提交失败不丢内容。
- **视觉责任**：必填标记、错误色取语义 token，全表单一致。
- **验收证据**：INTEGRATION 274 中的表单字段行；统一策略待 G3 逐表单核。

#### C6 ReminderCapsule（提醒胶囊 popover，panel.tsx@1502）
- **角色**：延期提醒入口 + popover（范围 seg + 完成/延期+1d/+1w）。
- **解剖**：触发胶囊 + popover（range seg、完成、+1、+7、关闭，均含按钮）。
- **状态**：Def / Open / Selected(seg) / 完成 Suc / 禁用；完成与 +1/+7 为 disabled-only（无 loading）。
- **间距/响应式**：popover 就近出现，390 不溢出；seg 可换行。
- **交互**：seg `aria-pressed`；完成/+1/+7 立即动作；关闭已有 aria-label。
- **无障碍**：popover 关闭/Esc 与焦点归还待 AT；seg 用原生 button 带 aria-pressed。
- **异常恢复**：完成后返回原列表上下文（AU-G08 RTN）。
- **视觉责任**：范围选中态与完成成功色一致于全局 token。
- **验收证据**：CONTRACT-SUB（ReminderCapsule 7 条）+ PLACEMENT@1502。

#### C7 CopilotPanel 副驾（panel.tsx@1112）
- **角色**：多步计划审批/执行面板（**已存在**：计划卡/整批/逐步/勾选/拒绝；**P2-6 待实现**：来源溯源、不确定性标注、撤销/恢复、失效行治理——源码有名≠实装）。
- **解剖**：只读诊断 / 草稿待确认 / 计划卡（勾选步骤）/ 整批执行 / 逐步执行 / 取消 / 输入 / 撤销 / ×。
- **状态**：Def / Focus / 进行中 Loading（send/整批/逐步防重复提交）/ 空 / 错误 / 成功 / 禁用。
- **间距/响应式**：计划卡步骤成组，390 内联不溢出。
- **交互**：勾选步骤、整批/逐步执行、取消；执行中按钮禁用防重。
- **无障碍**：步骤勾选 checkbox 有可读名；状态用编程可获取文本，不只高亮。
- **异常恢复**：已存在部分以现有多步计划验收；**撤销/恢复/失效行治理属 P2-6，本阶段不登记为已具备**。
- **视觉责任**：AI 生成内容与用户/已核实内容可区分（P2-6 落地后核）。
- **验收证据**：CONTRACT-SUB（CopilotPanel 16 条）+ PLACEMENT@1112；P2-6 项标待刷新。

#### C8 AiAssistant（AI 助手抽屉 D09，panel.tsx@1206）
- **角色**：能力选择 → 草稿预览/编辑 → 确认入库的人审工作流。
- **解剖**：能力卡 pickCapability / 返回能力选择 / 模板 fillTemplate / textarea / generate / 预览 / 编辑 / 重新生成 / 确认入库 / 输入。
- **状态**：Def / Focus / generate Loading（防重复）/ 空 / 错误 / 成功 / 禁用（无 Key/离线仅禁新生成，CRUD 照常）。
- **间距/响应式**：1440 双区（草稿+预览），390 堆叠。
- **交互**：生成中禁用 generate；预览→编辑→确认入库；可重新生成。
- **无障碍**：textarea 有可见 label；能力卡可读名；真实在线生成=MANUAL_PENDING，空 Key/离线=AUTO 可注入。
- **异常恢复**：生成失败保留草稿；确认前可拒绝/编辑；非 AI 手动路径可达。
- **视觉责任**：草稿（AI）与已核实内容区分，不显示未校准置信分。
- **验收证据**：CONTRACT-SUB（AiAssistant 10 条）+ PLACEMENT@1206；真实在线 MANUAL_PENDING。

#### C9 GlobalBoard / BoardBento 看板壳（BoardBento.tsx）
- **角色**：总览 overlay 看板：全局搜索/统计条/15 类卡片/编辑模式/布局 JSON 导入导出。
- **解剖**：搜索框、统计条、卡片栅格、编辑模式（卡片库抽屉+配置面板）。
- **状态**：Def / Focus / Hover / Selected / 空结果 / 空卡引导；编辑态拖拽源/落点成对。
- **间距/响应式**：1440 多列，768 回流，390 单列；卡片 align-start 贴合内容，禁单行被 stretch 拉高。
- **交互**：搜索过滤、编辑进出、卡片拖拽（HTML5，单指针替代待 G3）、配置页签。
- **无障碍**：状态柱/人员条/配置伪 tab 的 role 与键盘缺口见 §7 D-01/D-02/D-03；拖拽键盘替代待验。
- **异常恢复**：布局导入导出失败给错误、不破坏现有布局。
- **视觉责任**：拒绝空卡大片留白、廉价大数字卡、重复信息。
- **验收证据**：SEMANTIC 看板拖拽/状态柱/伪 tab + INTEGRATION DASH 34 条。

#### C10 MarkdownView / WbsTreeView（渲染复用）
- **角色**：只读渲染复用件，不承载独立交互。
- **解剖**：Markdown 渲染 / WBS 树展开折叠。
- **状态**：Def / 长文 / 空；树展开/折叠。
- **间距/响应式**：长文可读、折叠缩进一致，390 不横向溢出。
- **交互**：树展开/折叠需键盘可达（待 G3 核）。
- **无障碍**：渲染文本可读，折叠有 aria-expanded。
- **异常恢复**：渲染失败给降级文本，不留空白。
- **视觉责任**：沿用 dsh 主题字体认可基准，不另起排版。
- **验收证据**：随消费视图 INTEGRATION 行；树交互待 G3。

> 契约 Status 列（本稿口径）：C1/C2/C4/C6 现有实现待 G3 核；C7 已存在部分待采证、P2-6 部分待实现；C3/C5/C8/C9/C10 为候选契约，冻结后回填代码故事与自动测试。

## 6. 逐项走查覆盖清单（AU 单元；状态列记号见图例）

> 机器可读台账两份：① `system-ui-coverage-ledger-20261017.csv`（48 个**一级分组** AU 单元、14 列，留准备产物目录，不进仓库）；② `docs/design/system-ui-control-inventory-20261017.csv`（**控件级候选台账 348 行 = CONTRACT-SUB 46 + CONSUMER-PLACEMENT 11 + INTEGRATION 274 + SEMANTIC 12 + BACKDROP 5；原始扫描基数 RAW-BASE 291 保留为 9 契约聚合 + 8 消费点 + 274 集成**、16 列含 layer 分层，AST 展开；342 行 NOT_RUN/待证 + 6 行 BLOCKED/待GUI-AT，无 PASS）。AU×48 是族级骨架，本台账是其向下展开的候选控件位置，二者均非验收覆盖率；G3 采证后逐条核对存在性/状态，再形成正式验收分母。

**图例（每单元逐维打 P=适用待验证 / N=不适用(附理由) / U=未查(附原因)）：**
态：Def=默认 Hov=hover Foc=focus-visible Act=active Sel=选中/开关 Dis=禁用 Ld=加载 Emp=空 Err=错误/校验 Suc=成功；长文=LONG；大数据=BIG；浅/深=TH/TD；视口=1440/768/390；键盘=KB；保存返回=RTN。
> 当前静态阶段所有 P 均为「应查、未实测」；N/U 必须写理由。证据待主端按 `WALKTHROUGH-SPEC.md` 命名采证。
>
> **台账 verify_status 口径（逐行真实标注，无 PASS）：** `NOT_RUN/待证`=静态已登记、尚未执行任何实测（可静态自动查或待 G3 目视/AT）；`BLOCKED/待GUI-AT`=源码已直读核真存在静态缺口（§7 D-01～D-06），真实键盘/AT 表现被 G3 通道阻塞、待独立复验，不等于已实测失败；`MANUAL_PENDING`=仅确需真实用户凭据/在线模型链路（如 AiAssistant 真实生成），可确定性模拟的空 Key/离线/凭据错误归 AUTO，不扩大人工豁免。

### 6.1 全局框架（AU-G）
| 单元 | 源码入口 | 功能/控件 | 应查态 | 主题/视口 | KB | RTN | 不适用/未查原因 |
|---|---|---|---|---|---|---|---|
| AU-G01 项目下拉 | panel.tsx ProjectSwitcher | 列表框/搜索/同名消歧/选中 | Def,Hov,Foc,Act,Emp,Err | TH/TD ×1440/768/390 | P | N（切换非表单） | 同名消歧、作用域切换待实测 |
| AU-G02 总览看板入口 | panel.tsx 顶栏按钮 | 开关 overlay | Def,Hov,Foc,Act | TH/TD ×三档 | P | N | — |
| AU-G03 AI 助手入口 | panel.tsx 顶栏 | 开 D09 抽屉 | Def,Hov,Foc,Act,Dis(无Key) | TH/TD ×三档 | P | N | 分层：①无 Key 禁用新生成/离线仅禁生成、台账 CRUD 照常=**AUTO 可确定性模拟（空 Key/离线注入）**；②真实在线生成/真实 Key 链路=**MANUAL_PENDING（需真实凭据/在线模型，不自动验）** |
| AU-G04 设置入口 | panel.tsx 顶栏 | 开 D10 抽屉 | Def,Hov,Foc,Act | TH/TD ×三档 | P | N | — |
| AU-G05 Notice 反馈条 | panel.tsx Notice | 成功/错误/复制路径/可滚动长文 | Def,Err,Suc,LONG | TH/TD ×三档 | P | N | 长 Notice 不截断待验 |
| AU-G06 nav-rail 导航 | nav-rail.tsx | 分组/折叠/搜索/计数/选中 | Def,Hov,Foc,Act,Sel,Emp | TH/TD ×三档 | P | N | 计数真实性待核 |
| AU-G07 视图标签条 | panel.tsx pm-view-tabs | 9 tab/选中/横滚 | Def,Hov,Foc,Act,Sel | TH/TD ×390 | P | N | 当前项滚入视野待验 |
| AU-G08 提醒胶囊 | panel.tsx ReminderCapsule | popover/范围 seg/完成/延期+1d/+1w | Def,Hov,Foc,Act,Sel,Emp,Suc | TH/TD ×三档 | P | P | 完成后返回列表待验 |

### 6.2 视图（AU-V；主条目覆盖整视图，控件子条目列差异化状态）
| 单元 | 源码入口 | 功能/控件 | 应查态 | 主题/视口 | KB | RTN | 不适用/未查原因 |
|---|---|---|---|---|---|---|---|
| AU-V01 概览 | overview.tsx | 健康环/元信息/4 KPI/阶段/负载/0任务空态 | Def,Hov,Foc,Emp,Err,LONG | TH/TD ×三档 | P | N | 环色不单靠颜色待验 |
| AU-V01-a 概览操作 | overview.tsx | 编辑项目/复制链接/提醒 | Def,Hov,Foc,Act,Suc,Err | TH/TD ×1440 | P | P | 复制成功反馈待验 |
| AU-V02 任务表 | tasks.tsx | 列表/分组/折叠/行身份 | Def,Hov,Foc,Act,Emp,LONG,BIG | TH/TD ×三档 | P | P | 390 标题列、大数据待验 |
| AU-V02-a 搜索/筛选 | tasks.tsx | 搜索框/状态 chip 过滤 | Def,Foc,Emp,Err | TH/TD ×三档 | P | P | 过滤后返回位置待验 |
| AU-V02-b 命名视图菜单 | tasks.tsx | 视图 listbox/保存/重命名/删除/设默认 | Def,Hov,Foc,Act,Emp,Err,Suc | TH/TD ×1440/390 | P | P | 空名禁提交、Esc 关闭待验 |
| AU-V02-c 工具条 | tasks.tsx | 排序 select/分组开关/密度 seg/导入 dropzone/导出菜单/快照 | Def,Hov,Foc,Act,Dis,Err | TH/TD ×三档 | P | N | 导入错误、导出格式待验 |
| AU-V02-d 行内编辑 | tasks.tsx | 全选/完成开关/status select/date/progress/铅笔/grip/前置 chip | Def,Hov,Foc,Act,Sel,Dis,Suc,Err | TH/TD ×1440/390 | P | P | 行内校验、拖拽移动待验 |
| AU-V02-e 弹层 | tasks.tsx | M01 移动选择器/M02 保存视图/M03 管理视图 | Def,Foc,Act,Emp,Err,Suc | TH/TD ×1440 | P | P | 焦点落入/归还待验 |
| AU-V03 甘特 | gantt.tsx | 画布/条/依赖线/今日线/空/未排期 | Def,Hov,Foc,Act,Emp,Err,LONG,BIG | TH/TD ×三档 | P | P | 拖拽落库回读待验 |
| AU-V03-a 甘特工具条 | gantt.tsx | 日/周/月 seg/依赖线开关/关键路径图例/定位今日/新建 | Def,Hov,Foc,Act,Sel,Dis | TH/TD ×1440/390 | P | N | 粒度裁切、开关态待验 |
| AU-V04 里程碑 | milestones.tsx | 统计带/时间线节点/编辑/新建 | Def,Hov,Foc,Emp,Err,Suc | TH/TD ×三档 | P | P | 概览=卡片口径待验 |
| AU-V05 风险问题 | risk-issues.tsx | risk/issue seg/概率×影响矩阵/列表 | Def,Hov,Foc,Act,Sel,Emp,Err | TH/TD ×三档 | P | P | 矩阵色不单靠颜色待验 |
| AU-V06 人员负载 | people.tsx | 未分配置顶/堆叠条/过载标/展开明细 | Def,Hov,Foc,Act,Emp,LONG | TH/TD ×三档 | P | N | 父/子行区分待验 |
| AU-V07 会议 | meetings.tsx | 搜索/状态 seg/左列表右详情/编辑/新建 | Def,Foc,Act,Emp,Err,LONG | TH/TD ×三档 | P | P | 空过滤残留待验 |
| AU-V07-a 行动项 | meetings.tsx MeetingActions | 新建行动项/owner/status/due/关联任务/风险 | Def,Foc,Act,Emp,Err,Suc | TH/TD ×1440 | P | P | 转为任务链接待验 |
| AU-V08 汇报 | reports.tsx | 搜索/状态 seg/双栏/快照条/完成·下步·阻塞三卡/异常 | Def,Foc,Act,Emp,Err,Suc,LONG | TH/TD ×三档 | P | P | 三卡贴合内容待验 |
| AU-V09 交付物 | deliverables.tsx | 状态 chip 过滤/搜索/分组列表/概览带 | Def,Hov,Foc,Act,Emp,Err | TH/TD ×三档 | P | P | 重复 CTA 待去重核 |

### 6.3 抽屉与表单（AU-D/F；同一位置两维度）
| 单元 | 源码入口 | 功能/控件 | 应查态 | 主题/视口 | KB | RTN | 不适用/未查原因 |
|---|---|---|---|---|---|---|---|
| AU-D01/F1 新建项目 | panel.tsx ProjectForm | name/desc/repoUrl/branch | Def,Foc,Act,Err,Suc,Dis,LONG | TH/TD ×1440/390 | P | P | 格式校验、390 单列待验 |
| AU-D02/F1 编辑项目 | panel.tsx ProjectForm | 同上+删除/取消 | Def,Foc,Act,Err,Suc,Dis | TH/TD ×1440 | P | P | 删除确认门待验 |
| AU-D03/F2 任务抽屉 | panel.tsx TaskForm | 14 字段+前置多选树+objective 只读块 | Def,Foc,Act,Err,Suc,Dis,LONG,BIG | TH/TD ×1440/390 | P | P | 校验策略统一、树搜索待验 |
| AU-D04/F3 里程碑 | panel.tsx MilestoneForm | title/dueDate/status/owner/desc | Def,Foc,Act,Err,Suc | TH/TD ×1440/390 | P | P | — |
| AU-D05/F4 风险问题 | panel.tsx RiskIssueForm | type/probability/impact/due/owner/mitigation/contingency | Def,Foc,Act,Err,Suc,Sel | TH/TD ×1440/390 | P | P | 保存成功态未实写待补 |
| AU-D06/F5+F6 会议 | panel.tsx MeetingForm/MeetingActions | 会议字段+行动项子表 | Def,Foc,Act,Emp,Err,Suc,LONG | TH/TD ×1440/390 | P | P | 行动项增删待验 |
| AU-D07/F7 汇报 | panel.tsx ProgressReportForm | period/summary/completed/next/blockers/evidence | Def,Foc,Act,Err,Suc,LONG | TH/TD ×1440/390 | P | P | — |
| AU-D08/F8 交付物 | panel.tsx DeliverableForm | name/type/owner/due/status/验收标准/repo/branch | Def,Foc,Act,Err,Suc | TH/TD ×1440/390 | P | P | — |
| AU-D09 AI 助手 | panel.tsx AiAssistant | 草稿预览/编辑/确认入库/只读诊断 | Def,Foc,Act,Emp,Err,Suc,Dis,Ld | TH/TD ×1440 | P | P | 生成闭环、可区分性待验 |
| AU-D10/F9 设置 | panel.tsx SettingsPanel | 13 数值字段 3 组/min-max-step | Def,Foc,Act,Err,Suc,Dis | TH/TD ×1440/390 | P | P | 越界拦截、组间依赖(绿≥黄)待验 |
| AU-M06 恢复预览 | panel.tsx restore preview | 备份预览/预检/确认覆盖/取消 | Def,Foc,Act,Err,Suc,Dis | TH/TD ×1440 | P | P | 不可逆确认门、回滚待验 |

### 6.4 总览看板（AU-B）
| 单元 | 源码入口 | 功能/控件 | 应查态 | 主题/视口 | KB | RTN | 不适用/未查原因 |
|---|---|---|---|---|---|---|---|
| AU-B01 看板壳/搜索 | BoardBento.tsx | 全局搜索/统计条/空结果 | Def,Foc,Act,Emp,Err | TH/TD ×1440/768 | P | P | — |
| AU-B02 15 类卡片 | widgets.tsx | completionHero/milestoneDeliverable/projectScale/objectiveProgress/peopleLoad/riskMatrix/weeklyPlan/recordList/overdueSoon/kpiMetric/formulaCard/statusRing/completionTrend/textNote/divider | Def,Hov,Foc,Emp,LONG,BIG | TH/TD ×1440/768 | P | N | 空卡引导/留白、色不单靠待验 |
| AU-B03 编辑模式 | editor.tsx | 进入/退出/拖拽吸附/卡片库抽屉/配置面板 | Def,Hov,Foc,Act,Sel,Emp | TH/TD ×1440 | P | P | 卡片库与配置互斥待验 |
| AU-B04 卡片配置 | editor.tsx | scope/entity/projectScope/过滤 field-op-value/排序/density/maxItems/numberFormat/标题副标 | Def,Foc,Act,Err,Suc,Dis | TH/TD ×1440 | P | P | 布局 JSON 导入导出/刷新保持待验 |
| AU-B05 副驾面板 | panel.tsx CopilotPanel | 已存在：计划卡/整批/逐步/勾选/拒绝；P2-6 待实现：来源溯源/不确定性/撤销恢复/失效行（源码有名≠实装） | Def,Foc,Act,Emp,Err,Suc,Dis,Ld | TH/TD ×1440 | P | P | 已存在项待 GUI 采证；P2-6 项未启动不得当实装 |

### 6.5 公共组件复用点核对（AU-C；每处挂载独立成行，不单点修）
| 单元 | 挂载位置 | 核对要点 |
|---|---|---|
| AU-C1 Field/FormSection | 9 表单全部挂载点 | label/required/hint/内联错误一致；禁止 placeholder 当 label |
| AU-C4 DrawerPanel | D01–D10 | 遮罩/焦点落入/Esc/外部点击关闭/关闭归还/390 单列 |
| AU-C2 Notice | 成功/错误/备份/恢复各触发点 | 成功与错误变体、长文可滚动、role=status |
| AU-C5 状态 chip | V02/V05/V09 + 行内 | 选中/未选中/禁用/色+文字标签一致 |
| AU-C6 搜索框 | V02/V07/V08/V09/B01 | focus/清空/无结果/键盘一致 |
| AU-C7 类型 seg | V03 粒度/V05 类型/V07·V08 状态 | 选中态/换行/裁切/键盘箭头一致 |
| AU-C8 空态块 | 各视图空 + 看板空卡 | 诚实、不伪装零值、给 CTA |

## 7. 缺陷登记（三分类；静态已核真 vs 待验证假设严格分开）

> 证据等级：源码直读 = DOM/源码级（observed 源码），不等于 observed interaction；下列「已确认」指**源码已直读核真、静态可复现的缺陷**，真实键盘/AT 表现仍需 G3 采证，故台账状态标 `BLOCKED/待GUI-AT`，不冒充实测 PASS。未取得目视/实测证据的，一律进「待验证假设」，不赋 S 级、不写成已成立缺陷。生命周期仍走 `docs/testing/defect-format.md`（OPEN→FIXED→RE-VERIFIED），由开发修复、独立测试专家复验。

### 7.1 实际代码缺陷（源码直读已核真 · 静态可复现）

| 编号 | 位置（证据） | 类别/建议严重度 | 现象与最小重现 | 根因 | 修复建议（最小充分） | 自动可验标准（静态门可断言） | 台账 |
|---|---|---|---|---|---|---|---|
| D-01 | `board/widgets.tsx:151` 状态柱 `div.pm-hero-barrow`，`onClick={()=>onLink('status',st)}`，无 role/tabIndex/onKeyDown/aria-pressed | 可复现缺陷 · a11y 键盘/语义（S3） | 鼠标可点按柱体联动状态筛选；键盘 Tab 落不到该元素，读屏无按钮语义、无选中态 | 用裸 div 承担按钮职责，缺交互语义与键盘路径 | **本批最小内联修复**：换原生 `<button type="button">`，选中加 `aria-pressed`，Enter/Space 原生激活（对齐仓库现有原生按钮做法，不新抽公共组件以免视觉漂移） | 静态断言该点改为原生 button、选中态有 `aria-pressed`、无需额外 onKeyDown（原生自带） | CTL-339 BLOCKED |
| D-02 | `board/widgets.tsx:332` 人员堆叠条 `div.pm-barrow`，`onClick=onLink('assignee',display)`，无 role/tabIndex/键盘/aria-pressed | 可复现缺陷 · a11y 键盘/语义（S3，与 D-01 同类） | 鼠标点人员条按负责人筛选；键盘/AT 不可达，选中无编程态 | 同 D-01，裸 div 承担按钮职责 | **本批最小内联修复**：换原生 `<button type="button">`，选中 `aria-pressed`，可访问名用负责人显示名（可见文本或 aria-label） | 静态断言原生 button + `aria-pressed` + 非空可访问名 | CTL-340 BLOCKED |
| D-03 | `board/editor.tsx:365` 配置面板 `span` 伪 tab（数据/筛选/排序/公式/显示元素/外观），`onClick=setTab(t)`，无 role=tablist/role=tab/aria-selected/tabIndex/方向键 | 可复现缺陷 · 自定义 tab 语义/键盘（S2，影响配置面板可用性） | 鼠标点页签切换配置组；键盘无法在页签间移动，读屏不知是 tab、无选中 | 用 span 列表模拟 tab，未用 tablist/tab 模式 | 外层 `role=tablist`，页签 `role=tab`+`aria-selected`+`tabIndex`，左右方向键切换，面板 `role=tabpanel` | 静态断言存在 `role=tablist`、每个页签有 `role=tab` 与 `aria-selected`、绑定方向键 | CTL-341 BLOCKED |
| D-04 | `views/milestones.tsx:204` 关联任务 `span.ms-chip-deliv`，`onClick=onOpenTask(t)`，无 role/tabIndex/键盘 | 可复现缺陷 · 可点 chip 语义（S3） | 鼠标点 chip 打开任务；键盘/AT 不可达，chip 无按钮名 | 裸 span 承担打开动作 | **最小内联**：`role=button`、`tabIndex=0`、Enter 激活、可访问名为任务标题+code（编程名，非 title） | 断言可点元素有 `role=button`/tabIndex/键盘激活与非空编程可访问名 | CTL-342 BLOCKED |
| D-05 | `views/gantt.tsx:457` 未排期行 `div.pm-gantt-row--unscheduled`，`title=…`，`onClick=onEdit(t)`，无 role=button/tabIndex/键盘/可访问名 | 可复现缺陷 · 关键录入入口键盘缺失（S2，未排期→设起止日期的可达路径） | 鼠标点空白未排期行打开编辑；键盘 Tab 不可达，读屏不知可点（仅 `title` 悬停提示，**title 不算编程可访问名**） | 条件分支的可点行用裸 div，未提供键盘替代 | `role=button`、`tabIndex=0`、Enter/Space 触发 onEdit；**编程可访问名**用 `aria-label="打开任务 {code} 排期"` 或可见文本，不依赖 title | 断言该分支元素有 role=button/tabIndex/键盘激活/非空 aria-label 或可见文本（title 不计） | CTL-343 BLOCKED |
| D-06 | `board/editor.tsx:362` 配置关闭 `button.pm-cfg-x` 文本 `×`，`onClick=onClose`，无 `aria-label` | 可复现缺陷 · 图标按钮缺可访问名（S3） | 鼠标可关闭；读屏只读到符号「×」，无动作名 | 图标按钮漏补 aria-label | 加 `aria-label="关闭配置"`（或等价可见名） | 静态断言图标/符号按钮具备非空 `aria-label` 或可见文本 | CTL-223 BLOCKED |

**修复批次口径（独立审查收口）：** 本批 D-01～D-06 走**最小内联修复**（原生 button / role=button / 完整 tablist 模式 / aria-label），**本批不新抽公共 `Clickable` 组件**，避免引入新抽象造成视觉漂移；D-01/D-02 对齐仓库现有原生 button + `aria-pressed` 做法。「裸可点件缺语义+键盘」的公共根因收敛（统一可点件）登记为后续机会，待本批内联修复稳定后再评估，不在 P2-6 合并前做。D-03 属自定义 tab 模式缺失，D-06 属图标按钮可访问名补全。真实修复后的键盘/AT 表现由 G3 独立复验；D 类修复排在 P2-6 正式包之后合并，本稿不改产品代码。

### 7.2 视觉一致性偏差（System drift · 待实测，未登记为已确认缺陷）
- H-1（假设）视图蓝 CTA 与抽屉中性 primary 疑似分叉（NS-1）；需在新 token 下抽测 computed 色值，确认同角色是否取不同 token 后才登记 drift，**当前仅线索，不下结论**。
- H-2（假设）图标/符号按钮 `aria-label` 全量复核：已核真已有名称（Notice 关闭@1993、DrawerPanel scrim@2663/关闭@2667、ReminderCapsule 关闭@1434）。已跑静态 AST 扫描（`artifacts/scan_h2_icons.js` → `h2-icons.json`）得到**候选上限 39 处**「无 aria-label/aria-labelledby 且无可见文本」的按钮（panel.tsx 20、tasks.tsx 6、editor.tsx 2、widgets.tsx 2、nav-rail 2，余各 1）；该数含动态文本/带可见名触发按钮的误报（静态不识表达式文本），**只是待逐条核的候选，不是缺陷计数**，逐条剔除误报 + 读屏核后才决定是否补 aria-label，本阶段不登记为缺陷。
- H-3（假设）看板 HTML5 拖拽源@328/落点@261 的单指针替代、甘特 move/resize 的 inflight 预览与落点高亮未实测（甘特已有 ←/→、Shift+←/→ 键盘路径，待 AT 确认完整）。
- H-4（假设）ProjectSwitcher/ViewSwitcher 关闭后未显式 `focus()` 归还 trigger；Esc/外部关闭已存在，焦点落点待实测。
- H-5（假设）加载/禁用/成功 toast、慢请求防重、大量数据、深色对比、768 回流均未实测（NS-5/NS-8/NS-11）。

### 7.3 主观机会（Opportunity · 无已观察缺陷，不赋 S 级）
- O-1 390 视图标签横滚后当前项 `scrollIntoView` 与渐隐提示（NS-7）。
- O-2 项目下拉同名项 id/日期/负责人消歧副标（NS-7）。
- O-3 各空态统一给下一步 CTA、不伪装零值（NS-5）。
- O-4 汇报三卡/看板空卡改为 align-start 贴合内容、去无意义留白（NS-3，里程碑大 padding 为反例）。
- 每条机会须先定义成功度量，经产品确认后再排期，不与缺陷混排。

> 证据等级 observed interaction > measured > DOM/源码/token > 截图 > 二手；未取得目视证据保持 BLOCKED/NOT_RUN。

## 8. 设计责任 / 实现 / 独立验收分离
- **规范所有者（设计/PM）**：维护本规范与组件契约，裁决语义与例外，不直接改产品代码。
- **实现（现有开发，唯一改产品代码者）**：按规范迁移，提交绑定 HEAD SHA + 工作树指纹，附改动文件。
- **独立验收（测试专家，docs/testing）**：给 PASS/FAIL/BLOCKED/MANUAL_PENDING；**失败阻断**，自动静态门（G1/G2/G4）通过不替代 G3 真实目视；修复后受影响项必须复测。
- G3 BLOCKED 期间不推进 P2-6、不填 PASS；自动检查只是输入，目视不可由 DOM/计算色值/mockup 标注代替。

## 9. 最小文件级补齐方案（仅建议，本稿不改任何共享文件）
| # | 建议新增/扩展（后续实施） | 解决 | 归属 |
|---|---|---|---|
| F-1 | 新增 `.github/pull_request_template.md`（现仅有 workflows，无 PR 模板）：含视觉/焦点/对比/状态/无障碍勾选项与自测证据位 | 让规范进入提交门禁 | 开发+设计 |
| F-2 | 新增 `docs/design/component-contracts/`：每公共组件一份契约（§NS-4 字段），未来再接组件实验台/故事 | 组件状态可执行、消除分叉 | 设计 |
| F-3 | 扩展 `scripts/verify-gui-contract.mjs`：从「钩子存在」增到状态/焦点/禁用/对比度/主题静态断言（仍不替代 G3） | 自动门前移 | 开发 |
| F-4 | P2-2 冻结后固化 `docs/design/visual-baseline.md`：以认可任务页/dsh 字体为基准的色/字/间距参照 | 单一对照源 | 设计 |
| F-5 | 本清单冻结后并入独立测试批次矩阵，分 AUTO/GUI/MANUAL_PENDING，沿用 p2-batch-test-plan 分层。**R6 判定**：可确定性模拟的凭据错误/空 Key/离线态=AUTO（注入空 Key、断网，禁新生成而 CRUD 照常），不标 MANUAL_PENDING；仅确需真实用户凭据/在线模型链路才留 MANUAL_PENDING，不扩大人工豁免 | 逐项可验收、人工面最小 | 测试专家 |
| F-6 | 盘点标注 panel.tsx 未挂载组件（BatchField 1918/TableToolbar 2017/StatusTag 2040/Progress 2059/TableEmpty 2068/Summary 2509/DeltaBadge 2010）为死代码或待启用；ViewSwitcher@1026 已挂载不列入 | 消除假象、不误排 | 开发 |

### 9.1 F-1 PR 模板建议内容（后续新增 `.github/pull_request_template.md`，本稿不改）

> 仅建议文本；开发落盘时以仓库现有 workflow 为准。目标：把 NS-1～NS-9 勾选项与自测证据位变成提交门禁，自动门不替代 G3 目视。

```markdown
## 变更摘要
- 关联：<issue / 缺陷编号 T-DEF-NNN 或 NS 条目 NS-x>
- 类型：[ ] 视觉兼容修复 [ ] 行为修复 [ ] 新增 token/变体 [ ] 弃用 [ ] 破坏性变更

## 规范对照（逐项勾选；未适用写 N/A + 理由）
- [ ] 语义 token：同角色（主/次/危险/选中/禁用/成功/警告）取同一 token，无裸 hex
- [ ] 状态完整：默认/hover/focus-visible/active/选中/禁用/加载/空/错误/成功（适用项）
- [ ] 交互：原生元素优先；自定义件有 role/tabIndex/键盘(Enter/Space/方向键)/可访问名
- [ ] 表单：可见 label、内联错误贴近字段+aria-describedby、取消零写、出错保留输入
- [ ] 响应式：1440/768/390 与浅/深无破版/叠印/溢出（附三档截图或说明 N/A）
- [ ] 无障碍：键盘可完成、焦点环可见、打开落入/关闭归还、不单靠颜色
- [ ] 异常恢复：失败保留输入/给重试/可撤销；异步提交立即禁用防重复
- [ ] 复用：走公共组件/契约；分叉已登记为「有意例外(owner/理由/到期)」

## 自测证据（自动门结果 + 人工目视位）
- 静态/自动：<命令与结果，例 verify-gui-contract / 单测>
- 目视：<G3 采证编号或截图路径>；BLOCKED/MANUAL_PENDING 项已注明原因
- 回归：受影响 AU/控件 ID：<CTL-xxx / AU-xx>

## 非目标 / 已知限制
-
```

### 9.2 F-2 组件契约示例建议（后续新增 `docs/design/component-contracts/<Component>.md`，本稿不改）

> 一个公共组件一份；字段对齐 §5.1 与组件契约 schema。下列为 C1 ProjectSwitcher 的样例骨架（取值待 G3 冻结回填）。

```markdown
# 契约：ProjectSwitcher（C1）
- Status: candidate（待 G3 / 待冻结）
- Purpose: 切换当前项目作用域的 listbox；非表单提交。
- Anatomy: trigger(aria-haspopup=listbox, aria-expanded, ChevronDown) + option 列表(选中/同名消歧副标)。
- Variants: 默认 / 空(暂无项目)；独立轴：层级=主入口，密度=紧凑。
- States: Def, Hover, Focus-visible, Active, Expanded, Selected, Empty。
- Behavior: ArrowUp/Down 移动 activeIndex；Enter 选中；Esc/点外部关闭；选中 onPick 后关闭。
- Semantics: trigger=button；列表=listbox，选项=option+aria-selected；选中 aria-selected。
- Content: 当前项目名；同名项副标 id/日期/负责人；超长名截断+title。
- Responsive: 390 不横向溢出；选项两层不折行错位。
- Tokens: 选中/未选中/hover/focus 全部引用语义 token，无裸 hex。
- Events: onPick(id)；关闭后焦点归还 trigger。
- Tests: 渲染(空/选中)、键盘(箭头/Enter/Esc)、AT 名称角色、三档视口；自动=输入，AT 实测另记。
- Consumers: panel.tsx@827（逐处集成另在台账 CONSUMER-PLACEMENT 登记）。
```

> 批次口径：本批 D-01～D-06 走最小内联原生修复，不在契约阶段新抽公共组件；上表为冻结后的契约登记样例，不要求本批新建组件。

### 9.3 F-3 静态检查建议（后续扩展 `scripts/verify-gui-contract.mjs`，本稿不改）

> 从「钩子存在」前移到可断言的语义/键盘/名称规则；仍只作自动输入，不替代 G3 目视与 AT。建议新增以下可断言规则（AST 遍历 JSX，非 grep 词频）：

1. **图标/符号按钮必须有编程可访问名**：`<button>` 内仅符号/图标（`×`/`+`/Chevron 等）时，断言存在非空 `aria-label` 或可见文本；`title`/tooltip 不计入可访问名（对应 D-05/D-06）。
2. **可点裸元素优先原生 button，否则补语义+键盘**：带 `onClick` 的 `div/span/li`，优先改为原生 `<button>`（D-01/D-02 对齐仓库原生 button + `aria-pressed`）；无法改原生时断言 `role=button`、`tabIndex=0`、`onKeyDown` 含 Enter/Space；缺失即报（对应 D-01/D-02/D-04/D-05）。
3. **自定义 tab 模式完整**：出现页签切换 `setTab` 的容器，断言外层 `role=tablist`、页签 `role=tab`+`aria-selected`、面板 `role=tabpanel`、方向键绑定（对应 D-03）。
4. **选中态可编程**：可点筛选/seg 选中时断言 `aria-pressed` 或 `aria-selected`，不靠 class alone。
5. **焦点归还（可静态提示）**：DrawerPanel/菜单关闭路径存在 openerRef 记录与 rAF focus 归还；缺失只报「待人工核」，不直接 FAIL。
6. **防重复提交**：异步 `generate/send/整批/逐步` 按钮在 pending 时断言 `disabled`，避免二次提交。
> 规则命中只产出清单与定位（file:line），严重度由独立测试专家判定；不得用静态断言替代对比度实测、键盘走查与读屏。

## 10. 冻结前置与刷新条件
1. P2-2：自动/静态已 PASS（164 例、73 verify）；剩余仅 G3 真实 GUI 目视门待主执行端采证。
2. P2-6 AI 溯源治理落地并独立验收；AI 相关单元（AU-D09/B05）才可取消待验证。
3. 具备真实浏览器通道后完成 G3：浅/深 × 1440/768/390 逐单元采证，替换本稿静态假设；G3 未过不推进 P2-6、不填 PASS。
4. 任一前置变化（token 改名、组件增删、视图调整）→ 本稿分母与 AU 编号回退「待刷新」，重盘点后再冻结。

## 11. 未覆盖 / 待验证（静态阶段明确留白）
- 真实模型生成闭环（AU-D09）、副驾已存在多步计划的 GUI 采证（AU-B05 已存在部分）——需一次真实任务序列；P2-6 溯源/撤销恢复属未启动项，不在本阶段待验证清单内冒充实测。
- 键盘顺序/焦点环/读屏名称/拖拽单指针替代（NS-9）——需键盘+AT 实测。
- 加载/禁用/成功 toast、慢请求（NS-5）——需人为制造慢路径。
- 大量数据/超长文本渲染（NS-11）——需构造大样本。
- 看板布局刷新保持、项目切换后数据作用域（NS-12）——需回读验证。
- 768 档现存无对应断点，全部为目标待验；深色依赖宿主主题，本地无独立调色板。
- **控件级静态清单缺口（348 行：342 NOT_RUN + 6 BLOCKED，无 PASS）：** ①循环列表行控件只登记规则行，未逐数据行展开，运行实例数待 G3 实测；②图标按钮可访问名称全量待读屏核（D-06 已核真配置×按钮缺 aria-label，其余进 H-2 假设）；③select 选项语义/分组、下拉展开与选中态未实测；④已源码核真并登记 §7：D-01 状态柱@151、D-02 人员条@332、D-03 配置伪 tab@365、D-04 里程碑 chip@204、D-05 未排期行@457、D-06 配置关闭×@362，均待 AT/键盘复验；仍为假设未登记：甘特平移/resize 单指针替代、看板 HTML5 拖拽源/落点键盘替代、落点高亮/inflight 预览（H-3）；⑤未挂载定义 BatchField(1918)/TableToolbar(2017)/StatusTag(2040)/Progress(2059)/TableEmpty(2068)/Summary(2509)/DeltaBadge(2010) 已排除出分母，待确认死代码或待启用；⑥AST 只采静态 JSX，动态条件下才出现的控件（如菜单展开项、确认对话框分支）须运行时补登。

**已澄清、不再列待产品确认：** 完成进度口径——行内完成开关写路径已归一化（`tasks.tsx` 完成→`status=done + progress=100`，重开→`todo + 0`）；客观清单进度由 `progress-derivation.ts` 纯函数派生，manual/objective 双轨为有意设计，旧「完成非 100 是否产品预期」疑点已随上一批修复并经用户确认，不再作为未决项。

## 12. 盘点原始证据（可复核）
- 主题机制：`body[data-ds-dark-theme]`，token 宿主别名优先→fallback，`.pm-shell` 作用域浅色 fallback。
- 断点：`@media` 560/900/980/1100；`@container` 4 处（panel.css）。
- 动效：`prefers-reduced-motion` 全局降级块已存在。
- 无虚拟滚动/窗口化；视图内 `disabled=` 极少（tasks 17、risk 2，其余 0），禁用态覆盖缺口。
- 样式规模：panel.css 2262 行 + 9 视图 css 共约 2550 行。
- 控件清单方法：包内 TypeScript AST 遍历 JSX（非 grep 词频），收录原生 button/select/input/textarea、命名公共组件消费点，另按 onClick/onKeyDown/role/pointer/drag 逐类核真非原生语义点（甘特点击/平移/resize 分列、看板拖拽源/落点成对）；契约内部拆为契约子条目并按真实代码裁剪状态/焦点、消费点独立编号、循环只登记规则、背景容器单列不计控件；明细见 `docs/design/system-ui-control-inventory-20261017.csv`（348 行分层；342 NOT_RUN/待证 + 6 BLOCKED/待GUI-AT，无 PASS）。
- 既有证据存量：`docs/verification/full-regression-20261017/` 91 张截图 + 报告（S1×1/S2×5/S3×8/Opportunity×5，待新基线刷新，不直接复用为结论）。

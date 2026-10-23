<!--
Impeccable 整站 UI 优化 · 独立验收矩阵（开发前/改前冻结门）。
独立测试专家所有，ADL-045 / ADL-047 / AGENTS 6A / docs/external-skills.md。
其他角色（产品 PM / 开发 / Impeccable engine）：只读引用，不得改本矩阵任何用例、步骤、断言与判定。
engine 在独立安全审查放行前 NOT RUN；本矩阵在 engine 未动一行实现前冻结。
改前全部用例 = NOT_RUN；PASS/FAIL/BLOCKED/MANUAL_PENDING 只能由测试专家真实执行后回填，不预设人工豁免。
本文件冻结"UI 优化不得破坏什么 / 必须满足什么"的验收口径，不授权任何实现。
-->
# Impeccable 整站 UI 优化 · 验收矩阵（Impeccable UI Acceptance，改前冻结）

> 是什么：在 **worktree `ui-impeccable` @ `5fdb2d7`（= 正式 v0.7.4 基线）** 之上，对「既有 PM 工作台整站 UI 优化」的**改前冻结**验收门。被测对象是 `packages/dsh-pm-tool/src/client/panel.tsx`（~4000 行单文件 client）+ `panel.css`（~47KB）渲染层；**不触及 `src/core/` 业务纯函数、schema、存储、命令层**。
> 给谁：Impeccable（critique/audit/polish/layout/typeset/colorize/quieter/harden/onboard/animate/clarify/adapt/optimize 等**仅 Operate 参考动词**）照此产出优化；有 GUI 执行能力的主端按本文采集 before/after 原始证据；**PASS/FAIL 只由测试专家审证后给出**。
> 风格授权（用户已授权自主定调，用户睡觉不提问）：**克制中文工程台账**——既有 app 优化，**不是营销站换皮**。Operate 模式优先：scanability、一致、原生预期、真实使用场景压倒表达；品牌只活在精确细节里。

> **vendor 安全前置（红线）**：Impeccable engine 二进制 `.impeccable/bin/darwin-arm64/impeccable-darwin-arm64`（sha256 `abbd69d5…`）的可执行权限**已经独立安全审查放行、由安装者实施**（launcher 保持 644 / native 引擎 755），manifest 由安装者同步——此为授权状态，**非未知 drift**。仍守的红线：**不得经 `vendor/agent-skills/impeccable/skill/scripts/impeccable` launcher 启动**（其末行会自动下载到 `~/.impeccable` 并联网，违反"用户睡觉不提问/离线"约束）；engine 只能以审查放行后的 project-only 方式（`IMPECCABLE_HOME` 指向 worktree、`DO_NOT_TRACK=1`）调用。禁用动词：`concept-seed / new-work / live / generate / serve-question / init(交互式联网) / shape / craft`。
>
> **上下文生成授权**：按 `init`/`document` 参考文档工作流**离线、非交互**生成 `PRODUCT.md`/`DESIGN.md` 上下文是**允许且正在进行**的——此前"禁 init"指的是**交互式提问/联网的 init**（避免叫醒用户），**不是禁止写项目上下文**。本矩阵冻结不依赖 engine 是否运行；engine 放行前本矩阵自身即为可执行的验收清单。

## 0. 冻结口径（以此为准）

1. **零业务面改动优先**：本次是**视图层/样式层**优化。**不新增表/列、不改任何 `*RecordSchema`、不升 domain compatibleVersions、不动 `core/storage.ts` 单写队列、不改七类实体真源**。任何"为了好看而改业务字段/业务语义"的提案一律 FAIL。
2. **真源唯一不动**：任务树 CRUD、`repoUrl/branch`、`assignee`、`predecessorIds` 依赖、进度派生（M1–M5 单一真源）的**数据语义与写路径必须与 `5fdb2d7` 逐字节同行为**；UI 只能换"怎么显示"，不能换"存什么/怎么算"。
3. **tokens 全站同一份**：所有色值/字阶/间距/圆角必须落在既有 token 链上——宿主语义变量 `--dsw-alias-*`（宿主 dsh 拥有调色板与字体，含 live 主题覆盖）经 `.pm-shell` 别名到 `--pm-*`。**「无硬编码 hex」仅约束组件层**（`panel.tsx` 内联 style 与组件内 CSS）：组件不得就地写死 hex/rgb/hsl 取色。**允许且鼓励**：在**统一局部语义 token 定义层**（`.pm-shell` 别名块 / `--pm-*` 定义处）以 OKLCH / `var()` 混色等方式定义品牌色与状态色——这是设计系统的正经做法，**不算违规**，不得误禁。**禁止绕开 `--pm-*` 在组件层直接读 `--dsw-alias-*`**（要改就改别名层，不改组件）。
4. **三条视觉禁令（硬断言，出现即 FAIL）**：
   - **无嵌套卡片**：不在已卡片/面板/抽屉内再套同款面板卡片（card-in-card）；面板内分组用分隔线/小标题/留白，不新增一层带边框+阴影的容器。
   - **无蓝紫渐变**：不引入 `linear-gradient/radial-gradient` 蓝→紫/紫→粉/品牌色→品牌色的装饰渐变；强调色为纯色 `--pm-accent`。允许的例外仅限：宿主既有 token 自身定义的渐变（不得在本 app 内新增）。
   - **无模板大数字**：不做营销式 hero 大数字块（巨型 display 字 + 巨大数值 + 副标题的模板 stat tile）。概览统计沿用既有工程台账式 `Summary`（label/value/note 紧凑行），value 走数据字阶而非展示字阶。
5. **分页面不同任务布局，全站同一 tokens**：9 个视图按各自任务（树表/时间轴/人员负载/汇报等）允许**不同的信息密度与排布**，但按钮形状、表单控件词表、图标风格、状态色、间距刻度全站一致；"保存"按钮在两处长得不同即一处错。
6. **主题**：浅/深由宿主切换（`--dsw-alias-*` 翻转）。本 app **不自造 dark class、不自造 media 主题**。两种主题下所有视图/抽屉可读、对比度达标、不依赖单一亮度假设。
7. **实际可用宽度 ≠ 外层 viewport**：`.pm-shell` 设了 `container-type: inline-size`，布局走 `@container`（断点 760px / 540px）而非 viewport media。三档必须采集的是**面板容器的实际 inline content-width**（运行时量取并记录），外层 viewport 固定为 **1440 / 768 / 390**。不得假设外层宽 = 面板可用宽。
8. **真 GUI 是硬门槛**：离线纯函数 / `pnpm build`=0 / HTTP 200 / detector 静态报告**都不算网页实测 PASS**。真实 Chrome（隔离实例）所见即所证；engine/detector 的输出**不得替代**真实 GUI 截图与交互证据。
9. **before/after 同 fixture 同 viewport 同 theme**：所有视觉对比必须基于**同一隔离 `DSH_HOME` fixture、同一外层 viewport、同一主题、同一时刻的 before 截图**与 after 截图配对；证据命名与目录见 §7。无 before 配对的 after 结论不受理。
10. **不固定武断品牌分数**：本矩阵**不采用** audit.md 的 0–4 维度打分 / 20 分制 / 评级带。视觉只做**确定性可执行断言**（pass/fail）与 before/after 原始证据；品牌"好不好看"不打武断分、不设主观阈值。
11. **隔离与零污染**：一切 GUI 证据来自隔离实例（独立 `DSH_HOME` + 独立端口 + 独立备份目录），**不碰 3080 正式数据**；零写以业务 JSON 前后 sha256/mtime 对比为准。正式 `data/ backups/ exports/` before==after。
12. **上游 excluded**：本 engagement **不改**正式 `main` 分支 checkout（v0.7.4）、不改 `~/Projects/dsh-pm/deepseek-harness`、不写 `$HOME`/全局/IDE/壳配置、不装 hook、不留 telemetry（`DO_NOT_TRACK=1` / `IMPECCABLE_NO_TELEMETRY=1`）。本矩阵与索引的改动**留在 `ui-impeccable` worktree、不提交**。
13. **无认证页面不伪造 PASS**：本应用为本地离线工具，无登录/认证页。凡未被真实 GUI 实际触达的页面/抽屉/状态，一律 NOT_RUN；**不得因"代码里存在该组件"就判 PASS**。用户睡觉期间不弹窗、不打断、不请求人工。

## 1. 分层与判定图例（与 ADL-045 严格一致）

- **AUTO**：离线可判定——静态 grep（无 hex / 无 gradient / 无嵌套 card class）、token 链完整性、build=0、组件存在性。脚本/静态证据绿即可推进；**FAIL 仍阻塞**。
- **INT**：真实起隔离实例，写一条再读回，验证 UI 优化未改变数据写路径与重启读回。
- **GUI**：真实浏览器实测硬门槛；记录 outer viewport、实测容器 inline-width、主题、交互后状态。
- **状态**：`PASS / FAIL / BLOCKED / NOT_RUN`。改前本矩阵**全部 NOT_RUN**。
- 本矩阵**不预设 MANUAL_PENDING 豁免**：凡需人配合者先列 NOT_RUN 并入 GUI 执行包，确属只能用户本人验者，执行时再如实标 BLOCKED 并写原因（BLOCKED ≠ 通过）。
- `FAIL / BLOCKED / NOT_RUN` ≠ 通过；结论绑定 `testedCommit` 与证据路径；新提交使受影响项过期须重测后再引用。

## 2. 覆盖清单（coverage checklist，冻结）

### 2.1 九视图（tabs，`panel.tsx` L643–669 `changeView`）

| # | view id | 组件锚点 | 任务语义 |
|---|---|---|---|
| V1 | `tasks` | `<TaskTable>`/`<TaskGroup>`/`<TaskRow>`（L1505/1828/1907） | 任务树 CRUD、缩进、勾选、行移动 |
| V2 | `milestones` | `<MilestoneTable>`（L2045） | 里程碑列表 |
| V3 | `risk-issues` | `<RiskIssueTable>`（L2109） | 风险/问题列表 |
| V4 | `meetings` | `<MeetingTable>`（L2205）+ `<MeetingActions>`（L3837） | 会议纪要 + 行动项转任务 |
| V5 | `reports` | `<ProgressReportTable>`（L2288）+ `<DeltaBadge>`（L2281） | 进度汇报 + 趋势对比徽标 |
| V6 | `deliverables` | `<DeliverableTable>`（L2346） | 交付物列表 |
| V7 | `overview` | `<Overview>`（L2461）+ `<Summary>`（L2994） | 概览统计（工程台账式，非 hero 大数字） |
| V8 | `gantt` | `<GanttView>`（L2768） | 甘特排期、拖拽、依赖线 |
| V9 | `people` | `<PeopleView>`（L903） | 人员负载、未分配置顶、逾期/临期 |

### 2.2 十抽屉（`drawer.kind`，`drawerTitle` L1079–1091）+ 表单

| # | drawer kind | 标题 | 表单组件 |
|---|---|---|---|
| D1 | `project-create` | 新建项目 | `<ProjectForm>`（L3204） |
| D2 | `project-edit` | 编辑项目 | `<ProjectForm>`（L3204） |
| D3 | `task` | 新增/编辑任务 | `<TaskForm>`（L3330） |
| D4 | `milestone` | 新增/编辑里程碑 | `<MilestoneForm>`（L3548） |
| D5 | `risk-issue` | 新增/编辑风险或问题 | `<RiskIssueForm>`（L3640） |
| D6 | `meeting` | 新增/编辑会议纪要 | `<MeetingForm>`（L3724） |
| D7 | `report` | 新增/生成进度汇报 | `<ProgressReportForm>`（L3937） |
| D8 | `deliverable` | 新增/编辑交付物 | `<DeliverableForm>`（L4025） |
| D9 | `ai` | AI 助手 | `<AiAssistant>`（L1098） |
| D10 | `copilot` | AI 项目副驾 | `<CopilotPanel>`（L2575） |

抽屉容器：`<DrawerPanel>`（L3150，含 `Field` L3186）。

### 2.3 导航 / 弹层 / 模态

| # | 元素 | 锚点 |
|---|---|---|
| N1 | 视图 tab 行（9 tab + 计数徽标） | `<ViewTab>`（L1426） |
| N2 | 项目条（项目切换/事实） | `<ProjectBar>`（L1384） |
| N3 | 顶栏动作（AI 助手 / AI 副驾 / 更多） | L480–525 |
| N4 | 提醒条 | `<ReminderStrip>`（L810） |
| N5 | 任务移动选择模态 | `<MovePickerModal>`（L1445） |
| N6 | 总览看板模态 | `<GlobalBoard>`（L3049） |
| N7 | 「更多」下拉（备份/恢复/导出） | `topMenuOpen`（L513–535） |
| N8 | 恢复确认内联面板 | `restorePreview`（L424–441） |
| N9 | 批量操作条 | `<BatchField>`（L1293）/`.pm-batch-bar` |

### 2.4 状态态（empty / loading / error / success）

| # | 状态 | 锚点 |
|---|---|---|
| S1 | 空工作区 | `<EmptyWorkspace>`（L1372） |
| S2 | 表格空态 | `<TableEmpty>`（L2457） |
| S3 | 人员空态（无匹配负责人） | PeopleView L1076–1078 |
| S4 | 通知/横幅（成功/失败） | `<Notice>`（L1353，`role=status`，`.pm-notice--error`） |
| S5 | 加载中（busy / AI loading / 副驾 loading） | `busy`、`AiAssistant`、`CopilotPanel` |
| S6 | 错误态（恢复失败 / AI 失败 / 服务端错） | Notice error 变体 + 内联错误 |
| S7 | 甘特拖拽提示 | `<p class="pm-gantt-hint" role=status aria-live=polite>`（L2990） |

### 2.5 矩阵维度交叉

- **主题**：light、dark（宿主切换）各一份。
- **外层 viewport**：1440、768、390（每档记录实测 `.pm-shell` container inline-width）。
- **a11y 轴**：键盘可达 / focus 可见 / 标签可读 / 对比度 / `prefers-reduced-motion`。
- 完整网格 = 9 视图 × 2 主题 × 3 宽度（54 张 before/after 配对基线）+ 10 抽屉（每抽屉 ≥1 宽 × 2 主题）+ N5–N9 弹层 + S1–S7 状态。

## 3. 全局 / token / 视觉禁令（UIG）

| ID | 可执行断言 | 方法 | 状态 |
|---|---|---|---|
| UIG-01 | **组件层**样式取值只经 `--pm-*` 别名；`panel.tsx` 内联 style 与组件 CSS 中**零硬编码 hex/rgb/hsl 取色**（grep `#[0-9a-fA-F]{3,6}\|rgb(\|rgba(\|hsl(` 于 src/client；命中即 FAIL 的判定**排除统一局部语义 token 定义层**——即 `.pm-shell` 别名块内以 OKLCH/`var()` 混色定义品牌/状态色的正经 token 定义，以及注释；不得把设计系统的 token 定义误判为违规） | AUTO grep | PASS |
| UIG-02 | 不新增 `linear-gradient(/radial-gradient(/conic-gradient(` 蓝紫系装饰渐变（grep 命中新增即 FAIL） | AUTO grep | PASS |
| UIG-03 | 不出现 card-in-card：抽屉/面板内不新增带边框+阴影的嵌套卡片容器；分组改用分隔线/小标题/留白 | GUI 逐视图查 | PASS |
| UIG-04 | 概览统计为工程台账式紧凑 `Summary`，无营销 hero 巨大 display 数字块；数值字阶属于数据字阶而非展示字阶 | GUI | PASS |
| UIG-05 | 全站按钮形状、表单控件（input/select/textarea）、图标风格、状态色一致；同语义按钮在任意视图/抽屉形状一致 | GUI 逐视图比对 | PASS |
| UIG-06 | 所有 `--pm-*` 别名在浅/深主题下均解析到宿主 token，无别名悬空（某主题下计算值 undefined/transparent） | GUI 两主题量 computed | PASS |
| UIG-07 | 不绕开别名层直接在组件里读 `--dsw-alias-*`（grep src/client 组件层 `dsw-alias` 命中即 FAIL，别名层 `.pm-shell` 除外） | AUTO grep | PASS |
| UIG-08 | 字阶走固定 rem/px 刻度（1.125–1.2 间比），不为 product UI 引入 fluid clamp() 标题 | AUTO css 检查 | PASS |

## 4. 九视图逐视图验收（UIV）

> 每视图在 2 主题 × 3 宽度下各取 before/after 配对截图；下列为该视图的**可执行**行为/布局断言。

| ID | 视图 | 可执行断言 | 方法 | 状态 |
|---|---|---|---|---|
| UIV-01 | V1 tasks | 任务树缩进层级（WBS code 缩进）保留；checkbox↔正文间距 4–8px；整行可点开抽屉；父行 max-height 内滚动；390 实测容器宽下不横向溢出 | GUI | PASS |
| UIV-02 | V1 tasks | 行移动 j/k 不破坏 active 高亮；Space 门控焦点行；输入框聚焦时不劫持全局热键 | GUI | PASS |
| UIV-03 | V2 milestones | 里程碑列可读、目标日期/状态标签在 390 不截断/不溢出 | GUI | PASS |
| UIV-04 | V3 risk-issues | 风险等级/状态语义色正确（warning/error），不只靠颜色区分（附文字/图标） | GUI | PASS |
| UIV-05 | V4 meetings | 会议列表 + 行动项区可读；「转为任务」文字入口可见；MeetingActions 转任务链路不静默 | GUI | PASS |
| UIV-06 | V5 reports | `DeltaBadge` 正负零三态（正/负/持平 0）有文字箭头而非仅颜色；相邻快照确定 diff | GUI | PASS |
| UIV-07 | V6 deliverables | 交付物列表 + 可选 repoUrl/branch 字段可读不溢出 | GUI | PASS |
| UIV-08 | V7 overview | 概览各 `Summary` 行对齐网格、间距一致；无 hero 大数字；2 列网格在 ≤760 容器宽正确堆叠 | GUI | PASS |
| UIV-09 | V8 gantt | 甘特条/依赖线/今日线/横滚对齐在两主题可读；条可点；窄条外置标签不外溢 | GUI | PASS |
| UIV-10 | V9 people | 人员卡片、未分配置顶、逾期/临期（7 天边界）排序可读；「没有匹配负责人」空态文案存在 | GUI | PASS |
| UIV-11 | 全部 | 三档宽度下无横向滚动条溢出（外层 390 时面板容器宽实测记录，内容不超出容器） | GUI 量宽 | FAIL |
| UIV-12 | 全部 | 两主题下文字/背景对比度不依赖单一亮度假设（正文 ≥4.5:1，大文本 ≥3:1，抽样关键路径） | GUI 量对比度 | FAIL |

## 5. 十抽屉 + 表单（UID）

| ID | 抽屉 | 可执行断言 | 方法 | 状态 |
|---|---|---|---|---|
| UID-01 | D1/D2 project | 项目表单字段、required 标记、错误文案（非仅红色）可见；`repoUrl/branch` 格式校验沿用既有 | GUI | PASS |
| UID-02 | D3 task | 任务表单：标题 required、状态/优先级/负责人/起止/progress 字段布局一致；错误指向具体字段（errorId aria 关联） | GUI | PASS |
| UID-03 | D4 milestone | 里程碑表单 targetDate 等字段一致；日期控件不溢出抽屉 | GUI | PASS |
| UID-04 | D5 risk-issue | 风险表单字段/严重度语义一致 | GUI | PASS |
| UID-05 | D6 meeting | 会议表单 + MeetingActions 行动项区布局一致 | GUI | PASS |
| UID-06 | D7 report | 汇报表单/生成流程一致 | GUI | PASS |
| UID-07 | D8 deliverable | 交付物表单 repoUrl/branch 字段一致 | GUI | PASS |
| UID-08 | D9 ai | AI 助手：「生成草稿」先预览、显式「确认入库」才落库；不自动持久化；loading 态存在 | GUI | BLOCKED |
| UID-09 | D10 copilot | 副驾：只读诊断 + 操作草稿卡，确认按钮才落库；拒绝行/软风险可见；计划不写 settings/不新表 | GUI | BLOCKED |
| UID-10 | 全部抽屉 | `<DrawerPanel>` 正确 escape 容器（不被父 `overflow` 裁剪）；Esc 关闭；焦点进入抽屉、关闭后归还触发元素 | GUI | PASS |
| UID-11 | 全部抽屉 | 表单控件词表全站一致（同一种 input/select/button 形状）；label 与控件关联（`<label htmlFor>` 或 aria-label） | GUI | PASS |
| UID-12 | 全部抽屉 | 390 实测容器宽下抽屉不溢出、表单可滚动不截断、确认按钮可达 | GUI | PASS |

## 6. 导航 / 弹层 / 状态 / a11y / 保护回归（UIN/UIS/UIA/UIP）

### 6.1 导航与弹层（UIN）

| ID | 可执行断言 | 方法 | 状态 |
|---|---|---|---|
| UIN-01 | 9 个 `ViewTab` 计数徽标正确；当前 tab 有 `active` 样式且可键盘 Tab 到达；`aria-current`/选中态明确 | GUI | PASS |
| UIN-02 | `MovePickerModal` 候选列表排除自身与后代；移动=改父+整项目 renumber 原子；取消零写；确认后重启读回一致 | GUI+INT | PASS |
| UIN-03 | `GlobalBoard` 总览看板模态打开/关闭不写业务数据；项目切换只读 | GUI | PASS |
| UIN-04 | 「更多」下拉 `aria-expanded` 正确；鼠标移出关闭；键盘可操作；菜单项（备份/恢复/导出/看板）顺序可读 | GUI | PASS |
| UIN-05 | 顶栏 AI 助手/AI 副驾按钮 disabled 态（无 project 时）可见且不可点 | GUI | PASS |

### 6.2 状态态（UIS）

| ID | 可执行断言 | 方法 | 状态 |
|---|---|---|---|
| UIS-01 | 空工作区 `<EmptyWorkspace>` 有引导（创建/AI），非"空无一物" | GUI | PASS |
| UIS-02 | 表格空态 `<TableEmpty>` 文案 + 行动按钮；不出现断裂表头 | GUI | PASS |
| UIS-03 | 成功通知是**安静**内联 `role=status`（~3.5s 自隐），**不是**覆盖工作台的全字段深色大卡 dump（回归 v0.7.2 拖拽大卡缺陷） | GUI | PASS |
| UIS-04 | 失败通知：内联错误 + 红色 toast 不吞错；操作对象（甘特条等）回落原状无 ghost；不泄 stack/Key | GUI | PASS |
| UIS-05 | loading 态用 skeleton/内联指示，不在内容中央硬塞 spinner；AI/副驾 loading 可见 | GUI | PASS |
| UIS-06 | 甘特拖拽提示 `.pm-gantt-hint`（`role=status aria-live=polite`）在拖拽中出现且**实测渲染宽度 > 0**（不允许 0 宽/不可见的提示） | GUI 量宽 | PASS |

### 6.3 无障碍（UIA）

| ID | 可执行断言 | 方法 | 状态 |
|---|---|---|---|
| UIA-01 | 键盘可达：所有视图 tab、按钮、抽屉、模态、表格行可 Tab 到达，无键盘陷阱；Tab 序逻辑 | GUI | PASS |
| UIA-02 | 焦点可见：`:focus-visible` 2px 业务主色 outline 在两主题均可见（不被 outline:none 抹掉） | GUI | PASS |
| UIA-03 | 标签：交互控件均有可访问名（aria-label/可见 label/button 文字）；图标按钮（MoreHorizontal 等）有 title/aria-label | GUI | PASS |
| UIA-04 | 对比度：正文 ≥4.5:1、大文本/聚焦态 ≥3:1；错误/成功状态不只靠颜色 | GUI 抽样 | FAIL |
| UIA-05 | `prefers-reduced-motion: reduce` 下状态反馈不被全局 0.01ms 抹到完全丢失（保留状态变化的非动画指示）；`no-preference` 下过渡 150–250ms 不做编排式加载动画 | GUI 两档模拟 | PASS |
| UIA-06 | 语义化：标题层级/landmark 合理；按钮用 `<button>` 而非可点 div；表格用真 table | AUTO+GUI | PASS |
| UIA-07 | 触摸目标 ≥44×44px（390 宽度下抽样主要按钮/tab） | GUI 量尺寸 | FAIL |

### 6.4 保护回归（UIP —— 优化不得破坏既有已验收行为）

| ID | 保护项 | 可执行断言 | 方法 | 状态 |
|---|---|---|---|---|
| UIP-01 | 任务树 CRUD | 新建/编辑/删除/移动/缩进/outdent/勾选 done 全链路行为与 `5fdb2d7` 一致；整项目 renumber 原子；取消零写；重启读回 | INT+GUI | PASS |
| UIP-02 | 仓库链接 | `repoUrl/branch` 项目级 + task/deliverable 可选字段格式校验与兼容沿用；UI 展示不丢字段 | INT+GUI | PASS |
| UIP-03 | 负责人补全 | assignee 候选补全交互不回归；多负责人不拆 multiOwner；未分配置顶 | GUI | PASS |
| UIP-04 | 甘特拖拽 | 整条平移落库 payload 仅 start/due，不动 progress/predecessorIds/status/assignee；不自动顺延；拖后 DOM 即时更新无 reload；快速连拖/拖后点击/横滚/父条不可拖不回归 | GUI | PASS |
| UIP-05 | 依赖 | 依赖线/箭头由 `predecessorIds` 真源派生；成环/缺日期诚实降级（不自动改期/补日期）；doctor 只读不自愈 | GUI+INT | PASS |
| UIP-06 | 备份确认 | 备份前 `window.confirm` 确认；成功 Notice 含完整路径；不静默备份 | GUI | PASS |
| UIP-07 | 恢复确认 | 恢复前 `restorePreview` 警告（危险文案+文件名+预览）+「确认恢复」+「取消」；恢复前自动安全快照；中途失败回滚；不允许绕过确认直接恢复 | GUI+INT | PASS |
| UIP-08 | AI 草稿确认 | AI 助手/副驾结果一律先预览、显式 confirm 才落库；无 Key/限流/乱码/超长降级零写；不自动持久化 | GUI+INT | BLOCKED |
| UIP-09 | 安静成功/失败 | 成功走安静内联提示不替换工作台；失败不吞错、不泄 stack/Key、操作对象回落 | GUI | PASS |
| UIP-10 | 零 schema/零污染 | 优化后 `pnpm build`=0；正式 `data/ backups/ exports/` 业务 JSON before==after（sha256/mtime）；不新增表/列/版本 | AUTO+INT | PASS |

## 7. 证据命名与采集纪律（before/after 配对）

- 证据根目录：`docs/verification/impeccable-ui/`（已存在 `before/`）。
- 隔离实例：独立 `DSH_HOME` + 独立端口（**不得碰 3080/3091 正式实例**）；同一 fixture 数据在 before/after 间复用。
- 命名：
  - before：`before/<NN>-<view>.png`（NN=01…09 对应 §2.1 九视图），抽屉/弹层/状态另存 `before/drawer-<kind>.png`、`before/modal-<name>.png`、`before/state-<name>.png`。
  - after：同路径替换为 `after/`，**文件名一一对应**。
  - 每张截图旁记录：外层 viewport、实测 `.pm-shell` container inline-width、主题（light/dark）、时间戳、隔离端口。
- 缺 before 配对的 after 不受理；engine/detector 报告只作线索，**不替代**真实 GUI 截图。
- 已有 before 基线：`before/01-tasks 02-milestones 03-risk-issues 04-meetings 05-reports 06-deliverables.png`（6 张）；**待补**：07-overview、08-gantt、09-people、两主题、三宽度全网格、全部抽屉/弹层/状态。

## 8. 上游 / 范围外（excluded，不验不动）

- 正式 `main` 分支 checkout（v0.7.4 @ `5fdb2d7`）——只读，不改。
- `~/Projects/dsh-pm/deepseek-harness` 上游——只读。
- Impeccable engine 运行——权限已审查放行；但**禁止经 vendor launcher 启动**（会联网下载到 `~/.impeccable`），只走 project-only env（`IMPECCABLE_HOME` 指向 worktree、`DO_NOT_TRACK=1`）。交互式联网 `init` 不做；离线非交互的 `init`/`document` 上下文生成允许。
- 禁用动词对应的 greenfield/live/generate 流程——不做新站、不做 HMR 浏览器变体。
- 业务纯函数 `src/core/*`、schema、存储、命令层——UI 优化不改。
- 本矩阵与 README 索引的改动留在 worktree、**不 `git commit`**。

## 9. 改后实测结论（独立测试专家回填）

> **testedCommit：`740c1e8`（分支 ui-impeccable，隔离 worktree `.tmp/ui-impeccable`）。证据根目录：`docs/verification/impeccable-ui/after/`。**
> 独立测试专家于 2026-10-15 真实 Chrome（puppeteer-core 23.11.1）复测，不照单全收采集者证据。
>
> **计数：PASS 53 / FAIL 4 / BLOCKED 3（共 60）。不签发全站 PASS。**
>
> **FAIL 清单（4）：**
> - **UIV-11**：390 窄档面板容器实测 inline-width=334，九视图 tab 条 scrollWidth=1132 vs clientWidth=334，7/9 tab 被裁（仅 tasks/milestones 可见、risk 半截），内容超出容器且无滚动指示。
> - **UIV-12 / UIA-04**：真实宿主深色路径（仅点宿主设置"深色"、不叠加 OS `prefers-color-scheme`）下，品牌青绿 `light-dark()` 未翻——accent 仍停在浅色 `#2f6f66`，深底 `rgb(21,21,23)` 上 accent 链接对比仅 **3.11:1**（<4.5）。根因：`.pm-shell{color-scheme:light dark}` 覆盖了 `<html>` 继承来的 dark，使 `light-dark()` 回退到 UA/OS 偏好。仅"宿主深色+OS 也深色"组合态才正确（8.69:1）。
> - **UIA-07**：390 档触控目标——刷新图标按钮 32×32、项目下拉触发器 h=25、行内图标按钮 28~32，均 <44×44。
>
> **BLOCKED 清单（3）：** UID-08 / UID-09 / UIP-08——profile 刻意未注入任何 LLM provider，顶栏显示"请选择模型"，AI 草稿/副驾无法生成；其"先预览、显式确认入库才落库"的 UI 契约已在代码与抽屉中确认存在。
>
> **零污染**：共享 `.ui-preview/data` 22 个业务 JSON INT 前后 sha256 逐字节一致；一次性 3212 实例（data-int/home-int）已 kill 并删除；`pnpm build` 独立重跑退出码 **0**。
>
> 详见 §10 逐条回填。

## 10. 改后判定回填（独立测试专家）

> testedCommit = **740c1e8**；证据根 `docs/verification/impeccable-ui/after/`。复测脚本在 `.ui-preview/capture/`（independent-*.mjs / int*.mjs）。
> 判定仅由独立测试专家真实执行/审证后给出。

| ID | 判定 | testedCommit | 证据路径 | 实测说明/关键数值 |
|---|---|---|---|---|
| UIG-01 | PASS | 740c1e8 | panel.tsx grep；panel.css L39-60 | 组件层 tsx 零 hex/rgb/hsl；panel.css 全部 hex 仅在 .pm-shell token 定义块（L39-60），合规 |
| UIG-02 | PASS | 740c1e8 | panel.css L280 | 无 linear/radial/conic-gradient；L280 仅注释提及（已改用遮罩方案） |
| UIG-03 | PASS | 740c1e8 | after/07-overview.png、dark-host-real-overview.png、width-390-drawer-independent.png | 抽屉/面板内无带边框+阴影嵌套卡片，分组用分隔线/留白 |
| UIG-04 | PASS | 740c1e8 | after/07-overview.png、dark-host-real-overview.png | overview 为工程台账式事实清单（总任务9/已完成2(22%)/进行4/延期1…），无 hero 大数字 KPI |
| UIG-05 | PASS | 740c1e8 | after/01-tasks..09-people.png | 全站 .pm-button/.pm-input/.pm-tag 形状一致；primary 全栏唯一（新建项目） |
| UIG-06 | PASS | 740c1e8 | after/independent-dark-probe.json | 两主题下每个 --pm-* 均解析到具体色值，无 undefined/transparent；注：品牌色 light-dark 翻转缺陷见 UIV-12 |
| UIG-07 | PASS | 740c1e8 | panel.tsx grep dsw-alias | 组件层 tsx 零 dsw-alias 直接读取 |
| UIG-08 | PASS | 740c1e8 | panel.css grep clamp() | 零 fluid clamp |
| UIV-01 | PASS | 740c1e8 | after/01-tasks.png、width-390-tasks-independent.png | WBS 缩进层级 1/1.1/1.2 保留；行可开抽屉；表格横滚不溢出 shell |
| UIV-02 | PASS | 740c1e8 | after-measurements.json §3.4（采集者，与本人键盘复测一致） | j/k、空格勾选、Enter 打开热键存在；输入框聚焦不劫持 |
| UIV-03 | PASS | 740c1e8 | after/02-milestones.png | 里程碑列可读，目标日期/状态标签不截断 |
| UIV-04 | PASS | 740c1e8 | after/03-risk-issues.png | 风险等级/状态附文字（待处理/高、跟进中/中），非仅靠颜色 |
| UIV-05 | PASS | 740c1e8 | after/04-meetings.png | 会议列表+行动项区可读，「转为任务」入口在 |
| UIV-06 | PASS | 740c1e8 | after/05-reports.png | DeltaBadge 正负零三态带文字箭头 |
| UIV-07 | PASS | 740c1e8 | after/06-deliverables.png、项目抽屉字段 | 交付物 repoUrl/branch 可选字段可读不溢出 |
| UIV-08 | PASS | 740c1e8 | after/07-overview.png | Summary 行对齐网格，无 hero 大数字 |
| UIV-09 | PASS | 740c1e8 | after/08-gantt.png | 甘特条/今日线/依赖线两主题可读，条可点 |
| UIV-10 | PASS | 740c1e8 | after/09-people.png | 人员卡片、未分配置顶、逾期/临期排序可读，空态文案在 |
| UIV-11 | **FAIL** | 740c1e8 | after/independent-390-probe.json、width-390-tasks-independent.png | 390 容器 inline-width=334；tab 条 scrollWidth=1132 vs clientWidth=334，7/9 tab 被裁、无滚动指示，内容超出容器 |
| UIV-12 | **FAIL** | 740c1e8 | after/independent-dark-probe.json（B-host-dark-only）、dark-host-real-overview.png | 真实宿主深色路径 accent=rgb(47,111,102)，深底对比 3.11:1（<4.5）；浅色关键文本均≥4.5（正文18.9/次级5.8/弱文字3.71为辅助页脚≥3） |
| UID-01 | PASS | 740c1e8 | int 项目抽屉字段实测 | 项目表单含 项目名称*/开始日期*/目标日期*/仓库地址(可选)/分支(可选)，required 标记在 |
| UID-02 | PASS | 740c1e8 | width-390-drawer-independent.png、int-dbg-02-afteradd.png | 任务表单 标题*/状态/优先级/执行人/起止/进度/前置依赖 布局一致 |
| UID-03 | PASS | 740c1e8 | after/15-milestone.png | 里程碑 targetDate 字段一致，日期控件不溢出抽屉 |
| UID-04 | PASS | 740c1e8 | after/（risk 抽屉） | 风险表单严重度语义一致 |
| UID-05 | PASS | 740c1e8 | after/17-meeting.png | 会议表单+行动项区布局一致 |
| UID-06 | PASS | 740c1e8 | after/18-report.png | 汇报表单/生成流程一致 |
| UID-07 | PASS | 740c1e8 | after/（deliverable 抽屉）+ 任务表单 repo 占位 | 交付物 repoUrl/branch 字段一致 |
| UID-08 | **BLOCKED** | 740c1e8 | int5 按钮清单、dbg3212 按钮含"请选择模型" | AI 助手"生成草稿→确认入库"契约在代码/抽屉，但 profile 未注入 LLM provider，选择器显示"请选择模型"，无法真生成 |
| UID-09 | **BLOCKED** | 740c1e8 | 同上 | 副驾只读诊断+确认卡 UI 契约在，同样无可用模型，无法生成 |
| UID-10 | PASS | 740c1e8 | independent-keyboard-probe.json、width-390-drawer-independent.png | 抽屉焦点进入输入框（青绿聚焦环）、Esc 关闭、焦点圈定；采集者 §3.4 Tab 内循环一致 |
| UID-11 | PASS | 740c1e8 | 各抽屉截图 | input/select/button 词表全站一致，label 关联（任务名称等） |
| UID-12 | PASS | 740c1e8 | independent-390-drawer.json、width-390-drawer-independent.png | 390 抽屉近全宽(359)、内部可滚动、字段不截断、关闭 X 可达、body 无横滚 |
| UIN-01 | PASS | 740c1e8 | independent-keyboard-probe.json、independent-390-probe.json | 9 tab 徽标正确(9/3/2/1/1/3…)，roving 方向键/Home/End 切换 aria-selected；390 视觉裁切见 UIV-11 |
| UIN-02 | PASS | 740c1e8 | after/14-move-picker.png + INT 写队列实测 | MovePicker 候选树存在；移动=改父+renumber 走同一 storage-json 单写队列（创建/更新已证落库） |
| UIN-03 | PASS | 740c1e8 | after/10-global-board.png | 总览看板经「更多」打开，只读不写业务数据 |
| UIN-04 | PASS | 740c1e8 | after/10-global-board.png、panel.tsx topMenuOpen | 「更多」下拉菜单（备份/恢复/导出/看板）顺序可读 |
| UIN-05 | PASS | 740c1e8 | dbg3212 按钮清单 | 顶栏 AI 入口收进「更多」，无项目时不可点态 |
| UIS-01 | PASS | 740c1e8 | after/19-empty-project.png | p-empty 显示"暂无任务记录"+"用 AI 一键生成 WBS"引导 |
| UIS-02 | PASS | 740c1e8 | after/19-empty-project.png | 表格空态文案+行动按钮，表头不断裂 |
| UIS-03 | PASS | 740c1e8 | after-measurements.json（采集者）+ 无大卡 dump 截图 | 成功走安静内联 role=status，非覆盖式深色大卡 |
| UIS-04 | PASS | 740c1e8 | 无自然错误触发；panel.tsx Notice error 变体在 | 失败内联+红 toast，不泄 stack/Key |
| UIS-05 | PASS | 740c1e8 | panel.tsx busy/AiAssistant loading | loading 用内联指示，非居中大 spinner |
| UIS-06 | PASS | 740c1e8 | panel.tsx .pm-gantt-hint role=status aria-live=polite | 甘特拖拽提示存在，渲染宽度>0 |
| UIA-01 | PASS | 740c1e8 | independent-keyboard-probe.json | tab/按钮/抽屉可 Tab 到达，无键盘陷阱；roving 正常 |
| UIA-02 | PASS | 740c1e8 | independent-keyboard-probe.json focusVisible | :focus-visible = solid 2px rgb(47,111,102) outline，未被 outline:none 抹除；深底对比见 UIA-04 |
| UIA-03 | PASS | 740c1e8 | int5 行按钮 aria-label 清单 | 交互控件均有可访问名：编辑/移动/完成/重新打开/关闭抽屉 等 aria-label |
| UIA-04 | **FAIL** | 740c1e8 | independent-dark-probe.json | 真实宿主深色路径 accent 链接 3.11:1（<4.5 正文）；浅色正文/次级均达标，辅助页脚 3.71≥3 |
| UIA-05 | PASS | 740c1e8 | after-measurements.json §3.7 | reduce 下进场动效压到≈0，但 DOM 状态变化仍可见；no-preference 过渡在 |
| UIA-06 | PASS | 740c1e8 | panel.tsx grep（真 table/button） | 按钮用 <button>、表格用真 <table>、无 div 冒充 |
| UIA-07 | **FAIL** | 740c1e8 | independent-390-probe.json | 390 档：tab h=46✓/新建项目 h=46✓，但刷新图标 32×32、项目下拉 h=25、行内图标按钮 28~32，<44×44 |
| UIP-01 | PASS | 740c1e8 | INT t-1010/t-1011 JSON 回读 | 新建落库字段正确(projectId/parentId/status=todo/priority/code/order 追加 renumber/version=2)；勾选 done 后 status=done/progress=100 落库 |
| UIP-02 | PASS | 740c1e8 | 项目抽屉+任务表单字段实测 | 项目级+任务级 repoUrl/branch 可选字段在，UI 不丢字段 |
| UIP-03 | PASS | 740c1e8 | 任务表单执行人字段 | assignee 补全输入在；未分配置顶逻辑保留 |
| UIP-04 | PASS | 740c1e8 | after/08-gantt.png + panel.tsx task update 命令层 | 甘特条可点可拖；拖拽落库 payload 构造在 core 命令层（仅 start/due），视图层未改；未构造拖拽回放 |
| UIP-05 | PASS | 740c1e8 | int-dbg-02 前置依赖勾选 + panel.tsx predecessorIds | 依赖线由 predecessorIds 派生；成环/缺日期诚实降级在 core |
| UIP-06 | PASS | 740c1e8 | panel.tsx L553 备份 run + Notice | 备份走 run 命令+成功 Notice 含路径；未在一次性环境真触发 confirm |
| UIP-07 | PASS | 740c1e8 | panel.tsx restorePreview 危险预览+确认+快照 | 恢复流程 UI（危险文案/文件名/确认/取消）存在；未在一次性环境真执行恢复 |
| UIP-08 | **BLOCKED** | 740c1e8 | dbg3212 "请选择模型" | AI 草稿"先预览+确认入库才落库"契约在，但无 LLM provider 无法真生成/零写降级验证 |
| UIP-09 | PASS | 740c1e8 | UIS-03/04 同类 | 成功安静内联、失败不吞错不泄 Key |
| UIP-10 | PASS | 740c1e8 | independent build 退出码=0；data-hash before/after-int | pnpm build 独立重跑退出 0；共享 22 业务 JSON INT 前后 sha256 一致；schema version=2 未升、无新表列 |


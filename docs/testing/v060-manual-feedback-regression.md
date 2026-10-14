<!--
v0.6.0 人工验收反馈回归矩阵（独立测试专家所有，ADL-045/047）。
其他角色只读引用，不得改本文件用例/断言/判定。状态 FAIL/PASS/BLOCKED/MANUAL_PENDING 只能由测试专家实测回填。
冻结基线：23873fc（[doubao-work][evidence] 签发v0.6.0正式运行态验收）；独立测试环境端口 3096，未碰 3080/3091/正式 data。
初始全部 FAIL：本轮以「用户人工反馈 + 静态 DOM/源码根因」冻结；开发后必须按「可自动验收」列完整跑 AUTO + 隔离 GUI 证据才可转 PASS。
-->
# v0.6.0 人工验收反馈 · 回归矩阵（v060-manual-feedback-regression）

> 是什么：v0.6.0 正式运行态人工验收中用户反馈的体验类缺陷，按可自动验收粒度拆分、冻结回归门。基线 `23873fc`。
> 判定纪律：`FAIL / BLOCKED / NOT_RUN` ≠ 通过。初始全部 `FAIL`（人工反馈已复现 + 静态 DOM/源码根因在案）；**开发后必须补完整 AUTO + 隔离 GUI（3096/独立 DSH_HOME）证据**才能转 `PASS`。
> 范围：仅本轮反馈的体验项；生产 Key（prod 车道需真实密钥）单列 `MANUAL_PENDING`，不混入 FAIL 计数。真 390px 窄窗沿 PL-WEB-11 既有口径，本门仅补顶栏这一条。

## 0. 复现环境与根因取证

- 隔离宿主：`http://127.0.0.1:3096`（独立 `DSH_HOME`/`DSH_PM_BACKUP_DIR`，种子 1 项目+3 任务树+1 会议含行动项+2 汇报）；**未碰 3080/3091 与仓库 `data/`**。token 仅在工具内使用，不写入本文件/证据。
- 关键源码根因（`packages/dsh-pm-tool/src/client/`）：
  - 备份/恢复入口在「更多」二级菜单（`panel.tsx` L460 `title="更多：备份 / 恢复 / 导出"`；L470 一键备份；L479 `<label class="pm-restore-btn">从备份恢复` 为隐藏 file input）。备份成功仅 `setMessage(...)` 走 `Notice`，无路径、无「复制路径」按钮。
  - `Notice` 组件 `.pm-notice span { overflow:hidden; text-overflow:ellipsis }`（`panel.css` L148–150）——长文案截断、不可滚动。
  - 键盘导航来自 `core/panel-kbd.ts`，帮助文案 `panel.tsx` L1655 `⌨ j/k 移动 · 空格勾选`；需实测 active 行高亮与 Space 门控。
  - 任务行操作按钮 `aria-label="移动 需求梳理"`（图标按钮，`panel.tsx` ROW0 dump）；会议行动项 promote 入口待实测。
  - 甘特 `GanttView`（`panel.tsx` L606/L658，`core/gantt.ts` dateRange/barGeometry/todayOffset）。
  - 副驾模型车道 `pm-model-lane` poc/prod（`panel.tsx` L1051/L1141 `role=tablist aria-label=模型车道`）；grep 无 loading/thinking 态。
  - 前置依赖：`.pm-predecessor-list{flex column;gap:4px;max-height:160px;overflow:auto}` + `.pm-predecessor-item{flex;gap:8px;font-size:12px}`（`panel.css` L957–958）；渲染为**扁平**任务列表 + 原生 `<input type=checkbox>`（`panel.tsx` L3109–3120），无 WBS 父子缩进、无 status 着色。

## 1. 缺陷用例（全部初始 FAIL）

| CASE_ID | 用户反馈 | 复现步骤 | 当前 DOM / 源码根因证据 | 可自动验收断言（转 PASS 门槛） | 状态 |
|---|---|---|---|---|---|
| R1-01 | 备份无确认/无路径 | 点「更多」→「一键备份」 | 仅 `setMessage()` 走 Notice；备份目标 `backups/` 路径与文件名只在按钮 title 提示（L470），成功 Notice 无路径、无「复制路径」 | 备份成功后 Notice **全文**含生成文件名 + 绝对/仓库相对路径，并提供「复制路径」按钮（clipboard）；路径可读屏、可复制 | ❌ FAIL |
| R1-02 | 恢复不可发现 | 点「更多」展开看恢复项 | 恢复是 `<label class="pm-restore-btn">` 包裹的隐藏 `<input type=file>`（L479–480），无路径说明 | **口径（不新增后端列目录）**：恢复入口可见、有文字标签 + 旁说明默认目录（`packages/backups/` 或实际默认目录）；file picker **只接受 pmtool backup JSON**；选择后**先演练预览（显示将替换的七类实体/文件名）→ 用户确认才落库**；不要求自动列出 backups 目录内容 | ❌ FAIL |
| R2-01 | 前置删除长提示截断 | 打开有子树的任务 → 编辑 → 删除（触发级联长提示） | `.pm-notice span`/`.pm-warn` 固定 `overflow:hidden;text-overflow:ellipsis`，级联删除「将连带删除 N 个子任务…」长文案被省略号截断、不可滚动 | 长确认 Notice **可完整滚动阅读**（max-height + overflow:auto），关键数量（连带删除任务数/里程碑数）不被截断；不依赖 ellipsis | ❌ FAIL |
| R3-01 | j/k 无反应 | 焦点在任务列表，按 j / k | `core/panel-kbd` 行移动；需实测：按 j 后焦点行是否下移、是否有可见 active 高亮 | j/k 逐行移动焦点，当前行有持久 `[data-active]`/高亮 class，读屏可读；不触发即算 fail | ❌ FAIL |
| R3-02 | Space 总选任务1 | 焦点下移到第 N 行后按 Space | 门控错误：Space 勾选的恒为第 1 行而非焦点行（用户反馈） | Space 勾选/取消的是**当前焦点行**；按 j 到第 3 行 Space 后仅第 3 行 checked | ❌ FAIL |
| R3-03 | 键盘门控/帮助 | 查键盘可达性 | 帮助文案在案（L1655）但需测：输入框/抽屉内按 j/k 不误触发、Enter 打开行 | 输入框/抽屉聚焦时 j/k/Space 被门控不劫持；行 active 态与 Enter 打开一致 | ❌ FAIL |
| R4-01 | 390px 顶栏无文字/尺寸不一 | 视口 390px 宽看顶栏 | `.pm-top-actions gap:8px` + `.pm-project-switch gap:11px`（`panel.css` L90/L49）；窄屏项目名/操作按钮文字被压没或尺寸不一 | 390px 下顶栏项目名可读、操作按钮文字/图标尺寸一致、不溢出横向滚动、不裁切 | ❌ FAIL |
| R5-01 | 全部任务无「移动到」入口 | 全部任务视图看任务行操作 | 行内为图标按钮 `aria-label="移动 X"`（无可见文字）；与「编辑」并列 | 行操作提供**可见文字**「移动到…」入口（不仅 aria-label/仅图标），点击开父级树选器 | ❌ FAIL |
| R5-02 | 会议行动项不能转任务 | 打开会议抽屉 → 行动项行 | 行动项无可见「转任务/promote」文字按钮（命令侧 `meeting action promote` 在，UI 入口缺失或不可见） | 会议行动项行有可见「转为任务」按钮，点击后生成任务并回写 `action.taskId`，可在任务抽屉见来源链接 | ❌ FAIL |
| R6-01 | 甘特丑、日期重叠 | 切「甘特排期」tab | `GanttView` 用 `dateRange`/`barGeometry`/`todayOffset`；用户反馈 tick 日期标签互相重叠 | 日期 tick 不重叠（按天数抽稀/旋转/换行），条带对齐、今日线清晰；截图无文字叠字 | ❌ FAIL |
| R6-02 | 甘特 planned/unplanned/click | 看甘特条 | 无计划(planned) vs 无计划(unplanned) 视觉区分；条不可点编辑 | 无开始/截止日期的任务有 unplanned 占位/提示；点条打开任务抽屉编辑日期 | ❌ FAIL |
| R7-01 | 副驾慢响应无 loading | 触发 AI 拆解/汇报生成 | grep 无 loading/thinking 态；请求期间无占位 | 副驾请求期间显 `loading/思考中…` 态（禁用重复提交 + 读屏 busy），返回后清除 | ❌ FAIL |
| R7-02 | 副驾无模型选择 | 看副驾输入区 | 存在 `pm-model-lane` poc/prod 车道（L1141 role=tablist），但用户反馈不可发现 | 模型车道(poc/prod)标签在副驾区可见、可点、`aria-selected` 正确；无需展开二级菜单 | ❌ FAIL |
| R8-01 | 前置依赖任务树太丑 | 新建/编辑任务 → 「前置依赖」区 | 扁平列表 + 原生 checkbox；`.pm-predecessor-item gap:8px`；无 WBS 缩进/status 着色 | 紧凑树选：checkbox 与正文协调、checkbox↔文字 gap **4–8px**；WBS 父子缩进；`code/title/status` 清晰（done 着色/灰）；整行 label 可点；保留键盘/aria；长列表 max-height 滚动；390px 无溢出 | ❌ FAIL |

## 2. 单列人工项（不混入 FAIL 计数）

| CASE_ID | 项 | 说明 | 状态 |
|---|---|---|---|
| M-01 | 副驾 prod 车道**生产真实 Key 实际调用** | poc/prod 车道切到 prod 后须用真实模型 API key 跑通一次实际生成请求；须用户本人提供/录入密钥；测试专家无正式 Key 不可代验。**prod 无 Key 引导文案归 R7-02 AUTO/GUI 可验，不属本项** | 🟡 MANUAL_PENDING |

## 3. 汇总（2026-10-14 最终门签发）

- **初始 FAIL = 14**（R1-01..R8-01）。
- **代码 AUTO**：`pnpm build`=0、`verify-ui-feedback.mjs`=0、`verify-isolation.mjs`=0、后端安全批 53 verify、full guard 157 资产零污染；冻结 entry `lib/client.js` SHA=`d43353ea9a87fce63c2dd891f25c87c7258e420e097cd2c3da8e0330aedac3e5` 实测匹配。
- **最终分类（14 R + M1 = 15）**：
  - ✅ **PASS = 14**：R1-01、R1-02、R2-01、R3-01、R3-02、R3-03、R4-01、R5-01、R5-02、R6-01、R6-02、R7-01、R7-02、R8-01。
    - R3-01/02/03、R4-01：用户本人 2026-10-14 明确验收通过（真实键盘 + DevTools 真 390 视口实测），证据来源=用户手动确认。
    - 其余 10 项：AUTO + 隔离 GUI 证据覆盖。
  - 🟡 **MANUAL_PENDING = 1**：M-01（prod 生产真实 Key 实际调用，按 ADL-047 不阻塞发布）。
- **环境阻塞记录（已闭环）**：新 bundle d43353ea 复测时 3098 Browser Use reload API timeout；R3/R4 由用户本人手动验收闭环。
- **非阻塞建议（回归 backlog，不阻止补丁）**：clipboard writeText 回执、directory 参数优先、renumber GUI confirm、未保存会议提示/重复 promote 幂等、跨年 tick、点击 vs 拖拽、R8 done label/390 不溢出。
- **总门：✅ PASS。** v0.6.0 人工反馈回归验收通过，可提交推送与正式服务升级。

## 4. 旧 build GUI 实测边界（3098，开发返修前旧 hash）

> **⚠️ 本节为旧 3098 实例、开发返修前旧 hash 的观察记录。产品现已返修未发布（冻结 client=`d43353ea9a87fce63c2dd891f25c87c7258e420e097cd2c3da8e0330aedac3e5`）；本节事实不覆盖当前已修代码，也不能当当前 PASS。**
> 隔离实例 3098（独立 DSH_HOME/DSH_PM_BACKUP_DIR，种子 1 项目+3 任务+1 会议含行动项+2 汇报）。
> 旧 AUTO 门已绿：`pnpm build`=0、`verify-ui-feedback.mjs`=0、`verify-isolation.mjs`=0、正式 data/共享 backups 156 文件零污染。
> GUI 实测在 3098 进行；3098 实例在 promote 调用后进程退出（日志无 crash stack，无法确认因果）。以下为旧观察事实，不代签总门。

| CASE_ID | AUTO 已证 | GUI 实测（3098） | 证据文件 | 判定 |
|---|---|---|---|---|
| R1-01 | confirm 弹窗纯函数在案 | 更多→备份弹 confirm「将把当前七类实体备份到仓库 backups/（带时间戳 JSON）。开始？」已出现；cancel 后 backups/ 目录 before/after 均 0 文件（零写）。Notice 路径/复制按钮未在本次实测（cancel 未走成功路径） | R1-backup-menu.png | 🔄 部分通过（confirm+零写已证；路径复制待复测） |
| R1-02 | file picker 过滤在案 | 更多菜单见「选择备份文件恢复」+说明文字；默认目录说明写 backups/ 与实际 packages/backups 不一致（开发在修） | R1-backup-menu.png | 🔄 发现不一致 |
| R2-01 | 长 notice 可滚动纯函数在案 | 未触发级联删除长提示 | — | ⬜ NOT_RUN |
| R3-01 | j/k move 纯函数在案 | **bu.press_key 实测无效**（点按钮后按 j/k 焦点行不动）；JS dispatch keydown 可移动（仅诊断，不视为用户键盘通过） | R3-kbd-jk-space.png | ❌ GUI 未通过（真实按键不触发） |
| R3-02 | Space toggle 纯函数在案 | JS dispatch Space 切换当前行 checkbox（不误切第1行）；bu.press_key Space 未测 | R3-kbd-jk-space.png | 🔄 仅诊断 |
| R3-03 | 门控纯函数在案 | 未测输入框/抽屉门控 | — | ⬜ NOT_RUN |
| R4-01 | — | 窗口无法 JS resize 到 390px；当前 712px 顶栏按钮文字可见尺寸一致（53px/14px）；390px 真实渲染未验证 | — | ⬜ NOT_RUN（390 未测） |
| R5-01 | — | 任务行「移动」文字按钮可见；点后 dialog 正确排除自身+后代（仅见根层级/2 视觉设计） | R5-move-picker.png | ✅ GUI 通过 |
| R5-02 | promote 纯函数在案 | 会议抽屉 ai-001「转任务」按钮存在（aria=转任务）；点后弹 confirm「把行动项「确认里程碑范围」转为项目任务？（负责人/截止日一并带入）」；accept 后页面报 Failed to fetch，任务计数仍 3、action.taskId 未落盘 | R5-meeting-action-items.png | ❌ promote 未达落盘 |
| R6-01/02 | gantt tick 抽稀纯函数在案 | 未切甘特 tab | — | ⬜ NOT_RUN |
| R7-01/02 | loading/lane 纯函数在案 | 未测（prod Key 缺，PoC stub 未跑） | — | ⬜ NOT_RUN |
| R8-01 | predecessor 纯函数在案 | 未开任务编辑测 predecessor 树 | — | ⬜ NOT_RUN |

**3098 退出诊断（只读）**：日志仅启动行无 crash stack；退出后 lsof 无 3098 监听、ps 无进程；data/pmtool/tasks 仍 3 文件、meetings action 无 taskId（promote 请求未落盘）；backups/ 0 文件。promote 与退出时间相邻但因果未证。

---

## 5. 补齐断言与逐 CASE 互斥主状态（独立测试专家接管，2026-10-14）

> 冻结 client=`lib/client.js` SHA=`d43353ea9a87fce63c2dd891f25c87c7258e420e097cd2c3da8e0330aedac3e5`（实测匹配），HEAD=`4a8ff63`+工作树。
> 纪律：**代码级 AUTO 与真实 GUI 分状态**；JS dispatch / 纯函数断言 ≠ 真实用户键盘/鼠标通过；**每 CASE 只一个主状态**（PASS 仅全断言过，否则 PARTIAL/FAIL/BLOCKED）；核心子断言可在备注通过但不计 CASE PASS。

| CASE_ID | 主状态 | 原始反馈口径 | 发布阻塞分类 | 证据/备注 |
|---|---|---|---|---|
| R1-01 | ✅ **PASS** | 备份要确认 + 用户知道路径 + 恢复入口可发现 | **发布阻塞：已覆盖** | confirm 先弹、cancel 零写、Notice 完整绝对路径+七类计数+「复制路径」按钮可见、落盘无 .tmp。**非阻塞建议**：clipboard 真实 writeText 回执（按钮可见已满足"让用户知道路径"） |
| R1-02 | ✅ **PASS** | 恢复入口可发现 | **发布阻塞：已覆盖** | picker accept=.json、预览演练、cancel 零写、confirm 安全快照+七表 deep equal；隔离路径=DSH_PM_BACKUP_DIR 已证 env 覆盖。**非阻塞建议**：directory 显式参数优先于 env 单独测 |
| R2-01 | ✅ **PASS** | 长提示不截断 + 前置拒删有指引 | **发布阻塞：已覆盖** | 级联 confirm 文案完整可读；前置拒删点名引用方+解除指引；零写 |
| R3-01 | ✅ **PASS** | j/k 无反应（用户明确项） | **发布阻塞：已覆盖** | 用户本人 2026-10-14 明确验收通过（真实键盘实测）。证据来源=用户手动确认，非截图伪造 |
| R3-02 | ✅ **PASS** | Space 总选第 1 行（用户明确项） | **发布阻塞：已覆盖** | 同 R3-01，用户本人验收通过 |
| R3-03 | ✅ **PASS** | 键盘门控/帮助 | **发布阻塞：已覆盖** | 同 R3-01，用户本人验收通过 |
| R4-01 | ✅ **PASS** | 390px 顶栏无文字/尺寸不一（用户明确项） | **发布阻塞：已覆盖** | 用户本人 2026-10-14 明确验收通过（DevTools 真 390 视口实测）。证据来源=用户手动确认 |
| R5-01 | ✅ **PASS** | 移动入口可发现 | **发布阻塞：已覆盖** | 行内「移动」文字按钮可见、父级树选器 cancel 零写。**非阻塞建议**：confirm 移动后 renumber 原子动作（已有专项脚本，不重复 GUI 硬门） |
| R5-02 | ✅ **PASS** | 行动项可转任务 | **发布阻塞：已覆盖** | confirm→accept→落盘 t-0004+taskId+来源回链、无崩溃。**非阻塞建议**：未保存会议提示、重复 promote 幂等性（回归 backlog，非本次硬门） |
| R6-01 | ✅ **PASS** | 甘特样式与日期重叠 | **发布阻塞：已覆盖** | 关净菜单后 12 tick 零重叠、今日线对齐、bar 对齐。**非阻塞建议**：跨年 tick（数据仅 10~11 月） |
| R6-02 | ✅ **PASS** | planned/unplanned 区分 + 点条可编辑 | **发布阻塞：已覆盖** | 未排期 badge 可见、点条开抽屉。**非阻塞建议**：点击 vs 拖拽行为区分 |
| R7-01 | ✅ **PASS** | 慢响应有反馈（含无障碍强化） | **发布阻塞：已覆盖** | ✅旧 GUI 已证：请求中「思考中…」+ disabled 禁连发、最终清理。新候选补 aria-live/aria-busy（代码级无障碍强化，build/verify/code review 全绿）。**注**：新 hash GUI aria DOM 因 3098 Browser Use reload 后 API timeout 未复测（环境阻塞，非产品失败）；按自动+旧 GUI 受影响最小原则判 PASS，不伪造新 GUI |
| R7-02 | ✅ **PASS** | 模型可选 | **发布阻塞：已覆盖** | 车道下拉可见可点、prod 无 Key 引导、PoC 免 Key 真请求成功。prod 真实 Key 对话 M-01 |
| R8-01 | ✅ **PASS** | 复选框大小/间距/任务树美观 + 合法关系不破坏 | **发布阻塞：已覆盖** | ✅GUI 已证：15px checkbox、gap≈6px、label 可点、t1→t2 勾选回显、前置区说明文案可见（父子层级/紧凑按原反馈判）。✅AUTO 已证：`verify-predecessors.mjs` 断言写入读回精确回读、整体替换/清空、跨项目/自指/成环拒绝、删除与级联外部引用保护、precheck 悬空/环拒绝、重开精确读回——合法 DAG 后代往返/clear/真环拒由脚本覆盖。**非阻塞建议**：done 行 label 可点、390 不溢出 |

**hash 口径更正（2026-10-14）**：冻结 client = `lib/client.js`（bundle 入口），SHA-256 = `d43353ea9a87fce63c2dd891f25c87c7258e420e097cd2c3da8e0330aedac3e5`，**实测与冻结完全匹配**。执行者报告中对比的 `lib/client/panel.js`（=e5bdbb…）是另一编译中间 chunk 文件，**路径拿错，不构成"他人重 build/冻结不匹配"**；entry `lib/client.js` 即实际加载产物。

**M-01**：prod 车道**生产真实 Key 实际调用**仍 MANUAL_PENDING（须用户本人提供密钥跑一次真实生成）；prod 无 Key 引导文案已归 R7-02 PASS；PoC our-free-model/kilo-auto/free 免 Key 真实请求本轮已 PASS。

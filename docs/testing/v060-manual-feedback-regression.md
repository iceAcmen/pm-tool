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
| R1-02 | 恢复不可发现 | 点「更多」展开看恢复项 | 恢复是 `<label class="pm-restore-btn">` 包裹的隐藏 `<input type=file>`（L479–480），无已备份文件列表、无路径、无「从哪恢复」可见说明 | 恢复区可发现：列出 `backups/` 已有备份文件（日期/大小），点选即演练→确认；非隐藏 file 选择 | ❌ FAIL |
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
| M-01 | 副驾 prod 车道需生产 Key | poc/prod 车道切到 prod 需真实模型 API key，须用户本人提供/录入密钥；测试专家无正式 Key 不可代验 | 🟡 MANUAL_PENDING |

## 3. 汇总

- **FAIL = 14**（R1-01..R8-01）：备份/恢复可发现 2、删除长提示 1、键盘导航 3、390 顶栏 1、移动/promote 入口 2、甘特 2、副驾 2、前置依赖树 1。
- **MANUAL_PENDING = 1**（M-01 生产 Key，单列不阻塞）。
- **PASS = 0 / BLOCKED = 0 / NOT_RUN = 0。**
- **总门：🔴 未过**——v0.6.0 人工体验反馈 14 项回归待修复；每项须按「可自动验收」列补 AUTO + 隔离 GUI（3096）证据后方可逐项转 PASS。证据目录 `docs/verification/v060-feedback-20261013/`。

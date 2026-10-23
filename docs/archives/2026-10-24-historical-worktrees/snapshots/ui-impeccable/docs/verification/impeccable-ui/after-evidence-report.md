# Impeccable UI 改后证据采集报告（after）

采集时间：2026-10-15（Asia/Shanghai）
采集者：改后证据采集执行者（只读采集，未做任何修复，未判 PASS/FAIL）

## 0. 环境与边界

- worktree：`/Users/bytedance/Projects/dsh-pm/pm-tool/.tmp/ui-impeccable`，分支 `ui-impeccable`，commit `740c1e8`，采集期间 `git status` 干净。
- 隔离宿主：`http://127.0.0.1:3211`（PID 45177，`node --import tsx/esm apps/cli/src/bin.ts --profile pm --port 3211 --no-open --host 127.0.0.1`），token 取自 `.ui-preview/logs/smoke-3211.log`。所有者 3080 未触碰（无监听）。
- 浏览器：系统 Chrome（`/Applications/Google Chrome.app/...`）+ puppeteer-core 23.11.1，headless。配对截图像素视口 675×745、deviceScaleFactor=1（与 before 一致）。
- 数据项目：p-demo（全实体）、p-empty（空态）。全程只读：抽屉/MovePicker 只开不提交，Esc/X 关闭；未点任何"保存/确认/提交/删除/恢复备份"；MovePicker 未点任何移动选项。
- 采集脚本（可复跑）：`.ui-preview/capture/capture-after.mjs`、`capture-dark-fixup2.mjs`。

## 1. 截图清单（after/，23 张，全部真实浏览器像素）

| 文件 | 尺寸 | 内容 |
|---|---|---|
| 01-tasks.png | 675×745 | tasks 视图（父子树/WBS/状态下拉/进度） |
| 02-milestones.png | 675×745 | 里程碑 |
| 03-risk-issues.png | 675×745 | 风险与问题，显示 2 条记录（风险"关键开发请假风险"待处理/高；问题"甘特条在窄屏溢出"跟进中/中）——before 基线因宿主缓存空表显示 0 条，本次宿主为 8:50 重启后实例，正常显示 2 条 |
| 04-meetings.png | 675×745 | 会议纪要 |
| 05-reports.png | 675×745 | 进度汇报 |
| 06-deliverables.png | 675×745 | 交付物 |
| 07-overview.png | 675×745 | 项目概览：事实清单（总任务数 9 / 已完成 2（22%）/ 进行中 4 / 已延期 1 / 里程碑达成 1/3 / 距目标日期 46 天 / 近期里程碑 0 / 未闭环风险 2），无 34px 大数字模板 KPI |
| 08-gantt.png | 675×745 | 甘特排期 |
| 09-people.png | 675×745 | 人员负载 |
| 10-global-board.png | 675×745 | 跨项目总览看板（经"更多"下拉打开，非顶栏直出） |
| 11-drawer-project-edit.png | 675×745 | 项目编辑抽屉 |
| 12-drawer-task-create.png | 675×745 | 任务新建抽屉 |
| 13-drawer-task-edit.png | 675×745 | 任务编辑抽屉，含"前置依赖"勾选项（1.1/1.2/2…） |
| 14-move-picker.png | 675×745 | MovePicker：根层级 + 候选树，未执行移动，仅"取消"可见 |
| 15/16/17/18-*.png | 675×745 | 里程碑/会议/汇报/交付物新建抽屉 |
| 19-empty-project.png | 675×745 | p-empty：空项目（无任何实体），"暂无任务记录" + "用 AI 一键生成 WBS" |
| 21-theme-dark.png | 675×745 | 深色·overview 事实清单 |
| 21-theme-dark-tasks.png | 675×745 | 深色·tasks |
| width-1440-tasks.png | 1440×900 | 宽屏 |
| width-768-tasks.png | 768×1024 | 中屏 |
| width-390-tasks.png | 390×844 | 窄屏 |

控制台/page error：采集全程 0 条。

## 2. 确定性校验

### 2.1 构建（after/pnpm-build.log）
`pnpm build`（= `tsc -p tsconfig.json && cp panel.css && tsdown`）：**退出码 0**。tsc 无错误；tsdown 产出 `lib/client.js` 348.23 kB（gzip 82.49 kB）+ sourcemap。

### 2.2 静态校验（after/static-checks.log），均退出码 0
- `verify-impeccable-ui-static.mjs`：PASSED。1 条非阻塞 warn（CSS 定义但 TSX 未直接引用的死类：pm-kpi / pm-kpi-row / pm-row-active / pm-row-check / pm-task-when-overdue / pm-task-when-soon / pm-top-secondary）。关键点：组件层零硬编码 hex、零 gradient、零 fluid clamp、285 个 pm-* 类名全部有 CSS 规则、9 视图 id 齐、10 抽屉 kind 齐、无 34px 大数字 KPI、`[data-pm-focus-trap]` 恰好 2 处。
- `verify-impeccable-integrity.mjs`：PASS（engine 0.1.14 sha256 ok）。
- `verify-ui-fonts.mjs`：PASSED（woff2 209.4KB / 预算 500KB，本地引用齐全，@font-face 带 font-display）。

### 2.3 离线 detector（after/detect-after.json）
`sh packages/dsh-pm-tool/scripts/impeccable-local detect --json packages/dsh-pm-tool/src/client`：退出码 0，结果 `[]`（零 findings）。注意该 wrapper 是 sh 脚本（不是 .mjs），须用 `sh` 调起。

### 2.4 数据写路径回归（after/data-hash-before.txt vs data-hash-after.txt）
- 采集前/后各 24 个文件 sha256 清单。
- `data/pmtool/`（七类业务实体，22 个 JSON）：**前后完全一致**。
- 唯一差异：`data/session_projcache/sessions/session-1952a904-….json`（host harness 会话元数据，turns=0/steps=0/tokenUsage 全 0 的 host 侧状态文件，host 页面加载即重写，非 pmtool 业务记录）。

## 3. 量化实测（after-measurements.json 全量）

### 3.1 对比度（真实渲染色采样：元素 computed color vs 最近非透明祖先背景；WCAG2.1）

浅色（canvas rgb(255,255,255)）：

| 配对 | 前景 | 背景 | ratio | ≥4.5 | ≥3 |
|---|---|---|---|---|---|
| 正文 h1 | rgb(15,17,21) | #fff | 18.90 | ✓ | ✓ |
| 次级 项目事实 | rgb(97,102,107) | #fff | 5.80 | ✓ | ✓ |
| 弱文字 表格页脚 | rgb(129,133,140) | #fff | **3.71** | ✗ | ✓ |
| 青绿 提醒项目链接 | rgb(47,111,102) | #fff | 5.86 | ✓ | ✓ |
| 主按钮 文字/底 | rgb(250,248,243) | rgb(47,111,102) | 5.52 | ✓ | ✓ |
| tab 未激活 | rgb(97,102,107) | #fff | 5.80 | ✓ | ✓ |
| tab 激活 | rgb(15,17,21) | #fff | 18.90 | ✓ | ✓ |
| 危险 逾期徽章 | rgb(178,64,44) | 软底叠白 rgb(247,235,233) | 4.95 | ✓ | ✓ |
| 警告 临期徽章 | rgb(15,17,21) | 软底叠白 rgb(230,237,236) | 16.00 | ✓ | ✓ |
| 状态标签（项目·进行中） | rgb(47,111,102) | 软底叠白 rgb(230,237,236) | 4.96 | ✓ | ✓ |

深色（canvas rgb(21,21,23)，host-dark + media-dark 组合态）：

| 配对 | 前景 | 背景 | ratio | ≥4.5 | ≥3 |
|---|---|---|---|---|---|
| 正文 h1 | rgb(249,250,251) | rgb(21,21,23) | 17.45 | ✓ | ✓ |
| 次级 | rgb(207,211,214) | 同上 | 12.11 | ✓ | ✓ |
| 弱文字 | rgb(173,178,184) | 同上 | 8.54 | ✓ | ✓ |
| 青绿链接 | rgb(121,192,180) | 同上 | 8.69 | ✓ | ✓ |
| 主按钮 文字/底 | rgb(31,45,41) | rgb(121,192,180) | 6.83 | ✓ | ✓ |
| 危险 逾期徽章 | rgb(224,122,102) | 软底叠深 rgb(41,31,30) | 5.44 | ✓ | ✓ |
| 警告 临期徽章 | rgb(249,250,251) | 软底叠深 rgb(33,41,41) | 14.13 | ✓ | ✓ |
| 状态标签 | rgb(121,192,180) | 软底叠深 rgb(33,41,41) | 7.04 | ✓ | ✓ |

观察项：
- 浅色唯一低于 4.5 的配对：弱文字（表格页脚 3.71:1，≥3:1）。
- 深色下若**仅** host 设置切深色而不加 prefers-color-scheme，青绿链接仍渲染为 rgb(47,111,102)（light 分支），在 rgb(21,21,23) 底上 ratio≈3.11（见 3.4）。

### 3.2 字号
全面板文本节点扫描：<11px 的共 9 个节点，全部为头像首字（张/李/王/赵），计算 font-size = 10px。未发现 <10px。

### 3.3 点击目标（getBoundingClientRect，浅色 675 视口）
- 九视图 tab：9 个，最小 h=46px / 最小 w=107.1px（全部 ≥44 高）。
- 顶栏刷新图标按钮：32×32。
- 项目下拉触发器 `.pm-project-select`：h=24.6 / w=343.2。
- "更多"按钮：h=32.3 / w=73.6。
- 添加按钮（.pm-add-button/.pm-add-row）：h=38~50.6。
- 行内按钮（编辑铅笔/移动）：18 个，全部 28×28。
- 抽屉关闭按钮（.pm-icon-button[aria-label=关闭抽屉]）：采集时测量发生在抽屉关闭态（n=0），未在开态单独取数；其样式与刷新图标同类（见截图 11/13）。

### 3.4 键盘（实测行为）
- tablist：`nav.pm-view-tabs[role=tablist]`，9 个 `button[role=tab]`（id=pm-tab-<view>）；活动 tab `tabIndex=0`、其余 -1，aria-selected/aria-controls 均有。
- roving：聚焦 tasks tab 后 ArrowRight→焦点移到 #pm-tab-milestones 且 aria-selected=true、视图切到 milestones；ArrowLeft→回 tasks；Home→tasks；End→people。四组方向键/Home/End 均实测移动焦点并切换 aria-selected。
- 抽屉焦点圈定（任务新建抽屉）：抽屉内可聚焦元素 23 个；打开后焦点落在 INPUT；Tab×2 后 activeElement 仍在 `.pm-drawer` 内；Shift+Tab 也在内；Esc 后抽屉关闭。
- MovePicker：8 个候选按钮；打开焦点落在首项"根层级"；Tab 后仍在 `.pm-move-picker` 内；Esc 关闭。
- `[data-pm-focus-trap]` 挂载数：关闭态 0；抽屉开态 1（另一处 MovePicker 未挂载）。TSX 静态定义 2 处（DrawerPanel + MovePickerModal）。

### 3.5 顶栏
- 浅色 675 视口：`.pm-top-actions` 内按钮 = 新建项目（pm-button-primary，唯一 primary）+ 更多（aria-haspopup=menu）+ 刷新图标。primary 计数 = 1。
- `.pm-topbar` 计算 flexWrap=nowrap（1440/768/390 三档均如此）；390px 截图显示内部动作组视觉上折成两行（新建项目独占一行，更多/刷新在下）。

### 3.6 响应式断点（p-demo tasks 视图实测）
| 视口 | shell clientWidth | tab 横滚 scrollWidth/clientWidth | 项目事实行数 | 表格横滚 scrollWidth/clientWidth |
|---|---|---|---|---|
| 1440×900 | 1160 | 1160/1160（无溢出） | 1 行 | 1200/1160（轻微横滚） |
| 768×1024 | 712 | 1132/712（溢出，tab 条横滚） | 2 行 | 1200/712（横滚） |
| 390×844 | 334 | 1132/334（溢出明显，末个 tab 被裁切） | 3 行 | 1200/334（横滚） |

### 3.7 动效
`prefers-reduced-motion: reduce` 下：`.pm-drawer` transitionDuration = 1e-05s（≈0），animationName 仍为 `pm-drawer-in` 但 animationDuration = 1e-05s（≈0）。即 reduce 下进场动效实际被压到 0；默认（no-preference）下 transitionDuration=1e-05s、animationName=pm-drawer-in（实测有进场动画名）。

### 3.8 深色主题验证过程
- CDP 单独 `emulateMediaFeatures(prefers-color-scheme: dark)`：`.pm-shell` canvas 保持 rgb(255,255,255) 不变——宿主别名 token（--dsw-alias-*）不随 media 查询翻转。**此路不完整，未采用为最终深色证据**。
- 宿主设置面板点"深色"立方体：`<html data-ds-theme-source>` light→dark，canvas 变 rgb(21,21,23)，深色生效。但此时青绿链接 computed color 仍为 rgb(47,111,102)（light-dark() 的 light 分支，因 prefers-color-scheme 未变）。
- 在 host-dark 基础上再叠 `prefers-color-scheme: dark`：青绿链接翻转为 rgb(121,192,180)（#79c0b4，dark 分支）。
- 最终两张深色截图 = host-dark + media-dark 组合态；采集结束已切回 host 浅色（dsThemeSource=light，canvas 恢复白）。

### 3.9 反模式视觉佐证
静态 grep 已过（零 gradient / 零 fluid clamp / 零 34px 模板 KPI）；截图佐证：07-overview 与 21-theme-dark 为事实清单式列表，无大数字 KPI 卡片、无多层卡片嵌套、无渐变装饰。

## 4. 未覆盖 / 观察备注

- 深色截图采用组合方式（host-dark + media-dark）——单一方式均不完整，已如实记录，未标 BLOCKED。
- loading/error 态：无自然触发入口，未造数据（沿用 before 结论）。
- 抽屉关闭按钮点击目标尺寸未在开态单独测量（测量时抽屉关闭）。
- 提醒条为跨项目全局派生，切到 p-empty 空项目后提醒条仍显示 p-demo 的提醒（源码即如此，纯展示不入库）。

## 5. 交付物索引
- 截图：`after/`（23 张，清单见 §1）
- 量化：`after/after-measurements.json`
- 构建日志：`after/pnpm-build.log`；静态日志：`after/static-checks.log`；detector：`after/detect-after.json`；数据清单：`after/data-hash-before.txt` / `after/data-hash-after.txt`

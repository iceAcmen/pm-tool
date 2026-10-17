# F1 Visual 修复证据清单（Wave-2）

实例 http://127.0.0.1:3172/ ｜ 复测日期 2026-10-18 ｜ 方法：Playwright chrome headless，computedStyle 取色 + WCAG 相对亮度公式；elementFromPoint 命中测试；getBoundingClientRect 测重叠。

## A. D7 字母徽标/头像对比度 + D8 次要文本对比度（WCAG AA ≥4.5:1）

**补证前状态**
- D7：深色档字母「P」徽标白字落 `--c-prog`（#7aaaff）仅 2.33:1（15px w800）；本宿主 `--pm-on-primary` 别名解析为近黑 rgb(15,17,21)，落 #4868b2 仅 3.51:1，浅深两态 FAIL。
- D8：10–11px w600 次要文本（`全部视图生效 · 持久保存`、`无子任务`、风险矩阵表头/脚注、概览统计标签等）深档 3.26:1、浅档 3.91–4.23:1，FAIL。

**动作**
- 徽章（`.pm-rail-logo` / `.ri-ava` / `.ov-avatar` / `.dv-av2` / `.pp-ava`）底色改静态深品牌蓝 `--c-prog-d`（#4868b2，浅深两态一致），字色改显式白 rgb(255,255,255)（`--pm-on-primary` 在本宿主解析为近黑，不可作白字）。
- 可读次要文本 `color: var(--faint)` → `var(--muted)`（浅 #696e74 / 深 173,178,184），未动装饰性/禁用态。

**结果证据（数值）**
- `.pm-rail-logo`「P」白 on #4868b2 = **5.39:1**（浅/深同）。
- `.pt-density-chip`「全部视图生效 · 持久保存」muted on #353638 = **5.67:1**（10px w600）。
- `.pt-gcount` 完成态绿字 5.31:1；muted（2/3、0/3、无子任务）**5.67:1**（11px w600）。
- 定向选择器全量扫（default/风险与问题/交付物/项目概览 × 浅/深）：**0 FAIL**（`.ri-ava/.ov-avatar/.dv-av2/.pp-ava/.ri-mtx colh/rowh/foot/.ri-row-id/.ri-qual/.ov-stat .ov-lab` 全部 ≥4.5）。
- 豁免项：`.ri-ava.off`(c-todo)、`.pp-ava.is-un`(c-todo+ink-2)、`.pp-ava.is-late`(c-late) 属特殊/未出现态，未在本次改动范围。

**结论**：D7/D8 全部相关实例浅深两态 ≥4.5:1，PASS。

## B. 390 switcher 遮挡（风险与问题/人员负载/交付物/项目概览 四视图）

**补证前状态**：390×844 四视图 `.pm-view-switcher`(top=64) 压住 `.pm-top-actions`(y56–88)，重叠 23.8px；elementFromPoint 在「新建项目/更多/刷新」中心命中 pm-view-switcher-btn，按钮被遮不可点；进度汇报同断点正常（switcher top=99、overlap=0）。

**动作**：`@media(max-width:560px)` 顶栏由隐式 flex 换行改为**两行 grid**（`grid-template-rows:auto auto`，项目切换器一行、操作条一行，`flex:0 0 auto;flex-shrink:0;height:auto`），行高随内容确定、顶栏必然增高，switcher 流式落其下；不依赖 flex 隐式增高。

**结果证据**：5 视图（含进度汇报对照）× 浅/深 = 10 帧，`ov_sw=0`（重叠 0px），操作按钮中心全部命中自身，无被遮按钮。
- 截图：`f1-visual/B-390-{light,dark}-{风险与问题,人员负载,交付物,项目概览,进度汇报}.png`

**结论**：四视图与进度汇报同口径（操作条与 switcher 纵向堆叠、零重叠、按钮可点），PASS。

## C. 768 项目概览按钮与 crumb-bar 叠印

**补证前状态**：768×1024 浅/深，概览「新建项目/刷新」(y54–86) 与 `.pm-crumb-bar`(y64–100) 重叠 22px，按钮中心命中 crumb-bar；「更多」正常。

**动作**：`@media(561–960)` 顶栏同样改两行 grid（`justify-content:flex-end`），crumb-bar 流式落顶栏之下，消除叠印。

**结果证据**：浅/深两帧 `ov_cb=0`，新建项目/刷新中心命中自身。
- 截图：`f1-visual/C-768-{light,dark}-overview.png`

**结论**：零重叠、按钮可点，PASS。

## D. 320 三处破版

### D1 看板入口缺失 + bento 压矮竖排（已实测 PASS）
- 补证前：320 扁平下拉缺「总览看板」入口（视图不可达）；bento 卡片压至 65px、标签逐字竖排（见 g4-1 他人取证 `../g4-1/G4-1-320-dashboard-light.png`）。
- 动作：ViewSwitcher items 首项补 `{key:'dashboard',label:'总览看板'}`，onPick 开看板；浏览态静态 12 列栅格 ≤560 改两列 auto 行高，`!important` 复位卡片内联跨列/跨行与固定 minHeight，卡片 min-height:116px，标签允许换行（不动拖拽 RGL）。
- 证据：320×844 看板经下拉可达；10 张卡片 minH **119px**（原 65px），标签换行可读；深色抽查可达、10 卡。
- 截图：`f1-visual/D-320-light-dashboard.png`、`f1-visual/D-320-dark-dashboard.png`

### D2 风险矩阵严重列被裁切（代码层修复，填充态本会话不可渲染）
- 补证前：`.ri-mtx` overflowX=visible、scrollW 260 > clientW 190，「严重」列裁切丢失。
- 动作：≤560 列改 `minmax(52px,1fr)`、整体 `min-width:264px`、`overflow-x:auto` 内部横滑，不裁切内容。
- 说明：本隔离实例 4 项目均无风险填充记录（无 `.ri-mtx`），填充态横滑无法在本会话渲染复测，待含种子数据实例复验。空态截图 `f1-visual/D-320-light-risk.png`。

### D3 交付物漏斗单元格逐字竖排断裂（代码层修复，填充态本会话不可渲染）
- 补证前：`.dv-ov-cell` 22–33px、文字逐字竖排断裂。
- 动作：`.dv-ov-row` ≤560 flex-wrap 两列、去竖线、`.dv-ov-sub` 允许换行。
- 说明：本会话无交付物填充记录（无 `.dv-ov-row`），填充态换行待种子实例复验。空态截图 `f1-visual/D-320-light-deliverables.png`。

## 门禁结果
- `pnpm run build`：退出码 0（tsc + cp css + tsdown）。
- `pnpm vitest run`：17 文件 / **203 passed**。
- `pnpm run verify:isolation-only`：资产 before=169 after=169，污染 0，PASS。

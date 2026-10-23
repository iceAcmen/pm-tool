# Impeccable 整站 UI 优化报告（pm-shell / PM 工作台）

> 报告性质：本轮「既有 Operate 应用 UI 视觉优化」的工程台账式复盘。
> 被测对象：`packages/dsh-pm-tool/src/client/panel.tsx` + `panel.css`（`.pm-shell` 面板内部）；**dsh 宿主外壳 excluded**。
> Worktree：`ui-impeccable`；改前基线 commit `5fdb2d7`（= 正式 v0.7.4）。
> 成文时点：2026-10-15。**改后真实 GUI 证据已采集，并经独立测试专家实测回填（testedCommit `740c1e8`，分支 `ui-impeccable`，隔离 worktree `.tmp/ui-impeccable`）**：总计 **60 项 = PASS 53 / FAIL 4 / BLOCKED 3**，不签发全站 PASS。证据根目录 [`docs/verification/impeccable-ui/after/`](../verification/impeccable-ui/after/)；权威逐条判定见验收矩阵 [`docs/testing/impeccable-ui-acceptance.md` §10](../testing/impeccable-ui-acceptance.md)。本报告 §3/§4 各表「视觉实测/after 视觉」列已按该矩阵逐格回填，FAIL 不软化。

---

## 0. 状态声明（先读，避免误读）

- **本报告不签发「全站 PASS」。** 独立验收矩阵 `docs/testing/impeccable-ui-acceptance.md` 已由独立测试专家真实执行后回填（testedCommit `740c1e8`）：**60 项 = PASS 53 / FAIL 4 / BLOCKED 3**。本文据此陈述视觉实测结论；判定权与原始证据以矩阵 §9/§10 与 `after/` 目录为准。
- **已绿（本轮亲自复跑，退出码 0）**：
  - `node packages/dsh-pm-tool/scripts/verify-impeccable-ui-static.mjs` → PASSED（1 条非阻塞 warn，见 §7）。
  - `node packages/dsh-pm-tool/scripts/verify-impeccable-integrity.mjs` → PASS（vendor 62+2 文件指纹、engine 0.1.14 sha256/mode）。
  - `node packages/dsh-pm-tool/scripts/verify-ui-fonts.mjs` → PASSED（离线、本地、预算内）。
  - detector：`detect-after.json` = `[]`（0 finding），对照 `detect-before.json` = 3 条 side-tab warning。
  - 独立重跑 `pnpm build` 退出码 **0**（矩阵 UIP-10 复跑确认）。
- **GUI 实测已采（2026-10-15，独立测试专家，证据 `docs/verification/impeccable-ui/after/`）**：三档容器 shell 实测 inline-width **1440→1160 / 768→712 / 390→334**；浅色对比正文 18.9 / 次级 5.8 / 弱文字 3.71（辅助页脚 ≥3）/ 青绿链接 5.86 / 主按钮 5.52；正确深色态（宿主+OS 深色组合）正文 17.45 / 青绿 8.69 / 主按钮 6.83；roving 方向键/Home/End、抽屉与 MovePicker 焦点圈定/Esc 均正常；INT 写路径（新建/勾选 done 落库 t-1010/t-1011、renumber 正确）在一次性 3212 实例验证，共享 `.ui-preview/data` 22 个业务 JSON INT 前后 sha256 逐字节一致。
- **FAIL（4，不软化，详见 §3/§4 与矩阵 §10）**：**UIV-11**（390 容器 334 宽，九视图 tab 条 scrollWidth=1132 vs clientWidth=334，7/9 tab 被裁、无滚动指示）；**UIV-12 / UIA-04**（仅点宿主深色、不叠 OS 偏好时，品牌青绿 `light-dark()` 未翻，停在浅色 `#2f6f66`，深底上链接对比仅 3.11:1 <4.5）；**UIA-07**（390 档刷新 32×32、项目下拉 h≈25、行内图标按钮 28~32，均 <44×44）。
- **BLOCKED（3）**：UID-08（D9 AI 助手）/ UID-09（D10 副驾）/ UIP-08（AI 草稿确认）——离线基线刻意不注入 LLM provider，顶栏显示「请选择模型」，AI 无法真生成；其「生成草稿→预览→显式确认入库」UI 契约在代码与抽屉中存在。
- 本报告**未改** PRODUCT/DESIGN/CONTEXT、未改验收矩阵任何用例、未改 version/manifest、未 `git commit`。

---

## 1. 工具版本 / 安装 / 命令真实清单与能力边界

### 1.1 版本锁定（来自官方 manifest，非记忆）

| 项 | 锁定值 | 出处 |
|---|---|---|
| skill | `pbakaus/impeccable` tag **skill-v4.5.2**，剥离后 commit `d631a8827f99414d2b6daba4ef08b7f8701751d7` | [`.impeccable/README.md`](../../.impeccable/README.md)、[`docs/external-skills.md` §13](../external-skills.md) |
| engine | **0.1.14**（Rust 编译 Mach-O arm64） | 同上 |
| License | **Apache-2.0**（`NOTICE.md` 记录 ios/android.md 衍生自 ehmo/platform-design-skills，MIT） | manifest |
| 权威 manifest | `vendor/agent-skills/impeccable/manifest.json`（schema v3，全量 sha256/bytes/expected mode） | [`vendor/agent-skills/impeccable/manifest.json`](../../vendor/agent-skills/impeccable/manifest.json) |
| 不可变原文 | `vendor/agent-skills/impeccable/skill/`（62 文件，逐字节） | 同上 |
| 薄引用 | `.agents/skills/impeccable` → vendor skill（symlink，零漂移） | — |

> **v4.5.2 无 normalize**：本 vendor 的 engine 0.1.14 提供的是 `detect`（AI-slop 反模式扫描，如 side-tab）、`engine-probe`、`context` 等参考动词；**没有**「normalize / 自动归一化」这一能力。本轮所有「修复」都是项目侧按 audit 结论手写 CSS/TSX，不是 engine 自动改写。

### 1.2 安装 / 落盘事实（红线遵守情况）

- engine 二进制已预取到 `.impeccable/bin/darwin-arm64/impeccable-darwin-arm64`（sha256 `abbd69d5…`，sidecar 原生校验 OK），经独立安全审查后由安装者置可执行位；**未**经 `vendor/.../scripts/impeccable` launcher 启动（该 launcher 末行会自动下载到 `~/.impeccable` 并联网，红线禁止）。
- **项目 wrapper 禁联网 / 禁 HOOK**：唯一入口是 `packages/dsh-pm-tool/scripts/impeccable-local`（POSIX sh, 0755）。它只放行三个动词，且强制注入离线环境变量：
  - 放行：`engine-probe` / `context` / `detect --json <本地路径>`；拒绝 URL、拒绝其它动词、拒绝 worktree 外绝对路径。
  - 强制：`IMPECCABLE_BIN` / `IMPECCABLE_SKILL_DIR` / `IMPECCABLE_HOME` 指向本 worktree（**绝不写 `$HOME/.impeccable`**）、`DO_NOT_TRACK=1`、`IMPECCABLE_NO_TELEMETRY=1`、`IMPECCABLE_NO_UPDATE_CHECK=1`、`IMPECCABLE_NO_STALENESS_CHECK=1`、`IMPECCABLE_HOOK_DISABLED=1`。
- hook：`.impeccable/config.json` 显式 `"hook": {"enabled": false}`，不装任何 provider 编辑后 hook。
- 基线命令（真实执行留痕）：
  - 改前：`impeccable-local detect --json packages/dsh-pm-tool/src/client` → exit 2（= 3 条 side-tab warning，非工具失败）→ [`detect-before.json`](../verification/impeccable-ui/detect-before.json)。
  - 改后：同 wrapper 同路径重跑 → [`detect-after.json`](../verification/impeccable-ui/detect-after.json) = `[]`。

### 1.3 能力边界（授权 / 禁用动词）

- **允许**（既有应用优化）：critique / audit / polish / bolder / quieter / distill / harden / onboard / animate / colorize / typeset / layout / delight / overdrive / clarify / adapt / optimize / extract / document / operate / mode-*。
- **禁用**（greenfield / live / 联网交互）：`concept-seed` / `new-work` / `live` / `generate` / `serve-question` / `init`（交互式联网）/ `shape` / `craft`。理由：与「既有应用 UI 优化」范围不符。
- engine 只做**静态检测与参考**，**不替代真实 GUI 截图**（矩阵 §0.8 硬门槛）；`critique-before.md` 首行已自标 `DEGRADED`（单上下文，设计评审与证据未隔离）。

---

## 2. PM 业务 / 用户 / 品牌方向与选择理由

方向钉在三份上下文文件，本文只摘要，全文见链接：

- 产品事实：[`PRODUCT.md`](../../PRODUCT.md)（init schema 1）。
- 规范层：[`DESIGN.md`](../../DESIGN.md)（canonical）。
- 施工层：[`DESIGN-CONTEXT.md`](../../DESIGN-CONTEXT.md)（精确 token/几何/字体/验收）。
- Surface brief：[`.impeccable/surfaces/pm-workbench.md`](../../.impeccable/surfaces/pm-workbench.md)。

**业务**：dsh（DeepSeek Harness）内嵌的 PM 工程台账插件面板（`MainPanel` id `pm-tool`）。七类实体（project / task WBS / milestone / risk-issue / meeting / report / deliverable）+ 九视图。核心是**离线可读 JSON 落盘**，不依赖模型/网络；`/pm` 命令与面板双入口同构。

**用户**：中文为工作语言、多为非纯技术背景的 PM；在任务密集的桌面会话里「扫读台账、发现临期/逾期、秒级录入改期」。次要受众：协作方只读查阅（未上线多人协作）。

**模式 = Operate**：进来是为完成任务，不是被界面表达干扰。可扫读、一致、符合宿主预期，优先于个性。

**品牌方向（"The Engineering Ledger 工程台账"）与理由**：
1.  incumbent 太「通用后台模板」（全跟随宿主蓝、4 张 34px 大数字 KPI 卡、卡片层层嵌套），critique 判定有「category-interchangeable」风险。
2. 收敛为**暖纸墨色底 + 唯一克制青绿**：青绿只指「当前/可操作」（≤10% 屏占），红/琥珀/绿只指状态。理由：Operate 工具里颜色是稀缺信号，大面积彩色 = 错。
3. **禁渐变、禁嵌套卡片、禁大号模板 KPI**（三条视觉禁令，矩阵 UIG-02/03/04 硬断言）：分区靠 1px hairline + 留白，表格是一等公民。理由：台账靠对齐与密度，不靠阴影分层。
4. **双主题成立 + 离线零 CDN**：中性面/文字/描边继续读宿主 `--dsw-alias-*` 自动翻转，强调色由 `.pm-shell` 自定；不引网络字体。理由：宿主已提供深浅切换与调色板，越界自造 dark class 反而破坏共生。

---

## 3. 初始问题 P1–P3：来源与已修/未修状态

问题全量字段在 [`issues-before.json`](../verification/impeccable-ui/issues-before.json)（P0×0 / P1×6 / P2×8 / P3×4），审计叙事见 [`audit-before.md`](../verification/impeccable-ui/audit-before.md) 与 [`critique-before.md`](../verification/impeccable-ui/critique-before.md)。下表「已修/未修」依据**本轮复跑的静态校验 + grep + diff**判定；「视觉实测」列已按独立验收矩阵 §10（testedCommit `740c1e8`）逐格回填，PASS 附关键实测值，FAIL 如实写原因。

| ID | 级 | 问题（来源） | 代码层状态（本轮证据） | 视觉实测 |
|---|---|---|---|---|
| UI-01 | P1 | 14 处引用从未定义的 `--pm-border/--pm-text/--pm-bg`，无 fallback（panel.css:860+ 尾部方言） | **已修**：`grep 'var(--pm-border\|var(--pm-text\|var(--pm-bg' panel.css` = **0**；静态校验「悬空 = 0」 | **PASS（UIG-06）**：两主题下每个 `--pm-*` 别名均解析到具体色值、无 undefined/transparent（证据 `after/independent-dark-probe.json`） |
| UI-02 | P1 | restore 恢复预览 5 个 class 零 CSS 规则（危险操作裸文本） | **已修**：`.pm-restore-preview` 已有面板规则（`panel.css:1019`，danger 边框/居中浮层/`pre` 限高滚动）；markup 在 `panel.tsx:453` | **PASS（UIP-07）**：restorePreview 危险预览 UI（危险文案+文件名+确认/取消+自动安全快照）在代码中确认；一次性 INT 环境与 before 均未真执行恢复，故无恢复后读回实测 |
| UI-03 | P1 | 顶栏 6 控件压成两行等高按钮墙，主操作无权重 | **已修**：「新建项目」唯一 `pm-button-primary`（`panel.tsx:504`）；次级收进「更多」下拉（`topMenuOpen`/`aria-expanded` `panel.tsx:510`）；`.pm-top-actions` 加 `flex-wrap:wrap`（`panel.css:162`），窄档 `.pm-top-secondary{display:none}`（`panel.css:913`） | **PASS（UIN-04/UIN-05）**：after 实测「新建项目」唯一 primary h=46（390 达标），次级收进「更多」下拉（`aria-expanded` 正确、键盘可操作），无项目时 AI 入口不可点（证据 `after/10-global-board.png`） |
| UI-04 | P1 | 无 loading 态 + 首屏空态误闪 | **已修**：新增 `loaded` 态（`panel.tsx:350`），分支 `!loaded→<LoadingPanel/>` 先于 `!project→EmptyWorkspace`（`panel.tsx:651`）；`LoadingPanel` 带 `role=status aria-live=polite` + spinner（`panel.tsx:1419`） | **PASS（UIS-05）**：loading 用内联指示（非居中大 spinner），代码契约+静态校验确认；before/after 均无自然 loading 停留可截图（无自然入口） |
| UI-05 | P1 | 9 视图 tab 横滚溢出无指示/分组 | **部分修**：roving 键盘（见 UI-06）已落地；窄档顶栏/工具条已响应化。**滚动渐隐遮罩/分组下拉未见明确实现**——待 after 视觉确认 | **FAIL（矩阵 UIV-11）**：390 容器 inline-width=334，九视图 tab 条 scrollWidth=1132 vs clientWidth=334，7/9 tab 被裁（仅 tasks/milestones 可见、risk 半截），**无滚动渐隐/分组指示**；证据 `after/independent-390-probe.json`、`after/width-390-tasks-independent.png` |
| UI-06 | P1 | tablist 无 roving tabindex / 方向键 / aria-controls | **已修**：`tabIndex={active?0:-1}`（`panel.tsx:1490`）；方向键/Home/End 循环 + 焦点移到新 tab（`panel.tsx:308-324`）；`aria-selected`/`aria-controls`（`panel.tsx:1487`） | **PASS（UIN-01/UIA-01）**：roving 方向键/Home/End 循环切换、`aria-selected/aria-controls` 正确（证据 `after/independent-keyboard-probe.json`）；390 视觉裁切另见 UI-05（UIV-11 FAIL） |
| UI-07 | P2 | 表格单元格横竖全网格 + 6 条横边堆叠 | **方向已修**：token 层 hairline 化、去嵌套；具体竖线去除程度待 after 对比 | **PASS（UIG-03/UIG-05）**：after 九视图截图表格为 hairline 分区、无带边框+阴影嵌套卡片，全站 `.pm-button/.pm-input/.pm-tag` 形状一致（证据 `after/01-tasks.png` 等） |
| UI-08 | P2 | 统计四处重复（ProjectBar/提醒条/Overview 卡/KPI chip） | **已修**：静态校验「无 34px 大数字模板 KPI」；Overview 改页边注式事实清单（`.pm-fact-list` `panel.tsx:2536`）；ProjectBar 事实栏 `.pm-project-facts`（`panel.tsx:1455`） | **PASS（UIG-04/UIV-08）**：overview 为工程台账式事实清单（总任务 9/已完成 2(22%)/进行 4/延期 1…），无 hero 大数字 KPI（证据 `after/07-overview.png`、`after/dark-host-real-overview.png`） |
| UI-09 | P2 | 表格固定 min-width 窄壳右列裁切 | 未单独确认；container query 断点 760/540 在 token 层存在（`container-type:inline-size` `panel.css:80`） | **表格 PASS、tab 条 FAIL**：三档容器实测 inline-width 1440→1160 / 768→712 / 390→334，表格横滚在容器内不溢出 shell（UIV-01 PASS，`after/width-390-tasks-independent.png`）；但 tab 条裁切见 UI-05（UIV-11 FAIL） |
| UI-10 | P2 | 微字 9–10px 低于舒适线 | 字阶固定 px（无 clamp）；gantt/meta 字号是否上收到 ≥11px 待 after 量测 | **PASS（实测）**：字阶固定 px（无 clamp）；实测仅头像首字 10px×9（装饰性首字），正文/表格/meta 未发现其他低于舒适线的小字（矩阵无对应 FAIL） |
| UI-11 | P2 | 点击目标过小（25/17/15px） | 未在本轮静态项单独断言；触控目标 ≥44px 属矩阵 UIA-07 GUI 量测 | **FAIL（矩阵 UIA-07）**：390 档刷新图标按钮 32×32、项目下拉触发器 h≈25、行内图标按钮 28~32，均 <44×44（tab h=46、新建项目 h=46 达标）；证据 `after/independent-390-probe.json` |
| UI-12 | P2 | 提醒条可点 li 纯鼠标 | 静态类对账覆盖；是否补 `role=button/tabIndex/Enter` 待 after/a11y 实测 | **PASS（UIA-01）**：键盘可达整体绿——tab/按钮/抽屉/模态/表格行可 Tab 到达、无键盘陷阱（证据 `after/independent-keyboard-probe.json`）；提醒条 li 未单独造触发，无回归证据 |
| UI-13 | P2 | 抽屉无焦点圈禁（Tab 走出 dialog） | **已修**：新增 `useFocusTrap` hook（`panel.tsx:3206`），DrawerPanel（`panel.tsx:3246`）+ MovePicker（`panel.tsx:1518`）各一处；静态校验 `data-pm-focus-trap` 恰好 2 处 | **PASS（UID-10）**：抽屉与 MovePicker 焦点圈定（青绿聚焦环进入首个输入框）、Esc 关闭、关闭后焦点归还触发元素（证据 `after/independent-keyboard-probe.json`、`after/width-390-drawer-independent.png`） |
| UI-14 | P2 | 深色模式未验证 + 未定义变量深色必破 | UI-01 已修；**深色实测仍缺证**——before 仅 21-theme-dark，after 深色配对待补 | **部分 FAIL（矩阵 UIV-12/UIA-04）**：正确深色态（宿主深色+OS 深色组合）正文 17.45 / 青绿 8.69 / 主按钮 6.83 达标；但**仅点宿主深色、不叠 OS `prefers-color-scheme`** 时品牌青绿 `light-dark()` 未翻（停 `#2f6f66`），深底 `rgb(21,21,23)` 上链接对比仅 **3.11:1 <4.5**。根因 `panel.css:38` `.pm-shell{color-scheme:light dark}`，见 ISS-028 |
| UI-15 | P3 | side-tab 厚左边条 ×3（detector slop） | **已修**：`grep 'border-left: 3/4px' panel.css` = 0；`detect-after.json` = `[]` | **PASS**：detector 0 finding（对照 before 3 条 side-tab warning），after 截图无厚左边条（证据 `after/detect-after.json`） |
| UI-16 | P3 | 死 class（pm-war-room / pm-copilot-confirm） | **部分**：静态对账 285 个 pm-* 类均有规则或 test-hook；但 D 段仍 warn 7 个「CSS 定义而 TSX 未直接引用」类（含 `pm-kpi`/`pm-row-active` 等，多为动态/后代选择器目标，**保留待人工确认，未删**） | **PASS（视觉无回归）**：静态对账 285 个 `pm-*` 类均有规则或 test-hook；7 个「CSS 定义而 TSX 未直接引用」类（`pm-kpi`/`pm-row-active` 等，多为动态/后代选择器目标）保留待人工确认，after 视觉未见破版 |
| UI-17 | P3 | 错误 Notice 用 `role=status`（应 alert） | **已修**：静态校验「Notice role 分级：失败 alert / 成功 status；aria-live assertive / polite」 | **PASS（UIS-03/UIS-04）**：成功走安静内联 `role=status`（~3.5s 自隐）、非覆盖式深色大卡；失败内联+红 toast 不吞错、不泄 stack/Key |
| UI-18 | P3 | `window.confirm/alert` 与宿主 UI 不一致 | **未在本轮移除**：保留为保护回归项（矩阵 UIP-06 明确要求备份前 `window.confirm` 确认）。属有意保留，非遗漏 | 不适用（保护回归） |

> 说明：UI-09/10/11/12 这类「量尺寸/对比度/窄壳」问题**本就是 GUI 断言**，静态 grep 无法证明其完成；现已由独立测试专家真实 Chrome 实测回填（矩阵 §10），其中 **UI-05/UIV-11（tab 裁切）与 UI-11/UIA-07（触控目标）FAIL、UI-14/UIV-12+UIA-04（宿主单深色品牌色不翻）部分 FAIL**，不预写 PASS。

---

## 4. 九页 / 导航 / 表单 / 抽屉 / 弹层 优化前后对比

before 基线：[`before/`](../verification/impeccable-ui/before/)（21 张真实浏览器像素，捕获视口 675×745 窄，隔离宿主 127.0.0.1:3211，fixture 冻结）。**after/ 已采集**（[`after/`](../verification/impeccable-ui/after/)：01–19 配对视图/抽屉、21 深色、width-1440/768/390、dark-host-real-*、independent-*.json、after-measurements.json）。下表 after 列已按矩阵 §10 实测回填；「代码层改动」列是有 diff/校验支撑的事实，不等同于视觉结论。

### 4.1 九视图

| 视图 | before 证据 | 代码层改动（本轮 diff） | after 视觉 |
|---|---|---|---|
| V1 tasks 任务表 | `before/01-tasks.png` ✅ | 表格 token 化、sticky 表头、行高 39px 契约；roving 键盘不动 j/k | **PASS（UIV-01/02）**：after/01-tasks.png WBS 缩进 1/1.1/1.2 保留、行可开抽屉、checkbox↔正文间距合规；390 下表格横滚不溢出 shell（`after/width-390-tasks-independent.png`）；j/k、空格勾选、Enter 热键不劫持输入框 |
| V2 milestones 里程碑 | `before/02-milestones.png` ✅ | 语义标签 `color-mix` 12% 柔底 | **PASS（UIV-03）**：after/02-milestones.png 列可读，目标日期/状态标签在 390 不截断/不溢出 |
| V3 risk-issues 风险问题 | `before/03-risk-issues.png` ⚠️（捕获时活宿主缓存空表，实际应 2 条） | 等级色只作辅助、附文字 | **PASS（UIV-04）**：after/03-risk-issues.png 风险等级/状态附文字（待处理/高、跟进中/中），不只靠颜色区分 |
| V4 meetings 会议 | `before/04-meetings.png` ✅ | 行动项区同词表 | **PASS（UIV-05）**：after/04-meetings.png 会议列表+行动项区可读，「转为任务」文字入口在 |
| V5 reports 进度汇报 | `before/05-reports.png` ✅ | `DeltaBadge` 正负零三态带文字箭头 | **PASS（UIV-06）**：after/05-reports.png DeltaBadge 正/负/持平三态带文字箭头，非仅颜色 |
| V6 deliverables 交付物 | `before/06-deliverables.png` ✅ | 版本只增留痕样式 | **PASS（UIV-07）**：after/06-deliverables.png 列表可读；repoUrl/branch 可选字段不溢出 |
| V7 overview 总览 | `before/07-overview.png` ✅（旧：4 张大数字 KPI） | **KPI 大卡 → 页边注式 `.pm-fact-list`**（`panel.tsx:2536`）；静态校验无 34px 大数字 | **PASS（UIG-04/UIV-08）**：after/07-overview.png Summary 行对齐网格、间距一致，2 列网格在窄容器正确堆叠，无 hero 大数字 KPI |
| V8 gantt 甘特 | `before/08-gantt.png` ✅ | 几何不变量守住：左标签列 230px、行高 24px、条 top3/高18、今日线、`pm-gantt-hint role=status`（静态 G 段全 ok） | **PASS（UIV-09/UIS-06）**：after/08-gantt.png 甘特条/今日线/依赖线两主题可读、条可点；`.pm-gantt-hint` 渲染宽度 >0 |
| V9 people 人员负载 | `before/09-people.png` ✅ | 未分配置顶、逾期/临期排序 | **PASS（UIV-10）**：after/09-people.png 人员卡片、未分配置顶、逾期/临期（7 天边界）排序可读；「没有匹配负责人」空态文案在 |

### 4.2 导航 / 弹层 / 状态

| 元素 | before 证据 | 代码层改动 | after 视觉 |
|---|---|---|---|
| N1 视图 tab 行（9 tab） | 截图 04–06 实证横滚无指示 | roving tabindex + 方向键/Home/End + `aria-selected/controls`（UI-06） | **键盘 PASS（UIN-01）/ 窄档视觉 FAIL（UIV-11）**：9 tab 计数徽标正确、roving 方向键/Home/End 与 `aria-selected` 正常（`after/independent-keyboard-probe.json`）；390 下 tab 条 scrollWidth=1132 vs clientWidth=334、7/9 tab 被裁无滚动指示（`after/width-390-tasks-independent.png`） |
| N2 项目条 ProjectBar | — | `.pm-project-facts` 事实栏收敛（UI-08） | **PASS**：after/01-tasks.png 项目条事实栏与概览事实清单同源、无重复 KPI 卡 |
| N3 顶栏动作 | before 01–06 全为两行按钮墙 | 唯一 primary「新建项目」+「更多」下拉 + flex-wrap（UI-03） | **PASS（UIN-04/UIN-05）**：顶栏不再两行按钮墙；「新建项目」唯一 primary（h=46，390 达标）；无项目时 AI 入口收进「更多」且不可点 |
| N4 提醒条 ReminderStrip | — | li 键盘可达性待 a11y 实测（UI-12） | **PASS（UIA-01）**：键盘可达整体绿（无键盘陷阱）；提醒条 li 未单独造触发，无回归证据 |
| N5 MovePicker 移动选择 | `before/14-move-picker.png` ✅ | 加 `useFocusTrap`（`panel.tsx:1518`） | **PASS（UIN-02/UID-10）**：after/14-move-picker.png 候选树排除自身与后代；焦点圈定/Esc 正常；移动=改父+整项目 renumber 走同一 storage-json 单写队列（INT 已证创建/更新落库） |
| N6 GlobalBoard 总览看板 | `before/10-global-board.png` ✅ | 不写业务数据（保护回归 UIN-03） | **PASS（UIN-03）**：after/10-global-board.png 总览看板经「更多」打开，只读不写业务数据、项目切换只读 |
| N7 「更多」下拉 | before 未展开 | `aria-expanded` 正确、键盘可操作（待 GUI） | **PASS（UIN-04）**：after/10-global-board.png 菜单项（备份/恢复/导出/看板）顺序可读、`aria-expanded` 正确、键盘可操作 |
| N8 restore 确认内联面板 | **before 未执行**（仅取消，未 restore） | `.pm-restore-preview` 危险面板已实现（UI-02） | **PASS（UIP-07，代码契约级）**：restorePreview 危险预览（危险文案+文件名+确认/取消）与恢复前自动安全快照在代码中确认；一次性环境与 before 均未真执行恢复，无恢复后读回实测 |
| N9 批量操作条 | — | 类对账覆盖 | **PASS**：after 截图无破版；批量操作条控件词表与全站一致（UIG-05） |
| S1–S7 状态（empty/loading/error） | `before/19-empty-project.png` ✅；**loading/error BLOCKED 未采** | `LoadingPanel`（UI-04）；Notice role 分级（UI-17） | **S1/S2/S3 PASS（UIS-01/02/03/04/05/06）；loading/error 自然触发仍 BLOCKED**：after/19-empty-project.png 空工作区有「暂无任务记录+用 AI 一键生成 WBS」引导、表格空态文案+行动按钮表头不断裂；成功安静内联 role=status、失败内联不吞错、loading 内联指示、甘特提示 role=status 渲染宽>0；无自然 loading/error 入口故未造触发截图 |

### 4.3 十抽屉 / 表单

| 抽屉 | before 证据 | after 视觉 |
|---|---|---|
| D2 project-edit | `before/11-drawer-project-edit.png` ✅ | **PASS（UID-01）**：after/11-drawer-project-edit.png 项目表单字段（项目名称*/开始日期*/目标日期*/仓库地址可选/分支可选）、required 标记、错误文案可见 |
| D3 task-create / D3 task-edit | `before/12-…` `13-…` ✅（13 含前置依赖勾选） | **PASS（UID-02/UID-12）**：after/12/13 + `after/width-390-drawer-independent.png`——任务表单（标题*/状态/优先级/执行人/起止/进度/前置依赖）布局一致、label 关联；390 抽屉近全宽(359)、内部可滚动、字段不截断、关闭 X 可达、body 无横滚 |
| D4 milestone-create | `before/15-…` ✅ | **PASS（UID-03）**：after/15-milestone.png targetDate 等字段一致，日期控件不溢出抽屉 |
| D6 meeting-create | `before/16-…` ✅ | **PASS（UID-05）**：after/17-meeting.png 会议表单+MeetingActions 行动项区布局一致 |
| D7 report-create | `before/17-…` ✅ | **PASS（UID-06）**：after/18-report.png 汇报表单/生成流程一致 |
| D8 deliverable-create | `before/18-…` ✅ | **PASS（UID-07）**：交付物 repoUrl/branch 可选字段一致、不溢出 |
| D1 project-create / D5 risk-issue / D9 ai / D10 copilot | **未单独截**（D5 活宿主风险表空、表单未开） | **D1/D5 PASS（UID-01/04）；D9/D10 BLOCKED（UID-08/09/UIP-08）**：项目创建/风险表单字段与 required 标记在（与 D2 同词表）；AI 助手「生成草稿→预览→显式确认入库才落库」与副驾只读诊断+确认卡 UI 契约在代码与抽屉中，但离线基线刻意未注入 LLM provider、顶栏显示「请选择模型」，无法真生成 |

### 4.4 before 覆盖诚实缺口（来自 `before/README.md`），与改后回填对照

- **三档宽度：before 时 BLOCKED → after 已真实采集（成功）**：外层 viewport 1440/768/390 实测面板容器 inline-width = **1160 / 712 / 334**（证据 `after/width-1440-tasks.png`、`width-768-tasks.png`、`width-390-tasks-independent.png`、`after/independent-390-probe.json`）；表格横滚不溢出 shell，但 **390 下九视图 tab 条 7/9 被裁（UIV-11 FAIL）**。
- **restore 未真正触发**（只生成非破坏性备份 JSON，22 条 fixtures 完好）；loading/error 态无自然入口、未造数据，**after 仍 BLOCKED**（判定依据代码契约+静态校验，非截图实测）。
- **深色：before 仅两张 → after 已采但部分 FAIL**：`after/21-theme-dark*.png`、`after/dark-host-real-overview.png`、`after/dark-host-real-tasks.png`、`after/independent-dark-probe.json`。正确深色态（宿主+OS 深色组合）对比达标（正文 17.45/青绿 8.69）；**仅宿主深色路径 FAIL**（品牌青绿 `light-dark()` 未翻、链接 3.11:1，见 UIV-12/UIA-04、ISS-028）。
- 风险视图 before 截图显示 0 条是「活宿主启动时缓存空表」所致，非真 0（after/03-risk-issues.png 已见 2 条）。
- **AI 三态 BLOCKED**：UID-08/UID-09/UIP-08——离线基线未注入 LLM provider，顶栏「请选择模型」，草稿确认链路无法真生成（UI 契约在代码中存在）。

---

## 5. 设计规范摘要（全文链接 DESIGN）

> 完整 token 表、浅/深双主题取值、甘特逐页几何见 [`DESIGN.md`](../../DESIGN.md)（规范层）与 [`DESIGN-CONTEXT.md`](../../DESIGN-CONTEXT.md)（施工层）。此处仅摘要。

- **Tokens（色）**：墨 `#26241f` / 次级 `#57534a` / 弱 `#8a8478`；暖纸 `#faf8f3` / 抬升 `#ffffff`；hairline `#e5dfd3`/柔 `#efe9dd`；唯一强调青绿 `#2f6f66`（深 `#79c0b4`）；语义 danger `#b2402c` / warning `#a86f12` / success `#3a7a52`。实现用 `light-dark()` 双主题 + `color-mix()` 柔底（`panel.css:40-60`）。
- **Font**：UI 中文走系统黑体栈（`--pm-font-sans` PingFang SC 起）；数据/日期/ID 走等宽 `--pm-font-mono`；标题点缀 Songti SC。禁 Arial/Inter/Roboto。**自托管 woff2 已 vendor 但运行时接线 deferred（见 §7）。**
- **Spacing**：4 / 8 / 14 / 22px 刻度；内容左右版心 22px（窄窗 14px）。
- **Radius**：控件/输入 4px，标签胶囊 999px，甘特条 4px；无 >8px 友好风大圆角。
- **Focus**：`:focus-visible` 2px 青绿 outline + 1px offset（`panel.css:89-93`），两主题可见。
- **Motion**：抽屉进场 180ms `translateX(24→0)`；`prefers-reduced-motion` 全量降级；不做编排式加载动画。
- **响应式**：`container-type: inline-size`，断点 760 / 540px 降栏数/塌列；字号不随容器缩放（无 fluid clamp）。
- **a11y**：正文 ≥4.5:1、UI/焦点 ≥3:1（浅深两主题都须 AA）；tablist roving、抽屉 focus trap、Notice role/aria-live 分级。

---

## 6. 可复用代码片段（只摘本项目最终代码，注明源位置）

> 以下均摘自本轮最终代码 `panel.css` / `panel.tsx`，**未复制第三方 skill 正文**。短片段仅作模式参考。

**① token 层：单一声音 + 双主题（`packages/dsh-pm-tool/src/client/panel.css:40-67`）**
```css
--pm-accent: light-dark(#2f6f66, #79c0b4);
--pm-accent-soft: color-mix(in srgb, var(--pm-accent) 12%, transparent);
--pm-blue: var(--pm-accent);            /* 旧别名收敛到同一青绿 */
--pm-danger: light-dark(#b2402c, #e07a66);
--pm-warning: light-dark(#a86f12, #d9a75a);
--pm-font-sans: 'PingFang SC','Noto Sans CJK SC','Microsoft YaHei', system-ui, sans-serif;
--pm-font-mono: 'IBM Plex Mono', SFMono-Regular, ui-monospace, monospace;
```
要点：中性面/描边继续读宿主 `--dsw-alias-*`，品牌青绿/语义色在 `.pm-shell` 自有；组件层不直接读 `--dsw-alias-*`（静态校验 UIG-07 ok）。

**② focus trap（`panel.tsx:3218-3231`，hook 定义 `:3206`）**
```ts
if (ev.key === 'Escape') { ev.stopPropagation(); onEscape(); return }
if (ev.key !== 'Tab') return
const items = itemsIn()
const first = items[0], last = items[items.length - 1]
if (ev.shiftKey) { if (active === first || !root.contains(active)) { ev.preventDefault(); last.focus() } }
else if (active === last || !root.contains(active)) { ev.preventDefault(); first.focus() }
```
配合 `useFocusTrap(drawerRef, onClose)`（`panel.tsx:3246`，抽屉）与 `:1518`（MovePicker），`data-pm-focus-trap` 恰好 2 处。

**③ roving tabs + 方向键（`panel.tsx:308-324`；tab 组件 `:1486-1490`）**
```ts
if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); focusTab(order[(idx+1)%order.length]) }
else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { ... order[(idx-1+order.length)%order.length] }
```
```tsx
<button role="tab" id={id} aria-selected={active} aria-controls={controls}
        tabIndex={active ? 0 : -1} onClick={onClick}>…</button>
```

**④ loading / empty 分离（`panel.tsx:651-654` 与 `:1419-1423`）**
```tsx
: !loaded ? <LoadingPanel/>
  : !project ? <EmptyWorkspace onCreate={…}/>
  : <> …
```
```tsx
<div className="pm-loading" role="status" aria-live="polite">
  <span className="pm-loading-spinner" aria-hidden="true"/><p>正在加载项目台账…</p>
</div>
```

**⑤ 危险操作 restore 预览面板（`panel.css:1019-1035`）**
```css
.pm-restore-preview { position: fixed; top:50%; left:50%; transform: translate(-50%,-50%);
  width: min(520px, calc(100vw - 32px)); padding: 16px;
  background: var(--pm-surface); border: 1px solid var(--pm-danger);
  border-radius: var(--pm-radius-md); box-shadow: 0 6px 24px rgb(31 35 41 / 14%); }
```

**⑥ 页边注式事实清单（`panel.tsx:2536-2542`，取代大数字 KPI）**
```tsx
<dl className="pm-fact-list" aria-label="项目事实">
  <div className="pm-fact-row"><dt>总任务数</dt><dd>{tasks.length}</dd></div>
  <div className="pm-fact-row"><dt>已延期</dt><dd data-tone={overdue ? 'danger' : undefined}>{overdue || '无'}</dd></div>
```

---

## 7. 测试 / 证据 / 检测结果与遗留

### 7.1 本轮实跑（退出码 0）

| 校验 | 结果 | 证据 |
|---|---|---|
| `verify-impeccable-ui-static.mjs` | **PASSED**（token 链悬空 0 / 组件层零 hex / 零 gradient / 零 clamp / 285 类对账 / focus-trap 恰好 2 / Notice role 分级 / 甘特几何不变量 / 零外联） | 见脚本输出 |
| `verify-impeccable-integrity.mjs` | **PASS**（source commit、62+2 文件、engine 0.1.14 sha256 ok mode 0755） | — |
| `verify-ui-fonts.mjs` | **PASSED**（3 个 woff2 本地存在、共 209.4KB ≤ 500KB 预算、无 CDN、无 Arial/Inter/Roboto） | — |
| detector before → after | 3 条 side-tab warning → **0**（`[]`） | [`detect-before.json`](../verification/impeccable-ui/detect-before.json) / [`detect-after.json`](../verification/impeccable-ui/detect-after.json) |

### 7.2 唯一非阻塞 warn（静态 D 段）

CSS 定义但 TSX 未**直接**引用的 7 个类：`pm-kpi, pm-kpi-row, pm-row-active, pm-row-check, pm-task-when-overdue, pm-task-when-soon, pm-top-secondary`。脚本判定其**可能是动态/后代选择器目标，保留待人工确认，未自动删除**——避免误删运行中样式。

### 7.3 字体未运行接线事实（重要，勿误读为"已生效"）

- woff2 已 vendor：IBM Plex Sans Variable（拉丁/数字，122KB）+ IBM Plex Mono regular/medium（各 ~46KB），来源 IBM/plex tag v6.4.2，OFL-1.1，见 [`fonts/`](../../packages/dsh-pm-tool/src/client/fonts/) 与 [`fonts.css`](../../packages/dsh-pm-tool/src/client/fonts.css)。
- **但运行时未接线**：① `panel.tsx` 中**没有** `import './fonts.css'`；② `panel.css:65` 的 `--pm-font-sans` 栈里**没有**引用自托管的 `IBM Plex Sans`；③ build 脚本未把 `fonts/*.woff2` 拷到 `lib/client/fonts/`。
- 后果（`fonts/NOTES-BUILD.md` 自述）：`@font-face` 已声明但 woff2 运行时可能 404，浏览器自动回落系统字体（`font-display: swap`），**不报错、不阻塞渲染**；中文本就走系统黑体，故中文排版不受影响，仅拉丁/数字临时用系统无衬线/等宽。
- 待构建/TSX 侧补：`import './fonts.css?raw'` + 拷贝 woff2 到运行时相对位置（或注入时重写 base URL）。本任务按边界未改 `package.json` / `tsdown.config.ts`。

### 7.4 遗留（已按独立验收矩阵 §10 回填，testedCommit `740c1e8`）

- **已实测签发（PASS 53）**：三档容器 inline-width（1160/712/334）、浅/组合态深色对比度、roving 键盘与焦点圈定/Esc、INT 写路径（t-1010/t-1011 新建/勾选 done 落库、renumber 正确）、`pnpm build` 独立重跑退出 0、共享 `.ui-preview/data` 22 个业务 JSON INT 前后 sha256 逐字节一致。
- **FAIL 4 项（本轮不修，已建档 ISS-028/ISS-029）**：UIV-11（390 tab 条 7/9 被裁无滚动指示）、UIV-12+UIA-04（仅宿主深色品牌色 `light-dark()` 未翻、链接 3.11:1；根因 `panel.css:38` `.pm-shell{color-scheme:light dark}` 覆盖宿主继承）、UIA-07（390 档图标按钮 28~32、项目下拉 h≈25 <44×44）。
- **BLOCKED 3 项**：UID-08/UID-09/UIP-08（AI 草稿/副驾/确认入库——无 LLM provider 可测，UI 契约在代码中存在）。
- **仍缺证**：loading/error 自然触发截图（无自然入口）；restore 真执行后的读回（一次性环境未造）。
- **P3 保留**：UI-16 七个「疑似死类」待人工确认；UI-18 `window.confirm` 为**有意保留**（保护回归 UIP-06）；字体运行时接线（§7.3）未做。

---

## 8. 文件清单 / 回滚边界 / 宿主 excluded

### 8.1 本轮改动文件（`git diff --name-only 5fdb2d7`，未提交）

```
.gitignore                                              (+16：忽略 .impeccable/bin|home、.ui-preview)
docs/external-skills.md                                 (§13 追加 impeccable vendor 治理)
docs/testing/README.md                                  (索引)
packages/dsh-pm-tool/scripts/verify-gui-contract.mjs   (微调)
packages/dsh-pm-tool/scripts/verify-web.mjs            (微调)
packages/dsh-pm-tool/src/client/panel.css              (545 行变更，重写 token 层/收尾部方言)
packages/dsh-pm-tool/src/client/panel.tsx               (310 行变更：focus trap/roving tabs/loading/restore 样式接线/顶栏)
```
新增（untracked）：`PRODUCT.md` `DESIGN.md` `DESIGN-CONTEXT.md`、`docs/testing/impeccable-ui-acceptance.md`、`docs/verification/impeccable-ui/`（含 before/、两份 detect、audit/critique/issues）、`fonts.css` + `fonts/`、`scripts/impeccable-local` + 三个 verify 脚本、`vendor/agent-skills/impeccable/`、`.agents/skills/impeccable` symlink。

### 8.2 回滚边界

- 视图层回滚 = `git checkout 5fdb2d7 -- packages/dsh-pm-tool/src/client/panel.css packages/dsh-pm-tool/src/client/panel.tsx`；新增文档/字体/vendor 为 untracked，删除对应目录即可。
- **未改业务真源**：`src/core/*` 纯函数、七类 `*RecordSchema`、`storage.ts` 单写队列、domain compatibleVersions、命令层——本轮一行未动（矩阵 §0.1/§0.2）。回滚视图层不影响数据写路径。

### 8.3 宿主 / 上游 excluded（不验不动）

- dsh 外壳：侧栏/顶栏/全局布局/主题——只读，品牌只活在 `.pm-shell`。
- 正式 `main` checkout（v0.7.4 @ `5fdb2d7`）、`~/Projects/dsh-pm/deepseek-harness` 上游——只读。
- 不写 `$HOME`/全局/IDE/壳配置；不装 hook；无 telemetry（`DO_NOT_TRACK=1`）。
- 本报告与索引改动**留在 `ui-impeccable` worktree，不 `git commit`**。

---

### 收尾状态（2026-10-15，独立测试专家回填后）

1. ✅ `after/` 已采集：9 视图 + 抽屉/弹层/状态配对图（01–19）、深色（21-theme-dark*、dark-host-real-*）、三档宽度（width-1440/768/390）、independent-*.json 探针与 after-measurements.json。
2. ✅ 本报告 §3/§4 各视觉单元格已按矩阵 §10 回填（容器 inline-width、对比度、触控目标量测均在）。
3. ✅ 独立验收矩阵 `docs/testing/impeccable-ui-acceptance.md` §9/§10 已由测试专家签发：**53 PASS / 4 FAIL / 3 BLOCKED**（testedCommit `740c1e8`），不签发全站 PASS。
4. ⏳ 剩余：修 4 项 FAIL（ISS-028 深色 color-scheme、ISS-029 390 tab 裁切/触控目标）；AI 三项待注入 LLM provider 后复测；字体运行时接线完成后删除 §7.3「未接线」标注。

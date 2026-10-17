# 系统 UI 规范分节建议（#50 系统 UI 规范制定 · 技能专家建议稿）

> 日期：2026-10-17　状态：**建议稿 / 未冻结 / 供主规范撰稿人裁剪采纳**
> 适用仓库：`/Users/bytedance/Projects/dsh-pm/pm-tool`（宿主 `deepseek-harness` 只读）
> 性质：本文件是**分节规范建议文本 + 来源标注**，不是主规范本身，不改产品代码、不 commit、不动现存文档。
> 视觉锚点：一切色值 / 间距 / 圆角 / 字阶 / 深浅两态以 `docs/design/p2-2-visual-token-baseline-20261017.md`（下称「基线」）与真实源码为准；技能建议与项目 token 冲突时**以项目为准**，冲突与排除理由见 §0.3。

## 0. 方法、证据口径与冲突排除

### 0.1 调用的技能（均先全读 SKILL.md 再按其真实用法调用）
- **ui-ux-pro-max**：`scripts/search.py --domain ux|color|typography|icons` 定向检索 + `references/quick-reference.md`（§1 无障碍 / §5 响应式 / §6 排版色彩 / §8 表单反馈 / §9 导航）+ `references/pro-rules.md` 预交付清单。
- **ux-ui-skills / product-design**：`scripts/search.py --query ... --limit --diagnostics`，命中本地 `data/knowledge.jsonl`（expert-tool / critical-states / responsive-relationships / theme-from-context / human-review）。
- **ux-ui-skills / dashboard-redesign**：`references/interaction-accessibility-qa.md`（状态模型、筛选与下钻契约、响应式、验收写法），按需引用。
- **ux-ui-skills / ux-ui-audit**：`references/evidence-and-severity.md`（证据等级 / S0–S3 / Opportunity）、`accessibility-and-standards.md`（WCAG 2.2 AA 基线、核心测试协议）、`visual-craft.md`（沟通缺陷 / a11y 风险 / System drift / 工艺机会四分）。

### 0.2 证据等级图例（每条建议后标注；沿用 ux-ui-audit 证据类与仓库 G3 口径）
| 标记 | 含义 | 在本项目的落点 |
|---|---|---|
| **【基线冻结】** | 已写入 P2-2 冻结规范的设计约束 / 静态计算值 | 基线 §1、§2；可直接进主规范，无需再证 |
| **【源码核真·DOM】** | 对 `packages/dsh-pm-tool/src/client/**` 静态直读成立（token 定义、类名、ARIA 属性、断点、状态样式），**不等于已在浏览器实测** | 需 G3 真实 GUI 目视 / AT 复验 |
| **【G3 采证线索】** | `docs/testing/g3-evidence-receipt-20261017.md` 已登记批次证据；最终 PASS/FAIL 以独立测试专家审证为准 | 不替代目视结论 |
| **【技能惯例·待验证】** | 来自技能本地准则 / 行业惯例，项目内尚无实测或源码支撑；进主规范时必须标注「待验证」，不得写成已达标 | 需 G3 或专项取证 |

> 证据强度排序（ux-ui-audit + G3 工作表一致）：**observed（实见动作/状态）> measured（实测对比/工具量值）> DOM/源码/token > 截图 > 二手**。静态计算色值、DOM 断言、mockup 标注均不得冒充目视 PASS。

### 0.3 技能建议与项目冲突的排除日志（一律不采纳，理由在此固化）
1. **营销蓝 CTA / 琥珀强调色 → 排除。** `--domain color` 返回的 SaaS 通用板（`#2563EB` 蓝填充主按钮、`#EA580C` 琥珀 accent、政府 navy 板）与本项目冲突：本项目主按钮为**中性填充**（`--dsw-alias-button-primary-fill`，浅近黑 `rgb(15,17,21)` / 深反白，白字 18.9:1，【基线冻结】+【提案实测】），蓝色（`--pm-accent` / 链接 `--pm-link`）只用于链接、选中态、焦点描边，**不做大面积 CTA 填充**。
2. **远程 Google 字体 / 衬线展示字 / 等宽数据字体 → 排除。** `--domain typography` 返回的 Inter/Playfair、Fira Code、Plus Jakarta 等外部字体配对不采纳：项目沿用宿主系统栈 `--pm-font-sans`，**不打包、不引入远程字体**（【基线冻结】§1.7）；数字对齐用 `font-variant-numeric: tabular-nums`，不拿等宽字体替代正文。
3. **44×44pt / 48dp 触控目标作为全产品硬指标 → 降级为窄窗/触屏条件项。** 技能 Touch 章与 pro-rules 的 44pt 来自移动原生场景；本产品是桌面优先专家工具，桌面紧凑控件高 32px（【源码核真·DOM】`.pm-button min-height:32px`、`.pm-icon-button 32×32`）。WCAG 2.2 §2.5.8 的 24×24 CSS px 下限才是 Web 底线；44px 仅在 390 触屏形态要求。
4. **mobile-first 与「全部堆叠成单列」→ 排除。** 技能 `mobile-first` 指消费级 App；本项目桌面成熟、窄窗是适配不是重做，比较关系（master-detail、表格身份列、堆叠条）必须保留（product-design knowledge「responsive-preserve-relationships」）。
5. **骨架屏 / shimmer 用于 >1s 等待 → 不启用。** 本地离线数据秒开；仅异步生成（AI generate / 整批 / 逐步）路径需要「禁用 + 加载」，常规视图不引入骨架。
6. **toast 3–5s 自动消失作为通则 → 修正。** 技能 `toast-dismiss` 适用于非关键信息；本项目**错误 Notice 不自动消失**（防用户漏掉错误），成功/信息可定时或手动关（【准备稿】C2）。
7. **技能示例的 `focus:ring-blue-500` 硬编码蓝 → 替换。** 焦点环必须取 `--pm-accent` 语义 token，禁止组件内写死蓝色。

---

## A. 视觉 token 与主题（浅深两态治理）

### A-1 规范条目建议文本
1. **单层语义 token 唯一真源**：组件只允许引用 `--pm-<category>-<role>[-state]` 语义层（color/text/surface/line/control/motion/chart）；命名语法与分层沿用基线 §2：宿主原始别名（`--dsw-*`，只读）→ 单层 `--pm-*` 语义层 → 旧别名（同值保留，不删不改）→ 组件样式。**组件内禁止裸 hex、禁止绕过语义层直取宿主别名**（新增组件时）。【基线冻结】
2. **宿主别名优先 → 项目 fallback**：每个语义 token 解析顺序固定为「宿主别名缺失才落项目 fallback」；fallback 仅补 AA 中性与缺失项，**不得覆盖宿主主题**。【基线冻结】
3. **浅深两态成对治理，不是机械反色**：浅色由 `.pm-shell` 作用域 fallback 给定；深色跟随宿主 `body[data-ds-dark-theme]`，**本地不新建第二套 dark 开关、不机械反色**；阴影由宿主暗色覆写自动提亮（`--pm-shadow-menu/modal` 深色版已在源码加重，【源码核真·DOM】panel.css:165-166）。【基线冻结】+【源码核真·DOM】
4. **语义角色表（冻结值，主规范直接收录）**：
   | 角色 | token | 浅色解析 / fallback | 用途边界 |
   |---|---|---|---|
   | 画布 | `--pm-canvas` | `--dsw-alias-bg-base`（fallback `#fff`） | 面板最底层 |
   | 表面 | `--pm-surface` | `--dsw-alias-bg-layer-1` | 卡片/菜单/弹层 |
   | 表面抬升 | `--pm-surface-2` | `--dsw-alias-bg-layer-2` | 输入底、hover 浅底、徽章底 |
   | 文本主 | `--pm-text` | `--dsw-alias-label-primary`（fallback `#1c1c1e`） | 标题/正文 |
   | 文本次 | `--pm-text-2` | `--dsw-alias-label-secondary`（白底 5.80:1） | 次要正文 |
   | 文本辅助 | `--pm-muted` | 浅色强制 `#696e74`（白底 5.14:1；surface-2 上 4.75:1） | 次要说明，**可上 surface-2** |
   | 文本装饰 | `--pm-faint` | 浅色强制 `#71767c`（白底 4.58:1；surface-2 仅 4.23:1） | **仅画布/表面元信息；落 surface-2 禁用，改 muted** |
   | 品牌动作 | `--pm-accent` | `--dsw-alias-state-business-primary` | 链接、选中、焦点描边；**不做 CTA 填充** |
   | 主按钮底 | `--pm-primary-fill` | `--dsw-alias-button-primary-fill`（浅近黑/深反白） | 唯一主按钮，中性 |
   | 主按钮字 | `--pm-on-primary` | `--dsw-alias-label-primary-foreground` | 已存在，保留 |
   | 链接 | `--pm-link` | 浅 `#4868b2`（5.39:1 AA）；深走宿主 link | 文本链接；**禁用 4.23:1 的 `#4176e6` 作文字** |
   | 成功/警告/危险 | `--pm-success/--pm-warning/--pm-danger` | 宿主 state-success/warn/error-primary 别名 | 仅 done / 阻塞临期 / 逾期删除错误 |
   | 边框弱/更弱 | `--pm-line/--pm-line-soft` | border-l2 / border-l1 | 常规分隔 / 组内 hairline |
   | 悬停底 | `--pm-hover` | `--dsw-alias-interactive-bg-hover` | 行/项 hover |
   【基线冻结】§1.2；token 定义已在 panel.css:30-142 核真【源码核真·DOM】。
5. **禁止项（写进主规范红线）**：暖黄/偏黄底、新品牌色、品牌蓝大面积填充 CTA、渐变、玻璃拟态、光晕、彩色投影；图表 S4 不定义不启用；`--pm-ai-*` 三槽位本批只定义不启用（未来 P2-6，中性底 + 虚线边 + 文字/图标，不用紫色）。【基线冻结】§1.2/§2
6. **主题选择依据（治理条款）**：浅/深行为由宿主环境与任务决定，不按行业标签套模板（product-design knowledge「theme-from-context-not-industry」；【技能惯例·待验证】，本项目已由宿主决定，仅作新增表面时的裁决原则）。

### A-2 来源标注
【基线冻结】§1.2/§2；【源码核真·DOM】panel.css:30-142（token 定义）、165-166（暗色阴影）；【技能:pro-max】`color-semantic`、`color-dark-mode`（quick-reference §6）；【技能:pd】theme-from-context；【排除】营销蓝/琥珀板见 §0.3-1。
**待验证**：深色次文本/状态色以宿主别名已调优值为准，开发侧只做计算复核，深浅双态逐角色实测对比留 G3（基线 §6 已知限制）。

---

## B. 间距 / 圆角 / 密度档位

### B-1 规范条目建议文本
1. **间距阶（theme-independent，沿用 `--sp-*`，冻结值）**：`sp-1 4 / sp-2 8 / sp-3 12 / sp-4 16 / sp-5 20 / sp-6 24 / sp-8 32 / sp-9 40 / sp-10 48 / sp-12 64`。组件内边距绑定阶；**页面局部留白不提成全局 token**；禁止「里程碑式大内边距撑场面」。【基线冻结】§1.5；【源码核真·DOM】panel.css:94-95。
2. **圆角（跟随宿主，不自造）**：`xs 4 / sm 8 / md 12 / lg 16 / xl 20 / panel 28`，经 `--r-xs/--r-sm/--r/--r-lg/--r-xl/--r-2xl` 别名。**控件统一 sm(8)，菜单 sm(8)，弹窗 md(12)**；同一工具条上 ghost/primary 圆角必须一致，不允许分叉。胶囊（999px）仅用于分段控件 / chip / 进度条。【基线冻结】§1.4；【提案】§5 圆角条；【源码核真·DOM】panel.css:87-92。
3. **密度为专家，不为装饰留白**：密集专家工具保持扫描效率，行/卡高度贴合内容，不无故拉高行高/卡片高；卡片 `align-items:start`，禁止单行卡被 stretch 等高拉伸（修汇报三卡 75px 拉伸、看板空卡大片留白）。【基线冻结】§1.1；【准备稿】NS-3/O-4；【技能:audit】visual-craft「dense expert tools preserve scan efficiency」。
4. **容器为结构/交互而存在，不为装内容而加卡**：平面视图用白/深底 + hairline 边框、无阴影；浮层（下拉/菜单/弹窗）才用 `--pm-shadow-menu/modal`；**边框与阴影不同时上**。【基线冻结】§1.3；【技能:audit】visual-craft「shadow and border are tools, do not add both」。
5. **密度档位（建议，待产品确认）**：桌面默认紧凑行高；全局密度切换（舒适/紧凑，现 tasks 有本地 dense 开关）只改行高与单元格 padding，**不改列结构、不改 token**。【提案】§6.1；【技能惯例·待验证】全局密度偏好提升为系统级。
6. **间距节奏说明**：不把技能的「8pt 万能网格」当强制；以本项目既有 `--sp-*` 阶为准（visual-craft 明确「avoid prescribing an 8-point grid as universal」）。【技能:audit】visual-craft 间距节。

### B-2 来源标注
【基线冻结】§1.3/§1.4/§1.5；【源码核真·DOM】panel.css:87-95、127-128（阴影）；【提案】§5、§6.3；【技能:audit】visual-craft 间距/表面节；【技能:pro-max】`spacing-scale`（quick-reference §5，仅作旁证，不覆盖本项目阶）。
**待验证**：单行卡 stretch、空卡留白等漂移点需 G3 目视复核（【准备稿】NS-3 静态假设 H 系列）。

---

## C. 排版字阶

### C-1 规范条目建议文本
1. **字阶角色（冻结，相邻可辨，不靠放大所有标题解决层级竞争）**：
   | 角色 | 字号/字重 | 用途 |
   |---|---|---|
   | 页面标题 | 16 / 700 | 视图页题 |
   | 区块标题 | 13.5 / 650 | 卡片/抽屉分区 h3 |
   | 正文 | 13–14 / 400 | 段落、表单正文 |
   | 标签/元信息 | 11–12 / 600 | chip、按钮、分段、辅助说明 |
   | 数据 | tnum | 计数、KPI、日期、进度，一律 `font-variant-numeric: tabular-nums` |
   【基线冻结】§1.7；【提案】字阶表（`--t-16/650` 区块题、`--t-12/600` 标签 chip）。
2. **字体栈**：沿用宿主 `--pm-font-sans`（系统栈），不打包新字体、不引远程字体；正文/数据不用等宽替代。【基线冻结】§1.7；【排除】远程字体配对见 §0.3-2。
3. **数字对齐**：所有计数、KPI、日期、进度、编号列用 tabular-nums，防止列宽抖动；单位/符号/小数位对齐规则随数据列。【基线冻结】§1.1；【源码核真·DOM】`tabular-nums` 已见于 rail 计数/KPI/前置 code（panel.css:251/483/1562/1600）；【技能:pro-max】`number-tabular`。
4. **长文与截断**：优先换行；必须截断时 ellipsis + 可获知全名（hover 全名 / title / 展开路径），**title 不算编程可访问名**；URL/ID/用户长文本用 `overflow-wrap:anywhere`，不对正文用 `word-break:break-all`。【技能:pro-max】`truncation-strategy`、`long-token-wrapping`；【准备稿】NS-2（窄屏 ellipsis 无 title 为待验证假设）。
5. **行高/行长**：正文行高贴合密集工具（不强制消费级 1.5–1.75 大行距）；长说明段落限可读行长，不在宽屏铺满。【技能:pro-max】`line-height`/`line-length`（【技能惯例·待验证】具体行高值以宿主现状为准，不新定）。
6. **层级裁决顺序**：先减少竞争性强调（颜色/字重/位置），再调字号；禁止把所有标题一起放大。【基线冻结】§1.7；【技能:audit】visual-craft 排版节。

### C-2 来源标注
【基线冻结】§1.7；【提案】字阶表；【源码核真·DOM】panel.css:24-26（字体栈）、96-99（`--t-*` 阶）、251/1600（tnum）；【技能:pro-max】`font-scale`、`weight-hierarchy`、`number-tabular`、`truncation-strategy`、`long-token-wrapping`；【技能:audit】visual-craft 排版节。
**源码核真的漂移线索（DOM 级，待 G3 复核，不写成缺陷）**：现状字号取值碎片化（9/10/10.5/11/11.5/12/12.5/13/13.5/14/15/16/18/20/28px 并存，panel.css + views 样式统计），与冻结字阶角色的对齐属系统收敛事项，需逐条核后登记为 drift 或有意例外。

---

## D. 颜色语义与对比度（WCAG AA 4.5:1 的项目实现方法）

### D-1 规范条目建议文本
1. **文本对比底线**：正文/链接 ≥4.5:1（WCAG 1.4.3 常规文本）；大号放宽到 3:1；组件边界、状态指示、焦点环等非文本信息 ≥3:1（WCAG 1.4.11）。**对比必须用工具从渲染实色测量，不凭眼估、不采信色值标注**。【技能:audit】accessibility-and-standards §Key checks；【技能:pro-max】`color-contrast`、`color-accessible-pairs`。
2. **用项目真实色值达成 AA 的实现方法（不新调色板）**：
   - 文本次 `--pm-text-2`：白底 5.80:1 ✅，直接用于次要正文。
   - 辅助 `--pm-muted #696e74`：白底 5.14:1 ✅；上 `--pm-surface-2` 为 4.75:1 ✅，两处均可用。
   - 装饰 `--pm-faint #71767c`：白底 4.58:1 ✅，**仅限画布/表面；落 surface-2 仅 4.23:1 不达标 → 禁止，改用 muted**。
   - 链接 `--pm-link #4868b2`：5.39:1 ✅；`#4176e6`（4.23:1）**不得作文字色**，只可作大面/图形。
   - 主按钮：白字 on 近黑填充 18.9:1 ✅（【提案实测】）。
   - 状态色（success/warning/danger）文字用法须单独实测；错误/成功色文字同样满足 4.5:1（【技能:pro-max】`contrast-feedback`）。
   【基线冻结】§1.2 对比度列；以上为**静态计算值，非界面实测**，深色由宿主别名，需 G3 逐表面复测。
3. **颜色不单独承担信息**：状态 = 图标 + 文字标签 + 色三者并列；成功/错误/选中/阻塞不得只靠红绿区分（WCAG 1.4.1）。【基线冻结】§1.1；【技能:pro-max】`color-not-only`；【准备稿】NS-1/NS-9。
4. **语义色边界**：蓝 = 进行/链接/选中/焦点；绿 = 完成；琥珀 = 阻塞/临期；红 = 逾期/删除/错误；中性灰 = 待办/idle。语义色只标状态，结论由文字/chip 给出。【提案】P2/P6；【基线冻结】§1.2。
5. **选中/浅底用 color-mix 比例固化**：`--pm-tint-accent` 12%、`--pm-tint-success` 12%、`--pm-tint-warning` 12%、`--pm-tint-danger` 10%（【源码核真·DOM】panel.css:121-124）；新增 chip 必须走同一 mix 比例（10% 底 / 实色字），不自创底色。【提案】§6 chip 条。
6. **焦点环对比**：2px `--pm-accent` 描边 + 1px offset（全局 `:focus-visible` 已定义，【源码核真·DOM】panel.css:184-187）；状态对比 ≥3:1，不用低对比细 outline。【基线冻结】§1.8；【技能:pro-max】`focus-appearance`。
7. **深色独立复测**：深色不继承浅色数值，逐角色在深底上重新测对比；遮罩复用宿主 `--dsw-alias-bg-mask-1`，不自造半透明黑。【基线冻结】§1.3；【技能:pro-max】`color-dark-mode`；【技能:audit】accessibility「dark mode contrast independently」。

### D-2 来源标注
【基线冻结】§1.2（含全部静态对比度）；【提案】P2/P6、主按钮 18.9:1；【源码核真·DOM】panel.css:121-124、184-187；【技能:audit】accessibility-and-standards（WCAG 2.2 §1.4.3/1.4.11/1.4.1）；【技能:pro-max】`color-contrast`/`color-accessible-pairs`/`color-not-only`/`contrast-feedback`/`color-dark-mode`。
**待验证**：全部深色值、状态色文字对比、surface-2 上 muted/faint 的真实渲染，均待 G3 measured；本文件不声称 WCAG 合规（【准备稿】§1.3）。

---

## E. 表单（标签 / 校验 / 报错定位 / 禁用态）

### E-1 规范条目建议文本
1. **可见 label，禁止 placeholder 当 label**：每个字段有可编程关联的可见 label（`for/id` 或包裹）；placeholder 只作输入提示。【技能:pro-max】`input-labels`、`form-labels`；【准备稿】C5/NS-6；【技能:audit】accessibility §Forms。
2. **内联错误贴近字段**：错误文案显示在该字段下方，用 `aria-describedby` 绑定到控件；错误说清「原因 + 怎么修」，不写「Invalid input」；字段错误态 = 危险色文字 + 危险色边框/聚焦 outline（样式已存在，【源码核真·DOM】panel.css:955-972 `.pm-field-required/.pm-field-error/[data-invalid]`）。【技能:pro-max】`error-placement`、`error-clarity`、`inline-validation`（search 命中 Result 1/2/3）；【提案】§6.4 校验统一。
3. **校验时机统一受控内联**：blur 校验为主、提交兜底；**不混用原生 required 气泡与受控错误**（现状双轨：repoUrl 受控、标题等原生 required，属待统一项【提案】§6.4；【准备稿】NS-6 静态假设）。多错误提交后，焦点落到可聚焦错误摘要（role=alert/tabindex=-1）或首个无效字段；摘要每项链接到字段，内联错误保留。【技能:pro-max】`focus-management`、`error-summary`（quick-reference §8）。
4. **必填标记**：必填项用危险色 `*`（`.pm-field-required` 已存在），全表单一致。【源码核真·DOM】panel.css:955；【技能:pro-max】`required-indicators`。
5. **出错保留输入、取消零写**：提交失败不整盘清空，保留已填内容并给重试/编辑路径；取消不产生任何写。【技能:pro-max】`error-recovery`；【准备稿】C4/C5/NS-6；【提案】§6.4。
6. **禁用 ≠ 只读**：disabled 用降透明度（0.55）+ `cursor:not-allowed` + 语义 `disabled` 属性（样式已存在，【源码核真·DOM】panel.css:374-375）；read-only 视觉与语义都区别于 disabled（只读可看可复制、不可改；禁用不可交互）。【技能:pro-max】`disabled-states`、`read-only-distinction`；【基线冻结】§1.8。
7. **提交中禁用防重**：异步提交（保存/generate/整批/逐步）立即禁用按钮并给加载态，二次提交不可能；成功有可见且可编程的反馈（Notice）。【技能:pro-max】`loading-buttons`、`submit-feedback`、`success-feedback`；【准备稿】C7/C8；台账 R4（send/generate pending disabled 已源码裁剪）。
8. **输入类型与辅助**：email/tel/number 用语义 input type 唤起对应键盘；复杂字段给持久 helper text（非 placeholder）；长表单支持草稿/不丢失。【技能:pro-max】`input-type-keyboard`、`input-helper-text`、`form-autosave`（【技能惯例·待验证】本项目 9 组表单逐字段适用度待核）。
9. **保存返回上下文**：保存成功 Notice 后返回原视图/筛选/滚动位置，不重置列表。【准备稿】NS-6/RTN；【技能:pro-max】`state-preservation`。

### E-2 来源标注
【源码核真·DOM】panel.css:955-972（必填/内联错误/无效边框）、374-375（disabled）；【提案】§6.4；【准备稿】C5、NS-6；【技能:pro-max】search「inline validation error near field」3 命中 + quick-reference §8 全条；【技能:audit】accessibility §Forms（3.3.2/3.3.1/3.3.3）。
**待验证**：校验双轨统一、错误摘要焦点、失败保留输入、慢请求禁用加载，均需 G3/专项取证（本地秒开，加载态未触发过，【准备稿】NS-5 静态假设）。

---

## F. 状态覆盖（normal / empty / loading / error / disabled / hover / focus / 长文）

### F-1 规范条目建议文本（每条给规范措辞，按项目实测/源码行为写）
组件状态轴独立于变体，禁止布尔属性爆炸；每个可交互控件覆盖适用子集。【准备稿】NS-4/NS-5；【技能:pd】interaction-model-critical-states（loading/partial/empty/stale/error/validation/timeout/retry/permission/success/cancellation/undo）。

| 状态 | 规范措辞（建议进主规范） | 项目依据 |
|---|---|---|
| **default 常规** | 控件取语义 token 默认值：ghost 透明底 + `--pm-line` 边 + `--pm-text` 字；primary 中性填充；danger 透明底 + 危险字；icon 32px 方 | 【源码核真·DOM】panel.css:355-372；【基线冻结】§1.8 |
| **hover** | 行/项 hover 底 `--pm-hover`；按钮 hover 提边框一档 + 浅底；反馈 120ms（`--pm-motion-fast`）；**不靠 hover 独占信息/动作**，键盘 focus 常显 | 【源码核真·DOM】panel.css:366-368；【基线冻结】§1.6/§1.8；【技能:audit】visual-craft「do not rely on hover」 |
| **focus / focus-visible** | 键盘焦点 2px `--pm-accent` 描边 + 1px offset，全局 `:focus-visible` 统一；焦点不被 sticky/浮层遮挡；鼠标点击不强制显示 | 【源码核真·DOM】panel.css:184-187、298；【基线冻结】§1.8；【技能:pro-max】`focus-states`、`focus-not-obscured` |
| **pressed / active** | 按压给轻微反馈（同色加深/scale 0.95–1.05），不位移布局；甘特拖拽 `:active{grabbing}` 已有 | 【技能:pro-max】`press-feedback`、`scale-feedback`；【提案】§6.2（gantt active） |
| **selected / 开关** | 选中用 `--surface-3`/`--pm-tint-accent` 浅底 + 文字/图标区分，**可编程选中态**（`aria-pressed`/`aria-selected`），不靠 class alone；seg 选中 `aria-pressed` | 【源码核真·DOM】panel.tsx:1432（seg aria-pressed）、448-449（tab aria-selected）；【准备稿】C6；【技能:pro-max】`state-clarity` |
| **disabled** | 降透明度 .55 + `cursor:not-allowed` + `disabled` 属性；不承担只读语义 | 【源码核真·DOM】panel.css:374-375；【技能:pro-max】`disabled-states` |
| **loading（异步）** | 仅异步路径（AI generate、整批/逐步执行、保存慢路径）：立即禁用 + 加载指示，防重复提交；常规本地视图不引入骨架 | 【准备稿】C7/C8；【技能:pro-max】`loading-buttons`、`loading-states`；【排除】骨架屏见 §0.3-5 |
| **empty 空态** | 诚实说明「尚无 X」≠「0 项」，给下一步 CTA（去重，不与页头主 CTA 重复）；不伪装零值、不留白屏；空过滤结果与真空分开 | 【准备稿】C3/NS-5/O-3；【技能:pro-max】`empty-states`（search 命中 Result 1）；【技能:dash】state model「true zero vs no-results vs permission」；G3 B12/B13/B14 空态线索【G3 采证线索】 |
| **error / 校验** | 内联错误贴近字段（见 §E）；全局错误 Notice 用 `role=alert`、**不自动消失**、可复制路径；超时给重试；失败保留输入 | 【准备稿】C2；【源码核真·DOM】Notice error 变体 panel.css:404-405；【技能:pro-max】`aria-live-errors`、`timeout-feedback`；【排除】错误 toast 自动消失见 §0.3-6 |
| **success** | 可见 + 可编程反馈（Notice `role=status`，不抢焦点）；完成开关归一化为 done+100%（既有已确认行为，不回退） | 【准备稿】C2；【技能:pro-max】`success-feedback`、`toast-accessibility` |
| **stale 陈旧** | 刷新中保留旧数据并标「更新中/陈旧」，不用空白骨架替换可信旧数据；标最后更新时间，不冒充实时 | 【技能:dash】state model「refresh in progress / stale but available」（【技能惯例·待验证】本项目离线本地数据，stale 主要用于未来远程/AI 路径） |
| **长文 LONG** | 长文内部滚动而非整条溢出；Notice 长文 390 不裁切；Markdown/WBS 长文可读、390 不横向溢出；超长名截断给全名路径 | 【准备稿】C2/C10/AU-G05；【技能:pro-max】`compact-label-overflow`、`chip-collection-reflow`（search q09 命中） |
| **大数据 BIG** | 长列表给虚拟化或分页策略；超长文本/大量日期不塌列不溢出；构造大样本取证 | 【准备稿】NS-11；【技能:pro-max】`virtualize-lists`（50+ 项）；【待验证】无虚拟滚动，大数据表现未知 |

### F-2 来源标注
【基线冻结】§1.8（状态契约 default/hover/focus-visible/pressed/selected/disabled/read-only/empty/error/stale）；【源码核真·DOM】panel.css:355-375/404-405、panel.tsx:1432/448；【准备稿】NS-5、C2/C3/C7/C8/C10；【技能:pd】critical-states；【技能:dash】interaction-accessibility-qa §State model；【技能:pro-max】search q03/q04/q09 + quick-reference §2/§8。
**待验证**：loading/慢请求、disabled 覆盖面（现状视图内 `disabled=` 极少，【准备稿】§12）、stale、大数据、长文渲染均未实测。

---

## G. 响应式（1440 / 768 / 390 三档行为规则）

### G-1 规范条目建议文本
1. **区分两套宽度概念（避免混淆）**：
   - **采证档（G3 目视）**：1440 / 约768 / 390 × 浅/深，逐视图无破版/叠印/溢出。【准备稿】NS-8；【G3 采证线索】g3-evidence-receipt 三视口口径。
   - **内容断点（实现）**：按内容定，不按设备定；容器查询为主、视图媒体查询为辅。建议沿用提案四带：D ≥1280 全多列 / C 960–1279 收低频列 / B 561–959 双栏保留+身份列吸左+工具条换行 / A ≤560（含 390）表格卡片化、master-detail 单列、抽屉 1 列。【提案】§9.1；现状源码断点为 480/560/900/980 + @container 760/540，**1440/768/390 是验收目标而非现存断点**【源码核真·DOM】+【准备稿】§3.6。
2. **1440（D 桌面舒适）**：高密度多列；master-detail 双栏；表格全列、身份列 `minmax(0,1fr)` 保留最小可读宽；KPI 四列；抽屉 2 列；主 CTA 唯一中性 primary。【提案】§9.1/§6.1。
3. **768（B 平板/窄桌面，落 561–959 带）**：KPI 两列；master-detail 保留双栏（列表 ~280px）；表格允许横向滚动且**身份列吸左**，不靠横滑暴露身份；工具条换行；比较关系不被单列堆叠破坏。【提案】§9.1；【技能:pd】responsive-preserve-relationships；【技能:dash】§Responsive。
4. **390（A 移动/极窄）**：表格→卡片堆叠（勾选+完整标题+状态 chip 一行，编号/负责人/优先级次行，日期进度三行，**不删字段、标题不截断**）；master-detail 单列（列表在上、点选进详情可返回）；抽屉塌 1 列；按钮 `white-space:nowrap` 不折行；甘特时间轴允许横滑但身份信息不进横滑；统计卡 2 列；无外壳横向溢出。【提案】§9.3；【准备稿】NS-8（任务表标题列塌缩 0 为既有 S1 线索，需新基线重测）。
5. **200% 缩放 / 320 CSS px 回流**：内容不丢失、不出现双向滚动（合法二维内容如甘特时间轴除外）；文本可放大到 200% 不破版。【技能:audit】accessibility §Reflow/§Resize text（WCAG 1.4.10/1.4.4）；【技能惯例·待验证】需专项测。
6. **内容决定断点动作**：逐视图写明何处换行/截断/折叠/滚动/变形态，不统一堆成单列。【技能:audit】visual-craft「let content determine breakpoints」；【提案】§9.3 逐视图表。

### G-2 来源标注
【提案】§9.1–§9.4（断点表/标签条/逐视图 390/通用窄窗规则）；【源码核真·DOM】现存 @media 480/560/900/980、@container 760/540（panel.css:873/1006/1105/1125/1520/1778/2033/2070/2256/2356）；【准备稿】NS-8、§3.6；【技能:pd】responsive-preserve-relationships（WCAG 2.2 Reflow）；【技能:dash】§Responsive behavior；【技能:pro-max】`mobile-first`/`breakpoint-consistency`/`horizontal-scroll`/`table-handling`（仅旁证，不采纳 desktop-first 反转）。
**待验证**：768 档现存无对应断点；390 标题列、标签横滚 scrollIntoView、200% 缩放均待 G3。

---

## H. 控件（按钮四型 / 下拉 / 弹窗 / 抽屉 / chip / 键盘可达与 focus-visible）

### H-1 规范条目建议文本
1. **按钮四型（全产品统一，圆角同为 sm 8）**：
   | 型 | token/类 | 外观 | 使用 |
   |---|---|---|---|
   | Primary | `.pm-button-primary` → `--pm-primary-fill` | 浅近黑底白字 / 深反白，**每视图唯一主 CTA**（新增/保存/生成快照） | 页面/表单主操作 |
   | Secondary / Ghost | `.pm-button` | 透明底 + `--pm-line` 边 + `--pm-text` 字 | 取消、次要动作、筛选切换 |
   | Danger | `.pm-button-danger` | 透明底 + `--pm-danger` 字，**不做填充红**，与主操作视觉/空间分离 | 删除、丢弃草稿 |
   | Icon | `.pm-icon-button` / `.pm-plain-icon` | 32px 方、hover 浅底；**必须有编程可访问名**（aria-label 或可见文本，title 不计） | 行内编辑、关闭、刷新 |
   【提案】§6 按钮变体表；【源码核真·DOM】panel.css:355-379；【基线冻结】§1.4（同工具条圆角一致）；【技能:pro-max】`primary-action`（一屏一主 CTA）、`destructive-emphasis`。
2. **下拉 / listbox（ProjectSwitcher、ViewSwitcher、导出菜单）**：trigger 为原生 button，`aria-haspopup=listbox` + `aria-expanded`；列表 `role=listbox`，选项 `role=option` + `aria-selected`；方向键移动 active、Enter 选中、Esc/点外部关闭；**关闭后焦点归还 trigger**；同名项目给 id/日期/负责人消歧副标；空列表给「新建项目」去向。【源码核真·DOM】panel.tsx:368-396、458-486（listbox/option/expanded 已存在）；【准备稿】C1；【技能:audit】APG listbox 模式（技能本地 DB 对 listbox 检索 0 命中，按 SKILL.md 回退为行业惯例，**标待验证**）。
3. **弹窗（确认/移动选择/保存视图/管理视图/恢复预览）**：`role=dialog`；打开焦点落入、关闭归还 opener（rAF 归还已源码存在【准备稿】C4）；Esc/点遮罩关闭（不可逆确认门除外）；遮罩复用宿主 mask；焦点陷阱待 AT 确认；破坏性操作前确认门。【源码核真·DOM】ReminderCapsule popover role=dialog panel.tsx:1427；【准备稿】C4/M01-M03/M06；【技能:pro-max】`modal-escape`、`escape-routes`、`confirmation-dialogs`。
4. **抽屉（10 类记录级 CRUD）**：右侧面板；Esc/遮罩关闭；打开焦点落第一字段、关闭归还触发元素（`openerRef` 记录 + 关闭后 `resolveDrawerFocusTarget` 归还，【源码核真·DOM】panel.tsx:2661-2688）；390 单列全宽；取消零写、出错保留输入；底部操作条固定：左删除（danger，仅编辑态），右取消 ghost + 保存 primary。【准备稿】C4；【提案】§6.4；【源码核真·DOM】scrim 关闭按钮 `aria-label="关闭编辑抽屉"`@2684、图标关闭 `aria-label="关闭抽屉"`@2688。
5. **chip / 状态标签**：文字标签 + 色（10% mix 底/实色字），不单靠色；集合换行或 `+n` 可操作披露，不压成一行裁切；标签 nowrap、不可预测值才截断，截断给键盘/指针均可及的全名披露（非 hover-only tooltip）。【提案】§6 chip；【技能:pro-max】`chip-collection-reflow`、`compact-label-overflow`（search q09 命中）；【准备稿】AU-C5。
6. **分段控件 seg（粒度/类型/状态/范围）**：原生 button + `aria-pressed`；选中 `--surface-3` 底；390 换行不裁切（修 `.pm-seg` 类名碰撞）。【源码核真·DOM】panel.tsx:1432；【提案】§6.2；【准备稿】C6/AU-C7。
7. **键盘可达与 focus-visible（总条款）**：纯键盘可完成关键路径；Tab 序 = 视觉序；无焦点陷阱；裸可点件优先改原生 button，否则补 `role=button`+`tabIndex=0`+Enter/Space+编程可访问名；自定义 tab 用完整 tablist/tab/tabpanel/aria-selected/方向键；拖拽必须有单指针/键盘替代。【准备稿】§7 D-01～D-06（已源码核真缺口）；【技能:audit】accessibility §Keyboard/§Dragging（WCAG 2.1.1/2.5.7/2.4.7）；【技能:pro-max】`keyboard-nav`、`aria-labels`、`dragging-alternative`。
8. **z 层阶**：用既有 `--z-sticky:20 / --z-pop:40 / --z-modal:60`，禁止随手大 z 值。【源码核真·DOM】panel.css:99；【技能:pro-max】`z-index-management`。

### H-2 来源标注
【提案】§6 按钮/§6.1/§6.2/§6.4；【源码核真·DOM】panel.css:355-379/99、panel.tsx:368-396/458-486/1427/1432/2661-2688；【准备稿】C1/C4/C6、§7 D-01～D-06、AU-C5/C7；【技能:pro-max】search q07/q08/q09 + quick-reference §1/§4/§9；【技能:audit】accessibility-and-standards（APG、WCAG 2.5.7/2.4.7/4.1.2）。
**待验证**：listbox/tab 完整键盘行为、焦点归还、焦点陷阱、拖拽替代、图标按钮全量可访问名（H-2 候选上限 39 处待逐条剔除误报），均待 G3/AT。

---

## I. 验收 checklist 设计（可勾选 + 每条映射证据等级）

### I-1 设计原则
- 每条为**可观察条件**，不写「看起来美观」；勾选时必须填证据类型与定位（文件:行 / 批次编号 / 视口 / 主题）。【技能:audit】evidence-and-severity「Finding test」5 项（Evidence/Consequence/Cause/Remedy/Verification）。
- 证据等级四选：**observed**（实见动作/状态，最高）/ **measured**（工具实测对比/尺寸）/ **DOM**（源码/token/语义断言）/ **截图**（仅作线索，单独不成立）。自动静态门（G1/G2/G4）只是输入，不替代 G3 目视与 AT。【G3 工作表口径】；【技能:audit】证据表。
- 不适用项写 N/A + 理由，不留空勾。

### I-2 分域勾选项（建议进 PR 模板/验收表；括号为建议证据等级）
**Token 与色彩（对应 A/D）**
- [ ] 同语义角色（主/次/危险/选中/禁用/成功/警告）全产品取同一 token，无裸 hex（DOM + G2 静态）
- [ ] 正文/链接在浅/深两态 measured ≥4.5:1；faint 未落 surface-2；#4176e6 未用于文字（measured）
- [ ] 状态 = 图标 + 文字 + 色，无 color-only（observed/DOM）
- [ ] 主按钮全产品中性 `--pm-primary-fill`，无视图蓝 CTA 分叉（DOM + G3 observed）

**排版与间距（B/C）**
- [ ] 字阶角色一致，数据列 tnum；无离阶字号漂移（DOM；目视复核 G3）
- [ ] 内边距取自 `--sp-*`，圆角控件 sm8/菜单 sm8/弹窗 md12，同工具条无分叉（DOM）
- [ ] 单行卡不 stretch、无无意义留白（G3 observed）

**表单（E）**
- [ ] 可见 label + 可编程关联；无 placeholder 当 label（DOM/AT）
- [ ] 内联错误贴字段 + aria-describedby，错误说因+修法（observed/DOM）
- [ ] 校验策略统一受控，无原生气泡混用（DOM + observed）
- [ ] 失败保留输入、取消零写、成功 Notice 返回原上下文（observed）
- [ ] 异步提交 pending 时 disabled，二次提交不可能（observed/DOM）

**状态覆盖（F）**
- [ ] 逐控件状态矩阵无遗漏（default/hover/focus-visible/active/selected/disabled/loading/empty/error/success，适用项）（observed）
- [ ] 空态诚实 + 去重 CTA；错误 Notice 不自动消失；成功 role=status 不抢焦（observed）
- [ ] 长文内部滚动不溢出；大数据不塌列（observed/measured）

**响应式（G）**
- [ ] 浅/深 × 1440/768/390 逐视图无破版/叠印/外壳溢出（G3 observed + 截图）
- [ ] 390 任务标题完整不截断、卡片形态不删字段（observed）
- [ ] 768 身份列吸左/比较关系保留（observed）
- [ ] 200% 缩放、320px 回流无内容丢失（measured/observed）

**控件与无障碍（H）**
- [ ] 纯键盘完成关键路径；focus-visible 可见；无陷阱；打开落入/关闭归还（observed + AT）
- [ ] 图标按钮有编程可访问名；裸可点件有 role/键盘；自定义 tab 模式完整（DOM + AT）
- [ ] 拖拽有单指针/键盘替代（observed/AT）
- [ ] 一屏一主 CTA；danger 不填充红且与主操作分离（G3 observed）

**异常恢复与非回归**
- [ ] 失败可重试/可撤销；AI 草稿可拒绝/编辑（observed）
- [ ] 已 PASS 项零回退（G4 回归，observed）

### I-3 来源标注
【技能:audit】evidence-and-severity（证据标签/Finding test/严重度）、accessibility-and-standards（核心测试协议 9 步）；【技能:pro-max】pro-rules.md 预交付清单（Process/Visual/Interaction/Light-Dark/Layout/A11y）；【准备稿】§9.1 PR 模板建议、§9.3 静态检查规则；【G3 工作表】证据等级与批次登记格式。
**说明**：pro-rules 的 44pt 触控、安全区、Dynamic Type 等移动原生项在桌面专家工具按 §0.3-3 降级为 390 条件项。

---

## J. 迭代接入（新功能 / 改版过门、谁审、证据等级、与 G3 门 / 缺陷台账关系）

### J-1 规范条目建议文本
1. **三权分离**：规范所有者（设计/PM）维护规范与组件契约、裁决语义与例外，**不直接改产品代码**；实现（开发）是唯一改产品代码者，按规范迁移并绑定 HEAD SHA + 工作树指纹；独立测试专家（docs/testing）给 PASS/FAIL/BLOCKED/MANUAL_PENDING，**失败阻断**，自动静态门通过不替代 G3。【准备稿】§8；【基线冻结】§6。
2. **新功能/改版过门顺序（沿用 G1–G5，不另造门）**：
   - **G1 构建与全量回归（AUTO）**：`pnpm build` / `pnpm test`(+coverage) / verify-isolation / e2e（SKIP 须 exit 0 诚实标注）；任一不过即 FAIL。【基线冻结】§6 G1。
   - **G2 Token 静态门（AUTO）**：迁移映射全覆盖、旧别名同值可解析、零未定义 var、宿主别名优先、计算 AA、零暖色/新品牌/渐变/光晕。【基线冻结】§6 G2。
   - **G3 真实 GUI 目视门（硬门槛）**：浅/深 × 1440/768/390 逐视图 + 关键状态（正常/空/长文/报错/禁用/关键交互/键盘），独立测试专家执行；**DOM 断言/计算色值/mockup 标注不得代替目视**。【基线冻结】§6 G3；【G3 工作表】。
   - **G4 非回归门**：已 PASS 项零回退（主按钮中性、浅色对比、甘特三态/关键路径、抽屉校验/Notice、看板互斥、空态诚实、AI 草稿不落库、390 回流、全局密度、项目下拉消歧）。【基线冻结】§6 G4。
   - **G5 证据与绑定**：结论绑定被测 SHA + 工作树指纹；真实/模拟分开；MANUAL_PENDING 只留给需真实凭据/在线模型的项（空 Key/离线/凭据错误 = AUTO 确定性模拟，不扩大人工豁免）。【基线冻结】§6 G5；【准备稿】F-5/R6。
3. **缺陷台账关系（沿用 `docs/testing/defect-format.md`）**：
   - 三分类：可复现缺陷（S1 阻断 / S2 严重 / S3 一般 / S4 观察，走 OPEN→FIXED→RE-VERIFIED 生命周期，测试专家登记、开发修复、独立复验）；视觉一致性偏差 System drift（按系统根因统一，不单点修补）；主观机会 Opportunity（无已观察缺陷，先定义成功度量，不赋 S 级，不与缺陷混排）。【准备稿】§0/§7；【技能:audit】severity rubric（S0–S3 + Opportunity，映射到项目 S1–S4 时以项目严重度为准）。
   - 静态已核真缺口（D-01～D-06）当前为 BLOCKED/待GUI-AT，真实键盘/AT 表现由 G3 复验，不冒充实测失败。【准备稿】§7.1。
4. **新功能准入清单（进 PR）**：勾选 §I-2 对应域；声明复用公共组件/契约，分叉必须登记为「有意例外（owner/理由/到期）」而非无声 drift；附 G1/G2 自动结果 + G3 采证编号或截图路径 + 受影响 AU/CTL ID。【准备稿】NS-4、§9.1。
5. **规范变更触发刷新**：token 改名、组件增删、视图调整 → 本建议稿与控件台账分母回退「待刷新」，重盘点后再冻结；P2-6（AI 溯源：来源/不确定性/撤销恢复/失效行）落地并独立验收前，相关单元保持待验证，不得因源码有名就算实装。【准备稿】§10；【技能:pd】human-review-override-traceability（仅作 P2-6 预留）。
6. **证据等级要求（过门最低）**：G2/DOM 级可过静态门；G3 关键路径必须 observed（实见）或 measured（对比/尺寸）；截图单独不成立；AT 项需读屏/键盘实测记录（浏览器/视口/路径）。【G3 工作表】；【技能:audit】evidence labels。

### J-2 来源标注
【基线冻结】§6（G1–G5、已知限制）；【准备稿】§7/§8/§10、F-1/F-5；【技能:audit】evidence-and-severity（S0–S3/Confidence/生命周期映射）；【技能:pd】human-review（P2-6 预留）；【G3 工作表】证据等级与批次登记；`docs/testing/defect-format.md`（S1–S4、OPEN→FIXED→RE-VERIFIED）。

---

## 附：本建议稿未覆盖 / 留白
- 真实模型生成闭环、副驾已存在多步计划 GUI 采证、P2-6 溯源/撤销恢复——待真实任务序列与 P2-6 落地另取证。
- 键盘顺序/焦点环/读屏名称/拖拽单指针替代——待 AT 实测。
- 加载/禁用/成功 toast、慢请求——需人为制造慢路径。
- 大量数据/超长文本——需构造大样本。
- 深色逐角色对比、768 断点实现、200% 缩放——待 G3/专项。
- 字阶碎片化、图标按钮全量 aria-label、视图蓝 CTA 分叉等为源码级线索，需 G3 复核后再登记 drift 或例外，本稿不写成已成立缺陷。

# #50 系统 UI 规范主文档（2026-10-17）

> 版本：v1.0（首版冻结稿，供新功能/改版过门使用）
> 事实底座：`docs/design/system-ui-spec-facts-20261017.md`（下称「facts」，条目号如 A.1、B.2、E.3）。
> 条目措辞来源：`docs/design/system-ui-spec-recommendations-20261017.md`（下称「建议稿」，分节 A–J）。
> 门机制与缺陷流程：`docs/testing/g3-evidence-receipt-20261017.md` §D/§E、`docs/testing/defect-format.md`。
>
> **证据口径**：observed（实见动作/状态）> measured（computedStyle/探针实测）> DOM（源码/样式直读）> 截图（仅存档，单独不成立）。
> 本规范正文「事实位」只引用 facts 条目；来自设计技能惯例、项目内尚无实测的条目，一律在条目后标注「（依据：设计惯例，待验证）」，不得写成已达标。
> **已排除的技能冲突项（一律不得进入本规范实现）**：营销蓝/琥珀调色板、远程 Google 字体、44pt 全产品硬触控指标、mobile-first 全部单列堆叠、通用骨架屏、错误 toast 自动消失、组件内硬编码蓝焦点环（排除理由见建议稿 §0.3）。
> 本稿为只读成文：未改产品代码、未 commit。

---

## 1. 范围与遵守义务

### 规范要求
1.1 本规范覆盖 PM 工作台全部视图、抽屉、弹窗、下拉菜单、状态 chip、表单、按钮与响应式三档呈现，是新功能开发与既有界面改版的强制约束。
1.2 **新功能必须遵守**：新增视图/控件/字段时，token、字阶、圆角、状态、键盘、响应式一律按本规范落地，分叉必须登记为「有意例外（owner/理由/到期日）」，不得无声 drift。
1.3 **改版必须遵守**：对既有界面做视觉/交互调整时，先过 §11 门机制；已 PASS 项零回退（G4 非回归）。
1.4 本规范与 facts 冲突时，以 facts 实测链为准；facts 未覆盖的视觉断言不得写成事实，只能进 §12 待验证清单。
1.5 规范所有者（设计/PM）维护规范与组件契约、裁决语义与例外，不直接改产品代码；开发是唯一改产品代码者；独立测试专家给 PASS/FAIL/BLOCKED/MANUAL_PENDING 结论（依据：建议稿 J-1，三权分离，与 facts H 门规则一致）。

### 实现锚点
- facts H：12 门 T2-G01～G12 全部 PASS、整体 G3 收口通过（2026-10-17），无 OPEN/FAIL 缺陷；本规范在该收口基线上成文。
- facts H：证据等级约定 observed > measured > DOM > 截图；探针/aux/resp/width-check 不计入门覆盖。

---

## 2. 视觉 token 与主题（浅/深两态治理）

### 规范要求
2.1 **单层 `--pm-*` 语义真源**：组件只允许引用单层 `--pm-<category>-<role>[-state]` 语义 token；新增组件禁止裸 hex、禁止绕过语义层直取宿主别名。分层顺序：宿主原始别名（`--dsw-*`，只读）→ 单层 `--pm-*` 语义层 → 旧别名（同值保留，不删不改）→ 组件样式。（依据：建议稿 A-1-1【基线冻结】+ facts A.1 DOM 核真）
2.2 **宿主别名优先 → 项目 fallback**：每个语义 token 解析顺序固定为「宿主别名缺失才落项目 fallback」；fallback 仅补 AA 中性与缺失项，不得覆盖宿主主题。（facts A.1；建议稿 A-1-2）
2.3 **浅深成对治理，不机械反色**：浅色由 `.pm-shell` 作用域 fallback 给定；深色跟随 `body[data-ds-dark-theme]`，面板不自带第二套开关；本地不新建第二套 dark 开关、不机械反色；阴影由宿主暗色覆写，非机械反色。（facts A.2 主题机制；facts B.2 菜单/弹窗阴影暗色覆写）
2.4 **冻结角色表（实现时只准引用，不得自造新角色）**：

| 角色 | token | 解析/fallback（facts 实测链） | 用途边界 |
|---|---|---|---|
| 画布 | `--pm-canvas` | `--dsw-alias-bg-base`，fallback `rgb(255,255,255)`（facts A.1） | 面板最底层 |
| 表面 | `--pm-surface` | `--dsw-alias-bg-base`，fallback 白（facts A.1 源码实测链；注意与基线 §1.2 字面 bg-layer-1 的口径差异，规范以源码实测链为准） | 卡片/菜单/弹层底 |
| 表面抬升 | `--pm-surface-2` | `--dsw-alias-bg-layer-2`（建议稿 A-1-4 列出，**facts A.1 未核真，待 DOM 核真**） | 输入底、hover 浅底、徽章底；§5 对比度判定的「抬升表面」即指此角色 |
| 品牌动作 | `--pm-accent` | `--dsw-alias-state-business-primary`，无本地 hex 覆盖（facts A.1） | 链接、选中、焦点描边；**不做 CTA 填充** |
| 文本主 | `--pm-text` | `--dsw-alias-label-primary`，fallback `rgb(28,28,30)`（facts A.1） | 标题/正文 |
| 文本次 | `--pm-text-2` | `--dsw-alias-label-secondary`，fallback `rgb(97,102,107)`（facts A.1） | 次要正文 |
| 文本辅助 | `--pm-muted` | 浅色强制 `rgb(105,110,116)` #696e74；深色走宿主 tertiary 别名（facts A.1） | 次要说明，可上 surface-2 |
| 文本装饰 | `--pm-faint` | `var(--faint)`（facts A.1） | 仅画布/表面元信息；落 surface-2 禁用（见 §5） |
| 链接 | `--pm-link` | `--dsw-alias-link` → `--dsw-alias-state-business-primary` → fallback `rgb(72,104,178)` #4868b2（facts A.1） | 文本链接 |
| 成功/警告/危险 | `--pm-success/--pm-warning/--pm-danger` | success `rgb(34,197,94)`、warning `rgb(245,158,11)`、danger `rgb(239,68,68)` fallback（facts A.1） | 仅完成 / 阻塞临期 / 逾期删除错误 |
| 边框弱/更弱 | `--pm-line / --pm-line-soft` | border-l2 `rgba(0,0,0,.1)` / border-l1 `rgba(0,0,0,.04)`（facts A.1） | 常规分隔 / 组内 hairline |
| 悬停底 | `--pm-hover` | `--dsw-alias-interactive-bg-hover`，fallback `rgba(0,0,0,.04)`（facts A.1） | 行/项 hover |
| 主按钮底/字 | `--pm-button-primary` | `--dsw-alias-button-primary-fill` + `--dsw-alias-label-primary-foreground`，hover 走 primary-hover；无本地品牌蓝填充（facts A.1） | 唯一主按钮，中性 |

2.5 **选中/悬停浅底走 color-mix 比例固化**：`--pm-tint-accent/success/warning` 12%、`--pm-tint-danger` 10%，由 color-mix 生成，非手写百分比；新增 chip/选中底必须走同一 mix 比例，不自创底色。（facts A.1）
2.6 **图表序列**：`--pm-chart-s1=var(--c-prog)`、s2=`var(--c-done)`、s3=`var(--c-block)`；**S4 不定义、不启用**。（facts A.1）
2.7 **P2-6 预留槽位** `--pm-ai-surface/--pm-ai-edge/--pm-ai-mark` 本批只定义不启用，无紫色品牌色。（facts A.1）
2.8 **禁止项红线**：暖黄/偏黄底、新品牌色、品牌蓝大面积填充 CTA、渐变、玻璃拟态、光晕、彩色投影（facts D 禁止项，G2 静态门已扫零命中）。
2.9 主题选择由宿主环境决定；新增表面时的浅/深裁决原则（依据：设计惯例，待验证，建议稿 A-1-6）。

### 实现锚点
- facts A.1：全部 token 定义为源码直读（DOM）；A.2：浅 body/pm-shell `rgb(255,255,255)`、墨字 `rgb(15,17,21)`；深 `rgb(21,21,23)`、近白字 `rgb(249,250,251)`（measured）；rail 浅白/深深两主题逐值相等、非硬编码暗色（measured）。
- facts A.2：菜单浮层浅 `#fff`/深 `#232324`、圆角 8px、双层菜单阴影；遮罩浅 `rgba(0,0,0,.24)`/深 `rgba(0,0,0,.5)`，走 `--dsw-alias-bg-mask-1`（measured + DOM）。

---

## 3. 间距 / 圆角 / 密度档位

### 规范要求
3.1 **间距阶（theme-independent，冻结值，只准绑定，不自造）**：`--sp-1 4 / sp-2 8 / sp-3 12 / sp-4 16 / sp-5 20 / sp-6 24 / sp-8 32 / sp-9 40 / sp-10 48 / sp-12 64`。组件内边距绑定阶；页面局部留白不提成全局 token；禁止「里程碑式大内边距撑场面」。（facts B.1；建议稿 B-1-1）
3.2 **圆角跟随宿主别名，不自造**：`--r-xs=4 / --r-sm=8 / --r=md 12 / --r-lg=16 / --r-xl=20 / --r-2xl=panel 28`。**控件统一 sm(8)、菜单 sm(8)、弹窗 md(12)**；同一工具条上 ghost/primary/icon 圆角必须一致，不允许分叉。（facts B.2）
3.3 抽屉体内边距 `24px 28px 28px`、表单纵向 `gap:18px`、宽 `min(560px,94vw)`（facts B.1，DOM）。
3.4 **密度贴合内容，不为装饰留白**：密集专家工具保持扫描效率，行/卡高度贴合内容，不无故拉高行高/卡片高；禁止单行卡被 stretch 等高拉伸；禁止无意义大片留白。（facts B.4 未证实项反向治理；建议稿 B-1-3【基线冻结 §1.1】+ 设计惯例，待验证）
3.5 **容器为结构/交互而存在，不为装内容加卡**：平面视图用白/深底 + hairline 边框、无阴影；浮层（下拉/菜单/弹窗）才用 `--pm-shadow-menu/--pm-shadow-modal`；边框与阴影不同时上。（facts B.2；建议稿 B-1-4，依据：设计惯例，待验证）
3.6 **全局密度切换（紧凑/默认）档位定义与像素差当前无 measured 记录**，不得在新功能中宣称已实现；未来只改行高与单元格 padding，不改列结构、不改 token（依据：设计惯例，待验证；facts B.4 未证实）。
3.7 间距节奏以本项目既有 `--sp-*` 阶为准，不把「8pt 万能网格」当强制（依据：设计惯例，待验证，建议稿 B-1-6）。

### 实现锚点
- facts B.1：`--sp-*` 阶源码直读（DOM）。
- facts B.2：控件/菜单 `.pt-ghost`/`.pm-chip`/`.pt-vmenu` 均 `var(--r-sm)`，弹窗 `.pt-vm` 用 `var(--r)`（DOM）；修复后 1440 浅深运行时复验 `.pt-ghost` computed `border-radius=8px`（7 元素全 8px）、甘特 `.pm-chip=8px`（measured，T-DEF-001 CLOSED）。
- facts B.3：动效 `--pm-motion-fast 120ms`（hover/选中）、`--pm-motion-base 180ms`（展开/面板），缓动 `cubic-bezier(.22,.61,.36,1)`，只动 transform/opacity，存在 `prefers-reduced-motion` 全局降级块（DOM）。

---

## 4. 排版字阶

### 规范要求
4.1 **字阶角色（设计约束值，相邻可辨，禁止放大所有标题解决层级竞争）**：

| 角色 | 字号/字重 | 用途 |
|---|---|---|
| 页面标题 | 16 / 700 | 视图页题 |
| 区块标题 | 13.5 / 650 | 卡片/抽屉分区 h3 |
| 正文 | 13–14 / 400 | 段落、表单正文 |
| 标签/元信息 | 11–12 / 600 | chip、按钮、分段、辅助说明 |
| 数据 | tnum | 计数、KPI、日期、进度，一律 `font-variant-numeric: tabular-nums` |

（facts C 设计约束，[BASE]§1.7，非逐角色实测；逐角色 computed 复测见 §12-12）
4.2 **字体栈**：沿用宿主系统栈 `--pm-font-sans`，不打包新字体、不引远程字体；正文/数据不用等宽字体替代（facts C；排除项：远程 Google 字体）。
4.3 **数字对齐**：所有计数、KPI、日期、进度、编号列用 tabular-nums，防止列宽抖动（facts C：rail 计数 `.pm-rail-count` 11px/600/muted + tabular-nums，DOM）。
4.4 **长文与截断**：优先换行；必须截断时 ellipsis + 可获知全名（hover 全名/title/展开路径），**title 不算编程可访问名**；URL/ID/用户长文本用 `overflow-wrap:anywhere`，不对正文用 `word-break:break-all`（依据：设计惯例，待验证，建议稿 C-1-4）。
4.5 **层级裁决顺序**：先减少竞争性强调（颜色/字重/位置），再调字号；禁止把所有标题一起放大（facts C 设计约束）。
4.6 **字号碎片化 drift 列为待治理项**：现状字号取值碎片化（9/10/10.5/11/11.5/12/12.5/13/13.5/14/15/16/18/20/28px 并存），与冻结字阶角色的对齐属系统收敛事项，需逐条核后登记为 drift 或有意例外，不得在本规范中写成已达标（建议稿 C-2 源码漂移线索，DOM 级待复核；§12 新增项）。

### 实现锚点
- facts C：`.pm-shell` 全局 `font-size: var(--dsh-content-font-size,14px)`、`line-height:1.45`、`font-feature-settings:'tnum' 1`（DOM）；字阶 token 存量 `--t-10…--t-40`（注意 `--t-32/40` 命名与数值不一致，源码如此，待规范澄清，见 §12-12）。
- facts C：抽屉 header h2 `18px/650`、eyebrow 序号 10px muted（DOM）；rail item 14px、`.pm-rail-sub` 10.5px，浅/深逐值 measured，sub 字号/字重/色独立不串样式。

---

## 5. 颜色语义与对比度（WCAG AA 4.5:1 的项目实现方法）

### 规范要求
5.1 **文本对比底线**：正文/链接 ≥4.5:1（WCAG 1.4.3 常规文本）；大号文本放宽到 3:1；组件边界、状态指示、焦点环等非文本信息 ≥3:1（WCAG 1.4.11）。对比必须用工具从渲染实色测量，不凭眼估、不采信色值标注（依据：设计惯例，待验证，建议稿 D-1-1）。
5.2 **项目实色达标（白底静态计算值，非浏览器实测，深色须独立复测）**：
- `--pm-text-2` 次要正文：5.80:1（静态计算，基线 §1.2 转引；facts D 未单列，深色待复测）。
- `--pm-muted` #696e74：白底 5.14:1 ✅，可上 surface-2（facts D 静态计算）。
- `--pm-faint` #71767c：白底仅 4.58:1 ✅，**落 surface-2 仅 4.23:1 不达标 → 禁用该组合，改用 muted**（facts D）。
- `--pm-link` #4868b2：5.39:1 ✅（facts D）；**`#4176e6`（4.23:1）不得作文字色**（建议稿 D-1-2；G2 静态门口径）。
- 主按钮 on-primary 白/近黑：18.90:1 ✅（facts D 静态计算；主按钮中性填充见 §9）。
5.3 **颜色不单独承担信息**：状态 = **图标 + 文字标签 + 色**三者并列，不单靠红绿（WCAG 1.4.1；facts D：chip 前置依赖 5 项均带状态文字「已完成/进行中/未开始/受阻」，observed）。
5.4 **语义色边界**：蓝 = 进行/链接/选中/焦点；绿 = 完成；琥珀 = 阻塞/临期；红 = 逾期/删除/错误；中性灰 = 待办/idle。语义色只标状态，结论由文字/chip 给出（facts D；建议稿 D-1-4）。
5.5 **深色独立复测**：深色不继承浅色数值，逐角色在深底上重新测对比；遮罩复用宿主 `--dsw-alias-bg-mask-1`，不自造半透明黑（facts A.2 遮罩 measured；建议稿 D-1-7，待验证）。
5.6 状态色（success/warning/danger）文字用法须单独实测满足 4.5:1，当前无 measured 证据（facts D 未证实项，见 §12-1）。

### 实现锚点
- facts D：静态 AA 计算来源 MMAP §6 / BASE §1.2，均为白底开发自算、非浏览器实测；正文/次文本/状态色在真实浏览器浅深两态的 computed 抽测未做（§12-1）。
- facts D：禁止项（暖黄/偏黄底、新品牌色、品牌蓝大面积填充 CTA、渐变、玻璃拟态、光晕、彩色投影）G2 静态门零命中（DOM）。

---

## 6. 表单（标签 / 校验 / 报错定位 / 禁用态）

### 规范要求
6.1 **可见 label，禁止 placeholder 当 label**：每个字段有可编程关联的可见 label（`for/id` 或包裹）；placeholder 只作输入提示（依据：设计惯例，待验证，建议稿 E-1-1）。
6.2 **内联错误贴字段 + `aria-describedby` + 说因与修法**：错误文案显示在该字段下方，用 `aria-describedby` 绑定控件；错误说清「原因 + 怎么修」，不写「Invalid input」；字段错误态 = 危险色文字 + 危险色边框/聚焦 outline（建议稿 E-1-2；样式 `.pm-field-required/.pm-field-error/[data-invalid]` DOM 核真）。**注意：`aria-describedby` 绑定关系现状无 facts 观测（facts E.1 仅 observed 位置贴字段/红框/输入保留/零污染），属前向要求，未取证，见 §12-19。**
6.3 **受控校验，弃用原生气泡双轨**：blur 校验为主、提交兜底；不混用原生 required 气泡与受控错误（现状双轨属待统一项，依据：设计惯例，待验证，建议稿 E-1-3）。多错误提交后，焦点落到可聚焦错误摘要（role=alert/tabindex=-1）或首个无效字段（依据：设计惯例，待验证）。
6.4 **必填标记**：必填项用危险色 `*`，全表单一致（DOM 核真 `.pm-field-required`；建议稿 E-1-4）。
6.5 **出错保留输入、取消零写**：提交失败不整盘清空，保留已填内容并给重试/编辑路径；取消不产生任何写（facts E.1：新建任务标题留空提交 → 内联错误「任务名称不能为空」定位字段正下方、字段红框、出错后输入保留、未创建任务（关闭后仍 5 任务，零污染），observed）。
6.6 **两种并存提交模式（产品既定，非缺陷）**：新建任务空名**不禁用**「添加任务」，走提交后内联报错（disabled=false、aria-disabled=null、opacity=1、可点，measured/observed）；保存命名视图弹窗空名 → 「保存视图」`disabled=true`、`opacity=0.5`、`cursor=not-allowed`，浅深镜像成立（facts E.1/E.2）。新功能按各自语义二选一，不得混用。
6.7 **disabled ≠ read-only**：disabled 用降透明度 + `cursor:not-allowed` + 语义 `disabled` 属性；read-only 可看可复制、不可改，视觉与语义都区别于 disabled（建议稿 E-1-6，依据：设计惯例，待验证；facts E.2 禁用态 measured）。
6.8 **异步提交即禁用防重**：异步提交（保存/generate/整批/逐步）立即禁用按钮并给加载态，二次提交不可能；成功有可见且可编程的反馈（依据：设计惯例，待验证；本地秒开，loading 未触发取证，§12-3）。
6.9 保存成功后返回原视图/筛选/滚动位置，不重置列表（依据：设计惯例，待验证，建议稿 E-1-9）。

### 实现锚点
- facts E.1：B39 内联报错定位 + 输入保留（observed）；空名不禁用按钮的产品模式偏差记录（measured/observed）。
- facts E.2：B67/B68 保存视图空名禁用态浅深实测（measured），遮罩与状态摘要可见。
- facts G.3：新建任务抽屉 22 控件枚举（title*、description、status、priority、assignee(+datalist)、parentId、startDate、dueDate、progress、effort、evidence、manualProgress、manualReason、milestoneId、repoUrl、branch、前置任务搜索 + predecessorIds×5 checkbox、取消、添加任务）。

---

## 7. 状态覆盖（逐态规范措辞）

### 规范要求
组件状态轴独立于变体，每个可交互控件覆盖适用子集。以下逐态：

| 状态 | 规范措辞 | 项目依据 |
|---|---|---|
| **normal 常规** | ghost 透明底 + `--pm-line` 边 + `--pm-text` 字；primary 中性填充；danger 透明底 + 危险字；icon 32px 方（依据：建议稿 H-1 DOM 核真，待 G3 复验） | facts G.1 |
| **hover** | 行/项 hover 底 `--pm-hover`；按钮 hover 提边框一档 + 浅底；反馈 120ms（`--pm-motion-fast`）；不靠 hover 独占信息/动作，键盘 focus 常显（依据：设计惯例，待验证） | facts E.4（按钮 hover B48 measured）；facts B.3 |
| **focus-visible** | 键盘焦点 2px `--pm-accent` 描边 + 1px offset，全局 `:focus-visible` 统一；**取语义 token，禁止组件内硬编码蓝 hex**；鼠标点击不强制显示 | facts E.4（B40/B49/B41 measured；全局样式 DOM） |
| **pressed/active** | 按压给轻微反馈，不位移布局（依据：设计惯例，待验证；G3 未触发，§12） | 建议稿 F-1 |
| **selected 选中** | 选中用 `--pm-tint-accent` 浅底 + 文字/图标区分，可编程选中态（`aria-pressed`/`aria-selected`），不靠 class alone（依据：建议稿 F-1 DOM 线索，待 AT 复验） | facts A.1 tint；建议稿 F-1 |
| **disabled** | 降透明度 + `cursor:not-allowed` + `disabled` 属性；不承担只读语义 | facts E.2 measured |
| **loading（仅异步路径）** | 仅异步路径（AI generate、整批/逐步执行、保存慢路径）：立即禁用 + 加载指示，防重复提交；**常规本地视图不引入骨架屏**（已排除通用骨架屏） | facts E.4 未触发；§12-3；建议稿 F-1 |
| **empty 空态** | 诚实说明「尚无 X」≠「共 0 项」伪装零值；给下一步 CTA（去重，不与页头主 CTA 重复）；空过滤结果与真空分开；不留白屏 | facts E.5（会议纪要「尚无会议纪要」+CTA「新增会议」；进度汇报「暂无进度汇报…生成快照」；交付物「共 0 项 · 按状态分组管理」+CTA「新增交付物」，observed，浅深一致） |
| **error / 全局错误 Notice** | 内联错误贴近字段（§6.2）；全局错误 Notice 用 `role=alert`、**不自动消失**（已排除错误 toast 自动消失）、可复制路径；超时给重试；失败保留输入 | 建议稿 F-1；§12-3/§12-8（未触发取证） |
| **success 成功** | 可见 + 可编程反馈（Notice `role=status`，不抢焦点）（依据：设计惯例，待验证；G3 未触发，§12-3） | 建议稿 F-1 |
| **stale 陈旧** | 刷新中保留旧数据并标「更新中/陈旧」，不用空白替换可信旧数据，标最后更新时间（依据：设计惯例，待验证，§12-21；本项目离线本地数据，stale 主要面向未来远程/AI 路径） | 建议稿 F-1 |
| **长文 LONG** | 单行 input 横滚为**已拍板口径（T-DEF-003，产品 2026-10-17 拍板保留单行横滚）**，不要求超长名换行；textarea 自动换行、高度随内容增长、无叠印；长文内部滚动而非整条溢出 | facts E.3（B50 标题 142 字 `overflowX=true`、h=36；B51 说明 686 字换行增高；B52 URL/B53 长名横滚，measured/observed） |

### 实现锚点
- facts E.3：T-DEF-003 决策记录（CLOSED）。
- facts E.5：三类空态 observed（浅深一致）。
- facts E.4：任务行 hover 背景、active/pressed、loading、成功 toast 在 G3 未触发（§12-15/§12-3）。

---

## 8. 响应式（1440 / 768 / 390 三档）

### 规范要求
8.1 **区分两套宽度概念**：
- **采证档（G3 目视）**：1440 / 约768 / 390 × 浅/深，逐视图无破版/叠印/外壳溢出。
- **内容断点（实现）**：按内容定，不按设备定；建议四带：D ≥1280 全多列 / C 960–1279 收低频列 / B 561–959 双栏保留 + 身份列吸左 + 工具条换行 / A ≤560（含 390）表格卡片化、master-detail 单列、抽屉 1 列（建议稿 G-1-1，依据：设计惯例，待验证）。
- 注意：1440/768/390 是**验收目标档，不是现有 CSS 断点**；现存 `@media` 560/900/980/1100 + `@container` 760/540（facts F.4，DOM）。
8.2 **1440（D 桌面舒适）**：高密度多列；master-detail 双栏；表格全列；全 10 视图浅深成对镜像，间距/圆角/边框一致，无视觉漂移（facts F.1 G01 PASS observed）。
8.3 **768（B 平板/窄桌面）**：工具条换行；**「编号」身份列与比较关系必须保留**，不靠横滑暴露身份；表体在 `.pm-shell` 内部横向滚动属**已裁决例外**（右缘优先级/进度/操作列在内部滚动区而非外壳溢出，与甘特轴内部滚动同类）；doc 宽 = 视口宽，无外壳横向溢出；任务行无叠印（facts F.2）。
8.4 **390（A 移动/极窄）**：
- 任务页表格→卡片：`thead` 隐藏、卡片堆叠，**不删字段、标题完整**（建议稿 G-1-4，待 390 全视图补证）；
- 新建任务抽屉全宽单列纵向堆叠、`overflowX=false`；底部「取消」「添加任务」`white-space:nowrap` 不折行（facts F.3，measured/observed）；
- 按钮 `white-space:nowrap` 不折行（facts G.1 DOM）；
- 甘特时间轴允许内部横滑（例外），身份信息不进横滑（facts F.4；建议稿 G-1-4）；
- **≤560px rail 设计性隐藏**：`.pm-rail{display:none}`，分组标签/rail 搜索/组折叠随 rail 隐藏，导航由 ViewSwitcher 扁平下拉承接（真实计数 + 选中带勾，扁平列表不渲染分组标签，属宽/窄两种呈现，非缺陷）（facts F.3，DOM + measured）。
8.5 **禁止 mobile-first 全部单列堆叠**（已排除项）：比较关系（master-detail、表格身份列、堆叠条）必须保留（建议稿 §0.3-4；facts F.2/F.3 实测口径）。
8.6 200% 缩放 / 320 CSS px 回流：内容不丢失、不出现双向滚动（合法二维内容如甘特时间轴除外）（依据：设计惯例，待验证；未测，§12-10）。

### 实现锚点
- facts F.1：1440 浅深 doc=1440 无外壳溢出；导出菜单 open/visible=true、3 项、menuRect 92×175（measured）。
- facts F.2：768 工具条 flexWrap=wrap/h179、身份列表头 visible、5 行 rowOverlap=false、doc768=768（measured）；表体内滚 1313/707 裁决例外。
- facts F.3：390 thead display=none、5 卡片、工具条 wrap/h365、shell 338/329 无溢出；抽屉全宽单列；railW=0；视图切换下拉 9 项真实计数 5/1/1/0/0/0/—/—/—、selected 带勾、groupLabels=[]（measured/observed）。
- facts F.4：抽样边界——768/390 仅任务页/抽屉/看板抽样，里程碑/风险/人员/会议/汇报/交付物/概览未逐张清验，390 未采甘特（§12-2）。

---

## 9. 控件（按钮四型 / 下拉 / 弹窗 / 抽屉 / chip / 键盘）

### 规范要求
9.1 **按钮四型（全产品统一，圆角同为 sm 8）**：

| 型 | 外观 | 使用边界 |
|---|---|---|
| Primary | 中性填充：浅近黑底白字 / 深反白近黑；每视图唯一主 CTA | 页面/表单主操作（新增/保存/生成快照）；**无蓝填充 CTA**（facts G.1 G05 PASS observed） |
| Ghost（Secondary） | 透明底 + `--pm-line` 边 + `--pm-text` 字，圆角 sm8 | 取消、次要动作、筛选切换（保存视图/按状态分组/导入/导出/分享） |
| Danger | 透明底 + `--pm-danger` 字，**不做填充红**，与主操作视觉/空间分离 | 删除、丢弃草稿；管理弹窗文本操作（重命名/设默认/删除）呈现，无填充 danger CTA |
| Icon | 32px 方、hover 浅底；**必须有编程可访问名**（aria-label 或可见文本，title 不计） | 行内编辑、关闭、刷新（铅笔/搜索） |

（facts G.1；icon 32px 依据建议稿 H-1 DOM 核真，待 G3 全量复验；§12 新增项）
9.2 **下拉/listbox**：trigger 为原生 button，`aria-haspopup` + `aria-expanded`；列表与选项语义角色完整；方向键移动、Enter 选中、Esc/点外部关闭；**关闭后焦点归还 trigger**（依据：设计惯例，待验证，APG listbox 模式；facts G.2 已实测 Esc 闭/外点闭/open=false）。
9.3 **弹窗**：`role=dialog`；打开焦点落入、关闭归还 opener；Esc/点遮罩关闭（不可逆确认门除外）；遮罩复用宿主 `--dsw-alias-bg-mask-1`；圆角 md12、中阴影；破坏性操作前确认门（facts G.2；建议稿 H-1-3，焦点陷阱待 AT 确认，待验证）。
9.4 **抽屉（右侧模态）**：scrim + 面板；Esc/点遮罩关闭；打开焦点落第一字段（title）、关闭经 rAF 归还 opener 焦点；390 单列全宽；取消零写、出错保留输入（facts G.3，DOM + observed）。
9.5 **chip/状态标签**：文字标签 + 色，底色按 §2.5 取对应 tint 比例（accent/success/warning 12%、danger 10%，mix 底/实色字），不自创比例，不单靠色；集合换行或 `+n` 可操作披露，不压成一行裁切；标签 nowrap，不可预测值才截断，截断给键盘/指针均可及的全名披露（facts G.4；建议稿 H-1-5，待验证部分）。
9.6 **焦点环**：2px `--pm-accent` + 1px offset（全局 `:focus-visible` 已定义，facts E.4 DOM）；**禁止硬编码蓝 hex 写进组件**（排除项）。
9.7 **键盘可达与 focus-visible（总条款）**：纯键盘可完成关键路径；Tab 序 = 视觉序；无焦点陷阱；裸可点件优先改原生 button，否则补 `role=button`+`tabIndex=0`+Enter/Space+编程可访问名；自定义 tab 用完整 tablist/tab/tabpanel/aria-selected/方向键；**拖拽必须有单指针/键盘替代**（facts G.5 observed 关键路径；建议稿 H-1-7，拖拽替代未实测，§12-5）。
9.8 **z 层阶**：用既有 `--z-sticky:20 / --z-pop:40 / --z-modal:60`，禁止随手大 z 值（依据：建议稿 H-1-8 DOM 核真，待验证）。

### 实现锚点
- facts G.1：主按钮中性全量 observed；ghost/icon/danger 可辨；修复后 ghost 8px measured；全局按钮文字 `white-space:nowrap`（DOM）。
- facts G.2：导出下拉 3 项（Markdown 周报/CSV UTF-8/JSON）锚定按钮下方；1440 浅展开/Esc 闭/外点闭三态齐、1440 深展开直证；关闭 measured open=false 无残留浮层；命名视图菜单 6 内置 +「管理视图」，内置锁定禁用、自定义可重命名/删除。
- facts G.3：抽屉打开焦点落 title、Esc 关闭焦点归还（B41/B42 observed）；22 控件无错位（B34-B38）。
- facts G.5：Tab×14 顺序无跳号；三类浮层 Esc 关闭并归还焦点；纯键盘关键路径 B46/B47 observed。
- facts G.6：只读快照 0 script/0 http/0 href-src/1 内联 SVG 锁，自包含（measured/确定性核查）。

---

## 10. 验收 checklist 引用

10.1 验收逐项勾选使用 `docs/design/system-ui-checklist-20261017.md`，按本规范章节分组；每条含检查项、可客观判定的通过标准、最低证据等级、所属门。
10.2 勾选时必须填证据类型与定位（文件:行 / 批次编号 / 视口 / 主题）；不适用项写 N/A + 理由，不留空勾（建议稿 I-1）。
10.3 自动静态门（G1/G2）结果只是输入，不替代 G3 真实 GUI 目视与 AT 实测。

---

## 11. 迭代接入：门机制、三权分离、缺陷流程

### 规范要求
11.1 **三权分离**：规范所有者（设计/PM）维护规范与组件契约、裁决语义与例外，**不直接改产品代码**；开发是唯一改产品代码者，按规范迁移并绑定 HEAD SHA + 工作树指纹；独立测试专家（docs/testing）给 PASS/FAIL/BLOCKED/MANUAL_PENDING，**失败阻断**，自动静态门通过不替代 G3（依据：建议稿 J-1-1【基线冻结 §6】；facts H）。

11.2 **新功能/改版必须过的门（顺序固定，沿用 G1–G5，不另造门）**：

| 门 | 类型 / 执行主体 | 通过要求 | 最低证据等级 |
|---|---|---|---|
| **G1 构建与全量回归** | AUTO / **CI 流水线（开发提交触发）** | `pnpm build` / `pnpm test`(+coverage) / verify-isolation / e2e（SKIP 须 exit 0 诚实标注）；任一不过即 FAIL | 构建/测试确定性日志（DOM/确定性） |
| **G2 Token 静态门** | AUTO / **CI 静态扫描（开发提交即跑，开发负责修到零命中）** | 迁移映射全覆盖、旧别名同值可解析、零未定义 var、宿主别名优先、计算 AA、零暖色/新品牌/渐变/光晕/硬编码蓝 | DOM（静态扫描） |
| **G3 真实 GUI 目视门** | 硬门槛 / **独立测试专家执行** | 浅/深 × 1440/768/390 逐视图 + 关键状态（正常/空/长文/报错/禁用/关键交互/键盘）；DOM 断言/计算色值/mockup 标注不得代替目视 | 关键路径 **observed**；尺寸/色值 **measured**；截图单独不成立 |
| **G4 非回归门** | 独立测试 / **独立测试专家执行** | 已 PASS 项零回退（主按钮中性、浅色对比、甘特关键路径、抽屉校验/Notice、看板互斥、空态诚实、AI 草稿不落库、390 回流、项目下拉消歧） | observed |
| **G5 证据与绑定** | 独立测试 / **独立测试专家登记，开发提供 SHA+指纹** | 结论绑定被测 SHA + 工作树指纹；真实/模拟分开；MANUAL_PENDING 只留给需真实凭据/在线模型的项（空 Key/离线/凭据错误 = AUTO 确定性模拟，不扩大人工豁免） | 确定性绑定记录 |

（门框架依据建议稿 J-1-2【基线冻结 §6】；G3 内 12 个终审子门 T2-G01～G12 见 `g3-evidence-receipt-20261017.md` §F.1，本次全部 PASS）

11.3 **收口判据**：G3 各终审子门全部 PASS（或 FAIL 修复后复测 PASS）方可建议 G3 PASS；任一 BLOCKED 未补齐即整体 BLOCKED（receipt §E）。G3 未过期间，候选可并行开发与离线确定性测试，但不等于 G3 PASS；发布合入按门顺序、不继承旧 PASS。

11.4 **缺陷流程（S1–S4，OPEN→FIXED→RE-VERIFIED）**：
- 严重度（`defect-format.md`）：**S1 阻断**（核心写路径不可用/数据损坏丢失/安全门绕过，立即修、阻塞发布）；**S2 严重**（高频主流程效率/正确性受损有绕行，发布前必修）；**S3 一般**（边界/打磨/文案/空态/加载反馈，排期修，未经特批不带病发布）；**S4 观察**（文档/一致性 drift/建议项，记录不阻塞）。严重度只排修复先后，不自动豁免；带病发布须所有者单独特批留痕（ADL-045）。
- 生命周期：**OPEN**（测试专家登记附证据）→ **FIXED**（开发修复提交新 commit，说明改动文件）→ **RE-VERIFIED**（测试专家对新提交复验该缺陷 + 受影响范围回归，通过则关闭）；WONTFIX 仅所有者特批并留痕。
- 三分类：可复现缺陷（走 S1–S4 生命周期）；视觉一致性偏差 System drift（按系统根因统一，不单点修补）；主观机会 Opportunity（先定义成功度量，不赋 S 级，不与缺陷混排）（建议稿 J-1-3）。
- 新提交使历史结论受影响 → 相关用例回退「过期」，重测后方可再引用（defect-format §3-4）。

11.5 **证据等级过门最低要求**：G2/DOM 级可过静态门；G3 关键路径必须 observed（实见）或 measured（对比/尺寸）；截图单独不成立；AT 项需读屏/键盘实测记录（浏览器/视口/路径）（建议稿 J-1-6；facts H）。

11.6 **与 G3 门/缺陷台账的承接**：本次 T-DEF-001（ghost 圆角 12→8px，S3，源码改 `var(--r-sm)` + E14/E15 1440 浅深复验 CLOSED）、T-DEF-002（遮罩类名改 `.pm-modal-mask`，S4，复验 CLOSED）、T-DEF-003（单行 input 横滚口径，S4，产品拍板保留关闭）三项全部 CLOSED，作为新缺陷登记的格式与生命周期范例（receipt §D/D.1；facts H）。

11.7 **新功能准入（进 PR）**：勾选 checklist 对应域；声明复用公共组件/契约，分叉登记为有意例外；附 G1/G2 自动结果 + G3 采证编号或截图路径 + 受影响控件 ID（建议稿 J-1-4）。
11.8 **规范变更触发刷新**：token 改名、组件增删、视图调整 → 控件台账分母回退「待刷新」，重盘点后再冻结；P2-6（AI 溯源/不确定性/撤销恢复）落地并独立验收前，相关单元保持待验证，不得因源码有名就算实装（建议稿 J-1-5；facts A.1 ai 槽位只定义不启用）。

---

## 12. 未证实 / 待验证清单

> 以下为规范必然涉及、当前无 observed/measured 证据的点；成文已标「待验证」，禁止写成已达标。「补证方式」注明后续走查/专项取证动作。编号 1–15 沿用 facts §I；16 起为本稿新增。

| # | 待验证项 | 当前状态 | 补证方式 |
|---|---|---|---|
| 1 | 真实浏览器对比度实测：次文本/状态色/深色板未做 computed 抽测；5.14/4.58/5.39/18.90 均为白底静态计算，深色对比未测（facts I-1/D） | 静态计算 | G3 measured 浅深逐角色抽测 |
| 2 | 768/390 全视图覆盖缺口：仅任务页/抽屉/看板抽样；里程碑/风险/人员/会议/汇报/交付物/概览两档未逐张清验；390 未采甘特（facts I-2/F.4） | 抽样 | #51 全系统走查逐页补证 |
| 3 | 加载/异步禁用/成功态/慢请求：本地秒开，loading 按钮禁用、防重复提交（清单 E10）、成功 Notice `role=status` 不抢焦（清单 F9）、慢路径反馈未触发取证（facts I-3） | 未触发 | 人为制造慢路径专项（覆盖 E10/F9） |
| 4 | 屏幕阅读器/AT 名称与角色：D-01 看板状态柱无 role/键盘；D-02 人员堆叠条无 role/键盘；D-03 看板配置 span 伪 tab；D-04 里程碑 chip 裸 span；D-05 甘特未排期行裸 div；D-06 配置关闭 × 缺 aria-label（facts I-4） | 源码缺口 BLOCKED/待GUI-AT | AT 实测复验，不冒充实测失败 |
| 5 | 拖拽/自定义手势的键盘替代：看板 HTML5 拖拽、甘特 move/resize 单指针替代、inflight 预览/落点高亮未实测（facts I-5） | 未实测 | 专项 AT/键盘取证 |
| 6 | ProjectSwitcher 同名消歧（id/日期/负责人副标）与关闭后 focus() 归还 trigger（facts I-6） | 未实测 | G3 走查 |
| 7 | 大数据/虚拟化性能：无虚拟滚动/窗口化，大量任务/长列表渲染滚动未构造大样本（facts I-7） | 未知 | 大样本构造取证 |
| 8 | Notice 长文滚动与成功反馈：长 Notice 不裁切、成功/错误变体、复制路径、成功 Notice `role=status` 可编程反馈（清单 F9）未触发（facts I-8） | 未触发 | 专项（覆盖 F9） |
| 9 | 真实模型生成闭环（MANUAL_PENDING）：在线生成/真实 Key 链路需用户凭据；P2-6 溯源/不确定性/撤销恢复未实现，不得当实装（facts I-9） | MANUAL_PENDING | 待 P2-6 落地独立验收 |
| 10 | 200% 缩放 / 320 CSS px 回流未测；768 档无原生断点（facts I-10） | 未测 | 专项 Reflow |
| 11 | 全局密度档位：紧凑/默认档位定义与像素差无 measured（facts I-11/B.4） | 未证实 | 产品确认 + measured |
| 12 | 字阶逐角色实测：16/700、13.5/650 等为设计约束，未逐角色 computed 复测；`--t-32/40` 命名与数值不一致待澄清（facts I-12/C） | 设计约束 | G3 computed 抽测 + 规范澄清 |
| 13 | H-1 线索：视图蓝 CTA 与抽屉中性 primary 是否分叉，需新 token 下抽测 computed 色值后判定（facts I-13） | 仅线索 | computed 抽测 |
| 14 | 390 scrollIntoView/渐隐提示、看板超长名截断 title、汇报三卡/空卡留白（facts I-14） | 静态假设 | G3 目视复核 |
| 15 | 任务行 hover 背景：bu 通道坐标外未采，仅有按钮 hover（facts I-15/E.4） | 未采 | 补采 |
| 16 | 字号碎片化 drift 收敛：9–28px 多档并存与冻结字阶的对齐，需逐条核后登记 drift 或有意例外（建议稿 C-2） | DOM 级线索 | #51 走查逐条核 |
| 17 | 图标按钮全量可访问名（aria-label）：候选上限约 39 处待逐条剔除误报（建议稿 H-2） | 待核 | DOM + AT |
| 18 | listbox/tab 完整键盘行为（方向键/Enter/焦点陷阱（清单 I4）/焦点归还）、自定义 tab 完整 tablist/tab/tabpanel/aria-selected（清单 I6）、分段控件 aria-pressed 视觉抽测（建议稿 H-2/F-1） | DOM 线索 | G3/AT（覆盖 I4/I6） |
| 19 | 表单校验双轨统一（原生 required 气泡 → 受控内联）、错误摘要焦点、失败保留输入的全视图覆盖；**内联错误 `aria-describedby` 绑定关系现状无 facts 观测（清单 E2，N2）**（建议稿 E-2） | 待统一/未取证 | 专项 + DOM/AT 核绑定（覆盖 E2） |
| 20 | 保存成功返回原上下文（视图/筛选/滚动位置）（建议稿 E-1-9） | 待验证 | G3 observed |
| 21 | stale 陈旧态：刷新中保留旧数据并标「更新中/陈旧」+最后更新时间，不用空白替换可信旧数据（清单 F10）；本项目离线本地数据，主要面向未来远程/AI 路径（建议稿 F-1 state model） | 待验证 | 远程/AI 路径落地后专项 |

---

## 13. 2026-10-18 追加：P0–P3 体验修复长期门禁增补（不改 §1–§12 冻结数值）

> 本节为 `docs/design/p0-p3-experience-repair-contract-20261018.md`（角色 A 设计合同）回写的长期门禁增补，只加门禁要求，不重算冻结 token/字阶/三档数值。合同为实现细节权威，本节为长期门框架。

### 13.1 G3 视口矩阵扩为四档 + 200% 缩放
- 原 §8 采证档 1440/768/390 保留；G3 新增 **1024** 档，四档为 **1440 / 1024 / 768 / 390**；每档 × 浅/深 × 100% 与 **200% 文本缩放**。
- 200% 下：标签换行不裁切、控件与全标签不断裂、无外壳二维横滚（§12 #10 由待验证升级为 G3 必测项）。
- 视口是测试点不是 CSS 断点；实现断点按内容定（§8.1 口径不变）。

### 13.2 组件契约六状态为必填
- 任何新反馈/卡片/面板组件，契约必须覆盖 **empty / typical / dense / long / error / loading** 六态（disabled/read-only 另轴）；每态有 fixture、可见行为与失败验收，happy-path 不得作为实现要求（合同 §5）。
- 反馈六分型独立成组件：toast / banner / confirm / result / card / chat，变体与状态分离，禁止一个万能组件（design-system-review）。

### 13.3 签字与独立验收（三权分离细化，沿用 §11.1）
- 设计专家对每条组件契约签字（Purpose/Anatomy/States/Responsive/Behavior/验收），未签字不进实现；
- 开发按契约实现并绑定 SHA+指纹；**独立测试专家**按 Given/When/Then 与矩阵独立 PASS/FAIL/BLOCKED，不复用实现者自测；
- 关键旅程（含 recovery/失败恢复/撤销/重试）逐路实测，纯键盘可完成核心流程，长内容（长标题/长 JSON/多记录）有内滚/折叠处理。

### 13.4 自动探针（G3 的辅助，不替代 G3）
- 新增只读探针（contract §8.2）：外壳 `scrollWidth≤clientWidth`、卡体 `scrollHeight` 可内滚不裁切、同层卡 bbox 相交=0、200% 标签不截断、焦点环/焦点归还；
- **自动绿 ≠ GUI**：G1 build/test/verify 与 G2 token 静态全绿只是前置，不构成 G3 GUI 通过；DOM 断言、计算色值、mockup、截图单独均不得代替独立目视（§11.1/§11.5 口径重申）。

### 13.5 对应合同
- 完整可执行条款、Given/When/Then 验收、B/C/D handoff 接口：`docs/design/p0-p3-experience-repair-contract-20261018.md`。

---

## 附：本规范成文边界
- 未重算/推翻 P2-2 冻结数值；未把设计约束升级为实测结论。
- 未运行浏览器、未改产品代码、未 commit。
- 视觉断言仅引 facts 条目；技能惯例条目均已标「待验证」；排除项未进入实现要求。

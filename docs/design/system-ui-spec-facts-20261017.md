# #50 系统 UI 规范 · 仅已验证/实测事实基线（2026-10-17）

> 用途：为「#50 系统 UI 规范制定」提供**只含证据**的事实底座。本文件不做设计主张、不推测视觉；
> 未取得证据的点一律进 §I「未证实清单」并标注「待验证」，规范成文时应显式标「待验证」，不得把本文件的静态计算/设计约束写成「已在界面实测达标」。
> 采集约束：本次只读审计，未运行浏览器、未改产品代码、未 commit。
> 被测实例：`http://127.0.0.1:3172/` 隔离实例（种子 1 项目 / 5 任务 / 1 里程碑 / 1 风险 / 1 风险项）。
>
> **证据等级（沿用 G09 判据，由高到低）**：`observed`（实见动作/状态）> `measured`（computedStyle/探针实测数值）> `DOM`（源码/样式直读，不等于交互实见）> `截图`（仅存档）。
> 「设计约束」指冻结规范文档写入的目标值，**未经真实浏览器复测的不算 measured**，已在条目中单独标注。

## 证据索引（来源缩写）
- [BASE] `docs/design/p2-2-visual-token-baseline-20261017.md`（P2-2 冻结视觉规则，设计约束）
- [RECEIPT] `docs/testing/g3-evidence-receipt-20261017.md`（12 门终审、缺陷台账、F 段收口）
- [PREP] `docs/design/system-ui-audit-preparation-20261017.md`（静态准备稿；其「静态假设/待验证」不得当实测）
- [INV] `docs/design/system-ui-control-inventory-20261017.csv`（348 行控件候选台账，静态 NOT_RUN）
- [M-BU] `/private/tmp/g3-shots/manifest-bu.md`（bu 通道 675 实测/动作记录）
- [M-E] `/private/tmp/g3-shots/manifest-e.md`（Playwright 真视口 1440/768/390 measured 断言）
- [CSS] `packages/dsh-pm-tool/src/client/panel.css`、`views/tasks.css`、`views/gantt.css`（源码直读 = DOM）
- [MMAP] `docs/design/p2-2-token-migration-map.md`（token 迁移映射、静态 AA 计算）
- [STORE] `docs/design/p2-6-storage-decision-20261017.md`（P2-6 存储决定，与 UI 视觉无关，仅背景）

---

## A. 视觉 token 与主题

### A.1 语义 token（源码直读 = DOM；宿主别名优先 → fallback 仅补缺失）
- [事实] 浅色 fallback 画布/表面 `--pm-canvas`、`--pm-surface` 均解析为 `var(--dsw-alias-bg-base, rgb(255,255,255))`；注意源码中 `--pm-surface` 的 fallback 写的是 bg-base 白，而非 [BASE] §1.2 表格字面的 bg-layer-1（两处口径差异，规范引用时以源码实测链为准）。[来源=CSS panel.css:39-40][证据等级=DOM]
- [事实] `--pm-accent: var(--dsw-alias-state-business-primary)`（品牌动作色，无本地 hex 覆盖）。[来源=CSS panel.css:30][证据等级=DOM]
- [事实] `--pm-text: var(--dsw-alias-label-primary, rgb(28,28,30))`；`--pm-text-2: var(--dsw-alias-label-secondary, rgb(97,102,107))`；`--pm-faint: var(--faint)`。[来源=CSS panel.css:106-108][证据等级=DOM]
- [事实] 浅色强制次文本：`body:not([data-ds-dark-theme]) .pm-shell { --muted/--pm-muted: rgb(105,110,116) }`（#696e74）；深色不覆盖，走宿主 tertiary 别名。[来源=CSS panel.css:171-178][证据等级=DOM]
- [事实] 状态色 fallback：`--pm-danger: var(--dsw-alias-state-error-primary, rgb(239,68,68))`；`--pm-success: var(--dsw-alias-state-success-primary, rgb(34,197,94))`；`--pm-warning: var(--dsw-alias-state-warn-primary, rgb(245,158,11))`。[来源=CSS panel.css:42-44][证据等级=DOM]
- [事实] 文本链接 `--pm-link: var(--dsw-alias-link, var(--dsw-alias-state-business-primary, rgb(72,104,178)))`（fallback #4868b2）。[来源=CSS panel.css:64][证据等级=DOM]
- [事实] 边框：`--pm-line: var(--dsw-alias-border-l2, rgba(0,0,0,0.1))`；`--pm-line-soft: var(--dsw-alias-border-l1, rgba(0,0,0,0.04))`；`--pm-hover: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.04))`。[来源=CSS panel.css:37-41][证据等级=DOM]
- [事实] 主按钮填充 `--pm-button-primary { background: var(--dsw-alias-button-primary-fill); color: var(--dsw-alias-label-primary-foreground) }`，hover 走 `--dsw-alias-button-primary-hover`；未定义本地品牌蓝填充。[来源=CSS panel.css:369-370][证据等级=DOM]
- [事实] 选中/悬停浅底 tint：`--pm-tint-accent/success/warning/danger` 由 color-mix（accent/success/warning 12%、danger 10%）生成，非手写百分比。[来源=CSS panel.css:121-124][证据等级=DOM]
- [事实] 图表序列 `--pm-chart-s1=var(--c-prog)`、`s2=var(--c-done)`、`s3=var(--c-block)`；**S4 不定义、不启用**。[来源=CSS panel.css:134-137][证据等级=DOM]
- [事实] P2-6 预留槽位 `--pm-ai-surface: transparent / --pm-ai-edge: var(--pm-line) / --pm-ai-mark: var(--pm-text-2)`，本批只定义不启用，无紫色品牌色。[来源=CSS panel.css:140-142][证据等级=DOM]

### A.2 浅/深两态实测值（measured/observed，非计算）
- [事实] 浅色 body/pm-shell 实测 `rgb(255,255,255)`，墨色字 `rgb(15,17,21)`；深色 body/pm-shell 实测 `rgb(21,21,23)`，近白字 `rgb(249,250,251)`。[来源=M-E §0 主题标记；E06/E09/E13 bodyBg][证据等级=measured]
- [事实] 1440 浅任务页实测背景 `rgb(244,245,247)`、内容区白（B19）；1440 浅看板背景 `rgb(249,250,251)`/白（C11）。[来源=M-BU A 批 B19/B20；M-E C11][证据等级=observed/measured]
- [事实] 左 rail 背景随主题实测：浅 `rgb(255,255,255)` = `--pm-surface` 白；深 `rgb(21,21,23)` = `--pm-surface` 深，两主题逐值相等、非硬编码暗色。[来源=M-BU D3(2) B58/B56][证据等级=measured]
- [事实] 命名视图菜单浮层 `.pt-vmenu`：浅 bg `#fff`、深 bg `#232324`，圆角 8px，双层菜单阴影（浅 `rgba(16,18,20,.06) 0 1px 2px + rgba(16,18,20,.08) 0 6px 18px`；深 `rgba(0,0,0,.4) 0 1px 2px + rgba(0,0,0,.5) 0 8px 22px`）。[来源=M-BU D3(3) B54/B56][证据等级=measured]
- [事实] rail logo 两主题均 `background-image:none` 平涂：浅 `rgb(65,118,230)`、深 `rgb(122,170,255)`，无渐变。[来源=M-BU D3(1) B58/B56][证据等级=measured]
- [事实] 遮罩主题感知：浅 `rgba(0,0,0,.24)`、深 `rgba(0,0,0,.5)`（修复后类名 `.pm-modal-mask`，走 `--dsw-alias-bg-mask-1`，fallback `color-mix(bg 45%, transparent)`）。[来源=M-E E14/E15；CSS tasks.css:445-451][证据等级=measured + DOM]
- [事实] 主题切换机制：面板不自带第二套开关，深色跟随 `body[data-ds-dark-theme]`，token 宿主别名优先→fallback，浅色 fallback 在 `.pm-shell` 作用域；`html[data-ds-theme-source=light|dark]` 为主题标记。[来源=PREP §3.6；M-E §0][证据等级=DOM]

---

## B. 间距 / 圆角 / 密度档位

### B.1 间距阶（源码直读 = DOM，theme-independent）
- [事实] `--sp-1 4 / sp-2 8 / sp-3 12 / sp-4 16 / sp-5 20 / sp-6 24 / sp-8 32 / sp-9 40 / sp-10 48 / sp-12 64`。[来源=CSS panel.css:94-95；[BASE]§1.5][证据等级=DOM]
- [事实] 抽屉体内边距 `padding: 24px 28px 28px`；抽屉表单纵向 `gap: 18px`；抽屉宽 `min(560px, 94vw)`。[来源=CSS panel.css:885-908][证据等级=DOM]

### B.2 圆角（源码直读 + 实测修复结果）
- [事实] 圆角别名：`--r-xs=4 / --r-sm=8 / --r=md 12 / --r-lg=16 / --r-xl=20 / --r-2xl=panel 28`，均跟随 `--dsw-radius-*` 宿主别名。[来源=CSS panel.css:87-92][证据等级=DOM]
- [事实] 控件/菜单统一 sm(8)，弹窗 md(12)：`.pt-ghost`、`.pm-chip`、`.pt-vmenu` 均 `border-radius: var(--r-sm)`；弹窗 `.pt-vm` 用 `var(--r)`(12)。[来源=CSS tasks.css:96/396-401；gantt.css:46；tasks.css:453][证据等级=DOM]
- [事实] **修复后实测（1440 浅/深运行时复验 E14/E15）**：`.pt-ghost` computed `border-radius=8px`（7 个元素全 8px），甘特页 `.pm-chip=8px`；T-DEF-001（修复前实测 12px）CLOSED。[来源=M-E E14/E15；RECEIPT §D T-DEF-001][证据等级=measured]
- [事实] 菜单阴影 `--pm-shadow-menu`（浅 16,18,20 轻弥散 / 深加重），弹窗 `--pm-shadow-modal`（中等弥散），暗色覆写非机械反色。[来源=CSS panel.css:127-128,165-166][证据等级=DOM]

### B.3 动效 token
- [事实] `--pm-motion-fast 120ms`（hover/选中）、`--pm-motion-base 180ms`（展开/面板）；缓动 `--ease: cubic-bezier(.22,.61,.36,1)`；只动 transform/opacity；存在 `prefers-reduced-motion` 全局降级块；抽屉进入动画 180ms ease-out。[来源=CSS panel.css:131-132,1105,895；[BASE]§1.6][证据等级=DOM]

### B.4 密度档位
- [事实] **未证实**：全局密度切换（紧凑/默认）的档位定义、像素差值在 G3 证据中无单独 measured 记录；G04 仅将其列为既有 PASS 项回归对象，未在本批复测。[来源=RECEIPT §B G04 备注][证据等级=未证实 → §I]

---

## C. 排版字阶

- [事实] 字体：沿用宿主系统栈 `--pm-font-sans`，不打包/不引远程字体；`.pm-shell` 全局 `font-size: var(--dsh-content-font-size, 14px)`、`line-height: 1.45`、`font-feature-settings:'tnum' 1`（数字 tabular-nums）。[来源=CSS panel.css:148-156][证据等级=DOM]
- [事实] 字阶 token 存量：`--t-10 10 / t-11 11 / t-12 12 / t-13 13 / t-14 14 / t-16 16 / t-18 18 / t-22 22 / t-26 26 / t-32 30 / t-40 38`（注意 --t-32/40 与命名数值不一致，源码如此）。[来源=CSS panel.css:96-97][证据等级=DOM]
- [事实] 设计约束（[BASE]§1.7，**非逐角色实测**）：页面标题 16/700、区块标题 13.5/650、正文 13–14/400、标签/元信息 11–12/600、数据 tabular；禁止放大所有标题解决层级。[来源=BASE §1.7][证据等级=设计约束]
- [事实] 抽屉标题实测/源码：header h2 `font-size:18px; font-weight:650`，其上 eyebrow 序号 10px muted。[来源=CSS panel.css:907][证据等级=DOM]
- [事实] rail 实测字阶（measured）：分组项 item 14px；`.pm-rail-sub` 10.5px——浅 sub `rgb(105,110,116)` vs item `rgb(97,102,107)`；深 sub 10.5px/400/`rgb(173,178,184)` vs item 14px（非 active `rgb(207,211,214)`、active `rgb(122,170,255)`）；sub 字号/字重/色独立不串样式。[来源=M-BU D3(6) B58/B56][证据等级=measured]
- [事实] rail 计数 `.pm-rail-count` 11px/600/muted + `font-variant-numeric:tabular-nums`。[来源=CSS panel.css:251][证据等级=DOM]

---

## D. 颜色语义与对比度

- [事实] 静态 AA 计算（白底，开发自算，非浏览器实测）：muted #696e74 = 5.14:1、faint #71767c = 4.58:1、link #4868b2 = 5.39:1、on-primary 白/近黑 = 18.90:1；faint 落 surface-2 仅 4.23:1 → 禁用该组合，改用 muted。[来源=MMAP §6；BASE §1.2][证据等级=静态计算（DOM 级，非实测）]
- [事实] 状态色语义分工（设计约束 + 源码）：success 仅 done/完成、warning 阻塞/待办、danger 逾期/删除/错误；状态 chip 必须**图标+文字标签+色**三者并列，不单靠红绿。[来源=BASE §1.2/§1.8；RECEIPT G04][证据等级=设计约束 + observed（chip 带文字标签见 B52）]
- [事实] 实测 chip 文字标签：前置依赖 5 项均带状态文字（已完成/进行中/未开始/受阻），非纯色点。[来源=M-BU B52/D3；RECEIPT G04][证据等级=observed]
- [事实] **未证实**：正文/次文本/状态色在真实浏览器浅深两态下的对比度未做 computed 实测抽测；深色次文本/状态色以宿主别名已调优值为准，开发侧未重调暗色板。[来源=BASE §6 已知限制][证据等级=未证实 → §I]
- [事实] 禁止项（设计约束，G2 静态门已扫零命中）：暖黄/偏黄底、新品牌色、品牌蓝大面积填充 CTA、渐变、玻璃拟态、光晕、彩色投影。[来源=BASE §1.2；MMAP §6][证据等级=静态门（DOM）]

---

## E. 表单与状态

### E.1 校验 / 内联报错（B39）
- [事实] 新建任务标题留空直接提交 → 内联错误「任务名称不能为空」定位在**字段正下方**（errY 在 titleY 之下），字段红框，出错后输入保留、未创建任务（关闭后仍 5 任务，零污染）。[来源=M-BU C 段 B39；RECEIPT G04/G08][证据等级=observed]
- [事实] 新建任务空名**不禁用**「添加任务」（实测 disabled=false、aria-disabled=null、opacity=1、可点），走「提交后内联报错」；这与保存视图空名禁用是**两种并存的产品模式**，非缺陷。[来源=M-BU C 段偏差记录；RECEIPT G04 备注][证据等级=measured/observed]

### E.2 禁用态（B67/B68）
- [事实] 保存命名视图弹窗、名称留空 → 「保存视图」`disabled=true`、`opacity=0.5`、`cursor=not-allowed`，浅/深镜像成立；遮罩与状态摘要（「全部 · 按 WBS 编号」）可见。[来源=M-BU E3 B67/B68；RECEIPT G04/G11][证据等级=measured]

### E.3 长文（B50/B51/B52/B53；T-DEF-003 已产品拍板）
- [事实] 标题单行 input 142 字中英混合：`scrollW1506 > clientW496`、`overflowX=true`、不换行、横向滚动仅显尾部、输入高 h=36。[来源=M-BU D2 B50][证据等级=measured]
- [事实] 说明 textarea 686 字 CJK+Latin：自动换行，`scrollW=clientW=491`、`overflowX=false`、高度 97 随内容增长、无叠印。[来源=M-BU D2 B51][证据等级=measured]
- [事实] 仓库/证据长 URL（112 字）、执行人 64 字长名：单行 input `overflowX=true` 横滚（产品确认的常规设计）；字段对齐无错位。[来源=M-BU D2 B52/B53][证据等级=measured/observed]
- [事实] T-DEF-003 经产品 2026-10-17 拍板「保留单行横滚」关闭，不要求超长名换行。[来源=RECEIPT §D T-DEF-003 / F.3-1][证据等级=决策记录]

### E.4 hover / focus（B40/B48/B49）
- [事实] hover「保存视图」按钮：`:hover=true`，实测 bg `rgb(255,255,255)`、border `rgba(0,0,0,0.12)`、color `rgb(15,17,21)`。[来源=M-BU D2 B48][证据等级=measured]
- [事实] focus-visible：B40 Tab 落点 `:focus-visible=true`，outline `rgb(65,118,230) solid 2px` 蓝环；B49 搜索框 focusVisible 蓝环（box-shadow 实现 outline）；B41 开抽屉焦点落入 title 输入框蓝环。[来源=M-BU D1/D2；CSS panel.css:190-193][证据等级=measured + DOM]
- [事实] 全局 focus-visible 样式：`outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 1px`（button/input/select/textarea 统一）。[来源=CSS panel.css:190-193][证据等级=DOM]
- [事实] **未证实**：任务行 hover 背景在 bu 后端坐标外未能采到（仅采到按钮 hover）；active/pressed 态、loading 态、成功 toast 在 G3 未触发。[来源=M-BU D3 偏差；RECEIPT §F.3][证据等级=未证实 → §I]

### E.5 empty 空态文案（observed，浅深一致）
- [事实] 会议纪要空态：「尚无会议纪要」+ 说明 + CTA「新增会议」。[来源=M-BU A 批 B26；M-E C06/C16][证据等级=observed]
- [事实] 进度汇报空态：「暂无进度汇报…生成快照」，含两个「生成快照」按钮。[来源=M-BU B27；C07/C17][证据等级=observed]
- [事实] 交付物空态：「共 0 项 · 按状态分组管理」+ CTA「新增交付物」；空态诚实不伪装零值。[来源=M-BU B28；C08/C18][证据等级=observed]

---

## F. 响应式：1440 / 768 / 390 三档实测

### F.1 1440 档（真视口 Playwright，E 批；C 批 1470×857 为近似）
- [事实] 1440 浅/深 doc 1440=1440，无外壳横向溢出；导出菜单展开 measured open/visible=true、itemCount=3、menuRect 92×175（x962 y440）。[来源=M-E E01/E04；§2][证据等级=measured]
- [事实] 1440 全 10 视图浅深成对镜像，间距/圆角/边框一致，未见视觉漂移（G01 PASS，终审抽查维持）。[来源=RECEIPT G01/F.1][证据等级=observed（逐张目视）]

### F.2 768 档（真 768×1024，E05/E06；B59/B60 为 CDP innerW=768 佐证）
- [事实] 工具条 `.pt-toolbar` computed `flexWrap=wrap`、高 179px（多行换行成立，浅深一致）。[来源=M-E E05/E06 §2][证据等级=measured]
- [事实] 「编号」身份列表头 visible（left363/right425），7 列表头 DOM 齐全；5 条任务行 `rowOverlap=false` 无叠印；doc 768=768 无外壳溢出。[来源=M-E E05/E06][证据等级=measured]
- [事实] **例外裁决**：表体在 `.pm-shell` 内部横向滚动（scrollW1313/clientW707），右缘优先级/进度/操作列在内部滚动区而非外壳溢出，不阻却 PASS（与甘特轴内部滚动同类例外）。[来源=RECEIPT G02；M-E §4][证据等级=measured + 裁决]
- [事实] 768 看板抽样（E07）：搜索/完成率环/里程碑交付物/状态规模/客观进度/成员负载/风险矩阵/周计划，doc768=768 无外壳溢出。[来源=M-E E07][证据等级=observed/measured]

### F.3 390 档（真 390×844，E08/E09/E10；B61-B66 佐证）
- [事实] 任务页表格→卡片：`.pt-thead` display=none，5 张 `.pt-grid` 卡片；工具条 wrap/h365（纵向堆叠）；doc/body 390=390、shell 338/329 无外壳横向溢出。[来源=M-E E08/E09 §2][证据等级=measured]
- [事实] 新建任务抽屉 390：全宽 390、单列纵向堆叠、`overflowX=false`；底部「取消」(53px)、「添加任务」(81px) `whiteSpace=nowrap` 不折行。[来源=M-E E10][证据等级=measured/observed]
- [事实] 390 PM 左导航整栏隐藏（railW=0/railVisible=false），看板经顶栏「更多」菜单进入，单列堆叠，doc/body390=390。[来源=M-E E11][证据等级=measured/observed]
- [事实] ≤560px 源码规则：`@media(max-width:560px){ .pm-rail{display:none}; .pm-crumb-bar{display:none}; .pm-topbar{padding:10px 14px;flex-wrap:wrap} }`——rail 及分组标签/rail 搜索/组折叠随 rail 设计性隐藏，导航由 ViewSwitcher 扁平下拉承接。[来源=CSS panel.css:2033-2040；RECEIPT G10][证据等级=DOM + measured]
- [事实] 390 视图切换下拉（E12 浅/E13 深）：open/visible=true、itemCount=9、真实计数（全部任务5 selected 带勾 / 里程碑1 / 风险与问题1 / 会议纪要0 / 进度汇报0 / 交付物0 / 项目概览— / 甘特排期— / 人员负载—）；`groupLabels=[]`（扁平列表不渲染「跨项目/计划与排期/协作与记录」分组标签，属宽/窄两种呈现，非缺陷）。[来源=M-E E12/E13 §2][证据等级=measured/observed]

### F.4 其他
- [事实] 甘特时间轴内部滚动为例外（D03 500 窄窗无外壳溢出，轴内滚动允许）；E05 表体内滚同类。[来源=M-BU D03；RECEIPT G02/G03][证据等级=observed/measured]
- [事实] 现存断点（DOM）：`@media` 560/900/980/1100 + `@container` 760/540；**1440/768/390 是验收目标档，不是现有 CSS 断点**。[来源=PREP §3.6/§12；CSS panel.css][证据等级=DOM]
- [事实] **未证实**：768/390 仅任务页/抽屉/看板抽样，里程碑/风险/人员/会议/汇报/交付物/概览未在该两档逐张清验；390 未采甘特；200% 缩放与 320px 回流未测。[来源=RECEIPT F.3-3][证据等级=未证实 → §I]

---

## G. 控件（仅列有证据的行为事实）

### G.1 按钮
- [事实] 主按钮中性填充（G05 PASS）：浅黑底白字 / 深反白近黑，全量未见蓝填充 CTA；ghost（保存视图/按状态分组/导入/导出/分享）、icon（铅笔/搜索）、danger（管理弹窗文本操作重命名/设默认/删除，无填充 danger CTA）可辨。[来源=RECEIPT G05；B19/E01 终审抽查][证据等级=observed]
- [事实] ghost 圆角修复后 8px 与工具条 primary/icon 一致（E14/E15 measured）。[来源=M-E E14/E15][证据等级=measured]
- [事实] 全局按钮文字 `white-space:nowrap`（`.pm-shell button`），窄窗顶栏按钮在 @container 540 处显式恢复 normal。[来源=CSS panel.css:186-187][证据等级=DOM]

### G.2 下拉 / 菜单 / 弹窗
- [事实] 导出下拉 3 项：Markdown 周报（结论/行动项/风险，贴周会）/ CSV 表格（UTF-8 Excel 直开）/ JSON 结构化（全字段）；锚定导出按钮下方；1440 浅展开/Esc 闭/外点闭三态齐，1440 深展开直证。[来源=M-E E01-E04；M-BU B31-B33][证据等级=observed/measured]
- [事实] 菜单关闭：Esc 关闭（B32/E02/B43/B44/B45）、点外部关闭（B33/E03）；关闭后 measured open=false，无残留浮层。[来源=M-BU/M-E；RECEIPT G11][证据等级=measured/observed]
- [事实] 命名视图菜单：6 内置视图 +「管理视图」入口；内置项锁定禁用、自定义可重命名/删除（B06）；保存流程生效（B05 用户视图「走查测试视图」出现）。[来源=M-BU B04/B05/B06][证据等级=observed]
- [事实] 管理视图弹窗：`.pm-modal-mask` 遮罩 + 面板，圆角 md12/中阴影；内置锁定、自定义可操作。[来源=CSS tasks.css:445-458；M-BU B55/B57][证据等级=DOM + measured]

### G.3 抽屉
- [事实] 抽屉右侧模态：scrim（`--dsw-alias-bg-mask-1`）+ 面板，Esc 关闭、点遮罩关闭；打开焦点落入第一个字段（title），关闭经 rAF 归还 opener 焦点（源码存在）。[来源=CSS panel.css:877-883；M-BU B41/B42；PREP C4][证据等级=DOM + observed]
- [事实] 新建任务抽屉字段（DOM 枚举 22 控件，B34-B38 分张覆盖无错位）：title*、description、status、priority、assignee(+datalist)、parentId、startDate、dueDate、progress、effort、evidence、manualProgress、manualReason、milestoneId、repoUrl、branch、前置任务搜索 + predecessorIds×5 checkbox、取消、添加任务。[来源=M-BU C 段；PREP F2][证据等级=DOM + observed]

### G.4 chip / 状态
- [事实] 前置依赖 5 项为 checkbox + 状态文字 chip（已完成/进行中/未开始/受阻）；chip 圆角 8px（修复后 measured）。[来源=M-BU B37/B52；M-E E14/E15][证据等级=observed/measured]

### G.5 键盘可达（B40-B47，675 浅；分辨率无关行为）
- [事实] Tab×14 顺序：宿主 rail（添加工作区/搜索会话/设置）→ PM 搜索框 → PM 导航项，无跳号。[来源=M-BU D1 B40][证据等级=observed]
- [事实] Tab→Enter 开抽屉焦点落 title；抽屉内 Esc 关闭并焦点归还「新建任务」（B41/B42）。[来源=M-BU D1][证据等级=observed]
- [事实] 三类浮层 Esc 关闭：命名视图菜单（B43，焦点归还触发项）、导出菜单（B44，焦点归还导出按钮）、宿主设置对话框（B45）。[来源=M-BU D1][证据等级=observed]
- [事实] 纯键盘关键路径 B46：Tab×9→Enter(进 PM)→Tab→Enter(切甘特)→Tab→Enter(开抽屉焦点落 title)；B47 Esc 取消、焦点归还、甘特视图保留。[来源=M-BU D1][证据等级=observed]

### G.6 只读快照（B18，G12）
- [事实] 下载快照 `G3-验收项目-任务-2026-10-17.html` 5123B：0 script、0 http、0 href-src、1 个内联 SVG 锁（emoji 已替换），自包含无外链，终审复核数值不变。[来源=RECEIPT G12；M-BU B18][证据等级=measured/确定性核查]

---

## H. 验收证据规则与门

- [事实] 12 门 T2-G01～G12 **全部 PASS**，整体 G3 收口通过（2026-10-17）；无 OPEN/FAIL 缺陷。[来源=RECEIPT F.1/F.2][证据等级=终审结论]
- [事实] 缺陷台账三项全部 CLOSED（[来源=RECEIPT §D/D.1/F.4][证据等级=measured + 决策]）：
  - T-DEF-001（S3）ghost 圆角实测 12px≠sm8 → 源码改 `var(--r-sm)`，E14/E15 1440 浅深复验 8px 闭合。
  - T-DEF-002（S4）遮罩类名 `.pt-vm-mask`/mask 变量链与规范字面不符 → 改 `.pm-modal-mask`，E14/E15 复验类名无残留、浅 .24/深 .5 闭合。
  - T-DEF-003（S4）单行 input 超长横滚口径 → 产品拍板保留单行横滚关闭。
- [事实] 证据等级约定：observed（实见动作/状态）> measured（实测对比）> DOM/源码 > 截图；截图数量≠覆盖，DOM/自动化断言不代替目视；探针/aux/resp/width-check 不计入门覆盖。[来源=RECEIPT 规则段；G09；PREP §7][证据等级=规则]
- [事实] 三视口口径 1440 / 约768 / 390，两主题浅/深，关键状态维度：正常/空/长文/报错/禁用/关键交互/键盘。[来源=RECEIPT 规则段][证据等级=规则]
- [事实] 控件候选台账 348 行（CONTRACT-SUB 46 + CONSUMER-PLACEMENT 11 + INTEGRATION 274 + SEMANTIC 12 + BACKDROP 5），静态 342 行 NOT_RUN/待证 + 6 行 BLOCKED/待GUI-AT，**无 PASS**，非验收覆盖率。[来源=PREP §3/§6；INV][证据等级=DOM（静态盘点）]

---

## I. 未证实清单（规范成文必须标「待验证」，禁止写成已达标）

> 以下为规范必然涉及、但当前无 observed/measured 证据的点；来源多为 PREP「静态假设」或 G3 未触发项。

1. **真实浏览器对比度实测**：次文本/状态色/深色板未做 computed 抽测；现有 5.14/4.58/5.39/18.90 均为白底静态计算（MMAP §6），深色对比未测。[PREP §7.2 H-5；BASE §6]
2. **768/390 全视图覆盖缺口**：仅任务页/抽屉/看板抽样；里程碑、风险、人员、会议、汇报、交付物、概览两档未逐张清验；390 未采甘特。[RECEIPT F.3-3]
3. **加载/异步禁用/成功态/慢请求**：本地数据秒开，loading 按钮禁用、防重复提交、成功 Notice、慢路径反馈未触发取证（NS-5 静态假设）。[PREP NS-5/§7.2 H-5]
4. **屏幕阅读器/AT 名称与角色**：焦点管理、读屏名称、aria 状态未做 AT 实测；D-01～D-06 为源码直读缺口（待 AT 复验，非已实测失败）：
   - D-01 看板状态柱 `div.pm-hero-barrow` 无 role/键盘（widgets.tsx:151）；
   - D-02 人员堆叠条 `div.pm-barrow` 无 role/键盘（widgets.tsx:332）；
   - D-03 看板配置 span 伪 tab 无 tablist/tab 模式（editor.tsx:365）；
   - D-04 里程碑关联任务 chip 裸 span 无 role/键盘（milestones.tsx:204）；
   - D-05 甘特未排期行裸 div 无 role/键盘，title 不算编程可访问名（gantt.tsx:457）；
   - D-06 配置关闭 × 按钮缺 aria-label（editor.tsx:362）。[PREP §7.1]
5. **拖拽/自定义手势的键盘替代**：看板 HTML5 拖拽源/落点、甘特 move/resize 的单指针替代、inflight 预览/落点高亮未实测（H-3）。[PREP §7.2 H-3]
6. **ProjectSwitcher 同名消歧与焦点归还**：同名项目 id/日期/负责人副标未实测；关闭后是否显式 focus() 归还 trigger 待验（H-4）。[PREP C1/§7.2]
7. **大数据/虚拟化性能**：无虚拟滚动/窗口化，大量任务/长列表渲染与滚动表现未构造大样本取证（NS-11）。[PREP §3.6/NS-11]
8. **Notice 长文滚动与成功反馈**：长 Notice 不裁切、成功/错误变体、复制路径未触发。[PREP AU-G05/C2]
9. **真实模型生成闭环（MANUAL_PENDING）**：AiAssistant 在线生成、真实 Key 链路需用户凭据；P2-6 溯源/不确定性/撤销恢复未实现，不得当实装。[PREP AU-D09/B05；STORE]
10. **200% 缩放 / 320CSS px 回流**：未测；768 档无原生断点。[PREP NS-8/§11]
11. **全局密度档位**：紧凑/默认的档位定义与像素差无本批 measured。[RECEIPT G04 备注]
12. **字阶逐角色实测**：16/700、13.5/650 等为设计约束（BASE §1.7），未在浏览器逐角色 computed 复测；--t-32/40 命名与数值不一致待规范澄清。[BASE §1.7；CSS panel.css:96]
13. **H-1 假设（未登记缺陷）**：视图蓝 CTA 与抽屉中性 primary 是否分叉，需新 token 下抽测 computed 色值后才能判定，当前仅线索。[PREP §7.2 H-1]
14. **390 当前视图 scrollIntoView/渐隐提示、看板超长名截断 title、汇报三卡/空卡留白**：均为待验证假设（O-1/O-2/NS-2/NS-3），无实测。[PREP §7.3/NS]
15. **任务行 hover 背景**：bu 通道坐标外未采，仅有按钮 hover（B48）。[M-BU D3 偏差]

---

## 附：本文件未做的事
- 未重算/推翻 [BASE] 冻结数值；未把设计约束升级为实测结论。
- 未读取/复用 `docs/verification/full-regression-20261017/` 91 张旧截图为结论（仅 PREP 线索，待新基线刷新）。
- 未运行浏览器、未改产品代码、未 commit。

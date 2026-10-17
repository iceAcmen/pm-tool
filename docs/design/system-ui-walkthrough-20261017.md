# #51 全系统 UI 统一走查表与修复工作单（2026-10-17，两路合并版）

> 本文件合并两路独立走查结果为统一对照表与修复工作单，**只读审计**：未改产品代码、未改规范/清单、未 commit。
>
> **两路来源**
> - **R 通道（render / Playwright 真视口）**：`system-ui-walkthrough-render-20261017.md`；全新临时 context，Chrome channel，1440×900 / 768×1024 / 390×844 × 浅/深 共 60 帧；measured 取 computedStyle 实色/尺寸/对比/圆角/字阶/可访问名。产物：`measured-20261017/measured-summary.json`（MS）、`probe-light.json`（PL）、`probe-dark.json`（PD）、`probe2-light.json`（P2）、`probe3-light.json`（P3）；帧清单 `/private/tmp/g3-shots/manifest-f.md`（F201–F260）；逐帧日志 `/private/tmp/g3-e-pw/render-log.json`。
> - **B 通道（bu / aha_browser_use GUI）**：`system-ui-walkthrough-bu-20261017.md`（BU），675×745 物理帧 + CDP 768/390 回流；帧清单 `/private/tmp/g3-shots/manifest-bu.md` F 段（F101–F135）；既有 facts 条目（B39/B41/B42/B46/B47/B50/B51/B59/B60/E05/E10/E12）转引 `system-ui-spec-facts-20261017.md`（FACTS）。
>
> **合并口径**：数值以 R 通道 measured 为准，B 通道 observed/measured 佐证；两路矛盾时以 R 实测数值裁定，B 观察作为旁注。G1/G2/G5 确定性门与源码静态项不由 GUI 通道判定，标「非本通道（转引）」。
> **结论图例**：**PASS**（本通道 observed/measured 闭合）｜**DEVIATE**（实测偏离冻结规范，进缺陷清单 W-DEF，留审证裁决）｜**待验证**（本通道无法闭合，未补证前不得勾达标）｜**非本通道**（G1/G2/G5/源码项，转引既有证据）。
> 被测：隔离实例 3172，种子 G3 验收项目（5 任务 / 1 里程碑 / 1 风险 / 1 交付物）；全程只读，结束 count=5 零写。

---

## 0. 两路矛盾消除记录（去重合并说明）

| 议题 | B 通道结论 | R 通道结论 | 统一裁定 |
|---|---|---|---|
| primary 圆角 12px vs ghost 8px 分叉（B4） | DEVIATE(measured)：ghost=8、主 CTA「新建任务」=12，同工具条不一致 | DEVIATE(measured)：ghost=8/vmenu=8、`.pt-primary`=12，浅深同值分叉（PL/PD `radius.primary=["12px"]`） | **DEVIATE，两路一致**，数值以 R 为准 → W-DEF-001 |
| 筛选 chip 圆角（B2/H8） | DEVIATE(measured)：chip=999px 胶囊，非 sm8；ghost 6 元素全 8 | PASS(measured)：ghost=8/vmenu=8；probe 未抽中 chip（`radius.chip=[]`） | **ghost/vmenu=8 PASS；chip 999px 单独成立 DEVIATE**（B 实测，R 未抽中不构成反证）→ W-DEF-002；H8 其余项 PASS |
| 页面标题字号（C1） | DEVIATE(measured)：任务页题「任务」实测 20px/700 | DEVIATE(measured)：字阶直方图 26×7 / 22×6 / 20×1 / 18×1 / 16×1（P2 `fontHist`），非冻结 16/700 | **DEVIATE，数值以 R 直方图为准**；B 的 20px 为单页观测旁注，两路一致指向「非 16/700」→ W-DEF-003 |
| 浅链接对比 / #4176e6 作文字色（D1/D3） | 无法取证（未重算 AA） | DEVIATE(measured)：浅 `--pm-link`=`--pm-accent`=`#4176e6`=4.23:1 <4.5，且属规范点名禁作文字色的 4.23 蓝 | **DEVIATE（R measured 首次闭合）** → W-DEF-004；B 未见蓝作文字仅为目视线索 |
| 筛选 chip 选中可编程态（F4） | DEVIATE(measured,部分)：chip `aria-pressed=null`，靠 class/描边 | 待验证（DOM 部分，未逐项核 aria） | **DEVIATE（B 实测线索）+ 待全量 DOM/AT 核 rail 选中** → W-DEF-005（范围限筛选 chip，rail 待核） |
| 进度汇报空态 CTA 去重（F7） | PASS(observed)：CTA 与页头不重复 | PASS(observed) **附观察**：汇报页页头「生成快照」与空态卡内「生成快照」同一动作重复（F209/F249），待裁决 | **DEVIATE(观察,待 owner 裁决)**，以 R 直证为准 → W-DEF-006；会议/交付物去重 PASS |
| 深色对比（D7） | 无法取证（部分 measured） | PASS(measured)：深 onCanvas text 17.45/text-2 12.11/muted 8.54/faint 4.92/link 7.83 全 ≥4.5 | **PASS，本次闭合 §12-1 深色部分**（faint-on-surface2 3.76 单列入 D2） |
| Icon 按钮可访问名（H4） | 无法取证（待核） | PASS(measured)：10 视图 250/250 按钮具 aria-label 或可见文本（100%，MS `iconCoverage`） | **PASS，本次闭合**（32px 尺寸抽测仍转引） |
| 全视图 768/390 补证（G3-7） | 部分 PASS（390 仅任务/抽屉/看板） | PASS(observed)：F225–F260 补齐其余 7 视图两档 + 390 甘特 F244/F254 | **PASS，本次闭合 §12-2** |
| textarea 换行增高（F12） | PASS(measured)：overflowX=false、h=97 随内容增长（F114/B51） | 待验证（转引 B51） | **PASS（B measured + FACTS E.3 闭合）** |
| 内联报错/保留输入/取消零写（E2/E6/E7） | PASS(observed)：F113/F114/F118/F120，count=5 | 待验证（转引 facts E.1） | E6/E7 **PASS**；E2 位置/红框 observed 成立但 `aria-describedby` 绑定未取证 → **待验证（§12-19）** |

---

## 1. 98 条逐项统一结论

> 门与最低证据等级沿用 `system-ui-checklist-20261017.md`；「证据」列给 R 数值 + B 佐证。

### A. Token 与主题（§2，9 条）

| 条 | 最终结论 | 数值 / 证据路径 |
|---|---|---|
| A1 单层语义 token 真源 | 非本通道（G2 DOM） | 转引 G2 静态门；R 仅运行时解析（PL/PD `tokens`），不替代源码扫描。 |
| A2 宿主别名优先→fallback | 非本通道（G2 DOM） | 转引 FACTS A.1；运行时解析见 PL/PD `tokens`。 |
| A3 浅深成对不机械反色 | 非本通道（G2 DOM），运行时佐证 | 深跟随 `body[data-ds-dark-theme]` 实测成立（PD `tokens.dark=true`；B F126/F132 浅深对照）；无本地第二开关/阴影暗色覆写属源码项转引 G2。 |
| A4 角色表无新造 | 非本通道（G2 DOM） | 转引静态门。 |
| A5 浅深背景实测一致 | **PASS（measured）** | 60 帧 bodyBg 浅 `rgb(255,255,255)`、深 `rgb(21,21,23)`（MS `overflow`/`surfaces`）；shell 浅 #fff/深同值，非硬编码暗色；B F132/F126 佐证。 |
| A6 选中/悬停走 color-mix | 非本通道（G2 DOM），运行时佐证 | `--pm-tint-accent=color-mix(in srgb,#4176e6 12%,transparent)`（PL `tokens`）；B 实测 rail 选中底 accent 12% mix（F 段 A6）；命中统计转引 G2。 |
| A7 图表 S4 不启用 / ai 槽位只定义 | 非本通道（G2 DOM） | 转引静态门（panel.css:135-142 仅 s1–s3、ai 槽位中性）。 |
| A8 禁止项零命中 | 非本通道（G2 DOM），运行时线索 | R/B 运行时均未见品牌蓝填充 CTA/渐变/玻璃/光晕；零命中扫描转引 G2。 |
| A9 菜单/弹窗浮层实测 | **PASS（浅 measured / 深转引+B observed）** | 导出菜单 `.pt-vmenu[role=menu]` 浅底 `#fff`、radius 8px、双层菜单阴影（P2 `overlays.exportMenu`）；保存视图弹窗 `role=dialog` radius 12px、mask `rgba(0,0,0,.24)`（P2 `overlays.saveDialog`）；深浮层 `#232324`/mask `.5` 转引 FACTS A.2，B F107/F133 佐证。 |

### B. 间距 / 圆角 / 密度（§3，8 条）

| 条 | 最终结论 | 数值 / 证据路径 |
|---|---|---|
| B1 内边距取 `--sp-*` 阶 | 非本通道（G2 DOM） | 源码绑定转引静态门。 |
| B2 控件/菜单圆角 sm8 | **PASS（RE-VERIFIED，W-DEF-002 CLOSED）** | ghost=8px、vmenu=8px 浅深一致（PL/PD `radius`）；**终审复验：1440 浅/深全量 5 枚 `.pt-chip`（全部5/进行中2/已完成1/已逾期0/我负责的5）computed `border-radius=8px`，由修复前 999px 胶囊收敛（`reverify.json` `A1_radius_light.chips`/`B1_radius_dark.chips`）；帧 G101/G102**。备注：密度「舒适/紧凑」分段仍 999px 胶囊，属另一控件，不在本项范围。 |
| B3 弹窗圆角 md12 | **PASS（measured）** | `.pt-vm[role=dialog]`=12px（P2 `overlays.saveDialog`；B F106/F118/F120/F133），未混用 8px。 |
| B4 同工具条圆角不分叉 | **PASS（RE-VERIFIED，W-DEF-001 CLOSED）** | 修复前同工具条 ghost=8/vmenu=8 而 `.pt-primary`=12px 分叉（PL/PD `radius.primary=["12px"]`）；**终审复验四档 primary=ghost=8px：1440 浅 G101、1440 深 G102、390 浅 G103、390 深 G104（`reverify.json` `A1_radius_light`/`B1_radius_dark`/`C1_radius_light`/`C1_radius_dark`，primary「新建任务」与 ghost「未命名视图」均 8px），分叉消除，符合 §3.2/§9.1**。O1 放置观察另列（见终审结论），非圆角问题。 |
| B5 抽屉内边距/gap/宽 | **PASS（measured 运行时）**；源码绑定转引 G2 | 抽屉面板 `padding=24px 28px 28px`、表单 `gap=18px`、宽 560px=min(560px,94vw)@1440（P2 `overlays.drawer` + P3）；`--sp-*` 源码绑定转引 G2。 |
| B6 密度贴合内容 | 待验证（observed 线索） | 任务表/卡片贴合内容（R/B）；里程碑单节点下方大片留白（F205/F225/F245）是否「无意义留白」待 owner 裁决；紧凑档可切（B F110 `dataset.density=compact`）但像素差未测（§3.6/§12-11）。 |
| B7 边框与阴影不同时上 | **PASS（observed）** | 平面视图仅底+hairline 无卡片阴影；阴影只见 menu/modal 浮层（F201/F203；B F132/F126）。 |
| B8 动效 token 合规 | 非本通道（G2 DOM） | 120/180ms、reduced-motion 块属源码，转引 G2（FACTS B.3）。 |

### C. 排版字阶（§4，9 条）

| 条 | 最终结论 | 数值 / 证据路径 |
|---|---|---|
| C1 页面标题 16/700 | **PASS（RE-VERIFIED，W-DEF-003 CLOSED）** | 修复前字阶直方图 26×7/22×6/20×1/18×1/16×1（P2 `fontHist`）；**终审复验 8 视图页题全 16px/700：任务 H1（G101，`A3_title_tasks`）、甘特 `.pm-gantt-title` div「甘特图」（G110）、里程碑（G111）、风险与问题（G112）、人员负载（G113）、会议纪要（G114）、进度汇报（G115）、交付物（G116）；反向核对项目概览 hero H1「G3 验收项目」26px/750 品牌层级原样保留未误改（G117，`views.overview.title`），符合 §4.1**。备注：甘特页题为 div 非 h1，语义层级另属 §9/AT，不在本项。 |
| C2 区块标题 13.5/650 | 待验证 | 直方图 13×46、12×102，未逐角色映射 h3；需专项 computed 抽测（§12-12）。 |
| C3 正文 13–14/400 | 待验证（部分） | 13×46 / 14×49 落区间（P2 `fontHist`）；字重 400 与离阶放大未逐段核；B observed 正文 14px/400 局部佐证。 |
| C4 标签/元信息 11–12/600 | 待验证（部分） | 11×113 / 12×102 落区间；字重 600 未逐项核；B measured chip 12/600、rail 计数 11/600 局部佐证。 |
| C5 数据列 tnum | 非本通道（G2 DOM）/ 部分 measured | 全局 `font-feature-settings:'tnum'`（panel.css:150，转引 G2）；P2 抽到 6 处 `.pm-rail-count` tnum 命中；长列表列宽抖动未验。 |
| C6 系统栈无远程字体 | 非本通道（G2 DOM） | 转引静态门。 |
| C7 截断给全名路径 | 待验证 | 超长名 title/披露未在种子数据触发，未逐处核；B observed 长名单行横滚（F114）局部线索。 |
| C8 层级不靠全放大 | 待验证（observed） | 未见所有标题同倍放大；未专项比对。 |
| C9 字阶 drift 登记 | **PASS（measured 登记）** | 碎片化分布 10×162/11×113/12×102/12.5×1/13×46/14×49/16×1/18×1/20×1/22×6/23×1/26×7（P2 `fontHist`）已作 drift 现状登记，不冒充达标。 |

### D. 颜色语义与对比度（§5，8 条；WCAG 实色 measured）

| 条 | 最终结论 | 数值 / 证据路径（浅 / 深，onCanvas） |
|---|---|---|
| D1 正文/链接 ≥4.5:1 | **PASS（RE-VERIFIED，W-DEF-004 CLOSED，token 层）** | text 18.90/17.45 ✅、text-2 5.80/12.11 ✅、muted 5.14/8.54 ✅；**终审复验浅 `--pm-link` 独立为 rgb(72,104,178)/#4868b2，onCanvas 5.39:1 ≥4.5（`reverify.json` `A4_contrast_light.matrix.--pm-link`，帧 G101）；深 link `#7aaaff`=7.83:1 无回退（`B4_contrast_dark`，帧 G102）**。链接实例落点见 O2（种子无 `<a>`，待有链接实例环境补证，不影响 token 层判定）。 |
| D2 faint 不落 surface-2 | 待验证（本通道受限） | 浅 `--surface-2`=`#fff`（与 canvas 同值），faint-on-surface2=4.58 无法复现禁用组合；深 surface2 `#2c2c2e` 上 faint=3.76 ❌、danger=4.24 ❌（PD `contrast`）；faint 实际落点需源码核（§2.4/§5.2）。 |
| D3 #4176e6 未作文字色 | **PASS（RE-VERIFIED，W-DEF-004 CLOSED，token 层）** | **终审复验 `--pm-link` 与 `--pm-accent` 已分离：浅 accent 保留 `#4176e6` 图形/大面角色（`A4_contrast_light.accent="#4176e6"`，不作文字），link 改走独立 #4868b2（G101/G102）；符合 §5.2「#4176e6 仅可作大面/图形」**。链接实例补证见 O2。 |
| D4 主按钮 on-primary 18.9:1 | **PASS（measured）** | 浅 fill `#0f1115`/on-primary `#fff`=18.90；深 fill `#f9fafb`=18.08（MS `onPrimary`）。 |
| D5 状态=图标+文字+色 | **PASS（observed）** | 任务行/人员/交付物 chip 均「色点/图标+文字标签+色」（F203/F207/F210/F246；B F114 前置依赖 5 项带文字、F117「有风险」），无 color-only 红绿。 |
| D6 语义色边界 | **PASS（observed）** | 蓝=进行/选中/焦点，绿=完成，琥珀=阻塞/临期，红=逾期/删除/待处理，灰=待办，未见越界（F206/F205；B D5/D6）。 |
| D7 深色独立复测 | **PASS（measured，闭合 §12-1 深色部分）** | 深 onCanvas：text 17.45 / text-2 12.11 / muted 8.54 / faint 4.92 / link 7.83 全 ≥4.5（MS `contrast.dark`）；faint-on-surface2 3.76 单列入 D2。 |
| D8 状态色文字单独实测 | 待验证（未触发） | 浅 onCanvas success 2.28 / warning 2.15 / danger 4.50；深 8.0 / 8.49 / 5.55；全视图 0 元素以 success/warning/danger token 色作文字（P2 `views.*.statusText=0`），文字用法未触发，留专项（§5.6）。 |

### E. 表单（§6，11 条）

| 条 | 最终结论 | 数值 / 证据路径 |
|---|---|---|
| E1 可见 label 禁 placeholder 替代 | **PASS（DOM/observed）** | 22 控件包裹式 `<label class="pm-field">` 可编程关联（P3 `drawer`/P2 markup；B F114 枚举），placeholder 仅提示。 |
| E2 内联错误贴字段+describedby | 待验证（位置 observed 成立，绑定未取证） | 空名提交→「任务名称不能为空」贴字段正下方、红框 `data-invalid`（B F113/FACTS E.1 B39）；`aria-describedby` 绑定关系无观测（§12-19），未补证前不得勾达标。 |
| E3 错误说因+修法 | 待验证（部分 observed） | 文案指明字段「任务名称不能为空」（B F113），未给额外修法；错误态危险色文字+红框成立。 |
| E4 受控校验弃原生气泡 | **PASS（measured）** | 抽屉 22 控件 `nativeRequired=0`（P3 `nativeRequired=0`），无原生 required 气泡；存量双轨统一转引建议稿 E-2。 |
| E5 必填标记一致 | **PASS（DOM/observed）** | 仅标题 `aria-required=true` + `.pm-field-required` 危险色 `*`（P3 `reqMarkers=1`；B F113 红色 * 一致）。 |
| E6 出错保留输入 | **PASS（observed）** | 空名报错不清空；长文填入后 Esc 保留（B F113/F114；FACTS E.1）。 |
| E7 取消零写 | **PASS（observed）** | 抽屉/里程碑/风险弹窗 Esc 后 count=5 无新增（B F114/F118/F120/F131）。 |
| E8 提交模式一致 | **PASS（measured）** | 保存视图空名 `disabled=true`/opacity 0.5/`cursor=not-allowed` 浅深镜像（P3 `saveDialog`；B F106/F133）；新建任务空名走提交后内联报错不禁用，属 §6.6 产品既定双模式，不混用。 |
| E9 disabled≠read-only | 待验证（disabled 侧 PASS，read-only 未构造） | disabled 属性+降透明+not-allowed 实测成立（P3；B F106/F133）；read-only 视觉/语义未构造。 |
| E10 异步提交即禁用防重 | 待验证（§12-3，未触发） | 本地秒开，pending 加载态未触发。 |
| E11 保存返回上下文 | 待验证（§12-20，未触发成功保存） | 未触发保存成功路径。 |

### F. 状态覆盖（§7，12 条）

| 条 | 最终结论 | 数值 / 证据路径 |
|---|---|---|
| F1 状态矩阵无遗漏 | 待验证 | normal/selected/disabled/empty/长文/error 已采；active/pressed/loading/success 未触发。 |
| F2 hover 不靠独占信息 | 待验证 | 按钮 hover 浅底（B B48 measured：bg #fff/border rgba(0,0,0,.12)）；任务行 hover 底未采（§12-15）；键盘 focus 常显见 F3。 |
| F3 focus-visible 取 token | **PASS（measured）** | 全局 `outline:2px solid var(--dsw-alias-state-business-primary)`+offset，浅 `rgb(65,118,230)`/深 `rgb(122,170,255)`，经别名 token 解析、组件内无硬编码蓝（PL/PD `focusRing`；B F135 佐证）。 |
| F4 selected 可编程 | **PASS（RE-VERIFIED，W-DEF-005 CLOSED，登记范围）** | 修复前筛选 chip 选中 `aria-pressed=null` 靠 class/描边；**终审复验：active 筛选 chip「全部5」`aria-pressed="true"`（浅 G101 `A1_radius_light.chips[0].pressed="true"`/深 G102 `B1_radius_dark.chips[0]`，其余 chip null）；rail 当前视图项 `aria-current="page"`，浅/深及 8 个步行视图逐站核对仅当前项带 page（`A5_rail_light`/`B5_rail_dark`/`views.*.rail`），符合 §7 selected 可编程**。其余自定义选中态（风险 tablist aria-selected 等）AT 全量核仍在 I6 待验证，不属本缺陷登记范围。 |
| F5 disabled 样式语义 | **PASS（measured）** | disabled 属性+opacity 0.5+not-allowed（P3 `saveDialogDisabled`；B F106/F133）。 |
| F6 loading 仅异步路径 | 待验证（observed 线索） | 常规视图无骨架屏/shimmer（R/B）；异步 loading 未触发。 |
| F7 空态诚实+去重 CTA | **PASS（RE-VERIFIED，W-DEF-006 CLOSED）** | 会议「尚无会议纪要」+新增会议（F208/F248/B F122）、交付物「暂无比状态交付物」+新增（F210/F230/F250/B F124）去重 PASS；**终审复验进度汇报页「生成快照」仅 1 枚、位于 `.rp-empty-card` 空态卡内（inEmptyCard=true/inHeader=false），页头重复入口已删：浅 G115 `views.report.report.snapCount=1`、深 G119 `views.report_dark.report.snapCount=1`；空态文案「暂无进度汇报。基于当前任务/里程碑/会议快照生成第一份周期汇报。」保留，符合 §7 empty 去重**。 |
| F8 错误 Notice 不自动消失 | 待验证（§12-8，全局 alert 未触发） | 内联错误停留可见（B F113）；全局 `role=alert` 未触发。 |
| F9 成功反馈可编程 | 待验证（§12-3，未触发） | 成功 Notice `role=status` 未触发。 |
| F10 stale 不替换旧数据 | 待验证（§12-21，离线本地无 stale 场景） | — |
| F11 单行 input 横滚口径 | **PASS（measured）** | 抽屉 input 高≈36.3px（P3 `fields`）；超长横滚 T-DEF-003 拍板口径，B F114 标题 142 字 overflowX=true/h36 佐证。 |
| F12 textarea 换行增高 | **PASS（measured）** | B F114/B51：overflowX=false、h=97 随 686 字内容增长、无叠印；FACTS E.3 闭合。 |

### G. 响应式三档（§8，15 条）

#### G.1 1440
| 条 | 最终结论 | 证据 |
|---|---|---|
| G1-1 无外壳横向溢出 | **PASS（measured）** | 1440 浅/深 20 帧 htmlScrollW=htmlClientW=1440，零外壳横滚（MS `overflow`）。 |
| G1-2 浅深成对镜像 | **PASS（observed）** | 1440 浅深同视图间距/圆角/边框一致（F201↔F211 等成对比对）。 |
| G1-3 主 CTA 唯一、无蓝填充 | **PASS（observed）** | 每视图唯一中性黑/反白主 CTA，无蓝填充（B F132 佐证）。 |

#### G.2 768
| 条 | 最终结论 | 证据 |
|---|---|---|
| G2-1 工具条换行 | **PASS（measured）** | `.pt-toolbar` flexWrap=wrap/h179 浅深一致（FACTS E05/E06；B B59/B60；F223/F233 目视复核）。 |
| G2-2 身份列保留 | **PASS（measured）** | 「编号」表头 visible（FACTS E05；B B59/B60 `hasIdCol=true`；F223）。 |
| G2-3 无叠印无外壳溢出 | **PASS（measured）** | 768 浅深 20 帧零外壳横滚；rowOverlap=false（FACTS E05；B B59/B60）；表体内滚 1313/707 属已裁决例外。 |
| G2-4 看板抽样无破版 | **PASS（observed）** | F221：搜索/完成率环/里程碑条/状态规模/成员负载/风险矩阵/周计划无贴边错位，双栏改堆叠。 |

#### G.3 390
| 条 | 最终结论 | 证据 |
|---|---|---|
| G3-1 表格→卡片不删字段 | **PASS（observed/measured）** | F243/F253：thead 隐藏、卡片堆叠、字段完整（FACTS E08）。 |
| G3-2 抽屉单列全宽 | **PASS（measured）** | overflowX=false、单列堆叠（FACTS E10；B B62/B65）。 |
| G3-3 按钮 nowrap | **PASS（measured）** | 取消/添加任务 white-space=nowrap（FACTS E10）。 |
| G3-4 无外壳溢出 | **PASS（measured）** | 390 浅深 20 帧 html/body=390，零外壳横滚（MS `overflow`）。 |
| G3-5 rail 隐藏走扁平下拉 | **PASS（observed/measured），附观察** | railW=0/display=none；任务视图 `.pm-view-switcher` 扁平下拉承接（9 项+计数+选中带勾，FACTS E12/E13）。**观察**：非任务视图在 390 未见常驻可见视图切换入口（R 以隐藏 rail DOM 程序点击切换），留审证，不另立缺陷。 |
| G3-6 甘特轴内部横滑例外 | **PASS（observed）** | F244/F254：身份列固定左、时间轴内部横滑，身份不进横滑区；B F115/F116 佐证。 |
| G3-7 全视图补证 | **PASS（observed，闭合 §12-2）** | F225–F230/F235–F240/F242/F250/F252/F260 补齐里程碑/风险/人员/会议/汇报/交付物/概览 768+390；390 甘特 F244/F254 已采。 |

#### G.4 回流
| 条 | 最终结论 | 证据 |
|---|---|---|
| G4-1 200% 缩放/320px | 待验证（§12-10） | 本通道未做 200% 缩放/320px 专项。 |

### H. 控件（§9，10 条）

| 条 | 最终结论 | 证据 |
|---|---|---|
| H1 Primary 中性填充 | **PASS（observed）** | 浅近黑底白字/深反白，每视图唯一主 CTA，无蓝填充（B F132）。 |
| H2 Ghost 可辨 | **PASS（observed/measured）** | 透明底+line 边+text 字，radius 8px（PL/PD `radius.ghost`；B F132）。 |
| H3 Danger 不填充红 | **PASS（observed）** | 删除/待处理透明底+危险色字（F206），无填充红 CTA。 |
| H4 Icon 按钮 32px 可访问名 | **PASS（measured，本次闭合）** | 10 视图 250/250 按钮具 aria-label 或可见文本（100%，MS `iconCoverage`；PL/PD `views.*.btnNamed=btnTotal`）；32px 尺寸抽测转引。 |
| H5 下拉三态齐 | **PASS（observed/measured）** | 展开/Esc 闭/外点闭，关闭 open=false（P2 `overlays.exportMenu`；B F107/F108/F109；FACTS G.2）。 |
| H6 弹窗语义与关闭 | **PASS（DOM/observed）** | `.pt-vm[role=dialog][aria-modal]`、mask .24、radius12/中阴影（P2；B F106/F118/F120）；Esc 闭转引 FACTS G.2。 |
| H7 抽屉焦点流转 | **PASS（observed）** | 开落 title、Esc 归还 opener（FACTS G.3 B41/B42；B F 段 H7 佐证）。 |
| H8 chip 集合 | **PASS（observed；圆角项随 W-DEF-002 RE-VERIFIED CLOSED）** | 色点+文字+12%/10% mix 底，换行不裁切（F207/F210；B F102）；原 999px 胶囊圆角偏差并入 W-DEF-002，终审复验 5 枚 chip 全 8px（G101/G102），不在此重复立缺陷。 |
| H9 按钮全局 nowrap | 非本通道（G2 DOM）/ 部分 measured | 全局 `.pm-shell button{white-space:nowrap}`（panel.css:183，转引 G2）；P2 仅甘特日/周/月分段按钮 ws=normal（`views.gantt.nowrap`），窄窗例外候选。 |
| H10 z 层阶 | 非本通道（G2 DOM） | z-sticky20/pop40/modal60 转引静态门。 |

### I. 键盘与无障碍（§9.7/§11，8 条）

| 条 | 最终结论 | 证据 |
|---|---|---|
| I1 纯键盘关键路径 | **PASS（observed）** | B46/B47：Tab×9→Enter 进 PM→Enter 切甘特→Enter 开抽屉焦点落 title→Esc 取消归还（FACTS G.5；B F135）。 |
| I2 Tab 序=视觉序 | **PASS（observed）** | B40 Tab×14：宿主 rail→PM 搜索→PM 导航无跳号（FACTS G.5）。 |
| I3 浮层 Esc 关闭+归还焦点 | **PASS（observed），附 S4 观察** | 命名视图 F105 归还「未命名视图」、设置承 B45；**观察**：导出菜单 Esc 后焦点落「保存视图」而非精确 trigger（B F108），记 S4 观察线索，不另立缺陷。 |
| I4 无焦点陷阱 | 待验证（需 AT，§12-18） | — |
| I5 裸可点件改原生/补角色 | 部分闭合 / 待 AT+DOM | D-02 人员条已 `role=img`+aria「open 1：逾期 0…」（P2 `views.people.dItems.D02_peopleBar`）；ms-row 编辑按钮有 aria-label；**D-04 里程碑 mark 仍 SPAN/role=null**（P2 `views.milestones.dItems.D04_milestoneMark`）；D-01 看板状态柱、D-03 配置伪 tab、D-05 甘特未排期行、D-06 关闭× 未逐项核。 |
| I6 自定义 tab 模式完整 | 部分 measured / 待 AT | 风险视图 `role=tablist`+2×`role=tab`（PL/PD `views.risk.roles`）；aria-selected/方向键/tabpanel 完整度待 AT。 |
| I7 拖拽键盘/单指针替代 | 待验证（§12-5，未实测） | 看板拖拽/甘特 move-resize 替代路径未测；B F116 仅读键盘微调面板说明，未实际微调（避免改种子日期）。 |
| I8 读屏名称与状态 | 待验证（需 AT） | 未接屏幕阅读器。 |

### J. 验收证据与门（§11，8 条）

| 条 | 最终结论 | 证据 |
|---|---|---|
| J1 G1 构建回归过 | 非本通道（G1 确定性日志，转引） | 渲染通道不判定，转引 build/test/verify-isolation/e2e 日志。 |
| J2 G2 静态门零命中 | 非本通道（G2 DOM 扫描，转引） | 转引静态门结果。 |
| J3 G3 目视非替代 | **PASS（方法合规）** | 关键路径以 observed/measured 为据，未用 DOM/计算色冒充目视，截图仅存档。 |
| J4 G4 非回归零回退 | 待验证（独立测试） | 已 PASS 项回归由独立测试核；B 本批未见回退线索，不代填。 |
| J5 G5 SHA 绑定 | 非本通道（G5 确定性记录，转引） | 转引。 |
| J6 缺陷走生命周期 | 非本通道（缺陷台账） | 本报告 DEVIATE 项供测试专家按 S 级登记 OPEN→FIXED→RE-VERIFIED。 |
| J7 有意例外登记 | 非本通道（G2/DOM） | — |
| J8 截图不单独成立 | **PASS（方法合规）** | 每条结论附 observed/measured/DOM 定位。 |

---

## 2. 统一偏差缺陷清单（W-DEF-01～06；终审 2026-10-17 全部 RE-VERIFIED/CLOSED，下列为原始登记留痕）

> 字段按任务要求：编号 / 清单项号 / 严重度 / 现象(实测数值) / 预期(规范条款) / 证据路径 / 修复方向。修复必须在既有 token/规范内改，**禁新造色值、禁新造圆角/字阶值**；被测提交 SHA 由开发绑定后补（J5）。严重度依 `defect-format.md` §1，最终 S 级由独立测试专家裁定。

### W-DEF-001
- **清单项号**：B4（同工具条圆角不分叉；关联 H2）
- **严重度**：S3（一般 · 视觉一致性打磨）
- **类别**：页面样式
- **现象（实测数值）**：同一工具条上 `.pt-ghost`=8px、`.pt-vmenu`=8px，而 `.pt-primary`=**12px**，浅/深同值分叉（PL/PD `radius.primary=["12px"]`；B F 段 B4 实测「新建任务」主 CTA=12px）。
- **预期（规范条款）**：§3.2「同一工具条上 ghost/primary/icon 圆角必须一致，不允许分叉」；§9.1 按钮四型统一 sm(8)。
- **证据路径**：`measured-20261017/probe-light.json`/`probe-dark.json` `radius`；`measured-summary.json` `radius.note`；BU 成稿 B4；帧 F132/F133。
- **修复方向**：`.pt-primary` 圆角由 12px 改绑 `var(--r-sm)`=8px（既有圆角 token 内收敛，不新造圆角值）；修复后 1440 浅深 measured 复验同条三型全 8px。
- **终审复验（2026-10-17，独立审证专家）**：`reverify.json` `A1_radius_light`(1440 浅 G101)/`B1_radius_dark`(1440 深 G102)/`C1_radius_light`(390 浅 G103)/`C1_radius_dark`(390 深 G104)：primary「新建任务」与 ghost「未命名视图」四档均 `r=8px`，分叉消除；逐张目视 G101/G102/G103/G104 成立。
- **状态**：**RE-VERIFIED / CLOSED**（2026-10-17 终审 measured 达标 + 帧目视；O1 主按钮 1440 放置观察另列，非本缺陷）

### W-DEF-002
- **清单项号**：B2（控件/菜单圆角 sm8）；关联 H8 chip 集合
- **严重度**：S4（观察 · 一致性 drift）
- **类别**：页面样式
- **现象（实测数值）**：筛选 chip 实测 **999px 胶囊圆角**，非 sm8；ghost(8)/vmenu(8) 已达标（B F102/F 段 B2 measured；R `radius.chip=[]` 未抽中，不构成反证）。
- **预期（规范条款）**：checklist B2「`.pt-ghost`/`.pm-chip`/`.pt-vmenu` computed `border-radius=8px`」；§3.2 控件统一 sm8。
- **证据路径**：BU 成稿 B2/H8；`manifest-bu.md` F 段偏差登记；帧 F102。
- **修复方向**：二选一——(a) chip 圆角改绑 `var(--r-sm)`=8px；(b) 若胶囊为有意设计，按 §11.2/§11.7 登记「有意例外（owner/理由/到期日）」，不得无声 drift。不新造圆角 token。
- **终审复验（2026-10-17，独立审证专家）**：采 (a)。`reverify.json` `A1_radius_light.chips`/`B1_radius_dark.chips`：1440 浅（G101）/深（G102）全量 5 枚 `.pt-chip`（全部5/进行中2/已完成1/已逾期0/我负责的5）均 `r=8px`，由 999px 胶囊收敛；目视成立。密度「舒适/紧凑」分段 999px 属另一控件，不在范围。
- **状态**：**RE-VERIFIED / CLOSED**（2026-10-17）

### W-DEF-003
- **清单项号**：C1（页面标题 16/700）；关联 C9 drift 登记
- **严重度**：S3（一般 · 字阶收敛）
- **类别**：页面样式 / 用户体验
- **现象（实测数值）**：视图页题实测落 26×7 / 22×6 / 20×1 / 18×1 / 16×1 多档（P2 `fontHist`），无 16/700 主导；B 实测任务页题 20px/700 旁证。
- **预期（规范条款）**：§4.1 页面标题角色 16/700（设计约束值，computed 抽测登记）；§4.5 层级不靠全放大。
- **证据路径**：`probe2-light.json` `fontHist`；`measured-summary.json` `fontHist`；BU 成稿 C1；帧 F132。
- **修复方向**：先由规范所有者澄清 26/22 各属何角色（§12-12 `--t-32/40` 命名待澄清），再在既有字阶 token 内把视图页题收敛到 16/700；存量其余档位逐条登记 drift 或有意例外，不新造字号。
- **终审复验（2026-10-17，独立审证专家）**：`reverify.json` `A3_title_tasks` + `views.*.title`：8 视图页题全 16px/700——任务 H1（G101）、甘特 `.pm-gantt-title` div「甘特图」（G110）、里程碑（G111）、风险与问题（G112）、人员负载（G113）、会议纪要（G114）、进度汇报（G115）、交付物（G116）；反向核对概览 hero「G3 验收项目」26px/750 保留未误改（G117 `views.overview.title`）；逐张目视 G101/G110–G117 成立。
- **状态**：**RE-VERIFIED / CLOSED**（2026-10-17；甘特页题 div 语义层级另属 AT 范畴，不在本缺陷）

### W-DEF-004
- **清单项号**：D1（正文/链接 ≥4.5:1）+ D3（#4176e6 未作文字色），同源合并
- **严重度**：S2（严重 · 高频文本对比 AA 不达标，有绕行）
- **类别**：网页实测 / 用户体验（无障碍）
- **现象（实测数值）**：浅态 `--pm-link` 与 `--pm-accent` 均解析 `#4176e6`，onCanvas 对比 **4.23:1 < 4.5**（MS `contrast.light./--pm-link`；PL `tokens`）；该 4.23 蓝正是 §5.2 点名「不得作文字色」的值；深 link `#7aaaff`=7.83 ✅ 不受影响。
- **预期（规范条款）**：§5.1 链接 ≥4.5:1；§5.2 `--pm-link` #4868b2=5.39:1 ✅、`#4176e6`(4.23) 不得作文字色仅可作大面/图形。
- **证据路径**：`measured-summary.json` `contrast.light./--pm-link`、`tokens.light.--pm-link/--pm-accent`；`probe-light.json` `tokens`/`contrast`。
- **修复方向**：`--pm-link` 回归独立链接 token（宿主 link 别名 → fallback `#4868b2` 5.39:1），与 `--pm-accent` 分离；**只在既有 token/角色内改，禁新造色值**；修复后浅态实测链接对比 ≥4.5 且 #4176e6 不出现于文字。
- **终审复验（2026-10-17，独立审证专家）**：`reverify.json` `A4_contrast_light`：`--pm-link`=rgb(72,104,178)/#4868b2 onCanvas 5.39:1 ≥4.5，`--pm-accent`=#4176e6 留图形角色（帧 G101）；`B4_contrast_dark`：link #7aaaff=7.83:1 无回退，text 17.45/text-2 12.11/muted 8.54/faint 4.92 全 ≥4.5（帧 G102）。O2：种子无 `<a>` 链接实例，落点以 token 解析+引用元素同色实测为准，待有链接实例环境补证（不阻却 token 层关单）。
- **状态**：**RE-VERIFIED / CLOSED（token 层，2026-10-17）**；链接实例视觉补证挂 O2

### W-DEF-005
- **清单项号**：F4（selected 可编程）
- **严重度**：S3（一般 · 无障碍可编程态缺失；范围限筛选 chip，rail 待核）
- **类别**：用户体验（无障碍）
- **现象（实测数值）**：筛选 chip 选中态 `aria-pressed=null`（亦无 `aria-selected`），仅靠 class/描边表达选中（B F102/F 段 F4 measured）；R 未抽中该属性，rail 选中态未核。
- **预期（规范条款）**：§7 selected「可编程选中态（`aria-pressed`/`aria-selected`），不靠 class alone」；checklist F4。
- **证据路径**：BU 成稿 F4；`manifest-bu.md` F 段偏差登记；帧 F102。
- **修复方向**：筛选切换 chip 补 `aria-pressed`（toggle 型）或 `aria-selected`，走既有 ARIA 属性不新造角色；随后 DOM 全量核 rail/其余选中态并补 AT。
- **终审复验（2026-10-17，独立审证专家）**：`reverify.json` `A1_radius_light.chips[0].pressed="true"`/`B1_radius_dark.chips[0].pressed="true"`（active「全部5」，浅 G101/深 G102，其余 chip null）；`A5_rail_light[2].cur="page"`/`B5_rail_dark[2].cur="page"` + `views.*.rail`：8 步行视图仅当前项 `aria-current="page"`，其余 null。登记范围（筛选 chip + rail 当前项）达标；其余自定义选中态 AT 全量核仍在 I6 待验证。
- **状态**：**RE-VERIFIED / CLOSED（登记范围，2026-10-17）**

### W-DEF-006
- **清单项号**：F7（空态诚实+去重 CTA）
- **严重度**：S4（观察 · 待 owner 裁决是否违反去重）
- **类别**：用户体验
- **现象（实测数值）**：进度汇报页页头「生成快照」与空态卡内「生成快照」为同一动作，两处重复出现（F209 浅 / F249 深，R observed）；会议/交付物空态 CTA 未重复。
- **预期（规范条款）**：§7 empty「CTA 去重，不与页头主 CTA 重复」；checklist F7。
- **证据路径**：`manifest-f.md` F209/F249；R 成稿 F7 观察。
- **修复方向**：owner 裁决保留位置（空态卡内或页头其一），删除重复入口；纯布局/文案调整，不涉色值。
- **终审复验（2026-10-17，独立审证专家）**：`reverify.json` `views.report.report`（浅 G115）/`views.report_dark.report`（深 G119）：「生成快照」`snapCount=1`、`inEmptyCard=true/inHeader=false`，页头重复入口已删，空态文案保留；逐张目视 G115/G119 成立。
- **状态**：**RE-VERIFIED / CLOSED**（2026-10-17，owner 裁决保留空态卡内位置）

> **S4 观察线索（不另立缺陷，留档）**：① I3 导出菜单 Esc 焦点归还非精确（落「保存视图」而非 trigger，B F108）；② G3-5 非任务视图 390 未见常驻可见视图切换入口（R F241–F260）；③ H9 甘特日/周/月分段按钮 ws=normal 为窄窗例外候选。

---

## 3. 待验证项状态分组

### (a) 本次已闭合（原 §12 待验证项，两路证据合并后可勾达标）

| 项 | 闭合证据 |
|---|---|
| D7 深色独立复测（§12-1 深色部分） | MS `contrast.dark`：text 17.45/text-2 12.11/muted 8.54/faint 4.92/link 7.83 全 ≥4.5 |
| H4 Icon 按钮可访问名（§12-17 主体） | MS `iconCoverage` 250/250=100%（32px 尺寸抽测仍转引） |
| G3-7 全视图 768/390 补证（§12-2） | F225–F260 全视图两档 + 390 甘特 F244/F254 |
| F12 textarea 换行增高 | B F114/B51 measured：overflowX=false、h97 增高无叠印（FACTS E.3） |
| E6 出错保留输入 / E7 取消零写 | B F113/F114/F118/F120/F131 observed，count=5 |
| E4 无原生气泡 / E5 必填标记 / E8 双模式 / F5 disabled / F11 单行横滚 | P3 measured + B observed 闭合 |
| W-DEF-001 同工具条圆角（B4） | RE-VERIFIED/CLOSED：四档 primary=ghost=8px（`reverify.json` A1/B1/C1；G101-G104） |
| W-DEF-002 筛选 chip 圆角（B2/H8） | RE-VERIFIED/CLOSED：5 枚 chip 全 8px（A1/B1 chips；G101/G102） |
| W-DEF-003 页题 16/700（C1） | RE-VERIFIED/CLOSED：8 视图 16/700，hero 26/750 保留（A3+views.*.title；G101/G110-G117） |
| W-DEF-004 浅链接独立 token（D1/D3） | RE-VERIFIED/CLOSED（token 层）：link #4868b2=5.39，accent 分离，深 7.83（A4/B4；G101/G102）；链接实例挂 O2 |
| W-DEF-005 selected 可编程（F4） | RE-VERIFIED/CLOSED（登记范围）：chip aria-pressed=true、rail aria-current=page（A1/B1 chips、A5/B5 rail、views.*.rail；G101/G102） |
| W-DEF-006 汇报空态 CTA 去重（F7） | RE-VERIFIED/CLOSED：snapCount=1 仅卡内（views.report/report_dark；G115/G119） |

### (b) 仍需环境/专项（本通道无法闭合，列出所需条件）

| 项 | 所需条件 |
|---|---|
| E10 异步提交即禁用防重、F6 loading、F9 成功反馈（§12-3/§12-8） | 人为制造慢路径/异步 pending（AI generate、整批/逐步、慢保存），观察按钮禁用+加载态、成功 Notice `role=status` 不抢焦 |
| F8 全局错误 Notice 不自动消失（§12-8） | 触发全局 `role=alert` 错误路径，验证停留至处理、可复制、无 3–5s 自动消失 |
| F1 active/pressed、F2 行 hover 底（§12-15） | 补采任务行 `--pm-hover` 120ms 反馈、pressed 按压态 |
| I4 无焦点陷阱、I8 读屏名称与状态（§12-18） | 接屏幕阅读器（NVDA/VoiceOver）AT 实测浮层 Tab 不逃逸、控件名/角色/状态播报 |
| I5 裸可点件逐项核销（D-01/D-03/D-04/D-05/D-06） | DOM 全量核 + AT；D-04 里程碑 mark SPAN/role=null 仍开（P2） |
| I6 自定义 tab 完整（aria-selected/方向键/tabpanel） | AT 复验风险视图 tablist 模式 |
| I7 拖拽键盘/单指针替代（§12-5） | 专项键盘/单指针取证看板拖拽、甘特 move/resize 替代路径（本次刻意不微调以免改种子日期） |
| E2 `aria-describedby` 绑定（§12-19）、E3 修法文案、E9 read-only 语义 | DOM 核绑定关系；构造 read-only 视觉/语义；补错误修法文案 |
| D2 faint 落点（深 surface2 faint 3.76/danger 4.24） | 源码核 faint 是否落 surface-2，确认禁用组合实际使用位置 |
| D8 状态色文字单独实测（§5.6） | 构造 success/warning/danger 作文字的场景并实测 ≥4.5 |
| C2/C3/C4 逐角色字阶、C7 截断全名、C8 层级 | 专项 computed 抽测 + 长名/长样本触发 |
| B6 密度贴合（里程碑留白、紧凑档像素差 §3.6/§12-11） | owner 裁决留白；产品确认紧凑档定义后 measured |
| F10 stale（§12-21）、E11 保存返回上下文（§12-20） | 远程/AI 路径落地后专项；构造成功保存路径核验视图/筛选/滚动还原 |
| G4-1 200% 缩放/320px（§12-10） | 专项 Reflow 取证 |
| J4 G4 非回归 | 独立测试对已 PASS 项做回归核 |

### (c) P2-6 F06/F12 MANUAL_PENDING（所需条件，不伪造数据路径）

- **涉及项**：AI 溯源「失效/警告条 F06」「不可变重校历史链 F12」（B F127–F131；`p2-6-storage-decision-20261017.md`）。
- **现状**：空台账「共 0 条 · 一致 0 · 待处理 0」，无已确认入库记录，无对象可校、无指纹可漂移，F06/F12 未能自然复现；未点「确认入库」，count=5 零写。
- **所需条件**：① 至少 **1 条经「确认入库」的 AI 溯源记录**（带来源 typed refs / 内容指纹 / 口径版本，落 `pmProvenanceLedger`）；② 其后该来源内容或口径版本发生**漂移/失效**，再触发「立即重校」才会出现 F06 失效/警告条与 F12 历史链。
- **结论**：MANUAL_PENDING（需真实入库条目 + 后续漂移；离线/PoC/空 Key 环境不扩大人工豁免，§11.2 G5 口径）。

---

## 4. 非本通道项（G1/G2/G5 静态/构建门，转引既有证据，不重复验证）

| 门 | 条目 | 转引对象 |
|---|---|---|
| G2 Token 静态门（DOM） | A1、A2、A3（源码部分）、A4、A6（命中统计）、A7、A8、B1、B8、C5（源码部分）、C6、H9（源码部分）、H10、J2、J7 | G2 静态扫描结果 / FACTS A.1、B.3；本报告不代填 PASS。注：C9/E4 运行时已 PASS，其源码治理/双轨统一部分仍转引 G2，不计入非本通道。 |
| G1 构建回归（确定性日志） | J1 | build/test(+coverage)/verify-isolation/e2e 全绿日志 |
| G5 证据绑定（确定性记录） | J5 | 被测 commit SHA + 工作树指纹绑定记录 |
| 缺陷台账 / 独立测试 | J4、J6 | 独立测试专家非回归核；本报告 W-DEF 供登记生命周期 |

---

## 5. 压缩摘要

**原 DEVIATE 缺陷清单（W-DEF-01～06；终审全部 RE-VERIFIED/CLOSED，下表为修复与复验对照）**

| 编号 | 项 | 严重度 | 现象(实测) | 修复方向 | 终审状态（2026-10-17） |
|---|---|---|---|---|---|
| W-DEF-001 | B4 | S3 | 同工具条 primary=12px vs ghost/vmenu=8px 分叉 | primary 改绑 `var(--r-sm)`=8px | **RE-VERIFIED/CLOSED**：四档 primary=ghost=8px（A1/B1/C1；G101-G104） |
| W-DEF-002 | B2/H8 | S4 | 筛选 chip 999px 胶囊 ≠ sm8 | 改 8px 或登记有意例外 | **RE-VERIFIED/CLOSED**：5 枚 chip 全 8px（A1/B1 chips；G101/G102） |
| W-DEF-003 | C1 | S3 | 页题 26/22/20/18 多档，非 16/700 | 规范澄清后字阶 token 内收敛 16/700 | **RE-VERIFIED/CLOSED**：8 视图 16/700，hero 26/750 保留（G101/G110-G117） |
| W-DEF-004 | D1/D3 | S2 | 浅 link/accent=`#4176e6`=4.23:1<4.5 且违规作文字色 | link 回归独立 token（#4868b2/5.39），与 accent 分离，禁新造色 | **RE-VERIFIED/CLOSED（token 层）**：link 5.39/深 7.83，accent 分离（A4/B4；G101/G102）；链接实例挂 O2 |
| W-DEF-005 | F4 | S3 | 筛选 chip 选中 `aria-pressed=null`，靠 class | 补 aria-pressed/selected，再全量核 rail | **RE-VERIFIED/CLOSED（登记范围）**：chip pressed=true、rail current=page（G101/G102） |
| W-DEF-006 | F7 | S4 | 汇报页页头与空态卡「生成快照」重复，待裁决 | owner 保留其一，删重复入口 | **RE-VERIFIED/CLOSED**：snapCount=1 仅卡内（G115/G119） |

**本次已闭合待验证项**：D7 深色对比（17.45/12.11/8.54/4.92/7.83 全 ≥4.5）、H4 可访问名 250/250、G3-7 全视图 768/390、F12 textarea 增高、E6/E7、E4/E5/E8/F5/F11；**终审新增闭合：W-DEF-001~006 全部 RE-VERIFIED/CLOSED**。

**仍开放项与所需条件**：异步慢路径（E10/F6/F9/F8）、AT 读屏（I4/I6/I8/I5 余项）、甘特/看板拖拽替代（I7）、describedby/read-only/修法文案（E2/E3/E9）、D2/D8 状态色与 faint 落点、C 系逐角色字阶、B6 留白与紧凑档、F10/E11、G4-1 回流、J4 非回归；P2-6 F06/F12 = MANUAL_PENDING（≥1 条确认入库溯源记录 + 后续来源漂移）。

**统计（98 条，终审终态）**：**PASS 55**（原 48 + 复验翻正 7 行：B2、B4、C1、D1、D3、F4、F7）｜ **DEVIATE 0**（6 项 W-DEF 全部 RE-VERIFIED/CLOSED）｜ 待验证 25（保持原条件，未勾达标）｜ 非本通道 18（转引 G1/G2/G5/缺陷台账）。

---

## 6. 终审结论（2026-10-17，独立审证专家）

### 6.1 执行体与方法

- **审证执行体**：独立审证专家（只读审计）；采证/复验为 Playwright 本机 Chrome channel、全新临时 context、真视口 + computedStyle measured + DOM 查询，未改代码、未 commit、未增删种子。
- **终审动作**：独立复核 `measured/reverify.json`/`supplement.json` 原始数值（不仅凭复验报告转述），逐张目视 G 批帧 G101-G119，按规范 §3.2/§4.1/§5.1/§5.2/§7 与 checklist B2/B4/C1/D1/D3/F4/F7 判据逐项关单。
- **环境**：隔离实例 3172，种子 p-g3「G3 验收项目」；视口 1440×900（浅/深）、390×844（浅/深）。

### 6.2 6 项 W-DEF 关单确认（FIXED → RE-VERIFIED → CLOSED）

| 缺陷 | 规范/清单 | 修复前基线 | 终审实测（measured 原始 + 帧） | 判定 |
|---|---|---|---|---|
| W-DEF-001（B4 同工具条圆角不分叉） | §3.2/§9.1 | primary 12px vs ghost 8px 分叉 | `reverify.json` `A1_radius_light`(G101)/`B1_radius_dark`(G102)/`C1_radius_light`(G103)/`C1_radius_dark`(G104)：四档 primary「新建任务」=ghost「未命名视图」=**8px**，分叉消除 | **RE-VERIFIED/CLOSED** |
| W-DEF-002（B2/H8 chip 圆角 sm8） | §3.2；checklist B2 | chip 999px 胶囊 | `A1_radius_light.chips`/`B1_radius_dark.chips`：1440 浅(G101)/深(G102) 全量 5 枚 chip（全部5/进行中2/已完成1/已逾期0/我负责的5）全 **8px**；密度分段 999px 属另一控件，不在范围 | **RE-VERIFIED/CLOSED** |
| W-DEF-003（C1 页题 16/700） | §4.1 | 26×7/22×6/20×1/18×1/16×1 多档 | `A3_title_tasks`+`views.*.title`：任务(G101)/甘特 div(G110)/里程碑(G111)/风险(G112)/人员(G113)/会议(G114)/汇报(G115)/交付物(G116) 全 **16px/700**；概览 hero「G3 验收项目」**26px/750** 反向核对保留未误改（G117） | **RE-VERIFIED/CLOSED** |
| W-DEF-004（D1/D3 浅链接独立 token） | §5.1/§5.2 | 浅 link=accent=`#4176e6`=4.23:1<4.5 | `A4_contrast_light`：`--pm-link`=rgb(72,104,178)/#4868b2=**5.39:1**，`--pm-accent`=#4176e6 留图形角色（G101）；`B4_contrast_dark`：link #7aaaff=**7.83:1**，text 17.45/text-2 12.11/muted 8.54/faint 4.92 全 ≥4.5 无回退（G102） | **RE-VERIFIED/CLOSED（token 层）**；链接实例视觉补证挂 O2 |
| W-DEF-005（F4 selected 可编程） | §7 selected | chip `aria-pressed=null` 靠 class | active chip「全部5」`aria-pressed="true"`（浅 G101/深 G102，其余 null）；rail 当前项 `aria-current="page"`，8 步行视图仅当前项带 page（`A5/B5_rail`+`views.*.rail`） | **RE-VERIFIED/CLOSED（登记范围）**；其余选中态 AT 全量核仍在 I6 |
| W-DEF-006（F7 汇报空态 CTA 去重） | §7 empty | 页头+空态卡两枚「生成快照」 | `views.report.report`/`views.report_dark.report`：`snapCount=1`、`inEmptyCard=true/inHeader=false`，页头重复入口已删，空态文案保留（浅 G115/深 G119） | **RE-VERIFIED/CLOSED** |

### 6.3 逐组终态（98 条）

| 组 | 终态 |
|---|---|
| A Token 与主题（9） | A5/A9 PASS；A1/A2/A3/A4/A6/A7/A8 转引 G2 静态门 |
| B 间距/圆角/密度（8） | B2/B3/B4/B5/B7 PASS（B2/B4 本次复验翻正）；B6 待验证；B1/B8 转引 G2 |
| C 排版字阶（9） | C1/C9 PASS（C1 复验翻正）；C2/C3/C4/C7/C8 待验证；C5/C6 转引 G2 |
| D 颜色/对比（8） | D1/D3/D4/D5/D6/D7 PASS（D1/D3 复验翻正）；D2/D8 待验证 |
| E 表单（11） | E1/E4/E5/E6/E7/E8 PASS；E2/E3/E9/E10/E11 待验证 |
| F 状态覆盖（12） | F3/F4/F5/F7/F11/F12 PASS（F4/F7 复验翻正）；F1/F2/F6/F8/F9/F10 待验证 |
| G 响应式三档（15） | G.1/G.2/G.3 共 14 项 PASS；G4-1（200%/320px）待验证 |
| H 控件（10） | H1-H8 PASS（H8 圆角随 W-DEF-002 关闭）；H9/H10 转引 G2 |
| I 键盘/AT（8） | I1/I2/I3 PASS；I4/I7/I8 待验证；I5/I6 部分闭合待 AT |
| J 证据与门（8） | J3/J8 PASS；J1/J2/J5/J6/J7 转引；J4 待独立测试非回归 |

> 注：分组列举为定性归组（混合行如「源码转引 G2 / 运行时已 PASS」「部分闭合待 AT」沿用原作者桶位，不重复拆分）；总数以 §5 终审统计 **PASS 55 / DEVIATE 0 / 待验证 25 / 非本通道 18** 为准（55 = 原 48 + 复验翻正 7 行）。

### 6.4 #51 整体结论

- **本通道（R/B GUI）可闭合偏差已全部修复并复验达标**：6 项 W-DEF（含 S2 的 W-DEF-004）全部 RE-VERIFIED/CLOSED，7 条 DEVIATE 翻正为 PASS，**终审未发现新的 S1/S2 缺陷**，未见已 PASS 项回退线索。
- **98 条终态：PASS 55 ｜ DEVIATE 0 ｜ 待验证 25 ｜ 非本通道 18**。
- #51 走查本通道结论：**可闭合部分通过（PASS）**；整体关单不以本通道单边勾满——25 条待验证需专项/AT/慢路径补证，18 条转引门（G1 构建/G2 静态/G5 SHA/台账）由各自 AUTO 门或独立测试出具，J4 非回归由独立测试核。无 BLOCKED、无未决 S2 缺陷挂起。

### 6.5 残余开放项分组（不构成本通道 FAIL，如实登记）

**(a) 待环境/工具专项补证（25 条待验证的主体）**
- AT 读屏/焦点：I4 无焦点陷阱、I8 读屏名称与状态播报、I5 裸可点件余项（D-01/D-03/D-04/D-05/D-06，D-04 里程碑 mark SPAN/role=null 仍开）、I6 风险 tablist 完整模式（aria-selected/方向键/tabpanel）。
- 异步慢路径：E10 提交即禁用防重、F6 loading、F9 成功 Notice `role=status`、F8 全局 `role=alert` 不自动消失。
- 替代路径：I7 看板拖拽/甘特 move-resize 的键盘/单指针替代。
- 绑定/文案：E2 `aria-describedby`、E3 修法文案、E9 read-only 语义。
- 色值落点：D2 faint 不落 surface-2（深 surface2 faint 3.76/danger 4.24）、D8 状态色文字单独实测 ≥4.5。
- 字阶/密度：C2/C3/C4 逐角色字阶、C7 截断全名、C8 层级；B6 里程碑留白裁决 + 紧凑档像素差。
- 其余：F10 stale、E11 保存返回上下文、G4-1 200% 缩放/320px、J4 独立测试非回归。

**(b) P2-6 F06/F12 = MANUAL_PENDING**
- 条件：① 至少 **1 条经「确认入库」的 AI 溯源记录**（typed refs/内容指纹/口径版本，落 `pmProvenanceLedger`）；② 该来源内容或口径版本**漂移/失效**后触发「立即重校」，方出现 F06 失效/警告条与 F12 历史链。当前空台账 0 条，离线/PoC/空 Key 环境不扩大人工豁免。

**(c) 观察项（不立缺陷，建议处置）**
- **O1 主按钮 1440 右缘外放置**：1440 浅/深任务页 `button.pt-primary`「新建任务」DOM 存在、r=8px，但 `rect.x=1486` 超出 1440 视口右缘，整视口帧不可见（`supplement.json`；甘特页主 CTA 可见，390 档全宽可见）。**建议转 owner 做布局裁决**（工具条溢出收纳/主 CTA 落点），非圆角、非本批 6 项范围。
- **O2 种子无链接实例**：5 种子项目无「来自会议」链接、无 markdown 行内链接（全站无 `<a>`）；W-DEF-004 以 token 解析 + 引用元素（active rail 标签/计数）同色实测为准关单，**链接实例视觉待有链接实例的环境补证**。

---

> 边界声明：本合并稿为只读审计，未改产品代码/规范/清单，未 commit；DEVIATE 项不下 FAIL 结论，最终 PASS/FAIL/BLOCKED/MANUAL_PENDING 由独立测试专家裁定（§11.1 三权分离）。终审段（§6）为独立审证专家对 6 项复验证据的关单判定，转引门与待验证项不代填。

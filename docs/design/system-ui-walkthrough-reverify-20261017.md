# #51 W-DEF-001~006 修复复验报告（2026-10-17）

> 采证/复验：Playwright 本机 Chrome channel、全新临时 context（不碰用户浏览器会话）、真视口 + computedStyle measured + DOM 查询；只读，不改代码、不 commit、不增删种子数据。
> 实例：隔离实例 3172 已重启加载新 bundle；URL `http://127.0.0.1:3172/?token=Vsx9cIInacUzrKnMx0w68jrS3RMlRsn3bSCg5htdmL4`（重启后新 token；失效重读 `/tmp/dsh-p2-iso-3172.log` 尾行换新，本批连接一次成功未触发重试）。
> measured 原始：`/private/tmp/g3-shots/measured/reverify.json`、`supplement.json`；截图清单 `/private/tmp/g3-shots/manifest-g.md`；帧 G101–G119 存 `/private/tmp/g3-shots/`。
> 本报告只给 measured 实测值与证据路径；门闭合结论由独立审证专家填写。

## 0. 环境与方法

- 视口：1440×900（浅/深）、390×844（浅/深）；主题经宿主顶栏「设置 → 浅色/深色」切换后重进 PM。
- 项目：5 个种子的 p-g3「G3 验收项目」；空态视图如实呈现。
- 基线（修复前，#51 走查 `measured-20261017/`）：primary r=12px / ghost=8px 分叉；chip=999px；页题落 26×7/22×6/20×1/18×1/16×1；浅 link `#4176e6`=4.23:1；chip 选中 `aria-pressed=null`；汇报页页头与空态卡各一枚「生成快照」。

---

## W-DEF-001 同工具条圆角不分叉（B4 / §3.2 / §9.1）

- **规范**：§3.2「同一工具条上 ghost/primary/icon 圆角必须一致，不允许分叉」；§9.1 按钮四型统一 sm(8)。
- **修复前基线**：`.pt-ghost`=8px、`.pt-vmenu`=8px，`.pt-primary`=**12px**，浅深同值分叉。
- **修复后实测**（`reverify.json` → `A1_radius_light` / `B1_radius_dark` / `C1_radius_light` / `C1_radius_dark`）：

| 视口/主题 | primary「新建任务」r | ghost r | 一致 |
|---|---|---|---|
| 1440 浅（G101） | 8px | 8px | ✅ |
| 1440 深（G102） | 8px | 8px | ✅ |
| 390 浅（G103） | 8px | 8px | ✅ |
| 390 深（G104） | 8px | 8px | ✅ |

- **measured 判定**：四档 primary 全部 8px，与 ghost 同值，分叉消除。**待审证闭合**。
- 证据：`measured/reverify.json` `checks.A1_radius_light.primary/ghost`、`B1_radius_dark`、`C1_radius_light`、`C1_radius_dark`；帧 G101/G102/G103/G104。
- 观察 O1：1440 任务页 primary DOM 存在、r=8px，但 rect x=1486 位于 1440 视口右缘外，整视口帧不可见（放置问题，非圆角问题，转审证参考）。

## W-DEF-002 筛选 chip 圆角 sm8（B2 / §3.2 / §9.5）

- **规范**：checklist B2「`.pt-ghost`/`.pm-chip`/`.pt-vmenu` computed border-radius=8px」；§3.2 控件统一 sm8。
- **修复前基线**：筛选 chip 实测 **999px 胶囊**。
- **修复后实测**（`A1_radius_light.chips` / `B1_radius_dark.chips`，1440 浅/深全量 5 枚 `.pt-chip`）：

| chip | 浅 r | 深 r |
|---|---|---|
| 全部5（active） | 8px | 8px |
| 进行中2 | 8px | 8px |
| 已完成1 | 8px | 8px |
| 已逾期0 | 8px | 8px |
| 我负责的5 | 8px | 8px |

- **measured 判定**：chip 由 999px 收敛为 8px，与 ghost/vmenu 同阶。**待审证闭合**。
- 证据：`measured/reverify.json` `checks.A1_radius_light.chips`、`B1_radius_dark.chips`；帧 G101/G102。
- 备注：密度切换「舒适/紧凑」分段仍为 999px 胶囊（非筛选 chip，属另一控件，不在本缺陷范围）。

## W-DEF-003 视图页题收敛 16/700（C1 / §4.1）

- **规范**：§4.1 页面标题角色 16/700（设计约束值，computed 抽测）；§4.5 层级不靠全放大。
- **修复前基线**：字阶直方图 26×7 / 22×6 / 20×1 / 18×1 / 16×1，无 16/700 主导；任务页题旁测 20px/700。
- **修复后实测**（1440 浅，`reverify.json` → `A3_title_tasks` + `views.*.title`）：

| 视图 | 选择器 | 文本 | font-size | font-weight | 帧 |
|---|---|---|---|---|---|
| 全部任务 | H1 | 任务 | 16px | 700 | G101 |
| 甘特排期 | `.pm-gantt-title`(div) | 甘特图 | 16px | 700 | G110 |
| 里程碑 | H1 | 里程碑 | 16px | 700 | G111 |
| 风险与问题 | H1 | 风险与问题 | 16px | 700 | G112 |
| 人员负载 | H1 | 人员负载 | 16px | 700 | G113 |
| 会议纪要 | H1 | 会议纪要 | 16px | 700 | G114 |
| 进度汇报 | H1 | 进度汇报 | 16px | 700 | G115 |
| 交付物 | H1 | 交付物 | 16px | 700 | G116 |

- **反向核对（品牌 hero 未误改）**：项目概览 H1「G3 验收项目」**26px/750** 保留（`views.overview.title`，帧 G117），未被收敛到 16/700。
- **measured 判定**：8 个视图页题全部 16px/700；overview hero 26/750 原样保留。**待审证闭合**。
- 证据：`measured/reverify.json` `checks.A3_title_tasks`、`views.gantt/milestone/risk/people/meeting/report/deliverable/overview.title`；帧 G101/G110–G117。
- 备注：甘特页题为 div（`.pm-gantt-title`）非 h1，语义层级另属 §9/AT 范畴，不在本缺陷。

## W-DEF-004 浅链接回归独立 token #4868b2（D1+D3 / §5.1 / §5.2）

- **规范**：§5.1 链接 ≥4.5:1；§5.2 `--pm-link` #4868b2=5.39:1 ✅，`#4176e6`(4.23) 不得作文字色（仅大面/图形）。
- **修复前基线**：浅 `--pm-link`=`--pm-accent`=`#4176e6`，onCanvas **4.23:1 <4.5**；深 link `#7aaaff`=7.83 ✅。
- **修复后实测**（`A4_contrast_light` / `B4_contrast_dark`，token 自 `.pm-shell` computedStyle 解析）：

| 项 | 浅 raw | 浅 onCanvas | 深 raw | 深 onCanvas |
|---|---|---|---|---|
| `--pm-link` | **rgb(72,104,178)** #4868b2 | **5.39:1** ✅ | #7aaaff | **7.83:1** ✅ |
| `--pm-accent`（图形/大面） | #4176e6 | —（不作文字） | #7aaaff | — |
| `--pm-text` | #0f1115 | 18.90 | #f9fafb | 17.45 |
| `--pm-text-2` | #61666b | 5.80 | #cfd3d6 | 12.11 |
| `--pm-muted` | rgb(105,110,116) | 5.14 | #adb2b8 | 8.54 |
| `--pm-faint` | rgb(113,118,124) | 4.58 | #81858c | 4.92 |

- **measured 判定**：浅 link 独立为 rgb(72,104,178)，白底复算 5.39:1（≥4.5 AA，达规范静态值 5.39）；`#4176e6` 仅留在 `--pm-accent` 图形角色；深 link 7.83 无回退。**待审证闭合**。
- 证据：`measured/reverify.json` `checks.A4_contrast_light.matrix/link/accent`、`B4_contrast_dark`；帧 G101（浅）/G102（深）。
- 观察 O2：当前 5 种子内无「来自会议」链接、无 markdown 行内链接渲染（全站无 `<a>`）；引用 `--pm-link` 的 active rail 标签/计数实测同色 rgb(72,104,178)。链接实例待种子/后续页面补证，不影响 token 层判定。

## W-DEF-005 选中态可编程（F4 / §7 selected）

- **规范**：§7 selected「可编程选中态（`aria-pressed`/`aria-selected`），不靠 class alone」。
- **修复前基线**：筛选 chip 选中 `aria-pressed=null`，仅靠 class/描边；rail 选中未核。
- **修复后实测**：
  - **筛选 chip**（`A1_radius_light.chips` / `B1_radius_dark.chips`）：active「全部5」`aria-pressed="true"`（浅/深一致）；其余 chip `aria-pressed=null`。
  - **rail 当前项**（`A5_rail_light` / `B5_rail_dark` + 各 `views.*.rail`）：当前视图项 `aria-current="page"`，浅/深及 8 个步行视图逐站核对，仅当前项带 `cur="page"`，其余 null。
- **measured 判定**：chip 选中补 `aria-pressed="true"`；rail 当前项补 `aria-current="page"`。**待审证闭合**。
- 证据：`measured/reverify.json` `checks.A1_radius_light.chips[0].pressed`、`B1_radius_dark.chips[0].pressed`、`A5_rail_light[2].cur`、`B5_rail_dark[2].cur`、`views.*.rail`；帧 G101/G102。

## W-DEF-006 进度汇报空态 CTA 去重（F7 / §7 empty）

- **规范**：§7 empty「CTA 去重，不与页头主 CTA 重复」。
- **修复前基线**：页头「生成快照」与空态卡内「生成快照」同一动作重复（F209 浅/F249 深）。
- **修复后实测**（`views.report.report` / `views.report_dark.report`）：

| 主题 | 「生成快照」按钮数 | 位置 | 页头 CTA |
|---|---|---|---|
| 浅（G115） | **1** | `.rp-empty-card` 空态卡内（inEmptyCard=true, inHeader=false） | 无 |
| 深（G119） | **1** | `.rp-empty-card` 空态卡内 | 无 |

- 空态文案保留：「暂无进度汇报。基于当前任务 / 里程碑 / 会议快照生成第一份周期汇报。」+ 卡内 CTA「+ 生成快照」。
- **measured 判定**：页头重复入口已删，CTA 保留于空态卡内，去重成立。**待审证闭合**。
- 证据：`measured/reverify.json` `views.report.report`、`views.report_dark.report`；帧 G115/G119。

---

## 顺带抽查：深色对比四档 + link 无回退（D7 转引复核）

- 深 onCanvas：text 17.45 / text-2 12.11 / muted 8.54 / faint 4.92 / link 7.83，全部 ≥4.5，与 #51 走查基线逐值相等，无回退（`B4_contrast_dark.matrix`）。
- G2 静态零命中链路（只读快照 0 script/0 http/0 href-src）本批不重验，转引 #51 走查结论。

## 汇总（measured 实测，门结论待审证）

| 缺陷 | 规范条款 | 修复前 | 修复后实测 | measured |
|---|---|---|---|---|
| W-DEF-001 | §3.2/§9.1 | primary 12px 分叉 | 四档 primary=ghost=8px | 达标，待审证闭合 |
| W-DEF-002 | §3.2/§9.5 | chip 999px | 5 枚 chip 全 8px（浅/深） | 达标，待审证闭合 |
| W-DEF-003 | §4.1 | 26/22/20/18/16 多档 | 8 视图页题 16/700；hero 26/750 保留 | 达标，待审证闭合 |
| W-DEF-004 | §5.1/§5.2 | 浅 link #4176e6=4.23 | 浅 link #4868b2=5.39；深 7.83 | 达标，待审证闭合（链接实例见 O2） |
| W-DEF-005 | §7 selected | chip aria-pressed=null | chip aria-pressed="true"；rail aria-current="page" | 达标，待审证闭合 |
| W-DEF-006 | §7 empty | 页头+卡内重复 | 仅卡内 1 枚，页头无 | 达标，待审证闭合 |

## 观察留档（不立缺陷，转审证/owner）

- **O1**：1440 任务页 `button.pt-primary`「新建任务」r=8px 但位于视口右缘外（rect x=1486），整视口帧不可见；甘特页主 CTA 可见。放置/布局问题，非本批圆角缺陷。
- **O2**：种子数据无「来自会议」/markdown 行内链接实例，W-DEF-004 链接色落点以 token 解析 + 引用元素同色实测为准，链接实例待补。

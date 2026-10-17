# #51 全系统渲染走查报告（真实 GUI · Playwright 真视口通道，2026-10-17）

> 配套：`system-ui-checklist-20261017.md`（98 条）、`system-ui-spec-20261017.md`（v1.0 冻结）。
> **本报告只给渲染/measured 通道能闭合的结论；G1 构建回归、G2 静态门、G5 SHA 绑定等确定性门不由本通道判定，一律标「非本通道（转引）」，不代填 PASS。** 结论最终由独立审证专家裁定，本报告不代替门结论。

## 0. 方法与环境

- 驱动：本机 Chrome channel（`channel:'chrome'`），Playwright，**全新临时 context**，不读取/复用用户浏览器会话与登录态；token 取自隔离实例日志尾行，失效重读重试。
- 视口：1440×900 / 768×1024 / 390×844；主题：浅（宿主「设置→外观→浅色」）/ 深（默认 `body[data-ds-dark-theme]`）。
- 截图：整视口帧 `page.screenshot()`（fullPage=false），如实记录真实视口；**60 帧 = 10 视图 × 3 视口 × 浅/深**。
- measured：`computedStyle` 取实色/尺寸计算 WCAG 对比度、圆角、间距、焦点环、字阶分布、可访问名覆盖率、角色 census。
- 只读：未改产品代码、未 commit、未增删种子数据；抽屉/弹窗均以 Esc 关闭，无提交写操作。

### 0.1 产物索引

| 产物 | 路径 |
|---|---|
| 60 帧全景截图 + 逐帧溢出/底色记录 | `/private/tmp/g3-shots/manifest-f.md`（帧清单）；帧目录 `/private/tmp/g3-shots/F2*.png` |
| measured 汇总（对比度/token/圆角/焦点/字阶/可访问名/溢出） | `docs/design/measured-20261017/measured-summary.json`（运行时镜像 `/private/tmp/g3-shots/measured/`） |
| 原始探针：浅/深 token+对比+焦点+逐视图 census | `measured-20261017/probe-light.json`、`probe-dark.json` |
| 原始探针：字阶 drift/D 项/浮层/抽屉 | `measured-20261017/probe2-light.json` |
| 原始探针：表单字段/禁用态 | `measured-20261017/probe3-light.json` |
| 逐帧 measure 日志 | `/private/tmp/g3-e-pw/render-log.json` |
| 目检联系表（aux，非门证据） | `/private/tmp/g3-shots/sheet-*.png`（768/390/1440 浅深批量目检用） |

### 0.2 结论图例

- **PASS**：本通道 observed/measured 证据闭合。
- **DEVIATE**：实测偏离冻结规范，列出数值，留审证裁决（不自行判 FAIL/PASS）。
- **待验证**：本通道无法闭合（需专项慢路径 / AT 读屏 / 源码静态门），未补证前不得勾达标。
- **非本通道**：G1/G2/G5 确定性门或源码项，渲染通道不覆盖，转引静态门/确定性日志。

---

## A. Token 与主题（§2）

| 条 | 结论 | 证据与数值 |
|---|---|---|
| A1 单层语义 token 真源 | 非本通道（DOM/G2） | 组件 CSS 引用 `--pm-*` 单层语义层由 G2 静态门扫描；本通道仅运行时解析（见 A5/A9 measured）。 |
| A2 宿主别名优先→fallback | 非本通道（DOM/G2） | 转引 facts A.1；运行时解析见 `probe-light/dark.json → tokens`。 |
| A3 浅深成对不机械反色 | 待验证（本通道部分） | 深跟随 `body[data-ds-dark-theme]` 实测成立（`probe-dark.tokens.dark=true`）；无本地第二套开关属源码项，转引 G2。阴影暗色覆写未逐项比对。 |
| A4 角色表无新造 | 非本通道（DOM/G2） | 转引静态门。 |
| A5 浅深背景实测一致 | **PASS（measured）** | 60 帧 bodyBg：浅 `rgb(255,255,255)`、深 `rgb(21,21,23)`，逐帧一致（`render-log.json` / `measured-summary.overflow`）；shell 浅 `#fff`/深同值，非硬编码暗色。 |
| A6 选中/悬停走 color-mix | 非本通道（DOM/G2） | `--pm-tint-accent=color-mix(...12%)` 源码直读（panel.css:121-124），命中统计转引 G2。 |
| A7 图表 S4 不启用 / ai 槽位只定义 | 非本通道（DOM/G2） | panel.css:135-142 仅 s1-s3、ai 槽位中性；零启用属静态门。 |
| A8 禁止项零命中 | 非本通道（DOM/G2） | 运行时未见品牌蓝填充 CTA/渐变/玻璃/光晕；`--shadow-glow-*` 定义为 none（panel.css:76-77）；零命中扫描转引 G2。 |
| A9 菜单/弹窗浮层实测 | **PASS（浅 measured）/ 深转引** | 导出菜单 `.pt-vmenu[role=menu]` 浅底 `rgb(255,255,255)`、radius 8px、双层 menu 阴影（`probe2.overlays.exportMenu`）；保存视图弹窗 `role=dialog` radius 12px、mask `rgba(0,0,0,.24)`（`probe2.overlays.saveDialog`）。深浮层 `#232324`/mask `.5` 转引 facts A.2，本通道未重测深浮层实色。 |

## B. 间距 / 圆角 / 密度（§3）

| 条 | 结论 | 证据与数值 |
|---|---|---|
| B1 内边距取 `--sp-*` 阶 | 非本通道（DOM/G2） | 源码绑定转引静态门。 |
| B2 控件/菜单圆角 sm8 | **PASS（measured）** | `.pt-ghost`=8px、`.pt-vmenu`=8px，浅深一致（`probe-light/dark.radius`）。 |
| B3 弹窗圆角 md12 | **PASS（measured）** | `.pt-vm[role=dialog]`=12px（保存视图弹窗实测），未混用 8px。 |
| B4 同工具条圆角不分叉 | **DEVIATE（measured）** | 同一工具条：ghost=**8px**、vmenu=8px，但 `.pt-primary`=**12px**（浅深同值分叉，`probe-light/dark.radius.primary=["12px"]`）。规范要求同条 ghost/primary/icon 均 8px；是否判偏离由审证裁决。 |
| B5 抽屉内边距/gap/宽 | **PASS（measured）** | 抽屉面板 `padding=24px 28px 28px`、表单 `gap=18px`、宽 560px（=min(560px,94vw)@1440），`probe2.overlays.drawer` + `probe3`。 |
| B6 密度贴合内容 | 待验证（observed 线索） | 任务表/卡片贴合内容；里程碑视图单节点下方存在大片留白（F205/F225/F245），是否「无意义留白」需 owner 裁决。 |
| B7 边框与阴影不同时上 | **PASS（observed）** | 平面视图仅底+hairline，无卡片阴影；阴影只见于 menu/modal 浮层（F201/F203 等）。 |
| B8 动效 token 合规 | 非本通道（DOM/G2） | 120/180ms、reduced-motion 块属源码，转引 G2。 |

## C. 排版字阶（§4）

| 条 | 结论 | 证据与数值 |
|---|---|---|
| C1 页面标题 16/700 | **DEVIATE（measured）** | 实测视图 H1 为 **26px**（字阶直方图 26×7、22×6、20×1、18×1、16×1，`probe2.fontHist`），非冻结 16/700；需规范澄清或登记例外。 |
| C2 区块标题 13.5/650 | 待验证 | 直方图含 13×46、12×102，未逐角色映射 h3；需专项 computed 抽测。 |
| C3 正文 13–14/400 | 待验证（部分） | 直方图 13×46 / 14×49 落在区间；未逐段核字重 400 与离阶放大。 |
| C4 标签/元信息 11–12/600 | 待验证（部分） | 直方图 11×113 / 12×102 落在区间；字重 600 未逐项核。 |
| C5 数据列 tnum | 非本通道（DOM）/ 部分 measured | 全局 `font-feature-settings:'tnum'`（panel.css:150）；`probe2.tnum` 抽到 6 处 tnum 命中；列宽抖动未长列表验证。 |
| C6 系统栈无远程字体 | 非本通道（DOM/G2） | 转引静态门。 |
| C7 截断给全名路径 | 待验证 | 超长名 title/披露未在种子数据触发，未逐处核。 |
| C8 层级不靠全放大 | 待验证（observed） | 未见所有标题同倍放大；未专项比对。 |
| C9 字阶 drift 登记 | **PASS（measured 登记）** | 实测碎片化分布：10×162 / 11×113 / 12×102 / 12.5×1 / 13×46 / 14×49 / 16×1 / 18×1 / 20×1 / 22×6 / 23×1 / 26×7（`probe2.fontHist`），作为 drift 现状登记，不冒充达标。 |

## D. 颜色语义与对比度（§5，WCAG 实色 measured）

> 来源：`measured-summary.contrast`（computedStyle 实色 → WCAG 比值）。AA 常规文本 ≥4.5:1。

| 条 | 结论 | 证据与数值（浅 / 深，onCanvas） |
|---|---|---|
| D1 正文/链接 ≥4.5:1 | **部分 PASS / DEVIATE** | text 18.90 / 17.45 ✅；text-2 5.80 / 12.11 ✅；muted 5.14 / 8.54 ✅；**link 浅 `#4176e6`=4.23 ❌（<4.5）**，深 `#7aaaff`=7.83 ✅。浅链接实色未达 AA，待审证。 |
| D2 faint 不落 surface-2 | 待验证（本通道受限） | 浅 `--surface-2` 解析为 `#fff`（与 canvas 同值），faint-on-surface2=4.58 无法复现禁用组合；深 surface2 `#2c2c2e` 上 faint=3.76 ❌、danger=4.24 ❌（`probe-dark.contrast`）。faint 实际落点需源码核。 |
| D3 #4176e6 未作文字色 | **DEVIATE（measured）** | 浅 `--pm-link` 与 `--pm-accent` 均解析为 `#4176e6`（4.23:1）；链接 token 落此色，是否构成「文字色违规」由审证裁决（D1 同源）。 |
| D4 on-primary 18.9:1 | **PASS（measured）** | 浅 fill `#0f1115`/on-primary `#fff`=18.90；深 fill `#f9fafb`=18.08。 |
| D5 状态=图标+文字+色 | **PASS（observed）** | 任务行/人员/交付物 chip 均为「色点/图标 + 文字标签 + 色」（F203/F207/F210/F246），无 color-only 红绿。 |
| D6 语义色边界 | **PASS（observed）** | 蓝=进行/选中/焦点，绿=完成，琥珀=阻塞/临期，红=逾期/删除/待处理，中性灰=待办，未见越界混用（F206 红「待处理」、F205 琥珀「有风险」）。 |
| D7 深色独立复测 | **PASS（measured，闭合 §12-1 深色部分）** | 深 onCanvas：text 17.45 / text-2 12.11 / muted 8.54 / faint 4.92 / link 7.83，均 ≥4.5；faint-on-surface2 3.76 单列记录（见 D2）。 |
| D8 状态色文字单独实测 | 待验证（未触发） | 浅 onCanvas：success 2.28 / warning 2.15 / danger 4.50；深：success 8.0 / warning 8.49 / danger 5.55。全视图扫描 **0 个元素以 success/warning/danger token 色作文字**（`probe2.views.*.statusText=0`），状态色仅作点/条/图标，文字用法未触发，留专项。 |

## E. 表单（§6）

| 条 | 结论 | 证据与数值 |
|---|---|---|
| E1 可见 label 禁 placeholder 替代 | **PASS（DOM/observed）** | 22 控件均由包裹式 `<label class="pm-field"><span>标签</span><input/></label>` 可编程关联（`probe4`  markup；`probe3.drawer`），placeholder 仅提示。 |
| E2 内联错误贴字段 | 待验证（转引 facts E.1） | 空名内联报错「任务名称不能为空」转引 B39 observed；本通道未触发提交。 |
| E3 错误说因+修法 | 待验证 | 同上，未触发。 |
| E4 受控校验弃原生气泡 | **PASS（measured）** | 抽屉 22 控件 `nativeRequired=0`（`probe3`），无原生 required 气泡；双轨统一属待统一项转引建议稿 E-2。 |
| E5 必填标记一致 | **PASS（DOM）** | 仅标题 `aria-required=true` + `.pm-field-required` 危险色 `*`（`probe3.reqMarkers=1`）。 |
| E6 出错保留输入 | 待验证（转引 facts E.1） | 转引 B39；本通道未提交。 |
| E7 取消零写 | 待验证（转引） | 取消未产生写需计数前后对比，本通道只读未核。 |
| E8 提交模式一致 | **PASS（measured，保存视图路径）** | 保存视图空名：`disabled=true`、`opacity=0.5`、`cursor=not-allowed`（`probe3.saveDialog`）；新建任务空名走提交后内联报错（不禁用）属产品既定双模式，转引 §6.6。 |
| E9 disabled≠read-only | 待验证 | read-only 视觉语义未构造。 |
| E10 异步提交即禁用防重 | 待验证（§12-3） | 本地秒开，loading 未触发。 |
| E11 保存返回上下文 | 待验证（§12-20） | 未触发保存成功路径。 |

## F. 状态覆盖（§7）

| 条 | 结论 | 证据 |
|---|---|---|
| F1 状态矩阵无遗漏 | 待验证 | active/pressed/loading/error/success 多数未触发，本通道仅见 normal/selected/disabled/empty。 |
| F2 hover 不靠独占信息 | 待验证 | 行 hover 底未在本通道采（转引 §12-15）；键盘 focus 常显见 F3。 |
| F3 focus-visible 取 token | **PASS（measured）** | 全局 `outline:2px solid var(--dsw-alias-state-business-primary); outline-offset:1px`（panel.css:184-188）；实测浅 `rgb(65,118,230)`、深 `rgb(122,170,255)`，均经别名 token 解析，组件内无硬编码蓝 hex；offset 1px（`probe-light/dark.focusRing`）。 |
| F4 selected 可编程 | 待验证（DOM 部分） | rail/筛选 chip 选中有视觉 tint；`aria-pressed/aria-selected` 逐项转引源码/AT。 |
| F5 disabled 样式语义 | **PASS（measured）** | 保存视图禁用：disabled 属性 + opacity.5 + not-allowed（E8 同源）。 |
| F6 loading 仅异步 | 待验证（observed 线索） | 常规视图未见骨架屏/shimmer；异步 loading 未触发。 |
| F7 空态诚实+去重 CTA | **PASS（observed，附 1 条观察）** | 空态文案诚实：会议纪要「尚无会议纪要」（F208/F248）、进度汇报「暂无进度汇报…」（F209/F249）、交付物分组「暂无比状态交付物」（F210/F230/F250），不伪装零值。**观察**：进度汇报页页头「生成快照」与空态卡内「生成快照」为同一动作重复出现（F209/F249），是否违反「CTA 去重」由审证裁决；会议/交付物未重复。 |
| F8 错误 Notice 不消失 | 待验证（§12-8） | 全局 alert 未触发。 |
| F9 成功反馈可编程 | 待验证（§12-3） | 未触发。 |
| F10 stale 不替换旧数据 | 待验证（§12，离线本地无 stale 场景） | — |
| F11 单行 input 横滚/高36 | **PASS（measured）** | 抽屉 input 高≈36.3px（`probe3.fields`）；超长横滚口径转引 T-DEF-003/B50。 |
| F12 textarea 换行增高 | 待验证（转引 B51） | rows=4 固定，增高行为转引 facts E.3。 |

## G. 响应式三档（§8）

### G.1 1440
| 条 | 结论 | 证据 |
|---|---|---|
| G1-1 无外壳横向溢出 | **PASS（measured）** | 1440 浅/深 20 帧 htmlScrollW=htmlClientW=1440（`measured-summary.overflow`）。 |
| G1-2 浅深成对镜像 | **PASS（observed）** | 1440 浅深同视图间距/圆角/边框一致（F201↔F211 等成对比对）。 |
| G1-3 主 CTA 唯一、无蓝填充 | **PASS（observed）** | 每视图唯一中性黑/反白主 CTA（新建项目/新建任务/生成快照/登记），无蓝填充 CTA。 |

### G.2 768
| 条 | 结论 | 证据 |
|---|---|---|
| G2-1 工具条换行 | **PASS（measured，转引 E05/E06）** | `.pt-toolbar` flexWrap=wrap/h179，浅深一致；本批 768 帧 F223/F233 目视复核。 |
| G2-2 身份列保留 | **PASS（measured，转引 E05）** | 「编号」表头 visible；本批 F223 目视。 |
| G2-3 无叠印无外壳溢出 | **PASS（measured）** | 768 浅深 20 帧零外壳横滚；行叠印转引 E05 rowOverlap=false；表体内滚 1313/707 属已裁决例外。 |
| G2-4 看板抽样无破版 | **PASS（observed）** | F221 看板：搜索/完成率环/里程碑条/状态规模/成员负载/风险矩阵/周计划无贴边错位，双栏改堆叠。 |

### G.3 390
| 条 | 结论 | 证据 |
|---|---|---|
| G3-1 表格→卡片不删字段 | **PASS（observed/measured）** | F243/F253：thead 隐藏、卡片堆叠、字段完整（转引 E08 thead=none/5 卡片）。 |
| G3-2 抽屉单列全宽 | **PASS（measured，转引 E10）** | overflowX=false、单列堆叠；本批未重开抽屉，转引 E10。 |
| G3-3 按钮 nowrap | **PASS（measured，转引 E10）** | 取消/添加任务 white-space=nowrap。 |
| G3-4 无外壳溢出 | **PASS（measured）** | 390 浅深 20 帧 html/body=390，零外壳横滚（`measured-summary.overflow`）。 |
| G3-5 rail 隐藏走扁平下拉 | **PASS（observed/measured）** | railW=0/display=none（probe390）；任务视图由 `.pm-view-switcher` 扁平下拉承接（9 项+计数+选中带勾，无分组标签属设计，转引 E12/E13）。注意：非任务视图在 390 未见常驻可见视图切换入口（本批采证以隐藏 rail DOM 程序点击切换，非用户可见路径），留审证。 |
| G3-6 甘特轴内部横滑例外 | **PASS（observed）** | F244/F254：身份列（任务/WBS+名称）固定左，时间轴内部横滑，身份不进横滑区。 |
| G3-7 全视图补证 | **PASS（observed，闭合 §12-2）** | 本批补齐里程碑/风险/人员/会议/汇报/交付物/概览的 768+390 逐帧（F225-F230/F235-F240/F242-F250/F252-F260），390 甘特 F244/F254 已采。 |

### G.4 回流
| 条 | 结论 | 证据 |
|---|---|---|
| G4-1 200% 缩放/320px | 待验证（§12-10） | 本通道未做 200% 缩放/320px 专项。 |

## H. 控件（§9）

| 条 | 结论 | 证据 |
|---|---|---|
| H1 Primary 中性填充 | **PASS（observed）** | 浅近黑底白字/深反白，每视图唯一主 CTA，无蓝填充。 |
| H2 Ghost 可辨 | **PASS（observed/measured）** | 透明底+line 边+text 字，radius 8px。 |
| H3 Danger 不填充红 | **PASS（observed）** | 删除/待处理为透明底+危险色字（F206 待处理 chip），无填充红 CTA。 |
| H4 Icon 按钮 32px 可访问名 | **PASS（measured）** | 10 视图累计 250/250 按钮具 aria-label 或可见文本（100%，`measured-summary.iconCoverage`）；32px 尺寸抽测转引。 |
| H5 下拉三态齐 | **PASS（observed/measured，转引 E01-E04）** | 展开/Esc 闭/外点闭，关闭 open=false；导出菜单 role=menu 3 项（`probe2.overlays.exportMenu`）。 |
| H6 弹窗语义与关闭 | **PASS（DOM/observed）** | `.pt-vm[role=dialog][aria-modal]`、mask `.24`、radius12/中阴影；Esc 关闭转引 facts G.2。 |
| H7 抽屉焦点流转 | 待验证（转引 facts G.3 B41/B42） | 本通道未测焦点落第一字段/归还。 |
| H8 chip 集合 | **PASS（observed）** | 色点+文字+10% mix 底，换行不裁切（F207/F210）。 |
| H9 按钮全局 nowrap | 非本通道（DOM）/ 部分 measured | 全局 `.pm-shell button{white-space:nowrap}`（panel.css:183）；本批仅甘特日/周/月分段按钮 ws=normal（`probe2.views.gantt.nowrap`，窄窗例外候选）。 |
| H10 z 层阶 | 非本通道（DOM/G2） | z-sticky20/pop40/modal60 转引静态门。 |

## I. 键盘与无障碍（§9.7/§11）

| 条 | 结论 | 证据 |
|---|---|---|
| I1 纯键盘关键路径 | 待验证（转引 facts G.5 B46/B47） | 本通道未重放键盘流程。 |
| I2 Tab 序=视觉序 | 待验证（转引 facts G.5 Tab×14） | 未重测。 |
| I3 浮层 Esc 归还焦点 | 待验证（转引 facts G.5） | 未测焦点归还。 |
| I4 无焦点陷阱 | 待验证（需 AT） | — |
| I5 裸可点件改原生/补角色 | 部分闭合 / 待 AT | D-02 人员条已 `role=img`+aria-label（`probe2.views.people.dItems.D02`）；ms-row 编辑按钮有 aria-label；D-01 看板状态柱、D-03 配置伪 tab、D-05 甘特未排期行、D-06 关闭× 未在本通道逐项核，转引 §12-4 待 AT/源码。 |
| I6 自定义 tab 模式 | 部分 measured | 风险视图 `role=tablist`+2×`role=tab`（`probe-light.views.risk.roles`）；方向键/aria-selected 完整度待 AT。 |
| I7 拖拽键盘/单指针替代 | 待验证（§12-5） | 看板拖拽/甘特 move-resize 替代路径未测。 |
| I8 读屏名称与状态 | 待验证（需 AT） | — |

## J. 验收证据与门（§11）

| 条 | 结论 | 证据 |
|---|---|---|
| J1 G1 构建回归过 | 非本通道（确定性日志） | 转引构建/测试日志，渲染通道不判定。 |
| J2 G2 静态门零命中 | 非本通道（DOM 扫描） | 转引静态门结果。 |
| J3 G3 目视非替代 | **PASS（方法合规）** | 本通道关键路径以 observed/measured 为据，未用 DOM/计算色冒充目视，截图仅作存档。 |
| J4 G4 非回归零回退 | 待验证（独立测试） | 已 PASS 项回归由独立测试核，本通道不代填。 |
| J5 G5 SHA 绑定 | 非本通道（确定性记录） | 转引。 |
| J6 缺陷走生命周期 | 非本通道（缺陷台账） | 本报告 DEVIATE 项供测试专家登记 S 级。 |
| J7 有意例外登记 | 非本通道（DOM/G2） | — |
| J8 截图不单独成立 | **PASS（方法合规）** | 每条结论附 observed/measured/DOM 定位。 |

---

## 附 1：本通道 DEVIATE / 待验证汇总（供审证专家）

**DEVIATE（实测偏离，待裁决）**
1. **B4**：主按钮圆角 12px vs ghost/菜单 8px，同工具条分叉（`measured-summary.radius`）。
2. **C1**：页面 H1 实测 26px，非冻结 16/700。
3. **D1/D3**：浅 `--pm-link/--pm-accent` 解析 `#4176e6`=4.23:1，低于 AA 4.5，且属规范点名禁作文字色的 4.23 蓝。

**待验证（未闭合，不得勾达标）**：C2/C3/C4 逐角色字阶、C7/C8、D2 faint 落点、D8 状态色文字、E2/E3/E6/E7/E9/E10/E11、F1/F2/F4/F6/F8/F9/F10/F12、G4-1、H7、I1-I4/I7/I8、J4；§12-1 深色部分已由 D7 闭合，§12-2 全视图覆盖已由 G3-7 闭合。

**非本通道（转引静态门/确定性日志/AT）**：A1/A2/A4/A6/A7/A8、B1/B8、C5/C6、E4 源码部分、H9/H10、J1/J2/J5/J6/J7。

## 附 2：measured 关键数值速查

- 对比度 onCanvas 浅：text 18.90 / text-2 5.80 / muted 5.14 / faint 4.58 / link 4.23；深：17.45 / 12.11 / 8.54 / 4.92 / 7.83。
- on-primary：浅 18.90、深 18.08。
- 圆角：ghost 8 / vmenu 8 / dialog 12 / primary 12（浅深一致）。
- 焦点环：2px 别名 accent + 1px offset，浅 rgb(65,118,230)/深 rgb(122,170,255)，无组件硬编码蓝。
- 抽屉：24px 28px 28px / gap18 / 560px；浮层菜单 #fff·8px·menu 阴影；弹窗 12px·mask rgba(0,0,0,.24)。
- 可访问名：250/250 按钮 100%。
- 溢出：60/60 帧零外壳横向横滚；bodyBg 浅 #fff / 深 rgb(21,21,23)。

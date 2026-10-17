# 全系统 UI 规范/控件清单 · 独立只读方法评审（2026-10-17，按 348 版收口）

> 性质：**仅方法评审，不是 GUI 通过、不是视觉验收、更不是全系统覆盖 PASS**。评审对象（他人所有，本评审不改其文件）：
> - `docs/design/system-ui-audit-preparation-20261017.md`
> - `docs/design/system-ui-control-inventory-20261017.csv`（348 行 = CONTRACT-SUB 46 + CONSUMER-PLACEMENT 11 + INTEGRATION 274 + SEMANTIC 12 + BACKDROP 5；控件行 343）
> 方法：只读抽样并对真实源码核挂载点/消费者/手势/状态维度；不重复大扫描、不改专人文件、不采证。291 为 RAW-BASE 原始扫描基数，341/348 为后续修订版，本评审以当前 348 版为准。

## 1. 已核实成立（肯定项）

- **算术自洽**：独立重算 INTEGRATION 274 = button×150 + input×72 + select×33 + textarea×19，和=274；全表零重复 `source_file:source_line`；348 行 `verify_status` 全部 `NOT_RUN/待证`，未冒充已覆盖。
- **契约子控件逐条成行（M1 已解决）**：46 条 CONTRACT-SUB 把 9 个公共契约内部按钮/输入/选择单独展开，可独立回填状态/焦点。
- **非原生语义点单列（M2 已解决）**：SEMANTIC 12 条；BACKDROP 5 容器明确不计控件分母；缺 role/键盘的点诚实标注「a11y 缺口待证」。
- **消费者挂载点抽核准确**：11 条 CONSUMER-PLACEMENT 行号对源码成立。
- **分母诚实**：AU×48（族级）与 348（控件级候选）均声明「非验收覆盖率、G3 采证后逐条核」；291 保留为 RAW-BASE；既有截图未当分母；循环列表只登记规则行、条件渲染标 COND。

## 2. R1–R6 复验（对真实源码逐条核对，均已关闭）

- **R1 看板拖拽源/落点（已关闭）**：CTL-336 `editor.tsx:328` 拖拽源（draggable+onDragStart 写 widget-type，兼点击添加）、CTL-337 `editor.tsx:261` 放置目标（onDrop 读 widget-type）成对入册，源码行号属实；单指针替代/落点高亮标「待验」。
- **R2 甘特三手势拆分（已关闭）**：CTL-333 点击打开(Enter/Space)+Esc取消@338、CTL-334 整体平移(←/→1天, saving/disabled 禁拖)@149、CTL-335 左/右 resize 手柄(Shift+←/→改 dueDate、数值钳制、inflight)@154，三行分离，源码 `data-rs` 热区@154 属实。
- **R3 LaneSwitcher 挂载对齐（已关闭）**：补 CTL-055/056/057 三处挂载（panel.tsx:1832/1854/2327），与源码一致。
- **R4 SUB 状态/焦点裁剪（已关闭）**：46 条 SUB 出现 37 种状态串；seg「天」标 `Selected(aria-pressed=range)`@1430、完成/推迟为 `Disabled(=disabled)`、send/generate 带 `Loading 防重/Disabled(sending)`；`keyboard_focus_context` 落到 segmented 循环/图标按钮/Enter 发送等具体规则，不再全行同句。
- **R5 未挂载排除名册（已关闭，并更正我先前口径）**：排除名册列 BatchField(1918)/TableToolbar(2017)/StatusTag(2040)/Progress(2059)/TableEmpty(2068)/Summary(2509)/DeltaBadge(2010)。**经源码核实：`Progress`@2059 全仓零 `<Progress>` 调用，确为未挂载，应排除**（我上一版「Progress 已挂载」的说法有误，以此版为准）；`ProgressReportTable`@1088、`ProgressReportForm`@1189/3749 是另两个已挂载组件，CSV 保留 12 行、未被误排；ViewSwitcher@1026 已挂载、移出排除。
- **R6 降级态分层（已关闭）**：AU-G03/F-5 明确①空 Key/离线/NO_LLM/INVALID_CREDENTIAL 注入=AUTO 可确定性模拟（禁新生成、CRUD 照常、零写），不标 MANUAL_PENDING；②真实在线生成/真实 Key 链路=MANUAL_PENDING（需真实凭据/在线模型，不自动验）。

## 3. 仍不适合作「最终验收分母」的部分（方法提醒，非缺陷）

- **参数化规则行不可枚举实例**：循环列表行、甘特 resize 左/右（一条参数化规则覆盖两侧）等登记的是规则而非运行实例；最终分母须 G3 采证后按真实运行实例逐条计数，静态行数不等于实例数。
- **动态条件控件待运行时补登**：菜单展开项、确认对话框分支等 AST 静态不可见，须运行时补登（缺口⑥），当前不计入也不遗漏。
- **a11y 缺口待证**：状态柱/人员条/伪 tab/里程碑 chip/未排期行仅鼠标缺 role/键盘，单指针替代/inflight/落点高亮均标「待验」，静态清单不判通过。
- **方法通过 ≠ 全系统验收**：本评审只确认清单「可审计、无漏范围/误计/不可验条款」；真实审美、状态、键盘、对比度仍须 G3 真实 GUI 目视与独立审证，静态/自动结果不替代视觉 PASS。

## 4. 边界声明

- 未修改清单所有者的两个文件；R1–R6 修正由作者落实，本评审只登记复验结论。
- G3 口径：隔离实例原提示为导航未带该实例 URL token（非实例不可达），主端将带链接导航重建实例采证；本清单方法结论与 G3 目视门相互独立。

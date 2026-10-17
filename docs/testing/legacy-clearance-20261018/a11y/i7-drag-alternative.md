# I7 拖拽键盘/单指针替代 — 源码检索 + 真实 UI 走查（补证）

- 被测提交：`380802c`；方法：源码全量检索（draggable/pointer/keyboard）+ Playwright 真实 UI 走查；遵守不写数据：甘特方向键落库路径**未执行**（源码取证），看板编辑进入后「取消」退出未保存。

## 补证前状态
- §12-5 / 清单 I7：看板 HTML5 拖拽、甘特 move/resize 的非指针替代「未实测」。

## 一、拖拽/手势实现源码检索

### 1. 甘特条 move / resize（`views/gantt.tsx`）
- 指针手势：`onPointerDownBar`（149–171）按命中位置定 mode：左 6px=`start`（左缘 resize 改 startDate）、右 6px=`end`（右缘 resize 改 dueDate）、中部=`move`（整体平移）；`onPointerMoveBar`（172–192）ghost 预览；`onPointerUpBar`（193–216）落库，统一走 `commitDates`（137–147）→ `task update`，白名单仅 startDate/dueDate。
- **键盘替代路径（源码 227–258 `onKeyDownBar`）**：
  - Enter / Space → 打开详情抽屉（preventDefault，228–232）；
  - Esc → 取消进行中指针拖拽、不落库（235–240）；
  - **←/→（无 Shift）→ 整体移动 1 天**，startDate/dueDate 同向平移（252–256）；
  - **Shift+←/→ → 右缘调整工期 1 天**，只改 dueDate（247–251）；
  - 仅作用于实条子条；父条只读派生（rng.derived）不响应方向键。
- 条体（338–351）：`div tabIndex=0 role=button aria-label="任务 …。回车打开详情；←/→ 移动 1 天，Shift+←/→ 调整工期。"`，左右手柄 `data-rs=left/right`（aria-hidden）。
- 缺口：**左缘 resize（改 startDate）无直接步进键**；但可经 Enter 开抽屉改开始日期（完整替代）。

### 2. 看板（bento）编辑器（`board/editor.tsx`）
- RGL `<GridLayout isDraggable isResizable isDroppable>`（252–285）：指针拖移/缩放卡片、落点 `onDrop`（261–275）接 HTML5 drag。
- 卡片库源（325–335）：`<button draggable onDragStart(setData('widget-type')) onClick={onAdd}>`，拖拽为可选，click/Enter 直接 `onAdd` 加到末尾。
- **卡片 wrap（289–296）：`div onClick` 选中，无 tabIndex、无 role、无 onKeyDown** —— 不可键盘聚焦。
- ConfigPanel（343–469）：数据源/筛选/排序/公式/显示/外观，**无 x/y/w/h 坐标或宽高数字输入、无方向键步进**（实测 positionInputs=0）。
- 替代：＋卡片库按钮（240）→ 15 个原生 button 可 Enter 添加；卡片 × 按钮（297）可移除；导出/导入/恢复默认/取消/保存齐备。
- 任务表（`views/tasks.tsx`）：**无 HTML5 拖拽卡片**（全文件无 draggable/dragstart），状态/层级经行内编辑抽屉与「移动」对话框（118–124）完成，不属拖拽手势。

## 二、真实 UI 走查证据（`/tmp/a11y-i7.log`）

### 甘特（存在替代路径）
- 实测 5 条条体 `role=button tabIndex=0`，aria-label 含日期/工期/状态/进度/前置/关键路径与按键提示；左右手柄在。
- focus 第一条（需求梳理）→ **Enter → 抽屉打开（drawer open:true）** → Esc → 焦点归还 rail「甘特排期」按钮。
- ←/→、Shift+←/→ 落库路径按「不写数据」要求未触发，以源码 243–257 取证。
- 截图：`i7-gantt.png`、`i7-gantt-bar-enter.png`。

### 看板布局编辑（位移/缩放无替代）
- 进入「总览看板 → 布局编辑」（未保存）：7 个 RGL wrap 全部 `tabIndex=null / role=null / focusable=false`；配置面板无位置/尺寸输入（positionInputs=0）。
- ＋卡片库打开：15 个原生 button（已添加的 disabled，其余 draggable=true 且可 click 添加到末尾）。
- 「取消」退出，未触发保存（`BOARD exited edit (no save): true`）。
- 截图：`i7-board-view.png`、`i7-board-editor.png`、`i7-board-cardlib.png`。

## 结论
**I7 = 部分存在（分项判定）：**
- **甘特 move/resize：存在非指针替代** —— ←/→ 整体移动 1 天、Shift+←/→ 右缘调工期、Enter 开抽屉改日期（源码 gantt.tsx:227–258；Enter 开抽屉实测成立）。左缘 startDate 步进缺直接键，走抽屉日期字段替代。
- **看板卡片拖移/缩放：不存在键盘替代** —— RGL wrap 不可聚焦、ConfigPanel 无坐标/尺寸输入、无方向键步进；仅「增/删卡片」有按钮替代。定位：`board/editor.tsx:289-301`（wrap 不可聚焦）、`343-469`（ConfigPanel 无位置字段）、`252-285`（RGL 指针拖/缩）。
- AT 实机/单指针完整体验待专项，本项不冒充实测通过。

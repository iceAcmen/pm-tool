/**
 * R3-OBS-002：抽屉关闭后的焦点归还（纯逻辑，与 DOM 解耦，可在 node 离线表驱动断言）。
 *
 * 根因（旧实现错误）：
 *  旧 DrawerPanel 在 mount 的 useEffect 里把 document.activeElement 记为 opener。
 *  但表单首个字段带 autoFocus，会在 commit 阶段（早于 passive useEffect）就把焦点抢进抽屉内 input，
 *  于是 opener 实际被错记成「抽屉内 input」。关闭时该 input 已随抽屉卸载，
 *  fallback 又写成 `.pm-row-active button, .pm-button-primary`——而 `.pm-row-active` 从不渲染，
 *  最终误聚到全局 `.pm-button-primary`（可能是被选中的 7 天提醒范围按钮）。
 *
 * 新方案：在「打开动作发生的那一刻」记录 opener（pointerdown 捕获 / 键盘 Enter 打开某行），
 *  DrawerPanel mount 时快照该记录；关闭时按
 *    真实 pointer opener（仍在文档）→ 键盘行 opener（该行可见 title/edit）→ 当前视图合理控件(.pm-add-row) → 任意可见行 title
 *  的顺序归还焦点。绝不落到全局 .pm-button-primary / 提醒条。
 */

/** 可聚焦元素的最小形状（真实环境即 HTMLElement）。 */
export interface FocusableLike {
  focus(): void
}

/** 焦点解析所需的最小文档能力（真实环境即 document；测试注入伪 DOM）。 */
export interface FocusDoc {
  /** 节点是否仍挂在文档中（对应 document.contains）。opener 已被删除/卸载时为 false。 */
  contains(node: unknown): boolean
  /** 键盘打开路径：按行 id 找该可见行内的 title/edit 可聚焦入口。 */
  rowOpener(rowId: string): FocusableLike | null
  /** 兜底：当前视图内合理的「添加记录」控件。 */
  fallbackControl(): FocusableLike | null
  /** 再退一步：视图里任意可见行的 title 入口。 */
  anyRowTitle(): FocusableLike | null
}

/** 打开抽屉时记录的 opener 来源。 */
export type OpenerSpec =
  | { kind: 'pointer', el: FocusableLike | null | undefined }
  | { kind: 'row', rowId: string }
  | { kind: 'none' }

// ---- 模块级 opener 暂存（面板单抽屉单实例）----
let pending: OpenerSpec = { kind: 'none' }

/** pointerdown 捕获：记录被点的可聚焦控件（即真实 opener，如 title/edit/create 按钮）。 */
export function setPointerOpener(el: FocusableLike | null | undefined): void {
  pending = { kind: 'pointer', el: el ?? null }
}

/** 键盘 Enter 打开某行：记录该行 id，关闭时回到该行可见的 title/edit 入口。 */
export function setRowOpener(rowId: string): void {
  pending = { kind: 'row', rowId }
}

/** DrawerPanel mount 时取走并清空记录（避免后续抽屉内的点击/输入污染 opener）。 */
export function takeOpenerSpec(): OpenerSpec {
  const spec = pending
  pending = { kind: 'none' }
  return spec
}

/** 仅测试用：重置模块级暂存，保证用例间互不污染。 */
export function __resetDrawerFocusForTest(): void {
  pending = { kind: 'none' }
}

/**
 * 关闭抽屉时解析应归还焦点的元素。
 * 顺序：真实 pointer opener（仍在文档）→ 键盘行 opener（该行可见 title/edit）
 *       → 当前视图「添加记录」控件 → 任意可见行 title → null。
 * 返回 null 时不强行聚焦任何控件（交给浏览器），绝不落到全局 primary/提醒。
 */
export function resolveDrawerFocusTarget(spec: OpenerSpec, doc: FocusDoc): FocusableLike | null {
  if (spec.kind === 'pointer' && spec.el && doc.contains(spec.el)) return spec.el
  if (spec.kind === 'row' && spec.rowId) {
    const row = doc.rowOpener(spec.rowId)
    if (row) return row
  }
  return doc.fallbackControl() ?? doc.anyRowTitle() ?? null
}

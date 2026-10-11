/**
 * OPT-09：面板快捷键纯函数 reducer（与 UI 解耦，可在 node 离线表驱动单测）。
 *
 * 约定输入（键盘事件最小形状）：
 *  - key: 键名（'j'/'k'/' ' / 'Delete' / 'Backspace' / 'Enter'）
 *  - targetTag: 事件目标标签名（'INPUT'/'TEXTAREA'/'SELECT'）
 *  - targetEditable: 目标是否 contenteditable
 *  - ctrl/meta/alt: 修饰键
 * 返回动作：
 *  - {type:'move', delta}        j/k 移动高亮
 *  - {type:'toggleActive'}        空格切换活动行勾选
 *  - {type:'deleteSelected'}     Delete/Backspace（走既有批量删除确认，不绕过）
 *  - {type:'openActive'}         Enter 打开详情
 *  - null                        不处理
 */
export interface PanelKeyEvent {
  key: string
  targetTag?: string
  targetEditable?: boolean
  ctrl?: boolean
  meta?: boolean
  alt?: boolean
}

export function panelKeyboard(e: PanelKeyEvent): { type: 'move', delta: number } | { type: 'toggleActive' } | { type: 'deleteSelected' } | { type: 'openActive' } | null {
  // 守卫：输入类元素或带修饰键一律不处理。
  if (e.ctrl || e.meta || e.alt) return null
  const tag = (e.targetTag ?? '').toUpperCase()
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.targetEditable) return null
  switch (e.key) {
    case 'j': return { type: 'move', delta: 1 }
    case 'k': return { type: 'move', delta: -1 }
    case ' ': return { type: 'toggleActive' }
    case 'Delete':
    case 'Backspace': return { type: 'deleteSelected' }
    case 'Enter': return { type: 'openActive' }
    default: return null
  }
}

/** 便捷：从真实 KeyboardEvent 抽取最小形状。 */
export function fromKeyboardEvent(ev: KeyboardEvent): PanelKeyEvent {
  const el = ev.target as HTMLElement | null
  return {
    key: ev.key,
    targetTag: el?.tagName,
    targetEditable: el?.getAttribute?.('contenteditable') != null,
    ctrl: ev.ctrlKey,
    meta: ev.metaKey,
    alt: ev.altKey,
  }
}

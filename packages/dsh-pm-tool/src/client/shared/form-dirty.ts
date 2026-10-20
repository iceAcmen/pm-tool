/**
 * O4 草稿未保存 dirty 判定（纯函数，无 React/DOM 依赖，可离线单测）。
 *
 * 口径：
 * - 以控件 name 为键，受控/非受控输入、select、textarea、checkbox/radio 多选都归一化为字符串数组；
 * - 比较前逐项 trim，空串与缺失视为等价（受控空串 = 未填）；
 * - checkbox/radio 多选按排序后连接比较，顺序抖动不算 dirty；
 * - 文本（description 等 defaultValue 非控）纳入比较，避免改动被静默丢弃。
 *
 * 不生造中文文案逻辑、不判断业务语义，只回答「快照是否有可见改动」。
 */

export type FormSnapshot = Record<string, string[]>

/** 归一化单个值：trim；空串归一为未提供。 */
function norm(v: string): string {
  return v.trim()
}

/**
 * 从真实表单元素采集快照（受控/非控 input、select、textarea、checkbox/radio 多选）。
 * 仅用于 dirty 比较，不读取业务语义。
 */
export function collectFormSnapshot(form: HTMLFormElement): FormSnapshot {
  const snap: FormSnapshot = {}
  const data = new FormData(form)
  for (const [name, value] of data.entries()) {
    if (typeof value !== 'string') continue
    ;(snap[name] ??= []).push(value)
  }
  return snap
}

/**
 * 比较两份表单快照是否一致（无可保存改动）。
 * 键并集遍历；缺失与空数组等价；数组排序后逐项比对。
 */
export function snapshotsEqual(a: FormSnapshot, b: FormSnapshot): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    const av = (a[key] ?? []).map(norm).filter(Boolean).sort()
    const bv = (b[key] ?? []).map(norm).filter(Boolean).sort()
    if (av.length !== bv.length) return false
    for (let i = 0; i < av.length; i++) {
      if (av[i] !== bv[i]) return false
    }
  }
  return true
}

/** 把「是否 dirty」语义直接给出：有任一可见改动 → true。 */
export function snapshotIsDirty(initial: FormSnapshot, current: FormSnapshot): boolean {
  return !snapshotsEqual(initial, current)
}

/**
 * O4 关闭确认总口径：基础表单或资料/进展草稿任一有改动，都必须确认放弃。
 * 单独封装避免 UI 层把 snapshotIsDirty 再取反，导致「干净时确认、改过反而不确认」。
 */
export function shouldConfirmDiscard(
  initial: FormSnapshot | null,
  current: FormSnapshot | null,
  draftDirty: boolean,
): boolean {
  const formDirty = Boolean(initial && current && snapshotIsDirty(initial, current))
  return formDirty || draftDirty
}

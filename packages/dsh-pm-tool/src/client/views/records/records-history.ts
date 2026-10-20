/**
 * records 分片（B6）交付物变更留痕只读投影（纯函数，零写盘）。
 *
 * history 由 core 在版本/状态变化时追加（field=created|status|version），本模块只把它
 * 投影成展示行，不回写、不重排历史；旧记录原样保留。
 */

export interface DeliverableChangeLike {
  at: string
  field: string
  from: string
  to: string
  by: string
  note: string
}

export interface HistoryRow {
  key: string
  target: string
  transition: string
  at: string
  by: string
  note: string
}

/** field → 展示名。 */
const FIELD_TARGET: Record<string, string> = {
  created: '创建',
  status: '状态',
  version: '版本',
}

/**
 * 投影历史：最新在前（reverse 副本，不改原数组）。
 * status 行给「from → to」中文标签；version 行给版本号变化；created 行只显示终态标签。
 * statusLabels 由调用方从 core labels 传入，未知值原样回显。
 */
export function projectDeliverableHistory(
  history: readonly DeliverableChangeLike[],
  statusLabels: Record<string, string>,
): HistoryRow[] {
  return [...history].reverse().map((change, index): HistoryRow => {
    const target = FIELD_TARGET[change.field] ?? change.field
    let transition: string
    if (change.field === 'created') {
      transition = statusLabels[change.to] ?? change.to
    } else if (change.field === 'status') {
      transition = `${statusLabels[change.from] ?? change.from} → ${statusLabels[change.to] ?? change.to}`
    } else {
      transition = `${change.from || '—'} → ${change.to || '—'}`
    }
    return {
      key: `${change.at}-${index}`,
      target,
      transition,
      at: change.at,
      by: change.by,
      note: change.note,
    }
  })
}

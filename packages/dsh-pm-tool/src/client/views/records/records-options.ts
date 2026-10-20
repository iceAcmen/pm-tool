/**
 * records 分片（B6）共享的确定性选项与应用内 listbox 纯模型。
 *
 * 定位：无 DOM、无写盘、零随机；供会议 / 汇报 / 交付物表单的状态选择器与
 * 应用内 listbox（替代原生闭合 <select>）同源消费。中文标签与 core 真源一致，
 * 不另造状态词。
 *
 * 状态口径（core）：
 * - 会议：draft 草稿 / final 已定稿。
 * - 会议行动项：todo 未开始 / in_progress 进行中 / done 已完成 / cancelled 已取消。
 * - 汇报：draft 草稿 / final 已定稿。
 * - 交付物五态：planned 计划中 / in_progress 制作中 / submitted 已提交 / accepted 已验收 /
 *   wrapped 已收尾（人显式收尾、非正式验收；backend 允许人手动写入，选择器提供）。
 */

export interface RecordOption {
  value: string
  label: string
  /** 副行（角色 / 说明），姓名主行 + 角色副行只出现一次，不叠字。 */
  hint?: string
}

export const MEETING_STATUS_OPTIONS: readonly RecordOption[] = [
  { value: 'draft', label: '草稿' },
  { value: 'final', label: '已定稿' },
]

export const MEETING_ACTION_STATUS_OPTIONS: readonly RecordOption[] = [
  { value: 'todo', label: '未开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'done', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

export const REPORT_STATUS_OPTIONS: readonly RecordOption[] = [
  { value: 'draft', label: '草稿' },
  { value: 'final', label: '已定稿' },
]

/** U5 汇报来源类型（缺省 manual 手动撰写；session 来自会话，须带会话 ID）。 */
export const REPORT_SOURCE_OPTIONS: readonly RecordOption[] = [
  { value: 'manual', label: '手动撰写' },
  { value: 'session', label: '会话生成' },
]

export const DELIVERABLE_STATUS_OPTIONS: readonly RecordOption[] = [
  { value: 'planned', label: '计划中' },
  { value: 'in_progress', label: '制作中' },
  { value: 'submitted', label: '已提交' },
  { value: 'accepted', label: '已验收' },
  { value: 'wrapped', label: '已收尾', hint: '人显式收尾，非正式验收' },
]

/** 按 value 反查中文标签；未知值原样回显，不静默改写成别的状态。 */
export function optionLabel(options: readonly RecordOption[], value: string | null | undefined): string {
  if (value == null || value === '') return ''
  return options.find(o => o.value === value)?.label ?? value
}

/**
 * listbox 确定性过滤：不区分大小写子串匹配 label / hint / value；空词返回全量。
 * 返回的仍是原对象引用，保持选项身份稳定（用于键盘高亮与 aria-selected）。
 */
export function filterOptions(options: readonly RecordOption[], query: string): RecordOption[] {
  const q = query.trim().toLocaleLowerCase()
  if (!q) return options.map(o => ({ ...o }))
  return options
    .filter(o =>
      o.label.toLocaleLowerCase().includes(q)
      || (o.hint ?? '').toLocaleLowerCase().includes(q)
      || o.value.toLocaleLowerCase().includes(q),
    )
    .map(o => ({ ...o }))
}

/**
 * 键盘环形移动高亮索引：dir=-1 上移 / +1 下移；越界回卷，空列表返回 -1。
 * 纯函数，不读写 DOM，供应用内 listbox 的 ArrowUp/ArrowDown 使用。
 */
export function moveHighlight(active: number, length: number, dir: -1 | 1): number {
  if (length <= 0) return -1
  if (active < 0) return dir === 1 ? 0 : length - 1
  return (active + dir + length) % length
}

/** 取过滤结果中与输入值相等的项索引；无匹配返回 -1。 */
export function indexOfValue(options: readonly RecordOption[], value: string | null | undefined): number {
  if (value == null) return -1
  return options.findIndex(o => o.value === value)
}

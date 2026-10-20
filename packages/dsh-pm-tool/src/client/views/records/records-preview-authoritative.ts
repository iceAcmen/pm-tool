/**
 * B6 权威进展候选选择纯逻辑（data `report preview` dry-run，零写）。
 *
 * 类型来自 shared/records-props（front 唯写）：ReportPreviewCandidate / ReportPreviewRef。
 * 选择以复合 key（taskId/entryId）标识，跨任务同名 pl-N 各自保留；组装给 generate 的
 * selectedRefs 为 {taskId,entryId,revisionId?} 三元组，后端复核真实 task-entry-revision，
 * 不发裸 entryId。stale/伪造由后端报 error 零写，本模块不做本地 seen/latest 冲突判断。
 * 本模块不写库、不构造 frozenExcerpt（冻结由后端 generate 完成）。
 */

import type { ReportPreviewCandidate, ReportPreviewRef } from '../../shared/records-props.js'

/** 与后端一致：冻结摘录最多 50 条。 */
export const FROZEN_EXCERPTS_MAX = 50

/** 复合唯一 key：taskId/entryId，跨任务区分同名 pl-N。 */
export function candidateKey(c: ReportPreviewCandidate): string {
  return `${c.taskId}/${c.entryId}`
}

/** 默认全选（契约：未传 selector = 周期内全部未删候选）。 */
export function defaultCheckedKeys(candidates: ReportPreviewCandidate[]): Set<string> {
  return new Set(candidates.map(candidateKey))
}

/**
 * 重预览保勾选策略：首次（prev 为空）全选；后续仅保留仍存在的已勾选项，
 * 丢弃已消失条目，不自动勾新、不重置全选。
 */
export function preserveChecked(prev: Set<string>, list: ReportPreviewCandidate[]): Set<string> {
  const next = new Set<string>()
  for (const c of list) {
    const k = candidateKey(c)
    if (prev.size === 0 || prev.has(k)) next.add(k)
  }
  return next
}

/** 切换单个候选选中态，返回新 Set。 */
export function toggleKey(keys: Set<string>, key: string): Set<string> {
  const next = new Set(keys)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

/** 全选/清空。 */
export function setAllKeys(candidates: ReportPreviewCandidate[], checked: boolean): Set<string> {
  return checked ? defaultCheckedKeys(candidates) : new Set<string>()
}

/**
 * 组装复合 selectedRefs：按候选顺序、复合 key（taskId/entryId）去重，截断到 50 上限。
 * revisionId 可选，原样回传（不丢版本、不伪造）；跨任务同名 pl-N 各自保留（taskId 区分）。
 */
export function buildSelectedRefs(
  candidates: ReportPreviewCandidate[],
  checked: Set<string>,
  max: number = FROZEN_EXCERPTS_MAX,
): ReportPreviewRef[] {
  const seen = new Set<string>()
  const out: ReportPreviewRef[] = []
  for (const c of candidates) {
    const key = candidateKey(c)
    if (!checked.has(key)) continue
    if (seen.has(key)) continue
    seen.add(key)
    const ref: ReportPreviewRef = { taskId: c.taskId, entryId: c.entryId }
    if (c.revisionId) ref.revisionId = c.revisionId
    out.push(ref)
    if (out.length >= max) break
  }
  return out
}

/** 已选数量是否在 50 上限内。 */
export function withinFrozenLimit(count: number): boolean {
  return count >= 0 && count <= FROZEN_EXCERPTS_MAX
}

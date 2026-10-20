import { describe, it, expect } from 'vitest'
import { shouldConfirmDiscard, snapshotsEqual, snapshotIsDirty, type FormSnapshot } from './form-dirty.js'

describe('form-dirty（O4 未保存草稿判定）', () => {
  it('空改动（含 trim、空串/缺失等价）→ 非 dirty', () => {
    const a: FormSnapshot = { title: [' 收尾任务 '], description: [''], assignee: [''] }
    const b: FormSnapshot = { title: ['收尾任务'], description: [], assignee: [] }
    expect(snapshotsEqual(a, b)).toBe(true)
    expect(snapshotIsDirty(a, b)).toBe(false)
  })

  it('受控字段改了一字 → dirty', () => {
    const a: FormSnapshot = { title: ['收尾任务'] }
    const b: FormSnapshot = { title: ['收尾任务改'] }
    expect(snapshotIsDirty(a, b)).toBe(true)
  })

  it('非控 description（defaultValue）改动纳入比较，不被静默丢弃', () => {
    const a: FormSnapshot = { description: ['原始说明'] }
    const b: FormSnapshot = { description: ['原始说明补充了一句'] }
    expect(snapshotIsDirty(a, b)).toBe(true)
  })

  it('多选 checkbox 顺序抖动不算 dirty，内容不同才算', () => {
    const a: FormSnapshot = { predecessorIds: ['t2', 't1'] }
    const b: FormSnapshot = { predecessorIds: ['t1', 't2'] }
    expect(snapshotsEqual(a, b)).toBe(true)
    const c: FormSnapshot = { predecessorIds: ['t1', 't3'] }
    expect(snapshotIsDirty(a, c)).toBe(true)
  })

  it('一侧缺键、另一侧空数组 → 等价；一侧有值 → dirty', () => {
    expect(snapshotsEqual({ repoUrl: [] }, {})).toBe(true)
    expect(snapshotIsDirty({ repoUrl: [] }, { repoUrl: ['https://x'] })).toBe(true)
  })

  it('关闭确认总口径：表单或资料草稿任一 dirty 都确认，全部干净才直关', () => {
    const clean: FormSnapshot = { title: ['原任务'] }
    const changed: FormSnapshot = { title: ['原任务（修改）'] }
    expect(shouldConfirmDiscard(clean, clean, false)).toBe(false)
    expect(shouldConfirmDiscard(clean, changed, false)).toBe(true)
    expect(shouldConfirmDiscard(clean, clean, true)).toBe(true)
    expect(shouldConfirmDiscard(clean, changed, true)).toBe(true)
  })

  it('尚未取得表单快照时不误报；资料草稿仍可独立触发确认', () => {
    expect(shouldConfirmDiscard(null, null, false)).toBe(false)
    expect(shouldConfirmDiscard(null, null, true)).toBe(true)
  })
})

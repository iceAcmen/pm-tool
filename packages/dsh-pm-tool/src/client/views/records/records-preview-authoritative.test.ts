import { describe, it, expect } from 'vitest'
import {
  candidateKey,
  defaultCheckedKeys,
  preserveChecked,
  toggleKey,
  setAllKeys,
  buildSelectedRefs,
  withinFrozenLimit,
  FROZEN_EXCERPTS_MAX,
} from './records-preview-authoritative.js'
import type { ReportPreviewCandidate } from '../../shared/records-props.js'

const c = (taskId: string, entryId: string, revisionId?: string): ReportPreviewCandidate => ({
  taskId, entryId, revisionId, author: '林澜', date: '2026-10-12', content: '完成接口联调', refs: [],
})

describe('records-preview-authoritative 候选选择', () => {
  it('复合 key 用 taskId/entryId 区分跨任务同名 pl-N', () => {
    expect(candidateKey(c('t-1', 'pl-1'))).toBe('t-1/pl-1')
    expect(candidateKey(c('t-2', 'pl-1'))).not.toBe(candidateKey(c('t-1', 'pl-1')))
  })

  it('默认全选；toggle 切换；setAll 全选/清空', () => {
    const list = [c('t-1', 'pl-1', 'rv-1'), c('t-1', 'pl-2', 'rv-2')]
    let keys = defaultCheckedKeys(list)
    expect(keys.size).toBe(2)
    keys = toggleKey(keys, 't-1/pl-1')
    expect(keys.has('t-1/pl-1')).toBe(false)
    expect(keys.has('t-1/pl-2')).toBe(true)
    expect(setAllKeys(list, false).size).toBe(0)
    expect(setAllKeys(list, true).size).toBe(2)
  })

  it('50 上限校验边界', () => {
    expect(withinFrozenLimit(0)).toBe(true)
    expect(withinFrozenLimit(FROZEN_EXCERPTS_MAX)).toBe(true)
    expect(withinFrozenLimit(FROZEN_EXCERPTS_MAX + 1)).toBe(false)
    expect(withinFrozenLimit(-1)).toBe(false)
  })

  it('buildSelectedRefs 复合结构：跨任务同名 pl-1 各自保留，带 revisionId', () => {
    const list = [c('t-1', 'pl-1', 'rv-1'), c('t-2', 'pl-1', 'rv-3')]
    const refs = buildSelectedRefs(list, defaultCheckedKeys(list))
    expect(refs).toEqual([
      { taskId: 't-1', entryId: 'pl-1', revisionId: 'rv-1' },
      { taskId: 't-2', entryId: 'pl-1', revisionId: 'rv-3' },
    ])
  })

  it('buildSelectedRefs：revisionId 可选原样回传，复合 key 去重，按 50 截断', () => {
    const noRev = c('t-1', 'pl-9')
    const dup = [c('t-1', 'pl-1', 'rv-1'), c('t-1', 'pl-1', 'rv-2')]
    expect(buildSelectedRefs([noRev, ...dup], defaultCheckedKeys([noRev, ...dup]))).toEqual([
      { taskId: 't-1', entryId: 'pl-9' },
      { taskId: 't-1', entryId: 'pl-1', revisionId: 'rv-1' },
    ])
    const many = Array.from({ length: FROZEN_EXCERPTS_MAX + 3 }, (_, i) => c(`t-${i}`, `pl-${i}`, `rv-${i}`))
    expect(buildSelectedRefs(many, defaultCheckedKeys(many)).length).toBe(FROZEN_EXCERPTS_MAX)
  })

  it('preserveChecked：首次全选；重预览保留仍存在项、丢弃消失项、不自动勾新', () => {
    const first = [c('t-1', 'pl-1', 'rv-1'), c('t-1', 'pl-2', 'rv-2')]
    expect(preserveChecked(new Set(), first).size).toBe(2)
    const kept = new Set(['t-1/pl-1'])
    const second = [c('t-1', 'pl-1', 'rv-1'), c('t-1', 'pl-3', 'rv-3')]
    expect([...preserveChecked(kept, second)]).toEqual(['t-1/pl-1'])
  })
})

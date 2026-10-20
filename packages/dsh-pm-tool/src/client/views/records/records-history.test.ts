import { describe, it, expect } from 'vitest'
import { projectDeliverableHistory } from './records-history.js'

const labels: Record<string, string> = {
  planned: '计划中', in_progress: '制作中', submitted: '已提交', accepted: '已验收', wrapped: '已收尾',
}

describe('projectDeliverableHistory：只读投影，最新在前，不改原数组', () => {
  it('created 行显示终态标签；status 行给中文 from→to；version 行给版本号', () => {
    const history = [
      { at: '2026-10-01T09:00:00Z', field: 'created', from: '', to: 'planned', by: '林澜', note: '建档' },
      { at: '2026-10-10T09:00:00Z', field: 'status', from: 'planned', to: 'submitted', by: '陈屿', note: '提交评审' },
      { at: '2026-10-15T09:00:00Z', field: 'version', from: 'v1.0', to: 'v1.1', by: '', note: '' },
    ]
    const rows = projectDeliverableHistory(history, labels)
    expect(rows.map(r => r.target)).toEqual(['版本', '状态', '创建'])
    expect(rows[1].transition).toBe('计划中 → 已提交')
    expect(rows[0].transition).toBe('v1.0 → v1.1')
    expect(rows[2].transition).toBe('计划中')
  })

  it('未知 field 原样回显；空 history 返回空数组；原数组不被修改', () => {
    const history = [{ at: 'x', field: 'weird', from: 'a', to: 'b', by: '', note: '' }]
    const rows = projectDeliverableHistory(history, labels)
    expect(rows[0].target).toBe('weird')
    expect(projectDeliverableHistory([], labels)).toEqual([])
    expect(history.length).toBe(1)
  })

  it('wrapped 已收尾状态变更行正确渲染中文 from→to，不静默丢标签', () => {
    const history = [
      { at: '2026-10-01T09:00:00Z', field: 'created', from: '', to: 'planned', by: '林澜', note: '建档' },
      { at: '2026-10-18T09:00:00Z', field: 'status', from: 'submitted', to: 'wrapped', by: '陈屿', note: '停办收尾' },
    ]
    const rows = projectDeliverableHistory(history, labels)
    expect(rows[0].transition).toBe('已提交 → 已收尾')
    expect(rows[1].transition).toBe('计划中')
  })
})

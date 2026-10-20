import { describe, it, expect } from 'vitest'
import { deliverableHelp } from './deliverable.js'
import { progressReportHelp } from './progress-report.js'

describe('U5 CLI help 披露 source/milestone/note 合同', () => {
  it('report help 展示 session 来源示例，并说明来源不可改', () => {
    const text = String(progressReportHelp)
    expect(text).toContain('"sourceType":"session"')
    expect(text).toContain('sourceSessionId')
    expect(text).toContain('生成后不可改')
  })

  it('deliverable help 展示 milestoneId/note 示例与校验说明', () => {
    const text = String(deliverableHelp)
    expect(text).toContain('milestoneId')
    expect(text).toContain('note')
    expect(text).toContain('必须存在且同项目')
  })
})

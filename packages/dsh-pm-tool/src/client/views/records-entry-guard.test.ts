import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const panel = readFileSync(join(here, '..', 'panel.tsx'), 'utf8')
const meetings = readFileSync(join(here, 'meetings.tsx'), 'utf8')
const reports = readFileSync(join(here, 'reports.tsx'), 'utf8')
const deliverables = readFileSync(join(here, 'deliverables.tsx'), 'utf8')

describe('B6 records 顶栏主入口统一', () => {
  it('会议/汇报/交付物主 CTA 不再打开旧 panel 抽屉', () => {
    expect(panel).toContain("cta = { label: '新增会议', action: () => setMeetingCreateRequest(n => n + 1) }")
    expect(panel).toContain("cta = { label: '生成快照', action: () => setReportCreateRequest(n => n + 1) }")
    expect(panel).toContain("cta = { label: '新增交付物', action: () => setDeliverableCreateRequest(n => n + 1) }")
    expect(panel).not.toContain("cta = { label: '新增会议', action: () => setDrawer({ kind: 'meeting' }) }")
    expect(panel).not.toContain("cta = { label: '新增交付物', action: () => setDrawer({ kind: 'deliverable' }) }")
  })

  it('三视图都接收 createRequest 并复用各自 openCreate', () => {
    for (const src of [meetings, reports, deliverables]) {
      expect(src).toContain('createRequest?: number')
      expect(src).toContain('if (createRequest > 0) openCreate()')
    }
    expect(panel).toContain('createRequest={meetingCreateRequest}')
    expect(panel).toContain('createRequest={reportCreateRequest}')
    expect(panel).toContain('createRequest={deliverableCreateRequest}')
  })

  it('会议空态也渲染新版 overlay，不能因提前 return 吞掉顶栏请求', () => {
    const emptyBranch = meetings.slice(meetings.indexOf('if (!meetings.length)'), meetings.indexOf('\n  return (', meetings.indexOf('if (!meetings.length)')))
    expect(emptyBranch).toContain('form && records')
    expect(emptyBranch).toContain('<RecordsMeetingForm')
  })
})

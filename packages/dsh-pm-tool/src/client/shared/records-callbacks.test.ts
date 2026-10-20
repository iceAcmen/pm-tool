import { describe, it, expect, vi } from 'vitest'
import {
  createMeetingCallbacks,
  createReportCallbacks,
  createDeliverableCallbacks,
  type RecordActionDeps,
} from './records-callbacks.js'

function makeDeps(confirmAllow = true) {
  const run = vi.fn(async () => true)
  const refresh = vi.fn()
  const confirm = vi.fn(async () => confirmAllow)
  const deps: RecordActionDeps = { projectId: 'p-0001', run, refresh, confirm }
  return { deps, run, refresh, confirm }
}

describe('MeetingCallbacks 命令翻译与确认门', () => {
  it('新增走 meeting add，编辑走 meeting update，成功刷新', async () => {
    const { deps, run, refresh } = makeDeps()
    const cb = createMeetingCallbacks(deps)
    await cb.onSaveMeeting('p-0001', null, {
      title: '例会', meetingDate: '2026-10-20', startTime: null, durationMinutes: null,
      location: '', facilitator: '', recorder: '', participants: [], status: 'draft',
      summary: '', topics: [], decisions: [], notes: '',
    })
    expect(run).toHaveBeenCalledWith(expect.stringContaining('meeting add '))
    expect(refresh).toHaveBeenCalledTimes(1)

    await cb.onSaveMeeting('p-0001', 'm-1', {
      title: '例会', meetingDate: '2026-10-20', startTime: null, durationMinutes: null,
      location: '', facilitator: '', recorder: '', participants: [], status: 'final',
      summary: '', topics: [], decisions: [], notes: '',
    })
    const updateCmd = run.mock.calls.at(-1)?.[0] as string
    expect(updateCmd).toContain('meeting update m-1 ')
    expect(updateCmd).toContain('"status":"final"')
  })

  it('行动项 add/update/promote/delete 命令正确；确认取消则不发命令', async () => {
    const { deps, run, confirm } = makeDeps()
    const cb = createMeetingCallbacks(deps)
    const action = { title: '写文档', owner: 'A', dueDate: null, status: 'todo' as const, taskId: null, riskIssueId: null }
    await cb.onSaveAction('m-1', null, action)
    expect(run).toHaveBeenCalledWith(expect.stringContaining('meeting action add m-1 '))
    await cb.onSaveAction('m-1', 'a-2', action)
    const actCmd = run.mock.calls.at(-1)?.[0] as string
    expect(actCmd).toContain('meeting action update m-1 a-2 ')
    expect(actCmd).toContain('"title":"写文档"')

    const denied = makeDeps(false).deps
    const cbDenied = createMeetingCallbacks(denied)
    await cbDenied.onPromoteAction('m-1', 'a-2')
    expect(confirm).not.toHaveBeenCalled()
    expect(denied.run).not.toHaveBeenCalled()
    const r = await cb.onPromoteAction('m-1', 'a-2')
    expect(confirm).toHaveBeenCalled()
    expect(r).toBe(true)
    expect(run).toHaveBeenCalledWith('meeting action promote m-1 a-2 confirm')

    await cb.onDeleteAction('m-1', 'a-2')
    expect(run).toHaveBeenCalledWith('meeting action delete m-1 a-2 confirm')
  })

  it('meeting delete 先确认，成功刷新', async () => {
    const { deps, run, refresh, confirm } = makeDeps()
    const cb = createMeetingCallbacks(deps)
    const ok = await cb.onDeleteMeeting('m-1')
    expect(confirm).toHaveBeenCalled()
    expect(ok).toBe(true)
    expect(run).toHaveBeenCalledWith('meeting delete m-1 confirm')
    expect(refresh).toHaveBeenCalled()
  })

  it('run 返回 false 原样上抛且不刷新（表单保输入不关层）', async () => {
    const run = vi.fn(async () => false)
    const refresh = vi.fn()
    const cb = createMeetingCallbacks({ projectId: 'p-1', run, refresh, confirm: async () => true })
    const ok = await cb.onSaveMeeting('p-1', 'm-1', {
      title: 'x', meetingDate: '2026-10-20', startTime: null, durationMinutes: null,
      location: '', facilitator: '', recorder: '', participants: [], status: 'draft',
      summary: '', topics: [], decisions: [], notes: '',
    })
    expect(ok).toBe(false)
    expect(refresh).not.toHaveBeenCalled()
  })
})

describe('ReportCallbacks（generate 带 selectedRefs；preview 门控 HTTP）', () => {
  it('generate 把 selectedRefs 并入 JSON；update/delete/export 命令正确', async () => {
    const { deps, run, refresh, confirm } = makeDeps()
    const cb = createReportCallbacks({ ...deps, previewAvailable: false })
    const payload = {
      status: 'draft' as const, executiveSummary: 's', completedWork: ['a'], nextPlans: ['b'], blockers: [],
    }
    const refs = [{ taskId: 't-1', entryId: 'pl-1', revisionId: 'rv-1' }]
    const ok = await cb.onGeneratePeriod('p-1', '2026-10-01', '2026-10-20', payload, refs)
    expect(ok).toBe(true)
    const genCmd = run.mock.calls.at(-1)?.[0] as string
    expect(genCmd).toContain('report generate p-1 2026-10-01 2026-10-20 ')
    expect(genCmd).toContain('"selectedRefs":[{"taskId":"t-1","entryId":"pl-1","revisionId":"rv-1"}]')
    expect(refresh).toHaveBeenCalled()

    await cb.onUpdateReport('r-1', payload)
    const updCmd = run.mock.calls.at(-1)?.[0] as string
    expect(updCmd).toContain('report update r-1 ')
    expect(updCmd).toContain('"executiveSummary":"s"')

    cb.onExportReport('r-1')
    expect(run).toHaveBeenCalledWith('report export r-1')

    await cb.onDeleteReport('r-1')
    expect(confirm).toHaveBeenCalled()
    expect(run).toHaveBeenCalledWith('report delete r-1 confirm')
  })

  it('previewAvailable=false（CLI-only）→ onPreviewPeriod 缺省，不回退 CLI 解析', () => {
    const cb = createReportCallbacks({ ...makeDeps().deps, previewAvailable: false })
    expect(cb.onPreviewPeriod).toBeUndefined()
  })

  it('previewAvailable=true → onPreviewPeriod 用注入 fetchPreview 透传三参+signal；连续第二次中止第一次', async () => {
    const fetches: { signal: AbortSignal }[] = []
    const fetchPreview = vi.fn(async (input: { projectId: string, periodStart: string, periodEnd: string, signal: AbortSignal }) => {
      fetches.push({ signal: input.signal })
      return [{ taskId: 't-1', entryId: 'pl-1', author: 'A', date: 'd', content: 'c', refs: [] }]
    })
    const cb = createReportCallbacks({ ...makeDeps().deps, previewAvailable: true, fetchPreview })
    const a = await cb.onPreviewPeriod!('p-1', '2026-10-01', '2026-10-20')
    const b = await cb.onPreviewPeriod!('p-1', '2026-10-01', '2026-10-20')
    expect(fetchPreview).toHaveBeenNthCalledWith(1, expect.objectContaining({ projectId: 'p-1', periodStart: '2026-10-01', periodEnd: '2026-10-20' }))
    expect(a).toHaveLength(1)
    expect(b).toHaveLength(1)
    // 第二次发起时第一次的 signal 已被 abort（stale 丢弃，不回写）
    expect(fetches[0].signal.aborted).toBe(true)
    expect(fetches[1].signal.aborted).toBe(false)
  })

  it('自己中止的 stale 请求返回空数组而非抛错（AbortError 不当预览错误）', async () => {
    const fetchPreview = vi.fn(async ({ signal }: { signal: AbortSignal }) => {
      await new Promise(r => setTimeout(r, 20))
      if (signal.aborted) throw new DOMException('aborted', 'AbortError')
      return [{ taskId: 't-2', entryId: 'pl-2', author: 'B', date: 'd2', content: 'c2', refs: [] }]
    })
    const cb = createReportCallbacks({ ...makeDeps().deps, previewAvailable: true, fetchPreview })
    const stale = cb.onPreviewPeriod!('p-1', '2026-10-01', '2026-10-20')
    const fresh = await cb.onPreviewPeriod!('p-1', '2026-10-01', '2026-10-20')
    expect(await stale).toEqual([])
    expect(fresh).toHaveLength(1)
  })
})

describe('DeliverableCallbacks', () => {
  it('add/update/delete 命令正确，delete 先确认', async () => {
    const { deps, run, refresh, confirm } = makeDeps()
    const cb = createDeliverableCallbacks(deps)
    const payload = {
      name: '交付物', version: '1.0', owner: 'A', status: 'planned' as const,
      location: '', description: '', dueDate: null, repoUrl: '', branch: '',
    }
    await cb.onSaveDeliverable('p-1', null, payload)
    expect(run).toHaveBeenCalledWith(expect.stringContaining('deliverable add '))
    await cb.onSaveDeliverable('p-1', 'd-1', payload)
    const dlvCmd = run.mock.calls.at(-1)?.[0] as string
    expect(dlvCmd).toContain('deliverable update d-1 ')
    expect(dlvCmd).toContain('"version":"1.0"')

    await cb.onDeleteDeliverable('d-1')
    expect(confirm).toHaveBeenCalled()
    expect(run).toHaveBeenCalledWith('deliverable delete d-1 confirm')
    expect(refresh).toHaveBeenCalled()
  })
})

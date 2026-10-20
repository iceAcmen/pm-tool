/**
 * B6 records 视图回调工厂（纯函数，无 React、不 import core/domain、不直连存储）。
 *
 * 边界：
 * - 只把 records-props 的回调翻译成真实 CLI 命令串交给注入的 run()；
 * - 写成功后调 refresh() 刷新全量快照；run() 返回 false（业务错误）原样上抛，表单不关层、保输入；
 * - 破坏性操作（delete / promote）先经 confirm() 确认；
 * - onPreviewPeriod 暂不提供：CLI `report preview` 仅返回 success 纯文本行，无结构化候选，
 *   等待 data 提供 machine-readable 通道（preview-json / CommandResult payload），前端不解析文本、不塞 mock。
 */
import type {
  MeetingCallbacks,
  ReportCallbacks,
  DeliverableCallbacks,
  MeetingPayload,
  MeetingActionPayload,
  ReportPayload,
  ReportPreviewRef,
  ReportPreviewCandidate,
  DeliverablePayload,
} from './records-props.js'
import { fetchReportPreview } from './report-preview-client.js'

export interface RecordActionDeps {
  projectId: string
  run: (cmd: string) => Promise<boolean>
  refresh: () => void
  confirm: (opts: { title: string, message?: string, confirmLabel?: string }) => Promise<boolean>
  /**
   * snapshot.capabilities.httpAvailable && previewApi 才为 true：提供权威 onPreviewPeriod（HTTP JSON）；
   * false/缺省则 omit onPreviewPeriod，表单显示 unavailable，绝不回退解析 CLI 文本。
   */
  previewAvailable?: boolean
  /** 可注入预览取数（测试替代 fetch）；缺省走 report-preview-client same-origin POST。 */
  fetchPreview?: (input: { projectId: string, periodStart: string, periodEnd: string, signal: AbortSignal }) => Promise<ReportPreviewCandidate[]>
}

/** 成功即刷新快照并返回 true；失败返回 false（表单保留输入不关层）。 */
async function settle(deps: RecordActionDeps, cmd: string): Promise<boolean> {
  const ok = await deps.run(cmd)
  if (ok) deps.refresh()
  return ok
}

export function createMeetingCallbacks(deps: RecordActionDeps): MeetingCallbacks {
  return {
    onSaveMeeting: async (projectId, meetingId, payload: MeetingPayload) => {
      const cmd = meetingId
        ? `meeting update ${meetingId} ${JSON.stringify(payload)}`
        : `meeting add ${JSON.stringify({ projectId, ...payload })}`
      return settle(deps, cmd)
    },
    onDeleteMeeting: async (meetingId) => {
      const allowed = await deps.confirm({
        title: '删除会议？',
        message: '将删除该会议及其行动项，此操作不可撤销。',
        confirmLabel: '确认删除',
      })
      if (!allowed) return false
      return settle(deps, `meeting delete ${meetingId} confirm`)
    },
    onSaveAction: async (meetingId, actionId, payload: MeetingActionPayload) => {
      const cmd = actionId
        ? `meeting action update ${meetingId} ${actionId} ${JSON.stringify(payload)}`
        : `meeting action add ${meetingId} ${JSON.stringify(payload)}`
      return settle(deps, cmd)
    },
    onPromoteAction: async (meetingId, actionId) => {
      const allowed = await deps.confirm({
        title: '行动项转任务？',
        message: '将把该会议行动项提升为正式任务（已转则不会重复建）。',
        confirmLabel: '确认转换',
      })
      if (!allowed) return false
      return settle(deps, `meeting action promote ${meetingId} ${actionId} confirm`)
    },
    onDeleteAction: async (meetingId, actionId) => {
      const allowed = await deps.confirm({
        title: '删除行动项？',
        message: '将删除该会议行动项。',
        confirmLabel: '确认删除',
      })
      if (!allowed) return false
      return settle(deps, `meeting action delete ${meetingId} ${actionId} confirm`)
    },
    onSaved: () => deps.refresh(),
  }
}

export function createReportCallbacks(deps: RecordActionDeps): ReportCallbacks {
  // 每次新预览中止上一次在途请求（stale 丢弃，不回写）；同一回调闭包内复用 controller。
  let pending: AbortController | undefined
  const preview = deps.previewAvailable
    ? {
        onPreviewPeriod: async (
          projectId: string,
          periodStart: string,
          periodEnd: string,
        ): Promise<ReportPreviewCandidate[]> => {
          pending?.abort()
          const controller = new AbortController()
          pending = controller
          const getter = deps.fetchPreview ?? fetchReportPreview
          try {
            return await getter({ projectId, periodStart, periodEnd, signal: controller.signal })
          } catch (err) {
            // 自己中止的 stale 请求静默返回空（表单 cancelled 也会忽略），不把 AbortError 当预览错误。
            if (controller.signal.aborted) return []
            throw err
          }
        },
      }
    : {}
  return {
    ...preview,
    onGeneratePeriod: async (projectId, start, end, payload: ReportPayload, selectedRefs: ReportPreviewRef[]) => {
      const options = { ...payload, selectedRefs }
      return settle(deps, `report generate ${projectId} ${start} ${end} ${JSON.stringify(options)}`)
    },
    onUpdateReport: async (reportId, payload: ReportPayload) =>
      settle(deps, `report update ${reportId} ${JSON.stringify(payload)}`),
    onDeleteReport: async (reportId) => {
      const allowed = await deps.confirm({
        title: '删除报告？',
        message: '将删除该周期报告，此操作不可撤销。',
        confirmLabel: '确认删除',
      })
      if (!allowed) return false
      return settle(deps, `report delete ${reportId} confirm`)
    },
    onExportReport: (reportId) => {
      // fire-and-forget：导出 Markdown，不关层、不阻断。
      void deps.run(`report export ${reportId}`)
    },
    onSaved: () => deps.refresh(),
  }
}

export function createDeliverableCallbacks(deps: RecordActionDeps): DeliverableCallbacks {
  return {
    onSaveDeliverable: async (projectId, deliverableId, payload: DeliverablePayload) => {
      const cmd = deliverableId
        ? `deliverable update ${deliverableId} ${JSON.stringify(payload)}`
        : `deliverable add ${JSON.stringify({ projectId, ...payload })}`
      return settle(deps, cmd)
    },
    onViewStatusHistory: () => {
      // 只读留痕由视图展开 deliverable.history，无需命令。
    },
    onDeleteDeliverable: async (deliverableId) => {
      const allowed = await deps.confirm({
        title: '删除交付物？',
        message: '将删除该交付物记录（不删本地文件）。',
        confirmLabel: '确认删除',
      })
      if (!allowed) return false
      return settle(deps, `deliverable delete ${deliverableId} confirm`)
    },
    onSaved: () => deps.refresh(),
  }
}

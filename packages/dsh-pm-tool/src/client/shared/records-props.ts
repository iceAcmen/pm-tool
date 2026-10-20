/**
 * B6 records 分片（meetings / reports / deliverables）与 panel 的 props 契约（前端 owner 冻结）。
 *
 * 说明：
 * - 本文件只定义回调签名与 payload 结构，命令行由 panel 内实现；records 组件 import 类型做 TDD，
 *   不自行拼命令、不 localmock 写操作。
 * - 写操作全部返回 Promise<boolean>（run 成功与否），成功后由 panel 触发刷新/onSaved。
 * - onPreviewPeriod 返回候选三元组（author/date/content/refs），onGeneratePeriod 带复合
 *   selectedRefs（taskId/entryId/revisionId）；源已变由后端报 error 零写，前端须重预览，不丢版本。
 * - P3 已存报告摘录 freeze 即止；不扩 report revisions/restore。
 */

/* ------------------------------ 通用 ------------------------------ */

export type RunResult = Promise<boolean>

/** 刷新回调（panel 在写成功后调用，等价既有 onSaved）。 */
export type OnSaved = () => void

/* ------------------------------ Meetings ------------------------------ */

export interface MeetingActionPayload {
  title: string
  owner: string
  dueDate: string | null
  status: 'todo' | 'in_progress' | 'done' | 'cancelled'
  taskId: string | null
  riskIssueId: string | null
}

export interface MeetingPayload {
  title: string
  meetingDate: string
  startTime: string | null
  durationMinutes: number | null
  location: string
  facilitator: string
  recorder: string
  participants: string[]
  status: 'draft' | 'final'
  summary: string
  topics: string[]
  decisions: string[]
  notes: string
}

export interface MeetingActionCallbacks {
  /** 新增：`meeting action add {meetingId} {json}`；编辑：`meeting action update {meetingId} {actionId} {json}`。 */
  onSaveAction: (meetingId: string, actionId: string | null, payload: MeetingActionPayload) => RunResult
  /** `meeting action promote {meetingId} {actionId} confirm`（行动项转任务，已转则不再建）。 */
  onPromoteAction: (meetingId: string, actionId: string) => RunResult
  /** `meeting action delete {meetingId} {actionId} confirm`。 */
  onDeleteAction: (meetingId: string, actionId: string) => RunResult
}

export interface MeetingCallbacks extends MeetingActionCallbacks {
  /** 新增：`meeting add {projectId,...payload}`；编辑：`meeting update {meetingId} {payload}`。 */
  onSaveMeeting: (projectId: string, meetingId: string | null, payload: MeetingPayload) => RunResult
  /** `meeting delete {meetingId} confirm`。 */
  onDeleteMeeting: (meetingId: string) => RunResult
  onSaved: OnSaved
}

/* ------------------------------ Reports ------------------------------ */

export interface ReportPayload {
  title?: string
  status: 'draft' | 'final'
  executiveSummary: string
  completedWork: string[]
  nextPlans: string[]
  blockers: string[]
  /** U5：报告来源类型（manual 手工 / session 会话），可选透传后端。 */
  sourceType?: 'manual' | 'session'
  /** U5：来源会话/会话段 id（如 sessionId），可选，可空。 */
  sourceSessionId?: string | null
}

/**
 * B6 复合来源引用（取代旧 selectedEntryIds 纯条目 id；旧 strict 直接拒）。
 * task 下各 pl-1 条目可同时选；revisionId 可选，生成时原样回传，不丢版本。
 */
export interface ReportPreviewRef {
  taskId: string
  entryId: string
  revisionId?: string
}

/** onPreviewPeriod 返回的候选三元组（author/date/content/refs）；未传 selector = all。 */
export interface ReportPreviewCandidate {
  taskId: string
  entryId: string
  revisionId?: string
  author: string
  date: string
  content: string
  refs: ReportPreviewRef[]
  taskTitle?: string
}

export interface ReportCallbacks {
  /**
   * 只读 dry-run 周期预览：`onPreviewPeriod(projectId,start,end)` 返回候选三元组数组（非 boolean）；
   * 未传 selector = all。后端源已变会报 error 零写，要求重新预览，不得 drop revisionId 偷保存。
   */
  onPreviewPeriod?: (
    projectId: string,
    periodStart: string,
    periodEnd: string,
  ) => Promise<ReportPreviewCandidate[]>
  /**
   * 生成固定快照：`report generate {projectId} {periodStart} {periodEnd} {json}`；
   * selectedRefs 为所选三元组（含 revisionId），panel 原样透传，不裸 pl-N、不丢版本。
   */
  onGeneratePeriod: (
    projectId: string,
    periodStart: string,
    periodEnd: string,
    payload: ReportPayload,
    selectedRefs: ReportPreviewRef[],
  ) => RunResult
  /** `report update {reportId} {json}`（周期不可改）。 */
  onUpdateReport: (reportId: string, payload: ReportPayload) => RunResult
  /** `report delete {reportId} confirm`。 */
  onDeleteReport: (reportId: string) => RunResult
  /** `report export {reportId}`（导出 Markdown，fire-and-forget）。 */
  onExportReport: (reportId: string) => void
  /**
   * 已存报告摘录 freeze 的来源条目选择器（data sourceExcerpt）；仅选择/冻结，
   * 不实现 report revisions/restore。用复合 selectedRefs，取代旧 selectedEntryIds。
   */
  onSnapshotSelection?: (reportId: string, selectedRefs: ReportPreviewRef[]) => RunResult
  onSaved: OnSaved
}

/* ------------------------------ Deliverables ------------------------------ */

export interface DeliverablePayload {
  name: string
  version: string
  owner: string
  status: 'planned' | 'in_progress' | 'submitted' | 'accepted' | 'wrapped'
  location: string
  description: string
  dueDate: string | null
  changeNote?: string
  repoUrl: string
  branch: string
  /** U5：关联里程碑 id（可选，可为 null 表示解除关联）。 */
  milestoneId?: string | null
  /** U5：备注/说明（可选，区别于 description）。 */
  note?: string
}

export interface DeliverableCallbacks {
  /** 新增：`deliverable add {projectId,...payload}`；编辑：`deliverable update {deliverableId} {payload}`。 */
  onSaveDeliverable: (projectId: string, deliverableId: string | null, payload: DeliverablePayload) => RunResult
  /**
   * 状态/版本留痕只读展示（deliverable.history，field=created|status|version，from→to）；
   * 状态变更走 onSaveDeliverable 的 payload.status + changeNote，无独立 status 命令。
   */
  onViewStatusHistory: (deliverableId: string) => void
  /** `deliverable delete {deliverableId} confirm`（不删本地文件）。 */
  onDeleteDeliverable: (deliverableId: string) => RunResult
  onSaved: OnSaved
}

/** records 视图一次性拿到的全部回调（panel 在挂载时注入，分片不并写 panel）。 */
export interface RecordsPanelCallbacks {
  meetings: MeetingCallbacks
  reports: ReportCallbacks
  deliverables: DeliverableCallbacks
}

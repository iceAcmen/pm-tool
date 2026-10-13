/**
 * PROD-10：任务 ← 会议行动项反向来源（纯函数，无 React/无 DOM/无写，可离线单测）。
 *
 * 行动项 promote/关联后会把 taskId 回写到 meeting.actions[].taskId。本模块在前端
 * snapshot 的 meetings 数组上反查「某任务来自哪些会议行动项」，从而在任务抽屉里
 * 展示只读来源链接。不落库、不改 task schema（taskRecordSchema 为 strictObject）。
 */

export interface MeetingSourceAction {
  id: string
  title: string
  taskId?: string | null
}

export interface MeetingSourceMeeting {
  id: string
  projectId?: string
  title: string
  meetingDate: string
  actions: MeetingSourceAction[]
}

export interface MeetingSourceRef {
  meetingId: string
  projectId: string
  meetingTitle: string
  meetingDate: string
  actionId: string
  actionTitle: string
}

/**
 * 汇总某任务在全部会议中的来源行动项。
 * 排序口径：meetingDate 倒序 → 会议 id 数字倒序 → 同一会议内行动项出现顺序稳定
 * （依赖 Array.prototype.sort 的稳定性）。前端取 [0] 为主来源，其余作「另 N 场」提示。
 */
export function findMeetingSources(
  meetings: MeetingSourceMeeting[],
  taskId: string,
): MeetingSourceRef[] {
  const refs: MeetingSourceRef[] = []
  for (const meeting of meetings) {
    for (const action of meeting.actions) {
      if (action.taskId === taskId) {
        refs.push({
          meetingId: meeting.id,
          projectId: meeting.projectId ?? '',
          meetingTitle: meeting.title,
          meetingDate: meeting.meetingDate,
          actionId: action.id,
          actionTitle: action.title,
        })
      }
    }
  }
  refs.sort((a, b) =>
    b.meetingDate.localeCompare(a.meetingDate)
    || b.meetingId.localeCompare(a.meetingId, 'en', { numeric: true }),
  )
  return refs
}

/** 排定后的主来源；无引用返回 null（前端据此不渲染链接）。 */
export function pickPrimarySource(refs: MeetingSourceRef[]): MeetingSourceRef | null {
  return refs[0] ?? null
}

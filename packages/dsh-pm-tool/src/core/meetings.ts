/** 会议纪要与内嵌行动项 CRUD，跨表引用与写入共享领域业务队列。 */
import {
  meetingActionCreateSchema,
  meetingActionIdSchema,
  meetingActionUpdateSchema,
  meetingCreateSchema,
  meetingIdSchema,
  meetingRecordSchema,
  meetingStatusSchema,
  meetingUpdateSchema,
  normalizeTextList,
  type Meeting,
  type MeetingAction,
  type MeetingActionUpdate,
  type MeetingStatus,
  type MeetingUpdate,
} from './meeting.js'
import { projectIdSchema } from './project.js'
import { enqueueDomainWrite } from './projects.js'
import type { PmDomain } from './storage.js'

export class MeetingProjectNotFoundError extends Error {}
export class MeetingRelationNotFoundError extends Error {}
export class MeetingRelationMismatchError extends Error {}
export class MeetingActionNotFoundError extends Error {}

function validateActionRelations(
  domain: PmDomain,
  projectId: string,
  action: Pick<MeetingAction, 'taskId' | 'riskIssueId'>,
): void {
  if (action.taskId) {
    const task = domain.table('tasks').get(action.taskId)
    if (!task) throw new MeetingRelationNotFoundError(`未找到任务：${action.taskId}`)
    if (task.projectId !== projectId) throw new MeetingRelationMismatchError('任务不属于会议项目')
  }
  if (action.riskIssueId) {
    const issue = domain.table('risk_issues').get(action.riskIssueId)
    if (!issue) throw new MeetingRelationNotFoundError(`未找到问题：${action.riskIssueId}`)
    if (issue.projectId !== projectId) throw new MeetingRelationMismatchError('问题不属于会议项目')
    if (issue.type !== 'issue') throw new MeetingRelationMismatchError('会议行动项只能关联问题，不能关联风险')
  }
}

function normalizedMeetingFields<T extends {
  participants?: string[]
  topics?: string[]
  decisions?: string[]
}>(fields: T): T {
  return {
    ...fields,
    ...(fields.participants ? { participants: normalizeTextList(fields.participants) } : {}),
    ...(fields.topics ? { topics: normalizeTextList(fields.topics) } : {}),
    ...(fields.decisions ? { decisions: normalizeTextList(fields.decisions) } : {}),
  }
}

export function addMeeting(domain: PmDomain, input: unknown): Promise<Meeting> {
  const fields = normalizedMeetingFields(meetingCreateSchema.parse(input))
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(fields.projectId)) {
      throw new MeetingProjectNotFoundError(`未找到项目：${fields.projectId}`)
    }
    const table = domain.table('meetings')
    let max = 0n
    for (const key of table.keys()) {
      const match = /^mtg-(\d+)$/.exec(key)
      if (match && BigInt(match[1]) > max) max = BigInt(match[1])
    }
    const id = `mtg-${String(max + 1n).padStart(4, '0')}`
    const at = new Date().toISOString()
    const record = meetingRecordSchema.parse({
      ...fields,
      id,
      actions: [],
      sourceType: 'manual',
      sourceSessionId: null,
      createdAt: at,
      updatedAt: at,
    })
    await table.put(id, record)
    return structuredClone(record)
  })
}

export function listMeetings(
  domain: PmDomain,
  projectId: string,
  status?: MeetingStatus,
): Meeting[] {
  projectIdSchema.parse(projectId)
  if (status) meetingStatusSchema.parse(status)
  if (!domain.table('projects').get(projectId)) {
    throw new MeetingProjectNotFoundError(`未找到项目：${projectId}`)
  }
  return [...domain.table('meetings').entries()]
    .map(([, meeting]) => meeting)
    .filter(meeting => meeting.projectId === projectId && (!status || meeting.status === status))
    .sort((left, right) =>
      right.meetingDate.localeCompare(left.meetingDate)
      || right.id.localeCompare(left.id, 'en', { numeric: true }),
    )
    .map(meeting => structuredClone(meeting))
}

export function getMeeting(domain: PmDomain, id: string): Meeting | undefined {
  meetingIdSchema.parse(id)
  const meeting = domain.table('meetings').get(id)
  return meeting ? structuredClone(meeting) : undefined
}

export function updateMeeting(domain: PmDomain, id: string, input: unknown): Promise<Meeting | undefined> {
  meetingIdSchema.parse(id)
  const fields: MeetingUpdate = normalizedMeetingFields(meetingUpdateSchema.parse(input))
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('meetings')
    const current = table.get(id)
    if (!current) return undefined
    const next = meetingRecordSchema.parse({
      ...current,
      ...fields,
      id: current.id,
      projectId: current.projectId,
      actions: current.actions,
      sourceType: current.sourceType,
      sourceSessionId: current.sourceSessionId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}

export function deleteMeeting(domain: PmDomain, id: string): Promise<Meeting | undefined> {
  meetingIdSchema.parse(id)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('meetings')
    const current = table.get(id)
    if (!current) return undefined
    await table.delete(id)
    return structuredClone(current)
  })
}

export function addMeetingAction(domain: PmDomain, meetingId: string, input: unknown): Promise<MeetingAction> {
  meetingIdSchema.parse(meetingId)
  const fields = meetingActionCreateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('meetings')
    const current = table.get(meetingId)
    if (!current) throw new MeetingActionNotFoundError(`未找到会议：${meetingId}`)
    validateActionRelations(domain, current.projectId, fields)
    let max = 0
    for (const action of current.actions) {
      const match = /^ai-(\d+)$/.exec(action.id)
      if (match) max = Math.max(max, Number(match[1]))
    }
    const action = meetingActionCreateSchema.extend({ id: meetingActionIdSchema }).parse({
      ...fields,
      id: `ai-${String(max + 1).padStart(3, '0')}`,
    })
    const next = meetingRecordSchema.parse({
      ...current,
      actions: [...current.actions, action],
      updatedAt: new Date().toISOString(),
    })
    await table.put(meetingId, next)
    return structuredClone(action)
  })
}

export function updateMeetingAction(
  domain: PmDomain,
  meetingId: string,
  actionId: string,
  input: unknown,
): Promise<MeetingAction | undefined> {
  meetingIdSchema.parse(meetingId)
  meetingActionIdSchema.parse(actionId)
  const fields: MeetingActionUpdate = meetingActionUpdateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('meetings')
    const current = table.get(meetingId)
    if (!current) throw new MeetingActionNotFoundError(`未找到会议：${meetingId}`)
    const index = current.actions.findIndex(action => action.id === actionId)
    if (index < 0) return undefined
    const action = meetingActionCreateSchema.extend({ id: meetingActionIdSchema }).parse({
      ...current.actions[index],
      ...fields,
      id: actionId,
    })
    validateActionRelations(domain, current.projectId, action)
    const actions = current.actions.map((item, itemIndex) => itemIndex === index ? action : item)
    await table.put(meetingId, meetingRecordSchema.parse({
      ...current,
      actions,
      updatedAt: new Date().toISOString(),
    }))
    return structuredClone(action)
  })
}

export function deleteMeetingAction(
  domain: PmDomain,
  meetingId: string,
  actionId: string,
): Promise<MeetingAction | undefined> {
  meetingIdSchema.parse(meetingId)
  meetingActionIdSchema.parse(actionId)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('meetings')
    const current = table.get(meetingId)
    if (!current) throw new MeetingActionNotFoundError(`未找到会议：${meetingId}`)
    const action = current.actions.find(item => item.id === actionId)
    if (!action) return undefined
    await table.put(meetingId, meetingRecordSchema.parse({
      ...current,
      actions: current.actions.filter(item => item.id !== actionId),
      updatedAt: new Date().toISOString(),
    }))
    return structuredClone(action)
  })
}

export function findMeetingActionByTask(domain: PmDomain, taskId: string): { meeting: Meeting, action: MeetingAction } | undefined {
  for (const [, meeting] of domain.table('meetings').entries()) {
    const action = meeting.actions.find(item => item.taskId === taskId)
    if (action) return { meeting: structuredClone(meeting), action: structuredClone(action) }
  }
  return undefined
}

export function findMeetingActionByRiskIssue(domain: PmDomain, riskIssueId: string): { meeting: Meeting, action: MeetingAction } | undefined {
  for (const [, meeting] of domain.table('meetings').entries()) {
    const action = meeting.actions.find(item => item.riskIssueId === riskIssueId)
    if (action) return { meeting: structuredClone(meeting), action: structuredClone(action) }
  }
  return undefined
}

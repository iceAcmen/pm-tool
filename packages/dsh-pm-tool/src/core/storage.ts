/** 单一 pmtool 领域：所有入口复用同一声明，逐步增加业务表。 */
import type { Context } from '@deepseek-ai/cordis'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'
import { projectRecordSchema } from './project.js'
import { taskRecordSchema } from './task.js'
import { milestoneRecordSchema } from './milestone.js'
import { riskIssueRecordSchema } from './risk-issue.js'
import { meetingRecordSchema } from './meeting.js'
import { progressReportRecordSchema } from './progress-report.js'
import { deliverableRecordSchema } from './deliverable.js'

export const checkRecordSchema = z.object({
  ok: z.boolean(),
  at: z.string(),
  note: z.string(),
})

/** 自由键值设置表（如 AI 车道模式 aiModelMode）；passthrough 容纳后续小开关。 */
export const settingRecordSchema = z.object({
  value: z.unknown(),
  updatedAt: z.string(),
}).passthrough()

/** K9 会话结存：任务 ↔ 会话绑定 + 结存摘要（单向结存，非镜像）。 */
export const sessionRecordSchema = z.object({
  id: z.string().regex(/^session-[a-zA-Z0-9_-]+$/, '会话绑定 ID 只能包含字母、数字、下划线和连字符'),
  projectId: z.string(),
  taskId: z.string(),
  sessionId: z.string(),
  note: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type SessionRecord = z.infer<typeof sessionRecordSchema>

/** X6-L1 即时复盘草稿：克制文本，句级已核/待核/留白，无积分/连胜/徽章。 */
export const reflectionRecordSchema = z.object({
  id: z.string().regex(/^ref-[a-zA-Z0-9_-]+$/, '复盘 ID 只能包含字母、数字、下划线和连字符'),
  projectId: z.string(),
  taskId: z.string().optional(),
  /** X6-L2：里程碑达成/交付验收复盘草稿的关联实体（L1 任务草稿不填）。 */
  milestoneId: z.string().optional(),
  deliverableId: z.string().optional(),
  status: z.enum(['draft', 'final']),
  sourceEvent: z.enum(['task-done', 'milestone-achieved', 'deliverable-accepted']),
  draft: z.object({
    title: z.string(),
    at: z.iso.datetime(),
    lines: z.array(z.object({
      text: z.string(),
      mark: z.enum(['known', 'pending', 'blank']),
    })),
    gaps: z.array(z.string()),
  }),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type ReflectionRecord = z.infer<typeof reflectionRecordSchema>

export const pmDomainSpec = defineDomain({
  name: 'pmtool',
  // v0.6.0 schema v2：本版读 v1 时代记录（compatibleVersions 含 1），写入一律打 v2 信封。
  // 新增业务字段（task.predecessorIds / project.repoUrl·branch）在各自 record schema 中声明为 optional，
  // 即 v1 旧记录缺这些键也能被本 schema 接受；不做批量迁移重写。
  version: 2,
  compatibleVersions: [1],
  layout: 'per-record',
  tables: {
    checks: domainTable(checkRecordSchema),
    settings: domainTable(settingRecordSchema),
    projects: domainTable(projectRecordSchema),
    tasks: domainTable(taskRecordSchema),
    milestones: domainTable(milestoneRecordSchema),
    risk_issues: domainTable(riskIssueRecordSchema),
    meetings: domainTable(meetingRecordSchema),
    reports: domainTable(progressReportRecordSchema),
    deliverables: domainTable(deliverableRecordSchema),
    sessions: domainTable(sessionRecordSchema),
    reflections: domainTable(reflectionRecordSchema),
  },
})

export function openPmDomain(ctx: Context) {
  return ctx.storageDomain.open(pmDomainSpec)
}

export type PmDomain = Awaited<ReturnType<typeof openPmDomain>>

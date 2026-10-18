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

/** P2 X7 愿景/OKR 层：独立实体。单父 primaryOkrId 主归属（权重只认这一条），软关联「关联目标」行可见不计权重；草稿/定稿复用 X6 机制；习惯层（每日补记/66 天窗口/streak）不在本期（P3）。 */
export const okrRecordSchema = z.object({
  id: z.string().regex(/^okr-[a-zA-Z0-9_-]+$/, 'OKR ID 只能包含字母、数字、下划线和连字符'),
  projectId: z.string(),
  title: z.string().min(1, 'OKR 标题不能为空'),
  kind: z.enum(['objective', 'key-result']),
  /** 单父主归属：KR 的父 OKR，权重归属只认这一条；objective 为 null。 */
  primaryOkrId: z.string().nullable(),
  /** 软关联「关联目标」：可见不计权重。 */
  relatedOkrIds: z.array(z.string()).default([]),
  owner: z.string().optional(),
  targetDate: z.iso.date().optional(),
  /** 草稿/定稿复用 X6 机制：draft→confirmed 由人触发；ignored 仅用于收件区建议。 */
  status: z.enum(['draft', 'confirmed']).default('draft'),
  /** K11 周期触发接线点（类型预留，本期不实现周期调度）。 */
  cycleDue: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type OkrRecord = z.infer<typeof okrRecordSchema>

/** P2 X3 失败经验：失败/烂尾条目的经验沉淀。句级 known/pending/blank，证据不足留白不编造（复用 X6 草稿纪律）；仅人定稿。 */
export const lessonRecordSchema = z.object({
  id: z.string().regex(/^lesson-[a-zA-Z0-9_-]+$/, '经验记录 ID 只能包含字母、数字、下划线和连字符'),
  projectId: z.string(),
  /** 关联失败/烂尾任务，可空。 */
  taskId: z.string().optional(),
  status: z.enum(['draft', 'final']).default('draft'),
  lines: z.array(z.object({
    text: z.string(),
    mark: z.enum(['known', 'pending', 'blank']),
  })),
  gaps: z.array(z.string()).default([]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type LessonRecord = z.infer<typeof lessonRecordSchema>

/**
 * P3 X7 习惯层：会话派生习惯（轻确认/2 天补记窗回填）+ streak 连续段档案。
 * 克制清单延续：无积分/连胜动效/徽章，仅文本归档；断签超窗当前 streak 重置 0，
 * longest/totalDays 累计档案永久保留；草稿/定稿复用 X6（draft→confirmed→final 仅人触发）；
 * cycleDue 为 K11 周期触发接线点（类型预留，本期不实现调度）。
 */
export const habitRecordSchema = z.object({
  id: z.string().regex(/^habit-[a-zA-Z0-9_-]+$/, '习惯 ID 只能包含字母、数字、下划线和连字符'),
  projectId: z.string(),
  /** 可选关联 P2 愿景/OKR 层实体（同项目校验）。 */
  okrId: z.string().optional(),
  title: z.string().min(1, '习惯标题不能为空'),
  status: z.enum(['draft', 'confirmed', 'final']).default('draft'),
  checkIns: z.array(z.object({
    at: z.iso.date(),
    /** 2 天补记窗回填标记（补记仍计入连续，但如实标注）。 */
    backfilled: z.boolean().default(false),
    note: z.string().optional(),
  })).default([]),
  streak: z.object({
    current: z.number().int().min(0).default(0),
    lastDate: z.string().optional(),
    /** 累计档案永久保留：断签重置只影响 current，不清 longest/totalDays。 */
    longest: z.number().int().min(0).default(0),
    totalDays: z.number().int().min(0).default(0),
  }).default({ current: 0, longest: 0, totalDays: 0 }),
  /** K11 周期触发接线点（类型预留，不实现调度器）。 */
  cycleDue: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type HabitRecord = z.infer<typeof habitRecordSchema>

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
    okrs: domainTable(okrRecordSchema),
    lessons: domainTable(lessonRecordSchema),
    habits: domainTable(habitRecordSchema),
  },
})

export function openPmDomain(ctx: Context) {
  return ctx.storageDomain.open(pmDomainSpec)
}

export type PmDomain = Awaited<ReturnType<typeof openPmDomain>>

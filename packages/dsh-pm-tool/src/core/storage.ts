/** 单一 pmtool 领域：所有入口复用同一声明，逐步增加业务表。 */
import type { Context } from '@deepseek-ai/cordis'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'
import { projectRecordSchema } from './project.js'
import { taskRecordSchema } from './task.js'
import { milestoneRecordSchema } from './milestone.js'

export const checkRecordSchema = z.object({
  ok: z.boolean(),
  at: z.string(),
  note: z.string(),
})

export const pmDomainSpec = defineDomain({
  name: 'pmtool',
  // 只增加表，既有 checks 记录格式不变，继续读取版本 1。
  version: 1,
  layout: 'per-record',
  tables: {
    checks: domainTable(checkRecordSchema),
    projects: domainTable(projectRecordSchema),
    tasks: domainTable(taskRecordSchema),
    milestones: domainTable(milestoneRecordSchema),
  },
})

export function openPmDomain(ctx: Context) {
  return ctx.storageDomain.open(pmDomainSpec)
}

export type PmDomain = Awaited<ReturnType<typeof openPmDomain>>

import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { taskRecordSchema } from '../../packages/dsh-pm-tool/src/core/task.js'
import { milestoneWriteSchema } from '../../packages/dsh-pm-tool/src/core/milestone.js'
import { riskIssueWriteSchema } from '../../packages/dsh-pm-tool/src/core/risk-issue.js'
import { deliverableRecordSchema } from '../../packages/dsh-pm-tool/src/core/deliverable.js'
import { meetingRecordSchema } from '../../packages/dsh-pm-tool/src/core/meeting.js'

const input = JSON.parse(readFileSync(process.env.PC_INPUT!, 'utf8'))
it('OX01 原PC初态/外改八个扩展合法且属于当前项目，任务原base不替换', () => {
  const rows = [
    ['milestones', ['m-0001', 'm-0002'], milestoneWriteSchema],
    ['riskIssues', ['ri-0001', 'ri-0002'], riskIssueWriteSchema],
    ['deliverables', ['dlv-0001', 'dlv-0002'], deliverableRecordSchema],
    ['meetings', ['mtg-0001', 'mtg-0002'], meetingRecordSchema],
  ] as const
  for (const state of ['initial', 'external']) {
    for (const [table, ids, schema] of rows) {
      expect(input[state][table].map((r: any) => r.id).sort()).toEqual([...ids].sort())
      for (const r of input[state][table]) {
        expect(schema.safeParse(r).success, `${state} ${table} ${r.id}`).toBe(true)
        expect(r.projectId).toBe('p-0001')
        expect(r.updatedAt).toBe(input.initial[table].find((v: any) => v.id === r.id).updatedAt)
      }
    }
    for (const t of input[state].tasks) expect(taskRecordSchema.safeParse(t).success).toBe(true)
  }
  expect(input.initial.tasks.find((r: any) => r.id === 't-0001').updatedAt).not.toBe(
    input.external.tasks.find((r: any) => r.id === 't-0001').updatedAt)
})

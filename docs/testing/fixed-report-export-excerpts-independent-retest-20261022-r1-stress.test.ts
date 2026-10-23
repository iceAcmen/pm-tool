import { expect, it } from 'vitest'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { progressReportRecordSchema, type ProgressReport } from './src/core/progress-report.js'
import { renderProgressReportMarkdown } from './src/core/progress-report-markdown.js'

it('合法未限长作者含大量反引号段，renderer 不应以参数溢出拒绝整个冻结报告', () => {
  let report: ProgressReport | undefined
  for (const dir of readdirSync(process.env.R1_RAW_TMP!)) {
    try {
      report = JSON.parse(readFileSync(join(process.env.R1_RAW_TMP!, dir, 'frozen-before.json'), 'utf8')).fixed
      if (report) break
    } catch { /* Original pure-render cases have no persisted fixture. */ }
  }
  expect(report).toBeDefined()
  report!.excerpts = [report!.excerpts![0]]
  report!.excerpts![0].author = 'AUTHOR_START ' + '`x'.repeat(150000) + ' AUTHOR_END'
  const legal = progressReportRecordSchema.parse(report)
  let result: string | undefined
  let caught: unknown
  try { result = renderProgressReportMarkdown(legal) } catch (error) { caught = error }
  writeFileSync(join(process.env.R1_PROBE_OUTPUT!, 'author-stress.json'), JSON.stringify({
    authorLength: legal.excerpts![0].author.length, backtickRuns: 150000,
    frozenSchemaAccepted: true, report: legal, returnedBytes: result ? Buffer.byteLength(result) : null,
    caught: caught instanceof Error ? { name: caught.name, message: caught.message, stack: caught.stack } : caught ?? null,
  }, null, 2), { flag: 'wx' })
  expect(caught, '已合法冻结的来源字段不应使整个导出抛 RangeError').toBeUndefined()
  expect(result).toContain(legal.excerpts![0].author)
  expect(result).toContain(legal.excerpts![0].contentSnapshot)
})

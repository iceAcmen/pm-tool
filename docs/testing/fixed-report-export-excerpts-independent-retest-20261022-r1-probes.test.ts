import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderProgressReportMarkdown } from './src/core/progress-report-markdown.js'
import { renderProgressReportMarkdown as legacyRender } from './src/core/retest-legacy-renderer.js'
import { progressReportRecordSchema, type ProgressReport } from './src/core/progress-report.js'
import { parseMarkdownBlocks } from './src/client/shared/markdown.js'

const raw = process.env.R1_RAW_TMP!
const output = process.env.R1_PROBE_OUTPUT!
function fixture(sourceType: 'manual' | 'session'): ProgressReport {
  for (const dir of readdirSync(raw)) {
    try {
      const file = JSON.parse(readFileSync(join(raw, dir, 'frozen-before.json'), 'utf8'))
      if (file.fixed.sourceType === sourceType) return progressReportRecordSchema.parse(file.fixed)
    } catch { /* Other original cases have no persisted fixture. */ }
  }
  throw new Error(`missing original legal fixture: ${sourceType}`)
}
function save(name: string, value: unknown) {
  writeFileSync(join(output, `${name}.json`), JSON.stringify(value, null, 2), { flag: 'wx' })
}
function hrefs(value: unknown): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap(hrefs)
  const node = value as Record<string, unknown>
  return [...(typeof node.href === 'string' ? [node.href] : []), ...Object.values(node).flatMap(hrefs)]
}

describe('R1 supplemental: archived old output and frozen literal boundary', () => {
  it.each(['missing', 'empty'] as const)('excerpts=%s equals archived old renderer byte-for-byte, both source types', shape => {
    for (const sourceType of ['manual', 'session'] as const) {
      const report = fixture(sourceType)
      if (shape === 'missing') delete report.excerpts
      else report.excerpts = []
      const original = JSON.stringify(report)
      const current = renderProgressReportMarkdown(report)
      const legacy = legacyRender(report)
      expect(Buffer.from(current).equals(Buffer.from(legacy))).toBe(true)
      expect(JSON.stringify(report)).toBe(original)
      expect(current).not.toContain('## 冻结进展摘录')
      save(`legacy-${shape}-${sourceType}`, { report, current, legacy, exactBytesEqual: true })
    }
  })

  it.each([0, 3, 17, 1800])('internal backtick run %i: complete six fields stay within a longer fence', run => {
    const report = fixture('session')
    report.excerpts = [report.excerpts![0]]
    const excerpt = report.excerpts[0]
    excerpt.author = 'AUTHOR_BOUNDARY\n```text\nAUTHOR_END'
    excerpt.contentSnapshot = [
      'BODY_BEGIN', '`'.repeat(run), '| CELL_A | CELL_B |', '| --- | --- |',
      'x\\y', '<script>SCRIPT_LITERAL</script>', '[DANGER](javascript:alert(1))', 'BODY_END',
    ].filter(Boolean).join('\n')
    const validated = progressReportRecordSchema.parse(report)
    const original = JSON.stringify(validated)
    const md = renderProgressReportMarkdown(validated)
    const section = md.slice(md.indexOf('### 摘录 1\n\n') + '### 摘录 1\n\n'.length)
    const fence = section.split('\n')[0]
    const frozen = [
      `任务：${excerpt.taskId} / 进展：${excerpt.entryId} / 修订：${excerpt.revisionId}`,
      `作者：${excerpt.author} / 日期：${excerpt.date}`, '', excerpt.contentSnapshot,
    ].join('\n')
    expect(fence).toMatch(/^`{3,}$/)
    expect(section.startsWith(`${fence}\n${frozen}\n${fence}\n`)).toBe(true)
    expect([...frozen.matchAll(/`+/g)].every(m => m[0].length < fence.length)).toBe(true)
    expect(md.split(excerpt.contentSnapshot).length - 1).toBe(1)
    expect(JSON.stringify(validated)).toBe(original)
    const ast = parseMarkdownBlocks(md)
    expect(hrefs(ast).filter(href => !/^https?:\/\//i.test(href))).toEqual([])
    save(`fence-${run}`, { validated, md, ast, fenceLength: fence.length,
      sixFieldBlock: frozen, exactLiteralBlockPresent: true })
  })
})

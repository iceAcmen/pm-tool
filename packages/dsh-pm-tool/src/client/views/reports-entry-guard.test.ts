import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const reports = readFileSync(join(here, 'reports.tsx'), 'utf8')
const panel = readFileSync(join(here, '..', 'panel.tsx'), 'utf8')

describe('B6 汇报创建入口统一接线', () => {
  it('顶栏生成快照触发页内新版表单，而不是旧 panel report 抽屉', () => {
    expect(panel).toContain("cta = { label: '生成快照', action: () => setReportCreateRequest(n => n + 1) }")
    expect(panel).toContain('createRequest={reportCreateRequest}')
    expect(panel).not.toContain("cta = { label: '生成快照', action: () => setDrawer({ kind: 'report' }) }")
  })

  it('新版表单从 records slot 或 callbacks 获取权威周期预览', () => {
    expect(reports).toContain('onPreviewPeriod={records.onPreviewPeriod ?? records.callbacks.onPreviewPeriod}')
    expect(reports).toContain("if (createRequest > 0) openCreate()")
  })

  it('详情页展示冻结摘录正文和复合版本来源', () => {
    expect(reports).toContain('冻结进展摘录 · Frozen progress')
    expect(reports).toContain('source={excerpt.contentSnapshot}')
    expect(reports).toContain('excerpt.taskId}/{excerpt.entryId}/{excerpt.revisionId')
  })
})

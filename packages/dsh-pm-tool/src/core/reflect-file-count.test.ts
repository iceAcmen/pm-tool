import { describe, expect, it } from 'vitest'
import { buildReflectionDraft } from './reflect.js'
import type { AttachmentItem, Task } from './task.js'

const AT = '2026-10-22T05:00:00.000Z'

function attachment(
  id: string,
  kind: 'file' | 'link' | 'deliverable',
  value: string,
): AttachmentItem {
  if (kind === 'file') return { id, kind, assetId: value, addedAt: AT }
  if (kind === 'link') return { id, kind, url: value, addedAt: AT }
  return { id, kind, deliverableId: value, addedAt: AT }
}

function draft(attachments: AttachmentItem[]) {
  return buildReflectionDraft({
    title: '文件材料复盘',
    description: '',
    completedDate: '2026-10-22',
    attachments,
  } as Pick<Task, 'title' | 'description' | 'completedDate' | 'evidenceUrl' | 'checklist' | 'deliverableId' | 'attachments'>, AT)
}

function materialsLine(attachments: AttachmentItem[]): string {
  return draft(attachments).lines.find(line => line.text.startsWith('资料区已登记：'))?.text ?? ''
}

describe('buildReflectionDraft 文件附件计数', () => {
  it('file-only 按附件项声明一个文件，保留人工质量复核且不产生缺材料 gap', () => {
    const result = draft([attachment('at-1', 'file', 'fa-1')])
    expect(materialsLine([attachment('at-1', 'file', 'fa-1')]))
      .toBe('资料区已登记：1 个文件（质量由人复核）')
    expect(result.gaps).toEqual([])
  })

  it('同一资产的两个附件仍按已登记附件项计为两个文件', () => {
    expect(materialsLine([
      attachment('at-1', 'file', 'fa-1'),
      attachment('at-2', 'file', 'fa-1'),
    ])).toBe('资料区已登记：2 个文件（质量由人复核）')
  })

  it('混合材料按链接、交付物、文件的既有顺序并列计数', () => {
    expect(materialsLine([
      attachment('at-1', 'link', 'https://example.com/evidence'),
      attachment('at-2', 'deliverable', 'dlv-1'),
      attachment('at-3', 'file', 'fa-1'),
    ])).toBe('资料区已登记：1 条链接、1 项交付物、1 个文件（质量由人复核）')
  })

  it('附件重排不改变各类型计数，也不虚构零数量', () => {
    const input = [
      attachment('at-1', 'file', 'fa-1'),
      attachment('at-2', 'link', 'https://example.com/a'),
      attachment('at-3', 'file', 'fa-2'),
      attachment('at-4', 'deliverable', 'dlv-1'),
      attachment('at-5', 'link', 'https://example.com/b'),
    ]
    const before = structuredClone(input)
    const expected = '资料区已登记：2 条链接、1 项交付物、2 个文件（质量由人复核）'

    expect(materialsLine(input)).toBe(expected)
    expect(materialsLine(input.toReversed())).toBe(expected)
    expect(input).toEqual(before)
    expect(expected).not.toContain('0 个文件')
  })

  it('没有 file 附件时保持原链接和交付物文案', () => {
    expect(materialsLine([
      attachment('at-1', 'link', 'https://example.com/evidence'),
      attachment('at-2', 'deliverable', 'dlv-1'),
    ])).toBe('资料区已登记：1 条链接、1 项交付物（质量由人复核）')
  })
})

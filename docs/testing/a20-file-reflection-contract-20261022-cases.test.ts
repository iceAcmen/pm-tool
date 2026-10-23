import { it, expect } from 'vitest'
import { appendFileSync, readFileSync } from 'node:fs'
import {
  buildReflectionDraft, ensureReflectionOnDone,
} from '../../packages/dsh-pm-tool/src/core/reflect.js'
import { taskHasMaterials } from '../../packages/dsh-pm-tool/src/core/task-materials.js'
import {
  taskWriteSchema, attachmentItemSchema, type Task, type AttachmentItem,
} from '../../packages/dsh-pm-tool/src/core/task.js'
import { reflectionRecordSchema, fileAssetRecordSchema, type PmDomain } from '../../packages/dsh-pm-tool/src/core/storage.js'

const replay = JSON.parse(readFileSync(process.env.FR_FIXTURE!, 'utf8'))
const originalTask = taskWriteSchema.parse(replay.task)
const originalReflection = reflectionRecordSchema.parse(replay.reflection)
const AT = '2026-10-22T00:27:13.179Z'
const GAP = '待补：交付验收材料与证据链接'
const materialLine = (draft: ReturnType<typeof buildReflectionDraft>) =>
  draft.lines.find(line => line.text.startsWith('资料区已登记：'))

function task(over: Partial<Task> = {}): Task {
  return taskWriteSchema.parse({
    id: 't-a20', projectId: 'p-0001', parentId: null, title: 'A20计数控制',
    description: '', assignee: '', status: 'done', priority: 'P1',
    completedDate: '2026-10-22', progress: 0, milestoneId: null,
    code: '1', order: 1, createdAt: AT, updatedAt: AT, ...over,
  })
}
function file(n: number): AttachmentItem {
  return attachmentItemSchema.parse({ id: `at-${n}`, kind: 'file', assetId: `fa-${n}`, addedAt: AT })
}
function link(n: number): AttachmentItem {
  return attachmentItemSchema.parse({ id: `at-${n}`, kind: 'link', url: `https://example.com/${n}`, addedAt: AT })
}
function dlv(n: number): AttachmentItem {
  return attachmentItemSchema.parse({ id: `at-${n}`, kind: 'deliverable', deliverableId: `dlv-${n}`,
    frozenVersion: 'v1', frozenName: '原有交付物引用', addedAt: AT })
}
function frozen<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) frozen(child)
    Object.freeze(value)
  }
  return value
}
function observe(id: string, input: Task, at = AT) {
  const before = structuredClone(input)
  const draft = buildReflectionDraft(frozen(input), at)
  expect(input).toEqual(before)
  appendFileSync(process.env.FR_OBSERVATIONS!, JSON.stringify({
    id, input, draft, hasMaterials: taskHasMaterials(input),
  }) + '\n')
  return draft
}
function counted(id: string, input: Task, expected: string[]) {
  const draft = observe(id, input)
  const line = materialLine(draft)!
  expect(line?.mark).toBe('known')
  expect(line?.text).toContain('（质量由人复核）')
  expect(draft.gaps).toEqual([])
  for (const part of expected) expect(line.text).toContain(part)
  return draft
}

it('FR-R01 原t3 file-only如实列1个文件', () => {
  counted('FR-R01', structuredClone(originalTask), ['1 个文件'])
})
it('FR-R02 两个文件只计已登记附件项', () => {
  counted('FR-R02', task({ attachments: [file(1), file(2)] }), ['2 个文件'])
})
it('FR-R03 混合link+deliverable+file不漏文件', () => {
  counted('FR-R03', task({ attachments: [link(1), dlv(2), file(3)] }),
    ['1 条链接', '1 项交付物', '1 个文件'])
})
it('FR-R04 多数量及重排仍属同一计数缺陷', () => {
  const items = [link(1), file(2), dlv(3), link(4), file(5)]
  const first = observe('FR-R04-order', task({ attachments: items }))
  const second = observe('FR-R04-reversed', task({ attachments: [...items].reverse() }))
  expect(materialLine(first)).toEqual(materialLine(second))
  const line = materialLine(first)!
  expect(line.text).toContain('2 条链接')
  expect(line.text).toContain('1 项交付物')
  expect(line.text).toContain('（质量由人复核）')
  expect(line.text).toContain('2 个文件')
})

it('FR-C01 原A18 t3不是空材料，实际错行与gaps空保原', () => {
  expect(originalTask.id).toBe('t-0003')
  expect(originalTask.attachments).toEqual([{
    id: 'at-1', kind: 'file', assetId: 'fa-0001', addedAt: '2026-10-21T13:44:55.172Z',
  }])
  expect(taskHasMaterials(originalTask)).toBe(true)
  expect(originalReflection).toMatchObject({ taskId: 't-0003', status: 'draft', sourceEvent: 'task-done' })
  expect(originalReflection.draft.gaps).toEqual([])
  expect(materialLine(originalReflection.draft)).toEqual({
    text: '资料区已登记：（质量由人复核）', mark: 'known',
  })
  expect(observe('FR-C01', structuredClone(originalTask), originalReflection.draft.at))
    .toEqual(originalReflection.draft)
})
it('FR-C02 真无材料缺省键留白', () => {
  const input = task()
  expect(taskHasMaterials(input)).toBe(false)
  const draft = observe('FR-C02', input)
  expect(draft.gaps).toEqual([GAP])
  expect(materialLine(draft)).toBeUndefined()
})
it('FR-C03 空附件和清单仍真无材料', () => {
  const input = task({ attachments: [], checklist: [], evidenceUrl: '', deliverableId: null })
  expect(taskHasMaterials(input)).toBe(false)
  const draft = observe('FR-C03', input)
  expect(draft.gaps).toEqual([GAP])
  expect(materialLine(draft)).toBeUndefined()
})
it('FR-C04 叙事progressLog不充完成材料', () => {
  const input = task({ progressLog: [{
    id: 'pl-1', date: '2026-10-22', author: 'A20', createdAt: AT,
    revisions: [{ id: 'rv-1', date: '2026-10-22', author: 'A20', content: '叙事记录', revisedAt: AT }],
  }] })
  expect(taskHasMaterials(input)).toBe(false)
  expect(observe('FR-C04', input).gaps).toEqual([GAP])
})
it('FR-C05 非空未勾清单保原材料谓词，不改done', () => {
  const input = task({ checklist: [{ id: 'a20-check', text: '待人工核对', done: false }] })
  expect(taskHasMaterials(input)).toBe(true)
  const draft = observe('FR-C05', input)
  expect(draft.gaps).toEqual([])
  expect(materialLine(draft)).toBeUndefined()
  expect(input.checklist![0].done).toBe(false)
})
it('FR-C06 旧evidenceUrl/deliverableId双读与原文本保', () => {
  const input = task({ evidenceUrl: 'https://example.com/evidence', deliverableId: 'dlv-1' })
  const draft = observe('FR-C06', input)
  expect(draft.gaps).toEqual([])
  expect(draft.lines).toContainEqual({ text: '已登记客观佐证链接（质量由人复核）', mark: 'known' })
  expect(draft.lines.some(line => line.text.includes('关联交付物 dlv-1'))).toBe(true)
  expect(materialLine(draft)).toBeUndefined()
})
it('FR-C07 无file混合资料原计数精确保，不造0文件', () => {
  const draft = observe('FR-C07', task({ attachments: [link(1), dlv(2)] }))
  expect(materialLine(draft)).toEqual({
    text: '资料区已登记：1 条链接、1 项交付物（质量由人复核）', mark: 'known',
  })
  expect(draft.gaps).toEqual([])
})
it('FR-C08 file材料谓词与人复核保，不误开gap', () => {
  const input = task({ attachments: [file(1)] })
  expect(taskHasMaterials(input)).toBe(true)
  const draft = observe('FR-C08', input)
  expect(draft.gaps).toEqual([])
  expect(materialLine(draft)!.text).toContain('（质量由人复核）')
})
it('FR-C09 原合法file/schema及非法path反例，不查外文件', () => {
  expect(file(1)).toMatchObject({ kind: 'file', assetId: 'fa-1' })
  expect(fileAssetRecordSchema.parse({
    id: 'fa-1', projectId: 'p-0001', fileName: '材料.txt', mediaType: 'text/plain',
    size: 0, sha256: '0'.repeat(64), relPath: '00/material.txt', addedAt: AT,
  }).id).toBe('fa-1')
  expect(() => attachmentItemSchema.parse({ id: 'at-1', kind: 'file', path: '/x', addedAt: AT })).toThrow()
  expect(() => attachmentItemSchema.parse({ ...file(1), path: '/x' })).toThrow()
})
it('FR-C10 纯构造确定且只述登记，无输入写或质量裁决', () => {
  const input = frozen(task({ attachments: [file(1)] }))
  const first = observe('FR-C10-first', input)
  expect(observe('FR-C10-repeat', input)).toEqual(first)
  expect(input.status).toBe('done')
  expect(input.progress).toBe(0)
  const text = materialLine(first)!.text
  expect(text).not.toMatch(/验收通过|自动定稿|文件已完成|质量合格|已读取/)
  expect(Object.keys(first).sort()).toEqual(['at', 'gaps', 'lines', 'title'])
})

for (const status of ['draft', 'final'] as const) {
  it(`FR-C${status === 'draft' ? '11' : '12'} 已有历史${status}不重算不迁移零put`, async () => {
    const old = reflectionRecordSchema.parse({ ...structuredClone(originalReflection), status })
    const before = structuredClone(old)
    const records = new Map([[old.id, old]])
    let puts = 0
    const domain = { table: (name: string) => {
      expect(name).toBe('reflections')
      return {
        entries: () => records.entries(), get: (id: string) => records.get(id),
        put: async () => { puts++ },
      }
    } } as unknown as PmDomain
    const result = await ensureReflectionOnDone(domain, structuredClone(originalTask))
    expect(result).toEqual(before)
    expect(records.get(old.id)).toEqual(before)
    expect(puts).toBe(0)
  })
}

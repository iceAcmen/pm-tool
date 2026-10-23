import { createHash } from 'node:crypto'
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { afterEach, describe, expect, it } from 'vitest'
import { handleTaskCommand } from '../commands/task.js'
import { pmDomainSpec } from './storage.js'
import { addProject } from './projects.js'
import { addTask, getTask } from './tasks.js'
import { collectBackup, precheckBackup, applyBackup, validateBackup } from './backup.js'
import { taskCreateSchema, taskUpdateSchema, taskRecordSchema } from './task.js'

const f2 = JSON.parse(readFileSync(new URL(
  '../../../../docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2.json',
  import.meta.url,
), 'utf8'))
const facilities: DomainFacility[] = []
afterEach(async () => {
  for (const facility of facilities.splice(0)) await facility.closeAll()
})

async function open() {
  const root = mkdtempSync(join(tmpdir(), 'pm-objective-developer-domain-'))
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(root))
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  facilities.push(facility)
  return { root, domain: await facility.open(pmDomainSpec) }
}

function manifest(root: string): Record<string, { sha256: string, mtimeMs: number }> {
  return Object.fromEntries(readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = join(root, entry.name)
    return entry.isDirectory() ? Object.entries(manifest(path)) : [[path, {
      sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
      mtimeMs: statSync(path).mtimeMs,
    }]]
  }))
}

describe('OP-AUTO-DEF-03 新写证据协议与旧记录兼容', () => {
  it.each(['javascript:alert(1)', 'ftp://example.com/a', '//example.com/a', '不是链接', '', 'https://example.com/' + 'a'.repeat(2048)])(
    'create/update schema 拒绝非法新写 %s', url => {
      expect(taskCreateSchema.safeParse({ projectId: f2.ids.project, title: '协议负例', evidenceUrl: url }).success).toBe(false)
      expect(taskUpdateSchema.safeParse({ evidenceUrl: url }).success).toBe(false)
    },
  )

  it('真实JSON domain命令：非法add/update（含其他字段和draft）拒绝且字节/mtime/记录零写', async () => {
    const { root, domain } = await open()
    const project = await addProject(domain, { name: '协议负例', startDate: '2026-01-01', targetDate: '2026-12-31' })
    const task = await addTask(domain, { projectId: project.id, title: '原任务' })
    for (const url of ['javascript:alert(1)', 'ftp://example.com/a', '//example.com/a', 'https://example.com/' + 'a'.repeat(2048)]) {
      const before = manifest(root)
      const record = getTask(domain, task.id)
      const added = await handleTaskCommand(`add ${JSON.stringify({
        projectId: project.id, title: '不得创建', evidenceUrl: url,
        draft: { attachmentOps: [{ op: 'addLink', url: 'https://example.com/material' }] },
      })}`, domain)
      expect(added.kind).toBe('error')
      const updated = await handleTaskCommand(`update ${task.id} ${JSON.stringify({
        title: '不得改名', effortHours: 3.5, evidenceUrl: url,
        draft: { attachmentOps: [{ op: 'addLink', url: 'https://example.com/material' }] },
      })}`, domain)
      expect(updated.kind).toBe('error')
      expect(updated.text).toContain('证据链接')
      expect(getTask(domain, task.id)).toEqual(record)
      expect(manifest(root)).toEqual(before)
    }
  })

  it('真实命令接受http(s)与trim、工时3.5；人工0/clear不改清单、legacy或status', async () => {
    const { domain } = await open()
    const project = await addProject(domain, { name: '协议正例', startDate: '2026-01-01', targetDate: '2026-12-31' })
    const task = await addTask(domain, { projectId: project.id, title: '正例', evidenceUrl: ' http://example.com/qa ' })
    expect(task.evidenceUrl).toBe('http://example.com/qa')
    const res = await handleTaskCommand(`update ${task.id} ${JSON.stringify({
      evidenceUrl: ' https://example.com/qa ', effortHours: 3.5,
      manualProgress: 0, manualProgressNote: '人工来源',
    })}`, domain)
    expect(res.kind).toBe('success')
    expect(getTask(domain, task.id)).toMatchObject({
      evidenceUrl: 'https://example.com/qa', effortHours: 3.5, manualProgress: 0,
      status: task.status, progress: task.progress,
    })
    expect((await handleTaskCommand(`update ${task.id} {"manualProgress":null}`, domain)).kind).toBe('success')
    expect(getTask(domain, task.id)!.manualProgressNote).toBeUndefined()
  })

  it('旧非法协议record仍可读；标准备份预检/恢复/往返保原值，不相关更新不被旧值阻塞', async () => {
    const { root, domain } = await open()
    const backup = validateBackup(JSON.parse(readFileSync(new URL(
      '../../../../docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json',
      import.meta.url,
    ), 'utf8')))
    const task = backup.tasks.find(t => t.id === f2.ids.L3)!
    task.evidenceUrl = 'javascript:legacy(1)'
    expect(taskRecordSchema.parse(task)).toEqual(task)
    await precheckBackup(backup)
    await applyBackup(domain, backup, join(root, 'backups'))
    const before = manifest(root)
    expect(getTask(domain, task.id)).toEqual(task)
    const roundtrip = collectBackup(domain)
    await precheckBackup(roundtrip)
    expect(roundtrip.tasks.find(t => t.id === task.id)).toEqual(task)
    expect(manifest(root)).toEqual(before)
    expect((await handleTaskCommand(`update ${task.id} {"description":"保留旧证据"}`, domain)).kind).toBe('success')
    expect(getTask(domain, task.id)!.evidenceUrl).toBe('javascript:legacy(1)')
    expect(getTask(domain, task.id)!.checklist).toEqual(task.checklist)
  })
})

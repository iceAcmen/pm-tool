import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import type { KvUnit } from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { pmDomainSpec, type PmDomain } from './storage.js'
import { addProject } from './projects.js'
import { addTask, getTask, updateTask } from './tasks.js'
import { handleTaskCommand } from '../commands/task.js'
import { stageUpload, readStage } from './file-staging.js'
import { applyTaskOpsWithFiles } from './file-asset-store.js'
import type { Task, AttachmentItem } from './task.js'
import type { TaskDraft } from './task-materials.js'

async function manifest(root: string, prefix = ''): Promise<Record<string, string>> {
  let names
  try { names = await readdir(root, { withFileTypes: true }) } catch { return {} }
  const out: Record<string, string> = {}
  for (const name of names.sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${name.name}` : name.name
    if (name.isDirectory()) Object.assign(out, await manifest(join(root, name.name), rel))
    else if (name.isFile()) out[rel] = createHash('sha256').update(await readFile(join(root, name.name))).digest('hex')
  }
  return out
}

describe('主任务信封文件原子保存（真实 Context/JSON/domain）', () => {
  let root: string
  let files: string
  let domain: PmDomain
  let facility: DomainFacility
  let backend: JsonStorageBackend
  let unit: KvUnit
  let projectId: string
  let old: Task
  let restoreEnv: string | undefined
  let evidence: unknown[]

  beforeEach(async () => {
    root = await mkdtemp(join(process.env.PM_FILE_ATOMIC_TMP ?? '/private/tmp', 'file-atomic-case-'))
    files = join(root, 'files')
    restoreEnv = process.env.DSH_PM_FILE_ROOT
    process.env.DSH_PM_FILE_ROOT = files
    const ctx = new Context()
    await ctx.plugin(Storage)
    backend = new JsonStorageBackend(join(root, 'data'))
    const open = backend.kv.open.bind(backend.kv)
    backend.kv.open = async descriptor => {
      unit = await open(descriptor)
      return unit
    }
    ctx.storage.backend.register('json', backend)
    facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
    domain = await facility.open(pmDomainSpec)
    projectId = (await addProject(domain, {
      name: '文件原子合法样本', startDate: '2026-01-01', targetDate: '2026-12-31',
    })).id
    old = await addTask(domain, { projectId, title: '保留已有资料与四修订', draft: {
      attachmentOps: [{ op: 'addLink', url: 'https://example.com/original', clientId: 'c-link' }],
      progressOps: [
        { op: 'add', author: '甲', content: '首版', refs: ['c-link'] },
        { op: 'edit', id: 'pl-1', content: '第二版' },
        { op: 'edit', id: 'pl-1', content: '第三版' },
        { op: 'edit', id: 'pl-1', content: '第四版' },
        { op: 'add', author: '乙', content: '软删历史' },
        { op: 'delete', id: 'pl-2' },
      ],
    } })
    evidence = []
  })

  afterEach(async context => {
    await writeFile(join(root, 'observations.json'), JSON.stringify({
      case: context.task.name, root, pid: process.pid, evidence, final: await snapshot(),
    }, null, 2))
    await facility.closeAll()
    if (restoreEnv === undefined) delete process.env.DSH_PM_FILE_ROOT
    else process.env.DSH_PM_FILE_ROOT = restoreEnv
  })

  const stage = (bytes = 'file alias own bytes') => stageUpload({ originalName: 'source.md', bytes: Buffer.from(bytes) })
  const snapshot = async () => ({
    tasks: structuredClone([...domain.table('tasks').entries()]),
    assets: structuredClone([...domain.table('file_assets').entries()]),
    disk: await manifest(join(root, 'data')), files: await manifest(files),
  })
  const save = (mode: string, draft: TaskDraft, fields: Record<string, unknown> = { title: '主命令更改' }) =>
    mode === 'create' ? addTask(domain, { projectId, ...fields, draft }) : updateTask(domain, old.id, { ...fields, draft })
  const assertZero = async (work: () => Promise<unknown>) => {
    const before = await snapshot()
    await expect(work()).rejects.toThrow()
    const after = await snapshot()
    evidence.push({ before, after })
    expect(after).toEqual(before)
  }
  const failWriteOnce = (table: string, atWrite: number, afterWrite: boolean) => {
    const realPut = unit.putRecord.bind(unit)
    let writes = 0
    let injected = false
    unit.putRecord = async (name, key, value) => {
      if (name === table && ++writes === atWrite) {
        unit.putRecord = realPut
        if (afterWrite) await realPut(name, key, value)
        injected = true
        throw new Error('QA 一次真实 JSON 写入故障')
      }
      return realPut(name, key, value)
    }
    return () => injected
  }
  const assertRefs = (saved: Task, items: AttachmentItem[]) => {
    const file = items.find(a => a.kind === 'file')!
    expect(file.id).toMatch(/^at-\d+$/)
    const entry = saved.progressLog!.at(-1)!
    expect(entry.refs).toEqual([file.id])
    expect(entry.revisions[0].refs).toEqual([file.id])
  }

  for (const mode of ['create', 'update']) {
    it(`${mode}：同 hash 双 alias 都解析最终 at-ID，且一个资产/附件`, async () => {
      const first = await stage()
      const second = await stage()
      const saved = (await save(mode, {
        attachmentOps: [
          { op: 'addFile', stageId: first.stageId, clientId: 'c-file' },
          { op: 'addFile', stageId: second.stageId, clientId: 'c-second' },
        ],
        progressOps: [{ op: 'add', author: '甲', content: '引用真文件', refs: ['c-file', 'c-second'] }],
      }))!
      expect([...domain.table('file_assets').entries()]).toHaveLength(1)
      expect(saved.attachments!.filter(a => a.kind === 'file')).toHaveLength(1)
      assertRefs(saved, saved.attachments!)
      if (mode === 'update') {
        expect(saved.attachments!.slice(0, 1)).toEqual(old.attachments)
        expect(saved.progressLog!.slice(0, 2)).toEqual(old.progressLog)
      }
      await expect(readStage(first.stageId)).rejects.toThrow()
      await expect(readStage(second.stageId)).rejects.toThrow()
    })

    it(`${mode}：末尾坏 author 零写、stage 可重试`, async () => {
      const s = await stage('atomic last bad unique')
      await assertZero(() => save(mode, {
        attachmentOps: [{ op: 'addFile', stageId: s.stageId }],
        progressOps: [{ op: 'add', author: '', content: '坏作者' }],
      }))
      expect((await readStage(s.stageId)).bytes.toString()).toBe('atomic last bad unique')
      const saved = await save(mode, { attachmentOps: [{ op: 'addFile', stageId: s.stageId }] })
      expect(saved!.attachments!.some(a => a.kind === 'file')).toBe(true)
    })

    it(`${mode}：第二 stage 缺失，撤销第一已提升字节`, async () => {
      const s = await stage('first prepared unique')
      await assertZero(() => save(mode, { attachmentOps: [
        { op: 'addFile', stageId: s.stageId },
        { op: 'addFile', stageId: '0'.repeat(32) },
      ] }))
      expect((await readStage(s.stageId)).bytes.toString()).toBe('first prepared unique')
    })

    it(`${mode}：坏 title 在准备之前零写`, async () => {
      const s = await stage()
      await assertZero(() => Promise.resolve().then(() => save(mode, {
        attachmentOps: [{ op: 'addFile', stageId: s.stageId }],
      }, { title: '' })))
    })

    it(`${mode}：未知 refs 全包零写`, async () => {
      const s = await stage()
      await assertZero(() => save(mode, {
        attachmentOps: [{ op: 'addFile', stageId: s.stageId, clientId: 'c-file' }],
        progressOps: [{ op: 'add', author: '甲', content: '未知引用', refs: ['c-missing'] }],
      }))
    })

    it(`${mode}：记录 schema 超长正文拒绝并撤销已 prepare 文件`, async () => {
      const s = await stage()
      await assertZero(() => save(mode, {
        attachmentOps: [{ op: 'addFile', stageId: s.stageId }],
        progressOps: [{ op: 'add', author: '甲', content: 'x'.repeat(2001) }],
      }))
    })

    it(`${mode}：file/link 跨种类 alias 撞号零写`, async () => {
      const s = await stage()
      await assertZero(() => save(mode, {
        attachmentOps: [
          { op: 'addFile', stageId: s.stageId, clientId: 'c-file' },
          { op: 'addLink', url: 'https://example.com/new', clientId: 'c-file' },
        ],
      }))
    })

    it(`${mode}：已 remove 的 file alias 不可用于进展`, async () => {
      const s = await stage()
      await assertZero(() => save(mode, {
        attachmentOps: [
          { op: 'addFile', stageId: s.stageId, clientId: 'c-file' },
          { op: 'remove', id: mode === 'create' ? 'at-1' : 'at-2' },
        ],
        progressOps: [{ op: 'add', author: '甲', content: '悬空引用', refs: ['c-file'] }],
      }))
    })

    for (const seam of [
      { table: 'file_assets', write: 2, after: false },
      { table: 'file_assets', write: 2, after: true },
      { table: 'tasks', write: 1, after: false },
      { table: 'tasks', write: 1, after: true },
    ]) {
      it(`${mode}：${seam.table} 第${seam.write}写${seam.after ? '后' : '前'}故障全部补偿并可重试`, async () => {
        const a = await stage('first real DB bytes'), b = await stage('second real DB bytes')
        const draft: TaskDraft = { attachmentOps: [
          { op: 'addFile', stageId: a.stageId },
          { op: 'addFile', stageId: b.stageId },
        ] }
        const injected = failWriteOnce(seam.table, seam.write, seam.after)
        await assertZero(() => save(mode, draft))
        expect(injected()).toBe(true)
        expect((await readStage(a.stageId)).bytes.toString()).toBe('first real DB bytes')
        expect((await readStage(b.stageId)).bytes.toString()).toBe('second real DB bytes')
        const saved = await save(mode, draft)
        expect(saved!.attachments!.filter(a => a.kind === 'file')).toHaveLength(2)
        expect([...domain.table('file_assets').entries()]).toHaveLength(2)
      })
    }

    it(`${mode}：失败不删其他任务的旧共享 hash`, async () => {
      const existing = await stage('old shared bytes')
      const shared = await addTask(domain, { projectId, title: '旧共享', draft: {
        attachmentOps: [{ op: 'addFile', stageId: existing.stageId }],
      } })
      const a = await stage('old shared bytes'), b = await stage('new failed bytes')
      await assertZero(() => save(mode, {
        attachmentOps: [
          { op: 'addFile', stageId: a.stageId },
          { op: 'addFile', stageId: b.stageId },
        ],
        progressOps: [{ op: 'add', author: '', content: '非法' }],
      }))
      expect(getTask(domain, shared.id)).toEqual(shared)
      expect([...domain.table('file_assets').entries()]).toHaveLength(1)
      expect((await readStage(a.stageId)).bytes.toString()).toBe('old shared bytes')
      expect((await readStage(b.stageId)).bytes.toString()).toBe('new failed bytes')
    })
  }

  it('真实 task update 命令单信封 basic+file+progress，保稳定四修订与软删', async () => {
    const s = await stage()
    const result = await handleTaskCommand(`update ${old.id} ${JSON.stringify({
      title: '编辑加文件', draft: {
        attachmentOps: [{ op: 'addFile', stageId: s.stageId, clientId: 'c-file' }],
        progressOps: [{ op: 'add', author: '甲', content: '主保存', refs: ['c-file'] }],
      },
    })}`, domain)
    expect(result.kind).toBe('success')
    const saved = getTask(domain, old.id)!
    expect(saved.title).toBe('编辑加文件')
    expect(saved.progressLog!.slice(0, 2)).toEqual(old.progressLog)
    assertRefs(saved, saved.attachments!)
  })

  it('同信封 link/file/link 按序编号，双 file alias 与 link refs 全部对应', async () => {
    const a = await stage(), b = await stage()
    const saved = await addTask(domain, { projectId, title: '按原顺序生成 ID', draft: {
      attachmentOps: [
        { op: 'addLink', url: 'https://example.com/first', clientId: 'c-first' },
        { op: 'addFile', stageId: a.stageId, clientId: 'c-file' },
        { op: 'addLink', url: 'https://example.com/last', clientId: 'c-last' },
        { op: 'addFile', stageId: b.stageId, clientId: 'c-repeat' },
      ],
      progressOps: [{ op: 'add', author: '甲', content: '全部引用',
        refs: ['c-first', 'c-file', 'c-last', 'c-repeat'] }],
    } })
    expect(saved.attachments!.map(a => [a.id, a.kind])).toEqual([
      ['at-1', 'link'], ['at-2', 'file'], ['at-3', 'link'],
    ])
    expect(saved.progressLog![0].refs).toEqual(['at-1', 'at-2', 'at-3'])
    expect(saved.progressLog![0].revisions[0].refs).toEqual(['at-1', 'at-2', 'at-3'])
  })

  it('编辑追加第五修订引用新 file alias，前四版和软删条目不动', async () => {
    const s = await stage()
    const saved = (await updateTask(domain, old.id, { draft: {
      attachmentOps: [{ op: 'addFile', stageId: s.stageId, clientId: 'c-file' }],
      progressOps: [{ op: 'edit', id: 'pl-1', content: '第五版', refs: ['c-file'] }],
    } }))!
    expect(saved.progressLog![0].revisions.slice(0, 4)).toEqual(old.progressLog![0].revisions)
    expect(saved.progressLog![0].revisions.at(-1)!.refs).toEqual(['at-2'])
    expect(saved.progressLog![1]).toEqual(old.progressLog![1])
  })

  it('同 hash 不同合法扩展名复用唯一最终路径，不留第二份最终字节', async () => {
    const a = await stage()
    const b = await stageUpload({ originalName: 'same.txt', bytes: Buffer.from('file alias own bytes') })
    const saved = await addTask(domain, { projectId, title: '同内容跨扩展名', draft: {
      attachmentOps: [
        { op: 'addFile', stageId: a.stageId, clientId: 'c-a' },
        { op: 'addFile', stageId: b.stageId, clientId: 'c-b' },
      ],
      progressOps: [{ op: 'add', author: '甲', content: '双引用', refs: ['c-a', 'c-b'] }],
    } })
    assertRefs(saved, saved.attachments!)
    const [asset] = [...domain.table('file_assets').entries()].map(([, row]) => row)
    expect(Object.keys(await manifest(files))).toEqual([asset.relPath])
    const third = await stageUpload({ originalName: 'reuse.csv', bytes: Buffer.from('file alias own bytes') })
    const next = (await updateTask(domain, old.id, { draft: {
      attachmentOps: [{ op: 'addFile', stageId: third.stageId, clientId: 'c-existing' }],
      progressOps: [{ op: 'add', author: '甲', content: '引用既有 hash', refs: ['c-existing'] }],
    } }))!
    assertRefs(next, next.attachments!)
    expect(Object.keys(await manifest(files))).toEqual([asset.relPath])
    expect([...domain.table('file_assets').entries()]).toHaveLength(1)
  })

  it('material apply 同 file 接缝双 alias 可用', async () => {
    const a = await stage(), b = await stage()
    const saved = await applyTaskOpsWithFiles(domain, old.id, {
      attachmentOps: [
        { op: 'addFile', stageId: a.stageId, clientId: 'c-a' },
        { op: 'addFile', stageId: b.stageId, clientId: 'c-b' },
      ],
      progressOps: [{ op: 'add', author: '甲', content: '双 alias', refs: ['c-a', 'c-b'] }],
    })
    assertRefs(saved as Task, saved.attachments as AttachmentItem[])
  })
})

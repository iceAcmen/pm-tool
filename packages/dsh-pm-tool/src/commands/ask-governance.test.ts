import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage, { type KvUnit } from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CommandDefinition, CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
import { apply } from '../index.js'
import type { PmDomain } from '../core/storage.js'
import { addProject, enqueueDomainWrite } from '../core/projects.js'
import { addTask } from '../core/tasks.js'
import { addMilestone } from '../core/milestones.js'
import { collectBackup } from '../core/backup.js'
import { localTodayIso } from '../core/derived.js'

describe('GG 真实命令/JSON 领域守卫', () => {
  let root: string
  let facility: DomainFacility
  let domain: PmDomain
  let unit: KvUnit
  let command: CommandDefinition
  let projectId: string
  let observations: unknown[]
  let oldFileRoot: string | undefined

  beforeEach(async () => {
    root = await mkdtemp(join(process.env.PM_GOVERNANCE_TMP ?? '/private/tmp', 'governance-case-'))
    observations = []
    oldFileRoot = process.env.DSH_PM_FILE_ROOT
    process.env.DSH_PM_FILE_ROOT = join(root, 'files')
    const ctx = new Context()
    await ctx.plugin(Storage)
    const backend = new JsonStorageBackend(join(root, 'data'))
    const open = backend.kv.open.bind(backend.kv)
    backend.kv.open = async descriptor => { unit = await open(descriptor); return unit }
    ctx.storage.backend.register('json', backend)
    facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
    ctx.provide('storageDomain', facility)
    // 只提供宿主命令注册，不 mock 产品命令、repo、JSON 或领域实现。
    ctx.provide('commands', { register(def: CommandDefinition) { command = def; return () => {} } } as never)
    await apply(ctx)
    domain = facility.get('pmtool') as unknown as PmDomain
    projectId = (await addProject(domain, { name: '治理守卫合法样本', startDate: '2026-01-01', targetDate: '2026-12-31' })).id
  })

  afterEach(async () => {
    await enqueueDomainWrite(domain, async () => {})
    await writeFile(join(root, 'observations.json'), JSON.stringify(observations, null, 2))
    await facility.closeAll()
    if (oldFileRoot === undefined) delete process.env.DSH_PM_FILE_ROOT
    else process.env.DSH_PM_FILE_ROOT = oldFileRoot
  })

  const run = async (rawInput: string): Promise<CommandResult & { text: string, undoId?: string }> => {
    const before = collectBackup(domain, '2026-01-01T00:00:00.000Z')
    const result = await command.handler({ rawInput, attachments: [] } as unknown as CommandInvocation)
    await enqueueDomainWrite(domain, async () => {})
    observations.push({ rawInput, result, before, after: collectBackup(domain, '2026-01-01T00:00:00.000Z') })
    return result as CommandResult & { text: string, undoId?: string }
  }
  const confirm = async (actions: unknown[], baseline?: Record<string, string>) => {
    const result = await run(`ask-apply ${projectId} ${JSON.stringify(actions)}${baseline ? ` --base ${JSON.stringify(baseline)}` : ''}`)
    expect(result.kind).toBe('success')
    expect(result.undoId).toBeTruthy()
    return result.undoId!
  }
  const entry = async (handle: string) => {
    const result = await run(`ask-provenance ${projectId}`)
    return JSON.parse(result.text).entries.find((e: { undo?: { handle: string } }) => e.undo?.handle === handle)
  }
  const task = async (title: string, progress = 0) => addTask(domain, { projectId, title, progress })
  const currentTask = (id: string) => structuredClone(domain.table('tasks').get(id))
  const assertDiskTask = async (id: string, expected: unknown) => {
    const stored = JSON.parse(await readFile(join(root, 'data', 'pmtool', 'tasks', `${id}.json`), 'utf8'))
    expect(stored.version).toBe(2)
    expect(stored.record).toEqual(expected)
  }

  for (const [op, table, patch] of [
    ['milestone.create', 'milestones', { title: '新里程碑', targetDate: '2026-12-01' }],
    ['risk.create', 'risk_issues', { type: 'risk', title: '新风险', impact: 'low', probability: 'low' }],
    ['deliverable.create', 'deliverables', { name: '新交付物' }],
    ['meeting.create', 'meetings', { title: '新会议', meetingDate: '2026-10-21' }],
  ] as const) {
    it(`GG01 ${op} 的实际新 ID 登记来源，旁路记录不入账`, async () => {
      const unrelated = await task('未应用旁路任务')
      const handle = await confirm([{ op, patch, stepId: 's1', needs: [] }])
      const created = [...domain.table(table).entries()][0][1]
      const ledger = await entry(handle)
      expect(ledger.refs).toHaveLength(1)
      expect(ledger.refs[0]).toMatchObject({ table, id: created.id, projectId, role: 'basis', snapshotVersion: 1, ruleRevision: 1 })
      expect(ledger.refs[0].basisFingerprint).toBeTruthy()
      expect(ledger.refs[0].fullFingerprint).toBeTruthy()
      expect(ledger.refs.some((r: { id: string }) => r.id === unrelated.id)).toBe(false)
    })
  }

  it('GG02 两步同目标 clean undo 完整恢复首步前 JSON，包括资料历史', async () => {
    const t = await addTask(domain, { projectId, title: '同目标链', draft: {
      attachmentOps: [{ op: 'addLink', url: 'https://example.com/spec', clientId: 'c-link' }],
      progressOps: [{ op: 'add', author: '甲', content: '首版', refs: ['c-link'] }, { op: 'edit', id: 'pl-1', content: '二版' }],
    } })
    const original = currentTask(t.id)
    const handle = await confirm([
      { op: 'task.update', id: t.id, patch: { assignee: '甲' }, stepId: 's1', needs: [] },
      { op: 'task.update', id: t.id, patch: { progress: 62 }, stepId: 's2', needs: ['s1'] },
    ], { [t.id]: t.updatedAt })
    const applied = currentTask(t.id)
    expect(applied).toMatchObject({ assignee: '甲', progress: 62 })
    const result = await run(`ask-undo ${handle}`)
    expect(result.kind).toBe('success')
    expect(result.text).toMatch(/已撤销 2 项/)
    expect(currentTask(t.id)).toEqual(original)
    await assertDiskTask(t.id, original)
    expect((await entry(handle)).undo.used).toBe(true)
    expect((await run(`ask-undo ${handle}`)).kind).toBe('error')
  })

  it('GG03 mixed 保留 used=false，已撤部分不重复写，剩余冲突可合法重试', async () => {
    const a = await task('外改目标')
    const b = await task('干净目标', 22)
    const bOriginal = currentTask(b.id)
    const handle = await confirm([
      { op: 'task.update', id: a.id, patch: { progress: 44 } },
      { op: 'task.update', id: b.id, patch: { progress: 66 } },
    ])
    const aPost = currentTask(a.id)!
    await run(`task update ${a.id} {"description":"确认后人改"}`)
    const aHuman = currentTask(a.id)
    const first = await run(`ask-undo ${handle}`)
    expect(first.text).toMatch(/已撤销 1 项/)
    expect(currentTask(a.id)).toEqual(aHuman)
    expect(currentTask(b.id)).toEqual(bOriginal)
    const partial = await entry(handle)
    expect(partial.undo.used).toBe(false)
    const bDisk = await readFile(join(root, 'data', 'pmtool', 'tasks', `${b.id}.json`), 'utf8')
    const second = await run(`ask-undo ${handle}`)
    expect(second.text).toMatch(/已撤销 0 项/)
    expect(second.text).toMatch(/1 项因确认后/)
    expect((await entry(handle)).undo.used).toBe(false)
    expect(await readFile(join(root, 'data', 'pmtool', 'tasks', `${b.id}.json`), 'utf8')).toBe(bDisk)
    // 操作者明确恢复全 postimage 后才允许重试，不由产品覆盖人改值。
    await domain.table('tasks').put(a.id, aPost)
    const retry = await run(`ask-undo ${handle}`)
    expect(retry.text).toMatch(/已撤销 1 项/)
    expect(currentTask(a.id)?.progress).toBe(0)
    const final = await entry(handle)
    expect(final.undo.used).toBe(true)
    expect(final.audit.slice(0, partial.audit.length)).toEqual(partial.audit)
    expect(final.audit).toHaveLength(4)
  })

  it('GG02 外部非关键字段改动拦整条同目标链，不覆盖其完整值', async () => {
    const t = await task('同目标外部冲突')
    const handle = await confirm([
      { op: 'task.update', id: t.id, patch: { assignee: '甲' }, stepId: 's1', needs: [] },
      { op: 'task.update', id: t.id, patch: { progress: 62 }, stepId: 's2', needs: ['s1'] },
    ])
    const applied = currentTask(t.id)!
    // 合法非 basis 字段变化，不 bump 时间，仍必须触发全对象守卫。
    await domain.table('tasks').put(t.id, { ...applied, description: '外部变化' })
    const human = currentTask(t.id)
    expect((await run(`ask-undo ${handle}`)).kind).toBe('error')
    expect(currentTask(t.id)).toEqual(human)
    expect((await entry(handle)).undo.used).toBe(false)
  })

  it('GG03 JSON 写入失败不烧句柄，不重复撤成功项，重试能完整还原', async () => {
    const a = await task('故障目标')
    const b = await task('干净目标', 22)
    const originalA = currentTask(a.id)
    const originalB = currentTask(b.id)
    const handle = await confirm([
      { op: 'task.update', id: a.id, patch: { progress: 44 } },
      { op: 'task.update', id: b.id, patch: { progress: 66 } },
    ])
    const put = unit.putRecord.bind(unit)
    unit.putRecord = async (name, key, value) => {
      if (name === 'tasks' && key === a.id) {
        unit.putRecord = put
        throw new Error('QA 单次真实 JSON 写入失败')
      }
      return put(name, key, value)
    }
    expect((await run(`ask-undo ${handle}`)).kind).toBe('error')
    expect((await entry(handle)).undo.used).toBe(false)
    expect(currentTask(b.id)).toEqual(originalB)
    const retried = await run(`ask-undo ${handle}`)
    expect(retried.kind).toBe('success')
    expect(retried.text).toMatch(/已撤销 1 项/)
    expect(currentTask(a.id)).toEqual(originalA)
    expect(currentTask(b.id)).toEqual(originalB)
    expect((await entry(handle)).undo.used).toBe(true)
  })

  it('GG02/03 同目标前段写失败，已撤后段不重撤，重试保完整前态', async () => {
    const t = await task('同目标部分失败')
    const original = currentTask(t.id)
    const handle = await confirm([
      { op: 'task.update', id: t.id, patch: { assignee: '甲' }, stepId: 's1', needs: [] },
      { op: 'task.update', id: t.id, patch: { progress: 62 }, stepId: 's2', needs: ['s1'] },
    ])
    const put = unit.putRecord.bind(unit)
    let writes = 0
    unit.putRecord = async (name, key, value) => {
      if (name === 'tasks' && key === t.id && ++writes === 2) {
        unit.putRecord = put
        throw new Error('QA 同目标前段单次写失败')
      }
      return put(name, key, value)
    }
    const first = await run(`ask-undo ${handle}`)
    expect(first.kind).toBe('error')
    expect(first.text).toMatch(/已撤销 1 项/)
    expect(currentTask(t.id)).toMatchObject({ assignee: '甲', progress: 0 })
    expect((await entry(handle)).undo.used).toBe(false)
    const second = await run(`ask-undo ${handle}`)
    expect(second.text).toMatch(/已撤销 1 项/)
    expect(second.kind).toBe('success')
    expect(currentTask(t.id)).toEqual(original)
    await assertDiskTask(t.id, original)
    expect((await entry(handle)).undo.used).toBe(true)
  })

  it('F13 账本首次写失败仍返回已应用，补偿保新 ID 来源与 history', async () => {
    const put = unit.putRecord.bind(unit)
    let injected = false
    unit.putRecord = async (name, key, value) => {
      if (name === 'settings' && key === 'pmProvenanceLedger' && !injected) {
        injected = true
        unit.putRecord = put
        throw new Error('QA 账本单次真实 JSON 写失败')
      }
      return put(name, key, value)
    }
    const handle = await confirm([{ op: 'milestone.create', patch: { title: '补偿来源', targetDate: '2026-12-01' } }])
    const created = [...domain.table('milestones').entries()][0][1]
    expect(created.title).toBe('补偿来源')
    expect(injected).toBe(true)
    const ledger = await entry(handle)
    expect(ledger.refs).toMatchObject([{ table: 'milestones', id: created.id }])
    expect(ledger.history).toEqual([])
    expect(ledger.undo.used).toBe(false)
    await run(`milestone update ${created.id} {"description":"修改来源"}`)
    await run(`ask-recheck ${projectId}`)
    const checked = await entry(handle)
    expect(checked.history).toHaveLength(1)
    await run(`ask-recheck ${projectId}`)
    const twice = await entry(handle)
    expect(twice.history).toHaveLength(2)
    expect(twice.history[0]).toEqual(checked.history[0])
    expect(twice.refs).toEqual(ledger.refs)
  })

  it('GG01 拒步/依赖跳步/跨项目不入来源，独立成功步照常执行', async () => {
    const p2 = (await addProject(domain, { name: '旁路项目', startDate: '2026-01-01', targetDate: '2026-12-31' })).id
    const foreign = await addTask(domain, { projectId: p2, title: '跨项目任务' })
    const t = await task('合法独立目标')
    const m = await addMilestone(domain, { projectId, title: '预存旁路里程碑', targetDate: '2026-12-01' })
    const handle = await confirm([
      { op: 'task.update', id: foreign.id, patch: { progress: 5 }, stepId: 's1', needs: [] },
      { op: 'milestone.create', patch: { title: '依赖未执行', targetDate: '2026-12-01' }, stepId: 's2', needs: ['s1'] },
      { op: 'task.update', id: t.id, patch: { progress: 10 }, stepId: 's3', needs: [] },
    ])
    expect((await entry(handle)).refs.map((r: { id: string }) => r.id)).toEqual([t.id])
    expect([...domain.table('milestones').keys()]).toEqual([m.id])
    expect(domain.table('tasks').get(foreign.id)?.progress).toBe(0)
  })

  it('GG04 absent-only top=null，rest 保留，真实 list 不写业务', async () => {
    const t = await task('缺席任务')
    expect((await run(`session bind ${t.id} absence-only`)).kind).toBe('success')
    const before = collectBackup(domain, '2026-01-01T00:00:00.000Z')
    const result = JSON.parse((await run(`queue list ${projectId}`)).text)
    expect(result.top).toBeNull()
    expect(result.rest).toMatchObject([{ taskId: t.id, absent: true }])
    expect(collectBackup(domain, '2026-01-01T00:00:00.000Z')).toEqual(before)
  })

  it('GG04 缺席不抢 due/critical；mute 与 quiet 保持原语义', async () => {
    // 真实缺席初态使用新建时 P0，不能用已跟进记录伪装缺席。
    const abs = await addTask(domain, { projectId, title: 'P0 缺席', priority: 'P0' })
    await run(`session bind ${abs.id} abs-p0`)
    const due = await addTask(domain, { projectId, title: '今日到期', dueDate: localTodayIso() })
    const list = async () => JSON.parse((await run(`queue list ${projectId}`)).text)
    expect((await list()).top.taskId).toBe(due.id)
    await run(`queue mute ${due.id} 7`)
    expect((await list()).top).toBeNull()
    await run(`task update ${due.id} {"status":"blocked"}`)
    expect((await list()).top).toMatchObject({ taskId: due.id, muted: true, severity: 'blocked' })
    await run('queue quiet 00:00 23:59')
    expect((await list()).top).toBeNull()
    expect((await list()).rest.map((r: { taskId: string }) => r.taskId).sort()).toEqual([abs.id, due.id].sort())
    await run('queue quiet off')
    expect((await list()).top.taskId).toBe(due.id)
  })
})

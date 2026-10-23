import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from './lib/index.js'
import { addProject } from './lib/core/projects.js'
import { addTask, updateTask } from './lib/core/tasks.js'
import { addMilestone } from './lib/core/milestones.js'
import { addRiskIssue } from './lib/core/risk-issues.js'
import { addDeliverable } from './lib/core/deliverables.js'
import { addMeeting } from './lib/core/meetings.js'
import { addLinkAttachment, progressAppend, progressEditRevision, progressSoftDelete } from './lib/core/task-materials.js'
import { parseCopilotActions, validateActions } from './lib/core/copilot.js'
import { evaluateStale, CURRENT_SNAPSHOT_VERSION, CURRENT_RULE_REVISION } from './lib/core/provenance.js'
import { collectBackup, createBackup, precheckBackup, restoreBackup, restoreBackupFromContent } from './lib/core/backup.js'
import { habitRecordSchema, sessionRecordSchema, reflectionRecordSchema, lessonRecordSchema, okrRecordSchema } from './lib/core/storage.js'
import { deriveHabitStreak } from './lib/core/habits.js'
import { buildOkrTree } from './lib/core/okr.js'
import { inQuietWindow, deriveQueue } from './lib/core/queue.js'
import { loadFacts, stanceSuggestions, staleStanceTags } from './lib/core/load-stance.js'
import { generateDraft } from './lib/core/ai-client.js'
import { cycleHookPoint, CYCLE_HOOKS } from './lib/core/cycle-hooks.js'

const own = process.env.QA_OWN
const root = path.join(own, 'domain')
const mode = process.argv[2] === 'reopen' ? 'reopen' : 'domain'
const save = (f, v) => fs.writeFileSync(path.join(own, f), JSON.stringify(v, null, 2) + '\n')
const hash = v => createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex')
const sleep = ms => new Promise(r => setTimeout(r, ms))
const json = text => {
  try { return JSON.parse(text) } catch { return JSON.parse(/```json\s*\n([\s\S]*?)\n```/.exec(text)?.[1] ?? '{}') }
}
const now = new Date()
const D = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const day = n => new Date(Date.parse(D) + n * 86400000).toISOString().slice(0, 10)
const iso = n => day(n) + 'T00:00:00.000Z'
const results = []
const commands = []
const ids = {}
let currentId = 'SETUP'
async function probe(name, fn) {
  try {
    const detail = await fn()
    results.push({ id: currentId, name, status: 'PASS', detail: detail ?? null })
    console.log(`[PASS] ${currentId}/${name}`)
  } catch (e) {
    const status = e?.code === 'ERR_ASSERTION' ? 'FAIL' : 'BLOCKED'
    results.push({ id: currentId, name, status, detail: e?.stack ?? String(e) })
    console.log(`[${status}] ${currentId}/${name}: ${e?.message ?? e}`)
  }
  save(mode + '-results.json', results)
}
async function suite(id, fn) {
  currentId = id
  try { await fn() } catch (e) {
    results.push({ id, name: 'suite-infrastructure', status: e?.code === 'ERR_ASSERTION' ? 'FAIL' : 'BLOCKED', detail: e?.stack ?? String(e) })
    console.log(`[${results.at(-1).status}] ${id}: ${e.message}`)
    save(mode + '-results.json', results)
  }
}
let gatewayBehavior = { text: '```json\n{"actions":[]}\n```' }
const gatewayCalls = []
const gateway = {
  async prepareCall(request, signal) {
    gatewayCalls.push({ request, signalTimeoutPresent: !!signal })
    if (gatewayBehavior.error) throw Object.assign(new Error('隔离 adapter 故障'), { code: gatewayBehavior.error })
    const text = gatewayBehavior.text
    return {
      config: request,
      async *stream(options) {
        gatewayCalls.at(-1).system = options.system
        gatewayCalls.at(-1).messages = options.messages
        if (gatewayBehavior.abort) throw Object.assign(new Error('aborted'), { name: 'AbortError' })
        if (text) yield { type: 'text-delta', text }
      },
    }
  },
}
async function context(dataRoot) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(dataRoot))
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  ctx.provide('storageDomain', facility)
  ctx.provide('llm', gateway)
  let command
  ctx.provide('commands', { register(def) { command = def; return () => {} } })
  await apply(ctx)
  const domain = facility.get('pmtool')
  const run = async (rawInput, expected) => {
    const before = collectBackup(domain, '2026-01-01T00:00:00.000Z')
    const r = await command.handler({ rawInput, attachments: [] })
    await sleep(20)
    const after = collectBackup(domain, '2026-01-01T00:00:00.000Z')
    commands.push({ id: currentId, rawInput, result: r, before, after, beforeHash: hash(before), afterHash: hash(after) })
    save('commands-' + mode + '.json', commands)
    if (expected) assert.equal(r.kind, expected, `${rawInput}: ${r.text}`)
    return r
  }
  return { ctx, facility, domain, run }
}
const { domain, run } = await context(root)
const rows = table => [...domain.table(table).entries()].map(([, v]) => structuredClone(v))
const rec = (table, id) => structuredClone(domain.table(table).get(id))
const state = () => {
  const b = collectBackup(domain, '2026-01-01T00:00:00.000Z')
  for (const table of Object.keys(b.extra)) b.extra[table].sort(([a], [z]) => a.localeCompare(z))
  return JSON.stringify(b)
}
const business = () => {
  const b = JSON.parse(state())
  delete b.extra.settings
  return JSON.stringify(b)
}
const project = async alias => {
  const p = await addProject(domain, { name: `QA-G ${alias}`, startDate: day(-60), targetDate: day(60) })
  ids[alias] = p.id
  return p.id
}
const task = async (alias, projectId, fields = {}) => {
  const t = await addTask(domain, { projectId, title: alias, ...fields })
  ids[alias] = t.id
  return t
}
const allRecords = () => new Map(['tasks', 'milestones', 'risk_issues', 'deliverables', 'meetings', 'reports']
  .flatMap(t => rows(t).map(r => [`${t}:${r.id}`, r])))
const ledger = async pid => json((await run(`ask-provenance ${pid}`, 'success')).text)
const backup = async (label, dir, d = domain) => {
  await sleep(30)
  const result = await createBackup(d, path.join(own, dir))
  const content = JSON.parse(fs.readFileSync(result.path, 'utf8'))
  await precheckBackup(content)
  for (const [table, schema] of Object.entries({ habits: habitRecordSchema, reflections: reflectionRecordSchema, lessons: lessonRecordSchema, okrs: okrRecordSchema })) {
    for (const [, r] of content.extra[table] ?? []) schema.parse(r)
  }
  save(label + '-fixture.json', { path: result.path, sha256: hash(fs.readFileSync(result.path, 'utf8')), counts: result.counts, precheck: 'PASS', ids, date: D })
  return result
}

if (process.argv[2] === 'reopen') {
  const expected = JSON.parse(fs.readFileSync(path.join(own, 'expected.json'), 'utf8'))
  currentId = 'REOPEN'
  await probe('all-domain-records-and-ledger-byte-values', async () => {
    assert.deepEqual(JSON.parse(state()), JSON.parse(expected.state))
    for (const [id, expectedRow] of Object.entries(expected.sessions)) {
      assert.deepEqual(rec('sessions', id), expectedRow)
    }
  })
  await probe('undo-not-durable', async () => {
    const r = await run('ask-undo ' + expected.undoHandle, 'error')
    assert.match(r.text, /不存在|过期|重启/)
  })
  save('reopen-results.json', results)
  process.exitCode = results.some(r => r.status !== 'PASS') ? 1 : 0
} else {
  const A = await project('A')
  const B = await project('B')
  const t1 = await task('来源任务一', A, { description: '真实材料描述', dueDate: day(-1) })
  const t2 = await task('来源任务二', A)
  const tb = await task('跨项目任务', B)
  const ms = await addMilestone(domain, { projectId: A, title: '来源里程碑', targetDate: day(8) })
  const ri = await addRiskIssue(domain, { projectId: A, type: 'risk', title: '来源风险', impact: 'high', probability: 'medium' })
  const dlv = await addDeliverable(domain, { projectId: A, name: '来源交付物' })
  const mt = await addMeeting(domain, { projectId: A, title: '来源会议', meetingDate: D })
  Object.assign(ids, { milestone: ms.id, risk: ri.id, deliverable: dlv.id, meeting: mt.id })
  const at = await addLinkAttachment(domain, t1.id, { url: 'https://example.com/qa-spec', title: '生产资料链接' })
  const e1 = await progressAppend(domain, t1.id, { content: '进展首版', author: '测试甲', date: day(-2), refs: [at.id] })
  await progressEditRevision(domain, t1.id, e1.id, { content: '进展二版', author: '测试乙', date: day(-1), refs: [at.id] })
  await progressEditRevision(domain, t1.id, e1.id, { content: '进展三版', author: '测试甲', date: D, refs: [at.id] })
  const e2 = await progressAppend(domain, t1.id, { content: '软删首版', author: '测试甲', date: day(-1) })
  await progressEditRevision(domain, t1.id, e2.id, { content: '软删二版', author: '测试乙', date: D })
  await progressSoftDelete(domain, t1.id, e2.id)
  await run(`session bind ${t1.id} s-qa-growth "真实会话材料"`, 'success')
  ids.attachment = at.id
  ids.progress = e1.id
  const actions = [
    { op: 'task.update', id: t1.id, patch: { assignee: '测试甲', description: '确认后描述' } },
    { op: 'task.update', id: t2.id, patch: { progress: 35 } },
    { op: 'milestone.update', id: ms.id, patch: { description: '真实确认更新' } },
    { op: 'risk.update', id: ri.id, patch: { responsePlan: '真实确认响应' } },
    { op: 'deliverable.update', id: dlv.id, patch: { description: '真实确认交付说明' } },
    { op: 'meeting.update', id: mt.id, patch: { summary: '真实确认摘要' } },
    { op: 'milestone.create', patch: { title: 'AI 新里程碑', targetDate: day(10) } },
    { op: 'risk.create', patch: { type: 'risk', title: 'AI 新风险', impact: 'low', probability: 'low' } },
    { op: 'deliverable.create', patch: { name: 'AI 新交付物' } },
    { op: 'meeting.create', patch: { title: 'AI 新会议', meetingDate: D } },
  ].map((a, i) => ({ ...a, stepId: 's' + (i + 1), title: '明确确认' + (i + 1), needs: [] }))
  let f6Ledger, f6Apply, f6Draft, f6Actions
  await suite('RA-AI01', async () => {
    await probe('production-gateway-draft-zero-business-write', async () => {
      gatewayBehavior = { text: '```json\n' + JSON.stringify({ actions }) + '\n```' }
      const before = business()
      f6Draft = await run(`ask ${A} 整理两任务与四类来源`, 'success')
      assert.equal(business(), before)
      assert.ok(gatewayCalls.at(-1).messages)
      const parsed = parseCopilotActions(f6Draft.text)
      assert.deepEqual(parsed, actions)
      f6Actions = parsed
      save('F6-gateway-draft.json', { output: f6Draft, parsed, gatewayCalls })
      return { gatewayCalls: gatewayCalls.length }
    })
    await probe('explicit-confirm-real-dispatch-nonempty-provenance', async () => {
      assert.ok(f6Actions?.length === 10, '必须确认生产 gateway 输出经生产解析得到的计划')
      f6Apply = await run(`ask-apply ${A} ${JSON.stringify(f6Actions)}`, 'success')
      assert.match(f6Apply.text, /已应用 10 步/)
      f6Ledger = await ledger(A)
      const entry = f6Ledger.entries.find(e => e.undo?.handle === f6Apply.undoId)
      assert.ok(entry && entry.refs.length >= 6)
      assert.deepEqual(new Set(entry.refs.map(r => r.table)), new Set(['tasks', 'milestones', 'risk_issues', 'deliverables', 'meetings']))
      for (const ref of entry.refs) {
        assert.equal(ref.projectId, A)
        assert.ok(ref.label && ref.updatedAt && ref.basisFingerprint)
        assert.equal(ref.role, 'basis')
        assert.equal(ref.snapshotVersion, CURRENT_SNAPSHOT_VERSION)
        assert.equal(ref.ruleRevision, CURRENT_RULE_REVISION)
        assert.ok(allRecords().has(`${ref.table}:${ref.id}`))
      }
      save('F6-nonempty-ledger.json', f6Ledger)
      await backup('F6', 'F6-backup')
    })
  })
  await suite('RA-AI05', async () => {
    for (const [table, label] of [['milestones', 'AI 新里程碑'], ['risk_issues', 'AI 新风险'], ['deliverables', 'AI 新交付物'], ['meetings', 'AI 新会议']]) {
      await probe('applied-create-provenance-' + table, async () => {
        const entry = f6Ledger.entries.find(e => e.undo?.handle === f6Apply.undoId)
        const created = rows(table).find(r => (r.title ?? r.name) === label)
        assert.ok(created, table + ' create 已落库')
        ids[label] = created.id
        save('F6-created-records.json', { ids, records: allRecords().size, ledger: entry })
        assert.ok(entry.refs.some(r => r.table === table && r.id === created.id), `${table}/${created.id} create 已 applied 却未登记来源`)
        return { table, id: created.id }
      })
    }
    await probe('negative-whitelist-cross-project-wrapped-arrays-zero-write', async () => {
      const bad = [
        { op: 'task.delete', id: t2.id },
        { op: 'task.update', id: tb.id, patch: { progress: 50 } },
        ...[{ unknown: 1 }, { status: 'wrapped' }, { attachments: [] }, { progressLog: [] }]
          .map(patch => ({ op: 'task.update', id: t1.id, patch })),
        { op: 'meeting.update', id: mt.id, patch: { projectId: B } },
      ]
      const before = business()
      const r = await run(`ask-apply ${A} ${JSON.stringify(bad)}`, 'success')
      assert.match(r.text, /已应用 0/)
      assert.equal(business(), before)
      return r
    })
    await probe('materials-history-preserved-by-valid-update', async () => {
      const initial = rec('tasks', t1.id)
      await run(`ask-apply ${A} ${JSON.stringify([{ op: 'task.update', id: t1.id, patch: { description: '保资料更新' } }])}`, 'success')
      assert.deepEqual(rec('tasks', t1.id).attachments, initial.attachments)
      assert.deepEqual(rec('tasks', t1.id).progressLog, initial.progressLog)
    })
  })
  await suite('RA-AI02', async () => {
    await probe('normal-title-update-changed-recheck-appends-history', async () => {
      const old = (await ledger(A)).entries.find(e => e.undo?.handle === f6Apply.undoId)
      await run(`task update ${t1.id} ${JSON.stringify({ title: '来源任务一正常改名', description: '正常改正文' })}`, 'success')
      const response = json((await run(`ask-recheck ${A}`, 'success')).text)
      const row = response.rows.find(e => e.id === old.id)
      assert.equal(row.conclusion, 'needs-regen')
      assert.ok(row.rows.some(r => r.state === 'changed'))
      assert.ok(response.summary.stale > 0)
      const next = (await ledger(A)).entries.find(e => e.id === old.id)
      assert.deepEqual(next.refs, old.refs)
      assert.deepEqual(next.history.slice(0, old.history.length), old.history)
      assert.equal(next.history.length, old.history.length + 1)
      save('F6-changed-recheck.json', { old, response, next })
    })
    await probe('real-ref-cross-project-rule-snapshot-pure-defense', async () => {
      const ref = f6Ledger.entries.find(e => e.undo?.handle === f6Apply.undoId).refs.find(r => r.id === t2.id)
      const map = allRecords()
      assert.equal(evaluateStale([ref], map, ref.snapshotVersion + 1, ref.ruleRevision).conclusion, 'needs-regen')
      assert.equal(evaluateStale([ref], map, ref.snapshotVersion, ref.ruleRevision + 1).conclusion, 'needs-regen')
      map.set(`tasks:${t2.id}`, { ...rec('tasks', t2.id), projectId: B })
      assert.equal(evaluateStale([ref], map).conclusion, 'manual-review')
    })
  })
  await suite('RA-AI03', async () => {
    await probe('normal-delete-missing-two-rechecks-old-history-kept', async () => {
      const old = (await ledger(A)).entries.find(e => e.undo?.handle === f6Apply.undoId)
      await run(`task delete ${t2.id} confirm`, 'success')
      assert.equal(domain.table('tasks').get(t2.id), undefined)
      const first = json((await run(`ask-recheck ${A}`, 'success')).text)
      const second = json((await run(`ask-recheck ${A}`, 'success')).text)
      for (const res of [first, second]) {
        const r = res.rows.find(e => e.id === old.id)
        assert.equal(r.conclusion, 'manual-review')
        assert.ok(r.rows.some(x => x.state === 'missing'))
        assert.ok(r.invalid.some(x => x.reason === 'missing'))
      }
      const next = (await ledger(A)).entries.find(e => e.id === old.id)
      assert.equal(next.history.length, old.history.length + 2)
      assert.deepEqual(next.history.slice(0, old.history.length), old.history)
      assert.deepEqual(next.refs, old.refs)
      save('F6-missing-recheck.json', { old, first, second, next })
    })
  })
  let undoHandle
  await suite('RA-AI04', async () => {
    const C = await project('确认撤销')
    const x = await task('确认同目标', C)
    const y = await task('确认独立目标', C)
    await probe('draft-cancel-regenerate-no-business-write', async () => {
      const before = business()
      for (let i = 0; i < 2; i++) await run(`ask ${C} 重新草稿`, 'success')
      assert.equal(business(), before)
    })
    await probe('same-target-chain-baseline-two-steps', async () => {
      const baseline = { [x.id]: rec('tasks', x.id).updatedAt }
      const a = [
        { op: 'task.update', id: x.id, patch: { assignee: '甲' }, stepId: 's1', needs: [] },
        { op: 'task.update', id: x.id, patch: { progress: 62 }, stepId: 's2', needs: ['s1'] },
      ]
      const r = await run(`ask-apply ${C} ${JSON.stringify(a)} --base ${JSON.stringify(baseline)}`, 'success')
      assert.match(r.text, /已应用 2 步/)
      assert.equal(rec('tasks', x.id).progress, 62)
      assert.equal(rec('tasks', x.id).assignee, '甲')
      undoHandle = r.undoId
    })
    await probe('clean-undo-restores-two-step-original', async () => {
      const r = await run(`ask-undo ${undoHandle}`, 'success')
      assert.match(r.text, /已撤销 2 项/)
      assert.equal(rec('tasks', x.id).progress, 0)
      assert.equal(rec('tasks', x.id).assignee, undefined)
    })
    await probe('external-update-rejects-related-dependent-keeps-independent', async () => {
      const old = rec('tasks', x.id).updatedAt
      await sleep(5)
      await run(`task update ${x.id} ${JSON.stringify({ description: '人改后不覆盖' })}`, 'success')
      const a = [
        { op: 'task.update', id: x.id, patch: { progress: 88 }, stepId: 's1', needs: [] },
        { op: 'task.update', id: x.id, patch: { assignee: '不能写' }, stepId: 's2', needs: ['s1'] },
        { op: 'task.update', id: y.id, patch: { progress: 22 }, stepId: 's3', needs: [] },
      ]
      const r = await run(`ask-apply ${C} ${JSON.stringify(a)} --base ${JSON.stringify({ [x.id]: old })}`, 'success')
      assert.match(r.text, /已应用 1 步/)
      assert.match(r.text, /他人更新/)
      assert.match(r.text, /依赖步骤未执行/)
      assert.equal(rec('tasks', x.id).progress, 0)
      assert.equal(rec('tasks', y.id).progress, 22)
    })
    await probe('mixed-undo-conflict-not-burn-runtime-or-ledger', async () => {
      const r = await run(`ask-apply ${C} ${JSON.stringify([
        { op: 'task.update', id: x.id, patch: { progress: 44 } },
        { op: 'task.update', id: y.id, patch: { progress: 66 } },
      ])}`, 'success')
      await run(`task update ${x.id} ${JSON.stringify({ description: '确认后人改' })}`, 'success')
      const u = await run(`ask-undo ${r.undoId}`, 'success')
      assert.match(u.text, /已撤销 1 项.*1 项因确认后/)
      assert.equal(rec('tasks', x.id).progress, 44)
      assert.equal(rec('tasks', y.id).progress, 22)
      const entry = (await ledger(C)).entries.find(e => e.undo?.handle === r.undoId)
      save('mixed-undo.json', { apply: r, undo: u, entry, retry: await run(`ask-undo ${r.undoId}`) })
      assert.equal(entry.undo.used, false, '混合撤销冲突仍可重试，不应将账本 used 标 true')
      undoHandle = r.undoId
    })
    await probe('explicit-stepwise-two-confirmations', async () => {
      const first = await run(`ask-apply ${C} ${JSON.stringify([{ op: 'task.update', id: y.id, patch: { progress: 32 }, stepId: 'step1', needs: [] }])} --base ${JSON.stringify({ [y.id]: rec('tasks', y.id).updatedAt })}`, 'success')
      const second = await run(`ask-apply ${C} ${JSON.stringify([{ op: 'task.update', id: y.id, patch: { assignee: '逐步甲' }, stepId: 'step2', needs: [] }])} --base ${JSON.stringify({ [y.id]: rec('tasks', y.id).updatedAt })}`, 'success')
      assert.match(first.text, /已应用 1 步/)
      assert.match(second.text, /已应用 1 步/)
      assert.equal(rec('tasks', y.id).progress, 32)
    })
    await probe('changed-only-undo-refuses-overwrite-runtime-retryable', async () => {
      const r = await run(`ask-apply ${C} ${JSON.stringify([{ op: 'task.update', id: y.id, patch: { progress: 49 } }])}`, 'success')
      await run(`task update ${y.id} {"description":"changed-only 人改"}`, 'success')
      const before = business()
      const first = await run(`ask-undo ${r.undoId}`, 'error')
      const second = await run(`ask-undo ${r.undoId}`, 'error')
      assert.equal(business(), before)
      assert.match(first.text, /修改|冲突/)
      assert.match(second.text, /修改|冲突/)
      assert.doesNotMatch(second.text, /已使用|不存在|过期/)
      assert.equal((await ledger(C)).entries.find(e => e.undo?.handle === r.undoId).undo.used, false)
      save('changed-only-undo.json', { apply: r, first, second })
    })
  })
  await suite('RA-AI06', async () => {
    await probe('gateway-faults-chinese-zero-business-write-recovery', async () => {
      const before = business()
      const observed = []
      for (const error of ['INVALID_CREDENTIAL', 'RATE_LIMIT', 'NO_ADAPTER', 'MISSING_CREDENTIAL', 'CONTEXT_OVERFLOW']) {
        gatewayBehavior = { error }
        const r = await run(`ask ${A} 隔离故障-${error}`, 'error')
        assert.match(r.text, /副驾暂不可用|模型|密钥|Key|生产/)
        observed.push({ error, result: r })
      }
      gatewayBehavior = { abort: true, text: 'ignored' }
      const abort = await run(`ask ${A} 隔离中断`, 'error')
      assert.match(abort.text, /超时|中断/)
      gatewayBehavior = { text: '乱码且没有计划结构' }
      const malformed = await run(`ask ${A} 乱码返回`, 'success')
      assert.deepEqual(parseCopilotActions(malformed.text), [])
      gatewayBehavior = { text: '```json\n{"actions":[]}\n```' }
      await run(`ask ${A} 故障后恢复`, 'success')
      assert.equal(business(), before)
      save('gateway-faults.json', { observed, abort, malformed, calls: gatewayCalls })
    })
    await probe('no-llm-production-error', async () => {
      await assert.rejects(() => generateDraft(undefined, { system: 's', user: 'u' }), /未装载 LLM/)
    })
  })
  await suite('RA-P0001', async () => {
    await probe('production-context-real-materials-and-empty-no-secret-refs', async () => {
      gatewayBehavior = { text: '读取完成，未提议写入' }
      const before = business()
      await run(`ask ${A} 读取材料与缺口`, 'success')
      const prompt = JSON.stringify(gatewayCalls.at(-1).messages)
      assert.match(prompt, /来源任务一正常改名/)
      assert.match(prompt, /生产资料链接|example\.com/)
      assert.match(prompt, /进展三版/)
      assert.doesNotMatch(prompt, /软删二版/)
      assert.equal(business(), before)
      save('context-projection.json', { prompt })
    })
  })
  await suite('RA-P0002', async () => {
    await probe('narrow-fields-final-schema-valid-and-five-legacy-unchanged', async () => {
      const t = await task('窄集字段', A)
      const r = await run(`ask-apply ${A} ${JSON.stringify([{ op: 'task.update', id: t.id, patch: {
        description: '合法窄集', evidenceUrl: 'https://example.com/evidence', repoUrl: 'https://github.com/qa/growth', branch: 'qa-branch',
        status: 'in_progress', progress: 41, assignee: '测试乙', startDate: D, dueDate: day(3),
      } }])}`, 'success')
      assert.match(r.text, /已应用 1 条/)
      assert.equal(rec('tasks', t.id).branch, 'qa-branch')
      assert.equal(rec('tasks', t.id).progress, 41)
    })
    const tNegative = await task('窄集负例', A)
    await probe('branch-only-optional-valid-schema', async () => {
      const r = await run(`ask-apply ${A} ${JSON.stringify([{ op: 'task.update', id: tNegative.id, patch: { branch: 'no-repo' } }])}`, 'success')
      assert.match(r.text, /已应用 1 条/)
      assert.equal(rec('tasks', tNegative.id).branch, 'no-repo')
      assert.equal(rec('tasks', tNegative.id).repoUrl, undefined)
    })
    for (const patch of [{ title: 'AI改名' }, { priority: 'P0' }, { manualProgress: 50 }, { checklist: [] },
        { evidenceUrl: 'javascript:alert(1)' }, { repoUrl: 'javascript:alert(1)' }, { branch: 'bad branch' },
        { description: 'x'.repeat(2001) }, { branch: 'x'.repeat(129) }, { dueDate: '2026-02-30' }]) {
      await probe('illegal-patch-' + Object.keys(patch)[0], async () => {
        const before = business()
        const r = await run(`ask-apply ${A} ${JSON.stringify([{ op: 'task.update', id: tNegative.id, patch }])}`, 'success')
        assert.match(r.text, /已应用 0/)
        assert.equal(business(), before)
      })
    }
  })
  await suite('RA-P0003', async () => {
    await probe('production-capture-draft-handle-confirm-provenance', async () => {
      gatewayBehavior = { text: '```json\n' + JSON.stringify({ candidates: [
        { title: '整理测试任务与证据链接', dueDate: day(1), evidence: ['https://example.com/capture'] },
        { title: '复核测试边界' },
      ] }) + '\n```' }
      const before = business()
      const draft = await run(`capture ${A} 整理测试任务与证据链接`, 'success')
      assert.equal(business(), before)
      const handle = /草稿编号：(draft-[A-Za-z0-9-]+)/.exec(draft.text)?.[1]
      assert.ok(handle)
      await run(`capture-apply ${B} ${handle}`, 'error')
      assert.equal(business(), before)
      const r = await run(`capture-apply ${A} ${handle}`, 'success')
      assert.match(r.text, /已确认落库 2 个任务/)
      assert.match(r.text, /task delete/)
      const t = rows('tasks').find(t => t.title === '整理测试任务与证据链接')
      assert.equal(t.evidenceUrl, 'https://example.com/capture')
      const prov = await ledger(A)
      assert.ok(prov.entries.some(e => e.kind === 'capture' && e.refs.some(r => r.id === t.id)))
      ids.capture = t.id
    })
    await probe('invalid-capture-whole-draft-zero-write', async () => {
      for (const payload of [
        { candidates: [{ title: '不会半写' }, { title: '坏日期', dueDate: '2026-02-30' }] },
        { candidates: [{ title: '坏链接', evidence: ['javascript:alert(1)'] }] },
        { candidates: [{ title: '越权', status: 'done' }] }, { plan: actions }, { candidates: [] },
      ]) {
        const before = business()
        await run(`capture-apply ${A} ${JSON.stringify(payload)}`, 'error')
        assert.equal(business(), before)
      }
    })
  })
  await suite('RA-P0004', async () => {
    await probe('attach-evidence-persist-provenance-no-status-auto-completion', async () => {
      const t = await task('挂证据', A)
      await run(`attach-evidence ${t.id} https://example.com/attach`, 'success')
      assert.equal(rec('tasks', t.id).status, 'todo')
      assert.equal(rec('tasks', t.id).progress, 0)
      assert.equal(rec('tasks', t.id).evidenceUrl, 'https://example.com/attach')
      assert.ok((await ledger(A)).entries.some(e => e.kind === 'capture' && e.refs.some(r => r.id === t.id)))
      const before = business()
      await run(`attach-evidence ${t.id} javascript:alert(1)`, 'error')
      assert.equal(business(), before)
    })
  })
  await suite('RA-P0005', async () => {
    await probe('same-session-merge-notes-and-project-isolation', async () => {
      await run(`session bind ${t1.id} s-qa-growth "追加 note"`, 'success')
      const sessionRows = rows('sessions').filter(s => s.taskId === t1.id && s.sessionId === 's-qa-growth')
      assert.equal(sessionRows.length, 1)
      assert.match(sessionRows[0].note, /真实会话材料/)
      assert.match(sessionRows[0].note, /追加 note/)
      sessionRecordSchema.parse(sessionRows[0])
      const b = json((await run(`session list ${B}`, 'success')).text)
      assert.ok(!JSON.stringify(b).includes(sessionRows[0].id))
      const notes = await run(`session notes ${t1.id}`, 'success')
      assert.match(notes.text, /追加 note/)
    })
  })
  await suite('RA-P0006', async () => {
    await probe('metric-ledger-independent-counts-and-empty-no-business-write', async () => {
      const entries = (await ledger(A)).entries
      const before = business()
      const met = json((await run(`metric ${A}`, 'success')).text)
      assert.equal(met.total, entries.length)
      assert.equal(met.appliedSteps, entries.flatMap(e => e.refs).filter(r => r.role === 'basis').length)
      const byKind = {}
      for (const e of entries) byKind[e.kind] = (byKind[e.kind] ?? 0) + 1
      assert.deepEqual(met.byKind, byKind)
      assert.equal(met.last, entries.map(e => e.createdAt).sort().at(-1))
      assert.equal(business(), before)
      const empty = json((await run(`metric ${B}`, 'success')).text)
      assert.equal(empty.total, 0)
      assert.equal(empty.last, null)
    })
  })
  await suite('RA-P0007', async () => {
    await probe('task-done-single-hook-idempotent-draft-human-edit-final', async () => {
      await run(`task update ${t1.id} ${JSON.stringify({ status: 'done' })}`, 'success')
      for (let i = 0; i < 100 && !rows('reflections').some(r => r.taskId === t1.id); i++) await sleep(20)
      const r = rows('reflections').find(r => r.taskId === t1.id)
      assert.ok(r && r.status === 'draft' && r.sourceEvent === 'task-done')
      const count = rows('reflections').filter(r => r.taskId === t1.id).length
      await run(`task update ${t1.id} ${JSON.stringify({ status: 'done' })}`, 'success')
      assert.equal(rows('reflections').filter(r => r.taskId === t1.id).length, count)
      await run(`reflect ${t1.id} edit "已核：材料已补齐\\n待核：客户评价\\n待补：真实签字"`, 'success')
      await run(`reflect ${t1.id} final`, 'success')
      assert.equal(rows('reflections').find(r => r.taskId === t1.id).status, 'final')
      ids.reflection = r.id
    })
    await probe('bare-done-honest-gap', async () => {
      const bare = await task('无材料完成', A)
      await run(`task update ${bare.id} {"status":"done"}`, 'success')
      const r = rows('reflections').find(r => r.taskId === bare.id)
      assert.ok(r.draft.gaps.length > 0)
      assert.match(JSON.stringify(r), /待补|待核/)
    })
    await probe('reflection-storage-failure-best-effort-keeps-task-save', async () => {
      const t = await task('反思写失败任务仍保存', A)
      const table = domain.table('reflections')
      const originalPut = table.put
      const warnings = []
      const originalWarn = console.warn
      table.put = async () => { throw new Error('QA_REFLECTION_STORAGE_FAILURE') }
      console.warn = (...args) => { warnings.push(args.map(String).join(' ')) }
      try {
        const result = await run(`task update ${t.id} {"status":"done"}`, 'success')
        for (let i = 0; i < 100 && !warnings.length; i++) await sleep(20)
        assert.equal(rec('tasks', t.id).status, 'done')
        assert.ok(!rows('reflections').some(r => r.taskId === t.id))
        assert.ok(warnings.some(w => w.includes('QA_REFLECTION_STORAGE_FAILURE') && w.includes('不阻断')))
        save('reflection-storage-failure.json', { task: rec('tasks', t.id), result, warnings,
          injection: '仅本进程真实 reflections table.put 故障；生产 task update 与 hook 未替换' })
      } finally {
        table.put = originalPut
        console.warn = originalWarn
      }
    })
  })
  await suite('RA-P0008', async () => {
    await probe('five-rules-boundaries-read-only-log-not-material', async () => {
      const over = await task('逾期未动检查', A, { dueDate: day(-1) })
      const soon = await task('D+2检查', A, { dueDate: day(2) })
      const partial = await task('done2of5', A, { status: 'done' })
      for (let i = 0; i < 5; i++) await run(`task checklist add ${partial.id} "项${i}"`, 'success')
      const list = rec('tasks', partial.id).checklist
      for (const item of list.slice(0, 2)) await run(`task checklist toggle ${partial.id} ${item.id} true`, 'success')
      const full = await task('进度100非done', A, { status: 'in_progress', progress: 100 })
      const narrative = await task('仅叙事done', A, { status: 'done' })
      await progressAppend(domain, narrative.id, { date: D, author: '测试甲', content: '叙事不是验收材料' })
      const before = business()
      const checks = json((await run(`check ${A}`, 'success')).text)
      const map = new Map(checks.map(r => [r.rule, r]))
      for (const rule of ['overdue-untouched', 'due-soon-untouched', 'done-open-checklist', 'done-missing-materials', 'progress-100-not-done']) assert.ok(map.has(rule), rule)
      assert.ok(checks.some(r => r.taskId === over.id))
      assert.ok(checks.some(r => r.taskId === soon.id && r.rule === 'due-soon-untouched'))
      assert.ok(checks.some(r => r.taskId === full.id && r.rule === 'progress-100-not-done'))
      assert.ok(checks.some(r => r.taskId === narrative.id && r.rule === 'done-missing-materials'))
      assert.match(JSON.stringify(checks), /最终.*人|人.*判断/)
      assert.equal(business(), before)
    })
  })
  const Q = await project('队列')
  const qNormal = await task('今日普通队列', Q, { dueDate: D })
  const qBlocked = await task('blocked队列', Q, { dueDate: day(-5), status: 'blocked' })
  const qP0 = await task('P0队列', Q, { dueDate: day(-2), priority: 'P0' })
  const qAbsent = await task('未跟进会话', Q)
  await run(`session bind ${qAbsent.id} s-absent "待跟进"`, 'success')
  await suite('RA-P1001', async () => {
    await probe('queue-list-snapshot-read-only-open-only-settings', async () => {
      const before = state()
      const r = json((await run(`queue list ${Q}`, 'success')).text)
      await run('web snapshot', 'success')
      assert.equal(state(), before)
      assert.equal(r.top.taskId, qBlocked.id)
      assert.equal(r.top.lateDays, 5)
      assert.equal(r.rest[0].taskId, qP0.id)
      assert.ok(r.rest.find(t => t.taskId === qAbsent.id).absent)
      const beforeB = business()
      await run(`queue open ${Q}`, 'success')
      assert.ok(domain.table('settings').get('pmQueueOpened').value[Q].at)
      assert.equal(business(), beforeB)
    })
    await probe('absence-only-folded-not-top', async () => {
      const pid = await project('仅缺席')
      const t = await task('仅缺席任务', pid)
      await run(`session bind ${t.id} absence-only`, 'success')
      const r = json((await run(`queue list ${pid}`, 'success')).text)
      save('queue-absence-only.json', r)
      assert.equal(r.top, null, 'K9 缺席只折叠列示，不应成为 Top1')
      assert.ok(r.rest.some(t => t.absent))
    })
  })
  await suite('RA-P1002', async () => {
    await probe('mute-normal-visible-critical-exempt-unmute', async () => {
      await run(`queue mute ${qNormal.id} 7`, 'success')
      const r = json((await run(`queue list ${Q}`, 'success')).text)
      assert.ok(r.rest.find(t => t.taskId === qNormal.id).muted)
      await run(`queue mute ${qBlocked.id} 7`, 'success')
      assert.equal(json((await run(`queue list ${Q}`, 'success')).text).top.taskId, qBlocked.id)
      await run(`queue unmute ${qNormal.id}`, 'success')
      assert.equal(json((await run(`queue list ${Q}`, 'success')).text).rest.find(t => t.taskId === qNormal.id).muted, false)
    })
  })
  await suite('RA-P1003', async () => {
    await probe('real-local-quiet-window-off-and-midnight-boundaries', async () => {
      await run('queue quiet 00:00 23:59', 'success')
      const r = json((await run(`queue list ${Q}`, 'success')).text)
      assert.equal(r.quietMode, true)
      assert.equal(r.top, null)
      assert.ok(r.rest.length >= 4)
      await run('queue quiet off', 'success')
      assert.equal(json((await run(`queue list ${Q}`, 'success')).text).quietMode, false)
      for (const [time, expected] of [['22:00', true], ['06:00', true], ['23:59', true], ['00:00', true], ['06:01', false], ['21:59', false]]) {
        assert.equal(inQuietWindow(time, '22:00', '06:00'), expected)
      }
    })
  })
  await suite('RA-P1004', async () => {
    await probe('snapshot-refresh-latest-values-zero-model-calls', async () => {
      const old = json((await run('web snapshot', 'success')).text)
      const n = gatewayCalls.length
      await run(`task update ${qNormal.id} {"description":"刷新后的当前值","progress":24}`, 'success')
      const before = state()
      const next = json((await run('web snapshot', 'success')).text)
      assert.equal(old.tasks.find(t => t.id === qNormal.id).progress, 0)
      assert.equal(next.tasks.find(t => t.id === qNormal.id).progress, 24)
      assert.equal(gatewayCalls.length, n)
      assert.equal(state(), before)
      save('snapshot-refresh.json', { oldTask: old.tasks.find(t => t.id === qNormal.id), nextTask: next.tasks.find(t => t.id === qNormal.id) })
    })
  })
  await suite('RA-P1005', async () => {
    await probe('milestone-deliverable-event-reflection-idempotent-and-bad-link-zero-write', async () => {
      await run(`task update ${t1.id} ${JSON.stringify({ milestoneId: ms.id, deliverableId: dlv.id })}`, 'success')
      await run(`milestone update ${ms.id} ${JSON.stringify({ status: 'achieved', achievedDate: D })}`, 'success')
      await run(`deliverable update ${dlv.id} {"status":"accepted"}`, 'success')
      for (const [sourceEvent, sourceId] of [['milestone-achieved', ms.id], ['deliverable-accepted', dlv.id]]) {
        const reflection = rows('reflections').find(r => r.sourceEvent === sourceEvent)
        assert.ok(reflection)
        assert.match(JSON.stringify(reflection.draft), /关联任务/)
        assert.match(JSON.stringify(reflection.draft), /来源任务一正常改名/)
        assert.equal(reflection.status, 'draft')
        const count = rows('reflections').length
        if (sourceEvent === 'milestone-achieved') await run(`milestone update ${sourceId} ${JSON.stringify({ status: 'achieved', achievedDate: D })}`, 'success')
        else await run(`deliverable update ${sourceId} {"status":"accepted"}`, 'success')
        assert.equal(rows('reflections').length, count)
      }
      const before = business()
      await run(`task update ${tb.id} ${JSON.stringify({ deliverableId: dlv.id })}`, 'error')
      await run(`task update ${t1.id} {"deliverableId":"dlv-999999"}`, 'error')
      assert.equal(business(), before)
    })
  })
  await suite('RA-P1006', async () => {
    await probe('legal-history-standard-restore-real-load-threshold', async () => {
      const long = await task('长时低进度', A, { startDate: day(-31), dueDate: day(-5), assignee: '测试甲', progress: 20 })
      const b = collectBackup(domain)
      b.tasks.find(t => t.id === long.id).updatedAt = iso(-8)
      await precheckBackup(b)
      await restoreBackupFromContent(domain, JSON.stringify(b), path.join(own, 'history-safety'))
      const tasks = rows('tasks').filter(t => t.projectId === A)
      const before = business()
      const facts = loadFacts(tasks, { today: D })
      const suggestions = stanceSuggestions(tasks, { today: D })
      const tags = staleStanceTags(tasks, { today: D })
      assert.ok(tags.some(t => t.taskId === long.id))
      assert.ok(suggestions.some(t => t.taskId === long.id && /建议供人决策/.test(t.reason)))
      assert.ok(facts.every(f => !('burnoutScore' in f) && !('wipLimit' in f)))
      assert.equal(business(), before)
      save('load-history.json', { tasks, facts, suggestions, tags })
    })
  })
  let objectiveA, objectiveB, foreignOkr, kr, habit, wrapped
  await suite('RA-P2004', async () => {
    await probe('okr-single-parent-soft-link-human-confirm-relation-negatives', async () => {
      await run(`okr add ${A} {"title":"主目标A","kind":"objective"}`, 'success')
      await run(`okr add ${A} {"title":"软目标B","kind":"objective"}`, 'success')
      await run(`okr add ${B} {"title":"异项目目标","kind":"objective"}`, 'success')
      objectiveA = rows('okrs').find(o => o.title === '主目标A')
      objectiveB = rows('okrs').find(o => o.title === '软目标B')
      foreignOkr = rows('okrs').find(o => o.title === '异项目目标')
      await run(`okr add ${A} ${JSON.stringify({ title: 'KR单父软联', kind: 'key-result', primaryOkrId: objectiveA.id, relatedOkrIds: [objectiveB.id] })}`, 'success')
      kr = rows('okrs').find(o => o.title === 'KR单父软联')
      const tree = buildOkrTree(rows('okrs').filter(o => o.projectId === A))
      const child = tree.tree.find(o => o.id === objectiveA.id).children.find(o => o.id === kr.id)
      assert.equal(child.weightGroup, objectiveA.id)
      assert.equal(child.relatedTargets[0].id, objectiveB.id)
      assert.equal(tree.tree.find(o => o.id === objectiveB.id).children.length, 0)
      await run(`okr update ${kr.id} {"status":"confirmed"}`, 'success')
      for (const patch of [{ primaryOkrId: kr.id }, { relatedOkrIds: [kr.id] }, { primaryOkrId: foreignOkr.id }, { relatedOkrIds: [foreignOkr.id] }, { relatedOkrIds: ['okr-not-found'] }]) {
        const before = business()
        await run(`okr update ${kr.id} ${JSON.stringify(patch)}`, 'error')
        assert.equal(business(), before)
      }
      Object.assign(ids, { objectiveA: objectiveA.id, objectiveB: objectiveB.id, foreignOkr: foreignOkr.id, kr: kr.id })
    })
  })
  await suite('RA-P2003', async () => {
    await probe('okr-suggest-confirm-ignore-repeat-clear-preserves-pending-other-project', async () => {
      const count = rows('okrs').length
      for (const title of ['建议确认KR', '建议忽略KR', '建议待处理KR']) await run(`okr suggest ${A} ${JSON.stringify({ title, kind: 'key-result', primaryOkrId: objectiveA.id, rationale: '生产建议来源' })}`, 'success')
      await run(`okr suggest ${B} {"title":"异项目pending","kind":"objective"}`, 'success')
      assert.equal(rows('okrs').length, count)
      const inbox = domain.table('settings').get('pmOkrInbox').value.entries
      const confirm = inbox.find(s => s.title === '建议确认KR')
      const ignore = inbox.find(s => s.title === '建议忽略KR')
      await run(`okr confirm ${confirm.id}`, 'success')
      await run(`okr ignore ${ignore.id}`, 'success')
      assert.equal(rows('okrs').find(o => o.title === '建议确认KR').status, 'draft')
      const before = business()
      await run(`okr confirm ${confirm.id}`, 'error')
      assert.equal(business(), before)
      await run(`okr inbox ${A} clear`, 'success')
      const remaining = domain.table('settings').get('pmOkrInbox').value.entries
      assert.ok(remaining.some(s => s.title === '建议待处理KR'))
      assert.ok(remaining.some(s => s.title === '异项目pending'))
      assert.ok(!remaining.some(s => s.id === confirm.id || s.id === ignore.id))
      await run(`okr suggest ${A} ${JSON.stringify({ title: '跨项目确认负例', kind: 'key-result', primaryOkrId: foreignOkr.id })}`, 'success')
      const bad = domain.table('settings').get('pmOkrInbox').value.entries.find(s => s.title === '跨项目确认负例')
      const beforeBad = business()
      await run(`okr confirm ${bad.id}`, 'error')
      assert.equal(business(), beforeBad)
    })
  })
  await suite('RA-P2005', async () => {
    await probe('human-wrapped-stats-queue-check-load-no-reflect-ai-rejected', async () => {
      wrapped = await task('人工收尾非完成', A, { dueDate: day(-4), progress: 20, assignee: '测试甲' })
      await run(`task checklist add ${wrapped.id} "未勾事实"`, 'success')
      const reflCount = rows('reflections').length
      await run(`task update ${wrapped.id} {"status":"wrapped"}`, 'success')
      assert.equal(rows('reflections').length, reflCount)
      assert.equal(rec('tasks', wrapped.id).checklist[0].done, false)
      const queue = json((await run(`queue list ${A}`, 'success')).text)
      assert.ok(![queue.top, ...queue.rest].filter(Boolean).some(t => t.taskId === wrapped.id))
      assert.ok(!json((await run(`check ${A}`, 'success')).text).some(t => t.taskId === wrapped.id))
      assert.match((await run(`stats ${A}`, 'success')).text, /已收尾/)
      const facts = loadFacts([rec('tasks', wrapped.id)], { today: D })
      assert.ok(facts.every(f => f.doneCount === 0 && f.openCount === 0))
      const before = business()
      await run(`ask-apply ${A} ${JSON.stringify([{ op: 'task.update', id: wrapped.id, patch: { status: 'wrapped' } }])}`, 'success')
      assert.equal(business(), before)
      ids.wrapped = wrapped.id
    })
  })
  await suite('RA-P2006', async () => {
    await probe('lesson-real-source-marks-edit-human-final', async () => {
      await run(`lesson add ${A} ${JSON.stringify({ taskId: wrapped.id, markdown: '原因：需求变化\n待核：工时偏差\n待补：客户记录' })}`, 'success')
      const lesson = rows('lessons').find(l => l.taskId === wrapped.id)
      assert.equal(lesson.status, 'draft')
      assert.deepEqual(lesson.lines.map(l => l.mark), ['known', 'pending', 'blank'])
      await run(`lesson edit ${lesson.id} "原因：补充已核材料"`, 'success')
      await run(`lesson final ${lesson.id}`, 'success')
      assert.equal(rec('lessons', lesson.id).status, 'final')
      ids.lesson = lesson.id
    })
  })
  const exportDir = path.join(process.env.DSH_PM_ISOLATED_ROOT, 'exports', 'outbound')
  await suite('RA-P2001', async () => {
    await probe('three-exports-safe-static-snapshot-overwrite-only-confirm', async () => {
      await run(`task update ${qNormal.id} ${JSON.stringify({ title: '<script>alert(1)</script>注入源' })}`, 'success')
      for (const format of ['markdown', 'web', 'plain']) await run(`export ${format} ${Q} outbound`, 'success')
      const outputs = fs.readdirSync(exportDir).map(f => ({ f, text: fs.readFileSync(path.join(exportDir, f), 'utf8') }))
      const web = outputs.find(o => o.f.endsWith('.html'))
      const plain = outputs.find(o => o.f.endsWith('.txt'))
      assert.match(web.text, /只读快照.*非实时数据|只读快照[\s\S]*非实时数据/)
      assert.doesNotMatch(web.text, /<script|<link\b|<iframe\b/i)
      assert.match(web.text, /&lt;script&gt;/)
      assert.doesNotMatch(plain.text, /<!doctype|<html\b|<body\b/i)
      const frozen = hash(web.text)
      await run(`task update ${qNormal.id} {"title":"导出后改名"}`, 'success')
      assert.equal(hash(fs.readFileSync(path.join(exportDir, web.f), 'utf8')), frozen)
      await run(`export web ${Q} outbound`, 'error')
      await run(`export web ${Q} outbound confirm`, 'success')
      assert.notEqual(hash(fs.readFileSync(path.join(exportDir, web.f), 'utf8')), frozen)
      save('outbound-files.json', outputs)
    })
  })
  await suite('RA-P2002', async () => {
    await probe('standard-backup-history-31-29-real-export-archive-append-only', async () => {
      const b = collectBackup(domain)
      const audit = domain.table('settings').get('pmExportAudit').value
      const old = { at: iso(-31), projectId: A, format: 'web', targetPath: path.join(own, 'historical-old.html') }
      const recent = { at: iso(-29), projectId: A, format: 'web', targetPath: path.join(own, 'historical-recent.html') }
      const update = (key, value) => {
        const idx = b.extra.settings.findIndex(([k]) => k === key)
        const pair = [key, { value, updatedAt: new Date().toISOString() }]
        if (idx >= 0) b.extra.settings[idx] = pair
        else b.extra.settings.push(pair)
      }
      update('pmExportSent', [old, recent])
      const historicalAudit = { ...old, itemCount: 1 }
      update('pmExportAudit', [...audit, historicalAudit])
      update('pmQueueMute', { [qNormal.id]: { mutedAt: iso(-8), ttlDays: 7 } })
      await precheckBackup(b)
      await restoreBackupFromContent(domain, JSON.stringify(b), path.join(own, 'outbound-history-safety'))
      const before = business()
      await run(`export web ${A} outbound-history`, 'success')
      assert.equal(business(), before)
      const active = domain.table('settings').get('pmExportSent').value
      const archived = domain.table('settings').get('pmExportSentArchive').value
      assert.ok(active.some(e => e.targetPath === recent.targetPath))
      assert.ok(!active.some(e => e.targetPath === old.targetPath))
      assert.ok(archived.some(e => e.targetPath === old.targetPath))
      const auditNow = domain.table('settings').get('pmExportAudit').value
      assert.deepEqual(auditNow.slice(0, audit.length + 1), [...audit, historicalAudit])
      assert.equal(auditNow.length, audit.length + 2)
      await run(`export audit ${A}`, 'success')
      await run(`export sent ${A}`, 'success')
      const mute = json((await run(`queue list ${Q}`, 'success')).text)
      assert.ok(![mute.top, ...mute.rest].filter(Boolean).find(t => t.taskId === qNormal.id).muted)
      save('export-history.json', { old, recent, active, archived, auditNow, mute })
    })
  })
  await suite('RA-P2007', async () => {
    await probe('archive-review-readonly-no-outbound-audit-wrapped-not-done', async () => {
      const before = state()
      const dir = path.join(process.env.DSH_PM_ISOLATED_ROOT, 'exports', 'archive-minimal')
      await run(`archive ${A} archive-minimal`, 'success')
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
      assert.equal(pkg.origin, 'pm-tool')
      assert.ok(pkg.tasks.length > 0)
      assert.match(fs.readFileSync(path.join(dir, 'README-字段说明.md'), 'utf8'), /字段/)
      const review = await run(`review ${A} ${day(-7)} ${D}`, 'success')
      const output = json(review.text)
      assert.equal(output.tasks.find(t => t.id === wrapped.id).done, false)
      assert.match(review.text, /做了什么/)
      assert.match(review.text, /量化结果/)
      assert.match(review.text, /关键产出/)
      assert.equal(state(), before)
      save('archive-review.json', { pkg, review })
    })
  })
  await suite('RA-P3001', async () => {
    await probe('habit-inbox-confirm-ignore-repeat-no-auto-final', async () => {
      const count = rows('habits').length
      for (const title of ['习惯确认建议', '习惯忽略建议']) await run(`habit suggest ${A} ${JSON.stringify({ title, rationale: '关联目标观察', okrId: objectiveA.id })}`, 'success')
      assert.equal(rows('habits').length, count)
      const inbox = domain.table('settings').get('pmHabitInbox').value.entries
      const c = inbox.find(s => s.title === '习惯确认建议')
      const i = inbox.find(s => s.title === '习惯忽略建议')
      await run(`habit confirm ${c.id}`, 'success')
      await run(`habit ignore ${i.id}`, 'success')
      habit = rows('habits').find(h => h.title === '习惯确认建议')
      assert.equal(habit.status, 'draft')
      assert.equal(habit.okrId, objectiveA.id)
      const before = business()
      await run(`habit confirm ${c.id}`, 'error')
      assert.equal(business(), before)
      assert.equal(domain.table('settings').get('pmHabitInbox').value.entries.find(s => s.id === i.id).status, 'ignored')
      ids.habit = habit.id
    })
  })
  await suite('RA-P3002', async () => {
    await probe('real-date-production-checkin-two-day-window-repeat-zero-write', async () => {
      for (const n of [0, -1, -2]) await run(`habit checkin ${habit.id} ${day(n)}`, 'success')
      const after = rec('habits', habit.id)
      assert.equal(after.checkIns.length, 3)
      assert.equal(after.checkIns.find(c => c.at === D).backfilled, false)
      assert.ok(after.checkIns.filter(c => c.at !== D).every(c => c.backfilled))
      const before = business()
      await run(`habit checkin ${habit.id} ${day(-1)}`, 'success')
      await run(`habit checkin ${habit.id} ${day(1)}`, 'error')
      await run(`habit checkin ${habit.id} ${day(-3)}`, 'error')
      assert.equal(business(), before)
      assert.equal(rec('habits', habit.id).streak.current, 3)
    })
  })
  await suite('RA-P3004', async () => {
    await probe('habit-okr-update-readonly-aggregate-human-final-idempotent-negatives', async () => {
      await run(`habit update ${habit.id} ${JSON.stringify({ okrId: objectiveB.id, goal: '已批准目标' })}`, 'success')
      assert.equal(rec('habits', habit.id).okrId, objectiveB.id)
      for (const okrId of [foreignOkr.id, 'okr-missing']) {
        const before = business()
        await run(`habit update ${habit.id} ${JSON.stringify({ okrId })}`, 'error')
        assert.equal(business(), before)
      }
      const before = business()
      const snap = json((await run('web snapshot', 'success')).text)
      assert.equal(snap.habits.filter(h => h.okrId === objectiveB.id).length, 1)
      assert.equal(business(), before)
      await run(`habit final ${habit.id}`, 'success')
      const final = business()
      await run(`habit final ${habit.id}`, 'success')
      assert.equal(business(), final)
      assert.equal(rec('habits', habit.id).status, 'final')
    })
  })
  await suite('RA-P3003', async () => {
    await probe('legal-multimonth-history-standard-backup-precheck-restore-streak', async () => {
      const H = await project('习惯多月档案')
      await run(`habit add ${H} {"title":"合法多月档案"}`, 'success')
      const historical = rows('habits').find(h => h.projectId === H)
      const dates = [-65, -64, -63, -35, -34, -33, -14, -13, -8, -7, -6, -2, -1, 0].map(day)
      const record = habitRecordSchema.parse({
        ...historical, createdAt: iso(-70),
        checkIns: dates.map(at => ({ at, backfilled: false, note: '标准备份历史导入' })),
        streak: deriveHabitStreak({ checkIns: dates.map(at => ({ at })) }, D),
      })
      const b = collectBackup(domain)
      b.extra.habits = b.extra.habits.map(([id, value]) => [id, id === record.id ? record : value])
      await precheckBackup(b)
      await restoreBackupFromContent(domain, JSON.stringify(b), path.join(own, 'habit-history-safety'))
      await backup('F7', 'F7-backup')
      const actual = rec('habits', record.id)
      assert.equal(actual.checkIns.length, 14)
      const s0 = deriveHabitStreak(actual, D)
      const s3 = deriveHabitStreak(actual, day(3))
      assert.deepEqual(s0, { current: 3, lastDate: D, longest: 3, totalDays: 14 })
      assert.deepEqual(s3, { current: 0, lastDate: D, longest: 3, totalDays: 14 })
      assert.ok(actual.checkIns.some(c => c.at === day(-13)))
      assert.ok(actual.checkIns.some(c => c.at === day(-14)))
      const before = business()
      await run(`habit list ${H}`, 'success')
      assert.equal(business(), before)
      ids.historyHabit = record.id
      save('F7-expected.json', { id: record.id, dates, today: D, current: s0, after3Days: s3 })
    })
  })
  await suite('RA-P3005', async () => {
    await probe('cycle-hook-disabled-real-return-no-timer-registration', async () => {
      assert.deepEqual(CYCLE_HOOKS, ['daily-archive', 'quarterly-review'])
      for (const hook of CYCLE_HOOKS) {
        assert.equal(cycleHookPoint(hook, domain, D).enabled, false)
      }
      const source = fs.readFileSync(path.join(process.env.QA_PACKAGE, 'src/core/cycle-hooks.ts'), 'utf8')
      const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      assert.doesNotMatch(code, /\b(?:setInterval|setTimeout|schedule)\s*\(/)
      const before = state()
      await run('web snapshot', 'success')
      assert.equal(state(), before)
    })
  })
  currentId = 'FIXTURE'
  await probe('F5-standard-createBackup-precheck-and-empty-target-restore', async () => {
    await backup('F5', 'F5-backup')
    const fixture = JSON.parse(fs.readFileSync(path.join(own, 'F5-fixture.json'), 'utf8'))
    const empty = await context(path.join(own, 'F5-empty-target'))
    await restoreBackup(empty.domain, fixture.path, path.join(own, 'F5-target-backups'))
    const restored = collectBackup(empty.domain, '2026-01-01T00:00:00.000Z')
    for (const table of Object.keys(restored.extra)) restored.extra[table].sort(([a], [z]) => a.localeCompare(z))
    assert.deepEqual(restored, JSON.parse(state()))
    save('F5-empty-target-restore.json', { status: 'PASS', fixture, sessionsNotInBackup: true,
      note: '生产 EXTRA_BACKUP_TABLES 不含 sessions；原库 session 实测另以新进程回读。F5 不伪造全表备份承诺。' })
  })
  save('ids.json', ids)
  save('expected.json', { state: state(), sessions: Object.fromEntries(rows('sessions').map(r => [r.id, r])),
    undoHandle, ids, today: D })
  save('gateway-calls.json', gatewayCalls)
  save('results.json', results)
  console.log(JSON.stringify({ date: D, passed: results.filter(r => r.status === 'PASS').length,
    failed: results.filter(r => r.status === 'FAIL').length, blocked: results.filter(r => r.status === 'BLOCKED').length, ids }, null, 2))
  process.exitCode = results.some(r => r.status !== 'PASS') ? 1 : 0
}

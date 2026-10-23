import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = path.join(repo, 'docs/testing/ai-remaining-gui-review-20261022-r1')
const root = path.join(repo, 'reports/all-pending-evidence-20261021/AIremainingR1')
const freeze = '/private/tmp/pmtool-u4-closure-20261022-r2'
const read = p => fs.readFileSync(p)
const json = p => JSON.parse(read(p))
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const fingerprint = p => ({ bytes: read(p).length, sha256: sha(read(p)), mtimeMs: fs.statSync(p).mtimeMs })
const save = (suffix, value) => fs.writeFileSync(prefix + suffix, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const index = json(path.join(root, 'index.json'))
const binding = json(path.join(root, 'source-binding.json'))
const contracts = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/final-remaining-acceptance-reconcile-20261022.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/a16-extension-selection-gui-review-20261022.md',
  'docs/testing/a16-extension-selection-gui-review-20261022-plan.md',
  'docs/testing/a16-pc-gui-independent-review-20261022.md',
  'docs/testing/a16-extension-base-independent-retest-20261022.md',
  'docs/testing/ai-terminal-failure-20261022-report.md',
  'docs/testing/ai-terminal-failure-20261022-r1-fixture-review.md',
]
const frozenExtra = [
  'packages/dsh-pm-tool/lib/client.js', 'packages/dsh-pm-tool/lib/core/ai-client.js',
  'packages/dsh-pm-tool/src/core/ai-client.ts', 'packages/dsh-pm-tool/src/core/copilot.ts',
  'packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx',
]
const frozenDeclared = Object.keys(binding.source).filter(p => p.startsWith('packages/'))
const launcherDeclared = Object.keys(binding.source).filter(p => p.startsWith('launcher/'))
const protectedPaths = [...new Set([
  path.join(root, 'index.json'),
  ...Object.keys(index.files).map(p => path.join(root, p)),
  ...frozenDeclared.map(p => path.join(freeze, p)),
  ...frozenExtra.map(p => path.join(freeze, p)),
  ...contracts.map(p => path.join(repo, p)),
])]
assert.equal(Object.keys(index.files).length, 506)
assert.equal(Object.keys(binding.source).length, 102)
assert.equal(frozenDeclared.length, 87)
assert.equal(launcherDeclared.length, 15)
assert.equal(binding.candidate, freeze)
for (const live of index.liveLogsExcluded) assert(!Object.hasOwn(index.files, live))

const roots = name => json(path.join(root, name + '-roots.json'))
const business = r => Object.fromEntries(Object.entries(r).filter(([p]) =>
  (p.startsWith('data/pmtool/') && !p.startsWith('data/pmtool/settings/')) ||
  p.startsWith('files/') || p.startsWith('backups/')))
const difference = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const record = (name, table, id) => json(path.join(root, name + '-raw/data/pmtool', table, id + '.json')).record
const ledger = name => {
  const p = path.join(root, name + '-raw/data/pmtool/settings/pmProvenanceLedger.json')
  return fs.existsSync(p) ? json(p).record.value.entries : []
}
const ui = name => json(path.join(root, name + '.json'))
const fieldDiff = (a, b) => difference(a, b)

function audit() {
  const result = { at: new Date().toISOString(), runtime: process.version, index: {}, source: {}, snapshots: [],
    commands: [], comparisons: [], model: {}, regen: {}, create: {}, mixed: {}, gaps: [] }
  for (const [rel, expected] of Object.entries(index.files)) {
    const b = read(path.join(root, rel))
    assert.equal(b.length, expected.bytes, rel)
    assert.equal(sha(b), expected.sha256, rel)
  }
  result.index = { count: 506, sha256: sha(read(path.join(root, 'index.json'))), drift: 0,
    liveLogsExcluded: index.liveLogsExcluded }
  for (const rel of frozenDeclared) assert.equal(sha(read(path.join(freeze, rel))), binding.source[rel], rel)
  const launcherReadback = launcherDeclared.map(rel => ({
    rel, expected: binding.source[rel], actual: sha(read(path.join(repo, rel))),
  }))
  for (const p of launcherReadback) assert.equal(p.actual, p.expected)
  const client = read(path.join(freeze, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=[^\r\n]+(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const loaded = read(path.join(root, 'loaded-complete.js'))
  const first = loaded.indexOf(segment)
  assert(first >= 0)
  assert.equal(loaded.indexOf(segment, first + 1), -1)
  assert.equal(sha(client), json(path.join(root, 'host-start.json')).bundleSha256)
  result.source = { baseline: binding.baseline, freeze, declaredCount: 102, frozenInputCount: 87,
    frozenDrift: 0, launcherReadback, launcherFrozen: false,
    sourceBindingSha: sha(read(path.join(root, 'source-binding.json'))),
    clientBytes: client.length, clientSha: sha(client), loadedBytes: loaded.length, loadedSha: sha(loaded),
    segmentBytes: segment.length, segmentSha: sha(segment), first, second: -1,
    host: json(path.join(root, 'host-start.json')), gateway: json(path.join(root, 'gateway-r2-start.json')),
    page: json(path.join(root, '29-page-binding.json')) }
  result.gaps.push('loaded-complete lacks independent archived load request/frame/cache/wire timestamp metadata')

  let rawCount = 0
  for (const rel of Object.keys(index.files).filter(p => p.endsWith('-roots.json'))) {
    const name = rel.slice(0, -'-roots.json'.length), r = roots(name)
    const expectedRaw = Object.keys(r).filter(p => p.startsWith('data/pmtool/'))
    const declaredRaw = Object.keys(index.files).filter(p => p.startsWith(name + '-raw/'))
    assert.deepEqual(declaredRaw.map(p => p.slice((name + '-raw/').length)).sort(), expectedRaw.sort())
    for (const p of expectedRaw) {
      const b = read(path.join(root, name + '-raw', p))
      assert.equal(b.length, r[p].bytes, name + '/' + p)
      assert.equal(sha(b), r[p].sha256, name + '/' + p)
      rawCount++
    }
    const state = ui(name)
    assert.equal(state.origin, 'http://127.0.0.1:3258')
    assert.equal(state.timeOrigin, 1792665502639.1)
    result.snapshots.push({ name, at: state.at, timeOrigin: state.timeOrigin, viewport: state.viewport,
      dark: state.dark, rootCount: Object.keys(r).length, pmtoolRaw: expectedRaw.length,
      businessCount: Object.keys(business(r)).length,
      nonBusinessPaths: Object.keys(r).filter(p => !Object.hasOwn(business(r), p)) })
  }
  result.rawCount = rawCount

  const requests = new Map(), responses = new Map()
  for (const rel of Object.keys(index.files).filter(p => /^\d.*events\.json$/.test(p))) {
    const events = json(path.join(root, rel))
    for (const e of events) {
      if (e.method === 'Network.requestWillBeSent') {
        if (requests.has(e.requestId)) assert.deepEqual(requests.get(e.requestId).event, e)
        else requests.set(e.requestId, { file: rel, event: e })
      }
      if (e.method === 'Network.responseReceived') {
        if (responses.has(e.requestId)) assert.deepEqual(responses.get(e.requestId).event, e)
        else responses.set(e.requestId, { file: rel, event: e })
      }
    }
  }
  for (const [id, q] of requests) {
    const s = responses.get(id)
    if (!s?.event.body?.body) { result.gaps.push('missing command response ' + id); continue }
    const response = JSON.parse(s.event.body.body)
    assert.equal(q.event.body.rpcId, response.rpcId)
    result.commands.push({ file: q.file, responseFile: s.file, requestId: id, rpcId: response.rpcId,
      drainAt: q.event.at, line: q.event.body.payload.args.line, status: s.event.status,
      commandId: response.result?.value?.commandId, result: response.result?.value?.result })
  }
  const command = p => {
    const rows = result.commands.filter(c => c.file === p && c.line.startsWith('/pm ask-apply '))
    assert.equal(rows.length, 1)
    return rows[0]
  }
  const parseApply = c => {
    const m = c.line.match(/^\/pm ask-apply (\S+) (.+) --base (.+)$/)
    assert(m)
    return { projectId: m[1], actions: JSON.parse(m[2]), base: JSON.parse(m[3]) }
  }
  const noBusiness = (a, b) => {
    const changed = difference(business(roots(a)), business(roots(b)))
    assert.deepEqual(changed, [], a + ' -> ' + b)
    result.comparisons.push({ a, b, businessChanged: changed, otherChanged: difference(roots(a), roots(b)) })
  }
  for (const [a, b] of [
    ['02-task-created', '05-first-valid-draft'],
    ['05-first-valid-draft', '06-first-draft-cancelled'],
    ['06-first-draft-cancelled', '07-normal-external-draft'],
    ['08-normal-external-saved', '09-regenerated-draft'],
    ['10-regenerated-applied', '11-four-create-draft'],
    ['12-four-create-applied', '13-created-milestone'],
    ['13-created-milestone', '14-created-risk'],
    ['14-created-risk', '15-created-deliverable'],
    ['15-created-deliverable', '16-created-meeting'],
    ['18-delete-reject-before', '18-delete-reject-after-observed'],
    ['19-unknown-reject-before', '19-unknown-reject-after'],
    ['20-material-array-reject-before', '20-material-array-reject-after'],
    ['21-wrapped-reject-before', '21-wrapped-reject-after'],
    ['22-cross-project-reject-before', '22-cross-project-reject-after'],
    ['23-mixed-before-confirm', '24-mixed-filtered-draft'],
    ['26-auth-before', '26-auth-after'], ['27-rate-before', '27-rate-after'],
    ['27-rate-after', '28-normal-recovered'], ['28-normal-recovered', '29-final-current'],
  ]) noBusiness(a, b)
  for (const [a, b] of [
    ['05-first-valid-draft', '06-first-draft-cancelled'],
    ['10-regenerated-applied', '11-four-create-draft'],
    ['18-delete-reject-before', '18-delete-reject-after-observed'],
    ['19-unknown-reject-before', '19-unknown-reject-after'],
    ['20-material-array-reject-before', '20-material-array-reject-after'],
    ['21-wrapped-reject-before', '21-wrapped-reject-after'],
    ['22-cross-project-reject-before', '22-cross-project-reject-after'],
    ['23-mixed-before-confirm', '24-mixed-filtered-draft'],
    ['26-auth-before', '26-auth-after'], ['27-rate-before', '27-rate-after'],
    ['27-rate-after', '28-normal-recovered'],
  ]) assert.deepEqual(ledger(a), ledger(b), 'ledger ' + a + ' -> ' + b)

  const oldTask = record('07-normal-external-draft', 'tasks', 't-0001')
  const manual = record('08-normal-external-saved', 'tasks', 't-0001')
  assert.deepEqual(fieldDiff(oldTask, manual), ['assignee', 'manualProgress', 'updatedAt'])
  assert.equal(Object.hasOwn(oldTask, 'manualProgress'), false)
  assert.equal(manual.manualProgress, null)
  assert.equal(manual.progress, oldTask.progress)
  const manualCommand = result.commands.find(c => c.file === '08-normal-external-events-events.json' &&
    c.line.startsWith('/pm task update t-0001 '))
  assert(manualCommand)
  assert.equal(JSON.parse(manualCommand.line.slice('/pm task update t-0001 '.length)).manualProgress, null)
  assert.equal(manual.updatedAt, '2026-10-22T10:49:11.960Z')
  const regenCommand = command('10-apply-real-base-events.json'), regenApply = parseApply(regenCommand)
  assert.deepEqual(regenApply.base, { 't-0001': manual.updatedAt })
  assert.equal(regenApply.actions.length, 1)
  assert.match(regenCommand.result.text, /^已应用 1 步/)
  const appliedTask = record('10-regenerated-applied', 'tasks', 't-0001')
  assert.deepEqual(fieldDiff(manual, appliedTask), ['assignee', 'updatedAt'])
  assert.equal(appliedTask.assignee, regenApply.actions[0].patch.assignee)
  result.regen = { oldTask, manual, manualCommand, appliedTask, command: regenCommand, apply: regenApply }

  const extensions = [['milestones', 'm-0001'], ['risk_issues', 'ri-0001'],
    ['deliverables', 'dlv-0001'], ['meetings', 'mtg-0001']]
  const createCommand = command('12-four-create-real-apply-events.json'), createApply = parseApply(createCommand)
  assert.match(createCommand.result.text, /^已应用 4 步/)
  assert.equal(createApply.actions.length, 4)
  const created = extensions.map(([table, id], i) => {
    const rec = record('12-four-create-applied', table, id)
    assert.equal(rec.id, id); assert.equal(rec.projectId, 'p-0001')
    assert.equal(rec.createdAt, rec.updatedAt)
    for (const [k, v] of Object.entries(createApply.actions[i].patch)) assert.deepEqual(rec[k], v)
    return { table, id, record: rec }
  })
  assert.deepEqual(difference(business(roots('11-four-create-draft')), business(roots('12-four-create-applied'))),
    extensions.map(([t, id]) => `data/pmtool/${t}/${id}.json`).sort())
  result.create = { command: createCommand, apply: createApply, created }

  const mixedCommand = command('25-mixed-applied-only-events.json'), mixedApply = parseApply(mixedCommand)
  assert.equal(mixedApply.actions.length, 1)
  assert.equal(mixedApply.actions[0].op, 'risk.update')
  assert.equal(mixedApply.actions[0].id, 'ri-0001')
  assert.match(mixedCommand.result.text, /^已应用 1 步/)
  const oldRisk = record('24-mixed-filtered-draft', 'risk_issues', 'ri-0001')
  const newRisk = record('25-mixed-applied-only', 'risk_issues', 'ri-0001')
  assert.deepEqual(fieldDiff(oldRisk, newRisk), ['responsePlan', 'updatedAt'])
  assert.deepEqual(difference(business(roots('24-mixed-filtered-draft')), business(roots('25-mixed-applied-only'))),
    ['data/pmtool/risk_issues/ri-0001.json'])
  assert.deepEqual(mixedApply.base, Object.fromEntries([
    ['tasks', 't-0001'], ...extensions,
  ].map(([table, id]) => [id, record('24-mixed-filtered-draft', table, id).updatedAt])))
  result.mixed = { command: mixedCommand, apply: mixedApply, oldRisk, newRisk,
    rejectedVisibleText: ui('24-mixed-filtered-draft').sidecar.match(/已拒绝：[^\n]+/g) }

  result.provenance = []
  for (const [before, after, targets, kind] of [
    ['09-regenerated-draft', '10-regenerated-applied', [['tasks', 't-0001']], 'update'],
    ['11-four-create-draft', '12-four-create-applied', extensions, 'create'],
    ['24-mixed-filtered-draft', '25-mixed-applied-only', [['risk_issues', 'ri-0001']], 'update'],
  ]) {
    const old = ledger(before), next = ledger(after)
    assert.deepEqual(next.slice(0, old.length), old)
    assert.equal(next.length, old.length + 1)
    const entry = next.at(-1)
    assert.deepEqual(entry.refs.map(r => [r.table, r.id]), targets)
    assert.deepEqual(entry.undo.postimages.map(r => [r.table, r.id]), targets)
    for (const r of entry.refs) {
      assert.equal(r.projectId, 'p-0001')
      assert.equal(r.updatedAt, record(after, r.table, r.id).updatedAt)
    }
    for (const post of entry.undo.postimages) {
      assert.equal(post.kind, kind)
      assert.equal(post.postimage.updatedAt, record(after, post.table, post.id).updatedAt)
    }
    result.provenance.push({ before, after, entry })
  }
  const modelRows = read(path.join(root, 'frozen-gateway-log/gateway.r2-requests.ndjson'))
    .toString().trim().split('\n').map(JSON.parse)
  assert.equal(modelRows.length, 14)
  result.model = { requests: modelRows, responses: read(path.join(root,
    'frozen-gateway-log/gateway.r2-events.ndjson')).toString().trim().split('\n').map(JSON.parse) }
  const fixtures = ['03-ai04-first', '03-ai04-first', '11-four-create', '18-delete-reject',
    '19-unknown-reject', '20-material-array-reject', '21-wrapped-reject',
    '22-cross-project-reject', '23-mixed-valid-rejected']
  for (let i = 0; i < fixtures.length; i++) {
    assert.deepEqual(modelRows[i].fixture, json(path.join(root, fixtures[i] + '-model-fixture.json')))
    assert.equal(modelRows[i].path, '/v1/messages')
    assert.equal(modelRows[i].body.stream, true)
  }
  assert.match(JSON.stringify(modelRows[1].body.messages), /AI04 再生成前人工负责人/)
  for (const [file, sequence] of [['05-first-valid-ask-events.json', 1],
    ['09-regenerated-request-events.json', 2], ['11-four-create-ask-events.json', 3],
    ['19-unknown-reject-events.json', 5], ['20-material-array-reject-events.json', 6],
    ['21-wrapped-reject-events.json', 7], ['22-cross-project-reject-events.json', 8],
    ['23-mixed-ask-events.json', 9]]) {
    const c = result.commands.filter(r => r.file === file && r.line.startsWith('/pm ask '))
    assert.equal(c.length, 1)
    assert.equal(c[0].result.text, modelRows[sequence - 1].fixture.text)
  }
  result.gaps.push('18-delete command request/response events empty; archived model BODY and UI/raw only')
  result.executions = json(path.join(root, 'execution-index.json'))
  assert.equal(result.executions.length, 19)
  assert.equal(result.executions.filter(e => e.exitCode === 1).length, 6)
  for (const e of result.executions) assert.deepEqual(e, json(path.join(root, 'executions', e.executionId + '.json')))
  save('-audit.json', result)
  console.log(JSON.stringify({ files: 506, source: 102, snapshots: result.snapshots.length, rawCount,
    commands: result.commands.length, executions: 19, originalFailures: 6, audit: 'file assertions complete' }))
}

switch (process.argv[2]) {
  case 'before':
    save('-before.json', { at: new Date().toISOString(), excluded: index.liveLogsExcluded,
      files: Object.fromEntries(protectedPaths.map(p => [p, fingerprint(p)])) })
    console.log('只读输入保护清单已记录')
    break
  case 'audit':
    audit()
    break
  case 'supplement': {
    const a = json(prefix + '-audit.json'), checks = []
    for (const [from, to] of [['07-normal-external-draft', '08-normal-external-saved'],
      ['09-regenerated-draft', '10-regenerated-applied']]) {
      const changed = difference(business(roots(from)), business(roots(to)))
      assert.deepEqual(changed, ['data/pmtool/tasks/t-0001.json'])
      checks.push({ from, to, changed })
    }
    for (const [sequence, apply] of [[2, a.regen.apply], [3, a.create.apply]]) {
      const text = a.model.requests[sequence - 1].fixture.text
      const plan = JSON.parse(text.match(/```json\n([\s\S]+)\n```/)[1]).plan
      const actions = plan.map(s => ({ ...s.action, stepId: s.stepId, title: s.title, needs: s.needs }))
      assert.deepEqual(apply.actions, actions)
    }
    assert.equal(a.mixed.apply.actions[0].stepId, 's1')
    assert.equal(a.mixed.apply.actions[0].patch.responsePlan, a.mixed.newRisk.responsePlan)
    const oldCandidatePath = path.join(repo, 'reports/all-pending-evidence-20261021/A16/candidate.json')
    const oldCandidate = json(oldCandidatePath)
    const seams = ['core/copilot.ts', 'commands/ask.ts', 'core/provenance-store.ts', 'core/ai-client.ts',
      'client/shared/drawers/sidecar-portal.tsx', 'client/panel.tsx', 'client/panel.css',
      'client/result-card.tsx', 'client/provenance-panel.tsx']
    const inheritance = seams.map(rel => {
      const p = 'packages/dsh-pm-tool/src/' + rel
      const nextSha = sha(read(path.join(freeze, p))), oldSha = oldCandidate.sourceHashes[p]
      assert(oldSha)
      return { rel: p, oldSha, nextSha, same: oldSha === nextSha,
        boundary: 'comparison with signed A16 manifest; not a replay of old GUI' }
    })
    const extra = ['a14-preconfirm-conflict-contract-20261022-plan.md',
      'a13-gateway-clean-undo-gui-review-20261021.md',
      'a13-source-remaining-gui-review-20261021.md',
      'a14-sm01-clean-mixed-gui-review-20261022.md',
      'a12-governance-source-gui-retest-20261021.md',
      'remaining-acceptance-delta-20261022-ledger.md']
    const files = Object.fromEntries(extra.map(p => {
      const absolute = path.join(repo, 'docs/testing', p)
      return [absolute, fingerprint(absolute)]
    }))
    files[oldCandidatePath] = fingerprint(oldCandidatePath)
    save('-supplement.json', { at: new Date().toISOString(), checks, exactPlanToApply: true,
      inheritance, files, auditSha: sha(read(prefix + '-audit.json')) })
    console.log('整记录单目标写入与原模型计划透传补核完成')
    break
  }
  case 'close': {
    const before = json(prefix + '-before.json'), changes = []
    const files = { ...before.files, ...json(prefix + '-supplement.json').files }
    for (const [p, expected] of Object.entries(files)) {
      const actual = fingerprint(p)
      if (JSON.stringify(actual) !== JSON.stringify(expected)) changes.push({ p, expected, actual })
    }
    assert.deepEqual(changes, [])
    const report = read(prefix + '.md').toString()
    assert(!/[ \t]+$/m.test(report))
    const localLinks = [...report.matchAll(/\]\(([^)]+)\)/g)]
      .map(m => m[1].split('#')[0]).filter(p => p && !/^[a-z]+:/i.test(p))
    const pendingSelfLink = path.basename(prefix) + '-close.json'
    const missingLinks = localLinks.filter(p => p !== pendingSelfLink)
      .filter(p => !fs.existsSync(path.resolve(path.dirname(prefix), p)))
    assert.deepEqual(missingLinks, [])
    save('-close.json', { at: new Date().toISOString(), protectedCount: Object.keys(files).length,
      drift: changes, excluded: index.liveLogsExcluded, missingLinks, released: true, stop: true,
      ownFiles: Object.fromEntries(fs.readdirSync(path.dirname(prefix))
        .filter(p => p.startsWith(path.basename(prefix))).map(p => [p, fingerprint(path.join(path.dirname(prefix), p))])) })
    for (const p of localLinks) assert(fs.existsSync(path.resolve(path.dirname(prefix), p)))
    console.log('输入零漂移，报告链接完备，本审证释放 STOP')
    break
  }
  default:
    throw new Error('Use before, audit, supplement, or close; existing outputs are never overwritten')
}

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = repo + '/docs/testing/p0-capture-remaining-gui-review-20261023-r1'
const root = repo + '/reports/all-pending-evidence-20261021/P0CaptureRemainingR1'
const old = repo + '/reports/all-pending-evidence-20261021/Successor114GuiR1'
const combined = repo + '/reports/all-pending-evidence-20261021/CombinedSuccessor114R1'
const freeze = '/private/tmp/pmtool-combined-successor114-20261022-r1'
const receiptsRoot = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
const inputs = {}
const errors = []
const checks = {}
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const fingerprint = b => ({ bytes: b.length, sha256: sha(b) })
function bytes(file) {
  assert(fs.lstatSync(file).isFile(), 'Not a regular input: ' + file)
  const b = fs.readFileSync(file)
  const row = fingerprint(b)
  if (inputs[file]) assert.deepEqual(inputs[file], row, 'Input changed during read: ' + file)
  inputs[file] = row
  return b
}
const json = file => JSON.parse(bytes(file))
const text = file => bytes(file).toString('utf8')
function save(suffix, value) {
  assert(['-audit.json', '-audit-r2.json', '-seal.json'].includes(suffix))
  fs.writeFileSync(prefix + suffix, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function check(name, fn) {
  try { checks[name] = { ok: true, ...fn() } }
  catch (error) {
    errors.push({ check: name, message: error.message })
    checks[name] = { ok: false, message: error.message }
  }
}
function inventory(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...inventory(file))
    else { assert(e.isFile(), 'Nonregular evidence: ' + file); out.push(file) }
  }
  return out
}
function index(dir, count) {
  const original = json(dir + '/index-r1.json')
  const rows = original.files ?? original
  assert.equal(Object.keys(rows).length, count)
  for (const [rel, row] of Object.entries(rows)) {
    const file = path.resolve(dir, rel)
    assert(file.startsWith(dir + '/'))
    assert.deepEqual(fingerprint(bytes(file)), row, rel)
  }
  return {
    verified: count,
    index: inputs[dir + '/index-r1.json'],
    additionsAfterIndex: inventory(dir).map(f => path.relative(dir, f))
      .filter(f => f !== 'index-r1.json' && !Object.hasOwn(rows, f)),
  }
}
const stages = [
  'fb01-before-capture', 'fb01-capture-noapply', 'fb02-noapply-exit',
  'fb02-second-draft-before-apply', 'fb02-after-capture-apply',
  'fb03-metric-after-capture', 'fb03-created-tasks-visible',
  'fb03-evidence-persisted-visible', 'fb04-reentry-created-tasks',
  'fb04-provenance-visible', 'fb04-metric-reentry',
]
const roots = name => json(root + '/' + name + '-roots.json')
const business = rows => Object.fromEntries(Object.entries(rows)
  .filter(([k]) => k.startsWith('data/pmtool/') || k.startsWith('files/')))
const raw = (name, rel) => json(root + '/' + name + '-raw/data/pmtool/' + rel).record
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
function delta(a, b) {
  return {
    added: Object.keys(b).filter(k => !Object.hasOwn(a, k)),
    removed: Object.keys(a).filter(k => !Object.hasOwn(b, k)),
    changed: Object.keys(a).filter(k => Object.hasOwn(b, k) && !same(a[k], b[k])),
  }
}
function command(name) {
  const row = json(root + '/' + name + '-command.json')
  assert.equal(row.rows.length, 2)
  const [request, response] = row.rows
  assert.equal(request.type, 'request')
  assert.equal(response.type, 'response')
  assert.equal(request.path, '/api/commands/execute')
  assert.equal(request.body.payload.args.line, row.line)
  assert.equal(request.body.method, 'commands/execute')
  assert.equal(response.body.rpcId, request.body.rpcId)
  assert.equal(response.status, 200)
  assert.equal(response.body.result.ok, true)
  assert.equal(response.body.result.value.result.kind, 'success')
  assert(Date.parse(response.at) >= Date.parse(request.at))
  return {
    name, line: row.line, rpcId: request.body.rpcId,
    agentId: request.body.payload.args.agentId,
    requestedAt: request.at, respondedAt: response.at,
    result: response.body.result.value.result,
  }
}
function canonical(v) {
  if (v == null) return null
  if (Array.isArray(v)) return v.map(canonical)
  if (typeof v !== 'object') return v
  return Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])]))
}
const shortHash = v => sha(Buffer.from(JSON.stringify(canonical(v)))).slice(0, 16)
const gatewayOwner = repo + '/reports/all-pending-evidence-20261021/CombinedGuiR1/gateway-requests.ndjson'
function ownerRows() {
  return fs.readFileSync(gatewayOwner, 'utf8').trim().split('\n').map(s => JSON.parse(s))
}
function audit() {
  if (process.argv[2] === 'audit-r2') bytes(prefix + '-audit.json')
  for (const rel of [
    'AGENTS.md', 'docs/collaboration.md',
    'docs/testing/remaining-governance-cases-20261021.md',
    'docs/testing/op-growth-final-inheritance-20261022-r1.md',
    'docs/testing/copilot-prefix114-gui-retest-20261022-r1-report.md',
    'docs/testing/combined-successor114-regression-review-20261022-r1-report.md',
  ]) bytes(repo + '/' + rel)
  check('new336_original166', () => ({ current: index(root, 336), prior: index(old, 166) }))
  check('source114_complete521', () => {
    const declared = json(combined + '/source-files.json')
    const close = json(root + '/source-binding-close.json')
    const complete = json(combined + '/complete-inputs.json')
    const candidate = json(combined + '/candidate.json')
    assert.equal(declared.count, 114)
    assert.equal(Object.keys(declared.source).length, 114)
    assert.deepEqual(close.source, declared.source)
    assert.equal(close.completeInputCount, 521)
    assert.equal(Object.keys(complete).length, 521)
    assert.equal(candidate.baseline, close.baseline)
    assert.equal(candidate.freeze, freeze)
    const mainDifferences = []
    for (const [rel, expected] of Object.entries(declared.source)) {
      const original = rel.startsWith('packages/') ? freeze + '/' + rel : repo + '/' + rel
      assert.equal(sha(bytes(original)), expected, rel)
      if (sha(bytes(repo + '/' + rel)) !== expected) mainDifferences.push(rel)
    }
    for (const [rel, expected] of Object.entries(complete)) {
      assert.deepEqual(fingerprint(bytes(freeze + '/packages/dsh-pm-tool/' + rel)), expected, rel)
    }
    return { baseline: close.baseline, sourceCount: 114, completeInputCount: 521, mainDifferences }
  })
  check('prior_deployment_not_new_probe', () => {
    const host = json(old + '/host-start.json')
    const ready = json(old + '/host-ready.json')
    const binding = json(root + '/binding.json')
    const gateway = json(old + '/gateway-binding.json')
    const row = json(old + '/04-loaded-0.json')
    const response = bytes(old + '/04-loaded-0.js')
    const client = bytes(freeze + '/packages/dsh-pm-tool/lib/client.js')
    assert.equal(host.pid, 10975); assert.equal(host.port, 3264)
    assert.equal(ready.pid, host.pid); assert.equal(binding.host.pid, host.pid)
    assert.equal(host.flags.DSH_PM_E2E, '0')
    assert.equal(gateway.pid, 60386); assert.equal(gateway.port, 3261)
    assert.equal(binding.gateway.pid, gateway.pid)
    assert.equal(binding.gateway.realExternalModel, false)
    assert.equal(sha(client), host.bundleSha256)
    assert.equal(sha(response), row.responseSha256)
    const executable = client.subarray(0, row.executableBytes)
    assert(/^\/\/# sourceMappingURL=client\.js\.map\s*$/.test(client.subarray(row.executableBytes).toString()))
    assert.equal(sha(executable), row.executableSha256)
    assert.equal(response.indexOf(executable), row.offset)
    assert.equal(response.indexOf(executable, row.offset + 1), -1)
    return { host, gateway, loadedExecutableOffset: row.offset,
      firstLoadCache: 'NOT_SIGNED', hostGitIdentity: 'NOT_SIGNED',
      prodMode: 'Inherited exact original prod-click/RPC/F5 declaration; no credential probe' }
  })
  check('actual_receipts_failure_and_seal', () => {
    const list = json(root + '/execution-receipts.json')
    assert.equal(list.subset, true); assert.equal(list.receipts.length, 6)
    const actual = list.receipts.map((row, i) => {
      const m = json(root + '/execution-receipts/' + row.id + '/execution.json')
      for (const n of ['execution.json', 'output.log', 'stderr.log']) {
        assert(bytes(root + '/execution-receipts/' + row.id + '/' + n)
          .equals(bytes(receiptsRoot + '/' + row.id + '/' + n)))
      }
      assert.equal(m.status, 'exited'); assert.equal(m.outputComplete, true)
      assert.equal(m.pid, row.pid); assert.equal(m.exitCode, row.exitCode)
      assert.equal(m.exitCode, i === 0 ? 1 : 0)
      if (i === 0) assert(text(root + '/execution-receipts/' + row.id + '/output.log')
        .includes('Error: task space not found: 13'))
      return { ...row, startedAtMs: m.startedAtMs, finishedAtMs: m.finishedAtMs }
    })
    assert(actual[0].finishedAtMs < Date.parse(json(root + '/fb01-before-capture.json').at))
    const id = 'ecbcb142f32064f5ff1b8d9eb81f548d'
    const seal = json(receiptsRoot + '/' + id + '/execution.json')
    const output = text(receiptsRoot + '/' + id + '/output.log')
    bytes(receiptsRoot + '/' + id + '/stderr.log')
    assert.equal(seal.status, 'exited'); assert.equal(seal.outputComplete, true)
    assert.equal(seal.exitCode, 0); assert(output.includes('sealed: 336'))
    return { subset: actual, originalSeal: { id, metadata: seal, output } }
  })
  check('raw_bytes_noapply_apply_reentry', () => {
    const counts = {}
    for (const name of stages) {
      const rows = roots(name)
      const rawRows = Object.entries(rows).filter(([p]) => p.startsWith('data/pmtool/'))
      counts[name] = rawRows.length
      for (const [rel, expected] of rawRows) {
        assert.deepEqual(fingerprint(bytes(root + '/' + name + '-raw/' + rel)), expected)
      }
      const ui = json(root + '/' + name + '.json')
      assert.equal(ui.origin, 'http://127.0.0.1:3264')
      assert.deepEqual(ui.pilot, {})
    }
    const before = business(roots(stages[0]))
    for (const name of stages.slice(1, 4)) assert.deepEqual(business(roots(name)), before, name)
    const applied = business(roots('fb02-after-capture-apply'))
    const changes = delta(before, applied)
    assert.deepEqual(changes.removed, [])
    assert.deepEqual(changes.changed, [])
    assert.deepEqual(changes.added.sort(), [
      'data/pmtool/settings/pmProvenanceLedger.json',
      'data/pmtool/settings/pmProvenancePending.json',
      'data/pmtool/tasks/t-0005.json', 'data/pmtool/tasks/t-0006.json',
    ])
    assert.deepEqual(raw('fb02-after-capture-apply',
      'settings/pmProvenancePending.json').value.entries, [])
    for (const name of stages.slice(5)) assert.deepEqual(business(roots(name)), applied, name)
    const allRootDelta = delta(roots(stages[0]), roots(stages.at(-1)))
    return { rawCounts: counts, noapplyBusinessFiles: Object.keys(before).length,
      noapplyFilesCount: Object.keys(before).filter(k => k.startsWith('files/')).length,
      applyDelta: changes, reentryByteExact: true, allSavedRootDelta: allRootDelta,
      guarantee: 'Only saved data/pmtool and files; host session writes separate; not full-machine zero pollution' }
  })
  check('real_rpc_gateway_draft_apply', () => {
    const cmds = ['fb01-capture-noapply', 'fb02-second-draft',
      'fb02-explicit-capture-apply', 'fb03-metric-after-capture',
      'fb04-capture-provenance', 'fb04-metric-reentry'].map(command)
    const ids = cmds.slice(0, 2).map(c => /草稿编号：(draft-[A-Za-z0-9-]+)/.exec(c.result.text)?.[1])
    assert(ids.every(Boolean)); assert.notEqual(ids[0], ids[1])
    assert.equal(cmds[2].line, '/pm capture-apply p-0001 ' + ids[1])
    assert.equal(cmds[1].agentId, cmds[2].agentId)
    assert(!cmds.some(c => c.line.includes('capture-fixture')))
    const fixture = json(root + '/gateway-fixture-capture.json')
    const requests = json(root + '/gateway-capture-requests.json')
    assert.equal(requests.length, 2)
    const candidates = JSON.parse(fixture.text).candidates
    assert.equal(candidates.length, 2)
    requests.forEach((r, i) => {
      assert(ownerRows().some(actual => same(actual, r)))
      assert.equal(r.sequence, 14 + i); assert.equal(r.path, '/v1/messages')
      assert.equal(r.fixture.text, fixture.text)
      assert.equal(r.fixture.behavior, 'success')
      const user = r.body.messages[0].content[0].text
      const dialogue = cmds[i].line.replace('/pm capture p-0001 ', '')
      assert(user.includes(dialogue))
      assert(Date.parse(r.at) >= Date.parse(cmds[i].requestedAt))
      assert(Date.parse(r.at) <= Date.parse(cmds[i].respondedAt))
    })
    const stored = json(root + '/fb02-draft-binding.json')
    assert.equal(stored.draftId, ids[1])
    assert.deepEqual(stored.result, cmds[1].result)
    assert.deepEqual(stored.applied, cmds[2].result)
    return { commands: cmds, draftIds: ids, gatewayRequests: requests, candidates,
      realExternalModel: false, noE2ECaptureFixture: true, noHandSeededProvenance: true }
  })
  check('actual_tasks_provenance_metric', () => {
    const stage = 'fb04-metric-reentry'
    const tasks = ['t-0005', 't-0006'].map(id => raw(stage, 'tasks/' + id + '.json'))
    const candidates = JSON.parse(json(root + '/gateway-fixture-capture.json').text).candidates
    tasks.forEach((t, i) => {
      assert.equal(t.projectId, 'p-0001'); assert.equal(t.title, candidates[i].title)
      assert.equal(t.description, candidates[i].description)
      assert.equal(t.status, 'todo'); assert.equal(t.priority, 'P1'); assert.equal(t.progress, 0)
      if (candidates[i].dueDate) assert.equal(t.dueDate, candidates[i].dueDate)
      if (candidates[i].assignee) assert.equal(t.assignee, candidates[i].assignee)
    })
    assert.equal(tasks[0].evidenceUrl, candidates[0].evidence[0])
    assert.equal(new URL(tasks[0].evidenceUrl).protocol, 'https:')
    const ledger = raw(stage, 'settings/pmProvenanceLedger.json').value.entries
    assert.equal(ledger.length, 1)
    const entry = ledger[0]
    assert.equal(entry.kind, 'capture'); assert.equal(entry.status, 'confirmed')
    assert.equal(entry.refs.length, 2)
    entry.refs.forEach((ref, i) => {
      const t = tasks[i]
      assert.equal(ref.id, t.id); assert.equal(ref.projectId, t.projectId)
      assert.equal(ref.table, 'tasks'); assert.equal(ref.role, 'basis')
      assert.equal(ref.label, t.title); assert.equal(ref.updatedAt, t.updatedAt)
      const fields = ['title', 'status', 'progress', 'assignee', 'priority',
        'parentId', 'startDate', 'dueDate', 'completedDate']
      const basis = Object.fromEntries(fields.filter(k => k in t).map(k => [k, t[k]]))
      const full = Object.fromEntries(Object.entries(t).filter(([k]) => !['updatedAt', 'createdAt'].includes(k)))
      assert.equal(ref.basisFingerprint, shortHash(basis))
      assert.equal(ref.fullFingerprint, shortHash(full))
    })
    const provenance = JSON.parse(command('fb04-capture-provenance').result.text)
    const recheck = provenance.entries[0].recheck
    assert.equal(recheck.conclusion, 'consistent')
    assert.equal(recheck.rows.length, 2); assert.deepEqual(recheck.invalid, [])
    assert(recheck.rows.every(r => r.state === 'consistent'))
    const { recheck: ignored, ...original } = provenance.entries[0]
    assert.deepEqual(original, entry)
    const metric = JSON.parse(command('fb03-metric-after-capture').result.text)
    assert.deepEqual(JSON.parse(command('fb04-metric-reentry').result.text), metric)
    assert.equal(metric.total, ledger.length)
    assert.equal(metric.appliedSteps, entry.refs.filter(r => r.role === 'basis').length)
    assert.deepEqual(metric.byKind, { capture: 1 }); assert.equal(metric.last, entry.createdAt)
    assert.equal(metric.pendingCount, 0)
    const captureSource = text(freeze + '/packages/dsh-pm-tool/src/commands/capture.ts')
    assert(captureSource.includes("actions: created.map(c => ({ op: 'task.create', id: c.id }))"))
    assert(captureSource.includes('void recordProvenance(domain, {'))
    const fields = json(root + '/fb03-evidence-persisted-visible.json').fields
    assert(fields.some(f => f.name === 'title' && f.value === tasks[0].title))
    assert(fields.some(f => f.name === 'dueDate' && f.value === tasks[0].dueDate))
    assert(fields.some(f => f.name === 'assignee' && f.value === tasks[0].assignee))
    assert(fields.some(f => f.value === tasks[0].evidenceUrl))
    const ui1 = json(root + '/fb03-created-tasks-visible.json')
    const ui2 = json(root + '/fb04-reentry-created-tasks.json')
    assert.notEqual(ui1.timeOrigin, ui2.timeOrigin)
    for (const t of tasks) assert(ui1.text.includes(t.title) && ui2.text.includes(t.title))
    return { tasks, ledger, metric, recheck, timeOrigins: [ui1.timeOrigin, ui2.timeOrigin],
      opOrigin: 'SOURCE task.create + actual apply RPC/raw/ref fingerprints; not literal op stored in ref',
      metricRemaining: ['other actual kinds', 'rejection no-write observation (no rejected field)', 'actual undo outcomes'],
      visualLimit: 'Complete t5 fields DOM; t6 no separate opened form; complete list titles not all in PNG' }
  })
  const visual = [
    ['fb01-before-capture', '目视项目任务3项，原任务表。'],
    ['fb01-capture-noapply', '目视观察模式未写入、首draftId、两候选及https。'],
    ['fb02-noapply-exit', '目视离开聊天回项目，任务仍3项。'],
    ['fb02-second-draft-before-apply', '目视第二draftId、两候选、日期/负责人/证据、确认指路。'],
    ['fb02-after-capture-apply', '目视已落库t5/t6、挂载https、既有删除/修正说明。'],
    ['fb03-metric-after-capture', '目视1记录/2对象/capture1/只读和小样本说明。'],
    ['fb03-created-tasks-visible', '目视项目表5项；新行完整标题在屏下，不能称全字段入镜。'],
    ['fb03-evidence-persisted-visible', '目视编辑抽屉https完整值，两新行截短标签；顶部完整字段依DOM。'],
    ['fb04-reentry-created-tasks', '目视重进项目表5项；两新行完整标题依DOM/raw，不冒PNG全字段。'],
    ['fb04-provenance-visible', '目视capture/confirmed、两真实basis refs、consistent和无invalid。'],
    ['fb04-metric-reentry', '目视重进后同1记录/2对象/capture1。'],
  ].map(([name, observation]) => ({
    png: root + '/' + name + '.png', fingerprint: inputs[root + '/' + name + '.png'],
    observation, observer: '本轮独立GUI审证专家，已通过view_image打开原PNG，非Main自判',
  }))
  const drift = Object.entries(inputs).filter(([f, row]) => !same(fingerprint(fs.readFileSync(f)), row))
  if (drift.length) errors.push({ check: 'final_input_drift', files: drift.map(([f]) => f) })
  const result = {
    at: new Date().toISOString(), runtime: { platform: process.platform, node: process.version, cwd: process.cwd() },
    role: '独立GUI审证，非开发/非Main/非GUI执行',
    checks, errors, visualReview: visual, protectedInputs: inputs,
    ownerAppendLogPolicy: { file: gatewayOwner, protectedRows: checks.real_rpc_gateway_draft_apply?.gatewayRequests,
      wholeLogFrozen: false, reason: '父任务可追加请求；只核本轮两原行，不锁住Main后续context' },
    decision: errors.length ? 'BLOCKED_READER_CHECK' : 'PASS_LIMITED_CAPTURE_GUI_AND_CURRENT_CAPTURE_METRIC',
    remainingCaptureSlice: errors.length ? errors : [],
    remainingNotReleased: ['RA-P0001 context', 'RA-P0006 other kinds/rejection/undo',
      'P0 whole', 'P1-P3', 'B8', 'parent ordinarycommit'],
    executedProductTests: 0, executedMainScripts: 0, browserOperations: 0,
  }
  save(process.argv[2] === 'audit-r2' ? '-audit-r2.json' : '-audit.json', result)
  console.log(JSON.stringify({ errors, groups: Object.keys(checks).length,
    protectedInputCount: Object.keys(inputs).length, decision: result.decision }))
  process.exitCode = errors.length ? 1 : 0
}
function seal() {
  const audit = json(prefix + '-audit-r2.json')
  assert.deepEqual(audit.errors, [])
  const drift = []
  for (const [file, expected] of Object.entries(audit.protectedInputs)) {
    if (!same(fingerprint(bytes(file)), expected)) drift.push(file)
  }
  assert.deepEqual(drift, [])
  for (const row of audit.ownerAppendLogPolicy.protectedRows) {
    assert(ownerRows().some(actual => same(actual, row)))
  }
  const report = text(prefix + '-report.md')
  assert(report.includes('PASS_LIMITED_CAPTURE_GUI'))
  assert(report.includes('remainingCaptureSlice=[]'))
  assert(report.includes('released/STOP'))
  const files = {}
  for (const suffix of ['-reader.mjs', '-audit.json', '-audit-r2.json', '-report.md']) {
    files[prefix + suffix] = fingerprint(bytes(prefix + suffix))
  }
  save('-seal.json', {
    at: new Date().toISOString(), files,
    protectedInputCount: Object.keys(audit.protectedInputs).length,
    inputDrift: drift, original336And166Preserved: true,
    gatewayOriginalRowsPreserved: true,
    checks: '自有审计7组全部成立；终核不替代实际PNG目视',
    decision: audit.decision, remainingCaptureSlice: [], released: true,
    resourceLocks: [], productTests: 'NOT_RUN_THIS_ROLE', guiExecution: 'NOT_RUN_THIS_ROLE',
    state: 'released/STOP',
  })
  console.log(JSON.stringify({ sealed: true, inputDrift: drift, files: Object.keys(files).length }))
}
assert(['audit', 'audit-r2', 'seal'].includes(process.argv[2]), 'Use audit/audit-r2/seal; outputs are append-only')
if (process.argv[2] !== 'seal') audit()
else seal()

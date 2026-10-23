import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = path.resolve(import.meta.dirname, '../..')
const prefix = path.join(repo, 'docs/testing/atf-combined-runtime-gui-review-20261022-r1')
const evidence = path.join(repo, 'reports/all-pending-evidence-20261021/CombinedGuiR1')
const repair = path.join(repo, 'reports/all-pending-evidence-20261021/CombinedRepairR1/r2')
const pkg = '/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const read = p => fs.readFileSync(p)
const json = p => JSON.parse(read(p))
const rows = p => read(p).toString().trim().split('\n').filter(Boolean).map(s => JSON.parse(s))
const facts = p => ({ bytes: read(p).length, sha256: sha(read(p)), mtimeMs: fs.statSync(p).mtimeMs })
const save = (name, value) => fs.writeFileSync(`${prefix}-${name}.json`, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const manifest = json(path.join(evidence, 'continuation-index.json'))
const inputs = json(path.join(repair, 'complete-inputs.json'))
const artifacts = json(path.join(repair, 'built-artifacts.json'))
const declared = json(path.join(repair, 'source-files.json'))
const names = Object.keys(manifest.files).filter(n => /^(3[0-9]|4[0-3])-atf-[^/]*\.json$/.test(n)
  && !n.endsWith('-roots.json') && !n.endsWith('-events.json')).sort()
const eventNames = Object.keys(manifest.files).filter(n => /^(32|34|36|38|40|42)-atf-[^/]*-events\.json$/.test(n)).sort()
const references = [
  'ai-terminal-independent-retest-20261022-r1-report.md',
  'ai-remaining-gui-review-20261022-r1.md',
  'ask-auth-feedback-red-20261022-r1-report.md',
  'combined-repair-full-regression-review-20261022-r1.md',
  'remaining-governance-cases-20261021.md',
  'remaining-journey-cases-20261021.md',
  'final-remaining-acceptance-reconcile-20261022.md',
]
function filesUnder(root, rel = '') {
  return fs.readdirSync(path.join(root, rel), { withFileTypes: true }).flatMap(e => {
    const n = path.join(rel, e.name)
    return e.isDirectory() ? filesUnder(root, n) : [n]
  }).sort()
}
function verifyMap(root, map) {
  for (const [n, expected] of Object.entries(map)) {
    const b = read(path.join(root, n))
    if (typeof expected !== 'string') assert.equal(b.length, expected.bytes, n)
    assert.equal(sha(b), typeof expected === 'string' ? expected : expected.sha256, n)
  }
}
function protectedPaths() {
  return [...new Set([
    path.join(evidence, 'continuation-index.json'),
    ...Object.keys(manifest.files).map(n => path.join(evidence, n)),
    ...Object.keys(inputs).map(n => path.join(pkg, n)),
    ...Object.keys(artifacts).map(n => path.join(pkg, 'lib', n)),
    ...['candidate.json', 'source-files.json', 'source-files.sha256', 'complete-inputs.json', 'built-artifacts.json']
      .map(n => path.join(repair, n)),
    ...references.map(n => path.join(repo, 'docs/testing', n)),
  ])].sort()
}
function drift(before) {
  return Object.entries(before).filter(([p, f]) => {
    try { return JSON.stringify(facts(p)) !== JSON.stringify(f) } catch { return true }
  }).map(([p]) => p)
}
const difference = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const projectFiles = r => Object.fromEntries(Object.entries(r).filter(([k]) =>
  k.startsWith('data/pmtool/') && !k.startsWith('data/pmtool/settings/')))
const byteFiles = r => Object.fromEntries(Object.entries(r).filter(([k]) =>
  /^(files|backups)\//.test(k) || k.startsWith('absent-root:')))

function audit() {
  assert.equal(manifest.count, 1537)
  assert.equal(Object.keys(manifest.files).length, 1537)
  verifyMap(evidence, manifest.files)
  assert.equal(Object.keys(inputs).length, 515)
  assert.equal(declared.count, 107)
  assert.equal(Object.keys(declared.source).length, 107)
  verifyMap(pkg, inputs)
  verifyMap(path.join(pkg, 'lib'), artifacts)
  assert.equal(Object.keys(artifacts).length, 453)
  assert.deepEqual(filesUnder(path.join(pkg, 'lib')), Object.keys(artifacts).sort())
  const sourcePlugin = Object.fromEntries(Object.entries(declared.source)
    .filter(([n]) => n.startsWith('packages/dsh-pm-tool/'))
    .map(([n, v]) => [n.slice('packages/dsh-pm-tool/'.length), v]))
  verifyMap(pkg, sourcePlugin)
  assert.equal(Object.keys(sourcePlugin).length, 92)
  assert.equal(sha(read(path.join(pkg, 'src/core/ai-client.ts'))),
    'b0348f33a6a38202147819d9d8128f12c46f024fde08cb94258508faefcd0448')

  const host = json(path.join(evidence, 'host-start.json'))
  const r2 = json(path.join(evidence, 'host-r2-start.json'))
  const gateway = json(path.join(evidence, 'gateway-start.json'))
  const binding = json(path.join(evidence, 'loaded-binding.json'))
  const compiled = read(path.join(pkg, 'lib/client.js'))
  const loaded = read(path.join(evidence, 'loaded-complete.js'))
  // Host strips only the trailing source map comment from this archived segment.
  const segment = Buffer.from(compiled.toString().replace(/\n?\/\/# sourceMappingURL=.*$/, ''))
  assert.equal(sha(compiled), host.bundleSha256)
  assert.equal(host.bundle, pkg)
  assert.equal(r2.bundle, pkg)
  assert.equal(r2.bundleSha256, host.bundleSha256)
  assert.equal(sha(read(path.join(repair, 'candidate.json'))), host.candidateSha256)
  assert.equal(sha(read(path.join(repair, 'source-files.json'))), host.sourceSha256)
  assert.equal(compiled.length, binding.compiledBytes)
  assert.equal(sha(compiled), binding.compiledSha256)
  assert.equal(loaded.length, binding.loadedBytes)
  assert.equal(sha(loaded), binding.loadedSha256)
  assert.equal(segment.length, binding.segmentBytes)
  assert.equal(loaded.indexOf(segment), binding.offset)
  assert.equal(loaded.indexOf(segment, binding.offset + 1), -1)
  assert.equal(host.pid, 60387)
  assert.equal(r2.pid, 64680)
  assert.equal(gateway.pid, 60386)
  assert.equal(host.port, 3260)
  assert.equal(r2.port, 3260)
  assert.equal(gateway.port, 3261)
  assert.equal(host.flags.DSH_PM_E2E, '0')

  assert.equal(names.length, 14)
  const states = names.map(n => ({ name: n, ...json(path.join(evidence, n)) }))
  const roots = new Map()
  let rawCount = 0
  for (const s of states) {
    assert.equal(s.origin, 'http://127.0.0.1:3260')
    assert.equal(s.dark, true)
    assert.deepEqual([s.viewport.innerWidth, s.viewport.innerHeight, s.viewport.dpr], [1458, 734, 2])
    assert.deepEqual(s.pilot, {})
    const root = json(path.join(evidence, s.name.replace('.json', '-roots.json')))
    roots.set(s.name, root)
    const rawPrefix = s.name.replace('.json', '-raw/')
    const raw = Object.keys(manifest.files).filter(n => n.startsWith(rawPrefix))
    assert.deepEqual(raw.map(n => n.slice(rawPrefix.length)).sort(),
      Object.keys(root).filter(n => n.startsWith('data/pmtool/')).sort())
    for (const n of raw) {
      assert.deepEqual(manifest.files[n], root[n.slice(rawPrefix.length)])
      rawCount++
    }
    assert.deepEqual(projectFiles(root), projectFiles(roots.get(names[0])))
    assert.deepEqual(byteFiles(root), byteFiles(roots.get(names[0])))
  }
  const rootChanges = names.slice(1).map((n, i) => ({
    from: names[i], to: n,
    projectChanges: difference(projectFiles(roots.get(names[i])), projectFiles(roots.get(n))),
    fileBackupChanges: difference(byteFiles(roots.get(names[i])), byteFiles(roots.get(n))),
    allChanges: difference(roots.get(names[i]), roots.get(n)),
  }))

  const requests = rows(path.join(evidence, 'gateway-requests.ndjson'))
  const outcomes = rows(path.join(evidence, 'gateway-events.ndjson'))
  const closes = rows(path.join(evidence, 'gateway-close.ndjson'))
  assert.deepEqual(requests.map(r => r.sequence), [1, 2, 3, 4, 5, 6, 7])
  assert.deepEqual(requests.map(r => r.fixture.behavior),
    ['auth', 'auth', 'rate_limit', 'partial_error', 'partial_error', 'success', 'success'])
  assert.equal(requests[6].fixture.delayMs, 8000)
  const rpc = []
  const frames = []
  let observedExceptions = 0
  for (const n of eventNames) {
    const events = json(path.join(evidence, n))
    const reqs = events.filter(e => e.method === 'Network.requestWillBeSent')
    const responses = events.filter(e => e.method === 'Network.responseReceived')
    assert.equal(reqs.length, 1)
    assert.equal(responses.length, n.startsWith('42-') ? 0 : 1)
    const req = reqs[0]
    assert.match(req.body.payload.args.line, /^\/pm ask p-0001 /)
    let result = null
    if (responses.length) {
      const res = responses[0]
      assert.equal(req.requestId, res.requestId)
      assert.equal(res.status, 200)
      const body = JSON.parse(res.body.body)
      assert.equal(req.body.rpcId, body.rpcId)
      result = body.result.value.result
      const state = states.find(s => s.name.startsWith(n.slice(0, 2)) && s.name.includes('-after.'))
      assert.ok(state.text.replace(/\s+/g, ' ').includes(result.text.replace(/\s+/g, ' ')))
    }
    const question = req.body.payload.args.line.match(/"(.*)"/)[1]
    const related = requests.filter(r => r.body.messages.some(m =>
      Array.isArray(m.content) && m.content.some(c => c.text?.includes(`【用户问题】"${question}"`))))
    assert.equal(related.length, n.startsWith('38-') ? 2 : 1)
    rpc.push({ file: n, requestId: req.requestId, rpcId: req.body.rpcId,
      line: req.body.payload.args.line, result, gatewaySequences: related.map(r => r.sequence),
      responseCaptured: responses.length === 1 })
    for (const e of events.filter(e => e.method === 'Page.screencastFrame')) {
      assert.equal(sha(read(path.join(evidence, e.file))), e.sha256)
      frames.push({ file: e.file, sha256: e.sha256, metadata: e.metadata })
    }
    observedExceptions += events.filter(e => e.method === 'Runtime.exceptionThrown').length
  }
  assert.equal(frames.length, 18)
  assert.equal(new Set(frames.map(f => f.file)).size, 18)
  assert.deepEqual(outcomes.map(r => r.sequence), [6, 7])
  assert.deepEqual(closes.map(r => [r.sequence, r.finished]), [1, 2, 3, 4, 5, 6, 7].map(n => [n, true]))
  const observation = json(path.join(evidence, 'continuation-observation.json'))
  const executions = observation.execution.map((e, i) => {
    const m = json(path.join(evidence, 'continuation-executions', e.id + '.json'))
    assert.equal(m.status, 'exited')
    assert.equal(m.outputComplete, true)
    assert.equal(m.exitCode, e.exitCode)
    return { ordinal: i + 1, id: e.id, exitCode: m.exitCode,
      status: m.status, outputComplete: m.outputComplete,
      log: facts(path.join(evidence, 'continuation-executions', e.id + '.log')) }
  })
  assert.equal(executions.length, 25)
  assert.equal(executions.filter(e => e.exitCode !== 0).length, 7)
  const busy = read(path.join(evidence, 'continuation-executions', executions[11].id + '.log')).toString()
  const fresh = read(path.join(evidence, 'continuation-executions', executions[12].id + '.log')).toString()
  assert.ok(busy.includes('inputDisabled: true') && busy.includes('buttonDisabled: true'))
  assert.ok(busy.includes('{ copilot: false, shell: true }'))
  assert.ok(fresh.includes('inputDisabled: false'))
  return {
    at: new Date().toISOString(), independentEvidenceAuditOnly: true,
    declaration: { count: manifest.count, index: facts(path.join(evidence, 'continuation-index.json')),
      undeclaredAtRead: filesUnder(evidence).filter(n => n !== 'continuation-index.json' && !(n in manifest.files)) },
    candidate: { ...json(path.join(repair, 'candidate.json')), sourcePluginCount: 92,
      sourceLauncherDeclarationOnly: 15, verifiedInputs: 515, verifiedArtifacts: 453,
      aiClient: facts(path.join(pkg, 'src/core/ai-client.ts')),
      ask: facts(path.join(pkg, 'src/commands/ask.ts')) },
    binding: { ...binding, normalizedSegmentSha256: sha(segment),
      rawFirstHostOnly: true, freshR2WireBindingNotCaptured: true,
      hostPid: host.pid, r2Pid: r2.pid, gatewayPid: gateway.pid },
    states: states.map(s => ({ name: s.name, at: s.at, timeOrigin: s.timeOrigin,
      viewport: s.viewport, dark: s.dark, pilot: s.pilot, png: facts(path.join(evidence, s.name.replace('.json', '.png'))) })),
    rawCount, rootChanges, rpc, frames, executions,
    gateway: requests.map(r => ({ sequence: r.sequence, at: r.at, path: r.path,
      model: r.body.model, fixture: r.fixture })), outcomes, closes,
    runtime: { observedExceptions, consoleCapturedByHelper: false,
      zeroRuntimeClaimAllowed: false, original25ConsoleBelongsToOtherDefect: true },
    busy: { rawLog: executions[11].id, inputDisabled: true, sendDisabled: true,
      closeKeptPm: true, newOpenInputDisabled: false, freshLog: executions[12].id,
      backendAbortSigned: false, request931ResponseNotCaptured: true },
    limits: ['GUI子断言另由报告判定', '不签AI06整项/外网模型/父commit',
      '第三候选只在RPC错误汇总，未记录第三次网关请求', '关闭不等signal取消',
      '零写只认归档data/pmtool业务及files/backups扫描范围', '不签matrix/全console/全Runtime'],
  }
}

const mode = process.argv[2]
try {
  if (mode === 'before') {
    const protectedFiles = Object.fromEntries(protectedPaths().map(p => [p, facts(p)]))
    save('before', { at: new Date().toISOString(), protectedFiles })
    console.log({ mode, exit: 0, protected: Object.keys(protectedFiles).length })
  } else if (mode === 'audit') {
    const before = json(`${prefix}-before.json`)
    const result = audit()
    assert.deepEqual(drift(before.protectedFiles), [])
    save('audit', { ...result, protectedCount: Object.keys(before.protectedFiles).length, drift: [] })
    console.log({ mode, exit: 0, declared: 1537, raw: result.rawCount, states: result.states.length,
      frames: result.frames.length, rpc: result.rpc.length, originalExecutions: 25, originalNonzero: 7 })
  } else if (mode === 'close') {
    const before = json(`${prefix}-before.json`)
    assert.deepEqual(drift(before.protectedFiles), [])
    const outputs = filesUnder(path.join(repo, 'docs/testing'))
      .filter(n => path.basename(n).startsWith(path.basename(prefix)))
    const report = `${prefix}.md`
    assert.ok(fs.existsSync(report))
    save('close', { at: new Date().toISOString(), protectedCount: Object.keys(before.protectedFiles).length,
      drift: [], outputs: Object.fromEntries(outputs.map(n => [n, facts(path.join(repo, 'docs/testing', n))])),
      report, released: true, stop: true, productTotalPass: false, gitActions: false,
      browserActions: false, serviceActions: false })
    console.log({ mode, exit: 0, protected: Object.keys(before.protectedFiles).length, released: true, stop: true })
  } else throw new Error('Expected before, audit, or close')
} catch (error) {
  save(`failure-${mode}-${Date.now()}`, { at: new Date().toISOString(), mode, exit: 1, error: String(error), stack: error.stack })
  console.error(error)
  process.exitCode = 1
}

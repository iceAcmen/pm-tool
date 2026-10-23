import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

// Evidence-only reader: never imports product code or contacts a running host.
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const root = path.join(repo, 'reports/all-pending-evidence-20261021/CombinedGuiR1')
const own = path.join(repo, 'docs/testing/ui-backup-nonempty-reentry-gui-review-20261022-r1')
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const read = rel => fs.readFileSync(path.join(root, rel))
const json = rel => JSON.parse(read(rel))
const fingerprint = file => {
  const b = fs.readFileSync(file)
  return { bytes: b.length, sha256: sha(b) }
}
const index = json('continuation-index.json')
assert.equal(index.count, 1537)
assert.equal(Object.keys(index.files).length, index.count)
const declared = {}
for (const [rel, expected] of Object.entries(index.files)) {
  const file = path.resolve(root, rel)
  assert(file.startsWith(root + path.sep), rel)
  assert(fs.lstatSync(file).isFile(), rel)
  declared[rel] = fingerprint(file)
  assert.deepEqual(declared[rel], expected, rel)
}
const old = json('j03-index.json')
assert.equal(old.count, 468)
for (const [rel, expected] of Object.entries(old.files)) {
  assert.deepEqual(declared[rel], expected, rel)
}

if (process.argv[2] === 'close') {
  const auditFile = own + '-audit.json'
  const audit = JSON.parse(fs.readFileSync(auditFile))
  assert.deepEqual(audit.declared, declared)
  assert.deepEqual(audit.index, fingerprint(path.join(root, 'continuation-index.json')))
  const report = own + '.md'
  const text = fs.readFileSync(report, 'utf8')
  const links = [...text.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1])
  const targets = links.filter(link => !/^[a-z]+:/i.test(link))
    .map(link => path.resolve(path.dirname(report), link.split('#')[0]))
  for (const target of targets) {
    if (target === own + '-close.json') continue
    assert(fs.existsSync(target), target)
  }
  const result = {
    at: new Date().toISOString(), evidenceConsistencyOnly: true,
    declaredCount: index.count, oldJ03Protected: old.count, futureAdditionsExcluded: true,
    report: fingerprint(report), audit: fingerprint(auditFile),
    reader: fingerprint(own + '-audit.mjs'), relativeLinksChecked: links.length,
    release: 'STOP', noProductExecution: true,
  }
  fs.writeFileSync(own + '-close.json', JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  for (const target of targets) assert(fs.existsSync(target), target)
  console.log(JSON.stringify(result))
  process.exit(0)
}
assert.equal(process.argv[2], 'audit')
const states = [
  '44-backup-before', '45r2-backup-observed', '46r2-backup-confirm',
  '47-backup-created', '48-backup-nonempty-target', '49r2-backup-precheck-observed',
  '50-backup-precheck-cancel-before', '51-backup-precheck-cancelled',
  '52-backup-reprechecked', '53-backup-danger-confirm', '54-backup-nonempty-restored',
  '56-restored-task-materials', '58-restored-habits', '59-restored-okrs',
  '60r3-newhost-tasks', '61-newhost-materials', '63-newhost-meetings',
  '64-newhost-reports', '65-newhost-deliverables', '66-newhost-habits', '67-newhost-okrs',
]
const envelopes = {}
const views = {}
for (const state of states) {
  const snapshot = json(state + '.json')
  assert.equal(snapshot.origin, 'http://127.0.0.1:3260')
  assert.equal(snapshot.dark, true)
  assert.deepEqual(snapshot.viewport, {
    innerWidth: 1458, innerHeight: 734, outerWidth: 1470, outerHeight: 857, dpr: 2,
  })
  assert.deepEqual(snapshot.pilot, {})
  views[state] = {
    at: snapshot.at, timeOrigin: snapshot.timeOrigin,
    viewport: snapshot.viewport, dark: snapshot.dark, pilot: snapshot.pilot,
    png: declared[state + '.png'], fields: snapshot.fields, dialogs: snapshot.dialogs,
  }
  const roots = json(state + '-roots.json')
  const rows = {}
  for (const rel of Object.keys(roots).filter(r => r.startsWith('data/pmtool/'))) {
    const rawRel = state + '-raw/' + rel
    assert.deepEqual(declared[rawRel], roots[rel], rawRel)
    const envelope = json(rawRel)
    assert.equal(envelope.version, 2)
    const parts = rel.split('/')
    const table = parts[2]
    const key = decodeURIComponent(parts[3].slice(0, -5))
    ;(rows[table] ??= []).push([key, envelope.record])
  }
  envelopes[state] = rows
}
const canonical = rows => [...rows].sort((a, b) => a[0].localeCompare(b[0]))
const observation = json('55-backup-observation.json')
const sourceName = observation.sourceName
const safetyName = observation.safetyName
const source = json('backup-packages/' + sourceName)
const safety = json('backup-packages/' + safetyName)
const core = {
  projects: 'projects', tasks: 'tasks', milestones: 'milestones', riskIssues: 'risk_issues',
  meetings: 'meetings', reports: 'reports', deliverables: 'deliverables',
}
const extra = ['settings', 'reflections', 'okrs', 'lessons', 'habits', 'file_assets']
assert.deepEqual(Object.keys(source.extra).sort(), [...extra].sort())
const expected = {}
for (const [key, table] of Object.entries(core)) expected[table] = source[key].map(r => [r.id, r])
for (const table of extra) expected[table] = source.extra[table]
const comparisons = {}
for (const state of ['47-backup-created', ...states.slice(10)]) {
  const rows = envelopes[state]
  assert.deepEqual(Object.keys(rows).sort(), Object.keys(expected).sort(), state)
  comparisons[state] = {}
  for (const [table, wanted] of Object.entries(expected)) {
    assert.deepEqual(canonical(rows[table]), canonical(wanted), state + '/' + table)
    comparisons[state][table] = { rows: wanted.length, exact: true }
  }
}
const row = (state, table, key) => envelopes[state][table].find(r => r[0] === key)[1]
assert.equal(row('47-backup-created', 'tasks', 't-0004').title, 'J03修后三资料原子任务')
assert.equal(row('48-backup-nonempty-target', 'tasks', 't-0004').title, '恢复前可辨不同标题')
assert.equal(safety.tasks.find(r => r.id === 't-0004').title, '恢复前可辨不同标题')
for (const [key, table] of Object.entries(core)) {
  assert.deepEqual(canonical(safety[key].map(r => [r.id, r])),
    canonical(envelopes['53-backup-danger-confirm'][table]), 'safety/' + table)
}
for (const table of extra) {
  assert.deepEqual(canonical(safety.extra[table]),
    canonical(envelopes['53-backup-danger-confirm'][table]), 'safety/' + table)
}
assert.deepEqual(json('50-backup-precheck-cancel-before-roots.json'),
  json('51-backup-precheck-cancelled-roots.json'))
const packageManifest = {}
for (const [rel, expectedFingerprint] of Object.entries(observation.manifest)) {
  packageManifest[rel] = declared['backup-packages/' + rel]
  assert.deepEqual(packageManifest[rel], expectedFingerprint)
}
assert.equal(Object.keys(packageManifest).length, 8)
const assetResults = []
for (const name of [sourceName, safetyName]) {
  const backup = json('backup-packages/' + name)
  const sidecar = name + '.files.' + backup.fileBundleId
  const manifest = json('backup-packages/' + sidecar + '/manifest.json')
  assert.equal(manifest.jsonSha256, sha(read('backup-packages/' + name)))
  assert.equal(manifest.bundleId, backup.fileBundleId)
  assert.equal(manifest.count, 2)
  assert.equal(manifest.files.length, 2)
  for (const [id, asset] of backup.extra.file_assets) {
    const entry = manifest.files.find(r => r.relPath === asset.relPath)
    assert.deepEqual(entry, { relPath: asset.relPath, sha256: asset.sha256, size: asset.size })
    const fp = declared['backup-packages/' + sidecar + '/' + asset.relPath]
    assert.deepEqual(fp, { bytes: asset.size, sha256: asset.sha256 })
    for (const state of states.slice(10)) {
      assert.deepEqual(json(state + '-roots.json')['files/' + asset.relPath], fp)
    }
    assetResults.push({ backup: name, id, ...fp, relPath: asset.relPath })
  }
}
const downloads = {}
const fa1 = source.extra.file_assets.find(r => r[0] === 'fa-0001')[1]
for (const name of ['57-restored-asset.md', '62-newhost-asset.md']) {
  downloads[name] = declared[name]
  assert.deepEqual(downloads[name], { bytes: fa1.size, sha256: fa1.sha256 })
  assert(read(name).equals(read('backup-packages/' + sourceName + '.files.' + source.fileBundleId + '/' + fa1.relPath)))
}

const eventNames = Object.keys(index.files).filter(n => /^\d.*-events\.json$/.test(n)
  && /^(45|47|48|49|52|54)/.test(n))
const events = eventNames.flatMap(n => json(n).map(e => ({ ...e, evidence: n })))
const rpc = []
for (const req of events.filter(e => e.method === 'Network.requestWillBeSent')) {
  const response = events.find(e => e.method === 'Network.responseReceived' && e.requestId === req.requestId)
  if (!response?.body?.body) continue
  const body = JSON.parse(response.body.body)
  assert.equal(body.rpcId, req.body.rpcId)
  rpc.push({
    requestId: req.requestId, rpcId: body.rpcId, line: req.body.payload.args.line,
    requestEvidence: req.evidence, responseEvidence: response.evidence,
    requestAt: req.at, responseAt: response.at, ok: body.result.ok,
    kind: body.result.value.result.kind, text: body.result.value.result.text,
  })
}
for (const line of ['/pm backup', `/pm restore "/private/tmp/pmtool-combined-gui-runtime-20261022-r1/backups/${sourceName}"`,
  `/pm restore "/private/tmp/pmtool-combined-gui-runtime-20261022-r1/backups/${sourceName}" confirm`]) {
  const entry = rpc.find(r => r.line === line)
  assert(entry, line)
  assert.equal(entry.ok, true)
  assert.equal(entry.kind, 'success')
}
const snapshots = rpc.filter(r => r.line === '/pm web snapshot')
for (const entry of snapshots) {
  const snap = JSON.parse(entry.text)
  const state = {
    '47': '47-backup-created', '48': '48-backup-nonempty-target',
    '54': '54-backup-nonempty-restored',
  }[entry.responseEvidence.slice(0, 2)]
  assert(state, entry.responseEvidence)
  entry.comparedState = state
  for (const [key] of Object.entries(core)) {
    assert.deepEqual(canonical(snap[key].map(r => [r.id, r])),
      canonical(envelopes[state][core[key]]), entry.requestId + '/' + key)
  }
}
const stop = json('host-r2-exact-stop.json')
assert.equal(stop.pid, 64680)
assert.equal(stop.port, 3260)
assert(stop.argv.includes('--port 3260'))
assert(stop.cwd.includes('n/Users/bytedance/Projects/dsh-pm/deepseek-harness'))
assert.equal(stop.signal, 'SIGTERM')
assert.equal(json('host-r2-listener-gone.json').listenerGone, true)
const start = json('host-r3-start.json')
assert.equal(start.pid, 71922)
assert.equal(start.port, 3260)
assert.equal(json('host-r3-ready.json').pid, start.pid)
assert.equal(start.bundleSha256, '09219cf81820294161dbdbdced09e73094b000a7d7e1d2e5b8c42f399fabb0db')
const binding = json('j03-source-binding.json')
assert.equal(binding.sourceCount, 107)
let verifiedPackageSources = 0
for (const [rel, expectedSha] of Object.entries(binding.source)) {
  if (!rel.startsWith('packages/dsh-pm-tool/')) continue
  assert.equal(fingerprint(path.join(binding.frozen, rel)).sha256, expectedSha, rel)
  verifiedPackageSources++
}
assert.equal(verifiedPackageSources, 92)
const compiled = fs.readFileSync(path.join(start.bundle, 'lib/client.js'))
assert.equal(sha(compiled), start.bundleSha256)
const loaded = read('loaded-complete.js')
const loadedBinding = json('loaded-binding.json')
assert.equal(sha(loaded), loadedBinding.loadedSha256)
const segment = compiled.subarray(0, loadedBinding.segmentBytes)
assert.equal(loaded.indexOf(segment), loadedBinding.offset)
assert.equal(loaded.indexOf(segment, loadedBinding.offset + 1), -1)
const profileLink = path.join(binding.runtime, 'home/profiles/pm/node_modules/dsh-pm-tool')
assert.equal(fs.readlinkSync(profileLink), start.bundle)
const executions = []
for (const e of json('continuation-observation.json').execution) {
  const m = json('continuation-executions/' + e.id + '.json')
  assert.equal(m.status, 'exited')
  assert.equal(m.outputComplete, true)
  assert.equal(m.exitCode, e.exitCode)
  executions.push({
    id: e.id, pid: m.pid, exitCode: m.exitCode,
    startedAtMs: m.startedAtMs, finishedAtMs: m.finishedAtMs,
    failure: e.exitCode ? read('continuation-executions/' + e.id + '.log').toString().slice(-3500) : null,
  })
}
assert.equal(executions.length, 25)
assert.equal(executions.filter(e => e.exitCode !== 0).length, 7)
const result = {
  at: new Date().toISOString(), evidenceConsistencyOnly: true,
  environment: { os: 'macOS', shell: 'bash', node: process.version, productExecuted: false },
  index: fingerprint(path.join(root, 'continuation-index.json')), indexAt: index.at,
  declaredCount: index.count, oldJ03Protected: old.count, futureAdditionsExcluded: true,
  declared, baseline: binding.baseline, sourceCount: 107, verifiedPackageSources,
  launcherDeclarationOnly: 15, binding: { start, stop, loadedBinding, profileLink },
  visualOriginalsActuallyViewed: states.map(s => s + '.png'),
  visualCount: states.length, framesVisuallyReviewed: 0, views,
  comparisons, sourceName, safetyName, packageManifest, assetResults, downloads,
  sourceRows: expected, safetyMatchesPreConfirmAll13Tables: true, cancellationAllRecordedRootsExact: true,
  rpc, snapshotsCompared: snapshots.length, executions,
  reviewerDeviations: [
    'Startup mistakenly invoked read-only git status --short once; no Git write or subsequent Git invocation.',
    'Broad read-only ps listing used while checking own find completion; no service action. Completion established by own execution metadata.',
    'rg unavailable exit127; memory locations absent exit1; guessed observation combined path absent exit1. No product failure inferred.',
    'First audit exit1 at former line196 compared the pre-restore 48 RPC snapshot with source incorrectly. Fixed to match each RPC to its actual 47/48/54 raw state; original target differences preserved.',
  ],
  release: 'STOP', scope: 'Limited backup/nonempty restore/new-process reread only; no whole F06/J06 or parent commit signature.',
}
fs.writeFileSync(own + '-audit.json', JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({
  declared: index.count, oldJ03: old.count, visualPNGs: states.length,
  exactStates: Object.keys(comparisons).length, coreTables: 7, extraTables: 6,
  packageFiles: Object.keys(packageManifest).length, assets: 2, downloads: Object.keys(downloads).length,
  executions: executions.length, nonzero: 7, sources: 107, verifiedPackageSources, release: 'STOP',
}))

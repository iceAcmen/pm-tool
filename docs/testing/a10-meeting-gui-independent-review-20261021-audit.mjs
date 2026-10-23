import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const prefix = 'docs/testing/a10-meeting-gui-independent-review-20261021'
const own = `${prefix}-selftmp`
const base = 'reports/all-pending-evidence-20261021/A10'
const fixture = 'docs/testing/materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr/fixtures/F5'
const frozen = 'docs/testing/a10-preflight-success-independent-retest-20261021-selftmp/frozen'
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const read = p => JSON.parse(fs.readFileSync(p))
const inputs = []
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    assert(!e.isSymbolicLink(), `archive symlink: ${p}`)
    if (e.isDirectory()) walk(p)
    else if (e.isFile()) inputs.push(p)
  }
}
walk(`${base}/meeting`)
walk(`${base}/build`)
walk(`${base}/restore/loaded-r1`)
walk(`${base}/restore/seed`)
walk(fixture)
inputs.push(`${base}/candidate.json`, `${base}/environment.json`, `${base}/product-tracked.patch`,
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/a8-layer-gap-contract-review-20261021.md',
  'docs/testing/a9-existing-entries-independent-retest-20261021.md',
  'docs/testing/a10-preflight-success-independent-retest-20261021.md')
const relevant = [
  'core/ui-feedback.ts', 'core/meeting.ts', 'core/meetings.ts', 'commands/meeting.ts',
  'client/panel.tsx', 'client/views/meetings.tsx',
  'client/views/records/records-meeting-form.tsx',
  'client/views/records/records-payloads.ts', 'client/shared/records-callbacks.ts',
  'client/shared/records-props.ts',
  'client/views/records.css', 'client/panel.css',
].map(p => `packages/dsh-pm-tool/src/${p}`)
inputs.push(...relevant.map(p => `${frozen}/${p}`))
const fingerprint = p => {
  const s = fs.statSync(p)
  return { sha256: sha(fs.readFileSync(p)), size: s.size, mtimeMs: s.mtimeMs }
}
const before = Object.fromEntries([...new Set(inputs)].sort().map(p => [p, fingerprint(p)]))
fs.mkdirSync(own, { recursive: true })
const indexPath = `${own}/inputs.json`
if (fs.existsSync(indexPath)) {
  for (const [p, value] of Object.entries(read(indexPath))) {
    assert.deepEqual(before[p], value, `changed archived input: ${p}`)
  }
}
const candidate = read(`${base}/candidate.json`)
assert.equal(sha(fs.readFileSync(`${base}/product-tracked.patch`)), candidate.trackedPatchSha)
const sourceMatches = relevant.map(p => {
  assert.equal(before[`${frozen}/${p}`].sha256, candidate.sourceHashes[p], p)
  return { path: p, sha256: candidate.sourceHashes[p] }
})
const sync = read(`${base}/build/sync.json`)
assert.deepEqual(sync.drift, [])
for (const row of sourceMatches) assert.equal(sync.sourceHashes[row.path], row.sha256)
const loaded = read(`${base}/restore/loaded-r1/result.json`)
const artifacts = read(`${base}/build/artifacts.json`)
const event = loaded.events[0], match = event.matches[0]
const response = fs.readFileSync(`${base}/restore/loaded-r1/${event.file}`)
assert.equal(sha(response), event.responseSha)
assert.equal(response.length, event.bytes)
assert.equal(event.status, 200)
assert.equal(event.fromDiskCache, false)
assert.equal(match.sourceSha, artifacts['packages/dsh-pm-tool/lib/client.js'])
const segment = response.subarray(match.first, match.first + match.segmentBytes)
assert.equal(sha(segment), match.segmentSha)
assert.equal(response.indexOf(segment, match.first + 1), -1)
assert.equal(match.second, -1)
assert.equal(match.uniqueComplete, true)
const text = response.toString('utf8')
const recordsCss = text.match(/var records_default = ("(?:[^"\\]|\\.)*");/)
assert(recordsCss, 'archived bundle records stylesheet missing')
assert.equal(JSON.parse(recordsCss[1]),
  fs.readFileSync(`${frozen}/packages/dsh-pm-tool/src/client/views/records.css`, 'utf8'))
assert.equal(loaded.state.origin, 'http://127.0.0.1:3224')
assert.equal(loaded.state.pilot, 'off')
assert.equal(loaded.state.pmMounted, true)
const seed = read(`${fixture}/backup.json`)
const original = seed.meetings.find(x => x.id === 'mtg-0001')
assert(original)
assert.deepEqual(original.actions, [])
const seedBoundary = read(`${base}/restore/seed/boundary.json`)
assert.deepEqual(seedBoundary.before, seedBoundary.first)
const b = read(`${base}/meeting/actions-r2/boundary.json`)
const c = read(`${base}/meeting/clear-cancel/boundary.json`)
const unwrap = w => {
  assert.equal(w.version, 2)
  assert.equal(w.record.id, original.id)
  assert.equal(w.record.projectId, original.projectId)
  return w.record
}
const first = unwrap(b.first), second = unwrap(b.second), cleared = unwrap(c.saved)
const unchangedMeeting = m => {
  const copy = structuredClone(m)
  delete copy.actions
  delete copy.updatedAt
  return copy
}
for (const m of [first, second, cleared]) {
  assert.deepEqual(unchangedMeeting(m), unchangedMeeting(original))
}
const action1 = {
  id: 'ai-001', title: '失败待重试一', owner: '', dueDate: null,
  status: 'todo', taskId: 't-0001', riskIssueId: null,
}
const action2 = {
  id: 'ai-002', title: '第二行动项', owner: '', dueDate: null,
  status: 'todo', taskId: 't-0003', riskIssueId: null,
}
assert.deepEqual(first.actions, [action1])
assert.deepEqual(second.actions, [action1, action2])
assert.deepEqual(cleared.actions, [action1, action2].map(a => ({ ...a, taskId: null })))
const taskRecords = seed.tasks.filter(t => ['t-0001', 't-0003'].includes(t.id))
assert.equal(taskRecords.length, 2)
assert(taskRecords.every(t => t.projectId === original.projectId))
assert(seed.riskIssues.every(r => r.type === 'risk'))
const changes = (a, z) => [...new Set([...Object.keys(a), ...Object.keys(z)])]
  .filter(k => a[k] !== z[k])
assert.deepEqual(b.before, b.draftRoot)
assert.deepEqual(changes(b.before, b.after), ['/pmtool/meetings/mtg-0001.json'])
assert.deepEqual(c.before, c.draft)
assert.deepEqual(c.cancelBefore, c.after)
assert.deepEqual(b.after['/pmtool/meetings/mtg-0001.json'], c.before['/pmtool/meetings/mtg-0001.json'])
const screens = {}
for (const branch of ['actions-r2', 'clear-cancel']) {
  for (const name of fs.readdirSync(`${base}/meeting/${branch}`).filter(n => n.endsWith('.json') && n !== 'boundary.json')) {
    const row = read(`${base}/meeting/${branch}/${name}`)
    assert.equal(row.origin, loaded.state.origin)
    assert.equal(row.timeOrigin, loaded.state.timeOrigin)
    assert.equal(row.viewport.width, 1440)
    assert.equal(row.viewport.height, 900)
    assert.equal(row.dark, false)
    screens[`${branch}/${name}`] = { at: row.at, fields: row.fields, alerts: row.alerts }
  }
}
assert.deepEqual(screens['actions-r2/first-draft.json'].fields.filter(f => f.tag === 'SELECT').map(f => f.value), ['t-0001', ''])
assert.deepEqual(screens['actions-r2/second-draft.json'].fields.filter(f => f.tag === 'SELECT').map(f => f.value), ['t-0001', '', 't-0003', ''])
assert.deepEqual(screens['clear-cancel/clear-draft.json'].fields.filter(f => f.tag === 'SELECT').map(f => f.value), ['', '', '', ''])
const frames = {}
for (const branch of ['actions-r1', 'actions-r2', 'clear-cancel']) {
  const dir = `${base}/meeting/${branch}/frames`
  const index = read(`${dir}/frames.json`)
  for (const f of index.frames) assert.equal(sha(fs.readFileSync(`${dir}/${f.file}`)), f.sha256)
  frames[branch] = { count: index.frames.length, frames: index.frames }
}
const changedInputs = Object.entries(before).filter(([p, value]) => {
  const now = fingerprint(p)
  return JSON.stringify(now) !== JSON.stringify(value)
}).map(([p]) => p)
assert.deepEqual(changedInputs, [])
const result = {
  at: new Date().toISOString(), runtime: process.version, platform: process.platform,
  argv: process.argv, cwd: process.cwd(), baseline: candidate.baseline,
  hostGitHead: candidate.hostGitHead, trackedPatchSha: candidate.trackedPatchSha,
  sourceMatches, loaded, inputCount: Object.keys(before).length, changedInputs,
  original, taskRecords, riskIssues: seed.riskIssues, wrappers: { first: b.first, second: b.second, cleared: c.saved },
  frames, screens,
  dataBoundary: { actionsChanged: changes(b.before, b.after), beforeDraftZero: true,
    clearDraftZero: true, titleCancelZero: true, roots: ['archived data hashes only'] },
  missingAtAudit: [
    'meeting command payload/transport log and raw disk byte archive',
    'new action draft cancellation and post-cancel wrapper',
    'issue positive, source jump, promote/retry/narrow/dark/native menu/restart/full journey',
  ],
  boundary: 'Only archive hashes, source copies and original wrapper fields audited; mechanical exit0 is not GUI PASS.',
}
fs.writeFileSync(indexPath, `${JSON.stringify(before, null, 2)}\n`)
fs.writeFileSync(`${own}/audit.json`, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify({ inputCount: result.inputCount, changedInputs,
  frames: Object.fromEntries(Object.entries(frames).map(([k, v]) => [k, v.count])),
  dataBoundary: result.dataBoundary, missingAtAudit: result.missingAtAudit }))

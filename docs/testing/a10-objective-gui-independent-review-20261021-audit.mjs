import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const prefix = 'docs/testing/a10-objective-gui-independent-review-20261021'
const own = `${prefix}-selftmp`
const base = 'reports/all-pending-evidence-20261021/A10'
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const read = p => JSON.parse(fs.readFileSync(p))
fs.mkdirSync(own, { recursive: true })
const contracts = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/objective-progress-acceptance.md',
  'docs/testing/remaining-objective-cases-20261021.md',
  'docs/testing/objective-independent-auto-20261021.md',
  'docs/testing/objective-number-independent-retest-20261021.md',
  'reports/all-pending-acceptance-execution-20261021.md',
]
const f2root = 'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5'
const files = []
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    assert(!e.isSymbolicLink(), `archive symlink: ${p}`)
    if (e.isDirectory()) walk(p)
    else if (e.isFile()) files.push(p)
  }
}
walk(base)
walk(f2root)
files.push(...contracts)
const before = Object.fromEntries(files.sort().map(p => {
  const s = fs.statSync(p)
  return [p, { sha256: hash(fs.readFileSync(p)), size: s.size, mtimeMs: s.mtimeMs }]
}))
const previous = path.join(own, 'inputs.json')
if (fs.existsSync(previous)) {
  for (const [p, original] of Object.entries(read(previous))) {
    assert.deepEqual(before[p], original, `changed archived input: ${p}`)
  }
}
const candidate = read(`${base}/candidate.json`)
assert.equal(hash(fs.readFileSync(`${base}/product-tracked.patch`)), candidate.trackedPatchSha)
const artifact = read(`${base}/build/artifacts.json`)
const loaded = read(`${base}/objective/loaded-r1/result.json`)
const event = loaded.events[0], match = event.matches[0]
const combo = fs.readFileSync(`${base}/objective/loaded-r1/${event.file}`)
assert.equal(hash(combo), event.responseSha)
assert.equal(combo.length, event.bytes)
assert.equal(event.status, 200)
assert.equal(event.fromDiskCache, false)
assert.equal(match.sourceSha, artifact['packages/dsh-pm-tool/lib/client.js'].sha256
  ?? artifact['packages/dsh-pm-tool/lib/client.js'])
const segment = combo.subarray(match.first, match.first + match.segmentBytes)
assert.equal(hash(segment), match.segmentSha)
assert.equal(combo.indexOf(segment), match.first)
assert.equal(combo.indexOf(segment, match.first + 1), -1)
assert.equal(loaded.state.origin, 'http://127.0.0.1:3221')
assert.equal(loaded.state.pilot, 'off')
assert.equal(hash(fs.readFileSync(`${f2root}/f2-backup.json`)), '451ce27c0b84c61419a6770dee27bf70795fef24b081e6be73c551bd9e7a1d8b')
const frames = {}
for (const d of ['seed', 'manual-r1', 'checklist-r1', 'report', 'report-r2', 'report-r3']) {
  const index = read(`${base}/objective/${d}/frames/frames.json`)
  for (const f of index.frames) {
    assert.equal(hash(fs.readFileSync(`${base}/objective/${d}/frames/${f.file}`)), f.sha256)
  }
  frames[d] = { count: index.frames.length, first: index.frames[0], last: index.frames.at(-1) }
}
const manual = read(`${base}/objective/manual-r1/observations.json`)
const checklist = read(`${base}/objective/checklist-r1/records.json`)
assert.equal(manual.length, 15)
assert.equal(checklist.length, 9)
const initial = manual[0].task.record
const stable = t => {
  const clone = structuredClone(t)
  delete clone.updatedAt
  delete clone.manualProgress
  delete clone.manualProgressNote
  return clone
}
const records = []
for (const [i, row] of manual.entries()) {
  assert.equal(row.task.version, 2)
  assert.deepEqual(stable(row.task.record), stable(initial))
  const expected = i === 0 ? undefined : i <= 5 ? 30 : i <= 10 ? 0 : null
  assert.equal(row.task.record.manualProgress, expected, row.label)
  records.push({ branch: 'manual', label: row.label, task: row.task, text: row.pm.text })
}
for (const [i, row] of checklist.entries()) {
  const t = row.task.record
  assert.equal(row.task.version, 2)
  assert.equal(t.manualProgress, null)
  assert.equal(t.status, 'todo')
  assert.equal(t.progress, 40)
  assert.deepEqual(t.checklist.map(x => [x.id, x.text]), initial.checklist.map(x => [x.id, x.text]))
  assert.equal(t.checklist[0].done, true)
  assert.equal(t.checklist[1].done, i >= 1 && i <= 4, row.label)
  const clone = stable(t)
  clone.checklist[1].done = false
  assert.deepEqual(clone, stable(initial))
  records.push({ branch: 'checklist', label: row.label, task: row.task, text: row.pm.text })
}
function differences(a, b) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => a[k] !== b[k])
}
const boundaries = {}
for (const branch of ['manual-r1', 'checklist-r1', 'report-r3']) {
  const b = read(`${base}/objective/${branch}/boundary.json`)
  const changed = differences(b.before, b.after)
  assert.deepEqual(changed, [branch === 'report-r3' ? '/pmtool/reports/rpt-0001.json' : '/pmtool/tasks/t-0003.json'])
  boundaries[branch] = { changed, before: b.before, after: b.after }
}
const report = read(`${base}/objective/report-r3/boundary.json`).reports['rpt-0001.json'].record
assert.equal(report.snapshot.tasks.averageProgress, 66)
assert.equal(report.snapshot.tasks.calcVersion, 1)
assert.equal(report.periodStart, '2026-10-19')
assert.equal(report.periodEnd, '2026-10-21')
for (const label of ['objective', 'restore']) {
  const b = read(`${base}/${label}/seed/boundary.json`)
  assert.deepEqual(b.before, b.first)
  assert.equal(Object.keys(b.before.data).filter(k => k.startsWith('/pmtool/')).length, 0)
}
const changedInputs = files.filter(p => {
  const s = fs.statSync(p)
  return hash(fs.readFileSync(p)) !== before[p].sha256 || s.size !== before[p].size || s.mtimeMs !== before[p].mtimeMs
})
assert.deepEqual(changedInputs, [])
const result = {
  at: new Date().toISOString(), runtime: process.version, platform: process.platform,
  argv: process.argv, cwd: process.cwd(), inputCount: files.length, changedInputs,
  baseline: candidate.baseline, hostGitHead: candidate.hostGitHead,
  trackedPatchSha: candidate.trackedPatchSha, sourceCount: Object.keys(candidate.sourceHashes).length,
  artifactCount: Object.keys(artifact).length, loaded, frames, boundaries,
  recordCount: records.length, report,
  boundary: 'Archive audit only; no product tests/build/runtime/GUI/service or credential reads. Mechanical success is not GUI PASS.',
}
fs.writeFileSync(previous, `${JSON.stringify(before, null, 2)}\n`)
fs.writeFileSync(path.join(own, 'records.json'), `${JSON.stringify(records, null, 2)}\n`)
fs.writeFileSync(path.join(own, 'audit.json'), `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify({ inputCount: files.length, frames, recordCount: records.length, changedInputs }))

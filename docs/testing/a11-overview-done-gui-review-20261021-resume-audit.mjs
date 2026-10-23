import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a11-overview-done-gui-review-20261021'
const own = `${prefix}-selftmp`
const a11 = 'reports/all-pending-evidence-20261021/A11'
const read = p => fs.readFileSync(path.resolve(repo, p))
const json = p => JSON.parse(read(p).toString())
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const frozen = json(`${own}/inputs.json`)
const old = json(`${own}/observations.json`)
const preserved = [`${prefix}-audit.mjs`, `${own}/inputs.json`, `${own}/observations.json`]
const partialHashes = Object.fromEntries(preserved.map(p => [p, sha(read(p))]))
const locked = p => {
  assert(frozen.inputs[p], `Unregistered original: ${p}`)
  const b = read(p)
  assert.equal(sha(b), frozen.inputs[p].sha256, `Original changed: ${p}`)
  return b
}
const j = p => JSON.parse(locked(p).toString())
const candidate = j(`${a11}/candidate.json`)
assert.deepEqual(candidate.artifacts, j(`${a11}/build/artifacts.json`))
const sync = j(`${a11}/build/sync.json`)
assert.deepEqual(candidate.sourceHashes, sync.sourceHashes)
assert.deepEqual(sync.drift, [])
assert.deepEqual(candidate.postDrift, [])
assert.equal(sha(locked(`${a11}/product-tracked.patch`)), candidate.trackedPatchSha)

const loaded = j(`${a11}/objective/loaded-r2/result.json`)
assert.equal(loaded.events.length, 1)
const event = loaded.events[0]
assert.equal(event.matches.length, 1)
assert.equal(event.status, 200)
assert.equal(event.fromDiskCache, false)
const response = locked(`${a11}/objective/loaded-r2/${event.file}`)
assert.equal(response.length, event.bytes)
assert.equal(sha(response), event.responseSha)
const artifactPath = 'packages/dsh-pm-tool/lib/client.js'
const artifact = read(frozen.snapshots[artifactPath].copy)
assert.equal(sha(artifact), candidate.artifacts[artifactPath])
const normalized = artifact.toString()
  .replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
  .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
const match = event.matches[0]
const first = response.indexOf(segment)
const second = response.indexOf(segment, first + 1)
assert(first >= 0)
assert.equal(first, match.first)
assert.equal(second, -1)
assert.equal(match.second, -1)
assert.equal(match.uniqueComplete, true)
assert.equal(segment.length, match.segmentBytes)
assert.equal(sha(segment), match.segmentSha)
assert.equal(sha(artifact), match.sourceSha)

const fixtureRoot = 'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5'
const backup = j(`${fixtureRoot}/f2-backup.json`)
const oracle = j(`${fixtureRoot}/f2.json`)
assert.equal(sha(locked(`${fixtureRoot}/f2-backup.json`)), old.fixture.backupSha)
assert.equal(oracle.today, '2026-10-21')
assert.equal(backup.projects.length, 1)
assert.equal(backup.tasks.length, 10)
assert.deepEqual(backup.tasks, oracle.tasks)
const done = backup.tasks.filter(t => t.status === 'done').map(t => t.id)
const wrapped = backup.tasks.filter(t => t.status === 'wrapped').map(t => t.id)
const legacy = backup.tasks.filter(t => t.status === 'done' || (t.progress ?? 0) >= 100).map(t => t.id)
assert.deepEqual(done, ['t-0007', 't-0008'])
assert.deepEqual(wrapped, ['t-0010'])
assert.deepEqual(legacy, ['t-0001', 't-0007', 't-0008'])
const seed = j(`${a11}/objective/seed/boundary.json`)
const browse = j(`${a11}/objective/overview/native100/boundary.json`)
assert.deepEqual(seed.before, seed.first)
const seedToBrowseDelta = [...new Set([...Object.keys(seed.after.data), ...Object.keys(browse.before)])]
  .filter(p => seed.after.data[p] !== browse.before[p])
  .map(p => ({ path: p, afterSeed: seed.after.data[p] ?? null, beforeBrowse: browse.before[p] ?? null }))
if (process.argv[3] === 'scope-business') {
  assert.deepEqual(seedToBrowseDelta.filter(v => v.path.startsWith('/pmtool/')), [])
} else {
  assert.deepEqual(seed.after.data, browse.before)
}
assert.deepEqual(browse.before, browse.after)
const records = [...backup.projects.map(record => ({ table: 'projects', record })),
  ...backup.tasks.map(record => ({ table: 'tasks', record }))].map(({ table, record }) => {
  const key = `/pmtool/${table}/${record.id}.json`
  const diskSha = seed.after.data[key]
  assert.match(diskSha, /^[a-f0-9]{64}$/)
  const prior = old.fixture.originalRecordChecks.find(r => r.key === key)
  assert(prior)
  assert.deepEqual(prior.originalRecord, record)
  assert.equal(prior.expected, diskSha)
  return { key, originalFixtureRecord: record, archivedDiskSha: diskSha,
    rawDiskRecordProvided: false, boundary: 'ID/path mapping, not a proof of raw disk field equivalence.' }
})

const states = ['observed-current', 'native100/upper-card', 'native100/lower-card', 'native100/tasks-counter']
  .map(name => {
    const state = j(`${a11}/objective/overview/${name}.json`)
    assert.equal(state.origin, 'http://127.0.0.1:3225')
    assert.equal(state.timeOrigin, loaded.state.timeOrigin)
    assert.equal(state.dark, false)
    assert.equal(state.viewport.width, 1440)
    assert.equal(state.viewport.height, 900)
    const isTasks = name.endsWith('tasks-counter')
    assert(state.pm.text.includes(isTasks ? '· 完成 2（20%）' : '任务完成\n2/10\n20% 已完成'))
    if (!isTasks) assert(state.pm.text.includes('任务完成率\n20%\n2 / 10'))
    return { name, at: state.at, origin: state.origin, timeOrigin: state.timeOrigin }
  })
const frameGroups = ['seed', 'overview/native100'].map(group => {
  const root = `${a11}/objective/${group}/frames`
  const meta = j(`${root}/frames.json`)
  for (const frame of meta.frames) assert.equal(sha(locked(`${root}/${frame.file}`)), frame.sha256)
  return { group, files: meta.frames.length,
    uniqueContent: new Set(meta.frames.map(f => f.sha256)).size,
    boundary: group === 'seed' ? 'Hash review only; not all seed frames visually reviewed in this continuation.' :
      'Five originals visually reviewed; three upper views and two task views, no visible lower completionHero.' }
})
const runtimePath = '/private/tmp/pmtool-a11-objective-runtime-20261021/artifacts/start.json'
const runtime = j(runtimePath)
assert.equal(runtime.pid, 32660)
assert.equal(runtime.port, 3225)
assert.equal(runtime.hostGitHead, candidate.hostGitHead)
const setup = j(`${a11}/environment.json`).setups.find(s => s.label === 'objective')
for (const k of ['label', 'port', 'root', 'plugin', 'patchSha']) assert.deepEqual(runtime[k], setup[k])
assert.equal(loaded.state.pmMounted, true)
assert.equal(loaded.state.pilot, 'off')
const mainMismatch = Object.entries(candidate.sourceHashes).filter(([p, h]) => sha(read(p)) !== h)
  .map(([p, expected]) => ({ path: p, expected, actual: sha(read(p)) }))
assert.deepEqual(mainMismatch, frozen.mainSourceMismatch)
for (const [p, h] of Object.entries(partialHashes)) assert.equal(sha(read(p)), h)
const result = {
  at: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  originalFreezeAt: frozen.at, originalObservationsAt: old.at, partialHashes,
  candidate: { baseline: candidate.baseline, hostGitHead: candidate.hostGitHead,
    trackedPatchSha: candidate.trackedPatchSha, sourceCount: Object.keys(candidate.sourceHashes).length,
    artifactCount: Object.keys(candidate.artifacts).length },
  loading: { responseSha: sha(response), responseBytes: response.length,
    artifactSha: sha(artifact), artifactBytes: artifact.length,
    segmentSha: sha(segment), segmentBytes: segment.length, first, second },
  fixture: { today: oracle.today, done, wrapped, legacy, records, seedToBrowseDelta },
  states, frameGroups, mainMismatch,
  result: 'Original-byte assertions consistent; GUI closure BLOCKED. No product or GUI execution.',
}
const name = process.argv[2] ?? 'resume-observations-r1'
assert.match(name, /^[a-z0-9-]+$/)
const destination = path.resolve(repo, `${own}/${name}.json`)
assert(destination.startsWith(path.resolve(repo, prefix)))
fs.writeFileSync(destination, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ ...result, fixture: { today: oracle.today, done, wrapped, legacy,
  mappedRecords: records.length, rawDiskRecordProvided: false, seedToBrowseDelta } }, null, 2))

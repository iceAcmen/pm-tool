import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const prefix = 'docs/testing/a11-meeting-layout-gui-review-20261021'
const own = `${prefix}-selftmp`
const base = 'reports/all-pending-evidence-20261021/A11'
const wt = '/private/tmp/pmtool-all-closure-20261021'
const startFile = '/private/tmp/pmtool-a11-materials-runtime-20261021/artifacts/start.json'
const json = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const hash = p => sha(fs.readFileSync(p))
const changed = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => a[k] !== b[k])
const fingerprint = p => {
  const s = fs.statSync(p)
  return { bytes: s.size, mtimeMs: s.mtimeMs, sha256: hash(p) }
}
const list = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  assert(!e.isSymbolicLink(), `unexpected archive symlink: ${dir}/${e.name}`)
  return e.isDirectory() ? list(`${dir}/${e.name}`) : e.isFile() ? [`${dir}/${e.name}`] : []
})
const candidate = json(`${base}/candidate.json`)
const inputFiles = [
  ...list(`${base}/meeting`), ...list(`${base}/build`),
  ...list(`${base}/materials/seed`), ...list(`${base}/materials/loaded-r2`),
  `${base}/materials/loaded-r1/combo-1.txt`,
  `${base}/candidate.json`, `${base}/environment.json`, `${base}/product-tracked.patch`,
  startFile, 'AGENTS.md', 'docs/collaboration.md',
  'docs/plans/2026-10-21-meeting-action-layout-closure.md',
  'docs/testing/a10-meeting-gui-independent-review-20261021.md',
  'docs/testing/a11-meeting-layout-independent-retest-20261021.md',
  ...Object.keys(candidate.sourceHashes).map(p => `${wt}/${p}`),
  ...Object.keys(candidate.artifacts).map(p => `${wt}/${p}`),
]
const fixtureFile = json(`${base}/materials/seed/boundary.json`).file
inputFiles.push(fixtureFile)
fs.mkdirSync(own, { recursive: true })
const snapshot = () => Object.fromEntries([...new Set(inputFiles)].sort().map(p => [p, fingerprint(p)]))
const emit = (name, value) => {
  const p = `${own}/${name}.json`
  assert(!fs.existsSync(p), `retain existing evidence: ${p}`)
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n')
}
const sourceDrift = root => Object.entries(candidate.sourceHashes)
  .filter(([p, h]) => !fs.existsSync(`${root}/${p}`) || hash(`${root}/${p}`) !== h).map(([p]) => p)
const artifactDrift = () => Object.entries(candidate.artifacts)
  .filter(([p, h]) => !fs.existsSync(`${wt}/${p}`) || hash(`${wt}/${p}`) !== h).map(([p]) => p)
if (process.argv[2] === 'final') {
  const initial = json(`${own}/inputs.json`), end = snapshot()
  const drift = changed(
    Object.fromEntries(Object.entries(initial).map(([p, v]) => [p, JSON.stringify(v)])),
    Object.fromEntries(Object.entries(end).map(([p, v]) => [p, JSON.stringify(v)])),
  )
  const images = list(`${own}/contact`).filter(p => p.endsWith('.png'))
  assert.equal(images.length, 29)
  emit('visual-index', Object.fromEntries(images.map(p => [p, fingerprint(p)])))
  const early = json(`${base}/meeting/actions/boundary.json`)
  assert.deepEqual(json(`${base}/meeting/actions/one-row-draft-manifest.json`), early.before)
  const originalEvents = json(`${base}/meeting/network-newcancel/transport.json`).frames
    .map(f => f.content.value.event)
  const storedAfter = json(`${base}/meeting/network-newcancel/after-main-save-meeting.json`).record
  const snapshots = originalEvents.filter(e => e.type === 'command/run' && e.data.args.trim() === 'web snapshot')
    .map(e => {
      const done = originalEvents.find(d => d.type === 'command/done' && d.data.commandId === e.data.commandId)
      const record = JSON.parse(done.data.text).meetings.find(m => m.id === 'mtg-0001')
      return { commandId: e.data.commandId, record }
    })
  assert.equal(snapshots.length, 7)
  snapshots.slice(-3).forEach(s => assert.deepEqual(s.record, storedAfter))
  emit('snapshot-link', snapshots)
  const final = { at: new Date().toISOString(), drift, sourceDrift: sourceDrift(wt),
    artifactDrift: artifactDrift(), currentMainDrift: sourceDrift('.'), inputs: Object.keys(end).length,
    visualSheets: images.length, oneDraftManifestEqual: true, finalSnapshotsRawRecordEqual: 3 }
  emit('final', final)
  assert.deepEqual(drift, [])
  assert.deepEqual(final.sourceDrift, [])
  assert.deepEqual(final.artifactDrift, [])
  console.log(JSON.stringify(final))
  process.exit(0)
}
assert.equal(process.argv[2], 'audit', 'use audit or final; no GUI execution')
if (fs.existsSync(`${own}/inputs.json`)) assert.deepEqual(snapshot(), json(`${own}/inputs.json`))
else emit('inputs', snapshot())
assert.equal(hash(`${base}/product-tracked.patch`), candidate.trackedPatchSha)
assert.deepEqual(candidate.postDrift, [])
assert.deepEqual(sourceDrift(wt), [])
assert.deepEqual(artifactDrift(), [])
assert.deepEqual(json(`${base}/build/sync.json`).sourceHashes, candidate.sourceHashes)
assert.deepEqual(json(`${base}/build/sync.json`).drift, [])
assert.deepEqual(json(`${base}/build/artifacts.json`), candidate.artifacts)
const setup = json(`${base}/environment.json`).setups.find(s => s.label === 'materials')
const start = json(startFile)
for (const k of ['label', 'port', 'root', 'plugin', 'empty', 'patchSha']) assert.deepEqual(start[k], setup[k])
assert.equal(start.pid, 32661)
assert.equal(start.hostGitHead, candidate.hostGitHead)
const loaded = json(`${base}/materials/loaded-r2/result.json`)
const event = loaded.events[0], match = event.matches[0]
const response = fs.readFileSync(`${base}/materials/loaded-r2/${event.file}`)
assert.equal(event.status, 200)
assert.equal(event.fromDiskCache, false)
assert.equal(response.length, event.bytes)
assert.equal(sha(response), event.responseSha)
assert.equal(match.sourceSha, candidate.artifacts['packages/dsh-pm-tool/lib/client.js'])
assert.equal(match.uniqueComplete, true)
assert.equal(match.second, -1)
const client = fs.readFileSync(`${wt}/packages/dsh-pm-tool/lib/client.js`)
const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
  .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
assert.equal(segment.length, match.segmentBytes)
assert.equal(sha(segment), match.segmentSha)
assert.equal(response.indexOf(segment), match.first)
assert.equal(response.indexOf(segment, match.first + 1), -1)
const css = response.toString().match(/var records_default = ("(?:[^"\\]|\\.)*");/)
assert(css)
assert.equal(JSON.parse(css[1]), fs.readFileSync(`${wt}/packages/dsh-pm-tool/src/client/views/records.css`, 'utf8'))
assert.equal(loaded.state.origin, 'http://127.0.0.1:3226')
assert.equal(loaded.state.pilot, 'off')
assert.equal(loaded.state.pmMounted, true)
// Actions precede the uncached reload. Keep the two page lifetimes explicit.
const r1response = fs.readFileSync(`${base}/materials/loaded-r1/combo-1.txt`)
assert.equal(r1response.indexOf(segment), match.first)
assert.equal(r1response.indexOf(segment, match.first + 1), -1)
const fixture = json(fixtureFile), initial = fixture.meetings.find(m => m.id === 'mtg-0001')
assert.deepEqual(initial.actions, [])
const seed = json(`${base}/materials/seed/boundary.json`)
const seedChanges = Object.fromEntries(['data', 'files', 'backups'].map(k => [k, changed(seed.before[k], seed.first[k])]))
assert(seedChanges.data.every(p => p.startsWith('/session_projcache/')))
assert.deepEqual(seedChanges.files, [])
assert.deepEqual(seedChanges.backups, [])
const raw = name => {
  const p = `${base}/meeting/${name}`
  const w = json(p)
  assert.equal(w.version, 2)
  assert.equal(w.record.id, initial.id)
  assert.equal(w.record.projectId, initial.projectId)
  return { path: p, sha256: hash(p), record: w.record }
}
const stable = m => {
  const c = structuredClone(m)
  delete c.actions
  delete c.updatedAt
  return c
}
const records = ['actions/before-meeting.json', 'actions/one-row-saved-meeting.json',
  'actions/two-row-saved-meeting.json', 'actions/cleared-saved-meeting.json',
  'network-newcancel/before-main-save-meeting.json',
  'network-newcancel/after-main-save-meeting.json', 'network-newcancel/after-newcancel-meeting.json'].map(raw)
records.forEach(r => assert.deepEqual(stable(r.record), stable(initial)))
assert.deepEqual(records[0].record, initial)
assert.equal(records[1].record.actions[0].taskId, 't-0001')
assert.deepEqual(records[2].record.actions.map(a => a.id), ['ai-001', 'ai-002'])
assert.deepEqual(records[2].record.actions.map(a => a.taskId), ['t-0001', null])
assert.deepEqual(records[3].record.actions,
  records[2].record.actions.map(a => ({ ...a, taskId: null })))
assert.equal(records[4].sha256, records[3].sha256)
assert.equal(records[5].record.actions[0].title, '失败待重试一已复核')
assert.deepEqual(records[5].record.actions[1], records[4].record.actions[1])
assert.equal(records[5].sha256, records[6].sha256)
const actions = json(`${base}/meeting/actions/boundary.json`)
assert.deepEqual(actions.cancelBefore, actions.after)
assert.equal(actions.before['/pmtool/meetings/mtg-0001.json'], records[0].sha256)
assert.equal(actions.after['/pmtool/meetings/mtg-0001.json'], records[3].sha256)
const cancel = json(`${base}/meeting/network-newcancel/boundary.json`)
assert.deepEqual(cancel.beforeCancel, cancel.afterCancel)
assert.equal(cancel.beforeCancel['/pmtool/meetings/mtg-0001.json'], records[5].sha256)
const transport = json(`${base}/meeting/network-newcancel/transport.json`)
const events = transport.frames.map(f => ({ at: f.at, direction: f.direction, ...f.content.value.event }))
const runs = events.filter(e => e.type === 'command/run')
const commands = runs.map(e => {
  const done = events.find(d => d.type === 'command/done' && d.data.commandId === e.data.commandId)
  assert(done)
  assert.equal(done.data.kind, 'success')
  return { at: e.at, id: e.data.commandId, name: e.data.name, args: e.data.args,
    runSeq: e.seq, doneSeq: done.seq, kind: done.data.kind }
})
assert.equal(events.length, 20)
assert.equal(commands.length, 10)
assert.equal(commands.filter(c => c.args.trim().startsWith('meeting')).length, 3)
assert.equal(commands.filter(c => c.args.trim() === 'web snapshot').length, 7)
const actionUpdates = commands.filter(c => c.args.includes('meeting action update'))
assert.deepEqual(actionUpdates.map(c => JSON.parse(c.args.slice(c.args.indexOf('{')))),
  records[5].record.actions.map(({ id, ...a }) => a))
const frames = {}
for (const branch of ['actions', 'network-newcancel', 'widths100', 'widths100-r2', 'widths100-r3']) {
  const p = `${base}/meeting/${branch}/frames`
  const manifest = json(`${p}/frames.json`)
  for (const row of manifest.frames) assert.equal(hash(`${p}/${row.file}`), row.sha256)
  frames[branch] = { count: manifest.frames.length, first: manifest.frames[0], last: manifest.frames.at(-1) }
}
const r3 = `${base}/meeting/widths100-r3`
assert.equal(json(`${r3}/outer-exit.json`).exit, 0)
assert.deepEqual(json(`${r3}/command-events.json`), [])
const totalBoundary = json(`${r3}/boundary.json`)
assert.deepEqual(totalBoundary.before, totalBoundary.after)
assert.equal(totalBoundary.states.length, 8)
const widths = []
for (const theme of ['light', 'dark']) for (const width of [1440, 1024, 768, 390]) {
  const name = `${theme}-${width}`
  const boundary = json(`${r3}/${name}-boundary.json`)
  assert.deepEqual(boundary.start, boundary.end)
  const before = raw(`widths100-r3/${name}-before-record.json`)
  const after = raw(`widths100-r3/${name}-after-record.json`)
  assert.equal(before.sha256, after.sha256)
  assert.equal(boundary.start['/pmtool/meetings/mtg-0001.json'], before.sha256)
  for (const state of ['first', 'last-select', 'cancelled']) {
    const observation = json(`${r3}/${name}-${state}.json`)
    assert.equal(observation.origin, loaded.state.origin)
    assert.equal(observation.timeOrigin, loaded.state.timeOrigin)
    assert.equal(observation.viewport.width, width)
    assert.equal(observation.viewport.height, 900)
    assert.equal(observation.dark, theme === 'dark')
  }
  const boxes = json(`${r3}/${name}-boxes.json`)
  const drawer = boxes[0].rect
  const controls = boxes.filter(b => ['LABEL', 'INPUT', 'SELECT', 'BUTTON'].includes(b.tag))
  const outside = controls.filter(b => b.rect.left < drawer.left - 1 || b.rect.right > drawer.right + 1)
  assert.deepEqual(outside, [])
  widths.push({ name, keys: Object.keys(boundary.start).length, sha256: before.sha256,
    first: json(`${r3}/${name}-first.json`).viewport, drawer,
    actionRows: boxes.filter(b => b.tag === 'DIV').slice(1).map(b => b.rect),
    horizontalOutside: outside, background: json(`${r3}/${name}-first.json`).pm,
    beforeAfterEqual: true })
}
const r2 = json(`${base}/meeting/widths100-r2/boundary.json`)
const observations = {}
for (const name of ['zero-row', 'one-row-draft', 'one-row-saved', 'two-row-draft', 'two-row-reopened',
  'two-cleared-draft', 'cleared-reopened', 'cancel-draft', 'cancelled']) {
  const o = json(`${base}/meeting/actions/${name}.json`)
  assert.equal(o.origin, loaded.state.origin)
  assert.equal(o.timeOrigin, 1792600365427.8)
  observations[name] = { at: o.at, viewport: o.viewport, fields: o.fields, alerts: o.alerts }
}
const audit = { at: new Date().toISOString(), baseline: candidate.baseline, host: candidate.hostGitHead,
  trackedPatchSha: candidate.trackedPatchSha, sourceFiles: Object.keys(candidate.sourceHashes).length,
  artifactFiles: Object.keys(candidate.artifacts).length, sourceDrift: sourceDrift(wt),
  artifactDrift: artifactDrift(), currentMainDrift: sourceDrift('.'), start, loaded,
  earlyLoaded: { bytes: r1response.length, sha256: sha(r1response), uniqueMatchingClient: true,
    resultSidecarMissing: true, actionsTimeOrigin: 1792600365427.8 },
  records, commands, events: events.length, frames, observations, widths, seedChanges,
  r2NotZeroWrite: changed(r2.before, r2.after),
  r3: { exit: 0, commandEvents: 0, states: 8, totalEqual: true,
    meetingSha: totalBoundary.before['/pmtool/meetings/mtg-0001.json'] },
  boundaries: ['mechanical checks do not sign GUI', 'A11 not current A12 source',
    'second action taskId null, not a second successful association',
    'actions viewport 1440x718/dpr2, not 1440x900/native100',
    'loaded-r1 lacks result sidecar; loaded-r2 binds later page lifetime',
    'raw equality is archived data scope, not files/backups or whole device'],
}
emit('audit', audit)
console.log(JSON.stringify({ sourceFiles: audit.sourceFiles, artifactFiles: audit.artifactFiles,
  currentMainDrift: audit.currentMainDrift, frames: Object.fromEntries(Object.entries(frames).map(([k, v]) => [k, v.count])),
  r2NotZeroWrite: audit.r2NotZeroWrite, r3: audit.r3, events: audit.events,
  commands: audit.commands.filter(c => c.args.startsWith(' meeting')) }))

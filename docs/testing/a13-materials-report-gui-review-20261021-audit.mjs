import fs from 'node:fs'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import path from 'node:path'

const prefix = 'docs/testing/a13-materials-report-gui-review-20261021'
const own = `${prefix}-selftmp`
const base = 'reports/all-pending-evidence-20261021/A11'
const materials = `${base}/materials`
const wt = '/private/tmp/pmtool-all-closure-20261021'
const startFile = '/private/tmp/pmtool-a11-materials-runtime-20261021/artifacts/start.json'
const json = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const hash = p => sha(fs.readFileSync(p))
const list = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  assert(!e.isSymbolicLink(), `archive symlink: ${dir}/${e.name}`)
  return e.isDirectory() ? list(`${dir}/${e.name}`) : [`${dir}/${e.name}`]
})
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const fingerprint = p => ({ sha256: hash(p), bytes: fs.statSync(p).size, mtimeMs: fs.statSync(p).mtimeMs })
const emit = (name, value) => {
  const p = `${own}/${name}.json`
  assert(!fs.existsSync(p), `retain existing ${p}`)
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n')
}
const candidate = json(`${base}/candidate.json`)
const fixtureFile = json(`${materials}/seed/boundary.json`).file
const branches = ['progress-journey', 'fixed-report', 'report-freeze-reentry']
const inputFiles = [...new Set([
  'AGENTS.md', 'docs/collaboration.md', 'docs/testing/remaining-journey-cases-20261021.md',
  ...['plan.md', 'gui-handoff.md', 'oracle-correction.md', 'id-map.json']
    .map(n => `docs/testing/materials-files-reports-independent-auto-20261021-${n}`),
  'docs/testing/materials-files-reports-independent-auto-20261021.md',
  ...branches.flatMap(b => list(`${materials}/${b}`)),
  ...list(`${materials}/seed`), ...list(`${materials}/loaded-r2`), ...list(`${base}/build`),
  `${base}/candidate.json`, `${base}/environment.json`, `${base}/product-tracked.patch`,
  fixtureFile, startFile,
  ...Object.keys(candidate.sourceHashes).map(p => `${wt}/${p}`),
  ...Object.keys(candidate.artifacts).map(p => `${wt}/${p}`),
])].sort()
const snapshot = () => Object.fromEntries(inputFiles.map(p => [p, fingerprint(p)]))
const sourceDrift = root => Object.entries(candidate.sourceHashes)
  .filter(([p, h]) => !fs.existsSync(`${root}/${p}`) || hash(`${root}/${p}`) !== h).map(([p]) => p)
const artifactDrift = () => Object.entries(candidate.artifacts)
  .filter(([p, h]) => !fs.existsSync(`${wt}/${p}`) || hash(`${wt}/${p}`) !== h).map(([p]) => p)
const mainDrift = () => sourceDrift('.')
fs.mkdirSync(own, { recursive: true })
if (process.argv[2] === 'final') {
  const initial = json(`${own}/inputs.json`), end = snapshot()
  const report = fs.readFileSync(`${prefix}.md`, 'utf8')
  const links = [...report.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)]
    .map(m => m[1]).filter(p => !/^[a-z]+:/.test(p))
  const finalTarget = path.resolve(`${own}/final.json`)
  const missingLinks = links.filter(p => path.resolve('docs/testing', p) !== finalTarget
    && !fs.existsSync(path.resolve('docs/testing', p)))
  const outputs = list(own)
  const oldSources = json('docs/testing/materials-files-reports-independent-auto-20261021-id-map.json').sourceFingerprint.frozen
  const dependencyPaths = ['core/task.ts', 'core/tasks.ts', 'core/task-materials.ts',
    'core/progress-reports.ts', 'commands/material.ts', 'commands/task.ts',
    'client/shared/task-draft-materials.tsx', 'client/views/records/records-report-form.tsx',
    'client/views/reports.tsx']
  const unchangedDependencies = dependencyPaths.map(p => {
    assert.equal(typeof oldSources[p], 'string', `missing old fingerprint ${p}`)
    assert.equal(oldSources[p], candidate.sourceHashes[`packages/dsh-pm-tool/src/${p}`])
    return { path: p, sha256: oldSources[p] }
  })
  const final = { at: new Date().toISOString(), inputCount: inputFiles.length,
    drift: diff(initial, end), sourceDrift: sourceDrift(wt), artifactDrift: artifactDrift(),
    mainDrift: mainDrift(), missingLinks, unchangedDependencies,
    outputs: Object.fromEntries(outputs.map(p => [p, fingerprint(p)])) }
  emit('final', final)
  assert.deepEqual(final.drift, [])
  assert.deepEqual(final.sourceDrift, [])
  assert.deepEqual(final.artifactDrift, [])
  assert.deepEqual(missingLinks, [])
  assert(links.every(p => fs.existsSync(path.resolve('docs/testing', p))))
  console.log(JSON.stringify({ ...final, outputs: outputs.length }))
  process.exit(0)
}
assert.equal(process.argv[2], 'audit', 'read-only evidence audit or final only')
emit('inputs', snapshot())
assert.equal(hash(`${base}/product-tracked.patch`), candidate.trackedPatchSha)
assert.deepEqual(candidate.postDrift, [])
assert.deepEqual(json(`${base}/build/sync.json`).sourceHashes, candidate.sourceHashes)
assert.deepEqual(json(`${base}/build/sync.json`).drift, [])
assert.deepEqual(json(`${base}/build/artifacts.json`), candidate.artifacts)
assert.deepEqual(sourceDrift(wt), [])
assert.deepEqual(artifactDrift(), [])
const setup = json(`${base}/environment.json`).setups.find(s => s.label === 'materials')
const start = json(startFile)
for (const k of ['label', 'port', 'root', 'plugin', 'empty', 'patchSha']) assert.deepEqual(start[k], setup[k])
assert.equal(start.port, 3226)
assert.equal(start.pid, 32661)
assert.equal(start.hostGitHead, candidate.hostGitHead)
const loaded = json(`${materials}/loaded-r2/result.json`)
const event = loaded.events[0], match = event.matches[0]
const response = fs.readFileSync(`${materials}/loaded-r2/${event.file}`)
assert.equal(event.status, 200)
assert.equal(event.fromDiskCache, false)
assert.equal(response.length, event.bytes)
assert.equal(sha(response), event.responseSha)
assert.equal(match.sourceSha, candidate.artifacts['packages/dsh-pm-tool/lib/client.js'])
const client = fs.readFileSync(`${wt}/packages/dsh-pm-tool/lib/client.js`, 'utf8')
const normalized = client.replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
  .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
assert.equal(segment.length, match.segmentBytes)
assert.equal(sha(segment), match.segmentSha)
assert.equal(response.indexOf(segment), match.first)
assert.equal(response.indexOf(segment, match.first + 1), -1)
assert.equal(match.uniqueComplete, true)
const pageStates = branches.flatMap(b => fs.readdirSync(`${materials}/${b}`)
  .filter(n => n.endsWith('.json')).map(n => [`${b}/${n}`, json(`${materials}/${b}/${n}`)])
  .filter(([, j]) => j.origin))
for (const [, j] of pageStates) {
  assert.equal(j.origin, 'http://127.0.0.1:3226')
  assert.equal(j.timeOrigin, loaded.state.timeOrigin)
  assert.deepEqual([j.viewport.width, j.viewport.height, j.dark], [1440, 900, true])
}
const seed = json(`${materials}/seed/boundary.json`)
const fixture = json(fixtureFile), original = fixture.tasks.find(t => t.id === 't-0001')
assert.equal(hash(fixtureFile), '8f9bf659a59077af3753900b9fec43dbca752673e59516d025f649a1982f8b4c')
const raw = (b, n) => {
  const p = `${materials}/${b}/${n}.json`, j = json(p)
  assert.equal(j.version, 2)
  return { path: p, sha256: hash(p), record: j.record }
}
const task = n => raw('progress-journey', n)
const initial = task('initial-task'), revisionBefore = task('revision-before-task')
assert.deepEqual(initial.record, original)
assert.equal(initial.sha256, revisionBefore.sha256)
assert.equal(initial.sha256, task('revision-draft-task').sha256)
assert.deepEqual(json(`${materials}/progress-journey/draft-boundary.json`).before,
  json(`${materials}/progress-journey/draft-boundary.json`).after)
const revised = task('revision-after-task'), deleted = task('soft-delete-after-task')
const restored = task('restore-after-task')
assert.equal(revised.sha256, task('soft-delete-before-task').sha256)
assert.equal(deleted.sha256, task('restore-before-task').sha256)
assert.equal(restored.sha256, task('final-task').sha256)
const entry = (t, id) => t.progressLog.find(e => e.id === id)
const e1 = entry(initial.record, 'pl-1')
assert.equal(e1.revisions.length, 3)
assert.equal(entry(revised.record, 'pl-1').revisions.length, 4)
assert.deepEqual(entry(revised.record, 'pl-1').revisions.slice(0, 3), e1.revisions)
assert.deepEqual(diff(e1, entry(revised.record, 'pl-1')), ['revisions'])
for (const t of [revised, deleted, restored]) {
  assert.deepEqual(t.record.attachments, initial.record.attachments)
  for (const id of ['pl-2', 'pl-3']) assert.deepEqual(entry(t.record, id), entry(initial.record, id))
  assert.deepEqual(t.record.progressLog.map(e => e.id), ['pl-1', 'pl-2', 'pl-3'])
}
assert.deepEqual(diff(initial.record, revised.record), ['manualProgress', 'progressLog', 'updatedAt'])
assert.equal(revised.record.manualProgress, null)
assert.deepEqual(diff(revised.record, deleted.record), ['progressLog', 'updatedAt'])
assert.deepEqual(diff(entry(revised.record, 'pl-1'), entry(deleted.record, 'pl-1')), ['deletedAt'])
assert.equal(entry(deleted.record, 'pl-1').deletedAt, '2026-10-21T20:36:14.446Z')
assert.deepEqual(entry(restored.record, 'pl-1'), entry(revised.record, 'pl-1'))
const progressBoundary = json(`${materials}/progress-journey/boundary.json`)
const rawPairs = [[revisionBefore, revised], [task('soft-delete-before-task'), deleted],
  [task('restore-before-task'), restored]]
progressBoundary.steps.forEach((s, i) => {
  assert.deepEqual(diff(s.before, s.after), ['/pmtool/tasks/t-0001.json'])
  assert.equal(s.before['/pmtool/tasks/t-0001.json'], rawPairs[i][0].sha256)
  assert.equal(s.after['/pmtool/tasks/t-0001.json'], rawPairs[i][1].sha256)
})
const commandPairs = b => {
  const events = json(`${materials}/${b}/command-events.json`).map(x => x.event)
  for (let i = 1; i < events.length; i++) assert.equal(events[i].seq, events[i - 1].seq + 1)
  const runs = events.filter(e => e.type === 'command/run')
  const pairs = runs.map(r => {
    const done = events.filter(e => e.type === 'command/done' && e.data.commandId === r.data.commandId)
    assert.equal(done.length, 1)
    assert.equal(done[0].data.kind, 'success')
    return { seq: r.seq, commandId: r.data.commandId, args: r.data.args.trim(), text: done[0].data.text }
  })
  assert.equal(events.length, pairs.length * 2)
  return pairs
}
const progressCommands = commandPairs('progress-journey')
const writes = progressCommands.filter(c => c.args.startsWith('task update'))
assert.equal(writes.length, 3)
writes.forEach((c, i) => {
  const payload = JSON.parse(c.args.slice(c.args.indexOf('{')))
  assert.deepEqual(Object.keys(payload.draft), ['progressOps'])
  assert.equal(payload.draft.progressOps.length, 1)
  assert.equal(payload.draft.progressOps[0].op, ['edit', 'delete', 'restore'][i])
  assert.equal(payload.draft.progressOps[0].id, 'pl-1')
  assert(!('attachments' in payload) && !('progressLog' in payload))
})
progressCommands.filter(c => c.args === 'web snapshot').forEach((c, i) =>
  assert.deepEqual(JSON.parse(c.text).tasks.find(t => t.id === 't-0001'), rawPairs[i][1].record))
const report = raw('fixed-report', 'rpt-0002')
assert.equal(report.record.id, 'rpt-0002')
assert.deepEqual([report.record.periodStart, report.record.periodEnd], ['2026-10-19', '2026-10-22'])
assert.deepEqual([report.record.sourceType, report.record.sourceSessionId], ['manual', null])
const fixedCommands = commandPairs('fixed-report')
assert.equal(fixedCommands.filter(c => c.args.startsWith('report generate')).length, 1)
const save = fixedCommands.find(c => c.args.startsWith('report generate'))
assert(save.args.startsWith('report generate p-0001 2026-10-19 2026-10-22 '))
const payload = JSON.parse(save.args.slice(save.args.indexOf('{')))
assert.deepEqual(payload.selectedRefs, [
  { taskId: 't-0001', entryId: 'pl-3', revisionId: 'rv-1' },
  { taskId: 't-0001', entryId: 'pl-1', revisionId: 'rv-4' },
])
assert.equal(report.record.excerpts.length, 2)
report.record.excerpts.forEach((ex, i) => {
  const ref = payload.selectedRefs[i], rv = entry(restored.record, ref.entryId).revisions.at(-1)
  for (const k of ['taskId', 'entryId', 'revisionId']) assert.equal(ex[k], ref[k])
  assert.deepEqual([ex.contentSnapshot, ex.author, ex.date], [rv.content, rv.author, rv.date])
  assert.equal(ex.capturedAt, report.record.snapshotAt)
})
fixedCommands.filter(c => c.args === 'web snapshot').forEach(c =>
  assert.deepEqual(JSON.parse(c.text).reports.find(r => r.id === 'rpt-0002'), report.record))
const fixedBoundary = json(`${materials}/fixed-report/boundary.json`)
assert.deepEqual(fixedBoundary.before, fixedBoundary.preview)
assert.deepEqual(diff(fixedBoundary.before, fixedBoundary.after), ['/pmtool/reports/rpt-0002.json'])
assert.equal(fixedBoundary.after['/pmtool/reports/rpt-0002.json'], report.sha256)
const sourceBefore = raw('report-freeze-reentry', 'before-task')
const sourceAfter = raw('report-freeze-reentry', 'after-source-task')
assert.equal(sourceBefore.sha256, restored.sha256)
assert.deepEqual(entry(sourceAfter.record, 'pl-1').revisions.slice(0, 4), entry(sourceBefore.record, 'pl-1').revisions)
assert.equal(entry(sourceAfter.record, 'pl-1').revisions.at(-1).id, 'rv-5')
assert.equal(entry(sourceAfter.record, 'pl-1').revisions.at(-1).author, '测试甲')
assert.deepEqual(diff(sourceBefore.record, sourceAfter.record), ['progressLog', 'updatedAt'])
for (const id of ['pl-2', 'pl-3']) assert.deepEqual(entry(sourceAfter.record, id), entry(sourceBefore.record, id))
assert.deepEqual(sourceAfter.record.attachments, sourceBefore.record.attachments)
for (const n of ['before-report', 'after-source-report']) {
  assert.equal(raw('report-freeze-reentry', n).sha256, report.sha256)
}
const reentryBoundary = json(`${materials}/report-freeze-reentry/boundary.json`)
assert.deepEqual(diff(reentryBoundary.before, reentryBoundary.after), ['/pmtool/tasks/t-0001.json'])
assert.deepEqual(reentryBoundary.cancelBefore, reentryBoundary.after)
assert.equal(reentryBoundary.executed, false)
const reentryCommands = commandPairs('report-freeze-reentry')
assert.equal(reentryCommands.length, 2)
assert(reentryCommands[0].args.startsWith('task update t-0001 '))
assert.equal(reentryCommands[1].args, 'web snapshot')
const finalSnapshot = JSON.parse(reentryCommands[1].text)
assert.deepEqual(finalSnapshot.tasks.find(t => t.id === 't-0001'), sourceAfter.record)
assert.deepEqual(finalSnapshot.reports.find(r => r.id === 'rpt-0002'), report.record)
const readonly = json(`${materials}/report-freeze-reentry/readonly-source.json`)
assert.deepEqual(readonly.dateFields, [
  { value: '2026-10-19', disabled: true }, { value: '2026-10-22', disabled: true },
])
assert(readonly.text.includes('来源（不可改）') && readonly.text.includes('pl-1/rv-4'))
const frameCounts = Object.fromEntries(branches.map(b => {
  const frames = json(`${materials}/${b}/frames/frames.json`).frames
  for (const f of frames) assert.equal(hash(`${materials}/${b}/frames/${f.file}`), f.sha256)
  assert.equal(json(`${materials}/${b}/outer-exit.json`).exit, 0)
  return [b, frames.length]
}))
const audit = { at: new Date().toISOString(), inputCount: inputFiles.length,
  sourceCount: Object.keys(candidate.sourceHashes).length,
  artifactCount: Object.keys(candidate.artifacts).length,
  sourceDrift: sourceDrift(wt), artifactDrift: artifactDrift(), mainDrift: mainDrift(),
  baseline: candidate.baseline, patchSha: candidate.trackedPatchSha,
  hostGitHead: start.hostGitHead, instance: { port: start.port, pid: start.pid, at: start.at, plugin: start.plugin },
  loaded: { responseSha: event.responseSha, responseBytes: response.length, match, state: loaded.state },
  fixture: { path: fixtureFile, sha256: hash(fixtureFile), taskId: original.id, projectId: original.projectId },
  seedPrecheckDiff: Object.fromEntries(['data', 'files', 'backups'].map(k => [k, diff(seed.before[k], seed.first[k])])),
  frameCounts, pageStates: pageStates.map(([p, j]) => ({ path: p, at: j.at, timeOrigin: j.timeOrigin })),
  rawFiles: [initial, revised, deleted, restored, report, sourceBefore, sourceAfter]
    .map(({ path, sha256 }) => ({ path, sha256 })),
  commands: { progress: progressCommands, fixed: fixedCommands, reentry: reentryCommands },
  boundaries: { draftZero: true, previewZero: true, cancelZero: true,
    reportWholeRawSame: true, oldThreeRevisionsSame: true, E2E3Same: true },
  scope: 'mechanical raw evidence checks only; independent visual review remains separate' }
emit('audit', audit)
console.log(JSON.stringify({ ...audit, commands: Object.fromEntries(Object.entries(audit.commands).map(([k, v]) => [k, v.length])) }))

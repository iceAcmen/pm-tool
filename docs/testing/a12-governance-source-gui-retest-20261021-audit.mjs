import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { isDeepStrictEqual as equal } from 'node:util'

// Only archived evidence and explicitly declared source/artifact bytes are read.
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a12-governance-source-gui-retest-20261021'
const a12 = 'reports/all-pending-evidence-20261021/A12'
const green = 'docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected'
const roots = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/a11-governance-source-gui-review-20261021.md',
  'docs/testing/a12-provenance-id-independent-retest-20261021.md',
  'docs/testing/a12-provenance-id-independent-retest-20261021-evidence',
  'docs/testing/governance-fix-independent-retest-20261021-gui-handoff.md',
  'docs/testing/governance-growth-independent-auto-20261021-gui-handoff.md',
  'reports/all-pending-acceptance-execution-20261021.md',
  'docs/plans/2026-10-21-provenance-source-id-closure.md',
  a12, green,
  '/private/tmp/pmtool-a12-governance-runtime-20261021/artifacts/start.json',
]
const absolute = p => path.isAbsolute(p) ? p : path.join(repo, p)
const hash = b => crypto.createHash('sha256').update(b).digest('hex')
const raw = p => fs.readFileSync(absolute(p))
const read = p => JSON.parse(raw(p))
const excluded = p => p.split(path.sep).includes('private') && !p.startsWith('/private/tmp/')
  || /(?:^|\/)(?:private|credentials)(?:\/|$)/.test(p.replace(/^\/private\/tmp\//, ''))
  || /^(?:url|private-url|token|secret|cookie|credentials)(?:[.-]|$)/i.test(path.basename(p))
const scan = (p, files, missing) => {
  if (excluded(p)) return
  const abs = absolute(p)
  if (!fs.existsSync(abs)) { missing.push(p); return }
  const stat = fs.lstatSync(abs)
  if (stat.isSymbolicLink()) throw new Error(`Unexpected input symlink: ${p}`)
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(abs).sort()) scan(path.join(p, name), files, missing)
  } else if (stat.isFile()) {
    const bytes = raw(p)
    files[p] = { sha256: hash(bytes), bytes: bytes.length }
  }
}
const output = (suffix, o) => {
  const dest = absolute(`${prefix}-${suffix}.json`)
  if (fs.existsSync(dest)) throw new Error(`Refuse overwrite: ${dest}`)
  fs.writeFileSync(dest, JSON.stringify(o, null, 2) + '\n', { flag: 'wx' })
}
const delta = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(p => a[p] !== b[p]).map(p => ({ path: p, before: a[p] ?? null, after: b[p] ?? null }))
const mode = process.argv[2]
if (mode === 'freeze') {
  const files = {}, missing = []
  for (const p of roots) scan(p, files, missing)
  const candidate = read(`${a12}/candidate.json`)
  const sourceComparison = [], artifactComparison = []
  for (const [p, expected] of Object.entries(candidate.sourceHashes)) {
    for (const tree of [repo, candidate.tree]) {
      const full = path.join(tree, p)
      scan(full, files, missing)
      sourceComparison.push({ tree, path: p, expected, actual: files[full]?.sha256 ?? null })
    }
  }
  for (const [p, expected] of Object.entries(candidate.artifacts)) {
    const full = path.join(candidate.tree, p)
    scan(full, files, missing)
    artifactComparison.push({ path: p, expected, actual: files[full]?.sha256 ?? null })
  }
  const o = { at: new Date().toISOString(), roots, files, missing,
    baseline: candidate.baseline, hostGitHead: candidate.hostGitHead,
    sourceComparison, artifactComparison,
    boundary: 'Independent archived evidence review only; no private URLs, GUI, build, services, product execution, install, credentials or commit.' }
  output('inputs-r2', o)
  console.log(JSON.stringify({ at: o.at, frozen: Object.keys(files).length, missing,
    sourceMismatch: sourceComparison.filter(x => x.actual !== x.expected),
    artifactMismatch: artifactComparison.filter(x => x.actual !== x.expected) }, null, 2))
} else if (mode === 'review') {
  const frozen = read(`${prefix}-inputs-r2.json`)
  const bytes = p => {
    if (!frozen.files[p]) throw new Error(`Not frozen: ${p}`)
    const b = raw(p)
    if (hash(b) !== frozen.files[p].sha256) throw new Error(`Drift: ${p}`)
    return b
  }
  const json = p => JSON.parse(bytes(p))
  const g = p => `${a12}/governance/${p}`
  const entry = o => o.record.value.entries[0]
  const noHistory = o => { const { history, ...rest } = o; return rest }
  const candidate = json(`${a12}/candidate.json`)
  const artifacts = json(`${a12}/build-r2/artifacts.json`)
  const standardPath = `${green}/F6-ui-standard/pmtool-backup-2026-10-21T14-08-30-668Z.json`
  const standard = json(standardPath)
  const expected = json(`${green}/F6-ui-expected.json`)
  const standardEntry = standard.extra.settings.find(([k]) => k === 'pmProvenanceLedger')[1].value.entries[0]
  const loaded = json(g('loaded-r2/result.json'))
  const combo = bytes(g('loaded-r2/combo-1.txt'))
  const begin = Buffer.from('window.__ModuleLoader__.load({ id: "dsh-pm-tool", factory: (require) => {')
  const end = Buffer.from('return module.exports; } });')
  const first = combo.indexOf(begin)
  const last = combo.indexOf(end, first) + end.length
  if (first < 0 || last < first) throw new Error('No complete plugin segment')
  const segment = combo.subarray(first, last)
  const recovered = Buffer.concat([segment, Buffer.from('\n//# sourceMappingURL=client.js.map')])
  const jumps = json(g('source-jumps/boundary.json'))
  const seed = json(g('seed-r2/boundary.json'))
  const initialLedger = entry(json(g('source-jumps/before-ledger.json')))
  const frames = ['seed-r2', 'source-jumps', 'source-stale', 'restart'].map(p => {
    const meta = json(g(`${p}/frames/frames.json`))
    return { directory: p, count: meta.frames.length, source: meta.source,
      mismatch: meta.frames.filter(f => hash(bytes(g(`${p}/frames/${f.file}`))) !== f.sha256).map(f => f.file),
      first: meta.frames[0]?.at, last: meta.frames.at(-1)?.at,
      timestampRegressions: meta.frames.flatMap((f, i) =>
        i && f.metadata.timestamp < meta.frames[i - 1].metadata.timestamp ? [f.file] : []) }
  })
  const refs = expected.refs.map((r, i) => {
    const before = json(g(`source-jumps/ref-${i}-before.json`))
    const target = json(g(`source-jumps/source-${i}.json`))
    const returned = json(g(`source-jumps/returned-${i}.json`))
    const title = target.fields.find(f => f.name === (r.table === 'deliverables' ? 'name' : 'title'))?.value
    return { index: i, table: r.table, id: r.id, label: r.label, role: r.role,
      visibleReferenceMeta: jumps.steps[i]?.reference.text,
      beforeHasId: before.pm.text.includes(r.id), targetTitle: title, titleMatches: title === r.label,
      targetProjectA: target.pm.text.includes('当前项目 · QA-G A'),
      returnedHasLedger: returned.pm.text.includes('AI 溯源台账'),
      returnedHasId: returned.pm.text.includes(r.id),
      origin: target.origin, timeOrigin: target.timeOrigin,
      beforeTimeOrigin: before.timeOrigin, returnedTimeOrigin: returned.timeOrigin }
  })
  const stale = json(g('source-stale/boundary.json'))
  const steps = ['changed-recheck-1', 'changed-recheck-2', 'missing-recheck-1', 'missing-recheck-2'].map(name => {
    const bpath = g(`source-stale/${name}-before-ledger.json`)
    const apath = g(`source-stale/${name}-after-ledger.json`)
    const before = entry(json(bpath)), after = entry(json(apath))
    const boundary = stale.boundaries.find(b => b.name === name)
    const n = before.history?.length ?? 0
    return { name, beforeLength: n, afterLength: after.history?.length,
      prefixEqual: equal(before.history ?? [], after.history.slice(0, n)),
      exceptHistoryEqual: equal(noHistory(before), noHistory(after)),
      refsEqual: equal(before.refs, after.refs),
      beforeLedgerShaMatches: hash(bytes(bpath)) === boundary.before['/pmtool/settings/pmProvenanceLedger.json'],
      afterLedgerShaMatches: hash(bytes(apath)) === boundary.after['/pmtool/settings/pmProvenanceLedger.json'],
      delta: delta(boundary.before, boundary.after),
      appended: after.history.slice(n).map(h => ({ at: h.at, conclusion: h.conclusion,
        snapshotVersion: h.snapshotVersion, ruleRevision: h.ruleRevision,
        states: h.rows.map(r => ({ table: r.ref.table, id: r.ref.id, state: r.state, reason: r.reason })) })) }
  })
  const taskBefore = json(g('source-stale/update-before-task.json'))
  const taskAfter = json(g('source-stale/update-after-task.json'))
  const taskChanges = [...new Set([...Object.keys(taskBefore.record), ...Object.keys(taskAfter.record)])]
    .filter(k => !equal(taskBefore.record[k], taskAfter.record[k]))
    .map(k => ({ path: k, beforePresent: Object.hasOwn(taskBefore.record, k),
      afterPresent: Object.hasOwn(taskAfter.record, k),
      before: taskBefore.record[k] ?? null, after: taskAfter.record[k] ?? null }))
  const restartBefore = json(g('restart/before.json'))
  const restartAfter = json(g('restart/after.json'))
  const restartBeforeNormalized = Object.fromEntries(Object.entries(restartBefore.data).map(([p, v]) => [`/${p}`, v[0]]))
  const events = p => {
    const list = json(g(`${p}/command-events.json`))
    return { count: list.length, runs: list.filter(x => x.event.type === 'command/run').map(x => {
      const d = x.event.data
      const done = list.find(y => y.event.type === 'command/done' && y.event.data.commandId === d.commandId)
      return { at: x.at, seq: x.event.seq, commandId: d.commandId, name: d.name, args: d.args,
        done: done ? { at: done.at, seq: done.event.seq, kind: done.event.data.kind, text: done.event.data.text } : null }
    }) }
  }
  const build = Object.fromEntries(['noemit', 'build', 'coverage'].map(p => [p, json(`${a12}/build-r2/${p}.exit.json`)]))
  const o = {
    at: new Date().toISOString(), mode: 'static-original-evidence-analysis-only',
    candidate: { baseline: candidate.baseline, hostGitHead: candidate.hostGitHead, tree: candidate.tree,
      sourceCount: Object.keys(candidate.sourceHashes).length, artifactCount: Object.keys(artifacts).length,
      panelSha: candidate.sourceHashes['packages/dsh-pm-tool/src/client/provenance-panel.tsx'],
      packageVersion: json(`${candidate.tree}/packages/dsh-pm-tool/package.json`).version,
      patchMatches: hash(bytes(`${a12}/product-tracked.patch`)) === candidate.trackedPatchSha,
      artifactManifestMatches: equal(artifacts, candidate.artifacts), build,
      syncSourceMatches: equal(json(`${a12}/build-r2/sync.json`).sourceHashes, candidate.sourceHashes) },
    loaded: { ...loaded, responseBytes: combo.length, responseSha: hash(combo),
      responseMatchesOriginal: hash(combo) === loaded.events[0].responseSha && combo.length === loaded.events[0].bytes,
      first, last, second: combo.indexOf(begin, first + 1), segmentSha: hash(segment), segmentBytes: segment.length,
      recoveredSha: hash(recovered), recoveredBytes: recovered.length,
      exactArtifactAfterOnlySourceMapSuffix: hash(recovered) === artifacts['packages/dsh-pm-tool/lib/client.js'],
      sourceShaMatchesManifest: loaded.events[0].matches[0].sourceSha === artifacts['packages/dsh-pm-tool/lib/client.js'] },
    seed: { standardSha: hash(bytes(standardPath)), preconfirmUnchanged: equal(seed.before, seed.first),
      beforeCount: Object.keys(seed.before.data).length, afterCount: Object.keys(seed.after.data).length,
      filesBeforeAfterEqual: equal(seed.before.files, seed.after.files),
      backupsBeforeAfterEqual: equal(seed.before.backups, seed.after.backups),
      rawInitialLedgerEqualsStandard: equal(initialLedger, standardEntry),
      refsEqualAppliedOriginal: equal(initialLedger.refs, json(`${green}/F6-nonempty-ledger.json`).entries[0].refs) },
    refs, jumps: { refsEqualExpected: equal(initialLedger.refs, expected.refs),
      rawLedgerBeforeAfterEqual: equal(json(g('source-jumps/before-ledger.json')), json(g('source-jumps/after-ledger.json'))),
      delta: delta(jumps.before, jumps.after),
      reentryText: json(g('source-jumps/reentered.json')).pm.text,
      sameNameFixture: new Set(expected.refs.map(r => r.label)).size !== expected.refs.length,
      events: events('source-jumps') },
    changed: { taskChanges, versionBefore: taskBefore.version, versionAfter: taskAfter.version,
      attachmentsEqual: equal(taskBefore.record.attachments, taskAfter.record.attachments),
      progressLogEqual: equal(taskBefore.record.progressLog, taskAfter.record.progressLog),
      taskBeforeMatchesStandard: equal(taskBefore.record, standard.tasks.find(t => t.id === 't-0001')),
      beforeTaskShaMatches: hash(bytes(g('source-stale/update-before-task.json'))) === stale.boundaries[0].before['/pmtool/tasks/t-0001.json'],
      afterTaskShaMatches: hash(bytes(g('source-stale/update-after-task.json'))) === stale.boundaries[0].after['/pmtool/tasks/t-0001.json'],
      updateDelta: delta(stale.boundaries[0].before, stale.boundaries[0].after),
      rawLedgerUnchangedByUpdate: equal(json(g('source-stale/update-before-ledger.json')), json(g('source-stale/update-after-ledger.json'))) },
    stale: { steps, events: events('source-stale'),
      deleteDelta: delta(stale.boundaries[3].before, stale.boundaries[3].after),
      deletedSourceMatchesStandard: equal(json(g('source-stale/delete-before-task.json')).record, standard.tasks.find(t => t.id === 't-0002')),
      deleteLedgerUnchanged: equal(json(g('source-stale/delete-before-ledger.json')), json(g('source-stale/delete-after-ledger.json'))),
      lastExceptHistoryEqualsStandard: equal(noHistory(entry(json(g('source-stale/missing-recheck-2-after-ledger.json')))), noHistory(standardEntry)),
      continuous: ['changed', 'missing'].map(p => ({ phase: p, equal: equal(
        json(g(`source-stale/${p}-recheck-1-after-ledger.json`)), json(g(`source-stale/${p}-recheck-2-before-ledger.json`))) })),
      missingJumpButtons: json(g('source-stale/missing-no-link.json')).buttons.filter(b => b.text?.trim() === '来源任务二'),
      missingLabelClickText: json(g('source-stale/missing-label-click.json')).pm.text },
    restart: { oldStart: json(g('restart/start-old.json')), newStart: json(g('restart/start-new.json')),
      originalStart: json('/private/tmp/pmtool-a12-governance-runtime-20261021/artifacts/start.json'),
      delta: delta(restartBeforeNormalized, restartAfter.data),
      rawLedgerEqual: equal(json(g('restart/before-ledger.json')), json(g('restart/after-ledger.json'))),
      rawTaskEqual: equal(json(g('restart/before-task.json')), json(g('restart/after-task.json'))),
      ledgerSameAsFinalRecheck: equal(json(g('restart/before-ledger.json')), json(g('source-stale/missing-recheck-2-after-ledger.json'))),
      historyLength: entry(json(g('restart/after-ledger.json'))).history.length,
      guiTimeOrigin: json(g('restart/history-after-restart.json')).timeOrigin,
      guiText: json(g('restart/history-after-restart.json')).pm.text },
    frames,
    boundaries: 'Archived request events certify only observed commands and consumer. Restart start records do not alone prove TERM/port-free. No GUI execution or whole product regression.'
  }
  output(process.argv[3] || 'observations', o)
  console.log(JSON.stringify({ at: o.at, candidate: o.candidate, loaded: {
    responseMatchesOriginal: o.loaded.responseMatchesOriginal, exactArtifact: o.loaded.exactArtifactAfterOnlySourceMapSuffix,
    first, last, second: o.loaded.second, recoveredSha: o.loaded.recoveredSha },
    seed: o.seed, refs: refs.map(({ index, id, titleMatches, returnedHasLedger }) => ({ index, id, titleMatches, returnedHasLedger })),
    steps: steps.map(({ name, beforeLength, afterLength, prefixEqual, exceptHistoryEqual, beforeLedgerShaMatches, afterLedgerShaMatches }) =>
      ({ name, beforeLength, afterLength, prefixEqual, exceptHistoryEqual, beforeLedgerShaMatches, afterLedgerShaMatches })),
    frames, restartDelta: o.restart.delta }, null, 2))
} else if (mode === 'finish') {
  const frozen = read(`${prefix}-inputs-r2.json`)
  const current = {}, missing = []
  for (const p of roots) scan(p, current, missing)
  for (const p of Object.keys(frozen.files)) {
    if (!current[p]) scan(p, current, missing)
  }
  const differences = delta(
    Object.fromEntries(Object.entries(frozen.files).map(([p, v]) => [p, v.sha256])),
    Object.fromEntries(Object.entries(current).map(([p, v]) => [p, v.sha256])))
  const o = { at: new Date().toISOString(), freezeAt: frozen.at,
    countBefore: Object.keys(frozen.files).length, countAfter: Object.keys(current).length,
    differences, missing, boundary: 'Only registered evidence and declared source/artifact inputs; no claim of whole-machine zero drift.' }
  output(process.argv[3] || 'drift-final', o)
  console.log(JSON.stringify(o, null, 2))
} else {
  throw new Error('Use freeze, review, finish [suffix]')
}

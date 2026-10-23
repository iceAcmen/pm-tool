import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { isDeepStrictEqual as equal } from 'node:util'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a11-governance-source-gui-review-20261021'
const a10 = 'reports/all-pending-evidence-20261021/A10'
const green = 'docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected'
const roots = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/governance-fix-independent-retest-20261021-gui-handoff.md',
  'docs/testing/governance-growth-independent-auto-20261021-gui-handoff.md',
  'docs/testing/governance-fix-independent-retest-20261021-report.md',
  'docs/testing/governance-fix-independent-retest-20261021-id-status.json',
  'docs/testing/governance-fix-independent-retest-20261021-deliverable-index.json',
  'docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/dependency-scope-final.json',
  'docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/source-before.json',
  'reports/all-pending-acceptance-execution-20261021.md',
  `${a10}/governance`, `${a10}/candidate.json`, `${a10}/environment.json`,
  `${a10}/product-tracked.patch`, `${a10}/build`,
  green,
  '/private/tmp/pmtool-a10-governance-runtime-20261021/artifacts/start.json',
]
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const absolute = p => path.isAbsolute(p) ? p : path.join(repo, p)
const read = p => JSON.parse(fs.readFileSync(absolute(p), 'utf8'))
const scan = (p, files, missing) => {
  const abs = absolute(p)
  if (!fs.existsSync(abs)) { missing.push(p); return }
  const stat = fs.lstatSync(abs)
  if (stat.isSymbolicLink()) throw new Error(`Unexpected evidence symlink: ${p}`)
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(abs).sort()) scan(path.join(p, name), files, missing)
  } else if (stat.isFile()) {
    const bytes = fs.readFileSync(abs)
    files[p] = { sha256: hash(bytes), bytes: bytes.length }
  }
}
const output = (suffix, value) => {
  const destination = absolute(`${prefix}-${suffix}.json`)
  if (fs.existsSync(destination)) throw new Error(`Refuse overwrite: ${destination}`)
  fs.writeFileSync(destination, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}

const mode = process.argv[2]
if (mode === 'freeze') {
  const files = {}, missing = []
  for (const root of roots) scan(root, files, missing)
  const candidate = read(`${a10}/candidate.json`)
  const sourceComparison = [], artifactComparison = []
  for (const [p, expected] of Object.entries(candidate.sourceHashes)) {
    for (const tree of [repo, '/private/tmp/pmtool-all-closure-20261021']) {
      const full = path.join(tree, p)
      scan(full, files, missing)
      sourceComparison.push({ tree, path: p, expected, actual: files[full]?.sha256 ?? null })
    }
  }
  for (const [p, expected] of Object.entries(read(`${a10}/build/artifacts.json`))) {
    const full = path.join('/private/tmp/pmtool-all-closure-20261021', p)
    scan(full, files, missing)
    artifactComparison.push({ path: p, expected, actual: files[full]?.sha256 ?? null })
  }
  const body = {
    at: new Date().toISOString(), role: 'independent-evidence-review-only',
    roots, files, missing, sourceComparison, artifactComparison,
    baseline: candidate.baseline, hostGitHead: candidate.hostGitHead,
    boundary: 'No GUI, product execution, build, service, profile, credentials or business data access. Current source hashes are comparison only, not A10 substitution.',
  }
  output('inputs', body)
  console.log(JSON.stringify({
    at: body.at, frozen: Object.keys(files).length, missing,
    mainSourceMismatch: sourceComparison.filter(x => x.tree === repo && x.actual !== x.expected).map(x => x.path),
    isolatedSourceMismatch: sourceComparison.filter(x => x.tree !== repo && x.actual !== x.expected).map(x => x.path),
    artifactMismatch: artifactComparison.filter(x => x.actual !== x.expected).map(x => x.path),
  }, null, 2))
} else if (mode === 'review') {
  const frozen = read(`${prefix}-inputs.json`)
  const bytes = p => {
    if (!frozen.files[p]) throw new Error(`Input not frozen: ${p}`)
    const value = fs.readFileSync(absolute(p))
    if (hash(value) !== frozen.files[p].sha256) throw new Error(`Input drift: ${p}`)
    return value
  }
  const json = p => JSON.parse(bytes(p).toString())
  const g = p => `${a10}/governance/${p}`
  const entry = wrapper => wrapper.record.value.entries[0]
  const withoutHistory = value => {
    const { history, ...rest } = value
    return rest
  }
  const delta = (before, after) => [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .sort().filter(p => before[p] !== after[p])
    .map(p => ({ path: p, before: before[p] ?? null, after: after[p] ?? null }))
  const jump = json(g('source-jumps-r3/boundary.json'))
  const expected = json(`${green}/F6-ui-expected.json`)
  const original = json(`${green}/F6-nonempty-ledger.json`).entries[0]
  const standardPath = `${green}/F6-ui-standard/pmtool-backup-2026-10-21T14-08-30-668Z.json`
  const standard = json(standardPath)
  const originalRaw = standard.extra.settings.find(([key]) => key === 'pmProvenanceLedger')[1].value.entries[0]
  const continued = json(g('changed-recheck-r2/continued.json'))
  const history = json(g('recheck-history/boundary.json'))
  const deleteBefore = json(g('missing-recheck/before.json'))
  const deleteAfter = json(g('missing-recheck/after-delete.json'))
  const deleteLedgerBefore = json(g('missing-recheck/before-ledger.json'))
  const deleteLedgerAfter = json(g('missing-recheck/after-delete-ledger.json'))
  const historyCheck = (before, after) => ({
    beforeLength: entry(before).history?.length ?? 0,
    afterLength: entry(after).history?.length ?? 0,
    originalPrefixEqual: equal(entry(before).history, entry(after).history.slice(0, entry(before).history.length)),
    entryExceptHistoryEqual: equal(withoutHistory(entry(before)), withoutHistory(entry(after))),
    refsEqual: equal(entry(before).refs, entry(after).refs),
    appended: entry(after).history.slice(entry(before).history.length).map(h => ({
      at: h.at, conclusion: h.conclusion, snapshotVersion: h.snapshotVersion,
      ruleRevision: h.ruleRevision, states: h.rows.map(row => ({
        table: row.ref.table, id: row.ref.id, state: row.state, reason: row.reason,
      })),
    })),
  })
  const missingSteps = [1, 2].map(i => {
    const base = g(`missing-history-r2/recheck-${i}`)
    const before = json(`${base}-before-ledger.json`)
    const after = json(`${base}-after-ledger.json`)
    const boundary = json(`${base}-boundary.json`)
    return {
      step: i, ...historyCheck(before, after), manifestDelta: delta(boundary.before, boundary.after),
      beforeLedgerShaMatchesManifest: hash(bytes(`${base}-before-ledger.json`)) === boundary.before['/pmtool/settings/pmProvenanceLedger.json'],
      afterLedgerShaMatchesManifest: hash(bytes(`${base}-after-ledger.json`)) === boundary.after['/pmtool/settings/pmProvenanceLedger.json'],
    }
  })
  const frameSets = [
    'source-jumps-r3/frames', 'changed-recheck-r2/frames', 'recheck-history/frames',
    'missing-recheck/delete-frames', 'missing-recheck/missing-frames', 'missing-history-r2/frames',
  ].map(directory => {
    const meta = json(g(`${directory}/frames.json`))
    return {
      directory, count: meta.frames.length, source: meta.source,
      mismatch: meta.frames.filter(f => hash(bytes(g(`${directory}/${f.file}`))) !== f.sha256).map(f => f.file),
      atFirst: meta.frames[0]?.at, atLast: meta.frames.at(-1)?.at,
      timestampRegressions: meta.frames.flatMap((f, i) =>
        i && f.metadata.timestamp < meta.frames[i - 1].metadata.timestamp ? [f.file] : []),
    }
  })
  const candidate = json(`${a10}/candidate.json`)
  const artifacts = json(`${a10}/build/artifacts.json`)
  const combo = bytes(g('loaded-r1/combo-1.txt'))
  const beginMarker = Buffer.from('window.__ModuleLoader__.load({ id: "dsh-pm-tool", factory: (require) => {')
  const endMarker = Buffer.from('return module.exports; } });')
  const first = combo.indexOf(beginMarker)
  const end = combo.indexOf(endMarker, first) + endMarker.length
  if (first < 0 || end < first) throw new Error('Complete plugin segment not found')
  // Restore only the build's removed source-map suffix in memory; no new bundle or GUI evidence is created.
  const recovered = Buffer.concat([combo.subarray(first, end), Buffer.from('\n//# sourceMappingURL=client.js.map')])
  const scope = json(`${green}/dependency-scope-final.json`)
  const runtimeSourceMismatches = Object.entries(scope.runtimeSources).filter(([p, v]) =>
    candidate.sourceHashes[`packages/dsh-pm-tool/${p}`] !== v.frozenSha256).map(([p, v]) => ({
      path: p, expert: v.frozenSha256, a10: candidate.sourceHashes[`packages/dsh-pm-tool/${p}`],
    }))
  const ledgerText = json(g('source-jumps-r3/ledger.json')).pm.text.split('AI 溯源台账')[1]
  const observations = {
    at: new Date().toISOString(), mode: 'static-original-evidence-analysis-only',
    candidate: {
      baseline: candidate.baseline, hostGitHead: candidate.hostGitHead,
      sourceCount: Object.keys(candidate.sourceHashes).length,
      artifactCount: Object.keys(artifacts).length,
      patchHashMatches: hash(bytes(`${a10}/product-tracked.patch`)) === candidate.trackedPatchSha,
      artifactManifestMatchesCandidate: equal(artifacts, candidate.artifacts),
      build: json(`${a10}/build/build.exit.json`),
      start: json('/private/tmp/pmtool-a10-governance-runtime-20261021/artifacts/start.json'),
      runtimeSourceMismatches,
      panelHash: candidate.sourceHashes['packages/dsh-pm-tool/src/client/provenance-panel.tsx'],
    },
    loaded: {
      file: g('loaded-r1/combo-1.txt'), responseBytes: combo.length, responseSha: hash(combo),
      pluginStart: first, pluginEnd: end, secondStart: combo.indexOf(beginMarker, first + 1),
      recoveredBytes: recovered.length, recoveredArtifactSha: hash(recovered),
      a10ArtifactSha: artifacts['packages/dsh-pm-tool/lib/client.js'],
      exactArtifactWithOnlySourceMapSuffixRestored: hash(recovered) === artifacts['packages/dsh-pm-tool/lib/client.js'],
      resultJsonPresentInFrozenInputs: !!frozen.files[g('loaded-r1/result.json')],
      limitation: 'Body identity is proved; HTTP status/cache, document timeOrigin, browser/context and actual request linkage are not supplied by the missing result file.',
    },
    refs: expected.refs.map((ref, index) => {
      const state = json(g(`source-jumps-r3/source-${index}.json`))
      const title = state.fields.find(f => f.name === (ref.table === 'deliverables' ? 'name' : 'title'))?.value
      return { table: ref.table, id: ref.id, label: ref.label, role: ref.role,
        title, titleMatches: title === ref.label, origin: state.origin, timeOrigin: state.timeOrigin,
        ledgerTextHasLabel: ledgerText.includes(ref.label), ledgerTextHasSourceId: ledgerText.includes(ref.id) }
    }),
    jumps: {
      refsMatchOriginalAppliedLedger: equal(expected.refs, original.refs),
      standardFixtureSha: hash(bytes(standardPath)),
      refsMatchPostChangedLedger: equal(expected.refs, entry(continued.ledger).refs),
      kinds: [original.kind], basisCount: expected.refs.filter(r => r.role === 'basis').length,
      sourceManifestDelta: delta(jump.before, jump.after), stateCount: jump.states.length,
      sameNameFixture: new Set(expected.refs.map(r => r.label)).size !== expected.refs.length,
    },
    changed: {
      initialToContinuedDelta: delta(jump.after, continued.after),
      continuedHistory: entry(continued.ledger).history.map(h => ({ at: h.at, conclusion: h.conclusion })),
      entryExceptHistoryMatchesOriginalRaw: equal(withoutHistory(originalRaw), withoutHistory(entry(continued.ledger))),
      originalViewHasDerivedRecheckAbsentInRaw: Object.hasOwn(original, 'recheck') && !Object.hasOwn(originalRaw, 'recheck'),
      secondRecheck: historyCheck(history.before.ledger, history.after.ledger),
      secondRecheckManifestDelta: delta(history.before.data, history.after.data),
    },
    missing: {
      deletionManifestDelta: delta(deleteBefore.manifest, deleteAfter.manifest),
      sourceExistsAfterDelete: deleteAfter.sourceExists,
      rawLedgerUnchangedByDelete: equal(deleteLedgerBefore, deleteLedgerAfter),
      rawLedgerFileShaUnchanged: hash(bytes(g('missing-recheck/before-ledger.json'))) === hash(bytes(g('missing-recheck/after-delete-ledger.json'))),
      deletedSourceId: json(g('missing-recheck/before-source.json')).record.id,
      deletedSourceBeforeMatchesStandard: equal(json(g('missing-recheck/before-source.json')).record,
        standard.tasks.find(t => t.id === 't-0002')),
      firstBeforeMatchesPostDelete: equal(deleteLedgerAfter, json(g('missing-history-r2/recheck-1-before-ledger.json'))),
      twoStepsBoundaryContinuous: equal(json(g('missing-history-r2/recheck-1-after-ledger.json')),
        json(g('missing-history-r2/recheck-2-before-ledger.json'))),
      steps: missingSteps,
      missingNameJumpButtons: json(g('missing-recheck/missing-no-jump.json')).buttons
        .filter(b => b.text?.trim() === '来源任务二'),
      lastLedgerRefsEqualOriginal: equal(expected.refs, entry(json(g('missing-history-r2/recheck-2-after-ledger.json'))).refs),
    },
    frames: frameSets,
    limitations: [
      'No product tests, GUI actions, credential reads, runtime business reads, build, service or Git mutations performed.',
      'Original runner scripts/outer exit/ask-provenance and ask-recheck request-response bodies are not in the reviewed governance handoff.',
      'Frame hash verification is not visual signoff; only the explicitly listed raw images were visually reviewed.',
      'No whole-ID, remaining 29 GUI IDs, 32-ID aggregate, real-model or current A11 dirty candidate PASS.',
    ],
  }
  output(process.argv[3] ?? 'observations', observations)
  console.log(JSON.stringify({
    loaded: observations.loaded,
    candidate: { sourceCount: observations.candidate.sourceCount, artifactCount: observations.candidate.artifactCount,
      patchHashMatches: observations.candidate.patchHashMatches,
      artifactManifestMatchesCandidate: observations.candidate.artifactManifestMatchesCandidate,
      runtimeSourceMismatches },
    refs: observations.refs,
    jumps: observations.jumps, changed: observations.changed, missing: observations.missing, frames: frameSets,
  }, null, 2))
} else if (mode === 'finish') {
  const before = read(`${prefix}-inputs.json`)
  const files = {}, missing = []
  for (const p of Object.keys(before.files)) scan(p, files, missing)
  const changed = Object.keys(before.files).filter(p =>
    !files[p] || files[p].sha256 !== before.files[p].sha256 || files[p].bytes !== before.files[p].bytes)
  const currentRootFiles = {}, rootMissing = []
  for (const p of before.roots) scan(p, currentRootFiles, rootMissing)
  const added = Object.keys(currentRootFiles).filter(p => !before.files[p])
  const value = { at: new Date().toISOString(), count: Object.keys(before.files).length,
    changed, missing, added, rootMissing, zeroDrift: !changed.length && !missing.length && !added.length }
  output(process.argv[3] ?? 'drift', value)
  console.log(JSON.stringify(value, null, 2))
} else {
  throw new Error('Use freeze, review or finish; never executes product or evidence runners.')
}

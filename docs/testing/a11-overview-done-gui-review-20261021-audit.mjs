import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { isDeepStrictEqual as equal } from 'node:util'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a11-overview-done-gui-review-20261021'
const own = `${prefix}-selftmp`
const a11 = 'reports/all-pending-evidence-20261021/A11'
const tree = '/private/tmp/pmtool-all-closure-20261021'
const start = '/private/tmp/pmtool-a11-objective-runtime-20261021/artifacts/start.json'
const fixture = 'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5'
const roots = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/a10-objective-gui-independent-review-20261021.md',
  'docs/testing/a11-overview-done-independent-retest-20261021.md',
  'docs/testing/a11-overview-done-independent-retest-20261021-plan.md',
  'docs/testing/remaining-objective-cases-20261021.md',
  'docs/testing/objective-independent-auto-20261021.md',
  `${fixture}/f2.json`, `${fixture}/f2-backup.json`,
  `${fixture}/f2-backup.json.files`,
  `${a11}/candidate.json`, `${a11}/product-tracked.patch`,
  `${a11}/environment.json`, `${a11}/build`, `${a11}/objective`, start,
]
const configs = [
  'packages/dsh-pm-tool/tsconfig.json',
  'packages/dsh-pm-tool/tsdown.config.ts',
  'packages/dsh-pm-tool/vitest.config.mts',
]
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const abs = p => path.isAbsolute(p) ? p : path.join(repo, p)
const bytes = p => fs.readFileSync(abs(p))
const json = p => JSON.parse(bytes(p).toString())
const facts = p => {
  const s = fs.lstatSync(abs(p))
  assert(s.isFile() && !s.isSymbolicLink(), `Not a regular evidence file: ${p}`)
  const b = bytes(p)
  return { sha256: sha(b), bytes: b.length, mtimeMs: s.mtimeMs }
}
const scan = (p, out, missing) => {
  if (!fs.existsSync(abs(p))) { missing.push(p); return }
  const s = fs.lstatSync(abs(p))
  assert(!s.isSymbolicLink(), `Evidence symlink not followed: ${p}`)
  if (s.isDirectory()) {
    for (const n of fs.readdirSync(abs(p)).sort()) scan(path.join(p, n), out, missing)
  } else if (s.isFile()) out[p] = facts(p)
}
const write = (p, b) => {
  const destination = abs(p)
  assert(destination.startsWith(abs(prefix)), `Write outside granted prefix: ${p}`)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.writeFileSync(destination, b, { flag: 'wx' })
}
const output = (name, body) => write(`${own}/${name}.json`, `${JSON.stringify(body, null, 2)}\n`)
const delta = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .sort().filter(p => a[p] !== b[p]).map(p => ({ path: p, before: a[p] ?? null, after: b[p] ?? null }))
const currentComparison = candidate => Object.entries(candidate.sourceHashes).map(([p, h]) => ({
  path: p, expected: h, actual: fs.existsSync(abs(p)) ? facts(p).sha256 : null,
})).filter(v => v.actual !== v.expected)

if (process.argv[2] === 'freeze') {
  const inputs = {}, missing = []
  for (const p of roots) scan(p, inputs, missing)
  const candidate = json(`${a11}/candidate.json`)
  const staticFiles = {}, staticMissing = [], snapshots = {}
  for (const [group, map] of [['source', candidate.sourceHashes], ['artifacts', candidate.artifacts]]) {
    for (const [p, expected] of Object.entries(map)) {
      const original = path.join(tree, p)
      if (!fs.existsSync(original)) { staticMissing.push(original); continue }
      const f = facts(original)
      staticFiles[original] = f
      assert.equal(f.sha256, expected, `A11 static identity mismatch: ${p}`)
      const copy = `${own}/snapshot/${group}/${p}`
      write(copy, bytes(original))
      snapshots[p] = { original, copy, expected, ...f }
    }
  }
  for (const p of configs) {
    const original = path.join(tree, p)
    if (!fs.existsSync(original)) { staticMissing.push(original); continue }
    const f = facts(original)
    staticFiles[original] = f
    const copy = `${own}/snapshot/config/${p}`
    write(copy, bytes(original))
    snapshots[p] = { original, copy, ...f, status: 'supplemental-current-config-not-in-A11-manifest' }
  }
  write(`${own}/snapshot/objective-start.json`, bytes(start))
  const body = {
    at: new Date().toISOString(), environment: { node: process.version, os: process.platform, arch: process.arch },
    roots, inputs, missing, staticFiles, staticMissing, snapshots,
    sourceCount: Object.keys(candidate.sourceHashes).length,
    artifactCount: Object.keys(candidate.artifacts).length,
    mainSourceMismatch: currentComparison(candidate),
    boundary: 'Static copies only, under granted prefix. No product execution, GUI, build, services, credentials, dependencies or private runtime paths.',
  }
  output('inputs', body)
  console.log(JSON.stringify({ at: body.at, inputFiles: Object.keys(inputs).length,
    sourceCount: body.sourceCount, artifactCount: body.artifactCount,
    missing, staticMissing, mainSourceMismatch: body.mainSourceMismatch }, null, 2))
} else if (process.argv[2] === 'review') {
  const frozen = json(`${own}/inputs.json`)
  const locked = p => {
    assert(frozen.inputs[p], `Input not registered: ${p}`)
    const b = bytes(p)
    assert.equal(sha(b), frozen.inputs[p].sha256, `Evidence drift: ${p}`)
    return b
  }
  const j = p => JSON.parse(locked(p).toString())
  const candidate = j(`${a11}/candidate.json`)
  const artifacts = j(`${a11}/build/artifacts.json`)
  const sync = j(`${a11}/build/sync.json`)
  assert(equal(candidate.artifacts, artifacts))
  assert(equal(candidate.sourceHashes, sync.sourceHashes))
  assert.equal(sha(locked(`${a11}/product-tracked.patch`)), candidate.trackedPatchSha)
  assert.deepEqual(sync.drift, [])
  assert.deepEqual(candidate.postDrift, [])
  for (const entry of Object.values(frozen.snapshots)) {
    assert.equal(sha(bytes(entry.copy)), entry.sha256, `Snapshot changed: ${entry.copy}`)
  }
  const loading = j(`${a11}/objective/loaded-r2/result.json`)
  assert.equal(loading.events.length, 1)
  const event = loading.events[0], match = event.matches[0]
  const combo = locked(`${a11}/objective/loaded-r2/${event.file}`)
  const artifact = bytes(frozen.snapshots['packages/dsh-pm-tool/lib/client.js'].copy)
  assert.equal(event.status, 200)
  assert.equal(event.fromDiskCache, false)
  assert.equal(event.bytes, combo.length)
  assert.equal(event.responseSha, sha(combo))
  assert.equal(match.sourceSha, sha(artifact))
  const normalized = artifact.toString()
    .replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const first = combo.indexOf(segment), second = combo.indexOf(segment, first + 1)
  assert.equal(first, match.first)
  assert.equal(second, -1)
  assert.equal(match.second, -1)
  assert.equal(segment.length, match.segmentBytes)
  assert.equal(sha(segment), match.segmentSha)
  assert.equal(match.uniqueComplete, true)
  assert.equal(loading.state.origin, 'http://127.0.0.1:3225')
  assert.equal(loading.state.pmMounted, true)
  assert.equal(loading.state.pilot, 'off')
  const standard = j(`${fixture}/f2-backup.json`)
  const oracle = j(`${fixture}/f2.json`)
  assert.equal(oracle.today, '2026-10-21')
  assert.equal(standard.tasks.length, 10)
  assert(equal(standard.tasks, oracle.tasks))
  assert.equal(sha(locked(`${fixture}/f2-backup.json`)),
    '451ce27c0b84c61419a6770dee27bf70795fef24b081e6be73c551bd9e7a1d8b')
  const seed = j(`${a11}/objective/seed/boundary.json`)
  const browse = j(`${a11}/objective/overview/native100/boundary.json`)
  assert.deepEqual(delta(seed.before.data, seed.first.data), [])
  assert.deepEqual(delta(browse.before, browse.after), [])
  const recordCandidates = record => [
    record, { value: record }, { id: record.id, value: record },
  ].flatMap(value => [JSON.stringify(value), JSON.stringify(value, null, 2)]
    .flatMap(text => [text, `${text}\n`]).map(text => ({ value, text, sha256: sha(text) })))
  const recordChecks = [...standard.projects.map(record => ({ table: 'projects', record })),
    ...standard.tasks.map(record => ({ table: 'tasks', record }))].map(({ table, record }) => {
    const key = `/pmtool/${table}/${record.id}.json`
    const expected = seed.after.data[key]
    assert.equal(browse.before[key], expected)
    const possibilities = recordCandidates(record).filter(v => v.sha256 === expected)
    return { key, expected, originalRecord: record, originalRecordEncodingMatches: possibilities.map(v => ({
      sha256: v.sha256, bytes: Buffer.byteLength(v.text), value: v.value,
    })) }
  })
  const states = ['observed-current', 'native100/upper-card', 'native100/lower-card', 'native100/tasks-counter']
    .map(name => {
      const state = j(`${a11}/objective/overview/${name}.json`)
      assert.equal(state.origin, loading.state.origin)
      assert.equal(state.timeOrigin, loading.state.timeOrigin)
      assert.equal(state.dark, false)
      assert.equal(state.viewport.width, 1440)
      assert.equal(state.viewport.height, 900)
      const tasks = name.endsWith('tasks-counter')
      assert(state.pm.text.includes(tasks ? '· 完成 2（20%）' : '任务完成\n2/10\n20% 已完成'))
      if (!tasks) assert(state.pm.text.includes('任务完成率\n20%\n2 / 10'))
      return { name, at: state.at, origin: state.origin, timeOrigin: state.timeOrigin,
        viewport: state.viewport, dark: state.dark, originalText: state.pm.text,
        boundary: tasks ? 'Header visible in original PNG; saved-view badge 3 not signed.' :
          'Upper visible in PNG; lower DOM text exists but lower card not visible in supplied PNG.' }
    })
  const meta = j(`${a11}/objective/overview/native100/frames/frames.json`)
  const frameChecks = meta.frames.map(f => {
    const original = `${a11}/objective/overview/native100/frames/${f.file}`
    assert.equal(sha(locked(original)), f.sha256)
    return { ...f, reviewedVisually: true, observed: Number(f.file.slice(0, 6)) <= 2 ?
      'Overview upper task 2/10 and 20%, wrapped1 in separate open card; lower card offscreen.' :
      'Tasks header done2 (20%), wrapped1; saved-view badge3 visible, not exercised.' }
  })
  const zoom = j(`${a11}/objective/native-zoom/execution.json`)
  const runtime = j(start), setup = j(`${a11}/environment.json`).setups.find(s => s.label === 'objective')
  assert.equal(runtime.pid, 32660)
  assert.equal(runtime.port, 3225)
  assert.equal(runtime.hostGitHead, candidate.hostGitHead)
  for (const k of ['label', 'port', 'root', 'plugin', 'patchSha']) assert.deepEqual(runtime[k], setup[k])
  assert.equal(zoom.browserPID, 29351)
  assert.equal(zoom.window, 23677)
  assert.equal(zoom.origin, loading.state.origin)
  const done = standard.tasks.filter(t => t.status === 'done').map(t => t.id)
  const wrapped = standard.tasks.filter(t => t.status === 'wrapped').map(t => t.id)
  const legacy = standard.tasks.filter(t => t.status === 'done' || (t.progress ?? 0) >= 100).map(t => t.id)
  assert.deepEqual(done, ['t-0007', 't-0008'])
  assert.deepEqual(wrapped, ['t-0010'])
  assert.deepEqual(legacy, ['t-0001', 't-0007', 't-0008'])
  const body = {
    at: new Date().toISOString(), candidate: { baseline: candidate.baseline,
      hostGitHead: candidate.hostGitHead, sourceCount: frozen.sourceCount, artifactCount: frozen.artifactCount,
      trackedPatchSha: candidate.trackedPatchSha, patchVerified: true, syncVerified: true,
      snapshotFilesVerified: Object.keys(frozen.snapshots).length,
      currentSourceSubstitutionForbidden: true, mainSourceMismatch: frozen.mainSourceMismatch },
    runtime, zoom, loading: { ...loading, independentlyCheckedResponseSha: sha(combo),
      independentlyCheckedArtifactSha: sha(artifact), segmentSha: sha(segment), first, second,
      artifactBytes: artifact.length, segmentBytes: segment.length, responseBytes: combo.length },
    fixture: { today: oracle.today, exportedAt: standard.exportedAt,
      fileBundleId: standard.fileBundleId, backupSha: sha(locked(`${fixture}/f2-backup.json`)),
      done, wrapped, legacy, doneRate: 20, originalRecordChecks: recordChecks },
    seed: { beforeFirstDelta: delta(seed.before.data, seed.first.data),
      afterDelta: delta(seed.first.data, seed.after.data),
      boundary: 'Original boundary metadata and GUI seed; no runtime record reads.' },
    browse: { delta: delta(browse.before, browse.after), keys: Object.keys(browse.before),
      onlyRegisteredFileHashDomain: true },
    states, frameChecks,
    visualDecision: { upper: 'PASS_LIMITED', tasksHeader: 'PASS_LIMITED',
      lowerDOM: 'CONSISTENT', lowerVisual: 'BLOCKED', closeOPG01: false,
      reason: 'Lower-card PNG and all five original frames do not show lower completionHero; manual/checklist multi-state GUI also absent.' },
    missing: frozen.missing, staticMissing: frozen.staticMissing,
    limitations: [
      'Raw outer failure/exit logs for first seed/welcome/toggle and nonexistent .pm-overview selector were not found in supplied A11 objective archive; owner statement retained, not fabricated.',
      'Full source and artifact bytes archived under own prefix; this audit does not independently compile or execute them.',
      'Full browser response matches only client.js; no editor/lazy chunk or whole-host module activation signoff.',
      'Fixture hashes alone do not prove unprovided raw disk formatting; unmatched complete record encodings are explicitly retained.',
      'Native100 limited light 1440x900 only; DPR2 or pageScaleFactor1 is not native200 proof.',
      'No new source, product, build, GUI, services, credentials, dependency cache or Git mutations.',
    ],
  }
  output('observations', body)
  console.log(JSON.stringify({ candidate: body.candidate,
    loading: { responseSha: sha(combo), artifactSha: sha(artifact), first, second, segmentBytes: segment.length },
    fixture: { done, wrapped, legacy, recordEncodingMatches: recordChecks.map(r => ({
      key: r.key, matches: r.originalRecordEncodingMatches.length })) },
    browse: body.browse, frameCount: frameChecks.length, visualDecision: body.visualDecision }, null, 2))
} else if (process.argv[2] === 'finish') {
  const frozen = json(`${own}/inputs.json`)
  const compare = original => Object.entries(original).flatMap(([p, expected]) => {
    if (!fs.existsSync(abs(p))) return [{ path: p, reason: 'missing' }]
    const actual = facts(p)
    return equal(actual, expected) ? [] : [{ path: p, expected, actual }]
  })
  const now = {}, missing = []
  for (const p of roots) scan(p, now, missing)
  const added = Object.keys(now).filter(p => !frozen.inputs[p])
  const body = {
    at: new Date().toISOString(), registeredInputs: Object.keys(frozen.inputs).length,
    evidenceDrift: compare(frozen.inputs), staticSourceArtifactDrift: compare(frozen.staticFiles),
    snapshotDrift: Object.values(frozen.snapshots).filter(v => sha(bytes(v.copy)) !== v.sha256).map(v => v.copy),
    added, missing, mainSourceMismatch: currentComparison(json(`${a11}/candidate.json`)),
    boundary: 'Original evidence/static package checked, not live GUI/service or unregistered roots. Main source mismatch is applicability, not historical A11 substitution.',
  }
  output(process.argv[3] ?? 'drift-final', body)
  console.log(JSON.stringify(body, null, 2))
  assert.deepEqual(body.evidenceDrift, [])
  assert.deepEqual(body.staticSourceArtifactDrift, [])
  assert.deepEqual(body.snapshotDrift, [])
} else {
  throw new Error('Use freeze, review or finish. Never executes product or GUI evidence runners.')
}

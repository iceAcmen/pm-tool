import { readFileSync, readdirSync, lstatSync, existsSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual as equal } from 'node:util'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a15-import-fault-gui-review-20261022')
const evidence = join(repo, 'reports/all-pending-evidence-20261021')
const root = join(evidence, 'A15/import-fault')
const sha = b => createHash('sha256').update(b).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const read = n => json(join(root, n))
const info = p => {
  const s = lstatSync(p), b = readFileSync(p)
  if (!s.isFile()) throw Error(`Not a regular file: ${p}`)
  return { bytes: b.length, sha256: sha(b), mtimeMs: s.mtimeMs }
}
const scan = p => Object.fromEntries(readdirSync(p).sort().flatMap(n => {
  const q = join(p, n)
  return lstatSync(q).isDirectory() ? Object.entries(scan(q)) : [[q, info(q)]]
}))
const diff = (a, b) => ({
  added: Object.keys(b).filter(k => !(k in a)).sort(),
  removed: Object.keys(a).filter(k => !(k in b)).sort(),
  changed: Object.keys(a).filter(k => k in b && !equal(a[k], b[k])).sort(),
})
const zero = d => Object.values(d).every(v => v.length === 0)
const rootsDiff = (a, b) => Object.fromEntries(['data', 'files', 'backups'].map(k => [k, diff(a[k], b[k])]))
const rootsZero = d => Object.values(d).every(zero)
const ndjson = n => readFileSync(join(root, n), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
const protectedRoots = [
  root, join(evidence, 'A13/final/materials/native-import'), join(evidence, 'A13/final/materials/loaded'),
  join(evidence, 'A14/import-supplement'), join(evidence, 'A13/build-final'),
  join(evidence, 'A13/full-verify'), join(evidence, 'A14/build'), join(evidence, 'A14/full-verify'),
]
const protectedPaths = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/testing/remaining-journey-cases-20261021.md',
  'reports/all-pending-evidence-20261021/A13/candidate-final.json',
  'reports/all-pending-evidence-20261021/A13/product-tracked.patch',
  'reports/all-pending-evidence-20261021/A13/environment-final.json',
  'reports/all-pending-evidence-20261021/A14/candidate.json',
  'reports/all-pending-evidence-20261021/A14/product-tracked.patch',
].map(p => join(repo, p))
for (const n of readdirSync(join(repo, 'docs/testing'))) {
  if (['a13-native-import-gui-review-20261022', 'a14-three-supplements-gui-review-20261022',
    'a13-import-filename-independent-retest-20261021', 'a10-preflight-success-independent-retest-20261021']
    .some(p => n.startsWith(p))) {
    const p = join(repo, 'docs/testing', n)
    if (lstatSync(p).isFile()) protectedPaths.push(p)
  }
}
const helpers = ['/private/tmp/pmtool-a13-final-gui-20261022.mjs', '/private/tmp/pmtool-a6-gui-20261021.mjs']
const fixturePaths = ['csv', 'xlsx'].map(ext => `/private/tmp/pmtool-a11-native-import/QA 原生导入.${ext}`)
const capture = () => Object.assign({}, ...protectedRoots.map(scan),
  Object.fromEntries([...protectedPaths, ...helpers, ...fixturePaths].map(p => [p, info(p)])))
const candidates = () => Object.fromEntries([
  ['A13', join(evidence, 'A13/candidate-final.json')],
  ['A14', join(evidence, 'A14/candidate.json')],
].map(([label, path]) => {
  const m = json(path)
  const verify = hashes => Object.fromEntries(Object.entries(hashes).map(([n, expected]) => {
    const p = join(m.tree, n), actual = existsSync(p) ? info(p) : null
    return [p, { expected, actual, match: actual?.sha256 === expected }]
  }))
  return [label, { tree: m.tree, baseline: m.baseline, hostGitHead: m.hostGitHead,
    source: verify(m.sourceHashes), artifacts: verify(m.artifacts),
    patchMatches: info(join(dirname(path), 'product-tracked.patch')).sha256 === m.trackedPatchSha }]
}))
const candidateDrift = (before, after) => Object.fromEntries(Object.keys(before).map(label => [label,
  Object.fromEntries(['source', 'artifacts'].map(k => [k,
    diff(Object.fromEntries(Object.entries(before[label][k]).map(([p, x]) => [p, x.actual])),
      Object.fromEntries(Object.entries(after[label][k]).map(([p, x]) => [p, x.actual])))]))]))

if (process.argv[2] === 'seal') {
  const prior = json(`${prefix}-audit.json`), current = capture(), nowCandidates = candidates()
  const result = { at: new Date().toISOString(), runtime: process.version,
    inputs: diff(prior.inputs, current), candidates: candidateDrift(prior.candidates, nowCandidates),
    documents: Object.fromEntries(['.md', '-audit.mjs', '-audit.json'].map(s => [prefix + s, info(prefix + s)])),
    boundary: 'Only fixed evidence, fixtures, declared candidate source/artifact files; no live services or credentials.' }
  result.unchanged = zero(result.inputs) &&
    Object.values(result.candidates).every(v => Object.values(v).every(zero))
  writeFileSync(`${prefix}-seal.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify(result, null, 2))
  if (!result.unchanged) process.exitCode = 1
} else {
  const inputs = capture(), frozen = candidates(), checks = {}
  const check = (name, ok) => { checks[name] = Boolean(ok) }
  const index = read('index.json')
  const originalIndex = Object.fromEntries(Object.entries(index).map(([n, x]) => {
    const actual = info(join(root, n))
    return [n, { expected: x, actual, match: x.bytes === actual.bytes && x.sha256 === actual.sha256 }]
  }))
  const indexExtras = Object.keys(scan(root)).filter(p => p !== join(root, 'index.json') &&
    !(p.slice(root.length + 1) in index))
  check('original604ByteHashes', Object.keys(index).length === 604 && indexExtras.length === 0 &&
    Object.values(originalIndex).every(v => v.match))
  check('bothCandidateManifests', Object.values(frozen).every(c => c.patchMatches &&
    ['source', 'artifacts'].every(k => Object.values(c[k]).every(v => v.match))))
  const loadedRoot = join(evidence, 'A13/final/materials/loaded')
  const loaded = json(join(loadedRoot, 'result.json')), event = loaded.events[0]
  const client = readFileSync(join(frozen.A13.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const combo = readFileSync(join(loadedRoot, event.file)), first = combo.indexOf(segment)
  const loader = { result: loaded, client: { bytes: client.length, sha256: sha(client) },
    combo: { bytes: combo.length, sha256: sha(combo) },
    segment: { bytes: segment.length, sha256: sha(segment), first,
      second: first < 0 ? -1 : combo.indexOf(segment, first + 1) } }
  check('fullUniqueUncachedA13Client', first >= 0 && loader.segment.second === -1 &&
    event.status === 200 && event.fromDiskCache === false && sha(client) === event.matches[0].sourceSha &&
    sha(segment) === event.matches[0].segmentSha && sha(combo) === event.responseSha && combo.length === event.bytes)
  const ready = read('ready.json'), end = read('end.json'), observations = read('observations.json')
  const commands = ndjson('commands.ndjson'), faults = ndjson('faults.ndjson'), consoleEvents = ndjson('console.ndjson')
  const steps = Object.fromEntries(readdirSync(root).filter(n => existsSync(join(root, n, 'exit.json')))
    .map(n => {
      const exit = read(`${n}/exit.json`)
      return [`${exit.ext}-${exit.action}`, { path: n, exit, before: read(`${n}/before-roots.json`),
        after: read(`${n}/after-roots.json`), state: read(`${n}/actual.json`),
        raw: Object.fromEntries(readdirSync(join(root, n, 'raw')).map(f => [f, read(`${n}/raw/${f}`)])) }]
    }))
  for (const s of Object.values(steps)) s.changes = rootsDiff(s.before, s.after)
  const cases = ['csv', 'xlsx'].map((ext, i) => {
    const fileName = `QA 原生导入.${ext}`, bytes = readFileSync(fixturePaths[i])
    const content = bytes.toString(ext === 'csv' ? 'utf8' : 'base64')
    const base = ` task import-content p-0001 ${JSON.stringify(fileName)} ${JSON.stringify(content)}`
    const runs = commands.filter(x => x.event.type === 'command/run' && x.event.data.args.startsWith(base))
    const parsed = runs.map(row => {
      const done = commands.find(x => x.event.type === 'command/done' &&
        x.event.data.commandId === row.event.data.commandId)
      return { at: row.at, seq: row.event.seq, args: row.event.data.args, commandId: row.event.data.commandId, done }
    })
    const injected = faults.filter(x => x.ext === ext)
    const busy = read(`${ext}-busy-probe.json`), failed = read(`${ext}-failed.json`)
    const pick = steps[`${ext}-pick`], fail = steps[`${ext}-confirm-fail`]
    const retry = steps[`${ext}-retry`], reopen = steps[`${ext}-reopen`]
    const ids = ext === 'csv' ? ['t-0008', 't-0009'] : ['t-0010', 't-0011']
    const target = read(`${reopen.path}/target.json`)
    const records = ids.map(id => retry.raw[`${id}.json`].record)
    const reopened = ids.map(id => read(`${reopen.path}/${id}-reopened.json`))
    const fields = reopened.map(s => Object.fromEntries(s.fields.filter(f => f.name &&
      ['title', 'description', 'status', 'priority', 'assignee', 'startDate', 'dueDate', 'progress', 'milestoneId']
        .includes(f.name)).map(f => [f.name, f.value])))
    const preview = busy.preview
    const ax = readFileSync(join(root, `${ext}-chooser/path-action.txt`), 'utf8')
    const selected = readFileSync(join(root, `${ext}-chooser/selected.txt`), 'utf8')
    check(`${ext}:sameFixtureExactWholeLine`, parsed.length === 2 && parsed[0].args === base &&
      parsed[1].args === base + ' confirm' && injected.length === 3 &&
      injected[0].commandSha === sha('/pm' + base + ' confirm') &&
      injected[2].commandSha === injected[0].commandSha && injected[0].fixtureSha === sha(bytes))
    check(`${ext}:nativePath`, ax.includes(`set 0 value ${fixturePaths[i]}`) && selected.includes(fileName))
    check(`${ext}:busyAll3Disabled`, busy.ariaBusy === 'true' && busy.controls.length === 3 &&
      busy.controls.every(c => c.disabled === true))
    check(`${ext}:fault3101msPreHostZeroWrite`, injected[0].action === 'hold-before-network' &&
      injected[1].action === 'fail-before-host' && injected[1].elapsedMs === 3101 &&
      rootsZero(rootsDiff(injected[0].roots, injected[1].roots)) &&
      rootsZero(fail.changes) && rootsZero(rootsDiff(fail.before, read(`${ext}-failed-roots.json`))) &&
      !commands.some(c => Date.parse(c.at) >= Date.parse(injected[0].at) &&
        Date.parse(c.at) <= Date.parse(injected[1].at)))
    check(`${ext}:retainedPreviewAndButtons`, failed.pm.text.includes(preview) &&
      failed.alerts.includes('导入失败，预览已保留，请重试。') &&
      ['确认落盘', '取消'].every(t => failed.buttons.some(b => b.text === t && b.disabled === false)) &&
      fail.state.pm.text.includes(preview))
    check(`${ext}:samePreviewRetryNoInterveningImport`, injected[2].action === 'continue-original-to-production' &&
      parsed[1].done?.event.data.kind === 'success' &&
      !commands.some(x => x.event.type === 'command/run' && x.event.data.args.includes('import-content') &&
        Date.parse(x.at) > Date.parse(parsed[0].at) && Date.parse(x.at) < Date.parse(parsed[1].at)) &&
      rootsZero(rootsDiff(fail.after, retry.before)) &&
      equal(retry.changes.data.added, ids.map(id => `/pmtool/tasks/${id}.json`)) &&
      retry.changes.data.changed.length === 0 && retry.changes.data.removed.length === 0 &&
      zero(retry.changes.files) && zero(retry.changes.backups))
    check(`${ext}:rawAllFieldsIdsAndReopen`, equal(target.root, records[0]) && equal(target.child, records[1]) &&
      records[0].id === ids[0] && records[1].parentId === ids[0] &&
      records.every((r, j) => equal(retry.raw[`${ids[j]}.json`], reopen.raw[`${ids[j]}.json`]) &&
        Object.entries(fields[j]).every(([k, v]) => String(r[k] ?? '') === v)) &&
      rootsZero(reopen.changes))
    check(`${ext}:oldTargetsUnchangedEveryRawCopy`, Object.entries(fail.raw)
      .every(([n, r]) => equal(r, retry.raw[n]) && equal(r, reopen.raw[n])))
    const snapshots = commands.filter(x => x.event.type === 'command/done' &&
      x.event.data.kind === 'success' && x.event.data.text.startsWith('{')).map(x => {
        try { return { seq: x.event.seq, at: x.at, tasks: JSON.parse(x.event.data.text).tasks } } catch { return null }
      }).filter(Boolean).filter(x => Date.parse(x.at) >= Date.parse(parsed[1].at) &&
        x.tasks?.some(t => t.id === ids[0]))
    check(`${ext}:productionSnapshotAllFields`, snapshots.length >= 2 &&
      snapshots.every(s => records.every(r => equal(r, s.tasks.find(t => t.id === r.id)))))
    return { ext, fixture: { path: fixturePaths[i], ...info(fixturePaths[i]) }, expectedConfirmSha: sha('/pm' + base + ' confirm'),
      events: parsed, injected, busy, failed: { at: failed.at, alerts: failed.alerts, text: failed.pm.text },
      stepPaths: { pick: pick.path, fail: fail.path, retry: retry.path, reopen: reopen.path },
      ids, records, fields, snapshots: snapshots.map(s => ({ seq: s.seq, at: s.at })),
      failedCounts: Object.fromEntries(Object.entries(fail.before).map(([k, v]) => [k, Object.keys(v).length])) }
  })
  const frames = read('frames/frames.json')
  const frameMismatches = frames.frames.filter(f => info(join(root, 'frames', f.file)).sha256 !== f.sha256)
  check('447OriginalCompositorFrameHashes', frames.frames.length === 447 && frameMismatches.length === 0)
  check('allStatesSameA13Page', Object.values(steps).every(s => s.state.origin === ready.origin &&
    s.state.timeOrigin === 1792618531950.5) && cases.every(c =>
    c.busy.origin === ready.origin && c.busy.timeOrigin === 1792618531950.5) &&
    ready.target === '2EDCCF4D81671D87CBBD9934F50CF274')
  const correctedBusinessConfirmEvents = commands.filter(x => x.event.type === 'command/run' &&
    x.event.data.args.endsWith(' confirm')).map(x => ({ at: x.at, seq: x.event.seq, ...x.event.data }))
  const scripts = Object.fromEntries([...helpers, ...readdirSync(join(root, 'execution'))
    .map(n => join(root, 'execution', n))].map(p => [p, info(p)]))
  const originalExitFiles = Object.fromEntries(['A13', 'A14'].map(label => [label,
    Object.fromEntries(Object.keys(scan(join(evidence, label, label === 'A13' ? 'build-final' : 'build')))
      .filter(p => p.endsWith('.exit.json')).map(p => [p, json(p)]))]))
  const result = { at: new Date().toISOString(), environment: { platform: process.platform, arch: process.arch,
    node: process.version, cwd: process.cwd() }, inputs, candidates: frozen, checks,
    originalIndex: { count: Object.keys(index).length, records: originalIndex, extras: indexExtras },
    loader, ready, end, overallChanges: rootsDiff(ready.roots, end.roots),
    steps, cases, commands, faults, consoleEvents, frames: { count: frames.frames.length,
      first: frames.frames[0], last: frames.frames.at(-1), mismatches: frameMismatches },
    originalObservations: observations, correctedBusinessConfirmEvents, scripts, originalExitFiles,
    anomalies: [
      'Original observations.businessConfirmEvents is [] because original seal reads event.args, but args belongs to event.data; original run seq83/91 retained.',
      'CSV raw transfer error ResultCard has Check/status via Chinese-only classifier; local retry alert is below the original viewport. No product execution used to diagnose.',
      'Full ps/cwd/TERM action raw records are not in import-fault index; ready/end and original ps exit1 exist, owner reports exact TERM; no guessed observer/parentterminal exit0.',
      'Failed-state observe omits hidden file input and aria-busy; successful action wait verifies false, source and resumed buttons support restoration, no invented failed probe.',
    ],
    boundary: 'Filesystem audit only, no imports of product/execution code, no GUI/network/services/credentials/build/install; audit green is not whole GUI PASS.' }
  const afterInputs = capture(), afterCandidates = candidates()
  result.protection = { inputs: diff(inputs, afterInputs), candidates: candidateDrift(frozen, afterCandidates) }
  check('readOnlyProtection', zero(result.protection.inputs) &&
    Object.values(result.protection.candidates).every(v => Object.values(v).every(zero)))
  writeFileSync(`${prefix}-audit.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify({ checks, candidateCounts: Object.fromEntries(Object.entries(frozen).map(([k, c]) =>
    [k, { source: Object.keys(c.source).length, artifacts: Object.keys(c.artifacts).length }])),
    inputCount: Object.keys(inputs).length, originalCount: Object.keys(index).length,
    cases: cases.map(c => ({ ext: c.ext, ids: c.ids, events: c.events.map(e => ({ seq: e.seq, at: e.at })),
      fields: c.fields })), frames: result.frames, consoleEvents, anomalies: result.anomalies }, null, 2))
  if (Object.values(checks).some(v => !v)) process.exitCode = 1
}

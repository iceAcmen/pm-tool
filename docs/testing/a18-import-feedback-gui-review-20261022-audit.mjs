import { readFileSync, readdirSync, lstatSync, readlinkSync, existsSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual as equal } from 'node:util'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a18-import-feedback-gui-review-20261022')
const base = join(repo, 'reports/all-pending-evidence-20261021/A18')
const root = join(base, 'import-fault')
const sha = b => createHash('sha256').update(b).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const read = n => json(join(root, n))
const info = p => {
  const s = lstatSync(p)
  if (s.isSymbolicLink()) return { type: 'symlink', target: readlinkSync(p), mtimeMs: s.mtimeMs }
  if (!s.isFile()) throw Error(`Not a regular input: ${p}`)
  const b = readFileSync(p)
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
const candidate = json(join(base, 'candidate.json'))
const fixturePaths = ['csv', 'xlsx'].map(ext => `/private/tmp/pmtool-a11-native-import/QA 原生导入.${ext}`)
const seedPath = join(repo, 'docs/testing/materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr/fixtures/F5/backup.json')
const fixedRoots = ['import-fault', 'final', 'build', 'build-pinned11', 'full-verify'].map(n => join(base, n))
const fixedPaths = ['candidate.json', 'product-tracked.patch', 'source-auto-handoff.json'].map(n => join(base, n))
for (const n of [
  'AGENTS.md', 'docs/collaboration.md', 'docs/testing/remaining-journey-cases-20261021.md',
  'docs/testing/a15-import-fault-gui-review-20261022.md',
  'docs/testing/a15-import-fault-gui-review-20261022-audit.json',
  'docs/testing/a15-import-fault-gui-review-20261022-seal.json',
  'docs/testing/a17-transport-feedback-contract-20261022-plan.md',
  'docs/testing/a17-transport-feedback-independent-retest-20261022.md',
  'docs/testing/a17-transport-feedback-independent-retest-20261022-cases.test.tsx',
  'docs/testing/a18-feedback-context-independent-retest-20261022-plan.md',
  'docs/testing/a18-feedback-context-independent-retest-20261022.md',
  'docs/plans/2026-10-22-feedback-error-context-closure.md',
  'reports/a19-shared-bin-drift-diagnosis-20261022.md',
]) fixedPaths.push(join(repo, n))
const originalRoots = [
  join(repo, 'reports/all-pending-evidence-20261021/A15/import-fault'),
  join(repo, 'docs/testing/a18-feedback-context-independent-retest-20261022-selftmp/r3'),
  join(repo, 'docs/testing/a18-feedback-context-independent-retest-20261022-selftmp/review-r3'),
  dirname(seedPath),
]
const capture = () => Object.assign({}, ...[...fixedRoots, ...originalRoots].map(scan),
  Object.fromEntries([...fixedPaths, ...fixturePaths].map(p => [p, info(p)])))
const declared = () => Object.fromEntries(['sourceHashes', 'artifacts'].map(k => [k,
  Object.fromEntries(Object.entries(candidate[k]).map(([n, expected]) => {
    const p = join(candidate.tree, n), actual = existsSync(p) ? info(p) : null
    return [p, { expected, actual, match: actual?.sha256 === expected }]
  }))]))
const declaredDiff = (a, b) => Object.fromEntries(Object.keys(a).map(k => [k,
  diff(Object.fromEntries(Object.entries(a[k]).map(([p, x]) => [p, x.actual])),
    Object.fromEntries(Object.entries(b[k]).map(([p, x]) => [p, x.actual])))]))

if (process.argv[2] === 'seal') {
  const before = json(`${prefix}-audit.json`), inputs = diff(before.inputs, capture())
  const frozen = declaredDiff(before.declared, declared())
  const seal = { at: new Date().toISOString(), node: process.version, inputs, frozen,
    unchanged: zero(inputs) && Object.values(frozen).every(zero),
    documents: Object.fromEntries(['-plan.md', '-audit.mjs', '-audit.json', '.md'].map(s => [prefix + s, info(prefix + s)])),
    resources: 'Only synchronous filesystem audit; no child/GUI/build/service resources created.',
    boundary: 'Main live source/runtime and ongoing evidence excluded; shared .bin historical drift not cleared.' }
  writeFileSync(`${prefix}-seal.json`, JSON.stringify(seal, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify({ unchanged: seal.unchanged, inputs, frozen }))
  if (!seal.unchanged) process.exitCode = 1
} else {
  const inputs = capture(), frozen = declared(), checks = {}
  const check = (name, ok) => { checks[name] = Boolean(ok) }
  const index = read('index.json'), indexRows = Object.entries(index.files).map(([n, e]) => {
    const a = info(join(root, n))
    return { path: n, expected: e, actual: a, match: e.bytes === a.bytes && e.sha256 === a.sha256 }
  })
  const extras = Object.keys(scan(root)).filter(p => p !== join(root, 'index.json') &&
    !(p.slice(root.length + 1) in index.files))
  check('597IndexedOriginalBytesAndHashes', indexRows.length === 597 && extras.length === 0 && indexRows.every(x => x.match))
  check('allA18DeclaredSourceAnd453Artifacts', Object.values(frozen).every(rows => Object.values(rows).every(x => x.match)) &&
    Object.keys(frozen.artifacts).length === 453 &&
    info(join(base, 'product-tracked.patch')).sha256 === candidate.trackedPatchSha)
  const proof = json(join(base, 'build-pinned11/proof.json'))
  check('pinned11SameSourceAndArtifacts', equal(proof.sourceHashes, candidate.sourceHashes) &&
    equal(proof.artifacts, candidate.artifacts) && proof.sourceDrift.length === 0 && proof.priorArtifactDrift.length === 0)
  const loadedRoot = join(base, 'final/loaded'), loaded = json(join(loadedRoot, 'result.json')), event = loaded.events[0]
  const client = readFileSync(join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const combo = readFileSync(join(loadedRoot, event.file)), first = combo.indexOf(segment)
  const loader = { result: loaded, client: { bytes: client.length, sha256: sha(client) },
    combo: { bytes: combo.length, sha256: sha(combo) },
    segment: { bytes: segment.length, sha256: sha(segment), first, second: combo.indexOf(segment, first + 1) } }
  check('2584301UniqueComplete1705469Client', combo.length === 2584301 && segment.length === 1705469 &&
    first === 875361 && loader.segment.second === -1 && event.status === 200 && event.fromDiskCache === false &&
    sha(combo) === event.responseSha && sha(client) === event.matches[0].sourceSha && sha(segment) === event.matches[0].segmentSha)
  const ready = read('ready.json'), end = read('end.json')
  const commands = ndjson('commands.ndjson'), faults = ndjson('faults.ndjson'), consoleEvents = ndjson('console.ndjson')
  const steps = Object.fromEntries(readdirSync(root).filter(n => existsSync(join(root, n, 'exit.json'))).map(n => {
    const exit = read(`${n}/exit.json`), before = read(`${n}/before-roots.json`), after = read(`${n}/after-roots.json`)
    return [`${exit.ext}-${exit.action}`, { path: n, exit, before, after, changes: rootsDiff(before, after),
      state: read(`${n}/actual.json`),
      raw: Object.fromEntries(readdirSync(join(root, n, 'raw')).map(f => [f, read(`${n}/raw/${f}`)])) }]
  }))
  check('eightOriginalActionsCompleted', Object.keys(steps).length === 8 && Object.values(steps).every(s => s.exit.exit === 0))
  const reason = '执行失败：client api: commands/execute failed: Failed to fetch'
  const cases = ['csv', 'xlsx'].map((ext, i) => {
    const bytes = readFileSync(fixturePaths[i]), name = `QA 原生导入.${ext}`
    const line = ` task import-content p-0001 ${JSON.stringify(name)} ${JSON.stringify(bytes.toString(ext === 'csv' ? 'utf8' : 'base64'))}`
    const runs = commands.filter(x => x.event.type === 'command/run' && x.event.data.args.startsWith(line))
    const events = runs.map(x => ({ at: x.at, seq: x.event.seq, ...x.event.data,
      done: commands.find(d => d.event.type === 'command/done' && d.event.data.commandId === x.event.data.commandId) }))
    const injected = faults.filter(x => x.ext === ext), busy = read(`${ext}-busy-probe.json`), failed = read(`${ext}-failed.json`)
    const fail = steps[`${ext}-confirm-fail`], retry = steps[`${ext}-retry`], reopen = steps[`${ext}-reopen`]
    const copyPath = readdirSync(root).find(n => n.startsWith(`${ext}-copy-`))
    const copy = { path: copyPath, before: read(`${copyPath}/before.json`), state: read(`${copyPath}/copied.json`),
      clipboard: read(`${copyPath}/clipboard.json`), text: readFileSync(join(root, copyPath, 'clipboard.txt'), 'utf8'),
      roots: read(`${copyPath}/roots.json`) }
    const ids = ext === 'csv' ? ['t-0004', 't-0005'] : ['t-0006', 't-0007']
    const records = ids.map(id => retry.raw[`${id}.json`].record), target = read(`${reopen.path}/target.json`)
    const fields = ids.map(id => Object.fromEntries(read(`${reopen.path}/${id}-reopened.json`).fields
      .filter(f => f.name && ['title', 'description', 'status', 'priority', 'assignee', 'startDate', 'dueDate', 'progress', 'milestoneId'].includes(f.name))
      .map(f => [f.name, f.value])))
    check(`${ext}:nativeChooserAndExactFixture`, readFileSync(join(root, `native-${ext}/path-action.txt`), 'utf8').includes(fixturePaths[i]) &&
      readFileSync(join(root, `native-${ext}/selected.txt`), 'utf8').includes(name) && bytes.length === (i ? 16561 : 169) &&
      events.length === 2 && events[0].args === line && events[1].args === line + ' confirm' &&
      injected.length === 3 && injected[0].commandSha === sha('/pm' + line + ' confirm') &&
      injected[2].commandSha === injected[0].commandSha && injected[0].fixtureSha === sha(bytes))
    check(`${ext}:busyThreeDisabled`, busy.ariaBusy === 'true' && busy.controls.length === 3 && busy.controls.every(c => c.disabled))
    check(`${ext}:preHostFaultZeroWrite`, injected[1].action === 'fail-before-host' &&
      injected[1].elapsedMs === (i ? 3102 : 3100) && rootsZero(rootsDiff(injected[0].roots, injected[1].roots)) &&
      rootsZero(fail.changes) && rootsZero(rootsDiff(fail.before, read(`${ext}-failed-roots.json`))) &&
      !commands.some(c => Date.parse(c.at) >= Date.parse(injected[0].at) && Date.parse(c.at) <= Date.parse(injected[1].at)))
    check(`${ext}:retainedPreviewAndRestoredControls`, failed.pm.text.includes(busy.preview) &&
      failed.alerts.includes('导入失败，预览已保留，请重试。') &&
      ['确认落盘', '取消'].every(t => failed.buttons.some(b => b.text === t && b.disabled === false)))
    check(`${ext}:errorAlertAssertiveAndFullCopy67`, failed.alerts.some(x => x.startsWith(reason)) &&
      copy.before.role === 'alert' && copy.before.live === 'assertive' && copy.before.class === 'pm-result-card pm-result-card--error' &&
      copy.before.reason === reason && copy.text === reason && Buffer.byteLength(copy.text) === 67 &&
      copy.clipboard.exit === 0 && copy.clipboard.stderr === '' && copy.state.pm.text.includes('已复制') &&
      rootsZero(rootsDiff(fail.after, copy.roots)))
    check(`${ext}:persistentAtOriginalTimes`, Date.parse(copy.before.at) - Date.parse(failed.at) > 29000 &&
      copy.state.alerts.some(x => x.startsWith(reason)))
    check(`${ext}:samePreviewProductionRetry`, injected[2].action === 'continue-original-to-production' &&
      events[1].done?.event.data.kind === 'success' && rootsZero(rootsDiff(fail.after, retry.before)) &&
      equal(retry.changes.data.added, ids.map(id => `/pmtool/tasks/${id}.json`)) &&
      retry.changes.data.changed.length === 0 && retry.changes.data.removed.length === 0 &&
      zero(retry.changes.files) && zero(retry.changes.backups))
    check(`${ext}:newParentChildReopenedFullFields`, equal(target.root, records[0]) && equal(target.child, records[1]) &&
      records[0].id === ids[0] && records[1].parentId === ids[0] && fields.every(f => Object.keys(f).length === 9) &&
      records.every((r, j) => Object.entries(fields[j]).every(([k, v]) => String(r[k] ?? '') === v)) &&
      rootsZero(reopen.changes) && records.every((r, j) => equal(retry.raw[`${ids[j]}.json`], reopen.raw[`${ids[j]}.json`])))
    check(`${ext}:allOldTasksUnchanged`, Object.entries(fail.raw).every(([n, r]) => equal(r, retry.raw[n]) && equal(r, reopen.raw[n])))
    const snapshots = commands.filter(x => x.event.type === 'command/done' && x.event.data.kind === 'success' &&
      x.event.data.text.startsWith('{')).map(x => ({ at: x.at, seq: x.event.seq, data: JSON.parse(x.event.data.text) }))
      .filter(x => Date.parse(x.at) >= Date.parse(events[1].at) && x.data.tasks?.some(t => t.id === ids[0]))
    check(`${ext}:snapshotAllNewFields`, snapshots.length >= 2 &&
      snapshots.every(x => records.every(r => equal(r, x.data.tasks.find(t => t.id === r.id)))))
    check(`${ext}:retryObservableErrorCleared`, !retry.state.pm.text.includes(reason) && retry.state.alerts.length === 0 &&
      retry.state.pm.text.includes('已从上传文件导入 2 个任务'))
    return { ext, fixture: info(fixturePaths[i]), events, injected, busy, failed, copy, ids, records, fields,
      retainedBeforeCopyMs: Date.parse(copy.before.at) - Date.parse(failed.at),
      failedToRetryRequestMs: Date.parse(injected[2].at) - Date.parse(failed.at),
      snapshots: snapshots.map(x => ({ at: x.at, seq: x.seq })), stepPaths: { fail: fail.path, retry: retry.path, reopen: reopen.path } }
  })
  const frames = read('frames/frames.json')
  check('455CompositorFrameHashes', frames.frames.length === 455 &&
    frames.frames.every(f => info(join(root, 'frames', f.file)).sha256 === f.sha256))
  check('sameActualA18TargetAndTimeOrigin', ready.target === 'BA817F66FCE81BD58357C4B50BFFDF2C' &&
    loaded.targetId === ready.target && loaded.state.timeOrigin === 1792629512672.7 &&
    Object.values(steps).every(s => s.state.timeOrigin === loaded.state.timeOrigin && s.state.origin === ready.origin))
  const stop = read('collector-stop.json')
  check('collectorExactStopOriginalEvidence', ready.pid === 64565 && stop[0].stdout.includes('64565 64563') &&
    stop[0].stdout.includes('/private/tmp/pmtool-a18-import-fault-observer-20261022.mjs') &&
    stop[1].stdout.includes('n/Users/bytedance/Projects/dsh-pm/pm-tool') &&
    stop[2].stdout.includes('63429') && stop[3].pid === 64565 && stop[3].signal === 'SIGTERM' &&
    stop[4].exit === 1 && stop[4].stdout === '' && Date.parse(end.at) >= Date.parse(stop[3].at) - 1)
  const overall = rootsDiff(ready.roots, end.roots)
  check('onlyFourNewTasksSessionAndUnchangedFileBytes', equal(overall.data.added,
    ['t-0004', 't-0005', 't-0006', 't-0007'].map(id => `/pmtool/tasks/${id}.json`)) &&
    overall.data.removed.length === 0 && overall.data.changed.length === 1 &&
    overall.data.changed[0].startsWith('/session_projcache/') && zero(overall.files) && zero(overall.backups))
  const seed = json(seedPath), seedRoots = json(join(base, 'final/seed/after-roots.json'))
  check('F5RealTwoAttachmentHashesRetained', Object.keys(seedRoots.files).length === 2 &&
    equal(seedRoots.files, ready.roots.files) && equal(ready.roots.files, end.roots.files))
  const originalExitFiles = Object.fromEntries([...Object.keys(scan(join(base, 'build'))), ...Object.keys(scan(join(base, 'build-pinned11'))),
    ...Object.keys(scan(join(base, 'full-verify')))].filter(p => p.endsWith('.exit.json')).map(p => [p, json(p)]))
  const secretPatterns = [/Bearer\s+[A-Za-z0-9._-]{20,}/, /(?:https?|wss?):\/\/[^\s"'<>]+[?&](?:token|api_key|access_token)=[A-Za-z0-9._-]{16,}/,
    /\bsk-[A-Za-z0-9_-]{24,}\b/]
  const textPaths = Object.keys(inputs).filter(p => p.startsWith(base) && /\.(?:json|ndjson|txt|mjs|py|swift)$/.test(p))
  const secretSuspectPaths = textPaths.filter(p => secretPatterns.some(rx => rx.test(readFileSync(p, 'utf8'))))
  check('noCredentialValuePatternInA18FixedText', secretSuspectPaths.length === 0)
  const result = { at: new Date().toISOString(), environment: { node: process.version, platform: process.platform, arch: process.arch, cwd: process.cwd() },
    inputs, candidate, declared: frozen, checks, index: { count: indexRows.length, rows: indexRows, extras }, proof,
    loader, ready, end, stop, overall, cases, steps, commands, faults, consoleEvents,
    frames: { count: frames.frames.length, first: frames.frames[0], last: frames.frames.at(-1) },
    seed: { path: seedPath, keys: Object.keys(seed), roots: seedRoots },
    originalExitFiles, secretScan: { textFiles: textPaths.length, suspectPaths: secretSuspectPaths,
      boundary: 'Heuristic non-disclosure check, not proof of all possible secrets; PNG chooser address bars independently inspected.' },
    boundary: 'Filesystem evidence audit only; no product/execution imports, tests, GUI/network/services/credentials/build/install. Audit green is not whole GUI PASS.' }
  writeFileSync(`${prefix}-audit.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify({ checks, inputFiles: Object.keys(inputs).length, source: Object.keys(frozen.sourceHashes).length,
    artifacts: Object.keys(frozen.artifacts).length, cases: cases.map(c => ({ ext: c.ext, ids: c.ids,
      retainedBeforeCopyMs: c.retainedBeforeCopyMs, failedToRetryRequestMs: c.failedToRetryRequestMs })), overall,
    originalExitFiles, secretScan: result.secretScan }, null, 2))
  if (Object.values(checks).some(x => !x)) process.exitCode = 1
}

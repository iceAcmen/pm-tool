import { readFileSync, readdirSync, lstatSync, readlinkSync, existsSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual as equal } from 'node:util'

// File evidence only: never import product code or the original GUI collectors.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a18-feedback-controls-gui-review-20261022')
const base = join(repo, 'reports/all-pending-evidence-20261021/A18')
const root = join(base, 'feedback-controls')
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
const candidate = json(join(base, 'candidate.json'))
const fixedDirs = ['feedback-controls', 'import-fault', 'final', 'build', 'build-pinned11', 'full-verify']
  .map(n => join(base, n))
const oldLibs = [
  '/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool/lib',
  ...['a13', 'a14', 'a16'].map(n => `/private/tmp/pmtool-${n}-closure-20261022/packages/dsh-pm-tool/lib`),
].filter(existsSync)
const fixedFiles = [
  ...['candidate.json', 'product-tracked.patch', 'source-auto-handoff.json'].map(n => join(base, n)),
  ...[
    'AGENTS.md', 'docs/collaboration.md',
    'docs/plans/2026-10-22-feedback-error-context-closure.md',
    'docs/testing/a17-transport-feedback-contract-20261022-plan.md',
    'docs/testing/a17-transport-feedback-independent-retest-20261022-cases.test.tsx',
    'docs/testing/a18-feedback-context-independent-retest-20261022.md',
    'docs/testing/a18-feedback-context-independent-retest-20261022-plan.md',
    'docs/testing/a18-import-feedback-gui-review-20261022.md',
    'docs/testing/a18-import-feedback-gui-review-20261022-plan.md',
    'docs/testing/a18-import-feedback-gui-review-20261022-audit.mjs',
    'docs/testing/a18-import-feedback-gui-review-20261022-audit.json',
    'docs/testing/a18-import-feedback-gui-review-20261022-seal.json',
  ].map(n => join(repo, n)),
]
const capture = () => Object.assign({}, ...[...fixedDirs, ...oldLibs].map(scan),
  Object.fromEntries(fixedFiles.map(p => [p, info(p)])))
const declared = () => Object.fromEntries(['sourceHashes', 'artifacts'].map(k => [k,
  Object.fromEntries(Object.entries(candidate[k]).map(([n, expected]) => {
    const p = join(candidate.tree, n), actual = existsSync(p) ? info(p) : null
    return [p, { expected, actual, match: actual?.sha256 === expected }]
  }))]))

if (process.argv[2] === 'seal') {
  const before = json(`${prefix}-audit.json`), after = declared()
  const reviewed = json(`${prefix}-audit-r2.json`)
  const inputs = diff(before.inputs, capture())
  const frozen = Object.fromEntries(Object.keys(after).map(k => [k, diff(
    Object.fromEntries(Object.entries(before.declared[k]).map(([p, x]) => [p, x.actual])),
    Object.fromEntries(Object.entries(after[k]).map(([p, x]) => [p, x.actual])),
  )]))
  const unchanged = zero(inputs) && Object.values(frozen).every(zero) &&
    Object.values(reviewed.checks).every(Boolean)
  const seal = { at: new Date().toISOString(), inputs, frozen, unchanged,
    documents: Object.fromEntries(['-plan.md', '-audit.mjs', '-audit.json', '-audit-r2.json', '.md'].map(s => [prefix + s, info(prefix + s)])),
    released: unchanged, resourcesCreated: [],
    boundary: 'Synchronous file audit only; no GUI/service/build/test children. Main dynamic source/scripts/runtime excluded; no whole-gate signature.' }
  writeFileSync(`${prefix}-seal.json`, JSON.stringify(seal, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify({ unchanged, inputs, frozen, released: seal.released }))
  if (!unchanged) process.exitCode = 1
} else {
  const inputs = capture(), frozen = declared(), checks = {}
  const check = (n, ok) => { checks[n] = Boolean(ok) }
  const index = read('index.json'), paths = Object.keys(scan(root))
  const rows = Object.entries(index.files).map(([n, expected]) => {
    const actual = info(join(root, n))
    return { path: n, expected, actual, match: actual.bytes === expected.bytes && actual.sha256 === expected.sha256 }
  })
  const extras = paths.filter(p => p !== join(root, 'index.json') && !(p.slice(root.length + 1) in index.files))
  check('162IndexedFilesAllBytesHashesNoExtras', rows.length === 162 && rows.every(x => x.match) && extras.length === 0)
  check('fullFrozen520Source453Artifacts', Object.keys(frozen.sourceHashes).length === 520 &&
    Object.keys(frozen.artifacts).length === 453 && Object.values(frozen).every(v => Object.values(v).every(x => x.match)))
  check('trackedPatchMatchesCandidate', info(join(base, 'product-tracked.patch')).sha256 === candidate.trackedPatchSha)
  const proof = json(join(base, 'build-pinned11/proof.json'))
  check('pinned11SourceArtifactsUnchanged', equal(proof.sourceHashes, candidate.sourceHashes) &&
    equal(proof.artifacts, candidate.artifacts) && proof.sourceDrift.length === 0 && proof.priorArtifactDrift.length === 0)
  const loaded = json(join(base, 'final/loaded/result.json')), event = loaded.events[0]
  const client = readFileSync(join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const combo = readFileSync(join(base, 'final/loaded', event.file)), first = combo.indexOf(segment)
  const loader = { target: loaded.targetId, timeOrigin: loaded.state.timeOrigin,
    client: info(join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js')),
    response: { bytes: combo.length, sha256: sha(combo) },
    segment: { bytes: segment.length, sha256: sha(segment), first, second: combo.indexOf(segment, first + 1) } }
  check('fullLoadedUniqueSegment', combo.length === 2584301 && segment.length === 1705469 && first === 875361 &&
    loader.segment.second === -1 && sha(combo) === event.responseSha &&
    sha(client) === event.matches[0].sourceSha && sha(segment) === event.matches[0].segmentSha)
  const start = json(join(base, 'final/host-start.json')), ready = json(join(base, 'final/host-ready.json'))
  check('host3248Pid63429OriginalBinding', start.pid === 63429 && ready.pid === 63429 && ready.port === 3248 &&
    start.plugin === join(candidate.tree, 'packages/dsh-pm-tool') && start.argv.at(-1) === '3248' &&
    loaded.targetId === 'BA817F66FCE81BD58357C4B50BFFDF2C' && loaded.state.timeOrigin === 1792629512672.7)
  const names = {
    edit: 'edit-1792630675226', save: 'save-1792630731626',
    error: 'error-close-1792630785648', continued: 'error-close-continued-1792630886239',
  }
  const rounds = Object.fromEntries(Object.entries(names).map(([k, n]) => {
    const data = Object.fromEntries(readdirSync(join(root, n)).filter(f => f.endsWith('.json')).map(f => [f, read(`${n}/${f}`)]))
    const frames = read(`${n}/frames/frames.json`)
    return [k, { path: n, data, frames }]
  }))
  const states = Object.values(rounds).flatMap(r => Object.entries(r.data).filter(([n]) =>
    ['actual.json', 'draft.json', 'error.json', 'closed.json', 'success.json', 'retained-draft.json'].includes(n)).map(([, v]) => v))
  check('allStatesSameActualPageAndViewport', states.every(s => s.origin === 'http://127.0.0.1:3248' &&
    s.timeOrigin === 1792629512672.7 && s.viewport.width === 1440 && s.viewport.height === 718 &&
    s.viewport.dpr === 2 && s.dark === true))
  const frameRows = Object.values(rounds).flatMap(r => r.frames.frames.map(f => ({
    path: `${r.path}/frames/${f.file}`, ...f, match: info(join(root, r.path, 'frames', f.file)).sha256 === f.sha256,
  })))
  check('all103CompositorFramesHashed', frameRows.length === 103 && frameRows.every(f => f.match &&
    f.metadata.deviceWidth === 1440 && f.metadata.deviceHeight === 718 && f.metadata.pageScaleFactor === 1))
  const pngs = paths.filter(p => p.endsWith('.png')).map(p => {
    const b = readFileSync(p)
    return { path: p.slice(root.length + 1), ...info(p), width: b.readUInt32BE(16), height: b.readUInt32BE(20),
      signature: b.subarray(0, 8).toString('hex') }
  })
  check('allSevenActualPngsValidNativePixels', pngs.length === 7 &&
    pngs.every(p => p.signature === '89504e470d0a1a0a' && p.width === 2880 && p.height === 1436))
  const d = k => rounds[k].data, title = s => s.fields.find(f => f.name === 'title')?.value
  const t1 = 'Failed delivery · Error register · 失败标题', t2 = 'Error register · Failed delivery · 成功重试'
  const reason = '执行失败：client api: commands/execute failed: Failed to fetch'
  const raw = k => Object.fromEntries(readdirSync(join(root, names[k], 'raw')).map(n => [n, read(`${names[k]}/raw/${n}`)]))
  const editRaw = raw('edit'), saveRaw = raw('save')
  const editChanges = rootsDiff(d('edit')['before-roots.json'], d('edit')['after-roots.json'])
  const saveChanges = rootsDiff(d('save')['before-roots.json'], d('save')['after-roots.json'])
  const faultChanges = rootsDiff(d('error')['before-roots.json'], d('error')['error-roots.json'])
  const closeChanges = rootsDiff(d('continued')['before-roots.json'], d('continued')['closed-roots.json'])
  const continuedChanges = rootsDiff(d('continued')['closed-roots.json'], d('continued')['after-roots.json'])
  check('editOnlyInputNoCommandsOrWrites', title(d('edit')['actual.json']) === t1 &&
    d('edit')['commands.json'].length === 0 && rootsZero(editChanges))
  const saveFeedback = d('save')['feedback.json']
  check('normalSpecialTitleRealSuccessStatusNoAlert', saveFeedback.alerts.length === 0 && saveFeedback.cards.length === 0 &&
    saveFeedback.statuses.length === 1 && saveFeedback.statuses[0].cls === 'pm-toast pm-toast--success' &&
    saveFeedback.statuses[0].text.includes(t1) && title(d('save')['actual.json']) === undefined)
  const production = k => {
    const events = d(k)['commands.json'], run = events.find(x => x.event.type === 'command/run' && x.event.data.args.startsWith(' task update t-0001 '))
    const done = events.find(x => x.event.type === 'command/done' && x.event.data.commandId === run?.event.data.commandId)
    const snap = events.find(x => x.event.type === 'command/done' && x.event.data.text.startsWith('{'))
    return { events, run, done, snapshot: snap ? JSON.parse(snap.event.data.text) : null,
      payload: run ? JSON.parse(run.event.data.args.slice(' task update t-0001 '.length)) : null }
  }
  const saved = production('save'), recovered = production('continued')
  check('twoProductionWritesEachOneUpdateOneSnapshot', [saved, recovered].every(p => p.events.length === 4 &&
    p.done.event.data.kind === 'success' && p.done.event.data.text.startsWith('[pm:summary]任务已更新｜t-0001') &&
    p.events.filter(x => x.event.type === 'command/run').length === 2 && p.snapshot.tasks.length === 7) &&
    saved.payload.title === t1 && recovered.payload.title === t2)
  check('saveRawAllSevenAndSnapshotFullFields', Object.keys(saveRaw).length === 7 && equal(
    saved.snapshot.tasks.find(t => t.id === 't-0001'), saveRaw['t-0001.json'].record) &&
    Object.entries(saveRaw).every(([n, r]) => sha(readFileSync(join(root, names.save, 'raw', n))) ===
      d('save')['after-roots.json'].data[`/pmtool/tasks/${n}`]) &&
    Object.entries(editRaw).filter(([n]) => n !== 't-0001.json').every(([n, r]) => equal(r, saveRaw[n])))
  const recordDelta = diff(editRaw['t-0001.json'].record, saveRaw['t-0001.json'].record)
  check('saveTitleUpdatedAtAndExplicitNullManualProgressPreservesExistingFields',
    equal(recordDelta.changed, ['title', 'updatedAt']) && equal(recordDelta.added, ['manualProgress']) &&
    saveRaw['t-0001.json'].record.manualProgress === null && saved.payload.manualProgress === null &&
    recordDelta.removed.length === 0)
  check('actualPreHostFaultRetainsInputNoCommandsNoWrites', d('error')['failed-request.json'].line === '/pm' + recovered.run.event.data.args &&
    d('error')['commands.json'].length === 0 && rootsZero(faultChanges) &&
    title(d('error')['draft.json']) === t2 && title(d('error')['error.json']) === t2 &&
    d('error')['error.json'].alerts[0] === reason + '\n复制原文' &&
    ['取消', '保存更改'].every(t => d('error')['error.json'].buttons.some(b => b.text === t && b.disabled === false)))
  const originalFailure = d('error')['execution.json'], stdoutPath = 'execution/1d8d9aace0834a180f831239341ee004.stdout.txt'
  const stdout = readFileSync(join(root, stdoutPath), 'utf8')
  check('originalCloseFailurePreservedNotSuccess', originalFailure.exit === 1 &&
    originalFailure.error.includes('30000ms exceeded') && stdout.includes(originalFailure.error) &&
    !('closed.json' in d('error')) && !('after-roots.json' in d('error')))
  check('originalErrorStillRetainedAtContinuation', title(d('continued')['retained-draft.json']) === t2 &&
    d('continued')['retained-draft.json'].alerts[0] === reason + '\n复制原文' &&
    equal(d('error')['error-roots.json'], d('continued')['before-roots.json']))
  check('actualCloseAfterDiscardZeroWrite', rootsZero(closeChanges) &&
    title(d('continued')['closed.json']) === undefined && d('continued')['closed.json'].alerts.length === 0 &&
    !d('continued')['closed.json'].pm.text.includes(reason) &&
    d('continued')['execution.json'].exit === 0)
  check('normalNewSaveAfterCloseNoErrorResidualObservable', title(d('continued')['success.json']) === undefined &&
    d('continued')['success.json'].alerts.length === 0 && !d('continued')['success.json'].pm.text.includes(reason) &&
    d('continued')['success.json'].pm.text.includes('任务已更新｜t-0001 ' + t2))
  check('recoverySnapshotFullT1OtherTasksPreserved', recovered.snapshot.tasks.find(t => t.id === 't-0001').title === t2 &&
    equal(diff(saveRaw['t-0001.json'].record, recovered.snapshot.tasks.find(t => t.id === 't-0001')).changed, ['title', 'updatedAt']) &&
    Object.entries(saveRaw).filter(([n]) => n !== 't-0001.json').every(([, r]) =>
      equal(r.record, recovered.snapshot.tasks.find(t => t.id === r.record.id))))
  const writesLimited = changes => changes.data.added.length === 0 && changes.data.removed.length === 0 &&
    changes.data.changed.filter(n => !n.startsWith('/session_projcache/')).join() === '/pmtool/tasks/t-0001.json' &&
    zero(changes.files) && zero(changes.backups)
  check('onlyT1AndSessionTwoWritesNoFilesBackups', writesLimited(saveChanges) && writesLimited(continuedChanges))
  const panel = readFileSync(join(candidate.tree, 'packages/dsh-pm-tool/src/client/panel.tsx'), 'utf8')
  const css = readFileSync(join(candidate.tree, 'packages/dsh-pm-tool/src/client/panel.css'), 'utf8')
  const continuedScript = readFileSync(join(root, 'execution/pmtool-a18-error-close-continued-20261022.mjs'), 'utf8')
  check('frozenModalTrapScrimAndExplicitDiscardPath', panel.includes('role="dialog" aria-modal="true"') &&
    panel.includes('const inside = !!active && root.contains(active)') && panel.includes('pm-drawer-scrim') &&
    css.includes('.pm-drawer-layer { position: fixed; inset: 0; z-index: 30;') &&
    continuedScript.indexOf("'放弃修改'") < continuedScript.indexOf("'[aria-label=\"关闭结果卡\"]'") &&
    continuedScript.includes("'input[name=\"title\"]','" + t2 + "'"))
  const secretPatterns = [/Bearer\s+[A-Za-z0-9._-]{20,}/,
    /(?:https?|wss?):\/\/[^\s"'<>]+[?&](?:token|api_key|access_token)=[A-Za-z0-9._-]{16,}/, /\bsk-[A-Za-z0-9_-]{24,}\b/]
  const textPaths = paths.filter(p => /\.(json|txt|mjs|py)$/.test(p))
  const suspects = textPaths.filter(p => secretPatterns.some(rx => rx.test(readFileSync(p, 'utf8'))))
  check('fixedFeedbackTextNoCredentialPattern', suspects.length === 0)
  const result = { at: new Date().toISOString(), environment: { node: process.version, platform: process.platform, arch: process.arch, cwd: process.cwd() },
    inputs, declared: frozen, candidateIdentity: info(join(base, 'candidate.json')), oldLibs, checks,
    index: { identity: info(join(root, 'index.json')), count: rows.length, rows, extras },
    loader, host: { start, ready }, observations: read('observations.json'), rounds,
    frames: { count: frameRows.length, rows: frameRows }, pngs, production: { saved, recovered },
    raw: { edit: editRaw, saved: saveRaw }, changes: { editChanges, saveChanges, faultChanges, closeChanges, continuedChanges, recordDelta },
    originalFailure: { execution: originalFailure, stdoutPath, stdout },
    retainedErrorMs: Date.parse(d('continued')['retained-draft.json'].at) - Date.parse(d('error')['error.json'].at),
    secretScan: { textFiles: textPaths.length, suspectPaths: suspects, boundary: 'Heuristic only; no credentials read.' },
    boundary: 'File integrity and structure only, not a GUI verdict. Main dynamic source/scripts excluded; only frozen A18 and old isolated libs protected.' }
  const suffix = process.argv[2] === 'r2' ? '-audit-r2.json' : '-audit.json'
  writeFileSync(prefix + suffix, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify({ checks, inputFiles: Object.keys(inputs).length, indexed: rows.length, frames: frameRows.length,
    pngs: pngs.length, source: Object.keys(frozen.sourceHashes).length, artifacts: Object.keys(frozen.artifacts).length,
    changes: result.changes, retainedErrorMs: result.retainedErrorMs, secretScan: result.secretScan }, null, 2))
  if (Object.values(checks).some(v => !v)) process.exitCode = 1
}

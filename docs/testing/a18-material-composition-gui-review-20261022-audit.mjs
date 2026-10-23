import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, lstatSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual as eq } from 'node:util'

// Read archived evidence only. No product imports, GUI replay, or live data access.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a18-material-composition-gui-review-20261022')
const a18 = join(repo, 'reports/all-pending-evidence-20261021/A18')
const root = join(a18, 'material-composition')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const fp = p => {
  if (!lstatSync(p).isFile()) throw Error(`Not a regular file: ${p}`)
  const b = readFileSync(p)
  return { bytes: b.length, sha256: sha(b) }
}
const scan = (p, out = {}) => {
  if (lstatSync(p).isDirectory()) for (const n of readdirSync(p).sort()) scan(join(p, n), out)
  else out[p] = fp(p)
  return out
}
const candidate = json(join(a18, 'candidate.json'))
const fixture = join(repo, 'docs/testing/materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr/fixtures/F5/backup.json')
const fixed = [
  join(a18, 'candidate.json'), join(a18, 'product-tracked.patch'), fixture,
  ...['host-start.json', 'host-ready.json', 'environment.json'].map(n => join(a18, 'final', n)),
  ...['AGENTS.md', 'docs/collaboration.md',
    'docs/testing/remaining-journey-cases-20261021.md',
    'docs/testing/materials-files-reports-independent-auto-20261021.md',
    'docs/testing/materials-files-reports-independent-auto-20261021-oracle-correction.md',
    'docs/testing/materials-files-reports-independent-auto-20261021-gui-handoff.md',
    'docs/testing/remaining-acceptance-delta-20261022.md',
    'docs/testing/remaining-acceptance-delta-20261022-ledger.md',
    'reports/all-pending-evidence-20261021/A18/import-fault/execution/pmtool-a18-gui-20261022.mjs',
  ].map(p => join(repo, p)),
]
const capture = () => {
  const out = {}
  for (const p of [root, join(a18, 'final/loaded'),
    join(candidate.tree, 'packages/dsh-pm-tool/src'),
    join(candidate.tree, 'packages/dsh-pm-tool/lib')]) scan(p, out)
  for (const p of fixed) out[p] = fp(p)
  for (const p of new Set([...Object.keys(candidate.sourceHashes), ...Object.keys(candidate.artifacts)]))
    out[join(candidate.tree, p)] = fp(join(candidate.tree, p))
  return out
}
const delta = (a, b) => ({
  added: Object.keys(b).filter(k => !(k in a)).sort(),
  removed: Object.keys(a).filter(k => !(k in b)).sort(),
  changed: Object.keys(a).filter(k => k in b && !eq(a[k], b[k])).sort(),
})
const zero = d => Object.values(d).every(v => v.length === 0)
const output = (suffix, value) => writeFileSync(prefix + suffix,
  JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const stages = [
  'open-1792633717128', 'compose-1792633754552', 'save-1792633797652',
  'save-1792633845858', 'open-1792633874373', 'cancel-1792633889539',
]
const read = (s, n) => json(join(root, s, n))
const task = s => read(s, 'raw/tasks/t-0001.json').record
const fields = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => !eq(a[k], b[k])).sort()
const mode = process.argv[2]
const finalAudit = '-audit-r2.json'
if (mode === 'freeze') {
  const files = capture()
  output('-before.json', { at: new Date().toISOString(), files,
    boundary: 'Freeze before audit outputs; earlier operations were read-only. Main in-flight files/live data/dependencies/services/credentials excluded.' })
  console.log(JSON.stringify({ mode, protectedFiles: Object.keys(files).length }))
} else if (mode === 'audit' || mode === 'audit-r2') {
  const checks = {}
  const check = (n, v) => { checks[n] = !!v }
  const index = json(join(root, 'index.json'))
  const indexed = index.files.map(x => x.path)
  const actualPaths = Object.keys(scan(root)).map(p => p.slice(root.length + 1)).filter(p => p !== 'index.json').sort()
  const mismatches = index.files.filter(x => !eq(fp(join(root, x.path)), { bytes: x.bytes, sha256: x.sha256 })).map(x => x.path)
  check('index292ExactFileSetAndHashes', index.files.length === 292 && new Set(indexed).size === 292
    && eq([...indexed].sort(), actualPaths) && !mismatches.length)
  const sourceMismatch = Object.entries(candidate.sourceHashes)
    .filter(([p, h]) => fp(join(candidate.tree, p)).sha256 !== h).map(([p]) => p)
  const artifactMismatch = Object.entries(candidate.artifacts)
    .filter(([p, h]) => fp(join(candidate.tree, p)).sha256 !== h).map(([p]) => p)
  check('frozen520Inputs453ArtifactsMatch', Object.keys(candidate.sourceHashes).length === 520
    && Object.keys(candidate.artifacts).length === 453 && !sourceMismatch.length && !artifactMismatch.length)
  check('baselineAndPatchBound', candidate.baseline === '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd'
    && fp(join(a18, 'product-tracked.patch')).sha256 === candidate.trackedPatchSha)
  const obs = json(join(root, 'observations.json'))
  check('observationsCandidateLoadedBinding', fp(join(a18, 'candidate.json')).sha256 === obs.candidateSHA
    && obs.candidateSHA === '2d533a1d214c0ae68739b354aac2e0d85b37ca6735c256d3dd3820bce3c191b9'
    && fp(join(a18, 'final/loaded/result.json')).sha256 === obs.loadedSHA)
  const loaded = json(join(a18, 'final/loaded/result.json'))
  const client = readFileSync(join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const loadedChecks = loaded.events.map(e => {
    const b = readFileSync(join(a18, 'final/loaded', e.file))
    const first = b.indexOf(segment), second = b.indexOf(segment, first + 1)
    return { bytes: b.length, sha256: sha(b), first, second, segmentBytes: segment.length,
      segmentSha: sha(segment), ok: b.length === e.bytes && sha(b) === e.responseSha
        && e.status === 200 && e.fromDiskCache === false && first >= 0 && second === -1
        && e.frameId === loaded.targetId && e.matches.some(m => m.sourceSha === sha(client)
          && m.segmentSha === sha(segment) && m.segmentBytes === segment.length
          && m.first === first && m.second === second && m.uniqueComplete) }
  })
  check('fullUncachedUniqueClientSegment', loadedChecks.length === 1 && loadedChecks.every(x => x.ok))
  const start = json(join(a18, 'final/host-start.json')), ready = json(join(a18, 'final/host-ready.json'))
  check('recordedHostAndContext', start.pid === 63429 && ready.pid === 63429 && ready.port === 3248 && ready.ready
    && start.plugin === join(candidate.tree, 'packages/dsh-pm-tool')
    && candidate.hostGitHead === '1142fb74f2bbcc54dc9499054c0448c9b876cbf2'
    && loaded.targetId === 'BA817F66FCE81BD58357C4B50BFFDF2C'
    && loaded.state.origin === 'http://127.0.0.1:3248' && loaded.state.timeOrigin === 1792629512672.7)
  const rows = stages.map(s => {
    const before = read(s, 'before-roots.json')
    const after = existsSync(join(root, s, 'after-roots.json')) ? read(s, 'after-roots.json') : null
    const state = read(s, 'before.json'), exit = read(s, 'exit.json')
    const frameIndex = read(s, 'frames/frames.json')
    let lastTime = -Infinity
    const timestampReorders = []
    const frameErrors = frameIndex.frames.filter(f => {
      const backwards = f.metadata.timestamp < lastTime
      if (backwards) timestampReorders.push({ file: f.file, previous: lastTime, timestamp: f.metadata.timestamp })
      const valid = fp(join(root, s, 'frames', f.file)).sha256 === f.sha256
        && Number.isFinite(f.metadata.timestamp) && (mode !== 'audit' || !backwards)
        && f.metadata.deviceWidth === 1440 && f.metadata.deviceHeight === 718
      lastTime = f.metadata.timestamp
      return !valid
    })
    check(`${s}:contextAndFrames`, state.origin === loaded.state.origin && state.timeOrigin === loaded.state.timeOrigin
      && state.viewport.width === 1440 && state.viewport.height === 718 && state.dark === true
      && frameIndex.source === 'CDP Page.screencastFrame; actual browser compositor' && !frameErrors.length)
    if (after) {
      const copied = Object.keys(scan(join(root, s, 'raw')))
      check(`${s}:rawMatchesCapturedManifest`, copied.every(p =>
        after.data['/pmtool/' + p.slice(join(root, s, 'raw').length + 1)] === fp(p).sha256))
    }
    return { step: s, exit, frames: frameIndex.frames.length, frameErrors: frameErrors.map(f => f.file), timestampReorders,
      requests: read(s, 'requests.json'), events: read(s, 'commands.json'),
      rootDiff: after ? Object.fromEntries(Object.keys(before).map(k => [k, delta(before[k], after[k])])) : null }
  })
  check('sixSteps136RealFrames11PNGs', rows.length === 6 && rows.reduce((n, s) => n + s.frames, 0) === 136
    && index.files.filter(x => x.path.endsWith('.png')).length === 11)
  check('consoleEmptyAllSixSteps', stages.every(s => read(s, 'console.json').length === 0))
  check('openComposeReopenCancelZeroRoots', [0, 1, 4, 5].every(i => Object.values(rows[i].rootDiff).every(zero)))
  check('nonSaveIncludingFailedSelectorNoCommands', [0, 1, 2, 4, 5].every(i =>
    rows[i].requests.length === 0 && rows[i].events.length === 0))
  check('failedSelectorPreservedNoAfterFabricated', rows[2].exit.exit === 1
    && rows[2].exit.error === 'Error: visible target missing: 保存' && rows[2].rootDiff === null)
  check('failedAttemptBracketedByEqualManifests', eq(read(stages[1], 'after-roots.json'), read(stages[2], 'before-roots.json'))
    && eq(read(stages[2], 'before-roots.json'), read(stages[3], 'before-roots.json')))
  check('successfulExitsSeparateFromFailure', [0, 1, 3, 4, 5].every(i => rows[i].exit.exit === 0))
  const save = rows[3]
  const lines = save.requests.map(r => r.body.payload.args.line)
  const payload = JSON.parse(lines[0].slice('/pm task update t-0001 '.length))
  check('oneBusinessPOSTThenReadonlySnapshot', save.requests.length === 2
    && lines[0].startsWith('/pm task update t-0001 ') && lines[1] === '/pm web snapshot'
    && save.requests.every(r => r.path === '/api/commands/execute'))
  check('singleDraftIncrementalOpsNoRawReplacement', eq(Object.keys(payload.draft).sort(), ['attachmentOps', 'progressOps'])
    && !('attachments' in payload) && !('progressLog' in payload) && !('draft' in payload.draft)
    && eq(payload.draft.attachmentOps, [{ op: 'updateNote', id: 'at-1',
      note: 'QA 组合保存原链接备注', title: 'QA规范' }])
    && eq(payload.draft.progressOps, [{ op: 'edit', id: 'pl-1',
      content: 'QA 组合保存 rv4 正文；既有版本必须保留。', author: '测试甲组合', date: '2026-10-21' }]))
  const events = save.events.map(x => x.event)
  check('twoMatchedRunDoneSuccessPairs', events.length === 4
    && eq(events.map(e => e.type), ['command/run', 'command/done', 'command/run', 'command/done'])
    && events[0].data.commandId === events[1].data.commandId
    && events[2].data.commandId === events[3].data.commandId
    && events[1].data.kind === 'success' && events[3].data.kind === 'success'
    && events[0].data.args.trim() === lines[0].slice(4) && events[2].data.args.trim() === 'web snapshot')
  const initial = task(stages[0]), composed = task(stages[1]), saved = task(stages[3])
  const seed = json(fixture).tasks.find(t => t.id === 't-0001')
  check('legalF5MaterialHistorySeed', fp(fixture).sha256 === '8f9bf659a59077af3753900b9fec43dbca752673e59516d025f649a1982f8b4c'
    && eq(seed.attachments, initial.attachments) && eq(seed.progressLog, initial.progressLog)
    && initial.progressLog[0].revisions.length === 3 && initial.progressLog[1].revisions.length === 2
    && !!initial.progressLog[1].deletedAt && initial.progressLog[2].revisions.length === 1)
  check('composedDraftNotPersisted', eq(initial, composed))
  const expected = structuredClone(initial)
  expected.title = 'QA 组合保存 基础字段与资料进展'
  expected.updatedAt = saved.updatedAt
  expected.attachments[0].note = 'QA 组合保存原链接备注'
  expected.progressLog[0].revisions.push(saved.progressLog[0].revisions[3])
  check('onlyRequestedTitleNoteAppendAndUpdatedAt', eq(expected, saved)
    && eq(fields(initial, saved), ['attachments', 'progressLog', 'title', 'updatedAt']))
  check('stableFourAttachmentsFrozenDeliverableAndFiles', eq(initial.attachments.map(x => x.id), ['at-1', 'at-2', 'at-3', 'at-4'])
    && eq(initial.attachments.slice(1), saved.attachments.slice(1))
    && eq(initial.attachments[0], { ...saved.attachments[0], note: initial.attachments[0].note }))
  check('E1OnlyAppendOldThreeRevisionsAndEntryMetadataIntact', saved.progressLog[0].revisions.length === 4
    && eq(initial.progressLog[0], { ...saved.progressLog[0], revisions: saved.progressLog[0].revisions.slice(0, 3) }))
  check('E2SoftDeleteAndBothRevisionsE3AllFieldsUnchanged',
    eq(initial.progressLog.slice(1), saved.progressLog.slice(1)))
  const rv4 = saved.progressLog[0].revisions[3]
  check('rv4CorrectAuthorContentCurrentDateNotToday', rv4.id === 'rv-4'
    && rv4.author === '测试甲组合' && rv4.content === payload.draft.progressOps[0].content
    && rv4.date === initial.progressLog[0].revisions[2].date && rv4.date === '2026-10-21'
    && rv4.revisedAt === '2026-10-22T01:50:49.991Z')
  check('snapshotEqualsSavedRaw', eq(JSON.parse(events[3].data.text).tasks.find(t => t.id === 't-0001'), saved))
  check('saveChangesOnlyTargetBusinessRecordAndHostSession',
    eq(save.rootDiff.data.added, []) && eq(save.rootDiff.data.removed, [])
    && eq(save.rootDiff.data.changed, ['/pmtool/tasks/t-0001.json',
      '/session_projcache/sessions/session-04548dcf-b6ba-4259-a7ad-e7957eb0593f.json'])
    && ['files', 'backups', 'exports'].every(k => zero(save.rootDiff[k])))
  check('twoBytesAssetsAndAllUnrelatedTablesPreserved', Object.keys(read(stages[0], 'before-roots.json').files).length === 2
    && eq(read(stages[0], 'before-roots.json').files, read(stages[5], 'after-roots.json').files)
    && eq(read(stages[0], 'raw/file_assets/fa-0001.json'), read(stages[5], 'raw/file_assets/fa-0001.json'))
    && eq(read(stages[0], 'raw/file_assets/fa-0002.json'), read(stages[5], 'raw/file_assets/fa-0002.json')))
  check('reopenAndCancelRawEqualSavedIncludingUpdatedAt', eq(saved, task(stages[4])) && eq(saved, task(stages[5])))
  const reentry = read(stages[4], 'details.json')
  check('reentryDOMTitleNoteRevisionAndFourVersionLabel', reentry.fields.some(f => f.name === 'title' && f.value === saved.title)
    && reentry.materials.some(s => s.includes(saved.attachments[0].note))
    && reentry.materials.some(s => s.includes('历史（4 版）') && s.includes(rv4.author) && s.includes(rv4.content)))
  const drift = delta(json(prefix + '-before.json').files, capture())
  check('protectedInputsUnchanged', zero(drift))
  const ok = Object.values(checks).every(Boolean)
  output(mode === 'audit' ? '-audit.json' : finalAudit, { at: new Date().toISOString(), runtime: process.version, platform: process.platform,
    ok, checks, index: { files: indexed.length, mismatches, sha256: fp(join(root, 'index.json')).sha256 },
    candidate: { baseline: candidate.baseline, hostGitHead: candidate.hostGitHead, tree: candidate.tree,
      sourceMismatch, artifactMismatch, sourceCount: 520, artifactCount: 453, sourceSHA: obs.candidateSHA },
    loadedChecks, rows, payload, initialTaskSHA: fp(join(root, stages[0], 'raw/tasks/t-0001.json')).sha256,
    savedTaskSHA: fp(join(root, stages[3], 'raw/tasks/t-0001.json')).sha256,
    changedTaskFields: fields(initial, saved), rv4, drift,
    boundary: 'Mechanical archive audit only, not an independent GUI verdict. Reentry material text is DOM/raw evidence, not visible expanded history.' })
  console.log(JSON.stringify({ mode, ok, checks: Object.keys(checks).length,
    failed: Object.keys(checks).filter(k => !checks[k]), originalFiles: 292, originalFrames: 136 }))
  process.exitCode = ok ? 0 : 1
} else if (mode === 'seal') {
  const drift = delta(json(prefix + '-before.json').files, capture())
  const audit = json(prefix + finalAudit)
  const own = Object.fromEntries(readdirSync(dirname(prefix))
    .filter(n => n.startsWith(prefix.split('/').at(-1)) && !n.endsWith('-seal.json'))
    .map(n => [n, fp(join(dirname(prefix), n))]))
  const ok = zero(drift) && audit.ok
  output('-seal.json', { at: new Date().toISOString(), ok, drift,
    protectedFiles: Object.keys(json(prefix + '-before.json').files).length, own,
    released: ok, boundary: 'Reviewer resources released only; no process/browser/service control and no global acceptance/commit authorization.' })
  console.log(JSON.stringify({ mode, ok, released: ok, drift }))
  process.exitCode = ok ? 0 : 1
} else throw Error('Use freeze, audit, audit-r2, or seal')

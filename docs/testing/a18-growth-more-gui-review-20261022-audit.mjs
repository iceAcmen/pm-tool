import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, lstatSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Evidence only: no product imports, browser, service, credential or live data access.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a18-growth-more-gui-review-20261022')
const suffix = process.argv[2] === 'r2' ? '-r2' : ''
const reports = join(repo, 'reports/all-pending-evidence-20261021')
const root = join(reports, 'A18/growth-more')
const old = join(reports, 'A15/growth-habit')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const stable = x => JSON.stringify(x, (_, v) => v && !Array.isArray(v) && typeof v === 'object'
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v)
const eq = (a, b) => stable(a) === stable(b)
const fp = p => {
  const s = lstatSync(p)
  if (!s.isFile()) throw Error(`Nonregular evidence: ${p}`)
  const b = readFileSync(p)
  return { bytes: b.length, sha256: sha(b), mtimeMs: s.mtimeMs }
}
const scan = (p, out = {}) => {
  if (lstatSync(p).isDirectory()) for (const n of readdirSync(p).sort()) scan(join(p, n), out)
  else out[p] = fp(p)
  return out
}
const delta = (a, b) => ({
  added: Object.fromEntries(Object.keys(b).filter(k => !(k in a)).map(k => [k, b[k]])),
  removed: Object.fromEntries(Object.keys(a).filter(k => !(k in b)).map(k => [k, a[k]])),
  changed: Object.fromEntries(Object.keys(a).filter(k => k in b && !eq(a[k], b[k]))
    .map(k => [k, { before: a[k], after: b[k] }])),
})
const roots = ['data', 'files', 'backups', 'exports']
const rootDiff = (a, b) => Object.fromEntries(roots.map(k => [k, delta(a[k] ?? {}, b[k] ?? {})]))
const zero = d => Object.values(d).every(v => Object.values(v).every(x => Object.keys(x).length === 0))
const changes = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => !eq(a[k], b[k])).sort()
const manifestPaths = {
  A13: join(reports, 'A13/candidate-final.json'),
  A14: join(reports, 'A14/candidate.json'),
  A16: join(reports, 'A16/candidate.json'),
}
const candidates = Object.fromEntries(Object.entries(manifestPaths).map(([k, p]) => [k, json(p)]))
const fixed = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/governance-growth-independent-auto-20261021-report.md',
  'docs/testing/governance-growth-independent-auto-20261021-gui-handoff.md',
  'docs/testing/governance-growth-independent-auto-20261021-worker.mjs',
  'docs/testing/a15-busy-habit-gui-review-20261022.md',
  'docs/testing/a15-busy-habit-gui-review-20261022-audit.mjs',
  'docs/testing/a15-busy-habit-gui-review-20261022-audit.json',
  'docs/testing/a15-busy-habit-gui-review-20261022-audit-r2.json',
  'docs/testing/a15-busy-habit-gui-review-20261022-seal.json',
  'docs/testing/a15-file-fault-gui-review-20261022.md',
  'docs/testing/materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr/fixtures/F5/backup.json',
  'reports/all-pending-evidence-20261021/A13/product-tracked.patch',
  'reports/all-pending-evidence-20261021/A13/environment-final.json',
].map(p => join(repo, p))
fixed.push('/private/tmp/pmtool-a13-final-gui-20261022.mjs')
const capture = () => {
  const out = {}
  for (const p of [root, old, join(reports, 'A13/final/materials/loaded'), join(reports, 'A13/final/materials/seed')]) scan(p, out)
  for (const p of [...fixed, ...Object.values(manifestPaths)]) out[p] = fp(p)
  for (const c of Object.values(candidates)) {
    for (const p of new Set([...Object.keys(c.sourceHashes), ...Object.keys(c.artifacts)])) out[join(c.tree, p)] = fp(join(c.tree, p))
  }
  return out
}
if (process.argv[2] === 'seal') {
  const initial = json(prefix + '-audit.json').protectedBefore
  const second = json(prefix + '-audit-r2.json').protectedBefore
  const current = capture(), diff = delta(initial, current)
  const deliverables = Object.fromEntries(readdirSync(dirname(prefix))
    .filter(n => n.startsWith(prefix.split('/').at(-1)) && !n.endsWith('-seal.json'))
    .map(n => [n, fp(join(dirname(prefix), n))]))
  const secondDiff = delta(second, current)
  const result = { at: new Date().toISOString(), count: Object.keys(initial).length, diff, secondDiff,
    untouched: [diff, secondDiff].every(d => Object.values(d).every(x => Object.keys(x).length === 0)), deliverables }
  writeFileSync(prefix + '-seal.json', JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify({ count: result.count, untouched: result.untouched, diff }, null, 2))
  process.exitCode = result.untouched ? 0 : 1
} else {
  const protectedBefore = capture()
  const candidateChecks = Object.fromEntries(Object.entries(candidates).map(([k, c]) => [k, {
    manifest: fp(manifestPaths[k]), tree: c.tree, baseline: c.baseline, hostGitHead: c.hostGitHead,
    sourceCount: Object.keys(c.sourceHashes).length, artifactCount: Object.keys(c.artifacts).length,
    sourceMismatch: Object.entries(c.sourceHashes).filter(([p, h]) => fp(join(c.tree, p)).sha256 !== h).map(([p]) => p),
    artifactMismatch: Object.entries(c.artifacts).filter(([p, h]) => fp(join(c.tree, p)).sha256 !== h).map(([p]) => p),
    scope: k === 'A13' ? 'tested identity' : 'protection only, no acceptance',
  }]))
  const index = json(join(root, 'index.json')), oldIndex = json(join(old, 'index.json'))
  const indexCheck = (base, entries) => Object.entries(entries).map(([p, v]) => ({
    path: p, ...fp(join(base, p)), matches: fp(join(base, p)).sha256 === v.sha256 && fp(join(base, p)).bytes === v.bytes,
  }))
  const indexed = indexCheck(root, index.files), priorIndexed = indexCheck(old, oldIndex)
  const oldAudit = json(join(repo, 'docs/testing/a15-busy-habit-gui-review-20261022-audit-r2.json'))
  const oldSealFiles = Object.fromEntries(Object.entries(oldAudit.protection.before).filter(([p]) => p.startsWith(old + '/')))
  const oldDrift = delta(oldSealFiles, Object.fromEntries(Object.entries(scan(old)).filter(([p]) => p in oldSealFiles)))
  const all = Object.keys(scan(root)).map(p => p.slice(root.length + 1))
  const unlisted = all.filter(p => p !== 'index.json' && !(p in index.files))
  const extras = Object.keys(scan(old)).map(p => p.slice(old.length + 1))
    .filter(p => p !== 'index.json' && !(p in oldIndex))
  const frames = all.filter(p => p.endsWith('/frames/frames.json')).flatMap(p =>
    json(join(root, p)).frames.map(f => {
      const path = join(dirname(p), f.file)
      return { manifest: p, path, sha256: f.sha256, actual: fp(join(root, path)), matches: fp(join(root, path)).sha256 === f.sha256 }
    }))
  const client = readFileSync(join(candidates.A13.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const loaded = json(join(reports, 'A13/final/materials/loaded/result.json'))
  const loadedChecks = loaded.events.map(e => {
    const b = readFileSync(join(reports, 'A13/final/materials/loaded', e.file)), first = b.indexOf(segment)
    return { event: e, bytes: b.length, sha256: sha(b), first, second: b.indexOf(segment, first + 1),
      matches: first >= 0 && b.indexOf(segment, first + 1) === -1 && e.bytes === b.length && e.responseSha === sha(b)
        && e.frameId === loaded.targetId && e.status === 200 && e.fromDiskCache === false
        && e.matches.some(m => m.sourceSha === sha(client) && m.segmentSha === sha(segment)
          && m.segmentBytes === segment.length && m.first === first && m.second === -1) }
  })
  const observations = json(join(root, 'observations.json'))
  const stepNames = readdirSync(root).filter(n => /^[\w-]+-\d+$/.test(n))
    .sort((a, b) => Number(a.split('-').at(-1)) - Number(b.split('-').at(-1)))
  const sid = 'session-792b22a6-e1db-428a-8816-4e86592a7262'
  const habitId = 'habit-mvi5z84q-32ztau', okrId = 'okr-mvi5z847-33y3xk'
  const steps = Object.fromEntries(stepNames.map(n => {
    const path = join(root, n), read = p => json(join(path, p))
    const s = { exit: read('exit.json'), commands: read('commands.json'), requests: read('requests.json'),
      console: read('console.json'), before: read('before-roots.json') }
    s.pairs = s.commands.filter(x => x.event.type === 'command/run').map(run => {
      const done = s.commands.find(x => x.event.type === 'command/done' && x.event.data.commandId === run.event.data.commandId)
      const request = s.requests.find(x => x.body?.payload?.args?.line === `/pm${run.event.data.args}`)
      return { run, done, request, matches: !!done && !!request && run.event.data.source.kind === 'user'
        && run.event.data.name === 'pm' && request.body.type === 'client-request'
        && request.body.method === 'commands/execute' && request.path === '/api/commands/execute'
        && request.body.payload.args.agentId === sid && eq(request.body.payload.args.submittedAttachments, []) }
    })
    if (s.exit.exit === 0) {
      s.after = read('after-roots.json'); s.diff = rootDiff(s.before, s.after)
      s.actual = read('actual.json'); s.host = read('host-state.json')
      s.raw = Object.fromEntries(['habits', 'okrs', 'settings'].map(t => [t, Object.fromEntries(
        readdirSync(join(path, 'raw', t)).map(p => [p.replace(/\.json$/, ''), read(`raw/${t}/${p}`).record]))]))
      s.rawMismatches = ['habits', 'okrs', 'settings'].flatMap(t => readdirSync(join(path, 'raw', t))
        .filter(p => fp(join(path, 'raw', t, p)).sha256 !== s.after.data[`/pmtool/${t}/${p}`]).map(p => `${t}/${p}`))
      s.snapshotMismatches = s.pairs.filter(p => p.run.event.data.args === ' web snapshot').flatMap(p => {
        const snap = JSON.parse(p.done.event.data.text)
        return ['habits', 'okrs'].filter(t => !eq(snap[t].slice().sort((a, b) => a.id.localeCompare(b.id)),
          Object.values(s.raw[t]).sort((a, b) => a.id.localeCompare(b.id))))
      })
    }
    const row = observations.rows.find(r => r.step === n)
    // The collector summary intentionally omits web snapshot events; keep both forms.
    const summarized = s.commands.filter(x => x.event.type === 'command/run'
      ? x.event.data.args !== ' web snapshot'
      : !s.pairs.some(p => p.run.event.data.args === ' web snapshot' && p.done.event.data.commandId === x.event.data.commandId))
    s.observationMatches = eq(s.exit, row.execution)
      && eq(suffix ? summarized : s.commands, row.commands) && (s.exit.exit !== 0 || eq(s.diff, row.diff))
    return [n, s]
  }))
  const n = {
    future: 'command-1792627408204', tooOld: 'command-1792627427738',
    final: 'command-1792627469653', finalRepeat: 'command-1792627492581',
    suggest1: 'command-1792627571916', suggest2: 'command-1792627588135', pending: 'pm-habit-1792627598950',
    confirm: 'habit-confirm-1792627633171', ignore: 'habit-ignore-1792627649060',
    confirmRepeat: 'command-1792627678652', reopenInbox: 'pm-habit-1792627703623',
    wrongEdit: 'habit-edit-1792627721162', wrongSelect: 'habit-select-none-1792627731447',
    bAdd: 'command-1792627846925', cross: 'command-1792627862888', unlink: 'command-1792627870395',
    unlinkedPage: 'pm-habit-1792627878219', edit: 'habit-edit-1792627906983',
    select: 'habit-select-original-1792627914207', save: 'habit-save-1792627921818',
    reopen: 'habit-edit-1792627947128', cancel: 'habit-cancel-1792627954370',
  }
  const at = k => steps[n[k]], h = k => at(k).raw.habits[habitId], inbox = k => at(k).raw.settings.pmHabitInbox?.value.entries
  const history = h('future').checkIns
  const draftId = 'habit-mvis7j18-8evvof', foreignId = 'okr-mvisc3xm-tam2uc'
  const linkedDraft = at('confirm').raw.habits[draftId]
  const successful = stepNames.filter(k => steps[k].exit.exit === 0)
  const chainGaps = successful.slice(1).map((k, i) => ({ from: successful[i], to: k, diff: rootDiff(steps[successful[i]].after, steps[k].before) }))
  const noAux = s => zero(Object.fromEntries(roots.filter(k => k !== 'data').map(k => [k, s.diff[k]])))
  const assertions = {
    a13DeclaredIdentity: candidateChecks.A13.sourceCount === 514 && candidateChecks.A13.artifactCount === 453
      && !candidateChecks.A13.sourceMismatch.length && !candidateChecks.A13.artifactMismatch.length,
    completeLoadedClient: loadedChecks.length === 1 && loadedChecks.every(x => x.matches),
    newIndex970: indexed.length === 970 && indexed.every(x => x.matches) && unlisted.length === 0,
    oldIndex215NotExpanded: priorIndexed.length === 215 && priorIndexed.every(x => x.matches),
    oldSealed216Untouched: Object.keys(oldSealFiles).length === 216 && Object.values(oldDrift).every(v => Object.keys(v).length === 0),
    extrasOnlyDeclaredTwoDirectories: extras.every(p => /^(habit-inspect-1792627187642|habit-nav-1792627217555)\//.test(p)),
    allFramesHash: frames.every(x => x.matches) && all.filter(p => p.endsWith('.jpg')).every(p => frames.some(f => f.path === p)),
    steps33OriginalFailures3: stepNames.length === 33 && successful.length === 30
      && stepNames.filter(k => steps[k].exit.exit === 1).every(k => steps[k].commands.length === 0 && steps[k].requests.length === 0
        && !existsSync(join(root, k, 'after-roots.json')) && !existsSync(join(root, k, 'actual.json'))),
    pagesSameOriginTime: successful.every(k => steps[k].actual.origin === loaded.state.origin
      && steps[k].actual.timeOrigin === loaded.state.timeOrigin && steps[k].host.timeOrigin === loaded.state.timeOrigin),
    observationsRecomputed: stepNames.every(k => steps[k].observationMatches),
    allRawHashMatches: successful.every(k => steps[k].rawMismatches.length === 0),
    rpcEventUserPairs: stepNames.every(k => steps[k].pairs.every(p => p.matches)
      && steps[k].pairs.length * 2 === steps[k].commands.length && steps[k].pairs.length === steps[k].requests.length),
    snapshotsRawComplete: successful.every(k => steps[k].snapshotMismatches.length === 0),
    visibleCommandInputsFirstOnly: successful.filter(k => steps[k].exit.action === 'command').every(k => {
      const s = steps[k], pre = json(join(root, k, 'before-submit.json'))
      return s.pairs.length === 1 && pre.editors.some(e => e.visible && e.editable === 'true' && e.text === s.exit.line)
        && pre.content.some(c => c.sid === sid && c.phase === 'hero' && c.visible)
        && pre.cards.length === 0 && s.host.cards.length === 0 && s.host.editors.some(e => e.visible && e.text === '')
    }),
    negativeDatesRejectZeroRoots: ['future', 'tooOld'].every(k => zero(at(k).diff) && at(k).pairs[0].done.event.data.kind === 'error'
      && eq(h(k).checkIns, history) && eq(h(k).streak, h('future').streak)),
    finalOnlyStateTime: eq(changes(h('future'), h('final')), ['status', 'updatedAt']) && h('final').status === 'final'
      && eq(h('final').checkIns, history) && h('finalRepeat').status === 'final' && zero(at('finalRepeat').diff)
      && eq(h('final'), h('finalRepeat')),
    suggestOnlyInboxNoNewHabit: ['suggest1', 'suggest2', 'pending'].every(k => Object.keys(at(k).raw.habits).length === 1)
      && inbox('pending').length === 2 && inbox('pending').every(s => s.status === 'pending'),
    confirmOneDraftSameProjectLinked: Object.keys(at('confirm').raw.habits).length === 2
      && linkedDraft.status === 'draft' && linkedDraft.projectId === h('confirm').projectId && linkedDraft.okrId === okrId
      && linkedDraft.checkIns.length === 0 && linkedDraft.streak.totalDays === 0 && inbox('confirm')[0].confirmedHabitId === draftId,
    ignorePreservesFieldsNoRecord: eq(changes(inbox('pending')[0], inbox('ignore')[0]), ['confirmedHabitId', 'processedAt', 'status'])
      && eq(changes(inbox('pending')[1], inbox('ignore')[1]), ['ignoredAt', 'status'])
      && inbox('ignore')[1].status === 'ignored' && eq(at('confirm').raw.habits, at('ignore').raw.habits),
    repeatConfirmZeroWrite: zero(at('confirmRepeat').diff) && at('confirmRepeat').pairs[0].done.event.data.kind === 'error'
      && eq(inbox('ignore'), inbox('reopenInbox')),
    firstEditIsNewDraftNotF5: at('wrongEdit').actual.fields.some(f => f.value === linkedDraft.title)
      && !at('wrongEdit').actual.fields.some(f => f.value === 'F5习惯') && zero(at('wrongEdit').diff) && zero(at('wrongSelect').diff),
    foreignOkrReallyB: at('bAdd').raw.okrs[foreignId].projectId === 'p-0002'
      && at('bAdd').raw.okrs[foreignId].kind === 'objective' && h('bAdd').projectId === 'p-0001',
    crossRejectZeroWrite: zero(at('cross').diff) && eq(h('cross'), h('bAdd'))
      && at('cross').pairs[0].done.event.data.text === '关联目标不属于指定项目',
    unlinkOnlyRelationTime: eq(changes(h('cross'), h('unlink')), ['okrId', 'updatedAt']) && !('okrId' in h('unlink'))
      && !at('unlinkedPage').actual.pm.text.split('QA 采纳习惯草稿')[0].includes('关联 OKR'),
    realF5EditSelectionNoWrite: at('edit').actual.fields.some(f => f.value === 'F5习惯')
      && zero(at('edit').diff) && zero(at('select').diff) && eq(h('edit'), h('select')),
    mainSaveOnlyRelationTime: eq(changes(h('unlink'), h('save')), ['okrId', 'updatedAt'])
      && h('save').okrId === okrId && h('save').status === 'final' && eq(h('save').checkIns, history)
      && eq(at('save').raw.habits[draftId], linkedDraft),
    reopenCancelPreserveFullRecords: ['reopen', 'cancel'].every(k => zero(at(k).diff) && eq(at(k).raw, at('save').raw))
      && at('reopen').actual.fields.some(f => f.value === h('save').goal),
    allStepWritesAuxZero: successful.every(k => noAux(steps[k])),
    allChainGapsOnlySession: chainGaps.every(x => zero(Object.fromEntries(roots.filter(k => k !== 'data').map(k => [k, x.diff[k]])))
      && Object.keys(x.diff.data.added).length === 0 && Object.keys(x.diff.data.removed).length === 0
      && Object.keys(x.diff.data.changed).every(p => p === `/session_projcache/sessions/${sid}.json`)),
    unrelatedSettingsPreserved: ['pmExportAudit', 'pmExportSent'].every(id =>
      successful.every(k => eq(steps[k].raw.settings[id], at('future').raw.settings[id]))),
    oldFinalRawBridge: eq(json(join(old, 'habit-cancel-1792624035698/raw/habits', habitId + '.json')).record, h('future')),
  }
  const visualPaths = [
    'command-1792627408204/before-submit.png', 'command-1792627408204/actual.png',
    'pm-habit-1792627509634/actual.png', 'pm-habit-1792627598950/actual.png',
    'habit-confirm-1792627633171/actual.png', 'habit-ignore-1792627649060/actual.png',
    'habit-edit-1792627721162/actual.png', 'pm-habit-1792627878219/actual.png',
    'habit-edit-1792627906983/actual.png', 'habit-select-original-1792627914207/actual.png',
    'habit-save-1792627921818/actual.png', 'habit-edit-1792627947128/actual.png',
    'habit-confirm-1792627633171/frames/000003.jpg', 'habit-ignore-1792627649060/frames/000002.jpg',
    'host-open-1792627776097/frames/000003.jpg', 'habit-select-original-1792627914207/frames/000001.jpg',
    'command-1792627427738/before-submit.png', 'command-1792627469653/before-submit.png',
    'command-1792627862888/before-submit.png', 'pm-habit-1792627703623/actual.png',
    'habit-cancel-1792627954370/actual.png', 'habit-save-1792627921818/frames/000004.jpg',
  ]
  const result = { at: new Date().toISOString(), environment: { platform: process.platform, arch: process.arch, node: process.version, cwd: repo },
    assertions, failedAssertions: Object.keys(assertions).filter(k => !assertions[k]), candidateChecks,
    bindingPathCorrection: { declared: observations.sourceCandidate, actual: manifestPaths.A13, declaredExists: existsSync(join(repo, observations.sourceCandidate)) },
    loaded: { archive: loaded, clientBytes: client.length, clientSha: sha(client), segmentBytes: segment.length, segmentSha: sha(segment), checks: loadedChecks },
    index: { count: indexed.length, entries: indexed, unlisted }, frames,
    original: { count: priorIndexed.length, entries: priorIndexed, extras, oldSealFilesCount: Object.keys(oldSealFiles).length, oldDrift },
    steps, chainGaps, namedSteps: n,
    fieldDiffs: { final: changes(h('future'), h('final')), unlink: changes(h('cross'), h('unlink')), save: changes(h('unlink'), h('save')) },
    visual: visualPaths.map(p => ({ path: p, ...fp(join(root, p)) })),
    protectedBefore, protectedAfterDiff: delta(protectedBefore, capture()) }
  writeFileSync(prefix + '-audit' + suffix + '.json', JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify({ assertions: Object.keys(assertions).length, failed: result.failedAssertions,
    indices: { new: indexed.length, old: priorIndexed.length }, frames: frames.length, steps: stepNames.length,
    pairs: Object.values(steps).reduce((n, s) => n + s.pairs.length, 0), protected: Object.keys(protectedBefore).length,
    nonzeroChainGaps: chainGaps.filter(x => !zero(x.diff)).length, candidateChecks, fieldDiffs: result.fieldDiffs }, null, 2))
  process.exitCode = result.failedAssertions.length ? 1 : 0
}

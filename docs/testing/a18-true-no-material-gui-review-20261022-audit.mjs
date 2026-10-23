import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, lstatSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Audit archived bytes only; never import product modules or replay GUI commands.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a18-true-no-material-gui-review-20261022')
const reports = join(repo, 'reports/all-pending-evidence-20261021')
const root = join(reports, 'A18/no-material')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const stable = x => JSON.stringify(x, (_, v) => v && !Array.isArray(v) && typeof v === 'object'
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v)
const eq = (a, b) => stable(a) === stable(b)
const fp = p => {
  const s = lstatSync(p)
  if (!s.isFile()) throw Error(`Not a regular file: ${p}`)
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
const zero = d => Object.values(d).every(v => Object.keys(v).length === 0)
const roots = ['data', 'files', 'backups', 'exports']
const diffRoots = (a, b) => Object.fromEntries(roots.map(k => [k, delta(a[k], b[k])]))
const allZero = d => Object.values(d).every(zero)
const changedFields = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => !eq(a[k], b[k])).sort()
const manifestPaths = Object.fromEntries(['A13', 'A14', 'A16', 'A18'].map(n =>
  [n, join(reports, n, n === 'A13' ? 'candidate-final.json' : 'candidate.json')]))
const candidates = Object.fromEntries(Object.entries(manifestPaths).map(([n, p]) => [n, json(p)]))
const fixed = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-acceptance-register-20261021.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/a18-integration-more-gui-review-20261022.md',
  'docs/testing/a18-integration-more-gui-review-20261022-audit.mjs',
  'docs/testing/a18-integration-more-gui-review-20261022-audit.json',
  'docs/testing/a18-integration-more-gui-review-20261022-seal.json',
  'reports/all-pending-evidence-20261021/A18/product-tracked.patch',
  'reports/all-pending-evidence-20261021/A18/final/host-start.json',
  'reports/all-pending-evidence-20261021/A18/final/host-ready.json',
  'reports/all-pending-evidence-20261021/A18/final/environment.json',
].map(p => join(repo, p))
const protectedDirs = [root, join(reports, 'A18/final/loaded'), join(reports, 'A18/integration-more')]
const capture = () => {
  const out = {}
  for (const p of protectedDirs) scan(p, out)
  for (const p of [...fixed, ...Object.values(manifestPaths)]) out[p] = fp(p)
  for (const c of Object.values(candidates)) {
    scan(join(c.tree, 'packages/dsh-pm-tool/src'), out)
    scan(join(c.tree, 'packages/dsh-pm-tool/lib'), out)
    for (const p of new Set([...Object.keys(c.sourceHashes), ...Object.keys(c.artifacts)]))
      out[join(c.tree, p)] = fp(join(c.tree, p))
  }
  return out
}
const output = (suffix, data, exclusive = false) =>
  writeFileSync(prefix + suffix, JSON.stringify(data, null, 2) + '\n', exclusive ? { flag: 'wx' } : undefined)
const mode = process.argv[2]
if (mode === 'freeze') {
  const files = capture()
  output('-before.json', { at: new Date().toISOString(), files,
    excluded: 'Main working src/scripts/livingdocs, A19/A20 in-flight outputs, live data, dependencies, services and credentials' }, true)
  console.log(JSON.stringify({ mode, protectedCount: Object.keys(files).length }))
} else if (mode === 'seal') {
  const before = json(prefix + '-before.json').files, after = capture(), drift = delta(before, after)
  const audit = json(prefix + '-audit.json')
  const files = Object.fromEntries(readdirSync(dirname(prefix))
    .filter(n => n.startsWith(prefix.split('/').at(-1)) && !n.endsWith('-seal.json'))
    .map(n => [n, fp(join(dirname(prefix), n))]))
  const untouched = zero(drift)
  output('-seal.json', { at: new Date().toISOString(), protectedCount: Object.keys(before).length,
    drift, untouched, auditOk: audit.ok, deliverables: files, released: untouched && audit.ok,
    scope: 'Bounded archived-evidence review only; no global PASS, release or commit authorization' })
  console.log(JSON.stringify({ mode, untouched, auditOk: audit.ok, released: untouched && audit.ok, drift }))
  process.exitCode = untouched && audit.ok ? 0 : 1
} else if (mode === 'audit') {
  if (existsSync(prefix + '-audit.json') && !existsSync(prefix + '-audit-r1.json')) {
    const prior = json(prefix + '-audit.json')
    if (!prior.ok) output('-audit-r1.json', prior, true)
  }
  const before = json(prefix + '-before.json').files
  const assertions = {}
  const check = (name, value) => { assertions[name] = !!value }
  const candidateChecks = Object.fromEntries(Object.entries(candidates).map(([n, c]) => [n, {
    baseline: c.baseline, hostGitHead: c.hostGitHead, tree: c.tree, manifest: fp(manifestPaths[n]),
    sourceCount: Object.keys(c.sourceHashes).length, artifactCount: Object.keys(c.artifacts).length,
    sourceMismatch: Object.entries(c.sourceHashes).filter(([p, h]) => fp(join(c.tree, p)).sha256 !== h).map(([p]) => p),
    artifactMismatch: Object.entries(c.artifacts).filter(([p, h]) => fp(join(c.tree, p)).sha256 !== h).map(([p]) => p),
    scope: n === 'A18' ? 'tested candidate' : 'protection only; not retested',
  }]))
  check('allDeclaredFrozenBytesMatch', Object.values(candidateChecks)
    .every(c => !c.sourceMismatch.length && !c.artifactMismatch.length))
  check('A18Source520Artifacts453', candidateChecks.A18.sourceCount === 520 && candidateChecks.A18.artifactCount === 453)
  check('A18PatchMatches', sha(readFileSync(join(reports, 'A18/product-tracked.patch'))) === candidates.A18.trackedPatchSha)
  const client = readFileSync(join(candidates.A18.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const loadedRoot = join(reports, 'A18/final/loaded'), loaded = json(join(loadedRoot, 'result.json'))
  const loadedChecks = loaded.events.map(e => {
    const b = readFileSync(join(loadedRoot, e.file)), first = b.indexOf(segment), second = b.indexOf(segment, first + 1)
    return { bytes: b.length, sha256: sha(b), first, second, segmentBytes: segment.length, segmentSha: sha(segment),
      matches: b.length === e.bytes && sha(b) === e.responseSha && e.status === 200 && e.fromDiskCache === false
        && first >= 0 && second === -1 && e.frameId === loaded.targetId
        && e.matches.some(m => m.sourceSha === sha(client) && m.segmentSha === sha(segment)
          && m.segmentBytes === segment.length && m.first === first && m.second === second && m.uniqueComplete) }
  })
  const start = json(join(reports, 'A18/final/host-start.json')), ready = json(join(reports, 'A18/final/host-ready.json'))
  check('A18Host3248PID63429', start.pid === 63429 && ready.pid === start.pid && ready.port === 3248 && ready.ready
    && start.argv.at(-1) === '3248' && start.plugin === join(candidates.A18.tree, 'packages/dsh-pm-tool'))
  check('fullLoadedTargetAndTimeOrigin', loaded.targetId === 'BA817F66FCE81BD58357C4B50BFFDF2C'
    && loaded.state.origin === 'http://127.0.0.1:3248' && loaded.state.timeOrigin === 1792629512672.7
    && loadedChecks.length === 1 && loadedChecks.every(x => x.matches))
  const index = json(join(root, 'index.json')), listed = Object.keys(index.files)
  const all = Object.keys(scan(root)).map(p => p.slice(root.length + 1))
  const indexMismatches = listed.filter(p => {
    const f = fp(join(root, p)), expected = index.files[p]
    return f.bytes !== expected.bytes || f.sha256 !== expected.sha256
  })
  const unlisted = all.filter(p => p !== 'index.json' && !(p in index.files))
  check('sealed482NoMissingExtraOrModified', listed.length === 482 && !indexMismatches.length && !unlisted.length)
  const frameChecks = listed.filter(p => p.endsWith('/frames/frames.json')).flatMap(p =>
    json(join(root, p)).frames.map(f => ({ manifest: p, path: join(dirname(p), f.file),
      at: f.at, metadata: f.metadata, matches: fp(join(root, dirname(p), f.file)).sha256 === f.sha256 })))
  check('framesCompleteHashOnlyNotAllVisual', frameChecks.every(f => f.matches)
    && listed.filter(p => p.endsWith('.jpg')).every(p => frameChecks.some(f => f.path === p)))
  const observations = json(join(root, 'observations.json'))
  const names = readdirSync(root).filter(n => existsSync(join(root, n, 'exit.json')))
    .sort((a, b) => Number(a.split('-').at(-1)) - Number(b.split('-').at(-1)))
  const steps = names.map(n => {
    const read = p => json(join(root, n, p))
    const s = { name: n, exit: read('exit.json'), commands: read('commands.json'), requests: read('requests.json'),
      console: read('console.json'), host: read('host-state.json'), actual: read('actual.json'),
      before: read('before-roots.json'), after: read('after-roots.json') }
    s.diff = diffRoots(s.before, s.after)
    s.raw = Object.fromEntries(readdirSync(join(root, n, 'raw')).map(t => [t,
      Object.fromEntries(readdirSync(join(root, n, 'raw', t)).map(p => [p.replace(/\.json$/, ''), read(`raw/${t}/${p}`).record]))]))
    s.rawMismatches = Object.keys(s.raw).flatMap(t => readdirSync(join(root, n, 'raw', t))
      .filter(p => fp(join(root, n, 'raw', t, p)).sha256 !== s.after.data[`/pmtool/${t}/${p}`]).map(p => `${t}/${p}`))
    const row = observations.rows.find(r => r.step === n)
    s.observationMatches = !!row && eq(s.exit, row.exit) && eq(s.commands, row.events) && eq(s.diff, row.diff)
    s.pairs = s.commands.filter(x => x.event.type === 'command/run').map(r => {
      const run = r.event, done = s.commands.find(x =>
        x.event.type === 'command/done' && x.event.data.commandId === run.data.commandId)?.event
      const line = `/pm${run.data.args}`, request = s.requests.find(x => x.body?.payload?.args?.line === line)
      return { line, commandId: run.data.commandId, runTime: run.time, doneTime: done?.time,
        kind: done?.data.kind, text: done?.data.text, agentId: request?.body.payload.args.agentId,
        valid: !!done && !!request && run.data.name === 'pm' && run.data.source.kind === 'user'
          && request.path === '/api/commands/execute' && request.body.type === 'client-request'
          && request.body.method === 'commands/execute' && eq(request.body.payload.args.submittedAttachments, [])
          && done.seq > run.seq && done.time >= run.time }
    })
    return s
  })
  check('tenExitZeroAreCollectionOnly', steps.length === 10 && steps.every(s => s.exit.exit === 0))
  check('observationsAllRecomputed', observations.rows.length === 10 && steps.every(s => s.observationMatches))
  check('allRawHashesEqualCapturedPostManifest', steps.every(s => !s.rawMismatches.length))
  check('sameObservedOriginAndTimeOrigin', steps.every(s => s.actual.origin === loaded.state.origin
    && s.actual.timeOrigin === loaded.state.timeOrigin && s.host.origin === s.actual.origin && s.host.timeOrigin === s.actual.timeOrigin))
  const pairs = steps.flatMap(s => s.pairs)
  check('sevenRealPOSTUserRunDonePairs', pairs.length === 7 && pairs.every(p =>
    p.valid && p.kind === 'success' && p.agentId === 'session-04548dcf-b6ba-4259-a7ad-e7957eb0593f'))
  const get = name => steps.find(s => s.name === name)
  const add = get('command-1792631369987'), done = get('command-1792631405292')
  const reflect = get('command-1792631409390'), repeat = get('command-1792631412477')
  const reflect2 = get('command-1792631415555'), inspect = get('command-1792631418625')
  const nav = get('pm-nav-1792631435831'), open = get('check-target-1792631481031'), close = get('task-close-1792631498578')
  const taskPath = '/pmtool/tasks/t-0008.json', refId = 'ref-mviugfb6-ybnnwx'
  const refPath = `/pmtool/reflections/${refId}.json`, task = add.raw.tasks['t-0008'], draft = done.raw.reflections[refId]
  const gap = '\u5f85\u8865\uff1a\u4ea4\u4ed8\u9a8c\u6536\u6750\u6599\u4e0e\u8bc1\u636e\u94fe\u63a5'
  const absentMaterials = t => ['attachments', 'progressLog', 'checklist'].every(k => t[k] == null || (Array.isArray(t[k]) && !t[k].length))
    && ['deliverableId', 'evidenceUrl'].every(k => t[k] == null || t[k] === '')
  check('newTaskRealAddNoMaterialOrHandwrittenFixture', !(taskPath in add.before.data)
    && eq(Object.keys(add.diff.data.added), [taskPath]) && zero({ removed: add.diff.data.removed, changed: add.diff.data.changed })
    && add.pairs[0].line === add.exit.line && task.status === 'todo' && absentMaterials(task)
    && eq(Object.keys(JSON.parse(add.pairs[0].line.slice('/pm task add '.length))).sort(), ['dueDate', 'projectId', 'startDate', 'title']))
  check('allTaskSnapshotsTrulyMaterialFree', steps.filter(s => s.raw.tasks['t-0008']).every(s => absentMaterials(s.raw.tasks['t-0008'])))
  check('firstDoneCreatesExactlyNewTaskDoneDraft', !(refPath in done.before.data)
    && eq(Object.keys(done.diff.data.added), [refPath]) && eq(Object.keys(done.diff.data.changed), [taskPath])
    && !Object.keys(done.diff.data.removed).length && draft.taskId === 't-0008' && draft.projectId === 'p-0001'
    && draft.status === 'draft' && draft.sourceEvent === 'task-done')
  check('newTimestampNotOldReflection', task.createdAt === '2026-10-22T01:09:31.815Z'
    && draft.createdAt === '2026-10-22T01:10:08.514Z' && draft.updatedAt === draft.createdAt && draft.draft.at === draft.createdAt
    && Date.parse(draft.createdAt) >= done.pairs[0].runTime && Date.parse(draft.createdAt) <= done.pairs[0].doneTime)
  check('gapHonestKnownOnlyNoInventedAcceptance', eq(draft.draft.gaps, [gap])
    && draft.draft.lines.length === 1 && draft.draft.lines[0].mark === 'known'
    && draft.draft.lines[0].text === '\u5b8c\u6210\u65f6\u523b 2026-10-22')
  check('ordinaryFieldsPreservedOnDone', eq(changedFields(task, done.raw.tasks['t-0008']), ['completedDate', 'status', 'updatedAt'])
    && done.raw.tasks['t-0008'].status === 'done' && done.raw.tasks['t-0008'].progress === 0
    && done.raw.tasks['t-0008'].completedDate === '2026-10-22')
  check('repeatDoneOnlyTaskUpdatedAtNotEntireStepZero', eq(changedFields(done.raw.tasks['t-0008'], repeat.raw.tasks['t-0008']), ['updatedAt'])
    && eq(Object.keys(repeat.diff.data.changed), [taskPath]) && !Object.keys(repeat.diff.data.added).length
    && !Object.keys(repeat.diff.data.removed).length)
  check('reflectionOriginal596BytesUnchangedThroughEnd', steps.filter(s => s.raw.reflections[refId]).every(s =>
    eq(s.raw.reflections[refId], draft) && s.after.data[refPath] === done.after.data[refPath])
    && fp(join(root, done.name, 'raw/reflections', `${refId}.json`)).bytes === 596)
  const fenced = text => JSON.parse(text.split('```json\n')[1].split('\n```')[0])
  check('twoReflectionReadsIdenticalRawAndOutput', eq(fenced(reflect.pairs[0].text), draft)
    && eq(fenced(reflect2.pairs[0].text), draft) && reflect.pairs[0].text === reflect2.pairs[0].text)
  const findings = fenced(inspect.pairs[0].text)
  check('checkExactlyOneActualTargetOnly', findings.length === 1 && findings[0].rule === 'done-missing-materials'
    && findings[0].taskId === task.id && findings[0].title === task.title)
  check('checkHumanDecisionAndNoStatusRuling', inspect.pairs[0].text.includes('\u6700\u7ec8\u9a8c\u6536\u7531\u4eba\u5224\u65ad')
    && inspect.pairs[0].text.includes('\u672a\u8986\u76d6\u2260\u672a\u5b8c\u6210'))
  check('reflectCheckNavigationOpenCancelAllFourRootsZero', [reflect, reflect2, inspect, nav, open, close].every(s => allZero(s.diff)))
  check('allFilesBackupsExportsUnchanged', steps.every(s => ['files', 'backups', 'exports'].every(k => zero(s.diff[k]))))
  check('oldFileTaskNotRelabelledEmpty', steps.every(s => s.raw.tasks['t-0003'].attachments.length === 1
    && s.raw.tasks['t-0003'].attachments[0].kind === 'file' && s.raw.tasks['t-0003'].attachments[0].assetId === 'fa-0001'))
  const oldRef = 'ref-mvi5z85j-yk04ji'
  const sessionCache = '/session_projcache/sessions/session-04548dcf-b6ba-4259-a7ad-e7957eb0593f.json'
  const business = data => Object.fromEntries(Object.entries(data).filter(([p]) => p !== sessionCache))
  check('oldReflectionAndOtherDataPreserved', steps.every(s => eq(s.raw.reflections[oldRef], add.raw.reflections[oldRef]))
    && eq(Object.keys(delta(business(steps[0].before.data), business(close.after.data)).changed), [])
    && eq(Object.keys(delta(business(steps[0].before.data), business(close.after.data)).added).sort(), [refPath, taskPath].sort())
    && !Object.keys(delta(business(steps[0].before.data), business(close.after.data)).removed).length)
  check('sevenPMTasksSnapshotContainsTrueT8', nav.pairs[0].line === '/pm web snapshot'
    && eq(fenced(reflect.pairs[0].text).taskId, JSON.parse(nav.pairs[0].text).tasks.find(t => t.id === task.id).id)
    && nav.actual.pm.text.includes('\u0031 \u6761\u63d0\u793a') && nav.actual.pm.text.includes(task.title))
  check('actualCheckTargetSameTaskTitleStatusAndDates', open.actual.fields.some(f => f.name === 'title' && f.value === task.title)
    && open.actual.fields.some(f => f.name === 'status' && f.value === 'done')
    && open.actual.fields.some(f => f.name === 'startDate' && f.value === task.startDate)
    && open.actual.fields.some(f => f.name === 'dueDate' && f.value === task.dueDate))
  check('cancelLeavesNoTaskFormAndSameCheckCard', !close.actual.fields.some(f => f.name === 'title')
    && close.actual.pm.text.includes(task.title) && eq(open.after, close.after))
  const bridges = steps.slice(1).map((s, i) => ({ beforeStep: steps[i].name, afterStep: s.name,
    diff: diffRoots(steps[i].after, s.before) }))
  check('interstepBusinessZeroOnlySameSessionCacheMayChange', bridges.every(b =>
    !Object.keys(b.diff.data.added).length && !Object.keys(b.diff.data.removed).length
    && Object.keys(b.diff.data.changed).every(p => p === sessionCache)
    && ['files', 'backups', 'exports'].every(k => zero(b.diff[k]))))
  check('noConsoleErrorsRecorded', steps.every(s => !s.console.some(c => ['error', 'pageerror'].includes(c.type))))
  check('heroNotInventedVisibleReflection', [add, done, reflect, repeat, reflect2, inspect].every(s => !s.host.cards.length && !s.actual.pm.text))
  const visual = [
    ['command-1792631369987/before-submit.png', 'Viewed: actual add command, no handwritten material fields.'],
    ['command-1792631405292/before-submit.png', 'Viewed: actual t8 done input.'],
    ['command-1792631409390/actual.png', 'Viewed: empty hero after reflect; no reflection output claimed visible.'],
    ['pm-nav-1792631435831/actual.png', 'Viewed: actual check card, one t8 finding, human-decision wording.'],
    ['check-target-1792631481031/actual.png', 'Viewed: same-title done drawer and original dates/progress.'],
    ['task-close-1792631498578/actual.png', 'Viewed: drawer gone, original one-finding check card remains.'],
    ['check-target-1792631481031/frames/000000.jpg', 'Viewed: compositor before click, same actual check card.'],
    ['check-target-1792631481031/frames/000004.jpg', 'Viewed: compositor after click, same-title done drawer.'],
    ['task-close-1792631498578/frames/000004.jpg', 'Viewed: compositor after cancel, original card restored.'],
  ].map(([path, observation]) => ({ path, observation, ...fp(join(root, path)) }))
  const after = capture(), drift = delta(before, after)
  check('protectedBytesAndMtimeUnchanged', zero(drift))
  const result = { at: new Date().toISOString(), environment: { os: process.platform, arch: process.arch, node: process.version },
    ok: Object.values(assertions).every(Boolean), assertions, candidateChecks, loadedChecks,
    identity: { targetId: loaded.targetId, origin: loaded.state.origin, timeOrigin: loaded.state.timeOrigin, pid: start.pid },
    index: { ...fp(join(root, 'index.json')), count: listed.length, indexMismatches, unlisted },
    observations: fp(join(root, 'observations.json')), frameCount: frameChecks.length, frameChecks,
    stepCount: steps.length, pairs, steps: steps.map(s => ({ name: s.name, exit: s.exit.exit,
      diff: s.diff, rawMismatches: s.rawMismatches, observationMatches: s.observationMatches })),
    bridges, task, draft, findings, visual, protectedCount: Object.keys(before).length, drift,
    boundedVerdict: { noMaterialGapAndRepeatReflection: 'PASS (only this new t8 slice)',
      singleCheckReadonlyReachableTarget: 'PASS (only this one finding)', fullP0007: 'NOT_PASSED',
      fullP0008: 'NOT_PASSED', fileCountDefect: 'prior FAIL retained; not rerun', release: 'NOT_PASSED' },
    excluded: 'No final/edit/restart/failure-hook/five-rule or viewport matrix claims; no product execution or Main working-source freeze' }
  output('-audit.json', result)
  console.log(JSON.stringify({ ok: result.ok, assertions: Object.keys(assertions).length,
    failed: Object.keys(assertions).filter(k => !assertions[k]), indexed: listed.length,
    frames: frameChecks.length, steps: steps.length, pairs: pairs.length, protectedCount: result.protectedCount, drift }))
  process.exitCode = result.ok ? 0 : 1
} else throw Error('Expected freeze, audit or seal')

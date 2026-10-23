import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Only audit archived evidence; never import product code or replay commands.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a18-check-five-gui-review-20261022')
const evidence = join(repo, 'reports/all-pending-evidence-20261021')
const root = join(evidence, 'A18/check-five')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const stable = x => JSON.stringify(x, (_, v) => v && !Array.isArray(v) && typeof v === 'object'
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v)
const same = (a, b) => stable(a) === stable(b)
const fingerprint = p => {
  const stat = lstatSync(p)
  if (!stat.isFile()) throw Error(`Not a regular file: ${p}`)
  const bytes = readFileSync(p)
  return { bytes: bytes.length, sha256: sha(bytes), mtimeMs: stat.mtimeMs }
}
const scan = (p, out = {}) => {
  if (lstatSync(p).isDirectory()) for (const n of readdirSync(p).sort()) scan(join(p, n), out)
  else out[p] = fingerprint(p)
  return out
}
const delta = (a, b) => ({
  added: Object.fromEntries(Object.keys(b).filter(k => !(k in a)).map(k => [k, b[k]])),
  removed: Object.fromEntries(Object.keys(a).filter(k => !(k in b)).map(k => [k, a[k]])),
  changed: Object.fromEntries(Object.keys(a).filter(k => k in b && !same(a[k], b[k]))
    .map(k => [k, { before: a[k], after: b[k] }])),
})
const zero = d => Object.values(d).every(v => !Object.keys(v).length)
const rootNames = ['data', 'files', 'backups', 'exports']
const rootDelta = (a, b) => Object.fromEntries(rootNames.map(k => [k, delta(a[k], b[k])]))
const zeroRoots = d => Object.values(d).every(zero)
const cache = '/session_projcache/sessions/session-04548dcf-b6ba-4259-a7ad-e7957eb0593f.json'
const business = data => Object.fromEntries(Object.entries(data).filter(([p]) => p !== cache))
const businessDelta = (a, b) => rootDelta({ ...a, data: business(a.data) }, { ...b, data: business(b.data) })
const fieldsChanged = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => !same(a[k], b[k])).sort()
const manifests = Object.fromEntries(['A13', 'A14', 'A16', 'A18'].map(n =>
  [n, join(evidence, n, n === 'A13' ? 'candidate-final.json' : 'candidate.json')]))
const candidates = Object.fromEntries(Object.entries(manifests).map(([n, p]) => [n, read(p)]))
const candidate = candidates.A18
const fixed = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-acceptance-register-20261021.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/governance-growth-independent-auto-20261021-gui-handoff.md',
  'docs/testing/a18-integration-more-gui-review-20261022.md',
  'docs/testing/a18-feedback-context-independent-retest-20261022.md',
  'reports/all-pending-evidence-20261021/A18/source-auto-handoff.json',
  'reports/all-pending-evidence-20261021/A18/product-tracked.patch',
  'reports/all-pending-evidence-20261021/A18/final/host-start.json',
  'reports/all-pending-evidence-20261021/A18/final/host-ready.json',
  'reports/all-pending-evidence-20261021/A18/final/environment.json',
].map(p => join(repo, p))
const protectedDirs = [root, join(evidence, 'A18/no-material'), join(evidence, 'A18/final/loaded')]
const capture = () => {
  const out = {}
  for (const p of protectedDirs) scan(p, out)
  for (const p of [...fixed, ...Object.values(manifests)]) out[p] = fingerprint(p)
  for (const n of readdirSync(join(repo, 'docs/testing')).filter(n =>
    n.startsWith('a18-true-no-material-gui-review-20261022'))) {
    out[join(repo, 'docs/testing', n)] = fingerprint(join(repo, 'docs/testing', n))
  }
  for (const c of Object.values(candidates)) scan(join(c.tree, 'packages/dsh-pm-tool/lib'), out)
  scan(join(candidate.tree, 'packages/dsh-pm-tool/src'), out)
  for (const p of new Set([...Object.keys(candidate.sourceHashes), ...Object.keys(candidate.artifacts)])) {
    out[join(candidate.tree, p)] = fingerprint(join(candidate.tree, p))
  }
  return out
}
const save = (suffix, value) => writeFileSync(prefix + suffix, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const mode = process.argv[2]
const round = process.argv[3]
if (round && !/^r[1-9][0-9]*$/.test(round)) throw Error('Invalid own audit round')
const auditSuffix = round ? `-audit-${round}.json` : '-audit.json'
if (mode === 'freeze') {
  const files = capture()
  save('-before.json', { at: new Date().toISOString(), files,
    scope: 'A18 declared source/artifacts, old isolated libs, original evidence and referenced testing only',
    excluded: 'Main src/scripts/livingdocs, A19 habit/A20 dynamic work, live data/services/profile/credentials/dependencies' })
  console.log(JSON.stringify({ mode, protectedCount: Object.keys(files).length }))
} else if (mode === 'audit') {
  const assertions = {}
  const check = (name, value) => { assertions[name] = !!value }
  const declared = {
    manifest: fingerprint(manifests.A18), baseline: candidate.baseline, hostGitHead: candidate.hostGitHead,
    tree: candidate.tree, sourceCount: Object.keys(candidate.sourceHashes).length,
    artifactCount: Object.keys(candidate.artifacts).length,
    sourceMismatch: Object.entries(candidate.sourceHashes).filter(([p, h]) =>
      fingerprint(join(candidate.tree, p)).sha256 !== h).map(([p]) => p),
    artifactMismatch: Object.entries(candidate.artifacts).filter(([p, h]) =>
      fingerprint(join(candidate.tree, p)).sha256 !== h).map(([p]) => p),
  }
  check('A18Declared520Source453ArtifactsMatch', declared.sourceCount === 520 && declared.artifactCount === 453
    && !declared.sourceMismatch.length && !declared.artifactMismatch.length)
  check('trackedPatchBytesMatch', sha(readFileSync(join(evidence, 'A18/product-tracked.patch'))) === candidate.trackedPatchSha)
  const handoff = read(join(evidence, 'A18/source-auto-handoff.json'))
  check('signedSourceAutoExactReportHashLimitedOnly', handoff.limitedSourceAuto === 'PASS'
    && fingerprint(join(repo, handoff.independentReport)).sha256 === handoff.independentReportSHA
    && handoff.wholeGate === 'NOT_PASSED' && handoff.commit === false && handoff.push === false)
  const client = readFileSync(join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const loadedRoot = join(evidence, 'A18/final/loaded')
  const loaded = read(join(loadedRoot, 'result.json'))
  const loadedChecks = loaded.events.map(e => {
    const bytes = readFileSync(join(loadedRoot, e.file))
    const first = bytes.indexOf(segment), second = bytes.indexOf(segment, first + 1)
    return { bytes: bytes.length, sha256: sha(bytes), first, second,
      segmentBytes: segment.length, segmentSha: sha(segment),
      match: bytes.length === e.bytes && sha(bytes) === e.responseSha && e.status === 200 && e.fromDiskCache === false
        && e.frameId === loaded.targetId && first >= 0 && second === -1
        && e.matches.some(m => m.sourceSha === sha(client) && m.segmentSha === sha(segment)
          && m.segmentBytes === segment.length && m.first === first && m.second === second && m.uniqueComplete) }
  })
  const start = read(join(evidence, 'A18/final/host-start.json'))
  const ready = read(join(evidence, 'A18/final/host-ready.json'))
  check('archivedHost3248PID63429', start.pid === 63429 && ready.pid === start.pid
    && ready.port === 3248 && ready.ready && start.argv.at(-1) === '3248'
    && start.plugin === join(candidate.tree, 'packages/dsh-pm-tool'))
  check('fullLoadedBA817TimeOrigin', loaded.targetId === 'BA817F66FCE81BD58357C4B50BFFDF2C'
    && loaded.state.origin === 'http://127.0.0.1:3248' && loaded.state.timeOrigin === 1792629512672.7
    && loadedChecks.length === 1 && loadedChecks.every(e => e.match))
  const index = read(join(root, 'index.json')), listed = Object.keys(index.files)
  const indexedMismatches = listed.filter(p => {
    const f = fingerprint(join(root, p))
    return f.bytes !== index.files[p].bytes || f.sha256 !== index.files[p].sha256
  })
  const actualPaths = Object.keys(scan(root)).map(p => p.slice(root.length + 1))
  const unlisted = actualPaths.filter(p => p !== 'index.json' && !(p in index.files))
  check('1628OriginalIndexBytesShaNoExtra', listed.length === 1628 && !indexedMismatches.length && !unlisted.length)
  const frames = listed.filter(p => p.endsWith('/frames/frames.json')).flatMap(p =>
    read(join(root, p)).frames.map(f => {
      const path = join(dirname(p), f.file)
      return { path, at: f.at, metadata: f.metadata,
        match: listed.includes(path) && fingerprint(join(root, path)).sha256 === f.sha256 }
    }))
  check('all796FrameHashesCompleteNotAllVisual', frames.length === 796 && frames.every(f => f.match)
    && listed.filter(p => p.endsWith('.jpg')).every(p => frames.some(f => f.path === p)))
  const observations = read(join(root, 'observations.json'))
  const names = readdirSync(root).filter(n => existsSync(join(root, n, 'exit.json')))
    .sort((a, b) => Number(a.split('-').at(-1)) - Number(b.split('-').at(-1)))
  const steps = names.map(name => {
    const get = p => read(join(root, name, p))
    const step = { name, exit: get('exit.json'), events: get('commands.json'), requests: get('requests.json'),
      console: get('console.json'), host: get('host-state.json'), actual: get('actual.json'),
      before: get('before-roots.json'), after: get('after-roots.json') }
    step.diff = rootDelta(step.before, step.after)
    step.raw = Object.fromEntries(readdirSync(join(root, name, 'raw')).map(t => [t,
      Object.fromEntries(readdirSync(join(root, name, 'raw', t)).map(p =>
        [p.replace(/\.json$/, ''), get(`raw/${t}/${p}`).record]))]))
    step.rawMismatch = Object.keys(step.raw).flatMap(t => readdirSync(join(root, name, 'raw', t))
      .filter(p => fingerprint(join(root, name, 'raw', t, p)).sha256 !== step.after.data[`/pmtool/${t}/${p}`])
      .map(p => `${t}/${p}`))
    const row = observations.rows.find(r => r.step === name)
    step.observationMatch = !!row && same(row.exit, step.exit) && same(row.events, step.events) && same(row.diff, step.diff)
    step.pairs = step.events.filter(x => x.event.type === 'command/run').map(r => {
      const run = r.event
      const done = step.events.find(x => x.event.type === 'command/done'
        && x.event.data.commandId === run.data.commandId)?.event
      const line = `/pm${run.data.args}`
      const request = step.requests.find(x => x.body?.payload?.args?.line === line)
      return { line, commandId: run.data.commandId, runTime: run.time, doneTime: done?.time,
        kind: done?.data.kind, text: done?.data.text,
        valid: !!done && !!request && run.data.name === 'pm' && run.data.source.kind === 'user'
          && request.path === '/api/commands/execute' && request.body.type === 'client-request'
          && request.body.method === 'commands/execute'
          && request.body.payload.args.agentId === 'session-04548dcf-b6ba-4259-a7ad-e7957eb0593f'
          && same(request.body.payload.args.submittedAttachments, []) && done.seq > run.seq && done.time >= run.time }
    })
    return step
  })
  const byAction = action => steps.filter(s => s.exit.action === action)
  const commands = byAction('command'), opens = byAction('check-target'), closes = byAction('task-close')
  const inspect = commands.find(s => s.exit.line === '/pm check p-0001')
  const nav = byAction('pm-nav')[0], first = steps[0], last = steps.at(-1)
  const pairs = steps.flatMap(s => s.pairs)
  const add = commands.filter(s => s.exit.line.startsWith('/pm task add '))
  const checklistAdds = commands.filter(s => s.exit.line.startsWith('/pm task checklist add '))
  const toggles = commands.filter(s => s.exit.line.startsWith('/pm task checklist toggle '))
  const done = commands.find(s => s.exit.line === '/pm task update t-0012 {"status":"done"}')
  const bridges = steps.slice(1).map((s, i) => ({
    from: steps[i].name, to: s.name, diff: rootDelta(steps[i].after, s.before),
    businessZero: zeroRoots(businessDelta(steps[i].after, s.before)),
  }))
  const summaryCounts = { steps: steps.length, taskAdd: add.length, checklistAdd: checklistAdds.length,
    toggle: toggles.length, statusDone: done ? 1 : 0, projectCheck: inspect ? 1 : 0,
    open: opens.length, cancel: closes.length, hostOpen: byAction('host-open').length,
    pmNavigation: byAction('pm-nav').length, requestPairs: pairs.length, bridges: bridges.length }
  check('25ExitZeroCollectionOnly', steps.length === 25 && steps.every(s => s.exit.exit === 0))
  check('exactActionCountsFromOriginal', same(summaryCounts, { steps: 25, taskAdd: 4, checklistAdd: 5,
    toggle: 2, statusDone: 1, projectCheck: 1, open: 5, cancel: 5, hostOpen: 1, pmNavigation: 1,
    requestPairs: 14, bridges: 24 }))
  check('observationsAll25Recomputed', observations.rows.length === 25 && steps.every(s => s.observationMatch))
  check('allRawActualBytesEqualPostRootHashes', steps.every(s => !s.rawMismatch.length))
  check('all25OriginTimeOriginSameLoadedContext', steps.every(s => s.actual.origin === loaded.state.origin
    && s.actual.timeOrigin === loaded.state.timeOrigin && s.host.origin === loaded.state.origin
    && s.host.timeOrigin === loaded.state.timeOrigin))
  check('14RealPOSTUserRunSameIdSuccessDone', pairs.length === 14 && pairs.every(p => p.valid && p.kind === 'success')
    && steps.every(s => s.requests.length === s.pairs.length
      && s.events.length === s.pairs.length * 2) && commands.every(s => s.pairs[0].line === s.exit.line))
  const inputs = add.map(s => ({ step: s.name, line: s.exit.line,
    input: JSON.parse(s.exit.line.slice('/pm task add '.length)),
    added: Object.keys(s.diff.data.added).filter(p => p.startsWith('/pmtool/')) }))
  const ids = ['t-0009', 't-0010', 't-0011', 't-0012']
  check('fourTasksRealNewProductionInputs', inputs.every((a, i) =>
    same(a.added, [`/pmtool/tasks/${ids[i]}.json`]) && !(`/pmtool/tasks/${ids[i]}.json` in add[i].before.data)
    && a.input.projectId === 'p-0001' && add[i].raw.tasks[ids[i]].title === a.input.title
    && add[i].raw.tasks[ids[i]].status === 'todo'
    && Object.keys(add[i].diff.data.changed).every(p => p === cache)
    && !Object.keys(add[i].diff.data.removed).length))
  const finalTasks = Object.fromEntries(['t-0008', ...ids].map(id => [id, last.raw.tasks[id]]))
  check('realTodayDatesDminus1Dplus2And100Todo', finalTasks['t-0009'].dueDate === '2026-10-21'
    && finalTasks['t-0010'].dueDate === '2026-10-24'
    && finalTasks['t-0009'].status === 'todo' && finalTasks['t-0010'].status === 'todo'
    && finalTasks['t-0011'].progress === 100 && finalTasks['t-0011'].status === 'todo')
  const checklist = finalTasks['t-0012'].checklist
  check('fiveStableChecklistIDsTextsAppendOnly', checklist.length === 5 && new Set(checklist.map(c => c.id)).size === 5
    && same(checklist.map(c => c.text), ['需求核对', '方案核对', '实现核对', '测试核对', '交付核对'])
    && checklistAdds.every((s, i) => s.raw.tasks['t-0012'].checklist.length === i + 1
      && same(s.raw.tasks['t-0012'].checklist, checklist.slice(0, i + 1).map(c => ({ ...c, done: false })))))
  check('twoExplicitTrueTogglesOnlyMatchingItemChanged', toggles.length === 2 && toggles.every((s, i) => {
    const previous = steps[steps.indexOf(s) - 1].raw.tasks['t-0012']
    const current = s.raw.tasks['t-0012']
    return s.exit.line === `/pm task checklist toggle t-0012 ${checklist[i].id} true`
      && same(fieldsChanged(previous, current), ['checklist', 'updatedAt'])
      && same(current.checklist, previous.checklist.map(c => c.id === checklist[i].id ? { ...c, done: true } : c))
      && current.status === 'todo' && current.progress === 0
  }))
  const beforeDone = steps[steps.indexOf(done) - 1].raw.tasks['t-0012'], afterDone = done.raw.tasks['t-0012']
  check('doneExplicitOnlyStatusDateTimeNotChecklistOrProgress', same(fieldsChanged(beforeDone, afterDone),
    ['completedDate', 'status', 'updatedAt']) && afterDone.status === 'done' && afterDone.progress === 0
    && afterDone.completedDate === '2026-10-22' && same(afterDone.checklist.map(c => c.done), [true, true, false, false, false]))
  const freshRefPath = '/pmtool/reflections/ref-mviuuk58-6z5qvo.json'
  check('statusWriteCreatesReflectionNotZeroWrite', same(Object.keys(done.diff.data.added), [freshRefPath])
    && same(Object.keys(done.diff.data.changed).filter(p => p !== cache), ['/pmtool/tasks/t-0012.json'])
    && done.raw.reflections['ref-mviuuk58-6z5qvo'].sourceEvent === 'task-done'
    && done.raw.reflections['ref-mviuuk58-6z5qvo'].taskId === 't-0012'
    && done.raw.reflections['ref-mviuuk58-6z5qvo'].status === 'draft')
  const oldT8 = read(join(evidence, 'A18/no-material/task-close-1792631498578/raw/tasks/t-0008.json')).record
  const noMaterials = task => ['attachments', 'progressLog', 'checklist'].every(k =>
    task[k] == null || (Array.isArray(task[k]) && !task[k].length))
    && ['evidenceUrl', 'deliverableId'].every(k => task[k] == null || task[k] === '')
  check('trueT8MatchesPriorWholeRecordAndStaysEmpty', same(oldT8, finalTasks['t-0008'])
    && steps.every(s => same(s.raw.tasks['t-0008'], oldT8)) && noMaterials(oldT8))
  check('newTaskMaterialsAbsentExceptOriginalChecklist', ids.every(id =>
    ['attachments', 'progressLog', 'evidenceUrl', 'deliverableId', 'manualProgress'].every(k => !(k in finalTasks[id])))
    && ids.slice(0, 3).every(id => !('checklist' in finalTasks[id])))
  check('otherBusinessOriginalBytesUnchangedWholeRun', (() => {
    const d = delta(business(first.before.data), business(last.after.data))
    return !Object.keys(d.changed).length && !Object.keys(d.removed).length
      && same(Object.keys(d.added).sort(), [...ids.map(id => `/pmtool/tasks/${id}.json`), freshRefPath].sort())
  })())
  check('13ReadonlyStepsBusinessZeroCacheOnlyAllowed', steps.filter(s =>
    !commands.includes(s) || s === inspect).every(s => zeroRoots(businessDelta(s.before, s.after))))
  check('everyBridgeBusinessZeroNoUnobservedCreation', bridges.every(b => b.businessZero))
  check('allStepsFilesBackupsExportsUnchanged', steps.every(s => ['files', 'backups', 'exports'].every(k => zero(s.diff[k]))))
  const findings = JSON.parse(inspect.pairs[0].text.split('```json\n')[1].split('\n```')[0])
  const expected = [
    ['done-missing-materials', 't-0008'],
    ['done-open-checklist', 't-0012'],
    ['due-soon-untouched', 't-0010'],
    ['overdue-untouched', 't-0009'],
    ['progress-100-not-done', 't-0011'],
  ]
  check('fiveExactRuleTaskPairsOneEach', same(findings.map(f => [f.rule, f.taskId]), expected)
    && findings.every(f => f.title === finalTasks[f.taskId].title))
  check('eachReasonHumanDecisionNoAutomaticStatusJudgment', findings.every(f =>
    f.suggestion.includes('人判断')) && inspect.pairs[0].text.includes('未覆盖≠未完成')
    && inspect.pairs[0].text.includes('只读，不下完成裁决'))
  check('snapshotTasksWholeRecordsEqualCapturedRaw', same(JSON.parse(nav.pairs[0].text).tasks,
    Object.values(nav.raw.tasks)))
  const containsFindings = text => text.includes('5 条提示') && findings.every(f =>
    text.includes(`${f.taskId} · ${f.title}`) && text.includes(f.reason) && text.includes(f.suggestion))
  check('sameFiveFindingsRealPMCardAllOpenCancelStates', [nav, ...opens, ...closes].every(s =>
    containsFindings(s.actual.pm.text) && s.actual.pm.text.includes('系统不自动改状态、不自动标记完成')))
  const journeys = opens.map(s => {
    const id = s.exit.line, task = s.raw.tasks[id], close = closes.find(c => c.exit.line === id)
    const named = Object.fromEntries(s.actual.fields.filter(f => f.name).map(f => [f.name, f.value]))
    const evidenceField = s.actual.fields.find(f => f.placeholder === 'https://… 完成/进度的客观佐证链接')
    const unchanged = steps.slice(steps.indexOf(inspect)).every(t => same(t.raw.tasks[id], finalTasks[id]))
    const png = `${s.name}/actual.png`
    const openFrames = frames.filter(f => f.path.startsWith(s.name + '/'))
    const closeFrames = frames.filter(f => f.path.startsWith(close.name + '/'))
    return { id, rule: findings.find(f => f.taskId === id).rule, open: s.name, cancel: close.name,
      named, evidenceField: evidenceField?.value, rawChecklist: task.checklist ?? null,
      pmText: s.actual.pm.text, png, cancelPng: `${close.name}/actual.png`,
      openJpg: openFrames.at(-1).path, cancelJpg: closeFrames.at(-1).path,
      targetMatches: s.exit.action === 'check-target' && named.title === task.title && named.status === task.status
        && named.progress === String(task.progress) && named.startDate === (task.startDate ?? '')
        && named.dueDate === (task.dueDate ?? '') && named.priority === task.priority
        && named.description === task.description && named.assignee === task.assignee && evidenceField?.value === '',
      cancelled: close.exit.action === 'task-close' && !close.actual.fields.some(f => f.name === 'title')
        && !close.actual.pm.text.includes('编辑任务') && same(task, close.raw.tasks[id]),
      unchanged }
  })
  check('fiveByIdCheckItemsOpenMatchingExistingTaskForms', journeys.length === 5
    && journeys.every(j => j.targetMatches) && new Set(journeys.map(j => j.id)).size === 5)
  check('fiveCancelNoBusinessCommandNoRewrite', journeys.every(j => j.cancelled && j.unchanged)
    && [...opens, ...closes].every(s => !s.pairs.length && !s.requests.length && zeroRoots(s.diff)))
  check('2of5Objective40DifferentLegacy100AndStatus', nav.actual.pm.text.includes('客观 40%\n清单 2/5 · 覆盖 1/1')
    && nav.actual.pm.text.includes('原手填 100%')
    && journeys.find(j => j.id === 't-0012').pmText.includes('40%（2/5）')
    && journeys.find(j => j.id === 't-0011').named.progress === '100'
    && finalTasks['t-0012'].progress === 0 && finalTasks['t-0012'].status === 'done'
    && finalTasks['t-0011'].status === 'todo')
  const execution = readFileSync(join(root, 'execution/pmtool-a18-check-five-20261022.mjs'), 'utf8')
  check('archivedExecutorRealCheckItemByIdClickAndCancel', execution.includes('.pm-check-card .pm-check-item')
    && execution.includes("includes(id+' · ')") && execution.includes('target.asElement().click()')
    && execution.includes("clickText(page,'取消','.pm-drawer button')")
    && execution.includes("await editor.press('Enter')"))
  const taskSource = readFileSync(join(candidate.tree, 'packages/dsh-pm-tool/src/client/views/tasks.tsx'), 'utf8')
  const panelSource = readFileSync(join(candidate.tree, 'packages/dsh-pm-tool/src/client/panel.tsx'), 'utf8')
  check('frozenSourceByIDTaskFormKeyAndCheckedOriginal', taskSource.includes('const target = byId.get(f.taskId)')
    && taskSource.includes('onClick={() => target && onEdit(target)}')
    && panelSource.includes('key={drawer.task ? `task-${drawer.task.id}`')
    && panelSource.includes('task={drawer.task}') && panelSource.includes('checked={item.done}'))
  check('consoleNoCapturedErrorsNotWholeNetworkMatrix', steps.every(s => !s.console.length))
  const visualPaths = [
    `${nav.name}/actual.png`, ...journeys.flatMap(j => [j.png, j.cancelPng, j.openJpg, j.cancelJpg]),
    `${nav.name}/frames/000022.jpg`,
  ]
  const visual = visualPaths.map(p => ({ path: p, ...fingerprint(join(root, p)),
    role: p.endsWith('.jpg') ? 'original compositor frame; review separately' : 'actual screenshot; review separately' }))
  const protectedDrift = delta(read(prefix + '-before.json').files, capture())
  check('protectedInputsBytesMtimeNoDrift', zero(protectedDrift))
  const result = { at: new Date().toISOString(), environment: { platform: process.platform, arch: process.arch,
    node: process.version, cwd: repo }, ok: Object.values(assertions).every(Boolean),
    counts: summaryCounts, assertions, declared, sourceAuto: handoff, loadedChecks,
    index: { ...fingerprint(join(root, 'index.json')), count: listed.length, indexedMismatches, unlisted },
    observations: fingerprint(join(root, 'observations.json')), frameCount: frames.length, pngCount: listed.filter(p => p.endsWith('.png')).length,
    inputs, finalTasks, checklist, findings, journeys, visual,
    steps: steps.map(s => ({ name: s.name, exit: s.exit, diff: s.diff, observationMatch: s.observationMatch,
      rawMismatch: s.rawMismatch, pairs: s.pairs, actualFingerprint: fingerprint(join(root, s.name, 'actual.json')),
      requestsFingerprint: fingerprint(join(root, s.name, 'requests.json')) })),
    bridges, protectedCount: Object.keys(read(prefix + '-before.json').files).length, protectedDrift,
    boundary: 'Audit assertions are not product PASS; only original five actual rule/ID project-check journeys are reviewed. No replay or global gate.' }
  save(auditSuffix, result)
  console.log(JSON.stringify({ mode, ok: result.ok, assertionCount: Object.keys(assertions).length,
    failed: Object.keys(assertions).filter(k => !assertions[k]), counts: summaryCounts,
    frameCount: frames.length, indexCount: listed.length, visualPaths, protectedCount: result.protectedCount }))
  process.exitCode = result.ok ? 0 : 1
} else if (mode === 'seal') {
  const before = read(prefix + '-before.json').files, after = capture()
  const drift = delta(before, after), audit = read(prefix + auditSuffix)
  const own = Object.fromEntries(readdirSync(dirname(prefix)).filter(n =>
    n.startsWith(prefix.split('/').at(-1)) && !n.endsWith('-seal.json'))
    .map(n => [n, fingerprint(join(dirname(prefix), n))]))
  const untouched = zero(drift)
  save('-seal.json', { at: new Date().toISOString(), protectedCount: Object.keys(before).length,
    untouched, drift, auditOk: audit.ok, auditArtifacts: own,
    reviewResourceReleased: untouched && audit.ok,
    boundary: 'Pre-report byte seal only. No GUI/lib/service/Main source ownership; no scripts after the final report. Not a release/commit gate.' })
  console.log(JSON.stringify({ mode, untouched, auditOk: audit.ok, reviewResourceReleased: untouched && audit.ok }))
  process.exitCode = untouched && audit.ok ? 0 : 1
} else {
  throw Error('Use freeze, audit, or seal before final report; no product or GUI execution')
}

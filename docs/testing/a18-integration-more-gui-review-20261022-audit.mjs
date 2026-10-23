import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, lstatSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Read archived evidence and declared isolated candidates only. Never import product code.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a18-integration-more-gui-review-20261022')
const reports = join(repo, 'reports/all-pending-evidence-20261021')
const root = join(reports, 'A18/integration-more')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const stable = x => JSON.stringify(x, (_, v) => v && !Array.isArray(v) && typeof v === 'object'
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v)
const eq = (a, b) => stable(a) === stable(b)
const fp = p => {
  if (!lstatSync(p).isFile()) throw Error(`Not regular: ${p}`)
  const b = readFileSync(p)
  return { bytes: b.length, sha256: sha(b), mtimeMs: lstatSync(p).mtimeMs }
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
const diffRoots = (a, b) => Object.fromEntries(roots.map(k => [k, delta(a[k] ?? {}, b[k] ?? {})]))
const zero = d => Object.values(d).every(v => Object.values(v).every(x => Object.keys(x).length === 0))
const changed = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => !eq(a[k], b[k])).sort()
const manifestPaths = {
  A13: join(reports, 'A13/candidate-final.json'),
  A14: join(reports, 'A14/candidate.json'),
  A16: join(reports, 'A16/candidate.json'),
  A18: join(reports, 'A18/candidate.json'),
}
const candidates = Object.fromEntries(Object.entries(manifestPaths).map(([k, p]) => [k, json(p)]))
const fixed = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/governance-growth-independent-auto-20261021-gui-handoff.md',
  'docs/testing/governance-fix-independent-retest-20261021-gui-handoff.md',
  'docs/testing/materials-files-reports-independent-auto-20261021-gui-handoff.md',
  'docs/testing/governance-growth-independent-auto-20261021-report.md',
  'docs/testing/a18-growth-more-gui-review-20261022.md',
  'docs/testing/a18-growth-more-gui-review-20261022-audit.mjs',
  'docs/testing/a18-growth-more-gui-review-20261022-audit.json',
  'docs/testing/a18-growth-more-gui-review-20261022-audit-r2.json',
  'docs/testing/a18-growth-more-gui-review-20261022-seal.json',
  'reports/a19-shared-bin-drift-diagnosis-20261022.md',
  'reports/all-pending-evidence-20261021/A13/product-tracked.patch',
  'reports/all-pending-evidence-20261021/A13/environment-final.json',
  'docs/testing/materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr/fixtures/F5/backup.json',
].map(p => join(repo, p))
const protectedDirs = [
  root, join(reports, 'A18/integration-recovery'), join(reports, 'A18/integration-export-view'),
  join(reports, 'A13/final/materials/loaded'), join(reports, 'A13/final/materials/seed'),
  join(reports, 'A18/growth-more'),
]
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
if (process.argv[2] === 'seal') {
  const before = json(prefix + '-audit.json').protectedBefore
  const after = capture(), diff = delta(before, after)
  const deliverables = Object.fromEntries(readdirSync(dirname(prefix))
    .filter(n => n.startsWith(prefix.split('/').at(-1)) && !n.endsWith('-seal.json'))
    .map(n => [n, fp(join(dirname(prefix), n))]))
  const result = { at: new Date().toISOString(), count: Object.keys(before).length, diff,
    untouched: Object.values(diff).every(x => Object.keys(x).length === 0), deliverables,
    released: true, scope: 'Only this independent archived-evidence review; not global acceptance or product authorization' }
  writeFileSync(prefix + '-seal.json', JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify({ count: result.count, untouched: result.untouched, diff, released: true }, null, 2))
  process.exitCode = result.untouched ? 0 : 1
} else {
  const protectedBefore = capture(), assertions = {}
  const check = (name, value) => { assertions[name] = !!value }
  const candidateChecks = Object.fromEntries(Object.entries(candidates).map(([k, c]) => [k, {
    tree: c.tree, baseline: c.baseline, hostGitHead: c.hostGitHead, manifest: fp(manifestPaths[k]),
    sourceCount: Object.keys(c.sourceHashes).length, artifactCount: Object.keys(c.artifacts).length,
    sourceMismatch: Object.entries(c.sourceHashes).filter(([p, h]) => fp(join(c.tree, p)).sha256 !== h).map(([p]) => p),
    artifactMismatch: Object.entries(c.artifacts).filter(([p, h]) => fp(join(c.tree, p)).sha256 !== h).map(([p]) => p),
    scope: k === 'A13' ? 'tested old product identity' : 'protection only, not acceptance',
  }]))
  check('declaredCandidatesAllHashMatch', Object.values(candidateChecks).every(c => !c.sourceMismatch.length && !c.artifactMismatch.length))
  check('oldA13Identity514And453', candidateChecks.A13.sourceCount === 514 && candidateChecks.A13.artifactCount === 453)
  const index = json(join(root, 'index.json'))
  const all = Object.keys(scan(root)).map(p => p.slice(root.length + 1))
  const indexed = Object.entries(index.files).map(([p, v]) => ({ path: p, matches: fp(join(root, p)).sha256 === v.sha256 && fp(join(root, p)).bytes === v.bytes }))
  const unlisted = all.filter(p => p !== 'index.json' && !(p in index.files))
  check('sealedIndex5755Complete', indexed.length === 5755 && indexed.every(x => x.matches) && !unlisted.length)
  const copies = ['integration-recovery', 'integration-export-view'].map(n => {
    const original = scan(join(reports, 'A18', n)), copy = scan(join(root, n))
    const relative = (map, base) => Object.fromEntries(Object.entries(map).map(([p, v]) => [p.slice(base.length + 1), { bytes: v.bytes, sha256: v.sha256 }]))
    return { name: n, count: Object.keys(original).length, matches: eq(relative(original, join(reports, 'A18', n)), relative(copy, join(root, n))) }
  })
  check('originalRecoveryExportCopiesEqual', copies.every(x => x.matches))
  const frames = all.filter(p => p.endsWith('/frames/frames.json')).flatMap(p =>
    json(join(root, p)).frames.map(f => {
      const path = join(dirname(p), f.file)
      return { manifest: p, path, matches: fp(join(root, path)).sha256 === f.sha256 }
    }))
  check('allArchivedFramesHashOnlyNotAllVisual', frames.every(x => x.matches) && all.filter(p => p.endsWith('.jpg')).every(p => frames.some(f => f.path === p)))
  const client = readFileSync(join(candidates.A13.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const loadedChecks = ['A13/final/materials/loaded', 'A18/integration-more/integration-recovery/loaded'].map(p => {
    const result = json(join(reports, p, 'result.json'))
    const checks = result.events.map(e => {
      const b = readFileSync(join(reports, p, e.file)), first = b.indexOf(segment), second = b.indexOf(segment, first + 1)
      return { bytes: b.length, sha256: sha(b), first, second, matches: first >= 0 && second === -1
        && e.bytes === b.length && e.responseSha === sha(b) && e.status === 200 && e.fromDiskCache === false
        && e.frameId === result.targetId && e.matches.some(m => m.sourceSha === sha(client)
          && m.segmentSha === sha(segment) && m.segmentBytes === segment.length && m.first === first && m.second === -1) }
    })
    return { path: p, timeOrigin: result.state.timeOrigin, origin: result.state.origin, checks }
  })
  check('oldAndRecoveredUncachedFullUniqueClient', loadedChecks.every(x => x.checks.length === 1 && x.checks.every(c => c.matches)))
  const observations = json(join(root, 'observations.json'))
  const stepNames = readdirSync(root).filter(n => existsSync(join(root, n, 'exit.json')))
    .sort((a, b) => Number(a.split('-').at(-1)) - Number(b.split('-').at(-1)))
  const steps = Object.fromEntries(stepNames.map(n => {
    const path = join(root, n), read = p => json(join(path, p))
    const s = { exit: read('exit.json'), commands: read('commands.json'), requests: read('requests.json'), console: read('console.json') }
    s.pairs = s.commands.filter(x => x.event.type === 'command/run').map(run => {
      const done = s.commands.find(x => x.event.type === 'command/done' && x.event.data.commandId === run.event.data.commandId)
      const request = s.requests.find(x => x.body?.payload?.args?.line === `/pm${run.event.data.args}`)
      return { args: run.event.data.args, commandId: run.event.data.commandId, kind: done?.event.data.kind,
        text: done?.event.data.text, source: run.event.data.source, agentId: request?.body.payload.args.agentId,
        done: !!done, request: !!request,
        valid: !!request && run.event.data.source.kind === 'user' && run.event.data.name === 'pm'
          && request.body.type === 'client-request' && request.body.method === 'commands/execute'
          && request.path === '/api/commands/execute' && eq(request.body.payload.args.submittedAttachments, []) }
    })
    s.before = read('before-roots.json')
    if (s.exit.exit === 0) {
      s.after = read('after-roots.json'); s.diff = diffRoots(s.before, s.after)
      s.actual = read('actual.json'); s.host = read('host-state.json')
      s.raw = Object.fromEntries(readdirSync(join(path, 'raw')).map(t => [t, Object.fromEntries(readdirSync(join(path, 'raw', t))
        .map(p => [p.replace(/\.json$/, ''), read(`raw/${t}/${p}`).record]))]))
      s.rawMismatches = Object.keys(s.raw).flatMap(t => readdirSync(join(path, 'raw', t))
        .filter(p => fp(join(path, 'raw', t, p)).sha256 !== s.after.data[`/pmtool/${t}/${p}`]).map(p => `${t}/${p}`))
    }
    const row = observations.rows.find(r => r.step === n)
    s.observationMatches = eq(s.exit, row.execution) && eq(s.commands, row.events)
      && (s.exit.exit !== 0 || eq(s.diff, row.diff))
    return [n, s]
  }))
  const at = n => steps[n]
  const cmd = stamp => at('command-' + stamp)
  const raw = (stamp, table, id) => cmd(stamp).raw[table][id]
  const firstPair = stamp => cmd(stamp).pairs[0]
  const queue = stamp => JSON.parse(firstPair(stamp).text)
  const successful = stepNames.filter(n => at(n).exit.exit === 0)
  const failed = stepNames.filter(n => at(n).exit.exit !== 0)
  check('83OriginalStepsThreeCaptureFailures', stepNames.length === 83 && successful.length === 80
    && eq(failed.sort(), ['command-1792628886114', 'pm-nav-1792628312815', 'task-open-1792628284542'].sort()))
  check('observationsRecomputedAll83', stepNames.every(n => at(n).observationMatches))
  check('allSuccessfulRawHashesMatch', successful.every(n => !at(n).rawMismatches.length))
  check('realPostUserRunDoneExceptRetainedIncomplete', stepNames.every(n => at(n).pairs.every(p => p.valid
    && (p.done || n === 'command-1792628886114')) && at(n).requests.length === at(n).pairs.length
    && at(n).commands.length === at(n).pairs.length * 2 - (n === 'command-1792628886114' ? 1 : 0)))
  const contexts = [...new Set(successful.map(n => at(n).actual.timeOrigin))]
  const sessions = [...new Set(stepNames.flatMap(n => at(n).pairs.map(p => p.agentId)))]
  check('threeRecordedTimeOriginsOnly', eq(contexts.slice().sort(), observations.timeOrigins.slice().sort())
    && successful.every(n => at(n).actual.origin === observations.origin && at(n).host.timeOrigin === at(n).actual.timeOrigin))
  check('composerExplicitInputAndNoInventedVisibleCards', successful.filter(n => at(n).exit.action === 'command').every(n => {
    const s = at(n), pre = json(join(root, n, 'before-submit.json'))
    return pre.editors.some(e => e.visible && e.editable === 'true' && e.text === s.exit.line)
      && s.host.editors.some(e => e.visible && e.text === '') && pre.cards.length === 0 && s.host.cards.length === 0
  }))
  const bindingId = 'session-mvisk1k4-flv5zz'
  const bind = stamp => raw(stamp, 'sessions', bindingId)
  check('sameTaskSameSessionTwiceOneMergedBinding', Object.keys(cmd(1792628225795).raw.sessions).length === 1
    && bind(1792628217125).sessionId === firstPair(1792628217125).agentId
    && bind(1792628225795).note === 'QA 首次结存摘要；QA 第二次追加结存'
    && bind(1792628225795).id === bind(1792628217125).id)
  check('sessionListNotesForeignAndNewHostReadback', JSON.parse(firstPair(1792628234077).text).count === 1
    && JSON.parse(firstPair(1792628242049).text).count === 1 && JSON.parse(firstPair(1792628250016).text).count === 0
    && eq(bind(1792628225795), bind(1792629326047))
    && JSON.parse(firstPair(1792629330196).text.split('```json\n')[1].split('\n```')[0]).status === 'final')
  const evidenceTask = raw(1792628258613, 'tasks', 't-0001')
  check('attachOnlyEvidenceTimeProvenanceAndIllegalZero', eq(changed(raw(1792628250016, 'tasks', 't-0001'), evidenceTask), ['evidenceUrl', 'updatedAt'])
    && evidenceTask.evidenceUrl === 'https://example.com/qa-a18-evidence' && zero(cmd(1792628266445).diff)
    && firstPair(1792628266445).kind === 'error' && raw(1792628258613, 'settings', 'pmProvenanceLedger').value.entries[0].refs[0].id === 't-0001')
  check('actualTaskFormReopensEvidenceAndCancelNoWrite', at('task-open-1792628337556').actual.fields.some(f => f.value === evidenceTask.evidenceUrl)
    && at('task-open-1792628337556').actual.fields.some(f => f.name === 'title' && f.value === evidenceTask.title)
    && zero(at('task-open-1792628337556').diff) && zero(at('task-close-1792628347375').diff))
  check('queueEmptyListReadOnlyOpenSetting', queue(1792628379122).top === null && !queue(1792628379122).rest.length
    && zero(cmd(1792628379122).diff) && queue(1792628386306).openedAt === '2026-10-22T00:19:47.300Z'
    && raw(1792628386306, 'settings', 'pmQueueOpened').value['p-0001'].at === queue(1792628386306).openedAt)
  check('negativeDueBeforeStartZeroPreservedThenLegalSeed', firstPair(1792628421224).kind === 'error'
    && zero(cmd(1792628421224).diff) && raw(1792628501585, 'tasks', 't-0007').startDate === '2026-10-17'
    && raw(1792628501585, 'tasks', 't-0007').dueDate === '2026-10-18'
    && raw(1792628501585, 'tasks', 't-0007').status === 'blocked'
    && raw(1792628412435, 'tasks', 't-0005').dueDate === '2026-10-22')
  check('ordinaryMuteRestRealUiUnmuteCriticalTop', queue(1792628586389).top.taskId === 't-0007'
    && queue(1792628586389).top.lateDays === 4 && queue(1792628586389).top.muted === true
    && at('queue-rest-1792628540593').actual.pm.text.includes('已静音')
    && at('queue-rest-1792628551676').pairs.some(p => p.args.includes('queue unmute t-0005'))
    && at('queue-rest-1792628565203').pairs.some(p => p.args.includes('queue mute t-0007')))
  check('realQuietTopNullRestTwoOffAndUnmute', queue(1792628611332).quietMode === true
    && queue(1792628611332).top === null && queue(1792628611332).rest.length === 2
    && at('queue-rest-1792628657288').actual.pm.text.includes('收起其余 2 项')
    && queue(1792628691332).quietMode === false && queue(1792628691332).top.taskId === 't-0007'
    && at('queue-rest-1792628747685').pairs.some(p => p.args.includes('queue unmute t-0007')))
  const refId = 'ref-mvi5z85j-yk04ji', ref = stamp => raw(stamp, 'reflections', refId)
  check('t1ExistingDraftNotNewCreationDoneRepeatedPreserves', ref(1792628764465).createdAt === '2026-10-21T13:44:55.303Z'
    && eq(ref(1792628764465), ref(1792628773080)) && Object.keys(cmd(1792628764465).diff.data.added).length === 0)
  check('reflectEditDraftExplicitFinalRepeatNewHost', ref(1792628795187).status === 'draft'
    && ref(1792628795187).draft.lines[0].mark === 'pending' && ref(1792628804583).status === 'final'
    && zero(cmd(1792628813217).diff) && eq(ref(1792628804583), ref(1792629330196)))
  const t3 = raw(1792628833825, 'tasks', 't-0003'), t3ref = raw(1792628833825, 'reflections', 'ref-mvisx864-w3fqsq')
  check('t3NotNoMaterialsActualFileAndEmptyCountPreserved', t3.attachments.length === 1 && t3.attachments[0].kind === 'file'
    && t3ref.draft.lines.some(l => l.text === '资料区已登记：（质量由人复核）') && t3ref.draft.gaps.length === 0
    && t3ref.sourceEvent === 'task-done' && t3ref.status === 'draft')
  check('wrappedCommandSlicesNoDoneNoQueueNoCheckNoReflection', raw(1792628835147, 'tasks', 't-0009').status === 'wrapped'
    && !Object.values(cmd(1792628840950).raw.reflections).some(r => r.taskId === 't-0009')
    && !JSON.stringify(queue(1792628837783)).includes('t-0009') && !firstPair(1792628839354).text.includes('t-0009')
    && firstPair(1792628836440).text.includes('完成 2/10') && firstPair(1792628840950).text.includes('暂无复盘草稿'))
  const lessonId = 'lesson-mvisxpcj-05amd5', lesson = stamp => raw(stamp, 'lessons', lessonId)
  check('literalBackslashNNotMultilineEditAndFinalRepeat', lesson(1792628876155).lines.length === 1
    && lesson(1792628876155).lines[0].text.includes('\\n') && !lesson(1792628876155).lines[0].text.includes('\n')
    && lesson(1792628876155).status === 'draft' && lesson(1792628878290).status === 'final'
    && zero(cmd(1792628880174).diff) && eq(lesson(1792628878290), lesson(1792629331496)))
  const structuredId = 'lesson-mvitmn83-0tmvsn', structured = stamp => raw(stamp, 'lessons', structuredId)
  check('newStructuredThreeMarksExplicitFinalList', structured(1792630015691).status === 'draft'
    && eq(structured(1792630015691).lines.map(l => l.mark), ['known', 'pending', 'blank'])
    && structured(1792630045861).status === 'final' && firstPair(1792630049214).text.includes(structuredId))
  const onlySessionCache = d => Object.values(d.data.added).length === 0 && Object.values(d.data.removed).length === 0
    && Object.keys(d.data.changed).every(p => p === '/session_projcache/sessions/session-792b22a6-e1db-428a-8816-4e86592a7262.json')
    && zero(Object.fromEntries(roots.filter(k => k !== 'data').map(k => [k, d[k]])))
  check('threeDefaultOverwriteRejectBusinessExportZeroAndConfirmSucceed', [1792630051872, 1792630054340, 1792630056297]
    .every(n => firstPair(n).kind === 'error' && onlySessionCache(cmd(n).diff))
    && [1792630058648, 1792630060889, 1792630063006].every(n => firstPair(n).kind === 'success'))
  const audit = stamp => raw(stamp, 'settings', 'pmExportAudit').value
  const sent = stamp => raw(stamp, 'settings', 'pmExportSent').value
  check('exportAuditAppendOneToFourToSevenOldPrefix', audit(1792629340797).length === 4 && audit(1792630063006).length === 7
    && eq(audit(1792629340797), audit(1792630063006).slice(0, 4))
    && sent(1792630063006).length === 7 && firstPair(1792629345226).kind === 'success' && firstPair(1792629347928).kind === 'success')
  const view = join(root, 'integration-export-view')
  const beforeView = json(join(view, 'before-source-change-boundary.json')), afterView = json(join(view, 'after-source-change-boundary.json'))
  const exportFiles = Object.entries(beforeView.files).map(([name, f]) => ({ name, ...f,
    matches: ['before-source-change', 'after-source-change'].every(phase => {
      const b = readFileSync(join(view, phase + '-' + name))
      return b.length === f.bytes && sha(b) === f.sha256
    }) }))
  const beforeState = json(join(view, 'before-source-change.json')), afterState = json(join(view, 'after-source-change.json'))
  check('threeFileBytesStaticAfterRealDescriptionChange', exportFiles.every(f => f.matches) && eq(beforeView.files, afterView.files)
    && raw(1792630139989, 'tasks', 't-0001').description === 'QA 导出后源说明已改；静态文件应保导出时原文。'
    && !afterState.text.includes('QA 导出后源说明已改') && beforeState.text === afterState.text)
  check('actualStandaloneHtmlNoControlsExternalRequestsErrors', [beforeState, afterState].every(s => s.controls === 0 && !s.externalResources.length)
    && [beforeView, afterView].every(s => s.requests.length === 1 && s.requests[0].url === 'local-file' && !s.consoleRows.length)
    && !readFileSync(join(view, 'before-source-change-p-0001-snapshot.html'), 'utf8').includes('<script'))
  const listener = json(join(root, 'integration-recovery/listener-before.json'))
  const prior = json(join(root, 'integration-recovery/prior-pid.json')), start = json(join(root, 'integration-recovery/start.json'))
  check('retainedIncompleteRunNoCausalExitAndExactRecovery', firstPair(1792628886114).done === false
    && listener.exit === 1 && listener.stdout === '' && prior.exit === 1 && prior.stdout === ''
    && start.pid === 61433 && start.sameProductTree === candidates.A13.tree && start.argv.at(-1) === '3242')
  const chainGaps = successful.slice(1).map((n, i) => ({ from: successful[i], to: n, diff: diffRoots(at(successful[i]).after, at(n).before) }))
  check('betweenSuccessfulSamplesOnlyOwnedSessionCache', chainGaps.every(x => onlySessionCache(x.diff)))
  check('successfulWritesOnlyExplicitQueueSettingRemovalNoFilesBackups', successful.every(n => {
    const d = at(n).diff
    const allowedRemoval = {
      'queue-rest-1792628551676': '/pmtool/settings/pmQueueMute.json',
      'queue-rest-1792628747685': '/pmtool/settings/pmQueueMute.json',
      'command-1792628678447': '/pmtool/settings/pmQueueQuiet.json',
    }
    return zero({ files: d.files, backups: d.backups }) && Object.keys(d.data.removed).every(p => p === allowedRemoval[n])
      && !Object.keys(d.exports.removed).length
  }))
  const visualPaths = [
    'command-1792628217125/before-submit.png', 'command-1792628217125/actual.png',
    'task-open-1792628337556/actual.png', 'task-open-1792628337556/frames/000007.jpg',
    'queue-add-1792628480746/actual.png', 'queue-rest-1792628540593/actual.png',
    'queue-rest-1792628565203/actual.png', 'queue-rest-1792628657288/actual.png',
    'queue-rest-1792628747685/actual.png', 'command-1792628804583/before-submit.png',
    'command-1792630015691/before-submit.png', 'integration-export-view/before-source-change.png',
    'integration-export-view/after-source-change.png',
  ].filter(p => existsSync(join(root, p)))
  const afterDiff = delta(protectedBefore, capture())
  check('protectedInputsUnchangedDuringAudit', Object.values(afterDiff).every(x => !Object.keys(x).length))
  const result = {
    at: new Date().toISOString(), environment: { platform: process.platform, arch: process.arch, node: process.version, cwd: repo },
    scope: 'Old A13 finite integration-more archived evidence. No Main new149/1552/pin11 or verification/habit scripts; no live roots/private logs/tokens.',
    assertions, failedAssertions: Object.keys(assertions).filter(k => !assertions[k]),
    candidateChecks, index: { fingerprint: fp(join(root, 'index.json')), count: indexed.length, indexed, unlisted },
    observations: { fingerprint: fp(join(root, 'observations.json')), rowCount: observations.rows.length },
    copies, frames, loadedChecks, contexts, sessions, originalFailures: failed,
    steps, chainGaps, exportFiles, visual: visualPaths.map(p => ({ path: p, ...fp(join(root, p)) })),
    findings: {
      noMaterialsCase: 'BLOCKED: t3 has file attachment; no true empty-material task evidence.',
      fileOnlyReflection: 'FAIL: actual known materials line has no count (file kind omitted); no claim of no-material gap failure.',
      checkMatrix: 'BLOCKED: five rules and actual target opening not completed by current slice.',
      queueHistory: 'BLOCKED: mute expiry and absence-only historical fixtures not supplied.',
      exportHistory: 'BLOCKED: no 31/29-day active/archive fixture or actual task outstation re-open.',
      wrappedAllConsumers: 'BLOCKED: command slices do not prove people/board/objective full aggregate or AI rejection.',
      wholeGate: 'No whole ID/matrix/release/next-feature PASS; only actual finite steps.',
    },
    protectedBefore, protectedAfterDiff: afterDiff,
  }
  writeFileSync(prefix + '-audit.json', JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify({ assertions: Object.keys(assertions).length, failed: result.failedAssertions,
    index: indexed.length, frames: frames.length, steps: stepNames.length, pairs: Object.values(steps).reduce((n, s) => n + s.pairs.length, 0),
    contexts, sessions, protected: Object.keys(protectedBefore).length, copies, candidateChecks, exportFiles }, null, 2))
  process.exitCode = result.failedAssertions.length ? 1 : 0
}

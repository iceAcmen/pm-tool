import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, lstatSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Evidence-only audit: no product imports, browser connections or live roots.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a15-busy-habit-gui-review-20261022')
const reports = join(repo, 'reports/all-pending-evidence-20261021')
const roots = { busy: join(reports, 'A15/file-busy'), habit: join(reports, 'A15/growth-habit') }
const sha = b => createHash('sha256').update(b).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const read = (kind, name) => json(join(roots[kind], name))
const fingerprint = p => {
  const s = lstatSync(p)
  if (!s.isFile()) throw Error(`Nonregular input: ${p}`)
  const b = readFileSync(p)
  return { bytes: b.length, sha256: sha(b), mtimeMs: s.mtimeMs }
}
const scan = (p, result = {}) => {
  if (lstatSync(p).isDirectory()) {
    for (const n of readdirSync(p).sort()) scan(join(p, n), result)
  } else result[p] = fingerprint(p)
  return result
}
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const diff = (a, b) => ({
  added: Object.keys(b).filter(k => !(k in a)).sort(),
  removed: Object.keys(a).filter(k => !(k in b)).sort(),
  changed: Object.keys(a).filter(k => k in b && !equal(a[k], b[k])).sort(),
})
const rootDiff = (a, b) => Object.fromEntries(['data', 'files', 'backups'].map(k => [k, diff(a[k], b[k])]))
const empty = d => Object.values(d).every(v => Object.values(v).every(a => a.length === 0))
const candidates = {
  A13: json(join(reports, 'A13/candidate-final.json')),
  A14: json(join(reports, 'A14/candidate.json')),
}
const loadedRoots = {
  busy: join(reports, 'A14/fresh-file-supplement/loaded'),
  habit: join(reports, 'A13/final/materials/loaded'),
}
const seedRoot = join(reports, 'A13/final/materials/seed')
const backupPath = join(repo, 'docs/testing/materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr/fixtures/F5/backup.json')
const fixedInputs = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-journey-cases-20261021.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/remaining-acceptance-register-20261021.md',
  'docs/testing/a15-file-fault-gui-review-20261022.md',
  'docs/testing/a15-file-fault-gui-review-20261022-audit.mjs',
  'reports/all-pending-evidence-20261021/A13/candidate-final.json',
  'reports/all-pending-evidence-20261021/A13/product-tracked.patch',
  'reports/all-pending-evidence-20261021/A13/environment-final.json',
  'reports/all-pending-evidence-20261021/A14/candidate.json',
  'reports/all-pending-evidence-20261021/A14/product-tracked.patch',
].map(p => join(repo, p))
fixedInputs.push(backupPath, '/private/tmp/pmtool-a11-native-files/QA 文件 原件.md',
  '/private/tmp/pmtool-a13-final-gui-20261022.mjs', '/private/tmp/pmtool-a6-gui-20261021.mjs')
const capture = () => {
  const result = {}
  for (const p of [...Object.values(roots), ...Object.values(loadedRoots), seedRoot]) scan(p, result)
  for (const p of fixedInputs) result[p] = fingerprint(p)
  for (const c of Object.values(candidates)) {
    for (const p of new Set([...Object.keys(c.sourceHashes), ...Object.keys(c.artifacts)])) {
      result[join(c.tree, p)] = fingerprint(join(c.tree, p))
    }
  }
  return result
}
const before = capture()
const candidateChecks = Object.fromEntries(Object.entries(candidates).map(([name, c]) => [name, {
  tree: c.tree, baseline: c.baseline, hostGitHead: c.hostGitHead,
  manifest: fingerprint(join(reports, name === 'A13' ? 'A13/candidate-final.json' : 'A14/candidate.json')),
  source: { count: Object.keys(c.sourceHashes).length,
    mismatches: Object.entries(c.sourceHashes).filter(([p, h]) => before[join(c.tree, p)].sha256 !== h).map(([p]) => p) },
  artifacts: { count: Object.keys(c.artifacts).length,
    mismatches: Object.entries(c.artifacts).filter(([p, h]) => before[join(c.tree, p)].sha256 !== h).map(([p]) => p) },
}]))
const client = readFileSync(join(candidates.A13.tree, 'packages/dsh-pm-tool/lib/client.js'))
const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
  .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
const loaders = Object.fromEntries(Object.entries(loadedRoots).map(([kind, root]) => {
  const loaded = json(join(root, 'result.json'))
  const responses = loaded.events.map(e => {
    const b = readFileSync(join(root, e.file)), first = b.indexOf(segment)
    return { event: e, actualBytes: b.length, actualSha: sha(b), first,
      second: first < 0 ? -1 : b.indexOf(segment, first + 1),
      completeMatch: first >= 0 && b.indexOf(segment, first + 1) === -1
        && e.responseSha === sha(b) && e.bytes === b.length && e.status === 200 && e.fromDiskCache === false
        && e.frameId === loaded.targetId && e.matches.some(m => m.sourceSha === sha(client)
          && m.segmentSha === sha(segment) && m.segmentBytes === segment.length && m.first === first && m.second === -1) }
  })
  return [kind, { loaded, clientBytes: client.length, clientSha: sha(client),
    segmentBytes: segment.length, segmentSha: sha(segment), responses }]
}))
const evidence = Object.fromEntries(Object.entries(roots).map(([kind, root]) => {
  const files = Object.fromEntries(Object.entries(scan(root)).map(([p, v]) => [p.slice(root.length + 1), v]))
  const index = read(kind, 'index.json')
  const frames = Object.keys(files).filter(p => p.endsWith('frames/frames.json')).flatMap(p =>
    read(kind, p).frames.map(f => ({ manifest: p, ...f, path: join(dirname(p), f.file),
      matches: files[join(dirname(p), f.file)]?.sha256 === f.sha256 })))
  return [kind, { count: Object.keys(files).length, indexCount: Object.keys(index).length, files,
    indexMismatches: Object.entries(index).filter(([p, v]) => files[p]?.sha256 !== v.sha256 || files[p]?.bytes !== v.bytes).map(([p]) => p),
    unlisted: Object.keys(files).filter(p => p !== 'index.json' && !(p in index)),
    frames, frameCount: frames.length,
    frameUnlisted: Object.keys(files).filter(p => p.endsWith('.jpg') && !frames.some(f => f.path === p)) }]
}))
const busy = {
  ready: read('busy', 'ready.json'), held: read('busy', 'held.json'), end: read('busy', 'end.json'),
  observations: read('busy', 'observations.json'),
  probes: Object.fromEntries(['initial', 'new-before', 'busy', 'closed', 'new-after'].map(n => [n, read('busy', `${n}-probe.json`)])),
  states: Object.fromEntries(['initial', 'new-before', 'busy', 'closed', 'new-after'].map(n => [n, read('busy', `${n}.json`)])),
}
busy.rootDiffs = Object.fromEntries(['new-before', 'busy', 'closed', 'new-after'].map(n =>
  [n, rootDiff(read('busy', 'initial-roots.json'), read('busy', `${n}-roots.json`))]))
busy.rootDiffs.end = rootDiff(read('busy', 'initial-roots.json'), busy.end.roots)
const fileInput = p => p.input.find(x => x.aria === '选择文件暂存（提交时随任务保存）')
const habitId = 'habit-mvi5z84q-32ztau', okrId = 'okr-mvi5z847-33y3xk'
const observations = read('habit', 'observations.json')
const steps = Object.fromEntries(Object.keys(observations.steps).sort().map(n => {
  const exit = read('habit', `${n}/exit.json`), commands = read('habit', `${n}/commands.json`)
  const result = { exit, console: read('habit', `${n}/console.json`), commands,
    before: read('habit', `${n}/before-roots.json`), rootDiff: null }
  if (exit.exit === 0) {
    result.after = read('habit', `${n}/after-roots.json`)
    result.rootDiff = rootDiff(result.before, result.after)
    result.actual = read('habit', `${n}/actual.json`)
    result.habit = read('habit', `${n}/raw/habits/${habitId}.json`).record
    result.okr = read('habit', `${n}/raw/okrs/${okrId}.json`).record
    result.rawMatches = ['habits/' + habitId + '.json', 'okrs/' + okrId + '.json'].every(p =>
      evidence.habit.files[`${n}/raw/${p}`].sha256 === result.after.data[`/pmtool/${p}`])
  }
  result.observationMatches = equal(exit, observations.steps[n].exit)
    && equal(result.rootDiff, observations.steps[n].diff)
  return [n, result]
}))
const n = {
  nav: 'habit-nav-1792623856145', today: 'habit-check-1792623865275',
  yesterday: 'habit-check-1792623876778', prior: 'habit-check-1792623890757',
  repeat: 'habit-check-1792623899775', inspect: 'inspect-1792623996846',
  input: 'habit-input-1792624006185', save: 'habit-save-1792624015835',
  reopen: 'habit-edit-1792624026132', cancel: 'habit-cancel-1792624035698',
}
const chain = Object.values(n).map(key => ({ step: key, ...steps[key] }))
const chainDiffs = chain.slice(1).map((s, i) => ({ from: chain[i].step, to: s.step,
  diff: rootDiff(chain[i].after, s.before) }))
const operation = key => {
  const s = steps[n[key]], runs = s.commands.filter(x => x.event.type === 'command/run' && x.event.data.args.startsWith(' habit '))
  return runs.map(x => ({ ...x, done: s.commands.find(y => y.event.type === 'command/done' && y.event.data.commandId === x.event.data.commandId) }))
}
const operations = Object.fromEntries(['today', 'yesterday', 'prior', 'repeat', 'save'].map(k => [k, operation(k)]))
const backup = json(backupPath)
const seed = { boundary: json(join(seedRoot, 'boundary.json')), precheck: json(join(seedRoot, 'precheck.json')),
  backupHabit: backup.extra.habits.find(([id]) => id === habitId)[1],
  backupOkr: backup.extra.okrs.find(([id]) => id === okrId)[1] }
const changedKeys = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => !equal(a[k], b[k])).sort()
const assertions = {
  frozenA13: !candidateChecks.A13.source.mismatches.length && !candidateChecks.A13.artifacts.mismatches.length,
  protectedA14: !candidateChecks.A14.source.mismatches.length && !candidateChecks.A14.artifacts.mismatches.length,
  loadedComplete: Object.values(loaders).every(l => l.responses.length === 1 && l.responses.every(r => r.completeMatch)),
  indices: Object.values(evidence).every(e => !e.indexMismatches.length && !e.unlisted.length),
  allFrames: Object.values(evidence).every(e => e.frames.every(f => f.matches) && !e.frameUnlisted.length),
  evidenceCounts: evidence.busy.indexCount === 64 && evidence.habit.indexCount === 215
    && evidence.busy.count === 65 && evidence.habit.count === 216,
  busyPage: [...Object.values(busy.probes), ...Object.values(busy.states)].every(s =>
    s.timeOrigin === loaders.busy.loaded.state.timeOrigin && s.origin === loaders.busy.loaded.state.origin)
    && busy.ready.target === loaders.busy.loaded.targetId,
  busyInput: fileInput(busy.probes['new-before']).disabled === false
    && fileInput(busy.probes.busy).disabled === true && fileInput(busy.probes.busy).value === 'C:\\fakepath\\QA 文件 原件.md'
    && busy.probes.busy.busyText === '上传暂存中…'
    && fileInput(busy.probes['new-after']).disabled === false && fileInput(busy.probes['new-after']).value === '',
  separateImportAndSubmit: busy.probes.busy.input.find(x => x.aria === null).disabled === false
    && busy.probes.busy.submit.length === 1 && busy.probes.busy.submit[0].disabled === false,
  busyZeroRoots: Object.values(busy.rootDiffs).every(empty) && equal(busy.observations.diff, busy.rootDiffs.end),
  busyNewDraft: busy.states.initial.fields.some(f => f.name === 'title' && f.value === 'F02 失败后重选保存')
    && busy.states['new-before'].fields.some(f => f.name === 'title' && f.value === 'F02 控件忙态补证取消')
    && !busy.states.closed.fields.some(f => f.name === 'title')
    && busy.states['new-after'].fields.some(f => f.name === 'title' && f.value === ''),
  seedMatches: equal(seed.backupHabit, steps[n.nav].habit) && equal(seed.backupOkr, steps[n.nav].okr)
    && seed.precheck.pm.text.includes('备份文件完整预检通过')
    && seed.boundary.after.data[`/pmtool/habits/${habitId}.json`] === evidence.habit.files[`${n.nav}/raw/habits/${habitId}.json`].sha256,
  habitPage: chain.every(s => s.actual.origin === loaders.habit.loaded.state.origin
    && s.actual.timeOrigin === loaders.habit.loaded.state.timeOrigin),
  habitRawAndObservations: Object.values(steps).every(s => s.observationMatches && (s.exit.exit !== 0 || s.rawMatches)),
  habitChainOnlyRecordedSessionGaps: chainDiffs.every(x =>
    empty({ files: x.diff.files, backups: x.diff.backups })
    && x.diff.data.added.length === 0 && x.diff.data.removed.length === 0
    && x.diff.data.changed.every(p => p === '/session_projcache/sessions/session-792b22a6-e1db-428a-8816-4e86592a7262.json')),
  habitOperations: Object.values(operations).every(a => a.length === 1 && a[0].done?.event.data.kind === 'success')
    && operations.today[0].event.data.args === ` habit checkin ${habitId}`
    && operations.yesterday[0].event.data.args === ` habit checkin ${habitId} 2026-10-21`
    && operations.prior[0].event.data.args === ` habit checkin ${habitId} 2026-10-20`
    && operations.repeat[0].done.event.data.text.includes('未重复追加'),
  habitStages: ['today', 'yesterday', 'prior'].every((k, i) =>
    steps[n[k]].habit.checkIns.length === i + 1 && steps[n[k]].habit.streak.current === i + 1
    && steps[n[k]].habit.streak.longest === i + 1 && steps[n[k]].habit.streak.totalDays === i + 1),
  exactDates: equal(steps[n.prior].habit.checkIns, [
    { at: '2026-10-22', backfilled: false }, { at: '2026-10-21', backfilled: true }, { at: '2026-10-20', backfilled: true },
  ]),
  repeatNoWrite: equal(steps[n.prior].habit, steps[n.repeat].habit) && empty(steps[n.repeat].rootDiff),
  onlyHabitWrites: ['today', 'yesterday', 'prior', 'save'].every(k =>
    equal(steps[n[k]].rootDiff.data, { added: [], removed: [], changed: [`/pmtool/habits/${habitId}.json`] })
    && empty({ files: steps[n[k]].rootDiff.files, backups: steps[n[k]].rootDiff.backups })),
  inputNoWrite: empty(steps[n.input].rootDiff) && equal(steps[n.input].habit, steps[n.repeat].habit),
  savePreserves: equal(changedKeys(steps[n.repeat].habit, steps[n.save].habit), ['frequency', 'goal', 'notes', 'updatedAt'])
    && chain.every(s => s.habit.id === habitId && s.habit.okrId === okrId && s.habit.status === 'draft'
      && s.okr.kind === 'objective' && s.okr.projectId === s.habit.projectId),
  reopenAndCancel: ['reopen', 'cancel'].every(k => equal(steps[n[k]].habit, steps[n.save].habit) && empty(steps[n[k]].rootDiff))
    && steps[n.reopen].actual.fields.some(f => f.value === steps[n.save].habit.goal)
    && steps[n.reopen].actual.pm.text.includes('编辑习惯')
    && !steps[n.cancel].actual.fields.some(f => f.value === 'F5习惯'),
  originalErrors: steps['habit-nav-1792623814802'].exit.exit === 1
    && steps['habit-edit-1792623916903'].exit.exit === 1 && Object.values(steps).filter(s => s.exit.exit === 1).length === 2,
  scopedConsole: Object.values(steps).every(s => s.console.length === 0),
  nativeSource: before['/private/tmp/pmtool-a11-native-files/QA 文件 原件.md'].bytes === 22
    && before['/private/tmp/pmtool-a11-native-files/QA 文件 原件.md'].sha256 === '87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a',
}
const inspected = [
  ...['initial.png', 'busy.png', 'new-after.png', 'chooser/chooser.png', 'frames/000020.jpg', 'frames/000021.jpg'].map(p => ['busy', p]),
  ...['nav', 'today', 'yesterday', 'prior', 'repeat', 'input', 'save', 'reopen'].map(k => ['habit', `${n[k]}/actual.png`]),
  ['habit', `${n.reopen}/frames/000008.jpg`],
].map(([kind, path]) => ({ kind, path, ...evidence[kind].files[path] }))
const after = capture()
const protectionDiff = diff(before, after)
assertions.protection = empty({ inputs: protectionDiff })
const result = {
  at: new Date().toISOString(), environment: { os: process.platform, arch: process.arch, node: process.version, cwd: process.cwd() },
  boundary: 'Independent evidence-only audit; no product tests/build/install/GUI/services/credentials/commit. Assertions are not whole-gate PASS.',
  candidateChecks, loaders, evidence, busy, habit: { habitId, okrId, steps, chainDiffs, operations, seed,
    saveChangedKeys: changedKeys(steps[n.repeat].habit, steps[n.save].habit) },
  visual: { inspected, png: inspected.filter(x => x.path.endsWith('.png')).length,
    jpg: inspected.filter(x => x.path.endsWith('.jpg')).length,
    boundary: 'Only listed original images actually viewed; not all frames or live GUI. New empty picker property comes from original probe, not top-only PNG.' },
  protection: { before, after, diff: protectionDiff }, assertions,
}
const auditPath = `${prefix}-audit${process.argv.includes('r2') ? '-r2' : ''}.json`
if (process.argv[2] === 'seal') {
  const previous = json(auditPath)
  const drift = diff(previous.protection.before, after)
  const initialDrift = diff(json(`${prefix}-audit.json`).protection.before, after)
  const ownFiles = Object.fromEntries(readdirSync(dirname(prefix)).filter(p => p.startsWith('a15-busy-habit-gui-review-20261022') && !p.endsWith('-seal.json'))
    .map(p => [p, fingerprint(join(dirname(prefix), p))]))
  const seal = { at: result.at, protectedCount: Object.keys(after).length, drift, initialDrift, assertions, ownFiles }
  writeFileSync(`${prefix}-seal.json`, JSON.stringify(seal, null, 2) + '\n')
  console.log(JSON.stringify({ protectedCount: seal.protectedCount, drift, assertions }, null, 2))
  if (!empty({ inputs: drift, initial: initialDrift }) || Object.values(assertions).some(v => !v)) process.exitCode = 1
} else {
  writeFileSync(auditPath, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify({ assertions, protectedCount: Object.keys(before).length,
    sourceCounts: Object.fromEntries(Object.entries(candidateChecks).map(([k, c]) => [k, [c.source.count, c.artifacts.count]])),
    evidence: Object.fromEntries(Object.entries(evidence).map(([k, e]) => [k, { files: e.count, index: e.indexCount, frames: e.frameCount }])),
    busyDiffs: busy.rootDiffs, saveChangedKeys: result.habit.saveChangedKeys, protectionDiff }, null, 2))
  if (Object.values(assertions).some(v => !v)) process.exitCode = 1
}

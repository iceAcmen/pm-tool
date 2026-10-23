import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a14-sm01-clean-mixed-gui-review-20261022')
const out = `${prefix}-audit-${process.argv[2] || 'r1'}.json`
if (existsSync(out)) throw new Error(`Refuse overwrite: ${out}`)
const root = join(repo, 'reports/all-pending-evidence-20261021/A14')
const final = join(root, 'final')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = x => createHash('sha256').update(x).digest('hex')
const file = p => {
  const s = lstatSync(p), b = readFileSync(p)
  if (!s.isFile()) throw new Error(`Not regular file: ${p}`)
  return { sha256: sha(b), bytes: b.length, mtimeMs: s.mtimeMs }
}
const scan = (p, rel = '') => Object.fromEntries(readdirSync(join(p, rel)).sort().flatMap(n => {
  const r = rel ? `${rel}/${n}` : n, s = lstatSync(join(p, r))
  return s.isDirectory() ? Object.entries(scan(p, r)) : [[r, file(join(p, r))]]
}))
const diff = (a, b) => ({
  added: Object.keys(b).filter(k => !(k in a)).sort(),
  removed: Object.keys(a).filter(k => !(k in b)).sort(),
  changed: Object.keys(a).filter(k => k in b && a[k] !== b[k]).sort(),
})
const verify = (p, hashes) => {
  const records = Object.fromEntries(Object.entries(hashes).map(([n, h]) => [n,
    { expected: h, actual: existsSync(join(p, n)) ? file(join(p, n)).sha256 : null }]))
  return { count: Object.keys(records).length,
    mismatches: Object.keys(records).filter(n => records[n].expected !== records[n].actual), records }
}
const evidenceBefore = Object.fromEntries(['build', 'full-verify', 'final/seed', 'final/loaded',
  'final/mixed', 'final/mixed-r2', 'final/clean'].map(n => [n, scan(join(root, n))]))
const candidate = json(join(root, 'candidate.json'))
const source = verify(candidate.tree, candidate.sourceHashes)
const artifacts = verify(candidate.tree, candidate.artifacts)
const prior = json(join(repo, 'docs/testing/a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/new/source.json'))
const priorScope = Object.fromEntries(Object.entries(prior).map(([n, v]) => [n, v.sha256]))
const a14Scope = Object.fromEntries(Object.entries(candidate.sourceHashes)
  .filter(([n]) => n.startsWith('packages/dsh-pm-tool/src/'))
  .map(([n, h]) => [n.slice('packages/dsh-pm-tool/src/'.length), h]))
const scopedDiff = diff(priorScope, a14Scope)
const three = Object.fromEntries(['client/panel.tsx', 'client/panel.css', 'client/sidecar-minimize-retention.test.tsx',
  'client/shared/drawers/sidecar-portal.tsx'].map(n => [n, { prior: priorScope[n], a14: a14Scope[n],
  match: priorScope[n] === a14Scope[n] }]))
const loaded = json(join(final, 'loaded/result.json'))
const combo = readFileSync(join(final, 'loaded/combo-1.txt'))
const client = readFileSync(join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js'))
const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
  .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
const first = combo.indexOf(segment), second = combo.indexOf(segment, first + 1)
const rounds = ['mixed', 'mixed-r2', 'clean']
const events = Object.fromEntries(rounds.map(n => [n, json(join(final, n, 'command-events.json'))]))
const commands = Object.fromEntries(rounds.map(n => [n, events[n].filter(x => x.event.type === 'command/run').map(x => {
  const e = x.event, done = events[n].find(v => v.event.type === 'command/done' &&
    v.event.data.commandId === e.data.commandId)
  return { at: x.at, seq: e.seq, ...e.data, done: done && { at: done.at, seq: done.event.seq, ...done.event.data } }
})]))
const allEvents = rounds.flatMap(n => events[n])
const done = seq => allEvents.find(v => v.event.seq === seq).event.data
const get = p => json(join(final, p))
const record = p => get(p).record
const entries = p => record(p).value.entries
const stages = {
  mixed: ['initial', 'diagnosis-input-before-min', 'draft-before-min', 'draft-hidden', 'draft-retained',
    'applied', 'applied-hidden', 'external-draft', 'save-visible', 'external-saved', 'expanded-after-save', 'mixed-undone'],
  clean: ['initial', 'draft', 'applied', 'hidden', 'expanded', 'supplement/undone'],
}
const objects = Object.fromEntries(Object.entries(stages).map(([label, names]) => [label,
  Object.fromEntries(names.map(n => {
    const dir = label === 'mixed' ? 'mixed-r2' : 'clean'
    return [n, { t1: record(`${dir}/${n}-t1.json`), t2: record(`${dir}/${n}-t2.json`),
      ledger: entries(`${dir}/${n}-ledger.json`) }]
  }))]))
const m = objects.mixed, c = objects.clean
const mixedEntry = m.applied.ledger.at(-1), cleanEntry = c.applied.ledger.at(-1)
const roots = (dir, n) => get(`${dir}/${n}-roots.json`)
const changes = {
  draft: diff(roots('mixed-r2', 'initial'), roots('mixed-r2', 'draft-retained')),
  applied: diff(roots('mixed-r2', 'draft-retained'), roots('mixed-r2', 'applied')),
  appliedHidden: diff(roots('mixed-r2', 'applied'), roots('mixed-r2', 'applied-hidden')),
  externalDraft: diff(roots('mixed-r2', 'applied-hidden'), roots('mixed-r2', 'external-draft')),
  mainSave: diff(roots('mixed-r2', 'save-visible'), roots('mixed-r2', 'external-saved')),
  expanded: diff(roots('mixed-r2', 'external-saved'), roots('mixed-r2', 'expanded-after-save')),
  mixedUndo: diff(roots('mixed-r2', 'expanded-after-save'), roots('mixed-r2', 'mixed-undone')),
  cleanDraft: diff(roots('clean', 'initial'), roots('clean', 'draft')),
  cleanHidden: diff(roots('clean', 'applied'), roots('clean', 'hidden')),
  cleanExpanded: diff(roots('clean', 'hidden'), roots('clean', 'expanded')),
  cleanFinal: diff(roots('clean', 'initial'), get('clean/supplement/result.json').roots),
}
const states = Object.fromEntries(['mixed/failure-state', ...stages.mixed.filter(n => n !== 'initial').map(n => `mixed-r2/${n}`),
  'clean/initial', 'clean/draft', 'clean/applied', 'clean/hidden', 'clean/expanded', 'clean/failure',
  'clean/supplement/undone-visible'].map(n => {
  const s = get(`${n}.json`)
  return [n, { at: s.at, origin: s.origin, timeOrigin: s.timeOrigin, viewport: s.viewport, dark: s.dark,
    pm: s.pm, buttons: s.buttons, fields: s.fields, focus: s.focus }]
}))
const frames = Object.fromEntries(['seed', ...rounds].map(n => {
  const manifest = get(`${n}/frames/frames.json`)
  const records = manifest.frames.map(v => ({ ...v, actual: file(join(final, n, 'frames', v.file)) }))
  const actions = n === 'seed' ? [] : get(`${n}/actions.json`)
  return [n, { count: records.length, mismatches: records.filter(v => v.sha256 !== v.actual.sha256),
    first: records[0], last: records.at(-1), records, actions,
    nearest: actions.map(a => ({ ...a, frame: records.reduce((b, v) =>
      Math.abs(v.metadata.timestamp * 1000 - Date.parse(a.at)) <
      Math.abs(b.metadata.timestamp * 1000 - Date.parse(a.at)) ? v : b) })) }]
}))
const backupPath = join(repo, 'docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected/F6-ui-standard/pmtool-backup-2026-10-21T14-08-30-668Z.json')
const backup = json(backupPath)
const seed = { backup: file(backupPath), format: backup.format, exportedAt: backup.exportedAt,
  beforeConfirm: get('seed/before-confirm-r2.json'), after: get('seed/after-r2.json'),
  tasksEqual: backup.tasks.slice(0, 2).every((t, i) => isDeepStrictEqual(t, objects.mixed.initial[`t${i + 1}`])),
  ledgerEqual: isDeepStrictEqual(backup.extra.settings.find(([k]) => k === 'pmProvenanceLedger')[1].value.entries,
    m.initial.ledger), oldHandle: m.initial.ledger[0].undo.handle }
const snapshot = (seq, expected) => {
  const tasks = JSON.parse(done(seq).text).tasks
  return ['t1', 't2'].every(k => isDeepStrictEqual(tasks.find(t => t.id === expected[k].id), expected[k]))
}
const assertions = {
  sourcesValid: source.mismatches.length === 0, artifactsValid: artifacts.mismatches.length === 0,
  patchValid: file(join(root, 'product-tracked.patch')).sha256 === candidate.trackedPatchSha,
  independent385Same: Object.values(scopedDiff).every(v => v.length === 0),
  repairFilesSame: Object.values(three).every(v => v.match),
  completeUniqueClient: first >= 0 && second === -1 && sha(segment) === loaded.events[0].matches[0].segmentSha,
  comboValid: sha(combo) === loaded.events[0].responseSha && combo.length === loaded.events[0].bytes,
  loadBeforeAsk: Date.parse(loaded.at) < Date.parse(commands.mixed.find(x => x.args.trim().startsWith('ask ')).at),
  uncached: loaded.events[0].fromDiskCache === false,
  seedTasksAndLedger: seed.tasksEqual && seed.ledgerEqual,
  freshNotRestored: mixedEntry.undo.handle !== seed.oldHandle && cleanEntry.undo.handle !== seed.oldHandle &&
    mixedEntry.undo.handle !== cleanEntry.undo.handle,
  mixedApplyThree: done(22).kind === 'success' && mixedEntry.undo.postimages.map(x => x.id).join(',') === 't-0001,t-0001,t-0002',
  applySnapshot: snapshot(26, m.applied), savedSnapshot: snapshot(32, m['external-saved']),
  mixedSnapshot: snapshot(36, m['mixed-undone']), cleanAppliedSnapshot: snapshot(44, c.applied),
  cleanFinalSnapshot: snapshot(50, c['supplement/undone']),
  mixedT1FullUntouched: isDeepStrictEqual(m['external-saved'].t1, m['mixed-undone'].t1),
  mixedT2FullRestored: isDeepStrictEqual(m.initial.t2, m['mixed-undone'].t2),
  historyRetained: ['attachments', 'progressLog'].every(k =>
    isDeepStrictEqual(m.initial.t1[k], m['external-saved'].t1[k]) &&
    isDeepStrictEqual(m.initial.t1[k], c['supplement/undone'].t1[k])),
  cleanInitialIsMixedFinal: ['t1', 't2', 'ledger'].every(k => isDeepStrictEqual(m['mixed-undone'][k], c.initial[k])),
  cleanFullRestored: ['t1', 't2'].every(k => isDeepStrictEqual(c.initial[k], c['supplement/undone'][k])),
  cleanOldLedgerPreserved: isDeepStrictEqual(c.initial.ledger, c['supplement/undone'].ledger.slice(0, -1)),
  mixedSuccess: done(34).kind === 'success' && done(34).text.includes('已撤销 1 项'),
  cleanSuccess: done(48).kind === 'success' && done(48).text.includes('已撤销 3 项'),
  mixedNotBurned: m['mixed-undone'].ledger.at(-1).undo.used === false,
  cleanUsed: c['supplement/undone'].ledger.at(-1).undo.used === true,
  framesValid: Object.values(frames).every(v => v.mismatches.length === 0),
}
const evidenceAfter = Object.fromEntries(Object.keys(evidenceBefore).map(n => [n, scan(join(root, n))]))
const protectedDrift = Object.keys(evidenceBefore).filter(n => !isDeepStrictEqual(evidenceBefore[n], evidenceAfter[n]))
const buildCommands = ['build', 'noemit', 'coverage'].map(n => ({ label: n, ...json(join(root, `build/${n}.exit.json`)) }))
const guardText = readFileSync(join(root, 'full-verify/guard.stdout.txt'), 'utf8')
const guardRows = [...guardText.matchAll(/\[guard\]\s+ok\s+(scripts\/verify-[\w-]+\.mjs) \(退出码=(\d+)/g)]
  .map(m => ({ script: m[1], exit: Number(m[2]) }))
const result = { at: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch, cwd: process.cwd() },
  boundary: 'Only archived file audit; no product import, tests/build/install/GUI/network/services/runtime data/credentials/git mutation.',
  candidate: { baseline: candidate.baseline, hostGitHead: candidate.hostGitHead, tree: candidate.tree,
    manifest: file(join(root, 'candidate.json')), patch: file(join(root, 'product-tracked.patch')),
    source, artifacts, priorSource: file(join(repo, 'docs/testing/a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/new/source.json')),
    scopedDiff, repairFiles: three, mainCurrent: verify(repo, candidate.sourceHashes) },
  environmentArchive: get('environment.json'), host: get('host-start-r2.json'), gateway: get('gateway/ready.json'),
  loader: { loaded, combo: file(join(final, 'loaded/combo-1.txt')), client: sha(client), segment: sha(segment), first, second },
  buildCommands, fullVerify: json(join(root, 'full-verify/summary.json')), guardRows,
  seed, commands, originalExits: Object.fromEntries(rounds.map(n => [n, get(`${n}/exit.json`)])),
  supplement: get('clean/supplement/result.json'), objects, states, frames, changes,
  ttl: { mixed: { expiresAt: mixedEntry.undo.expiresAt, runTime: allEvents.find(x => x.event.seq === 33).event.time,
    remainingMs: mixedEntry.undo.expiresAt - allEvents.find(x => x.event.seq === 33).event.time },
  clean: { expiresAt: cleanEntry.undo.expiresAt, runTime: allEvents.find(x => x.event.seq === 47).event.time,
    remainingMs: cleanEntry.undo.expiresAt - allEvents.find(x => x.event.seq === 47).event.time } },
  console: Object.fromEntries(['mixed', 'mixed-r2'].map(n => [n, get(`${n}/console.json`)])),
  evidenceBefore, protectedDrift, assertions,
  failedAssertions: Object.keys(assertions).filter(k => !assertions[k]) }
writeFileSync(out, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ out, failedAssertions: result.failedAssertions, protectedDrift,
  sourceCount: source.count, artifactCount: artifacts.count, scopedDiff, frames: Object.fromEntries(
    Object.entries(frames).map(([k, v]) => [k, v.count])), ttl: result.ttl, changes }, null, 2))
if (result.failedAssertions.length || protectedDrift.length) process.exitCode = 1

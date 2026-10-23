import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { isDeepStrictEqual as equal } from 'node:util'

// Read archived inputs and declared A12 bytes; never contact a running service.
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a13-gateway-clean-undo-gui-review-20261021'
const gateway = 'reports/all-pending-evidence-20261021/A13/gateway'
const a12 = 'reports/all-pending-evidence-20261021/A12'
const originalPlan = '/private/tmp/pmtool-a13-gateway-runtime-20261021/artifacts/plan.json'
const standard = 'docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected/F6-ui-standard/pmtool-backup-2026-10-21T14-08-30-668Z.json'
const roots = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/governance-growth-independent-auto-20261021-fix-contract.md',
  'docs/testing/governance-growth-independent-auto-20261021-gui-handoff.md',
  'docs/testing/governance-fix-independent-retest-20261021-gui-handoff.md',
  'docs/testing/governance-fix-independent-retest-20261021-report.md',
  'docs/testing/a12-governance-source-gui-retest-20261021.md',
  'reports/a13-governance-gateway-entry-exploration-20261021.md',
  `${a12}/candidate.json`, `${a12}/product-tracked.patch`,
  `${a12}/build-r2/artifacts.json`, `${a12}/build-r2/build.exit.json`,
  standard, gateway,
]
const absolute = p => path.isAbsolute(p) ? p : path.join(repo, p)
const hash = b => crypto.createHash('sha256').update(b).digest('hex')
const read = p => fs.readFileSync(absolute(p))
const json = p => JSON.parse(read(p))
const excluded = p => /(?:^|\/)(?:private|credentials)(?:\/|$)/.test(p.replace(/^\/private\/tmp\//, ''))
  || /^(?:url|private-url|token|secret|cookie|credentials)(?:[.-]|$)/i.test(path.basename(p))
function scan(p, files, missing) {
  if (excluded(p)) return
  if (!fs.existsSync(absolute(p))) { missing.push(p); return }
  const stat = fs.lstatSync(absolute(p))
  if (stat.isSymbolicLink()) throw new Error(`Unexpected symlink: ${p}`)
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(absolute(p)).sort()) scan(path.join(p, name), files, missing)
  } else if (stat.isFile()) {
    const bytes = read(p)
    files[p] = { sha256: hash(bytes), bytes: bytes.length }
  }
}
function output(suffix, data) {
  fs.writeFileSync(absolute(`${prefix}-${suffix}.json`), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
}
function currentGit() {
  const git = args => execFileSync('git', args, { cwd: repo })
  const added = git(['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool', 'launcher'])
    .toString().trim().split('\n').filter(Boolean)
  return {
    head: git(['rev-parse', 'HEAD']).toString().trim(),
    trackedProductDiffSha: hash(git(['diff', '--binary', 'HEAD', '--', 'packages/dsh-pm-tool', 'launcher'])),
    newProductFiles: Object.fromEntries(added.map(p => [p, hash(read(p))])),
  }
}
const mode = process.argv[2]
if (mode === 'freeze') {
  const files = {}, missing = []
  for (const p of roots) scan(p, files, missing)
  const candidate = json(`${a12}/candidate.json`)
  const sourceComparison = [], artifactComparison = []
  for (const [p, expected] of Object.entries(candidate.sourceHashes)) {
    for (const tree of [repo, candidate.tree]) {
      const full = path.join(tree, p)
      scan(full, files, missing)
      sourceComparison.push({ tree, path: p, expected, actual: files[full]?.sha256 ?? null })
    }
  }
  for (const [p, expected] of Object.entries(candidate.artifacts)) {
    const full = path.join(candidate.tree, p)
    scan(full, files, missing)
    artifactComparison.push({ path: p, expected, actual: files[full]?.sha256 ?? null })
  }
  const result = { at: new Date().toISOString(), roots, files, missing,
    git: currentGit(), sourceComparison, artifactComparison,
    boundary: 'RA-AI04 cancel/clean batch undo archived review only; A13 collection, A12 plugin. No GUI, product execution, build/install, services, credentials or commit.' }
  output('inputs', result)
  console.log(JSON.stringify({ frozen: Object.keys(files).length, missing,
    sourceMismatch: sourceComparison.filter(x => x.actual !== x.expected),
    artifactMismatch: artifactComparison.filter(x => x.actual !== x.expected) }, null, 2))
} else if (mode === 'supplement') {
  const files = {}, missing = []
  scan(originalPlan, files, missing)
  const result = { at: new Date().toISOString(), files, missing,
    reason: 'planSHA names the original plan.json bytes, not the surrounding success-text response. Original observations retained.' }
  output('inputs-r2', result)
  console.log(JSON.stringify(result, null, 2))
} else if (mode === 'review') {
  const frozen = json(`${prefix}-inputs.json`)
  if (fs.existsSync(absolute(`${prefix}-inputs-r2.json`))) Object.assign(frozen.files, json(`${prefix}-inputs-r2.json`).files)
  const inheritedPrefixes = []
  const bytes = p => {
    const b = read(p)
    if (p === `${gateway}/gateway.stdout.ndjson` && frozen.files[p]
      && b.length > frozen.files[p].bytes && hash(b.subarray(0, frozen.files[p].bytes)) === frozen.files[p].sha256) {
      inheritedPrefixes.push({ path: p, frozenBytes: frozen.files[p].bytes, currentBytes: b.length,
        frozenSha: frozen.files[p].sha256, prefixExact: true })
      return b.subarray(0, frozen.files[p].bytes)
    }
    if (!frozen.files[p] || hash(b) !== frozen.files[p].sha256) throw new Error(`Unfrozen or drifted input: ${p}`)
    return b
  }
  const get = p => JSON.parse(bytes(p))
  const g = p => `${gateway}/${p}`
  const r = p => g(`cancel-apply-undo-r2/${p}`)
  const checks = []
  const check = (name, observed, evidence) => checks.push({ name, observed: Boolean(observed), evidence })
  const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
    .filter(k => a[k] !== b[k]).map(k => ({ path: k, before: a[k] ?? null, after: b[k] ?? null }))
  const business = o => Object.fromEntries(Object.entries(o).filter(([k]) => k.startsWith('/pmtool/') && !k.startsWith('/pmtool/settings/')))
  const entryList = p => get(p).record.value.entries
  const candidate = get(`${a12}/candidate.json`)
  const binding = get(g('source-binding.json'))
  check('A13-label-A12-actual-package', binding.candidate === 'A12'
    && binding.runtimePackage === path.join(candidate.tree, 'packages/dsh-pm-tool'), g('source-binding.json'))
  check('A12-tracked-patch-bytes', hash(bytes(`${a12}/product-tracked.patch`)) === candidate.trackedPatchSha, `${a12}/candidate.json`)
  check('A12-source-512-matches', frozen.sourceComparison.filter(x => x.tree === candidate.tree).every(x => x.actual === x.expected), `${prefix}-inputs.json`)
  check('A12-artifacts-453-matches', frozen.artifactComparison.every(x => x.actual === x.expected), `${prefix}-inputs.json`)

  const source = bytes(path.join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = source.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const loaded = get(g('loaded-r1/result.json'))
  const response = bytes(g('loaded-r1/combo-1.txt'))
  const index = response.indexOf(segment)
  const loadedEvent = loaded.events[0], loadedMatch = loadedEvent.matches[0]
  check('later-reload-full-unique-client-byte-binding', loaded.events.length === 1
    && loadedEvent.status === 200 && loadedEvent.fromDiskCache === false
    && hash(response) === loadedEvent.responseSha && response.length === loadedEvent.bytes
    && index === loadedMatch.first && index >= 0 && response.indexOf(segment, index + 1) === -1
    && segment.length === loadedMatch.segmentBytes && hash(segment) === loadedMatch.segmentSha
    && hash(source) === loadedMatch.sourceSha && loadedMatch.uniqueComplete
    && loaded.browserContextKind === 'default' && loaded.targetId === loadedEvent.frameId
    && loaded.state.origin === 'http://127.0.0.1:3241', g('loaded-r1'))
  const environment = get(g('environment.json')), host = get(g('host-start-r2.json'))
  const start = get(g('gateway-start.json'))
  check('recorded-host-gateway-owned-identities', host.pid === 90027 && start.pid === 89884
    && host.argv.includes('3241') && start.argv.includes('3240')
    && host.cwd === '/Users/bytedance/Projects/dsh-pm/deepseek-harness'
    && environment.package === binding.runtimePackage, [g('host-start-r2.json'), g('gateway-start.json')])
  const successText = start.argv[start.argv.indexOf('--success-text') + 1]
  const plan = JSON.parse(successText.match(/```json\s*([\s\S]*?)```/)[1]).plan
  check('original-plan-file-hash-and-response-plan-equality', hash(bytes(originalPlan)) === environment.planSHA
    && equal(get(originalPlan).plan, plan), [originalPlan, g('environment.json')])
  check('same-t1-chain-and-independent-t2', plan.length === 3
    && plan[0].stepId === 's1' && plan[1].stepId === 's2' && plan[2].stepId === 's3'
    && plan[0].action.id === 't-0001' && plan[1].action.id === 't-0001'
    && plan[2].action.id === 't-0002' && equal(plan.map(x => x.needs), [[], ['s1'], []]), g('gateway-start.json'))
  const http = bytes(g('gateway.stdout.ndjson')).toString().trim().split('\n').map(line => JSON.parse(line))
  check('two-real-http-success-results', [1, 2].every(n => http.some(x => x.type === 'request' && x.attempt === n
    && x.path === '/v1/messages' && x.behavior === 'success')
    && http.some(x => x.type === 'result' && x.attempt === n && x.outcome === 'completed' && x.chunksSent === 108)), g('gateway.stdout.ndjson'))
  const seed = get(g('seed/boundary.json')), backup = get(standard)
  check('empty-target-first-confirm-zero-and-standard-source', Object.keys(business(seed.before.data)).length === 0
    && equal(seed.before, seed.first) && seed.file === absolute(standard)
    && Object.keys(seed.after.files).length === 0 && Object.keys(seed.after.backups).length === 0, g('seed/boundary.json'))
  check('seed-source-tasks-and-ledger-exact', ['t1', 't2'].every((label, i) => equal(
    get(g(`cancel-apply-undo/initial-${label}.json`)).record, backup.tasks.find(x => x.id === `t-000${i + 1}`)))
    && equal(get(g('cancel-apply-undo/initial-ledger.json')).record,
      backup.extra.settings.find(([k]) => k === 'pmProvenanceLedger')[1]), [standard, g('cancel-apply-undo')])

  const snapshots = Object.fromEntries(['initial', 'cancelled', 'before-apply', 'applied', 'undone']
    .map(name => [name, Object.fromEntries(['t1', 't2', 'ledger'].map(label => [label, get(r(`${name}-${label}.json`))]))]))
  const cancelBefore = get(g('cancel-apply-undo/initial-t1.json'))
  check('cancel-preimage-to-r2-continuation-raw-equal', ['t1', 't2', 'ledger'].every(label =>
    bytes(g(`cancel-apply-undo/initial-${label}.json`)).equals(bytes(r(`initial-${label}.json`)))
    && bytes(r(`initial-${label}.json`)).equals(bytes(r(`cancelled-${label}.json`)))
    && bytes(r(`initial-${label}.json`)).equals(bytes(r(`before-apply-${label}.json`)))), [g('cancel-apply-undo'), r('initial-t1.json')])
  const cancelled = get(r('cancelled.json')), regenerated = get(r('regenerated-plan.json'))
  const appliedUI = get(r('applied.json')), undoneUI = get(r('undone.json'))
  check('cancelled-and-regenerated-and-undo-visible-states', cancelled.pm.text.includes('\u6682\u65e0\u8349\u7a3f')
    && regenerated.buttons.some(b => b.text === '\u6574\u6279\u6267\u884c\uff083\uff09')
    && regenerated.pm.text.includes('\u4f9d\u8d56\uff1as1')
    && appliedUI.buttons.some(b => b.text === '\u64a4\u9500 \u00b7 \u6574\u6279 3 \u6b65')
    && !undoneUI.buttons.some(b => b.text === '\u64a4\u9500 \u00b7 \u6574\u6279 3 \u6b65'), r('regenerated-plan.json'))
  check('page-continuity-not-retroactive-time-origin', [cancelled, regenerated, appliedUI, undoneUI].every(s =>
    s.origin === cancelled.origin && s.timeOrigin === cancelled.timeOrigin)
    && loaded.state.timeOrigin > undoneUI.timeOrigin && Date.parse(loaded.at) > Date.parse(undoneUI.at), g('loaded-r1/result.json'))
  const boundary = get(r('boundary.json'))
  check('r2-cancel-full-data-manifest-zero', equal(boundary.before, boundary.afterCancel), r('boundary.json'))
  const firstAsk = get(g('ask-three/boundary.json')), continued = get(g('ask-three/continued.json'))
  check('ask-through-cancel-no-business-write', equal(business(seed.after.data), business(firstAsk.before))
    && equal(business(firstAsk.before), business(firstAsk.after))
    && equal(business(firstAsk.before), business(continued.data))
    && equal(business(continued.data), business(boundary.before)), [g('ask-three/boundary.json'), g('ask-three/continued.json')])
  check('initial-runner-empty-is-not-success', get(g('ask-three/outer-exit.json')).exit === 0
    && get(g('ask-three/plan.json')).pm.text.includes('\u6682\u65e0\u8349\u7a3f')
    && get(g('ask-three/plan-ready.json')).buttons.some(b => b.text === '\u6574\u6279\u6267\u884c\uff083\uff09'), g('ask-three'))
  check('original-timeout-preserved', get(g('cancel-apply-undo/outer-exit.json')).exit === 1
    && get(g('cancel-apply-undo/outer-exit.json')).error.includes('[data-copilot-plan]')
    && get(g('cancel-apply-undo/command-events.json')).length === 0, g('cancel-apply-undo/outer-exit.json'))

  const events = get(r('command-events.json'))
  const runs = events.filter(x => x.event.type === 'command/run')
  const done = id => events.find(x => x.event.type === 'command/done' && x.event.data.commandId === id)?.event.data
  const apply = runs.find(x => x.event.data.args.trim().startsWith('ask-apply '))
  const args = apply.event.data.args.trim()
  const [actionText, baseText] = args.slice('ask-apply p-0001 '.length).split(' --base ')
  const actions = JSON.parse(actionText), base = JSON.parse(baseText)
  check('real-apply-actions-match-gateway-plan-and-actual-base', equal(actions, plan.map(x => ({
    ...x.action, stepId: x.stepId, title: x.title, needs: x.needs,
  }))) && equal(base, { 't-0001': snapshots['before-apply'].t1.record.updatedAt,
    't-0002': snapshots['before-apply'].t2.record.updatedAt }), r('command-events.json'))
  const ask = runs.find(x => x.event.data.args.trim().startsWith('ask '))
  check('real-regeneration-done-text-matches-original-response', done(ask.event.data.commandId).text === successText, r('command-events.json'))
  const list = runs.find(x => x.event.data.args.trim() === 'ask-undo list')
  const fresh = JSON.parse(done(list.event.data.commandId).text).undoIds[0]
  const undo = runs.find(x => x.event.data.args.trim() === `ask-undo ${fresh.id}`)
  check('apply-success-fresh-list-undo-success-order', runs.length === 7 && events.length === 14
    && runs.every(x => done(x.event.data.commandId)?.kind === 'success')
    && apply.event.seq < list.event.seq && list.event.seq < undo.event.seq
    && undo.event.time >= fresh.at && undo.event.time - fresh.at < 600000
    && done(apply.event.data.commandId).text.startsWith('\u5df2\u5e94\u7528 3 \u6b65')
    && done(undo.event.data.commandId).text === '\u5df2\u64a4\u9500 3 \u9879\uff08tasks/t-0002\uff1btasks/t-0001\uff1btasks/t-0001\uff09', r('command-events.json'))
  const initialEntries = entryList(r('initial-ledger.json')), appliedEntries = entryList(r('applied-ledger.json'))
  const undoneEntries = entryList(r('undone-ledger.json'))
  const newEntries = appliedEntries.filter(x => !initialEntries.some(old => old.id === x.id))
  const newEntry = newEntries[0], finalEntry = undoneEntries.find(x => x.id === newEntry.id)
  check('new-applied-only-unique-task-refs', newEntries.length === 1 && newEntry.kind === 'ask-apply'
    && newEntry.status === 'confirmed' && newEntry.projectId === 'p-0001'
    && newEntry.refs.length === 2 && equal(newEntry.refs.map(x => [x.table, x.id]), [['tasks', 't-0001'], ['tasks', 't-0002']])
    && newEntry.refs.every(ref => { const task = snapshots.applied[ref.id === 't-0001' ? 't1' : 't2'].record
      return ref.projectId === task.projectId && ref.label === task.title && ref.updatedAt === task.updatedAt
        && ref.role === 'basis' && ref.snapshotVersion === 1 && ref.ruleRevision === 1
        && Boolean(ref.basisFingerprint && ref.fullFingerprint)
    }), r('applied-ledger.json'))
  check('fresh-handle-not-restored-handle', newEntry.undo.handle === fresh.id
    && !initialEntries.some(x => x.undo?.handle === fresh.id) && newEntry.undo.used === false
    && finalEntry.undo.used === true && undo.event.time < newEntry.undo.expiresAt, r('undone-ledger.json'))
  check('old-ledger-unchanged-and-new-audit-append-only', appliedEntries.length === initialEntries.length + 1
    && undoneEntries.length === appliedEntries.length
    && initialEntries.every(x => equal(x, appliedEntries.find(y => y.id === x.id))
      && equal(x, undoneEntries.find(y => y.id === x.id)))
    && equal(finalEntry.history, newEntry.history) && equal(finalEntry.refs, newEntry.refs)
    && finalEntry.audit.length === newEntry.audit.length + 1
    && equal(finalEntry.audit.slice(0, newEntry.audit.length), newEntry.audit), r('undone-ledger.json'))
  check('two-t1-postimages-chain-and-t2-independent', newEntry.undo.postimages.length === 3
    && equal(newEntry.undo.postimages.map(x => x.id), ['t-0001', 't-0001', 't-0002'])
    && newEntry.undo.postimages[0].postimage.fields.assignee === cancelBefore.record.assignee
    && newEntry.undo.postimages[0].postimage.fields.progress === 62
    && newEntry.undo.postimages[1].postimage.updatedAt === snapshots.applied.t1.record.updatedAt
    && newEntry.undo.postimages[2].postimage.updatedAt === snapshots.applied.t2.record.updatedAt, r('applied-ledger.json'))
  check('applied-tasks-requested-values-and-untouched-history', snapshots.applied.t1.record.status === 'in_progress'
    && snapshots.applied.t1.record.progress === 62
    && snapshots.applied.t1.record.assignee === plan[1].action.patch.assignee
    && snapshots.applied.t2.record.progress === 22
    && ['description', 'attachments', 'progressLog'].every(k => equal(snapshots.applied.t1.record[k], snapshots.initial.t1.record[k])), r('applied-t1.json'))
  check('clean-two-task-full-original-exact-bytes', ['t1', 't2'].every(label =>
    bytes(r(`undone-${label}.json`)).equals(bytes(r(`before-apply-${label}.json`)))
    && bytes(r(`undone-${label}.json`)).equals(bytes(r(`initial-${label}.json`)))), [r('undone-t1.json'), r('undone-t2.json')])
  const snapshotRuns = runs.filter(x => x.event.data.args.trim() === 'web snapshot')
  check('real-snapshot-results-match-applied-and-undone-disk', snapshotRuns.length === 2
    && snapshotRuns.every((x, i) => { const snapshot = JSON.parse(done(x.event.data.commandId).text)
      return ['t1', 't2'].every((label, n) => equal(snapshot.tasks.find(t => t.id === `t-000${n + 1}`),
        snapshots[i === 0 ? 'applied' : 'undone'][label].record))
    }), r('command-events.json'))
  check('undo-no-unrelated-business-write', equal(business(boundary.before), business(boundary.after)), r('boundary.json'))
  check('r2-real-outer-exit-zero', get(r('outer-exit.json')).exit === 0, r('outer-exit.json'))

  const frameSummary = []
  for (const directory of ['seed', 'ask-three', 'cancel-apply-undo', 'cancel-apply-undo-r2']) {
    const indexPath = g(`${directory}/frames/frames.json`)
    const index = get(indexPath)
    const frameFiles = index.frames.map(frame => {
      const file = g(`${directory}/frames/${frame.file}`)
      return { file, sha256: hash(bytes(file)), expected: frame.sha256, at: frame.at,
        compositorTimestamp: frame.metadata.timestamp }
    })
    frameSummary.push({ directory, count: frameFiles.length, files: frameFiles })
    check(`${directory}-original-frame-hashes`, frameFiles.every(x => x.sha256 === x.expected), indexPath)
  }
  const result = { at: new Date().toISOString(), checks, inheritedPrefixes,
    count: checks.length, matches: checks.filter(x => x.observed).length,
    mismatches: checks.filter(x => !x.observed),
    commandTimeline: runs.map(x => ({ seq: x.event.seq, time: x.event.time, id: x.event.data.commandId,
      args: x.event.data.args, resultKind: done(x.event.data.commandId)?.kind })),
    originalTaskHashes: Object.fromEntries(['t1', 't2'].map(label => [label, Object.fromEntries(
      ['initial', 'cancelled', 'before-apply', 'applied', 'undone'].map(n => [n, hash(bytes(r(`${n}-${label}.json`)))]))])),
    manifestDeltas: { firstAsk: diff(firstAsk.before, firstAsk.after), cancelled: diff(boundary.before, boundary.afterCancel),
      final: diff(boundary.before, boundary.after) },
    newProvenanceId: newEntry.id, currentUndoHandle: fresh.id, frameSummary,
    loadedBinding: { laterAt: loaded.at, targetId: loaded.targetId, context: loaded.browserContextKind,
      firstPageTimeOrigin: cancelled.timeOrigin, laterPageTimeOrigin: loaded.state.timeOrigin,
      clientSha: hash(source), normalizedSegmentSha: hash(segment), comboSha: hash(response) },
    boundary: 'Mechanical evidence checks only. Independent limited GUI judgment and missing network-body/initial-load boundaries belong to the report; no whole RA-AI04 PASS.' }
  const suffix = process.argv[3] ?? 'observations'
  if (!['observations', 'observations-r2'].includes(suffix)) throw new Error('Invalid observation suffix')
  output(suffix, result)
  console.log(JSON.stringify({ count: result.count, matches: result.matches, mismatches: result.mismatches,
    manifestDeltas: result.manifestDeltas, newProvenanceId: newEntry.id, currentUndoHandle: fresh.id,
    frames: frameSummary.map(x => ({ directory: x.directory, count: x.count })) }, null, 2))
  if (result.mismatches.length) process.exitCode = 1
} else if (mode === 'final') {
  const frozen = json(`${prefix}-inputs.json`)
  Object.assign(frozen.files, json(`${prefix}-inputs-r2.json`).files)
  const files = {}, missing = []
  for (const p of Object.keys(frozen.files)) scan(p, files, missing)
  const drift = Object.keys(frozen.files).filter(p => !equal(files[p], frozen.files[p]))
  const evidence = {}, evidenceMissing = []
  scan(gateway, evidence, evidenceMissing)
  const originalEvidence = Object.keys(frozen.files).filter(p => p.startsWith(gateway + '/'))
  const addedEvidence = Object.keys(evidence).filter(p => !originalEvidence.includes(p))
  const git = currentGit()
  const candidate = json(`${a12}/candidate.json`)
  const stdout = `${gateway}/gateway.stdout.ndjson`
  const prefixExact = hash(read(stdout).subarray(0, frozen.files[stdout].bytes)) === frozen.files[stdout].sha256
  const scopeDrift = drift.filter(p => !p.startsWith(`${repo}/`) && !(p === stdout && prefixExact))
  const sourceChecked = Object.keys(frozen.files).filter(p => p.startsWith(`${candidate.tree}/`) && !p.includes('/lib/')).length
  const artifactChecked = Object.keys(candidate.artifacts).length
  const strictUnchanged = !drift.length && !addedEvidence.length && !missing.length && equal(git, frozen.git)
  const result = { at: new Date().toISOString(), checked: Object.keys(frozen.files).length,
    missing, drift, addedEvidence, evidenceMissing, git, gitUnchanged: equal(git, frozen.git),
    strictUnchanged, scopeDrift, scopeIntegrity: !scopeDrift.length && !missing.length,
    sourceChecked, artifactChecked,
    stdoutInheritance: { frozenBytes: frozen.files[stdout].bytes, currentBytes: read(stdout).length, prefixExact,
      frozenSha: frozen.files[stdout].sha256 },
    exclusions: 'Current main-tree copies and newly added same-name evidence are not the A12 running candidate; recorded but not inherited or signed.',
    boundary: 'Final read-only rehash, not a new GUI run, model run or release signoff.' }
  const suffix = process.argv[3] ?? 'drift-final'
  if (!['drift-final', 'drift-final-r2'].includes(suffix)) throw new Error('Invalid final suffix')
  output(suffix, result)
  console.log(JSON.stringify({ at: result.at, checked: result.checked, missing, drift,
    addedEvidence: addedEvidence.length, strictUnchanged, scopeDrift, scopeIntegrity: result.scopeIntegrity,
    sourceChecked, artifactChecked, stdoutInheritance: result.stdoutInheritance, gitUnchanged: result.gitUnchanged }, null, 2))
  if (suffix === 'drift-final-r2' ? !result.scopeIntegrity : !strictUnchanged) process.exitCode = 1
} else {
  throw new Error('Use freeze, supplement, review or final')
}

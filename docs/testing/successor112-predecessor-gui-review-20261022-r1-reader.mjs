import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/successor112-predecessor-gui-review-20261022-r1'
const evidence = `${repo}/reports/all-pending-evidence-20261021/Successor112GuiR1`
const combined = `${repo}/reports/all-pending-evidence-20261021/CombinedSuccessor112R1`
const freeze = '/private/tmp/pmtool-combined-successor112-20261022-r1'
const pkg = `${freeze}/packages/dsh-pm-tool`
const runtime = '/private/tmp/pmtool-successor112-gui-runtime-20261022-r1'
const phase = process.argv[2]
assert(['audit-r3', 'final'].includes(phase), 'Use audit-r3 or final; never overwrite receipts')
const output = `${repo}/${prefix}-${phase}.json`
assert(!fs.existsSync(output))
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const observed = new Map()
function read(file) {
  const bytes = fs.readFileSync(file)
  const fingerprint = { bytes: bytes.length, sha256: sha(bytes) }
  if (observed.has(file)) assert.deepEqual(fingerprint, observed.get(file))
  observed.set(file, fingerprint)
  return bytes
}
const json = file => JSON.parse(read(file).toString())
const raw = name => read(`${evidence}/${name}`)
const ej = name => json(`${evidence}/${name}`)
const changes = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => !isDeepStrictEqual(a[k], b[k])).sort()
const results = {}
const index = ej('index-r1.json')
assert.equal(index.sourceCount, 112)
assert.equal(Object.keys(index.files).length, 747)
const parsed = { json: 0, ndjson: 0, image: 0, other: 0 }
for (const [name, expected] of Object.entries(index.files)) {
  assert(!path.isAbsolute(name) && !name.split('/').includes('..'))
  const bytes = raw(name)
  assert.deepEqual({ bytes: bytes.length, sha256: sha(bytes) }, expected, name)
  if (name.endsWith('.json')) { JSON.parse(bytes.toString()); parsed.json++ }
  else if (name.endsWith('.ndjson')) {
    for (const line of bytes.toString().split('\n').filter(Boolean)) JSON.parse(line)
    parsed.ndjson++
  } else if (/\.(png|jpg)$/.test(name)) parsed.image++
  else parsed.other++
}
results.seal = { index: observed.get(`${evidence}/index-r1.json`), entries: 747,
  parsed, drift: 0, directoryAdditionsOutsideFixedIndexNotJudged: true }

const source = ej('final-source-binding.json')
const originalSource = json(`${combined}/source-files.json`)
const candidate = json(`${combined}/candidate.json`)
assert.deepEqual(source, originalSource)
assert.equal(source.count, 112)
assert.equal(Object.keys(source.source).length, 112)
assert.equal(source.baseline, '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd')
for (const [name, expected] of Object.entries(source.source)) {
  assert.equal(sha(read(`${repo}/${name}`)), expected, `main ${name}`)
  assert.equal(sha(read(`${freeze}/${name}`)), expected, `freeze ${name}`)
}
for (const [manifest, root, count] of [
  ['complete-inputs.json', pkg, 519], ['built-artifacts.json', `${pkg}/lib`, 455],
]) {
  const entries = json(`${combined}/${manifest}`)
  assert.equal(Object.keys(entries).length, count)
  for (const [name, expected] of Object.entries(entries)) {
    const bytes = read(`${root}/${name}`)
    assert.deepEqual({ bytes: bytes.length, sha256: sha(bytes) }, expected)
  }
}
const panelPath = 'packages/dsh-pm-tool/src/client/panel.tsx'
assert.equal(source.source[panelPath],
  '581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d')
const panel = read(`${repo}/${panelPath}`).toString()
assert(panel.includes('const checked = e.currentTarget.checked'))
assert(panel.includes('const predecessorIds = Array.from(checkedIds)'))
results.source = { baseline: source.baseline, declared: 112, completeInputs: 519,
  artifacts: 455, mainAndFrozenDeclaredHashesMatch: true,
  panelSha256: source.source[panelPath], candidate: observed.get(`${combined}/candidate.json`) }

const binding = ej('loaded-binding.json')
const originalLoad = ej('15-loaded-0.json')
const built = read(`${pkg}/lib/client.js`)
const loaded = raw('15-loaded-0.js')
const suffix = Buffer.from('//# sourceMappingURL=client.js.map')
assert(built.subarray(-suffix.length).equals(suffix))
const executable = built.subarray(0, built.length - suffix.length)
assert.equal(built.length, 1719114)
assert.equal(executable.length, 1719080)
assert.equal(loaded.indexOf(executable), 875361)
assert.equal(loaded.indexOf(executable, 875362), -1)
assert.equal(loaded.indexOf(built), -1)
assert.equal(sha(built), binding.fullClientSha256)
assert.equal(sha(executable), binding.executableSegmentSha256)
assert.equal(sha(loaded), binding.loadedResponseSha256)
assert.equal(loaded.length, 2597914)
assert.equal(originalLoad.exactClientUnique, false)
assert.equal(binding.exactUnique, true)
assert.equal(binding.offset, 875361)
results.loaded = { ...binding, suffixBytes: suffix.length,
  independentlyRecomputedUniqueExecutable: true, firstLoadCacheNotClaimed: true }

const host = ej('host-start.json')
assert.equal(host.pid, 92870)
assert.equal(host.port, 3262)
assert.equal(ej('host-ready.json').pid, host.pid)
assert.equal(host.bundle, pkg)
assert.equal(host.bundleSha256, sha(built))
assert.equal(host.candidateSha256, sha(read(`${combined}/candidate.json`)))
assert.equal(host.sourceSha256, sha(read(`${combined}/source-files.json`)))
assert.equal(candidate.sourceCount, 112)
const profile = `${runtime}/home/profiles/pm`
assert.equal(fs.realpathSync(`${profile}/node_modules/dsh-pm-tool`), pkg)
assert(raw('isolated-profile.yml').equals(read(`${profile}/cordis.patch.yml`)))
const profilePackage = json(`${profile}/package.json`)
assert(profilePackage.dsh.profile.bundles.includes('dsh-pm-tool'))
assert(read(`${profile}/cordis.yml`).toString().trim().endsWith('[]'))
results.profile = { host, resolvedPlugin: fs.realpathSync(`${profile}/node_modules/dsh-pm-tool`),
  patch: observed.get(`${profile}/cordis.patch.yml`),
  package: observed.get(`${profile}/package.json`),
  stalePackageLinkMetadata: profilePackage.dependencies['dsh-pm-tool'],
  actualLinkOverridesStalePackageLink: true, authenticationRead: false,
  activeProcessProbed: false, upstreamCommitNotReconstructedByThisReader: true }

const states = ['15-task-edit', '16-selected', '16-unselected', '16-hidden-selected',
  '17-hidden-saved', '17-hidden-reopened', '18-cycle-before-save',
  '18-cycle-rejected', '19-cycle-retry-draft', '19-cycle-retry-saved',
  '19-cycle-retry-reopened']
const ui = {}, roots = {}, task = {}
for (const name of states) {
  ui[name] = ej(`${name}.json`)
  roots[name] = ej(`${name}-roots.json`)
  assert.equal(ui[name].origin, 'http://127.0.0.1:3262')
  assert.equal(ui[name].timeOrigin, ui[states[0]].timeOrigin)
  assert.equal(Object.keys(roots[name]).length, 29)
  for (const [file, expected] of Object.entries(roots[name])) {
    if (file.startsWith('data/pmtool/')) {
      const bytes = raw(`${name}-raw/${file}`)
      assert.deepEqual({ bytes: bytes.length, sha256: sha(bytes) }, expected)
    }
  }
  task[name] = ej(`${name}-raw/data/pmtool/tasks/t-0004.json`).record
}
const preds = name => ui[name].fields.filter(x => x.name === 'predecessorIds' && x.checked)
  .map(x => x.value).sort()
const title = name => ui[name].fields.find(x => x.name === 'title')?.value
for (const [name, expected] of [
  ['16-selected', ['t-0003']], ['16-unselected', []], ['16-hidden-selected', []],
  ['17-hidden-reopened', ['t-0003']],
  ['18-cycle-before-save', ['t-0001', 't-0003']],
  ['18-cycle-rejected', ['t-0001', 't-0003']],
  ['19-cycle-retry-draft', ['t-0003']], ['19-cycle-retry-reopened', ['t-0003']],
]) assert.deepEqual(preds(name), expected, name)
for (const name of ['16-selected', '16-unselected', '16-hidden-selected']) {
  assert.equal(title(name), '前置修后选择临时标题')
  assert.equal(ui[name].dialogs[0].label, '编辑任务')
  assert.deepEqual(roots[name], roots['15-task-edit'])
}
assert(ui['16-hidden-selected'].text.includes('已选 1 项'))
assert.equal(ui['16-hidden-selected'].fields.find(x => x.aria === '搜索前置任务').value,
  'F3-fixture-F5')
assert.deepEqual(ej('16-selection-events.json').filter(x => x.method !== 'Page.screencastFrame'), [])
const t1 = ej('18-cycle-before-save-raw/data/pmtool/tasks/t-0001.json').record
assert.deepEqual(t1.predecessorIds, ['t-0004'])
assert.equal(t1.projectId, task['18-cycle-before-save'].projectId)

const transitions = {}
const hostSessionCache = 'data/session_projcache/sessions/session-7c6757cc-30e3-41fa-b8db-0d987e779161.json'
for (const [before, after, expected] of [
  ['15-task-edit', '16-hidden-selected', []],
  ['16-hidden-selected', '17-hidden-saved', ['data/pmtool/tasks/t-0004.json']],
  ['17-hidden-saved', '17-hidden-reopened', []],
  ['17-hidden-reopened', '18-cycle-before-save', [hostSessionCache]],
  ['18-cycle-before-save', '18-cycle-rejected', []],
  ['18-cycle-rejected', '19-cycle-retry-draft', [hostSessionCache]],
  ['19-cycle-retry-draft', '19-cycle-retry-saved', ['data/pmtool/tasks/t-0004.json']],
  ['19-cycle-retry-saved', '19-cycle-retry-reopened', []],
]) {
  const changed = changes(roots[before], roots[after])
  assert.deepEqual(changed, expected)
  transitions[`${before} -> ${after}`] = changed
}
for (const name of ['17-hidden-saved', '17-hidden-reopened', '18-cycle-rejected',
  '19-cycle-retry-saved', '19-cycle-retry-reopened']) {
  assert.equal(task[name].id, 't-0004')
  assert.equal(task[name].projectId, 'p-0001')
  assert.deepEqual(task[name].predecessorIds, ['t-0003'])
  for (const field of ['attachments', 'progressLog', 'description', 'createdAt', 'code', 'order'])
    assert.deepEqual(task[name][field], task['15-task-edit'][field])
}
assert.equal(task['17-hidden-reopened'].title, '前置修后选择临时标题')
assert.equal(title('18-cycle-rejected'), '成环拒绝应保留此标题')
assert.equal(task['18-cycle-rejected'].title, '前置修后选择临时标题')
assert.equal(title('19-cycle-retry-draft'), '成环拒绝应保留此标题')
assert.equal(task['19-cycle-retry-reopened'].title, '成环拒绝应保留此标题')
assert.equal(title('19-cycle-retry-reopened'), task['19-cycle-retry-reopened'].title)
for (const name of ['17-hidden-saved', '19-cycle-retry-saved'])
  assert.equal(ui[name].dialogs.length, 0)
assert.equal(ui['18-cycle-rejected'].dialogs[0].label, '编辑任务')
assert(ui['18-cycle-rejected'].alerts[0].text.includes(
  '前置依赖存在循环：任务不能间接地依赖自己'))

const rpc = {}
for (const [name, expectedPred, kind] of [
  ['17-hidden-save', ['t-0003'], 'success'],
  ['18-cycle-rejected', ['t-0003', 't-0001'], 'error'],
  ['19-cycle-retry', ['t-0003'], 'success'],
]) {
  const rows = ej(`${name}-events.json`)
  assert.equal(rows.filter(x => x.method === 'Runtime.exceptionThrown').length, 0)
  const requests = rows.filter(x => x.method === 'Network.requestWillBeSent')
  const update = requests.filter(x => x.body.payload.args.line.startsWith('/pm task update t-0004 '))
  assert.equal(update.length, 1)
  const request = update[0]
  const payload = JSON.parse(request.body.payload.args.line.slice('/pm task update t-0004 '.length))
  assert.deepEqual(payload.predecessorIds, expectedPred)
  const response = rows.find(x => x.method === 'Network.responseReceived'
    && x.requestId === request.requestId)
  assert.equal(response.status, 200)
  const envelope = JSON.parse(response.body.body)
  assert.equal(envelope.rpcId, request.body.rpcId)
  assert.equal(envelope.result.ok, true)
  assert.equal(envelope.result.value.result.kind, kind)
  if (kind === 'error') assert.equal(envelope.result.value.result.text,
    '前置依赖存在循环：任务不能间接地依赖自己')
  const snapshotRequest = requests.find(x => x.body.payload.args.line === '/pm web snapshot')
  if (kind === 'error') assert.equal(snapshotRequest, undefined)
  else {
    assert(snapshotRequest)
    const snapshotResponse = rows.find(x => x.method === 'Network.responseReceived'
      && x.requestId === snapshotRequest.requestId)
    const snapshotEnvelope = JSON.parse(snapshotResponse.body.body)
    assert.equal(snapshotEnvelope.rpcId, snapshotRequest.body.rpcId)
    const snapshot = JSON.parse(snapshotEnvelope.result.value.result.text)
    assert.deepEqual(snapshot.tasks.find(x => x.id === 't-0004').predecessorIds, ['t-0003'])
  }
  rpc[name] = { requestId: request.requestId, rpcId: envelope.rpcId,
    payload, kind, commandId: envelope.result.value.commandId,
    resultText: kind === 'error' ? envelope.result.value.result.text : 'success detail retained in original',
    snapshotReadback: !!snapshotRequest, runtimeExceptionCaptured: 0 }
}
results.predecessor = { states: Object.fromEntries(states.map(name => [name, {
  at: ui[name].at, title: title(name), visibleCheckedIds: preds(name),
  dialogs: ui[name].dialogs.map(x => x.label), storedTitle: task[name].title,
  storedPredecessorIds: task[name].predecessorIds ?? [],
}])), transitions, rpc, validReverseEdge: { t1: t1.id, predecessorIds: t1.predecessorIds },
  footprint: { pmtoolRawFilesPerState: 21, totalDeclaredRootsPerState: 29 },
  firstSaveTaskChangedFields: changes(task['15-task-edit'], task['17-hidden-saved']),
  retryTaskChangedFields: changes(task['19-cycle-retry-draft'], task['19-cycle-retry-saved']) }

const executionRoot = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
const cancelId = 'ccf4e815ed9eec9ae03a64ecf6a71932'
const cancelMeta = json(`${executionRoot}/${cancelId}/execution.json`)
const cancelOutput = read(`${executionRoot}/${cancelId}/output.log`).toString().trim()
assert.equal(cancelMeta.status, 'exited')
assert.equal(cancelMeta.outputComplete, true)
assert.equal(cancelMeta.exitCode, 0)
assert.equal(cancelMeta.pid, 97697)
assert.equal(cancelOutput, '{ formPresent: false, titlePresent: true, alerts: [] }')
assert.equal(read(`${executionRoot}/${cancelId}/stderr.log`).length, 0)
results.cleanCancel = { executionId: cancelId, pid: cancelMeta.pid, exitCode: 0,
  startedAtMs: cancelMeta.startedAtMs, finishedAtMs: cancelMeta.finishedAtMs,
  output: cancelOutput, outputFingerprint: observed.get(`${executionRoot}/${cancelId}/output.log`),
  script: observed.get(`${evidence}/19-cycle-retry.mjs`),
  within747Seal: false, screenshotAfterCancel: 'NOT_CAPTURED',
  dedicatedRootsAfterCancel: 'NOT_CAPTURED', freshCancelRpcWindow: 'NOT_CAPTURED',
  qualification: 'Real execution output, not executor narrative; script/time/result cross-reference only' }

const observations = ej('executor-observations.json')
const aiBefore = ej('19-cycle-retry-reopened-raw/data/pmtool/settings/aiModelMode.json')
const aiAfter = ej('21-auth-raw/data/pmtool/settings/aiModelMode.json')
assert.equal(aiBefore.record.value, 'prod')
assert.equal(aiAfter.record.value, 'prod')
assert.deepEqual(changes(aiBefore.record, aiAfter.record), ['updatedAt'])
assert.equal(observations.firstSealExit, 1)
assert.equal(aiBefore.record.updatedAt, observations.laneBefore.updatedAt)
assert.equal(aiAfter.record.updatedAt, observations.laneAfter.updatedAt)
for (const name of ['21-auth', '22-rate', '22-normal']) {
  const changed = changes(roots['19-cycle-retry-reopened'], ej(`${name}-roots.json`))
  assert.deepEqual(changed, ['data/pmtool/settings/aiModelMode.json', hostSessionCache])
}
results.settingsQualification = { firstSealExit: observations.firstSealExit,
  firstSealReason: observations.firstSealReason,
  before: aiBefore.record, after: aiAfter.record,
  verifiedOnlyChangedProductRoot: 'data/pmtool/settings/aiModelMode.json',
  additionalHostCacheChanged: hostSessionCache,
  verifiedOnlyChangedRecordField: 'updatedAt', allSettingsZeroWriteClaimRejected: true,
  noAiGuiVerdictIssued: true }
for (const file of [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/feedback-remaining-gui-20261022-r1-plan.md',
  'docs/testing/main-o3-o5-samepage-assertions-20261020.md',
  'docs/plans/2026-10-22-task-predecessor-selection-closure.md',
  'docs/plans/2026-10-22-combined-successor-112-regression.md',
  'docs/testing/task-predecessor-selection-independent-retest-20261022-r1-report.md',
  'docs/testing/combined-successor112-regression-independent-review-20261022-r1-report.md',
]) read(`${repo}/${file}`)
if (phase === 'final') {
  const prior = json(`${repo}/${prefix}-audit-r3.json`)
  for (const [file, fingerprint] of Object.entries(prior.readFingerprints))
    assert.deepEqual({ bytes: read(file).length, sha256: sha(read(file)) }, fingerprint, file)
  results.priorAuditOriginalsUnchanged = true
}
for (const [file, fingerprint] of observed)
  assert.deepEqual({ bytes: fs.readFileSync(file).length, sha256: sha(fs.readFileSync(file)) },
    fingerprint, `end-of-reader drift: ${file}`)
fs.writeFileSync(output, JSON.stringify({ at: new Date().toISOString(), phase,
  actor: 'Independent GUI evidence reviewer; no product or GUI execution',
  node: process.version, platform: process.platform,
  results, readFingerprints: Object.fromEntries(observed),
  productTestsExecuted: 0, helperExecuted: false, browserOperated: false,
  independentVerdict: 'Mechanical checks only; see signed Markdown for limited GUI verdict',
}, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ phase, sealEntries: 747, declaredSource: 112,
  readFiles: observed.size, originalDrift: 0, productTestsExecuted: 0,
  output: path.relative(repo, output) }))

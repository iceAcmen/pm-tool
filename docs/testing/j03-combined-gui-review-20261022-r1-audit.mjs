import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

// Evidence-only audit: no product imports, network, browser, Git or service calls.
const own = fileURLToPath(import.meta.url).replace(/-audit\.mjs$/, '')
const repo = path.resolve(path.dirname(own), '../..')
const root = path.join(repo, 'reports/all-pending-evidence-20261021/CombinedGuiR1')
const parent = path.join(root, '../CombinedRepairR1/r2')
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const read = file => fs.readFileSync(file)
const json = file => JSON.parse(read(file))
const local = name => json(path.join(root, name))
const entry = b => ({ bytes: b.length, sha256: sha(b) })
const changes = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).sort()
const declared = local('j03-index.json')
assert.equal(declared.count, 468)
assert.equal(Object.keys(declared.files).length, 468)
const integrity = {}
for (const [rel, expected] of Object.entries(declared.files)) {
  assert(!path.isAbsolute(rel) && !rel.split('/').includes('..'))
  const file = path.join(root, rel)
  assert(fs.lstatSync(file).isFile(), rel)
  const actual = entry(read(file))
  assert.deepEqual(actual, expected, rel)
  integrity[rel] = actual
}

const source = local('j03-source-binding.json')
const candidate = json(path.join(parent, 'candidate.json'))
const parentSource = json(path.join(parent, 'source-files.json'))
assert.deepEqual(source.source, parentSource.source)
assert.equal(source.baseline, candidate.baseline)
assert.equal(source.sourceCount, 107)
assert.equal(Object.keys(source.source).length, 107)
assert.equal(candidate.sourceCount, 107)
assert.equal(candidate.completeInputCount, 515)
assert.equal(source.frozen, candidate.freeze)
const independentMaterialRefMatches = {}
for (const rel of ['src/client/shared/task-draft-materials.tsx',
  'src/client/shared/task-draft-materials-refs-dom.test.tsx']) {
  const file = path.join(repo,
    'docs/testing/material-progress-ref-independent-retest-20261022-r1-selftmp/r1/frozen/packages/dsh-pm-tool', rel)
  const actual = sha(read(file))
  assert.equal(actual, source.source['packages/dsh-pm-tool/' + rel])
  independentMaterialRefMatches[rel] = actual
}
const sourceChecks = {}
for (const [rel, hash] of Object.entries(source.source)) {
  // Launcher is outside the package freeze; do not freeze or require Main's current tree.
  if (!rel.startsWith('packages/')) continue
  const actual = sha(read(path.join(source.frozen, rel)))
  assert.equal(actual, hash, rel)
  sourceChecks[rel] = actual
}
const inputs = json(path.join(parent, 'complete-inputs.json'))
assert.equal(Object.keys(inputs).length, 515)
for (const [rel, expected] of Object.entries(inputs)) {
  assert.deepEqual(entry(read(path.join(candidate.pkg, rel))), expected, rel)
}
assert.equal(json(path.join(candidate.pkg, 'package.json')).version, candidate.version)
const host = local('host-start.json')
assert.equal(host.pid, 60387)
assert.equal(host.port, 3260)
assert.equal(host.bundle, candidate.pkg)
assert.equal(source.runtime, '/private/tmp/pmtool-combined-gui-runtime-20261022-r1')
assert.equal(source.host, 3260)
assert.equal(source.pid, 60387)
assert.equal(source.space, 13)
assert.equal(source.page, 'p3')
assert.equal(host.sourceSha256, sha(read(path.join(parent, 'source-files.json'))))
assert.equal(host.candidateSha256, sha(read(path.join(parent, 'candidate.json'))))
assert.equal(host.flags.DSH_PM_E2E, '0')
assert.deepEqual(local('host-ready.json').pid, host.pid)
const profileLink = fs.readlinkSync(path.join(source.runtime, 'home/profiles/pm/node_modules/dsh-pm-tool'))
assert.equal(profileLink, candidate.pkg)
const profile = read(path.join(source.runtime, 'home/profiles/pm/cordis.patch.yml'))
assert.deepEqual(profile, read(path.join(root, 'isolated-profile.yml')))

const loaded = local('loaded-binding.json')
const compiled = read(path.join(candidate.pkg, 'lib/client.js'))
const served = read(path.join(root, 'loaded-complete.js'))
assert.deepEqual(entry(compiled), { bytes: loaded.compiledBytes, sha256: loaded.compiledSha256 })
assert.deepEqual(entry(served), { bytes: loaded.loadedBytes, sha256: loaded.loadedSha256 })
assert.equal(host.bundleSha256, loaded.compiledSha256)
assert.deepEqual(json(path.join(parent, 'built-artifacts.json'))['client.js'], entry(compiled))
const marker = Buffer.from('\n//# sourceMappingURL=')
const markerOffset = compiled.lastIndexOf(marker)
assert(markerOffset > 0)
const segment = compiled.subarray(0, markerOffset)
const offset = served.indexOf(segment)
assert.equal(segment.length, loaded.segmentBytes)
assert.equal(offset, loaded.offset)
assert.equal(served.indexOf(segment, offset + 1), -1)
assert.equal(loaded.second, -1)
assert.equal(loaded.origin, 'http://127.0.0.1:3260')

const states = Object.keys(declared.files).filter(f => f.endsWith('-roots.json')).sort()
const rawChecks = {}
const ui = {}
for (const file of states) {
  const name = file.replace(/-roots\.json$/, '')
  const roots = local(file)
  const copied = Object.keys(roots).filter(k => k.startsWith('data/pmtool/'))
  for (const rel of copied) {
    const raw = path.join(root, name + '-raw', rel)
    assert.deepEqual(entry(read(raw)), roots[rel], raw)
    const envelope = json(raw)
    assert.equal(envelope.version, 2, raw)
    assert(envelope.record && typeof envelope.record === 'object', raw)
  }
  rawChecks[name] = { rootsCount: Object.keys(roots).length, pmtoolRawCount: copied.length }
  const state = local(name + '.json')
  ui[name] = {
    at: state.at, origin: state.origin, viewport: state.viewport, dark: state.dark,
    timeOrigin: state.timeOrigin, pilot: state.pilot,
    dialogs: state.dialogs?.map(d => ({ label: d.label, bbox: d.bbox }))
  }
}
const roots = name => local(name + '-roots.json')
const compare = (a, b) => ({ before: a, after: b, changed: changes(roots(a), roots(b)) })
const transitions = [
  compare('03-j03-new-draft', '06r2-j03-c2-checked'),
  compare('06r2-j03-c2-checked', '07-j03-file-ready'),
  compare('07-j03-file-ready', '08-j03-progress-staged'),
  compare('08-j03-progress-staged', '09r2-j03-cancel-confirm'),
  compare('09r2-j03-cancel-confirm', '10r3-j03-kept'),
  compare('10r3-j03-kept', '11r3-j03-discarded'),
  compare('03-j03-new-draft', '11r3-j03-discarded'),
  compare('11r3-j03-discarded', '12-j03-rebuilt-before-save'),
  compare('12-j03-rebuilt-before-save', '13-j03-saved'),
  compare('13-j03-saved', '14-j03-reopened'),
  compare('13-j03-saved', '18-j03-clean-close')
]
assert.deepEqual(transitions[0].changed, [])
assert.deepEqual(transitions[1].changed, [
  'files/staging/0f83954c163c325cd7d215ce924b128a.bin',
  'files/staging/0f83954c163c325cd7d215ce924b128a.json'
])
for (const i of [2, 3, 4, 6, 9]) assert.deepEqual(transitions[i].changed, [])
const taskPath = 'data/pmtool/tasks/t-0004.json'
const stageId = 'c56960437386ebf8b4b8e1870e7cceea'
assert.deepEqual(transitions[8].changed, [
  taskPath, `files/staging/${stageId}.bin`, `files/staging/${stageId}.json`
].sort())
assert(!roots('12-j03-rebuilt-before-save')[taskPath])
assert.equal(Object.keys(roots('13-j03-saved')).filter(k => k.startsWith('files/staging/')).length, 0)
const task = local('13-j03-saved-raw/' + taskPath).record
assert.equal(task.id, 't-0004')
assert.equal(task.projectId, 'p-0001')
assert.equal(task.attachments.length, 3)
assert.deepEqual(task.attachments.map(a => [a.id, a.kind]), [
  ['at-1', 'link'], ['at-2', 'link'], ['at-3', 'file']
])
assert.deepEqual(task.attachments.slice(0, 2).map(a => a.url), [
  'https://example.com/j03/first', 'https://example.com/j03/second'
])
assert.equal(task.attachments[2].assetId, 'fa-0001')
assert.equal(task.progressLog.length, 1)
assert.deepEqual(task.progressLog[0].refs, ['at-2', 'at-3'])
assert.deepEqual(task.progressLog[0].revisions[0].refs, ['at-2', 'at-3'])
assert.equal(task.progressLog[0].revisions.length, 1)
assert.equal(task.progressLog[0].revisions[0].author, '修后验收作者')
assert.equal(task.progressLog[0].revisions[0].date, '2026-10-21')
assert.equal(task.progressLog[0].revisions[0].content, 'J03修后进展，引用第二资料与真实文件。')
const reentryChanges = {}
for (const name of ['14-j03-reopened', '15-j03-reopen-materials-visible',
  '16-j03-reopen-progress-visible', '17-j03-downloaded', '18-j03-clean-close']) {
  const changed = changes(roots('13-j03-saved'), roots(name))
  reentryChanges[name] = changed
  assert.deepEqual(changed.filter(k => !k.startsWith('data/session_projcache/sessions/')), [], name)
}

const events = {}
const exceptions = []
for (const file of Object.keys(declared.files).filter(f => f.endsWith('-events.json'))) {
  const rows = local(file)
  events[file] = { frames: 0, requests: [], responses: [] }
  for (const row of rows) {
    if (row.method === 'Page.screencastFrame') {
      assert.equal(sha(read(path.join(root, row.file))), row.sha256)
      events[file].frames++
    } else if (row.method === 'Network.requestWillBeSent') {
      events[file].requests.push({ requestId: row.requestId, line: row.body.payload.args.line })
    } else if (row.method === 'Network.responseReceived') {
      const body = JSON.parse(row.body.body)
      events[file].responses.push({
        requestId: row.requestId, status: row.status, rpcId: body.rpcId,
        kind: body.result?.value?.result?.kind
      })
    } else if (row.method === 'Runtime.exceptionThrown') exceptions.push({ file, ...row })
  }
}
const saveEvents = local('13-j03-main-save-events.json')
const saveRequests = saveEvents.filter(e => e.method === 'Network.requestWillBeSent')
assert.equal(saveRequests.length, 2)
const add = saveRequests.filter(e => e.body.payload.args.line.startsWith('/pm task add '))
assert.equal(add.length, 1)
const payload = JSON.parse(add[0].body.payload.args.line.slice('/pm task add '.length))
assert.deepEqual(payload.draft.attachmentOps.map(a => a.clientId), ['c-1', 'c-2', 'c-3'])
assert.equal(payload.draft.attachmentOps[2].stageId, stageId)
assert.deepEqual(payload.draft.progressOps[0].refs, ['c-2', 'c-3'])
assert.equal(saveRequests[1].body.payload.args.line, '/pm web snapshot')
for (const req of saveRequests) {
  const res = saveEvents.find(e => e.method === 'Network.responseReceived' && e.requestId === req.requestId)
  assert(res)
  const body = JSON.parse(res.body.body)
  assert.equal(body.rpcId, req.body.rpcId)
  assert.equal(body.result.value.result.kind, 'success')
}
const download = read(path.join(root, '17-j03-downloaded.md'))
const original = read(path.join(root, '../MaterialRemainingR1/qa-j03-note.md'))
const downloadEntry = entry(download)
assert.deepEqual(download, original)
assert.deepEqual(downloadEntry, {
  bytes: 22, sha256: '87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a'
})
const asset = local('13-j03-saved-raw/data/pmtool/file_assets/fa-0001.json').record
assert.equal(asset.sha256, downloadEntry.sha256)
assert.equal(asset.size, downloadEntry.bytes)
assert.deepEqual(roots('12-j03-rebuilt-before-save')[`files/staging/${stageId}.bin`], downloadEntry)

const executions = Object.keys(declared.files)
  .filter(f => f.startsWith('j03-executions/') && f.endsWith('.json')).map(file => {
    const meta = local(file)
    assert.equal(meta.status, 'exited')
    assert.equal(meta.outputComplete, true)
    const log = read(path.join(root, file.replace(/\.json$/, '.log'))).toString()
    return {
      file, id: meta.executionId, pid: meta.pid, exitCode: meta.exitCode,
      startedAtMs: meta.startedAtMs, finishedAtMs: meta.finishedAtMs,
      outputComplete: meta.outputComplete,
      error: meta.exitCode ? log : null
    }
  })
assert.equal(executions.length, 17)
assert.equal(executions.filter(e => e.exitCode !== 0).length, 5)
const observation = local('j03-observation.json')
assert.deepEqual(observation.cancelled, transitions[6].changed)
assert.deepEqual(observation.saveChanges.sort(), transitions[8].changed)
assert.deepEqual(observation.attachments, task.attachments)
assert.deepEqual(observation.progressLog, task.progressLog)
const result = {
  at: new Date().toISOString(), mode: 'READ_ONLY_EVIDENCE_AUDIT_NOT_PRODUCT_TEST',
  index: entry(read(path.join(root, 'j03-index.json'))), declaredCount: 468,
  integrity, binding: {
    baseline: source.baseline, sourceCount: 107,
    frozenPackageSourcesChecked: Object.keys(sourceChecks).length,
    launcherCountRecordOnly: 107 - Object.keys(sourceChecks).length,
    completeInputsChecked: 515, sourceChecks,
    candidate: entry(read(path.join(parent, 'candidate.json'))),
    parentSource: entry(read(path.join(parent, 'source-files.json'))),
    relativePatch: entry(read(path.join(parent, 'tracked-product.diff'))),
    newFiles: entry(read(path.join(parent, 'new-product-files.txt'))),
    sourceBinding: entry(read(path.join(root, 'j03-source-binding.json'))),
    observation: entry(read(path.join(root, 'j03-observation.json'))),
    runtime: source.runtime, profileLink, profile: entry(profile),
    host, ready: local('host-ready.json'), loaded, segmentSha256: sha(segment),
    frozenCompiled: entry(compiled), declaredServed: entry(served),
    independentMaterialRefMatches,
    boundary: 'No live probe; package freeze only. Launcher source record not Main lock. Host commit and complete network history not supplied by this packet.'
  },
  rawChecks, ui, transitions, reentryChanges, task, payload, events, exceptions, executions,
  download: { ...downloadEntry, source: entry(original), asset },
  visualOriginals: Object.keys(declared.files).filter(f => /\.(png|jpg)$/.test(f)),
  boundary: 'Audit exit0 is not GUI PASS. Host/files bytes only manifests except downloaded/source file. Events are bounded command-only drains, not all network/console coverage.'
}
const mode = process.argv[2] || 'audit'
assert(['audit', 'close'].includes(mode))
if (mode === 'close') {
  const prior = json(own + '-audit.json')
  assert.deepEqual(result.integrity, prior.integrity)
  assert.deepEqual(result.index, prior.index)
  for (const suffix of ['-audit.mjs', '-audit.json', '.md']) {
    result['own' + suffix] = entry(read(own + suffix))
  }
}
fs.writeFileSync(own + '-' + mode + '.json', JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({
  mode, declared: 468, completeInputs: 515,
  sourcePackageFiles: Object.keys(sourceChecks).length, images: result.visualOriginals.length,
  rawSnapshots: states.length, rawRecords: Object.values(rawChecks).reduce((n, s) => n + s.pmtoolRawCount, 0),
  cancelChanges: transitions[6].changed, saveChanges: transitions[8].changed,
  download: downloadEntry, executions: 17, nonzero: 5, capturedExceptions: exceptions.length
}, null, 2))

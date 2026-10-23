import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const root = path.join(repo, 'reports/all-pending-evidence-20261021/Successor112GuiR1')
const prefix = path.join(repo, 'docs/testing/successor112-fixed-export-gui-review-20261022-r1')
const phase = process.argv[2]
assert(['audit', 'close'].includes(phase))
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const fingerprint = b => ({ bytes: b.length, sha256: sha(b) })
const observed = {}
function read(file) {
  const b = fs.readFileSync(file)
  observed[file] = fingerprint(b)
  return b
}
const raw = n => read(path.join(root, n))
const json = n => JSON.parse(raw(n))
const record = (s, rel) => {
  const j = json(`${s}-raw/data/pmtool/${rel}.json`)
  assert.equal(j.version, 2)
  return j.record
}
const manifestBytes = raw('index-r1.json')
const manifest = JSON.parse(manifestBytes)
assert.equal(manifest.sourceCount, 112)
assert.equal(Object.keys(manifest.files).length, 747)
const missing = [], differences = []
for (const [rel, info] of Object.entries(manifest.files)) {
  assert(!path.isAbsolute(rel) && !rel.split('/').includes('..'))
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) { missing.push(rel); continue }
  const actual = fingerprint(read(file))
  if (actual.bytes !== info.bytes || actual.sha256 !== info.sha256) differences.push({ rel, info, actual })
}
function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const file = path.join(dir, e.name)
    assert(!e.isSymbolicLink(), `Unexpected evidence symlink: ${file}`)
    return e.isDirectory() ? walk(file, base) : [path.relative(base, file)]
  })
}
const extras = walk(root).filter(n => n !== 'index-r1.json' && !Object.hasOwn(manifest.files, n))
assert.deepEqual(missing, [])
assert.deepEqual(differences, [])

const source = json('final-source-binding.json')
const originalSource = JSON.parse(read(path.join(repo, 'reports/all-pending-evidence-20261021/CombinedSuccessor112R1/source-files.json')))
assert.deepEqual(source, originalSource)
assert.equal(source.count, 112)
assert.equal(Object.keys(source.source).length, 112)
assert.equal(source.source['packages/dsh-pm-tool/src/core/progress-report-markdown.ts'],
  '94290aaf54764628161e84f11d1bd495f7cb965c4178ea155d52b2d28ac99fbf')
const artifacts = JSON.parse(read(path.join(repo, 'reports/all-pending-evidence-20261021/CombinedSuccessor112R1/built-artifacts.json')))
const loaded = json('loaded-binding.json'), initialLoaded = json('15-loaded-0.json')
const response = raw('15-loaded-0.js')
assert.deepEqual(fingerprint(response), { bytes: loaded.loadedResponseBytes, sha256: loaded.loadedResponseSha256 })
assert.deepEqual(artifacts['client.js'], { bytes: loaded.fullClientBytes, sha256: loaded.fullClientSha256 })
const segment = response.subarray(loaded.offset, loaded.offset + loaded.executableSegmentBytes)
assert.equal(sha(segment), loaded.executableSegmentSha256)
assert.equal(response.indexOf(segment), loaded.offset)
assert.equal(response.indexOf(segment, loaded.offset + 1), -1)
const suffix = Buffer.from('//# sourceMappingURL=client.js.map')
const reconstructed = Buffer.concat([segment, suffix])
assert.deepEqual(fingerprint(reconstructed), artifacts['client.js'])
assert.equal(response.indexOf(reconstructed), -1)
assert.equal(initialLoaded.exactClientUnique, false)
assert.equal(loaded.originalFullByteComparisonFalseRetained, true)
const host = json('host-start.json'), ready = json('host-ready.json')
assert.equal(host.pid, 92870); assert.equal(host.port, 3262)
assert.equal(ready.pid, host.pid); assert.equal(ready.port, host.port)
assert.equal(host.bundleSha256, artifacts['client.js'].sha256)
assert(host.bundle.includes('pmtool-combined-successor112-20261022-r1'))
assert(host.argv.includes('3262'))

const states = ['25-export-open', '29-report-dates', '32-date-native', '33-candidates',
  '36-report-two-selected', '36-report-fixed', '41-source-edited', '41-source-deleted',
  '43-fixed-source-deleted', '43-fixed-export']
const stateInfo = {}, roots = {}
for (const s of states) {
  const ui = json(`${s}.json`)
  assert.equal(ui.origin, 'http://127.0.0.1:3262')
  assert.equal(ui.timeOrigin, 1792677670591.4)
  assert.equal(ui.viewport.innerWidth, 1458)
  assert.equal(ui.viewport.innerHeight, 734)
  assert.equal(ui.dark, true)
  roots[s] = json(`${s}-roots.json`)
  let businessRawCount = 0
  for (const [rel, info] of Object.entries(roots[s])) {
    if (!rel.startsWith('data/pmtool/')) continue
    assert.deepEqual(fingerprint(raw(`${s}-raw/${rel}`)), info)
    businessRawCount++
  }
  stateInfo[s] = { at: ui.at, viewport: ui.viewport, businessRawCount,
    rootEntryCount: Object.keys(roots[s]).length, focus: ui.focus,
    dateValues: ui.fields.filter(f => f.type === 'date').map(f => f.value),
    checked: ui.fields.filter(f => f.type === 'checkbox').map(f => f.checked) }
}
assert(json('29-report-dates.json').text.includes('已选 0/0'))
assert.deepEqual(stateInfo['29-report-dates'].dateValues, ['2026-10-19', '2026-10-21'])
assert(json('32-date-native.json').text.includes('已选 0/0'))
assert.deepEqual(stateInfo['32-date-native'].dateValues, ['', ''])
assert(json('33-candidates.json').text.includes('已选 3/3'))
assert(json('36-report-two-selected.json').text.includes('已选 2/3'))
assert.deepEqual(stateInfo['36-report-two-selected'].checked, [false, true, true, false])
const changed = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const rootTransitions = []
for (let i = 1; i < states.length; i++) {
  const a = states[i - 1], b = states[i]
  rootTransitions.push({ from: a, to: b, changed: changed(roots[a], roots[b]) })
}
for (const [a, b] of [['25-export-open', '29-report-dates'], ['29-report-dates', '32-date-native'],
  ['32-date-native', '33-candidates'], ['33-candidates', '36-report-two-selected']])
  assert.deepEqual(changed(roots[a], roots[b]).filter(k => k.startsWith('data/pmtool/')), [])
assert.deepEqual(changed(roots['36-report-two-selected'], roots['36-report-fixed']),
  ['data/pmtool/reports/rpt-0002.json'])
assert.deepEqual(changed(roots['41-source-edited'], roots['41-source-deleted']),
  ['data/pmtool/tasks/t-0001.json'])
assert.deepEqual(changed(roots['41-source-deleted'], roots['43-fixed-source-deleted'])
  .filter(k => k.startsWith('data/pmtool/')), [])
assert.deepEqual(changed(roots['43-fixed-source-deleted'], roots['43-fixed-export']), [])

const savedBytes = raw('36-report-fixed-raw/data/pmtool/reports/rpt-0002.json')
const saved = JSON.parse(savedBytes).record
const reportFingerprints = {}
for (const s of states.slice(5)) {
  const b = raw(`${s}-raw/data/pmtool/reports/rpt-0002.json`)
  assert(b.equals(savedBytes))
  reportFingerprints[s] = fingerprint(b)
}
assert.equal(saved.id, 'rpt-0002'); assert.equal(saved.sourceType, 'manual')
assert.equal(saved.sourceSessionId, null)
const sixFields = saved.excerpts.map(e => ({
  taskId: e.taskId, entryId: e.entryId, revisionId: e.revisionId,
  author: e.author, date: e.date, contentSnapshot: e.contentSnapshot,
}))
assert.deepEqual(sixFields, [
  { taskId: 't-0001', entryId: 'pl-3', revisionId: 'rv-1', author: '\u6d4b\u8bd5\u4e59',
    date: '2026-10-19', contentSnapshot: 'E3 rv1\u540c\u65e5\u5f02ID' },
  { taskId: 't-0001', entryId: 'pl-1', revisionId: 'rv-3', author: '\u6d4b\u8bd5\u7532',
    date: '2026-10-21', contentSnapshot: 'E1 rv3\u6b63\u6587' },
])
const old = record('25-export-open', 'reports/rpt-0001')
assert.equal(old.id, 'rpt-0001')
assert(!Object.hasOwn(old, 'excerpts'))
const beforeTask = record('36-report-fixed', 'tasks/t-0001')
const afterEdit = record('41-source-edited', 'tasks/t-0001')
const afterDelete = record('41-source-deleted', 'tasks/t-0001')
assert(Array.isArray(beforeTask.progressLog))
const beforeEntry = beforeTask.progressLog.find(e => e.id === 'pl-1')
const editEntry = afterEdit.progressLog.find(e => e.id === 'pl-1')
const deletedEntry = afterDelete.progressLog.find(e => e.id === 'pl-1')
assert.deepEqual(editEntry.revisions.slice(0, 3), beforeEntry.revisions)
assert.equal(editEntry.revisions.length, 4)
assert.equal(editEntry.revisions[3].id, 'rv-4')
assert.equal(editEntry.revisions[3].author, '\u6e90\u6539\u4f5c\u8005')
assert.equal(editEntry.revisions[3].date, '2026-10-22')
assert.deepEqual(deletedEntry.revisions, editEntry.revisions)
assert(deletedEntry.deletedAt)
for (const entry of beforeTask.progressLog.filter(e => e.id !== 'pl-1')) {
  assert.deepEqual(afterEdit.progressLog.find(e => e.id === entry.id), entry)
  assert.deepEqual(afterDelete.progressLog.find(e => e.id === entry.id), entry)
}

const mdBytes = raw('43-fixed-export.md'), md = mdBytes.toString('utf8')
const blocks = [...md.matchAll(/^```\n([\s\S]*?)^```$/gm)].map(m => m[1])
assert.equal(blocks.length, 2)
const occurrences = (text, term) => text.split(term).length - 1
const excerptChecks = saved.excerpts.map((e, i) => {
  const literal = `\u4efb\u52a1\uff1a${e.taskId} / \u8fdb\u5c55\uff1a${e.entryId} / \u4fee\u8ba2\uff1a${e.revisionId}\n\u4f5c\u8005\uff1a${e.author} / \u65e5\u671f\uff1a${e.date}\n\n${e.contentSnapshot}\n`
  assert.equal(blocks[i], literal)
  assert.equal(occurrences(md, e.contentSnapshot), 1)
  assert.equal(occurrences(md, literal.trimEnd()), 1)
  return { ...sixFields[i], exactBlock: true, contentOccurrences: 1 }
})
const unselected = record('36-report-fixed', 'tasks/t-0004').progressLog
const excluded = [editEntry.revisions[3].content, editEntry.revisions[3].author,
  ...unselected.flatMap(e => e.revisions.map(r => r.content))]
for (const text of excluded) assert.equal(occurrences(md, text), 0)
assert.equal(mdBytes.length, 1468)
assert.equal(savedBytes.length, 2397)

const eventFiles = ['32-date-native-events.json', '33-dates-change-events.json',
  '36-report-fixed-events.json', '41-source-edit-command.json',
  '41-source-delete-command.json', '43-fixed-export-events.json', '25-export-open-events.json']
const eventsSummary = []
for (const file of eventFiles) {
  const container = json(file), rows = container.rows || container
  const requests = rows.filter(e => e.method === 'Network.requestWillBeSent')
  const responses = rows.filter(e => e.method === 'Network.responseReceived')
  const pairs = requests.map(req => {
    const res = responses.find(e => e.requestId === req.requestId)
    if (!res) return { requestId: req.requestId, line: req.body.payload.args.line, response: 'NOT_CAPTURED' }
    assert.equal(res.body.base64Encoded, false)
    const body = JSON.parse(res.body.body)
    assert.equal(body.rpcId, req.body.rpcId)
    const result = body.result.value.result
    return { requestId: req.requestId, rpcId: body.rpcId, line: req.body.payload.args.line,
      http: res.status, kind: result.kind, text: result.text.startsWith('{') ? '[snapshot JSON]' : result.text }
  })
  eventsSummary.push({ file, pairs, frames: rows.filter(e => e.method === 'Page.screencastFrame').length,
    exceptions: rows.filter(e => e.method === 'Runtime.exceptionThrown') })
}
const generated = eventsSummary.find(e => e.file === '36-report-fixed-events.json')
const generatePair = generated.pairs.filter(p => p.line.startsWith('/pm report generate '))
assert.equal(generatePair.length, 1); assert.equal(generatePair[0].kind, 'success')
const payload = JSON.parse(generatePair[0].line.slice(generatePair[0].line.indexOf('{')))
assert(!Object.hasOwn(payload, 'excerpts'))
assert.deepEqual(payload.selectedRefs, sixFields.map(({ taskId, entryId, revisionId }) => ({ taskId, entryId, revisionId })))
const exportPair = eventsSummary.find(e => e.file === '43-fixed-export-events.json')
  .pairs.find(p => p.line === '/pm report export rpt-0002')
assert.equal(exportPair.kind, 'success')
assert(exportPair.text.includes('/exports/rpt-0002-progress.md'))

const mechanism = raw('execution-scripts/pmtool-successor112-report-33.mjs').toString('utf8')
assert(mechanism.includes("Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set"))
assert(mechanism.includes("new Event('input', { bubbles: true })"))
assert(mechanism.includes("new Event('change', { bubbles: true })"))
assert(!/__react|_valueTracker|memoizedProps/.test(mechanism))
const executionRoot = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
const receiptLabels = {
  '95691306b7679156507ac7a7b64b0945': '28 fill selector failure',
  '3f3e204458071321d7148da05e4e1e7c': '29 DOM date fill',
  '8747e280dca3f7c57a1eba2e4003db93': '30 candidate wait timeout',
  '817f68b78626d63019090aa7cf5de840': '31 preset menu',
  'ec93e506362f68798a95643f96436c04': '32 incomplete native keyboard date',
  '33b5fe1ff63671102f280c8d2a21ee7b': '33 setter events; final snapshot failure',
  'e7d099849636103d40267aa66b6dd85c': '34 candidate observation',
  'a8b9fbc4f213d32a610ca2d6742444a4': '35 invalid locator',
  '2744a4a35d70b44ddc9ab38095e19d2e': '36 real selection and report save',
  'dc03d1c19e320f506230185292a2d766': '41 host progress edit and soft delete',
  '27d6f9c2320b1289136b0b678824fcc0': '42 ambiguous reports navigation',
  'dcd139d97f7b1fd7862310718270193a': '43 real UI export',
  '008c86dcfc37bb87daf5d1977791cd77': 'first seal failure',
  '05d2e3bc436ddb66e22c17af25a77cd8': '747 seal completion',
}
const receipts = []
for (const [dir, label] of Object.entries(receiptLabels)) {
  const file = path.join(executionRoot, dir, 'execution.json')
  const meta = JSON.parse(read(file))
  assert.equal(meta.status, 'exited')
  assert.equal(meta.outputComplete, true)
  const stdoutPath = path.join(executionRoot, dir, 'output.log')
  const stdout = read(stdoutPath), text = stdout.toString('utf8')
  const stderr = read(path.join(executionRoot, dir, 'stderr.log'))
  receipts.push({ label, executionId: dir, status: meta.status, exitCode: meta.exitCode,
    outputComplete: meta.outputComplete, pid: meta.pid, cwd: meta.cwd,
    startedAtMs: meta.startedAtMs, finishedAtMs: meta.finishedAtMs,
    metadata: fingerprint(read(file)), stdout: fingerprint(stdout), stderr: fingerprint(stderr),
    excerpt: text.slice(0, 900) })
}
const observation = json('executor-observations.json')
assert.equal(observation.firstSealExit, 1)
assert.equal(observation.laneBefore.value, observation.laneAfter.value)
assert.notEqual(observation.laneBefore.updatedAt, observation.laneAfter.updatedAt)
assert.equal(observation.fixedReportBytes, savedBytes.length)
assert.equal(observation.fixedReportSha256, sha(savedBytes))
assert.equal(observation.exportedMdBytes, mdBytes.length)
assert.equal(observation.exportedMdSha256, sha(mdBytes))
const laneBeforeRoots = json('19-cycle-retry-reopened-roots.json')
const laneAfterRoots = json('22-normal-roots.json')
assert.deepEqual(changed(laneBeforeRoots, laneAfterRoots)
  .filter(k => k.startsWith('data/pmtool/') || k.startsWith('files/')),
['data/pmtool/settings/aiModelMode.json'])
const laneBefore = record('19-cycle-retry-reopened', 'settings/aiModelMode')
const laneAfter = record('22-normal', 'settings/aiModelMode')
assert.deepEqual(laneBefore, observation.laneBefore)
assert.deepEqual(laneAfter, observation.laneAfter)

const result = {
  at: new Date().toISOString(), phase, actor: 'trae independent GUI evidence reviewer; not developer or executor',
  productExecutions: 0, seal: { at: manifest.at, index: fingerprint(manifestBytes),
    declared: 747, missing, differences, extrasNotInOriginalSeal: extras },
  source: { baseline: source.baseline, count: 112, sourceManifest: fingerprint(raw('final-source-binding.json')),
    exactOriginalCombinedSource: true, host: { pid: host.pid, port: host.port, bundle: host.bundle,
      flags: host.flags }, loaded: { ...loaded, independentlyReconstructedSuffixOnly: true,
      secondOffset: -1, initialFullComparison: false } },
  stateInfo, rootTransitions, report: { identity: saved.id, sourceType: saved.sourceType,
    sourceSessionId: saved.sourceSessionId, raw: fingerprint(savedBytes), reportFingerprints,
    rawExactAcrossFiveStates: true, excerpts: sixFields, oldRpt1: { excerpts: 'MISSING', noFrozenClaim: true },
    source: { oldRevisionsPreserved: true, latest: editEntry.revisions[3], deletedAt: deletedEntry.deletedAt } },
  markdown: { ...fingerprint(mdBytes), blocks: excerptChecks, excluded, excludedAllAbsent: true },
  eventsSummary, dateMechanism: { nativeSetterInputChange: true, reactInternals: false,
    nativeKeyboardCompletion: 'NOT_SIGNED', previewTransport: 'NOT_CAPTURED in commands event slice' },
  firstSeal: { exit: observation.firstSealExit, reason: observation.firstSealReason,
    laneBefore: observation.laneBefore, laneAfter: observation.laneAfter,
    independentReportBytesUnaffected: true },
  receipts, observed,
  independentVerdict: phase === 'close' ? 'PASS_GUI_FIXED_EXPORT_LIMITED' : 'PENDING_VISUAL_AND_RECEIPT_REVIEW',
  notSigned: ['whole R', 'whole J04', 'parent', 'B8', 'commit', 'release', 'complete matrix'],
}
if (phase === 'close') {
  const reportText = read(`${prefix}-report.md`).toString('utf8')
  assert(!/^\s+$|[ \t]+$/m.test(reportText))
  const links = [...reportText.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1].split('#')[0])
  for (const link of links) {
    if (link.endsWith('-close.json')) continue
    assert(fs.existsSync(path.resolve(path.dirname(prefix), link)), `Broken report link: ${link}`)
  }
  result.visualReview = {
    originalPngViewed: ['29-report-dates', '32-date-native', '33-candidates',
      '36-report-two-selected', '36-report-fixed', '41-source-edited',
      '41-source-deleted', '43-fixed-source-deleted', '43-fixed-export'],
    originalPngCount: 9, noGeneratedContactSheet: true, framesNotIndividuallyViewed: true,
    secondDetailExcerptFullVisibility: 'BLOCKED',
    bothEditDrawerExcerptsVisible: true, originalSealFilesAreNotTestCounts: true,
  }
  result.reportChecks = { relativeLinks: links.length, whitespace: 'OK' }
  const previous = JSON.parse(read(`${prefix}-audit.json`))
  for (const [file, info] of Object.entries(previous.observed)) {
    assert.deepEqual(fingerprint(fs.readFileSync(file)), info, `Changed after audit: ${file}`)
  }
  result.priorAuditInputsUnchanged = true
  result.selfArtifacts = {}
  for (const file of fs.readdirSync(path.dirname(prefix)).filter(n => n.startsWith(path.basename(prefix)))) {
    result.selfArtifacts[file] = fingerprint(fs.readFileSync(path.join(path.dirname(prefix), file)))
  }
}
const target = `${prefix}-${phase}.json`
fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ phase, sealFiles: 747, missing: missing.length, differences: differences.length,
  originalSealExtras: extras.length, rawBytes: savedBytes.length, mdBytes: mdBytes.length,
  receipts: receipts.length, productExecutions: 0, target }))

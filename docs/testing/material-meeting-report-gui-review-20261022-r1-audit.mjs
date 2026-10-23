import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

// Sealed evidence only. No product imports, subprocesses, network, or live roots.
const here = path.dirname(fileURLToPath(import.meta.url))
const prefix = 'material-meeting-report-gui-review-20261022-r1'
const root = path.resolve(here, '../../reports/all-pending-evidence-20261021/MaterialRemainingR1')
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
const read = (name) => fs.readFileSync(path.join(root, name))
const json = (name) => JSON.parse(read(name))
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const walk = (dir, base = dir) => fs.readdirSync(dir).sort().flatMap((name) => {
  const file = path.join(dir, name)
  const stat = fs.lstatSync(file)
  assert(!stat.isSymbolicLink(), `Unexpected symlink: ${file}`)
  return stat.isDirectory() ? walk(file, base) : [path.relative(base, file)]
})
const indexBytes = read('index.json')
const index = JSON.parse(indexBytes)
const missing = []
const differences = []
for (const [name, expected] of Object.entries(index.files)) {
  assert(!path.isAbsolute(name) && !name.split('/').includes('..'), name)
  if (!fs.existsSync(path.join(root, name))) {
    missing.push(name)
    continue
  }
  const bytes = read(name)
  if (bytes.length !== expected.bytes || sha(bytes) !== expected.sha256) differences.push(name)
}
const actual = walk(root)
const extras = actual.filter((name) => name !== 'index.json' && !Object.hasOwn(index.files, name))
assert.equal(Object.keys(index.files).length, 2852)
assert.deepEqual({ missing, differences, extras }, { missing: [], differences: [], extras: [] })

const names = actual.filter((name) => /^\d[^/]*-roots\.json$/.test(name))
const states = names.map((name) => name.replace('-roots.json', ''))
const manifest = (state) => json(`${state}-roots.json`)
const rootDiff = (before, after) => {
  const a = manifest(before)
  const b = manifest(after)
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
    .filter((name) => !same(a[name], b[name]))
    .map((name) => ({ name, before: a[name] ?? null, after: b[name] ?? null }))
}
const pairs = [
  ['initial-mistake', '00r2-initial', '03r2-invalid-date-observed'],
  ['M02-date-reject', '04-r2-invalid-date-before', '05-r2-invalid-date-rejected'],
  ['M02-author-reject', '06-valid-basic-invalid-author-before', '07r2-invalid-author-observed'],
  ['M02-author-repeat', '08-author-repeat-before', '09-author-repeat-after'],
  ['M02-discard', '09-author-repeat-after', '11-discarded'],
  ['M02-legal-save', '12-legal-reconstruction-before', '13-legal-saved'],
  ['M02-reopen', '13-legal-saved', '14-legal-reopen'],
  ['J02-meeting-create', '23-j02-meeting-before-save', '24-j02-meeting-saved'],
  ['J02-action-create', '25-j02-action-before-save', '26r2-j02-action-saved'],
  ['J02-promote', '27-j02-promote-before', '29-j02-promoted'],
  ['J02-draft-discard', '30-j02-task-double-links-draft', '32-j02-links-discarded'],
  ['J02-links-save', '33-j02-links-save-before', '34-j02-links-saved'],
  ['J02-repeat-promote', '37-j02-repeat-before', '38-j02-repeat-after'],
  ['J02-issue-link', '41-j02-real-issue-draft', '42-j02-real-issue-linked'],
  ['J02-issue-reopen', '42-j02-real-issue-linked', '43-j02-issue-reopen'],
  ['J02-issue-unlink', '44-j02-issue-unlink-draft', '45-j02-issue-unlinked'],
  ['R-preview-cancel', '46-report-current-candidates', '48-report-preview-cancel'],
  ['R-fixed-save', '49-report-reselected-before-save', '50-report-fixed-saved'],
  ['R-source-revision', '50-report-fixed-saved', '51-report-source-new-revision'],
  ['R-source-softdelete', '51-report-source-new-revision', '52r2-report-source-softdeleted'],
  ['R-fixed-reopen', '52r2-report-source-softdeleted', '55-fixed-source-deleted-preview'],
  ['R-session-empty', '61-session-empty-id-before', '62-session-empty-id-rejected'],
  ['R-session-save', '63-session-valid-id-before', '64-session-valid-saved'],
  ['R-session-reopen', '64-session-valid-saved', '65-session-reopen-source-readonly'],
].map(([id, before, after]) => ({ id, before, after, differences: rootDiff(before, after) }))

const rawChecks = states.map((state) => {
  const declared = manifest(state)
  const rawDir = `${state}-raw`
  const rawFiles = walk(path.join(root, rawDir))
  const errors = []
  const manifestOnly = []
  for (const [name, expected] of Object.entries(declared)) {
    if (expected.absent === true) {
      if (rawFiles.some((file) => file === name.replace('absent-root:', '') ||
          file.startsWith(`${name.replace('absent-root:', '')}/`))) errors.push(name)
      continue
    }
    if (!fs.existsSync(path.join(root, rawDir, name))) {
      if (name.startsWith('data/pmtool/')) errors.push(name)
      else manifestOnly.push(name)
      continue
    }
    const bytes = read(`${rawDir}/${name}`)
    if (sha(bytes) !== expected.sha256 || bytes.length !== expected.bytes) errors.push(name)
  }
  const extras = rawFiles.filter((name) => !Object.hasOwn(declared, name))
  assert.deepEqual({ errors, extras }, { errors: [], extras: [] }, state)
  return { state, files: rawFiles.length, manifestOnly,
    absent: Object.keys(declared).filter((key) => declared[key].absent) }
})
const stateSummaries = states.map((state) => {
  const value = json(`${state}.json`)
  return {
    state, at: value.at, origin: value.origin, timeOrigin: value.timeOrigin,
    dark: value.dark, viewport: value.viewport, alerts: value.alerts,
    fields: value.fields.filter((field) => field.name || field.aria ||
      ['textarea', 'date', 'select-one'].includes(field.type)),
    dialogs: value.dialogs.map((dialog) => ({ label: dialog.label, bbox: dialog.bbox })),
  }
})
const events = actual.filter((name) => !name.includes('/') && name.endsWith('-events.json')).map((name) => {
  const raw = json(name)
  const all = Array.isArray(raw) ? raw : raw.rows
  assert(Array.isArray(all), name)
  const requests = all.filter((event) => event.method === 'Network.requestWillBeSent')
  const responses = all.filter((event) => event.method === 'Network.responseReceived')
  return {
    file: name, frameCount: all.filter((event) => event.method === 'Page.screencastFrame').length,
    otherMethods: [...new Set(all.map((event) => event.method))],
    commands: requests.map((request) => {
      const response = responses.find((event) => event.requestId === request.requestId)
      let envelope = null
      if (response?.body?.body) envelope = JSON.parse(response.body.body)
      const result = envelope?.result?.value?.result
      const line = request.body?.payload?.args?.line
      return {
        requestId: request.requestId, at: request.at, path: request.path,
        rpcId: request.body?.rpcId, line,
        responseAt: response?.at, status: response?.status,
        responseRpcId: envelope?.rpcId, ok: envelope?.result?.ok,
        kind: result?.kind,
        text: line === '/pm web snapshot' ? '[snapshot body retained in original]' : result?.text,
      }
    }),
  }
})
const executions = json('execution-index.json').map(({ id, metadata }) => {
  const outputFile = `executions/${id}-output.log`
  const output = read(outputFile).toString('utf8')
  return {
    id, exitCode: metadata.exitCode, status: metadata.status,
    outputComplete: metadata.outputComplete, finishedAtMs: metadata.finishedAtMs,
    outputFile,
    errorLines: output.split('\n').filter((line) =>
      /Error:|Timeout|not found|not a ref|ENOENT|Protocol error|not visible|not enabled/i.test(line)).slice(0, 8),
  }
})
assert.equal(executions.length, 57)
assert.equal(executions.filter((item) => item.exitCode !== 0).length, 15)
assert(executions.every((item) => item.status === 'exited' && item.outputComplete === true))

const entity = (state, table, id) => {
  const value = json(`${state}-raw/data/pmtool/${table}/${id}.json`)
  assert.equal(value.version, 2)
  assert.equal(value.record.id, id)
  return value.record
}
const taskBefore = entity('12-legal-reconstruction-before', 'tasks', 't-0001')
const taskAfter = entity('13-legal-saved', 'tasks', 't-0001')
assert.deepEqual(taskAfter.attachments.slice(0, taskBefore.attachments.length), taskBefore.attachments)
assert.deepEqual(taskAfter.progressLog.slice(0, taskBefore.progressLog.length), taskBefore.progressLog)
const report = entity('50-report-fixed-saved', 'reports', 'rpt-0002')
const reportStates = ['51-report-source-new-revision', '52r2-report-source-softdeleted',
  '53-report-source-deleted-detail', '54-fixed-report-edit-reopen', '55-fixed-source-deleted-preview',
  '57-fixed-export-relative-success', '58r2-fixed-overwrite-rejected', '59-fixed-overwrite-confirmed']
const reportUnchanged = reportStates.map((state) => ({
  state, equal: same(report, entity(state, 'reports', 'rpt-0002')),
}))
assert(reportUnchanged.every((item) => item.equal))
const loaded = read('loaded-complete-r2.js')
const segment = json('loaded-binding-r2.json').completeSegment
assert.equal(loaded.length, 2597521)
assert.equal(sha(loaded), json('loaded-binding-r2.json').loaded.sha256)
const segmentBytes = loaded.subarray(segment.offset, segment.offset + segment.bytes)
assert.equal(sha(segmentBytes), segment.sha256)
assert.equal(loaded.indexOf(segmentBytes), segment.offset)
assert.equal(loaded.indexOf(segmentBytes, segment.offset + 1), -1)
assert.equal(segment.second, -1)
const originalLoaded = read('loaded-complete.js')
assert.equal(originalLoaded.length, 40691)
assert.equal(sha(originalLoaded), json('loaded-binding.json').loaded.sha256)
const candidateManifestPath = path.resolve(root, '../U4/candidate-evidence-manifest.json')
const candidateManifestBytes = fs.readFileSync(candidateManifestPath)
const candidateManifest = JSON.parse(candidateManifestBytes)
assert.equal(candidateManifest.bundle['packages/dsh-pm-tool/lib/client.js'],
  json('loaded-binding-r2.json').compiled.sha256)
const exportText = read('57-fixed-export.md').toString('utf8')
const exportExcerptPresence = report.excerpts.map((excerpt) => ({
  taskId: excerpt.taskId, entryId: excerpt.entryId, revisionId: excerpt.revisionId,
  contentSnapshot: excerpt.contentSnapshot,
  contentPresent: exportText.includes(excerpt.contentSnapshot),
  entryIdPresent: exportText.includes(excerpt.entryId),
  revisionIdPresent: exportText.includes(excerpt.revisionId),
}))

const result = {
  at: new Date().toISOString(), mode: 'sealed-artifact-audit-only',
  evidence: { root: path.relative(path.resolve(here, '../..'), root), sealedAt: index.at,
    indexSha256: sha(indexBytes), indexedFiles: 2852, actualFilesIncludingIndex: actual.length,
    missing, differences, extras },
  sourceBinding: { sha256: sha(read('source-binding.json')), baseline: json('source-binding.json').baseline,
    count: json('source-binding.json').count, recordedDifferences: json('source-binding.json').differences,
    scope: 'Recorded old candidate only; no main tree read or lock' },
  candidateEvidence: { path: path.relative(path.resolve(here, '../..'), candidateManifestPath),
    sha256: sha(candidateManifestBytes), baseline: candidateManifest.baselineCommit,
    candidateRoot: candidateManifest.candidateRoot, bundle: candidateManifest.bundle },
  loadedBinding: { r2Sha256: sha(read('loaded-binding-r2.json')), segment,
    compiledClaim: json('loaded-binding-r2.json').compiled,
    independentCompiledComparison: 'NOT_RUN; only sealed loaded bytes read',
    resource: json('67-full-client-resource-binding.json').resource,
    originalLoadedBytes: originalLoaded.length, originalSegmentOffset: json('loaded-binding.json').completeSegment.offset },
  rawChecks, pairs, stateSummaries, events, executions,
  entities: {
    taskBefore, taskAfter,
    meetingPromoted: entity('29-j02-promoted', 'meetings', 'mtg-0002'),
    taskLinked: entity('34-j02-links-saved', 'tasks', 't-0012'),
    meetingLinked: entity('42-j02-real-issue-linked', 'meetings', 'mtg-0002'),
    meetingUnlinked: entity('45-j02-issue-unlinked', 'meetings', 'mtg-0002'),
    report, reportUnchanged,
    sourceAfterRevision: entity('51-report-source-new-revision', 'tasks', 't-0001'),
    sourceAfterDelete: entity('52r2-report-source-softdeleted', 'tasks', 't-0001'),
    sessionReport: entity('64-session-valid-saved', 'reports', 'rpt-0003'),
    exportBytes: read('57-fixed-export.md').length,
    exportSha256: sha(read('57-fixed-export.md')),
    exportExcerptPresence,
    overwriteBytes: json('58r2-overwrite-bytes.json'),
  },
}
assert.equal(sha(read('index.json')), sha(indexBytes))
const mode = process.argv[2] ?? 'audit'
assert(['audit', 'close'].includes(mode))
if (mode === 'close') {
  const previous = JSON.parse(fs.readFileSync(path.join(here, `${prefix}-audit.json`)))
  assert.equal(previous.evidence.indexSha256, result.evidence.indexSha256)
  result.ownFiles = Object.fromEntries(fs.readdirSync(here).filter((name) =>
    name.startsWith(prefix) && fs.lstatSync(path.join(here, name)).isFile()).map((name) => {
    const bytes = fs.readFileSync(path.join(here, name))
    return [name, { bytes: bytes.length, sha256: sha(bytes) }]
  }))
}
fs.writeFileSync(path.join(here, `${prefix}-${mode === 'close' ? 'close' : 'audit'}.json`),
  `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({
  mode, indexedFiles: 2852, missing, differences, extras,
  states: states.length, executions: executions.length,
  nonzero: executions.filter((item) => item.exitCode !== 0).length,
  pairs: pairs.map((pair) => ({ id: pair.id, changed: pair.differences.map((item) => item.name) })),
  eventFiles: events.length, reportUnchanged,
}, null, 2))

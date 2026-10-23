import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

// File-only audit: no product imports, subprocesses, network, or writes.
const repo = path.resolve(import.meta.dirname, '../..')
const evidence = path.join(repo, 'reports/all-pending-evidence-20261021/FeedbackRemainingR1')
const parent = path.dirname(evidence)
const frozen = '/private/tmp/pmtool-u4-closure-20261022-r2'
const launcher = '/private/tmp/pmtool-a20v3-closure-20261022-r1'
const read = file => fs.readFileSync(file)
const json = file => JSON.parse(read(file))
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const fingerprint = file => {
  const bytes = read(file)
  return { bytes: bytes.length, sha256: sha(bytes) }
}
const state = name => json(path.join(evidence, `${name}.json`))
const issues = []
const index = json(path.join(evidence, 'index.json'))
for (const [file, expected] of Object.entries(index.files)) {
  const actual = fingerprint(path.join(evidence, file))
  if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) issues.push({ file, actual, expected })
}
const listed = new Set(Object.keys(index.files))
const extra = []
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) scan(file)
    else {
      const relative = path.relative(evidence, file)
      if (relative !== 'index.json' && !listed.has(relative)) extra.push(relative)
    }
  }
}
scan(evidence)
const declarations = new Map()
for (const file of ['A20V3/source-files.sha256', 'U4/increment-files.sha256']) {
  for (const line of read(path.join(parent, file)).toString().trim().split('\n')) {
    const match = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/)
    if (!match) throw new Error(`Invalid declaration: ${file}`)
    declarations.set(match[2], match[1])
  }
}
const binding = json(path.join(evidence, 'source-binding.json'))
const sourceDrift = []
for (const [file, expected] of declarations) {
  if (binding.source[file] !== expected) sourceDrift.push({ file, where: 'binding' })
  const owner = file.startsWith('launcher/') ? launcher : frozen
  for (const [where, root] of [['main', repo], ['frozen-owner', owner]]) {
    if (fingerprint(path.join(root, file)).sha256 !== expected) sourceDrift.push({ file, where })
  }
}
if (declarations.size !== 102 || Object.keys(binding.source).length !== 102 || binding.count !== 102) {
  issues.push({ sourceCount: declarations.size, bindingCount: binding.count })
}
const client = read(path.join(frozen, 'packages/dsh-pm-tool/lib/client.js'))
const loaded = read(path.join(evidence, 'loaded-complete.js'))
const segment = Buffer.from(client.toString()
  .replace(/\n?\/\/# sourceMappingURL=.*$/m, '')
  .replace(/\n?\/\/# sourceURL=.*$/m, '')
  .trimEnd() + '\n;\n')
const offset = loaded.indexOf(segment)
const second = offset < 0 ? null : loaded.indexOf(segment, offset + 1)
if (offset !== 875361 || second !== -1) issues.push({ offset, second })
const executions = json(path.join(evidence, 'execution-index.json'))
const failures = []
for (const entry of executions) {
  const copy = json(path.join(evidence, 'executions', `${entry.executionId}.json`))
  if (JSON.stringify(entry) !== JSON.stringify(copy) || entry.status !== 'exited' || !entry.outputComplete) {
    issues.push({ execution: entry.executionId })
  }
  const log = read(path.join(evidence, 'executions', `${entry.executionId}.log`)).toString()
  if (entry.exitCode !== 0) failures.push({ id: entry.executionId, exit: entry.exitCode, firstLine: log.split('\n')[0] })
}
const observations = json(path.join(evidence, 'observation-index.json'))
for (const [file, entry] of Object.entries(observations)) {
  const source = json(path.join(evidence, file))
  const actual = {
    at: source.at, timeOrigin: source.timeOrigin, cardSummary: source.cards?.[0]?.summary,
    copy: source.copyStates, dialogs: source.dialogs?.map(dialog => dialog.label),
  }
  if (JSON.stringify(actual) !== JSON.stringify(entry)) issues.push({ observation: file })
}
const exact = 'Response parsing failed; received text follows:\n[pm:summary]任务｜t-0001｜Failed delivery\n[pm:detail]\n{"id":"t-0001","title":"Error register"}'
const marked = exact + '\n[pm:action]Never execute reason：task remove t-0001 confirm\n \t尾部  \n\n'
const message = '执行失败：' + marked
const responseChecks = [
  ['08-exact-fault-0-error-response', exact],
  ['11-marked-fault-0-error-response', marked],
  ['18-quiet-marked-0-error-response', marked],
  ['22-quiet-marked-0-error-response', marked],
].map(([file, expected]) => {
  const response = state(file)
  const equal = response.result.ok === false && response.result.error.message === expected
  if (!equal) issues.push({ response: file })
  return { file, rpcId: response.rpcId, equal }
})
const textChecks = [
  ['08-exact-error', '执行失败：' + exact],
  ['10-confirm-cancel-retained', '执行失败：' + exact],
  ...['11-marked-error', '13-native-copy', '15-marked-after-60-seconds',
    '18-same-error-quiet-notification', '19-late-copy-resolved', '20-current-native-copy',
    '22-same-error-quiet', '23-late-copy-rejected', '24-current-copy-after-reject']
    .map(file => [file, message]),
].map(([file, expected]) => {
  const card = state(file).cards?.[0]
  const equal = card?.summary === expected && card.role === 'alert' && card.live === 'assertive'
  if (!equal) issues.push({ text: file })
  return { file, equal, top: card?.bbox.top, bottom: card?.bbox.bottom }
})
const clipboard = read(path.join(evidence, '13-native-clipboard.txt'))
if (!clipboard.equals(Buffer.from(message))) issues.push({ clipboard: 'mismatch' })
const rootPairs = [
  ['07-exact-before-roots', '08-exact-error-roots'],
  ['08-exact-error-roots', '10-confirm-cancel-roots'],
  ['10-confirm-cancel-roots', '11-marked-error-roots'],
  ['11-marked-error-roots', '12-discarded-roots'],
  ['12-discarded-roots', '14-persistent-roots'],
  ['17-quiet-before-roots', '18-quiet-error-roots'],
  ['21-quiet-before-roots', '22-quiet-error-roots'],
  ['27-business-before-roots', '35-retained-roots'],
  ['35-retained-roots', '37-discarded-roots'],
  ['41-o3-before-roots', '42-o3-after-roots'],
  ['45-business-before-roots', '45-business-rejected-roots'],
  ['42-o3-after-roots', '44-o3-saved-roots'],
  ['45-business-rejected-roots', '46-business-retry-roots'],
  ['47-s0-roots', '48-before-change-roots'],
  ['48-before-change-roots', '49-s1-authoritative-roots'],
  ['49-s1-authoritative-roots', '50-s1-readback-roots'],
].map(([before, after]) => {
  const a = state(before), b = state(after)
  const changed = [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter(file => JSON.stringify(a[file]) !== JSON.stringify(b[file]))
  return { before, after, changed, businessChanged: changed.filter(file => !file.startsWith('data/session_projcache/')) }
})
const viewed = [
  '08-exact-error', '09-dirty-confirm', '10-confirm-cancel-retained',
  '13-native-copy', '15-marked-after-60-seconds',
  '18-same-error-quiet-notification', '19-late-copy-resolved', '20-current-native-copy',
  '22-same-error-quiet', '23-late-copy-rejected', '24-current-copy-after-reject', '24-closed',
  '27-business-draft', '30-clean-new-task', '31-clean-escape-closed', '32-clean-x-closed',
  '33-description-only-draft', '34-description-only-confirm', '35-description-confirm-cancel-retained',
  '36a-confirm-button-cancel', '36b-description-x-confirm', '37-description-discarded', '38-clean-scrim-closed',
  '41-o3-checkbox-adapter-draft', '42-o3-after-attempt', '43-o3-same-draft-corrected',
  '44-o3-retry-saved', '45-business-refusal', '46-business-retry-success',
  '47-s0-task-objective', '48-stale-s0-objective', '49-original-still-stale-s0', '50-retry-s1-current',
]
const viewedDimensions = viewed.map(file => {
  const bytes = read(path.join(evidence, `${file}.png`))
  return { file, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
})
const contracts = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/feedback-remaining-gui-20261022-r1-plan.md',
  'docs/testing/feedback-remaining-gui-20261022-r1.md',
  'docs/testing/feedback-remaining-gui-20261022-r2-method.md',
  'docs/testing/a18-feedback-context-independent-retest-20261022-plan.md',
  'docs/testing/a18-feedback-context-independent-retest-20261022.md',
  'docs/testing/a18-feedback-context-independent-retest-20261022-cases.test.tsx',
  'docs/testing/a17-transport-feedback-independent-retest-20261022-cases.test.tsx',
  'docs/testing/main-o3-o5-samepage-assertions-20261020.md',
  'docs/testing/oil-o3-o4-o5-patch-qa-20261020.md',
  'docs/plans/2026-10-22-feedback-error-context-closure.md',
  'docs/testing/cycle-feedback-reason-20261022-plan.md',
  'reports/all-pending-evidence-20261021/U4/candidate-evidence-manifest.json',
]
const result = {
  at: new Date().toISOString(), node: process.version, mode: 'file-only-no-writes',
  evidenceIndex: fingerprint(path.join(evidence, 'index.json')),
  files: listed.size, issues, extra, sourceCount: declarations.size, sourceDrift,
  sourceBinding: fingerprint(path.join(evidence, 'source-binding.json')),
  loaded: fingerprint(path.join(evidence, 'loaded-complete.js')),
  client: { bytes: client.length, sha256: sha(client) },
  segment: { bytes: segment.length, sha256: sha(segment), offset, second },
  executionCount: executions.length, failures, observationCount: Object.keys(observations).length,
  responseChecks, textChecks, rootPairs,
  clipboard: { bytes: clipboard.length, sha256: sha(clipboard), exact: clipboard.equals(Buffer.from(message)) },
  durationsMs: {
    ordinaryExact: Date.parse(state('10-confirm-cancel-retained').at) - Date.parse(state('08-exact-error').at),
    ordinaryMarked: Date.parse(state('15-marked-after-60-seconds').at) - Date.parse(state('11-marked-error').at),
    quietResolveUntilNext: Date.parse(state('21-old-copy-reject-pending').at) - Date.parse(state('18-same-error-quiet-notification').at),
    quietRejectUntilCurrentCopy: Date.parse(state('24-current-copy-after-reject').at) - Date.parse(state('22-same-error-quiet').at),
  },
  viewedDimensions,
  contracts: Object.fromEntries(contracts.map(file => [file, fingerprint(path.join(repo, file))])),
}
console.log(JSON.stringify(result, null, 2))
if (issues.length || sourceDrift.length || extra.length) process.exitCode = 1

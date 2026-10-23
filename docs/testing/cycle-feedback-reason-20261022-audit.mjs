import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'cycle-feedback-reason-20261022'
const raw = join(repo, 'reports/all-pending-evidence-20261021/FeedbackRemainingR1')
const frozen = '/private/tmp/pmtool-u4-closure-20261022-r2'
const own = join(repo, 'docs/testing', `${prefix}-selftmp/r1`)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const read = name => JSON.parse(readFileSync(join(raw, name), 'utf8'))
const index = read('index.json')
const indexed = Object.entries(index.files).map(([name, expected]) => {
  const path = resolve(raw, name)
  assert(path.startsWith(`${raw}/`))
  const bytes = readFileSync(path)
  assert.equal(bytes.length, expected.bytes, name)
  assert.equal(sha(bytes), expected.sha256, name)
  return { name, ...expected, mtimeMs: statSync(path).mtimeMs }
})
assert.equal(indexed.length, 230)
const executions = read('execution-index.json')
assert.equal(executions.length, 27)
for (const e of executions) {
  assert.deepEqual(read(`executions/${e.executionId}.json`), e)
  assert.equal(e.status, 'exited')
  assert.equal(e.outputComplete, true)
}
const failedExecutions = executions.filter(e => e.exitCode !== 0)
assert.equal(failedExecutions.length, 6)
const observations = read('observation-index.json')
assert.equal(Object.keys(observations).length, 49)
for (const [name, expected] of Object.entries(observations)) {
  const actual = read(name)
  assert.equal(actual.at, expected.at, name)
  assert.equal(actual.timeOrigin, expected.timeOrigin, name)
  if (expected.cardSummary !== undefined) assert.equal(actual.cards[0]?.summary, expected.cardSummary, name)
}
const binding = read('source-binding.json')
const declarations = JSON.parse(readFileSync(join(own, 'declarations102.json'), 'utf8'))
assert.equal(binding.count, 102)
assert.deepEqual(binding.differences, [])
assert.deepEqual(binding.source, Object.fromEntries(declarations.map(v => [v.path, v.expected])))
for (const r of declarations) {
  assert.equal(sha(readFileSync(join(repo, r.path))), r.expected)
  assert.equal(sha(readFileSync(join(r.root, r.path))), r.expected)
}
const loaded = readFileSync(join(raw, 'loaded-complete.js'), 'utf8')
const client = readFileSync(join(frozen, 'packages/dsh-pm-tool/lib/client.js'), 'utf8')
const normalized = client.replace(/\n\/\/# sourceMappingURL=[^\r\n]*$/, '').trimEnd() + '\n;\n'
const offset = loaded.indexOf(normalized), second = loaded.indexOf(normalized, offset + 1)
assert(offset >= 0 && second === -1, '完整生产执行段须唯一匹配')
const changes = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).sort()
const rootChecks = [
  ['41-o3-before-roots.json', '42-o3-after-roots.json'],
  ['45-business-before-roots.json', '45-business-rejected-roots.json'],
  ['45-business-rejected-roots.json', '46-business-retry-roots.json'],
].map(([before, after], i) => {
  const changed = changes(read(before), read(after))
  const session = changed.filter(k => k.startsWith('data/session_projcache/'))
  const business = changed.filter(k => !k.startsWith('data/session_projcache/'))
  if (i < 2) assert.deepEqual(business, [])
  else assert.deepEqual(business, ['data/pmtool/tasks/t-0009.json'])
  return { before, after, changed, business, session }
})
function rpcPair(name) {
  const events = read(name)
  const req = events.find(e => e.method === 'Network.requestWillBeSent')
  const res = events.find(e => e.method === 'Network.responseReceived' && e.requestId === req.requestId)
  assert(res)
  const body = JSON.parse(res.body.body)
  assert.equal(body.rpcId, req.body.rpcId)
  assert.equal(body.result.ok, true)
  return { name, requestId: req.requestId, rpcId: body.rpcId, requestAt: req.at, responseAt: res.at,
    line: req.body.payload.args.line, result: body.result.value.result }
}
const refusal = rpcPair('45-real-response-events.json'), retry = rpcPair('46-retry-response-events.json')
assert.equal(refusal.result.kind, 'error')
assert.equal(retry.result.kind, 'success')
assert(refusal.line.includes('"predecessorIds":["t-0008"]'))
assert(retry.line.includes('"predecessorIds":[]'))
const fullRetryEvents = read('46-retry-response-events.json')
const snapshotResponse = fullRetryEvents.find(e => e.method === 'Network.responseReceived' && e.requestId !== retry.requestId)
const snapshot = JSON.parse(JSON.parse(snapshotResponse.body.body).result.value.result.text)
const t8 = snapshot.tasks.find(t => t.id === 't-0008'), t9 = snapshot.tasks.find(t => t.id === 't-0009')
assert.equal(t8.projectId, t9.projectId)
assert.deepEqual(t8.predecessorIds, ['t-0009'])
assert.equal(t9.predecessorIds, undefined)
const states = ['41-o3-checkbox-adapter-draft.json', '42-o3-after-attempt.json',
  '43-o3-same-draft-corrected.json', '44-o3-retry-saved.json', '45-business-refusal.json',
  '46-business-retry-success.json'].map(name => {
    const s = read(name)
    return { name, at: s.at, timeOrigin: s.timeOrigin, title: s.fields.find(f => f.name === 'title')?.value,
      dialogs: s.dialogs.map(d => ({ label: d.label, count: d.text.match(/已选 \d 项/)?.[0] })),
      cards: s.cards, toasts: s.toasts }
  })
assert.equal(new Set(states.map(s => s.timeOrigin)).size, 1)
const versions = Object.fromEntries(['react', 'react-test-renderer', 'vitest'].map(n =>
  [n, JSON.parse(readFileSync(join(own, 'frozen/packages/dsh-pm-tool/node_modules', n, 'package.json'))).version]))
const result = { at: new Date().toISOString(), indexSha256: sha(readFileSync(join(raw, 'index.json'))),
  filesVerified: indexed.length, indexed, executionsVerified: executions.length, failedExecutions,
  observationsVerified: Object.keys(observations).length, binding102Verified: true, versions,
  loaded: { bytes: Buffer.byteLength(loaded), sha256: sha(loaded), clientSha256: sha(client),
    normalizedBytes: Buffer.byteLength(normalized), normalizedSha256: sha(normalized), offset, second },
  rootChecks, refusal, retry, seed: { t8, t9 }, states,
  timestampBoundary: '45 observation.at precedes its captured RPC; it is not proof of a fresh post-response capture.',
  scope: 'seal bytes and cycle feedback evidence only; not whole feedback GUI PASS',
  git: false, build: false, guiExecution: false, productEdited: false }
writeFileSync(join(repo, 'docs/testing', `${prefix}-audit.json`), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ filesVerified: result.filesVerified, executionsVerified: result.executionsVerified,
  failedExecutions: failedExecutions.length, observationsVerified: result.observationsVerified,
  loaded: result.loaded, rootChecks, indexSha256: result.indexSha256, versions }))

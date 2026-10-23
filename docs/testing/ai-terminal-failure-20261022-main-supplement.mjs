import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const raw = join(repo, 'reports/all-pending-evidence-20261021/AIremainingR1')
const prefix = 'ai-terminal-failure-20261022'
const sha = b => createHash('sha256').update(b).digest('hex')
const read = name => readFileSync(join(raw, name))
const json = name => JSON.parse(read(name).toString())
const indexBytes = read('index.json')
const index = JSON.parse(indexBytes)
assert.equal(Object.keys(index.files).length, 506)
assert.equal(index.verdict, null, 'Main executor index is not an independent verdict')
const names = Object.keys(index.files).filter(n =>
  /^(26-|27-|28-|frozen-gateway-log\/)/.test(n)
  || ['source-binding.json', '29-page-binding.json', 'gateway-r2-start.json', 'executor-gateway-r2.mjs'].includes(n))
const verified = names.map(name => {
  assert(!index.liveLogsExcluded.includes(name), '不得读活日志')
  const target = resolve(raw, name)
  assert(target.startsWith(`${raw}/`))
  const before = statSync(target), bytes = readFileSync(target)
  const actual = { bytes: bytes.length, sha256: sha(bytes) }
  assert.deepEqual(actual, index.files[name], name)
  return { name, ...actual, mtimeMs: before.mtimeMs }
})
const requests = read('frozen-gateway-log/gateway.r2-requests.ndjson').toString()
  .trim().split('\n').map(line => JSON.parse(line))
const events = read('frozen-gateway-log/gateway.r2-events.ndjson').toString()
  .trim().split('\n').map(line => JSON.parse(line))
const binding = json('source-binding.json'), page = json('29-page-binding.json')
assert.equal(binding.count, 102)
assert.deepEqual(binding.differences, [])
assert.equal(binding.candidate, '/private/tmp/pmtool-u4-closure-20261022-r2')
assert.equal(page.bundleCandidate, binding.candidate)
assert.equal(page.gatewayPid, 26667)
const u4Source = join(binding.candidate, 'packages/dsh-pm-tool/src/core/ai-client.ts')
const u4Lib = join(binding.candidate, 'packages/dsh-pm-tool/lib/core/ai-client.js')
const sourceSha256 = sha(readFileSync(u4Source))
assert.equal(sourceSha256, '08e2a80154acd782db6236eca64be9e899dd1b59c23d2926b7d6bf7069a92950')
const libSha256 = sha(readFileSync(u4Lib))
assert.equal(libSha256, 'c5bb5cf35e5a7de000a4e6023e58277dcd95a4e81614b1ddf4c8e2af40a98611')
const changes = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).sort()
const stages = [
  { n: 26, observation: '26-auth-after.json', rpc: '26-auth-events-events.json',
    before: '26-auth-before-roots.json', after: '26-auth-after-roots.json', behavior: 'auth', sequences: [10, 11] },
  { n: 27, observation: '27-rate-after.json', rpc: '27-rate-events-events.json',
    before: '27-rate-before-roots.json', after: '27-rate-after-roots.json', behavior: 'rate_limit', sequences: [12, 13] },
  { n: 28, observation: '28-normal-recovered.json', rpc: '28-normal-recovered-events-events.json',
    before: '27-rate-after-roots.json', after: '28-normal-recovered-roots.json', behavior: 'success', sequences: [14] },
].map(stage => {
  const captured = json(stage.rpc)
  const req = captured.find(e => e.method === 'Network.requestWillBeSent')
  const res = captured.find(e => e.method === 'Network.responseReceived' && e.requestId === req.requestId)
  assert(req && res)
  const body = JSON.parse(res.body.body)
  assert.equal(body.rpcId, req.body.rpcId)
  assert.equal(body.result.ok, true)
  const commandResult = body.result.value.result
  const receipts = requests.filter(r => r.body.messages.some(m =>
    m.content.some(c => c.type === 'text' && c.text.includes(`【用户问题】"${stage.n} `))))
  assert.deepEqual(receipts.map(r => r.sequence), stage.sequences)
  assert(receipts.every(r => r.path === '/v1/messages' && r.fixture.behavior === stage.behavior))
  const observation = json(stage.observation)
  if (stage.n < 28) {
    assert.equal(commandResult.kind, 'error')
    assert.match(commandResult.text, /deepseek-v4-1-flash-260910 未返回正文/)
    assert.match(commandResult.text, /deepseek-v4-pro-ga-260813 未返回正文/)
    assert(observation.sidecar.includes(commandResult.text))
    assert.deepEqual(receipts.map(r => r.body.model), ['deepseek-v4-1-flash-260910', 'deepseek-v4-pro-ga-260813'])
  } else {
    assert.equal(commandResult.kind, 'success')
    assert.match(commandResult.text, /正常恢复.*只读诊断/)
    assert(observation.sidecar.includes(commandResult.text))
    assert(observation.sidecar.includes('模型未给出可执行步骤'))
    assert(events.some(e => e.sequence === 14 && e.outcome === 'success'))
  }
  const changed = changes(json(stage.before), json(stage.after))
  const businessChanged = changed.filter(p => !p.startsWith('data/session_projcache/'))
  assert.deepEqual(businessChanged, [], '仅限这对封存根，不推广零全盘写')
  return { ...stage, observationAt: observation.at, timeOrigin: observation.timeOrigin,
    rpcRequestAt: req.at, rpcResponseAt: res.at, rpcId: body.rpcId, requestId: req.requestId,
    hostRpcStatus: res.status, commandResult, changed, businessChanged,
    receipts: receipts.map(r => ({ sequence: r.sequence, at: r.at, path: r.path, model: r.body.model,
      fixture: r.fixture, requestedMaxTokens: r.body.max_tokens, stream: r.body.stream })),
    fixtureResponseStatus: stage.n === 26 ? 401 : stage.n === 27 ? 429 : 200,
    responseStatusEvidence: 'executed gateway fixed branch plus received fixture BODY; not a stored wire-status event',
    observationTimestampIsNotPostRpcProof: observation.at < res.at }
})
const boundary = {
  indexCount: 506, inspectedSelectedOnly: true, completeGuiReview: false, guiSigned: false,
  totalGateSigned: false, repeatedAuto: false, network: false, servicesTouched: false,
  credentialsRead: false, gitWrite: false, mainSuccessor: binding.mainTreeNow,
  liveLogsRead: false,
  timestampNote: 'Observation at precedes captured RPC event at; correlate content/question/RPC IDs, not a fabricated causal timestamp order.',
  statusNote: 'Host RPC HTTP200 wraps business error; upstream 401/429 are supported by actual logged BODY and executed fixed response branch, not gateway failure-status events.',
}
for (const v of verified) {
  assert.equal(statSync(join(raw, v.name)).mtimeMs, v.mtimeMs)
  assert.equal(sha(read(v.name)), v.sha256)
}
assert.equal(sha(read('index.json')), sha(indexBytes))
const result = { at: new Date().toISOString(), indexSha256: sha(indexBytes), verified, stages,
  binding: { baseline: binding.baseline, candidate: binding.candidate, count: binding.count,
    differences: binding.differences, page, sourceSha256, libSha256 }, boundary,
  immutableSelectedRechecked: true }
writeFileSync(join(repo, 'docs/testing', `${prefix}-main-supplement.json`),
  `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ indexSha256: result.indexSha256, indexCount: 506, selectedVerified: verified.length,
  stages: stages.map(s => ({ n: s.n, sequences: s.sequences, result: s.commandResult,
    changed: s.changed, businessChanged: s.businessChanged, fixtureResponseStatus: s.fixtureResponseStatus })),
  boundary, immutableSelectedRechecked: true }, null, 2))

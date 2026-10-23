import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, constants, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'ask-auth-feedback-red-20261022-r1'
const out = join(repo, 'reports/all-pending-evidence-20261021/AskAuthRedR1')
const gui = join(repo, 'reports/all-pending-evidence-20261021/CombinedGuiR1')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
function save(name, value) {
  const path = resolve(out, name)
  assert(path.startsWith(`${out}/`))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
function inventory(root) {
  const result = {}
  function walk(path) {
    const s = lstatSync(path), key = relative(root, path) || '.'
    if (s.isSymbolicLink()) result[key] = { link: readlinkSync(path) }
    else if (s.isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name))
    else result[key] = { bytes: s.size, sha256: sha(readFileSync(path)) }
  }
  walk(root)
  return result
}
const executions = process.argv.slice(2)
assert.equal(executions.length, 4, 'freeze/controls/red/close 四个实际工具 execution ID')
const expectedExits = [0, 0, 1, 0]
const receipts = executions.map((executionId, index) => {
  assert.match(executionId, /^[a-f0-9]{32}$/)
  const toolRoot = join('/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution', executionId)
  const original = json(join(toolRoot, 'execution.json'))
  assert.equal(original.status, 'exited')
  assert.equal(original.exitCode, expectedExits[index])
  assert.equal(original.outputComplete, true)
  const stage = ['freeze', 'controls', 'red', 'close'][index]
  const ps = spawnSync('/bin/ps', ['-p', String(original.pid), '-o', 'pid=,ppid=,command='],
    { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } })
  assert.equal(ps.status, 1)
  assert.equal(ps.stdout.trim(), '')
  copyFileSync(join(toolRoot, 'output.log'), join(out, `${stage}.tool-output.log`), constants.COPYFILE_EXCL)
  return {
    stage, executionId, pid: original.pid, cwd: original.cwd, status: original.status,
    originalExit: original.exitCode, terminalReason: original.terminalReason,
    start: new Date(original.startedAtMs).toISOString(), end: new Date(original.finishedAtMs).toISOString(),
    outputComplete: original.outputComplete,
    toolReceiptSha256: sha(readFileSync(join(toolRoot, 'execution.json'))),
    process: { psExit: ps.status, stdout: ps.stdout, stderr: ps.stderr, exited: true },
  }
})
save('execution-receipts.json', receipts)
const close = json(join(out, 'close.json'))
assert(close.released && close.stop && close.expectedObserved)
const observations = ['controls', 'red'].flatMap(name => readFileSync(join(out, `${name}.observations.ndjson`), 'utf8')
  .trim().split('\n').map(line => JSON.parse(line)))
assert.equal(observations.length, 11)
const facts = observations.map(row => {
  assert.deepEqual(row.before, row.after)
  assert.deepEqual(row.before, row.afterRecovery)
  assert.deepEqual(row.recovery, { kind: 'success', text: '副驾正常恢复：这是只读回答，不修改项目。' })
  assert.equal(row.disposed, true)
  assert.equal(row.credentialsInEnvironment, false)
  assert.equal(row.first.prepare.length, 1)
  assert.equal(row.allPrepare.length, 2)
  return {
    id: row.id, result: row.result, first: row.first,
    zeroBusinessWrite: true, sameRuntimeRecovery: row.recovery, disposed: row.disposed,
    root: row.root, projectId: row.projectId, taskId: row.taskId,
  }
})
const red = facts.filter(row => row.id.startsWith('R-'))
assert.equal(red.length, 3)
for (const row of red) {
  assert.equal(row.result.kind, 'error')
  assert.match(row.result.text, /PROD_KEY_MISSING.*未检测到/)
  assert.doesNotMatch(row.result.text, /凭据无效|已失效/)
}
save('observations-review.json', { facts, total: 11, necessaryRed: 3, controlPass: 8,
  verdict: 'FAIL_NECESSARY_RED_CONFIRMED', wholeRAAI06: 'NOT_SIGNED', release: 'STOP' })
const gateway = readFileSync(join(gui, 'executor-gateway.mjs'), 'utf8')
assert(gateway.includes("const auth=fixture.behavior==='auth'"))
assert(gateway.includes("res.writeHead(auth?401:429"))
save('gateway-fixture-source.original.mjs', gateway)
const requests = readFileSync(join(out, 'gateway-seq1-2.original.ndjson'), 'utf8').trim().split('\n').map(JSON.parse)
assert.deepEqual(requests.map(row => row.fixture.behavior), ['auth', 'auth'])
const commandResults = ['32-atf-auth-command-events.json', '34-atf-r2-auth-command-events.json'].map(file => {
  const events = json(join(gui, file))
  const request = events.find(event => event.method === 'Network.requestWillBeSent' && event.path === '/api/commands/execute')
  const response = events.find(event => event.method === 'Network.responseReceived' && event.requestId === request.requestId)
  const body = JSON.parse(response.body.body)
  assert.equal(body.rpcId, request.body.rpcId)
  const result = body.result.value.result
  assert.equal(result.kind, 'error')
  assert.match(result.text, /PROD_KEY_MISSING.*未检测到/)
  return {
    source: join(gui, file), sourceSha256: sha(readFileSync(join(gui, file))),
    requestId: request.requestId, line: request.body.payload.args.line,
    result, rpcMatched: true, httpEnvelopeStatus: response.status,
  }
})
save('related-main-original-review.json', {
  requests: requests.map(({ sequence, path, fixture }) => ({ sequence, path, fixture })),
  gatewaySourceSha256: sha(gateway), commandResults,
  scope: '只读原件互证：fixture auth 映射401与32/34返回文本；不是本角色GUI目视、live网关采证或整GUI审签。',
  correctedDiagnosis: '请求已到；不以缺环境 Key/未接线解释真实 AUTH 被命令层重写。',
})
const delivery = {
  at: new Date().toISOString(), role: '独立先行测试，非开发、非 GUI',
  candidate: json(join(out, 'candidate.json')), verdict: 'FAIL_NECESSARY_RED_CONFIRMED',
  defect: {
    id: 'ASK-AUTH-01', file: 'packages/dsh-pm-tool/src/commands/ask.ts', lines: '126-128',
    observed: '真实 AUTH / prepare INVALID_CREDENTIAL 被 /Key|密钥/ 重写为 PROD_KEY_MISSING',
    recommendation: "仅以 AiDraftError.code === 'MISSING_CREDENTIAL' 或原 PROD_KEY_MISSING 精确哨兵进入缺凭据分支；删除消息正则，其余沿现有中文兜底。",
    productChanged: false,
  },
  tests: { controls: { passed: 8, failed: 0, originalExit: 0 },
    necessaryRed: { passed: 0, failed: 3, originalExit: 1 }, filteredPendingNotPassed: true },
  inheritedAIClientSourceAuto: '保留原有限 PASS，不撤 ATF-01/02/03，不外推命令/GUI',
  released: true, stop: true, nextOwner: 'Main派不同修复开发；随后另一独立SOURCE/AUTO专家复验，Main唯一构建及原合同GUI采证。',
  guiSigned: false, wholeFeatureSigned: false, totalGateSigned: false, release: 'STOP',
  noBuildInstall: true, noServiceOperation: true, noCredentialOperation: true, noGitChanges: true,
}
save('delivery.json', delivery)
const outputs = readdirSync(join(repo, 'docs/testing')).filter(name => name.startsWith(prefix))
const docsIndex = Object.fromEntries(outputs.map(name => [name, inventory(join(repo, 'docs/testing', name))]))
save('delivery-index.json', { at: new Date().toISOString(), evidence: inventory(out), docs: docsIndex,
  exclusions: '本索引自身及后继seal工具receipt不自含；所有旧失败原件保持原路径，未删除覆盖。' })
console.log(JSON.stringify({ released: true, stop: true, controls: 8, necessaryRed: 3,
  originalExits: receipts.map(row => row.originalExit), protection: close.protection,
  verdict: delivery.verdict, release: 'STOP' }))

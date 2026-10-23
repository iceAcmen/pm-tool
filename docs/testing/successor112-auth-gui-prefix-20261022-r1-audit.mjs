import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const root = process.cwd()
const prefix = path.join(root, 'docs/testing/successor112-auth-gui-prefix-20261022-r1')
const gui = path.join(root, 'reports/all-pending-evidence-20261021/Successor112GuiR1')
const combined = path.join(root, 'reports/all-pending-evidence-20261021/CombinedSuccessor112R1')
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const bytes = f => fs.readFileSync(f)
const json = f => JSON.parse(bytes(f))
const stamp = f => { const b = bytes(f); return { bytes: b.length, sha256: sha(b) } }
const save = (name, value) => fs.writeFileSync(`${prefix}-${name}.json`, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const joinSafe = (base, rel) => {
  assert(!path.isAbsolute(rel))
  const f = path.resolve(base, rel)
  assert(f.startsWith(base + path.sep))
  return f
}
const manifest = json(path.join(gui, 'index-r1.json'))
const candidate = json(path.join(combined, 'candidate.json'))
const frozen = candidate.pkg
const inputManifest = json(path.join(combined, 'complete-inputs.json'))
const artifactManifest = json(path.join(combined, 'built-artifacts.json'))
const sourceManifest = json(path.join(combined, 'source-files.json'))
const contracts = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/plans/2026-10-22-combined-successor-112-regression.md',
  'docs/testing/ask-auth-feedback-independent-retest-20261022-r1-report.md',
  'docs/testing/ask-auth-feedback-red-20261022-r1-plan.md',
  'docs/testing/atf-combined-runtime-gui-review-20261022-r1.md',
  'docs/testing/remaining-governance-cases-20261021.md',
]
const extra = [
  path.join(gui, 'index-r1.json'),
  ...['candidate.json', 'source-files.json', 'complete-inputs.json', 'built-artifacts.json'].map(f => path.join(combined, f)),
  path.join(root, 'reports/all-pending-evidence-20261021/CombinedGuiR1/executor-gateway.mjs'),
  ...contracts.map(f => path.join(root, f)),
]
const protectedPaths = [...new Set([
  ...Object.keys(manifest.files).map(f => joinSafe(gui, f)),
  ...Object.keys(inputManifest).map(f => joinSafe(frozen, f)),
  ...Object.keys(artifactManifest).map(f => joinSafe(path.join(frozen, 'lib'), f)),
  ...extra,
])].sort()
const mainSource = () => Object.fromEntries(Object.keys(sourceManifest.source).map(f => [f, stamp(path.join(root, f))]))
const protectedStamps = () => Object.fromEntries(protectedPaths.map(f => [f, stamp(f)]))
const walk = base => {
  const result = []
  const descend = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name)
      if (e.isDirectory()) descend(f)
      else result.push(path.relative(base, f))
    }
  }
  descend(base)
  return result.sort()
}
const verifyRows = (base, rows) => {
  for (const [rel, expected] of Object.entries(rows)) assert.deepEqual(stamp(joinSafe(base, rel)), expected, rel)
  return Object.keys(rows).length
}
const changes = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))

function rpc(name) {
  const rows = json(path.join(gui, `${name}-events.json`))
  const requests = rows.filter(e => e.method === 'Network.requestWillBeSent')
  const pairs = requests.map(request => {
    const responses = rows.filter(e => e.method === 'Network.responseReceived' && e.requestId === request.requestId)
    assert.equal(responses.length, 1)
    const response = responses[0]
    assert.equal(response.body.base64Encoded, false)
    const parsed = JSON.parse(response.body.body)
    assert.equal(request.body.rpcId, parsed.rpcId)
    assert.equal(parsed.result.ok, true)
    return {
      requestId: request.requestId, rpcId: parsed.rpcId, line: request.body.payload.args.line,
      hostHttpStatus: response.status, command: parsed.result.value.result,
    }
  })
  return { pairs, exceptions: rows.filter(e => e.method === 'Runtime.exceptionThrown'), frames: rows.filter(e => e.method === 'Page.screencastFrame') }
}

function audit() {
  assert.equal(manifest.sourceCount, 112)
  assert.equal(Object.keys(manifest.files).length, 747)
  const indexedCount = verifyRows(gui, manifest.files)
  assert.equal(sourceManifest.count, 112)
  assert.equal(Object.keys(sourceManifest.source).length, 112)
  assert.deepEqual(json(path.join(gui, 'final-source-binding.json')), sourceManifest)
  const declaredPlugin = []
  for (const [rel, hash] of Object.entries(sourceManifest.source)) {
    if (!rel.startsWith('packages/dsh-pm-tool/')) continue
    const f = joinSafe(frozen, rel.slice('packages/dsh-pm-tool/'.length))
    assert.equal(stamp(f).sha256, hash, rel)
    declaredPlugin.push(rel)
  }
  const inputCount = verifyRows(frozen, inputManifest)
  assert.equal(inputCount, 519)
  const artifactCount = verifyRows(path.join(frozen, 'lib'), artifactManifest)
  assert.deepEqual(walk(path.join(frozen, 'lib')), Object.keys(artifactManifest).sort())
  const host = json(path.join(gui, 'host-start.json'))
  assert.equal(host.candidateSha256, stamp(path.join(combined, 'candidate.json')).sha256)
  assert.equal(host.sourceSha256, stamp(path.join(combined, 'source-files.json')).sha256)
  assert.equal(host.bundle, frozen)
  assert.equal(host.port, 3262)
  assert.equal(host.pid, 92870)
  assert.equal(host.flags.DSH_PM_E2E, '0')
  const built = bytes(path.join(frozen, 'lib/client.js'))
  const loaded = bytes(path.join(gui, '15-loaded-0.js'))
  const suffix = Buffer.from('//# sourceMappingURL=client.js.map')
  assert(built.subarray(-suffix.length).equals(suffix))
  const segment = built.subarray(0, built.length - suffix.length)
  const first = loaded.indexOf(segment)
  assert.equal(first, 875361)
  assert.equal(loaded.indexOf(segment, first + 1), -1)
  const binding = json(path.join(gui, 'loaded-binding.json'))
  assert.equal(binding.fullClientSha256, sha(built))
  assert.equal(binding.fullClientBytes, built.length)
  assert.equal(binding.executableSegmentSha256, sha(segment))
  assert.equal(binding.executableSegmentBytes, segment.length)
  assert.equal(binding.loadedResponseSha256, sha(loaded))
  assert.equal(binding.loadedResponseBytes, loaded.length)
  assert.equal(binding.offset, first)
  assert.equal(loaded.indexOf(built), -1)
  const rootNames = ['19-cycle-retry-reopened', '21-auth', '22-rate', '22-normal']
  const roots = Object.fromEntries(rootNames.map(n => [n, json(path.join(gui, `${n}-roots.json`))]))
  const rawCounts = {}
  for (const name of rootNames) {
    const rows = Object.fromEntries(Object.entries(roots[name]).filter(([p]) => p.startsWith('data/pmtool/')))
    rawCounts[name] = verifyRows(path.join(gui, `${name}-raw`), rows)
    assert.deepEqual(walk(path.join(gui, `${name}-raw`)), Object.keys(rows).sort())
  }
  const modePath = 'data/pmtool/settings/aiModelMode.json'
  const modeBefore = json(path.join(gui, `${rootNames[0]}-raw`, modePath))
  const modeAfter = json(path.join(gui, '21-auth-raw', modePath))
  assert.deepEqual(modeBefore, { version: 2, record: { value: 'prod', updatedAt: '2026-10-22T12:31:43.291Z' } })
  assert.deepEqual(modeAfter, { version: 2, record: { value: 'prod', updatedAt: '2026-10-22T14:12:58.750Z' } })
  const product = rows => Object.fromEntries(Object.entries(rows).filter(([p]) =>
    p.startsWith('data/pmtool/') || p.startsWith('files/') || p.startsWith('backups/')))
  const rootDeltas = {}
  for (let i = 1; i < rootNames.length; i++) {
    const prev = rootNames[i - 1], current = rootNames[i]
    const pChanges = changes(product(roots[prev]), product(roots[current]))
    assert.deepEqual(pChanges, i === 1 ? [modePath] : [])
    rootDeltas[`${prev}->${current}`] = {
      allRoots: changes(roots[prev], roots[current]), productChanges: pChanges,
      unchangedOtherSettings: Object.keys(roots[current]).filter(p => p.startsWith('data/pmtool/settings/') && p !== modePath),
    }
  }
  const auth = rpc('21-auth'), rate = rpc('22-rate'), normal = rpc('22-normal')
  assert.equal(auth.pairs.length, 2)
  assert.equal(auth.pairs[0].line, '/pm model mode prod')
  assert.equal(auth.pairs[0].command.kind, 'success')
  assert.equal(rate.pairs.length, 1)
  assert.equal(normal.pairs.length, 1)
  const terminals = [auth.pairs[1], rate.pairs[0], normal.pairs[0]]
  assert.deepEqual(terminals.map(p => p.command.kind), ['error', 'error', 'success'])
  assert.equal(terminals[0].command.text, '副驾暂不可用：模型 ark-plan/deepseek-v4-1-flash-260910 凭据无效或已失效，请检查 API Key。')
  assert(!/PROD_KEY_MISSING|未检测到|凭据缺失/.test(terminals[0].command.text))
  assert.equal(terminals[1].command.text, '副驾暂不可用：模型服务限流，请稍后再试。')
  assert.equal(terminals[2].command.text, '修后副驾正常恢复：这是只读回答，不修改项目。')
  const gateway = bytes(path.join(gui, 'gateway-slice.ndjson')).toString().trim().split('\n').map(l => JSON.parse(l))
  assert.deepEqual(gateway.map(g => [g.sequence, g.fixture.behavior]), [[8, 'auth'], [9, 'rate_limit'], [10, 'success']])
  const questions = ['只读验证凭据失效原因', '只读验证限流原因', '只读确认正常恢复']
  gateway.forEach((g, i) => {
    assert.equal(g.path, '/v1/messages')
    assert.equal(g.body.model, 'deepseek-v4-1-flash-260910')
    assert(g.body.messages[0].content[0].text.includes(questions[i]))
    assert(terminals[i].line.includes(questions[i]))
  })
  const gatewayFile = path.join(root, 'reports/all-pending-evidence-20261021/CombinedGuiR1/executor-gateway.mjs')
  assert(bytes(gatewayFile).toString().includes("res.writeHead(auth?401:429"))
  const frames = [...auth.frames, ...rate.frames, ...normal.frames]
  frames.forEach(f => assert.equal(stamp(joinSafe(gui, f.file)).sha256, f.sha256))
  const states = ['21-auth', '22-rate', '22-normal'].map(n => json(path.join(gui, `${n}.json`)))
  states.forEach(s => {
    assert.equal(s.origin, 'http://127.0.0.1:3262')
    assert.equal(s.timeOrigin, states[0].timeOrigin)
    assert.equal(s.dark, true)
    assert.deepEqual(s.pilot, {})
  })
  assert(states[0].text.includes(`副驾暂不可用：${terminals[0].command.text}`))
  assert(states[1].text.includes(`副驾暂不可用：${terminals[1].command.text}`))
  assert(states[2].text.includes(terminals[2].command.text))
  assert(states[2].text.includes('模型未给出可执行步骤。'))
  const relevantSources = [
    'src/commands/ask.ts', 'src/core/ai-client.ts', 'src/core/ui-feedback.ts',
    'src/client/index.tsx', 'src/client/shared/drawers/sidecar-portal.tsx', 'src/client/shared/markdown-view.tsx',
  ]
  const sourceBindings = Object.fromEntries(relevantSources.map(rel => [rel, {
    frozen: stamp(path.join(frozen, rel)), mainAtRead: stamp(path.join(root, 'packages/dsh-pm-tool', rel)),
  }]))
  const before = json(`${prefix}-before.json`)
  assert.deepEqual(protectedStamps(), before.protected)
  save('audit', {
    at: new Date().toISOString(), actor: 'independent evidence reviewer; not developer or GUI executor',
    index: stamp(path.join(gui, 'index-r1.json')), indexedCount,
    candidate, declarations: { total: 112, pluginInFreeze: declaredPlugin.length, launcherDeclarationOnly: 112 - declaredPlugin.length },
    inputCount, artifactCount, protectedCount: protectedPaths.length,
    loaded: { fullClient: stamp(path.join(frozen, 'lib/client.js')), response: stamp(path.join(gui, '15-loaded-0.js')),
      segment: { bytes: segment.length, sha256: sha(segment) }, offset: first, unique: true,
      firstLoadCacheNotSigned: true, hostGitIdentityNotSigned: true },
    sourceBindings, mainSourceChangesSinceBefore: changes(before.mainSource, mainSource()),
    host, gateway: gateway.map(g => ({ at: g.at, sequence: g.sequence, behavior: g.fixture.behavior, model: g.body.model })),
    gatewayCode: stamp(gatewayFile), modelWireResponseNotArchived: true,
    rpc: [auth.pairs, rate.pairs, normal.pairs].flat(), rawCounts, modeBefore, modeAfter, rootDeltas,
    viewport: states[0].viewport, timeOrigin: states[0].timeOrigin,
    frames: frames.map(f => ({ file: f.file, sha256: f.sha256, metadata: f.metadata })),
    capturedExceptions: [auth, rate, normal].map(r => r.exceptions.length),
    consoleNotCapturedByHelper: true, fullRuntimeNotSigned: true,
    verdict: {
      authCause: 'PASS_LIMITED_GUI', rateCauseAndHealthyRecovery: 'PASS_LIMITED_GUI',
      prefixCompleteMessage: 'FAIL', cancel: 'NOT_SIGNED', realExternalModel: 'NOT_SIGNED',
      RA_AI06: 'NOT_SIGNED', parentGoal: 'NOT_SIGNED', ordinaryCommit: 'MAIN_ONLY_NOT_AUTHORIZED_THIS_ROLE',
    },
  })
}

const action = process.argv[2]
if (action === 'before') {
  save('before', { at: new Date().toISOString(), protected: protectedStamps(), mainSource: mainSource() })
} else if (action === 'audit') {
  audit()
} else if (action === 'close') {
  const before = json(`${prefix}-before.json`)
  assert.deepEqual(protectedStamps(), before.protected)
  save('close', {
    at: new Date().toISOString(), protectedCount: protectedPaths.length, protectedUnchanged: true,
    mainSourceChanges: changes(before.mainSource, mainSource()), released: true, stop: true,
    browserServiceGitBuildInstallKeyActions: 'NONE',
    signedScope: 'original112 limited AUTH/rate/recovery evidence; duplicate prefix FAIL; no repaired GUI',
  })
} else throw new Error('Use before | audit | close')
console.log(JSON.stringify({ action, exit: 0, result: `${prefix}-${action}.json`, node: process.version }))

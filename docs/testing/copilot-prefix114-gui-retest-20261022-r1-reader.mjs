import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

// Evidence reader only: no product imports, subprocesses, network or live runtime reads.
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const evidence = repo + '/reports/all-pending-evidence-20261021'
const gui = evidence + '/Successor114GuiR1'
const combined = evidence + '/CombinedSuccessor114R1'
const independent = evidence + '/CopilotPrefixRetestR1'
const prior = evidence + '/Successor112GuiR1'
const freeze = '/private/tmp/pmtool-combined-successor114-20261022-r1'
const pkg = freeze + '/packages/dsh-pm-tool'
const self = repo + '/docs/testing/copilot-prefix114-gui-retest-20261022-r1'
const mode = process.argv[2]
assert(['audit', 'audit-r2', 'close'].includes(mode))
const output = self + '-audit' + (mode === 'close' ? '-close' : mode === 'audit-r2' ? '-r2' : '') + '.json'
assert(!fs.existsSync(output), 'Never overwrite an audit')
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const protectedReads = {}
const read = file => {
  assert(fs.lstatSync(file).isFile(), 'Not an ordinary file: ' + file)
  const b = fs.readFileSync(file)
  const fp = { bytes: b.length, sha256: sha(b) }
  if (protectedReads[file]) assert.deepEqual(fp, protectedReads[file], 'Read drift: ' + file)
  protectedReads[file] = fp
  return b
}
const json = file => JSON.parse(read(file).toString('utf8'))
const text = file => read(file).toString('utf8')
const fp = file => { const b = read(file); return { bytes: b.length, sha256: sha(b) } }
const groups = {}
const errors = []
function group(name, fn) {
  try { groups[name] = fn(); console.log('READ_OK ' + name) }
  catch (e) { errors.push({ group: name, error: e.message }); console.log('READ_ERROR ' + name + ': ' + e.message) }
}
function names(dir) {
  const result = []
  function walk(current, prefix = '') {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const rel = prefix + entry.name
      if (entry.isDirectory()) walk(current + '/' + entry.name, rel + '/')
      else { assert(entry.isFile(), rel); result.push(rel) }
    }
  }
  walk(dir)
  return result.sort()
}
function table(root, rows) {
  for (const [name, expected] of Object.entries(rows)) {
    assert(!path.isAbsolute(name) && !name.split('/').includes('..'), name)
    if (typeof expected === 'string') assert.equal(fp(root + '/' + name).sha256, expected, name)
    else assert.deepEqual(fp(root + '/' + name), expected, name)
  }
  return { count: Object.keys(rows).length, manifestSha256: sha(JSON.stringify(Object.entries(rows).sort())) }
}
function pack(root) {
  const index = json(root + '/index-r1.json')
  table(root, index.files)
  const additions = names(root).filter(n => n !== 'index-r1.json' && !Object.hasOwn(index.files, n))
  return { index: fp(root + '/index-r1.json'), at: index.at,
    files: Object.keys(index.files).length, additionsAfterIndex: additions }
}
function rpc(name) {
  const events = json(gui + '/' + name + '-events.json')
  const requests = events.filter(e => e.method === 'Network.requestWillBeSent')
  const responses = events.filter(e => e.method === 'Network.responseReceived')
  assert.equal(requests.length, responses.length, name)
  const pairs = requests.map(q => {
    const matches = responses.filter(r => r.requestId === q.requestId)
    assert.equal(matches.length, 1)
    const r = matches[0]
    assert.equal(r.status, 200)
    assert.equal(r.body.base64Encoded, false)
    const body = JSON.parse(r.body.body)
    assert.equal(body.rpcId, q.body.rpcId)
    assert.equal(body.result.ok, true)
    return { requestId: q.requestId, rpcId: body.rpcId,
      agentId: q.body.payload.args.agentId, line: q.body.payload.args.line,
      transportStatus: r.status, result: body.result.value.result }
  })
  const frames = events.filter(e => e.method === 'Page.screencastFrame')
  for (const frame of frames) assert.equal(fp(gui + '/' + frame.file).sha256, frame.sha256)
  return { pairs, frames: frames.map(e => ({ file: e.file, metadata: e.metadata })),
    exceptions: events.filter(e => e.method === 'Runtime.exceptionThrown') }
}
const expectedAuth = '副驾暂不可用：模型 ark-plan/deepseek-v4-1-flash-260910 凭据无效或已失效，请检查 API Key。'
const expectedRate = '副驾暂不可用：模型服务限流，请稍后再试。'
const expectedNormal = '修后副驾正常恢复：这是只读回答，不修改项目。'

if (mode === 'close') {
  const original = json(self + '-audit-r2.json')
  for (const [file, expected] of Object.entries(original.protectedReads)) assert.deepEqual(fp(file), expected, file)
  const now = pack(gui)
  assert.equal(now.files, 166)
  assert.deepEqual(now.index, original.groups.original_packs.gui.index)
  const own = { reader: fp(self + '-reader.mjs'), report: fp(self + '-report.md'),
    firstAudit: fp(self + '-audit.json'), finalAudit: fp(self + '-audit-r2.json') }
  fs.writeFileSync(output, JSON.stringify({ at: new Date().toISOString(),
    originalFilesUnchanged: Object.keys(original.protectedReads).length,
    additionsAfterIndex: now.additionsAfterIndex, own, errors: [],
    release: 'STOP', role: 'released; GUI review only' }, null, 2) + '\n', { flag: 'wx' })
  console.log('CLOSE_OK original=' + Object.keys(original.protectedReads).length)
  process.exit(0)
}

if (mode === 'audit-r2') {
  group('first_reader_failure_preserved', () => {
    const first = json(self + '-audit.json')
    assert.equal(first.errors.length, 1)
    assert.equal(first.errors[0].group, 'f5_preparation_and_readback')
    for (const [file, expected] of Object.entries(first.protectedReads)) assert.deepEqual(fp(file), expected, file)
    return { firstAudit: fp(self + '-audit.json'), originalExit: 1,
      correction: 'Public fileAssets omits internal relPath; compare projection to snapshot and full record to standard backup' }
  })
}

group('original_packs', () => {
  const result = { gui: pack(gui), prior112: pack(prior) }
  assert.equal(result.gui.files, 166)
  assert.equal(result.prior112.files, 747)
  for (const entry of fs.readdirSync(repo + '/docs/testing')) {
    if (entry.startsWith('successor112-auth-gui-prefix-20261022-r1-')
      && fs.lstatSync(repo + '/docs/testing/' + entry).isFile()) fp(repo + '/docs/testing/' + entry)
  }
  const oldReport = text(repo + '/docs/testing/successor112-auth-gui-prefix-20261022-r1-report.md')
  assert(oldReport.includes('FAIL：S112-PREFIX-01'))
  const oldResult = json(repo + '/docs/testing/successor112-auth-gui-prefix-20261022-r1-r2-test.result.json')
  assert.equal(oldResult.numTotalTests, 5)
  assert.equal(oldResult.numPassedTests, 2)
  assert.equal(oldResult.numFailedTests, 3)
  result.oldNecessaryRed = { tests: 5, passed: 2, failed: 3, changed: false }
  return result
})

group('candidate_and_executable_bytes', () => {
  const candidate = json(combined + '/candidate.json')
  assert.equal(candidate.baseline, '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd')
  assert.equal(candidate.freeze, freeze)
  assert.equal(candidate.sourceCount, 114)
  assert.equal(candidate.completeInputCount, 521)
  assert.equal(candidate.version, '0.7.4')
  const sources = json(gui + '/final-source-binding.json')
  assert.deepEqual(sources, json(combined + '/source-files.json'))
  assert.deepEqual(sources.source, json(independent + '/source-files.json').source)
  const inputRows = json(combined + '/complete-inputs.json')
  assert.deepEqual(inputRows, json(independent + '/complete-inputs.json'))
  assert.equal(Object.keys(inputRows).length, 521)
  const declarations = table(freeze, sources.source)
  assert.equal(declarations.count, 114)
  const inputs = table(pkg, inputRows)
  const artifacts = json(combined + '/built-artifacts.json')
  assert.deepEqual(names(pkg + '/lib'), Object.keys(artifacts).sort())
  const built = table(pkg + '/lib', artifacts)
  const host = json(gui + '/host-start.json')
  assert.equal(host.pid, 10975)
  assert.equal(host.port, 3264)
  assert.equal(host.bundle, pkg)
  assert.equal(host.candidateSha256, fp(combined + '/candidate.json').sha256)
  assert.equal(host.sourceSha256, fp(combined + '/source-files.json').sha256)
  assert.equal(host.flags.DSH_PM_E2E, '0')
  const client = read(pkg + '/lib/client.js')
  assert.equal(sha(client), host.bundleSha256)
  const suffix = Buffer.from('//# sourceMappingURL=client.js.map')
  assert(client.subarray(-suffix.length).equals(suffix))
  const executable = client.subarray(0, client.length - suffix.length)
  const loaded = read(gui + '/04-loaded-0.js')
  const binding = json(gui + '/04-loaded-0.json')
  const offset = loaded.indexOf(executable)
  const secondOffset = loaded.indexOf(executable, offset + 1)
  assert(offset >= 0)
  assert.equal(secondOffset, -1)
  const actual = { responseBytes: loaded.length, responseSha256: sha(loaded),
    fullClientBytes: client.length, fullClientSha256: sha(client),
    executableBytes: executable.length, executableSha256: sha(executable), offset, unique: true }
  for (const [key, value] of Object.entries(actual)) assert.equal(binding[key], value, key)
  assert.equal(binding.status, 200)
  assert.deepEqual(binding.resource, json(gui + '/04-resources.json')[0])
  assert.equal(binding.firstLoadCacheEligibilityNotClaimed, true)
  const setup = text(gui + '/host-setup-source.mjs')
  assert(setup.includes("await fs.symlink(pkg, profile + '/node_modules/dsh-pm-tool')"))
  assert(setup.includes("const profile = runtime + '/home/profiles/pm'"))
  const profile = text(gui + '/isolated-profile.yml')
  assert(profile.includes('root: /private/tmp/pmtool-successor114-gui-runtime-20261022-r1/data'))
  assert(profile.includes('baseURL: http://127.0.0.1:3261'))
  assert(profile.includes('apiKeyEnv: DSH_PM_LOCAL_GATEWAY_KEY'))
  assert(profile.includes('maxRetries: 0'))
  return { candidate, declarations, inputs, artifacts: built, actual, secondOffset,
    fullClientOffset: loaded.indexOf(client), sourceMapTailOnlyBytes: suffix.length,
    host, profile: fp(gui + '/isolated-profile.yml'),
    setup: fp(gui + '/host-setup-source.mjs'),
    firstLoadCache: 'NOT_SIGNED; not a new precondition',
    hostGitBundleIdentity: 'Incomplete; not replaced by plugin identity; not a new precondition' }
})

group('independent_source_auto_identity_only', () => {
  const seal = json(independent + '/handoff-seal.json')
  table(independent, seal.evidence)
  table(repo, seal.ownDocs)
  assert.equal(seal.verdict, 'PASS_LIMITED_SOURCE_AUTO')
  const five = json(independent + '/prefix-five.result.json')
  const affected = json(independent + '/affected.result.json')
  assert.equal(five.numPassedTests, 5)
  assert.equal(five.numFailedTests, 0)
  assert.equal(affected.numPassedTests, 250)
  assert.equal(affected.numFailedTests, 0)
  const noemit = json(independent + '/noemit.command.json')
  return { seal: fp(independent + '/handoff-seal.json'), five: { passed: 5 },
    affected: { passed: 250 }, noemit,
    signature: 'Referenced prior SOURCE/AUTO only; no reexecution or combined114 regression signature' }
})

group('six_actual_execution_receipts', () => {
  const receipts = json(gui + '/execution-receipts.json').receipts
  assert.equal(receipts.length, 6)
  const result = []
  for (const receipt of receipts) {
    const actual = json(gui + '/executions/' + receipt.name + '/execution.json')
    assert.equal(receipt.exitCode, 0)
    assert.equal(actual.executionId, receipt.id)
    assert.equal(actual.pid, receipt.pid)
    assert.equal(actual.exitCode, 0)
    assert.equal(actual.status, 'exited')
    assert.equal(actual.outputComplete, true)
    const log = text(gui + '/executions/' + receipt.name + '/output.log')
    const stderr = fp(gui + '/executions/' + receipt.name + '/stderr.log')
    result.push({ ...receipt, actual, output: fp(gui + '/executions/' + receipt.name + '/output.log'),
      stderr, inputDisabledFalse: receipt.name === 'round05' ? log.includes('inputDisabled: false') : null })
  }
  assert.equal(result.at(-1).inputDisabledFalse, true)
  const privateCopies = [
    ['helper-source.mjs', '/private/tmp/pmtool-successor114-helper-r1.mjs'],
    ['host-setup-source.mjs', '/private/tmp/pmtool-successor114-host-setup-r1.mjs'],
    ...[1, 2, 3, 4, 5].map(i => ['execution-scripts/pmtool-successor114-round0' + i + '.mjs',
      '/private/tmp/pmtool-successor114-round0' + i + '.mjs']),
  ]
  for (const [archive, original] of privateCopies) assert.deepEqual(fp(gui + '/' + archive), fp(original))
  return { receipts: result, privateHelperCopies: privateCopies, reexecuted: false }
})

group('f5_preparation_and_readback', () => {
  const binding = json(gui + '/fixture-binding.json')
  assert.deepEqual(fp(binding.source), { bytes: binding.bytes, sha256: binding.sourceSha256 })
  const backup = json(binding.source)
  const pre = json(gui + '/02-f5-precheck-roots.json')
  assert.deepEqual(pre, json(gui + '/02-f5-first-confirm-roots.json'))
  assert.equal(Object.keys(pre).filter(n => n.startsWith('data/pmtool/')).length, 0)
  const checks = rpc('02-f5-precheck')
  const first = rpc('02-f5-first-confirm')
  const restored = rpc('03-f5-restored')
  assert.equal(checks.pairs.length, 1)
  assert(!checks.pairs[0].line.endsWith(' confirm'))
  assert.equal(first.pairs.length, 0)
  assert.equal(restored.pairs.length, 2)
  assert.equal(restored.pairs[0].line, checks.pairs[0].line + ' confirm')
  assert(restored.pairs[0].result.text.includes('当前库为空，未生成安全快照。'))
  const snapshot = JSON.parse(restored.pairs[1].result.text)
  const rootRows = json(gui + '/03-f5-restored-roots.json')
  const mapping = { projects: 'projects', tasks: 'tasks', milestones: 'milestones',
    riskIssues: 'risk_issues', meetings: 'meetings', reports: 'reports', deliverables: 'deliverables',
    okrs: 'okrs', lessons: 'lessons', habits: 'habits', fileAssets: 'file_assets' }
  for (const [key, folder] of Object.entries(mapping)) {
    for (const record of snapshot[key]) {
      const file = 'data/pmtool/' + folder + '/' + record.id + '.json'
      const stored = json(gui + '/03-f5-restored-raw/' + file).record
      if (key === 'fileAssets') {
        const { relPath, ...publicRecord } = stored
        assert.deepEqual(publicRecord, record)
        assert.deepEqual(stored, new Map(backup.extra.file_assets).get(record.id))
        assert.deepEqual(rootRows['files/' + relPath], { bytes: record.size, sha256: record.sha256 })
      } else assert.deepEqual(stored, record)
      assert.deepEqual(fp(gui + '/03-f5-restored-raw/' + file), rootRows[file])
    }
  }
  let backupRecords = 0
  for (const [key, folder] of Object.entries(mapping).filter(([key]) => Array.isArray(backup[key]))) {
    for (const record of backup[key]) {
      assert.deepEqual(json(gui + '/03-f5-restored-raw/data/pmtool/' + folder + '/' + record.id + '.json').record, record)
      backupRecords++
    }
  }
  for (const [folder, records] of Object.entries(backup.extra)) {
    for (const [id, record] of records) {
      assert.deepEqual(json(gui + '/03-f5-restored-raw/data/pmtool/' + folder + '/' + id + '.json').record, record)
      backupRecords++
    }
  }
  assert.equal(backupRecords, 21)
  return { binding, precheck: checks, firstConfirmation: first, restore: restored,
    backupRecordsExact: backupRecords,
    snapshotCounts: Object.fromEntries(Object.keys(mapping).map(k => [k, snapshot[k].length])),
    scope: 'Legitimate fixture preparation only; no signature for all F5/restore UX' }
})

group('full_text_rpc_gateway_same_panel', () => {
  const auth = rpc('04-auth-single')
  const rate = rpc('05-rate-single')
  const normal = rpc('05-normal')
  assert.equal(auth.pairs.length, 2)
  assert.equal(auth.pairs[0].line, '/pm model mode prod')
  assert.equal(auth.pairs[0].result.kind, 'success')
  assert.equal(auth.pairs[1].result.kind, 'error')
  assert.equal(auth.pairs[1].result.text, expectedAuth)
  assert.equal(rate.pairs.length, 1)
  assert.equal(rate.pairs[0].result.kind, 'error')
  assert.equal(rate.pairs[0].result.text, expectedRate)
  assert.equal(normal.pairs.length, 1)
  assert.equal(normal.pairs[0].result.kind, 'success')
  assert.equal(normal.pairs[0].result.text, expectedNormal)
  const states = ['04-auth-single', '05-rate-single', '05-normal'].map(n => json(gui + '/' + n + '.json'))
  for (const state of states) {
    assert.equal(state.origin, 'http://127.0.0.1:3264')
    assert.equal(state.timeOrigin, 1792681866374.8)
    assert.equal(state.dark, true)
    assert.deepEqual(state.pilot, {})
    assert.equal(state.viewport.innerWidth, 1458)
    assert.equal(state.viewport.innerHeight, 734)
    assert.equal(state.viewport.dpr, 2)
  }
  const gateway = text(gui + '/gateway-slice.ndjson').trim().split('\n').map(s => JSON.parse(s))
  assert.deepEqual(gateway.map(g => g.sequence), [11, 12, 13])
  assert.deepEqual(gateway.map(g => g.fixture.behavior), ['auth', 'rate_limit', 'success'])
  const originalLines = new Set(text(evidence + '/CombinedGuiR1/gateway-requests.ndjson').trim().split('\n'))
  for (const line of text(gui + '/gateway-slice.ndjson').trim().split('\n')) assert(originalLines.has(line))
  const asks = [auth.pairs[1], rate.pairs[0], normal.pairs[0]]
  for (let i = 0; i < asks.length; i++) {
    assert.equal(asks[i].agentId, asks[0].agentId)
    assert.equal(gateway[i].body.model, 'deepseek-v4-1-flash-260910')
    const prompt = gateway[i].body.messages[0].content[0].text
    assert(prompt.includes(asks[i].line.slice(asks[i].line.indexOf('"'))))
    assert(prompt.includes('QA-A-fixture-F5'))
  }
  for (const [i, expected] of [expectedAuth, expectedRate, expectedNormal].entries()) {
    const stateText = states[i].text
    const question = asks[i].line.slice(asks[i].line.indexOf('"') + 1, -1)
    const from = stateText.indexOf(question + '\n')
    const rest = stateText.slice(from + question.length + 1)
    const end = rest.indexOf(i === 2 ? '\n\n模型未给出可执行步骤。' : '\n\n最近处理结果')
    assert(from >= 0 && end >= 0)
    assert.equal(rest.slice(0, end).trim(), expected)
    assert(!stateText.includes('副驾暂不可用：副驾暂不可用：'))
    assert(!stateText.includes('PROD_KEY_MISSING'))
  }
  assert(states[2].text.includes('暂无 AI 确认落库的处理结果'))
  const gatewaySource = text(evidence + '/CombinedGuiR1/executor-gateway.mjs')
  assert(gatewaySource.includes("res.writeHead(auth?401:429"))
  assert(gatewaySource.includes("event('message_stop'"))
  const rawLog = text(gui + '/executions/round05/output.log')
  assert(rawLog.includes('inputDisabled: false'))
  return { auth, rate, normal,
    gateway: gateway.map(g => ({ at: g.at, sequence: g.sequence, behavior: g.fixture.behavior, model: g.body.model })),
    gatewaySource: fp(evidence + '/CombinedGuiR1/executor-gateway.mjs'),
    exactText: { auth: expectedAuth, rate: expectedRate, normal: expectedNormal },
    sameTimeOrigin: states[0].timeOrigin, sameAgentId: asks[0].agentId,
    inputDisabled: false, executablePlan: false,
    modelWireStatusCapture: 'Not present; RPC HTTP200 is transport only',
    guiFinishEnumProbe: 'Not present; do not substitute prior SOURCE/AUTO for GUI' }
})

group('raw_byte_invariants_precise_settings_exception', () => {
  const states = ['03-f5-restored', '04-auth-single', '05-rate-single', '05-normal']
  const roots = states.map(n => json(gui + '/' + n + '-roots.json'))
  const businessNames = Object.keys(roots[0]).filter(n => n.startsWith('data/pmtool/')).sort()
  assert.equal(businessNames.length, 21)
  const raw = []
  for (let i = 0; i < states.length; i++) {
    const set = Object.keys(roots[i]).filter(n => n.startsWith('data/pmtool/')).sort()
    assert.deepEqual(set, businessNames)
    const records = {}
    for (const name of set) {
      assert.deepEqual(fp(gui + '/' + states[i] + '-raw/' + name), roots[i][name])
      records[name] = json(gui + '/' + states[i] + '-raw/' + name)
    }
    raw.push(records)
  }
  const lane = 'data/pmtool/settings/aiModelMode.json'
  const difference = []
  for (let i = 1; i < roots.length; i++) {
    const before = roots[i - 1], after = roots[i]
    const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
      .filter(n => JSON.stringify(before[n]) !== JSON.stringify(after[n]))
    difference.push({ from: states[i - 1], to: states[i], changed })
    for (const name of businessNames) {
      if (i === 1 && name === lane) continue
      assert.deepEqual(before[name], after[name], name)
    }
    for (const prefix of ['files/', 'backups/']) {
      const subset = r => Object.fromEntries(Object.entries(r).filter(([n]) => n.startsWith(prefix)))
      assert.deepEqual(subset(before), subset(after), prefix)
    }
  }
  const beforeLane = raw[0][lane], afterLane = raw[1][lane]
  assert.equal(beforeLane.version, 2)
  assert.equal(beforeLane.record.value, 'prod')
  assert.equal(afterLane.record.value, 'prod')
  assert.equal(beforeLane.record.updatedAt, '2026-10-22T12:31:43.291Z')
  assert.equal(afterLane.record.updatedAt, '2026-10-22T15:15:07.681Z')
  assert.deepEqual({ ...beforeLane, record: { ...beforeLane.record, updatedAt: afterLane.record.updatedAt } }, afterLane)
  assert.deepEqual(raw[1][lane], raw[2][lane])
  assert.deepEqual(raw[2][lane], raw[3][lane])
  return { states, businessRecordsPerState: 21, rawFilesChecked: 84, difference,
    explicitModeTimestampOnly: { before: beforeLane, after: afterLane },
    otherSettings: businessNames.filter(n => n.includes('/settings/') && n !== lane),
    files: Object.keys(roots[0]).filter(n => n.startsWith('files/')),
    backups: Object.keys(roots[0]).filter(n => n.startsWith('backups/')),
    unscannedRoots: ['exports', 'private', 'cache', 'formal assets', 'whole disk'],
    claim: 'Business/files/backups byte invariant, explicit lane timestamp excepted; not all data/settings zero writes' }
})

group('original_read_protection', () => {
  for (const [file, expected] of Object.entries(protectedReads)) {
    const b = fs.readFileSync(file)
    assert.deepEqual({ bytes: b.length, sha256: sha(b) }, expected, file)
  }
  return { count: Object.keys(protectedReads).length, noOriginalReadDrift: true }
})

fs.writeFileSync(output, JSON.stringify({ at: new Date().toISOString(), role: 'Independent GUI evidence reader',
  environment: { os: 'macOS', node: process.version, cwd: process.cwd(), readerPid: process.pid },
  scope: 'Only post-fix original21/22 AUTH/RATE/normal full text; no product test execution',
  groups, errors, protectedReads,
  verdict: errors.length ? 'AUDIT_BLOCKED' : 'BYTE_AND_EVIDENCE_CHECKS_OK_PENDING_REVIEW_REPORT',
  release: 'STOP' }, null, 2) + '\n', { flag: 'wx' })
console.log('AUDIT_END errors=' + errors.length + ' protected=' + Object.keys(protectedReads).length)
process.exitCode = errors.length ? 1 : 0

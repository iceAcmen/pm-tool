import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/op-growth-remaining-gui-review-20261022-r2'
const evidenceBase = path.join(repo, 'reports/all-pending-evidence-20261021')
const root = path.join(evidenceBase, 'OpGrowthRemainingR2')
const priorRoot = path.join(evidenceBase, 'OpGrowthRemainingR1')
const candidateRoot = path.join(evidenceBase, 'CombinedSuccessor112R1')
const inputs = {}
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const product = name => name.startsWith('data/pmtool/') || name.startsWith('files/')

function read(file) {
  const absolute = path.resolve(repo, file)
  const bytes = fs.readFileSync(absolute)
  inputs[absolute] = { bytes: bytes.length, sha256: hash(bytes) }
  return bytes
}
const json = file => JSON.parse(read(file).toString())
const load = name => json(path.join(root, name))
const prior = name => json(path.join(priorRoot, name))
function bound(base, name) {
  const absolute = path.resolve(base, name)
  if (!absolute.startsWith(base + path.sep)) throw new Error(`Outside declared root: ${name}`)
  return absolute
}
function verify(entries, base) {
  const differences = []
  let checked = 0
  for (const [name, declaration] of Object.entries(entries)) {
    const expected = typeof declaration === 'string' ? { sha256: declaration } : declaration
    try {
      const file = bound(base, name)
      read(file)
      checked++
      const actual = inputs[file]
      if (actual.sha256 !== expected.sha256 ||
          (expected.bytes !== undefined && actual.bytes !== expected.bytes)) {
        differences.push({ name, expected, actual })
      }
    } catch (error) {
      differences.push({ name, error: error.message })
    }
  }
  return { declared: Object.keys(entries).length, checked, differences }
}
function mapDifferences(a, b) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
    .filter(name => JSON.stringify(a[name]) !== JSON.stringify(b[name]))
    .map(name => ({ name, before: a[name] ?? null, after: b[name] ?? null }))
}
function rootsCompare(beforeFile, afterFile, filter = product) {
  const before = json(beforeFile)
  const after = json(afterFile)
  const select = value => Object.fromEntries(Object.entries(value).filter(([name]) => filter(name)))
  const a = select(before)
  const b = select(after)
  return {
    beforeFile, afterFile, beforeCount: Object.keys(a).length, afterCount: Object.keys(b).length,
    changes: mapDifferences(a, b),
  }
}
function rpc(files, base) {
  const requests = new Map()
  const responses = new Map()
  const parseErrors = []
  for (const name of files) {
    const data = json(path.join(base, name))
    const rows = Array.isArray(data) ? data : data.rows ?? []
    for (const [position, row] of rows.entries()) {
      try {
        const ref = { file: name, row: position }
        if (row.method === 'Network.requestWillBeSent' && row.body?.method === 'commands/execute') {
          const id = row.body.rpcId
          const request = requests.get(id) ?? {
            rpcId: id, requestId: row.requestId, at: row.at, body: row.body, refs: [],
          }
          request.refs.push(ref)
          requests.set(id, request)
        }
        if (row.method === 'Network.responseReceived' && typeof row.body?.body === 'string') {
          const body = JSON.parse(row.body.body)
          if (!body.rpcId) continue
          const response = responses.get(body.rpcId) ?? {
            rpcId: body.rpcId, requestId: row.requestId, at: row.at,
            http: row.status, body, refs: [],
          }
          response.refs.push(ref)
          responses.set(body.rpcId, response)
        }
      } catch (error) {
        parseErrors.push({ file: name, row: position, error: error.message })
      }
    }
  }
  return {
    rows: [...requests.values()].map(row => ({ ...row, response: responses.get(row.rpcId) ?? null })),
    responseOnly: [...responses.values()].filter(row => !requests.has(row.rpcId)),
    parseErrors,
  }
}
function execution(file, expected) {
  const raw = json(file)
  const fields = ['executionId', 'pid', 'exitCode', 'status', 'cwd', 'outputComplete',
    'createdAtMs', 'startedAtMs', 'finishedAtMs', 'terminalReason']
  const metadata = Object.fromEntries(fields.map(name => [name, raw[name]]))
  return {
    expected, metadata, fingerprint: inputs[path.resolve(repo, file)],
    matches: expected.executionId === raw.executionId && expected.pid === raw.pid &&
      expected.exitCode === raw.exitCode && raw.status === 'exited' && raw.outputComplete === true,
    output: read(path.join(path.dirname(file), 'output.log')).toString(),
  }
}
function capture() {
  const index = load('index-r1.json')
  const evidence = verify(index, root)
  const names = Object.keys(index)
  const close = load('source-binding-close.json')
  const parent = load('parent.json')
  const previousBinding = prior('source-binding.json')
  const candidate = json(path.join(candidateRoot, 'candidate.json'))
  const source = json(path.join(candidateRoot, 'source-files.json'))
  const complete = json(path.join(candidateRoot, 'complete-inputs.json'))
  const frozenSource = Object.fromEntries(Object.entries(close.source).filter(([name]) => name.startsWith('packages/')))
  const launcherSource = Object.fromEntries(Object.entries(close.source).filter(([name]) => name.startsWith('launcher/')))
  const packageVerification = verify(frozenSource, candidate.freeze)
  const launcherVerification = verify(launcherSource, repo)
  const completeVerification = verify(complete, candidate.pkg)
  const hostStart = prior('host-start.json')
  const hostReentry = prior('host-reentry-start.json')
  const priorIndex = prior('index-r1.json')
  const priorSeal = json('docs/testing/op-growth-remaining-gui-review-20261022-r1-seal.json')
  const priorArtifacts = priorSeal.artifacts.map(artifact => {
    const file = path.resolve(repo, artifact.file)
    read(file)
    return {
      ...artifact, actual: inputs[file],
      matches: inputs[file].bytes === artifact.bytes && inputs[file].sha256 === artifact.sha256,
    }
  })
  const hostFingerprintMatches = hostStart.candidateSha256 ===
    inputs[path.join(candidateRoot, 'candidate.json')].sha256 &&
    hostStart.sourceSha256 === inputs[path.join(candidateRoot, 'source-files.json')].sha256
  const receiptList = load('execution-receipts.json')
  const receipts = receiptList.receipts.map(row =>
    execution(path.join(root, 'execution-receipts', row.executionId, 'execution.json'), row))
  const mainSealReceipt = execution(
    '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution/5819eb547595d95e8bb1ed818fe4c5aa/execution.json',
    { executionId: '5819eb547595d95e8bb1ed818fe4c5aa', pid: 16389, exitCode: 0 },
  )
  const topJson = names.filter(name => !name.includes('/') && /^\d.*\.json$/.test(name))
  const states = topJson.filter(name => !/-events|-roots|-command|-probe/.test(name))
    .map(name => ({ file: name, state: load(name) }))
  const roots = topJson.filter(name => name.endsWith('-roots.json')).map(name => {
    const all = load(name)
    const entries = Object.fromEntries(Object.entries(all).filter(([key]) => product(key)))
    return {
      state: name.replace('-roots.json', ''),
      filesCount: Object.keys(all).filter(key => key.startsWith('files/')).length,
      verification: verify(entries, path.join(root, name.replace('-roots.json', '-raw'))),
    }
  })
  const commands = rpc(topJson.filter(name => /-(events|command)\.json$/.test(name)), root)
  const inheritedRpc = rpc([
    '13-effort-keyboard-save-events.json',
    '15-status-done-events.json',
    '16-completed-correction-command.json',
    '17-completed-revert-events.json',
  ], priorRoot)
  const taskTimeline = names.filter(name => /-raw\/data\/pmtool\/tasks\/t-(0003|0005|0007|0010)\.json$/.test(name))
    .map(name => {
      const row = load(name)
      const checklist = row.record.checklist
      return {
        file: name, row,
        readerCountOnly: Array.isArray(checklist) ? {
          total: checklist.length, checked: checklist.filter(item => item.done === true).length,
        } : null,
      }
    })
  const reports = names.filter(name => /-raw\/data\/pmtool\/reports\/rpt-\d+\.json$/.test(name))
    .map(name => ({ file: name, fingerprint: inputs[path.join(root, name)], row: load(name) }))
  const reportInheritance = ['rpt-0001', 'rpt-0002'].map(id => {
    const relative = `29-newhost-task-reopen-raw/data/pmtool/reports/${id}.json`
    const file = path.join(priorRoot, relative)
    read(file)
    const original = inputs[file]
    const matchingReports = reports.filter(item => item.row.record.id === id)
    return {
      id, priorFile: relative, original, priorDeclared: priorIndex.files[relative],
      originalMatchesIndex: original.sha256 === priorIndex.files[relative].sha256 &&
        original.bytes === priorIndex.files[relative].bytes,
      count: matchingReports.length,
      differences: matchingReports.filter(item => item.fingerprint.sha256 !== original.sha256 ||
        item.fingerprint.bytes !== original.bytes),
      averageProgress: matchingReports.map(item => item.row.record.snapshot.tasks.averageProgress),
    }
  })
  const comparisons = [
    rootsCompare(path.join(priorRoot, '29-newhost-task-reopen-roots.json'), path.join(root, '01-report0-1440-roots.json')),
    rootsCompare(path.join(root, '01-report0-1440-roots.json'), path.join(root, '03-report30-complete66-roots.json')),
    rootsCompare(path.join(root, '04-saved-effort-evidence-visible-roots.json'), path.join(root, '05-invalid-fields-visible-roots.json')),
    rootsCompare(path.join(root, '01-report0-1440-roots.json'), path.join(root, '15-objective40-null-stable-roots.json'),
      name => name.startsWith('data/pmtool/reports/')),
  ]
  const probes = Object.fromEntries(['12-gantt-fill-probe.json', '14-bar-fill-probe.json',
    '15-bar-fill-probe.json'].map(name => [name, load(name)]))
  for (const file of ['AGENTS.md', 'docs/collaboration.md',
    'docs/testing/op-growth-final-inheritance-20261022-r1.md',
    'docs/testing/remaining-objective-cases-20261021.md']) read(file)
  const errors = [
    ...evidence.differences, ...packageVerification.differences, ...launcherVerification.differences,
    ...completeVerification.differences, ...commands.parseErrors, ...inheritedRpc.parseErrors,
    ...roots.flatMap(row => row.verification.differences),
  ]
  const bindingDifferences = {
    r1ToR2: mapDifferences(previousBinding.source, close.source),
    candidateToR2: mapDifferences(source.source, close.source),
  }
  const checks = {
    evidence348: evidence.declared === 348 && evidence.checked === 348,
    source112: close.count === 112 && Object.keys(close.source).length === 112 &&
      packageVerification.declared + launcherVerification.declared === 112,
    complete519: completeVerification.declared === 519 && completeVerification.checked === 519,
    baseline: close.baseline === previousBinding.baseline && close.baseline === candidate.baseline,
    binding: !bindingDifferences.r1ToR2.length && !bindingDifferences.candidateToR2.length,
    hostFingerprintMatches,
    r1Artifacts: priorArtifacts.every(row => row.matches),
    runtimeMetadata: close.pid === 7387 && close.port === 3263 &&
      hostReentry.pid === 7387 && hostReentry.port === 3263 && close.pluginTarget === candidate.pkg &&
      parent.pid === close.pid && parent.port === close.port &&
      close.runningCandidate === 112 && close.completeInputCount === 519,
    receipts: receipts.length === 12 && receipts.every(row => row.matches) && mainSealReceipt.matches,
    reportBytes: reportInheritance.every(row => row.originalMatchesIndex && row.count === 14 &&
      !row.differences.length && row.averageProgress.every(value => value === 66)),
    comparisons: comparisons.every(row => !row.changes.length),
    commands: commands.rows.length > 0 && commands.rows.every(row =>
      row.response?.body.result?.ok === true && row.response?.body.result?.value?.result?.kind === 'success'),
  }
  const result = {
    at: new Date().toISOString(),
    role: '不同独立GUI审证专家；仅读原件并目视，非开发/GUI执行端/Main/builder',
    environment: { platform: process.platform, node: process.version, cwd: process.cwd() },
    scope: 'R1明确缺口补证，不签整ID/OP全域/旧bare/native/P0-P3/B8/ordinarycommit/发布',
    reviewerDeviation: '开头误调用只读git status --short（exit0），不声称完全未调用Git；未有Git写，后续不再调用',
    evidenceIndex: { fingerprint: inputs[path.join(root, 'index-r1.json')], ...evidence },
    source: {
      parent, close, candidate, bindingDifferences, packageVerification, launcherVerification,
      completeManifest: inputs[path.join(candidateRoot, 'complete-inputs.json')], completeVerification,
      hostStart, hostReentry, hostFingerprintMatches, priorArtifacts,
      deploymentLimit: '沿R1原部署绑定；只读112声明/519完整输入，不探活/访问profile/抓bundle；不比较主114',
    },
    receipts: { subset: receiptList.subset, note: receiptList.note, entries: receipts, mainSealReceipt },
    states, roots, rpc: commands, inheritedRpc, taskTimeline, reports,
    reportInheritance, comparisons, probes, checks, errors, inputs,
    machineExitCode: errors.length || Object.values(checks).some(value => !value) ? 1 : 0,
    verdict: '机器读证不等GUI PASS；实际PNG目视与有限裁决见同前缀报告；release STOP',
  }
  fs.writeFileSync(path.join(repo, prefix + '-audit.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify({
    at: result.at, checks, errors, evidence, packageVerification, launcherVerification, completeVerification,
    roots: roots.length, rootEntries: roots.reduce((sum, row) => sum + row.verification.checked, 0),
    receipts: receipts.length, nonzeroReceipts: receipts.filter(row => row.metadata.exitCode !== 0),
    commands: commands.rows.length, comparisons, inputs: Object.keys(inputs).length,
    machineExitCode: result.machineExitCode,
  }, null, 2))
  process.exitCode = result.machineExitCode
}
function seal() {
  const audit = json(prefix + '-audit.json')
  const sealPath = prefix + '-seal-r2.json'
  const previousSeal = json(prefix + '-seal.json')
  const previousSealFingerprint = inputs[path.join(repo, prefix + '-seal.json')]
  const drift = []
  for (const [file, expected] of Object.entries(audit.inputs)) {
    try {
      read(file)
      if (inputs[file].bytes !== expected.bytes || inputs[file].sha256 !== expected.sha256) {
        drift.push({ file, expected, actual: inputs[file] })
      }
    } catch (error) { drift.push({ file, error: error.message }) }
  }
  const reportPath = prefix + '-report.md'
  const report = read(reportPath).toString()
  const missingLinks = []
  const generatedSelfLinks = []
  for (const match of report.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^[a-z]+:/i.test(match[1])) continue
    const file = path.resolve(repo, path.dirname(reportPath), match[1].split('#')[0])
    if (file === path.join(repo, sealPath)) {
      generatedSelfLinks.push(match[1])
      continue
    }
    if (!fs.existsSync(file)) missingLinks.push(match[1])
  }
  const trailingWhitespaceLines = report.split('\n')
    .flatMap((line, position) => /[ \t]+$/.test(line) ? [position + 1] : [])
  const artifacts = ['-reader.mjs', '-audit.json', '-report.md'].map(suffix => {
    const file = prefix + suffix
    read(file)
    return { file, ...inputs[path.join(repo, file)] }
  })
  const exitCode = drift.length || missingLinks.length || trailingWhitespaceLines.length || audit.machineExitCode ? 1 : 0
  const result = {
    at: new Date().toISOString(), checkedInputs: Object.keys(audit.inputs).length,
    drift, missingLinks, generatedSelfLinks, trailingWhitespaceLines, artifacts, exitCode,
    previousSeal: { file: prefix + '-seal.json', ...previousSealFingerprint, exitCode: previousSeal.exitCode },
    scope: '只封自有审证文件及已读明列输入；非产品回归/新GUI执行/全盘污染审计',
    release: 'STOP', ownership: '无业务/builder/Git写/浏览器/服务/密钥资源锁；审结释放',
  }
  fs.writeFileSync(path.join(repo, sealPath), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = exitCode || !fs.existsSync(path.join(repo, sealPath)) ? 1 : 0
}
const mode = process.argv[2]
if (mode === 'capture') capture()
else if (mode === 'seal') seal()
else if (mode === 'inspect') {
  const audit = json(prefix + '-audit.json')
  const section = process.argv[3]
  const filter = process.argv[4] ?? ''
  const rows = section === 'rpc' ? audit.rpc.rows : audit[section]
  console.log(JSON.stringify(Array.isArray(rows) ?
    rows.filter(row => JSON.stringify(row).includes(filter)) : rows, null, 2))
} else throw new Error('Expected capture, seal, or inspect <section> [substring]')

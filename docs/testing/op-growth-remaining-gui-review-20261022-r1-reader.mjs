import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/op-growth-remaining-gui-review-20261022-r1'
const root = path.join(repo, 'reports/all-pending-evidence-20261021/OpGrowthRemainingR1')
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const inputs = {}
function read(file) {
  const absolute = path.resolve(repo, file)
  const b = fs.readFileSync(absolute)
  inputs[absolute] = { bytes: b.length, sha256: sha(b) }
  return b
}
const json = file => JSON.parse(read(file).toString())
const local = file => path.join(root, file)
const load = file => json(local(file))
function verify(entries, base) {
  const differences = []
  let checked = 0
  for (const [name, declared] of Object.entries(entries)) {
    const expected = typeof declared === 'string' ? { sha256: declared } : declared
    const absolute = path.resolve(base, name)
    if (!absolute.startsWith(base + path.sep)) throw new Error(`Path outside bound root: ${name}`)
    try {
      const b = read(absolute)
      checked++
      if (sha(b) !== expected.sha256 || (expected.bytes !== undefined && b.length !== expected.bytes)) {
        differences.push({ name, expected, actual: inputs[absolute] })
      }
    } catch (error) {
      differences.push({ name, error: error.message })
    }
  }
  return { declared: Object.keys(entries).length, checked, differences }
}
function compareRoots(a, b, filter) {
  const before = load(a + '-roots.json')
  const after = load(b + '-roots.json')
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(filter).sort()
  return {
    before: a, after: b, count: keys.length,
    changes: keys.filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
      .map(k => ({ path: k, before: before[k] ?? null, after: after[k] ?? null })),
  }
}
const product = k => k.startsWith('data/pmtool/') || k.startsWith('files/')
function readRpc(files) {
  const requests = new Map()
  const responses = new Map()
  const errors = []
  for (const name of files) {
    const data = load(name)
    const rows = Array.isArray(data) ? data : data.rows ?? []
    for (const [i, row] of rows.entries()) {
      try {
        if (row.method === 'Network.requestWillBeSent' && row.body?.method === 'commands/execute') {
          const id = row.body.rpcId
          const value = requests.get(id) ?? {
            rpcId: id, requestId: row.requestId, at: row.at,
            line: row.body.payload.args.line, refs: [],
          }
          value.refs.push({ file: name, row: i })
          requests.set(id, value)
        }
        if (row.method === 'Network.responseReceived' && row.body?.body) {
          const body = JSON.parse(row.body.body)
          if (!body.rpcId) continue
          const result = body.result?.value?.result
          const value = responses.get(body.rpcId) ?? {
            rpcId: body.rpcId, at: row.at, http: row.status,
            ok: body.result?.ok, commandId: body.result?.value?.commandId,
            kind: result?.kind, text: result?.text, refs: [],
          }
          value.refs.push({ file: name, row: i })
          responses.set(body.rpcId, value)
        }
      } catch (error) {
        errors.push({ file: name, row: i, error: error.message })
      }
    }
  }
  return {
    rows: [...requests.values()].map(r => ({ ...r, response: responses.get(r.rpcId) ?? null })),
    responseOnly: [...responses.values()].filter(r => !requests.has(r.rpcId)),
    parseErrors: errors,
  }
}
function capture() {
  const index = load('index-r1.json')
  const evidence = verify(index.files, root)
  const binding = load('source-binding.json')
  const candidatePath = 'reports/all-pending-evidence-20261021/CombinedSuccessor112R1/candidate.json'
  const sourcePath = 'reports/all-pending-evidence-20261021/CombinedSuccessor112R1/source-files.json'
  const candidate = json(candidatePath)
  const boundSource = json(sourcePath)
  const bindingDifferences = [...new Set([...Object.keys(binding.source), ...Object.keys(boundSource.source)])]
    .filter(k => binding.source[k] !== boundSource.source[k])
  const packageSource = Object.fromEntries(Object.entries(binding.source).filter(([k]) => !k.startsWith('launcher/')))
  const launcherSource = Object.fromEntries(Object.entries(binding.source).filter(([k]) => k.startsWith('launcher/')))
  const frozenPackage = verify(packageSource, candidate.freeze)
  const launcher = verify(launcherSource, repo)
  const fixture = load('fixture-binding.json')
  const fixtureBytes = read(fixture.source)
  const fixtureRows = JSON.parse(fixtureBytes.toString())
  const receiptList = load('execution-receipts.json')
  const receipts = receiptList.receipts.map(r => {
    const execution = load(`executions/${r.name}/execution.json`)
    const output = read(local(`executions/${r.name}/output.log`)).toString()
    return {
      ...r, execution,
      matches: r.id === execution.executionId && r.pid === execution.pid
        && r.exitCode === execution.exitCode && execution.status === 'exited',
      output,
    }
  })
  const names = Object.keys(index.files)
  const topJson = names.filter(n => !n.includes('/') && /^\d.*\.json$/.test(n))
  const rpc = readRpc(topJson.filter(n => n.endsWith('-events.json') || n.endsWith('-command.json')))
  const states = topJson.filter(n => !/-events|-roots|-command/.test(n))
    .map(n => ({ file: n, ...load(n) }))
  const roots = topJson.filter(n => n.endsWith('-roots.json')).map(n => {
    const state = n.replace('-roots.json', '')
    const all = load(n)
    const productEntries = Object.fromEntries(Object.entries(all).filter(([k]) => product(k)))
    return { state, verification: verify(productEntries, local(state + '-raw')) }
  })
  const taskTimeline = names.filter(n => /-raw\/data\/pmtool\/tasks\/t-(0003|0005|0010)\.json$/.test(n))
    .map(n => ({ file: n, row: load(n) }))
  const reports = names.filter(n => /-raw\/data\/pmtool\/reports\/.*\.json$/.test(n))
    .map(n => ({ file: n, row: load(n) }))
  const comparisons = [
    compareRoots('09-clear-before', '09-clear-unsaved', product),
    compareRoots('09-clear-before', '09-clear-cancel', product),
    compareRoots('14-negative-before', '14-invalid-effort-evidence', product),
    compareRoots('17-completed-revert-reopen', '17-clean-cancel', product),
    compareRoots('28-f2-390-bottom-labels', '29-newhost-f2', product),
    compareRoots('29-newhost-f2', '29-newhost-task-reopen', product),
  ]
  const hostFiles = ['setup-provenance.json', 'host-start.json', 'host-ready.json',
    'host-exact-stop.json', 'host-listener-gone.json', 'host-reentry-start.json',
    'host-reentry-ready.json', 'gateway-binding.json']
  const host = Object.fromEntries(hostFiles.map(n => [n, load(n)]))
  for (const file of ['AGENTS.md', 'docs/collaboration.md',
    'docs/testing/remaining-objective-cases-20261021.md',
    'docs/testing/op-growth-final-inheritance-20261022-r1.md']) read(file)
  const result = {
    at: new Date().toISOString(), role: '独立审证；未执行产品/GUI/服务/Git/构建/测试',
    environment: { os: process.platform, node: process.version, cwd: process.cwd() },
    evidenceIndex: { at: index.at, fingerprint: inputs[local('index-r1.json')], ...evidence },
    source: {
      baseline: binding.baseline, count: binding.count, candidate, bindingDifferences,
      frozenPackage, launcher, main114Compared: false,
      clientBundleFetchedOrHashedByReviewer: false,
      bindingLimit: '112冻结源码/15 launcher与Main原host绑定；非新装载证明，非全client审签',
    },
    fixture: {
      binding: fixture, actualSha256: sha(fixtureBytes), bytes: fixtureBytes.length,
      topLevelKeys: Object.keys(fixtureRows),
    },
    receipts: { partialIndex: receiptList.partialIndex, note: receiptList.note, entries: receipts },
    host, states, rpc, roots, taskTimeline, reports, comparisons, inputs,
    verdict: '机器读证结果不是GUI PASS；视觉与有限裁决见同前缀报告',
  }
  fs.writeFileSync(path.join(repo, prefix + '-audit.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify({
    evidence, bindingDifferences, frozenPackage, launcher,
    receipts: receipts.length, receiptMismatches: receipts.filter(r => !r.matches).length,
    receiptNonzero: receipts.filter(r => r.exitCode !== 0).map(r => ({ name: r.name, exitCode: r.exitCode })),
    roots: roots.length, rootDifferences: roots.filter(r => r.verification.differences.length),
    comparisons, rpcCount: rpc.rows.length, rpcParseErrors: rpc.parseErrors,
  }, null, 2))
}
function seal() {
  const audit = json(prefix + '-audit.json')
  const drift = []
  for (const [file, expected] of Object.entries(audit.inputs)) {
    try {
      const b = read(file)
      if (sha(b) !== expected.sha256 || b.length !== expected.bytes) drift.push({ file, expected, actual: inputs[file] })
    } catch (error) { drift.push({ file, error: error.message }) }
  }
  const reportPath = prefix + '-report.md'
  const report = read(reportPath).toString()
  const missingLinks = []
  for (const match of report.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^[a-z]+:/i.test(match[1])) continue
    const file = path.resolve(repo, path.dirname(reportPath), match[1].split('#')[0])
    if (!fs.existsSync(file)) missingLinks.push(match[1])
  }
  const whitespace = report.split('\n').flatMap((line, i) => /[ \t]+$/.test(line) ? [i + 1] : [])
  const artifacts = [prefix + '-reader.mjs', prefix + '-audit.json', reportPath]
    .map(file => { read(file); return { file, ...inputs[path.join(repo, file)] } })
  const result = {
    at: new Date().toISOString(), checkedInputs: Object.keys(audit.inputs).length,
    drift, missingLinks, trailingWhitespaceLines: whitespace, artifacts,
    scope: '只核本审证输入与自有文档；非产品测试/全机污染审计',
    exitCode: drift.length || missingLinks.length || whitespace.length ? 1 : 0,
  }
  fs.writeFileSync(path.join(repo, prefix + '-seal.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.exitCode
}
const mode = process.argv[2]
if (mode === 'capture') capture()
else if (mode === 'seal') seal()
else if (mode === 'inspect') {
  const audit = json(prefix + '-audit.json')
  const section = process.argv[3]
  const filter = process.argv[4] ?? ''
  const data = section === 'rpc' ? audit.rpc.rows : audit[section]
  console.log(JSON.stringify(Array.isArray(data)
    ? data.filter(x => JSON.stringify(x).includes(filter)) : data, null, 2))
} else throw new Error('Expected capture, seal, or inspect <section> [substring]')

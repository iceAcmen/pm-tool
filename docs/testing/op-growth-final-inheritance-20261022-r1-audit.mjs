import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/op-growth-final-inheritance-20261022-r1'
const mode = process.argv[2] ?? 'capture'
if (!['capture', 'capture-r2', 'seal'].includes(mode)) throw new Error('capture, capture-r2 or seal only')
const inputs = {}
const errors = []
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
function read(p) {
  const resolved = path.resolve(root, p)
  if (!resolved.startsWith(root + '/')) throw new Error(`outside repository: ${p}`)
  const bytes = fs.readFileSync(resolved)
  const stat = fs.statSync(resolved)
  inputs[path.relative(root, resolved)] = { sha256: sha(bytes), bytes: bytes.length, mtimeMs: stat.mtimeMs }
  return bytes
}
const json = p => JSON.parse(read(p))
function save(suffix, value) {
  const p = `${prefix}${suffix}`
  if (fs.existsSync(path.join(root, p))) throw new Error(`refuse overwrite: ${p}`)
  fs.writeFileSync(path.join(root, p), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function checklist(p) {
  return String(read(p)).trim().split('\n').map(line => {
    const match = /^([a-f0-9]{64})\s+(.+)$/.exec(line)
    if (!match) throw new Error(`invalid SHA line in ${p}`)
    return [match[2].replace(/^\*/, ''), match[1]]
  })
}
function compare(entries) {
  return entries.map(([p, expected]) => {
    if (!fs.existsSync(path.join(root, p))) return { path: p, expected, state: 'MISSING' }
    const actual = sha(read(p))
    return { path: p, expected, actual, state: actual === expected ? 'SAME' : 'CHANGED' }
  })
}
function indexCheck(p) {
  const index = json(p)
  const records = index.files ?? index
  const rows = Array.isArray(records) ? records.map(record => [record.path, record]) : Object.entries(records)
  const checked = []
  for (const [name, value] of rows) {
    const record = typeof value === 'string' ? { sha256: value } : value
    if (!record || typeof record !== 'object' || !record.sha256) continue
    const target = path.join(path.dirname(p), name)
    const bytes = read(target)
    const actual = sha(bytes)
    const expectedBytes = record.bytes ?? record.size
    const ok = actual === record.sha256 && (expectedBytes === undefined || bytes.length === expectedBytes)
    if (!ok) errors.push(`raw index mismatch: ${target}`)
    checked.push({ path: target, expected: record.sha256, actual, bytes: bytes.length, ok })
  }
  return { index: p, count: checked.length, mismatches: checked.filter(r => !r.ok), files: checked }
}

if (mode === 'seal') {
  const original = json(`${prefix}-audit-r2.json`)
  const drift = []
  for (const [p, before] of Object.entries(original.inputs)) {
    const bytes = read(p)
    if (sha(bytes) !== before.sha256 || bytes.length !== before.bytes ||
        inputs[p].mtimeMs !== before.mtimeMs) drift.push(p)
  }
  const report = `${prefix}.md`
  const text = String(read(report))
  const links = [...text.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1])
    .filter(p => !/^[a-z]+:/i.test(p) && !p.startsWith('#'))
    .map(p => path.resolve(root, path.dirname(report), p.split('#')[0]))
  const sealPath = path.join(root, `${prefix}-seal.json`)
  const missingLinks = links.filter(p => p !== sealPath && !fs.existsSync(p))
  const trailing = text.split('\n').flatMap((line, i) => /[ \t]+$/.test(line) ? [i + 1] : [])
  const regressionPath = 'reports/all-pending-evidence-20261021/U4/full-regression-r5/vitest.json'
  const regression = json(regressionPath)
  const regressionReadback = {
    path: regressionPath, sha256: inputs[regressionPath].sha256,
    protectionStartsAtSeal: true, notExecuted: true,
    suites: regression.testResults.filter(suite =>
      /\/(objective-consumers\.test\.tsx|task-evidence-protocol\.test\.ts|progress-meta\.test\.ts|progress-report\.test\.ts)$/.test(suite.name))
      .map(suite => ({ name: suite.name, status: suite.status,
        assertions: suite.assertionResults.map(row => ({ name: row.fullName, status: row.status })) })),
  }
  const regressionMatches = regressionReadback.sha256 ===
    '00bd2d9940cf969dfda014e1ba441bec72a24cec48bf7b84ed5471f6c88e8616'
  const self = [report, `${prefix}-audit.mjs`, `${prefix}-audit.json`, `${prefix}-audit-r2.json`]
    .map(p => {
      read(p)
      return { path: p, ...inputs[p] }
    })
  const result = { at: new Date().toISOString(), role: '独立审证，非执行',
    protectedInputs: Object.keys(original.inputs).length, drift,
    linkCount: links.length, missingLinks, trailingWhitespaceLines: trailing,
    selfReference: { path: `${prefix}-seal.json`, checkedAfterWrite: true },
    finalNewline: text.endsWith('\n'), self, regressionReadback, regressionMatches,
    productTest: 'NOT_RUN', gui: 'NOT_RUN',
    resourceReleased: true, stop: 'STOP' }
  save('-seal.json', result)
  if (!fs.existsSync(sealPath)) throw new Error('seal self-reference missing after write')
  console.log(JSON.stringify(result))
  if (drift.length || missingLinks.length || trailing.length || !text.endsWith('\n') ||
      !regressionMatches) process.exitCode = 1
} else {
  const base = 'reports/all-pending-evidence-20261021/'
  const a20 = json(`${base}A20V3/candidate.json`)
  const u4 = json(`${base}U4/candidate-evidence-manifest.json`)
  const source = checklist(`${base}A20V3/source-files.sha256`)
  const increment = checklist(`${base}U4/increment-files.sha256`)
  const union = new Map(source)
  for (const [p, hash] of increment) union.set(p, hash)
  const candidate = compare([...union])
  if (source.length !== 95 || increment.length !== 10 || union.size !== 102 ||
      candidate.some(r => r.state !== 'SAME')) errors.push('current 102 candidate mismatch')

  const opRoot = 'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/'
  const repairedRoot = 'docs/testing/objective-number-independent-retest-20261021-evidence/run-qCokWR/'
  const govRoot = 'docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/'
  const originalOp = json(`${opRoot}case-disposition.json`)
  const opResults = json(`${opRoot}domain-results.json`)
  const reopen = json(`${opRoot}reopen-results.json`)
  const repaired = json(`${repairedRoot}case-disposition.json`)
  const gov = json('docs/testing/governance-fix-independent-retest-20261021-id-status.json')
  const govRaw = json(`${govRoot}green-corrected/commands-domain.json`)
  const snapshots = {
    originalOp: json(`${opRoot}inputs-before.json`),
    repairedOp: json(`${repairedRoot}inputs-before.json`),
    governance: json(`${govRoot}source-before.json`),
  }
  const oldOpEntries = Object.entries(snapshots.originalOp).flatMap(([p, rec]) => {
    const marker = '/packages/dsh-pm-tool/src/'
    const at = p.indexOf(marker)
    return at < 0 ? [] : [[p.slice(at + 1), rec.sha256]]
  })
  const govEntries = Object.entries(snapshots.governance)
    .map(([p, rec]) => [`packages/dsh-pm-tool/src/${p}`, rec.sha256])
  const comparisons = { originalOp: compare(oldOpEntries), governance: compare(govEntries) }
  for (const name of ['A11', 'A13', 'A18', 'A19HC']) {
    const p = `${base}${name}/${name === 'A13' ? 'candidate-final' : 'candidate'}.json`
    comparisons[name] = compare(Object.entries(json(p).sourceHashes))
  }

  const reports = [
    'AGENTS.md', 'docs/collaboration.md',
    'docs/testing/final-remaining-acceptance-reconcile-20261022.md',
    'docs/testing/remaining-objective-cases-20261021.md',
    'docs/testing/remaining-governance-cases-20261021.md',
    'docs/testing/remaining-acceptance-register-20261021.md',
    'docs/testing/remaining-acceptance-delta-20261022-ledger.md',
    'docs/testing/objective-independent-auto-20261021.md',
    'docs/testing/objective-number-independent-retest-20261021.md',
    'docs/testing/a10-objective-gui-independent-review-20261021.md',
    'docs/testing/a11-overview-visible-final-review-20261021.md',
    'docs/testing/governance-fix-independent-retest-20261021-report.md',
    'docs/testing/a18-integration-more-gui-review-20261022.md',
    'docs/testing/a18-growth-more-gui-review-20261022.md',
    'docs/testing/a15-busy-habit-gui-review-20261022.md',
    'docs/testing/gui-numbers-habit-dark-review-20261021.md',
    'docs/testing/a18-okr-journey-gui-review-20261022.md',
    'docs/testing/a18-check-five-gui-review-20261022.md',
    'docs/testing/a19-p0008-check-remainder-review-20261022.md',
    'docs/testing/a19-habit-association-gui-review-20261022.md',
    'docs/testing/a19-habit-association-gui-review-20261022-correction.md',
    'docs/testing/a19-habit-card-wrap-independent-retest-20261022.md',
    'docs/testing/a19hc-gui-independent-review-20261022.md',
    'docs/testing/a20-file-reflection-independent-retest-20261022.md',
    'docs/testing/a20v2-gui-independent-review-20261022.md',
    'docs/testing/a20v3-total-gate-independent-review-20261022.md',
    'docs/testing/a13-u4-gui-total-retest-r2-20261022.md',
  ]
  for (const p of reports) read(p)
  const rawIndices = [
    `${opRoot}sha256-index.json`,
    `${repairedRoot}sha256-index.json`,
    'docs/testing/governance-fix-independent-retest-20261021-deliverable-index.json',
    `${base}A18/integration-more/index.json`,
    `${base}A18/growth-more/index.json`,
    `${base}A18/okr-journey/index.json`,
    `${base}A19/check-remainder/index.json`,
  ].map(indexCheck)
  const visibleSnapshot = json('docs/testing/a11-overview-visible-final-review-20261021-selftmp/inputs-r1.json')
  const visibleInputs = Object.entries(visibleSnapshot.inputs).filter(([p]) =>
    p.startsWith(`${base}A11/objective/manual-visible-r3/`) ||
    p.startsWith(`${base}A11/objective/checklist-visible-r3/`))
  const visibleChecks = compare(visibleInputs.map(([p, rec]) => [p, rec.sha256]))
  if (visibleChecks.length !== 256 || visibleChecks.some(r => r.state !== 'SAME')) errors.push('A11 r3 raw drift')
  const op = originalOp.map(row => ({
    id: row.id, original: row,
    exactOriginalAssertions: [opResults, reopen].flatMap(result => (result.rows ?? []).filter(r => r.id === row.id)),
    repaired: repaired.cases.find(r => r.id === row.id) ?? null,
    disposition: '按报告第3节的接缝组逐断言继承；未采GUI不变；此JSON不自动给整ID PASS',
  }))
  const growth = gov.filter(r => /^RA-P/.test(r.id)).map(row => ({
    id: row.id, original: row,
    rawCommands: govRaw.filter(r => r.id === row.id).map((r, i) => ({
      indexWithinId: i, rawInput: r.rawInput, result: r.result,
    })),
    disposition: '按报告第4节继承原AUTO及指定GUI；原未采断言保留',
  }))
  if (op.length !== 63 || growth.length !== 26) errors.push(`ID count ${op.length}/${growth.length}`)
  const result = {
    at: new Date().toISOString(), environment: { os: process.platform, node: process.version, cwd: root },
    role: '独立测试专家；只读审证，无产品执行', baseline: a20.baseline,
    candidate: { sourceCount: source.length, incrementCount: increment.length, uniqueCount: union.size,
      current: candidate, parent: { path: `${base}A20V3/candidate.json`, sha256: inputs[`${base}A20V3/candidate.json`].sha256 },
      u4: { path: `${base}U4/candidate-evidence-manifest.json`, sha256: inputs[`${base}U4/candidate-evidence-manifest.json`].sha256,
        serviceMetadataOnly: u4.service, noProbe: true } },
    comparisonSummary: Object.fromEntries(Object.entries(comparisons).map(([k, rows]) =>
      [k, { count: rows.length, same: rows.filter(r => r.state === 'SAME').length,
        changed: rows.filter(r => r.state === 'CHANGED'), missing: rows.filter(r => r.state === 'MISSING') }])),
    comparisons, rawIndices, visibleChecks, originalIdMap: { op, growth }, inputs, errors,
    productTests: 'NOT_RUN', gui: 'NOT_RUN', wholeDomainPass: false, commitAdmitted: false,
  }
  save(mode === 'capture-r2' ? '-audit-r2.json' : '-audit.json', result)
  console.log(JSON.stringify({ at: result.at, candidate: { unique: union.size,
    differences: candidate.filter(r => r.state !== 'SAME') },
    summaries: Object.fromEntries(Object.entries(result.comparisonSummary).map(([k, v]) =>
      [k, { count: v.count, same: v.same, changed: v.changed.length, missing: v.missing.length }])),
    raw: rawIndices.map(r => ({ index: r.index, count: r.count, mismatches: r.mismatches.length })),
    visibleCount: visibleChecks.length, ids: { op: op.length, growth: growth.length },
    inputCount: Object.keys(inputs).length, errors }))
  if (errors.length) process.exitCode = 1
}

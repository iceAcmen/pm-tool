import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const evidence = path.join(repo, 'reports/all-pending-evidence-20261021/A16')
const out = path.join(repo, 'docs/testing/a16-pc-gui-independent-review-20261022-selftmp/supplement.json')
assert(!fs.existsSync(out), 'refuse overwrite')
const read = p => fs.readFileSync(p)
const json = p => JSON.parse(read(p))
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const walk = p => fs.readdirSync(p, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(p, e.name)) : e.isFile() ? [path.join(p, e.name)] : []
).sort()
const candidate = json(path.join(evidence, 'candidate.json'))
const independent = json(path.join(repo, 'docs/testing/a16-extension-base-independent-retest-20261022-selftmp/r1/candidate.json'))
const pkg = 'packages/dsh-pm-tool'
const entries = Object.entries(candidate.sourceHashes).filter(([p]) => p.startsWith(`${pkg}/`))
const inputDrift = entries.filter(([p, hash]) => sha(read(path.join(independent.freezeRoots.new, p))) !== hash).map(([p]) => p)
assert.deepEqual(inputDrift, [])
assert.equal(candidate.trackedPatchSha, independent.trackedPatchSha256)
const src = walk(path.join(candidate.tree, pkg, 'src'))
assert.equal(src.length, 387)
assert.deepEqual(src.map(p => path.relative(path.join(candidate.tree, pkg, 'src'), p)), walk(path.join(independent.freezeRoots.new, pkg, 'src')).map(p => path.relative(path.join(independent.freezeRoots.new, pkg, 'src'), p)))
const snapshots = []
for (const b of ['normalize', 'normalize-clean', 'conflict', 'clean', 'clean-r2', 'stepwise-conflict']) {
  const dir = path.join(evidence, 'final', b)
  for (const n of fs.readdirSync(dir).filter(n => n.endsWith('-raw'))) {
    const roots = json(path.join(dir, `${n.slice(0, -4)}-roots.json`))
    const paths = walk(path.join(dir, n))
    const mismatches = paths.filter(p => {
      const rel = path.relative(path.join(dir, n), p)
      return sha(read(p)) !== roots.data[`/pmtool/${rel}`]
    }).map(p => path.relative(dir, p))
    assert.deepEqual(mismatches, [])
    snapshots.push({ branch: b, state: n, files: paths.length, rawRootMismatches: mismatches })
  }
}
const seedDir = path.join(evidence, 'final/seed')
const seedExit = json(path.join(seedDir, 'exit.json'))
const backupBytes = read(seedExit.file)
const backup = JSON.parse(backupBytes)
assert.equal(backup.format, 'pm-tool-backup')
assert.equal(backup.formatVersion, 1)
const seedRoots = ['before', 'precheck', 'first-confirm', 'after'].map(n => json(path.join(seedDir, `${n}-roots.json`)))
assert.deepEqual(seedRoots[0], seedRoots[1])
assert.deepEqual(seedRoots[0], seedRoots[2])
const seeded = path.join(evidence, 'final/normalize/initial-raw')
const seedComparisons = []
for (const [field, table] of [['tasks', 'tasks'], ['milestones', 'milestones'], ['riskIssues', 'risk_issues'], ['deliverables', 'deliverables'], ['meetings', 'meetings']]) {
  for (const r of backup[field]) {
    const actual = json(path.join(seeded, table, `${r.id}.json`)).record
    assert.deepEqual(actual, r)
    seedComparisons.push({ table, id: r.id, recordEqual: true })
  }
}
const oldLedger = json(path.join(seeded, 'settings/pmProvenanceLedger.json')).record.value.entries
assert.equal(oldLedger.length, 1)
assert.equal(oldLedger[0].refs.length, 10)
const audit = json(path.join(repo, 'docs/testing/a16-pc-gui-independent-review-20261022-selftmp/audit.json'))
assert.equal(audit.gateway.sealedRequests, 3)
for (const b of ['conflict', 'clean-r2', 'stepwise-conflict']) {
  const request = audit.gateway.requests.filter(r =>
    r.body.messages.some(m => JSON.stringify(m.content).includes(`A16 ${b} `))
  )
  assert.equal(request.length, 1)
  assert.equal(request[0].behavior, 'success')
  assert.equal(request[0].body.model, 'deepseek-v4-1-flash-260910')
  assert.equal(request[0].body.stream, true)
  assert(Date.parse(request[0].at) > audit.branches[b].commandPairs.find(c => /^\s*ask p-0001 /.test(c.args)).runAt)
}
const code = read(path.join(repo, 'docs/testing/a16-extension-base-independent-retest-20261022-pc-cases.test.tsx'))
const original = read(path.join(repo, 'docs/testing/a14-preconfirm-conflict-contract-20261022-cases.test.tsx'))
assert.equal(sha(original), '18093da170e61c626ee434abe1fb467fc7b68da0727e7b6edfdb0b8de149c0da')
const selected = bytes => {
  const text = bytes.toString()
  const start = text.indexOf('const selectedBase =')
  const end = text.indexOf('const parseApply =', start)
  assert(start >= 0 && end > start)
  return text.slice(start, end)
}
const originalSelected = selected(original)
const revisedSelected = selected(code)
assert.equal(original.toString().replace(originalSelected, revisedSelected), code.toString())
const result = {
  at: new Date().toISOString(),
  sourceInheritance: { inputFiles: entries.length, srcFiles: src.length, inputDrift, independentRoot: independent.freezeRoots.new, trackedPatchSha: candidate.trackedPatchSha },
  rawRootBinding: { snapshots, totalFiles: snapshots.reduce((sum, s) => sum + s.files, 0) },
  seed: { file: seedExit.file, sha256: sha(backupBytes), originalExit: seedExit.exit, precheckAndFirstConfirmZeroRootWrite: true, originalRecordComparisons: seedComparisons, oldLedgerId: oldLedger[0].id, oldRefs: oldLedger[0].refs.length, boundary: 'Original existing F6 provenance carried by standard backup; not newly generated refs or new restore-command event capture.' },
  gateway: { sealedRequests: 3, branchBodyMatches: ['conflict', 'clean-r2', 'stepwise-conflict'], boundary: 'Only sealed first 14400 bytes; no headers/keys or later appended requests read for verdict.' },
  revisedOracle: { originalSha: sha(original), revisedSha: sha(code), onlySelectedBaseChanged: true, originalFailuresKept: true },
  pilot: { actualStateKeys: Object.keys(audit.loaded), capturedPilotFields: audit.loaded.pilotFields, value: 'NOT_CAPTURED', boundary: 'Original state collector did not serialize pilot DOM attributes; do not infer OFF from missing field or source/default. PC contract has no pilot-specific requirement; no pilot or full matrix signoff.' },
}
fs.writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log({ source: result.sourceInheritance, rawSnapshots: snapshots.length, rawFiles: result.rawRootBinding.totalFiles, seedRecords: seedComparisons.length, pilot: result.pilot.value, revisedOnlySelectedBase: true })

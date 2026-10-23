import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const prefix = 'governance-fix-independent-retest-20261021'
const repo = path.resolve(dir, '../..')
const sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const save = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n')
const files = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? files(path.join(d, e.name)) : e.isFile() ? [path.join(d, e.name)] : [])
const evidenceBase = path.join(dir, prefix + '-evidence')
const sealRoot = fs.mkdtempSync(path.join(evidenceBase, 'seal-'))
const verified = []
for (const name of ['run-yKDVQA', 'run-2ACog5', 'run-Prpg80']) {
  const root = path.join(evidenceBase, name)
  const indexName = name === 'run-2ACog5' ? 'supplement-evidence-files.json' : 'evidence-files.json'
  for (const [f, record] of Object.entries(read(path.join(root, indexName)))) {
    assert.equal(sha(path.join(root, f)), record.sha256, 'evidence hash: ' + name + '/' + f)
    verified.push(name + '/' + f)
  }
}
const green = path.join(evidenceBase, 'run-2ACog5/green-corrected')
const candidate = read(path.join(green, 'candidate.json'))
const currentDrift = Object.entries(candidate.source).filter(([f, v]) => {
  const current = path.join(repo, 'packages/dsh-pm-tool/src', f)
  return !fs.existsSync(current) || sha(current) !== v.sha256
}).map(([f]) => f)
assert.deepEqual(currentDrift, [])
const oldRoot = path.join(dir, 'governance-growth-independent-auto-20261021-evidence/governance-growth-independent-auto-20261021-soAcAa/frozen-package')
for (const name of ['run-yKDVQA', 'run-Prpg80']) {
  const frozen = path.join(evidenceBase, name, 'red-original/frozen-package')
  assert.equal(sha(path.join(frozen, 'worker.mjs')), sha(path.join(oldRoot, 'worker.mjs')))
  for (const f of ['commands/ask.ts', 'core/provenance-store.ts', 'core/queue.ts']) {
    assert.equal(sha(path.join(frozen, 'src', f)), sha(path.join(oldRoot, 'src', f)))
  }
  assert.equal(sha(path.join(frozen, 'src/commands/ask-governance.test.ts')),
    '8d7a71f2b89d1414649caad8e541e350c203cc043816cc91bde89279a50cd7be')
}
assert.equal(sha(path.join(green, 'frozen-package/src/commands/ask-governance.test.ts')),
  '8d7a71f2b89d1414649caad8e541e350c203cc043816cc91bde89279a50cd7be')
const redSupervisor = read(path.join(evidenceBase, 'supervisor-WVUji5/outer-execution.json'))
const greenSupervisor = read(path.join(evidenceBase, 'supervisor-LCJRpT/outer-execution.json'))
assert.equal(redSupervisor.exit, 1)
assert.equal(greenSupervisor.exit, 0)
const red = read(path.join(evidenceBase, 'run-Prpg80/red-original/domain-results.json'))
assert.equal(red.filter(r => r.status === 'FAIL').length, 7)
assert.equal(read(path.join(green, 'domain-results.json')).filter(r => r.status === 'PASS').length, 62)
const ids = read(path.join(dir, prefix + '-id-status.json'))
assert.equal(ids.length, 32)
assert.ok(ids.every(r => r.auto === 'PASS_LIMITED' && r.gui === 'NOT_RUN'))
assert.equal(ids.find(r => r.id === 'RA-AI06').realNetworkModel, 'MAIN_NOT_RUN')
const fixture = read(path.join(green, 'F6-ui-standard.json'))
const packagePath = path.join(green, 'F6-ui-standard', path.basename(fixture.path))
assert.equal(sha(packagePath), fixture.sha256)
const standard = read(packagePath)
assert.equal(standard.extra.settings.find(([id]) => id === 'pmProvenanceLedger')[1].value.entries[0].refs.length, 10)
assert.ok(fs.existsSync(packagePath + '.files.' + fixture.fileBundleId))
const git = spawnSync('/usr/bin/git', ['diff', '--check', '--', 'docs/testing/' + prefix + '*'],
  { cwd: repo, encoding: 'utf8' })
fs.writeFileSync(path.join(sealRoot, 'diff-check.stdout.txt'), git.stdout)
fs.writeFileSync(path.join(sealRoot, 'diff-check.stderr.txt'), git.stderr)
assert.equal(git.status, 0)
const deps = read(path.join(evidenceBase, 'run-2ACog5/dependencies-before.json'))
const dependencyDrift = Object.entries(deps).flatMap(([d, entries]) => Object.entries(entries)
  .filter(([f, r]) => !fs.existsSync(path.join(d, f)) || sha(path.join(d, f)) !== r.sha256).map(([f]) => path.join(d, f)))
assert.deepEqual(dependencyDrift, [])
const audit = read(path.join(dir, prefix + '-audit-result.json'))
assert.deepEqual(audit.forbiddenWrites, [])
assert.deepEqual(audit.ownedProcesses, [])
const result = { at: new Date().toISOString(), node: process.version, verifiedEvidenceFiles: verified.length,
  currentDrift, dependencyDrift, redObservedExit: redSupervisor.exit, greenObservedExit: greenSupervisor.exit,
  diffCheck: { command: ['/usr/bin/git', 'diff', '--check', '--', 'docs/testing/' + prefix + '*'], exit: git.status },
  F6sha256: fixture.sha256, ids: 32, GUI: 'NOT_RUN', model: 'MAIN_NOT_RUN',
  writes: audit.writes, forbiddenWrites: 0, ownedProcesses: [],
  result: 'PASS：只签GG四缺陷与列出的独立SOURCE/AUTO及证据完整性' }
save(path.join(sealRoot, 'seal-result.json'), result)
const selfRoot = path.join(dir, prefix + '-selftmp')
const indexPath = path.join(dir, prefix + '-deliverable-index.json')
const all = files(evidenceBase).concat(fs.readdirSync(dir).filter(n => n.startsWith(prefix) && fs.statSync(path.join(dir, n)).isFile())
  .map(n => path.join(dir, n))).filter(f => f !== indexPath && !f.startsWith(selfRoot + '/'))
save(indexPath, Object.fromEntries(all.map(f => [path.relative(dir, f), { sha256: sha(f), bytes: fs.statSync(f).size }])))
console.log(JSON.stringify(result, null, 2))

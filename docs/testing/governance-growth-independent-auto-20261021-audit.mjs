import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'governance-growth-independent-auto-20261021'
const testing = path.join(repo, 'docs/testing')
const evidence = path.join(testing, prefix + '-evidence', prefix + '-soAcAa')
const hash = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const save = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n')
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? files(path.join(dir, e.name)) : e.isFile() ? [path.join(dir, e.name)] : [])
}
const oldIndex = read(path.join(evidence, 'evidence-files.json'))
for (const [file, expected] of Object.entries(oldIndex)) assert.equal(hash(path.join(evidence, file)), expected.sha256, '第三轮冻结原证被改：' + file)
const supplement = read(path.join(evidence, 'supplement-evidence-files.json'))
for (const [file, expected] of Object.entries(supplement)) assert.equal(hash(path.join(evidence, file)), expected.sha256, '补充原证被改：' + file)
for (const label of ['F5', 'F6', 'F7']) {
  const fixture = read(path.join(evidence, label + '-fixture.json'))
  assert.equal(fixture.precheck, 'PASS')
  const backup = path.join(evidence, label + '-backup', path.basename(fixture.path))
  assert.equal(hash(backup), fixture.sha256)
  const content = read(backup)
  assert.equal(content.format, 'pm-tool-backup')
  assert.equal(content.formatVersion, 1)
  assert.ok(!('sessions' in content.extra))
}
const ids = read(path.join(evidence, 'id-status.json'))
assert.equal(ids.length, 32)
assert.equal(new Set(ids.map(r => r.id)).size, 32)
assert.equal(ids.filter(r => r.auto === 'FAIL').length, 3)
assert.equal(ids.filter(r => r.gui === 'NOT_RUN').length, 32)
assert.equal(read(path.join(evidence, 'p0-final-execution.json')).exit, 0)
assert.equal(read(path.join(evidence, 'reopen-results.json')).filter(r => r.status === 'PASS').length, 2)
const before = read(path.join(evidence, 'inputs-before.json'))
const sourceDir = path.join(repo, 'packages/dsh-pm-tool/src') + '/'
const currentSource = Object.fromEntries(Object.entries(before).filter(([f]) => f.startsWith(sourceDir)).map(([f, old]) => [path.relative(repo, f), {
  frozenSha256: old.sha256, observedSha256: fs.existsSync(f) ? hash(f) : null,
}]))
const changed = Object.entries(currentSource).filter(([, value]) => value.frozenSha256 !== value.observedSha256).map(([file]) => file)
let patch = ''
for (const file of changed) {
  const frozen = path.join(evidence, 'frozen-package', file.replace(/^packages\/dsh-pm-tool\//, ''))
  const current = path.join(repo, file)
  if (fs.existsSync(frozen) && fs.existsSync(current)) {
    patch += spawnSync('/usr/bin/diff', ['-u', frozen, current], { encoding: 'utf8' }).stdout
  }
}
fs.writeFileSync(path.join(evidence, 'source-final-observation.patch'), patch)
save(path.join(evidence, 'source-final-observation.json'), {
  at: new Date().toISOString(), currentSource, changed, patchSha256: hash(path.join(evidence, 'source-final-observation.patch')),
  conclusion: '只观察Main后续漂移，不执行新产品测试，不撤销冻结红证或改签新候选PASS',
})
const processes = spawnSync('/usr/bin/pgrep', ['-fl', '/private/tmp/' + prefix], { encoding: 'utf8' })
assert.equal(processes.status, 1, '自有tmp测试进程尚未退出：' + processes.stdout)
save(path.join(testing, prefix + '-audit-result.json'), {
  at: new Date().toISOString(), frozenEvidenceVerified: Object.keys(oldIndex).length,
  supplementEvidenceVerified: Object.keys(supplement).length, fixtureHashes: 'PASS', idMapping: '32/32',
  frozenProductFailures: 'GG-01..04；3 IDs；7 FAIL probes', ownRuntimeProcesses: [],
  postRunSourceDrift: changed, productOrOtherFilesModifiedByAudit: false,
})
const indexFile = path.join(testing, prefix + '-deliverable-index.json')
const owned = fs.readdirSync(testing, { withFileTypes: true }).filter(e => e.name.startsWith(prefix)).flatMap(e =>
  e.isDirectory() ? files(path.join(testing, e.name)) : e.isFile() ? [path.join(testing, e.name)] : []).filter(f => f !== indexFile)
save(indexFile, {
  at: new Date().toISOString(), excluded: path.basename(indexFile), files: Object.fromEntries(owned.sort().map(f => [path.relative(repo, f), {
    sha256: hash(f), size: fs.statSync(f).size,
  }])),
})
console.log(JSON.stringify(read(path.join(testing, prefix + '-audit-result.json')), null, 2))

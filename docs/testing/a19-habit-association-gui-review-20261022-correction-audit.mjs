// Read-only correction audit. No product import, test, build, network or GUI.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = path.join(repo, 'docs/testing/a19-habit-association-gui-review-20261022')
const read = p => fs.readFileSync(p)
const json = p => JSON.parse(read(p))
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const fingerprint = p => {
  const s = fs.statSync(p, { bigint: true })
  return { path: p, bytes: Number(s.size), sha256: sha(read(p)), mtimeNs: String(s.mtimeNs), ino: String(s.ino) }
}
const base = path.join(repo, 'reports/all-pending-evidence-20261021/A19')
const candidatePath = path.join(base, 'candidate.json')
const candidate = json(candidatePath)
const expert = path.join(repo, 'docs/testing/a19-full-regression-evidence-review-20261022')
const packagePath = path.join(candidate.tree, 'launcher/package.json')
const stdoutPath = path.join(base, 'build-fixture-supplement/launcher-test.stdout.txt')
const receiptPath = path.join(base, 'build-fixture-supplement/launcher-test.exit.json')
const originalSeal = json(prefix + '-seal.json')
const originals = [...new Set([
  prefix + '-seal.json', ...originalSeal.owned.map(n => n.path),
  expert + '.md', expert + '-audit.json', expert + '-seal.json',
  candidatePath, packagePath, stdoutPath, receiptPath,
])]
const before = originals.map(fingerprint)
const checks = []
const check = (name, fn) => { fn(); checks.push({ name, verified: true }) }

check('original sealed report/audit/files unchanged; original seal identity retained', () => {
  assert.equal(sha(read(prefix + '.md')), '2ecf07925488b76bceb9564e85af697cab6541396d09684e5d4ed08610900b89')
  assert.equal(sha(read(prefix + '-seal.json')), '59f73e43a225ff9708d4bd7d3735d17cc064305535a26f23f9a9564746e0e28b')
  for (const row of originalSeal.owned) assert.deepEqual(fingerprint(row.path), row)
})
check('different AUTO expert exact report, saved-origin PASS and execution-claim FAIL', () => {
  assert.equal(sha(read(expert + '.md')), '901d6811b9ef97c7c28b3979356c31d84b3f9950d11e6b12a0c354cbd80eef41')
  const audit = json(expert + '-audit.json')
  const inherited = audit.checks.find(n => n.id === 'inherited-origin-five')
  const execution = audit.checks.find(n => n.id === 'claim-old-probes-executed-in-current-56')
  assert.equal(inherited.status, 'PASS')
  assert.equal(inherited.detail.length, 5)
  assert.equal(execution.status, 'FAIL')
  assert.deepEqual(execution.detail.reachedOld, [])
  assert.equal(execution.detail.actualCount, 0)
  assert.equal(execution.detail.declaredOldCount, 5)
})
const script = json(packagePath).scripts.test
const expectedFiles = [
  'contract.state.test.mjs', 'browsers.controller.test.mjs', 'app.loopback.test.mjs',
  'control-html.test.mjs', 'cancel.race.test.mjs', 'journey-race.test.mjs',
  'loopback-security.test.mjs', 'local-app.test.mjs', 'browser-open.test.mjs',
]
check('original explicit Launcher script includes nine current files, no old probe arguments', () => {
  assert.equal(script, 'node --test ' + expectedFiles.map(n => 'test/' + n).join(' '))
  for (const p of Object.keys(candidate.inheritedLauncherProbeInputs)) assert(!script.includes(path.basename(p)))
})
check('original TAP current 56/56/zero others and actual original receipt preserved', () => {
  const stdout = read(stdoutPath).toString()
  assert.match(stdout, /1\.\.56\r?\n# tests 56\r?\n# suites 0\r?\n# pass 56\r?\n# fail 0\r?\n# cancelled 0\r?\n# skipped 0\r?\n# todo 0/)
  const receipt = json(receiptPath)
  assert.equal(receipt.exit, 0)
  assert.deepEqual(receipt, candidate.rows.find(n => n.label === 'launcher-test'))
  assert.equal(sha(read(candidatePath)), 'e6ae8366eeaae4293d4d960cfe4002bf249b10f148aad13f97eecdb28fee25d7')
})
check('correction explicitly withdraws original execution claim; original inaccurate words retained', () => {
  assert(read(prefix + '.md').toString().includes('包括明确继承5probe'))
  const correction = read(prefix + '-correction.md').toString()
  assert(correction.includes('撤回原报告 §8'))
  assert(correction.includes('不属于本轮56项'))
  assert(correction.includes('GM01 有限 GUI PASS/原展示缺陷关闭保持'))
})
check('bounded original files unchanged after correction audit', () => {
  assert.deepEqual(originals.map(fingerprint), before)
})
const output = {
  at: new Date().toISOString(), pid: process.pid, checks, protectedFiles: before,
  drift: [], actualLauncherScript: script, currentTestFiles: expectedFiles,
  actualPassed: 56, oldProbeExecutionCount: 0,
  originBindingStatus: 'PASS', originalExecutionClaimStatus: 'FAIL',
  correction: fingerprint(prefix + '-correction.md'),
  auditScript: fingerprint(prefix + '-correction-audit.mjs'),
  gm01GuiConclusion: 'bounded PASS unchanged', hc01VisualConclusion: 'bounded FAIL unchanged',
  released: true, childrenStarted: 0, productImports: 0, buildActions: 0, guiConnections: 0, serviceActions: 0,
  boundary: 'Correction only; original report/seal/candidate retained. No Main dynamic-source/runtime lock or retest.',
}
fs.writeFileSync(prefix + '-correction-audit.json', JSON.stringify(output, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ checks: checks.length, drift: 0, correctionSHA: output.correction.sha256,
  actualPassed: 56, oldProbeExecutionCount: 0, originalExecutionClaimStatus: 'FAIL', released: true }))

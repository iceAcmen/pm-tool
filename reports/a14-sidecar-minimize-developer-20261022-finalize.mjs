import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a14-sidecar-minimize-developer-20261022'
const root = join(repo, 'reports', `${prefix}-selftmp`)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const json = name => JSON.parse(readFileSync(join(root, name), 'utf8'))
function inventory(base, times = false) {
  const result = {}
  if (!existsSync(base)) return result
  function walk(path) {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) return
    if (stat.isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name))
    else result[relative(base, path) || '.'] = { sha256: hash(readFileSync(path)), bytes: stat.size,
      ...(times ? { mtimeMs: stat.mtimeMs } : {}) }
  }
  walk(base)
  return result
}
const start = json('start.json')
const release = json('release.json')
const original = join(repo, 'docs/testing/a14-sidecar-minimize-contract-20261022-cases.test.tsx')
for (const [path, expected] of Object.entries(start.inputs))
  assert.equal(hash(readFileSync(path)), expected, `原输入漂移：${path}`)
for (const round of ['before', 'after-r2'])
  assert.equal(hash(readFileSync(join(root, round, 'frozen/docs/testing', original.split('/').at(-1)))),
    start.expertTestSha256)
const sampled = round => readFileSync(join(root, round, 'frozen/docs/testing', original.split('/').at(-1)), 'utf8')
assert.equal(sampled('sampling-r1'), sampled('sampling-before-r1'))
const before = json('before/summary.json')
const after = json('after-r2/summary.json')
assert.deepEqual(before.runs.map(run => run.originalExit), [0, 1, 1, 1])
assert.deepEqual(after.runs.map(run => run.originalExit), [0, 0, 0, 1, 0, 0])
assert.deepEqual(json('sampling-r1/summary.json').runs.map(run => run.originalExit), [0, 0, 0, 0])
assert.deepEqual(json('sampling-before-r1/summary.json').runs.map(run => run.originalExit), [0, 1, 1, 1])
assert(readFileSync(join(root, 'after-r2/SM-A03.stderr.log'), 'utf8').includes('Unable to find node on an unmounted component.'))
const regression = json('after-r2-regression/components-bridge-confirm.result.json')
assert.equal(regression.numPassedTests, 121)
assert.equal(regression.numFailedTests, 0)
assert.equal(regression.testResults.length, 14)
const own = Object.fromEntries(start.owned.map(path => {
  const current = hash(readFileSync(join(repo, path)))
  assert.equal(current, release.main[path].sha256, `候选主树漂移：${path}`)
  return [path, current]
}))
const checkedProtectionRoots = Object.keys(start.protect).filter(path => !path.endsWith('/A13'))
for (const path of checkedProtectionRoots)
  assert.deepEqual(inventory(path, true), start.protect[path], `保护根漂移：${path}`)
for (const round of ['before', 'after-r2'])
  assert.deepEqual(inventory(join(root, round, 'frozen/packages/dsh-pm-tool/src')), json(`${round}/source.json`))
const ownFiles = Object.fromEntries(readdirSync(join(repo, 'reports')).filter(name =>
  name.startsWith(prefix) && lstatSync(join(repo, 'reports', name)).isFile()).map(name =>
  [name, hash(readFileSync(join(repo, 'reports', name)))]))
const commands = [
  ...before.runs, ...after.runs,
  ...json('sampling-r1/summary.json').runs,
  ...json('sampling-before-r1/summary.json').runs,
]
for (const command of commands) {
  assert(command.subprocessReturned)
  assert.equal(command.signal, null)
  assert(existsSync(join(root, `${command.label}.stdout.log`)))
  assert(existsSync(join(root, `${command.label}.stderr.log`)))
}
const result = {
  at: new Date().toISOString(), argv: process.argv, role: '限定开发完整性核验，非独立PASS',
  originalExpertInputsUnchanged: true, own, ownFiles,
  checkedProtectionRoots, a13ExcludedBecauseConcurrentAndAlreadyAccountedInRelease: true,
  sourceFreezesUnchanged: true, executions: commands.map(({ label, originalExit }) => ({ label, originalExit })),
  ownEvidence: inventory(root), boundary: '本前缀证据与已列保护根；未覆盖全机/业务数据/凭据/GUI',
}
writeFileSync(join(root, 'final-integrity.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ originalInputs: 'unchanged', ownCandidate: 'matches', protectedRoots: checkedProtectionRoots.length,
  regressionFiles: 14, regressionTests: 121, rawExecutions: commands.length, independentPass: false }))

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

// 只核自有执行原件；不执行/修补产品，不把必要红折算成PASS。
const testing = dirname(fileURLToPath(import.meta.url))
const prefix = 'a20-file-reflection-contract-20261022'
const out = join(testing, `${prefix}-selftmp/r1`)
const read = p => JSON.parse(readFileSync(join(out, p), 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const candidate = read('candidate.json')
const summary = read('summary.json')
const commands = read('commands.json')
const observations = name => readFileSync(join(out, `${name}.observations.jsonl`), 'utf8')
  .trim().split('\n').map(line => JSON.parse(line))
let count = 0
function check(fn) { fn(); count++ }
for (const [id, passed, failed, pending, exit] of [
  ['necessary-red', 0, 4, 12, 1], ['material-controls', 12, 0, 4, 0],
  ['original-tests', 31, 0, 0, 0],
]) {
  const r = read(`${id}.result.json`)
  const c = commands.find(c => c.id === id)
  check(() => assert.equal(c.originalExit, exit))
  check(() => assert.deepEqual([r.numPassedTests, r.numFailedTests, r.numPendingTests], [passed, failed, pending]))
  check(() => assert.equal(c.signal, null))
  check(() => assert.equal(c.error, null))
  check(() => assert.equal(c.cwd, candidate.frozen))
  check(() => assert.equal(c.argv[1], join(candidate.depsRun, 'vitest/vitest.mjs')))
  check(() => assert(c.argv.includes('--no-cache') && !c.argv.some(s => s.includes('.bin/') || s === 'pnpm')))
  check(() => assert.deepEqual(Object.keys(c.env).sort(), [
    'PATH', 'HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'DSH_HOME', 'CI', 'LANG', 'TZ',
    'NODE_DISABLE_COMPILE_CACHE', 'FR_FIXTURE', 'FR_OBSERVATIONS',
  ].sort()))
  check(() => assert.equal(summary.results.find(s => s.id === id).reporterSha256,
    sha(readFileSync(join(out, `${id}.result.json`)))))
}
const red = read('necessary-red.result.json').testResults.flatMap(t => t.assertionResults)
const failures = red.filter(r => r.status === 'failed')
check(() => assert.equal(failures.length, 4))
check(() => assert(failures.every(r => r.failureMessages.join('\n').includes('个文件'))))
check(() => assert.deepEqual(failures.map(r => r.title.slice(0, 6)).sort(), ['FR-R01', 'FR-R02', 'FR-R03', 'FR-R04']))
const seen = observations('necessary-red')
check(() => assert.equal(seen.length, 5))
check(() => assert(seen.every(r => r.hasMaterials === true && r.draft.gaps.length === 0)))
const original = read('replay-input.json')
check(() => assert.deepEqual(seen[0].input, original.task))
check(() => assert.deepEqual(seen[0].draft, original.reflection.draft))
const controls = observations('material-controls')
for (const id of ['FR-C02', 'FR-C03', 'FR-C04']) {
  check(() => {
    const r = controls.find(r => r.id === id)
    assert.equal(r.hasMaterials, false)
    assert.deepEqual(r.draft.gaps, ['待补：交付验收材料与证据链接'])
  })
}
check(() => assert.equal(Object.values(summary.drift).flat().length, 0))
check(() => assert.deepEqual(summary.frozenDrift, []))
check(() => assert.deepEqual(summary.dependencyDrift, []))
check(() => assert.equal(candidate.ownDependencyLinks.allInsideOwnRoot, true))
check(() => assert.equal(candidate.productEdited, false))
check(() => assert.equal(summary.passSigned, false))
const config = readFileSync(join(out, 'vitest.config.mjs'), 'utf8')
check(() => assert(config.includes('"cache": false') && config.includes('"singleFork": true')))
check(() => assert.equal(sha(readFileSync(join(candidate.frozen, 'docs/testing', `${prefix}-cases.test.ts`))),
  candidate.testCopySha256))
const pids = commands.map(c => c.pid)
const env = { PATH: '/usr/bin:/bin', HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), LANG: 'zh_CN.UTF-8' }
const ps = spawnSync('/bin/ps', ['-p', pids.join(','), '-o', 'pid=,ppid=,command='],
  { cwd: out, env, encoding: 'utf8' })
check(() => assert.equal(ps.status, 1))
check(() => assert.equal(ps.stdout.trim(), ''))
const value = {
  at: new Date().toISOString(), checks: count, originalRed: 4, materialControls: 12, originalTests: 31,
  protectedRoots: Object.keys(summary.drift).length,
  protectedEntries: Object.values(read('protected-before.json')).reduce((n, v) => n + Object.keys(v).length, 0),
  frozenSourceFiles: candidate.sourceFileCount, ownedDependencyEntries: candidate.ownDependencyLinks.entries,
  ownedDependencyLinks: candidate.ownDependencyLinks.links,
  recordedPids: pids, pidCheck: { exit: ps.status, stdout: ps.stdout, stderr: ps.stderr },
  stop: true, passSigned: false,
}
writeFileSync(join(out, 'evidence-check.json'), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify(value))

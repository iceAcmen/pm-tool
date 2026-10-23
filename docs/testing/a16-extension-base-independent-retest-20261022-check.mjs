import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a16-extension-base-independent-retest-20261022'
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const root = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
const out = join(repo, 'docs/testing', `${prefix}-selftmp`, `check-${round}`)
assert(!existsSync(out)); mkdirSync(out, { mode: 0o700 })
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const save = (name, x) => writeFileSync(join(out, name), typeof x === 'string' ? x : `${JSON.stringify(x, null, 2)}\n`, { flag: 'wx' })
const summary = read(join(root, 'summary.json'))
const candidate = read(join(root, 'candidate.json'))
const oracle = read(join(root, 'oracle-audit.json'))
const commands = read(join(root, 'commands.json'))
assert.equal(commands.length, 32)
assert(Object.values(summary.drift).every(v => v.length === 0))
assert(Object.values(summary.frozenDrift).every(m => Object.values(m).every(v => v.length === 0)))
assert.equal(summary.oldDeclaredDrift.length, 0)
const required = { 'old-parent': [1, 0, 4, 0], 'new-parent': [0, 4, 0, 0],
  'new-expert-parent': [0, 28, 0, 0], 'old-expert-parent': [1, 0, 28, 0],
  'new-developer': [0, 23, 0, 0], 'new-independent23': [0, 23, 0, 0], 'new-regression87': [0, 87, 0, 0] }
const ids = ['PC-C01', 'PC-C02', 'PC-A01', 'PC-A02']
for (const [i, id] of ids.entries()) {
  required[`a14-original-${id}`] = i < 2 ? [0, 1, 0, 3] : [1, 0, 1, 3]
  required[`old-original-${id}`] = [0, 1, 0, 3]
  required[`new-original-${id}`] = [1, 0, 1, 3]
  required[`a14-revised-${id}`] = [1, 0, 1, 3]
  required[`old-revised-${id}`] = [1, 0, 1, 3]
  required[`new-revised-${id}`] = [0, 1, 0, 3]
}
const results = {}
for (const [id, [exit, passed, failed, pending]] of Object.entries(required)) {
  const command = commands.find(c => c.id === id)
  assert(command, id); assert.equal(command.originalExit, exit, id); assert.equal(command.signal, null, id)
  const path = join(root, `${id}.result.json`), r = read(path)
  assert.equal(r.numPassedTests, passed, id); assert.equal(r.numFailedTests, failed, id)
  assert.equal(r.numPendingTests, pending, id)
  const assertions = r.testResults.flatMap(t => t.assertionResults)
  assert.equal(assertions.filter(a => a.status === 'passed').length, passed, id)
  assert.equal(assertions.filter(a => a.status === 'failed').length, failed, id)
  results[id] = { command, path, sha256: sha(readFileSync(path)), assertions, passed, failed, pending }
}
for (const id of ids) {
  const failure = results[`new-original-${id}`].assertions.find(a => a.status === 'failed')
  assert(failure.failureMessages.every(m => m.startsWith('AssertionError: expected { …(10) } to deeply equal { …(2) }')))
  const old = results[`old-revised-${id}`].assertions.find(a => a.status === 'failed')
  assert(old.failureMessages.every(m => m.startsWith('AssertionError: expected { …(2) } to deeply equal { …(10) }')))
}
assert(results['old-parent'].assertions.every(a =>
  a.failureMessages.some(m => m.includes('expected undefined to be'))))
assert(results['old-expert-parent'].assertions.every(a =>
  a.failureMessages[0].startsWith('AssertionError:')))
const noemit = commands.find(c => c.id === 'new-noemit')
assert.equal(noemit.originalExit, 0); assert.equal(noemit.signal, null)
assert.equal(oracle.onlyExplicitEightKeysAdded, true)
assert.equal(oracle.allOriginalTaskBaseNeedsStepsAndExpectationsUnchanged, true)
const replay = read(join(root, 'replay-input.json'))
const fullBase = Object.fromEntries(['tasks', 'milestones', 'riskIssues', 'deliverables', 'meetings']
  .flatMap(table => replay.initial[table].filter(r => r.projectId === 'p-0001').map(r => [r.id, r.updatedAt])))
const transport = {}
for (const id of ids) {
  const observations = readFileSync(join(root, `new-revised-${id}.observations.jsonl`), 'utf8').trim().split('\n').map(JSON.parse)
  transport[id] = observations.filter(o => o.id === 'transport' && o.data.line.startsWith('ask-apply ')).map(o => {
    const [a, b] = o.data.line.slice('ask-apply p-0001 '.length).split(' --base ')
    return { actions: JSON.parse(a), base: JSON.parse(b), result: o.data.result }
  })
  assert.deepEqual(transport[id][0].base, fullBase)
}
assert.deepEqual(transport['PC-C01'][0].actions.map(a => [a.stepId, a.needs]),
  [['s1', []], ['s2', ['s1']], ['s3', []]])
assert.deepEqual(transport['PC-C02'].map(t => t.actions[0].stepId), ['s1', 's2', 's3'])
assert.deepEqual(transport['PC-A02'].map(t => t.actions[0].stepId), ['s1', 's3'])
assert.deepEqual(transport['PC-A02'][1].base, fullBase)
assert(transport['PC-A02'][0].result.text.includes('已应用 0 步'))
const observations = readFileSync(join(root, 'new-expert-parent.observations.jsonl'), 'utf8').trim().split('\n').map(JSON.parse)
assert.equal(observations.length, 28)
for (const o of observations) {
  assert.equal(o.sent.length, 1)
  assert.equal(Object.keys(o.sent[0].base).length, 10)
  assert.equal(o.calls.filter(c => c.startsWith('ask-apply ')).length, 1)
  assert.equal(o.calls.includes('ask-undo list'), false)
  assert.deepEqual(o.sent[0].base, o.calls.filter(c => c.startsWith('ask ')).length === 2 ? o.latestBase : o.originalBase)
}
for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n))
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`, HOME: join(out, 'home'),
  TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'), DSH_HOME: join(out, 'runtime'),
  CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1', PC_INPUT: join(root, 'replay-input.json') }
const file = `${prefix}-oracle.test.tsx`
cpSync(join(repo, 'docs/testing', file), join(candidate.freezeRoots.new, 'docs/testing', file), { preserveTimestamps: true })
const argv = [process.execPath, '/private/tmp/pmtool-a14-closure-20261022/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs',
  'run', `docs/testing/${file}`, '--config', join(root, 'new-vitest.config.mjs'), '--no-cache',
  '--reporter=verbose', '--reporter=json', '--outputFile', join(out, 'oracle.result.json')]
const start = new Date().toISOString()
const r = spawnSync(argv[0], argv.slice(1), { cwd: candidate.freezeRoots.new, env, encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024 })
save('oracle.stdout.log', r.stdout ?? ''); save('oracle.stderr.log', r.stderr ?? '')
const command = { argv, cwd: candidate.freezeRoots.new, env, start, end: new Date().toISOString(),
  originalExit: r.status, signal: r.signal, error: r.error?.message ?? null, pid: r.pid }
save('oracle.command.json', command)
const fixtureResult = read(join(out, 'oracle.result.json'))
save('check.json', { at: new Date().toISOString(), candidate, results, noemit, oracle, transport, observations,
  fixtureCommand: command, fixtureReporterSha256: sha(readFileSync(join(out, 'oracle.result.json'))),
  finiteStatus: r.status === 0 ? 'SOURCE/AUTO finite PASS' : 'SOURCE/AUTO FAIL: oracle fixture invalid',
  originalFailuresRetained: true, originalExpectationNotOverwritten: true,
  guiStatus: 'NOT_RUN', backendStorageStatus: 'NOT_RUN', fullRaStatus: 'NOT_SIGNED',
  buildAuthorizedByThisRole: false, commitStatus: 'NOT_AUTHORIZED' })
assert.equal(r.status, 0); assert.equal(r.signal, null)
assert.equal(fixtureResult.numPassedTests, 1); assert.equal(fixtureResult.numFailedTests, 0)
console.log(JSON.stringify({ finiteSourceAuto: 'PASS', originalFourFailuresRetained: true, requiredOldRed: true,
  originalParent: '4 red -> 4 green', newExpertParent: 28, developer: 23, independent: 23, regression: 87, noemit: 0, oracle: 1 }))

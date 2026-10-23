import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = join(repo, 'reports/a17-transport-feedback-developer-20261022-selftmp')
const out = join(base, 'check-r1')
assert(!existsSync(out), 'never overwrite a check')
mkdirSync(out, { mode: 0o700 })
const pkg = 'packages/dsh-pm-tool'
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const content = m => Object.fromEntries(Object.entries(m).map(([k, v]) =>
  [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(p) {
    const s = lstatSync(p), k = relative(root, p) || '.'
    if (s.isSymbolicLink()) result[k] = { link: readlinkSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else result[k] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(root)
  return result
}
const save = (n, x) => writeFileSync(join(out, n), typeof x === 'string' ? x : `${JSON.stringify(x, null, 2)}\n`, { flag: 'wx' })
const rounds = ['before-r1', 'after-r1', 'after-r2']
const evidence = rounds.map(round => {
  const root = join(base, round), summary = read(join(root, 'summary.json'))
  assert.equal(summary.protectionOk, true)
  const commands = read(join(root, 'commands.json'))
  for (const c of commands) {
    assert.equal(c.signal, null); assert.equal(c.error, null)
    assert.equal(c.env.NODE_DISABLE_COMPILE_CACHE, '1')
    for (const key of ['HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'DSH_HOME']) assert(c.env[key].startsWith(`${root}/`))
    assert.deepEqual(Object.keys(c.env).sort(), [
      'PATH', 'HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'DSH_HOME', 'CI', 'LANG', 'TZ',
      'NODE_DISABLE_COMPILE_CACHE', ...(c.id === 'noemit' ? [] : ['TF_INPUT', 'TF_OBSERVATIONS', 'PC_INPUT', 'PC_OBSERVATIONS']),
    ].sort())
    const s = summary.results.find(s => s.id === c.id)
    assert.equal(sha(readFileSync(join(root, `${c.id}.stdout.log`))), s.stdoutSha256)
    assert.equal(sha(readFileSync(join(root, `${c.id}.stderr.log`))), s.stderrSha256)
    if (c.id !== 'noemit') {
      assert(c.argv.includes('--no-cache'))
      const p = join(root, `${c.id}.result.json`), reporter = read(p)
      assert.equal(sha(readFileSync(p)), s.reporterSha256)
      assert.equal(reporter.numPassedTests, s.passed)
      assert.equal(reporter.numFailedTests, s.failed)
    } else {
      assert(c.argv.includes('--noEmit')); assert(c.argv.includes('--incremental'))
      assert.equal(c.originalExit, 0)
    }
  }
  const config = readFileSync(join(root, 'vitest.config.mjs'), 'utf8')
  assert(config.includes('"singleFork": true'))
  assert(config.includes('"maxWorkers": 1')); assert(config.includes('"cache": false'))
  return { round, results: summary.results.map(s => ({ id: s.id, exit: s.originalExit, passed: s.passed,
    failed: s.failed, pending: s.pending, reporterSha256: s.reporterSha256 })),
  }
})
const before = read(join(base, 'before-r1/frozen-inputs.json'))
const after1 = read(join(base, 'after-r1/frozen-inputs.json'))
const after2 = read(join(base, 'after-r2/frozen-inputs.json'))
const sourceDelta = diff(content(before.src), content(after2.src))
assert.deepEqual(sourceDelta, ['client/panel-transport-error-feedback.test.tsx', 'client/panel.tsx'])
for (const n of Object.keys(before)) {
  assert.deepEqual(content(after1[n]), content(after2[n]), 'fixture-only second round must keep all product inputs identical')
  if (n !== 'src') assert.deepEqual(content(before[n]), content(after2[n]))
}
const audit = read(join(base, 'after-r2/catch-only-audit.json'))
const panelPath = 'src/client/panel.tsx'
const panelBefore = readFileSync(join(base, 'before-r1/frozen', pkg, panelPath), 'utf8')
const panelAfter = readFileSync(join(base, 'after-r2/frozen', pkg, panelPath), 'utf8')
assert.equal(panelBefore.replace(audit.oldBlock, audit.newBlock), panelAfter)
assert.equal(audit.allOtherPanelBytesUnchanged, true)
const expert = join(repo, 'docs/testing/a17-transport-feedback-contract-20261022-selftmp/r2')
const originalCases = 'docs/testing/a17-transport-feedback-contract-20261022-cases.test.tsx'
for (const r of rounds) assert.equal(sha(readFileSync(join(base, r, 'frozen', originalCases))),
  sha(readFileSync(join(expert, 'frozen', originalCases))), 'all expert steps/expectations must remain exact')
const oldRed = read(join(base, 'before-r1/necessary-red.result.json'))
const newGreen = read(join(base, 'after-r2/necessary-red.result.json'))
assert.equal(oldRed.numFailedTests, 5)
assert.equal(read(join(base, 'before-r1/necessary-red.command.json')).originalExit, 1)
const oldAssertions = oldRed.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'failed')
assert(oldAssertions.every(t => t.failureMessages.every(m => m.includes("expected 'status' to be 'alert'"))))
assert.deepEqual(oldAssertions.map(t => t.fullName),
  newGreen.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'passed').map(t => t.fullName))
const fixtureFailure = read(join(base, 'after-r1/panel-and-import-regression.result.json'))
assert.equal(read(join(base, 'after-r1/panel-and-import-regression.command.json')).originalExit, 1)
assert.equal(fixtureFailure.numPassedTests, 44)
assert.equal(fixtureFailure.numFailedTests, 0)
assert.equal(fixtureFailure.numFailedTestSuites, 1)
assert(readFileSync(join(base, 'after-r1/panel-and-import-regression.stderr.log'), 'utf8')
  .includes('board-fixture-clarification-20261021-fixture.json'))
const expected = { 'success-control': 5, 'explicit-context-control': 5, 'necessary-red': 5, 'recovery-control': 2,
  'existing-regression65': 65, 'developer-transport': 14, 'revised-pc': 4, 'expert-extension': 28,
  'parent-extension': 4, independent23: 23, 'developer-extension23': 23, 'affected-regression87': 87,
  'panel-and-import-regression': 53 }
for (const [id, count] of Object.entries(expected)) {
  const root = join(base, 'after-r2'), c = read(join(root, `${id}.command.json`)), r = read(join(root, `${id}.result.json`))
  assert.equal(c.originalExit, 0); assert.equal(r.numPassedTests, count)
  assert.equal(r.numFailedTests, 0); assert.equal(r.numFailedTestSuites, 0)
}
const final = read(join(base, 'final-after-r2/final.json'))
assert.equal(final.released, true)
const e = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(base, 'after-r2/home'), TMPDIR: join(base, 'after-r2/tmp'), XDG_CACHE_HOME: join(base, 'after-r2/cache'),
  DSH_HOME: join(base, 'after-r2/runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1',
  GIT_OPTIONAL_LOCKS: '0' }
const deltaCommands = []
for (const [id, from, to] of [
  ['catch-delta', join(base, 'before-r1/frozen', pkg, panelPath), join(base, 'after-r2/frozen', pkg, panelPath)],
  ['new-test-delta', '/dev/null', join(base, 'after-r2/frozen', pkg, 'src/client/panel-transport-error-feedback.test.tsx')],
]) {
  const argv = ['/usr/bin/git', 'diff', '--no-index', '--binary', '--', from, to], start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd: repo, env: e, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  save(`${id}.stdout.patch`, r.stdout ?? ''); save(`${id}.stderr.log`, r.stderr ?? '')
  const c = { id, argv, cwd: repo, env: e, start, end: new Date().toISOString(), pid: r.pid,
    originalExit: r.status, signal: r.signal, expectedDifferenceExit: 1 }
  save(`${id}.command.json`, c); deltaCommands.push(c)
  assert.equal(r.status, 1); assert.equal(r.signal, null); assert.equal(r.stderr, '')
}
save('runtime-write-roots.json', Object.fromEntries(rounds.map(r => [r,
  Object.fromEntries(['home', 'tmp', 'cache', 'runtime'].map(n => [n, inventory(join(base, r, n))]))])))
save('check.json', { at: new Date().toISOString(), evidence, sourceDelta, catchOnly: audit,
  allExpertExpectationsUnchanged: true, allProductInputsSameAfterFixtureCorrection: true,
  originalNecessaryRedAndFixtureFailurePreserved: true,
  originalA14PcOracleNotModifiedOrDeclaredRepaired: true,
  candidate: read(join(base, 'after-r2/candidate.json')),
  newTest: inventory(join(repo, pkg, 'src/client/panel-transport-error-feedback.test.tsx'))['.'],
  deltaCommands, final, authorOnly: true, independentPass: false, guiExecuted: false, built: false })
console.log(JSON.stringify({ sourceDelta, finalReleased: final.released, authorEvidenceCheck: true, independentPass: false }))

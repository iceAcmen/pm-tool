import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a18-feedback-context-independent-retest-20261022'
const base = join(repo, 'docs/testing', `${prefix}-selftmp`)
const out = join(base, 'r3'), final = join(base, 'final-r3'), review = join(base, 'review-r3')
assert(!existsSync(review), 'never overwrite review')
mkdirSync(review, { mode: 0o700 })
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const save = (n, v) => writeFileSync(join(review, n), typeof v === 'string' ? v : `${JSON.stringify(v, null, 2)}\n`, { flag: 'wx' })
function inventory(root) {
  const m = {}
  if (!existsSync(root)) return m
  function walk(p) {
    const s = lstatSync(p), k = relative(root, p) || '.'
    if (s.isSymbolicLink()) m[k] = { link: readlinkSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else m[k] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(root)
  return m
}
const expected = {
  'adapter-counterexamples20': [20, 0], 'independent-context-counterexamples': [16, 0],
  'success-control': [5, 12], 'explicit-context-control': [5, 12], 'original-five-retest': [5, 12],
  'recovery-control': [2, 15], 'original-a18-13': [13, 49], 'developer-a18-16': [16, 46],
  'original-regression65': [65, 7], 'current-regression72': [72, 0], 'developer-transport14': [14, 9],
  'revised-pc4': [4, 0], 'expert-extension28': [28, 0], 'parent-extension4': [4, 0],
  independent23: [23, 0], 'developer-extension23': [23, 0], 'affected-regression87': [87, 0],
  'panel-and-import-regression53': [53, 0],
}
assert.deepEqual(inventory(out), read(join(final, 'own-output-inventory.json')))
const summary = read(join(out, 'summary.json')), commands = read(join(out, 'commands.json'))
assert.equal(summary.finiteAutomaticPass, true)
assert.equal(summary.protectionOk, true)
assert.equal(commands.length, Object.keys(expected).length + 2)
const reviewed = []
for (const c of commands) {
  assert.deepEqual(c, read(join(out, `${c.id}.command.json`)))
  const s = summary.results.find(s => s.id === c.id)
  assert.equal(c.signal, null); assert.equal(c.error, null)
  assert.equal(c.originalExit, c.id === 'adapter-diff' ? 1 : 0)
  assert.deepEqual(Object.keys(c.env).sort(), [
    'PATH', 'HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'DSH_HOME', 'CI', 'LANG', 'TZ', 'NODE_DISABLE_COMPILE_CACHE',
    ...(expected[c.id] ? ['TF_INPUT', 'TF_OBSERVATIONS', 'PC_INPUT', 'PC_OBSERVATIONS'] : []),
  ].sort())
  for (const key of ['HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'DSH_HOME']) assert(c.env[key].startsWith(`${out}/`))
  assert.equal(c.env.NODE_DISABLE_COMPILE_CACHE, '1')
  for (const n of ['stdout', 'stderr']) assert.equal(sha(readFileSync(join(out, `${c.id}.${n}.log`))), s[`${n}Sha256`])
  if (expected[c.id]) {
    const p = join(out, `${c.id}.result.json`), r = read(p)
    assert.equal(sha(readFileSync(p)), s.reporterSha256)
    assert.deepEqual([r.numPassedTests, r.numPendingTests], expected[c.id])
    assert.equal(r.numFailedTests, 0); assert.equal(r.numFailedTestSuites, 0)
    assert(c.argv.includes('--no-cache'))
  } else if (c.id === 'noemit') {
    assert(c.argv.includes('--noEmit')); assert(c.argv.includes('--incremental')); assert(c.argv.includes('false'))
    assert.equal(readFileSync(join(out, 'noemit.stdout.log'), 'utf8'), '')
    assert.equal(readFileSync(join(out, 'noemit.stderr.log'), 'utf8'), '')
  }
  reviewed.push({ id: c.id, exit: c.originalExit, passed: s.passed, pending: s.pending, reporterSha256: s.reporterSha256 })
}
const config = readFileSync(join(out, 'vitest.config.mjs'), 'utf8')
for (const fragment of ['"cache": false', '"singleFork": true', '"maxWorkers": 1', '"minWorkers": 1'])
  assert(config.includes(fragment))
const red = read(join(out, 'original-counterexamples20.result.json'))
assert.deepEqual([red.numPassedTests, red.numFailedTests], [19, 1])
const redCommand = read(join(out, 'original-counterexamples20.command.json'))
assert.equal(redCommand.originalExit, 1)
const redFailure = red.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'failed')
assert.equal(redFailure.length, 1)
assert(redFailure[0].fullName.startsWith('TF-X08 '))
assert(redFailure[0].failureMessages[0].includes(':60:64'))
assert(redFailure[0].failureMessages[0].includes('expected 3000 to be null'))
const lines = id => readFileSync(join(out, `${id}.observations.jsonl`), 'utf8').trim().split('\n').map(JSON.parse)
const oldState = lines('original-counterexamples20').find(x => x.id === 'TF-X08-before-assertion')
assert.equal(oldState.card.role, 'alert'); assert.equal(oldState.card.live, 'assertive')
assert.equal(oldState.classified.autoDismissMs, 3000); assert.equal(oldState.disabled, false)
assert.deepEqual(oldState.copied, [])
const adapter = read(join(out, 'adapter-contract.json'))
const adaptedPath = join(out, 'frozen/docs/testing', `${prefix}-adapter.test.tsx`)
const originalPath = join(out, 'frozen/docs/testing/a17-transport-feedback-independent-retest-20261022-cases.test.tsx')
const originalText = readFileSync(originalPath, 'utf8'), adaptedText = readFileSync(adaptedPath, 'utf8')
assert.equal(sha(originalText), adapter.originalSha256); assert.equal(sha(adaptedText), adapter.adapterSha256)
assert.equal(adaptedText.replace(adapter.onlyChange.replacement, adapter.onlyChange.needle), originalText)
assert.equal(originalText.split(adapter.onlyChange.needle).length, 2)
const adaptedReport = read(join(out, 'adapter-counterexamples20.result.json'))
assert.deepEqual(red.testResults.flatMap(t => t.assertionResults).map(t => t.fullName).sort(),
  adaptedReport.testResults.flatMap(t => t.assertionResults).map(t => t.fullName).sort())
const complete = lines('independent-context-counterexamples').filter(x => x.id === 'A18-X01-complete')
assert.equal(complete.length, 2)
for (const x of complete) {
  assert.equal(x.exactOriginalBody, true); assert.equal(x.message, oldState.message)
  assert.equal(x.card.role, 'alert'); assert.equal(x.card.live, 'assertive')
  assert.equal(x.classified.autoDismissMs, null); assert.equal(x.classified.action, null)
  assert.deepEqual(x.copies, [[x.message]]); assert.deepEqual(x.toasts, [])
  assert.deepEqual(x.calls, ['web snapshot', 'task update t-0001 {}'])
}
const oldFive = read(join(out, 'original-audit.json')).oldFive
const newFive = read(join(out, 'original-five-retest.result.json')).testResults.flatMap(t => t.assertionResults)
  .filter(t => t.status === 'passed').map(t => t.fullName).sort()
assert.deepEqual(oldFive, newFive)
const liveDrift = []
for (const [p, m] of Object.entries(read(join(final, 'protected-after.json'))))
  if (JSON.stringify(inventory(p)) !== JSON.stringify(m)) liveDrift.push(p)
save('live-drift.json', liveDrift)
assert.deepEqual(liveDrift, [])
const closed = read(join(final, 'final.json'))
assert.equal(closed.released, true); assert.equal(closed.noRecordedChildren, true)
assert.equal(closed.finiteAutomaticPass, true); assert.equal(closed.wholeGateSigned, false)
const allCommands = [...read(join(out, 'acquisition-commands.json')), ...read(join(out, 'original-commands.json')), ...commands]
const pids = [...new Set(allCommands.map(c => c.pid).filter(Boolean))]
const argv = ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command=']
const env = { ...redCommand.env }
for (const key of ['TF_INPUT', 'TF_OBSERVATIONS', 'PC_INPUT', 'PC_OBSERVATIONS']) delete env[key]
const start = new Date().toISOString(), ps = spawnSync(argv[0], argv.slice(1), { cwd: repo, env, encoding: 'utf8' })
save('process-check.stdout.log', ps.stdout); save('process-check.stderr.log', ps.stderr)
save('process-check.command.json', { argv, cwd: repo, env, pid: ps.pid, start, end: new Date().toISOString(),
  originalExit: ps.status, signal: ps.signal })
assert.equal(ps.status, 1); assert.equal(ps.stdout.trim(), '')
save('early-failed-rounds.json', Object.fromEntries(['r1', 'r2'].map(r => [r, inventory(join(base, r))])))
const candidate = read(join(out, 'candidate.json'))
const hashes = Object.fromEntries(['candidate.json', 'frozen-inputs.json', 'candidate-tracked.patch', 'candidate-new-inputs.json',
  'commands.json', 'summary.json', 'original-audit.json', 'original-counterexamples20.result.json',
  'original-counterexamples20.stderr.log', 'adapter-counterexamples20.result.json', 'adapter-contract.json',
  'adapter-diff.stdout.log', 'independent-context-counterexamples.result.json', 'independent-context-counterexamples.observations.jsonl']
  .map(n => [n, sha(readFileSync(join(out, n)))]))
save('hashes.json', hashes)
save('review.json', { sourceVerdict: 'PASS', finiteAutomaticVerdict: 'PASS with documented single-line oracle adapter',
  original20Verdict: 'FAIL: 19 passed, 1 failed, preserved', reviewed, candidate, hashes,
  protectedRoots: candidate.protectedRoots, liveDrift, exactOriginalTFX08ExecutedWithContext: true,
  originalFiveUnmodified: true, noProductEdits: true, noBuild: true, noGui: true, wholeGateSigned: false,
  instance3247NotAccessed: true, mainGrowthEvidenceExcluded: true, noRecordedChildren: true, released: true })
console.log(JSON.stringify({ source: 'PASS', finiteAuto: 'PASS', original20: 'FAIL preserved',
  originalFiveUnmodified: true, protectedRoots: candidate.protectedRoots, liveDrift, released: true, guiSigned: false }))

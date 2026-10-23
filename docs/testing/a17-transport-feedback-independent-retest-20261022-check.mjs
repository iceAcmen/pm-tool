import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a17-transport-feedback-independent-retest-20261022'
const testing = join(repo, 'docs/testing')
const base = join(testing, `${prefix}-selftmp`)
const out = join(base, 'review-r1')
assert(!existsSync(out), 'never overwrite independent review')
mkdirSync(out, { mode: 0o700 })
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const save = (n, v) => writeFileSync(join(out, n), `${JSON.stringify(v, null, 2)}\n`, { flag: 'wx' })
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
const round = join(base, 'r1')
const summary = read(join(round, 'summary.json'))
const commands = read(join(round, 'commands.json'))
const expected = {
  'success-control': [0, 5, 0, 12], 'explicit-context-control': [0, 5, 0, 12],
  'original-five-retest': [0, 5, 0, 12], 'recovery-control': [0, 2, 0, 15],
  'existing-regression65': [0, 65, 0, 0], 'developer-transport14': [0, 14, 0, 0],
  'independent-counterexamples': [1, 19, 1, 0], 'revised-pc4': [0, 4, 0, 0],
  'expert-extension28': [0, 28, 0, 0], 'parent-extension4': [0, 4, 0, 0],
  independent23: [0, 23, 0, 0], 'developer-extension23': [0, 23, 0, 0],
  'affected-regression87': [0, 87, 0, 0], 'panel-and-import-regression53': [0, 53, 0, 0],
  noemit: [0],
}
assert.equal(commands.length, Object.keys(expected).length)
const reviewedCommands = []
for (const c of commands) {
  const s = summary.results.find(r => r.id === c.id)
  assert.deepEqual(c, read(join(round, `${c.id}.command.json`)))
  assert.equal(c.originalExit, expected[c.id][0])
  assert.equal(c.signal, null); assert.equal(c.error, null)
  for (const key of ['HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'DSH_HOME']) assert(c.env[key].startsWith(`${round}/`))
  assert.deepEqual(Object.keys(c.env).sort(), [
    'PATH', 'HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'DSH_HOME', 'CI', 'LANG', 'TZ', 'NODE_DISABLE_COMPILE_CACHE',
    ...(c.id === 'noemit' ? [] : ['TF_INPUT', 'TF_OBSERVATIONS', 'PC_INPUT', 'PC_OBSERVATIONS']),
  ].sort())
  assert.equal(c.env.NODE_DISABLE_COMPILE_CACHE, '1')
  for (const type of ['stdout', 'stderr'])
    assert.equal(sha(readFileSync(join(round, `${c.id}.${type}.log`))), s[`${type}Sha256`])
  if (c.id === 'noemit') {
    assert(c.argv.includes('--noEmit')); assert(c.argv.includes('--incremental')); assert(c.argv.includes('false'))
  } else {
    assert(c.argv.includes('--no-cache'))
    const r = read(join(round, `${c.id}.result.json`))
    assert.equal(sha(readFileSync(join(round, `${c.id}.result.json`))), s.reporterSha256)
    assert.deepEqual([c.originalExit, r.numPassedTests, r.numFailedTests, r.numPendingTests], expected[c.id])
    assert.equal(r.numFailedTestSuites, c.id === 'independent-counterexamples' ? 1 : 0)
  }
  for (const [type, info] of Object.entries(s.observations))
    assert.deepEqual({ sha256: sha(readFileSync(join(round, `${c.id}.${type}.jsonl`))),
      bytes: lstatSync(join(round, `${c.id}.${type}.jsonl`)).size }, info)
  reviewedCommands.push({ id: c.id, originalExit: c.originalExit, reporterSha256: s.reporterSha256 })
}
const config = readFileSync(join(round, 'vitest.config.mjs'), 'utf8')
assert(config.includes('"singleFork": true')); assert(config.includes('"maxWorkers": 1'))
assert(config.includes('"cache": false'))
const failure = read(join(round, 'independent-counterexamples.result.json')).testResults
  .flatMap(t => t.assertionResults).filter(t => t.status === 'failed')
assert.equal(failure.length, 1)
assert(failure[0].fullName.startsWith('TF-X08 '))
assert(failure[0].failureMessages.every(m => m.includes("expected undefined to be 'alert'")))
const observed = readFileSync(join(round, 'independent-counterexamples.observations.jsonl'), 'utf8')
  .trim().split('\n').map(JSON.parse).find(r => r.id === 'TF-X08-before-assertion')
assert.equal(observed.card, null)
assert.equal(observed.classified.isError, false)
assert.equal(observed.classified.structured, true)
assert.equal(observed.disabled, false)
assert.deepEqual(observed.calls, ['web snapshot', 'task update t-0001 {}'])
assert(observed.message.startsWith('执行失败：'))
assert.equal(summary.originalFiveNamesMatch, true)
assert.equal(summary.protectionOk, true)
assert.equal(summary.finiteAutomaticPass, false)
const final = read(join(base, 'final-r1/final.json'))
assert.equal(final.released, true)
assert.equal(final.automaticPass, false)
assert.equal(final.noRecordedChildren, true)
const ps = read(join(base, 'final-r1/process-check.command.json'))
assert.equal(ps.originalExit, 1)
assert.equal(readFileSync(join(base, 'final-r1/process-check.stdout.log'), 'utf8'), '')
assert.deepEqual(inventory(round), read(join(base, 'final-r1/own-output-inventory.json')),
  'all sealed evidence bytes/hash/mtime')
const protection = read(join(base, 'final-r1/protected-after.json'))
const liveDrift = []
for (const [p, m] of Object.entries(protection)) {
  if (JSON.stringify(inventory(p)) !== JSON.stringify(m)) liveDrift.push(p)
}
save('live-drift.json', liveDrift)
assert.deepEqual(liveDrift, [])
const report = readFileSync(join(testing, `${prefix}.md`), 'utf8')
assert(report.includes('本批完整 SOURCE/AUTO 结论仍为 FAIL'))
assert(report.includes('19 PASS / 1 FAIL'))
assert(report.includes('0 / 0 / 1 / 0'))
save('review.json', { at: new Date().toISOString(), argv: process.argv, cwd: process.cwd(),
  evidenceConsistencyChecked: true, reviewedCommands, liveProtectedRoots: Object.keys(protection).length,
  liveDrift, oldFiveToNewFiveNamesMatch: true, counterexampleFailurePreserved: failure,
  reportSha256: sha(report), finalSha256: sha(readFileSync(join(base, 'final-r1/final.json'))),
  sourceAndAutomaticVerdict: 'FAIL: TF-X08 remains', evidenceAuditNotProductPass: true,
  released: true, noProductEdits: true, noBuild: true, noGui: true, noServices: true, noCommit: true })
console.log(JSON.stringify({ evidenceConsistencyChecked: true, protectedRoots: Object.keys(protection).length,
  liveDrift, verdict: 'FAIL: TF-X08', released: true, evidenceAuditNotProductPass: true }))

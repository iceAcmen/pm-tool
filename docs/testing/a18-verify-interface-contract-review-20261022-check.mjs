import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a18-verify-interface-contract-review-20261022'
const base = join(repo, 'docs/testing', `${prefix}-selftmp`)
const out = join(base, 'r3'), final = join(base, 'final-r3'), review = join(base, 'review-r3')
assert(!existsSync(review), 'never overwrite a review')
mkdirSync(review, { mode: 0o700 })
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const save = (name, value) => writeFileSync(join(review, name),
  typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
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
assert.deepEqual(inventory(out), read(join(final, 'own-output-inventory.json')))
const closed = read(join(final, 'final.json'))
assert.equal(closed.released, true); assert.equal(closed.protectionOk, true)
assert.deepEqual(closed.protectedDrift, {}); assert.deepEqual(closed.frozenDrift, {})
assert.deepEqual(closed.frozenLibDrift, []); assert.deepEqual(closed.testsDrift, [])
assert.equal(closed.wholeGateSigned, false)
const reviewed = []
for (const c of read(join(final, 'commands.json'))) {
  assert.deepEqual(c, read(join(out, `${c.id}.command.json`)))
  assert.equal(c.signal, null); assert.equal(c.error, null)
  assert.deepEqual(Object.keys(c.env).sort(), [
    'PATH', 'HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'DSH_HOME', 'LANG', 'TZ', 'CI', 'NODE_DISABLE_COMPILE_CACHE',
    ...(c.env.TF_OBSERVATIONS ? ['TF_OBSERVATIONS'] : []),
    ...(c.env.GIT_OPTIONAL_LOCKS ? ['GIT_OPTIONAL_LOCKS'] : []),
  ].sort())
  assert.equal(c.env.NODE_DISABLE_COMPILE_CACHE, '1')
  for (const k of ['HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'DSH_HOME']) assert(c.env[k].startsWith(`${out}/`))
  const p = join(out, `${c.id}.result.json`), reporter = existsSync(p) ? read(p) : null
  const negative = c.id.startsWith('mutant-') && c.id.endsWith('-real-panel')
  if (reporter) {
    assert(c.argv.includes('--no-cache'))
    assert.equal(reporter.numFailedTests > 0, negative)
    if (negative) {
      assert.equal(c.exit, 1); assert.equal(reporter.numPendingTests, 2)
      assert.equal(reporter.numTotalTests, 6)
      assert.equal(reporter.numPassedTests + reporter.numFailedTests, 4)
      assert(reporter.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'failed')
        .every(t => t.fullName.startsWith('IV-01 ') && t.failureMessages.length > 0))
    } else {
      assert.equal(c.exit, 0); assert.equal(reporter.numPendingTests, 0)
      assert.equal(reporter.numFailedTestSuites, 0)
      assert.equal(reporter.numPassedTests, { 'real-panel6': 6, 'previous-independent16': 16, 'same-area62': 62 }[c.id])
    }
  }
  reviewed.push({ id: c.id, exit: c.exit, passed: reporter?.numPassedTests, failed: reporter?.numFailedTests,
    pending: reporter?.numPendingTests, commandSha256: sha(readFileSync(join(out, `${c.id}.command.json`))),
    stdoutSha256: sha(readFileSync(join(out, `${c.id}.stdout.log`))),
    stderrSha256: sha(readFileSync(join(out, `${c.id}.stderr.log`))),
    reporterSha256: reporter ? sha(readFileSync(p)) : null })
}
for (const [name, line] of [['verify-gantt-drag', 105], ['verify-ui-feedback', 234]]) {
  assert.equal(read(join(out, `original-${name}.command.json`)).exit, 1)
  assert(readFileSync(join(out, `original-${name}.stderr.log`), 'utf8').includes(`${name}.mjs:${line}:`))
  const contract = read(join(out, `${name}-adapter-contract.json`))
  const scripts = join(out, 'frozen/packages/dsh-pm-tool/scripts')
  const original = readFileSync(join(scripts, `${name}.mjs`), 'utf8')
  const adapted = readFileSync(join(scripts, `${name}.adapter.mjs`), 'utf8')
  assert.equal(sha(original), contract.originalSha256)
  assert.equal(sha(adapted), contract.adaptedSha256)
  assert.equal(adapted.replace(contract.importLine, '').replace(contract.newLine, contract.oldLine), original)
  assert.equal(read(join(out, `adapted-${name}.command.json`)).exit, 0)
}
const counters = read(join(out, 'counterexamples.json'))
assert.equal(counters.length, 8)
assert.equal(counters.filter(c => c.dynamic).length, 6)
for (const c of counters) assert(c.static.some(s => s.exit === 1))
const old = join(repo, 'reports/a18-feedback-error-context-developer-20261022-selftmp/before-r1/frozen/packages/dsh-pm-tool/src')
const historical = join(out, 'mutants/historical-a17/packages/dsh-pm-tool/src')
for (const n of ['client/panel.tsx', 'client/result-card.tsx', 'core/ui-feedback.ts'])
  assert.equal(sha(readFileSync(join(old, n))), sha(readFileSync(join(historical, n))))
const core = readFileSync(join(out, 'frozen/packages/dsh-pm-tool/src/core/ui-feedback.ts'), 'utf8')
const oldCore = readFileSync(join(old, 'core/ui-feedback.ts'), 'utf8')
assert.equal(core.slice(core.indexOf('  const parsed = parseFeedback(message)')),
  oldCore.slice(oldCore.indexOf('  const parsed = parseFeedback(message)')))
const discovery = read(join(out, 'proposed-discovery.json'))
assert.equal(discovery.proposedTargets.length, 95)
assert.deepEqual(discovery.originalTargets, discovery.proposedTargets)
const rawDir = join(repo, 'reports/all-pending-evidence-20261021/A18/full-verify')
const raw = readFileSync(join(rawDir, 'guard.stdout.txt'), 'utf8')
const rows = [...raw.matchAll(/^\[guard\]\s+(ok|FAIL)\s+(scripts\/verify-[^\s]+\.mjs)\s+\(退出码=(\d+)/gm)]
  .map(m => ({ state: m[1], script: m[2], exit: Number(m[3]) }))
assert.equal(rows.length, 95); assert.equal(rows.filter(r => r.state === 'ok').length, 93)
assert.deepEqual(rows.filter(r => r.state === 'FAIL').map(r => r.script),
  ['scripts/verify-gantt-drag.mjs', 'scripts/verify-ui-feedback.mjs'])
assert.equal(read(join(rawDir, 'guard.exit.json')).exit, 1)
save('main-raw95-audit.json', { rows, verdict: '93/95 FAIL preserved, not rerun here',
  stdoutSha256: sha(readFileSync(join(rawDir, 'guard.stdout.txt'))),
  stderrSha256: sha(readFileSync(join(rawDir, 'guard.stderr.txt'))) })
const liveDrift = []
for (const [p, m] of Object.entries(read(join(final, 'protected-after.json'))))
  if (JSON.stringify(inventory(p)) !== JSON.stringify(m)) liveDrift.push(p)
save('live-drift.json', liveDrift)
assert.deepEqual(liveDrift, [])
const cs = read(join(final, 'commands.json')), pids = [...new Set(cs.map(c => c.pid))]
const argv = ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command=']
const r = spawnSync(argv[0], argv.slice(1), { cwd: repo, env: cs[0].env, encoding: 'utf8' })
save('process-check.stdout.log', r.stdout); save('process-check.stderr.log', r.stderr)
save('process-check.json', { argv, pid: r.pid, exit: r.status, signal: r.signal })
assert.equal(r.status, 1); assert.equal(r.stdout.trim(), '')
save('prior-rounds.json', { r1Unchanged: JSON.stringify(inventory(join(base, 'r1'))) ===
  JSON.stringify(read(join(base, 'final-r1/own-output-inventory.json'))), r2Inventory: inventory(join(base, 'r2')) })
const hashes = Object.fromEntries(['candidate.json', 'frozen-inputs.json', 'summary.json',
  'adapter-diff-verify-gantt-drag.stdout.log', 'adapter-diff-verify-ui-feedback.stdout.log',
  'original-verify-gantt-drag.stderr.log', 'original-verify-ui-feedback.stderr.log',
  'real-panel6.result.json', 'previous-independent16.result.json', 'same-area62.result.json', 'proposed-discovery.json']
  .map(n => [n, sha(readFileSync(join(out, n)))]))
save('review.json', { verdict: 'finite SOURCE/AUTO PASS with proposed adapter; original two FAIL preserved',
  candidate: read(join(out, 'candidate.json')), reviewed, hashes, liveDrift,
  historicalThreeOriginalsReplayed: true, full95Rerun: false, guiSigned: false,
  wholeGateSigned: false, noRecordedChildren: true, released: true })
console.log(JSON.stringify({ finiteSourceAuto: 'PASS', originalTwo: 'FAIL preserved',
  counterexamples: 8, dynamicNegativeGroups: 6, positives: [6, 16, 62], liveDrift, released: true,
  full95Rerun: false, guiSigned: false, wholeGateSigned: false }))

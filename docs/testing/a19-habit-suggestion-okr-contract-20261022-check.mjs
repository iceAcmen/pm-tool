import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a19-habit-suggestion-okr-contract-20261022'
const out = join(repo, 'docs/testing', `${prefix}-selftmp/r1`)
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
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
const changed = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const summary = read(join(out, 'summary.json')), seal = read(join(out, 'seal.json'))
const before = read(join(out, 'protected-before.json'))
const after = Object.fromEntries(Object.keys(before).map(p => [p, inventory(p)]))
const differences = Object.entries(before).flatMap(([root, values]) =>
  changed(values, after[root]).map(path => ({ root, path, before: values[path], after: after[root][path] })))
const expected = [
  ['necessary-red', 1, 0, 13, 10],
  ['component-controls', 0, 10, 0, 13],
  ['original-model-controls', 0, 10, 0, 0],
]
for (const [id, exit, passed, failed, pending] of expected) {
  const command = summary.results.find(c => c.id === id)
  assert.equal(command.originalExit, exit)
  assert.equal(command.passed, passed)
  assert.equal(command.failed, failed)
  assert.equal(command.pending, pending)
  const p = join(out, `${id}.result.json`), r = read(p)
  assert.equal(sha(readFileSync(p)), command.reporterSha)
  assert.deepEqual(r.testResults.flatMap(t => t.assertionResults), command.assertions)
  if (id === 'necessary-red') assert(command.assertions.filter(a => a.status === 'failed')
    .every(a => a.failureMessages[0].includes('自身关联标签')))
}
const old = read(join(repo, 'docs/testing/a18-growth-more-gui-review-20261022-audit-r2.json')).protectedBefore
const originalDrift = Object.entries(old).filter(([p, expected]) => {
  const actual = inventory(p)['.']
  return !actual || ['sha256', 'bytes', 'mtimeMs'].some(k => actual[k] !== expected[k])
}).map(([p]) => p)
const candidate = read(join(out, 'candidate.json'))
const manifest = read(join(out, 'frozen-inputs.json'))
const frozenDiff = candidate.completeInputs.filter(n =>
  changed(manifest[n], inventory(join(candidate.frozen, 'packages/dsh-pm-tool', n))).length)
const mainDiff = candidate.completeInputs.filter(n =>
  changed(read(join(out, 'source-before-copy.json'))[n], inventory(join(repo, 'packages/dsh-pm-tool', n))).length)
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
  DSH_HOME: join(out, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1',
}
const pids = summary.results.map(c => c.pid)
const r = spawnSync('/bin/ps', ['-p', pids.join(','), '-o', 'pid=,ppid=,command='],
  { cwd: repo, env, encoding: 'utf8' })
const noRecordedChildren = r.status === 1 && !r.stdout.trim()
const result = {
  at: new Date().toISOString(), originalCount: Object.keys(old).length, originalDrift,
  correction: 'r1 compared fingerprint JSON key order; r2 compares SHA/bytes/mtime fields; r1 retained',
  manifestSha: sha(readFileSync(join(out, 'frozen-inputs.json'))),
  frozenDiff, mainDiff, differences, originalResultsValidated: true,
  originalRedStillFail: true, facilitiesProtection: differences.length ? 'BLOCKED' : 'unchanged',
  binDriftOnly: differences.every(d => d.path.startsWith('node_modules/.bin/')),
  binDriftAttribution: 'not established; do not claim whole protection green or restore shared dependencies',
  frozenFileCount: Object.values(manifest).reduce((n, m) => n + Object.keys(m).length, 0),
  protectedUniqueFiles: new Set(Object.entries(before).flatMap(([root, m]) => Object.keys(m)
    .map(k => k === '.' ? root : join(root, k)))).size,
  noRecordedChildren, resourceReleased: noRecordedChildren,
  originalSealReleased: seal.released, stop: true, passSigned: false,
  processCheck: { argv: ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command='],
    env, exit: r.status, stdout: r.stdout, stderr: r.stderr },
  deliverables: Object.fromEntries(readdirSync(join(repo, 'docs/testing'))
    .filter(n => n.startsWith(prefix) && !n.endsWith('-selftmp'))
    .map(n => [n, inventory(join(repo, 'docs/testing', n))])),
}
writeFileSync(join(out, 'final-check-r2.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ originalResultsValidated: true, originalCount: result.originalCount,
  originalDrift, frozenDiff, mainDiff, driftCount: differences.length,
  binDriftOnly: result.binDriftOnly, protectedUniqueFiles: result.protectedUniqueFiles,
  frozenFileCount: result.frozenFileCount, noRecordedChildren,
  resourceReleased: result.resourceReleased, facilitiesProtection: result.facilitiesProtection,
  stop: true, passSigned: false }))
process.exitCode = differences.length || originalDrift.length || frozenDiff.length || mainDiff.length ||
  !noRecordedChildren ? 1 : 0

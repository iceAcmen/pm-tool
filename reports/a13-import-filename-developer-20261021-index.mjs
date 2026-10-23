import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a13-import-filename-developer-20261021'
const root = join(repo, 'reports', `${prefix}-selftmp`)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const old = json(join(root, 'old-r1/candidate.json'))
const current = json(join(root, 'new-r3/candidate.json'))
const allowed = ['client/views/tasks.tsx', 'client/views/tasks-import-confirm.test.tsx', 'commands/task.ts']
const changed = [...new Set([...Object.keys(old.source.files), ...Object.keys(current.source.files)])]
  .filter(path => old.source.files[path]?.sha256 !== current.source.files[path]?.sha256)
assert(changed.every(path => allowed.includes(path)), `本批源码差异越界 ${changed.join(',')}`)
const summary = json(join(root, 'new-r3/summary.json'))
assert(summary.executions.every(command => command.originalExit === 0), '保留原失败，不以索引覆盖')
assert(summary.audit.protectedUnchanged)
assert.equal(summary.audit.frozenSourceDrift.length, 0)
const commands = []
const env = summary.executions[0].env
function execute(label, executable, args, cwd) {
  const started = new Date().toISOString()
  const result = spawnSync(executable, args, { cwd, env, encoding: 'utf8', timeout: 30000, maxBuffer: 32 * 1024 * 1024 })
  writeFileSync(join(root, `${label}.stdout.log`), result.stdout ?? '')
  writeFileSync(join(root, `${label}.stderr.log`), result.stderr ?? '')
  const command = { label, executable, args, cwd, started, ended: new Date().toISOString(),
    originalExit: result.status, signal: result.signal }
  writeFileSync(join(root, `${label}.command.json`), `${JSON.stringify(command, null, 2)}\n`)
  commands.push(command)
  return result
}
const productDiff = execute('owned-source-diff', '/usr/bin/git', [
  'diff', '--no-index', '--binary', '--',
  join(root, 'old-r1/frozen/packages/dsh-pm-tool/src'),
  join(root, 'new-r3/frozen/packages/dsh-pm-tool/src'),
], repo)
assert.equal(productDiff.status, 1, 'git diff --no-index exit1只表示存在差异')
const diffCheck = execute('diff-check', '/usr/bin/git', ['diff', '--check', '--',
  'packages/dsh-pm-tool/src/commands/task.ts', 'packages/dsh-pm-tool/src/client/views/tasks.tsx',
  'docs/plans/2026-10-21-import-filename-closure.md'], repo)
assert.equal(diffCheck.status, 0)
const vendor = execute('vendor-static', process.execPath, [
  join(repo, 'packages/dsh-pm-tool/scripts/verify-external-skills.mjs'),
], repo)
assert.equal(vendor.status, 0, vendor.stderr)
const artifacts = []
for (const [name, tree] of [
  ['A11', '/private/tmp/pmtool-all-closure-20261021'],
  ['A12', '/private/tmp/pmtool-a12-closure-20261021'],
]) {
  const candidatePath = join(repo, 'reports/all-pending-evidence-20261021', name, 'candidate.json')
  const candidate = json(candidatePath)
  const checks = Object.entries(candidate.artifacts).map(([path, expected]) => {
    const file = join(tree, path)
    return { path, expected, actual: existsSync(file) ? sha(readFileSync(file)) : null }
  })
  artifacts.push({ name, tree, originalCandidateSha256: sha(readFileSync(candidatePath)),
    checks, matchesOriginal: checks.every(check => check.actual === check.expected) })
}
const live = Object.entries(current.source.files).map(([path, value]) => ({
  path, expected: value.sha256, actual: sha(readFileSync(join(repo, 'packages/dsh-pm-tool/src', path))),
}))
assert(live.every(file => file.actual === file.expected), '释放前live source已漂移')
const indexed = {}
function walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) continue
    if (stat.isDirectory()) walk(path)
    else if (name !== 'evidence-index.json') indexed[relative(root, path)] = {
      sha256: sha(readFileSync(path)), bytes: stat.size,
    }
  }
}
walk(root)
writeFileSync(join(root, 'evidence-index.json'), `${JSON.stringify({
  at: new Date().toISOString(), role: '开发原证索引，非独立审签',
  baselineCommit: current.baselineCommit, oldSourceTreeSha256: old.sourceTreeSha256,
  newSourceTreeSha256: current.sourceTreeSha256, sourceChanges: changed,
  ownedSourcePatchSha256: sha(productDiff.stdout), commands, artifacts,
  liveSourceMatchesFrozen: true, files: indexed, gui: 'NOT_RUN', independentSource: 'NOT_SIGNED',
  boundary: 'A11/A12原产物逐hash只读比对；运行期保护根见各audit，索引不等独立PASS或全机零写',
}, null, 2)}\n`)
console.log(JSON.stringify({ sourceChanges: changed, liveSourceMatchesFrozen: true,
  artifacts: artifacts.map(item => ({ name: item.name, count: item.checks.length, matchesOriginal: item.matchesOriginal })),
  indexedFiles: Object.keys(indexed).length, indexSha256: sha(readFileSync(join(root, 'evidence-index.json'))) }))

import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'

const repo = process.cwd()
const prefix = 'a10-import-preflight-developer-20261021'
const self = join(repo, 'reports', `${prefix}-selftmp`)
const pkg = join(repo, 'packages/dsh-pm-tool')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const mode = process.argv[2]
const phase = mode === 'freeze' || mode?.startsWith('red') ? 'red' : 'green'
const frozen = join(self, phase, 'repo')
const runRoot = join(frozen, 'packages/dsh-pm-tool')
const sha = data => createHash('sha256').update(data).digest('hex')
function inventory(root, timestamps = false) {
  const out = {}
  if (!existsSync(root)) return out
  function walk(path) {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) return
    if (stat.isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name))
    else out[relative(root, path) || '.'] = {
      sha256: sha(readFileSync(path)), bytes: stat.size,
      ...(timestamps ? { mtimeMs: stat.mtimeMs } : {}),
    }
  }
  walk(root)
  return out
}
const watch = [
  join(pkg, 'lib'), join(pkg, 'node_modules/.vite'), join(pkg, 'node_modules/.cache'),
  join(deps, '.vite'), join(deps, '.cache'),
]
const guard = () => Object.fromEntries(watch.map(path => [path, inventory(path, true)]))
const contracts = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/requirements.md', 'docs/decision-log.md',
  'docs/plans/2026-10-21-success-envelope-import-preflight-closure.md',
  'docs/testing/a9-existing-entries-independent-retest-20261021.md',
  'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2.json',
  'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json',
]
if (mode === 'freeze' || mode === 'green-freeze') {
  if (existsSync(frozen)) throw new Error('禁止覆盖已有冻结')
  const before = guard()
  const source = inventory(join(pkg, 'src'))
  cpSync(pkg, runRoot, { recursive: true, filter: path => !relative(pkg, path).split('/').some(part =>
    ['node_modules', 'lib', '.git', '.vite', '.cache', 'data', 'coverage', '.tmp', '.verify-tmp'].includes(part)) })
  for (const path of contracts) {
    mkdirSync(join(frozen, path, '..'), { recursive: true })
    cpSync(join(repo, path), join(frozen, path))
  }
  const probe = join(repo, 'docs/testing/a9-existing-entries-independent-retest-20261021-selftmp/frozen/packages/dsh-pm-tool/a9-independent.test.tsx')
  cpSync(probe, join(runRoot, 'a9-independent.test.tsx'))
  symlinkSync(deps, join(runRoot, 'node_modules'), 'dir')
  const copied = inventory(join(runRoot, 'src'))
  if (JSON.stringify(copied) !== JSON.stringify(source)) throw new Error('复制源不一致')
  const diff = spawnSync('git', ['diff', '--binary', '--', 'packages/dsh-pm-tool'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const added = spawnSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool/src'], { encoding: 'utf8' })
  writeFileSync(join(self, phase, 'tracked.patch'), diff.stdout)
  writeFileSync(join(self, phase, 'new-files.json'), JSON.stringify(added.stdout.trim().split('\n').filter(Boolean)
    .map(path => ({ path, sha256: sha(readFileSync(join(repo, path))) })), null, 2))
  const after = guard()
  const manifest = {
    role: 'developer-A9-F02', at: new Date().toISOString(), repo, runRoot, deps, node: process.version,
    head: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
    source, sourceHash: sha(JSON.stringify(source)), copiedSourceHash: sha(JSON.stringify(copied)),
    probeHash: sha(readFileSync(probe)), contracts: contracts.map(path => ({ path, sha256: sha(readFileSync(join(frozen, path))) })),
    trackedDiffHash: sha(diff.stdout), newFilesHash: sha(readFileSync(join(self, phase, 'new-files.json'))),
    dependencies: ['react', 'react-test-renderer', 'vitest', 'xlsx', 'typescript'].map(name => ({
      name, version: JSON.parse(readFileSync(join(deps, name, 'package.json'))).version,
      sha256: sha(readFileSync(join(deps, name, 'package.json'))),
    })),
    guardBefore: before, guardAfter: after, watchedUnchanged: JSON.stringify(before) === JSON.stringify(after),
  }
  writeFileSync(join(self, phase, 'freeze.json'), JSON.stringify(manifest, null, 2))
  console.log(JSON.stringify({ phase, runRoot, sourceHash: manifest.sourceHash, srcFiles: Object.keys(source).length,
    probeHash: manifest.probeHash, watchedUnchanged: manifest.watchedUnchanged }))
  process.exit(manifest.watchedUnchanged ? 0 : 2)
}
const round = join(self, mode)
if (existsSync(round)) throw new Error('禁止覆盖原日志')
mkdirSync(join(round, 'runtime'), { recursive: true })
const includes = mode.includes('original') ? ['a9-independent.test.tsx']
  : mode.includes('regression') ? [
    'src/core/csv-import.test.ts', 'src/client/views/tasks-import-confirm.test.tsx',
    'src/core/task-inline.test.ts', 'src/core/task-ops.test.ts', 'src/core/task-materials.test.ts',
    'src/core/task-views.test.ts', 'src/core/task-evidence-protocol.test.ts',
    'src/core/progress-*.test.ts', 'src/core/derived.test.ts', 'src/commands/task-feedback.test.ts',
    'src/client/views/tasks-*.test.ts', 'src/client/views/tasks-number-feedback.test.tsx',
    'src/client/views/objective-consumers.test.tsx',
  ] : ['src/core/csv-import.test.ts']
const config = join(round, 'vitest.config.mjs')
writeFileSync(config, `import { defineConfig } from ${JSON.stringify(join(deps, 'vitest/dist/config.js'))}
export default defineConfig({
root: ${JSON.stringify(runRoot)}, cacheDir: ${JSON.stringify(join(round, 'private-vite-cache'))},
test: { environment: 'node', cache: false, include: ${JSON.stringify(includes)},
pool: 'forks', poolOptions: { forks: { singleFork: true } },
reporters: ['verbose', 'json'], outputFile: ${JSON.stringify(join(round, 'vitest.json'))} }
})`)
const freeze = JSON.parse(readFileSync(join(self, phase, 'freeze.json')))
const verify = mode.includes('verify-') ? mode.slice(mode.indexOf('verify-')) : null
const loader = join(repo, 'reports', `${prefix}-source-loader.mjs`)
const args = mode.includes('noemit')
  ? [join(deps, 'typescript/bin/tsc'), '--noEmit', '--incremental', 'false', '-p', join(runRoot, 'tsconfig.json')]
  : verify ? ['--loader', loader, join(runRoot, 'scripts', `${verify}.mjs`)]
    : [join(deps, 'vitest/vitest.mjs'), 'run', '--config', config, '--no-cache', ...process.argv.slice(3)]
const before = guard()
const started = new Date().toISOString()
const result = spawnSync(process.execPath, args, {
  cwd: runRoot, encoding: 'utf8', timeout: 240000, maxBuffer: 32 * 1024 * 1024,
  env: { ...process.env, TMPDIR: join(round, 'runtime'), XDG_CACHE_HOME: join(round, 'private-cache'),
    NODE_COMPILE_CACHE: join(round, 'private-node-cache'), DSH_HOME: join(round, 'runtime/dsh-home'),
    A10_SOURCE_ROOT: runRoot, ...(verify ? { NODE_OPTIONS: `--loader ${loader}` } : {}),
    DSH_PM_ISOLATED_ROOT: join(round, 'runtime'), DSH_PM_FILE_ROOT: join(round, 'runtime/files'),
    QA_OBSERVATIONS: join(round, 'observations.jsonl'), A9_IMPORT_OBSERVATIONS: join(round, 'author-import-observations.jsonl') },
})
writeFileSync(join(round, 'stdout.txt'), result.stdout ?? '')
writeFileSync(join(round, 'stderr.txt'), result.stderr ?? '')
const after = guard()
const frozenSource = inventory(join(runRoot, 'src'))
const execution = {
  mode, phase, started, ended: new Date().toISOString(), argv: [process.execPath, ...args], cwd: runRoot,
  exit: result.status, signal: result.signal, error: result.error?.message,
  sourceHash: freeze.sourceHash, sourceAfterHash: sha(JSON.stringify(frozenSource)),
  frozenUnchanged: JSON.stringify(frozenSource) === JSON.stringify(freeze.source),
  testHash: sha(readFileSync(join(runRoot, 'src/core/csv-import.test.ts'))),
  probeHash: sha(readFileSync(join(runRoot, 'a9-independent.test.tsx'))),
  ...(verify ? { scriptHash: sha(readFileSync(join(runRoot, 'scripts', `${verify}.mjs`))),
    loaderHash: sha(readFileSync(loader)), sourceOnly: true } : {}),
  guardBefore: before, guardAfter: after, watchedUnchanged: JSON.stringify(before) === JSON.stringify(after),
}
writeFileSync(join(round, 'execution.json'), JSON.stringify(execution, null, 2))
console.log(JSON.stringify(execution, (key, value) => key.startsWith('guard') ? undefined : value))
console.log(result.stdout ?? '')
console.log(result.stderr ?? '')
process.exitCode = result.status ?? 1

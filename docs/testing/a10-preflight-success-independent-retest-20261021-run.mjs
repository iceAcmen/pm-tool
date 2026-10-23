import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'

const repo = process.cwd()
const prefix = 'a10-preflight-success-independent-retest-20261021'
const self = join(repo, 'docs/testing', `${prefix}-selftmp`)
const frozen = join(self, 'frozen')
const pkg = join(repo, 'packages/dsh-pm-tool')
const runRoot = join(frozen, 'packages/dsh-pm-tool')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const mode = process.argv[2]
const sha = data => createHash('sha256').update(data).digest('hex')
function inventory(root, timestamps = false) {
  const files = {}
  if (!existsSync(root)) return { exists: false, files }
  function visit(path) {
    const st = lstatSync(path)
    if (st.isSymbolicLink()) return
    if (st.isDirectory()) for (const name of readdirSync(path).sort()) visit(join(path, name))
    else files[relative(root, path) || '.'] = {
      sha256: sha(readFileSync(path)), size: st.size, ...(timestamps ? { mtimeMs: st.mtimeMs } : {}),
    }
  }
  visit(root)
  return { exists: true, files }
}
const drift = (a, b) => [...new Set([...Object.keys(a.files), ...Object.keys(b.files)])]
  .filter(path => a.files[path]?.sha256 !== b.files[path]?.sha256)
const watch = [join(pkg, 'lib'), ...[pkg + '/node_modules', deps].flatMap(root =>
  ['.vite', '.cache', '.vite-temp'].map(name => join(root, name)))]
const guard = () => Object.fromEntries(watch.map(path => [path, inventory(path, true)]))
const contracts = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/requirements.md', 'docs/decision-log.md',
  'docs/plans/2026-10-21-success-envelope-import-preflight-closure.md',
  'docs/testing/a9-existing-entries-independent-retest-20261021.md',
  'reports/a10-import-preflight-developer-20261021.md',
  'docs/testing/a8-layer-gap-contract-review-20261021-probes.test.tsx',
  'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2.json',
  'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json',
]
const originalProbe = join(repo, 'docs/testing/a9-existing-entries-independent-retest-20261021-selftmp/frozen/packages/dsh-pm-tool/a9-independent.test.tsx')
if (mode === 'freeze') {
  if (existsSync(frozen)) throw new Error('Do not overwrite an existing freeze')
  const before = guard()
  const source = inventory(join(pkg, 'src'))
  cpSync(pkg, runRoot, { recursive: true, filter: path => !relative(pkg, path).split('/').some(part =>
    ['node_modules', 'lib', '.git', '.vite', '.cache', 'data', 'coverage', '.tmp', '.verify-tmp'].includes(part)) })
  for (const path of contracts) {
    mkdirSync(join(frozen, path, '..'), { recursive: true })
    cpSync(join(repo, path), join(frozen, path))
  }
  symlinkSync(deps, join(runRoot, 'node_modules'), 'dir')
  cpSync(originalProbe, join(runRoot, 'a9-original.test.tsx'))
  cpSync(originalProbe, join(runRoot, 'a10-adapted.test.tsx'))
  const diff = spawnSync('git', ['diff', '--binary'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const added = spawnSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool'], { encoding: 'utf8' })
  if (diff.status !== 0 || added.status !== 0) throw new Error('Git identity capture failed')
  writeFileSync(join(self, 'tracked.patch'), diff.stdout)
  writeFileSync(join(self, 'new-files.json'), JSON.stringify(added.stdout.trim().split('\n').filter(Boolean)
    .map(path => ({ path, sha256: sha(readFileSync(join(repo, path))) })), null, 2))
  const copied = inventory(join(runRoot, 'src'))
  if (JSON.stringify(source) !== JSON.stringify(copied)) throw new Error('Source copy drift')
  const after = guard()
  const manifest = {
    role: 'independent-test-expert-A10', at: new Date().toISOString(), repo, self, runRoot, deps,
    head: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
    node: process.version, pnpm: spawnSync('pnpm', ['--version'], { encoding: 'utf8' }).stdout.trim(),
    source, sourceTreeSha256: sha(JSON.stringify(source)), packageFiles: inventory(runRoot),
    trackedPatchSha256: sha(diff.stdout), newFilesSha256: sha(readFileSync(join(self, 'new-files.json'))),
    originalProbeSha256: sha(readFileSync(originalProbe)),
    contracts: contracts.map(path => ({ path, sha256: sha(readFileSync(join(frozen, path))) })),
    dependencies: ['react', 'react-test-renderer', 'vitest', 'xlsx', 'typescript'].map(name => ({
      name, version: JSON.parse(readFileSync(join(deps, name, 'package.json'))).version,
      sha256: sha(readFileSync(join(deps, name, 'package.json'))),
    })),
    guardBefore: before, guardAfter: after, watchedUnchanged: JSON.stringify(before) === JSON.stringify(after),
  }
  writeFileSync(join(self, 'freeze.json'), JSON.stringify(manifest, null, 2))
  console.log(JSON.stringify({ runRoot, sourceTreeSha256: manifest.sourceTreeSha256,
    srcFiles: Object.keys(source.files).length, watchedUnchanged: manifest.watchedUnchanged }))
  process.exit(manifest.watchedUnchanged ? 0 : 2)
}
const freeze = JSON.parse(readFileSync(join(self, 'freeze.json')))
const evidence = join(self, mode)
if (existsSync(evidence)) throw new Error('Do not overwrite execution evidence')
mkdirSync(join(evidence, 'runtime'), { recursive: true })
for (const name of ['a9-original.test.tsx', 'a10-adapted.test.tsx', 'a10-extra.test.ts']) {
  if (existsSync(join(runRoot, name))) cpSync(join(runRoot, name), join(evidence, name))
}
const includes = mode.startsWith('original') ? ['a9-original.test.tsx']
  : mode.startsWith('independent') ? ['a10-adapted.test.tsx', 'a10-extra.test.ts']
  : [
    'src/core/csv-import.test.ts', 'src/client/views/records/records-meeting-entry.test.tsx',
    'src/client/views/tasks-import-confirm.test.tsx', 'src/client/panel-checklist-toggle.test.tsx',
    'src/client/panel-launch-handshake.test.tsx', 'src/client/panel-restore-path.test.ts',
    'src/client/shared/records-callbacks.test.ts', 'src/client/views/records/records-payloads.test.ts',
    'src/client/views/records/records-options.test.ts', 'src/client/views/records-entry-guard.test.ts',
    'src/client/form-validation.test.ts', 'src/client/shared/form-dirty.test.ts',
    'src/client/views/tasks-*.test.ts', 'src/client/views/tasks-number-feedback.test.tsx',
    'src/client/views/objective-consumers.test.tsx', 'src/client/views/d04-d05-d11-contract.test.ts',
    'src/client/views/visible-layer-contract.test.ts', 'src/client/views/non-p0-fixes.test.ts',
    'src/core/task-inline.test.ts', 'src/core/task-ops.test.ts', 'src/core/task-views.test.ts',
    'src/core/task-materials.test.ts', 'src/core/progress-*.test.ts', 'src/core/derived.test.ts',
    'src/core/ui-feedback.test.ts', 'src/commands/task-feedback.test.ts', 'src/core/task-evidence-protocol.test.ts',
  ]
const config = join(evidence, 'vitest.config.mjs')
writeFileSync(config, `import { defineConfig } from ${JSON.stringify(join(deps, 'vitest/dist/config.js'))}
export default defineConfig({
root: ${JSON.stringify(runRoot)}, cacheDir: ${JSON.stringify(join(evidence, 'private-vite-cache'))},
test: { environment: 'node', cache: false, include: ${JSON.stringify(includes)},
pool: 'forks', poolOptions: { forks: { singleFork: true } },
reporters: ['verbose', 'json'], outputFile: ${JSON.stringify(join(evidence, 'vitest.json'))} }
})`)
const verify = mode.startsWith('verify-') ? mode : null
const loader = join(self, 'source-loader.mjs')
const args = mode.startsWith('noemit')
  ? [join(deps, 'typescript/bin/tsc'), '--noEmit', '--incremental', 'false', '-p', join(runRoot, 'tsconfig.json')]
  : verify ? ['--loader', loader, join(runRoot, 'scripts', `${verify}.mjs`)]
    : [join(deps, 'vitest/vitest.mjs'), 'run', '--config', config, '--no-cache', ...process.argv.slice(3)]
const before = guard()
const started = new Date().toISOString()
const result = spawnSync(process.execPath, args, {
  cwd: runRoot, encoding: 'utf8', timeout: 240000, maxBuffer: 32 * 1024 * 1024,
  env: { ...process.env, TMPDIR: join(evidence, 'runtime'), XDG_CACHE_HOME: join(evidence, 'private-cache'),
    NODE_COMPILE_CACHE: join(evidence, 'private-node-cache'), DSH_HOME: join(evidence, 'runtime/dsh-home'),
    A10_SOURCE_ROOT: runRoot, ...(verify ? { NODE_OPTIONS: `--loader ${loader}` } : {}),
    DSH_PM_ISOLATED_ROOT: join(evidence, 'runtime'), DSH_PM_FILE_ROOT: join(evidence, 'runtime/files'),
    QA_OBSERVATIONS: join(evidence, 'observations.jsonl'), A9_IMPORT_OBSERVATIONS: join(evidence, 'author-import-observations.jsonl') },
})
writeFileSync(join(evidence, 'stdout.txt'), result.stdout ?? '')
writeFileSync(join(evidence, 'stderr.txt'), result.stderr ?? '')
const after = guard()
const execution = {
  mode, started, ended: new Date().toISOString(), argv: [process.execPath, ...args], cwd: runRoot,
  originalExit: result.status, signal: result.signal, error: result.error?.message,
  sourceTreeSha256: freeze.sourceTreeSha256, freezeSha256: sha(readFileSync(join(self, 'freeze.json'))),
  frozenSourceDrift: drift(freeze.source, inventory(join(runRoot, 'src'))),
  mainSourceDrift: drift(freeze.source, inventory(join(pkg, 'src'))),
  includes, probeHashes: Object.fromEntries(['a9-original.test.tsx', 'a10-adapted.test.tsx', 'a10-extra.test.ts']
    .filter(name => existsSync(join(runRoot, name))).map(name => [name, sha(readFileSync(join(runRoot, name)))])),
  originalProbeUnchanged: freeze.originalProbeSha256 === sha(readFileSync(originalProbe)),
  ...(verify ? { scriptHash: sha(readFileSync(join(runRoot, 'scripts', `${verify}.mjs`))),
    loaderHash: sha(readFileSync(loader)), sourceOnly: true } : {}),
  guardBefore: before, guardAfter: after, watchedUnchanged: JSON.stringify(before) === JSON.stringify(after),
}
writeFileSync(join(evidence, 'execution.json'), JSON.stringify(execution, null, 2))
console.log(JSON.stringify(execution, (key, value) => key.startsWith('guard') ? undefined : value))
console.log(result.stdout ?? '')
console.log(result.stderr ?? '')
process.exitCode = result.status ?? 1

import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'

const repo = process.cwd()
const prefix = 'a9-existing-entries-independent-retest-20261021'
const self = join(repo, 'docs/testing', `${prefix}-selftmp`)
const frozen = join(self, 'frozen')
const pkg = join(repo, 'packages/dsh-pm-tool')
const runRoot = join(frozen, 'packages/dsh-pm-tool')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const round = process.argv[2] ?? 'freeze'
const sha = data => createHash('sha256').update(data).digest('hex')
function inventory(root, mtime = false) {
  if (!existsSync(root)) return { exists: false, files: {} }
  if (lstatSync(root).isFile()) return { exists: true, files: {
    '.': { sha256: sha(readFileSync(root)), size: lstatSync(root).size } } }
  const files = {}
  function visit(dir) {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name)
      const st = lstatSync(path)
      if (st.isSymbolicLink()) continue
      if (st.isDirectory()) visit(path)
      else files[relative(root, path)] = { sha256: sha(readFileSync(path)), size: st.size,
        ...(mtime ? { mtimeMs: st.mtimeMs } : {}) }
    }
  }
  visit(root)
  return { exists: true, files }
}
const watch = [join(pkg, 'lib'), join(pkg, 'node_modules/.vite'), join(pkg, 'node_modules/.cache'),
  join(deps, '.vite'), join(deps, '.cache')]
const guard = () => Object.fromEntries(watch.map(path => [path, inventory(path, true)]))
const contracts = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/decision-log.md', 'docs/requirements.md', 'docs/test-cases.md',
  'docs/testing/a8-layer-gap-contract-review-20261021.md',
  'docs/testing/a8-layer-gap-contract-review-20261021-probes.test.tsx',
  'docs/testing/remaining-journey-cases-20261021.md',
  'docs/testing/objective-progress-acceptance.md',
  'docs/plans/2026-10-21-existing-entry-gaps-closure.md',
  'reports/a9-meeting-entry-developer-20261021.md',
  'reports/a9-import-confirm-developer-20261021.md',
  'reports/all-pending-evidence-20261021/A9/checklist',
  'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2.json',
  'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json',
]
if (round === 'freeze') {
  if (existsSync(frozen)) throw new Error('Do not overwrite an existing freeze')
  mkdirSync(runRoot, { recursive: true })
  const before = guard()
  const source = inventory(join(pkg, 'src'))
  cpSync(pkg, runRoot, { recursive: true, filter: path => !relative(pkg, path).split('/').some(
    part => ['node_modules', 'lib', '.git', '.vite', '.cache', 'data', 'coverage', '.tmp'].includes(part)) })
  for (const path of contracts) {
    mkdirSync(join(frozen, path, '..'), { recursive: true })
    cpSync(join(repo, path), join(frozen, path), { recursive: true })
  }
  symlinkSync(deps, join(runRoot, 'node_modules'), 'dir')
  const original = readFileSync(join(repo, 'docs/testing/a8-layer-gap-contract-review-20261021-probes.test.tsx'), 'utf8')
  writeFileSync(join(runRoot, 'a8-probes.test.tsx'), original)
  const tracked = spawnSync('git', ['diff', '--binary', '--', 'packages/dsh-pm-tool'], {
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const added = spawnSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool'], { encoding: 'utf8' })
  writeFileSync(join(self, 'tracked.patch'), tracked.stdout)
  writeFileSync(join(self, 'new-files.json'), JSON.stringify(added.stdout.trim().split('\n').filter(Boolean)
    .map(path => ({ path, sha256: sha(readFileSync(join(repo, path))) })), null, 2))
  const copied = inventory(join(runRoot, 'src'))
  if (JSON.stringify(source) !== JSON.stringify(copied)) throw new Error('Source copy drift')
  const after = guard()
  const manifest = {
    frozenAt: new Date().toISOString(), role: 'independent-test-expert', repo, self, frozen, runRoot, deps,
    head: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
    node: process.version, pnpm: spawnSync('pnpm', ['--version'], { encoding: 'utf8' }).stdout.trim(),
    dependencies: ['react', 'react-test-renderer', 'vitest', 'xlsx', 'typescript'].map(name => ({
      name, version: JSON.parse(readFileSync(join(deps, name, 'package.json'))).version,
      sha256: sha(readFileSync(join(deps, name, 'package.json'))) })),
    source, sourceTreeSha256: sha(JSON.stringify(source)), trackedPatchSha256: sha(tracked.stdout),
    newFilesSha256: sha(readFileSync(join(self, 'new-files.json'))),
    originalProbeSha256: sha(original), contracts: contracts.map(path => ({ path, inventory: inventory(join(frozen, path)) })),
    guardBefore: before, guardAfter: after, watchedUnchanged: JSON.stringify(before) === JSON.stringify(after),
  }
  writeFileSync(join(self, 'freeze.json'), JSON.stringify(manifest, null, 2))
  console.log(JSON.stringify({ frozen, sourceTreeSha256: manifest.sourceTreeSha256,
    srcFiles: Object.keys(source.files).length, watchedUnchanged: manifest.watchedUnchanged }))
  process.exit(manifest.watchedUnchanged ? 0 : 2)
}
const freeze = JSON.parse(readFileSync(join(self, 'freeze.json')))
const evidence = join(self, round)
if (existsSync(evidence)) throw new Error('Do not overwrite execution evidence')
mkdirSync(join(evidence, 'runtime'), { recursive: true })
cpSync(join(runRoot, 'a8-probes.test.tsx'), join(evidence, 'original-probe-copy.test.tsx'))
if (existsSync(join(runRoot, 'a9-independent.test.tsx'))) {
  cpSync(join(runRoot, 'a9-independent.test.tsx'), join(evidence, 'probe.test.tsx'))
}
const before = guard()
const originalHash = sha(readFileSync(join(repo, 'docs/testing/a8-layer-gap-contract-review-20261021-probes.test.tsx')))
const includes = round.startsWith('original') ? ['a8-probes.test.tsx']
  : round.startsWith('independent') ? ['a9-independent.test.tsx']
  : [
    'src/client/views/records/records-meeting-entry.test.tsx',
    'src/client/views/tasks-import-confirm.test.tsx', 'src/client/panel-checklist-toggle.test.tsx',
    'src/client/panel-launch-handshake.test.tsx', 'src/client/panel-restore-path.test.ts',
    'src/client/shared/records-callbacks.test.ts', 'src/client/views/records/records-payloads.test.ts',
    'src/client/views/records/records-options.test.ts', 'src/client/views/records-entry-guard.test.ts',
    'src/client/form-validation.test.ts', 'src/client/shared/form-dirty.test.ts',
    'src/client/views/tasks-number-feedback.test.tsx', 'src/client/views/objective-consumers.test.tsx',
    'src/client/views/tasks-*.test.ts', 'src/client/views/d04-d05-d11-contract.test.ts',
    'src/client/views/visible-layer-contract.test.ts', 'src/client/views/non-p0-fixes.test.ts',
    'src/core/task-inline.test.ts', 'src/core/task-ops.test.ts', 'src/core/task-views.test.ts',
    'src/core/progress-*.test.ts', 'src/core/derived.test.ts', 'src/core/ui-feedback.test.ts',
    'src/commands/task-feedback.test.ts', 'src/core/task-evidence-protocol.test.ts',
  ]
const config = join(evidence, 'vitest.config.mjs')
writeFileSync(config, `import { defineConfig } from ${JSON.stringify(join(deps, 'vitest/dist/config.js'))}
export default defineConfig({
 root: ${JSON.stringify(runRoot)}, cacheDir: ${JSON.stringify(join(evidence, 'vite-cache'))},
 test: { environment: 'node', cache: false, include: ${JSON.stringify(includes)},
 pool: 'forks', poolOptions: { forks: { singleFork: true } },
 reporters: ['verbose', 'json'], outputFile: ${JSON.stringify(join(evidence, 'vitest.json'))} }
})`)
const args = round.startsWith('typecheck')
  ? [join(deps, 'typescript/bin/tsc'), '--noEmit', '--incremental', 'false', '-p', join(runRoot, 'tsconfig.json')]
  : [join(deps, 'vitest/vitest.mjs'), 'run', '--config', config, '--no-cache', ...process.argv.slice(3)]
const started = new Date().toISOString()
const result = spawnSync(process.execPath, args, {
  cwd: runRoot, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024,
  env: { ...process.env, TMPDIR: join(evidence, 'runtime'), XDG_CACHE_HOME: join(evidence, 'private-cache'),
    DSH_PM_ISOLATED_ROOT: join(evidence, 'runtime'), DSH_PM_FILE_ROOT: join(evidence, 'runtime/files'),
    DSH_HOME: join(evidence, 'runtime/dsh-home'),
    NODE_COMPILE_CACHE: join(evidence, 'node-cache'), QA_OBSERVATIONS: join(evidence, 'observations.jsonl'),
    A9_IMPORT_OBSERVATIONS: join(evidence, 'author-import-observations.jsonl') },
})
writeFileSync(join(evidence, 'stdout.txt'), result.stdout ?? '')
writeFileSync(join(evidence, 'stderr.txt'), result.stderr ?? '')
const after = guard()
const frozenAfter = inventory(join(runRoot, 'src'))
const current = inventory(join(pkg, 'src'))
const drift = (a, b) => [...new Set([...Object.keys(a.files), ...Object.keys(b.files)])]
  .filter(path => a.files[path]?.sha256 !== b.files[path]?.sha256)
const manifest = { round, started, ended: new Date().toISOString(), command: [process.execPath, ...args],
  cwd: runRoot, originalExit: result.status, signal: result.signal, error: result.error?.message,
  sourceTreeSha256: freeze.sourceTreeSha256, freezeSha256: sha(readFileSync(join(self, 'freeze.json'))),
  frozenSourceDrift: drift(freeze.source, frozenAfter), mainSourceDrift: drift(freeze.source, current),
  independentProbeSha256: existsSync(join(runRoot, 'a9-independent.test.tsx'))
    ? sha(readFileSync(join(runRoot, 'a9-independent.test.tsx'))) : null,
  copiedOriginalProbeSha256: sha(readFileSync(join(runRoot, 'a8-probes.test.tsx'))),
  originalProbeUnchanged: originalHash === freeze.originalProbeSha256,
  guardBefore: before, guardAfter: after, watchedUnchanged: JSON.stringify(before) === JSON.stringify(after) }
writeFileSync(join(evidence, 'execution.json'), JSON.stringify(manifest, null, 2))
console.log(JSON.stringify(manifest, (key, value) => key.startsWith('guard') ? undefined : value))
console.log(result.stdout ?? '')
console.log(result.stderr ?? '')
process.exitCode = result.status ?? 1

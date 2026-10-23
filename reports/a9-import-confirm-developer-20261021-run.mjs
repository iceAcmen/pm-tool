import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'

const repo = process.cwd()
const pkg = join(repo, 'packages/dsh-pm-tool')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const round = process.argv[2] ?? 'red'
const mode = process.argv[3] ?? 'target'
const prefix = join(repo, 'reports/a9-import-confirm-developer-20261021')
const tmp = mkdtempSync('/private/tmp/pmtool-a9-import-')
const runRoot = join(tmp, 'packages/dsh-pm-tool')
mkdirSync(runRoot, { recursive: true })
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
function inventory(root) {
  if (!existsSync(root)) return { exists: false, files: {} }
  const files = {}
  function visit(dir) {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name)
      const st = lstatSync(path)
      if (st.isSymbolicLink()) continue
      if (st.isDirectory()) visit(path)
      else files[relative(root, path)] = { sha256: hash(readFileSync(path)), size: st.size, mtimeMs: st.mtimeMs }
    }
  }
  visit(root)
  return { exists: true, files }
}
const watched = [join(pkg, 'lib'), join(pkg, 'node_modules/.vite'), join(pkg, 'node_modules/.cache'),
  join(deps, '.vite'), join(deps, '.cache')]
const guard = () => Object.fromEntries(watched.map(path => [path, inventory(path)]))
const before = guard()
const source = inventory(join(pkg, 'src'))
cpSync(join(pkg, 'src'), join(runRoot, 'src'), { recursive: true })
cpSync(join(pkg, 'tsconfig.json'), join(runRoot, 'tsconfig.json'))
symlinkSync(deps, join(runRoot, 'node_modules'), 'dir')
writeFileSync(join(runRoot, 'package.json'), JSON.stringify({ type: 'module' }))
const fixture = 'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2.json'
mkdirSync(join(tmp, fixture, '..'), { recursive: true })
cpSync(join(repo, fixture), join(tmp, fixture))
cpSync(join(repo, fixture.replace('f2.json', 'f2-backup.json')), join(tmp, fixture.replace('f2.json', 'f2-backup.json')))
mkdirSync(join(tmp, 'runtime'))
const target = 'src/client/views/tasks-import-confirm.test.tsx'
const regression = [
  target, 'src/client/views/tasks-number-feedback.test.tsx', 'src/client/views/objective-consumers.test.tsx',
  'src/client/views/tasks-*.test.ts', 'src/client/views/d04-d05-d11-contract.test.ts',
  'src/client/views/visible-layer-contract.test.ts', 'src/client/views/non-p0-fixes.test.ts',
  'src/core/task-inline.test.ts', 'src/core/task-ops.test.ts', 'src/core/task-views.test.ts',
  'src/core/progress-*.test.ts', 'src/core/derived.test.ts', 'src/core/ui-feedback.test.ts',
  'src/commands/task-feedback.test.ts', 'src/core/task-evidence-protocol.test.ts',
]
writeFileSync(join(runRoot, 'vitest.config.mjs'), `
import { defineConfig } from 'vitest/config'
export default defineConfig({
  cacheDir: ${JSON.stringify(join(tmp, 'vite-cache'))},
  test: { environment: 'node', cache: false,
    include: ${JSON.stringify(mode === 'regression' ? regression : [target])},
    pool: 'forks', poolOptions: { forks: { singleFork: true } },
    reporters: ['verbose', 'json'], outputFile: 'vitest.json' }
})
`)
const patch = spawnSync('git', ['diff', '--', 'packages/dsh-pm-tool/src/client/views/tasks.tsx'],
  { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).stdout
writeFileSync(`${prefix}-${round}-tracked.patch`, patch)
const started = new Date().toISOString()
const args = mode === 'typecheck'
  ? [join(deps, 'typescript/bin/tsc'), '--noEmit', '--incremental', 'false', '-p', join(runRoot, 'tsconfig.json')]
  : [join(deps, 'vitest/vitest.mjs'), 'run', '--config', join(runRoot, 'vitest.config.mjs'), '--no-cache']
const result = spawnSync(process.execPath, args, {
  cwd: runRoot, encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024,
  env: { ...process.env, TMPDIR: join(tmp, 'runtime'), A9_IMPORT_OBSERVATIONS: join(tmp, 'observations.jsonl') },
})
const after = guard()
const latest = inventory(join(pkg, 'src'))
const manifest = {
  role: 'developer', round, mode, tmp, runRoot, deps, started, ended: new Date().toISOString(),
  head: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
  node: process.version, pnpm: spawnSync('pnpm', ['--version'], { encoding: 'utf8' }).stdout.trim(),
  dependencies: ['react', 'react-test-renderer', 'vitest'].map(name => ({
    name, version: JSON.parse(readFileSync(join(deps, name, 'package.json'))).version,
    sha256: hash(readFileSync(join(deps, name, 'package.json'))),
  })),
  command: [process.execPath, ...args], exit: result.status, signal: result.signal, error: result.error?.message,
  source, sourceDrift: Object.keys(source.files).filter(path => source.files[path].sha256 !== latest.files[path]?.sha256),
  trackedPatchSha256: hash(patch), guardBefore: before, guardAfter: after,
  fixture: { path: fixture, sha256: hash(readFileSync(join(tmp, fixture))) },
  watchedUnchanged: JSON.stringify(before) === JSON.stringify(after),
  contracts: ['AGENTS.md', 'docs/collaboration.md',
    'docs/testing/a8-layer-gap-contract-review-20261021.md',
    'docs/testing/a8-layer-gap-contract-review-20261021-probes.test.tsx',
    'docs/plans/2026-10-21-existing-entry-gaps-closure.md'].map(path => ({
      path, sha256: hash(readFileSync(join(repo, path))),
    })),
}
writeFileSync(`${prefix}-${round}-execution.json`, JSON.stringify(manifest, null, 2) + '\n')
writeFileSync(`${prefix}-${round}-stdout.txt`, result.stdout ?? '')
writeFileSync(`${prefix}-${round}-stderr.txt`, result.stderr ?? '')
if (existsSync(join(runRoot, 'vitest.json'))) cpSync(join(runRoot, 'vitest.json'), `${prefix}-${round}-vitest.json`)
if (existsSync(join(tmp, 'observations.jsonl'))) cpSync(join(tmp, 'observations.jsonl'), `${prefix}-${round}-observations.jsonl`)
const baseline = `${prefix}-red-execution.json`
if (round !== 'red' && existsSync(baseline)) {
  const original = JSON.parse(readFileSync(baseline)).tmp
  const delta = spawnSync('git', ['diff', '--no-index', '--',
    join(original, 'src/client/views/tasks.tsx'), join(runRoot, 'src/client/views/tasks.tsx')],
  { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).stdout
  writeFileSync(`${prefix}-${round}-developer.patch`, delta)
}
console.log(JSON.stringify({ tmp, command: manifest.command, exit: result.status,
  sourceDrift: manifest.sourceDrift, watchedUnchanged: manifest.watchedUnchanged }))
console.log(result.stdout ?? '')
console.log(result.stderr ?? '')
process.exitCode = result.status ?? 1

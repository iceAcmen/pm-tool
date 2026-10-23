import { cpSync, existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'

const repo = process.cwd()
const pkg = join(repo, 'packages/dsh-pm-tool')
const prefix = join(repo, 'reports/a9-meeting-entry-developer-20261021')
const round = process.argv[2]
if (!round || !/^[a-z0-9-]+$/.test(round)) throw new Error('round required')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const tmp = mkdtempSync('/private/tmp/pmtool-a9-meeting-')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
function files(root, times = false) {
  const result = {}
  if (!existsSync(root)) return result
  function visit(dir) {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name)
      const stat = lstatSync(path)
      if (stat.isSymbolicLink()) continue
      if (stat.isDirectory()) visit(path)
      else result[relative(root, path)] = { sha256: hash(readFileSync(path)), size: stat.size,
        ...(times ? { mtimeMs: stat.mtimeMs } : {}) }
    }
  }
  visit(root)
  return result
}
const watch = [join(pkg, 'lib'), join(pkg, 'node_modules/.vite'), join(pkg, 'node_modules/.cache'),
  join(deps, '.vite'), join(deps, '.cache')]
const guard = () => Object.fromEntries(watch.map(path => [path, files(path, true)]))
const before = guard()
const source = files(join(pkg, 'src'))
cpSync(join(pkg, 'src'), join(tmp, 'src'), { recursive: true })
cpSync(join(pkg, 'tsconfig.json'), join(tmp, 'tsconfig.json'))
symlinkSync(deps, join(tmp, 'node_modules'), 'dir')
const originalProbe = 'docs/testing/a8-layer-gap-contract-review-20261021-probes.test.tsx'
cpSync(join(repo, originalProbe), join(tmp, 'probes.test.tsx'))
writeFileSync(join(tmp, 'package.json'), JSON.stringify({ type: 'module' }))
writeFileSync(join(tmp, 'vitest.config.mjs'), [
  "import { defineConfig } from 'vitest/config'",
  'export default defineConfig({',
  `cacheDir: ${JSON.stringify(join(tmp, 'vite-cache'))},`,
  'test: { environment: "node", cache: false, pool: "forks", poolOptions: { forks: { singleFork: true } },',
  'reporters: ["verbose", "json"], outputFile: "vitest.json" }',
  '})',
].join('\n'))
if (JSON.stringify(source) !== JSON.stringify(files(join(tmp, 'src')))) throw new Error('source copy drift')
const owned = ['src/client/views/records/records-meeting-form.tsx', 'src/client/views/meetings.tsx',
  'src/client/shared/records-props.ts', 'src/client/views/records/records-meeting-entry.test.tsx']
const head = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()
const patch = spawnSync('git', ['diff', '--', ...owned.map(path => `packages/dsh-pm-tool/${path}`)],
  { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).stdout
writeFileSync(`${prefix}-${round}-tracked.patch`, patch)
if (existsSync(join(tmp, owned[3]))) {
  cpSync(join(tmp, owned[3]), `${prefix}-${round}-new-test.tsx`)
  const addedPatch = spawnSync('git', ['diff', '--no-index', '--', '/dev/null', `packages/dsh-pm-tool/${owned[3]}`],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).stdout
  writeFileSync(`${prefix}-${round}-new-test.patch`, addedPatch)
}
const regression = ['src/client/shared/records-callbacks.test.ts',
  'src/client/views/records/records-payloads.test.ts', 'src/client/views/records/records-options.test.ts',
  'src/client/views/records-entry-guard.test.ts', 'src/client/form-validation.test.ts']
const args = round.startsWith('noemit')
  ? [join(deps, 'typescript/bin/tsc'), '--noEmit', '--incremental', 'false', '-p', join(tmp, 'tsconfig.json')]
  : [join(deps, 'vitest/vitest.mjs'), 'run', '--config', join(tmp, 'vitest.config.mjs'), '--no-cache',
      ...(round.startsWith('probe') ? ['probes.test.tsx', '-t', 'LG-01 contract|LG-01b contract']
        : round.startsWith('regression') ? regression : ['src/client/views/records/records-meeting-entry.test.tsx'])]
const started = new Date().toISOString()
const result = spawnSync(process.execPath, args, { cwd: tmp, encoding: 'utf8', timeout: 120000,
  maxBuffer: 16 * 1024 * 1024, env: { ...process.env, QA_OBSERVATIONS: join(tmp, 'observations.jsonl'),
    TMPDIR: tmp, XDG_CACHE_HOME: join(tmp, 'private-cache') } })
const after = guard()
const current = files(join(pkg, 'src'))
const archive = `${prefix}-${round}`
const manifest = { role: 'developer', round, tmp, head, deps, node: process.version,
  pnpm: spawnSync('pnpm', ['--version'], { encoding: 'utf8' }).stdout.trim(),
  started, ended: new Date().toISOString(), argv: [process.execPath, ...args],
  exit: result.status, signal: result.signal, error: result.error?.message,
  dependencies: ['react', 'react-test-renderer', 'vitest'].map(name => ({
    name, version: JSON.parse(readFileSync(join(deps, name, 'package.json'))).version })),
  source, owned: Object.fromEntries(owned.map(path => [path, source[path.slice(4)] ?? null])),
  sourceDrift: Object.keys(source).filter(path => source[path].sha256 !== current[path]?.sha256),
  ownedDrift: owned.filter(path => source[path.slice(4)]?.sha256 !== current[path.slice(4)]?.sha256),
  originalProbe: { path: originalProbe, sha256: hash(readFileSync(join(tmp, 'probes.test.tsx'))) },
  patchSha256: hash(patch), guardBefore: before, guardAfter: after,
  watchedUnchanged: JSON.stringify(before) === JSON.stringify(after) }
writeFileSync(`${archive}-execution.json`, JSON.stringify(manifest, null, 2) + '\n')
writeFileSync(`${archive}-stdout.txt`, result.stdout ?? '')
writeFileSync(`${archive}-stderr.txt`, result.stderr ?? '')
for (const name of ['vitest.json', 'observations.jsonl']) {
  if (existsSync(join(tmp, name))) cpSync(join(tmp, name), `${archive}-${name}`)
}
console.log(JSON.stringify({ tmp, exit: result.status, ownedDrift: manifest.ownedDrift,
  sourceDriftCount: manifest.sourceDrift.length, watchedUnchanged: manifest.watchedUnchanged }))
console.log(result.stdout ?? '')
console.log(result.stderr ?? '')
process.exitCode = manifest.watchedUnchanged ? (result.status ?? 2) : 2

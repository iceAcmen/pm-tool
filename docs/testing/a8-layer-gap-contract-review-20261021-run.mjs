import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'

const repo = process.cwd()
const pkg = join(repo, 'packages/dsh-pm-tool')
const prefix = 'a8-layer-gap-contract-review-20261021'
const out = join(repo, 'docs/testing', prefix)
const round = process.argv[2] ?? 'r2'
const archive = `${out}-${round}`
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const tmp = mkdtempSync('/private/tmp/pmtool-a8-layer-gap-')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
function files(root, includeMtime = false) {
  if (!existsSync(root)) return { exists: false, files: {} }
  const rows = {}
  const visit = dir => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name)
      const st = lstatSync(p)
      if (st.isSymbolicLink()) continue
      if (st.isDirectory()) visit(p)
      else rows[relative(root, p)] = { sha256: hash(readFileSync(p)), size: st.size,
        ...(includeMtime ? { mtimeMs: st.mtimeMs } : {}) }
    }
  }
  visit(root)
  return { exists: true, files: rows }
}
const watched = [...['lib', 'node_modules/.vite', 'node_modules/.cache'].map(p => join(pkg, p)),
  join(deps, '.vite'), join(deps, '.cache')]
const guard = () => Object.fromEntries(watched.map(p => [relative(repo, p), files(p, true)]))
const before = guard()
const source = files(join(pkg, 'src'))
const contracts = [
  'AGENTS.md', 'docs/collaboration.md',
  'reports/all-pending-acceptance-execution-20261021.md',
  'reports/layer-entry-map-source-20261021.json', 'reports/layer-entry-map-source-20261021.md',
  'docs/requirements.md', 'docs/decision-log.md',
  'docs/test-cases.md',
  'docs/plans/2026-10-10-r8-meeting-notes-design.md',
  'docs/testing/repo-link-assignee-completion-acceptance.md',
  'docs/testing/objective-progress-acceptance.md',
  'docs/testing/b1-b2-independent-test-plan-20261020.md',
  'docs/testing/remaining-layer-map-20261021.md',
  'docs/testing/remaining-journey-cases-20261021.md',
  'docs/testing/remaining-objective-cases-20261021.md',
  'packages/dsh-pm-tool/scripts/verify-import-content.mjs',
]
mkdirSync(join(tmp, 'contracts'))
for (const p of contracts) {
  const target = join(tmp, 'contracts', p)
  mkdirSync(join(target, '..'), { recursive: true })
  cpSync(join(repo, p), target)
}
cpSync(join(pkg, 'src'), join(tmp, 'src'), { recursive: true })
cpSync(join(pkg, 'tsconfig.json'), join(tmp, 'tsconfig.json'))
symlinkSync(deps, join(tmp, 'node_modules'), 'dir')
cpSync(`${out}-probes.test.tsx`, join(tmp, 'probes.test.tsx'))
writeFileSync(join(tmp, 'package.json'), JSON.stringify({ type: 'module' }))
writeFileSync(join(tmp, 'vitest.config.mjs'), [
  "import { defineConfig } from 'vitest/config'",
  'export default defineConfig({',
  `  cacheDir: ${JSON.stringify(join(tmp, 'vite-cache'))},`,
  '  test: { environment: "node", cache: false, include: ["probes.test.tsx"],',
  '    pool: "forks", poolOptions: { forks: { singleFork: true } },',
  '    reporters: ["verbose", "json"], outputFile: "vitest.json" }',
  '})',
].join('\n'))
const copied = files(join(tmp, 'src'))
if (JSON.stringify(source) !== JSON.stringify(copied)) throw new Error('copy drift')
const head = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()
const patch = spawnSync('git', ['diff', '--', 'packages/dsh-pm-tool/src'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).stdout
writeFileSync(join(tmp, 'tracked.patch'), patch)
const started = new Date().toISOString()
const args = [join(deps, 'vitest/vitest.mjs'), 'run', '--config', join(tmp, 'vitest.config.mjs'), '--no-cache']
const result = spawnSync(process.execPath, args, { cwd: tmp, encoding: 'utf8', timeout: 120000,
  maxBuffer: 16 * 1024 * 1024, env: { ...process.env, QA_OBSERVATIONS: join(tmp, 'observations.jsonl') } })
writeFileSync(join(tmp, 'stdout.txt'), result.stdout ?? '')
writeFileSync(join(tmp, 'stderr.txt'), result.stderr ?? '')
const after = guard()
const latest = files(join(pkg, 'src'))
const sourceDrift = Object.keys(source.files).filter(p => source.files[p].sha256 !== latest.files[p]?.sha256)
const manifest = {
  role: 'independent-test-expert', round, deps, started, ended: new Date().toISOString(), tmp, head,
  dependencies: ['react', 'react-test-renderer', 'vitest'].map(name => ({
    name, version: JSON.parse(readFileSync(join(deps, name, 'package.json'))).version,
    sha256: hash(readFileSync(join(deps, name, 'package.json'))),
  })),
  node: process.version, pnpm: spawnSync('pnpm', ['--version'], { encoding: 'utf8' }).stdout.trim(),
  command: [process.execPath, ...args], exit: result.status, signal: result.signal, error: result.error?.message,
  src: source, sourceDrift, trackedPatchSha256: hash(patch),
  contracts: contracts.map(p => ({ path: p, sha256: hash(readFileSync(join(tmp, 'contracts', p))) })),
  guardBefore: before, guardAfter: after, watchedUnchanged: JSON.stringify(before) === JSON.stringify(after),
  probesSha256: hash(readFileSync(join(tmp, 'probes.test.tsx'))),
}
writeFileSync(`${archive}-execution.json`, JSON.stringify(manifest, null, 2) + '\n')
writeFileSync(`${archive}-stdout.txt`, result.stdout ?? '')
writeFileSync(`${archive}-stderr.txt`, result.stderr ?? '')
if (existsSync(join(tmp, 'vitest.json'))) cpSync(join(tmp, 'vitest.json'), `${archive}-vitest.json`)
if (existsSync(join(tmp, 'observations.jsonl'))) cpSync(join(tmp, 'observations.jsonl'), `${archive}-observations.jsonl`)
console.log(JSON.stringify({ tmp, exit: result.status, sourceDrift, watchedUnchanged: manifest.watchedUnchanged }))
console.log(result.stdout)
console.log(result.stderr)
if (!manifest.watchedUnchanged) process.exitCode = 2

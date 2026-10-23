import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const prefix = 'fc-a4-independent-retest-20261021'
const mode = process.argv[2] ?? 'initial'
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const output = join(here, `${prefix}-${mode}-result.json`)
if (existsSync(output)) throw new Error('禁止覆盖原证')
const evidence = join(repo, 'reports/all-pending-evidence-20261021')
const candidatePath = join(evidence, 'A4/candidate.json')
const candidate = json(candidatePath)
const isolated = candidate.worktree
if (isolated !== '/private/tmp/pmtool-all-closure-20261021') throw new Error('未认领隔离根')
const previous = mode === 'initial' ? null : json(join(here, `${prefix}-initial-result.json`))
const root = previous?.root ?? mkdtempSync(join(tmpdir(), 'pmtool-independent-fc-a4-'))
const scratch = join(root, 'tmp')
const originalTests = {
  'fc-original-probes.test.mjs': 'fc-fix-independent-retest-20261021-probes.test.mjs',
  'fc-a2-additional.test.mjs': 'fc-a2-independent-retest-20261021-additional.test.mjs',
  'fc-a2-followup.test.mjs': 'fc-a2-independent-retest-20261021-followup.test.mjs',
  'fc-a3-probes.test.mjs': 'fc-a3-independent-retest-20261021-probes.test.mjs',
}
if (!previous) {
  mkdirSync(scratch)
  for (const dir of ['src', 'test', 'bin']) cpSync(join(repo, 'launcher', dir), join(root, 'launcher', dir), { recursive: true })
  for (const p of Object.keys(candidate.source)) {
    mkdirSync(dirname(join(root, p)), { recursive: true })
    cpSync(join(repo, p), join(root, p))
  }
  symlinkSync(join(isolated, 'packages/dsh-pm-tool/node_modules'), join(root, 'packages/dsh-pm-tool/node_modules'))
  for (const [dest, src] of Object.entries(originalTests)) cpSync(join(here, src), join(root, 'launcher/test', dest))
}
const snapshot = () => Object.entries(candidate.source).map(([path, expected]) => ({
  path, expected: expected.sha256, declaredIsolated: expected.isolatedSha256,
  main: sha(join(repo, path)), isolated: sha(join(isolated, path)), copy: sha(join(root, path)),
}))
const artifacts = json(join(evidence, 'A0/all-built-files.json'))
const artifactSnapshot = () => Object.entries(artifacts).map(([path, expected]) => ({ path, expected, actual: sha(join(isolated, path)) }))
function files(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? files(join(dir, e.name), base) : [join(dir, e.name).slice(base.length + 1)])
}
const launcherSnapshot = () => ['src', 'bin', 'test'].flatMap(dir => files(join(repo, 'launcher', dir)).map(name => {
  const path = `launcher/${dir}/${name}`
  return { path, main: sha(join(repo, path)), isolated: sha(join(isolated, path)), copy: sha(join(root, path)) }
}))
const diff = spawnSync('git', ['diff', candidate.productBase, '--', 'launcher', 'packages/dsh-pm-tool'], { cwd: repo, maxBuffer: 16 * 1024 * 1024 })
const patch = join(evidence, 'A4/tracked.patch')
const result = {
  mode, startedAt: new Date().toISOString(), node: process.version, executable: process.execPath, platform: process.platform,
  runnerSha256: sha(fileURLToPath(import.meta.url)), candidateSha256: sha(candidatePath),
  baseline: candidate.baselineCommit, productBase: candidate.productBase, root, scratch,
  dependencies: join(isolated, 'packages/dsh-pm-tool/node_modules'),
  dependencyBoundary: '仅链接既有依赖，非OS写保护；未install/build',
  patchSha256: sha(patch), patchExpected: candidate.trackedPatchSha256,
  patchMatchesCurrentTrackedDiff: diff.status === 0 && readFileSync(patch).equals(diff.stdout),
  sourceBefore: snapshot(), artifactsBefore: artifactSnapshot(), launcherBefore: launcherSnapshot(),
  originalTests: Object.entries(originalTests).map(([dest, src]) => ({ src, sourceHash: sha(join(here, src)), copyHash: sha(join(root, 'launcher/test', dest)) })),
  commands: [],
}
const invalidSource = x => x.main !== x.expected || x.isolated !== x.expected || x.copy !== x.expected || x.declaredIsolated !== x.expected
if (result.sourceBefore.length !== 23 || result.sourceBefore.some(invalidSource)) throw new Error('23源身份不一致')
if (result.artifactsBefore.length !== 453 || result.artifactsBefore.some(x => x.expected !== x.actual)) throw new Error('453产物不一致')
if (result.launcherBefore.some(x => x.main !== x.copy || x.isolated !== x.copy)) throw new Error('完整launcher身份不一致')
if (result.patchSha256 !== result.patchExpected || !result.patchMatchesCurrentTrackedDiff) throw new Error('patch不一致')
function command(label, args, timeout = 150000) {
  const log = join(here, `${prefix}-${mode}-${label}.txt`)
  if (existsSync(log)) throw new Error('禁止覆盖旧日志')
  const startedAt = new Date().toISOString()
  const child = spawnSync(process.execPath, args, {
    cwd: join(root, 'launcher'), encoding: 'utf8', timeout,
    env: { ...process.env, TMPDIR: scratch, TMP: scratch, TEMP: scratch },
    maxBuffer: 16 * 1024 * 1024,
  })
  const raw = (child.stdout ?? '') + (child.stderr ?? '')
  writeFileSync(log, raw, { flag: 'wx' })
  const summary = Object.fromEntries([...raw.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$/gm)].map(m => [m[1], Number(m[2])]))
  result.commands.push({ label, executable: process.execPath, args, cwd: join(root, 'launcher'), startedAt,
    finishedAt: new Date().toISOString(), exit: child.status, signal: child.signal,
    error: child.error?.message ?? null, summary, log: log.slice(repo.length + 1), sha256: sha(log) })
  console.log(JSON.stringify(result.commands.at(-1)))
}
if (mode === 'initial') {
  const args = json(join(root, 'launcher/package.json')).scripts.test.split(' ')
  if (args.shift() !== 'node') throw new Error('未知入口')
  command('launcher55', args)
  command('dom7', ['--test', 'test/control-html-sync.test.mjs'])
  command('original8', ['--test', 'test/fc-original-probes.test.mjs'])
} else if (mode === 'a2') {
  command('additional9', ['--test', 'test/fc-a2-additional.test.mjs'])
  command('followup10', ['--test', 'test/fc-a2-followup.test.mjs'])
} else if (mode === 'a3') {
  command('original-probes13', ['--test', 'test/fc-a3-probes.test.mjs'])
} else if (mode === 'probes' || mode.startsWith('probes-')) {
  cpSync(join(here, `${prefix}-probes.test.mjs`), join(root, 'launcher/test/fc-a4-probes.test.mjs'))
  result.probeSha256 = sha(join(root, 'launcher/test/fc-a4-probes.test.mjs'))
  command('additional', ['--test', 'test/fc-a4-probes.test.mjs'])
} else if (mode !== 'final') throw new Error('未知轮次')
result.sourceAfter = snapshot()
result.artifactsAfter = artifactSnapshot()
result.launcherAfter = launcherSnapshot()
result.candidateAfterSha256 = sha(candidatePath)
result.patchAfterSha256 = sha(patch)
result.sourceChanges = result.sourceAfter.filter(invalidSource)
result.artifactChanges = result.artifactsAfter.filter(x => x.expected !== x.actual)
result.launcherChanges = result.launcherAfter.filter(x => x.main !== x.copy || x.isolated !== x.copy)
result.originalTestsAfter = Object.entries(originalTests).map(([dest, src]) => ({ src, sourceHash: sha(join(here, src)), copyHash: sha(join(root, 'launcher/test', dest)) }))
result.finishedAt = new Date().toISOString()
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ output, root, sourceChanges: result.sourceChanges, artifactChanges: result.artifactChanges, launcherChanges: result.launcherChanges }))
if (result.commands.some(c => c.exit !== 0 || c.summary.fail || c.summary.cancelled || c.summary.skipped) || result.sourceChanges.length || result.artifactChanges.length || result.launcherChanges.length) process.exitCode = 1

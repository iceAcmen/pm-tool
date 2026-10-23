import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const prefix = 'fc-a5-independent-retest-20261021'
const mode = process.argv[2] ?? 'setup'
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const output = join(here, `${prefix}-${mode}-result.json`)
assert.ok(!existsSync(output), '禁止覆盖原证')
const evidence = join(repo, 'reports/all-pending-evidence-20261021')
const candidatePath = join(evidence, 'A5/candidate.json')
const candidate = json(candidatePath)
const isolated = candidate.worktree
assert.equal(isolated, '/private/tmp/pmtool-all-closure-20261021')
const previous = mode === 'setup' ? null : json(join(here, `${prefix}-setup-result.json`))
const root = previous?.root ?? mkdtempSync(join(tmpdir(), 'pmtool-independent-fc-a5-'))
const scratch = join(root, 'tmp')
const originalTests = {
  'fc-original-probes.test.mjs': 'fc-fix-independent-retest-20261021-probes.test.mjs',
  'fc-a2-additional.test.mjs': 'fc-a2-independent-retest-20261021-additional.test.mjs',
  'fc-a2-followup.test.mjs': 'fc-a2-independent-retest-20261021-followup.test.mjs',
  'fc-a3-probes.test.mjs': 'fc-a3-independent-retest-20261021-probes.test.mjs',
  'fc-a4-original.test.mjs': 'fc-a4-independent-retest-20261021-probes.test.mjs',
}
if (!previous) {
  mkdirSync(scratch)
  for (const dir of ['src', 'test', 'bin']) cpSync(join(repo, 'launcher', dir), join(root, 'launcher', dir), { recursive: true })
  for (const path of Object.keys(candidate.source)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    cpSync(join(repo, path), join(root, path))
  }
  symlinkSync(join(isolated, 'packages/dsh-pm-tool/node_modules'), join(root, 'packages/dsh-pm-tool/node_modules'))
  for (const [dest, src] of Object.entries(originalTests)) cpSync(join(here, src), join(root, 'launcher/test', dest))
  cpSync(join(here, originalTests['fc-a4-original.test.mjs']), join(root, 'launcher/test/fc-a4-corrected.test.mjs'))
}
function files(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory()
    ? files(join(dir, e.name), base) : [join(dir, e.name).slice(base.length + 1)])
}
const snapshot = () => Object.entries(candidate.source).map(([path, expected]) => ({
  path, expected: expected.sha256, declaredIsolated: expected.isolatedSha256,
  main: sha(join(repo, path)), isolated: sha(join(isolated, path)), copy: sha(join(root, path)),
}))
const artifacts = json(join(evidence, 'A0/all-built-files.json'))
const artifactSnapshot = () => Object.entries(artifacts).map(([path, expected]) => ({ path, expected, actual: sha(join(isolated, path)) }))
const launcherSnapshot = () => ['src', 'bin', 'test'].flatMap(dir => files(join(repo, 'launcher', dir)).map(name => {
  const path = `launcher/${dir}/${name}`
  return { path, main: sha(join(repo, path)), isolated: sha(join(isolated, path)), copy: sha(join(root, path)) }
}))
const protectedSnapshot = () => {
  const paths = ['AGENTS.md', 'README.md', ...files(join(repo, 'docs')).map(p => `docs/${p}`),
    ...files(join(evidence, 'A4')).map(p => `reports/all-pending-evidence-20261021/A4/${p}`),
    ...files(join(evidence, 'A5')).map(p => `reports/all-pending-evidence-20261021/A5/${p}`)]
    .filter(p => !p.startsWith(`docs/testing/${prefix}`)).sort()
  return Object.fromEntries(paths.map(p => [p, sha(join(repo, p))]))
}
const originalsSnapshot = () => Object.entries(originalTests).map(([dest, src]) => ({
  src, sourceHash: sha(join(here, src)), copyHash: sha(join(root, 'launcher/test', dest)),
}))
const patch = join(evidence, 'A5/tracked.patch')
const diff = spawnSync('git', ['diff', candidate.productBase, '--', 'launcher', 'packages/dsh-pm-tool'], { cwd: repo, maxBuffer: 16 * 1024 * 1024 })
const a4 = json(join(evidence, 'A4/candidate.json'))
const result = {
  mode, startedAt: new Date().toISOString(), node: process.version, executable: process.execPath, platform: process.platform,
  runnerSha256: sha(fileURLToPath(import.meta.url)), candidateSha256: sha(candidatePath),
  baseline: candidate.baselineCommit, productBase: candidate.productBase, root, scratch,
  dependencies: join(isolated, 'packages/dsh-pm-tool/node_modules'),
  dependencyBoundary: '仅链接既有依赖，非OS写保护；未install/build',
  patchSha256: sha(patch), patchExpected: candidate.trackedPatchSha256,
  patchMatchesCurrentTrackedDiff: diff.status === 0 && readFileSync(patch).equals(diff.stdout),
  changedSinceA4: Object.keys(candidate.source).filter(p => a4.source[p]?.sha256 !== candidate.source[p].sha256),
  sourceBefore: snapshot(), artifactsBefore: artifactSnapshot(), launcherBefore: launcherSnapshot(),
  protectedBefore: protectedSnapshot(), originalTests: originalsSnapshot(), commands: [],
}
const invalidSource = x => x.main !== x.expected || x.isolated !== x.expected || x.copy !== x.expected || x.declaredIsolated !== x.expected
assert.equal(result.sourceBefore.length, 23)
assert.ok(!result.sourceBefore.some(invalidSource), '23源不一致')
assert.equal(result.artifactsBefore.length, 453)
assert.ok(result.artifactsBefore.every(x => x.expected === x.actual), '453产物不一致')
assert.ok(result.launcherBefore.every(x => x.main === x.copy && x.isolated === x.copy), '完整launcher不一致')
assert.equal(result.patchSha256, result.patchExpected)
assert.equal(result.patchMatchesCurrentTrackedDiff, true)
assert.deepEqual([...result.changedSinceA4].sort(), [...candidate.changedSinceA4].sort())
assert.ok(result.originalTests.every(x => x.sourceHash === x.copyHash))
if (previous) {
  assert.equal(result.candidateSha256, previous.candidateSha256, 'candidate已变')
  assert.equal(result.patchSha256, previous.patchSha256, 'patch已变')
  assert.deepEqual(result.originalTests, previous.originalTests, '原测试件已变')
}
function command(label, args, timeout = 150000) {
  const log = join(here, `${prefix}-${mode}-${label}.txt`)
  assert.ok(!existsSync(log), '禁止覆盖旧日志')
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
    error: child.error?.message ?? null, summary, log: log.slice(repo.length + 1), sha256: sha(log),
    failedCases: [...raw.matchAll(/^not ok \d+ - (.*)$/gm)].map(m => m[1]) })
  console.log(JSON.stringify(result.commands.at(-1)))
}
if (mode === 'initial') {
  const args = json(join(root, 'launcher/package.json')).scripts.test.split(' ')
  assert.equal(args.shift(), 'node')
  command('launcher56', args)
  command('dom7', ['--test', 'test/control-html-sync.test.mjs'])
  command('original8', ['--test', 'test/fc-original-probes.test.mjs'])
} else if (mode === 'a2') {
  command('additional9', ['--test', 'test/fc-a2-additional.test.mjs'])
  command('followup10', ['--test', 'test/fc-a2-followup.test.mjs'])
} else if (mode === 'a3') {
  command('original13', ['--test', 'test/fc-a3-probes.test.mjs'])
} else if (mode === 'a4-original') {
  command('original26', ['--test', 'test/fc-a4-original.test.mjs'])
  const c = result.commands[0]
  result.expectedObsoleteOracleOnly = c.exit === 1 && c.summary.tests === 26 && c.summary.fail === 1
    && c.summary.pass === 25 && c.failedCases.length === 1 && c.failedCases[0].startsWith('A4-P04-early-failure')
} else if (mode === 'a4-corrected') {
  const original = join(root, 'launcher/test/fc-a4-original.test.mjs')
  const corrected = join(root, 'launcher/test/fc-a4-corrected.test.mjs')
  const delta = spawnSync('diff', ['-u', original, corrected], { encoding: 'utf8' })
  assert.equal(delta.status, 1, '应有最小期望差异')
  const path = join(here, `${prefix}-a4-oracle.diff`)
  writeFileSync(path, delta.stdout, { flag: 'wx' })
  result.oracleCorrection = { originalSha256: sha(original), correctedSha256: sha(corrected),
    diff: path.slice(repo.length + 1), diffSha256: sha(path),
    contract: 'A4报告§2与本轮计划P04：early-failure单独S4/true；其他分支不变' }
  command('corrected26', ['--test', 'test/fc-a4-corrected.test.mjs'])
} else if (mode === 'probes') {
  const path = join(here, `${prefix}-probes.test.mjs`)
  cpSync(path, join(root, 'launcher/test/fc-a5-probes.test.mjs'))
  result.probeSha256 = sha(path)
  command('additional', ['--test', 'test/fc-a5-probes.test.mjs'])
} else if (mode !== 'setup' && mode !== 'final') throw new Error('未知轮次')
result.sourceAfter = snapshot()
result.artifactsAfter = artifactSnapshot()
result.launcherAfter = launcherSnapshot()
result.protectedAfter = protectedSnapshot()
result.originalTestsAfter = originalsSnapshot()
result.candidateAfterSha256 = sha(candidatePath)
result.patchAfterSha256 = sha(patch)
result.sourceChanges = result.sourceAfter.filter(invalidSource)
result.artifactChanges = result.artifactsAfter.filter(x => x.expected !== x.actual)
result.launcherChanges = result.launcherAfter.filter(x => x.main !== x.copy || x.isolated !== x.copy)
const protectedBase = previous?.protectedBefore ?? result.protectedBefore
result.protectedChangesSinceSetup = [...new Set([...Object.keys(protectedBase), ...Object.keys(result.protectedAfter)])]
  .filter(p => protectedBase[p] !== result.protectedAfter[p])
  .map(path => ({ path, before: protectedBase[path] ?? null, after: result.protectedAfter[path] ?? null }))
result.finishedAt = new Date().toISOString()
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ output, root, sourceChanges: result.sourceChanges, artifactChanges: result.artifactChanges,
  launcherChanges: result.launcherChanges, protectedChangesSinceSetup: result.protectedChangesSinceSetup }))
const failedCommand = result.commands.some(c => c.exit !== 0 || c.summary.fail || c.summary.cancelled || c.summary.skipped)
if ((failedCommand && !result.expectedObsoleteOracleOnly) || result.sourceChanges.length || result.artifactChanges.length
  || result.launcherChanges.length || result.candidateAfterSha256 !== result.candidateSha256
  || result.patchAfterSha256 !== result.patchSha256
  || JSON.stringify(result.originalTestsAfter) !== JSON.stringify(result.originalTests)) process.exitCode = 1

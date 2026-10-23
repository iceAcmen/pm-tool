/**
 * 独立FC复验：认领17源，复制到自有tmp，链接已有依赖，运行原49与Chrome DOM3。
 * 仅生成本前缀原证和自有tmp；不安装、构建、启产品服务或读取认证文件。
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const prefix = 'fc-fix-independent-retest-20261021'
const round = process.argv[2] ?? 'r1'
if (!/^r[1-9][0-9]*$/.test(round)) throw new Error('轮次必须是r1/r2等')
const output = join(here, `${prefix}-${round}-result.json`)
if (existsSync(output)) throw new Error('禁止覆盖既有轮次原证')
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const evidence = join(repo, 'reports/all-pending-evidence-20261021')
const candidatePath = join(evidence, 'A1/candidate.json')
const candidate = json(candidatePath)
const candidateSha = sha(candidatePath)
const isolated = candidate.worktree
if (isolated !== '/private/tmp/pmtool-all-closure-20261021') throw new Error('未认领隔离根')
const dependencies = join(isolated, 'packages/dsh-pm-tool/node_modules')
const root = mkdtempSync(join(tmpdir(), 'pmtool-independent-fc-'))
const packageRoot = join(root, 'packages/dsh-pm-tool')
const scratch = join(root, 'tmp')
mkdirSync(scratch)
mkdirSync(packageRoot, { recursive: true })
cpSync(join(repo, 'launcher/src'), join(root, 'launcher/src'), { recursive: true })
cpSync(join(repo, 'launcher/test'), join(root, 'launcher/test'), { recursive: true })
cpSync(join(repo, 'launcher/package.json'), join(root, 'launcher/package.json'))
for (const p of Object.keys(candidate.source)) {
  if (!p.startsWith('launcher/')) {
    mkdirSync(dirname(join(root, p)), { recursive: true })
    cpSync(join(repo, p), join(root, p))
  }
}
symlinkSync(dependencies, join(packageRoot, 'node_modules'))
const sourceSnapshot = () => Object.entries(candidate.source).map(([path, expected]) => ({
  path, expected: expected.sha256, declaredIsolated: expected.isolatedSha256,
  main: sha(join(repo, path)), isolated: sha(join(isolated, path)), copy: sha(join(root, path)),
}))
const bundleManifest = json(join(evidence, 'A0/all-built-files.json'))
const bundleSnapshot = () => Object.entries(bundleManifest).map(([path, expected]) => ({
  path, expected, actual: sha(join(isolated, path)),
}))
const patch = join(evidence, 'A1/tracked.patch')
const patchBytes = readFileSync(patch)
const freshDiff = spawnSync('git', ['diff', candidate.productBase, '--', 'launcher', 'packages/dsh-pm-tool'], { cwd: repo, maxBuffer: 16 * 1024 * 1024 })
const before = sourceSnapshot()
const bundlesBefore = bundleSnapshot()
const result = {
  round, startedAt: new Date().toISOString(), node: process.version, platform: process.platform,
  runnerSha256: sha(fileURLToPath(import.meta.url)), candidateSha256: candidateSha,
  baseline: candidate.baselineCommit, productBase: candidate.productBase, root, scratch,
  dependencies, dependencyAccess: '仅模块解析/读取；链接不赋予独立写保护，脚本不执行安装器',
  patchSha256: sha(patch), patchExpected: candidate.trackedPatchSha256,
  patchMatchesCurrentTrackedDiff: freshDiff.status === 0 && patchBytes.equals(freshDiff.stdout),
  sourceBefore: before, bundlesBefore,
  commands: [],
}
if (before.length !== 17 || before.some(x => x.main !== x.expected || x.isolated !== x.expected || x.copy !== x.expected || x.declaredIsolated !== x.expected)) throw new Error('17源认领不一致，停止测试')
if (result.patchSha256 !== result.patchExpected || !result.patchMatchesCurrentTrackedDiff) throw new Error('patch认领不一致，停止测试')
if (bundlesBefore.some(x => x.expected !== x.actual)) throw new Error('A0插件产物已变，停止继承')
function command(label, args) {
  const log = join(here, `${prefix}-${round}-${label}.txt`)
  if (existsSync(log)) throw new Error('禁止覆盖既有日志')
  const startedAt = new Date().toISOString()
  const child = spawnSync(process.execPath, args, {
    cwd: join(root, 'launcher'), encoding: 'utf8', timeout: 120_000,
    env: { ...process.env, TMPDIR: scratch, TMP: scratch, TEMP: scratch },
    maxBuffer: 16 * 1024 * 1024,
  })
  writeFileSync(log, `${child.stdout ?? ''}${child.stderr ?? ''}`, 'utf8')
  result.commands.push({
    label, executable: process.execPath, args, cwd: join(root, 'launcher'), startedAt,
    finishedAt: new Date().toISOString(), exit: child.status, signal: child.signal,
    error: child.error?.message ?? null, log: log.slice(repo.length + 1), sha256: sha(log),
  })
}
const scripts = json(join(root, 'launcher/package.json')).scripts
const originalArgs = scripts.test.split(' ')
if (originalArgs.shift() !== 'node') throw new Error('未知测试入口')
command('launcher49', originalArgs)
command('chrome-dom3', ['--test', 'test/control-html-sync.test.mjs'])
result.sourceAfter = sourceSnapshot()
result.bundlesAfter = bundleSnapshot()
result.candidateAfterSha256 = sha(candidatePath)
result.sourceChangedDuringRun = result.sourceAfter.filter((x, i) =>
  x.main !== before[i].main || x.isolated !== before[i].isolated || x.copy !== before[i].copy)
result.bundleChangedDuringRun = result.bundlesAfter.filter((x, i) => x.actual !== bundlesBefore[i].actual)
result.extraLauncherSources = readdirSync(join(root, 'launcher/src')).map(name => ({
  path: `launcher/src/${name}`, main: sha(join(repo, 'launcher/src', name)),
  isolated: sha(join(isolated, 'launcher/src', name)), copy: sha(join(root, 'launcher/src', name)),
}))
result.finishedAt = new Date().toISOString()
writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({
  output, root, sourceCount: before.length, artifactCount: bundlesBefore.length,
  commands: result.commands.map(({ label, exit }) => ({ label, exit })),
  sourceChangedDuringRun: result.sourceChangedDuringRun,
  bundleChangedDuringRun: result.bundleChangedDuringRun,
}, null, 2))

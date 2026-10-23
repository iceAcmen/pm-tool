import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const prefix = 'fc-a2-independent-retest-20261021'
const mode = process.argv[2] ?? 'initial'
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const output = join(here, `${prefix}-${mode}-result.json`)
if (existsSync(output)) throw new Error('禁止覆盖已有原证；请使用新轮次')
const evidence = join(repo, 'reports/all-pending-evidence-20261021')
const candidatePath = join(evidence, 'A2/candidate.json')
const candidate = json(candidatePath)
const isolated = candidate.worktree
if (isolated !== '/private/tmp/pmtool-all-closure-20261021') throw new Error('隔离根未认领')
const previous = mode === 'initial' ? null : json(join(here, `${prefix}-initial-result.json`))
const root = previous?.root ?? mkdtempSync(join(tmpdir(), 'pmtool-independent-fc-a2-'))
const scratch = join(root, 'tmp')
if (!previous) {
  mkdirSync(scratch)
  cpSync(join(repo, 'launcher/src'), join(root, 'launcher/src'), { recursive: true })
  cpSync(join(repo, 'launcher/test'), join(root, 'launcher/test'), { recursive: true })
  cpSync(join(repo, 'launcher/package.json'), join(root, 'launcher/package.json'))
  for (const p of Object.keys(candidate.source)) {
    if (p.startsWith('launcher/')) continue
    mkdirSync(dirname(join(root, p)), { recursive: true })
    cpSync(join(repo, p), join(root, p))
  }
  symlinkSync(join(isolated, 'packages/dsh-pm-tool/node_modules'), join(root, 'packages/dsh-pm-tool/node_modules'))
  cpSync(join(here, 'fc-fix-independent-retest-20261021-probes.test.mjs'), join(root, 'launcher/test/fc-original-probes.test.mjs'))
  cpSync(join(here, `${prefix}-additional.test.mjs`), join(root, 'launcher/test/fc-a2-additional.test.mjs'))
}
const snapshot = () => Object.entries(candidate.source).map(([path, expected]) => ({
  path, expected: expected.sha256, declaredIsolated: expected.isolatedSha256,
  main: sha(join(repo, path)), isolated: sha(join(isolated, path)), copy: sha(join(root, path)),
}))
const artifacts = json(join(evidence, 'A0/all-built-files.json'))
const artifactSnapshot = () => Object.entries(artifacts).map(([path, expected]) => ({
  path, expected, actual: sha(join(isolated, path)),
}))
const launcherSnapshot = () => readdirSync(join(root, 'launcher/src')).map(name => ({
  path: `launcher/src/${name}`, main: sha(join(repo, 'launcher/src', name)),
  isolated: sha(join(isolated, 'launcher/src', name)), copy: sha(join(root, 'launcher/src', name)),
}))
const diff = spawnSync('git', ['diff', candidate.productBase, '--', 'launcher', 'packages/dsh-pm-tool'], { cwd: repo, maxBuffer: 16 * 1024 * 1024 })
const patch = join(evidence, 'A2/tracked.patch')
const result = {
  mode, startedAt: new Date().toISOString(), node: process.version, platform: process.platform,
  runnerSha256: sha(fileURLToPath(import.meta.url)), candidateSha256: sha(candidatePath),
  baseline: candidate.baselineCommit, productBase: candidate.productBase, root, scratch,
  dependencies: join(isolated, 'packages/dsh-pm-tool/node_modules'),
  dependencyBoundary: '只链接现有依赖供解析；未安装/构建；软链不提供操作系统写保护',
  patchSha256: sha(patch), patchExpected: candidate.trackedPatchSha256,
  patchMatchesCurrentTrackedDiff: diff.status === 0 && readFileSync(patch).equals(diff.stdout),
  sourceBefore: snapshot(), artifactsBefore: artifactSnapshot(), launcherBefore: launcherSnapshot(),
  originalProbeSha256: sha(join(root, 'launcher/test/fc-original-probes.test.mjs')),
  additionalSha256: sha(join(root, 'launcher/test/fc-a2-additional.test.mjs')),
  commands: [],
}
const invalidSource = x => x.main !== x.expected || x.isolated !== x.expected || x.copy !== x.expected || x.declaredIsolated !== x.expected
if (result.sourceBefore.length !== 17 || result.sourceBefore.some(invalidSource)) throw new Error('17源身份不一致')
if (result.artifactsBefore.length !== 453 || result.artifactsBefore.some(x => x.expected !== x.actual)) throw new Error('453产物身份不一致')
if (result.launcherBefore.some(x => x.main !== x.copy || x.isolated !== x.copy)) throw new Error('launcher完整src身份不一致')
if (result.patchSha256 !== result.patchExpected || !result.patchMatchesCurrentTrackedDiff) throw new Error('patch身份不一致')
function command(label, args, timeout = 120000) {
  const log = join(here, `${prefix}-${mode}-${label}.txt`)
  if (existsSync(log)) throw new Error('禁止覆盖旧日志')
  const startedAt = new Date().toISOString()
  const child = spawnSync(process.execPath, args, {
    cwd: join(root, 'launcher'), encoding: 'utf8', timeout,
    env: { ...process.env, TMPDIR: scratch, TMP: scratch, TEMP: scratch },
    maxBuffer: 16 * 1024 * 1024,
  })
  writeFileSync(log, (child.stdout ?? '') + (child.stderr ?? ''))
  result.commands.push({
    label, executable: process.execPath, args, cwd: join(root, 'launcher'), startedAt,
    finishedAt: new Date().toISOString(), exit: child.status, signal: child.signal,
    error: child.error?.message ?? null, log: log.slice(repo.length + 1), sha256: sha(log),
  })
  console.log(JSON.stringify(result.commands.at(-1)))
}
if (mode === 'initial') {
  const args = json(join(root, 'launcher/package.json')).scripts.test.split(' ')
  if (args.shift() !== 'node') throw new Error('未知原49测试入口')
  command('launcher49', args)
  command('dom6', ['--test', 'test/control-html-sync.test.mjs'])
  command('original8', ['--test', 'test/fc-original-probes.test.mjs'])
} else if (mode === 'additional') {
  command('additional', ['--test', 'test/fc-a2-additional.test.mjs'])
} else if (mode === 'followup') {
  cpSync(join(here, `${prefix}-followup.test.mjs`), join(root, 'launcher/test/fc-a2-followup.test.mjs'), { errorOnExist: true, force: false })
  result.followupSha256 = sha(join(root, 'launcher/test/fc-a2-followup.test.mjs'))
  command('ordered-failure-focus', ['--test', '--test-name-pattern=A2-X(05|06B|10)', 'test/fc-a2-followup.test.mjs'])
} else if (mode !== 'final') {
  throw new Error('只允许initial/additional/followup/final')
}
result.sourceAfter = snapshot()
result.artifactsAfter = artifactSnapshot()
result.launcherAfter = launcherSnapshot()
result.candidateAfterSha256 = sha(candidatePath)
result.patchAfterSha256 = sha(patch)
result.sourceChanges = result.sourceAfter.filter(invalidSource)
result.artifactChanges = result.artifactsAfter.filter(x => x.expected !== x.actual)
result.launcherChanges = result.launcherAfter.filter(x => x.main !== x.copy || x.isolated !== x.copy)
result.finishedAt = new Date().toISOString()
writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ output, root, sourceChanges: result.sourceChanges, artifactChanges: result.artifactChanges, launcherChanges: result.launcherChanges }))

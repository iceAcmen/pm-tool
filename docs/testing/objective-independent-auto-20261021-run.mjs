// 独立测试编排：仅复制冻结输入，不安装/构建/启动宿主。
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const frozen = '/private/tmp/pmtool-all-closure-20261021'
const packageRel = 'packages/dsh-pm-tool'
const pkg = path.join(frozen, packageRel)
const own = fs.mkdtempSync('/private/tmp/objective-independent-auto-20261021-')
const evidence = path.join(repo, 'docs/testing/objective-independent-auto-20261021-evidence')
fs.mkdirSync(evidence, { recursive: true })
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const save = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
const candidates = ['reports/all-pending-evidence-20261021/A3/candidate.json',
  'reports/all-pending-evidence-20261021/A3/tracked.patch',
  'reports/all-pending-evidence-20261021/A0/all-built-files.json',
  'docs/testing/remaining-objective-cases-20261021.md',
  'docs/testing/objective-progress-acceptance.md',
  'docs/testing/remaining-acceptance-register-20261021.md',
  'docs/decision-log.md', 'AGENTS.md', 'docs/collaboration.md',
  'reports/all-pending-acceptance-execution-20261021.md']
const inputFiles = new Set(candidates.map(f => path.join(repo, f)))
function files(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.name === 'node_modules' || e.name === '.git' ? [] :
      e.isDirectory() ? files(path.join(dir, e.name)) :
        e.isFile() ? [path.join(dir, e.name)] : [])
}
for (const sub of ['lib', 'src', 'scripts', 'locale']) {
  for (const f of files(path.join(pkg, sub))) inputFiles.add(f)
}
for (const f of ['package.json', 'pnpm-lock.yaml', 'cordis.patch.yml']) inputFiles.add(path.join(pkg, f))
const candidate = JSON.parse(fs.readFileSync(path.join(repo, candidates[0]), 'utf8'))
const allBuilt = JSON.parse(fs.readFileSync(path.join(repo, candidates[2]), 'utf8'))
const bindings = []
assert.equal(Object.keys(allBuilt).length, 453)
for (const [rel, hash] of Object.entries(allBuilt)) {
  assert.equal(sha(path.join(frozen, rel)), hash, `冻结产物 ${rel}`)
  bindings.push({ rel, sha256: hash, kind: 'A0-built' })
}
for (const [rel, identity] of Object.entries(candidate.source)) {
  const f = path.join(frozen, rel)
  inputFiles.add(f)
  assert.equal(sha(f), identity.isolatedSha256, `A3 隔离声明 ${rel}`)
  bindings.push({ rel, sha256: identity.isolatedSha256, kind: 'A3-source' })
}
assert.equal(sha(path.join(repo, candidates[1])), candidate.trackedPatchSha256)

// 只读现有依赖闭包，记录实际解析目录及全部包内字节，不读取 profile/认证。
const dependencyDirs = new Set()
function resolvePackage(name, from) {
  let current = from
  while (true) {
    const p = path.join(current, 'node_modules', name, 'package.json')
    if (fs.existsSync(p)) return fs.realpathSync(path.dirname(p))
    const parent = path.dirname(current)
    if (parent === current) throw new Error(`既有依赖未找到 ${name}`)
    current = parent
  }
}
function dependency(name, from) {
  const dir = resolvePackage(name, from)
  if (dependencyDirs.has(dir)) return
  dependencyDirs.add(dir)
  for (const f of files(dir)) inputFiles.add(f)
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  for (const name of Object.keys(meta.dependencies ?? {})) dependency(name, dir)
}
for (const name of ['@deepseek-ai/cordis', '@deepseek-ai/dsh-storage',
  '@deepseek-ai/dsh-storage-domain', '@deepseek-ai/dsh-storage-json',
  '@deepseek-ai/dsh-llm', 'zod']) dependency(name, pkg)
const prefix = 'objective-independent-auto-20261021-'
for (const name of ['run.mjs', 'worker.mjs', 'guard.mjs']) inputFiles.add(path.join(repo, 'docs/testing', prefix + name))
function snapshot() {
  return Object.fromEntries([...inputFiles].sort().map(f => {
    const s = fs.statSync(f)
    return [f, { sha256: sha(f), size: s.size, mtimeMs: s.mtimeMs }]
  }))
}
const before = snapshot()
save(path.join(own, 'inputs-before.json'), before)
save(path.join(own, 'candidate-binding.json'), { candidate, bindings, dependencyDirs: [...dependencyDirs] })
const copyPkg = path.join(own, packageRel)
fs.mkdirSync(copyPkg, { recursive: true })
for (const sub of ['lib', 'src', 'scripts', 'locale']) {
  fs.cpSync(path.join(pkg, sub), path.join(copyPkg, sub), { recursive: true, errorOnExist: true })
}
for (const f of ['package.json', 'pnpm-lock.yaml', 'cordis.patch.yml']) fs.copyFileSync(path.join(pkg, f), path.join(copyPkg, f))
fs.symlinkSync(path.join(pkg, 'node_modules'), path.join(copyPkg, 'node_modules'), 'dir')
for (const name of ['worker.mjs', 'guard.mjs']) {
  fs.copyFileSync(path.join(repo, 'docs/testing', prefix + name), path.join(copyPkg, name))
}
const copyFiles = files(copyPkg)
const copyBefore = Object.fromEntries(copyFiles.map(f => [path.relative(copyPkg, f), sha(f)]))
const env = {
  PATH: path.dirname(process.execPath) + ':/usr/bin:/bin:/usr/sbin:/sbin',
  HOME: path.join(own, 'home'), TMPDIR: path.join(own, 'tmp'),
  DSH_HOME: path.join(own, 'home/dsh'), DSH_PM_ISOLATED_ROOT: path.join(own, 'runtime'),
  PM_STORAGE_ROOT: path.join(own, 'runtime/data'), DSH_PM_BACKUP_DIR: path.join(own, 'runtime/backups'),
  DSH_PM_FILE_ROOT: path.join(own, 'runtime/files'), NODE_ENV: 'test',
  QA_OWN: own, QA_PACKAGE: copyPkg, QA_AUDIT: path.join(own, 'write-audit.ndjson'),
}
for (const dir of [env.HOME, env.TMPDIR, env.DSH_HOME, env.DSH_PM_ISOLATED_ROOT,
  env.PM_STORAGE_ROOT, env.DSH_PM_BACKUP_DIR, env.DSH_PM_FILE_ROOT]) fs.mkdirSync(dir, { recursive: true })
const commands = []
function execute(id, args, extra = {}) {
  const start = new Date().toISOString()
  const argv = ['--import', path.join(copyPkg, 'guard.mjs'), ...args]
  const result = spawnSync(process.execPath, argv, {
    cwd: copyPkg, env: { ...env, ...extra }, encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024,
  })
  fs.writeFileSync(path.join(own, id + '.stdout.txt'), result.stdout ?? '')
  fs.writeFileSync(path.join(own, id + '.stderr.txt'), result.stderr ?? '')
  commands.push({ id, executable: process.execPath, argv, cwd: copyPkg, env: { ...env, ...extra },
    start, end: new Date().toISOString(), exit: result.status, signal: result.signal,
    error: result.error ? String(result.error) : null,
    stdoutSha256: sha(path.join(own, id + '.stdout.txt')),
    stderrSha256: sha(path.join(own, id + '.stderr.txt')) })
  console.log(`${id}: exit=${result.status}\n${result.stdout ?? ''}${result.stderr ?? ''}`)
}
execute('independent-domain', ['worker.mjs', 'domain'])
if (fs.existsSync(path.join(own, 'f2.json'))) execute('independent-new-process', ['worker.mjs', 'reopen'])
execute('existing-objective-only', ['scripts/verify-objective-progress.mjs'])
const after = snapshot()
const changes = Object.keys(before).filter(f => JSON.stringify(before[f]) !== JSON.stringify(after[f]))
const copyAfter = Object.fromEntries(copyFiles.map(f => [path.relative(copyPkg, f), sha(f)]))
save(path.join(own, 'inputs-after.json'), after)
save(path.join(own, 'copy-frozen-before.json'), copyBefore)
save(path.join(own, 'copy-frozen-after.json'), copyAfter)
save(path.join(own, 'commands.json'), commands)
const summary = { own, evidence, at: new Date().toISOString(), os: os.release(), arch: os.arch(),
  node: process.version, candidate: 'A3', baseline: candidate.baselineCommit, version: candidate.version,
  a3SourceCount: Object.keys(candidate.source).length, builtCount: bindings.filter(b => b.kind === 'A0-built').length,
  inputCount: inputFiles.size, dependencyCount: dependencyDirs.size, changes,
  copyChanges: Object.keys(copyBefore).filter(f => copyBefore[f] !== copyAfter[f]), commands,
  scope: '独立 AUTO/领域集成；不含 GUI、宿主激活、正式保护盘点或 full guard' }
save(path.join(own, 'execution.json'), summary)
// 每次执行独立子目录，保留首轮失败，不覆盖后续重测证据。
const archive = path.join(evidence, path.basename(own))
fs.mkdirSync(archive)
for (const f of fs.readdirSync(own, { withFileTypes: true }).filter(e => e.isFile())) {
  fs.copyFileSync(path.join(own, f.name), path.join(archive, f.name))
}
for (const entry of fs.readdirSync(own, { withFileTypes: true })) {
  if (entry.isDirectory() && entry.name.startsWith('f2-backup.json.files.')) {
    fs.cpSync(path.join(own, entry.name), path.join(archive, entry.name), { recursive: true })
  }
}
console.log(JSON.stringify(summary, null, 2))
process.exitCode = changes.length || summary.copyChanges.length || commands.some(c => c.exit !== 0) ? 1 : 0

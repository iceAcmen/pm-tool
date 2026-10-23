import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const rel = 'packages/dsh-pm-tool'
const input = path.join(repo, rel)
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const prefix = 'governance-growth-independent-auto-20261021'
const own = fs.mkdtempSync('/private/tmp/' + prefix + '-')
const pkg = path.join(own, rel)
const evidence = path.join(repo, 'docs/testing', prefix + '-evidence', path.basename(own))
const sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const save = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n')
function files(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    ['node_modules', '.git'].includes(e.name) ? [] : e.isDirectory() ? files(path.join(dir, e.name)) :
      e.isFile() ? [path.join(dir, e.name)] : []) : []
}
const inputFiles = new Set()
for (const sub of ['src', 'scripts', 'locale']) for (const f of files(path.join(input, sub))) inputFiles.add(f)
for (const f of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'cordis.patch.yml']) inputFiles.add(path.join(input, f))
for (const f of ['AGENTS.md', 'docs/collaboration.md', 'docs/decision-log.md',
  'docs/testing/remaining-governance-cases-20261021.md', 'docs/testing/remaining-acceptance-register-20261021.md',
  'reports/all-pending-acceptance-execution-20261021.md',
  ...['p0', 'p1', 'p2', 'p3'].map(p => `docs/design/deep-integration-v2-${p}-dev.md`),
  ...['plan.md', 'run.mjs', 'worker.mjs', 'guard.mjs'].map(p => `docs/testing/${prefix}-${p}`)]) inputFiles.add(path.join(repo, f))
const dependencyDirs = new Set()
function resolvePackage(name, from) {
  let dir = from
  while (true) {
    const target = path.join(dir, 'node_modules', name, 'package.json')
    if (fs.existsSync(target)) return fs.realpathSync(path.dirname(target))
    const next = path.dirname(dir)
    if (next === dir) throw new Error('已装依赖缺失：' + name)
    dir = next
  }
}
function dependency(name, from) {
  const dir = resolvePackage(name, from)
  if (dependencyDirs.has(dir)) return
  dependencyDirs.add(dir)
  for (const f of files(dir)) inputFiles.add(f)
  for (const next of Object.keys(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'))).dependencies ?? {})) {
    dependency(next, dir)
  }
}
const depRoot = path.dirname(deps)
for (const name of Object.keys(JSON.parse(fs.readFileSync(path.join(input, 'package.json'))).dependencies)) dependency(name, depRoot)
for (const name of ['typescript', 'vitest', '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage',
  '@deepseek-ai/dsh-storage-json', '@deepseek-ai/dsh-storage-domain', '@deepseek-ai/dsh-llm']) dependency(name, depRoot)
function snapshot() {
  return Object.fromEntries([...inputFiles].sort().map(f => [f, {
    sha256: fs.existsSync(f) ? sha(f) : null,
    size: fs.existsSync(f) ? fs.statSync(f).size : null,
  }]))
}
const before = snapshot()
save(path.join(own, 'inputs-before.json'), before)
const git = (...args) => spawnSync('/usr/bin/git', args, { cwd: repo, encoding: 'utf8' }).stdout
fs.writeFileSync(path.join(own, 'tracked.patch'), git('diff', '--', rel))
fs.writeFileSync(path.join(own, 'new-files.txt'), git('ls-files', '--others', '--exclude-standard', '--', rel))
save(path.join(own, 'candidate.json'), {
  id: path.basename(own), head: git('rev-parse', 'HEAD').trim(), productBaseline: '2a7603023bc54ef13d788e50069ee3fde4671bf3',
  source: Object.fromEntries(files(path.join(input, 'src')).map(f => [path.relative(repo, f), sha(f)])),
  dependencies: [...dependencyDirs], depsSymlink: fs.realpathSync(deps), version: JSON.parse(fs.readFileSync(path.join(input, 'package.json'))).version,
  patchSha256: sha(path.join(own, 'tracked.patch')), newFilesSha256: sha(path.join(own, 'new-files.txt')),
  scope: '主树瞬时源码复制到自有 tmp，生产 tsc 自有输出；不绑定 Main GUI/bundle/服务',
})
fs.mkdirSync(pkg, { recursive: true })
for (const sub of ['src', 'scripts', 'locale']) fs.cpSync(path.join(input, sub), path.join(pkg, sub), { recursive: true })
for (const f of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'cordis.patch.yml']) fs.copyFileSync(path.join(input, f), path.join(pkg, f))
fs.symlinkSync(deps, path.join(pkg, 'node_modules'))
for (const f of ['worker.mjs', 'guard.mjs']) fs.copyFileSync(path.join(repo, 'docs/testing', prefix + '-' + f), path.join(pkg, f))
const copyInputs = files(pkg)
const copyBefore = Object.fromEntries(copyInputs.map(f => [path.relative(pkg, f), sha(f)]))
const copiedSourceMismatch = files(path.join(pkg, 'src')).filter(f => {
  const original = path.join(input, path.relative(pkg, f))
  return before[original]?.sha256 !== sha(f)
}).map(f => path.relative(pkg, f))
const env = {
  PATH: path.dirname(process.execPath) + ':/usr/bin:/bin:/usr/sbin:/sbin',
  HOME: path.join(own, 'home'), TMPDIR: path.join(own, 'tmp'), DSH_HOME: path.join(own, 'home/dsh'),
  DSH_PM_ISOLATED_ROOT: path.join(own, 'runtime'), PM_STORAGE_ROOT: path.join(own, 'runtime/data'),
  DSH_PM_FILE_ROOT: path.join(own, 'runtime/files'), DSH_PM_BACKUP_DIR: path.join(own, 'runtime/backups'),
  NODE_ENV: 'test', QA_OWN: own, QA_PACKAGE: pkg, QA_AUDIT: path.join(own, 'write-audit.ndjson'),
}
for (const d of [env.HOME, env.TMPDIR, env.DSH_HOME, env.DSH_PM_ISOLATED_ROOT, env.PM_STORAGE_ROOT, env.DSH_PM_FILE_ROOT, env.DSH_PM_BACKUP_DIR]) fs.mkdirSync(d, { recursive: true })
const commands = []
function execute(id, args, extra = {}) {
  const start = new Date().toISOString()
  const argv = ['--import', path.join(pkg, 'guard.mjs'), ...args]
  const r = spawnSync(process.execPath, argv, { cwd: pkg, env: { ...env, ...extra }, encoding: 'utf8',
    timeout: 180000, maxBuffer: 32 * 1024 * 1024 })
  fs.writeFileSync(path.join(own, id + '.stdout.txt'), r.stdout ?? '')
  fs.writeFileSync(path.join(own, id + '.stderr.txt'), r.stderr ?? '')
  const entry = { id, argv, cwd: pkg, start, end: new Date().toISOString(), exit: r.status, signal: r.signal,
    error: r.error ? String(r.error) : null, stdoutSha256: sha(path.join(own, id + '.stdout.txt')), stderrSha256: sha(path.join(own, id + '.stderr.txt')) }
  commands.push(entry)
  save(path.join(own, 'commands.json'), commands)
  console.log(`${id}: exit=${r.status}\n${(r.stdout ?? '').slice(-1800)}${(r.stderr ?? '').slice(-1800)}`)
  return r.status
}
console.log('自有 tmp：' + own)
const tscExit = execute('production-tsc-own', [path.join(deps, 'typescript/bin/tsc'), '-p', 'tsconfig.json'])
if (tscExit === 0) {
  execute('independent-domain', ['worker.mjs', 'domain'])
  if (fs.existsSync(path.join(own, 'expected.json'))) execute('independent-new-process', ['worker.mjs', 'reopen'])
  for (const script of ['verify-p0-integration', 'verify-p1-integration', 'verify-p2-integration', 'verify-p3-integration',
    'verify-ask-apply', 'verify-provenance', 'verify-provenance-disk', 'verify-ai-client', 'verify-copilot-plan',
    'verify-copilot-plan-cancel', 'verify-copilot-cancel', 'verify-p2a-export', 'verify-p2b-okr',
    'verify-p2c', 'verify-p3a']) {
    if (script === 'verify-p3a') {
      const original = fs.readFileSync(path.join(pkg, 'scripts/' + script + '.mjs'), 'utf8')
      const adapted = original.replaceAll('/tmp/p3a-verify.log', path.join(own, 'p3a-verify.log'))
      fs.writeFileSync(path.join(pkg, 'scripts/qa-verify-p3a.mjs'), adapted)
      save(path.join(own, 'p3a-fixture-adaptation.json'), { originalSha: hashText(original), adaptedSha: hashText(adapted),
        replacement: '仅固定 /tmp 日志路径到自有 tmp；业务断言无改动' })
      execute(script + '-owned-log', ['scripts/qa-verify-p3a.mjs'], { DSH_PM_ISOLATED_ROOT: '' })
    } else {
      execute(script, ['scripts/' + script + '.mjs'], { DSH_PM_ISOLATED_ROOT: '' })
      if (script === 'verify-p0-integration') {
        const original = fs.readFileSync(path.join(pkg, 'scripts/' + script + '.mjs'), 'utf8')
        const adapted = original.replaceAll('new (await import(\'node:fs\')).readdirSync', '(await import(\'node:fs\')).readdirSync')
        fs.writeFileSync(path.join(pkg, 'scripts/qa-verify-p0-integration.mjs'), adapted)
        save(path.join(own, 'p0-fixture-adaptation.json'), { originalSha: hashText(original), adaptedSha: hashText(adapted),
          replacement: '移除两处把 readdirSync 当构造器的 new；保留 sessions/reflections 目录非空断言' })
        execute(script + '-oracle-corrected', ['scripts/qa-verify-p0-integration.mjs'], { DSH_PM_ISOLATED_ROOT: '' })
      }
    }
  }
  const tests = ['provenance', 'provenance-store', 'provenance-view', 'copilot-validate', 'copilot-task-fields',
    'ask-context', 'ask-projection', 'ask-copilot-b7', 'queue', 'session-bind', 'capture', 'evidence', 'metric',
    'reflect', 'reflect-l2', 'check', 'load-stance', 'okr', 'habits', 'lessons', 'archive', 'review-materials', 'export-outbound']
    .map(n => `src/core/${n}.test.ts`).filter(f => fs.existsSync(path.join(pkg, f)))
  fs.writeFileSync(path.join(pkg, 'qa-vitest.config.mjs'), `export default { test: { environment: 'node', include: ${JSON.stringify(tests)}, cache: false, pool: 'forks', poolOptions: { forks: { singleFork: true } } } }\n`)
  execute('existing-unit-governance-growth', [path.join(deps, 'vitest/vitest.mjs'), 'run', '--config', 'qa-vitest.config.mjs'], { DSH_PM_ISOLATED_ROOT: '' })
}
const after = snapshot()
const drift = Object.keys(before).filter(f => before[f].sha256 !== after[f].sha256)
const copyAfter = Object.fromEntries(copyInputs.map(f => [path.relative(pkg, f), sha(f)]))
save(path.join(own, 'inputs-after.json'), after)
save(path.join(own, 'copy-before.json'), copyBefore)
save(path.join(own, 'copy-after.json'), copyAfter)
save(path.join(own, 'production-output.json'), Object.fromEntries(files(path.join(pkg, 'lib')).map(f => [path.relative(pkg, f), sha(f)])))
const audit = fs.existsSync(env.QA_AUDIT) ? fs.readFileSync(env.QA_AUDIT, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : []
const summary = { own, evidence, node: process.version, os: os.release(), arch: os.arch(), startInputs: Object.keys(before).length,
  dependencyCount: dependencyDirs.size, drift, copiedSourceMismatch,
  copiedInputDrift: Object.keys(copyBefore).filter(f => copyBefore[f] !== copyAfter[f]),
  writeOperations: audit.length, forbiddenWrites: audit.filter(r => !r.allowed), commands,
  status: '有限 AUTO；GUI/真实网络模型未执行；漂移逐接缝审签' }
save(path.join(own, 'execution.json'), summary)
fs.mkdirSync(evidence, { recursive: true })
for (const f of fs.readdirSync(own, { withFileTypes: true })) {
  if (f.isFile()) fs.copyFileSync(path.join(own, f.name), path.join(evidence, f.name))
  else if (/^F[567]-/.test(f.name)) fs.cpSync(path.join(own, f.name), path.join(evidence, f.name), { recursive: true })
}
for (const sub of ['src', 'scripts', 'locale']) fs.cpSync(path.join(pkg, sub), path.join(evidence, 'frozen-package', sub), { recursive: true })
for (const f of ['worker.mjs', 'guard.mjs', 'qa-vitest.config.mjs', 'package.json', 'tsconfig.json', 'pnpm-lock.yaml']) {
  fs.copyFileSync(path.join(pkg, f), path.join(evidence, 'frozen-package', f))
}
fs.copyFileSync(fileURLToPath(import.meta.url), path.join(evidence, 'runner.mjs'))
save(path.join(evidence, 'evidence-files.json'), Object.fromEntries(files(evidence).map(f => [path.relative(evidence, f), {
  sha256: sha(f), size: fs.statSync(f).size,
}])))
console.log(JSON.stringify(summary, null, 2))
process.exitCode = commands.some(c => c.exit !== 0) || summary.copiedInputDrift.length || summary.forbiddenWrites.length ? 1 : 0

function hashText(text) {
  return createHash('sha256').update(text).digest('hex')
}

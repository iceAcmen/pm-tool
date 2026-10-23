import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'governance-fix-independent-retest-20261021'
const original = 'governance-growth-independent-auto-20261021'
const input = path.join(repo, 'packages/dsh-pm-tool')
const deps = '/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const archive = path.join(repo, 'docs/testing', original + '-evidence', original + '-soAcAa')
const ownBase = path.join(repo, 'docs/testing', prefix + '-selftmp')
fs.mkdirSync(ownBase, { recursive: true })
const own = fs.mkdtempSync(path.join(ownBase, 'run-'))
const evidence = path.join(repo, 'docs/testing', prefix + '-evidence', path.basename(own))
const hash = v => createHash('sha256').update(v).digest('hex')
const sha = f => hash(fs.readFileSync(f))
const save = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n')
const files = dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  ['node_modules', '.git'].includes(e.name) ? [] : e.isDirectory() ? files(path.join(dir, e.name)) :
    e.isFile() ? [path.join(dir, e.name)] : []) : []
const manifest = dir => Object.fromEntries(files(dir).sort().map(f => [path.relative(dir, f), { sha256: sha(f), bytes: fs.statSync(f).size }]))
const git = (...args) => {
  const r = spawnSync('/usr/bin/git', args, { cwd: repo, encoding: 'utf8' })
  if (r.status !== 0) throw new Error(r.stderr)
  return r.stdout
}
const dependencies = new Set()
function dependency(name, from) {
  let dir = from
  for (;;) {
    const p = path.join(dir, 'node_modules', name, 'package.json')
    if (fs.existsSync(p)) { dir = fs.realpathSync(path.dirname(p)); break }
    const parent = path.dirname(dir)
    if (parent === dir) throw new Error('Missing installed dependency: ' + name)
    dir = parent
  }
  if (dependencies.has(dir)) return
  dependencies.add(dir)
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  for (const next of Object.keys(meta.dependencies ?? {})) dependency(next, dir)
}
for (const name of Object.keys(JSON.parse(fs.readFileSync(path.join(input, 'package.json'), 'utf8')).dependencies)) dependency(name, path.dirname(deps))
for (const name of ['typescript', 'vitest', '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage',
  '@deepseek-ai/dsh-storage-json', '@deepseek-ai/dsh-storage-domain', '@deepseek-ai/dsh-llm']) dependency(name, path.dirname(deps))
const depManifest = () => Object.fromEntries([...dependencies].sort().map(d => [d, manifest(d)]))
const sourceBefore = manifest(path.join(input, 'src'))
const depBefore = depManifest()
save(path.join(own, 'source-before.json'), sourceBefore)
save(path.join(own, 'dependencies-before.json'), depBefore)
fs.writeFileSync(path.join(own, 'tracked.patch'), git('diff', '--', 'packages/dsh-pm-tool'))
fs.writeFileSync(path.join(own, 'new-files.txt'), git('ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool'))
const contractFiles = ['AGENTS.md', 'docs/collaboration.md', 'reports/all-pending-acceptance-execution-20261021.md',
  'reports/governance-defects-developer-20261021.md',
  ...['report.md', 'fix-contract.md', 'worker.mjs', 'guard.mjs', 'run.mjs'].map(n => `docs/testing/${original}-${n}`)]
save(path.join(own, 'contract-inputs.json'), Object.fromEntries(contractFiles.map(f => [f, { sha256: sha(path.join(repo, f)) }])))
const unitFiles = ['provenance', 'provenance-store', 'provenance-view', 'copilot-validate', 'copilot-task-fields',
  'ask-context', 'ask-projection', 'ask-copilot-b7', 'queue', 'session-bind', 'capture', 'evidence', 'metric',
  'reflect', 'reflect-l2', 'check', 'load-stance', 'okr', 'habits', 'lessons', 'archive', 'review-materials', 'export-outbound']
  .map(n => `src/core/${n}.test.ts`)
const commands = []
const adaptations = []
console.log('SELFROOT=' + own)

function prepare(label, old) {
  const root = path.join(own, label)
  const pkg = path.join(root, 'package')
  fs.mkdirSync(pkg, { recursive: true })
  const source = old ? path.join(archive, 'frozen-package') : input
  for (const sub of ['src', 'scripts', 'locale']) fs.cpSync(path.join(source, sub), path.join(pkg, sub), { recursive: true })
  for (const f of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json']) fs.copyFileSync(path.join(source, f), path.join(pkg, f))
  fs.symlinkSync(deps, path.join(pkg, 'node_modules'))
  // The same final author test is independent input for both red and green.
  fs.copyFileSync(path.join(input, 'src/commands/ask-governance.test.ts'), path.join(pkg, 'src/commands/ask-governance.test.ts'))
  fs.copyFileSync(path.join(archive, 'frozen-package/worker.mjs'), path.join(pkg, 'worker.mjs'))
  fs.copyFileSync(path.join(archive, 'frozen-package/guard.mjs'), path.join(pkg, 'guard.mjs'))
  const before = manifest(path.join(pkg, 'src'))
  const copiedMismatch = old ? [] : Object.keys(sourceBefore).filter(f => before[f]?.sha256 !== sourceBefore[f].sha256)
  const env = {
    PATH: path.dirname(process.execPath) + ':/usr/bin:/bin:/usr/sbin:/sbin',
    HOME: path.join(root, 'home'), TMPDIR: path.join(root, 'tmp'), DSH_HOME: path.join(root, 'home/dsh'),
    DSH_PM_ISOLATED_ROOT: path.join(root, 'runtime'), PM_STORAGE_ROOT: path.join(root, 'runtime/data'),
    DSH_PM_FILE_ROOT: path.join(root, 'runtime/files'), DSH_PM_BACKUP_DIR: path.join(root, 'runtime/backups'),
    NODE_ENV: 'test', QA_OWN: root, QA_PACKAGE: pkg, QA_AUDIT: path.join(root, 'write-audit.ndjson'),
    PM_GOVERNANCE_TMP: path.join(root, 'cases'), XDG_CACHE_HOME: path.join(root, 'cache'),
  }
  for (const k of ['HOME', 'TMPDIR', 'DSH_HOME', 'DSH_PM_ISOLATED_ROOT', 'PM_STORAGE_ROOT',
    'DSH_PM_FILE_ROOT', 'DSH_PM_BACKUP_DIR', 'PM_GOVERNANCE_TMP', 'XDG_CACHE_HOME']) fs.mkdirSync(env[k], { recursive: true })
  save(path.join(root, 'candidate.json'), { label, old, head: git('rev-parse', 'HEAD').trim(),
    productBaseline: '2a7603023bc54ef13d788e50069ee3fde4671bf3', source: before, sourceOriginal: source,
    copiedMismatch, dependencyRoot: deps, dependencyRealpath: fs.realpathSync(deps), dependencyCount: dependencies.size,
    trackedPatchSha256: sha(path.join(own, 'tracked.patch')), newFilesSha256: sha(path.join(own, 'new-files.txt')),
    workerSha256: sha(path.join(pkg, 'worker.mjs')), guardSha256: sha(path.join(pkg, 'guard.mjs')),
    same13Sha256: sha(path.join(pkg, 'src/commands/ask-governance.test.ts')), env,
    scope: '独立 SOURCE/AUTO；selfonly tsc，非 Main build/GUI/dirty 总门' })
  return { label, root, pkg, env, before, copiedMismatch }
}
function run(p, id, args, extra = {}) {
  const start = new Date().toISOString()
  const argv = ['--import', path.join(p.pkg, 'guard.mjs'), ...args]
  const r = spawnSync(process.execPath, argv, { cwd: p.pkg, env: { ...p.env, ...extra }, encoding: 'utf8',
    timeout: 240000, maxBuffer: 48 * 1024 * 1024 })
  const name = p.label + '-' + id
  fs.writeFileSync(path.join(p.root, id + '.stdout.txt'), r.stdout ?? '')
  fs.writeFileSync(path.join(p.root, id + '.stderr.txt'), r.stderr ?? '')
  const entry = { name, executable: process.execPath, argv, cwd: p.pkg, start, end: new Date().toISOString(),
    exit: r.status, signal: r.signal, error: r.error?.message ?? null,
    stdoutSha256: sha(path.join(p.root, id + '.stdout.txt')), stderrSha256: sha(path.join(p.root, id + '.stderr.txt')) }
  commands.push(entry)
  save(path.join(own, 'commands.json'), commands)
  console.log(`${name}: exit=${r.status}\n${(r.stdout ?? '').slice(-2400)}${(r.stderr ?? '').slice(-2400)}`)
  return r.status
}
function adapted(p, target, text, why, originalPath) {
  const destination = path.join(p.pkg, target)
  fs.writeFileSync(destination, text)
  adaptations.push({ phase: p.label, target, why, originalPath,
    originalSha256: originalPath ? sha(originalPath) : null, adaptedSha256: sha(destination) })
  save(path.join(own, 'adaptations.json'), adaptations)
}
function same13(p) {
  const ts = createRequire(path.join(p.pkg, 'package.json'))('typescript')
  const src = fs.readFileSync(path.join(p.pkg, 'src/commands/ask-governance.test.ts'), 'utf8')
  fs.writeFileSync(path.join(p.pkg, 'lib/commands/ask-governance.test.js'), ts.transpileModule(src, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText)
  save(path.join(p.pkg, 'governance-typecheck.json'), {
    extends: './tsconfig.json', compilerOptions: { noEmit: true },
    include: ['src/commands/ask-governance.test.ts'], exclude: [],
  })
  run(p, 'same13-typecheck', [path.join(deps, 'typescript/bin/tsc'), '-p', 'governance-typecheck.json'])
  fs.writeFileSync(path.join(p.pkg, 'same13.config.mjs'),
    "export default { test: { environment: 'node', include: ['lib/commands/ask-governance.test.js'], cache: false } }\n")
  run(p, 'same13', [path.join(deps, 'vitest/vitest.mjs'), 'run', '--config', 'same13.config.mjs', '--no-cache', '--maxWorkers=1', '--minWorkers=1'])
}
const phases = []
const corrected = process.argv[2] === 'corrected'
const redOnly = process.argv[2] === 'red-only'
const phaseList = corrected ? [['green-corrected', false]] : redOnly ? [['red-original', true]] : [['red-original', true], ['green-current', false]]
for (const [label, old] of phaseList) {
  const p = prepare(label, old)
  phases.push(p)
  if (p.copiedMismatch.length) throw new Error('Freeze drift: ' + p.copiedMismatch.join(','))
  if (run(p, 'production-tsc', [path.join(deps, 'typescript/bin/tsc'), '-p', 'tsconfig.json']) !== 0) continue
  if (corrected) {
    const originalPath = path.join(p.pkg, 'worker.mjs')
    const originalText = fs.readFileSync(originalPath, 'utf8')
    const updated = originalText
      .replace("    const y = await task('确认独立目标', C)", "    const y = await task('确认独立目标', C)\n    const originalX = rec('tasks', x.id)")
      .replace("assert.equal(rec('tasks', x.id).assignee, undefined)", "assert.deepEqual(rec('tasks', x.id), originalX)")
    if (updated === originalText || !updated.includes('const originalX')) throw new Error('Oracle adaptation marker missing')
    adapted(p, 'owned-worker.mjs', updated,
      '保原 worker exit1；current addTask schema 初态 assignee 空串合法，捕获首步前完整 JSON 并深相等，强于写死 undefined', originalPath)
    const diff = spawnSync('/usr/bin/git', ['diff', '--no-index', '--', originalPath, path.join(p.pkg, 'owned-worker.mjs')],
      { encoding: 'utf8' })
    fs.writeFileSync(path.join(p.root, 'worker-adaptation.patch'), diff.stdout)
  }
  const worker = corrected ? 'owned-worker.mjs' : 'worker.mjs'
  run(p, 'original-worker-domain', [worker, 'domain'])
  if (fs.existsSync(path.join(p.root, 'expected.json'))) run(p, 'original-worker-reopen', [worker, 'reopen'])
  same13(p)
  if (!old) {
    const test = fs.readFileSync(path.join(p.pkg, 'src/commands/ask-governance.test.ts'), 'utf8')
    const bodyPath = path.join(repo, 'docs/testing', prefix + '-extra-body.ts')
    const body = fs.readFileSync(bodyPath, 'utf8')
    const at = test.lastIndexOf('\n})')
    if (at < 0) throw new Error('Test suite closing marker missing')
    adapted(p, 'src/commands/independent-extra.test.ts', test.slice(0, at) + '\n' + body + test.slice(at),
      '只在自有副本追加独立负例，复用合法真实 Context/JSON setup，不改同13原件', path.join(p.pkg, 'src/commands/ask-governance.test.ts'))
    const ts = createRequire(path.join(p.pkg, 'package.json'))('typescript')
    fs.writeFileSync(path.join(p.pkg, 'lib/commands/independent-extra.test.js'), ts.transpileModule(
      fs.readFileSync(path.join(p.pkg, 'src/commands/independent-extra.test.ts'), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
      }).outputText)
    fs.writeFileSync(path.join(p.pkg, 'extra.config.mjs'),
      "export default { test: { environment: 'node', include: ['lib/commands/independent-extra.test.js'], cache: false } }\n")
    run(p, 'independent-extra', [path.join(deps, 'vitest/vitest.mjs'), 'run', '--config', 'extra.config.mjs', '--no-cache', '--maxWorkers=1', '--minWorkers=1'])
    fs.writeFileSync(path.join(p.pkg, 'units.config.mjs'),
      `export default { test: { environment: 'node', include: ${JSON.stringify(unitFiles)}, cache: false } }\n`)
    run(p, 'governance-units23', [path.join(deps, 'vitest/vitest.mjs'), 'run', '--config', 'units.config.mjs', '--no-cache', '--maxWorkers=1', '--minWorkers=1'],
      { DSH_PM_ISOLATED_ROOT: '' })
    for (const n of ['p0-integration', 'p1-integration', 'p2-integration', 'p3-integration', 'ask-apply', 'provenance',
      'provenance-disk', 'ai-client', 'copilot-plan', 'copilot-plan-cancel', 'copilot-cancel', 'p2a-export', 'p2b-okr', 'p2c', 'p3a']) {
      const name = 'verify-' + n
      const originalPath = path.join(p.pkg, 'scripts', name + '.mjs')
      if (n === 'p3a') {
        adapted(p, 'scripts/owned-' + name + '.mjs', fs.readFileSync(originalPath, 'utf8')
          .replaceAll('/tmp/p3a-verify.log', path.join(p.root, 'p3a-verify.log')), '仅固定日志路径改为自有根，原断言保留', originalPath)
        run(p, name + '-owned', ['scripts/owned-' + name + '.mjs'], { DSH_PM_ISOLATED_ROOT: '' })
      } else {
        run(p, name, ['scripts/' + name + '.mjs'], { DSH_PM_ISOLATED_ROOT: '' })
        if (n === 'p0-integration') {
          adapted(p, 'scripts/owned-' + name + '.mjs', fs.readFileSync(originalPath, 'utf8')
            .replaceAll("new (await import('node:fs')).readdirSync", "(await import('node:fs')).readdirSync"),
          '保原设施失败；仅纠正两处 readdirSync 构造器 oracle，非空 sessions/reflections 断言保留', originalPath)
          run(p, name + '-oracle-corrected', ['scripts/owned-' + name + '.mjs'], { DSH_PM_ISOLATED_ROOT: '' })
        }
      }
    }
    const fixturePath = path.join(repo, 'docs/testing', prefix + '-fixture.mjs')
    fs.copyFileSync(fixturePath, path.join(p.pkg, 'fixture.mjs'))
    run(p, 'F6-standard-path-empty-restore', ['fixture.mjs'])
  }
  save(path.join(p.root, 'source-after.json'), manifest(path.join(p.pkg, 'src')))
  save(path.join(p.root, 'production-output.json'), manifest(path.join(p.pkg, 'lib')))
}
const sourceAfter = manifest(path.join(input, 'src'))
const depAfter = depManifest()
save(path.join(own, 'source-after.json'), sourceAfter)
save(path.join(own, 'dependencies-after.json'), depAfter)
const sourceDrift = [...new Set([...Object.keys(sourceBefore), ...Object.keys(sourceAfter)])]
  .filter(f => sourceBefore[f]?.sha256 !== sourceAfter[f]?.sha256)
const dependencyDrift = [...dependencies].flatMap(d => [...new Set([...Object.keys(depBefore[d]), ...Object.keys(depAfter[d])])]
  .filter(f => depBefore[d][f]?.sha256 !== depAfter[d][f]?.sha256).map(f => path.join(d, f)))
const audits = phases.flatMap(p => {
  const f = path.join(p.root, 'write-audit.ndjson')
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : []
})
const summary = { own, evidence, node: process.version, os: os.release(), arch: os.arch(), sourceDrift, dependencyDrift,
  writeOperations: audits.length, forbiddenWrites: audits.filter(r => !r.allowed), commands,
  phases: phases.map(p => ({ label: p.label, root: p.root, copiedMismatch: p.copiedMismatch })),
  status: '原红保留；新源结论另审 exact probes；GUI/模型不在本执行范围' }
const greenFailed = commands.filter(c => c.name.startsWith('green-') && c.exit !== 0 && !/^green-.+-verify-p0-integration$/.test(c.name))
const plannedExit = (redOnly && commands.some(c => c.exit !== 0)) || greenFailed.length || dependencyDrift.length || summary.forbiddenWrites.length ? 1 : 0
save(path.join(own, 'planned-outer-exit.json'), { plannedExit, greenFailed: greenFailed.map(c => c.name),
  note: '预计退出码；实际外层退出由 supervisor 原证记录，不以本字段替代 observed exit' })
save(path.join(own, 'execution.json'), summary)
fs.mkdirSync(evidence, { recursive: true })
for (const f of fs.readdirSync(own, { withFileTypes: true })) {
  if (f.isFile()) fs.copyFileSync(path.join(own, f.name), path.join(evidence, f.name))
  else if (phases.some(p => p.label === f.name)) {
    const phaseRoot = path.join(own, f.name)
    for (const item of fs.readdirSync(phaseRoot, { withFileTypes: true })) {
      if (item.name === 'package') {
        for (const sub of ['src', 'scripts', 'locale']) fs.cpSync(path.join(phaseRoot, 'package', sub),
          path.join(evidence, f.name, 'frozen-package', sub), { recursive: true })
        for (const single of fs.readdirSync(path.join(phaseRoot, 'package'), { withFileTypes: true }).filter(e => e.isFile())) {
          fs.copyFileSync(path.join(phaseRoot, 'package', single.name), path.join(evidence, f.name, 'frozen-package', single.name))
        }
      } else if (!['home', 'tmp', 'cache'].includes(item.name)) fs.cpSync(path.join(phaseRoot, item.name),
        path.join(evidence, f.name, item.name), { recursive: true })
    }
  }
}
fs.copyFileSync(fileURLToPath(import.meta.url), path.join(evidence, 'runner.mjs'))
save(path.join(evidence, 'evidence-files.json'), manifest(evidence))
console.log(JSON.stringify({ own, evidence, sourceDrift, dependencyDrift, forbiddenWrites: summary.forbiddenWrites }, null, 2))
process.exitCode = plannedExit

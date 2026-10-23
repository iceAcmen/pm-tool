// 精确产品认领与独立红绿复验；不执行 package build/install。
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'objective-number-independent-retest-20261021'
const base = path.join(repo, 'docs/testing', prefix)
const pkgRel = 'packages/dsh-pm-tool'
const pkg = path.join(repo, pkgRel)
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const baseline = '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd'
const productBase = '2a7603023bc54ef13d788e50069ee3fde4671bf3'
const ts = createRequire(path.join(deps, 'typescript/package.json'))('typescript')
const hash = data => createHash('sha256').update(data).digest('hex')
const sha = file => hash(fs.readFileSync(file))
const save = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
const ownedParent = base + '-selftmp'
fs.mkdirSync(ownedParent, { recursive: true })
const own = fs.mkdtempSync(path.join(ownedParent, 'run-'))
const archive = path.join(base + '-evidence', path.basename(own))
fs.mkdirSync(archive, { recursive: true })
const products = ['src/client/views/tasks.tsx', 'src/client/views/tasks.css',
  'src/client/views/overview.tsx', 'src/client/views/gantt.tsx', 'src/core/task.ts']
const newTests = ['src/client/views/objective-consumers.test.tsx',
  'src/core/task-evidence-protocol.test.ts', 'src/client/views/tasks-number-feedback.test.tsx']
const tests = [...newTests,
  'src/core/progress-meta.test.ts', 'src/core/progress-clamp.test.ts',
  'src/core/gantt.criticalPath.test.ts', 'src/core/gantt.routeEdge.test.ts', 'src/core/gantt.milestoneLink.test.ts',
  'src/core/task-inline.test.ts', 'src/commands/task-feedback.test.ts',
  'src/client/views/tasks-contract.test.ts', 'src/client/views/overview-contract.test.ts',
  'src/client/views/tasks-tally.test.ts', 'src/client/views/tasks-responsive.test.ts',
  'src/client/views/tasks-clipboard.test.ts']
const fixtures = ['docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2.json',
  'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json']
const configs = ['package.json', 'pnpm-lock.yaml', 'vitest.config.ts', 'tsconfig.json']
const inputs = new Map()
const importEdges = []
function capture(file) {
  if (!inputs.has(file)) {
    const data = fs.readFileSync(file)
    const s = fs.statSync(file)
    inputs.set(file, { data, identity: { sha256: hash(data), size: s.size, mtimeMs: s.mtimeMs } })
  }
  return inputs.get(file).data
}
function localClosure(file) {
  if (inputs.has(file)) return
  const bytes = capture(file)
  if (!/\.[cm]?[jt]sx?$/.test(file)) return
  for (const { fileName: spec } of ts.preProcessFile(bytes.toString(), true, true).importedFiles) {
    if (!spec.startsWith('.')) continue
    const raw = path.resolve(path.dirname(file), spec.split('?')[0])
    const options = [raw, raw.replace(/\.js$/, '.ts'), raw.replace(/\.js$/, '.tsx'),
      raw.replace(/\.mjs$/, '.mts'), raw + '.ts', raw + '.tsx', path.join(raw, 'index.ts')]
    const resolved = options.find(f => fs.existsSync(f) && fs.statSync(f).isFile())
    assert.ok(resolved, `本地导入未冻结 ${file} ${spec}`)
    assert.ok(resolved.startsWith(pkg + '/'), `导入越产品根 ${resolved}`)
    importEdges.push({ from: path.relative(pkg, file), spec, to: path.relative(pkg, resolved) })
    localClosure(resolved)
  }
}
for (const rel of [...products, ...tests]) localClosure(path.join(pkg, rel))
localClosure(path.join(pkg, 'src/commands/task.ts'))
for (const rel of ['src/client/assets.d.ts', 'src/types/react-grid-layout.d.ts', ...configs]) capture(path.join(pkg, rel))
for (const rel of fixtures) capture(path.join(repo, rel))
for (const suffix of ['-run.mjs', '-guard.mjs', '-boundary.test.tsx']) capture(base + suffix)
const publicSources = ['AGENTS.md', 'docs/collaboration.md', 'docs/decision-log.md',
  'reports/all-pending-acceptance-execution-20261021.md',
  'reports/objective-defects-developer-20261021.md',
  'docs/testing/objective-independent-auto-20261021.md',
  'docs/testing/remaining-objective-cases-20261021.md',
  'docs/testing/gui-numbers-habit-dark-review-20261021.md']
for (const rel of publicSources) capture(path.join(repo, rel))
function dependencySnapshot() {
  const result = {}
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      const rel = path.relative(deps, file)
      if (entry.isDirectory()) walk(file)
      else if (entry.isSymbolicLink()) {
        result[rel] = { link: fs.readlinkSync(file), realpath: fs.realpathSync(file) }
      } else if (entry.isFile()) {
        const s = fs.statSync(file)
        result[rel] = { sha256: sha(file), size: s.size, mtimeMs: s.mtimeMs }
      }
    }
  }
  walk(deps)
  return result
}
const dependencyBefore = dependencySnapshot()
save(path.join(archive, 'dependencies-before.json'), dependencyBefore)
const before = Object.fromEntries([...inputs].map(([file, x]) => [file, x.identity]))
save(path.join(archive, 'inputs-before.json'), before)
save(path.join(archive, 'import-edges.json'), importEdges)
const git = args => {
  const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}
const patch = git(['diff', '--', ...products.map(rel => pkgRel + '/' + rel)])
fs.writeFileSync(path.join(archive, 'five-products.patch'), patch)
const candidate = {
  at: new Date().toISOString(), baseline, productBase, actualHead: git(['rev-parse', 'HEAD']).trim(),
  version: JSON.parse(capture(path.join(pkg, 'package.json'))).version,
  products: Object.fromEntries(products.map(rel => [rel, before[path.join(pkg, rel)]])),
  newTests: Object.fromEntries(newTests.map(rel => [rel, before[path.join(pkg, rel)]])),
  configs: Object.fromEntries(configs.map(rel => [rel, before[path.join(pkg, rel)]])),
  patchSha256: hash(patch), dependencyRoot: deps, dependencyEntries: Object.keys(dependencyBefore).length,
  dependencySnapshotSha256: sha(path.join(archive, 'dependencies-before.json')),
  scope: '八文件候选；其余只作实际相关依赖，不认领整棵dirty树，不含panel/产物/实例/GUI',
}
save(path.join(archive, 'candidate.json'), candidate)
function makeCopy(label) {
  const root = path.join(own, label)
  const copyPkg = path.join(root, pkgRel)
  for (const [file, { data }] of inputs) {
    let dest
    if (file.startsWith(pkg + '/')) dest = path.join(copyPkg, path.relative(pkg, file))
    else if (fixtures.includes(path.relative(repo, file))) dest = path.join(root, path.relative(repo, file))
    if (!dest) continue
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, data)
  }
  fs.symlinkSync(deps, path.join(copyPkg, 'node_modules'), 'dir')
  fs.writeFileSync(path.join(copyPkg, 'src/client/views/independent-boundary.test.tsx'),
    capture(base + '-boundary.test.tsx'))
  return { root, copyPkg }
}
const current = makeCopy('current')
const old = makeCopy('old')
for (const rel of products) {
  const data = git(['show', `${baseline}:${pkgRel}/${rel}`])
  fs.writeFileSync(path.join(old.copyPkg, rel), data)
}
save(path.join(archive, 'old-products.json'), Object.fromEntries(products.map(rel => [rel, sha(path.join(old.copyPkg, rel))])))
const guard = path.join(own, 'guard.mjs')
fs.writeFileSync(guard, capture(base + '-guard.mjs'))
const commands = []
function execute(id, copy, args, timeout = 120000) {
  const runtime = path.join(own, 'runtime', id)
  fs.mkdirSync(runtime, { recursive: true })
  const env = {
    PATH: path.dirname(process.execPath) + ':/usr/bin:/bin',
    HOME: runtime, TMPDIR: runtime, DSH_HOME: path.join(runtime, 'dsh'),
    DSH_PM_ISOLATED_ROOT: runtime, DSH_PM_FILE_ROOT: path.join(runtime, 'files'),
    DSH_PM_BACKUP_DIR: path.join(runtime, 'backups'), PM_STORAGE_ROOT: path.join(runtime, 'storage'),
    NODE_ENV: 'test', NODE_OPTIONS: `--import=${guard}`,
    QA_OWN: own, QA_AUDIT: path.join(own, 'write-audit.ndjson'),
    QA_EVIDENCE: path.join(runtime, 'boundary-events.ndjson'),
    QA_FIXTURE: path.join(copy.root, fixtures[0]), QA_BACKUP: path.join(copy.root, fixtures[1]),
    LANG: 'en_US.UTF-8',
  }
  const started = new Date().toISOString()
  const result = spawnSync(process.execPath, args, {
    cwd: copy.copyPkg, env, encoding: 'utf8', timeout, maxBuffer: 24 * 1024 * 1024,
  })
  fs.writeFileSync(path.join(archive, id + '.stdout.txt'), result.stdout ?? '')
  fs.writeFileSync(path.join(archive, id + '.stderr.txt'), result.stderr ?? '')
  const jsonOutput = path.join(own, id + '.vitest.json')
  if (fs.existsSync(jsonOutput)) fs.copyFileSync(jsonOutput, path.join(archive, id + '.vitest.json'))
  if (fs.existsSync(env.QA_EVIDENCE)) fs.copyFileSync(env.QA_EVIDENCE, path.join(archive, id + '.events.ndjson'))
  const command = { id, executable: process.execPath, argv: args, cwd: copy.copyPkg, env,
    started, ended: new Date().toISOString(), exit: result.status, signal: result.signal,
    error: result.error ? String(result.error) : null,
    stdoutSha256: sha(path.join(archive, id + '.stdout.txt')),
    stderrSha256: sha(path.join(archive, id + '.stderr.txt')) }
  commands.push(command)
  save(path.join(archive, 'commands.json'), commands)
  console.log(`${id}: exit=${result.status}; ${String(result.stdout).slice(-1600)}; ${String(result.stderr).slice(-900)}`)
}
function vitest(id, copy, selection) {
  execute(id, copy, ['node_modules/vitest/vitest.mjs', 'run', ...selection,
    '--maxWorkers=1', '--minWorkers=1', '--no-cache', '--reporter=verbose',
    '--reporter=json', `--outputFile=${path.join(own, id + '.vitest.json')}`])
}
vitest('current-developer-15', current, tests)
vitest('old-same-new-tests', old, [...newTests, 'src/client/views/tasks-clipboard.test.ts'])
vitest('current-independent-boundary', current, ['src/client/views/independent-boundary.test.tsx'])
const compileConfig = {
  extends: './tsconfig.json',
  compilerOptions: { outDir: path.join(own, 'compile'), declarationDir: path.join(own, 'compile/types') },
  include: products.filter(rel => rel.endsWith('.ts') || rel.endsWith('.tsx'))
    .concat(['src/commands/task.ts', 'src/client/assets.d.ts', 'src/types/react-grid-layout.d.ts']),
}
save(path.join(current.copyPkg, 'independent-compile.json'), compileConfig)
execute('related-production-compile', current,
  ['node_modules/typescript/bin/tsc', '-p', 'independent-compile.json'], 120000)
const after = Object.fromEntries([...inputs].map(([file]) => {
  const s = fs.statSync(file)
  return [file, { sha256: sha(file), size: s.size, mtimeMs: s.mtimeMs }]
}))
save(path.join(archive, 'inputs-after.json'), after)
const dependencyAfter = dependencySnapshot()
save(path.join(archive, 'dependencies-after.json'), dependencyAfter)
const changed = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const changes = changed(before, after)
const dependencyChanges = changed(dependencyBefore, dependencyAfter)
const ownProductHashes = Object.fromEntries([...products, ...newTests].map(rel => [rel, sha(path.join(current.copyPkg, rel))]))
save(path.join(archive, 'frozen-copy-eight.json'), ownProductHashes)
if (fs.existsSync(path.join(own, 'write-audit.ndjson')))
  fs.copyFileSync(path.join(own, 'write-audit.ndjson'), path.join(archive, 'write-audit.ndjson'))
const audit = fs.existsSync(path.join(archive, 'write-audit.ndjson'))
  ? fs.readFileSync(path.join(archive, 'write-audit.ndjson'), 'utf8').trim().split('\n').map(x => JSON.parse(x)) : []
const result = {
  own, archive, at: new Date().toISOString(), os: os.release(), arch: os.arch(), node: process.version,
  candidate, commands, changes, dependencyChanges, frozenCopyEight: ownProductHashes,
  writeOperations: audit.length, rejectedOutsideOwn: audit.filter(x => !x.allowed),
  scope: 'SOURCE/AUTO有限复验；不关闭GUI、完整OP/GNHD门；旧同测试exit1为预期红测',
}
save(path.join(archive, 'execution.json'), result)
save(base + '-latest.json', { archive, own, at: result.at })
console.log(JSON.stringify({ archive, exits: commands.map(c => [c.id, c.exit]),
  changes, dependencyChanges, rejectedOutsideOwn: result.rejectedOutsideOwn.length }, null, 2))
process.exitCode = commands.filter(c => c.id !== 'old-same-new-tests').some(c => c.exit !== 0) ||
  commands.find(c => c.id === 'old-same-new-tests')?.exit !== 1 || dependencyChanges.length ||
  changes.some(f => f.startsWith(pkg + '/')) || result.rejectedOutsideOwn.length ? 1 : 0

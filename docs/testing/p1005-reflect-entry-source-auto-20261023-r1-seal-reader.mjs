import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve, dirname, relative, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'

// 只封存本轮证据；不启动产品或开发执行器。广域监测变化与反思输入失效分别登记。
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'docs/testing/p1005-reflect-entry-source-auto-20261023-r1'
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const state = json(join(repo, `${prefix}-state.json`))
const evidence = json(join(repo, `${prefix}-evidence.json`))
const devSeal = json(join(repo, 'docs/plans/2026-10-23-p1005-event-reflect-entry-seal.json'))
const hash = path => {
  const data = readFileSync(path)
  return { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length }
}
const same = (a, b) => a?.sha256 === b?.sha256 && a?.bytes === b?.bytes
const check = (value, message) => { if (!value) throw new Error(message) }
function safe(root, path) {
  check(!isAbsolute(path) && !path.split('/').includes('..'), `越界：${path}`)
  return join(root, path)
}
function files(root, prefix = '') {
  return readdirSync(join(root, prefix), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'node_modules' || e.name === '.git' || e.isSymbolicLink()) return []
    const path = prefix ? `${prefix}/${e.name}` : e.name
    return e.isDirectory() ? files(root, path) : [path]
  }).sort()
}
const manifest = (root, paths = files(root)) => paths.map(path => ({ path, ...hash(safe(root, path)) }))
function drift(root, rows) {
  return rows.flatMap(before => {
    const file = safe(root, before.path)
    const after = existsSync(file) ? { path: before.path, ...hash(file) } : null
    return same(before, after) ? [] : [{ path: before.path, before, after }]
  })
}

const inputRoot = join(state.root, 'inputs')
const graph = new Map()
function imports(path) {
  if (graph.has(path)) return
  const text = readFileSync(safe(inputRoot, path), 'utf8')
  const refs = [
    ...text.matchAll(/\b(?:from|import)\s*['"](\.[^'"]+)['"]/g),
    ...text.matchAll(/\bimport\s*\(\s*['"](\.[^'"]+)['"]/g),
  ].map(m => m[1])
  const targets = [...new Set(refs.map(ref => {
    const base = resolve(inputRoot, dirname(path), ref)
    const options = [base, base.replace(/\.js$/, '.ts'), base.replace(/\.js$/, '.tsx')]
    const target = options.find(p => existsSync(p))
    check(target, `静态本地引用未解析：${path} → ${ref}`)
    const result = relative(inputRoot, target)
    safe(inputRoot, result)
    return result
  }))].sort()
  graph.set(path, targets)
  targets.forEach(imports)
}
for (const suite of Object.values(state.suites)) suite.forEach(imports)
check(![...graph.keys()].some(p => /\/archive(?:\.|\/)/.test(p)), 'archive进入反思静态输入图，不能豁免')

const repoDrift = drift(repo, state.protectedInputs)
const knownUnrelated = new Set([
  'packages/dsh-pm-tool/src/core/archive.ts',
  'packages/dsh-pm-tool/src/core/archive.test.ts',
  'packages/dsh-pm-tool/src/client/panel.tsx',
  'packages/dsh-pm-tool/src/client/views/records/records-listbox.tsx',
  'packages/dsh-pm-tool/src/client/views/records/records-deliverable-pointer-dom.test.tsx',
  'docs/changelog.md', 'docs/progress.md', 'docs/handoff.md', 'docs/onboarding-prompt.md',
])
const nonTargetDrift = repoDrift.filter(row => knownUnrelated.has(row.path)).map(row => ({
  ...row,
  reason: row.path.includes('/archive')
    ? '本轮冻结输入的静态import/from及字面量dynamic-import图不含archive；原专项未选择archive，不作该功能结论'
    : '共享非目标文件；非本轮反思handler/storage输入，未写入或验收',
}))
const relevantDrift = repoDrift.filter(row => !knownUnrelated.has(row.path))
const dependencyDrift = state.dependencies.packages.flatMap(p =>
  drift(p.root, p.files).map(row => ({ package: p.name, root: p.root, ...row })))
const inputDrift = drift(inputRoot, state.inputManifest)
const configDrift = drift(join(state.root, 'config'), state.configManifest)
const nodeDrift = !same(state.node, hash(state.node.path))
const developerOutputDrift = drift(devSeal.root, devSeal.outputs)
const artifactDrift = drift(repo, devSeal.repoArtifacts)
const sourceAdditions = files(join(repo, 'packages/dsh-pm-tool/src'))
  .map(p => `packages/dsh-pm-tool/src/${p}`).filter(p => !state.sourcePaths.includes(p))
  .map(path => ({ path, ...hash(join(repo, path)) }))
const testSummary = evidence.runs.map(r => ({
  label: r.label, pid: r.receipt.pid, exit: r.receipt.exit, total: r.vitest.numTotalTests,
  passed: r.vitest.numPassedTests, failed: r.vitest.numFailedTests, pending: r.vitest.numPendingTests,
}))
const stdoutDrift = evidence.runs.filter(r =>
  !same(r.receipt.stdout, hash(join(state.root, 'output', `${r.label}.stdout.log`)))
  || !same(r.receipt.stderr, hash(join(state.root, 'output', `${r.label}.stderr.log`))))
const good = relevantDrift.length === 0 && dependencyDrift.length === 0 && inputDrift.length === 0
  && configDrift.length === 0 && !nodeDrift && developerOutputDrift.length === 0
  && artifactDrift.length === 0 && stdoutDrift.length === 0
  && testSummary.every(r => r.exit === 0 && r.total === r.passed && r.failed === 0 && !r.pending)
const owned = readdirSync(join(repo, 'docs/testing')).filter(p =>
  p.startsWith('p1005-reflect-entry-source-auto-20261023-r1') && !p.endsWith('-seal.json'))
  .map(p => `docs/testing/${p}`).sort()
const trailingWhitespace = owned.filter(p => /\.(?:mjs|ts|md)$/.test(p)).flatMap(path =>
  readFileSync(join(repo, path), 'utf8').split('\n').flatMap((line, index) =>
    /[ \t]+$/.test(line) ? [{ path, line: index + 1 }] : []))
const missingLinks = [...readFileSync(join(repo, `${prefix}-report.md`), 'utf8')
  .matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(m => m[1])
  .filter(p => !p.includes('://') && !p.endsWith('-seal.json'))
  .filter(p => !existsSync(resolve(repo, 'docs/testing', p)))
const sealed = good && trailingWhitespace.length === 0 && missingLinks.length === 0
const result = {
  at: new Date().toISOString(), scope: evidence.scope, root: state.root,
  sealStatus: sealed ? 'PASS（SOURCE/AUTO限定输入及字节封存）' : 'FAIL（见字段）',
  protectedCount: state.protectedInputs.length, repoDrift, nonTargetDrift, relevantDrift, sourceAdditions,
  staticLocalImportGraph: Object.fromEntries(graph), staticGraphCount: graph.size,
  inputDrift, configDrift, nodeDrift, dependencyDrift, dependencyPackages: state.dependencies.packages.length,
  dependencyFileCount: state.dependencies.packages.reduce((n, p) => n + p.files.length, 0),
  developerOutputRecheck: { count: devSeal.outputs.length, drift: developerOutputDrift },
  developerArtifactDrift: artifactDrift, testSummary, stdoutDrift, trailingWhitespace, missingLinks,
  artifacts: manifest(repo, owned), temporaryOutputs: manifest(state.root),
  adaptation: '仅新增独立内置seal-reader区分广域非目标archive并行变化；原runner、158隔离输入、测试断言/配置/日志未改，不重跑任何专项',
  boundary: '不是全树/全盘无变；static graph是辅助SOURCE范围索引，不冒运行module trace。GUI及父门未签。',
  released: sealed, stopped: true,
}
const output = join(repo, `${prefix}-seal.json`)
check(!existsSync(output), '拒绝覆盖既有seal')
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ sealStatus: result.sealStatus, testSummary, nonTargetDrift, relevantDrift,
  dependencyDrift: dependencyDrift.length, inputDrift, sourceAdditions, staticGraphCount: graph.size,
  released: result.released, STOP: true }, null, 2))
process.exitCode = sealed ? 0 : 1

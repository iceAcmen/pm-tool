import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import ts from '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/typescript/lib/typescript.js'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'governance-growth-independent-auto-20261021'
const own = '/private/tmp/' + prefix + '-soAcAa'
const pkg = path.join(own, 'packages/dsh-pm-tool')
const evidence = path.join(repo, 'docs/testing', prefix + '-evidence', path.basename(own))
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const digest = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const save = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n')
const list = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? list(path.join(dir, e.name)) : e.isFile() ? [path.join(dir, e.name)] : [])
const before = read(path.join(evidence, 'inputs-before.json'))
const candidate = read(path.join(evidence, 'candidate.json'))
const sourcePrefix = path.join(repo, 'packages/dsh-pm-tool') + '/'
const env = {
  PATH: path.dirname(process.execPath) + ':/usr/bin:/bin:/usr/sbin:/sbin',
  HOME: path.join(own, 'home'), TMPDIR: path.join(own, 'tmp'), DSH_HOME: path.join(own, 'home/dsh'),
  DSH_PM_ISOLATED_ROOT: '', PM_STORAGE_ROOT: path.join(own, 'runtime/data'),
  DSH_PM_FILE_ROOT: path.join(own, 'runtime/files'), DSH_PM_BACKUP_DIR: path.join(own, 'runtime/backups'),
  NODE_ENV: 'test', QA_OWN: own, QA_PACKAGE: pkg, QA_AUDIT: path.join(own, 'p0-final-write-audit.ndjson'),
}
const originalPath = path.join(evidence, 'frozen-package/scripts/verify-p0-integration.mjs')
const original = fs.readFileSync(originalPath, 'utf8')
const needle = "new (await import('node:fs')).readdirSync"
assert.equal(original.split(needle).length - 1, 2)
const adaptedPath = path.join(pkg, 'scripts/qa-verify-p0-integration-final.mjs')
fs.writeFileSync(adaptedPath, original.replaceAll(needle, "(await import('node:fs')).readdirSync"))
const argv = ['--import', path.join(pkg, 'guard.mjs'), 'scripts/qa-verify-p0-integration-final.mjs']
const start = new Date().toISOString()
const run = spawnSync(process.execPath, argv, { cwd: pkg, env, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024 })
for (const stream of ['stdout', 'stderr']) fs.writeFileSync(path.join(evidence, 'p0-final.' + stream + '.txt'), run[stream] ?? '')
fs.copyFileSync(adaptedPath, path.join(evidence, 'p0-final-adapted.mjs'))
fs.copyFileSync(env.QA_AUDIT, path.join(evidence, 'p0-final-write-audit.ndjson'))
const audit = fs.readFileSync(env.QA_AUDIT, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
save(path.join(evidence, 'p0-final-execution.json'), {
  argv, cwd: pkg, env, start, end: new Date().toISOString(), exit: run.status, signal: run.signal,
  error: run.error ? String(run.error) : null, originalSha256: digest(originalPath), adaptedSha256: digest(adaptedPath),
  adaptation: '仅移除 sessions/reflections 两处构造器 new，所有业务/落盘断言原样；主树原件未改',
  writes: audit.length, refusedWriteAttempts: audit.filter(r => !r.allowed),
})
console.log('p0-final: exit=' + run.status + '\n' + (run.stdout ?? '').slice(-1600))

// 通过编译后 ESM 的 AST 求实际运行依赖，而不是把所有 client 漂移当成领域失效。
const seen = new Set()
const external = new Set()
function imports(file) {
  if (seen.has(file)) return
  seen.add(file)
  const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  const follow = specifier => {
    if (!specifier.startsWith('.')) { external.add(specifier); return }
    const target = path.resolve(path.dirname(file), specifier)
    assert.ok(fs.existsSync(target), '实际运行依赖缺失：' + target)
    imports(target)
  }
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) follow(node.moduleSpecifier.text)
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length && ts.isStringLiteral(node.arguments[0])) follow(node.arguments[0].text)
    ts.forEachChild(node, visit)
  }
  visit(ast)
}
imports(path.join(pkg, 'worker.mjs'))
const executedSources = [...seen].filter(f => f.startsWith(path.join(pkg, 'lib') + '/')).map(f => {
  const basename = path.relative(path.join(pkg, 'lib'), f).replace(/\.js$/, '')
  return ['src/' + basename + '.ts', 'src/' + basename + '.tsx'].find(f => fs.existsSync(path.join(pkg, f)))
}).filter(Boolean).sort()
const unitConfig = fs.readFileSync(path.join(pkg, 'qa-vitest.config.mjs'), 'utf8')
const unitFiles = [...unitConfig.matchAll(/"([^"]+\.test\.ts)"/g)].map(m => m[1])
const currentDrift = Object.keys(before).filter(f => before[f].sha256 !== (fs.existsSync(f) ? digest(f) : null))
const relevantDrift = currentDrift.filter(f => f.startsWith(sourcePrefix) &&
  (executedSources.includes(path.relative(sourcePrefix, f)) || unitFiles.includes(path.relative(sourcePrefix, f))))
const dependencyDrift = currentDrift.filter(f => f.startsWith('/private/tmp/pmtool-all-closure-20261021/'))
const runtimeSources = Object.fromEntries(executedSources.map(f => [f, {
  frozenSha256: digest(path.join(evidence, 'frozen-package', f)),
  currentSha256: fs.existsSync(path.join(repo, 'packages/dsh-pm-tool', f)) ? digest(path.join(repo, 'packages/dsh-pm-tool', f)) : null,
}]))
save(path.join(evidence, 'dependency-scope-final.json'), {
  at: new Date().toISOString(), runtimeSources, unitFiles, runtimeEmittedFiles: [...seen].map(f => path.relative(pkg, f)).sort(),
  externalImports: [...external].sort(), originalDependencyClosure: candidate.dependencies,
  allRecordedInputDrift: currentDrift, relevantDrift, dependencyDrift,
  notClaimed: 'ESM运行闭包+本轮23个unit入口；不是Main bundle/GUI/动态外部插件完整调用图。新增文件未在inputs-before内不自动构成失败，但新候选须重新认领。',
})

const results = read(path.join(evidence, 'domain-results.json'))
const groups = [['RA-AI', 6], ['RA-P00', 8], ['RA-P10', 6], ['RA-P20', 7], ['RA-P30', 5]]
const ids = groups.flatMap(([p, count]) => Array.from({ length: count }, (_, i) => p + (p === 'RA-AI' ? String(i + 1).padStart(2, '0') : String(i + 1).padStart(2, '0'))))
const states = ids.map(id => {
  const probes = results.filter(r => r.id === id)
  assert.ok(probes.length, 'ID 未执行：' + id)
  return { id, auto: probes.some(r => r.status === 'FAIL') ? 'FAIL' : probes.some(r => r.status === 'BLOCKED') ? 'BLOCKED' : 'PASS_LIMITED',
    probes, gui: 'NOT_RUN', guiReason: '待Main同候选原证，本专家禁止MainGUI', owner: id === 'RA-AI06' ? 'CONDITIONAL_NOT_REQUESTED' : 'NOT_APPLICABLE',
    realNetworkModel: id === 'RA-AI06' ? 'MAIN_NOT_RUN' : 'NOT_APPLICABLE',
    currentInheritance: relevantDrift.length || dependencyDrift.length ? 'REVIEW_REQUIRED' : '仅冻结有限领域AUTO，不含Main产物/GUI' }
})
save(path.join(evidence, 'id-status.json'), states)
save(path.join(evidence, 'final-summary.json'), {
  candidate: candidate.id, head: candidate.head, node: process.version, at: new Date().toISOString(),
  probes: { pass: results.filter(r => r.status === 'PASS').length, fail: results.filter(r => r.status === 'FAIL').length,
    blocked: results.filter(r => r.status === 'BLOCKED').length }, ids: { passLimited: states.filter(r => r.auto === 'PASS_LIMITED').length,
    fail: states.filter(r => r.auto === 'FAIL').length, guiNotRun: states.length }, p0FinalExit: run.status,
  relevantDrift, dependencyDrift, overall: 'FAIL：四个确证产品缺陷；GUI与真实网络模型待Main，非整门PASS',
})
fs.copyFileSync(fileURLToPath(import.meta.url), path.join(evidence, 'finalizer.mjs'))
save(path.join(evidence, 'supplement-evidence-files.json'), Object.fromEntries(list(evidence).filter(f => !f.endsWith('/supplement-evidence-files.json')).map(f => [path.relative(evidence, f), { sha256: digest(f), size: fs.statSync(f).size }])))
console.log(JSON.stringify(read(path.join(evidence, 'final-summary.json')), null, 2))
process.exitCode = run.status !== 0 || relevantDrift.length || dependencyDrift.length ? 1 : 0

import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(dir, '../..')
const prefix = 'governance-fix-independent-retest-20261021'
const runName = 'run-2ACog5'
const own = path.join(dir, prefix + '-selftmp', runName)
const root = path.join(own, 'green-corrected')
const pkg = path.join(root, 'package')
const evidence = path.join(dir, prefix + '-evidence', runName)
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const save = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n')
const files = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  ['node_modules', '.git'].includes(e.name) ? [] : e.isDirectory() ? files(path.join(d, e.name)) :
    e.isFile() ? [path.join(d, e.name)] : [])
const candidate = read(path.join(root, 'candidate.json'))
const env = { ...candidate.env, QA_AUDIT: path.join(root, 'supplement-write-audit.ndjson') }
const commands = []
function execute(id, args) {
  const argv = ['--import', path.join(pkg, 'guard.mjs'), ...args]
  const start = new Date().toISOString()
  const r = spawnSync(process.execPath, argv, { cwd: pkg, env, encoding: 'utf8', timeout: 240000, maxBuffer: 32 * 1024 * 1024 })
  fs.writeFileSync(path.join(root, id + '.stdout.txt'), r.stdout ?? '')
  fs.writeFileSync(path.join(root, id + '.stderr.txt'), r.stderr ?? '')
  commands.push({ id, executable: process.execPath, argv, cwd: pkg, start, end: new Date().toISOString(),
    exit: r.status, signal: r.signal, error: r.error?.message ?? null,
    stdoutSha256: sha(path.join(root, id + '.stdout.txt')), stderrSha256: sha(path.join(root, id + '.stderr.txt')) })
  save(path.join(root, 'supplement-commands.json'), commands)
  console.log(id + ': exit=' + r.status + '\n' + r.stdout + r.stderr)
}
fs.copyFileSync(path.join(dir, prefix + '-backup-probe.mjs'), path.join(pkg, 'backup-probe.mjs'))
execute('F6-command-preview-reject-confirm', ['backup-probe.mjs'])
save(path.join(pkg, 'extra-typecheck.json'), { extends: './tsconfig.json', compilerOptions: { noEmit: true },
  include: ['src/commands/independent-extra.test.ts'], exclude: [] })
execute('independent-extra-typecheck', [path.join(candidate.dependencyRoot, 'typescript/bin/tsc'), '-p', 'extra-typecheck.json'])

const ts = createRequire(path.join(pkg, 'package.json'))('typescript')
const seen = new Set()
const external = new Set()
function follow(file) {
  if (seen.has(file)) return
  seen.add(file)
  const tree = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  const next = specifier => {
    if (!specifier.startsWith('.')) { external.add(specifier); return }
    const target = path.resolve(path.dirname(file), specifier)
    assert.ok(fs.existsSync(target), 'runtime dependency absent: ' + target)
    follow(target)
  }
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) next(node.moduleSpecifier.text)
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length && ts.isStringLiteral(node.arguments[0])) next(node.arguments[0].text)
    ts.forEachChild(node, visit)
  }
  visit(tree)
}
for (const f of ['owned-worker.mjs', 'fixture.mjs', 'backup-probe.mjs', 'lib/commands/ask-governance.test.js',
  'lib/commands/independent-extra.test.js']) follow(path.join(pkg, f))
const runtimeSources = Object.fromEntries([...seen].filter(f => f.startsWith(path.join(pkg, 'lib') + '/')).flatMap(f => {
  const base = path.relative(path.join(pkg, 'lib'), f).replace(/\.js$/, '')
  const rel = ['src/' + base + '.ts', 'src/' + base + '.tsx'].find(r => fs.existsSync(path.join(pkg, r)))
  if (!rel || rel.endsWith('.test.ts')) return []
  const current = path.join(repo, 'packages/dsh-pm-tool', rel)
  return [[rel, { frozenSha256: sha(path.join(pkg, rel)), currentSha256: fs.existsSync(current) ? sha(current) : null }]]
}).sort(([a], [b]) => a.localeCompare(b)))
const relevantDrift = Object.entries(runtimeSources).filter(([, v]) => v.frozenSha256 !== v.currentSha256).map(([f]) => f)
const beforeDeps = read(path.join(own, 'dependencies-before.json'))
const depDrift = Object.entries(beforeDeps).flatMap(([d, entries]) => Object.entries(entries).filter(([f, v]) =>
  !fs.existsSync(path.join(d, f)) || sha(path.join(d, f)) !== v.sha256).map(([f]) => path.join(d, f)))
const first = read(path.join(dir, prefix + '-selftmp/run-yKDVQA/source-before.json'))
const second = read(path.join(own, 'source-before.json'))
const interRoundDrift = [...new Set([...Object.keys(first), ...Object.keys(second)])]
  .filter(f => first[f]?.sha256 !== second[f]?.sha256).map(f => ({ file: f, before: first[f] ?? null, after: second[f] ?? null }))
const old = read(path.join(dir, 'governance-growth-independent-auto-20261021-evidence/governance-growth-independent-auto-20261021-soAcAa/id-status.json'))
const probes = read(path.join(root, 'domain-results.json'))
const affected = new Set(['RA-AI01', 'RA-AI02', 'RA-AI03', 'RA-AI04', 'RA-AI05', 'RA-P0001', 'RA-P0002', 'RA-P0003',
  'RA-P0004', 'RA-P0007', 'RA-P1001', 'RA-P1002', 'RA-P1003', 'RA-P1004', 'RA-P1005', 'RA-P1006',
  'RA-P2002', 'RA-P2005', 'RA-P3003'])
const states = old.map(prior => {
  const current = probes.filter(p => p.id === prior.id)
  assert.ok(current.length)
  assert.ok(current.every(p => p.status === 'PASS'), prior.id + ' is not green')
  return { id: prior.id, oldAuto: prior.auto, auto: 'PASS_LIMITED', candidate: runName,
    inheritance: affected.has(prior.id) ? 'AFFECTED_OLD_INTEGRATION_SUPERSEDED_BY_EXACT_NEW_TEST' : 'OLD_FROZEN_LEAF_SCOPE_RETAINED_AND_NEW_COMMAND_RETESTED',
    probes: current, gui: 'NOT_RUN', guiReason: '本授权禁止 GUI，待 Main 同候选原证',
    realNetworkModel: prior.id === 'RA-AI06' ? 'MAIN_NOT_RUN' : 'NOT_APPLICABLE',
    owner: prior.id === 'RA-AI06' ? 'CONDITIONAL_NOT_REQUESTED' : 'NOT_APPLICABLE',
    excluded: prior.id === 'RA-AI06' ? '真实网络模型、busy/cancel GUI/120s' :
      prior.id === 'RA-P2005' ? 'board/people/客观进度 GUI 与完整消费链由 Main/OP 分工，非本门' :
      prior.id === 'RA-P0005' ? 'sessions 不入标准 backup；只有原库新进程回读' :
      prior.id === 'RA-P3003' ? '14天与多月 GUI 折叠未执行' : '完整 GUI/样式/UX 与合同非前置深故障/并发不在本 AUTO 子断言' }
})
save(path.join(dir, prefix + '-id-status.json'), states)
const scope = { at: new Date().toISOString(), runtimeSources, runtimeEmittedFiles: [...seen].map(f => path.relative(pkg, f)).sort(),
  externalImports: [...external].sort(), dependencyCount: Object.keys(beforeDeps).length,
  dependencyInputFiles: Object.values(beforeDeps).reduce((n, entries) => n + Object.keys(entries).length, 0),
  relevantDrift, depDrift, interRoundDrift, candidateSource: candidate.source,
  meaning: 'ESM AST 静态/字面量 dynamic import 闭包及真实 worker 调用；非全 GUI/宿主运行图，不宣称所有 import 分支被执行' }
save(path.join(root, 'dependency-scope-final.json'), scope)
const audit = readAudit('write-audit.ndjson').concat(readAudit('supplement-write-audit.ndjson'))
function readAudit(name) {
  const f = path.join(root, name)
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : []
}
const originalGuard = path.join(dir, 'governance-growth-independent-auto-20261021-evidence/governance-growth-independent-auto-20261021-soAcAa/frozen-package/guard.mjs')
assert.equal(sha(path.join(pkg, 'guard.mjs')), sha(originalGuard))
const probeSource = path.join(dir, prefix + '-backup-probe.mjs')
assert.equal(sha(path.join(pkg, 'backup-probe.mjs')), sha(probeSource))
const archivePhase = path.join(evidence, 'green-corrected')
for (const file of files(root)) {
  const rel = path.relative(root, file)
  if (rel.startsWith('package/') || rel.startsWith('home/') || rel.startsWith('tmp/') || rel.startsWith('cache/')) continue
  const dest = path.join(archivePhase, rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(file, dest)
}
for (const f of ['backup-probe.mjs', 'extra-typecheck.json']) fs.copyFileSync(path.join(pkg, f), path.join(archivePhase, 'frozen-package', f))
save(path.join(evidence, 'supplement-evidence-files.json'), Object.fromEntries(files(evidence)
  .filter(f => !f.endsWith('/supplement-evidence-files.json')).map(f => [path.relative(evidence, f), { sha256: sha(f), bytes: fs.statSync(f).size }])))
const processes = spawnSync('/bin/ps', ['-axo', 'pid,ppid,args'], { encoding: 'utf8' })
const ownedProcesses = processes.stdout.split('\n').filter(line => line.includes(prefix) &&
  !line.includes('finalize.mjs') && !line.includes('grep'))
const result = { at: new Date().toISOString(), candidate: runName, commands, domain: { pass: probes.filter(p => p.status === 'PASS').length,
  fail: probes.filter(p => p.status === 'FAIL').length, blocked: probes.filter(p => p.status === 'BLOCKED').length },
  ids: { limitedPass: states.length, guiNotRun: states.length, model: 'MAIN_NOT_RUN' },
  sourceDrift: relevantDrift, dependencyDrift: depDrift, interRoundDrift,
  writes: audit.length, forbiddenWrites: audit.filter(r => !r.allowed), ownedProcesses,
  scope: 'GG 四缺陷与逐32ID列出 AUTO 子断言；非全部dirty/GUI/发布 PASS' }
save(path.join(dir, prefix + '-audit-result.json'), result)
console.log(JSON.stringify({ candidate: runName, domain: result.domain, ids: result.ids, runtimeSources: Object.keys(runtimeSources).length,
  relevantDrift, depDrift, interRoundDrift, forbiddenWrites: result.forbiddenWrites, ownedProcesses }, null, 2))
process.exitCode = commands.some(c => c.exit !== 0) || relevantDrift.length || depDrift.length || result.forbiddenWrites.length ? 1 : 0

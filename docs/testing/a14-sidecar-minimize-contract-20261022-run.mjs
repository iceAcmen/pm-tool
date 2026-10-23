import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a14-sidecar-minimize-contract-20261022'
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const self = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
assert(!existsSync(self), '原证不可覆盖；请用新的rN')
const frozen = join(self, 'frozen')
const pkg = join(frozen, 'packages/dsh-pm-tool')
const a12 = '/private/tmp/pmtool-a12-closure-20261021'
const deps = join(a12, 'packages/dsh-pm-tool/node_modules')
const evidence = join(repo, 'reports/all-pending-evidence-20261021/A14/governance/mixed-r4')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const manifestPath = join(repo, 'reports/all-pending-evidence-20261021/A12/candidate.json')
const manifest = json(manifestPath)
const parts = ['packages/dsh-pm-tool/src/client/panel.tsx',
  'packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx']
function inventory(root, timestamps = false) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(path) {
    const st = lstatSync(path)
    if (st.isSymbolicLink()) return
    if (st.isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name))
    else result[relative(root, path) || '.'] = {
      sha256: hash(readFileSync(path)), bytes: st.size, ...(timestamps ? { mtimeMs: st.mtimeMs } : {}),
    }
  }
  walk(root)
  return result
}
const diff = (before, after) => [...new Set([...Object.keys(before), ...Object.keys(after)])]
  .filter(path => JSON.stringify(before[path]) !== JSON.stringify(after[path]))
function save(name, value) {
  const path = resolve(self, name)
  assert(path.startsWith(`${self}/`), '写根越界')
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
function git(args) {
  const result = spawnSync('/usr/bin/git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}
const hashes = paths => Object.fromEntries(paths.map(path => [path, hash(readFileSync(path))]))
const declaredA12 = { ...manifest.sourceHashes, ...manifest.artifacts }
function checkA12() {
  const errors = []
  for (const [path, expected] of Object.entries(declaredA12)) {
    if (!existsSync(join(a12, path)) || hash(readFileSync(join(a12, path))) !== expected) errors.push(path)
  }
  return errors
}
assert.deepEqual(checkA12(), [], 'A12声明输入/产物漂移')
const patch = join(repo, 'reports/all-pending-evidence-20261021/A12/product-tracked.patch')
assert.equal(hash(readFileSync(patch)), manifest.trackedPatchSha)
const depsNames = ['react', 'react-test-renderer', 'vitest', 'lucide-react']
for (const name of depsNames) assert(existsSync(join(deps, name, 'package.json')), `缺依赖 ${name}；不得安装`)
const dependencyRoots = Object.fromEntries(depsNames.map(name => [name, realpathSync(join(deps, name))]))
const depsBefore = Object.fromEntries(Object.entries(dependencyRoots).map(([name, path]) => [name, inventory(path)]))
const a12LibBefore = inventory(join(a12, 'packages/dsh-pm-tool/lib'), true)
const mainLibBefore = inventory(join(repo, 'packages/dsh-pm-tool/lib'), true)
const caches = [join(repo, 'packages/dsh-pm-tool/node_modules'), deps].flatMap(root =>
  ['.vite', '.cache', '.vite-temp'].map(name => join(root, name)))
const cacheBefore = Object.fromEntries(caches.map(path => [path, inventory(path, true)]))
const evidenceBefore = inventory(evidence)
const liveBefore = hashes(parts.map(path => join(repo, path)))
const inputPaths = [manifestPath, patch, join(repo, 'AGENTS.md'), join(repo, 'docs/collaboration.md'),
  join(repo, 'docs/testing/remaining-governance-cases-20261021.md'),
  join(repo, 'docs/testing/a13-gateway-clean-undo-gui-review-20261021.md'),
  ...['plan.md', 'cases.test.tsx', 'run.mjs'].map(name => join(repo, 'docs/testing', `${prefix}-${name}`)),
  ...['source-binding.json', 'environment.json', 'loaded-r1/result.json'].map(name =>
    join(repo, 'reports/all-pending-evidence-20261021/A13/gateway', name))]
const inputsBefore = hashes(inputPaths)
mkdirSync(self, { recursive: true, mode: 0o700 })
cpSync(join(a12, 'packages/dsh-pm-tool/src'), join(pkg, 'src'), { recursive: true })
cpSync(join(a12, 'packages/dsh-pm-tool/package.json'), join(pkg, 'package.json'))
cpSync(join(a12, 'packages/dsh-pm-tool/tsconfig.json'), join(pkg, 'tsconfig.json'))
for (const name of ['plan.md', 'cases.test.tsx', 'run.mjs']) {
  const dest = join(frozen, 'docs/testing', `${prefix}-${name}`)
  mkdirSync(dirname(dest), { recursive: true })
  cpSync(join(repo, 'docs/testing', `${prefix}-${name}`), dest)
}
symlinkSync(deps, join(pkg, 'node_modules'), 'dir')
symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
const frozenBefore = inventory(join(pkg, 'src'))
const sourceBefore = inventory(join(a12, 'packages/dsh-pm-tool/src'))
assert.deepEqual(frozenBefore, sourceBefore)
save('main-tracked.patch', git(['diff', '--binary', 'HEAD', '--', 'packages/dsh-pm-tool']))
const newSourceFiles = git(['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool/src'])
  .trim().split('\n').filter(Boolean)
save('candidate.json', {
  at: new Date().toISOString(), role: '独立测试专家', actualCandidate: 'A12',
  baseline: manifest.baseline, currentHead: git(['rev-parse', 'HEAD']).trim(),
  trackedPatchSha: manifest.trackedPatchSha, manifestSha256: hash(readFileSync(manifestPath)),
  sourceCount: Object.keys(manifest.sourceHashes).length, artifactCount: Object.keys(manifest.artifacts).length,
  sourceTreeSha256: hash(JSON.stringify(sourceBefore)), declaredA12,
  mainNewSources: newSourceFiles.map(path => ({ path, sha256: hash(readFileSync(join(repo, path))) })),
  mainRelevant: parts.map(path => ({ path, a12: hash(readFileSync(join(a12, path))),
    main: liveBefore[join(repo, path)], matches: hash(readFileSync(join(a12, path))) === liveBefore[join(repo, path)] })),
  inputsBefore, evidenceBefore,
  environment: { node: process.version, executable: process.execPath, os: os.release(), arch: os.arch() },
  dependencies: Object.fromEntries(depsNames.map(name => [name, {
    root: dependencyRoots[name], version: json(join(deps, name, 'package.json')).version,
  }])),
  writesOnly: self, noBuildInstallGuiServicesCredentialsCommit: true,
})

const events = name => json(join(evidence, name)).map(x => x.event)
const apply = events('apply-command-events.json')
const finish = events('finish/command-events.json')
const done = (seq, list = apply) => {
  const event = list.find(x => x.seq === seq && x.type === 'command/done')
  assert(event, `缺done ${seq}`)
  assert.equal(event.data.kind, 'success')
  return event.data.text
}
const rawTask = name => json(join(evidence, name)).record
const appliedTasks = ['t1', 't2'].map(n => rawTask(`applied-${n}.json`))
const initialTasks = ['t1', 't2'].map(n => rawTask(`initial-${n}.json`))
const snapshot = JSON.parse(done(32, finish))
const undo = JSON.parse(done(24)).undoIds[0]
const newLedger = json(join(evidence, 'applied-ledger.json')).record.value.entries.find(e => e.undo?.handle === undo.id)
assert(newLedger, 'fresh handle不对应本轮ledger')
assert.equal(newLedger.undo.used, false)
assert.equal(newLedger.undo.postimages.length, 3)
assert.deepEqual(newLedger.undo.postimages.map(p => p.id), ['t-0001', 't-0001', 't-0002'])
assert.equal(done(22).startsWith('已应用 3 步'), true)
const updateRun = finish.find(e => e.seq === 29)
assert.equal(updateRun.type, 'command/run')
assert.equal(updateRun.data.source.kind, 'user')
const taskPayload = JSON.parse(updateRun.data.args.trim().slice('task update t-0001 '.length))
assert.equal(taskPayload.assignee, '外部人工改派保留')
assert.match(done(30, finish), /负责人：混合撤销测试甲 → 外部人工改派保留/)
const savedT1 = rawTask('finish/saved-t1.json')
const savedT2 = rawTask('finish/saved-t2.json')
assert.deepEqual(snapshot.tasks.find(t => t.id === 't-0001'), savedT1)
assert.deepEqual(snapshot.tasks.find(t => t.id === 't-0002'), savedT2)
assert.equal(savedT1.assignee, taskPayload.assignee)
assert.equal(savedT1.progress, 73)
for (const field of ['attachments', 'progressLog']) assert.deepEqual(savedT1[field], appliedTasks[0][field])
const bytesEqual = (a, b) => readFileSync(join(evidence, a)).equals(readFileSync(join(evidence, b)))
assert(bytesEqual('applied-t2.json', 'finish/saved-t2.json'))
assert(bytesEqual('finish/before-save-ledger.json', 'finish/saved-ledger.json'))
const allEvents = [...apply, ...finish,
  ...events('undo-command-events.json'), ...events('undo-r2/undo-command-events.json'), ...events('undo-r3/command-events.json')]
const undoRuns = allEvents.filter(e => e.type === 'command/run' && /^\s*ask-undo(?!\s+list)/.test(e.data.args ?? ''))
assert.deepEqual(undoRuns, [], '原区间竟有undo执行；不得误报未执行')
const observedNames = ['applied.json', 'external-correct-draft.json', 'minimized-save-reachable.json',
  'finish/draft.json', 'finish/save-visible.json', 'finish/saved.json', 'finish/after-expand.json']
const observed = Object.fromEntries(observedNames.map(n => [n, json(join(evidence, n))]))
for (const value of Object.values(observed)) {
  assert.equal(value.origin, 'http://127.0.0.1:3241')
  assert.equal(value.timeOrigin, 1792616867623)
}
const expandedAt = Date.parse(observed['finish/after-expand.json'].at)
assert(expandedAt < newLedger.undo.expiresAt, '展开时已过期，不支持本归因')
assert.match(observed['applied.json'].pm.text, /撤销 · 整批 3 步/)
assert(!observed['finish/after-expand.json'].pm.text.includes('撤销 · 整批 3 步'))
let checkedFrames = 0
for (const path of Object.keys(evidenceBefore).filter(p => p.endsWith('frames.json'))) {
  const frameManifest = json(join(evidence, path))
  for (const frame of frameManifest.frames) {
    assert.equal(hash(readFileSync(join(evidence, dirname(path), frame.file))), frame.sha256)
    checkedFrames++
  }
}
const originalExits = Object.fromEntries(['apply-exit.json', 'undo-exit.json',
  'undo-r2/undo-exit.json', 'undo-r3/exit.json', 'finish/exit.json'].map(n => [n, json(join(evidence, n))]))
save('evidence-audit.json', { originalExits, updateSeq: [29, 30], snapshotSeq: [31, 32],
  modelStatusSeq: [33, 34], undoRuns, freshHandle: undo.id, ledgerId: newLedger.id,
  expiresAt: newLedger.undo.expiresAt, expandedAt, remainingMsAtExpand: newLedger.undo.expiresAt - expandedAt,
  checkedFrames, savedT1, savedT2, preservedLedgerBytes: true,
  boundary: '原事件/字节/帧hash核验，不等全帧目视/服务端handle当前存活或mixed算法验收' })
save('replay-input.json', {
  snapshot, initialTasks, appliedTasks, askText: done(20), applyText: done(22),
  updateText: done(30, finish), modelStatus: done(34, finish), provenance: done(28),
  transportOnlyDouble: true, undoHandleReplacedByInertTestValue: true,
})
for (const name of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(self, name))
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(self, 'home'), TMPDIR: join(self, 'tmp'), XDG_CACHE_HOME: join(self, 'cache'),
  CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1',
  DSH_HOME: join(self, 'runtime'), A14_REPLAY_INPUT: join(self, 'replay-input.json'),
  A14_OBSERVATIONS: join(self, 'observations.jsonl'),
}
save('vitest.config.mjs', `export default ${JSON.stringify({
  root: frozen, cacheDir: join(self, 'cache/vite'),
  test: { environment: 'node', cache: false, include: [`docs/testing/${prefix}-cases.test.tsx`],
    pool: 'forks', maxWorkers: 1, minWorkers: 1, testTimeout: 15000 },
}, null, 2)}\n`)
const executions = []
function execute(label, pattern) {
  const args = [join(deps, 'vitest/vitest.mjs'), 'run', '--config', join(self, 'vitest.config.mjs'),
    '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(self, `${label}.result.json`),
    '--testNamePattern', pattern]
  const start = new Date().toISOString()
  const result = spawnSync(process.execPath, args, { cwd: frozen, env, encoding: 'utf8',
    timeout: 90000, maxBuffer: 32 * 1024 * 1024 })
  save(`${label}.stdout.log`, result.stdout ?? '')
  save(`${label}.stderr.log`, result.stderr ?? '')
  const record = { label, argv: [process.execPath, ...args], cwd: frozen, env, start,
    end: new Date().toISOString(), originalExit: result.status, signal: result.signal, error: result.error?.message }
  save(`${label}.command.json`, record)
  executions.push(record)
  console.log(JSON.stringify({ label, originalExit: result.status, signal: result.signal }))
}
execute('base', '^BASE')
if (executions[0].originalExit === 0) {
  for (const [label, pattern] of [['undo-red', 'SM-A01'], ['form-red', 'SM-A02'], ['draft-red', 'SM-A03']]) execute(label, pattern)
} else console.log('BLOCKED: 控制/加载未绿，不执行产品红例')
const audit = {
  a12DeclaredDrift: checkA12(),
  frozenSourceDrift: diff(frozenBefore, inventory(join(pkg, 'src'))),
  originalEvidenceDrift: diff(evidenceBefore, inventory(evidence)),
  inputDrift: diff(inputsBefore, hashes(inputPaths)),
  mainRelevantDrift: diff(liveBefore, hashes(parts.map(path => join(repo, path)))),
  dependencyDrift: depsNames.filter(name => diff(depsBefore[name], inventory(dependencyRoots[name])).length),
  a12LibDrift: diff(a12LibBefore, inventory(join(a12, 'packages/dsh-pm-tool/lib'), true)),
  mainLibDrift: diff(mainLibBefore, inventory(join(repo, 'packages/dsh-pm-tool/lib'), true)),
  publicCacheDrift: caches.filter(path => diff(cacheBefore[path], inventory(path, true)).length),
  boundary: '仅所列A12输入/产物、原证、相关主源码、4依赖与公共lib/cache；非全机零污染声明',
}
save('audit.json', audit)
save('summary.json', { executions, audit, finishedAt: new Date().toISOString(),
  completeIndependentRAAI04: false, guiExecutedByThisExpert: false, productPass: false })
console.log(JSON.stringify(audit))
process.exitCode = executions.some(e => e.originalExit !== 0)
  || Object.entries(audit).some(([key, value]) => key !== 'boundary' && value.length) ? 1 : 0

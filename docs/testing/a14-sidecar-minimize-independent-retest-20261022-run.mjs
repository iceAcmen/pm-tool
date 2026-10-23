import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync,
  realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a14-sidecar-minimize-independent-retest-20261022'
const expert = 'a14-sidecar-minimize-contract-20261022'
const developer = 'a14-sidecar-minimize-developer-20261022'
const round = process.argv[2] ?? 'r1'
const phase = process.argv[3] ?? 'prepare'
assert.match(round, /^r[1-9]\d*$/)
assert(['prepare', 'run', 'finalize'].includes(phase))
const self = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
const packagePath = 'packages/dsh-pm-tool'
const r3 = join(repo, 'docs/testing', `${expert}-selftmp/r3`)
const dev = join(repo, 'reports', `${developer}-selftmp`)
const a12 = '/private/tmp/pmtool-a12-closure-20261021'
const deps = join(a12, packagePath, 'node_modules')
const original = join(repo, 'docs/testing', `${expert}-cases.test.tsx`)
const evidence = join(repo, 'reports/all-pending-evidence-20261021/A14/governance/mixed-r4')
const owned = ['src/client/panel.tsx', 'src/client/panel.css', 'src/client/sidecar-minimize-retention.test.tsx']
const hash = x => createHash('sha256').update(x).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const hfile = p => hash(readFileSync(p))
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(p => JSON.stringify(a[p]) !== JSON.stringify(b[p]))
function inventory(base, times = false) {
  const out = {}
  if (!existsSync(base)) return out
  function walk(p) {
    const stat = lstatSync(p)
    const key = relative(base, p) || '.'
    if (stat.isSymbolicLink()) out[key] = { link: readlinkSync(p), ...(times ? { mtimeMs: stat.mtimeMs } : {}) }
    else if (stat.isDirectory()) for (const name of readdirSync(p).sort()) walk(join(p, name))
    else out[key] = { sha256: hfile(p), bytes: stat.size, ...(times ? { mtimeMs: stat.mtimeMs } : {}) }
  }
  walk(base)
  return out
}
function save(name, value) {
  const p = resolve(self, name)
  assert(p.startsWith(`${self}/`), '本次写根越界')
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function git(args) {
  const result = spawnSync('/usr/bin/git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}
function inputFiles() {
  return [
    'AGENTS.md', 'docs/collaboration.md', `docs/testing/${expert}.md`,
    `docs/testing/${expert}-cases.test.tsx`, `docs/testing/${expert}-run.mjs`,
    `docs/testing/${expert}-plan.md`, `docs/testing/${expert}-final-r1.json`,
    'docs/plans/2026-10-22-sidecar-minimize-closure.md', `reports/${developer}.md`,
    `reports/${developer}-run.mjs`,
    'reports/all-pending-evidence-20261021/A11/candidate.json',
    'reports/all-pending-evidence-20261021/A12/candidate.json',
    'reports/all-pending-evidence-20261021/A12/product-tracked.patch',
    'reports/all-pending-evidence-20261021/A13/candidate-final.json',
    'reports/all-pending-evidence-20261021/A13/environment-final.json',
    `docs/testing/${prefix}-boundary-cases.test.tsx`,
    `docs/testing/${prefix}-run.mjs`,
  ]
}
function protectionRoots() {
  const physicalDeps = realpathSync(join(deps, 'react')).split('/.pnpm/')[0] + '/.pnpm'
  return {
    mainSource: join(repo, packagePath, 'src'),
    mainLib: join(repo, packagePath, 'lib'),
    a11Lib: '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/lib',
    a12Lib: join(a12, packagePath, 'lib'),
    a13Lib: '/private/tmp/pmtool-a13-closure-20261022/packages/dsh-pm-tool/lib',
    a12Source: join(a12, packagePath, 'src'),
    a13Source: '/private/tmp/pmtool-a13-closure-20261022/packages/dsh-pm-tool/src',
    originalR1: join(repo, 'docs/testing', `${expert}-selftmp/r1`),
    originalR2: join(repo, 'docs/testing', `${expert}-selftmp/r2`),
    originalR3: r3,
    developerFreeze: dev,
    originalA12Evidence: join(repo, 'reports/all-pending-evidence-20261021/A12'),
    originalMixedEvidence: evidence,
    concurrentA13Evidence: join(repo, 'reports/all-pending-evidence-20261021/A13'),
    dependencyPhysicalTree: physicalDeps,
    mainVite: join(repo, packagePath, 'node_modules/.vite'),
    mainCache: join(repo, packagePath, 'node_modules/.cache'),
    mainViteTemp: join(repo, packagePath, 'node_modules/.vite-temp'),
    a12Vite: join(deps, '.vite'), a12Cache: join(deps, '.cache'), a12ViteTemp: join(deps, '.vite-temp'),
  }
}
function protect() {
  return Object.fromEntries(Object.entries(protectionRoots()).map(([id, root]) =>
    [id, { root, inventory: inventory(root, true) }]))
}
function freeze(label, from) {
  const frozen = join(self, label, 'frozen')
  const pkg = join(frozen, packagePath)
  assert(!existsSync(frozen), '禁止覆盖冻结或旧失败')
  mkdirSync(pkg, { recursive: true, mode: 0o700 })
  for (const n of ['src', 'package.json', 'tsconfig.json', 'pnpm-lock.yaml']) {
    if (existsSync(join(from, packagePath, n)))
      cpSync(join(from, packagePath, n), join(pkg, n), { recursive: true })
  }
  symlinkSync(deps, join(pkg, 'node_modules'), 'dir')
  symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  const tests = join(frozen, 'docs/testing')
  mkdirSync(tests, { recursive: true, mode: 0o700 })
  cpSync(original, join(tests, `${expert}-cases.test.tsx`))
  cpSync(join(repo, 'docs/testing', `${prefix}-boundary-cases.test.tsx`),
    join(tests, `${prefix}-boundary-cases.test.tsx`))
  return { frozen, pkg, tests }
}
function environment(label) {
  const base = join(self, label)
  for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(base, n), { recursive: true, mode: 0o700 })
  return {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(base, 'home'), TMPDIR: join(base, 'tmp'), XDG_CACHE_HOME: join(base, 'cache'),
    DSH_HOME: join(base, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
    NODE_DISABLE_COMPILE_CACHE: '1', A14_REPLAY_INPUT: join(self, 'replay-input.json'),
    A14_OBSERVATIONS: join(base, 'observations.jsonl'),
  }
}
function execute(label, executable, args, cwd, env) {
  const start = new Date().toISOString()
  const result = spawnSync(executable, args, { cwd, env, encoding: 'utf8', timeout: 180000, maxBuffer: 64 * 1024 * 1024 })
  save(`${label}.stdout.log`, result.stdout ?? '')
  save(`${label}.stderr.log`, result.stderr ?? '')
  const record = { label, argv: [executable, ...args], cwd, env, start,
    end: new Date().toISOString(), originalExit: result.status, signal: result.signal, error: result.error?.message }
  save(`${label}.command.json`, record)
  console.log(JSON.stringify({ label, originalExit: result.status, signal: result.signal }))
  return record
}
function vitest(scope, label, include, pattern) {
  const run = `${scope}-${label}`
  const frozen = join(self, scope, 'frozen')
  const env = environment(run)
  save(`${run}/vitest.config.mjs`, `export default ${JSON.stringify({
    root: frozen, cacheDir: join(self, run, 'cache/vite'),
    test: { environment: 'node', cache: false, include, pool: 'forks', maxWorkers: 1, minWorkers: 1, testTimeout: 15000 },
  }, null, 2)}\n`)
  const args = [join(deps, 'vitest/vitest.mjs'), 'run', '--config', join(self, run, 'vitest.config.mjs'),
    '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(self, `${run}.result.json`)]
  if (pattern) args.push('--testNamePattern', pattern)
  return execute(run, process.execPath, args, frozen, env)
}
function originalAudit() {
  const candidate = json(join(r3, 'candidate.json'))
  assert.deepEqual(inventory(evidence), candidate.evidenceBefore, '原198文件漂移，禁止重冻洗掉失败')
  const a12Manifest = json(join(repo, 'reports/all-pending-evidence-20261021/A12/candidate.json'))
  for (const [p, expected] of Object.entries({ ...a12Manifest.sourceHashes, ...a12Manifest.artifacts }))
    assert.equal(hfile(join(a12, p)), expected, `A12已声明输入/产物漂移 ${p}`)
  assert.equal(hfile(join(repo, 'reports/all-pending-evidence-20261021/A12/product-tracked.patch')), a12Manifest.trackedPatchSha)
  const summary = json(join(r3, 'summary.json'))
  assert.deepEqual(summary.executions.map(x => x.originalExit), [0, 1, 1, 1])
  assert.equal(hfile(original), '5c6a6b9df5a00b42a1ee9e8ebf1a8e004065822783fd2faccad6a9418b115821')
  assert.equal(hfile(join(r3, 'frozen/docs/testing', `${expert}-cases.test.tsx`)), hfile(original))
  assert.deepEqual(inventory(join(r3, 'frozen', packagePath, 'src')), inventory(join(a12, packagePath, 'src')))
  const events = n => json(join(evidence, n)).map(x => x.event)
  const apply = events('apply-command-events.json')
  const finish = events('finish/command-events.json')
  const done = (seq, list) => {
    const e = list.find(x => x.seq === seq && x.type === 'command/done')
    assert.equal(e.data.kind, 'success')
    return e.data.text
  }
  const handle = JSON.parse(done(24, apply)).undoIds[0].id
  const ledger = json(join(evidence, 'applied-ledger.json')).record.value.entries.find(e => e.undo?.handle === handle)
  assert.equal(ledger.undo.used, false)
  assert.deepEqual(ledger.undo.postimages.map(x => x.id), ['t-0001', 't-0001', 't-0002'])
  assert.match(done(22, apply), /^已应用 3 步/)
  const update = finish.find(e => e.seq === 29)
  assert.equal(update.data.source.kind, 'user')
  const payload = JSON.parse(update.data.args.trim().slice('task update t-0001 '.length))
  const snapshot = JSON.parse(done(32, finish))
  const saved = json(join(evidence, 'finish/saved-t1.json')).record
  assert.equal(payload.assignee, '外部人工改派保留')
  assert.deepEqual(snapshot.tasks.find(t => t.id === 't-0001'), saved)
  assert.deepEqual(snapshot.tasks.find(t => t.id === 't-0002'), json(join(evidence, 'finish/saved-t2.json')).record)
  for (const field of ['attachments', 'progressLog'])
    assert.deepEqual(saved[field], json(join(evidence, 'applied-t1.json')).record[field])
  for (const [a, b] of [['applied-t2.json', 'finish/saved-t2.json'],
    ['finish/before-save-ledger.json', 'finish/saved-ledger.json']])
    assert(readFileSync(join(evidence, a)).equals(readFileSync(join(evidence, b))))
  const expanded = json(join(evidence, 'finish/after-expand.json'))
  assert.equal(expanded.origin, 'http://127.0.0.1:3241')
  assert.equal(expanded.timeOrigin, 1792616867623)
  assert.equal(ledger.undo.expiresAt - Date.parse(expanded.at), 212015)
  assert(!expanded.pm.text.includes('撤销 · 整批 3 步'))
  const allEvents = [...apply, ...finish, ...events('undo-command-events.json'),
    ...events('undo-r2/undo-command-events.json'), ...events('undo-r3/command-events.json')]
  assert.deepEqual(allEvents.filter(e => e.type === 'command/run' && /^\s*ask-undo(?!\s+list)/.test(e.data.args ?? '')), [])
  let frameCount = 0
  for (const p of Object.keys(candidate.evidenceBefore).filter(p => p.endsWith('frames.json'))) {
    for (const frame of json(join(evidence, p)).frames) {
      assert.equal(hfile(join(evidence, dirname(p), frame.file)), frame.sha256)
      frameCount++
    }
  }
  const exits = Object.fromEntries(['apply-exit.json', 'undo-exit.json', 'undo-r2/undo-exit.json',
    'undo-r3/exit.json', 'finish/exit.json'].map(p => [p, json(join(evidence, p))]))
  return { evidenceFiles: Object.keys(candidate.evidenceBefore).length, frameCount, exits, freshHandle: handle,
    ledger: ledger.id, payload, noUndoExecutedInOriginalEvents: true,
    a12SourceInputs: Object.keys(a12Manifest.sourceHashes).length, a12Artifacts: Object.keys(a12Manifest.artifacts).length,
    boundary: '只读原事件/字节/帧hash，不签GUI或当前内存handle存活；不执行服务/RPC' }
}

if (phase === 'prepare') {
  assert(!existsSync(self), '请选择未使用rN，禁止覆盖旧证')
  const audit = originalAudit()
  const before = json(join(dev, 'before/source.json'))
  const after = json(join(dev, 'after-r2/source.json'))
  assert.deepEqual(inventory(join(dev, 'before/frozen', packagePath, 'src')), before)
  assert.deepEqual(inventory(join(dev, 'after-r2/frozen', packagePath, 'src')), after)
  for (const p of owned) assert.equal(hfile(join(repo, packagePath, p)), after[p.slice(4)].sha256,
    `SM01释放文件已被改动 ${p}，停止认领而非重冻`)
  for (const p of owned.slice(0, 2)) assert.equal(hfile(join(dev, 'before/frozen', packagePath, p)),
    hfile(join(r3, 'frozen', packagePath, p)), 'SM01旧接缝不等r3')
  const guarded = protect()
  save('start.json', {
    at: new Date().toISOString(), role: '独立测试专家', baseline: git(['rev-parse', 'HEAD']).trim(),
    originMain: git(['rev-parse', 'origin/main']).trim(), environment: { node: process.version,
      executable: process.execPath, os: os.release(), arch: os.arch(), pnpmInvoked: false },
    inputs: Object.fromEntries(inputFiles().map(p => [p, hfile(join(repo, p))])),
    protect: guarded, dependencies: Object.fromEntries(['react', 'react-test-renderer', 'vitest', 'typescript', 'lucide-react']
      .map(n => [n, { root: realpathSync(join(deps, n)), version: json(join(deps, n, 'package.json')).version }])),
    writesOnly: self, noInstallBuildGuiServicesCredentialsCommit: true,
  })
  save('original-audit.json', audit)
  save('replay-input.json', readFileSync(join(r3, 'replay-input.json'), 'utf8'))
  save('main-tracked.patch', git(['diff', '--binary', 'HEAD', '--', packagePath]))
  save('main-new-sources.json', git(['ls-files', '--others', '--exclude-standard', '-z', '--', `${packagePath}/src`])
    .split('\0').filter(Boolean).map(p => ({ path: p, sha256: hfile(join(repo, p)) })))
  for (const [label, from] of [['r3-old', join(r3, 'frozen')], ['old', join(dev, 'before/frozen')],
    ['new', join(dev, 'before/frozen')], ['current', repo]]) {
    const f = freeze(label, from)
    if (label === 'new') for (const p of owned) cpSync(join(repo, packagePath, p), join(f.pkg, p))
    const source = inventory(join(f.pkg, 'src'))
    if (label === 'old') assert.deepEqual(source, before)
    if (label === 'new') assert.deepEqual(source, after, 'SM01同源新冻结不等释放候选')
    if (label === 'current') assert.deepEqual(source, inventory(join(repo, packagePath, 'src')), '主树复制期间漂移，另轮认领')
    save(`${label}/source.json`, source)
    save(`${label}/candidate.json`, { scope: label, baseline: git(['rev-parse', 'HEAD']).trim(),
      sourceSha256: hash(JSON.stringify(source)), files: Object.keys(source).length,
      packageVersion: json(join(f.pkg, 'package.json')).version,
      filesOfInterest: Object.fromEntries(owned.filter(p => existsSync(join(f.pkg, p))).map(p => [p, hfile(join(f.pkg, p))])),
      config: Object.fromEntries(['package.json', 'tsconfig.json', 'pnpm-lock.yaml'].filter(n => existsSync(join(f.pkg, n)))
        .map(n => [n, hfile(join(f.pkg, n))])) })
  }
  const src = readFileSync(original, 'utf8')
  const line = "const checks = f.m.root.findAll(node => node.type === 'input' && 'data-copilot-check' in node.props)"
  assert.equal(src.split(line).length, 2)
  // A mechanical adapter freezes values at the original observation point, never changing expectations.
  const adapted = src.replace(line, `${line}.map(node => ({ props: { ...node.props } }))`)
  for (const label of ['old', 'new']) {
    save(`${label}/frozen/docs/testing/${prefix}-sampling-cases.test.tsx`, adapted)
    const result = spawnSync('/usr/bin/git', ['diff', '--no-index', original,
      join(self, label, 'frozen/docs/testing', `${prefix}-sampling-cases.test.tsx`)], { encoding: 'utf8' })
    assert.equal(result.status, 1)
    save(`${label}/sampling-only.patch`, result.stdout)
  }
  save('scopes.json', {
    oldToNew: diff(before, after),
    newToCurrent: diff(after, json(join(self, 'current/source.json'))),
    r3ToOld: diff(json(join(self, 'r3-old/source.json')), before),
    originalTestSha: hash(src), samplingTestSha: hash(adapted),
    exactSingleSamplingReplacement: true, expectationsAndActionsUnchanged: true,
    sourceScopeBoundary: 'new=开发before冻结+三文件；current=后续主树，分域测，未并为同源红绿',
  })
  console.log(JSON.stringify({ prepared: self, scopes: json(join(self, 'scopes.json')) }))
} else if (phase === 'run') {
  assert(!existsSync(join(self, 'runs.json')), '本轮已运行，禁止覆盖原退出码')
  const runs = []
  const contracts = file => [`docs/testing/${file}`]
  for (const scope of ['r3-old', 'old', 'new']) {
    for (const [label, pattern] of [['control', '^BASE'], ['A01', 'SM-A01'], ['A02', 'SM-A02'], ['A03', 'SM-A03']])
      runs.push(vitest(scope, label, contracts(`${expert}-cases.test.tsx`), pattern))
  }
  for (const scope of ['old', 'new']) {
    for (const [label, pattern] of [['sampling-control', '^BASE'], ['sampling-A01', 'SM-A01'],
      ['sampling-A02', 'SM-A02'], ['sampling-A03', 'SM-A03']])
      runs.push(vitest(scope, label, contracts(`${prefix}-sampling-cases.test.tsx`), pattern))
  }
  runs.push(vitest('old', 'boundary', contracts(`${prefix}-boundary-cases.test.tsx`), '^BOUNDARY'))
  runs.push(vitest('new', 'independent', contracts(`${prefix}-boundary-cases.test.tsx`)))
  const include = [
    `${packagePath}/src/client/panel*.test.*`,
    `${packagePath}/src/client/launch-handshake.test.ts`,
    `${packagePath}/src/client/sidecar-minimize-retention.test.tsx`,
    `${packagePath}/src/client/shared/drawers/gd-overlay-contract.test.ts`,
    `${packagePath}/src/client/shared/form-dirty.test.ts`,
    `${packagePath}/src/client/views/tasks-import-confirm.test.tsx`,
    `${packagePath}/src/core/copilot*.test.ts`,
    `${packagePath}/src/core/ask-copilot-b7.test.ts`,
    `${packagePath}/src/core/ask-projection.test.ts`,
    `${packagePath}/src/core/capture.test.ts`,
    `${packagePath}/src/client/board/refresh-confirm.test.ts`,
    `${packagePath}/src/client/shared/contract-pilot.test.ts`,
    `${packagePath}/src/client/shared/stage-client.test.ts`,
    `${packagePath}/src/client/provenance-panel.test.tsx`,
  ]
  for (const scope of ['new', 'current']) {
    runs.push(vitest(scope, 'regression', include))
    const pkg = join(self, scope, 'frozen', packagePath)
    runs.push(execute(`${scope}-noEmit`, process.execPath, [join(deps, 'typescript/bin/tsc'), '--project',
      join(pkg, 'tsconfig.json'), '--noEmit', '--incremental', 'false'], pkg, environment(`${scope}-noEmit-env`)))
  }
  save('runs.json', runs)
  const expected = runs.map(r => ({ label: r.label, actual: r.originalExit,
    expected: /^(r3-old|old)-(A0[123]|sampling-A0[123])$/.test(r.label)
      || r.label === 'new-A03' ? 1 : 0 }))
  save('exit-expectations.json', expected)
  const mismatches = expected.filter(r => r.actual !== r.expected)
  console.log(JSON.stringify({ expectedExitMismatches: mismatches }))
  process.exitCode = mismatches.length ? 1 : 0
} else {
  const start = json(join(self, 'start.json'))
  const now = protect()
  const drift = Object.fromEntries(Object.keys(start.protect).map(id =>
    [id, diff(start.protect[id].inventory, now[id].inventory)]))
  const inputs = Object.fromEntries(inputFiles().map(p => [p, hfile(join(repo, p))]))
  const freezes = Object.fromEntries(['r3-old', 'old', 'new', 'current'].map(label =>
    [label, diff(json(join(self, label, 'source.json')), inventory(join(self, label, 'frozen', packagePath, 'src')))]))
  const runs = json(join(self, 'runs.json'))
  const results = runs.filter(r => r.label !== 'new-noEmit' && r.label !== 'current-noEmit')
    .map(r => {
      const p = join(self, `${r.label}.result.json`)
      const x = existsSync(p) ? json(p) : {}
      return { label: r.label, exit: r.originalExit, passed: x.numPassedTests, failed: x.numFailedTests,
        pending: x.numPendingTests, files: (x.testResults ?? []).length,
        cases: (x.testResults ?? []).flatMap(f => f.assertionResults.map(a => ({ name: a.fullName, status: a.status }))) }
    })
  const hardDrift = Object.entries(drift).filter(([id, paths]) =>
    !['mainSource', 'concurrentA13Evidence'].includes(id) && paths.length)
  const expected = json(join(self, 'exit-expectations.json'))
  const exitMismatches = expected.filter(x => x.actual !== x.expected)
  save('finish.json', { at: new Date().toISOString(), protect: now, drift, inputDrift: diff(start.inputs, inputs),
    inputs, freezes, originalAudit: originalAudit(), hardDrift, exitMismatches,
    concurrentChangesNotAuthoredHere: { mainSource: drift.mainSource, a13Evidence: drift.concurrentA13Evidence },
    boundary: '所列根SHA256/mtime；并发另列，不声称全机零污染；不操作GUI/服务/凭据/正式数据' })
  save('summary.json', { at: new Date().toISOString(), runs, results, scopes: json(join(self, 'scopes.json')),
    freezeDrift: freezes, protectedDrift: drift, hardDrift, exitMismatches, inputDrift: diff(start.inputs, inputs),
    sourceAutoOnly: true, gui: 'NOT_RUN', realFreshHandleCleanMixed: 'NOT_RUN', completeRAAI04Pass: false,
    reviewer: '本次独立测试专家；不是开发121自签' })
  console.log(JSON.stringify({ results: results.map(({ cases, ...r }) => r), freezeDrift: freezes,
    protectedDriftCounts: Object.fromEntries(Object.entries(drift).map(([k, v]) => [k, v.length])),
    hardDrift, exitMismatches, inputDrift: diff(start.inputs, inputs) }))
  process.exitCode = hardDrift.length || exitMismatches.length || diff(start.inputs, inputs).length
    || Object.values(freezes).some(x => x.length) ? 1 : 0
}

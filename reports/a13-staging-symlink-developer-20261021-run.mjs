// 开发自验设施：自有冻结树、只读既有依赖、原证不覆盖；不构建/起服务。
import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const own = join(repo, 'reports/a13-staging-symlink-developer-20261021-selftmp')
const pkg = join(repo, 'packages/dsh-pm-tool')
const expert = join(repo, 'docs/testing/a13-unicode-upload-independent-retest-20261021-selftmp')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const save = (name, value) => {
  const path = join(own, name)
  assert.ok(!fs.existsSync(path), '原证不可覆盖: ' + name)
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}
function tree(dir) {
  if (!fs.existsSync(dir)) return { absent: true }
  const result = {}
  function walk(p, key) {
    const s = fs.lstatSync(p)
    if (s.isSymbolicLink()) result[key] = { symlink: fs.readlinkSync(p) }
    else if (s.isDirectory()) {
      result[key + '/'] = 'directory'
      for (const n of fs.readdirSync(p).sort()) walk(join(p, n), key + '/' + n)
    } else if (s.isFile()) result[key] = sha(fs.readFileSync(p))
  }
  walk(dir, '.')
  return result
}
function dependencies() {
  const result = {}
  const seen = new Set()
  function walk(p) {
    const real = fs.realpathSync(p)
    if (seen.has(real)) return
    seen.add(real)
    if (fs.statSync(real).isDirectory()) for (const n of fs.readdirSync(real).sort()) walk(join(real, n))
    else result[real] = sha(fs.readFileSync(real))
  }
  walk(deps)
  return result
}
const configNames = ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
const source = () => ({
  src: tree(join(pkg, 'src')),
  config: Object.fromEntries(configNames.map(p => [p, sha(fs.readFileSync(join(pkg, p)))])),
})
const watch = () => Object.fromEntries([
  'packages/dsh-pm-tool/lib', 'data', 'assets', 'files', 'backups', 'packages/dsh-pm-tool/assets',
].map(p => [p, tree(join(repo, p))]))
const originals = () => ({
  expert: tree(expert),
  plan: sha(fs.readFileSync(join(repo, 'docs/plans/2026-10-21-staging-symlink-closure.md'))),
})
function freeze(name) {
  const before = source()
  const target = join(own, name)
  assert.ok(!fs.existsSync(target))
  fs.mkdirSync(target)
  fs.cpSync(join(pkg, 'src'), join(target, 'src'), { recursive: true })
  for (const p of configNames) fs.copyFileSync(join(pkg, p), join(target, p))
  fs.symlinkSync(deps, join(target, 'node_modules'), 'dir')
  assert.deepEqual(source(), before, '复制期间源码漂移')
  assert.deepEqual(tree(join(target, 'src')), before.src)
  // 只改专家测试副本的原件读取位置，不改断言/步骤；所有负例写目标仍为自有TMPDIR。
  const original = fs.readFileSync(join(expert, 'additional.test.ts'), 'utf8')
  const fixtureLine = "const original = readFileSync('/private/tmp/pmtool-a11-native-files/' + originalName)"
  assert.ok(original.includes(fixtureLine))
  fs.writeFileSync(join(target, 'src/a13-original-g03.test.ts'),
    original.replace(fixtureLine, "const original = readFileSync(process.env.A13_FIXTURE!)"))
  fs.copyFileSync(join(expert, 'whitelist.test.ts'), join(target, 'src/a13-whitelist.test.ts'))
  save(name + '-freeze.json', {
    at: new Date().toISOString(), source: before,
    head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
    trackedPatch: execFileSync('git', ['diff', 'HEAD', '--', 'packages/dsh-pm-tool/src'], { cwd: repo, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 }),
    untracked: execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool/src'], { cwd: repo, encoding: 'utf8' }),
    testAdaptation: { fromSha256: sha(Buffer.from(original)), fixtureLineOnly: true },
  })
}
function run(name, candidate, args, type = 'vitest') {
  const dir = join(own, name + '-tmp')
  fs.mkdirSync(dir)
  const env = {
    PATH: dirname(process.execPath) + ':/usr/bin:/bin:/usr/sbin:/sbin',
    HOME: dir, TMPDIR: dir, TMP: dir, TEMP: dir,
    DSH_PM_FILE_ROOT: join(dir, 'files'), DSH_PM_ISOLATED_ROOT: join(dir, 'isolated'),
    PM_FILE_ATOMIC_TMP: dir, A13_OWN_ROOT: own,
    A13_FIXTURE: join(own, 'original.md'), A13_GUARD_LOG: join(dir, 'guard.jsonl'),
    NODE_OPTIONS: '--require=' + join(own, 'guard.cjs'),
  }
  const argv = type === 'tsc'
    ? [join(deps, 'typescript/bin/tsc'), '-p', 'tsconfig.json', '--noEmit', '--incremental', 'false']
    : [join(deps, 'vitest/vitest.mjs'), 'run', '--no-cache', '--maxWorkers=1', '--minWorkers=1',
      '--reporter=verbose', '--reporter=json', '--outputFile=' + join(own, name + '-results.json'), ...args]
  const cwd = join(own, candidate)
  const start = new Date().toISOString()
  const r = spawnSync(process.execPath, argv, { cwd, env, encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 })
  save(name + '.json', { start, end: new Date().toISOString(), argv: [process.execPath, ...argv],
    cwd, env, exit: r.status, signal: r.signal, error: r.error?.message,
    stdout: r.stdout, stderr: r.stderr, stdoutSha256: sha(r.stdout ?? ''), stderrSha256: sha(r.stderr ?? '') })
  console.log(JSON.stringify({ name, exit: r.status, stdout: r.stdout?.slice(-2400), stderr: r.stderr?.slice(-1200) }, null, 2))
  return r.status
}
const mode = process.argv[2]
if (mode === 'index') {
  const release = read(join(own, 'release-owned.json'))
  assert.ok(release.released)
  for (const [p, expected] of Object.entries(release.ownSha256)) {
    assert.equal(sha(fs.readFileSync(join(pkg, 'src', p))), expected)
  }
  const indexPath = join(repo, 'reports/a13-staging-symlink-developer-20261021-index.json')
  assert.ok(!fs.existsSync(indexPath))
  const reportPath = join(repo, 'reports/a13-staging-symlink-developer-20261021.md')
  fs.writeFileSync(indexPath, JSON.stringify({
    at: new Date().toISOString(), ownSha256: release.ownSha256,
    reportSha256: sha(fs.readFileSync(reportPath)),
    runnerSha256: sha(fs.readFileSync(fileURLToPath(import.meta.url))),
    artifacts: tree(own), released: true, independentConclusion: '待专家；开发不自签',
  }, null, 2) + '\n')
  console.log('自有源hash匹配，报告/runner/完整自有原证索引已写；两文件释放，未签整树。')
} else if (mode === 'freeze-old') {
  assert.ok(!fs.existsSync(own))
  fs.mkdirSync(own)
  fs.copyFileSync(join(expert, 'guard.cjs'), join(own, 'guard.cjs'))
  const fixture = fs.readFileSync('/private/tmp/pmtool-a11-native-files/QA \u6587\u4ef6 \u539f\u4ef6.md')
  assert.equal(fixture.length, 22)
  assert.equal(sha(fixture), '87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a')
  fs.writeFileSync(join(own, 'original.md'), fixture)
  save('before.json', { at: new Date().toISOString(), source: source(), originals: originals(),
    watch: watch(), deps: dependencies(), fixtureSha256: sha(fixture),
    runtime: { node: process.version, platform: process.platform, arch: process.arch } })
  freeze('old')
} else if (mode === 'red') {
  const code = run('red', 'old', ['--testNamePattern=G03.*symlink', 'src/a13-original-g03.test.ts'])
  const result = read(join(own, 'red-results.json'))
  assert.equal(code, 1)
  assert.equal(result.numFailedTests, 3)
  assert.equal(result.numPassedTests, 4)
} else if (mode === 'red-new') {
  fs.copyFileSync(join(pkg, 'src/core/file-staging-symlink.test.ts'), join(own, 'old/src/core/file-staging-symlink.test.ts'))
  process.exitCode = run(mode, 'old', ['src/core/file-staging-symlink.test.ts'])
} else if (mode === 'freeze-new') {
  freeze('candidate')
} else if (mode === 'green-g03') {
  process.exitCode = run(mode, 'candidate', ['--testNamePattern=G03.*symlink', 'src/a13-original-g03.test.ts'])
} else if (mode === 'green-new') {
  process.exitCode = run(mode, 'candidate', ['src/core/file-staging-symlink.test.ts'])
} else if (mode === 'regression') {
  process.exitCode = run(mode, 'candidate', [
    'src/core/file-staging.test.ts', 'src/core/file-assets.test.ts', 'src/core/file-root.test.ts',
    'src/core/file-promotion.test.ts', 'src/core/tasks-files-atomic.test.ts',
    'src/core/http/asset-route.test.ts', 'src/core/http/preview-route.test.ts',
    'src/client/shared/stage-client.test.ts', 'src/client/shared/asset-client.test.ts',
    'src/client/shared/staged-lifecycle.test.ts', 'src/client/shared/task-draft-materials-stage.test.tsx',
    'src/a13-original-g03.test.ts', 'src/a13-whitelist.test.ts',
  ])
} else if (mode === 'noemit') {
  process.exitCode = run(mode, 'candidate', [], 'tsc')
} else if (mode === 'release-owned') {
  const frozen = read(join(own, 'candidate-freeze.json'))
  const current = source()
  const previous = read(join(own, 'release-r3.json'))
  const owned = ['core/file-staging.ts', 'core/file-staging-symlink.test.ts']
  const ownSha256 = Object.fromEntries(owned.map(p => [p, sha(fs.readFileSync(join(pkg, 'src', p)))]))
  const relevant = src => Object.fromEntries(Object.entries(src).filter(([p]) =>
    p.startsWith('./core/') || p.startsWith('./client/shared/')))
  const checks = {
    ownedMatchesTestedFreeze: owned.every(p => ownSha256[p] === frozen.source.src['./' + p]),
    coreAndSharedModulesMatchFreeze: JSON.stringify(relevant(current.src)) === JSON.stringify(relevant(frozen.source.src)),
    configMatchesFreeze: JSON.stringify(current.config) === JSON.stringify(frozen.source.config),
    frozenTreeUnchanged: previous.checks.candidateFrozenUnchanged,
    independentOriginalsUnchanged: previous.checks.expertAndPlanUnchanged,
    dependenciesUnchanged: previous.checks.dependenciesUnchanged,
    watchUnchangedAtLastAudit: previous.checks.watchUnchanged,
  }
  const fullTreeDrift = [...new Set([...Object.keys(current.src), ...Object.keys(frozen.source.src)])]
    .filter(p => JSON.stringify(current.src[p]) !== JSON.stringify(frozen.source.src[p]))
    .map(p => ({ path: p, frozen: frozen.source.src[p], current: current.src[p] }))
  save('release-owned.json', { at: new Date().toISOString(), ownSha256, checks, fullTreeDrift,
    released: Object.values(checks).every(Boolean),
    scope: '只释放两自有文件；AUTO/noemit绑定candidate树，不签当前整树或独立门',
    previousGlobalAudits: ['release.json', 'release-r2.json', 'release-r3.json'],
    commands: previous.commands, guard: previous.guard,
    build: 'NOT_RUN', currentMainNoemit: 'NOT_RUN', GUI: 'NOT_RUN', independentConclusion: '待专家',
  })
  save('record-manifest-owned.json', tree(own))
  assert.ok(Object.values(checks).every(Boolean), '自有或同域源码不匹配，停止释放')
  console.log(JSON.stringify({ checks, ownSha256, fullTreeDrift, released: true }, null, 2))
} else if (['finish', 'finish-r2', 'finish-r3'].includes(mode)) {
  const suffix = mode.slice('finish'.length)
  const saveFinal = (name, value) => save(name.replace('.json', suffix + '.json'), value)
  const before = read(join(own, 'before.json'))
  const frozen = read(join(own, 'candidate-freeze.json'))
  const owned = ['core/file-staging.ts', 'core/file-staging-symlink.test.ts']
  const current = source()
  const unownedBefore = structuredClone(before.source.src)
  const unownedAfter = structuredClone(current.src)
  for (const p of owned) { delete unownedBefore['./' + p]; delete unownedAfter['./' + p] }
  const baselineUnownedChanges = [...new Set([...Object.keys(unownedBefore), ...Object.keys(unownedAfter)])]
    .filter(p => JSON.stringify(unownedBefore[p]) !== JSON.stringify(unownedAfter[p]))
    .map(p => ({ path: p, before: unownedBefore[p], final: unownedAfter[p], frozen: frozen.source.src[p] }))
  const frozenMainChanges = [...new Set([...Object.keys(frozen.source.src), ...Object.keys(current.src)])]
    .filter(p => JSON.stringify(frozen.source.src[p]) !== JSON.stringify(current.src[p]))
    .map(p => ({ path: p, frozen: frozen.source.src[p], current: current.src[p] }))
  const candidateSrc = tree(join(own, 'candidate/src'))
  delete candidateSrc['./a13-original-g03.test.ts']
  delete candidateSrc['./a13-whitelist.test.ts']
  const checks = {
    ownedSourceMatchesFreeze: owned.every(p => sha(fs.readFileSync(join(pkg, 'src', p))) === frozen.source.src['./' + p]),
    candidateFrozenUnchanged: JSON.stringify(candidateSrc) === JSON.stringify(frozen.source.src),
    ...(mode === 'finish'
      ? { unownedSourceUnchanged: JSON.stringify(unownedBefore) === JSON.stringify(unownedAfter) }
      : mode === 'finish-r2'
        ? { mainSourceMatchesFinalFreeze: JSON.stringify(current) === JSON.stringify(frozen.source) }
        : { mainDiffOnlyRecordedUnownedTest: frozenMainChanges.every(c =>
          c.path === './commands/task-import-filename.test.ts' && c.frozen === undefined
          && c.current === '3575adcb202ca26cab341edee394634f16c69736d9f32fd8b8dc053e38a9b3e7') }),
    configurationUnchanged: JSON.stringify(current.config) === JSON.stringify(before.source.config),
    expertAndPlanUnchanged: JSON.stringify(originals()) === JSON.stringify(before.originals),
    watchUnchanged: JSON.stringify(watch()) === JSON.stringify(before.watch),
    dependenciesUnchanged: JSON.stringify(dependencies()) === JSON.stringify(before.deps),
    fixtureUnchanged: sha(fs.readFileSync(join(own, 'original.md'))) === before.fixtureSha256,
  }
  const ownSha256 = Object.fromEntries(owned.map(p => [p, sha(fs.readFileSync(join(pkg, 'src', p)))]))
  const commandNames = ['red', 'red-new', 'green-g03', 'green-new', 'regression', 'noemit']
  const commands = commandNames.map(name => {
    const record = read(join(own, name + '.json'))
    const p = join(own, name + '-results.json')
    const tests = fs.existsSync(p) ? read(p) : undefined
    return { name, exit: record.exit, passed: tests?.numPassedTests, failed: tests?.numFailedTests,
      pending: tests?.numPendingTests, recordSha256: sha(fs.readFileSync(join(own, name + '.json'))) }
  })
  const guard = Object.fromEntries(commandNames.map(name => {
    const p = join(own, name + '-tmp/guard.jsonl')
    return [name, fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map(s => JSON.parse(s)) : []]
  }))
  const audit = []
  for (const name of ['red', 'green-g03', 'regression']) {
    const dir = join(own, name + '-tmp')
    for (const sub of fs.readdirSync(dir)) {
      const path = join(dir, sub, 'record.json')
      if (!fs.existsSync(path)) continue
      const record = read(path)
      if (!record.case?.startsWith('G03 ') || !record.case.includes('symlink')) continue
      for (const request of record.records) {
        const diskBefore = request.before.disk
        const diskAfter = request.after.disk
        const added = Object.keys(diskAfter).filter(p => !(p in diskBefore))
        const bins = added.filter(p => p.endsWith('.bin')).map(p => {
          const actual = join(record.root, p.slice(2))
          const b = fs.readFileSync(actual)
          return { path: actual, size: b.length, sha256: sha(b) }
        })
        audit.push({ command: name, case: record.case, record: path, recordSha256: sha(fs.readFileSync(path)),
          status: request.status, bodyReads: request.reads, payload: request.payload,
          dbUnchanged: JSON.stringify(request.before.tasks) === JSON.stringify(request.after.tasks)
            && JSON.stringify(request.before.assets) === JSON.stringify(request.after.assets),
          diskUnchanged: JSON.stringify(diskBefore) === JSON.stringify(diskAfter), added, bins })
      }
    }
  }
  saveFinal('audit.json', audit)
  saveFinal('release.json', { at: new Date().toISOString(), checks, baselineUnownedChanges, frozenMainChanges, ownSha256, commands, guard,
    sourceFinal: source(), watchFinal: watch(), released: Object.values(checks).every(Boolean),
    releaseScope: '仅两自有文件和已测candidate冻结树；非自有新task-import测试未测，不签当前整树',
    independentConclusion: '未自签；交独立专家', build: 'NOT_RUN', GUI: 'NOT_RUN', services: 0, installs: 0, commits: 0 })
  const patchPath = join(own, 'file-staging' + suffix + '.patch')
  assert.ok(!fs.existsSync(patchPath))
  fs.writeFileSync(patchPath, execFileSync('git', ['diff', 'HEAD', '--', 'packages/dsh-pm-tool/src/core/file-staging.ts'], { cwd: repo }))
  saveFinal('record-manifest.json', tree(own))
  assert.ok(Object.values(checks).every(Boolean), '终核不符，须回Main工程事实')
  assert.ok(commandNames.every(n => n.startsWith('red') || read(join(own, n + '.json')).exit === 0))
  console.log(JSON.stringify({ checks, ownSha256, commands, guard }, null, 2))
} else throw new Error('未知模式')

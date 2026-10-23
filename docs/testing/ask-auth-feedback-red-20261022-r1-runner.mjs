import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  constants, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  readlinkSync, realpathSync, statSync, symlinkSync, writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'ask-auth-feedback-red-20261022-r1'
const out = join(repo, 'reports/all-pending-evidence-20261021/AskAuthRedR1')
const frozen = join(out, 'frozen')
const pkg = 'packages/dsh-pm-tool'
const test = `${pkg}/src/commands/ask-auth-feedback.test.ts`
const prior = join(repo, 'reports/all-pending-evidence-20261021/AiTerminalDevR1/repaired-r3/frozen')
const depsSource = join(prior, pkg, 'node_modules')
const deps = join(frozen, pkg, 'node_modules')
const inputs = ['src', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts', 'cordis.patch.yml']
const gui = join(repo, 'reports/all-pending-evidence-20261021/CombinedGuiR1')
const oldRed = join(repo, 'docs/testing/ai-terminal-failure-20261022-selftmp/r2')
const [stage, suite] = process.argv.slice(2)
assert(['freeze', 'test', 'close'].includes(stage))
if (stage === 'test') assert(['controls', 'red'].includes(suite))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
function save(name, value) {
  const target = resolve(out, name)
  assert(target.startsWith(`${out}/`), '只写自有 AskAuthRedR1')
  mkdirSync(dirname(target), { recursive: true, mode: 0o700 })
  writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
function inventory(root) {
  if (!existsSync(root)) return { missing: true }
  const result = {}
  function walk(path) {
    const s = lstatSync(path), key = relative(root, path) || '.'
    if (s.isSymbolicLink()) result[key] = { link: readlinkSync(path) }
    else if (s.isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name))
    else result[key] = { bytes: s.size, sha256: sha(readFileSync(path)) }
  }
  walk(root)
  return result
}
const allInputs = root => Object.fromEntries(inputs.map(path => [path, inventory(join(root, pkg, path))]))
function differences(a, b) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
    .filter(path => JSON.stringify(a[path]) !== JSON.stringify(b[path]))
}
function audit(root, compare) {
  const files = [], links = [], external = [], sharedInodes = []
  function walk(path) {
    const s = lstatSync(path), key = relative(root, path)
    if (s.isSymbolicLink()) {
      const target = realpathSync(path)
      links.push({ path: key, target: relative(root, target) })
      if (!target.startsWith(`${root}/`)) external.push({ path: key, target })
    } else if (s.isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name))
    else {
      files.push({ path: key, bytes: s.size, sha256: sha(readFileSync(path)) })
      if (compare && existsSync(join(compare, key))) {
        const old = statSync(join(compare, key))
        if (s.dev === old.dev && s.ino === old.ino) sharedInodes.push(key)
      }
    }
  }
  walk(root)
  return { files, links, external, sharedInodes }
}
function protection() {
  const before = json(join(out, 'protected-before.json'))
  const protectedDrift = Object.keys(before).filter(path =>
    JSON.stringify(inventory(path)) !== JSON.stringify(before[path]))
  const frozenDrift = differences(json(join(out, 'frozen-before.json')), allInputs(frozen))
  const upstreamDrift = JSON.stringify(inventory(join(frozen, 'upstream')))
    !== JSON.stringify(json(join(out, 'upstream-before.json')))
  const now = audit(deps, depsSource)
  const dependenciesUnchanged = JSON.stringify(now) === JSON.stringify(json(join(out, 'dependencies-before.json')))
  const old = json(join(out, 'main-before.json')), current = allInputs(repo)
  const concurrentInputChanges = inputs.flatMap(root => differences(old[root], current[root])
    .map(path => `${pkg}/${root}${path === '.' ? '' : `/${path}`}`))
  return {
    protectedDrift, frozenDrift, upstreamDrift, dependenciesUnchanged,
    external: now.external, sharedInodes: now.sharedInodes, concurrentInputChanges,
    concurrentPolicy: '主源变化只登记；不锁全主树、其他 agent 或共享 lib。结论只绑定冻结字节。',
    ok: !protectedDrift.length && !frozenDrift.length && !upstreamDrift
      && dependenciesUnchanged && !now.external.length && !now.sharedInodes.length,
  }
}
function allowedEnv(suiteName) {
  return {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), TMP: join(out, 'tmp'), TEMP: join(out, 'tmp'),
    XDG_CACHE_HOME: join(out, 'cache'), XDG_CONFIG_HOME: join(out, 'home/config'), XDG_DATA_HOME: join(out, 'home/data'),
    DSH_HOME: join(out, 'runtime'), PM_GOVERNANCE_TMP: join(out, 'tmp'), PM_FILE_ATOMIC_TMP: join(out, 'tmp'),
    DSH_PM_FILE_ROOT: join(out, 'files'), DSH_PM_BACKUP_DIR: join(out, 'backups'), DSH_PM_EXPORT_DIR: join(out, 'exports'),
    ASK_AUTH_PI_STREAM: join(frozen, 'upstream/pi-src/stream.ts'),
    ASK_AUTH_OBSERVATIONS: join(out, `${suiteName}.observations.ndjson`),
    CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1',
  }
}
if (stage === 'freeze') {
  assert(!existsSync(out), '禁止覆盖旧轮，包括旧失败')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  const watch = [
    fileURLToPath(import.meta.url), join(repo, test), join(repo, 'docs/testing', `${prefix}-plan.md`),
    join(repo, 'docs/testing/ai-terminal-failure-20261022-cases.test.ts'),
    join(repo, 'docs/testing/ai-terminal-failure-20261022-report.md'),
    join(repo, 'docs/testing/ai-terminal-independent-retest-20261022-r1-report.md'),
    join(repo, pkg, 'src/core/ai-client-terminal.test.ts'), join(repo, pkg, 'src/commands/ask-governance.test.ts'),
    join(repo, pkg, 'scripts/verify-ai-client.mjs'), depsSource, join(prior, 'upstream'),
    join(prior, pkg, 'src/core/ai-client.ts'), join(prior, pkg, 'src/commands/ask.ts'),
    join(prior, pkg, 'src/core/ai-client-terminal.test.ts'),
    ...['controls', 'red'].flatMap(name => ['command.json', 'result.json', 'stdout.log', 'stderr.log',
      'summary.json', 'observations.ndjson'].map(ext => join(oldRed, `${name}.${ext}`))),
    ...['32-atf-auth-command-events.json', '34-atf-r2-auth-command-events.json',
      '32-atf-auth-after.json', '34-atf-r2-auth-after.json'].map(path => join(gui, path)),
  ]
  for (const path of watch) assert(existsSync(path), `保护对象必须存在: ${path}`)
  save('protected-before.json', Object.fromEntries(watch.map(path => [path, inventory(path)])))
  const main = allInputs(repo)
  save('main-before.json', main)
  for (const path of inputs) cpSync(join(repo, pkg, path), join(frozen, pkg, path),
    { recursive: true, preserveTimestamps: true, force: false, errorOnExist: true })
  assert.deepEqual(allInputs(frozen), main)
  save('frozen-before.json', allInputs(frozen))
  const originalDeps = audit(depsSource)
  assert.deepEqual(originalDeps.external, [], '仅复制内部完整已释放依赖')
  function copyDeps(path) {
    const target = join(deps, relative(depsSource, path)), s = lstatSync(path)
    if (s.isSymbolicLink()) {
      const resolved = realpathSync(path)
      assert(resolved.startsWith(`${depsSource}/`))
      symlinkSync(relative(dirname(target), join(deps, relative(depsSource, resolved))), target)
    } else if (s.isDirectory()) {
      mkdirSync(target, { recursive: true, mode: 0o700 })
      for (const name of readdirSync(path).sort()) copyDeps(join(path, name))
    } else copyFileSync(path, target, constants.COPYFILE_EXCL)
  }
  copyDeps(depsSource)
  const ownDeps = audit(deps, depsSource)
  assert.deepEqual(ownDeps.files, originalDeps.files)
  assert.deepEqual(ownDeps.links, originalDeps.links)
  assert.deepEqual(ownDeps.external, [])
  assert.deepEqual(ownDeps.sharedInodes, [])
  save('dependencies-before.json', ownDeps)
  symlinkSync(relative(frozen, deps), join(frozen, 'node_modules'))
  cpSync(join(prior, 'upstream'), join(frozen, 'upstream'),
    { recursive: true, preserveTimestamps: true, force: false, errorOnExist: true })
  assert.deepEqual(inventory(join(frozen, 'upstream')), inventory(join(prior, 'upstream')))
  save('upstream-before.json', inventory(join(frozen, 'upstream')))
  const diff = spawnSync('/usr/bin/diff', ['-u', join(prior, pkg, 'src/commands/ask.ts'),
    join(frozen, pkg, 'src/commands/ask.ts')], { encoding: 'utf8' })
  save('ask-relative-to-atf.diff', diff.stdout ?? '')
  save('ask-relative-to-atf.command.json', {
    argv: ['/usr/bin/diff', '-u', join(prior, pkg, 'src/commands/ask.ts'), join(frozen, pkg, 'src/commands/ask.ts')],
    originalExit: diff.status, pid: diff.pid, signal: diff.signal, stderr: diff.stderr,
  })
  assert.equal(diff.status, 0, '本轮应为原命令接缝，不混入在途修复')
  const lines = readFileSync(join(gui, 'gateway-requests.ndjson'), 'utf8').trim().split('\n').map(line => JSON.parse(line))
  const first = lines.filter(line => [1, 2].includes(line.sequence))
  assert.equal(first.length, 2)
  save('gateway-seq1-2.original.ndjson', first.map(line => JSON.stringify(line)).join('\n') + '\n')
  save('gateway-read-binding.json', {
    at: new Date().toISOString(), source: join(gui, 'gateway-requests.ndjson'),
    scope: '仅保存 seq1/2，不锁 live gateway writer，不访问网关或服务',
    sequences: first.map(({ sequence, mode, path, status }) => ({ sequence, mode, path, status })),
    originalSubsetSha256: sha(first.map(line => JSON.stringify(line)).join('\n') + '\n'),
  })
  for (const path of ['home', 'tmp', 'cache', 'runtime', 'files', 'backups', 'exports'])
    mkdirSync(join(out, path), { mode: 0o700 })
  save('vitest.config.mjs', `export default ${JSON.stringify({
    root: frozen, cacheDir: join(out, 'cache/vite'),
    test: {
      environment: 'node', cache: false, include: [test], pool: 'forks',
      poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000,
    },
  }, null, 2)}\n`)
  const priorCandidate = json(join(repo, 'reports/all-pending-evidence-20261021/CombinedRepairR1/r2/candidate.json'))
  const sourceFiles = Object.entries(main.src).map(([path, value]) => ({ path: `${pkg}/src/${path}`, ...value }))
  save('source-files.json', sourceFiles)
  save('candidate.json', {
    at: new Date().toISOString(), role: '独立先行测试，非开发、非 GUI',
    baseline: priorCandidate.baseline, baselineProvenance: '只读 CombinedRepairR1/r2/candidate.json；无 Git 变更命令',
    referenceMainCandidate: { sourceCount: priorCandidate.sourceCount, completeInputCount: priorCandidate.completeInputCount },
    source: repo, frozen, sourceFileCount: sourceFiles.length, protectedObjectCount: watch.length,
    packageVersion: json(join(frozen, pkg, 'package.json')).version,
    consumed: Object.fromEntries(['src/commands/ask.ts', 'src/core/ai-client.ts', 'src/core/model-route.ts',
      'src/core/storage.ts', 'src/core/ask-copilot.ts', 'src/commands/ask-auth-feedback.test.ts']
      .map(path => [path, inventory(join(frozen, pkg, path))])),
    node: process.version, executable: process.execPath, platform: process.platform,
    versions: Object.fromEntries(['vitest', '@deepseek-ai/dsh-llm', '@deepseek-ai/cordis', '@earendil-works/pi-ai']
      .map(path => [path, json(join(deps, path, 'package.json')).version])),
    dependencyFiles: ownDeps.files.length, dependencyLinks: ownDeps.links.length,
    candidatePolicy: '完整冻结当前 src/config；不把 HEAD 或主树后继计数当运行身份，不 build，不认领 live 107/108。',
    productionChain: 'handleAskCommand -> generateDraft -> LlmRuntime -> pi toStreamChunks -> BlockAssembler',
    build: false, install: false, gui: false, services: false, credentials: false, vendor: false,
    fullVerify: false, gitChanges: false, release: 'STOP',
  })
  const check = protection()
  save('freeze-check.json', check)
  assert(check.ok)
  console.log(JSON.stringify({ stage, sourceFileCount: sourceFiles.length, dependencyFiles: ownDeps.files.length,
    dependencyLinks: ownDeps.links.length, protection: check }))
} else if (stage === 'test') {
  assert(!existsSync(join(out, `${suite}.command.json`)), '禁止覆盖执行原件')
  assert(protection().ok)
  const env = allowedEnv(suite)
  const argv = [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', test,
    '--config', join(out, 'vitest.config.mjs'), '--no-cache', '--reporter=verbose', '--reporter=json',
    '--outputFile', join(out, `${suite}.result.json`),
    '--testNamePattern', suite === 'controls' ? '^controls:' : '^necessary-red:']
  const start = new Date().toISOString()
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd: frozen, env, encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024,
  })
  save(`${suite}.stdout.log`, result.stdout ?? '')
  save(`${suite}.stderr.log`, result.stderr ?? '')
  save(`${suite}.command.json`, {
    argv, cwd: frozen, env, start, end: new Date().toISOString(), pid: result.pid,
    originalExit: result.status, signal: result.signal, error: result.error?.message ?? null,
  })
  const report = existsSync(join(out, `${suite}.result.json`)) ? json(join(out, `${suite}.result.json`)) : null
  const check = protection()
  const expected = suite === 'controls' ? [8, 0, 3] : [0, 3, 8]
  const actual = [report?.numPassedTests, report?.numFailedTests, report?.numPendingTests]
  const countsMatch = JSON.stringify(actual) === JSON.stringify(expected)
  save(`${suite}.summary.json`, {
    suite, originalExit: result.status, signal: result.signal, expected, actual, countsMatch,
    protection: check, assertions: report?.testResults.flatMap(file => file.assertionResults) ?? [],
    verdict: check.ok && countsMatch && result.status === (suite === 'controls' ? 0 : 1)
      ? suite === 'controls' ? 'PASS_LIMITED_CONTROLS' : 'NECESSARY_RED_CONFIRMED' : 'FAIL_OR_BLOCKED',
    guiSigned: false, wholeFeatureSigned: false, totalGateSigned: false, release: 'STOP',
  })
  console.log(JSON.stringify({ stage, suite, originalExit: result.status, actual, countsMatch, protection: check }))
  // A necessary RED retains its real nonzero exit; it is never rewritten to success.
  process.exitCode = result.status ?? 2
} else {
  assert(!existsSync(join(out, 'close.json')))
  const check = protection()
  const summaries = ['controls', 'red'].map(name => json(join(out, `${name}.summary.json`)))
  const commands = ['ask-relative-to-atf', 'controls', 'red'].map(name =>
    ({ name, ...json(join(out, `${name}.command.json`)) }))
  const processes = commands.map(command => {
    const ps = spawnSync('/bin/ps', ['-p', String(command.pid), '-o', 'pid=,ppid=,command='], {
      encoding: 'utf8', env: { PATH: '/usr/bin:/bin' },
    })
    return {
      command: command.name, pid: command.pid, originalExit: command.originalExit,
      psExit: ps.status, stdout: ps.stdout, stderr: ps.stderr, exited: ps.status === 1 && !ps.stdout.trim(),
    }
  })
  const expectedObserved = summaries[0].verdict === 'PASS_LIMITED_CONTROLS'
    && summaries[1].verdict === 'NECESSARY_RED_CONFIRMED'
  const released = check.ok && processes.every(process => process.exited)
  save('close.json', {
    at: new Date().toISOString(), protection: check, processes, released, stop: true,
    expectedObserved, verdict: expectedObserved && released ? 'FAIL_NECESSARY_RED_CONFIRMED' : 'BLOCKED_OR_UNEXPECTED',
    results: summaries.map(({ suite, originalExit, actual, verdict }) => ({ suite, originalExit, actual, verdict })),
    gui: 'NOT_RUN_THIS_ROLE', wholeRAAI06: 'NOT_SIGNED', totalGate: 'NOT_SIGNED', release: 'STOP',
  })
  save('owned-runtime-roots.json', Object.fromEntries(['home', 'tmp', 'cache', 'runtime', 'files', 'backups', 'exports']
    .map(path => [path, inventory(join(out, path))])))
  save('index.json', inventory(out))
  console.log(JSON.stringify(json(join(out, 'close.json'))))
  process.exitCode = released && expectedObserved ? 0 : 2
}

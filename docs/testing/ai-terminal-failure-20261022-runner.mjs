import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync,
  readdirSync, readlinkSync, realpathSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'ai-terminal-failure-20261022'
const testing = join(repo, 'docs/testing')
const pkg = 'packages/dsh-pm-tool'
const upstream = '/Users/bytedance/Projects/dsh-pm/deepseek-harness'
const u4 = '/private/tmp/pmtool-u4-closure-20261022-r2'
const depsSource = join(u4, pkg, 'node_modules')
const piSource = realpathSync(join(upstream, 'packages/llm/llm-pi-ai/node_modules/@earendil-works/pi-ai'))
const [stage, round] = process.argv.slice(2)
assert(['freeze', 'controls', 'red', 'legacy', 'close'].includes(stage))
assert.match(round, /^r[1-9]\d*$/)
const out = join(testing, `${prefix}-selftmp`, round)
const frozen = join(out, 'frozen')
const deps = join(frozen, pkg, 'node_modules')
const inputs = ['src', 'scripts', 'lib', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json',
  'vitest.config.ts', 'tsdown.config.ts', 'cordis.patch.yml', 'locale']
const consumed = ['src/core/ai-client.ts', 'src/core/copilot.ts', 'src/core/status.ts',
  'src/core/model-route.ts', 'scripts/verify-ai-client.mjs']
const sha = b => createHash('sha256').update(b).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))

function save(name, value) {
  const target = resolve(out, name)
  assert(target.startsWith(`${out}/`), '唯一自有写根')
  mkdirSync(dirname(target), { recursive: true, mode: 0o700 })
  writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}

function inventory(root) {
  if (!existsSync(root)) return { missing: true }
  const result = {}
  function walk(p) {
    const s = lstatSync(p), key = relative(root, p) || '.'
    if (s.isSymbolicLink()) result[key] = { link: readlinkSync(p) }
    else if (s.isDirectory()) for (const name of readdirSync(p).sort()) walk(join(p, name))
    else result[key] = { bytes: s.size, sha256: sha(readFileSync(p)) }
  }
  walk(root)
  return result
}

function dependencyAudit(root, oldRoot) {
  const files = [], links = [], external = [], sharedInodes = []
  function walk(p) {
    const key = relative(root, p), s = lstatSync(p)
    if (s.isSymbolicLink()) {
      const target = realpathSync(p)
      links.push({ path: key, target: relative(root, target) })
      if (!target.startsWith(`${root}/`)) external.push({ path: key, target })
    } else if (s.isDirectory()) for (const name of readdirSync(p).sort()) walk(join(p, name))
    else {
      files.push({ path: key, bytes: s.size, sha256: sha(readFileSync(p)) })
      if (oldRoot && existsSync(join(oldRoot, key))) {
        const old = statSync(join(oldRoot, key))
        if (s.dev === old.dev && s.ino === old.ino) sharedInodes.push(key)
      }
    }
  }
  walk(root)
  return { files, links, external, sharedInodes }
}

function protection() {
  const old = json(join(out, 'protected-before.json'))
  const protectedDrift = Object.keys(old).filter(p => JSON.stringify(inventory(p)) !== JSON.stringify(old[p]))
  const frozenBefore = json(join(out, 'frozen-inputs.json'))
  const frozenDrift = Object.keys(frozenBefore).filter(p =>
    JSON.stringify(inventory(join(frozen, pkg, p))) !== JSON.stringify(frozenBefore[p]))
  const depsBefore = json(join(out, 'dependencies-before.json'))
  const depsNow = dependencyAudit(deps, depsSource)
  const depsDrift = JSON.stringify(depsBefore.files) !== JSON.stringify(depsNow.files)
    || JSON.stringify(depsBefore.links) !== JSON.stringify(depsNow.links)
  const captured = json(join(out, 'main-inputs.json'))
  const concurrentInputChanges = Object.keys(captured).filter(p =>
    JSON.stringify(inventory(join(repo, pkg, p))) !== JSON.stringify(captured[p]))
  // Full snapshots document parallel work. Only actual consumed inputs are a same-candidate guard.
  const mainConsumedDrift = consumed.filter(p =>
    JSON.stringify(inventory(join(repo, pkg, p))) !== JSON.stringify(json(join(out, 'consumed-before.json'))[p]))
  return { protectedDrift, frozenDrift, depsDrift, external: depsNow.external,
    sharedInodes: depsNow.sharedInodes, mainConsumedDrift, concurrentInputChanges,
    ok: !protectedDrift.length && !frozenDrift.length && !depsDrift && !depsNow.external.length
      && !depsNow.sharedInodes.length && !mainConsumedDrift.length }
}

if (stage === 'freeze') {
  assert(!existsSync(out), '禁止覆盖旧轮次')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  const watched = [
    ...consumed.map(p => join(repo, pkg, p)),
    join(repo, pkg, 'lib'), join(u4, pkg, 'lib'), depsSource,
    ...['assembler.ts', 'index.ts', 'types.ts', 'error.ts'].map(p => join(upstream, 'packages/llm/llm/src', p)),
    ...['stream.ts', 'replay.ts'].map(p => join(upstream, 'packages/llm/llm-pi-ai/src', p)),
    join(upstream, 'packages/llm/llm/tests/assembler.spec.ts'),
    join(upstream, 'packages/llm/llm/tests/service.spec.ts'),
    join(upstream, 'packages/llm/llm-pi-ai/tests/stream.spec.ts'),
    piSource,
    ...['remaining-governance-cases-20261021.md', 'remaining-acceptance-register-20261021.md']
      .map(p => join(testing, p)),
  ]
  save('protected-before.json', Object.fromEntries(watched.map(p => [p, inventory(p)])))
  save('consumed-before.json', Object.fromEntries(consumed.map(p => [p, inventory(join(repo, pkg, p))])))
  const captured = Object.fromEntries(inputs.map(p => [p, inventory(join(repo, pkg, p))]))
  save('main-inputs.json', captured)
  for (const p of inputs) cpSync(join(repo, pkg, p), join(frozen, pkg, p),
    { recursive: true, preserveTimestamps: true, force: false, errorOnExist: true })
  const frozenMap = Object.fromEntries(inputs.map(p => [p, inventory(join(frozen, pkg, p))]))
  assert.deepEqual(frozenMap, captured)
  save('frozen-inputs.json', frozenMap)
  const originalDeps = dependencyAudit(depsSource)
  assert.deepEqual(originalDeps.external, [], '只允许已自包含的 U4r2 依赖白名单')
  function copyDependencies(p) {
    const target = join(deps, relative(depsSource, p)), s = lstatSync(p)
    if (s.isSymbolicLink()) {
      const resolved = realpathSync(p)
      assert(resolved.startsWith(`${depsSource}/`), '禁止外部依赖软链')
      symlinkSync(relative(dirname(target), join(deps, relative(depsSource, resolved))), target)
    } else if (s.isDirectory()) {
      mkdirSync(target, { recursive: true, mode: 0o700 })
      for (const name of readdirSync(p)) copyDependencies(join(p, name))
    } else copyFileSync(p, target, constants.COPYFILE_EXCL)
  }
  copyDependencies(depsSource)
  const brand = realpathSync(join(realpathSync(join(deps, '@deepseek-ai/dsh-llm')), '../dsh-brand'))
  assert(brand.startsWith(`${deps}/`))
  symlinkSync(relative(join(deps, '@deepseek-ai'), brand), join(deps, '@deepseek-ai/dsh-brand'))
  cpSync(piSource, join(deps, '@earendil-works/pi-ai'), {
    recursive: true, preserveTimestamps: true, force: false, errorOnExist: true })
  const ownDeps = dependencyAudit(deps, depsSource)
  assert.deepEqual(ownDeps.external, [])
  assert.deepEqual(ownDeps.sharedInodes, [])
  const copiedByPath = new Map(ownDeps.files.map(f => [f.path, f]))
  for (const f of originalDeps.files) {
    assert.deepEqual(copiedByPath.get(f.path), f, f.path)
  }
  save('dependencies-before.json', ownDeps)
  symlinkSync(relative(frozen, deps), join(frozen, 'node_modules'))
  cpSync(join(testing, `${prefix}-cases.test.ts`), join(frozen, 'docs/testing', `${prefix}-cases.test.ts`),
    { recursive: true, preserveTimestamps: true, force: false, errorOnExist: true })
  cpSync(join(upstream, 'packages/llm/llm-pi-ai/src'), join(frozen, 'upstream/pi-src'),
    { recursive: true, preserveTimestamps: true, force: false, errorOnExist: true })
  cpSync(join(upstream, 'packages/llm/llm/src'), join(frozen, 'upstream/llm-src'),
    { recursive: true, preserveTimestamps: true, force: false, errorOnExist: true })
  save('extra-inputs.json', { cases: inventory(join(frozen, 'docs/testing')),
    pi: inventory(join(frozen, 'upstream/pi-src')), llm: inventory(join(frozen, 'upstream/llm-src')) })
  for (const p of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, p), { mode: 0o700 })
  save('vitest.config.mjs', `export default ${JSON.stringify({
    root: frozen, cacheDir: join(out, 'cache/vite'),
    test: { environment: 'node', cache: false, include: [`docs/testing/${prefix}-cases.test.ts`],
      pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000 },
  }, null, 2)}\n`)
  const head = spawnSync('/usr/bin/git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' })
  assert.equal(head.status, 0)
  const diff = spawnSync('/usr/bin/git', ['diff', '--', ...consumed.map(p => `${pkg}/${p}`)],
    { cwd: repo, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  assert.equal(diff.status, 0)
  save('consumed-tracked.diff', diff.stdout)
  const versions = Object.fromEntries(['@deepseek-ai/dsh-llm', '@deepseek-ai/cordis', '@earendil-works/pi-ai', 'vitest']
    .map(p => [p, json(join(deps, p, 'package.json')).version]))
  save('candidate.json', { at: new Date().toISOString(), baselineCommit: head.stdout.trim(),
    consumedTrackedDiffSha256: sha(diff.stdout), completeInputRoots: inputs, consumed,
    source: join(repo, pkg), frozen, depsSource, piSource, versions,
    dependencies: { files: ownDeps.files.length, links: ownDeps.links.length },
    node: process.version, executable: process.execPath, platform: process.platform,
    productEdited: false, install: false, build: false, network: false, gui: false,
    services: false, credentials: false, gitWrite: false })
  const check = protection()
  save('freeze-check.json', check)
  assert(check.ok)
  console.log(JSON.stringify({ stage, ...json(join(out, 'candidate.json')), protection: check }))
} else if (stage !== 'close') {
  assert(!existsSync(join(out, `${stage}.command.json`)), '原执行不得覆盖')
  assert(protection().ok)
  const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
    DSH_HOME: join(out, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
    NODE_DISABLE_COMPILE_CACHE: '1', ATF_OBSERVATIONS: join(out, `${stage}.observations.ndjson`) }
  const argv = stage === 'legacy'
    ? [process.execPath, join(frozen, pkg, 'scripts/verify-ai-client.mjs')]
    : [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run',
      `docs/testing/${prefix}-cases.test.ts`, '--config', join(out, 'vitest.config.mjs'),
      '--testNamePattern', stage === 'controls' ? '^controls:' : '^necessary-red:',
      '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(out, `${stage}.result.json`)]
  const start = new Date().toISOString()
  const result = spawnSync(argv[0], argv.slice(1), { cwd: frozen, env, encoding: 'utf8',
    timeout: 120000, maxBuffer: 32 * 1024 * 1024 })
  save(`${stage}.stdout.log`, result.stdout ?? '')
  save(`${stage}.stderr.log`, result.stderr ?? '')
  save(`${stage}.command.json`, { argv, cwd: frozen, env, start, end: new Date().toISOString(),
    pid: result.pid, originalExit: result.status, signal: result.signal, error: result.error?.message ?? null })
  const report = stage !== 'legacy' && existsSync(join(out, `${stage}.result.json`))
    ? json(join(out, `${stage}.result.json`)) : null
  const failures = report?.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'failed') ?? []
  const check = protection()
  save(`${stage}.summary.json`, { originalExit: result.status, signal: result.signal,
    passed: report?.numPassedTests ?? null, failed: report?.numFailedTests ?? null,
    pending: report?.numPendingTests ?? null, failures, protection: check,
    candidate: json(join(out, 'candidate.json')), guiSigned: false, repairedCandidateSigned: false, totalGateSigned: false })
  console.log(JSON.stringify({ stage, originalExit: result.status, passed: report?.numPassedTests,
    failed: report?.numFailedTests, pending: report?.numPendingTests,
    failures: failures.map(f => ({ title: f.fullName, messages: f.failureMessages })), protection: check }))
  process.exitCode = check.ok ? result.status ?? 1 : 2
} else {
  const check = protection()
  const extra = json(join(out, 'extra-inputs.json'))
  assert.deepEqual(inventory(join(frozen, 'docs/testing')), extra.cases)
  assert.deepEqual(inventory(join(frozen, 'upstream/pi-src')), extra.pi)
  assert.deepEqual(inventory(join(frozen, 'upstream/llm-src')), extra.llm)
  const attempted = ['controls', 'red', 'legacy'].filter(name => existsSync(join(out, `${name}.command.json`)))
  const processes = attempted.map(name => {
    const cmd = json(join(out, `${name}.command.json`))
    const ps = spawnSync('/bin/ps', ['-p', String(cmd.pid), '-o', 'pid=,ppid=,command='],
      { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } })
    return { name, pid: cmd.pid, exit: cmd.originalExit, psExit: ps.status,
      stdout: ps.stdout, stderr: ps.stderr, exited: ps.status === 1 && !ps.stdout.trim() }
  })
  const controls = json(join(out, 'controls.summary.json'))
  const red = existsSync(join(out, 'red.summary.json')) ? json(join(out, 'red.summary.json')) : null
  const legacy = existsSync(join(out, 'legacy.summary.json')) ? json(join(out, 'legacy.summary.json')) : null
  save('close.json', { at: new Date().toISOString(), protection: check, processes,
    released: check.ok && processes.every(p => p.exited), controls: { passed: controls.passed, failed: controls.failed },
    red: red ? { passed: red.passed, failed: red.failed } : { status: 'NOT_RUN' },
    legacyExit: legacy?.originalExit ?? null,
    verdict: controls.originalExit === 0 && red?.failed > 0 ? 'FAIL_NECESSARY_RED' : 'NOT_DETERMINED',
    build: false, install: false, gui: false, services: false, credentials: false, gitWrite: false })
  save('sealed-evidence.json', Object.fromEntries(readdirSync(out).filter(p =>
    lstatSync(join(out, p)).isFile()).sort().map(p => [p, inventory(join(out, p))])))
  console.log(JSON.stringify(json(join(out, 'close.json'))))
  process.exitCode = check.ok && processes.every(p => p.exited) ? 0 : 2
}

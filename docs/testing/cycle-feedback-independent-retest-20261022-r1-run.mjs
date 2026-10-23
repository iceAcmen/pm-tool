import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { constants, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync,
  readdirSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'cycle-feedback-independent-retest-20261022-r1'
const testing = join(repo, 'docs/testing'), pkg = 'packages/dsh-pm-tool'
const source = '/private/tmp/pmtool-u4-closure-20261022-r2'
const parent = '/private/tmp/pmtool-a20v3-closure-20261022-r1'
const evidence = join(repo, 'reports/all-pending-evidence-20261021')
const dev = join(evidence, 'CycleFeedbackDevR1'), handoff = join(dev, 'handoff')
const raw = join(evidence, 'FeedbackRemainingR1')
const originalCase = 'cycle-feedback-reason-20261022-cases.test.tsx'
const [stage, suite] = process.argv.slice(2)
assert(['freeze', 'test', 'noemit', 'close'].includes(stage))
const out = join(testing, `${prefix}-selftmp/r1`), frozen = join(out, 'frozen')
const depsSource = join(source, pkg, 'node_modules'), deps = join(frozen, pkg, 'node_modules')
const inputs = ['src', 'scripts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json',
  'vitest.config.ts', 'tsdown.config.ts', 'cordis.patch.yml', 'locale']
const added = ['src/commands/task-predecessor-feedback.test.ts', 'src/client/result-card-permission.test.ts']
  .map(p => `${pkg}/${p}`)
const affected = [
  'src/commands/task-feedback.test.ts', 'src/core/ui-feedback.test.ts',
  'src/client/result-card.test.ts', 'src/client/result-card-copy.test.ts',
  'src/client/index-command-feedback.test.tsx', 'src/client/panel-transport-error-feedback.test.tsx',
  'src/core/tasks-files-atomic.test.ts', 'src/core/task-ops.test.ts',
  'src/core/task-materials.test.ts', 'src/client/shared/task-relation-projection.test.ts',
].map(p => `${pkg}/${p}`)
const sha = b => createHash('sha256').update(b).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
function save(name, value) {
  const target = resolve(out, name)
  assert(target.startsWith(`${out}/`))
  mkdirSync(dirname(target), { recursive: true, mode: 0o700 })
  writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`,
    { flag: 'wx' })
}
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return { missing: true }
  function walk(p) {
    const s = lstatSync(p), key = relative(root, p) || '.'
    if (s.isSymbolicLink()) result[key] = { link: readlinkSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else result[key] = { bytes: s.size, sha256: sha(readFileSync(p)), mtimeMs: s.mtimeMs }
  }
  walk(root)
  return result
}
const fullInputs = root => Object.fromEntries(inputs.map(n => [n, inventory(join(root, pkg, n))]))
function flattenInputs(root) {
  return Object.entries(fullInputs(root)).flatMap(([name, files]) => Object.entries(files)
    .filter(([, v]) => v.sha256).map(([path, v]) => ({
      path: `${pkg}/${name}${path === '.' ? '' : `/${path}`}`, ...v,
    })))
}
function declarations(file) {
  const entries = readFileSync(file, 'utf8').trim().split('\n').map(line => {
    const m = /^([a-f0-9]{64})  (.+)$/.exec(line)
    assert(m)
    return { path: m[2], sha256: m[1] }
  })
  assert.equal(new Set(entries.map(r => r.path)).size, entries.length)
  return entries
}
function checkBinding() {
  const delivery = json(join(handoff, 'delivery.json'))
  assert(delivery.released && delivery.stop)
  assert.equal(delivery.baseline, '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd')
  const successor = declarations(join(handoff, 'successor104.sha256'))
  const complete = declarations(join(handoff, 'complete-input-files.sha256'))
  assert.equal(successor.length, 104)
  assert.equal(complete.length, 509)
  for (const r of [...successor, ...complete]) assert.equal(sha(readFileSync(join(repo, r.path))), r.sha256, r.path)
  const actual = flattenInputs(repo).map(({ path, sha256 }) => ({ path, sha256 }))
  assert.deepEqual(actual.sort((a, b) => a.path.localeCompare(b.path)),
    [...complete].sort((a, b) => a.path.localeCompare(b.path)))
  const delta = json(join(handoff, 'increment-files.json'))
  assert.equal(delta.length, 5)
  for (const r of delta) {
    assert.equal(sha(readFileSync(join(repo, r.path))), r.currentSha256, r.path)
    assert.equal(lstatSync(join(repo, r.path)).size, r.bytes)
    if (r.oldCandidateSha256) assert.equal(sha(readFileSync(join(source, r.path))), r.oldCandidateSha256)
    else assert(!existsSync(join(source, r.path)))
  }
  assert.equal(sha(readFileSync(join(handoff, 'increment.patch'))), delivery.patchSha256)
  const old = json(join(dev, 'repaired/original102.json'))
  assert.equal(old.length, 102)
  for (const r of old) assert.equal(sha(readFileSync(join(r.origin, r.path))), r.expected)
  return { successor, complete, delta, patchSha256: delivery.patchSha256 }
}
function dependencyAudit(root, compareRoot) {
  const files = [], links = [], external = [], sharedInodes = []
  function walk(p) {
    const s = lstatSync(p), key = relative(root, p)
    if (s.isSymbolicLink()) {
      const target = realpathSync(p)
      if (!target.startsWith(`${root}/`)) external.push({ path: key, target })
      links.push({ path: key, target: relative(root, target) })
    } else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else {
      files.push({ path: key, bytes: s.size, sha256: sha(readFileSync(p)) })
      if (compareRoot) {
        const old = lstatSync(join(compareRoot, key))
        if (old.dev === s.dev && old.ino === s.ino) sharedInodes.push(key)
      }
    }
  }
  walk(root)
  return { files, links, external, sharedInodes }
}
function protection() {
  const before = json(join(out, 'protected-before.json'))
  const drift = Object.keys(before).filter(p => JSON.stringify(inventory(p)) !== JSON.stringify(before[p]))
  const main = fullInputs(repo), own = fullInputs(frozen)
  const mainBefore = json(join(out, 'main-inputs.json')), ownBefore = json(join(out, 'frozen-inputs.json'))
  const mainDrift = inputs.filter(n => JSON.stringify(main[n]) !== JSON.stringify(mainBefore[n]))
  const frozenDrift = inputs.filter(n => JSON.stringify(own[n]) !== JSON.stringify(ownBefore[n]))
  const dependencies = dependencyAudit(deps, depsSource)
  const dependencyDrift = JSON.stringify(dependencies) !== JSON.stringify(json(join(out, 'dependencies.json')))
  const caseDrift = sha(readFileSync(join(frozen, 'docs/testing', originalCase)))
    !== sha(readFileSync(join(testing, originalCase)))
  const current = checkBinding()
  const bindingDrift = JSON.stringify(current) !== JSON.stringify(json(join(out, 'binding.json')))
  return { protectedObjects: Object.keys(before).length, drift, mainDrift, frozenDrift,
    dependencyDrift, dependencyExternal: dependencies.external.length,
    dependencySharedInodes: dependencies.sharedInodes.length, caseDrift, bindingDrift,
    ok: !drift.length && !mainDrift.length && !frozenDrift.length
      && !dependencyDrift && !caseDrift && !bindingDrift }
}
function git(args) {
  const r = spawnSync('/usr/bin/git', args, { cwd: repo, encoding: 'utf8',
    env: { PATH: '/usr/bin:/bin', GIT_OPTIONAL_LOCKS: '0' } })
  assert.equal(r.status, 0)
  return r.stdout
}
function environment(name) {
  return { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
    DSH_HOME: join(out, 'runtime'), PM_FILE_ATOMIC_TMP: join(out, 'tmp'), CI: 'true',
    LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1',
    CF_INPUT: join(out, 'rpc-input.json'), CF_OBSERVATIONS: join(out, `${name}.observations.jsonl`) }
}
if (stage === 'freeze') {
  assert(!existsSync(out), '禁止覆盖任何已有复验轮次')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  save('binding.json', checkBinding())
  const watched = [
    ...readdirSync(testing).filter(n => !n.startsWith(prefix) && lstatSync(join(testing, n)).isFile())
      .map(n => join(testing, n)),
    ...readdirSync(testing).filter(n => n.startsWith('cycle-feedback-reason-20261022'))
      .map(n => join(testing, n)),
    raw, dev, join(evidence, 'A20V3/source-files.sha256'),
    join(evidence, 'U4/increment-files.sha256'), join(evidence, 'U4/candidate-evidence-manifest.json'),
    join(repo, pkg, 'lib'), join(source, pkg, 'lib'), join(parent, pkg, 'lib'),
    ...inputs.map(n => join(source, pkg, n)), depsSource,
    ...declarations(join(handoff, 'successor104.sha256')).filter(r => !r.path.startsWith(`${pkg}/`))
      .flatMap(r => [join(repo, r.path), join(parent, r.path)]),
    ...['necessary-red.command.json', 'necessary-red.stdout.log', 'necessary-red.stderr.log', 'necessary-red.result.json']
      .map(n => join(testing, 'a17-transport-feedback-contract-20261022-selftmp/r2', n)),
    ...['original-counterexamples20.command.json', 'original-counterexamples20.stdout.log',
      'original-counterexamples20.stderr.log', 'original-counterexamples20.result.json']
      .map(n => join(testing, 'a18-feedback-context-independent-retest-20261022-selftmp/r1', n)),
    join(repo, 'vendor'), join(repo, '.git/index'), join(repo, '.git/HEAD'),
  ]
  save('protected-before.json', Object.fromEntries([...new Set(watched)].sort().map(p => [p, inventory(p)])))
  save('main-inputs.json', fullInputs(repo))
  for (const n of inputs) cpSync(join(repo, pkg, n), join(frozen, pkg, n), {
    recursive: true, preserveTimestamps: true, errorOnExist: true, force: false,
  })
  save('frozen-inputs.json', fullInputs(frozen))
  save('complete-input-files.json', flattenInputs(frozen))
  const originalDeps = dependencyAudit(depsSource)
  assert.deepEqual(originalDeps.external, [])
  function copyDependencies(p) {
    const dest = join(deps, relative(depsSource, p)), s = lstatSync(p)
    if (s.isSymbolicLink()) {
      const target = realpathSync(p)
      assert(target.startsWith(`${depsSource}/`))
      symlinkSync(relative(dirname(dest), join(deps, relative(depsSource, target))), dest)
    } else if (s.isDirectory()) {
      mkdirSync(dest, { recursive: true, mode: 0o700 })
      for (const n of readdirSync(p)) copyDependencies(join(p, n))
    } else copyFileSync(p, dest, constants.COPYFILE_EXCL)
  }
  copyDependencies(depsSource)
  const ownDeps = dependencyAudit(deps, depsSource)
  assert.deepEqual(ownDeps.files, originalDeps.files)
  assert.deepEqual(ownDeps.links, originalDeps.links)
  assert.deepEqual(ownDeps.external, [])
  assert.deepEqual(ownDeps.sharedInodes, [])
  save('dependencies.json', ownDeps)
  symlinkSync(relative(frozen, deps), join(frozen, 'node_modules'))
  cpSync(join(testing, originalCase), join(frozen, 'docs/testing', originalCase),
    { preserveTimestamps: true, errorOnExist: true, force: false })
  const events = json(join(raw, '45-real-response-events.json'))
  const request = events.find(e => e.method === 'Network.requestWillBeSent')
  const event = events.find(e => e.method === 'Network.responseReceived')
  assert.equal(request.requestId, event.requestId)
  const response = JSON.parse(event.body.body)
  assert.equal(request.body.rpcId, response.rpcId)
  assert.equal(response.result.ok, true)
  assert.equal(response.result.value.result.kind, 'error')
  const rpc = { hostResponse: response.result.value.result, request: request.body,
    responseSha256: sha(event.body.body), source: relative(repo, join(raw, '45-real-response-events.json')) }
  assert.deepEqual(rpc, json(join(testing, 'cycle-feedback-reason-20261022-selftmp/r1/rpc-input.json')))
  save('rpc-input.json', rpc)
  for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n), { mode: 0o700 })
  save('vitest.config.mjs', `export default ${JSON.stringify({
    root: frozen, cacheDir: join(out, 'cache/vite'), test: { environment: 'node', cache: false,
      include: ['docs/testing/*.test.tsx', `${pkg}/src/**/*.test.ts`, `${pkg}/src/**/*.test.tsx`],
      pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1,
      testTimeout: 20000 },
  }, null, 2)}\n`)
  const baseline = git(['rev-parse', 'HEAD']).trim()
  assert.equal(baseline, '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd')
  save('tracked-product.diff', git(['diff', '--', `${pkg}/src`, `${pkg}/scripts`,
    ...inputs.filter(n => !['src', 'scripts', 'locale'].includes(n)).map(n => `${pkg}/${n}`), `${pkg}/locale`]))
  save('untracked-product-files.txt', git(['ls-files', '--others', '--exclude-standard', '--', pkg]))
  cpSync(join(handoff, 'increment.patch'), join(out, 'increment.patch'), { errorOnExist: true, force: false })
  save('candidate.json', { baseline, frozen, oldCandidate: source, fullInputs: 509, successor: 104,
    incrementalFiles: 5, originalCaseSha256: sha(readFileSync(join(testing, originalCase))),
    patchSha256: sha(readFileSync(join(out, 'increment.patch'))),
    dependencyWhitelist: depsSource, dependencyFiles: ownDeps.files.length, dependencyLinks: ownDeps.links.length,
    node: process.version, executable: process.execPath, productEdited: false,
    build: false, install: false, gui: false, services: false, gitWrite: false })
  const check = protection()
  save('freeze-check.json', check)
  assert(check.ok)
  console.log(JSON.stringify({ stage, ...json(join(out, 'candidate.json')), protection: check }))
} else if (stage === 'test' || stage === 'noemit') {
  const name = stage === 'noemit' ? 'noemit' : suite
  assert(['original', 'new', 'affected', 'noemit'].includes(name))
  assert(!existsSync(join(out, `${name}.command.json`)), '禁止覆盖原始执行')
  const before = protection()
  assert(before.ok)
  const paths = name === 'original' ? [`docs/testing/${originalCase}`] : name === 'new' ? added : affected
  const argv = name === 'noemit'
    ? [process.execPath, join(deps, 'typescript/bin/tsc'), '--noEmit', '--project', 'tsconfig.json']
    : [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', ...paths,
      '--config', join(out, 'vitest.config.mjs'), '--no-cache', '--reporter=verbose',
      '--reporter=json', '--outputFile', join(out, `${name}.result.json`)]
  const env = environment(name), cwd = name === 'noemit' ? join(frozen, pkg) : frozen
  const start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd, env, encoding: 'utf8', timeout: 120000,
    maxBuffer: 32 * 1024 * 1024 })
  save(`${name}.stdout.log`, r.stdout ?? '')
  save(`${name}.stderr.log`, r.stderr ?? '')
  save(`${name}.command.json`, { argv, cwd, env, start, end: new Date().toISOString(),
    pid: r.pid, originalExit: r.status, signal: r.signal, error: r.error?.message ?? null })
  const report = name !== 'noemit' && existsSync(join(out, `${name}.result.json`))
    ? json(join(out, `${name}.result.json`)) : null
  const check = protection()
  const summary = { originalExit: r.status, signal: r.signal, error: r.error?.message ?? null,
    passed: report?.numPassedTests ?? null, failed: report?.numFailedTests ?? null,
    pending: report?.numPendingTests ?? null,
    failures: report?.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'failed') ?? [],
    protectionBefore: before, protectionAfter: check, sourceAutoOnly: true, gui: 'BLOCKED' }
  save(`${name}.summary.json`, summary)
  console.log(JSON.stringify({ name, ...summary }))
  process.exitCode = check.ok ? (r.status ?? 1) : 2
} else {
  const check = protection()
  const commands = readdirSync(out).filter(n => n.endsWith('.command.json')).map(n => json(join(out, n)))
  const processChecks = commands.map(cmd => {
    const r = spawnSync('/bin/ps', ['-p', String(cmd.pid), '-o', 'pid=,ppid=,command='],
      { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } })
    return { pid: cmd.pid, exit: r.status, stdout: r.stdout, gone: r.status === 1 && !r.stdout.trim() }
  })
  const ps = spawnSync('/bin/ps', ['-axo', 'pid=,ppid=,command='], {
    encoding: 'utf8', env: { PATH: '/usr/bin:/bin' },
  })
  assert.equal(ps.status, 0)
  const remaining = ps.stdout.split('\n').filter(line => line.includes(out))
  const released = check.ok && commands.length > 0 && processChecks.every(p => p.gone) && !remaining.length
  save('close.json', { at: new Date().toISOString(), protection: check, processChecks, remaining,
    released, stop: released, sourceAutoOnly: true, gui: 'BLOCKED' })
  save('sealed-inventory.json', inventory(out))
  console.log(JSON.stringify({ stage, protection: check, processChecks, remaining, released }))
  process.exitCode = released ? 0 : 2
}

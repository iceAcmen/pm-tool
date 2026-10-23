import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { constants, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync,
  readdirSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'cycle-feedback-reason-20261022'
const testing = join(repo, 'docs/testing')
const pkg = 'packages/dsh-pm-tool'
const source = '/private/tmp/pmtool-u4-closure-20261022-r2'
const parent = '/private/tmp/pmtool-a20v3-closure-20261022-r1'
const raw = join(repo, 'reports/all-pending-evidence-20261021/FeedbackRemainingR1')
const [stage, round] = process.argv.slice(2)
assert(['freeze', 'test', 'close'].includes(stage))
assert.match(round, /^r[1-9]\d*$/)
const base = join(testing, `${prefix}-selftmp`)
const out = join(base, round), frozen = join(out, 'frozen')
const depsSource = join(source, pkg, 'node_modules')
const deps = join(frozen, pkg, 'node_modules')
const inputs = ['src', 'scripts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json',
  'vitest.config.ts', 'tsdown.config.ts', 'cordis.patch.yml', 'locale']
const sha = b => createHash('sha256').update(b).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
function save(name, value) {
  const target = resolve(out, name)
  assert(target.startsWith(`${out}/`), '唯一自有写根')
  mkdirSync(dirname(target), { recursive: true, mode: 0o700 })
  writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
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
const bytesOnly = m => Object.fromEntries(Object.entries(m).map(([k, v]) => [k,
  { bytes: v.bytes, sha256: v.sha256, link: v.link }]))
const sourceInputs = root => Object.fromEntries(inputs.map(n => [n, inventory(join(root, pkg, n))]))
function declarations() {
  const map = new Map()
  for (const name of ['A20V3/source-files.sha256', 'U4/increment-files.sha256']) {
    for (const line of readFileSync(join(repo, 'reports/all-pending-evidence-20261021', name), 'utf8').trim().split('\n')) {
      const m = /^([a-f0-9]{64})  (.+)$/.exec(line)
      assert(m, '声明格式')
      map.set(m[2], m[1])
    }
  }
  assert.equal(map.size, 102)
  const records = [...map].map(([path, expected]) => {
    const root = path.startsWith('launcher/') ? parent : source
    for (const p of [join(repo, path), join(root, path)]) assert.equal(sha(readFileSync(p)), expected, p)
    return { path, expected, root }
  })
  return records
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
  const old = json(join(out, 'protected-before.json'))
  const drift = Object.keys(old).filter(p => JSON.stringify(inventory(p)) !== JSON.stringify(old[p]))
  const initial = json(join(out, 'source-inputs.json'))
  const frozenInitial = json(join(out, 'frozen-inputs.json'))
  const now = sourceInputs(source), current = sourceInputs(repo), own = sourceInputs(frozen)
  const sourceDrift = inputs.filter(n => JSON.stringify(now[n]) !== JSON.stringify(initial[n]))
  const mainDrift = inputs.filter(n => JSON.stringify(current[n]) !== JSON.stringify(json(join(out, 'main-inputs.json'))[n]))
  const frozenDrift = inputs.filter(n => JSON.stringify(own[n]) !== JSON.stringify(frozenInitial[n]))
  const ownDeps = dependencyAudit(deps, depsSource)
  const initialDeps = json(join(out, 'dependencies-before.json'))
  assert.deepEqual(ownDeps.files, initialDeps.files)
  assert.deepEqual(ownDeps.links, initialDeps.links)
  assert.deepEqual(ownDeps.external, [])
  assert.deepEqual(ownDeps.sharedInodes, [])
  assert.deepEqual(declarations(), json(join(out, 'declarations102.json')))
  return { drift, sourceDrift, mainDrift, frozenDrift, dependencyExternal: ownDeps.external,
    dependencySharedInodes: ownDeps.sharedInodes,
    ok: !drift.length && !sourceDrift.length && !mainDrift.length && !frozenDrift.length }
}
if (stage === 'freeze') {
  assert(!existsSync(out), '禁止覆盖原轮次')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  save('declarations102.json', declarations())
  const watched = [
    ...readdirSync(testing).filter(n => !n.startsWith(prefix) && lstatSync(join(testing, n)).isFile()).map(n => join(testing, n)),
    ...['41-', '42-', '43-', '44-', '45-', '46-'].flatMap(start =>
      readdirSync(raw).filter(n => n.startsWith(start)).map(n => join(raw, n))),
    join(raw, 'loaded-complete.js'),
    join(repo, 'reports/all-pending-evidence-20261021/U4/candidate-evidence-manifest.json'),
    join(repo, pkg, 'lib'), join(source, pkg, 'lib'), join(parent, pkg, 'lib'), depsSource,
    ...['necessary-red.command.json', 'necessary-red.stdout.log', 'necessary-red.stderr.log', 'necessary-red.result.json']
      .map(n => join(testing, 'a17-transport-feedback-contract-20261022-selftmp/r2', n)),
    ...['original-counterexamples20.command.json', 'original-counterexamples20.stdout.log',
      'original-counterexamples20.stderr.log', 'original-counterexamples20.result.json']
      .map(n => join(testing, 'a18-feedback-context-independent-retest-20261022-selftmp/r1', n)),
  ]
  save('protected-before.json', Object.fromEntries([...new Set(watched)].sort().map(p => [p, inventory(p)])))
  save('source-inputs.json', sourceInputs(source))
  save('main-inputs.json', sourceInputs(repo))
  for (const n of inputs) {
    assert(existsSync(join(source, pkg, n)), `完整输入 ${n}`)
    assert.deepEqual(bytesOnly(inventory(join(source, pkg, n))), bytesOnly(inventory(join(repo, pkg, n))))
    cpSync(join(source, pkg, n), join(frozen, pkg, n), { recursive: true, preserveTimestamps: true, errorOnExist: true, force: false })
  }
  save('frozen-inputs.json', sourceInputs(frozen))
  const originalDeps = dependencyAudit(depsSource)
  assert.deepEqual(originalDeps.external, [])
  function copyDependencies(p) {
    const dest = join(deps, relative(depsSource, p)), s = lstatSync(p)
    if (s.isSymbolicLink()) {
      const target = realpathSync(p)
      assert(target.startsWith(`${depsSource}/`), '白名单依赖禁止外链')
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
  save('dependencies-before.json', ownDeps)
  symlinkSync(relative(frozen, deps), join(frozen, 'node_modules'))
  cpSync(join(testing, `${prefix}-cases.test.tsx`), join(frozen, 'docs/testing', `${prefix}-cases.test.tsx`),
    { recursive: true, preserveTimestamps: true, errorOnExist: true, force: false })
  const events = json(join(raw, '45-real-response-events.json'))
  const request = events.find(e => e.method === 'Network.requestWillBeSent')
  const event = events.find(e => e.method === 'Network.responseReceived')
  assert.equal(request.requestId, event.requestId)
  const response = JSON.parse(event.body.body)
  assert.equal(request.body.rpcId, response.rpcId)
  assert.equal(response.result.ok, true)
  assert.equal(response.result.value.result.kind, 'error')
  save('rpc-input.json', { hostResponse: response.result.value.result, request: request.body,
    responseSha256: sha(event.body.body), source: relative(repo, join(raw, '45-real-response-events.json')) })
  for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n), { mode: 0o700 })
  save('vitest.config.mjs', `export default ${JSON.stringify({
    root: frozen, cacheDir: join(out, 'cache/vite'),
    test: { environment: 'node', cache: false, include: ['docs/testing/*.test.tsx'],
      pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000 },
  }, null, 2)}\n`)
  save('candidate.json', { baselineCommit: '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd',
    source, frozen, fullInputs: inputs, declarations: 102,
    dependencyWhitelist: depsSource, dependencyFiles: ownDeps.files.length, dependencyLinks: ownDeps.links.length,
    node: process.version, executable: process.execPath, protectedRoots: watched.length,
    productEdited: false, build: false, install: false, gui: false, services: false, gitWrite: false })
  const check = protection()
  save('freeze-check.json', check)
  assert(check.ok)
  console.log(JSON.stringify({ stage, ...json(join(out, 'candidate.json')), protection: check }))
} else if (stage === 'test') {
  assert(!existsSync(join(out, 'necessary-red.command.json')), '原失败不能覆盖')
  assert(protection().ok)
  const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
    DSH_HOME: join(out, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1',
    CF_INPUT: join(out, 'rpc-input.json'), CF_OBSERVATIONS: join(out, 'observations.jsonl') }
  const argv = [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run',
    `docs/testing/${prefix}-cases.test.tsx`, '--config', join(out, 'vitest.config.mjs'),
    '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(out, 'necessary-red.result.json')]
  const start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd: frozen, env, encoding: 'utf8', timeout: 120000,
    maxBuffer: 32 * 1024 * 1024 })
  save('necessary-red.stdout.log', r.stdout ?? '')
  save('necessary-red.stderr.log', r.stderr ?? '')
  save('necessary-red.command.json', { argv, cwd: frozen, env, start, end: new Date().toISOString(),
    pid: r.pid, originalExit: r.status, signal: r.signal, error: r.error?.message ?? null })
  const report = existsSync(join(out, 'necessary-red.result.json')) ? json(join(out, 'necessary-red.result.json')) : null
  const failures = report?.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'failed') ?? []
  const check = protection()
  save('summary.json', { originalExit: r.status, signal: r.signal, error: r.error?.message ?? null,
    passed: report?.numPassedTests, failed: report?.numFailedTests, pending: report?.numPendingTests,
    failures, protection: check, productVerdict: failures.length ? 'FAIL' : 'NOT_DETERMINED',
    guiSigned: false, repairedCandidateSigned: false, wholeCommitSigned: false })
  console.log(JSON.stringify(json(join(out, 'summary.json'))))
  process.exitCode = r.status ?? 1
} else {
  assert(!existsSync(join(out, 'close.json')))
  const check = protection(), cmd = json(join(out, 'necessary-red.command.json'))
  const ps = spawnSync('/bin/ps', ['-p', String(cmd.pid), '-o', 'pid=,ppid=,command='],
    { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } })
  save('process-check.json', { pid: cmd.pid, originalExit: ps.status, stdout: ps.stdout, stderr: ps.stderr })
  const noTestProcess = ps.status === 1 && !ps.stdout.trim()
  save('close.json', { ...check, noTestProcess, released: check.ok && noTestProcess,
    productVerdict: json(join(out, 'summary.json')).productVerdict,
    build: false, gui: false, services: false, gitWrite: false })
  save('sealed-inventory.json', inventory(out))
  console.log(JSON.stringify(json(join(out, 'close.json'))))
  process.exitCode = check.ok && noTestProcess ? 0 : 1
}

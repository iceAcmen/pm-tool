import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const self = fileURLToPath(import.meta.url)
const repo = path.resolve(path.dirname(self), '../..')
const ownPrefix = 'copilot-error-prefix-independent-retest-20261022-r1'
const originalPrefix = 'successor112-auth-gui-prefix-20261022-r1'
const evidence = path.join(repo, 'reports/all-pending-evidence-20261021')
const out = path.join(evidence, 'CopilotPrefixRetestR1')
const devOut = path.join(evidence, 'CopilotPrefixDevR1')
const parentOut = path.join(evidence, 'CombinedSuccessor112R1')
const main = path.join(repo, 'packages/dsh-pm-tool')
const dev = '/private/tmp/pmtool-copilot-prefix-dev-20261022-r1/packages/dsh-pm-tool'
const old = '/private/tmp/pmtool-combined-successor112-20261022-r1/packages/dsh-pm-tool'
const tmp = '/private/tmp/pmtool-copilot-prefix-independent-retest-20261022-r1'
const pkg = path.join(tmp, 'packages/dsh-pm-tool')
const sidecar = 'src/client/shared/drawers/sidecar-portal.tsx'
const test = 'src/client/copilot-error-prefix.test.tsx'
const fixture = 'src/client/copilot-error-prefix-fixture.json'
const baseline = '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const mark = f => { const b = fs.readFileSync(f); return { bytes: b.length, sha256: sha(b) } }
const original = suffix => path.join(repo, 'docs/testing', originalPrefix + suffix)
const rowsOf = file => read(file).testResults.flatMap(r => r.assertionResults)
const observationsOf = file => fs.readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse)
function save(name, value) {
  const file = path.join(out, name)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, typeof value === 'string' || Buffer.isBuffer(value)
    ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function scan(base) {
  const rows = {}
  function walk(dir, prefix = '') {
    for (const name of fs.readdirSync(dir).sort()) {
      const file = path.join(dir, name), key = prefix + name, st = fs.lstatSync(file)
      if (st.isDirectory()) walk(file, key + '/')
      else if (st.isSymbolicLink()) rows[key] = { link: fs.readlinkSync(file), real: fs.realpathSync(file) }
      else {
        assert(st.isFile(), file)
        rows[key] = { ...mark(file), dev: st.dev, ino: st.ino }
      }
    }
  }
  walk(base)
  return rows
}
const content = rows => Object.fromEntries(Object.entries(rows).map(([f, s]) =>
  [f, 'link' in s ? { link: s.link, real: s.real } : { bytes: s.bytes, sha256: s.sha256 }]))
const digest = rows => sha(Buffer.from(JSON.stringify(content(rows))))
function inputs(base) {
  const result = {}
  for (const name of fs.readdirSync(base).sort()) {
    const file = path.join(base, name)
    if (['src', 'scripts', 'locale'].includes(name)) {
      for (const [f, s] of Object.entries(scan(file))) {
        assert(!('link' in s), 'Input link: ' + f)
        result[name + '/' + f] = { bytes: s.bytes, sha256: s.sha256 }
      }
    } else if (fs.lstatSync(file).isFile()) result[name] = mark(file)
  }
  return result
}
const differences = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const lib = base => fs.existsSync(path.join(base, 'lib')) ? content(scan(path.join(base, 'lib'))) : null
function copy(file, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(file, to, fs.constants.COPYFILE_EXCL)
  assert.deepEqual(mark(to), mark(file))
  const a = fs.statSync(file), b = fs.statSync(to)
  assert(a.dev !== b.dev || a.ino !== b.ino, 'Shared input inode: ' + to)
}
const env = {
  PATH: path.dirname(process.execPath) + ':/usr/bin:/bin:/usr/sbin:/sbin',
  HOME: path.join(tmp, 'home'), TMPDIR: path.join(tmp, 'tmp'), TMP: path.join(tmp, 'tmp'), TEMP: path.join(tmp, 'tmp'),
  XDG_CACHE_HOME: path.join(tmp, 'cache'), XDG_CONFIG_HOME: path.join(tmp, 'config'),
  XDG_DATA_HOME: path.join(tmp, 'state'), XDG_STATE_HOME: path.join(tmp, 'state'),
  NODE_DISABLE_COMPILE_CACHE: '1', CI: 'true', LANG: 'zh_CN.UTF-8', TZ: 'UTC',
  PREFIX_OBSERVATIONS: path.join(out, 'observations.ndjson'),
}
function run(name, bin, args, cwd, executionEnv = env, expected = 0) {
  const started = new Date().toISOString()
  console.log('START ' + name + ' supervisor=' + process.pid)
  const r = spawnSync(bin, args, { cwd, env: executionEnv, encoding: 'utf8', maxBuffer: 48 * 1024 * 1024, timeout: 300000 })
  save(name + '.command.json', { argv: [bin, ...args], cwd, env: executionEnv, supervisorPid: process.pid,
    pid: r.pid, started, ended: new Date().toISOString(), status: r.status, signal: r.signal,
    error: r.error?.message ?? null, expectedStatus: expected })
  save(name + '.stdout.txt', r.stdout ?? '')
  save(name + '.stderr.txt', r.stderr ?? '')
  console.log('END ' + name + ' pid=' + r.pid + ' status=' + r.status + ' signal=' + r.signal)
  return r.status === expected && r.signal === null && !r.error
}
function verifySeal() {
  const seal = read(path.join(devOut, 'handoff-seal.json'))
  assert.equal(seal.released, true); assert.equal(seal.stop, true)
  assert.equal(read(path.join(devOut, 'close.json')).ownedPidsExited, true)
  for (const [f, s] of Object.entries(seal.evidence)) assert.deepEqual(mark(path.join(devOut, f)), s, f)
  for (const [f, s] of Object.entries(seal.ownDocs)) assert.deepEqual(mark(path.join(repo, f)), s, f)
  for (const name of ['prefix-five', 'affected', 'noemit']) {
    const c = read(path.join(devOut, name + '.command.json'))
    let alive = true
    try { process.kill(c.pid, 0) } catch (e) { if (e.code === 'ESRCH') alive = false; else throw e }
    assert.equal(alive, false, 'Developer test PID still alive: ' + c.pid)
  }
  return seal
}
function sourceAudit() {
  const declared = read(path.join(devOut, 'complete-inputs.json'))
  const current = inputs(main), frozen = inputs(dev), oldInputs = inputs(old)
  assert.equal(Object.keys(declared).length, 521)
  assert.deepEqual(current, declared); assert.deepEqual(frozen, declared)
  const parentInputs = read(path.join(parentOut, 'complete-inputs.json'))
  assert.equal(Object.keys(parentInputs).length, 519)
  assert.deepEqual(Object.fromEntries(Object.keys(parentInputs).map(f => [f, oldInputs[f]])), parentInputs)
  assert.deepEqual(Object.keys(oldInputs).filter(f => !(f in parentInputs)).sort(),
    ['retest-probes.test.ts', 'retest-stress.test.ts', 'src/core/retest-legacy-renderer.ts'].sort())
  assert.deepEqual(differences(parentInputs, declared).sort(), [sidecar, test, fixture].sort())
  const before = fs.readFileSync(path.join(old, sidecar), 'utf8')
  const substitutions = [
    ["import { parseActiveModelLane } from '../../../core/ui-feedback.js'",
      "import { parseActiveModelLane, prefixFeedbackOnce } from '../../../core/ui-feedback.js'"],
    ["text: `副驾暂不可用：${e instanceof Error ? e.message : String(e)}`",
      "text: prefixFeedbackOnce('副驾暂不可用', e)"],
  ]
  let exact = before
  for (const [from, to] of substitutions) {
    assert.equal(exact.split(from).length, 2)
    exact = exact.replace(from, to)
  }
  assert.equal(fs.readFileSync(path.join(dev, sidecar), 'utf8'), exact)
  const originalTest = fs.readFileSync(original('-r2-component.fixture.tsx'), 'utf8')
  const migrated = originalTest
    .replace("fs.readFileSync(process.env.PREFIX_TRANSCRIPT!, 'utf8')",
      "fs.readFileSync(new URL('./copilot-error-prefix-fixture.json', import.meta.url), 'utf8')")
    .replace('  fs.appendFileSync(process.env.PREFIX_OBSERVATIONS!',
      '  if (process.env.PREFIX_OBSERVATIONS) fs.appendFileSync(process.env.PREFIX_OBSERVATIONS!')
  assert.equal(fs.readFileSync(path.join(dev, test), 'utf8'), migrated)
  assert.deepEqual(fs.readFileSync(path.join(dev, fixture)), fs.readFileSync(original('-transcript.json')))
  const expected = {
    [sidecar]: { bytes: 45837, sha256: 'e2e9054e9ad0d7a7e9f3c0020760a2c48a8c477ae44af6b01c2a509e8e4204dc' },
    [test]: { bytes: 4319, sha256: '40aab2a19f34bb82a97cd1e7510ccbc187c8a9218bd03c47e0ab0b133f118e90' },
    [fixture]: { bytes: 403, sha256: '54386e800c3262e5bcfd67ef325ab32a3ec11f7ad8fc59c0f3a075d03169fb97' },
  }
  for (const [f, s] of Object.entries(expected)) assert.deepEqual(declared[f], s)
  const source = read(path.join(devOut, 'source-files.json'))
  const parentSource = read(path.join(parentOut, 'source-files.json'))
  assert.equal(source.baseline, baseline); assert.equal(parentSource.baseline, baseline)
  const rebuilt = { ...parentSource.source, ['packages/dsh-pm-tool/' + sidecar]: declared[sidecar].sha256,
    ['packages/dsh-pm-tool/' + test]: declared[test].sha256,
    ['packages/dsh-pm-tool/' + fixture]: declared[fixture].sha256 }
  assert.equal(Object.keys(parentSource.source).length, 112)
  assert.equal(Object.keys(rebuilt).length, 114); assert.deepEqual(source.source, rebuilt)
  for (const [f, h] of Object.entries(source.source)) assert.equal(mark(path.join(repo, f)).sha256, h, f)
  const r2 = rowsOf(original('-r2-test.result.json'))
  assert.equal(r2.length, 5)
  assert.equal(r2.filter(r => r.status === 'passed').length, 2)
  assert.equal(r2.filter(r => r.status === 'failed').length, 3)
  assert.equal(read(original('-r2-command.json')).status, 1)
  const obs = observationsOf(original('-r2-observations.ndjson'))
  assert.deepEqual(obs.filter(r => r.actual !== r.expected).map(r => r.id).sort(),
    ['P-AUTH', 'P-RATE-PREFIX', 'C-COLON'].sort())
  assert.equal(read(path.join(devOut, 'candidate.json')).affected.length, 17)
  return { declared, current, frozen, oldInputs, expected, substitutions, source, parentInputs,
    originalR2: { result: mark(original('-r2-test.result.json')), command: mark(original('-r2-command.json')),
      test: mark(original('-r2-component.fixture.tsx')), fixture: mark(original('-transcript.json')),
      status: 1, total: 5, passed: 2, failed: 3, skipped: 0 }, oldCompleteCount: Object.keys(oldInputs).length }
}
function beforeProtected() {
  const files = {}
  for (const [f, s] of Object.entries(content(scan(devOut)))) files[path.relative(repo, path.join(devOut, f))] = s
  for (const name of fs.readdirSync(path.join(repo, 'docs/testing')).filter(n => n.startsWith(originalPrefix))) {
    files['docs/testing/' + name] = mark(path.join(repo, 'docs/testing', name))
  }
  for (const name of fs.readdirSync(path.join(repo, 'docs/plans')).filter(n => n.startsWith('copilot-error-prefix-dev-20261022-r1'))) {
    files['docs/plans/' + name] = mark(path.join(repo, 'docs/plans', name))
  }
  for (const name of ['candidate.json', 'source-files.json', 'complete-inputs.json', 'tracked-product.diff',
    'new-product-files.txt', 'package-dependencies.json', 'built-artifacts.json']) {
    const f = path.join(parentOut, name)
    files[path.relative(repo, f)] = mark(f)
  }
  for (const f of Object.keys(read(path.join(devOut, 'source-files.json')).source).filter(f => f.startsWith('launcher/'))) {
    files[f] = mark(path.join(repo, f))
  }
  return files
}
function guard() {
  const before = read(path.join(out, 'before.json'))
  for (const [f, s] of Object.entries(before.protected)) assert.deepEqual(mark(path.join(repo, f)), s, f)
  assert.deepEqual(inputs(old), before.oldInputs)
  assert.deepEqual(inputs(dev), before.developerInputs)
  assert.deepEqual(inputs(main), before.mainInputs)
  assert.deepEqual(lib(main), before.mainLib); assert.deepEqual(lib(old), before.oldLib)
  assert.deepEqual(lib(dev), before.developerLib)
  assert.equal(digest(scan(path.join(dev, 'node_modules'))), before.developerDependencyDigest)
  assert.equal(digest(scan(path.join(old, 'node_modules'))), before.oldDependencyDigest)
  assert.deepEqual(inputs(pkg), before.mainInputs)
  const candidate = read(path.join(out, 'candidate.json'))
  assert.equal(digest(scan(path.join(pkg, 'node_modules'))), candidate.ownDependencyDigest)
  assert.deepEqual(mark(path.join(tmp, 'vitest.config.mjs')), candidate.config)
  assert.equal(fs.existsSync(path.join(pkg, 'lib')), false)
  return before
}
const mode = process.argv[2]
if (mode === 'execute') {
  assert(!fs.existsSync(out), 'Evidence root already exists')
  assert(!fs.existsSync(tmp), 'selftmp already exists')
  fs.mkdirSync(out, { recursive: true })
  console.log('Independent execution supervisor PID=' + process.pid)
  let ok = run('freeze', process.execPath, [self, 'freeze'], repo)
  if (ok) {
    const testsOk = run('test', process.execPath, [self, 'test'], repo)
    const closeOk = run('close', process.execPath, [self, 'close'], repo)
    ok = testsOk && closeOk
  }
  console.log('Independent execution completed; all child processes reaped; status=' + (ok ? 0 : 1))
  process.exitCode = ok ? 0 : 1
} else if (mode === 'freeze') {
  const seal = verifySeal(), audit = sourceAudit()
  const developerDeps = scan(path.join(dev, 'node_modules')), oldDeps = scan(path.join(old, 'node_modules'))
  save('before.json', { at: new Date().toISOString(), pid: process.pid, mainInputs: audit.current,
    developerInputs: audit.frozen, oldInputs: audit.oldInputs, mainLib: lib(main), oldLib: lib(old),
    developerLib: lib(dev), developerDependencyDigest: digest(developerDeps), oldDependencyDigest: digest(oldDeps),
    protected: beforeProtected(), liveDocs: 'ALLOWED_PARALLEL; NOT_LOCKED_OR_POLLUTION_TARGET' })
  save('source-audit.json', { ...audit, developerSeal: mark(path.join(devOut, 'handoff-seal.json')),
    developerReleased: seal.released, assertionsUnchanged: true, fixtureExact403: true, onlyTwoBusinessSubstitutions: true })
  for (const [f, s] of Object.entries(audit.declared)) {
    copy(path.join(dev, f), path.join(pkg, f))
    assert.deepEqual(mark(path.join(pkg, f)), s)
  }
  assert.deepEqual(inputs(pkg), audit.declared)
  for (const name of ['complete-inputs.json', 'source-files.json', 'source-files.sha256',
    'parent-tracked-product.diff', 'parent-new-product-files.txt', 'round-exact.patch']) {
    save(name, fs.readFileSync(path.join(devOut, name)))
  }
  assert(run('sidecar-exact-diff', '/usr/bin/diff', ['-u', path.join(old, sidecar), path.join(pkg, sidecar)], repo, env, 1))
  const from = path.join(dev, 'node_modules'), to = path.join(pkg, 'node_modules')
  for (const [f, s] of Object.entries(developerDeps)) if ('link' in s) assert(s.real.startsWith(from + '/'), f)
  fs.cpSync(from, to, { recursive: true, dereference: false, verbatimSymlinks: true, errorOnExist: true, force: false })
  const rewritten = []
  for (const [f, s] of Object.entries(developerDeps)) if ('link' in s && path.isAbsolute(s.link)) {
    assert(s.link.startsWith(from + '/'), f)
    fs.unlinkSync(path.join(to, f))
    fs.symlinkSync(path.join(to, path.relative(from, s.link)), path.join(to, f))
    rewritten.push(f)
  }
  const ownDeps = scan(to), errors = { bytesOrSha: [], sharedInodes: [], externalLinks: [], linkTarget: [] }
  assert.deepEqual(Object.keys(ownDeps), Object.keys(developerDeps))
  assert.deepEqual(Object.keys(oldDeps), Object.keys(developerDeps))
  for (const [f, s] of Object.entries(developerDeps)) {
    const c = ownDeps[f], o = oldDeps[f]
    if ('link' in s) {
      if (!c.real.startsWith(to + '/')) errors.externalLinks.push(f)
      if (path.relative(from, s.real) !== path.relative(to, c.real)) errors.linkTarget.push(f)
    } else {
      if (s.bytes !== c.bytes || s.sha256 !== c.sha256 || s.bytes !== o.bytes || s.sha256 !== o.sha256) errors.bytesOrSha.push(f)
      if ((s.dev === c.dev && s.ino === c.ino) || (o.dev === c.dev && o.ino === c.ino)) errors.sharedInodes.push(f)
    }
  }
  save('dependency-files.json', { from, to, old: path.join(old, 'node_modules'),
    developer: developerDeps, original112: oldDeps, independent: ownDeps, rewritten, errors })
  for (const value of Object.values(errors)) assert.deepEqual(value, [])
  const files = Object.values(ownDeps).filter(s => !('link' in s)).length
  const links = Object.values(ownDeps).filter(s => 'link' in s).length
  assert.equal(files, 13579); assert.equal(links, 1030)
  for (const name of ['home', 'cache', 'tmp', 'config', 'state']) fs.mkdirSync(path.join(tmp, name))
  const affected = read(path.join(devOut, 'candidate.json')).affected
  const config = { root: pkg, cacheDir: path.join(tmp, 'cache'), esbuild: { jsx: 'automatic' },
    test: { include: [test, ...affected], environment: 'node', pool: 'forks', poolOptions: { forks: { singleFork: true } },
      maxWorkers: 1, minWorkers: 1, fileParallelism: false, testTimeout: 15000, hookTimeout: 15000,
      server: { deps: { inline: ['lucide-react'] } } } }
  fs.writeFileSync(path.join(tmp, 'vitest.config.mjs'), 'export default ' + JSON.stringify(config, null, 2) + ';\n', { flag: 'wx' })
  save('candidate.json', { at: new Date().toISOString(), pid: process.pid, baseline, sourceCount: 114,
    inputCount: 521, version: read(path.join(pkg, 'package.json')).version, role: 'Independent SOURCE/AUTO retest; not developer or GUI',
    tmp, pkg, affected, dependencies: { files, links, errors }, ownDependencyDigest: digest(ownDeps),
    config: mark(path.join(tmp, 'vitest.config.mjs')), completeInputs: mark(path.join(out, 'complete-inputs.json')),
    sourceFiles: mark(path.join(out, 'source-files.json')), build: 'NOT_RUN', runtimeLoaded: false, gui: 'NOT_RUN' })
  guard()
  console.log('FROZEN independent 521 inputs/114 declaration; 13579 files/1030 internal links; errors=0; pid=' + process.pid)
} else if (mode === 'test') {
  guard()
  fs.writeFileSync(env.PREFIX_OBSERVATIONS, '', { flag: 'wx' })
  const affected = read(path.join(out, 'candidate.json')).affected
  const vitest = path.join(pkg, 'node_modules/vitest/vitest.mjs')
  let ok = true
  for (const [name, files] of [['prefix-five', [test]], ['affected', affected]]) {
    const args = [vitest, 'run', ...files, '--config', path.join(tmp, 'vitest.config.mjs'), '--no-cache',
      '--reporter=verbose', '--reporter=json', '--outputFile=' + path.join(out, name + '.result.json')]
    const success = run(name, process.execPath, args, pkg)
    ok = success && ok
  }
  const noemit = run('noemit', process.execPath,
    [path.join(pkg, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json', '--noEmit', '--incremental', 'false'], pkg)
  guard()
  process.exitCode = ok && noemit ? 0 : 1
} else if (mode === 'close') {
  const before = guard(), candidate = read(path.join(out, 'candidate.json'))
  const commands = ['prefix-five', 'affected', 'noemit'].map(name => ({ name, ...read(path.join(out, name + '.command.json')) }))
  for (const c of commands) {
    let alive = true
    try { process.kill(c.pid, 0) } catch (e) { if (e.code === 'ESRCH') alive = false; else throw e }
    assert.equal(alive, false, 'Owned child PID remains alive: ' + c.pid)
  }
  const five = rowsOf(path.join(out, 'prefix-five.result.json'))
  const affected = rowsOf(path.join(out, 'affected.result.json'))
  const obs = observationsOf(path.join(out, 'observations.ndjson'))
  const prior = observationsOf(original('-r2-observations.ndjson'))
  const actualFiles = read(path.join(out, 'affected.result.json')).testResults.map(r => path.relative(pkg, r.name)).sort()
  assert.deepEqual(actualFiles, candidate.affected.toSorted())
  assert.equal(five.length, 5); assert.equal(affected.length, 250); assert.equal(obs.length, 5)
  assert.deepEqual(affected.map(r => r.fullName).sort(), rowsOf(path.join(devOut, 'affected.result.json')).map(r => r.fullName).sort())
  assert.deepEqual(five.map(r => r.fullName).sort(), rowsOf(original('-r2-test.result.json')).map(r => r.fullName).sort())
  const oracle = obs.map(r => {
    const oldObservation = prior.find(o => o.id === r.id)
    assert(oldObservation, r.id)
    for (const field of ['input', 'expected', 'recovered', 'calls', 'writes', 'savedCalls', 'unlocked', 'placeholderRemoved', 'layer']) {
      assert.deepEqual(r[field], oldObservation[field], r.id + ':' + field)
    }
    return { id: r.id, input: r.input, expected: r.expected, actual: r.actual,
      priorActual: oldObservation.actual, fullOracleEqual: r.actual === r.expected,
      recovered: r.recovered, writes: r.writes, savedCalls: r.savedCalls,
      unlocked: r.unlocked, placeholderRemoved: r.placeholderRemoved }
  })
  const total = rows => ({ total: rows.length, passed: rows.filter(r => r.status === 'passed').length,
    failed: rows.filter(r => r.status === 'failed').length, other: rows.filter(r => !['passed', 'failed'].includes(r.status)).length })
  const limitedPass = [...five, ...affected].every(r => r.status === 'passed') &&
    commands.every(c => c.status === 0 && c.signal === null && c.error === null) &&
    oracle.every(r => r.fullOracleEqual && r.writes.length === 0 && r.savedCalls === 0 && r.unlocked && r.placeholderRemoved)
  save('close.json', { at: new Date().toISOString(), pid: process.pid,
    verdict: limitedPass ? 'PASS_LIMITED_SOURCE_AUTO' : 'FAIL_LIMITED_SOURCE_AUTO',
    baseline, sourceCount: 114, completeInputCount: 521, results: { five: total(five), affected: total(affected) },
    commands, oracle, originalR2Preserved: true, originalProtectedFiles: Object.keys(before.protected).length,
    mainOldDeveloperInputsLibDepsUnchanged: true, ownInputsDepsConfigUnchanged: true,
    noNewLibOrFullBundle: true, ownedChildPidsExited: true, released: true, stop: true,
    affectedCases: affected.map(r => ({ name: r.fullName, status: r.status })),
    warnings: { prefixFive: mark(path.join(out, 'prefix-five.stderr.txt')), affected: mark(path.join(out, 'affected.stderr.txt')),
      noemit: mark(path.join(out, 'noemit.stderr.txt')), policy: 'Preserved, not fixed/suppressed/waived; Main owns follow-up' },
    unscanned: 'Business data/keys/services/vendor/global roots not accessed or scanned; no full-disk zero-pollution claim',
    parallelLiveDocs: 'ALLOWED; not locked or classified as pollution',
    noEmitBoundary: 'Original tsconfig excludes tests; not full test TS check',
    notSigned: ['GUI', 'B8', 'RA-AI06', 'cancel/realmodel', 'parentGoal', 'parentCommit'],
    nextOwner: 'Main unique successor builder and GUI; 3263 old112 F2OP/p3 untouched' })
  console.log(JSON.stringify({ verdict: limitedPass ? 'PASS_LIMITED_SOURCE_AUTO' : 'FAIL_LIMITED_SOURCE_AUTO',
    five: total(five), affected: total(affected), protected: Object.keys(before.protected).length,
    released: true, stop: true, ownedChildPidsExited: true }))
  process.exitCode = limitedPass ? 0 : 1
} else if (mode === 'seal') {
  guard()
  const closed = read(path.join(out, 'close.json'))
  assert(run('syntax-check', process.execPath, ['--check', self], repo))
  const toolRoot = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution/432e4d74cb7174275ba576b4cdd2458e'
  const toolReceipt = read(path.join(toolRoot, 'execution.json'))
  assert.equal(toolReceipt.status, 'exited')
  assert.equal(toolReceipt.exitCode, 0)
  assert.equal(toolReceipt.outputComplete, true)
  for (const name of ['execution.json', 'output.log', 'stderr.log']) {
    save('executions/source-auto-tool-' + name, fs.readFileSync(path.join(toolRoot, name)))
  }
  const versions = Object.fromEntries(['vitest', 'react', 'typescript'].map(name =>
    [name, read(path.join(pkg, 'node_modules', name, 'package.json')).version]))
  save('environment.json', { at: new Date().toISOString(), pid: process.pid, node: process.version,
    platform: process.platform, arch: process.arch, versions, env,
    pnpm: '11.28.5 existing copied dependency provenance; pnpm not invoked',
    toolExecutionId: toolReceipt.executionId, toolPid: toolReceipt.pid, supervisorPid: 7182 })
  const priorWarning = path.join(parentOut, 'full-r2.stderr.txt')
  const currentWarning = fs.readFileSync(path.join(out, 'affected.stderr.txt'), 'utf8')
  const priorText = fs.readFileSync(priorWarning, 'utf8')
  save('warnings-origin.json', { current: mark(path.join(out, 'affected.stderr.txt')),
    priorFile: path.relative(repo, priorWarning), prior: mark(priorWarning),
    sameCategories: ['Each child in a list should have a unique "key" prop.', 'MaxListenersExceededWarning']
      .map(text => ({ text, current: currentWarning.includes(text), prior: priorText.includes(text) })),
    policy: 'Original warnings retained; no suppression, product change or waiver' })
  const docs = {}
  for (const name of fs.readdirSync(path.join(repo, 'docs/testing')).filter(n => n.startsWith(ownPrefix))) {
    docs['docs/testing/' + name] = mark(path.join(repo, 'docs/testing', name))
  }
  const executions = ['freeze', 'sidecar-exact-diff', 'test', 'prefix-five', 'affected', 'noemit', 'close', 'syntax-check']
    .map(name => ({ name, ...read(path.join(out, name + '.command.json')) }))
  for (const c of executions) {
    let alive = true
    try { process.kill(c.pid, 0) } catch (e) { if (e.code === 'ESRCH') alive = false; else throw e }
    assert.equal(alive, false, c.name + ' still alive')
  }
  save('execution-receipts.json', { at: new Date().toISOString(), sealPid: process.pid, toolReceipt, executions,
    sealArgv: [process.execPath, self, 'seal'], sealCwd: repo, allRecordedChildrenExited: true })
  const inventory = content(scan(out))
  save('handoff-seal.json', { at: new Date().toISOString(), sealPid: process.pid, verdict: closed.verdict,
    baseline, sourceFiles114: mark(path.join(out, 'source-files.json')), completeInputs521: mark(path.join(out, 'complete-inputs.json')),
    exactPatch: mark(path.join(out, 'round-exact.patch')), ownDocs: docs, evidence: inventory,
    released: true, stop: true, parentGoal: 'CONTINUES', gui: 'NOT_RUN/NOT_SIGNED', ordinaryCommit: 'MAIN_ONLY/NOT_RUN',
    nextOwner: 'Main successor builder/GUI; old112 GUI must not claim new source loaded' })
  console.log('SEALED ' + closed.verdict + '; all recorded children exited; release STOP; Main successor builder/GUI')
} else throw new Error('Use execute | freeze | test | close | seal')

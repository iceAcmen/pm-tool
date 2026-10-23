import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const prefix = 'material-progress-ref-independent-retest-20261022-r1'
const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const own = join(here, `${prefix}-selftmp/r1`)
const dev = join(repo, 'reports/all-pending-evidence-20261021/MaterialRefDevR1')
const source = join(dev, 'repaired/frozen/packages/dsh-pm-tool')
const frozen = join(own, 'frozen/packages/dsh-pm-tool')
const main = join(repo, 'packages/dsh-pm-tool')
const independent = join(here, 'material-progress-ref-crash-20261022-r1-selftmp/r1')
const originalTest = 'material-progress-ref-crash-20261022-r1-cases.test.tsx'
const target = 'src/client/shared/task-draft-materials.tsx'
const newTest = 'src/client/shared/task-draft-materials-refs-dom.test.tsx'
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(join(own, p)))
const devRead = p => JSON.parse(readFileSync(join(dev, p)))

function save(name, value) {
  const path = resolve(own, name)
  assert(path.startsWith(`${own}/`))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
function scan(root) {
  const out = {}
  function walk(path, rel = '') {
    const s = lstatSync(path)
    if (s.isSymbolicLink()) out[rel] = { link: readlinkSync(path), realpath: realpathSync(path), dev: s.dev, ino: s.ino }
    else if (s.isDirectory()) for (const n of readdirSync(path).sort()) walk(join(path, n), rel ? `${rel}/${n}` : n)
    else {
      const b = readFileSync(path)
      out[rel] = { bytes: b.length, sha256: sha(b), dev: s.dev, ino: s.ino }
    }
  }
  walk(root)
  return out
}
const bytes = s => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v.link ? { link: v.link } : { bytes: v.bytes, sha256: v.sha256 }]))
function delta(a, b) {
  return { added: Object.keys(b).filter(k => !(k in a)), removed: Object.keys(a).filter(k => !(k in b)),
    changed: Object.keys(a).filter(k => k in b && JSON.stringify(a[k]) !== JSON.stringify(b[k])) }
}
const clearDelta = d => Object.values(d).every(a => a.length === 0)
const entries = root => readdirSync(root).sort().filter(n => ['src', 'scripts', 'locale'].includes(n) || lstatSync(join(root, n)).isFile())
function inputs(root) {
  const out = {}
  for (const n of entries(root)) for (const [k, v] of Object.entries(bytes(scan(join(root, n))))) out[k ? `${n}/${k}` : n] = v
  return out
}
function copyDeps(from, to, label) {
  const a = scan(from)
  cpSync(from, to, { recursive: true, dereference: false, verbatimSymlinks: true })
  const b = scan(to)
  assert.deepEqual(bytes(a), bytes(b))
  const shared = Object.keys(b).filter(k => !b[k].link && a[k].dev === b[k].dev && a[k].ino === b[k].ino)
  const external = Object.keys(b).filter(k => b[k].link && !b[k].realpath.startsWith(`${to}/`))
  save(`${label}-ownership.json`, { from, to, files: Object.values(b).filter(v => !v.link).length,
    links: Object.values(b).filter(v => v.link).length, sharedInodes: shared, externalLinks: external })
  assert.deepEqual(shared, [])
  assert.deepEqual(external, [])
}
function envFor(name) {
  const root = join(own, 'runs', name)
  const env = {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(root, 'home'),
    TMPDIR: join(root, 'tmp'), TMP: join(root, 'tmp'), TEMP: join(root, 'tmp'),
    XDG_CACHE_HOME: join(root, 'cache'), npm_config_cache: join(root, 'cache/npm'),
    DSH_HOME: join(root, 'dsh-home'), DSH_PM_ISOLATED_ROOT: join(root, 'isolated'),
    DSH_PM_FILE_ROOT: join(root, 'files'), QA_EVIDENCE_ROOT: join(root, 'observations'),
    PM_GOVERNANCE_TMP: join(root, 'tmp/governance'), PM_FILE_ATOMIC_TMP: join(root, 'tmp/atomic'),
    PM_BACKUP_WEB_TMP: join(root, 'tmp/backup'), CI: '1', LANG: 'zh_CN.UTF-8',
    TZ: 'UTC', NODE_ENV: 'development',
  }
  for (const [k, v] of Object.entries(env)) if (k !== 'PATH' && v.startsWith(`${own}/`)) mkdirSync(v, { recursive: true, mode: 0o700 })
  return env
}
function execute(name, args) {
  const env = envFor(name)
  const started = new Date().toISOString()
  const r = spawnSync(process.execPath, args, { cwd: frozen, env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const command = { argv: [process.execPath, ...args], cwd: frozen, env, node: process.version,
    runnerPid: process.pid, pid: r.pid, started, ended: new Date().toISOString(),
    exit: r.status, signal: r.signal, error: r.error?.message }
  save(`runs/${name}/command.json`, command)
  save(`runs/${name}/stdout.txt`, r.stdout ?? '')
  save(`runs/${name}/stderr.txt`, r.stderr ?? '')
  console.log(JSON.stringify({ name, pid: r.pid, exit: r.status, signal: r.signal }))
  console.log(r.stdout ?? '')
  console.error(r.stderr ?? '')
  return r.status ?? 2
}
function vitest(name, include, domAliases) {
  const aliases = ['react/jsx-dev-runtime', 'react/jsx-runtime', 'react-dom/test-utils', 'react-dom/client', 'react-dom', 'react', 'jsdom']
    .sort((a, b) => b.length - a.length).map(find => ({ find, replacement: join(own, 'dom-deps/node_modules',
      find === 'jsdom' ? 'jsdom/lib/api.js' : ['react', 'react-dom'].includes(find) ? `${find}/index.js` : `${find}.js`) }))
  const config = { root: frozen, cacheDir: join(own, 'runs', name, 'cache/vite'), esbuild: { jsx: 'automatic' },
    resolve: { alias: domAliases ? aliases : [] }, test: { environment: 'node', include,
      pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1,
      fileParallelism: false, testTimeout: 15000, hookTimeout: 15000 } }
  save(`runs/${name}/config.mjs`, `export default ${JSON.stringify(config, null, 2)}\n`)
  return execute(name, [join(frozen, 'node_modules/vitest/vitest.mjs'), 'run',
    '--config', join(own, 'runs', name, 'config.mjs'), '--no-cache', '--reporter=default', '--reporter=json',
    `--outputFile=${join(own, 'runs', name, 'result.json')}`])
}
function result(name) {
  const r = read(`runs/${name}/result.json`), c = read(`runs/${name}/command.json`)
  return { tests: r.numTotalTests, passed: r.numPassedTests, failed: r.numFailedTests,
    pending: r.numPendingTests, files: r.testResults.length, exit: c.exit, pid: c.pid,
    assertions: r.testResults.flatMap(f => f.assertionResults.map(a => ({
      name: a.fullName, status: a.status, failures: a.failureMessages }))) }
}
const action = process.argv[2]
if (action === 'prepare') {
  assert(!existsSync(own), '不覆盖本角色原轮')
  assert.equal(devRead('close.json').stop, true)
  assert.equal(devRead('close.json').protectedUnchanged, true)
  const protectedPaths = {
    'developer-STOP': dev, 'original-independent': independent,
    'original-cases': join(here, originalTest), 'original-report': join(here, 'material-progress-ref-crash-20261022-r1-report.md'),
    'dom-source': '/private/tmp/pmtool-f02-dom-deps-20261022',
    'u4-src': '/private/tmp/pmtool-u4-closure-20261022-r2/packages/dsh-pm-tool/src',
    'u4-deps': '/private/tmp/pmtool-u4-closure-20261022-r2/packages/dsh-pm-tool/node_modules',
    'u4-lib': '/private/tmp/pmtool-u4-closure-20261022-r2/packages/dsh-pm-tool/lib',
    'main-lib': join(main, 'lib'), 'vendor': join(repo, 'vendor/agent-skills'),
    'affected-readonly-fixture': '/private/tmp/pmtool-a11-native-files/QA 文件 原件.md',
  }
  save('protected-before.json', Object.fromEntries(Object.entries(protectedPaths).map(([k, path]) => [k, { path, scan: scan(path) }])))
  const mainInputs = inputs(main)
  const candidate = devRead('repaired/candidate.json')
  assert.deepEqual(inputs(source), candidate.inputs)
  for (const n of [target, newTest]) assert.deepEqual(mainInputs[n], candidate.inputs[n])
  mkdirSync(frozen, { recursive: true, mode: 0o700 })
  for (const n of entries(source)) cpSync(join(source, n), join(frozen, n), { recursive: true, verbatimSymlinks: true })
  assert.deepEqual(inputs(frozen), candidate.inputs)
  assert.equal(sha(readFileSync(join(frozen, originalTest))), sha(readFileSync(join(here, originalTest))))
  save('candidate.json', { baselineCommit: candidate.baselineCommit,
    source, inputs: inputs(frozen), inputCount: Object.keys(candidate.inputs).length,
    originalCasesSha256: candidate.originalCasesSha256,
    mainComparison: delta(Object.fromEntries(Object.entries(mainInputs)), Object.fromEntries(Object.entries(candidate.inputs).filter(([k]) => k !== originalTest))),
    build: 'NOT_RUN', GUI: 'NOT_RUN', nonOwnedChanges: '仅记录，不锁Cycle/ATF或其他结果',
    patchSha256: sha(readFileSync(join(dev, 'increment.patch'))) })
  copyDeps(join(source, 'node_modules'), join(frozen, 'node_modules'), 'package-deps')
  mkdirSync(join(own, 'dom-deps'), { recursive: true })
  copyDeps(join(dev, 'dom-deps/node_modules'), join(own, 'dom-deps/node_modules'), 'dom-deps')
  for (const n of ['package.json', 'package-lock.json']) cpSync(join(dev, 'dom-deps', n), join(own, 'dom-deps', n))
  const version = n => JSON.parse(readFileSync(join(own, 'dom-deps/node_modules', n, 'package.json'))).version
  assert.equal(version('react'), '18.3.1')
  assert.equal(version('react-dom'), '18.3.1')
  assert.equal(version('jsdom'), '25.0.1')
  assert.equal(sha(readFileSync(join(own, 'dom-deps/package-lock.json'))), '15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973')
  const historical = ['developer-report.md', 'close.json', 'increment-files.json', 'increment-files.sha256',
    'increment.patch', 'developer-audit.json', 'facility.json', 'sealed-evidence.json', 'red/candidate.json',
    'red/u4-relative.patch', 'red/u4-relative-files.json', 'red/observations',
    'repaired/facility-followup.json', 'provenance']
  for (const phase of ['red/original-seven', 'repaired/original-seven', 'repaired/new-dom',
    'repaired/affected', 'repaired/affected-r2', 'repaired/renderer-instance-probe']) {
    for (const suffix of ['command.json', 'stdout.txt', 'stderr.txt', 'result.json', 'config.mjs']) {
      if (existsSync(join(dev, `${phase}.${suffix}`))) historical.push(`${phase}.${suffix}`)
    }
  }
  for (const n of historical) {
    mkdirSync(dirname(join(own, 'history/developer', n)), { recursive: true })
    cpSync(join(dev, n), join(own, 'history/developer', n), { recursive: true, verbatimSymlinks: true })
    assert.deepEqual(bytes(scan(join(dev, n))), bytes(scan(join(own, 'history/developer', n))))
  }
  for (const n of ['candidate.json', 'facility-react-dom19.json', 'vitest.command.json', 'vitest.result.json', 'vitest.stderr.txt']) {
    cpSync(join(independent, n), join(own, 'history', `independent-${n}`))
  }
  save('facility.json', { react: version('react'), reactDOM: version('react-dom'), jsdom: version('jsdom'),
    historicalFailuresRerun: false, sourceLockSha256: sha(readFileSync(join(own, 'dom-deps/package-lock.json'))),
    affectedReadonlyFixture: protectedPaths['affected-readonly-fixture'],
    readonlyFixtureSha256: sha(readFileSync(protectedPaths['affected-readonly-fixture'])) })
  const vendor = join(repo, 'vendor/agent-skills/mattpocock')
  const manifest = JSON.parse(readFileSync(join(vendor, 'manifest.json')))
  for (const f of [...manifest.skills.flatMap(s => s.files), ...manifest.rootFiles]) {
    const b = readFileSync(join(vendor, f.path))
    assert.equal(sha(b), f.sha256); assert.equal(b.length, f.bytes)
  }
  save('vendor-integrity.json', { vendorIntegrityVerified: true, commit: manifest.source.commit,
    taskKind: 'delivery', selected: 'code-review', reason: '独立source窄审；方法不替代测试',
    skipped: ['setup/installer', 'Git', '通用docs路径', 'build/fullverify', 'GUI/服务/网络'] })
  save('frozen-before.json', scan(frozen))
  console.log(JSON.stringify({ frozenInputs: Object.keys(candidate.inputs).length, originalCasesIdentical: true, historyPreserved: true }))
} else if (action === 'test') {
  const results = {}
  results.facility = execute('instance-probe', ['-e', `
    const assert = require('node:assert/strict');
    const { createRequire } = require('node:module');
    const domRoot = ${JSON.stringify(join(own, 'dom-deps/node_modules'))};
    const domReact = require(domRoot + '/react');
    const domRequire = createRequire(require.resolve(domRoot + '/react-dom'));
    assert.equal(domReact, domRequire('react'));
    assert.equal(require(domRoot + '/react/jsx-runtime'), domRequire('react/jsx-runtime'));
    assert.equal(require(domRoot + '/react-dom/client').createRoot instanceof Function, true);
    const native = require('./node_modules/react');
    const renderer = createRequire(require.resolve('./node_modules/react-test-renderer'));
    assert.equal(native, renderer('react'));
    assert.notEqual(domReact, native);
    console.log(JSON.stringify({domReact:domReact.version,domReactDOM:domRequire('./package.json').version,
      jsdom:require(domRoot+'/jsdom/package.json').version,renderer:renderer('./package.json').version,
      domSameInstance:true,rendererSameInstance:true,groupsIntentionallySeparate:true}));
  `])
  if (results.facility === 0) {
    results.originalSeven = vitest('original-seven', [originalTest], true)
    results.newDOM = vitest('new-dom', [newTest], true)
    const affected = devRead('repaired/results.json').affected
    save('affected-list.json', affected)
    results.affected = vitest('affected', affected, false)
    results.noEmit = execute('noEmit', [join(frozen, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json', '--noEmit', '--incremental', 'false'])
    results.vendorStatic = execute('vendor-static', [join(main, 'scripts/verify-external-skills.mjs')])
  }
  save('results.json', results)
  process.exitCode = Object.values(results).some(v => v !== 0) ? 1 : 0
} else if (action === 'audit') {
  const seven = result('original-seven'), added = result('new-dom'), affected = result('affected')
  assert.deepEqual([seven.tests, seven.passed, seven.failed, seven.pending, seven.exit], [7, 7, 0, 0, 0])
  assert.deepEqual([added.tests, added.passed, added.failed, added.pending, added.exit], [5, 5, 0, 0, 0])
  assert.deepEqual([affected.tests, affected.passed, affected.failed, affected.pending, affected.files, affected.exit], [194, 194, 0, 0, 14, 0])
  const witnesses = {}
  for (const [name, refs] of [['6-N03', ['at-2', 'at-3']], ['7-N04', ['at-3', 'at-2']]]) {
    const r = read(`runs/original-seven/observations/${name}/observations.json`)
    const saved = r.events.find(e => e.label === 'single-main-save')
    assert.equal(r.saveCount, 1); assert.deepEqual(r.caught, [])
    assert.deepEqual(r.calls.map(c => [c.method, c.status]), [['POST', 201]])
    assert(saved)
    const task = saved.tables.tasks[0][1], asset = saved.tables.file_assets[0][1]
    assert.deepEqual(task.progressLog[0].refs, refs)
    assert.deepEqual(task.attachments.map(a => a.id), ['at-1', 'at-2', 'at-3'])
    const b = readFileSync(join(own, 'runs/original-seven/observations', name, 'files', asset.relPath))
    assert.deepEqual(b, readFileSync(join(own, 'runs/original-seven/observations', name, 'raw-stage/qa-note.md')))
    assert.equal(b.toString(), '# QA note\nref file ok\n'); assert.equal(b.length, 22)
    witnesses[name] = { refs, savedTask: task, byteSha256: sha(b), bytes: b.length, calls: r.calls, saveCount: r.saveCount, caught: r.caught }
  }
  for (const name of ['instance-probe', 'noEmit', 'vendor-static']) assert.equal(read(`runs/${name}/command.json`).exit, 0)
  const historical = [['red/original-seven', 7, 3, 4, 1], ['repaired/affected', 194, 190, 4, 1],
    ['repaired/affected-r2', 194, 194, 0, 0]]
  const historicalChecks = historical.map(([name, total, pass, fail, exit]) => {
    const r = read(`history/developer/${name}.result.json`), c = read(`history/developer/${name}.command.json`)
    assert.deepEqual([r.numTotalTests, r.numPassedTests, r.numFailedTests, c.exit], [total, pass, fail, exit])
    return { name, total, pass, fail, exit, rerun: false }
  })
  assert.equal(read('history/independent-facility-react-dom19.json').exit, 1)
  assert.deepEqual(inputs(frozen), read('candidate.json').inputs)
  assert.equal(sha(readFileSync(join(frozen, originalTest))), sha(readFileSync(join(here, originalTest))))
  save('audit.json', { verdict: 'PASS_SOURCE_AUTO_LIMITED', seven, added, affected, witnesses,
    noEmit: read('runs/noEmit/command.json'), originalCasesIdentical: true,
    historicalChecks, historicalDOM19Exit: 1, sourceFrozenUnchanged: true,
    exclusions: ['GUI/parent TaskForm/native chooser/整域/父goal', 'Cycle/ATF重新审签', 'Git/commit/build'] })
  console.log(JSON.stringify({ verdict: 'PASS_SOURCE_AUTO_LIMITED', seven: seven.passed, added: added.passed, affected: affected.passed, witnesses: Object.keys(witnesses) }))
} else if (action === 'close') {
  const before = read('protected-before.json')
  const protection = Object.fromEntries(Object.entries(before).map(([k, v]) => [k, delta(v.scan, scan(v.path))]))
  const frozenProtection = delta(read('frozen-before.json'), scan(frozen))
  const candidate = read('candidate.json')
  const ownership = [target, newTest].map(n => ({ path: n, sha256: sha(readFileSync(join(main, n))),
    matchesTested: sha(readFileSync(join(main, n))) === candidate.inputs[n].sha256 }))
  const unchanged = Object.values(protection).every(clearDelta)
  save('close.json', { protection, protectedUnchanged: unchanged, frozenProtection,
    sourceUnchanged: clearDelta(delta(candidate.inputs, inputs(frozen))), ownership,
    childProcesses: 'spawnSync均已返回，逐命令json保精确PID；未停服务',
    GUI: 'NOT_RUN_BY_AUTHORIZATION', otherResults: 'NOT_LOCKED_NOT_MODIFIED',
    release: true, stop: true, verdict: read('audit.json').verdict })
  assert(unchanged, '保护根差异保原件，不覆盖/回滚')
  assert(clearDelta(frozenProtection), '冻结依赖/源输入出现漂移')
  assert(ownership.every(v => v.matchesTested))
  save('sealed-evidence.json', bytes(scan(own)))
  console.log(JSON.stringify({ protectedUnchanged: unchanged, frozenUnchanged: true, release: true, stop: true }))
} else throw new Error('用法: prepare|test|audit|close；不得重跑覆盖原轮')

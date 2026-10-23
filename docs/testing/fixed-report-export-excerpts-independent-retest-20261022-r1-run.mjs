import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const prefix = 'fixed-report-export-excerpts-independent-retest-20261022-r1'
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const own = path.join(repo, 'reports/all-pending-evidence-20261021/ReportExportRetestR1')
const pkgRel = 'packages/dsh-pm-tool'
const main = path.join(repo, pkgRel)
const frozen = path.join(own, 'frozen', pkgRel)
const parentRoot = path.join(repo, 'reports/all-pending-evidence-20261021/CombinedRepairR1/r2')
const dev = path.join(repo, 'reports/all-pending-evidence-20261021/ReportExportDevR1')
const renderer = `${pkgRel}/src/core/progress-report-markdown.ts`
const originalTest = `${pkgRel}/src/core/report-export-excerpts.test.ts`
const baseline = '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd'
const rendererSha = '6ee3daf16d5572ea74a69b4b42b3a25ab3c1a03693e80ff07f8b258fb69edcac'
const testSha = 'c777b88dc003414f483a0c2f4360b845483d0a662710d9a43f351405027bbe8a'
const sha = b => createHash('sha256').update(b).digest('hex')
const fingerprint = file => {
  const b = fs.readFileSync(file)
  return { bytes: b.length, sha256: sha(b) }
}
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const read = name => json(path.join(own, name))
function save(name, value) {
  const file = path.resolve(own, name)
  assert(file.startsWith(`${own}/`))
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function scan(root) {
  const out = {}
  function walk(file, rel = '') {
    if (!fs.existsSync(file) && !fs.lstatSync(path.dirname(file)).isSymbolicLink()) {
      out[rel] = { absent: true }; return
    }
    const s = fs.lstatSync(file)
    if (s.isSymbolicLink()) out[rel] = { link: fs.readlinkSync(file), realpath: fs.realpathSync(file) }
    else if (s.isDirectory()) for (const n of fs.readdirSync(file).sort()) walk(path.join(file, n), rel ? `${rel}/${n}` : n)
    else out[rel] = { ...fingerprint(file), dev: s.dev, ino: s.ino }
  }
  walk(root)
  return out
}
const byteMap = obj => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k,
  v.link ? { link: v.link } : v.absent ? v : { bytes: v.bytes, sha256: v.sha256 }]))
function delta(a, b) {
  return { added: Object.keys(b).filter(k => !(k in a)), removed: Object.keys(a).filter(k => !(k in b)),
    changed: Object.keys(a).filter(k => k in b && JSON.stringify(a[k]) !== JSON.stringify(b[k])) }
}
const clear = d => Object.values(d).every(v => v.length === 0)
function command(name, executable, args, cwd = repo, env = { PATH: '/usr/bin:/bin', LANG: 'zh_CN.UTF-8' }) {
  const start = new Date().toISOString()
  const r = spawnSync(executable, args, { cwd, env, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024 })
  save(`${name}/command.json`, { executable, args, cwd, env, start, end: new Date().toISOString(),
    exit: r.status, signal: r.signal, error: r.error?.message ?? null, pid: r.pid,
    runnerPid: process.pid, node: process.version })
  save(`${name}/stdout.txt`, r.stdout ?? '')
  save(`${name}/stderr.txt`, r.stderr ?? '')
  console.log(JSON.stringify({ name, exit: r.status, pid: r.pid, error: r.error?.message ?? null }))
  return r
}
function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true, mode: 0o700 })
  fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL)
  assert.deepEqual(fingerprint(from), fingerprint(to))
  const a = fs.statSync(from), b = fs.statSync(to)
  assert(a.dev !== b.dev || a.ino !== b.ino)
}
function ownEnv(name) {
  const root = path.join(own, 'runs', name)
  const env = {
    PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: path.join(root, 'home'),
    TMPDIR: path.join(root, 'tmp'), TMP: path.join(root, 'tmp'), TEMP: path.join(root, 'tmp'),
    XDG_CACHE_HOME: path.join(root, 'cache'), npm_config_cache: path.join(root, 'cache/npm'),
    DSH_HOME: path.join(root, 'dsh-home'), DSH_PM_ISOLATED_ROOT: path.join(root, 'isolated'),
    DSH_PM_FILE_ROOT: path.join(root, 'files'), REPORT_EXPORT_RED_TMP: path.join(root, 'tmp'),
    R1_RAW_TMP: path.join(own, 'runs/raw/tmp'), R1_PROBE_OUTPUT: path.join(root, 'observations'),
    CI: '1', TZ: 'UTC', LANG: 'zh_CN.UTF-8', NODE_ENV: 'test',
  }
  for (const value of Object.values(env)) if (value.startsWith(`${own}/`)) fs.mkdirSync(value, { recursive: true, mode: 0o700 })
  return env
}
function vitest(name, include, legacyEnvironment = false) {
  const result = path.join(own, 'runs', name, 'result.json')
  const config = {
    root: frozen, cacheDir: path.join(own, 'runs', name, 'cache/vite'),
    test: { environment: 'node', include, pool: 'forks', poolOptions: { forks: { singleFork: true } },
      fileParallelism: false, minWorkers: 1, maxWorkers: 1, testTimeout: 15000, hookTimeout: 15000,
      coverage: { enabled: false }, reporters: ['verbose', 'json'], outputFile: { json: result } },
  }
  save(`runs/${name}/config.mjs`, `export default ${JSON.stringify(config, null, 2)}\n`)
  const env = ownEnv(name)
  if (legacyEnvironment) delete env.DSH_PM_ISOLATED_ROOT
  return command(`runs/${name}`, process.execPath, [
    path.join(frozen, 'node_modules/vitest/vitest.mjs'), 'run', '--config', path.join(own, 'runs', name, 'config.mjs'),
  ], frozen, env).status
}
function result(name) {
  const r = read(`runs/${name}/result.json`), c = read(`runs/${name}/command.json`)
  const cases = r.testResults.flatMap(f => f.assertionResults ?? [])
  return { total: cases.length, passed: cases.filter(c => c.status === 'passed').length,
    failed: cases.filter(c => c.status === 'failed').length,
    skipped: cases.filter(c => !['passed', 'failed'].includes(c.status)).length,
    files: r.testResults.length, exit: c.exit,
    cases: cases.map(({ fullName, status, failureMessages }) => ({ fullName, status, failureMessages })) }
}
function protectedSnapshot(paths) {
  return Object.fromEntries(Object.entries(paths).map(([name, file]) => [name, { path: file, files: byteMap(scan(file)) }]))
}
function mainBindings(candidate) {
  return Object.fromEntries(Object.keys(candidate.frozenFiles).map(file => [file, fingerprint(path.join(repo, file))]))
}
const action = process.argv[2]
if (action === 'prepare') {
  assert(!fs.existsSync(own), '不得覆盖原轮或他人产物')
  fs.mkdirSync(own, { recursive: true, mode: 0o700 })
  const head = command('prepare/head', 'git', ['rev-parse', 'HEAD'])
  assert.equal(head.status, 0); assert.equal(head.stdout.trim(), baseline)
  const p = json(path.join(parentRoot, 'candidate.json'))
  const declarations = json(path.join(parentRoot, 'source-files.json'))
  const inputs = json(path.join(parentRoot, 'complete-inputs.json'))
  assert.equal(p.baseline, baseline); assert.equal(declarations.count, 107); assert.equal(Object.keys(inputs).length, 515)
  assert.equal(fingerprint(path.join(repo, renderer)).sha256, rendererSha)
  assert.equal(fingerprint(path.join(repo, originalTest)).sha256, testSha)
  const parentDifferences = []
  for (const [file, expected] of Object.entries(inputs)) {
    const relative = `${pkgRel}/${file}`, actual = fingerprint(path.join(repo, relative))
    if (actual.sha256 !== expected.sha256) parentDifferences.push({ file: relative, before: expected, after: actual })
  }
  assert.deepEqual(parentDifferences.map(d => d.file), [renderer])
  for (const [file, expected] of Object.entries(declarations.source)) assert.equal(fingerprint(path.join(repo, file)).sha256, expected)
  assert(!(renderer in declarations.source))
  const inherited108 = { ...declarations.source, [originalTest]: testSha }
  const successor109 = { ...inherited108, [renderer]: rendererSha }
  const frozenFiles = Object.fromEntries(Object.keys(inputs).map(file => [`${pkgRel}/${file}`, fingerprint(path.join(main, file))]))
  for (const file of Object.keys(successor109)) frozenFiles[file] = fingerprint(path.join(repo, file))
  const packageInputs = Object.fromEntries(Object.entries(frozenFiles).filter(([f]) => f.startsWith(`${pkgRel}/`))
    .map(([f, value]) => [f.slice(pkgRel.length + 1), value]))
  assert.equal(Object.keys(packageInputs).length, 516)
  const paths = {
    'main-lib': path.join(main, 'lib'), 'original-red-root': path.join(repo, 'reports/all-pending-evidence-20261021/ReportExportRedR1'),
    'developer-root': dev,
  }
  for (const n of ['plan.md', 'report.md', 'config.mjs', 'run.mjs', 'close.mjs']) {
    paths[`red-${n}`] = path.join(repo, `docs/testing/fixed-report-export-excerpt-red-20261022-r1-${n}`)
  }
  paths['original-GUIFAIL'] = path.join(repo, 'docs/testing/material-meeting-report-gui-review-20261022-r1.md')
  for (const name of ['candidate.json', 'source-files.json', 'complete-inputs.json']) paths[`parent-${name}`] = path.join(parentRoot, name)
  save('protected-before.json', protectedSnapshot(paths))
  for (const file of Object.keys(frozenFiles)) copyFile(path.join(repo, file), path.join(own, 'frozen', file))
  for (const [name, args] of [
    ['tracked-product-diff', ['diff', '--', 'packages/dsh-pm-tool', 'launcher']],
    ['new-product-files', ['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool/src', 'packages/dsh-pm-tool/scripts', 'launcher']],
    ['index-diff', ['diff', '--cached', '--']],
    ['renderer-diff', ['diff', '--', renderer]],
  ]) assert.equal(command(`prepare/${name}`, 'git', args).status, 0)
  const currentDiff = fs.readFileSync(path.join(own, 'prepare/renderer-diff/stdout.txt'))
  const archivedDiff = fs.readFileSync(path.join(dev, 'raw-WGSqdt/renderer.diff'))
  assert.deepEqual(currentDiff, archivedDiff)
  copyFile(path.join(dev, 'raw-WGSqdt/renderer.diff'), path.join(own, 'renderer.diff'))
  copyFile(path.join(dev, 'input/renderer-before.ts.txt'), path.join(frozen, 'src/core/retest-legacy-renderer.ts'))
  const candidate = {
    baseline, parentCandidate: p, inherited108, successor109, frozenFiles, packageInputs,
    inheritedCount: Object.keys(inherited108).length, successorCount: Object.keys(successor109).length,
    packageInputCount: Object.keys(packageInputs).length, parentDifferences, renderer: fingerprint(path.join(repo, renderer)),
    originalTest: fingerprint(path.join(repo, originalTest)), patch: fingerprint(path.join(own, 'renderer.diff')),
    sourceMode: 'self-owned frozen TypeScript; no shared lib/runtime',
    builder: 'Main only for successor product build', runtime: 'NOT_RUN', loadedIn3260: false,
    otherNewFiles: fs.readFileSync(path.join(own, 'prepare/new-product-files/stdout.txt'), 'utf8')
      .trim().split('\n').filter(f => f && !(f in successor109)),
  }
  save('candidate.json', candidate)
  const depFrom = path.join(p.pkg, 'node_modules'), depTo = path.join(frozen, 'node_modules')
  const depsBefore = scan(depFrom)
  save('dependency-source-before.json', { path: depFrom, files: depsBefore })
  fs.cpSync(depFrom, depTo, { recursive: true, dereference: false, verbatimSymlinks: true })
  const depsAfter = scan(depTo)
  assert.deepEqual(byteMap(depsBefore), byteMap(depsAfter))
  const sharedInodes = Object.keys(depsAfter).filter(k => !depsAfter[k].link &&
    depsAfter[k].dev === depsBefore[k].dev && depsAfter[k].ino === depsBefore[k].ino)
  const externalLinks = Object.keys(depsAfter).filter(k => depsAfter[k].link && !depsAfter[k].realpath.startsWith(`${depTo}/`))
  save('dependency-ownership.json', { from: depFrom, to: depTo, sharedInodes, externalLinks,
    files: Object.values(depsAfter).filter(v => !v.link).length, links: Object.values(depsAfter).filter(v => v.link).length })
  assert.deepEqual(sharedInodes, []); assert.deepEqual(externalLinks, [])
  save('frozen-before.json', byteMap(scan(path.join(own, 'frozen'))))
  save('main-bindings-before.json', mainBindings(candidate))
  save('prepare-summary.json', { differences: parentDifferences, inherited108: 108, successor109: 109,
    completePackageInputs: 516, dependenciesCopied: true, originalOracleUnchanged: true })
  console.log(JSON.stringify({ action, inherited108: 108, successor109: 109, completePackageInputs: 516, dependenciesCopied: true }))
} else if (action === 'test') {
  assert.equal(fingerprint(path.join(own, 'frozen', originalTest)).sha256, testSha)
  const results = {}
  results.raw = vitest('raw', ['src/core/report-export-excerpts.test.ts'])
  results.affected = vitest('affected', [
    'src/core/progress-report-markdown-u5.test.ts', 'src/core/progress-report.test.ts',
    'src/core/export-isolation.test.ts', 'src/core/export-outbound.test.ts', 'src/client/shared/markdown.test.ts',
  ])
  copyFile(path.join(repo, `docs/testing/${prefix}-probes.test.ts`), path.join(frozen, 'retest-probes.test.ts'))
  results.probes = vitest('probes', ['retest-probes.test.ts'])
  results.noEmit = command('runs/noEmit', process.execPath, [
    path.join(frozen, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json', '--noEmit', '--incremental', 'false',
  ], frozen, ownEnv('noEmit')).status
  save('execution-results.json', results)
  console.log(JSON.stringify(results))
  process.exitCode = Object.values(results).every(n => n === 0) ? 0 : 1
} else if (action === 'test-r2') {
  save('runner-r2.mjs', fs.readFileSync(fileURLToPath(import.meta.url), 'utf8'))
  const results = {}
  results.affected = vitest('affected-r2', [
    'src/core/progress-report-markdown-u5.test.ts', 'src/core/progress-report.test.ts',
    'src/core/export-isolation.test.ts', 'src/core/export-outbound.test.ts', 'src/client/shared/markdown.test.ts',
  ], true)
  copyFile(path.join(repo, `docs/testing/${prefix}-probes.test.ts`), path.join(frozen, 'retest-probes-r2.test.ts'))
  results.probes = vitest('probes-r2', ['retest-probes-r2.test.ts'])
  copyFile(path.join(repo, `docs/testing/${prefix}-stress.test.ts`), path.join(frozen, 'retest-stress.test.ts'))
  results.stress = vitest('stress', ['retest-stress.test.ts'])
  save('execution-results-r2.json', results)
  console.log(JSON.stringify(results))
  process.exitCode = Object.values(results).every(n => n === 0) ? 0 : 1
} else if (action === 'audit' || action === 'audit-r2') {
  save(`runner-${action}.mjs`, fs.readFileSync(fileURLToPath(import.meta.url), 'utf8'))
  const raw = result('raw'), affected = result('affected-r2'), probes = result('probes-r2'), stress = result('stress')
  assert.deepEqual([raw.total, raw.passed, raw.failed, raw.skipped, raw.exit], [13, 13, 0, 0, 0])
  assert.deepEqual([affected.total, affected.passed, affected.failed, affected.skipped, affected.files, affected.exit], [54, 54, 0, 0, 5, 0])
  assert.deepEqual([probes.total, probes.passed, probes.failed, probes.skipped, probes.exit], [6, 6, 0, 0, 0])
  assert.equal(read('runs/noEmit/command.json').exit, 0)
  assert.deepEqual([stress.total, stress.passed, stress.failed, stress.skipped, stress.exit], [1, 0, 1, 0, 1])
  const stressWitness = read('runs/stress/observations/author-stress.json')
  assert.equal(stressWitness.frozenSchemaAccepted, true)
  assert.equal(stressWitness.backtickRuns, 150000)
  assert.equal(stressWitness.caught.name, 'RangeError')
  assert.equal(stressWitness.caught.message, 'Maximum call stack size exceeded')
  assert(stressWitness.caught.stack.includes('progress-report-markdown.ts:85'))
  const facilityAffected = result('affected'), facilityProbes = result('probes')
  assert.deepEqual([facilityAffected.passed, facilityAffected.failed, facilityAffected.exit], [53, 1, 1])
  assert.deepEqual([facilityProbes.passed, facilityProbes.failed, facilityProbes.exit], [5, 1, 1])
  const controls = raw.cases.filter(c => c.fullName.includes('CONTROL'))
  const originalReds = raw.cases.filter(c => c.fullName.includes(' RED'))
  assert.equal(controls.length, 7); assert.equal(originalReds.length, 6)
  const witnesses = []
  const fields = ['taskId', 'entryId', 'revisionId', 'author', 'date', 'contentSnapshot']
  const tmp = path.join(own, 'runs/raw/tmp')
  for (const dir of fs.readdirSync(tmp)) {
    const root = path.join(tmp, dir)
    const before = path.join(root, 'exports/before-source-change/rpt-0002-progress.md')
    if (!fs.existsSync(before)) continue
    const after = path.join(root, 'exports/excerpts/rpt-0002-progress.md')
    const old = json(path.join(root, 'frozen-before.json'))
    const changed = json(path.join(root, 'source-after.json'))
    const rawReport = fs.readFileSync(path.join(root, 'data/pmtool/reports/rpt-0002.json'), 'utf8')
    const md = fs.readFileSync(after, 'utf8')
    assert.equal(md, fs.readFileSync(before, 'utf8')); assert.equal(rawReport, old.raw)
    assert.deepEqual(changed.fixed, old.fixed)
    for (const excerpt of old.fixed.excerpts) {
      for (const field of fields) assert(md.includes(excerpt[field]))
      assert.equal(md.split(excerpt.contentSnapshot).length - 1, 1)
      const source = changed.changed.progressLog.find(e => e.id === excerpt.entryId)
      assert(source.deletedAt); assert.notEqual(source.revisions.at(-1).content, excerpt.contentSnapshot)
    }
    for (const forbidden of ['源已改正文', '源已改作者', 'OTHER_TASK_BODY', '未选E2正文']) assert(!md.includes(forbidden))
    const commands = fs.readFileSync(path.join(root, 'commands.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l))
    assert.equal(commands.filter(c => c.input.startsWith('export')).length, 2)
    assert(commands.every(c => c.response.kind === 'success'))
    witnesses.push({ root: path.relative(own, root), sourceType: old.fixed.sourceType,
      beforeMD: fingerprint(before), afterMD: fingerprint(after), report: fingerprint(path.join(root, 'data/pmtool/reports/rpt-0002.json')),
      frozenExcerpts: old.fixed.excerpts, sourceAfter: changed.changed, commands,
      unchangedReportBytes: true, sixFieldsComplete: true, currentSourceExcluded: true })
  }
  assert.equal(witnesses.length, 2)
  const historical = ['run-cd8PO9', 'run-cKdR56', 'run-rtV1dy'].map(name => {
    const s = json(path.join(repo, 'reports/all-pending-evidence-20261021/ReportExportRedR1', name, 'summary.json'))
    return { name, passed: s.passed, failed: s.failed, exit: s.vitestExit, rerun: false }
  })
  assert.deepEqual(historical.map(s => [s.passed, s.failed, s.exit]), [[0, 13, 1], [7, 6, 1], [7, 6, 1]])
  const patch = fs.readFileSync(path.join(own, 'renderer.diff'), 'utf8')
  const patchLines = patch.split('\n')
  const patchStats = {
    added: patchLines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length,
    removed: patchLines.filter(l => l.startsWith('-') && !l.startsWith('---')).length,
  }
  assert.deepEqual(patchStats, { added: 15, removed: 1 })
  save('audit.json', { verdict: 'FAIL_SOURCE_AUTO_LIMITED', raw, affected, probes, stress,
    facilityAffected, facilityProbes, stressWitness, witnesses, historical, patchStats,
    limitedPass: 'original 13 (7 controls + 6 former reds), affected54, compatibility/fence6, noEmit',
    finding: { id: 'RER1-SOURCE-01', severity: 'P2', file: renderer, line: 85,
      acceptedAuthorLength: stressWitness.authorLength, backtickRuns: 150000,
      effect: 'valid frozen report render throws RangeError instead of returning MD',
      minimalDeveloperScope: 'single renderer; iterative max instead of spreading match array; no schema restriction required',
      commandHugeAuthor: 'NOT_RUN; pure real renderer and real frozen schema accepted input, complete stress input preserved' },
    mainSuccessorBuildAdmission: 'NOT_GRANTED_BY_THIS_GATE; fix confirmed source red first',
    noEmit: read('runs/noEmit/command.json'), originalControls: 7, originalRedsNowPassed: 6,
    exclusions: ['GUI/外部阅读器目视/整旅程/父goal/整包回归/build/commit/服务'], release: 'STOP' })
  console.log(JSON.stringify({ verdict: 'FAIL_SOURCE_AUTO_LIMITED', raw: 13, affected: 54, probes: 6,
    stressFailed: 1, noEmit: 0, witnessTypes: witnesses.map(w => w.sourceType), release: 'STOP' }))
} else if (action === 'close') {
  const candidate = read('candidate.json')
  const mainDrift = delta(read('main-bindings-before.json'), mainBindings(candidate))
  const protection = Object.fromEntries(Object.entries(read('protected-before.json')).map(([name, v]) =>
    [name, delta(v.files, byteMap(scan(v.path)))]))
  const deps = read('dependency-source-before.json')
  const dependencySourceDrift = delta(byteMap(deps.files), byteMap(scan(deps.path)))
  const before = read('frozen-before.json'), after = byteMap(scan(path.join(own, 'frozen')))
  const frozenDrift = delta(before, after)
  assert.deepEqual(frozenDrift, { added: [
    `${pkgRel}/retest-probes-r2.test.ts`, `${pkgRel}/retest-probes.test.ts`, `${pkgRel}/retest-stress.test.ts`,
  ], removed: [], changed: [] })
  assert.equal(after[`${pkgRel}/retest-probes-r2.test.ts`].sha256,
    fingerprint(path.join(repo, `docs/testing/${prefix}-probes.test.ts`)).sha256)
  assert.equal(after[`${pkgRel}/retest-stress.test.ts`].sha256,
    fingerprint(path.join(repo, `docs/testing/${prefix}-stress.test.ts`)).sha256)
  const currentNew = command('close/new-product-files', 'git', ['ls-files', '--others', '--exclude-standard', '--',
    'packages/dsh-pm-tool/src', 'packages/dsh-pm-tool/scripts', 'launcher'])
  const index = command('close/index-diff', 'git', ['diff', '--cached', '--'])
  const head = command('close/head', 'git', ['rev-parse', 'HEAD'])
  assert.equal(currentNew.status, 0); assert.equal(index.status, 0)
  assert.equal(head.status, 0); assert.equal(head.stdout.trim(), baseline)
  assert.equal(index.stdout, fs.readFileSync(path.join(own, 'prepare/index-diff/stdout.txt'), 'utf8'))
  const unclaimedNow = currentNew.stdout.trim().split('\n').filter(f => f && !(f in candidate.successor109))
  save('close.json', { mainDrift, protection, dependencySourceDrift, frozenDrift,
    allowedFrozenSupplement: 'archived old renderer + owned probes, not successor business input',
    unclaimedNewFilesNow: unclaimedNow,
    newOutsideCandidate: unclaimedNow.filter(f => !candidate.otherNewFiles.includes(f)),
    otherOwnersNotLocked: true, running3260Still107: 'per parent binding; not queried by this role',
    noSharedLibWrite: true, noServiceOrGitWrite: true,
    childProcesses: 'all synchronous child commands returned; exact PID/exit in command.json',
    sourceAutoVerdict: read('audit.json').verdict,
    mainSuccessorBuildAdmission: 'NOT_GRANTED_BY_THIS_GATE; RER1-SOURCE-01 needs developer fix and independent retest',
    GUI: 'NOT_RUN_BY_AUTHORIZATION; original FAIL remains pending successor evidence',
    release: true, stop: true })
  assert(clear(mainDrift)); assert(Object.values(protection).every(clear)); assert(clear(dependencySourceDrift))
  save('artifact-index.json', { at: new Date().toISOString(), files: byteMap(scan(own)), excludesSelf: true })
  console.log(JSON.stringify({ mainDrift, protectionClear: true, dependencySourceDrift,
    frozenUnchangedExceptOwnedProbe: true, inherited108: 108, successor109: 109, release: true, stop: true }))
} else if (action === 'seal') {
  const index = read('artifact-index.json')
  for (const [name, expected] of Object.entries(index.files)) {
    const file = path.join(own, name)
    if (expected.link) assert.equal(fs.readlinkSync(file), expected.link)
    else assert.deepEqual(fingerprint(file), expected)
  }
  const files = {}
  for (const entry of fs.readdirSync(path.join(repo, 'docs/testing'))) {
    if (!entry.startsWith(prefix)) continue
    const file = path.join(repo, 'docs/testing', entry)
    if (fs.statSync(file).isFile()) files[`docs/testing/${entry}`] = fingerprint(file)
  }
  save('documentation-index.json', { at: new Date().toISOString(), files, artifactIndex: fingerprint(path.join(own, 'artifact-index.json')) })
  assert.equal(read('close.json').stop, true)
  save('seal.json', { archivedFilesVerified: Object.keys(index.files).length, documentationCount: Object.keys(files).length,
    verdict: read('audit.json').verdict, release: true, stop: true, noExtraProductRun: true })
  console.log(JSON.stringify({ archivedFilesVerified: Object.keys(index.files).length, documentationCount: Object.keys(files).length,
    verdict: read('audit.json').verdict, release: true, stop: true }))
} else throw new Error('用法: prepare|test|test-r2|audit|audit-r2|close|seal；禁止覆盖原轮')

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const prefix = 'fixed-report-export-fence-independent-retest-20261022-r2'
const priorPrefix = 'fixed-report-export-excerpts-independent-retest-20261022-r1'
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const evidence = path.join(repo, 'reports/all-pending-evidence-20261021')
const own = path.join(evidence, 'ReportExportFenceRetestR2')
const dev = path.join(evidence, 'ReportExportFenceDevR2')
const r1 = path.join(evidence, 'ReportExportRetestR1')
const parent = path.join(evidence, 'CombinedRepairR1/r2')
const pkg = 'packages/dsh-pm-tool'
const tree = path.join(own, 'frozen')
const frozen = path.join(tree, pkg)
const renderer = `${pkg}/src/core/progress-report-markdown.ts`
const oracle = `${pkg}/src/core/report-export-excerpts.test.ts`
const baseline = '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd'
const r1Sha = '6ee3daf16d5572ea74a69b4b42b3a25ab3c1a03693e80ff07f8b258fb69edcac'
const r2Sha = '94290aaf54764628161e84f11d1bd495f7cb965c4178ea155d52b2d28ac99fbf'
const testSha = 'c777b88dc003414f483a0c2f4360b845483d0a662710d9a43f351405027bbe8a'
const hash = b => createHash('sha256').update(b).digest('hex')
const fingerprint = file => {
  const b = fs.readFileSync(file)
  return { bytes: b.length, sha256: hash(b) }
}
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const read = name => json(path.join(own, name))
function save(name, value) {
  const file = path.resolve(own, name)
  assert(file.startsWith(`${own}/`))
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
  fs.writeFileSync(file, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
function scan(root) {
  const files = {}
  function visit(file, relative = '') {
    const s = fs.lstatSync(file)
    if (s.isSymbolicLink()) files[relative] = { link: fs.readlinkSync(file), realpath: fs.realpathSync(file) }
    else if (s.isDirectory()) {
      for (const name of fs.readdirSync(file).sort()) visit(path.join(file, name), relative ? `${relative}/${name}` : name)
    } else files[relative] = { ...fingerprint(file), dev: s.dev, ino: s.ino }
  }
  if (fs.existsSync(root)) visit(root)
  else files[''] = { absent: true }
  return files
}
const bytesOnly = files => Object.fromEntries(Object.entries(files).map(([k, v]) =>
  [k, v.link ? { link: v.link } : v.absent ? v : { bytes: v.bytes, sha256: v.sha256 }]))
const delta = (a, b) => ({
  added: Object.keys(b).filter(k => !(k in a)),
  removed: Object.keys(a).filter(k => !(k in b)),
  changed: Object.keys(a).filter(k => k in b && JSON.stringify(a[k]) !== JSON.stringify(b[k])),
})
const clear = d => Object.values(d).every(v => v.length === 0)
function command(name, exe, args, cwd = repo, env = { PATH: '/usr/bin:/bin', LANG: 'zh_CN.UTF-8' }) {
  const start = new Date().toISOString()
  const r = spawnSync(exe, args, { cwd, env, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024 })
  save(`${name}/command.json`, { executable: exe, args, cwd, env, start, end: new Date().toISOString(),
    exit: r.status, signal: r.signal, error: r.error?.message ?? null, pid: r.pid,
    runnerPid: process.pid, node: process.version })
  save(`${name}/stdout.txt`, r.stdout ?? '')
  save(`${name}/stderr.txt`, r.stderr ?? '')
  console.log(JSON.stringify({ name, exit: r.status, pid: r.pid, error: r.error?.message ?? null }))
  return r
}
function copy(from, to) {
  assert(to.startsWith(`${own}/`))
  fs.mkdirSync(path.dirname(to), { recursive: true, mode: 0o700 })
  fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL)
  assert.deepEqual(fingerprint(from), fingerprint(to))
  const a = fs.statSync(from), b = fs.statSync(to)
  assert(a.dev !== b.dev || a.ino !== b.ino)
}
function envFor(name) {
  const root = path.join(own, 'runs', name)
  const env = {
    PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: path.join(root, 'home'),
    TMPDIR: path.join(root, 'tmp'), TMP: path.join(root, 'tmp'), TEMP: path.join(root, 'tmp'),
    XDG_CACHE_HOME: path.join(root, 'cache'), npm_config_cache: path.join(root, 'cache/npm'),
    DSH_HOME: path.join(root, 'dsh-home'), DSH_PM_FILE_ROOT: path.join(root, 'files'),
    REPORT_EXPORT_RED_TMP: path.join(root, 'tmp'), R1_RAW_TMP: path.join(own, 'runs/raw/tmp'),
    R1_PROBE_OUTPUT: path.join(root, 'observations'), CI: '1', TZ: 'UTC', LANG: 'zh_CN.UTF-8', NODE_ENV: 'test',
  }
  for (const value of Object.values(env)) {
    if (value.startsWith(`${own}/`)) fs.mkdirSync(value, { recursive: true, mode: 0o700 })
  }
  return env
}
function vitest(name, include) {
  const config = {
    root: frozen, cacheDir: path.join(own, 'runs', name, 'cache/vite'),
    test: { environment: 'node', include, pool: 'forks', poolOptions: { forks: { singleFork: true } },
      fileParallelism: false, minWorkers: 1, maxWorkers: 1, testTimeout: 15000, hookTimeout: 15000,
      coverage: { enabled: false }, reporters: ['verbose', 'json'],
      outputFile: { json: path.join(own, 'runs', name, 'result.json') } },
  }
  save(`runs/${name}/config.mjs`, `export default ${JSON.stringify(config, null, 2)}\n`)
  return command(`runs/${name}`, process.execPath, [
    path.join(frozen, 'node_modules/vitest/vitest.mjs'), 'run', '--config', path.join(own, 'runs', name, 'config.mjs'),
  ], frozen, envFor(name)).status
}
function result(name) {
  const r = read(`runs/${name}/result.json`)
  const cases = r.testResults.flatMap(f => f.assertionResults ?? [])
  return { total: cases.length, passed: cases.filter(c => c.status === 'passed').length,
    failed: cases.filter(c => c.status === 'failed').length,
    skipped: cases.filter(c => !['passed', 'failed'].includes(c.status)).length,
    files: r.testResults.length, exit: read(`runs/${name}/command.json`).exit,
    cases: cases.map(({ fullName, status, failureMessages }) => ({ fullName, status, failureMessages })) }
}
const mainBindings = files => Object.fromEntries(Object.keys(files).map(f => [f, fingerprint(path.join(repo, f))]))
const snapshot = roots => Object.fromEntries(Object.entries(roots).map(([name, root]) =>
  [name, { path: root, files: bytesOnly(scan(root)) }]))
const action = process.argv[2]
if (action === 'prepare') {
  assert(!fs.existsSync(own), '本轮独占创建，禁止覆盖证据')
  fs.mkdirSync(own, { recursive: true, mode: 0o700 })
  const head = command('prepare/head', 'git', ['rev-parse', 'HEAD'])
  assert.equal(head.status, 0); assert.equal(head.stdout.trim(), baseline)
  const c = json(path.join(dev, 'candidate-r2-complete.json'))
  const old = json(path.join(r1, 'candidate.json'))
  const p = json(path.join(parent, 'source-files.json'))
  const parentInputs = json(path.join(parent, 'complete-inputs.json'))
  assert.equal(c.baseline, baseline)
  assert.equal(p.count, 107); assert.equal(Object.keys(parentInputs).length, 515)
  assert.deepEqual(c.parent107, p.source)
  assert.deepEqual(c.originalR1Full109, old.successor109)
  assert.equal(Object.keys(c.successor109).length, 109)
  assert.deepEqual(c.successor109, { ...old.successor109, [renderer]: r2Sha })
  assert.equal(Object.keys(c.frozenFiles).length, 531)
  assert.equal(Object.keys(c.packageInputs).length, 516)
  assert.deepEqual(delta(old.frozenFiles, c.frozenFiles), { added: [], removed: [], changed: [renderer] })
  assert.deepEqual(fingerprint(path.join(repo, renderer)), { bytes: 4510, sha256: r2Sha })
  assert.deepEqual(fingerprint(path.join(r1, 'frozen', renderer)), { bytes: 4428, sha256: r1Sha })
  assert.equal(fingerprint(path.join(repo, oracle)).sha256, testSha)
  const protection = {
    'main-old-lib': path.join(repo, pkg, 'lib'),
    'original-red': path.join(evidence, 'ReportExportRedR1'),
    'developer-r1': path.join(evidence, 'ReportExportDevR1'),
    'independent-r1': r1, 'developer-r2': dev,
    'original-GUI-FAIL': path.join(repo, 'docs/testing/material-meeting-report-gui-review-20261022-r1.md'),
    'closure-plan': path.join(repo, 'docs/plans/2026-10-22-fixed-report-export-excerpts-closure.md'),
  }
  for (const file of fs.readdirSync(path.join(repo, 'docs/testing'))) {
    if (file.startsWith('fixed-report-export-excerpt-red-20261022-r1') || file.startsWith(priorPrefix)) {
      protection[`testing-${file}`] = path.join(repo, 'docs/testing', file)
    }
  }
  for (const name of ['candidate.json', 'source-files.json', 'complete-inputs.json']) {
    protection[`parent-${name}`] = path.join(parent, name)
  }
  save('protected-before.json', snapshot(protection))
  const ownFiles = {}
  for (const [file, expected] of Object.entries(c.frozenFiles)) {
    const from = path.join(dev, 'frozen', file)
    assert.deepEqual(fingerprint(from), expected)
    copy(from, path.join(tree, file))
    ownFiles[file] = fingerprint(path.join(tree, file))
    if (file in c.successor109) assert.equal(ownFiles[file].sha256, c.successor109[file])
  }
  const packageInputs = Object.fromEntries(Object.entries(ownFiles)
    .filter(([f]) => f.startsWith(`${pkg}/`)).map(([f, v]) => [f.slice(pkg.length + 1), v]))
  assert.deepEqual(packageInputs, c.packageInputs)
  assert.equal(Object.keys(ownFiles).filter(f => f.startsWith('launcher/')).length, 15)
  copy(path.join(r1, 'frozen', renderer), path.join(own, 'input/renderer-r1.ts.txt'))
  copy(path.join(r1, 'frozen', pkg, 'src/core/retest-legacy-renderer.ts'),
    path.join(frozen, 'src/core/retest-legacy-renderer.ts'))
  copy(path.join(repo, `docs/testing/${priorPrefix}-probes.test.ts`), path.join(frozen, 'retest-probes.test.ts'))
  copy(path.join(repo, `docs/testing/${priorPrefix}-stress.test.ts`), path.join(frozen, 'retest-stress.test.ts'))
  const patch = command('prepare/independent-patch', 'git', [
    'diff', '--no-index', '--', path.join(own, 'input/renderer-r1.ts.txt'), path.join(tree, renderer),
  ])
  assert.equal(patch.status, 1)
  const devPatch = fs.readFileSync(path.join(dev, 'renderer-r1-to-r2.diff'), 'utf8')
  assert.equal(patch.stdout.slice(patch.stdout.indexOf('@@')), devPatch.slice(devPatch.indexOf('@@')))
  copy(path.join(dev, 'renderer-r1-to-r2.diff'), path.join(own, 'exact-released-patch.diff'))
  const depFrom = path.join(dev, 'frozen', pkg, 'node_modules'), depTo = path.join(frozen, 'node_modules')
  const before = scan(depFrom)
  save('dependency-source-before.json', { path: depFrom, files: before })
  fs.cpSync(depFrom, depTo, { recursive: true, dereference: false, verbatimSymlinks: true })
  const after = scan(depTo)
  assert.deepEqual(bytesOnly(before), bytesOnly(after))
  const sharedInodes = Object.keys(after).filter(k => !after[k].link &&
    after[k].dev === before[k].dev && after[k].ino === before[k].ino)
  const externalLinks = Object.keys(after).filter(k => after[k].link && !after[k].realpath.startsWith(`${depTo}/`))
  assert.deepEqual(sharedInodes, []); assert.deepEqual(externalLinks, [])
  save('dependency-ownership.json', { from: depFrom, to: depTo, sharedInodes, externalLinks,
    files: Object.values(after).filter(v => !v.link).length, links: Object.values(after).filter(v => v.link).length })
  for (const [name, args] of [
    ['product-diff', ['diff', '--', pkg, 'launcher']],
    ['new-product-files', ['ls-files', '--others', '--exclude-standard', '--', `${pkg}/src`, `${pkg}/scripts`, 'launcher']],
    ['index-diff', ['diff', '--cached', '--']],
  ]) assert.equal(command(`prepare/${name}`, 'git', args).status, 0)
  const current = mainBindings(ownFiles)
  save('main-bindings-before.json', current)
  save('candidate.json', {
    baseline, parent107: c.parent107, originalR1Full109: c.originalR1Full109, successor109: c.successor109,
    frozenFiles: ownFiles, packageInputs, declarationCount: 109, frozenInputCount: 531, packageInputCount: 516,
    launcherInputCount: 15, soleChangeFromR1: delta(old.frozenFiles, ownFiles),
    mainVsFrozenAtPrepare: delta(ownFiles, current), mainTreeNotLocked: true,
    developmentCandidateFile: fingerprint(path.join(dev, 'candidate-r2-complete.json')),
    exactReleasedPatch: fingerprint(path.join(own, 'exact-released-patch.diff')),
    independentPatchHunkExact: true,
    oracle: fingerprint(path.join(tree, oracle)),
    supplements: Object.fromEntries(['retest-probes.test.ts', 'retest-stress.test.ts', 'src/core/retest-legacy-renderer.ts']
      .map(f => [f, fingerprint(path.join(frozen, f))])),
    sourceMode: 'independent frozen TS and dependencies, no build/lib/runtime', builder: 'Main only',
    current3260: 'old107/PID71922 per parent; not queried or claimed as R2',
  })
  save('frozen-before.json', bytesOnly(scan(tree)))
  save('prepare-summary.json', { declared: 109, inputs: 531, package: 516, launcher: 15,
    renderer: ownFiles[renderer], mainVsFrozen: delta(ownFiles, current), dependenciesCopied: true })
  console.log(JSON.stringify(read('prepare-summary.json')))
} else if (action === 'test') {
  const statuses = {}
  assert.equal(fingerprint(path.join(tree, oracle)).sha256, testSha)
  statuses.raw = vitest('raw', ['src/core/report-export-excerpts.test.ts'])
  statuses.stress = vitest('stress', ['retest-stress.test.ts'])
  statuses.probes = vitest('probes', ['retest-probes.test.ts'])
  statuses.affected = vitest('affected', [
    'src/core/progress-report-markdown-u5.test.ts', 'src/core/progress-report.test.ts',
    'src/core/export-isolation.test.ts', 'src/core/export-outbound.test.ts', 'src/client/shared/markdown.test.ts',
  ])
  save('runs/noEmit/tsconfig.json', {
    extends: path.join(frozen, 'tsconfig.json'),
    compilerOptions: { noEmit: true, incremental: false, typeRoots: [path.join(frozen, 'node_modules/@types')],
      outDir: path.join(own, 'runs/noEmit/unused-output'), declarationDir: path.join(own, 'runs/noEmit/unused-types') },
  })
  statuses.noEmit = command('runs/noEmit', process.execPath, [
    path.join(frozen, 'node_modules/typescript/bin/tsc'), '-p', path.join(own, 'runs/noEmit/tsconfig.json'),
    '--noEmit', '--incremental', 'false',
  ], frozen, envFor('noEmit')).status
  save('execution-summary.json', { statuses, raw: result('raw'), stress: result('stress'),
    probes: result('probes'), affected: result('affected') })
  process.exitCode = Object.values(statuses).every(v => v === 0) ? 0 : 1
  console.log(JSON.stringify({ statuses, release: 'STOP pending independent audit' }))
} else if (action === 'audit') {
  const groups = Object.fromEntries(['raw', 'stress', 'probes', 'affected'].map(n => [n, result(n)]))
  const noEmit = read('runs/noEmit/command.json')
  const expected = { raw: 13, stress: 1, probes: 6, affected: 54 }
  const allGreen = Object.entries(groups).every(([n, r]) =>
    r.total === expected[n] && r.passed === expected[n] && !r.failed && !r.skipped && r.exit === 0) && noEmit.exit === 0
  const witnesses = []
  for (const dir of fs.readdirSync(path.join(own, 'runs/raw/tmp'))) {
    const root = path.join(own, 'runs/raw/tmp', dir)
    const before = path.join(root, 'exports/before-source-change/rpt-0002-progress.md')
    if (!fs.existsSync(before)) continue
    const after = path.join(root, 'exports/excerpts/rpt-0002-progress.md')
    const old = json(path.join(root, 'frozen-before.json'))
    const changed = json(path.join(root, 'source-after.json'))
    const reportFile = path.join(root, 'data/pmtool/reports/rpt-0002.json')
    const md = fs.readFileSync(after, 'utf8')
    assert.equal(md, fs.readFileSync(before, 'utf8'))
    assert.equal(fs.readFileSync(reportFile, 'utf8'), old.raw)
    assert.deepEqual(changed.fixed, old.fixed)
    for (const excerpt of old.fixed.excerpts) {
      for (const field of ['taskId', 'entryId', 'revisionId', 'author', 'date', 'contentSnapshot']) assert(md.includes(excerpt[field]))
      assert.equal(md.split(excerpt.contentSnapshot).length - 1, 1)
      const source = changed.changed.progressLog.find(e => e.id === excerpt.entryId)
      assert(source.deletedAt); assert.notEqual(source.revisions.at(-1).content, excerpt.contentSnapshot)
    }
    for (const text of ['源已改正文', '源已改作者', 'OTHER_TASK_BODY', '未选E2正文']) assert(!md.includes(text))
    const commands = fs.readFileSync(path.join(root, 'commands.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l))
    assert.equal(commands.filter(c => c.input.startsWith('export')).length, 2)
    assert(commands.every(c => c.response.kind === 'success'))
    witnesses.push({ root: path.relative(own, root), sourceType: old.fixed.sourceType, frozenExcerpts: old.fixed.excerpts,
      beforeMD: fingerprint(before), afterMD: fingerprint(after), report: fingerprint(reportFile), commands,
      unchangedReportBytes: true, sixFieldsComplete: true, currentSourceExcluded: true })
  }
  assert.equal(witnesses.length, 2)
  const stress = read('runs/stress/observations/author-stress.json')
  if (allGreen) {
    assert.equal(stress.authorLength, 300024); assert.equal(stress.backtickRuns, 150000)
    assert.equal(stress.frozenSchemaAccepted, true); assert.equal(stress.caught, null)
    assert(stress.returnedBytes > 300024)
  }
  const historicalStress = json(path.join(r1, 'runs/stress/observations/author-stress.json'))
  assert.equal(historicalStress.frozenSchemaAccepted, true)
  assert.equal(historicalStress.caught.name, 'RangeError')
  assert.equal(historicalStress.caught.message, 'Maximum call stack size exceeded')
  const history = ['run-cd8PO9', 'run-cKdR56', 'run-rtV1dy'].map(name => {
    const s = json(path.join(evidence, 'ReportExportRedR1', name, 'summary.json'))
    return { name, passed: s.passed, failed: s.failed, exit: s.vitestExit, rerun: false }
  })
  assert.deepEqual(history.map(s => [s.passed, s.failed, s.exit]), [[0, 13, 1], [7, 6, 1], [7, 6, 1]])
  const patch = fs.readFileSync(path.join(own, 'exact-released-patch.diff'), 'utf8').split('\n')
  const patchStats = { added: patch.filter(l => l.startsWith('+') && !l.startsWith('+++')).length,
    removed: patch.filter(l => l.startsWith('-') && !l.startsWith('---')).length }
  assert.deepEqual(patchStats, { added: 5, removed: 1 })
  const compatibility = ['missing', 'empty'].flatMap(shape => ['manual', 'session'].map(type => {
    const name = `runs/probes/observations/legacy-${shape}-${type}.json`
    const v = read(name)
    assert.equal(v.current, v.legacy); assert.equal(v.exactBytesEqual, true)
    return { shape, sourceType: type, bytes: Buffer.byteLength(v.current), sha256: hash(v.current), exact: true }
  }))
  const fences = [0, 3, 17, 1800].map(run => {
    const v = read(`runs/probes/observations/fence-${run}.json`)
    assert(v.exactLiteralBlockPresent); assert(v.md.includes(v.sixFieldBlock))
    return { run, fenceLength: v.fenceLength, observation: fingerprint(path.join(own, `runs/probes/observations/fence-${run}.json`)) }
  })
  save('audit.json', { verdict: allGreen ? 'PASS_SOURCE_AUTO_LIMITED' : 'FAIL_SOURCE_AUTO_LIMITED',
    groups, noEmit, witnesses, stressWitness: stress, compatibility, fences, patchStats, history,
    originalStress: { observation: fingerprint(path.join(r1, 'runs/stress/observations/author-stress.json')),
      command: json(path.join(r1, 'runs/stress/command.json')), error: historicalStress.caught, rerun: false },
    preservedFacilities: {
      r1Affected: json(path.join(r1, 'runs/affected/command.json')).exit,
      r1Probes: json(path.join(r1, 'runs/probes/command.json')).exit,
      developerNoEmit: json(path.join(dev, 'runs/noEmit/command.json')).exit,
    },
    stressCommand: 'NOT_RUN; original stress covers real schema plus renderer, not huge-author export',
    mainSuccessorBuildAdmission: allGreen ? 'THIS_SOURCE_AUTO_GATE_ONLY; other gates still required' : 'NOT_GRANTED',
    exclusions: ['GUI', 'build/full regression', 'runtime loaded', 'other parallel work', 'parent goal', 'Git commit'],
    release: 'STOP' })
  process.exitCode = allGreen ? 0 : 1
  console.log(JSON.stringify({ verdict: read('audit.json').verdict, totals: expected, noEmit: noEmit.exit,
    witnesses: witnesses.map(w => w.sourceType), stressCaught: stress.caught, release: 'STOP' }))
} else if (action === 'close') {
  const c = read('candidate.json')
  const protectedBefore = read('protected-before.json')
  const protection = Object.fromEntries(Object.entries(protectedBefore).map(([name, v]) =>
    [name, delta(v.files, bytesOnly(scan(v.path)))]))
  const frozenDrift = delta(read('frozen-before.json'), bytesOnly(scan(tree)))
  const dependency = read('dependency-source-before.json')
  const dependencySourceDrift = delta(bytesOnly(dependency.files), bytesOnly(scan(dependency.path)))
  const current = mainBindings(c.frozenFiles)
  save('main-bindings-at-close.json', current)
  const mainDuringRun = delta(read('main-bindings-before.json'), current)
  const mainVsCandidate = delta(c.frozenFiles, current)
  const head = command('close/head', 'git', ['rev-parse', 'HEAD'])
  const index = command('close/index-diff', 'git', ['diff', '--cached', '--'])
  command('close/new-product-files', 'git', ['ls-files', '--others', '--exclude-standard', '--', `${pkg}/src`, `${pkg}/scripts`, 'launcher'])
  command('close/product-diff', 'git', ['diff', '--', pkg, 'launcher'])
  assert.equal(head.status, 0); assert.equal(head.stdout.trim(), baseline)
  assert.equal(index.status, 0)
  assert.equal(index.stdout, fs.readFileSync(path.join(own, 'prepare/index-diff/stdout.txt'), 'utf8'))
  assert.equal(current[renderer].sha256, r2Sha); assert.equal(current[oracle].sha256, testSha)
  save('close.json', { protection, frozenDrift, dependencySourceDrift, mainDuringRun, mainVsCandidate,
    protectedRoots: Object.keys(protectedBefore).length,
    protectedEntries: Object.values(protectedBefore).reduce((n, v) => n + Object.keys(v.files).length, 0),
    mainTreeNotLocked: true, parallelChangesNotClaimedOrReverted: true,
    head: baseline, indexUnchanged: true, noSharedLibWrite: true,
    children: 'all spawnSync children returned; exact PID/exit in command.json',
    verdict: read('audit.json').verdict, release: 'STOP', serviceGUI: 'NOT_RUN' })
  assert(Object.values(protection).every(clear)); assert(clear(frozenDrift)); assert(clear(dependencySourceDrift))
  console.log(JSON.stringify({ protectionClear: true, frozenDrift, dependencySourceDrift, mainDuringRun,
    mainVsCandidate, verdict: read('audit.json').verdict, release: 'STOP' }))
} else if (action === 'seal') {
  assert.equal(read('close.json').release, 'STOP')
  const files = bytesOnly(scan(own))
  save('artifact-index.json', { at: new Date().toISOString(), files, excludesSelfAndLaterSeal: true })
  for (const [file, expected] of Object.entries(files)) {
    if (expected.link) assert.equal(fs.readlinkSync(path.join(own, file)), expected.link)
    else assert.deepEqual(fingerprint(path.join(own, file)), expected)
  }
  const documents = {}
  for (const name of fs.readdirSync(path.join(repo, 'docs/testing'))) {
    if (name.startsWith(prefix)) documents[`docs/testing/${name}`] = fingerprint(path.join(repo, 'docs/testing', name))
  }
  save('documentation-index.json', { files: documents, artifactIndex: fingerprint(path.join(own, 'artifact-index.json')) })
  save('seal.json', { verifiedEntries: Object.keys(files).length, documentationCount: Object.keys(documents).length,
    verdict: read('audit.json').verdict, release: 'STOP', noExtraProductRun: true })
  console.log(JSON.stringify(read('seal.json')))
} else throw new Error('用法 prepare|test|audit|close|seal；禁止覆盖原件')

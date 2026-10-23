import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  constants, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync,
  readdirSync, readlinkSync, realpathSync, statSync, symlinkSync, writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'ask-auth-feedback-independent-retest-20261022-r1'
const out = join(repo, 'reports/all-pending-evidence-20261021/AskAuthRetestR1')
const frozen = join(out, 'frozen')
const pkg = 'packages/dsh-pm-tool'
const red = join(repo, 'reports/all-pending-evidence-20261021/AskAuthRedR1')
const dev = join(repo, 'reports/all-pending-evidence-20261021/AskAuthDevR1')
const devRoot = '/private/tmp/pmtool-ask-auth-dev-20261022-r1'
const depsSource = join(devRoot, pkg, 'node_modules')
const deps = join(frozen, pkg, 'node_modules')
const ask = `${pkg}/src/commands/ask.ts`
const auth = `${pkg}/src/commands/ask-auth-feedback.test.ts`
const inputs = ['src', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts', 'cordis.patch.yml']
const affected = [
  'commands/ask-governance.test.ts', 'core/ai-client-terminal.test.ts',
  'core/ask-context.test.ts', 'core/ask-copilot-b7.test.ts', 'core/ask-projection.test.ts',
  'core/copilot-task-fields.test.ts', 'core/copilot-validate.test.ts', 'core/ui-feedback.test.ts',
  'client/shared/drawers/copilot-preconfirm.test.tsx', 'client/copilot-extension-baseline.test.tsx',
  'client/index-command-feedback.test.tsx', 'client/panel-transport-error-feedback.test.tsx',
].map(path => `${pkg}/src/${path}`)
const seams = ['core/ai-client.ts', 'core/model-route.ts', 'core/storage.ts', 'core/ask-copilot.ts']
  .map(path => `${pkg}/src/${path}`)
const [stage, suite] = process.argv.slice(2)
assert(['freeze', 'test', 'type', 'close'].includes(stage))
if (stage === 'test') assert(['original11', 'affected'].includes(suite))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
function save(name, value) {
  const target = resolve(out, name)
  assert(target.startsWith(`${out}/`), 'only own evidence')
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
const differences = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(path => JSON.stringify(a[path]) !== JSON.stringify(b[path]))
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
  const upstreamUnchanged = JSON.stringify(inventory(join(frozen, 'upstream')))
    === JSON.stringify(json(join(out, 'upstream-before.json')))
  const currentDeps = audit(deps, depsSource)
  const dependenciesUnchanged = JSON.stringify(currentDeps)
    === JSON.stringify(json(join(out, 'dependencies-before.json')))
  const main = allInputs(repo), initial = json(join(out, 'main-before.json'))
  const concurrentInputChanges = inputs.flatMap(root => differences(initial[root], main[root])
    .map(path => `${pkg}/${root}${path === '.' ? '' : `/${path}`}`))
  const mainAskMatches = JSON.stringify(inventory(join(repo, ask))) === JSON.stringify(inventory(join(frozen, ask)))
  return {
    protectedDrift, frozenDrift, upstreamUnchanged, dependenciesUnchanged,
    external: currentDeps.external, sharedInodes: currentDeps.sharedInodes,
    mainAskMatches, concurrentInputChanges,
    concurrentPolicy: 'Only consumed protected seams/oracles are guarded; other main source changes are observed, not locked or called pollution.',
    ok: !protectedDrift.length && !frozenDrift.length && upstreamUnchanged && dependenciesUnchanged
      && !currentDeps.external.length && !currentDeps.sharedInodes.length && mainAskMatches,
  }
}
function environment(name) {
  return {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), TMP: join(out, 'tmp'), TEMP: join(out, 'tmp'),
    XDG_CACHE_HOME: join(out, 'cache'), XDG_CONFIG_HOME: join(out, 'home/config'), XDG_DATA_HOME: join(out, 'home/data'),
    DSH_HOME: join(out, 'runtime'), PM_GOVERNANCE_TMP: join(out, 'tmp'), PM_FILE_ATOMIC_TMP: join(out, 'tmp'),
    DSH_PM_FILE_ROOT: join(out, 'files'), DSH_PM_BACKUP_DIR: join(out, 'backups'), DSH_PM_EXPORT_DIR: join(out, 'exports'),
    ASK_AUTH_PI_STREAM: join(frozen, 'upstream/pi-src/stream.ts'),
    ASK_AUTH_OBSERVATIONS: join(out, `${name}.observations.ndjson`),
    CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1',
  }
}
function execute(name, argv, cwd, env) {
  assert(!existsSync(join(out, `${name}.command.json`)), 'never overwrite a run')
  const start = new Date().toISOString()
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd, env, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024,
  })
  save(`${name}.stdout.log`, result.stdout ?? '')
  save(`${name}.stderr.log`, result.stderr ?? '')
  save(`${name}.command.json`, {
    argv, cwd, env, start, end: new Date().toISOString(), pid: result.pid,
    originalExit: result.status, signal: result.signal, error: result.error?.message ?? null,
    inputManifestSha256: existsSync(join(out, 'frozen-before.json')) ? sha(readFileSync(join(out, 'frozen-before.json'))) : null,
  })
  return result
}
if (stage === 'freeze') {
  assert(!existsSync(out), 'never overwrite prior evidence')
  assert(json(join(dev, 'close.json')).released && json(join(red, 'close.json')).released)
  const beforeAsk = readFileSync(join(red, 'frozen', ask), 'utf8')
  const currentAsk = readFileSync(join(repo, ask), 'utf8')
  const oldCondition = "error.message === 'PROD_KEY_MISSING' || /Key|密钥/.test(error.message)"
  const newCondition = "error.code === 'MISSING_CREDENTIAL' || error.message === 'PROD_KEY_MISSING'"
  assert.equal(beforeAsk.split(oldCondition).length, 2)
  assert.equal(currentAsk, beforeAsk.replace(oldCondition, newCondition))
  assert.equal(Buffer.byteLength(currentAsk), 34931)
  assert.equal(sha(currentAsk), '084efb5b33e7cda7368b87c4708f87f460d28588f3e7476cadfad2de0fd35884')
  assert.equal(sha(readFileSync(join(repo, auth))), '26ad8a8e72afd266d756a23dd36db7841a07d9f03050374d9158557a5dfaed29')
  for (const path of [ask, auth, ...seams, ...affected]) {
    assert.deepEqual(inventory(join(repo, path)), inventory(join(devRoot, path)), `consumed bytes differ: ${path}`)
  }
  mkdirSync(out, { recursive: true, mode: 0o700 })
  const redDocs = readdirSync(join(repo, 'docs/testing')).filter(name => name.startsWith('ask-auth-feedback-red-20261022-r1'))
  const watch = [
    fileURLToPath(import.meta.url), red, dev,
    join(repo, auth), ...seams.map(path => join(repo, path)), ...affected.map(path => join(repo, path)),
    ...redDocs.map(path => join(repo, 'docs/testing', path)),
    join(repo, 'docs/testing/ai-terminal-failure-20261022-selftmp/r2'),
    join(repo, 'docs/testing/ai-terminal-independent-retest-20261022-r1-report.md'),
    join(repo, 'docs/plans/2026-10-22-ask-auth-feedback-closure.md'),
    join(devRoot, 'upstream'), depsSource,
  ]
  for (const path of watch) assert(existsSync(path), `missing protection: ${path}`)
  save('protected-before.json', Object.fromEntries(watch.map(path => [path, inventory(path)])))
  const snapshot = allInputs(repo)
  save('main-before.json', snapshot)
  for (const path of inputs) cpSync(join(repo, pkg, path), join(frozen, pkg, path),
    { recursive: true, preserveTimestamps: true, force: false, errorOnExist: true })
  assert.deepEqual(allInputs(frozen), snapshot)
  save('frozen-before.json', snapshot)
  const originalDeps = audit(depsSource)
  assert.deepEqual(originalDeps.external, [])
  function copyDeps(path) {
    const target = join(deps, relative(depsSource, path)), s = lstatSync(path)
    if (s.isSymbolicLink()) {
      const actual = realpathSync(path)
      assert(actual.startsWith(`${depsSource}/`))
      symlinkSync(relative(dirname(target), join(deps, relative(depsSource, actual))), target)
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
  cpSync(join(devRoot, 'upstream'), join(frozen, 'upstream'),
    { recursive: true, preserveTimestamps: true, force: false, errorOnExist: true })
  assert.deepEqual(inventory(join(frozen, 'upstream')), inventory(join(devRoot, 'upstream')))
  save('upstream-before.json', inventory(join(frozen, 'upstream')))
  for (const path of ['home', 'tmp', 'cache', 'runtime', 'files', 'backups', 'exports'])
    mkdirSync(join(out, path), { mode: 0o700 })
  save('vitest.config.mjs', `export default ${JSON.stringify({
    root: frozen, cacheDir: join(out, 'cache/vite'),
    test: { environment: 'node', cache: false, include: [auth, ...affected], pool: 'forks',
      poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000 },
  }, null, 2)}\n`)
  const diff = execute('patch', ['/usr/bin/diff', '-u', '--label', `a/${ask}`, '--label', `b/${ask}`,
    join(red, 'frozen', ask), join(frozen, ask)], frozen, environment('patch'))
  assert.equal(diff.status, 1, 'diff exit1 is the expected source delta')
  save('ask.patch', diff.stdout)
  assert.equal(diff.stdout, readFileSync(join(dev, 'ask.patch'), 'utf8'))
  const sourceFiles = Object.entries(snapshot.src).map(([path, value]) => ({ path: `${pkg}/src/${path}`, ...value }))
  save('source-files.json', sourceFiles)
  const devInput = allInputs(devRoot)
  const relativeDevChanges = inputs.flatMap(root => differences(devInput[root], snapshot[root])
    .map(path => `${pkg}/${root}${path === '.' ? '' : `/${path}`}`))
  save('dev-to-retest-input-delta.json', relativeDevChanges)
  save('candidate.json', {
    at: new Date().toISOString(), role: 'independent SOURCE/AUTO, not developer or GUI',
    baseline: json(join(dev, 'candidate.json')).baseline,
    baselineProvenance: 'Read-only AskAuthDevR1/candidate.json plus original parent107 tracked diff; no Git writes.',
    source: repo, frozen, packageVersion: json(join(frozen, pkg, 'package.json')).version,
    sourceFileCount: sourceFiles.length,
    completeFrozenInputCount: inputs.reduce((count, root) => count + Object.keys(snapshot[root]).length, 0),
    frozenInputSubset: inputs, tests: [auth, ...affected], seams, relativeDevChanges,
    consumed: Object.fromEntries([ask, auth, ...seams, ...affected].map(path => [path, inventory(join(frozen, path))])),
    patchSha256: sha(diff.stdout), inputManifestSha256: sha(readFileSync(join(out, 'frozen-before.json'))),
    originalTrackedDiff: inventory(join(dev, 'parent107.tracked-product.diff')),
    originalNewProductFiles: inventory(join(dev, 'parent107.new-product-files.txt')),
    node: process.version, executable: process.execPath, protectedObjectCount: watch.length,
    versions: Object.fromEntries(['vitest', '@deepseek-ai/dsh-llm', '@deepseek-ai/cordis', '@earendil-works/pi-ai', 'typescript']
      .map(path => [path, json(join(deps, path, 'package.json')).version])),
    dependencyFiles: ownDeps.files.length, internalLinks: ownDeps.links.length,
    writes: [out, join(repo, 'docs/testing', `${prefix}*`)],
    productionChain: 'handleAskCommand -> generateDraft -> LlmRuntime.prepareCall/stream -> original pi -> BlockAssembler',
    runtime: 'No running instance claimed; Main3260 old107 is not this candidate.',
    build: false, install: false, gui: false, services: false, sharedLib: false,
    credentials: false, vendor: false, formalData: false, totalGateSigned: false, release: 'STOP',
  })
  const check = protection()
  save('freeze-check.json', check)
  assert(check.ok)
  console.log(JSON.stringify({ stage, sourceFiles: sourceFiles.length, completeInputs: json(join(out, 'candidate.json')).completeFrozenInputCount,
    dependencies: ownDeps.files.length, links: ownDeps.links.length, relativeDevChanges, check }))
} else if (stage === 'test' || stage === 'type') {
  assert(protection().ok)
  const name = stage === 'type' ? 'type' : suite
  const files = suite === 'original11' ? [auth] : affected
  const argv = stage === 'type'
    ? [process.execPath, join(deps, 'typescript/bin/tsc'), '-p', join(frozen, pkg, 'tsconfig.json'), '--noEmit']
    : [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', ...files,
      '--config', join(out, 'vitest.config.mjs'), '--no-cache', '--reporter=verbose', '--reporter=json',
      '--outputFile', join(out, `${name}.result.json`)]
  const result = execute(name, argv, frozen, environment(name))
  const report = stage === 'test' && existsSync(join(out, `${name}.result.json`)) ? json(join(out, `${name}.result.json`)) : null
  const check = protection()
  const fileResults = report?.testResults.map(file => ({
    name: relative(frozen, file.name), status: file.status,
    assertions: file.assertionResults.length,
    passed: file.assertionResults.filter(a => a.status === 'passed').length,
    failed: file.assertionResults.filter(a => a.status === 'failed').length,
    skipped: file.assertionResults.filter(a => a.status !== 'passed' && a.status !== 'failed').length,
  })) ?? []
  save(`${name}.summary.json`, {
    suite: name, originalExit: result.status, protection: check, fileResults,
    passed: report?.numPassedTests, failed: report?.numFailedTests, skipped: report?.numPendingTests,
    expectedFileCount: stage === 'type' ? null : files.length,
    observedAssertionCount: fileResults.reduce((n, f) => n + f.assertions, 0),
    guiSigned: false, totalGateSigned: false, release: 'STOP',
  })
  console.log(JSON.stringify({ stage, name, originalExit: result.status, fileResults,
    passed: report?.numPassedTests, failed: report?.numFailedTests, skipped: report?.numPendingTests, check }))
  process.exitCode = result.status ?? 2
} else {
  const check = protection()
  const processes = ['patch', 'original11', 'affected', 'type'].map(name => {
    const command = json(join(out, `${name}.command.json`))
    const ps = spawnSync('/bin/ps', ['-p', String(command.pid), '-o', 'pid=,ppid=,command='],
      { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } })
    return { name, pid: command.pid, originalExit: command.originalExit, psExit: ps.status,
      stdout: ps.stdout, stderr: ps.stderr, exited: ps.status === 1 && !ps.stdout.trim() }
  })
  const observations = readFileSync(join(out, 'original11.observations.ndjson'), 'utf8').trim().split('\n').map(JSON.parse)
  assert.equal(observations.length, 11)
  const observationReview = observations.map(row => {
    assert.deepEqual(row.before, row.after)
    assert.deepEqual(row.before, row.afterRecovery)
    assert.deepEqual(row.recovery, { kind: 'success', text: '副驾正常恢复：这是只读回答，不修改项目。' })
    assert.equal(row.disposed, true)
    assert.equal(row.credentialsInEnvironment, false)
    assert.equal(row.first.prepare.length, 1)
    assert.equal(row.allPrepare.length, 2)
    if (row.id.startsWith('R-')) {
      assert.equal(row.result.kind, 'error')
      assert.match(row.result.text, /凭据无效|已失效/)
      assert.doesNotMatch(row.result.text, /PROD_KEY_MISSING|未检测到|凭据缺失/)
    }
    return { id: row.id, result: row.result, first: row.first, root: row.root, projectId: row.projectId, taskId: row.taskId,
      zeroBusinessWrite: true, sameRuntimeRecovery: row.recovery, disposed: true }
  })
  save('observations-review.json', observationReview)
  const summaries = ['original11', 'affected', 'type'].map(name => json(join(out, `${name}.summary.json`)))
  const expectedCounts = summaries[0].passed === 11 && summaries[0].failed === 0 && summaries[0].skipped === 0
    && summaries[0].fileResults.length === 1 && summaries[0].observedAssertionCount === 11
    && summaries[1].passed === 199 && summaries[1].failed === 0 && summaries[1].skipped === 0
    && summaries[1].fileResults.length === 12 && summaries[1].observedAssertionCount === 199
  const released = processes.every(p => p.exited)
  const pass = check.ok && expectedCounts && summaries.every(s => s.originalExit === 0) && released
  save('owned-runtime-roots.json', Object.fromEntries(['home', 'tmp', 'cache', 'runtime', 'files', 'backups', 'exports']
    .map(path => [path, inventory(join(out, path))])))
  save('close.json', {
    at: new Date().toISOString(), check, processes, expectedCounts, released, stop: true,
    verdict: pass ? 'PASS_LIMITED_SOURCE_AUTO' : 'FAIL_OR_BLOCKED',
    results: summaries.map(({ suite, originalExit, fileResults, passed, failed, skipped }) =>
      ({ suite, originalExit, files: fileResults.length, passed, failed, skipped })),
    gui: 'NOT_RUN_THIS_ROLE', wholeRAAI06: 'NOT_SIGNED', parentGoal: 'NOT_SIGNED', commit: 'MAIN_ONLY', release: 'STOP',
    successor: 'Main unique successor build/full regression/runtime binding and new GUI evidence, then different GUI review; no old107 substitution.',
  })
  save('evidence-index.json', inventory(out))
  console.log(JSON.stringify(json(join(out, 'close.json'))))
  process.exitCode = pass ? 0 : 2
}

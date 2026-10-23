import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const testing = join(repo, 'docs/testing')
const prefix = 'a17-transport-feedback-independent-retest-20261022'
const base = join(testing, `${prefix}-selftmp`)
const pkg = 'packages/dsh-pm-tool'
const inputs = ['src', 'scripts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
const [stage, round = 'r1'] = process.argv.slice(2)
assert(['freeze', 'run', 'final'].includes(stage))
assert.match(round, /^r[1-9]\d*$/)
const out = join(base, round), frozen = join(out, 'frozen')
const tf = 'a17-transport-feedback-contract-20261022'
const a16 = 'a16-extension-base-independent-retest-20261022'
const a15 = 'a15-preconfirm-independent-retest-20261022'
const old = join(testing, `${tf}-selftmp/r2`)
const devPrefix = 'a17-transport-feedback-developer-20261022'
const dev = join(repo, 'reports', `${devPrefix}-selftmp`)
const deps = '/private/tmp/pmtool-a14-closure-20261022/packages/dsh-pm-tool/node_modules'
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(p) {
    const s = lstatSync(p), k = relative(root, p) || '.'
    if (s.isSymbolicLink()) result[k] = { link: readlinkSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else result[k] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(root)
  return result
}
const content = m => Object.fromEntries(Object.entries(m).map(([k, v]) =>
  [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const sourceNow = root => Object.fromEntries(inputs.map(n => [n, inventory(join(root, pkg, n))]))
function save(name, value, target = out) {
  const p = resolve(target, name)
  assert(p.startsWith(`${base}/`), 'independent A17 evidence only')
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
  DSH_HOME: join(out, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1',
}
const actualA16 = read(join(repo, 'reports/all-pending-evidence-20261021/A16/candidate.json'))
const copiedTests = [`${tf}-cases.test.tsx`, `${a16}-cases.test.tsx`, `${a16}-pc-cases.test.tsx`,
  `${a15}-cases.test.tsx`, `${a15}-expansion.test.tsx`, 'a14-preconfirm-conflict-contract-20261022-cases.test.tsx',
  'board-fixture-clarification-20261021-fixture.json', `${prefix}-cases.test.tsx`]
const initialRoots = [
  ...Object.keys(read(join(dev, 'after-r2/protected-before.json'))),
  ...inputs.map(n => join(repo, pkg, n)),
  ...readdirSync(testing).filter(n => /^(a11-|a12-|a13-|a14-|a15-|a16-|a17-transport-feedback-contract-)/.test(n))
    .map(n => join(testing, n)),
  ...readdirSync(join(repo, 'reports')).filter(n => n.startsWith(devPrefix)).map(n => join(repo, 'reports', n)),
  realpathSync(deps), realpathSync(join(repo, pkg, 'node_modules')),
  ...inputs.map(n => join(actualA16.tree, pkg, n)), join(actualA16.tree, pkg, 'lib'),
  ...['plan.md', 'run.mjs', 'cases.test.tsx'].map(n => join(testing, `${prefix}-${n}`)),
]
const roots = [...new Set(initialRoots)].sort()
const protectedNow = paths => Object.fromEntries(paths.map(p => [p, inventory(p)]))
function declaredA16Drift() {
  return Object.entries({ ...actualA16.sourceHashes, ...actualA16.artifacts }).filter(([p, hash]) =>
    !existsSync(join(actualA16.tree, p)) || sha(readFileSync(join(actualA16.tree, p))) !== hash).map(([p]) => p)
}
const commands = []
function command(id, argv, cwd, e = env, target = out) {
  const start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd, env: e, encoding: 'utf8',
    timeout: 240000, maxBuffer: 128 * 1024 * 1024 })
  save(`${id}.stdout.log`, r.stdout ?? '', target)
  save(`${id}.stderr.log`, r.stderr ?? '', target)
  const c = { id, argv, cwd, env: e, start, end: new Date().toISOString(), pid: r.pid,
    originalExit: r.status, signal: r.signal, error: r.error?.message ?? null }
  save(`${id}.command.json`, c, target)
  commands.push(c)
  console.log(JSON.stringify({ id, originalExit: r.status, signal: r.signal }))
  return r
}
function auditOriginals() {
  const reviewed = []
  for (const [kind, root, rounds] of [
    ['expert', join(testing, `${tf}-selftmp`), ['r1', 'r2']],
    ['developer', dev, ['before-r1', 'after-r1', 'after-r2']],
  ]) {
    for (const r of rounds) {
      const dir = join(root, r), summary = read(join(dir, 'summary.json'))
      const cs = read(join(dir, 'commands.json'))
      for (const c of cs) {
        assert.equal(c.signal, null); assert.equal(c.error, null)
        assert.equal(c.env.NODE_DISABLE_COMPILE_CACHE, '1')
        for (const key of ['HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'DSH_HOME']) assert(c.env[key].startsWith(`${dir}/`))
        const s = summary.results.find(s => s.id === c.id)
        const logs = {}
        for (const type of ['stdout', 'stderr']) {
          const h = sha(readFileSync(join(dir, `${c.id}.${type}.log`)))
          if (s[`${type}Sha256`]) assert.equal(s[`${type}Sha256`], h)
          logs[type] = h
        }
        let counts
        if (c.id === 'noemit') assert.equal(c.originalExit, 0)
        else {
          assert(c.argv.includes('--no-cache'))
          const reporter = read(join(dir, `${c.id}.result.json`))
          assert.equal(sha(readFileSync(join(dir, `${c.id}.result.json`))), s.reporterSha256)
          assert.equal(reporter.numPassedTests, s.passed)
          assert.equal(reporter.numFailedTests, s.failed)
          counts = { passed: reporter.numPassedTests, failed: reporter.numFailedTests,
            failedSuites: reporter.numFailedTestSuites, pending: reporter.numPendingTests }
        }
        reviewed.push({ kind, round: r, id: c.id, originalExit: c.originalExit, ...counts,
          logs, commandSha256: sha(readFileSync(join(dir, `${c.id}.command.json`))),
          reporterSha256: s.reporterSha256, argv: c.argv })
      }
      const manifest = read(join(dir, 'frozen-inputs.json')), live = sourceNow(join(dir, 'frozen'))
      for (const n of inputs) assert.deepEqual(live[n], manifest[n], `${kind}/${r} full original freeze`)
    }
  }
  const oldRed = read(join(old, 'necessary-red.result.json'))
  const redTests = oldRed.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'failed')
  assert.equal(read(join(old, 'necessary-red.command.json')).originalExit, 1)
  assert.equal(redTests.length, 5)
  assert(redTests.every(t => t.failureMessages.every(m => m.includes("expected 'status' to be 'alert'"))))
  const devOld = read(join(dev, 'before-r1/frozen-inputs.json'))
  const expertOld = read(join(old, 'frozen-inputs.json'))
  const current = sourceNow(repo), after = read(join(dev, 'after-r2/frozen-inputs.json'))
  for (const n of inputs) {
    assert.deepEqual(content(devOld[n]), content(expertOld[n]), 'old full product input identity')
    assert.deepEqual(content(current[n]), content(after[n]), 'current full input matches developer release')
  }
  const delta = diff(content(devOld.src), content(current.src))
  assert.deepEqual(delta, ['client/panel-transport-error-feedback.test.tsx', 'client/panel.tsx'])
  for (const n of inputs.filter(n => n !== 'src')) assert.deepEqual(content(devOld[n]), content(current[n]))
  const beforePanel = readFileSync(join(old, 'frozen', pkg, 'src/client/panel.tsx'), 'utf8')
  const currentPanel = readFileSync(join(repo, pkg, 'src/client/panel.tsx'), 'utf8')
  const oldBlock = "    } catch (error) {\n      setMessage(error instanceof Error ? error.message : String(error))\n      setBusy(false)\n      return false\n    } finally {\n      inflightRef.current = false"
  const newBlock = oldBlock.replace('setMessage(error instanceof Error ? error.message : String(error))',
    "setMessage(prefixFeedbackOnce('执行失败', error))")
  assert.equal(beforePanel.split(oldBlock).length, 2)
  assert.equal(beforePanel.replace(oldBlock, newBlock), currentPanel, 'all non-catch panel bytes preserved')
  assert.equal(sha(beforePanel), 'fe58fff88560141bf6d6886c93b6e8a38b82f2ee5c1c6a23bb4059116f3d71ac')
  assert.equal(sha(currentPanel), 'e0918704df4a308028a0a89c742c11421b787d3e18655c830d9b887213fa34fc')
  const originalTest = join(old, 'frozen/docs/testing', `${tf}-cases.test.tsx`)
  assert.equal(sha(readFileSync(originalTest)), sha(readFileSync(join(testing, `${tf}-cases.test.tsx`))))
  for (const r of ['before-r1', 'after-r1', 'after-r2'])
    assert.equal(sha(readFileSync(join(dev, r, 'frozen/docs/testing', `${tf}-cases.test.tsx`))), sha(readFileSync(originalTest)))
  assert.equal(read(join(dev, 'final-after-r2/final.json')).released, true)
  assert.equal(read(join(dev, 'check-r1/check.json')).originalNecessaryRedAndFixtureFailurePreserved, true)
  const close = read(join(dev, 'close-check-r1/close-check.json'))
  assert.deepEqual(close.sourceDrift, []); assert.deepEqual(close.frozenDrift, []); assert.deepEqual(close.protectedDrift, [])
  const fixtureFail = read(join(dev, 'after-r1/panel-and-import-regression.result.json'))
  assert.equal(fixtureFail.numPassedTests, 44); assert.equal(fixtureFail.numFailedTests, 0)
  assert.equal(fixtureFail.numFailedTestSuites, 1)
  assert.equal(read(join(dev, 'after-r1/panel-and-import-regression.command.json')).originalExit, 1)
  const originalIndexRoot = join(repo, 'reports/all-pending-evidence-20261021/A15/import-fault')
  const index = read(join(originalIndexRoot, 'index.json'))
  for (const [p, info] of Object.entries(index)) {
    const b = readFileSync(join(originalIndexRoot, p))
    assert.equal(b.length, info.bytes); assert.equal(sha(b), info.sha256)
  }
  return { reviewed, sourceDelta: delta, oldRedTests: redTests, oldPanelSha256: sha(beforePanel),
    currentPanelSha256: sha(currentPanel), allOtherPanelBytesUnchanged: true,
    originalTestSha256: sha(readFileSync(originalTest)), allOriginalExpectationsUnchanged: true,
    originalA15IndexedFiles: Object.keys(index).length, originalFailuresPreserved: true,
    developerReleased: true, fullCurrentMatchesDeveloperAfterR2: true }
}
function protectionCheck() {
  const before = read(join(out, 'protected-before.json'))
  const after = protectedNow(Object.keys(before))
  const drift = Object.fromEntries(Object.keys(before).map(p => [p, diff(before[p], after[p])]))
  const manifest = read(join(out, 'frozen-inputs.json')), source = read(join(out, 'source-at-freeze.json'))
  const frozenDrift = Object.fromEntries(inputs.map(n => [n, diff(manifest[n], inventory(join(frozen, pkg, n)))]))
  const sourceDrift = Object.fromEntries(inputs.map(n => [n, diff(source[n], inventory(join(repo, pkg, n)))]))
  const testsDrift = diff(read(join(out, 'copied-tests.json')), inventory(join(frozen, 'docs/testing')))
  const a16Drift = declaredA16Drift()
  const ok = Object.values(drift).flat().length === 0 && Object.values(frozenDrift).flat().length === 0 &&
    Object.values(sourceDrift).flat().length === 0 && testsDrift.length === 0 && a16Drift.length === 0
  return { before, after, drift, frozenDrift, sourceDrift, testsDrift, a16Drift, protectionOk: ok }
}
if (stage === 'freeze') {
  assert(!existsSync(out), 'never overwrite independent round')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n), { mode: 0o700 })
  console.log('collecting declared read-only protection roots')
  save('protected-before.json', protectedNow(roots))
  assert.deepEqual(declaredA16Drift(), [])
  save('original-audit.json', auditOriginals())
  const source = sourceNow(repo)
  save('source-at-freeze.json', source)
  const git = (id, args) => {
    const r = command(id, ['/usr/bin/git', ...args], repo, { ...env, GIT_OPTIONAL_LOCKS: '0' })
    assert.equal(r.status, 0, r.stderr)
    return r.stdout
  }
  const head = git('git-head', ['rev-parse', 'HEAD']).trim()
  const originMain = git('git-origin', ['rev-parse', 'origin/main']).trim()
  const patch = git('git-tracked', ['diff', '--binary', 'HEAD', '--', pkg])
  save('candidate-tracked.patch', patch)
  save('candidate-status.txt', git('git-status', ['status', '--short', '--branch', '--', pkg]))
  const newPaths = git('git-new-inputs', ['ls-files', '--others', '--exclude-standard', '--',
    ...inputs.map(n => `${pkg}/${n}`)]).trim().split('\n').filter(Boolean).sort()
  save('candidate-new-inputs.json', newPaths.map(path => ({ path, ...inventory(join(repo, path))['.'] })))
  save('acquisition-commands.json', commands)
  for (const n of inputs) cpSync(join(repo, pkg, n), join(frozen, pkg, n), { recursive: true, preserveTimestamps: true })
  const manifest = sourceNow(frozen)
  for (const n of inputs) assert.deepEqual(content(manifest[n]), content(source[n]), 'complete current source freeze')
  save('frozen-inputs.json', manifest)
  for (const n of copiedTests) {
    cpSync(join(testing, n), join(frozen, 'docs/testing', n), { recursive: true, preserveTimestamps: true })
    assert.equal(sha(readFileSync(join(testing, n))), sha(readFileSync(join(frozen, 'docs/testing', n))))
  }
  save('copied-tests.json', inventory(join(frozen, 'docs/testing')))
  save('replay-input.json', read(join(old, 'replay-input.json')))
  save('pc-replay-input.json', read(join(testing, `${a16}-selftmp/r1/replay-input.json`)))
  symlinkSync(deps, join(frozen, pkg, 'node_modules'), 'dir')
  symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  const dependencyNames = ['react', 'react-test-renderer', 'vitest', 'typescript', 'lucide-react', 'zod', 'xlsx']
  save('candidate.json', { at: new Date().toISOString(), head, originMain, sourceTree: repo, frozen,
    sourceCount: Object.keys(manifest.src).length, completeInputs: inputs, panelSha256: manifest.src['client/panel.tsx'].sha256,
    manifestSha256: sha(readFileSync(join(out, 'frozen-inputs.json'))), trackedSha256: sha(patch),
    newFilesSha256: sha(readFileSync(join(out, 'candidate-new-inputs.json'))),
    newTest: manifest.src['client/panel-transport-error-feedback.test.tsx'],
    independentCases: inventory(join(testing, `${prefix}-cases.test.tsx`))['.'],
    environment: { node: process.version, executable: process.execPath, os: os.release(), arch: os.arch() },
    dependencies: Object.fromEntries(dependencyNames.map(n => [n, {
      root: realpathSync(join(deps, n)), version: read(join(deps, n, 'package.json')).version }])),
    actualA16: { tree: actualA16.tree, panelSha256: actualA16.sourceHashes[`${pkg}/src/client/panel.tsx`],
      declaredDrift: declaredA16Drift(), instanceNotAccessed: true },
    build: false, gui: false, services: false, sourceFreezeOwnedBy: 'independent A17', protectionRoots: roots.length })
  console.log(JSON.stringify({ stage, completeFreeze: true, sourceCount: Object.keys(manifest.src).length, roots: roots.length }))
} else if (stage === 'run') {
  assert(!existsSync(join(out, 'commands.json')))
  for (const n of inputs) assert.deepEqual(inventory(join(frozen, pkg, n)), read(join(out, 'frozen-inputs.json'))[n])
  const config = { root: frozen, cacheDir: join(out, 'cache/vite'), test: {
    environment: 'node', cache: false,
    include: ['docs/testing/*.test.tsx', `${pkg}/src/**/*.test.ts`, `${pkg}/src/**/*.test.tsx`],
    pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000,
  } }
  save('vitest.config.mjs', `export default ${JSON.stringify(config, null, 2)}\n`)
  function test(id, files, pattern) {
    command(id, [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', ...files, '--config', join(out, 'vitest.config.mjs'),
      '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(out, `${id}.result.json`),
      ...(pattern ? ['--testNamePattern', pattern] : [])], frozen, {
      ...env, TF_INPUT: join(out, 'replay-input.json'), TF_OBSERVATIONS: join(out, `${id}.observations.jsonl`),
      PC_INPUT: join(out, 'pc-replay-input.json'), PC_OBSERVATIONS: join(out, `${id}.pc-observations.jsonl`),
    })
  }
  const file = `docs/testing/${tf}-cases.test.tsx`
  test('success-control', [file], '^TF-C0[12] ')
  test('explicit-context-control', [file], '^TF-C03 ')
  test('original-five-retest', [file], '^TF-F01 ')
  test('recovery-control', [file], '^TF-C04 ')
  test('existing-regression65', ['core/ui-feedback.test.ts', 'client/result-card.test.ts', 'client/result-card-copy.test.ts',
    'client/panel-checklist-toggle.test.tsx', 'client/panel-launch-handshake.test.tsx', 'client/launch-handshake.test.ts']
    .map(n => `${pkg}/src/${n}`))
  test('developer-transport14', [`${pkg}/src/client/panel-transport-error-feedback.test.tsx`])
  test('independent-counterexamples', [`docs/testing/${prefix}-cases.test.tsx`])
  test('revised-pc4', [`docs/testing/${a16}-pc-cases.test.tsx`])
  test('expert-extension28', [`docs/testing/${a16}-cases.test.tsx`])
  test('parent-extension4', [`docs/testing/${a15}-expansion.test.tsx`])
  test('independent23', [`docs/testing/${a15}-cases.test.tsx`])
  test('developer-extension23', [`${pkg}/src/client/copilot-extension-baseline.test.tsx`])
  test('affected-regression87', ['client/shared/drawers/copilot-preconfirm.test.tsx', 'client/sidecar-minimize-retention.test.tsx',
    'client/panel-checklist-toggle.test.tsx', 'client/panel-launch-handshake.test.tsx', 'client/provenance-panel.test.tsx',
    'client/shared/task-draft-materials-stage.test.tsx', 'core/copilot-validate.test.ts', 'core/copilot-task-fields.test.ts',
    'core/ask-projection.test.ts'].map(n => `${pkg}/src/${n}`))
  test('panel-and-import-regression53', ['client/panel-restore-path.test.ts', 'client/panel-cancel-close.test.ts',
    'client/views/tasks-import-confirm.test.tsx', 'client/views/tasks-number-feedback.test.tsx',
    'client/views/records-entry-guard.test.ts', 'client/views/reports-entry-guard.test.ts',
    'client/shared/records-callbacks.test.ts', 'client/board/BoardBento-feedback.test.tsx'].map(n => `${pkg}/src/${n}`))
  command('noemit', [process.execPath, join(deps, 'typescript/bin/tsc'), '--project', join(frozen, pkg, 'tsconfig.json'),
    '--noEmit', '--incremental', 'false'], join(frozen, pkg))
  save('commands.json', commands)
  const results = commands.map(c => {
    const p = join(out, `${c.id}.result.json`), r = existsSync(p) ? read(p) : null
    return { ...c, reporterSha256: r ? sha(readFileSync(p)) : null,
      stdoutSha256: sha(readFileSync(join(out, `${c.id}.stdout.log`))),
      stderrSha256: sha(readFileSync(join(out, `${c.id}.stderr.log`))),
      observations: Object.fromEntries(['observations', 'pc-observations'].flatMap(type => {
        const p = join(out, `${c.id}.${type}.jsonl`)
        return existsSync(p) ? [[type, { sha256: sha(readFileSync(p)), bytes: lstatSync(p).size }]] : []
      })),
      passed: r?.numPassedTests, failed: r?.numFailedTests, pending: r?.numPendingTests,
      failedSuites: r?.numFailedTestSuites, assertions: r?.testResults.flatMap(t => t.assertionResults) }
  })
  const checks = protectionCheck()
  save('protected-after.json', checks.after)
  const { before, after, ...protection } = checks
  const originalAudit = read(join(out, 'original-audit.json'))
  const nowFive = results.find(r => r.id === 'original-five-retest')
  const nowTests = nowFive.assertions.filter(t => t.status === 'passed')
  const originalFiveNamesMatch = JSON.stringify(originalAudit.oldRedTests.map(t => t.fullName)) ===
    JSON.stringify(nowTests.map(t => t.fullName))
  save('summary.json', { at: new Date().toISOString(), results, ...protection, originalFiveNamesMatch,
    sourceStructuralAuditPass: true, originalFailuresPreserved: true,
    finiteAutomaticPass: protection.protectionOk && results.every(r => r.originalExit === 0 && !r.failed && !r.failedSuites),
    noGuiJudgment: true, noBuild: true, noServices: true, noCommit: true })
  console.log(JSON.stringify({ protectionOk: protection.protectionOk, originalFiveNamesMatch,
    results: results.map(c => ({ id: c.id, exit: c.originalExit, passed: c.passed, failed: c.failed, failedSuites: c.failedSuites })) }))
  process.exitCode = protection.protectionOk && commands.every(c => c.originalExit === 0) ? 0 : 1
} else {
  const final = join(base, `final-${round}`)
  assert(!existsSync(final))
  const checks = protectionCheck()
  const { before, after, ...protection } = checks
  save('protected-after.json', after, final)
  const allCommands = [...read(join(out, 'commands.json')), ...read(join(out, 'acquisition-commands.json'))]
  const pids = [...new Set(allCommands.map(c => c.pid).filter(Boolean))]
  const ps = command('process-check', ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command='], repo, env, final)
  const noRecordedChildren = ps.status === 1 && !ps.stdout.trim()
  const originalAudit = auditOriginals()
  save('original-audit-final.json', originalAudit, final)
  save('own-output-inventory.json', inventory(out), final)
  save('runtime-write-roots.json', Object.fromEntries(['home', 'tmp', 'cache', 'runtime']
    .map(n => [n, inventory(join(out, n))])), final)
  save('final.json', { at: new Date().toISOString(), ...protection, noRecordedChildren,
    sourceMatches: Object.values(protection.sourceDrift).flat().length === 0,
    released: protection.protectionOk && noRecordedChildren, automaticPass: read(join(out, 'summary.json')).finiteAutomaticPass,
    originalsReverified: true, mainNewGuiEvidenceExcludedFromZeroWriteRoots: true,
    gui: 'BLOCKED: not authorized in this subtask; Main must collect new A17 instance evidence',
    wholeGateSigned: false, build: false, services: false, commit: false }, final)
  console.log(JSON.stringify({ protectionOk: protection.protectionOk, noRecordedChildren,
    released: protection.protectionOk && noRecordedChildren, automaticPass: read(join(out, 'summary.json')).finiteAutomaticPass }))
  process.exitCode = protection.protectionOk && noRecordedChildren ? 0 : 1
}

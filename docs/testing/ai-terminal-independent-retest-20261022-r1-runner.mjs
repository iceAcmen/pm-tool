import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync,
  readdirSync, readlinkSync, realpathSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Independent SOURCE/AUTO evidence only. No product, Git, service, or shared output writes.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'ai-terminal-independent-retest-20261022-r1'
const out = join(repo, 'docs/testing', `${prefix}-evidence`)
const dev = join(repo, 'reports/all-pending-evidence-20261021/AiTerminalDevR1')
const original = join(repo, 'docs/testing/ai-terminal-failure-20261022-selftmp/r2')
const source = join(dev, 'repaired-r3/frozen')
const frozen = join(out, 'frozen')
const pkg = 'packages/dsh-pm-tool'
const depsSource = join(source, pkg, 'node_modules')
const deps = join(frozen, pkg, 'node_modules')
const cases = 'docs/testing/ai-terminal-failure-20261022-cases.test.ts'
const product = `${pkg}/src/core/ai-client.ts`
const newTest = `${pkg}/src/core/ai-client-terminal.test.ts`
const inputs = ['src', 'scripts', 'lib', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json',
  'vitest.config.ts', 'tsdown.config.ts', 'cordis.patch.yml', 'locale']
const affected = [
  'src/core/ask-context.test.ts', 'src/core/ask-copilot-b7.test.ts', 'src/core/ask-projection.test.ts',
  'src/core/copilot-task-fields.test.ts', 'src/core/copilot-validate.test.ts', 'src/core/capture.test.ts',
  'src/core/provenance.test.ts', 'src/core/provenance-store.test.ts', 'src/core/provenance-view.test.ts',
  'src/commands/ask-governance.test.ts', 'src/client/shared/drawers/copilot-preconfirm.test.tsx',
  'src/client/provenance-panel.test.tsx', 'src/client/copilot-extension-baseline.test.tsx',
].map(p => `${pkg}/${p}`)
const suites = ['controls', 'original-red', 'new', 'affected', 'legacy-source', 'noemit']
const [stage, suite] = process.argv.slice(2)
assert(['freeze', 'test', 'close'].includes(stage))
if (stage === 'test') assert(suites.includes(suite))
const sha = b => createHash('sha256').update(b).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
function save(name, value) {
  const target = resolve(out, name)
  assert(target.startsWith(`${out}/`))
  mkdirSync(dirname(target), { recursive: true, mode: 0o700 })
  writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
function inventory(root) {
  if (!existsSync(root)) return { missing: true }
  const result = {}
  function walk(p) {
    const s = lstatSync(p), key = relative(root, p) || '.'
    if (s.isSymbolicLink()) result[key] = { link: readlinkSync(p) }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else result[key] = { bytes: s.size, sha256: sha(readFileSync(p)) }
  }
  walk(root)
  return result
}
const allInputs = root => Object.fromEntries(inputs.map(p => [p, inventory(join(root, pkg, p))]))
function differences(a, b) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
    .filter(p => JSON.stringify(a[p]) !== JSON.stringify(b[p]))
}
function flat(map) {
  return Object.entries(map).flatMap(([root, records]) => Object.entries(records).map(([p, v]) => ({
    path: `${pkg}/${root}${p === '.' ? '' : `/${p}`}`, ...v,
  })))
}
function audit(root, compare) {
  const files = [], links = [], external = [], sharedInodes = []
  function walk(p) {
    const key = relative(root, p), s = lstatSync(p)
    if (s.isSymbolicLink()) {
      const target = realpathSync(p)
      links.push({ path: key, target: relative(root, target) })
      if (!target.startsWith(`${root}/`)) external.push({ path: key, target })
    } else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else {
      files.push({ path: key, bytes: s.size, sha256: sha(readFileSync(p)) })
      if (compare && existsSync(join(compare, key))) {
        const old = statSync(join(compare, key))
        if (s.dev === old.dev && s.ino === old.ino) sharedInodes.push(key)
      }
    }
  }
  walk(root)
  return { files, links, external, sharedInodes }
}
function sharedGovernance() {
  return Object.fromEntries(readdirSync('/private/tmp').filter(n => n.startsWith('governance-case-')).sort()
    .map(n => [n, inventory(join('/private/tmp', n))]))
}
function testingListing() {
  return readdirSync(join(repo, 'docs/testing')).filter(n => !n.startsWith(prefix)).sort()
}
function protection() {
  const before = json(join(out, 'protected-before.json'))
  const protectedDrift = Object.keys(before).filter(p =>
    JSON.stringify(inventory(p)) !== JSON.stringify(before[p]))
  const frozenDrift = differences(json(join(out, 'frozen-before.json')), allInputs(frozen))
  const fixturesDrift = ['docs/testing', 'upstream'].filter(p =>
    JSON.stringify(inventory(join(frozen, p))) !== JSON.stringify(json(join(out, 'fixtures-before.json'))[p]))
  const ownDeps = audit(deps, depsSource)
  const dependenciesUnchanged = JSON.stringify(ownDeps) === JSON.stringify(json(join(out, 'dependencies-before.json')))
  const current = allInputs(repo), mainBefore = json(join(out, 'main-before.json'))
  const concurrentInputChanges = inputs.flatMap(root => differences(mainBefore[root], current[root])
    .map(p => `${pkg}/${root}${p === '.' ? '' : `/${p}`}`))
  const sharedGovernanceChanges = differences(json(join(out, 'shared-governance-before.json')), sharedGovernance())
  const otherTesting = testingListing(), oldTesting = json(join(out, 'other-testing-before.json'))
  return { protectedDrift, frozenDrift, fixturesDrift, dependenciesUnchanged,
    external: ownDeps.external, sharedInodes: ownDeps.sharedInodes, sharedGovernanceChanges,
    concurrentInputChanges, otherTestingAdded: otherTesting.filter(n => !oldTesting.includes(n)),
    otherTestingRemoved: oldTesting.filter(n => !otherTesting.includes(n)),
    concurrentPolicy: 'Unrelated lawful successors are recorded, not locked or classified as contamination.',
    ok: !protectedDrift.length && !frozenDrift.length && !fixturesDrift.length
      && dependenciesUnchanged && !ownDeps.external.length && !ownDeps.sharedInodes.length
      && !sharedGovernanceChanges.length }
}
if (stage === 'freeze') {
  assert(!existsSync(out), 'Existing independent round must not be overwritten')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  const delivery = json(join(dev, 'handoff/delivery.json'))
  assert(delivery.released && delivery.stop && delivery.developerSelfTestOnly)
  const evidenceIndex = json(join(dev, 'handoff/evidence-index.json'))
  for (const [p, v] of Object.entries(evidenceIndex))
    assert.deepEqual(inventory(join(dev, 'handoff', p)), v)
  const manifest = json(join(dev, 'handoff/complete-plugin-inputs.json'))
  assert.equal(manifest.length, 973)
  assert.deepEqual(flat(allInputs(source)), manifest)
  const cycle = json(join(repo, 'reports/all-pending-evidence-20261021/CycleFeedbackDevR1/handoff/complete-input-files.json'))
  const nonLib = manifest.filter(p => !p.path.startsWith(`${pkg}/lib/`))
  const cycleMap = Object.fromEntries(cycle.map(({ path, bytes, sha256 }) => [path, { bytes, sha256 }]))
  const nonLibMap = Object.fromEntries(nonLib.map(({ path, bytes, sha256 }) => [path, { bytes, sha256 }]))
  const added = Object.keys(nonLibMap).filter(p => !cycleMap[p])
  const removed = Object.keys(cycleMap).filter(p => !nonLibMap[p])
  const changed = Object.keys(cycleMap).filter(p => nonLibMap[p]
    && JSON.stringify(cycleMap[p]) !== JSON.stringify(nonLibMap[p]))
  assert.equal(cycle.length, 509)
  assert.equal(nonLib.length, 510)
  assert.deepEqual(added, [newTest])
  assert.deepEqual(removed, [])
  assert.deepEqual(changed, [product])
  save('input-count-reconciliation.json', { cycleWithoutLib: cycle.length, terminalWithoutLib: nonLib.length,
    terminalLib: manifest.length - nonLib.length, terminalComplete: manifest.length,
    roots: Object.fromEntries(inputs.map(p => [p, Object.keys(allInputs(source)[p]).length])),
    tests: manifest.filter(p => /\.test\.tsx?$/.test(p.path)).length, added, removed, changed,
    conclusion: '973 = 509 + 1 new test + 463 unchanged compiled files; counts are different scopes, not contamination.' })
  const old = json(join(dev, 'red/main-inputs.json')), repaired = allInputs(source)
  const delta = inputs.flatMap(root => differences(old[root], repaired[root])
    .map(p => `${pkg}/${root}${p === '.' ? '' : `/${p}`}`)).sort()
  assert.deepEqual(delta, [newTest, product].sort())
  const successor = json(join(dev, 'handoff/successor106.json'))
  const parentLines = readFileSync(join(repo, 'reports/all-pending-evidence-20261021/CycleFeedbackDevR1/handoff/successor104.sha256'), 'utf8')
    .trim().split('\n').map(s => /^([a-f0-9]{64})  (.+)$/.exec(s))
  assert.equal(successor.length, 106)
  assert.equal(parentLines.length, 104)
  for (const m of parentLines) {
    assert(m)
    assert(successor.some(s => s.path === m[2] && s.sha256 === m[1]))
  }
  for (const p of json(join(dev, 'handoff/increment-files.json'))) {
    assert.equal(sha(readFileSync(join(source, p.path))), p.sha256)
    assert.equal(sha(readFileSync(join(repo, p.path))), p.sha256)
  }
  assert.equal(sha(readFileSync(join(dev, 'handoff/increment.patch'))), delivery.patchSha256)
  const watched = Object.keys(json(join(dev, 'red/protected-before.json')))
  const originalDevCount = watched.length
  watched.push(join(dev, 'handoff'), join(dev, 'facility-followup.json'), join(dev, 'developer-report.md'),
    join(dev, 'run.mjs'), join(repo, product), join(repo, newTest), fileURLToPath(import.meta.url))
  for (const round of ['red', 'testred', 'repaired', 'repaired-r2', 'repaired-r3']) {
    const root = join(dev, round)
    for (const n of readdirSync(root))
      if (lstatSync(join(root, n)).isFile()) watched.push(join(root, n))
    for (const p of [product, newTest]) if (existsSync(join(root, 'frozen', p))) watched.push(join(root, 'frozen', p))
  }
  watched.push(join(source, 'upstream'), depsSource)
  save('protected-before.json', Object.fromEntries([...new Set(watched)].map(p => [p, inventory(p)])))
  save('main-before.json', allInputs(repo))
  save('shared-governance-before.json', sharedGovernance())
  save('other-testing-before.json', testingListing())
  for (const p of inputs) cpSync(join(source, pkg, p), join(frozen, pkg, p),
    { recursive: true, preserveTimestamps: true, force: false, errorOnExist: true })
  assert.deepEqual(allInputs(frozen), repaired)
  save('frozen-before.json', allInputs(frozen))
  const sourceAudit = audit(depsSource)
  assert.deepEqual(sourceAudit.external, [])
  function copyDeps(p) {
    const target = join(deps, relative(depsSource, p)), s = lstatSync(p)
    if (s.isSymbolicLink()) {
      const resolved = realpathSync(p)
      assert(resolved.startsWith(`${depsSource}/`))
      symlinkSync(relative(dirname(target), join(deps, relative(depsSource, resolved))), target)
    } else if (s.isDirectory()) {
      mkdirSync(target, { recursive: true, mode: 0o700 })
      for (const n of readdirSync(p).sort()) copyDeps(join(p, n))
    } else copyFileSync(p, target, constants.COPYFILE_EXCL)
  }
  copyDeps(depsSource)
  const ownDeps = audit(deps, depsSource)
  assert.deepEqual(ownDeps.files, sourceAudit.files)
  assert.deepEqual(ownDeps.links, sourceAudit.links)
  assert.deepEqual(ownDeps.external, [])
  assert.deepEqual(ownDeps.sharedInodes, [])
  save('dependencies-before.json', ownDeps)
  symlinkSync(relative(frozen, deps), join(frozen, 'node_modules'))
  for (const p of ['docs/testing', 'upstream']) cpSync(join(source, p), join(frozen, p),
    { recursive: true, preserveTimestamps: true, force: false, errorOnExist: true })
  assert.equal(sha(readFileSync(join(frozen, cases))), 'f5d9f47a8e007f206e2c0534bb0ded4c2b9c686fd949d37b1d74ff27b8413ed9')
  assert.deepEqual(inventory(join(frozen, cases)), inventory(join(original, 'frozen', cases)))
  save('fixtures-before.json', Object.fromEntries(['docs/testing', 'upstream'].map(p => [p, inventory(join(frozen, p))])))
  for (const p of ['home', 'tmp', 'cache', 'runtime', 'files', 'backups', 'exports']) mkdirSync(join(out, p), { mode: 0o700 })
  save('vitest.config.mjs', `export default ${JSON.stringify({ root: frozen, cacheDir: join(out, 'cache/vite'),
    test: { environment: 'node', cache: false, include: [cases, newTest, ...affected],
      pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1,
      testTimeout: 20000 } }, null, 2)}\n`)
  save('candidate.json', { at: new Date().toISOString(), role: 'independent-source-auto-retest-not-developer',
    baselineCommit: delivery.baselineCommit, baselineProvenance: 'Read-only original r2 and development handoff; no Git command',
    developerDelivery: join(dev, 'handoff/delivery.json'), developerDeliverySha256: sha(readFileSync(join(dev, 'handoff/delivery.json'))),
    parentDeclarations: 104, successorDeclarations: 106, successorManifestSha256: sha(readFileSync(join(dev, 'handoff/successor106.json'))),
    inputFiles: manifest.length, source, frozen, delta, originalDevProtectedObjects: originalDevCount,
    protectedObjects: [...new Set(watched)].length, patchSha256: delivery.patchSha256,
    productSha256: sha(readFileSync(join(frozen, product))), newTestSha256: sha(readFileSync(join(frozen, newTest))),
    node: process.version, executable: process.execPath, platform: process.platform,
    versions: Object.fromEntries(['vitest', 'typescript', '@deepseek-ai/dsh-llm', '@deepseek-ai/cordis', '@earendil-works/pi-ai']
      .map(p => [p, json(join(deps, p, 'package.json')).version])),
    dependencyFiles: ownDeps.files.length, dependencyLinks: ownDeps.links.length,
    runtimeBinding: 'SOURCE only; old U4r2/3257/3258 not newly loaded or inspected',
    build: false, install: false, gui: false, fullVerify: false, coverage: false, services: false,
    git: false, credentials: false, networkModel: false })
  const check = protection()
  save('freeze-check.json', check)
  assert(check.ok)
  console.log(JSON.stringify({ stage, inputFiles: manifest.length, dependencyFiles: ownDeps.files.length,
    dependencyLinks: ownDeps.links.length, protection: check }))
} else if (stage === 'test') {
  assert(!existsSync(join(out, `${suite}.command.json`)))
  assert(protection().ok)
  const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), TMP: join(out, 'tmp'), TEMP: join(out, 'tmp'),
    XDG_CACHE_HOME: join(out, 'cache'), XDG_CONFIG_HOME: join(out, 'home/config'), XDG_DATA_HOME: join(out, 'home/data'),
    DSH_HOME: join(out, 'runtime'), PM_GOVERNANCE_TMP: join(out, 'tmp'), PM_FILE_ATOMIC_TMP: join(out, 'tmp'),
    DSH_PM_FILE_ROOT: join(out, 'files'), DSH_PM_BACKUP_DIR: join(out, 'backups'), DSH_PM_EXPORT_DIR: join(out, 'exports'),
    CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1',
    ATF_OBSERVATIONS: join(out, `${suite}.observations.ndjson`) }
  let argv
  if (suite === 'legacy-source') {
    const text = readFileSync(join(frozen, pkg, 'scripts/verify-ai-client.mjs'), 'utf8')
    assert.equal(text.split('../lib/core/ai-client.js').length, 2)
    const copy = text.replace('../lib/core/ai-client.js', './frozen/packages/dsh-pm-tool/src/core/ai-client.ts')
    save('legacy-source.mjs', copy)
    save('legacy-source-adapter.json', { onlyChange: 'import ../lib/core/ai-client.js -> frozen source',
      originalSha256: sha(text), adapterSha256: sha(copy), assertionsUnchanged: true,
      limitation: 'Unmodified legacy mock gateway tests compatibility only, never production terminal protocol.' })
    argv = [process.execPath, '--experimental-strip-types', join(out, 'legacy-source.mjs')]
  } else if (suite === 'noemit') {
    argv = [process.execPath, join(deps, 'typescript/bin/tsc'), '-p', join(frozen, pkg, 'tsconfig.json'), '--noEmit']
  } else {
    const paths = suite === 'new' ? [newTest] : suite === 'affected' ? affected : [cases]
    argv = [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', ...paths,
      '--config', join(out, 'vitest.config.mjs'), '--no-cache', '--reporter=verbose', '--reporter=json',
      '--outputFile', join(out, `${suite}.result.json`)]
    if (suite === 'controls' || suite === 'original-red')
      argv.push('--testNamePattern', suite === 'controls' ? '^controls:' : '^necessary-red:')
  }
  const start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd: frozen, env, encoding: 'utf8',
    timeout: 120000, maxBuffer: 32 * 1024 * 1024 })
  save(`${suite}.stdout.log`, r.stdout ?? '')
  save(`${suite}.stderr.log`, r.stderr ?? '')
  save(`${suite}.command.json`, { argv, cwd: frozen, env, start, end: new Date().toISOString(),
    pid: r.pid, originalExit: r.status, signal: r.signal, error: r.error?.message ?? null })
  const report = existsSync(join(out, `${suite}.result.json`)) ? json(join(out, `${suite}.result.json`)) : null
  const assertions = report?.testResults.flatMap(t => t.assertionResults) ?? []
  const expected = { controls: [8, 0, 10], 'original-red': [10, 0, 8], new: [43, 0, 0], affected: [175, 0, 0] }[suite]
  const countsMatch = !expected || JSON.stringify([report?.numPassedTests, report?.numFailedTests, report?.numPendingTests])
    === JSON.stringify(expected)
  const check = protection()
  const summary = { suite, originalExit: r.status, signal: r.signal, passed: report?.numPassedTests ?? null,
    failed: report?.numFailedTests ?? null, pending: report?.numPendingTests ?? null,
    testFiles: report?.numTotalTestSuites ?? null, expected, countsMatch,
    failures: assertions.filter(a => a.status === 'failed'), protection: check,
    verdict: r.status === 0 && check.ok && countsMatch ? 'PASS_LIMITED_AUTO' : 'FAIL_OR_BLOCKED',
    guiSigned: false, wholeFeatureSigned: false, release: 'STOP' }
  save(`${suite}.summary.json`, summary)
  console.log(JSON.stringify({ suite, originalExit: r.status, passed: summary.passed, failed: summary.failed,
    pending: summary.pending, countsMatch, protection: check }))
  process.exitCode = check.ok && countsMatch ? r.status ?? 1 : 2
} else {
  assert(!existsSync(join(out, 'close.json')))
  const check = protection()
  const results = suites.map(s => json(join(out, `${s}.summary.json`)))
  const processes = suites.map(s => {
    const command = json(join(out, `${s}.command.json`))
    const ps = spawnSync('/bin/ps', ['-p', String(command.pid), '-o', 'pid=,ppid=,command='],
      { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } })
    return { suite: s, pid: command.pid, originalExit: command.originalExit, psExit: ps.status,
      stdout: ps.stdout, stderr: ps.stderr, exited: ps.status === 1 && !ps.stdout.trim() }
  })
  const released = check.ok && processes.every(p => p.exited)
  save('close.json', { at: new Date().toISOString(), protection: check, processes, released, stop: true,
    results: results.map(({ suite, originalExit, passed, failed, pending, verdict }) =>
      ({ suite, originalExit, passed, failed, pending, verdict })),
    verdict: released && results.every(r => r.verdict === 'PASS_LIMITED_AUTO') ? 'PASS_LIMITED_SOURCE_AUTO' : 'FAIL_OR_BLOCKED',
    gui: 'NOT_RUN_MAIN_PENDING', totalGate: 'NOT_SIGNED', release: 'STOP',
    facilityHistory: 'Developer r2 13 outside tmp roots retained; r3 rerun and independent r1 do not erase them.' })
  save('owned-runtime-roots.json', Object.fromEntries(['home', 'tmp', 'cache', 'runtime', 'files', 'backups', 'exports']
    .map(p => [p, inventory(join(out, p))])))
  save('sealed-evidence.json', Object.fromEntries(readdirSync(out).filter(p => lstatSync(join(out, p)).isFile()).sort()
    .map(p => [p, inventory(join(out, p))])))
  console.log(JSON.stringify(json(join(out, 'close.json'))))
  process.exitCode = released && results.every(r => r.verdict === 'PASS_LIMITED_AUTO') ? 0 : 2
}

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a18-feedback-context-independent-retest-20261022'
const testing = join(repo, 'docs/testing'), base = join(testing, `${prefix}-selftmp`)
const developer = join(repo, 'reports/a18-feedback-error-context-developer-20261022-selftmp')
const tf = 'a17-transport-feedback-contract-20261022'
const expert = 'a17-transport-feedback-independent-retest-20261022'
const a16 = 'a16-extension-base-independent-retest-20261022'
const a15 = 'a15-preconfirm-independent-retest-20261022'
const pkg = 'packages/dsh-pm-tool'
const inputs = ['src', 'scripts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
const allowed = ['client/panel.tsx', 'client/result-card.tsx', 'core/ui-feedback.ts',
  'client/panel-transport-error-feedback.test.tsx', 'client/result-card.test.ts', 'core/ui-feedback.test.ts'].sort()
const deps = '/private/tmp/pmtool-a14-closure-20261022/packages/dsh-pm-tool/node_modules'
const [stage, round] = process.argv.slice(2)
assert(['freeze', 'original', 'adapted', 'final'].includes(stage))
assert.match(round, /^r[1-9]\d*$/)
const out = join(base, round), frozen = join(out, 'frozen')
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(p) {
    const s = lstatSync(p), key = relative(root, p) || '.'
    if (s.isSymbolicLink()) result[key] = { link: readlinkSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else result[key] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(root)
  return result
}
const content = m => Object.fromEntries(Object.entries(m).map(([k, v]) =>
  [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const source = root => Object.fromEntries(inputs.map(n => [n, inventory(join(root, pkg, n))]))
function save(name, value, target = out) {
  const p = resolve(target, name)
  assert(p.startsWith(`${base}/`), 'only own evidence')
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
  DSH_HOME: join(out, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1' }
const commands = []
function command(id, argv, cwd = frozen, e = env, target = out) {
  const start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd, env: e, encoding: 'utf8', timeout: 240000, maxBuffer: 128 * 1024 * 1024 })
  save(`${id}.stdout.log`, r.stdout ?? '', target)
  save(`${id}.stderr.log`, r.stderr ?? '', target)
  const c = { id, argv, cwd, env: e, start, end: new Date().toISOString(), pid: r.pid,
    originalExit: r.status, signal: r.signal, error: r.error?.message ?? null }
  save(`${id}.command.json`, c, target)
  commands.push(c)
  console.log(JSON.stringify({ id, exit: r.status, signal: r.signal }))
  return r
}
const assertions = dir => read(join(dir, 'independent-counterexamples.result.json')).testResults.flatMap(t => t.assertionResults)
const names = (dir, id) => read(join(dir, `${id}.result.json`)).testResults.flatMap(t => t.assertionResults)
  .filter(t => t.status === 'passed' || t.status === 'failed').map(t => t.fullName).sort()
const actualA16 = read(join(repo, 'reports/all-pending-evidence-20261021/A16/candidate.json'))
function a16Drift() {
  return Object.entries({ ...actualA16.sourceHashes, ...actualA16.artifacts }).filter(([p, hash]) =>
    !existsSync(join(actualA16.tree, p)) || sha(readFileSync(join(actualA16.tree, p))) !== hash).map(([p]) => p)
}
function originalAudit() {
  const result = { sealed: [], commands: [], inheritedAudit: [], sourceDeltas: {}, failures: [] }
  const rounds = ['before-r1', 'before-r2', 'after-r1', 'after-r2']
  const prior = join(testing, `${expert}-selftmp`)
  for (const [root, r, final] of [
    ...rounds.map(r => [developer, r, `final-${r}`]), [prior, 'r1', 'final-r1'],
  ]) {
    const dir = join(root, r)
    assert.deepEqual(inventory(dir), read(join(root, final, 'own-output-inventory.json')), `sealed ${dir}`)
    assert.equal(read(join(root, final, 'final.json')).released, true)
    result.sealed.push({ dir, hashBytesMtimeSame: true })
    const summary = read(join(dir, 'summary.json'))
    for (const c of read(join(dir, 'commands.json'))) {
      assert.deepEqual(c, read(join(dir, `${c.id}.command.json`)))
      const s = summary.results.find(s => s.id === c.id)
      assert.equal(c.originalExit, s.originalExit)
      for (const n of ['stdout', 'stderr'])
        assert.equal(sha(readFileSync(join(dir, `${c.id}.${n}.log`))), s[`${n}Sha256`])
      if (s.reporterSha256) {
        const bytes = readFileSync(join(dir, `${c.id}.result.json`)), report = JSON.parse(bytes)
        assert.equal(sha(bytes), s.reporterSha256)
        assert.equal(report.numPassedTests, s.passed); assert.equal(report.numFailedTests, s.failed)
        for (const t of report.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'failed'))
          result.failures.push({ dir, id: c.id, name: t.fullName, failureMessages: t.failureMessages })
      }
      result.commands.push({ dir, id: c.id, exit: c.originalExit, passed: s.passed, failed: s.failed })
    }
  }
  const inherited = read(join(prior, 'r1/original-audit.json'))
  for (const item of inherited.reviewed) {
    const d = item.id === 'noemit'
      ? resolve(dirname(item.argv[item.argv.indexOf('--project') + 1]), '../../..')
      : dirname(item.argv[item.argv.indexOf('--outputFile') + 1])
    assert.equal(sha(readFileSync(join(d, `${item.id}.command.json`))), item.commandSha256)
    for (const n of ['stdout', 'stderr']) assert.equal(sha(readFileSync(join(d, `${item.id}.${n}.log`))), item.logs[n])
    if (item.reporterSha256) assert.equal(sha(readFileSync(join(d, `${item.id}.result.json`))), item.reporterSha256)
    result.inheritedAudit.push({ dir: d, id: item.id, exit: item.originalExit, verified: true })
  }
  for (const r of rounds) {
    const dir = join(developer, r)
    const manifest = read(join(dir, 'frozen-inputs.json'))
    for (const n of inputs) assert.deepEqual(inventory(join(dir, 'frozen', pkg, n)), manifest[n])
    const report = read(join(dir, 'independent-counterexamples20.result.json'))
    assert.deepEqual([report.numPassedTests, report.numFailedTests], [19, 1])
    assert.equal(read(join(dir, 'independent-counterexamples20.command.json')).originalExit, 1)
  }
  for (const [r, exit, passed, failed] of [['before-r2', 1, 0, 13], ['after-r1', 0, 13, 0], ['after-r2', 0, 16, 0]]) {
    const dir = join(developer, r), report = read(join(dir, 'developer-a18-context.result.json'))
    assert.deepEqual([read(join(dir, 'developer-a18-context.command.json')).originalExit,
      report.numPassedTests, report.numFailedTests], [exit, passed, failed])
  }
  assert.deepEqual(names(join(developer, 'before-r2'), 'developer-a18-context'), names(join(developer, 'after-r1'), 'developer-a18-context'))
  const original13 = names(join(developer, 'after-r1'), 'developer-a18-context')
  const final16 = names(join(developer, 'after-r2'), 'developer-a18-context')
  assert(original13.every(n => final16.includes(n)))
  const original65 = names(join(prior, 'r1'), 'existing-regression65')
  const final72 = names(join(developer, 'after-r2'), 'existing-regression65')
  assert.equal(original65.length, 65); assert.equal(final72.length, 72)
  assert(original65.every(n => final72.includes(n)))
  const tfOld = join(testing, `${tf}-selftmp/r2`)
  assert.equal(read(join(tfOld, 'necessary-red.command.json')).originalExit, 1)
  const oldFive = names(tfOld, 'necessary-red')
  assert.equal(oldFive.length, 5)
  assert.deepEqual(oldFive, names(join(developer, 'after-r2'), 'original-five-retest'))
  assert.deepEqual(oldFive, names(join(prior, 'r1'), 'original-five-retest'))
  const fail = assertions(join(prior, 'r1')).filter(t => t.status === 'failed')
  assert.equal(fail.length, 1); assert(fail[0].fullName.startsWith('TF-X08 '))
  assert(fail[0].failureMessages[0].includes("expected undefined to be 'alert'"))
  const early = read(join(developer, 'before-r1/source-at-freeze.json'))
  const late = read(join(developer, 'after-r2/source-at-freeze.json'))
  assert.deepEqual(diff(content(early.src), content(late.src)), allowed)
  for (const n of inputs.filter(n => n !== 'src')) assert.deepEqual(content(early[n]), content(late[n]))
  for (const r of rounds) {
    const m = read(join(developer, r, 'source-at-freeze.json'))
    result.sourceDeltas[r] = diff(content(early.src), content(m.src))
  }
  const close = read(join(developer, 'close-r1/close.json'))
  assert.equal(close.released, true); assert.deepEqual(close.protectedDrift, {})
  assert.equal(close.allOldOutputHashMtimeUnchanged, true)
  result.original13 = original13; result.final16 = final16; result.original65 = original65; result.final72 = final72
  result.oldFive = oldFive; result.a16Drift = a16Drift()
  assert.deepEqual(result.a16Drift, [])
  return result
}
function checks() {
  const before = read(join(out, 'protected-before.json'))
  const after = Object.fromEntries(Object.keys(before).map(p => [p, inventory(p)]))
  const protectedDrift = Object.fromEntries(Object.keys(before).map(p => [p, diff(before[p], after[p])]).filter(([, d]) => d.length))
  const initial = read(join(out, 'source-at-freeze.json')), manifest = read(join(out, 'frozen-inputs.json'))
  const sourceDrift = Object.fromEntries(inputs.map(n => [n, diff(initial[n], inventory(join(repo, pkg, n)))]).filter(([, d]) => d.length))
  const frozenDrift = Object.fromEntries(inputs.map(n => [n, diff(manifest[n], inventory(join(frozen, pkg, n)))]).filter(([, d]) => d.length))
  const copiedDrift = diff(read(join(out, 'copied-tests.json')), inventory(join(frozen, 'docs/testing')))
  const declaredA16Drift = a16Drift()
  return { after, protectedDrift, sourceDrift, frozenDrift, copiedDrift, declaredA16Drift,
    protectionOk: !Object.keys(protectedDrift).length && !Object.keys(sourceDrift).length &&
      !Object.keys(frozenDrift).length && !copiedDrift.length && !declaredA16Drift.length }
}
function test(id, files, pattern) {
  command(id, [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', ...files, '--config', join(out, 'vitest.config.mjs'),
    '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(out, `${id}.result.json`),
    ...(pattern ? ['--testNamePattern', pattern] : [])], frozen,
  { ...env, TF_INPUT: join(out, 'replay-input.json'), TF_OBSERVATIONS: join(out, `${id}.observations.jsonl`),
    PC_INPUT: join(out, 'pc-replay-input.json'), PC_OBSERVATIONS: join(out, `${id}.pc-observations.jsonl`) })
}
const local = paths => paths.map(n => `${pkg}/src/${n}`)
const regression = local(['core/ui-feedback.test.ts', 'client/result-card.test.ts', 'client/result-card-copy.test.ts',
  'client/panel-checklist-toggle.test.tsx', 'client/panel-launch-handshake.test.tsx', 'client/launch-handshake.test.ts'])
const a18files = local(['client/panel-transport-error-feedback.test.tsx', 'client/result-card.test.ts', 'core/ui-feedback.test.ts'])
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const exactNames = list => `^(?:${list.map(escape).join('|')})$`
if (stage === 'freeze') {
  assert(!existsSync(out), 'never overwrite a failure or sealed round')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n), { mode: 0o700 })
  const roots = [...new Set([
    ...Object.keys(read(join(developer, 'after-r2/protected-before.json'))),
    developer, ...readdirSync(join(repo, 'reports')).filter(n => n.startsWith('a18-feedback-error-context-developer-20261022'))
      .map(n => join(repo, 'reports', n)),
    ...readdirSync(testing).filter(n => n.startsWith(prefix) && !n.endsWith('-selftmp')).map(n => join(testing, n)),
    realpathSync(deps), realpathSync(join(repo, pkg, 'node_modules')),
  ])].sort()
  save('protected-before.json', Object.fromEntries(roots.map(p => [p, inventory(p)])))
  save('original-audit.json', originalAudit())
  const current = source(repo), latest = read(join(developer, 'after-r2/source-at-freeze.json'))
  for (const n of inputs) assert.deepEqual(content(current[n]), content(latest[n]), 'whole current source equals released developer')
  save('source-at-freeze.json', current)
  const git = (id, args) => {
    const r = command(id, ['/usr/bin/git', ...args], repo, { ...env, GIT_OPTIONAL_LOCKS: '0' })
    assert.equal(r.status, 0, r.stderr); return r.stdout
  }
  const head = git('git-head', ['rev-parse', 'HEAD']).trim(), originMain = git('git-origin', ['rev-parse', 'origin/main']).trim()
  const patch = git('git-tracked', ['diff', '--binary', 'HEAD', '--', pkg])
  save('candidate-tracked.patch', patch)
  const newPaths = git('git-new', ['ls-files', '--others', '--exclude-standard', '--', ...inputs.map(n => `${pkg}/${n}`)])
    .trim().split('\n').filter(Boolean).sort()
  save('candidate-new-inputs.json', newPaths.map(path => ({ path, ...inventory(join(repo, path))['.'] })))
  save('candidate-status.txt', git('git-status', ['status', '--short', '--branch', '--', pkg]))
  for (const n of inputs) cpSync(join(repo, pkg, n), join(frozen, pkg, n), { recursive: true, preserveTimestamps: true })
  const manifest = source(frozen)
  for (const n of inputs) assert.deepEqual(content(manifest[n]), content(current[n]))
  save('frozen-inputs.json', manifest)
  for (const n of allowed) {
    const r = command(`delta-${n.replaceAll('/', '_')}`, ['/usr/bin/diff', '-u',
      join(developer, 'before-r1/frozen', pkg, 'src', n), join(frozen, pkg, 'src', n)], repo)
    assert.equal(r.status, 1)
  }
  const beforeCore = readFileSync(join(developer, 'before-r1/frozen', pkg, 'src/core/ui-feedback.ts'), 'utf8')
  const afterCore = readFileSync(join(frozen, pkg, 'src/core/ui-feedback.ts'), 'utf8')
  assert.equal(afterCore.slice(afterCore.indexOf('  const parsed = parseFeedback(message)')),
    beforeCore.slice(beforeCore.indexOf('  const parsed = parseFeedback(message)')), 'all default branch bytes retained')
  for (const n of [`${tf}-cases.test.tsx`, `${expert}-cases.test.tsx`, `${a16}-cases.test.tsx`,
    `${a16}-pc-cases.test.tsx`, `${a15}-cases.test.tsx`, `${a15}-expansion.test.tsx`,
    'a14-preconfirm-conflict-contract-20261022-cases.test.tsx', 'board-fixture-clarification-20261021-fixture.json',
    `${prefix}-cases.test.tsx`]) {
    cpSync(join(testing, n), join(frozen, 'docs/testing', n), { preserveTimestamps: true })
    assert.equal(sha(readFileSync(join(testing, n))), sha(readFileSync(join(frozen, 'docs/testing', n))))
  }
  save('copied-tests.json', inventory(join(frozen, 'docs/testing')))
  save('replay-input.json', read(join(testing, `${tf}-selftmp/r2/replay-input.json`)))
  save('pc-replay-input.json', read(join(testing, `${a16}-selftmp/r1/replay-input.json`)))
  symlinkSync(deps, join(frozen, pkg, 'node_modules'), 'dir'); symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  save('vitest.config.mjs', `export default ${JSON.stringify({ root: frozen, cacheDir: join(out, 'cache/vite'),
    test: { environment: 'node', cache: false, include: ['docs/testing/*.test.tsx', `${pkg}/src/**/*.test.ts`, `${pkg}/src/**/*.test.tsx`],
      pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000 } }, null, 2)}\n`)
  save('acquisition-commands.json', commands)
  save('candidate.json', { head, originMain, frozen, sourceTree: repo, sourceCount: Object.keys(manifest.src).length,
    completeInputs: inputs, manifestSha256: sha(readFileSync(join(out, 'frozen-inputs.json'))), patchSha256: sha(patch),
    newInputsSha256: sha(readFileSync(join(out, 'candidate-new-inputs.json'))), approvedDelta: allowed,
    environment: { node: process.version, executable: process.execPath, os: os.release(), arch: os.arch() },
    dependencies: Object.fromEntries(['react', 'react-test-renderer', 'vitest', 'vite', 'typescript', 'lucide-react', 'zod', 'xlsx']
      .map(n => {
        const packagePath = n === 'vite'
          ? createRequire(join(realpathSync(join(deps, 'vitest')), 'package.json')).resolve('vite/package.json')
          : join(deps, n, 'package.json')
        return [n, { root: dirname(realpathSync(packagePath)), version: read(packagePath).version }]
      })),
    protectedRoots: roots.length, a16Tree: actualA16.tree, a16Drift: a16Drift(), instance3247NotAccessed: true,
    mainGrowthEvidenceExcluded: true, build: false, gui: false, services: false, commit: false })
  console.log(JSON.stringify({ stage, sourceCount: Object.keys(manifest.src).length, protectedRoots: roots.length }))
} else if (stage === 'original') {
  assert(!existsSync(join(out, 'original-commands.json')))
  assert.equal(checks().protectionOk, true)
  test('original-counterexamples20', [`docs/testing/${expert}-cases.test.tsx`])
  save('original-commands.json', commands)
  const r = read(join(out, 'original-counterexamples20.result.json'))
  save('original-verdict.json', { exit: commands[0].originalExit, passed: r.numPassedTests, failed: r.numFailedTests,
    failures: r.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'failed'), verdict: 'FAIL' })
  process.exitCode = commands[0].originalExit ?? 1
} else if (stage === 'adapted') {
  assert(!existsSync(join(out, 'commands.json')))
  assert.equal(checks().protectionOk, true)
  const red = read(join(out, 'original-verdict.json'))
  assert.deepEqual([red.exit, red.passed, red.failed], [1, 19, 1])
  assert(red.failures[0].fullName.startsWith('TF-X08 '))
  assert(red.failures[0].failureMessages[0].includes('expected 3000 to be null'))
  const originalPath = join(frozen, `docs/testing/${expert}-cases.test.tsx`)
  const old = readFileSync(originalPath, 'utf8')
  const needle = 'expect(classifyFeedback(card().props.message).autoDismissMs).toBeNull()'
  const replacement = 'expect(classifyFeedback(card().props.message, card().props.context).autoDismissMs).toBeNull()'
  assert.equal(old.split(needle).length, 2)
  const adapted = old.replace(needle, replacement)
  assert.equal(adapted.replace(replacement, needle), old, 'all other oracle bytes remain exact')
  const adaptedName = `${prefix}-adapter.test.tsx`
  save(adaptedName, adapted, join(frozen, 'docs/testing'))
  save('adapter-original.test.tsx', old)
  const d = command('adapter-diff', ['/usr/bin/diff', '-u', originalPath, join(frozen, 'docs/testing', adaptedName)], repo)
  assert.equal(d.status, 1)
  save('adapter-contract.json', { originalSha256: sha(old), adapterSha256: sha(adapted), originalLine: 60,
    onlyChange: { needle, replacement }, otherBytesIdentical: true, noAssertionsRemoved: true,
    rationale: 'Approved default string success remains; TTL must use actual ResultCard context, not a new inferred string policy.',
    originalResultRemains: red })
  save('adapted-tests.json', inventory(join(frozen, 'docs/testing')))
  test('adapter-counterexamples20', [`docs/testing/${adaptedName}`])
  test('independent-context-counterexamples', [`docs/testing/${prefix}-cases.test.tsx`])
  const file = `docs/testing/${tf}-cases.test.tsx`
  test('success-control', [file], '^TF-C0[12] ')
  test('explicit-context-control', [file], '^TF-C03 ')
  test('original-five-retest', [file], '^TF-F01 ')
  test('recovery-control', [file], '^TF-C04 ')
  const audit = read(join(out, 'original-audit.json'))
  test('original-a18-13', a18files, exactNames(audit.original13))
  test('developer-a18-16', a18files, 'A18 ')
  test('original-regression65', regression, exactNames(audit.original65))
  test('current-regression72', regression)
  test('developer-transport14', local(['client/panel-transport-error-feedback.test.tsx']), '^(?!A18 )')
  test('revised-pc4', [`docs/testing/${a16}-pc-cases.test.tsx`])
  test('expert-extension28', [`docs/testing/${a16}-cases.test.tsx`])
  test('parent-extension4', [`docs/testing/${a15}-expansion.test.tsx`])
  test('independent23', [`docs/testing/${a15}-cases.test.tsx`])
  test('developer-extension23', local(['client/copilot-extension-baseline.test.tsx']))
  test('affected-regression87', local(['client/shared/drawers/copilot-preconfirm.test.tsx', 'client/sidecar-minimize-retention.test.tsx',
    'client/panel-checklist-toggle.test.tsx', 'client/panel-launch-handshake.test.tsx', 'client/provenance-panel.test.tsx',
    'client/shared/task-draft-materials-stage.test.tsx', 'core/copilot-validate.test.ts', 'core/copilot-task-fields.test.ts', 'core/ask-projection.test.ts']))
  test('panel-and-import-regression53', local(['client/panel-restore-path.test.ts', 'client/panel-cancel-close.test.ts',
    'client/views/tasks-import-confirm.test.tsx', 'client/views/tasks-number-feedback.test.tsx', 'client/views/records-entry-guard.test.ts',
    'client/views/reports-entry-guard.test.ts', 'client/shared/records-callbacks.test.ts', 'client/board/BoardBento-feedback.test.tsx']))
  command('noemit', [process.execPath, join(deps, 'typescript/bin/tsc'), '--project', join(frozen, pkg, 'tsconfig.json'),
    '--noEmit', '--incremental', 'false'], join(frozen, pkg))
  save('commands.json', commands)
  const results = commands.map(c => {
    const p = join(out, `${c.id}.result.json`), r = existsSync(p) ? read(p) : null
    return { ...c, passed: r?.numPassedTests, failed: r?.numFailedTests, pending: r?.numPendingTests,
      failedSuites: r?.numFailedTestSuites, reporterSha256: r ? sha(readFileSync(p)) : null,
      stdoutSha256: sha(readFileSync(join(out, `${c.id}.stdout.log`))), stderrSha256: sha(readFileSync(join(out, `${c.id}.stderr.log`))) }
  })
  const before = read(join(out, 'copied-tests.json')), now = inventory(join(frozen, 'docs/testing'))
  assert.deepEqual(diff(before, now), [adaptedName])
  const { after, copiedDrift, ...protection } = checks()
  assert.deepEqual(copiedDrift, [adaptedName])
  protection.protectionOk = !Object.keys(protection.protectedDrift).length && !Object.keys(protection.sourceDrift).length &&
    !Object.keys(protection.frozenDrift).length && !protection.declaredA16Drift.length
  save('protected-after.json', after)
  const testsAllZero = results.filter(c => c.id !== 'adapter-diff').every(c => c.originalExit === 0 && !c.signal && !c.error)
  save('summary.json', { results, ...protection, testsAllZero, original20Verdict: 'FAIL preserved',
    finiteAutomaticPass: protection.protectionOk && testsAllZero, build: false, gui: false, wholeGateSigned: false, commit: false })
  console.log(JSON.stringify({ protectionOk: protection.protectionOk,
    results: results.map(r => ({ id: r.id, exit: r.originalExit, passed: r.passed, failed: r.failed, pending: r.pending })) }))
  process.exitCode = protection.protectionOk && testsAllZero ? 0 : 1
} else {
  const final = join(base, `final-${round}`)
  assert(!existsSync(final))
  const { after, copiedDrift, ...protection } = checks()
  assert.deepEqual(inventory(join(frozen, 'docs/testing')), read(join(out, 'adapted-tests.json')))
  assert.deepEqual(copiedDrift, [`${prefix}-adapter.test.tsx`])
  protection.protectionOk = !Object.keys(protection.protectedDrift).length && !Object.keys(protection.sourceDrift).length &&
    !Object.keys(protection.frozenDrift).length && !protection.declaredA16Drift.length
  save('protected-after.json', after, final)
  save('original-audit-final.json', originalAudit(), final)
  const cs = [...read(join(out, 'acquisition-commands.json')), ...read(join(out, 'original-commands.json')), ...read(join(out, 'commands.json'))]
  const pids = [...new Set(cs.map(c => c.pid).filter(Boolean))]
  const ps = command('process-check', ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command='], repo, env, final)
  const noRecordedChildren = ps.status === 1 && !ps.stdout.trim()
  save('own-output-inventory.json', inventory(out), final)
  save('runtime-write-roots.json', Object.fromEntries(['home', 'tmp', 'cache', 'runtime'].map(n => [n, inventory(join(out, n))])), final)
  save('final.json', { ...protection, noRecordedChildren, released: protection.protectionOk && noRecordedChildren,
    finiteAutomaticPass: read(join(out, 'summary.json')).finiteAutomaticPass,
    original20Verdict: 'FAIL preserved', gui: 'BLOCKED / not signed, Main only', wholeGateSigned: false,
    build: false, services: false, commit: false, instance3247NotAccessed: true }, final)
  console.log(JSON.stringify({ ...protection, noRecordedChildren, released: protection.protectionOk && noRecordedChildren }))
  process.exitCode = protection.protectionOk && noRecordedChildren ? 0 : 1
}

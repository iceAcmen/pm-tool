import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a18-feedback-error-context-developer-20261022'
const base = join(repo, 'reports', `${prefix}-selftmp`)
const pkg = 'packages/dsh-pm-tool'
const inputs = ['src', 'scripts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
const testing = join(repo, 'docs/testing')
const tf = 'a17-transport-feedback-contract-20261022'
const expert = 'a17-transport-feedback-independent-retest-20261022'
const a16 = 'a16-extension-base-independent-retest-20261022'
const a15 = 'a15-preconfirm-independent-retest-20261022'
const deps = '/private/tmp/pmtool-a14-closure-20261022/packages/dsh-pm-tool/node_modules'
const [stage, round] = process.argv.slice(2)
assert(['freeze', 'run', 'final'].includes(stage))
assert.match(round, /^(before|after)-r[1-9]\d*$/)
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
const sourceNow = root => Object.fromEntries(inputs.map(n => [n, inventory(join(root, pkg, n))]))
function save(name, value, target = out) {
  const p = resolve(target, name)
  assert(p.startsWith(`${base}/`), 'A18 developer evidence only')
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
const originals = join(testing, `${expert}-selftmp/r1`)
const inheritedRoots = Object.keys(read(join(originals, 'protected-before.json')))
const roots = [...new Set([
  ...inheritedRoots, ...inputs.map(n => join(repo, pkg, n)),
  ...readdirSync(testing).filter(n => n.startsWith(expert)).map(n => join(testing, n)),
  join(repo, 'reports', `${prefix}-run.mjs`),
  realpathSync(deps), realpathSync(join(repo, pkg, 'node_modules')),
])].sort()
const protectedNow = paths => Object.fromEntries(paths.map(p => [p, inventory(p)]))
function a16Drift() {
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
function originalAudit() {
  const c = read(join(originals, 'independent-counterexamples.command.json'))
  const r = read(join(originals, 'independent-counterexamples.result.json'))
  const failures = r.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'failed')
  assert.equal(c.originalExit, 1)
  assert.equal(r.numPassedTests, 19)
  assert.equal(r.numFailedTests, 1)
  assert(failures[0].fullName.startsWith('TF-X08 '))
  assert(failures[0].failureMessages[0].includes("expected undefined to be 'alert'"))
  assert.equal(read(join(testing, `${expert}-selftmp/final-r1/final.json`)).released, true)
  const records = ['command.json', 'result.json', 'stdout.log', 'stderr.log', 'observations.jsonl']
    .map(n => [n, inventory(join(originals, `independent-counterexamples.${n}`))['.']])
  return { originalExit: c.originalExit, passed: r.numPassedTests, failed: r.numFailedTests,
    failures, records: Object.fromEntries(records), a16Drift: a16Drift() }
}
function checks() {
  const before = read(join(out, 'protected-before.json'))
  const after = protectedNow(Object.keys(before))
  const protectedDrift = Object.fromEntries(Object.keys(before).map(p => [p, diff(before[p], after[p])])
    .filter(([, changes]) => changes.length))
  const manifest = read(join(out, 'frozen-inputs.json')), source = read(join(out, 'source-at-freeze.json'))
  const frozenDrift = Object.fromEntries(inputs.map(n => [n, diff(manifest[n], inventory(join(frozen, pkg, n)))])
    .filter(([, changes]) => changes.length))
  const sourceDrift = Object.fromEntries(inputs.map(n => [n, diff(source[n], inventory(join(repo, pkg, n)))])
    .filter(([, changes]) => changes.length))
  const testsDrift = diff(read(join(out, 'copied-tests.json')), inventory(join(frozen, 'docs/testing')))
  const declaredA16Drift = a16Drift()
  return { after, protectedDrift, frozenDrift, sourceDrift, testsDrift, declaredA16Drift,
    protectionOk: !Object.keys(protectedDrift).length && !Object.keys(frozenDrift).length &&
      !Object.keys(sourceDrift).length && !testsDrift.length && !declaredA16Drift.length }
}
if (stage === 'freeze') {
  assert(!existsSync(out), 'never overwrite a round or a failure')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n), { mode: 0o700 })
  save('protected-before.json', protectedNow(roots))
  save('original-audit.json', originalAudit())
  assert.deepEqual(a16Drift(), [])
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
  for (const n of inputs) assert.deepEqual(content(manifest[n]), content(source[n]), 'full current source freeze')
  save('frozen-inputs.json', manifest)
  const copied = [`${tf}-cases.test.tsx`, `${a16}-cases.test.tsx`, `${a16}-pc-cases.test.tsx`,
    `${a15}-cases.test.tsx`, `${a15}-expansion.test.tsx`, 'a14-preconfirm-conflict-contract-20261022-cases.test.tsx',
    'board-fixture-clarification-20261021-fixture.json', `${expert}-cases.test.tsx`]
  for (const n of copied) {
    cpSync(join(testing, n), join(frozen, 'docs/testing', n), { preserveTimestamps: true })
    assert.equal(sha(readFileSync(join(testing, n))), sha(readFileSync(join(frozen, 'docs/testing', n))))
  }
  save('copied-tests.json', inventory(join(frozen, 'docs/testing')))
  save('replay-input.json', read(join(testing, `${tf}-selftmp/r2/replay-input.json`)))
  save('pc-replay-input.json', read(join(testing, `${a16}-selftmp/r1/replay-input.json`)))
  symlinkSync(deps, join(frozen, pkg, 'node_modules'), 'dir')
  symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  if (round === 'before-r1') {
    const previous = read(join(originals, 'frozen-inputs.json'))
    for (const n of inputs) assert.deepEqual(content(source[n]), content(previous[n]), 'original A17 full source identity')
  } else {
    const previous = read(join(base, 'before-r1/source-at-freeze.json'))
    const delta = diff(content(previous.src), content(source.src))
    const allowed = ['client/panel.tsx', 'client/result-card.tsx', 'core/ui-feedback.ts',
      'client/panel-transport-error-feedback.test.tsx', 'client/result-card.test.ts', 'core/ui-feedback.test.ts']
    assert(delta.every(n => allowed.includes(n)), `outside approved source write surface: ${delta}`)
    for (const n of inputs.filter(n => n !== 'src')) assert.deepEqual(content(source[n]), content(previous[n]))
    save('approved-source-delta.json', delta)
  }
  save('candidate.json', { at: new Date().toISOString(), head, originMain, frozen, sourceTree: repo,
    sourceCount: Object.keys(manifest.src).length, completeInputs: inputs,
    manifestSha256: sha(readFileSync(join(out, 'frozen-inputs.json'))), patchSha256: sha(patch),
    newInputsSha256: sha(readFileSync(join(out, 'candidate-new-inputs.json'))),
    environment: { node: process.version, executable: process.execPath, os: os.release(), arch: os.arch() },
    dependencies: Object.fromEntries(['react', 'react-test-renderer', 'vitest', 'typescript', 'lucide-react', 'zod', 'xlsx']
      .map(n => [n, { root: realpathSync(join(deps, n)), version: read(join(deps, n, 'package.json')).version }])),
    actualA16: { tree: actualA16.tree, drift: a16Drift(), instanceNotAccessed: true },
    protectionRoots: roots.length, build: false, gui: false, services: false, commit: false, independentSignoff: false })
  console.log(JSON.stringify({ stage, round, sourceCount: Object.keys(manifest.src).length, roots: roots.length }))
} else if (stage === 'run') {
  assert(!existsSync(join(out, 'commands.json')))
  const initial = checks()
  assert(initial.protectionOk, JSON.stringify(initial))
  save('vitest.config.mjs', `export default ${JSON.stringify({ root: frozen, cacheDir: join(out, 'cache/vite'),
    test: { environment: 'node', cache: false,
      include: ['docs/testing/*.test.tsx', `${pkg}/src/**/*.test.ts`, `${pkg}/src/**/*.test.tsx`],
      pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000 },
  }, null, 2)}\n`)
  function test(id, files, pattern) {
    command(id, [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', ...files,
      '--config', join(out, 'vitest.config.mjs'), '--no-cache', '--reporter=verbose', '--reporter=json',
      '--outputFile', join(out, `${id}.result.json`), ...(pattern ? ['--testNamePattern', pattern] : [])], frozen,
    { ...env, TF_INPUT: join(out, 'replay-input.json'), TF_OBSERVATIONS: join(out, `${id}.observations.jsonl`),
      PC_INPUT: join(out, 'pc-replay-input.json'), PC_OBSERVATIONS: join(out, `${id}.pc-observations.jsonl`) })
  }
  const file = `docs/testing/${tf}-cases.test.tsx`
  test('success-control', [file], '^TF-C0[12] ')
  test('explicit-context-control', [file], '^TF-C03 ')
  test('original-five-retest', [file], '^TF-F01 ')
  test('recovery-control', [file], '^TF-C04 ')
  test('independent-counterexamples20', [`docs/testing/${expert}-cases.test.tsx`])
  if (round !== 'before-r1') {
    test('developer-a18-context', ['client/panel-transport-error-feedback.test.tsx', 'client/result-card.test.ts',
      'core/ui-feedback.test.ts'].map(n => `${pkg}/src/${n}`), 'A18 ')
  }
  if (round.startsWith('after')) {
    test('existing-regression65', ['core/ui-feedback.test.ts', 'client/result-card.test.ts', 'client/result-card-copy.test.ts',
      'client/panel-checklist-toggle.test.tsx', 'client/panel-launch-handshake.test.tsx', 'client/launch-handshake.test.ts']
      .map(n => `${pkg}/src/${n}`))
    test('developer-transport14', [`${pkg}/src/client/panel-transport-error-feedback.test.tsx`], '^(?!A18 )')
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
  }
  save('commands.json', commands)
  const results = commands.map(c => {
    const p = join(out, `${c.id}.result.json`), r = existsSync(p) ? read(p) : null
    return { ...c, passed: r?.numPassedTests, failed: r?.numFailedTests,
      pending: r?.numPendingTests, failedSuites: r?.numFailedTestSuites,
      reporterSha256: r ? sha(readFileSync(p)) : null,
      stdoutSha256: sha(readFileSync(join(out, `${c.id}.stdout.log`))),
      stderrSha256: sha(readFileSync(join(out, `${c.id}.stderr.log`))),
      assertions: r?.testResults.flatMap(t => t.assertionResults) }
  })
  const { after, ...protection } = checks()
  save('protected-after.json', after)
  save('summary.json', { results, ...protection, independentSignoff: false,
    developerCommandsAllZero: commands.every(c => c.originalExit === 0), noBuild: true, noGui: true, noCommit: true })
  console.log(JSON.stringify({ protectionOk: protection.protectionOk,
    results: results.map(r => ({ id: r.id, exit: r.originalExit, passed: r.passed, failed: r.failed, failedSuites: r.failedSuites })) }))
  process.exitCode = protection.protectionOk && commands.every(c => c.originalExit === 0) ? 0 : 1
} else {
  const final = join(base, `final-${round}`)
  assert(!existsSync(final))
  const { after, ...protection } = checks()
  save('protected-after.json', after, final)
  save('original-audit.json', originalAudit(), final)
  const cs = [...read(join(out, 'commands.json')), ...read(join(out, 'acquisition-commands.json'))]
  const pids = [...new Set(cs.map(c => c.pid).filter(Boolean))]
  const ps = command('process-check', ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command='], repo, env, final)
  const noRecordedChildren = ps.status === 1 && !ps.stdout.trim()
  save('own-output-inventory.json', inventory(out), final)
  save('runtime-write-roots.json', Object.fromEntries(['home', 'tmp', 'cache', 'runtime']
    .map(n => [n, inventory(join(out, n))])), final)
  save('final.json', { ...protection, noRecordedChildren, released: protection.protectionOk && noRecordedChildren,
    developerCommandsAllZero: read(join(out, 'summary.json')).developerCommandsAllZero,
    independentSignoff: false, gui: 'NOT_RUN: Main only after independent retest',
    wholeGateSigned: false, build: false, services: false, commit: false }, final)
  console.log(JSON.stringify({ ...protection, noRecordedChildren, released: protection.protectionOk && noRecordedChildren }))
  process.exitCode = protection.protectionOk && noRecordedChildren ? 0 : 1
}

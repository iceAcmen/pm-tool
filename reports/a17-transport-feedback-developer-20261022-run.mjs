import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a17-transport-feedback-developer-20261022'
const base = join(repo, 'reports', `${prefix}-selftmp`)
const pkg = 'packages/dsh-pm-tool'
const inputs = ['src', 'scripts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
const panel = 'src/client/panel.tsx'
const newTest = 'src/client/panel-transport-error-feedback.test.tsx'
const stage = process.argv[2], round = process.argv[3]
assert(['freeze', 'run', 'final'].includes(stage))
assert(['before-r1', 'after-r1', 'after-r2'].includes(round))
const out = join(base, round), frozen = join(out, 'frozen')
const testing = join(repo, 'docs/testing')
const tf = 'a17-transport-feedback-contract-20261022'
const a16 = 'a16-extension-base-independent-retest-20261022'
const a15 = 'a15-preconfirm-independent-retest-20261022'
const a14 = 'a14-preconfirm-conflict-contract-20261022'
const expertR2 = join(testing, `${tf}-selftmp/r2`)
const deps = '/private/tmp/pmtool-a14-closure-20261022/packages/dsh-pm-tool/node_modules'
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const content = m => Object.fromEntries(Object.entries(m).map(([k, v]) =>
  [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
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
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
function save(name, value, target = out) {
  const p = resolve(target, name)
  assert(p.startsWith(`${base}/`), 'developer owned evidence only')
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
  DSH_HOME: join(out, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1',
}
const sourceNow = root => Object.fromEntries(inputs.map(n => [n, inventory(join(root, pkg, n))]))
const actualA16 = read(join(repo, 'reports/all-pending-evidence-20261021/A16/candidate.json'))
const dependencyRoots = Object.fromEntries(['react', 'react-test-renderer', 'vitest', 'vite', 'typescript', 'lucide-react', 'zod', 'xlsx']
  .map(n => [n, realpathSync(n === 'vite' ? join(dirname(realpathSync(join(deps, 'vitest'))), 'vite') : join(deps, n))]))
const originalRoots = Object.keys(read(join(expertR2, 'protected-before.json')))
  .filter(p => !inputs.some(n => p === join(repo, pkg, n)))
const staticExpertFiles = [`${tf}.md`, `${tf}-plan.md`, `${tf}-cases.test.tsx`, `${tf}-run.mjs`,
  `${a16}-cases.test.tsx`, `${a16}-pc-cases.test.tsx`, `${a15}-cases.test.tsx`,
  `${a15}-expansion.test.tsx`, `${a14}-cases.test.tsx`,
  ...(round === 'after-r2' ? ['board-fixture-clarification-20261021-fixture.json'] : [])]
const roots = [...new Set([
  ...originalRoots, join(testing, `${tf}-selftmp`),
  ...staticExpertFiles.map(n => join(testing, n)),
  ...inputs.map(n => join(actualA16.tree, pkg, n)), join(actualA16.tree, pkg, 'lib'),
  join(repo, 'reports/all-pending-evidence-20261021/A16/candidate.json'),
  ...Object.values(dependencyRoots),
  ...[deps, join(repo, pkg, 'node_modules'), join(realpathSync(join(deps, 'vitest')), 'node_modules')]
    .flatMap(p => ['.vite', '.cache', '.vite-temp'].map(n => join(p, n))),
])]
const protectedNow = () => Object.fromEntries(roots.map(p => [p, inventory(p)]))
function declaredA16Drift() {
  return Object.entries({ ...actualA16.sourceHashes, ...actualA16.artifacts }).filter(([p, h]) =>
    !existsSync(join(actualA16.tree, p)) || sha(readFileSync(join(actualA16.tree, p))) !== h).map(([p]) => p)
}
function catchOnlyAudit() {
  const beforeRoot = join(base, 'before-r1/frozen', pkg)
  const before = readFileSync(join(beforeRoot, panel), 'utf8')
  const after = readFileSync(join(repo, pkg, panel), 'utf8')
  const oldBlock = "    } catch (error) {\n      setMessage(error instanceof Error ? error.message : String(error))\n      setBusy(false)\n      return false\n    } finally {\n      inflightRef.current = false"
  const newBlock = "    } catch (error) {\n      setMessage(prefixFeedbackOnce('执行失败', error))\n      setBusy(false)\n      return false\n    } finally {\n      inflightRef.current = false"
  assert.equal(before.split(oldBlock).length, 2)
  assert.equal(before.replace(oldBlock, newBlock), after, 'all panel bytes outside run catch must remain identical')
  return { beforeSha256: sha(before), afterSha256: sha(after), oldBlock, newBlock, allOtherPanelBytesUnchanged: true }
}
const commands = []
function command(id, argv, cwd, e = env) {
  const start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd, env: e, encoding: 'utf8', timeout: 240000, maxBuffer: 128 * 1024 * 1024 })
  save(`${id}.stdout.log`, r.stdout ?? ''); save(`${id}.stderr.log`, r.stderr ?? '')
  const c = { id, argv, cwd, env: e, start, end: new Date().toISOString(), originalExit: r.status,
    signal: r.signal, pid: r.pid, error: r.error?.message ?? null }
  save(`${id}.command.json`, c); commands.push(c)
  console.log(JSON.stringify({ id, originalExit: r.status, signal: r.signal }))
  return r
}
if (stage === 'freeze') {
  assert(!existsSync(out), 'never overwrite any round')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n), { mode: 0o700 })
  save('protected-before.json', protectedNow())
  assert.deepEqual(declaredA16Drift(), [], 'actual A16 frozen inputs/artifacts must match original declaration')
  const source = sourceNow(repo)
  save('source-at-freeze.json', source)
  if (round === 'before-r1') {
    assert.equal(source.src['client/panel.tsx'].sha256, read(join(expertR2, 'frozen-inputs.json')).src['client/panel.tsx'].sha256)
    assert.equal(existsSync(join(repo, pkg, newTest)), false)
  } else save('catch-only-audit.json', catchOnlyAudit())
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
  const paths = git('git-new-inputs', ['ls-files', '--others', '--exclude-standard', '--',
    ...inputs.map(n => `${pkg}/${n}`)]).trim().split('\n').filter(Boolean).sort()
  save('candidate-new-inputs.json', paths.map(path => ({ path, ...inventory(join(repo, path))['.'] })))
  save('acquisition-commands.json', commands)
  for (const n of inputs) cpSync(join(repo, pkg, n), join(frozen, pkg, n), { recursive: true, preserveTimestamps: true })
  const manifest = sourceNow(frozen)
  for (const n of inputs) assert.deepEqual(content(manifest[n]), content(source[n]), 'full source freeze')
  save('frozen-inputs.json', manifest)
  for (const n of staticExpertFiles.filter(n => n.endsWith('.test.tsx') || n.endsWith('.json'))) {
    cpSync(join(testing, n), join(frozen, 'docs/testing', n), { recursive: true, preserveTimestamps: true })
    assert.equal(sha(readFileSync(join(testing, n))), sha(readFileSync(join(frozen, 'docs/testing', n))))
  }
  save('copied-expert-tests.json', inventory(join(frozen, 'docs/testing')))
  save('replay-input.json', read(join(expertR2, 'replay-input.json')))
  save('pc-replay-input.json', read(join(testing, `${a16}-selftmp/r1/replay-input.json`)))
  symlinkSync(deps, join(frozen, pkg, 'node_modules'), 'dir')
  symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  save('candidate.json', { at: new Date().toISOString(), head, originMain, sourceTree: repo, frozen,
    sourceCount: Object.keys(manifest.src).length, completeInputs: inputs,
    panelSha256: manifest.src['client/panel.tsx'].sha256,
    trackedSha256: sha(patch), manifestSha256: sha(readFileSync(join(out, 'frozen-inputs.json'))),
    newFilesSha256: sha(readFileSync(join(out, 'candidate-new-inputs.json'))),
    environment: { node: process.version, executable: process.execPath, os: os.release(), arch: os.arch() },
    dependencies: Object.fromEntries(Object.entries(dependencyRoots).map(([n, root]) => [n, { root, version: read(join(root, 'package.json')).version }])),
    actualA16: { tree: actualA16.tree, panelSha256: actualA16.sourceHashes[`${pkg}/${panel}`], declaredDrift: declaredA16Drift() },
    builder: 'Main only', built: false, guiExecuted: false, independentJudgment: false })
  console.log(JSON.stringify({ stage, round, sourceCount: Object.keys(manifest.src).length, completeFreeze: true }))
} else if (stage === 'run') {
  assert(!existsSync(join(out, 'commands.json')))
  const manifest = read(join(out, 'frozen-inputs.json'))
  for (const n of inputs) assert.deepEqual(inventory(join(frozen, pkg, n)), manifest[n])
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
  test('necessary-red', [file], '^TF-F01 ')
  test('recovery-control', [file], '^TF-C04 ')
  test('existing-regression65', ['core/ui-feedback.test.ts', 'client/result-card.test.ts', 'client/result-card-copy.test.ts',
    'client/panel-checklist-toggle.test.tsx', 'client/panel-launch-handshake.test.tsx', 'client/launch-handshake.test.ts'].map(n => `${pkg}/src/${n}`))
  if (round.startsWith('after-')) {
    test('developer-transport', [`${pkg}/${newTest}`])
    test('revised-pc', [`docs/testing/${a16}-pc-cases.test.tsx`])
    test('expert-extension', [`docs/testing/${a16}-cases.test.tsx`])
    test('parent-extension', [`docs/testing/${a15}-expansion.test.tsx`])
    test('independent23', [`docs/testing/${a15}-cases.test.tsx`])
    test('developer-extension23', [`${pkg}/src/client/copilot-extension-baseline.test.tsx`])
    test('affected-regression87', ['client/shared/drawers/copilot-preconfirm.test.tsx', 'client/sidecar-minimize-retention.test.tsx',
      'client/panel-checklist-toggle.test.tsx', 'client/panel-launch-handshake.test.tsx', 'client/provenance-panel.test.tsx',
      'client/shared/task-draft-materials-stage.test.tsx', 'core/copilot-validate.test.ts', 'core/copilot-task-fields.test.ts',
      'core/ask-projection.test.ts'].map(n => `${pkg}/src/${n}`))
    test('panel-and-import-regression', ['client/panel-restore-path.test.ts', 'client/panel-cancel-close.test.ts',
      'client/views/tasks-import-confirm.test.tsx', 'client/views/tasks-number-feedback.test.tsx',
      'client/views/records-entry-guard.test.ts', 'client/views/reports-entry-guard.test.ts',
      'client/shared/records-callbacks.test.ts', 'client/board/BoardBento-feedback.test.tsx'].map(n => `${pkg}/src/${n}`))
  }
  command('noemit', [process.execPath, join(deps, 'typescript/bin/tsc'), '--project', join(frozen, pkg, 'tsconfig.json'),
    '--noEmit', '--incremental', 'false'], join(frozen, pkg))
  save('commands.json', commands)
  const before = read(join(out, 'protected-before.json')), after = protectedNow()
  save('protected-after.json', after)
  const drift = Object.fromEntries(roots.map(p => [p, diff(before[p], after[p])]))
  const frozenDrift = Object.fromEntries(inputs.map(n => [n, diff(manifest[n], inventory(join(frozen, pkg, n)))]))
  const testsDrift = diff(read(join(out, 'copied-expert-tests.json')), inventory(join(frozen, 'docs/testing')))
  const results = commands.map(c => {
    const p = join(out, `${c.id}.result.json`), r = existsSync(p) ? read(p) : null
    return { ...c, reporterSha256: r ? sha(readFileSync(p)) : null,
      stdoutSha256: sha(readFileSync(join(out, `${c.id}.stdout.log`))),
      stderrSha256: sha(readFileSync(join(out, `${c.id}.stderr.log`))),
      passed: r?.numPassedTests, failed: r?.numFailedTests, pending: r?.numPendingTests,
      assertions: r?.testResults.flatMap(t => t.assertionResults) }
  })
  const protectionOk = Object.values(drift).flat().length === 0 && Object.values(frozenDrift).flat().length === 0 &&
    testsDrift.length === 0 && declaredA16Drift().length === 0
  save('summary.json', { at: new Date().toISOString(), results, drift, frozenDrift, testsDrift, protectionOk,
    actualA16Drift: declaredA16Drift(), authorOnly: true, notIndependentPass: true, built: false, guiExecuted: false })
  console.log(JSON.stringify({ round, protectionOk, results: results.map(c =>
    ({ id: c.id, exit: c.originalExit, passed: c.passed, failed: c.failed, pending: c.pending })) }))
  const expected = round === 'before-r1' ? [0, 0, 1, 0, 0, 0] : commands.map(() => 0)
  process.exitCode = protectionOk && results.every((c, i) => c.originalExit === expected[i]) ? 0 : 1
} else {
  const final = join(base, `final-${round}`)
  assert(!existsSync(final))
  const before = read(join(out, 'protected-before.json')), after = protectedNow()
  const drift = Object.fromEntries(roots.map(p => [p, diff(before[p], after[p])]))
  const manifest = read(join(out, 'frozen-inputs.json'))
  const frozenDrift = Object.fromEntries(inputs.map(n => [n, diff(manifest[n], inventory(join(frozen, pkg, n)))]))
  const newVsMain = Object.fromEntries(inputs.map(n => [n, diff(content(manifest[n]), content(inventory(join(repo, pkg, n))))]))
  const testsDrift = diff(read(join(out, 'copied-expert-tests.json')), inventory(join(frozen, 'docs/testing')))
  const pids = [...new Set([...read(join(out, 'commands.json')), ...read(join(out, 'acquisition-commands.json'))].map(c => c.pid))]
  const argv = ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command=']
  const start = new Date().toISOString()
  const ps = spawnSync(argv[0], argv.slice(1), { cwd: repo, env, encoding: 'utf8' })
  save('process-check.command.json', { argv, cwd: repo, env, start, end: new Date().toISOString(),
    originalExit: ps.status, signal: ps.signal, stdout: ps.stdout, stderr: ps.stderr, expectedNoRecordedPidExit: 1 }, final)
  const noRecordedChildren = ps.status === 1 && !ps.stdout.trim()
  const protectionOk = Object.values(drift).flat().length === 0 && Object.values(frozenDrift).flat().length === 0 &&
    testsDrift.length === 0 && declaredA16Drift().length === 0
  const sourceMatches = Object.values(newVsMain).flat().length === 0
  save('protected-after.json', after, final)
  save('final.json', { at: new Date().toISOString(), protectionOk, drift, frozenDrift, testsDrift,
    newVsMain, sourceMatches, noRecordedChildren, actualA16Drift: declaredA16Drift(),
    released: protectionOk && sourceMatches && noRecordedChildren,
    built: false, guiExecuted: false, servicesOperated: false, commitExecuted: false, independentPass: false }, final)
  console.log(JSON.stringify({ protectionOk, sourceMatches, noRecordedChildren, released: protectionOk && sourceMatches && noRecordedChildren }))
  process.exitCode = protectionOk && sourceMatches && noRecordedChildren ? 0 : 1
}

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a17-transport-feedback-contract-20261022'
const pkg = 'packages/dsh-pm-tool'
const inputs = ['src', 'scripts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
const base = join(repo, 'docs/testing', `${prefix}-selftmp`)
const round = process.argv[3] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const out = join(base, round)
const frozen = join(out, 'frozen')
const stage = process.argv[2]
assert(['freeze', 'run', 'final'].includes(stage))
const deps = '/private/tmp/pmtool-a14-closure-20261022/packages/dsh-pm-tool/node_modules'
const evidence = join(repo, 'reports/all-pending-evidence-20261021/A15/import-fault')
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const content = m => Object.fromEntries(Object.entries(m).map(([k, v]) =>
  [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(p) {
    const s = lstatSync(p), k = relative(root, p) || '.'
    if (s.isSymbolicLink()) result[k] = { link: realpathSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else result[k] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(root)
  return result
}
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
function save(name, value, target = out) {
  const path = resolve(target, name)
  assert(path.startsWith(`${base}/`), 'A17 output only')
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
  DSH_HOME: join(out, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1',
}
const depsNames = ['react', 'react-test-renderer', 'vitest', 'vite', 'typescript', 'lucide-react', 'zod', 'xlsx']
const depRoots = Object.fromEntries(depsNames.map(n => [n, realpathSync(n === 'vite'
  ? join(dirname(realpathSync(join(deps, 'vitest'))), 'vite') : join(deps, n))]))
const testing = join(repo, 'docs/testing')
const a16 = join(testing, 'a16-extension-base-independent-retest-20261022-selftmp/r1')
const fixedRoots = [
  ...inputs.map(n => join(repo, pkg, n)), join(repo, pkg, 'lib'),
  ...['a11-closure-20261021', 'a12-closure-20261021', 'a13-closure-20261022', 'a14-closure-20261022']
    .map(n => join('/private/tmp', `pmtool-${n}`, pkg, 'lib')),
  ...['src/client/panel.tsx', 'src/client/result-card.tsx', 'src/core/ui-feedback.ts']
    .map(n => join('/private/tmp/pmtool-a13-closure-20261022', pkg, n)),
  evidence,
  ...readdirSync(testing).filter(n => n.startsWith('a15-import-fault-gui-review-20261022'))
    .map(n => join(testing, n)),
  ...['new', 'old', 'a14'].flatMap(k => inputs.map(n => join(a16, k, 'frozen', pkg, n))),
  ...['plan.md', 'run.mjs', 'cases.test.tsx', 'pc-cases.test.tsx', 'oracle.test.tsx', 'check.mjs']
    .map(n => join(testing, `a16-extension-base-independent-retest-20261022-${n}`)),
  ...Object.values(depRoots),
  ...[deps, join(repo, pkg, 'node_modules')].flatMap(p => ['.vite', '.cache', '.vite-temp'].map(n => join(p, n))),
]
const protectedNow = () => Object.fromEntries(fixedRoots.map(p => [p, inventory(p)]))
const pkgInventory = root => Object.fromEntries(inputs.map(n => [n, inventory(join(root, pkg, n))]))
const ownStatic = () => Object.fromEntries(['plan.md', 'cases.test.tsx', 'run.mjs']
  .map(n => [n, inventory(join(testing, `${prefix}-${n}`))]))

function originalAudit() {
  const index = read(join(evidence, 'index.json'))
  for (const [p, info] of Object.entries(index)) {
    const bytes = readFileSync(join(evidence, p))
    assert.equal(bytes.length, info.bytes)
    assert.equal(sha(bytes), info.sha256)
  }
  const observations = read(join(evidence, 'observations.json'))
  const events = readFileSync(join(evidence, 'commands.ndjson'), 'utf8').trim().split('\n').map(JSON.parse)
  const imports = {}
  for (const [format, seq] of [['csv', 81], ['xlsx', 89]]) {
    const run = events.find(e => e.event.seq === seq).event
    const done = events.find(e => e.event.seq === seq + 1).event
    const retry = events.find(e => e.event.seq === seq + 2).event
    const retryDone = events.find(e => e.event.seq === seq + 3).event
    const previewLine = run.data.args.trim()
    const match = /^task import-content p-0001 ("(?:[^"\\]|\\.)*") ("(?:[^"\\]|\\.)*")$/.exec(previewLine)
    assert(match)
    assert.equal(retry.data.args.trim(), `${previewLine} confirm`)
    assert.equal(done.data.kind, 'success')
    assert.equal(retryDone.data.kind, 'success')
    for (const values of Object.values(observations.steps[`${format}-confirm-fail`].diff))
      for (const list of Object.values(values)) assert.deepEqual(list, [])
    const failed = readFileSync(join(evidence, `${format}-failed.json`), 'utf8')
    assert(failed.includes('client api: commands/execute failed: Failed to fetch'))
    imports[format] = {
      filename: JSON.parse(match[1]), content: JSON.parse(match[2]), previewLine,
      confirmLine: retry.data.args.trim(), previewText: done.data.text, retryText: retryDone.data.text,
      originalPreviewSeq: seq, originalRetrySeq: seq + 2,
    }
  }
  return {
    a15Error: 'client api: commands/execute failed: Failed to fetch', imports,
    originalIndexedCount: Object.keys(index).length, originalsAllBytesHashVerified: true,
    originalCommandsSha256: sha(readFileSync(join(evidence, 'commands.ndjson'))),
    originalObservationsSha256: sha(readFileSync(join(evidence, 'observations.json'))),
    originalFailDiffs: Object.fromEntries(['csv', 'xlsx'].map(f =>
      [f, observations.steps[`${f}-confirm-fail`]])),
    originalImageScope: ['csv-failed.png', 'xlsx-failed.png'],
    noNewGui: true, rawEventsNotIncorrectSummary: true,
  }
}
if (stage === 'freeze') {
  assert(!existsSync(out), 'never overwrite an A17 round')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n), { mode: 0o700 })
  save('protected-before.json', protectedNow())
  save('own-static.json', ownStatic())
  const gitCommands = []
  function git(id, args) {
    const e = { ...env, GIT_OPTIONAL_LOCKS: '0' }, start = new Date().toISOString()
    const r = spawnSync('/usr/bin/git', args, { cwd: repo, env: e, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
    gitCommands.push({ id, argv: ['/usr/bin/git', ...args], cwd: repo, env: e, start,
      end: new Date().toISOString(), originalExit: r.status, signal: r.signal, pid: r.pid, stderr: r.stderr })
    assert.equal(r.status, 0, r.stderr)
    return r.stdout
  }
  const head = git('head', ['rev-parse', 'HEAD']).trim()
  const originMain = git('origin', ['rev-parse', 'origin/main']).trim()
  const patch = git('tracked', ['diff', '--binary', 'HEAD', '--', pkg])
  save('candidate-tracked.patch', patch)
  save('candidate-status.txt', git('status', ['status', '--short', '--branch', '--', pkg]))
  const newFiles = git('new-inputs', ['ls-files', '--others', '--exclude-standard', '--',
    ...inputs.map(n => `${pkg}/${n}`)]).trim().split('\n').filter(Boolean).sort()
  save('candidate-new-inputs.json', newFiles.map(path => ({ path, ...inventory(join(repo, path))['.'] })))
  save('acquisition-commands.json', gitCommands)
  for (const n of inputs) cpSync(join(repo, pkg, n), join(frozen, pkg, n), { recursive: true, preserveTimestamps: true })
  const manifest = pkgInventory(frozen), source = pkgInventory(repo)
  for (const n of inputs) assert.deepEqual(content(manifest[n]), content(source[n]))
  save('frozen-inputs.json', manifest)
  save('source-at-freeze.json', source)
  symlinkSync(deps, join(frozen, pkg, 'node_modules'), 'dir')
  symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  save('replay-input.json', originalAudit())
  cpSync(join(testing, `${prefix}-cases.test.tsx`), join(frozen, 'docs/testing', `${prefix}-cases.test.tsx`),
    { recursive: true, preserveTimestamps: true })
  save('candidate.json', {
    at: new Date().toISOString(), head, originMain, sourceTree: repo, frozen,
    sourceCount: Object.keys(manifest.src).length, completeInputs: inputs,
    trackedSha256: sha(patch), manifestSha256: sha(readFileSync(join(out, 'frozen-inputs.json'))),
    newFilesSha256: sha(readFileSync(join(out, 'candidate-new-inputs.json'))),
    node: process.version, executable: process.execPath, os: os.release(), arch: os.arch(),
    dependencies: Object.fromEntries(depsNames.map(n => [n, {
      root: depRoots[n], version: read(join(depRoots[n], 'package.json')).version,
    }])),
    a16OwnFreezeNotBorrowed: true, built: false, guiExecuted: false,
  })
  console.log(JSON.stringify({ stage, sourceCount: Object.keys(manifest.src).length, completeInputs: true }))
} else if (stage === 'run') {
  assert(!existsSync(join(out, 'commands.json')))
  assert.deepEqual(ownStatic(), read(join(out, 'own-static.json')))
  const manifest = read(join(out, 'frozen-inputs.json'))
  for (const n of inputs) assert.deepEqual(inventory(join(frozen, pkg, n)), manifest[n])
  const config = {
    root: frozen, cacheDir: join(out, 'cache/vite'),
    test: { environment: 'node', cache: false, include: ['docs/testing/*.test.tsx', `${pkg}/src/**/*.test.ts`, `${pkg}/src/**/*.test.tsx`],
      pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000 },
  }
  save('vitest.config.mjs', `export default ${JSON.stringify(config, null, 2)}\n`)
  const commands = []
  function test(id, files, pattern) {
    const argv = [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', ...files, '--config', join(out, 'vitest.config.mjs'),
      '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(out, `${id}.result.json`),
      ...(pattern ? ['--testNamePattern', pattern] : [])]
    const e = { ...env, TF_INPUT: join(out, 'replay-input.json'), TF_OBSERVATIONS: join(out, `${id}.observations.jsonl`) }
    const start = new Date().toISOString()
    const r = spawnSync(argv[0], argv.slice(1), { cwd: frozen, env: e, encoding: 'utf8', timeout: 240000, maxBuffer: 64 * 1024 * 1024 })
    save(`${id}.stdout.log`, r.stdout ?? '')
    save(`${id}.stderr.log`, r.stderr ?? '')
    const c = { id, argv, cwd: frozen, env: e, start, end: new Date().toISOString(),
      pid: r.pid, originalExit: r.status, signal: r.signal, error: r.error?.message ?? null }
    save(`${id}.command.json`, c)
    commands.push(c)
    console.log(JSON.stringify(c))
  }
  const file = `docs/testing/${prefix}-cases.test.tsx`
  test('success-control', [file], '^TF-C0[12] ')
  test('explicit-context-control', [file], '^TF-C03 ')
  test('necessary-red', [file], '^TF-F01 ')
  test('recovery-control', [file], '^TF-C04 ')
  test('existing-regression', ['core/ui-feedback.test.ts', 'client/result-card.test.ts', 'client/result-card-copy.test.ts',
    'client/panel-checklist-toggle.test.tsx', 'client/panel-launch-handshake.test.tsx', 'client/launch-handshake.test.ts']
    .map(n => `${pkg}/src/${n}`))
  save('commands.json', commands)
  const before = read(join(out, 'protected-before.json')), after = protectedNow()
  save('protected-after.json', after)
  const drift = Object.fromEntries(fixedRoots.map(p => [p, diff(before[p], after[p])]))
  const frozenDrift = Object.fromEntries(inputs.map(n => [n, diff(manifest[n], inventory(join(frozen, pkg, n)))]))
  const results = commands.map(c => {
    const p = join(out, `${c.id}.result.json`), r = existsSync(p) ? read(p) : null
    return { ...c, reporterSha256: r ? sha(readFileSync(p)) : null,
      passed: r?.numPassedTests, failed: r?.numFailedTests, pending: r?.numPendingTests,
      assertions: r?.testResults.flatMap(t => t.assertionResults) }
  })
  save('summary.json', { at: new Date().toISOString(), results, drift, frozenDrift,
    necessaryRedNeverConvertedToGreen: true, built: false, guiExecuted: false })
  console.log(JSON.stringify({ results: results.map(r => ({ id: r.id, exit: r.originalExit,
    passed: r.passed, failed: r.failed, pending: r.pending })), drift: Object.entries(drift).filter(([, v]) => v.length), frozenDrift }))
} else {
  const final = join(base, `final-${round}`)
  assert(!existsSync(final))
  const before = read(join(out, 'protected-before.json')), after = protectedNow()
  const drift = Object.fromEntries(fixedRoots.map(p => [p, diff(before[p], after[p])]))
  const manifest = read(join(out, 'frozen-inputs.json'))
  const frozenDrift = Object.fromEntries(inputs.map(n => [n, diff(manifest[n], inventory(join(frozen, pkg, n)))]))
  const newVsMain = Object.fromEntries(inputs.map(n => [n, diff(content(manifest[n]), content(inventory(join(repo, pkg, n))))]))
  const ownStaticDrift = diff(read(join(out, 'own-static.json')), ownStatic())
  const commands = read(join(out, 'commands.json'))
  const pids = commands.map(c => c.pid).filter(Boolean)
  const argv = ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command=']
  const start = new Date().toISOString()
  const ps = spawnSync(argv[0], argv.slice(1), { cwd: repo, env, encoding: 'utf8' })
  save('process-check.command.json', { argv, cwd: repo, env, start, end: new Date().toISOString(),
    originalExit: ps.status, signal: ps.signal, stdout: ps.stdout, stderr: ps.stderr, expectedNoPidExit: 1 }, final)
  const protectionOk = Object.values(drift).flat().length === 0 &&
    Object.values(frozenDrift).flat().length === 0 && ownStaticDrift.length === 0
  const noRecordedChildren = ps.status === 1 && !ps.stdout.trim()
  originalAudit()
  save('protected-after.json', after, final)
  save('final.json', { at: new Date().toISOString(), protectionOk, drift, frozenDrift, newVsMain,
    ownStaticDrift, noRecordedChildren, released: protectionOk && noRecordedChildren,
    noNewGui: true, noBuild: true, noProductEdits: true, noServices: true, noCommit: true }, final)
  console.log(JSON.stringify({ protectionOk, noRecordedChildren, newVsMain, released: protectionOk && noRecordedChildren }))
  process.exitCode = protectionOk && noRecordedChildren ? 0 : 1
}

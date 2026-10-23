import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, readlinkSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

// 仅本前缀自有输出；不调用 build/install/GUI/service，不导入产品业务写模块。
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a19-habit-suggestion-okr-contract-20261022'
const testing = join(repo, 'docs/testing')
const base = join(testing, `${prefix}-selftmp`)
const out = join(base, 'r1'), frozen = join(out, 'frozen')
const pkg = 'packages/dsh-pm-tool'
const inputs = ['src', 'scripts', 'locale', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json',
  'vitest.config.ts', 'tsdown.config.ts', 'cordis.patch.yml']
const deps = '/private/tmp/pmtool-a14-closure-20261022/packages/dsh-pm-tool/node_modules'
const evidence = join(repo, 'reports/all-pending-evidence-20261021/A18/growth-more')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
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
const changed = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const content = m => Object.fromEntries(Object.entries(m).map(([k, v]) =>
  [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
function save(name, value) {
  const p = resolve(out, name)
  assert(p.startsWith(`${base}/`), 'A19 selftmp writes only')
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
  DSH_HOME: join(out, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1',
}
const a18Audit = join(testing, 'a18-growth-more-gui-review-20261022-audit-r2.json')
const oldProtection = read(a18Audit).protectedBefore
const depNames = ['react', 'react-test-renderer', 'vitest', 'lucide-react', 'typescript', 'zod']
const depRoots = depNames.map(n => realpathSync(join(deps, n)))
const viteRoot = realpathSync(join(dirname(realpathSync(join(deps, 'vitest'))), 'vite'))
const protectedRoots = [...new Set([
  ...Object.keys(oldProtection), a18Audit,
  ...readdirSync(testing).filter(n => n.startsWith('a18-growth-more-gui-review-20261022'))
    .map(n => join(testing, n)),
  ...inputs.map(n => join(repo, pkg, n)), join(repo, pkg, 'lib'),
  ...['/private/tmp/pmtool-a11-closure-20261021', '/private/tmp/pmtool-a12-closure-20261021']
    .map(p => join(p, pkg, 'lib')),
  ...depRoots, viteRoot,
  ...[deps, join(repo, pkg, 'node_modules'), join(dirname(viteRoot), '.vite')]
    .flatMap(p => ['.vite', '.cache', '.vite-temp'].map(n => join(p, n))),
])]
const capture = () => Object.fromEntries(protectedRoots.map(p => [p, inventory(p)]))
const inputInventory = root => Object.fromEntries(inputs.map(n => [n, inventory(join(root, pkg, n))]))
const ownStatic = () => Object.fromEntries(['plan.md', 'cases.test.tsx', 'run.mjs']
  .map(n => [n, inventory(join(testing, `${prefix}-${n}`))]))
function originalFixture() {
  const index = read(join(evidence, 'index.json'))
  for (const [p, info] of Object.entries(index.files)) {
    assert(resolve(evidence, p).startsWith(`${evidence}/`))
    const bytes = readFileSync(join(evidence, p))
    assert.equal(bytes.length, info.bytes, p)
    assert.equal(sha(bytes), info.sha256, p)
    if (p.endsWith('.json')) JSON.parse(bytes.toString())
  }
  const all = Object.keys(inventory(evidence))
  assert.deepEqual(all.filter(p => p !== 'index.json' && !(p in index.files)), [])
  const observations = read(join(evidence, 'observations.json'))
  const slices = {}
  for (const [name, step] of [['pending', 'pm-habit-1792627598950'],
    ['reentry', 'pm-habit-1792627703623']]) {
    const root = join(evidence, step)
    const events = read(join(root, 'commands.json'))
    const run = events.find(e => e.event.type === 'command/run' && e.event.data.args === ' web snapshot')
    assert(run)
    const done = events.find(e => e.event.type === 'command/done' && e.event.data.commandId === run.event.data.commandId)
    assert.equal(done.event.data.kind, 'success')
    const snap = JSON.parse(done.event.data.text)
    const rawInbox = read(join(root, 'raw/settings/pmHabitInbox.json')).record.value.entries
    assert.deepEqual(snap.habitInbox, rawInbox)
    for (const s of snap.habitInbox) {
      assert.equal(s.projectId, 'p-0001')
      assert.equal(s.okrId, 'okr-mvi5z847-33y3xk')
      assert(snap.okrs.some(o => o.id === s.okrId && o.projectId === s.projectId && o.title === 'F5目标'))
    }
    const actual = read(join(root, 'actual.json'))
    assert(!actual.pm.text.slice(actual.pm.text.lastIndexOf('待确认习惯建议'))
      .includes('okr-mvi5z847-33y3xk'))
    slices[name] = {
      habits: snap.habits, habitInbox: snap.habitInbox, okrs: snap.okrs,
      source: { step, commandsSha: sha(readFileSync(join(root, 'commands.json'))),
        rawSha: sha(readFileSync(join(root, 'raw/settings/pmHabitInbox.json'))),
        actualSha: sha(readFileSync(join(root, 'actual.json'))) },
    }
  }
  assert(slices.pending.habitInbox.every(s => s.status === 'pending'))
  assert.deepEqual(slices.reentry.habitInbox.map(s => s.status), ['confirmed', 'ignored'])
  return { ...slices, boundary: 'original snapshots only; no new GUI; no repeated whole A18 acceptance',
    indexCount: Object.keys(index.files).length, jsonValidated: true,
    observationRows: observations.rows.length, indexSha: sha(readFileSync(join(evidence, 'index.json'))) }
}
const stage = process.argv[2]
assert(['freeze', 'run', 'seal'].includes(stage))
if (stage === 'freeze') {
  assert(!existsSync(out), 'never overwrite A19 original round')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n), { mode: 0o700 })
  save('protected-before.json', capture())
  save('own-static.json', ownStatic())
  const commands = []
  function git(id, args) {
    const e = { ...env, GIT_OPTIONAL_LOCKS: '0' }
    const start = new Date().toISOString()
    const r = spawnSync('/usr/bin/git', args, { cwd: repo, env: e, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
    commands.push({ id, argv: ['/usr/bin/git', ...args], cwd: repo, env: e, start,
      end: new Date().toISOString(), pid: r.pid, originalExit: r.status, signal: r.signal, stderr: r.stderr })
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
  save('acquisition-commands.json', commands)
  save('source-before-copy.json', inputInventory(repo))
  for (const n of inputs) cpSync(join(repo, pkg, n), join(frozen, pkg, n),
    { recursive: true, preserveTimestamps: true })
  const manifest = inputInventory(frozen), source = inputInventory(repo)
  for (const n of inputs) {
    assert.deepEqual(content(manifest[n]), content(source[n]))
    assert.deepEqual(source[n], read(join(out, 'source-before-copy.json'))[n])
  }
  save('frozen-inputs.json', manifest)
  symlinkSync(deps, join(frozen, pkg, 'node_modules'), 'dir')
  symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  cpSync(join(testing, `${prefix}-cases.test.tsx`),
    join(frozen, 'docs/testing', `${prefix}-cases.test.tsx`), { recursive: true, preserveTimestamps: true })
  save('replay-input.json', originalFixture())
  const oldSource = '/private/tmp/pmtool-a13-closure-20261022/packages/dsh-pm-tool/src/client/views/habits.tsx'
  assert.equal(sha(readFileSync(oldSource)), sha(readFileSync(join(frozen, pkg, 'src/client/views/habits.tsx'))))
  save('candidate.json', {
    at: new Date().toISOString(), head, originMain, sourceTree: repo, frozen, completeInputs: inputs,
    manifestSha: sha(readFileSync(join(out, 'frozen-inputs.json'))), patchSha: sha(patch),
    newFilesSha: sha(readFileSync(join(out, 'candidate-new-inputs.json'))),
    sourceCount: Object.keys(manifest.src).length, oldA13HabitsByteIdentical: true,
    node: process.version, executable: process.execPath, os: os.release(), arch: os.arch(),
    dependencies: Object.fromEntries([...depRoots, viteRoot].map(p => {
      const info = read(join(p, 'package.json')); return [info.name, { root: p, version: info.version }]
    })), originalProtectionPaths: Object.keys(oldProtection).length,
    built: false, gui: false, productEdited: false, passSigned: false,
  })
  console.log(JSON.stringify({ stage, sourceCount: Object.keys(manifest.src).length,
    originalEvidence: originalFixture().indexCount, oldA13HabitsByteIdentical: true }))
} else if (stage === 'run') {
  assert(!existsSync(join(out, 'commands.json')))
  assert.deepEqual(ownStatic(), read(join(out, 'own-static.json')))
  const manifest = read(join(out, 'frozen-inputs.json'))
  assert.deepEqual(inputInventory(frozen), manifest)
  const config = { root: frozen, cacheDir: join(out, 'cache/vite'), test: {
    environment: 'node', cache: false, include: [`docs/testing/${prefix}-cases.test.tsx`,
      `${pkg}/src/client/views/habit-model.test.ts`],
    pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000,
  } }
  save('vitest.config.mjs', `export default ${JSON.stringify(config, null, 2)}\n`)
  const commands = []
  function test(id, files, pattern) {
    const argv = [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', ...files,
      '--config', join(out, 'vitest.config.mjs'), '--no-cache', '--reporter=verbose',
      '--reporter=json', '--outputFile', join(out, `${id}.result.json`),
      ...(pattern ? ['--testNamePattern', pattern] : [])]
    const e = { ...env, HS_FIXTURE: join(out, 'replay-input.json'),
      HS_OBSERVATIONS: join(out, `${id}.observations.jsonl`) }
    const start = new Date().toISOString()
    const r = spawnSync(argv[0], argv.slice(1), { cwd: frozen, env: e, encoding: 'utf8',
      timeout: 180000, maxBuffer: 64 * 1024 * 1024 })
    save(`${id}.stdout.log`, r.stdout ?? '')
    save(`${id}.stderr.log`, r.stderr ?? '')
    const c = { id, argv, cwd: frozen, env: e, start, end: new Date().toISOString(),
      pid: r.pid, originalExit: r.status, signal: r.signal, error: r.error?.message ?? null }
    save(`${id}.command.json`, c)
    commands.push(c)
  }
  const file = `docs/testing/${prefix}-cases.test.tsx`
  test('necessary-red', [file], '^HS-R')
  test('component-controls', [file], '^HS-C')
  test('original-model-controls', [`${pkg}/src/client/views/habit-model.test.ts`])
  save('commands.json', commands)
  const before = read(join(out, 'protected-before.json')), after = capture()
  const drift = Object.fromEntries(protectedRoots.map(p => [p, changed(before[p], after[p])]))
  save('protected-after-run.json', after)
  const results = commands.map(c => {
    const p = join(out, `${c.id}.result.json`), r = existsSync(p) ? read(p) : null
    return { ...c, passed: r?.numPassedTests, failed: r?.numFailedTests, pending: r?.numPendingTests,
      reporterSha: r ? sha(readFileSync(p)) : null, assertions: r?.testResults.flatMap(t => t.assertionResults) }
  })
  const frozenDrift = changed(manifest, inputInventory(frozen))
  save('summary.json', { at: new Date().toISOString(), results, drift, frozenDrift,
    originalRedRetained: true, stop: true, passSigned: false, built: false, gui: false })
  console.log(JSON.stringify({ results: results.map(r => ({ id: r.id, exit: r.originalExit,
    passed: r.passed, failed: r.failed, pending: r.pending })),
    drift: Object.entries(drift).filter(([, v]) => v.length), frozenDrift, stop: true, passSigned: false }))
  // 这是原执行状态，不以“预期红”转换为退出0。
  process.exitCode = results.some(r => r.originalExit !== 0) || Object.values(drift).flat().length ? 1 : 0
} else {
  const before = read(join(out, 'protected-before.json')), after = capture()
  const drift = Object.fromEntries(protectedRoots.map(p => [p, changed(before[p], after[p])]))
  const frozenDrift = changed(read(join(out, 'frozen-inputs.json')), inputInventory(frozen))
  const ownDrift = changed(read(join(out, 'own-static.json')), ownStatic())
  const commands = read(join(out, 'commands.json'))
  const pids = commands.map(c => c.pid).filter(Boolean)
  const argv = ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command=']
  const r = spawnSync(argv[0], argv.slice(1), { cwd: repo, env, encoding: 'utf8' })
  save('process-check.json', { argv, cwd: repo, env, exit: r.status, stdout: r.stdout, stderr: r.stderr })
  const noRecordedChildren = r.status === 1 && !r.stdout.trim()
  originalFixture()
  const preserved = !Object.values(drift).flat().length && !frozenDrift.length && !ownDrift.length
  save('protected-after-seal.json', after)
  save('seal.json', { at: new Date().toISOString(), drift, frozenDrift, ownDrift, preserved,
    noRecordedChildren, released: preserved && noRecordedChildren, stop: true, passSigned: false,
    mainOtherNewEvidenceNotWatched: true, noBuild: true, noProductEdits: true, noGui: true,
    deliverables: Object.fromEntries(readdirSync(testing).filter(n => n.startsWith(prefix) && !n.endsWith('-selftmp'))
      .map(n => [n, inventory(join(testing, n))])) })
  console.log(JSON.stringify({ preserved, noRecordedChildren, released: preserved && noRecordedChildren,
    drift: Object.entries(drift).filter(([, v]) => v.length), stop: true, passSigned: false }))
  process.exitCode = preserved && noRecordedChildren ? 0 : 1
}

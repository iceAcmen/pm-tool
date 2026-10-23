import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  readlinkSync, realpathSync, writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

// 只写本前缀自有目录；所有测试加载冻结未改源码与本轮完整依赖副本。
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a20-file-reflection-contract-20261022'
const testing = join(repo, 'docs/testing')
const out = join(testing, `${prefix}-selftmp/r1`)
const frozen = join(out, 'frozen')
const pkg = 'packages/dsh-pm-tool'
const inputs = ['src', 'scripts', 'locale', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml',
  'tsconfig.json', 'tsconfig.core.json', 'vitest.config.ts', 'tsdown.config.ts', 'cordis.patch.yml']
const sourceDeps = '/private/tmp/pmtool-a19-owned-deps-20261022/node_modules'
const deps = join(frozen, 'node_modules')
const evidence = join(repo, 'reports/all-pending-evidence-20261021/A18/integration-more')
const originalFiles = [
  'command-1792628833825/raw/tasks/t-0003.json',
  'command-1792628833825/raw/reflections/ref-mvisx864-w3fqsq.json',
  'command-1792628833825/commands.json',
]
const originalReport = join(testing, 'a18-integration-more-gui-review-20261022.md')
const protectedRoots = [...inputs.map(p => join(repo, pkg, p)),
  join(repo, pkg, 'lib'), sourceDeps, originalReport, join(evidence, 'index.json'),
  ...originalFiles.map(p => join(evidence, p))]
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(p) {
    const s = lstatSync(p), key = relative(root, p) || '.'
    if (s.isSymbolicLink()) result[key] = { link: readlinkSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else if (s.isFile()) result[key] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
    else assert.fail(`unsupported input type: ${p}`)
  }
  walk(root)
  return result
}
const capture = () => Object.fromEntries(protectedRoots.map(p => [p, inventory(p)]))
const inputCapture = root => Object.fromEntries(inputs.map(p => [p, inventory(join(root, pkg, p))]))
const stableContent = v => Object.fromEntries(Object.entries(v).map(([p, s]) =>
  [p, { sha256: s.sha256, bytes: s.bytes, link: s.link }]))
const changes = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(p => JSON.stringify(a[p]) !== JSON.stringify(b[p]))
function save(name, value) {
  const p = resolve(out, name)
  assert(p.startsWith(`${out}/`))
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
  DSH_HOME: join(out, 'runtime'), CI: 'true', LANG: 'zh_CN.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1',
}
function checkDependencyLinks(root) {
  const tree = inventory(root)
  const links = Object.entries(tree).filter(([, s]) => s.link !== undefined)
  for (const [p] of links) {
    const target = realpathSync(join(root, p))
    assert(target.startsWith(`${root}/`), `dependency link escapes own root: ${p}`)
  }
  return { entries: Object.keys(tree).length, links: links.length, allInsideOwnRoot: true }
}
function originalFixture() {
  const index = read(join(evidence, 'index.json'))
  const records = {}
  for (const p of originalFiles) {
    const b = readFileSync(join(evidence, p))
    assert.equal(b.length, index.files[p].bytes, p)
    assert.equal(sha(b), index.files[p].sha256, p)
    records[p] = JSON.parse(b.toString())
  }
  const task = records[originalFiles[0]].record
  const reflection = records[originalFiles[1]].record
  const events = records[originalFiles[2]]
  const run = events.find(e => e.event.type === 'command/run' && e.event.data.args === ' reflect t-0003')
  assert(run)
  const done = events.find(e => e.event.type === 'command/done' &&
    e.event.data.commandId === run.event.data.commandId)
  assert.equal(done.event.data.kind, 'success')
  assert(done.event.data.text.includes('资料区已登记：（质量由人复核）'))
  assert(done.event.data.text.includes(reflection.id))
  assert.equal(task.attachments.filter(a => a.kind === 'file').length, 1)
  assert.deepEqual(reflection.draft.gaps, [])
  return { task, reflection, origin: originalFiles, indexSha256: sha(readFileSync(join(evidence, 'index.json'))),
    originalHashes: Object.fromEntries(originalFiles.map(p => [p, index.files[p]])),
    originalReportSha256: sha(readFileSync(originalReport)), noNewGui: true }
}
const stage = process.argv[2]
assert(['freeze', 'run', 'seal'].includes(stage))
if (stage === 'freeze') {
  assert(!existsSync(out), 'never overwrite original A20 round')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const p of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, p), { mode: 0o700 })
  save('protected-before.json', capture())
  const commands = []
  function git(id, args) {
    const start = new Date().toISOString()
    const e = { ...env, GIT_OPTIONAL_LOCKS: '0' }
    const r = spawnSync('/usr/bin/git', args, { cwd: repo, env: e, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
    commands.push({ id, argv: ['/usr/bin/git', ...args], cwd: repo, env: e, start,
      end: new Date().toISOString(), pid: r.pid, exit: r.status, signal: r.signal, stderr: r.stderr })
    assert.equal(r.status, 0, r.stderr)
    return r.stdout
  }
  const head = git('head', ['rev-parse', 'HEAD']).trim()
  const origin = git('origin', ['rev-parse', 'origin/main']).trim()
  const patch = git('tracked', ['diff', '--binary', 'HEAD', '--', pkg])
  save('candidate-tracked.patch', patch)
  save('candidate-status.txt', git('status', ['status', '--short', '--branch', '--', pkg]))
  const newFiles = git('new-files', ['ls-files', '--others', '--exclude-standard', '--',
    ...inputs.map(p => `${pkg}/${p}`)]).trim().split('\n').filter(Boolean)
  save('candidate-new-files.json', newFiles.map(p => ({ path: p, ...inventory(join(repo, p))['.'] })))
  save('acquisition-commands.json', commands)
  const before = inputCapture(repo)
  save('source-before-copy.json', before)
  for (const p of inputs) cpSync(join(repo, pkg, p), join(frozen, pkg, p),
    { recursive: true, preserveTimestamps: true })
  const inputManifest = inputCapture(frozen)
  for (const p of inputs) assert.deepEqual(stableContent(before[p]), stableContent(inputManifest[p]))
  assert.deepEqual(inputCapture(repo), before, 'source drift during freeze')
  save('frozen-inputs.json', inputManifest)
  const sourceDepBefore = inventory(sourceDeps)
  save('dependency-source-before-copy.json', sourceDepBefore)
  checkDependencyLinks(sourceDeps)
  cpSync(sourceDeps, deps, { recursive: true, preserveTimestamps: true, verbatimSymlinks: true })
  const ownDeps = inventory(deps)
  assert.deepEqual(stableContent(ownDeps), stableContent(sourceDepBefore))
  assert.deepEqual(inventory(sourceDeps), sourceDepBefore)
  const ownDependencyLinks = checkDependencyLinks(deps)
  save('owned-dependencies.json', ownDeps)
  const casePath = join(testing, `${prefix}-cases.test.ts`)
  cpSync(casePath, join(frozen, 'docs/testing', `${prefix}-cases.test.ts`), { preserveTimestamps: true })
  // 原件本体和测试fixture是机械复制；不覆盖原raw/历史record。
  for (const p of originalFiles) cpSync(join(evidence, p), join(out, 'original', p), { preserveTimestamps: true })
  save('replay-input.json', originalFixture())
  save('owned-static.json', Object.fromEntries(['cases.test.ts', 'run.mjs'].map(p =>
    [p, inventory(join(testing, `${prefix}-${p}`))])))
  save('candidate.json', {
    at: new Date().toISOString(), head, origin, sourceTree: repo, frozen,
    patchSha256: sha(patch), inputManifestSha256: sha(readFileSync(join(out, 'frozen-inputs.json'))),
    newFileManifestSha256: sha(readFileSync(join(out, 'candidate-new-files.json'))),
    dependencyManifestSha256: sha(readFileSync(join(out, 'owned-dependencies.json'))),
    completeInputRoots: inputs, sourceFileCount: Object.keys(inputManifest.src).length,
    ownDependencyLinks, depsSource: sourceDeps, depsRun: deps,
    node: process.version, execPath: process.execPath, platform: os.platform(), arch: os.arch(), release: os.release(),
    reflectionSourceSha256: inputManifest.src['core/reflect.ts'].sha256,
    testCopySha256: sha(readFileSync(casePath)),
    built: false, installed: false, gui: false, productEdited: false, passSigned: false,
  })
  console.log(JSON.stringify({ stage, sourceFiles: Object.keys(inputManifest.src).length,
    ownDependencyLinks, head, stopAfterTests: true, passSigned: false }))
} else if (stage === 'run') {
  assert(!existsSync(join(out, 'commands.json')))
  const manifest = read(join(out, 'frozen-inputs.json'))
  const caseRelative = `docs/testing/${prefix}-cases.test.ts`
  function frozenInputsWithoutOwnTest() {
    return inputCapture(frozen)
  }
  assert.deepEqual(frozenInputsWithoutOwnTest(), manifest)
  assert.deepEqual(inventory(deps), read(join(out, 'owned-dependencies.json')))
  const originalTests = ['reflect.test.ts', 'reflect-l2.test.ts', 'task-materials.test.ts']
    .map(p => `${pkg}/src/core/${p}`)
  const config = { root: frozen, cacheDir: join(out, 'cache/vite'), test: {
    environment: 'node', cache: false, include: [caseRelative, ...originalTests],
    pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1,
    testTimeout: 20000,
  } }
  save('vitest.config.mjs', `export default ${JSON.stringify(config, null, 2)}\n`)
  const commands = []
  for (const [id, files, pattern] of [
    ['necessary-red', [caseRelative], '^FR-R'],
    ['material-controls', [caseRelative], '^FR-C'],
    ['original-tests', originalTests, null],
  ]) {
    const argv = [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', ...files,
      '--config', join(out, 'vitest.config.mjs'), '--no-cache', '--reporter=verbose',
      '--reporter=json', '--outputFile', join(out, `${id}.result.json`),
      ...(pattern ? ['--testNamePattern', pattern] : [])]
    const e = { ...env, FR_FIXTURE: join(out, 'replay-input.json'),
      FR_OBSERVATIONS: join(out, `${id}.observations.jsonl`) }
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
  save('commands.json', commands)
  const after = capture(), before = read(join(out, 'protected-before.json'))
  const drift = Object.fromEntries(protectedRoots.map(p => [p, changes(before[p], after[p])]))
  save('protected-after-run.json', after)
  const frozenDrift = changes(manifest, frozenInputsWithoutOwnTest())
  const dependencyDrift = changes(read(join(out, 'owned-dependencies.json')), inventory(deps))
  const results = commands.map(c => {
    const p = join(out, `${c.id}.result.json`), r = existsSync(p) ? read(p) : null
    return { ...c, passed: r?.numPassedTests, failed: r?.numFailedTests, pending: r?.numPendingTests,
      assertionResults: r?.testResults.flatMap(t => t.assertionResults), reporterSha256: r ? sha(readFileSync(p)) : null }
  })
  save('summary.json', { at: new Date().toISOString(), results, drift, frozenDrift, dependencyDrift,
    originalRedRetained: true, stop: true, passSigned: false, built: false, gui: false })
  console.log(JSON.stringify({ results: results.map(r => ({ id: r.id, exit: r.originalExit,
    passed: r.passed, failed: r.failed, pending: r.pending })),
    drift: Object.entries(drift).filter(([, v]) => v.length), frozenDrift, dependencyDrift,
    stop: true, passSigned: false }))
  process.exitCode = results.some(r => r.originalExit !== 0) ||
    Object.values(drift).flat().length || frozenDrift.length || dependencyDrift.length ? 1 : 0
} else {
  const before = read(join(out, 'protected-before.json')), after = capture()
  const drift = Object.fromEntries(protectedRoots.map(p => [p, changes(before[p], after[p])]))
  const v = inputCapture(frozen)
  const frozenDrift = changes(read(join(out, 'frozen-inputs.json')), v)
  const dependencyDrift = changes(read(join(out, 'owned-dependencies.json')), inventory(deps))
  const ownStatic = Object.fromEntries(['cases.test.ts', 'run.mjs'].map(p =>
    [p, inventory(join(testing, `${prefix}-${p}`))]))
  const ownStaticDrift = changes(read(join(out, 'owned-static.json')), ownStatic)
  const commands = read(join(out, 'commands.json'))
  const pids = commands.map(c => c.pid).filter(Boolean)
  const argv = ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command=']
  const r = spawnSync(argv[0], argv.slice(1), { cwd: out, env, encoding: 'utf8' })
  save('process-check.json', { argv, cwd: out, env, exit: r.status, stdout: r.stdout, stderr: r.stderr })
  const noRecordedChildren = r.status === 1 && !r.stdout.trim()
  originalFixture()
  const preserved = !Object.values(drift).flat().length && !frozenDrift.length &&
    !dependencyDrift.length && !ownStaticDrift.length
  save('protected-after-seal.json', after)
  save('seal.json', { at: new Date().toISOString(), drift, frozenDrift, dependencyDrift, ownStaticDrift,
    preserved, noRecordedChildren, released: noRecordedChildren,
    originalEvidenceRetained: true, stop: true, passSigned: false,
    noBuild: true, noInstall: true, noGui: true, noProductEdits: true, noCommit: true,
    unmonitored: 'Main其他新证据/业务库/外文件/凭据/服务/整盘，未声称零污染',
    deliverables: Object.fromEntries(readdirSync(testing).filter(p => p.startsWith(prefix) && !p.endsWith('-selftmp'))
      .map(p => [p, inventory(join(testing, p))])) })
  console.log(JSON.stringify({ preserved, noRecordedChildren, released: noRecordedChildren,
    drift: Object.entries(drift).filter(([, v]) => v.length),
    frozenDrift, dependencyDrift, ownStaticDrift, stop: true, passSigned: false }))
  process.exitCode = preserved && noRecordedChildren ? 0 : 1
}

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  readlinkSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a15-f02-strict-effects-dom-retest-20261022'
const previous = 'a15-f02-strictmode-auto-20261022'
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const root = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
assert(!existsSync(root), '不得覆盖原证，须用新轮次')
const frozen = join(root, 'frozen')
const domRoot = '/private/tmp/pmtool-f02-dom-deps-20261022'
const candidatePath = join(repo, 'reports/all-pending-evidence-20261021/A13/candidate-final.json')
const candidate = JSON.parse(readFileSync(candidatePath, 'utf8'))
const a14Path = join(repo, 'reports/all-pending-evidence-20261021/A14/candidate.json')
const a14 = JSON.parse(readFileSync(a14Path, 'utf8'))
const source = candidate.tree
assert.equal(source, '/private/tmp/pmtool-a13-closure-20261022')
const dependency = realpathSync(join(source, 'packages/dsh-pm-tool/node_modules'))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fingerprint = path => {
  const bytes = readFileSync(path)
  return { sha256: sha(bytes), bytes: bytes.length, mtimeMs: lstatSync(path).mtimeMs }
}
function scan(base) {
  const result = {}
  const visited = new Set()
  function walk(path) {
    let stat
    try { stat = lstatSync(path) } catch (e) { if (e.code === 'ENOENT') return; throw e }
    if (stat.isSymbolicLink()) {
      result[path] = { link: readlinkSync(path) }
      if (existsSync(path)) {
        result[path].realpath = realpathSync(path)
        walk(result[path].realpath)
      }
    } else if (stat.isDirectory()) {
      const actual = realpathSync(path)
      if (visited.has(actual)) return
      visited.add(actual)
      result[path] = { directory: true }
      for (const name of readdirSync(path).sort()) walk(join(path, name))
    } else if (stat.isFile()) result[path] = fingerprint(path)
  }
  walk(base)
  return result
}
function delta(a, b) {
  return {
    added: Object.keys(b).filter(k => !(k in a)),
    removed: Object.keys(a).filter(k => !(k in b)),
    changed: Object.keys(a).filter(k => k in b && JSON.stringify(a[k]) !== JSON.stringify(b[k])),
  }
}
const empty = value => Object.values(value).every(v => v.length === 0)
mkdirSync(root, { recursive: true, mode: 0o700 })
function save(name, value) {
  const target = resolve(root, name)
  assert(target.startsWith(`${root}/`), '写根越界')
  mkdirSync(dirname(target), { recursive: true, mode: 0o700 })
  writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`)
}
const inputs = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/testing/remaining-journey-cases-20261021.md',
  'reports/all-pending-evidence-20261021/A13/candidate-final.json',
  'reports/all-pending-evidence-20261021/A13/product-tracked.patch',
  'reports/all-pending-evidence-20261021/A13/environment-final.json',
  'reports/all-pending-evidence-20261021/A14/candidate.json',
  ...['plan.md', 'run.mjs', 'cases.test.tsx'].map(s => `docs/testing/${prefix}-${s}`),
  ...['.md', '-plan.md', '-run.mjs', '-cases.test.tsx'].map(s => `docs/testing/${previous}${s}`),
]
function protection() {
  const result = {}
  for (const c of [candidate, a14]) {
    for (const name of new Set([...Object.keys(c.sourceHashes), ...Object.keys(c.artifacts)])) {
      result[join(c.tree, name)] = fingerprint(join(c.tree, name))
    }
  }
  for (const name of inputs) result[join(repo, name)] = fingerprint(join(repo, name))
  for (const name of readdirSync(join(repo, 'docs/testing')).filter(n => n.startsWith(previous))) {
    Object.assign(result, scan(join(repo, 'docs/testing', name)))
  }
  for (const name of ['task-draft-materials.tsx', 'task-draft-materials-stage.test.tsx']) {
    result[join(repo, 'packages/dsh-pm-tool/src/client/shared', name)] =
      fingerprint(join(repo, 'packages/dsh-pm-tool/src/client/shared', name))
  }
  Object.assign(result, scan(join(candidate.tree, 'packages/dsh-pm-tool/lib')),
    scan(join(a14.tree, 'packages/dsh-pm-tool/lib')))
  return result
}
const before = protection()
const depsBefore = { ...scan(dependency), ...scan(domRoot) }
const sharedBefore = {
  ...scan(join(repo, 'packages/dsh-pm-tool/lib')),
  ...scan(join(repo, 'packages/dsh-pm-tool/node_modules/.vite')),
}
save('protected-before.json', before)
save('dependencies-before.json', depsBefore)
save('shared-before.json', sharedBefore)
const records = []
let freezeBefore
let setupError
try {
  for (const c of [candidate, a14]) {
    for (const [name, expected] of Object.entries({ ...c.sourceHashes, ...c.artifacts })) {
      assert.equal(before[join(c.tree, name)].sha256, expected, `声明指纹不符 ${c.tree}/${name}`)
    }
  }
  const material = 'packages/dsh-pm-tool/src/client/shared/task-draft-materials.tsx'
  assert.equal(candidate.sourceHashes[material], '66af8221d089a2ad65fa4d831be218c4a78d3299c23239cfaf750497c4edc2ae')
  assert.equal(before[join(repo, material)].sha256, candidate.sourceHashes[material])
  for (const name of Object.keys(candidate.sourceHashes)) {
    const target = join(frozen, name)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(join(source, name), target)
  }
  cpSync(join(source, 'packages/dsh-pm-tool/src'), join(frozen, 'packages/dsh-pm-tool/src'), { recursive: true })
  for (const name of inputs) {
    const target = join(frozen, name)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(join(repo, name), target)
  }
  for (const [name, expected] of Object.entries(candidate.sourceHashes)) {
    assert.equal(sha(readFileSync(join(frozen, name))), expected, `冻结复制不一致 ${name}`)
  }
  freezeBefore = scan(join(frozen, 'packages/dsh-pm-tool/src'))
  save('frozen-source-before.json', freezeBefore)
  symlinkSync(dependency, join(frozen, 'node_modules'), 'dir')
  symlinkSync(dependency, join(frozen, 'packages/dsh-pm-tool/node_modules'), 'dir')
  const versions = {}
  for (const name of ['react', 'react-dom', 'jsdom']) {
    versions[name] = JSON.parse(readFileSync(join(domRoot, 'node_modules', name, 'package.json'))).version
  }
  assert.deepEqual(versions, { react: '18.3.1', 'react-dom': '18.3.1', jsdom: '25.0.1' })
  assert.equal(sha(readFileSync(join(domRoot, 'package-lock.json'))),
    '15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973')
  const files = [
    'packages/dsh-pm-tool/src/client/shared/task-draft-materials-stage.test.tsx',
    `docs/testing/${previous}-cases.test.tsx`,
    `docs/testing/${prefix}-cases.test.tsx`,
  ]
  const common = { root: frozen, cacheDir: join(root, 'cache/vite'), esbuild: { jsx: 'automatic' },
    test: { environment: 'node', include: files, pool: 'forks', minWorkers: 1, maxWorkers: 1,
      fileParallelism: false, testTimeout: 15000, hookTimeout: 15000 } }
  save('vitest-retained.config.mjs', `export default ${JSON.stringify(common, null, 2)}\n`)
  const aliases = [
    ['react/jsx-dev-runtime', 'react/jsx-dev-runtime.js'],
    ['react/jsx-runtime', 'react/jsx-runtime.js'],
    ['react-dom/client', 'react-dom/client.js'],
    ['react-dom/test-utils', 'react-dom/test-utils.js'],
    ['react-dom', 'react-dom/index.js'], ['react', 'react/index.js'], ['jsdom', 'jsdom/lib/api.js'],
  ].map(([find, name]) => ({ find, replacement: join(domRoot, 'node_modules', name) }))
  save('vitest-dom.config.mjs', `export default ${JSON.stringify({
    ...common, resolve: { alias: aliases, dedupe: ['react', 'react-dom'] },
  }, null, 2)}\n`)
  const env = {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(root, 'home'), TMPDIR: join(root, 'tmp'), TMP: join(root, 'tmp'), TEMP: join(root, 'tmp'),
    XDG_CACHE_HOME: join(root, 'cache'), npm_config_cache: join(root, 'cache/npm'),
    NODE_COMPILE_CACHE: join(root, 'cache/node'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
    F02_EVIDENCE_ROOT: join(root, 'case-evidence'), F02_DOM_DEPS: domRoot,
  }
  for (const name of ['home', 'tmp', 'cache', 'case-evidence']) mkdirSync(join(root, name))
  save('candidate.json', {
    baseline: candidate.baseline, tree: source, candidateSha256: sha(readFileSync(candidatePath)),
    patchSha256: sha(readFileSync(join(repo, inputs[4]))), a14CandidateSha256: sha(readFileSync(a14Path)),
    sourceCount: Object.keys(candidate.sourceHashes).length, artifactCount: Object.keys(candidate.artifacts).length,
    a14: { tree: a14.tree, sourceCount: Object.keys(a14.sourceHashes).length,
      artifactCount: Object.keys(a14.artifacts).length },
    frozen, dependency, domRoot, versions, aliases, env,
    environment: { node: process.version, executable: process.execPath, platform: process.platform,
      arch: process.arch, release: os.release() },
    scope: 'A13 F02 SOURCE/AUTO DOM；非 GUI/A16/全门；前专家文件只读保留',
  })
  function execute(label, file, dom = false) {
    const argv = [join(dependency, 'vitest/vitest.mjs'), 'run', file, '--config',
      join(root, dom ? 'vitest-dom.config.mjs' : 'vitest-retained.config.mjs'),
      '--no-cache', '--reporter=default', '--reporter=json', '--outputFile', join(root, `${label}.result.json`)]
    const start = new Date().toISOString()
    const result = spawnSync(process.execPath, argv, { cwd: frozen, env: {
      ...env, F02_EVIDENCE_ROOT: join(root, 'case-evidence', label),
    }, encoding: 'utf8', timeout: 180000, maxBuffer: 30 * 1024 * 1024 })
    save(`${label}.stdout.log`, result.stdout ?? '')
    save(`${label}.stderr.log`, result.stderr ?? '')
    const record = { label, argv: [process.execPath, ...argv], cwd: frozen,
      env: { ...env, F02_EVIDENCE_ROOT: join(root, 'case-evidence', label) },
      start, end: new Date().toISOString(), exit: result.status, signal: result.signal,
      error: result.error?.message }
    records.push(record)
    save(`${label}.command.json`, record)
    console.log(JSON.stringify({ label, exit: record.exit, signal: record.signal }))
  }
  execute('original-four', files[0])
  execute('previous-four', files[1])
  execute('strict-dom', files[2], true)
} catch (error) {
  setupError = { message: error.message, stack: error.stack }
  save('setup-error.json', setupError)
  console.error(error)
} finally {
  const after = protection()
  const depsAfter = { ...scan(dependency), ...scan(domRoot) }
  const sharedAfter = { ...scan(join(repo, 'packages/dsh-pm-tool/lib')),
    ...scan(join(repo, 'packages/dsh-pm-tool/node_modules/.vite')) }
  save('protected-after.json', after)
  save('dependencies-after.json', depsAfter)
  save('shared-after.json', sharedAfter)
  const audit = { protected: delta(before, after), dependencies: delta(depsBefore, depsAfter),
    shared: delta(sharedBefore, sharedAfter),
    frozenSource: freezeBefore ? delta(freezeBefore, scan(join(frozen, 'packages/dsh-pm-tool/src'))) : null }
  save('audit.json', audit)
  save('summary.json', { records, setupError, audit, endedAt: new Date().toISOString(),
    scope: '仅独立 SOURCE/AUTO，逐项 reporter及控制能力审签，不签 GUI/A16/全门' })
  process.exitCode = setupError || records.length !== 3 || records.some(r => r.exit !== 0)
    || Object.values(audit).some(v => v && !empty(v)) ? 1 : 0
  save('runner-final.json', { intendedExitCode: process.exitCode, observedByCallerRequired: true })
  console.log(JSON.stringify({ audit, exitCode: process.exitCode }))
}

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  readlinkSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prior = join(repo, 'reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1')
const source = join(prior, 'r2/frozen/packages/dsh-pm-tool')
const domSource = join(prior, 'r2/dom-deps')
const own = join(repo, 'reports/all-pending-evidence-20261021/HiddenPredRedR1/r1')
const frozen = join(own, 'frozen/packages/dsh-pm-tool')
const domCopy = join(own, 'dom-deps')
const testPath = 'src/client/task-predecessor-hidden-submit-dom.test.tsx'
const main = join(repo, 'packages/dsh-pm-tool')
const sha = value => createHash('sha256').update(value).digest('hex')
const panelHash = 'fa07af612db1546e8df66cb31fb081087eb8aefcf60fd58d8484dca6664a0947'
assert(!existsSync(own), '不得覆盖旧轮')
assert(existsSync(join(prior, 'r3/close.json')), '仅借已结束设施')

function scan(root) {
  const output = {}
  function walk(path, rel = '') {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) output[rel] = { link: readlinkSync(path), realpath: realpathSync(path) }
    else if (stat.isDirectory()) for (const name of readdirSync(path).sort())
      walk(join(path, name), rel ? `${rel}/${name}` : name)
    else {
      const data = readFileSync(path)
      output[rel] = { bytes: data.length, sha256: sha(data), dev: stat.dev, ino: stat.ino }
    }
  }
  walk(root)
  return output
}
const bytes = manifest => Object.fromEntries(Object.entries(manifest).map(([name, entry]) =>
  [name, entry.link ? { link: entry.link } : { bytes: entry.bytes, sha256: entry.sha256 }]))
function delta(before, after) {
  return {
    added: Object.keys(after).filter(key => !(key in before)),
    removed: Object.keys(before).filter(key => !(key in after)),
    changed: Object.keys(before).filter(key => key in after && JSON.stringify(before[key]) !== JSON.stringify(after[key])),
  }
}
const empty = change => Object.values(change).every(values => values.length === 0)
mkdirSync(own, { recursive: true, mode: 0o700 })
function save(name, value) {
  const path = resolve(own, name)
  assert(path.startsWith(`${own}/`))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function copyDeps(from, to, label) {
  const before = scan(from)
  cpSync(from, to, { recursive: true, dereference: false, verbatimSymlinks: true })
  const after = scan(to)
  assert.deepEqual(bytes(before), bytes(after), `${label}复制字节必须相等`)
  const sharedInodes = Object.keys(after).filter(key => !after[key].link &&
    after[key].dev === before[key].dev && after[key].ino === before[key].ino)
  const externalLinks = Object.keys(after).filter(key => after[key].link && !after[key].realpath.startsWith(`${to}/`))
  save(`${label}-ownership.json`, { from, to, files: Object.values(after).filter(value => !value.link).length,
    links: Object.values(after).filter(value => value.link).length, sharedInodes, externalLinks })
  assert.deepEqual(sharedInodes, [])
  assert.deepEqual(externalLinks, [])
  return after
}

const protectedPaths = {
  'original-r2': join(prior, 'r2'), 'original-r3': join(prior, 'r3'),
  'old-test': join(main, 'src/client/task-predecessor-refs-dom.test.tsx'),
  'old-report': join(repo, 'docs/testing/task-predecessor-checkbox-red-20261022-r1-report.md'),
  'main-lib': join(main, 'lib'), 'main-package': join(main, 'package.json'),
  'main-lock': join(main, 'pnpm-lock.yaml'), 'own-source-test': join(main, testPath),
}
const protection = Object.fromEntries(Object.entries(protectedPaths).map(([name, path]) =>
  [name, { path, before: scan(path) }]))
save('protected-before.json', protection)
save('main-panel-before.json', bytes(scan(join(main, 'src/client/panel.tsx'))))
let execution, facilityError, ownInputBefore, ownDomBefore, ownDepsBefore
try {
  assert.equal(sha(readFileSync(join(source, 'src/client/panel.tsx'))), panelHash)
  mkdirSync(frozen, { recursive: true, mode: 0o700 })
  const entries = readdirSync(source).filter(name =>
    ['src', 'scripts', 'locale'].includes(name) || lstatSync(join(source, name)).isFile())
  const inheritedInputs = {}
  for (const name of entries) {
    cpSync(join(source, name), join(frozen, name), { recursive: true, verbatimSymlinks: true })
    const original = bytes(scan(join(source, name))), copy = bytes(scan(join(frozen, name)))
    assert.deepEqual(original, copy)
    for (const [key, value] of Object.entries(copy)) inheritedInputs[key ? `${name}/${key}` : name] = value
  }
  save('inherited-inputs.json', inheritedInputs)
  for (const name of ['candidate.json', 'complete-inputs.json', 'source-files.json', 'source-files.sha256',
    'tracked-product.diff', 'new-product-files.txt']) {
    mkdirSync(join(own, 'provenance'), { recursive: true, mode: 0o700 })
    cpSync(join(prior, 'r2/provenance', name), join(own, 'provenance', name))
  }
  cpSync(join(prior, 'r2/candidate.json'), join(own, 'provenance/task-pred-candidate.json'))
  cpSync(join(main, testPath), join(frozen, testPath))
  save('test-binding.json', { source: join(main, testPath), frozen: join(frozen, testPath),
    sha256: sha(readFileSync(join(frozen, testPath))), onlyExecutedTest: testPath })
  const suffix = '\nexport { TaskForm }\n'
  const originalPanel = readFileSync(join(frozen, 'src/client/panel.tsx'), 'utf8')
  save('virtual-adapter-panel.tsx', originalPanel + suffix)
  save('virtual-adapter.json', { sourceSha256: sha(originalPanel), transformedSha256: sha(originalPanel + suffix),
    additionOnly: suffix, noComponentOrHookMock: true, productionSourceEdited: false })
  const difference = spawnSync('/usr/bin/diff', ['-u', '--label', 'a/src/client/panel.tsx',
    '--label', 'virtual/src/client/panel.tsx', join(frozen, 'src/client/panel.tsx'), join(own, 'virtual-adapter-panel.tsx')],
  { encoding: 'utf8' })
  save('virtual-adapter-diff.command.json', { exit: difference.status, stdout: difference.stdout,
    stderr: difference.stderr, error: difference.error?.message })
  assert.equal(difference.status, 1)
  save('virtual-adapter.diff', difference.stdout)
  ownDepsBefore = copyDeps(join(source, 'node_modules'), join(frozen, 'node_modules'), 'package-deps')
  mkdirSync(domCopy, { recursive: true, mode: 0o700 })
  for (const name of ['package.json', 'package-lock.json']) cpSync(join(domSource, name), join(domCopy, name))
  copyDeps(join(domSource, 'node_modules'), join(domCopy, 'node_modules'), 'dom-deps')
  assert.equal(sha(readFileSync(join(domCopy, 'package-lock.json'))),
    '15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973')
  const originalConfig = (await import(join(prior, 'r3/vitest.config.mjs'))).default
  const config = {
    ...originalConfig, root: frozen, cacheDir: join(own, 'cache/vite'), plugins: undefined,
    resolve: { ...originalConfig.resolve, alias: originalConfig.resolve.alias.map(alias =>
      ({ ...alias, replacement: alias.replacement.replace(join(prior, 'r2/dom-deps'), domCopy) })) },
    test: { ...originalConfig.test, include: [testPath] },
  }
  save('vitest.config.mjs', `const config = ${JSON.stringify(config, null, 2)}
config.test.server.deps.inline = [/lucide-react/]
config.plugins = [{
  name: 'independent-private-TaskForm-export',
  enforce: 'pre',
  transform(code, id) {
    if (id !== ${JSON.stringify(join(frozen, 'src/client/panel.tsx'))}) return null
    return { code: code + ${JSON.stringify(suffix)}, map: null }
  }
}]
export default config
`)
  ownInputBefore = Object.fromEntries(entries.map(name => [name, bytes(scan(join(frozen, name)))]))
  ownDomBefore = scan(domCopy)
  save('complete-inputs.json', ownInputBefore)
  const parent = JSON.parse(readFileSync(join(prior, 'r2/candidate.json')))
  const versions = Object.fromEntries(['react', 'react-dom', 'jsdom'].map(name =>
    [name, JSON.parse(readFileSync(join(domCopy, 'node_modules', name, 'package.json'))).version]))
  save('candidate.json', { parent, baselineCommit: parent.baselineCommit,
    parentSourceCount: parent.parentCandidate.sourceCount, originalPanelSha256: panelHash,
    inheritedInputCount: Object.keys(inheritedInputs).length, originalParentInputCount: 515,
    additionalTest: testPath, testedSourceRoot: frozen,
    virtualAdapterOnlyExport: true, versions,
    vitest: JSON.parse(readFileSync(join(frozen, 'node_modules/vitest/package.json'))).version,
    configReused: join(prior, 'r3/vitest.config.mjs'),
    boundary: '原107冻结源；只补TPC02 submit；renderer108并行合法不锁；无build/install/noemit/sharedlib/browser/service/Git/key/vendor/正式data',
    runAdapter: '捕获原TaskForm命令，真实handleTaskCommand/core更新合法内存domain；不冒宿主run全链或JSON落盘',
  })
  const env = {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(own, 'home'),
    TMPDIR: join(own, 'tmp'), TMP: join(own, 'tmp'), TEMP: join(own, 'tmp'),
    XDG_CACHE_HOME: join(own, 'cache'), npm_config_cache: join(own, 'cache/npm'),
    DSH_HOME: join(own, 'dsh-home'), QA_EVIDENCE_ROOT: join(own, 'observations'),
    CI: '1', LANG: 'zh_CN.UTF-8', TZ: 'UTC', NODE_ENV: 'development',
  }
  for (const value of Object.values(env).filter(value => value.startsWith(`${own}/`)))
    mkdirSync(value, { recursive: true, mode: 0o700 })
  const args = [join(frozen, 'node_modules/vitest/vitest.mjs'), 'run', '--config', join(own, 'vitest.config.mjs'),
    '--no-cache', '--reporter=default', '--reporter=json', `--outputFile=${join(own, 'vitest.result.json')}`]
  const started = new Date().toISOString()
  const result = spawnSync(process.execPath, args, { cwd: frozen, env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  execution = { argv: [process.execPath, ...args], cwd: frozen, env, node: process.version,
    runnerPid: process.pid, pid: result.pid, started, ended: new Date().toISOString(),
    exit: result.status, signal: result.signal, error: result.error?.message ?? null }
  save('vitest.command.json', execution)
  save('vitest.stdout.txt', result.stdout ?? '')
  save('vitest.stderr.txt', result.stderr ?? '')
  console.log(JSON.stringify(execution))
  console.log(result.stdout ?? '')
  console.error(result.stderr ?? '')
} catch (error) {
  facilityError = { message: error.message, stack: error.stack }
  save('runner-facility-error.json', facilityError)
  console.error(error)
} finally {
  const checks = Object.fromEntries(Object.entries(protection).map(([name, entry]) =>
    [name, delta(entry.before, scan(entry.path))]))
  const ownInputsAfter = ownInputBefore &&
    Object.fromEntries(Object.keys(ownInputBefore).map(name => [name, bytes(scan(join(frozen, name)))]))
  const ownChecks = {
    source: ownInputBefore ? delta(ownInputBefore, ownInputsAfter) : null,
    packageDeps: ownDepsBefore ? delta(ownDepsBefore, scan(join(frozen, 'node_modules'))) : null,
    domDeps: ownDomBefore ? delta(ownDomBefore, scan(domCopy)) : null,
  }
  save('protected-after.json', checks)
  save('main-panel-after.json', bytes(scan(join(main, 'src/client/panel.tsx'))))
  const unchanged = Object.values(checks).every(empty) && Object.values(ownChecks).filter(Boolean).every(empty)
  save('close.json', { protection: checks, ownProtection: ownChecks, allProtectedUnchanged: unchanged,
    execution, facilityError: facilityError ?? null, childExited: !!execution && execution.exit !== null,
    noProductEdits: true, mainPanelIsObservationNotLock: true,
    scope: 'SOURCE/AUTO独立原源submit必要红，不签修后/GUI/整项', release: 'RELEASE_STOP', stop: true })
  save('sealed-evidence.json', bytes(scan(own)))
  process.exitCode = facilityError || !unchanged ? 2 : execution?.exit ?? 2
}

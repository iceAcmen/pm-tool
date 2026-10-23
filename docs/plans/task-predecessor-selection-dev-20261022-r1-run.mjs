import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  readlinkSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Developer evidence only; original independent tests and sealed RED runs are read-only.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const main = join(repo, 'packages/dsh-pm-tool')
const evidence = join(repo, 'reports/all-pending-evidence-20261021')
const prior = join(evidence, 'TaskPredCheckboxRedR1')
const oldPackage = join(prior, 'r2/frozen/packages/dsh-pm-tool')
const oldDom = join(prior, 'r2/dom-deps')
const own = join(evidence, 'TaskPredSelectionDevR1/r1')
const frozen = join(own, 'frozen/packages/dsh-pm-tool')
const domCopy = join(own, 'dom-deps')
const sha = data => createHash('sha256').update(data).digest('hex')
const panelPath = 'src/client/panel.tsx'
const checkboxTest = 'src/client/task-predecessor-refs-dom.test.tsx'
const submitTest = 'src/client/task-predecessor-hidden-submit-dom.test.tsx'
const materialDomTest = 'src/client/shared/task-draft-materials-refs-dom.test.tsx'
const oldPanelSha = 'fa07af612db1546e8df66cb31fb081087eb8aefcf60fd58d8484dca6664a0947'
const affected = [
  'src/commands/task-predecessor-feedback.test.ts',
  'src/commands/task-feedback.test.ts',
  'src/core/task-ops.test.ts',
  'src/core/task-materials.test.ts',
  'src/core/task-inline.test.ts',
  'src/core/tasks-files-atomic.test.ts',
  'src/core/gantt.criticalPath.test.ts',
  'src/client/form-validation.test.ts',
  'src/client/panel-cancel-close.test.ts',
  'src/client/panel-checklist-toggle.test.tsx',
  'src/client/panel-transport-error-feedback.test.tsx',
  'src/client/shared/form-dirty.test.ts',
  'src/client/shared/b2-ops.test.ts',
  'src/client/shared/b2-commands.test.ts',
  'src/client/shared/task-materials-mirror.test.ts',
  'src/client/shared/task-drawer-contract.test.ts',
  'src/client/shared/task-relation-projection.test.ts',
  'src/client/shared/task-draft-materials-stage.test.tsx',
]
assert(!existsSync(own), 'Never overwrite a previous developer run')
assert(existsSync(join(prior, 'r3/close.json')))
assert(existsSync(join(evidence, 'HiddenPredRedR1/r1/close.json')))
mkdirSync(own, { recursive: true, mode: 0o700 })

function save(name, value) {
  const path = resolve(own, name)
  assert(path.startsWith(`${own}/`))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n',
    { flag: 'wx' })
}
function scan(root) {
  const result = {}
  function walk(path, rel = '') {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink())
      result[rel] = { link: readlinkSync(path), realpath: realpathSync(path) }
    else if (stat.isDirectory())
      for (const name of readdirSync(path).sort()) walk(join(path, name), rel ? `${rel}/${name}` : name)
    else {
      const data = readFileSync(path)
      result[rel] = { bytes: data.length, sha256: sha(data), dev: stat.dev, ino: stat.ino }
    }
  }
  walk(root)
  return result
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
function copyDeps(from, to, label) {
  const before = scan(from)
  cpSync(from, to, { recursive: true, dereference: false, verbatimSymlinks: true })
  const after = scan(to)
  assert.deepEqual(bytes(before), bytes(after), `${label} byte equality`)
  const sharedInodes = Object.keys(after).filter(key => !after[key].link &&
    after[key].dev === before[key].dev && after[key].ino === before[key].ino)
  const externalLinks = Object.keys(after).filter(key => after[key].link &&
    !after[key].realpath.startsWith(`${to}/`))
  assert.deepEqual(sharedInodes, [])
  assert.deepEqual(externalLinks, [])
  save(`${label}-ownership.json`, { from, to,
    files: Object.values(after).filter(entry => !entry.link).length,
    links: Object.values(after).filter(entry => entry.link).length,
    sharedInodes, externalLinks, byteEquality: true })
  return after
}
const protectedPaths = {
  'original-checkbox-r2': join(prior, 'r2'),
  'original-checkbox-r3': join(prior, 'r3'),
  'original-submit-r1': join(evidence, 'HiddenPredRedR1/r1'),
  'main-lib': join(main, 'lib'),
  'main-package': join(main, 'package.json'),
  'main-lock': join(main, 'pnpm-lock.yaml'),
  'original-checkbox-test': join(main, checkboxTest),
  'original-submit-test': join(main, submitTest),
  'original-checkbox-report': join(repo, 'docs/testing/task-predecessor-checkbox-red-20261022-r1-report.md'),
  'original-submit-report': join(repo, 'docs/testing/hidden-predecessor-submit-red-20261022-r1-report.md'),
}
const protection = Object.fromEntries(Object.entries(protectedPaths).map(([name, path]) =>
  [name, { path, before: bytes(scan(path)) }]))
save('protected-before.json', protection)
let sourceBefore, depsBefore, domBefore, facilityError
const executions = []
try {
  const parent = JSON.parse(readFileSync(join(prior, 'r2/candidate.json')))
  const oldPanel = readFileSync(join(oldPackage, panelPath), 'utf8')
  assert.equal(sha(oldPanel), oldPanelSha)
  mkdirSync(frozen, { recursive: true, mode: 0o700 })
  const entries = readdirSync(main).filter(name =>
    ['src', 'scripts', 'locale'].includes(name) || lstatSync(join(main, name)).isFile())
  const inputs = {}
  for (const name of entries) {
    const before = bytes(scan(join(main, name)))
    cpSync(join(main, name), join(frozen, name), { recursive: true, verbatimSymlinks: true })
    const copied = bytes(scan(join(frozen, name)))
    assert.deepEqual(before, copied, `Stable copy of ${name}`)
    for (const [rel, entry] of Object.entries(copied)) inputs[rel ? `${name}/${rel}` : name] = entry
  }
  sourceBefore = inputs
  save('complete-inputs.json', inputs)
  save('source-merge-vs-old.json', delta(bytes(scan(join(oldPackage, 'src'))), bytes(scan(join(frozen, 'src')))))
  save('old-panel.tsx', oldPanel)
  const panel = readFileSync(join(frozen, panelPath), 'utf8')
  const inverse = panel
    .replace('// PROD-11：完整受控集合整体替换，搜索只过滤视图；空数组即清空。\n    const predecessorIds = Array.from(checkedIds)',
      "// PROD-11：前置依赖整体替换（多选复选）；空数组即清空。\n    const predecessorIds = form.getAll('predecessorIds').map(String)")
    .replace(`onChange={e => {
                    const checked = e.currentTarget.checked
                    setCheckedIds(prev => {
                      const next = new Set(prev)
                      if (checked) next.add(row.task.id); else next.delete(row.task.id)
                      return next
                    })
                  }}`, `onChange={e => setCheckedIds(prev => {
                    const next = new Set(prev)
                    if (e.currentTarget.checked) next.add(row.task.id); else next.delete(row.task.id)
                    return next
                  })}`)
  assert.equal(sha(inverse), oldPanelSha, 'Only the two authorized production changes')
  const diff = spawnSync('/usr/bin/diff', ['-u', '--label', `before/${panelPath}`, '--label', `after/${panelPath}`,
    join(own, 'old-panel.tsx'), join(frozen, panelPath)], { encoding: 'utf8' })
  assert.equal(diff.status, 1)
  save('product.diff', diff.stdout)
  const readGit = args => {
    const result = spawnSync('/usr/bin/git', ['--no-optional-locks', ...args], {
      cwd: repo, encoding: 'utf8', env: { HOME: own, PATH: '/usr/bin:/bin', GIT_OPTIONAL_LOCKS: '0' },
    })
    assert.equal(result.status, 0)
    return result.stdout
  }
  save('tracked-package.diff', readGit(['diff', '--', 'packages/dsh-pm-tool']))
  save('new-package-files.txt', readGit(['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool']))
  depsBefore = copyDeps(join(oldPackage, 'node_modules'), join(frozen, 'node_modules'), 'package-deps')
  mkdirSync(domCopy, { recursive: true, mode: 0o700 })
  for (const name of ['package.json', 'package-lock.json']) cpSync(join(oldDom, name), join(domCopy, name))
  copyDeps(join(oldDom, 'node_modules'), join(domCopy, 'node_modules'), 'dom-deps')
  domBefore = bytes(scan(domCopy))
  const suffix = '\nexport { TaskForm }\n'
  save('virtual-adapter-panel.tsx', panel + suffix)
  save('virtual-adapter.json', { sourceSha256: sha(panel), virtualSha256: sha(panel + suffix),
    additionOnly: suffix, productionExportAdded: false, noHookOrComponentBodyMock: true })
  const virtualDiff = spawnSync('/usr/bin/diff', ['-u', '--label', panelPath, '--label', `virtual/${panelPath}`,
    join(frozen, panelPath), join(own, 'virtual-adapter-panel.tsx')], { encoding: 'utf8' })
  assert.equal(virtualDiff.status, 1)
  save('virtual-adapter.diff', virtualDiff.stdout)
  save('candidate.json', {
    baselineCommit: readGit(['rev-parse', 'HEAD']).trim(), oldCandidate: parent,
    author: 'trae / TaskPredSelectionDevR1 / developer-not-independent',
    authorBusinessFiles: [panelPath], packageInputCount: Object.keys(inputs).length,
    sourceInputCount: Object.keys(inputs).filter(name => name.startsWith('src/')).length,
    mainTreeIsMergedInputNotWriterLock: true, mainTreeAfterIsObservationOnly: true,
    oldPanelSha256: oldPanelSha, panelSha256: sha(panel), testedSourceRoot: frozen,
    packageVersion: JSON.parse(readFileSync(join(frozen, 'package.json'))).version,
    react: JSON.parse(readFileSync(join(domCopy, 'node_modules/react/package.json'))).version,
    reactDom: JSON.parse(readFileSync(join(domCopy, 'node_modules/react-dom/package.json'))).version,
    jsdom: JSON.parse(readFileSync(join(domCopy, 'node_modules/jsdom/package.json'))).version,
    vitest: JSON.parse(readFileSync(join(frozen, 'node_modules/vitest/package.json'))).version,
    domLockSha256: sha(readFileSync(join(domCopy, 'package-lock.json'))),
    tests: Object.fromEntries([checkboxTest, submitTest, materialDomTest, ...affected]
      .map(name => [name, inputs[name]])),
    runtimeLoaded: false, buildExecuted: false, guiExecuted: false,
    release: 'RELEASE_STOP', acceptance: 'not-self-signed',
  })
  const env = {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(own, 'home'),
    TMPDIR: join(own, 'tmp'), TMP: join(own, 'tmp'), TEMP: join(own, 'tmp'),
    XDG_CACHE_HOME: join(own, 'cache'), npm_config_cache: join(own, 'cache/npm'),
    DSH_HOME: join(own, 'dsh-home'), DSH_PM_FILE_ROOT: join(own, 'files'),
    DSH_PM_BACKUP_DIR: join(own, 'backups'), PM_FILE_ATOMIC_TMP: join(own, 'tmp'),
    CI: '1', LANG: 'zh_CN.UTF-8', TZ: 'UTC', NODE_ENV: 'development',
  }
  for (const value of Object.values(env).filter(value => value.startsWith(`${own}/`)))
    mkdirSync(value, { recursive: true, mode: 0o700 })
  const baseTest = { environment: 'node', pool: 'forks', poolOptions: { forks: { singleFork: true } },
    minWorkers: 1, maxWorkers: 1, fileParallelism: false, testTimeout: 15000, hookTimeout: 15000 }
  function run(name, tests, domAdapter) {
    const runRoot = join(own, name)
    mkdirSync(runRoot, { recursive: true, mode: 0o700 })
    const config = { root: frozen, cacheDir: join(runRoot, 'cache/vite'),
      esbuild: { jsx: 'automatic' }, test: { ...baseTest, include: tests } }
    if (domAdapter) {
      // Explicit aliases mirror r3; the old config module and worker are never executed.
      config.resolve = { alias: [
        ['react/jsx-dev-runtime', 'react/jsx-dev-runtime.js'],
        ['react-dom/test-utils', 'react-dom/test-utils.js'],
        ['react/jsx-runtime', 'react/jsx-runtime.js'],
        ['react-dom/client', 'react-dom/client.js'],
        ['react-dom', 'react-dom/index.js'], ['react', 'react/index.js'], ['jsdom', 'jsdom/lib/api.js'],
      ].map(([find, target]) => ({ find, replacement: join(domCopy, 'node_modules', target) })) }
    }
    let text = `const config = ${JSON.stringify(config, null, 2)}\n`
    if (domAdapter) text += `config.test.server = { deps: { inline: [/lucide-react/] } }
config.plugins = [{
  name: 'developer-private-TaskForm-export',
  enforce: 'pre',
  transform(code, id) {
    if (id !== ${JSON.stringify(join(frozen, panelPath))}) return null
    return { code: code + ${JSON.stringify(suffix)}, map: null }
  }
}]
`
    text += 'export default config\n'
    save(`${name}/vitest.config.mjs`, text)
    const observations = join(runRoot, 'observations')
    mkdirSync(observations, { recursive: true, mode: 0o700 })
    const runEnv = { ...env, QA_EVIDENCE_ROOT: observations }
    const args = [join(frozen, 'node_modules/vitest/vitest.mjs'), 'run',
      '--config', join(runRoot, 'vitest.config.mjs'), '--no-cache',
      '--reporter=default', '--reporter=json', `--outputFile=${join(runRoot, 'vitest.result.json')}`]
    const started = new Date().toISOString()
    const result = spawnSync(process.execPath, args, { cwd: frozen, env: runEnv,
      encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 180000 })
    const execution = { name, argv: [process.execPath, ...args], cwd: frozen, env: runEnv,
      runnerPid: process.pid, pid: result.pid, started, ended: new Date().toISOString(),
      node: process.version, exit: result.status, signal: result.signal, error: result.error?.message ?? null }
    executions.push(execution)
    save(`${name}/vitest.command.json`, execution)
    save(`${name}/vitest.stdout.txt`, result.stdout ?? '')
    save(`${name}/vitest.stderr.txt`, result.stderr ?? '')
    const resultPath = join(runRoot, 'vitest.result.json')
    const report = existsSync(resultPath) ? JSON.parse(readFileSync(resultPath)) : null
    const summary = { ...execution, files: report?.testResults?.length,
      tests: report?.numTotalTests, green: report?.numPassedTests, failed: report?.numFailedTests,
      pending: report?.numPendingTests,
      cases: report?.testResults?.flatMap(file => file.assertionResults.map(item => ({
        file: file.name.slice(frozen.length + 1), name: item.fullName, status: item.status,
        failureMessages: item.failureMessages,
      }))) }
    save(`${name}/summary.json`, summary)
    console.log(JSON.stringify({ name, exit: execution.exit, files: summary.files,
      tests: summary.tests, green: summary.green, failed: summary.failed, pending: summary.pending }))
  }
  run('original-seven', [checkboxTest], true)
  run('real-submit-five', [submitTest], true)
  run('affected', affected, false)
  run('material-refs-dom', [materialDomTest], true)
} catch (error) {
  facilityError = { message: error.message, stack: error.stack }
  save('facility-error.json', facilityError)
  console.error(error)
} finally {
  const protectedAfter = Object.fromEntries(Object.entries(protection).map(([name, entry]) =>
    [name, delta(entry.before, bytes(scan(entry.path)))]))
  const ownChecks = {
    source: sourceBefore ? delta(sourceBefore, Object.fromEntries(
      Object.keys(sourceBefore).map(name => [name, bytes(scan(join(frozen, name)))['']]))) : null,
    packageDeps: depsBefore ? delta(bytes(depsBefore), bytes(scan(join(frozen, 'node_modules')))) : null,
    domDeps: domBefore ? delta(domBefore, bytes(scan(domCopy))) : null,
  }
  const unchanged = Object.values(protectedAfter).every(empty) &&
    Object.values(ownChecks).filter(Boolean).every(empty)
  save('protected-after.json', protectedAfter)
  save('main-source-after-observation.json', bytes(scan(join(main, 'src'))))
  save('close.json', { executions, facilityError: facilityError ?? null,
    protection: protectedAfter, ownProtection: ownChecks, allProtectedUnchanged: unchanged,
    childExited: executions.every(item => item.exit !== null && !item.signal),
    onlyProductEdits: [panelPath], release: 'RELEASE_STOP', independentAcceptance: 'NOT_SIGNED',
    mainTreeNotLocked: true, old107FrozenTreeAndRuntimeNotWrittenOrControlled: true,
    boundaries: 'No install/build/noEmit/verify/GUI/service/key/vendor/formal data/upstream/Git write; merged-source subset only' })
  save('sealed-evidence.json', bytes(scan(own)))
  process.exitCode = facilityError || !unchanged ? 2 : executions.some(item => item.exit !== 0) ? 1 : 0
}

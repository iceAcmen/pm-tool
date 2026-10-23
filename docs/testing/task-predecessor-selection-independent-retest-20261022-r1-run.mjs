import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  readlinkSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adaptC02, originalTestSha, sha } from './task-predecessor-selection-independent-retest-20261022-r1-adapter.mjs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const main = join(repo, 'packages/dsh-pm-tool')
const evidence = join(repo, 'reports/all-pending-evidence-20261021')
const dev = join(evidence, 'TaskPredSelectionDevR1/r1')
const input = join(dev, 'frozen/packages/dsh-pm-tool')
const own = join(evidence, 'TaskPredSelectionRetestR1/r1')
const frozen = join(own, 'frozen/packages/dsh-pm-tool')
const dom = join(own, 'dom-deps')
const panelFile = 'src/client/panel.tsx'
const sevenFile = 'src/client/task-predecessor-refs-dom.test.tsx'
const fiveFile = 'src/client/task-predecessor-hidden-submit-dom.test.tsx'
const materialsFile = 'src/client/shared/task-draft-materials-refs-dom.test.tsx'
const panelSha = '581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d'
const oldPanelSha = 'fa07af612db1546e8df66cb31fb081087eb8aefcf60fd58d8484dca6664a0947'
const fiveSha = 'ff3897e963641159ffd6d59e9bf0a8a2d8c52631857b630dcc9470e2437b1988'
const affected = [
  'src/commands/task-predecessor-feedback.test.ts', 'src/commands/task-feedback.test.ts',
  'src/core/task-ops.test.ts', 'src/core/task-materials.test.ts', 'src/core/task-inline.test.ts',
  'src/core/tasks-files-atomic.test.ts', 'src/core/gantt.criticalPath.test.ts',
  'src/client/form-validation.test.ts', 'src/client/panel-cancel-close.test.ts',
  'src/client/panel-checklist-toggle.test.tsx', 'src/client/panel-transport-error-feedback.test.tsx',
  'src/client/shared/form-dirty.test.ts', 'src/client/shared/b2-ops.test.ts',
  'src/client/shared/b2-commands.test.ts', 'src/client/shared/task-materials-mirror.test.ts',
  'src/client/shared/task-drawer-contract.test.ts', 'src/client/shared/task-relation-projection.test.ts',
  'src/client/shared/task-draft-materials-stage.test.tsx',
]
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const bytes = manifest => Object.fromEntries(Object.entries(manifest).map(([name, entry]) =>
  [name, entry.link ? { link: entry.link } : { bytes: entry.bytes, sha256: entry.sha256 }]))
function scan(root) {
  const manifest = {}
  function walk(path, rel = '') {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) manifest[rel] = { link: readlinkSync(path), realpath: realpathSync(path) }
    else if (stat.isDirectory()) {
      for (const name of readdirSync(path).sort()) walk(join(path, name), rel ? `${rel}/${name}` : name)
    } else {
      const data = readFileSync(path)
      manifest[rel] = { bytes: data.length, sha256: sha(data), dev: stat.dev, ino: stat.ino }
    }
  }
  walk(root)
  return manifest
}
function delta(before, after) {
  return {
    added: Object.keys(after).filter(key => !(key in before)),
    removed: Object.keys(before).filter(key => !(key in after)),
    changed: Object.keys(before).filter(key => key in after && JSON.stringify(before[key]) !== JSON.stringify(after[key])),
  }
}
const empty = diff => Object.values(diff).every(list => list.length === 0)
assert(!existsSync(own), 'Never overwrite prior independent evidence')
mkdirSync(own, { recursive: true, mode: 0o700 })
function save(name, value) {
  const path = resolve(own, name)
  assert(path.startsWith(`${own}/`))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function copyDeps(from, to, label) {
  const before = scan(from)
  cpSync(from, to, { recursive: true, verbatimSymlinks: true })
  const after = scan(to)
  assert.deepEqual(bytes(after), bytes(before), `${label} byte identity`)
  const sharedInodes = Object.keys(after).filter(key => !after[key].link &&
    after[key].dev === before[key].dev && after[key].ino === before[key].ino)
  const externalLinks = Object.keys(after).filter(key => after[key].link &&
    !after[key].realpath.startsWith(`${to}/`))
  assert.deepEqual(sharedInodes, [])
  assert.deepEqual(externalLinks, [])
  save(`${label}-ownership.json`, { from, to, byteIdentity: true, sharedInodes, externalLinks,
    files: Object.values(after).filter(v => !v.link).length,
    links: Object.values(after).filter(v => v.link).length })
  return bytes(after)
}
const protectedPaths = {
  'old-checkbox-r2': join(evidence, 'TaskPredCheckboxRedR1/r2'),
  'old-checkbox-r3': join(evidence, 'TaskPredCheckboxRedR1/r3'),
  'old-submit-r1': join(evidence, 'HiddenPredRedR1/r1'),
  'developer-r1': dev,
  'main-lib': join(main, 'lib'), 'main-package': join(main, 'package.json'),
  'main-lock': join(main, 'pnpm-lock.yaml'),
  'old-seven-test': join(main, sevenFile), 'old-five-test': join(main, fiveFile),
  'old-seven-plan': join(repo, 'docs/testing/task-predecessor-checkbox-red-20261022-r1-plan.md'),
  'old-seven-report': join(repo, 'docs/testing/task-predecessor-checkbox-red-20261022-r1-report.md'),
  'old-five-plan': join(repo, 'docs/testing/hidden-predecessor-submit-red-20261022-r1-plan.md'),
  'old-five-report': join(repo, 'docs/testing/hidden-predecessor-submit-red-20261022-r1-report.md'),
  'developer-report': join(repo, 'docs/plans/task-predecessor-selection-dev-20261022-r1-report.md'),
}
const protectedBefore = Object.fromEntries(Object.entries(protectedPaths).map(([key, path]) =>
  [key, { path, before: bytes(scan(path)) }]))
save('protected-before.json', protectedBefore)
const executions = []
let sourceBefore, depsBefore, domBefore, facilityError = null
try {
  const candidate = json(join(dev, 'candidate.json'))
  const declared = json(join(dev, 'complete-inputs.json'))
  mkdirSync(frozen, { recursive: true, mode: 0o700 })
  for (const name of readdirSync(input).filter(name => name !== 'node_modules')) {
    cpSync(join(input, name), join(frozen, name), { recursive: true, verbatimSymlinks: true })
  }
  sourceBefore = bytes(scan(frozen))
  assert.deepEqual(sourceBefore, declared, 'Entire declared developer input, not old107 inherited')
  save('complete-inputs.json', sourceBefore)
  const panel = readFileSync(join(frozen, panelFile), 'utf8')
  assert.equal(sha(panel), panelSha)
  assert.equal(sha(readFileSync(join(frozen, sevenFile))), originalTestSha)
  assert.equal(sha(readFileSync(join(frozen, fiveFile))), fiveSha)
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
  assert.equal(sha(inverse), oldPanelSha, 'Exactly two authorized edits')
  save('old-panel-for-diff.tsx', inverse)
  const diff = spawnSync('/usr/bin/diff', ['-u', '--label', `before/${panelFile}`, '--label', `after/${panelFile}`,
    join(own, 'old-panel-for-diff.tsx'), join(frozen, panelFile)], { encoding: 'utf8' })
  assert.equal(diff.status, 1)
  save('independent-product.diff', diff.stdout)
  for (const name of ['tracked-package.diff', 'new-package-files.txt', 'source-merge-vs-old.json'])
    save(`developer-input-binding/${name}`, readFileSync(join(dev, name), 'utf8'))
  save('main-source-before-observation.json', bytes(scan(join(main, 'src'))))
  depsBefore = copyDeps(join(input, 'node_modules'), join(frozen, 'node_modules'), 'package-deps')
  mkdirSync(dom, { recursive: true, mode: 0o700 })
  for (const name of ['package.json', 'package-lock.json'])
    cpSync(join(dev, 'dom-deps', name), join(dom, name))
  copyDeps(join(dev, 'dom-deps/node_modules'), join(dom, 'node_modules'), 'dom-deps')
  domBefore = bytes(scan(dom))
  assert.equal(sha(readFileSync(join(dom, 'package-lock.json'))), candidate.domLockSha256)
  const adapted = adaptC02(readFileSync(join(frozen, sevenFile), 'utf8'))
  save('C02-adapter.json', { ...adapted, adapted: undefined })
  save('C02-adapted-seven.test.tsx', adapted.adapted)
  const testDiff = spawnSync('/usr/bin/diff', ['-u', '--label', sevenFile, '--label', `independent-C02/${sevenFile}`,
    join(frozen, sevenFile), join(own, 'C02-adapted-seven.test.tsx')], { encoding: 'utf8' })
  assert.equal(testDiff.status, 1)
  save('C02-adapter.diff', testDiff.stdout)
  const suffix = '\nexport { TaskForm }\n'
  save('virtual-panel.tsx', panel + suffix)
  save('virtual-panel.json', { originalSha256: sha(panel), virtualSha256: sha(panel + suffix),
    suffix, noHookOrComponentMock: true, noProductionFileWrite: true })
  const exportDiff = spawnSync('/usr/bin/diff', ['-u', '--label', panelFile, '--label', `virtual/${panelFile}`,
    join(frozen, panelFile), join(own, 'virtual-panel.tsx')], { encoding: 'utf8' })
  assert.equal(exportDiff.status, 1)
  save('virtual-panel.diff', exportDiff.stdout)
  save('candidate.json', {
    author: 'trae / TaskPredSelectionRetestR1 / independent SOURCE-AUTO, non-developer, non-GUI',
    baselineCommit: candidate.baselineCommit, developerCandidate: candidate,
    sourceInputCount: Object.keys(sourceBefore).filter(name => name.startsWith('src/')).length,
    packageInputCount: Object.keys(sourceBefore).length, testedSourceRoot: frozen,
    sourceIdentity: 'Entire developer r1 frozen input copied and fingerprinted; independent subset execution only',
    panelSha256: panelSha, oldPanelSha256: oldPanelSha,
    version: candidate.packageVersion,
    dependencyVersions: Object.fromEntries(['react', 'react-dom', 'jsdom'].map(name =>
      [name, json(join(dom, 'node_modules', name, 'package.json')).version])),
    vitest: json(join(frozen, 'node_modules/vitest/package.json')).version,
    domLockSha256: candidate.domLockSha256,
    tests: [sevenFile, fiveFile, materialsFile, ...affected],
    oracleCorrection: 'Only independently adapted C02; original-seven raw failure retained',
    buildExecuted: false, runtimeLoaded: false, guiExecuted: false,
    release: 'RELEASE_STOP', mainOtherWritersNotLocked: true,
  })
  const env = {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(own, 'home'),
    TMPDIR: join(own, 'tmp'), TMP: join(own, 'tmp'), TEMP: join(own, 'tmp'),
    XDG_CACHE_HOME: join(own, 'cache'), npm_config_cache: join(own, 'cache/npm'),
    DSH_HOME: join(own, 'dsh-home'), DSH_PM_FILE_ROOT: join(own, 'files'),
    DSH_PM_BACKUP_DIR: join(own, 'backups'), PM_FILE_ATOMIC_TMP: join(own, 'tmp'),
    CI: '1', LANG: 'zh_CN.UTF-8', TZ: 'UTC', NODE_ENV: 'development',
  }
  for (const path of Object.values(env).filter(value => value.startsWith(`${own}/`)))
    mkdirSync(path, { recursive: true, mode: 0o700 })
  function run(name, tests, useDom, useAdapted = false) {
    const runRoot = join(own, name)
    mkdirSync(runRoot, { recursive: true, mode: 0o700 })
    const config = { root: frozen, cacheDir: join(runRoot, 'cache/vite'),
      esbuild: { jsx: 'automatic' },
      test: { environment: 'node', pool: 'forks', poolOptions: { forks: { singleFork: true } },
        minWorkers: 1, maxWorkers: 1, fileParallelism: false, testTimeout: 15000, hookTimeout: 15000,
        include: tests } }
    if (useDom) {
      config.resolve = { alias: [
        ['react/jsx-dev-runtime', 'react/jsx-dev-runtime.js'], ['react-dom/test-utils', 'react-dom/test-utils.js'],
        ['react/jsx-runtime', 'react/jsx-runtime.js'], ['react-dom/client', 'react-dom/client.js'],
        ['react-dom', 'react-dom/index.js'], ['react', 'react/index.js'], ['jsdom', 'jsdom/lib/api.js'],
      ].map(([find, target]) => ({ find, replacement: join(dom, 'node_modules', target) })) }
    }
    let text = `const config = ${JSON.stringify(config, null, 2)}\n`
    if (useDom) text += `config.test.server = { deps: { inline: [/lucide-react/] } }
config.plugins = [{
  name: 'independent-private-TaskForm-export-only',
  enforce: 'pre',
  transform(code, id) {
    if (id !== ${JSON.stringify(join(frozen, panelFile))}) return null
    return { code: code + ${JSON.stringify(suffix)}, map: null }
  }
}]
`
    if (useAdapted) text += `config.plugins.push({
  name: 'independent-C02-contract-test-adapter',
  enforce: 'pre',
  transform(code, id) {
    if (id !== ${JSON.stringify(join(frozen, sevenFile))}) return null
    return { code: ${JSON.stringify(adapted.adapted)}, map: null }
  }
})
`
    text += 'export default config\n'
    save(`${name}/vitest.config.mjs`, text)
    const observations = join(runRoot, 'observations')
    mkdirSync(observations, { recursive: true, mode: 0o700 })
    const runEnv = { ...env, QA_EVIDENCE_ROOT: observations }
    const args = [join(frozen, 'node_modules/vitest/vitest.mjs'), 'run', '--config',
      join(runRoot, 'vitest.config.mjs'), '--no-cache', '--reporter=default', '--reporter=json',
      `--outputFile=${join(runRoot, 'vitest.result.json')}`]
    const started = new Date().toISOString()
    const result = spawnSync(process.execPath, args, { cwd: frozen, env: runEnv, encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024, timeout: 180000 })
    const execution = { name, argv: [process.execPath, ...args], cwd: frozen, env: runEnv,
      runnerPid: process.pid, pid: result.pid, node: process.version, started, ended: new Date().toISOString(),
      exit: result.status, signal: result.signal, error: result.error?.message ?? null }
    executions.push(execution)
    save(`${name}/vitest.command.json`, execution)
    save(`${name}/vitest.stdout.txt`, result.stdout ?? '')
    save(`${name}/vitest.stderr.txt`, result.stderr ?? '')
    const report = existsSync(join(runRoot, 'vitest.result.json')) ? json(join(runRoot, 'vitest.result.json')) : null
    const summary = { ...execution, files: report?.testResults.length, tests: report?.numTotalTests,
      green: report?.numPassedTests, failed: report?.numFailedTests, pending: report?.numPendingTests,
      unhandledErrors: report?.numRuntimeErrorTestSuites,
      cases: report?.testResults.flatMap(file => file.assertionResults.map(item => ({
        file: file.name.slice(frozen.length + 1), name: item.fullName, status: item.status,
        failureMessages: item.failureMessages,
      }))) }
    save(`${name}/summary.json`, summary)
    console.log(JSON.stringify({ name, exit: summary.exit, files: summary.files, tests: summary.tests,
      green: summary.green, failed: summary.failed, pending: summary.pending }))
  }
  run('original-seven', [sevenFile], true)
  run('adapted-seven', [sevenFile], true, true)
  run('real-submit-five', [fiveFile], true)
  run('affected', affected, false)
  run('material-refs-dom', [materialsFile], true)
} catch (error) {
  facilityError = { message: error.message, stack: error.stack }
  save('facility-error.json', facilityError)
  console.error(error)
} finally {
  const protection = Object.fromEntries(Object.entries(protectedBefore).map(([name, value]) =>
    [name, delta(value.before, bytes(scan(value.path)))]))
  const ownProtection = {
    source: sourceBefore ? delta(sourceBefore, Object.fromEntries(Object.keys(sourceBefore).map(name =>
      [name, bytes(scan(join(frozen, name)))['']]))) : null,
    packageDeps: depsBefore ? delta(depsBefore, bytes(scan(join(frozen, 'node_modules')))) : null,
    domDeps: domBefore ? delta(domBefore, bytes(scan(dom))) : null,
  }
  const allProtectedUnchanged = Object.values(protection).every(empty) &&
    Object.values(ownProtection).filter(Boolean).every(empty)
  save('protected-after.json', protection)
  const mainAfter = bytes(scan(join(main, 'src')))
  save('main-source-after-observation.json', mainAfter)
  save('main-vs-frozen-source-observation.json', sourceBefore ? delta(
    Object.fromEntries(Object.entries(sourceBefore).filter(([name]) => name.startsWith('src/'))
      .map(([name, value]) => [name.slice(4), value])), mainAfter) : null)
  save('close.json', { executions, facilityError, protection, ownProtection, allProtectedUnchanged,
    childExited: executions.every(item => item.exit !== null && !item.signal && !item.error),
    mainOtherWritersNotLocked: true, release: 'RELEASE_STOP',
    boundary: 'No business/old test writes, install/build/type/shared cache/Git write/service/browser/key/vendor/formal data/upstream',
    acceptance: 'Await independent raw evidence adjudication; original C02 failure retained' })
  save('sealed-evidence.json', bytes(scan(own)))
  // Raw runner stays nonzero on original C02. A later audit is not a green rewrite.
  process.exitCode = facilityError || !allProtectedUnchanged ? 2 : executions.some(item => item.exit !== 0) ? 1 : 0
}

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'docs/testing/a11-meeting-layout-independent-retest-20261021'
const own = join(root, `${prefix}-selftmp`)
const hash = value => createHash('sha256').update(value).digest('hex')
const fp = path => ({ bytes: statSync(path).size, sha256: hash(readFileSync(path)) })
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const freeze = json(join(own, 'freeze.json'))
const audit = json(join(own, 'source-audit.json'))
const final = json(join(own, 'final-audit.json'))
const form = 'src/client/views/records/records-meeting-form.tsx'
const before = readFileSync(join(own, 'a10-control', form), 'utf8')
const after = readFileSync(join(own, 'frozen', form), 'utf8')
assert.equal(before.slice(0, before.indexOf('      {meeting && (')), after.slice(0, after.indexOf('      {meeting && (')))
assert.equal(before.slice(before.indexOf('      </fieldset>')), after.slice(after.indexOf('      </fieldset>')))
for (const [name, dep] of Object.entries(freeze.dependencies)) {
  assert.deepEqual(fp(dep.path), { bytes: dep.bytes, sha256: dep.sha256 }, `${name}依赖声明漂移`)
}
for (const file of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']) {
  assert.deepEqual(fp(join(root, 'packages/dsh-pm-tool', file)), fp(join(own, 'frozen', file)))
}
assert.equal(fp(join(root, `${prefix}-cases.test.tsx`)).sha256, freeze.independentTest.sha256)
assert.deepEqual(fp(join(own, 'frozen/src/client/views/records/a11-independent.test.tsx')), freeze.independentTest)
assert.deepEqual(final.frozenSourceDrift, [])
assert.deepEqual(final.liveDrift, [])
assert.deepEqual(final.sharedCacheDrift, [])
const patches = {}
for (const file of [form, 'src/client/views/records.css']) {
  const argv = ['-u', join(own, 'a10-control', file), join(own, 'frozen', file)]
  const r = spawnSync('diff', argv, { encoding: 'utf8' })
  assert.equal(r.status, 1, '有界修复应有增量')
  const output = join(own, `${file.endsWith('tsx') ? 'form' : 'css'}-independent.patch`)
  writeFileSync(output, r.stdout)
  patches[file] = { command: 'diff', argv, exit: r.status, patch: fp(output) }
}
const inputPaths = [
  'AGENTS.md', 'docs/collaboration.md', 'reports/all-pending-acceptance-execution-20261021.md',
  'docs/testing/a10-meeting-gui-independent-review-20261021.md',
  'docs/plans/2026-10-21-meeting-action-layout-closure.md',
  'reports/a11-meeting-action-layout-developer-20261021.md',
  'reports/a11-meeting-action-layout-developer-20261021-selftmp/meeting-form-developer.patch',
  'reports/a11-meeting-action-layout-developer-20261021-selftmp/records-css-developer.patch',
]
const tagCounts = {}
for (const entry of audit.controlledAttributes.filter(entry => entry.tag)) tagCounts[entry.tag] = (tagCounts[entry.tag] ?? 0) + 1
const r = spawnSync('pgrep', ['-fl', '[a]11-meeting-layout-independent-retest-20261021-run.mjs'], { encoding: 'utf8' })
assert.equal(r.status, 1, `本轮runner尚存活 ${r.stdout}`)
const result = {
  time: new Date().toISOString(), command: process.execPath, argv: [fileURLToPath(import.meta.url)],
  exit: 0, sourceFiles: Object.keys(json(join(own, 'source-manifest.json'))).length,
  unrelatedFormRenderPrefixFooterEqual: true, dependenciesAndDeclarationsUnchanged: true,
  independentTestUnchanged: true, controlTagCounts: tagCounts, patches,
  inputsAtFinalRead: Object.fromEntries(inputPaths.map(path => [path, fp(join(root, path))])),
  runnerTerminationCheck: { command: 'pgrep', argv: ['-fl', '[a]11-meeting-layout-independent-retest-20261021-run.mjs'],
    exit: r.status, stdout: r.stdout, stderr: r.stderr },
  commands: final.commands.map(c => ({ phase: c.phase, command: c.command, argv: c.argv, cwd: c.cwd, exit: c.exit, tests: c.tests })),
  limitation: '首freeze调用yield=1000返回异步ID；外层终端exit未回收，不伪造。当前同步proof重新验证完整冻结、声明与所有测试原件并确认runner退出。',
}
writeFileSync(join(own, 'proof.json'), `${JSON.stringify(result, null, 2)}\n`)
function files(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? files(join(path, entry.name)) : entry.isFile() ? [join(path, entry.name)] : [])
}
const evidence = Object.fromEntries(files(own).filter(path => !path.endsWith('/evidence-index.json')).map(path =>
  [relative(root, path), fp(path)]))
writeFileSync(join(own, 'evidence-index.json'), `${JSON.stringify(evidence, null, 2)}\n`)
console.log(`proof exit0: ${result.sourceFiles} source files, ${Object.keys(evidence).length} evidence files; no owned runner`)

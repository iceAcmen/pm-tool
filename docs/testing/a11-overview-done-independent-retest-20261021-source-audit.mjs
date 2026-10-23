/** 只读原候选与作者原证；审计输出仅写本前缀selftmp。 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a11-overview-done-independent-retest-20261021'
const root = join(repo, 'docs/testing', `${prefix}-selftmp`)
const output = join(root, 'source-review.json')
assert(!existsSync(output), '原证不覆盖')
const start = new Date().toISOString()
const frozen = join(root, 'frozen')
const pkg = join(frozen, 'packages/dsh-pm-tool')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = file => JSON.parse(readFileSync(file, 'utf8'))
const read = file => readFileSync(file, 'utf8')
const fixture = json(join(frozen,
  'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json'))
const oldSource = join(frozen, 'reports/a11-overview-done-card-developer-20261021-evidence/red/overview.tsx')
const overviewPath = join(pkg, 'src/client/views/overview.tsx')
const old = read(oldSource)
const current = read(overviewPath)
assert(old.includes("const isTaskDone = (t: Task): boolean => t.status === 'done' || (t.progress ?? 0) >= 100"))
assert(old.includes('const done = tasks.filter(isTaskDone).length'))
assert(old.includes('{kpi.doneRate}% 已完成'))
assert(current.includes("const done = tasks.filter(t => t.status === 'done').length"))
assert(current.includes('const doneRate = tasks.length ? Math.round(done / tasks.length * 100) : 0'))
assert(current.includes('{doneRate}% 已完成'))
assert(!current.includes('kpi.doneRate'))
assert(current.includes("const wrappedCount = tasks.filter(t => t.status === 'wrapped').length"))
const diff = spawnSync('/usr/bin/diff', ['-u', oldSource, overviewPath], { encoding: 'utf8' })
assert.equal(diff.status, 1)
writeFileSync(join(root, 'independently-derived-local.patch'), diff.stdout)
const archivedPatch = read(join(frozen, 'reports/a11-overview-done-card-developer-20261021-evidence/regression/owned-overview.patch'))
assert.equal(diff.stdout.split('\n').slice(2).join('\n'), archivedPatch.split('\n').slice(2).join('\n'))

const archived = {}
const manifests = {}
for (const round of ['red', 'green', 'regression']) {
  const base = join(frozen, `reports/a11-overview-done-card-developer-20261021-evidence/${round}`)
  const command = json(join(base, 'command.json'))
  const result = json(join(base, 'vitest-result.json'))
  const after = json(join(base, 'source-after.json'))
  manifests[round] = json(join(base, 'sourcehash.json'))
  archived[round] = {
    command, reportedTests: {
      passed: result.numPassedTests, failed: result.numFailedTests,
      pending: result.numPendingTests, total: result.numTotalTests,
    },
    executedFiles: result.testResults.map(file => ({
      name: file.name, status: file.status, cases: file.assertionResults.length,
      failures: file.assertionResults.filter(test => test.status === 'failed')
        .map(test => ({ name: test.fullName, messages: test.failureMessages })),
    })),
    sourceDrift: after.drift,
  }
}
assert.equal(archived.red.command.exit, 1)
assert.equal(archived.red.reportedTests.failed, 1)
assert.equal(archived.red.reportedTests.pending, 9)
assert.equal(archived.green.command.exit, 0)
assert.equal(archived.green.reportedTests.passed, 27)
assert.equal(archived.regression.command.exit, 0)
assert.equal(archived.regression.reportedTests.passed, 45)
const developerChanged = Object.keys(manifests.red)
  .filter(path => manifests.red[path].sha256 !== manifests.regression[path]?.sha256)
assert.deepEqual(developerChanged, ['src/client/views/overview.tsx'])
const war = 'src/core/war-room.ts'
const headWar = spawnSync('/usr/bin/git', ['show', `HEAD:packages/dsh-pm-tool/${war}`], { cwd: repo })
assert.equal(headWar.status, 0)
const warHash = sha(readFileSync(join(pkg, war)))
assert.equal(sha(headWar.stdout), warHash)
assert.equal(warHash, manifests.red[war].sha256)
assert.equal(warHash, manifests.regression[war].sha256)
const full = json(join(root, 'source-before.json'))
assert.equal(full['client/views/overview.tsx'].sha256, sha(readFileSync(overviewPath)))
assert.equal(full['client/views/overview-done-card.test.tsx'].sha256,
  '8ed1ca262d6f9ccf586636da39515e6acef59fe235d05a5bb51d1471005d06a7')
const dependencyLinks = Object.entries(json(join(root, 'dependency-before.json')))
  .filter(([, value]) => value.kind === 'symlink').map(([path, value]) => ({ path, link: value.link }))
const scope = read(join(pkg, 'src/client/panel.tsx'))
assert(scope.includes('<Overview project={project} tasks={tasks}'))
assert(scope.includes('data={scopeSnapshot(data, project.id)}'))
const result = {
  start, end: new Date().toISOString(), exit: 0,
  executable: process.execPath, argv: [fileURLToPath(import.meta.url)], cwd: repo,
  overviewHash: sha(readFileSync(overviewPath)), oldOverviewHash: sha(readFileSync(oldSource)),
  warRoomHash: warHash, unchangedFromHeadAndDeveloperRedRegression: true,
  developerChangedSourcePaths: developerChanged, patchMatchesDeveloperLocalHunks: true,
  originalF2: {
    legacyDoneIds: fixture.tasks.filter(t => t.status === 'done' || t.progress >= 100).map(t => t.id),
    statusDoneIds: fixture.tasks.filter(t => t.status === 'done').map(t => t.id),
    wrappedIds: fixture.tasks.filter(t => t.status === 'wrapped').map(t => t.id),
    extra: fixture.tasks.find(t => t.id === 't-0001'),
  },
  archived, dependencyLinks,
  sourceScope: ['localdone计数/同源比率/文案/条宽', '同页真实模板及project作用域源码检查'],
  notSigned: ['全量OP', 'GUI/样式/UX', '整包build/全部verify', '依赖链外目标写域'],
}
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify({
  exit: 0, overview: result.overviewHash, warRoom: warHash,
  developerChanged, oldExtra: result.originalF2.extra.id,
  archivedCounts: Object.fromEntries(Object.entries(archived).map(([round, value]) => [round, value.reportedTests])),
}))

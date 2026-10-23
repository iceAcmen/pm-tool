import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a16-extension-base-developer-20261022'
const name = process.argv[2] ?? 'check-r1'
assert.match(name, /^check-r[1-9]\d*$/)
const base = join(repo, 'reports', `${prefix}-selftmp`)
const out = join(base, name)
assert(!existsSync(out))
mkdirSync(out, { recursive: true, mode: 0o700 })
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const save = (n, x) => writeFileSync(join(out, n), typeof x === 'string' ? x : `${JSON.stringify(x, null, 2)}\n`, { flag: 'wx' })
for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n))
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`, HOME: join(out, 'home'),
  TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'), DSH_HOME: join(out, 'runtime'),
  CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1' }
const argv = [process.execPath, join(repo, 'packages/dsh-pm-tool/scripts/verify-external-skills.mjs')]
const start = new Date().toISOString()
const result = spawnSync(argv[0], argv.slice(1), { cwd: repo, env, encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024 })
save('vendor.stdout.log', result.stdout ?? '')
save('vendor.stderr.log', result.stderr ?? '')
const command = { argv, cwd: repo, env, start, end: new Date().toISOString(), originalExit: result.status,
  signal: result.signal, error: result.error?.message ?? null, pid: result.pid }
save('vendor.command.json', command)
const rows = []
for (const round of ['before-r1', 'after-r1', 'after-r2']) {
  const root = join(base, round), summary = read(join(root, 'summary.json'))
  assert.equal(summary.protectionOk, true)
  const candidate = read(join(root, 'candidate.json'))
  if (round !== 'before-r1') assert.deepEqual(candidate.productSourceDelta.sort(),
    ['client/panel.tsx', 'client/copilot-extension-baseline.test.tsx'].sort())
  for (const c of summary.commands) {
    let tests
    const reporter = join(root, `${c.id}.result.json`)
    if (existsSync(reporter)) {
      const r = read(reporter)
      tests = { passed: r.numPassedTests, failed: r.numFailedTests, skipped: r.numPendingTests,
        assertions: r.testResults.flatMap(t => t.assertionResults) }
    }
    rows.push({ round, id: c.id, originalExit: c.originalExit, signal: c.signal, tests,
      commandPath: join(root, `${c.id}.command.json`), reporterPath: tests ? reporter : null,
      stdoutSha256: sha(readFileSync(join(root, `${c.id}.stdout.log`))),
      stderrSha256: sha(readFileSync(join(root, `${c.id}.stderr.log`))) })
  }
}
const requiredCounts = { parent: 4, developer: 23, independent: 23, regression: 87 }
for (const [id, count] of Object.entries(requiredCounts)) {
  const row = rows.find(r => r.round === 'after-r2' && r.id === id)
  assert.equal(row.originalExit, 0); assert.equal(row.tests.passed, count); assert.equal(row.tests.failed, 0)
}
const beforeParent = rows.find(r => r.round === 'before-r1' && r.id === 'parent')
assert.equal(beforeParent.originalExit, 1); assert.equal(beforeParent.tests.failed, 4)
const pcIds = ['PC-C01', 'PC-C02', 'PC-A01', 'PC-A02']
const oracleConflicts = rows.filter(r => r.round === 'after-r2' && pcIds.includes(r.id))
for (const r of oracleConflicts) {
  assert.equal(r.originalExit, 1); assert.equal(r.tests.failed, 1); assert.equal(r.tests.skipped, 3)
  const a = r.tests.assertions.find(a => a.status === 'failed')
  assert(a.failureMessages.every(m => m.startsWith('AssertionError: expected { …(10) } to deeply equal { …(2) }')))
}
const observations = readFileSync(join(base, 'after-r2/observations.jsonl'), 'utf8').trim().split('\n').map(JSON.parse)
const replay = read(join(base, 'after-r2/replay-input.json'))
const expectedTaskBase = Object.fromEntries(replay.initial.tasks.filter(t => t.projectId === 'p-0001').map(t => [t.id, t.updatedAt]))
const richBase = Object.fromEntries(['tasks', 'milestones', 'riskIssues', 'deliverables', 'meetings']
  .flatMap(k => replay.initial[k].filter(r => r.projectId === 'p-0001').map(r => [r.id, r.updatedAt])))
const applyLines = observations.filter(o => o.id === 'transport' && o.data.line.startsWith('ask-apply ')).map(o => o.data.line)
const sent = applyLines.map(line => {
  const [raw, base] = line.slice('ask-apply p-0001 '.length).split(' --base ')
  return { actions: JSON.parse(raw), base: JSON.parse(base) }
})
assert.equal(sent.length, 7)
// 原PC的首base保留task值；这里只审原始传输，不更改失败Oracle或授予PASS。
for (const i of [0, 1, 4, 5, 6]) {
  for (const [id, at] of Object.entries(expectedTaskBase)) assert.equal(sent[i].base[id], at)
  assert.deepEqual(sent[i].base, richBase)
}
assert.deepEqual(sent[0].actions.map(a => [a.stepId, a.needs]), [['s1', []], ['s2', ['s1']], ['s3', []]])
assert.deepEqual(sent.slice(1, 4).map(s => s.actions[0].stepId), ['s1', 's2', 's3'])
assert.deepEqual(sent.slice(5).map(s => s.actions[0].stepId), ['s1', 's3'])
const source = read(join(base, 'after-r2/frozen-inputs.json')).src
save('check.json', { at: new Date().toISOString(), rows, vendorCorrectionCommand: command,
  sourceCount: Object.keys(source).length, panel: source['client/panel.tsx'],
  newTest: source['client/copilot-extension-baseline.test.tsx'],
  sidecar: source['client/shared/drawers/sidecar-portal.tsx'],
  originalPcTaskBaseRetained: true, originalPcRichBase: richBase, originalPcTransport: sent,
  oracleConflicts: oracleConflicts.map(r => ({ id: r.id, originalExit: r.originalExit, assertions: r.tests.assertions })),
  allProductTestsGreen: false, selfSignedPass: false, guiExecuted: false, built: false,
  boundary: 'developer evidence audit only; original four PC failures remain for independent Oracle adjudication' })
assert.equal(result.status, 0, result.stderr)
console.log(JSON.stringify({ sourceCount: Object.keys(source).length, vendorExit: result.status,
  originalPcFailuresRetained: 4, taskBaseRetained: true, selfSignedPass: false }))

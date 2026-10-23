import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const root = process.cwd()
const relative = 'docs/testing/successor112-auth-gui-prefix-20261022-r1'
const prefix = path.join(root, relative)
const json = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const close = json(`${prefix}-close.json`)
const redClose = json(`${prefix}-r2-close.json`)
assert.equal(close.protectedUnchanged, true)
assert.equal(close.released, true)
assert.equal(redClose.actualExit, 1)
assert.deepEqual(redClose.counts, { total: 5, passed: 2, failed: 3, other: 0 })
for (const pid of [json(`${prefix}-test-command.json`).pid, json(`${prefix}-r2-command.json`).pid]) {
  let exited = false
  try { process.kill(pid, 0) } catch (e) { if (e.code === 'ESRCH') exited = true; else throw e }
  assert(exited, `Owned child still alive: ${pid}`)
}
const executionRoot = path.join(process.env.HOME, 'Library/Application Support/Trae CN/ModularData/ai-agent/command-execution')
const ids = [
  'abb0015f49bbdfc1806f5af3d73616e6',
  'a862389aa020c45ffa8e97626585c78c',
  '8cdac43b33393d4d450232feceba9e8c',
]
const receipts = ids.map((id, i) => {
  const e = json(path.join(executionRoot, id, 'execution.json'))
  assert.equal(e.status, 'exited')
  assert.equal(e.outputComplete, true)
  assert.equal(e.exitCode, [0, 0, 1][i])
  return {
    action: ['freeze', 'first-test-close', 'own-oracle-r2'][i], executionId: id, pid: e.pid,
    cwd: e.cwd, exitCode: e.exitCode, status: e.status, outputComplete: e.outputComplete,
    createdAtMs: e.createdAtMs, finishedAtMs: e.finishedAtMs,
    output: fs.readFileSync(path.join(executionRoot, id, 'output.log'), 'utf8'),
  }
})
fs.writeFileSync(`${prefix}-execution-receipts.json`, JSON.stringify({
  at: new Date().toISOString(), receipts,
  scope: 'Only these three deferred tool executions; other synchronous tool exits are recorded in report, not invented metadata',
  childCommands: ['test-command.json', 'r2-command.json'],
}, null, 2) + '\n', { flag: 'wx' })
const filePrefix = path.basename(prefix) + '-'
const files = Object.fromEntries(fs.readdirSync(path.dirname(prefix)).filter(n => n.startsWith(filePrefix))
  .filter(n => !n.endsWith('-delivery.json')).sort().map(n => {
    const f = path.join(path.dirname(prefix), n), b = fs.readFileSync(f)
    return [`docs/testing/${n}`, { bytes: b.length, sha256: sha(b) }]
  }))
fs.writeFileSync(`${prefix}-delivery.json`, JSON.stringify({
  at: new Date().toISOString(), actor: 'Successor112AuthGuiPrefixR1 independent reviewer/red-contract expert',
  role: 'not developer; not GUI executor', released: true, stop: true,
  files, originalGuiIndex: json(`${prefix}-audit.json`).index,
  protectedCount: close.protectedCount, protectedUnchanged: true,
  verdict: json(`${prefix}-audit.json`).verdict,
  red: redClose.counts, redExit: 1,
  next: 'Main dispatches different developer, independent SOURCE/AUTO re-review, then separately bound GUI evidence and different GUI reviewer',
  forbiddenActionsPerformed: 'no product writes/build/install/sharedlib/browser/service/key/Git writes/livingdocs/other testing',
}, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ sealed: true, ownFiles: Object.keys(files).length, released: true, stop: true, exit: 0 }))

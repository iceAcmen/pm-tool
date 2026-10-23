import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const out = repo + '/reports/all-pending-evidence-20261021/P1HistoryRemainingR1'
const pkg = '/private/tmp/pmtool-combined-successor114-20261022-r1/packages/dsh-pm-tool'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const save = async (name, value) => fs.writeFile(out + '/' + name, JSON.stringify(value, null, 2), { flag: 'wx' })
const completePath = 'reports/all-pending-evidence-20261021/CombinedSuccessor114R1/complete-inputs.json'
const complete = JSON.parse(await fs.readFile(repo + '/' + completePath))
const names = ['src/index.ts', 'src/client/panel.tsx', 'src/client/views/people.tsx',
  'src/client/views/people-scale.ts', 'src/client/board/queue-card.tsx', 'src/client/board/queue-aggregate.ts',
  'src/core/queue.ts', 'src/core/people-load.ts', 'src/core/load-stance.ts', 'src/core/session-bind.ts',
  'src/commands/queue.ts', 'src/commands/session.ts']
const binding = []
for (const name of names) {
  const bytes = await fs.readFile(pkg + '/' + name)
  assert.equal(sha(bytes), complete[name].sha256, name)
  assert.equal(bytes.length, complete[name].bytes, name)
  const dest = out + '/frozen-source/' + name
  await fs.mkdir(dest.slice(0, dest.lastIndexOf('/')), { recursive: true })
  await fs.writeFile(dest, bytes, { flag: 'wx' })
  binding.push({ source: name, file: 'frozen-source/' + name, ...complete[name] })
}
await save('candidate-source-binding.json', {
  baseline: '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd', sourceCount: 114, completeInputCount: 521,
  completePath, completeSha256: sha(await fs.readFile(repo + '/' + completePath)),
  port: 3267, pid: 3133, flags: { e2e: '0', pilot: 'OFF' }, binding,
  limitation: 'Existing114 GUI only; later P1004/P1005/Listbox/K16/P2002/KR fixes not installed',
})
const before = JSON.parse(await fs.readFile(out + '/protected-before.json'))
const after = {}
for (const root of Object.keys(before)) {
  const rows = {}
  const walk = async dir => {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const p = dir + '/' + e.name
      if (e.isDirectory()) await walk(p)
      else { const b = await fs.readFile(p); rows[p.slice(root.length + 1)] = { bytes: b.length, sha256: sha(b) } }
    }
  }
  for (const n of ['data/pmtool', 'files', 'backups']) await walk(root + '/' + n)
  after[root] = rows
}
await save('protected-after.json', after)
const protectedDelta = []
for (const root of Object.keys(before)) for (const name of new Set([...Object.keys(before[root]), ...Object.keys(after[root])]))
  if (JSON.stringify(before[root][name]) !== JSON.stringify(after[root][name])) protectedDelta.push({ root, name })
await save('protection-result.json', { protectedDelta })
assert.equal(protectedDelta.length, 0)
const receipts = {}
for (const e of await fs.readdir(out + '/execution-scripts')) if (e.endsWith('-receipt.json'))
  receipts[e] = JSON.parse(await fs.readFile(out + '/execution-scripts/' + e))
await save('execution-receipts.json', {
  bootstrap: 'NOT_COLLECTED outer terminal; host-ready and precise PID separately prove start only', receipts,
  failures: {
    round02: 'Wrong role=banner completion selector; actual restore precheck had no role, original failure retained',
    round04: 'Wrong expected project name after successful restore; original response retained, next read collected actual QA-G A',
    round06: 'No host composer while PM central panel; no bind dispatched; switched via existing native New Session in round08',
    round12: 'Response selector omitted /pm prefix; actual save success+snapshot in events; no repeated save',
    round13: 'Host reload returned central native screen; PM reentry click collected in round14; no repeated reload',
  },
})
const fixture = JSON.parse(await fs.readFile(out + '/original-history-backup.json'))
const initial = JSON.parse(await fs.readFile(out + '/round05-restored-current-raw/data/pmtool/tasks/t-0023.json'))
const final = JSON.parse(await fs.readFile(out + '/round16-final-raw/data/pmtool/tasks/t-0023.json'))
assert.deepEqual(initial.record, fixture.tasks.find(t => t.id === 't-0023'))
assert.deepEqual(final, initial)
await save('historical-preservation.json', {
  taskId: 't-0023', before: initial, after: final, equal: true,
  currentDate: '2026-10-23', limit: 'Only historical low-progress task; not FL MAX or all task writes zero',
  sessionRebind: 'Standard backup excludes sessions; actual original session bind commands rebuilt two bindings without changing tasks',
  expectedWrites: 'Standard restore; two sessions; queueCard personal layout adoption; task t-0021 description/updatedAt/manualProgress=null via normal main save',
})
const index = {}
const walk = async dir => {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name
    if (e.isDirectory()) await walk(p)
    else { const b = await fs.readFile(p); index[p.slice(out.length + 1)] = { bytes: b.length, sha256: sha(b) } }
  }
}
await walk(out)
await save('index-r1.json', index)
await save('seal-r1.json', { at: new Date().toISOString(), count: Object.keys(index).length,
  indexSha256: sha(await fs.readFile(out + '/index-r1.json')), protectedDeltaCount: 0,
  sourceCopies: binding.length, independentVerdict: 'NOT_RUN', noNewBuild: true,
})
console.log({ sealed: Object.keys(index).length, protectedDeltaCount: 0, sourceCopies: binding.length })

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const base = join(repo, 'reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1')
const sha = b => createHash('sha256').update(b).digest('hex')
const json = p => JSON.parse(readFileSync(p))
const seals = []
for (const round of ['r1', 'r2', 'r3']) {
  const root = join(base, round)
  const seal = json(join(root, 'sealed-evidence.json'))
  for (const [name, entry] of Object.entries(seal)) {
    const path = join(root, name)
    if (entry.link) assert.equal(readlinkSync(path), entry.link)
    else {
      const b = readFileSync(path)
      assert.equal(b.length, entry.bytes, path)
      assert.equal(sha(b), entry.sha256, path)
    }
  }
  seals.push({ round, entries: Object.keys(seal).length, unchanged: true })
}
const r2 = join(base, 'r2'), r3 = join(base, 'r3')
const results = json(join(r3, 'vitest.result.json'))
assert.equal(results.numTotalTests, 7)
assert.equal(results.numPassedTests, 2)
assert.equal(results.numFailedTests, 5)
assert.equal(results.numPendingTests, 0)
assert.equal(json(join(r3, 'vitest.command.json')).exit, 1)
assert.equal(json(join(r2, 'vitest.command.json')).exit, 1)
assert.equal(json(join(base, 'r1/close.json')).facilityError.message.includes('0 !== 1'), true)
assert.equal(json(join(r2, 'close.json')).allProtectedUnchanged, true)
assert.equal(json(join(r3, 'close.json')).previousUnchanged, true)
const cases = []
for (const name of readdirSync(join(r3, 'observations')).sort()) {
  const path = join(r3, 'observations', name, 'observations.json')
  const o = json(path)
  const states = o.events.filter(e => typeof e.formPresent === 'boolean')
  assert.deepEqual(o.calls, [], '所有用例submit前零run/fetch/业务回调')
  assert(states.every(s => s.recordsSha256 === o.finalRecordsSha256), 'fixture记录变化')
  const necessary = /^\d+-N/.test(name)
  if (necessary) {
    assert.equal(o.caught.length, 1)
    assert.equal(o.caught[0].message, "Cannot read properties of null (reading 'checked')")
    assert(o.caught[0].stack.includes('panel.tsx:2938:41'))
    assert(o.caught[0].stack.includes('basicStateReducer'))
    assert(o.caught[0].componentStack.includes('TaskForm'))
    const before = states.filter(s => s.label.startsWith('before-click-')).at(-1)
    const after = states.filter(s => s.label.startsWith('after-click-')).at(-1)
    assert.equal(before.formPresent, true)
    assert.equal(after.formPresent, false)
  }
  cases.push({ name, path, sha256: sha(readFileSync(path)), necessary,
    caught: o.caught.map(({ message, stack, componentStack }) => ({ message, stack, componentStack })),
    steps: states.map(({ label, formPresent, title, search, selected, footer, recordsSha256 }) =>
      ({ label, formPresent, title, search, selected, footer, recordsSha256 })),
    calls: o.calls, recordUnchanged: true,
    cancellation: name === '2-C02' ? 'NOT_REACHED:搜索隐藏已选FormData失败，非null checked' : 'NOT_PLANNED_OR_NOT_REACHED',
  })
}
const c02 = cases.find(c => c.name === '2-C02')
const afterSearch = c02.steps.find(s => s.label === 'after-input-候选任务1')
assert.equal(afterSearch.formPresent, true)
assert.equal(afterSearch.footer, '已选 1 项')
assert.deepEqual(afterSearch.selected, [])
const candidate = json(join(r2, 'candidate.json'))
assert.equal(candidate.parentCandidate.sourceCount, 107)
assert.equal(candidate.completeInputCount, 515)
const adapter = json(join(r2, 'virtual-adapter.json'))
assert.equal(adapter.additionOnly, '\nexport { TaskForm }\n')
const panel = readFileSync(join(r2, 'frozen/packages/dsh-pm-tool/src/client/panel.tsx'))
assert.equal(sha(panel), adapter.sourceSha256)
assert.equal(sha(panel.toString() + adapter.additionOnly), adapter.transformedSha256)
const guiBefore = json(join(r2, 'gui-reference-before.json'))
const guiAfter = json(join(r2, 'gui-reference-after.json'))
assert.deepEqual(guiBefore.files, guiAfter)
const guiRoot = guiBefore.root
const currentGui = {}
for (const [name, entry] of Object.entries(guiBefore.files)) {
  const b = readFileSync(join(guiRoot, name))
  currentGui[name] = { bytes: b.length, sha256: sha(b) }
  assert.deepEqual(currentGui[name], entry)
}
const roots = json(join(r2, 'gui-root-comparisons.json'))
const guiDeltas = roots.map(r => ({
  ...r, businessDeltaCorrected: {
    added: r.allDelta.added.filter(k => k.startsWith('data/pmtool/') || k.startsWith('files/') || k.startsWith('backups/')),
    removed: r.allDelta.removed.filter(k => k.startsWith('data/pmtool/') || k.startsWith('files/') || k.startsWith('backups/')),
    changed: r.allDelta.changed.filter(k => k.startsWith('data/pmtool/') || k.startsWith('files/') || k.startsWith('backups/')),
  },
  correction: '原运行器businessDelta排除dsh/不足，data/session_projcache亦为宿主会话缓存；原字段保留，不覆原件',
}))
assert(guiDeltas.every(r => Object.values(r.businessDeltaCorrected).every(a => a.length === 0)))
const ownership = ['package-deps', 'dom-deps'].map(label => json(join(r2, `${label}-ownership.json`)))
assert(ownership.every(o => o.externalLinks.length === 0 && o.sharedInodes.length === 0))
const output = {
  at: new Date().toISOString(), node: process.version, runnerPid: process.pid,
  verdict: 'FAIL_NECESSARY_RED / RELEASE_STOP',
  actual: { total: 7, controlPassed: ['C01', 'C03'], controlFailedSeparate: ['C02'],
    targetCrashFailed: ['N01', 'N02', 'N03', 'N04'], vitestExit: 1 },
  seals, candidate, adapter, ownership, cases, guiDeltas, currentGui,
  separateFinding: 'C02真实已有选择被搜索隐藏后FormData为空，footer仍已选1；取消未到达，只交Main另裁范围/合同，不开发或混事件根因',
  protectedBoundaries: 'r2原冻结/deps/lib/MaterialRefDOM/主lib/package/lock/test终核0，r3借自有r2未写；不外推全盘/并行产品零变',
  guiVisualReview: { reviewer: '独立先行专家', sources: ['23-o3-reconstructed-before-check.png', '24-o3-after-predecessor-check.png'],
    observation: '原图23 PM工作台与已有任务编辑抽屉可见，24仅宿主侧栏/主区为空；console同一TaskForm null checked',
    notClaimed: '不执行GUI，不签三次完整操作/修后GUI/整项' },
  noProductEdit: true, noBuildNoemitInstallGUIServiceGit: true, stopped: true,
}
writeFileSync(join(repo, 'docs/testing/task-predecessor-checkbox-red-20261022-r1-audit.json'),
  JSON.stringify(output, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ total: 7, passed: 2, failed: 5, targetCrash: 4,
  separateControlFailure: 1, seals, auditExit: 0, verdict: output.verdict }))

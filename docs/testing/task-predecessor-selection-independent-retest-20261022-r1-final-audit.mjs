import assert from 'node:assert/strict'
import { existsSync, lstatSync, readFileSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sha } from './task-predecessor-selection-independent-retest-20261022-r1-adapter.mjs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const root = join(repo, 'reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1')
const output = join(root, 'final-audit-r1.json')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
assert(!existsSync(output))
const seals = {}
for (const name of ['r1', 'r2-facility', 'r3-facility']) {
  const seal = json(join(root, name, 'sealed-evidence.json'))
  for (const [rel, entry] of Object.entries(seal)) {
    const path = join(root, name, rel)
    const stat = lstatSync(path)
    if (entry.link) {
      assert(stat.isSymbolicLink(), `${name}/${rel}`)
      assert.equal(readlinkSync(path), entry.link, `${name}/${rel}`)
    } else {
      const data = readFileSync(path)
      assert.equal(data.length, entry.bytes, `${name}/${rel}`)
      assert.equal(sha(data), entry.sha256, `${name}/${rel}`)
    }
  }
  const close = json(join(root, name, 'close.json'))
  assert.equal(close.allProtectedUnchanged, true)
  assert.equal(close.childExited, true)
  seals[name] = { entries: Object.keys(seal).length, unchanged: true }
}
const audit = json(join(root, 'audit-r1.json'))
assert.equal(audit.allProtectedUnchanged, true)
const r2 = json(join(root, 'r2-facility/summary.json'))
const r3 = json(join(root, 'r3-facility/summary.json'))
for (const value of [r2, r3]) {
  assert.deepEqual([value.files, value.tests, value.green, value.failed, value.pending], [18, 182, 182, 0, 0])
  assert.equal(value.exit, 0)
  assert.equal(value.signal, null)
  assert.equal(value.error, null)
}
const r2stderr = readFileSync(join(root, 'r2-facility/vitest.stderr.txt'), 'utf8')
assert(r2stderr.includes('Error: Uncaught [TypeError: document.querySelector is not a function]'))
assert.equal(r3.rafReferenceErrorPresent, false)
assert.equal(r3.detachedTreeWarningPresent, false)
assert.equal(r3.uncaughtErrorPresent, false)
const r3stderr = readFileSync(join(root, 'r3-facility/vitest.stderr.txt'), 'utf8')
assert(!/Error: Uncaught|Unhandled Errors|Unhandled Rejection|Uncaught Exception/.test(r3stderr))
const fixture = json(join(root, 'r3-facility/fixture-adapter.json'))
const oldTest = readFileSync(fixture.file, 'utf8')
const adapted = readFileSync(join(root, 'r3-facility/checklist-document-fixture.test.tsx'), 'utf8')
assert.equal(sha(oldTest), fixture.originalSha256)
assert.equal(sha(adapted), fixture.adaptedSha256)
assert.equal(adapted.replace(fixture.afterStub, fixture.beforeStub), oldTest)
const product = json(join(root, 'r1/virtual-panel.json'))
assert.equal(product.originalSha256, '581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d')
const candidate = json(join(root, 'r1/candidate.json'))
assert.deepEqual([candidate.packageInputCount, candidate.sourceInputCount], [519, 402])
const result = {
  role: 'TaskPredSelectionRetestR1 / independent SOURCE-AUTO',
  at: new Date().toISOString(), node: process.version, seals,
  SOURCE: 'PASS_LIMITED: exact two edits, checked boolean read synchronously; complete controlled Set submit',
  AUTO: 'PASS_LIMITED: independently adapted original seven + unchanged original submit five + corrected-facility affected18/182 + materialDOM5; no actual FAIL/unhandled error in formal subset',
  originalRawSeven: audit.summaries['original-seven'],
  C02: audit.C02,
  facilityRounds: {
    r1: 'Assertion regression green, two detached-tree RAF prerequisite warnings retained',
    r2: 'Vitest exit0/182 green but uncaught document.querySelector TypeError; NOT_ACCEPTED as facility PASS',
    r3: 'Native jsdom scheduler/full-document prerequisite, original assertions unchanged; no uncaught/RAF/detached errors',
  },
  residualWarnings: {
    taskTableKeys: (r3stderr.match(/Each child in a list should have a unique/g) ?? []).length,
    nodeEventTargetListeners: (r3stderr.match(/MaxListenersExceededWarning:/g) ?? []).length,
    injectedStorageErrors: (r3stderr.match(/\[pm-tool\] 任务操作失败：/g) ?? []).length,
    fullStderrPath: join(root, 'r3-facility/vitest.stderr.txt'),
    disposition: 'Key/listener diagnostics outside this selector contract remain explicit residual risk, not a zero-console/full-PmPanel/GUI acceptance or parent waiver; injected Error/AggregateError are planned rejection controls',
  },
  panelSha256: product.originalSha256,
  mainPanelSha256AtAudit: sha(readFileSync(join(repo, 'packages/dsh-pm-tool/src/client/panel.tsx'))),
  packageInputCount: candidate.packageInputCount, sourceInputCount: candidate.sourceInputCount,
  release: 'RELEASE_STOP', gui: 'NOT_RUN / Main successor', parentCommit: 'NOT_SIGNED',
}
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ SOURCE: result.SOURCE, AUTO: result.AUTO, seals,
  residualWarnings: result.residualWarnings, release: result.release }, null, 2))

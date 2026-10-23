import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const owned = path.join(repo, 'reports/all-pending-evidence-20261021/ReportExportRedR1')
const run = path.join(owned, 'run-rtV1dy')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const read = name => JSON.parse(fs.readFileSync(path.join(run, name)))
const index = read('artifact-index.json')
const mismatches = []
for (const [name, expected] of Object.entries(index.files)) {
  const file = path.join(run, name)
  if (!fs.existsSync(file)) { mismatches.push({ name, missing: true }); continue }
  const bytes = fs.readFileSync(file)
  if (bytes.length !== expected.bytes || sha(bytes) !== expected.sha256) mismatches.push({ name })
}
assert.deepEqual(mismatches, [])
const summary = read('summary.json'), binding = read('binding.json')
assert.equal(summary.meaningfulRed, true)
assert.equal(summary.passed, 7)
assert.equal(summary.failed, 6)
assert.equal(summary.skippedOrPending, 0)
assert.equal(summary.vitestExit, 1)
assert.equal(binding.sourceDeclarations, 107)
assert.equal(binding.completeInputs, 515)
assert.deepEqual(binding.differences, [])
const currentTest = fs.readFileSync(path.join(repo, binding.testClaim.path))
assert.equal(sha(currentTest), binding.testClaim.sha256)
assert.equal(sha(fs.readFileSync(path.join(run, 'test-source.ts.txt'))), sha(currentTest))
assert.deepEqual(read('protected-before.json').source, read('protected-after.json').source)
assert.deepEqual(read('protected-before.json').lib, read('protected-after.json').lib)

const cases = []
for (const name of fs.readdirSync(path.join(run, 'tmp'))) {
  const dir = path.join(run, 'tmp', name)
  const observations = fs.readdirSync(dir).filter(file => file.startsWith('export-observation'))
  for (const file of observations) {
    const observation = JSON.parse(fs.readFileSync(path.join(dir, file)))
    const fixedFile = path.join(dir, 'data/pmtool/reports/rpt-0002.json')
    const fixed = JSON.parse(fs.readFileSync(fixedFile)).record
    cases.push({
      caseRoot: path.relative(repo, dir), file,
      sourceType: fixed.sourceType, sourceSessionId: fixed.sourceSessionId,
      bytes: observation.bytes, missing: observation.missing,
      reportSha256: sha(fs.readFileSync(fixedFile)),
      exportSha256: sha(fs.readFileSync(observation.path)),
    })
  }
}
const sourceNowDifferences = []
for (const [name, expected] of Object.entries(read('protected-after.json').source)) {
  if (!fs.existsSync(path.join(repo, name)) || sha(fs.readFileSync(path.join(repo, name))) !== expected.sha256) {
    sourceNowDifferences.push(name)
  }
}
const result = {
  at: new Date().toISOString(), artifactIndex: path.relative(repo, path.join(run, 'artifact-index.json')),
  verifiedFiles: Object.keys(index.files).length, mismatches,
  testSha256: sha(currentTest), sourceNowDifferences, observations: cases,
  priorRuns: ['run-cd8PO9', 'run-cKdR56'].map(name => {
    const prior = JSON.parse(fs.readFileSync(path.join(owned, name, 'summary.json')))
    return { name, vitestExit: prior.vitestExit, passed: prior.passed, failed: prior.failed,
      meaningfulRed: prior.meaningfulRed, drift: prior.drift }
  }),
  auditOnly: true, productVerdict: '有限 RED，不判整域/commit', release: 'STOP',
}
fs.writeFileSync(path.join(owned, 'close-r1.json'), JSON.stringify(result, null, 2), { flag: 'wx' })
console.log(JSON.stringify({ verifiedFiles: result.verifiedFiles, mismatches,
  sourceNowDifferences, testSha256: result.testSha256, observations: cases.length }, null, 2))

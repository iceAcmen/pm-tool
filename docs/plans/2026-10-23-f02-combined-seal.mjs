import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const out = repo + '/reports/all-pending-evidence-20261021/CombinedF02RepairR2'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const read = name => JSON.parse(fs.readFileSync(out + '/' + name, 'utf8'))
const save = (name, value) => fs.writeFileSync(out + '/' + name,
  typeof value === 'string' ? value : JSON.stringify(value, null, 2), { flag: 'wx' })
for (const [name, expected] of Object.entries(read('independent-source-reports.json'))) {
  const b = fs.readFileSync(repo + '/docs/testing/' + name)
  assert.equal(b.length, expected.bytes, name)
  assert.equal(sha(b), expected.sha256, name)
}
const receipts = {}
for (const name of ['freeze', 'tsc', 'bundle', 'noemit', 'full', 'dom', 'special', 'verify', 'guard', 'close']) {
  receipts[name] = read(name + '-outer-receipt.json')
  assert.equal(receipts[name].exitCode, 0, name)
  assert.equal(receipts[name].signal, null, name)
}
const results = {}
for (const name of ['full', 'dom', 'special']) {
  const r = read(name + '.result.json')
  assert.equal(r.numFailedTests, 0, name)
  assert.equal(r.numPendingTests, 0, name)
  assert.equal(r.success, true, name)
  results[name] = { files: [...new Set(r.testResults.map(t => t.name))].length, total: r.numTotalTests,
    passed: r.numPassedTests, failed: r.numFailedTests, pending: r.numPendingTests,
    rawSha256: sha(fs.readFileSync(out + '/' + name + '.result.json')) }
}
save('summary.json', { at: new Date().toISOString(), candidate: read('candidate.json'), results, receipts,
  delta: read('parent-six-to-current-inputs.json'), verifySummary: fs.readFileSync(out + '/verify.stdout.txt', 'utf8')
    .split('\n').filter(l => l.includes('脚本：共') || l.includes('资产：') || l.includes('污染')),
  boundary: 'Main完整候选原始执行封件；非独立组合PASS，非新host/GUI验收。',
  sourceReports: read('independent-source-reports.json') })
fs.mkdirSync(out + '/execution-scripts', { recursive: true })
for (const name of ['2026-10-23-f02-combined-regression.md', '2026-10-23-f02-combined-execute.mjs', '2026-10-23-f02-combined-seal.mjs']) {
  fs.copyFileSync(repo + '/docs/plans/' + name, out + '/execution-scripts/' + name, fs.constants.COPYFILE_EXCL)
}
const files = []
function walk(dir, rel = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name), name = path.posix.join(rel, e.name)
    const st = fs.lstatSync(p)
    if (st.isSymbolicLink()) files.push({ file: name, link: fs.readlinkSync(p) })
    else if (st.isDirectory()) walk(p, name)
    else { const b = fs.readFileSync(p); files.push({ file: name, bytes: b.length, sha256: sha(b) }) }
  }
}
walk(out)
save('index-r2.json', { at: new Date().toISOString(), count: files.length, files,
  excludes: ['index-r2.json itself', 'seal-r2.json later'], independentVerdict: 'NOT_SIGNED_BY_MAIN' })
const b = fs.readFileSync(out + '/index-r2.json')
save('seal-r2.json', { at: new Date().toISOString(), index: { bytes: b.length, sha256: sha(b) },
  members: files.length, rawResults: results, sourceReports: read('independent-source-reports.json'),
  independent: 'PENDING', gui: 'NOT_RUN' })
console.log({ sealed: files.length, results, exit: 0 })

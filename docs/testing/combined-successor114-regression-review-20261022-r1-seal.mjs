import fs from 'node:fs'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = repo + '/docs/testing/combined-successor114-regression-review-20261022-r1'
const root = repo + '/reports/all-pending-evidence-20261021/CombinedSuccessor114R1'
const tools = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const fingerprint = file => { const b = fs.readFileSync(file); return { bytes: b.length, sha256: sha(b) } }
const read = file => JSON.parse(fs.readFileSync(file))
const final = read(prefix + '-audit-final-r2.json')
assert.equal(final.verdict, 'PASS_LIMITED_COMBINED_REGRESSION_EVIDENCE')
assert.deepEqual(final.errors, [])
assert.equal(Object.keys(final.groups).length, 9)
assert.equal(final.groups.candidate_and_exact_delta.candidate.sourceCount, 114)
assert.equal(final.groups.candidate_and_exact_delta.candidate.completeInputCount, 521)
assert.equal(final.groups.reader_before_after_bytes_protection.productExecutions, 0)
assert.equal(final.groups.final_receipts_index_gate.entries, 1687)

for (const [name, row] of Object.entries(final.evidence)) {
  const file = name === 'private-executor.mjs' ? '/private/tmp/pmtool-combined-successor114-executor-r1.mjs'
    : name === 'freeze/coverage-summary.json'
      ? '/private/tmp/pmtool-combined-successor114-20261022-r1/packages/dsh-pm-tool/coverage/coverage-summary.json'
      : root + '/' + name
  assert.deepEqual(fingerprint(file), row, name)
}
const index = read(root + '/index-r1.json')
for (const [name, row] of Object.entries(index.files)) {
  const file = root + '/' + name
  const stat = fs.lstatSync(file)
  if (Object.hasOwn(row, 'symlink')) {
    assert(stat.isSymbolicLink())
    assert.equal(fs.readlinkSync(file), row.symlink)
    assert.equal(fs.realpathSync(file), row.real)
  } else {
    assert(stat.isFile())
    assert.deepEqual(fingerprint(file), row, name)
  }
}
const receipts = {}
for (const [name, id, expectedExit] of [
  ['preflight', '87822b565090831d62205c0063cba488', 1],
  ['first_final', '6faf174f020ae194a5d957f5d9b940e9', 1],
  ['final_r2', '232c57bea1810a27a8f078a6171cebb1', 0],
  ['wait_final_metadata', 'bf0c39a8a053fc33d7d05136eca0cc32', 0],
]) {
  const dir = tools + '/' + id
  const metadata = read(dir + '/execution.json')
  assert.equal(metadata.status, 'exited')
  assert.equal(metadata.outputComplete, true)
  assert.equal(metadata.exitCode, expectedExit)
  const output = fs.readFileSync(dir + '/output.log', 'utf8')
  if (name !== 'wait_final_metadata') assert(output.includes('"productExecutions":0'))
  receipts[name] = { id, metadata, files: Object.fromEntries(
    ['execution.json', 'output.log', 'stderr.log'].map(file => [file, fingerprint(dir + '/' + file)])), output }
}
assert(read(prefix + '-audit-preflight.json').errors.length > 0)
assert(read(prefix + '-audit-final.json').errors.length > 0)
const ownFiles = Object.fromEntries(['-reader.mjs', '-audit-preflight.json', '-audit-final.json',
  '-audit-final-r2.json', '-report.md', '-seal.mjs'].map(suffix => [prefix + suffix, fingerprint(prefix + suffix)]))
const output = prefix + '-seal.json'
assert(!fs.existsSync(output), 'Never overwrite a seal')
fs.writeFileSync(output, JSON.stringify({
  at: new Date().toISOString(), verdict: final.verdict, released: true, stop: true,
  signed: 'Exact successor114 build/product-noEmit/full/DOM/special/default95/guard/evidence protection and actual exits only',
  notSigned: ['GUI', 'style', 'UX', 'B8', 'parent total', 'ordinarycommit', 'release', 'formal service'],
  productExecutions: 0, gitWrites: 0, preparationReadOnlyGitStatus: 1,
  ownedFiles: ownFiles, readerReceipts: receipts, mainIndex: fingerprint(root + '/index-r1.json'),
  sourceCount: 114, productInputCount: 521, evidenceEntries: 1687,
  preservedReaderFailures: ['preflight exit1', 'first final exit1'],
  preservedMainArchiveFailure: final.groups.final_receipts_index_gate.outer.seal_initial,
  protection: 'Final index bytes/symlink fields and previously read evidence rechecked; other experts/livingdocs not locked',
}, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ seal: output, verdict: final.verdict, productExecutions: 0, released: true, stop: true }))

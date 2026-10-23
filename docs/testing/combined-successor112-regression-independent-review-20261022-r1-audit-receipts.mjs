import fs from 'node:fs'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const prefix = fileURLToPath(import.meta.url).replace(/-audit-receipts\.mjs$/, '')
const toolBase = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
const sha = data => crypto.createHash('sha256').update(data).digest('hex')
const fingerprint = file => {
  const data = fs.readFileSync(file)
  return { bytes: data.length, sha256: sha(data) }
}
const rows = []
for (const [name, id] of [
  ['preflight', '6074d80c4c9e66e087a38c4311a7dbf2'],
  ['final', 'cbf1b39fb7a33b6eeaba4f9368de3e7e'],
]) {
  const metaFile = `${toolBase}/${id}/execution.json`
  const outputFile = `${toolBase}/${id}/output.log`
  const metadata = JSON.parse(fs.readFileSync(metaFile, 'utf8'))
  assert.equal(metadata.executionId, id)
  assert.equal(metadata.status, 'exited')
  assert.equal(metadata.outputComplete, true)
  assert.equal(metadata.exitCode, 0)
  rows.push({ name, metadata, metadataFingerprint: fingerprint(metaFile),
    outputFingerprint: fingerprint(outputFile), originalOutput: fs.readFileSync(outputFile, 'utf8') })
}
const final = JSON.parse(fs.readFileSync(prefix + '-audit-final.json', 'utf8'))
assert.equal(final.verdict, 'PASS_LIMITED_COMBINED_REGRESSION_EVIDENCE')
const files = {}
for (const suffix of ['-reader.mjs', '-audit-preflight.json', '-audit-final.json',
  '-report.md', '-audit-receipts.mjs']) files[prefix + suffix] = fingerprint(prefix + suffix)
fs.writeFileSync(prefix + '-audit-receipts.json', JSON.stringify({
  at: new Date().toISOString(), rows, files, selfIndexed: false,
  testsExecutedThisRole: 0, verdict: final.verdict, release: 'STOP',
  scope: 'Own evidence-reader receipts and file fingerprints only; not a product test or GUI gate',
}, null, 2) + '\n', { flag: 'wx' })
console.log('AUDIT_RECEIPTS exit=0; independent reader executions=2; product tests=0; release STOP')

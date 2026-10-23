import fs from 'node:fs'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const root = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
const output = '/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/successor112-predecessor-gui-review-20261022-r1-receipts.json'
assert(!fs.existsSync(output))
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const receipts = []
for (const [label, id, expectedExit] of [
  ['reader audit: host-cache scope assertion failure retained', '53fdaadbfc7c3d22b0d14cadd62e3c0f', 1],
  ['reader audit-r2: RPC envelope access typo retained', 'ab69a850214fa240922656c5a8c993ab', 1],
  ['reader audit-r3: exact evidence audit', 'a977764cbb2d22f33ddb667c47dadbd8', 0],
  ['reader final: unchanged original-byte recheck', '36662533ada78b4cb8be9bb5776fc1a2', 0],
  ['Main step19: original clean-cancel execution output', 'ccf4e815ed9eec9ae03a64ecf6a71932', 0],
]) {
  const files = {}
  for (const name of ['execution.json', 'output.log', 'stderr.log']) {
    const file = `${root}/${id}/${name}`
    const bytes = fs.readFileSync(file)
    files[name] = { file, bytes: bytes.length, sha256: sha(bytes),
      ...(name === 'output.log' ? { text: bytes.toString() } : {}) }
  }
  const meta = JSON.parse(fs.readFileSync(`${root}/${id}/execution.json`))
  assert.equal(meta.status, 'exited')
  assert.equal(meta.outputComplete, true)
  assert.equal(meta.exitCode, expectedExit)
  receipts.push({ label, executionId: id, pid: meta.pid, exitCode: meta.exitCode,
    cwd: meta.cwd, status: meta.status, outputComplete: meta.outputComplete,
    startedAtMs: meta.startedAtMs, finishedAtMs: meta.finishedAtMs, files })
}
fs.writeFileSync(output, JSON.stringify({ at: new Date().toISOString(),
  actor: 'Independent original-tool-receipt reader; no product/helper execution',
  receipts, independentProductVerdict: 'See limited GUI report', productTestsExecuted: 0,
}, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ archived: receipts.length, ownReaderExits: [1, 1, 0, 0],
  originalMainCancelExit: 0, productTestsExecuted: 0 }))

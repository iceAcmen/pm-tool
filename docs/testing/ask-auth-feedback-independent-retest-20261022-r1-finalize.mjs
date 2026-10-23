import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants, copyFileSync, lstatSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const out = join(repo, 'reports/all-pending-evidence-20261021/AskAuthRetestR1')
const prefix = 'ask-auth-feedback-independent-retest-20261022-r1'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const id = process.argv[2]
assert.match(id, /^[a-f0-9]{32}$/)
const tool = join('/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution', id)
const receipt = JSON.parse(readFileSync(join(tool, 'execution.json'), 'utf8'))
assert.equal(receipt.status, 'exited')
assert.equal(receipt.exitCode, 0)
assert.equal(receipt.outputComplete, true)
const ps = spawnSync('/bin/ps', ['-p', String(receipt.pid), '-o', 'pid=,ppid=,command='],
  { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } })
assert.equal(ps.status, 1)
assert.equal(ps.stdout.trim(), '')
copyFileSync(join(tool, 'output.log'), join(out, 'tool-receipts/seal.stdout.log'), constants.COPYFILE_EXCL)
writeFileSync(join(out, 'tool-receipts/seal.json'), `${JSON.stringify({
  stage: 'seal', executionId: id, pid: receipt.pid, originalExit: receipt.exitCode,
  status: receipt.status, outputComplete: true, exited: true, psExit: ps.status,
  start: new Date(receipt.startedAtMs).toISOString(), end: new Date(receipt.finishedAtMs).toISOString(),
  originalReceiptSha256: sha(readFileSync(join(tool, 'execution.json'))),
}, null, 2)}\n`, { flag: 'wx' })
function inventory(root) {
  const result = {}
  function walk(path) {
    const s = lstatSync(path), key = relative(root, path) || '.'
    if (s.isSymbolicLink()) result[key] = { link: readlinkSync(path) }
    else if (s.isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name))
    else result[key] = { bytes: s.size, sha256: sha(readFileSync(path)) }
  }
  walk(root)
  return result
}
const docs = readdirSync(join(repo, 'docs/testing')).filter(name => name.startsWith(prefix))
writeFileSync(join(out, 'final-index.json'), `${JSON.stringify({
  at: new Date().toISOString(), evidence: inventory(out),
  docs: Object.fromEntries(docs.map(name => [name, inventory(join(repo, 'docs/testing', name))])),
  exclusions: 'Final index and its tool receipt are not self-referential. Earlier delivery-index preserves the pre-seal plan state; this index binds the completed plan and seal receipt.',
  released: true, stop: true, verdict: 'PASS_LIMITED_SOURCE_AUTO', guiSigned: false, parentGoalSigned: false, release: 'STOP',
}, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ finalized: true, sealExit: receipt.exitCode, sealedProcessExited: true,
  released: true, stop: true, verdict: 'PASS_LIMITED_SOURCE_AUTO', release: 'STOP' }))

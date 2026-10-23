import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants, copyFileSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const out = join(repo, 'reports/all-pending-evidence-20261021/AskAuthRetestR1')
const prefix = 'ask-auth-feedback-independent-retest-20261022-r1'
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const ids = process.argv.slice(2)
assert.equal(ids.length, 5, 'freeze/original11/affected/type/close tool IDs')
mkdirSync(join(out, 'tool-receipts'), { mode: 0o700 })
const receipts = ids.map((id, index) => {
  assert.match(id, /^[a-f0-9]{32}$/)
  const root = join('/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution', id)
  const r = json(join(root, 'execution.json'))
  assert.equal(r.status, 'exited')
  assert.equal(r.outputComplete, true)
  const ps = spawnSync('/bin/ps', ['-p', String(r.pid), '-o', 'pid=,ppid=,command='],
    { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } })
  assert.equal(ps.status, 1)
  assert.equal(ps.stdout.trim(), '')
  const stage = ['freeze', 'original11', 'affected', 'type', 'close'][index]
  copyFileSync(join(root, 'output.log'), join(out, 'tool-receipts', `${stage}.stdout.log`), constants.COPYFILE_EXCL)
  const receipt = {
    stage, executionId: id, pid: r.pid, cwd: r.cwd, originalExit: r.exitCode,
    status: r.status, outputComplete: r.outputComplete, terminalReason: r.terminalReason,
    start: new Date(r.startedAtMs).toISOString(), end: new Date(r.finishedAtMs).toISOString(),
    originalReceiptSha256: sha(readFileSync(join(root, 'execution.json'))),
    exited: true, psExit: ps.status,
  }
  writeFileSync(join(out, 'tool-receipts', `${stage}.json`), `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' })
  return receipt
})
writeFileSync(join(out, 'execution-receipts.json'), `${JSON.stringify(receipts, null, 2)}\n`, { flag: 'wx' })
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
const close = json(join(out, 'close.json'))
assert(close.released && close.stop)
const docs = readdirSync(join(repo, 'docs/testing')).filter(name => name.startsWith(prefix))
writeFileSync(join(out, 'delivery-index.json'), `${JSON.stringify({
  at: new Date().toISOString(), evidence: inventory(out),
  docs: Object.fromEntries(docs.map(name => [name, inventory(join(repo, 'docs/testing', name))])),
  exclusions: 'This index and later seal-tool receipt do not self-reference. No prior evidence is overwritten.',
}, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ verdict: close.verdict, released: close.released, stop: close.stop,
  originalExits: receipts.map(r => r.originalExit), guiSigned: false, parentGoalSigned: false, release: 'STOP' }))

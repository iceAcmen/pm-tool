import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const out = repo + '/reports/all-pending-evidence-20261021/CombinedSixRepairsR1'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const read = name => JSON.parse(fs.readFileSync(out + '/' + name))
const save = (name, value) => fs.writeFileSync(out + '/' + name,
  typeof value === 'string' ? value : JSON.stringify(value, null, 2), { flag: 'wx' })
assert.equal(read('special.command.json').exitCode, 1, 'Original premature execution stays failed')
assert.equal(read('full.command.json').exitCode, 0, 'Full produces the actual legal fixtures first')
const full = read('full.result.json')
assert.equal(full.numFailedTests, 0)
const original = read('special.command.json')
const pkg = original.cwd
for (const [name, hash] of Object.entries(read('report-special-inputs.json')))
  assert.equal(sha(fs.readFileSync(pkg + '/' + name)), hash, name)
const inputRoot = original.env.R1_RAW_TMP
const fixtures = []
for (const name of fs.readdirSync(inputRoot)) {
  const file = path.join(inputRoot, name, 'frozen-before.json')
  if (!fs.existsSync(file)) continue
  const bytes = fs.readFileSync(file)
  const value = JSON.parse(bytes)
  if (value.fixed) fixtures.push({ file, bytes: bytes.length, sha256: sha(bytes), sourceType: value.fixed.sourceType })
}
assert(fixtures.some(row => row.sourceType === 'manual'))
assert(fixtures.some(row => row.sourceType === 'session'))
const env = { ...original.env, R1_PROBE_OUTPUT: out + '/runtime/report-probes-r2' }
fs.mkdirSync(env.R1_PROBE_OUTPUT, { recursive: true })
const argv = original.argv.map(arg => arg === '--outputFile=' + out + '/special.result.json'
  ? '--outputFile=' + out + '/special-r2.result.json' : arg)
save('special-r2-prerequisites.json', { reason: 'Main started supplemental probes before full generated their legal persisted fixtures',
  originalExit: 1, fullActualExit: 0, fullResultSha256: sha(fs.readFileSync(out + '/full.result.json')),
  fixtures, productOrOracleChanged: false, onlyOutputDirectoryAndResultFilenameChanged: true })
const started = new Date().toISOString()
const child = spawnSync(argv[0], argv.slice(1), { cwd: pkg, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
save('special-r2.command.json', { argv, cwd: pkg, env, started, ended: new Date().toISOString(),
  pid: child.pid, exitCode: child.status, signal: child.signal, error: child.error?.message })
save('special-r2.stdout.txt', child.stdout ?? '')
save('special-r2.stderr.txt', child.stderr ?? '')
console.log({ exitCode: child.status, signal: child.signal, stdoutTail: child.stdout?.slice(-1700), stderrTail: child.stderr?.slice(-1700) })
process.exitCode = child.status ?? 2

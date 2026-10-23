import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const out = repo + '/reports/all-pending-evidence-20261021/P1HistoryRemainingR1'
const [source, name] = process.argv.slice(2)
if (!source?.startsWith('/private/tmp/pmtool-p1-history-') || !/^[a-z0-9-]+$/.test(name ?? '')) throw new Error('Explicit own script/name required')
const before = fs.readFileSync(source)
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
fs.mkdirSync(out + '/execution-scripts', { recursive: true })
const receipt = out + '/execution-scripts/' + name + '-receipt.json'
if (fs.existsSync(receipt)) throw new Error('Never replay a recorded round')
fs.writeFileSync(out + '/execution-scripts/' + name + '.mjs', before, { flag: 'wx' })
const startedAt = new Date().toISOString()
const node = '/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const run = spawnSync(node, [source], { cwd: repo, timeout: 45000, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
fs.writeFileSync(out + '/execution-scripts/' + name + '-stdout.log', run.stdout ?? '', { flag: 'wx' })
fs.writeFileSync(out + '/execution-scripts/' + name + '-stderr.log', run.stderr ?? '', { flag: 'wx' })
const data = { startedAt, endedAt: new Date().toISOString(), node, argv: [source], cwd: repo,
  scriptSha256: sha(before), unchanged: sha(fs.readFileSync(source)) === sha(before),
  status: run.status, signal: run.signal, error: run.error?.message ?? null }
fs.writeFileSync(receipt, JSON.stringify(data, null, 2), { flag: 'wx' })
console.log(data)
if (run.stdout) console.log(run.stdout.slice(-7500))
if (run.stderr) console.error(run.stderr.slice(-2000))
process.exitCode = run.status ?? 1

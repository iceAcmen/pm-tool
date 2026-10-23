import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const prefix = 'governance-fix-independent-retest-20261021'
const root = fs.mkdtempSync(path.join(dir, prefix + '-selftmp', 'supervisor-'))
const script = path.join(dir, prefix + '-run.mjs')
const mode = process.argv[2] ?? 'corrected'
if (!['corrected', 'red-only'].includes(mode)) throw new Error('Invalid mode')
const args = [script, mode]
const env = { PATH: path.dirname(process.execPath) + ':/usr/bin:/bin:/usr/sbin:/sbin',
  HOME: root, TMPDIR: root, NODE_ENV: 'test' }
const start = new Date().toISOString()
const r = spawnSync(process.execPath, args, { env, encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024 })
fs.writeFileSync(path.join(root, 'stdout.txt'), r.stdout ?? '')
fs.writeFileSync(path.join(root, 'stderr.txt'), r.stderr ?? '')
const sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const record = { command: [process.execPath, ...args], env, start, end: new Date().toISOString(),
  exit: r.status, signal: r.signal, error: r.error?.message ?? null,
  stdoutSha256: sha(path.join(root, 'stdout.txt')), stderrSha256: sha(path.join(root, 'stderr.txt')),
  childRoot: /SELFROOT=(.+)/.exec(r.stdout ?? '')?.[1] ?? null }
fs.writeFileSync(path.join(root, 'outer-execution.json'), JSON.stringify(record, null, 2) + '\n')
const out = path.join(dir, prefix + '-evidence', path.basename(root))
fs.cpSync(root, out, { recursive: true })
console.log(JSON.stringify(record, null, 2))
console.log((r.stdout ?? '').slice(-5000))
console.error(r.stderr)
process.exitCode = r.status ?? 1

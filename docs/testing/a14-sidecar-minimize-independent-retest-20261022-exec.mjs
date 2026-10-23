import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a14-sidecar-minimize-independent-retest-20261022'
const [round, phase, label = phase] = process.argv.slice(2)
assert.match(round, /^r[1-9]\d*$/)
assert(['prepare', 'run', 'finalize'].includes(phase))
assert.match(label, /^[a-z][a-z0-9-]*$/)
const root = join(repo, 'docs/testing', `${prefix}-selftmp`, `${round}-parent-executions`)
mkdirSync(root, { recursive: true, mode: 0o700 })
const args = [join(repo, 'docs/testing', `${prefix}-run.mjs`), round, phase]
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1' }
const start = new Date().toISOString()
const result = spawnSync(process.execPath, args, {
  cwd: repo, env, encoding: 'utf8', timeout: 300000, maxBuffer: 64 * 1024 * 1024,
})
for (const [name, data] of [
  ['stdout.log', result.stdout ?? ''], ['stderr.log', result.stderr ?? ''],
  ['command.json', JSON.stringify({ argv: [process.execPath, ...args], cwd: repo, env, start,
    end: new Date().toISOString(), originalExit: result.status, signal: result.signal, error: result.error?.message }, null, 2) + '\n'],
]) writeFileSync(join(root, `${label}.${name}`), data, { flag: 'wx' })
console.log(result.stdout ?? '')
console.error(result.stderr ?? '')
console.log(JSON.stringify({ label, originalExit: result.status, signal: result.signal }))
process.exitCode = result.status ?? 1

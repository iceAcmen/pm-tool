import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a15-f02-strict-effects-dom-retest-20261022'
const output = join(repo, 'docs/testing', `${prefix}-seal-final-command.json`)
assert(!existsSync(output), '不得覆盖终码原证')
const argv = [join(repo, 'docs/testing', `${prefix}-seal.mjs`), 'final']
const root = join(repo, 'docs/testing', `${prefix}-selftmp/r2-parent`)
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(root, 'home'), TMPDIR: join(root, 'tmp'), TMP: join(root, 'tmp'), TEMP: join(root, 'tmp'),
  XDG_CACHE_HOME: join(root, 'cache'), NODE_COMPILE_CACHE: join(root, 'cache/node'),
  CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC' }
const start = new Date().toISOString()
const result = spawnSync(process.execPath, argv, {
  cwd: repo, env, encoding: 'utf8', timeout: 180000, maxBuffer: 10 * 1024 * 1024,
})
const record = { argv: [process.execPath, ...argv], cwd: repo, env, start, end: new Date().toISOString(),
  exit: result.status, signal: result.signal, stdout: result.stdout, stderr: result.stderr,
  error: result.error?.message }
writeFileSync(output, `${JSON.stringify(record, null, 2)}\n`)
console.log(JSON.stringify(record))
process.exitCode = result.status === 0 ? 0 : 1

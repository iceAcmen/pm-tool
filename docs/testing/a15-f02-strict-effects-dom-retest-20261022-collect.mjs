import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a15-f02-strict-effects-dom-retest-20261022'
const round = process.argv[2]
assert.match(round, /^r[1-9]\d*$/)
const evidence = join(repo, 'docs/testing', `${prefix}-selftmp`, `${round}-parent`)
assert(!existsSync(evidence), 'parent原证不得覆盖')
mkdirSync(evidence, { recursive: true, mode: 0o700 })
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(evidence, 'home'), TMPDIR: join(evidence, 'tmp'), TMP: join(evidence, 'tmp'),
  TEMP: join(evidence, 'tmp'), XDG_CACHE_HOME: join(evidence, 'cache'),
  npm_config_cache: join(evidence, 'cache/npm'), NODE_COMPILE_CACHE: join(evidence, 'cache/node'),
  CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
}
for (const name of ['home', 'tmp', 'cache']) mkdirSync(join(evidence, name))
const argv = [join(repo, 'docs/testing', `${prefix}-run.mjs`), round]
const start = new Date().toISOString()
const result = spawnSync(process.execPath, argv, {
  cwd: repo, env, encoding: 'utf8', timeout: 240000, maxBuffer: 30 * 1024 * 1024,
})
writeFileSync(join(evidence, 'stdout.log'), result.stdout ?? '')
writeFileSync(join(evidence, 'stderr.log'), result.stderr ?? '')
const record = { argv: [process.execPath, ...argv], cwd: repo, env, start,
  end: new Date().toISOString(), exit: result.status, signal: result.signal, error: result.error?.message }
writeFileSync(join(evidence, 'command.json'), `${JSON.stringify(record, null, 2)}\n`)
console.log(JSON.stringify(record))
process.exitCode = result.status === 0 ? 0 : 1

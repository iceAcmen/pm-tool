import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a14-sidecar-minimize-independent-retest-20261022'
const round = process.argv[2]
assert.match(round, /^r[1-9]\d*$/)
const root = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
const source = join(repo, 'docs/testing', `${prefix}-source-audit-r1.mjs`)
const subject = join(repo, 'docs/testing', `${prefix}-source-audit-r2-subject.mjs`)
const original = readFileSync(source, 'utf8')
const old = "if (rule.selector.includes('pm-sidecar') && decl(rule, 'display').length)"
const next = "if (/\\.pm-sidecar(?![\\w-])/.test(rule.selector) && decl(rule, 'display').length)"
assert.equal(original.split(old).length, 2)
writeFileSync(subject, original.replace(old, next), { flag: 'wx' })
const patch = spawnSync('/usr/bin/git', ['diff', '--no-index', source, subject], { encoding: 'utf8' })
assert.equal(patch.status, 1)
writeFileSync(join(root, 'source-audit-r2-facility.patch'), patch.stdout, { flag: 'wx' })
const args = [subject, round]
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  TZ: 'UTC', LANG: 'en_US.UTF-8', NODE_DISABLE_COMPILE_CACHE: '1' }
const start = new Date().toISOString()
const result = spawnSync(process.execPath, args, { cwd: repo, env, encoding: 'utf8', timeout: 30000 })
for (const [name, value] of [['stdout.log', result.stdout ?? ''], ['stderr.log', result.stderr ?? ''],
  ['command.json', JSON.stringify({ argv: [process.execPath, ...args], cwd: repo, env, start,
    end: new Date().toISOString(), originalExit: result.status, signal: result.signal }, null, 2) + '\n']])
  writeFileSync(join(root, `source-audit-r2.${name}`), value, { flag: 'wx' })
console.log(result.stdout ?? '')
console.error(result.stderr ?? '')
process.exitCode = result.status ?? 1

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const base = join(repo, 'reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1')
const previous = join(base, 'r2')
assert(existsSync(join(previous, 'close.json')), '等待r2完整关闭，不修改在途原件')
const round = process.argv[2] ?? 'r3'
assert.match(round, /^r[3-9]\d*$/)
const own = join(base, round)
assert(!existsSync(own), '不得覆盖旧轮')
const sha = b => createHash('sha256').update(b).digest('hex')
function scan(root) {
  const output = {}
  function walk(p, rel = '') {
    const stat = lstatSync(p)
    if (stat.isSymbolicLink()) output[rel] = { link: readlinkSync(p) }
    else if (stat.isDirectory()) for (const name of readdirSync(p).sort()) walk(join(p, name), rel ? `${rel}/${name}` : name)
    else {
      const b = readFileSync(p)
      output[rel] = { bytes: b.length, sha256: sha(b) }
    }
  }
  walk(root)
  return output
}
function save(name, value) {
  const path = resolve(own, name)
  assert(path.startsWith(`${own}/`))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
mkdirSync(own, { recursive: true, mode: 0o700 })
const frozen = join(previous, 'frozen/packages/dsh-pm-tool')
const before = scan(previous)
save('previous-round-before.json', before)
const originalConfig = (await import(join(previous, 'vitest.config.mjs'))).default
const config = {
  ...originalConfig, plugins: undefined, cacheDir: join(own, 'cache/vite'),
  test: { ...originalConfig.test, server: { deps: { inline: ['lucide-react'] } } },
}
const suffix = JSON.parse(readFileSync(join(previous, 'virtual-adapter.json'))).additionOnly
save('vitest.config.mjs', `const config = ${JSON.stringify(config, null, 2)}
config.test.server.deps.inline = [/lucide-react/]
config.plugins = [{
  name: 'independent-private-TaskForm-export',
  enforce: 'pre',
  transform(code, id) {
    if (id !== ${JSON.stringify(join(frozen, 'src/client/panel.tsx'))}) return null
    return {code: code + ${JSON.stringify(suffix)}, map: null}
  }
}]
export default config
`)
save('facility-adjustment.json', {
  previousExit: JSON.parse(readFileSync(join(previous, 'vitest.command.json'))).exit,
  previousError: "Invalid hook call / useLucideContext null useContext，未到前置点击",
  adjustment: '仅自有Vitest server.deps.inline lucide-react，让真实图标源码经Vite解析同一React alias；无组件/hook/mock/状态变更',
  borrowedOwnedImmutable: previous, provenance: join(previous, 'candidate.json'),
  testSha256: sha(readFileSync(join(frozen, 'src/client/task-predecessor-refs-dom.test.tsx'))),
})
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(own, 'home'),
  TMPDIR: join(own, 'tmp'), TMP: join(own, 'tmp'), TEMP: join(own, 'tmp'),
  XDG_CACHE_HOME: join(own, 'cache'), npm_config_cache: join(own, 'cache/npm'),
  DSH_HOME: join(own, 'dsh-home'), QA_EVIDENCE_ROOT: join(own, 'observations'),
  CI: '1', LANG: 'zh_CN.UTF-8', TZ: 'UTC', NODE_ENV: 'development',
}
for (const value of Object.values(env).filter(v => v.startsWith(`${own}/`))) mkdirSync(value, { recursive: true, mode: 0o700 })
const args = [join(frozen, 'node_modules/vitest/vitest.mjs'), 'run', '--config', join(own, 'vitest.config.mjs'),
  '--no-cache', '--reporter=default', '--reporter=json', `--outputFile=${join(own, 'vitest.result.json')}`]
const started = new Date().toISOString()
const result = spawnSync(process.execPath, args, { cwd: frozen, env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
const execution = { argv: [process.execPath, ...args], cwd: frozen, env, node: process.version,
  runnerPid: process.pid, pid: result.pid, started, ended: new Date().toISOString(),
  exit: result.status, signal: result.signal, error: result.error?.message }
save('vitest.command.json', execution)
save('vitest.stdout.txt', result.stdout ?? '')
save('vitest.stderr.txt', result.stderr ?? '')
console.log(JSON.stringify(execution))
console.log(result.stdout)
console.error(result.stderr)
const after = scan(previous)
save('previous-round-after.json', after)
save('close.json', { previousUnchanged: JSON.stringify(before) === JSON.stringify(after),
  execution, childExited: result.status !== null, productModified: false,
  scope: '原冻结真实TaskForm必要红，不签并行修后/GUI/整项，禁止build/noemit/install/git/service', stop: true })
save('sealed-evidence.json', scan(own))
process.exitCode = JSON.stringify(before) !== JSON.stringify(after) ? 2 : result.status ?? 2

// 独立 runner，不 import/执行开发runner、mirror/helper或lib。
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PREFIX = path.join(REPO, 'docs/testing/p2007-archive-projection-source-auto-20261023-r1-')
const audit = JSON.parse(readFileSync(`${PREFIX}audit.json`, 'utf8'))
const label = process.argv[2]
assert(['affected', 'bytes'].includes(label), '仅四专项或独立字节专项')
assert(!existsSync(`${PREFIX}${label}-receipt.json`), '同一专项仅执行一次，不覆盖原收据')
const root = audit.root
const input = path.join(root, 'input')
const output = path.join(root, 'output', label)
mkdirSync(output)
const hash = b => createHash('sha256').update(b).digest('hex')
const fp = file => {
  const b = readFileSync(file)
  return { path: file, bytes: b.length, sha256: hash(b) }
}
function save(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
for (const f of audit.sourceInputs) {
  const now = fp(path.join(root, f.copiedPath))
  assert.equal(now.sha256, f.sha256, `冻结输入漂移：${f.path}`)
}
let tests = audit.tests
if (label === 'bytes') {
  copyFileSync(`${PREFIX}bytes.test.ts`, path.join(input, 'independent-bytes.test.ts'))
  tests = ['independent-bytes.test.ts']
}
const config = path.join(root, 'config', `${label}.config.mjs`)
writeFileSync(config, `export default {
  root: ${JSON.stringify(input)},
  cacheDir: ${JSON.stringify(path.join(root, 'cache', label))},
  test: {
    environment: 'node', include: ${JSON.stringify(tests)},
    pool: 'forks', poolOptions: { forks: { singleFork: true } },
    fileParallelism: false, isolate: true
  }
}\n`, { flag: 'wx' })
const env = {
  PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`,
  HOME: path.join(root, 'home'), TMPDIR: path.join(root, 'output/tmp'),
  XDG_CONFIG_HOME: path.join(root, 'config'), XDG_CACHE_HOME: path.join(root, 'cache'),
  XDG_DATA_HOME: path.join(root, 'output/data'), LANG: 'en_US.UTF-8', TZ: 'UTC',
  CI: '1', NO_COLOR: '1', P2007_SOURCE_AUTO_OUTPUT: output,
}
const manifest = { label, tests, config, files: [
  ...audit.sourceInputs.map(f => fp(path.join(root, f.copiedPath))),
  fp(config), fp(fileURLToPath(import.meta.url)),
  ...(label === 'bytes' ? [fp(`${PREFIX}bytes.test.ts`), fp(path.join(input, tests[0]))] : []),
], env, root }
save(`${PREFIX}${label}-inputs.json`, manifest)
const args = [path.join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--config', config,
  '--reporter=verbose', '--reporter=json', '--outputFile', path.join(output, 'vitest-result.json')]
const start = new Date().toISOString()
const result = spawnSync(process.execPath, args, {
  cwd: input, env, encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024,
})
const stdout = result.stdout ?? ''
const stderr = result.stderr ?? ''
writeFileSync(`${PREFIX}${label}-stdout.log`, stdout, { flag: 'wx' })
writeFileSync(`${PREFIX}${label}-stderr.log`, stderr, { flag: 'wx' })
const receipt = {
  role: 'independent SOURCE/AUTO expert', label, command: process.execPath, args, cwd: input,
  env, start, end: new Date().toISOString(), exit: result.status,
  signal: result.signal, error: result.error?.message ?? null,
  stdout: { bytes: Buffer.byteLength(stdout), sha256: hash(stdout) },
  stderr: { bytes: Buffer.byteLength(stderr), sha256: hash(stderr) },
  judgment: '原始执行结果；由独立专家结合schema/输入/输出另审',
}
save(`${PREFIX}${label}-receipt.json`, receipt)
if (existsSync(path.join(output, 'vitest-result.json'))) {
  copyFileSync(path.join(output, 'vitest-result.json'), `${PREFIX}${label}-vitest-result.json`)
}
if (existsSync(path.join(output, 'original-records-projection.json'))) {
  copyFileSync(path.join(output, 'original-records-projection.json'), `${PREFIX}original-records-projection.json`)
}
process.stdout.write(stdout)
process.stderr.write(stderr)
process.exit(result.status ?? 1)

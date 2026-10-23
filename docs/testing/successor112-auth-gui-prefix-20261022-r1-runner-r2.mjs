import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const prefix = path.join(root, 'docs/testing/successor112-auth-gui-prefix-20261022-r1')
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const json = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const save = (name, value) => fs.writeFileSync(`${prefix}-r2-${name}.json`, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const facility = json(`${prefix}-facility.json`)
const closed = json(`${prefix}-test-close.json`)
assert.equal(closed.ownedPidExited, true)
const oldTest = path.join(facility.pkg, facility.testRel)
const test = fs.readFileSync(oldTest, 'utf8')
assert.equal(sha(Buffer.from(test)), facility.testSource.sha256)
const originalReader = "const visibleText = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : visibleText(c)).join('')"
const correctedReader = "const visibleText = (n: ReactTestInstance): string => n.type === 'br' ? '\\n' : n.children.map(c => typeof c === 'string' ? c : visibleText(c)).join('')"
assert.equal(test.split(originalReader).length, 2)
const corrected = test.replace(originalReader, correctedReader)
const correctedFile = `${prefix}-r2-component.fixture.tsx`
fs.writeFileSync(correctedFile, corrected, { flag: 'wx' })
const rows = base => {
  const result = []
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const f = path.join(d, e.name), rel = path.relative(base, f)
      if (e.isDirectory()) walk(f)
      else if (e.isSymbolicLink()) result.push({ rel, link: fs.readlinkSync(f) })
      else { const b = fs.readFileSync(f); result.push({ rel, bytes: b.length, sha256: sha(b) }) }
    }
  }
  walk(base)
  return sha(Buffer.from(JSON.stringify(result)))
}
function guard() {
  assert.equal(rows(path.join(facility.sourceFrom, 'src')), facility.originalSourceDigest)
  assert.equal(rows(path.join(facility.sourceFrom, 'node_modules')), facility.originalDependencyDigest)
  assert.equal(rows(path.join(facility.pkg, 'src')), facility.frozenSourceDigest)
  assert.equal(rows(path.join(facility.pkg, 'node_modules')), facility.copiedDependencyDigest)
  assert.equal(sha(fs.readFileSync(facility.transcript)), facility.transcriptStamp.sha256)
}
guard()
const tmp = fs.mkdtempSync('/private/tmp/successor112-auth-gui-prefix-20261022-r1-r2-')
for (const rel of ['home', 'cache', 'tmp']) fs.mkdirSync(path.join(tmp, rel))
const config = path.join(tmp, 'vitest.config.mjs')
const baseConfig = {
  root: facility.pkg, cacheDir: path.join(tmp, 'cache'), esbuild: { jsx: 'automatic' },
  test: {
    include: [facility.testRel], environment: 'node', pool: 'forks', poolOptions: { forks: { singleFork: true } },
    minWorkers: 1, maxWorkers: 1, fileParallelism: false, testTimeout: 15000, hookTimeout: 15000,
    server: { deps: { inline: ['lucide-react'] } },
  },
}
fs.writeFileSync(config, `import fs from 'node:fs';\nexport default {...${JSON.stringify(baseConfig)},
plugins:[{name:'own-test-br-reader-only',enforce:'pre',transform(code,id){
if(id!==${JSON.stringify(oldTest)})return null;
return {code:fs.readFileSync(${JSON.stringify(correctedFile)},'utf8'),map:null};
}}]};\n`, { flag: 'wx' })
const observations = `${prefix}-r2-observations.ndjson`
fs.writeFileSync(observations, '', { flag: 'wx' })
const stdout = fs.openSync(`${prefix}-r2-test.stdout.txt`, 'wx')
const stderr = fs.openSync(`${prefix}-r2-test.stderr.txt`, 'wx')
const env = {
  PATH: path.dirname(process.execPath) + ':/usr/bin:/bin:/usr/sbin:/sbin', HOME: path.join(tmp, 'home'),
  TMPDIR: path.join(tmp, 'tmp'), XDG_CACHE_HOME: path.join(tmp, 'cache'), CI: 'true', LANG: 'zh_CN.UTF-8',
  PREFIX_TRANSCRIPT: facility.transcript, PREFIX_OBSERVATIONS: observations,
}
const argv = [path.join(facility.pkg, 'node_modules/vitest/vitest.mjs'), 'run', '--config', config,
  '--no-cache', '--reporter=json', `--outputFile=${prefix}-r2-test.result.json`]
const startedAt = new Date().toISOString()
const result = spawnSync(process.execPath, argv, { cwd: facility.pkg, env, stdio: ['ignore', stdout, stderr], timeout: 120000 })
fs.closeSync(stdout); fs.closeSync(stderr)
save('command', {
  startedAt, endedAt: new Date().toISOString(), executable: process.execPath, argv, cwd: facility.pkg, env,
  pid: result.pid, status: result.status, signal: result.signal, error: result.error?.message ?? null,
  adapter: { originalReader, correctedReader, originalTestSha256: facility.testSource.sha256,
    correctedTestSha256: sha(Buffer.from(corrected)), productTransform: false }, tmp,
})
assert.equal(result.signal, null)
guard()
let exited = false
try { process.kill(result.pid, 0) } catch (e) { if (e.code === 'ESRCH') exited = true; else throw e }
assert(exited)
const tests = json(`${prefix}-r2-test.result.json`).testResults.flatMap(r => r.assertionResults)
const observed = fs.readFileSync(observations, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
save('close', {
  at: new Date().toISOString(), released: true, stop: true, actualExit: result.status,
  counts: { total: tests.length, passed: tests.filter(t => t.status === 'passed').length,
    failed: tests.filter(t => t.status === 'failed').length, other: tests.filter(t => !['passed', 'failed'].includes(t.status)).length },
  cases: tests.map(t => ({ title: t.fullName, status: t.status })), observations: observed.length,
  ownedPid: result.pid, ownedPidExited: exited, originalAndOwnedInputsUnchanged: true, noProductTransform: true,
})
console.log(JSON.stringify({ action: 'own-oracle-r2', actualExit: result.status, total: tests.length, observations: observed.length, exited }))
process.exitCode = result.status ?? 2

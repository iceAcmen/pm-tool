import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const prefix = path.join(root, 'docs/testing/successor112-auth-gui-prefix-20261022-r1')
const old = '/private/tmp/pmtool-combined-successor112-20261022-r1/packages/dsh-pm-tool'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const json = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const save = (name, value) => fs.writeFileSync(`${prefix}-${name}.json`, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const testSource = `${prefix}-component.test.tsx`
const stamp = f => { const b = fs.readFileSync(f); return { bytes: b.length, sha256: sha(b) } }
function entries(base) {
  const rows = []
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const f = path.join(d, e.name), rel = path.relative(base, f)
      if (e.isDirectory()) walk(f)
      else if (e.isSymbolicLink()) rows.push({ rel, link: fs.readlinkSync(f) })
      else rows.push({ rel, ...stamp(f) })
    }
  }
  walk(base)
  return rows
}
const digest = rows => sha(Buffer.from(JSON.stringify(rows)))
const testRel = 'src/client/successor112-auth-gui-prefix-20261022-r1.test.tsx'
const action = process.argv[2]
if (action === 'freeze') {
  assert(!fs.existsSync(`${prefix}-facility.json`), 'Original facility must not be overwritten')
  const audited = json(`${prefix}-audit.json`)
  assert.equal(audited.verdict.prefixCompleteMessage, 'FAIL')
  const tmp = fs.mkdtempSync('/private/tmp/successor112-auth-gui-prefix-20261022-r1-')
  const pkg = path.join(tmp, 'package')
  fs.mkdirSync(pkg)
  fs.cpSync(path.join(old, 'src'), path.join(pkg, 'src'), { recursive: true, dereference: false, verbatimSymlinks: true })
  for (const rel of ['package.json', 'tsconfig.json']) fs.copyFileSync(path.join(old, rel), path.join(pkg, rel), fs.constants.COPYFILE_EXCL)
  const depsFrom = path.join(old, 'node_modules'), depsTo = path.join(pkg, 'node_modules')
  const sourceDeps = entries(depsFrom)
  fs.cpSync(depsFrom, depsTo, { recursive: true, dereference: false, verbatimSymlinks: true })
  let linkCount = 0, fileCount = 0
  for (const row of sourceDeps) {
    const from = path.join(depsFrom, row.rel), to = path.join(depsTo, row.rel)
    if ('link' in row) {
      let link = row.link
      if (path.isAbsolute(link)) {
        assert(link.startsWith(depsFrom + path.sep), `External source dependency link: ${row.rel}`)
        link = path.join(depsTo, path.relative(depsFrom, link))
        fs.unlinkSync(to)
        fs.symlinkSync(link, to)
      }
      const real = fs.realpathSync(to)
      assert(real.startsWith(depsTo + path.sep), `External copied dependency link: ${row.rel}`)
      linkCount++
    } else {
      assert.deepEqual(stamp(to), { bytes: row.bytes, sha256: row.sha256 })
      const a = fs.statSync(from), b = fs.statSync(to)
      assert(a.dev !== b.dev || a.ino !== b.ino, `Shared inode: ${row.rel}`)
      fileCount++
    }
  }
  fs.copyFileSync(testSource, path.join(pkg, testRel), fs.constants.COPYFILE_EXCL)
  const terminal = audited.rpc.filter(r => r.line.startsWith('/pm ask ')).map(r => r.command)
  const transcript = `${prefix}-transcript.json`
  fs.writeFileSync(transcript, JSON.stringify({ auth: terminal[0], rate: terminal[1], normal: terminal[2] }, null, 2) + '\n', { flag: 'wx' })
  for (const rel of ['home', 'cache', 'tmp']) fs.mkdirSync(path.join(tmp, rel))
  const config = path.join(tmp, 'vitest.config.mjs')
  fs.writeFileSync(config, `export default ${JSON.stringify({
    root: pkg, cacheDir: path.join(tmp, 'cache'), esbuild: { jsx: 'automatic' },
    test: {
      include: [testRel], environment: 'node', pool: 'forks', poolOptions: { forks: { singleFork: true } },
      maxWorkers: 1, minWorkers: 1, fileParallelism: false, testTimeout: 15000, hookTimeout: 15000,
      server: { deps: { inline: ['lucide-react'] } },
    },
  }, null, 2)};\n`, { flag: 'wx' })
  save('facility', {
    at: new Date().toISOString(), tmp, pkg, config, transcript, testRel,
    testSource: stamp(testSource), configStamp: stamp(config), transcriptStamp: stamp(transcript),
    sourceFrom: old, originalSourceDigest: digest(entries(path.join(old, 'src'))),
    frozenSourceDigest: digest(entries(path.join(pkg, 'src'))),
    originalDependencyDigest: digest(sourceDeps), copiedDependencyDigest: digest(entries(depsTo)),
    fileCount, linkCount, sharedInodes: 0, externalLinks: 0, node: process.version,
    copiedPackageStamps: Object.fromEntries(['package.json', 'tsconfig.json'].map(f => [f, stamp(path.join(pkg, f))])),
    mode: 'real original112 component AUTO; no product build/install or browser',
  })
  console.log(JSON.stringify({ action, tmp, fileCount, linkCount, exit: 0 }))
} else if (action === 'test') {
  const facility = json(`${prefix}-facility.json`)
  assert.deepEqual(stamp(testSource), facility.testSource)
  assert.equal(digest(entries(path.join(facility.pkg, 'src'))), facility.frozenSourceDigest)
  assert.deepEqual(stamp(facility.config), facility.configStamp)
  const observations = `${prefix}-observations.ndjson`
  fs.writeFileSync(observations, '', { flag: 'wx' })
  const stdout = fs.openSync(`${prefix}-test.stdout.txt`, 'wx')
  const stderr = fs.openSync(`${prefix}-test.stderr.txt`, 'wx')
  const env = {
    PATH: path.dirname(process.execPath) + ':/usr/bin:/bin:/usr/sbin:/sbin',
    HOME: path.join(facility.tmp, 'home'), TMPDIR: path.join(facility.tmp, 'tmp'),
    XDG_CACHE_HOME: path.join(facility.tmp, 'cache'), CI: 'true', LANG: 'zh_CN.UTF-8',
    PREFIX_TRANSCRIPT: facility.transcript, PREFIX_OBSERVATIONS: observations,
  }
  const argv = [
    path.join(facility.pkg, 'node_modules/vitest/vitest.mjs'), 'run', '--config', facility.config,
    '--no-cache', '--reporter=json', `--outputFile=${prefix}-test.result.json`,
  ]
  const startedAt = new Date().toISOString()
  const result = spawnSync(process.execPath, argv, {
    cwd: facility.pkg, env, stdio: ['ignore', stdout, stderr], timeout: 120000,
  })
  fs.closeSync(stdout); fs.closeSync(stderr)
  save('test-command', {
    startedAt, endedAt: new Date().toISOString(), executable: process.execPath, argv, cwd: facility.pkg,
    env, pid: result.pid, status: result.status, signal: result.signal, error: result.error?.message ?? null,
    expectedRedExit: 1, notGui: true,
  })
  console.log(JSON.stringify({ action, actualExit: result.status, signal: result.signal, pid: result.pid }))
  process.exitCode = result.status ?? 2
} else if (action === 'close') {
  const facility = json(`${prefix}-facility.json`)
  const command = json(`${prefix}-test-command.json`)
  assert.equal(command.signal, null)
  let alive = true
  try { process.kill(command.pid, 0) } catch (e) { if (e.code === 'ESRCH') alive = false; else throw e }
  assert.equal(alive, false, 'Owned test process must have exited')
  assert.equal(digest(entries(path.join(old, 'src'))), facility.originalSourceDigest)
  assert.equal(digest(entries(path.join(old, 'node_modules'))), facility.originalDependencyDigest)
  assert.equal(digest(entries(path.join(facility.pkg, 'src'))), facility.frozenSourceDigest)
  assert.equal(digest(entries(path.join(facility.pkg, 'node_modules'))), facility.copiedDependencyDigest)
  assert.deepEqual(stamp(facility.config), facility.configStamp)
  assert.deepEqual(stamp(facility.transcript), facility.transcriptStamp)
  const result = json(`${prefix}-test.result.json`)
  const cases = result.testResults.flatMap(r => r.assertionResults)
  const observations = fs.readFileSync(`${prefix}-observations.ndjson`, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
  save('test-close', {
    at: new Date().toISOString(), released: true, stop: true, ownedPid: command.pid, ownedPidExited: true,
    originalFrozenSourceAndDependenciesUnchanged: true, ownSourceDependenciesConfigTranscriptUnchanged: true,
    actualExit: command.status, counts: {
      actualCases: cases.length, passed: cases.filter(c => c.status === 'passed').length,
      failed: cases.filter(c => c.status === 'failed').length, other: cases.filter(c => !['passed', 'failed'].includes(c.status)).length,
    },
    cases: cases.map(c => ({ title: c.fullName, status: c.status })), observations: observations.length,
    sourceOrComponentFailNotGui: true, preservedTmp: facility.tmp,
  })
  console.log(JSON.stringify({ action, cases: cases.length, observations: observations.length, exit: 0 }))
} else throw new Error('Use freeze | test | close')

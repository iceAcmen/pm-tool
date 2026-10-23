import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const out = repo + '/reports/all-pending-evidence-20261021/CombinedSixRepairsR1'
const node = '/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const save = (name, value) => fs.writeFileSync(out + '/' + name,
  typeof value === 'string' ? value : JSON.stringify(value, null, 2), { flag: 'wx' })
const read = name => JSON.parse(fs.readFileSync(out + '/' + name))
const mode = process.argv[2]
if (mode === 'close') {
  assert.equal(read('special.command.json').exitCode, 1)
  assert.equal(read('special-r2.command.json').exitCode, 0)
  assert.equal(read('special-r2-prerequisites.json').productOrOracleChanged, false)
  const original = fs.readFileSync(out + '/executor-source.mjs', 'utf8')
  const needle = "['tsc', 'bundle', 'noemit', 'full', 'dom', 'special', 'verify', 'guard']"
  assert.equal(original.split(needle).length, 2)
  const adapted = original.replace(needle, "['tsc', 'bundle', 'noemit', 'full', 'dom', 'special-r2', 'verify', 'guard']")
  const executable = out + '/close-executor-source.mjs'
  save('close-executor-source.mjs', adapted)
  save('close-derivation.json', { beforeSha256: sha(original), afterSha256: sha(adapted),
    onlyChange: 'Successful special-r2 replaces original failed special in required successful receipts; original failure remains archived' })
  const started = new Date().toISOString()
  const child = spawnSync(node, [executable, 'close'], { cwd: repo, env: { PATH: path.dirname(node) + ':/usr/bin:/bin' },
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  save('close-outer-receipt.json', { argv: [node, executable, 'close'], cwd: repo, started,
    ended: new Date().toISOString(), pid: child.pid, exitCode: child.status, signal: child.signal, error: child.error?.message })
  save('close-outer-stdout.txt', child.stdout ?? '')
  save('close-outer-stderr.txt', child.stderr ?? '')
  console.log({ exitCode: child.status, stdoutTail: child.stdout?.slice(-1600), stderrTail: child.stderr?.slice(-1600) })
  process.exitCode = child.status ?? 2
} else if (mode === 'seal') {
  assert.equal(read('close-outer-receipt.json').exitCode, 0)
  const results = {}
  for (const name of ['full', 'dom', 'special-r2']) {
    const r = read(name + '.result.json')
    results[name] = { files: [...new Set(r.testResults.map(t => t.name))].length,
      total: r.numTotalTests, passed: r.numPassedTests, failed: r.numFailedTests, pending: r.numPendingTests }
    assert.equal(r.numFailedTests, 0); assert.equal(r.numPendingTests, 0)
  }
  save('summary.json', { at: new Date().toISOString(), candidate: read('candidate.json'), results,
    verifySummary: fs.readFileSync(out + '/verify.stdout.txt', 'utf8').split('\n').filter(line =>
      line.includes('脚本：共') || line.includes('资产：') || line.includes('污染')),
    originalSpecialExit: 1, specialCorrection: 'Run unchanged supplemental tests after full actually generates required legal fixtures',
    executorVerdict: 'Raw execution results only; independent combination verdict not signed; GUI not covered' })
  fs.mkdirSync(out + '/execution-scripts', { recursive: true })
  for (const name of ['2026-10-23-six-repairs-regression.md', '2026-10-23-six-repairs-execute.mjs',
    '2026-10-23-six-repairs-special-after-full.mjs', '2026-10-23-six-repairs-close.mjs'])
    fs.copyFileSync(repo + '/docs/plans/' + name, out + '/execution-scripts/' + name, fs.constants.COPYFILE_EXCL)
  const files = []
  function walk(dir, rel = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name), name = rel ? rel + '/' + entry.name : entry.name
      const stat = fs.lstatSync(file)
      if (stat.isSymbolicLink()) files.push({ file: name, link: fs.readlinkSync(file) })
      else if (stat.isDirectory()) walk(file, name)
      else { const bytes = fs.readFileSync(file); files.push({ file: name, bytes: bytes.length, sha256: sha(bytes) }) }
    }
  }
  walk(out)
  save('index-r1.json', { at: new Date().toISOString(), count: files.length, files,
    excludes: ['index-r1.json itself'], independentVerdict: 'NOT_SIGNED_BY_EXECUTOR' })
  console.log({ sealed: files.length, results })
} else throw new Error('Expected close or seal')

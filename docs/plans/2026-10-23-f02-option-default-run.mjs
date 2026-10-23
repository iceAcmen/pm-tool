// Main 开发自测执行器：只写自有证据/隔离根，不构建主 lib，不签独立门。
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const pkg = path.join(repo, 'packages/dsh-pm-tool')
const out = path.join(repo, 'reports/all-pending-evidence-20261021/F02OptionDefaultDevelopmentR2')
const stage = process.argv[2]
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const write = (p, value) => {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2), { flag: 'wx' })
}
const info = p => {
  const b = fs.readFileSync(p)
  return { bytes: b.length, sha256: sha(b) }
}
const listbox = 'src/client/views/records/records-listbox.tsx'
const test = 'src/client/views/records/records-deliverable-pointer-dom.test.tsx'
const capture = read(path.join(repo, 'docs/testing/p1005-listbox-backdrop-source-auto-20261023-r1-capture.json'))
const completePath = path.join(repo, 'reports/all-pending-evidence-20261021/SixRepairsGuiR1/combined-complete-inputs.json')
const complete = read(completePath)
const selected = capture.selectedInputs.map(x => x.path.replace('packages/dsh-pm-tool/', ''))

if (stage === 'baseline') {
  assert(!fs.existsSync(out), '开发证据根已经存在，不得覆盖')
  for (const [rel, expected] of Object.entries(complete)) {
    assert.deepEqual(info(path.join(pkg, rel)), expected, rel)
  }
  assert.equal(Object.keys(complete).length, 525)
  for (const rel of selected) write(path.join(out, 'baseline-source', rel), fs.readFileSync(path.join(pkg, rel)))
  write(path.join(out, 'baseline-complete-inputs.json'), complete)
  write(path.join(out, 'baseline.json'), {
    at: new Date().toISOString(), baselineCommit: '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd',
    completeInputs: 525, completeIdentity: info(completePath), selected, dependencies: capture.dependencies,
    dependencyInputs: capture.dependencyInputs, sourceCopies: selected.map(rel => ({ path: rel, ...info(path.join(pkg, rel)) })),
    boundary: 'Main修前输入认领；非独立验收；原525字节一致。',
  })
  console.log({ stage, inputs: 525, sourceCopies: selected.length, exit: 0 })
} else if (['red', 'green', 'related'].includes(stage)) {
  assert(!fs.existsSync(path.join(out, stage)), '不得重放旧轮')
  const baseline = read(path.join(out, 'baseline.json'))
  const permitted = stage === 'red' ? [test] : [listbox, test]
  const delta = []
  for (const [rel, expected] of Object.entries(complete)) {
    const actual = info(path.join(pkg, rel))
    if (actual.sha256 !== expected.sha256) delta.push({ path: rel, before: expected, after: actual })
  }
  assert.deepEqual(delta.map(x => x.path).sort(), permitted.sort())
  if (stage !== 'red') {
    const red = read(path.join(out, 'red/receipt.json'))
    assert.equal(info(path.join(pkg, test)).sha256, red.testSha256, '红绿必须同一测试')
  }
  for (const item of baseline.dependencyInputs) assert.deepEqual(info(path.join(repo, item.path)), { bytes: item.bytes, sha256: item.sha256 }, item.path)
  const tmp = fs.mkdtempSync('/private/tmp/pmtool-f02-option-default-' + stage + '-')
  const runRoot = path.join(tmp, 'inputs')
  for (const name of ['home', 'tmp', 'config', 'cache', 'output', 'inputs/node_modules']) fs.mkdirSync(path.join(tmp, name), { recursive: true })
  const before = selected.map(rel => ({ path: rel, ...info(path.join(pkg, rel)) }))
  for (const rel of selected) {
    const b = fs.readFileSync(path.join(pkg, rel))
    write(path.join(runRoot, rel), b)
    write(path.join(out, stage, 'source', rel), b)
  }
  for (const dep of baseline.dependencies) fs.symlinkSync(dep.target, path.join(runRoot, 'node_modules', dep.name))
  const dep = name => baseline.dependencies.find(d => d.name === name).target
  const identitySetup = path.join(tmp, 'config/identity-after-suite.mjs')
  write(identitySetup, `import { afterAll } from 'vitest'
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
afterAll(() => {
  const require = createRequire(${JSON.stringify(path.join(runRoot, 'package.json'))})
  const react = require('react')
  const fromDom = createRequire(require.resolve('react-dom/package.json'))('react')
  writeFileSync(process.env.QA_IDENTITY_OUTPUT, JSON.stringify({
    sameIdentity: react === fromDom, react: require.resolve('react'),
    reactFromDom: createRequire(require.resolve('react-dom/package.json')).resolve('react'),
    version: react.version, timing: 'afterAll：JSDOM globals 与产品 ReactDOM 导入之后',
  }, null, 2), { flag: 'wx' })
  if (react !== fromDom) throw new Error('React identity mismatch')
})
`)
  const includes = stage === 'related' ? selected.filter(p => p.endsWith('.test.ts') && p !== test) : [test]
  const config = path.join(tmp, 'config/vitest.mjs')
  write(config, `export default {
  root: ${JSON.stringify(runRoot)}, cacheDir: ${JSON.stringify(path.join(tmp, 'cache'))},
  esbuild: { jsx: 'automatic' },
  resolve: { alias: { react: ${JSON.stringify(dep('react'))}, 'react-dom': ${JSON.stringify(dep('react-dom'))} } },
  test: { environment: 'node', include: ${JSON.stringify(includes)},
    setupFiles: ${JSON.stringify(stage === 'related' ? [] : [identitySetup])},
    pool: 'forks', poolOptions: { forks: { singleFork: true } },
    reporters: ['verbose', 'json'], outputFile: { json: ${JSON.stringify(path.join(tmp, 'output/results.json'))} } }
}`)
  const env = {
    PATH: path.dirname(process.execPath) + ':/usr/bin:/bin',
    HOME: path.join(tmp, 'home'), TMPDIR: path.join(tmp, 'tmp'), LANG: 'en_US.UTF-8',
    XDG_CONFIG_HOME: path.join(tmp, 'config'), XDG_CACHE_HOME: path.join(tmp, 'cache'),
    QA_POINTER_EVIDENCE_ROOT: path.join(tmp, 'output/observations'),
    QA_IDENTITY_OUTPUT: path.join(tmp, 'output/identity.json'),
  }
  const argv = [process.execPath, path.join(dep('vitest'), 'vitest.mjs'), 'run', '--config', config]
  const startedAt = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd: runRoot, env, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  write(path.join(out, stage, 'stdout.txt'), r.stdout ?? '')
  write(path.join(out, stage, 'stderr.txt'), r.stderr ?? '')
  function copyTree(from, to) {
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      const a = path.join(from, entry.name), b = path.join(to, entry.name)
      if (entry.isDirectory()) copyTree(a, b)
      else if (entry.isFile()) write(b, fs.readFileSync(a))
      else throw new Error('自有输出不能含软链')
    }
  }
  copyTree(path.join(tmp, 'output'), path.join(out, stage, 'output'))
  write(path.join(out, stage, 'config.mjs'), fs.readFileSync(config))
  write(path.join(out, stage, 'identity-after-suite.mjs'), fs.readFileSync(identitySetup))
  const after = selected.map(rel => ({ path: rel, ...info(path.join(pkg, rel)) }))
  assert.deepEqual(before, after, '运行期间生产输入发生变化')
  for (const item of baseline.dependencyInputs) assert.deepEqual(info(path.join(repo, item.path)), { bytes: item.bytes, sha256: item.sha256 }, item.path)
  const receipt = { argv, cwd: runRoot, environment: env, tmp, startedAt, endedAt: new Date().toISOString(),
    exit: r.status, signal: r.signal, error: r.error?.message ?? null, before, after,
    testSha256: info(path.join(pkg, test)).sha256, delta,
    dependencyDrift: [], boundary: 'Main开发自测；无GUI/布局/坐标/RPC/落盘或独立PASS。' }
  write(path.join(out, stage, 'receipt.json'), receipt)
  const results = read(path.join(tmp, 'output/results.json'))
  if (stage === 'red') {
    assert.equal(r.status, 1)
    assert.equal(results.numPassedTests, 7)
    assert.equal(results.numFailedTests, 2)
    for (const c of results.testResults.flatMap(s => s.assertionResults).filter(c => c.status === 'failed')) {
      assert(/D0[89]/.test(c.title))
      assert(c.failureMessages.some(m => m.includes('defaultPrevented') || m.includes('默认激活')))
    }
  } else {
    assert.equal(r.status, 0, r.stderr)
    assert.equal(results.numFailedTests, 0)
    assert.equal(results.numPassedTests, stage === 'green' ? 9 : 28)
    assert.equal(r.stderr.trim(), '', '开发green/related应无stderr')
  }
  console.log({ stage, actualTestExit: r.status, passed: results.numPassedTests, failed: results.numFailedTests, tmp, exit: 0 })
} else {
  throw new Error('用法：node 本文件 baseline|red|green|related')
}

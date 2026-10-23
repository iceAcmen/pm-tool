import {
  readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync,
  realpathSync, symlinkSync, mkdtempSync,
} from 'node:fs'
import { resolve, join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'p1005-listbox-backdrop-source-auto-20261023-r1'
const docs = join(repo, 'docs/testing')
const pkg = join(repo, 'packages/dsh-pm-tool')
const devPrefix = 'docs/plans/2026-10-23-p1005-deliverable-pointer-'
const oldRoot = 'reports/all-pending-evidence-20261021/P1L2EventsR1'
const listbox = 'packages/dsh-pm-tool/src/client/views/records/records-listbox.tsx'
const domTest = 'src/client/views/records/records-deliverable-pointer-dom.test.tsx'
const oldTests = [
  'src/client/views/records/records-options.test.ts',
  'src/client/views/records/records-payloads.test.ts',
  'src/client/views/records/records-history.test.ts',
  'src/client/form-validation.test.ts',
]
const read = p => readFileSync(resolve(repo, p))
const json = p => JSON.parse(read(p))
const hash = b => createHash('sha256').update(b).digest('hex')
const fp = p => {
  const absolute = resolve(repo, p)
  const bytes = readFileSync(absolute)
  return { path: absolute.startsWith(repo + '/') ? relative(repo, absolute) : absolute,
    bytes: bytes.length, sha256: hash(bytes) }
}
const same = (a, b) => a.bytes === b.bytes && a.sha256 === b.sha256
const put = (path, value) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' || Buffer.isBuffer(value)
    ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
const out = (suffix, value) => put(join(docs, `${prefix}-${suffix}`), value)
function tree(root) {
  const result = []
  for (const e of readdirSync(root, { withFileTypes: true })) {
    const p = join(root, e.name)
    if (e.isDirectory()) result.push(...tree(p))
    else if (e.isFile()) result.push(fp(p))
  }
  return result.sort((a, b) => a.path.localeCompare(b.path))
}
function drift(inputs) {
  return inputs.flatMap(before => {
    try {
      const after = fp(before.path)
      return same(before, after) ? [] : [{ before, after }]
    } catch (error) {
      return [{ before, error: error.message }]
    }
  })
}
function child(argv, cwd, env, stem) {
  const startedAt = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), {
    cwd, env, encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024,
  })
  put(stem + '-stdout.log', r.stdout ?? '')
  put(stem + '-stderr.log', r.stderr ?? '')
  const receipt = { argv, cwd, environment: env, startedAt, endedAt: new Date().toISOString(),
    exit: r.status, signal: r.signal, facilityError: r.error?.message ?? null }
  put(stem + '-command.json', receipt)
  return receipt
}
const stage = process.argv[2]
assert.ok(['capture', 'run', 'seal'].includes(stage), '只接受 capture/run/seal')
const capturePath = join(docs, prefix + '-capture.json')
const beforeOwn = readdirSync(docs).filter(p => p.startsWith(prefix))

if (stage === 'capture') {
  assert.equal(beforeOwn.length, 1, 'capture 前只允许本 runner；不覆盖既有产物')
  const tmp = mkdtempSync('/tmp/' + prefix + '-')
  for (const name of ['inputs', 'config', 'cache', 'home', 'output', 'tmp']) mkdirSync(join(tmp, name))
  const environment = { platform: process.platform, node: process.version, nodePath: process.execPath, cwd: repo }
  const baseline = json(devPrefix + 'baseline.json')
  assert.equal(baseline.inputs.length, 1102)
  assert.equal(new Set(baseline.inputs.map(x => x.path)).size, 1102)
  const seal = json(devPrefix + 'seal-r2.json')
  const check = json(devPrefix + 'final-check-r2.json')
  assert.ok(same(fp(devPrefix + 'seal-r2.json'), { bytes: fp(devPrefix + 'seal-r2.json').bytes, sha256: check.sealSha256 }))
  const originalIndex = json(oldRoot + '/index-r1.json')
  const originalFiles = Object.entries(originalIndex).map(([path, expected]) => {
    assert.ok(!path.startsWith('/') && !path.split('/').includes('..'))
    const actual = fp(oldRoot + '/' + path)
    assert.ok(same(actual, expected), '原1077件漂移: ' + path)
    const declared = baseline.inputs.find(f => f.path === actual.path)
    assert.ok(declared && same(actual, declared), '原件与1102声明不一致: ' + path)
    return actual
  })
  assert.equal(originalFiles.length, 1077)
  assert.equal(fp(oldRoot + '/index-r1.json').sha256, 'bcd70eb34ec33b4c1cec4d88e86eba30d3fc0488e939725cd191de82557c2180')
  const changes = drift(baseline.inputs)
  assert.equal(changes.length, 1)
  assert.equal(changes[0].before.path, listbox)
  assert.equal(changes[0].before.sha256, '790533aed66fa35a6258e8a37c345058b8204d9d91cb86684e48453218f9cf7d')
  assert.equal(changes[0].after.sha256, 'db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2')
  assert.equal(changes[0].after.bytes, 4886)
  assert.ok(same(fp('packages/dsh-pm-tool/' + domTest), seal.newTest))
  assert.equal(seal.newTest.sha256, '6de116ba10c320a162f1c465958f428ca9023e328b67827581db9ea23df42aec')
  assert.equal(seal.newTest.bytes, 9159)
  const devOutputs = [...seal.outputs, ...seal.tmpOutputs]
  assert.equal(drift(devOutputs).length, 0, '开发封存输出漂移')
  assert.equal(devOutputs.length, 225)
  const frozenPath = '.tmp/p1005-deliverable-pointer-20261023-r1/dom-r2/src/client/views/records/records-listbox.tsx'
  assert.ok(same(fp(frozenPath), changes[0].before))
  const old = read(frozenPath).toString()
  const expected = old.replace(
    '          <div className="rb-lb-backdrop" onClick={() => setOpen(false)} />',
    '          <div className="rb-lb-backdrop" onClick={event => {\n'
      + '            // 外层 label 的默认激活会再点 trigger，抵消本次关闭。\n'
      + '            event.preventDefault()\n'
      + '            setOpen(false)\n'
      + '          }} />',
  )
  assert.notEqual(expected, old)
  assert.equal(expected, read(listbox).toString(), '不允许 backdrop 之外的隐含 delta')
  const safeEnv = { PATH: dirname(process.execPath) + ':/usr/bin:/bin', HOME: join(tmp, 'home'),
    TMPDIR: join(tmp, 'tmp'), LANG: 'en_US.UTF-8' }
  const diff = child(['/usr/bin/diff', '-u', resolve(repo, frozenPath), resolve(repo, listbox)],
    tmp, safeEnv, join(tmp, 'output/delta'))
  assert.equal(diff.exit, 1, 'diff exit1 表示存在精确差异')
  assert.equal(diff.facilityError, null)
  const extra = [
    devPrefix + 'seal-r2.json', devPrefix + 'final-check-r2.json',
    'packages/dsh-pm-tool/' + domTest,
    'packages/dsh-pm-tool/src/client/views/records/records-meeting-form.tsx',
    'packages/dsh-pm-tool/src/client/views/records/records-report-form.tsx',
    'packages/dsh-pm-tool/src/client/views/records/index.ts',
    'packages/dsh-pm-tool/src/client/views/okr-form.tsx',
    'packages/dsh-pm-tool/src/client/views/habit-form.tsx',
    'docs/testing/remaining-governance-cases-20261021.md',
    'docs/testing/op-growth-final-inheritance-20261022-r1.md',
    'docs/testing/remaining-acceptance-delta-20261022.md',
  ]
  const protectedPaths = [...new Set([...baseline.inputs.map(f => f.path),
    ...devOutputs.map(f => f.path), ...extra])]
  const protectedInputs = protectedPaths.map(fp)
  const sourceInputs = json(devPrefix + 'green-final-r2-receipt.json').inputs
  const selectedInputs = [...new Set([...sourceInputs.map(f => f.path),
    ...oldTests.map(f => 'packages/dsh-pm-tool/' + f)])].map(fp)
  for (const f of selectedInputs) {
    const target = join(tmp, 'inputs', relative(pkg, resolve(repo, f.path)))
    put(target, read(f.path))
    assert.ok(same(f, fp(target)))
  }
  put(join(tmp, 'inputs/package.json'), '{"type":"module"}\n')
  const links = {
    react: '.tmp/widget-poc/node_modules/react',
    'react-dom': '.tmp/widget-poc/node_modules/react-dom',
    jsdom: '.tmp/widget-poc/node_modules/jsdom',
    vitest: 'packages/dsh-pm-tool/node_modules/vitest',
  }
  mkdirSync(join(tmp, 'inputs/node_modules'))
  const dependencies = Object.entries(links).map(([name, path]) => {
    const target = realpathSync(resolve(repo, path))
    assert.ok(target.startsWith(repo + '/'), '只允许既有仓库依赖链接')
    symlinkSync(target, join(tmp, 'inputs/node_modules', name))
    return { name, target, version: JSON.parse(readFileSync(join(target, 'package.json'))).version }
  })
  const dependencyInputs = dependencies.flatMap(d => tree(d.target))
  const requireDOM = createRequire(join(dependencies.find(d => d.name === 'react-dom').target, 'package.json'))
  const reactSameOrigin = requireDOM.resolve('react') === resolve(dependencies.find(d => d.name === 'react').target, 'index.js')
  assert.ok(reactSameOrigin, 'ReactDOM 的 require react 必须与候选 React 同源')
  out('capture.json', { stage, exit: 0, tmp, environment, baselineCommit: baseline.baselineCommit,
    baselineSource: '仅引用原声明；未执行 Git，不以 HEAD 代未提交候选',
    originalCount: originalFiles.length, declaredCount: baseline.inputs.length,
    declaredDelta: changes, exactDeltaChecked: true, developerOutputsChecked: devOutputs.length,
    protectedInputs, selectedInputs, dependencies, dependencyInputs, reactSameOrigin,
    dependencyBoundary: '只核声明 React/ReactDOM/JSDOM/Vitest 文件集合；不冒全依赖树保护',
    ownInitial: beforeOwn, diff, forbiddenNotRun: ['开发 runner', 'build', 'install', 'noEmit',
      '全 verify', 'GUI', '服务', 'Git', '凭据', 'private 路径'],
  })
  console.log(JSON.stringify({ stage, exit: 0, tmp, declared: 1102, original: 1077,
    exactDeltaChecked: true, developerOutputs: devOutputs.length, dependencies, reactSameOrigin }))
} else if (stage === 'run') {
  const capture = json(capturePath)
  assert.equal(drift(capture.protectedInputs).length, 0, '执行前输入漂移')
  assert.equal(drift(capture.dependencyInputs).length, 0, '执行前声明依赖漂移')
  assert.ok(!existsSync(join(docs, prefix + '-execution.json')), '独立专项只运行一次')
  const { tmp, dependencies } = capture
  const react = dependencies.find(d => d.name === 'react').target
  const reactDom = dependencies.find(d => d.name === 'react-dom').target
  const vitest = dependencies.find(d => d.name === 'vitest').target
  const identitySetup = join(tmp, 'config/identity.mjs')
  put(identitySetup, `import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import React from 'react'
import * as ReactDOM from 'react-dom'
const fromDOM = createRequire(${JSON.stringify(join(reactDom, 'package.json'))})
const sameIdentity = React === fromDOM('react')
if (!sameIdentity || React.version !== '18.3.1' || ReactDOM.version !== '18.3.1') {
  throw new Error('React/ReactDOM runtime identity mismatch')
}
writeFileSync(process.env.QA_IDENTITY_OUTPUT, JSON.stringify({
  sameIdentity, reactVersion: React.version, reactDOMVersion: ReactDOM.version,
  importedReact: ${JSON.stringify(react)}, reactDOMReactResolved: fromDOM.resolve('react')
}, null, 2) + '\\n', { flag: 'wx' })
`)
  const results = []
  for (const [name, selected, expectedCount] of [['dom', [domTest], 7], ['affected', oldTests, 28]]) {
    const dir = join(tmp, 'output', name)
    mkdirSync(dir)
    mkdirSync(join(dir, 'observations'))
    const config = join(tmp, 'config', name + '.mjs')
    put(config, `export default {
  root: ${JSON.stringify(join(tmp, 'inputs'))},
  cacheDir: ${JSON.stringify(join(tmp, 'cache', name))},
  esbuild: { jsx: 'automatic' },
  resolve: { alias: { react: ${JSON.stringify(react)}, 'react-dom': ${JSON.stringify(reactDom)} } },
  test: {
    environment: 'node', include: ${JSON.stringify(selected)},
    setupFiles: ${JSON.stringify(name === 'dom' ? [identitySetup] : [])},
    pool: 'forks', poolOptions: { forks: { singleFork: true } },
    coverage: { enabled: false }, reporters: ['default', 'json'],
    outputFile: ${JSON.stringify(join(dir, 'vitest.json'))}
  }
}
`)
    const env = { PATH: dirname(process.execPath) + ':/usr/bin:/bin', HOME: join(tmp, 'home'),
      XDG_CONFIG_HOME: join(tmp, 'config'), XDG_CACHE_HOME: join(tmp, 'cache', name),
      XDG_DATA_HOME: join(tmp, 'home/data'), TMPDIR: join(tmp, 'tmp'),
      VITE_CACHE_DIR: join(tmp, 'cache', name), LANG: 'en_US.UTF-8', CI: '1',
      QA_POINTER_EVIDENCE_ROOT: join(dir, 'observations'), QA_IDENTITY_OUTPUT: join(dir, 'identity.json') }
    const receipt = child([process.execPath, join(vitest, 'vitest.mjs'), 'run', '--config', config],
      join(tmp, 'inputs'), env, join(dir, 'vitest'))
    const result = existsSync(join(dir, 'vitest.json')) ? json(join(dir, 'vitest.json')) : null
    const tests = result?.testResults.flatMap(s => s.assertionResults.map(t => ({
      file: relative(join(tmp, 'inputs'), s.name), fullName: t.fullName, status: t.status,
      failureMessages: t.failureMessages,
    }))) ?? []
    const allPassed = receipt.exit === 0 && receipt.facilityError === null
      && result?.numPassedTests === expectedCount && result?.numFailedTests === 0
      && tests.length === expectedCount && tests.every(t => t.status === 'passed')
    results.push({ name, selected, expectedCount, allPassed, receipt,
      numPassedTests: result?.numPassedTests, numFailedTests: result?.numFailedTests, tests,
      sourceDrift: drift(capture.selectedInputs), protectedDrift: drift(capture.protectedInputs),
      dependencyDrift: drift(capture.dependencyInputs), outputs: tree(dir) })
    console.log(JSON.stringify({ name, exit: receipt.exit, passed: result?.numPassedTests,
      failed: result?.numFailedTests, facilityError: receipt.facilityError, allPassed }))
  }
  const observationFacts = []
  const observationsDir = join(tmp, 'output/dom/observations')
  for (const name of readdirSync(observationsDir)) {
    const observation = json(join(observationsDir, name))
    const captureClicks = observation.events.filter(e => e.type === 'click' && e.phase === 1)
    const submits = observation.events.filter(e => e.type === 'submit')
    observationFacts.push({ case: name.replace('.json', ''),
      calls: observation.calls, captureClicks: captureClicks.map(e => ({ target: e.target, detail: e.detail })),
      submitCaptureCount: submits.filter(e => e.phase === 1).length,
      submitBubbleDefaultPrevented: submits.filter(e => e.phase === 3).map(e => e.defaultPrevented),
      backdropBubbleDefaultPrevented: observation.events.filter(e =>
        e.type === 'click' && e.phase === 3 && e.target?.class === 'rb-lb-backdrop').map(e => e.defaultPrevented),
      labels: observation.events.filter(e => e.label).map(e => ({ label: e.label,
        expanded: e.expanded, options: e.options, backdrop: e.backdrop, calls: e.calls })),
      eventTypes: [...new Set(observation.events.filter(e => e.type).map(e => e.type))],
      boundary: observation.boundary })
  }
  const identityPath = join(tmp, 'output/dom/identity.json')
  const identity = existsSync(identityPath) ? json(identityPath) : null
  const validFacts = observationFacts.length === 7 && ['D04', 'D06', 'D07'].every(id => {
    const f = observationFacts.find(f => f.case === id)
    return f && f.calls.length === 0 && f.submitCaptureCount === 0
      && f.backdropBubbleDefaultPrevented.length === 1 && f.backdropBubbleDefaultPrevented[0]
      && f.captureClicks.filter(e => e.target.id === 'deliverable-status').length === 1
  }) && ['D01', 'D02'].every(id => {
    const f = observationFacts.find(f => f.case === id)
    return f && f.submitCaptureCount === 1 && f.submitBubbleDefaultPrevented.every(Boolean)
      && f.calls.map(c => c.kind).join(',') === 'save,saved'
      && f.calls[0].args[2].status === 'accepted'
  }) && (() => {
    const f = observationFacts.find(f => f.case === 'D05')
    return f && f.submitCaptureCount === 2 && f.calls.map(c => c.kind).join(',') === 'save,save,saved'
      && JSON.stringify(f.calls[0].args) === JSON.stringify(f.calls[1].args)
  })()
  const sourceDrift = drift(capture.protectedInputs)
  const dependencyDrift = drift(capture.dependencyInputs)
  const isolatedInputDrift = capture.selectedInputs.flatMap(f => {
    const isolated = fp(join(tmp, 'inputs', relative(pkg, resolve(repo, f.path))))
    return same(f, isolated) ? [] : [{ before: f, after: isolated }]
  })
  const passed = results.every(r => r.allPassed && !r.protectedDrift.length && !r.dependencyDrift.length)
    && validFacts && identity?.sameIdentity && !sourceDrift.length && !dependencyDrift.length && !isolatedInputDrift.length
  out('execution.json', { stage, exit: passed ? 0 : 1, tmp, results, observationFacts, validFacts, identity,
    sourceDrift, dependencyDrift, isolatedInputDrift, inputs: capture.selectedInputs,
    inputCopies: tree(join(tmp, 'inputs')), outputs: tree(tmp),
    scope: '独立执行当前 DOM 7 + 旧专项 28；未执行开发 runner/原红 runner；无 GUI/真实 pointer/落盘' })
  process.exitCode = passed ? 0 : 1
  console.log(JSON.stringify({ stage, exit: process.exitCode, validFacts, identity,
    sourceDrift: sourceDrift.length, dependencyDrift: dependencyDrift.length,
    isolatedInputDrift: isolatedInputDrift.length }))
} else {
  const capture = json(capturePath)
  const execution = json(join(docs, prefix + '-execution.json'))
  const reportPath = join(docs, prefix + '.md')
  assert.ok(existsSync(reportPath), '先完成独立报告再封存')
  const sourceDrift = drift(capture.protectedInputs)
  const dependencyDrift = drift(capture.dependencyInputs)
  const outputDrift = drift(execution.outputs)
  const ownFiles = readdirSync(docs).filter(p => p.startsWith(prefix)).map(p => join(docs, p))
  const markdown = readFileSync(reportPath, 'utf8')
  const linkFailures = []
  for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
    const link = match[1].split('#')[0]
    if (!link || /^https?:|^file:/.test(link)) continue
    if (!existsSync(resolve(dirname(reportPath), link))) linkFailures.push(link)
  }
  const trailingWhitespace = ownFiles.filter(p => /\.(md|mjs)$/.test(p)).flatMap(p =>
    readFileSync(p, 'utf8').split('\n').flatMap((s, i) => /[ \t]+$/.test(s) ? [{ path: relative(repo, p), line: i + 1 }] : []))
  const outputs = ownFiles.map(fp)
  const success = execution.exit === 0 && !sourceDrift.length && !dependencyDrift.length
    && !outputDrift.length && !linkFailures.length && !trailingWhitespace.length
  out('seal.json', { stage, exit: success ? 0 : 1, sourceInputsChecked: capture.protectedInputs.length,
    originalInputs: 1077, developerDeclaredInputs: 1102, allowedDelta: capture.declaredDelta,
    sourceDrift, dependencyInputsChecked: capture.dependencyInputs.length, dependencyDrift,
    isolatedOutputsChecked: execution.outputs.length, outputDrift, outputs,
    tmpOutputs: tree(capture.tmp), linkFailures, trailingWhitespace,
    locks: [], longRunningChildren: [], released: true, stop: true,
    scope: '仅当前锁定字节 SOURCE/AUTO；非 GUI/B8/P1005整项/父出口；seal 不自指纹' })
  process.exitCode = success ? 0 : 1
  console.log(JSON.stringify({ stage, exit: process.exitCode, sourceInputsChecked: capture.protectedInputs.length,
    sourceDrift: sourceDrift.length, dependencyDrift: dependencyDrift.length, outputDrift: outputDrift.length,
    linkFailures, trailingWhitespace, released: true, stop: true }))
}

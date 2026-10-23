import { readFileSync, writeFileSync, readdirSync, mkdirSync, mkdtempSync, symlinkSync, existsSync } from 'node:fs'
import { resolve, join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'p1005-listbox-backdrop-source-auto-20261023-r1'
const docs = join(repo, 'docs/testing')
const read = p => readFileSync(resolve(repo, p))
const json = p => JSON.parse(read(p))
const fp = p => {
  const path = resolve(repo, p)
  const bytes = readFileSync(path)
  return { path: path.startsWith(repo + '/') ? relative(repo, path) : path,
    bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}
const same = (a, b) => a.bytes === b.bytes && a.sha256 === b.sha256
const put = (path, value) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' || Buffer.isBuffer(value)
    ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
const out = (suffix, value) => put(join(docs, prefix + '-' + suffix), value)
const drift = inputs => inputs.flatMap(before => {
  try {
    const after = fp(before.path)
    return same(before, after) ? [] : [{ before, after }]
  } catch (error) { return [{ before, error: error.message }] }
})
function tree(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(e => {
    const p = join(root, e.name)
    return e.isDirectory() ? tree(p) : e.isFile() ? [fp(p)] : []
  }).sort((a, b) => a.path.localeCompare(b.path))
}
const capture = json(join(docs, prefix + '-capture.json'))
const initial = json(join(docs, prefix + '-execution.json'))
const stage = process.argv[2]
assert.ok(['run', 'seal'].includes(stage))
if (stage === 'run') {
  assert.equal(drift(capture.protectedInputs).length, 0)
  assert.equal(drift(capture.dependencyInputs).length, 0)
  assert.equal(drift(initial.outputs).length, 0)
  const tmp = mkdtempSync('/tmp/' + prefix + '-recovery-')
  for (const name of ['inputs', 'config', 'cache', 'home', 'output', 'tmp']) mkdirSync(join(tmp, name))
  const pkg = join(repo, 'packages/dsh-pm-tool')
  for (const f of capture.selectedInputs) {
    const target = join(tmp, 'inputs', relative(pkg, resolve(repo, f.path)))
    put(target, read(f.path))
    assert.ok(same(fp(target), f))
  }
  put(join(tmp, 'inputs/package.json'), '{"type":"module"}\n')
  mkdirSync(join(tmp, 'inputs/node_modules'))
  for (const dep of capture.dependencies) symlinkSync(dep.target, join(tmp, 'inputs/node_modules', dep.name))
  const react = capture.dependencies.find(d => d.name === 'react').target
  const reactDOM = capture.dependencies.find(d => d.name === 'react-dom').target
  const vitest = capture.dependencies.find(d => d.name === 'vitest').target
  const setup = join(tmp, 'config/identity-after-dom.mjs')
  put(setup, `import { afterAll } from 'vitest'
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import React from 'react'
afterAll(async () => {
  const ReactDOM = await import('react-dom')
  const fromDOM = createRequire(${JSON.stringify(join(reactDOM, 'package.json'))})
  const sameIdentity = React === fromDOM('react')
  if (!sameIdentity || React.version !== '18.3.1' || ReactDOM.version !== '18.3.1') {
    throw new Error('React/ReactDOM runtime identity mismatch')
  }
  writeFileSync(process.env.QA_IDENTITY_OUTPUT, JSON.stringify({
    sameIdentity, reactVersion: React.version, reactDOMVersion: ReactDOM.version,
    reactDOMReactResolved: fromDOM.resolve('react'), timing: 'after production DOM suite'
  }, null, 2) + '\\n', { flag: 'wx' })
})
`)
  const config = join(tmp, 'config/vitest.mjs')
  const test = 'src/client/views/records/records-deliverable-pointer-dom.test.tsx'
  put(config, `export default {
  root: ${JSON.stringify(join(tmp, 'inputs'))}, cacheDir: ${JSON.stringify(join(tmp, 'cache'))},
  esbuild: { jsx: 'automatic' },
  resolve: { alias: { react: ${JSON.stringify(react)}, 'react-dom': ${JSON.stringify(reactDOM)} } },
  test: { environment: 'node', include: [${JSON.stringify(test)}],
    setupFiles: [${JSON.stringify(setup)}], pool: 'forks', poolOptions: { forks: { singleFork: true } },
    coverage: { enabled: false }, reporters: ['default','json'],
    outputFile: ${JSON.stringify(join(tmp, 'output/vitest.json'))} }
}
`)
  mkdirSync(join(tmp, 'output/observations'))
  const env = { PATH: dirname(process.execPath) + ':/usr/bin:/bin', HOME: join(tmp, 'home'),
    XDG_CONFIG_HOME: join(tmp, 'config'), XDG_CACHE_HOME: join(tmp, 'cache'),
    XDG_DATA_HOME: join(tmp, 'home/data'), TMPDIR: join(tmp, 'tmp'), VITE_CACHE_DIR: join(tmp, 'cache'),
    LANG: 'en_US.UTF-8', CI: '1', QA_POINTER_EVIDENCE_ROOT: join(tmp, 'output/observations'),
    QA_IDENTITY_OUTPUT: join(tmp, 'output/identity.json') }
  const argv = [process.execPath, join(vitest, 'vitest.mjs'), 'run', '--config', config]
  const startedAt = new Date().toISOString()
  const result = spawnSync(argv[0], argv.slice(1), { cwd: join(tmp, 'inputs'), env,
    encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024 })
  put(join(tmp, 'output/stdout.log'), result.stdout ?? '')
  put(join(tmp, 'output/stderr.log'), result.stderr ?? '')
  const receipt = { argv, cwd: join(tmp, 'inputs'), environment: env, exit: result.status,
    signal: result.signal, facilityError: result.error?.message ?? null, startedAt, endedAt: new Date().toISOString() }
  put(join(tmp, 'output/command.json'), receipt)
  const v = existsSync(join(tmp, 'output/vitest.json')) ? json(join(tmp, 'output/vitest.json')) : null
  const identity = existsSync(join(tmp, 'output/identity.json')) ? json(join(tmp, 'output/identity.json')) : null
  const facts = readdirSync(join(tmp, 'output/observations')).map(name => {
    const o = json(join(tmp, 'output/observations', name))
    return { case: name.replace('.json', ''), calls: o.calls,
      clicks: o.events.filter(e => e.type === 'click' && e.phase === 1).map(e => ({ target: e.target, detail: e.detail })),
      submitCount: o.events.filter(e => e.type === 'submit' && e.phase === 1).length,
      submitPrevented: o.events.filter(e => e.type === 'submit' && e.phase === 3).map(e => e.defaultPrevented),
      backdropPrevented: o.events.filter(e => e.type === 'click' && e.phase === 3
        && e.target?.class === 'rb-lb-backdrop').map(e => e.defaultPrevented),
      states: o.events.filter(e => e.label), events: [...new Set(o.events.map(e => e.type).filter(Boolean))] }
  })
  const validFacts = facts.length === 7 && ['D04','D06','D07'].every(id => {
    const f = facts.find(f => f.case === id)
    return f?.calls.length === 0 && f.submitCount === 0 && f.backdropPrevented.length === 1
      && f.backdropPrevented[0] && f.clicks.filter(c => c.target.id === 'deliverable-status').length === 1
      && f.states.at(-1).expanded === 'false'
  }) && ['D01','D02'].every(id => {
    const f = facts.find(f => f.case === id)
    return f?.submitCount === 1 && f.submitPrevented.length === 1 && f.submitPrevented[0]
      && f.calls.map(c => c.kind).join(',') === 'save,saved' && f.calls[0].args[2].status === 'accepted'
  }) && (() => {
    const f = facts.find(f => f.case === 'D05')
    return f?.submitCount === 2 && f.calls.map(c => c.kind).join(',') === 'save,save,saved'
      && JSON.stringify(f.calls[0].args) === JSON.stringify(f.calls[1].args)
  })()
  const oldStderr = readFileSync(join(capture.tmp, 'output/dom/vitest-stderr.log'), 'utf8')
  const oldAffected = initial.results.find(r => r.name === 'affected')
  const affectedStderr = readFileSync(join(capture.tmp, 'output/affected/vitest-stderr.log'), 'utf8')
  const protectedDrift = drift(capture.protectedInputs)
  const dependencyDrift = drift(capture.dependencyInputs)
  const inputDrift = capture.selectedInputs.flatMap(f => {
    const isolated = fp(join(tmp, 'inputs', relative(pkg, resolve(repo, f.path))))
    return same(f, isolated) ? [] : [{ before: f, after: isolated }]
  })
  const clean = (result.stderr ?? '').trim() === ''
  const passed = result.status === 0 && !result.error && v?.numPassedTests === 7 && v.numFailedTests === 0
    && v.testResults.flatMap(s => s.assertionResults).every(t => t.status === 'passed')
    && identity?.sameIdentity && clean && validFacts && oldAffected.allPassed && affectedStderr.trim() === ''
    && !protectedDrift.length && !dependencyDrift.length && !inputDrift.length
  out('recovery.json', { stage, exit: passed ? 0 : 1, tmp, receipt, numPassedTests: v?.numPassedTests,
    numFailedTests: v?.numFailedTests, identity, validFacts, facts, cleanStderr: clean,
    protectedDrift, dependencyDrift, inputDrift, outputs: tree(tmp),
    initialDOM: { accepted: false, vitestExit: initial.results[0].receipt.exit,
      reason: '独立 setup 过早加载 ReactDOM，污染 canUseDOM/input-event 检测；不签该轮7绿',
      uncaughtCount: (oldStderr.match(/Error: Uncaught/g) ?? []).length },
    acceptedAffected: { receipt: oldAffected.receipt, tests: oldAffected.tests, count: 28, cleanStderr: true },
    extraProtectedInputs: ['docs/testing/remaining-journey-cases-20261021.md',
      'docs/testing/remaining-layer-map-20261021.md', 'docs/testing/remaining-objective-cases-20261021.md'].map(fp) })
  process.exitCode = passed ? 0 : 1
  console.log(JSON.stringify({ stage, exit: process.exitCode, tmp, passed: v?.numPassedTests,
    failed: v?.numFailedTests, identity, cleanStderr: clean, validFacts, initialDOMRejected: true,
    protectedDrift: protectedDrift.length, dependencyDrift: dependencyDrift.length, inputDrift: inputDrift.length }))
} else {
  const recovery = json(join(docs, prefix + '-recovery.json'))
  const sourceDrift = drift([...capture.protectedInputs, ...recovery.extraProtectedInputs])
  const dependencyDrift = drift(capture.dependencyInputs)
  const outputDrift = drift([...initial.outputs, ...recovery.outputs])
  const report = readFileSync(join(docs, prefix + '.md'), 'utf8')
  const linkFailures = [...report.matchAll(/\]\(([^)]+)\)/g)].flatMap(m => {
    const p = m[1].split('#')[0]
    return !p || /^https?:|^file:/.test(p) || existsSync(resolve(docs, p)) ? [] : [p]
  })
  const ownFiles = readdirSync(docs).filter(n => n.startsWith(prefix)).map(n => join(docs, n))
  const trailingWhitespace = ownFiles.filter(p => /\.(md|mjs)$/.test(p)).flatMap(p =>
    readFileSync(p, 'utf8').split('\n').flatMap((s, i) => /[ \t]+$/.test(s) ? [{ path: p, line: i + 1 }] : []))
  const success = recovery.exit === 0 && !sourceDrift.length && !dependencyDrift.length
    && !outputDrift.length && !linkFailures.length && !trailingWhitespace.length
  out('seal.json', { stage, exit: success ? 0 : 1,
    sourceInputsChecked: capture.protectedInputs.length + recovery.extraProtectedInputs.length,
    sourceDrift, originalInputs: 1077, developerDeclaredInputs: 1102,
    dependencyInputsChecked: capture.dependencyInputs.length, dependencyDrift,
    outputInputsChecked: initial.outputs.length + recovery.outputs.length, outputDrift,
    outputs: ownFiles.map(fp), tmpRoots: [capture.tmp, recovery.tmp],
    tmpOutputs: [...tree(capture.tmp), ...tree(recovery.tmp)], linkFailures, trailingWhitespace,
    scope: '有限 SOURCE/AUTO；首轮 DOM 设施污染不签；最终 DOM7 + 首轮受影响28',
    locks: [], longRunningChildren: [], released: true, stop: true,
    boundary: '不签GUI/B8/P1005/父出口，不操作Git/服务；seal不自指纹，不冒全盘零污染' })
  process.exitCode = success ? 0 : 1
  console.log(JSON.stringify({ stage, exit: process.exitCode, sourceInputsChecked: capture.protectedInputs.length + 3,
    dependencyInputsChecked: capture.dependencyInputs.length, sourceDrift: sourceDrift.length,
    dependencyDrift: dependencyDrift.length, outputDrift: outputDrift.length,
    linkFailures, trailingWhitespace, released: true, stop: true }))
}

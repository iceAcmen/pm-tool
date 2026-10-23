import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, readlinkSync, realpathSync, symlinkSync, writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const pkg = join(repo, 'packages/dsh-pm-tool')
const out = join(repo, 'docs/testing')
const prefix = 'p2004-kr-related-source-auto-20261023-r1-'
const devPrefix = '2026-10-23-p2004-kr-related-'
const source = 'src/client/views/okrs.tsx'
const test = 'src/client/views/okrs-related.test.tsx'
const oldSha = '2408f42a166060596cd7d72462fe34ffcba5c7a69f2f0233da17a102c4926b8f'
const newSha = '122516a490b80da4a2fc9da0da66fb1283062efb3c54827c8a8399e3a28bc128'
const testSha = 'a95e115726bbdd1e08e6793f66a01f9aceaa996ca50cfbd1cb80527bde71c176'
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const dev = name => read(join(repo, 'docs/plans', devPrefix + name + '.json'))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fp = path => {
  const bytes = readFileSync(path)
  return { path: relative(repo, path), bytes: bytes.length, sha256: sha(bytes) }
}
function put(name, value) {
  writeFileSync(join(out, prefix + name), typeof value === 'string' ? value
    : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function tree(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const path = join(dir, e.name)
    if (e.isDirectory()) return tree(path)
    if (e.isFile()) return [fp(path)]
    if (e.isSymbolicLink()) return [{ path: relative(repo, path), link: readlinkSync(path) }]
    throw new Error(`Unsupported entry: ${path}`)
  }).sort((a, b) => a.path.localeCompare(b.path))
}
function delta(a, b) {
  const before = new Map(a.map(f => [f.path, f]))
  const after = new Map(b.map(f => [f.path, f]))
  return [...new Set([...before.keys(), ...after.keys()])].sort().flatMap(path =>
    JSON.stringify(before.get(path)) === JSON.stringify(after.get(path)) ? [] : [{
      path, before: before.get(path) ?? null, after: after.get(path) ?? null,
    }])
}
function protectedInputs() {
  const fixed = ['AGENTS.md', 'docs/collaboration.md', 'docs/external-skills.md',
    'README.md', ...['progress', 'handoff', 'onboarding-prompt', 'changelog',
      'requirements', 'decision-log', 'knowledge-base', 'issues-and-solutions'].map(n => `docs/${n}.md`),
    ...['package.json', 'pnpm-lock.yaml', 'vitest.config.ts', 'tsconfig.json',
      'scripts/verify-external-skills.mjs'].map(n => `packages/dsh-pm-tool/${n}`)]
  const testing = readdirSync(out, { withFileTypes: true })
    .filter(e => e.isFile() && !e.name.startsWith(prefix)).map(e => fp(join(out, e.name)))
  const plans = readdirSync(join(repo, 'docs/plans'), { withFileTypes: true })
    .filter(e => e.isFile() && e.name.startsWith(devPrefix))
    .map(e => fp(join(repo, 'docs/plans', e.name)))
  return [...tree(join(pkg, 'src')), ...tree(join(repo, 'vendor')),
    ...fixed.map(p => fp(join(repo, p))), ...testing, ...plans].sort((a, b) => a.path.localeCompare(b.path))
}
function verifyActual(expected) {
  const actual = fp(join(repo, expected.path))
  assert.equal(actual.bytes, expected.bytes, expected.path)
  assert.equal(actual.sha256, expected.sha256, expected.path)
  return actual
}
function currentCandidate() {
  assert.equal(fp(join(pkg, source)).sha256, newSha, 'current view drift')
  assert.equal(fp(join(pkg, test)).sha256, testSha, 'current test drift')
  return [fp(join(pkg, source)), fp(join(pkg, test))]
}
function child(command, args, cwd, root, name) {
  const env = {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(root, name, 'home'),
    TMPDIR: join(root, name, 'tmp'), XDG_CACHE_HOME: join(root, name, 'cache'),
    TZ: 'Asia/Shanghai', DSH_PM_E2E: '0', P2004_DOM_EVIDENCE: join(root, name, 'output/dom'),
  }
  for (const k of ['HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'P2004_DOM_EVIDENCE']) mkdirSync(env[k], { recursive: true })
  const startedAt = new Date().toISOString()
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024 })
  put(name + '-stdout.log', result.stdout ?? '')
  put(name + '-stderr.log', result.stderr ?? '')
  const receipt = { command: [command, ...args], cwd, env, node: process.version, platform: process.platform,
    startedAt, finishedAt: new Date().toISOString(), exit: result.status, signal: result.signal,
    error: result.error?.message ?? null }
  put(name + '-receipt.json', receipt)
  console.log(JSON.stringify({ name, exit: result.status, signal: result.signal, error: receipt.error }))
  return receipt
}
const stage = process.argv[2]
if (stage === 'audit') {
  const before = protectedInputs()
  const root = mkdtempSync('/tmp/pm-p2004-source-auto-r1-')
  const baseline = dev('baseline')
  const seal = dev('seal')
  const sealTool = dev('seal-tool-receipt')
  verifyActual(seal.baseline)
  assert.equal(fp(join(repo, sealTool.seal.path)).sha256, sealTool.seal.sha256)
  const artifacts = seal.artifacts.map(verifyActual)
  const bindings = currentCandidate()
  assert.deepEqual(bindings, [seal.sourceBinding, seal.testBinding])
  const manifest = read(join(repo, 'vendor/agent-skills/mattpocock/manifest.json'))
  const vendor = [...manifest.rootFiles, ...manifest.skills.flatMap(s => s.files)].map(f =>
    verifyActual({ ...f, path: `vendor/agent-skills/mattpocock/${f.path}` }))
  const receipts = ['red', 'green', 'affected'].map(name => {
    const input = dev(name + '-inputs')
    const receipt = dev(name + '-receipt')
    assert.equal(input.sourceBinding.sha256, name === 'red' ? oldSha : newSha)
    assert.equal(input.testBinding.sha256, testSha)
    const outputs = dev(name + '-output')
    for (const f of outputs) {
      assert.equal(Buffer.byteLength(f.content), f.bytes, f.path)
      assert.equal(sha(f.content), f.sha256, f.path)
    }
    const report = JSON.parse(outputs.find(f => f.path.endsWith('/vitest.json')).content)
    assert.equal(receipt.exit, name === 'red' ? 1 : 0)
    assert.equal(receipt.error, null)
    assert.equal(receipt.signal, null)
    const failures = report.testResults.flatMap(s => s.assertionResults)
      .filter(a => a.status === 'failed').map(a => ({ name: a.fullName, messages: a.failureMessages }))
    if (name === 'red') {
      assert.equal(report.numFailedTests, 7)
      assert.equal(report.numPassedTests, 1)
      assert.ok(failures.every(a => a.messages.every(m => m.includes('length of 1 but got +0'))))
    }
    return { name, receipt, report: { startTime: report.startTime, success: report.success,
      total: report.numTotalTests, passed: report.numPassedTests, failed: report.numFailedTests }, failures }
  })
  assert.ok(Date.parse(receipts[0].receipt.finishedAt) < Date.parse(receipts[1].receipt.startedAt))
  const productPaths = new Set([source, test].map(p => `packages/dsh-pm-tool/${p}`))
  const recomputedDevDelta = delta(baseline.inputs, seal.inputsAfter)
  assert.deepEqual(recomputedDevDelta, [...seal.ownedDelta, ...seal.nonOwnedDelta]
    .sort((a, b) => a.path.localeCompare(b.path)))
  assert.deepEqual(recomputedDevDelta.map(d => d.path).sort(), [...productPaths].sort())
  const devAfterToCurrent = delta(seal.inputsAfter, before.filter(f =>
    seal.inputsAfter.some(old => old.path === f.path)))
  const staticReceipt = child(process.execPath, [join(pkg, 'scripts/verify-external-skills.mjs')], repo, root, 'vendor')
  assert.equal(staticReceipt.exit, 0, 'vendor static prerequisite')
  const after = protectedInputs()
  const protectedDelta = delta(before, after)
  put('audit.json', { root, baselineCommit: baseline.baselineCommit, candidate: bindings,
    seal: fp(join(repo, 'docs/plans', devPrefix + 'seal.json')), artifacts, vendor,
    vendorCommit: manifest.source.commit, vendorIntegrityVerified: true, staticReceipt,
    developerStages: receipts, recomputedDevDelta, devAfterToCurrent,
    protectedBefore: before, protectedAfter: after, protectedDelta,
    excluded: ['nested docs/testing directories', 'privatefreeze', 'runtime', 'services', 'credentials', 'business roots'],
    boundary: 'Development chronology is receipt evidence, not independent observation of the original edit time.' })
  assert.equal(protectedDelta.length, 0, 'inputs changed during audit; keep evidence and inspect')
  console.log(`audit: artifacts=${artifacts.length}, vendor=${vendor.length}, protected=${before.length}, currentChanges=${devAfterToCurrent.length}`)
} else if (stage === 'red' || stage === 'auto') {
  const audit = read(join(out, prefix + 'audit.json'))
  currentCandidate()
  const root = audit.root
  const run = join(root, stage, 'inputs')
  assert.ok(!existsSync(run))
  const before = protectedInputs()
  cpSync(join(pkg, 'src'), join(run, 'src'), { recursive: true, force: false, errorOnExist: true })
  if (stage === 'red') {
    const receipt = child('/usr/bin/patch', ['--batch', '--reverse', '-p1', '-i',
      join(repo, 'docs/plans', devPrefix + 'source-delta.patch')], run, root, 'red-reconstruct')
    assert.equal(receipt.exit, 0)
  }
  assert.equal(fp(join(run, source)).sha256, stage === 'red' ? oldSha : newSha)
  assert.equal(fp(join(run, test)).sha256, testSha)
  writeFileSync(join(run, 'package.json'), '{"type":"module"}\n', { flag: 'wx' })
  const modules = join(run, 'node_modules')
  mkdirSync(modules)
  for (const e of readdirSync(join(pkg, 'node_modules'))) {
    if (['.bin', '.cache', '.vite'].includes(e)) continue
    symlinkSync(realpathSync(join(pkg, 'node_modules', e)), join(modules, e))
  }
  const widget = join(repo, '.tmp/widget-poc/node_modules')
  for (const name of ['jsdom', 'react-dom']) symlinkSync(realpathSync(join(widget, name)), join(modules, name))
  const react = realpathSync(join(widget, 'react'))
  const reactDom = realpathSync(join(widget, 'react-dom'))
  const selected = stage === 'red' ? [test] : [test, 'src/client/views/okr-model.test.ts']
  const config = join(root, stage, 'vitest.config.mjs')
  writeFileSync(config, `export default {
    root: ${JSON.stringify(run)}, cacheDir: ${JSON.stringify(join(root, stage, 'cache/vite'))},
    esbuild: { jsx: 'automatic' },
    resolve: { alias: { react: ${JSON.stringify(react)}, 'react-dom': ${JSON.stringify(reactDom)} } },
    test: { environment: 'node', include: ${JSON.stringify(selected)},
      server: { deps: { inline: [/lucide-react/, /react-test-renderer/] } },
      pool: 'forks', poolOptions: { forks: { singleFork: true } },
      reporters: ['verbose', 'json'], outputFile: { json: ${JSON.stringify(join(root, stage, 'output/vitest.json'))} },
      coverage: { enabled: false }, testTimeout: 20000, hookTimeout: 20000 },
  }\n`, { flag: 'wx' })
  const dependencies = [...new Set([widget, ...['vitest', 'lucide-react', 'zod', 'react',
    'react-test-renderer', '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage',
    '@deepseek-ai/dsh-storage-domain'].map(name => realpathSync(join(pkg, 'node_modules', name)))])]
  const depsBefore = dependencies.flatMap(tree)
  const sourceBefore = tree(join(run, 'src'))
  put(stage + '-inputs.json', { candidate: [fp(join(run, source)), fp(join(run, test))],
    isolatedSource: sourceBefore, selected, config: fp(config), node: fp(process.execPath),
    dependencyLinks: tree(modules), dependencies: depsBefore })
  const receipt = child(process.execPath, [join(pkg, 'node_modules/vitest/vitest.mjs'), 'run', '--config', config],
    run, root, stage)
  const outputs = tree(join(root, stage, 'output')).map(f => ({
    ...f, content: readFileSync(resolve(repo, f.path), 'utf8'),
  }))
  put(stage + '-output.json', outputs)
  const guard = { before, after: protectedInputs(),
    isolatedSourceDelta: delta(sourceBefore, tree(join(run, 'src'))),
    dependencyDelta: delta(depsBefore, dependencies.flatMap(tree)) }
  guard.protectedDelta = delta(guard.before, guard.after)
  put(stage + '-protection.json', guard)
  assert.equal(receipt.exit, stage === 'red' ? 1 : 0)
  assert.equal(receipt.signal, null)
  assert.equal(receipt.error, null)
  assert.equal(guard.isolatedSourceDelta.length, 0)
  assert.equal(guard.dependencyDelta.length, 0)
  assert.equal(guard.protectedDelta.length, 0)
  console.log(`${stage}: expected exit=${receipt.exit}, input/dependency deltas=0`)
} else if (stage === 'seal') {
  const audit = read(join(out, prefix + 'audit.json'))
  currentCandidate()
  const records = name => read(join(out, prefix + name + '-output.json'))
  const reports = Object.fromEntries(['red', 'auto'].map(name => [name,
    JSON.parse(records(name).find(f => f.path.endsWith('/vitest.json')).content)]))
  assert.equal(reports.red.numFailedTests, 7)
  assert.equal(reports.red.numPassedTests, 1)
  assert.equal(reports.auto.numPassedTests, 19)
  assert.equal(reports.auto.numFailedTests, 0)
  assert.equal(reports.auto.success, true)
  const frames = name => records(name).filter(f => f.path.includes('/dom/')).map(f => ({
    file: f.path, value: JSON.parse(f.content),
  }))
  const red = frames('red')
  const auto = frames('auto')
  const rootHtml = rows => rows.find(f => f.file.includes('-ROOT.json'))
    .value.observations.find(o => o.label === 'render').html
  const rerender = auto.find(f => f.file.includes('-RERENDER.json')).value.observations.filter(o => o.label === 'render')
  const guards = {
    rootMarkupUnchanged: rootHtml(red) === rootHtml(auto),
    rerenderRelatedCounts: rerender.map(o => o.rows.length),
    callbacksAndFetchZero: auto.every(f => f.value.observations.every(o =>
      Object.values(o.calls).every(calls => calls.length === 0) && o.fetchCalls.length === 0)),
    cases: auto.length,
  }
  assert.equal(guards.rootMarkupUnchanged, true)
  assert.deepEqual(guards.rerenderRelatedCounts, [1, 0, 1])
  assert.equal(guards.callbacksAndFetchZero, true)
  assert.equal(guards.cases, 8)
  const after = protectedInputs()
  const protectedDelta = delta(audit.protectedBefore, after)
  const autoProtection = read(join(out, prefix + 'auto-protection.json'))
  const sourceInputChanges = protectedDelta.filter(d => d.path.startsWith('packages/') || d.path.startsWith('vendor/'))
  assert.equal(sourceInputChanges.length, 0, 'candidate or dependency declaration changed')
  assert.deepEqual(autoProtection.protectedDelta.map(d => d.path), ['docs/progress.md'])
  assert.equal(autoProtection.isolatedSourceDelta.length, 0)
  assert.equal(autoProtection.dependencyDelta.length, 0)
  const owned = readdirSync(out, { withFileTypes: true }).filter(e => e.isFile() && e.name.startsWith(prefix))
    .map(e => fp(join(out, e.name)))
  const normalize = name => read(join(out, prefix + name + '-inputs.json')).isolatedSource.map(f =>
    ({ ...f, path: f.path.slice(f.path.lastIndexOf('/src/') + 1) }))
  const sourceTransition = delta(normalize('red'), normalize('auto'))
  assert.deepEqual(sourceTransition.map(f => f.path), [source])
  put('seal.json', { candidate: currentCandidate(), baselineCommit: audit.baselineCommit,
    root: audit.root, ownedArtifacts: owned, ownTemporaryArtifacts: tree(audit.root),
    protectedAfter: after, protectedDelta, sourceInputChanges, sourceTransition, guards,
    firstAutoOuterFailurePreserved: { exit: 1, assertionLine: 214, reason: 'non-owned docs/progress.md concurrent change',
      originalProtection: fp(join(out, prefix + 'auto-protection.json')), repeatedTests: false },
    limitedVerdict: 'PASS_LIMITED_SOURCE_AUTO', notRun: ['GUI', 'new combination', 'parent gates', 'build', 'install', 'full regression', 'Git'],
    release: 'STOP; resources released; no P2002 reassignment' })
  console.log(JSON.stringify({ limitedVerdict: 'PASS_LIMITED_SOURCE_AUTO', guards, protected: after.length,
    protectedDelta: protectedDelta.length, artifacts: owned.length }))
} else {
  throw new Error(`Unsupported stage: ${stage}`)
}

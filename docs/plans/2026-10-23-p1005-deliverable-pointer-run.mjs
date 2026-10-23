import {
  readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync,
  realpathSync, symlinkSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = '2026-10-23-p1005-deliverable-pointer-'
const own = join(repo, '.tmp/p1005-deliverable-pointer-20261023-r1')
const pkg = join(repo, 'packages/dsh-pm-tool')
const original = join(repo, 'reports/all-pending-evidence-20261021/P1L2EventsR1')
const stage = process.argv[2]
const run = join(own, stage ?? 'invalid')
const sha = b => createHash('sha256').update(b).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const fingerprint = p => {
  const b = readFileSync(p)
  return { path: relative(repo, p), bytes: b.length, sha256: sha(b) }
}
const output = (name, value) => {
  const p = join(repo, 'docs/plans', prefix + name)
  writeFileSync(p, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
const files = [
  'src/client/views/records/records-listbox.tsx',
  'src/client/views/records/records-deliverable-form.tsx',
  'src/client/views/records/records-overlay.tsx',
  'src/client/views/records/records-options.ts',
  'src/client/views/records/records-payloads.ts',
  'src/client/views/records/records-history.ts',
  'src/client/views/records.css',
  'src/client/form-validation.ts', 'src/core/repo-format.ts',
  'src/core/labels.ts', 'src/client/views/types.ts', 'src/client/shared/records-props.ts',
]
const test = 'src/client/views/records/records-deliverable-pointer-dom.test.tsx'
const oldTests = [
  'src/client/views/records/records-options.test.ts',
  'src/client/views/records/records-payloads.test.ts',
  'src/client/views/records/records-history.test.ts',
  'src/client/form-validation.test.ts',
]
const declared = () => [
  'AGENTS.md', 'docs/collaboration.md', 'docs/external-skills.md',
  'docs/testing/p1-l2-events-gui-review-20261023-r1.md',
  'vendor/agent-skills/mattpocock/manifest.json',
  'packages/dsh-pm-tool/package.json', 'packages/dsh-pm-tool/pnpm-lock.yaml',
  'packages/dsh-pm-tool/scripts/verify-external-skills.mjs',
  ...files.concat(oldTests).map(f => 'packages/dsh-pm-tool/' + f),
].map(p => fingerprint(join(repo, p)))
function sealedInputs() {
  const index = json(join(original, 'index-r1.json'))
  const observed = Object.entries(index).map(([p, expected]) => {
    const got = fingerprint(join(original, p))
    if (got.bytes !== expected.bytes || got.sha256 !== expected.sha256) throw new Error(`封包漂移: ${p}`)
    return got
  })
  return [fingerprint(join(original, 'index-r1.json')), ...observed]
}
function tree(root) {
  const result = []
  function walk(p) {
    for (const e of readdirSync(p, { withFileTypes: true })) {
      const next = join(p, e.name)
      if (e.isDirectory()) walk(next)
      else if (e.isFile()) result.push(fingerprint(next))
    }
  }
  walk(root)
  return result.sort((a, b) => a.path.localeCompare(b.path))
}
if (!['audit', 'dom-r1', 'dom-r2', 'green-r1', 'green-r2', 'red-final', 'green-final-r1',
  'green-final-r2', 'affected', 'vendor-final', 'facts', 'facts-r2', 'seal', 'seal-r2'].includes(stage)) throw new Error('未知阶段')
mkdirSync(own, { recursive: true })
if (existsSync(run)) throw new Error(`不覆盖既有输出: ${run}`)
mkdirSync(run)
if (stage === 'audit') {
  const before = [...declared(), ...sealedInputs()]
  const rounds = [8, 9, 10, 11, 12].map(n => {
    const eventFile = readdirSync(original).find(p => p.startsWith(`round${String(n).padStart(2, '0')}-`) && p.endsWith('-events.json'))
    const value = json(join(original, eventFile))
    return {
      file: eventFile, rowTypes: value.rows.map(r => r.type), frameCount: value.frames.length,
      frameMetadataKeys: [...new Set(value.frames.flatMap(f => Object.keys(f.metadata)))],
      hasPointerRows: value.rows.some(r => /pointer|mouse|click|focus|submit/i.test(r.type)),
    }
  })
  output('baseline.json', {
    stage, environment: { platform: process.platform, node: process.version, cwd: repo },
    baselineCommit: '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd',
    baselineCommitSource: '专家封存候选声明，仅引用，未执行 Git',
    sealedCount: before.filter(f => f.path.startsWith(relative(repo, original) + '/')).length - 1,
    rounds, inputs: before,
    boundary: '原封包逐字节核对；不运行原脚本、GUI、服务或 private 路径。',
  })
  console.log(JSON.stringify({ stage, sealedCount: 1077, rounds }, null, 2))
} else if (stage === 'vendor-final') {
  const manifest = json(join(repo, 'vendor/agent-skills/mattpocock/manifest.json'))
  const vendorFiles = [...manifest.rootFiles, ...manifest.skills.flatMap(s => s.files)]
    .map(f => fingerprint(join(repo, 'vendor/agent-skills/mattpocock', f.path)))
  const args = [join(pkg, 'scripts/verify-external-skills.mjs')]
  const executed = spawnSync(process.execPath, args, { cwd: repo, encoding: 'utf8' })
  output('vendor-final-stdout.log', executed.stdout ?? '')
  output('vendor-final-stderr.log', executed.stderr ?? '')
  output('vendor-final-receipt.json', { command: [process.execPath, ...args], cwd: repo,
    exit: executed.status, manifest: fingerprint(join(repo, 'vendor/agent-skills/mattpocock/manifest.json')),
    inputs: vendorFiles, vendorIntegrityVerified: executed.status === 0 })
  console.log(executed.stdout)
  process.exitCode = executed.status ?? 1
} else if (stage === 'facts' || stage === 'facts-r2') {
  const stages = ['dom-r1', 'dom-r2', 'green-r1', 'green-r2', 'affected']
  if (stage === 'facts-r2') stages.push('red-final', 'green-final-r1', 'green-final-r2')
  const results = stages.map(s => {
    const receipt = json(join(repo, 'docs/plans', prefix + s + '-receipt.json'))
    const result = json(join(own, s, 'vitest.json'))
    const observation = s === 'affected' ? null : json(join(own, s, 'observations/D04.json'))
    const clicks = observation?.events.filter(e => e.type === 'click' && e.phase === 1)
    const value = { stage: s, exit: receipt.exit, passed: result.numPassedTests, failed: result.numFailedTests,
      sourceDrift: receipt.sourceDrift.length, dependencyDrift: receipt.dependencyDrift,
      d04CaptureClicks: clicks?.map(e => ({ target: e.target, detail: e.detail })),
      backdropBubblePrevented: observation?.events.filter(e =>
        e.type === 'click' && e.phase === 3 && e.target.class === 'rb-lb-backdrop').map(e => e.defaultPrevented),
      inputs: receipt.inputs,
      result: fingerprint(join(own, s, 'vitest.json')),
    }
    return value
  })
  const fallback = 'reports/all-pending-evidence-20261021/P0CaptureRemainingR1/execution-scripts/pmtool-p0-fallback-helper-20261023.mjs'
  output(stage + '.json', { results,
    additionalReadOnlySource: fingerprint(join(repo, fallback)),
    newTest: fingerprint(join(pkg, test)),
    originalListbox: fingerprint(join(own, 'dom-r2/src/client/views/records/records-listbox.tsx')),
    candidateListbox: fingerprint(join(pkg, 'src/client/views/records/records-listbox.tsx')),
    boundary: 'DOM label 默认激活的局部事实；原 round09 pointer 选 accepted 的真实命中链仍待证。' })
  console.log(JSON.stringify(results.map(({ inputs, result, ...summary }) => summary), null, 2))
} else if (stage === 'seal' || stage === 'seal-r2') {
  const baseline = json(join(repo, 'docs/plans', prefix + 'baseline.json'))
  const drift = baseline.inputs.flatMap(old => {
    const now = fingerprint(join(repo, old.path))
    return now.sha256 === old.sha256 && now.bytes === old.bytes ? [] : [{ before: old, after: now }]
  })
  const green = json(join(repo, 'docs/plans', prefix + 'green-final-r2-receipt.json'))
  const expectedFile = 'packages/dsh-pm-tool/src/client/views/records/records-listbox.tsx'
  const unexpectedDrift = drift.filter(d => d.before.path !== expectedFile
    || d.after.sha256 !== green.inputs.find(f => f.path === expectedFile)?.sha256)
  const testMatchesGreen = fingerprint(join(pkg, test)).sha256 === green.inputs
    .find(f => f.path === 'packages/dsh-pm-tool/' + test)?.sha256
  const delta = spawnSync('diff', ['-u',
    join(own, 'dom-r2/src/client/views/records/records-listbox.tsx'),
    join(pkg, 'src/client/views/records/records-listbox.tsx')], { encoding: 'utf8' })
  output(stage === 'seal' ? 'delta.patch' : 'delta-r2.patch', delta.stdout)
  const outputs = readdirSync(join(repo, 'docs/plans'))
    .filter(p => p.startsWith(prefix))
    .map(p => fingerprint(join(repo, 'docs/plans', p)))
  output(stage + '.json', { stage, inputsChecked: baseline.inputs.length, drift, unexpectedDrift, testMatchesGreen, outputs,
    tmpOutputs: tree(own), productDelta: drift.filter(f => f.before.path.includes('/src/')),
    newTest: fingerprint(join(pkg, test)), deltaCommand: ['diff', '-u',
      join(own, 'dom-r2/src/client/views/records/records-listbox.tsx'),
      join(pkg, 'src/client/views/records/records-listbox.tsx')], deltaExit: delta.status,
    longRunningChildren: [], locks: [], released: true,
    boundary: '新增 test 单列输出；未声称共享 dirty 全树或全盘无变化。seal 不自指纹。' })
  console.log(JSON.stringify({ inputsChecked: baseline.inputs.length, drift, unexpectedDrift }))
  if (unexpectedDrift.length || !testMatchesGreen || delta.status !== 1) process.exitCode = 1
} else {
  const selected = stage === 'affected' ? oldTests : [test]
  const before = [...files, ...selected].map(f => fingerprint(join(pkg, f)))
  for (const f of [...files, ...selected]) {
    const target = join(run, f)
    mkdirSync(dirname(target), { recursive: true })
    const source = stage === 'red-final' && f.endsWith('/records-listbox.tsx')
      ? join(own, 'dom-r2', f) : join(pkg, f)
    if (stage === 'red-final' && f.endsWith('/records-listbox.tsx')) {
      const baseline = json(join(repo, 'docs/plans', prefix + 'baseline.json'))
      if (fingerprint(source).sha256 !== baseline.inputs
        .find(p => p.path === 'packages/dsh-pm-tool/' + f)?.sha256) throw new Error('冻结旧源码漂移')
    }
    writeFileSync(target, readFileSync(source), { flag: 'wx' })
  }
  writeFileSync(join(run, 'package.json'), '{"type":"module"}\n', { flag: 'wx' })
  const modules = join(run, 'node_modules')
  mkdirSync(modules)
  for (const e of readdirSync(join(pkg, 'node_modules'))) {
    if (['.cache', '.vite', '.bin'].includes(e)) continue
    symlinkSync(realpathSync(join(pkg, 'node_modules', e)), join(modules, e))
  }
  const widget = join(repo, '.tmp/widget-poc/node_modules')
  for (const e of ['jsdom', 'react-dom']) symlinkSync(realpathSync(join(widget, e)), join(modules, e))
  const react = realpathSync(join(widget, 'react'))
  const reactDom = realpathSync(join(widget, 'react-dom'))
  const deps = [react, reactDom, realpathSync(join(widget, 'jsdom'))]
  const depInputs = deps.flatMap(tree)
  const config = join(run, 'vitest.config.mjs')
  writeFileSync(config, `export default {
  root: ${JSON.stringify(run)},
  cacheDir: ${JSON.stringify(join(run, 'cache'))},
  esbuild: { jsx: 'automatic' },
  resolve: { alias: {
    react: ${JSON.stringify(react)},
    'react-dom': ${JSON.stringify(reactDom)}
  } },
  test: { environment: 'node', include: ${JSON.stringify(selected)},
    pool: 'forks', poolOptions: { forks: { singleFork: true } },
    coverage: { enabled: false }, reporters: ['default', 'json'],
    outputFile: ${JSON.stringify(join(run, 'vitest.json'))} }
}\n`, { flag: 'wx' })
  mkdirSync(join(run, 'observations'))
  mkdirSync(join(run, 'tmp'))
  const args = [join(pkg, 'node_modules/vitest/vitest.mjs'), 'run', '--config', config]
  const env = { ...process.env, QA_POINTER_EVIDENCE_ROOT: join(run, 'observations'),
    TMPDIR: join(run, 'tmp'), XDG_CACHE_HOME: join(run, 'cache'), VITE_CACHE_DIR: join(run, 'cache') }
  const actualSourceInputs = tree(join(run, 'src'))
  const executed = spawnSync(process.execPath, args, { cwd: run, env, encoding: 'utf8', timeout: 120000 })
  output(stage + '-stdout.log', executed.stdout ?? '')
  output(stage + '-stderr.log', executed.stderr ?? '')
  const after = before.map(f => fingerprint(join(repo, f.path)))
  const depAfter = deps.flatMap(tree)
  const drift = before.filter((f, i) => JSON.stringify(f) !== JSON.stringify(after[i]))
  output(stage + '-receipt.json', {
    stage, command: [process.execPath, ...args], cwd: run, exit: executed.status,
    signal: executed.signal, error: executed.error?.message,
    env: { QA_POINTER_EVIDENCE_ROOT: env.QA_POINTER_EVIDENCE_ROOT, TMPDIR: env.TMPDIR,
      XDG_CACHE_HOME: env.XDG_CACHE_HOME, VITE_CACHE_DIR: env.VITE_CACHE_DIR },
    inputs: before, sourceDrift: drift, actualSourceInputs,
    originalFrozenSource: stage === 'red-final'
      ? fingerprint(join(own, 'dom-r2/src/client/views/records/records-listbox.tsx')) : null,
    dependencies: deps.map(p => ({ path: relative(repo, p), version: json(join(p, 'package.json')).version })),
    dependencyInputs: depInputs, dependencyDrift: JSON.stringify(depInputs) !== JSON.stringify(depAfter),
    isolatedOutputs: tree(run),
    boundary: '真实 React DOM 原字节源码；依赖只读链接，React 与 react-dom 使用同一 widget 依赖树；无 GUI/layout/hit-test/RPC。',
  })
  console.log(executed.stdout)
  console.error(executed.stderr)
  console.log(JSON.stringify({ stage, exit: executed.status, sourceDrift: drift.length,
    dependencyDrift: JSON.stringify(depInputs) !== JSON.stringify(depAfter) }))
  process.exitCode = executed.status ?? 1
}

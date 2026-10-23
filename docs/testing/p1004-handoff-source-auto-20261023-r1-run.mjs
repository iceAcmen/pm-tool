import {
  copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync,
  symlinkSync, writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const pkg = join(repo, 'packages/dsh-pm-tool')
const prefix = join(repo, 'docs/testing/p1004-handoff-source-auto-20261023-r1-')
const dev = join(repo, 'docs/plans/2026-10-23-p1004-sidecar-handoff-')
const mode = process.argv[2]
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const fp = path => {
  const bytes = readFileSync(path)
  return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}
const same = (a, b) => a.bytes === b.bytes && a.sha256 === b.sha256
const emit = (suffix, data) => {
  const path = prefix + suffix
  assert(!existsSync(path), `Do not overwrite: ${path}`)
  writeFileSync(path, typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n')
}
const includes = {
  dom: ['src/client/panel-sidecar-task-handoff.test.tsx'],
  affected: [
    'src/client/sidecar-minimize-retention.test.tsx',
    'src/client/copilot-error-prefix.test.tsx',
    'src/client/panel-cancel-close.test.ts',
  ],
}
const declared = {
  'src/client/panel.tsx': 'a58e21657daa79d41255a4e1fd929b8d084101fdf8b7a236eaf9c0205d08247d',
  'src/client/panel-sidecar-task-handoff.test.tsx': '1e1e6bf1586ff32f3dc8526e904707b7159bb5b4c27b9f67e299161231e6e64b',
}

if (mode === 'audit') {
  const seal = read(dev + 'seal.json')
  const protectedInputs = {}
  const bind = path => { protectedInputs[path] = fp(path); return protectedInputs[path] }
  for (const path of [
    'AGENTS.md', 'docs/collaboration.md',
    'docs/testing/p1-projection-refresh-gui-review-20261023-r1.md',
    'packages/dsh-pm-tool/vitest.config.ts', '.tmp/widget-poc/package.json',
  ]) bind(join(repo, path))
  bind(dev + 'seal.json')
  const evidence = Object.entries(seal.evidence).map(([name, expected]) => {
    const path = join(repo, 'docs/plans', name)
    const actual = bind(path)
    assert(same(actual, expected), `Developer evidence changed: ${name}`)
    return { path, ...actual }
  })
  const source = {}
  const drift = []
  for (const [path, expected] of Object.entries(seal.source)) {
    const absolute = join(pkg, path)
    const current = bind(absolute)
    source[path] = current
    if (!same(current, expected)) drift.push({ path, sealed: expected, current })
  }
  // Drift is reported before any execution, never silently inherited.
  assert.equal(drift.length, 0, JSON.stringify(drift))
  for (const [path, sha256] of Object.entries(declared)) assert.equal(source[path].sha256, sha256)
  for (const path of [...includes.dom, ...includes.affected]) assert(existsSync(join(pkg, path)), path)
  const dependencies = {}
  const roots = {
    package: join(pkg, 'node_modules'),
    widget: join(repo, '.tmp/widget-poc/node_modules'),
  }
  for (const [group, names] of [
    ['package', ['react', 'react-test-renderer', 'vitest', 'lucide-react', 'zod', 'expr-eval', 'react-grid-layout']],
    ['widget', ['react', 'react-dom', 'jsdom']],
  ]) {
    for (const name of names) {
      const target = realpathSync(join(roots[group], name))
      const manifest = join(target, 'package.json')
      const data = read(manifest)
      const require = createRequire(manifest)
      const entry = require.resolve(name)
      dependencies[`${group}:${name}`] = {
        name, target, version: data.version, peerDependencies: data.peerDependencies ?? {},
        manifest: bind(manifest), entry, entryFingerprint: bind(entry),
        ...(name === 'react-dom' || name === 'react-test-renderer' || name === 'lucide-react'
          ? { nativeReact: realpathSync(dirname(require.resolve('react/package.json'))) } : {}),
      }
    }
  }
  for (const key of ['package:react', 'widget:react', 'widget:react-dom', 'package:react-test-renderer'])
    assert.equal(dependencies[key].version, '18.3.1')
  assert.equal(dependencies['widget:jsdom'].version, '25.0.1')
  assert.equal(dependencies['package:vitest'].version, '2.1.9')
  const declarations = { package: read(join(pkg, 'package.json')), widget: read(join(repo, '.tmp/widget-poc/package.json')) }
  assert.equal(declarations.package.dependencies['lucide-react'], dependencies['package:lucide-react'].version)
  assert.equal(declarations.package.devDependencies.react, dependencies['package:react'].version)
  assert.equal(declarations.widget.dependencies.jsdom, '^25.0.1')
  assert.equal(declarations.widget.dependencies['react-dom'], '^18.3.1')
  const rounds = {}
  for (const label of ['red', 'red-r2', 'red-r3', 'red-r4', 'green', 'green-r2', 'affected', 'affected-r2']) {
    const receipt = read(dev + label + '-receipt.json')
    const map = read(dev + label + '-source.json').source
    const stdout = readFileSync(dev + label + '-stdout.log', 'utf8')
    rounds[label] = {
      status: receipt.status, tests: receipt.tests, sourceCount: Object.keys(map).length,
      inputPanel: map['src/client/panel.tsx'], inputTest: map[includes.dom[0]],
      inputDrift: receipt.inputDrift, rawSummary: stdout.split('\n').filter(line => /Test Files|Tests\s+\d|Tests\s+\d/.test(line)),
    }
  }
  for (const label of ['red-r3', 'red-r4']) {
    assert.equal(rounds[label].status, 1)
    assert.equal(rounds[label].tests.failed, 6)
    assert.equal(rounds[label].tests.passed, 1)
    assert.equal(rounds[label].inputPanel.sha256, '581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d')
    assert.equal(rounds[label].inputTest.sha256, declared[includes.dom[0]])
  }
  for (const label of ['green', 'green-r2', 'affected', 'affected-r2']) {
    assert.equal(rounds[label].status, 0)
    assert.equal(rounds[label].tests.passed, label.startsWith('green') ? 7 : 22)
    assert.equal(rounds[label].tests.failed, 0)
    assert.equal(rounds[label].inputPanel.sha256, declared['src/client/panel.tsx'])
  }
  const delta = readFileSync(dev + 'green-r2-delta.patch', 'utf8')
  const added = delta.split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++')).length
  const removed = delta.split('\n').filter(line => line.startsWith('-') && !line.startsWith('---')).length
  assert.equal(added, 15); assert.equal(removed, 5)
  const baseline = read(dev + 'red-r4-baseline.json')
  assert(baseline.root.startsWith('/tmp/pmtool-p1004-sidecar-handoff-'))
  const oldPath = join(baseline.root, 'baseline-panel.tsx')
  assert.equal(bind(oldPath).sha256, rounds['red-r4'].inputPanel.sha256)
  const diffArgs = ['-u', '--label', 'input/panel.tsx', oldPath,
    '--label', 'output/panel.tsx', join(pkg, 'src/client/panel.tsx')]
  const diff = spawnSync('/usr/bin/diff', diffArgs, { encoding: 'utf8' })
  assert.equal(diff.status, 1)
  assert.equal(diff.stdout, delta)
  emit('audit.json', {
    role: 'independent SOURCE/AUTO expert; no developer or GUI role',
    at: new Date().toISOString(), node: process.version, platform: process.platform,
    baselineCommitDeclaration: '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd',
    gitNotExecuted: true, protectedInputs, source, evidence, dependencies, includes, rounds,
    drift, delta: { added, removed, comparisonCommand: ['/usr/bin/diff', ...diffArgs], exit: diff.status },
  })
  console.log(JSON.stringify({ protected: Object.keys(protectedInputs).length, source: Object.keys(source).length,
    developerEvidence: evidence.length, drift, delta: { added, removed }, includes }))
} else if (mode === 'dom' || mode === 'affected') {
  assert(!existsSync(prefix + mode + '-receipt.json'), 'Round already recorded')
  const audit = read(prefix + 'audit.json')
  for (const [path, expected] of Object.entries(audit.protectedInputs))
    assert(same(fp(path), expected), `Input changed before test: ${path}`)
  const root = mkdtempSync('/tmp/pmtool-p1004-independent-source-auto-')
  for (const path of Object.keys(audit.source)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    copyFileSync(join(pkg, path), join(root, path))
    assert(same(fp(join(root, path)), audit.source[path]), `Copy changed: ${path}`)
  }
  const modules = join(root, 'node_modules')
  mkdirSync(modules)
  for (const name of ['vitest', 'lucide-react', 'zod', 'expr-eval', 'react-grid-layout', 'react-test-renderer']) {
    symlinkSync(audit.dependencies[`package:${name}`].target, join(modules, name))
  }
  const react = audit.dependencies[mode === 'dom' ? 'widget:react' : 'package:react'].target
  symlinkSync(react, join(modules, 'react'))
  for (const name of ['react-dom', 'jsdom'])
    symlinkSync(audit.dependencies[`widget:${name}`].target, join(modules, name))
  const temporary = join(root, 'temporary')
  const home = join(root, 'home')
  for (const path of [temporary, home, join(root, 'output')]) mkdirSync(path)
  const config = join(root, 'independent-vitest.config.mjs')
  writeFileSync(config, 'export default ' + JSON.stringify({
    root, cacheDir: join(root, 'cache'),
    resolve: { alias: { react }, dedupe: ['react'] },
    esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
    test: { environment: 'node', include: includes[mode], pool: 'forks',
      poolOptions: { forks: { singleFork: true } }, server: { deps: { inline: ['lucide-react'] } },
      reporters: ['default', 'json'], outputFile: join(root, 'output/vitest.json'), testTimeout: 15000 },
  }, null, 2) + '\n')
  const command = [process.execPath, join(audit.dependencies['package:vitest'].target, 'vitest.mjs'),
    'run', '--config', config]
  const startedAt = new Date().toISOString()
  const run = spawnSync(command[0], command.slice(1), {
    cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 120000,
    env: { PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: home,
      TMPDIR: temporary, TMP: temporary, TEMP: temporary, CI: '1', NO_COLOR: '1',
      XDG_CACHE_HOME: join(root, 'xdg-cache'), XDG_CONFIG_HOME: join(root, 'xdg-config'),
      P1004_OBSERVATIONS: join(root, 'output/observations.json'),
      PREFIX_OBSERVATIONS: join(root, 'output/prefix-observations.ndjson') },
  })
  emit(mode + '-stdout.log', run.stdout ?? '')
  emit(mode + '-stderr.log', run.stderr ?? '')
  const resultPath = join(root, 'output/vitest.json')
  const result = existsSync(resultPath) ? read(resultPath) : null
  if (result) emit(mode + '-vitest.json', result)
  const drift = Object.entries(audit.protectedInputs).filter(([path, expected]) =>
    !same(fp(path), expected)).map(([path]) => path)
  const copyDrift = Object.entries(audit.source).filter(([path, expected]) =>
    !same(fp(join(root, path)), expected)).map(([path]) => path)
  const receipt = {
    role: 'independent SOURCE/AUTO execution', mode, startedAt, endedAt: new Date().toISOString(),
    node: process.version, cwd: root, command, config: fp(config), status: run.status,
    signal: run.signal, error: run.error?.message ?? null, inputDrift: drift, copyDrift,
    include: includes[mode], sourceCount: Object.keys(audit.source).length, react,
    lucideInline: true, credentialsEnvironmentNotInherited: true,
    tests: result && { total: result.numTotalTests, passed: result.numPassedTests,
      failed: result.numFailedTests, pending: result.numPendingTests,
      files: result.testResults.map(file => ({ path: file.name, status: file.status,
        assertions: file.assertionResults.map(test => ({ name: test.fullName, status: test.status, failureMessages: test.failureMessages })) })) },
    notRun: ['build', 'noEmit', 'install', 'service', 'GUI', 'Git', 'developer run.mjs', 'full suite'],
  }
  emit(mode + '-receipt.json', receipt)
  console.log(JSON.stringify(receipt, null, 2))
  assert.equal(drift.length, 0); assert.equal(copyDrift.length, 0)
  assert.equal(run.status, 0)
  assert.equal(result.numTotalTests, mode === 'dom' ? 7 : 22)
  assert.equal(result.numPassedTests, mode === 'dom' ? 7 : 22)
  assert.equal(result.numPendingTests, 0)
} else if (mode === 'inspect') {
  const audit = read(prefix + 'audit.json')
  const receipt = read(prefix + 'dom-receipt.json')
  const path = join(receipt.cwd, 'output/observations.json')
  const observations = read(path)
  const require = createRequire(join(audit.dependencies['widget:jsdom'].target, 'package.json'))
  const { JSDOM } = require('jsdom')
  const rows = observations.map(row => {
    const dom = new JSDOM(row.html)
    const doc = dom.window.document
    const sidecar = doc.querySelector('.pm-sidecar')
    const dialog = doc.querySelector('.pm-drawer')
    const focus = row.focus ? new JSDOM(row.focus).window.document.body.firstElementChild : null
    const result = { label: row.label, sidecarHidden: row.sidecarHidden, display: row.sidecarDisplay,
      dialog: dialog?.getAttribute('aria-label') ?? null, focusTag: focus?.tagName ?? null,
      focusName: focus?.getAttribute('name') ?? null, focusText: focus?.textContent ?? null,
      oldAnswer: doc.querySelector('.pm-copilot-bubble.pm-copilot-ai')?.textContent ?? null,
      projection: doc.querySelector('.pm-proj-card')?.textContent ?? null,
      unsent: doc.querySelector('.pm-copilot-input')?.getAttribute('value') ?? null,
      taskId: row.snapshot.tasks[0].id, task: row.snapshot.tasks[0], calls: row.calls }
    if (row.label === 'first-open') {
      assert.equal(result.dialog, '编辑任务')
      assert.equal(result.focusName, 'title')
      assert.equal(result.taskId, 't-0006')
      assert.equal(result.sidecarHidden, true)
      assert.equal(result.display, 'none')
      assert.equal(result.oldAnswer, 't-0006 当前未指派，进度0%。')
      assert(result.projection.includes('负责人：P1004刷新负责人'))
      assert(result.projection.includes('进度：47%'))
      assert.equal(result.unsent, '本轮未发送问题')
    }
    if (row.label === 'direct-return') {
      assert.equal(result.dialog, null)
      assert.equal(result.sidecarHidden, false)
      assert.equal(result.focusTag, 'BUTTON')
      assert.equal(result.focusText, '打开任务')
    }
    dom.window.close()
    return result
  })
  assert.equal(rows.filter(row => row.label === 'first-open').length, 7)
  const affected = read(prefix + 'affected-receipt.json')
  assert.deepEqual(affected.tests.files.map(file => file.assertions.length).sort((a, b) => a - b), [5, 5, 12])
  const finalDrift = Object.entries(audit.protectedInputs).filter(([path, expected]) =>
    !same(fp(path), expected)).map(([path]) => path)
  assert.deepEqual(finalDrift, [])
  emit('observations.json', observations)
  const prefixPath = join(affected.cwd, 'output/prefix-observations.ndjson')
  emit('prefix-observations.ndjson', readFileSync(prefixPath, 'utf8'))
  emit('inspection.json', { at: new Date().toISOString(), originalObservationFingerprint: fp(path),
    firstOpen: 7, directReturnObservations: rows.filter(row => row.label === 'direct-return').length,
    rows, affectedCounts: affected.tests.files.map(file => ({ path: file.path, count: file.assertions.length })),
    finalDrift, limits: ['jsdom has no layout/hit-test', 'transport replaced', 'no browser Tab default behavior', 'no real DB/model'] })
  console.log(JSON.stringify({ firstOpen: 7, directReturnObservations: rows.filter(row => row.label === 'direct-return').length,
    affected: affected.tests.total, finalDrift }))
} else if (mode === 'seal') {
  const audit = read(prefix + 'audit.json')
  const drift = Object.entries(audit.protectedInputs).filter(([path, expected]) =>
    !same(fp(path), expected)).map(([path]) => path)
  const concurrent = {
    'src/client/views/records/records-listbox.tsx': 'db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2',
    'src/commands/reflect.ts': '7198072968f7ae02cd145ba97ee690870406918f3d036d191de27d196bb2a951',
  }
  assert.deepEqual(drift.sort(), Object.keys(concurrent).map(path => join(pkg, path)).sort())
  for (const [path, hash] of Object.entries(concurrent)) assert.equal(fp(join(pkg, path)).sha256, hash)
  const copies = ['dom', 'affected'].map(mode => {
    const receipt = read(prefix + mode + '-receipt.json')
    const changed = Object.entries(audit.source).filter(([path, expected]) =>
      !same(fp(join(receipt.cwd, path)), expected)).map(([path]) => path)
    assert.equal(receipt.status, 0)
    assert.deepEqual(changed, [])
    return { mode, root: receipt.cwd, count: Object.keys(audit.source).length, drift: changed }
  })
  const domRoot = read(prefix + 'dom-receipt.json').cwd
  const sourceBinding = Object.keys(concurrent).map((path, index) => {
    const args = ['-u', join(domRoot, path), join(pkg, path)]
    const delta = spawnSync('/usr/bin/diff', args, { encoding: 'utf8' })
    assert.equal(delta.status, 1)
    const output = `source-binding-close-${index === 0 ? 'listbox' : 'reflect'}-delta.patch`
    emit(output, delta.stdout)
    return { path, tested: audit.source[path], current: fp(join(pkg, path)),
      command: ['/usr/bin/diff', ...args], exit: delta.status, output,
      inheritance: 'none to the changed combined candidate; isolated P1004 result retained' }
  })
  const observations = read(prefix + 'observations.json')
  assert.equal(observations.filter(row => /rb-lb-(menu|backdrop)/.test(row.html)).length, 0)
  assert.equal(observations.flatMap(row => row.calls).filter(line => /^reflect\b/.test(line)).length, 0)
  emit('source-binding-close.json', {
    at: new Date().toISOString(), role: 'independent binding; not P1005 acceptance',
    protectedCount: Object.keys(audit.protectedInputs).length,
    unchangedCount: Object.keys(audit.protectedInputs).length - drift.length,
    concurrentSourceDrift: sourceBinding, copies,
    activeListboxMarkup: 0, reflectCalls: 0,
    note: 'listbox is imported via OKR/habit forms but not rendered in this task fixture; reflect backend is not executed',
    originalScopeConclusion: 'PASS only for unchanged isolated tested inputs; no P1005 or combined-current PASS',
  })
  const suffixes = ['run.mjs', 'audit.json', 'dom-receipt.json', 'dom-stdout.log', 'dom-stderr.log', 'dom-vitest.json',
    'affected-receipt.json', 'affected-stdout.log', 'affected-stderr.log', 'affected-vitest.json',
    'observations.json', 'prefix-observations.ndjson', 'inspection.json', 'report.md', 'seal-attempt1.json',
    'source-binding-close.json', 'source-binding-close-listbox-delta.patch', 'source-binding-close-reflect-delta.patch']
  const outputs = Object.fromEntries(suffixes.map(suffix => [suffix, fp(prefix + suffix)]))
  const report = readFileSync(prefix + 'report.md', 'utf8')
  assert(!report.split('\n').some(line => /[ \t]+$/.test(line)))
  const links = [...report.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1]).filter(link => !link.includes('://'))
  const missing = links.filter(link => !existsSync(resolve(dirname(prefix), link.split('#')[0])))
  assert.deepEqual(missing, ['p1004-handoff-source-auto-20261023-r1-seal.json'])
  emit('seal.json', { at: new Date().toISOString(), role: 'independent SOURCE/AUTO expert',
    node: process.version, ok: true, exit: 0, protectedCount: Object.keys(audit.protectedInputs).length,
    unchangedProtectedCount: Object.keys(audit.protectedInputs).length - drift.length,
    inputDrift: drift, concurrentSourceBinding: sourceBinding, isolatedCopies: copies, outputs,
    reportCheck: { exit: 0, localLinks: links.length, onlyPendingSeal: missing, whitespace: 'ok' },
    conclusion: 'PASS limited to original isolated P1004 SOURCE/AUTO; changed combined candidate not signed; GUI FAIL unchanged',
    release: 'released / STOP; no SOURCE, builder, GUI, service or Git ownership' })
  console.log(JSON.stringify({ ok: true, protectedCount: Object.keys(audit.protectedInputs).length, drift,
    outputs: suffixes.length, release: 'released / STOP' }))
} else {
  throw new Error('Expected audit/dom/affected/inspect/seal')
}

// 独立窄测设施；只写本 r2 前缀或本次创建的 tmp，不执行开发 runner。
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  readlinkSync, realpathSync, symlinkSync, writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const pkg = join(repo, 'packages/dsh-pm-tool')
const docs = join(repo, 'docs/testing')
const prefix = 'p2002-outbound-slot-source-auto-20261023-r2'
const dev = 'docs/plans/2026-10-23-p2002-outbound-slot-'
const r1 = 'docs/testing/p2002-outbound-slot-source-auto-20261023-r1-supplement.tsx'
const own = ['src/index.ts', 'src/client/panel.tsx', 'src/client/views/tasks.tsx']
const stage = process.argv[2]
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const fp = path => {
  const bytes = readFileSync(path)
  return { path: relative(repo, path), bytes: bytes.length, sha256: sha(bytes) }
}
const artifact = suffix => join(docs, prefix + '-' + suffix)
const statePath = artifact('state.json')
function put(path, value) {
  if (!path.startsWith(join(docs, prefix + '-')) && !path.startsWith(root + '/')) {
    throw new Error(`拒绝非 owned 写入 ${path}`)
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function tree(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const path = join(dir, e.name)
    if (e.isDirectory()) return tree(path)
    if (e.isFile()) return [fp(path)]
    if (e.isSymbolicLink()) return [{ path: relative(repo, path), link: readlinkSync(path) }]
    throw new Error(`未知文件类型 ${path}`)
  }).sort((a, b) => a.path.localeCompare(b.path))
}
function protectedInputs() {
  const files = [
    'AGENTS.md', 'docs/collaboration.md', r1,
    'docs/testing/p2-outbound-history-review-20261023-r1.md',
    'docs/testing/p2-outbound-history-review-20261023-r1-audit.json',
    'docs/testing/p2-outbound-history-review-20261023-r1-audit-r2.json',
    'docs/testing/p2-outbound-history-review-20261023-r1-seal.json',
    'docs/changelog.md', 'docs/progress.md', 'docs/handoff.md', 'docs/onboarding-prompt.md',
    'packages/dsh-pm-tool/package.json', 'packages/dsh-pm-tool/pnpm-lock.yaml',
  ]
  const plans = readdirSync(join(repo, 'docs/plans'), { withFileTypes: true })
    .filter(e => e.isFile() && e.name.startsWith('2026-10-23-p2002-outbound-slot-'))
    .map(e => fp(join(repo, 'docs/plans', e.name)))
  return [...tree(join(pkg, 'src')), ...files.map(p => fp(join(repo, p))), ...plans]
}
function delta(before, after) {
  const a = new Map(before.map(f => [f.path, f]))
  const b = new Map(after.map(f => [f.path, f]))
  return [...new Set([...a.keys(), ...b.keys()])].sort().flatMap(path =>
    JSON.stringify(a.get(path)) === JSON.stringify(b.get(path)) ? [] : [{
      path, before: a.get(path) ?? null, after: b.get(path) ?? null,
    }])
}
const root = stage === 'capture'
  ? mkdtempSync('/tmp/p2002-source-auto-r2-')
  : read(statePath).root

function reviewDevelopment() {
  const seal = read(join(repo, dev + 'seal.json'))
  const checks = []
  const check = (id, satisfied, detail, scope = 'SOURCE/AUTO') => checks.push({ id, satisfied, detail, scope })
  const artifacts = seal.artifacts.map(expected => {
    if (!expected.path.startsWith(dev)) throw new Error(`封件路径越界 ${expected.path}`)
    const actual = fp(join(repo, expected.path))
    return { expected, actual, matches: actual.sha256 === expected.sha256 && actual.bytes === expected.bytes }
  })
  check('dev-artifact-integrity', artifacts.every(f => f.matches), { count: artifacts.length })
  check('dev-own-delta', JSON.stringify(seal.ownDelta.map(f => f.path).sort()) ===
    JSON.stringify(own.map(p => 'packages/dsh-pm-tool/' + p).sort()), seal.ownDelta)
  check('dev-not-self-pass', seal.verdict === 'NOT_JUDGED' && seal.GUI === 'NOT_RUN', {
    verdict: seal.verdict, GUI: seal.GUI, build: seal.build,
  })
  check('dev-release', own.every(p => seal.releasedSourceLocks.includes(p)) &&
    seal.stop && seal.remainingChildren.length === 0, seal.releasedSourceLocks)
  const baseline = read(join(repo, dev + 'baseline.json'))
  const currentSource = tree(join(pkg, 'src'))
  const currentOwn = own.map(p => fp(join(pkg, p)))
  check('current-three-source', currentOwn.every(actual =>
    seal.ownDelta.find(f => f.path === actual.path)?.after?.sha256 === actual.sha256), currentOwn)
  const test = fp(join(repo, dev + 'test.tsx'))
  const executions = []
  for (const label of ['red-final', 'green-final', 'affected-final']) {
    const receipt = read(join(repo, dev + label + '-receipt.json'))
    const binding = read(join(repo, dev + label + '-inputs.json'))
    const output = read(join(repo, dev + label + '-output.json'))
    const vitestFile = output.find(f => f.path.endsWith('/vitest.json'))
    const bytes = Buffer.from(vitestFile.content)
    check(label + '-embedded-vitest', sha(bytes) === vitestFile.sha256 && bytes.length === vitestFile.bytes,
      { expected: { path: vitestFile.path, bytes: vitestFile.bytes, sha256: vitestFile.sha256 } })
    const vitest = JSON.parse(vitestFile.content)
    check(label + '-counts', label === 'red-final'
      ? receipt.exit === 1 && vitest.numFailedTests === 8 && vitest.numPassedTests === 0
      : receipt.exit === 0 && vitest.numFailedTests === 0 && vitest.numPassedTests === (label === 'green-final' ? 8 : 54),
    { exit: receipt.exit, total: vitest.numTotalTests, passed: vitest.numPassedTests, failed: vitest.numFailedTests })
    check(label + '-guards', !receipt.error && !receipt.signal &&
      !receipt.protectedInputDelta.length && !receipt.dependencyDelta.length && !receipt.isolatedSourceDelta.length,
    { error: receipt.error, signal: receipt.signal, protected: receipt.protectedInputDelta.length,
      dependencies: receipt.dependencyDelta.length, source: receipt.isolatedSourceDelta.length })
    const threeSource = own.map(path => {
      const captured = binding.source.find(f => f.path.endsWith('/' + path))
      const expected = label === 'red-final'
        ? baseline.inputs.find(f => f.path === 'packages/dsh-pm-tool/' + path)
        : currentOwn.find(f => f.path === 'packages/dsh-pm-tool/' + path)
      return { path, captured, expected, matches: captured?.sha256 === expected?.sha256 }
    })
    check(label + '-three-source-binding', threeSource.every(f => f.matches), threeSource)
    if (label !== 'affected-final') {
      check(label + '-same-test', binding.source.find(f =>
        f.path.endsWith('/src/client/p2002-outbound-slot.test.tsx'))?.sha256 === test.sha256, test)
    }
    const currentDelta = delta(binding.repoSourcesAtRun, currentSource)
    if (label !== 'red-final') {
      check(label + '-current-source-inheritance', !currentDelta.length, currentDelta, '整组合')
      // 当前并行 OKR 视图不在这些任务/出站用例的呈现路径，仍保留整树差异而非抹成全同。
      const outsideTaskPath = new Set([
        'packages/dsh-pm-tool/src/client/views/okrs.tsx',
        'packages/dsh-pm-tool/src/client/views/okrs-related.test.tsx',
      ])
      check(label + '-task-path-inheritance', currentDelta.every(f => outsideTaskPath.has(f.path)), {
        differences: currentDelta, excludedScope: '仅 OKR 视图/专项；其余源码均与开发运行输入同。',
        reason: '六邻接用例不导入panel/okrs；真实panel补测在当前复制源上执行任务视图，不签OKR或整组合。',
      })
    }
    const observationFiles = output.filter(f => f.path.endsWith('/observations.json'))
    const observations = observationFiles.map(file => {
      const raw = Buffer.from(file.content)
      const frames = JSON.parse(file.content)
      const initial = frames.find(f => f.label === 'legal-schema-fixture')
      const final = frames.find(f => f.label === 'closed')
      return { path: file.path, integrity: sha(raw) === file.sha256 && raw.length === file.bytes,
        files: Object.keys(initial.initial).length, dbEqual: JSON.stringify(initial.initial) === JSON.stringify(final.raw),
        writes: final.writes.length, calls: final.calls.length,
        readOnly: final.calls.every(c => c.line === 'web snapshot' && JSON.stringify(c.before) === JSON.stringify(c.after)) }
    })
    if (label === 'green-final') check('dev-eight-db-read-only', observations.length === 8 &&
      observations.every(f => f.integrity && f.dbEqual && !f.writes && f.readOnly), observations)
    executions.push({ label, receipt: { command: receipt.command, cwd: receipt.cwd, env: receipt.env,
      startedAt: receipt.startedAt, finishedAt: receipt.finishedAt, exit: receipt.exit,
      error: receipt.error, signal: receipt.signal },
    tests: vitest.testResults.map(f => ({ name: f.name, assertions: f.assertionResults.map(t => ({
      title: t.title, status: t.status, failureMessages: t.failureMessages,
    })) })), observations })
  }
  const selfcheck = read(join(repo, dev + 'selfcheck.json'))
  check('dev-selfcheck', selfcheck.satisfied === true, selfcheck)
  return { checks, artifacts, executions, currentOwn, baselineCommit: baseline.baselineCommit,
    baselineAuthority: '引用开发/原独立封件，未读取 Git 或开发 tmp。',
    nonOwnedDeltaAtDevSeal: seal.nonOwnedDelta, currentSource,
    boundary: '不回读开发tmp、privatefreeze/runtime或原1690包；仅审开发已封当前证据与只读产品源。' }
}

function executeNarrow(label, timezone, pattern, correctGridAssertion = false) {
  const run = join(root, label)
  const input = join(run, 'inputs')
  if (existsSync(run)) throw new Error(`拒绝覆盖 ${run}`)
  const before = protectedInputs()
  mkdirSync(input, { recursive: true })
  cpSync(join(pkg, 'src'), join(input, 'src'), { recursive: true, errorOnExist: true, force: false })
  const correction = {
    from: "expect(row.style.gridTemplateColumns.endsWith('72px')).toBe(true)",
    to: "expect(row.style.getPropertyValue('--pt-grid-columns').trim().endsWith('72px')).toBe(true)",
    reason: '现产品使用 --pt-grid-columns + CSS消费；原inline属性假设错误，不证明产品列宽失败。',
  }
  let supplement = readFileSync(join(repo, r1), 'utf8')
  if (correctGridAssertion) {
    if (supplement.split(correction.from).length !== 2) throw new Error('测试纠正锚点不唯一')
    supplement = supplement.replace(correction.from, correction.to)
  }
  const composed = [
    readFileSync(join(repo, dev + 'test.tsx'), 'utf8'),
    supplement,
    readFileSync(artifact('supplement.tsx'), 'utf8'),
  ].join('\n')
  put(join(input, 'src/client/p2002-independent.test.tsx'), composed)
  put(join(input, 'package.json'), '{"type":"module"}\n')
  const modules = join(input, 'node_modules')
  mkdirSync(modules)
  for (const e of readdirSync(join(pkg, 'node_modules'))) {
    if (['.cache', '.vite', '.bin'].includes(e)) continue
    symlinkSync(realpathSync(join(pkg, 'node_modules', e)), join(modules, e))
  }
  const widget = join(repo, '.tmp/widget-poc/node_modules')
  for (const name of ['jsdom', 'react-dom']) symlinkSync(realpathSync(join(widget, name)), join(modules, name))
  const react = realpathSync(join(widget, 'react'))
  const reactDom = realpathSync(join(widget, 'react-dom'))
  const vitest = realpathSync(join(pkg, 'node_modules/vitest'))
  const vite = dirname(createRequire(join(vitest, 'package.json')).resolve('vite/package.json'))
  const dependencyRoots = [vitest, vite, react, reactDom, realpathSync(join(widget, 'jsdom')),
    ...['zod', '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage',
      '@deepseek-ai/dsh-storage-json', '@deepseek-ai/dsh-storage-domain',
      'lucide-react', 'react-grid-layout'].map(name => realpathSync(join(pkg, 'node_modules', name)))]
  if (dependencyRoots.some(path => !path.includes('/node_modules/'))) throw new Error('依赖根不属于已批准 node_modules')
  const dependenciesBefore = dependencyRoots.flatMap(tree)
  const output = join(run, 'output')
  const env = {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(run, 'home'),
    TMPDIR: join(run, 'tmp'), XDG_CACHE_HOME: join(run, 'cache/xdg'), TZ: timezone,
    DSH_PM_E2E: '0', DSH_PM_SKILL_PILOT: '0', P2002_OUTPUT: output,
    DSH_PM_ISOLATED_ROOT: join(output, 'assets'), DSH_PM_FILE_ROOT: join(output, 'assets/files'),
    PM_FILES_DIR: join(output, 'files'), PM_BACKUPS_DIR: join(output, 'backups'), PM_EXPORTS_DIR: join(output, 'exports'),
  }
  for (const path of [env.HOME, env.TMPDIR, env.XDG_CACHE_HOME, output]) mkdirSync(path, { recursive: true })
  const config = join(run, 'vitest.config.mjs')
  put(config, `export default {
    root: ${JSON.stringify(input)}, cacheDir: ${JSON.stringify(join(run, 'cache/vite'))},
    esbuild: { jsx: 'automatic' },
    resolve: { alias: { react: ${JSON.stringify(react)}, 'react-dom': ${JSON.stringify(reactDom)} } },
    test: { environment: 'node', include: ['src/client/p2002-independent.test.tsx'],
      server: { deps: { inline: [/lucide-react/, /react-test-renderer/, /react-grid-layout/, /react-draggable/, /react-resizable/] } },
      pool: 'forks', poolOptions: { forks: { singleFork: true } },
      reporters: ['verbose', 'json'], outputFile: { json: ${JSON.stringify(join(output, 'vitest.json'))} },
      testTimeout: 20000, hookTimeout: 20000, coverage: { enabled: false } },
  }\n`)
  const sourceBefore = tree(join(input, 'src'))
  const binding = { source: sourceBefore, config: fp(config), node: fp(process.execPath),
    dependencyRoots, dependencies: dependenciesBefore, links: tree(modules),
    composedFrom: [fp(join(repo, dev + 'test.tsx')), fp(join(repo, r1)), fp(artifact('supplement.tsx'))],
    correction: correctGridAssertion ? correction : null }
  put(artifact(label + '-inputs.json'), binding)
  const argv = [join(vitest, 'vitest.mjs'), 'run', '--config', config, '--testNamePattern', pattern]
  const startedAt = new Date().toISOString()
  const result = spawnSync(process.execPath, argv, { cwd: input, env, encoding: 'utf8',
    timeout: 120000, maxBuffer: 20 * 1024 * 1024 })
  put(artifact(label + '-stdout.log'), result.stdout ?? '')
  put(artifact(label + '-stderr.log'), result.stderr ?? '')
  const receipt = { command: [process.execPath, ...argv], cwd: input, env, startedAt,
    finishedAt: new Date().toISOString(), exit: result.status, signal: result.signal,
    error: result.error ? { name: result.error.name, message: result.error.message, code: result.error.code } : null,
    node: process.version, platform: process.platform,
    protectedInputDelta: delta(before, protectedInputs()),
    dependencyDelta: delta(dependenciesBefore, dependencyRoots.flatMap(tree)),
    isolatedSourceDelta: delta(sourceBefore, tree(join(input, 'src'))) }
  put(artifact(label + '-receipt.json'), receipt)
  const outputs = tree(output).map(f => ({
    ...f, content: f.path.endsWith('.json') ? readFileSync(resolve(repo, f.path), 'utf8') : undefined,
  }))
  put(artifact(label + '-output.json'), outputs)
  const v = existsSync(join(output, 'vitest.json')) ? read(join(output, 'vitest.json')) : null
  console.log(JSON.stringify({ label, exit: receipt.exit, error: receipt.error, signal: receipt.signal,
    protected: receipt.protectedInputDelta.length, dependencies: receipt.dependencyDelta.length,
    source: receipt.isolatedSourceDelta.length, passed: v?.numPassedTests, failed: v?.numFailedTests,
    pending: v?.numPendingTests, failures: v?.testResults.flatMap(f => f.assertionResults
      .filter(t => t.status === 'failed').map(t => ({ title: t.title, failure: t.failureMessages[0]?.slice(0, 1500) }))) }))
  process.exitCode = result.status ?? 1
}

if (stage === 'capture') {
  const inputs = protectedInputs()
  const review = reviewDevelopment()
  put(artifact('development-audit.json'), review)
  put(statePath, { root, capturedAt: new Date().toISOString(), node: process.version,
    platform: process.platform, inputs, threeSource: review.currentOwn })
  console.log(JSON.stringify({ root, checks: review.checks.length,
    unsatisfied: review.checks.filter(c => !c.satisfied).map(c => c.id), artifactCount: review.artifacts.length }))
  process.exitCode = review.checks.every(c => c.satisfied) ? 0 : 1
} else if (stage === 'review-r2') {
  const review = reviewDevelopment()
  put(artifact('development-audit-r2.json'), review)
  console.log(JSON.stringify({ checks: review.checks.length,
    unsatisfied: review.checks.filter(c => !c.satisfied).map(c => ({ id: c.id, scope: c.scope })),
    limitedSatisfied: review.checks.filter(c => c.scope === 'SOURCE/AUTO').every(c => c.satisfied) }))
  process.exitCode = review.checks.filter(c => c.scope === 'SOURCE/AUTO').every(c => c.satisfied) ? 0 : 1
} else if (stage === 'narrow') {
  executeNarrow('narrow', 'Asia/Shanghai', '\\bT0[1-5]\\b')
} else if (stage === 't02-corrected') {
  executeNarrow('t02-corrected', 'Asia/Shanghai', '\\bT02\\b', true)
} else if (stage === 'utc') {
  executeNarrow('utc', 'UTC', '\\bT05\\b')
} else if (stage === 'audit') {
  const review = read(artifact('development-audit-r2.json'))
  const runs = ['narrow', 't02-corrected', 'utc'].map(label => {
    const receipt = read(artifact(label + '-receipt.json'))
    const output = read(artifact(label + '-output.json'))
    const vitest = JSON.parse(output.find(f => f.path.endsWith('/vitest.json')).content)
    const observations = output.filter(f => f.path.endsWith('/observations.json')).map(file => {
      const bytes = Buffer.from(file.content)
      const frames = JSON.parse(file.content)
      const legal = frames.findLast(f => f.initial)
      const final = frames.find(f => f.label === 'closed')
      return { path: file.path, integrity: sha(bytes) === file.sha256 && bytes.length === file.bytes,
        files: Object.keys(legal.initial).length, dbEqual: JSON.stringify(legal.initial) === JSON.stringify(final.raw),
        writes: final.writes.length, calls: final.calls.length,
        readOnly: final.calls.every(c => c.line === 'web snapshot' && JSON.stringify(c.before) === JSON.stringify(c.after)),
        labels: frames.map(f => f.label) }
    })
    return { label, receipt, total: vitest.numTotalTests, passed: vitest.numPassedTests,
      failed: vitest.numFailedTests, skipped: vitest.numPendingTests,
      tests: vitest.testResults.flatMap(f => f.assertionResults.map(t => ({
        title: t.title, status: t.status, failureMessages: t.failureMessages,
      }))), observations }
  })
  const changes = delta(read(statePath).inputs, protectedInputs())
  const first = runs.find(r => r.label === 'narrow')
  const firstFailure = first.tests.filter(t => t.status === 'failed')
  const correctedBinding = read(artifact('t02-corrected-inputs.json'))
  const correctedSource = readFileSync(join(root, 't02-corrected/inputs/src/client/p2002-independent.test.tsx'), 'utf8')
  const originalSource = readFileSync(join(root, 'narrow/inputs/src/client/p2002-independent.test.tsx'), 'utf8')
  const testCorrection = { classification: 'TEST_ASSUMPTION_ERROR，不是产品缺陷',
    originalTitle: firstFailure[0]?.title, originalReceipt: fp(artifact('narrow-receipt.json')),
    originalFailure: firstFailure[0]?.failureMessages, correction: correctedBinding.correction,
    exactlyOneChange: originalSource.replace(correctedBinding.correction.from, correctedBinding.correction.to) === correctedSource }
  const satisfied = review.checks.filter(c => c.scope === 'SOURCE/AUTO').every(c => c.satisfied) &&
    firstFailure.length === 1 && firstFailure[0].title.startsWith('T02 ') && testCorrection.exactlyOneChange &&
    runs.every(r => !r.receipt.error && !r.receipt.signal &&
    !r.receipt.protectedInputDelta.length && !r.receipt.dependencyDelta.length &&
    !r.receipt.isolatedSourceDelta.length &&
    (r.label === 'narrow' ? r.receipt.exit === 1 && r.failed === 1 && r.passed === 4
      : r.receipt.exit === 0 && r.failed === 0 && r.passed === 1) &&
    r.observations.length === r.passed + r.failed &&
    r.observations.every(o => o.integrity && o.dbEqual && !o.writes && o.readOnly)) && !changes.length
  put(artifact('audit.json'), { task: 'RA-P2002-OUTBOUND-SLOT', root,
    sourceAutoVerdict: satisfied ? '有限 PASS' : 'FAIL/BLOCKED，按具体证据裁决',
    satisfied, developmentAudit: fp(artifact('development-audit-r2.json')), runs, testCorrection,
    protectedInputDelta: changes,
    source: own.map(p => fp(join(pkg, p))), GUI: 'NOT_RUN', build: 'NOT_RUN',
    wholeCombination: 'NOT_JUDGED', parentCommitAdmission: 'NOT_JUDGED' })
  console.log(JSON.stringify({ satisfied, changes: changes.map(f => f.path), runs: runs.map(r => ({
    label: r.label, passed: r.passed, failed: r.failed, skipped: r.skipped,
    dbFiles: r.observations.map(o => o.files), calls: r.observations.reduce((n, o) => n + o.calls, 0),
    writes: r.observations.reduce((n, o) => n + o.writes, 0),
  })) }))
  process.exitCode = satisfied ? 0 : 1
} else if (stage === 'selfcheck') {
  const changes = delta(read(statePath).inputs, protectedInputs())
  const whitespace = readdirSync(docs).filter(name => name.startsWith(prefix + '-') &&
    /\.(md|mjs|tsx)$/.test(name)).flatMap(name =>
    readFileSync(join(docs, name), 'utf8').split(/\r?\n/).flatMap((line, n) =>
      /[ \t]+$/.test(line) ? [{ path: name, line: n + 1 }] : []))
  const bindings = ['narrow', 't02-corrected', 'utc'].map(label => {
    const binding = read(artifact(label + '-inputs.json'))
    const output = read(artifact(label + '-output.json'))
    return { label, ownSource: own.map(path => {
      const captured = binding.source.find(f => f.path.endsWith('/' + path))
      const actual = fp(join(pkg, path))
      return { path, matches: captured?.sha256 === actual.sha256 && captured.bytes === actual.bytes }
    }), jsonIntegrity: output.filter(f => f.content !== undefined).every(f => {
      const bytes = Buffer.from(f.content)
      return sha(bytes) === f.sha256 && bytes.length === f.bytes
    }) }
  })
  const pattern = `^${process.execPath} docs/testing/${prefix}-runner\\.mjs capture$`
  const captureProcess = spawnSync('/usr/bin/pgrep', ['-f', pattern], { encoding: 'utf8' })
  const satisfied = !changes.length && !whitespace.length &&
    bindings.every(b => b.jsonIntegrity && b.ownSource.every(f => f.matches)) && captureProcess.status === 1
  put(artifact('selfcheck.json'), { satisfied, changes, whitespace, bindings,
    captureProcess: { command: ['/usr/bin/pgrep', '-f', pattern],
      exit: captureProcess.status, stdout: captureProcess.stdout, stderr: captureProcess.stderr,
      error: captureProcess.error?.message ?? null,
      meaning: '只查本次 capture 精确argv；exit1无匹配，非失败或杀进程。未补造capture外层终止码。' } })
  console.log(JSON.stringify({ satisfied, changes: changes.map(f => f.path),
    whitespace: whitespace.length, capturePgrepExit: captureProcess.status, bindings }))
  process.exitCode = satisfied ? 0 : 1
} else if (stage === 'seal') {
  const changes = delta(read(statePath).inputs, protectedInputs())
  const outputs = readdirSync(docs).filter(name => name.startsWith(prefix + '-'))
    .map(name => fp(join(docs, name)))
  const audit = read(artifact('audit.json'))
  put(artifact('seal.json'), { task: 'RA-P2002-OUTBOUND-SLOT', sealedAt: new Date().toISOString(),
    sourceAutoVerdict: audit.sourceAutoVerdict, audit: fp(artifact('audit.json')),
    protectedInputDelta: changes, protectedInputs: protectedInputs(), artifacts: outputs,
    ownedTmpFiles: tree(root).filter(f => !f.path.includes('/node_modules/')),
    GUI: 'NOT_RUN', build: 'NOT_RUN', wholeCombination: 'NOT_JUDGED',
    parentCommitAdmission: 'NOT_JUDGED', writes: [relative(repo, docs) + '/' + prefix + '-*', root],
    released: true, remainingChildren: [], stop: true,
    boundary: '仅本次观察输入前后保护；没有全机/原private根或正式服务零写声明，没有GUI/整组合/父提交放行。' })
  console.log(JSON.stringify({ artifacts: outputs.length, changes: changes.map(f => f.path), released: true, stop: true }))
  process.exitCode = changes.length ? 1 : 0
} else {
  throw new Error(`未知 stage ${stage}`)
}

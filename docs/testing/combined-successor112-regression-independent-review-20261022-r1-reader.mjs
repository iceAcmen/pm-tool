import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

// Read evidence and bytes only. No product imports, subprocesses, or test execution.
const prefix = fileURLToPath(import.meta.url).replace(/-reader\.mjs$/, '')
const repo = path.resolve(path.dirname(prefix), '../..')
const root = path.join(repo, 'reports/all-pending-evidence-20261021/CombinedSuccessor112R1')
const freeze = '/private/tmp/pmtool-combined-successor112-20261022-r1'
const pkg = path.join(freeze, 'packages/dsh-pm-tool')
const main = path.join(repo, 'packages/dsh-pm-tool')
const old = '/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool'
const task = path.join(repo, 'reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1')
const report = path.join(repo, 'reports/all-pending-evidence-20261021/ReportExportFenceRetestR2')
const mode = process.argv[2] || 'preflight'
assert(['preflight', 'final'].includes(mode))
const hash = data => crypto.createHash('sha256').update(data).digest('hex')
const bytes = file => fs.readFileSync(file)
const text = file => bytes(file).toString('utf8')
const json = file => JSON.parse(text(file))
const evidence = name => path.join(root, name)
const record = file => ({ bytes: bytes(file).length, sha256: hash(bytes(file)) })
const checks = []
function check(name, fn) {
  const details = fn()
  checks.push({ name, verified: true, details })
}
function scan(dir) {
  const result = {}
  if (!fs.existsSync(dir)) return result
  function walk(current, rel = '') {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const name = rel ? `${rel}/${entry.name}` : entry.name
      const file = path.join(current, entry.name)
      const st = fs.lstatSync(file)
      if (st.isDirectory()) walk(file, name)
      else if (st.isSymbolicLink()) result[name] = { link: fs.readlinkSync(file), real: fs.realpathSync(file) }
      else result[name] = { ...record(file), dev: st.dev, ino: st.ino }
    }
  }
  walk(dir)
  return result
}
const content = rows => Object.fromEntries(Object.entries(rows).map(([name, row]) =>
  [name, row.link ? { link: row.link } : { bytes: row.bytes, sha256: row.sha256 }]))
function verifyManifest(base, rows) {
  for (const [name, value] of Object.entries(rows)) {
    const expected = typeof value === 'string' ? value : value.sha256
    assert.equal(hash(bytes(path.join(base, name))), expected, name)
    if (typeof value !== 'string') assert.equal(bytes(path.join(base, name)).length, value.bytes, name)
  }
}
function depCheck(name, expectedFiles, expectedLinks) {
  const claim = json(evidence(name))
  const a = scan(claim.from), b = scan(claim.to)
  assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort())
  let files = 0, links = 0
  for (const [rel, before] of Object.entries(a)) {
    const after = b[rel]
    if (before.link) {
      links++
      assert(before.real.startsWith(claim.from + '/'), rel)
      assert(after.real.startsWith(claim.to + '/'), rel)
      const expected = path.isAbsolute(before.link)
        ? claim.to + before.link.slice(claim.from.length) : before.link
      assert.equal(after.link, expected, rel)
    } else {
      files++
      assert.equal(after.sha256, before.sha256, rel)
      assert.equal(after.bytes, before.bytes, rel)
      assert(!(after.dev === before.dev && after.ino === before.ino), rel)
    }
  }
  assert.equal(files, expectedFiles)
  assert.equal(links, expectedLinks)
  assert.equal(claim.files, files)
  assert.equal(claim.links, links)
  for (const key of ['shared', 'external', 'changed']) assert.deepEqual(claim[key], [])
  return { from: claim.from, to: claim.to, files, links, sharedInode: 0, externalLinks: 0 }
}
function result(name, countFiles, countTests, successful) {
  const r = json(evidence(name + '.result.json'))
  const command = json(evidence(name + '.command.json'))
  const passed = r.testResults.filter(f => f.status === 'passed')
  const assertions = r.testResults.flatMap(f => f.assertionResults)
  assert.equal(passed.length, countFiles)
  assert.equal(assertions.length, countTests)
  assert.equal(r.numTotalTests, countTests)
  assert.equal(r.numPassedTests, countTests)
  assert.equal(r.numFailedTests, 0)
  assert.equal(r.numPendingTests, 0)
  assert.equal(r.numTodoTests, 0)
  assert(assertions.every(a => a.status === 'passed'))
  assert.equal(r.success, successful)
  assert.equal(command.exitCode, successful ? 0 : 1)
  if (successful) assert.equal(r.numFailedTestSuites, 0)
  const files = r.testResults.map(f => f.name)
  assert.equal(new Set(files).size, files.length)
  return { passedFiles: passed.length, totalFileEntries: files.length, tests: assertions.length,
    success: r.success, exitCode: command.exitCode, files,
    failedFileEntries: r.testResults.filter(f => f.status !== 'passed') }
}

check('候选112与原107沿革、519输入', () => {
  const c = json(evidence('candidate.json')), s = json(evidence('source-files.json'))
  const parent = json(evidence('parent107.json'))
  assert.equal(c.baseline, '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd')
  assert.equal(c.freeze, freeze)
  assert.equal(c.builder, 'Main')
  assert.equal(c.version, '0.7.4')
  assert.equal(Object.keys(parent.source).length, 107)
  assert.deepEqual(parent, json(path.join(repo, 'reports/all-pending-evidence-20261021/CombinedRepairR1/r2/source-files.json')))
  const expected = { ...parent.source }
  const updates = ['src/client/panel.tsx', 'src/commands/ask.ts', 'src/core/progress-report-markdown.ts',
    'src/client/task-predecessor-refs-dom.test.tsx', 'src/client/task-predecessor-hidden-submit-dom.test.tsx',
    'src/commands/ask-auth-feedback.test.ts', 'src/core/report-export-excerpts.test.ts']
  for (const name of updates) expected['packages/dsh-pm-tool/' + name] = hash(bytes(path.join(pkg, name)))
  assert.deepEqual(s.source, expected)
  assert.equal(Object.keys(s.source).length, 112)
  assert.equal(c.sourceCount, 112)
  assert.equal(s.count, 112)
  verifyManifest(freeze, s.source)
  const inputs = json(evidence('complete-inputs.json'))
  assert.equal(Object.keys(inputs).length, 519)
  assert.equal(c.completeInputCount, 519)
  verifyManifest(pkg, inputs)
  assert.equal(hash(bytes(path.join(pkg, 'src/client/panel.tsx'))), '581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d')
  assert.equal(hash(bytes(path.join(pkg, 'src/commands/ask.ts'))), '084efb5b33e7cda7368b87c4708f87f460d28588f3e7476cadfad2de0fd35884')
  assert.equal(hash(bytes(path.join(pkg, 'src/core/progress-report-markdown.ts'))), '94290aaf54764628161e84f11d1bd495f7cb965c4178ea155d52b2d28ac99fbf')
  const added = Object.keys(expected).filter(n => !(n in parent.source))
  assert.equal(added.length, 5)
  return { baseline: c.baseline, declared: 112, packageInputs: 519, addedTo107: added,
    trackedPatch: record(evidence('tracked-product.diff')), newFiles: record(evidence('new-product-files.txt')) }
})
check('原包与DOM依赖独占', () => ({
  package: depCheck('package-dependencies.json', 13579, 1030),
  dom: depCheck('dom-dependencies.json', 1595, 2),
}))
check('上游副本及三内链入口合法、LLM同身份', () => {
  const deps = depCheck('upstream-dependencies-r2.json', 14394, 1031)
  const rows = json(evidence('upstream-inputs.json'))
  verifyManifest(path.join(freeze, 'upstream'), rows)
  const original = path.join(repo, 'reports/all-pending-evidence-20261021/AskAuthRetestR1/frozen/upstream')
  assert.deepEqual(content(scan(original)), content(scan(path.join(freeze, 'upstream'))))
  const mappings = json(evidence('upstream-dependencies-r2.json')).mappings
  assert.deepEqual(Object.keys(mappings).sort(), ['@deepseek-ai/dsh-brand', '@deepseek-ai/dsh-llm', '@earendil-works/pi-ai'].sort())
  for (const [name, dest] of Object.entries(mappings)) {
    const actual = fs.realpathSync(path.join(freeze, 'node_modules', name))
    assert.equal(actual, fs.realpathSync(dest))
    assert(actual.startsWith(freeze + '/'))
  }
  assert.equal(fs.realpathSync(path.join(freeze, 'node_modules/@deepseek-ai/dsh-llm')),
    fs.realpathSync(path.join(pkg, 'node_modules/@deepseek-ai/dsh-llm')))
  return { ...deps, mappings, upstreamFiles: Object.keys(rows).length, productDependenciesReplaced: false }
})
check('C02、完整document与真实RAF只复用原专家设施', () => {
  const adapter = path.join(repo, 'docs/testing/task-predecessor-selection-independent-retest-20261022-r1-adapter.mjs')
  const original = path.join(pkg, 'src/client/task-predecessor-refs-dom.test.tsx')
  assert.equal(hash(bytes(original)), '06b0de03361b8003f101595be145e1c645b5b02666e08a0ffa093e6d00246e4f')
  assert.equal(hash(bytes(evidence('c02-adapted.test.tsx'))), 'e60c433287bcac5d658dd0448e852f153dfd33b787529e6218e754292b640fab')
  assert.deepEqual(bytes(evidence('c02-adapted.test.tsx')), bytes(path.join(task, 'r1/C02-adapted-seven.test.tsx')))
  const originalChecklist = text(path.join(pkg, 'src/client/panel-checklist-toggle.test.tsx'))
  const checklist = text(evidence('checklist-fixture.test.tsx'))
  assert.equal(checklist, text(path.join(task, 'r3-facility/checklist-document-fixture.test.tsx')))
  assert.equal(checklist.replace("vi.stubGlobal('document', globalThis.__qaSchedulerDocument)",
    "vi.stubGlobal('document', { activeElement: null })"), originalChecklist)
  const scheduler = text(path.join(task, 'r3-facility/browser-scheduler-setup.mjs'))
  assert.equal(text(evidence('browser-scheduler-setup.mjs')), scheduler
    .replaceAll(task + '/r1/frozen/packages/dsh-pm-tool', pkg)
    .replaceAll(task + '/r1/dom-deps', freeze + '/dom-deps'))
  const dom = text(evidence('vitest-dom.config.mjs'))
  assert(dom.includes("code:code+'\\nexport { TaskForm }\\n'"))
  assert.equal((dom.match(/if\(id===/g) || []).length, 2)
  const full = text(evidence('vitest-full.config.mjs'))
  assert.equal((full.match(/if\(id!==/g) || []).length, 1)
  assert(full.includes('panel-checklist-toggle.test.tsx'))
  assert.equal(text(evidence('vitest-full-r2.config.mjs')),
    `import base from ${JSON.stringify(evidence('vitest-full.config.mjs'))};\nexport default {...base,cacheDir:${JSON.stringify(evidence('runtime/cache/full-r2'))}};\n`)
  return { adapter: record(adapter), c02: record(evidence('c02-adapted.test.tsx')),
    checklist: record(evidence('checklist-fixture.test.tsx')), scheduler: record(evidence('browser-scheduler-setup.mjs')),
    productTransform: 'export TaskForm only', originalOracleRedRetained: true }
})
let formal
check('实际JSON计数、全src测试集合与专项去重', () => {
  const first = result('full', 159, 1675, false)
  assert.equal(first.failedFileEntries.length, 1)
  assert(first.failedFileEntries[0].name.endsWith('/src/commands/ask-auth-feedback.test.ts'))
  assert(first.failedFileEntries[0].message.includes('@deepseek-ai/dsh-brand'))
  formal = result('full-r2', 160, 1686, true)
  const dom = result('dom', 3, 17, true), special = result('special', 2, 7, true)
  const inventory = Object.keys(scan(path.join(pkg, 'src')))
    .filter(n => /\.test\.tsx?$/.test(n)).map(n => path.join(pkg, 'src', n)).sort()
  const actual = [...formal.files, ...dom.files]
  assert.equal(new Set(actual).size, 163)
  assert.deepEqual(actual.sort(), inventory)
  assert(special.files.every(n => !actual.includes(n)))
  for (const [name, sha] of Object.entries(json(evidence('report-special-inputs.json')))) {
    assert.equal(hash(bytes(path.join(pkg, name))), sha)
    assert.deepEqual(bytes(path.join(pkg, name)), bytes(path.join(report, 'frozen/packages/dsh-pm-tool', name)))
  }
  return { first, ordinary: formal, dom, special, srcInventory: inventory.length,
    ordinaryPlusDomInstances: 1703, specialInstancesSeparate: 7 }
})
check('原四模块coverage阈值不改变', () => {
  const cov = json(path.join(pkg, 'coverage/coverage-summary.json'))
  const config = text(path.join(pkg, 'vitest.config.ts'))
  const thresholds = { lines: 40, branches: 80, functions: 35, statements: 40 }
  for (const [key, threshold] of Object.entries(thresholds)) {
    assert(new RegExp(`${key}:\\s*${threshold}\\s*,`).test(config))
    assert(cov.total[key].pct >= threshold)
  }
  assert.deepEqual(Object.keys(cov).filter(k => k !== 'total').map(k => path.basename(k)).sort(),
    ['copilot.ts', 'gantt.ts', 'progress-derivation.ts', 'settings.ts'].sort())
  assert(text(evidence('full-r2.command.json')).includes('--coverage'))
  return { total: cov.total, thresholds, modules: Object.keys(cov).filter(k => k !== 'total'),
    wholePackageCoverageClaimed: false, summary: record(path.join(pkg, 'coverage/coverage-summary.json')) }
})
check('原commands、95默认verify及guard实际输出', () => {
  const commands = {}
  const close = json(evidence('close.json'))
  for (const name of ['tsc', 'bundle', 'noemit', 'full-r2', 'dom', 'special', 'verify', 'guard']) {
    const c = json(evidence(name + '.command.json'))
    assert.equal(c.cwd, pkg)
    assert.equal(c.exitCode, 0)
    assert.equal(c.signal, null)
    assert(!c.error)
    assert.deepEqual(close.commands[name], c)
    assert(c.env.HOME.startsWith(root + '/runtime/'))
    assert.equal(c.env.ASK_AUTH_PI_STREAM, freeze + '/upstream/pi-src/stream.ts')
    assert(!Object.keys(c.env).some(k => /API_KEY|TOKEN|PASSWORD|SECRET/.test(k)))
    commands[name] = { argv: c.argv, pid: c.pid, started: c.started, ended: c.ended, exitCode: c.exitCode }
  }
  const verify = text(evidence('verify.stdout.txt'))
  const expected = fs.readdirSync(path.join(pkg, 'scripts'))
    .filter(n => /^verify-.*\.mjs$/.test(n) && !['verify-isolation.mjs', 'verify-real-model.mjs'].includes(n)).sort()
  const starts = [...verify.matchAll(/\[guard\] >> scripts\/([^\s]+)/g)].map(m => m[1])
  assert.equal(expected.length, 95)
  assert.deepEqual(starts, expected)
  const successes = [...verify.matchAll(/\[guard\]\s+ok\s+scripts\/([^\s]+).*退出码=0/g)].map(m => m[1])
  assert.deepEqual(successes, expected)
  assert(verify.includes('脚本：共 95，通过 95，失败 0'))
  assert(verify.includes('资产：before=5 after=5，污染 0'))
  const stderr = text(evidence('full-r2.stderr.txt'))
  assert(stderr.includes('unique "key" prop'))
  assert(stderr.includes('MaxListenersExceededWarning'))
  assert(!/document\.querySelector is not a function|requestAnimationFrame is not defined|detached tree|Unhandled Error|Uncaught Exception|Unhandled Rejection/i.test(stderr))
  return { commands, verifyTargets: expected, verifyWatchEntries: 5,
    historicalWarnings: ['TaskTable key', 'Node EventTarget keydown listeners'],
    zeroWarningClaimed: false, closeAt: close.at, guardOutput: record(evidence('guard.stdout.txt')) }
})
check('Main完整输入、主lib、107lib、Launcher和冻结产物保护', () => {
  const before = json(evidence('protected-before.json'))
  verifyManifest(main, before.mainInputs)
  assert.deepEqual(content(scan(path.join(main, 'lib'))), before.mainLib)
  assert.deepEqual(content(scan(path.join(old, 'lib'))), before.oldLib)
  assert.deepEqual(content(scan(path.join(freeze, 'launcher'))), before.launcher)
  assert.deepEqual(content(scan(path.join(pkg, 'lib'))), json(evidence('built-artifacts.json')))
  return { mainInputs: Object.keys(before.mainInputs).length, mainLib: Object.keys(before.mainLib).length,
    old107Lib: Object.keys(before.oldLib).length, launcher: Object.keys(before.launcher).length,
    builtArtifacts: Object.keys(json(evidence('built-artifacts.json'))).length, wholeDiskClaimed: false }
})
const originalFiles = {}
for (const name of fs.readdirSync(root).sort()) {
  const file = evidence(name)
  if (fs.lstatSync(file).isFile()) originalFiles[name] = record(file)
}
if (mode === 'final') {
  check('前审已读原件保持原字节', () => {
    const before = json(prefix + '-audit-preflight.json').evidenceFiles
    for (const [name, row] of Object.entries(before)) assert.deepEqual(record(evidence(name)), row, name)
    return { unchangedFiles: Object.keys(before).length }
  })
  check('12项最终收据与真实close/archive外层收据', () => {
    const receipt = json(evidence('execution-receipts.json'))
    assert.equal(receipt.rows.length, 12)
    const toolBase = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
    const names = ['freeze-initial', 'tsc', 'bundle', 'full-initial', 'dom', 'noemit',
      'upstream-facility', 'special', 'verify', 'full-r2', 'guard', 'close']
    assert.deepEqual(receipt.rows.map(r => r.name), names)
    let archivedFiles = 0
    const outer = []
    for (const row of receipt.rows.slice(0, 10)) {
      const base = evidence('executions/' + row.name)
      const meta = json(path.join(base, 'execution.json'))
      assert.deepEqual(meta, row.metadata)
      assert.equal(meta.executionId, row.id)
      assert.equal(meta.status, 'exited')
      assert.equal(meta.outputComplete, true)
      assert.equal(meta.exitCode, row.expected)
      assert.equal(row.expected, ['freeze-initial', 'full-initial'].includes(row.name) ? 1 : 0)
      for (const [name, value] of Object.entries(row.files)) {
        assert.deepEqual(record(path.join(base, name)), value)
        assert.deepEqual(bytes(path.join(base, name)), bytes(path.join(toolBase, row.id, name)))
        archivedFiles++
      }
      outer.push({ name: row.name, executionId: row.id, actualExit: meta.exitCode,
        status: meta.status, outputComplete: meta.outputComplete, pid: meta.pid })
    }
    const guard = receipt.rows.find(r => r.name === 'guard')
    assert(!guard.id)
    assert.deepEqual(guard.structuredChildReceipt, json(evidence('guard.command.json')))
    assert.equal(guard.structuredChildReceipt.exitCode, 0)
    const close = receipt.rows.find(r => r.name === 'close')
    assert(!close.id)
    assert.deepEqual(close.structuredChildReceipt, json(evidence('close.json')))
    assert.equal(receipt.productGateSignedByMain, false)
    for (const [name, row] of Object.entries(receipt.resultFiles)) assert.deepEqual(record(evidence(name)), row, name)
    const supplementary = []
    // Located by reading real tool output, not generated IDs or executor testimony.
    for (const [name, id, expectedText] of [
      ['close', 'f4363581092d19bd5486cd48e45a858c', 'CLOSE exit=0'],
      ['archive', '94160b8fbcf3f9bc44edc92950c31117', 'archived: 12'],
      ['independent-preflight', '6074d80c4c9e66e087a38c4311a7dbf2', '"checks":8'],
    ]) {
      const file = path.join(toolBase, id, 'execution.json')
      const meta = json(file)
      assert.equal(meta.executionId, id)
      assert.equal(meta.status, 'exited')
      assert.equal(meta.outputComplete, true)
      assert.equal(meta.exitCode, 0)
      const log = path.join(toolBase, id, 'output.log')
      assert(text(log).includes(expectedText))
      supplementary.push({ name, actualMetadata: meta, metadataFingerprint: record(file),
        outputFingerprint: record(log), observedOutput: text(log).trim() })
    }
    return { indexedRows: 12, completeOuterArchives: 10, archivedFiles,
      nonzeroOriginalOuterExecutions: 2, outer, guardChildPid: guard.structuredChildReceipt.pid,
      guardOuterBoundary: guard.outerTerminalObserved,
      closeSupplementedByActualToolReceipt: true, supplementary,
      receiptFingerprint: record(evidence('execution-receipts.json')) }
  })
}
const output = {
  at: new Date().toISOString(), role: 'different independent regression evidence reviewer',
  mode, reader: record(fileURLToPath(import.meta.url)), candidate: json(evidence('candidate.json')),
  evidenceRoot: root, testsExecutedByThisRole: 0, subprocessesByThisReader: 0,
  checks, evidenceFiles: originalFiles,
  verdict: mode === 'final' ? 'PASS_LIMITED_COMBINED_REGRESSION_EVIDENCE'
    : 'NOT_SIGNED_PENDING_FINAL_RECEIPTS_REVIEW',
  gui: 'NOT_SIGNED_THIS_ROLE', parentTotalCommit: 'NOT_SIGNED_THIS_ROLE', release: 'STOP',
}
fs.writeFileSync(prefix + '-audit-' + mode + '.json', JSON.stringify(output, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ mode, checks: checks.length, evidenceFiles: Object.keys(originalFiles).length,
  testsExecuted: 0, verdict: output.verdict }))

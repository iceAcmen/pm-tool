import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

// Read evidence and bytes only. Never import product modules or launch processes.
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const root = repo + '/reports/all-pending-evidence-20261021/CombinedSuccessor114R1'
const freeze = '/private/tmp/pmtool-combined-successor114-20261022-r1'
const pkg = freeze + '/packages/dsh-pm-tool'
const previous = '/private/tmp/pmtool-combined-successor112-20261022-r1'
const priorEvidence = repo + '/reports/all-pending-evidence-20261021/CombinedSuccessor112R1'
const self = repo + '/docs/testing/combined-successor114-regression-review-20261022-r1'
const mode = process.argv[2]
assert(['preflight', 'final', 'final-r2'].includes(mode))
const output = self + '-audit-' + mode + '.json'
assert(!fs.existsSync(output), 'Never overwrite an audit')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const bytes = file => fs.readFileSync(file)
const json = file => JSON.parse(bytes(file))
const text = file => bytes(file).toString('utf8')
const fingerprint = file => { const b = bytes(file); return { bytes: b.length, sha256: sha(b) } }
const groups = {}
const errors = []
function group(name, fn) {
  try { groups[name] = fn(); console.log('READ_OK ' + name) }
  catch (error) { errors.push({ group: name, message: error.message }); console.log('READ_ERROR ' + name + ': ' + error.message) }
}
function scan(dir) {
  const result = {}
  function walk(current, relative = '') {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const rel = relative ? relative + '/' + entry.name : entry.name
      const file = current + '/' + entry.name
      const stat = fs.lstatSync(file)
      if (stat.isSymbolicLink()) result[rel] = { link: fs.readlinkSync(file), real: fs.realpathSync(file) }
      else if (stat.isDirectory()) walk(file, rel)
      else { assert(stat.isFile(), file); result[rel] = { ...fingerprint(file), dev: stat.dev, ino: stat.ino } }
    }
  }
  walk(dir)
  return result
}
const content = rows => Object.fromEntries(Object.entries(rows).sort().map(([name, row]) =>
  [name, row.link !== undefined ? { link: row.link } : { bytes: row.bytes, sha256: row.sha256 }]))
const digest = rows => sha(JSON.stringify(content(rows)))
function checkTable(dir, table) {
  for (const [name, expected] of Object.entries(table)) {
    const file = dir + '/' + name
    if (typeof expected === 'object' && Object.hasOwn(expected, 'link')) assert.equal(fs.readlinkSync(file), expected.link, file)
    else {
      assert(fs.lstatSync(file).isFile(), 'ordinary input must not be a symlink: ' + file)
      assert.deepEqual(fingerprint(file), typeof expected === 'string'
        ? { bytes: bytes(file).length, sha256: expected } : expected, file)
    }
  }
  return { count: Object.keys(table).length, digest: sha(JSON.stringify(Object.entries(table).sort())) }
}
function evidenceSnapshot() {
  const files = {}
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile()) files[entry.name] = fingerprint(root + '/' + entry.name)
    if (entry.isDirectory() && ['executions', 'dom-observations'].includes(entry.name)) {
      for (const [name, row] of Object.entries(content(scan(root + '/' + entry.name)))) files[entry.name + '/' + name] = row
    }
  }
  files['freeze/coverage-summary.json'] = fingerprint(pkg + '/coverage/coverage-summary.json')
  files['private-executor.mjs'] = fingerprint('/private/tmp/pmtool-combined-successor114-executor-r1.mjs')
  return files
}
const evidenceBefore = evidenceSnapshot()
const complete = json(root + '/complete-inputs.json')
const declarations = json(root + '/source-files.json')
const protectedBefore = json(root + '/protected-before.json')
const oldComplete = json(priorEvidence + '/complete-inputs.json')
const oldDeclarations = json(priorEvidence + '/source-files.json')
const specials = json(root + '/report-special-inputs.json')

group('candidate_and_exact_delta', () => {
  const candidate = json(root + '/candidate.json')
  assert.equal(candidate.baseline, '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd')
  assert.equal(candidate.freeze, freeze)
  assert.equal(candidate.pkg, pkg)
  assert.equal(candidate.sourceCount, 114)
  assert.equal(candidate.completeInputCount, 521)
  assert.equal(candidate.version, '0.7.4')
  assert.equal(candidate.builder, 'Main')
  assert.equal(Object.keys(complete).length, 521)
  assert.equal(Object.keys(declarations.source).length, 114)
  assert.equal(declarations.count, 114)
  assert.equal(declarations.baseline, candidate.baseline)
  assert.deepEqual(declarations, json(root + '/parent114-development.json'))
  const check = checkTable(freeze, declarations.source)
  const changes = Object.keys(oldComplete).filter(name => JSON.stringify(oldComplete[name]) !== JSON.stringify(complete[name]))
  const added = Object.keys(complete).filter(name => !oldComplete[name]).sort()
  const removed = Object.keys(oldComplete).filter(name => !complete[name])
  assert.deepEqual(changes, ['src/client/shared/drawers/sidecar-portal.tsx'])
  assert.deepEqual(added, ['src/client/copilot-error-prefix-fixture.json', 'src/client/copilot-error-prefix.test.tsx'])
  assert.deepEqual(removed, [])
  const expectedSidecar = text(previous + '/packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx')
    .replace("import { parseActiveModelLane }", "import { parseActiveModelLane, prefixFeedbackOnce }")
    .replace('text: `副驾暂不可用：${e instanceof Error ? e.message : String(e)}`', "text: prefixFeedbackOnce('副驾暂不可用', e)")
  assert.equal(text(pkg + '/src/client/shared/drawers/sidecar-portal.tsx'), expectedSidecar)
  const declaredChanges = Object.keys(oldDeclarations.source).filter(name => oldDeclarations.source[name] !== declarations.source[name])
  const declaredAdded = Object.keys(declarations.source).filter(name => !oldDeclarations.source[name]).sort()
  assert.deepEqual(declaredChanges, changes.map(name => 'packages/dsh-pm-tool/' + name))
  assert.deepEqual(declaredAdded, added.map(name => 'packages/dsh-pm-tool/' + name))
  const shaLines = Object.entries(declarations.source).sort().map(([name, hash]) => hash + '  ' + name).join('\n') + '\n'
  assert.equal(text(root + '/source-files.sha256'), shaLines)
  for (const [name, hash] of Object.entries({
    'src/client/shared/drawers/sidecar-portal.tsx': 'e2e9054e9ad0d7a7e9f3c0020760a2c48a8c477ae44af6b01c2a509e8e4204dc',
    'src/client/copilot-error-prefix.test.tsx': '40aab2a19f34bb82a97cd1e7510ccbc187c8a9218bd03c47e0ab0b133f118e90',
    'src/client/copilot-error-prefix-fixture.json': '54386e800c3262e5bcfd67ef325ab32a3ec11f7ad8fc59c0f3a075d03169fb97',
  })) assert.equal(complete[name].sha256, hash, name)
  return { candidate, ...check, changes, added, removed, exactSidecar: true,
    trackedDiff: fingerprint(root + '/tracked-product.diff'), newFiles: fingerprint(root + '/new-product-files.txt') }
})

const protectedScans = {}
group('source_config_lib_and_prior_protection', () => {
  const result = {}
  for (const [name, dir, table] of [
    ['mainInputs', repo + '/packages/dsh-pm-tool', complete],
    ['frozenInputs', pkg, complete],
    ['old112Inputs', previous + '/packages/dsh-pm-tool', oldComplete],
    ['mainLib', repo + '/packages/dsh-pm-tool/lib', protectedBefore.mainLib],
    ['old107Lib', '/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool/lib', protectedBefore.oldLib],
    ['launcher', freeze + '/launcher', protectedBefore.launcher],
    ['artifacts', pkg + '/lib', json(root + '/built-artifacts.json')],
  ]) {
    result[name] = checkTable(dir, table)
    if (['mainLib', 'old107Lib', 'launcher', 'artifacts'].includes(name)) {
      protectedScans[name] = scan(dir)
      assert.deepEqual(content(protectedScans[name]), table, name)
    }
  }
  assert.deepEqual(protectedBefore.mainInputs, complete)
  protectedScans.old112Lib = scan(previous + '/packages/dsh-pm-tool/lib')
  assert.deepEqual(content(protectedScans.old112Lib), json(priorEvidence + '/built-artifacts.json'))
  result.old112Lib = { count: Object.keys(protectedScans.old112Lib).length, digest: digest(protectedScans.old112Lib) }
  for (const [name, hash] of Object.entries(specials)) {
    assert.equal(sha(bytes(pkg + '/' + name)), hash)
    assert.equal(sha(bytes(previous + '/packages/dsh-pm-tool/' + name)), hash)
  }
  return result
})

const dependencyBefore = {}
group('dependency_full_bytes_inodes_links', () => {
  const result = {}
  for (const [label, expectedFiles, expectedLinks] of [['package', 13579, 1030], ['dom', 1595, 2], ['upstream', 14394, 1031]]) {
    const declaration = json(root + '/' + label + '-dependencies.json')
    assert.deepEqual(declaration.shared, [])
    assert.deepEqual(declaration.external, [])
    assert.deepEqual(declaration.changed, [])
    const original = scan(declaration.from)
    const own = scan(declaration.to)
    dependencyBefore[label] = { declaration, original, own }
    assert.deepEqual(Object.keys(own).sort(), Object.keys(original).sort())
    let files = 0, links = 0
    for (const [name, row] of Object.entries(original)) {
      const copy = own[name]
      if (row.link !== undefined) {
        links++
        assert(row.real.startsWith(declaration.from + '/'), name)
        assert(copy.real.startsWith(declaration.to + '/'), name)
        assert.equal(path.relative(declaration.from, row.real), path.relative(declaration.to, copy.real), name)
      } else {
        files++
        assert.equal(row.bytes, copy.bytes, name)
        assert.equal(row.sha256, copy.sha256, name)
        assert(!(row.dev === copy.dev && row.ino === copy.ino), 'shared inode ' + name)
      }
    }
    assert.equal(files, expectedFiles)
    assert.equal(links, expectedLinks)
    assert.equal(declaration.files, files)
    assert.equal(declaration.links, links)
    result[label] = { from: declaration.from, to: declaration.to, files, links, shared: 0, external: 0, changed: 0,
      originalDigest: digest(original), ownDigest: digest(own) }
  }
  const upstream = json(root + '/upstream-inputs.json')
  checkTable(freeze + '/upstream', upstream)
  checkTable(repo + '/reports/all-pending-evidence-20261021/AskAuthRetestR1/frozen/upstream', upstream)
  const mappings = json(root + '/upstream-mappings.json')
  for (const [name, target] of Object.entries(mappings)) {
    const file = freeze + '/node_modules/' + name
    assert(!path.isAbsolute(fs.readlinkSync(file)), file)
    assert.equal(fs.realpathSync(file), fs.realpathSync(target), file)
    assert(fs.realpathSync(file).startsWith(freeze + '/'), file)
  }
  result.upstream = { ...result.upstream, sourceFiles: Object.keys(upstream).length, bareImports: mappings }
  return result
})

group('original_facilities_not_product_rewrites', () => {
  const result = {}
  for (const name of ['c02-adapter.json', 'c02-adapted.test.tsx', 'checklist-fixture.test.tsx', 'report-special-inputs.json']) {
    assert.deepEqual(fingerprint(root + '/' + name), fingerprint(priorEvidence + '/' + name), name)
    result[name] = fingerprint(root + '/' + name)
  }
  const scheduler = text(priorEvidence + '/browser-scheduler-setup.mjs')
    .replaceAll(previous, freeze).replaceAll(priorEvidence, root)
  assert.equal(text(root + '/browser-scheduler-setup.mjs'), scheduler)
  for (const [name, oldName] of [
    ['vitest-full.config.mjs', 'vitest-full.config.mjs'],
    ['vitest-dom.config.mjs', 'vitest-dom.config.mjs'],
    ['vitest-special.config.mjs', 'vitest-special.config.mjs'],
  ]) {
    const old = text(priorEvidence + '/' + oldName).replaceAll(previous, freeze).replaceAll(priorEvidence, root)
      .replaceAll('/cache/full-r2', '/cache/full')
    assert.equal(text(root + '/' + name), old, name)
    result[name] = fingerprint(root + '/' + name)
  }
  const checklist = text(root + '/checklist-fixture.test.tsx')
    .replace("vi.stubGlobal('document', globalThis.__qaSchedulerDocument)", "vi.stubGlobal('document', { activeElement: null })")
  assert.equal(checklist, text(pkg + '/src/client/panel-checklist-toggle.test.tsx'))
  const oldExecutor = text(priorEvidence + '/executor.mjs')
  const ownExecutor = text('/private/tmp/pmtool-combined-successor114-executor-r1.mjs')
  assert.equal(ownExecutor.slice(ownExecutor.indexOf('function save'), ownExecutor.indexOf('const mode =')),
    oldExecutor.slice(oldExecutor.indexOf('function save'), oldExecutor.indexOf('const mode =')))
  const suffix = "} else if (mode === 'tsc')"
  assert.equal(ownExecutor.slice(ownExecutor.indexOf(suffix)),
    oldExecutor.slice(oldExecutor.indexOf(suffix)).replace("['tsc', 'bundle', 'noemit', 'full-r2',", "['tsc', 'bundle', 'noemit', 'full',"))
  return { ...result, scheduler: fingerprint(root + '/browser-scheduler-setup.mjs'),
    c02: json(root + '/c02-adapter.json'), executor: fingerprint('/private/tmp/pmtool-combined-successor114-executor-r1.mjs'),
    oldExecutor: fingerprint(priorEvidence + '/executor.mjs'), executionImplementationUnchanged: true }
})

group('results_deduplicated_files_and_assertions', () => {
  const result = {}, paths = {}
  for (const [name, files, instances] of [['full', 161, 1691], ['dom', 3, 17], ['special', 2, 7]]) {
    const r = json(root + '/' + name + '.result.json')
    assert.equal(r.success, true)
    for (const key of ['numFailedTestSuites', 'numPendingTestSuites', 'numFailedTests', 'numPendingTests', 'numTodoTests']) assert.equal(r[key], 0)
    assert.equal(r.testResults.length, files)
    const rows = r.testResults.flatMap(file => {
      assert.equal(file.status, 'passed', file.name)
      return file.assertionResults.map(a => { assert.equal(a.status, 'passed', a.fullName); return { file: path.relative(pkg, file.name), fullName: a.fullName } })
    })
    assert.equal(rows.length, instances)
    assert.equal(r.numTotalTests, instances)
    assert.equal(r.numPassedTests, instances)
    paths[name] = r.testResults.map(f => path.relative(pkg, f.name)).sort()
    assert.equal(new Set(paths[name]).size, files)
    result[name] = { files, instances, failed: 0, pending: 0, todo: 0, suitesNotFiles: r.numTotalTestSuites, paths: paths[name], assertionsDigest: sha(JSON.stringify(rows)) }
  }
  const sourceTests = Object.keys(complete).filter(name => /^src\/.*\.test\.tsx?$/.test(name)).sort()
  const combined = [...paths.full, ...paths.dom].sort()
  assert.equal(new Set(combined).size, 164)
  assert.deepEqual(combined, sourceTests)
  assert.deepEqual(paths.special, ['retest-probes.test.ts', 'retest-stress.test.ts'])
  const previousFull = json(priorEvidence + '/full-r2.result.json')
  const oldNames = previousFull.testResults.map(f => path.relative(previous + '/packages/dsh-pm-tool', f.name)).sort()
  assert.deepEqual(paths.full.filter(n => n !== 'src/client/copilot-error-prefix.test.tsx'), oldNames)
  for (const [currentName, priorName] of [['full', 'full-r2'], ['dom', 'dom'], ['special', 'special']]) {
    const current = json(root + '/' + currentName + '.result.json')
    const prior = json(priorEvidence + '/' + priorName + '.result.json')
    for (const oldFile of prior.testResults) {
      const rel = path.relative(previous + '/packages/dsh-pm-tool', oldFile.name)
      const same = current.testResults.find(file => path.relative(pkg, file.name) === rel)
      assert(same, rel)
      assert.deepEqual(same.assertionResults.map(a => a.fullName).sort(), oldFile.assertionResults.map(a => a.fullName).sort(), rel)
    }
  }
  return { ...result, productTestFiles: 164, ordinaryAndDomInstances: 1708, specialInstancesSeparate: 7 }
})

group('coverage_original_scope_and_thresholds', () => {
  const coverage = json(pkg + '/coverage/coverage-summary.json')
  const keys = Object.keys(coverage).filter(k => k !== 'total').map(k => path.relative(pkg, k)).sort()
  assert.deepEqual(keys, ['src/core/copilot.ts', 'src/core/gantt.ts', 'src/core/progress-derivation.ts', 'src/core/settings.ts'])
  for (const [key, minimum] of Object.entries({ lines: 40, branches: 80, functions: 35, statements: 40 }))
    assert(coverage.total[key].pct >= minimum, key)
  return { scope: keys, thresholds: { lines: 40, branches: 80, functions: 35, statements: 40 }, total: coverage.total,
    baseConfig: fingerprint(pkg + '/vitest.config.ts'), summary: fingerprint(pkg + '/coverage/coverage-summary.json') }
})

group('commands_stdout_stderr_default95_watch', () => {
  const close = json(root + '/close.json')
  const commands = {}
  for (const name of ['tsc', 'bundle', 'noemit', 'full', 'dom', 'special', 'verify', 'guard']) {
    const c = json(root + '/' + name + '.command.json')
    assert.deepEqual(c, close.commands[name])
    assert.equal(c.cwd, pkg)
    assert.equal(c.exitCode, 0)
    assert.equal(c.signal, null)
    assert(!c.error)
    assert(Date.parse(c.ended) > Date.parse(c.started))
    assert.equal(c.argv[0], '/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node')
    assert(!Object.keys(c.env).some(k => /(?:API_KEY|TOKEN|SECRET|PASSWORD)/i.test(k)))
    for (const k of ['HOME', 'TMPDIR', 'TMP', 'TEMP', 'XDG_CACHE_HOME', 'XDG_CONFIG_HOME', 'XDG_DATA_HOME', 'npm_config_cache'])
      assert(c.env[k].startsWith(root + '/runtime/'), k)
    commands[name] = { ...c, stdout: fingerprint(root + '/' + name + '.stdout.txt'), stderr: fingerprint(root + '/' + name + '.stderr.txt') }
  }
  assert.deepEqual(commands.verify.argv.slice(1), ['scripts/verify-isolation.mjs'])
  const log = text(root + '/verify.stdout.txt')
  const actualTargets = [...log.matchAll(/\[guard\] >> (scripts\/verify-[^\s]+\.mjs)/g)].map(m => m[1])
  const originalGuard = text(pkg + '/scripts/verify-isolation.mjs')
  assert(originalGuard.includes(".filter(f => f !== 'verify-real-model.mjs')"))
  const expectedTargets = Object.keys(complete).filter(n => /^scripts\/verify-.*\.mjs$/.test(n)
    && !['scripts/verify-isolation.mjs', 'scripts/verify-real-model.mjs'].includes(n)).sort()
  assert.equal(actualTargets.length, 95)
  assert.deepEqual([...actualTargets].sort(), expectedTargets)
  assert.equal(new Set(actualTargets).size, 95)
  assert.equal([...log.matchAll(/\[guard\]\s+ok\s+scripts\/verify-[^\s]+\.mjs \(退出码=0/g)].length, 95)
  assert(log.includes('脚本：共 95，通过 95，失败 0'))
  assert(log.includes('资产：before=5 after=5，污染 0'))
  const watch = ['data', 'packages/backups', 'packages/backup', 'exports', 'assets'].map(n => freeze + '/' + n)
  for (const dir of watch) assert(!fs.existsSync(dir), dir)
  const warnings = text(root + '/full.stderr.txt')
  assert(warnings.includes('unique "key" prop'))
  assert(warnings.includes('MaxListenersExceededWarning'))
  assert.equal(close.independentVerdict, 'NOT_SIGNED_BY_EXECUTOR')
  return { commands, defaultTargets: actualTargets, watch: watch.map(root => ({ root, state: 'MISSING' })),
    warningPolicy: 'Preserve TaskTable key and 11 keydown listeners; no zero-warning or release waiver', close: fingerprint(root + '/close.json') }
})

let indexedEvidenceBefore
group('final_receipts_index_gate', () => {
  if (!fs.existsSync(root + '/execution-receipts.json')) {
    assert.equal(mode, 'preflight', 'Final execution receipts not supplied')
    return { state: 'WAITING_FOR_MAIN_FINAL_RECEIPTS_INDEX', verdict: 'NOT_SIGNED' }
  }
  const receipts = json(root + '/execution-receipts.json')
  const index = json(root + '/index-r1.json')
  const toolRoot = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
  const rows = []
  assert.deepEqual(receipts.receipts.map(r => r.name).sort(), ['bundle', 'dom', 'freeze', 'full', 'noemit', 'special', 'tsc', 'verify'])
  assert.equal(receipts.independentVerdict, 'NOT_SIGNED_BY_EXECUTOR')
  for (const row of receipts.receipts) {
    const dir = root + '/executions/' + row.name
    const tool = toolRoot + '/' + row.id
    const metadata = json(dir + '/execution.json')
    assert.deepEqual(metadata, row.metadata)
    assert.equal(metadata.executionId, row.id)
    assert.equal(metadata.status, 'exited')
    assert.equal(metadata.outputComplete, true)
    assert.equal(metadata.exitCode, 0)
    const files = {}
    for (const name of ['execution.json', 'output.log', 'stderr.log']) {
      assert.deepEqual(bytes(dir + '/' + name), bytes(tool + '/' + name))
      files[name] = fingerprint(dir + '/' + name)
    }
    const stdout = text(dir + '/output.log')
    if (row.name === 'freeze') assert.equal(stdout, "{\n  frozen: '" + freeze + "',\n  inputs: 521,\n  declarations: 114\n}\n")
    else {
      const c = json(root + '/' + row.name + '.command.json')
      assert(stdout.includes('START ' + row.name + ' ' + c.started))
      assert(stdout.includes('END ' + row.name + ' exit=0'))
      assert(metadata.startedAtMs <= Date.parse(c.started))
      assert(metadata.finishedAtMs >= Date.parse(c.ended))
    }
    rows.push({ name: row.name, id: row.id, metadata, files })
  }
  assert.deepEqual(receipts.guard, json(root + '/guard.command.json'))
  assert.deepEqual(receipts.close, json(root + '/close.json'))
  const outer = {}
  for (const [name, id, expectedExit, expectedOutput] of [
    ['guard', '958c478fd3a27e03b0b76e0fbd19f222', 0, 'START guard 2026-10-22T15:09:48.117Z'],
    ['close', 'acb4a4eaccfe770213477133c3264560', 0, 'CLOSE exit=0\n'],
    ['seal_initial', '12965595262ca7a27b594856c6f77f6a', 1, 'EISDIR'],
    ['seal_r2', 'c7fdc10da19b9db12dd7d99e4c8e179f', 0, '{ sealed: 1687 }\n'],
    ['reader_preflight', '87822b565090831d62205c0063cba488', 1, 'productExecutions":0'],
    ['reader_first_final', '6faf174f020ae194a5d957f5d9b940e9', 1, 'productExecutions":0'],
  ]) {
    const dir = toolRoot + '/' + id
    const metadata = json(dir + '/execution.json')
    assert.equal(metadata.status, 'exited')
    assert.equal(metadata.outputComplete, true)
    assert.equal(metadata.exitCode, expectedExit)
    const stdout = text(dir + '/output.log')
    assert(stdout.includes(expectedOutput))
    if (name === 'close' || name === 'seal_r2') assert.equal(stdout, expectedOutput)
    outer[name] = { id, metadata, stdout: fingerprint(dir + '/output.log'), stderr: fingerprint(dir + '/stderr.log'),
      output: stdout, execution: fingerprint(dir + '/execution.json') }
  }
  assert.equal(index.originalSealExit, 1)
  assert.equal(index.sourceCount, 114)
  assert.equal(index.independentVerdict, 'NOT_SIGNED_BY_EXECUTOR')
  assert.equal(Object.keys(index.files).length, 1687)
  let regular = 0, links = 0
  for (const [name, row] of Object.entries(index.files)) {
    const file = root + '/' + name
    const stat = fs.lstatSync(file)
    assert(!name.startsWith('../'))
    if (Object.hasOwn(row, 'symlink')) {
      links++
      assert(stat.isSymbolicLink(), name)
      assert.equal(fs.readlinkSync(file), row.symlink, name)
      assert.equal(fs.realpathSync(file), row.real, name)
      assert(name.startsWith('runtime/tmp/'), 'fixture link outside runtime ' + name)
    } else {
      regular++
      assert(stat.isFile(), 'not a regular evidence file ' + name)
      assert.deepEqual(fingerprint(file), row, name)
    }
  }
  assert.equal(regular, 1643)
  assert.equal(links, 44)
  const actual = scan(root)
  indexedEvidenceBefore = actual
  assert.deepEqual(Object.keys(actual).filter(n => n !== 'index-r1.json').sort(), Object.keys(index.files).sort())
  assert.deepEqual(bytes(root + '/executor-source.mjs'), bytes('/private/tmp/pmtool-combined-successor114-executor-r1.mjs'))
  return { state: 'VERIFIED_FINAL_INDEX_AND_ACTUAL_OUTER_EXITS', receiptIndex: fingerprint(root + '/execution-receipts.json'),
    index: fingerprint(root + '/index-r1.json'), entries: 1687, regular: 1643, fixtureSymlinks: 44,
    indexDigest: digest(actual), indexedRows: index.files, receipts: rows, outer,
    scope: 'Evidence/cache/fixtures are not product inputs. Index does not include selfinput or other experts/livingdocs.' }
})

group('reader_before_after_bytes_protection', () => {
  assert.deepEqual(evidenceSnapshot(), evidenceBefore)
  checkTable(repo + '/packages/dsh-pm-tool', complete)
  checkTable(pkg, complete)
  checkTable(previous + '/packages/dsh-pm-tool', oldComplete)
  const dirs = { mainLib: repo + '/packages/dsh-pm-tool/lib',
    old107Lib: '/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool/lib',
    launcher: freeze + '/launcher', artifacts: pkg + '/lib', old112Lib: previous + '/packages/dsh-pm-tool/lib' }
  for (const [name, before] of Object.entries(protectedScans)) assert.deepEqual(scan(dirs[name]), before, name)
  for (const [label, { declaration, original, own }] of Object.entries(dependencyBefore)) {
    assert.deepEqual(scan(declaration.from), original, label + ' original')
    assert.deepEqual(scan(declaration.to), own, label + ' own')
  }
  if (indexedEvidenceBefore) assert.deepEqual(scan(root), indexedEvidenceBefore, 'all indexed evidence including runtime fixture links')
  if (mode !== 'preflight') {
    const preflight = json(self + '-audit-preflight.json')
    for (const [name, original] of Object.entries(preflight.evidence)) assert.deepEqual(evidenceBefore[name], original, name)
    if (mode === 'final-r2') {
      const firstFinal = json(self + '-audit-final.json')
      for (const [name, original] of Object.entries(firstFinal.evidence)) assert.deepEqual(evidenceBefore[name], original, name)
    }
  }
  return { unchanged: true, scope: 'listed inputs/config/lib/dependencies/evidence only; no disk-wide assertion',
    evidenceFiles: Object.keys(evidenceBefore).length, productExecutions: 0 }
})
fs.writeFileSync(output, JSON.stringify({ at: new Date().toISOString(), mode, reviewer: 'trae-independent-regression-evidence',
  role: 'Read only; no product build/install/test/verify/Git/browser/service/key; only owned testing prefix writes',
  verdict: errors.length ? 'NOT_SIGNED_READER_FACILITY_ERRORS' : mode === 'preflight'
    ? 'NOT_SIGNED_WAIT_FINAL_INDEX' : 'PASS_LIMITED_COMBINED_REGRESSION_EVIDENCE',
  groups, errors, evidence: evidenceBefore }, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ mode, audit: output, readGroups: Object.keys(groups).length, errors, productExecutions: 0 }))
process.exitCode = errors.length ? 1 : 0

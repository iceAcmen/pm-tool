// Read-only evidence inspection; writes only this review's own prefix.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = path.join(repo, 'docs/testing/a19-full-regression-evidence-review-20261022')
const evidence = path.join(repo, 'reports/all-pending-evidence-20261021/A19')
const json = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const candidate = json(path.join(evidence, 'candidate.json'))
const tree = candidate.tree
const pkg = path.join(tree, 'packages/dsh-pm-tool')
const sourceDirs = [
  'packages/dsh-pm-tool/src', 'packages/dsh-pm-tool/scripts',
  'packages/dsh-pm-tool/locale', 'launcher/src', 'launcher/bin',
  'launcher/test', 'launcher/scripts',
]
const configs = [
  'packages/dsh-pm-tool/package.json', 'packages/dsh-pm-tool/pnpm-lock.yaml',
  'packages/dsh-pm-tool/tsconfig.json', 'packages/dsh-pm-tool/vitest.config.ts',
  'packages/dsh-pm-tool/tsdown.config.ts', 'packages/dsh-pm-tool/cordis.patch.yml',
  'launcher/package.json',
]
const board = 'docs/testing/board-fixture-clarification-20261021-fixture.json'
const depsSource = '/private/tmp/pmtool-a19-owned-deps-20261022/node_modules'
const depsOwned = path.join(pkg, 'node_modules')
const signed = path.join(repo, 'docs/testing/a19-habit-suggestion-okr-independent-retest-20261022.md')
const independent = path.join(repo, 'docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-selftmp/r3')
const authorManifest = path.join(repo, 'reports/a19-habit-suggestion-okr-developer-20261022-evidence/green/manifest.json')
const protectedBefore = json(path.join(evidence, 'build-r2/protected-before.json'))
const depBefore = json(path.join(evidence, 'build-fixture-supplement/dependency-source-before.json'))
const beforePath = `${prefix}-before.json`
const auditPath = `${prefix}-audit.json`
const sealPath = `${prefix}-seal.json`
const text = p => fs.readFileSync(p, 'utf8').replace(/\x1b\[[0-9;]*m/g, '')

function walk(root) {
  if (!fs.existsSync(root)) return []
  const out = []
  function visit(p) {
    const st = fs.lstatSync(p)
    if (st.isDirectory()) {
      for (const n of fs.readdirSync(p).sort()) visit(path.join(p, n))
    } else out.push(p)
  }
  visit(root)
  return out
}
function declared(root) {
  return [...sourceDirs.flatMap(n => walk(path.join(root, n))), ...configs.map(n => path.join(root, n))]
    .map(p => path.relative(root, p)).sort()
}
function metadata(p) {
  if (!fs.existsSync(p)) return { missing: true }
  const s = fs.lstatSync(p, { bigint: true })
  return s.isSymbolicLink()
    ? { link: fs.readlinkSync(p), mtimeNs: String(s.mtimeNs), inode: String(s.ino) }
    : { sha256: hash(p), bytes: String(s.size), mtimeNs: String(s.mtimeNs), inode: String(s.ino) }
}
function protectedFiles() {
  const files = new Set([
    ...Object.keys(candidate.sourceHashes).flatMap(n => [path.join(tree, n), path.join(repo, n)]),
    ...Object.keys(candidate.artifacts).map(n => path.join(tree, n)),
    ...Object.keys(candidate.fixtureInputs).flatMap(n => [path.join(tree, n), path.join(repo, n)]),
    ...Object.values(candidate.inheritedLauncherProbeInputs).map(v => v.origin),
    path.join(repo, board), path.join(tree, board),
    ...Object.keys(protectedBefore),
    ...['build', 'build-r2', 'build-fixture-supplement', 'build-final', 'dependencies']
      .flatMap(n => walk(path.join(evidence, n))),
    ...['candidate.json', 'source-auto-handoff.json', 'product-tracked.patch', 'new-inputs.json']
      .map(n => path.join(evidence, n)),
    signed, authorManifest,
    ...['candidate.json', 'frozen-manifest.json', 'candidate-package-tracked.patch']
      .map(n => path.join(independent, n)),
    '/private/tmp/pmtool-a19-build-20261022.py',
    ...walk(depsSource), ...walk(depsOwned),
  ])
  return [...files].sort()
}
function snapshot() {
  const files = Object.fromEntries(protectedFiles().map(p => [p, metadata(p)]))
  return {
    at: new Date().toISOString(), files,
    mainDeclared: declared(repo), frozenDeclared: declared(tree),
    artifacts: walk(path.join(pkg, 'lib')).map(p => path.relative(tree, p)).sort(),
    boundary: 'Fixed declared source/lib/dependencies and necessary AUTO originals only; excludes live roots, GUI and credentials.',
  }
}
function save(p, value) {
  if (fs.existsSync(p)) throw new Error(`Refuse overwrite ${p}`)
  fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const mode = process.argv[2]
if (mode === 'capture') {
  const s = snapshot()
  save(beforePath, s)
  console.log(JSON.stringify({ mode, at: s.at, protectedPaths: Object.keys(s.files).length }))
} else if (mode === 'audit') {
  if (!fs.existsSync(beforePath)) throw new Error('Capture required')
  const checks = []
  const check = (id, ok, detail) => checks.push({ id, status: ok ? 'PASS' : 'FAIL', detail })
  const mismatch = (root, mapping) => Object.entries(mapping).filter(([n, h]) => !fs.existsSync(path.join(root, n)) || hash(path.join(root, n)) !== h).map(([n]) => n)
  const sameSet = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
  const names = Object.keys(candidate.sourceHashes)
  const mainNames = names.filter(n => !candidate.inheritedLauncherProbeInputs[n])
  check('declared-531', names.length === 531 && sameSet(names, declared(tree)) && !mismatch(tree, candidate.sourceHashes).length,
    { count: names.length, actualScopeCount: declared(tree).length, drift: mismatch(tree, candidate.sourceHashes) })
  const mainMap = Object.fromEntries(mainNames.map(n => [n, candidate.sourceHashes[n]]))
  check('main-526', mainNames.length === 526 && sameSet(mainNames, declared(repo)) && !mismatch(repo, mainMap).length,
    { count: mainNames.length, drift: mismatch(repo, mainMap) })
  const inherited = Object.entries(candidate.inheritedLauncherProbeInputs).map(([n, v]) => ({
    path: n, origin: v.origin, sha256: v.sha256,
    mainMissing: !fs.existsSync(path.join(repo, n)),
    originMatches: fs.existsSync(v.origin) && hash(v.origin) === v.sha256,
    frozenMatches: hash(path.join(tree, n)) === v.sha256,
  }))
  check('inherited-origin-five', inherited.length === 5 && inherited.every(v => v.mainMissing && v.originMatches && v.frozenMatches), inherited)
  const artifacts = Object.keys(candidate.artifacts)
  check('artifacts-453-final', artifacts.length === 453 &&
    sameSet(artifacts, walk(path.join(pkg, 'lib')).map(p => path.relative(tree, p))) &&
    !mismatch(tree, candidate.artifacts).length,
  { count: artifacts.length, drift: mismatch(tree, candidate.artifacts) })
  const gate = json(path.join(evidence, 'source-auto-handoff.json'))
  const habits = 'packages/dsh-pm-tool/src/client/views/habits.tsx'
  const test = 'packages/dsh-pm-tool/src/client/views/habits-suggestion-okr.test.tsx'
  check('signed-handoff-and-two-sources', gate.limitedSourceAuto === 'PASS' &&
    gate.independentReportSHA === hash(signed) &&
    JSON.stringify(gate) === JSON.stringify(candidate.approval) &&
    gate.habitsSourceSHA === candidate.sourceHashes[habits] &&
    gate.authorTestSHA === candidate.sourceHashes[test],
  { reportSHA: hash(signed), habitsSHA: candidate.sourceHashes[habits], testSHA: candidate.sourceHashes[test] })
  const author = json(authorManifest)
  const authorDrift = Object.entries(author).filter(([n, v]) =>
    v.sha256 && (hash(path.join(repo, n)) !== v.sha256 || hash(path.join(tree, n)) !== v.sha256)).map(([n]) => n)
  const ind = json(path.join(independent, 'candidate.json'))
  const indManifest = json(path.join(independent, 'frozen-manifest.json'))
  check('author-and-independent-input-inheritance', !authorDrift.length &&
    hash(path.join(independent, 'frozen-manifest.json')) === ind.frozenManifestSha256,
  { authorInputs: Object.keys(author).length, authorDrift, independentManifestSHA: ind.frozenManifestSha256, independentManifestEntries: Object.keys(indManifest).length })
  check('patch-and-newinputs', hash(path.join(evidence, 'product-tracked.patch')) === candidate.trackedPatchSHA &&
    hash(path.join(evidence, 'new-inputs.json')) === candidate.newInputsSHA &&
    json(path.join(evidence, 'new-inputs.json')).every(v => hash(path.join(repo, v.path)) === v.sha256),
  { patchSHA: candidate.trackedPatchSHA, newInputsSHA: candidate.newInputsSHA, newCount: json(path.join(evidence, 'new-inputs.json')).length })
  const fixtures = Object.entries(candidate.fixtureInputs).map(([n, v]) => ({
    path: n, matches: hash(path.join(repo, n)) === v.sha256 &&
      hash(path.join(tree, n)) === v.copySHA &&
      fs.statSync(path.join(repo, n)).size === v.bytes &&
      Number(fs.statSync(path.join(repo, n), { bigint: true }).mtimeNs) === v.mtimeNs,
  }))
  check('supplement-fixtures-16', fixtures.length === 16 && fixtures.every(v => v.matches), fixtures)
  check('auxiliary-board-fixture-current', hash(path.join(repo, board)) === hash(path.join(tree, board)),
    { path: board, sha256: hash(path.join(repo, board)), declaredInCandidate: !!candidate.fixtureInputs[board] || !!candidate.sourceHashes[board], boundary: 'Current byte agreement only, not a retroactive first-build binding.' })
  const exits = candidate.rows.map(row => {
    const dir = ['pnpm-version', 'noemit', 'build-tsc', 'build-tsdown'].includes(row.label) ? 'build-r2' : 'build-fixture-supplement'
    const raw = json(path.join(evidence, dir, `${row.label}.exit.json`))
    const running = json(path.join(evidence, dir, `${row.label}.running.json`))
    return {
      ...raw, rawMatches: JSON.stringify(raw) === JSON.stringify(row),
      runningMatches: Object.entries(running).every(([k, v]) => JSON.stringify(v) === JSON.stringify(raw[k])),
      stdout: metadata(path.join(evidence, dir, `${row.label}.stdout.txt`)),
      stderr: metadata(path.join(evidence, dir, `${row.label}.stderr.txt`)),
    }
  })
  check('nine-original-exits', exits.length === 9 && exits.every(v => v.exit === 0 && v.rawMatches && v.runningMatches), exits)
  const coverage = text(path.join(evidence, 'build-fixture-supplement/coverage.stdout.txt'))
  const testRows = [...coverage.matchAll(/^\s+[^\s]+\s+(src\/[^\s]+\.test\.tsx?)\s+\((\d+) tests?\)/gm)]
    .map(m => ({ path: m[1], tests: Number(m[2]) }))
  const discovery = walk(path.join(pkg, 'src')).filter(p => /\.test\.tsx?$/.test(p)).map(p => path.relative(pkg, p))
  const sum = testRows.reduce((n, v) => n + v.tests, 0)
  const coverageSummary = json(path.join(pkg, 'coverage/coverage-summary.json'))
  check('coverage-discovery-150-1563', sameSet(testRows.map(v => v.path), discovery) &&
    testRows.length === 150 && sum === 1563 &&
    /Test Files\s+150 passed/.test(coverage) && /Tests\s+1563 passed/.test(coverage),
  { files: testRows.length, tests: sum, discovered: discovery.length, testRows, coverageSummary })
  const guard = text(path.join(evidence, 'build-fixture-supplement/guard.stdout.txt'))
  const expectedGuard = fs.readdirSync(path.join(pkg, 'scripts'))
    .filter(n => n.startsWith('verify-') && n.endsWith('.mjs') && !['verify-isolation.mjs', 'verify-real-model.mjs'].includes(n))
    .sort().map(n => `scripts/${n}`)
  const actualGuard = [...guard.matchAll(/^\[guard\] >> (.+)$/gm)].map(m => m[1])
  const guardExits = [...guard.matchAll(/^\[guard\]\s+ok\s+(scripts\/\S+)\s+\(退出码=(\d+)/gm)].map(m => ({ path: m[1], exit: Number(m[2]) }))
  check('guard-95-and-five-sentinels', sameSet(expectedGuard, actualGuard) &&
    expectedGuard.length === 95 && sameSet(expectedGuard, guardExits.map(v => v.path)) &&
    guardExits.every(v => v.exit === 0) && /资产：before=5 after=5，污染 0/.test(guard),
  { discovered: expectedGuard, actual: actualGuard, guardExits, sentinelBoundary: 'Five missing-root markers in r2, not five real main files.' })
  const selftest = text(path.join(evidence, 'build-fixture-supplement/guard-selftest.stdout.txt'))
  check('guard-selftest', selftest.includes('fixture 已清理：PASS') && [0, 1, 2, 3, 4, 5, 6].every(n => selftest.includes(`${n})`)), { stdoutSHA: hash(path.join(evidence, 'build-fixture-supplement/guard-selftest.stdout.txt')) })
  const launcher = json(path.join(tree, 'launcher/package.json'))
  const entries = launcher.scripts.test.split(/\s+/).slice(2)
  const require = createRequire(import.meta.url)
  const ts = require(path.join(depsOwned, 'typescript/lib/typescript.js'))
  const graph = {}
  function parseImports(p) {
    if (graph[p]) return
    const source = ts.createSourceFile(p, fs.readFileSync(p, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
    const specs = []
    const tests = []
    function visit(n) {
      if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) specs.push(n.moduleSpecifier.text)
      if (ts.isCallExpression(n)) {
        if ((n.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(n.expression) && n.expression.text === 'require') && n.arguments[0] && ts.isStringLiteral(n.arguments[0])) specs.push(n.arguments[0].text)
        if (ts.isIdentifier(n.expression) && n.expression.text === 'test' && n.arguments[0] && ts.isStringLiteral(n.arguments[0])) tests.push(n.arguments[0].text)
      }
      ts.forEachChild(n, visit)
    }
    visit(source)
    graph[p] = { specs, literalTestTitles: tests }
    for (const spec of specs) if (spec.startsWith('.')) {
      const resolved = path.resolve(path.dirname(p), spec)
      if (fs.existsSync(resolved) && fs.statSync(resolved).isFile() && resolved.endsWith('.mjs')) parseImports(resolved)
    }
  }
  for (const n of entries) parseImports(path.join(tree, 'launcher', n))
  const tap = text(path.join(evidence, 'build-fixture-supplement/launcher-test.stdout.txt'))
  const tapTitles = [...tap.matchAll(/^ok \d+ - (.+)$/gm)].map(m => m[1])
  const reachedOld = inherited.filter(v => graph[path.join(tree, v.path)]).map(v => v.path)
  check('launcher-current-56', entries.length === 9 && tapTitles.length === 56 &&
    /^# pass 56$/m.test(tap) && /^# fail 0$/m.test(tap) && /^# skipped 0$/m.test(tap),
  { script: launcher.scripts.test, entries, tapTitles, graph })
  check('claim-old-probes-executed-in-current-56', reachedOld.length === 5,
    { reachedOld, actualCount: reachedOld.length, declaredOldCount: inherited.length, boundary: 'Counter-evidence to candidate inherited reason. Files are preserved, not invoked by the explicit nine-file script.' })
  check('launcher-verify', text(path.join(evidence, 'build-fixture-supplement/launcher-verify.stdout.txt')).includes('verify-launcher: PASS'), { script: launcher.scripts.verify })
  const cssPaths = [path.join(pkg, 'src/client/panel.css'),
    ...walk(path.join(pkg, 'src/client/views')).filter(p => path.dirname(p) === path.join(pkg, 'src/client/views') && p.endsWith('.css')),
    ...walk(path.join(pkg, 'src/client/board')).filter(p => path.dirname(p) === path.join(pkg, 'src/client/board') && p.endsWith('.css'))]
  check('css-recipe-13', cssPaths.length === 13 && cssPaths.every(p => hash(p) === hash(path.join(pkg, 'lib', path.relative(path.join(pkg, 'src'), p)))),
    { count: cssPaths.length, paths: cssPaths.map(p => path.relative(pkg, p)), packageBuild: json(path.join(pkg, 'package.json')).scripts.build })
  const historicalDrift = Object.entries(protectedBefore).filter(([p, v]) => !fs.existsSync(p) || hash(p) !== v.sha256 || Number(fs.statSync(p, { bigint: true }).mtimeNs) !== v.mtimeNs).map(([p]) => p)
  check('original-lib-protection', !historicalDrift.length, { count: Object.keys(protectedBefore).length, drift: historicalDrift })
  const depDrift = Object.entries(depBefore).filter(([n, v]) => hash(path.join(depsSource, n)) !== v.sha256 || Number(fs.statSync(path.join(depsSource, n), { bigint: true }).mtimeNs) !== v.mtimeNs).map(([n]) => n)
  const links = walk(depsOwned).filter(p => fs.lstatSync(p).isSymbolicLink())
  const files = walk(depsOwned).filter(p => fs.lstatSync(p).isFile())
  const external = links.filter(p => !fs.realpathSync(p).startsWith(`${depsOwned}/`))
  const shared = files.filter(p => fs.statSync(p).ino === fs.statSync(path.join(depsSource, path.relative(depsOwned, p))).ino)
  const copyDrift = files.filter(p => hash(p) !== hash(path.join(depsSource, path.relative(depsOwned, p))))
  check('dependency-supplement-and-current-closure', !depDrift.length && !external.length && !shared.length && !copyDrift.length && files.length === 13613 && links.length === 1030,
    { beforeCount: Object.keys(depBefore).length, sourceDrift: depDrift, files: files.length, links: links.length, external, shared, copyDrift, boundary: 'Original source before starts supplement; current copy check is review-time only.' })
  const firstExit = json(path.join(evidence, 'build-r2/coverage.exit.json'))
  const first = text(path.join(evidence, 'build-r2/coverage.stdout.txt'))
  const firstErr = text(path.join(evidence, 'build-r2/coverage.stderr.txt'))
  check('original-coverage-failure-preserved', firstExit.exit === 1 &&
    /28 failed/.test(first) && /1503 passed/.test(first) && /Failed Suites 3/.test(firstErr),
  { originalExit: firstExit.exit, pid: firstExit.pid, summary: first.split('\n').filter(l => /Test Files|Tests\s/.test(l)), suitesLoadingFailure: 3 })
  const prep = json(path.join(evidence, 'build/preparation-interrupted.json'))
  check('interrupted-preparation-not-build', prep.pid === 84211 && prep.buildStarted === false &&
    prep.retained && fs.existsSync(prep.partialTree) && !fs.existsSync(path.join(prep.partialTree, 'packages/dsh-pm-tool/lib')),
  { ...prep, boundary: 'Action record, not a captured parent wait status or signal receipt.' })
  save(auditPath, {
    at: new Date().toISOString(), mode, candidateSHA: hash(path.join(evidence, 'candidate.json')),
    checks, notCaptured: [
      'First-build persisted dependency-before and owned-copy before/after manifest',
      'Pre/post-build artifact byte manifest; candidate is final-only',
      'Preparation/build/supplement/finalizer parent tool exit/signal raw receipts in this A19 archive',
      'Original finalization failure stdout/stderr/exit receipt; failing main-only source flow is preserved in fixture-regression script',
      'Initial board fixture SHA binding in candidate',
      'Raw guard before/after root manifest serialization; aggregate output only',
    ],
    boundary: 'Evidence audit only. No product/build/test/GUI/service execution.',
  })
  console.log(JSON.stringify({ mode, checks: checks.length, failures: checks.filter(v => v.status === 'FAIL').map(v => v.id), candidateSHA: hash(path.join(evidence, 'candidate.json')) }))
} else if (mode === 'supplement') {
  const { spawnSync } = await import('node:child_process')
  const patch = spawnSync('/usr/bin/git', ['diff', '--binary', '--', 'packages/dsh-pm-tool', 'launcher'], { cwd: repo, maxBuffer: 16 * 1024 * 1024 })
  const actualPatchSHA = crypto.createHash('sha256').update(patch.stdout).digest('hex')
  const manifest = json(path.join(independent, 'frozen-manifest.json'))
  const common = Object.keys(manifest).filter(n => candidate.sourceHashes[n])
  const drift = common.filter(n => candidate.sourceHashes[n] !== manifest[n].sha256)
  const extra = Object.keys(manifest).filter(n => !candidate.sourceHashes[n]).map(n => ({
    path: n, signedSHA: manifest[n].sha256,
    frozenPresent: fs.existsSync(path.join(tree, n)),
    frozenMatches: fs.existsSync(path.join(tree, n)) && hash(path.join(tree, n)) === manifest[n].sha256,
  }))
  const value = {
    at: new Date().toISOString(),
    command: ['/usr/bin/git', 'diff', '--binary', '--', 'packages/dsh-pm-tool', 'launcher'],
    cwd: repo, originalExit: patch.status, signal: patch.signal,
    actualPatchSHA, declaredPatchSHA: candidate.trackedPatchSHA,
    matches: actualPatchSHA === candidate.trackedPatchSHA,
    independentCommonInputs: common.length, drift, extra,
    boundary: 'Read-only patch/input comparison, not product tests or new binding of historical missing evidence.',
  }
  save(`${prefix}-supplement.json`, value)
  console.log(JSON.stringify({ mode, patchExit: patch.status, matches: value.matches, commonInputs: common.length, drift }))
  if (patch.status !== 0 || !value.matches || drift.length) process.exitCode = 1
} else if (mode === 'seal') {
  const before = json(beforePath)
  const after = snapshot()
  const drift = [...new Set([...Object.keys(before.files), ...Object.keys(after.files)])]
    .filter(p => JSON.stringify(before.files[p]) !== JSON.stringify(after.files[p]))
  const inventoryDrift = ['mainDeclared', 'frozenDeclared', 'artifacts']
    .filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
  const reportPath = `${prefix}.md`
  save(sealPath, {
    at: after.at, beforeAt: before.at, protectedPaths: Object.keys(before.files).length,
    drift, inventoryDrift, reportSHA: hash(reportPath), auditSHA: hash(auditPath),
    released: true, boundary: 'No owned product/test/build/service process was started; preserves evidence and live Main work.',
  })
  console.log(JSON.stringify({ mode, drift: drift.length, inventoryDrift, reportSHA: hash(reportPath), released: true }))
  if (drift.length || inventoryDrift.length) process.exitCode = 1
} else throw new Error('Expected capture, audit, supplement or seal')

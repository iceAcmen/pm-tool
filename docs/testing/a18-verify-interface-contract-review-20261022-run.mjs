import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a18-verify-interface-contract-review-20261022'
const testing = join(repo, 'docs/testing'), base = join(testing, `${prefix}-selftmp`)
const round = process.argv[3] ?? 'r3'
assert.match(round, /^r[1-9]\d*$/)
const out = join(base, round), frozen = join(out, 'frozen'), pkg = 'packages/dsh-pm-tool'
const previous = 'a18-feedback-context-independent-retest-20261022'
const developer = join(repo, 'reports/a18-feedback-error-context-developer-20261022-selftmp')
const mainRecord = join(repo, 'reports/all-pending-evidence-20261021/A18/candidate.json')
const main = JSON.parse(readFileSync(mainRecord, 'utf8'))
const deps = realpathSync(join(main.tree, pkg, 'node_modules'))
const inputs = ['src', 'scripts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
const scripts = ['verify-gantt-drag', 'verify-ui-feedback']
const oldLines = [
  "assert.match(runBlock, /catch \\(error\\)[\\s\\S]*setMessage\\(error/,\n  'run catch 必须仍 setMessage——quiet 不得吞掉全局错误提示')",
  "assert.match(panelSrc, /classifyFeedback\\(message\\)/, 'Notice 须经 classifyFeedback 分型，不整体平铺')",
]
const newLines = [
  "verifyCatchFeedback(panel, join(here, '..'))",
  "verifyNoticeContext(panelSrc, join(here, '..'))",
]
const helperName = 'feedback-context-contract.mjs'
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(p) {
    const s = lstatSync(p), key = relative(root, p) || '.'
    if (s.isSymbolicLink()) result[key] = { link: readlinkSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else result[key] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(root)
  return result
}
const content = m => Object.fromEntries(Object.entries(m).map(([k, v]) =>
  [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
function save(n, value, target = out) {
  const p = resolve(target, n)
  assert(p.startsWith(`${base}/`), 'only own evidence writes')
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`, HOME: join(out, 'home'),
  TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'), DSH_HOME: join(out, 'runtime'),
  LANG: 'zh_CN.UTF-8', TZ: 'UTC', CI: 'true', NODE_DISABLE_COMPILE_CACHE: '1',
}
const commands = []
function command(id, argv, cwd = frozen, extra = {}) {
  const e = { ...env, ...extra }, start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd, env: e, encoding: 'utf8',
    timeout: 240000, maxBuffer: 128 * 1024 * 1024 })
  const c = { id, argv, cwd, env: e, start, end: new Date().toISOString(),
    pid: r.pid, exit: r.status, signal: r.signal, error: r.error?.message ?? null }
  save(`${id}.stdout.log`, r.stdout ?? '')
  save(`${id}.stderr.log`, r.stderr ?? '')
  save(`${id}.command.json`, c)
  commands.push(c)
  console.log(JSON.stringify({ id, exit: r.status, signal: r.signal }))
  return r
}
const source = root => Object.fromEntries(inputs.map(n => [n, inventory(join(root, pkg, n))]))
function copyTree(target) {
  for (const n of inputs) cpSync(join(frozen, pkg, n), join(target, pkg, n), { recursive: true, preserveTimestamps: true })
  for (const n of ['node_modules', 'lib'])
    symlinkSync(n === 'node_modules' ? deps : join(frozen, pkg, 'lib'), join(target, pkg, n), 'dir')
  symlinkSync(deps, join(target, 'node_modules'), 'dir')
  cpSync(join(frozen, 'docs/testing'), join(target, 'docs/testing'), { recursive: true, preserveTimestamps: true })
}
function test(id, tree, files, pattern) {
  const config = join(out, `${id}.config.mjs`)
  save(`${id}.config.mjs`, `export default ${JSON.stringify({
    root: tree, cacheDir: join(out, 'cache', id), test: { environment: 'node', cache: false,
      include: ['docs/testing/*.test.tsx', `${pkg}/src/**/*.test.ts`, `${pkg}/src/**/*.test.tsx`],
      pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000 },
  }, null, 2)}\n`)
  return command(id, [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', ...files,
    '--config', config, '--no-cache', '--reporter=verbose', '--reporter=json',
    '--outputFile', join(out, `${id}.result.json`), ...(pattern ? ['--testNamePattern', pattern] : [])], tree,
  { TF_OBSERVATIONS: join(out, `${id}.observations.jsonl`) })
}
function protections() {
  const before = read(join(out, 'protected-before.json'))
  const after = Object.fromEntries(Object.keys(before).map(p => [p, inventory(p)]))
  return { after, drift: Object.fromEntries(Object.keys(before)
    .map(p => [p, diff(before[p], after[p])]).filter(([, d]) => d.length)) }
}
function checkFrozen() {
  const manifest = read(join(out, 'frozen-inputs.json')), result = {}
  for (const n of inputs) {
    const now = inventory(join(frozen, pkg, n))
    // Added adapter/helper are owned artifacts, never replacement of frozen originals.
    if (n === 'scripts') for (const k of Object.keys(now))
      if (k === helperName || scripts.some(s => k === `${s}.adapter.mjs`)) delete now[k]
    const d = diff(manifest[n], now)
    if (d.length) result[n] = d
  }
  return result
}
const stage = process.argv[2]
assert(['freeze', 'original', 'adapted', 'final'].includes(stage))
if (stage === 'freeze') {
  assert(!existsSync(out), 'never overwrite a round or failure')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n), { mode: 0o700 })
  const roots = [...new Set([
    ...inputs.map(n => join(repo, pkg, n)), join(repo, pkg, 'lib'), deps,
    realpathSync(join(repo, pkg, 'node_modules')),
    ...inputs.map(n => join(main.tree, pkg, n)), join(main.tree, pkg, 'lib'),
    mainRecord, join(repo, 'reports/all-pending-evidence-20261021/A18/full-verify'),
    ...readdirSync(testing).filter(n => n.startsWith(previous)).map(n => join(testing, n)),
    ...readdirSync(join(repo, 'reports')).filter(n => n.startsWith('a18-feedback-error-context-developer-20261022'))
      .map(n => join(repo, 'reports', n)),
    ...Object.keys(read(join(testing, `${previous}-selftmp/r3/protected-before.json`))).filter(p => /cache/.test(p)),
    ...Object.keys(main.sourceHashes).filter(n => n.startsWith('launcher/')).map(n => join(main.tree, n)),
  ])].sort()
  save('protected-before.json', Object.fromEntries(roots.map(p => [p, inventory(p)])))
  if (round !== 'r1') {
    const priorFinal = read(join(base, 'final-r1/own-output-inventory.json'))
    assert.deepEqual(inventory(join(base, 'r1')), priorFinal)
    save('prior-round-sealed.json', { round: 'r1', unchanged: true, originalHelperDiscoveryIssue: true })
  }
  const current = source(repo), old = read(join(developer, 'after-r2/source-at-freeze.json'))
  const productSame = diff(content(current.src), content(old.src))
  assert.deepEqual(productSame, [])
  save('source-at-freeze.json', current)
  const mainDrift = Object.entries({ ...main.sourceHashes, ...main.artifacts }).filter(([p, h]) =>
    !existsSync(join(main.tree, p)) || sha(readFileSync(join(main.tree, p))) !== h).map(([p]) => p)
  save('main-claim-drift.json', mainDrift)
  assert.deepEqual(mainDrift, [])
  for (const n of inputs) cpSync(join(repo, pkg, n), join(frozen, pkg, n), { recursive: true, preserveTimestamps: true })
  cpSync(join(main.tree, pkg, 'lib'), join(frozen, pkg, 'lib'), { recursive: true, preserveTimestamps: true })
  save('frozen-inputs.json', source(frozen))
  save('frozen-lib.json', inventory(join(frozen, pkg, 'lib')))
  for (const n of [`${prefix}-cases.test.tsx`, `${previous}-cases.test.tsx`, 'board-fixture-clarification-20261021-fixture.json'])
    cpSync(join(testing, n), join(frozen, 'docs/testing', n), { preserveTimestamps: true })
  save('copied-tests.json', inventory(join(frozen, 'docs/testing')))
  symlinkSync(deps, join(frozen, pkg, 'node_modules'), 'dir')
  symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  for (const [id, args] of [
    ['head', ['rev-parse', 'HEAD']], ['origin', ['rev-parse', 'origin/main']],
    ['tracked-patch', ['diff', '--binary', 'HEAD', '--', pkg]],
    ['new-inputs', ['ls-files', '--others', '--exclude-standard', '--', ...inputs.map(n => `${pkg}/${n}`)]],
  ]) assert.equal(command(id, ['/usr/bin/git', ...args], repo, { GIT_OPTIONAL_LOCKS: '0' }).status, 0)
  const paths = readFileSync(join(out, 'new-inputs.stdout.log'), 'utf8').trim().split('\n').filter(Boolean)
  save('new-input-manifest.json', paths.map(p => ({ path: p, ...inventory(join(repo, p))['.'] })))
  const allowed = ['client/panel.tsx', 'client/result-card.tsx', 'core/ui-feedback.ts',
    'client/panel-transport-error-feedback.test.tsx', 'client/result-card.test.ts', 'core/ui-feedback.test.ts'].sort()
  const early = read(join(developer, 'before-r1/source-at-freeze.json'))
  assert.deepEqual(diff(content(early.src), content(current.src)), allowed)
  for (const n of allowed) assert.equal(command(`delta-${n.replaceAll('/', '_')}`, ['/usr/bin/diff', '-u',
    join(developer, 'before-r1/frozen', pkg, 'src', n), join(frozen, pkg, 'src', n)], repo).status, 1)
  const mainSourceDrift = []
  for (const n of inputs) {
    const d = diff(content(current[n]), content(inventory(join(main.tree, pkg, n))))
    if (d.length) mainSourceDrift.push({ input: n, paths: d })
  }
  save('candidate.json', {
    baseline: readFileSync(join(out, 'head.stdout.log'), 'utf8').trim(), mainTree: main.tree, frozen,
    sourceCount: Object.keys(current.src).length, completeInputs: inputs, approvedDelta: allowed,
    mainSourceDrift, mainClaimDrift: mainDrift, productEqualsPrevious: true,
    node: process.version, os: os.release(), arch: os.arch(), dependencies: deps,
    manifestSha256: sha(readFileSync(join(out, 'frozen-inputs.json'))),
    patchSha256: sha(readFileSync(join(out, 'tracked-patch.stdout.log'))),
    newInputsSha256: sha(readFileSync(join(out, 'new-input-manifest.json'))),
    protectedRoots: roots.length, artifacts: Object.keys(main.artifacts).length,
    sharedLibWritten: false, gui: false, mainNewGuiSelfRuntimeExcluded: true,
  })
  save('freeze-commands.json', commands)
  assert.deepEqual(mainSourceDrift, [])
  console.log('freeze complete; current inputs fully equal Main A18 including packageManager pin')
} else if (stage === 'original') {
  assert.deepEqual(protections().drift, {})
  assert.deepEqual(checkFrozen(), {})
  for (const name of scripts) {
    const r = command(`original-${name}`, [process.execPath, join(frozen, pkg, 'scripts', `${name}.mjs`)], join(frozen, pkg))
    assert.equal(r.status, 1)
    assert(r.stderr.includes('AssertionError'))
    assert(r.stderr.includes(name === scripts[0] ? ':105:' : ':234:'))
  }
  save('original-commands.json', commands)
  save('original-verdict.json', { verdict: 'FAIL preserved', scripts: commands })
} else if (stage === 'adapted') {
  assert(existsSync(join(out, 'original-verdict.json')), 'original red must run first')
  assert.deepEqual(protections().drift, {})
  cpSync(join(testing, `${prefix}-helper.mjs`), join(frozen, pkg, 'scripts', helperName))
  for (const [i, name] of scripts.entries()) {
    const path = join(frozen, pkg, 'scripts', `${name}.mjs`), original = readFileSync(path, 'utf8')
    assert.equal(original.split(oldLines[i]).length, 2)
    const importLine = `import { ${i === 0 ? 'verifyCatchFeedback' : 'verifyNoticeContext'} } from './${helperName}'\n`
    const replacement = original.replace("import assert from 'node:assert/strict'\n",
      `import assert from 'node:assert/strict'\n${importLine}`).replace(oldLines[i], newLines[i])
    assert.equal(replacement.replace(importLine, '').replace(newLines[i], oldLines[i]), original)
    save(`${name}.adapter.mjs`, replacement, join(frozen, pkg, 'scripts'))
    // Report the exact proposed main patch with normal filenames.
    const r = command(`adapter-diff-${name}`, ['/usr/bin/diff', '-u', '--label', `a/${pkg}/scripts/${name}.mjs`,
      path, '--label', `b/${pkg}/scripts/${name}.mjs`, join(frozen, pkg, 'scripts', `${name}.adapter.mjs`)], repo)
    assert.equal(r.status, 1)
    save(`${name}-adapter-contract.json`, { originalSha256: sha(original), adaptedSha256: sha(replacement),
      importLine, oldLine: oldLines[i], newLine: newLines[i], allOtherBytesIdentical: true })
    assert.equal(command(`adapted-${name}`, [process.execPath,
      join(frozen, pkg, 'scripts', `${name}.adapter.mjs`)], join(frozen, pkg)).status, 0)
  }
  const discovered = files => files.filter(n => n.startsWith('verify-') && n.endsWith('.mjs') &&
    n !== 'verify-isolation.mjs' && n !== 'verify-real-model.mjs').sort()
  const originalTargets = discovered(Object.keys(read(join(out, 'frozen-inputs.json')).scripts))
  const proposedTargets = discovered([...Object.keys(read(join(out, 'frozen-inputs.json')).scripts), helperName])
  assert.deepEqual(proposedTargets, originalTargets)
  assert.equal(originalTargets.length, 95)
  save('proposed-discovery.json', { originalTargets, proposedTargets, helperNotDiscoverable: true,
    adapterFilenamesAreOwnOnly: true, mainScriptFilenamesUnchanged: true })
  const panelPath = join(frozen, pkg, 'src/client/panel.tsx'), panel = readFileSync(panelPath, 'utf8')
  const catchLine = "setMessage(prefixFeedbackOnce('执行失败', error), { kind: 'error' })"
  assert.equal(panel.split(catchLine).length, 2)
  const mutants = [
    { id: 'historical-a17', historical: true, dynamic: true },
    { id: 'old-broken', old: catchLine, next: "setMessage(prefixFeedbackOnce('执行失败', error))", dynamic: true },
    { id: 'quiet-swallowed', old: catchLine, next: `if (!options?.quiet) ${catchLine}`, dynamic: true },
    { id: 'reason-lost', old: catchLine, next: "setMessage(prefixFeedbackOnce('执行失败', 'truncated'), { kind: 'error' })", dynamic: true },
    { id: 'notice-context-missing', old: 'const fb = classifyFeedback(message, context)', next: 'const fb = classifyFeedback(message)', dynamic: true },
    { id: 'card-context-missing', file: 'client/result-card.tsx', old: 'const fb = classifyFeedback(message, context)',
      next: 'const fb = classifyFeedback(message)', dynamic: true },
    { id: 'card-disconnected', old: 'context={feedbackContext}', next: 'context={undefined}' },
    { id: 'context-state-lost', old: 'message: next, context, generation:', next: 'message: next, context: undefined, generation:' },
  ]
  const result = []
  for (const mutation of mutants) {
    const tree = join(out, 'mutants', mutation.id)
    copyTree(tree)
    const file = mutation.file ?? 'client/panel.tsx', path = join(tree, pkg, 'src', file)
    const original = readFileSync(path, 'utf8')
    let mutated
    if (mutation.historical) {
      for (const name of ['client/panel.tsx', 'client/result-card.tsx', 'core/ui-feedback.ts']) {
        cpSync(join(developer, 'before-r1/frozen', pkg, 'src', name), join(tree, pkg, 'src', name), { preserveTimestamps: true })
        assert.equal(command(`historical-diff-${name.replaceAll('/', '_')}`, ['/usr/bin/diff', '-u',
          join(frozen, pkg, 'src', name), join(tree, pkg, 'src', name)], repo).status, 1)
      }
      mutated = readFileSync(path, 'utf8')
    } else {
      assert(original.includes(mutation.old))
      mutated = original.replace(mutation.old, mutation.next)
      // Mechanical single-site counterexample on an owned copy, never live product.
      writeFileSync(path, mutated)
    }
    const d = command(`mutant-diff-${mutation.id}`, ['/usr/bin/diff', '-u', join(frozen, pkg, 'src', file), path], repo)
    assert.equal(d.status, 1)
    const record = { ...mutation, tree, originalSha256: sha(original), mutantSha256: sha(mutated), static: [], dynamic: null }
    for (const name of scripts) {
      const id = `mutant-${mutation.id}-${name}`
      const r = command(id, [process.execPath, join(tree, pkg, 'scripts', `${name}.adapter.mjs`)], join(tree, pkg))
      record.static.push({ id, exit: r.status })
      if (name === scripts[0] && !['notice-context-missing', 'card-context-missing'].includes(mutation.id))
        assert.equal(r.status, 1, 'catch adapter must reject broken catch/state/wiring')
      if (name === scripts[1] && ['historical-a17', 'notice-context-missing', 'card-context-missing', 'card-disconnected', 'context-state-lost'].includes(mutation.id))
        assert.equal(r.status, 1, 'Notice adapter must reject missing actual context')
    }
    if (mutation.dynamic) {
      const id = `mutant-${mutation.id}-real-panel`
      const r = test(id, tree, [`docs/testing/${prefix}-cases.test.tsx`], '^IV-01 ')
      const report = read(join(out, `${id}.result.json`))
      assert.equal(r.status, 1)
      assert(report.numFailedTests > 0)
      assert.equal(report.numTotalTests, 6)
      assert(report.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'failed')
        .every(t => t.fullName.startsWith('IV-01 ')), 'must be behavior failures, not import failure')
      record.dynamic = { id, exit: r.status, passed: report.numPassedTests, failed: report.numFailedTests, pending: report.numPendingTests }
    }
    result.push(record)
  }
  save('counterexamples.json', result)
  for (const [id, files, passed] of [
    ['real-panel6', [`docs/testing/${prefix}-cases.test.tsx`], 6],
    ['previous-independent16', [`docs/testing/${previous}-cases.test.tsx`], 16],
    ['same-area62', ['client/panel-transport-error-feedback.test.tsx', 'client/result-card.test.ts', 'core/ui-feedback.test.ts']
      .map(n => `${pkg}/src/${n}`), 62],
  ]) {
    assert.equal(test(id, frozen, files).status, 0)
    const r = read(join(out, `${id}.result.json`))
    assert.equal(r.numPassedTests, passed); assert.equal(r.numFailedTests, 0)
    assert.equal(r.numPendingTests, 0)
  }
  save('adapted-commands.json', commands)
  save('summary.json', { original: 'FAIL preserved', adaptedTwo: 'PASS', realPanel: 6, previousIndependent: 16,
    sameArea: 62, counterexamples: result, whole95Rerun: false, guiSigned: false, wholeGateSigned: false })
} else {
  const final = join(base, `final-${round}`)
  assert(!existsSync(final))
  const { after, drift } = protections()
  save('protected-after.json', after, final)
  const frozenDrift = checkFrozen()
  const frozenLibDrift = diff(read(join(out, 'frozen-lib.json')), inventory(join(frozen, pkg, 'lib')))
  const testsDrift = diff(read(join(out, 'copied-tests.json')), inventory(join(frozen, 'docs/testing')))
  const cs = [...read(join(out, 'freeze-commands.json')), ...read(join(out, 'original-commands.json')), ...read(join(out, 'adapted-commands.json'))]
  const pids = [...new Set(cs.map(c => c.pid).filter(Boolean))]
  const ps = command('process-check', ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command='], repo)
  const noRecordedChildren = ps.status === 1 && !ps.stdout.trim()
  const ok = !Object.keys(drift).length && !Object.keys(frozenDrift).length && !frozenLibDrift.length && !testsDrift.length
  save('final.json', { protectedDrift: drift, frozenDrift, frozenLibDrift, testsDrift,
    protectionOk: ok, noRecordedChildren, released: ok && noRecordedChildren, wholeGateSigned: false,
    full95: 'NOT_RUN here; Main original 93/95 FAIL preserved', gui: 'NOT_RUN / not signed',
    build: false, install: false, services: false, commit: false, mainNewGuiSelfRuntimeExcluded: true }, final)
  save('commands.json', cs, final)
  save('own-output-inventory.json', inventory(out), final)
  console.log(JSON.stringify({ protectionOk: ok, drift, frozenDrift, frozenLibDrift, testsDrift, noRecordedChildren, released: ok && noRecordedChildren }))
  assert(ok && noRecordedChildren)
}

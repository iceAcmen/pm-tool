import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  existsSync, lstatSync, readFileSync, readdirSync, readlinkSync,
  realpathSync, writeFileSync,
} from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'

// File-only auditor: no product imports, child processes, network or credentials.
const MAIN = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const PREFIX = join(MAIN, 'docs/testing/a18-interface-full-regression-review-20261022')
const A18 = join(MAIN, 'reports/all-pending-evidence-20261021/A18')
const RUN = join(A18, 'interface-regression')
const OLD = '/private/tmp/pmtool-a18-closure-20261022'
const OUT = '/private/tmp/pmtool-a18-interface-output-20261022'
const PKG = 'packages/dsh-pm-tool'
const IV = join(MAIN, 'docs/testing/a18-verify-interface-contract-review-20261022-selftmp')
const CT = join(MAIN, 'docs/testing/a18-feedback-context-independent-retest-20261022-selftmp/r3')
const DEP = join(MAIN, 'reports/all-pending-evidence-20261021/A19/dependencies')
const ARCHIVE = '/private/tmp/pmtool-a18-interface-regression-20261022.py'
const NODE = '/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const PNPM = '/Users/bytedance/.cache/node/corepack/v1/pnpm/11.28.5/bin/pnpm.mjs'
const HELPER = '27b834a2786ea6b71615bf6d24dc67888f79321b4bb10160a392e97f225d4e03'
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const text = p => readFileSync(p, 'utf8')
const digest = b => createHash('sha256').update(b).digest('hex')
const hash = p => digest(readFileSync(p))
const now = () => new Date().toISOString()
function save(suffix, value) {
  const p = PREFIX + suffix
  assert(!existsSync(p), `refuse overwrite: ${p}`)
  writeFileSync(p, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function stamp(p) {
  const s = lstatSync(p, { bigint: true })
  const base = { bytes: Number(s.size), mtimeNs: String(s.mtimeNs), inode: String(s.ino), dev: String(s.dev) }
  if (s.isSymbolicLink()) return { ...base, kind: 'link', target: readlinkSync(p) }
  assert(s.isFile(), `not ordinary file: ${p}`)
  return { ...base, kind: 'file', sha256: hash(p) }
}
const forbiddenDirs = new Set([
  '.git', 'private-home', 'private-cache', 'private-tmp', 'private-tmpdir',
  'private-xdg_cache_home', 'home', 'cache', 'tmp', 'runtime',
])
function snapshot(roots, fullDependencies = false) {
  const entries = {}, excluded = []
  function walk(p) {
    if (!existsSync(p)) {
      try { entries[p] = stamp(p) } catch (e) {
        if (e.code !== 'ENOENT') throw e
        entries[p] = { kind: 'missing' }
      }
      return
    }
    const s = lstatSync(p)
    if (!s.isDirectory()) { entries[p] = stamp(p); return }
    for (const name of readdirSync(p).sort()) {
      const full = join(p, name)
      if (!fullDependencies && forbiddenDirs.has(name)) { excluded.push(full); continue }
      walk(full)
    }
  }
  for (const p of roots) walk(p)
  return { at: now(), roots, entries, excluded }
}
function changes(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
    .filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .map(path => ({ path, before: before[path], after: after[path] }))
}
function roots() {
  const proof = json(join(DEP, 'proof.json'))
  const fixed = [
    OLD, OUT, proof.source, proof.target, DEP, ARCHIVE,
    join(MAIN, 'AGENTS.md'), join(MAIN, 'docs/collaboration.md'),
    join(A18, 'candidate.json'), join(A18, 'product-tracked.patch'),
    join(A18, 'build'), join(A18, 'build-pinned11'), join(A18, 'full-verify'), RUN,
    join(MAIN, 'reports/a19-shared-bin-drift-diagnosis-20261022.md'),
    join(IV, 'final-r3'), join(IV, 'review-r3'),
  ]
  // Only fixed files actually used here; concurrent GUI evidence is not frozen.
  for (const name of readdirSync(join(IV, 'r3')).sort()) {
    const p = join(IV, 'r3', name)
    if (lstatSync(p).isFile()) fixed.push(p)
  }
  for (const name of [
    'a18-verify-interface-contract-review-20261022.md',
    'a18-verify-interface-contract-review-20261022-helper.mjs',
    'a18-feedback-context-independent-retest-20261022.md',
    'a18-import-feedback-gui-review-20261022.md',
    'a18-feedback-controls-gui-review-20261022-plan.md',
  ]) fixed.push(join(MAIN, 'docs/testing', name))
  for (const name of [
    'original-counterexamples20.result.json', 'original-counterexamples20.command.json',
    'original-counterexamples20.stderr.log', 'original-counterexamples20.stdout.log',
  ]) fixed.push(join(CT, name))
  return fixed
}
function discover(root) {
  return readdirSync(join(root, PKG, 'scripts'))
    .filter(n => n.startsWith('verify-') && n.endsWith('.mjs'))
    .filter(n => !['verify-isolation.mjs', 'verify-real-model.mjs'].includes(n))
    .sort().map(n => 'scripts/' + n)
}
function parseGuard(p) {
  const s = text(p)
  const starts = [...s.matchAll(/^\[guard\] >> (scripts\/verify-[^\n]+\.mjs)$/gm)]
  const results = [...s.matchAll(/^\[guard\]\s+(ok|FAIL)\s+(scripts\/verify-[^\n]+\.mjs) \(退出码=(\d+)（(\d+)ms）\)$/gm)]
  assert.equal(starts.length, 95)
  assert.equal(results.length, 95)
  const summary = s.match(/\[guard\] 脚本：共 (\d+)，通过 (\d+)，失败 (\d+)/)
  const assets = s.match(/\[guard\] 资产：before=(\d+) after=(\d+)，污染 (\d+)/)
  assert(summary && assets)
  const rows = starts.map((m, i) => {
    const r = results[i]
    assert.equal(r[2], m[1])
    assert(r.index > m.index && (i === 94 || r.index < starts[i + 1].index))
    const stdout = s.slice(m.index + m[0].length + 1, r.index)
    if (Number(r[3]) === 0) assert(stdout.trim().length > 0, `missing output for ${m[1]}`)
    return { name: m[1], exit: Number(r[3]), outcome: r[1], durationMs: Number(r[4]),
      stdout, stdoutSha256: digest(stdout), stdoutOffset: m.index + m[0].length + 1,
      statusOffset: r.index }
  })
  return { rows, summary: summary.slice(1).map(Number), assets: assets.slice(1).map(Number) }
}
function verifyDeclared(root, map) {
  for (const [p, h] of Object.entries(map)) assert.equal(hash(join(root, p)), h, `${root}/${p}`)
}
function normalizedOutputMap(map) {
  return Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)))
}
function ordinaryMap(root) {
  const out = {}
  function walk(p) {
    const s = lstatSync(p)
    if (s.isDirectory()) for (const n of readdirSync(p)) walk(join(p, n))
    else if (s.isFile()) out[relative(root, p)] = hash(p)
    else throw new Error(`unexpected input kind: ${p}`)
  }
  walk(root)
  return normalizedOutputMap(out)
}
function referenceUpdate(before) {
  const plan = join(MAIN, 'docs/testing/a18-feedback-controls-gui-review-20261022-plan.md')
  const report = join(MAIN, 'docs/testing/a18-feedback-controls-gui-review-20261022.md')
  const p = PREFIX + '-reference-update.json'
  if (!existsSync(p)) {
    assert.equal(before.entries[plan].sha256, '18194d7739209149b31a9ef6f467fc0f4600db61d1f228b67cddda8465c8e0fa')
    assert.equal(hash(plan), 'b81d749d51734892ea6d79642b56f4f326d47130076bd40443d91e4d5f23e767')
    assert.match(text(plan), /有限结论与BLOCKED边界已写/)
    save('-reference-update.json', { at: now(), reason: '负责人新交接确认其他专家在途计划合法收尾；不复验其GUI',
      acceptedChanges: [{ path: plan, before: before.entries[plan], after: stamp(plan) }],
      newlyReadReport: { path: report, ...stamp(report) },
      inheritedOnly: '成功词/关闭后正常呈现有限GUI PASS；标记catchGUI及草稿穿越关闭仍BLOCKED' })
  }
  const r = json(p)
  assert.deepEqual(stamp(plan), r.acceptedChanges[0].after)
  const { path, ...meta } = r.newlyReadReport
  assert.deepEqual(stamp(path), meta)
  return r
}

function audit() {
  const checks = []
  function check(name, fn) { fn(); checks.push(name) }
  const old = json(join(A18, 'candidate.json'))
  const current = json(join(RUN, 'candidate.json'))
  const pinned = json(join(A18, 'build-pinned11/proof.json'))
  const before = json(PREFIX + '-before.json')
  const mainAtFreeze = json(PREFIX + '-main-at-freeze.json')
  const supplementalRoots = ['verify-gantt-drag', 'verify-ui-feedback'].map(n =>
    join(IV, 'r3/frozen', PKG, 'scripts', n + '.adapter.mjs'))
  if (!existsSync(PREFIX + '-supplement-before.json')) save('-supplement-before.json', snapshot(supplementalRoots))
  const supplemental = json(PREFIX + '-supplement-before.json')
  const copyProof = json(join(DEP, 'proof.json'))
  const libraryRoots = before.excluded.filter(p =>
    p.startsWith(copyProof.source + '/') || p.startsWith(copyProof.target + '/'))
  if (!existsSync(PREFIX + '-dependency-supplement-before.json')) {
    save('-dependency-supplement-before.json', snapshot(libraryRoots, true))
  }
  const librarySupplement = json(PREFIX + '-dependency-supplement-before.json')
  const references = referenceUpdate(before)
  let adopted, guard, oldGuard, commands, dependencies, priorReview

  check('candidate baseline and full 520->521/453 inventories', () => {
    assert.equal(old.tree, OLD); assert.equal(current.tree, OUT)
    assert.equal(current.baseline, old.baseline)
    assert.equal(old.baseline, '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd')
    assert.equal(Object.keys(old.sourceHashes).length, 520)
    assert.equal(Object.keys(current.sourceHashes).length, 521)
    assert.equal(Object.keys(current.artifacts).length, 453)
    verifyDeclared(OLD, old.sourceHashes); verifyDeclared(OLD, old.artifacts)
    verifyDeclared(OUT, current.sourceHashes); verifyDeclared(OUT, current.artifacts)
    assert.deepEqual(current.artifacts, old.artifacts)
    assert.deepEqual(pinned.sourceHashes, old.sourceHashes)
    assert.deepEqual(pinned.artifacts, old.artifacts)
    assert.equal(hash(join(A18, 'product-tracked.patch')), old.trackedPatchSha)
    for (const n of ['originalA18Drift', 'originalArtifactDrift', 'postSourceDrift']) assert.deepEqual(current[n], [])
    for (const n of ['sourceDrift', 'priorArtifactDrift', 'protectedDrift']) assert.deepEqual(pinned[n], [])
    assert.deepEqual(mainAtFreeze.claimed, current.sourceHashes)
    assert.deepEqual(mainAtFreeze.driftAtFreeze, [])
  })
  check('complete src/scripts/lib sets; no concealed added source', () => {
    for (const root of [OLD, OUT]) {
      for (const folder of ['src', 'scripts', 'lib']) {
        const map = folder === 'lib' ? current.artifacts : root === OLD ? old.sourceHashes : current.sourceHashes
        const prefix = PKG + '/' + folder + '/'
        const declared = Object.fromEntries(Object.entries(map).filter(([n]) => n.startsWith(prefix))
          .map(([n, h]) => [n.slice(prefix.length), h]))
        assert.deepEqual(ordinaryMap(join(root, PKG, folder)), normalizedOutputMap(declared))
      }
    }
  })
  check('only two approved assertion replacements and exact new helper', () => {
    const added = Object.keys(current.sourceHashes).filter(p => !(p in old.sourceHashes))
    assert.deepEqual(added, [PKG + '/scripts/feedback-context-contract.mjs'])
    const modified = Object.keys(old.sourceHashes).filter(p => old.sourceHashes[p] !== current.sourceHashes[p]).sort()
    assert.deepEqual(modified, [PKG + '/scripts/verify-gantt-drag.mjs', PKG + '/scripts/verify-ui-feedback.mjs'])
    assert.deepEqual(Object.keys(current.approvedDelta).sort(), modified)
    adopted = modified.map(p => {
      const filename = p.split('/').pop()
      const c = json(join(IV, 'r3', filename.replace('.mjs', '-adapter-contract.json')))
      const a = text(join(OLD, p)), b = text(join(OUT, p))
      const expert = text(join(IV, 'r3/frozen', PKG, 'scripts', filename.replace('.mjs', '.adapter.mjs')))
      assert.equal(digest(a), c.originalSha256); assert.equal(digest(expert), c.adaptedSha256)
      assert.equal(a.split(c.oldLine).length, 2); assert.equal(b.split(c.newLine).length, 2)
      assert.equal(b.split(c.importLine).length, 2)
      assert.equal(expert.split(c.importLine).length, 2)
      assert.equal(b.replace(c.importLine, ''), expert.replace(c.importLine, ''))
      assert.equal(b.replace(c.importLine, '').replace(c.newLine, c.oldLine), a)
      assert.deepEqual(current.approvedDelta[p], { before: digest(a), after: digest(b) })
      return { path: p, before: digest(a), after: digest(b), ...c,
        importPlacementOnlyDifferenceFromExpert: true }
    })
    assert.equal(current.helperSHA, HELPER)
    assert.equal(hash(join(OUT, added[0])), HELPER)
    assert.equal(hash(join(MAIN, 'docs/testing/a18-verify-interface-contract-review-20261022-helper.mjs')), HELPER)
    assert.equal(text(join(OUT, added[0])),
      text(join(MAIN, 'docs/testing/a18-verify-interface-contract-review-20261022-helper.mjs')))
    const frozen = json(join(IV, 'r3/frozen-inputs.json'))
    for (const [folder, entries] of Object.entries(frozen)) {
      for (const [p, meta] of Object.entries(entries)) {
        const rel = PKG + '/' + folder + (p === '.' ? '' : '/' + p)
        assert.equal(old.sourceHashes[rel], meta.sha256, `prior interface frozen ${rel}`)
      }
    }
  })
  check('new 95 matches old discovery and expert proposed discovery; every raw exit/stdout', () => {
    const originalTargets = discover(OLD), targets = discover(OUT)
    assert.equal(targets.length, 95); assert.deepEqual(targets, originalTargets)
    const proposal = json(join(IV, 'r3/proposed-discovery.json'))
    assert.deepEqual(targets, proposal.originalTargets.map(n => 'scripts/' + n))
    assert.deepEqual(targets, proposal.proposedTargets.map(n => 'scripts/' + n))
    guard = parseGuard(join(RUN, 'guard.stdout.txt'))
    oldGuard = parseGuard(join(A18, 'full-verify/guard.stdout.txt'))
    assert.deepEqual(guard.rows.map(r => r.name), targets)
    assert.deepEqual(oldGuard.rows.map(r => r.name), targets)
    assert.deepEqual(guard.summary, [95, 95, 0]); assert.deepEqual(guard.assets, [5, 5, 0])
    assert(guard.rows.every(r => r.exit === 0 && r.outcome === 'ok'))
    assert.deepEqual(oldGuard.summary, [95, 93, 2]); assert.deepEqual(oldGuard.assets, [5, 5, 0])
    assert.deepEqual(oldGuard.rows.filter(r => r.exit !== 0).map(r => r.name).sort(),
      ['scripts/verify-gantt-drag.mjs', 'scripts/verify-ui-feedback.mjs'])
    assert.equal(json(join(A18, 'full-verify/guard.exit.json')).exit, 1)
    const oldError = text(join(A18, 'full-verify/guard.stderr.txt'))
    assert.match(oldError, /verify-gantt-drag\.mjs:105/)
    assert.match(oldError, /verify-ui-feedback\.mjs:234/)
    for (const row of guard.rows) {
      row.argv = [NODE, join(OUT, PKG, row.name)]
      row.cwd = join(OUT, PKG)
      row.argvDerivation = 'unchanged guard runOne source; not separately archived child argv/PID'
    }
  })
  check('five parent commands exact argv/cwd/env/time/exit and nonempty evidence', () => {
    const expected = [
      ['typecheck', join(OUT, PKG), [NODE, join(OUT, PKG, 'node_modules/typescript/bin/tsc'), '--noEmit']],
      ['guard', join(OUT, PKG), [NODE, 'scripts/verify-isolation.mjs']],
      ['guard-selftest', join(OUT, PKG), [NODE, 'scripts/test-isolation-guard.mjs']],
      ['launcher-test', join(OUT, 'launcher'), [NODE, PNPM, 'test']],
      ['launcher-verify', join(OUT, 'launcher'), [NODE, PNPM, 'run', 'verify']],
    ]
    assert.equal(current.rows.length, 5)
    commands = expected.map(([label, cwd, argv], i) => {
      const p = join(RUN, label + '.exit.json'), row = json(p)
      assert.deepEqual(row, current.rows[i])
      assert.equal(row.label, label); assert.equal(row.cwd, cwd); assert.deepEqual(row.argv, argv)
      assert.equal(row.exit, 0)
      assert(Number.isFinite(Date.parse(row.start)) && Date.parse(row.end) >= Date.parse(row.start))
      if (i > 0) assert(Date.parse(row.start) >= Date.parse(current.rows[i - 1].end))
      assert.deepEqual(Object.keys(row.env).sort(), [
        'PATH', 'LANG', 'TERM', 'HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'CI', 'NODE_DISABLE_COMPILE_CACHE', 'DSH_PM_FILE_ROOT',
      ].sort())
      assert.equal(row.env.HOME, join(OUT, 'private-home'))
      assert.equal(row.env.TMPDIR, join(OUT, 'private-tmpdir'))
      assert.equal(row.env.XDG_CACHE_HOME, join(OUT, 'private-xdg_cache_home'))
      assert.equal(row.env.NODE_DISABLE_COMPILE_CACHE, '1')
      const stdout = join(RUN, label + '.stdout.txt'), stderr = join(RUN, label + '.stderr.txt')
      return { ...row, evidence: { command: stamp(p), stdout: stamp(stdout), stderr: stamp(stderr) } }
    })
    assert.equal(text(join(RUN, 'typecheck.stdout.txt')), '')
    assert.equal(text(join(RUN, 'typecheck.stderr.txt')), '')
    assert.match(text(join(RUN, 'guard-selftest.stdout.txt')), /fixture 已清理：PASS/)
    assert.equal(text(join(RUN, 'guard-selftest.stderr.txt')), '')
    const tap = text(join(RUN, 'launcher-test.stdout.txt'))
    const cases = [...tap.matchAll(/^ok (\d+) - (.+)$/gm)]
    assert.equal(cases.length, 56)
    assert.deepEqual(cases.map(m => Number(m[1])), Array.from({ length: 56 }, (_, i) => i + 1))
    for (const s of ['# tests 56', '# pass 56', '# fail 0', '# cancelled 0', '# skipped 0', '# todo 0']) assert(tap.includes(s))
    commands[3].cases = cases.map(m => ({ number: Number(m[1]), title: m[2] }))
    assert.match(text(join(RUN, 'launcher-verify.stdout.txt')), /verify-launcher: PASS/)
    const archive = text(ARCHIVE)
    assert.match(archive, /subprocess\.run\(args,cwd=cwd,env=env,capture_output=True,text=True\)/)
    assert.match(archive, /r\.returncode/)
    assert.match(archive, /if out\.exists\(\) or target\.exists\(\):raise RuntimeError\('refuse overwrite'\)/)
    assert(!archive.includes("('build',")); assert(!archive.includes('install'))
  })
  check('original and pinned11 build evidence inherited only for unchanged product', () => {
    for (const folder of ['build', 'build-pinned11']) {
      const names = folder === 'build' ? ['noemit', 'build', 'coverage'] : ['version', 'noemit', 'build', 'coverage']
      for (const name of names) {
        const row = json(join(A18, folder, name + '.exit.json'))
        assert.equal(row.exit, 0)
        assert.equal(row.cwd, join(OLD, PKG))
        if (folder === 'build-pinned11') {
          assert.deepEqual(row, pinned.rows.find(r => r.name === name))
          assert.deepEqual(row.argv.slice(0, 2), [NODE, PNPM])
        }
        assert(existsSync(join(A18, folder, name + '.stdout.txt')))
        assert(existsSync(join(A18, folder, name + '.stderr.txt')))
      }
      const coverage = text(join(A18, folder, 'coverage.stdout.txt')).replace(/\u001b\[[0-9;]*m/g, '')
      assert.match(coverage, /Test Files\s+149 passed/); assert.match(coverage, /Tests\s+1552 passed/)
    }
    assert.equal(text(join(A18, 'build-pinned11/version.stdout.txt')).trim(), '11.28.5')
  })
  check('previous independent original-red/adapter/negative controls remain independently archived', () => {
    priorReview = json(join(IV, 'review-r3/review.json'))
    for (const r of priorReview.reviewed) {
      const dir = join(IV, 'r3')
      assert.equal(hash(join(dir, r.id + '.command.json')), r.commandSha256)
      assert.equal(hash(join(dir, r.id + '.stdout.log')), r.stdoutSha256)
      assert.equal(hash(join(dir, r.id + '.stderr.log')), r.stderrSha256)
      if (r.reporterSha256) assert.equal(hash(join(dir, r.id + '.result.json')), r.reporterSha256)
      assert.equal(json(join(dir, r.id + '.command.json')).exit, r.exit)
    }
    for (const name of ['verify-gantt-drag', 'verify-ui-feedback']) {
      assert.equal(json(join(IV, 'r3/original-' + name + '.command.json')).exit, 1)
      assert.equal(json(join(IV, 'r3/adapted-' + name + '.command.json')).exit, 0)
    }
    assert.equal(json(join(IV, 'r3/summary.json')).counterexamples.length, 8)
    const original20 = json(join(CT, 'original-counterexamples20.result.json'))
    assert.equal(original20.numPassedTests, 19); assert.equal(original20.numFailedTests, 1)
    assert.equal(json(join(CT, 'original-counterexamples20.command.json')).originalExit, 1)
    assert(original20.testResults.flatMap(r => r.assertionResults)
      .some(r => r.status === 'failed' && r.fullName.startsWith('TF-X08')))
    assert.equal(json(join(IV, 'final-r3/final.json')).released, true)
  })
  check('complete dependency copyproof; each file bytes/hash/mtime/inode; every link remains internal', () => {
    const proof = json(join(DEP, 'proof.json')), manifest = json(join(DEP, 'source-before.json'))
    assert.equal(manifest.root, proof.source)
    assert.equal(proof.target, '/private/tmp/pmtool-a19-owned-deps-20261022/node_modules')
    for (const key of ['externalLinks', 'sourceDrift', 'violations', 'rebasedAbsoluteInternalLinks']) assert.deepEqual(proof[key], [])
    assert.equal(proof.files, 13613); assert.equal(proof.links, 1030)
    assert.equal(Object.keys(manifest.files).length, 13613); assert.equal(manifest.links.length, 1030)
    const src = snapshot([proof.source], true), dst = snapshot([proof.target], true)
    const relMap = (snap, root, kind) => Object.fromEntries(Object.entries(snap.entries)
      .filter(([, v]) => v.kind === kind).map(([p, v]) => [relative(root, p), v]))
    const srcFiles = relMap(src, proof.source, 'file'), dstFiles = relMap(dst, proof.target, 'file')
    assert.deepEqual(Object.keys(srcFiles).sort(), Object.keys(manifest.files).sort())
    assert.deepEqual(Object.keys(dstFiles).sort(), Object.keys(manifest.files).sort())
    let bytes = 0
    for (const [p, meta] of Object.entries(manifest.files)) {
      const a = srcFiles[p], b = dstFiles[p]
      assert.equal(a.sha256, meta.sha256, `source hash ${p}`); assert.equal(a.bytes, meta.bytes)
      assert.equal(Number(a.mtimeNs), meta.mtimeNs, `source mtime ${p}`)
      assert.equal(Number(a.inode), meta.inode)
      assert.equal(b.sha256, meta.sha256, `copied hash ${p}`); assert.equal(b.bytes, meta.bytes)
      assert(a.dev !== b.dev || a.inode !== b.inode, `shared inode ${p}`)
      bytes += b.bytes
    }
    const srcLinks = relMap(src, proof.source, 'link'), dstLinks = relMap(dst, proof.target, 'link')
    const linkPaths = manifest.links.map(l => l.path).sort()
    assert.deepEqual(Object.keys(srcLinks).sort(), linkPaths)
    assert.deepEqual(Object.keys(dstLinks).sort(), linkPaths)
    for (const l of manifest.links) {
      assert.equal(srcLinks[l.path].target, l.target)
      assert.equal(dstLinks[l.path].target, l.target)
      assert(!isAbsolute(l.target))
      assert.equal(realpathSync(join(proof.source, l.path)), l.resolved)
      const resolved = realpathSync(join(proof.target, l.path))
      assert(resolved.startsWith(proof.target + '/'), `external link ${l.path}`)
      assert(resolve(dirname(join(proof.target, l.path)), l.target).startsWith(proof.target + '/'))
    }
    assert.equal(readlinkSync(join(OUT, PKG, 'node_modules')), proof.target)
    dependencies = { proof, sourceBeforeSHA256: hash(join(DEP, 'source-before.json')),
      proofSHA256: hash(join(DEP, 'proof.json')), verifiedFiles: 13613, verifiedLinks: 1030,
      bytes, externalLinks: 0, sourceDrift: [], targetContentDrift: [], sharedInodes: 0,
      note: 'copy preserves historical shim contents; does not repair ten historical bin drifts' }
  })
  check('auditor protected fixed roots unchanged; Main future changes deliberately excluded', () => {
    assert.deepEqual(changes(before.entries, snapshot(before.roots).entries), references.acceptedChanges)
    assert.deepEqual(changes(supplemental.entries, snapshot(supplemental.roots).entries), [])
    assert.deepEqual(changes(librarySupplement.entries, snapshot(librarySupplement.roots, true).entries), [])
  })
  const result = {
    at: now(), verdict: '有限 AUTO 原证一致性与继承 PASS；非 GUI/总门/提交放行',
    environment: { platform: process.platform, arch: process.arch, node: process.version,
      role: 'independent file-only reviewer', productExecution: false, build: false, install: false,
      gui: false, services: false, credentials: false, commit: false },
    candidate: { baseline: current.baseline, oldTree: OLD, tree: OUT, sourceFiles: 521,
      originalSourceFiles: 520, artifacts: 453, candidateSHA256: hash(join(RUN, 'candidate.json')),
      oldCandidateSHA256: hash(join(A18, 'candidate.json')), helperSHA256: HELPER,
      mainAtFreezeOnly: true, mainFutureImmutabilityRequired: false },
    checks, adopted, commands, guard, originalGuard: oldGuard, dependencies,
    priorIndependentAudit: { reviewedCommands: priorReview.reviewed.length, originalTwoExit: [1, 1],
      adoptedTwoExit: [0, 0], negativeControls: 8, original20: { exit: 1, passed: 19, failed: 1 } },
    protection: { roots: before.roots.length, entries: Object.keys(before.entries).length,
      supplementalEntries: Object.keys(supplemental.entries).length,
      dependencySupplementEntries: Object.keys(librarySupplement.entries).length,
      initialExcludedPaths: before.excluded, separatelyProtectedLibraryPaths: libraryRoots,
      immutableDrift: [], authorizedParallelReferenceChanges: references.acceptedChanges },
    lateReference: references,
    boundaries: [
      'guard WATCH is five isolated roots, all initially missing; manifest size 5 counts missing sentinels, not five physical files',
      'guard stdout preserves per-target output/status; separate child PID/env/stderr files were not archived',
      'parent archive is read-only reviewed, not executed; parent PID and outer Python final exit not independently archived here',
      'old build and pinned11 warnings and ten historical bin drift are not cleared',
      'no real-model smoke, credentialed service, browser, feedback-controls duplicate review, habits implementation or whole gate signoff',
      'future dependency changes require fingerprint revalidation; full copyproof may be durably cited without copying private data',
    ],
  }
  save('-audit.json', result)
  console.log(JSON.stringify({ audit: 'PASS', checks: checks.length, protectedEntries: result.protection.entries,
    guard: guard.summary, launcher: 56, dependencies: [13613, 1030] }))
}
const mode = process.argv[2]
if (mode === 'freeze') {
  assert(!existsSync(PREFIX + '-before.json'))
  const current = json(join(RUN, 'candidate.json'))
  const claimed = Object.fromEntries(Object.keys(current.sourceHashes).map(p => [p, hash(join(MAIN, p))]))
  save('-main-at-freeze.json', { at: now(), note: 'hash-only current recognition; never a future immutable Main root',
    claimed, driftAtFreeze: Object.keys(claimed).filter(p => claimed[p] !== current.sourceHashes[p]) })
  const frozen = snapshot(roots())
  save('-before.json', frozen)
  console.log(JSON.stringify({ frozen: Object.keys(frozen.entries).length, roots: frozen.roots.length }))
} else if (mode === 'audit') {
  audit()
} else if (mode === 'seal') {
  const before = json(PREFIX + '-before.json')
  const supplemental = json(PREFIX + '-supplement-before.json')
  const librarySupplement = json(PREFIX + '-dependency-supplement-before.json')
  const references = referenceUpdate(before)
  const after = snapshot(before.roots), rawDrift = changes(before.entries, after.entries)
  assert.deepEqual(rawDrift, references.acceptedChanges)
  const supplementalDrift = changes(supplemental.entries, snapshot(supplemental.roots).entries)
  assert.deepEqual(supplementalDrift, [])
  const dependencySupplementDrift = changes(librarySupplement.entries, snapshot(librarySupplement.roots, true).entries)
  assert.deepEqual(dependencySupplementDrift, [])
  const own = readdirSync(dirname(PREFIX)).filter(n => n.startsWith(PREFIX.split('/').pop()))
    .filter(n => !n.endsWith('-seal.json')).sort()
  save('-seal.json', { at: now(), verdict: '有限 AUTO PASS，固定保护根零漂移，审证已释放',
    protectedRoots: before.roots.length, protectedEntries: Object.keys(after.entries).length,
    immutableDrift: [], authorizedParallelReferenceChanges: rawDrift,
    supplementalEntries: Object.keys(supplemental.entries).length, supplementalDrift,
    dependencySupplementEntries: Object.keys(librarySupplement.entries).length, dependencySupplementDrift,
    inputManifestSHA256: hash(PREFIX + '-before.json'), mainFutureImmutable: false,
    ownFiles: own.map(n => ({ path: 'docs/testing/' + n, ...stamp(join(dirname(PREFIX), n)) })),
    noSpawnedChildren: true, noBuildGuiServiceOwnership: true, released: true })
  console.log(JSON.stringify({ seal: 'PASS', drift: 0, released: true }))
} else {
  throw new Error('mode must be freeze, audit or seal')
}

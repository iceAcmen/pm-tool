// 独立内置 reader：仅解析、指纹、输入复制；不加载产品或开发执行器。
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, realpathSync, symlinkSync, writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PKG = path.join(REPO, 'packages/dsh-pm-tool')
const PREFIX = path.join(REPO, 'docs/testing/p2007-archive-projection-source-auto-20261023-r1-')
const DEV = 'docs/plans/2026-10-23-p2007-archive-draft-projection-'
const ORIGINAL = 'reports/all-pending-evidence-20261021/P2ArchiveReviewR1'
const TESTS = ['archive', 'review-materials', 'export-isolation', 'export-outbound']
  .map(n => `src/core/${n}.test.ts`)
const HASH = b => createHash('sha256').update(b).digest('hex')
const readJson = p => JSON.parse(readFileSync(p, 'utf8'))
const save = (p, j) => writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`, { flag: 'wx' })
function ordinary(abs) {
  // 依赖的明确 realpath 文件允许；仓库与临时输入禁止软链祖先。
  let cursor = abs
  while (cursor !== path.dirname(cursor)) {
    if (cursor === '/tmp') assert.equal(realpathSync(cursor), '/private/tmp', 'macOS系统tmp别名')
    else assert(!lstatSync(cursor).isSymbolicLink(), `软链输入：${cursor}`)
    cursor = path.dirname(cursor)
  }
  assert(lstatSync(abs).isFile(), `非普通文件：${abs}`)
}
function fp(abs) {
  ordinary(abs)
  const b = readFileSync(abs)
  return { bytes: b.length, sha256: HASH(b) }
}
function repoPath(rel) {
  assert(!path.isAbsolute(rel) && !rel.split('/').includes('..'), `越界路径：${rel}`)
  const abs = path.join(REPO, rel)
  assert(abs.startsWith(`${REPO}/`))
  return abs
}
function walk(abs) {
  const result = []
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    assert(!e.isSymbolicLink(), `成员软链：${e.name}`)
    const p = path.join(abs, e.name)
    if (e.isDirectory()) result.push(...walk(p))
    else if (e.isFile()) result.push(p)
  }
  return result.sort()
}
function topFiles(dir, prefix) {
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.name.startsWith(prefix) && e.isFile())
    .map(e => path.join(dir, e.name)).sort()
}
function drift(files) {
  return files.flatMap(f => {
    const abs = path.isAbsolute(f.path) ? f.path : repoPath(f.path)
    const now = existsSync(abs) ? fp(abs) : null
    return now && now.sha256 === f.sha256 && now.bytes === f.bytes ? [] : [{ ...f, current: now }]
  })
}
function reverseDiff(current, diff) {
  const lines = current.toString('utf8').split('\n')
  assert.equal(lines.pop(), '', '源文件应有结尾换行')
  const patch = diff.split('\n')
  const old = []
  let cursor = 0
  let added = 0
  let removed = 0
  for (let i = 2; i < patch.length; i++) {
    if (!patch[i]) continue
    const h = /^@@ -(\d+),(\d+) \+(\d+),(\d+) @@/.exec(patch[i])
    assert(h, `无效 unified hunk：${patch[i]}`)
    const start = Number(h[3]) - 1
    old.push(...lines.slice(cursor, start))
    const before = []
    const after = []
    while (++i < patch.length && !patch[i].startsWith('@@')) {
      const line = patch[i]
      if (!line && i === patch.length - 1) break
      assert([' ', '+', '-'].includes(line[0]), '不支持的diff行')
      if (line[0] !== '+') before.push(line.slice(1))
      if (line[0] !== '-') after.push(line.slice(1))
      if (line[0] === '+') added++
      if (line[0] === '-') removed++
    }
    i--
    assert.equal(before.length, Number(h[2]))
    assert.equal(after.length, Number(h[4]))
    assert.deepEqual(lines.slice(start, start + after.length), after, 'patch当前字节不符')
    assert.equal(old.length, Number(h[1]) - 1, '旧行偏移不符')
    old.push(...before)
    cursor = start + after.length
  }
  old.push(...lines.slice(cursor))
  return { bytes: Buffer.from(`${old.join('\n')}\n`), added, removed }
}

const mode = process.argv[2]
if (mode === 'capture') {
  assert(!existsSync(`${PREFIX}audit.json`), '禁止覆盖已有审证')
  const baseline = readJson(repoPath(`${DEV}baseline.json`))
  const devSeal = readJson(repoPath(`${DEV}seal.json`))
  assert.equal(devSeal.role, 'developer')
  assert.equal(devSeal.independentJudgment, 'NOT_JUDGED')
  assert.equal(devSeal.stop, true)
  assert(devSeal.sourceLocks.every(s => s.state === 'released'))
  assert.equal(baseline.protectedBefore.length, 379)
  assert.equal(baseline.dependencyFiles.length, 1019)
  const outputs = devSeal.outputs.map(f => ({ ...f, current: fp(repoPath(f.path)) }))
  assert(outputs.every(f => f.current.sha256 === f.sha256 && f.current.bytes === f.bytes))
  for (const f of baseline.dependencyFiles) {
    assert(baseline.dependencyRoots.some(r => f.path.startsWith(`${r}/`)), '依赖越界')
    assert(f.path.startsWith(`${PKG}/node_modules/.pnpm/`), '非获准依赖')
  }
  const previousDrift = drift(baseline.protectedBefore)
  const dependencies = drift(baseline.dependencyFiles)
  assert.equal(dependencies.length, 0, '已列依赖从开发封存后漂移')
  const members = walk(repoPath(ORIGINAL)).map(p => path.relative(repoPath(ORIGINAL), p))
  assert.deepEqual(members, baseline.originalFiles)
  const index = readJson(repoPath(`${ORIGINAL}/index-r1.json`))
  assert.equal(Object.keys(index).length, 192)
  for (const [rel, expected] of Object.entries(index)) {
    assert.deepEqual(fp(repoPath(`${ORIGINAL}/${rel}`)), expected)
  }
  const diffResults = devSeal.sourceDiffs.map(f => {
    const current = readFileSync(path.join(PKG, f.path))
    assert.deepEqual(fp(path.join(PKG, f.path)), f.after)
    const label = f.path.endsWith('archive.test.ts') ? 'archive-test-ts' : 'archive-ts'
    const recovered = reverseDiff(current, readFileSync(repoPath(`${DEV}diff-${label}-stdout.log`), 'utf8'))
    assert.deepEqual({ bytes: recovered.bytes.length, sha256: HASH(recovered.bytes) }, f.before)
    assert.equal(recovered.added, label === 'archive-ts' ? 4 : 164)
    assert.equal(recovered.removed, label === 'archive-ts' ? 3 : 9)
    return { path: f.path, before: f.before, after: f.after, added: recovered.added, removed: recovered.removed }
  })
  const runs = ['red-r1', 'green-r1', 'affected-r1'].map(label => {
    const input = readJson(repoPath(`${DEV}${label}-inputs.json`))
    const receipt = readJson(repoPath(`${DEV}${label}-receipt.json`))
    assert.equal(input.sources.length, 94)
    assert.equal(receipt.exit, label === 'red-r1' ? 1 : 0)
    assert.equal(receipt.signal, null)
    assert.equal(receipt.error, null)
    assert(receipt.cwd.startsWith(input.root))
    assert.equal(receipt.args[0], `${input.root}/node_modules/vitest/vitest.mjs`)
    assert.equal(receipt.env.HOME, `${input.root}/home`)
    return { label, input, receipt }
  })
  const redFiles = new Map(runs[0].input.sources.map(f => [f.path, f]))
  const greenFiles = new Map(runs[1].input.sources.map(f => [f.path, f]))
  const transition = runs[1].input.sources.filter(f => redFiles.get(f.path)?.sha256 !== f.sha256)
  assert.deepEqual(transition.map(f => f.path), ['packages/dsh-pm-tool/src/core/archive.ts'])
  assert(runs[2].input.sources.every(f => greenFiles.get(f.path)?.sha256 === f.sha256))
  assert.equal(redFiles.get('packages/dsh-pm-tool/src/core/archive.test.ts').sha256, diffResults[1].after.sha256)
  const redOut = readFileSync(repoPath(`${DEV}red-r1-stdout.log`), 'utf8')
  const redErr = readFileSync(repoPath(`${DEV}red-r1-stderr.log`), 'utf8')
  assert(redOut.includes('5 failed | 4 skipped (9)') && redErr.includes('Failed Tests 5'))
  assert(!/SyntaxError|ZodError|Failed to load|Cannot find module/.test(redErr))
  const auditRoot = mkdtempSync('/tmp/p2007-archive-projection-source-auto-20261023-r1-')
  for (const dir of ['input', 'config', 'cache', 'home', 'output/tmp', 'output/data']) {
    mkdirSync(path.join(auditRoot, dir), { recursive: true })
  }
  // 固定四专项的相对模块闭包，不执行或复制其他在途测试。
  const closure = new Set()
  function add(rel) {
    assert(rel.startsWith('src/core/') && rel.endsWith('.ts'), `闭包越界：${rel}`)
    if (closure.has(rel)) return
    closure.add(rel)
    const source = readFileSync(path.join(PKG, rel), 'utf8')
    for (const m of source.matchAll(/(?:from\s*|import\s*\()\s*['"](\.\/[^'"]+)['"]/g)) {
      assert(m[1].endsWith('.js'), `未知模块后缀：${m[1]}`)
      add(path.posix.join(path.posix.dirname(rel), `${m[1].slice(0, -3)}.ts`))
    }
  }
  TESTS.forEach(add)
  const sourceInputs = [...closure].sort().map(rel => {
    const abs = path.join(PKG, rel)
    const expected = greenFiles.get(`packages/dsh-pm-tool/${rel}`)
    assert(expected, `开发封包未绑定闭包：${rel}`)
    assert.deepEqual(fp(abs), { bytes: expected.bytes, sha256: expected.sha256 }, `受影响闭包已漂移：${rel}`)
    const dest = path.join(auditRoot, 'input', rel)
    mkdirSync(path.dirname(dest), { recursive: true })
    copyFileSync(abs, dest)
    assert.deepEqual(fp(dest), fp(abs))
    return { path: `packages/dsh-pm-tool/${rel}`, copiedPath: path.relative(auditRoot, dest), ...fp(abs) }
  })
  for (const rel of ['package.json', 'pnpm-lock.yaml']) {
    copyFileSync(path.join(PKG, rel), path.join(auditRoot, 'input', rel))
    sourceInputs.push({ path: `packages/dsh-pm-tool/${rel}`, copiedPath: `input/${rel}`, ...fp(path.join(PKG, rel)) })
  }
  const fixtureNames = ['projects/p-0001', 'reflections/ref-mvi5z85j-yk04ji',
    'reflections/ref-mvk0iiij-42f7xa', 'reflections/ref-mvk0n0me-25tmos']
  mkdirSync(path.join(auditRoot, 'input/fixtures'))
  for (const name of fixtureNames) {
    const rel = `${ORIGINAL}/round00-resume-raw/data/pmtool/${name}.json`
    const copiedPath = `input/fixtures/${path.posix.basename(name)}.json`
    copyFileSync(repoPath(rel), path.join(auditRoot, copiedPath))
    sourceInputs.push({ path: rel, copiedPath, ...fp(repoPath(rel)) })
  }
  symlinkSync(path.join(PKG, 'node_modules'), path.join(auditRoot, 'node_modules'), 'dir')
  const currentProtected = [...new Set([
    ...baseline.protectedBefore.map(f => f.path), ...devSeal.outputs.map(f => f.path), `${DEV}seal.json`,
    ...topFiles(path.join(REPO, 'docs/testing'), 'p2007-archive-known-gaps-red-20261023-r1')
      .map(p => path.relative(REPO, p)),
    ...sourceInputs.map(f => f.path),
  ])].map(rel => ({ path: rel, ...fp(repoPath(rel)) }))
  const audit = {
    role: 'independent SOURCE/AUTO expert', gitExecuted: false,
    baselineDeclared: baseline.baselineDeclaredByExpert, root: auditRoot,
    developerSeal: fp(repoPath(`${DEV}seal.json`)), developerOutputs: outputs,
    developerProtectedCount: 379, developerDependencyCount: 1019,
    developerToCurrentDrift: previousDrift,
    developerDependencyDrift: dependencies, originalMemberCount: members.length,
    originalIndexedCount: 192, originalMembers: members, exactDeltas: diffResults,
    developerRedEvidence: '5个真实遗漏断言红；4旧例有意过滤；仅审证，未执行开发runner',
    developerRuns: runs.map(r => ({ label: r.label, receipt: r.receipt, sourceCount: r.input.sources.length })),
    sourceInputs, protectedBefore: currentProtected, dependencyBefore: baseline.dependencyFiles,
    dependencyRoots: baseline.dependencyRoots,
    nodeModulesLink: { path: `${auditRoot}/node_modules`, target: realpathSync(path.join(PKG, 'node_modules')) },
    tests: TESTS, products: '直接生产源，未构建、未读取lib或宿主runtime',
    scope: '只限K16 draft投影；旧GUI/archive红及P2007整项不关闭',
  }
  save(`${PREFIX}audit.json`, audit)
  console.log(JSON.stringify({ root: auditRoot, sourceInputs: sourceInputs.length,
    protected: currentProtected.length, developerToCurrentDrift: previousDrift, exactDeltas: diffResults }, null, 2))
} else if (mode === 'seal') {
  const audit = readJson(`${PREFIX}audit.json`)
  const protectedDrift = drift(audit.protectedBefore)
  const dependencyDrift = drift(audit.dependencyBefore)
  const copiedDrift = audit.sourceInputs.flatMap(f => {
    const current = fp(path.join(audit.root, f.copiedPath))
    return current.sha256 === f.sha256 && current.bytes === f.bytes ? [] : [{ ...f, current }]
  })
  const runs = ['affected', 'bytes'].map(label => {
    const receipt = readJson(`${PREFIX}${label}-receipt.json`)
    const input = readJson(`${PREFIX}${label}-inputs.json`)
    for (const stream of ['stdout', 'stderr']) {
      assert.deepEqual(fp(`${PREFIX}${label}-${stream}.log`), receipt[stream], '收据流指纹不符')
    }
    const resultFile = `${PREFIX}${label}-vitest-result.json`
    assert.deepEqual(fp(resultFile), fp(path.join(audit.root, 'output', label, 'vitest-result.json')))
    const result = readJson(resultFile)
    assert.equal(result.success, true)
    assert.equal(result.numTotalTests, label === 'affected' ? 35 : 3)
    assert.equal(result.numPassedTests, result.numTotalTests)
    assert.equal(result.numFailedTests, 0)
    assert.equal(result.numPendingTests, 0)
    const expected = label === 'affected' ? audit.tests : ['independent-bytes.test.ts']
    assert.deepEqual(result.testResults.map(t => path.relative(path.join(audit.root, 'input'), t.name)).sort(),
      [...expected].sort())
    assert(result.testResults.every(t => t.status === 'passed' &&
      t.assertionResults.every(c => c.status === 'passed')))
    const changes = input.files.flatMap(f => {
      const now = fp(f.path)
      return now.sha256 === f.sha256 && now.bytes === f.bytes ? [] : [{ ...f, current: now }]
    })
    return { label, exit: receipt.exit, signal: receipt.signal, error: receipt.error,
      tests: result.numTotalTests, inputDrift: changes }
  })
  assert.deepEqual(fp(`${PREFIX}original-records-projection.json`),
    fp(path.join(audit.root, 'output/bytes/original-records-projection.json')))
  assert.equal(realpathSync(path.join(audit.root, 'node_modules')), audit.nodeModulesLink.target)
  const outputs = topFiles(path.join(REPO, 'docs/testing'), path.basename(PREFIX)).filter(p => p !== `${PREFIX}seal.json`)
    .map(p => ({ path: path.relative(REPO, p), ...fp(p) }))
  const inputStable = copiedDrift.length === 0 && dependencyDrift.length === 0 &&
    runs.every(r => r.inputDrift.length === 0)
  const sourceProtectedDrift = protectedDrift.filter(f => audit.sourceInputs.some(s => s.path === f.path) ||
    f.path.startsWith(ORIGINAL) || f.path.startsWith(DEV))
  const passed = inputStable && sourceProtectedDrift.length === 0 &&
    runs.every(r => r.exit === 0 && r.signal === null && r.error === null)
  const seal = {
    role: audit.role, judgment: passed ? '有限PASS：K16 draft投影SOURCE/AUTO' : 'FAIL：详见本seal及原始收据',
    boundSources: audit.exactDeltas.map(f => ({ path: f.path, ...f.after })),
    baselineDeclared: audit.baselineDeclared, gitExecuted: false,
    protectedCount: audit.protectedBefore.length, protectedDrift,
    dependencyCount: audit.dependencyBefore.length, dependencyDrift, copiedDrift, runs,
    originalMembershipEqual: JSON.stringify(walk(repoPath(ORIGINAL)).map(p => path.relative(repoPath(ORIGINAL), p))) ===
      JSON.stringify(audit.originalMembers),
    outputs, root: audit.root, nodeModulesLinkTarget: realpathSync(path.join(audit.root, 'node_modules')),
    developerToCurrentDrift: audit.developerToCurrentDrift,
    protectionBoundary: '明确文件清单及四专项闭包；links非OS强制只读；不声称全库/全盘/完整依赖零变',
    gui: 'NOT_RUN / Main only；旧GUI/archive红主chain不关闭',
    p2007: '整项不关闭', ordinarycommit: 'NOT_RUN / 不授权', push: 'NOT_RUN', release: 'NOT_RUN',
    sharedLocks: '未持产品/builder/GUI/service锁；Main唯一builder/GUI；P1004/P1005在途未操作',
    children: '本轮runner的spawnSync子进程全部返回，无长运行任务',
    state: 'released', stop: true,
  }
  save(`${PREFIX}seal.json`, seal)
  assert(seal.originalMembershipEqual, '原封包成员漂移')
  assert(passed, '当前SOURCE/AUTO未通过，保留FAIL seal')
  console.log(JSON.stringify({ judgment: seal.judgment, protectedDrift, dependencyDrift, copiedDrift,
    runs, state: seal.state, stop: seal.stop }, null, 2))
} else {
  throw new Error('仅capture/seal；禁止覆盖旧产物')
}

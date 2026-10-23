// 本开发专用离线证据 runner；只写本前缀新产物和自有 tmp，不构建、不调用 Git/GUI。
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, realpathSync, symlinkSync, writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PKG = path.join(REPO, 'packages/dsh-pm-tool')
const PREFIX = path.join(REPO, 'docs/plans/2026-10-23-p2007-archive-draft-projection-')
const OWN = ['src/core/archive.ts', 'src/core/archive.test.ts']
const TESTS = [
  'src/core/archive.test.ts', 'src/core/review-materials.test.ts',
  'src/core/export-isolation.test.ts', 'src/core/export-outbound.test.ts',
]
const sha = b => createHash('sha256').update(b).digest('hex')
const fp = abs => {
  assert(lstatSync(abs).isFile(), `非普通文件：${abs}`)
  const b = readFileSync(abs)
  return { bytes: b.length, sha256: sha(b) }
}
function walk(root) {
  const result = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const abs = path.join(root, entry.name)
    assert(!entry.isSymbolicLink(), `保护输入禁止软链：${abs}`)
    if (entry.isDirectory()) result.push(...walk(abs))
    else if (entry.isFile()) result.push(abs)
  }
  return result.sort()
}
function json(abs, data) {
  writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' })
}
function env(root) {
  return {
    PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`,
    HOME: path.join(root, 'home'), TMPDIR: path.join(root, 'output/tmp'),
    XDG_CONFIG_HOME: path.join(root, 'config'), XDG_CACHE_HOME: path.join(root, 'cache'),
    XDG_DATA_HOME: path.join(root, 'output/data'), LANG: 'en_US.UTF-8', TZ: 'UTC',
    CI: '1', NO_COLOR: '1',
  }
}
function newRoot() {
  const root = mkdtempSync('/tmp/pmtool-p2007-archive-draft-projection-')
  for (const dir of ['input', 'config', 'cache', 'home', 'output/tmp', 'output/data']) {
    mkdirSync(path.join(root, dir), { recursive: true })
  }
  return root
}
function exec(label, command, args, root, cwd = REPO) {
  const start = new Date().toISOString()
  const r = spawnSync(command, args, {
    cwd, env: env(root), encoding: 'utf8', timeout: 120000, maxBuffer: 24 * 1024 * 1024,
  })
  const stdout = r.stdout ?? ''
  const stderr = r.stderr ?? ''
  writeFileSync(`${PREFIX}${label}-stdout.log`, stdout, { flag: 'wx' })
  writeFileSync(`${PREFIX}${label}-stderr.log`, stderr, { flag: 'wx' })
  const receipt = {
    label, command, args, cwd, env: env(root), start, end: new Date().toISOString(),
    exit: r.status, signal: r.signal, error: r.error?.message ?? null,
    stdout: { bytes: Buffer.byteLength(stdout), sha256: sha(stdout) },
    stderr: { bytes: Buffer.byteLength(stderr), sha256: sha(stderr) },
    independentJudgment: 'NOT_JUDGED',
  }
  json(`${PREFIX}${label}-receipt.json`, receipt)
  process.stdout.write(stdout)
  process.stderr.write(stderr)
  return receipt
}
function vendorHashes() {
  const root = path.join(REPO, 'vendor/agent-skills/mattpocock')
  const m = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8'))
  const files = [...m.rootFiles, ...m.skills.flatMap(s => s.files)]
  for (const file of files) assert.deepEqual(fp(path.join(root, file.path)), {
    bytes: file.bytes, sha256: file.sha256,
  }, `vendor 指纹：${file.path}`)
  return { commit: m.source.commit, files }
}
function sourceFiles() {
  return walk(path.join(PKG, 'src/core')).filter(abs =>
    abs.endsWith('.ts') && (!abs.endsWith('.test.ts') || TESTS.includes(path.relative(PKG, abs))))
}
function manifest(files) {
  return files.map(abs => ({ path: path.relative(REPO, abs), ...fp(abs) }))
}
function copyInputs(root) {
  const files = sourceFiles()
  for (const abs of files) {
    const dest = path.join(root, 'input', path.relative(PKG, abs))
    mkdirSync(path.dirname(dest), { recursive: true })
    copyFileSync(abs, dest)
    assert.deepEqual(fp(dest), fp(abs))
  }
  copyFileSync(path.join(PKG, 'package.json'), path.join(root, 'input/package.json'))
  symlinkSync(path.join(PKG, 'node_modules'), path.join(root, 'node_modules'), 'dir')
  return manifest(files)
}
const MODE = process.argv[2]
if (MODE === 'capture') {
  const root = newRoot()
  const docs = [
    'AGENTS.md', 'docs/collaboration.md', 'docs/external-skills.md',
    'docs/onboarding-prompt.md', 'docs/handoff.md', 'docs/progress.md', 'docs/changelog.md',
    'docs/requirements.md', 'docs/decision-log.md', 'docs/knowledge-base.md', 'docs/issues-and-solutions.md',
    'docs/design/deep-integration-v2-p2-dev.md',
    'docs/testing/p2007-archive-known-gaps-red-20261023-r1.md',
    'packages/dsh-pm-tool/package.json', 'packages/dsh-pm-tool/pnpm-lock.yaml',
    'packages/dsh-pm-tool/scripts/verify-external-skills.mjs',
    'packages/dsh-pm-tool/scripts/verify-p2c.mjs',
    'packages/dsh-pm-tool/src/commands/archive.ts',
  ].map(p => path.join(REPO, p))
  const original = path.join(REPO, 'reports/all-pending-evidence-20261021/P2ArchiveReviewR1')
  const protectedFiles = [...docs, ...walk(original),
    ...walk(path.join(REPO, 'vendor/agent-skills/mattpocock')),
    ...walk(path.join(PKG, 'src/core')).filter(p => p.endsWith('.ts') && !OWN.includes(path.relative(PKG, p)))]
  const dependencyRoots = ['vitest', 'zod', '@deepseek-ai/dsh-storage-domain', '@deepseek-ai/cordis']
    .map(name => realpathSync(path.join(PKG, 'node_modules', name)))
  const vitestRequire = createRequire(path.join(dependencyRoots[0], 'package.json'))
  dependencyRoots.push(path.dirname(vitestRequire.resolve('vite/package.json')))
  // 依赖包内的软链只登记链接本身，不沿任意软链扫描。
  const dependencyFiles = []
  function deps(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name)
      if (e.isDirectory() && e.name !== 'node_modules') deps(abs)
      else if (e.isFile()) dependencyFiles.push({ path: abs, ...fp(abs) })
    }
  }
  dependencyRoots.forEach(deps)
  for (const rel of OWN) {
    const dest = path.join(root, 'input', rel)
    mkdirSync(path.dirname(dest), { recursive: true })
    copyFileSync(path.join(PKG, rel), dest)
  }
  json(`${PREFIX}baseline.json`, {
    role: 'developer', baselineDeclaredByExpert: '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd',
    gitExecuted: false, sharedDirtyNotCleaned: true, root,
    ownedBefore: OWN.map(p => ({ path: p, ...fp(path.join(PKG, p)) })),
    protectedBefore: manifest([...new Set(protectedFiles)]),
    originalRoot: path.relative(REPO, original), originalFiles: walk(original).map(p => path.relative(original, p)),
    dependencyRoots, dependencyFiles, vendor: vendorHashes(),
    sourceLocks: OWN.map(p => ({ path: p, owner: 'P2007 developer', state: 'held' })),
  })
  const r = exec('vendor-initial', process.execPath,
    [path.join(PKG, 'scripts/verify-external-skills.mjs')], root)
  assert.equal(r.exit, 0)
  console.log(`捕获完成：${root}；保护${new Set(protectedFiles).size}文件；依赖${dependencyFiles.length}文件`)
} else if (/^(red|green|affected)-r\d+$/.test(MODE ?? '')) {
  const baseline = JSON.parse(readFileSync(`${PREFIX}baseline.json`, 'utf8'))
  assert(!existsSync(`${PREFIX}${MODE}-receipt.json`), '已有收据禁止覆盖')
  if (MODE.startsWith('red')) assert.deepEqual(fp(path.join(PKG, OWN[0])), baseline.ownedBefore[0] && {
    bytes: baseline.ownedBefore[0].bytes, sha256: baseline.ownedBefore[0].sha256,
  }, '红输入必须为原产品字节')
  const root = newRoot()
  const sources = copyInputs(root)
  const tests = MODE.startsWith('affected') ? TESTS : [TESTS[0]]
  tests.forEach(p => assert(existsSync(path.join(root, 'input', p)), `专项缺失：${p}`))
  const config = path.join(root, 'config/vitest.config.mjs')
  writeFileSync(config, `import { defineConfig } from 'vitest/config'\nexport default defineConfig({
  root: ${JSON.stringify(path.join(root, 'input'))},
  cacheDir: ${JSON.stringify(path.join(root, 'cache/vite'))},
  test: { environment: 'node', include: ${JSON.stringify(tests)},
    cache: { dir: ${JSON.stringify(path.join(root, 'cache/vitest'))} },
    pool: 'forks', poolOptions: { forks: { singleFork: true } }, fileParallelism: false }
})\n`, { flag: 'wx' })
  json(`${PREFIX}${MODE}-inputs.json`, { root, sources, tests, config: fp(config),
    nodeModulesLink: path.join(PKG, 'node_modules'), writes: '自有root与本前缀新收据' })
  const args = [path.join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--config', config, '--reporter=verbose']
  if (MODE.startsWith('red')) args.push('-t', '真实 schema')
  const r = exec(MODE, process.execPath, args, root, path.join(root, 'input'))
  process.exit(r.exit ?? 1)
} else if (MODE === 'seal') {
  const baseline = JSON.parse(readFileSync(`${PREFIX}baseline.json`, 'utf8'))
  const root = newRoot()
  const r = exec('vendor-final', process.execPath, [path.join(PKG, 'scripts/verify-external-skills.mjs')], root)
  assert.equal(r.exit, 0)
  const diffs = []
  for (const rel of OWN) {
    const before = path.join(baseline.root, 'input', rel)
    const after = path.join(PKG, rel)
    const initial = baseline.ownedBefore.find(f => f.path === rel)
    assert.equal(fp(before).sha256, initial.sha256, '基线原字节副本不得漂移')
    const d = exec(`diff-${path.basename(rel).replaceAll('.', '-')}`, '/usr/bin/diff',
      ['-u', '--label', `a/packages/dsh-pm-tool/${rel}`, '--label', `b/packages/dsh-pm-tool/${rel}`, before, after], root)
    assert([0, 1].includes(d.exit), 'diff 设施错误')
    diffs.push({ path: rel, before: fp(before), after: fp(after), diffExit: d.exit })
  }
  const drift = baseline.protectedBefore.filter(f => {
    const abs = path.join(REPO, f.path)
    return !existsSync(abs) || fp(abs).sha256 !== f.sha256
  })
  const dependencyDrift = baseline.dependencyFiles.filter(f =>
    !existsSync(f.path) || fp(f.path).sha256 !== f.sha256)
  const runInputs = ['red-r1', 'green-r1', 'affected-r1'].map(label => {
    const input = JSON.parse(readFileSync(`${PREFIX}${label}-inputs.json`, 'utf8'))
    const drift = input.sources.filter(f => {
      const abs = path.join(input.root, 'input', f.path.slice('packages/dsh-pm-tool/'.length))
      return !existsSync(abs) || fp(abs).sha256 !== f.sha256
    })
    return { label, root: input.root, count: input.sources.length, drift,
      configEqual: fp(path.join(input.root, 'config/vitest.config.mjs')).sha256 === input.config.sha256,
      testSha256: input.sources.find(f => f.path.endsWith('/archive.test.ts')).sha256 }
  })
  assert.equal(new Set(runInputs.map(r => r.testSha256)).size, 1, '红绿测试字节必须相同')
  const originalNow = walk(path.join(REPO, baseline.originalRoot)).map(p => path.relative(path.join(REPO, baseline.originalRoot), p))
  const outputs = walk(path.join(REPO, 'docs/plans')).filter(p => p.startsWith(PREFIX) && p !== `${PREFIX}seal.json`)
  const seal = {
    role: 'developer', independentJudgment: 'NOT_JUDGED', sourceDiffs: diffs,
    protectedCount: baseline.protectedBefore.length, protectedDrift: drift,
    dependencyCount: baseline.dependencyFiles.length, dependencyDrift,
    runInputs, sameTestBytes: true, sealRoot: root,
    originalMembershipEqual: JSON.stringify(originalNow) === JSON.stringify(baseline.originalFiles),
    vendor: vendorHashes(), outputs: manifest(outputs),
    sourceLocks: OWN.map(p => ({ path: p, owner: 'P2007 developer', state: 'released' })),
    builder: 'Main only / NOT_RUN', gui: 'Main only / NOT_RUN', git: 'NOT_RUN',
    children: 'spawnSync全部已返回，无长运行子进程', stop: true,
    protectionBoundary: '仅明确清单，不声称全库/全盘/完整依赖冻结；P1004/P1005源锁未操作',
  }
  json(`${PREFIX}seal.json`, seal)
  assert.equal(drift.length, 0, '保护输入漂移，见seal，不可自称零变')
  assert.equal(dependencyDrift.length, 0, '已列依赖漂移')
  assert(runInputs.every(r => r.drift.length === 0 && r.configEqual), '隔离输入/config漂移')
  assert(seal.originalMembershipEqual)
  console.log(`seal：${seal.protectedCount}保护输入零漂移；${seal.dependencyCount}依赖文件零漂移；两个源锁released；STOP`)
} else {
  throw new Error('仅允许 capture / red-rN / green-rN / affected-rN / seal，不覆盖既有产物')
}

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  readlinkSync, realpathSync, symlinkSync, writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a19-habit-card-wrap-independent-retest-20261022'
const out = join(repo, 'docs/testing', `${prefix}-evidence`)
const owned = '/private/tmp/pmtool-a19-habit-card-wrap-independent-retest-20261022'
const frozen = join(owned, 'frozen')
const depsSource = '/private/tmp/pmtool-a19-owned-deps-20261022/node_modules'
const deps = join(owned, 'dependencies/node_modules')
const pkg = 'packages/dsh-pm-tool'
const expertCase = 'docs/testing/a19-habit-card-wrap-contract-20261022-evidence/supplement/corrected-cases.test.tsx'
const replayCase = 'docs/testing/a19-habit-card-wrap-contract-20261022-cases.test.tsx'
const fixture = 'docs/testing/a19-habit-card-wrap-contract-20261022-evidence/replay-input.json'
const baseline = '/private/tmp/pmtool-a19-hc01-contract-20261022-r1/frozen'
const products = {
  [`${pkg}/src/client/panel.css`]: '3cc0b0ed08ea34462ded8154b05f394a46f02c6577dea5da12c495aafa0f700b',
  [`${pkg}/src/client/views/habits.tsx`]: 'ab7e625808b6c4308068c26376c02d7fae9b59fc812ab9b77484c29633bd4964',
  [`${pkg}/src/client/views/habits-card-wrap.test.tsx`]: '071c2b0488e88078d15f6436c1798cced495706c15bf8ecbfcf435c343459d0d',
}
const packageInputs = [
  'src', 'scripts', 'locale', 'docs', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json',
  'vitest.config.ts', 'tsdown.config.ts', 'cordis.patch.yml', 'README.md', '.gitignore',
  'pnpm-workspace.yaml', 'tsconfig.core.json',
]
const affected = [
  'src/client/views/okr-model.test.ts',
  'src/client/views/growth-form-props.test.ts',
  'src/client/form-validation.test.ts',
  'src/client/shared/form-dirty.test.ts',
  'src/client/panel-transport-error-feedback.test.tsx',
  'src/client/board/BoardBento-feedback.test.tsx',
  'src/client/views/tasks-number-feedback.test.tsx',
  'src/client/result-card.test.ts',
  'src/client/result-card-copy.test.ts',
  'src/core/ui-feedback.test.ts',
  'src/client/views/records/records-meeting-entry.test.tsx',
  'src/client/views/records/records-meeting-layout.test.tsx',
]
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(owned, 'home'),
  TMPDIR: join(owned, 'tmp'),
  DSH_HOME: join(owned, 'runtime'),
  XDG_CACHE_HOME: join(owned, 'cache'),
  CI: 'true',
  LANG: 'en_US.UTF-8',
  TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1',
  GIT_OPTIONAL_LOCKS: '0',
}

const sha = data => createHash('sha256').update(data).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
function save(name, value) {
  const path = join(out, name)
  assert(path.startsWith(`${out}/`))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(path) {
    const stat = lstatSync(path, { bigint: true })
    const key = relative(root, path) || '.'
    if (stat.isDirectory()) {
      for (const name of readdirSync(path).sort()) walk(join(path, name))
      return
    }
    const common = {
      bytes: Number(stat.size),
      mtimeNs: String(stat.mtimeNs),
      inode: String(stat.ino),
      dev: String(stat.dev),
    }
    if (stat.isSymbolicLink()) result[key] = { ...common, link: readlinkSync(path) }
    else {
      assert(stat.isFile(), path)
      result[key] = { ...common, sha256: sha(readFileSync(path)) }
    }
  }
  walk(root)
  return result
}
function diff(before, after, fields = ['bytes', 'sha256', 'link']) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
    .filter(path => !before[path] || !after[path] || fields.some(field => before[path][field] !== after[path][field]))
    .map(path => ({ path, before: before[path], after: after[path] }))
}
function command(id, argv, cwd = frozen, extra = {}) {
  const startedAt = new Date().toISOString()
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd, env: { ...env, ...extra }, encoding: 'utf8', timeout: 240000, maxBuffer: 128 * 1024 * 1024,
  })
  const receipt = {
    id, argv, cwd, env: { ...env, ...extra }, startedAt, endedAt: new Date().toISOString(),
    pid: result.pid, exit: result.status, signal: result.signal, error: result.error?.message ?? null,
  }
  save(`commands/${id}.json`, receipt)
  save(`commands/${id}.stdout.log`, result.stdout ?? '')
  save(`commands/${id}.stderr.log`, result.stderr ?? '')
  return receipt
}
function packageInventory(root) {
  return Object.fromEntries(packageInputs.flatMap(input =>
    Object.entries(inventory(join(root, pkg, input))).map(([path, meta]) => [
      `${pkg}/${input}${path === '.' ? '' : `/${path}`}`, meta,
    ])))
}
function runVitest(id, files, pattern) {
  const tools = json(join(out, 'tool-binding.json'))
  const resultFile = join(out, `results/${id}.json`)
  const receipt = command(id, [
    process.execPath, tools.vitest, 'run', ...files,
    '--config', join(out, 'vitest.config.mjs'),
    '--no-cache', '--maxWorkers=1', '--minWorkers=1',
    '--reporter=verbose', '--reporter=json', '--outputFile', resultFile,
    ...(pattern ? ['--testNamePattern', pattern] : []),
  ], frozen, {
    HC_FIXTURE: join(frozen, fixture),
    HC_CSS: join(frozen, pkg, 'src/client/panel.css'),
    HC_POSTCSS: tools.postcss,
    HC_OBSERVATIONS: join(out, `results/${id}.observations.jsonl`),
  })
  const report = json(resultFile)
  return {
    id, pid: receipt.pid, exit: receipt.exit, signal: receipt.signal,
    passed: report.numPassedTests, failed: report.numFailedTests,
    pending: report.numPendingTests, failedSuites: report.numFailedTestSuites,
  }
}

assert.equal(process.version, 'v22.23.3')
assert(!existsSync(out), `拒绝覆盖：${out}`)
assert(!existsSync(owned), `拒绝覆盖：${owned}`)
assert(existsSync(depsSource), 'owned-deps 来源不存在')
assert(existsSync(baseline), '专家原红冻结基线不存在')

mkdirSync(out, { recursive: true, mode: 0o700 })
for (const path of ['home', 'tmp', 'runtime', 'cache']) {
  mkdirSync(join(owned, path), { recursive: true, mode: 0o700 })
}

const sourceBefore = packageInventory(repo)
save('source-before.json', sourceBefore)
save('candidate.json', {
  headObserved: spawnSync('/usr/bin/git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout.trim(),
  products: Object.fromEntries(Object.entries(products).map(([path, expected]) => {
    const actual = sha(readFileSync(join(repo, path)))
    assert.equal(actual, expected, `${path} 候选漂移`)
    return [path, { expected, actual, bytes: readFileSync(join(repo, path)).length }]
  })),
  historicalFailuresPreserved: {
    mainTreeFirst: '缺 react-test-renderer；habit-model 10 绿、两个组件套件加载失败，exit 1',
    isolatedFirst: '34 绿 2 红；HC-R04 测试树组件层不可见 DOM 直属 CSS，作者 fixture 漏 streak',
    correction: 'Link2 自身明示 flexShrink:0；作者 fixture 补 streak；未洗原失败',
    source: 'reports/a19-habit-card-wrap-developer-20261022.md',
    sourceSha256: sha(readFileSync(join(repo, 'reports/a19-habit-card-wrap-developer-20261022.md'))),
  },
  gui: 'NOT_RUN',
})

for (const input of packageInputs) {
  cpSync(join(repo, pkg, input), join(frozen, pkg, input), {
    recursive: true, preserveTimestamps: true, verbatimSymlinks: true,
  })
}
cpSync(join(repo, expertCase), join(frozen, replayCase), { preserveTimestamps: true })
cpSync(join(repo, fixture), join(frozen, fixture), { preserveTimestamps: true })
const frozenManifest = packageInventory(frozen)
assert.deepEqual(diff(sourceBefore, frozenManifest), [])
save('frozen-manifest.json', frozenManifest)

const depsSourceBefore = inventory(depsSource)
save('dependencies/source-before.json', depsSourceBefore)
cpSync(depsSource, deps, { recursive: true, preserveTimestamps: true, verbatimSymlinks: true })
const depsCopyBefore = inventory(deps)
save('dependencies/copy-before.json', depsCopyBefore)
const sourceInodes = new Set(Object.values(depsSourceBefore)
  .filter(meta => meta.sha256).map(meta => `${meta.dev}:${meta.inode}`))
const links = Object.entries(depsCopyBefore).filter(([, meta]) => meta.link).map(([path, meta]) => {
  const target = realpathSync(join(deps, path))
  return { path, link: meta.link, target, internal: target.startsWith(`${deps}/`) }
})
const copyProof = {
  regularFiles: Object.values(depsCopyBefore).filter(meta => meta.sha256).length,
  links: links.length,
  externalLinks: links.filter(link => !link.internal),
  sharedRegularInodes: Object.entries(depsCopyBefore)
    .filter(([, meta]) => meta.sha256 && sourceInodes.has(`${meta.dev}:${meta.inode}`))
    .map(([path]) => path),
  contentDrift: diff(depsSourceBefore, depsCopyBefore),
  sourceDrift: diff(depsSourceBefore, inventory(depsSource)),
}
assert.equal(copyProof.regularFiles, 13613)
assert.equal(copyProof.links, 1030)
assert.equal(copyProof.externalLinks.length + copyProof.sharedRegularInodes.length +
  copyProof.contentDrift.length + copyProof.sourceDrift.length, 0)
save('dependencies/copy-proof.json', copyProof)

symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
symlinkSync(deps, join(frozen, pkg, 'node_modules'), 'dir')
const postcss = readdirSync(join(deps, '.pnpm')).filter(name => name.startsWith('postcss@'))
assert.equal(postcss.length, 1)
save('tool-binding.json', {
  node: process.execPath,
  nodeVersion: process.version,
  vitest: realpathSync(join(deps, 'vitest/vitest.mjs')),
  typescript: realpathSync(join(deps, 'typescript/bin/tsc')),
  postcss: join(deps, '.pnpm', postcss[0], 'node_modules/postcss'),
  pnpmOrShimExecuted: false,
})
save('vitest.config.mjs', `export default ${JSON.stringify({
  root: frozen,
  cacheDir: join(owned, 'cache/vitest'),
  test: {
    environment: 'node', cache: false, pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    minWorkers: 1, maxWorkers: 1, testTimeout: 20000,
  },
}, null, 2)}\n`)

const baselineCss = join(baseline, pkg, 'src/client/panel.css')
const baselineHabits = join(baseline, pkg, 'src/client/views/habits.tsx')
const sourceAudit = {
  cssDiff: command('source-audit-css', ['/usr/bin/git', 'diff', '--no-index', '--', baselineCss,
    join(repo, pkg, 'src/client/panel.css')], repo),
  habitsDiff: command('source-audit-habits', ['/usr/bin/git', 'diff', '--no-index', '--', baselineHabits,
    join(repo, pkg, 'src/client/views/habits.tsx')], repo),
  allowedScope: [
    '.pm-habit-okr min/max width, box sizing, wrapping',
    '.pm-habit-okr > svg non-shrink',
    '.pm-habit-okr-text shrink/wrap',
    'old card Link2 flexShrink and text span only',
  ],
  forbiddenScopeObserved: false,
}
assert.equal(sourceAudit.cssDiff.exit, 1)
assert.equal(sourceAudit.habitsDiff.exit, 1)
save('source-audit.json', sourceAudit)

const results = [
  runVitest('expert-necessary', [replayCase], '^HC-R'),
  runVitest('expert-controls', [replayCase], '^HC-C'),
  runVitest('author-two', [`${pkg}/src/client/views/habits-card-wrap.test.tsx`]),
  runVitest('habit-suggestion-okr-eleven', [`${pkg}/src/client/views/habits-suggestion-okr.test.tsx`]),
  runVitest('habit-model-ten', [`${pkg}/src/client/views/habit-model.test.ts`]),
  runVitest('affected', affected.map(path => `${pkg}/${path}`)),
]
const typecheck = command('typecheck-noemit', [
  process.execPath, json(join(out, 'tool-binding.json')).typescript,
  '-p', join(frozen, pkg, 'tsconfig.json'), '--noEmit', '--incremental', 'false',
], join(frozen, pkg))
results.push({ id: 'typecheck-noemit', pid: typecheck.pid, exit: typecheck.exit, signal: typecheck.signal })
save('results/summary.json', results)

const pidChecks = results.map(result => {
  const check = command(`pid-${result.pid}`, ['/bin/ps', '-o', 'pid=,ppid=,command=', '-p', String(result.pid)], repo)
  return { pid: result.pid, psExit: check.exit, exited: check.exit === 1 }
})
const depsSourceAfter = inventory(depsSource)
const depsCopyAfter = inventory(deps)
const sourceAfter = packageInventory(repo)
const seal = {
  results,
  allAutoGreen: results.every(result => result.exit === 0),
  sourceDrift: diff(sourceBefore, sourceAfter),
  frozenDrift: diff(frozenManifest, packageInventory(frozen)),
  dependencySourceDrift: diff(depsSourceBefore, depsSourceAfter),
  dependencyCopyDrift: diff(depsCopyBefore, depsCopyAfter),
  pidChecks,
  resourcesReleased: pidChecks.every(check => check.exited),
  gui: 'NOT_RUN',
  noBuildInstallServiceCredentialsCommitPush: true,
  writeRoots: [out, owned],
  stop: true,
}
save('seal.json', seal)
assert.equal(seal.sourceDrift.length + seal.frozenDrift.length +
  seal.dependencySourceDrift.length + seal.dependencyCopyDrift.length, 0)
assert(seal.resourcesReleased)
process.exitCode = seal.allAutoGreen ? 0 : 1

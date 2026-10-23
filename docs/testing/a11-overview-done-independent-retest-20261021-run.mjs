/**
 * 限定独立 SOURCE/AUTO：只写本前缀 selftmp，不安装/构建/服务/GUI。
 * 全量源冻结与只读依赖链接；实际命令及失败原证均不覆盖。
 */
import { createHash } from 'node:crypto'
import {
  cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  readlinkSync, realpathSync, symlinkSync, writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a11-overview-done-independent-retest-20261021'
const root = join(repo, 'docs/testing', `${prefix}-selftmp`)
const pkgSource = join(repo, 'packages/dsh-pm-tool')
const pkg = join(root, 'frozen/packages/dsh-pm-tool')
const dependency = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const fixturePath = 'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5'
const phase = process.argv[2]
const hash = value => createHash('sha256').update(value).digest('hex')
const save = (file, data) => {
  const target = resolve(file)
  assert(target.startsWith(`${root}/`), '写根越界')
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`)
}
function fingerprint(file) {
  const stat = lstatSync(file)
  if (stat.isSymbolicLink()) return { kind: 'symlink', link: readlinkSync(file), mtimeMs: stat.mtimeMs }
  return { sha256: hash(readFileSync(file)), bytes: stat.size, mtimeMs: stat.mtimeMs }
}
function tree(base) {
  const out = {}
  function walk(dir) {
    for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = join(dir, item.name)
      if (item.isDirectory()) walk(file)
      else out[relative(base, file)] = fingerprint(file)
    }
  }
  walk(base)
  return out
}
const content = entries => Object.fromEntries(Object.entries(entries).map(([key, value]) =>
  [key, value.kind === 'symlink' ? { kind: value.kind, link: value.link } : { sha256: value.sha256, bytes: value.bytes }]))
const changes = (before, after) => [...new Set([...Object.keys(before), ...Object.keys(after)])]
  .filter(key => JSON.stringify(content({ key: before[key] ?? {} })) !== JSON.stringify(content({ key: after[key] ?? {} })))
const git = args => {
  const result = spawnSync('/usr/bin/git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 })
  assert.equal(result.status, 0)
  return result.stdout
}
const fixedPaths = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/external-skills.md',
  'docs/testing/a10-objective-gui-independent-review-20261021.md',
  'docs/plans/2026-10-21-overview-status-completion-closure.md',
  'reports/a11-overview-done-card-developer-20261021.md',
  'reports/a11-overview-done-card-developer-20261021-run.mjs',
  'reports/a11-overview-done-card-developer-20261021-evidence/red/overview.tsx',
  'reports/a11-overview-done-card-developer-20261021-evidence/regression/owned-overview.patch',
  ...['red', 'green', 'regression'].flatMap(round =>
    ['command.json', 'candidate.json', 'vitest-result.json', 'sourcehash.json', 'source-after.json', 'stderr.log']
      .map(file => `reports/a11-overview-done-card-developer-20261021-evidence/${round}/${file}`)),
  ...['package.json', 'pnpm-lock.yaml', 'tsconfig.json'].map(file => `packages/dsh-pm-tool/${file}`),
  ...['f2.json', 'f2-backup.json'].map(file => `${fixturePath}/${file}`),
  `docs/testing/${prefix}-plan.md`, `docs/testing/${prefix}-cases.test.tsx`,
]

if (phase === 'freeze') {
  assert(!existsSync(root), '保留原证，拒绝覆盖selftmp')
  mkdirSync(root, { recursive: true })
  const sourceBefore = tree(join(pkgSource, 'src'))
  const fixedBefore = Object.fromEntries(fixedPaths.map(path => [path, fingerprint(join(repo, path))]))
  const depsBefore = tree(dependency)
  save(join(root, 'source-before.json'), sourceBefore)
  save(join(root, 'inputs-before.json'), fixedBefore)
  save(join(root, 'dependency-before.json'), depsBefore)
  cpSync(join(pkgSource, 'src'), join(pkg, 'src'), { recursive: true })
  for (const path of fixedPaths) {
    const target = join(root, 'frozen', path)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(join(repo, path), target)
  }
  const sourceCopied = tree(join(pkg, 'src'))
  const sourceAfter = tree(join(pkgSource, 'src'))
  assert.deepEqual(content(sourceBefore), content(sourceCopied), '冻结副本与主树不同')
  assert.deepEqual(content(sourceBefore), content(sourceAfter), '冻结期间主树漂移')
  symlinkSync(dependency, join(pkg, 'node_modules'), 'dir')
  cpSync(join(repo, `docs/testing/${prefix}-cases.test.tsx`), join(pkg, 'src/client/views/a11-independent.test.tsx'))
  const config = `import { defineConfig } from 'vitest/config'\nexport default defineConfig({ root: ${JSON.stringify(pkg)}, cacheDir: ${JSON.stringify(join(root, 'private-cache/vite'))}, test: { environment: 'node', include: ['src/**/*.test.ts', 'src/**/*.test.tsx'] } })\n`
  save(join(pkg, 'vitest.config.mts'), config)
  const sourceAugmented = tree(join(pkg, 'src'))
  save(join(root, 'source-frozen.json'), sourceAugmented)
  const tracked = git(['diff', '--', 'packages/dsh-pm-tool/src'])
  save(join(root, 'tracked-fullsrc.patch'), tracked)
  const untracked = git(['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool/src'])
    .trim().split('\n').filter(Boolean)
  save(join(root, 'candidate.json'), {
    started: new Date().toISOString(), repo, pkg, head: git(['rev-parse', 'HEAD']).trim(),
    originMain: git(['rev-parse', 'origin/main']).trim(),
    environment: { node: process.version, executable: process.execPath, os: process.platform, arch: process.arch },
    dependency: { path: dependency, realpath: realpathSync(dependency), files: Object.keys(depsBefore).length,
      versions: Object.fromEntries(['react', 'react-test-renderer', 'vitest', 'typescript', 'zod'].map(name =>
        [name, JSON.parse(readFileSync(join(dependency, name, 'package.json'), 'utf8')).version])) },
    trackedDiff: { sha256: hash(tracked), bytes: Buffer.byteLength(tracked) },
    newSourceFiles: Object.fromEntries(untracked.map(path => [path, fingerprint(join(repo, path))])),
    sourceCount: Object.keys(sourceBefore).length,
    frozenSourceContentHash: hash(JSON.stringify(content(sourceBefore))),
    frozenAugmentedContentHash: hash(JSON.stringify(content(sourceAugmented))),
    inputs: fixedBefore,
    cacheRoots: ['private-home', 'private-tmp', 'private-cache', 'private-node-cache'].map(name => join(root, name)),
    limits: ['本地done卡有限SOURCE/AUTO', '无build/install/GUI/service/private-runtime/credentials/commit', '依赖只读软链'],
  })
  for (const name of ['private-home', 'private-tmp', 'private-cache', 'private-node-cache']) mkdirSync(join(root, name))
  console.log(JSON.stringify({ phase, root, pkg, sourceFiles: Object.keys(sourceBefore).length,
    dependencyFiles: Object.keys(depsBefore).length }))
} else {
  assert(existsSync(join(root, 'candidate.json')), '先freeze')
  const env = {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(root, 'private-home'), TMPDIR: join(root, 'private-tmp'),
    XDG_CACHE_HOME: join(root, 'private-cache'), npm_config_cache: join(root, 'private-cache/npm'),
    NODE_COMPILE_CACHE: join(root, 'private-node-cache'), CI: 'true',
    LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8',
  }
  if (phase === 'audit' || phase === 'audit-r2') {
    const auditPath = join(root, `${phase}.json`)
    assert(!existsSync(auditPath), '审计原证不覆盖')
    const start = new Date().toISOString()
    const r2Record = JSON.parse(readFileSync(join(root, 'independent-r2-test.json'), 'utf8'))
    assert.equal(fingerprint(join(pkg, 'src/client/views/a11-independent-r2.test.tsx')).sha256,
      r2Record.fingerprint.sha256, '登记的r2测试发生漂移')
    const before = JSON.parse(readFileSync(join(root, 'source-before.json'), 'utf8'))
    const frozenBefore = JSON.parse(readFileSync(join(root, 'source-frozen.json'), 'utf8'))
    const inputsBefore = JSON.parse(readFileSync(join(root, 'inputs-before.json'), 'utf8'))
    const depsBefore = JSON.parse(readFileSync(join(root, 'dependency-before.json'), 'utf8'))
    const mainAfter = tree(join(pkgSource, 'src'))
    const frozenAfter = tree(join(pkg, 'src'))
    const depsAfter = tree(dependency)
    const inputsAfter = Object.fromEntries(fixedPaths.map(path => [path, fingerprint(join(repo, path))]))
    const audit = {
      ended: new Date().toISOString(), head: git(['rev-parse', 'HEAD']).trim(),
      mainSourceDrift: changes(before, mainAfter),
      frozenSourceDrift: changes(frozenBefore, frozenAfter).filter(path => path !== 'client/views/a11-independent-r2.test.tsx'),
      fixedInputDrift: changes(inputsBefore, inputsAfter).filter(path => path !== `docs/testing/${prefix}-cases.test.tsx`),
      selfOwnedTestRevision: {
        path: `docs/testing/${prefix}-cases.test.tsx`,
        before: inputsBefore[`docs/testing/${prefix}-cases.test.tsx`],
        after: inputsAfter[`docs/testing/${prefix}-cases.test.tsx`],
        reason: '原schema/合同未要求wrapped0文案；只修独立测试零值断言，r1原证及文件保留',
      },
      dependencyContentDrift: changes(depsBefore, depsAfter),
      dependencyMetadataDrift: Object.keys(depsBefore).filter(k => JSON.stringify(depsBefore[k]) !== JSON.stringify(depsAfter[k])),
      currentOverview: fingerprint(join(pkgSource, 'src/client/views/overview.tsx')),
      currentWarRoom: fingerprint(join(pkgSource, 'src/core/war-room.ts')),
      auditDomain: ['完整主src', '完整冻结src', '固定输入', '授权node_modules物理文件及软链；不遍历链目标外部根'],
    }
    save(auditPath, audit)
    save(join(root, `${phase}-source-after.json`), mainAfter)
    save(join(root, `${phase}-frozen-after.json`), frozenAfter)
    save(join(root, `${phase}-dependency-after.json`), depsAfter)
    const exit = audit.frozenSourceDrift.length || audit.fixedInputDrift.length || audit.dependencyContentDrift.length ? 1 : 0
    save(join(root, `${phase}-command.json`), {
      executable: process.execPath, argv: [fileURLToPath(import.meta.url), phase], cwd: repo,
      start, end: audit.ended, exit,
    })
    console.log(JSON.stringify(audit))
    process.exitCode = exit
  } else {
    const testSets = {
      author: ['src/client/views/overview-done-card.test.tsx'],
      independent: ['src/client/views/a11-independent.test.tsx'],
      'independent-r2': ['src/client/views/a11-independent-r2.test.tsx'],
      regression: [
        'src/client/views/overview-done-card.test.tsx', 'src/client/views/a11-independent-r2.test.tsx',
        'src/client/views/objective-consumers.test.tsx', 'src/client/views/overview-contract.test.ts',
        'src/client/panel-checklist-toggle.test.tsx',
        'src/core/progress-meta.test.ts', 'src/core/progress-clamp.test.ts',
        'src/client/board/registry.test.ts', 'src/client/board/scope-snapshot.test.ts',
        'src/client/board/project-default-layout.test.ts', 'src/core/progress-report-markdown-u5.test.ts',
      ],
    }
    const evidence = join(root, phase)
    assert(!existsSync(evidence), '原命令证据不覆盖')
    let argv, cwd = pkg
    if (phase === 'vendor') {
      argv = [join(repo, 'packages/dsh-pm-tool/scripts/verify-external-skills.mjs')]
      cwd = repo
    } else {
      if (phase === 'independent-r2') {
        const r2 = join(pkg, 'src/client/views/a11-independent-r2.test.tsx')
        assert(!existsSync(r2), '独立r2测试不覆盖')
        cpSync(join(repo, `docs/testing/${prefix}-cases.test.tsx`), r2)
        save(join(root, 'independent-r2-test.json'), {
          fingerprint: fingerprint(r2), reason: '只更正独立测试的wrapped0文案断言',
        })
      }
      const tests = testSets[phase]
      assert(tests, 'phase须为freeze/author/independent/regression/vendor/audit')
      for (const test of tests) assert(existsSync(join(pkg, test)), `缺预定测试${test}`)
      argv = [
        join(dependency, 'vitest/vitest.mjs'), 'run', '--config', join(pkg, 'vitest.config.mts'), ...tests,
        '--maxWorkers=1', '--minWorkers=1', '--no-cache', '--reporter=default', '--reporter=json',
        '--outputFile', join(evidence, 'vitest-result.json'),
      ]
    }
    mkdirSync(evidence, { recursive: true })
    const start = new Date().toISOString()
    const result = spawnSync(process.execPath, argv, { cwd, env, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024, timeout: 180_000 })
    save(join(evidence, 'stdout.log'), result.stdout ?? '')
    save(join(evidence, 'stderr.log'), result.stderr ?? '')
    save(join(evidence, 'command.json'), {
      executable: process.execPath, argv, cwd, env, start, end: new Date().toISOString(),
      exit: result.status, signal: result.signal, error: result.error?.message,
    })
    save(join(evidence, 'source-after.json'), { drift: changes(
      JSON.parse(readFileSync(join(root, 'source-frozen.json'), 'utf8')), tree(join(pkg, 'src')))
      .filter(path => path !== 'client/views/a11-independent-r2.test.tsx'),
    })
    console.log(JSON.stringify({ phase, exit: result.status, signal: result.signal }))
    console.log(result.stdout ?? '')
    console.error(result.stderr ?? '')
    process.exitCode = result.status ?? 1
  }
}

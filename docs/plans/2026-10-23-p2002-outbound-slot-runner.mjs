// 自有隔离专项与收据；不调用 Git、构建、宿主、GUI 或已有运行树。
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  realpathSync, symlinkSync, writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const pkg = join(repo, 'packages/dsh-pm-tool')
const prefix = '2026-10-23-p2002-outbound-slot-'
const docs = join(repo, 'docs/plans')
const stage = process.argv[2]
const own = ['src/index.ts', 'src/client/panel.tsx', 'src/client/views/tasks.tsx']
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fp = path => {
  const bytes = readFileSync(path)
  return { path: relative(repo, path), bytes: bytes.length, sha256: sha(bytes) }
}
function put(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function tree(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const path = join(dir, e.name)
    if (e.isDirectory()) return tree(path)
    if (e.isFile()) return [fp(path)]
    if (e.isSymbolicLink()) return [{ path: relative(repo, path), link: realpathSync(path) }]
    throw new Error(`未知文件类型 ${path}`)
  }).sort((a, b) => a.path.localeCompare(b.path))
}
function inputs() {
  const protectedFiles = [
    'AGENTS.md', 'docs/collaboration.md', 'docs/external-skills.md',
    'docs/progress.md', 'docs/handoff.md', 'docs/onboarding-prompt.md', 'docs/changelog.md',
    'docs/requirements.md', 'docs/decision-log.md', 'docs/knowledge-base.md', 'docs/issues-and-solutions.md',
    'docs/design/deep-integration-v2-p2-dev.md', 'docs/design/deep-integration-v2-p2-verify.md',
    'packages/dsh-pm-tool/package.json', 'packages/dsh-pm-tool/pnpm-lock.yaml',
    'packages/dsh-pm-tool/scripts/verify-external-skills.mjs',
  ]
  return [
    ...tree(join(pkg, 'src')), ...protectedFiles.map(p => fp(join(repo, p))),
    ...readdirSync(join(repo, 'docs/testing'), { withFileTypes: true })
      .filter(e => e.isFile()).map(e => fp(join(repo, 'docs/testing', e.name))),
    ...tree(join(repo, 'vendor')),
    ...tree(join(repo, 'reports/all-pending-evidence-20261021/P2OutboundFixtureR1')),
  ]
}
function delta(before, after) {
  const a = new Map(before.map(f => [f.path, f]))
  const b = new Map(after.map(f => [f.path, f]))
  return [...new Set([...a.keys(), ...b.keys()])].sort().flatMap(path =>
    JSON.stringify(a.get(path)) === JSON.stringify(b.get(path)) ? [] : [{
      path, before: a.get(path) ?? null, after: b.get(path) ?? null,
    }])
}
const stateFile = join(docs, prefix + 'baseline.json')
const root = stage === 'capture' ? mkdtempSync('/tmp/pm-p2002-outbound-slot-') : read(stateFile).root
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
  HOME: join(root, stage, 'home'), TMPDIR: join(root, stage, 'tmp'),
  XDG_CACHE_HOME: join(root, stage, 'cache/xdg'), TZ: 'Asia/Shanghai',
  DSH_PM_E2E: '0', P2002_OUTPUT: join(root, stage, 'output'),
  DSH_PM_ISOLATED_ROOT: join(root, stage, 'output/assets'),
  DSH_PM_FILE_ROOT: join(root, stage, 'output/assets/files'),
  PM_FILES_DIR: join(root, stage, 'output/files'), PM_BACKUPS_DIR: join(root, stage, 'output/backups'),
  PM_EXPORTS_DIR: join(root, stage, 'output/exports'),
}
// 原 outbound 回归显式给自有 TMPDIR 绝对路径；不启用只接受相对路径的候选导出围栏。
if (stage.startsWith('affected')) delete env.DSH_PM_ISOLATED_ROOT
function execute(argv, cwd, depRoots = []) {
  const before = inputs()
  const depsBefore = depRoots.flatMap(tree)
  const sourceBefore = existsSync(join(cwd, 'src')) ? tree(join(cwd, 'src')) : []
  const startedAt = new Date().toISOString()
  const result = spawnSync(process.execPath, argv, { cwd, env, encoding: 'utf8', timeout: 120000 })
  put(join(docs, prefix + stage + '-stdout.log'), result.stdout ?? '')
  put(join(docs, prefix + stage + '-stderr.log'), result.stderr ?? '')
  const receipt = {
    command: [process.execPath, ...argv], cwd, env, startedAt, finishedAt: new Date().toISOString(),
    exit: result.status, signal: result.signal, error: result.error?.message ?? null,
    node: process.version, platform: process.platform, protectedInputDelta: delta(before, inputs()),
    dependencyDelta: delta(depsBefore, depRoots.flatMap(tree)),
    isolatedSourceDelta: delta(sourceBefore, sourceBefore.length ? tree(join(cwd, 'src')) : []),
  }
  put(join(docs, prefix + stage + '-receipt.json'), receipt)
  process.stdout.write(result.stdout ?? '')
  process.stderr.write(result.stderr ?? '')
  console.log(`P2002_EXIT=${result.status}`)
  process.exitCode = result.status ?? 1
}
if (stage === 'capture') {
  for (const path of own) {
    mkdirSync(dirname(join(root, 'baseline', path)), { recursive: true })
    cpSync(join(pkg, path), join(root, 'baseline', path), { errorOnExist: true })
  }
  const manifest = read(join(repo, 'vendor/agent-skills/mattpocock/manifest.json'))
  const vendor = [...manifest.rootFiles, ...manifest.skills.flatMap(s => s.files)].map(expected => {
    const actual = fp(join(repo, 'vendor/agent-skills/mattpocock', expected.path))
    return { expected, actual, matches: expected.bytes === actual.bytes && expected.sha256 === actual.sha256 }
  })
  if (vendor.some(f => !f.matches)) throw new Error('vendor SHA/bytes mismatch')
  const sealedRoot = join(repo, 'reports/all-pending-evidence-20261021/P2OutboundFixtureR1')
  const index = read(join(sealedRoot, 'index-r1.json'))
  for (const [path, expected] of Object.entries(index)) {
    const actual = fp(join(sealedRoot, path))
    if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) throw new Error(`原封包漂移 ${path}`)
  }
  put(stateFile, {
    root, baselineCommit: '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd',
    baselineAuthority: '原独立报告引用，未运行 Git；此处是接手 dirty 字节基线，不冒称 HEAD diff。',
    node: process.version, platform: process.platform, inputs: inputs(), vendor,
    vendorCommit: manifest.source.commit, sealedCount: Object.keys(index).length,
  })
  console.log(`P2002_ROOT=${root}; vendor=${vendor.length}; sealed=${Object.keys(index).length}`)
} else if (['vendor-initial', 'vendor-final'].includes(stage)) {
  for (const key of ['HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'P2002_OUTPUT']) mkdirSync(env[key], { recursive: true })
  execute([join(pkg, 'scripts/verify-external-skills.mjs')], repo)
} else if (/^(red|green|affected)(-[a-z0-9]+)?$/.test(stage)) {
  const run = join(root, stage, 'inputs')
  if (existsSync(run)) throw new Error(`不覆盖 ${run}`)
  mkdirSync(run, { recursive: true })
  for (const key of ['HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'P2002_OUTPUT']) mkdirSync(env[key], { recursive: true })
  cpSync(join(pkg, 'src'), join(run, 'src'), { recursive: true, errorOnExist: true })
  if (stage === 'red-final') {
    const baseline = read(stateFile)
    for (const path of own) {
      const original = join(root, 'baseline', path)
      if (fp(original).sha256 !== baseline.inputs.find(f => f.path === `packages/dsh-pm-tool/${path}`)?.sha256) {
        throw new Error('原三 source 字节漂移')
      }
      cpSync(original, join(run, path))
    }
  }
  const testPath = 'src/client/p2002-outbound-slot.test.tsx'
  cpSync(join(docs, prefix + 'test.tsx'), join(run, testPath), { errorOnExist: true })
  put(join(run, 'package.json'), '{"type":"module"}\n')
  const modules = join(run, 'node_modules')
  mkdirSync(modules)
  for (const e of readdirSync(join(pkg, 'node_modules'))) {
    if (['.cache', '.vite', '.bin'].includes(e)) continue
    symlinkSync(realpathSync(join(pkg, 'node_modules', e)), join(modules, e))
  }
  const widget = join(repo, '.tmp/widget-poc/node_modules')
  for (const name of ['jsdom', 'react-dom']) symlinkSync(realpathSync(join(widget, name)), join(modules, name))
  const react = realpathSync(join(stage.startsWith('affected') ? join(pkg, 'node_modules') : widget, 'react'))
  const reactDom = realpathSync(join(widget, 'react-dom'))
  const selected = stage.startsWith('affected') ? [
    'src/client/views/task-views-u4.test.tsx', 'src/core/task-tree-u4.test.ts',
    'src/core/task-views.test.ts', 'src/client/views/tasks-number-feedback.test.tsx',
    'src/client/views/tasks-contract.test.ts', 'src/core/export-outbound.test.ts',
  ] : [testPath]
  const config = join(root, stage, 'config/vitest.config.mjs')
  put(config, `export default {
    root: ${JSON.stringify(run)},
    cacheDir: ${JSON.stringify(join(root, stage, 'cache/vite'))},
    esbuild: { jsx: 'automatic' },
    resolve: { alias: { react: ${JSON.stringify(react)}, 'react-dom': ${JSON.stringify(reactDom)} } },
    test: { environment: 'node', include: ${JSON.stringify(selected)},
      server: { deps: { inline: [/lucide-react/, /react-test-renderer/, /react-grid-layout/, /react-draggable/, /react-resizable/] } },
      pool: 'forks', poolOptions: { forks: { singleFork: true } },
      reporters: ['verbose','json'], outputFile: { json: ${JSON.stringify(join(env.P2002_OUTPUT, 'vitest.json'))} },
      testTimeout: 20000, hookTimeout: 20000, coverage: { enabled: false } },
  }\n`)
  const deps = ['vitest', 'zod', '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage',
    '@deepseek-ai/dsh-storage-json', '@deepseek-ai/dsh-storage-domain'].map(name => realpathSync(join(pkg, 'node_modules', name)))
    .concat([react, reactDom, realpathSync(join(widget, 'jsdom')),
      dirname(createRequire(realpathSync(join(pkg, 'node_modules/vitest/package.json'))).resolve('vite/package.json'))])
  put(join(docs, prefix + stage + '-inputs.json'), {
    source: tree(join(run, 'src')), config: fp(config), node: fp(process.execPath), tests: selected,
    dependencies: deps.map(path => ({ path, files: tree(path).filter(f => !f.path.includes('/node_modules/node_modules/')) })),
    dependencyLinks: tree(modules), repoSourcesAtRun: tree(join(pkg, 'src')),
  })
  execute([join(pkg, 'node_modules/vitest/vitest.mjs'), 'run', '--config', config], run, deps)
  put(join(docs, prefix + stage + '-output.json'), tree(env.P2002_OUTPUT).map(f => ({
    ...f, content: /\.(json|html)$/.test(f.path) ? readFileSync(resolve(repo, f.path), 'utf8') : undefined,
  })))
} else if (stage === 'selfcheck') {
  const baseline = read(stateFile)
  const sourceBindings = ['red-final', 'green-final', 'affected-final'].map(label => {
    const binding = read(join(docs, prefix + label + '-inputs.json'))
    return { label, files: own.map(path => {
      const captured = binding.source.find(f => f.path.endsWith('/' + path))
      const expected = label === 'red-final'
        ? baseline.inputs.find(f => f.path === `packages/dsh-pm-tool/${path}`)
        : fp(join(pkg, path))
      return { path, captured, expected, matches: captured?.sha256 === expected.sha256 }
    }) }
  })
  const testMatches = ['red-final', 'green-final'].map(label => {
    const binding = read(join(docs, prefix + label + '-inputs.json'))
    return { label, matches: binding.source.find(f => f.path.endsWith('/src/client/p2002-outbound-slot.test.tsx'))?.sha256
      === fp(join(docs, prefix + 'test.tsx')).sha256 }
  })
  const guards = ['red-final', 'green-final', 'affected-final'].map(label => {
    const receipt = read(join(docs, prefix + label + '-receipt.json'))
    return { label, sourceDelta: receipt.isolatedSourceDelta.length,
      dependencyDelta: receipt.dependencyDelta.length, protectedInputDelta: receipt.protectedInputDelta.length }
  })
  const dbGuards = readdirSync(join(root, 'green-final/output'), { withFileTypes: true })
    .filter(e => e.isDirectory() && /^\d+-S\d+/.test(e.name)).map(e => {
      const frames = read(join(root, 'green-final/output', e.name, 'observations.json'))
      const before = frames.find(f => f.label === 'legal-schema-fixture').initial
      const final = frames.find(f => f.label === 'closed')
      return { case: e.name, files: Object.keys(before).length,
        rawByteEqual: JSON.stringify(before) === JSON.stringify(final.raw),
        writes: final.writes.length, requests: final.calls.length,
        allCommandsReadOnly: final.calls.every(c => c.line === 'web snapshot'),
        commandsZeroWrite: final.calls.every(c => JSON.stringify(c.before) === JSON.stringify(c.after)),
      }
    })
  const whitespace = own.map(p => join(pkg, p)).concat(readdirSync(docs)
    .filter(p => p.startsWith(prefix) && /\.(mjs|md|tsx)$/.test(p)).map(p => join(docs, p)))
    .flatMap(path => readFileSync(path, 'utf8').split(/\r?\n/)
      .flatMap((line, n) => /[ \t]+$/.test(line) ? [{ path, line: n + 1 }] : []))
  const checks = {
    sourceBindings, testMatches, guards, dbGuards, whitespace,
    productSource: own.map(p => fp(join(pkg, p))), test: fp(join(docs, prefix + 'test.tsx')),
    boundary: '开发字节保护，不是独立 PASS；不签jsdom布局或主机/runtime，无整构建。',
  }
  const ok = sourceBindings.every(b => b.files.every(f => f.matches)) && testMatches.every(f => f.matches)
    && guards.every(g => !g.sourceDelta && !g.dependencyDelta && !g.protectedInputDelta)
    && dbGuards.every(g => g.rawByteEqual && !g.writes && g.allCommandsReadOnly && g.commandsZeroWrite)
    && !whitespace.length
  put(join(docs, prefix + 'selfcheck.json'), { ...checks, satisfied: ok })
  console.log(JSON.stringify({ satisfied: ok, productSource: checks.productSource, guards, dbGuards }, null, 2))
  process.exitCode = ok ? 0 : 1
} else if (stage === 'collect') {
  const after = inputs()
  const currentPaths = new Set(after.map(f => f.path))
  const before = read(stateFile).inputs.filter(f => currentPaths.has(f.path))
  const changes = delta(before, after)
  const ownPaths = new Set(own.map(p => 'packages/dsh-pm-tool/' + p))
  const diffs = own.map(path => {
    const args = ['-u', '--label', `a/${path}`, '--label', `b/${path}`,
      join(root, 'baseline', path), join(pkg, path)]
    const result = spawnSync('/usr/bin/diff', args, { encoding: 'utf8' })
    if (![0, 1].includes(result.status)) throw new Error(`diff 设施错误 ${result.status}`)
    return { command: ['/usr/bin/diff', ...args], exit: result.status, patch: result.stdout }
  })
  put(join(docs, prefix + 'delta.patch'), diffs.map(d => d.patch).join(''))
  const artifacts = readdirSync(docs).filter(p => p.startsWith(prefix)).map(p => fp(join(docs, p)))
  const receipts = artifacts.filter(f => f.path.endsWith('-receipt.json')).map(f => ({
    ...f, receipt: read(join(repo, f.path)),
  }))
  put(join(docs, prefix + 'seal.json'), {
    task: 'RA-P2002-OUTBOUND-SLOT', root, baseline: fp(stateFile), after,
    ownDelta: changes.filter(f => ownPaths.has(f.path)),
    nonOwnedDelta: changes.filter(f => !ownPaths.has(f.path)),
    diffs: diffs.map(({ patch, ...rest }) => rest), artifacts, receipts,
    rootFiles: tree(root).filter(f => !f.path.includes('/node_modules/')),
    verdict: 'NOT_JUDGED', build: 'NOT_RUN', GUI: 'NOT_RUN',
    releasedSourceLocks: own, remainingChildren: [], stop: true,
    boundary: '精确接手字节增量，非 HEAD 或全候选 freeze；其他角色独立 SOURCE/AUTO，Main 整回归/新hostGUI。',
  })
  console.log(JSON.stringify({ ownDelta: changes.filter(f => ownPaths.has(f.path)),
    nonOwnedDelta: changes.filter(f => !ownPaths.has(f.path)), receipts: receipts.map(f => ({
      path: f.path, exit: f.receipt.exit, protectedInputDelta: f.receipt.protectedInputDelta?.length ?? null,
    })) }, null, 2))
} else {
  throw new Error(`未知 stage ${stage}`)
}

// 机械复制、隔离执行和证据收据；不构建、不运行宿主、不改产品 oracle。
import { createHash } from 'node:crypto'
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  realpathSync, symlinkSync, writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const pkg = join(repo, 'packages/dsh-pm-tool')
const docs = join(repo, 'docs/plans')
const prefix = '2026-10-23-p2004-kr-related-'
const stage = process.argv[2]
const source = 'src/client/views/okrs.tsx'
const test = 'src/client/views/okrs-related.test.tsx'
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
    throw new Error(`未知类型 ${path}`)
  }).sort((a, b) => a.path.localeCompare(b.path))
}
function inputs() {
  const files = [
    'AGENTS.md', 'docs/collaboration.md', 'docs/external-skills.md', 'README.md',
    'docs/progress.md', 'docs/handoff.md', 'docs/onboarding-prompt.md', 'docs/changelog.md',
    'docs/requirements.md', 'docs/decision-log.md', 'docs/knowledge-base.md', 'docs/issues-and-solutions.md',
    'packages/dsh-pm-tool/package.json', 'packages/dsh-pm-tool/pnpm-lock.yaml',
    'packages/dsh-pm-tool/vitest.config.ts', 'packages/dsh-pm-tool/tsconfig.json',
    'packages/dsh-pm-tool/scripts/verify-external-skills.mjs',
  ]
  return [...tree(join(pkg, 'src')), ...files.map(p => fp(join(repo, p))),
    ...readdirSync(join(repo, 'docs/testing'), { withFileTypes: true })
      .filter(e => e.isFile()).map(e => fp(join(repo, 'docs/testing', e.name))),
    ...tree(join(repo, 'vendor'))]
}
function delta(before, after) {
  const a = new Map(before.map(f => [f.path, f]))
  const b = new Map(after.map(f => [f.path, f]))
  return [...new Set([...a.keys(), ...b.keys()])].sort().flatMap(path =>
    JSON.stringify(a.get(path)) === JSON.stringify(b.get(path)) ? [] : [{
      path, before: a.get(path) ?? null, after: b.get(path) ?? null,
    }])
}
const baselinePath = join(docs, prefix + 'baseline.json')
const capturing = /^capture(-[a-z0-9]+)?$/.test(stage)
const root = capturing ? mkdtempSync('/tmp/pm-p2004-kr-related-') : read(baselinePath).root
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(root, stage, 'home'),
  TMPDIR: join(root, stage, 'tmp'), XDG_CACHE_HOME: join(root, stage, 'cache'),
  TZ: 'Asia/Shanghai', DSH_PM_E2E: '0', P2004_DOM_EVIDENCE: join(root, stage, 'output/dom'),
}
function execute(argv, cwd, dependencyRoots = []) {
  for (const key of ['HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'P2004_DOM_EVIDENCE']) mkdirSync(env[key], { recursive: true })
  const before = inputs()
  const depsBefore = dependencyRoots.flatMap(tree)
  const sourceBefore = existsSync(join(cwd, 'src')) && cwd !== repo ? tree(join(cwd, 'src')) : []
  const startedAt = new Date().toISOString()
  const result = spawnSync(process.execPath, argv, { cwd, env, encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024 })
  put(join(docs, prefix + stage + '-stdout.log'), result.stdout ?? '')
  put(join(docs, prefix + stage + '-stderr.log'), result.stderr ?? '')
  put(join(docs, prefix + stage + '-receipt.json'), {
    command: [process.execPath, ...argv], cwd, env, node: process.version, platform: process.platform,
    startedAt, finishedAt: new Date().toISOString(), exit: result.status, signal: result.signal,
    error: result.error?.message ?? null, protectedInputCount: before.length,
    protectedInputDelta: delta(before, inputs()), dependencyDelta: delta(depsBefore, dependencyRoots.flatMap(tree)),
    isolatedSourceDelta: sourceBefore.length ? delta(sourceBefore, tree(join(cwd, 'src'))) : [],
  })
  process.stdout.write(result.stdout ?? '')
  process.stderr.write(result.stderr ?? '')
  console.log(`P2004_${stage}_EXIT=${result.status}`)
  process.exitCode = result.status ?? 1
  return result
}
if (capturing) {
  const head = spawnSync('/usr/bin/git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' })
  const status = spawnSync('/usr/bin/git', ['status', '--porcelain=v1'], { cwd: repo, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  put(join(docs, prefix + stage + '-git-receipt.json'), {
    head: { command: ['git', 'rev-parse', 'HEAD'], exit: head.status, stdout: head.stdout, stderr: head.stderr },
    status: { command: ['git', 'status', '--porcelain=v1'], exit: status.status,
      stdout: status.stdout, stderr: status.stderr },
  })
  if (head.status !== 0 || status.status !== 0 || head.stdout.trim() !== '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd') {
    throw new Error('接手 HEAD/status 不符')
  }
  const manifest = read(join(repo, 'vendor/agent-skills/mattpocock/manifest.json'))
  const vendor = [...manifest.rootFiles, ...manifest.skills.flatMap(s => s.files)].map(expected => {
    const actual = fp(join(repo, 'vendor/agent-skills/mattpocock', expected.path))
    return { expected, actual, matches: expected.bytes === actual.bytes && expected.sha256 === actual.sha256 }
  })
  if (vendor.some(f => !f.matches)) throw new Error('vendor SHA/bytes 不符')
  const before = inputs()
  cpSync(join(pkg, 'src'), join(root, 'baseline/src'), { recursive: true, errorOnExist: true, force: false })
  put(baselinePath, { root, baselineCommit: head.stdout.trim(), node: process.version, platform: process.platform,
    inputs: before, copiedSource: tree(join(root, 'baseline/src')), vendor, vendorCommit: manifest.source.commit,
    candidateMeaning: '接手 dirty 实际字节，HEAD 非组合候选；未触及 privatefreeze/runtime/业务根。' })
  console.log(`P2004_ROOT=${root}; protected=${before.length}; vendor=${vendor.length}; capture_EXIT=0`)
} else if (['vendor-initial', 'vendor-final'].includes(stage)) {
  execute([join(pkg, 'scripts/verify-external-skills.mjs')], repo)
} else if (/^(red|green|affected)(-[a-z0-9]+)?$/.test(stage)) {
  const run = join(root, stage, 'inputs')
  if (existsSync(run)) throw new Error(`不覆盖 ${run}`)
  mkdirSync(run, { recursive: true })
  cpSync(join(pkg, 'src'), join(run, 'src'), { recursive: true, errorOnExist: true, force: false })
  if (stage.startsWith('red')) {
    const baseline = read(baselinePath)
    const original = join(root, 'baseline', source)
    if (fp(original).sha256 !== baseline.inputs.find(f => f.path === `packages/dsh-pm-tool/${source}`)?.sha256) {
      throw new Error('RED 原视图指纹漂移')
    }
    cpSync(original, join(run, source))
  }
  put(join(run, 'package.json'), '{"type":"module"}\n')
  const modules = join(run, 'node_modules')
  mkdirSync(modules)
  for (const e of readdirSync(join(pkg, 'node_modules'))) {
    if (['.bin', '.cache', '.vite'].includes(e)) continue
    symlinkSync(realpathSync(join(pkg, 'node_modules', e)), join(modules, e))
  }
  // 只读借用已存在的 DOM 依赖，不执行安装或接管该目录。
  const widget = join(repo, '.tmp/widget-poc/node_modules')
  for (const name of ['jsdom', 'react-dom']) symlinkSync(realpathSync(join(widget, name)), join(modules, name))
  const react = realpathSync(join(widget, 'react'))
  const reactDom = realpathSync(join(widget, 'react-dom'))
  const selected = stage.startsWith('affected') ? [
    test, 'src/client/views/okr-model.test.ts', 'src/client/views/growth-form-props.test.ts', 'src/core/okr.test.ts',
  ] : [test]
  const config = join(root, stage, 'vitest.config.mjs')
  put(config, `export default {
    root: ${JSON.stringify(run)}, cacheDir: ${JSON.stringify(join(root, stage, 'cache/vite'))},
    esbuild: { jsx: 'automatic' },
    resolve: { alias: { react: ${JSON.stringify(react)}, 'react-dom': ${JSON.stringify(reactDom)} } },
    test: { environment: 'node', include: ${JSON.stringify(selected)},
      server: { deps: { inline: [/lucide-react/, /react-test-renderer/] } },
      pool: 'forks', poolOptions: { forks: { singleFork: true } },
      reporters: ['verbose', 'json'], outputFile: { json: ${JSON.stringify(join(root, stage, 'output/vitest.json'))} },
      coverage: { enabled: false }, testTimeout: 20000, hookTimeout: 20000 },
  }\n`)
  const dependencies = [...new Set([
    widget, ...['vitest', 'lucide-react', 'zod', 'react', 'react-test-renderer',
      '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage', '@deepseek-ai/dsh-storage-domain']
      .map(name => realpathSync(join(pkg, 'node_modules', name))),
  ])]
  put(join(docs, prefix + stage + '-inputs.json'), {
    source: tree(join(run, 'src')), repoSource: tree(join(pkg, 'src')), config: fp(config),
    selected, sourceBinding: fp(join(run, source)), testBinding: fp(join(run, test)), node: fp(process.execPath),
    dependencyLinks: tree(modules), dependencies: dependencies.map(path => ({ path, files: tree(path) })),
  })
  execute([join(pkg, 'node_modules/vitest/vitest.mjs'), 'run', '--config', config], run, dependencies)
  put(join(docs, prefix + stage + '-output.json'), tree(join(root, stage, 'output')).map(f => ({
    ...f, content: readFileSync(resolve(repo, f.path), 'utf8'),
  })))
} else if (stage === 'seal') {
  const baseline = read(baselinePath)
  const after = inputs()
  const changes = delta(baseline.inputs, after)
  const owned = new Set([source, test].map(p => `packages/dsh-pm-tool/${p}`))
  const command = ['/usr/bin/diff', '-u', '--label', `a/${source}`, '--label', `b/${source}`,
    join(root, 'baseline', source), join(pkg, source)]
  const result = spawnSync(command[0], command.slice(1), { encoding: 'utf8' })
  if (![0, 1].includes(result.status)) throw new Error(`source diff 设施错误 ${result.status}`)
  put(join(docs, prefix + 'source-delta.patch'), result.stdout)
  const testBinding = fp(join(pkg, test))
  const sourceBinding = fp(join(pkg, source))
  const stages = ['red', 'green', 'affected']
  const bindings = stages.map(label => {
    const input = read(join(docs, prefix + label + '-inputs.json'))
    const receipt = read(join(docs, prefix + label + '-receipt.json'))
    const expectedSource = label === 'red'
      ? baseline.inputs.find(f => f.path === `packages/dsh-pm-tool/${source}`)
      : sourceBinding
    return { stage: label, exit: receipt.exit, sourceMatches: input.sourceBinding.sha256 === expectedSource.sha256,
      testMatches: input.testBinding.sha256 === testBinding.sha256,
      isolatedSourceDelta: receipt.isolatedSourceDelta, dependencyDelta: receipt.dependencyDelta,
      protectedInputDelta: receipt.protectedInputDelta }
  })
  const normalize = rows => rows.map(f => ({ ...f, path: f.path.slice(f.path.lastIndexOf('/src/') + 1) }))
  const sourceTransitions = delta(
    normalize(read(join(docs, prefix + 'red-inputs.json')).source),
    normalize(read(join(docs, prefix + 'green-inputs.json')).source),
  )
  const frames = label => readdirSync(join(root, label, 'output/dom')).map(file =>
    ({ file, value: read(join(root, label, 'output/dom', file)) }))
  const greenFrames = frames('green')
  const rootHtml = label => frames(label).find(f => f.file.includes('-ROOT.json'))
    ?.value.observations.find(o => o.label === 'render')?.html
  const domGuards = {
    rootMarkupUnchanged: !!rootHtml('red') && rootHtml('red') === rootHtml('green'),
    rerenderRelatedCounts: greenFrames.find(f => f.file.includes('-RERENDER.json'))
      ?.value.observations.filter(o => o.label === 'render').map(o => o.rows.length),
    allCallbacksAndFetchZero: greenFrames.every(f => f.value.observations.every(o =>
      Object.values(o.calls).every(calls => calls.length === 0) && o.fetchCalls.length === 0)),
    greenCases: greenFrames.length,
  }
  const vendorExits = ['vendor-initial', 'vendor-final'].map(label =>
    ({ stage: label, exit: read(join(docs, prefix + label + '-receipt.json')).exit }))
  const artifacts = readdirSync(docs).filter(p => p.startsWith(prefix)).map(p => fp(join(docs, p)))
  const receipts = artifacts.filter(f => f.path.endsWith('-receipt.json')).map(f => ({ ...f, value: read(join(repo, f.path)) }))
  const satisfied = bindings.every(b => b.sourceMatches && b.testMatches && !b.isolatedSourceDelta.length
      && !b.dependencyDelta.length && !b.protectedInputDelta.length)
    && bindings.map(b => b.exit).join(',') === '1,0,0'
    && sourceTransitions.length === 1 && sourceTransitions[0].path === source
    && domGuards.rootMarkupUnchanged && domGuards.allCallbacksAndFetchZero
    && JSON.stringify(domGuards.rerenderRelatedCounts) === '[1,0,1]'
    && vendorExits.every(v => v.exit === 0)
  put(join(docs, prefix + 'seal.json'), {
    task: 'P2OKR-R1-01', baselineCommit: baseline.baselineCommit, baseline: fp(baselinePath),
    root, sourceBinding, testBinding, inputsAfter: after, bindings, sourceTransitions, domGuards, vendorExits,
    sourceDeltaReceipt: { command, exit: result.status, stderr: result.stderr },
    ownedDelta: changes.filter(d => owned.has(d.path)), nonOwnedDelta: changes.filter(d => !owned.has(d.path)),
    artifacts, receipts, satisfied,
    boundary: '仅开发收据与字节封存，非独立 PASS；Main 后续新freeze/fullbuild/fullregression/newhost/GUI及独立复验。',
  })
  console.log(JSON.stringify({ satisfied, sourceBinding, testBinding,
    domGuards, sourceTransitions: sourceTransitions.map(d => d.path), vendorExits,
    bindings: bindings.map(({ protectedInputDelta, ...b }) => ({ ...b, protectedChanges: protectedInputDelta.length })),
    nonOwnedChanges: changes.filter(d => !owned.has(d.path)).length }, null, 2))
  process.exitCode = satisfied ? 0 : 1
} else {
  throw new Error(`未知 stage ${stage}`)
}

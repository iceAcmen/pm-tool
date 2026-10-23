// P1005 自有隔离执行与字节收据；不调用 Git、build、现有 mirrorhelper 或服务。
import { spawnSync } from 'node:child_process'
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync,
  symlinkSync, writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const root = '/tmp/pm-p1005-event-reflect-entry-6iR2yc'
const pkg = join(repo, 'packages/dsh-pm-tool')
const prefix = 'docs/plans/2026-10-23-p1005-event-reflect-entry-'
const node = '/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const stage = process.argv[2]
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fingerprint = path => {
  const bytes = readFileSync(path)
  return { sha256: sha(bytes), bytes: bytes.length }
}
function put(path, value) {
  if (existsSync(path)) throw new Error(`不覆盖旧证据：${path}`)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n')
}
function files(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return files(path, base)
    if (entry.isFile()) return [{ path: relative(base, path), ...fingerprint(path) }]
    if (entry.isSymbolicLink()) return [{ path: relative(base, path), link: realpathSync(path) }]
    return []
  }).sort((a, b) => a.path.localeCompare(b.path))
}
function inputMap() {
  const source = files(join(pkg, 'src')).map(row => ({
    ...row, path: `packages/dsh-pm-tool/src/${row.path}`,
  }))
  const protectedPaths = [
    'AGENTS.md', 'docs/collaboration.md', 'docs/external-skills.md',
    'docs/design/deep-integration-v2-p1-dev.md',
    'docs/testing/p1-l2-events-gui-review-20261023-r1.md',
    'docs/progress.md', 'docs/handoff.md', 'docs/onboarding-prompt.md',
    'docs/changelog.md', 'docs/requirements.md', 'docs/decision-log.md',
    'docs/knowledge-base.md', 'docs/issues-and-solutions.md',
    'packages/dsh-pm-tool/package.json', 'packages/dsh-pm-tool/vitest.config.ts',
    'packages/dsh-pm-tool/scripts/verify-external-skills.mjs',
    'vendor/agent-skills/mattpocock/manifest.json',
  ]
  const vendor = files(join(repo, 'vendor/agent-skills/mattpocock'))
    .filter(row => row.path !== 'manifest.json')
    .map(row => ({ ...row, path: `vendor/agent-skills/mattpocock/${row.path}` }))
  return [...source, ...protectedPaths.map(path => ({ path, ...fingerprint(join(repo, path)) })), ...vendor]
    .sort((a, b) => a.path.localeCompare(b.path))
}
function delta(before, after) {
  const a = new Map(before.map(row => [row.path, row]))
  const b = new Map(after.map(row => [row.path, row]))
  return [...new Set([...a.keys(), ...b.keys()])].sort().flatMap(path =>
    JSON.stringify(a.get(path)) === JSON.stringify(b.get(path)) ? [] : [{
      path, before: a.get(path) ?? null, after: b.get(path) ?? null,
    }])
}
function execute(label, argv, cwd, env) {
  const result = spawnSync(node, argv, { cwd, env, encoding: 'utf8', timeout: 120000 })
  put(join(root, 'output', `${label}.stdout.log`), result.stdout ?? '')
  put(join(root, 'output', `${label}.stderr.log`), result.stderr ?? '')
  const receipt = {
    command: [node, ...argv], cwd, exit: result.status, signal: result.signal,
    error: result.error?.message ?? null,
    environment: { node: process.version, platform: process.platform, ...env },
    stdout: fingerprint(join(root, 'output', `${label}.stdout.log`)),
    stderr: fingerprint(join(root, 'output', `${label}.stderr.log`)),
  }
  put(join(root, 'output', `${label}.receipt.json`), receipt)
  process.stdout.write(result.stdout ?? '')
  process.stderr.write(result.stderr ?? '')
  console.log(`P1005_RECEIPT=${JSON.stringify(receipt)}`)
  return result.status ?? 1
}
const env = {
  PATH: `${dirname(node)}:/usr/bin:/bin`,
  HOME: join(root, 'cache/home'),
  TMPDIR: join(root, 'cache/tmp'),
  XDG_CACHE_HOME: join(root, 'cache/xdg'),
  TZ: 'Asia/Shanghai',
  DSH_PM_E2E: '0',
  P1005_JSON_ROOT: join(root, 'output/fixtures'),
}

if (stage === 'capture') {
  mkdirSync(root, { recursive: true })
  put(join(root, 'input-before.json'), inputMap())
  cpSync(join(pkg, 'src/commands/reflect.ts'), join(root, 'before-reflect.ts'), { errorOnExist: true })
  const manifest = JSON.parse(readFileSync(join(repo, 'vendor/agent-skills/mattpocock/manifest.json'), 'utf8'))
  const rows = [...manifest.rootFiles, ...manifest.skills.flatMap(skill => skill.files)].map(row => {
    const actual = fingerprint(join(repo, 'vendor/agent-skills/mattpocock', row.path))
    return { ...row, actual, matches: row.sha256 === actual.sha256 && row.bytes === actual.bytes }
  })
  put(join(root, 'vendor-integrity.json'), { commit: manifest.source.commit, rows })
  if (rows.some(row => !row.matches)) throw new Error('vendor 完整性失败')
  console.log(`已认领 ${inputMap().length} 个输入；vendor ${rows.length}/${rows.length} SHA/bytes 相符；临时根 ${root}`)
} else if (['red-view', 'red-contract', 'green', 'green-r2', 'green-final', 'regression'].includes(stage)) {
  const run = join(root, stage)
  if (existsSync(run)) throw new Error(`拒绝覆盖运行输入：${run}`)
  mkdirSync(run, { recursive: true })
  for (const path of [env.HOME, env.TMPDIR, env.XDG_CACHE_HOME, env.P1005_JSON_ROOT]) mkdirSync(path, { recursive: true })
  // 仅作机械输入快照；生产源码不重写，依赖保持只读链接，禁止借用既有共享 lib。
  cpSync(join(pkg, 'src'), join(run, 'src'), { recursive: true })
  symlinkSync(join(pkg, 'node_modules'), join(run, 'node_modules'), 'dir')
  const config = join(run, 'vitest.config.mts')
  const tests = stage === 'regression'
    ? ['src/core/reflect.test.ts', 'src/core/reflect-l2.test.ts', 'src/core/reflect-file-count.test.ts']
    : ['src/commands/reflect-l2-entry.test.ts']
  put(config, `export default {
  root: ${JSON.stringify(run)},
  cacheDir: ${JSON.stringify(join(run, 'cache/vite'))},
  test: {
    environment: 'node',
    include: ${JSON.stringify(tests)},
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    reporters: ['verbose', 'json'],
    outputFile: { json: ${JSON.stringify(join(root, 'output', `${stage}.vitest.json`))} },
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: { enabled: false },
  },
}\n`)
  const dependencies = [
    'vitest', 'vite', 'zod', '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage',
    '@deepseek-ai/dsh-storage-json', '@deepseek-ai/dsh-storage-domain',
  ].flatMap(name => {
    const path = join(pkg, 'node_modules', name)
    if (!existsSync(path)) return [{ name, missing: true }]
    const actual = realpathSync(path)
    return [{ name, realpath: actual, files: files(actual).filter(row => !row.path.startsWith('node_modules/')) }]
  })
  put(join(root, 'output', `${stage}.inputs.json`), {
    baseline: '父报告引用 9b1a8c5317774ff07cc594a0acd12a5cc7893ebd；未操作 Git，非整包认领',
    repoAtRun: inputMap(),
    source: files(join(run, 'src')),
    config: fingerprint(config),
    node: fingerprint(node),
    dependencies,
    links: [{ path: join(run, 'node_modules'), target: realpathSync(join(run, 'node_modules')) }],
  })
  const cli = join(pkg, 'node_modules/vitest/vitest.mjs')
  const argv = [cli, 'run', '--config', config]
  if (stage === 'red-view') argv.push('-t', 'milestone-achieved.*完整查看')
  const exit = execute(stage, argv, run, env)
  process.exitCode = exit
} else if (stage === 'vendor-final') {
  process.exitCode = execute(stage, [join(pkg, 'scripts/verify-external-skills.mjs')], repo, env)
} else if (stage === 'collect') {
  const labels = ['red-view', 'red-contract', 'green', 'green-r2', 'regression', 'green-final', 'vendor-final']
  const runs = labels.map(label => {
    const base = join(root, 'output', label)
    const receipt = JSON.parse(readFileSync(`${base}.receipt.json`, 'utf8'))
    return {
      label, receipt,
      stdout: readFileSync(`${base}.stdout.log`, 'utf8'),
      stderr: readFileSync(`${base}.stderr.log`, 'utf8'),
      inputs: existsSync(`${base}.inputs.json`) ? {
        path: `${base}.inputs.json`, ...fingerprint(`${base}.inputs.json`),
        declaration: JSON.parse(readFileSync(`${base}.inputs.json`, 'utf8')),
      } : null,
      vitest: existsSync(`${base}.vitest.json`) ? JSON.parse(readFileSync(`${base}.vitest.json`, 'utf8')) : null,
    }
  })
  const audits = readdirSync(env.P1005_JSON_ROOT).filter(name => name.endsWith('.audit.json')).sort().map(name => {
    const path = join(env.P1005_JSON_ROOT, name)
    const audit = JSON.parse(readFileSync(path, 'utf8'))
    return {
      path, ...fingerprint(path), audit,
      rawFinal: files(audit.root).map(row => ({
        ...row, content: readFileSync(join(audit.root, row.path), 'utf8'),
      })),
    }
  })
  const argv = ['-u', join(root, 'before-reflect.ts'), join(pkg, 'src/commands/reflect.ts')]
  const diff = spawnSync('/usr/bin/diff', argv, { encoding: 'utf8' })
  if (diff.status !== 1) throw new Error(`预期真实源码 delta，diff exit=${diff.status}`)
  put(join(repo, `${prefix}delta.patch`), diff.stdout)
  put(join(repo, `${prefix}evidence.json`), {
    task: 'P1L2-F01，仅开发专项，不是独立 PASS',
    inputBefore: JSON.parse(readFileSync(join(root, 'input-before.json'), 'utf8')),
    vendorIntegrity: JSON.parse(readFileSync(join(root, 'vendor-integrity.json'), 'utf8')),
    diff: { command: ['/usr/bin/diff', ...argv], exit: diff.status, patch: fingerprint(join(repo, `${prefix}delta.patch`)) },
    runs, audits,
  })
  console.log(`已归档 ${runs.length} 条执行收据、${audits.length} 个自有 fixture 审计及真实源码 delta；原件未覆盖`)
} else if (stage === 'seal') {
  const before = JSON.parse(readFileSync(join(root, 'input-before.json'), 'utf8'))
  const after = inputMap()
  const change = delta(before, after)
  const own = new Set([
    'packages/dsh-pm-tool/src/commands/reflect.ts',
    'packages/dsh-pm-tool/src/commands/reflect-l2-entry.test.ts',
  ])
  const outputs = files(root).filter(row => !row.path.includes('/cache/') && !row.path.includes('/node_modules'))
  const summary = {
    scope: '本次未提交 dirty 输入增量，不是相对 HEAD 的整树 diff；未执行 Git',
    root,
    before: fingerprint(join(root, 'input-before.json')),
    after,
    ownDelta: change.filter(row => own.has(row.path)),
    nonOwnedDelta: change.filter(row => !own.has(row.path)),
    outputs,
    repoArtifacts: readdirSync(join(repo, 'docs/plans')).filter(name => name.startsWith('2026-10-23-p1005-event-reflect-entry-'))
      .map(name => ({ path: `docs/plans/${name}`, ...fingerprint(join(repo, 'docs/plans', name)) })),
    coverageBoundary: '开发专项非独立 PASS；Main 唯一 builder/GUI；未安装/构建/noEmit/整verify/服务/Git。',
  }
  const ownFiles = [...own].map(path => join(repo, path)).concat(summary.repoArtifacts.map(row => join(repo, row.path)))
  const whitespace = ownFiles.filter(path => /\.(md|mjs|ts)$/.test(path)).flatMap(path =>
    readFileSync(path, 'utf8').split(/\r?\n/).flatMap((line, index) =>
      /[ \t]+$/.test(line) ? [{ path, line: index + 1 }] : []))
  summary.trailingWhitespace = whitespace
  if (whitespace.length) throw new Error('自有文件存在尾空白，拒绝封存')
  put(join(repo, `${prefix}seal.json`), summary)
  console.log(JSON.stringify({
    ownDelta: summary.ownDelta,
    nonOwnedDelta: summary.nonOwnedDelta,
    outputCount: outputs.length,
    seal: fingerprint(join(repo, `${prefix}seal.json`)),
  }, null, 2))
} else {
  throw new Error(`未知执行阶段：${stage}`)
}

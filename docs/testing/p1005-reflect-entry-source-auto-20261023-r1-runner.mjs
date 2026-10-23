import {
  readFileSync, writeFileSync, readdirSync, lstatSync, statSync, realpathSync,
  existsSync, mkdirSync, mkdtempSync, copyFileSync, symlinkSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, join, dirname, relative, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { isDeepStrictEqual } from 'node:util'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'docs/testing/p1005-reflect-entry-source-auto-20261023-r1'
const dev = 'docs/plans/2026-10-23-p1005-event-reflect-entry'
const pkg = join(repo, 'packages/dsh-pm-tool')
const statePath = join(repo, `${prefix}-state.json`)
const node = '/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const mode = process.argv[2]
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const bytes = value => {
  const data = Buffer.isBuffer(value) ? value : Buffer.from(value)
  return { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length }
}
const fingerprint = path => bytes(readFileSync(path))
const check = (condition, message) => { if (!condition) throw new Error(message) }
const same = (a, b) => a?.sha256 === b?.sha256 && a?.bytes === b?.bytes
function fresh(path, value) {
  check(!existsSync(path), `拒绝覆盖：${path}`)
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
function safe(root, path) {
  check(!isAbsolute(path) && !path.split('/').includes('..'), `越界路径：${path}`)
  return join(root, path)
}
function files(root, prefix = '') {
  return readdirSync(join(root, prefix), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'node_modules' || e.name === '.git') return []
    const name = prefix ? `${prefix}/${e.name}` : e.name
    if (e.isSymbolicLink()) return []
    return e.isDirectory() ? files(root, name) : [name]
  }).sort()
}
function manifest(root, paths = files(root)) {
  return paths.map(path => ({ path, ...fingerprint(safe(root, path)) }))
}
function drift(root, rows) {
  return rows.flatMap(before => {
    const path = safe(root, before.path)
    const after = existsSync(path) ? { path: before.path, ...fingerprint(path) } : null
    return same(before, after) ? [] : [{ path: before.path, before, after }]
  })
}
function deltas(before, after) {
  const a = new Map(before.map(r => [r.path, r]))
  const b = new Map(after.map(r => [r.path, r]))
  return [...new Set([...a.keys(), ...b.keys()])].sort().flatMap(path =>
    same(a.get(path), b.get(path)) || (!a.has(path) && !b.has(path)) ? []
      : [{ path, before: a.get(path) ?? null, after: b.get(path) ?? null }])
}

function applyUnified(before, patch) {
  const original = before.split('\n')
  const out = []
  let cursor = 0
  for (const line of patch.split('\n').slice(2)) {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+\d+(?:,\d+)? @@/.exec(line)
    if (hunk) {
      const next = Number(hunk[1]) - 1
      check(next >= cursor, 'delta hunk 顺序不合法')
      out.push(...original.slice(cursor, next))
      cursor = next
    } else if (line.startsWith(' ') || line.startsWith('-')) {
      check(original[cursor] === line.slice(1), `delta 原文不符 ${cursor + 1}`)
      if (line[0] === ' ') out.push(original[cursor])
      cursor++
    } else if (line.startsWith('+')) out.push(line.slice(1))
    else check(line === '' || line.startsWith('\\'), 'delta 非法行')
  }
  return [...out, ...original.slice(cursor)].join('\n')
}

function readDeveloper() {
  const sealFile = join(repo, `${dev}-seal.json`)
  const seal = json(sealFile)
  check(seal.root === '/tmp/pm-p1005-event-reflect-entry-6iR2yc', '开发根不符')
  check(seal.outputs.length === 2858, '不是交接的2858件')
  const outputDrift = drift(seal.root, seal.outputs)
  const artifactDrift = drift(repo, seal.repoArtifacts)
  const currentDrift = drift(repo, seal.after)
  const evidence = json(join(repo, `${dev}-evidence.json`))
  const reconstructedDelta = deltas(evidence.inputBefore, seal.after)
  check(isDeepStrictEqual(reconstructedDelta, [...seal.ownDelta, ...seal.nonOwnedDelta].sort((a, b) => a.path.localeCompare(b.path))),
    '独立 before/after delta 与开发声明不符')
  const before = readFileSync(join(seal.root, 'before-reflect.ts'), 'utf8')
  const patched = applyUnified(before, readFileSync(join(repo, `${dev}-delta.patch`), 'utf8'))
  const currentCommand = readFileSync(join(pkg, 'src/commands/reflect.ts'), 'utf8')
  check(patched === currentCommand, '独立重建 patch 与当前命令不符')
  check(seal.ownDelta.every(row => same(row.after, fingerprint(safe(repo, row.path)))), '交付源码已漂移')
  const red = evidence.runs.find(r => r.label === 'red-view')
  const contractRed = evidence.runs.find(r => r.label === 'red-contract')
  const green = evidence.runs.find(r => r.label === 'green-final')
  const regression = evidence.runs.find(r => r.label === 'regression')
  check(red.receipt.exit === 1 && red.stdout.includes('未找到任务：ref-'), '原有效红缺失')
  check(same(bytes(red.stdout), red.receipt.stdout) && same(bytes(red.stderr), red.receipt.stderr), '红收据字节不符')
  const redAudit = evidence.audits.find(r => r.audit.actions.some(a => a.argument?.startsWith('ref-') && a.result?.text?.includes('未找到任务')))
  check(redAudit, '原红缺真实 handler audit')
  check(outputDrift.length === 0 && artifactDrift.length === 0, '开发封存件字节漂移')
  return {
    seal: { path: relative(repo, sealFile), ...fingerprint(sealFile) },
    outputCount: seal.outputs.length, outputDrift, artifactCount: seal.repoArtifacts.length, artifactDrift,
    declaredInputs: seal.after.length, currentDrift, reconstructedDelta, patchMatchesCurrent: true,
    sourceDeltaMatches: true, originalRed: {
      exit: red.receipt.exit, stdout: red.receipt.stdout, stderr: red.receipt.stderr,
      audit: { path: redAudit.path, sha256: redAudit.sha256, bytes: redAudit.bytes },
      redContractExit: contractRed.receipt.exit,
      preserved: true, executedHere: false,
    },
    developerGreenReferenceOnly: { finalExit: green.receipt.exit, regressionExit: regression.receipt.exit },
    boundary: '当前漂移是相对开发seal声明；不是Git全树diff。2858件只读核字节，不执行其中任何脚本。',
  }
}

function dependencies() {
  const seeds = ['vitest', '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage',
    '@deepseek-ai/dsh-storage-domain', '@deepseek-ai/dsh-storage-json', 'zod']
  const seen = new Set()
  const packages = []
  const unresolved = []
  function collect(path) {
    path = realpathSync(path)
    if (seen.has(path)) return
    check(!path.startsWith('/private/tmp/'), '不读private frozen/runtime依赖')
    seen.add(path)
    const info = json(join(path, 'package.json'))
    packages.push({ name: info.name, version: info.version, root: path, files: manifest(path) })
    const require = createRequire(join(path, 'package.json'))
    for (const name of Object.keys(info.dependencies ?? {})) {
      try {
        let file
        try { file = require.resolve(`${name}/package.json`) } catch { file = require.resolve(name) }
        let directory = dirname(file)
        while (!existsSync(join(directory, 'package.json'))) {
          check(directory !== dirname(directory), `找不到依赖包：${name}`)
          directory = dirname(directory)
        }
        collect(directory)
      } catch (error) { unresolved.push({ from: info.name, name, message: error.message }) }
    }
  }
  for (const name of seeds) collect(join(pkg, 'node_modules', name))
  return { packages, unresolved, policy: '只读链接及文件；无安装，无共享cache写。依赖声明含传递依赖，不展开嵌套node_modules。' }
}

function prepare() {
  check(!existsSync(statePath), '本轮已prepare；不得覆盖')
  const root = mkdtempSync('/tmp/pm-p1005-reflect-source-auto-')
  for (const dir of ['inputs/src/core', 'inputs/src/commands', 'config', 'cache/vite', 'cache/tmp',
    'cache/xdg', 'home', 'output/fixtures']) mkdirSync(join(root, dir), { recursive: true, mode: 0o700 })
  const audit = readDeveloper()
  const sourcePaths = files(join(pkg, 'src')).map(p => `packages/dsh-pm-tool/src/${p}`)
  const seal = json(join(repo, `${dev}-seal.json`))
  const protectedPaths = [...new Set([
    ...seal.after.map(r => r.path), ...sourcePaths, ...seal.repoArtifacts.map(r => r.path), `${dev}-seal.json`,
    'docs/testing/p1-l2-events-gui-review-20261023-r1.md', `${prefix}-plan.md`,
    `${prefix}-runner.mjs`, `${prefix}-independent.test.ts`, 'packages/dsh-pm-tool/vitest.config.ts',
    'packages/dsh-pm-tool/package.json', 'packages/dsh-pm-tool/pnpm-lock.yaml',
  ])].filter(p => existsSync(join(repo, p))).sort()
  const protectedInputs = manifest(repo, protectedPaths)
  const copyPaths = files(join(pkg, 'src/core')).map(p => `src/core/${p}`)
  copyPaths.push('src/commands/reflect.ts', 'src/commands/reflect-l2-entry.test.ts')
  for (const path of copyPaths) {
    mkdirSync(dirname(join(root, 'inputs', path)), { recursive: true })
    copyFileSync(join(pkg, path), join(root, 'inputs', path))
  }
  copyFileSync(join(repo, `${prefix}-independent.test.ts`), join(root, 'inputs/src/commands/source-auto-independent.test.ts'))
  symlinkSync(join(pkg, 'node_modules'), join(root, 'node_modules'), 'dir')
  symlinkSync(join(pkg, 'node_modules'), join(root, 'inputs/node_modules'), 'dir')
  const suites = {
    independent: ['src/commands/source-auto-independent.test.ts'],
    supplied: ['src/commands/reflect-l2-entry.test.ts'],
    affected: ['src/core/reflect.test.ts', 'src/core/reflect-l2.test.ts', 'src/core/reflect-file-count.test.ts'],
  }
  for (const [label, include] of Object.entries(suites)) {
    fresh(join(root, 'config', `${label}.mjs`),
      `export default ${JSON.stringify({
        root: join(root, 'inputs'), cacheDir: join(root, 'cache/vite', label),
        test: { environment: 'node', include, pool: 'forks', maxWorkers: 1, minWorkers: 1,
          fileParallelism: false, testTimeout: 15000, hookTimeout: 15000,
          reporters: ['verbose', 'json'], outputFile: { json: join(root, 'output', `${label}.vitest.json`) } },
      }, null, 2)}\n`)
  }
  const state = {
    root, createdAt: new Date().toISOString(), node: { path: node, version: process.version, ...fingerprint(node) },
    baselineReferenceOnly: '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd', version: json(join(pkg, 'package.json')).version,
    audit, protectedInputs, sourcePaths, inputManifest: manifest(join(root, 'inputs')),
    configManifest: manifest(join(root, 'config')), dependencies: dependencies(), suites,
    environment: {
      PATH: `${dirname(node)}:/usr/bin:/bin`, HOME: join(root, 'home'),
      TMPDIR: join(root, 'cache/tmp'), XDG_CACHE_HOME: join(root, 'cache/xdg'),
      TZ: 'Asia/Shanghai', DSH_PM_E2E: '0', P1005_JSON_ROOT: join(root, 'output/fixtures'),
      SOURCE_AUTO_ROOT: join(root, 'output/fixtures'),
    },
  }
  fresh(join(root, 'output', 'prepare.json'), state)
  fresh(statePath, state)
  fresh(join(repo, `${prefix}-reader-audit.json`), audit)
  console.log(JSON.stringify({ root, seal: audit.outputCount, currentDrift: audit.currentDrift,
    protectedInputs: protectedInputs.length, dependencyPackages: state.dependencies.packages.length,
    dependencyResolutionNotes: state.dependencies.unresolved.length }, null, 2))
}

function run(state, label) {
  const receiptPath = join(state.root, 'output', `${label}.receipt.json`)
  check(!existsSync(receiptPath), '专项已运行，拒绝再次运行')
  check(drift(join(state.root, 'inputs'), state.inputManifest).length === 0, '隔离输入漂移')
  check(drift(join(state.root, 'config'), state.configManifest).length === 0, '隔离配置漂移')
  const argv = [join(state.root, 'inputs/node_modules/vitest/vitest.mjs'), 'run', '--config',
    join(state.root, 'config', `${label}.mjs`)]
  const startedAt = new Date().toISOString()
  const result = spawnSync(node, argv, {
    cwd: join(state.root, 'inputs'), env: state.environment, encoding: 'utf8',
    timeout: 90000, maxBuffer: 20 * 1024 * 1024,
  })
  const stdout = result.stdout ?? ''
  const stderr = result.stderr ?? ''
  fresh(join(state.root, 'output', `${label}.stdout.log`), stdout)
  fresh(join(state.root, 'output', `${label}.stderr.log`), stderr)
  fresh(receiptPath, {
    label, command: [node, ...argv], cwd: join(state.root, 'inputs'), environment: state.environment,
    pid: result.pid, startedAt, endedAt: new Date().toISOString(), exit: result.status,
    signal: result.signal, error: result.error?.message ?? null,
    stdout: bytes(stdout), stderr: bytes(stderr),
  })
  console.log(stdout)
  if (stderr) console.error(stderr)
  process.exitCode = result.status ?? 1
}

function collect(state) {
  const runs = Object.keys(state.suites).map(label => ({
    label, receipt: json(join(state.root, 'output', `${label}.receipt.json`)),
    stdout: readFileSync(join(state.root, 'output', `${label}.stdout.log`), 'utf8'),
    stderr: readFileSync(join(state.root, 'output', `${label}.stderr.log`), 'utf8'),
    vitest: json(join(state.root, 'output', `${label}.vitest.json`)),
  }))
  const independentAudits = files(join(state.root, 'output/fixtures'))
    .filter(p => p.endsWith('.source-auto.json'))
    .map(path => ({ path, ...fingerprint(join(state.root, 'output/fixtures', path)),
      audit: json(join(state.root, 'output/fixtures', path)) }))
  const output = {
    scope: 'P1L2-F01 独立SOURCE/AUTO；非GUI、非完整候选、非ordinarycommit',
    root: state.root, runs, independentAudits,
    repoInputDrift: drift(repo, state.protectedInputs),
    isolatedInputDrift: drift(join(state.root, 'inputs'), state.inputManifest),
    configDrift: drift(join(state.root, 'config'), state.configManifest),
    sourceAdditions: files(join(pkg, 'src')).map(p => `packages/dsh-pm-tool/src/${p}`)
      .filter(p => !state.sourcePaths.includes(p)).map(path => ({ path, ...fingerprint(join(repo, path)) })),
  }
  fresh(join(repo, `${prefix}-evidence.json`), output)
  console.log(JSON.stringify({ runs: runs.map(r => ({
    label: r.label, exit: r.receipt.exit, total: r.vitest.numTotalTests, passed: r.vitest.numPassedTests,
    failed: r.vitest.numFailedTests,
  })), audits: independentAudits.length, drift: output.repoInputDrift, sourceAdditions: output.sourceAdditions }, null, 2))
}

function seal(state) {
  const devSeal = json(join(repo, `${dev}-seal.json`))
  const dependencyDrift = state.dependencies.packages.flatMap(p =>
    drift(p.root, p.files).map(row => ({ package: p.name, root: p.root, ...row })))
  const repoDrift = drift(repo, state.protectedInputs)
  const owned = readdirSync(join(repo, 'docs/testing')).filter(p =>
    p.startsWith('p1005-reflect-entry-source-auto-20261023-r1') && !p.endsWith('-seal.json'))
    .map(p => `docs/testing/${p}`).sort()
  const evidence = json(join(repo, `${prefix}-evidence.json`))
  const relevantDrift = repoDrift.filter(r => !r.path.startsWith('packages/dsh-pm-tool/src/client/'))
  const sourceAdditions = files(join(pkg, 'src')).map(p => `packages/dsh-pm-tool/src/${p}`)
    .filter(p => !state.sourcePaths.includes(p)).map(path => ({ path, ...fingerprint(join(repo, path)) }))
  const result = {
    at: new Date().toISOString(), scope: evidence.scope, root: state.root,
    protectedCount: state.protectedInputs.length, repoDrift, sourceAdditions,
    dependencyDrift, nodeDrift: !same(state.node, fingerprint(node)),
    inputDrift: drift(join(state.root, 'inputs'), state.inputManifest),
    configDrift: drift(join(state.root, 'config'), state.configManifest),
    developerOutputRecheck: { count: devSeal.outputs.length, drift: drift(devSeal.root, devSeal.outputs) },
    artifacts: manifest(repo, owned), temporaryOutputs: manifest(state.root),
    tests: evidence.runs.map(r => ({
      label: r.label, pid: r.receipt.pid, exit: r.receipt.exit,
      total: r.vitest.numTotalTests, passed: r.vitest.numPassedTests, failed: r.vitest.numFailedTests,
    })),
    boundary: '保护限定所列源码/文档/依赖和开发封存输出；不宣称共享dirty全树/全盘无变。无Git身份核验、build、GUI或服务。',
    released: true, stopped: true,
  }
  const good = relevantDrift.length === 0 && dependencyDrift.length === 0 && !result.nodeDrift
    && result.inputDrift.length === 0 && result.configDrift.length === 0
    && result.developerOutputRecheck.drift.length === 0
    && result.tests.every(r => r.exit === 0 && r.total === r.passed && r.failed === 0)
  result.sealStatus = good ? 'PASS（封存及限定输入）' : 'FAIL（见字段，不伪装产品FAIL）'
  fresh(join(repo, `${prefix}-seal.json`), result)
  console.log(JSON.stringify({ sealStatus: result.sealStatus, tests: result.tests,
    repoDrift, sourceAdditions, dependencyDrift: dependencyDrift.length, released: true, STOP: true }, null, 2))
  process.exitCode = good ? 0 : 1
}

try {
  if (mode === 'prepare') prepare()
  else {
    const state = json(statePath)
    if (mode in state.suites) run(state, mode)
    else if (mode === 'collect') collect(state)
    else if (mode === 'seal') seal(state)
    else throw new Error(`未知执行阶段：${mode}`)
  }
} catch (error) {
  console.error(error.stack)
  process.exitCode = 1
}

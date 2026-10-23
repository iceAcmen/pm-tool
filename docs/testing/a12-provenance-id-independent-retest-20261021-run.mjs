import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, readdir, readlink, symlink, writeFile } from 'node:fs/promises'
import { spawn, execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const prefix = 'a12-provenance-id-independent-retest-20261021'
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const evidence = join(repo, 'docs/testing', `${prefix}-evidence`)
const author = join(repo, 'reports/a12-provenance-id-developer-20261021-evidence')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const node = '/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const component = 'src/client/provenance-panel.tsx'
const test = 'src/client/provenance-panel.test.tsx'
const guards = `src/client/${prefix}-guards.test.tsx`
const related = ['src/core/provenance.test.ts', 'src/core/provenance-view.test.ts',
  'src/core/provenance-store.test.ts', 'src/commands/ask-governance.test.ts']
const expected = {
  red: 'ff319e4e7d9fc47cf3c8b34b56f4b260901c0039841a054837b7b2cf93779ca6',
  green: '039b7d47a9fc39df0913d38d102eb54e526023c3c49eb260278f59c3de4c973b',
  test: '5c484781fe1609360e34359ccecb667f98101de458ddc267141671f488ac8584',
}
const hash = value => createHash('sha256').update(value).digest('hex')
const json = async path => JSON.parse(await readFile(path, 'utf8'))
const save = async (name, value) => writeFile(join(evidence, name),
  `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim()
const assert = (condition, message) => { if (!condition) throw new Error(message) }

async function fingerprint(path) {
  const bytes = await readFile(path)
  return { bytes: bytes.length, sha256: hash(bytes) }
}

async function inventory(root) {
  const result = {}
  async function walk(dir, relative = '') {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const name = relative ? `${relative}/${item.name}` : item.name
      const path = join(dir, item.name)
      if (item.isDirectory()) await walk(path, name)
      else if (item.isSymbolicLink()) result[name] = { link: await readlink(path) }
      else if (item.isFile()) result[name] = await fingerprint(path)
    }
  }
  await walk(root)
  return result
}

function differences(before, after) {
  const changed = [], added = [], missing = []
  for (const name of Object.keys(before)) {
    if (!(name in after)) missing.push(name)
    else if (JSON.stringify(before[name]) !== JSON.stringify(after[name])) changed.push(name)
  }
  for (const name of Object.keys(after)) if (!(name in before)) added.push(name)
  return { changed, added, missing }
}
const empty = delta => Object.values(delta).every(list => list.length === 0)

async function run(label, cwd, args) {
  const startedAt = new Date().toISOString()
  const scope = dirname(cwd)
  const env = {
    PATH: `${dirname(node)}:/usr/bin:/bin:/usr/sbin:/sbin`, HOME: join(scope, 'home'),
    TMPDIR: join(scope, 'tmp'), PM_GOVERNANCE_TMP: join(scope, 'tmp'),
    DSH_PM_FILE_ROOT: join(scope, 'files'), DSH_PM_BACKUP_DIR: join(scope, 'backups'),
    DSH_HOME: join(scope, 'dsh'), CI: '1', NO_COLOR: '1',
  }
  for (const path of [env.HOME, env.TMPDIR, env.DSH_PM_FILE_ROOT, env.DSH_PM_BACKUP_DIR, env.DSH_HOME]) {
    await mkdir(path, { recursive: true })
  }
  const result = await new Promise((ok, bad) => {
    const child = spawn(node, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
    console.log(`${label}: PID ${child.pid}`)
    let stdout = '', stderr = ''
    child.stdout.on('data', bytes => { stdout += bytes })
    child.stderr.on('data', bytes => { stderr += bytes })
    child.on('error', bad)
    child.on('close', (exitCode, signal) => ok({ exitCode, signal, stdout, stderr }))
  })
  for (const stream of ['stdout', 'stderr']) {
    await writeFile(join(evidence, `${label}.${stream}.log`), result[stream], { flag: 'wx' })
  }
  await save(`${label}.exit.json`, {
    startedAt, finishedAt: new Date().toISOString(), cwd, node, args, env,
    exitCode: result.exitCode, signal: result.signal,
    stdoutSha256: hash(result.stdout), stderrSha256: hash(result.stderr),
  })
  console.log(`${label}: exit ${result.exitCode}\n${result.stdout.slice(-1600)}${result.stderr.slice(-700)}`)
  return result
}

const mode = process.argv[2]
if (mode === 'freeze') {
  await mkdir(evidence, { recursive: false })
  const originalFreeze = await json(join(author, 'freeze.json'))
  const originalGreen = (await json(join(author, 'green-summary.json'))).green
  const root = await mkdtemp('/private/tmp/pmtool-a12-provenance-id-independent-retest-20261021-')
  const originals = { red: originalFreeze.red, green: originalGreen }
  const copies = {}
  for (const [name, original] of Object.entries(originals)) {
    const manifest = await json(join(author, `${name}-inputs.json`))
    const originalSource = await inventory(join(original, 'src'))
    const expectedSource = Object.fromEntries(Object.entries(manifest)
      .filter(([path]) => path.startsWith('src/')).map(([path, value]) => [path.slice(4), value]))
    assert(empty(differences(expectedSource, originalSource)), `${name} 原源码发生漂移`)
    for (const file of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json']) {
      assert(JSON.stringify(await fingerprint(join(original, file))) === JSON.stringify(manifest[file]),
        `${name} ${file} 原件漂移`)
    }
    assert((await fingerprint(join(original, component))).sha256 === expected[name], `${name} 组件身份不符`)
    assert((await fingerprint(join(original, test))).sha256 === expected.test, `${name} 测试身份不符`)
    const target = join(root, name, 'packages/dsh-pm-tool')
    copies[name] = target
    await mkdir(target, { recursive: true })
    await cp(join(original, 'src'), join(target, 'src'), { recursive: true })
    for (const file of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json']) {
      await cp(join(original, file), join(target, file))
    }
    await cp(join(repo, 'docs/testing', `${prefix}-vitest.config.mts`), join(target, 'vitest.config.mts'))
    await symlink(deps, join(target, 'node_modules'))
    await save(`${name}-source-before.json`, await inventory(join(target, 'src')))
    await save(`${name}-original-source.json`, originalSource)
  }
  const delta = differences(await inventory(join(copies.red, 'src')), await inventory(join(copies.green, 'src')))
  assert(delta.changed.join() === 'client/provenance-panel.tsx'
    && !delta.added.length && !delta.missing.length, '红绿原源码差异超过一个组件')
  const redBytes = await readFile(join(copies.red, component), 'utf8')
  const greenBytes = await readFile(join(copies.green, component), 'utf8')
  const line = "          {ref.label ? `${ref.id} · ` : ''}\n"
  assert(greenBytes.replace(line, '') === redBytes && greenBytes.split(line).length === 2,
    '不是指定的一行最小差异')
  await writeFile(join(evidence, 'source-one-line.patch'),
    `--- 原真实组件\n+++ 修后真实组件\n@@ renderRef pm-prov-ref-meta @@\n+${line}`, { flag: 'wx' })
  await save('source-diff.json', delta)
  const main = join(repo, 'packages/dsh-pm-tool')
  const mainInputs = {}
  for (const file of [component, test, ...related]) mainInputs[file] = await fingerprint(join(main, file))
  assert(mainInputs[component].sha256 === expected.green && mainInputs[test].sha256 === expected.test,
    '当前组件或测试不是指定候选')
  const mainRelatedDifferences = []
  for (const file of related) {
    if (mainInputs[file].sha256 !== (await fingerprint(join(copies.green, file))).sha256) {
      mainRelatedDifferences.push(file)
    }
  }
  assert(!mainRelatedDifferences.length, '当前相关测试与冻结不一致')
  const logChecks = []
  for (const name of (await readdir(author)).filter(name => name.endsWith('.exit.json'))) {
    const original = await json(join(author, name))
    const label = name.slice(0, -'.exit.json'.length)
    const streams = {}
    for (const stream of ['stdout', 'stderr']) {
      streams[stream] = (await fingerprint(join(author, `${label}.${stream}.log`))).sha256
        === original[`${stream}Sha256`]
    }
    assert(Object.values(streams).every(Boolean), `${label} 开发日志哈希不符`)
    logChecks.push({ label, exitCode: original.exitCode, streams })
  }
  await save('author-original-audit.json', {
    at: new Date().toISOString(), originalFreeze, originals, logChecks, mainRelatedDifferences,
    redGreenDiff: delta, oneLineOnly: true,
  })
  const watched = {
    authorEvidence: await inventory(author),
    authorRedSource: await inventory(join(originals.red, 'src')),
    authorGreenSource: await inventory(join(originals.green, 'src')),
    dependencies: await inventory(deps),
    mainLib: await inventory(join(main, 'lib')),
    mainIsolatedLib: await inventory(resolve(deps, '../lib')),
    mainInputs,
  }
  const contracts = ['AGENTS.md', 'docs/collaboration.md',
    'docs/testing/a11-governance-source-gui-review-20261021.md',
    'docs/testing/remaining-governance-cases-20261021.md',
    'docs/plans/2026-10-21-provenance-source-id-closure.md',
    'reports/a12-provenance-id-developer-20261021.md',
    'reports/a12-provenance-id-developer-20261021-run.mjs',
    'reports/a12-provenance-id-developer-20261021-vitest.config.mts']
  watched.contracts = Object.fromEntries(await Promise.all(
    contracts.map(async file => [file, await fingerprint(join(repo, file))])))
  await save('watched-before.json', watched)
  await cp(join(repo, 'docs/testing', `${prefix}-guards.test.tsx`), join(copies.green, guards))
  await writeFile(join(copies.green, 'test-tsconfig.json'), JSON.stringify({
    extends: './tsconfig.json', include: [test, guards, 'src/**/*.d.ts'], exclude: [],
  }), { flag: 'wx' })
  await save('red-inputs.json', await inventory(copies.red))
  await save('green-inputs.json', await inventory(copies.green))
  await save('freeze.json', {
    at: new Date().toISOString(), root, ...copies, originals, deps,
    head: git('rev-parse', 'HEAD'), expected, runtime: execFileSync(node, ['--version'], { encoding: 'utf8' }).trim(),
    platform: process.platform, arch: process.arch, scope: '仅 AGUI-01 SOURCE/AUTO，不含 GUI/整 ID',
  })
  console.log(`冻结完成 ${root}`)
} else if (mode === 'retest') {
  const frozen = await json(join(evidence, 'freeze.json'))
  const vitest = files => [join(deps, 'vitest/vitest.mjs'), 'run', '--config', 'vitest.config.mts',
    '--no-cache', ...files]
  const results = {}
  results.red = await run('red-component', frozen.red, vitest([test]))
  results.green = await run('green-component', frozen.green, vitest([test]))
  results.guards = await run('green-guards', frozen.green, vitest([guards]))
  results.related = await run('green-related', frozen.green, vitest(related))
  results.productTypes = await run('green-product-noemit', frozen.green,
    [join(deps, 'typescript/bin/tsc'), '-p', 'tsconfig.json', '--noEmit', '--incremental', 'false'])
  results.testTypes = await run('green-tests-noemit', frozen.green,
    [join(deps, 'typescript/bin/tsc'), '-p', 'test-tsconfig.json', '--noEmit', '--incremental', 'false'])
  const expectedResults = {
    red: results.red.exitCode === 1 && /11 failed \| 5 passed/.test(results.red.stdout)
      && /AssertionError/.test(results.red.stderr) && !/Failed to load|Cannot find module/.test(results.red.stderr),
    green: results.green.exitCode === 0 && /16 passed/.test(results.green.stdout),
    guards: results.guards.exitCode === 0 && /5 passed/.test(results.guards.stdout),
    related: results.related.exitCode === 0 && /52 passed/.test(results.related.stdout),
    productTypes: results.productTypes.exitCode === 0,
    testTypes: results.testTypes.exitCode === 0,
  }
  await save('retest-summary.json', {
    at: new Date().toISOString(), expectedResults,
    exitCodes: Object.fromEntries(Object.entries(results).map(([name, value]) => [name, value.exitCode])),
  })
  assert(Object.values(expectedResults).every(Boolean), '复验有不满足预期项，按原日志判定')
} else if (mode === 'guards-r2') {
  const frozen = await json(join(evidence, 'freeze.json'))
  const r1 = await json(join(evidence, 'retest-summary.json'))
  assert(r1.exitCodes.guards === 1, '本补正仅用于原守卫首轮失败')
  const target = join(frozen.root, 'green-r2/packages/dsh-pm-tool')
  await mkdir(target, { recursive: true })
  await cp(join(frozen.green, 'src'), join(target, 'src'), { recursive: true })
  for (const file of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.mts', 'test-tsconfig.json']) {
    await cp(join(frozen.green, file), join(target, file))
  }
  await symlink(deps, join(target, 'node_modules'))
  await cp(join(frozen.green, guards), join(evidence, 'guards-r1.test.tsx'))
  await cp(join(repo, 'docs/testing', `${prefix}-guards.test.tsx`), join(target, guards))
  const delta = differences(await inventory(join(frozen.green, 'src')), await inventory(join(target, 'src')))
  assert(delta.changed.join() === guards.slice(4) && !delta.added.length && !delta.missing.length,
    'r2 仅允许独立守卫变化')
  await save('green-r2-inputs.json', await inventory(target))
  await save('guards-r2-scope.json', {
    at: new Date().toISOString(), target, delta,
    reason: '仅改刷新渲染比较：JSON 序列化排除重建的事件函数；原件与首轮结果保留',
    originalGuard: await fingerprint(join(frozen.green, guards)),
    correctedGuard: await fingerprint(join(target, guards)),
  })
  const corrected = await run('green-guards-r2', target, [
    join(deps, 'vitest/vitest.mjs'), 'run', '--config', 'vitest.config.mts', '--no-cache', guards])
  const types = await run('green-tests-noemit-r2', target, [
    join(deps, 'typescript/bin/tsc'), '-p', 'test-tsconfig.json', '--noEmit', '--incremental', 'false'])
  await save('guards-r2-summary.json', { at: new Date().toISOString(),
    guardExit: corrected.exitCode, testTypesExit: types.exitCode,
    fiveGuards: corrected.exitCode === 0 && /5 passed/.test(corrected.stdout) })
  assert(corrected.exitCode === 0 && /5 passed/.test(corrected.stdout) && types.exitCode === 0,
    '独立守卫补正复验仍有失败')
} else if (mode === 'finish') {
  const frozen = await json(join(evidence, 'freeze.json'))
  const before = await json(join(evidence, 'watched-before.json'))
  const main = join(repo, 'packages/dsh-pm-tool')
  const now = {
    authorEvidence: await inventory(author),
    authorRedSource: await inventory(join(frozen.originals.red, 'src')),
    authorGreenSource: await inventory(join(frozen.originals.green, 'src')),
    dependencies: await inventory(deps),
    mainLib: await inventory(join(main, 'lib')),
    mainIsolatedLib: await inventory(resolve(deps, '../lib')),
    mainInputs: Object.fromEntries(await Promise.all(
      Object.keys(before.mainInputs).map(async file => [file, await fingerprint(join(main, file))]))),
    contracts: Object.fromEntries(await Promise.all(
      Object.keys(before.contracts).map(async file => [file, await fingerprint(join(repo, file))]))),
  }
  const changes = Object.fromEntries(Object.keys(before).map(name => [name, differences(before[name], now[name])]))
  const own = {}
  for (const name of ['red', 'green']) {
    own[name] = differences(await json(join(evidence, `${name}-inputs.json`)), await inventory(frozen[name]))
  }
  const r2 = (await json(join(evidence, 'guards-r2-scope.json'))).target
  own.greenR2 = differences(await json(join(evidence, 'green-r2-inputs.json')), await inventory(r2))
  await save('finish.json', {
    at: new Date().toISOString(), changes, own, head: git('rev-parse', 'HEAD'),
    release: '独立 SOURCE/AUTO 任务释放；无自有存活进程，无 GUI/build/端口占用；保留冻结副本',
  })
  console.log(JSON.stringify({ changes, own }, null, 2))
  if (![...Object.values(changes), ...Object.values(own)].every(empty)) process.exitCode = 1
} else {
  throw new Error('用法：node 本前缀脚本 freeze|retest|guards-r2|finish；各阶段一次，原件不覆写')
}

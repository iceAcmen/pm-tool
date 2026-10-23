import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, readdir, readlink, lstat, symlink, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const prefix = 'a12-provenance-id-developer-20261021'
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = join(repo, 'packages/dsh-pm-tool')
const evidence = join(repo, 'reports', `${prefix}-evidence`)
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const node = '/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const component = 'src/client/provenance-panel.tsx'
const test = 'src/client/provenance-panel.test.tsx'
const own = [component, test]
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const json = async path => JSON.parse(await readFile(path, 'utf8'))
const save = async (name, value) => writeFile(join(evidence, name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' })

async function inventory(root) {
  const result = {}
  async function walk(dir, relative = '') {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const name = relative ? `${relative}/${item.name}` : item.name
      const path = join(dir, item.name)
      if (item.isDirectory()) await walk(path, name)
      else if (item.isSymbolicLink()) result[name] = { link: await readlink(path) }
      else if (item.isFile()) {
        const bytes = await readFile(path)
        result[name] = { bytes: bytes.length, sha256: hash(bytes) }
      }
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

async function run(label, cwd, args) {
  const at = new Date().toISOString()
  const env = { PATH: `${dirname(node)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(dirname(cwd), 'home'), TMPDIR: join(dirname(cwd), 'tmp'),
    PM_GOVERNANCE_TMP: join(dirname(cwd), 'tmp'),
    DSH_PM_FILE_ROOT: join(dirname(cwd), 'files'), DSH_PM_BACKUP_DIR: join(dirname(cwd), 'backups'),
    DSH_HOME: join(dirname(cwd), 'dsh'), CI: '1', NO_COLOR: '1' }
  for (const path of [env.HOME, env.TMPDIR, env.DSH_PM_FILE_ROOT, env.DSH_PM_BACKUP_DIR, env.DSH_HOME]) {
    await mkdir(path, { recursive: true })
  }
  const result = await new Promise((ok, bad) => {
    const child = spawn(node, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = '', stderr = ''
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('error', bad)
    child.on('exit', (code, signal) => ok({ code, signal, stdout, stderr }))
  })
  await writeFile(join(evidence, `${label}.stdout.log`), result.stdout, { flag: 'wx' })
  await writeFile(join(evidence, `${label}.stderr.log`), result.stderr, { flag: 'wx' })
  await save(`${label}.exit.json`, {
    startedAt: at, finishedAt: new Date().toISOString(), cwd, node, args, env,
    exitCode: result.code, signal: result.signal,
    stdoutSha256: hash(result.stdout), stderrSha256: hash(result.stderr),
  })
  process.stdout.write(`${label}: exit ${result.code}\n${result.stdout.slice(-2500)}${result.stderr.slice(-1500)}\n`)
  return result.code
}

const mode = process.argv[2]
if (mode === 'freeze') {
  await mkdir(evidence, { recursive: false })
  const root = await mkdtemp('/private/tmp/pmtool-a12-provenance-id-developer-20261021-')
  const red = join(root, 'red/packages/dsh-pm-tool')
  await mkdir(red, { recursive: true })
  await cp(join(pkg, 'src'), join(red, 'src'), { recursive: true })
  for (const name of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json']) await cp(join(pkg, name), join(red, name))
  await cp(join(repo, 'reports', `${prefix}-vitest.config.mts`), join(red, 'vitest.config.mts'))
  await symlink(deps, join(red, 'node_modules'))
  const mainLib = await inventory(join(pkg, 'lib'))
  const sharedLib = await inventory(resolve(deps, '../lib'))
  await save('freeze.json', {
    at: new Date().toISOString(), root, red, deps, head: git('rev-parse', 'HEAD').trim(),
    ownBefore: Object.fromEntries(await Promise.all(own.map(async name => [name, hash(await readFile(join(pkg, name)))]))),
    runtime: execFileSync(node, ['--version'], { encoding: 'utf8' }).trim(),
    pnpmDeclared: '11.28.5（未执行安装或 pnpm 构建）',
  })
  await save('red-inputs.json', await inventory(red))
  await save('dependencies-before.json', await inventory(deps))
  await save('main-lib-before.json', mainLib)
  await save('main-isolated-lib-before.json', sharedLib)
  await writeFile(join(evidence, 'owned-before.patch'), git('diff', '--', ...own.map(name => `packages/dsh-pm-tool/${name}`)), { flag: 'wx' })
  console.log(`冻结 ${root}`)
} else if (mode === 'red') {
  const { red } = await json(join(evidence, 'freeze.json'))
  const code = await run('red-component', red, [join(deps, 'vitest/vitest.mjs'), 'run',
    '--config', 'vitest.config.mts', '--no-cache', test])
  if (code !== 1) throw new Error(`旧组件预期断言失败 exit1，实为 ${code}`)
} else if (mode === 'green') {
  const frozen = await json(join(evidence, 'freeze.json'))
  const green = join(frozen.root, 'green/packages/dsh-pm-tool')
  await mkdir(green, { recursive: true })
  await cp(join(frozen.red, 'src'), join(green, 'src'), { recursive: true })
  for (const name of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.mts']) {
    await cp(join(frozen.red, name), join(green, name))
  }
  await cp(join(pkg, component), join(green, component))
  if (hash(await readFile(join(pkg, test))) !== frozen.ownBefore[test]) throw new Error('新旧测试内容漂移')
  await symlink(deps, join(green, 'node_modules'))
  await save('green-inputs.json', await inventory(green))
  const delta = differences(await inventory(join(frozen.red, 'src')), await inventory(join(green, 'src')))
  await save('red-green-source-diff.json', delta)
  if (delta.changed.join() !== 'client/provenance-panel.tsx' || delta.added.length || delta.missing.length) {
    throw new Error('红绿候选差异超过唯一组件')
  }
  const componentExit = await run('green-component', green, [join(deps, 'vitest/vitest.mjs'), 'run',
    '--config', 'vitest.config.mts', '--no-cache', test])
  const regressionExit = await run('green-related', green, [join(deps, 'vitest/vitest.mjs'), 'run',
    '--config', 'vitest.config.mts', '--no-cache',
    'src/core/provenance.test.ts', 'src/core/provenance-view.test.ts',
    'src/core/provenance-store.test.ts', 'src/commands/ask-governance.test.ts'])
  const typeExit = await run('green-noemit', green, [join(deps, 'typescript/bin/tsc'),
    '-p', 'tsconfig.json', '--noEmit', '--incremental', 'false'])
  await writeFile(join(green, 'component-test-tsconfig.json'), JSON.stringify({
    extends: './tsconfig.json', include: [test], exclude: [],
  }), { flag: 'wx' })
  const testTypeExit = await run('green-test-noemit', green, [join(deps, 'typescript/bin/tsc'),
    '-p', 'component-test-tsconfig.json', '--noEmit', '--incremental', 'false'])
  await save('green-summary.json', { at: new Date().toISOString(), green,
    componentExit, regressionExit, typeExit, testTypeExit })
  if ([componentExit, regressionExit, typeExit, testTypeExit].some(code => code !== 0)) process.exitCode = 1
} else if (mode === 'test-types-r2') {
  const frozen = await json(join(evidence, 'freeze.json'))
  const green = join(frozen.root, 'green/packages/dsh-pm-tool')
  await writeFile(join(green, 'component-test-tsconfig-r2.json'), JSON.stringify({
    extends: './tsconfig.json', include: [test, 'src/**/*.d.ts'], exclude: [],
  }), { flag: 'wx' })
  const exitCode = await run('green-test-noemit-r2', green, [join(deps, 'typescript/bin/tsc'),
    '-p', 'component-test-tsconfig-r2.json', '--noEmit', '--incremental', 'false'])
  if (exitCode !== 0) process.exitCode = 1
} else if (mode === 'finish') {
  const frozen = await json(join(evidence, 'freeze.json'))
  const green = join(frozen.root, 'green/packages/dsh-pm-tool')
  const checks = {
    dependencies: differences(await json(join(evidence, 'dependencies-before.json')), await inventory(deps)),
    mainLib: differences(await json(join(evidence, 'main-lib-before.json')), await inventory(join(pkg, 'lib'))),
    mainIsolatedLib: differences(await json(join(evidence, 'main-isolated-lib-before.json')), await inventory(resolve(deps, '../lib'))),
  }
  const owned = {}
  for (const name of own) {
    const bytes = await readFile(join(pkg, name))
    owned[name] = { bytes: bytes.length, sha256: hash(bytes),
      matchesGreen: hash(bytes) === hash(await readFile(join(green, name))) }
  }
  const caches = []
  for (const candidate of [frozen.red, green]) {
    for (const name of ['disabled-vite-cache', '.vite', '.vitest', 'lib']) {
      try { await lstat(join(candidate, name)); caches.push(join(candidate, name)) }
      catch (error) { if (error.code !== 'ENOENT') throw error }
    }
  }
  await save('finish.json', { at: new Date().toISOString(), owned, checks, caches,
    head: git('rev-parse', 'HEAD').trim(), release: '释放本组件及同组件测试；Main 唯一 A12 冻建/GUI/最后普通 commit，无 push' })
  await writeFile(join(evidence, 'owned-final.patch'), git('diff', '--', `packages/dsh-pm-tool/${component}`), { flag: 'wx' })
  if (Object.values(checks).some(check => Object.values(check).some(list => list.length))
    || caches.length || Object.values(owned).some(file => !file.matchesGreen)) process.exitCode = 1
  console.log(JSON.stringify({ owned, checks, caches }, null, 2))
} else {
  throw new Error('用法：node 本脚本 freeze|red|green|test-types-r2|finish（各阶段仅执行一次）')
}

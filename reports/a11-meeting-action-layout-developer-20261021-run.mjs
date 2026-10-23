/**
 * A11 开发侧红绿证据：只写本报告前缀私有副本/缓存/日志，依赖只读复用。
 * node 本文件 red|red-r2|red-r3|green|green-r2；不构建、不连服务/GUI、不写依赖。
 */
import { cpSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = join(root, 'reports/a11-meeting-action-layout-developer-20261021-selftmp')
const packageRoot = join(root, 'packages/dsh-pm-tool')
const phase = process.argv[2]
if (!['red', 'red-r2', 'red-r3', 'green', 'green-r2'].includes(phase)) throw new Error('未知阶段')
const isRed = phase.startsWith('red')
const isGreen = !isRed
const privateCopy = join(prefix, phase === 'red' ? 'privatecopy'
  : ['red-r3', 'green-r2'].includes(phase) ? 'privatecopy-r3' : 'privatecopy-r2')
const dependencyRoot = phase === 'red' ? packageRoot : '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool'
const files = [
  'src/client/views/records/records-meeting-form.tsx',
  'src/client/views/records.css',
  'src/client/views/records/records-meeting-layout.test.tsx',
]
const hash = value => createHash('sha256').update(value).digest('hex')
const git = args => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr)
  return result.stdout
}
const require = createRequire(join(dependencyRoot, 'package.json'))
const vitest = require.resolve('vitest/vitest.mjs')
const tsc = require.resolve('typescript/bin/tsc')
mkdirSync(prefix, { recursive: true })
mkdirSync(join(prefix, 'privatecache/tmp'), { recursive: true })
if (isRed) {
  if (existsSync(join(prefix, `${phase}.json`))) throw new Error('不覆盖既有红证据')
  mkdirSync(privateCopy, { recursive: true })
  cpSync(join(packageRoot, 'src'), join(privateCopy, 'src'), { recursive: true })
  for (const file of ['package.json', 'tsconfig.json']) {
    cpSync(join(packageRoot, file), join(privateCopy, file))
  }
  symlinkSync(join(dependencyRoot, 'node_modules'), join(privateCopy, 'node_modules'), 'dir')
  if (phase === 'red-r3') {
    for (const file of files.slice(0, 2)) cpSync(join(prefix, 'before', file), join(privateCopy, file))
  }
  for (const file of files) {
    const destination = join(prefix, 'before', file)
    mkdirSync(dirname(destination), { recursive: true })
    if (!existsSync(destination)) cpSync(join(packageRoot, file), destination)
    else if (phase !== 'red-r3' && hash(readFileSync(destination)) !== hash(readFileSync(join(packageRoot, file)))) {
      throw new Error(`有效红测前源码漂移：${file}`)
    }
  }
  writeFileSync(join(prefix, `${phase === 'red' ? 'baseline' : `baseline-${phase}`}.json`), JSON.stringify({
    head: git(['rev-parse', 'HEAD']).trim(), origin: git(['rev-parse', 'origin/main']).trim(),
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    privateCopy, dependencies: join(dependencyRoot, 'node_modules'),
    hashes: Object.fromEntries(files.map(file => [file, hash(readFileSync(join(privateCopy, file)))])),
  }, null, 2) + '\n')
  writeFileSync(join(prefix, `${phase}-scoped-tracked.patch`), git(['diff', '--', ...files.map(file => `packages/dsh-pm-tool/${file}`)]))
} else {
  if (!existsSync(join(prefix, 'red-r2.json'))) throw new Error('先保存有效红证据')
  for (const file of files) cpSync(join(packageRoot, file), join(privateCopy, file))
}
const config = join(prefix, 'vitest.config.mjs')
const layout = 'src/client/views/records/records-meeting-layout.test.tsx'
const args = [vitest, 'run', layout, '--config', config, '--maxWorkers=1', '--minWorkers=1', '--no-cache']
if (isGreen) args.splice(3, 0,
  'src/client/views/records/records-meeting-entry.test.tsx', 'src/client/shared/records-callbacks.test.ts',
  'src/client/views/records/records-payloads.test.ts', 'src/client/views/records/records-options.test.ts',
  'src/client/views/records-entry-guard.test.ts', 'src/client/form-validation.test.ts')
const commands = [['vitest', args]]
if (isGreen) commands.push(['tsc-noemit', [tsc, '--noEmit', '-p', 'tsconfig.json', '--incremental', 'false']])
const evidence = {
  phase, privateCopy, config,
  sourceHashes: Object.fromEntries(files.map(file => [file, hash(readFileSync(join(privateCopy, file)))])),
  commands: [],
}
for (const [name, argv] of commands) {
  const result = spawnSync(process.execPath, argv, {
    cwd: privateCopy, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, TMPDIR: join(prefix, 'privatecache/tmp'), XDG_CACHE_HOME: join(prefix, 'privatecache'), CI: 'true' },
  })
  writeFileSync(join(prefix, `${phase}-${name}.log`), result.stdout + result.stderr)
  evidence.commands.push({ name, command: process.execPath, argv, cwd: privateCopy,
    exit: result.status, signal: result.signal, error: result.error?.message ?? null })
  process.stdout.write(`${name}: exit=${result.status}\n${result.stdout}${result.stderr}`)
}
if (isGreen) {
  for (const file of files.slice(0, 2)) {
    const result = spawnSync('diff', ['-u', join(prefix, 'before', file), join(privateCopy, file)], { encoding: 'utf8' })
    writeFileSync(join(prefix, `${file.endsWith('.tsx') ? 'meeting-form' : 'records-css'}-developer.patch`), result.stdout)
  }
  writeFileSync(join(prefix, 'final-scoped-tracked.patch'), git(['diff', '--', ...files.map(file => `packages/dsh-pm-tool/${file}`)]))
}
writeFileSync(join(prefix, `${phase}.json`), JSON.stringify(evidence, null, 2) + '\n')
if (isRed) {
  if (evidence.commands[0].exit !== 1) throw new Error('预期布局红测 exit1')
} else if (evidence.commands.some(command => command.exit !== 0)) {
  process.exitCode = 1
}

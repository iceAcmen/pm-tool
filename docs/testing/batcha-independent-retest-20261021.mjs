/**
 * 独立复验：复制候选源码到自有 tmp；只运行既有测试及内存竞态探针。
 * 不构建、不启动产品服务、不读取凭据；输出仅 testing 自有原证。
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const round = process.argv[2] ?? 'r2'
if (!/^r[2-9][0-9]*$/.test(round)) throw new Error('使用 r2/r3 等新轮次，不覆盖首轮原证')
const suffix = `-${round}`
const dependencies = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const root = mkdtempSync(join(tmpdir(), 'pmtool-independent-batcha-'))
const pkg = join(root, 'packages/dsh-pm-tool')
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const git = (...args) => spawnSync('git', args, { cwd: repo, encoding: 'utf8' }).stdout.trim()
const files = [
  'launcher/src/local-app.mjs', 'launcher/src/launcher-app.mjs',
  'launcher/src/dsh-controller.mjs', 'launcher/src/launcher-core.mjs',
  'launcher/test/local-app.test.mjs', 'launcher/test/app.loopback.test.mjs',
  'launcher/test/cancel.race.test.mjs', 'launcher/test/journey-race.test.mjs',
  'launcher/package.json',
  'packages/dsh-pm-tool/src/client/result-card.tsx',
  'packages/dsh-pm-tool/src/client/result-card.test.ts',
  'packages/dsh-pm-tool/src/client/result-card-copy.ts',
  'packages/dsh-pm-tool/src/client/result-card-copy.test.ts',
  'packages/dsh-pm-tool/src/client/panel.tsx',
  'packages/dsh-pm-tool/src/client/shared/contract-pilot.test.ts',
  'packages/dsh-pm-tool/src/core/ui-feedback.ts',
  'packages/dsh-pm-tool/src/core/file-root.test.ts',
  'packages/dsh-pm-tool/src/core/file-asset-store.ts',
  'packages/dsh-pm-tool/scripts/verify-isolation.mjs',
  'packages/dsh-pm-tool/scripts/verify-ui-feedback.mjs',
  'packages/dsh-pm-tool/package.json', 'packages/dsh-pm-tool/pnpm-lock.yaml',
  'packages/dsh-pm-tool/tsconfig.json', 'packages/dsh-pm-tool/vitest.config.ts',
]
mkdirSync(pkg, { recursive: true })
cpSync(join(repo, 'launcher/src'), join(root, 'launcher/src'), { recursive: true })
mkdirSync(join(root, 'launcher/test'), { recursive: true })
for (const name of ['local-app.test.mjs', 'app.loopback.test.mjs', 'cancel.race.test.mjs', 'journey-race.test.mjs']) {
  cpSync(join(repo, 'launcher/test', name), join(root, 'launcher/test', name))
}
cpSync(join(repo, 'packages/dsh-pm-tool/src'), join(pkg, 'src'), { recursive: true })
cpSync(join(repo, 'packages/dsh-pm-tool/vitest.config.ts'), join(pkg, 'vitest.config.ts'))
cpSync(join(repo, 'packages/dsh-pm-tool/tsconfig.json'), join(pkg, 'tsconfig.json'))
cpSync(join(repo, 'packages/dsh-pm-tool/package.json'), join(pkg, 'package.json'))
cpSync(join(here, 'batcha-result-card-additional-20261021.test.ts'), join(pkg, 'src/client/batcha-result-card-additional-20261021.test.ts'))
mkdirSync(join(pkg, 'scripts'), { recursive: true })
cpSync(join(repo, 'packages/dsh-pm-tool/scripts/verify-isolation.mjs'), join(pkg, 'scripts/verify-isolation.mjs'))
symlinkSync(dependencies, join(pkg, 'node_modules'))
const beforeHashes = Object.fromEntries(files.map(p => [p, sha(join(repo, p))]))
const result = {
  round, runnerSha256: sha(fileURLToPath(import.meta.url)),
  startedAt: new Date().toISOString(), node: process.version, platform: process.platform,
  head: git('rev-parse', 'HEAD'), baseline: git('rev-parse', '2a76030'), root,
  dependencies, sourceHashes: beforeHashes,
  trackedDiffSha256: createHash('sha256').update(git('diff', '2a76030', '--', 'launcher', 'packages/dsh-pm-tool')).digest('hex'),
  dependencyVersions: Object.fromEntries(['react', 'react-test-renderer', 'vitest'].map(name =>
    [name, JSON.parse(readFileSync(join(dependencies, name, 'package.json'), 'utf8')).version])),
  additionalTestSha256: sha(join(here, 'batcha-result-card-additional-20261021.test.ts')),
  commands: [], probes: [], fileRoot: [],
}
function command(label, args, cwd) {
  const child = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', timeout: 120_000, maxBuffer: 8 * 1024 * 1024 })
  const log = join(here, `batcha-independent-retest-${label}-20261021${suffix}.txt`)
  if (existsSync(log)) throw new Error('该轮证据已存在，请使用下一轮次')
  writeFileSync(log, `${child.stdout ?? ''}${child.stderr ?? ''}`, 'utf8')
  result.commands.push({ label, executable: process.execPath, args, cwd, exit: child.status, signal: child.signal, log: log.slice(repo.length + 1) })
  return child
}
command('launcher', ['--test', 'launcher/test/local-app.test.mjs', 'launcher/test/app.loopback.test.mjs'], root)
command('launcher-races', ['--test', 'launcher/test/cancel.race.test.mjs', 'launcher/test/journey-race.test.mjs'], root)
const vitest = join(dependencies, 'vitest/vitest.mjs')
command('component', [vitest, 'run', 'src/client/result-card.test.ts', 'src/client/result-card-copy.test.ts', 'src/client/shared/contract-pilot.test.ts', '--maxWorkers=1', '--minWorkers=1'], pkg)
command('component-additional', [vitest, 'run', 'src/client/batcha-result-card-additional-20261021.test.ts', '--maxWorkers=1', '--minWorkers=1'], pkg)

const { createLauncherApp } = await import(pathToFileURL(join(root, 'launcher/src/launcher-app.mjs')))
const { createDshController } = await import(pathToFileURL(join(root, 'launcher/src/dsh-controller.mjs')))
const { buildManifest, diff } = await import(pathToFileURL(join(pkg, 'scripts/verify-isolation.mjs')))
const running = { tcpOpen: true, httpStatus: 401, authRequiredBody: 'dsh web authentication required' }
const stopped = { tcpOpen: false }
const deferred = () => {
  let resolve, reject
  const promise = new Promise((ok, bad) => { resolve = ok; reject = bad })
  return { promise, resolve, reject }
}
const tick = () => new Promise(ok => setImmediate(ok))
function make(probeService, controller) {
  const opened = []
  const forgotten = []
  const app = createLauncherApp({
    port: 3998, probeService, browsers: ['Chrome', 'Safari'],
    openBrowser: argv => opened.push(argv),
    controller: controller ?? {
      start: async () => ({ pid: 9001, authenticatedUrl: 'http://127.0.0.1:3998/' }),
      cancelStartup() {}, forgetAuthenticatedUrl: pid => forgotten.push(pid),
    }, dsh: {},
  })
  app.setLoopbackPort(3999)
  return { app, opened, forgotten }
}
function nonce(argv) {
  return argv.join(' ').match(/pm-launch=3999\.([a-f0-9]+)/)?.[1]
}
function record(id, expected, observed) {
  result.probes.push({ id, expected, observed })
}
for (const action of ['cancel', 'back']) {
  for (const outcome of ['running', 'stopped']) {
    const gate = deferred()
    let starts = 0
    const ctx = make(() => gate.promise, {
      start: async () => { starts++; return { pid: 9001, authenticatedUrl: 'http://127.0.0.1:3998/' } },
      cancelStartup() {}, forgetAuthenticatedUrl() {},
    })
    const pending = ctx.app.handleAction({ type: 'open' })
    await ctx.app.handleAction({ type: action })
    const afterCancel = ctx.app.getState().status
    gate.resolve(outcome === 'running' ? running : stopped)
    await pending
    record(`probe-${action}-${outcome}`, '取消/返回后不投递、不新启动且保持S0', {
      afterCancel, final: ctx.app.getState().status, opens: ctx.opened.length, starts,
      lateHandleAccepted: ctx.opened.length ? ctx.app.verifyEntered(nonce(ctx.opened.at(-1))) : false,
    })
  }
}
{
  const gate = deferred()
  let count = 0
  const ctx = make(() => ++count === 1 ? gate.promise : Promise.resolve(running))
  const older = ctx.app.handleAction({ type: 'open' })
  await ctx.app.handleAction({ type: 'retry' })
  const fresh = nonce(ctx.opened.at(-1))
  gate.resolve(running)
  await older
  record('probe-retry-order', '旧探测不得投递或撤销新旅程句柄', {
    opens: ctx.opened.length, currentHandleStillAccepted: ctx.app.verifyEntered(fresh),
    lateHandleAccepted: ctx.app.verifyEntered(nonce(ctx.opened.at(-1))), status: ctx.app.getState().status,
  })
}
for (const action of ['cancel', 'retry']) {
  const readiness = deferred()
  const terminated = []
  const controller = createDshController({
    spawn: () => ({ pid: 9101, stdout: { on() {} }, stderr: { on() {} } }),
    isReady: () => readiness.promise,
    terminate: (child, signal) => terminated.push({ pid: child.pid, signal }),
    waitExit: async () => true,
  })
  let count = 0
  const ctx = make(async () => ++count === 1 ? stopped : running, controller)
  const pending = ctx.app.handleAction({ type: 'open' })
  await tick()
  await ctx.app.handleAction({ type: action })
  if (action === 'retry') {
    const fresh = nonce(ctx.opened.at(-1))
    if (ctx.app.verifyEntered(fresh)) ctx.app.onEntered(fresh)
  }
  const beforeLateFailure = ctx.app.getState().status
  readiness.reject(new Error('QA controlled readiness failure'))
  await pending
  record(`owned-late-failure-${action}`, '旧启动失败不得覆盖取消S0或新旅程S4', {
    beforeLateFailure, final: ctx.app.getState().status, opens: ctx.opened.length, terminated,
  })
}
{
  const ready = [deferred(), deferred()]
  let spawns = 0
  let probes = 0
  const terminated = []
  const controller = createDshController({
    spawn: () => {
      const pid = 9201 + spawns++
      return { pid, stdout: { on(_e, fn) { queueMicrotask(() => fn('dsh web: http://127.0.0.1:3998/?token=qa-fixture-only\n')) } }, stderr: { on() {} } }
    },
    isReady: () => ready[probes++].promise,
    terminate: (child, signal) => terminated.push({ pid: child.pid, signal }),
    waitExit: async () => true,
  })
  const ctx = make(async () => stopped, controller)
  const first = ctx.app.handleAction({ type: 'open' })
  await tick()
  const second = ctx.app.handleAction({ type: 'retry' })
  await tick()
  await ctx.app.handleAction({ type: 'cancel' })
  ready[0].resolve(true)
  ready[1].resolve(false)
  await Promise.all([first, second])
  record('owned-overlap-cancel', '同控制器不得遗留先前尚未就绪的owned启动', {
    spawns, terminated, opens: ctx.opened.length, final: ctx.app.getState().status,
    retainedAuthenticatedEntries: controller.listOwnedPids().length,
  })
}
{
  const ctx = make(async () => running)
  await ctx.app.handleAction({ type: 'select-browser', browser: 'Chrome' })
  await ctx.app.handleAction({ type: 'open' })
  const handle = nonce(ctx.opened.at(-1))
  await ctx.app.handleAction({ type: 'select-browser', browser: 'Safari' })
  const afterPreference = ctx.app.verifyEntered(handle)
  await ctx.app.handleAction({ type: 'select-browser', browser: 'Chrome' })
  const afterRestoringPreference = ctx.app.verifyEntered(handle)
  record('select-browser-observation', '仅观察偏好与已投递旅程，不据此单独判FAIL', {
    afterPreference, afterRestoringPreference, deliveredBrowser: ctx.app.getState().browser,
    selectedBrowser: ctx.app.getState().selectedBrowser, opens: ctx.opened.length,
  })
}
for (let n = 1; n <= 2; n++) {
  const facilityRoot = mkdtempSync(join(tmpdir(), 'pmtool-independent-fileroot-'))
  const facilityPkg = join(facilityRoot, 'packages/dsh-pm-tool')
  mkdirSync(facilityPkg, { recursive: true })
  cpSync(join(pkg, 'src/core'), join(facilityPkg, 'src/core'), { recursive: true })
  cpSync(join(pkg, 'vitest.config.ts'), join(facilityPkg, 'vitest.config.ts'))
  cpSync(join(pkg, 'tsconfig.json'), join(facilityPkg, 'tsconfig.json'))
  cpSync(join(pkg, 'package.json'), join(facilityPkg, 'package.json'))
  symlinkSync(dependencies, join(facilityPkg, 'node_modules'))
  const assets = join(facilityRoot, 'assets')
  const before = buildManifest([assets])
  const test = command(`fileroot-${n}`, [vitest, 'run', 'src/core/file-root.test.ts', '--maxWorkers=1', '--minWorkers=1'], facilityPkg)
  const after = buildManifest([assets])
  result.fileRoot.push({
    facilityRoot, testExit: test.status, before: [...before], after: [...after],
    assetsExists: existsSync(assets), entries: existsSync(assets) ? readdirSync(assets) : null,
    changes: diff(before, after),
  })
}
result.afterSourceHashes = Object.fromEntries(files.map(p => [p, sha(join(repo, p))]))
result.copiedSourceHashes = Object.fromEntries(files.filter(p => existsSync(join(root, p))).map(p => [p, sha(join(root, p))]))
result.sourceChangedWhileTesting = files.filter(p => beforeHashes[p] !== result.afterSourceHashes[p])
result.rawLogArchives = readdirSync(here).filter(p => p.startsWith('batcha-independent-retest-') && p.endsWith('.log')).map(name => {
  const archive = name.replace(/\.log$/, '.txt')
  if (!existsSync(join(here, archive))) cpSync(join(here, name), join(here, archive))
  if (sha(join(here, name)) !== sha(join(here, archive))) throw new Error('原证归档字节不一致')
  return { original: name, archive, sha256: sha(join(here, archive)) }
})
result.finishedAt = new Date().toISOString()
const output = join(here, `batcha-independent-retest-result-20261021${suffix}.json`)
writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({
  output: output.slice(repo.length + 1), root,
  tests: result.commands.map(({ label, exit }) => ({ label, exit })),
  probes: result.probes, fileRoot: result.fileRoot,
  sourceChangedWhileTesting: result.sourceChangedWhileTesting,
}, null, 2))

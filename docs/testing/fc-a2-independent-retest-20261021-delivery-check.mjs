import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const prefix = 'fc-a2-independent-retest-20261021'
const output = join(here, `${prefix}-delivery-check.json`)
if (existsSync(output)) throw new Error('禁止覆盖旧原证')
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const candidate = JSON.parse(readFileSync(join(repo, 'reports/all-pending-evidence-20261021/A2/candidate.json')))
const root = JSON.parse(readFileSync(join(here, `${prefix}-initial-result.json`))).root
const deps = [
  'launcher/src/launcher-core.mjs', 'launcher/src/browsers.mjs',
  'launcher/bin/pm-launcher.mjs', 'launcher/src/loopback.mjs',
]
const identity = deps.map(path => {
  const baseline = spawnSync('git', ['show', `${candidate.productBase}:${path}`], { cwd: repo })
  if (baseline.status !== 0) throw new Error('基线读取失败')
  return {
    path, main: sha(join(repo, path)), isolated: sha(join(candidate.worktree, path)),
    baseline: createHash('sha256').update(baseline.stdout).digest('hex'),
  }
})
const { openBrowserArgs } = await import(join(root, 'launcher/src/launcher-core.mjs'))
const { createLauncherApp } = await import(join(root, 'launcher/src/launcher-app.mjs'))
const launcher = readFileSync(join(repo, 'launcher/bin/pm-launcher.mjs'), 'utf8')
const begin = launcher.indexOf('function openBrowser(argv)')
const end = launcher.indexOf('\nfunction isReadyFactory', begin)
if (begin < 0 || end < 0) throw new Error('未找到原生产投递函数')
const exactFunction = launcher.slice(begin, end)
const events = []
// 执行原函数字节，spawn只用无外部效果的异步失败接缝；不运行open/Chrome/dsh。
const nativeOpen = runInNewContext(`${exactFunction}\nopenBrowser`, {
  spawn: (_exec, _args, opts) => {
    events.push({ event: 'spawn', detached: opts.detached, stdio: opts.stdio })
    setImmediate(() => events.push({ event: 'child-close', code: 17 }))
    return { unref: () => events.push({ event: 'unref' }) }
  },
})
const app = createLauncherApp({
  port: 3211, browsers: ['Chrome'],
  probeService: async () => ({ tcpOpen: true, httpStatus: 401, authRequiredBody: 'dsh web authentication required' }),
  openBrowser: nativeOpen, controller: { cancelStartup() {} },
})
await app.detect()
await app.handleAction({ type: 'select-browser', browser: 'Chrome' })
const returned = await app.handleAction({ type: 'open' })
await new Promise(resolve => setImmediate(resolve))
const manual = spawnSync('/usr/bin/man', ['open'], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 })
const cleanManual = (manual.stdout ?? '').replace(/.\x08/g, '')
const marker = cleanManual.indexOf('--args\n')
const manualLog = join(here, `${prefix}-open-man.txt`)
if (existsSync(manualLog)) throw new Error('禁止覆盖手册原证')
writeFileSync(manualLog, cleanManual)
const result = {
  at: new Date().toISOString(), node: process.version, platform: process.platform,
  checkerSha256: sha(fileURLToPath(import.meta.url)), sourceIdentity: identity,
  productionOpenFunctionSha256: createHash('sha256').update(exactFunction).digest('hex'),
  nonSensitiveFixture: 'http://127.0.0.1:3211/fc-a2-nonsecret-fixture',
  actualChromeArgs: openBrowserArgs('Chrome', 'http://127.0.0.1:3211/fc-a2-nonsecret-fixture'),
  tabAlternative: openBrowserArgs('Chrome', 'http://127.0.0.1:3211/fc-a2-nonsecret-fixture', { appWindow: false }),
  asynchronousExitFixture: { events, returnedStatus: returned.status, finalStatus: app.getState().status },
  manual: {
    executable: '/usr/bin/man', args: ['open'], exit: manual.status,
    log: manualLog.slice(repo.length + 1), sha256: sha(manualLog),
    argsSemantics: marker < 0 ? null : cleanManual.slice(marker, marker + 235),
  },
  boundary: '只证明生产函数字节、参数与异步失败无处理；未运行LaunchServices/真实Chrome投递，不判已运行Chrome忽略参数、Finder或S4认证',
}
writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))

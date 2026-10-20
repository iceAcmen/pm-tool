/**
 * P1 返修红测试：cancel 竞态（真实控制器 + 真实编排，非 stub 状态机）。
 *  - cancel（ready前）回收自己尚未就绪的 owned 子进程：SIGTERM + 有界等待；不杀 ready 服务/未知 PID。
 *  - ready 后 cancel 不杀已就绪服务；重复 cancel 幂等；失败后 cancel 为 no-op。
 *  - 编排收到 STARTUP_ABORTED 保持 S0，不得异步转 S6 覆盖取消；不打开浏览器。
 * 隔离：不碰 3172、不启正式 DSH、不读 cookie；真实假子进程为自拉起的瞬时 node。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

import { createDshController } from '../src/dsh-controller.mjs'
import { createLauncherApp } from '../src/launcher-app.mjs'

const tick = () => new Promise((r) => setImmediate(r))

function fakeChild(pid) {
  return {
    pid,
    stdout: { on(ev, fn) { if (ev === 'data') queueMicrotask(() => fn('dsh web: http://127.0.0.1:0/?token=MemToken\n')) } },
    stderr: { on() {} },
    kill() {},
  }
}

const baseOpts = () => ({ cwd: '/tmp/fake-dsh', nodePath: process.execPath, port: 0, env: {} })

function waitExit(child, timeoutMs = 2000) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.killed) return resolve(true)
    const t = setTimeout(() => resolve(false), timeoutMs)
    child.once('exit', () => { clearTimeout(t); resolve(true) })
  })
}

// ---------------------------------------------------------------------------
// 控制器：cancel（ready 前）只回收自己尚未就绪的 owned 子进程
// ---------------------------------------------------------------------------
test('cancel（ready前）：SIGTERM 回收未就绪 owned 子进程并抛 STARTUP_ABORTED，不留 owned', async () => {
  const calls = []
  const child = fakeChild(8201)
  child.kill = (sig) => calls.push(sig)
  const controller = createDshController({
    spawn: () => child,
    isReady: async () => false,
    sleep: async () => {},
    readyTimeoutMs: 2000,
    readyIntervalMs: 10,
    terminate: (c, sig) => calls.push(sig),
    waitExit: async () => {},
  })
  const p = controller.start(baseOpts())
  await tick()
  controller.cancelStartup()
  await assert.rejects(p, (e) => e.code === 'STARTUP_ABORTED')
  assert.deepEqual(calls, ['SIGTERM'])
  assert.deepEqual(controller.listOwnedPids(), [])
})

test('ready 后 cancel：不杀已就绪 owned 服务，保留 pid（不终止已启动 PM）', async () => {
  const killed = []
  const child = fakeChild(8202)
  child.kill = (sig) => killed.push(sig)
  const controller = createDshController({
    spawn: () => child,
    isReady: async () => true,
    sleep: async () => {},
    terminate: (c, sig) => killed.push(sig),
    waitExit: async () => {},
  })
  const entry = await controller.start(baseOpts())
  assert.equal(entry.pid, 8202)
  controller.cancelStartup()
  assert.deepEqual(killed, [])
  assert.deepEqual(controller.listOwnedPids(), [8202])
})

test('重复 cancel 幂等：未就绪子进程只 SIGTERM 一次，不重复回收', async () => {
  const calls = []
  const child = fakeChild(8203)
  const controller = createDshController({
    spawn: () => child,
    isReady: async () => false,
    sleep: async () => {},
    readyTimeoutMs: 2000,
    readyIntervalMs: 10,
    terminate: (c, sig) => calls.push(sig),
    waitExit: async () => {},
  })
  const p = controller.start(baseOpts())
  await tick()
  controller.cancelStartup()
  controller.cancelStartup()
  await assert.rejects(p, (e) => e.code === 'STARTUP_ABORTED')
  assert.equal(calls.filter((s) => s === 'SIGTERM').length, 1)
})

test('启动失败（非取消，超时）→ 抛错由编排落 S6；失败后 cancel 为 no-op 不抛、不终止未知进程', async () => {
  const child = fakeChild(8204)
  const calls = []
  const controller = createDshController({
    spawn: () => child,
    isReady: async () => false,
    sleep: async () => {},
    readyTimeoutMs: 50,
    readyIntervalMs: 10,
    terminate: (c, sig) => calls.push(sig),
    waitExit: async () => {},
  })
  await assert.rejects(controller.start(baseOpts()), /超时/)
  assert.doesNotThrow(() => controller.cancelStartup())
  assert.deepEqual(calls, [])
})

// ---------------------------------------------------------------------------
// 编排：STARTUP_ABORTED 保持 S0，不异步转 S6 覆盖取消，不打开浏览器
// ---------------------------------------------------------------------------
test('编排：S2 取消收到 STARTUP_ABORTED 保持 S0，不转 S6，不投递浏览器', async () => {
  let resolveReady
  const readyP = new Promise((r) => { resolveReady = r })
  const child = fakeChild(8301)
  const controller = createDshController({
    spawn: () => child,
    isReady: async () => { await readyP; return true },
    sleep: async () => {},
    readyTimeoutMs: 2000,
    terminate: () => {},
    waitExit: async () => {},
  })
  const opened = []
  const app = createLauncherApp({
    port: 3172,
    probeService: async () => ({ tcpOpen: false, httpStatus: undefined, authRequiredBody: '' }),
    openBrowser: (argv) => opened.push(argv),
    controller,
    browsers: [],
    dsh: { cwd: '/tmp', nodePath: process.execPath, env: {} },
  })
  await app.detect()
  const openP = app.handleAction({ type: 'open' })
  await tick()
  await app.handleAction({ type: 'cancel' })
  resolveReady(true)
  await openP
  assert.equal(app.getState().status, 'S0')
  assert.equal(opened.length, 0)
})

// ---------------------------------------------------------------------------
// 隔离真实假子进程：cancel SIGTERM 后真实退出（自拉起瞬时 node，不碰 3172/DSH）
// ---------------------------------------------------------------------------
test('隔离真实 owned 假子进程：cancel SIGTERM 后真实退出', async () => {
  let real
  const controller = createDshController({
    spawn: () => {
      real = spawn(process.execPath, ['-e', 'setTimeout(()=>{},30000)'])
      return real
    },
    isReady: async () => false,
    sleep: async () => {},
    readyTimeoutMs: 2000,
    readyIntervalMs: 10,
  })
  const p = controller.start(baseOpts())
  await tick()
  controller.cancelStartup()
  await assert.rejects(p, (e) => e.code === 'STARTUP_ABORTED')
  const exited = await waitExit(real, 2000)
  assert.equal(exited, true)
  // SIGTERM 由信号终止：exitCode 为 null，signalCode 记录信号。
  assert.ok(real.exitCode !== null || real.signalCode !== null)
})

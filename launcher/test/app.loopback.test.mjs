/**
 * 编排层 + loopback 真实 IO 集成（假探测/假 open/假控制器；临时端口；不碰 3172；不读 cookie）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createLauncherApp } from '../src/launcher-app.mjs'
import { createControlServer } from '../src/loopback.mjs'
import { renderControlHtml } from '../src/control-html.mjs'
import { createDshController } from '../src/dsh-controller.mjs'

function makeController() {
  return createDshController({
    spawn: () => ({
      pid: 9001,
      stdout: { on(_e, fn) { queueMicrotask(() => fn('dsh web: http://127.0.0.1:3172/?token=MemToken\n')) } },
      stderr: { on() {} },
    }),
    isReady: async () => true,
    sleep: async () => {},
  })
}

function makeApp(probeResult, controller) {
  const calls = []
  const app = createLauncherApp({
    port: 3172,
    probeService: async () => probeResult,
    openBrowser: (argv) => calls.push(argv),
    controller,
    browsers: ['Chrome'],
    dsh: { cwd: '/tmp/x', nodePath: '/usr/bin/node', env: {} },
  })
  return { app, calls }
}

test('running(200)：open → S3，openBrowser 收到干净 URL 且无 token；状态不含 token', async () => {
  const controller = makeController()
  const { app, calls } = makeApp({ tcpOpen: true, httpStatus: 200, authRequiredBody: '' }, controller)
  await app.detect()
  const s = await app.handleAction({ type: 'open', browser: 'Chrome' })
  assert.equal(s.status, 'S3')
  assert.equal(calls.length, 1)
  assert.ok(!JSON.stringify(calls[0]).includes('MemToken'))
  assert.ok(calls[0].join(' ').includes('http://127.0.0.1:3172/'))
  assert.ok(!JSON.stringify(app.getState()).includes('MemToken'))
})

test('not-running：owned start → 内存 token URL 投递一次后即弃 → S3；S3 确认 → S4', async () => {
  const controller = makeController()
  const { app, calls } = makeApp({ tcpOpen: false, httpStatus: undefined, authRequiredBody: '' }, controller)
  await app.detect()
  let s = await app.handleAction({ type: 'open' })
  assert.equal(s.status, 'S3')
  assert.equal(calls.length, 1)
  assert.ok(calls[0].join(' ').includes('token=MemToken'))
  // 投递后 owned 内存 URL 已丢弃
  assert.deepEqual(controller.listOwnedPids(), [])
  assert.ok(!JSON.stringify(app.getState()).includes('MemToken'))
  s = await app.handleAction({ type: 'confirm-entered' })
  assert.equal(s.status, 'S4')
  assert.equal(s.confirmed, true)
})

test('S3 反馈登录错误 → S5；retry → S3；不自动 S4、不重放 token', async () => {
  const controller = makeController()
  const { app } = makeApp({ tcpOpen: true, httpStatus: 200, authRequiredBody: '' }, controller)
  await app.detect()
  let s = await app.handleAction({ type: 'open' })
  s = await app.handleAction({ type: 'report-auth-error' })
  assert.equal(s.status, 'S5')
  s = await app.handleAction({ type: 'retry' })
  assert.equal(s.status, 'S3')
  assert.notEqual(s.status, 'S4')
})

test('conflict → S6；back → S0；S2 cancel 调用 cancelStartup 且回 S0，不杀进程', async () => {
  const controller = makeController()
  let cancelled = false
  controller.cancelStartup = () => { cancelled = true }
  const { app } = makeApp({ tcpOpen: true, httpStatus: 503, authRequiredBody: 'other' }, controller)
  await app.detect()
  let s = app.getState()
  assert.equal(s.status, 'S6')
  s = await app.handleAction({ type: 'back' })
  assert.equal(s.status, 'S0')

  const app2 = createLauncherApp({
    port: 3172,
    probeService: async () => ({ tcpOpen: false, httpStatus: undefined }),
    openBrowser: () => {},
    controller,
    browsers: [],
    dsh: { cwd: '/tmp/x', nodePath: '/usr/bin/node', env: {} },
  })
  await app2.detect()
  await app2.handleAction({ type: 'open' })
  await app2.handleAction({ type: 'cancel' })
  assert.equal(app2.getState().status, 'S0')
  assert.equal(cancelled, true)
})

test('loopback：GET / 渲染标题；GET /api/state；POST /api/action；响应不含 token', async () => {
  const controller = makeController()
  const app = createLauncherApp({
    port: 3172,
    probeService: async () => ({ tcpOpen: true, httpStatus: 200, authRequiredBody: '' }),
    openBrowser: () => {},
    controller,
    browsers: [],
    dsh: {},
  })
  await app.detect()
  const server = createControlServer({
    getState: () => app.getState(),
    handleAction: (p) => app.handleAction(p),
    renderHtml: (st) => renderControlHtml(app.view(), { initialState: st }),
  })
  const { port, close } = await server.listen()
  try {
    const root = await fetch(`http://127.0.0.1:${port}/`)
    const html = await root.text()
    assert.ok(html.includes('PM 工作台'))
    assert.ok(!html.includes('MemToken'))

    const st = await (await fetch(`http://127.0.0.1:${port}/api/state`)).json()
    assert.ok(st.state.status)

    const act = await fetch(`http://127.0.0.1:${port}/api/action`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'confirm-entered' }),
    })
    const body = await act.json()
    assert.equal(body.state.status, 'S4')
    assert.ok(!JSON.stringify(body).includes('MemToken'))
  } finally {
    await close()
  }
})

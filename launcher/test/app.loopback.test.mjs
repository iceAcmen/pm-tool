/**
 * 编排层 + loopback 真实 IO 集成（假探测/假 open/假控制器；临时端口；不碰 3172；不读 cookie）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

import { createLauncherApp } from '../src/launcher-app.mjs'
import { createControlServer } from '../src/loopback.mjs'
import { renderControlHtml } from '../src/control-html.mjs'
import { createDshController } from '../src/dsh-controller.mjs'

const AUTH_WALL = 'dsh web authentication required; reopen the URL printed by dsh web.'

/** 裸 http 注入 Origin（fetch 禁止手写 Origin 头）。 */
function postEntered(port, { origin, body }) {
  return new Promise((resolve) => {
    const req = http.request(
      { host: '127.0.0.1', port, path: '/api/entered', method: 'POST',
        headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) } },
      (res) => {
        let raw = ''
        res.on('data', (c) => { raw += c })
        res.on('end', () => resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : {} }))
      },
    )
    req.end(JSON.stringify(body))
  })
}

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

test('回告只属于当前旅程：重开/重试/切浏览器撤销旧句柄，取消/返回后不得进入S4', async () => {
  for (const action of ['open', 'reopen', 'retry', 'switch-browser', 'cancel', 'back']) {
    const { app, calls } = makeApp({ tcpOpen: true, httpStatus: 401, authRequiredBody: AUTH_WALL }, makeController())
    app.setLoopbackPort(3999)
    await app.detect()
    await app.handleAction({ type: 'open' })
    const old = calls[0].join(' ').match(/pm-launch=3999\.([a-f0-9]+)/)[1]
    await app.handleAction({ type: action, browser: 'Safari' })
    assert.equal(app.verifyEntered(old), false, `${action} 后旧回告拒绝`)
    const before = app.getState().status
    app.onEntered(old)
    assert.equal(app.getState().status, before, '未经当前有效校验不得进入S4')
    if (['open', 'reopen', 'retry'].includes(action)) {
      const fresh = calls.at(-1).join(' ').match(/pm-launch=3999\.([a-f0-9]+)/)[1]
      assert.equal(app.verifyEntered(fresh), true)
      assert.equal(app.onEntered(fresh).status, 'S4')
      assert.equal(app.verifyEntered(fresh), false)
    }
  }
})

test('running(401 鉴权墙)：open → S3，openBrowser 收到干净 URL 且无 token；状态不含 token', async () => {
  const controller = makeController()
  const { app, calls } = makeApp({ tcpOpen: true, httpStatus: 401, authRequiredBody: AUTH_WALL }, controller)
  await app.detect()
  const s = await app.handleAction({ type: 'open', browser: 'Chrome' })
  assert.equal(s.status, 'S3')
  assert.equal(calls.length, 1)
  assert.ok(!JSON.stringify(calls[0]).includes('MemToken'))
  assert.ok(calls[0].join(' ').includes('http://127.0.0.1:3172/'))
  assert.ok(!JSON.stringify(app.getState()).includes('MemToken'))
})

test('自定义 host/port：探测收到 host，已运行打开的干净 URL 与状态均用配置值而非硬编码 3172', async () => {
  const controller = makeController()
  const seen = []
  const calls = []
  const app = createLauncherApp({
    host: '127.0.0.1',
    port: 3199,
    probeService: async (arg) => { seen.push(arg); return { tcpOpen: true, httpStatus: 401, authRequiredBody: AUTH_WALL } },
    openBrowser: (argv) => calls.push(argv),
    controller,
    browsers: ['Chrome'],
    dsh: { cwd: '/tmp/x', nodePath: '/usr/bin/node', env: {} },
  })
  await app.detect()
  assert.equal(seen[0].port, 3199)
  assert.equal(seen[0].host, '127.0.0.1')
  const s = await app.handleAction({ type: 'open', browser: 'Chrome' })
  assert.equal(s.status, 'S3')
  assert.equal(s.port, 3199)
  assert.equal(s.host, '127.0.0.1')
  assert.ok(calls[0].join(' ').includes('http://127.0.0.1:3199/'))
  assert.ok(!calls[0].join(' ').includes('3172'))
})

test('not-running：owned start → 内存 token URL 投递一次后即弃 → S3；权威 nonce 回告 → S4（非按钮）', async () => {
  const controller = makeController()
  const { app, calls } = makeApp({ tcpOpen: false, httpStatus: undefined, authRequiredBody: '' }, controller)
  app.setLoopbackPort(3999)
  await app.detect()
  let s = await app.handleAction({ type: 'open' })
  assert.equal(s.status, 'S3')
  assert.equal(calls.length, 1)
  const opened = calls[0].join(' ')
  assert.ok(opened.includes('token=MemToken'))
  // 投递后 owned 内存 URL 已丢弃
  assert.deepEqual(controller.listOwnedPids(), [])
  assert.ok(!JSON.stringify(app.getState()).includes('MemToken'))
  // 从 hash 回告句柄取 nonce：single-use，校验命中后回告才到 S4。
  const m = opened.match(/pm-launch=3999\.([a-f0-9]+)/)
  assert.ok(m, 'hash 回告句柄存在')
  assert.equal(app.verifyEntered(m[1]), true)
  assert.equal(app.verifyEntered(m[1]), false) // 重复使用被拒
  s = app.onEntered(m[1])
  assert.equal(s.status, 'S4')
  assert.equal(s.confirmed, true)
})

test('回告 nonce 覆盖真实鉴权时长：超过 2 分钟仍有效，超过 10 分钟失效', async () => {
  const realNow = Date.now
  let now = 1_000_000
  Date.now = () => now
  try {
    const controller = makeController()
    const { app, calls } = makeApp({ tcpOpen: true, httpStatus: 401, authRequiredBody: AUTH_WALL }, controller)
    app.setLoopbackPort(3999)
    await app.detect()
    await app.handleAction({ type: 'open' })
    const first = calls[0].join(' ').match(/pm-launch=3999\.([a-f0-9]+)/)
    assert.ok(first)

    now += 2 * 60_000 + 1
    assert.equal(app.verifyEntered(first[1]), true, '首次配置超过两分钟后仍应可完成 S4')

    await app.handleAction({ type: 'reopen' })
    const second = calls[1].join(' ').match(/pm-launch=3999\.([a-f0-9]+)/)
    assert.ok(second)
    now += 10 * 60_000 + 1
    assert.equal(app.verifyEntered(second[1]), false, '十分钟后必须过期')
  } finally {
    Date.now = realNow
  }
})

test('S3 反馈登录错误 → S5；retry → S3；不自动 S4、不重放 token', async () => {
  const controller = makeController()
  const { app } = makeApp({ tcpOpen: true, httpStatus: 401, authRequiredBody: AUTH_WALL }, controller)
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

test('loopback：GET / 渲染标题；GET /api/state；POST /api/entered 权威回告 S4；无效/错 origin 全拒；响应不含 token', async () => {
  const controller = makeController()
  const opened = []
  const app = createLauncherApp({
    port: 3172,
    probeService: async () => ({ tcpOpen: true, httpStatus: 401, authRequiredBody: AUTH_WALL }),
    openBrowser: (argv) => opened.push(argv),
    controller,
    browsers: [],
    dsh: {},
  })
  await app.detect()
  const server = createControlServer({
    getState: () => app.getState(),
    handleAction: (p) => app.handleAction(p),
    renderHtml: (st) => renderControlHtml(app.view(), { initialState: st }),
    expectedOrigin: 'http://127.0.0.1:3172',
    verifyEntered: (n) => app.verifyEntered(n),
    onEntered: (n) => app.onEntered(n),
  })
  const { port, close } = await server.listen()
  app.setLoopbackPort(port)
  try {
    const root = await fetch(`http://127.0.0.1:${port}/`)
    const html = await root.text()
    assert.ok(html.includes('PM 工作台'))
    assert.ok(!html.includes('MemToken'))

    const st = await (await fetch(`http://127.0.0.1:${port}/api/state`)).json()
    assert.ok(st.state.status)

    // 打开 → S3，hash 句柄携带 single-use nonce。
    await app.handleAction({ type: 'open' })
    const m = opened[0].join(' ').match(/pm-launch=\d+\.([a-f0-9]+)/)
    assert.ok(m, 'hash 回告句柄存在')

    // 有效 nonce + 配置的 expectedOrigin → S4（权威回告，非按钮）。
    const ok = await postEntered(port, { origin: 'http://127.0.0.1:3172', body: { nonce: m[1] } })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.state.status, 'S4')
    assert.ok(!JSON.stringify(ok.body).includes('MemToken'))

    // 重复使用同一 nonce → 403。
    const dup = await postEntered(port, { origin: 'http://127.0.0.1:3172', body: { nonce: m[1] } })
    assert.equal(dup.status, 403)

    // 仅 expectedOrigin 可确认：错 origin / 无 Origin / control origin 一律 403（持 nonce≠已认证）。
    const badOrigin = await postEntered(port, { origin: 'http://evil.example', body: { nonce: m[1] } })
    assert.equal(badOrigin.status, 403)
    const noOrigin = await postEntered(port, { origin: undefined, body: { nonce: m[1] } })
    assert.equal(noOrigin.status, 403)
    const controlOrigin = await postEntered(port, { origin: `http://127.0.0.1:${port}`, body: { nonce: m[1] } })
    assert.equal(controlOrigin.status, 403)
    const noNonce = await postEntered(port, { origin: 'http://127.0.0.1:3172', body: {} })
    assert.equal(noNonce.status, 403)
    // nonce 类型错误（非字符串）→ 403。
    const wrongType = await postEntered(port, { origin: 'http://127.0.0.1:3172', body: { nonce: 123 } })
    assert.equal(wrongType.status, 403)
  } finally {
    await close()
  }
})

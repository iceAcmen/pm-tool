import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { openBrowser } from '../src/browser-open.mjs'
import { openBrowserArgs } from '../src/launcher-core.mjs'
import { createLauncherApp } from '../src/launcher-app.mjs'

test('生产浏览器参数：显示标签映射真实应用，普通URL保持一个参数', () => {
  const url = 'http://127.0.0.1:0/中文 path?x=1&y=2#fragment'
  for (const [label, app] of [['Chrome', 'Google Chrome'], ['Microsoft Edge', 'Microsoft Edge'], ['Safari', 'Safari'], ['Firefox', 'Firefox']]) {
    assert.deepEqual(openBrowserArgs(label, url), { argv: ['open', '-a', app, url], mode: 'tab', fallback: false })
  }
})

test('生产OS投递：error/非零/超时有界拒绝，exit0只确认命令接收', async () => {
  for (const mode of ['error', 'nonzero', 'timeout', 'ok']) {
    const child = new EventEmitter()
    let calls = 0
    const promise = openBrowser(['open', 'http://127.0.0.1:0/?token=TestOnly'], {
      timeoutMs: 20,
      spawn(exec, args, opts) {
        calls++
        assert.equal(exec, 'open')
        assert.equal(args.length, 1)
        assert.equal(opts.stdio, 'ignore')
        if (mode === 'error') queueMicrotask(() => child.emit('error', new Error('private token=TestOnly')))
        if (mode === 'nonzero') queueMicrotask(() => child.emit('exit', 17))
        if (mode === 'ok') queueMicrotask(() => child.emit('exit', 0))
        return child
      },
    })
    if (mode === 'ok') await promise
    else await assert.rejects(promise, e => !e.message.includes('TestOnly') && /浏览器|打开/.test(e.message))
    assert.equal(calls, 1)
  }
})

const running = { tcpOpen: true, httpStatus: 401, authRequiredBody: 'dsh web authentication required; reopen the URL printed by dsh web.' }
test('生产app：异步OS失败落S6且不复投，owned首投失败仍弃URL', async () => {
  for (const owned of [false, true]) {
    const calls = []
    const forgotten = []
    const app = createLauncherApp({
      probeService: async () => owned ? { tcpOpen: false } : running,
      openBrowser: async argv => { calls.push(argv); throw new Error('OS打开失败') },
      controller: { cancelStartup() {}, start: async () => ({ pid: 9001, authenticatedUrl: 'http://127.0.0.1:0/?token=TestOnly' }),
        forgetAuthenticatedUrl: pid => forgotten.push(pid) },
    })
    const state = await app.handleAction({ type: 'open' })
    assert.equal(state.status, 'S6')
    assert.equal(state.confirmed, false)
    assert.equal(calls.length, 1)
    assert.deepEqual(forgotten, owned ? [9001] : [])
    assert.ok(!JSON.stringify(state).includes('TestOnly'))
  }
})

test('生产app：取消后迟到OS成功/失败不覆盖S0，先到合法回告不降回S3', async () => {
  for (const failed of [false, true]) {
    let finish
    const app = createLauncherApp({
      probeService: async () => running, controller: { cancelStartup() {} },
      openBrowser: () => new Promise((resolve, reject) => { finish = () => failed ? reject(new Error('late')) : resolve() }),
    })
    const opening = app.handleAction({ type: 'open' })
    await new Promise(resolve => setImmediate(resolve))
    await app.handleAction({ type: 'cancel' })
    finish()
    await opening
    assert.equal(app.getState().status, 'S0')
  }
  let release
  let nonce
  const app = createLauncherApp({
    probeService: async () => running, controller: { cancelStartup() {} },
    openBrowser: argv => {
      nonce = argv.join(' ').match(/pm-launch=3999\.([a-f0-9]+)/)[1]
      return new Promise(resolve => { release = resolve })
    },
  })
  app.setLoopbackPort(3999)
  const opening = app.handleAction({ type: 'open' })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(app.verifyEntered(nonce), true)
  app.onEntered(nonce)
  release()
  await opening
  assert.equal(app.getState().status, 'S4')
})

test('旅程固定浏览器：在途偏好只用于下一轮，不更改已投递归属和nonce', async () => {
  let release
  let args
  const app = createLauncherApp({
    probeService: async () => running, controller: { cancelStartup() {} },
    openBrowser: argv => { args = argv; return new Promise(resolve => { release = resolve }) },
    browsers: ['Chrome', 'Safari'],
  })
  app.setLoopbackPort(3999)
  await app.handleAction({ type: 'select-browser', browser: 'Chrome' })
  const opening = app.handleAction({ type: 'open' })
  await new Promise(resolve => setImmediate(resolve))
  const nonce = args.join(' ').match(/pm-launch=3999\.([a-f0-9]+)/)[1]
  await app.handleAction({ type: 'select-browser', browser: 'Safari' })
  release()
  await opening
  assert.equal(args[2], 'Google Chrome')
  assert.equal(app.getState().browser, 'Chrome')
  assert.equal(app.getState().selectedBrowser, 'Safari')
  assert.equal(app.verifyEntered(nonce), true)
  assert.equal(app.onEntered(nonce).status, 'S4')
})

test('reopen新旅程必须清旧S4：无新回告S3/false，当前新回告才S4', async () => {
  const urls = []
  const app = createLauncherApp({
    probeService: async () => running, controller: { cancelStartup() {} },
    openBrowser: argv => urls.push(argv),
  })
  app.setLoopbackPort(3999)
  await app.handleAction({ type: 'open' })
  const old = urls.at(-1).join(' ').match(/pm-launch=3999\.([a-f0-9]+)/)[1]
  assert.equal(app.verifyEntered(old), true)
  app.onEntered(old)
  await app.handleAction({ type: 'reopen' })
  const fresh = urls.at(-1).join(' ').match(/pm-launch=3999\.([a-f0-9]+)/)[1]
  assert.notEqual(fresh, old)
  assert.equal(app.getState().status, 'S3')
  assert.equal(app.getState().confirmed, false)
  assert.equal(app.verifyEntered(old), false)
  assert.equal(app.verifyEntered(fresh), true)
  app.onEntered(fresh)
  assert.equal(app.getState().status, 'S4')
})

test('当前合法S4先到，existing/owned/reopen的迟到OS失败不覆盖权威进入', async () => {
  for (const mode of ['existing', 'owned', 'reopen']) {
    let rejectOpen
    let nonce
    let delay = mode !== 'reopen'
    const forgotten = []
    const app = createLauncherApp({
      probeService: async () => mode === 'owned' ? { tcpOpen: false } : running,
      controller: { cancelStartup() {}, start: async () => ({ pid: 9001, authenticatedUrl: 'http://127.0.0.1:0/?token=TestOnly' }),
        forgetAuthenticatedUrl: pid => forgotten.push(pid) },
      openBrowser: argv => {
        nonce = argv.join(' ').match(/pm-launch=3999\.([a-f0-9]+)/)[1]
        if (delay) return new Promise((_resolve, reject) => { rejectOpen = reject })
      },
    })
    app.setLoopbackPort(3999)
    if (mode === 'reopen') {
      await app.handleAction({ type: 'open' })
      assert.equal(app.verifyEntered(nonce), true)
      app.onEntered(nonce)
      delay = true
    }
    const opening = app.handleAction({ type: mode === 'reopen' ? 'reopen' : 'open' })
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(app.verifyEntered(nonce), true)
    app.onEntered(nonce)
    rejectOpen(new Error('late OS failure'))
    await opening
    assert.equal(app.getState().status, 'S4', mode)
    assert.equal(app.getState().confirmed, true, mode)
    assert.deepEqual(forgotten, mode === 'owned' ? [9001] : [])
  }
})

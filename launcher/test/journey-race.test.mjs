import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLauncherApp } from '../src/launcher-app.mjs'

const running = { tcpOpen: true, httpStatus: 401, authRequiredBody: 'dsh web authentication required; reopen the URL printed by dsh web.' }
const stopped = { tcpOpen: false }
function deferred() {
  let resolve, reject
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail })
  return { promise, resolve, reject }
}

test('探测迟到：取消/返回后成功或失败都不启动、不投递、不改变S0', async () => {
  for (const action of ['cancel', 'back']) {
    for (const outcome of [running, stopped, 'reject']) {
      const pending = deferred()
      const calls = []
      let starts = 0
      const app = createLauncherApp({
        probeService: () => pending.promise,
        openBrowser: args => calls.push(args),
        controller: { cancelStartup() {}, start() { starts++; return Promise.resolve({ pid: 9001 }) } },
      })
      const opening = app.handleAction({ type: 'open' })
      await app.handleAction({ type: action })
      if (outcome === 'reject') pending.reject(new Error('late probe'))
      else pending.resolve(outcome)
      await opening
      assert.equal(app.getState().status, 'S0')
      assert.equal(starts, 0)
      assert.equal(calls.length, 0)
    }
  }
})

test('旧探测不能覆盖已投递的新旅程，旧启动失败不能覆盖S4', async () => {
  const pending = deferred()
  let probes = 0
  const calls = []
  const app = createLauncherApp({
    probeService: () => ++probes === 1 ? pending.promise : Promise.resolve(running),
    openBrowser: args => calls.push(args),
    controller: { cancelStartup() {} },
  })
  app.setLoopbackPort(3999)
  const old = app.handleAction({ type: 'open' })
  await app.handleAction({ type: 'retry' })
  const current = calls[0].join(' ').match(/pm-launch=3999\.([a-f0-9]+)/)[1]
  pending.resolve(stopped)
  await old
  assert.equal(calls.length, 1)
  assert.equal(app.verifyEntered(current), true)
  assert.equal(app.onEntered(current).status, 'S4')

  const start = deferred()
  let count = 0
  const opened = []
  const app2 = createLauncherApp({
    probeService: async () => ++count === 1 ? stopped : running,
    openBrowser: args => opened.push(args),
    controller: { cancelStartup() {}, start: () => start.promise, forgetAuthenticatedUrl() {} },
  })
  app2.setLoopbackPort(3999)
  const oldStart = app2.handleAction({ type: 'open' })
  await new Promise(resolve => setImmediate(resolve))
  await app2.handleAction({ type: 'retry' })
  const nonce = opened[0].join(' ').match(/pm-launch=3999\.([a-f0-9]+)/)[1]
  assert.equal(app2.verifyEntered(nonce), true)
  app2.onEntered(nonce)
  start.reject(new Error('late startup failure'))
  await oldStart
  assert.equal(app2.getState().status, 'S4')
})

test('替换owned启动前回收旧在途；已取消启动返回只丢认证URL', async () => {
  const pending = deferred()
  let starts = 0
  let cancels = 0
  const forgotten = []
  const opened = []
  const app = createLauncherApp({
    probeService: async () => stopped,
    openBrowser: args => opened.push(args),
    controller: {
      cancelStartup() { cancels++ },
      start() { starts++; return pending.promise },
      forgetAuthenticatedUrl(pid) { forgotten.push(pid) },
    },
  })
  const first = app.handleAction({ type: 'open' })
  await new Promise(resolve => setImmediate(resolve))
  await app.handleAction({ type: 'cancel' })
  pending.resolve({ pid: 9010, authenticatedUrl: 'http://127.0.0.1:3172/?token=test-only' })
  await first
  assert.equal(starts, 1)
  assert.ok(cancels >= 2)
  assert.deepEqual(forgotten, [9010])
  assert.deepEqual(opened, [])
  assert.equal(app.getState().status, 'S0')
})

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createLauncherApp } from '../src/launcher-app.mjs'
import { createLauncherState } from '../src/launcher-core.mjs'
import { createDshController } from '../src/dsh-controller.mjs'
import { openBrowser } from '../src/browser-open.mjs'
import { createControlServer } from '../src/loopback.mjs'
import { renderControlHtml } from '../src/control-html.mjs'

const running = { tcpOpen: true, httpStatus: 401, authRequiredBody: 'dsh web authentication required' }
const entry = { pid: 6655443, authenticatedUrl: 'http://127.0.0.1:0/?token=A5_SYNTHETIC_ONLY' }
const tick = () => new Promise(resolve => setImmediate(resolve))
const nonceOf = argv => new URL(argv.at(-1)).hash.match(/pm-launch=\d+\.([a-f0-9]+)/)[1]
const kindAction = kind => ({ type: kind === 'reopen' ? 'reopen' : 'open' })
function childFixture() {
  const child = new EventEmitter()
  let unrefs = 0
  child.unref = () => { unrefs++ }
  return { child, unrefs: () => unrefs }
}
function fixture(kind, customController) {
  const calls = [], forgotten = [], children = []
  let starts = 0, cancels = 0, targeted = false
  const controller = customController ?? {
    cancelStartup() { cancels++ },
    start() { starts++; return Promise.resolve(entry) },
    forgetAuthenticatedUrl: pid => forgotten.push(pid),
  }
  const app = createLauncherApp({
    port: 0, browsers: ['Chrome', 'Safari'],
    probeService: async () => kind === 'owned' ? { tcpOpen: false } : running,
    controller,
    openBrowser: argv => {
      calls.push(argv)
      if (!targeted) return
      const c = childFixture()
      children.push(c)
      return openBrowser(argv, { spawn: () => c.child })
    },
  })
  app.setLoopbackPort(3999)
  return { app, calls, forgotten, children, starts: () => starts, cancels: () => cancels,
    arm: () => { targeted = true }, disarm: () => { targeted = false } }
}
async function initialize(f, kind) {
  await f.app.handleAction({ type: 'select-browser', browser: 'Chrome' })
  if (kind === 'reopen') {
    await f.app.handleAction({ type: 'open' })
    const old = nonceOf(f.calls.at(-1))
    assert.equal(f.app.verifyEntered(old), true)
    assert.equal(f.app.onEntered(old).status, 'S4')
  } else await f.app.detect()
  f.arm()
}
async function loopback(f) {
  const expectedOrigin = 'http://127.0.0.1:0'
  const server = createControlServer({
    getState: f.app.getState, handleAction: f.app.handleAction,
    renderHtml: (_state, ctx) => renderControlHtml(f.app.view(), { ...ctx, initialState: f.app.getState() }),
    verifyEntered: f.app.verifyEntered, onEntered: f.app.onEntered, expectedOrigin,
  })
  const control = await server.listen()
  f.app.setLoopbackPort(control.port)
  const url = `http://127.0.0.1:${control.port}`
  const entered = nonce => fetch(`${url}/api/entered`, {
    method: 'POST', headers: { 'content-type': 'application/json', Origin: expectedOrigin },
    body: JSON.stringify({ nonce }),
  })
  return { ...control, url, entered }
}
function finish(c, mode) {
  if (mode === 'success') c.child.emit('exit', 0)
  else if (mode === 'nonzero') c.child.emit('exit', 17)
  else if (mode === 'error') c.child.emit('error', new Error('A5_SYNTHETIC_ONLY'))
}
function assertSafeState(f, status, confirmed) {
  const state = f.app.getState()
  assert.equal(state.status, status)
  assert.equal(state.confirmed, confirmed)
  assert.equal(state.browser, 'Chrome')
  assert.equal(state.view, status)
  assert.ok(!JSON.stringify(state).includes('A5_SYNTHETIC_ONLY'))
  assert.ok(!renderControlHtml(f.app.view(), { initialState: state }).includes('A5_SYNTHETIC_ONLY'))
  return state
}
function assertDelivery(f, kind, c, mode) {
  assert.equal(f.calls.length, kind === 'reopen' ? 2 : 1)
  assert.equal(f.starts(), kind === 'owned' ? 1 : 0)
  assert.deepEqual(f.forgotten, kind === 'owned' ? [entry.pid] : [])
  assert.equal(c.unrefs(), mode === 'timeout' ? 1 : 0)
  const url = new URL(f.calls.at(-1).at(-1))
  assert.equal(url.search, kind === 'owned' ? '?token=A5_SYNTHETIC_ONLY' : '')
}

const require = createRequire(new URL('../../packages/dsh-pm-tool/package.json', import.meta.url))
const puppeteer = (await import(require.resolve('puppeteer-core'))).default
let browser
before(async () => {
  browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, userDataDir: mkdtempSync(join(tmpdir(), 'fc-a5-own-chrome-')),
    args: ['--no-first-run', '--no-default-browser-check'],
  })
  console.log(JSON.stringify({ event: 'browser', pid: browser.process().pid, version: await browser.version() }))
})
after(async () => {
  const pid = browser?.process().pid
  await browser?.close()
  console.log(JSON.stringify({ event: 'browser-closed', pid, exitCode: browser?.process().exitCode }))
})

for (const kind of ['existing', 'owned', 'reopen']) {
  for (const mode of ['success', 'nonzero', 'error', 'timeout']) {
    test(`A5-P01-${kind}-${mode}：生产DOM本轮S4后OS结果保真；timeout默认真实5秒`, { timeout: 12000 }, async t => {
      const f = fixture(kind)
      const c = await loopback(f)
      await initialize(f, kind)
      const page = await browser.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(String(error)))
      t.after(async () => {
        for (const child of f.children) child.child.emit('exit', 0)
        await page.close()
        await c.close()
      })
      await page.goto(c.url, { waitUntil: 'domcontentloaded' })
      const action = kindAction(kind).type
      await page.waitForSelector(`[data-act=${action}]`)
      const started = Date.now()
      await page.click(`[data-act=${action}]`)
      await page.waitForFunction(owned => owned ? state.status === 'S2' && state.step === 2 : state.status === 'S0', {}, kind === 'owned')
      assert.equal(f.children.length, 1)
      const child = f.children[0]
      const nonce = nonceOf(f.calls.at(-1))
      const accepted = await c.entered(nonce)
      assert.equal(accepted.status, 200)
      assert.equal(accepted.headers.get('access-control-allow-origin'), 'http://127.0.0.1:0')
      assert.equal((await accepted.json()).state.status, 'S4')
      await page.waitForFunction(() => state.status === 'S4' && state.confirmed)
      await f.app.handleAction({ type: 'select-browser', browser: 'Safari' })
      const beforeOS = assertSafeState(f, 'S4', true)
      finish(child, mode)
      await page.waitForFunction(() => !actionBusy)
      const elapsed = Date.now() - started
      if (mode === 'timeout') assert.ok(elapsed >= 4900 && elapsed < 7500, `真实等待${elapsed}ms`)
      assert.deepEqual(assertSafeState(f, 'S4', true), beforeOS)
      assert.equal((await c.entered(nonce)).status, 403)
      child.child.emit('exit', 0)
      child.child.emit('error', new Error('A5_SYNTHETIC_ONLY'))
      await tick()
      assert.deepEqual(f.app.getState(), beforeOS)
      const dom = await page.evaluate(() => ({
        status: state.status, confirmed: state.confirmed, browser: state.browser,
        heading: document.querySelector('h2')?.textContent,
        navigationCount: performance.getEntriesByType('navigation').length,
      }))
      assert.equal(dom.status, 'S4')
      assert.equal(dom.confirmed, true)
      assert.equal(dom.browser, 'Chrome')
      assert.equal(dom.navigationCount, 1)
      assert.notEqual(dom.heading, '暂时无法打开')
      assert.deepEqual(errors, [])
      assertDelivery(f, kind, child, mode)
      console.log(JSON.stringify({ event: 'current-S4-OS-result', kind, mode, enteredHttp: 200,
        elapsed, app: beforeOS, dom, errors, openCount: f.calls.length, forgotten: f.forgotten, unrefs: child.unrefs() }))
    })
  }
}

for (const kind of ['existing', 'owned', 'reopen']) {
  for (const mode of ['nonzero', 'error', 'timeout']) {
    test(`A5-P02-${kind}-${mode}：无本轮回告失败S6/false，撤nonce不复投`, { timeout: 8000 }, async t => {
      const f = fixture(kind)
      const c = await loopback(f)
      t.after(() => c.close())
      await initialize(f, kind)
      const started = Date.now()
      const opening = f.app.handleAction(kindAction(kind))
      await tick()
      const child = f.children[0]
      const nonce = nonceOf(f.calls.at(-1))
      finish(child, mode)
      const result = await opening
      const elapsed = Date.now() - started
      if (mode === 'timeout') assert.ok(elapsed >= 4900 && elapsed < 7000)
      assert.deepEqual(result, assertSafeState(f, 'S6', false))
      assert.equal((await c.entered(nonce)).status, 403)
      assert.equal(f.app.verifyEntered(nonce), false)
      child.child.emit('exit', 0)
      child.child.emit('error', new Error('A5_SYNTHETIC_ONLY'))
      await tick()
      assertSafeState(f, 'S6', false)
      assertDelivery(f, kind, child, mode)
      console.log(JSON.stringify({ event: 'no-callback-OS-failure', kind, mode, elapsed,
        state: f.app.getState(), lateEnteredHttp: 403, forgotten: f.forgotten, openCount: f.calls.length }))
    })
  }
}

for (const kind of ['existing', 'owned', 'reopen']) {
  test(`A5-P03-${kind}：仅verify未onEntered不算confirmed；失败必须S6false并撤句柄`, async () => {
    const f = fixture(kind)
    await initialize(f, kind)
    const opening = f.app.handleAction(kindAction(kind))
    await tick()
    const nonce = nonceOf(f.calls.at(-1))
    assert.equal(f.app.verifyEntered(nonce), true)
    assert.equal(f.app.getState().confirmed, false)
    finish(f.children[0], 'nonzero')
    await opening
    f.app.onEntered(nonce)
    assertSafeState(f, 'S6', false)
    assert.equal(f.app.verifyEntered(nonce), false)
    assertDelivery(f, kind, f.children[0], 'nonzero')
  })
  for (const mode of ['nonzero', 'error']) {
    test(`A5-P04-${kind}-${mode}：当前S4后取消，旧OS失败不复活S4或覆盖S0`, async () => {
      const f = fixture(kind)
      await initialize(f, kind)
      const opening = f.app.handleAction(kindAction(kind))
      await tick()
      const nonce = nonceOf(f.calls.at(-1))
      assert.equal(f.app.verifyEntered(nonce), true)
      f.app.onEntered(nonce)
      await f.app.handleAction({ type: 'cancel' })
      assertSafeState(f, 'S0', false)
      finish(f.children[0], mode)
      await opening
      assertSafeState(f, 'S0', false)
      assert.equal(f.app.verifyEntered(nonce), false)
      assertDelivery(f, kind, f.children[0], mode)
    })
  }
  for (const confirmed of [false, true]) {
    test(`A5-P05-${kind}-${confirmed}：新旅程S3/S4不能被旧失败覆盖，owned不复投`, async () => {
      const f = fixture(kind)
      await initialize(f, kind)
      const old = f.app.handleAction(kindAction(kind))
      await tick()
      const oldNonce = nonceOf(f.calls.at(-1))
      assert.equal(f.app.verifyEntered(oldNonce), true)
      f.app.onEntered(oldNonce)
      await f.app.handleAction({ type: 'select-browser', browser: 'Safari' })
      f.disarm()
      await f.app.handleAction({ type: 'reopen' })
      const current = nonceOf(f.calls.at(-1))
      assert.notEqual(current, oldNonce)
      assert.equal(new URL(f.calls.at(-1).at(-1)).search, '')
      if (confirmed) {
        assert.equal(f.app.verifyEntered(current), true)
        f.app.onEntered(current)
      }
      const before = f.app.getState()
      assert.equal(before.status, confirmed ? 'S4' : 'S3')
      assert.equal(before.confirmed, confirmed)
      assert.equal(before.browser, 'Safari')
      finish(f.children[0], 'error')
      await old
      assert.deepEqual(f.app.getState(), before)
      assert.equal(f.app.verifyEntered(oldNonce), false)
      if (!confirmed) assert.equal(f.app.verifyEntered(current), true)
      assert.equal(f.calls.length, kind === 'reopen' ? 3 : 2)
      assert.equal(f.starts(), kind === 'owned' ? 1 : 0)
      assert.deepEqual(f.forgotten, kind === 'owned' ? [entry.pid] : [])
    })
  }
}

for (const mode of ['nonzero', 'error', 'timeout']) {
  test(`A5-P06-${mode}：生产controller已ready不kill，S4失败finally弃URL一次、后续clean reopen`, { timeout: 8000 }, async () => {
    const terminated = [], forgotten = []
    let spawned = 0
    const fake = new EventEmitter()
    fake.pid = entry.pid
    fake.stdout = new EventEmitter()
    fake.stderr = new EventEmitter()
    const controller = createDshController({
      spawn: () => {
        spawned++
        queueMicrotask(() => fake.stdout.emit('data', `dsh web: ${entry.authenticatedUrl}\n`))
        return fake
      },
      isReady: async () => true,
      terminate: (child, signal) => terminated.push({ pid: child.pid, signal }),
      waitExit: async () => true,
    })
    const originalForget = controller.forgetAuthenticatedUrl
    controller.forgetAuthenticatedUrl = pid => { forgotten.push(pid); originalForget(pid) }
    const f = fixture('owned', controller)
    await initialize(f, 'owned')
    const started = Date.now()
    const opening = f.app.handleAction({ type: 'open' })
    await tick()
    assert.deepEqual(controller.listOwnedPids(), [entry.pid])
    const nonce = nonceOf(f.calls.at(-1))
    assert.equal(f.app.verifyEntered(nonce), true)
    f.app.onEntered(nonce)
    finish(f.children[0], mode)
    await opening
    const elapsed = Date.now() - started
    if (mode === 'timeout') assert.ok(elapsed >= 4900 && elapsed < 7000)
    assertSafeState(f, 'S4', true)
    assert.deepEqual(forgotten, [entry.pid])
    assert.deepEqual(controller.listOwnedPids(), [])
    await f.app.handleAction({ type: 'cancel' })
    await f.app.handleAction({ type: 'cancel' })
    f.disarm()
    await f.app.handleAction({ type: 'reopen' })
    assertSafeState(f, 'S3', false)
    assert.equal(new URL(f.calls.at(-1).at(-1)).search, '')
    assert.equal(spawned, 1)
    assert.equal(f.calls.length, 2)
    assert.deepEqual(forgotten, [entry.pid])
    assert.deepEqual(terminated, [])
    console.log(JSON.stringify({ event: 'ready-owned-preserved', mode, elapsed, spawned,
      openCount: f.calls.length, forgotten, terminated }))
  })
}

test('A5-P07：core failure明确清confirmed且保当前browser，begin清旧detail；不扩其他状态合同', () => {
  for (const event of ['entered', 'delivered', 'report-auth-error']) {
    const m = createLauncherState()
    m.transition({ type: 'begin-journey', browser: 'Chrome' })
    m.transition({ type: 'open', browser: 'Chrome', needStart: true })
    m.transition({ type: 'entered' })
    m.transition({ type: event })
    const detail = { detection: 'safe fixture', outcome: 'no service stopped', suggestion: 'retry' }
    assert.deepEqual(m.transition({ type: 'failure', detail }), {
      status: 'S6', step: 0, browser: 'Chrome', detail, confirmed: false,
    })
    assert.equal(m.transition({ type: 'failure', detail }).confirmed, false)
    assert.deepEqual(m.transition({ type: 'begin-journey', browser: 'Safari' }), {
      status: 'S0', step: 0, browser: 'Safari', detail: undefined, confirmed: false,
    })
  }
})

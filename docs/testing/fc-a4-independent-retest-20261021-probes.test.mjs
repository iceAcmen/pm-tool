import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createLauncherApp } from '../src/launcher-app.mjs'
import { createLauncherState } from '../src/launcher-core.mjs'
import { openBrowser } from '../src/browser-open.mjs'
import { createControlServer } from '../src/loopback.mjs'
import { renderControlHtml } from '../src/control-html.mjs'

const running = { tcpOpen: true, httpStatus: 401, authRequiredBody: 'dsh web authentication required' }
const stopped = { tcpOpen: false }
const entry = { pid: 7766554, authenticatedUrl: 'http://127.0.0.1:0/?token=A4_SYNTHETIC_ONLY' }
const tick = () => new Promise(resolve => setImmediate(resolve))
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
function deferred() {
  let resolve, reject
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail })
  return { promise, resolve, reject }
}
const nonceOf = argv => new URL(argv.at(-1)).hash.match(/pm-launch=\d+\.([a-f0-9]+)/)[1]
function fixture(options = {}) {
  const calls = [], forgotten = []
  let starts = 0, cancels = 0
  const app = createLauncherApp({
    port: 0, browsers: ['Chrome', 'Safari'],
    probeService: options.probe ?? (async () => options.owned ? stopped : running),
    openBrowser: argv => { calls.push(argv); return options.open?.(argv, calls.length) },
    controller: {
      cancelStartup() { cancels++ },
      start() { starts++; return options.start?.() ?? Promise.resolve(entry) },
      forgetAuthenticatedUrl: pid => forgotten.push(pid),
    },
  })
  app.setLoopbackPort(3999)
  return { app, calls, forgotten, starts: () => starts, cancels: () => cancels }
}
async function seedS4(f) {
  await f.app.handleAction({ type: 'select-browser', browser: 'Chrome' })
  await f.app.handleAction({ type: 'open' })
  const nonce = nonceOf(f.calls.at(-1))
  assert.equal(f.app.verifyEntered(nonce), true)
  assert.equal(f.app.onEntered(nonce).status, 'S4')
  return nonce
}
function assertState(app, status, browser, confirmed = false) {
  const s = app.getState()
  assert.equal(s.status, status)
  assert.equal(s.browser, browser)
  assert.equal(s.confirmed, confirmed)
  return s
}

for (const kind of ['existing', 'owned']) {
  test(`A4-P01-${kind}：probe await改偏好，当前Chrome/nonce一致、下一轮Safari`, async () => {
    const probe = deferred()
    let count = 0
    const f = fixture({ owned: kind === 'owned', probe: () => ++count === 1 ? probe.promise : Promise.resolve(running) })
    await f.app.handleAction({ type: 'select-browser', browser: 'Chrome' })
    const opening = f.app.handleAction({ type: 'open' })
    assertState(f.app, 'S0', 'Chrome')
    await f.app.handleAction({ type: 'select-browser', browser: 'Safari' })
    probe.resolve(kind === 'owned' ? stopped : running)
    await opening
    assert.equal(f.calls[0][2], 'Google Chrome')
    assertState(f.app, 'S3', 'Chrome')
    assert.equal(f.app.getState().selectedBrowser, 'Safari')
    const n = nonceOf(f.calls[0])
    assert.equal(f.app.verifyEntered(n), true)
    assertState({ getState: () => f.app.onEntered(n) }, 'S4', 'Chrome', true)
    await f.app.handleAction({ type: 'reopen' })
    assert.equal(f.calls[1][2], 'Safari')
    assertState(f.app, 'S3', 'Safari')
    assert.equal(new URL(f.calls[1].at(-1)).search, '')
    assert.equal(f.app.verifyEntered(n), false)
    assert.deepEqual(f.forgotten, kind === 'owned' ? [entry.pid] : [])
  })
}

test('A4-P02：owned start await改偏好，冻结S2/browser/首投，下一轮不重放认证URL', async () => {
  const start = deferred()
  const f = fixture({ owned: true, start: () => start.promise })
  await f.app.handleAction({ type: 'select-browser', browser: 'Chrome' })
  const opening = f.app.handleAction({ type: 'open' })
  await tick()
  assertState(f.app, 'S2', 'Chrome')
  await f.app.handleAction({ type: 'select-browser', browser: 'Safari' })
  start.resolve(entry)
  await opening
  assert.equal(f.calls[0][2], 'Google Chrome')
  assertState(f.app, 'S3', 'Chrome')
  assert.deepEqual(f.forgotten, [entry.pid])
  const n = nonceOf(f.calls[0])
  assert.equal(f.app.verifyEntered(n), true)
  f.app.onEntered(n)
  await f.app.handleAction({ type: 'reopen' })
  assertState(f.app, 'S3', 'Safari')
  assert.equal(f.calls[1][2], 'Safari')
  assert.equal(new URL(f.calls[1].at(-1)).search, '')
  assert.equal(f.starts(), 1)
})

for (const kind of ['existing', 'owned', 'reopen']) {
  for (const callback of ['early', 'late']) {
    test(`A4-P03-${kind}-${callback}：OS await偏好变化不改argv/nonce/回告归属`, async () => {
      const os = deferred()
      const f = fixture({ owned: kind === 'owned', open: () => os.promise })
      await f.app.handleAction({ type: 'select-browser', browser: 'Chrome' })
      const opening = f.app.handleAction({ type: kind === 'reopen' ? 'reopen' : 'open' })
      await tick()
      assert.equal(f.calls.length, 1)
      assert.equal(f.calls[0][2], 'Google Chrome')
      const n = nonceOf(f.calls[0])
      await f.app.handleAction({ type: 'select-browser', browser: 'Safari' })
      assert.equal(f.app.getState().browser, 'Chrome')
      if (callback === 'early') {
        assert.equal(f.app.verifyEntered(n), true)
        f.app.onEntered(n)
      }
      os.resolve()
      await opening
      assertState(f.app, callback === 'early' ? 'S4' : 'S3', 'Chrome', callback === 'early')
      if (callback === 'late') {
        assert.equal(f.app.verifyEntered(n), true)
        f.app.onEntered(n)
      }
      assertState(f.app, 'S4', 'Chrome', true)
      assert.equal(f.app.verifyEntered(n), false)
      assert.deepEqual(f.forgotten, kind === 'owned' ? [entry.pid] : [])
    })
  }
}

for (const outcome of ['none', 'early', 'late', 'failure', 'cancel-ok', 'cancel-error', 'replace-error', 'early-failure']) {
  test(`A4-P04-${outcome}：旧S4 reopen新旅程清理及结果`, async () => {
    const os = deferred()
    const f = fixture({ open: (_argv, count) => count === 2 ? os.promise : undefined })
    const old = await seedS4(f)
    const reopening = f.app.handleAction({ type: 'reopen' })
    assertState(f.app, 'S0', 'Chrome')
    assert.equal(f.app.getState().detail, undefined)
    assert.equal(f.app.verifyEntered(old), false)
    assert.equal(f.app.onEntered(old).status, 'S0')
    const current = nonceOf(f.calls[1])
    assert.notEqual(current, old)
    assert.equal(new URL(f.calls[1].at(-1)).search, '')
    if (outcome.startsWith('early')) {
      assert.equal(f.app.verifyEntered(current), true)
      f.app.onEntered(current)
      assertState(f.app, 'S4', 'Chrome', true)
    }
    if (outcome.startsWith('cancel')) await f.app.handleAction({ type: 'cancel' })
    if (outcome === 'replace-error') {
      await f.app.handleAction({ type: 'select-browser', browser: 'Safari' })
      await f.app.handleAction({ type: 'retry' })
      const latest = nonceOf(f.calls[2])
      assert.equal(f.app.verifyEntered(latest), true)
      f.app.onEntered(latest)
    }
    if (['failure', 'cancel-error', 'replace-error', 'early-failure'].includes(outcome)) os.reject(new Error('safe synthetic OS failure'))
    else os.resolve()
    await reopening
    const observed = f.app.getState()
    console.log(JSON.stringify({ event: 'old-S4-reopen', outcome, observed, freshNonce: true, cleanUrl: true }))
    if (outcome.startsWith('cancel')) {
      assertState(f.app, 'S0', 'Chrome')
      assert.equal(f.app.verifyEntered(current), false)
    } else if (outcome === 'replace-error') {
      assertState(f.app, 'S4', 'Safari', true)
      assert.equal(f.app.verifyEntered(current), false)
    } else if (outcome.endsWith('failure')) {
      assertState(f.app, 'S6', 'Chrome')
      assert.equal(f.app.verifyEntered(current), false)
    } else {
      assertState(f.app, outcome === 'early' ? 'S4' : 'S3', 'Chrome', outcome === 'early')
      if (outcome === 'late') {
        assert.equal(f.app.verifyEntered(current), true)
        f.app.onEntered(current)
        assertState(f.app, 'S4', 'Chrome', true)
      }
    }
    assert.deepEqual(f.forgotten, [])
  })
}

test('A4-P05：begin-journey清所有旧状态confirmed/detail/step，并以事件browser冻结', () => {
  for (const old of ['entered', 'failure', 'report-auth-error', 'close', 'delivered']) {
    const m = createLauncherState()
    m.transition({ type: 'open', browser: 'Chrome', needStart: true })
    m.transition({ type: 'step', index: 2 })
    m.transition({ type: 'entered' })
    m.transition({ type: old, detail: { detection: 'old detail' } })
    assert.deepEqual(m.transition({ type: 'begin-journey', browser: 'Safari' }), {
      status: 'S0', step: 0, browser: 'Safari', detail: undefined, confirmed: false,
    })
  }
  const src = readFileSync(new URL('../src/launcher-app.mjs', import.meta.url), 'utf8')
  assert.match(src, /deps\.openBrowser[^\n]*void \| Promise<void>/)
})

test('A4-P06：取消/替换probe或start await，旧成功失败不投递不覆盖新回告', async () => {
  for (const stage of ['probe', 'start']) {
    for (const action of ['cancel', 'retry']) {
      for (const failure of [false, true]) {
        const hold = deferred()
        let probes = 0
        const f = fixture({
          probe: () => ++probes === 1 ? stage === 'probe' ? hold.promise : Promise.resolve(stopped) : Promise.resolve(running),
          start: () => hold.promise,
        })
        const opening = f.app.handleAction({ type: 'open' })
        await tick()
        await f.app.handleAction({ type: 'select-browser', browser: 'Safari' })
        await f.app.handleAction({ type: action })
        if (action === 'retry') {
          const n = nonceOf(f.calls[0])
          assert.equal(f.app.verifyEntered(n), true)
          f.app.onEntered(n)
        }
        failure ? hold.reject(new Error('safe old failure')) : hold.resolve(stage === 'probe' ? stopped : entry)
        await opening
        assertState(f.app, action === 'retry' ? 'S4' : 'S0', 'Safari', action === 'retry')
        assert.equal(f.calls.length, action === 'retry' ? 1 : 0)
        assert.deepEqual(f.forgotten, stage === 'start' && !failure ? [entry.pid] : [])
      }
    }
  }
})

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
  const entered = (nonce, origin = expectedOrigin) => fetch(`${url}/api/entered`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...(origin ? { Origin: origin } : {}) },
    body: JSON.stringify({ nonce }),
  })
  return { ...control, url, entered }
}

test('A4-P07：生产HTTP当前nonce不受偏好改写；错误Origin/旧nonce/未verify/重复回告拒绝', async () => {
  const f = fixture()
  const c = await loopback(f)
  try {
    const old = await seedS4(f)
    await f.app.handleAction({ type: 'reopen' })
    const current = nonceOf(f.calls.at(-1))
    assert.equal((await c.entered(old)).status, 403)
    f.app.onEntered(current)
    assertState(f.app, 'S3', 'Chrome')
    await f.app.handleAction({ type: 'select-browser', browser: 'Safari' })
    for (const origin of [null, 'null', c.url, 'http://localhost:0', 'https://evil.invalid']) {
      const r = await c.entered(current, origin)
      assert.equal(r.status, 403)
      assert.equal(r.headers.get('access-control-allow-origin'), null)
    }
    const accepted = await c.entered(current)
    assert.equal(accepted.status, 200)
    assert.equal(accepted.headers.get('access-control-allow-origin'), 'http://127.0.0.1:0')
    assert.equal((await accepted.json()).state.browser, 'Chrome')
    assertState(f.app, 'S4', 'Chrome', true)
    assert.equal((await c.entered(current)).status, 403)
    await f.app.handleAction({ type: 'reopen' })
    assertState(f.app, 'S3', 'Safari')
    const cancelled = nonceOf(f.calls.at(-1))
    assert.equal(f.app.verifyEntered(cancelled), true)
    await f.app.handleAction({ type: 'cancel' })
    f.app.onEntered(cancelled)
    assertState(f.app, 'S0', 'Safari')
    assert.equal((await c.entered(cancelled)).status, 403)
  } finally { await c.close() }
})

for (const kind of ['existing', 'reopen']) {
  test(`A4-P08-${kind}：生产open真实默认5s超时撤nonce、保冻结browser并拒迟到`, { timeout: 8000 }, async () => {
    const child = new EventEmitter()
    let unrefs = 0
    child.unref = () => unrefs++
    const f = fixture({ open: argv => openBrowser(argv, { spawn: () => child }) })
    await f.app.handleAction({ type: 'select-browser', browser: 'Chrome' })
    const start = Date.now()
    const opening = f.app.handleAction({ type: kind === 'reopen' ? 'reopen' : 'open' })
    await tick()
    const n = nonceOf(f.calls[0])
    await f.app.handleAction({ type: 'select-browser', browser: 'Safari' })
    await opening
    const elapsed = Date.now() - start
    assert.ok(elapsed >= 4900 && elapsed < 7000)
    assertState(f.app, 'S6', 'Chrome')
    assert.equal(f.app.verifyEntered(n), false)
    child.emit('exit', 0)
    child.emit('error', new Error('A4_SYNTHETIC_ONLY'))
    await tick()
    assertState(f.app, 'S6', 'Chrome')
    assert.equal(unrefs, 1)
    assert.equal(f.calls.length, 1)
    console.log(JSON.stringify({ event: 'real-open-timeout', kind, elapsed, state: f.app.getState() }))
  })
}

const require = createRequire(new URL('../../packages/dsh-pm-tool/package.json', import.meta.url))
const puppeteer = (await import(require.resolve('puppeteer-core'))).default
let browser
before(async () => {
  browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, userDataDir: mkdtempSync(join(tmpdir(), 'fc-a4-own-chrome-')),
    args: ['--no-first-run', '--no-default-browser-check'],
  })
  console.log(JSON.stringify({ event: 'browser', pid: browser.process().pid, version: await browser.version() }))
})
after(async () => {
  const pid = browser?.process().pid
  await browser?.close()
  console.log(JSON.stringify({ event: 'browser-closed', pid, exitCode: browser?.process().exitCode }))
})

for (const close of ['none', 'close', 'pagehide']) {
  test(`A4-P09-${close}：生产DOM/app旧S4重开、当前回告、关页不重建或停止服务`, { timeout: 12000 }, async t => {
    const os = deferred()
    const f = fixture({ open: (_argv, count) => count === 2 ? os.promise : undefined })
    const c = await loopback(f)
    const old = await seedS4(f)
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(String(e)))
    t.after(async () => {
      os.resolve()
      await page.close()
      await c.close()
      console.log(JSON.stringify({ event: 'dom-cleanup', close, errors, openCount: f.calls.length, starts: f.starts(), cancels: f.cancels() }))
    })
    await page.goto(c.url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-act=reopen]')
    await page.click('[data-act=reopen]')
    await page.waitForSelector('#browser-toggle')
    assertState(f.app, 'S0', 'Chrome')
    assert.equal((await c.entered(old)).status, 403)
    const current = nonceOf(f.calls[1])
    await page.click('#browser-toggle')
    await page.click('[data-browser=Safari]')
    await page.waitForFunction(() => !preferenceFlight && pendingBrowser === null && state.selectedBrowser === 'Safari')
    assert.equal(f.calls[1][2], 'Google Chrome')
    assert.equal(f.app.getState().browser, 'Chrome')
    const cancels = f.cancels()
    const readsAtClose = []
    page.on('request', r => { if (r.url().endsWith('/api/state')) readsAtClose.push(r.url()) })
    if (close === 'close') await page.click('#close')
    if (close === 'pagehide') await page.goto('about:blank')
    const readingCount = readsAtClose.length
    os.resolve()
    const accepted = await c.entered(current)
    assert.equal(accepted.status, 200)
    assertState(f.app, 'S4', 'Chrome', true)
    if (close === 'none') {
      await page.waitForFunction(() => state.status === 'S4' && !actionBusy)
      const observed = await page.evaluate(() => ({ status: state.status, browser: state.browser, selectedBrowser: state.selectedBrowser, confirmed: state.confirmed, navigationCount: performance.getEntriesByType('navigation').length }))
      assert.deepEqual(observed, { status: 'S4', browser: 'Chrome', selectedBrowser: 'Safari', confirmed: true, navigationCount: 1 })
      console.log(JSON.stringify({ event: 'dom-current-callback', observed }))
    } else {
      await pause(1100)
      assert.equal(await page.$('.window'), null)
      assert.equal(readsAtClose.length, readingCount)
    }
    assert.equal(f.cancels(), cancels)
    assert.equal(f.starts(), 0)
    assert.deepEqual(errors, [])
  })
}

test('A4-P10：真实DOM/生产loopback/open三路早到当前回告后OS非零，不得回退已进入S4', { timeout: 12000 }, async t => {
  const violations = []
  for (const kind of ['existing', 'owned', 'reopen']) {
    const child = new EventEmitter()
    const f = fixture({
      owned: kind === 'owned',
      open: (argv, count) => kind === 'reopen' && count === 1 ? undefined : openBrowser(argv, { spawn: () => child }),
    })
    const c = await loopback(f)
    if (kind === 'reopen') await seedS4(f)
    else await f.app.detect()
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(String(e)))
    t.after(async () => {
      child.emit('exit', 0)
      await page.close()
      await c.close()
    })
    await page.goto(c.url, { waitUntil: 'domcontentloaded' })
    const act = kind === 'reopen' ? 'reopen' : 'open'
    await page.waitForSelector(`[data-act=${act}]`)
    await page.click(`[data-act=${act}]`)
    await page.waitForFunction(owned => owned ? state.status === 'S2' && state.step === 2 : state.status === 'S0', {}, kind === 'owned')
    const nonce = nonceOf(f.calls.at(-1))
    const response = await c.entered(nonce)
    assert.equal(response.status, 200)
    assert.equal((await response.json()).state.status, 'S4')
    await page.waitForFunction(() => state.status === 'S4')
    child.emit('exit', 17)
    await page.waitForFunction(() => !actionBusy)
    const observed = {
      kind, enteredHttp: 200, osExit: 17, app: f.app.getState(),
      dom: await page.evaluate(() => ({ status: state.status, confirmed: state.confirmed, heading: document.querySelector('h2')?.textContent })),
      forgotten: f.forgotten, errors,
    }
    console.log(JSON.stringify({ event: 'current-S4-overwritten-by-OS-failure', observed }))
    assert.deepEqual(f.forgotten, kind === 'owned' ? [entry.pid] : [])
    assert.deepEqual(errors, [])
    violations.push({ kind, status: observed.app.status, confirmed: observed.app.confirmed, dom: observed.dom })
  }
  assert.deepEqual(violations.map(v => ({ kind: v.kind, status: v.status, confirmed: v.confirmed })), [
    { kind: 'existing', status: 'S4', confirmed: true },
    { kind: 'owned', status: 'S4', confirmed: true },
    { kind: 'reopen', status: 'S4', confirmed: true },
  ], '当前有效回告已确认进入；较迟OS失败不能覆盖为失败并保留相矛盾的confirmed=true')
})

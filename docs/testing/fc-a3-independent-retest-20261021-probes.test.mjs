import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openBrowser } from '../src/browser-open.mjs'
import { openBrowserArgs } from '../src/launcher-core.mjs'
import { createLauncherApp } from '../src/launcher-app.mjs'
import { createControlServer } from '../src/loopback.mjs'
import { discoverBrowsers, resolveBrowserOpen } from '../src/browsers.mjs'
import { renderControlHtml } from '../src/control-html.mjs'

const require = createRequire(new URL('../../packages/dsh-pm-tool/package.json', import.meta.url))
const puppeteer = (await import(require.resolve('puppeteer-core'))).default
const running = { tcpOpen: true, httpStatus: 401, authRequiredBody: 'dsh web authentication required' }
const tick = () => new Promise(resolve => setImmediate(resolve))
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const marker = 'A3_SYNTHETIC_SECRET_DO_NOT_ECHO'
let browser
before(async () => {
  browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, userDataDir: mkdtempSync(join(tmpdir(), 'fc-a3-probe-chrome-')),
    args: ['--no-first-run', '--no-default-browser-check'],
  })
  console.log(JSON.stringify({ event: 'browser', pid: browser.process().pid, version: await browser.version() }))
})
after(async () => {
  const pid = browser?.process().pid
  await browser?.close()
  console.log(JSON.stringify({ event: 'browser-closed', pid, exitCode: browser?.process().exitCode }))
})

function spawnFixture(mode, delay = 0) {
  const child = new EventEmitter()
  const calls = []
  let unrefs = 0
  child.unref = () => { unrefs++ }
  const spawn = (exec, argv, opts) => {
    calls.push({ exec, argv, opts })
    if (mode === 'throw') throw new Error(marker)
    const emit = () => {
      if (mode === 'error') child.emit('error', new Error(marker))
      else if (mode !== 'hold') child.emit('exit', mode === 'ok' ? 0 : mode === 'signal' ? null : 17, mode === 'signal' ? 'SIGTERM' : null)
    }
    delay ? setTimeout(emit, delay) : queueMicrotask(emit)
    return child
  }
  return { child, spawn, calls, unrefs: () => unrefs }
}
function appFixture(open, owned = false) {
  const forgotten = []
  let starts = 0
  const app = createLauncherApp({
    port: 0, browsers: ['Chrome', 'Safari'], probeService: async () => owned ? { tcpOpen: false } : running,
    openBrowser: open,
    controller: { cancelStartup() {}, start: async () => {
      starts++
      return { pid: 7654321, authenticatedUrl: `http://127.0.0.1:0/?token=${marker}` }
    }, forgetAuthenticatedUrl: pid => forgotten.push(pid) },
  })
  app.setLoopbackPort(3999)
  return { app, forgotten, starts: () => starts }
}
const nonceOf = argv => new URL(argv.at(-1)).hash.match(/pm-launch=3999\.([a-f0-9]+)/)[1]

test('A3-P01：discover label经生产app/core映射；普通URL/显式app能力、未知回退边界', async () => {
  const discovered = discoverBrowsers('/synthetic', p => p.endsWith('/Google Chrome.app'))
  assert.deepEqual(discovered.map(b => b.label), ['Chrome'])
  const opened = []
  const { app } = appFixture(argv => opened.push(argv))
  await app.handleAction({ type: 'select-browser', browser: discovered[0].label })
  await app.handleAction({ type: 'open' })
  assert.equal(opened[0][2], 'Google Chrome')
  assert.equal(opened[0].length, 4)
  assert.equal(new URL(opened[0][3]).pathname, '/')
  const url = 'http://127.0.0.1:0/中文 path?x=1&y=2#fragment'
  assert.deepEqual(openBrowserArgs('系统默认浏览器', url).argv, ['open', url])
  assert.deepEqual(openBrowserArgs('Chrome', url, { appWindow: true }).argv, ['open', '-a', 'Google Chrome', '--args', `--app=${url}`])
  assert.deepEqual(openBrowserArgs('Microsoft Edge', url, { appWindow: true }).argv, ['open', '-a', 'Microsoft Edge', '--args', `--app=${url}`])
  assert.equal(resolveBrowserOpen('missing', discovered).fallback, true)
  const bin = readFileSync(new URL('../bin/pm-launcher.mjs', import.meta.url), 'utf8')
  assert.match(bin, /import \{ openBrowser \} from '\.\.\/src\/browser-open\.mjs'/)
  assert.match(bin, /probeService,\s+openBrowser,\s+controller,/)
  assert.match(bin, /await openBrowser\(\['open',/)
  assert.doesNotMatch(bin, /function openBrowser|spawn\(/)
})

test('A3-P02：生产模块同步throw/异步error/非零/信号安全拒绝；迟到error/exit不重抛或重复完成', async () => {
  for (const mode of ['throw', 'error', 'nonzero', 'signal', 'ok']) {
    const f = spawnFixture(mode)
    const result = openBrowser(['open', `http://127.0.0.1:0/?token=${marker}`], { spawn: f.spawn })
    assert.equal(typeof result.then, 'function')
    if (mode === 'ok') await result
    else await assert.rejects(result, error => !String(error.stack).includes(marker))
    assert.equal(f.calls.length, 1)
    assert.deepEqual(f.calls[0].opts, { stdio: 'ignore', detached: false })
    // throw时spawn未返回child；该假child不归生产模块持有，不能制造不存在的迟到事件。
    if (mode !== 'throw') {
      f.child.emit('error', new Error(marker))
      f.child.emit('exit', 0)
    }
    await tick()
  }
})

test('A3-P03：owned生产open默认真实5秒超时→S6、finally弃URL、nonce撤销、迟到无污染', { timeout: 8000 }, async () => {
  const f = spawnFixture('hold')
  let sent
  const { app, forgotten } = appFixture(argv => {
    sent = argv
    return openBrowser(argv, { spawn: f.spawn })
  }, true)
  const start = Date.now()
  const result = await app.handleAction({ type: 'open' })
  const elapsed = Date.now() - start
  assert.ok(elapsed >= 4900 && elapsed < 6500)
  assert.equal(result.status, 'S6')
  assert.equal(result.confirmed, false)
  assert.deepEqual(forgotten, [7654321])
  assert.equal(app.verifyEntered(nonceOf(sent)), false)
  assert.ok(!JSON.stringify(result).includes(marker))
  assert.equal(f.unrefs(), 1)
  f.child.emit('error', new Error(marker))
  f.child.emit('exit', 0)
  await tick()
  assert.equal(app.getState().status, 'S6')
  assert.equal(f.calls.length, 1)
  console.log(JSON.stringify({ event: 'real-open-timeout', elapsed, status: result.status, forgotten }))
})

test('A3-P04：existing/owned/reopen消费生产error与非零；失败nonce撤销、无复投、状态/HTML不含秘密', async () => {
  for (const kind of ['existing', 'owned', 'reopen']) {
    for (const mode of ['error', 'nonzero']) {
      const f = spawnFixture(mode)
      let sent
      const { app, forgotten } = appFixture(argv => {
        sent = argv
        return openBrowser(argv, { spawn: f.spawn })
      }, kind === 'owned')
      await app.handleAction({ type: 'select-browser', browser: 'Chrome' })
      const result = await app.handleAction({ type: kind === 'reopen' ? 'reopen' : 'open' })
      assert.equal(result.status, 'S6')
      assert.equal(result.confirmed, false)
      assert.equal(app.verifyEntered(nonceOf(sent)), false)
      assert.equal(f.calls.length, 1)
      assert.deepEqual(forgotten, kind === 'owned' ? [7654321] : [])
      assert.ok(!JSON.stringify(result).includes(marker))
      assert.ok(!renderControlHtml(app.view(), { initialState: result }).includes(marker))
    }
  }
})

test('A3-P05：existing/owned/reopen取消后迟到成功/失败不覆盖；owned丢一次URL', async () => {
  for (const kind of ['existing', 'owned', 'reopen']) {
    for (const fail of [false, true]) {
      let release, sent
      const { app, forgotten } = appFixture(argv => {
        sent = argv
        return new Promise((resolve, reject) => { release = () => fail ? reject(new Error('safe late error')) : resolve() })
      }, kind === 'owned')
      const opening = app.handleAction({ type: kind === 'reopen' ? 'reopen' : 'open' })
      await tick()
      assert.ok(release)
      const nonce = nonceOf(sent)
      await app.handleAction({ type: 'cancel' })
      release()
      await opening
      assert.equal(app.getState().status, 'S0')
      assert.equal(app.verifyEntered(nonce), false)
      assert.deepEqual(forgotten, kind === 'owned' ? [7654321] : [])
    }
  }
})

test('A3-P06：existing/owned/reopen早到有效回告保持S4；替换后旧OS失败不覆盖新S4', async () => {
  for (const kind of ['existing', 'owned', 'reopen']) {
    let release, sent
    const { app } = appFixture(argv => {
      sent = argv
      return new Promise(resolve => { release = resolve })
    }, kind === 'owned')
    const opening = app.handleAction({ type: kind === 'reopen' ? 'reopen' : 'open' })
    await tick()
    const nonce = nonceOf(sent)
    assert.equal(app.verifyEntered(nonce), true)
    app.onEntered(nonce)
    release()
    await opening
    assert.equal(app.getState().status, 'S4')
    assert.equal(app.verifyEntered(nonce), false)
  }
  let rejectOld, sentNew, calls = 0
  const { app } = appFixture(argv => {
    if (++calls === 1) return new Promise((resolve, reject) => { rejectOld = reject })
    sentNew = argv
    return Promise.resolve()
  })
  const old = app.handleAction({ type: 'open' })
  await tick()
  await app.handleAction({ type: 'retry' })
  const nonce = nonceOf(sentNew)
  assert.equal(app.verifyEntered(nonce), true)
  app.onEntered(nonce)
  rejectOld(new Error('old safe error'))
  await old
  assert.equal(app.getState().status, 'S4')
  assert.equal(calls, 2)
})

test('A3-P07：生产loopback安全负例、失败撤销旧回告、成功单次nonce与拒replay', async () => {
  let sent, fail = true
  const { app } = appFixture(argv => {
    sent = argv
    return fail ? openBrowser(argv, { spawn: spawnFixture('error').spawn }) : Promise.resolve()
  })
  const expectedOrigin = 'http://127.0.0.1:0'
  const server = createControlServer({ getState: app.getState, handleAction: app.handleAction,
    renderHtml: () => '<html>synthetic fixture</html>', expectedOrigin,
    verifyEntered: app.verifyEntered, onEntered: app.onEntered })
  const { port, close } = await server.listen()
  try {
    await app.handleAction({ type: 'open' })
    const old = nonceOf(sent)
    const entered = (nonce, Origin) => fetch(`http://127.0.0.1:${port}/api/entered`, {
      method: 'POST', headers: { 'content-type': 'application/json', ...(Origin ? { Origin } : {}) }, body: JSON.stringify({ nonce }),
    })
    assert.equal((await entered(old, expectedOrigin)).status, 403)
    fail = false
    await app.handleAction({ type: 'retry' })
    const current = nonceOf(sent)
    for (const origin of [undefined, 'null', `http://127.0.0.1:${port}`, 'https://evil.invalid']) assert.equal((await entered(current, origin)).status, 403)
    const accepted = await entered(current, expectedOrigin)
    assert.equal(accepted.status, 200)
    assert.equal(accepted.headers.get('access-control-allow-origin'), expectedOrigin)
    assert.equal((await accepted.json()).state.status, 'S4')
    assert.equal((await entered(current, expectedOrigin)).status, 403)
    assert.equal((await entered(123, expectedOrigin)).status, 403)
  } finally { await close() }
})

async function domFixture(t, modes, opts = {}) {
  const actions = [], errors = [], trace = [], opened = []
  let preferenceIndex = 0, reads = 0
  const releases = []
  const { app } = appFixture(argv => {
    opened.push(argv)
    return opts.open?.(argv)
  })
  await app.detect()
  const server = createServer(async (req, res) => {
    res.setHeader('content-type', 'application/json')
    if (req.url === '/') {
      res.setHeader('content-type', 'text/html')
      res.end(renderControlHtml(app.view(), { initialState: app.getState() }))
      return
    }
    if (req.url === '/api/state') { reads++; res.end(JSON.stringify({ state: app.getState() })); return }
    if (req.url !== '/api/action') { res.statusCode = 404; res.end('{}'); return }
    let raw = ''
    for await (const c of req) raw += c
    const action = JSON.parse(raw)
    actions.push(action)
    const event = { type: action.type, browser: action.browser, start: Date.now(), closed: null }
    trace.push(event)
    res.on('close', () => { event.closed = Date.now() })
    const mode = action.type === 'select-browser' ? modes[preferenceIndex++] : 'ok'
    if (mode === 'hang') {
      await new Promise(resolve => releases.push(resolve))
      res.statusCode = 503; res.end('{}'); return
    }
    if (mode === 'network') { res.destroy(); return }
    if (mode === '503') { res.statusCode = 503; res.end('{}'); return }
    res.end(JSON.stringify({ state: await app.handleAction(action) }))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const page = await browser.newPage()
  page.on('pageerror', e => errors.push(String(e)))
  t.after(async () => {
    releases.forEach(release => release())
    await page.close()
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    console.log(JSON.stringify({ event: 'dom-cleanup', test: t.name, actions, trace, reads, openedCount: opened.length, errors }))
  })
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !reading && document.querySelector('#browser-toggle'))
  await page.click('#browser-toggle')
  await page.click('[data-browser=Chrome]')
  return { app, page, actions, trace, opened, errors, reads: () => reads }
}

test('A3-P08：两次偏好503/directopen只重试一次并alert；无open/无限写、用户重选恢复', { timeout: 10000 }, async t => {
  const f = await domFixture(t, ['503', '503', 'ok'])
  await f.page.waitForFunction(() => !preferenceFlight && pendingBrowser === 'Chrome')
  await f.page.click('[data-act=open]')
  await f.page.waitForSelector('[role=alert]')
  assert.deepEqual(f.actions.map(a => a.type), ['select-browser', 'select-browser'])
  assert.equal(f.app.getState().selectedBrowser, '系统默认浏览器')
  assert.equal(f.opened.length, 0)
  await pause(1100)
  assert.equal(f.actions.length, 2)
  await f.page.click('#browser-toggle')
  await f.page.click('[data-browser=Safari]')
  await f.page.waitForFunction(() => pendingBrowser === null && !preferenceFlight)
  await f.page.click('[data-act=open]')
  await f.page.waitForFunction(() => state.status === 'S3' && !actionBusy)
  assert.equal(f.app.getState().browser, 'Safari')
  assert.equal(f.opened[0][2], 'Safari')
  assert.deepEqual(f.errors, [])
})

test('A3-P09：偏好网络断开后直接open落实Chrome到生产argv；不只看payload', { timeout: 10000 }, async t => {
  const f = await domFixture(t, ['network', '503', 'ok'])
  await f.page.waitForFunction(() => !preferenceFlight && pendingBrowser === 'Chrome')
  await f.page.click('[data-act=open]')
  await f.page.waitForFunction(() => state.status === 'S3' || !!document.querySelector('[role=alert]'))
  if (await f.page.$('[role=alert]')) {
    assert.equal(f.opened.length, 0)
    await f.page.click('[data-act=open]')
    await f.page.waitForFunction(() => state.status === 'S3')
  }
  assert.equal(f.app.getState().browser, 'Chrome')
  assert.equal(f.opened[0][2], 'Google Chrome')
  assert.deepEqual(f.errors, [])
})

test('A3-P10：真实35s偏好超时后directopen保存latest再投递；未替换时钟', { timeout: 42000 }, async t => {
  const f = await domFixture(t, ['hang', 'ok'])
  await f.page.waitForFunction(() => preferenceFlight === null && pendingBrowser === 'Chrome', { timeout: 38000 })
  const elapsed = f.trace[0].closed - f.trace[0].start
  assert.ok(elapsed >= 34000 && elapsed < 38000)
  assert.ok(f.reads() > 20)
  assert.equal(f.opened.length, 0)
  await f.page.click('[data-act=open]')
  await f.page.waitForFunction(() => state.status === 'S3' && !actionBusy)
  assert.deepEqual(f.actions.map(a => a.type), ['select-browser', 'select-browser', 'open'])
  assert.equal(f.app.getState().browser, 'Chrome')
  assert.equal(f.opened[0][2], 'Google Chrome')
  assert.deepEqual(f.errors, [])
  console.log(JSON.stringify({ event: 'real-preference-timeout', elapsed, reads: f.reads() }))
})

test('A3-P11：OS等待中select-browser不得改写已投递归属或使当前有效nonce失效', async () => {
  let release, sent
  const { app } = appFixture(argv => {
    sent = argv
    return new Promise(resolve => { release = resolve })
  })
  await app.handleAction({ type: 'select-browser', browser: 'Chrome' })
  const opening = app.handleAction({ type: 'open' })
  await tick()
  const nonce = nonceOf(sent)
  await app.handleAction({ type: 'select-browser', browser: 'Safari' })
  release()
  await opening
  console.log(JSON.stringify({ event: 'inflight-select-attribution', actualApp: sent[2], state: app.getState(), validNonce: app.verifyEntered(nonce) }))
  assert.equal(app.getState().browser, 'Chrome', '当前旅程应仍归属实际投递的Chrome，或明确撤销；不得标Safari已投递')
})

test('A3-P12：真实DOM existing慢OS投递期间仍可选Safari，不能错标投递浏览器', { timeout: 10000 }, async t => {
  let release
  const f = await domFixture(t, ['ok', 'ok'], { open: () => new Promise(resolve => { release = resolve }) })
  t.after(() => release?.())
  await f.page.waitForFunction(() => !preferenceFlight && pendingBrowser === null)
  await f.page.click('[data-act=open]')
  const deadline = Date.now() + 3000
  while (!release && Date.now() < deadline) await pause(20)
  assert.ok(release)
  assert.equal(f.opened[0][2], 'Google Chrome')
  const nonce = nonceOf(f.opened[0])
  await f.page.click('#browser-toggle')
  await f.page.click('[data-browser=Safari]')
  await f.page.waitForFunction(() => !preferenceFlight && pendingBrowser === null && state.selectedBrowser === 'Safari')
  release()
  await f.page.waitForFunction(() => state.status === 'S3' && !actionBusy)
  const observed = { app: f.app.getState(), dom: await f.page.evaluate(() => ({ status: state.status, browser: state.browser, selectedBrowser: state.selectedBrowser })), actualApp: f.opened[0][2], nonceValid: f.app.verifyEntered(nonce) }
  console.log(JSON.stringify({ event: 'dom-inflight-select-attribution', observed }))
  assert.equal(observed.app.browser, 'Chrome', '实际Chrome投递不能被随后偏好写覆盖为Safari')
})

test('A3-P13：旧S4开始reopen，无本轮回告不能沿用S4当新页成功', async () => {
  const sent = []
  const { app } = appFixture(argv => { sent.push(argv); return Promise.resolve() })
  await app.handleAction({ type: 'open' })
  const oldNonce = nonceOf(sent[0])
  assert.equal(app.verifyEntered(oldNonce), true)
  app.onEntered(oldNonce)
  assert.equal(app.getState().status, 'S4')
  await app.handleAction({ type: 'reopen' })
  const newNonce = nonceOf(sent[1])
  assert.notEqual(oldNonce, newNonce)
  assert.equal(new URL(sent[1].at(-1)).search, '')
  assert.equal(app.verifyEntered(oldNonce), false)
  const resultWithoutNewCallback = app.getState()
  console.log(JSON.stringify({ event: 'reopen-without-new-callback', resultWithoutNewCallback, cleanUrl: true, freshNonce: true }))
  assert.equal(resultWithoutNewCallback.status, 'S3', '新reopen无有效回告应等待，而不是保留旧S4')
})

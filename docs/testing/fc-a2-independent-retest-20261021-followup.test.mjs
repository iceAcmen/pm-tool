import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderControlHtml } from '../src/control-html.mjs'
import { createLauncherApp } from '../src/launcher-app.mjs'

const require = createRequire(new URL('../../packages/dsh-pm-tool/package.json', import.meta.url))
const puppeteer = (await import(require.resolve('puppeteer-core'))).default
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const AUTH_WALL = 'dsh web authentication required; reopen the URL printed by dsh web.'
const running = { tcpOpen: true, httpStatus: 401, authRequiredBody: AUTH_WALL }
const stopped = { tcpOpen: false, httpStatus: undefined, authRequiredBody: '' }
let browser
before(async () => {
  browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, userDataDir: mkdtempSync(join(tmpdir(), 'fc-a2-additional-chrome-')),
    args: ['--no-first-run', '--no-default-browser-check'],
  })
  console.log(JSON.stringify({ event: 'browser', pid: browser.process().pid, version: await browser.version() }))
})
after(async () => {
  const pid = browser?.process().pid
  await browser?.close()
  console.log(JSON.stringify({ event: 'browser-closed', pid, exitCode: browser?.process().exitCode }))
})

async function until(predicate, timeout = 4000) {
  const end = Date.now() + timeout
  while (!predicate() && Date.now() < end) await pause(20)
  assert.ok(predicate(), 'fixture条件须在有界时间内成立')
}

// HTTP是自有fixture，状态和动作执行生产app；仅探测、进程、浏览器投递为隔离接缝。
async function fixture(t, opts = {}) {
  const opened = []
  const actions = []
  const trace = []
  const releases = []
  const errors = []
  const rules = []
  let readTransform = next => next
  let reads = 0
  let cancels = 0
  let readyResolve
  const ready = new Promise(resolve => { readyResolve = resolve })
  const app = createLauncherApp({
    port: 3211, browsers: ['Chrome', 'Safari'],
    probeService: async () => opts.owned ? stopped : running,
    openBrowser: argv => opened.push(argv),
    controller: {
      cancelStartup: () => { cancels++ },
      start: async () => { await ready; return { pid: 123456, authenticatedUrl: 'http://127.0.0.1:3211/' } },
      forgetAuthenticatedUrl: () => {},
    },
    dsh: {},
  })
  await app.detect()
  let inFlight = 0
  let preferenceInFlight = 0
  let maxPreferenceInFlight = 0
  const server = createServer(async (req, res) => {
    res.setHeader('content-type', 'application/json')
    if (req.url === '/') {
      res.setHeader('content-type', 'text/html')
      res.end(renderControlHtml(app.view(), { initialState: app.getState() }))
      return
    }
    if (req.url === '/api/state') {
      reads++
      res.end(JSON.stringify({ state: readTransform(app.getState()) }))
      return
    }
    if (req.url !== '/api/action') { res.statusCode = 404; res.end('{}'); return }
    let raw = ''
    for await (const chunk of req) raw += chunk
    const action = JSON.parse(raw)
    actions.push(action)
    const event = { type: action.type, browser: action.browser, start: Date.now(), finish: null, disconnected: null }
    trace.push(event)
    inFlight++
    if (action.type === 'select-browser') {
      preferenceInFlight++
      maxPreferenceInFlight = Math.max(maxPreferenceInFlight, preferenceInFlight)
    }
    res.on('close', () => {
      inFlight--
      event.disconnected = Date.now()
      if (action.type === 'select-browser') preferenceInFlight--
    })
    const ruleIndex = rules.findIndex(r => r.type === action.type)
    const rule = ruleIndex < 0 ? null : rules.splice(ruleIndex, 1)[0]
    try {
      if (rule?.before) await rule.wait
      if (rule?.failure) {
        if (rule.failure === 'network') { res.destroy(); return }
        res.statusCode = rule.failure
        res.end(JSON.stringify({ error: 'fixture拒绝偏好写入；未改变app' }))
        return
      }
      const next = await app.handleAction(action)
      if (rule && !rule.before) await rule.wait
      event.finish = Date.now()
      res.end(JSON.stringify({ state: rule?.response ?? next }))
    } catch (e) {
      errors.push(`fixture:${e.message}`)
      res.statusCode = 500
      res.end('{}')
    }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const page = await browser.newPage()
  page.on('pageerror', e => errors.push(String(e)))
  t.after(async () => {
    readyResolve()
    releases.forEach(release => release())
    await page.close()
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    console.log(JSON.stringify({
      event: 'cleanup', test: t.name, actions, trace, reads, cancels, opened,
      state: app.getState(), errors, maxPreferenceInFlight, inFlight,
    }))
  })
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !reading && document.querySelector('#browser-toggle'))
  function hold(type, extra = {}) {
    let release
    const wait = new Promise(resolve => { release = resolve })
    releases.push(release)
    rules.push({ type, wait, ...extra })
    return release
  }
  return {
    app, page, opened, actions, trace, errors, reads: () => reads, cancels: () => cancels,
    maxPreferenceInFlight: () => maxPreferenceInFlight, inFlight: () => inFlight,
    ready: readyResolve, hold,
    transformReads: transform => { readTransform = transform },
    failNextPreference: failure => rules.push({ type: 'select-browser', failure }),
  }
}
async function select(f, name) {
  await f.page.click('#browser-toggle')
  await f.page.waitForSelector(`[data-browser="${name}"]`)
  await f.page.click(`[data-browser="${name}"]`)
}

test('A2-X01：真实生产app慢owned open，DOM点取消确实撤销旅程，释放ready不投递', { timeout: 12000 }, async t => {
  const f = await fixture(t, { owned: true })
  await f.page.click('[data-act=open]')
  await f.page.waitForSelector('[data-act=cancel]', { timeout: 3000 })
  const beforeCancel = f.cancels()
  const beforeReads = f.reads()
  await f.page.click('[data-act=cancel]')
  await f.page.waitForFunction(() => state.status === 'S0' && !actionBusy)
  assert.ok(f.cancels() > beforeCancel)
  assert.equal(f.actions.at(-1).type, 'cancel')
  f.ready()
  await until(() => f.trace.find(x => x.type === 'open')?.finish !== null)
  await until(() => f.reads() > beforeReads)
  assert.equal(f.app.getState().status, 'S0')
  assert.equal(await f.page.evaluate(() => state.status), 'S0')
  assert.deepEqual(f.opened, [])
  assert.deepEqual(f.errors, [])
})

test('A2-X02：取消后旧POST明确带S3，actionTicket拒旧而非依赖fixture返回S0', { timeout: 10000 }, async t => {
  const f = await fixture(t, { owned: true })
  const stale = { ...f.app.getState(), status: 'S3', view: 'S3' }
  const release = f.hold('open', { response: stale })
  await f.page.click('[data-act=open]')
  await f.page.waitForSelector('[data-act=cancel]')
  await f.page.click('[data-act=cancel]')
  await f.page.waitForFunction(() => state.status === 'S0' && !actionBusy)
  f.ready()
  const response = f.page.waitForResponse(r => r.url().endsWith('/api/action') && r.request().postData()?.includes('"open"'))
  release()
  await response
  await pause(150)
  assert.equal(await f.page.evaluate(() => state.status), 'S0')
  assert.equal(await f.page.evaluate(() => actionBusy), false)
  assert.deepEqual(f.errors, [])
})

test('A2-X03：连续三选串行latest，open在第一偏好在途时点两次，最终只投递Safari一次', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  const release = f.hold('select-browser')
  await select(f, 'Chrome')
  await until(() => f.actions.length === 1)
  await select(f, '系统默认浏览器')
  await select(f, 'Safari')
  await f.page.click('[data-act=open]')
  await f.page.click('[data-act=open]')
  assert.deepEqual(f.actions.map(a => a.type), ['select-browser'])
  release()
  await f.page.waitForFunction(() => state.status === 'S3' && !actionBusy && !preferenceFlight)
  assert.deepEqual(f.actions.filter(a => a.type === 'select-browser').map(a => a.browser), ['Chrome', 'Safari'])
  assert.equal(f.actions.filter(a => a.type === 'open').length, 1)
  assert.equal(f.actions.at(-1).browser, 'Safari')
  assert.equal(f.app.getState().browser, 'Safari')
  assert.ok(f.opened[0].includes('Safari'))
  assert.equal(f.maxPreferenceInFlight(), 1)
  assert.deepEqual(f.errors, [])
})

test('A2-X04：偏好503后新用户选择重试恢复，不无限写，不回滚latest', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  f.failNextPreference(503)
  await select(f, 'Chrome')
  await f.page.waitForFunction(() => preferenceFlight === null && pendingBrowser === 'Chrome')
  const before = f.reads()
  await until(() => f.reads() >= before + 2)
  assert.equal(f.actions.length, 1, '失败后不得自动无限写')
  assert.equal(f.app.getState().selectedBrowser, '系统默认浏览器')
  await select(f, 'Safari')
  await f.page.waitForFunction(() => pendingBrowser === null && !preferenceFlight)
  assert.equal(f.app.getState().selectedBrowser, 'Safari')
  await f.page.click('[data-act=open]')
  await f.page.waitForFunction(() => state.status === 'S3')
  assert.ok(f.opened[0].includes('Safari'))
  assert.deepEqual(f.errors, [])
})

test('A2-X05：偏好503失败后直接open应重试或实际使用当前Chrome，不只发送乐观payload', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  f.failNextPreference(503)
  await select(f, 'Chrome')
  await f.page.waitForFunction(() => preferenceFlight === null && pendingBrowser === 'Chrome')
  await f.page.click('[data-act=open]')
  await f.page.waitForFunction(() => state.status === 'S3' && !actionBusy)
  console.log(JSON.stringify({ event: 'failed-preference-open', actions: f.actions, actual: f.app.getState(), opened: f.opened }))
  assert.equal(f.actions.at(-1).browser, 'Chrome')
  assert.equal(f.app.getState().browser, 'Chrome', '实际app旅程浏览器应与用户可见选择相同')
  assert.ok(f.opened[0].includes('Google Chrome'))
})

test('A2-X06B：第一偏好在途先选Safari再点open，明确503失败后仍须落实latest', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  const release = f.hold('select-browser', { before: true, failure: 503 })
  await select(f, 'Chrome')
  await until(() => f.actions.length === 1)
  await select(f, 'Safari')
  await f.page.click('[data-act=open]')
  const pending = await f.page.evaluate(() => ({ pendingBrowser, waiting: !!preferenceFlight, actionBusy }))
  assert.deepEqual(pending, { pendingBrowser: 'Safari', waiting: true, actionBusy: false })
  assert.deepEqual(f.actions.map(a => a.type), ['select-browser'])
  console.log(JSON.stringify({ event: 'ordered-failure-before-release', pending, actions: f.actions }))
  release()
  await f.page.waitForFunction(() => state.status === 'S3' && !actionBusy)
  console.log(JSON.stringify({ event: 'failed-inflight-latest-open', actions: f.actions, actual: f.app.getState(), opened: f.opened }))
  assert.equal(f.actions.at(-1).browser, 'Safari')
  assert.equal(f.app.getState().browser, 'Safari', '失败后的latest应落实到实际投递')
})

test('A2-X10：普通action焦点跨有效同步更新保持，details内容仍可更新', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  await f.page.click('[data-act=open]')
  await f.page.waitForFunction(() => state.status === 'S3' && !actionBusy)
  await f.page.click('[data-act=report-auth-error]')
  await f.page.waitForFunction(() => state.status === 'S5' && !actionBusy)
  await f.page.click('[data-act=toggle-detail]')
  await f.page.focus('[data-act=finish-login]')
  // 非敏感details变化只在GET fixture提供，不替换生产页面事件或状态机。
  f.transformReads(next => ({ ...next, detail: { detection: 'new-detail' } }))
  await f.page.waitForFunction(() => !actionBusy && document.querySelector('.details')?.innerText.includes('new-detail'))
  assert.equal(await f.page.evaluate(() => document.activeElement.dataset.act), 'finish-login')
  assert.ok(await f.page.$('.details'))
  assert.deepEqual(f.errors, [])
})

test('A2-X07：关闭时偏好在途且open等待，迟到偏好不启动旅程、不续读、不重建页', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  const release = f.hold('select-browser', { before: true })
  await select(f, 'Chrome')
  await until(() => f.actions.length === 1)
  await f.page.click('[data-act=open]')
  await f.page.click('#close')
  const atClose = f.reads()
  await until(() => f.trace[0].disconnected !== null)
  release()
  await pause(1100)
  assert.deepEqual(f.actions.map(a => a.type), ['select-browser'])
  assert.deepEqual(f.opened, [])
  assert.equal(f.reads(), atClose)
  assert.equal(await f.page.$('.window'), null)
  assert.deepEqual(f.errors, [])
})

test('A2-X08：关闭时真实app慢open在途，仅中止本页；ready仍可完成且不假称cancel', { timeout: 10000 }, async t => {
  const f = await fixture(t, { owned: true })
  await f.page.click('[data-act=open]')
  await f.page.waitForSelector('[data-act=cancel]')
  const cancels = f.cancels()
  await f.page.click('#close')
  const atClose = f.reads()
  await until(() => f.trace[0].disconnected !== null)
  f.ready()
  await until(() => f.app.getState().status === 'S3')
  await pause(1100)
  assert.equal(f.cancels(), cancels, '关闭页不是取消启动或停止服务')
  assert.equal(f.opened.length, 1)
  assert.equal(f.reads(), atClose)
  assert.equal(await f.page.$('.window'), null)
  assert.deepEqual(f.errors, [])
})

test('A2-X09：真实35s POST超时中止、普通动作解锁，读同步仍继续，无S4伪成功', { timeout: 44000 }, async t => {
  const f = await fixture(t)
  const release = f.hold('open', { before: true })
  await f.page.click('[data-act=open]')
  await until(() => f.actions.length === 1)
  await f.page.waitForFunction(() => !actionBusy, { timeout: 38000 })
  await until(() => f.trace[0].disconnected !== null)
  const elapsed = f.trace[0].disconnected - f.trace[0].start
  console.log(JSON.stringify({ event: 'real-post-deadline', elapsed, reads: f.reads(), state: await f.page.evaluate(() => state.status) }))
  assert.ok(elapsed >= 34000 && elapsed < 38000, '真实POST中止应接近35s，未替换时钟')
  assert.ok(f.reads() > 20)
  assert.equal(await f.page.evaluate(() => state.status), 'S1')
  assert.deepEqual(f.errors, [])
  await f.page.click('#close')
  release()
})

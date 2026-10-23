import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderControlHtml } from '../src/control-html.mjs'
const require = createRequire(new URL('../../packages/dsh-pm-tool/package.json', import.meta.url))
const puppeteer = (await import(require.resolve('puppeteer-core'))).default
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const state = (status = 'S1') => ({ status, view: status, step: 0,
  confirmed: status === 'S4', host: '127.0.0.1', port: 3205,
  browsers: ['系统默认浏览器', 'Chrome', 'Safari'], selectedBrowser: '系统默认浏览器', theme: 'light' })
let browser
before(async () => {
  browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, userDataDir: mkdtempSync(join(tmpdir(), 'fc-independent-chrome-')),
    args: ['--no-first-run', '--no-default-browser-check'],
  })
  console.log(JSON.stringify({ event: 'browser', pid: browser.process().pid, version: await browser.version() }))
})
after(async () => { await browser?.close() })

async function fixture(t, initial = state()) {
  let current = initial
  let reads = 0
  let actionHold
  let readHold
  let failure
  const actions = []
  const releases = []
  const errors = []
  let stateInFlight = 0
  let maxStateInFlight = 0
  let page
  const server = createServer(async (req, res) => {
    res.setHeader('content-type', 'application/json')
    if (req.url === '/') {
      res.setHeader('content-type', 'text/html')
      res.end(renderControlHtml({ theme: 'light' }, { initialState: current }))
    } else if (req.url === '/api/state') {
      reads++
      stateInFlight++
      maxStateInFlight = Math.max(maxStateInFlight, stateInFlight)
      res.on('close', () => { stateInFlight-- })
      const captured = structuredClone(current)
      if (readHold) { const wait = readHold; readHold = null; await wait }
      if (failure) { res.statusCode = failure; failure = null }
      res.end(JSON.stringify({ state: captured }))
    } else if (req.url === '/api/action') {
      let raw = ''
      for await (const chunk of req) raw += chunk
      const action = JSON.parse(raw)
      actions.push(action)
      if (action.type === 'select-browser') current = { ...current, selectedBrowser: action.browser }
      if (action.type === 'open') current = { ...current, status: 'S2', view: 'S2' }
      const captured = structuredClone(current)
      if (actionHold) { const wait = actionHold; actionHold = null; await wait }
      if (action.type === 'open') current = { ...current, status: 'S3', view: 'S3' }
      if (action.type === 'cancel') current = state('S0')
      res.end(JSON.stringify({ state: action.type === 'select-browser' ? captured : current }))
    } else { res.statusCode = 404; res.end('{}') }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  page = await browser.newPage()
  page.on('pageerror', e => errors.push(String(e)))
  t.after(async () => {
    releases.forEach(release => release())
    await page.close()
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    console.log(JSON.stringify({ event: 'cleanup', test: t.name, errors, actions, reads, maxStateInFlight }))
  })
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#browser-toggle')
  await pause(150)
  const hold = type => {
    let release
    const wait = new Promise(resolve => { release = resolve })
    releases.push(release)
    if (type === 'action') actionHold = wait
    else readHold = wait
    return release
  }
  return {
    page, actions, errors, reads: () => reads, hold,
    current: () => current, setState: next => { current = next },
    failRead: () => { failure = 503 }, maxStateInFlight: () => maxStateInFlight,
  }
}

test('FC-04补：慢open在途仍应读取S2并允许取消，不因actionBusy锁死', { timeout: 12000 }, async t => {
  const f = await fixture(t, state('S0'))
  const release = f.hold('action')
  await f.page.click('[data-act=open]')
  await pause(4000)
  const observed = await f.page.evaluate(() => ({
    status: state.status, actionBusy, reading,
    cancelVisible: !!document.querySelector('[data-act=cancel]'),
    body: document.body.innerText,
  }))
  console.log(JSON.stringify({ event: 'slow-open', serverStatus: f.current().status, reads: f.reads(), observed }))
  release()
  await f.page.waitForFunction(() => state.status === 'S3')
  assert.equal(observed.status, 'S2', '权威S2在慢open期间应自动可见且取消入口可用')
})

test('FC-04补：第一浏览器选择在途，第二次可见选择不能被静默丢弃', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  const release = f.hold('action')
  await f.page.click('#browser-toggle')
  await f.page.click('[data-browser=Chrome]')
  await pause(100)
  await f.page.click('#browser-toggle')
  await f.page.click('[data-browser=Safari]')
  const optimistic = await f.page.$eval('#browser-toggle', n => n.innerText)
  release()
  await pause(900)
  const settled = await f.page.$eval('#browser-toggle', n => n.innerText)
  console.log(JSON.stringify({ event: 'rapid-select', optimistic, settled, actions: f.actions }))
  assert.match(settled, /Safari/, '最新用户选择应保存；不能显示成功后回退第一选择')
  assert.equal(f.actions.at(-1).browser, 'Safari')
})

test('FC-04补：S0到S1有效更新重绘保留菜单内键盘焦点', { timeout: 10000 }, async t => {
  const f = await fixture(t, state('S0'))
  await f.page.click('#browser-toggle')
  await f.page.focus('[data-browser=Chrome]')
  f.setState(state('S1'))
  await f.page.waitForFunction(() => state.status === 'S1')
  const observed = await f.page.evaluate(() => ({
    tag: document.activeElement.tagName,
    browser: document.activeElement.dataset.browser ?? null,
    menu: document.querySelector('#browser-toggle').getAttribute('aria-expanded'),
  }))
  console.log(JSON.stringify({ event: 'option-focus', observed }))
  assert.equal(observed.browser, 'Chrome', '无id的菜单选项焦点也应在同步重绘后保持')
})

test('FC-01/04补：Space展开、键盘选项激活和Escape归焦；同态读取不替换节点', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  await f.page.focus('#browser-toggle')
  await f.page.keyboard.press('Space')
  await f.page.waitForSelector('[role=listbox]')
  await f.page.evaluate(() => { window.fcFocusedNode = document.querySelector('#browser-toggle') })
  await pause(1100)
  assert.equal(await f.page.evaluate(() => window.fcFocusedNode === document.querySelector('#browser-toggle')), true)
  await f.page.focus('[data-browser=Chrome]')
  await f.page.keyboard.press('Enter')
  await f.page.waitForFunction(() => state.selectedBrowser === 'Chrome' && !actionBusy)
  await f.page.click('#browser-toggle')
  await f.page.focus('[data-browser=Safari]')
  await f.page.keyboard.press('Escape')
  assert.equal(await f.page.evaluate(() => document.activeElement.id), 'browser-toggle')
  assert.equal(await f.page.$('[role=listbox]'), null)
})

test('FC-03补：503携带S4也不能接受；下一次有效读恢复；无回告不自行S4', { timeout: 12000 }, async t => {
  const f = await fixture(t)
  await f.page.click('[data-act=open]')
  await f.page.waitForFunction(() => state.status === 'S3')
  const before = f.reads()
  const release = f.hold('read')
  f.failRead()
  f.setState(state('S4'))
  while (f.reads() === before) await pause(20)
  release()
  await pause(150)
  assert.equal(await f.page.evaluate(() => state.status), 'S3')
  await f.page.waitForFunction(() => state.status === 'S4')
  console.log(JSON.stringify({ event: '503-recovery', reads: f.reads(), status: await f.page.evaluate(() => state.status) }))
})

test('FC-03/04补：3s只读Abort有界串行并恢复，不接受已abort响应', { timeout: 12000 }, async t => {
  const f = await fixture(t)
  const release = f.hold('read')
  const before = f.reads()
  while (f.reads() === before) await pause(20)
  f.setState(state('S4'))
  await f.page.waitForFunction(() => state.status === 'S4', { timeout: 5500 })
  release()
  await pause(300)
  assert.equal(await f.page.evaluate(() => state.status), 'S4')
  assert.equal(f.maxStateInFlight(), 1, '网络未完成读应先abort再起后继')
  assert.deepEqual(f.errors, [])
})

test('FC-04补：关闭时真实GET在途，释放迟到S4不重建页且不继续读', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  f.setState(state('S4'))
  const release = f.hold('read')
  const before = f.reads()
  while (f.reads() === before) await pause(20)
  await f.page.click('#close')
  const atClose = f.reads()
  release()
  await pause(1100)
  assert.equal(await f.page.$('.window'), null)
  assert.equal(f.reads(), atClose)
  assert.deepEqual(f.errors, [])
})

test('FC-04补：真实pagehide停止同步，迟到动作不在离开页面更新', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  const release = f.hold('action')
  await f.page.click('[data-act=open]')
  await pause(100)
  await f.page.goto('about:blank')
  const atHide = f.reads()
  release()
  await pause(1100)
  assert.equal(f.reads(), atHide)
  assert.equal(await f.page.$('.window'), null)
  assert.deepEqual(f.errors, [])
})

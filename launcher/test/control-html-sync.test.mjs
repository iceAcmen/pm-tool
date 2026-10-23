/**
 * 生产control内联脚本的真实Chrome DOM回归。
 * HTTP只提供受控权威状态；不启动dsh，不读取任何既有浏览器凭据。
 */
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
let browser
before(async () => {
  browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    userDataDir: mkdtempSync(join(tmpdir(), 'pm-control-dom-')),
    args: ['--no-first-run', '--no-default-browser-check'],
  })
})
after(async () => { await browser?.close() })

function state(status = 'S1') {
  return { status, view: status, step: 0, confirmed: status === 'S4', host: '127.0.0.1', port: 3205,
    browsers: ['系统默认浏览器', 'Chrome', 'Safari'], selectedBrowser: '系统默认浏览器', theme: 'light' }
}
test('浏览器选择框实际SVG限宽不伸缩，初态及菜单选择后保持18px', async t => {
  const f = await fixture(t)
  for (const width of [1440, 390]) {
    await f.page.setViewport({ width, height: 900 })
    const dimensions = await f.page.$eval('#browser-toggle', element => {
      const box = element.getBoundingClientRect()
      const icon = element.querySelector(':scope > svg').getBoundingClientRect()
      return { buttonHeight: box.height, iconWidth: icon.width, iconHeight: icon.height,
        shrink: getComputedStyle(element.querySelector(':scope > svg')).flexShrink }
    })
    assert.equal(dimensions.iconWidth, 18)
    assert.equal(dimensions.iconHeight, 18)
    assert.equal(dimensions.shrink, '0')
    assert.ok(dimensions.buttonHeight < 70)
  }
})
async function fixture(t) {
  let current = state()
  let hold
  let releaseHeld
  let reads = 0
  let lastAction
  let actionHold
  const releases = []
  const actions = []
  let preferenceFailures = 0
  const server = createServer(async (req, res) => {
    res.setHeader('content-type', 'application/json')
    if (req.url === '/') {
      res.setHeader('content-type', 'text/html')
      res.end(renderControlHtml({ theme: 'light' }, { initialState: current }))
    } else if (req.url === '/api/state') {
      reads += 1
      const captured = structuredClone(current)
      if (hold) { const wait = hold; hold = null; await wait }
      res.end(JSON.stringify({ state: captured }))
    } else if (req.url === '/api/action') {
      let raw = ''
      for await (const chunk of req) raw += chunk
      lastAction = JSON.parse(raw)
      const action = lastAction
      actions.push(action)
      if (action.type === 'select-browser' && preferenceFailures > 0) {
        preferenceFailures--
        res.statusCode = 503
        res.end('{}')
        return
      }
      if (action.type === 'select-browser') current = { ...current, selectedBrowser: action.browser }
      if (action.type === 'open') current = { ...current, status: 'S2', view: 'S2' }
      const captured = structuredClone(current)
      if (actionHold) { const wait = actionHold; actionHold = null; await wait }
      // 取消后的慢open不再写S3；模拟与生产旅程代际相同的权威约束。
      if (action.type === 'open' && current.status === 'S2') current = { ...current, status: 'S3', view: 'S3' }
      if (action.type === 'cancel') current = state('S0')
      if (lastAction.type === 'back') current = { ...current, status: 'S0', view: 'S0' }
      res.end(JSON.stringify({ state: action.type === 'select-browser' ? captured : current }))
    } else { res.statusCode = 404; res.end('{}') }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const page = await browser.newPage()
  t.after(async () => {
    releaseHeld?.()
    releases.forEach(release => release())
    await page.close()
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  })
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#browser-toggle', { timeout: 3000 })
  return {
    page, actions, reads: () => reads, lastAction: () => lastAction,
    failPreferences: count => { preferenceFailures = count },
    setState: next => { current = next },
    holdNextRead: () => { hold = new Promise(resolve => { releaseHeld = resolve }); return releaseHeld },
    holdNextAction: () => {
      let release
      actionHold = new Promise(resolve => { release = resolve })
      releases.push(release)
      return release
    },
  }
}

test('真实DOM：浏览器菜单鼠标/键盘展开，选择后重绘仍能展开且Escape收起', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  await f.page.click('#browser-toggle')
  assert.equal(await f.page.$eval('#browser-toggle', n => n.getAttribute('aria-expanded')), 'true')
  assert.equal(await f.page.$$eval('[role=option]', ns => ns.length), 3)
  const selected = f.page.waitForResponse(r => r.url().endsWith('/api/action') && r.status() === 200)
  await f.page.click('[data-browser=Chrome]')
  await selected
  await f.page.waitForFunction(() => document.querySelector('#browser-toggle')?.innerText.includes('Chrome'))
  assert.equal(f.lastAction().browser, 'Chrome')
  await f.page.focus('#browser-toggle')
  await f.page.keyboard.press('Enter')
  await f.page.waitForSelector('[role=listbox]')
  await f.page.keyboard.press('Escape')
  assert.equal(await f.page.$('[role=listbox]'), null)
})

test('真实DOM：晚到权威S4自动可见，同态读取保留菜单和主题；关闭后停止读取', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  await f.page.click('#theme-toggle')
  await f.page.click('#browser-toggle')
  const before = f.reads()
  await f.page.waitForFunction(() => document.querySelector('#browser-toggle')?.getAttribute('aria-expanded') === 'true')
  await new Promise(resolve => setTimeout(resolve, 1100))
  assert.ok(f.reads() > before, '存在后续只读同步')
  assert.equal(await f.page.$eval('#browser-toggle', n => n.getAttribute('aria-expanded')), 'true')
  assert.equal(await f.page.$eval('body', n => n.dataset.theme), 'dark')
  await f.page.keyboard.press('Escape')
  await f.page.click('[data-act=open]')
  await f.page.waitForFunction(() => document.body.innerText.includes('等待已进入回告'))
  f.setState(state('S4'))
  await f.page.waitForFunction(() => document.body.innerText.includes('工作台已打开'), { timeout: 3000 })
  await f.page.click('#close')
  const atClose = f.reads()
  await new Promise(resolve => setTimeout(resolve, 1100))
  assert.equal(f.reads(), atClose)
  assert.equal(await f.page.$('.window'), null)
})

test('真实DOM：旧同步响应不能覆盖后发动作，关闭后迟到响应不重建页面', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  const release = f.holdNextRead()
  const before = f.reads()
  const deadline = Date.now() + 3000
  while (f.reads() === before && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50))
  assert.ok(f.reads() > before, '被延迟的真实读取已经发出')
  await f.page.click('[data-act=open]')
  await f.page.waitForFunction(() => document.body.innerText.includes('等待已进入回告'))
  release()
  await new Promise(resolve => setTimeout(resolve, 300))
  assert.ok(await f.page.$('[data-act=report-auth-error]'), '旧S1不得覆盖动作S3')
  await f.page.click('#close')
  f.setState(state('S4'))
  await new Promise(resolve => setTimeout(resolve, 800))
  assert.equal(await f.page.$('.window'), null)
})

test('真实DOM：慢open时显示权威S2，取消独立到达并拒绝迟到启动响应', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  const release = f.holdNextAction()
  await f.page.click('[data-act=open]')
  await f.page.waitForSelector('[data-act=cancel]', { timeout: 3000 })
  await f.page.click('[data-act=cancel]')
  await f.page.waitForSelector('[data-act=open]', { timeout: 3000 })
  assert.equal(f.actions.at(-1).type, 'cancel')
  release()
  await new Promise(resolve => setTimeout(resolve, 700))
  assert.ok(await f.page.$('[data-act=open]'), '迟到open响应不得倒灌')
})

test('真实DOM：浏览器偏好串行保留最后选择，随后打开使用最后选择', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  const release = f.holdNextAction()
  await f.page.click('#browser-toggle')
  await f.page.click('[data-browser=Chrome]')
  await f.page.click('#browser-toggle')
  await f.page.click('[data-browser=Safari]')
  await f.page.click('[data-act=open]')
  release()
  await f.page.waitForFunction(() => document.body.innerText.includes('等待已进入回告'))
  assert.deepEqual(f.actions.filter(a => a.type === 'select-browser').map(a => a.browser), ['Chrome', 'Safari'])
  assert.equal(f.actions.at(-1).browser, 'Safari')
})

test('真实DOM：有效同步更新保持菜单选项的稳定键盘焦点', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  await f.page.click('#browser-toggle')
  await f.page.focus('[data-browser=Chrome]')
  f.setState(state('S0'))
  await f.page.waitForFunction(() => document.body.innerText.includes('工作台尚未启动'))
  assert.equal(await f.page.evaluate(() => document.activeElement.dataset.browser), 'Chrome')
  await f.page.keyboard.press('Enter')
  await f.page.waitForFunction(() => document.activeElement.id === 'browser-toggle')
})

test('真实DOM：偏好连续失败不打开默认浏览器，保留选择可重试', { timeout: 10000 }, async t => {
  const f = await fixture(t)
  f.failPreferences(2)
  await f.page.click('#browser-toggle')
  await f.page.click('[data-browser=Chrome]')
  await f.page.click('[data-act=open]')
  await f.page.waitForSelector('[role=alert]')
  assert.equal(f.actions.filter(a => a.type === 'open').length, 0)
  assert.ok(await f.page.$eval('#browser-toggle', n => n.innerText.includes('Chrome')))
  await f.page.click('[data-act=open]')
  await f.page.waitForFunction(() => document.body.innerText.includes('等待已进入回告'))
  assert.equal(f.actions.at(-1).browser, 'Chrome')
})

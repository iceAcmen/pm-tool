import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const root = process.env.A11_ROOT
const frozen = process.env.A11_FROZEN
assert.ok(root && frozen)
const require = createRequire(path.join(frozen, 'packages/dsh-pm-tool/package.json'))
const puppeteer = (await import(pathToFileURL(require.resolve('puppeteer-core')))).default
const { renderControlHtml } = await import(pathToFileURL(path.join(frozen, 'launcher/src/control-html.mjs')))
const { renderControlHtml: renderOld } = await import(pathToFileURL(path.join(root, 'a10-control-html.mjs')))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const observations = []
let browser
before(async () => {
  browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, userDataDir: fs.mkdtempSync(path.join(root, 'tmp/independent-chrome-')),
    args: ['--no-first-run', '--no-default-browser-check'],
  })
  observations.push({ type: 'browser', pid: browser.process().pid, version: await browser.version(),
    argv: browser.process().spawnargs, capability: 'AUTO_HEADLESS_REAL_DOM_NOT_MAIN_GUI' })
})
after(async () => {
  await browser?.close()
  fs.writeFileSync(path.join(root, 'independent-observations.json'), `${JSON.stringify(observations, null, 2)}\n`)
})
const initial = theme => ({
  status: 'S0', view: 'S0', confirmed: false, theme,
  browsers: ['系统默认浏览器', 'Chrome', 'Safari'], selectedBrowser: '系统默认浏览器',
})
async function fixture(t, width, theme, renderer = renderControlHtml) {
  let current = initial(theme)
  const requests = []
  let reads = 0
  const templates = []
  const server = createServer(async (req, res) => {
    res.setHeader('content-type', 'application/json')
    if (req.url === '/') {
      const html = renderer({ theme }, { initialState: current })
      templates.push(hash(html))
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.end(html)
    } else if (req.url === '/api/state') {
      reads++
      res.end(JSON.stringify({ state: current }))
    } else if (req.url === '/api/action') {
      let raw = ''
      for await (const chunk of req) raw += chunk
      const payload = JSON.parse(raw)
      requests.push({ method: req.method, path: req.url, payload, csrfHeaderEmpty: !req.headers['x-csrf-nonce'],
        cookieAbsent: !req.headers.cookie })
      if (payload.type === 'select-browser') current = { ...current, selectedBrowser: payload.browser }
      if (['open', 'reopen'].includes(payload.type)) current = { ...current, status: 'S3', view: 'S3', confirmed: false, browser: payload.browser }
      if (payload.type === 'switch-browser') current = { ...current, status: 'S1', view: 'S1', confirmed: false }
      res.end(JSON.stringify({ state: current }))
    } else {
      requests.push({ method: req.method, path: req.url })
      res.statusCode = 404
      res.end('{}')
    }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  assert.notEqual(port, 60787)
  const page = await browser.newPage()
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(String(error)))
  t.after(async () => {
    observations.push({ type: 'fixture', width, theme, port, reads, requests, templates, pageErrors })
    await page.close()
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  })
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 })
  const response = await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' })
  assert.equal(hash(await response.text()), templates[0], 'Full actual HTTP response matches frozen renderer')
  await page.waitForSelector('#browser-toggle')
  return { page, requests, pageErrors, port, setState: next => { current = next }, current: () => current }
}
async function probe(page, label, width, theme) {
  const measured = await page.evaluate(() => {
    const box = n => {
      const b = n.getBoundingClientRect()
      const style = getComputedStyle(n)
      return { width: b.width, height: b.height, x: b.x, y: b.y,
        flexShrink: style.flexShrink, flexBasis: style.flexBasis, color: style.color }
    }
    const trigger = document.querySelector('#browser-toggle')
    const icon = trigger?.querySelector(':scope > svg')
    return { trigger: trigger ? box(trigger) : null, icon: icon ? box(icon) : null,
      current: document.querySelector('.browser-current')?.innerText,
      expanded: trigger?.getAttribute('aria-expanded'), activeId: document.activeElement?.id,
      focusOutline: trigger ? { style: getComputedStyle(trigger).outlineStyle, width: getComputedStyle(trigger).outlineWidth } : null,
      theme: document.body.dataset.theme, outerScroll: document.documentElement.scrollWidth > innerWidth,
      app: document.querySelector('.app-icon svg') ? box(document.querySelector('.app-icon svg')) : null,
      privacy: box(document.querySelector('.privacy svg')),
      stateIcon: document.querySelector('.state-icon svg') ? box(document.querySelector('.state-icon svg')) : null,
      optionCount: document.querySelectorAll('[role=option]').length }
  })
  observations.push({ type: 'dom', label, width, theme, ...measured })
  return measured
}
function chooser(result) {
  assert.equal(result.icon.width, 18)
  assert.equal(result.icon.height, 18)
  assert.equal(result.icon.flexShrink, '0')
  assert.equal(result.icon.flexBasis, '18px')
  assert.equal(result.trigger.height, 48)
  assert.equal(result.icon.color, result.privacy.color, 'Uses inherited existing muted color')
  assert.equal(result.outerScroll, false)
  assert.equal(result.app.width, 30)
  assert.equal(result.app.height, 30)
  assert.equal(result.privacy.width, 14)
  assert.equal(result.privacy.height, 14)
}
async function nextRead(page) {
  await page.waitForResponse(response => response.url().endsWith('/api/state') && response.status() === 200, { timeout: 4000 })
}
for (const width of [1440, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`独立DOM ${width}/${theme}：S0/S1菜单、Chrome焦点、同态、S4及reopen局部回归`, { timeout: 20000 }, async t => {
      const f = await fixture(t, width, theme)
      chooser(await probe(f.page, 'S0-initial', width, theme))
      await f.page.focus('#browser-toggle')
      await f.page.keyboard.press('Enter')
      await f.page.waitForSelector('[role=listbox]')
      const menu = await probe(f.page, 'S0-menu', width, theme)
      chooser(menu)
      assert.equal(menu.expanded, 'true')
      assert.equal(menu.optionCount, 3)
      const saved = await f.page.$('#browser-toggle')
      await nextRead(f.page)
      assert.equal(await f.page.evaluate(n => n === document.querySelector('#browser-toggle'), saved), true, 'Same state does not rebuild trigger')
      const response = f.page.waitForResponse(r => r.url().endsWith('/api/action'))
      await f.page.click('[data-browser=Chrome]')
      await response
      await f.page.waitForFunction(() => document.activeElement?.id === 'browser-toggle')
      const selected = await probe(f.page, 'Chrome-selected', width, theme)
      chooser(selected)
      assert.ok(selected.current.includes('Chrome'))
      assert.equal(selected.expanded, 'false')
      assert.equal(selected.activeId, 'browser-toggle')
      await f.page.keyboard.press('Enter')
      await f.page.waitForSelector('[role=listbox]')
      await f.page.keyboard.press('Escape')
      const focused = await probe(f.page, 'Escape-focus', width, theme)
      chooser(focused)
      assert.equal(focused.expanded, 'false')
      assert.equal(focused.activeId, 'browser-toggle')
      assert.deepEqual(focused.focusOutline, { style: 'solid', width: '3px' })
      f.setState({ ...f.current(), status: 'S1', view: 'S1' })
      await f.page.waitForFunction(() => document.body.innerText.includes('工作台已在运行'))
      chooser(await probe(f.page, 'S1-sync', width, theme))
      await f.page.click('#browser-toggle')
      await f.page.focus('[data-browser=Chrome]')
      const option = await f.page.$('[data-browser=Chrome]')
      await nextRead(f.page)
      assert.equal(await f.page.evaluate(n => n === document.activeElement, option), true)
      chooser(await probe(f.page, 'S1-same-state-menu', width, theme))
      await f.page.keyboard.press('Escape')
      await f.page.click('[data-act=open]')
      await f.page.waitForSelector('[data-act=report-auth-error]')
      f.setState({ ...f.current(), status: 'S4', view: 'S4', confirmed: true })
      await f.page.waitForSelector('[data-act=reopen]')
      const s4 = await probe(f.page, 'S4-sync', width, theme)
      assert.equal(s4.icon, null, 'S4 has no browser chevron')
      assert.equal(s4.stateIcon.width, 25)
      assert.equal(s4.stateIcon.height, 25)
      assert.equal(s4.privacy.width, 14)
      const reopen = await f.page.$('[data-act=reopen]')
      await nextRead(f.page)
      assert.equal(await f.page.evaluate(n => n === document.querySelector('[data-act=reopen]'), reopen), true)
      await f.page.click('[data-act=reopen]')
      await f.page.waitForSelector('[data-act=report-auth-error]')
      assert.deepEqual(f.requests.at(-1).payload, { type: 'reopen', browser: 'Chrome' })
      f.setState({ ...f.current(), status: 'S4', view: 'S4', confirmed: true })
      await f.page.waitForSelector('[data-act=reopen]')
      assert.equal((await probe(f.page, 'S4-after-fixture-reopen', width, theme)).stateIcon.width, 25)
      await f.page.click('[data-act=switch-browser]')
      await f.page.waitForSelector('#browser-toggle')
      chooser(await probe(f.page, 'S1-after-switch', width, theme))
      assert.ok(f.requests.every(r => r.path === '/api/action' && r.cookieAbsent && r.csrfHeaderEmpty))
      assert.deepEqual(f.pageErrors, [])
    })
  }
}
test('独立DOM：旧新无关SVG实测相同，仅选择框箭头尺寸变化', { timeout: 10000 }, async t => {
  const before = await fixture(t, 1440, 'light', renderOld)
  const after = await fixture(t, 1440, 'light')
  const old = await probe(before.page, 'A10-old-comparison', 1440, 'light')
  const next = await probe(after.page, 'A11-new-comparison', 1440, 'light')
  assert.ok(old.icon.width > 18, 'Old bug remains reproducible, not rewritten')
  assert.equal(next.icon.width, 18)
  for (const key of ['app', 'privacy']) {
    assert.equal(old[key].width, next[key].width)
    assert.equal(old[key].height, next[key].height)
    assert.equal(old[key].color, next[key].color)
  }
  for (const f of [before, after]) {
    await f.page.bringToFront()
    await f.page.focus('#browser-toggle')
    await f.page.keyboard.press('Enter')
    await probe(f.page, f === before ? 'A10-old-menu-comparison' : 'A11-new-menu-comparison', 1440, 'light')
    await f.page.waitForSelector('.menu .selected svg', { timeout: 3000 })
  }
  const dimensions = page => page.$eval('.menu .selected svg', node => {
    const rect = node.getBoundingClientRect()
    const style = getComputedStyle(node)
    return { width: rect.width, height: rect.height, color: style.color, flexBasis: style.flexBasis }
  })
  const oldSelected = await dimensions(before.page)
  const newSelected = await dimensions(after.page)
  observations.push({ type: 'other-svg-comparison', oldSelected, newSelected })
  assert.deepEqual(newSelected, oldSelected, 'No broad all-SVG sizing rule')
})

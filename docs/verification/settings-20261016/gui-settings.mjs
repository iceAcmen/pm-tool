/**
 * #21 口径配置化 GUI 采集器（隔离 3141，真实 Chrome headless）。
 * 浅趟：默认设置抽屉截图 → 改 healthGreenAt 80→60 保存 → 概览灯号由黄变绿（派生随口径变化）。
 * 深趟：preference=dark 原生注入，设置抽屉深色截图。只采证据，不自判 PASS。
 */
import { createRequire } from 'node:module'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire('/Users/bytedance/Projects/dsh-pm/pm-tool/.tmp/cp-20261016/browser/')
const puppeteer = require('puppeteer-core')

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3141'
const TOKEN = process.env.GI_TOKEN
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const EV = process.env.EV_DIR
const DARK = process.env.RUN_DARK === '1'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const results = []
const log = (k, ok, detail = '') => { results.push({ k, ok: !!ok, detail: String(detail) }); console.log(`[${ok ? 'OK' : 'XX'}] ${k} :: ${detail}`) }
mkdirSync(EV, { recursive: true })

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1280,900'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))

const readLamp = () => page.evaluate(() => {
  const root = document.querySelector('[data-lamp]')
  return { lamp: root?.getAttribute('data-lamp') ?? null, text: root?.innerText?.slice(0, 80) ?? null }
})

try {
  await page.goto(`${BASE}/?token=${TOKEN}`, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(2500)
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /^(继续|稍后再说|稍后配置|跳过|知道了)$/.test((b.innerText || '').trim()))?.click())
    await sleep(600)
  }

  // 进入「项目管理」PM 工作台（左栏 aria-label=项目管理）
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === '项目管理')?.click())
  await sleep(1500)
  // 切到项目概览
  await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].find(b => /项目概览/.test(b.innerText || ''))?.click())
  await sleep(1300)

  const before = await readLamp()
  log('overview.beforeLamp', !!before.lamp, `lamp=${before.lamp}`)
  writeFileSync(join(EV, 'dom-before.json'), JSON.stringify(before, null, 2))

  // 打开「更多」菜单 → 口径设置
  await page.evaluate(() => document.querySelector('.pm-top-more')?.click())
  await sleep(700)
  const openedMenu = await page.evaluate(() => {
    const el = [...document.querySelectorAll('button')].find(b => /口径设置/.test(b.innerText || ''))
    if (el) { el.click(); return true }
    return false
  })
  log('settings.menuOpened', openedMenu, '点击「口径设置」菜单项')
  await sleep(900)

  const drawerInfo = await page.evaluate(() => {
    const root = document.querySelector('.pm-settings-root')
    if (!root) return { present: false }
    const inputs = [...root.querySelectorAll('input[type=number]')]
    return {
      present: true,
      fieldCount: inputs.length,
      note: root.querySelector('.pm-settings-note')?.textContent?.trim() ?? null,
      groups: [...root.querySelectorAll('.pm-settings-group-title')].map(g => g.textContent.trim()),
    }
  })
  log('settings.drawerPresent', drawerInfo.present, `fields=${drawerInfo.fieldCount} groups=${(drawerInfo.groups || []).join('/')} note=${drawerInfo.note}`)
  writeFileSync(join(EV, 'dom-settings-drawer.json'), JSON.stringify(drawerInfo, null, 2))

  if (!DARK) await page.screenshot({ path: join(EV, '10-settings-light.png') })

  if (!DARK) {
    // 改 healthGreenAt 80→60（绿灯线），保存 → 概览 69 分由黄变绿。
    await page.evaluate(() => {
      const root = document.querySelector('.pm-settings-root')
      const inputs = [...root.querySelectorAll('input[type=number]')]
      const green = inputs.find(i => (i.closest('.pm-field')?.querySelector('span')?.textContent || '').includes('绿灯分数线'))
      if (green) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(green, '60')
        green.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    await sleep(300)
    const saved = await page.evaluate(() => {
      const root = document.querySelector('.pm-settings-root')
      const btn = [...root.querySelectorAll('button')].find(b => /保存口径/.test(b.innerText))
      btn?.click()
      return !!btn
    })
    log('settings.saveClicked', saved, '点击保存口径')
    await sleep(1800)
    const afterMsg = await page.evaluate(() => document.querySelector('.pm-notice, [class*=notice]')?.textContent?.trim() ?? null)
    log('settings.saveResponse', /已保存|成功/.test(afterMsg || ''), `msg=${afterMsg}`)

    // 保存后 reload 重新拉取 snapshot（持久化口径生效），再进项目概览读灯号
    await page.reload({ waitUntil: 'networkidle2' })
    await sleep(2500)
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === '项目管理')?.click())
    await sleep(1500)
    await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].find(b => /项目概览/.test(b.innerText || ''))?.click())
    await sleep(1500)
    const after = await readLamp()
    log('overview.afterLamp.green', after.lamp === 'green', `before=${before.lamp} after=${after.lamp} (绿灯线降到 60，69 分应转绿)`)
    writeFileSync(join(EV, 'dom-after.json'), JSON.stringify({ before, after }, null, 2))
    await page.screenshot({ path: join(EV, '11-after-change-overview.png') })
  }

  if (DARK) {
    await sleep(800)
    const nativeDark = await page.evaluate(() =>
      document.body.hasAttribute('data-ds-dark-theme') ||
      document.documentElement.getAttribute('data-ds-theme-source') === 'dark')
    await page.screenshot({ path: join(EV, '12-settings-dark.png') })
    writeFileSync(join(EV, 'dom-settings-dark.json'), JSON.stringify({ nativeDark, drawer: drawerInfo }, null, 2))
    log('DARK.nativeTheme', nativeDark, `body[data-ds-dark-theme]=${nativeDark}`)
  }

  log('console.clean', consoleErrors.length === 0, `errors=${consoleErrors.length} ${consoleErrors.slice(0, 4).join(' | ')}`)
} catch (e) {
  results.push({ k: 'FATAL', ok: false, detail: e.message })
  console.log('[XX] FATAL', e.message)
  await page.screenshot({ path: join(EV, '99-fatal.png') }).catch(() => {})
} finally {
  writeFileSync(join(EV, process.env.RESULT_FILE || 'results-settings.json'), JSON.stringify({ mode: DARK ? 'dark' : 'light', results, consoleErrors }, null, 2))
  await browser.close()
}
console.log('DONE')

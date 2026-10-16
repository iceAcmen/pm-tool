/**
 * GI-CP-01~05 关键路径只读高亮 GUI 采集器（隔离 3131，真实 Chrome headless）。
 * 只采原始证据、不自判 PASS；token 仅 env 传入，绝不落证据。
 * 覆盖：线性链高亮/时差分支非关键/成环降级/缺日期降级/图例tooltip/零写/
 *       GI-CP-05 拖链尾 C 前置 A/B 纹丝不动不自动顺延；浅/深两态截图。
 */
import puppeteer from 'puppeteer-core'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3131'
const TOKEN = process.env.GI_TOKEN
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const EV = process.env.EV_DIR
const ISO_DATA = process.env.ISO_DATA
const DARK = process.env.RUN_DARK === '1'
const PKG = '/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const results = []
const log = (k, ok, detail = '') => { results.push({ k, ok: !!ok, detail: String(detail) }); console.log(`[${ok ? 'OK' : 'XX'}] ${k} :: ${detail}`) }
mkdirSync(EV, { recursive: true })

const readTask = (id) => JSON.parse(readFileSync(join(ISO_DATA, 'pmtool/tasks', id + '.json'), 'utf8')).record
const builtClientSha = createHash('sha256').update(readFileSync(join(PKG, 'lib/client.js'))).digest('hex')
console.log('built lib/client.js sha256 =', builtClientSha)

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1280,900'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))
const clientBundleRes = []
page.on('response', async (res) => {
  const u = res.url()
  if (u.includes('dsh-pm-tool/client.js')) {
    try { const body = await res.buffer(); clientBundleRes.push({ u, status: res.status(), bytes: body.length, sha: createHash('sha256').update(body).digest('hex'), hasCritical: body.toString('utf8').includes('pm-gantt-bar--critical') }) } catch {}
  }
})

const sampleGantt = () => page.evaluate(() => {
  const q = (s) => document.querySelector(s)
  const qa = (s) => [...document.querySelectorAll(s)]
  const bars = qa('.pm-gantt-bar')
  return {
    barCount: bars.length,
    criticalBarIds: qa('.pm-gantt-bar--critical').map(b => b.getAttribute('data-task-id')),
    barIds: bars.map(b => b.getAttribute('data-task-id')),
    legend: q('.pm-gantt-legend')?.textContent?.trim() ?? null,
    warnCycle: q('.pm-gantt-warn--cycle')?.textContent?.trim() ?? null,
    warnMissing: q('.pm-gantt-warn--missing')?.textContent?.trim() ?? null,
    linkPaths: qa('.pm-gantt-link-path').length,
    criticalPaths: qa('.pm-gantt-link-path--critical').length,
    barTitle: Object.fromEntries(bars.map(b => [b.getAttribute('data-task-id'), b.getAttribute('title')])),
    unscheduled: qa('.pm-gantt-unscheduled').map(s => s.textContent.trim()),
    noNaN: !document.body.innerText.includes('NaN'),
    scrollClientW: q('.pm-gantt-scroll')?.clientWidth ?? null,
  }
})

async function dragBar(id, dx) {
  const box = await page.evaluate((tid) => { const el = document.querySelector(`.pm-gantt-bar[data-task-id="${tid}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } }, id)
  if (!box) return false
  await page.mouse.move(box.x, box.y); await page.mouse.down(); await sleep(120)
  await page.mouse.move(box.x + dx / 2, box.y, { steps: 4 }); await sleep(90)
  await page.mouse.move(box.x + dx, box.y, { steps: 6 }); await sleep(120)
  await page.mouse.up(); return true
}

try {
  await page.goto(`${BASE}/?token=${TOKEN}`, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(2500)
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /^(继续|稍后再说|稍后配置|跳过)$/.test((b.innerText || '').trim()))?.click())
    await sleep(700)
  }
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button,[role=button],a,[class*=item],[class*=row],[class*=nav]')].find(e => /PM\s*项目管理|项目管理/.test(e.textContent || '') && e.textContent.length < 30)
    t?.click()
  })
  await sleep(2000)
  await page.evaluate(() => { const tab = [...document.querySelectorAll('button.pm-view-tab[role=tab]')].find(b => (b.innerText || '').includes('甘特排期')); tab?.click() })
  await sleep(1800)

  // ============ GI-CP-01 线性链高亮 / 图例 / tooltip ============
  const g = await sampleGantt()
  writeFileSync(join(EV, 'dom-gantt-light.json'), JSON.stringify(g, null, 2))
  log('CP01.linearChain.criticalBars', JSON.stringify(g.criticalBarIds) === JSON.stringify(['t-0001', 't-0002', 't-0003']), `critical=${g.criticalBarIds.join(',')} all=${g.barIds.join(',')}`)
  log('CP01.slackBranch.notCritical', !g.criticalBarIds.includes('t-0004'), `t-0004(时差分支) critical=${g.criticalBarIds.includes('t-0004')}`)
  log('CP01.legend.present', !!g.legend, `legend="${g.legend}"`)
  log('CP01.criticalEdgeHighlight', g.criticalPaths === 2, `criticalEdges=${g.criticalPaths}/${g.linkPaths}`)
  log('CP01.tooltip.marked', (g.barTitle['t-0001'] || '').includes('关键路径'), `t-0001 title="${g.barTitle['t-0001']}"`)
  log('CP01.bundle.servesCritical', clientBundleRes.some(b => b.hasCritical), `bundles=${clientBundleRes.map(b => `${b.status}/${b.bytes}B/critical=${b.hasCritical}`).join(' | ')}`)

  // ============ GI-CP-02 成环降级 ============
  log('CP02.cycle.notHighlighted', !g.criticalBarIds.includes('t-0005') && !g.criticalBarIds.includes('t-0006'), `cycle t-0005/t-0006 critical=${g.criticalBarIds.filter(id => ['t-0005', 't-0006'].includes(id)).join(',') || 'none'}`)
  log('CP02.cycle.warnChip', !!g.warnCycle, `chip="${g.warnCycle}"`)

  // ============ GI-CP-03 缺日期降级 ============
  log('CP03.missingDate.noBar', !g.barIds.includes('t-0007') && g.unscheduled.includes('未排期'), `t-0007 bar=${g.barIds.includes('t-0007')} unscheduled=${g.unscheduled.join('|')}`)
  log('CP03.missingDate.warnChip', !!g.warnMissing, `chip="${g.warnMissing}"`)

  if (!DARK) await page.screenshot({ path: join(EV, '10-gantt-light.png') })

  // ============ GI-CP-05 拖链尾 t-0003：前置 t-0001/t-0002 纹丝不动，不自动顺延（仅浅色趟执行写） ============
  if (!DARK) {
  const before = { t1: readTask('t-0001'), t2: readTask('t-0002'), t3: readTask('t-0003') }
  await dragBar('t-0003', 48)
  await sleep(1100)
  const after = { t1: readTask('t-0001'), t2: readTask('t-0002'), t3: readTask('t-0003') }
  await page.screenshot({ path: join(EV, '11-after-drag-tail.png') })
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  log('CP05.pred1.untouched', same(before.t1, after.t1), `t-0001 ${before.t1.startDate}~${before.t1.dueDate} -> ${after.t1.startDate}~${after.t1.dueDate} pred=${JSON.stringify(after.t1.predecessorIds)} prog=${after.t1.progress}`)
  log('CP05.pred2.untouched', same(before.t2, after.t2), `t-0002 ${before.t2.startDate}~${before.t2.dueDate} -> ${after.t2.startDate}~${after.t2.dueDate} pred=${JSON.stringify(after.t2.predecessorIds)} prog=${after.t2.progress}`)
  log('CP05.tail.shifted.whitelist', after.t3.startDate !== before.t3.startDate && after.t3.progress === before.t3.progress && JSON.stringify(after.t3.predecessorIds) === JSON.stringify(before.t3.predecessorIds), `t-0003 ${before.t3.startDate}~${before.t3.dueDate} -> ${after.t3.startDate}~${after.t3.dueDate} prog ${before.t3.progress}->${after.t3.progress} pred=${JSON.stringify(after.t3.predecessorIds)}`)
  const gAfter = await sampleGantt()
  writeFileSync(join(EV, 'dom-after-drag.json'), JSON.stringify(gAfter, null, 2))
  log('CP05.afterDrag.criticalStillChained', JSON.stringify(gAfter.criticalBarIds) === JSON.stringify(['t-0001', 't-0002', 't-0003']), `critical after drag=${gAfter.criticalBarIds.join(',')}`)
  } // end if (!DARK)

  // ============ 深色态（独立 dark 趟，由 cordis.patch preference=dark 原生注入，不手动改属性） ============
  if (DARK) {
    await sleep(800)
    const nativeDark = await page.evaluate(() =>
      document.body.hasAttribute('data-ds-dark-theme') ||
      document.documentElement.getAttribute('data-ds-theme-source') === 'dark')
    await page.screenshot({ path: join(EV, '12-gantt-dark.png') })
    const gDark = await sampleGantt()
    writeFileSync(join(EV, 'dom-gantt-dark.json'), JSON.stringify({ nativeDark, gDark }, null, 2))
    log('DARK.nativeTheme', nativeDark, `body/html data-ds-dark-theme=${nativeDark}`)
    log('DARK.criticalStillVisible', gDark.criticalBarIds.length === 3, `dark critical=${gDark.criticalBarIds.join(',')}`)
  }

  log('console.clean', consoleErrors.length === 0, `errors=${consoleErrors.length} ${consoleErrors.slice(0, 4).join(' | ')}`)
} catch (e) {
  results.push({ k: 'FATAL', ok: false, detail: e.message })
  console.log('[XX] FATAL', e.message)
  await page.screenshot({ path: join(EV, '99-fatal.png') }).catch(() => {})
} finally {
  const outFile = process.env.RESULT_FILE || 'results-cp.json'
  writeFileSync(join(EV, outFile), JSON.stringify({ builtClientSha256: builtClientSha, servedBundles: clientBundleRes, mode: DARK ? 'dark' : 'light', results, consoleErrors }, null, 2))
  await browser.close()
}
console.log('DONE')

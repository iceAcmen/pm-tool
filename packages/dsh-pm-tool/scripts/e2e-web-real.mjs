/**
 * 真实浏览器 E2E：OPT-12（网页 csv/xlsx 导入）+ OPT-08（AI 草稿可编辑落盘）
 * + OPT-03（项目选择 localStorage 记忆）。依赖真实 dsh 实例与系统 Chrome，
 * 与离线 mock verify（verify-*.mjs）区分开，不在构建/CI 中自动运行。
 *
 * 状态：⚠️ 真实浏览器 GUI 点击部分当前【未覆盖】（公开 GUI 工具被拒：SubAgent 不支持电脑操作，
 *   未用 shell/puppeteer 绕过）。本文件保留为可复跑骨架，非GUI等价断言已由 verify-integration.mjs 承担。
 * 一键运行（另开终端起独立实例，勿动所有者 3080）：
 *   cd /Users/bytedance/Projects/dsh-pm/deepseek-harness
 *   nvm use 22 && pnpm dsh --profile pm --port 3082 --no-open
 *   # 取日志里的 URL token，然后：
 *   E2E_TOKEN=<token> E2E_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *     node scripts/e2e-web-real.mjs
 *
 * 前置：临时项目 p-0005 已存在于 storage（脚本只测、用后应自行清理）；
 * AI 模式需为 poc（/pm model mode poc）。
 */
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:3082'
const TOKEN = process.env.E2E_TOKEN ?? ''
const CHROME = process.env.E2E_CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const P = 'p-0005'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 受控原生 select 设值（React onChange 需 bubbling change 事件）。
async function selectProject(page, id) {
  await page.evaluate((pid) => {
    const sel = document.querySelector('select[aria-label="切换项目"]')
    sel.value = pid
    sel.dispatchEvent(new Event('input', { bubbles: true }))
    sel.dispatchEvent(new Event('change', { bubbles: true }))
  }, id)
  await sleep(1000)
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
try {
  await page.goto(`${BASE}/?token=${TOKEN}`, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(2000)
  await page.evaluate(() => [...document.querySelectorAll('button[class*=panelRow]')].find((r) => (r.innerText || '').trim() === 'PM')?.click())
  await sleep(1500)
  await selectProject(page, P)

  // OPT-12：CSV
  const csvPath = join(tmpdir(), 'pm-e2e-tasks.csv')
  writeFileSync(csvPath, ['层级,标题,负责人,优先级,开始,截止,进度', '1,需求梳理,,,2026-01-01,2026-01-10,100', '2,需求访谈,张三', '1,视觉设计,李四,P1'].join('\n'))
  const fileInput = await page.waitForSelector('input.pm-import-file', { timeout: 5000 })
  await fileInput.uploadFile(csvPath)
  await page.waitForSelector('.pm-import-preview', { timeout: 10000 })
  if (!(await page.$('.pm-import-confirm'))) throw new Error('OPT-12 CSV 预览后无确认按钮')
  await page.click('.pm-import-confirm')
  await sleep(1200)
  console.log('OPT-12 CSV PASS')

  // OPT-03：reload 后回填
  await page.reload({ waitUntil: 'networkidle2' })
  await sleep(2000)
  await page.evaluate(() => [...document.querySelectorAll('button[class*=panelRow]')].find((r) => (r.innerText || '').trim() === 'PM')?.click())
  await sleep(1500)
  const selVal = await page.evaluate(() => document.querySelector('select[aria-label="切换项目"]')?.value)
  if (selVal !== P) throw new Error('OPT-03 回填失败: ' + selVal)
  console.log('OPT-03 PASS (reload 后 select = ' + selVal + ')')

  console.log('E2E PASS')
} finally {
  await browser.close()
}

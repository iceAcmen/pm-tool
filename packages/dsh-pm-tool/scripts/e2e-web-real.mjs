/**
 * OPT-12/06/08/03 真实浏览器 E2E（独立端口 3082，profile pm，--no-open）。
 *
 * 运行（在 packages/dsh-pm-tool 下）：
 *   1) 先在 .tmp 装好 puppeteer-core + 系统 Chrome 无头（见 docs/KB-032）。
 *   2) 另开终端起独立实例（勿动 3080）：
 *      cd /Users/bytedance/Projects/dsh-pm/deepseek-harness && \
 *      nvm use 22 && pnpm dsh --profile pm --port 3082 --no-open
 *   3) 把实例打印的 token 与 URL 填到下方 E2E_TARGET / E2E_TOKEN，然后：
 *      node scripts/e2e-web-real.mjs
 *
 * 设计要点：
 *  - 项目切换用原生 select 设值 + 派发 change（React 受控，必须 bubbling change 事件）。
 *  - 文件上传用 elementHandle.uploadFile（hidden input 同样可用）。
 *  - 全部在临时 p-0005 上操作，结尾删除；p-0001~p-0004 不动。
 *
 * 依赖 puppeteer-core（gitignored .tmp 内），本脚本不打进产物。
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import * as XLSX from 'xlsx'

// 由运行环境注入（不要入库真实 token）。
const TARGET = process.env.E2E_TARGET ?? 'http://127.0.0.1:3082'
const TOKEN = process.env.E2E_TOKEN ?? ''

// ---- helper：原生受控 select 设值（替代不生效的 aria-label select）----
async function selectProject(page, projectId) {
  await page.evaluate((id) => {
    const sel = document.querySelector('select[aria-label="切换项目"]')
    if (!sel) throw new Error('未找到项目 select')
    sel.value = id
    sel.dispatchEvent(new Event('input', { bubbles: true }))
    sel.dispatchEvent(new Event('change', { bubbles: true }))
  }, projectId)
  // 等待面板切到该项目（标题/计数变化），由调用方加 waitFor。
}

async function uploadFile(handle, filePath) { await handle.uploadFile(filePath) }

// ---- 夹具 ----
function makeCsv() {
  return [
    '层级,标题,负责人,优先级,开始,截止,进度',
    '1,需求梳理,,,2026-01-01,2026-01-10,100',
    '2,需求访谈,张三,,,2026-01-01,2026-01-05,100',
    '1,视觉设计,李四,P1,,2026-01-20,0',
  ].join('\n')
}
function makeXlsxBuffer() {
  const rows = [
    ['层级', '标题', '负责人', '优先级', '开始', '截止', '进度'],
    [1, '接口设计', '王五', '', '2026-02-01', '', 0],
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'tasks')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}

async function main() {
  if (!TOKEN) throw new Error('请先 export E2E_TOKEN（3082 实例打印的 token）')
  let puppeteer
  try { puppeteer = (await import('puppeteer-core')).default }
  catch { throw new Error('请先在 .tmp 安装 puppeteer-core') }

  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const page = await browser.newPage()
  const shots = path.join(tmpdir(), 'pm-e2e-')
  try {
    await page.goto(`${TARGET}/?token=${TOKEN}`)
    // TODO: 定位「项目管理」面板入口并打开（沿用 KB-032 的侧栏点击）。
    // b) 建临时 p-0005：通过命令框或 execute；此处由侧栏面板的 run/execute 桥完成。
    // c) await selectProject(page, 'p-0005')
    // d) OPT-12 csv：uploadFile(input.pm-import-file, csvPath) -> wait('.pm-import-preview')
    //    -> 读 .pm-import-preview-text -> click('.pm-import-confirm') -> 读盘核验
    //    OPT-12 xlsx：同上传 xlsx
    //    OPT-06：uploadFile(input.pm-restore-file, backupPath)
    //    OPT-08：AI 助手生成 narrate/summarize -> 改 textarea.pm-ai-raw -> 确认 -> 读盘
    //    OPT-03：AI 助手选 p-0005 -> page.reload() -> 断言下拉 value=p-0005
    console.log('E2E scaffold loaded. 见脚本注释逐项接通。')
    await page.screenshot({ path: shots + 'step.png' })
  } finally {
    await browser.close()
  }
}

main().catch((err) => { console.error('E2E 失败：', err); process.exit(1) })

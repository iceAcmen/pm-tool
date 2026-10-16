/**
 * #24 确定性 E2E（真实宿主 + 真实 Chrome headless，不出网、不调模型）。
 *
 * 设计：
 *  - 自建隔离 DSH_HOME / 临时存储 / 临时备份 / 非生产端口；正式 3080/3091 绝不触碰。
 *  - DSH_PM_E2E=1 仅启用确定性 fixture 缝（不调模型、不出网）。
 *  - 缺 harness 目录 / Chrome / 已注册 profile 时打印 SKIP 并以 0 退出（非阻断），
 *    便于在无宿主/无浏览器的 CI 环境不硬失败；本机具备条件时真实跑通。
 *
 * 环境变量（均可选）：
 *   E2E_HARNESS_DIR   宿主只读克隆根（默认 /Users/bytedance/Projects/dsh-pm/deepseek-harness）
 *   E2E_PROFILE_SRC   已注册 pm profile 骨架来源（默认 ~/.dsh/profiles/pm）
 *   E2E_CHROME        Chrome 可执行路径
 *   E2E_PORT          非生产端口（默认 3171）
 */
import { spawn } from 'node:child_process'
import {
  mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, symlinkSync, readFileSync,
} from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = dirname(fileURLToPath(import.meta.url))
const HARNESS = process.env.E2E_HARNESS_DIR || '/Users/bytedance/Projects/dsh-pm/deepseek-harness'
const CHROME = process.env.E2E_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PROFILE_SRC = process.env.E2E_PROFILE_SRC || join(homedir(), '.dsh/profiles/pm')
const PORT = Number(process.env.E2E_PORT || 3171)
const BASE = `http://127.0.0.1:${PORT}`

const skip = (msg) => { console.log(`[e2e] SKIP: ${msg}`); process.exit(0) }
if (!existsSync(HARNESS)) skip(`宿主目录不存在：${HARNESS}`)
if (!existsSync(CHROME)) skip(`Chrome 不存在：${CHROME}`)
if (!existsSync(PROFILE_SRC)) skip(`已注册 profile 不存在：${PROFILE_SRC}`)

// ---- 隔离目录 ----
const root = mkdtempSync(join(tmpdir(), 'pm-e2e-'))
const home = join(root, 'home')
const dataRoot = join(root, 'data', 'pmtool')
mkdirSync(join(home, 'profiles/pm'), { recursive: true })
mkdirSync(dataRoot, { recursive: true })

// 复用已注册 profile 骨架（cordis.yml/package.json/锁文件），node_modules 软链到来源（只读复用 peer）。
for (const f of ['cordis.yml', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
  const src = join(PROFILE_SRC, f)
  if (existsSync(src)) writeFileSync(join(home, 'profiles/pm', f), readFileSync(src, 'utf8'))
}
symlinkSync(join(PROFILE_SRC, 'node_modules'), join(home, 'profiles/pm', 'node_modules'), 'dir')
// 覆盖 patch：存储根指向临时目录、浅色主题、无任何 LLM provider/key。
writeFileSync(join(home, 'profiles/pm', 'cordis.patch.yml'), `
- id: storage-json
  name: '@deepseek-ai/dsh-storage-json'
  config:
    root: ${join(root, 'data')}
- id: ui-theme
  name: "@deepseek-ai/dsh-client-ui-theme"
  config:
    preference: light
`)

// ---- 确定性种子（env wrapper version 2；不写正式 data/）----
const TS = '2026-01-01T00:00:00.000Z'
const env = (record) => ({ version: 2, record })
const put = (sub, id, record) => {
  mkdirSync(join(dataRoot, sub), { recursive: true })
  writeFileSync(join(dataRoot, sub, `${id}.json`), JSON.stringify(env(record), null, 2) + '\n')
}
put('projects', 'p-e2e', {
  id: 'p-e2e', name: 'E2E 验收项目', description: '', owner: '', status: 'planning',
  startDate: '2026-01-01', targetDate: '2026-03-31', createdAt: TS, updatedAt: TS,
})
put('tasks', 't-e2e-1', {
  id: 't-e2e-1', projectId: 'p-e2e', parentId: null, code: '1.1', order: 1,
  title: 'E2E 确定性种子任务', description: '', assignee: '', status: 'todo',
  priority: 'P1', progress: 0, milestoneId: null, createdAt: TS, updatedAt: TS,
})

// ---- 启动宿主（DSH_PM_E2E=1 确定性缝）----
function startHost() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', '--profile', 'pm', '--port', String(PORT), '--no-open'], {
      cwd: HARNESS,
      env: { ...process.env, DSH_HOME: home, DSH_PM_E2E: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let buf = ''
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error('宿主启动超时')) }, 25000)
    child.stdout.on('data', (d) => {
      buf += d.toString()
      const m = /dsh web: http:\/\/127\.0\.0\.1:\d+\/\?token=([A-Za-z0-9_-]+)/.exec(buf)
      if (m) { clearTimeout(timer); resolve({ child, token: m[1] }) }
    })
    child.stderr.on('data', () => {})
    child.on('error', (e) => { clearTimeout(timer); reject(e) })
  })
}

let host
const results = []
const check = (k, ok, detail = '') => { results.push({ k, ok: !!ok, detail: String(detail) }); console.log(`[${ok ? 'OK' : 'XX'}] ${k} :: ${detail}`) }

try {
  host = await startHost()
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

  await page.goto(`${BASE}/?token=${host.token}`, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 2500))
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /^(继续|稍后再说|稍后配置|跳过|知道了)$/.test((b.innerText || '').trim()))?.click())
    await new Promise(r => setTimeout(r, 400))
  }
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === '项目管理')?.click())
  await new Promise(r => setTimeout(r, 1500))

  const state = await page.evaluate(() => ({
    project: (document.body.textContent || '').includes('E2E 验收项目'),
    task: (document.body.textContent || '').includes('E2E 确定性种子任务'),
  }))
  check('project.rendered', state.project, '项目名可见')
  check('task.rendered', state.task, '种子任务可见')
  check('console.clean', errors.length === 0, `errors=${errors.length} ${errors.slice(0, 3).join(' | ')}`)

  await browser.close()
} catch (e) {
  check('FATAL', false, e.message)
} finally {
  if (host?.child) host.child.kill('SIGTERM')
  setTimeout(() => rmSync(root, { recursive: true, force: true }), 300)
}

const failed = results.filter(r => !r.ok)
console.log(failed.length ? `\nE2E FAIL (${failed.length})` : '\nE2E PASS')
process.exit(failed.length ? 1 : 0)

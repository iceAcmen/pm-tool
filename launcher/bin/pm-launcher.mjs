#!/usr/bin/env node
/**
 * PM 工作台本地启动器 · 可执行入口（路径 B）。
 *
 * 行为：
 *  - 探测 127.0.0.1:PM_PORT（默认 3172）：已运行尽力开干净 URL（S3 等待权威回告）；未运行才 owned 启动。
 *  - control 页经 127 loopback 在所选普通浏览器 tab 打开；S4 仅由受认证工作台 /api/entered 有效 nonce 回告到达。
 *  - 不读 cookie、不代填令牌、不重放进程启动令牌、不 kill 进程、不争端口；关闭 tab 不停服务。
 *
 * 环境：PM_HOST（默认 127.0.0.1）、PM_PORT（默认 3172）、DSH_CWD（owned 启动的上游 deepseek-harness 目录）。
 */
import { probeService } from '../src/probe.mjs'
import { createDshController } from '../src/dsh-controller.mjs'
import { createLauncherApp } from '../src/launcher-app.mjs'
import { createControlServer } from '../src/loopback.mjs'
import { renderControlHtml } from '../src/control-html.mjs'
import { discoverBrowsers } from '../src/browsers.mjs'
import { openBrowser } from '../src/browser-open.mjs'

const HOST = process.env.PM_HOST || '127.0.0.1'
const PORT = Number(process.env.PM_PORT || 3172)
const DSH_CWD = process.env.DSH_CWD || '/Users/bytedance/Projects/dsh-pm/deepseek-harness'

function isReadyFactory(port) {
  return async () => {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, { redirect: 'manual', credentials: 'omit' })
      return res.status === 200 || res.status === 401
    } catch {
      return false
    }
  }
}

async function main() {
  const browsers = discoverBrowsers().map((b) => b.label)
  const controller = createDshController({ isReady: isReadyFactory(PORT) })
  const app = createLauncherApp({
    host: HOST,
    port: PORT,
    probeService,
    openBrowser,
    controller,
    browsers,
    dsh: { cwd: DSH_CWD, nodePath: process.execPath, env: process.env },
  })

  // 启动前先探测一次，落 S0/S1/S6。
  await app.detect()

  const server = createControlServer({
    getState: () => app.getState(),
    handleAction: (p) => app.handleAction(p),
    renderHtml: (st, ctx) => renderControlHtml(app.view(), { initialState: st, nonce: ctx?.nonce }),
    expectedOrigin: `http://${HOST}:${PORT}`,
    verifyEntered: (nonce) => app.verifyEntered(nonce),
    onEntered: (nonce) => app.onEntered(nonce),
  })
  const { port, close } = await server.listen()
  app.setLoopbackPort(port)

  // 在所选浏览器打开 control 页（仅 loopback 地址，不含 token）。
  try {
    await openBrowser(['open', `http://127.0.0.1:${port}/`])
  } catch (error) {
    await close().catch(() => {})
    throw error
  }

  // 保持进程存活；关闭浏览器 tab 不停止服务，也不退出已运行 dsh。
  const shutdown = async () => {
    await close().catch(() => {})
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((err) => {
  // 不打印 token；仅给非敏感错误。
  console.error('启动器启动失败：', err?.message ?? err)
  process.exit(1)
})

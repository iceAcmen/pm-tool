/**
 * 浏览器发现/选择 与 dsh 控制器缝（不真实 spawn dsh、不碰 3172、不读 cookie）。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { discoverBrowsers, resolveBrowserOpen } from '../src/browsers.mjs'
import { createDshController } from '../src/dsh-controller.mjs'

// ---------------------------------------------------------------------------
// 浏览器：仅列本机存在者；选择不可用回退默认，不报错。
// ---------------------------------------------------------------------------
test('discoverBrowsers：注入存在性，仅列出存在的浏览器，并标注 app 窗口能力', () => {
  const exists = (p) => p.endsWith('Google Chrome.app') || p.endsWith('Safari.app')
  const list = discoverBrowsers('/Applications', exists)
  const byLabel = Object.fromEntries(list.map((b) => [b.label, b]))
  assert.ok(byLabel.Chrome)
  assert.ok(byLabel.Safari)
  assert.equal(byLabel.Chrome.appWindow, true)
  assert.equal(byLabel.Safari.appWindow, false)
  assert.ok(!list.some((b) => b.label === 'Firefox'))
  assert.ok(!list.some((b) => b.label === 'Microsoft Edge'))
})

test('resolveBrowserOpen：Chrome 走 --app= 专用窗口；缺失选择回退默认 tab；默认浏览器 tab', () => {
  const discovered = [{ id: 'chrome', label: 'Chrome', app: 'Google Chrome.app', appWindow: true }]
  const chrome = resolveBrowserOpen('Chrome', discovered)
  assert.deepEqual(chrome.argv, ['open', '-a', 'Chrome', '--args', '--app='])
  assert.equal(chrome.mode, 'app')
  assert.equal(chrome.fallback, false)

  const missing = resolveBrowserOpen('Firefox', discovered)
  assert.equal(missing.fallback, true)
  assert.equal(missing.mode, 'tab')
  assert.deepEqual(missing.argv, ['open', ''])

  const def = resolveBrowserOpen('系统默认浏览器', discovered)
  assert.equal(def.mode, 'tab')
  assert.deepEqual(def.argv, ['open', ''])
})

// ---------------------------------------------------------------------------
// 控制器：自有实例内存捕获 authenticatedURL，打开后即弃；stop/kill 被拒绝；不落盘。
// ---------------------------------------------------------------------------
test('controller：fake spawn 捕获内存 token URL，就绪后返回；forget 丢弃；stop 拒绝', async () => {
  const fakeChild = {
    pid: 7777,
    stdout: {
      on(ev, fn) {
        queueMicrotask(() => fn('dsh web: http://127.0.0.1:0/?token=MzZpcWxhY2VrZWd0aXQ\n'))
      },
    },
    stderr: { on() {} },
  }
  const seams = {
    spawn: () => fakeChild,
    isReady: async () => true,
  }
  const controller = createDshController(seams)
  const entry = await controller.start({
    cwd: '/tmp/fake-dsh',
    nodePath: '/usr/bin/node',
    port: 0,
    env: {},
  })

  assert.equal(entry.pid, 7777)
  assert.equal(entry.token, 'MzZpcWxhY2VrZWd0aXQ')
  assert.equal(entry.authenticatedUrl, 'http://127.0.0.1:0/?token=MzZpcWxhY2VrZWd0aXQ')
  assert.equal(entry.baseUrl, undefined)
  assert.deepEqual(controller.listOwnedPids(), [7777])

  // 模拟浏览器打开后：内存 URL/token 即弃，不留存。
  controller.forgetAuthenticatedUrl(7777)
  assert.deepEqual(controller.listOwnedPids(), [])

  // 启动器不提供停止/杀死能力，避免误杀现网进程。
  assert.throws(() => controller.stop(), /不提供停止|停止\/杀死/)
})

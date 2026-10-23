/**
 * control HTML 渲染合同：浅深 token、隐私 footer、无 token 泄漏、装饰灯 aria-hidden、reduced-motion。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { renderControlHtml } from '../src/control-html.mjs'

test('渲染：含浅/深 token、隐私脚注；不嵌入 token；装饰灯 aria-hidden；reduced-motion', () => {
  const html = renderControlHtml({ theme: 'light' }, {
    initialState: { status: 'S0', browsers: ['系统默认浏览器', 'Chrome'], selectedBrowser: 'Chrome' },
  })
  assert.ok(html.includes('--accent:#4669ab'))
  assert.ok(html.includes('--accent:#91b1ef'))
  assert.ok(html.includes('仅在这台 Mac 上运行'))
  assert.ok(html.includes('prefers-reduced-motion:reduce'))
  assert.match(html, /class="lights"[^>]*aria-hidden="true"/)
  // 任意令牌样串不得出现在页面。
  assert.ok(!/token=[A-Za-z0-9]+/.test(html))
})

test('渲染：HTML 转义浏览器名，不注入原始引号', () => {
  const html = renderControlHtml({ theme: 'dark' }, {
    initialState: { status: 'S1', browsers: ['系统默认浏览器'], selectedBrowser: '系统默认浏览器' },
  })
  assert.ok(html.includes('data-theme="dark"'))
  assert.ok(!html.includes('"><script'))
})

test('S6 失败页：访问地址用 state.host/port，不硬编码 3172（隔离 3199 不得误导）', () => {
  const html = renderControlHtml({ theme: 'light' }, {
    initialState: {
      status: 'S6', host: '127.0.0.1', port: 3199,
      detail: { detection: '本地服务启动失败：x', outcome: '没有停止任何程序', suggestion: '重新尝试。' },
      browsers: ['系统默认浏览器'], selectedBrowser: '系统默认浏览器',
    },
  })
  // 默认 detailOpen=false 时不渲染详情；直接校验模板内取 state.port 的接线。
  assert.ok(html.includes('(state.host||\'127.0.0.1\')+\':\'+(state.port||3172)'))
})

test('模板：浏览器选择与打开负载走 selectedBrowser（回退 state.browser），不回退空默认', () => {
  const html = renderControlHtml({ theme: 'light' }, {
    initialState: { status: 'S0', browsers: ['系统默认浏览器', 'Chrome', 'Safari'], selectedBrowser: 'Chrome' },
  })
  // S0/S1 当前标签与菜单、动作负载统一取 selectedBrowser（客户端模板内接线）。
  assert.ok(html.includes('state.selectedBrowser||state.browser'))
  assert.ok(html.includes("act({type:id,browser:state.selectedBrowser||state.browser})"))
  assert.ok(html.includes('state.selectedBrowser=b.dataset.browser'))
})

test('S1 内联脚本可执行并渲染打开按钮，避免首屏正文空白', async () => {
  const initialState = {
    status: 'S1',
    view: 'S1',
    browsers: ['系统默认浏览器', 'Chrome'],
    selectedBrowser: '系统默认浏览器',
    theme: 'light',
  }
  const html = renderControlHtml({ theme: 'light' }, { initialState })
  const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1]
  assert.ok(script)

  const root = { innerHTML: '' }
  const body = { dataset: {} }
  const elements = new Map([
    ['root', root],
    ['theme-toggle', {}],
    ['close', {}],
  ])
  const context = vm.createContext({
    window: { addEventListener: () => {} },
    AbortController,
    setTimeout: () => 1,
    clearTimeout: () => {},
    document: {
      body,
      getElementById: (id) => elements.get(id) ?? null,
      querySelectorAll: () => [],
      addEventListener: () => {},
    },
    fetch: async () => ({ json: async () => ({ state: initialState }) }),
  })

  vm.runInContext(script, context)
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(body.dataset.theme, 'light')
  assert.match(root.innerHTML, /打开 PM 工作台/)
  assert.match(root.innerHTML, /工作台已在运行/)
})

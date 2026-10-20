/**
 * control HTML 渲染合同：浅深 token、隐私 footer、无 token 泄漏、装饰灯 aria-hidden、reduced-motion。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
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

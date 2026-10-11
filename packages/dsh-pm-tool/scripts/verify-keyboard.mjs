// OPT-09：键盘 reducer 表驱动单测（纯函数，不依赖浏览器）。
import assert from 'node:assert/strict'
import { panelKeyboard } from '../lib/core/panel-kbd.js'

const cases = [
  ['j', { type: 'move', delta: 1 }],
  ['k', { type: 'move', delta: -1 }],
  [' ', { type: 'toggleActive' }],
  ['Delete', { type: 'deleteSelected' }],
  ['Backspace', { type: 'deleteSelected' }],
  ['Enter', { type: 'openActive' }],
  ['x', null],
]
for (const [key, want] of cases) {
  assert.deepEqual(panelKeyboard({ key }), want, `按键 ${key}`)
}
// 守卫：输入类元素 / contenteditable / 修饰键一律不处理。
assert.equal(panelKeyboard({ key: 'j', targetTag: 'INPUT' }), null)
assert.equal(panelKeyboard({ key: 'j', targetTag: 'textarea' }), null)
assert.equal(panelKeyboard({ key: ' ', targetTag: 'TEXTAREA' }), null)
assert.equal(panelKeyboard({ key: 'j', targetEditable: true }), null)
assert.equal(panelKeyboard({ key: 'j', ctrl: true }), null)
assert.equal(panelKeyboard({ key: 'j', meta: true }), null)
assert.equal(panelKeyboard({ key: 'j', alt: true }), null)
// Del 在输入框内不劫持（避免删字被拦截）。
assert.equal(panelKeyboard({ key: 'Backspace', targetTag: 'INPUT' }), null)
console.log('通过：OPT-09 键盘 reducer 移动/勾选/删除/打开与输入框守卫用例。')

// R3-OBS-002：抽屉关闭焦点归还——可执行行为断言（对真实编译产物 lib/core/drawer-focus.js）。
//
// 覆盖四条路径（不靠源码正则，而是真实执行焦点解析逻辑 + 记录谁被 focus()）：
//  A. pointer 路径：mount 时 document.activeElement=body（即旧 autoFocus 已抢占的环境），
//     点击 title/edit/create 按钮打开 → 关闭后焦点回到「真实 opener 按钮」，不是 body、不是全局 primary/提醒。
//  B. keyboard 路径：j/k 高亮后 Enter 打开某任务 → 关闭后回到该可见行的 title/edit 入口。
//  C. opener 已销毁 fallback：原行被删除/卸载 → 兜底到当前视图「添加记录」控件，绝不落到 .pm-button-primary / 提醒条。
//  D. 输入守卫：input/textarea 内敲 j/k/Enter 不触发后台 task 快捷键（保持文本输入语义）。
//
// 边界诚实声明：本仓库 node 侧无 jsdom/react-dom，无法在此真实渲染 React / 真实浏览器 focus()。
// 这里用最小伪 DOM（实现 contains / rowOpener / fallbackControl / anyRowTitle 与 element.focus() 记录）
// 执行「被修复的核心决策逻辑」；真实 React autoFocus 时序、浏览器焦点可见性由独立 GUI 复验。
import assert from 'node:assert/strict'
import {
  setPointerOpener, setRowOpener, takeOpenerSpec, resolveDrawerFocusTarget,
  __resetDrawerFocusForTest,
} from '../lib/core/drawer-focus.js'
import { panelKeyboard } from '../lib/core/panel-kbd.js'

/** 记录全局谁被 focus() 了（伪 DOM 的焦点日志）。 */
const focusLog = []
class FakeEl {
  constructor(name, { primary = false, reminder = false } = {}) {
    this.name = name
    this.isConnected = true
    this.primary = primary      // 模拟 .pm-button-primary（如被选中的 7 天提醒范围按钮）
    this.reminder = reminder
  }
  focus() { focusLog.push(this.name) }
}

/** 按当前用例场景构造伪 FocusDoc。 */
function makeDoc({ liveRowTitle, addRow, firstTitle } = {}) {
  return {
    contains: (node) => !!node && node.isConnected !== false,
    rowOpener: (rowId) => (rowId === liveRowTitle?.rowId ? liveRowTitle.el : null),
    fallbackControl: () => addRow ?? null,
    anyRowTitle: () => firstTitle ?? null,
  }
}

function fresh() { focusLog.length = 0; __resetDrawerFocusForTest() }

// ---- A. pointer 路径：mount 时 activeElement=body，仍回到真实点击的 opener ----
{
  fresh()
  const opener = new FakeEl('task-title-cell-btn')        // 用户点了任务标题按钮
  const globalPrimary = new FakeEl('reminder-7day-primary', { primary: true, reminder: true })
  const addRow = new FakeEl('add-row')
  // pointerdown 捕获记录 opener（在打开动作那一刻，早于抽屉 mount / autoFocus）
  setPointerOpener(opener)
  const spec = takeOpenerSpec()                           // DrawerPanel mount 快照
  // 模拟旧缺陷环境：mount 时 document.activeElement 早已被抽屉内 input 抢占（这里等价 body）
  const doc = makeDoc({ addRow })
  const target = resolveDrawerFocusTarget(spec, doc)
  assert.equal(target, opener, 'pointer 路径应回到被点击的 opener 按钮本身')
  target.focus()
  assert.deepEqual(focusLog, ['task-title-cell-btn'], '只应聚焦真实 opener')
  assert.ok(!focusLog.includes(globalPrimary.name), '绝不能落到全局 primary/7 天提醒按钮')
}

// ---- B. keyboard 路径：Enter 打开某任务，回到该可见行 title/edit ----
{
  fresh()
  const rowTitle = new FakeEl('row-t-1001-title')
  setRowOpener('t-1001')                                  // openActive 记录当前高亮行 id
  const spec = takeOpenerSpec()
  const doc = makeDoc({ liveRowTitle: { rowId: 't-1001', el: rowTitle }, addRow: new FakeEl('add-row') })
  const target = resolveDrawerFocusTarget(spec, doc)
  assert.equal(target, rowTitle, 'keyboard 路径应回到该可见行的 title/edit 入口')
  target.focus()
  assert.deepEqual(focusLog, ['row-t-1001-title'])
}

// ---- B2. keyboard 行不可见（被折叠/筛掉）→ 退回当前视图合理控件，不悬空 ----
{
  fresh()
  setRowOpener('t-9999')
  const spec = takeOpenerSpec()
  const addRow = new FakeEl('add-row')
  const doc = makeDoc({ liveRowTitle: null, addRow })      // rowOpener('t-9999') 查不到
  const target = resolveDrawerFocusTarget(spec, doc)
  assert.equal(target, addRow, '行不可见时兜底到当前视图「添加记录」控件')
}

// ---- C. opener 已销毁（行被删除/卸载）→ fallback 当前视图控件，绝不全局 primary ----
{
  fresh()
  const deadOpener = new FakeEl('deleted-row-edit-btn')
  deadOpener.isConnected = false                           // 删除任务后原行 DOM 已卸载
  const globalPrimary = new FakeEl('some-other-primary', { primary: true })
  const reminder = new FakeEl('reminder-range', { reminder: true })
  const addRow = new FakeEl('add-row')
  setPointerOpener(deadOpener)
  const spec = takeOpenerSpec()
  const doc = makeDoc({ addRow })
  const target = resolveDrawerFocusTarget(spec, doc)
  assert.equal(target, addRow, 'opener 已删除时兜底到当前视图「添加记录」控件')
  assert.ok(target !== globalPrimary && target !== reminder, 'fallback 不得命中全局 primary / 提醒条')
  target.focus()
  assert.deepEqual(focusLog, ['add-row'], '只聚焦兜底控件')
}

// ---- C2. 既无 opener 也无 add-row，也无任何可见行 → 返回 null（不强行乱聚焦）----
{
  fresh()
  const spec = takeOpenerSpec()                            // 无任何打开手势（如深链打开）
  const doc = makeDoc({ liveRowTitle: null, addRow: null, firstTitle: null })
  assert.equal(resolveDrawerFocusTarget(spec, doc), null, '无合理目标时返回 null，不落到全局 primary')
}

// ---- D. 输入守卫：input/textarea 内敲 j/k/Enter 不触发后台 task 快捷键 ----
{
  // 不在输入框时：Enter 打开、j/k 移动（后台快捷键正常）
  assert.deepEqual(panelKeyboard({ key: 'Enter' }), { type: 'openActive' })
  assert.deepEqual(panelKeyboard({ key: 'j' }), { type: 'move', delta: 1 })
  // 在输入框内：一律不劫持 → 保持文本输入语义，drawer 内不触发后台 task 快捷键
  assert.equal(panelKeyboard({ key: 'j', targetTag: 'INPUT' }), null)
  assert.equal(panelKeyboard({ key: 'k', targetTag: 'INPUT' }), null)
  assert.equal(panelKeyboard({ key: 'j', targetTag: 'TEXTAREA' }), null)
  assert.equal(panelKeyboard({ key: 'Enter', targetTag: 'INPUT' }), null) // 表单提交不被误判成打开行
  assert.equal(panelKeyboard({ key: 'Backspace', targetTag: 'INPUT' }), null)
}

// ---- E. 泛按钮「键盘 Tab 聚焦后 Enter/Space」原生 click opener（非 TaskTable openActive）----
{
  fresh()
  // 用户 Tab 到「新建项目」按钮（它本身带 pm-button-primary），按 Enter/Space 触发原生 click 打开抽屉。
  const createBtn = new FakeEl('create-project-btn', { primary: true })
  setPointerOpener(createBtn)                              // root onClickCapture 捕获到的真实 opener
  const spec = takeOpenerSpec()
  const doc = makeDoc({ addRow: new FakeEl('add-row') })
  const target = resolveDrawerFocusTarget(spec, doc)
  // 它虽是 primary，但它是「真实 opener」→ 必须回到它，而不是误落到别的 primary/提醒。
  assert.equal(target, createBtn, '键盘原生 click 的真实 opener（即使带 primary）应被归还')
  target.focus()
  assert.deepEqual(focusLog, ['create-project-btn'])
}

// ---- F. 抽屉内点击不污染已快照的 opener（take 之后的记录不影响本次关闭归还）----
{
  fresh()
  const outsideBtn = new FakeEl('task-title-cell-btn')
  setPointerOpener(outsideBtn)
  const spec = takeOpenerSpec()                           // DrawerPanel mount 快照并清空
  // 用户在抽屉内点「保存」按钮（root onClickCapture 会跳过 .pm-drawer-layer，即便记录也只进 pending）
  const drawerSaveBtn = new FakeEl('drawer-save-btn')
  setPointerOpener(drawerSaveBtn)
  const doc = makeDoc({ addRow: new FakeEl('add-row') })
  const target = resolveDrawerFocusTarget(spec, doc)      // 用的是 mount 时快照的 spec，不是后来的 pending
  assert.equal(target, outsideBtn, '抽屉内点击不得改变已快照的 opener')
  assert.ok(target !== drawerSaveBtn)
}

console.log('通过：R3-OBS-002 焦点归还四条路径——pointer(activeElement=body)、keyboard 行入口、opener 已销毁 fallback(不落全局 primary/提醒)、输入守卫。')

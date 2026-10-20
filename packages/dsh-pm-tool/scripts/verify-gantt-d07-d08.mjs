/**
 * D-07 / D-08 甘特·里程碑交互契约（静态源码契约 + 既有纯函数复核；无需浏览器）。
 *
 * D-07 点条选中/详情入口/里程碑标记入口：
 *  - 单击（轻点）只选中聚焦，不立即弹抽屉；详情走双击或 Enter/Space（明确入口）。
 *  - 选中态有可见标识；里程碑菱形可键盘聚焦/激活（role=button + tabIndex=0 + Enter），
 *    只读派生条/菱形不响应位移微调。
 * D-08 任务↔里程碑现字段 milestoneId 双向展示（零 schema）：
 *  - 甘特侧条/标签展示任务现有关联里程碑标题；里程碑侧卡片列出关联任务且键盘可达，
 *    无关联诚实空态，不伪造。
 * 本脚本不改 panel.tsx / shared / taskform；任务抽屉关联接缝由公共负责人接线。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tasksByMilestone, milestoneTitleForTask } from '../lib/core/gantt.js'

const here = import.meta.dirname
const ganttSrc = readFileSync(join(here, '..', 'src/client/views/gantt.tsx'), 'utf8')
const ganttCss = readFileSync(join(here, '..', 'src/client/views/gantt.css'), 'utf8')
const msSrc = readFileSync(join(here, '..', 'src/client/views/milestones.tsx'), 'utf8')
const msCss = readFileSync(join(here, '..', 'src/client/views/milestones.css'), 'utf8')

// ---------- D-07-A：轻点选中，不立即开抽屉；详情走双击/Enter/Space ----------
// 条体双击是鼠标的明确详情入口；键盘 Enter/Space 仍打开。
assert.match(ganttSrc, /onDoubleClick=\{\(\) => openBar\(t\)\}/, 'D-07：条体 onDoubleClick 作为鼠标明确详情入口')
// 轻点（<4px）分支只 setSelectedId，不得调用 onEdit/openBar 开抽屉。
const upBlock = (() => {
  const start = ganttSrc.indexOf('const onPointerUpBar = async')
  assert.ok(start >= 0, '应存在 onPointerUpBar')
  let depth = 0
  const brace = ganttSrc.indexOf('{', start)
  for (let i = brace; i < ganttSrc.length; i++) {
    if (ganttSrc[i] === '{') depth++
    else if (ganttSrc[i] === '}') { depth--; if (depth === 0) return ganttSrc.slice(start, i + 1) }
  }
  throw new Error('onPointerUpBar 未闭合')
})()
assert.match(upBlock, /setSelectedId/, 'D-07：轻点分支应 setSelectedId 选中（不直接开抽屉）')
assert.doesNotMatch(upBlock, /openBar\(|onEdit\(/, 'D-07：轻点分支不得直接 openBar/onEdit（避免单击即弹抽屉）')
// 键盘 Enter/Space 仍打开（既有口径保留）。
const keyBlock = (() => {
  const start = ganttSrc.indexOf('const onKeyDownBar =')
  assert.ok(start >= 0, '应存在 onKeyDownBar')
  let depth = 0
  const brace = ganttSrc.indexOf('{', start)
  for (let i = brace; i < ganttSrc.length; i++) {
    if (ganttSrc[i] === '{') depth++
    else if (ganttSrc[i] === '}') { depth--; if (depth === 0) return ganttSrc.slice(start, i + 1) }
  }
  throw new Error('onKeyDownBar 未闭合')
})()
assert.match(keyBlock, /case 'Enter'|'Enter'/, 'D-07：Enter 打开详情（键盘入口）')
assert.match(keyBlock, /openBar\(task\)/, 'D-07：键盘 Enter/Space 经 openBar 打开')

// ---------- D-07-B：选中态可见标识（CSS + 类名） ----------
assert.match(ganttSrc, /is-selected/, 'D-07：选中条体带 is-selected 类')
assert.match(ganttCss, /\.pm-gantt-bar\.is-selected/, 'D-07：CSS 定义 .pm-gantt-bar.is-selected 可见选中环')

// ---------- D-07-C：里程碑菱形可聚焦/激活，只读不位移 ----------
assert.match(ganttSrc, /data-milestone-id/, 'D-07：菱形保留 data-milestone-id 锚点')
assert.match(ganttSrc, /role="button"/, 'D-07：里程碑菱形为 role=button（可交互）')
assert.match(ganttSrc, /tabIndex=\{0\}/, 'D-07：里程碑菱形 tabIndex=0（键盘可达）')
assert.match(ganttSrc, /里程碑.*查看详情|查看里程碑/, 'D-07：菱形 aria-label 明确「查看详情」意图')
assert.match(ganttCss, /\.pm-gantt-milestone[^-][\s\S]*:focus-visible/, 'D-07：菱形 focus-visible 有可见焦点环')
// 只读：菱形不挂拖拽/位移 handler（无 onPointerDown/onKeyDown 调整日期）。
const diamondBlock = (() => {
  const start = ganttSrc.indexOf('data-milestone-id')
  assert.ok(start >= 0, '缺少 data-milestone-id')
  return ganttSrc.slice(Math.max(0, start - 400), start + 400)
})()
assert.doesNotMatch(diamondBlock, /shiftDatesByDrag|commitDates/, 'D-07：里程碑菱形只读，不得触发日期位移/落库')

// ---------- D-08-A：甘特侧展示任务现有关联里程碑（现字段，零 schema） ----------
assert.match(ganttSrc, /milestoneTitleForTask/, 'D-08：甘特使用 milestoneTitleForTask 解析现有关联')
assert.match(ganttSrc, /pm-gantt-ms-chip/, 'D-08：甘特标签渲染关联里程碑 chip（pm-gantt-ms-chip）')
assert.match(ganttCss, /\.pm-gantt-ms-chip/, 'D-08：CSS 定义 .pm-gantt-ms-chip 样式')

// ---------- D-08-B：里程碑侧关联任务键盘可达 + 诚实空态 ----------
assert.match(msSrc, /tasksByMilestone/, 'D-08：里程碑视图复用纯分组 tasksByMilestone')
assert.match(msSrc, /role="button"/, 'D-08：关联任务 chip role=button')
assert.match(msSrc, /tabIndex=\{0\}/, 'D-08：关联任务 chip tabIndex=0（键盘可达）')
assert.match(msSrc, /onKeyDown/, 'D-08：关联任务 chip 支持 Enter 激活（onKeyDown）')
assert.match(msSrc, /暂无关联任务/, 'D-08：无关联任务诚实显示「暂无关联任务」，不伪造')
assert.match(msCss, /\.ms-chip-deliv:focus-visible/, 'D-08：关联 chip 有键盘焦点环')

// ---------- 纯函数复核（lib 构建后） ----------
const grouped = tasksByMilestone([
  { id: 't1', title: 'A', milestoneId: 'm1' },
  { id: 't2', title: 'B', milestoneId: 'm1' },
  { id: 't3', title: 'C', milestoneId: null },
])
assert.deepEqual((grouped.get('m1') || []).map(x => x.id), ['t1', 't2'])
assert.equal(milestoneTitleForTask({ milestoneId: 'm1' }, [{ id: 'm1', title: '需求冻结' }]), '需求冻结')
assert.equal(milestoneTitleForTask({ milestoneId: null }, []), null)

console.log('verify-gantt-d07-d08 OK：点条选中/双击·Enter 详情入口/选中环/里程碑可聚焦只读/双向关联/键盘可达/诚实空态。')

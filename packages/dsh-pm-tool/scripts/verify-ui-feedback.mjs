/**
 * v0.6 人工反馈回归：UI 反馈纯函数（与 React/DOM 解耦，node 离线单测）。
 * 覆盖：Notice 多行/路径抽取、全局键盘门控（drawer/modal/input 打开时不处理）、Gantt 日期轴抽样（不重叠、含年份）。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  formatNoticeLines,
  extractBackupPath,
  shouldHandleGlobalKbd,
  sampleGanttTicks,
  parseActiveModelLane,
  nextRowId,
} from '../lib/core/ui-feedback.js'
import { flattenVisible } from '../lib/core/task-tree.js'

const here = dirname(fileURLToPath(import.meta.url))

// ---- formatNoticeLines：保留多行，去掉多余空行 ----
const multi = ['备份已生成：', '  文件：/tmp/pmtool-backup-2026-10-13.json', '  项目 2｜任务 5'].join('\n')
const lines = formatNoticeLines(multi)
assert.equal(lines.length, 3, '应保留多行而非只取首行')
assert.ok(lines[1].includes('pmtool-backup-2026-10-13.json'), '第二行应含文件路径')
assert.equal(formatNoticeLines('单行通知').length, 1)

// ---- extractBackupPath：从多行通知里抽出备份文件绝对路径 ----
assert.equal(extractBackupPath(multi), '/tmp/pmtool-backup-2026-10-13.json', '应识别「文件：」后的路径')
assert.match(
  extractBackupPath('备份已生成：\n  文件：/x/y/pmtool-backup-abc.json') ?? '',
  /pmtool-backup-abc\.json/,
)
assert.equal(extractBackupPath('没有路径的一行'), null, '无路径时返回 null')

// ---- shouldHandleGlobalKbd：覆盖面板全局任务表导航 ----
// 正常表上空闲：j/k/Space/Enter/Del 应处理。
assert.equal(shouldHandleGlobalKbd({ key: 'j' }), true)
assert.equal(shouldHandleGlobalKbd({ key: ' ' }), true)
// 焦点在输入控件：不处理。
assert.equal(shouldHandleGlobalKbd({ key: ' ', targetTag: 'INPUT' }), false)
assert.equal(shouldHandleGlobalKbd({ key: 'k', targetTag: 'TEXTAREA' }), false)
assert.equal(shouldHandleGlobalKbd({ key: 'j', targetEditable: true }), false)
// 带修饰键：不处理。
assert.equal(shouldHandleGlobalKbd({ key: 'j', ctrl: true }), false)
// 抽屉/弹窗/副驾任一打开：全局表导航让位。
assert.equal(shouldHandleGlobalKbd({ key: ' ', overlayOpen: true }), false)
assert.equal(shouldHandleGlobalKbd({ key: 'Delete', overlayOpen: true }), false)

// ---- sampleGanttTicks：抽样到标签不重叠，含年份边界 ----
// 30 天跨度、16px/天 → 至少每隔几天才打一个标签，且首 tick 带年份。
const ticks = sampleGanttTicks('2026-01-01', '2026-01-30', 16)
assert.ok(ticks.length >= 2 && ticks.length <= 15, `抽样后标签数量合理（实得 ${ticks.length}）`)
// 相邻 tick 像素间距 >= 40，保证「MM-DD」不重叠。
for (let i = 1; i < ticks.length; i++) {
  assert.ok((ticks[i].leftDays - ticks[i - 1].leftDays) * 16 >= 40, '相邻 tick 水平间距应足以放下日期标签')
}
assert.ok(ticks[0].label.includes('2026'), '首个 tick 应带年份')
// 跨年/年初边界示例：连续日期不重复打在同一天。
assert.ok(ticks.every((t, i, a) => i === 0 || t.leftDays > a[i - 1].leftDays), 'tick 应随日期递增')

// ---- parseActiveModelLane：只认 ▶ 当前行或首行「当前车道」，不 contains [prod] ----
const pocStatus = [
  '当前车道：PoC 验证（免费网关）',
  '▶ [poc] free/gateway 就绪 — PoC',
  '  [prod] official/openai 未就绪 — 需 Key',
].join('\n')
const prodStatus = [
  '当前车道：生产开发（官方 API）',
  '  [poc] free/gateway 就绪 — PoC',
  '▶ [prod] official/openai 就绪 — 自有 Key',
].join('\n')
assert.equal(parseActiveModelLane(pocStatus), 'poc', '▶ [poc] 行应解析为 poc')
assert.equal(parseActiveModelLane(prodStatus), 'prod', '▶ [prod] 行应解析为 prod')
// 关键：两条都列出时不能因 contains [prod] 误判 poc。
assert.equal(parseActiveModelLane(pocStatus), 'poc', '即便列出 [prod] 行也不误判')
assert.equal(parseActiveModelLane('乱七八糟\n没有车道'), null, '无信号返回 null')

// ---- nextRowId：行导航状态序列（点击第3行后再 j/k，应作用于该行而非首行）----
const rows = ['r1', 'r2', 'r3', 'r4']
// 初始无 active → 视为首行。
assert.equal(nextRowId(rows, null, 0), 'r1')
// 用户点击第3行（外部 setActiveId('r3')）。
let cur = 'r3'
// 按 k(+1) → r4；再 k 到边界钳住 r4。
cur = nextRowId(rows, cur, +1); assert.equal(cur, 'r4')
cur = nextRowId(rows, cur, +1); assert.equal(cur, 'r4', '底部再 k 钳住')
// 按 j(-1) → r3，再 j → r2。
cur = nextRowId(rows, cur, -1); assert.equal(cur, 'r3')
cur = nextRowId(rows, cur, -1); assert.equal(cur, 'r2')
cur = nextRowId(rows, cur, -1); assert.equal(cur, 'r1')
cur = nextRowId(rows, cur, -1); assert.equal(cur, 'r1', '顶部再 j 钳住')
// activeId 不在可见序列（被筛选掉）→ 回到首行起算。
assert.equal(nextRowId(rows, 'ghost', +1), 'r2')
assert.equal(nextRowId([], 'r1', +1), null, '空序列 → null')

// ---- sampleGanttTicks：首/跨年长标签与下一 tick 间距不重叠 ----
function minGapDays(ticks) {
  let min = Infinity
  for (let i = 1; i < ticks.length; i++) min = Math.min(min, ticks[i].leftDays - ticks[i - 1].leftDays)
  return min
}
// pxPerDay=2 → minStep 46px ≈ 23 天；首标签 YYYY-MM-DD 需 longStep ≈ 34 天（68px）。
const t1 = sampleGanttTicks('2026-01-01', '2026-03-31', 2)
assert.equal(t1[0].label, '2026-01-01', '首 tick 带年份')
assert.ok(t1[1].leftDays - t1[0].leftDays >= Math.ceil(68 / 2), '首长标签与下 tick 间距足够')
// 跨年：范围含 2027-01-01。
const t2 = sampleGanttTicks('2026-12-20', '2027-01-20', 3)
const yearIdx = t2.findIndex(t => t.date.endsWith('-01-01'))
if (yearIdx > 0) {
  assert.ok(t2[yearIdx].label === '2027-01-01')
  assert.ok(t2[yearIdx].leftDays - t2[yearIdx - 1].leftDays >= Math.ceil(68 / 3), '跨年长标签前间距足够')
}
// 短范围至少 1 tick。
assert.ok(sampleGanttTicks('2026-01-01', '2026-01-02', 2).length >= 1)

// ---- 键盘门控：BUTTON/A 必须让位（Tab 聚焦后 Space/Enter 触发原生按钮，不勾后台行）----
assert.equal(shouldHandleGlobalKbd({ key: ' ', targetTag: 'BUTTON', overlayOpen: false }), false, '聚焦按钮时 Space 不触发全局勾选')
assert.equal(shouldHandleGlobalKbd({ key: 'Enter', targetTag: 'A', overlayOpen: false }), false, '聚焦链接时 Enter 不触发全局打开')
assert.equal(shouldHandleGlobalKbd({ key: 'j', targetTag: 'TR', overlayOpen: false }), true, '聚焦普通行（TR）时 j 正常')
assert.equal(shouldHandleGlobalKbd({ key: ' ', targetTag: 'INPUT', overlayOpen: false }), false, '输入框 Space 仍让位')

// ---- 真实渲染序列：折叠父后，j 跨到下一可见根（与 flattenVisible 同序）----
const mk = (id, code, parentId = null) => ({ id, code, parentId, title: id, status: 'todo' })
const treeTasks = [mk('r1', '1'), mk('r2', '1.1', 'r1'), mk('r3', '2'), mk('r4', '2.1', 'r3')]
// 展开：r1 > r2 > r3 > r4
const expanded = flattenVisible(treeTasks).map(r => r.task.id)
assert.deepEqual(expanded, ['r1', 'r2', 'r3', 'r4'])
// 折叠 r1：r2 隐藏，序列 = r1 > r3 > r4。
const collapsed = flattenVisible(treeTasks, new Set(['r1'])).map(r => r.task.id)
assert.deepEqual(collapsed, ['r1', 'r3', 'r4'], '折叠父后代被剔除，直接跳到下一可见根')
// 从 r1 按 k(+1) 应跨到 r3（不是隐藏的 r2）。
let curK = nextRowId(collapsed, 'r1', +1)
assert.equal(curK, 'r3', '折叠后 j/k 必须作用于真实渲染序列')

// ---- 分组顺序与 groups 构造一致（按状态 key 顺序，组内 sorted 顺序）----
const groupedTasks = [
  { id: 'a', status: 'todo', code: '2' },
  { id: 'b', status: 'doing', code: '1' },
  { id: 'c', status: 'todo', code: '1' },
]
// panel 中 visible 已按 code 全局排序后再分组。
const sortedVisible = [...groupedTasks].sort((x, y) => x.code.localeCompare(y.code, undefined, { numeric: true }))
const statusOrder = ['todo', 'doing', 'done']
const groupedIds = statusOrder.flatMap(s => sortedVisible.filter(t => t.status === s).map(t => t.id))
assert.deepEqual(groupedIds, ['c', 'a', 'b'], '分组渲染序列按状态 key 与组内排序顺序排列')

// ---- renderedIds 与 DOM 序同源契约（panel.tsx 源码级，R3-02 防回归）----
// 纯函数测试只能证「折叠剔除后代」，无法证「组件把哪一行画进 DOM」。
// 这里钉住：键盘导航的 renderedIds 必须与 TaskGroup 实际渲染行序列同源同序，
// 防止将来把树模式 DOM 改回渲染 visible（折叠失效）或两边各算一套。
const panelSrc = readFileSync(join(here, '..', 'src', 'client', 'panel.tsx'), 'utf8')
assert.match(panelSrc, /const treeRows = flattenTaskTree\(visible, collapsed\)/)
assert.match(
  panelSrc,
  /const renderedIds = grouped\s*\?\s*Object\.keys\(taskStatus\)\.flatMap\(v => visible\.filter\(t => t\.status === v\)\.map\(t => t\.id\)\)\s*:\s*treeRows\.map\(r => r\.task\.id\)/,
  'renderedIds 树分支必须 == flattenVisible(visible, collapsed) 的行序列',
)
assert.match(
  panelSrc,
  /const groups = grouped\s*\?\s*Object\.keys\(taskStatus\)\.map\(value =>/,
  'DOM 分组键序必须与 renderedIds 同源（同一个 Object.keys(taskStatus)）',
)
assert.match(panelSrc, /tree=\{treeRows\}/, '树模式 DOM 行序列必须就是 treeRows（折叠剔除与渲染同序）')
assert.match(panelSrc, /data-pm-row=\{task\.id\}/, 'DOM 行锚点必须渲染真实任务 id')
assert.match(
  panelSrc,
  /const effectiveActiveId = activeId && renderedIds\.includes\(activeId\) \? activeId : \(renderedIds\[0\] \?\? null\)/,
  '高亮行只能取真实渲染序列内的 id，否则回退首行',
)
assert.match(
  panelSrc,
  /const nextId = nextRowId\(renderedIds, effectiveActiveId, action\.delta\)/,
  'j/k 必须在真实渲染序列上移动',
)

// ---- 真实 taskStatus 键序驱动分组序列（钉住 R8/R3 的真实状态枚举，不允许再凭印象写顺序）----
const tsMatch = /const taskStatus: Record<string, string> = \{([^}]*)\}/.exec(panelSrc)
assert.ok(tsMatch, 'panel.tsx 应含 taskStatus 字面量')
const realStatusOrder = [...tsMatch[1].matchAll(/^\s*(\w+):/gm)].map(m => m[1])
assert.deepEqual(realStatusOrder, ['todo', 'in_progress', 'blocked', 'done'], '真实 taskStatus 键序即为分组渲染序')
const realGrouped = [
  { id: 'a', status: 'blocked', code: '2' },
  { id: 'b', status: 'todo', code: '1' },
  { id: 'c', status: 'in_progress', code: '1' },
  { id: 'd', status: 'todo', code: '2' },
]
const realSorted = [...realGrouped].sort((x, y) => x.code.localeCompare(y.code, 'en', { numeric: true }))
const realSeq = realStatusOrder.flatMap(s => realSorted.filter(t => t.status === s).map(t => t.id))
assert.deepEqual(realSeq, ['b', 'd', 'c', 'a'], '分组序=真实状态键序（todo→in_progress→blocked→done），组内=WBS code 数字序')

// ---- Copilot aria-live/aria-busy 状态机契约（R7-01 无障碍强化）----
// bundle 正则只能证属性「存在」；这里钉住状态机：发送中 true、结束/失败 finally 必复位 false。
assert.match(
  panelSrc,
  /<div className="pm-copilot-messages" role="log" aria-live="polite" aria-busy=\{sending\}>/,
  '副驾消息区须 role=log + aria-live=polite + aria-busy 绑定 sending 状态',
)
assert.match(panelSrc, /const \[sending, setSending\] = useState\(false\)/)
assert.match(panelSrc, /setSending\(true\)/, '发起请求时必须置 busy')
assert.match(panelSrc, /\} finally \{ setSending\(false\) \}/, 'finally 复位 busy：成功/失败/抛错都不得卡在 aria-busy=true')
assert.match(panelSrc, /if \(!q \|\| disabled \|\| sending\) return/, '发送中须禁连发')

// ---- 390px 窄窗「保留文字」CSS 契约（R4-01）----
// 旧缺陷：窄窗把顶栏按钮裁成 32px 纯图标（color:transparent 文字消失）。
// 契约：窄块必须保留可读文字（overflow visible / white-space normal / width auto），且旧塌陷规则不得复活。
const css = readFileSync(join(here, '..', 'src', 'client', 'panel.css'), 'utf8')
const narrowMatch = /@container \(max-width: 540px\) \{([\s\S]*?)\n\}/.exec(css)
assert.ok(narrowMatch, '应存在窄窗容器查询块（覆盖 390px 视口）')
const narrow = narrowMatch[1]
assert.doesNotMatch(narrow, /\.pm-top-actions \.pm-button \{[^}]*color:\s*transparent/, '窄窗不得把顶栏按钮文字透明化')
assert.doesNotMatch(narrow, /\.pm-top-actions \.pm-button \{[^}]*width:\s*32px/, '窄窗不得把顶栏按钮裁成 32px 纯图标')
assert.match(narrow, /\.pm-top-actions \.pm-button \{[^}]*overflow:\s*visible/, '窄窗按钮内容不得裁切')
assert.match(narrow, /\.pm-top-actions \.pm-button \{[^}]*white-space:\s*normal/, '窄窗按钮文字保留换行不省略')
assert.match(narrow, /\.pm-top-actions \.pm-button \{[^}]*width:\s*auto/, '窄窗按钮宽度随文字自适应')
assert.match(narrow, /\.pm-top-actions \{ flex-wrap: wrap; \}/, '窄窗按钮组允许换行')
assert.match(narrow, /\.pm-top-secondary \{ display: none; \}/, '次级按钮让位，保主按钮在 390px 可读')

console.log('verify-ui-feedback OK')

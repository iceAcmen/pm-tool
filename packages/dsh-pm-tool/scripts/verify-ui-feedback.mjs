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
  classifyFeedback,
  parseActionLine,
  buildSuccessEnvelope,
  buildActionLine,
  FEEDBACK_SUCCESS_TTL_MS,
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

// ---- renderedIds 与 DOM 序同源契约（源码级，R3-02 防回归）----
// v2 落地后 TaskTable 迁至 src/client/views/tasks.tsx；以下断言钉住该文件。
const tasksSrc = readFileSync(join(here, '..', 'src', 'client', 'views', 'tasks.tsx'), 'utf8')
assert.match(tasksSrc, /const treeRows = useMemo\(\(\) => flattenVisible\(visible, collapsed\), \[visible, collapsed\]\)/)
assert.match(
  tasksSrc,
  /const renderedIds = useMemo\(\s*\(\) => grouped\s*\?\s*statusGroups\.flatMap\(g => g\.rows\.map\(t => t\.id\)\)\s*:\s*treeRows\.map\(r => r\.task\.id\)/,
  'renderedIds 树分支必须 == flattenVisible(visible, collapsed) 的行序列',
)
assert.match(
  tasksSrc,
  /const statusGroups = useMemo\(\(\) =>\s*Object\.keys\(taskStatus\)\.map\(value =>/,
  'DOM 分组键序必须与 renderedIds 同源（同一个 Object.keys(taskStatus)）',
)
assert.match(tasksSrc, /treeRows\.map\(row => row\.depth === 0 \? groupRow\(row\) : leafRow\(row\)\)/, '树模式 DOM 行序列必须就是 treeRows（折叠剔除与渲染同序）')
assert.match(tasksSrc, /data-pm-row=\{t\.id\}/, 'DOM 行锚点必须渲染真实任务 id')
assert.match(
  tasksSrc,
  /const effectiveActiveId = activeId && renderedIds\.includes\(activeId\) \? activeId : \(renderedIds\[0\] \?\? null\)/,
  '高亮行只能取真实渲染序列内的 id，否则回退首行',
)
assert.match(
  tasksSrc,
  /const nextId = nextRowId\(renderedIds, effectiveActiveId, action\.delta\)/,
  'j/k 必须在真实渲染序列上移动',
)

// ---- 真实 taskStatus 键序驱动分组序列（钉住 R8/R3 的真实状态枚举，不允许再凭印象写顺序）----
// f2109a5 起 tasks.tsx 单一来源引用 core/status.ts 的 taskStatusLabels，不再写内联字面量；
// 键序断言改从 status.js 导入，意图（todo→in_progress→blocked→done→wrapped 分组渲染序）不变。
// P2 X2：TASK_STATUSES 新增 wrapped（已收尾），分组序尾随单一来源枚举，wrapped 以中性灰徽章独立呈现（不进 done 视觉体系）。
import { taskStatusLabels } from '../lib/core/status.js'
const tsMatch = /const taskStatus = taskStatusLabels as Record<string, string>/.exec(tasksSrc)
assert.ok(tsMatch, 'tasks.tsx 应引用 taskStatusLabels（单一来源）')
const realStatusOrder = Object.keys(taskStatusLabels)
assert.deepEqual(realStatusOrder, ['todo', 'in_progress', 'blocked', 'done', 'wrapped'], '真实 taskStatus 键序即为分组渲染序')
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
// CopilotPanel 仍在 panel.tsx；bundle 正则只能证属性「存在」，这里钉住状态机：发送中 true、结束/失败 finally 必复位 false。
const panelSrc = readFileSync(join(here, '..', 'src', 'client', 'panel.tsx'), 'utf8')
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

// ---- J5 反馈分型：成功短摘要/独立详情卡/3s 自动消失/错误持久 ----
const taskSrc = readFileSync(join(here, '..', 'src', 'commands', 'task.ts'), 'utf8')
assert.match(taskSrc, /PM_SUMMARY_PREFIX/, 'task update 成功须走结构化信封短摘要')
assert.match(taskSrc, /PM_DETAIL_MARKER/, '完整字段须经 detail 标记分离，不进 toast')
assert.doesNotMatch(taskSrc, /<details><summary>完整字段<\/summary>/, '命令层不得再把 <details> 塞进成功文本')
assert.match(panelSrc, /classifyFeedback\(message\)/, 'Notice 须经 classifyFeedback 分型，不整体平铺')
assert.match(panelSrc, /pm-result-card__detail/, '完整字段须进独立可展开详情卡（ResultCard 折叠 detail）')
assert.match(panelSrc, /autoDismissMs/, '成功提示须按 TTL 自动消失')
assert.match(panelSrc, /classifyFeedback/, '错误集中判定并持久单处展示')
// 错误卡 role=alert 单处、成功 toast role=status。
assert.match(panelSrc, /role=\{isError \? 'alert' : 'status'\}/, '错误 role=alert / 成功 role=status')
// 保存完成回调关闭抽屉（TaskForm onSaved → setDrawer(undefined)），不卡「提交中」。
assert.match(panelSrc, /<TaskForm[\s\S]*?onSaved=\{\(\) => setDrawer\(undefined\)\}/, '任务抽屉保存成功须关闭（onSaved 关抽屉）')
// 摘要条本身不滚动、不出 HTML/MD；限高滚动只允许在详情 pre。
assert.doesNotMatch(css, /\.pm-result-card__summary\s*\{[^}]*overflow(-y)?:\s*auto/, '摘要条不得内部滚动')
assert.match(css, /\.pm-result-card__detail\s*\{[^}]*overflow-y:\s*auto/, '完整字段限高滚动应在详情卡内')

// ---- OKR 命令构造：strict okrCreateSchema/okrUpdateSchema 拒绝未知字段 ----
{
  // add：projectId 由命令位置参数注入，body 不得嵌 projectId/id/createdAt。
  const addIdx = panelSrc.indexOf('okr add ${projectId}')
  assert.ok(addIdx > 0, '须存在 okr add ${projectId} 命令构造')
  const addBlock = panelSrc.slice(Math.max(0, addIdx - 600), addIdx)
  assert.match(addBlock, /kind: values\.kind/, '定位到 OKR add 表单块')
  assert.doesNotMatch(addBlock, /projectId\s*:/, 'okr add body 不得嵌 projectId（位置参数注入）')
  assert.doesNotMatch(addBlock, /\bcreatedAt\s*:/, 'okr add body 不得嵌 createdAt')
  // update：patch 不嵌 id/projectId/createdAt（系统字段不可改）。
  const updIdx = panelSrc.indexOf('okr update ${record.id}')
  assert.ok(updIdx > 0, '须存在 okr update ${record.id} 命令构造')
  const updBlock = panelSrc.slice(Math.max(0, updIdx - 700), updIdx)
  assert.match(updBlock, /const patch: Record<string, unknown>/, '定位到 OKR update patch 块')
  assert.doesNotMatch(updBlock, /projectId\s*:/, 'okr update patch 不得嵌 projectId')
  assert.doesNotMatch(updBlock, /createdAt\s*:/, 'okr update patch 不得嵌 createdAt')
  // habit add/update 同样不嵌 projectId/id/createdAt。
  const hAdd = panelSrc.indexOf('habit add ${projectId}')
  assert.ok(hAdd > 0, '须存在 habit add ${projectId}')
  assert.doesNotMatch(panelSrc.slice(Math.max(0, hAdd - 400), hAdd), /projectId\s*:/, 'habit add body 不得嵌 projectId')
  const hUpd = panelSrc.indexOf('habit update ${record.id}')
  assert.ok(hUpd > 0, '须存在 habit update ${record.id}')
  assert.doesNotMatch(panelSrc.slice(Math.max(0, hUpd - 400), hUpd), /projectId\s*:|createdAt\s*:/, 'habit update patch 不得嵌 projectId/createdAt')
}

// ---- classifyFeedback 接线：成功信封短摘要/详情分离/3s TTL；错误持久；非结构化原样 ----
{
  // 成功信封：摘要进 toast（≤2 行、3s 消逝），detail 只进持久卡，action 独立。
  const env = buildSuccessEnvelope(
    ['任务 t-0001 已完成', '负责人：张三'],
    '完整字段：标题=验收页面\n状态=done\n截止=2026-10-20',
  )
  const ok = classifyFeedback(env)
  assert.equal(ok.isError, false, '成功信封不得判错')
  assert.equal(ok.structured, true, '带 [pm:summary] 应为结构化')
  assert.deepEqual(ok.summary, ['任务 t-0001 已完成', '负责人：张三'], '摘要行须去前缀原样保留')
  assert.ok(ok.detail && ok.detail.includes('完整字段'), '完整字段须进 detail，不进 summary')
  assert.equal(ok.autoDismissMs, FEEDBACK_SUCCESS_TTL_MS, '成功结构化提示 3s 自动消逝')

  // 错误：持久（autoDismissMs=null）、isError=true、单处展示。
  const err = classifyFeedback('更新失败：未找到任务 t-9999')
  assert.equal(err.isError, true, '含「失败/未找到」须判错')
  assert.equal(err.autoDismissMs, null, '错误必须持久，不得自动消逝')
  assert.equal(err.structured, false, '非信封错误走原样回退')

  // 非结构化普通文本：不吞、不改写，原样进 summary，持久不自动消逝。
  const plain = classifyFeedback('这是一行普通返回，没有任何信封标记')
  assert.equal(plain.isError, false)
  assert.equal(plain.structured, false)
  assert.deepEqual(plain.summary, ['这是一行普通返回，没有任何信封标记'])
  assert.equal(plain.autoDismissMs, null, '非结构化原样持久，不加 TTL')

  // [pm:detail] 完整字段不得泄漏进 toast 摘要。
  const mixed = classifyFeedback(buildSuccessEnvelope(['KR 已保存'], '详情：频率=每天\n备注=晚间复盘'))
  assert.doesNotMatch(mixed.summary.join('\n'), /详情：|频率=/, 'detail 内容不得出现在 summary')
}

// ---- 七类写实体成功信封联调样本（core 已产信封，UI 消费契约锁定）----
{
  // 每类：短摘要进 3s toast、完整字段进持久 detail 卡、isError=false、TTL=3000。
  const entities = [
    { name: 'milestone', summary: ['里程碑 ms-0001 已创建', '目标日期 2026-11-01'], detail: '标题=MVP 封板\n状态=planned' },
    { name: 'risk-issue', summary: ['风险 ri-0001 已登记', '中危 · 待处理'], detail: '描述=依赖方排期延迟\n应对=提前两周对齐' },
    { name: 'meeting', summary: ['会议 mt-0001 已保存', '草稿 · 3 条行动项'], detail: '议题=Q3 验收\n决议=双周评审' },
    { name: 'report', summary: ['汇报 rp-0001 已生成', '本期完成 5 项'], detail: '执行摘要=…\n阻塞=无' },
    { name: 'deliverable', summary: ['交付物 dv-0001 已提交', 'v1.0 · 待验收'], detail: '位置=dist/app.zip\n里程碑=ms-0001' },
    { name: 'okr', summary: ['OKR okr-0001 已保存', '草稿 · objective'], detail: '负责人=张三\n说明=提升交付节奏' },
    { name: 'habit', summary: ['习惯 hb-0001 已创建', '频率=每天'], detail: '目标=每日站会复盘\n备注=晚间补记' },
  ]
  for (const e of entities) {
    const fb = classifyFeedback(buildSuccessEnvelope(e.summary, e.detail))
    assert.equal(fb.isError, false, `${e.name} 成功信封不得判错`)
    assert.equal(fb.structured, true, `${e.name} 应为结构化信封`)
    assert.deepEqual(fb.summary, e.summary, `${e.name} 摘要行原样进 toast`)
    assert.ok(fb.detail && fb.detail.includes(e.detail.split('\n')[0]), `${e.name} 完整字段进 detail 卡`)
    assert.equal(fb.autoDismissMs, FEEDBACK_SUCCESS_TTL_MS, `${e.name} 成功提示 3s 消逝`)
  }
  // 七实体错误样本：持久、isError、不自动消逝、原样保留。
  const errSamples = [
    '里程碑创建失败：缺少项目ID',
    '风险保存失败：标题不合法',
    '会议保存失败：未找到项目',
    '汇报生成失败：快照不可用',
    '交付物提交失败：文件缺失',
    'OKR 保存失败：父目标不存在',
    '习惯更新失败：习惯 hb-9999 未找到',
  ]
  for (const msg of errSamples) {
    const fb = classifyFeedback(msg)
    assert.equal(fb.isError, true, `错误样本须判错：${msg}`)
    assert.equal(fb.autoDismissMs, null, `错误样本必须持久：${msg}`)
    assert.equal(fb.structured, false, `错误样本走原样回退：${msg}`)
    assert.deepEqual(fb.summary, [msg], `错误原文不得被改写：${msg}`)
  }
}

// ---- [pm:action] 整行协议：命令内含中文冒号也只切「标签：命令」分隔，命令整段保留不二次切 ----
{
  // 命令串本身含中文冒号（如速记/备注参数里的「要点：…」），只能在首个分隔处切 label。
  const line = buildActionLine('确认建会', 'meeting summarize p-0001 速记要点：评审安排 confirm')
  const action = parseActionLine(line)
  assert.ok(action, '动作行须解析成功')
  assert.equal(action.label, '确认建会')
  assert.equal(
    action.command,
    'meeting summarize p-0001 速记要点：评审安排 confirm',
    '命令内的中文冒号属于命令本体，必须整段保留，不得按首冒号二次切',
  )
  // classifyFeedback 同样整行抽出 action，正文不含动作行。
  const fb = classifyFeedback(['议题：Q3 验收安排', line].join('\n'))
  assert.ok(fb.action, '非结构化正文里的动作行也须独立抽出')
  assert.equal(fb.action.command, action.command)
  assert.ok(!fb.summary.join('\n').includes('[pm:action]'), '动作行不得混入展示正文')
  // 半角冒号分隔同样成立。
  const ascii = parseActionLine('[pm:action]Confirm:/pm report narrate p-1 confirm')
  assert.equal(ascii.label, 'Confirm')
  assert.equal(ascii.command, '/pm report narrate p-1 confirm')
}

console.log('verify-ui-feedback OK')

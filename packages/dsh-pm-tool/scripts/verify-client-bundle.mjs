/** 非GUI 真实 client bundle 激活测试：
 * vm 模拟宿主 ModuleLoader，require 仅允许 react/react-jsx-runtime（真实对象）；
 * 任何残留外部 require(如 zod)即失败。随后取 factory 返回 exports，断言 apply 为函数，
 * 并以最小 mock ctx（slots.inject/register + remote/sessions）调用 apply，
 * 断言 main 与 sidebar.panellist 两个 slot 注册被触发。 */
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import module from 'node:module'
const real = module.createRequire(import.meta.url)
// react-dom / react-dom/client 由 dsh 宿主 PLATFORM_MODULES 提供（react-grid-layout→react-draggable 顶层 require）；
// 本包不直接依赖 react-dom，故用最小 stub 镜像宿主冻结表（apply 仅注册 slot，不触发拖拽/findDOMNode），
// 避免把宿主提供的模块误判为 bundle 内泄漏。
const provide = {
  react: real('react'),
  'react/jsx-runtime': real('react/jsx-runtime'),
  'react-dom': { findDOMNode: () => null, default: { findDOMNode: () => null } },
  'react-dom/client': {},
}
const src = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
let captured = null
const win = { __ModuleLoader__: { load: ({ factory }) => { captured = factory } } }
const ctx = { window: win, console, process: { env: {} } }
vm.createContext(ctx)
vm.runInContext(src, ctx, { filename: 'client.js' })
assert.equal(typeof captured, 'function', '宿主 ModuleLoader 应收到 factory')
const mod = { exports: {} }
const exports_ = captured((id) => {
  if (!(id in provide)) throw new Error('client bundle 引用了宿主未提供的模块: ' + id)
  return provide[id]
}, mod)
const out = exports_ && typeof exports_ === 'object' ? exports_ : mod.exports
assert.equal(typeof out.apply, 'function', '应导出 apply 安装函数')
// 最小 mock ctx
const registeredNames = []
const slots = {
  inject(name, cb) { registeredNames.push(name); cb() },
  register() { return () => {} },
}
const mockCtx = {
  slots,
  remote: {},
  'remote.commands': { execute: async () => ({ kind: 'success', text: '' }) },
  sessions: { current: () => ({ on: () => {} }) },
}
out.apply(mockCtx)
assert.deepEqual(new Set(registeredNames), new Set(['main', 'sidebar.panellist']),
  'apply 应注册 main 与 sidebar.panellist')

// P0 浏览态拆分：异步块 client.editor.js / client.formula-expr.js 也必须自包含，
// 其外部 require 同样只能解析 react 系（RGL/zod/expr 已内联，不得 require 宿主答不出的名字）。
for (const chunkFile of ['client.editor.js', 'client.formula-expr.js']) {
  let capturedChunk = null
  const chunkCtx = { window: { __ModuleLoader__: { load: ({ factory }) => { capturedChunk = factory } } }, console, process: { env: {} } }
  vm.createContext(chunkCtx)
  vm.runInContext(readFileSync(new URL(`../lib/${chunkFile}`, import.meta.url), 'utf8'), chunkCtx, { filename: chunkFile })
  assert.equal(typeof capturedChunk, 'function', `${chunkFile} 应注册 factory`)
  capturedChunk((id) => {
    if (!(id in provide)) throw new Error(`${chunkFile} 引用了宿主未提供的模块: ` + id)
    return provide[id]
  }, { exports: {} })
}
// DEF-B1：从【真实构建产物 lib/client/board】加载页面同一份 registry 与 persist 链，
// 不另从 src 喂 knownTypes。断言 knownTypes 取到全部 registry key，默认布局 kept=全、skipped=0；
// 未来未知类型仅跳过且单列，已知卡原样。回归到“全跳过”时这里必须红。
const { WIDGET_REGISTRY, knownWidgetTypeSet, DEFAULT_LAYOUT } = await import('../lib/client/board/widgets.js')
const { loadDashboard } = await import('../lib/client/board/persist.js')
const keys = [...WIDGET_REGISTRY.keys()]
const known = knownWidgetTypeSet()
assert.equal(known.size, keys.length, `knownTypes 应覆盖全部 registry（got ${known.size}/${keys.length}）`)
const reported11 = ['completionHero', 'milestoneDeliverable', 'projectScale', 'objectiveProgress', 'peopleLoad',
  'riskMatrix', 'weeklyPlan', 'completionTrend', 'kpiMetric', 'recordList', 'queueCard']
for (const t of reported11) assert.ok(known.has(t), `构建产物 registry 缺 ${t}`)
const def = loadDashboard(DEFAULT_LAYOUT, known)
assert.ok(def, '默认布局应可解析')
assert.equal(def.skipped.length, 0, `默认布局不应跳过：${def.skipped.join(',')}`)
assert.equal(def.layout.widgets.length, DEFAULT_LAYOUT.widgets.length, '默认布局卡片数不得减少')

// R9：真实旧布局 11 类 fixture（与 D 临时脚本同源目标集），从 built lib 同 registry/helper/loadDashboard 归一。
// 断言目标 11 为 known subset、kept=11/skipped=0，且 i/type/config/x/y/w/h 深等（身份与坐标尺寸不被改写）。
const oldLayout11 = {
  version: 1, scope: 'global',
  widgets: [
    { i: 'old-hero', type: 'completionHero', config: { headline: '季度完成概览' }, layout: { i: 'old-hero', x: 0, y: 0, w: 4, h: 6 } },
    { i: 'old-ms', type: 'milestoneDeliverable', config: { note: '里程碑/交付物' }, layout: { i: 'old-ms', x: 4, y: 0, w: 8, h: 3 } },
    { i: 'old-scale', type: 'projectScale', config: { metric: '规模' }, layout: { i: 'old-scale', x: 4, y: 3, w: 4, h: 4 } },
    { i: 'old-obj', type: 'objectiveProgress', config: { goal: '目标进度' }, layout: { i: 'old-obj', x: 8, y: 3, w: 4, h: 4 } },
    { i: 'old-load', type: 'peopleLoad', config: { view: '负载' }, layout: { i: 'old-load', x: 4, y: 7, w: 8, h: 3 } },
    { i: 'old-risk', type: 'riskMatrix', config: { matrix: '风险矩阵' }, layout: { i: 'old-risk', x: 0, y: 10, w: 4, h: 4 } },
    { i: 'old-week', type: 'weeklyPlan', config: { week: '周计划' }, layout: { i: 'old-week', x: 4, y: 10, w: 8, h: 4 } },
    { i: 'old-trend', type: 'completionTrend', config: { chart: '完成趋势' }, layout: { i: 'old-trend', x: 0, y: 14, w: 6, h: 4 } },
    { i: 'old-kpi', type: 'kpiMetric', config: { kpi: '关键指标' }, layout: { i: 'old-kpi', x: 6, y: 14, w: 6, h: 4 } },
    { i: 'old-list', type: 'recordList', config: { list: '记录清单' }, layout: { i: 'old-list', x: 0, y: 18, w: 6, h: 5 } },
    { i: 'old-queue', type: 'queueCard', config: { queue: '补记队列' }, layout: { i: 'old-queue', x: 6, y: 18, w: 6, h: 5 } },
  ],
}
for (const w of oldLayout11.widgets) assert.ok(known.has(w.type), `旧布局 ${w.type} 不在 built registry`)
const oldLoaded = loadDashboard(oldLayout11, known)
assert.ok(oldLoaded, '旧布局应可解析')
assert.equal(oldLoaded.skipped.length, 0, `旧布局 11 类不应跳过：${oldLoaded.skipped.join(',')}`)
assert.equal(oldLoaded.layout.widgets.length, 11, '旧布局应保留 11 张卡')
const oldByI = new Map(oldLoaded.layout.widgets.map(w => [w.i, w]))
for (const src of oldLayout11.widgets) {
  const out = oldByI.get(src.i)
  assert.ok(out, `旧卡 ${src.i} 丢失`)
  assert.equal(out.type, src.type, `${src.i} type 被改`)
  assert.deepEqual(out.config, src.config, `${src.i} config 被改`)
  // clampOne 会补 minW/minH 等归一字段，故逐字段核身份与坐标尺寸，不整对象深等。
  assert.equal(out.layout.i, src.layout.i, `${src.i} layout.i 被改`)
  assert.equal(out.layout.x, src.layout.x, `${src.i} x 被改`)
  assert.equal(out.layout.y, src.layout.y, `${src.i} y 被改（非碰撞不得下沉）`)
  assert.equal(out.layout.w, src.layout.w, `${src.i} w 被改`)
  assert.equal(out.layout.h, src.layout.h, `${src.i} h 被改`)
}
// 未来未知类型：仅跳过该未知项，已知卡全保留。
const mixed = {
  version: 1, scope: 'global',
  widgets: [
    { i: 'a', type: 'completionHero', config: {}, layout: { i: 'a', x: 0, y: 0, w: 4, h: 6 } },
    { i: 'b', type: 'ghostFutureWidget', config: {}, layout: { i: 'b', x: 4, y: 0, w: 4, h: 6 } },
  ],
}
const mixedLoaded = loadDashboard(mixed, known)
assert.equal(mixedLoaded.skipped.length, 1, '未来未知类型仅跳过 1 条')
assert.equal(mixedLoaded.layout.widgets.length, 1, '已知卡保留、未知卡移除')
// 钉住构建产物中 BoardBento 的真实 knownTypes 表达式：必须调用同源 helper，
// 不得回退 Object.keys(WIDGET_REGISTRY)（Map 上恒为 []，即 DEF-B1 全跳过根因）。
const builtBento = readFileSync(new URL('../lib/client/board/BoardBento.js', import.meta.url), 'utf8')
assert.match(builtBento, /knownWidgetTypeSet\(\)/, 'BoardBento 构建产物须调用 knownWidgetTypeSet()')
assert.doesNotMatch(builtBento, /Object\.keys\(WIDGET_REGISTRY\)/, '禁止 Object.keys(WIDGET_REGISTRY)（Map 恒空）')
console.log(`[board-runtime] registry keys=${keys.length} (${keys.join(',')})`)
console.log(`[board-runtime] default kept=${def.layout.widgets.length} skipped=${def.skipped.length}`)
console.log(`[board-runtime] old-layout11 kept=${oldLoaded.layout.widgets.length} skipped=${oldLoaded.skipped.length}`)
console.log(`[board-runtime] mixed futureUnknown skipped=${mixedLoaded.skipped.length} kept=${mixedLoaded.layout.widgets.length}`)

console.log('PASS verify-client-bundle: factory 激活, apply 注册 main/sidebar, editor/formula 块自包含, 仅 react 外部依赖, board registry 运行时全保留')

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { WIDGET_REGISTRY, DEFAULT_LAYOUT, knownWidgetTypeSet } from './widgets.js'
import { resolveDashboard, parseLayout } from './persist.js'

// B4 防护锁：总览看板 + 项目概览 16 卡真实能力、个性化布局不被重置、token 基线。
// 纯静态/纯函数层（GUI 拖缩/200%/持久化旅程由 Main 采证），不替代视觉验收。

const HERE = dirname(fileURLToPath(import.meta.url))

const mkLayout = (widgets: Array<{ i: string, type: string, x: number, y: number, w: number, h: number }>) => ({
  version: 1,
  scope: 'user',
  widgets: widgets.map(w => ({
    i: w.i, type: w.type, config: {},
    layout: { i: w.i, x: w.x, y: w.y, w: w.w, h: w.h, minW: 2, minH: 2 },
  })),
})

describe('B4 · 编辑态拖缩手柄可见', () => {
  it('通用隐藏规则先于编辑态显示规则，避免同权重级联把手柄永久隐藏', () => {
    const css = readFileSync(resolve(HERE, '../panel.css'), 'utf8')
    const hidden = '.pm-rgl .react-grid-item > .react-resizable-handle { display: none; }'
    const visible = '.pm-rgl-editing .react-grid-item > .react-resizable-handle { display: block; }'
    expect(css).toContain(hidden)
    expect(css).toContain(visible)
    expect(css.indexOf(hidden)).toBeLessThan(css.indexOf(visible))
  })
})

describe('B4 · 16 卡注册与无原型占位', () => {
  it('registry 含全部 16 类，且无 disabled 占位旗标', () => {
    const types = [...WIDGET_REGISTRY.keys()]
    expect(types).toHaveLength(16)
    for (const desc of WIDGET_REGISTRY.values()) {
      expect(typeof desc.render, `${desc.type} 缺 render`).toBe('function')
      expect(desc.disabled, `${desc.type} 不应带 disabled 占位`).toBeFalsy()
    }
  })

  it('默认布局引用的类型全部可渲染（不静默丢卡、不 reset 成空）', () => {
    for (const w of DEFAULT_LAYOUT.widgets) {
      expect(WIDGET_REGISTRY.has(w.type), `默认布局 ${w.type} 未注册`).toBe(true)
    }
    expect(DEFAULT_LAYOUT.widgets.length).toBeGreaterThan(0)
  })

  it('knownWidgetTypeSet 与 registry 同源（首屏不误删旧卡）', () => {
    expect(knownWidgetTypeSet().size).toBe(16)
    for (const t of knownWidgetTypeSet()) expect(WIDGET_REGISTRY.has(t)).toBe(true)
  })
})

describe('B4 · 个性化布局优先，不重置旧 layout data', () => {
  const known = knownWidgetTypeSet()

  it('用户作用域存储优先于项目作用域，二者皆空才回落默认', () => {
    const user = mkLayout([{ i: 'u-a', type: 'recordList', x: 0, y: 0, w: 4, h: 4 }])
    const project = mkLayout([{ i: 'p-a', type: 'overdueSoon', x: 8, y: 0, w: 4, h: 4 }])
    const fb = parseLayout({ version: 1, scope: 'user', widgets: [] })!

    const userWin = resolveDashboard(user, project, fb, known)
    expect(userWin.widgets.map(x => x.layout.i)).toContain('u-a')
    expect(userWin.widgets.map(x => x.layout.i)).not.toContain('p-a')

    const fbBack = resolveDashboard(null, null, fb, known)
    expect(fbBack).toBe(fb)
  })

  it('已存布局的坐标经 sanitize 保留（在网格内不被改写成默认）', () => {
    const stored = mkLayout([{ i: 'keep', type: 'recordList', x: 5, y: 9, w: 6, h: 3 }])
    const out = resolveDashboard(stored, null, DEFAULT_LAYOUT, known)
    const keep = out.widgets.find(x => x.layout.i === 'keep')!
    expect(keep.layout).toMatchObject({ x: 5, y: 9, w: 6, h: 3 })
  })
})

describe('B4 · CSS token 基线（零硬编码色）', () => {
  const scan = (rel: string) => readFileSync(resolve(HERE, rel), 'utf8')
    // 允许 color-mix / var()；只抓裸 hex 与裸 rgb()/rgba() 字面量。
  const bareColor = /(^|[\s:;(,{])#[0-9a-fA-F]{3,8}\b|(^|[\s:;(,{])rgba?\([^)]*\)/

  it('board.css 无裸 hex / rgb 字面量', () => {
    expect(bareColor.test(scan('./board.css'))).toBe(false)
  })

  it('overview.css 无裸 hex / rgb 字面量', () => {
    expect(bareColor.test(scan('../views/overview.css'))).toBe(false)
  })
})

describe('B4 · 项目概览复用 core 纯函数，不手算健康/KPI', () => {
  it('overview.tsx 引入 derived / war-room 纯函数', () => {
    const src = readFileSync(resolve(HERE, '../views/overview.tsx'), 'utf8')
    expect(src).toMatch(/scoreFromInputs|healthFromInputs/)
    expect(src).toContain('computeKPI')
    expect(src).toContain('buildAgenda')
  })
})

describe('B4 · 里程碑·交付物时间线形态（非聚合条）', () => {
  const src = readFileSync(resolve(HERE, './widgets.tsx'), 'utf8')
  const css = readFileSync(resolve(HERE, './board.css'), 'utf8')

  it('里程碑卡按时间线渲染（dot/title/date/pill + 下一节点横幅）', () => {
    expect(src).toContain('pm-tl-row')
    expect(src).toContain('pm-tl-date')
    expect(src).toContain('pm-ms-next')
    expect(src).toContain('milestoneStatusLabels')
    expect(src).toContain('deliverableStatusLabels')
  })

  it('不再使用旧的 SegRow 聚合条形态', () => {
    expect(src).not.toContain('function SegRow')
    expect(src).not.toContain('pm-md-stack')
  })

  it('时间线样式仅走 token（color-mix/var），无裸色', () => {
    expect(css).toContain('pm-tl-row')
    expect(css).toContain('pm-ms-next')
  })
})

describe('B4 · 批次1 卡呈现契约（completionHero/projectScale/objectiveProgress/peopleLoad）', () => {
  const src = readFileSync(resolve(HERE, './widgets.tsx'), 'utf8')
  const css = readFileSync(resolve(HERE, './board.css'), 'utf8')

  it('completionHero：五态分布条含收尾(wrapped)，完成环 done/total，需要关注≤4，无主脚注', () => {
    expect(src).toContain("status === 'wrapped'")
    expect(src).toContain('收尾')
    expect(src).toContain('{done} / {total}')
    expect(src).toContain('slice(0, 4)')
    expect(src).toContain('无主任务')
  })

  it('projectScale：逐项目状态 pill + 完成率%，点击进项目，空态白话', () => {
    expect(src).toContain('pm-board-project-rate')
    expect(src).toContain('完成率')
    expect(src).toContain('pickProject')
    expect(src).toContain('暂无项目数据')
  })

  it('objectiveProgress：仅按清单完成项派生，无清单不估算，显负责人', () => {
    expect(src).toContain('deriveProgressMap')
    expect(src).toContain('checklist')
    expect(src).toContain('无清单，不估算')
    expect(src).toContain("t.assignee || '未分配'")
  })

  it('peopleLoad：同刻度 MAX 四态堆叠 + 图例 + 未分配单列', () => {
    expect(src).toContain('同刻度 MAX')
    expect(src).toContain('pm-ppl-unassigned')
    expect(src).toContain('待派工')
    expect(css).toContain('pm-ppl-unassigned')
  })
})

describe('B4 · 批次2（riskMatrix/weeklyPlan/overdueSoon/recordList）', () => {
  const src = readFileSync(resolve(HERE, './widgets.tsx'), 'utf8')

  it('riskMatrix：仅未关闭风险，归格复用 core.groupRiskMatrix，空态白话', () => {
    expect(src).toContain('groupRiskMatrix(')
    expect(src).toContain("r.type === 'risk'")
    expect(src).toContain('暂无未关闭风险')
  })

  it('weeklyPlan：未来 7 周未完成截止计数，零桶空态', () => {
    expect(src).toContain('new Array(7).fill(0)')
    expect(src).toContain('未来 7 周无待截止')
  })

  it('overdueSoon：≤8 条日期升序，chip + 标题 + 状态·负责人·日期', () => {
    expect(src).toContain('slice(0, 8)')
    expect(src).toContain('taskStatusLabels[t.status')
    expect(src).toContain('没有逾期或临期任务')
  })

  it('recordList：filter/sort 复用 query 层，空态白话，不手算', () => {
    expect(src).toContain('applyFilter(')
    expect(src).toContain('applySort(')
    expect(src).toContain('暂无符合条件的记录')
  })
})

describe('B4 · 批次3（kpiMetric/formulaCard/statusRing/completionTrend）维持真实能力', () => {
  const src = readFileSync(resolve(HERE, './widgets.tsx'), 'utf8')

  it('kpiMetric：filter 复用 + 公式求值 + 公式错误显式报错，不假值', () => {
    expect(src).toContain('evaluateFormula(')
    expect(src).toContain('公式错误')
    expect(src).toContain('applyFilter(')
  })

  it('formulaCard：空公式引导填写，错误保留信息，不手算指标', () => {
    expect(src).toContain('在右侧「公式」tab 填写公式')
    expect(src).toContain('pm-kpi-err')
  })

  it('statusRing：完成/进行/受阻/待办四环（图例四行），零任务空态，口径标注不含收尾', () => {
    expect(src).toContain('不含收尾')
    expect(src).toContain('暂无任务')
    expect(src).toContain("['待办',")
  })

  it('completionTrend：纯真实 completedDate 经 buildCompletionHistory，诚实空态，不造历史', () => {
    expect(src).toContain('buildCompletionHistory(')
    expect(src).toContain('hist.empty')
    expect(src).toContain('尚无真实完成日期数据')
  })
})

describe('B4 · 批次4（textNote/divider/queueCard）安全与真实能力', () => {
  const src = readFileSync(resolve(HERE, './widgets.tsx'), 'utf8')

  it('textNote：走安全 MarkdownView，空备注给编辑引导，无 innerHTML/注入', () => {
    expect(src).toContain('MarkdownView')
    expect(src).toContain('空备注，在右侧配置面板编辑正文')
    expect(src).not.toContain('dangerouslySetInnerHTML')
    expect(src).not.toContain('innerHTML')
  })

  it('divider：纯分隔线呈现，无假数据', () => {
    expect(src).toContain('pm-divider')
  })

  it('queueCard：由独立模块导入并注册，不在本卡内伪造队列', () => {
    expect(src).toContain("from './queue-card.js'")
    expect(src).toContain('queueCard')
  })
})


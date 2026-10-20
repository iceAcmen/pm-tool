import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// 非 P0 返修静态合同扫描：行为零回归，仅校验视图/css 的可见结构与一致性约定。
// 纯文本扫描，不渲染 React、不碰 DOM、不写盘；GUI 旅程由 Main 采证。
const HERE = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(resolve(HERE, rel), 'utf8')

const BARE_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\s*\(/
function assertNoBareColor(css: string, file: string) {
  const hits = css.split('\n').map((line, i) => ({ line: i + 1, text: line }))
    .filter(l => BARE_COLOR.test(l.text.replace(/var\([^)]*\)/g, '').replace(/color-mix\([^)]*\)/g, '')))
  expect(hits, `${file} 出现裸 hex/rgb，须改用 .pm-shell token`).toEqual([])
}

describe('非P0返修 · P1 甘特密度与今天线避让', () => {
  const tsx = read('./gantt.tsx')
  const css = read('./gantt.css')

  it('行高提升到可容纳标题+副行（ROW_H ≥ 40），条高同步', () => {
    const m = tsx.match(/const ROW_H\s*=\s*(\d+)/)
    expect(m).toBeTruthy()
    expect(Number(m![1])).toBeGreaterThanOrEqual(40)
  })

  it('身份列加宽到 250px，副行不再用最小 t-10 挤截', () => {
    expect(css).toContain('width: 250px')
    expect(css).toMatch(/pm-gantt-label-sub\s*\{[^}]*var\(--t-11\)/)
  })

  it('「今天」标签移入顶部日期轴，不压任务条', () => {
    // today-tag 渲染在 .pm-gantt-axis 内（month/ticks 之后），而非行区。
    expect(tsx).toContain('pm-gantt-today-tag')
    expect(css).toMatch(/pm-gantt-today-tag\s*\{[^}]*top:\s*23px/)
  })

  it('gantt.css 零裸色', () => assertNoBareColor(css, 'gantt.css'))
})

describe('非P0返修 · P1 OKR/习惯真空态复用 S0 EmptyState、消除双 CTA', () => {
  const okrs = read('./okrs.tsx')
  const habits = read('./habits.tsx')

  it('两视图均从 shared/ui 引入 EmptyState', () => {
    expect(okrs).toContain("import { EmptyState } from '../shared/ui/index.js'")
    expect(habits).toContain("import { EmptyState } from '../shared/ui/index.js'")
  })

  it('空态卡内不再出现第二个「新建首个」重复 CTA', () => {
    expect(okrs).not.toContain('新建首个 OKR')
    expect(habits).not.toContain('新建首个习惯')
  })

  it('页头唯一新建入口保留（onCreate）', () => {
    expect(okrs).toContain('onCreate')
    expect(habits).toContain('onCreate')
  })
})

describe('非P0返修 · P2 里程碑达成率格同权伸缩', () => {
  const css = read('./milestones.css')
  it('达成率格不再锁死 180px 被推到带外', () => {
    expect(css).not.toContain('flex: 0 0 180px')
    expect(css).toMatch(/ms-ov-rate-cell\s*\{[^}]*flex:\s*1 1 160px/)
  })
  it('milestones.css 零裸色', () => assertNoBareColor(css, 'milestones.css'))
})

describe('非P0返修 · P2 人员分布 x 轴/统计行预留空间不裁切', () => {
  const css = read('./people.css')
  it('分布体底部留白、点图预留刻度区', () => {
    expect(css).toMatch(/pp-dist-body\s*\{[^}]*padding:\s*var\(--sp-2\) var\(--sp-4\) var\(--sp-3\)/)
    expect(css).toMatch(/pp-dplot\s*\{[^}]*padding-bottom:\s*18px/)
  })
  it('people.css 零裸色', () => assertNoBareColor(css, 'people.css'))
})

describe('非P0返修 · P2 汇报快照格不竖排折行', () => {
  const tsx = read('./reports.tsx')
  const css = read('./reports.css')
  it('证据不足走非数值小号文本变体，不与大数字同阶', () => {
    expect(tsx).toContain('rp-v--text')
    expect(css).toContain('.rp-v--text')
  })
  it('快照格最小宽度 + 横滚，数值 nowrap', () => {
    expect(css).toContain('minmax(88px, 1fr)')
    expect(css).toMatch(/rp-v\s*\{[^}]*white-space:\s*nowrap/)
  })
  it('reports.css 零裸色', () => assertNoBareColor(css, 'reports.css'))
})

describe('非P0返修 · P2 交付物全部视图不渲染空状态分组', () => {
  const tsx = read('./deliverables.tsx')
  it('全部视图过滤空组，仅显式筛选空状态时才给空提示', () => {
    expect(tsx).toContain("g.items.length > 0 || filter === g.status")
    expect(tsx).not.toContain('暂无此状态交付物')
  })
})

describe('非P0返修 · P2 风险矩阵纵轴「概率」只标一次', () => {
  const tsx = read('./risk-issues.tsx')
  const css = read('./risk-issues.css')
  it('角格标概率，行内不再重复「概率」前缀', () => {
    expect(tsx).toContain('<div className="corner">概率</div>')
    expect(tsx).not.toContain('概率<small>')
    expect(css).toContain('.corner')
  })
  it('risk-issues.css 零裸色', () => assertNoBareColor(css, 'risk-issues.css'))
})

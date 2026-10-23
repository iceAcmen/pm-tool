import { appendFileSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, expect, it, vi } from 'vitest'
import { HabitsView, type HabitsViewProps } from '../../packages/dsh-pm-tool/src/client/views/habits.js'

const require = createRequire(import.meta.url)
const postcss = require(process.env.HC_POSTCSS!)
const css = postcss.parse(readFileSync(process.env.HC_CSS!, 'utf8'))
const fixture = JSON.parse(readFileSync(process.env.HC_FIXTURE!, 'utf8'))
const mounts: ReactTestRenderer[] = []
const text = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : text(c)).join('')
const hasClass = (n: ReactTestInstance, c: string) =>
  typeof n.type === 'string' && String(n.props.className ?? '').split(' ').includes(c)
const record = (id: string, value: unknown) =>
  appendFileSync(process.env.HC_OBSERVATIONS!, `${JSON.stringify({ id, value })}\n`)
function mount(props: HabitsViewProps) {
  let r!: ReactTestRenderer
  act(() => { r = create(createElement(HabitsView, props)) })
  mounts.push(r)
  return r
}
const props = (): HabitsViewProps => structuredClone(fixture.props)
const cards = (r: ReactTestRenderer) => r.root.findAll(n => hasClass(n, 'pm-habit-card'))
const badge = (card: ReactTestInstance) => card.find(n => hasClass(n, 'pm-habit-okr'))

// Narrow, declared-rule projection, not a CSS cascade/layout emulator or GUI verdict.
// Supports only unconditional old-badge scopes and their simple descendant/child rules.
function simple(n: ReactTestInstance, token: string): boolean {
  if (!/^(?:[a-z][a-z0-9-]*)?(?:\.[a-zA-Z0-9_-]+)*$/.test(token) || !token) return false
  const type = token.match(/^[a-z][a-z0-9-]*/)?.[0]
  return (!type || n.type === type) &&
    (token.match(/\.[a-zA-Z0-9_-]+/g) ?? []).every(c => hasClass(n, c.slice(1)))
}
function matches(n: ReactTestInstance, selector: string): boolean {
  const tokens = selector.trim().replace(/\s*>\s*/g, ' > ').split(/\s+/)
  if (!simple(n, tokens.pop()!)) return false
  let current: ReactTestInstance | null = n.parent
  while (tokens.length) {
    const direct = tokens.at(-1) === '>'
    if (direct) tokens.pop()
    const token = tokens.pop()!
    if (direct) {
      if (!current || !simple(current, token)) return false
    } else {
      while (current && !simple(current, token)) current = current.parent
      if (!current) return false
    }
    current = current.parent
  }
  return true
}
function rules(n: ReactTestInstance) {
  const found: { prop: string; value: string; important: boolean; specificity: number; order: number; selector: string }[] = []
  let order = 0
  css.walkRules((rule: any) => {
    order++
    if (rule.parent.type !== 'root') return
    for (const selector of rule.selectors) {
      if (!selector.includes('.pm-habit-okr') || !matches(n, selector)) continue
      rule.walkDecls((d: any) => found.push({ prop: d.prop, value: d.value, important: d.important,
        specificity: (selector.match(/\./g) ?? []).length * 100 + (selector.match(/(?:^|[ >])[a-z]/g) ?? []).length,
        order, selector }))
    }
  })
  found.sort((a, b) => Number(a.important) - Number(b.important) || a.specificity - b.specificity || a.order - b.order)
  const result: Record<string, string> = Object.fromEntries(found.map(d => [d.prop, d.value]))
  for (const [k, v] of Object.entries(n.props.style ?? {}))
    result[k.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)] = String(v)
  return result
}
function wrapMechanism(n: ReactTestInstance) {
  const own = rules(n)
  const parent = n.parent ? rules(n.parent) : {}
  return { own, overflowWrap: own['overflow-wrap'] ?? parent['overflow-wrap'],
    whiteSpace: own['white-space'] ?? parent['white-space'] ?? 'normal' }
}
const freeze = <T,>(v: T): T => {
  if (v && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v) }
  return v
}
afterEach(() => {
  for (const r of mounts.splice(0)) act(() => r.unmount())
  vi.restoreAllMocks()
})

it('HC-R01 真实旧卡 badge 最大宽度不得超过卡内容宽度（非布局）', () => {
  const r = mount(props())
  for (const c of cards(r)) {
    const style = rules(badge(c))
    record('HC-R01', { title: text(c.find(n => hasClass(n, 'pm-habit-title'))), style })
    expect(style['max-width'], '旧卡 badge max-width 缺失').toBe('100%')
  }
})
it('HC-R02 真实旧卡 badge 最小宽度允许归零（非布局）', () => {
  const r = mount(props())
  for (const c of cards(r)) {
    const style = rules(badge(c))
    record('HC-R02', style)
    expect(style['min-width'] ?? '', '旧卡 badge min-width 缺失').toMatch(/^0(?:px)?$/)
  }
})
it('HC-R03 真实旧卡连续72字符采用 anywhere 自然换行，不用隐藏或单行裁切', () => {
  const r = mount(props())
  for (const c of cards(r)) {
    const b = badge(c), mechanism = wrapMechanism(b)
    expect(text(b)).toContain(fixture.continuous)
    record('HC-R03', mechanism)
    expect(mechanism.overflowWrap, '旧卡连续串 overflow-wrap 缺失').toBe('anywhere')
    expect(mechanism.whiteSpace).not.toBe('nowrap')
    expect(mechanism.own.overflow ?? '').not.toMatch(/hidden|clip/)
    expect(mechanism.own['text-overflow']).not.toBe('ellipsis')
  }
})
it('HC-R04 旧卡原 Link2 不压缩；若存在文本 flex 容器须可收缩并继承换行', () => {
  const r = mount(props())
  for (const c of cards(r)) {
    const b = badge(c), icon = b.findByType('svg'), style = rules(icon)
    record('HC-R04', { icon: style, textChildren: b.children.filter(c => typeof c !== 'string').map(c => c.type) })
    expect(style['flex-shrink'] === '0' || style.flex === 'none' || icon.props.style?.flexShrink === 0,
      '旧卡装饰图标没有不压缩约束').toBe(true)
    for (const child of b.children.filter((c): c is ReactTestInstance =>
      typeof c !== 'string' && typeof c.type === 'string' && c.type !== 'svg')) {
      expect(rules(child)['min-width'] ?? '', '必要文本 flex 容器须允许收缩').toMatch(/^0(?:px)?$/)
      expect(wrapMechanism(child).overflowWrap).toBe('anywhere')
    }
  }
})

it.each(fixture.props.habits.map((h: any) => [h.id, h.title]))('HC-C01 原长目标卡 %s 保全文/图标/声明，不新增目标编号', (id, title) => {
  const r = mount(props()), c = cards(r).find(c => text(c.find(n => hasClass(n, 'pm-habit-title'))) === title)!
  expect(c).toBeTruthy()
  const b = badge(c)
  expect(text(b)).toBe(`关联 OKR：${fixture.longTitle}（只展示，不参与裁决）`)
  expect(text(b)).not.toContain(fixture.okrId)
  expect(b.findByType('svg').props).toMatchObject({ width: 11, height: 11 })
  expect(b.findAllByType('a')).toHaveLength(0)
  expect(b.findAllByType('button')).toHaveLength(0)
  expect(b.findAll(n => n.props.dangerouslySetInnerHTML !== undefined)).toHaveLength(0)
  const icon = b.findByType('svg')
  record(`HC-C01-${id}`, { text: text(b), svg: { width: icon.props.width, height: icon.props.height,
    viewBox: icon.props.viewBox, className: icon.props.className } })
})
it('HC-C02 短目标保持原 badge 外形/全文/标题与控制', () => {
  const p = props(); p.okrs![0].title = 'F5目标'
  const r = mount({ ...p, onEdit: vi.fn() })
  for (const c of cards(r)) {
    expect(text(badge(c))).toBe('关联 OKR：F5目标（只展示，不参与裁决）')
    expect(rules(badge(c))).toMatchObject({ display: 'inline-flex', width: 'fit-content',
      padding: '4px 8px', border: '1px dashed var(--pm-line)', 'border-radius': '7px' })
    expect(c.findAllByType('button').map(text)).toEqual(['编辑', '今天打卡', '回填昨天（2 天窗内）', '回填前天（2 天窗内）'])
  }
})
it.each(['missing', 'none'])('HC-C03 旧卡 %s 保持原 ID 回退或整行省略', kind => {
  const p = props(); p.habits = [p.habits![0]]
  if (kind === 'missing') p.habits[0].okrId = 'okr-original-missing'
  else delete p.habits[0].okrId
  const c = cards(mount(p))[0]
  if (kind === 'missing') expect(text(badge(c))).toBe('关联 OKR：okr-original-missing（只展示，不参与裁决）')
  else expect(c.findAll(n => hasClass(n, 'pm-habit-okr'))).toHaveLength(0)
})
it('HC-C04 新建议行保原四条自身内容/状态/局部换行与控件，仅局部控制不重验 GM01 全守卫', () => {
  const p = props(), r = mount(p)
  for (const s of p.inbox!) {
    const item = r.root.findAll(n => hasClass(n, 'pm-habit-suggestion'))
      .find(n => text(n.find(c => hasClass(c, 'pm-habit-suggestion-id'))) === s.id)!
    expect(item.props['data-state']).toBe(s.status)
    expect(text(item)).toContain(s.rationale)
    const rows = item.findAll(n => hasClass(n, 'pm-habit-suggestion-okr'))
    if (s.okrId) {
      expect(text(rows[0])).toBe(s.okrId === fixture.okrId
        ? `关联 OKR：${fixture.longTitle}（${s.okrId}）` : `关联 OKR：${s.okrId}`)
      expect(rows[0].props.style).toEqual({ minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere' })
    } else expect(rows).toHaveLength(0)
    expect(item.findAllByType('button').map(text)).toEqual(s.status === 'pending' ? ['采纳并建习惯草稿', '忽略'] : [])
  }
})
it('HC-C05 合法旧日期组件反例：原历史月份展开/收起、补记与字段不改，零命令', () => {
  const run = vi.fn(async () => true), onSaved = vi.fn()
  const p = props()
  p.habits = [{ ...p.habits![0], checkIns: [
    { at: '2026-01-02', backfilled: false, note: '原历史备注甲' },
    { at: '2026-01-03', backfilled: true, note: '原历史备注乙' },
    { at: '2026-02-04', backfilled: false, note: '另一原月份' },
  ], streak: { current: 0, longest: 7, totalDays: 12 }, goal: '原目标字段', frequency: '每日', notes: '' }]
  const before = JSON.stringify(p)
  freeze(p)
  const r = mount({ ...p, run, onSaved }), c = cards(r)[0]
  const toggle = c.findAllByType('button').find(n => text(n).includes('2026 年 1 月'))!
  expect(toggle.props['aria-expanded']).toBe(false)
  act(() => toggle.props.onClick())
  expect(toggle.props['aria-expanded']).toBe(true)
  expect(text(c)).toContain('原历史备注甲')
  expect(text(c)).toContain('原历史备注乙')
  expect(text(c)).toContain('补记')
  act(() => toggle.props.onClick())
  expect(toggle.props['aria-expanded']).toBe(false)
  expect(text(c)).toContain('历史最长 7 天 · 累计 12 天')
  expect(JSON.stringify(p)).toBe(before)
  expect(run).not.toHaveBeenCalled(); expect(onSaved).not.toHaveBeenCalled()
})
it('HC-C06 原编辑传全量对象与原三打卡命令/true才刷新接口保持（组件非落盘）', async () => {
  const run = vi.fn(async () => true), onSaved = vi.fn(), onEdit = vi.fn()
  const p = props(), r = mount({ ...p, run, onSaved, onEdit })
  const c = cards(r)[0], h = p.habits!.find(h => h.title === text(c.find(n => hasClass(n, 'pm-habit-title'))))!
  const buttons = c.findAllByType('button')
  act(() => buttons[0].props.onClick())
  expect(onEdit).toHaveBeenCalledWith(h)
  await act(async () => buttons[1].props.onClick())
  expect(run).toHaveBeenLastCalledWith(`habit checkin ${h.id}`)
  const localDay = (offset: number) => {
    const d = new Date(); d.setDate(d.getDate() - offset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  run.mockResolvedValueOnce(false)
  await act(async () => buttons[2].props.onClick())
  expect(run).toHaveBeenLastCalledWith(`habit checkin ${h.id} ${localDay(1)}`)
  await act(async () => buttons[3].props.onClick())
  expect(run).toHaveBeenLastCalledWith(`habit checkin ${h.id} ${localDay(2)}`)
  expect(run).toHaveBeenCalledTimes(3); expect(onSaved).toHaveBeenCalledTimes(2)
})
it('HC-C07 原 raw props 重排/标题刷新/重挂不改数据、不自动命令；无 run 禁用打卡', () => {
  const run = vi.fn(async () => true), onSaved = vi.fn()
  const p = props(), before = JSON.stringify(p); freeze(p)
  const r = mount({ ...p, run, onSaved })
  act(() => r.update(createElement(HabitsView, { ...p, run, onSaved, habits: [...p.habits!].reverse() })))
  act(() => r.update(createElement(HabitsView, { ...p, run, onSaved,
    okrs: [{ ...p.okrs![0], title: '当前原目标标题刷新' }] })))
  for (const c of cards(r)) expect(text(badge(c))).toBe('关联 OKR：当前原目标标题刷新（只展示，不参与裁决）')
  act(() => r.unmount())
  const next = mount(p)
  expect(cards(next)[0].findAllByType('button').filter(n => text(n) !== '编辑').every(n => n.props.disabled)).toBe(true)
  expect(JSON.stringify(p)).toBe(before)
  expect(run).not.toHaveBeenCalled(); expect(onSaved).not.toHaveBeenCalled()
})

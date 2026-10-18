import { describe, it, expect } from 'vitest'
import { buildNavModel, buildNarrowSwitcher, filterNavGroups, toggleCollapsed, VIEW_LABELS, NARROW_VIEW_ORDER } from './nav.js'

// P2-1：左导航纯模型——分组结构 / 计数挂载 / 无项目置灰 / 搜索过滤 / 折叠切换。

const counts = { tasks: 22, milestones: 1, riskIssues: 3, meetings: 12, reports: 8, deliverables: 5, okrs: 2, habits: 1 }

describe('buildNavModel：分组顺序与计数挂载', () => {
  const groups = buildNavModel(counts, { projectName: '官网改版', hasProject: true })

  it('五组：跨项目 / 当前项目 / 计划与排期 / 协作与记录 / 目标与习惯，后三组可折叠', () => {
    expect(groups.map(g => g.id)).toEqual(['cross', 'project', 'plan', 'records', 'growth'])
    expect(groups.map(g => g.collapsible)).toEqual([false, false, true, true, true])
    expect(groups[1].title).toBe('当前项目 · 官网改版')
  })

  it('计数挂到对应条目，无计数条目不显示徽标', () => {
    const byKey = (gid: string, key: string) => groups.find(g => g.id === gid)!.items.find(i => i.key === key)!
    expect(byKey('plan', 'tasks').count).toBe(22)
    expect(byKey('plan', 'milestones').count).toBe(1)
    expect(byKey('plan', 'risk-issues').count).toBe(3)
    expect(byKey('records', 'meetings').count).toBe(12)
    expect(byKey('records', 'reports').count).toBe(8)
    expect(byKey('records', 'deliverables').count).toBe(5)
    expect(byKey('growth', 'okrs').count).toBe(2)
    expect(byKey('growth', 'habits').count).toBe(1)
    expect(byKey('plan', 'gantt').count).toBeUndefined()
    expect(byKey('plan', 'people').count).toBeUndefined()
  })

  it('有项目时所有项目条目可用，总览看板始终可用', () => {
    const flat = groups.flatMap(g => g.items)
    expect(flat.every(i => !i.disabled)).toBe(true)
    expect(groups[0].items[0].key).toBe('dash')
  })

  it('目标与习惯组含 okrs/habits，标签与窄屏 ViewSwitcher 同源', () => {
    const growth = groups.find(g => g.id === 'growth')!
    expect(growth.items.map(i => i.key)).toEqual(['okrs', 'habits'])
    expect(growth.items.find(i => i.key === 'okrs')!.label).toBe('目标（OKR）')
    expect(growth.items.find(i => i.key === 'habits')!.label).toBe('习惯')
  })
})

describe('buildNavModel：无项目态置灰', () => {
  const groups = buildNavModel({}, { hasProject: false })

  it('当前项目组标题退回「当前项目」，项目概览与两个项目组全部 disabled', () => {
    expect(groups[1].title).toBe('当前项目')
    const projectEntries = groups.slice(1).flatMap(g => g.items)
    expect(projectEntries.every(i => i.disabled)).toBe(true)
    // 跨项目总览看板不受影响
    expect(groups[0].items[0].disabled).toBeUndefined()
  })
})

describe('filterNavGroups：标签/关键词子串过滤，空组隐藏', () => {
  const groups = buildNavModel(counts, { projectName: '官网改版', hasProject: true })

  it('空查询原样返回全部分组', () => {
    expect(filterNavGroups(groups, '')).toHaveLength(5)
    expect(filterNavGroups(groups, '   ')).toHaveLength(5)
  })

  it('按中文标签子串命中：「任务」只留全部任务', () => {
    const out = filterNavGroups(groups, '任务')
    expect(out.map(g => g.id)).toEqual(['plan'])
    expect(out[0].items.map(i => i.key)).toEqual(['tasks'])
  })

  it('按关键词兜底命中：gantt → 甘特排期；risk → 风险与问题', () => {
    expect(filterNavGroups(groups, 'gantt')[0]?.items.map(i => i.key)).toEqual(['gantt'])
    expect(filterNavGroups(groups, 'risk')[0]?.items.map(i => i.key)).toEqual(['risk-issues'])
  })

  it('大小写不敏感；无命中返回空数组', () => {
    expect(filterNavGroups(groups, 'GANTT')[0]?.items[0]?.key).toBe('gantt')
    expect(filterNavGroups(groups, '不存在的词条')).toEqual([])
  })
})

describe('toggleCollapsed：纯切换返回新集合', () => {
  it('未折叠 → 加入；已折叠 → 移除；原集合不被改', () => {
    const base = new Set(['plan'])
    const added = toggleCollapsed(base, 'records')
    expect([...added]).toEqual(['plan', 'records'])
    const removed = toggleCollapsed(added, 'plan')
    expect([...removed]).toEqual(['records'])
    expect([...base]).toEqual(['plan'])
  })
})

describe('VIEW_LABELS：面包屑与导航同源', () => {
  it('全部视图都有中文标签（含 okrs/habits）', () => {
    expect(Object.keys(VIEW_LABELS)).toHaveLength(11)
    expect(VIEW_LABELS['risk-issues']).toBe('风险与问题')
    expect(VIEW_LABELS['deliverables']).toBe('交付物')
    expect(VIEW_LABELS['okrs']).toBe('目标（OKR）')
    expect(VIEW_LABELS['habits']).toBe('习惯')
  })
})

describe('buildNarrowSwitcher：窄屏与桌面模型同源，新增视图不漏入', () => {
  it('VIEW_LABELS 里每个视图都必须出现在窄屏顺序（新增目标漏入即失败）', () => {
    for (const key of Object.keys(VIEW_LABELS)) {
      expect(NARROW_VIEW_ORDER as readonly string[]).toContain(key)
    }
  })

  it('窄屏项按 NARROW_VIEW_ORDER 排列，dashboard 居首，标签/计数取自导航模型', () => {
    const items = buildNarrowSwitcher(counts)
    expect(items.map(i => i.key)).toEqual([...NARROW_VIEW_ORDER])
    expect(items[0]).toMatchObject({ key: 'dashboard', label: '总览看板' })
    const byKey = Object.fromEntries(items.map(i => [i.key, i]))
    expect(byKey['tasks'].label).toBe('全部任务')
    expect(byKey['tasks'].count).toBe(22)
    expect(byKey['okrs'].label).toBe('目标（OKR）')
    expect(byKey['okrs'].count).toBe(2)
    expect(byKey['habits'].count).toBe(1)
    expect(byKey['gantt'].count).toBeUndefined()
  })

  it('模型里存在但顺序未列的目标兜底追加在后，不丢项', () => {
    const items = buildNarrowSwitcher(counts)
    const modelKeys = buildNavModel(counts, { hasProject: true })
      .flatMap(g => g.items).map(i => i.key).filter(k => k !== 'dash')
    for (const k of modelKeys) {
      expect(items.map(i => i.key)).toContain(k)
    }
  })
})

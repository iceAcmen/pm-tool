/**
 * 可配置看板渲染：浏览态静态栅格，编辑态 RGL 拖拽/resize + 卡片库抽屉 + 右侧配置面板。
 * 三作用域 global/project/user；持久化走 persist.ts（localStorage，三层回退）。
 */
import React, { useMemo, useRef, useState } from 'react'
import RGL, { WidthProvider, type Layout } from 'react-grid-layout'
import type { Snapshot } from '../panel.js'
import { GRID, type DashboardLayout, type WidgetActions, type WidgetConfig, type WidgetEntity, type WidgetInstance, type WidgetScope, type FilterOp } from './types.js'
import { WIDGET_REGISTRY, DRAWER_GROUPS, DEFAULT_LAYOUT, FIELD_WHITELIST, todayIso, rawListFor } from './widgets.js'
import { CrossProjectPeople } from '../panel.js'
import { resolveLayout, saveLayout, resetScope, parseLayout } from './persist.js'
import { selectEntity, applyFilter } from './query.js'
import { evaluateFormula } from './formula.js'

const GridLayout = WidthProvider(RGL)

let idSeq = 100
function nextId(): string { return `w-user-${++idSeq}` }

export function BoardBento({ data, actions }: { data: Snapshot, actions: WidgetActions }) {
  const [resolved] = useState<DashboardLayout>(() => resolveLayout(DEFAULT_LAYOUT))
  const [layout, setLayout] = useState<DashboardLayout>(resolved)
  const [scope, setScope] = useState<WidgetScope>('user')
  const [editing, setEditing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DashboardLayout | null>(null)
  const [query, setQuery] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const live = draft ?? layout

  const rglLayout: Layout[] = useMemo(
    () => live.widgets.map(w => ({
      i: w.layout.i, x: w.layout.x, y: w.layout.y, w: w.layout.w, h: w.layout.h,
      minW: w.layout.minW, minH: w.layout.minH, static: !editing,
    })),
    [live, editing],
  )

  const startEdit = () => { setDraft(structuredClone(layout)); setEditing(true); setSelectedId(null); setValidationError(null) }
  const saveEdit = () => {
    if (!draft) return
    // zod 保存闸门：任一卡片 configSchema.parse 失败则定位字段、提示且不写入。
    const bad: string[] = []
    for (const w of draft.widgets) {
      const desc = WIDGET_REGISTRY.get(w.type)
      const s = desc?.configSchema
      if (!s) continue
      const r = s.safeParse(w.config)
      if (!r.success) bad.push(`${desc?.name ?? w.type}: ${r.error.issues.map(i => i.path.join('.') || '(root)').join(',')}`)
    }
    if (bad.length) {
      setValidationError(`配置校验未通过，未保存：\n${bad.join('；')}`)
      return
    }
    const final = { ...draft, scope, version: 1 }
    saveLayout(scope, final)
    setLayout(final)
    setValidationError(null)
    setDraft(null); setEditing(false); setSelectedId(null); setDrawerOpen(false)
  }
  const cancelEdit = () => { setDraft(structuredClone(resolveLayout(DEFAULT_LAYOUT))); setLayout(resolveLayout(DEFAULT_LAYOUT)); setValidationError(null); setDraft(null); setEditing(false); setSelectedId(null) }
  const resetDefault = () => { resetScope(scope); setDraft(structuredClone(DEFAULT_LAYOUT)) }
  const fileRef = useRef<HTMLInputElement>(null)
  const exportLayout = () => {
    if (!draft) return
    const blob = new Blob([JSON.stringify({ ...draft, scope }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dashboard-${scope}.json`; a.click()
    URL.revokeObjectURL(url)
  }
  const importLayout = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const layout = parseLayout(parsed)
        if (!layout) { setValidationError('导入失败：布局结构不合法或版本不受支持'); return }
        // 逐 widget：未知 type 拒绝；有 configSchema 则 safeParse
        for (let i = 0; i < layout.widgets.length; i++) {
          const w = layout.widgets[i]
          const desc = WIDGET_REGISTRY.get(w.type)
          if (!desc) { setValidationError(`导入失败：widgets[${i}].type=${w.type} 未知`); return }
          if (desc.configSchema) {
            const r = desc.configSchema.safeParse(w.config ?? {})
            if (!r.success) { setValidationError(`导入失败：widgets[${i}](${desc.name}) 配置不合规`); return }
          }
        }
        setDraft(layout)
      } catch {
        setValidationError('导入失败：JSON 解析错误')
      }
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  const addWidget = (type: string) => {
    if (!draft) return
    const desc = WIDGET_REGISTRY.get(type)
    if (!desc || desc.disabled) return
    // 已存在则不重复加（卡片库显示“已添加”）。
    if (draft.widgets.some(w => w.type === type)) return
    const i = nextId()
    const y = Math.max(0, ...draft.widgets.map(w => w.layout.y + w.layout.h))
    const inst: WidgetInstance = {
      i, type, config: { ...desc.defaultConfig },
      layout: { i, x: 0, y, w: desc.defaultW, h: desc.defaultH, minW: desc.minW, minH: desc.minH },
    }
    setDraft({ ...draft, widgets: [...draft.widgets, inst] })
    setSelectedId(i)
  }

  const removeWidget = (i: string) => {
    if (!draft) return
    setDraft({ ...draft, widgets: draft.widgets.filter(w => w.layout.i !== i) })
    if (selectedId === i) setSelectedId(null)
  }

  const updateConfig = (i: string, patch: Partial<WidgetConfig>) => {
    if (!draft) return
    setDraft({
      ...draft,
      widgets: draft.widgets.map(w => w.layout.i === i ? { ...w, config: { ...w.config, ...patch } } : w),
    })
  }

  const selected = selectedId ? live.widgets.find(w => w.layout.i === selectedId) : null

  const totalProjects = data.projects.length
  const activeProjects = data.projects.filter(p => p.status === 'active').length
  const openRisks = data.riskIssues.filter(r => r.status !== 'closed').length
  const doneTasks = data.tasks.filter(t => t.status === 'done').length
  const rate = data.tasks.length ? Math.round(doneTasks / data.tasks.length * 100) : 0

  return <div className="pm-bento">
    <div className="pm-bento-head">
      <div className="pm-bento-stats">
        <span>项目总数 <b>{totalProjects}</b>（{activeProjects} 进行中）</span>
        <span>任务完成率 <b>{rate}%</b></span>
        <span>未关闭风险 <b>{openRisks}</b></span>
      </div>
      <div className="pm-bento-tools">
        {editing
          ? <>
              <select className="pm-bento-scope" value={scope} onChange={e => setScope(e.target.value as WidgetScope)} title="保存到哪个作用域">
                <option value="user">我的（个人）</option>
                <option value="project">项目（团队模板）</option>
                <option value="global">内置默认</option>
              </select>
              <button type="button" className="pm-bento-toolbtn" onClick={() => setDrawerOpen(o => !o)}>＋ 卡片库</button>
              <button type="button" className="pm-bento-toolbtn" onClick={exportLayout}>导出</button>
              <button type="button" className="pm-bento-toolbtn" onClick={() => fileRef.current?.click()}>导入</button>
              <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importLayout}/>
              <button type="button" className="pm-bento-toolbtn" onClick={resetDefault}>恢复默认</button>
              <button type="button" className="pm-bento-toolbtn" onClick={cancelEdit}>取消</button>
              <button type="button" className="pm-button-primary" onClick={saveEdit}>保存</button>
            </>
          : <button type="button" className="pm-bento-toolbtn" onClick={startEdit}>布局编辑</button>}
      </div>
    </div>

    {validationError && (
      <div className="pm-bento-validation" role="alert">
        <span>{validationError}</span>
        <button type="button" className="pm-bento-validation-x" onClick={() => setValidationError(null)} aria-label="关闭">×</button>
      </div>
    )}

    <div className={`pm-bento-body ${editing ? 'pm-bento-editing' : ''}`}>
      {editing && drawerOpen && <CardDrawer live={live} query={query} setQuery={setQuery} onAdd={addWidget}/>}
      <div className={`pm-bento-grid ${editing ? 'pm-rgl-editing' : ''}`}
        onDragOver={editing ? (e) => e.preventDefault() : undefined}
        onDrop={editing ? (e) => {
          e.preventDefault()
          const t = e.dataTransfer.getData('widget-type')
          if (t) addWidget(t)
        } : undefined}>
        <GridLayout
          className="pm-rgl"
          layout={rglLayout}
          cols={GRID.cols}
          rowHeight={GRID.rowHeight}
          margin={GRID.margin}
          isDraggable={editing}
          isResizable={editing}
          compactType="vertical"
          onLayoutChange={(next: Layout[]) => {
            if (!editing || !draft) return
            setDraft({
              ...draft,
              widgets: draft.widgets.map(w => {
                const l = next.find(n => n.i === w.layout.i)
                return l ? { ...w, layout: { ...w.layout, x: l.x, y: l.y, w: l.w, h: l.h } } : w
              }),
            })
          }}
        >
          {live.widgets.map(w => {
            const desc = WIDGET_REGISTRY.get(w.type)
            if (!desc) return <div key={w.layout.i}/>
            const sel = editing && selectedId === w.layout.i
            return <div key={w.layout.i}
              className={`pm-rgl-item-wrap ${sel ? 'pm-rgl-sel' : ''}`}
              onClick={(e) => { e.stopPropagation(); if (editing) setSelectedId(w.layout.i) }}>
              {editing && <button type="button" className="pm-rgl-x" title="移除卡片" onClick={(e) => { e.stopPropagation(); removeWidget(w.layout.i) }}>×</button>}
              {desc.render({ data, config: w.config, actions, isEditing: editing })}
            </div>
          })}
        </GridLayout>
      </div>
      {editing && selected && <ConfigPanel inst={selected} data={data} onPatch={(p) => updateConfig(selected.layout.i, p)} onClose={() => setSelectedId(null)}/>}
    </div>

    <div aria-hidden style={{ display: 'none' }}>
      <CrossProjectPeople data={data} onPickProject={actions.pickProject} onOpenRecord={actions.openRecord}/>
    </div>
  </div>
}

/* ---------- 卡片库抽屉 ---------- */
function CardDrawer({ live, query, setQuery, onAdd }: {
  live: DashboardLayout, query: string, setQuery: (s: string) => void, onAdd: (type: string) => void
}) {
  const added = new Set(live.widgets.map(w => w.type))
  const items = [...WIDGET_REGISTRY.values()].filter(d =>
    (d.name.toLowerCase().includes(query.toLowerCase()) || d.type.includes(query.toLowerCase())))
  return <aside className="pm-drawer">
    <h3>卡片库</h3>
    <input className="pm-drawer-search" placeholder="搜索卡片…" value={query} onChange={e => setQuery(e.target.value)}/>
    {DRAWER_GROUPS.map(g => {
      const list = items.filter(d => d.category === g.key)
      if (!list.length) return null
      return <div key={g.key}>
        <div className="pm-drawer-grp">{g.label}</div>
        {list.map(d => {
          const has = added.has(d.type)
          return <button key={d.type} type="button"
            className={`pm-drawer-item ${has ? 'added' : ''}`}
            disabled={has || d.disabled}
            draggable={!has && !d.disabled}
            onDragStart={(e) => e.dataTransfer.setData('widget-type', d.type)}
            onClick={() => onAdd(d.type)}>
            <i className="pm-drawer-ic"/>
            <span>{d.name}</span>
            <span className="pm-drawer-plus">{has ? '已添加' : d.disabled ? '③' : '＋'}</span>
          </button>
        })}
      </div>
    })}
    <div className="pm-drawer-tip">点 ＋ 添加到看板；选中卡片后在右侧配置。</div>
  </aside>
}

/* ---------- 配置面板（无公式 tab） ---------- */
function ConfigPanel({ inst, data, onPatch, onClose }: {
  inst: WidgetInstance, data: Snapshot, onPatch: (p: Partial<WidgetConfig>) => void, onClose: () => void
}) {
  const desc = WIDGET_REGISTRY.get(inst.type)!
  const cfg = inst.config
  const [tab, setTab] = useState<'data' | 'filter' | 'sort' | 'formula' | 'show' | 'look'>('data')
  const hasEntity = desc.requiredSources.length > 0 && desc.type !== 'divider'
  const isFormula = desc.type === 'formulaCard' || desc.type === 'kpiMetric'
  const whitelist = hasEntity ? FIELD_WHITELIST[cfg.entity ?? 'tasks'] ?? [] : []
  const tabs = (['data', 'filter', 'sort', ...(isFormula ? ['formula' as const] : []), 'show', 'look'] as const)
  const [trial, setTrial] = useState<string>('')
  const doTrial = () => {
    const entity = (cfg.entity ?? 'tasks') as WidgetEntity
    const rows = selectEntity(data, entity)
    const rawList = rawListFor(data, entity)
    const filtered = applyFilter(data, entity, rows, rawList, cfg.projectScope ?? 'all', cfg.filters)
    const r = evaluateFormula(String(cfg.formula ?? ''), { rows: filtered as unknown as Record<string, unknown>[], today: todayIso() })
    setTrial(r.ok ? `= ${String(r.value)}` : `✗ ${r.error.message}`)
  }
  return <aside className="pm-cfg">
    <h3>配置 · {desc.name}<button type="button" className="pm-cfg-x" onClick={onClose}>×</button></h3>
    <div className="pm-cfg-tabs">
      {tabs.map(t =>
        <span key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
          {{ data: '数据源', filter: '筛选', sort: '排序', formula: '公式', show: '显示元素', look: '外观' }[t]}
        </span>)}
    </div>

    {tab === 'formula' && isFormula && <div className="pm-cfg-fld">
      <label>公式（≤200 字，rows=筛选后行）</label>
      <textarea className="pm-cfg-sel" rows={3} maxLength={200} value={String(cfg.formula ?? '')}
        onChange={e => onPatch({ formula: e.target.value })}/>
      <div className="pm-cfg-help">变量：rows、today；函数：count/sum/avg/rowMin/rowMax/countIf/pct</div>
      <button type="button" className="pm-cfg-add" onClick={doTrial}>试算</button>
      {trial && <div className="pm-cfg-trial">{trial}</div>}
    </div>}

    {tab === 'data' && <>
      {hasEntity && <div className="pm-cfg-fld">
        <label>数据源 · 实体</label>
        <select className="pm-cfg-sel" value={cfg.entity ?? 'tasks'} onChange={e => onPatch({ entity: e.target.value as WidgetConfig['entity'] })}>
          {(['tasks', 'milestones', 'riskIssues', 'deliverables', 'meetings', 'reports', 'projects'] as const).map(en =>
            <option key={en} value={en}>{({ tasks: '任务', milestones: '里程碑', riskIssues: '风险/问题', deliverables: '交付物', meetings: '会议', reports: '汇报', projects: '项目' } as Record<string,string>)[en]}</option>)}
        </select>
      </div>}
      <div className="pm-cfg-fld">
        <label>项目范围</label>
        <select className="pm-cfg-sel" value={cfg.projectScope ?? 'all'} onChange={e => onPatch({ projectScope: e.target.value })}>
          <option value="all">全部项目</option>
          {data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
    </>}

    {tab === 'filter' && <div className="pm-cfg-fld">
      <label>筛选条件（{cfg.filters?.length ?? 0}）</label>
      {(cfg.filters ?? []).map((f, i) => (
        <div key={i} className="pm-cfg-rule">
          <select value={f.field} onChange={e => { const fs = [...(cfg.filters ?? [])]; fs[i] = { ...f, field: e.target.value }; onPatch({ filters: fs }) }}>
            {whitelist.map(fd => <option key={fd} value={fd}>{fd}</option>)}
          </select>
          <select value={f.op} onChange={e => { const fs = [...(cfg.filters ?? [])]; fs[i] = { ...f, op: e.target.value as FilterOp }; onPatch({ filters: fs }) }}>
            {['eq', 'ne', 'in', 'gte', 'lte', 'contains', 'isEmpty'].map(op => <option key={op} value={op}>{op}</option>)}
          </select>
          <input value={f.value} onChange={e => { const fs = [...(cfg.filters ?? [])]; fs[i] = { ...f, value: e.target.value }; onPatch({ filters: fs }) }}/>
          <button type="button" onClick={() => onPatch({ filters: (cfg.filters ?? []).filter((_, j) => j !== i) })}>✕</button>
        </div>
      ))}
      <button type="button" className="pm-cfg-add" onClick={() => onPatch({ filters: [...(cfg.filters ?? []), { field: whitelist[0] ?? 'status', op: 'eq', value: '' }] })}>＋ 添加条件</button>
    </div>}

    {tab === 'sort' && <div className="pm-cfg-fld">
      <label>排序字段</label>
      <select className="pm-cfg-sel" value={cfg.sort?.field ?? 'date'} onChange={e => onPatch({ sort: { field: e.target.value, dir: cfg.sort?.dir ?? 'asc' } })}>
        <option value="date">日期</option>
        <option value="title">标题</option>
        <option value="status">状态</option>
      </select>
      <label>方向</label>
      <select className="pm-cfg-sel" value={cfg.sort?.dir ?? 'asc'} onChange={e => onPatch({ sort: { field: cfg.sort?.field ?? 'date', dir: e.target.value as 'asc' | 'desc' } })}>
        <option value="asc">升序</option>
        <option value="desc">降序</option>
      </select>
    </div>}

    {tab === 'show' && <div className="pm-cfg-fld">
      {[['pill', '状态标签'], ['date', '日期'], ['owner', '负责人']].map(([k, label]) => {
        const on = cfg.show?.[k] !== false
        return <div key={k} className="pm-cfg-chk">
          <span>{label}</span>
          <button type="button" className={`pm-cfg-sw ${on ? '' : 'off'}`} onClick={() => onPatch({ show: { ...cfg.show, [k]: !on } })}/>
        </div>
      })}
      <label>数字格式</label>
      <select className="pm-cfg-sel" value={cfg.numberFormat ?? 'int'} onChange={e => onPatch({ numberFormat: e.target.value as 'int' | 'pct' })}>
        <option value="int">整数</option>
        <option value="pct">百分比</option>
      </select>
    </div>}

    {tab === 'look' && <div className="pm-cfg-fld">
      <label>标题</label>
      <input className="pm-cfg-sel" value={cfg.title ?? ''} onChange={e => onPatch({ title: e.target.value })}/>
      <label>副标题</label>
      <input className="pm-cfg-sel" value={cfg.subtitle ?? ''} onChange={e => onPatch({ subtitle: e.target.value })}/>
      {desc.type === 'textNote' && <>
        <label>正文</label>
        <textarea className="pm-cfg-sel" rows={5} value={cfg.body ?? ''} onChange={e => onPatch({ body: e.target.value })}/>
      </>}
    </div>}
  </aside>
}

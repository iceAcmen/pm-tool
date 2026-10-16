/**
 * 看板编辑器（异步块 client.editor.js）——仅在用户点「布局编辑」时加载。
 * 自包含：RGL + WidthProvider、卡片库抽屉、右侧配置面板、zod 保存闸门、导入/导出/重置。
 * 不反向 import 主包：卡片渲染、字段白名单、目录、试算全部经 props 注入（避免共享块/同步兄弟 require）。
 */
import React, { useMemo, useRef, useState } from 'react'
import RGL, { WidthProvider, type Layout } from 'react-grid-layout'
import { z } from 'zod'
import type { Snapshot } from '../panel.js'
import type { DashboardLayout, FilterRule, WidgetActions, WidgetInstance, WidgetScope } from './types.js'
import type { WidgetCatalogEntry } from './widgets.js'

const GridLayout = WidthProvider(RGL)

let idSeq = 100
function nextId(): string { return `w-user-${++idSeq}` }

/** 卡片库抽屉分组（与主包 widgets.tsx 同序；经 props 注入避免反向 import）。 */
const DRAWER_GROUPS: Array<{ key: string, label: string }> = [
  { key: 'overview', label: '概览' },
  { key: 'progress', label: '进度' },
  { key: 'list', label: '列表' },
  { key: 'kpi', label: '指标' },
  { key: 'text', label: '内容' },
]

/* ---------- zod 配置 schema（保存/导入闸门；与卡片实际写入一致） ---------- */
const entityEnum = z.enum(['tasks','milestones','riskIssues','deliverables','meetings','reports','projects'])
const filterShape = z.object({
  field: z.string(),
  op: z.enum(['eq','ne','in','gte','lte','contains','isEmpty']),
  value: z.string(),
})
const recordListSchema = z.object({
  entity: entityEnum, projectScope: z.string(), filters: z.array(filterShape),
  sort: z.object({ field: z.string(), dir: z.enum(['asc','desc']) }), numberFormat: z.enum(['int','pct']),
}).loose()
const overdueSoonSchema = z.object({ projectScope: z.string() }).loose()
const kpiSchema = z.object({
  entity: entityEnum, projectScope: z.string(), filters: z.array(filterShape),
  numberFormat: z.enum(['int','pct']).optional(), formula: z.string().max(200).optional(),
  title: z.string().optional(), subtitle: z.string().optional(),
}).loose()
const noteSchema = z.object({ title: z.string(), body: z.string() }).loose()
const formulaCardSchema = z.object({
  entity: entityEnum, projectScope: z.string(), filters: z.array(filterShape),
  formula: z.string().max(200, '公式不超过 200 字'),
  numberFormat: z.enum(['int','pct']).optional(), title: z.string().optional(), subtitle: z.string().optional(),
}).loose()
/** type -> zod schema（仅保存闸门用；渲染不依赖）。 */
const CONFIG_SCHEMAS: Record<string, z.ZodType> = {
  recordList: recordListSchema,
  overdueSoon: overdueSoonSchema,
  kpiMetric: kpiSchema,
  textNote: noteSchema,
  formulaCard: formulaCardSchema,
}

export interface BoardEditorProps {
  initialLayout: DashboardLayout
  data: Snapshot
  actions: WidgetActions
  catalog: WidgetCatalogEntry[]
  fieldWhitelist: Record<string, string[]>
  grid: { cols: number, rowHeight: number, margin: [number, number] }
  renderCard: (w: WidgetInstance, isEditing: boolean) => React.ReactNode
  onTrial: (formula: string, entity: string, projectScope: string, filters: FilterRule[]) => string
  /** 导入文件：主包做结构解析 + 目录校验，返回布局或错误串。 */
  onImportText: (text: string) => { ok: true, layout: DashboardLayout } | { ok: false, error: string }
  onExit: () => void
  onSave: (scope: WidgetScope, layout: DashboardLayout) => Promise<void>
  onReset: (scope: WidgetScope) => Promise<void>
}

export function BoardEditor(props: BoardEditorProps) {
  const { initialLayout, data, actions, catalog, fieldWhitelist, grid, renderCard, onTrial, onImportText, onExit, onSave, onReset } = props
  const [draft, setDraft] = useState<DashboardLayout>(() => structuredClone(initialLayout))
  const [scope, setScope] = useState<WidgetScope>('user')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  const live = draft

  const rglLayout: Layout[] = useMemo(
    () => live.widgets.map(w => ({
      i: w.layout.i, x: w.layout.x, y: w.layout.y, w: w.layout.w, h: w.layout.h,
      minW: w.layout.minW, minH: w.layout.minH, static: false,
    })),
    [live],
  )

  const saveEdit = async () => {
    const bad: string[] = []
    for (const w of draft.widgets) {
      const s = CONFIG_SCHEMAS[w.type]
      if (!s) continue
      const r = s.safeParse(w.config)
      if (!r.success) bad.push(`${w.type}: ${r.error.issues.map(i => i.path.join('.') || '(root)').join(',')}`)
    }
    if (bad.length) {
      setValidationError(`配置校验未通过，未保存：\n${bad.join('；')}`)
      return
    }
    const final: DashboardLayout = { ...draft, scope, version: 1 }
    try {
      await onSave(scope, final)
      setValidationError(null)
      onExit()
    } catch (e) {
      setValidationError('保存失败：' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const doReset = async () => {
    setResetting(true)
    try { await onReset(scope) } catch { /* 提示由 banner 处理 */ } finally { setResetting(false) }
  }

  const fileRef = useRef<HTMLInputElement>(null)
  const exportLayout = () => {
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
      const parsed = onImportText(String(reader.result))
      if (!parsed.ok) { setValidationError(parsed.error); return }
      // 逐卡片 zod 闸门（编辑器块内）。
      for (let i = 0; i < parsed.layout.widgets.length; i++) {
        const w = parsed.layout.widgets[i]
        const s = CONFIG_SCHEMAS[w.type]
        if (s) {
          const r = s.safeParse(w.config ?? {})
          if (!r.success) { setValidationError(`导入失败：widgets[${i}](${w.type}) 配置不合规`); return }
        }
      }
      setDraft(parsed.layout)
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  const addWidget = (type: string) => {
    const desc = catalog.find(c => c.type === type)
    if (!desc || desc.disabled) return
    if (draft.widgets.some(w => w.type === type)) return
    const i = nextId()
    const y = Math.max(0, ...draft.widgets.map(w => w.layout.y + w.layout.h))
    setDraft({ ...draft, widgets: [...draft.widgets, {
      i, type, config: structuredClone(desc.defaultConfig),
      layout: { i, x: 0, y, w: desc.defaultW, h: desc.defaultH, minW: desc.minW, minH: desc.minH },
    }] })
    setSelectedId(i)
  }

  /** P1-①：卡片库拖拽落到 RGL 栅格——按松手像素换算的 x/y 落位（非追加末尾）。 */
  const addWidgetAt = (type: string, x: number, y: number) => {
    const desc = catalog.find(c => c.type === type)
    if (!desc || desc.disabled) return
    // 单实例卡：已存在则不重复加
    if (draft.widgets.some(w => w.type === type)) return
    const i = nextId()
    // 约束到栅格内
    const cx = Math.max(0, Math.min(x, grid.cols - desc.defaultW))
    const cy = Math.max(0, y)
    setDraft({ ...draft, widgets: [...draft.widgets, {
      i, type, config: structuredClone(desc.defaultConfig),
      layout: { i, x: cx, y: cy, w: desc.defaultW, h: desc.defaultH, minW: desc.minW, minH: desc.minH },
    }] })
    setSelectedId(i)
  }

  const removeWidget = (i: string) => {
    setDraft({ ...draft, widgets: draft.widgets.filter(w => w.layout.i !== i) })
    if (selectedId === i) setSelectedId(null)
  }

  const updateConfig = (i: string, patch: Partial<WidgetInstance['config']>) => {
    setDraft({
      ...draft,
      widgets: draft.widgets.map(w => w.layout.i === i ? { ...w, config: { ...w.config, ...patch } } : w),
    })
  }

  const selected = selectedId ? live.widgets.find(w => w.layout.i === selectedId) : null

  return <div className="pm-bento-body pm-bento-editing">
    {validationError && (
      <div className="pm-bento-validation" role="alert">
        <span>{validationError}</span>
        <button type="button" className="pm-bento-validation-x" onClick={() => setValidationError(null)} aria-label="关闭">×</button>
      </div>
    )}
    <div className="pm-bento-tools" style={{ marginBottom: 12 }}>
      <select className="pm-bento-scope" value={scope} onChange={e => setScope(e.target.value as WidgetScope)} title="保存到哪个作用域">
        <option value="user">我的（个人）</option>
        <option value="project">项目（团队模板）</option>
        <option value="global">内置默认</option>
      </select>
      <button type="button" className="pm-bento-toolbtn" onClick={() => setDrawerOpen(o => !o)}>＋ 卡片库</button>
      <button type="button" className="pm-bento-toolbtn" onClick={exportLayout}>导出</button>
      <button type="button" className="pm-bento-toolbtn" onClick={() => fileRef.current?.click()}>导入</button>
      <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importLayout}/>
      <button type="button" className="pm-bento-toolbtn" onClick={() => void doReset()} disabled={resetting}>{resetting ? '重置中…' : '恢复默认'}</button>
      <button type="button" className="pm-bento-toolbtn" onClick={onExit}>取消</button>
      <button type="button" className="pm-button-primary" onClick={() => void saveEdit()}>保存</button>
    </div>

    {drawerOpen && <CardDrawer live={live} catalog={catalog} query={query} setQuery={setQuery} onAdd={addWidget}/>}
    <div className="pm-bento-grid pm-rgl-editing">
      <GridLayout
        className="pm-rgl"
        layout={rglLayout}
        cols={grid.cols}
        rowHeight={grid.rowHeight}
        margin={grid.margin}
        isDraggable
        isResizable
        isDroppable
        onDrop={(_droppedLayout: Layout[], layoutItem: Layout | undefined, e: React.DragEvent) => {
          const type = e?.dataTransfer?.getData?.('widget-type')
          if (!type) return
          // RGL 正常会给出 layoutItem.x/y（按落点像素换算）；异常时从栅格容器坐标兜底换算。
          let x = layoutItem?.x
          let y = layoutItem?.y
          if (x === undefined || y === undefined) {
            const gridEl = e.currentTarget as HTMLElement
            const rect = gridEl.getBoundingClientRect()
            const colW = (rect.width - grid.margin[0]) / grid.cols
            x = Math.max(0, Math.floor((e.clientX - rect.left) / (colW + grid.margin[0])))
            y = Math.max(0, Math.floor((e.clientY - rect.top) / (grid.rowHeight + grid.margin[1])))
          }
          addWidgetAt(type, x, y)
        }}
        compactType="vertical"
        onLayoutChange={(next: Layout[]) => {
          setDraft(d => ({
            ...d,
            widgets: d.widgets.map(w => {
              const l = next.find(n => n.i === w.layout.i)
              return l ? { ...w, layout: { ...w.layout, x: l.x, y: l.y, w: l.w, h: l.h } } : w
            }),
          }))
        }}
      >
        {live.widgets.map(w => {
          const sel = selectedId === w.layout.i
          return <div key={w.layout.i}
            className={`pm-rgl-item-wrap ${sel ? 'pm-rgl-sel' : ''}`}
            onClick={(e) => { e.stopPropagation(); setSelectedId(w.layout.i) }}>
            <button type="button" className="pm-rgl-x" title="移除卡片" onClick={(e) => { e.stopPropagation(); removeWidget(w.layout.i) }}>×</button>
            {renderCard(w, true)}
          </div>
        })}
      </GridLayout>
    </div>
    {selected && <ConfigPanel inst={selected} data={data} fieldWhitelist={fieldWhitelist} onTrial={onTrial} onPatch={(p) => updateConfig(selected.layout.i, p)} onClose={() => setSelectedId(null)}/>}
  </div>
}

/* ---------- 卡片库抽屉 ---------- */
function CardDrawer({ live, catalog, query, setQuery, onAdd }: {
  live: DashboardLayout, catalog: WidgetCatalogEntry[], query: string, setQuery: (s: string) => void, onAdd: (type: string) => void
}) {
  const added = new Set(live.widgets.map(w => w.type))
  const items = catalog.filter(d =>
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

/* ---------- 配置面板 ---------- */
function ConfigPanel({ inst, data, fieldWhitelist, onPatch, onClose, onTrial }: {
  inst: WidgetInstance
  data: Snapshot
  fieldWhitelist: Record<string, string[]>
  onPatch: (p: Partial<WidgetInstance['config']>) => void
  onClose: () => void
  onTrial: (formula: string, entity: string, projectScope: string, filters: FilterRule[]) => string
}) {
  const cfg = inst.config
  const [tab, setTab] = useState<'data' | 'filter' | 'sort' | 'formula' | 'show' | 'look'>('data')
  const hasEntity = inst.type !== 'divider'
  const isFormula = inst.type === 'formulaCard' || inst.type === 'kpiMetric'
  const whitelist = hasEntity ? fieldWhitelist[cfg.entity ?? 'tasks'] ?? [] : []
  const tabs = (['data', 'filter', 'sort', ...(isFormula ? ['formula' as const] : []), 'show', 'look'] as const)
  const [trial, setTrial] = useState<string>('')
  const doTrial = () => {
    setTrial(onTrial(String(cfg.formula ?? ''), String(cfg.entity ?? 'tasks'), String(cfg.projectScope ?? 'all'), cfg.filters ?? []))
  }
  return <aside className="pm-cfg">
    <h3>配置 · {inst.type}<button type="button" className="pm-cfg-x" onClick={onClose}>×</button></h3>
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
        <select className="pm-cfg-sel" value={cfg.entity ?? 'tasks'}
          onChange={e => {
            // P1-②：切实体后筛选字段/操作符/值整体重置为新实体口径，旧实体条件不得残留。
            const next = e.target.value as never
            onPatch({
              entity: next,
              filters: [],
              sort: { field: 'date', dir: 'asc' as const },
            })
          }}>
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
      {inst.type === 'textNote' && <>
        <label>正文</label>
        <textarea className="pm-cfg-sel" rows={5} value={cfg.body ?? ''} onChange={e => onPatch({ body: e.target.value })}/>
      </>}
    </div>}
  </aside>
}

type FilterOp = FilterRule['op']

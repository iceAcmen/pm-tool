/**
 * 看板编辑器（异步块 client.editor.js）——仅在用户点「布局编辑」时加载。
 * 自包含：RGL + WidthProvider、卡片库抽屉、右侧配置面板、zod 保存闸门、导入/导出/重置。
 * 不反向 import 主包：卡片渲染、字段白名单、目录、试算全部经 props 注入（避免共享块/同步兄弟 require）。
 */
import React, { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import RGL, { type Layout } from 'react-grid-layout'
import { z } from 'zod'
import type { Snapshot } from '../panel.js'
import type { DashboardLayout, FilterRule, WidgetActions, WidgetInstance, WidgetScope } from './types.js'
import type { ProjectionApi, BreakpointCols } from './projection.js'
import { readHistory, recordSnapshot, snapshotForPreview, type LayoutHistoryEntry } from './history.js'
import {
  nudgeWidgetLayout, buildFormulaExpression, validateFormulaConfig, serializeDashboardExport,
  applyWidgetGeometry, arrangeWidgetLayout, compactVertical, removeWidgetAndCompact,
  filterCatalogItems, locateWidgetByType, snapshotBeforeGeometryChange,
  type FormulaBuildInput, type FormulaCondition, type FormulaCaliber,
} from './editor-ops.js'

import type { WidgetCatalogEntry } from './widgets.js'

/**
 * 自适应宽度 RGL：替代 RGL 1.4.4 的 WidthProvider（只在 window resize 时测量，
 * flex 布局初次挂载 clientWidth=0 会被固定成 0；卡片库/配置面板开关是 flex 变化不触发 window resize）。
 * 这里用 ResizeObserver 监听容器 clientWidth 即时把 width 传给 RGL，rAF 先测一次，window resize 兜底。
 */
function ResizeWidthRGL(props: React.ComponentProps<typeof RGL>) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    let raf = 0
    const measure = () => {
      const w = wrapRef.current?.clientWidth ?? 0
      if (w > 0) setWidth(w)
    }
    raf = requestAnimationFrame(measure)
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure)
      if (wrapRef.current) ro.observe(wrapRef.current)
    }
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])
  return <div ref={wrapRef} style={{ width: '100%' }}>
    {width > 0 && <RGL {...props} width={width} />}
  </div>
}
const GridLayout: ComponentType<React.ComponentProps<typeof RGL>> = ResizeWidthRGL

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
const sortShape = z.object({ field: z.string(), dir: z.enum(['asc','desc']) })
const recordListSchema = z.object({
  entity: entityEnum, projectScope: z.string(), filters: z.array(filterShape),
  sort: sortShape, sorts: z.array(sortShape).max(3, '排序规则最多 3 条').optional(), numberFormat: z.enum(['int','pct']),
}).loose()
const overdueSoonSchema = z.object({ projectScope: z.string() }).loose()
const kpiSchema = z.object({
  entity: entityEnum, projectScope: z.string(), filters: z.array(filterShape),
  sort: sortShape.optional(), sorts: z.array(sortShape).max(3, '排序规则最多 3 条').optional(),
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
  /** 投影纯函数由 entry 主包注入（避免编辑器块静态依赖投影而被拆成宿主未注册 chunk）。 */
  projection: ProjectionApi
  /** 布局解析器由 entry 主包注入（parseLayout 留在 persist，避免编辑器块共享 persist chunk）。 */
  parseLayout: (raw: unknown) => DashboardLayout | null
  renderCard: (w: WidgetInstance, isEditing: boolean) => React.ReactNode
  onTrial: (formula: string, entity: string, projectScope: string, filters: FilterRule[]) => string
  /** 导入文件：主包做结构解析 + 目录校验，返回布局或错误串。 */
  onImportText: (text: string) => { ok: true, layout: DashboardLayout } | { ok: false, error: string }
  /** 上次成功保存的 canonical 布局（会话内「恢复上次保存」预览/恢复；落盘历史槽位另议）。 */
  savedLayout?: DashboardLayout
  onExit: () => void
  onSave: (scope: WidgetScope, layout: DashboardLayout) => Promise<void>
  onReset: (scope: WidgetScope) => Promise<void>
}

export function BoardEditor(props: BoardEditorProps) {
  const { initialLayout, data, actions, catalog, fieldWhitelist, grid, projection, parseLayout, renderCard, onTrial, onImportText, onExit, onSave, onReset, savedLayout } = props
  const [draft, setDraft] = useState<DashboardLayout>(() => structuredClone(initialLayout))
  const [scope, setScope] = useState<WidgetScope>('user')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  // R-B7：撤销栈 ≤20 步（仅离散动作入栈；拖拽/缩放帧不逐帧入栈，避免淹没历史）。
  const historyRef = useRef<DashboardLayout[]>([])
  const [canUndo, setCanUndo] = useState(false)
  // D-01：删除后 1.5s 单行轻反馈（success 条 + 撤销），不弹原生 confirm；撤销进既有 20 步栈。
  const [notice, setNotice] = useState<{ label: string } | null>(null)
  const noticeTimer = useRef<number | null>(null)
  const clearNotice = () => {
    if (noticeTimer.current !== null) { window.clearTimeout(noticeTimer.current); noticeTimer.current = null }
    setNotice(null)
  }
  useEffect(() => () => { if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current) }, [])
  const pushHistory = (snapshot: DashboardLayout = draft) => {
    historyRef.current.push(structuredClone(snapshot))
    if (historyRef.current.length > 20) historyRef.current.shift()
    setCanUndo(true)
  }
  const undo = () => {
    clearNotice()
    const prev = historyRef.current.pop()
    setCanUndo(historyRef.current.length > 0)
    if (prev) setDraft(prev)
  }
  // 编辑始终使用 canonical 12 列画布；配置面板与屏幕宽度变化只改变视口，不回写草稿。
  const activeCols = grid.cols as BreakpointCols
  const stageRef = useRef<HTMLDivElement | null>(null)
  // R-B9：重置二次确认（破坏性，先点「恢复默认」出现确认态，再点才执行）。
  const [resetArmed, setResetArmed] = useState(false)

  // T6：跨会话 localStorage 布局历史（bounded ≤5，非破坏）。按作用域隔离读取；
  // 恢复仅把某版克隆进 draft 预览，必须再点「保存」才落盘，不自动写回。
  const safeStorage = (): Storage | null => (typeof localStorage !== 'undefined' ? localStorage : null)
  const [hist, setHist] = useState<LayoutHistoryEntry[]>([])
  const [histOpen, setHistOpen] = useState(false)
  // 导出预览 / 导入投放面板（设计 66/67）：本地预览，不落盘。
  const [exportOpen, setExportOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  useEffect(() => {
    const s = safeStorage()
    setHist(s ? readHistory(s, scope, parseLayout) : [])
  }, [scope])
  const restoreSnapshot = (entry: LayoutHistoryEntry) => {
    pushHistory()
    setDraft(snapshotForPreview(entry))
    setValidationError(null)
  }

  const live = draft

  // 契约 §3.6：draft 永远是 canonical 12 列真源；rglLayout 仅按当前断点投影显示，
  // onLayoutChange 再回算 12 列写回 draft，杜绝窄断点坐标直接落盘导致宽屏塌缩。
  const rglLayout: Layout[] = useMemo(
    () => projection.projectToBreakpoint(live.widgets, activeCols).map(l => ({
      i: l.i, x: l.x, y: l.y, w: l.w, h: l.h,
      minW: l.minW, minH: l.minH, static: false,
    })),
    [live, activeCols],
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
    // R-B3：持久化前 canonical bbox 碰撞检测（projection 纯模块同源）；重叠即整批拒绝、零写入。
    const collisions = projection.findCanonicalCollisions(draft.widgets)
    if (collisions.length) {
      setValidationError(`存在卡片重叠，未保存：${collisions.map(([a, b]) => `${a} ↔ ${b}`).join('，')}。请先分开或下沉。`)
      return
    }
    const final: DashboardLayout = { ...draft, scope, version: 1 }
    try {
      await onSave(scope, final)
      // T6：成功落盘后把 canonical 快照写入 localStorage 历史（bounded≤5，非破坏，失败静默）。
      const s = safeStorage()
      if (s) setHist(recordSnapshot(s, scope, final, undefined, undefined, parseLayout))
      setValidationError(null)
      onExit()
    } catch (e) {
      setValidationError('保存失败：' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const doReset = async () => {
    // R-B9：破坏性重置二次确认；未武装时只武装并展示确切作用域，不执行。
    if (!resetArmed) { setResetArmed(true); return }
    setResetArmed(false)
    setResetting(true)
    try { await onReset(scope) } catch { /* 提示由 banner 处理 */ } finally { setResetting(false) }
  }

  const fileRef = useRef<HTMLInputElement>(null)
  const exportJson = serializeDashboardExport(draft, scope)
  const downloadExport = () => {
    const blob = new Blob([exportJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dashboard-${scope}.json`; a.click()
    URL.revokeObjectURL(url)
  }
  /** 会话内「恢复上次保存」：仅载入预览，必须再点保存才落盘（不自动写回）。 */
  const restoreSaved = () => {
    if (!savedLayout) return
    pushHistory()
    setDraft(structuredClone(savedLayout))
    setValidationError(null)
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
      pushHistory()
      setDraft(parsed.layout)
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  const addWidget = (type: string) => {
    const desc = catalog.find(c => c.type === type)
    if (!desc || desc.disabled) return
    if (draft.widgets.some(w => w.type === type)) return
    pushHistory()
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
    pushHistory()
    const i = nextId()
    // 落点 x 来自当前断点列空间，回算到 canonical 12 列；y/h 与断点无关直接保留。
    const scale = grid.cols / activeCols
    const cx = Math.max(0, Math.min(Math.round(x * scale), grid.cols - desc.defaultW))
    const cy = Math.max(0, y)
    setDraft({ ...draft, widgets: [...draft.widgets, {
      i, type, config: structuredClone(desc.defaultConfig),
      layout: { i, x: cx, y: cy, w: desc.defaultW, h: desc.defaultH, minW: desc.minW, minH: desc.minH },
    }] })
    setSelectedId(i)
  }

  const removeWidget = (i: string) => {
    const target = draft.widgets.find(w => w.layout.i === i)
    const label = target ? (catalog.find(c => c.type === target.type)?.name ?? target.type) : '卡片'
    pushHistory()
    clearNotice()
    setDraft(d => ({ ...d, widgets: removeWidgetAndCompact(d.widgets, i, grid.cols) }))
    if (selectedId === i) setSelectedId(null)
    setNotice({ label })
    noticeTimer.current = window.setTimeout(() => setNotice(null), 1500)
  }

  const updateConfig = (i: string, patch: Partial<WidgetInstance['config']>) => {
    pushHistory()
    setDraft({
      ...draft,
      widgets: draft.widgets.map(w => w.layout.i === i ? { ...w, config: { ...w.config, ...patch } } : w),
    })
  }

  /** I7：布局补丁（坐标/尺寸的非指针编辑路径，供配置面板数字输入）。 */
  const updateLayout = (i: string, patch: Partial<WidgetInstance['layout']>) => {
    pushHistory()
    // D-01：显式几何应用后稳定压实填洞；被动宽度/断点变化不走这里。
    setDraft(d => ({ ...d, widgets: compactVertical(applyWidgetGeometry(d.widgets, i, patch, grid.cols), grid.cols) }))
  }

  /**
   * I7：键盘方向键移动卡片（拖拽的非指针替代）。按 dx/dy 步进一格；
   * 落入他卡占用格时与该卡交换坐标（不产生重叠），边界按 cols 夹紧。
   * 纯逻辑在 editor-ops.ts（可单测）；这里只入撤销栈 + 写 draft，不干预 RGL 鼠标拖拽链路。
   */
  const nudgeWidget = (i: string, dx: number, dy: number) => {
    pushHistory()
    setDraft(d => ({ ...d, widgets: nudgeWidgetLayout(d.widgets, i, dx, dy, grid.cols) }))
  }

  const selected = selectedId ? live.widgets.find(w => w.layout.i === selectedId) : null

  // D-02：单 panel 状态——卡库抽屉与配置面板互斥，不同时叠放。
  const openDrawer = () => { setSelectedId(null); setDrawerOpen(true) }
  const closePanel = () => { setDrawerOpen(false); setSelectedId(null) }
  useEffect(() => {
    if (!drawerOpen && !selectedId) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen, selectedId])

  // D-02：「已在画布 · 定位」按类型找到实例，滚动居中并短暂高亮（不改坐标/配置）。
  const locateByType = (type: string) => {
    const inst = locateWidgetByType(live.widgets, type)
    if (!inst) return
    const el = document.querySelector(`[data-widget-id="${inst.layout.i}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    el?.classList.add('pm-located')
    window.setTimeout(() => el?.classList.remove('pm-located'), 1200)
  }

  return <div className="pm-bento-body pm-bento-editing">
    {validationError && (
      <div className="pm-bento-validation" role="alert">
        <span>{validationError}</span>
        <button type="button" className="pm-bento-validation-x" onClick={() => setValidationError(null)} aria-label="关闭">×</button>
      </div>
    )}
    {notice && (
      <div className="pm-remove-notice" role="status" aria-live="polite">
        <span>已移除「{notice.label}」卡片</span>
        <button type="button" className="pm-remove-notice-undo" onClick={undo}>撤销</button>
      </div>
    )}
    <header className="pm-edit-head">
      <div>
        <h2 className="pm-edit-title">看板编辑</h2>
        <p className="pm-edit-sub">拖动卡片调整位置，拖动右下角改变尺寸。自动排版可撤销，保存后生效。</p>
      </div>
    </header>

    <div className="pm-bento-tools pm-edit-tools">
      <label className="pm-edit-scope" title="保存到哪个作用域（落盘由宿主按当前项目/个人路由决定）">
        <span>作用域</span>
        <select value={scope} onChange={e => setScope(e.target.value as WidgetScope)}>
          <option value="user">我的（个人）</option>
          <option value="project">项目（团队模板）</option>
          <option value="global">内置默认</option>
        </select>
      </label>
      <button type="button" className="pm-button" onClick={() => { pushHistory(); setDraft(d => ({ ...d, widgets: arrangeWidgetLayout(d.widgets, grid.cols) })); setValidationError(null) }}>自动排版</button>
      <button type="button" className="pm-button" onClick={() => (drawerOpen ? setDrawerOpen(false) : openDrawer())}>{drawerOpen ? '× 卡片库' : '＋ 卡片库'}</button>
      <button type="button" className="pm-button" onClick={() => { setImportOpen(o => !o); setExportOpen(false) }}>导入布局</button>
      <button type="button" className="pm-button" onClick={() => { setExportOpen(o => !o); setImportOpen(false) }}>导出布局</button>
      {savedLayout && (
        <button type="button" className="pm-button"
          title="恢复上次成功保存的布局（本会话预览，需再点保存才落盘）"
          onClick={restoreSaved}>↺ 恢复上次保存</button>
      )}
      <button type="button" className="pm-button" onClick={undo} disabled={!canUndo} title="撤销上一步（最多 20 步）">↶ 撤销</button>
      <button type="button" className="pm-button"
        title={`本作用域已保存的历史版本（最多 5 版，localStorage 持久，跨 reload/重启保留）；预览后需再点保存`}
        onClick={() => setHistOpen(o => !o)}>历史版本（{hist.length}）</button>
      <button
        type="button"
        className={`pm-button${resetArmed ? ' pm-button-danger' : ''}`}
        onClick={() => void doReset()}
        disabled={resetting}
        title={`将${scope === 'user' ? '个人' : scope === 'project' ? '项目' : '内置'}布局恢复默认（此操作不可撤销，需二次确认）`}
      >{resetting ? '重置中…' : resetArmed ? `确认重置${scope === 'user' ? '个人' : scope === 'project' ? '项目' : '内置'}布局？` : '恢复默认'}</button>
      {resetArmed && <button type="button" className="pm-button" onClick={() => setResetArmed(false)}>取消重置</button>}
      <span className="pm-edit-tools-spacer"/>
      <button type="button" className="pm-button" onClick={onExit}>取消</button>
      <button type="button" className="pm-button pm-button-primary" onClick={() => void saveEdit()}>保存布局</button>
    </div>
    <input ref={fileRef} type="file" accept="application/json" hidden onChange={importLayout}/>

    {histOpen && (
      <div className="pm-bento-history" role="region" aria-label="历史版本">
        <p className="pm-bento-history-note">
          显式预览：点「预览」把该版载入画布，确认后再点「保存」才写回；不自动落盘、不删除现有卡片。
        </p>
        {hist.length === 0 && <p className="pm-bento-history-empty">本作用域暂无已保存历史（保存一次后自动留档，最多 5 版）。</p>}
        {hist.map((entry, idx) => (
          <div className="pm-bento-history-row" key={entry.ts}>
            <span className="pm-bento-history-meta">
              {idx === 0 ? '最新' : `第 ${idx + 1} 版`} · {new Date(entry.ts).toLocaleString()} · {entry.layout.widgets.length} 张卡
            </span>
            <button type="button" className="pm-button" onClick={() => restoreSnapshot(entry)}>预览</button>
          </div>
        ))}
      </div>
    )}

    {exportOpen && (
      <div className="pm-edit-panel" role="region" aria-label="导出布局">
        <h3 className="pm-edit-panel-title">导出布局（本地预览）</h3>
        <p className="pm-edit-panel-note">紧凑 JSON，结构与 dsh-storage 落盘一致；下载只写本地文件，不改后端。</p>
        <div className="pm-edit-export-meta">
          <span>文件：<code>dashboard-{scope}.json</code></span>
          <span>大小：{(new Blob([exportJson]).size).toLocaleString()} 字节 · {draft.widgets.length} 张卡</span>
        </div>
        <button type="button" className="pm-button pm-button-primary" onClick={downloadExport}>下载 JSON</button>
      </div>
    )}

    {importOpen && (
      <div className="pm-edit-panel" role="region" aria-label="导入布局">
        <h3 className="pm-edit-panel-title">导入布局（本地回写草稿）</h3>
        <p className="pm-edit-panel-note">选择 .json 布局文件：结构 + 目录校验通过后载入画布，必须再点「保存布局」才落盘；不删除现有卡片。</p>
        <button type="button" className="pm-button" onClick={() => fileRef.current?.click()}>选择 JSON 文件</button>
      </div>
    )}

    <div className="pm-bento-stage" ref={stageRef}>
      {(drawerOpen || selected) && <div className="pm-panel-scrim" onClick={closePanel} aria-hidden="true"/>}
      {drawerOpen && <CardDrawer live={live} catalog={catalog} query={query} setQuery={setQuery} onAdd={addWidget} onLocate={locateByType}/>}
      <div className="pm-bento-grid pm-rgl-editing">
        <GridLayout
          className="pm-rgl"
          layout={rglLayout}
          cols={activeCols}
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
              const colW = (rect.width - grid.margin[0]) / activeCols
              x = Math.max(0, Math.floor((e.clientX - rect.left) / (colW + grid.margin[0])))
              y = Math.max(0, Math.floor((e.clientY - rect.top) / (grid.rowHeight + grid.margin[1])))
            }
            addWidgetAt(type, x, y)
          }}
          compactType={null}
          onDragStart={(_layout: Layout[], oldItem: Layout) => {
            pushHistory(snapshotBeforeGeometryChange(draft, oldItem, activeCols, projection))
          }}
          onResizeStart={(_layout: Layout[], oldItem: Layout) => {
            pushHistory(snapshotBeforeGeometryChange(draft, oldItem, activeCols, projection))
          }}
          onDragStop={(next: Layout[]) => setDraft(d => ({ ...d, widgets: compactVertical(projection.reverseFromBreakpoint(d.widgets, next, activeCols), grid.cols) }))}
          onResizeStop={(next: Layout[]) => setDraft(d => ({ ...d, widgets: compactVertical(projection.reverseFromBreakpoint(d.widgets, next, activeCols), grid.cols) }))}
          draggableHandle=".pm-rgl-item-wrap"
          cancel=".pm-rgl-x, button, input, select, textarea, a, [data-nodrag]"
        >
          {live.widgets.map(w => {
            const sel = selectedId === w.layout.i
            const desc = catalog.find(c => c.type === w.type)
            const label = desc?.name ?? w.type
            const select = () => {
              setSelectedId(w.layout.i)
              // P0-7 / S3-3：选中卡片即打开右侧配置面板，自动收起左侧卡片库，二者不并存。
              setDrawerOpen(false)
            }
            // I7：卡片可聚焦；Enter/Space 选中配置，方向键上/下/左/右步进移动（拖拽的键盘替代），不影响鼠标拖拽。
            const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); return }
              const delta: Record<string, [number, number]> = {
                ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
              }
              const d = delta[e.key]
              if (!d) return
              e.preventDefault()
              select()
              nudgeWidget(w.layout.i, d[0], d[1])
            }
            return <div key={w.layout.i}
              className={`pm-rgl-item-wrap ${sel ? 'pm-rgl-sel' : ''}`} data-widget-id={w.layout.i}
              tabIndex={0} role="group"
              aria-label={`${label}卡片；Enter 打开配置，方向键移动位置`}
              onClick={(e) => { e.stopPropagation(); select() }}
              onKeyDown={onKeyDown}>
              <button type="button" className="pm-rgl-x" title="移除卡片" aria-label={`移除${label}卡片`} onClick={(e) => { e.stopPropagation(); removeWidget(w.layout.i) }}>×</button>
              {renderCard(w, true)}
            </div>
          })}
        </GridLayout>
      </div>
      {selected && <ConfigPanel key={selected.layout.i} inst={selected} data={data} fieldWhitelist={fieldWhitelist} cols={grid.cols}
        onTrial={onTrial} onPatch={(p) => updateConfig(selected.layout.i, p)}
        onLayout={(p) => updateLayout(selected.layout.i, p)} onClose={() => setSelectedId(null)}/>}
    </div>
  </div>
}

/* ---------- 卡片库抽屉 ---------- */
function CardDrawer({ live, catalog, query, setQuery, onAdd, onLocate }: {
  live: DashboardLayout, catalog: WidgetCatalogEntry[], query: string, setQuery: (s: string) => void,
  onAdd: (type: string) => void, onLocate: (type: string) => void,
}) {
  const added = new Set(live.widgets.map(w => w.type))
  const items = filterCatalogItems(catalog, query)
  return <aside className="pm-drawer">
    <h3>卡片库</h3>
    <input className="pm-drawer-search" placeholder="搜索卡片…" value={query} onChange={e => setQuery(e.target.value)}/>
    {items.length === 0 && (
      <div className="pm-drawer-empty" role="status">无匹配卡片，换个关键词试试。</div>
    )}
    {DRAWER_GROUPS.map(g => {
      const list = items.filter(d => d.category === g.key)
      if (!list.length) return null
      return <div key={g.key}>
        <div className="pm-drawer-grp">{g.label}</div>
        {list.map(d => {
          const has = added.has(d.type)
          return <button key={d.type} type="button"
            className={`pm-drawer-item ${has ? 'added' : ''}`}
            disabled={!has && d.disabled}
            draggable={!has && !d.disabled}
            onDragStart={(e) => e.dataTransfer.setData('widget-type', d.type)}
            onClick={() => (has ? onLocate(d.type) : onAdd(d.type))}>
            <i className="pm-drawer-glyph" aria-hidden>{d.name.trim().charAt(0)}</i>
            <span className="pm-drawer-name">{d.name}</span>
            <span className="pm-drawer-plus">{has ? '已在画布 · 定位' : d.disabled ? '不可加' : '＋'}</span>
          </button>
        })}
      </div>
    })}
    <div className="pm-drawer-tip">点 ＋ 添加到看板，或拖到画布；已在画布的卡片可点「定位」滚动到该卡。</div>
  </aside>
}

/* ---------- 配置面板 ---------- */
function ConfigPanel({ inst, data, fieldWhitelist, cols, onPatch, onLayout, onClose, onTrial }: {
  inst: WidgetInstance
  data: Snapshot
  fieldWhitelist: Record<string, string[]>
  cols: number
  onPatch: (p: Partial<WidgetInstance['config']>) => void
  /** I7：布局补丁（坐标 x/y、尺寸 w/h），拖拽位移/缩放的非指针编辑路径。 */
  onLayout: (p: Partial<WidgetInstance['layout']>) => void
  onClose: () => void
  onTrial: (formula: string, entity: string, projectScope: string, filters: FilterRule[]) => string
}) {
  const cfg = inst.config
  // D-02：面板标题标记本地未保存改动（挂载快照与当前 config 比对，保存布局前一直可见）。
  const [initialConfig] = useState(() => JSON.stringify(inst.config))
  const dirty = JSON.stringify(inst.config) !== initialConfig
  const [geometry, setGeometry] = useState(() => ({ x: String(inst.layout.x), y: String(inst.layout.y), w: String(inst.layout.w), h: String(inst.layout.h) }))
  const [geometryError, setGeometryError] = useState('')
  useEffect(() => { setGeometry({ x: String(inst.layout.x), y: String(inst.layout.y), w: String(inst.layout.w), h: String(inst.layout.h) }) }, [inst.layout.x, inst.layout.y, inst.layout.w, inst.layout.h])
  const applyGeometry = () => {
    const vals = Object.fromEntries(Object.entries(geometry).map(([k, v]) => [k, Number(v)]))
    if (Object.values(geometry).some(v => v.trim() === '') || Object.values(vals).some(v => !Number.isInteger(v))) {
      setGeometryError('请填写完整的整数位置与尺寸'); return
    }
    if (vals.w < (inst.layout.minW ?? 1) || vals.w > cols || vals.h < (inst.layout.minH ?? 1) || vals.h > 200 || vals.x < 0 || vals.x + vals.w > cols || vals.y < 0 || vals.y > 10000) {
      setGeometryError(`宽度 ${inst.layout.minW ?? 1}–${cols} 列，高度 ${inst.layout.minH ?? 1}–200 行；列位置不能超出画布`); return
    }
    onLayout({ x: vals.x, y: vals.y, w: vals.w, h: vals.h }); setGeometryError('')
  }
  const [tab, setTab] = useState<'data' | 'filter' | 'sort' | 'formula' | 'show' | 'look'>('data')
  const hasEntity = inst.type !== 'divider'
  const isFormula = inst.type === 'formulaCard' || inst.type === 'kpiMetric'
  const whitelist = hasEntity ? fieldWhitelist[cfg.entity ?? 'tasks'] ?? [] : []
  const tabs = (['data', 'filter', 'sort', ...(isFormula ? ['formula' as const] : []), 'show', 'look'] as const)

  /* 公式白名单口径构建（设计 §7：无自由表达式；口径 + 条件 → 只读表达式预览；红错误清单禁用应用）。 */
  const [caliber, setCaliber] = useState<FormulaCaliber | ''>('')
  const [builderField, setBuilderField] = useState('')
  const [conditions, setConditions] = useState<FormulaCondition[]>([])
  const builder: FormulaBuildInput = { caliber, field: builderField, conditions }
  const expr = buildFormulaExpression(builder)
  const errors = validateFormulaConfig(builder)
  const legacyFormula = typeof cfg.formula === 'string' && cfg.formula.trim()
  const [trial, setTrial] = useState<string>('')
  const applyFormula = () => {
    const entity = cfg.entity ?? 'tasks'
    const scope = String(cfg.projectScope ?? 'all')
    const filters = cfg.filters ?? []
    onPatch({ formula: expr, entity, projectScope: scope, filters, numberFormat: cfg.numberFormat ?? 'int' })
    setTrial(onTrial(expr, String(entity), scope, filters))
  }
  const setCondition = (i: number, patch: Partial<FormulaCondition>) => {
    setConditions(prev => prev.map((c, j) => j === i ? { ...c, ...patch } : c))
  }

  return <aside className="pm-cfg">
    <h3>
      <span className="pm-cfg-title">选中卡片配置{dirty && <span className="pm-cfg-dirty">· 未保存改动</span>}</span>
      <button type="button" className="pm-cfg-x" onClick={onClose} aria-label="关闭配置">×</button>
    </h3>
    <div className="pm-cfg-sub">{inst.type} · 改动只写本地草稿，保存后才落盘</div>
    <div className="pm-cfg-tabs">
      {tabs.map(t =>
        <button key={t} type="button" className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
          {{ data: '数据源', filter: '筛选', sort: '排序', formula: '公式', show: '显示元素', look: '外观' }[t]}
        </button>)}
    </div>

    {/* 输入期间保留完整字符串；点击应用才更新画布，避免逐键夹紧/自动回弹。 */}
    <div className="pm-cfg-fld">
      <label className="pm-cfg-label">位置与尺寸</label>
      <div className="pm-cfg-grid4">
        {([['x', '列位置'], ['y', '行位置'], ['w', '宽度（列）'], ['h', '高度（行）']] as const).map(([k, label]) => (
          <label key={k} className="pm-cfg-num">{label}
            <input className="pm-cfg-sel" type="number" step={1} aria-label={label} value={geometry[k]}
              onChange={e => setGeometry(g => ({ ...g, [k]: e.target.value }))}/>
          </label>
        ))}
      </div>
      <p className="pm-cfg-help">画布共 {cols} 列，1 行约 48px。应用后冲突卡片会下移，可撤销。</p>
      {geometryError && <p className="pm-cfg-geometry-error" role="alert">{geometryError}</p>}
      <button type="button" className="pm-button" onClick={applyGeometry}>应用位置与尺寸</button>
    </div>

    {tab === 'formula' && isFormula && <div className="pm-cfg-fld">
      <label className="pm-cfg-label">统计口径（白名单聚合，无可选自由表达式）</label>
      <select className="pm-cfg-sel" value={caliber} onChange={e => setCaliber(e.target.value as FormulaCaliber | '')}>
        <option value="">未选择口径</option>
        <option value="count">计数 · count(rows)</option>
        <option value="sum">求和 · sum(rows, 字段)</option>
        <option value="avg">平均 · avg(rows, 字段)</option>
        <option value="rowMin">最小值 · rowMin(rows, 字段)</option>
        <option value="rowMax">最大值 · rowMax(rows, 字段)</option>
        <option value="countIf">条件计数 · countIf(rows, 字段, 值)</option>
        <option value="pct">占比 · pct(countIf, count)</option>
      </select>
      {caliber !== 'count' && (
        <label className="pm-cfg-label">目标字段（{cfg.entity ?? 'tasks'} 白名单）
          <select className="pm-cfg-sel" value={builderField} onChange={e => setBuilderField(e.target.value)}>
            <option value="">选择字段</option>
            {whitelist.map(fd => <option key={fd} value={fd}>{fd}</option>)}
          </select>
        </label>
      )}

      <label className="pm-cfg-label">组合条件（AND，最多 3 行）</label>
      {conditions.map((c, i) => (
        <div key={i} className="pm-cfg-rule">
          <select value="AND" disabled aria-label="连接词">
            <option>AND</option>
          </select>
          <select value={c.field} onChange={e => setCondition(i, { field: e.target.value })}>
            <option value="">字段</option>
            {whitelist.map(fd => <option key={fd} value={fd}>{fd}</option>)}
          </select>
          <select value={c.op} onChange={e => setCondition(i, { op: e.target.value as FilterOp })}>
            {['eq', 'ne', 'in', 'gte', 'lte', 'contains', 'isEmpty'].map(op => <option key={op} value={op}>{op}</option>)}
          </select>
          <input value={c.value} placeholder="值" onChange={e => setCondition(i, { value: e.target.value })}/>
          <button type="button" aria-label="删除条件" onClick={() => setConditions(prev => prev.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="pm-cfg-add" disabled={conditions.length >= 3}
        onClick={() => setConditions(prev => [...prev, { connector: 'AND', field: whitelist[0] ?? 'status', op: 'eq', value: '' }])}>＋ 添加条件行</button>

      <label className="pm-cfg-label">表达式预览（只读）</label>
      <code className="pm-cfg-expr">{expr || '（待构建：先选统计口径）'}</code>

      {legacyFormula && caliber === '' && (
        <div className="pm-cfg-help">现有表达式由旧版安全求值器保留；选择口径并应用后将以白名单口径重建。</div>
      )}
      {errors.length > 0 && (
        <div className="pm-cfg-errors" role="alert">
          <div className="pm-cfg-errors-title">表单校验未通过（未求值）</div>
          <ul>{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}
      <button type="button" className="pm-button pm-cfg-apply" disabled={errors.length > 0} onClick={applyFormula}>应用公式</button>
      {trial && <div className="pm-cfg-trial" aria-live="polite">试算：{trial}</div>}
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
      <label>主排序（旧单规则，兼容旧布局）</label>
      <select className="pm-cfg-sel" value={cfg.sort?.field ?? 'date'} onChange={e => onPatch({ sort: { field: e.target.value, dir: cfg.sort?.dir ?? 'asc' } })}>
        <option value="date">日期</option>
        {(whitelist.length ? whitelist : ['status', 'assignee']).map(fd => <option key={fd} value={fd}>{fd}</option>)}
      </select>
      <label>方向</label>
      <select className="pm-cfg-sel" value={cfg.sort?.dir ?? 'asc'} onChange={e => onPatch({ sort: { field: cfg.sort?.field ?? 'date', dir: e.target.value as 'asc' | 'desc' } })}>
        <option value="asc">升序</option>
        <option value="desc">降序</option>
      </select>

      <label style={{ marginTop: 12 }}>多规则排序（{cfg.sorts?.length ?? 0}/3，从上到下优先级）</label>
      {(cfg.sorts ?? []).map((rule, i) => (
        <div key={i} className="pm-cfg-rule">
          <select value={rule.field} onChange={e => {
            const next = [...(cfg.sorts ?? [])]
            next[i] = { ...rule, field: e.target.value }
            onPatch({ sorts: next })
          }}>
            {(whitelist.length ? whitelist : ['date', 'title', 'status', 'assignee']).map(fd => <option key={fd} value={fd}>{fd}</option>)}
          </select>
          <select value={rule.dir} onChange={e => {
            const next = [...(cfg.sorts ?? [])]
            next[i] = { ...rule, dir: e.target.value as 'asc' | 'desc' }
            onPatch({ sorts: next })
          }}>
            <option value="asc">升序</option>
            <option value="desc">降序</option>
          </select>
          <button type="button" disabled={i === 0} title="上移" onClick={() => {
            const next = [...(cfg.sorts ?? [])]
            ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
            onPatch({ sorts: next })
          }}>↑</button>
          <button type="button" disabled={i === (cfg.sorts ?? []).length - 1} title="下移" onClick={() => {
            const next = [...(cfg.sorts ?? [])]
            ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
            onPatch({ sorts: next })
          }}>↓</button>
          <button type="button" onClick={() => onPatch({ sorts: (cfg.sorts ?? []).filter((_, j) => j !== i) })}>✕</button>
        </div>
      ))}
      <button
        type="button"
        className="pm-cfg-add"
        disabled={(cfg.sorts ?? []).length >= 3}
        onClick={() => onPatch({ sorts: [...(cfg.sorts ?? []), { field: whitelist[0] ?? 'date', dir: 'asc' as const }] })}
      >＋ 添加排序规则（最多 3 条）</button>
    </div>}

    {tab === 'show' && <div className="pm-cfg-fld">
      {[['pill', '状态标签'], ['date', '日期'], ['owner', '负责人'], ['legend', '图例'], ['progress', '进度条']].map(([k, label]) => {
        const on = cfg.show?.[k] !== false
        return <div key={k} className="pm-cfg-chk">
          <span>{label}</span>
          <button type="button" className={`pm-cfg-sw ${on ? '' : 'off'}`} onClick={() => onPatch({ show: { ...cfg.show, [k]: !on } })}/>
        </div>
      })}
      <label>排版密度</label>
      <select className="pm-cfg-sel" value={(cfg.density as string) ?? 'comfortable'} onChange={e => onPatch({ density: e.target.value })}>
        <option value="comfortable">舒适</option>
        <option value="compact">紧凑</option>
      </select>
      <label>最多显示条数</label>
      <input className="pm-cfg-sel" type="number" min={1} max={50} value={(cfg.maxItems as number) ?? 8}
        onChange={e => onPatch({ maxItems: Math.max(1, Math.min(50, Number(e.target.value) || 8)) })}/>
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

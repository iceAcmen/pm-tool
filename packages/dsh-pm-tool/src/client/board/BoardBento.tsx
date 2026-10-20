/**
 * 可配置看板（浏览态主包）：
 *  - 浏览态：纯 CSS grid 静态渲染卡片，不加载 RGL/zod/expr-eval（首屏轻量）。
 *  - 编辑态：点「布局编辑」才异步加载 client.editor.js（RGL + 卡片库 + 配置面板 + zod 闸门）。
 *  - 公式卡：expr-eval 在 client.formula.js，首次需要时惰性加载；加载完成后同步渲染，口径与编辑态一致。
 *  - 持久化：初始布局取自 data.dashboards（user>project>默认）；保存/重置经回调走 dsh-storage。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { Snapshot } from '../panel.js'
import { GRID, type DashboardLayout, type FilterRule, type LinkageDim, type LinkageState, type WidgetActions, type WidgetEntity, type WidgetScope } from './types.js'
import { WIDGET_REGISTRY, WIDGET_CATALOG, DEFAULT_LAYOUT, FIELD_WHITELIST, todayIso, rawListFor, knownWidgetTypeSet } from './widgets.js'
import { CrossProjectPeople } from '../panel.js'
import { resolveDashboard, resolveProjectDashboard, dashboardScopeFor, loadDashboard, parseLayout, registerKnownWidgetTypes } from './persist.js'
import { appendQueueCard } from './layout-append.js'
import { PROJECT_DEFAULT_LAYOUT } from './project-default-layout.js'
import { refreshAndConfirm } from './refresh-confirm.js'
import { selectEntity, applyFilter } from './query.js'
import { getFormulaEngine, loadFormulaEngine, type FormulaResult } from './formula.js'
import { projectToBreakpoint, breakpointForWidth, reverseFromBreakpoint, findCanonicalCollisions, compactDisplayCollisions, boardBreakpointForWidth } from './projection.js'
import { buildMigrationSummary, migrationSignature, isMigrationRead, markMigrationRead, parseMigrationReadMap, type MigrationReadMap } from './migration-banner.js'
import boardCss from './board.css?raw'
// type-only：编辑器块不被静态打包，仅取类型。
import type { BoardEditorProps } from './editor.js'

export interface BoardPersistence {
  onSave: (scope: string, layout: DashboardLayout) => Promise<void>
  onReset: (scope: string) => Promise<void>
}

export function BoardBento({ data, actions, persistence, projectId }: {
  data: Snapshot
  actions: WidgetActions
  persistence: BoardPersistence
  /** 项目概览传入当前项目 id：持久化走 project:<id>，初始读 byProject[projectId]，不写旧全局。 */
  projectId?: string
}) {
  // R-B11：knownTypes 取 registry 同源 helper（直接迭代 Map.keys；Object.keys(Map) 恒为 []，
  // 会导致同步传入空 Set、11 类全被误判未知跳过）。
  const knownTypes = useMemo(() => knownWidgetTypeSet(), [])
  useEffect(() => { registerKnownWidgetTypes(knownTypes) }, [knownTypes])
  // 项目级持久化 scope：projectId → `project:<id>`，全局总览 → `user`。
  const activeScope = useMemo(() => dashboardScopeFor(projectId), [projectId])
  // R-B11：首屏即显式传入 knownTypes（不依赖 registerKnownWidgetTypes 副作用），避免空集合误删全部卡。
  const [layout, setLayout] = useState<DashboardLayout>(() => projectId
    ? resolveProjectDashboard(data.dashboards?.byProject, projectId, data.dashboards?.project, PROJECT_DEFAULT_LAYOUT, knownTypes)
    : resolveDashboard(data.dashboards?.user, data.dashboards?.project, DEFAULT_LAYOUT, knownTypes))
  const [editing, setEditing] = useState(false)
  const [editorLoading, setEditorLoading] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [adopting, setAdopting] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  // R8：迁移反馈降级为中性 info 摘要（首屏 1–2 行白话，无 w-*/坐标）；技术明细默认折叠进次级「详情」。
  // 不提供「撤销」（history 仅保存后历史，不支持迁移前恢复，放假按钮即误导）。已读按签名 localStorage 持久。
  const [migDetail, setMigDetail] = useState<{ warnings: string[], skipped: string[] } | null>(null)
  const [migOpen, setMigOpen] = useState(false)
  const [migRead, setMigRead] = useState<MigrationReadMap>(() => {
    try { return parseMigrationReadMap(localStorage.getItem('pm-bento-mig-read')) } catch { return {} }
  })
  const persistMigRead = (next: MigrationReadMap) => {
    setMigRead(next)
    try { localStorage.setItem('pm-bento-mig-read', JSON.stringify(next)) } catch { /* 隐私模式忽略 */ }
  }

  // 会话内「上次成功保存」canonical 布局，供编辑器预览/恢复（落盘历史槽位另由 capability 评估）。
  const [savedLayout, setSavedLayout] = useState<DashboardLayout | null>(() => structuredClone(layout))

  // R-B11：旧布局经安全归一（未知类型跳过并列名、越界夹紧、碰撞下沉）后，迁移提示走中性 banner，不静默改写/重置。
  useEffect(() => {
    const raw = projectId
      ? (data.dashboards?.byProject?.[projectId] ?? data.dashboards?.project)
      : (data.dashboards?.user ?? data.dashboards?.project)
    const p = loadDashboard(raw, knownTypes)
    if (!p) return
    // 仅保存技术明细（夹紧/下沉/未知类型），白话摘要由 buildMigrationSummary 现算，不回显坐标/ID。
    if (p.warnings.length || p.skipped.length) {
      setMigDetail({ warnings: [...p.warnings], skipped: [...p.skipped] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knownTypes])

  // 浏览态断点投影：与编辑态同一 canonical→断点换算（契约 §3.6「浏览态=编辑态同一坐标换算」）。
  const rootRef = useRef<HTMLDivElement>(null)
  const [viewCols, setViewCols] = useState<number>(GRID.cols)
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => setViewCols(boardBreakpointForWidth(el.clientWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // 浏览态展示坐标：先做 canonical→断点投影，再做纯展示去碰撞（仅平移真正相交的卡，不落盘、不改 canonical）。
  const projected = useMemo(
    () => compactDisplayCollisions(projectToBreakpoint(layout.widgets, viewCols as 12 | 8 | 4 | 1)),
    [layout, viewCols],
  )
  /** 已存布局是否已含补记队列卡；缺省时在头部给显式新增入口（不静默改布局、不重排旧卡）。 */
  const hasQueueCard = layout.widgets.some(w => w.type === 'queueCard')

  const adoptQueueCard = async () => {
    setAdopting(true)
    try {
      const next = appendQueueCard(layout)
      // 先落盘（executeRaw 遇 command.kind=error 会 throw）；成功后刷新父快照。
      // 仅当落盘 + 快照刷新都成功，才 setLayout 并给成功提示，避免「成功假态、重进丢失」。
      await persistence.onSave(activeScope, next)
      // 缺失/undefined 刷新通道即抛错：不 setLayout、不给成功 banner（合同完整，即便现网恒注入）。
      if (typeof actions.refreshBoard !== 'function') {
        throw new Error('缺少看板快照刷新通道')
      }
      // 落盘成功后确认快照刷新；返回 false 即失败，调用方不给成功态。
      await refreshAndConfirm(actions.refreshBoard)
      setLayout(next)
      setBanner('已添加补记队列并保存到个人布局。')
    } catch (e) {
      setBanner('添加补记队列失败：' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setAdopting(false)
    }
  }
  /** P2-① 跨卡片联动筛选（临时态，不写盘）。 */
  const [linkage, setLinkage] = useState<LinkageState>({})
  const onLink = (dim: LinkageDim, value: string) => {
    setLinkage(prev => {
      const next = { ...prev }
      // 再点同值取消该维；否则设为新值。
      if (next[dim] === value) delete next[dim]
      else next[dim] = value
      return next
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editor, setEditor] = useState<{ BoardEditor: (props: BoardEditorProps) => React.ReactNode } | null>(null)

  // 公式引擎：若布局含公式卡，惰性加载 expr-eval 异步块，加载完触发重渲染。
  const needsFormula = useMemo(
    () => layout.widgets.some(w =>
      w.type === 'formulaCard' || (w.type === 'kpiMetric' && typeof w.config.formula === 'string' && w.config.formula.trim())),
    [layout],
  )
  const [engineReady, setEngineReady] = useState(() => getFormulaEngine() !== null)
  useEffect(() => {
    if (engineReady || !needsFormula) return
    let alive = true
    void loadFormulaEngine().then(() => { if (alive) setEngineReady(true) }).catch(() => {})
    return () => { alive = false }
  }, [needsFormula, engineReady])

  const evaluateFormula = getFormulaEngine() ?? undefined

  const startEdit = async () => {
    setBanner(null)
    setEditorError(null)
    setEditorLoading(true)
    try {
      const mod = await import('./editor.js')
      setEditor(mod)
      setEditing(true)
    } catch (e) {
      setEditorError('编辑器加载失败：' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setEditorLoading(false)
    }
  }

  const totalProjects = data.projects.length
  const activeProjects = data.projects.filter(p => p.status === 'active').length
  const openRisks = data.riskIssues.filter(r => r.status !== 'closed').length
  const doneTasks = data.tasks.filter(t => t.status === 'done').length
  const rate = data.tasks.length ? Math.round(doneTasks / data.tasks.length * 100) : 0

  // 渲染单张卡片（浏览/编辑共用同一渲染实现，不漂移）。
  const renderCard = (w: DashboardLayout['widgets'][number], isEditing: boolean) => {
    const desc = WIDGET_REGISTRY.get(w.type)
    if (!desc) return <div key={w.layout.i}/>
    return desc.render({ data, config: w.config, actions, isEditing, evaluateFormula, linkage: isEditing ? undefined : linkage, onLink: isEditing ? undefined : onLink })
  }

  // R8：迁移反馈派生——白话摘要 + 签名已读判断；技术明细仅在展开「详情」时渲染。
  const migSummary = migDetail ? buildMigrationSummary(migDetail.warnings, migDetail.skipped) : null
  const migSig = migDetail ? migrationSignature(migDetail.warnings, migDetail.skipped) : null
  const migVisible = !!migDetail && !!migSig && !isMigrationRead(migRead, migSig)

  return <div className="pm-bento" ref={rootRef}>
    <style>{boardCss}</style>
    <div className="pm-bento-head">
      <div className="pm-bento-stats">
        <span>项目总数 <b>{totalProjects}</b>（{activeProjects} 进行中）</span>
        <span>任务完成率 <b>{rate}%</b></span>
        <span>未关闭风险 <b>{openRisks}</b></span>
      </div>
      <div className="pm-bento-tools">
        {editing
          ? <span className="pm-bento-hint">编辑模式 · 保存后经 dsh-storage 落盘{saving ? '（保存中…）' : ''}</span>
          : <>
              {!hasQueueCard && (
                <button
                  type="button"
                  className="pm-bento-toolbtn"
                  onClick={() => void adoptQueueCard()}
                  disabled={adopting}
                  title="把补记队列卡追加到看板末尾空闲行，不移动已有卡片"
                >
                  {adopting ? '添加中…' : '＋ 添加补记队列'}
                </button>
              )}
              <button type="button" className="pm-bento-toolbtn" onClick={() => void startEdit()} disabled={editorLoading}>
                {editorLoading ? '加载编辑器…' : '布局编辑'}
              </button>
            </>}
      </div>
    </div>

    {!editing && Object.keys(linkage).length > 0 && (
      <div className="pm-linkbar">
        <span className="pm-linkbar-label">联动筛选</span>
        {(Object.entries(linkage) as [LinkageDim, string][]).map(([dim, value]) => (
          <span key={dim} className="pm-linkchip">
            {({ assignee: '执行人', status: '状态', priority: '优先级', project: '项目' } as Record<string,string>)[dim]}：{value}
            <button type="button" className="pm-linkchip-x" aria-label="清除"
              onClick={() => setLinkage(prev => { const n = { ...prev }; delete n[dim]; return n })}>×</button>
          </span>
        ))}
        <button type="button" className="pm-linkbar-clear" onClick={() => setLinkage({})}>全部清除</button>
      </div>
    )}
    {migVisible && migDetail && migSummary && (
      <div className="pm-mig" role="status" aria-label="布局自动调整说明">
        <div className="pm-mig-main">
          <span className="pm-mig-dot" aria-hidden="true" />
          <div className="pm-mig-text">
            <p className="pm-mig-title">{migSummary.title}</p>
            {migSummary.skippedNote && <p className="pm-mig-skip">{migSummary.skippedNote}</p>}
          </div>
          <div className="pm-mig-actions">
            <button
              type="button" className="pm-mig-detail-btn"
              onClick={() => setMigOpen(v => !v)}
              aria-expanded={migOpen} aria-controls="pm-mig-detail">
              {migOpen ? '收起详情' : '查看详情'}
            </button>
            <button
              type="button" className="pm-mig-close"
              aria-label="关闭迁移提示"
              onClick={() => { if (migSig) persistMigRead(markMigrationRead(migRead, migSig)) }}>
              关闭
            </button>
          </div>
        </div>
        {migOpen && (
          <div className="pm-mig-detail" id="pm-mig-detail">
            {migDetail.warnings.map((n, i) => <div key={`w${i}`}>· {n}</div>)}
            {migDetail.skipped.map((s, i) => <div key={`s${i}`}>· 无法识别的卡片类型：{s}</div>)}
          </div>
        )}
      </div>
    )}
    {(banner || editorError) && (
      <div className="pm-bento-validation" role="alert">
        <span>{editorError ?? banner}</span>
        <button type="button" className="pm-bento-validation-x" onClick={() => { setBanner(null); setEditorError(null) }} aria-label="关闭">×</button>
      </div>
    )}

    {editing && editor
      ? <editor.BoardEditor
          initialLayout={layout}
          data={data}
          actions={actions}
          catalog={WIDGET_CATALOG}
          fieldWhitelist={FIELD_WHITELIST}
          grid={GRID}
          projection={{ projectToBreakpoint, breakpointForWidth, reverseFromBreakpoint, findCanonicalCollisions }}
          parseLayout={parseLayout}
          renderCard={renderCard}
          onTrial={(formula, entity, projectScope, filters) => trialFormula(data, formula, entity, projectScope, filters)}
          onImportText={(text) => {
            try {
              const layout = parseLayout(JSON.parse(text))
              if (!layout) return { ok: false, error: '导入失败：布局结构不合法或版本不受支持' }
              for (let i = 0; i < layout.widgets.length; i++) {
                const w = layout.widgets[i]
                if (!WIDGET_REGISTRY.has(w.type)) return { ok: false, error: `导入失败：widgets[${i}].type=${w.type} 未知` }
              }
              return { ok: true, layout }
            } catch {
              return { ok: false, error: '导入失败：JSON 解析错误' }
            }
          }}
          onExit={() => setEditing(false)}
          savedLayout={savedLayout ?? undefined}
          onSave={async (scope, final) => {
            setSaving(true)
            // R-B8 两步保存：先落盘，再确认快照刷新成功，才 setLayout + 成功提示；任一步失败不给成功假态。
            try {
              await persistence.onSave(activeScope, final)
              if (typeof actions.refreshBoard !== 'function') throw new Error('缺少看板快照刷新通道')
              await refreshAndConfirm(actions.refreshBoard)
              setLayout(final)
              setSavedLayout(structuredClone(final))
              setBanner('布局已保存并刷新。')
            } catch (e) {
              setBanner('保存失败，未落盘：' + (e instanceof Error ? e.message : String(e)))
              throw e
            } finally { setSaving(false) }
          }}
          onReset={async () => {
            // R-B9：重置同样走刷新闸门；失败不本地回退成「假成功」。项目级只重置 project:<id>，不碰旧全局。
            await persistence.onReset(activeScope)
            if (typeof actions.refreshBoard === 'function') await refreshAndConfirm(actions.refreshBoard)
            const resolved = projectId
              ? resolveProjectDashboard(data.dashboards?.byProject, projectId, data.dashboards?.project, PROJECT_DEFAULT_LAYOUT, knownTypes)
              : resolveDashboard(data.dashboards?.user, data.dashboards?.project, DEFAULT_LAYOUT, knownTypes)
            setLayout(resolved)
            setSavedLayout(structuredClone(resolved))
            setBanner('已恢复默认布局。')
          }}
        />
      : <div className="pm-bento-grid pm-bento-grid-static" style={{ gridTemplateColumns: `repeat(${viewCols}, minmax(0, 1fr))` }}>
          {projected.map(p => {
            const w = layout.widgets.find(x => x.layout.i === p.i)
            if (!w) return null
            return <div key={p.i} className="pm-bento-static-slot" data-widget-id={p.i} style={{
              gridColumn: `${p.x + 1} / span ${p.w}`,
              gridRow: `${p.y + 1} / span ${p.h}`,
              height: (p.h * GRID.rowHeight) + ((p.h - 1) * GRID.margin[1]),
            }}>
              {renderCard(w, false)}
            </div>
          })}
        </div>}

    <div aria-hidden style={{ display: 'none' }}>
      <CrossProjectPeople data={data} onPickProject={actions.pickProject} onOpenRecord={actions.openRecord}/>
    </div>
  </div>
}

/** 配置面板「试算」：主包用 query.ts + 公式引擎算结果，返回展示串（编辑器块不直接依赖 expr）。 */
function trialFormula(
  data: Snapshot, formula: string, entity: string, projectScope: string, filters: FilterRule[],
): string {
  const entityTyped = entity as WidgetEntity
  const rows = selectEntity(data, entityTyped)
  const rawList = rawListFor(data, entityTyped)
  const filtered = applyFilter(data, entityTyped, rows, rawList, projectScope, filters)
  const engine = getFormulaEngine()
  if (!engine) return '公式引擎加载中…'
  const r: FormulaResult = engine(formula, { rows: filtered as unknown as Record<string, unknown>[], today: todayIso() })
  return r.ok ? `= ${String(r.value)}` : `✗ ${r.error.message}`
}

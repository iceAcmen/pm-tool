/**
 * 可配置看板（浏览态主包）：
 *  - 浏览态：纯 CSS grid 静态渲染卡片，不加载 RGL/zod/expr-eval（首屏轻量）。
 *  - 编辑态：点「布局编辑」才异步加载 client.editor.js（RGL + 卡片库 + 配置面板 + zod 闸门）。
 *  - 公式卡：expr-eval 在 client.formula.js，首次需要时惰性加载；加载完成后同步渲染，口径与编辑态一致。
 *  - 持久化：初始布局取自 data.dashboards（user>project>默认）；保存/重置经回调走 dsh-storage。
 */
import React, { useEffect, useMemo, useState } from 'react'
import type { Snapshot } from '../panel.js'
import { GRID, type DashboardLayout, type FilterRule, type LinkageDim, type LinkageState, type WidgetActions, type WidgetEntity, type WidgetScope } from './types.js'
import { WIDGET_REGISTRY, WIDGET_CATALOG, DEFAULT_LAYOUT, FIELD_WHITELIST, todayIso, rawListFor } from './widgets.js'
import { CrossProjectPeople } from '../panel.js'
import { resolveDashboard, parseLayout } from './persist.js'
import { selectEntity, applyFilter } from './query.js'
import { getFormulaEngine, loadFormulaEngine, type FormulaResult } from './formula.js'
// type-only：编辑器块不被静态打包，仅取类型。
import type { BoardEditorProps } from './editor.js'

export interface BoardPersistence {
  onSave: (scope: WidgetScope, layout: DashboardLayout) => Promise<void>
  onReset: (scope: WidgetScope) => Promise<void>
}

export function BoardBento({ data, actions, persistence }: {
  data: Snapshot
  actions: WidgetActions
  persistence: BoardPersistence
}) {
  const [layout, setLayout] = useState<DashboardLayout>(() =>
    resolveDashboard(data.dashboards?.user, data.dashboards?.project, DEFAULT_LAYOUT))
  const [editing, setEditing] = useState(false)
  const [editorLoading, setEditorLoading] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
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

  return <div className="pm-bento">
    <div className="pm-bento-head">
      <div className="pm-bento-stats">
        <span>项目总数 <b>{totalProjects}</b>（{activeProjects} 进行中）</span>
        <span>任务完成率 <b>{rate}%</b></span>
        <span>未关闭风险 <b>{openRisks}</b></span>
      </div>
      <div className="pm-bento-tools">
        {editing
          ? <span className="pm-bento-hint">编辑模式 · 保存后经 dsh-storage 落盘{saving ? '（保存中…）' : ''}</span>
          : <button type="button" className="pm-bento-toolbtn" onClick={() => void startEdit()} disabled={editorLoading}>
              {editorLoading ? '加载编辑器…' : '布局编辑'}
            </button>}
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
          onSave={async (scope, final) => {
            setSaving(true)
            try {
              await persistence.onSave(scope, final)
              setLayout(final)
              setBanner(null)
            } catch (e) {
              setBanner('保存失败，未落盘：' + (e instanceof Error ? e.message : String(e)))
              throw e
            } finally { setSaving(false) }
          }}
          onReset={async (scope) => {
            await persistence.onReset(scope)
            // 重置后回退到内置默认（后端该作用域清空，重取 snapshot 前先本地回退）。
            setLayout(resolveDashboard(data.dashboards?.user, data.dashboards?.project, DEFAULT_LAYOUT))
          }}
        />
      : <div className="pm-bento-grid pm-bento-grid-static">
          {layout.widgets.map(w => (
            <div key={w.layout.i} style={{
              gridColumn: `${w.layout.x + 1} / span ${w.layout.w}`,
              gridRow: `${w.layout.y + 1} / span ${w.layout.h}`,
              minHeight: (w.layout.h * GRID.rowHeight) + ((w.layout.h - 1) * GRID.margin[1]),
            }}>
              {renderCard(w, false)}
            </div>
          ))}
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

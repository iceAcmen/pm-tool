/**
 * 可配置看板渲染：浏览态静态栅格对齐，编辑态 RGL 可拖拽移动 + 手柄 resize。
 * 布局来自内置默认（DEFAULT_LAYOUT）或 user 持久化（localStorage），顶部「布局编辑」切换。
 */
import React, { useMemo, useState } from 'react'
import RGL, { WidthProvider, type Layout } from 'react-grid-layout'
import type { Snapshot } from '../panel.js'
import { GRID, type DashboardLayout, type WidgetActions } from './types.js'
import { WIDGET_REGISTRY, DEFAULT_LAYOUT } from './widgets.js'
import { CrossProjectPeople } from '../panel.js'
import { loadUserLayout, saveUserLayout, resetUserLayout } from './persist.js'

const GridLayout = WidthProvider(RGL)

export function BoardBento({ data, actions }: { data: Snapshot, actions: WidgetActions }) {
  const [base] = useState<DashboardLayout>(() => loadUserLayout(DEFAULT_LAYOUT))
  const [layout, setLayout] = useState<DashboardLayout>(base)
  const [editing, setEditing] = useState(false)
  // 编辑中尚未保存的草稿；保存才落 localStorage。
  const [draft, setDraft] = useState<DashboardLayout | null>(null)

  const live = draft ?? layout
  const rglLayout: Layout[] = useMemo(
    () => live.widgets.map(w => ({
      i: w.layout.i, x: w.layout.x, y: w.layout.y, w: w.layout.w, h: w.layout.h,
      minW: w.layout.minW, minH: w.layout.minH, static: !editing,
    })),
    [live, editing],
  )

  const totalProjects = data.projects.length
  const activeProjects = data.projects.filter(p => p.status === 'active').length
  const openRisks = data.riskIssues.filter(r => r.status !== 'closed').length
  const totalTasks = data.tasks.length
  const doneTasks = data.tasks.filter(t => t.status === 'done').length
  const rate = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0

  const startEdit = () => { setDraft(layout); setEditing(true) }
  const saveEdit = () => { if (draft) { saveUserLayout(draft); setLayout(draft) } setDraft(null); setEditing(false) }
  const cancelEdit = () => { setDraft(null); setEditing(false) }
  const resetDefault = () => { resetUserLayout(); setLayout(DEFAULT_LAYOUT); setDraft(DEFAULT_LAYOUT) }

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
              <button type="button" className="pm-bento-toolbtn" onClick={resetDefault}>恢复默认</button>
              <button type="button" className="pm-bento-toolbtn" onClick={cancelEdit}>取消</button>
              <button type="button" className="pm-button-primary" onClick={saveEdit}>保存布局</button>
            </>
          : <button type="button" className="pm-bento-toolbtn" onClick={startEdit}>布局编辑</button>}
      </div>
    </div>
    <div className={`pm-bento-grid ${editing ? 'pm-rgl-editing' : ''}`}>
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
          return <div key={w.layout.i} className="pm-rgl-item-wrap">
            {desc.render({ data, config: w.config, actions, isEditing: editing })}
          </div>
        })}
      </GridLayout>
    </div>
    {/* 完整跨项目人员视图（搜索/筛选/排序/展开任务行）保持可达：
        浏览态视觉以 peopleLoad 紧凑条为准；此处隐藏挂载，保留既有锚点与行为契约。 */}
    <div aria-hidden style={{ display: 'none' }}>
      <CrossProjectPeople data={data} onPickProject={actions.pickProject} onOpenRecord={actions.openRecord}/>
    </div>
  </div>
}

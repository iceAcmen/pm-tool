import { useEffect, useMemo, useRef, useState } from 'react'
import { flattenVisible, indexChildren } from '../../core/task-tree.js'
import { buildUpdate } from '../../core/task-inline.js'
import { blockingPredecessors, localTodayIso, isTaskOverdue, isTaskDueWithin, isTaskAtRisk } from '../../core/derived.js'
import { clampProgress } from '../../core/progress-derivation.js'
import { tasksToCsv, tasksToMarkdown, tasksToJson, buildTaskSnapshotHtml, type TaskExportCtx } from '../../core/task-export.js'
import { downloadText } from '../download.js'
import { shouldHandleGlobalKbd, nextRowId } from '../../core/ui-feedback.js'
import { panelKeyboard, fromKeyboardEvent } from '../../core/panel-kbd.js'
import type { DiagnosisBubble } from '../../core/suggestion-engine.js'
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical.mjs'
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs'
import Plus from 'lucide-react/dist/esm/icons/plus.mjs'
import Search from 'lucide-react/dist/esm/icons/search.mjs'
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.mjs'
import ListFilter from 'lucide-react/dist/esm/icons/list-filter.mjs'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.mjs'
import FileText from 'lucide-react/dist/esm/icons/file-text.mjs'
import ListTree from 'lucide-react/dist/esm/icons/list-tree.mjs'
import Flag from 'lucide-react/dist/esm/icons/flag.mjs'
import Bookmark from 'lucide-react/dist/esm/icons/bookmark.mjs'
import BookmarkPlus from 'lucide-react/dist/esm/icons/bookmark-plus.mjs'
import Check from 'lucide-react/dist/esm/icons/check.mjs'
import Star from 'lucide-react/dist/esm/icons/star.mjs'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs'
import Settings2 from 'lucide-react/dist/esm/icons/settings-2.mjs'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.mjs'
import X from 'lucide-react/dist/esm/icons/x.mjs'
import Download from 'lucide-react/dist/esm/icons/download.mjs'
import Share2 from 'lucide-react/dist/esm/icons/share-2.mjs'
import {
  DEFAULT_VIEW_STATE,
  VIEW_CHIP_OPTIONS,
  VIEW_SORT_OPTIONS,
  deleteTaskView,
  describeTaskViewState,
  findTaskView,
  listAllViews,
  renameTaskView,
  resolveDefaultTaskView,
  sameTaskViewState,
  saveTaskView,
  setDefaultTaskView,
  type SavedTaskView,
  type TaskViewChip,
  type TaskViewSort,
  type TaskViewState,
  type TaskViewsStore,
} from '../../core/task-views.js'
import { loadTaskViews, newCustomViewId, persistTaskViews } from './task-views-persist.js'
import type { Task, Milestone, Run } from './types.js'
import css from './tasks.css?raw'

const taskStatus: Record<string, string> = {
  todo: '未开始',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
}

type ChipKey = TaskViewChip

// P2-5：chip/排序选项与 core/task-views 同源（口径不变，仅去重）。
const CHIPS = VIEW_CHIP_OPTIONS
const SORT_OPTIONS = VIEW_SORT_OPTIONS

function arrayBufferToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

/** 移动父级弹窗：选中后调复合命令 move --renumber confirm；关闭即取消（零写）。 */
function MovePickerModal({ task, tasks, onChoose, onClose }: {
  task: Task
  tasks: Task[]
  onChoose: (parentRef: string) => void
  onClose: () => void
}) {
  const excluded = useMemo(() => {
    const ex = new Set<string>([task.id])
    const byParent = new Map<string, string[]>()
    for (const t of tasks) {
      if (t.parentId) {
        const l = byParent.get(t.parentId) ?? []
        l.push(t.id); byParent.set(t.parentId, l)
      }
    }
    const queue = [task.id]
    while (queue.length) {
      const cur = queue.shift()!
      for (const child of byParent.get(cur) ?? []) if (!ex.has(child)) { ex.add(child); queue.push(child) }
    }
    return ex
  }, [task.id, tasks])

  const candidates = useMemo(
    () => flattenVisible(tasks, new Set()).filter(row => !excluded.has(row.task.id)),
    [tasks, excluded],
  )

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.pt-move-opt')?.focus())
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { ev.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [onClose])

  return (
    <div className="pt-move-mask" onClick={onClose}>
      <div className="pt-move" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <header>移动「{task.title}」到…（移动后自动重排 WBS 编号）</header>
        <button className="pt-move-opt" onClick={() => onChoose('root')}>根层级</button>
        {candidates.map(row => (
          <button
            key={row.task.id}
            className="pt-move-opt"
            style={{ paddingLeft: `${12 + row.depth * 16}px` }}
            onClick={() => onChoose(row.task.id)}
          >{row.task.code} {row.task.title}</button>
        ))}
      </div>
    </div>
  )
}

/** P2-5 另存为命名视图弹窗：命名 + 展示将保存的四态摘要；空名禁止提交，关闭即取消（零写）。 */
function SaveViewModal({ initialName, summary, onCancel, onConfirm }: {
  initialName: string
  summary: string
  onCancel: () => void
  onConfirm: (name: string) => void
}) {
  const [name, setName] = useState(initialName)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.pt-save-name')?.focus())
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { ev.stopPropagation(); onCancel() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [onCancel])
  const submit = () => { if (name.trim()) onConfirm(name.trim()) }
  return (
    <div className="pm-modal-mask" onClick={onCancel}>
      <div className="pt-vm pt-save" role="dialog" aria-modal="true" aria-label="保存视图" onClick={e => e.stopPropagation()}>
        <header>保存视图<button type="button" className="pt-vm-x" aria-label="关闭" onClick={onCancel}><X size={15} /></button></header>
        <label className="pt-save-field">
          <span>视图名称</span>
          <input
            className="pt-save-name" value={name} placeholder="例如：本周重点 · 按优先级" aria-label="视图名称"
            onChange={e => setName(e.currentTarget.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
          />
        </label>
        <div className="pt-save-state">
          <span className="pt-save-state-label">随视图一并保存的状态</span>
          <span className="pt-save-chip">{summary}</span>
        </div>
        <footer className="pt-vm-foot">
          <button type="button" className="pt-ghost" onClick={onCancel}>取消</button>
          <button type="button" className="pt-primary" disabled={!name.trim()} onClick={submit}>
            <BookmarkPlus size={14} />保存视图
          </button>
        </footer>
      </div>
    </div>
  )
}

/** P1-7 只读诊断气泡：附着在对应任务行下方，绝不写盘、不覆盖数据。 */
export function DiagnosisBubbleView({ bubble, onDismiss }: {
  bubble: DiagnosisBubble
  onDismiss?: (id: string) => void
}) {
  return (
    <div className={`pm-diagnosis-bubble pm-diag-${bubble.kind}`} role="note">
      <span className="pm-diag-bar" />
      <Sparkles size={15} className="pm-diag-ico" />
      <div className="pm-diag-body">
        <span className="pm-diag-tag">{bubble.tag}</span>
        <span className="pm-diag-title">{bubble.title}</span>
        <span className="pm-diag-text">{bubble.text}</span>
      </div>
      {onDismiss && <button type="button" className="pm-diag-x" aria-label="关闭诊断" onClick={() => onDismiss(bubble.id)}>×</button>}
    </div>
  )
}

export function TaskTable(props: {
  tasks: Task[]
  milestones: Milestone[]
  disabled?: boolean
  onCreate: () => void
  onEdit: (task: Task) => void
  onGenWbs: () => void
  onSaved: () => void
  run: Run
  execute: (line: string) => Promise<string>
  projectId: string
  /** 项目名（导出/快照标题用，panel 接线注入；缺省走空串兜底）。 */
  projectName?: string
  /** P1-6：全局密度偏好（localStorage pm-density），由 shell 持有并下发；根容器 data-density 生效。 */
  density?: 'comfortable' | 'compact'
  onDensityChange?: (d: 'comfortable' | 'compact') => void
  overlayOpen?: boolean
  /** P1-7 规则诊断气泡（只在任务行旁渲染，只读、不落库）。 */
  diagnosis?: DiagnosisBubble[]
  onDismissDiagnosis?: (id: string) => void
}) {
  const {
    tasks, milestones, disabled = false, onCreate, onEdit,
    onGenWbs, onSaved, run, execute, projectId, projectName = '', density = 'comfortable', onDensityChange, overlayOpen,
    diagnosis = [], onDismissDiagnosis,
  } = props

  // P2-5：命名视图。首挂载按项目默认视图恢复四态；boot 只取一次，后续切换由 effect 驱动。
  const [boot] = useState(() => {
    const store = loadTaskViews(projectId)
    return { store, def: resolveDefaultTaskView(store) }
  })
  const [viewsStore, setViewsStore] = useState<TaskViewsStore>(boot.store)
  const [activeViewId, setActiveViewId] = useState<string | null>(boot.def?.id ?? null)
  const [query, setQuery] = useState(boot.def?.state.query ?? DEFAULT_VIEW_STATE.query)
  const [chip, setChip] = useState<TaskViewChip>(boot.def?.state.chip ?? DEFAULT_VIEW_STATE.chip)
  const [grouped, setGrouped] = useState(boot.def?.state.grouped ?? DEFAULT_VIEW_STATE.grouped)
  const [sort, setSort] = useState<TaskViewSort>(boot.def?.state.sort ?? DEFAULT_VIEW_STATE.sort)
  // P2-5：视图切换菜单 / 另存为弹窗 / 管理弹窗的开合态。
  const [menuOpen, setMenuOpen] = useState(false)
  // 导出下拉（Markdown/CSV/JSON）开合态，与视图切换器同构：点外部 / Esc 关闭。
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement | null>(null)
  const [saveModal, setSaveModal] = useState<string | null>(null)
  const [manageOpen, setManageOpen] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [movePickerFor, setMovePickerFor] = useState<Task | null>(null)
  const [importPreview, setImportPreview] = useState<{ text: string, confirm: string } | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeRef = useRef<HTMLDivElement | null>(null)

  const byId = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks])
  const childMap = useMemo(() => indexChildren(tasks), [tasks])
  // P2-5 风险视图：按 milestoneId 关联里程碑，供 isTaskAtRisk 判断里程碑是否延期。
  const milestoneById = useMemo(() => new Map(milestones.map(m => [m.id, m])), [milestones])

  // P1-5：逾期唯一纯谓词（core/derived isTaskOverdue），today 用本地日历日 localTodayIso()。
  const isLate = (t: Task) => isTaskOverdue(t, localTodayIso())
  const isDone = (t: Task) => t.status === 'done' || (t.progress ?? 0) >= 100

  // 筛选：搜索 + 快捷 chips
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase()
    return tasks.filter(task => {
      if (q && !`${task.code} ${task.title} ${task.assignee}`.toLocaleLowerCase().includes(q)) return false
      switch (chip) {
        case 'in_progress': return task.status === 'in_progress'
        case 'done': return isDone(task)
        case 'overdue': return isLate(task)
        case 'mine': return !!task.assignee
        // P2-5 复合谓词内置视图（不进顶部快捷栏，仅切换器选中）。
        case 'due_week': return isTaskDueWithin(task, localTodayIso(), 7)
        case 'risk': return isTaskAtRisk(task, localTodayIso(), task.milestoneId ? milestoneById.get(task.milestoneId) : undefined)
        default: return true
      }
    })
  }, [tasks, query, chip, milestones, milestoneById]) // eslint-disable-line react-hooks/exhaustive-deps

  // 排序（与旧实现一致：组内/扁平视图生效；树视图由 flattenVisible 按 WBS 序）
  const priorityRank = (p: string) => ({ P0: 0, P1: 1, P2: 2 }[p] ?? 3)
  const visible = useMemo(() => {
    const arr = [...filtered]
    if (sort === 'dueDate') arr.sort((a, b) => String(a.dueDate ?? '9999').localeCompare(String(b.dueDate ?? '9999')))
    else if (sort === 'priority') arr.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    else if (sort === 'progress') arr.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))
    else arr.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }))
    return arr
  }, [filtered, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  // 顶部快捷栏只展示前五项；due_week/risk 计数仅为类型完备（不渲染、不改动栏位）。
  const chipCounts = useMemo<Record<TaskViewChip, number>>(() => ({
    all: tasks.length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(isDone).length,
    overdue: tasks.filter(isLate).length,
    mine: tasks.filter(t => t.assignee).length,
    due_week: tasks.filter(t => isTaskDueWithin(t, localTodayIso(), 7)).length,
    risk: tasks.filter(t => isTaskAtRisk(t, localTodayIso(), t.milestoneId ? milestoneById.get(t.milestoneId) : undefined)).length,
  }), [tasks, milestoneById]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- P2-5：命名视图（过滤/排序/分组/搜索四态持久化与恢复）----
  const switcherRef = useRef<HTMLDivElement | null>(null)
  const activeView = findTaskView(viewsStore, activeViewId)
  const currentState: TaskViewState = { query, chip, grouped, sort }
  const dirty = activeView ? !sameTaskViewState(currentState, activeView.state) : true
  const allViews = listAllViews(viewsStore)

  // ---- 导出 / 分享：仅取当前过滤+排序后的 visible，本地日历生成，core 不碰墙钟 ----
  const buildExportCtx = (): TaskExportCtx => ({
    projectName,
    viewName: activeView?.name ?? '未命名视图',
    filterSummary: describeTaskViewState(currentState),
    generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    today: localTodayIso(),
    milestoneTitle: (id) => milestoneById.get(id)?.title,
  })
  const exportFileBase = () => {
    const safe = (projectName || '未命名项目').replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '') || '任务'
    return `${safe}-任务-${localTodayIso()}`
  }
  const exportAs = (kind: 'md' | 'csv' | 'json') => {
    const ctx = buildExportCtx()
    const base = exportFileBase()
    if (kind === 'md') downloadText(`${base}.md`, tasksToMarkdown(visible, ctx), 'text/markdown;charset=utf-8')
    else if (kind === 'csv') downloadText(`${base}.csv`, tasksToCsv(visible, ctx), 'text/csv;charset=utf-8')
    else downloadText(`${base}.json`, JSON.stringify(tasksToJson(visible, ctx), null, 2), 'application/json;charset=utf-8')
    setExportOpen(false)
  }
  const shareSnapshot = () => {
    const ctx = buildExportCtx()
    downloadText(`${exportFileBase()}.html`, buildTaskSnapshotHtml(visible, ctx), 'text/html;charset=utf-8')
  }

  const commitStore = (next: TaskViewsStore) => {
    setViewsStore(next)
    persistTaskViews(projectId, next)
  }

  const applyView = (v: SavedTaskView) => {
    setQuery(v.state.query)
    setChip(v.state.chip)
    setGrouped(v.state.grouped)
    setSort(v.state.sort)
    setActiveViewId(v.id)
    setMenuOpen(false)
  }

  /** 更新当前自定义视图（覆盖保存四态）；内置视图不可更新，走另存为。 */
  const updateActiveView = () => {
    if (!activeView || activeView.builtin) return
    commitStore(saveTaskView(viewsStore, { id: activeView.id, name: activeView.name, state: currentState }))
    setMenuOpen(false)
  }

  const confirmSaveAs = (name: string) => {
    const id = newCustomViewId()
    commitStore(saveTaskView(viewsStore, { id, name, state: currentState }))
    setActiveViewId(id)
    setSaveModal(null)
  }

  const handleRename = (id: string, name: string) => {
    commitStore(renameTaskView(viewsStore, id, name))
    setRenamingId(null)
    setRenameDraft('')
  }

  const handleSetDefault = (id: string) => commitStore(setDefaultTaskView(viewsStore, id))

  const handleDelete = (id: string) => {
    const target = findTaskView(viewsStore, id)
    if (!target || target.builtin) return
    if (!window.confirm(`删除视图「${target.name}」？此操作只移除保存，不影响任务数据。`)) return
    commitStore(deleteTaskView(viewsStore, id))
    if (activeViewId === id) setActiveViewId(null)
  }

  // 切换项目：按项目键重新加载并恢复默认视图，避免串视图。
  useEffect(() => {
    const store = loadTaskViews(projectId)
    setViewsStore(store)
    const def = resolveDefaultTaskView(store)
    if (def) {
      setQuery(def.state.query)
      setChip(def.state.chip)
      setGrouped(def.state.grouped)
      setSort(def.state.sort)
      setActiveViewId(def.id)
    } else {
      setQuery(DEFAULT_VIEW_STATE.query)
      setChip(DEFAULT_VIEW_STATE.chip)
      setGrouped(DEFAULT_VIEW_STATE.grouped)
      setSort(DEFAULT_VIEW_STATE.sort)
      setActiveViewId(null)
    }
    setMenuOpen(false)
    setManageOpen(false)
    setSaveModal(null)
    setRenamingId(null)
  }, [projectId])

  // 菜单：点击外部 / Escape 关闭（不依赖 hover）。
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (ev: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(ev.target as Node)) setMenuOpen(false)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // 导出菜单：点击外部 / Escape 关闭（与视图切换器同构）。
  useEffect(() => {
    if (!exportOpen) return
    const onDown = (ev: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(ev.target as Node)) setExportOpen(false)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setExportOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [exportOpen])

  // 按状态分组（PROD-01）：按 taskStatus 键序 todo/in_progress/blocked/done 扁平分组
  const statusGroups = useMemo(() =>
    Object.keys(taskStatus).map(value => ({
      key: value,
      label: taskStatus[value],
      rows: visible.filter(task => task.status === value),
    })).filter(group => group.rows.length),
  [visible])

  const treeRows = useMemo(() => flattenVisible(visible, collapsed), [visible, collapsed])
  const renderedIds = useMemo(
    () => grouped
      ? statusGroups.flatMap(g => g.rows.map(t => t.id))
      : treeRows.map(r => r.task.id),
    [grouped, statusGroups, treeRows],
  )
  const effectiveActiveId = activeId && renderedIds.includes(activeId) ? activeId : (renderedIds[0] ?? null)

  const toggleCollapse = (id: string) => setCollapsed(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const focusRow = (id: string) => { if (renderedIds.includes(id)) setActiveId(id) }

  // 键盘导航：j/k 移动、空格勾选、Enter 打开、Del 批量删除（与旧实现一致）
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (!shouldHandleGlobalKbd({
        key: ev.key,
        targetTag: (ev.target as HTMLElement | null)?.tagName,
        targetEditable: (ev.target as HTMLElement | null)?.getAttribute?.('contenteditable') != null,
        ctrl: ev.ctrlKey, meta: ev.metaKey, alt: ev.altKey,
        overlayOpen: overlayOpen || movePickerFor != null || importPreview != null,
      })) return
      const action = panelKeyboard(fromKeyboardEvent(ev))
      if (!action) return
      ev.preventDefault()
      if (action.type === 'move') {
        const nextId = nextRowId(renderedIds, effectiveActiveId, action.delta)
        if (nextId) setActiveId(nextId)
      } else if (action.type === 'toggleActive') {
        const row = byId.get(effectiveActiveId ?? '')
        if (row) toggleSelect(row.id)
      } else if (action.type === 'deleteSelected') {
        confirmBatchDelete()
      } else if (action.type === 'openActive') {
        const row = byId.get(effectiveActiveId ?? '')
        if (row) onEdit(row)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (effectiveActiveId) activeRef.current
      ?.querySelector(`[data-pm-row="${CSS.escape(effectiveActiveId)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [effectiveActiveId])

  const batchIds = [...selected].join(',')
  const confirmBatchDelete = () => {
    if (!selected.size) return
    void run(`task batch delete ${batchIds}`).then(() => {
      if (window.confirm(`将级联删除所选 ${selected.size} 个任务及其全部后代（旁支保留），确定继续吗？`)) {
        void run(`task batch delete ${batchIds} confirm`).then(ok => {
          if (ok) { setSelected(new Set()); onSaved() }
        })
      }
    })
  }

  /** 统计某父任务下后代任务的完成数。 */
  const stageCount = (rootId: string) => {
    let total = 0, done = 0
    const queue = [...(childMap.get(rootId) ?? [])]
    while (queue.length) {
      const id = queue.shift()!
      total++
      const t = byId.get(id)
      if (t && isDone(t)) done++
      queue.push(...(childMap.get(id) ?? []))
    }
    return { total, done }
  }

  const assigneeColor = (name: string) => {
    let h = 0
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
    return h % 2 === 0 ? '' : 'alt'
  }

  const leafRow = (row: { task: Task, depth: number, hasChildren: boolean }) => {
    const t = row.task
    const late = isLate(t)
    const milestone = milestones.find(m => m.id === t.milestoneId)
    const blocking = blockingPredecessors(t, byId)
    const diag = diagnosis.find(d => d.targetId === t.id)
    return <>
      <div
        className={`pt-grid pt-row pm-task-row${effectiveActiveId === t.id ? ' pt-active' : ''}`}
        data-pm-row={t.id}
        onPointerDown={e => {
          if (!(e.target as HTMLElement).closest('button,select,input,a,textarea')) focusRow(t.id)
        }}
      >
        <div className="pt-cell pt-sel">
          <input
            type="checkbox" className="pm-row-select" aria-label={`选择 ${t.title}`}
            checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)}
          />
        </div>
        <div className="pt-cell pt-gutter">
          <button
            className="pt-grip" title="移动到…" aria-label={`移动 ${t.title}`}
            onClick={() => setMovePickerFor(t)}
          ><GripVertical size={15} /></button>
        </div>
        <div className="pt-cell pt-code">{t.code}</div>
        <div className="pt-cell pt-task">
          {row.hasChildren && (
            <button
              className={`pt-tri pm-task-toggle${collapsed.has(t.id) ? '' : ' open'}`}
              aria-label={collapsed.has(t.id) ? `展开 ${t.title}` : `折叠 ${t.title}`}
              onClick={() => toggleCollapse(t.id)}
            ><ChevronRight size={14} /></button>
          )}
          <button
            className={`pt-dot ${t.status === 'done' ? 'done' : t.status === 'in_progress' ? 'prog' : t.status === 'blocked' ? 'blocked' : 'todo'}`}
            data-done={t.status === 'done'} disabled={disabled}
            title={t.status === 'done' ? `重新打开 ${t.title}` : `完成 ${t.title}`}
            aria-label={t.status === 'done' ? `重新打开 ${t.title}` : `完成 ${t.title}`}
            onClick={() => void run(`task update ${t.id} ${JSON.stringify({
              status: t.status === 'done' ? 'todo' : 'done',
              progress: t.status === 'done' ? 0 : 100,
            })}`).then(ok => ok && onSaved())}
          />
          <button className="pt-name" data-done={t.status === 'done'} onClick={() => onEdit(t)}>
            {t.title}
          </button>
          <select
            className="pt-status pm-row-status" aria-label={`${t.title} 状态`} disabled={disabled}
            value={t.status}
            onChange={e => {
              const upd = buildUpdate({ status: e.currentTarget.value })
              if (!Object.keys(upd).length) return
              void run(`task update ${t.id} ${JSON.stringify(upd)}`).then(ok => ok && onSaved())
            }}
          >
            {Object.entries(taskStatus).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
          {blocking.length > 0 && (
            <span className="pt-wait" data-waiting-predecessor={blocking.length} title={`等待前置：${blocking.map(b => b.title).join('、')}`}>
              等待前置×{blocking.length}
            </span>
          )}
          {milestone && (
            <span className="pt-milestone-chip" style={{ borderStyle: 'dashed' }} title={`关联里程碑：${milestone.title}（${milestone.targetDate ?? '未设定日期'}）`}>
              <Flag size={11} strokeWidth={2.2}/>{milestone.title}
            </span>
          )}
        </div>
        <div className="pt-cell pt-assignee">
          {t.assignee
            ? <><span className={`pt-av ${assigneeColor(t.assignee)}`}>{t.assignee.slice(0, 1)}</span>
              <span className="pt-aname">{t.assignee}</span></>
            : <><span className="pt-av ghost">–</span><span className="pt-aname none">未指派</span></>}
        </div>
        <div className="pt-cell pt-pri-cell">
          <span className={`pt-pri ${t.priority === 'P0' ? 'p0' : ''}`}>{t.priority || 'P2'}</span>
        </div>
        <div className={`pt-cell pt-due${late ? ' late' : ''}${t.status === 'done' ? ' done' : ''}`}>
          <input
            type="date" className="pm-row-due" aria-label={`${t.title} 截止日期`} disabled={disabled}
            value={t.dueDate ?? ''}
            onChange={e => {
              const upd = buildUpdate({ dueDate: e.currentTarget.value })
              if (!Object.keys(upd).length) return
              void run(`task update ${t.id} ${JSON.stringify(upd)}`).then(ok => ok && onSaved())
            }}
          />
        </div>
        <div className="pt-cell pt-prog">
          <span className="pt-bar"><i style={{ width: `${clampProgress(t.progress)}%` }} /></span>
          <input
            className="pt-pct pm-row-progress" aria-label={`${t.title} 进度`} disabled={disabled}
            type="number" min={0} max={100} step={10} value={clampProgress(t.progress)}
            onChange={e => {
              const upd = buildUpdate({ progress: e.currentTarget.value })
              if (!Object.keys(upd).length) return
              void run(`task update ${t.id} ${JSON.stringify(upd)}`).then(ok => ok && onSaved())
            }}
          />
        </div>
        <div className="pt-cell pt-acts">
          <button className="pt-iconbtn" title="编辑" aria-label={`编辑 ${t.title}`} onClick={() => onEdit(t)}>
            <Pencil size={15} />
          </button>
        </div>
      </div>
      {diag && <DiagnosisBubbleView bubble={diag} onDismiss={onDismissDiagnosis}/>}
    </>
  }

  const groupRow = (row: { task: Task, hasChildren: boolean }) => {
    const t = row.task
    const hasKids = row.hasChildren
    const open = hasKids && !collapsed.has(t.id)
    const { total, done } = stageCount(t.id)
    const countCls = total === 0 ? 'none' : done === total ? 'all' : ''
    return (
      <div className={`pt-grid pt-group${open ? ' open' : ''}`} data-pm-row={t.id}>
        <div className="pt-cell pt-sel" />
        <div className="pt-cell pt-gutter">
          {hasKids
            ? <button className={`pt-tri${open ? ' open' : ''}`} aria-label={open ? `折叠 ${t.title}` : `展开 ${t.title}`} onClick={() => toggleCollapse(t.id)}>
                <ChevronRight size={14} />
              </button>
            : null}
        </div>
        <div className="pt-cell" />
        <div className="pt-cell pt-gname">
          <button className="pt-name" style={{ cursor: 'pointer' }} onClick={() => onEdit(t)}>
            {t.title}
          </button>
          <span className={`pt-gcount ${countCls}`}>{total === 0 ? '无子任务' : `${done}/${total} 完成`}</span>
        </div>
        <div className="pt-cell pt-assignee">
          {t.assignee
            ? <><span className={`pt-av ${assigneeColor(t.assignee)}`}>{t.assignee.slice(0, 1)}</span>
              <span className="pt-aname">{t.assignee}</span></>
            : <span className="pt-aname none">未指派</span>}
        </div>
        <div className="pt-cell" />
        <div className={`pt-cell pt-due${isLate(t) ? ' late' : ''}`}>
          <span className="pt-gstage-meta">{t.dueDate || '—'}</span>
        </div>
        <div className="pt-cell pt-prog">
          <span className="pt-gstage-meta">{t.status === 'done' ? '已完成' : t.status === 'in_progress' ? '进行中' : t.progress ? `${clampProgress(t.progress)}%` : '待开始'}</span>
        </div>
        <div className="pt-cell pt-acts">
          <button className="pt-iconbtn" title="编辑阶段" aria-label={`编辑 ${t.title}`} onClick={() => onEdit(t)}>
            <Pencil size={15} />
          </button>
        </div>
      </div>
    )
  }

  /** 按状态分组模式的分组头（与阶段行同款 pt-group 样式，扁平、无折叠三角）。 */
  const statusGroupRow = (g: { key: string, label: string, rows: Task[] }) => (
    <div className="pt-grid pt-group open" key={g.key}>
      <div className="pt-cell pt-sel" />
      <div className="pt-cell pt-gutter" />
      <div className="pt-cell" />
      <div className="pt-cell pt-gname">
        <span className={`pt-dot ${g.key === 'done' ? 'done' : g.key === 'in_progress' ? 'prog' : g.key === 'blocked' ? 'blocked' : 'todo'}`} />
        {g.label}
        <span className="pt-gcount">{g.rows.length} 条</span>
      </div>
      <div className="pt-cell" />
      <div className="pt-cell" />
      <div className="pt-cell" />
      <div className="pt-cell pt-acts" />
    </div>
  )

  const totalTasks = tasks.length
  const doneTasks = tasks.filter(isDone).length

  return (
    <div className="pm-tasks-root" ref={activeRef}>
      <style>{css}</style>

      {movePickerFor && (
        <MovePickerModal
          task={movePickerFor} tasks={tasks} onClose={() => setMovePickerFor(null)}
          onChoose={async parentRef => {
            const ok = await run(`task move ${movePickerFor.id} ${parentRef} --renumber confirm`)
            if (ok) { setMovePickerFor(null); onSaved() }
          }}
        />
      )}

      {saveModal !== null && (
        <SaveViewModal
          initialName={saveModal}
          summary={describeTaskViewState(currentState)}
          onCancel={() => setSaveModal(null)}
          onConfirm={confirmSaveAs}
        />
      )}

      {manageOpen && (
        <div className="pm-modal-mask" onClick={() => { setManageOpen(false); setRenamingId(null) }}>
          <div className="pt-vm" role="dialog" aria-modal="true" aria-label="管理命名视图" onClick={e => e.stopPropagation()}>
            <header>管理视图
              <button type="button" className="pt-vm-x" aria-label="关闭" onClick={() => { setManageOpen(false); setRenamingId(null) }}><X size={15} /></button>
            </header>
            <div className="pt-vm-list">
              {allViews.map(v => {
                const isDefault = viewsStore.defaultViewId === v.id
                const editing = renamingId === v.id
                return (
                  <div className="pt-vm-row" key={v.id}>
                    <div className="pt-vm-main">
                      {editing ? (
                        <input
                          className="pt-vm-rename-input" autoFocus value={renameDraft} aria-label={`重命名 ${v.name}`}
                          onChange={e => setRenameDraft(e.currentTarget.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRename(v.id, renameDraft)
                            if (e.key === 'Escape') { setRenamingId(null); setRenameDraft('') }
                          }}
                        />
                      ) : (
                        <span className="pt-vm-name">
                          {v.name}
                          {isDefault && <span className="pt-vm-badge pt-vm-badge-default"><Star size={10} />默认</span>}
                          {v.builtin && <span className="pt-vm-badge pt-vm-badge-lock">内置 · 锁定</span>}
                        </span>
                      )}
                      <span className="pt-vm-cond">{describeTaskViewState(v.state)}</span>
                    </div>
                    <div className="pt-vm-acts">
                      {editing ? (
                        <>
                          <button type="button" className="pt-vm-act" onClick={() => handleRename(v.id, renameDraft)}>确认</button>
                          <button type="button" className="pt-vm-act" onClick={() => { setRenamingId(null); setRenameDraft('') }}>取消</button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button" className="pt-vm-act" disabled={v.builtin}
                            title={v.builtin ? '内置视图不可重命名' : '重命名'}
                            onClick={() => { setRenamingId(v.id); setRenameDraft(v.name) }}
                          >重命名</button>
                          <button
                            type="button" className="pt-vm-act" disabled={isDefault}
                            title={isDefault ? '已是默认视图' : '设为该项目默认起始视图'}
                            onClick={() => handleSetDefault(v.id)}
                          >设为默认</button>
                          <button
                            type="button" className="pt-vm-act pt-vm-del" disabled={v.builtin}
                            title={v.builtin ? '内置视图不可删除' : '删除该视图'}
                            onClick={() => handleDelete(v.id)}
                          ><Trash2 size={13} />删除</button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="pt-vm-note">内置视图仅可设为默认；自定义视图支持重命名 / 设默认 / 删除。管理只影响本地保存，不改动任务数据。</p>
          </div>
        </div>
      )}

      <div className="pt-head">
        <div className="pt-row1">
          <div className="pt-title">
            <h1>任务</h1>
            <div className="pt-sub">
              <b>{totalTasks} 项任务</b> · 已完成 {doneTasks} · 进行中 {tasks.filter(t => t.status === 'in_progress').length}
            </div>
          </div>
          <div className="pt-search">
            <Search size={15} />
            <input
              placeholder="搜索任务名称 / 编号…"
              value={query} onChange={e => setQuery(e.currentTarget.value)}
            />
          </div>
        </div>
        <div className="pt-toolbar">
          <div className="pt-viewleft">
            {/* P2-5：命名视图切换器（内置 + 自定义，默认标记，点击外部/Escape 关闭，不依赖 hover）。 */}
            <div className="pt-viewswitch" ref={switcherRef}>
              <button
                type="button" className="pt-ghost pt-viewswitch-btn"
                aria-haspopup="listbox" aria-expanded={menuOpen} aria-label="切换命名视图"
                onClick={() => setMenuOpen(v => !v)}
              >
                <Bookmark size={14} />
                <span className="pt-viewswitch-name">
                  {activeView ? activeView.name : '未命名视图'}
                  {activeView && dirty && <em className="pt-viewswitch-dirty">已修改</em>}
                </span>
                <ChevronDown size={13} className="pt-viewswitch-chev" />
              </button>
              {menuOpen && (
                <div className="pt-vmenu" role="listbox" aria-label="命名视图列表">
                  {allViews.map(v => {
                    const isActive = activeViewId === v.id
                    const isDefault = viewsStore.defaultViewId === v.id
                    return (
                      <button
                        key={v.id} type="button" role="option" aria-selected={isActive}
                        className={`pt-vmenu-item${isActive ? ' active' : ''}`}
                        onClick={() => applyView(v)}
                      >
                        <span className="pt-vmenu-check">{isActive && <Check size={14} />}</span>
                        <span className="pt-vmenu-main">
                          <span className="pt-vmenu-name">
                            {v.name}
                            {isDefault && <span className="pt-vmenu-star" title="默认视图"><Star size={11} /></span>}
                            {v.builtin && <span className="pt-vmenu-builtin">内置</span>}
                          </span>
                          <span className="pt-vmenu-cond">{describeTaskViewState(v.state)}</span>
                        </span>
                      </button>
                    )
                  })}
                  <div className="pt-vmenu-div" />
                  <button
                    type="button" className="pt-vmenu-go"
                    onClick={() => { setMenuOpen(false); setManageOpen(true) }}
                  ><Settings2 size={14} />管理视图…</button>
                </div>
              )}
            </div>
            <div className="pt-chips">
              {CHIPS.map(c => (
                <button
                  key={c.key} className={`pt-chip${chip === c.key ? ' active' : ''}`}
                  onClick={() => setChip(c.key)}
                >{c.label}<span className="n">{chipCounts[c.key]}</span></button>
              ))}
            </div>
          </div>
          <div className="pt-tools">
            {/* P2-5：当前为自定义视图 → 覆盖更新；否则另存为命名视图。 */}
            {activeView && !activeView.builtin ? (
              <button
                type="button" className="pt-ghost pm-save-view"
                aria-label={dirty ? `更新视图「${activeView.name}」` : `保存视图「${activeView.name}」`}
                title={dirty ? '把当前过滤/排序/分组覆盖保存到该视图' : '保存当前视图'}
                onClick={updateActiveView}
              ><Bookmark size={14} />{dirty ? `更新「${activeView.name}」` : `保存「${activeView.name}」`}</button>
            ) : (
              <button
                type="button" className="pt-ghost pm-save-view"
                aria-label="另存为新命名视图"
                title="把当前过滤/排序/分组命名保存为新视图"
                onClick={() => setSaveModal(activeView?.name ?? '')}
              ><BookmarkPlus size={14} />保存视图</button>
            )}
            <button
              className="pt-ghost pm-group-toggle" aria-pressed={grouped}
              title="按任务状态扁平分组（替代阶段树）"
              onClick={() => setGrouped(v => !v)}
            ><ListFilter size={14} />{grouped ? '按状态分组（开）' : '按状态分组'}</button>
            <label className="pt-ghost pt-sort-wrap" title="任务排序">
              <select
                className="pm-sort-select" aria-label="任务排序"
                value={sort} onChange={e => setSort(e.currentTarget.value as TaskViewSort)}
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="pt-ghost pm-import-dropzone" title="导入 .csv / .xlsx 任务表">
              <FileText size={14} />导入
              <input
                type="file" accept=".csv,.xlsx" hidden className="pm-import-file"
                onChange={e => {
                  const file = e.currentTarget.files?.[0]
                  const pid = projectId
                  e.currentTarget.value = ''
                  if (!file) return
                  if (!pid) { setImportPreview({ text: '请先在顶部选择项目，再上传任务表。', confirm: '' }); return }
                  const isCsv = /\.csv$/i.test(file.name)
                  const reader = new FileReader()
                  reader.onload = async () => {
                    const content = isCsv ? String(reader.result ?? '') : arrayBufferToB64(reader.result as ArrayBuffer)
                    const enc = JSON.stringify(content)
                    try {
                      const text = await execute(`task import-content ${pid} ${file.name} ${enc}`)
                      if (/失败|错误|不支持|无法/.test(text)) { setImportPreview({ text, confirm: '' }); return }
                      setImportPreview({ text, confirm: `task import-content ${pid} ${file.name} ${enc}` })
                    } catch (err) {
                      setImportPreview({ text: `解析失败：${err instanceof Error ? err.message : String(err)}`, confirm: '' })
                    }
                  }
                  if (isCsv) reader.readAsText(file); else reader.readAsArrayBuffer(file)
                }}
              />
            </label>
            {/* 导出当前可见视图：Markdown / CSV / JSON，前端 Blob 下载，不写服务器。 */}
            <div className="pt-viewswitch pt-export" ref={exportRef}>
              <button
                type="button" className="pt-ghost pt-viewswitch-btn"
                aria-haspopup="menu" aria-expanded={exportOpen} aria-label="导出当前视图"
                onClick={() => setExportOpen(v => !v)}
              >
                <Download size={14} />导出<ChevronDown size={13} className="pt-viewswitch-chev" />
              </button>
              {exportOpen && (
                <div className="pt-vmenu" role="menu" aria-label="导出格式">
                  <button type="button" role="menuitem" className="pt-vmenu-item" onClick={() => exportAs('md')}>
                    <span className="pt-exp-ic">MD</span>
                    <span className="pt-vmenu-main">
                      <span className="pt-vmenu-name">Markdown 周报</span>
                      <span className="pt-vmenu-cond">结论 / 行动项 / 风险，适合贴进周会汇报</span>
                    </span>
                  </button>
                  <button type="button" role="menuitem" className="pt-vmenu-item" onClick={() => exportAs('csv')}>
                    <span className="pt-exp-ic">CSV</span>
                    <span className="pt-vmenu-main">
                      <span className="pt-vmenu-name">CSV 表格</span>
                      <span className="pt-vmenu-cond">UTF-8，Excel 直开，便于二次统计</span>
                    </span>
                  </button>
                  <button type="button" role="menuitem" className="pt-vmenu-item" onClick={() => exportAs('json')}>
                    <span className="pt-exp-ic">JSON</span>
                    <span className="pt-vmenu-main">
                      <span className="pt-vmenu-name">JSON 结构化</span>
                      <span className="pt-vmenu-cond">全字段，供脚本 / 二次开发</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
            <button
              type="button" className="pt-ghost" aria-label="分享只读快照"
              title="生成只读 HTML 快照（本地静态文件，可自行转发，不联网）"
              onClick={shareSnapshot}
            ><Share2 size={14} />分享</button>
            {/* P1-6：密度为全局持久偏好（localStorage pm-density，shell 根 data-density 下发，各视图生效）。 */}
            <div className="pt-density" title="全局偏好：切换后即时生效并持久保存，各视图统一应用">
              <span className="pt-density-label">密度（全局偏好）</span>
              <div className="pt-density-seg" role="group" aria-label="全局密度偏好">
                <button
                  type="button" className={density === 'comfortable' ? 'active' : ''}
                  onClick={() => onDensityChange?.('comfortable')}
                >舒适</button>
                <button
                  type="button" className={density === 'compact' ? 'active' : ''}
                  onClick={() => onDensityChange?.('compact')}
                >紧凑</button>
              </div>
              <span className="pt-density-chip">全部视图生效 · 持久保存</span>
            </div>
            <button className="pt-primary" onClick={onCreate} disabled={disabled}>
              <Plus size={15} />新建任务
            </button>
          </div>
        </div>
      </div>

      {importPreview && (
        <div className="pt-import">
          <pre>{importPreview.text}</pre>
          {importPreview.confirm && (
            <button
              className="pt-primary pm-import-confirm" disabled={disabled}
              onClick={() => void run(importPreview.confirm).then(ok => {
                if (ok) { setImportPreview(null); onSaved() }
              })}
            >确认落盘</button>
          )}
          <button className="pt-ghost" onClick={() => setImportPreview(null)}>取消</button>
        </div>
      )}

      {selected.size > 0 && (
        <div className="pt-batch">
          <span className="pt-bcount">已选 {selected.size} 项</span>
          <button className="pm-batch-complete" disabled={disabled} onClick={() => void run(`task batch update ${batchIds} {"status":"done"}`).then(ok => ok && onSaved())}>标为完成</button>
          <BatchInput
            className="pm-batch-assignee"
            placeholder="负责人" disabled={disabled}
            onApply={json => run(`task batch update ${batchIds} ${json}`).then(ok => ok && onSaved())}
          />
          <select
            defaultValue="" aria-label="批量优先级" disabled={disabled}
            onChange={e => {
              const v = e.currentTarget.value
              if (!v) return
              void run(`task batch update ${batchIds} ${JSON.stringify({ priority: v })}`).then(ok => ok && onSaved())
              e.currentTarget.value = ''
            }}
          >
            <option value="" disabled>批量优先级</option>
            {['low', 'medium', 'high'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <BatchInput
            type="date" className="pm-batch-due" placeholder="截止日" disabled={disabled}
            onApply={json => run(`task batch update ${batchIds} ${json}`).then(ok => ok && onSaved())}
          />
          <button className="pt-danger pm-batch-delete" disabled={disabled} onClick={confirmBatchDelete}>批量删除</button>
          <button onClick={() => setSelected(new Set())}>取消选择</button>
        </div>
      )}

      <div className="pt-card">
        <div className="pt-scroll">
          <div className="pt-grid pt-thead">
            <div className="pt-cell pt-sel" />
            <div className="pt-cell pt-gutter" />
            <div className="pt-th">编号</div>
            <div className="pt-th">任务</div>
            <div className="pt-th">负责人</div>
            <div className="pt-th">优先级</div>
            <div className="pt-th">截止日期</div>
            <div className="pt-th">进度</div>
            <div className="pt-th right">操作</div>
          </div>

          {grouped
            ? statusGroups.flatMap(g => [
                statusGroupRow(g),
                ...g.rows.map(t => leafRow({ task: t, depth: 0, hasChildren: false })),
              ])
            : treeRows.map(row => row.depth === 0 ? groupRow(row) : leafRow(row))}

          {!renderedIds.length && (
            <div className="pt-empty">
              <ListTree size={30} />
              <span>{tasks.length ? '没有符合筛选条件的任务' : '暂无任务记录'}</span>
              {onGenWbs && (
                <button className="pt-primary pt-empty-cta" onClick={onGenWbs}>
                  <Sparkles size={14} />用 AI 一键生成 WBS
                </button>
              )}
            </div>
          )}
        </div>
        <div className="pt-statusbar pm-kbd-help">
          <span>
            <kbd>J</kbd><kbd>K</kbd> 移动 · <kbd>Space</kbd> 勾选 · <kbd>Enter</kbd> 打开 · <kbd>Del</kbd> 批量删除
          </span>
          <span>{visible.length} 条记录</span>
        </div>
      </div>
    </div>
  )
}

/** 批量输入框：Enter / 应用按钮触发。 */
function BatchInput({ placeholder, type = 'text', disabled, className, onApply }: {
  placeholder: string
  type?: string
  disabled?: boolean
  className?: string
  onApply: (json: string) => Promise<boolean | void>
}) {
  const [value, setValue] = useState('')
  const field = type === 'date' ? 'dueDate' : 'assignee'
  const apply = () => {
    if (!value.trim()) return
    void onApply(JSON.stringify({ [field]: value.trim() })).then(() => setValue(''))
  }
  return (
    <span className={className}>
      <input
        type={type} value={value} placeholder={placeholder} aria-label={placeholder} disabled={disabled}
        onChange={e => setValue(e.currentTarget.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); apply() } }}
      />
      <button disabled={disabled || !value.trim()} onClick={apply}>应用</button>
    </span>
  )
}

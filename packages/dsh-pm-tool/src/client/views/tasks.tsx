import { useEffect, useMemo, useRef, useState } from 'react'
import { flattenVisible, indexChildren } from '../../core/task-tree.js'
import { buildUpdate } from '../../core/task-inline.js'
import { blockingPredecessors, localTodayIso, isTaskOverdue } from '../../core/derived.js'
import { clampProgress } from '../../core/progress-derivation.js'
import { shouldHandleGlobalKbd, nextRowId } from '../../core/ui-feedback.js'
import { panelKeyboard, fromKeyboardEvent } from '../../core/panel-kbd.js'
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
import type { Task, Milestone, Run } from './types.js'
import css from './tasks.css?raw'

const taskStatus: Record<string, string> = {
  todo: '未开始',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
}

type ChipKey = 'all' | 'in_progress' | 'done' | 'overdue' | 'mine'

const CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'in_progress', label: '进行中' },
  { key: 'done', label: '已完成' },
  { key: 'overdue', label: '已逾期' },
  { key: 'mine', label: '我负责的' },
]

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
  /** P1-6：全局密度偏好（localStorage pm-density），由 shell 持有并下发；根容器 data-density 生效。 */
  density?: 'comfortable' | 'compact'
  onDensityChange?: (d: 'comfortable' | 'compact') => void
  overlayOpen?: boolean
}) {
  const {
    tasks, milestones, disabled = false, onCreate, onEdit,
    onGenWbs, onSaved, run, execute, projectId, density = 'comfortable', onDensityChange, overlayOpen,
  } = props

  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<ChipKey>('all')
  const [grouped, setGrouped] = useState(false) // PROD-01：默认阶段树视图，按状态分组为可选开关
  const [sort, setSort] = useState<'code' | 'dueDate' | 'priority' | 'progress'>('code')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [movePickerFor, setMovePickerFor] = useState<Task | null>(null)
  const [importPreview, setImportPreview] = useState<{ text: string, confirm: string } | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeRef = useRef<HTMLDivElement | null>(null)

  const byId = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks])
  const childMap = useMemo(() => indexChildren(tasks), [tasks])

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
        default: return true
      }
    })
  }, [tasks, query, chip]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const chipCounts = useMemo(() => ({
    all: tasks.length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(isDone).length,
    overdue: tasks.filter(isLate).length,
    mine: tasks.filter(t => t.assignee).length,
  }), [tasks]) // eslint-disable-line react-hooks/exhaustive-deps

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
    return (
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
    )
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
          <div className="pt-chips">
            {CHIPS.map(c => (
              <button
                key={c.key} className={`pt-chip${chip === c.key ? ' active' : ''}`}
                onClick={() => setChip(c.key)}
              >{c.label}<span className="n">{chipCounts[c.key]}</span></button>
            ))}
          </div>
          <div className="pt-tools">
            <button
              className="pt-ghost pm-group-toggle" aria-pressed={grouped}
              title="按任务状态扁平分组（替代阶段树）"
              onClick={() => setGrouped(v => !v)}
            ><ListFilter size={14} />{grouped ? '按状态分组（开）' : '按状态分组'}</button>
            <label className="pt-ghost pt-sort-wrap" title="任务排序">
              <select
                className="pm-sort-select" aria-label="任务排序"
                value={sort} onChange={e => setSort(e.currentTarget.value as typeof sort)}
              >
                <option value="code">按 WBS 编号</option>
                <option value="dueDate">按截止日期</option>
                <option value="priority">按优先级</option>
                <option value="progress">按进度</option>
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

import { panelKeyboard, fromKeyboardEvent } from '../core/panel-kbd.js'
import { flattenVisible as flattenTaskTree } from '../core/task-tree.js'
import { resolveRecordLocation, findRecord } from '../core/record-location.js'
import { buildUpdate } from '../core/task-inline.js'
import { findMeetingSources, pickPrimarySource } from '../core/meeting-source.js'
import { diffAgainstPrevious } from '../core/report-diff.js'
import { computeKPI, buildAgenda, groupRiskMatrix } from '../core/war-room.js'
import { scoreFromInputs as healthFromInputs, blockingPredecessors, localTodayIso } from '../core/derived.js'
import { groupOpenTasksByAssignee, normalizePerson, type PersonRow } from '../core/people-load.js'
import { listAssigneeCandidates } from '../core/people-candidates.js'
import {
  DEFAULT_PROJECT_SETTINGS, SETTING_FIELDS, normalizeProjectSettings, sameSettings,
  type ProjectSettings, type SettingFieldMeta,
} from '../core/settings.js'
import {
  dateRange, shiftDatesByDrag, barGeometry, todayOffset, daysFrom,
  progressFill, barLabelPolicy, shortDate, dependencyEdges,
  parentBarRange, milestoneOffset, taskDurationDays,
} from '../core/gantt.js'
import { deriveProgressMap, checklistFraction } from '../core/progress-derivation.js'
import { parseCopilotActions, validateActions, parseCopilotPlan, validatePlan, forStepwiseApply, type CopilotStep } from '../core/copilot.js'
import { formatNoticeLines, extractBackupPath, shouldHandleGlobalKbd, sampleGanttTicks, parseActiveModelLane, nextRowId } from '../core/ui-feedback.js'
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.mjs'
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle.mjs'
import Bell from 'lucide-react/dist/esm/icons/bell.mjs'
import Database from 'lucide-react/dist/esm/icons/database.mjs'
import ArrowDownWideNarrow from 'lucide-react/dist/esm/icons/arrow-down-wide-narrow.mjs'
import Download from 'lucide-react/dist/esm/icons/download.mjs'
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.mjs'
import Check from 'lucide-react/dist/esm/icons/check.mjs'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.mjs'
import Filter from 'lucide-react/dist/esm/icons/filter.mjs'
import FileText from 'lucide-react/dist/esm/icons/file-text.mjs'
import FolderKanban from 'lucide-react/dist/esm/icons/folder-kanban.mjs'
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard.mjs'
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal.mjs'
import MessageSquare from 'lucide-react/dist/esm/icons/message-square.mjs'
import GitBranch from 'lucide-react/dist/esm/icons/git-branch.mjs'
import ListFilter from 'lucide-react/dist/esm/icons/list-filter.mjs'
import ListTree from 'lucide-react/dist/esm/icons/list-tree.mjs'
import MilestoneIcon from 'lucide-react/dist/esm/icons/milestone.mjs'
import NotebookTabs from 'lucide-react/dist/esm/icons/notebook-tabs.mjs'
import Package from 'lucide-react/dist/esm/icons/package.mjs'
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs'
import Plus from 'lucide-react/dist/esm/icons/plus.mjs'
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw.mjs'
import Search from 'lucide-react/dist/esm/icons/search.mjs'
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert.mjs'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.mjs'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs'
import UserRound from 'lucide-react/dist/esm/icons/user-round.mjs'
import X from 'lucide-react/dist/esm/icons/x.mjs'
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left.mjs'
import Zap from 'lucide-react/dist/esm/icons/zap.mjs'
import KeyRound from 'lucide-react/dist/esm/icons/key-round.mjs'
import Send from 'lucide-react/dist/esm/icons/send.mjs'
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list.mjs'
import Eye from 'lucide-react/dist/esm/icons/eye.mjs'
import Code2 from 'lucide-react/dist/esm/icons/code-2.mjs'
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw.mjs'
import SlidersHorizontal from 'lucide-react/dist/esm/icons/sliders-horizontal.mjs'
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb.mjs'
import ListChecks from 'lucide-react/dist/esm/icons/list-checks.mjs'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import {
  setPointerOpener, setRowOpener, takeOpenerSpec, resolveDrawerFocusTarget,
  type FocusDoc, type OpenerSpec,
} from '../core/drawer-focus.js'
import {
  validateProjectForm, validateMilestoneForm, repoFieldErrors, repoFieldsForUpdate, repoFieldsForCreate, firstInvalidField,
  type FormFieldErrors, type ProjectFormValues, type MilestoneFormValues,
} from './form-validation.js'
import { BoardBento } from './board/BoardBento.js'
import { TaskTable } from './views/tasks.js'
import { Overview } from './views/overview.js'
import { GanttView } from './views/gantt.js'
import { Milestones as MilestoneView } from './views/milestones.js'
import { RiskIssuesView as RiskIssueTable } from './views/risk-issues.js'
import { MeetingsView as MeetingTable } from './views/meetings.js'
import { ReportsView as ProgressReportTable } from './views/reports.js'
import { Deliverables as DeliverableTable } from './views/deliverables.js'
import { PeopleView } from './views/people.js'
import styles from './panel.css?raw'

/** R3-OBS-002：把焦点归还解析接到真实 document（测试时由伪 DOM 注入，不在此硬编码）。 */
const pmFocusDoc: FocusDoc = {
  contains: (node) => typeof Node !== 'undefined' && node instanceof Node ? document.contains(node as Node) : false,
  rowOpener: (rowId) => document.querySelector(`[data-pm-row="${rowId}"] .pm-title-cell, [data-pm-row="${rowId}"] .pm-row-button`) as HTMLElement | null,
  fallbackControl: () => document.querySelector('.pm-add-row') as HTMLElement | null,
  anyRowTitle: () => document.querySelector('.pm-title-cell') as HTMLElement | null,
}

/** R3-OBS-002：捕获打开抽屉的真实 opener。
 *  pointerdown 覆盖鼠标点击；click 捕获额外覆盖「键盘 Tab 聚焦按钮后 Enter/Space」触发的原生 click
 *  （该路径不经过 TaskTable 的 openActive，也无 pointerdown）。抽屉内交互一律不记录，避免污染已快照的 opener。 */
function recordDrawerOpener(e: { target: EventTarget | null }) {
  const t = (e.target as HTMLElement | null)
  if (t?.closest?.('.pm-drawer-layer')) return
  const el = t?.closest?.('button, a, [role="button"]')
  setPointerOpener(el as HTMLElement | null)
}

export type Project = {
  id: string
  name: string
  description: string
  owner: string
  status: string
  startDate: string
  targetDate: string
  repoUrl?: string
  branch?: string
}

export type Task = {
  id: string
  projectId: string
  parentId: string | null
  code: string
  title: string
  description: string
  assignee: string
  status: string
  priority: string
  startDate?: string
  dueDate?: string
  progress: number
  milestoneId: string | null
  predecessorIds?: string[]
  checklist?: { id: string, text: string, done: boolean }[] | null
  repoUrl?: string
  branch?: string
}

export type Milestone = {
  id: string
  projectId: string
  title: string
  description: string
  targetDate: string
  status: string
  achievedDate: string | null
}

export type RiskIssue = {
  id: string
  projectId: string
  type: 'risk' | 'issue'
  title: string
  description: string
  owner: string
  dueDate: string | null
  status: 'open' | 'monitoring' | 'closed'
  probability: 'low' | 'medium' | 'high' | null
  impact: 'low' | 'medium' | 'high' | 'critical'
  responsePlan: string
  solution: string
}

type MeetingAction = {
  id: string
  title: string
  owner: string
  dueDate: string | null
  status: 'todo' | 'in_progress' | 'done' | 'cancelled'
  taskId: string | null
  riskIssueId: string | null
}

type Meeting = {
  id: string
  projectId: string
  title: string
  meetingDate: string
  startTime: string | null
  durationMinutes: number | null
  location: string
  facilitator: string
  recorder: string
  participants: string[]
  status: 'draft' | 'final'
  summary: string
  topics: string[]
  decisions: string[]
  notes: string
  actions: MeetingAction[]
  updatedAt: string
}

type ProgressReport = {
  id: string
  projectId: string
  title: string
  periodStart: string
  periodEnd: string
  status: 'draft' | 'final'
  executiveSummary: string
  completedWork: string[]
  nextPlans: string[]
  blockers: string[]
  snapshotAt: string
  snapshot: {
    tasks: { total: number, todo: number, inProgress: number, done: number, blocked: number, averageProgress: number | null, calcVersion?: number }
    milestones: { total: number, achieved: number, atRisk: number, missed: number }
    meetings: { inPeriod: number, decisions: number }
    periodMilestones: { id: string, title: string, targetDate: string, status: string }[]
    periodMeetings: { id: string, title: string, meetingDate: string, decisions: string[] }[]
    exceptions: {
      kind: string
      severity: 'warning' | 'critical'
      id: string
      title: string
      detail: string
      owner: string
      dueDate: string | null
    }[]
  }
}

type DeliverableChange = {
  at: string
  field: string
  from: string
  to: string
  by: string
  note: string
}

export type Deliverable = {
  id: string
  projectId: string
  name: string
  version: string
  owner: string
  status: 'planned' | 'in_progress' | 'submitted' | 'accepted'
  location: string
  description: string
  dueDate: string | null
  history: DeliverableChange[]
  createdAt: string
  updatedAt: string
  repoUrl?: string
  branch?: string
}

export type Snapshot = {
  projects: Project[]
  tasks: Task[]
  milestones: Milestone[]
  riskIssues: RiskIssue[]
  meetings: Meeting[]
  reports: ProgressReport[]
  deliverables: Deliverable[]
  /** 看板布局（dsh-storage 透明存取）：user > project；读不到为 null。 */
  dashboards?: { user: unknown, project: unknown }
  /** #21 口径设置：服务端已归一化的生效口径；缺失/异常时前端再归一化回落默认。 */
  settings?: unknown
}
type View = 'tasks' | 'milestones' | 'risk-issues' | 'meetings' | 'reports' | 'deliverables' | 'overview' | 'gantt' | 'people'
type Drawer =
  | { kind: 'project-create' }
  | { kind: 'project-edit', project: Project }
  | { kind: 'task', task?: Task }
  | { kind: 'milestone', milestone?: Milestone }
  | { kind: 'risk-issue', record?: RiskIssue }
  | { kind: 'meeting', meeting?: Meeting }
  | { kind: 'report', report?: ProgressReport }
  | { kind: 'deliverable', deliverable?: Deliverable }
  | { kind: 'ai' }
  | { kind: 'copilot' }
  | { kind: 'settings' }

export interface PmPanelApi {
  execute(line: string): Promise<string>
}

const empty: Snapshot = { projects: [], tasks: [], milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [] }
const projectStatus: Record<string, string> = {
  planning: '计划中',
  active: '进行中',
  paused: '已暂停',
  done: '已完成',
  archived: '已归档',
}
const taskStatus: Record<string, string> = {
  todo: '未开始',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
}
const milestoneStatus: Record<string, string> = {
  planned: '计划中',
  at_risk: '有风险',
  achieved: '已达成',
  missed: '已错过',
}
const riskIssueStatus: Record<string, string> = {
  open: '待处理',
  monitoring: '跟进中',
  closed: '已关闭',
}
const riskIssueType: Record<string, string> = { risk: '风险', issue: '问题' }
const probabilityLabels: Record<string, string> = { low: '低', medium: '中', high: '高' }
const impactLabels: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' }
const meetingStatus: Record<string, string> = { draft: '草稿', final: '已定稿' }
const meetingActionStatus: Record<string, string> = {
  todo: '未开始', in_progress: '进行中', done: '已完成', cancelled: '已取消',
}
const progressReportStatus: Record<string, string> = { draft: '草稿', final: '已定稿' }
const deliverableStatus: Record<string, string> = {
  planned: '计划中', in_progress: '制作中', submitted: '已提交', accepted: '已验收',
}

/**
 * 项目切换下拉（替代原生 select）：
 *  - 触发按钮显示当前项目名 + 旋转箭头；
 *  - 浮层菜单列出项目，选中项打勾高亮；
 *  - 点击外部 / Esc 关闭，↑↓ 在项间移动、Enter 确认（可访问性）。
 */
function ProjectSwitcher({ projects, currentId, onPick }: {
  projects: Snapshot['projects']
  currentId?: string
  onPick: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const current = projects.find(p => p.id === currentId)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (index: number) => {
    const item = projects[index]
    if (item) { onPick(item.id); setOpen(false) }
  }

  return (
    <div className="pm-project-switcher" ref={wrapRef}>
      <button
        type="button"
        className="pm-project-switcher-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => { setOpen(v => !v); setActiveIndex(-1) }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (!open) setOpen(true)
            setActiveIndex(i => (i + 1) % projects.length)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            if (!open) setOpen(true)
            setActiveIndex(i => (i <= 0 ? projects.length - 1 : i - 1))
          } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault()
            choose(activeIndex)
          }
        }}>
        <span className="pm-project-switcher-name">{current?.name ?? '暂无项目'}</span>
        <ChevronDown size={15} className={open ? 'pm-caret-open' : undefined}/>
      </button>
      {open && (
        <div className="pm-project-menu" role="listbox" aria-label="选择项目">
          {projects.length === 0 && <div className="pm-project-menu-empty">暂无项目</div>}
          {projects.map((p, i) => {
            const selected = p.id === currentId
            return <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={selected}
              className={'pm-project-menu-item' + (selected ? ' is-selected' : '') + (i === activeIndex ? ' is-active' : '')}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => choose(i)}>
              <span className="pm-project-menu-name">{p.name}</span>
              {selected && <Check size={15}/>}
            </button>
          })}
        </div>
      )}
    </div>
  )
}

/**
 * 模型车道切换（AI 助手 / 副驾共用）：PoC 免费网关 vs 生产自有 Key。
 * 视觉为胶囊式 segmented，跟随深浅主题；compact 用于窄栏。
 */
function LaneSwitcher({ lane, busy, onChange, compact }: {
  lane: 'poc' | 'prod'
  busy?: boolean
  onChange: (lane: 'poc' | 'prod') => void
  compact?: boolean
}) {
  return <div className={'pm-lane-switch pm-model-lane' + (compact ? ' is-compact' : '')} role="tablist" aria-label="模型车道">
    <button type="button" role="tab" aria-selected={lane === 'poc'} disabled={busy}
      className={'pm-lane-poc' + (lane === 'poc' ? ' is-on' : '')} onClick={() => onChange('poc')}>
      <Zap size={13}/> PoC 免费
    </button>
    <button type="button" role="tab" aria-selected={lane === 'prod'} disabled={busy}
      className={'pm-lane-prod' + (lane === 'prod' ? ' is-on' : '')} onClick={() => onChange('prod')}>
      <KeyRound size={13}/> 生产 Key
    </button>
  </div>
}

/** 行内富文本：渲染 **加粗** 与 `代码`，其余按纯文本（安全，不产生 HTML）。 */
function renderInlineRich(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) nodes.push(<strong key={keyPrefix + i}>{tok.slice(2, -2)}</strong>)
    else nodes.push(<code key={keyPrefix + i} className="pm-md-code">{tok.slice(1, -1)}</code>)
    last = m.index + tok.length
    i += 1
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/** 轻量 Markdown 渲染：标题 / 有序无序列表 / 段落 / 行内加粗与代码（无 HTML、无注入面）。 */
function MarkdownView({ text, className }: { text: string, className?: string }) {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let list: { ordered: boolean, items: string[] } | null = null
  const flushList = () => {
    if (!list) return
    const items = list.items.map((it, i) => <li key={i}>{renderInlineRich(it, 'li' + i)}</li>)
    blocks.push(list.ordered
      ? <ol key={'ol' + blocks.length}>{items}</ol>
      : <ul key={'ul' + blocks.length}>{items}</ul>)
    list = null
  }
  lines.forEach((raw, idx) => {
    const line = raw.trim()
    let m: RegExpExecArray | null
    if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) {
      flushList()
      blocks.push(<p key={'h' + idx} className={'pm-md-h' + m[1].length}>{renderInlineRich(m[2], 'h' + idx)}</p>)
    } else if ((m = /^\s*[-*]\s+(.*)$/.exec(raw))) {
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] } }
      list.items.push(m[1])
    } else if ((m = /^\s*\d+[.、)]\s+(.*)$/.exec(raw))) {
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] } }
      list.items.push(m[1])
    } else if (line) {
      flushList()
      blocks.push(<p key={'p' + idx} className="pm-md-p">{renderInlineRich(line, 'p' + idx)}</p>)
    } else {
      flushList()
    }
  })
  flushList()
  return <div className={'pm-md' + (className ? ' ' + className : '')}>{blocks}</div>
}

/** WBS 结构化预览：把缩进的 `- [ ]` / `- [x]` 清单渲染成任务树（所见即所得）。 */
function WbsTreeView({ markdown }: { markdown: string }) {
  const rows: { depth: number, done: boolean, title: string }[] = []
  markdown.split('\n').forEach(line => {
    const m = /^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/.exec(line)
    if (m) {
      const indent = m[1].replace(/\t/g, '  ').length
      rows.push({ depth: Math.floor(indent / 2), done: m[2].toLowerCase() === 'x', title: m[3].trim() })
    }
  })
  if (!rows.length) return null
  return <div className="pm-wbs-tree">
    {rows.map((r, i) =>
      <div key={i} className={'pm-wbs-row' + (r.done ? ' is-done' : '') + (r.depth === 0 ? ' is-top' : '')}
        style={{ paddingLeft: 10 + r.depth * 18 }}>
        <span className="pm-wbs-box">{r.done ? <Check size={11}/> : null}</span>
        <span className="pm-wbs-title">{r.title}</span>
      </div>)}
  </div>
}

export function PmPanel({ execute }: PmPanelApi) {
  const [restorePreview, setRestorePreview] = useState<{ fileName: string, content: string, text: string } | null>(null)
  const [data, setData] = useState<Snapshot>(empty)
  const [selected, setSelectedRaw] = useState<string>(() => {
    try { return localStorage.getItem('pm-selected-project') ?? '' } catch { return '' }
  })
  const setSelected = (id: string | undefined) => {
    setSelectedRaw(id ?? '')
    try { id ? localStorage.setItem('pm-selected-project', id) : localStorage.removeItem('pm-selected-project') } catch { /* ignore */ }
  }
  const [view, setView] = useState<View>(() => {
    try {
      const v = localStorage.getItem('pm-view')
      if (v === 'tasks' || v === 'milestones' || v === 'risk-issues' || v === 'meetings' || v === 'reports' || v === 'deliverables' || v === 'overview' || v === 'gantt' || v === 'people') return v
    } catch { /* ignore */ }
    return 'tasks'
  })
  const changeView = (v: View) => {
    setView(v)
    try { localStorage.setItem('pm-view', v) } catch { /* ignore */ }
  }
  // PROD-02：记录直达——切项目 -> 切视图 tab -> 打开对应抽屉；找不到则安全回退。
  const openRecord = (projectId: string, type: string, id: string) => {
    setSelected(projectId)
    const loc = resolveRecordLocation(type)
    if (!loc) return
    changeView(loc.view as View)
    const found = findRecord(data, type, id)
    if (!found) return
    const r = found.record as Record<string, unknown>
    const drawer = (() => {
      switch (type) {
        case 'task': return { kind: 'task', task: r } as never
        case 'milestone': return { kind: 'milestone', milestone: r } as never
        case 'risk': return { kind: 'risk-issue', record: r } as never
        case 'meeting': return { kind: 'meeting', meeting: r } as never
        case 'report': return { kind: 'report', report: r } as never
        case 'deliverable': return { kind: 'deliverable', deliverable: r } as never
        default: return undefined
      }
    })()
    if (drawer) setDrawer(drawer)
  }
  const [drawer, setDrawer] = useState<Drawer>()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [dashOpen, setDashOpen] = useState(false)
  const [topMenuOpen, setTopMenuOpen] = useState(false)

  const refresh = async () => {
    setBusy(true)
    try {
      const next = JSON.parse(await execute('web snapshot')) as Snapshot
      setData(next)
      // OPT-03：刷新后回填记住的项目；已删除则回退到当前首个项目，不留脏值。
      const ids = next.projects.map(p => p.id)
      let stored = ''
      try { stored = localStorage.getItem('pm-selected-project') ?? '' } catch { /* ignore */ }
      setSelected(resolveRememberedProject(stored, ids, selected && ids.includes(selected) ? selected : undefined))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  // 「更多」菜单：Escape 关闭并把焦点还给触发按钮。
  useEffect(() => {
    if (!topMenuOpen) return
    const opener = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setTopMenuOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [topMenuOpen])

  // quiet：专用执行（甘特拖拽等就地反馈场景）。成功只 refresh 一次、不弹全字段大 Notice；
  // 但 catch 仍 setMessage——quiet 绝不吞掉错误提示。非 quiet 行为与原先完全一致。
  const run = async (line: string, options?: { quiet?: boolean }): Promise<boolean> => {
    setBusy(true)
    try {
      const response = await execute(line)
      await refresh()
      if (!options?.quiet) setMessage(response)
      return true
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
      setBusy(false)
      return false
    }
  }

  const project = data.projects.find(item => item.id === selected)
  const tasks = useMemo(() => data.tasks
    .filter(item => item.projectId === selected)
    .sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true })),
  [data.tasks, selected])
  const milestones = useMemo(() => data.milestones
    .filter(item => item.projectId === selected)
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate) || a.id.localeCompare(b.id)),
  [data.milestones, selected])
  const riskIssues = useMemo(() => data.riskIssues
    .filter(item => item.projectId === selected)
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })),
  [data.riskIssues, selected])
  const meetings = useMemo(() => data.meetings
    .filter(item => item.projectId === selected)
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate) || b.id.localeCompare(a.id)),
  [data.meetings, selected])
  const reports = useMemo(() => data.reports
    .filter(item => item.projectId === selected)
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd) || b.id.localeCompare(a.id)),
  [data.reports, selected])
  const deliverables = useMemo(() => data.deliverables
    .filter(item => item.projectId === selected)
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })),
  [data.deliverables, selected])
  // T8：assignee 候选只从**当前全量 snapshot** 跨项目派生（project.owner→task.assignee→
  // riskIssue.owner→deliverable.owner→meeting.participants），纯内存、零写盘；刷新即重算。
  const assigneeCandidates = useMemo(() => listAssigneeCandidates({
    projects: data.projects,
    tasks: data.tasks,
    riskIssues: data.riskIssues,
    deliverables: data.deliverables,
    meetings: data.meetings,
  }), [data])

  // #21 口径设置：服务端已归一化；前端再防御性归一化一次，缺失/异常回落默认（默认等价）。
  const settings = useMemo<ProjectSettings>(
    () => normalizeProjectSettings(data.settings).settings,
    [data.settings],
  )

  return <>
    <style>{styles}</style>
    <main
      className="pm-shell"
      onPointerDownCapture={recordDrawerOpener}
      onClickCapture={recordDrawerOpener}
    >
      {message && <Notice message={message} onClose={() => setMessage('')}/>}

      {restorePreview && (
        <div className="pm-restore-preview">
          <div className="pm-warn">危险：恢复将用「{restorePreview.fileName}」替换当前七类实体（恢复前自动存安全快照）。</div>
          <pre className="pm-restore-preview-text">{restorePreview.text}</pre>
          <button
            className="pm-button pm-button-primary pm-restore-confirm"
            onClick={() => {
              const enc = JSON.stringify(restorePreview.content)
              void execute(`restore-content ${enc} confirm`)
                .then((r) => { setMessage(String(r ?? '已恢复')); setRestorePreview(null); void refresh() })
                .catch((e) => setMessage(`恢复失败：${e instanceof Error ? e.message : String(e)}`))
            }}
          >确认恢复</button>
          <button className="pm-tool-button pm-restore-cancel" onClick={() => setRestorePreview(null)}>取消</button>
        </div>
      )}
      <header className="pm-topbar">
        <div className="pm-project-switch">
          <span className="pm-app-mark"><FolderKanban size={17}/></span>
          <div>
            <span className="pm-kicker">项目工作台</span>
            {project
              ? <ProjectSwitcher
                  projects={data.projects}
                  currentId={project.id}
                  onPick={id => { setSelected(id); setDrawer(undefined) }}
                />
              : <strong>暂无项目</strong>}
          </div>
        </div>
        <div className="pm-top-actions">
          <button
            className="pm-button pm-top-secondary"
            aria-pressed={dashOpen}
            title="跨项目总览看板与全局搜索"
            onClick={() => setDashOpen(value => !value)}
          >
            <LayoutDashboard size={15}/>总览看板
          </button>
          <button className="pm-button" onClick={() => setDrawer({ kind: 'project-create' })}>
            <Plus size={15}/>新建项目
          </button>
          <button
            className="pm-button pm-top-secondary"
            disabled={!project || dashOpen}
            title="AI 拆解 WBS / 生成汇报叙述 / 归纳会议纪要（结果为草稿，需确认才入库）"
            onClick={() => setDrawer({ kind: 'ai' })}
          >
            <Sparkles size={15}/>AI 助手
          </button>
          <button
            className="pm-button pm-top-secondary pm-copilot-open"
            disabled={!project || dashOpen}
            title="提问式副驾：只读诊断 + 操作草稿卡（确认才落库）"
            onClick={() => setDrawer({ kind: 'copilot' })}
          >
            <MessageSquare size={15}/>AI 副驾
          </button>
          <div className="pm-top-more-wrap">
          <button
            className="pm-button pm-top-more"
            aria-expanded={topMenuOpen}
            title="更多：备份 / 恢复 / 导出"
            onClick={() => setTopMenuOpen(v => !v)}
          >
            <MoreHorizontal size={15}/>更多
          </button>
          {topMenuOpen && (
            <div className="pm-top-menu" onMouseLeave={() => setTopMenuOpen(false)}>
          <button
            className="pm-button pm-menu-item"
            onClick={() => { setTopMenuOpen(false); setDashOpen(true) }}
          >
            <LayoutDashboard size={15}/>总览看板
          </button>
          <button
            className="pm-button pm-menu-item"
            disabled={!project}
            onClick={() => { setTopMenuOpen(false); setDrawer({ kind: 'ai' }) }}
          >
            <Sparkles size={15}/>AI 助手
          </button>
          <button
            className="pm-button pm-menu-item"
            disabled={!project}
            onClick={() => { setTopMenuOpen(false); setDrawer({ kind: 'copilot' }) }}
          >
            <MessageSquare size={15}/>AI 副驾
          </button>
          <button
            className="pm-button pm-menu-item"
            disabled={!project}
            onClick={() => { setTopMenuOpen(false); setDrawer({ kind: 'settings' }) }}
          >
            <SlidersHorizontal size={15}/>口径设置
          </button>
          <div className="pm-menu-divider"/>
          <button
            className="pm-button pm-backup-btn"
            disabled={busy}
            title="一键备份 pmtool 七类实体到内置 packages/backups/（恢复请用 /pm restore <文件> confirm）"
            onClick={async () => {
              if (!window.confirm('将把当前七类实体备份到内置 packages/backups/（带时间戳 JSON，成功后显示完整路径）。开始？')) return
              const text = await execute('backup')
              setMessage(`备份完成：${text}`)
              void refresh()
            }}
          >
            <Database size={15}/>备份
          </button>
          <label className="pm-button pm-restore-btn" title="按备份成功提示的完整路径选取本地 pm-tool 备份 JSON；选文件后先预览，确认才替换当前七类实体">
            <Package size={15}/>选择备份文件恢复
            <input
              type="file"
              accept=".json,application/json"
              className="pm-file-input pm-restore-file"
              hidden
              onChange={(e) => {
                const file = e.currentTarget.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  const content = String(reader.result ?? '')
                  const json = JSON.stringify(content)
                  void execute(`restore-content ${json}`)
                    .then((r) => {
                      const text = String(r ?? '')
                      if (/失败|错误|不支持|无法/.test(text)) { setMessage(text); return }
                      setRestorePreview({ fileName: file.name, content, text })
                    })
                    .catch((e) => setMessage(`恢复失败：${e instanceof Error ? e.message : String(e)}`))
                }
                reader.readAsText(file)
                e.currentTarget.value = ''
              }}
            />
          </label>
          <p className="pm-menu-note">备份默认存于内置 packages/backups/（隔离实例可能不同）；以备份成功提示的完整路径为准。恢复请选 pm-tool 备份 JSON，先预览、确认后才替换七类实体。</p>
          <button
            className="pm-button pm-export-md-btn"
            disabled={busy || !project}
            title="导出当前项目为 Markdown（浏览器直接下载）"
            onClick={async () => {
              try {
                // OPT-04：前端基于 snapshot 组装 Markdown 并走 Blob 直接下载，文件名带项目名与时间戳。
                const snap = JSON.parse(await execute('web snapshot')) as Snapshot
                const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
                const pname = (project!.name || project!.id).replace(/[\\/:*?"<>|\s]+/g, '-')
                const rows: string[] = [`# ${project!.name}（${project!.id}）`, '']
                const tasks = (snap.tasks ?? [] as { title: string, assignee?: string, progress?: number, dueDate?: string }[])
                if (tasks.length) { rows.push('## 任务', ''); for (const t of tasks) rows.push(`- [ ] ${t.title}${t.assignee ? `（负责人：${t.assignee}）` : ''}${typeof t.progress === 'number' ? ` ${t.progress}%` : ''}${t.dueDate ? ` 截止 ${t.dueDate}` : ''}`) }
                downloadText(`pmtool-${pname}-${ts}.md`, rows.join('\n'), 'text/markdown')
                setMessage(`已导出 Markdown（约 ${tasks.length} 个任务）并开始下载。`)
              } catch (error) {
                setMessage(`导出失败：${error instanceof Error ? error.message : String(error)}`)
              }
            }}
          >
            <Download size={15}/>导出 Markdown
          </button>
          <button
            className="pm-button pm-export-json-btn"
            disabled={busy}
            title="导出整库 JSON 数据包（浏览器直接下载）"
            onClick={async () => {
              try {
                const snapshot = await execute('web snapshot')
                const ts = new Date()
                  .toISOString().replace(/[-:T]/g, '').slice(0, 12)
                downloadText(`pmtool-snapshot-${ts}.json`, snapshot, 'application/json')
                const count = (() => { try { const s = JSON.parse(snapshot); return Object.values(s).reduce((n: number, t) => n + (Array.isArray(t) ? t.length : 0), 0) } catch { return 0 } })()
                setMessage(`已导出整库 JSON${count ? `（约 ${count} 条记录）` : ''}。`)
              } catch (error) {
                setMessage(`导出失败：${error instanceof Error ? error.message : String(error)}`)
              }
            }}
          >
            <Download size={15}/>导出 JSON
          </button>
            </div>
          )}
          </div>
          <button
            className="pm-icon-button"
            disabled={busy}
            aria-label="刷新数据"
            title="刷新数据"
            onClick={() => void refresh()}
          >
            <RefreshCw size={16}/>
          </button>
        </div>
      </header>

      {dashOpen
        ? <GlobalBoard
            data={data}
            execute={execute}
            onPickProject={(id) => { setSelected(id); setDashOpen(false) }}
            onOpenRecord={(pid, type, id) => { setDashOpen(false); openRecord(pid, type, id) }}
            onClose={() => setDashOpen(false)}
          />
        : !project
          ? <EmptyWorkspace onCreate={() => setDrawer({ kind: 'project-create' })}/>
          : <>
            {view === 'tasks'
              ? <TasksHeader
                  tasks={tasks}
                  milestones={milestones}
                  disabled={busy}
                  run={run}
                  onSaved={refresh}
                  onOpenTask={(t) => setDrawer({ kind: 'task', task: t })}
                  onGotoView={changeView}
                />
              : null}
            <nav className="pm-view-tabs" aria-label="项目视图" role="tablist">
              <ViewTab active={view === 'tasks'} count={tasks.length} onClick={() => changeView('tasks')}>
                全部任务
              </ViewTab>
              <ViewTab active={view === 'milestones'} count={milestones.length} onClick={() => changeView('milestones')}>
                里程碑
              </ViewTab>
              <ViewTab active={view === 'risk-issues'} count={riskIssues.length} onClick={() => changeView('risk-issues')}>
                风险与问题
              </ViewTab>
              <ViewTab active={view === 'meetings'} count={meetings.length} onClick={() => changeView('meetings')}>
                会议纪要
              </ViewTab>
              <ViewTab active={view === 'reports'} count={reports.length} onClick={() => changeView('reports')}>
                进度汇报
              </ViewTab>
              <ViewTab active={view === 'deliverables'} count={deliverables.length} onClick={() => changeView('deliverables')}>
                交付物
              </ViewTab>
              <ViewTab active={view === 'overview'} onClick={() => changeView('overview')}>
                项目概览
              </ViewTab>
              <ViewTab active={view === 'gantt'} onClick={() => changeView('gantt')}>
                甘特排期
              </ViewTab>
              <ViewTab active={view === 'people'} onClick={() => changeView('people')}>
                人员负载
              </ViewTab>
            </nav>
            <section className="pm-view" role="tabpanel">
              {view === 'tasks' && <TaskTable
                tasks={tasks}
                milestones={milestones}
                disabled={busy}
                onCreate={() => setDrawer({ kind: 'task' })}
                onEdit={task => setDrawer({ kind: 'task', task })}
                onGenWbs={() => {
                  if (!selected) { window.alert('请先选择或新建一个项目，再用 AI 拆解 WBS。'); return }
                  try { localStorage.setItem('pm-ai-mode', 'wbs') } catch { /* ignore */ }
                  setDrawer({ kind: 'ai' })
                }}
                onSaved={refresh}
                run={run}
                execute={execute}
                projectId={project.id}
                overlayOpen={drawer != null || dashOpen || restorePreview != null}
              />}
              {view === 'milestones' && <MilestoneView
                milestones={milestones}
                tasks={tasks}
                disabled={busy}
                onCreate={() => setDrawer({ kind: 'milestone' })}
                onEdit={milestone => setDrawer({ kind: 'milestone', milestone })}
                run={run}
                onSaved={refresh}
                onOpenTask={(t) => setDrawer({ kind: 'task', task: t })}
                onGotoView={changeView}
              />}
              {view === 'risk-issues' && <RiskIssueTable
                records={riskIssues}
                disabled={busy}
                onCreate={() => setDrawer({ kind: 'risk-issue' })}
                onEdit={record => setDrawer({ kind: 'risk-issue', record })}
              />}
              {view === 'meetings' && <MeetingTable
                meetings={meetings}
                onCreate={() => setDrawer({ kind: 'meeting' })}
                onEdit={meeting => setDrawer({ kind: 'meeting', meeting })}
              />}
              {view === 'reports' && <ProgressReportTable
                reports={reports}
                onCreate={() => setDrawer({ kind: 'report' })}
                onEdit={report => setDrawer({ kind: 'report', report })}
              />}
              {view === 'deliverables' && <DeliverableTable
                deliverables={deliverables}
                milestones={milestones}
                tasks={tasks}
                onCreate={() => setDrawer({ kind: 'deliverable' })}
                onEdit={deliverable => setDrawer({ kind: 'deliverable', deliverable })}
              />}
              {view === 'overview' && <Overview project={project} tasks={tasks} milestones={milestones} riskIssues={riskIssues} meetingsCount={meetings.length} reportsCount={reports.length} deliverablesCount={deliverables.length} settings={settings} onEditProject={() => setDrawer({ kind: 'project-edit', project })}/>}
              {view === 'gantt' && <GanttView tasks={tasks} milestones={milestones} run={run} onEdit={task => setDrawer({ kind: 'task', task })} onCreate={() => setDrawer({ kind: 'task' })} disabled={busy} onGotoView={changeView}/>}
              {view === 'people' && <PeopleView
                project={project}
                tasks={tasks}
                riskIssues={riskIssues}
                settings={settings}
                onOpenRecord={(pid, type, id) => openRecord(pid, type, id)}
                onGotoView={changeView}
              />}
            </section>
          </>}

      {drawer && <DrawerPanel title={drawerTitle(drawer)} onClose={() => setDrawer(undefined)}>
        {drawer.kind === 'project-create' && <ProjectForm
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'project-edit' && <ProjectForm
          project={drawer.project}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'task' && project && <TaskForm
          key={drawer.task ? `task-${drawer.task.id}` : 'task-new'}
          projectId={project.id}
          task={drawer.task}
          tasks={tasks}
          milestones={milestones}
          meetings={data.meetings}
          assigneeCandidates={assigneeCandidates}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
          onOpenMeeting={(meetingId, meetingProjectId) => openRecord(meetingProjectId ?? project.id, 'meeting', meetingId)}
        />}
        {drawer.kind === 'milestone' && project && <MilestoneForm
          projectId={project.id}
          milestone={drawer.milestone}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'risk-issue' && project && <RiskIssueForm
          projectId={project.id}
          record={drawer.record}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'meeting' && project && <MeetingForm
          projectId={project.id}
          meeting={drawer.meeting}
          tasks={tasks}
          issues={riskIssues.filter(item => item.type === 'issue')}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'report' && project && <ProgressReportForm
          projectId={project.id}
          report={drawer.report}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'deliverable' && project && <DeliverableForm
          key={drawer.deliverable ? `deliverable-${drawer.deliverable.id}` : 'deliverable-new'}
          projectId={project.id}
          deliverable={drawer.deliverable}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'ai' && project && <AiAssistant
          projectId={project.id}
          execute={execute}
          disabled={busy}
          onConfirmed={() => { void refresh(); setDrawer(undefined) }}
        />}
        {drawer.kind === 'copilot' && project && <CopilotPanel
          projectId={project.id}
          tasks={tasks}
          baselineMap={Object.fromEntries(tasks.map(t => [t.id, (t as { updatedAt?: string }).updatedAt ?? '']))}
          execute={execute}
          disabled={busy}
          onSaved={() => void refresh()}
        />}
        {drawer.kind === 'settings' && <SettingsPanel
          settings={settings}
          execute={execute}
          disabled={busy}
          onSaved={() => void refresh()}
          notify={setMessage}
        />}
      </DrawerPanel>}
    </main>
  </>
}

/**
 * #21 口径设置抽屉：健康分权重/封顶/灯号线、临期窗口、过载阈值。
 * 纯前端表单 + `settings put/reset` 落盘；取值校验与后端 normalize 同一份 SETTING_FIELDS 区间。
 * 配色只走 panel.css 重映射的宿主 token，深浅色跟随 body[data-ds-dark-theme]。
 */
function SettingsPanel({ settings, execute, disabled, onSaved, notify }: {
  settings: ProjectSettings
  execute: (line: string) => Promise<string>
  disabled: boolean
  onSaved: () => void
  notify: (msg: string) => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(SETTING_FIELDS.map(f => [f.key, String(settings[f.key])])),
  )
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [busy, setBusy] = useState(false)

  const isDefault = sameSettings(settings, DEFAULT_PROJECT_SETTINGS)
  const groups: Array<SettingFieldMeta['group']> = ['健康分', '临期窗口', '人员负载']

  const validateField = (f: SettingFieldMeta, raw: string): string | null => {
    const n = Number(raw)
    if (raw.trim() === '' || !Number.isInteger(n) || Number.isNaN(n)) return `须为 ${f.min}~${f.max} 的整数`
    if (n < f.min || n > f.max) return `须为 ${f.min}~${f.max}（当前 ${n}）`
    return null
  }

  const validateAll = (): boolean => {
    const next: Partial<Record<string, string>> = {}
    for (const f of SETTING_FIELDS) {
      const err = validateField(f, values[f.key] ?? '')
      if (err) next[f.key] = err
    }
    // 交叉约束：绿灯线 ≥ 黄灯线。
    const green = Number(values.healthGreenAt)
    const yellow = Number(values.healthYellowAt)
    if (!Number.isNaN(green) && !Number.isNaN(yellow) && green < yellow) {
      next.healthGreenAt = '绿灯线不得低于黄灯线'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const collect = (): Partial<ProjectSettings> => {
    const out: Partial<ProjectSettings> = {}
    for (const f of SETTING_FIELDS) {
      out[f.key] = Number(values[f.key])
    }
    return out
  }

  const save = async () => {
    if (busy) return
    if (!validateAll()) { notify('口径未通过校验，请修正标红字段后再保存。'); return }
    setBusy(true)
    try {
      const payload = JSON.stringify(collect())
      const resp = await execute(`settings put ${payload}`)
      if (/失败|错误|未通过|非法|需为|不得低于/.test(resp)) { notify(resp); return }
      notify('已保存口径设置。')
      onSaved()
    } catch (e) {
      notify(`保存失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const resetAll = async () => {
    if (busy) return
    setBusy(true)
    try {
      const resp = await execute('settings reset')
      if (/失败|错误/.test(resp)) { notify(resp); return }
      notify('已恢复全部默认口径。')
      onSaved()
    } catch (e) {
      notify(`恢复默认失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pm-settings-root">
      <p className="pm-settings-note">
        {isDefault ? '当前为默认口径（与配置化前逐值一致）。' : '当前为自定义口径；改动即时作用于健康分、临期提醒、人员负载与作战室。'}
      </p>
      {groups.map(group => (
        <section className="pm-settings-group" key={group}>
          <h3 className="pm-settings-group-title">{group}</h3>
          <div className="pm-settings-grid">
            {SETTING_FIELDS.filter(f => f.group === group).map(f => {
              const err = errors[f.key]
              const def = DEFAULT_PROJECT_SETTINGS[f.key]
              const v = values[f.key]
              const changed = Number(v) !== def
              return (
                <label className="pm-field" key={f.key} data-wide={f.group === '健康分'} data-invalid={!!err}>
                  <span>{f.label}{changed ? <em className="pm-settings-custom">（默认 {def}{f.unit}）</em> : null}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={v}
                    aria-label={f.label}
                    onChange={(e) => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                  <small className="pm-settings-hint">{f.hint}（{f.min}~{f.max}{f.unit}）</small>
                  {err && <span className="pm-field-error">{err}</span>}
                </label>
              )
            })}
          </div>
        </section>
      ))}
      <div className="pm-drawer-actions">
        <button type="button" className="pm-button pm-button-danger" disabled={disabled || busy} onClick={() => void resetAll()}>
          <RotateCcw size={14}/>恢复默认
        </button>
        <button type="button" className="pm-button pm-top-secondary" disabled={disabled || busy} onClick={() => void save()}>
          保存口径
        </button>
      </div>
    </div>
  )
}

type ReminderItem = { kind: 'task' | 'milestone', id: string, title: string, owner?: string, date: string, d: number }

/** 任务页顶部（方案 C）：大标题 + 统计副标题 + 胶囊提醒条，点开为时间线浮层（盖在表格上方）。 */
function ReminderCapsule({ tasks, milestones, disabled, run, onSaved, onOpenTask, onGotoView }: {
  tasks: Task[]
  milestones: Milestone[]
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
  onOpenTask: (task: Task) => void
  onGotoView: (v: View) => void
}) {
  const today = useMemo(() => localTodayIso(), [])
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState(30)
  const days = (date: string) => Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000)
  const addDays = (iso: string, n: number) => {
    const t = Date.parse(iso); if (Number.isNaN(t)) return iso
    return new Date(t + n * 86_400_000).toISOString().slice(0, 10)
  }

  const items = useMemo<ReminderItem[]>(() => {
    const out: ReminderItem[] = []
    for (const t of tasks) {
      if (t.status === 'done' || (t.progress ?? 0) >= 100 || !t.dueDate) continue
      const d = days(t.dueDate)
      if (d <= range) out.push({ kind: 'task', id: t.id, title: t.title, owner: t.assignee, date: t.dueDate, d })
    }
    for (const m of milestones) {
      if (m.status === 'achieved') continue
      const d = days(m.targetDate)
      if (d <= range) out.push({ kind: 'milestone', id: m.id, title: m.title, owner: undefined, date: m.targetDate, d })
    }
    out.sort((a, b) => a.d - b.d)
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, milestones, range, today])

  const overdue = items.filter(i => i.d < 0).length
  const soon = items.filter(i => i.d >= 0).length
  const groups = useMemo(() => {
    const g = new Map<string, ReminderItem[]>()
    for (const it of items) { const arr = g.get(it.date) ?? []; arr.push(it); g.set(it.date, arr) }
    return [...g.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  const pill = (it: ReminderItem) => it.d < 0
    ? <span className="pm-pop-pill pm-pop-pill-err">逾期 {-it.d} 天</span>
    : it.d === 0
      ? <span className="pm-pop-pill pm-pop-pill-warn">今天</span>
      : it.d <= 7
        ? <span className="pm-pop-pill pm-pop-pill-warn">{it.d} 天后</span>
        : <span className="pm-pop-pill pm-pop-pill-idle">{it.d} 天后</span>

  return (
    <div className="pm-capsule-wrap">
      <button
        type="button"
        className="pm-capsule"
        data-open={open}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <AlertTriangle size={13}/>
        <span>逾期 <b className="pm-capsule-err">{overdue}</b> · 临期 <b className="pm-capsule-warn">{soon}</b></span>
        <ChevronDown size={13} className="pm-capsule-chev"/>
      </button>
      {open && <>
        <div className="pm-pop-scrim" onClick={() => setOpen(false)}/>
        <div className="pm-pop" role="dialog" aria-label="提醒">
          <div className="pm-pop-head">
            <span className="pm-pop-title">提醒</span>
            <span className="pm-pop-seg">
              {[3, 7, 14, 30].map(d =>
                <button key={d} type="button" aria-pressed={range === d}
                  className={range === d ? 'on' : ''} onClick={() => setRange(d)}>{d} 天</button>,
              )}
            </span>
            <button type="button" className="pm-pop-x" aria-label="关闭提醒" onClick={() => setOpen(false)}><X size={14}/></button>
          </div>
          <div className="pm-pop-body">
            {!items.length && <p className="pm-pop-empty">未来 {range} 天内没有临期或逾期事项。</p>}
            {groups.map(([date, list]) =>
              <div className="pm-pop-date" key={date}>
                <span className="pm-pop-datelabel">{date === today ? `今天 ${date}` : date}</span>
                <div className="pm-pop-dots">
                  {list.map(it =>
                    <div className="pm-pop-row" key={it.kind + it.id}>
                      {it.kind === 'milestone'
                        ? <MilestoneIcon size={13} className="pm-pop-type pm-pop-type-mile"/>
                        : <span className="pm-pop-type pm-pop-type-task"/>}
                      <button type="button" className="pm-pop-name"
                        onClick={() => (it.kind === 'task'
                          ? onOpenTask(tasks.find(t => t.id === it.id)!)
                          : onGotoView('milestones'))}>
                        {it.title}
                      </button>
                      {it.owner && <span className="pm-pop-av">{it.owner.slice(0, 1)}</span>}
                      {pill(it)}
                      {it.kind === 'task' && (
                        <span className="pm-pop-acts">
                          <button type="button" title="标记完成" disabled={disabled}
                            onClick={() => void run(`task update ${it.id} ${JSON.stringify({ status: 'done', progress: 100 })}`).then(ok => ok && onSaved())}>
                            <Check size={12}/>
                          </button>
                          <button type="button" title="推迟 +1 天" disabled={disabled}
                            onClick={() => { const t = tasks.find(x => x.id === it.id); if (!t?.dueDate) return; void run(`task update ${it.id} ${JSON.stringify({ dueDate: addDays(t.dueDate, 1) })}`).then(ok => ok && onSaved()) }}>
                            +1
                          </button>
                          <button type="button" title="推迟 +1 周" disabled={disabled}
                            onClick={() => { const t = tasks.find(x => x.id === it.id); if (!t?.dueDate) return; void run(`task update ${it.id} ${JSON.stringify({ dueDate: addDays(t.dueDate, 7) })}`).then(ok => ok && onSaved()) }}>
                            +7
                          </button>
                        </span>
                      )}
                    </div>,
                  )}
                </div>
              </div>,
            )}
          </div>
        </div>
      </>}
    </div>
  )
}

function TasksHeader({ tasks, milestones, disabled, run, onSaved, onOpenTask, onGotoView }: {
  tasks: Task[]
  milestones: Milestone[]
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
  onOpenTask: (task: Task) => void
  onGotoView: (v: View) => void
}) {
  const total = tasks.length
  const inProg = tasks.filter(t => t.status === 'in_progress').length
  const doneN = tasks.filter(t => t.status === 'done').length
  const blocked = tasks.filter(t => t.status === 'blocked').length

  return <div className="pm-tasks-head">
    <div className="pm-tasks-title-row">
      <h1>任务</h1>
    </div>
    <div className="pm-tasks-sub">{total} 个任务 · 进行中 {inProg} · 已完成 {doneN} · 阻塞 {blocked}</div>
    <ReminderCapsule tasks={tasks} milestones={milestones} disabled={disabled} run={run} onSaved={onSaved} onOpenTask={onOpenTask} onGotoView={onGotoView}/>
  </div>
}

/** 人员与负载视图（P0 / v0.5.1）：跨项目按人聚合 open 任务，纯只读派生 snapshot。 */
export function CrossProjectPeople({ data, onPickProject, onOpenRecord }: {
  data: Snapshot
  onPickProject?: (id: string) => void
  onOpenRecord?: (projectId: string, type: string, id: string) => void
}) {
  const today = useMemo(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
  }, [])
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [riskOnly, setRiskOnly] = useState(false)
  const [sortMode, setSortMode] = useState<'risk' | 'open' | 'name'>('risk')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const filteredTasks = useMemo(
    () => (projectFilter ? data.tasks.filter(t => t.projectId === projectFilter) : data.tasks),
    [data.tasks, projectFilter],
  )
  const report = useMemo(
    () => groupOpenTasksByAssignee(filteredTasks, data.projects, { today }),
    [filteredTasks, data.projects, today],
  )

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // 姓名子串搜索：查询串走同一归一化口径（trim/折叠/小写）。
  const q = normalizePerson(search)
  let people = report.people
  if (q) people = people.filter(p => p.display.toLowerCase().includes(q) || p.key.includes(q))
  if (riskOnly) people = people.filter(p => p.overdue > 0 || p.blocked > 0 || p.dueSoon > 0)

  // 排序：默认风险序（core 已排）；另两档客户端重排。
  if (sortMode === 'open') {
    people = [...people].sort((a, b) =>
      b.openTotal - a.openTotal || b.overdue - a.overdue || b.blocked - a.blocked
      || b.dueSoon - a.dueSoon || a.key.localeCompare(b.key))
  } else if (sortMode === 'name') {
    people = [...people].sort((a, b) => a.display.localeCompare(b.display, 'zh-Hans-CN'))
  }

  const totalOverdue = report.people.reduce((n, p) => n + p.overdue, 0) + (report.unassigned?.overdue ?? 0)
  const totalUnassigned = report.unassigned?.openTotal ?? 0

  // 空态 1：无任何任务。
  if (data.tasks.length === 0) {
    return <section className="pm-people pm-empty" aria-label="人员负载">
      <p className="pm-cell-empty">还没有可汇总的任务。先在某个项目里拆解 WBS 并指定负责人，这里会自动按人归集。</p>
    </section>
  }
  // 空态 2：有任务但全部完成。
  if (report.people.length === 0 && !report.unassigned) {
    return <section className="pm-people pm-empty" aria-label="人员负载">
      <p className="pm-cell-empty">目前所有人手上都没有未完成任务。</p>
    </section>
  }

  const renderTaskRow = (t: PersonRow['tasks'][number]) => {
    const when = t.daysUntil === null ? '无截止'
      : t.daysUntil < 0 ? `逾期 ${-t.daysUntil} 天`
        : t.daysUntil === 0 ? '今天到期'
          : `还剩 ${t.daysUntil} 天`
    const tone = t.bucket === 'overdue' ? 'pm-task-when-overdue' : t.bucket === 'due-soon' ? 'pm-task-when-soon' : ''
    const open = () => onOpenRecord?.(t.projectId, 'task', t.id)
    return <li
      key={t.id}
      className="pm-people-task"
      role="button"
      tabIndex={0}
      data-open-record
      data-open-type="task"
      data-open-id={t.id}
      aria-label={`${t.projectName} ${t.title} ${when}`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() }
      }}
    >
      <button
        type="button"
        className="pm-people-project-chip"
        data-pick-project={t.projectId}
        aria-label={`跳到项目 ${t.projectName}`}
        onClick={(e) => { e.stopPropagation(); onPickProject?.(t.projectId) }}
        onKeyDown={(e) => e.stopPropagation()}
      >{t.projectName}</button>
      <span className="pm-people-task-title">{t.code ? `${t.code} ` : ''}{t.title}</span>
      <span className={`pm-people-task-when ${tone}`}>{when}</span>
    </li>
  }

  const renderCard = (row: PersonRow, key: string, isUnassigned = false) => {
    const open = expanded.has(key)
    return <div key={key} className={`pm-person-card${isUnassigned ? ' pm-unassigned' : ''}`}>
      <button
        type="button"
        className="pm-person-head"
        data-person-key={isUnassigned ? 'unassigned' : row.key}
        aria-expanded={open}
        onClick={() => toggle(key)}
      >
        <span className="pm-person-name">
          {isUnassigned ? '⚠ 未分配' : row.display}
          {row.multiOwner && <span className="pm-person-multi" title="多负责人串（未拆分）">组</span>}
        </span>
        <span className="pm-person-meta">
          {row.projectCount > 1 && <span className="pm-person-projects">跨 {row.projectCount} 个项目</span>}
          <span>未完成 {row.openTotal}</span>
          <span>待办 {row.todo} · 进行中 {row.inProgress} · 受阻 {row.blocked}</span>
          {row.overdue > 0 && <span className="pm-chip pm-chip-overdue">逾期 {row.overdue}</span>}
          {row.dueSoon > 0 && <span className="pm-chip pm-chip-soon">临期 {row.dueSoon}</span>}
          {row.p0 > 0 && <span className="pm-chip">P0·{row.p0}</span>}
          <span className="pm-person-next">最近截止 {row.nextDue ?? '—'}</span>
        </span>
      </button>
      {open && <ul className="pm-person-tasks">{row.tasks.map(renderTaskRow)}</ul>}
    </div>
  }

  return <section className="pm-people" aria-label="人员负载">
    <div className="pm-people-toolbar" role="toolbar">
      <input
        className="pm-people-search"
        type="search"
        placeholder="搜索负责人…"
        aria-label="搜索负责人"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <select
        className="pm-people-project-filter"
        aria-label="按项目过滤"
        value={projectFilter}
        onChange={e => setProjectFilter(e.target.value)}
      >
        <option value="">全部项目</option>
        {data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <label className="pm-people-risk-only">
        <input
          type="checkbox"
          checked={riskOnly}
          onChange={e => setRiskOnly(e.target.checked)}
        />只看有风险（逾期/受阻/临期）
      </label>
      <select
        className="pm-people-sort"
        aria-label="排序方式"
        value={sortMode}
        onChange={e => setSortMode(e.target.value as 'risk' | 'open' | 'name')}
      >
        <option value="risk">按风险</option>
        <option value="open">按未完成数</option>
        <option value="name">按姓名</option>
      </select>
    </div>

    <div className="pm-people-summary" aria-live="polite">
      {/* 摘要按产品设计 §6 全局口径：人数=全部有未完成的人（未分配不算人），逾期/无主全局，不随姓名搜索/只看风险变化。 */}
      {report.people.length} 人有未完成 · {totalOverdue} 项逾期 · {totalUnassigned} 项无主
    </div>

    {report.unassigned && renderCard(report.unassigned, '', true)}

    {people.length === 0
      ? <p className="pm-cell-empty">没有匹配的负责人。可清除搜索或切回「全部项目」。</p>
      : people.map(p => renderCard(p, p.key))}
  </section>
}

function BoardPeopleSection({ data, onPickProject, onOpenRecord }: {
  data: Snapshot
  onPickProject: (id: string) => void
  onOpenRecord: (projectId: string, type: string, id: string) => void
}) {
  return <div className="pm-board-section">
    <h2>人员负载（跨项目）</h2>
    <CrossProjectPeople data={data} onPickProject={onPickProject} onOpenRecord={onOpenRecord}/>
  </div>
}

function drawerTitle(drawer: Drawer): string {
  if (drawer.kind === 'project-create') return '新建项目'
  if (drawer.kind === 'project-edit') return '编辑项目'
  if (drawer.kind === 'task') return drawer.task ? '编辑任务' : '新增任务'
  if (drawer.kind === 'milestone') return drawer.milestone ? '编辑里程碑' : '新增里程碑'
  if (drawer.kind === 'risk-issue') return drawer.record ? '编辑风险或问题' : '新增风险或问题'
  if (drawer.kind === 'meeting') return drawer.meeting ? '编辑会议纪要' : '新增会议纪要'
  if (drawer.kind === 'report') return drawer.report ? '编辑进度汇报' : '生成进度汇报'
  if (drawer.kind === 'ai') return 'AI 助手'
  if (drawer.kind === 'copilot') return 'AI 项目副驾'
  if (drawer.kind === 'settings') return '口径设置'
  return drawer.deliverable ? '编辑交付物' : '新增交付物'
}

/**
 * AI 助手面板：完全复用斜杠命令的 core 草稿→confirm 逻辑。
 * “生成草稿”发一次预览命令（调一次模型），“确认入库”发对应 confirm 命令
 * （复用进程内草稿缓存，不再调模型）。AI 结果一律先预览、显式确认才落库。
 */
function AiAssistant({ projectId, execute, disabled, onConfirmed }: {
  projectId: string
  execute: (line: string) => Promise<string>
  disabled?: boolean
  onConfirmed: () => void
}) {
  const [mode, setMode] = useState<'wbs' | 'narrate' | 'summarize'>(() => {
    try {
      const m = localStorage.getItem('pm-ai-mode')
      if (m === 'wbs' || m === 'narrate' || m === 'summarize') return m
    } catch { /* ignore */ }
    return 'wbs'
  })
  const [text, setText] = useState(() => {
    try { return mode === 'wbs' ? (localStorage.getItem('pm-ai-goal') || '') : '' } catch { return '' }
  })
  const [lane, setLane] = useState<'poc' | 'prod'>('poc')
  const switchLane = (next: 'poc' | 'prod') => {
    setLane(next)
    void execute(`model mode ${next}`)
  }
  const [preview, setPreview] = useState('')
  const [working, setWorking] = useState(false)
  const [stage, setStage] = useState<'pick' | 'create'>('pick')
  const [docView, setDocView] = useState<'preview' | 'edit'>('preview')

  const CAPABILITIES = [
    { key: 'wbs' as const, icon: ListTree, name: 'WBS 任务拆解', desc: '一句话目标 → 结构化任务清单', tag: '任务' },
    { key: 'narrate' as const, icon: FileText, name: '进度汇报叙述', desc: '项目数据 → 进展 / 风险 / 下周计划', tag: '汇报' },
    { key: 'summarize' as const, icon: ClipboardList, name: '会议纪要归纳', desc: '会议速记 → 议题 / 决议 / 行动项', tag: '会议' },
  ]

  const WBS_TEMPLATES: [string, string][] = [
    ['官网改版', '为一个小型企业官网改版项目制定工作分解，覆盖需求梳理、视觉设计、前后端开发、测试验收、上线'],
    ['App 版本迭代', '为一个 App 新版本迭代制定工作分解，覆盖需求、设计、开发、联调、灰度发布、复盘'],
    ['活动筹备', '为一次线上活动筹备制定工作分解，覆盖方案、物料、推广、执行、数据复盘'],
  ]

  const needsInput = mode !== 'narrate'
  const canGenerate = !working && !(needsInput && !text.trim())

  const lines = (): { preview: string; confirm: string } => {
    if (mode === 'narrate') {
      // OPT-08：预览可编辑，确认按编辑后文本落盘（report narrateuse，不再调模型）。
      return { preview: `report narrate ${projectId}`, confirm: `report narrateuse ${projectId} ${JSON.stringify(preview)}` }
    }
    if (mode === 'wbs') {
      const goal = text.trim()
      // --raw：只返回原始 Markdown 清单，供下方可编辑预览；确认时用编辑后文本走 importmd（不调模型）。
      return { preview: `task wbs ${projectId} ${goal} --raw`, confirm: `task importmd ${projectId} ${JSON.stringify(preview)} confirm` }
    }
    const transcript = text.trim()
    return { preview: `meeting summarize ${projectId} ${transcript}`, confirm: `meeting summarize ${projectId} ${transcript} confirm ${JSON.stringify(preview)}` }
  }

  const pickCapability = (next: 'wbs' | 'narrate' | 'summarize') => {
    if (working) return
    setMode(next); setText(''); setPreview(''); setDocView('preview'); setStage('create')
    try { localStorage.setItem('pm-ai-mode', next) } catch {}
  }

  const backToPick = () => {
    if (working) return
    setStage('pick')
  }

  const fillTemplate = (goal: string) => {
    if (working) return
    setText(goal); setPreview('')
    try { localStorage.setItem('pm-ai-goal', goal) } catch {}
  }

  const generate = async () => {
    if (!canGenerate) return
    setWorking(true); setPreview(''); setDocView('preview')
    try {
      setPreview(await execute(lines().preview))
    } catch (error) {
      setPreview(error instanceof Error ? error.message : String(error))
    } finally {
      setWorking(false)
    }
  }

  const confirm = async () => {
    if (working || !preview) return
    setWorking(true)
    try {
      await execute(lines().confirm)
      onConfirmed()
    } catch (error) {
      setPreview(error instanceof Error ? error.message : String(error))
      setWorking(false)
    }
  }

  const hints: Record<typeof mode, string> = {
    wbs: '一句话目标，例如：为企业官网改版做拆解（需求/设计/开发/测试/上线）',
    narrate: '将基于项目确定性数据（任务/里程碑进度）生成本周进展、风险与下周计划叙述。',
    summarize: '粘贴会议速记/原始记录，AI 归纳议题、结论与行动项（负责人/截止日）。',
  }

  // 会议纪要预览：去掉「草稿」「确认命令」头尾，只保留结构化内容。
  const cleanMeetingPreview = (raw: string) => raw.split('\n')
    .filter(l => !/^AI 归纳草稿|^确认命令：/.test(l.trim()))
    .join('\n')
    .trim()

  const currentCap = CAPABILITIES.find(c => c.key === mode)
  return <div className="pm-ai">
    {stage === 'pick' ? <>
      {/* 能力选择首页 */}
      <div className="pm-ai-hero">
        <span className="pm-ai-hero-badge"><Sparkles size={16}/></span>
        <div>
          <h3>AI 内容助手</h3>
          <p>选择一个能力，AI 基于项目真实数据生成草稿，确认后才入库。</p>
        </div>
      </div>
      <LaneSwitcher lane={lane} busy={working} onChange={switchLane}/>
      <p className={'pm-ai-lane-note' + (lane === 'poc' ? ' pm-lane-warning' : ' pm-lane-note')}>{lane === 'poc'
        ? 'PoC 为公共免费网关，仅用于概念验证，内容可能被记录。'
        : '生产车道使用官方 API + 自有 Key，未配置 Key 时会给出中文引导。'}</p>
      <div className="pm-ai-cap-grid">
        {CAPABILITIES.map(c => {
          const Icon = c.icon
          return <button key={c.key} type="button" className="pm-ai-cap" disabled={working} onClick={() => pickCapability(c.key)}>
            <span className="pm-ai-cap-icon"><Icon size={18}/></span>
            <span className="pm-ai-cap-body">
              <span className="pm-ai-cap-name">{c.name}</span>
              <span className="pm-ai-cap-desc">{c.desc}</span>
            </span>
            <span className="pm-ai-cap-tag">{c.tag}</span>
          </button>
        })}
      </div>
    </> : <>
      {/* 创作视图 */}
      <div className="pm-ai-create-head">
        <button type="button" className="pm-ai-back" onClick={backToPick} aria-label="返回能力选择"><ArrowLeft size={16}/></button>
        <span className="pm-ai-create-title">{currentCap?.name}</span>
        <LaneSwitcher lane={lane} busy={working} onChange={switchLane} compact/>
      </div>
      <p className="pm-ai-hint">{hints[mode]}</p>
      {needsInput && mode === 'wbs' && (
        <div className="pm-ai-templates">
          {WBS_TEMPLATES.map(([label, goal]) =>
            <button key={label} type="button" className="pm-chip" disabled={working} onClick={() => fillTemplate(goal)}>{label}</button>,
          )}
        </div>
      )}
      {needsInput && (
        <textarea
          className="pm-ai-input"
          rows={mode === 'summarize' ? 6 : 3}
          value={text}
          disabled={working}
          placeholder={hints[mode]}
          onChange={event => {
            const v = event.currentTarget.value
            setText(v)
            if (mode === 'wbs') try { localStorage.setItem('pm-ai-goal', v) } catch {}
          }}
        />
      )}
      <button type="button" className="pm-ai-generate" disabled={!canGenerate || disabled} onClick={() => void generate()}>
        {working
          ? <><RefreshCw size={15} className="pm-spin"/> 生成中…</>
          : <><Sparkles size={15}/> 生成草稿</>}
      </button>
      {preview && (
        <div className="pm-ai-result pm-ai-preview">
          <div className="pm-ai-result-head">
            <div className="pm-seg">
              <button type="button" className={docView === 'preview' ? 'is-on' : ''} onClick={() => setDocView('preview')}><Eye size={13}/> 预览</button>
              <button type="button" className={docView === 'edit' ? 'is-on' : ''} onClick={() => setDocView('edit')}><Code2 size={13}/> 编辑</button>
            </div>
            <button type="button" className="pm-ai-regen" disabled={working} onClick={() => void generate()} title="重新生成"><RotateCcw size={14}/></button>
          </div>
          {docView === 'preview' ? (
            mode === 'wbs'
              ? <WbsTreeView markdown={preview}/>
              : <MarkdownView text={mode === 'summarize' ? cleanMeetingPreview(preview) : preview}/>
          ) : (
            <textarea
              className={'pm-ai-input pm-ai-markdown' + (mode === 'wbs' ? ' pm-ai-wbs-raw' : ' pm-ai-raw')}
              rows={mode === 'wbs' ? 12 : 9}
              value={preview}
              disabled={working}
              onChange={event => setPreview(event.currentTarget.value)}
            />
          )}
          <div className="pm-ai-result-actions pm-ai-actions">
            <button type="button" className="pm-ai-confirm-btn pm-ai-confirm" disabled={working || !preview} onClick={() => void confirm()}>
              <Check size={15}/> 确认入库
            </button>
          </div>
        </div>
      )}
      <p className="pm-ai-footnote">AI 结果为草稿，需点「确认入库」才写入项目；失败时可重试或改用手工录入，核心台账不受影响。</p>
    </>}
  </div>
}

/** OPT-05：批量字段输入（负责人文本 / 截止日期），回车或按钮触发应用。 */
function BatchField({ className, placeholder, type = 'text', onApply }: {
  className?: string
  placeholder: string
  type?: string
  onApply: (json: string) => Promise<boolean | void>
}) {
  const [value, setValue] = useState('')
  const field = type === 'date' ? 'dueDate' : 'assignee'
  return <span className={`pm-batch-field-wrap ${className ?? ''}`}>
    <input
      type={type}
      className="pm-batch-input"
      value={value}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(e) => setValue(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && value.trim()) {
          e.preventDefault()
          void onApply(JSON.stringify({ [field]: value.trim() })).then(() => setValue(''))
        }
      }}
    />
    <button
      type="button"
      className="pm-tool-button"
      disabled={!value.trim()}
      onClick={() => { void onApply(JSON.stringify({ [field]: value.trim() })).then(() => setValue('')) }}
    >应用</button>
  </span>
}

/** OPT-03：从 localStorage 记住的项目 id 解析出有效选中值；已删除/空则回退。 */
export function resolveRememberedProject(storedId: string | undefined, projectIds: string[], fallback?: string): string {
  if (storedId && projectIds.includes(storedId)) return storedId
  return fallback ?? projectIds[0] ?? ''
}

function arrayBufferToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function downloadText(filename: string, text: string, mime: string) {  try {
    const blob = new Blob([text], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {
    window.alert(`当前环境无法直接下载，请改用命令行导出。内容已生成：\n${text.slice(0, 200)}`)
  }
}

function Notice({ message, onClose }: { message: string, onClose: () => void }) {
  const lines = formatNoticeLines(message)
  const isError = /失败|错误|拒绝|不可用|无法处理/i.test(message)
  const path = extractBackupPath(message)
  return <div className={`pm-notice${isError ? ' pm-notice--error' : ''}`} role="status">
    {isError ? <AlertTriangle size={15}/> : <Check size={15}/>}
    <div className="pm-notice-lines">
      {lines.map((line, i) => <div key={i}>{line}</div>)}
    </div>
    {path && (
      <button
        className="pm-button pm-notice-copy"
        onClick={() => { void navigator.clipboard?.writeText(path).catch(() => {}) }}
      >复制路径</button>
    )}
    <button className="pm-plain-icon" aria-label="关闭通知" onClick={onClose}><X size={14}/></button>
  </div>
}

function EmptyWorkspace({ onCreate, onAI }: { onCreate: () => void, onAI?: () => void }) {
  return <div className="pm-empty-workspace">
    <FolderKanban size={38} strokeWidth={1.4}/>
    <strong>建立第一个项目</strong>
    <p>创建项目后即可拆分任务与里程碑。</p>
    <div className="pm-empty-ctas">
      <button className="pm-button pm-button-primary" onClick={onCreate}><Plus size={15}/>新建项目</button>
      {onAI && <button className="pm-button pm-button-primary pm-empty-ai-cta" onClick={onAI}><Sparkles size={15}/>用 AI 一键生成 WBS</button>}
    </div>
  </div>
}

function ViewTab({
  active,
  icon,
  count,
  children,
  onClick,
}: {
  active: boolean
  icon?: ReactNode
  count?: number
  children: ReactNode
  onClick: () => void
}) {
  return <button role="tab" aria-selected={active} className="pm-view-tab" onClick={onClick}>
    {icon}{children}{count !== undefined && <span>{count}</span>}
  </button>
}

/** PROD-09：相邻周期对比徽标。null=无上一份不显示；0=持平；否则 ↑/↓ + 幅度（可带单位，如 %）。 */
function DeltaBadge({ value, unit }: { value: number | null, unit?: string }) {
  if (value === null) return null
  if (value === 0) return <span className="pm-delta pm-delta--flat" title="与上一份持平">持平 0{unit ?? ''}</span>
  const up = value > 0
  return <span className={`pm-delta ${up ? 'pm-delta--up' : 'pm-delta--down'}`} title="与上一份相比">{up ? '↑' : '↓'}{Math.abs(value)}{unit ?? ''}</span>
}

function TableToolbar({
  query,
  setQuery,
  primaryLabel,
  onCreate,
  children,
}: {
  query: string
  setQuery: (value: string) => void
  primaryLabel: string
  onCreate: () => void
  children?: ReactNode
}) {
  return <div className="pm-table-toolbar">
    <button className="pm-add-button" onClick={onCreate}><Plus size={15}/>{primaryLabel}</button>
    {children}
    <label className="pm-table-search">
      <Search size={14}/>
      <input value={query} onChange={event => setQuery(event.currentTarget.value)} placeholder="搜索记录" aria-label="搜索记录"/>
    </label>
  </div>
}

function StatusTag({ kind, value }: { kind: 'project' | 'task' | 'milestone' | 'risk-issue' | 'meeting' | 'report' | 'deliverable', value: string }) {
  const labels = kind === 'project'
    ? projectStatus
    : kind === 'task'
      ? taskStatus
      : kind === 'milestone'
        ? milestoneStatus
        : kind === 'risk-issue'
          ? riskIssueStatus
          : kind === 'meeting'
            ? meetingStatus
            : kind === 'report'
              ? progressReportStatus
              : deliverableStatus
  return <span className="pm-tag" data-kind={kind} data-value={value}>
    <i/>{labels[value] ?? value}
  </span>
}

function Progress({ value }: { value: number | null }) {
  // v0.8：averageProgress=null = 无清单覆盖（证据不足），不渲染假百分比条。
  if (value === null) return <span className="pm-progress-cell pm-progress-cell--muted">证据不足</span>
  return <span className="pm-progress-cell">
    <span><i style={{ width: `${value}%` }}/></span>
    <b>{value}%</b>
  </span>
}

function TableEmpty({ text, action }: { text: string, action?: React.ReactNode }) {
  return <div className="pm-table-empty"><ListTree size={24}/><span>{text}</span>{action}</div>
}

type PlanStepView = CopilotStep & { checked: boolean }

function softRisks(step: CopilotStep, task: Task | undefined, assignees: Set<string>, today: string): string[] {
  const out: string[] = []
  const p = (step.action.patch ?? {}) as Record<string, unknown>
  if (p.progress === 100 && p.status && p.status !== 'done') out.push('口径可能不一致：进度100但未标完成')
  if (p.status === 'done' && typeof p.progress === 'number' && p.progress < 100) out.push('口径可能不一致：已完成但进度未满')
  if (p.status === 'in_progress' && task?.dueDate && task.dueDate < today) out.push('该任务已逾期')
  if (typeof p.assignee === 'string' && p.assignee && !assignees.has(p.assignee)) out.push('新负责人，确认不是错别字')
  return out
}

function CopilotPanel({ projectId, tasks, baselineMap, execute, disabled, onSaved }: {
  projectId: string
  tasks: Task[]
  baselineMap: Record<string, string>
  execute: (line: string) => Promise<string>
  disabled: boolean
  onSaved: () => void
}) {
  const taskIds = tasks.map(t => t.id)
  const taskById = new Map(tasks.map(t => [t.id, t]))
  const assignees = new Set(tasks.map(t => t.assignee).filter(Boolean))
  const today = new Date().toISOString().slice(0, 10)

  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<{ role: string, text: string }[]>([{ role: 'sys', text: '向副驾提问（只读诊断）；若给出多步计划，可勾选/编辑后整批或逐步执行，确认才落库。' }])
  const [steps, setSteps] = useState<PlanStepView[]>([])
  const [rejected, setRejected] = useState<{ stepId?: string, reason: string }[]>([])
  const [openedAt, setOpenedAt] = useState<Record<string, string> | null>(null)
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [lane, setLane] = useState<'poc' | 'prod'>('poc')

  // 打开时读取当前模型车道（model status），用于车道选择器回显。
  useEffect(() => {
    let alive = true
    void execute('model status').then(text => {
      if (!alive) return
      const cur = parseActiveModelLane(text)
      if (cur) setLane(cur)
    }).catch(() => {})
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const switchLane = async (next: 'poc' | 'prod') => {
    setLane(next)
    try { await execute(`model mode ${next}`) } catch { /* 状态条由下次 status 反映 */ }
  }

  const QUICK_ASKS = [
    '本周会不会延期？',
    '哪些任务需要重点关注？',
    '人员负载是否均衡？',
    '给我一份项目健康度总结',
    '临近的里程碑有哪些风险？',
  ]

  const send = async (preset?: string) => {
    const q = (preset ?? input).trim(); if (!q || disabled || sending) return
    if (!preset) setInput('')
    const placeholderText = '思考中…'
    setMsgs(m => [...m, { role: 'me', text: q }, { role: 'sys', text: placeholderText }])
    setSending(true)
    // 只在末尾确为「思考中…」气泡时移除它一次；validatePlan 抛错时不误删已渲染的 diagnosis。
    const removePlaceholder = () => setMsgs(m => (m.length && m[m.length - 1].text === placeholderText ? m.slice(0, -1) : m))
    try {
      const isFixture = q === 'fixture' // 仅精确触发测试缝；普通用户 fixture 开头的原问题原样走真实 ask
      const text = await execute(`ask ${projectId} ${isFixture ? 'fixture' : ''} ${isFixture ? '' : JSON.stringify(q)}`.trim())
      removePlaceholder()
      const { diagnosis, rawSteps } = parseCopilotPlan(text)
      setMsgs(m => [...m, { role: 'ai', text: diagnosis }])
      const v = validatePlan(rawSteps, { taskIds })
      if (v.steps.length || v.rejected.length) {
        setSteps(v.steps.map(s => ({ ...s, checked: true })))
        setRejected(v.rejected)
        setOpenedAt({ ...baselineMap })
      } else {
        setMsgs(m => [...m, { role: 'sys', text: '模型未给出可执行步骤。' }])
      }
    } catch (e) {
      removePlaceholder()
      setMsgs(m => [...m, { role: 'ai', text: `副驾暂不可用：${e instanceof Error ? e.message : String(e)}` }])
    } finally { setSending(false) }
  }

  // 行内标量编辑：仅允许白名单字段；改完即时重跑 validateActions，非法行标红。
  const setPatch = (stepId: string, key: string, value: unknown) => {
    setSteps(prev => prev.map(s => s.stepId === stepId
      ? { ...s, action: { ...s.action, patch: { ...(s.action.patch ?? {}), [key]: value } } }
      : s))
  }
  const invalidStepIds = new Set<string>()
  for (const s of steps) {
    if (!s.checked) continue
    if (validateActions([s.action], { taskIds }).rejected.length) invalidStepIds.add(s.stepId)
  }
  const checked = steps.filter(s => s.checked)
  const anyInvalid = invalidStepIds.size > 0
  const buildActions = () => checked.map(s => ({
    op: s.action.op, id: s.action.id, patch: s.action.patch,
    stepId: s.stepId, title: s.title, needs: s.needs,
  }))
  // 卡顶琥珀提示：打开计划后有任务 updatedAt 变化（不自动重发模型）。
  const staleHint = !!openedAt && tasks.some(t => (t as { updatedAt?: string }).updatedAt !== openedAt[t.id])

  const clearPlan = () => { setSteps([]); setRejected([]); setOpenedAt(null) }

  const runApply = async (mode: 'batch' | 'stepwise') => {
    setBusy(true)
    try {
      let base = { ...baselineMap }
      const ordered = buildActions()
      if (mode === 'batch') {
        const res = await execute(`ask-apply ${projectId} ${JSON.stringify(ordered)} --base ${JSON.stringify(base)}`)
        setMsgs(m => [...m, { role: 'sys', text: res }])
      } else {
        for (const s of checked) {
          // 逐步模式：单步发送时剥掉 needs（避免服务端误判前置未执行而级联跳过）。
          const one = forStepwiseApply(s)
          const res = await execute(`ask-apply ${projectId} ${JSON.stringify([one])} --base ${JSON.stringify(base)}`)
          setMsgs(m => [...m, { role: 'sys', text: `${s.stepId}：${res}` }])
          // 逐步模式每步后重读 domain 刷新链式 baseline（每次 ask-apply 后端也重读）。
          const snap = JSON.parse(await execute('web snapshot')) as { tasks: (Task & { updatedAt?: string })[] }
          base = Object.fromEntries((snap.tasks ?? []).filter(t => t.projectId === projectId).map(t => [t.id, t.updatedAt ?? '']))
        }
      }
      clearPlan(); onSaved()
    } catch (e) {
      setMsgs(m => [...m, { role: 'ai', text: `执行失败：${e instanceof Error ? e.message : String(e)}` }])
    } finally { setBusy(false) }
  }

  const editablePatch = (s: PlanStepView) => (s.action.patch ?? {}) as Record<string, unknown>
  const showQuick = steps.length === 0 && rejected.length === 0
  return <div className="pm-copilot">
    {/* 顶部：说明 + 车道（drawer 标题已在头部，不重复） */}
    <div className="pm-copilot-head">
      <span className="pm-copilot-head-sub">只读诊断 · 确认后才执行</span>
      <LaneSwitcher lane={lane} busy={busy || sending} onChange={l => void switchLane(l)} compact/>
    </div>

    {/* 对话区 */}
    <div className="pm-copilot-messages" role="log" aria-live="polite" aria-busy={sending}>
      {msgs.map((m, i) => {
        if (m.role === 'me')
          return <div key={i} className="pm-copilot-bubble pm-copilot-me">{m.text}</div>
        if (m.role === 'ai')
          return <div key={i} className="pm-copilot-bubble pm-copilot-ai"><MarkdownView text={m.text}/></div>
        return <div key={i} className="pm-copilot-bubble pm-copilot-sys">
          {sending && m.text === '思考中…'
            ? <span className="pm-typing"><span/><span/><span/></span>
            : m.text}
        </div>
      })}
    </div>

    {/* 快捷提问 */}
    {showQuick && (
      <div className="pm-copilot-quick">
        {QUICK_ASKS.map(q =>
          <button key={q} type="button" className="pm-copilot-quick-item" disabled={sending} onClick={() => void send(q)}>
            <Lightbulb size={12}/> {q}
          </button>)}
      </div>
    )}

    {/* 操作计划 */}
    {steps.length > 0 || rejected.length > 0 ? (
      <div className="pm-copilot-draft" data-copilot-plan>
        <div className="pm-copilot-draft-head">
          <ListChecks size={15}/>
          <strong>操作计划</strong>
          <span className="pm-copilot-draft-meta">{steps.length} 步 · {new Set(steps.map(s => s.action.id)).size} 条任务</span>
        </div>
        {staleHint && <div className="pm-copilot-warn">你打开草稿后台账有变化，确认时将逐行重新核对。</div>}
        {steps.map((s, idx) => {
          const invalid = invalidStepIds.has(s.stepId)
          const risks = softRisks(s, taskById.get(String(s.action.id)), assignees, today)
          const patch = editablePatch(s)
          return <div key={s.stepId} data-copilot-step className={`pm-copilot-step${invalid ? ' pm-copilot-step-invalid' : ''}`}>
            <div className="pm-copilot-stephead">
              <label className="pm-copilot-stepcheck">
                <input type="checkbox" checked={s.checked} data-copilot-check={s.stepId}
                  onChange={e => setSteps(prev => prev.map(p => p.stepId === s.stepId ? { ...p, checked: e.target.checked } : p))}/>
                <span className="pm-copilot-stepnum">{idx + 1}</span>
              </label>
              <div className="pm-copilot-stepinfo">
                <span className="pm-copilot-steptitle">{s.title || s.action.id}</span>
                <span className="pm-copilot-stepid">{s.stepId}</span>
              </div>
            </div>
            {s.reason
              ? <div className="pm-copilot-why"><Lightbulb size={11}/> {s.reason}</div>
              : <div className="pm-copilot-why pm-copilot-why-empty">模型未说明原因</div>}
            {s.needs.length > 0 && <div className="pm-copilot-needs"><GitBranch size={10}/> 依赖：{s.needs.join('、')}</div>}
            <div className="pm-copilot-editrow">
              <select value={String(patch.status ?? '')} data-copilot-edit={`${s.stepId}.status`} aria-label="状态"
                onChange={e => e.target.value ? setPatch(s.stepId, 'status', e.target.value) : setPatch(s.stepId, 'status', undefined)}>
                <option value="">状态</option>
                {['todo', 'in_progress', 'blocked', 'done'].map(st => <option key={st} value={st}>{taskStatus[st] ?? st}</option>)}
              </select>
              <input className="pm-copilot-num" type="number" placeholder="进度" min={0} max={100} value={patch.progress == null ? '' : Number(patch.progress)}
                data-copilot-edit={`${s.stepId}.progress`} aria-label="进度"
                onChange={e => setPatch(s.stepId, 'progress', e.target.value === '' ? undefined : Number(e.target.value))}/>
              <input className="pm-copilot-assignee" placeholder="负责人" value={String(patch.assignee ?? '')}
                data-copilot-edit={`${s.stepId}.assignee`} aria-label="负责人"
                onChange={e => setPatch(s.stepId, 'assignee', e.target.value)}/>
              <input className="pm-copilot-date" placeholder="起 YYYY-MM-DD" value={String(patch.startDate ?? '')} data-copilot-edit={`${s.stepId}.startDate`} aria-label="开始日期"
                onChange={e => setPatch(s.stepId, 'startDate', e.target.value || undefined)}/>
              <input className="pm-copilot-date" placeholder="止 YYYY-MM-DD" value={String(patch.dueDate ?? '')} data-copilot-edit={`${s.stepId}.dueDate`} aria-label="截止日期"
                onChange={e => setPatch(s.stepId, 'dueDate', e.target.value || undefined)}/>
            </div>
            {invalid && <div className="pm-copilot-err">该行字段不合法，已禁用确认</div>}
            {risks.map((r, i) => <div key={i} className="pm-copilot-warn">⚠ {r}</div>)}
            {s.riskNote && <div className="pm-copilot-info"><Sparkles size={11}/> 模型提示：{s.riskNote}</div>}
          </div>
        })}
        {rejected.map((r, i) => <div key={`r${i}`} data-copilot-rejected className="pm-copilot-rejected">已拒绝：{r.stepId ? `${r.stepId} ` : ''}{r.reason}</div>)}
        <div className="pm-copilot-actions">
          <button className="pm-copilot-apply-main" data-copilot-apply-batch disabled={busy || anyInvalid || !checked.length} onClick={() => void runApply('batch')}>
            <Check size={14}/> 整批执行（{checked.length}）
          </button>
          <button className="pm-copilot-apply-ghost" data-copilot-apply-stepwise disabled={busy || anyInvalid || !checked.length} onClick={() => void runApply('stepwise')}>
            逐步执行
          </button>
          <button className="pm-copilot-apply-ghost" data-copilot-cancel onClick={clearPlan}>取消</button>
        </div>
      </div>
    ) : null}

    {/* 底部输入 */}
    <div className="pm-copilot-inputrow">
      <input className="pm-copilot-input" value={input} placeholder="问点什么，例如：下周会不会延期？"
        disabled={sending}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') void send() }}/>
      <button className="pm-copilot-send" aria-label="发送" disabled={disabled || !input.trim() || sending} onClick={() => void send()}>
        {sending ? <RefreshCw size={15} className="pm-spin"/> : <Send size={15}/>}
      </button>
    </div>
  </div>
}

function Summary({ label, value, note, tone }: { label: string, value: string | number, note: string, tone?: string }) {
  return <section className="pm-summary" data-tone={tone}>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
  </section>
}

type BoardHit = { type: string, label: string, id: string, title: string, projectId: string, projectName: string }

/** 浏览器端基于 snapshot 的全局检索：与离线 /pm search 同一口径的不区分大小写子串匹配。 */
function collectBoardMatches(data: Snapshot, q: string): BoardHit[] {
  const nameById = new Map(data.projects.map(project => [project.id, project.name]))
  const nameOf = (projectId: string): string => nameById.get(projectId) ?? '（未关联项目）'
  const hits: BoardHit[] = []
  const push = (type: string, label: string, id: string, title: string, projectId: string): void => {
    hits.push({ type, label, id, title, projectId, projectName: nameOf(projectId) })
  }
  const has = (...fields: unknown[]): boolean =>
    fields.some(field => String(field ?? '').toLowerCase().includes(q))

  for (const project of data.projects) {
    if (has(project.name, project.description, project.owner, project.id)) push('project', '项目', project.id, project.name, project.id)
  }
  for (const task of data.tasks) {
    if (has(task.title, task.description, task.assignee, task.id, task.code)) push('task', '任务', task.id, task.title, task.projectId)
  }
  for (const milestone of data.milestones) {
    if (has(milestone.title, milestone.description, milestone.id)) push('milestone', '里程碑', milestone.id, milestone.title, milestone.projectId)
  }
  for (const record of data.riskIssues) {
    if (has(record.title, record.description, record.owner, record.id, record.solution, record.responsePlan)) {
      push('risk', '风险/问题', record.id, record.title, record.projectId)
    }
  }
  for (const meeting of data.meetings) {
    if (has(meeting.title, meeting.summary, meeting.location, meeting.facilitator, meeting.recorder, meeting.id)) {
      push('meeting', '会议纪要', meeting.id, meeting.title, meeting.projectId)
    }
  }
  for (const report of data.reports) {
    if (has(report.title, report.executiveSummary, report.id)) push('report', '进度汇报', report.id, report.title, report.projectId)
  }
  for (const deliverable of data.deliverables) {
    if (has(deliverable.name, deliverable.version, deliverable.location, deliverable.description, deliverable.id)) {
      push('deliverable', '交付物', deliverable.id, deliverable.name, deliverable.projectId)
    }
  }
  const order = ['project', 'task', 'milestone', 'risk', 'meeting', 'report', 'deliverable']
  return hits.sort((a, b) =>
    order.indexOf(a.type) - order.indexOf(b.type)
    || a.projectId.localeCompare(b.projectId)
    || a.id.localeCompare(b.id, 'en', { numeric: true }))
}

function GlobalBoard({ data, execute, onPickProject, onOpenRecord, onClose }: {
  data: Snapshot
  execute: (line: string) => Promise<string>
  onPickProject: (id: string) => void
  onOpenRecord: (projectId: string, type: string, id: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const q = query.trim().toLowerCase()
  const matches = useMemo(() => (q ? collectBoardMatches(data, q) : []), [data, q])

  const totalTasks = data.tasks.length
  const doneTasks = data.tasks.filter(task => task.status === 'done').length
  const overdueTasks = data.tasks.filter(task =>
    task.dueDate && task.dueDate < today && task.status !== 'done').length
  const openRisks = data.riskIssues.filter(record => record.status !== 'closed').length
  const achieved = data.milestones.filter(milestone => milestone.status === 'achieved').length
  const completionRate = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0
  const activeProjects = data.projects.filter(project => project.status === 'active').length

  return <div className="pm-board">
    <div className="pm-board-head">
      <div>
        <h2>总览看板</h2>
        <p>跨项目统计与全局检索，数据来自最新快照；点击任意项目进入其工作台。</p>
      </div>
      <button className="pm-icon-button" aria-label="关闭总览看板" onClick={onClose}><X size={16}/></button>
    </div>
    <label className="pm-board-search">
      <Search size={15}/>
      <input
        value={query}
        onChange={event => setQuery(event.currentTarget.value)}
        placeholder="跨项目搜索：任务 / 里程碑 / 风险 / 会议 / 汇报 / 交付物"
        aria-label="跨项目搜索"
      />
      {query && <button className="pm-plain-icon" type="button" aria-label="清空搜索" onClick={() => setQuery('')}><X size={13}/></button>}
    </label>

    {q
      ? (matches.length
        ? <div className="pm-board-matches">
            <p className="pm-board-note">命中 {matches.length} 条：</p>
            {['project', 'task', 'milestone', 'risk', 'meeting', 'report', 'deliverable'].map(type => {
              const group = matches.filter(hit => hit.type === type)
              if (!group.length) return null
              return <section key={type} className="pm-board-section">
                <h2>{group[0]!.label}（{group.length}）</h2>
                <ul className="pm-board-hit-list">
                  {group.map(hit =>
                    <li key={`${hit.type}-${hit.id}`}>
                      <button type="button" data-open-record={hit.id} data-open-type={hit.type}
                        onClick={() => (hit.type === 'project'
                          ? onPickProject(hit.projectId)
                          : onOpenRecord(hit.projectId, hit.type, hit.id))}>
                        <span>{hit.id}｜{hit.title}</span>
                        <small>所属项目：{hit.projectName}</small>
                      </button>
                    </li>)}
                </ul>
              </section>
            })}
          </div>
        : <div className="pm-table-empty"><Search size={24}/><span>未找到匹配「{query.trim()}」的记录</span></div>)
      : <BoardBento data={data} actions={{ openRecord: onOpenRecord, pickProject: onPickProject }} persistence={{
          onSave: async (scope, layout) => {
            // 紧凑 JSON 落 dsh-storage；后端做轻校验（version 整数、widgets 数组）。
            await execute(`dashboard put ${scope} ${JSON.stringify(layout)}`)
          },
          onReset: async (scope) => {
            await execute(`dashboard reset ${scope}`)
          },
        }} />}
  </div>
}

function DrawerPanel({ title, onClose, children }: { title: string, onClose: () => void, children: ReactNode }) {
  // R3-OBS-002：mount 时快照「打开动作发生那一刻」记录的 opener，
  // 绝不在 mount 后读 document.activeElement（已被表单 autoFocus 抢成抽屉内 input）。
  const openerRef = useRef<OpenerSpec>({ kind: 'none' })
  useLayoutEffect(() => {
    openerRef.current = takeOpenerSpec()
  }, [])
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { ev.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])
  // 关闭/卸载时归还焦点：真实 opener → 行内 title/edit → 当前视图「添加记录」控件，
  // opener 已删除才兜底，绝不落到全局 .pm-button-primary / 提醒条。
  useEffect(() => () => {
    requestAnimationFrame(() => {
      const target = resolveDrawerFocusTarget(openerRef.current, pmFocusDoc)
      if (target instanceof HTMLElement) target.focus()
    })
  }, [])
  return <div className="pm-drawer-layer">
    <button className="pm-drawer-scrim" aria-label="关闭编辑抽屉" onClick={onClose}/>
    <aside className="pm-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <header>
        <div><span>项目记录</span><h2>{title}</h2></div>
        <button className="pm-icon-button" aria-label="关闭抽屉" onClick={onClose}><X size={17}/></button>
      </header>
      <div className="pm-drawer-body">{children}</div>
    </aside>
  </div>
}

/** R3-UX-001：Field 增加可选 required（必填星号）与 error（受控中文内联错误）。
 *  不传时渲染与旧版完全一致，其他实体表单不受影响。 */
function Field({ label, children, wide, required, error, errorId }: {
  label: string
  children: ReactNode
  wide?: boolean
  required?: boolean
  error?: string
  errorId?: string
}) {
  return <label className="pm-field" data-wide={wide || undefined} data-invalid={error ? true : undefined}>
    <span>
      {label}
      {required && <span className="pm-field-required" aria-hidden="true"> *</span>}
    </span>
    {children}
    {error && <span className="pm-field-error" id={errorId} role="alert">{error}</span>}
  </label>
}

function ProjectForm({
  project,
  disabled,
  run,
  onSaved,
}: {
  project?: Project
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
}) {
  // R3-UX-001：name/startDate/targetDate 受控，校验错误内联常驻（替代原生转瞬气泡）。
  const [values, setValues] = useState<ProjectFormValues>({
    name: project?.name ?? '',
    startDate: project?.startDate ?? '',
    targetDate: project?.targetDate ?? '',
    repoUrl: project?.repoUrl ?? '',
    branch: project?.branch ?? '',
  })
  const [errors, setErrors] = useState<FormFieldErrors>({})
  const setField = (field: keyof ProjectFormValues, value: string) => {
    setValues(prev => {
      const next = { ...prev, [field]: value }
      // 输入即重算：字段被纠正后自动清掉对应错误。
      setErrors(validateProjectForm(next))
      return next
    })
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // 受控校验：与按钮/Enter 同路径（submit 默认提交即此处）。不通过则定位到首个错误字段，不发命令。
    const nextErrors = validateProjectForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const first = firstInvalidField(['name', 'startDate', 'targetDate'], nextErrors)
      if (first) {
        const el = event.currentTarget.elements.namedItem(first)
        if (el instanceof HTMLElement) el.focus()
      }
      return
    }
    // 前端校验通过后再交服务端；服务端 run 错误（重名等）仍由全局 Notice 展示，不在这里掩盖。
    const form = new FormData(event.currentTarget)
    const base = {
      description: form.get('description'),
      owner: form.get('owner'),
      startDate: values.startDate,
      targetDate: values.targetDate,
    }
    // S3：update 显式带 trim 空串（core omitEmptyRepoKeys 删键 → 清空生效）；create 省略空。
    const repoFields = project
      ? repoFieldsForUpdate(values.repoUrl, values.branch)
      : repoFieldsForCreate(values.repoUrl, values.branch)
    const payload = project
      ? { name: values.name, status: form.get('status'), ...base, ...repoFields }
      : { name: values.name, ...base, ...repoFields }
    const success = await run(project
      ? `project update ${project.id} ${JSON.stringify(payload)}`
      : `project add ${JSON.stringify(payload)}`)
    if (success) onSaved()
  }
  return <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
    <Field label="项目名称" wide required error={errors.name} errorId="project-name-error">
      <input
        name="name" value={values.name} autoFocus
        onChange={e => setField('name', e.currentTarget.value)}
        aria-required="true"
        aria-invalid={errors.name ? true : undefined}
        aria-describedby={errors.name ? 'project-name-error' : undefined}
      />
    </Field>
    <Field label="项目描述" wide><textarea name="description" defaultValue={project?.description} rows={4}/></Field>
    <Field label="负责人"><input name="owner" defaultValue={project?.owner}/></Field>
    {project && <Field label="项目状态"><select name="status" defaultValue={project.status}>
      {Object.entries(projectStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></Field>}
    <Field label="开始日期" required error={errors.startDate} errorId="project-start-error">
      <input
        name="startDate" type="date" value={values.startDate}
        onChange={e => setField('startDate', e.currentTarget.value)}
        aria-required="true"
        aria-invalid={errors.startDate ? true : undefined}
        aria-describedby={errors.startDate ? 'project-start-error' : undefined}
      />
    </Field>
    <Field label="目标日期" required error={errors.targetDate} errorId="project-target-error">
      <input
        name="targetDate" type="date" value={values.targetDate}
        onChange={e => setField('targetDate', e.currentTarget.value)}
        aria-required="true"
        aria-invalid={errors.targetDate ? true : undefined}
        aria-describedby={errors.targetDate ? 'project-target-error' : undefined}
      />
    </Field>
    <Field label="仓库地址（可选）" error={errors.repoUrl} errorId="project-repo-error">
      <input
        name="repoUrl" value={values.repoUrl ?? ''} placeholder="https://host/org/repo.git"
        onChange={e => setField('repoUrl', e.currentTarget.value)}
        aria-invalid={errors.repoUrl ? true : undefined}
        aria-describedby={errors.repoUrl ? 'project-repo-error' : undefined}
      />
    </Field>
    <Field label="分支（可选）" error={errors.branch} errorId="project-branch-error">
      <input
        name="branch" value={values.branch ?? ''} placeholder="main"
        onChange={e => setField('branch', e.currentTarget.value)}
        aria-invalid={errors.branch ? true : undefined}
        aria-describedby={errors.branch ? 'project-branch-error' : undefined}
      />
    </Field>
    <div className="pm-drawer-actions">
      {project && <button
        className="pm-button pm-button-danger"
        type="button"
        disabled={disabled}
        onClick={() => {
          if (window.confirm(`删除项目 ${project.name}？`)) {
            void run(`project delete ${project.id} confirm`).then(success => success && onSaved())
          }
        }}
      ><Trash2 size={15}/>删除</button>}
      <button className="pm-button pm-button-primary" disabled={disabled}>{project ? '保存更改' : '创建项目'}</button>
    </div>
  </form>
}

function TaskForm({
  projectId,
  task,
  tasks,
  milestones,
  meetings,
  assigneeCandidates,
  disabled,
  run,
  onSaved,
  onOpenMeeting,
}: {
  projectId: string
  task?: Task
  tasks: Task[]
  milestones: Milestone[]
  meetings: Meeting[]
  /** T8：执行人候选（跨项目全量派生，仅建议；不限制/不改写输入值）。 */
  assigneeCandidates: string[]
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
  onOpenMeeting: (meetingId: string, projectId?: string) => void
}) {
  // PROD-10：任务由会议行动项 promote/关联而来时，抽屉顶部展示只读来源链接（前端反查全量 meetings，不落库）。
  const sources = task ? findMeetingSources(meetings, task.id) : []
  const primary = pickPrimarySource(sources)
  // T7：可选 repoUrl/branch 受控（复用三级共享 form-validation 中文校验），编辑预填；
  // 清空传空串，由 core omitEmptyRepoKeys 落盘删键（不写空串）。
  const [repoValues, setRepoValues] = useState({ repoUrl: task?.repoUrl ?? '', branch: task?.branch ?? '' })
  const [repoErrors, setRepoErrors] = useState<FormFieldErrors>({})
  const setRepoField = (field: 'repoUrl' | 'branch', value: string) => {
    setRepoValues(prev => {
      const next = { ...prev, [field]: value }
      setRepoErrors(repoFieldErrors(next.repoUrl, next.branch))
      return next
    })
  }
  // PROD-11 前置依赖选择器：受控已选集合（初始 = 已落盘 predecessorIds）；
  // 搜索词仅过滤视图，被过滤掉的已选项仍在集合中、照常随表单提交。
  const [predQuery, setPredQuery] = useState('')
  const [checkedIds, setCheckedIds] = useState<ReadonlySet<string>>(() => new Set(task?.predecessorIds ?? []))
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // T7：前端内联拦截非法仓库（中文 role=alert / aria-invalid），提交被拦截、磁盘零写。
    const nextRepoErrors = repoFieldErrors(repoValues.repoUrl, repoValues.branch)
    setRepoErrors(nextRepoErrors)
    if (Object.keys(nextRepoErrors).length > 0) {
      const first = firstInvalidField(['repoUrl', 'branch'], nextRepoErrors)
      if (first) {
        const el = event.currentTarget.elements.namedItem(first)
        if (el instanceof HTMLElement) el.focus()
      }
      return
    }
    const form = new FormData(event.currentTarget)
    const parentId = String(form.get('parentId') ?? '')
    const milestoneId = String(form.get('milestoneId') ?? '')
    const startDate = String(form.get('startDate') ?? '')
    const dueDate = String(form.get('dueDate') ?? '')
    // T7：trim 后空串照传，core 落盘时删键；非空传原值。局部更新不误触其它字段。
    const repoUrl = repoValues.repoUrl.trim()
    const branch = repoValues.branch.trim()
    // PROD-11：前置依赖整体替换（多选复选）；空数组即清空。
    const predecessorIds = form.getAll('predecessorIds').map(String)
    const payload = {
      title: form.get('title'),
      description: form.get('description'),
      assignee: form.get('assignee'),
      status: form.get('status'),
      priority: form.get('priority'),
      startDate: startDate || null,
      dueDate: dueDate || null,
      progress: Number(form.get('progress')),
      milestoneId: milestoneId || null,
      predecessorIds,
      repoUrl,
      branch,
    }
    const createPayload = {
      projectId,
      parentId: parentId || null,
      title: payload.title,
      description: payload.description,
      assignee: payload.assignee,
      status: payload.status,
      priority: payload.priority,
      ...(startDate ? { startDate } : {}),
      ...(dueDate ? { dueDate } : {}),
      progress: payload.progress,
      milestoneId: payload.milestoneId,
      ...(predecessorIds.length ? { predecessorIds } : {}),
      ...(repoUrl ? { repoUrl } : {}),
      ...(branch ? { branch } : {}),
    }
    const success = await run(task
      ? `task update ${task.id} ${JSON.stringify(payload)}`
      : `task add ${JSON.stringify(createPayload)}`)
    if (success) onSaved()
  }
  return <form className="pm-drawer-form" onSubmit={event => void submit(event)}>
    {primary && (
      <div className="pm-source-link" data-tip="由会议行动项转为任务，点击打开来源会议">
        <MessageSquare size={13}/>
        <button
          type="button"
          className="pm-source-link-button"
          onClick={() => onOpenMeeting(primary.meetingId, primary.projectId)}
        >来自会议 {primary.meetingId}「{primary.meetingTitle}」</button>
        {sources.length > 1 && <span className="pm-source-extra">另 {sources.length - 1} 场</span>}
      </div>
    )}
    {/* T7：当前已落盘仓库只读链接行（有地址才渲染，外链新标签安全打开；空不渲染空 anchor）。 */}
    {task?.repoUrl && <div className="pm-repo-row" data-repo-link>
      <GitBranch size={14}/>
      <a href={task.repoUrl} target="_blank" rel="noopener noreferrer">{task.repoUrl}</a>
      {task.branch && <span className="pm-muted">@{task.branch}</span>}
    </div>}
    <Field label="任务名称" wide><input name="title" defaultValue={task?.title} required autoFocus/></Field>
    <Field label="任务说明" wide><textarea name="description" defaultValue={task?.description} rows={4}/></Field>
    {/* 横切重设计：两列栅格——状态|优先级、执行人|截止日期各一列；进度跨整行。 */}
    <Field label="状态"><select name="status" defaultValue={task?.status ?? 'todo'}>
      {Object.entries(taskStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></Field>
    <Field label="优先级"><select name="priority" defaultValue={task?.priority ?? 'P1'}>
      <option value="P0">P0 - 高优</option>
      <option value="P1">P1 - 一般</option>
      <option value="P2">P2 - 较低</option>
    </select></Field>
    <Field label="执行人">
      <input name="assignee" defaultValue={task?.assignee} list="pm-assignee-list" autoComplete="off"/>
      {/* T8：候选只作下拉建议（不改写/不预填/不限制已有或新输的值），自由输入新人名照存。 */}
      <datalist id="pm-assignee-list">
        {assigneeCandidates.map(candidate => <option key={candidate} value={candidate}/>)}
      </datalist>
    </Field>
    <Field label="截止日期"><input name="dueDate" type="date" defaultValue={task?.dueDate}/></Field>
    <Field label="完成进度" wide><input name="progress" type="number" min="0" max="100" defaultValue={task?.progress ?? 0}/></Field>
    {/* 父任务下拉含「编号 + 长标题」，跨整行才不截断；仅新建时可选。 */}
    {!task && <Field label="父任务" wide><select name="parentId" defaultValue="">
      <option value="">根任务</option>
      {tasks.map(item => <option key={item.id} value={item.id}>{item.code} {item.title}</option>)}
    </select></Field>}
    <Field label="开始日期"><input name="startDate" type="date" defaultValue={task?.startDate}/></Field>
    <Field label="关联里程碑"><select name="milestoneId" defaultValue={task?.milestoneId ?? ''}>
      <option value="">不关联</option>
      {milestones.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
    </select></Field>
    {/* T7：两个可选仓库输入（复用项目级中文校验，role=alert / aria-invalid）。 */}
    <Field label="仓库地址（可选）" error={repoErrors.repoUrl} errorId="task-repo-error">
      <input
        name="repoUrl" data-repo-field="repoUrl" value={repoValues.repoUrl} placeholder="https://host/org/repo.git"
        onChange={e => setRepoField('repoUrl', e.currentTarget.value)}
        aria-invalid={repoErrors.repoUrl ? true : undefined}
        aria-describedby={repoErrors.repoUrl ? 'task-repo-error' : undefined}
      />
    </Field>
    <Field label="分支（可选）" error={repoErrors.branch} errorId="task-branch-error">
      <input
        name="branch" data-repo-field="branch" value={repoValues.branch} placeholder="main"
        onChange={e => setRepoField('branch', e.currentTarget.value)}
        aria-invalid={repoErrors.branch ? true : undefined}
        aria-describedby={repoErrors.branch ? 'task-branch-error' : undefined}
      />
    </Field>
    <Field label="前置依赖（未完成时本任务显示「等待前置」；DAG 独立于 WBS，仅不可选自身；真正成环由后端拒绝）" wide>
      {(() => {
        // DAG 前置依赖与 WBS 父子是两套关系：WBS 后代也可作合法前置。
        // 前端只排除「自身」；成环检测由服务端 validatePredecessors 负责，不静默丢弃任何现有关系。
        const selfId = task?.id
        const rows = flattenTaskTree(tasks, new Set()).filter(r => r.task.id !== selfId)
        if (!rows.length) return <span className="pm-muted">暂无可选前置任务</span>
        // 搜索：按 code/标题实时过滤视图；被过滤掉的已选项仍在 checkedIds 中、照常提交。
        const q = predQuery.trim().toLowerCase()
        const matches = (row: { task: { code?: string, title: string } }) =>
          !q || row.task.code?.toLowerCase().includes(q) || row.task.title.toLowerCase().includes(q)
        // 层级引导线：前序遍历扁平行序列里，每行子树延伸到 subtreeEnd[i]；
        // ancestorRows[i] = 该行各祖先层所在的行下标（depth 0..depth-1）。祖先层子树在本行之后还有行 → 竖线延续。
        const subtreeEnd = rows.map((row, i) => {
          let end = i
          for (let j = i + 1; j < rows.length && rows[j].depth > row.depth; j++) end = j
          return end
        })
        const ancestorRows: number[][] = rows.map((row, i) => {
          const path: number[] = []
          for (let j = i - 1; j >= 0 && path.length < row.depth; j--) {
            if (rows[j].depth === path.length) path.unshift(j)
          }
          return path
        })
        return <div className="pm-pred-picker">
          <input
            className="pm-pred-search" type="search" placeholder="搜索编号或任务标题…"
            value={predQuery} onChange={e => setPredQuery(e.currentTarget.value)}
            aria-label="搜索前置任务"
          />
          <div className="pm-predecessor-list" role="group" aria-label="可选前置任务">
            {rows.map((row, i) => {
              if (!matches(row)) return null
              const d = row.depth
              return <label key={row.task.id} className="pm-predecessor-item" data-checked={checkedIds.has(row.task.id) || undefined}>
                {Array.from({ length: d }, (_, k) => (
                  <span key={k} className="pm-pred-guide"
                    data-line={subtreeEnd[ancestorRows[i][k]] > i || undefined}
                    data-tick={k === d - 1 || undefined}/>
                ))}
                <input
                  type="checkbox" name="predecessorIds" value={row.task.id}
                  checked={checkedIds.has(row.task.id)}
                  onChange={e => setCheckedIds(prev => {
                    const next = new Set(prev)
                    if (e.currentTarget.checked) next.add(row.task.id); else next.delete(row.task.id)
                    return next
                  })}
                />
                <span className="pm-predecessor-code">{row.task.code}</span>
                <span className="pm-predecessor-name">{row.task.title}</span>
                <span className="pm-pred-status" data-status={row.task.status}>{taskStatus[row.task.status] ?? row.task.status}</span>
              </label>
            })}
            {!rows.some(matches) && <span className="pm-muted">无匹配「{predQuery.trim()}」的任务</span>}
          </div>
          <div className="pm-pred-footer">已选 {checkedIds.size} 项</div>
        </div>
      })()}
    </Field>
    <div className="pm-drawer-actions">
      {task && <button
        className="pm-button pm-button-danger"
        type="button"
        disabled={disabled}
        onClick={() => {
          // 计算该任务的整棵子树大小（含自身），用于决定普通删除还是级联删除。
          const byParent = new Map<string, string[]>()
          for (const item of tasks) {
            if (item.parentId) {
              const list = byParent.get(item.parentId) ?? []
              list.push(item.id)
              byParent.set(item.parentId, list)
            }
          }
          let subtree = 1
          const queue = [task.id]
          while (queue.length) {
            const current = queue.shift()!
            for (const child of byParent.get(current) ?? []) { subtree += 1; queue.push(child) }
          }
          const hasChildren = subtree > 1
          const message = hasChildren
            ? `任务「${task.title}」含 ${subtree - 1} 个子任务。确定删除该任务及其全部 ${subtree - 1} 个子任务吗？旁支任务不受影响，此操作不可撤销。`
            : `删除任务 ${task.title}？`
          if (window.confirm(message)) {
            const line = hasChildren
              ? `task delete ${task.id} cascade confirm`
              : `task delete ${task.id} confirm`
            void run(line).then(success => success && onSaved())
          }
        }}
      ><Trash2 size={15}/>删除</button>}
      <button className="pm-button pm-button-primary" disabled={disabled}>{task ? '保存更改' : '添加任务'}</button>
    </div>
  </form>
}

function MilestoneForm({
  projectId,
  milestone,
  disabled,
  run,
  onSaved,
}: {
  projectId: string
  milestone?: Milestone
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
}) {
  // R3-UX-001：title/targetDate 受控，必填错误内联常驻。
  const [values, setValues] = useState<MilestoneFormValues>({
    title: milestone?.title ?? '',
    targetDate: milestone?.targetDate ?? '',
  })
  const [errors, setErrors] = useState<FormFieldErrors>({})
  const setField = (field: keyof MilestoneFormValues, value: string) => {
    setValues(prev => {
      const next = { ...prev, [field]: value }
      setErrors(validateMilestoneForm(next))
      return next
    })
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateMilestoneForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const first = firstInvalidField(['title', 'targetDate'], nextErrors)
      if (first) {
        const el = event.currentTarget.elements.namedItem(first)
        if (el instanceof HTMLElement) el.focus()
      }
      return
    }
    const form = new FormData(event.currentTarget)
    const status = String(form.get('status'))
    const payload = {
      title: values.title,
      description: form.get('description'),
      targetDate: values.targetDate,
      status,
      achievedDate: status === 'achieved' ? form.get('achievedDate') || new Date().toISOString().slice(0, 10) : null,
    }
    const success = await run(milestone
      ? `milestone update ${milestone.id} ${JSON.stringify(payload)}`
      : `milestone add ${JSON.stringify({ projectId, ...payload })}`)
    if (success) onSaved()
  }
  return <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
    <Field label="里程碑名称" wide required error={errors.title} errorId="milestone-title-error">
      <input
        name="title" value={values.title} autoFocus
        onChange={e => setField('title', e.currentTarget.value)}
        aria-required="true"
        aria-invalid={errors.title ? true : undefined}
        aria-describedby={errors.title ? 'milestone-title-error' : undefined}
      />
    </Field>
    <Field label="说明 / 达成标准" wide><textarea name="description" defaultValue={milestone?.description} rows={5}/></Field>
    <Field label="状态"><select name="status" defaultValue={milestone?.status ?? 'planned'}>
      {Object.entries(milestoneStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></Field>
    <Field label="目标日期" required error={errors.targetDate} errorId="milestone-target-error">
      <input
        name="targetDate" type="date" value={values.targetDate}
        onChange={e => setField('targetDate', e.currentTarget.value)}
        aria-required="true"
        aria-invalid={errors.targetDate ? true : undefined}
        aria-describedby={errors.targetDate ? 'milestone-target-error' : undefined}
      />
    </Field>
    <Field label="实际达成日期" wide><input name="achievedDate" type="date" defaultValue={milestone?.achievedDate ?? ''}/></Field>
    <div className="pm-drawer-actions">
      {milestone && <button
        className="pm-button pm-button-danger"
        type="button"
        disabled={disabled}
        onClick={() => {
          if (window.confirm(`删除里程碑 ${milestone.title}？`)) {
            void run(`milestone delete ${milestone.id} confirm`).then(success => success && onSaved())
          }
        }}
      ><Trash2 size={15}/>删除</button>}
      <button className="pm-button pm-button-primary" disabled={disabled}>{milestone ? '保存更改' : '添加里程碑'}</button>
    </div>
  </form>
}

function RiskIssueForm({
  projectId,
  record,
  disabled,
  run,
  onSaved,
}: {
  projectId: string
  record?: RiskIssue
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
}) {
  const [type, setType] = useState<'risk' | 'issue'>(record?.type ?? 'risk')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const dueDate = String(form.get('dueDate') ?? '')
    const common = {
      title: form.get('title'),
      description: form.get('description'),
      owner: form.get('owner'),
      dueDate: dueDate || null,
      status: form.get('status'),
      impact: form.get('impact'),
      probability: type === 'risk' ? form.get('probability') : null,
      responsePlan: type === 'risk' ? form.get('responsePlan') : '',
      solution: type === 'issue' ? form.get('solution') : '',
    }
    const success = await run(record
      ? `risk-issue update ${record.id} ${JSON.stringify(common)}`
      : `risk-issue add ${JSON.stringify({ projectId, type, ...common })}`)
    if (success) onSaved()
  }
  return <form className="pm-drawer-form" onSubmit={event => void submit(event)}>
    <Field label="记录类型" wide>
      <select
        name="type"
        value={type}
        disabled={Boolean(record)}
        onChange={event => setType(event.currentTarget.value as 'risk' | 'issue')}
      >
        <option value="risk">风险</option>
        <option value="issue">问题</option>
      </select>
    </Field>
    <Field label="标题" wide><input name="title" defaultValue={record?.title} required autoFocus/></Field>
    <Field label="说明" wide><textarea name="description" defaultValue={record?.description} rows={4}/></Field>
    <Field label="状态"><select name="status" defaultValue={record?.status ?? 'open'}>
      {Object.entries(riskIssueStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></Field>
    <Field label="影响程度"><select name="impact" defaultValue={record?.impact ?? 'medium'}>
      {Object.entries(impactLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></Field>
    {type === 'risk' && <Field label="发生概率"><select name="probability" defaultValue={record?.probability ?? 'medium'}>
      {Object.entries(probabilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></Field>}
    <Field label="负责人"><input name="owner" defaultValue={record?.owner}/></Field>
    <Field label="截止日期" wide><input name="dueDate" type="date" defaultValue={record?.dueDate ?? ''}/></Field>
    {type === 'risk'
      ? <Field label="应对措施" wide><textarea name="responsePlan" defaultValue={record?.responsePlan} rows={5}/></Field>
      : <Field label="解决方案" wide><textarea name="solution" defaultValue={record?.solution} rows={5}/></Field>}
    <div className="pm-drawer-actions">
      {record && <button
        className="pm-button pm-button-danger"
        type="button"
        disabled={disabled}
        onClick={() => {
          if (window.confirm(`删除${riskIssueType[record.type]} ${record.title}？`)) {
            void run(`risk-issue delete ${record.id} confirm`).then(success => success && onSaved())
          }
        }}
      ><Trash2 size={15}/>删除</button>}
      <button className="pm-button pm-button-primary" disabled={disabled}>
        {record ? '保存更改' : '添加记录'}
      </button>
    </div>
  </form>
}

function textList(value: FormDataEntryValue | null): string[] {
  return String(value ?? '').split(/\n|、|，/).map(item => item.trim()).filter(Boolean)
}

function MeetingForm({
  projectId,
  meeting,
  tasks,
  issues,
  disabled,
  run,
  onSaved,
}: {
  projectId: string
  meeting?: Meeting
  tasks: Task[]
  issues: RiskIssue[]
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
}) {
  const actionsRef = useRef<HTMLElement>(null)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const startTime = String(form.get('startTime') ?? '')
    const duration = String(form.get('durationMinutes') ?? '')
    const payload = {
      title: form.get('title'),
      meetingDate: form.get('meetingDate'),
      startTime: startTime || null,
      durationMinutes: duration ? Number(duration) : null,
      location: form.get('location'),
      facilitator: form.get('facilitator'),
      recorder: form.get('recorder'),
      participants: textList(form.get('participants')),
      status: form.get('status'),
      summary: form.get('summary'),
      topics: textList(form.get('topics')),
      decisions: textList(form.get('decisions')),
      notes: String(form.get('notes') ?? ''),
    }
    const meetingSaved = await run(meeting
      ? `meeting update ${meeting.id} ${JSON.stringify(payload)}`
      : `meeting add ${JSON.stringify({ projectId, ...payload })}`)
    if (!meetingSaved) return
    if (meeting && actionsRef.current) {
      const actionForms = [...actionsRef.current.querySelectorAll<HTMLFormElement>('form[data-action-form]')]
      for (const actionForm of actionForms) {
        const actionId = actionForm.dataset.actionId
        const actionPayload = meetingActionPayload(new FormData(actionForm))
        if (!actionId && !String(actionPayload.title).trim()) continue
        const actionSaved = await run(actionId
          ? `meeting action update ${meeting.id} ${actionId} ${JSON.stringify(actionPayload)}`
          : `meeting action add ${meeting.id} ${JSON.stringify(actionPayload)}`)
        if (!actionSaved) return
      }
    }
    onSaved()
  }
  return <>
    <form className="pm-drawer-form" onSubmit={event => void submit(event)}>
      <Field label="会议标题" wide><input name="title" defaultValue={meeting?.title} required autoFocus/></Field>
      <Field label="会议日期"><input name="meetingDate" type="date" required defaultValue={meeting?.meetingDate}/></Field>
      <Field label="开始时间"><input name="startTime" type="time" defaultValue={meeting?.startTime ?? ''}/></Field>
      <Field label="时长（分钟）"><input name="durationMinutes" type="number" min="1" max="1440" defaultValue={meeting?.durationMinutes ?? ''}/></Field>
      <Field label="状态"><select name="status" defaultValue={meeting?.status ?? 'draft'}>
        {Object.entries(meetingStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></Field>
      <Field label="地点 / 链接" wide><input name="location" defaultValue={meeting?.location}/></Field>
      <Field label="主持人"><input name="facilitator" defaultValue={meeting?.facilitator}/></Field>
      <Field label="记录人"><input name="recorder" defaultValue={meeting?.recorder}/></Field>
      <Field label="参会人（每行一人）" wide><textarea name="participants" rows={3} defaultValue={meeting?.participants.join('\n')}/></Field>
      <Field label="会议摘要" wide><textarea name="summary" rows={4} defaultValue={meeting?.summary}/></Field>
      <Field label="议题（每行一项）" wide><textarea name="topics" rows={4} defaultValue={meeting?.topics.join('\n')}/></Field>
      <Field label="决议（每行一项）" wide><textarea name="decisions" rows={4} defaultValue={meeting?.decisions.join('\n')}/></Field>
      <Field label="备注 / 手工编辑" wide><textarea name="notes" rows={4} defaultValue={meeting?.notes ?? ''}/></Field>
      <div className="pm-drawer-actions">
        {meeting && <button
          className="pm-button pm-button-danger"
          type="button"
          disabled={disabled}
          onClick={() => {
            if (window.confirm(`删除会议 ${meeting.title}？`)) {
              void run(`meeting delete ${meeting.id} confirm`).then(success => success && onSaved())
            }
          }}
        ><Trash2 size={15}/>删除会议</button>}
        <button className="pm-button pm-button-primary" disabled={disabled}>{meeting ? '保存会议' : '创建会议'}</button>
      </div>
    </form>
    {meeting && <MeetingActions
      sectionRef={actionsRef}
      meeting={meeting}
      tasks={tasks}
      issues={issues}
      disabled={disabled}
      run={run}
      onSaved={onSaved}
    />}
  </>
}

function meetingActionPayload(form: FormData) {
  const dueDate = String(form.get('dueDate') ?? '')
  const taskId = String(form.get('taskId') ?? '')
  const riskIssueId = String(form.get('riskIssueId') ?? '')
  return {
    title: form.get('title'),
    owner: form.get('owner'),
    dueDate: dueDate || null,
    status: form.get('status'),
    taskId: taskId || null,
    riskIssueId: riskIssueId || null,
  }
}

function MeetingActions({
  sectionRef,
  meeting,
  tasks,
  issues,
  disabled,
  run,
  onSaved,
}: {
  sectionRef: RefObject<HTMLElement>
  meeting: Meeting
  tasks: Task[]
  issues: RiskIssue[]
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
}) {
  const saveAction = async (event: FormEvent<HTMLFormElement>, action?: MeetingAction) => {
    event.preventDefault()
    const payload = meetingActionPayload(new FormData(event.currentTarget))
    const success = await run(action
      ? `meeting action update ${meeting.id} ${action.id} ${JSON.stringify(payload)}`
      : `meeting action add ${meeting.id} ${JSON.stringify(payload)}`)
    if (success) onSaved()
  }
  return <section className="pm-meeting-actions" ref={sectionRef}>
    <h3>行动项</h3>
    {meeting.actions.map(action => <form
      className="pm-action-editor"
      key={action.id}
      data-action-form
      data-action-id={action.id}
      onSubmit={event => void saveAction(event, action)}
    >
      <strong>{action.id}</strong>
      <input name="title" aria-label={`${action.id} 标题`} defaultValue={action.title} required/>
      <input name="owner" aria-label={`${action.id} 负责人`} placeholder="负责人" defaultValue={action.owner}/>
      <input name="dueDate" aria-label={`${action.id} 截止日期`} type="date" defaultValue={action.dueDate ?? ''}/>
      <select name="status" aria-label={`${action.id} 状态`} defaultValue={action.status}>
        {Object.entries(meetingActionStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select name="taskId" aria-label={`${action.id} 关联任务`} defaultValue={action.taskId ?? ''}>
        <option value="">不关联任务</option>
        {tasks.map(task => <option key={task.id} value={task.id}>{task.code} {task.title}</option>)}
      </select>
      <select name="riskIssueId" aria-label={`${action.id} 关联问题`} defaultValue={action.riskIssueId ?? ''}>
        <option value="">不关联问题</option>
        {issues.map(issue => <option key={issue.id} value={issue.id}>{issue.title}</option>)}
      </select>
      <button className="pm-row-button" disabled={disabled} aria-label={`保存 ${action.title}`}><Check size={14}/></button>
      {action.taskId
        ? <span className="pm-action-promoted" data-meeting={meeting.id} data-action={action.id} title="该行动项已转为任务">已转 {action.taskId}</span>
        : !meeting?.id
          // 未保存的会议没有 meeting.id，promote 会失败：明确提示，不给出可点入口。
          ? <span className="pm-action-pending" title="请先点「保存会议」落库（获得会议 ID），行动项即可转为任务">保存会议后可转任务</span>
          : <button
              className="pm-action-promote pm-row-button"
              type="button"
              data-meeting={meeting.id}
              data-action={action.id}
              disabled={disabled}
              title="把行动项转为项目任务（已转后此处显示「已转」，重复点击不会再建任务）"
              aria-label={`转任务 ${action.title}`}
              onClick={() => {
                if (window.confirm(`把行动项「${action.title}」转为项目任务？（负责人/截止日一并带入）`)) {
                  void run(`meeting action promote ${meeting.id} ${action.id} confirm`).then(success => success && onSaved())
                }
              }}
            >转任务</button>}
      <button
        className="pm-row-button"
        type="button"
        disabled={disabled}
        aria-label={`删除 ${action.title}`}
        onClick={() => {
          if (window.confirm(`删除行动项 ${action.title}？`)) {
            void run(`meeting action delete ${meeting.id} ${action.id} confirm`).then(success => success && onSaved())
          }
        }}
      ><Trash2 size={14}/></button>
    </form>)}
    <form className="pm-action-editor pm-action-create" data-action-form onSubmit={event => void saveAction(event)}>
      <strong>新增</strong>
      <input name="title" aria-label="新行动项标题" placeholder="行动项标题" required/>
      <input name="owner" aria-label="新行动项负责人" placeholder="负责人"/>
      <input name="dueDate" aria-label="新行动项截止日期" type="date"/>
      <select name="status" aria-label="新行动项状态" defaultValue="todo">
        {Object.entries(meetingActionStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select name="taskId" aria-label="新行动项关联任务"><option value="">不关联任务</option>
        {tasks.map(task => <option key={task.id} value={task.id}>{task.code} {task.title}</option>)}
      </select>
      <select name="riskIssueId" aria-label="新行动项关联问题"><option value="">不关联问题</option>
        {issues.map(issue => <option key={issue.id} value={issue.id}>{issue.title}</option>)}
      </select>
      <button className="pm-button pm-button-primary" disabled={disabled}><Plus size={14}/>添加</button>
    </form>
  </section>
}

function ProgressReportForm({
  projectId,
  report,
  disabled,
  run,
  onSaved,
}: {
  projectId: string
  report?: ProgressReport
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
}) {
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    const payload = {
      ...(title ? { title } : {}),
      status: form.get('status'),
      executiveSummary: form.get('executiveSummary'),
      completedWork: textList(form.get('completedWork')),
      nextPlans: textList(form.get('nextPlans')),
      blockers: textList(form.get('blockers')),
    }
    const success = await run(report
      ? `report update ${report.id} ${JSON.stringify(payload)}`
      : `report generate ${projectId} ${form.get('periodStart')} ${form.get('periodEnd')} ${JSON.stringify(payload)}`)
    if (success) onSaved()
  }
  return <>
    <form className="pm-drawer-form" onSubmit={event => void submit(event)}>
      <Field label="汇报标题" wide>
        <input name="title" defaultValue={report?.title} placeholder="留空时按项目和周期自动生成" autoFocus/>
      </Field>
      <Field label="周期开始">
        <input name="periodStart" type="date" required={!report} disabled={Boolean(report)} defaultValue={report?.periodStart}/>
      </Field>
      <Field label="周期结束">
        <input name="periodEnd" type="date" required={!report} disabled={Boolean(report)} defaultValue={report?.periodEnd}/>
      </Field>
      <Field label="状态" wide><select name="status" defaultValue={report?.status ?? 'draft'}>
        {Object.entries(progressReportStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></Field>
      <Field label="管理摘要" wide><textarea name="executiveSummary" rows={4} defaultValue={report?.executiveSummary}/></Field>
      <Field label="已完成事项（每行一项）" wide><textarea name="completedWork" rows={4} defaultValue={report?.completedWork.join('\n')}/></Field>
      <Field label="下期计划（每行一项）" wide><textarea name="nextPlans" rows={4} defaultValue={report?.nextPlans.join('\n')}/></Field>
      <Field label="阻塞说明（每行一项）" wide><textarea name="blockers" rows={3} defaultValue={report?.blockers.join('\n')}/></Field>
      <div className="pm-drawer-actions">
        {report && <>
          <button
            className="pm-button pm-button-danger"
            type="button"
            disabled={disabled}
            onClick={() => {
              if (window.confirm(`删除进度汇报 ${report.title}？`)) {
                void run(`report delete ${report.id} confirm`).then(success => success && onSaved())
              }
            }}
          ><Trash2 size={15}/>删除</button>
          <button className="pm-button" type="button" disabled={disabled} onClick={() => void run(`report export ${report.id}`)}>
            <FileText size={15}/>导出 Markdown
          </button>
        </>}
        <button className="pm-button pm-button-primary" disabled={disabled}>
          {report ? '保存汇报' : '生成固定快照'}
        </button>
      </div>
    </form>
    {report && <section className="pm-report-snapshot">
      <header><span>固定快照</span><time>{report.snapshotAt}</time></header>
      <dl>
        <div><dt>任务进度</dt><dd>{report.snapshot.tasks.averageProgress === null ? '证据不足' : `${report.snapshot.tasks.averageProgress}%`}（{report.snapshot.tasks.done}/{report.snapshot.tasks.total} 完成）</dd></div>
        <div><dt>受阻任务</dt><dd>{report.snapshot.tasks.blocked}</dd></div>
        <div><dt>里程碑</dt><dd>{report.snapshot.milestones.achieved}/{report.snapshot.milestones.total} 达成</dd></div>
        <div><dt>周期会议</dt><dd>{report.snapshot.meetings.inPeriod} 场 / {report.snapshot.meetings.decisions} 项决议</dd></div>
      </dl>
      <h3>异常项（{report.snapshot.exceptions.length}）</h3>
      {report.snapshot.exceptions.length
        ? <ul>{report.snapshot.exceptions.map(item => <li key={`${item.kind}-${item.id}`} data-severity={item.severity}>
            <strong>{item.title}</strong><span>{item.detail}</span>
            <small>{item.owner || '未指定负责人'} · {item.dueDate ?? '无截止日期'}</small>
          </li>)}</ul>
        : <p>快照生成时没有异常项。</p>}
    </section>}
  </>
}

function DeliverableForm({
  projectId,
  deliverable,
  disabled,
  run,
  onSaved,
}: {
  projectId: string
  deliverable?: Deliverable
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
}) {
  // T7：可选 repoUrl/branch 受控（三级共享中文校验），编辑预填；清空传空串由 core 删键。
  const [repoValues, setRepoValues] = useState({ repoUrl: deliverable?.repoUrl ?? '', branch: deliverable?.branch ?? '' })
  const [repoErrors, setRepoErrors] = useState<FormFieldErrors>({})
  const setRepoField = (field: 'repoUrl' | 'branch', value: string) => {
    setRepoValues(prev => {
      const next = { ...prev, [field]: value }
      setRepoErrors(repoFieldErrors(next.repoUrl, next.branch))
      return next
    })
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // T7：前端内联拦截非法仓库（中文 role=alert / aria-invalid），提交被拦截。
    const nextRepoErrors = repoFieldErrors(repoValues.repoUrl, repoValues.branch)
    setRepoErrors(nextRepoErrors)
    if (Object.keys(nextRepoErrors).length > 0) {
      const first = firstInvalidField(['repoUrl', 'branch'], nextRepoErrors)
      if (first) {
        const el = event.currentTarget.elements.namedItem(first)
        if (el instanceof HTMLElement) el.focus()
      }
      return
    }
    const form = new FormData(event.currentTarget)
    const dueDate = String(form.get('dueDate') ?? '')
    const changeNote = String(form.get('changeNote') ?? '').trim()
    const repoUrl = repoValues.repoUrl.trim()
    const branch = repoValues.branch.trim()
    const common = {
      name: form.get('name'),
      version: String(form.get('version') ?? '').trim(),
      owner: form.get('owner'),
      status: form.get('status'),
      location: form.get('location'),
      description: form.get('description'),
      dueDate: dueDate || null,
      ...(changeNote ? { changeNote } : {}),
      // update 用 `fields.repoUrl ?? current`：清空必须显式传 ''（core 再删键），omit 会回退成旧值。
      repoUrl,
      branch,
    }
    const success = await run(deliverable
      ? `deliverable update ${deliverable.id} ${JSON.stringify(common)}`
      : `deliverable add ${JSON.stringify({ projectId, ...common })}`)
    if (success) onSaved()
  }
  return <>
    <form className="pm-drawer-form" onSubmit={event => void submit(event)}>
      <Field label="交付物名称" wide><input name="name" defaultValue={deliverable?.name} required autoFocus/></Field>
      <Field label="版本"><input name="version" defaultValue={deliverable?.version} placeholder="如 v1.0"/></Field>
      <Field label="状态"><select name="status" defaultValue={deliverable?.status ?? 'planned'}>
        {Object.entries(deliverableStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></Field>
      <Field label="负责人"><input name="owner" defaultValue={deliverable?.owner}/></Field>
      <Field label="计划交付日期" wide><input name="dueDate" type="date" defaultValue={deliverable?.dueDate ?? ''}/></Field>
      <Field label="位置（路径 / 链接 / 存放说明）" wide><input name="location" defaultValue={deliverable?.location} placeholder="exports/交付物.md 或 https://..."/></Field>
      <Field label="说明" wide><textarea name="description" rows={4} defaultValue={deliverable?.description}/></Field>
      {/* T7：两个可选仓库输入（复用项目级中文校验，role=alert / aria-invalid）。 */}
      <Field label="仓库地址（可选）" wide error={repoErrors.repoUrl} errorId="deliverable-repo-error">
        <input
          name="repoUrl" data-repo-field="repoUrl" value={repoValues.repoUrl} placeholder="https://host/org/repo.git"
          onChange={e => setRepoField('repoUrl', e.currentTarget.value)}
          aria-invalid={repoErrors.repoUrl ? true : undefined}
          aria-describedby={repoErrors.repoUrl ? 'deliverable-repo-error' : undefined}
        />
      </Field>
      <Field label="分支（可选）" error={repoErrors.branch} errorId="deliverable-branch-error">
        <input
          name="branch" data-repo-field="branch" value={repoValues.branch} placeholder="main"
          onChange={e => setRepoField('branch', e.currentTarget.value)}
          aria-invalid={repoErrors.branch ? true : undefined}
          aria-describedby={repoErrors.branch ? 'deliverable-branch-error' : undefined}
        />
      </Field>
      {deliverable && <Field label="本次变更说明（版本/状态变化时留痕）" wide>
        <input name="changeNote" placeholder="如：提交评审、验收通过"/>
      </Field>}
      <div className="pm-drawer-actions">
        {deliverable && <button
          className="pm-button pm-button-danger"
          type="button"
          disabled={disabled}
          onClick={() => {
            if (window.confirm(`删除交付物 ${deliverable.name}？`)) {
              void run(`deliverable delete ${deliverable.id} confirm`).then(success => success && onSaved())
            }
          }}
        ><Trash2 size={15}/>删除</button>}
        <button className="pm-button pm-button-primary" disabled={disabled}>
          {deliverable ? '保存更改' : '新增交付物'}
        </button>
      </div>
    </form>
    {/* T7：当前已落盘仓库只读链接行（有地址才渲染；空不渲染空 anchor）。 */}
    {deliverable?.repoUrl && <div className="pm-repo-row" data-repo-link>
      <GitBranch size={14}/>
      <a href={deliverable.repoUrl} target="_blank" rel="noopener noreferrer">{deliverable.repoUrl}</a>
      {deliverable.branch && <span className="pm-muted">@{deliverable.branch}</span>}
    </div>}
    {deliverable && <section className="pm-deliverable-history">
      <h3>版本 / 状态变更留痕（{deliverable.history.length}）</h3>
      {deliverable.history.length
        ? <ul>{[...deliverable.history].reverse().map((change, index) => {
          const target = change.field === 'created' ? '创建' : change.field === 'status' ? '状态' : '版本'
          const transition = change.field === 'created'
            ? (deliverableStatus[change.to] ?? change.to)
            : `${deliverableStatus[change.from] ?? change.from} → ${deliverableStatus[change.to] ?? change.to}`
          return <li key={`${change.at}-${index}`}>
            <strong>{target}：{transition}</strong>
            <span>{change.at.slice(0, 10)}{change.by ? ` · ${change.by}` : ''}</span>
            {change.note && <small>{change.note}</small>}
          </li>
        })}</ul>
        : <p>暂无变更留痕。</p>}
    </section>}
  </>
}

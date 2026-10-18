import { flattenVisible as flattenTaskTree } from '../core/task-tree.js'
import { resolveRecordLocation, findRecord } from '../core/record-location.js'
import { VIEW_LABELS, buildNarrowSwitcher } from '../core/nav.js'
import { NavRail } from './nav-rail.js'
import { clampProgress as writeClampProgress, parseProgressInput } from '../core/task-inline.js'
import { findMeetingSources, pickPrimarySource } from '../core/meeting-source.js'
import { localTodayIso, isTaskOverdue } from '../core/derived.js'
import { groupOpenTasksByAssignee, normalizePerson, type PersonRow } from '../core/people-load.js'
import { listAssigneeCandidates } from '../core/people-candidates.js'
import {
  DEFAULT_PROJECT_SETTINGS, SETTING_FIELDS, normalizeProjectSettings, sameSettings,
  type ProjectSettings, type SettingFieldMeta,
} from '../core/settings.js'
import { projectStatusLabels, taskStatusLabels, milestoneStatusLabels, deliverableStatusLabels } from '../core/labels.js'
import { deriveProgressMap, checklistFraction, resolveTaskProgressMeta, clampProgress, isProgressOutOfRange } from '../core/progress-derivation.js'
import { validateActions, parseCopilotPlan, validatePlan, forStepwiseApply, type CopilotStep } from '../core/copilot.js'
import { extractReferencedTaskIds, planTaskIds, dueUrgency, latestAppliedBatches, refreshSucceeded, type AppliedBatch } from '../core/ask-projection.js'
import { formatNoticeLines, extractBackupPath, parseActiveModelLane } from '../core/ui-feedback.js'
import { buildDiagnosis, type DiagnosisBubble } from '../core/suggestion-engine.js'
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
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react'
import {
  setPointerOpener, takeOpenerSpec, resolveDrawerFocusTarget,
  type FocusDoc, type OpenerSpec,
} from '../core/drawer-focus.js'
import {
  validateProjectForm, validateMilestoneForm, validateTaskForm, validateRiskIssueForm,
  validateMeetingForm, validateReportForm, validateDeliverableForm,
  repoFieldsForUpdate, repoFieldsForCreate, firstInvalidField,
  type FormFieldErrors, type ProjectFormValues, type MilestoneFormValues,
  type TaskFormValues, type RiskIssueFormValues, type MeetingFormValues,
  type ReportFormValues, type DeliverableFormValues,
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
import { OkrsView } from './views/okrs.js'
import { HabitsView, type HabitViewRecord, type HabitInboxSuggestion } from './views/habits.js'
import type { OkrViewRecord, OkrInboxSuggestion } from './views/okr-model.js'
import { ProvenancePanel } from './provenance-panel.js'
import styles from './panel.css?raw'

/** R3-OBS-002：把焦点归还解析接到真实 document（测试时由伪 DOM 注入，不在此硬编码）。 */
const pmFocusDoc: FocusDoc = {
  contains: (node) => typeof Node !== 'undefined' && node instanceof Node ? document.contains(node as Node) : false,
  rowOpener: (rowId) => document.querySelector(`[data-pm-row="${rowId}"] .pm-title-cell, [data-pm-row="${rowId}"] .pm-row-button`) as HTMLElement | null,
  fallbackControl: () => document.querySelector('.pm-add-row') as HTMLElement | null,
  anyRowTitle: () => document.querySelector('.pm-title-cell') as HTMLElement | null,
}

/**
 * E11：列表滚动位模块级快照。抽屉打开期间（autofocus / 开合）会把 .pm-shell 带回顶部，
 * 这里只在「抽屉关闭、用户浏览列表」时记录最后滚动位；抽屉打开期间不覆盖，
 * 关闭（保存成功 / 取消）时还原，保证保存后回到原筛选 / 排序 / 滚动上下文。
 * 纯滚动位置保留，不改筛选状态、不碰焦点 / tab 导航。
 */
let drawerOpenDepth = 0
let lastListScroller: Element | null = null
let lastListScrollTop = 0
if (typeof document !== 'undefined') {
  document.addEventListener('scroll', (ev) => {
    if (drawerOpenDepth > 0) return
    const t = ev.target
    if (t instanceof Element && t.classList?.contains('pm-shell')) {
      lastListScroller = t
      lastListScrollTop = t.scrollTop
    }
  }, true)
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
  completedDate?: string
  effortHours?: number
  evidenceUrl?: string
  manualProgress?: number | null
  manualProgressNote?: string
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

/** 后端 okr 收件区原始条目（status 口径）；前端视图用 state:'ignored'，此处做映射。 */
type RawOkrSuggestion = {
  id: string
  at: string
  projectId: string
  title: string
  kind: 'objective' | 'key-result'
  primaryOkrId?: string | null
  rationale?: string
  status?: 'pending' | 'confirmed' | 'ignored'
}

export type Snapshot = {
  projects: Project[]
  tasks: Task[]
  milestones: Milestone[]
  riskIssues: RiskIssue[]
  meetings: Meeting[]
  reports: ProgressReport[]
  deliverables: Deliverable[]
  /** P2 X7 愿景/OKR 层：snapshot.okrs 由服务端快照注入；缺失/旧档时前端回落空数组。 */
  okrs?: OkrViewRecord[]
  /** P2 收件区 pmOkrInbox：snapshot.okrInbox 透传；未携带（undefined）时视图只显示命令提示，不伪造建议。 */
  okrInbox?: RawOkrSuggestion[]
  /** P3 X7 习惯层：snapshot.habits 由服务端快照注入；缺失/旧档时前端回落空数组。 */
  habits?: HabitViewRecord[]
  /** P3 收件区 pmHabitInbox：snapshot.habitInbox 透传；未携带（undefined）时视图只显示命令提示，不伪造建议。 */
  habitInbox?: HabitInboxSuggestion[]
  /** 看板布局（dsh-storage 透明存取）：user > project；读不到为 null。 */
  dashboards?: { user: unknown, project: unknown }
  /** #21 口径设置：服务端已归一化的生效口径；缺失/异常时前端再归一化回落默认。 */
  settings?: unknown
}
type View = 'tasks' | 'milestones' | 'risk-issues' | 'meetings' | 'reports' | 'deliverables' | 'overview' | 'gantt' | 'people' | 'okrs' | 'habits'
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
  | { kind: 'settings' }

export interface PmPanelApi {
  execute(line: string): Promise<string>
  /** 执行命令并返回 dsh 规范化结果（仅 kind/text；撤销句柄需另调 ask-undo list 查询）。 */
  executeRaw(line: string): Promise<{ kind: string, text: string }>
}

const empty: Snapshot = { projects: [], tasks: [], milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [] }
// 单一来源来自 core 各 *Labels；转 Record<string,string> 以兼容以 string 变量索引的既有调用点。
const projectStatus = projectStatusLabels as Record<string, string>
const taskStatus = taskStatusLabels as Record<string, string>
const milestoneStatus = milestoneStatusLabels as Record<string, string>
const deliverableStatus = deliverableStatusLabels as Record<string, string>

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
              <span className="pm-project-menu-text">
                <span className="pm-project-menu-name">{p.name}</span>
                <span className="pm-project-menu-meta">
                  {p.id}{p.startDate ? ` · ${p.startDate}` : ''}{p.owner ? ` · ${p.owner}` : ''}
                </span>
              </span>
              {selected && <Check size={15}/>}
            </button>
          })}
        </div>
      )}
    </div>
  )
}

/**
 * P1-8：≤560 窄窗视图切换下拉（替代平铺 tab 条）。
 * 触发器显示当前视图名 + 计数徽标 + ChevronDown；展开 listbox 列全部视图与计数，
 * ↑↓ 移动、Enter 确认、Esc / 点击外部关闭；选中项打勾高亮，背景 dimmed。
 * ≥561 不渲染（外层按 narrow 条件切换为平铺下划线 tab）。
 */
function ViewSwitcher({ current, items, onPick }: {
  current: View
  items: { key: string, label: string, count?: number }[]
  onPick: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const currentIndex = Math.max(0, items.findIndex(item => item.key === current))
  const currentItem = items[currentIndex]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false) } }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (index: number) => {
    const item = items[index]
    if (item) { onPick(item.key); setOpen(false) }
  }

  return (
    <div className="pm-view-switcher" ref={wrapRef}>
      {open && <button className="pm-view-scrim" aria-hidden="true" tabIndex={-1} onClick={() => setOpen(false)}/>}
      <button
        type="button"
        className={'pm-view-switcher-btn' + (open ? ' is-open' : '')}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => { setOpen(v => !v); setActiveIndex(currentIndex) }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (!open) { setOpen(true); setActiveIndex(currentIndex) }
            else setActiveIndex(i => (i + 1) % items.length)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            if (!open) { setOpen(true); setActiveIndex(currentIndex) }
            else setActiveIndex(i => (i <= 0 ? items.length - 1 : i - 1))
          } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault()
            choose(activeIndex)
          }
        }}>
        <span className="pm-view-switcher-name">{currentItem?.label ?? '选择视图'}</span>
        {currentItem && currentItem.count !== undefined && <span className="pm-view-switcher-count">{currentItem.count}</span>}
        <ChevronDown size={15} className={open ? 'pm-caret-open' : undefined}/>
      </button>
      {open && (
        <div className="pm-view-menu" role="listbox" aria-label="切换视图">
          {items.map((item, i) => {
            const selected = item.key === current
            return <button
              key={item.key}
              type="button"
              role="option"
              aria-selected={selected}
              className={'pm-view-menu-item' + (selected ? ' is-selected' : '') + (i === activeIndex ? ' is-active' : '')}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => choose(i)}>
              <span className="pm-view-menu-check">{selected && <Check size={15}/>}</span>
              <span className="pm-view-menu-name">{item.label}</span>
              {item.count !== undefined
                ? <span className="pm-view-menu-count">{item.count}</span>
                : <span className="pm-view-menu-count pm-view-menu-count--none">—</span>}
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
  // I6：自定义 tab 完整键盘行为——←/→（↑/↓）循环移动选中并跟随焦点，roving tabindex。
  const order = ['poc', 'prod'] as const
  const onKey = (ev: ReactKeyboardEvent<HTMLDivElement>) => {
    if (busy) return
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft' && ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return
    ev.preventDefault()
    const list = ev.currentTarget
    const idx = order.indexOf(lane)
    const next = order[(idx + (ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? 1 : order.length - 1)) % order.length]
    onChange(next)
    requestAnimationFrame(() => {
      const btns = [...list.querySelectorAll<HTMLElement>('[role=tab]')]
      btns[order.indexOf(next)]?.focus()
    })
  }
  return <div className={'pm-lane-switch pm-model-lane' + (compact ? ' is-compact' : '')} role="tablist" aria-label="模型车道" onKeyDown={onKey}>
    <button type="button" role="tab" aria-selected={lane === 'poc'} tabIndex={lane === 'poc' ? 0 : -1} disabled={busy}
      className={'pm-lane-poc' + (lane === 'poc' ? ' is-on' : '')} onClick={() => onChange('poc')}>
      <Zap size={13}/> PoC 免费
    </button>
    <button type="button" role="tab" aria-selected={lane === 'prod'} tabIndex={lane === 'prod' ? 0 : -1} disabled={busy}
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

export function PmPanel({ execute, executeRaw }: PmPanelApi) {
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
      if (v === 'tasks' || v === 'milestones' || v === 'risk-issues' || v === 'meetings' || v === 'reports' || v === 'deliverables' || v === 'overview' || v === 'gantt' || v === 'people' || v === 'okrs' || v === 'habits') return v
    } catch { /* ignore */ }
    return 'tasks'
  })
  const changeView = (v: View) => {
    setView(v)
    try { localStorage.setItem('pm-view', v) } catch { /* ignore */ }
  }
  // P1-6：密度全局偏好（comfortable | compact），localStorage 持久、根容器 data-density 下发给各视图。
  const [density, setDensityRaw] = useState<'comfortable' | 'compact'>(() => {
    try { return localStorage.getItem('pm-density') === 'compact' ? 'compact' : 'comfortable' } catch { return 'comfortable' }
  })
  const setDensity = (next: 'comfortable' | 'compact') => {
    setDensityRaw(next)
    try { localStorage.setItem('pm-density', next) } catch { /* ignore */ }
  }
  // P1-8：≤560 视图标签折叠为下拉（与各视图 390 档同一媒体断点）。
  const [narrow, setNarrow] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 560px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 560px)')
    const onChange = () => setNarrow(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
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
  // E10：在途命令并发守卫。同一时刻只允许一条命令执行；第二次并发调用直接返回 false，
  // 不重复落库（双击 / 回车连发 / pending 期间二次点击都被挡）。
  const inflightRef = useRef(false)
  const [message, setMessage] = useState('')
  const [dashOpen, setDashOpen] = useState(false)
  const [topMenuOpen, setTopMenuOpen] = useState(false)
  // P1-7 副驾内嵌建议层（替代全屏抽屉）。
  const [copilotLayer, setCopilotLayer] = useState(false)
  // 右侧面板模式：只读诊断 / 草稿待确认。
  const [copilotMode, setCopilotMode] = useState<'diagnosis' | 'draft'>('diagnosis')
  // 已逐条关闭的诊断气泡 id（仅前端态，不写盘）。
  const [dismissedDiagnosis, setDismissedDiagnosis] = useState<ReadonlySet<string>>(new Set())

  /** 重读 web snapshot；返回是否成功（失败仅置消息并返回 false，不抛，兼容既有 void 调用方）。 */
  const refresh = async (): Promise<boolean> => {
    setBusy(true)
    try {
      const next = JSON.parse(await execute('web snapshot')) as Snapshot
      setData(next)
      // OPT-03：刷新后回填记住的项目；已删除则回退到当前首个项目，不留脏值。
      const ids = next.projects.map(p => p.id)
      let stored = ''
      try { stored = localStorage.getItem('pm-selected-project') ?? '' } catch { /* ignore */ }
      setSelected(resolveRememberedProject(stored, ids, selected && ids.includes(selected) ? selected : undefined))
      return true
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
      return false
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
    // E10：pending 期间第二次并发调用直接拒绝，二次提交不可能；按钮由 busy/submitting 禁用。
    if (inflightRef.current) return false
    inflightRef.current = true
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
    } finally {
      inflightRef.current = false
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
  const okrs = useMemo(() => (data.okrs ?? [])
    .filter(item => item.projectId === selected),
  [data.okrs, selected])
  const habits = useMemo(() => (data.habits ?? [])
    .filter(item => item.projectId === selected),
  [data.habits, selected])
  // X7 收件区：snapshot 未携带（undefined）时原样透传，视图据此只显示命令提示，不伪造建议。
  // 后端 status(ignored) → 前端 state(ignored) 映射；其余状态不落 state。
  const okrInbox = useMemo<OkrInboxSuggestion[] | undefined>(() => {
    if (data.okrInbox === undefined) return undefined
    return data.okrInbox.map(s => ({
      id: s.id, at: s.at, projectId: s.projectId, title: s.title,
      kind: s.kind, primaryOkrId: s.primaryOkrId ?? null, rationale: s.rationale,
      state: s.status === 'ignored' ? 'ignored' : s.status === 'confirmed' ? 'confirmed' : undefined,
    }))
  }, [data.okrInbox])
  const habitInbox = useMemo(() => data.habitInbox, [data.habitInbox])
  // 窄屏切换项与桌面 rail 同源：由导航模型派生（buildNarrowSwitcher），不在组件内硬编码标签/条目。
  const switcherItems = useMemo(() => buildNarrowSwitcher({
    tasks: tasks.length,
    milestones: milestones.length,
    riskIssues: riskIssues.length,
    meetings: meetings.length,
    reports: reports.length,
    deliverables: deliverables.length,
    okrs: okrInbox?.filter(s => s.projectId === selected && s.state === undefined).length,
    habits: habitInbox?.filter(s => s.projectId === selected && s.status === 'pending').length,
  }), [tasks, milestones, riskIssues, meetings, reports, deliverables, okrInbox, habitInbox, selected])
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

  // P1-7：规则诊断（确定性，复用统一口径）；过滤掉已逐条关闭的气泡。
  const allDiagnosis = useMemo(
    () => buildDiagnosis({ tasks, settings }),
    [tasks, settings],
  )
  const diagnosis = useMemo(
    () => allDiagnosis.filter(d => !dismissedDiagnosis.has(d.id)),
    [allDiagnosis, dismissedDiagnosis],
  )
  const dismissDiagnosis = (id: string) => setDismissedDiagnosis(prev => {
    const next = new Set(prev); next.add(id); return next
  })

  return <>
    <style>{styles}</style>
    <main
      className="pm-shell"
      data-density={density}
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
      <NavRail
        view={view}
        dashOpen={dashOpen}
        hasProject={!!project}
        projectName={project?.name}
        counts={{
          tasks: tasks.length,
          milestones: milestones.length,
          riskIssues: riskIssues.length,
          meetings: meetings.length,
          reports: reports.length,
          deliverables: deliverables.length,
          okrs: okrInbox?.filter(s => s.projectId === selected && s.state === undefined).length,
          habits: habitInbox?.filter(s => s.projectId === selected && s.status === 'pending').length,
        }}
        onPickView={(v) => { setDashOpen(false); changeView(v as View) }}
        onOpenDash={() => setDashOpen(true)}
        onOpenSettings={() => setDrawer({ kind: 'settings' })}
      />
      <div className="pm-main">
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
          <button className="pm-button" onClick={() => setDrawer({ kind: 'project-create' })}>
            <Plus size={15}/>新建项目
          </button>
          {/* O1 方案②：视图主 CTA 常驻顶栏（与「新建项目」同层），落点九视图一致；
              overview/people 无新建语义，不硬造。按钮样式走 accent 描边+12% tint，不走近黑实心。 */}
          {(() => {
            let cta: { label: string; action: () => void } | null = null
            switch (view) {
              case 'tasks':
              case 'gantt':
                cta = { label: '新建任务', action: () => setDrawer({ kind: 'task' }) }
                break
              case 'milestones':
                cta = { label: '新增里程碑', action: () => setDrawer({ kind: 'milestone' }) }
                break
              case 'risk-issues':
                cta = { label: '登记风险/问题', action: () => setDrawer({ kind: 'risk-issue' }) }
                break
              case 'meetings':
                cta = { label: '新增会议', action: () => setDrawer({ kind: 'meeting' }) }
                break
              case 'reports':
                cta = { label: '生成快照', action: () => setDrawer({ kind: 'report' }) }
                break
              case 'deliverables':
                cta = { label: '新增交付物', action: () => setDrawer({ kind: 'deliverable' }) }
                break
              default:
                cta = null
            }
            if (!cta) return null
            return (
              <button
                type="button"
                className="pm-button pm-view-cta"
                disabled={!project || busy}
                onClick={cta.action}
              >
                <Plus size={15}/>{cta.label}
              </button>
            )
          })()}
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
            data-active={copilotLayer || undefined}
            disabled={!project}
            aria-pressed={copilotLayer}
            title="PM 插件内副驾：只读诊断气泡附着记录 + 操作草稿卡（确认才落库）；非宿主全局聊天"
            onClick={() => {
              // 副驾层挂在项目视图分支：总览看板下先退出全局看板回到当前项目，再切换副驾，避免点了无面板。
              if (dashOpen) setDashOpen(false)
              setCopilotLayer(v => !v)
            }}
          >
            <MessageSquare size={15}/>{copilotLayer ? 'AI 副驾 · 内嵌' : 'AI 副驾'}
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
            onClick={() => { setTopMenuOpen(false); setDashOpen(false); setCopilotLayer(true) }}
          >
            <MessageSquare size={15}/>AI 副驾 · 内嵌
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
                if (tasks.length) { rows.push('## 任务', ''); for (const t of tasks) rows.push(`- [ ] ${t.title}${t.assignee ? `（负责人：${t.assignee}）` : ''}${typeof t.progress === 'number' ? ` ${clampProgress(t.progress)}%` : ''}${t.dueDate ? ` 截止 ${t.dueDate}` : ''}`) }
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

      {!dashOpen && project && !narrow && (
        <div className="pm-crumb-bar">
          <span className="pm-crumb">
            <span className="pm-crumb-here">{project.name}</span>
            <span className="pm-crumb-sep">/</span>
            <b>{VIEW_LABELS[view] ?? view}</b>
          </span>
        </div>
      )}

      {dashOpen
        ? <GlobalBoard
            data={data}
            execute={execute}
            onPickProject={(id) => { setSelected(id); setDashOpen(false) }}
            onOpenRecord={(pid, type, id) => { setDashOpen(false); openRecord(pid, type, id) }}
            onClose={() => setDashOpen(false)}
            runCommand={(line) => run(line)}
            refreshBoard={() => refresh()}
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
            {narrow && (
              <ViewSwitcher
                current={view}
                items={switcherItems}
                onPick={(key) => {
                  // D3（320 看板可达）：扁平下拉补「总览看板」入口，打开全局看板，不再只能经隐藏 rail 进入。
                  if (key === 'dashboard') { setDashOpen(true); return }
                  changeView(key as View)
                }}
              />
            )}
            <div className="pm-suggest-split" data-open={copilotLayer || undefined}>
            {/* I6：此处无归属它的 tablist（导航为 rail 菜单），移除孤立 role=tabpanel，避免无主面板。 */}
            <section className="pm-view">
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
                projectName={project.name}
                density={density}
                onDensityChange={setDensity}
                overlayOpen={drawer != null || dashOpen || restorePreview != null}
                diagnosis={diagnosis}
                onDismissDiagnosis={dismissDiagnosis}
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
              {view === 'okrs' && <OkrsView
                projectId={project.id}
                okrs={okrs}
                inbox={okrInbox}
                run={run}
                onSaved={refresh}
              />}
              {view === 'habits' && <HabitsView
                projectId={project.id}
                habits={habits}
                inbox={habitInbox}
                okrs={okrs}
                run={run}
                onSaved={refresh}
              />}
            </section>
            {copilotLayer && project && <aside className="pm-suggest-layer" aria-label="AI 副驾建议层">
              <CopilotPanel
                projectId={project.id}
                tasks={tasks}
                milestones={milestones}
                riskIssues={riskIssues}
                deliverables={deliverables}
                meetings={meetings}
                baselineMap={Object.fromEntries(tasks.map(t => [t.id, (t as { updatedAt?: string }).updatedAt ?? '']))}
                execute={execute}
                executeRaw={executeRaw}
                disabled={busy}
                onSaved={refresh}
                onOpenRecord={openRecord}
                embedded
                diagnosis={diagnosis}
                onDismissDiagnosis={dismissDiagnosis}
                mode={copilotMode}
                onModeChange={setCopilotMode}
              />
            </aside>}
            </div>
          </>}
      </div>

      {drawer && <DrawerPanel title={drawerTitle(drawer)} onClose={() => setDrawer(undefined)}>
        {drawer.kind === 'project-create' && <ProjectForm
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
          onCancel={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'project-edit' && <ProjectForm
          project={drawer.project}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
          onCancel={() => setDrawer(undefined)}
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
          onCancel={() => setDrawer(undefined)}
          onOpenMeeting={(meetingId, meetingProjectId) => openRecord(meetingProjectId ?? project.id, 'meeting', meetingId)}
        />}
        {drawer.kind === 'milestone' && project && <MilestoneForm
          projectId={project.id}
          milestone={drawer.milestone}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
          onCancel={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'risk-issue' && project && <RiskIssueForm
          projectId={project.id}
          record={drawer.record}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
          onCancel={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'meeting' && project && <MeetingForm
          projectId={project.id}
          meeting={drawer.meeting}
          tasks={tasks}
          issues={riskIssues.filter(item => item.type === 'issue')}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
          onCancel={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'report' && project && <ProgressReportForm
          projectId={project.id}
          report={drawer.report}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
          onCancel={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'deliverable' && project && <DeliverableForm
          key={drawer.deliverable ? `deliverable-${drawer.deliverable.id}` : 'deliverable-new'}
          projectId={project.id}
          deliverable={drawer.deliverable}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
          onCancel={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'ai' && project && <AiAssistant
          projectId={project.id}
          execute={execute}
          disabled={busy}
          onConfirmed={() => { void refresh(); setDrawer(undefined) }}
          onOpenRecord={(recordType, id) => openRecord(project.id, recordType, id)}
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
      // 无截止日、已完成或进度已满不进提醒；逾期口径统一走 isTaskOverdue。
      if (!t.dueDate || t.status === 'done' || (t.progress ?? 0) >= 100) continue
      const d = days(t.dueDate)
      if (isTaskOverdue(t, today) || d <= range) out.push({ kind: 'task', id: t.id, title: t.title, owner: t.assignee, date: t.dueDate, d })
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

function drawerTitle(drawer: Drawer): string {
  if (drawer.kind === 'project-create') return '新建项目'
  if (drawer.kind === 'project-edit') return '编辑项目'
  if (drawer.kind === 'task') return drawer.task ? '编辑任务' : '新增任务'
  if (drawer.kind === 'milestone') return drawer.milestone ? '编辑里程碑' : '新增里程碑'
  if (drawer.kind === 'risk-issue') return drawer.record ? '编辑风险或问题' : '新增风险或问题'
  if (drawer.kind === 'meeting') return drawer.meeting ? '编辑会议纪要' : '新增会议纪要'
  if (drawer.kind === 'report') return drawer.report ? '编辑进度汇报' : '生成进度汇报'
  if (drawer.kind === 'ai') return 'AI 助手'
  if (drawer.kind === 'settings') return '口径设置'
  return drawer.deliverable ? '编辑交付物' : '新增交付物'
}

/**
 * AI 助手面板：完全复用斜杠命令的 core 草稿→confirm 逻辑。
 * “生成草稿”发一次预览命令（调一次模型），“确认入库”发对应 confirm 命令
 * （复用进程内草稿缓存，不再调模型）。AI 结果一律先预览、显式确认才落库。
 */
function AiAssistant({ projectId, execute, disabled, onConfirmed, onOpenRecord }: {
  projectId: string
  execute: (line: string) => Promise<string>
  disabled?: boolean
  onConfirmed: () => void
  onOpenRecord: (recordType: string, id: string) => void
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
  // P2-6：确认入库后自增，用于重挂载台账面板触发只读刷新（F05/F06/F12 展示层）。
  const [provTick, setProvTick] = useState(0)

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
      // 确认入库后只读刷新溯源台账（面板自拉取；自增 tick 触发重挂载重载）。
      setProvTick(t => t + 1)
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
          {/* P2-6 溯源静态标记：只列实际依赖对象，置信度恒未提供，不按来源数评分。 */}
          <div className="pm-ai-provenance-note" aria-label="溯源说明">
            来源仅记录本次实际依赖对象｜置信度：未提供（不按来源数量评分）
          </div>
        </div>
      )}
      <p className="pm-ai-footnote">AI 结果为草稿，需点「确认入库」才写入项目；失败时可重试或改用手工录入，核心台账不受影响。</p>
    </>}
    {/* P2-6 溯源台账（F05 来源证据 / F06 失效置灰 / F12 重校历史）：只读展示，独立拉取，不写业务。 */}
    <ProvenancePanel
      key={provTick}
      projectId={projectId}
      execute={execute}
      onOpenRecord={onOpenRecord}
    />
  </div>
}

/** OPT-05：批量字段输入（负责人文本 / 截止日期），回车或按钮触发应用。 */
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
  // F9：成功反馈 role=status + aria-live=polite（可编程、不抢焦点）；
  // 错误变体按 §7 用 role=alert + aria-live=assertive。组件从不 focus()，两种变体均不抢焦点。
  return <div
    className={`pm-notice${isError ? ' pm-notice--error' : ''}`}
    role={isError ? 'alert' : 'status'}
    aria-live={isError ? 'assertive' : 'polite'}
  >
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

type PlanStepView = CopilotStep & { checked: boolean }

function softRisks(step: CopilotStep, task: Task | undefined, assignees: Set<string>, today: string): string[] {
  const out: string[] = []
  const p = (step.action.patch ?? {}) as Record<string, unknown>
  if (typeof p.progress === 'number' && isProgressOutOfRange(p.progress)) out.push('进度超出 0-100 范围，需纠正')
  if (p.progress === 100 && p.status && p.status !== 'done') out.push('口径可能不一致：进度100但未标完成')
  if (p.status === 'done' && typeof p.progress === 'number' && p.progress < 100) out.push('口径可能不一致：已完成但进度未满')
  // 逾期口径统一走 isTaskOverdue：合并提案 patch 与现有任务（status/progress/dueDate）。
  const proposed = {
    status: typeof p.status === 'string' ? p.status : task?.status,
    progress: typeof p.progress === 'number' ? p.progress : task?.progress,
    dueDate: task?.dueDate,
  }
  if (isTaskOverdue(proposed, today)) out.push('该任务已逾期')
  if (typeof p.assignee === 'string' && p.assignee && !assignees.has(p.assignee)) out.push('新负责人，确认不是错别字')
  return out
}

// #22 四类实体草稿卡：字段中文名 + 枚举中文 + 实体徽标；只读展示模型将新建/改动的内容。
const COPILOT_ENTITY_META: Record<string, { label: string, fields: Record<string, string>, enums?: Record<string, Record<string, string>> }> = {
  milestone: {
    label: '里程碑',
    fields: { title: '标题', targetDate: '目标日期', status: '状态', achievedDate: '达成日期', description: '说明' },
    enums: { status: { planned: '计划中', at_risk: '有风险', achieved: '已达成', missed: '已错过' } },
  },
  risk: {
    label: '风险/问题',
    fields: { type: '类型', title: '标题', description: '说明', owner: '负责人', dueDate: '截止日期', status: '状态', probability: '概率', impact: '影响', responsePlan: '应对措施', solution: '解决方案' },
    enums: {
      type: { risk: '风险', issue: '问题' },
      status: { open: '待处理', monitoring: '跟进中', closed: '已关闭' },
      probability: { low: '低', medium: '中', high: '高' },
      impact: { low: '低', medium: '中', high: '高', critical: '严重' },
    },
  },
  deliverable: {
    label: '交付物',
    fields: { name: '名称', version: '版本', owner: '负责人', status: '状态', location: '位置', description: '说明', dueDate: '交付日期', repoUrl: '仓库地址', branch: '分支' },
    enums: { status: { planned: '计划中', in_progress: '制作中', submitted: '已提交', accepted: '已验收' } },
  },
  meeting: {
    label: '会议',
    fields: { title: '标题', meetingDate: '会议日期', startTime: '开始时间', durationMinutes: '时长(分)', location: '地点', facilitator: '主持人', recorder: '记录人', participants: '参会人', status: '状态', summary: '摘要', topics: '议题', decisions: '决议', notes: '备注' },
    enums: { status: { draft: '草稿', final: '已定稿' } },
  },
}

/** op -> 实体键；task.update 不走实体摘要。 */
function copilotEntityOf(op: string): string | null {
  const m = /^(milestone|risk|deliverable|meeting)\.(create|update)$/.exec(op)
  return m ? m[1] : null
}

/** K13：本地时钟 HH:MM:SS（「数据截至」标注，仅展示渲染时刻）。 */
const projHhmmss = (d: Date) => [d.getHours(), d.getMinutes(), d.getSeconds()]
  .map(n => String(n).padStart(2, '0')).join(':')

/**
 * K13 单条相关任务只读投影卡。所有业务值（状态/进度/截止/证据）渲染时从最新快照现取；
 * baselineUpdatedAt 仅用于「回答后又被改动」提示，不用于展示旧状态。
 */
function ProjectionTaskCard({ task, baselineUpdatedAt, milestoneTitle, onOpen }: {
  task: Task
  baselineUpdatedAt?: string
  milestoneTitle?: string
  onOpen?: () => void
}) {
  const today = localTodayIso()
  const urg = dueUrgency(task, today)
  const liveUpdatedAt = (task as { updatedAt?: string }).updatedAt
  const changed = !!baselineUpdatedAt && !!liveUpdatedAt && liveUpdatedAt !== baselineUpdatedAt
  const hasEvidence = !!(task.evidenceUrl && String(task.evidenceUrl).trim())
  const pct = clampProgress(task.progress)
  return (
    <article className="pm-proj-card" data-status={task.status}>
      <div className="pm-proj-card-head">
        <span className="pm-proj-id">{task.code || task.id}</span>
        <span className={`pm-proj-status pm-proj-st-${task.status}`}>{taskStatus[task.status] ?? task.status}</span>
        {urg.kind === 'overdue' && <span className="pm-proj-chip pm-proj-chip-overdue">逾期{urg.days}天</span>}
        {urg.kind === 'soon' && <span className="pm-proj-chip pm-proj-chip-soon">临期{urg.days}天</span>}
      </div>
      <div className="pm-proj-card-title">{task.title}</div>
      <div className="pm-proj-rows">
        <span>负责人{task.assignee ? `：${task.assignee}` : '：未指派'}</span>
        <span>截止{task.dueDate ? `：${task.dueDate}` : '：无'}</span>
        <span>进度：{pct}%</span>
        <span>证据：{hasEvidence ? '有' : '无'}</span>
        {milestoneTitle ? <span>里程碑：{milestoneTitle}</span> : null}
      </div>
      <div className="pm-proj-bar" aria-hidden="true"><i style={{ width: `${pct}%` }}/></div>
      {changed && <div className="pm-proj-changed">回答后该任务又有更新，已按最新状态显示</div>}
      <div className="pm-proj-foot">
        <span className="pm-proj-note">本地台账只读投影，单动作回写</span>
        {onOpen && (
          <button type="button" className="pm-proj-open" onClick={onOpen}>打开任务</button>
        )}
      </div>
    </article>
  )
}

/**
 * K13「最近处理结果」块：ask-apply 落库批次摘要（只读），涉及任务按最新快照现取状态。
 */
function AppliedBatchBlock({ batch, taskById, projectId, onOpen, onRefresh, refreshing, asOf }: {
  batch: AppliedBatch
  taskById: Map<string, Task>
  projectId: string
  onOpen?: (projectId: string, type: string, id: string) => void
  onRefresh: () => void
  refreshing: boolean
  asOf: Date
}) {
  const rows = batch.basisTaskIds
    .map(id => taskById.get(id))
    .filter((t): t is Task => !!t)
  const when = batch.createdAt ? batch.createdAt.replace('T', ' ').slice(0, 16) : ''
  return (
    <section className="pm-proj pm-proj-applied" aria-label="最近处理结果">
      <div className="pm-proj-head">
        <span className="pm-proj-title">最近处理结果（AI 已落库）</span>
        <span className="pm-proj-asof">数据截至 {projHhmmss(asOf)}</span>
        <button type="button" className="pm-proj-refresh" disabled={refreshing} onClick={onRefresh}>
          <RefreshCw size={11} className={refreshing ? 'pm-spin' : ''}/>刷新
        </button>
      </div>
      <p className="pm-proj-applied-summary">
        {batch.summary}{batch.undone ? '（该批次已撤销）' : ''}
      </p>
      {when && <p className="pm-proj-applied-time">落库于 {when}</p>}
      {rows.map(t => (
        <ProjectionTaskCard
          key={t.id}
          task={t}
          milestoneTitle={undefined}
          onOpen={onOpen ? () => onOpen(projectId, 'task', t.id) : undefined}
        />
      ))}
      {!rows.length && <div className="pm-proj-missing">本批次涉及的任务已不在当前项目，以任务视图为准</div>}
    </section>
  )
}

/**
 * K13 对话内只读投影：消息条目。refTaskIds 只存回答引用到的任务身份；
 * refBaseline 只存回答时刻各任务的 updatedAt（用于「回答后又被改动」提示），
 * 业务状态/进度/截止一律在渲染时从最新快照现取，绝不缓存旧值。
 */
type ChatMsg = {
  role: string
  text: string
  refTaskIds?: string[]
  refBaseline?: Record<string, string>
}

function CopilotPanel({ projectId, tasks, milestones, riskIssues, deliverables, meetings, baselineMap, execute, executeRaw, disabled, onSaved, onOpenRecord, embedded = false, diagnosis = [], onDismissDiagnosis, mode = 'diagnosis', onModeChange }: {
  projectId: string
  tasks: Task[]
  milestones: { id: string, title: string, targetDate?: string, status?: string }[]
  riskIssues: { id: string, title: string, status?: string, type?: string, probability?: string | null, impact?: string }[]
  deliverables: { id: string, name?: string, title?: string, status?: string, dueDate?: string | null }[]
  meetings: { id: string, title: string, meetingDate?: string, status?: string }[]
  baselineMap: Record<string, string>
  execute: (line: string) => Promise<string>
  executeRaw: (line: string) => Promise<{ kind: string, text: string }>
  disabled: boolean
  /** 落库/刷新回调：可 async；返回 boolean 表示是否成功（undefined 视为兼容旧同步回调=成功）。投影仅成功才重盖时钟。 */
  onSaved: () => Promise<boolean | void> | boolean | void
  /** K13：复用面板既有「打开记录」导航（切视图+开抽屉），投影不新建写路径。 */
  onOpenRecord?: (projectId: string, type: string, id: string) => void
  /** P1-7 内嵌形态（右侧建议层，非抽屉）。 */
  embedded?: boolean
  /** 规则诊断气泡（只读，确定性）。 */
  diagnosis?: DiagnosisBubble[]
  onDismissDiagnosis?: (id: string) => void
  /** 右侧面板模式：只读诊断 / 草稿待确认（受控）。 */
  mode?: 'diagnosis' | 'draft'
  onModeChange?: (m: 'diagnosis' | 'draft') => void
}) {
  const taskIds = tasks.map(t => t.id)
  const taskById = new Map(tasks.map(t => [t.id, t]))
  const assignees = new Set(tasks.map(t => t.assignee).filter(Boolean))
  const milestoneById = new Map(milestones.map(m => [m.id, m]))
  const riskById = new Map(riskIssues.map(r => [r.id, r]))
  const deliverableById = new Map(deliverables.map(d => [d.id, d]))
  const meetingById = new Map(meetings.map(m => [m.id, m]))
  const today = new Date().toISOString().slice(0, 10)

  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ role: 'sys', text: '向副驾提问（只读诊断）；若给出多步计划，可勾选/编辑后整批或逐步执行，确认才落库。' }])
  const [steps, setSteps] = useState<PlanStepView[]>([])
  const [rejected, setRejected] = useState<{ stepId?: string, reason: string }[]>([])
  const [openedAt, setOpenedAt] = useState<Record<string, string> | null>(null)
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [lane, setLane] = useState<'poc' | 'prod'>('poc')
  // 最近落库的撤销句柄（10 分钟内有效）；最多保留 3 条，新的在前。
  const [undoIds, setUndoIds] = useState<{ id: string, label: string, at: number }[]>([])
  // K13 投影：最近一次 ask-apply 处理结果（只读，来自 ask-provenance 台账，best-effort）。
  const [applied, setApplied] = useState<AppliedBatch[]>([])
  // K13 防过时：投影「数据截至」本地时钟；最新快照到达或手动刷新时重盖，不使用 ask 发起时刻。
  const [asOf, setAsOf] = useState(() => new Date())
  const [projRefreshing, setProjRefreshing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  /** 执行撤销：发 ask-undo，成功后移除该句柄。 */
  const runUndo = async (undoId: string) => {
    setBusy(true)
    try {
      const res = await execute(`ask-undo ${undoId}`)
      setMsgs(m => [...m, { role: 'sys', text: res }])
      setUndoIds(prev => prev.filter(u => u.id !== undoId))
      onSaved()
    } catch (e) {
      setMsgs(m => [...m, { role: 'ai', text: `撤销失败：${e instanceof Error ? e.message : String(e)}` }])
    } finally { setBusy(false) }
  }

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

  // K13：只读拉取最近一次 ask-apply 处理结果（台账 best-effort，失败静默，不写业务）。
  const loadApplied = async () => {
    try {
      const raw = await execute(`ask-provenance ${projectId}`)
      const parsed = JSON.parse(raw) as { entries?: unknown }
      setApplied(latestAppliedBatches(parsed.entries, 1))
    } catch { /* 台账只读失败静默，不阻断主流程 */ }
  }
  useEffect(() => {
    void loadApplied()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // K13 防过时：最新快照（tasks prop）到达即重盖「数据截至」时钟；卡片状态始终读最新 props，不存 ask 时刻旧值。
  useEffect(() => { setAsOf(new Date()) }, [tasks])

  // K13 刷新：await 父级重读 web snapshot；仅真实成功（返回 true）才重挂号并盖「数据截至」。
  // 失败保留旧时钟并提示，不照盖新时间（父 refresh 失败只 setMessage 吞错、会 resolve）。
  const refreshProjection = async () => {
    if (projRefreshing) return
    setProjRefreshing(true)
    try {
      const result = await onSaved()
      if (!refreshSucceeded(result)) {
        setMsgs(m => [...m, { role: 'sys', text: '刷新失败：快照未更新，保留原「数据截至」时间。' }])
        return
      }
      await loadApplied()
      setAsOf(new Date())
    } catch (e) {
      setMsgs(m => [...m, { role: 'sys', text: `刷新失败：${e instanceof Error ? e.message : String(e)}` }])
    } finally {
      setProjRefreshing(false)
    }
  }

  const focusInput = () => inputRef.current?.focus()

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
      const v = validatePlan(rawSteps, {
        taskIds,
        milestoneIds: milestones.map(m => m.id),
        riskIds: riskIssues.map(r => r.id),
        deliverableIds: deliverables.map(d => d.id),
        meetingIds: meetings.map(m => m.id),
      })
      // K13：只记录回答正文提及 + 已校验计划涉及的任务「身份」；状态渲染时从最新快照现取。
      const knownIds = new Set(taskIds)
      const refTaskIds = [...new Set([
        ...extractReferencedTaskIds(diagnosis, knownIds),
        ...planTaskIds(v.steps),
      ])]
      const refBaseline = Object.fromEntries(refTaskIds.map(id => [id, baselineMap[id] ?? '']))
      setMsgs(m => [...m, { role: 'ai', text: diagnosis, refTaskIds, refBaseline }])
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
  const validateSnapshot = {
    taskIds,
    milestoneIds: milestones.map(m => m.id),
    riskIds: riskIssues.map(r => r.id),
    deliverableIds: deliverables.map(d => d.id),
    meetingIds: meetings.map(m => m.id),
  }
  for (const s of steps) {
    if (!s.checked) continue
    if (validateActions([s.action], validateSnapshot).rejected.length) invalidStepIds.add(s.stepId)
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
      const newUndo: { id: string, label: string, at: number }[] = []
      const rememberUndo = (undoId: string | undefined, label: string): void => {
        if (undoId) newUndo.push({ id: undoId, label, at: Date.now() })
      }
      // dsh 命令结果只透传 kind/text；落库后查询最近撤销句柄，取第一条（即本次落库产生的）。
      const fetchLatestUndoId = async (): Promise<string | undefined> => {
        const r = await executeRaw('ask-undo list')
        try {
          const parsed = JSON.parse(r.text) as { undoIds?: { id: string }[] }
          return parsed.undoIds?.[0]?.id
        } catch { return undefined }
      }
      if (mode === 'batch') {
        const res = await executeRaw(`ask-apply ${projectId} ${JSON.stringify(ordered)} --base ${JSON.stringify(base)}`)
        setMsgs(m => [...m, { role: 'sys', text: res.text }])
        rememberUndo(await fetchLatestUndoId(), `整批 ${ordered.length} 步`)
      } else {
        for (const s of checked) {
          // 逐步模式：单步发送时剥掉 needs（避免服务端误判前置未执行而级联跳过）。
          const one = forStepwiseApply(s)
          const res = await executeRaw(`ask-apply ${projectId} ${JSON.stringify([one])} --base ${JSON.stringify(base)}`)
          setMsgs(m => [...m, { role: 'sys', text: `${s.stepId}：${res.text}` }])
          rememberUndo(await fetchLatestUndoId(), s.stepId || '单步')
          // 逐步模式每步后重读 domain 刷新链式 baseline（每次 ask-apply 后端也重读）。
          const snap = JSON.parse(await execute('web snapshot')) as { tasks: (Task & { updatedAt?: string })[] }
          base = Object.fromEntries((snap.tasks ?? []).filter(t => t.projectId === projectId).map(t => [t.id, t.updatedAt ?? '']))
        }
      }
      // 新撤销句柄置顶，最多保留 3 条。
      if (newUndo.length) setUndoIds(prev => [...[...newUndo].reverse(), ...prev].slice(0, 3))
      clearPlan(); await onSaved(); await loadApplied()
    } catch (e) {
      setMsgs(m => [...m, { role: 'ai', text: `执行失败：${e instanceof Error ? e.message : String(e)}` }])
    } finally { setBusy(false) }
  }

  const editablePatch = (s: PlanStepView) => (s.action.patch ?? {}) as Record<string, unknown>
  const showQuick = steps.length === 0 && rejected.length === 0
  return <div className="pm-copilot" data-mode={mode} data-embedded={embedded || undefined}>
    {/* 顶部：内嵌标题 + 模式切换 + 车道（drawer 标题已在头部，不重复） */}
    <div className="pm-copilot-head">
      {embedded
        ? <div className="pm-copilot-title">
            <span className="pm-copilot-title-text"><Sparkles size={14}/> AI 副驾 · 建议层</span>
            <span className="pm-copilot-title-sub">PM 插件内副驾，只读本插件项目台账；非宿主全局聊天，不另起独立房间</span>
          </div>
        : <span className="pm-copilot-head-sub">只读诊断 · 确认后才执行</span>}
      <div className="pm-copilot-head-right">
        {/* I6：完整 tab 模式——←/→ 移动选中并跟随焦点，roving tabindex，tab 与 tabpanel 经 aria-controls/aria-labelledby 关联。 */}
        <div
          className="pm-copilot-mode" role="tablist" aria-label="副驾模式"
          onKeyDown={(ev: ReactKeyboardEvent<HTMLDivElement>) => {
            const order = ['diagnosis', 'draft'] as const
            if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft' && ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return
            ev.preventDefault()
            const list = ev.currentTarget
            const idx = order.indexOf(mode)
            const next = order[(idx + (ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? 1 : order.length - 1)) % order.length]
            onModeChange?.(next)
            requestAnimationFrame(() => {
              const btns = [...list.querySelectorAll<HTMLElement>('[role=tab]')]
              btns[order.indexOf(next)]?.focus()
            })
          }}
        >
          <button id="cp-tab-diag" type="button" role="tab" data-active={mode === 'diagnosis' || undefined}
            aria-selected={mode === 'diagnosis'} aria-controls="cp-panel-diag" tabIndex={mode === 'diagnosis' ? 0 : -1}
            onClick={() => onModeChange?.('diagnosis')}>只读诊断</button>
          <button id="cp-tab-draft" type="button" role="tab" data-active={mode === 'draft' || undefined}
            aria-selected={mode === 'draft'} aria-controls="cp-panel-draft" tabIndex={mode === 'draft' ? 0 : -1}
            onClick={() => onModeChange?.('draft')}>草稿待确认{steps.length ? ` (${steps.length})` : ''}</button>
        </div>
        <LaneSwitcher lane={lane} busy={busy || sending} onChange={l => void switchLane(l)} compact/>
      </div>
    </div>

    {/* P1-7：只读诊断模式下的规则诊断摘要（确定性、不依赖提问）。 */}
    {mode === 'diagnosis' && embedded && (
      <div className="pm-copilot-diag">
        <div className="pm-copilot-diag-head">
          <ListChecks size={13}/>
          <strong>规则诊断</strong>
          <span className="pm-copilot-diag-meta">{diagnosis.length ? `${diagnosis.length} 项需关注` : '暂无需要关注的问题'}</span>
        </div>
        {diagnosis.length
          ? diagnosis.map(d => (
              <div key={d.id} className={`pm-copilot-diag-item pm-diag-${d.kind}`}>
                <span className="pm-copilot-diag-title">{d.title}</span>
                <span className="pm-copilot-diag-text">{d.text}</span>
                {onDismissDiagnosis && <button type="button" className="pm-copilot-diag-x" aria-label="忽略" onClick={() => onDismissDiagnosis(d.id)}>×</button>}
              </div>
            ))
          : <div className="pm-copilot-diag-empty">当前口径下没有阻塞、逾期、过载或未指派任务，保持。</div>}
      </div>
    )}

    {/* 对话区（只读诊断模式）；I6：role=tabpanel 与「只读诊断」tab 关联，内层保留 role=log 直播。 */}
    {mode === 'diagnosis' && (
    <div role="tabpanel" id="cp-panel-diag" aria-labelledby="cp-tab-diag">
    <div className="pm-copilot-messages" role="log" aria-live="polite" aria-busy={sending}>
      {msgs.map((m, i) => {
        if (m.role === 'me')
          return <div key={i} className="pm-copilot-bubble pm-copilot-me">{m.text}</div>
        if (m.role === 'ai') {
          // K13：身份（refTaskIds）来自回答时刻，状态渲染时从最新 tasks 快照现取，不缓存旧值。
          const refs = m.refTaskIds ?? []
          const live = refs.map(id => taskById.get(id)).filter((t): t is Task => !!t)
          const missing = refs.filter(id => !taskById.has(id))
          return (
            <Fragment key={i}>
              <div className="pm-copilot-bubble pm-copilot-ai"><MarkdownView text={m.text}/></div>
              {(live.length > 0 || missing.length > 0) && (
                <div className="pm-proj" data-projection>
                  <div className="pm-proj-head">
                    <span className="pm-proj-title">相关任务（只读投影）</span>
                    <span className="pm-proj-asof">数据截至 {projHhmmss(asOf)}</span>
                    <button type="button" className="pm-proj-refresh" disabled={projRefreshing} onClick={() => void refreshProjection()}>
                      <RefreshCw size={11} className={projRefreshing ? 'pm-spin' : ''}/>刷新
                    </button>
                  </div>
                  {live.map(t => (
                    <ProjectionTaskCard
                      key={t.id}
                      task={t}
                      baselineUpdatedAt={m.refBaseline?.[t.id]}
                      milestoneTitle={t.milestoneId ? milestoneById.get(t.milestoneId)?.title : undefined}
                      onOpen={onOpenRecord ? () => onOpenRecord(projectId, 'task', t.id) : undefined}
                    />
                  ))}
                  {missing.map(id => (
                    <div key={id} className="pm-proj-missing">任务 {id} 已不在当前项目，以任务视图为准</div>
                  ))}
                </div>
              )}
            </Fragment>
          )
        }
        return <div key={i} className="pm-copilot-bubble pm-copilot-sys">
          {sending && m.text === '思考中…'
            ? <span className="pm-typing"><span/><span/><span/></span>
            : m.text}
        </div>
      })}
    </div>
    </div>
    )}

    {/* K13：最近一次 ask-apply 处理结果（只读台账摘要，任务状态按最新快照现取） */}
    {mode === 'diagnosis' && applied.length > 0 && (
      <AppliedBatchBlock
        batch={applied[0]}
        taskById={taskById}
        projectId={projectId}
        onOpen={onOpenRecord}
        refreshing={projRefreshing}
        asOf={asOf}
        onRefresh={() => void refreshProjection()}
      />
    )}

    {/* K13：处理结果空态占位（有过回答但暂无 AI 落库批次时，如实留白，不编造） */}
    {mode === 'diagnosis' && applied.length === 0 && msgs.some(m => m.role === 'ai') && (
      <div className="pm-proj" data-projection>
        <div className="pm-proj-head">
          <span className="pm-proj-title">最近处理结果</span>
          <span className="pm-proj-asof">数据截至 {projHhmmss(asOf)}</span>
          <button type="button" className="pm-proj-refresh" disabled={projRefreshing} onClick={() => void refreshProjection()}>
            <RefreshCw size={11} className={projRefreshing ? 'pm-spin' : ''}/>刷新
          </button>
        </div>
        <div className="pm-proj-missing">暂无 AI 确认落库的处理结果；草稿确认执行后，在此显示任务变化摘要。</div>
      </div>
    )}

    {/* K13：下一步入口（复用既有导航/输入，不新建写路径）：有过回答才显示继续追问 */}
    {mode === 'diagnosis' && msgs.some(m => m.role === 'ai') && (
      <div className="pm-proj-next">
        <button type="button" className="pm-proj-open" onClick={focusInput}>继续追问</button>
      </div>
    )}

    {/* 撤销条：最近落库 10 分钟内可一键回滚（两种模式通用） */}
    {undoIds.length > 0 && (
      <div className="pm-copilot-undo">
        {undoIds.map(u => (
          <button key={u.id} type="button" className="pm-copilot-undo-btn" disabled={busy} onClick={() => void runUndo(u.id)}>
            <RotateCcw size={12}/> 撤销{u.label ? ` · ${u.label}` : ''}
          </button>
        ))}
        <span className="pm-copilot-undo-limit" title="撤销为进程内临时能力">
          限 10 分钟 / 最多 3 条 / 一次性，重启后失效；确认后被人工修改的记录会保留不覆盖
        </span>
      </div>
    )}

    {/* 快捷提问（只读诊断模式） */}
    {mode === 'diagnosis' && showQuick && (
      <div className="pm-copilot-quick">
        {QUICK_ASKS.map(q =>
          <button key={q} type="button" className="pm-copilot-quick-item" disabled={sending} onClick={() => void send(q)}>
            <Lightbulb size={12}/> {q}
          </button>)}
      </div>
    )}

    {/* 操作计划（草稿待确认模式）；I6：role=tabpanel 与「草稿待确认」tab 关联。 */}
    {mode === 'draft' && (
      <div className="pm-copilot-draft" data-copilot-plan role="tabpanel" id="cp-panel-draft" aria-labelledby="cp-tab-draft">
        {steps.length === 0 && rejected.length === 0
          ? <div className="pm-copilot-draft-empty">
              <ListChecks size={20}/>
              <div className="pm-copilot-draft-empty-title">暂无草稿</div>
              <div className="pm-copilot-draft-empty-sub">切到「只读诊断」提出操作诉求（如“把李四部分任务改派给张三”），AI 生成多步计划后回到这里确认。</div>
            </div>
          : null}
        {steps.length > 0 || rejected.length > 0 ? <>
        <div className="pm-copilot-draft-head">
          <ListChecks size={15}/>
          <strong>操作计划</strong>
          <span className="pm-copilot-draft-meta">{steps.length} 步 · {steps.filter(s => s.action.op.endsWith('.create')).length} 新建 / {steps.filter(s => s.action.op.endsWith('.update')).length} 更新</span>
        </div>
        {staleHint && <div className="pm-copilot-warn">你打开草稿后台账有变化，确认时将逐行重新核对。</div>}
        {steps.map((s, idx) => {
          const invalid = invalidStepIds.has(s.stepId)
          const risks = softRisks(s, taskById.get(String(s.action.id)), assignees, today)
          const patch = editablePatch(s)
          const op = s.action.op
          const entity = copilotEntityOf(op)
          const isCreate = op.endsWith('.create')
          // update 时取当前记录做旧值→新值对照；create 无旧值。
          const current = entity
            ? (op.includes('milestone') ? milestoneById.get(String(s.action.id))
              : op.includes('risk') ? riskById.get(String(s.action.id))
              : op.includes('deliverable') ? deliverableById.get(String(s.action.id))
              : meetingById.get(String(s.action.id)))
            : undefined
          const meta = entity ? COPILOT_ENTITY_META[entity] : undefined
          const rows = meta ? Object.entries(patch).map(([k, v]) => {
            const from = current ? String((current as Record<string, unknown>)[k] ?? '—') : ''
            const enumMap = meta.enums?.[k]
            const to = Array.isArray(v) ? (v as string[]).join('、') : enumMap?.[String(v)] ?? String(v ?? '')
            return { label: meta.fields[k] ?? k, from, to }
          }) : []
          return <div key={s.stepId} data-copilot-step className={`pm-copilot-step${invalid ? ' pm-copilot-step-invalid' : ''}`}>
            <div className="pm-copilot-stephead">
              <label className="pm-copilot-stepcheck">
                <input type="checkbox" checked={s.checked} data-copilot-check={s.stepId}
                  onChange={e => setSteps(prev => prev.map(p => p.stepId === s.stepId ? { ...p, checked: e.target.checked } : p))}/>
                <span className="pm-copilot-stepnum">{idx + 1}</span>
              </label>
              <div className="pm-copilot-stepinfo">
                <span className="pm-copilot-steptitle">{s.title || s.action.id || `新建${meta?.label ?? ''}`}</span>
                <span className="pm-copilot-stepid">{s.stepId}</span>
                {entity && <span className={`pm-copilot-entity-badge${isCreate ? ' is-create' : ' is-update'}`}>{isCreate ? `新建${meta?.label}` : `更新${meta?.label}`}{s.action.id ? ` · ${s.action.id}` : ''}</span>}
              </div>
            </div>
            {s.reason
              ? <div className="pm-copilot-why"><Lightbulb size={11}/> {s.reason}</div>
              : <div className="pm-copilot-why pm-copilot-why-empty">模型未说明原因</div>}
            {s.needs.length > 0 && <div className="pm-copilot-needs"><GitBranch size={10}/> 依赖：{s.needs.join('、')}</div>}
            {op === 'task.update' ? (
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
            ) : (
              <div className="pm-copilot-entity-summary">
                {rows.map((r, i) => (
                  <div key={i} className="pm-copilot-entity-row">
                    <span className="pm-copilot-entity-label">{r.label}</span>
                    {isCreate
                      ? <span className="pm-copilot-entity-new">{r.to}</span>
                      : <span className="pm-copilot-entity-diff"><span className="pm-copilot-entity-from">{r.from}</span> → <span className="pm-copilot-entity-to">{r.to}</span></span>}
                  </div>
                ))}
              </div>
            )}
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
        </>
        : null}
      </div>
    )}

    {/* 底部输入（只读诊断模式） */}
    {mode === 'diagnosis' && (
    <div className="pm-copilot-inputrow">
      <input ref={inputRef} className="pm-copilot-input" value={input} placeholder="问点什么，例如：下周会不会延期？"
        disabled={sending}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') void send() }}/>
      <button className="pm-copilot-send" aria-label="发送" disabled={disabled || !input.trim() || sending} onClick={() => void send()}>
        {sending ? <RefreshCw size={15} className="pm-spin"/> : <Send size={15}/>}
      </button>
    </div>
    )}
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

function GlobalBoard({ data, execute, onPickProject, onOpenRecord, onClose, runCommand, refreshBoard }: {
  data: Snapshot
  execute: (line: string) => Promise<string>
  onPickProject: (id: string) => void
  onOpenRecord: (projectId: string, type: string, id: string) => void
  onClose: () => void
  /** K11 看板部件接缝：命令执行 / 快照刷新（由 PmPanel 注入既有 run/refresh）。 */
  runCommand?: (line: string) => Promise<unknown>
  refreshBoard?: () => Promise<boolean> | boolean | void
}) {
  const [query, setQuery] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const q = query.trim().toLowerCase()
  const matches = useMemo(() => (q ? collectBoardMatches(data, q) : []), [data, q])

  const totalTasks = data.tasks.length
  const doneTasks = data.tasks.filter(task => task.status === 'done').length
  const overdueTasks = data.tasks.filter(task => isTaskOverdue(task, today)).length
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
      : <BoardBento data={data} actions={{ openRecord: onOpenRecord, pickProject: onPickProject, runCommand, refreshBoard: refreshBoard ? () => refreshBoard() : undefined }} persistence={{
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
  // I4：对话框容器引用，供焦点陷阱在抽屉内收集可聚焦元素并循环回绕。
  const asideRef = useRef<HTMLElement>(null)
  // E11：打开瞬间取用模块级列表滚动快照（抽屉打开期间监听器已停止覆盖），关闭时还原。
  const scrollSnapRef = useRef<{ el: Element, top: number } | null>(null)
  useLayoutEffect(() => {
    openerRef.current = takeOpenerSpec()
    drawerOpenDepth += 1
    if (lastListScroller) scrollSnapRef.current = { el: lastListScroller, top: lastListScrollTop }
    return () => { drawerOpenDepth -= 1 }
  }, [])
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { ev.stopPropagation(); onClose(); return }
      // I4 焦点陷阱：模态抽屉内 Tab/Shift+Tab 循环回绕，不逃逸到宿主应用、也不困死。
      if (ev.key !== 'Tab' || !asideRef.current) return
      const root = asideRef.current
      const sel = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      const items = [...root.querySelectorAll<HTMLElement>(sel)]
        .filter(el => el.getClientRects().length > 0 || el.offsetParent !== null)
      if (!items.length) { ev.preventDefault(); return }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null
      const inside = !!active && root.contains(active)
      if (ev.shiftKey) {
        if (!inside || active === first) { ev.preventDefault(); last.focus() }
      } else if (!inside || active === last) {
        ev.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])
  // E11：卸载（保存成功 / 取消关闭）时把列表滚动位还原到打开前快照。
  useEffect(() => () => {
    const snap = scrollSnapRef.current
    if (snap) snap.el.scrollTop = snap.top
  }, [])
  // 关闭/卸载时归还焦点：真实 opener → 行内 title/edit → 当前视图「添加记录」控件，
  // opener 已删除才兜底，绝不落到全局 .pm-button-primary / 提醒条。
  // E11：preventScroll 阻止焦点归还（尤其新建时回到顶部 CTA）把列表滚动位置带回顶部，
  // 焦点仍归还（可达性不变），只抑制附带的滚动跳转，保留原筛选/排序/滚动上下文。
  useEffect(() => () => {
    requestAnimationFrame(() => {
      const target = resolveDrawerFocusTarget(openerRef.current, pmFocusDoc)
      if (target instanceof HTMLElement) target.focus({ preventScroll: true })
    })
  }, [])
  return <div className="pm-drawer-layer">
    <button className="pm-drawer-scrim" aria-label="关闭编辑抽屉" onClick={onClose}/>
    <aside ref={asideRef} className="pm-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <header>
        <div><span>项目记录</span><h2>{title}</h2></div>
        <button className="pm-icon-button" aria-label="关闭抽屉" onClick={onClose}><X size={17}/></button>
      </header>
      <div className="pm-drawer-body">{children}</div>
    </aside>
  </div>
}

/** E10：表单本地提交防重态。begin() 在途时重复调用返回 false（二次提交直接忽略）；
 *  end() 释放。配合父级 inflightRef 与 busy 禁用，pending 期间按钮 disabled + 「提交中…」加载态。 */
function useSubmitGuard(): [boolean, () => boolean, () => void] {
  const [submitting, setSubmitting] = useState(false)
  const inFlight = useRef(false)
  const begin = () => {
    if (inFlight.current) return false
    inFlight.current = true
    setSubmitting(true)
    return true
  }
  const end = () => {
    inFlight.current = false
    setSubmitting(false)
  }
  return [submitting, begin, end]
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

/** P1-5：抽屉分区（01 基础信息 / 02 排期与进度 / 03 关联与仓库）。
 *  组标题 = eyebrow 序号 + 650 标题 + 弱分隔线；组内自带两列栅格，≤560 塌一列。 */
function FormSection({ index, title, children }: { index: string, title: string, children: ReactNode }) {
  return <section className="pm-form-section">
    <div className="pm-form-section-h">
      <span className="pm-form-section-n" aria-hidden="true">{index}</span>
      <span className="pm-form-section-title">{title}</span>
    </div>
    <div className="pm-form-section-grid">{children}</div>
  </section>
}

function ProjectForm({
  project,
  disabled,
  run,
  onSaved,
  onCancel,
}: {
  project?: Project
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
  onCancel: () => void
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
  // E10：本地提交防重（pending 禁用 + 加载态 + 二次提交忽略）。
  const [submitting, beginSubmit, endSubmit] = useSubmitGuard()
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
    if (!beginSubmit()) return
    // 受控校验：与按钮/Enter 同路径（submit 默认提交即此处）。不通过则定位到首个错误字段，不发命令。
    const nextErrors = validateProjectForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const first = firstInvalidField(['name', 'startDate', 'targetDate'], nextErrors)
      if (first) {
        const el = event.currentTarget.elements.namedItem(first)
        if (el instanceof HTMLElement) el.focus()
      }
      endSubmit()
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
    let success = false
    try {
      success = await run(project
        ? `project update ${project.id} ${JSON.stringify(payload)}`
        : `project add ${JSON.stringify(payload)}`)
    } finally {
      endSubmit()
    }
    if (success) onSaved()
  }
  return <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
    <FormSection index="01" title="基础信息">
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
    </FormSection>
    <FormSection index="02" title="排期与进度">
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
    </FormSection>
    <FormSection index="03" title="关联与仓库">
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
    </FormSection>
    <div className="pm-drawer-actions">
      {project && <button
        className="pm-button pm-button-danger pm-actions-left"
        type="button"
        disabled={disabled}
        onClick={() => {
          if (window.confirm(`删除项目 ${project.name}？`)) {
            void run(`project delete ${project.id} confirm`).then(success => success && onSaved())
          }
        }}
      ><Trash2 size={15}/>删除</button>}
      <button className="pm-button" type="button" disabled={disabled} onClick={onCancel}>取消</button>
      <button className="pm-button pm-button-primary" disabled={disabled || submitting} aria-busy={submitting || undefined}>
        {submitting ? '提交中…' : project ? '保存更改' : '创建项目'}
      </button>
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
  onCancel,
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
  onCancel: () => void
  onOpenMeeting: (meetingId: string, projectId?: string) => void
}) {
  // #23：客观进度真源（清单 checked/total）；人工设定与之并存且明确区分，客观值不被人工污染。
  const objectiveMap = useMemo(() => deriveProgressMap(tasks), [tasks])
  const derivedObjective = task ? objectiveMap.get(task.id) : undefined
  const meta = resolveTaskProgressMeta(
    { manualProgress: task?.manualProgress, manualProgressNote: task?.manualProgressNote },
    derivedObjective,
  )
  // PROD-10：任务由会议行动项 promote/关联而来时，抽屉顶部展示只读来源链接（前端反查全量 meetings，不落库）。
  const sources = task ? findMeetingSources(meetings, task.id) : []
  const primary = pickPrimarySource(sources)
  // T7：可选 repoUrl/branch 受控（复用三级共享 form-validation 中文校验），编辑预填；
  // 清空传空串，由 core omitEmptyRepoKeys 落盘删键（不写空串）。
  // P1-5：repo 错误并入统一 errors（validateTaskForm），不再独立 repoErrors。
  const [repoValues, setRepoValues] = useState({ repoUrl: task?.repoUrl ?? '', branch: task?.branch ?? '' })
  // P1-5：title/startDate/dueDate/progress 受控，统一走 validateTaskForm 内联校验。
  const [values, setValues] = useState<TaskFormValues>({
    title: task?.title ?? '',
    startDate: task?.startDate ?? '',
    dueDate: task?.dueDate ?? '',
    progress: String(clampProgress(task?.progress)),
  })
  const [errors, setErrors] = useState<FormFieldErrors>({})
  // E10：本地提交防重（pending 禁用 + 加载态 + 二次提交忽略）。
  const [submitting, beginSubmit, endSubmit] = useSubmitGuard()
  // PROD-11 前置依赖选择器：受控已选集合（初始 = 已落盘 predecessorIds）；
  // 搜索词仅过滤视图，被过滤掉的已选项仍在集合中、照常随表单提交。
  const [predQuery, setPredQuery] = useState('')
  const [checkedIds, setCheckedIds] = useState<ReadonlySet<string>>(() => new Set(task?.predecessorIds ?? []))
  // #23 客观/人工双轨：实际工时、证据链接、人工设定进度（可清除回落客观）与备注。
  const [effortHours, setEffortHours] = useState<string>(task?.effortHours != null ? String(task.effortHours) : '')
  const [evidenceUrl, setEvidenceUrl] = useState<string>(task?.evidenceUrl ?? '')
  const [manualProgress, setManualProgress] = useState<string>(task?.manualProgress != null ? String(task.manualProgress) : '')
  const [manualNote, setManualNote] = useState<string>(task?.manualProgressNote ?? '')
  const collectTaskValues = (patch: Partial<TaskFormValues> = {}): TaskFormValues => ({
    ...values, ...patch,
    effortHours, evidenceUrl, manualProgress,
    repoUrl: repoValues.repoUrl, branch: repoValues.branch,
  })
  const setField = (field: keyof TaskFormValues, value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    setErrors(validateTaskForm(collectTaskValues({ [field]: value })))
  }
  const setRepoField = (field: 'repoUrl' | 'branch', value: string) => {
    const nextRepo = { ...repoValues, [field]: value }
    setRepoValues(nextRepo)
    setErrors(validateTaskForm({
      ...values, effortHours, evidenceUrl, manualProgress,
      repoUrl: nextRepo.repoUrl, branch: nextRepo.branch,
    }))
  }
  const setEffort = (v: string) => {
    setEffortHours(v)
    setErrors(validateTaskForm(collectTaskValues({ effortHours: v })))
  }
  const setEvidence = (v: string) => {
    setEvidenceUrl(v)
    setErrors(validateTaskForm(collectTaskValues({ evidenceUrl: v })))
  }
  const setManual = (v: string) => {
    setManualProgress(v)
    setErrors(validateTaskForm(collectTaskValues({ manualProgress: v })))
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!beginSubmit()) return
    // P1-5：统一受控内联校验，首错聚焦；拦截即零写盘。
    const nextErrors = validateTaskForm(collectTaskValues())
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const first = firstInvalidField(
        ['title', 'startDate', 'dueDate', 'progress', 'effortHours', 'evidenceUrl', 'manualProgress', 'repoUrl', 'branch'],
        nextErrors,
      )
      if (first) {
        const el = event.currentTarget.elements.namedItem(first)
        if (el instanceof HTMLElement) el.focus()
      }
      endSubmit()
      return
    }
    const form = new FormData(event.currentTarget)
    const parentId = String(form.get('parentId') ?? '')
    const milestoneId = String(form.get('milestoneId') ?? '')
    const startDate = (values.startDate ?? '').trim()
    const dueDate = (values.dueDate ?? '').trim()
    // T7：trim 后空串照传，core 落盘时删键；非空传原值。局部更新不误触其它字段。
    const repoUrl = repoValues.repoUrl.trim()
    const branch = repoValues.branch.trim()
    // PROD-11：前置依赖整体替换（多选复选）；空数组即清空。
    const predecessorIds = form.getAll('predecessorIds').map(String)
    // 写路径「必须有值」语义：空 → 0，复用 task-inline 的 clampProgress（round + 0..100）。
    const progressRaw = values.progress ?? '0'
    const progressNum = progressRaw.trim() === '' ? 0 : writeClampProgress(progressRaw)
    const payload = {
      title: values.title.trim(),
      description: form.get('description'),
      assignee: form.get('assignee'),
      status: form.get('status'),
      priority: form.get('priority'),
      startDate: startDate || null,
      dueDate: dueDate || null,
      progress: progressNum,
      milestoneId: milestoneId || null,
      predecessorIds,
      repoUrl,
      branch,
      // #23：# 仅在填了值时传；manualProgress 空串 → null（清除人工设定，回落客观）。
      ...(effortHours.trim() !== '' && Number.isFinite(Number(effortHours)) ? { effortHours: Number(effortHours) } : {}),
      ...(evidenceUrl.trim() !== '' ? { evidenceUrl: evidenceUrl.trim() } : {}),
      // 更新语义：空 → null（清除人工设定，回落客观）；非空复用写路径 clampProgress。
      manualProgress: manualProgress.trim() === '' ? null : writeClampProgress(manualProgress),
      ...(manualNote.trim() !== '' ? { manualProgressNote: manualNote.trim() } : {}),
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
      ...(effortHours.trim() !== '' && Number.isFinite(Number(effortHours)) ? { effortHours: Number(effortHours) } : {}),
      ...(evidenceUrl.trim() !== '' ? { evidenceUrl: evidenceUrl.trim() } : {}),
      // 新建语义：空 → 整个键省略；非空用 parseProgressInput（非法 → undefined 不写）。
      ...(manualProgress.trim() !== '' ? { manualProgress: parseProgressInput(manualProgress) } : {}),
      ...(manualNote.trim() !== '' ? { manualProgressNote: manualNote.trim() } : {}),
    }
    let success = false
    try {
      success = await run(task
        ? `task update ${task.id} ${JSON.stringify(payload)}`
        : `task add ${JSON.stringify(createPayload)}`)
    } finally {
      endSubmit()
    }
    if (success) onSaved()
  }
  return <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
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
    <FormSection index="01" title="基础信息">
      <Field label="任务名称" wide required error={errors.title} errorId="task-title-error">
        <input
          name="title" value={values.title} autoFocus
          onChange={e => setField('title', e.currentTarget.value)}
          aria-required="true"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? 'task-title-error' : undefined}
        />
      </Field>
      <Field label="任务说明" wide><textarea name="description" defaultValue={task?.description} rows={4}/></Field>
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
      {/* 父任务下拉含「编号 + 长标题」，跨整行才不截断；仅新建时可选。 */}
      {!task && <Field label="父任务" wide><select name="parentId" defaultValue="">
        <option value="">根任务</option>
        {tasks.map(item => <option key={item.id} value={item.id}>{item.code} {item.title}</option>)}
      </select></Field>}
    </FormSection>
    <FormSection index="02" title="排期与进度">
      <Field label="开始日期" error={errors.startDate} errorId="task-start-error">
        <input
          name="startDate" type="date" value={values.startDate}
          onChange={e => setField('startDate', e.currentTarget.value)}
          aria-invalid={errors.startDate ? true : undefined}
          aria-describedby={errors.startDate ? 'task-start-error' : undefined}
        />
      </Field>
      <Field label="截止日期" error={errors.dueDate} errorId="task-due-error">
        <input
          name="dueDate" type="date" value={values.dueDate}
          onChange={e => setField('dueDate', e.currentTarget.value)}
          aria-invalid={errors.dueDate ? true : undefined}
          aria-describedby={errors.dueDate ? 'task-due-error' : undefined}
        />
      </Field>
      <Field label="完成进度" wide error={errors.progress} errorId="task-progress-error">
        <input
          name="progress" type="number" min="0" max="100" value={values.progress}
          onChange={e => setField('progress', e.currentTarget.value)}
          aria-invalid={errors.progress ? true : undefined}
          aria-describedby={errors.progress ? 'task-progress-error' : undefined}
        />
      </Field>
      {/* #23 客观/人工双轨：客观进度只读展示（清单完成度/证据不足），完成日期只读；
          实际工时、证据链接、人工设定进度（可清除回落客观）与备注为可编辑项。 */}
      <div className="pm-meta-block">
        <div className="pm-meta-objective" data-mode={meta.mode}>
          <span className="pm-meta-label">客观进度（清单完成度）</span>
          <span className="pm-meta-value">
            {derivedObjective?.value != null ? `${derivedObjective.value}%` : '证据不足'}
            {derivedObjective?.checklist && <span className="pm-muted">（{checklistFraction(derivedObjective)}）</span>}
          </span>
        </div>
        {task?.completedDate && (
          <div className="pm-meta-row"><span className="pm-meta-label">完成日期</span><span>{task.completedDate}</span></div>
        )}
        <Field label="实际工时（小时，可选）" error={errors.effortHours} errorId="task-effort-error">
          <input
            type="number" min="0" step="0.5" inputMode="decimal"
            value={effortHours} onChange={e => setEffort(e.currentTarget.value)}
            placeholder="如 3.5（实际投入，非估算）"
            aria-invalid={errors.effortHours ? true : undefined}
            aria-describedby={errors.effortHours ? 'task-effort-error' : undefined}
          />
        </Field>
        <Field label="证据链接（可选）" error={errors.evidenceUrl} errorId="task-evidence-error">
          <input
            type="text" value={evidenceUrl} onChange={e => setEvidence(e.currentTarget.value)}
            placeholder="https://… 完成/进度的客观佐证链接"
            aria-invalid={errors.evidenceUrl ? true : undefined}
            aria-describedby={errors.evidenceUrl ? 'task-evidence-error' : undefined}
          />
        </Field>
        <Field label="人工设定进度（0-100，可选）" error={errors.manualProgress} errorId="task-manual-error">
          <div className="pm-manual-row">
            <input
              type="number" min="0" max="100" inputMode="numeric"
              value={manualProgress} onChange={e => setManual(e.currentTarget.value)}
              placeholder="留空即回落客观进度"
              aria-invalid={errors.manualProgress ? true : undefined}
              aria-describedby={errors.manualProgress ? 'task-manual-error' : undefined}
            />
            {meta.mode === 'manual' && <span className="pm-manual-badge">人工设定 {meta.manual}%</span>}
            {meta.mode === 'manual' && (
              <button
                type="button" className="pm-manual-clear"
                onClick={() => { setManual(''); setManualNote('') }}
              >清除人工设定</button>
            )}
          </div>
        </Field>
        <Field label="人工设定备注（来源/口径，可选）">
          <textarea
            rows={2} value={manualNote} onChange={e => setManualNote(e.currentTarget.value)}
            placeholder="记录为何人工设定，便于追溯口径"
          />
        </Field>
      </div>
    </FormSection>
    <FormSection index="03" title="关联与仓库">
      <Field label="关联里程碑"><select name="milestoneId" defaultValue={task?.milestoneId ?? ''}>
        <option value="">不关联</option>
        {milestones.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select></Field>
    {/* T7：两个可选仓库输入（复用项目级中文校验，role=alert / aria-invalid）。 */}
    <Field label="仓库地址（可选）" error={errors.repoUrl} errorId="task-repo-error">
      <input
        name="repoUrl" data-repo-field="repoUrl" value={repoValues.repoUrl} placeholder="https://host/org/repo.git"
        onChange={e => setRepoField('repoUrl', e.currentTarget.value)}
        aria-invalid={errors.repoUrl ? true : undefined}
        aria-describedby={errors.repoUrl ? 'task-repo-error' : undefined}
      />
    </Field>
    <Field label="分支（可选）" error={errors.branch} errorId="task-branch-error">
      <input
        name="branch" data-repo-field="branch" value={repoValues.branch} placeholder="main"
        onChange={e => setRepoField('branch', e.currentTarget.value)}
        aria-invalid={errors.branch ? true : undefined}
        aria-describedby={errors.branch ? 'task-branch-error' : undefined}
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
    </FormSection>
    <div className="pm-drawer-actions">
      {task && <button
        className="pm-button pm-button-danger pm-actions-left"
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
      <button className="pm-button" type="button" disabled={disabled} onClick={onCancel}>取消</button>
      <button className="pm-button pm-button-primary" disabled={disabled || submitting} aria-busy={submitting || undefined}>
        {submitting ? '提交中…' : task ? '保存更改' : '添加任务'}
      </button>
    </div>
  </form>
}

function MilestoneForm({
  projectId,
  milestone,
  disabled,
  run,
  onSaved,
  onCancel,
}: {
  projectId: string
  milestone?: Milestone
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
  onCancel: () => void
}) {
  // R3-UX-001：title/targetDate 受控，必填错误内联常驻。
  const [values, setValues] = useState<MilestoneFormValues>({
    title: milestone?.title ?? '',
    targetDate: milestone?.targetDate ?? '',
  })
  const [errors, setErrors] = useState<FormFieldErrors>({})
  // E10：本地提交防重（pending 禁用 + 加载态 + 二次提交忽略）。
  const [submitting, beginSubmit, endSubmit] = useSubmitGuard()
  const setField = (field: keyof MilestoneFormValues, value: string) => {
    setValues(prev => {
      const next = { ...prev, [field]: value }
      setErrors(validateMilestoneForm(next))
      return next
    })
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!beginSubmit()) return
    const nextErrors = validateMilestoneForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const first = firstInvalidField(['title', 'targetDate'], nextErrors)
      if (first) {
        const el = event.currentTarget.elements.namedItem(first)
        if (el instanceof HTMLElement) el.focus()
      }
      endSubmit()
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
    let success = false
    try {
      success = await run(milestone
        ? `milestone update ${milestone.id} ${JSON.stringify(payload)}`
        : `milestone add ${JSON.stringify({ projectId, ...payload })}`)
    } finally {
      endSubmit()
    }
    if (success) onSaved()
  }
  return <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
    <FormSection index="01" title="基础信息">
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
    </FormSection>
    <FormSection index="02" title="排期与进度">
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
    </FormSection>
    <div className="pm-drawer-actions">
      {milestone && <button
        className="pm-button pm-button-danger pm-actions-left"
        type="button"
        disabled={disabled}
        onClick={() => {
          if (window.confirm(`删除里程碑 ${milestone.title}？`)) {
            void run(`milestone delete ${milestone.id} confirm`).then(success => success && onSaved())
          }
        }}
      ><Trash2 size={15}/>删除</button>}
      <button className="pm-button" type="button" disabled={disabled} onClick={onCancel}>取消</button>
      <button className="pm-button pm-button-primary" disabled={disabled || submitting} aria-busy={submitting || undefined}>
        {submitting ? '提交中…' : milestone ? '保存更改' : '添加里程碑'}
      </button>
    </div>
  </form>
}

function RiskIssueForm({
  projectId,
  record,
  disabled,
  run,
  onSaved,
  onCancel,
}: {
  projectId: string
  record?: RiskIssue
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
  onCancel: () => void
}) {
  const [type, setType] = useState<'risk' | 'issue'>(record?.type ?? 'risk')
  // P1-5：title/dueDate 受控，统一走 validateRiskIssueForm 内联校验。
  const [values, setValues] = useState<RiskIssueFormValues>({
    title: record?.title ?? '',
    dueDate: record?.dueDate ?? '',
  })
  const [errors, setErrors] = useState<FormFieldErrors>({})
  // E10：本地提交防重（pending 禁用 + 加载态 + 二次提交忽略）。
  const [submitting, beginSubmit, endSubmit] = useSubmitGuard()
  const setField = (field: keyof RiskIssueFormValues, value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    setErrors(validateRiskIssueForm(next))
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!beginSubmit()) return
    const nextErrors = validateRiskIssueForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const first = firstInvalidField(['title', 'dueDate'], nextErrors)
      if (first) {
        const el = event.currentTarget.elements.namedItem(first)
        if (el instanceof HTMLElement) el.focus()
      }
      endSubmit()
      return
    }
    const form = new FormData(event.currentTarget)
    const dueDate = (values.dueDate ?? '').trim()
    const common = {
      title: values.title.trim(),
      description: form.get('description'),
      owner: form.get('owner'),
      dueDate: dueDate || null,
      status: form.get('status'),
      impact: form.get('impact'),
      probability: type === 'risk' ? form.get('probability') : null,
      responsePlan: type === 'risk' ? form.get('responsePlan') : '',
      solution: type === 'issue' ? form.get('solution') : '',
    }
    let success = false
    try {
      success = await run(record
        ? `risk-issue update ${record.id} ${JSON.stringify(common)}`
        : `risk-issue add ${JSON.stringify({ projectId, type, ...common })}`)
    } finally {
      endSubmit()
    }
    if (success) onSaved()
  }
  return <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
    <FormSection index="01" title="基础信息">
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
      <Field label="标题" wide required error={errors.title} errorId="risk-title-error">
        <input
          name="title" value={values.title} autoFocus
          onChange={e => setField('title', e.currentTarget.value)}
          aria-required="true"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? 'risk-title-error' : undefined}
        />
      </Field>
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
      {type === 'risk'
        ? <Field label="应对措施" wide><textarea name="responsePlan" defaultValue={record?.responsePlan} rows={5}/></Field>
        : <Field label="解决方案" wide><textarea name="solution" defaultValue={record?.solution} rows={5}/></Field>}
    </FormSection>
    <FormSection index="02" title="排期与进度">
      <Field label="截止日期" wide error={errors.dueDate} errorId="risk-due-error">
        <input
          name="dueDate" type="date" value={values.dueDate}
          onChange={e => setField('dueDate', e.currentTarget.value)}
          aria-invalid={errors.dueDate ? true : undefined}
          aria-describedby={errors.dueDate ? 'risk-due-error' : undefined}
        />
      </Field>
    </FormSection>
    <div className="pm-drawer-actions">
      {record && <button
        className="pm-button pm-button-danger pm-actions-left"
        type="button"
        disabled={disabled}
        onClick={() => {
          if (window.confirm(`删除${riskIssueType[record.type]} ${record.title}？`)) {
            void run(`risk-issue delete ${record.id} confirm`).then(success => success && onSaved())
          }
        }}
      ><Trash2 size={15}/>删除</button>}
      <button className="pm-button" type="button" disabled={disabled} onClick={onCancel}>取消</button>
      <button className="pm-button pm-button-primary" disabled={disabled || submitting} aria-busy={submitting || undefined}>
        {submitting ? '提交中…' : record ? '保存更改' : '添加记录'}
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
  onCancel,
}: {
  projectId: string
  meeting?: Meeting
  tasks: Task[]
  issues: RiskIssue[]
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
  onCancel: () => void
}) {
  const actionsRef = useRef<HTMLElement>(null)
  // P1-5：title/meetingDate/durationMinutes 受控，统一走 validateMeetingForm 内联校验。
  const [values, setValues] = useState<MeetingFormValues>({
    title: meeting?.title ?? '',
    meetingDate: meeting?.meetingDate ?? '',
    durationMinutes: meeting?.durationMinutes != null ? String(meeting.durationMinutes) : '',
  })
  const [errors, setErrors] = useState<FormFieldErrors>({})
  // E10：本地提交防重（pending 禁用 + 加载态 + 二次提交忽略）。
  const [submitting, beginSubmit, endSubmit] = useSubmitGuard()
  const setField = (field: keyof MeetingFormValues, value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    setErrors(validateMeetingForm(next))
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!beginSubmit()) return
    const nextErrors = validateMeetingForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const first = firstInvalidField(['title', 'meetingDate', 'durationMinutes'], nextErrors)
      if (first) {
        const el = event.currentTarget.elements.namedItem(first)
        if (el instanceof HTMLElement) el.focus()
      }
      endSubmit()
      return
    }
    const form = new FormData(event.currentTarget)
    const startTime = String(form.get('startTime') ?? '')
    const payload = {
      title: values.title.trim(),
      meetingDate: values.meetingDate,
      startTime: startTime || null,
      durationMinutes: (values.durationMinutes ?? '').trim() ? Number(values.durationMinutes) : null,
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
    try {
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
    } finally {
      endSubmit()
    }
  }
  return <>
    <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
      <FormSection index="01" title="基础信息">
        <Field label="会议标题" wide required error={errors.title} errorId="meeting-title-error">
          <input
            name="title" value={values.title} autoFocus
            onChange={e => setField('title', e.currentTarget.value)}
            aria-required="true"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? 'meeting-title-error' : undefined}
          />
        </Field>
        <Field label="状态"><select name="status" defaultValue={meeting?.status ?? 'draft'}>
          {Object.entries(meetingStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></Field>
        <Field label="主持人"><input name="facilitator" defaultValue={meeting?.facilitator}/></Field>
        <Field label="记录人"><input name="recorder" defaultValue={meeting?.recorder}/></Field>
        <Field label="地点 / 链接" wide><input name="location" defaultValue={meeting?.location}/></Field>
        <Field label="参会人（每行一人）" wide><textarea name="participants" rows={3} defaultValue={meeting?.participants.join('\n')}/></Field>
        <Field label="会议摘要" wide><textarea name="summary" rows={4} defaultValue={meeting?.summary}/></Field>
        <Field label="议题（每行一项）" wide><textarea name="topics" rows={4} defaultValue={meeting?.topics.join('\n')}/></Field>
        <Field label="决议（每行一项）" wide><textarea name="decisions" rows={4} defaultValue={meeting?.decisions.join('\n')}/></Field>
        <Field label="备注 / 手工编辑" wide><textarea name="notes" rows={4} defaultValue={meeting?.notes ?? ''}/></Field>
      </FormSection>
      <FormSection index="02" title="排期与进度">
        <Field label="会议日期" required error={errors.meetingDate} errorId="meeting-date-error">
          <input
            name="meetingDate" type="date" value={values.meetingDate}
            onChange={e => setField('meetingDate', e.currentTarget.value)}
            aria-required="true"
            aria-invalid={errors.meetingDate ? true : undefined}
            aria-describedby={errors.meetingDate ? 'meeting-date-error' : undefined}
          />
        </Field>
        <Field label="开始时间"><input name="startTime" type="time" defaultValue={meeting?.startTime ?? ''}/></Field>
        <Field label="时长（分钟）" error={errors.durationMinutes} errorId="meeting-duration-error">
          <input
            name="durationMinutes" type="number" min="1" max="1440" inputMode="numeric" value={values.durationMinutes}
            onChange={e => setField('durationMinutes', e.currentTarget.value)}
            aria-invalid={errors.durationMinutes ? true : undefined}
            aria-describedby={errors.durationMinutes ? 'meeting-duration-error' : undefined}
          />
        </Field>
      </FormSection>
      <div className="pm-drawer-actions">
        {meeting && <button
          className="pm-button pm-button-danger pm-actions-left"
          type="button"
          disabled={disabled}
          onClick={() => {
            if (window.confirm(`删除会议 ${meeting.title}？`)) {
              void run(`meeting delete ${meeting.id} confirm`).then(success => success && onSaved())
            }
          }}
        ><Trash2 size={15}/>删除会议</button>}
        <button className="pm-button" type="button" disabled={disabled} onClick={onCancel}>取消</button>
        <button className="pm-button pm-button-primary" disabled={disabled || submitting} aria-busy={submitting || undefined}>
          {submitting ? '提交中…' : meeting ? '保存会议' : '创建会议'}
        </button>
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
    // P1-5：移除原生 required 气泡；标题为空则不落盘（诚实拦截）。
    if (!String(payload.title).trim()) return
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
      <input name="title" aria-label={`${action.id} 标题`} defaultValue={action.title}/>
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
      <input name="title" aria-label="新行动项标题" placeholder="行动项标题"/>
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
  onCancel,
}: {
  projectId: string
  report?: ProgressReport
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
  onCancel: () => void
}) {
  // P1-5：仅创建态校验周期起止（编辑态周期固定禁用，不走此校验）。
  const [values, setValues] = useState<ReportFormValues>({
    periodStart: report?.periodStart ?? '',
    periodEnd: report?.periodEnd ?? '',
  })
  const [errors, setErrors] = useState<FormFieldErrors>({})
  // E10：本地提交防重（pending 禁用 + 加载态 + 二次提交忽略）。
  const [submitting, beginSubmit, endSubmit] = useSubmitGuard()
  const setField = (field: keyof ReportFormValues, value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    setErrors(validateReportForm(next))
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!beginSubmit()) return
    if (!report) {
      const nextErrors = validateReportForm(values)
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) {
        const first = firstInvalidField(['periodStart', 'periodEnd'], nextErrors)
        if (first) {
          const el = event.currentTarget.elements.namedItem(first)
          if (el instanceof HTMLElement) el.focus()
        }
        endSubmit()
        return
      }
    }
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
    let success = false
    try {
      success = await run(report
        ? `report update ${report.id} ${JSON.stringify(payload)}`
        : `report generate ${projectId} ${values.periodStart} ${values.periodEnd} ${JSON.stringify(payload)}`)
    } finally {
      endSubmit()
    }
    if (success) onSaved()
  }
  return <>
    <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
      <FormSection index="01" title="基础信息">
        <Field label="汇报标题" wide>
          <input name="title" defaultValue={report?.title} placeholder="留空时按项目和周期自动生成" autoFocus/>
        </Field>
        <Field label="状态" wide><select name="status" defaultValue={report?.status ?? 'draft'}>
          {Object.entries(progressReportStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></Field>
        <Field label="管理摘要" wide><textarea name="executiveSummary" rows={4} defaultValue={report?.executiveSummary}/></Field>
        <Field label="已完成事项（每行一项）" wide><textarea name="completedWork" rows={4} defaultValue={report?.completedWork.join('\n')}/></Field>
        <Field label="下期计划（每行一项）" wide><textarea name="nextPlans" rows={4} defaultValue={report?.nextPlans.join('\n')}/></Field>
        <Field label="阻塞说明（每行一项）" wide><textarea name="blockers" rows={3} defaultValue={report?.blockers.join('\n')}/></Field>
      </FormSection>
      <FormSection index="02" title="排期与进度">
        <Field label="周期开始" required={!report} error={errors.periodStart} errorId="report-start-error">
          <input
            name="periodStart" type="date" disabled={Boolean(report)} value={values.periodStart}
            onChange={e => setField('periodStart', e.currentTarget.value)}
            aria-required={report ? undefined : true}
            aria-invalid={errors.periodStart ? true : undefined}
            aria-describedby={errors.periodStart ? 'report-start-error' : undefined}
          />
        </Field>
        <Field label="周期结束" required={!report} error={errors.periodEnd} errorId="report-end-error">
          <input
            name="periodEnd" type="date" disabled={Boolean(report)} value={values.periodEnd}
            onChange={e => setField('periodEnd', e.currentTarget.value)}
            aria-required={report ? undefined : true}
            aria-invalid={errors.periodEnd ? true : undefined}
            aria-describedby={errors.periodEnd ? 'report-end-error' : undefined}
          />
        </Field>
      </FormSection>
      <div className="pm-drawer-actions">
        {report && <>
          <button
            className="pm-button pm-button-danger pm-actions-left"
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
        <button className="pm-button" type="button" disabled={disabled} onClick={onCancel}>取消</button>
        <button className="pm-button pm-button-primary" disabled={disabled || submitting} aria-busy={submitting || undefined}>
          {submitting ? '提交中…' : report ? '保存汇报' : '生成固定快照'}
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
  onCancel,
}: {
  projectId: string
  deliverable?: Deliverable
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
  onCancel: () => void
}) {
  // T7：可选 repoUrl/branch 受控（三级共享中文校验），编辑预填；清空传空串由 core 删键。
  // P1-5：repo 错误并入统一 errors（validateDeliverableForm）。
  const [repoValues, setRepoValues] = useState({ repoUrl: deliverable?.repoUrl ?? '', branch: deliverable?.branch ?? '' })
  const [values, setValues] = useState<DeliverableFormValues>({
    name: deliverable?.name ?? '',
    dueDate: deliverable?.dueDate ?? '',
  })
  const [errors, setErrors] = useState<FormFieldErrors>({})
  // E10：本地提交防重（pending 禁用 + 加载态 + 二次提交忽略）。
  const [submitting, beginSubmit, endSubmit] = useSubmitGuard()
  const setField = (field: keyof DeliverableFormValues, value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    setErrors(validateDeliverableForm({ ...next, repoUrl: repoValues.repoUrl, branch: repoValues.branch }))
  }
  const setRepoField = (field: 'repoUrl' | 'branch', value: string) => {
    const nextRepo = { ...repoValues, [field]: value }
    setRepoValues(nextRepo)
    setErrors(validateDeliverableForm({ ...values, repoUrl: nextRepo.repoUrl, branch: nextRepo.branch }))
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!beginSubmit()) return
    // P1-5：统一受控内联校验，首错聚焦；拦截即零写盘。
    const nextErrors = validateDeliverableForm({ ...values, repoUrl: repoValues.repoUrl, branch: repoValues.branch })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const first = firstInvalidField(['name', 'dueDate', 'repoUrl', 'branch'], nextErrors)
      if (first) {
        const el = event.currentTarget.elements.namedItem(first)
        if (el instanceof HTMLElement) el.focus()
      }
      endSubmit()
      return
    }
    const form = new FormData(event.currentTarget)
    const changeNote = String(form.get('changeNote') ?? '').trim()
    const repoUrl = repoValues.repoUrl.trim()
    const branch = repoValues.branch.trim()
    const common = {
      name: values.name.trim(),
      version: String(form.get('version') ?? '').trim(),
      owner: form.get('owner'),
      status: form.get('status'),
      location: form.get('location'),
      description: form.get('description'),
      dueDate: (values.dueDate ?? '').trim() || null,
      ...(changeNote ? { changeNote } : {}),
      // update 用 `fields.repoUrl ?? current`：清空必须显式传 ''（core 再删键），omit 会回退成旧值。
      repoUrl,
      branch,
    }
    let success = false
    try {
      success = await run(deliverable
        ? `deliverable update ${deliverable.id} ${JSON.stringify(common)}`
        : `deliverable add ${JSON.stringify({ projectId, ...common })}`)
    } finally {
      endSubmit()
    }
    if (success) onSaved()
  }
  return <>
    <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
      <FormSection index="01" title="基础信息">
        <Field label="交付物名称" wide required error={errors.name} errorId="deliverable-name-error">
          <input
            name="name" value={values.name} autoFocus
            onChange={e => setField('name', e.currentTarget.value)}
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'deliverable-name-error' : undefined}
          />
        </Field>
        <Field label="版本"><input name="version" defaultValue={deliverable?.version} placeholder="如 v1.0"/></Field>
        <Field label="状态"><select name="status" defaultValue={deliverable?.status ?? 'planned'}>
          {Object.entries(deliverableStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></Field>
        <Field label="负责人"><input name="owner" defaultValue={deliverable?.owner}/></Field>
        <Field label="位置（路径 / 链接 / 存放说明）" wide><input name="location" defaultValue={deliverable?.location} placeholder="exports/交付物.md 或 https://..."/></Field>
        <Field label="说明" wide><textarea name="description" rows={4} defaultValue={deliverable?.description}/></Field>
        {deliverable && <Field label="本次变更说明（版本/状态变化时留痕）" wide>
          <input name="changeNote" placeholder="如：提交评审、验收通过"/>
        </Field>}
      </FormSection>
      <FormSection index="02" title="排期与进度">
        <Field label="计划交付日期" wide error={errors.dueDate} errorId="deliverable-due-error">
          <input
            name="dueDate" type="date" value={values.dueDate}
            onChange={e => setField('dueDate', e.currentTarget.value)}
            aria-invalid={errors.dueDate ? true : undefined}
            aria-describedby={errors.dueDate ? 'deliverable-due-error' : undefined}
          />
        </Field>
      </FormSection>
      <FormSection index="03" title="关联与仓库">
        {/* T7：两个可选仓库输入（复用项目级中文校验，role=alert / aria-invalid）。 */}
        <Field label="仓库地址（可选）" wide error={errors.repoUrl} errorId="deliverable-repo-error">
          <input
            name="repoUrl" data-repo-field="repoUrl" value={repoValues.repoUrl} placeholder="https://host/org/repo.git"
            onChange={e => setRepoField('repoUrl', e.currentTarget.value)}
            aria-invalid={errors.repoUrl ? true : undefined}
            aria-describedby={errors.repoUrl ? 'deliverable-repo-error' : undefined}
          />
        </Field>
        <Field label="分支（可选）" error={errors.branch} errorId="deliverable-branch-error">
          <input
            name="branch" data-repo-field="branch" value={repoValues.branch} placeholder="main"
            onChange={e => setRepoField('branch', e.currentTarget.value)}
            aria-invalid={errors.branch ? true : undefined}
            aria-describedby={errors.branch ? 'deliverable-branch-error' : undefined}
          />
        </Field>
      </FormSection>
      <div className="pm-drawer-actions">
        {deliverable && <button
          className="pm-button pm-button-danger pm-actions-left"
          type="button"
          disabled={disabled}
          onClick={() => {
            if (window.confirm(`删除交付物 ${deliverable.name}？`)) {
              void run(`deliverable delete ${deliverable.id} confirm`).then(success => success && onSaved())
            }
          }}
        ><Trash2 size={15}/>删除</button>}
        <button className="pm-button" type="button" disabled={disabled} onClick={onCancel}>取消</button>
        <button className="pm-button pm-button-primary" disabled={disabled || submitting} aria-busy={submitting || undefined}>
          {submitting ? '提交中…' : deliverable ? '保存更改' : '新增交付物'}
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

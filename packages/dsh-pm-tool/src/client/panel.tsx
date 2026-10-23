import { flattenVisible as flattenTaskTree } from '../core/task-tree.js'
import { resolveRecordLocation, findRecord } from '../core/record-location.js'
import { VIEW_LABELS, buildNarrowSwitcher } from '../core/nav.js'
import { NavRail } from './nav-rail.js'
import { confirmDanger, ConfirmHost } from './confirm-dialog.js'
import { clampProgress as writeClampProgress, parseProgressInput } from '../core/task-inline.js'
import { findMeetingSources, pickPrimarySource } from '../core/meeting-source.js'
import { resolveLinkedMilestone, resolveLinkedDeliverables } from './shared/task-relation-projection.js'
import { localTodayIso, isTaskOverdue } from '../core/derived.js'
import { groupOpenTasksByAssignee, normalizePerson, type PersonRow } from '../core/people-load.js'
import { listAssigneeCandidates } from '../core/people-candidates.js'
import {
  DEFAULT_PROJECT_SETTINGS, SETTING_FIELDS, normalizeProjectSettings, sameSettings,
  type ProjectSettings, type SettingFieldMeta,
} from '../core/settings.js'
import { SettingsPanel } from './shared/drawers/settings-drawer.js'
import { AiAssistant } from './shared/drawers/ai-assistant.js'
import { CopilotPanel } from './shared/drawers/sidecar-portal.js'
import { projectStatusLabels, taskStatusLabels, milestoneStatusLabels, deliverableStatusLabels } from '../core/labels.js'
import { deriveProgressMap, checklistFraction, resolveTaskProgressMeta, clampProgress } from '../core/progress-derivation.js'
import { extractBackupPath, classifyFeedback, commandAccepted, shouldPersistResultCard, buildSuccessEnvelope, prefixFeedbackOnce, type FeedbackContext } from '../core/ui-feedback.js'
import { buildLaunchHistoryUrl, createLaunchHandshakeRetrier, parseLaunchToken } from './launch-handshake.js'
import { ResultCard } from './result-card.js'
import { buildDiagnosis } from '../core/suggestion-engine.js'
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
import SlidersHorizontal from 'lucide-react/dist/esm/icons/sliders-horizontal.mjs'
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react'
import {
  setPointerOpener, takeOpenerSpec, resolveDrawerFocusTarget,
  type FocusDoc, type OpenerSpec,
} from '../core/drawer-focus.js'
import {
  validateProjectForm, validateMilestoneForm, validateTaskForm, validateRiskIssueForm,
  validateMeetingForm, validateReportForm, validateDeliverableForm,
  parseIdList,
  repoFieldsForUpdate, repoFieldsForCreate, firstInvalidField,
  type FormFieldErrors, type ProjectFormValues, type MilestoneFormValues,
  type TaskFormValues, type RiskIssueFormValues, type MeetingFormValues,
  type ReportFormValues, type DeliverableFormValues,
  type OkrFormValues, type HabitFormValues,
} from './form-validation.js'
import { BoardBento } from './board/BoardBento.js'
import { scopeSnapshot } from './board/scope-snapshot.js'
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
import { MarkdownView, MarkdownEditor } from './shared/markdown-view.js'
import { sanitizeMarkdownDraft } from './shared/markdown.js'
import { PageShell } from './shared/page-shell.js'
// S0 共享闸门：Field/FormSection/useSubmitGuard 由共享合同层提供（原本地实现已提升，行为零变更）。
import { Field, FormSection, useSubmitGuard } from './shared/ui/index.js'
import { collectFormSnapshot, shouldConfirmDiscard, type FormSnapshot } from './shared/form-dirty.js'
import { stageUploadGate, downloadGate } from './shared/staged-lifecycle.js'
import {
  collectTaskMaterials,
  attachmentDisplay,
  visibleProgressLog,
  currentRevision,
  effectiveAt,
  type MirrorTask,
} from './shared/task-materials-mirror.js'
import { TaskDraftMaterials } from './shared/task-draft-materials.js'
import type { TaskDraftOps } from './shared/b2-ops.js'
import { OkrForm as ExtOkrForm } from './views/okr-form.js'
import { HabitForm as ExtHabitForm } from './views/habit-form.js'
import { prefillOkrForm, prefillHabitForm } from './views/growth-form-props.js'
import {
  createMeetingCallbacks,
  createReportCallbacks,
  createDeliverableCallbacks,
} from './shared/records-callbacks.js'
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
  /** U5：报告来源类型（manual 手工 / session 会话）/ 来源会话 id（后端可选携带，前端只读展示用）。 */
  sourceType?: 'manual' | 'session'
  sourceSessionId?: string | null
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
  status: 'planned' | 'in_progress' | 'submitted' | 'accepted' | 'wrapped'
  location: string
  description: string
  dueDate: string | null
  history: DeliverableChange[]
  createdAt: string
  updatedAt: string
  repoUrl?: string
  branch?: string
  /** U5：关联里程碑 id / 备注（后端可选携带，前端只读展示用）。 */
  milestoneId?: string | null
  note?: string
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
  /** 看板布局（dsh-storage 透明存取）：user > project(旧全局只读)；byProject 为项目级 project:<id>。 */
  dashboards?: { user: unknown, project: unknown, byProject?: Record<string, unknown> }
  /**
   * B3 文件资产表（upload 路由就绪前可选/缺省）：fileId -> 元数据（fileName/size/hash）。
   * 只读展示，前端不伪造上传；attachmentOps 不含 addFile，路由原子挂载。字段以 data 快照为准，此处宽松可选。
   */
  fileAssets?: Record<string, { id: string, fileName?: string, size?: number, hash?: string, kind?: string, uploadedAt?: string }>
  /** #21 口径设置：服务端已归一化的生效口径；缺失/异常时前端再归一化回落默认。 */
  settings?: unknown
  /** P2002：审计只读项目投影，不携带完整日志或目标路径；旧快照缺字段回落未导出。 */
  latestExports?: Record<string, { at: string, format: 'markdown' | 'web' | 'plain' } | null>
  /** 宿主 HTTP 能力探测（webServer+connection）：httpAvailable/previewApi 齐备才提供权威预览，否则 CLI-only。 */
  capabilities?: {
    httpAvailable?: boolean
    previewApi?: boolean
    assetUpload?: boolean
    assetDownload?: boolean
    /** B3 暂存路由已注册（stage upload + DELETE cancel）；主草稿文件上传门控。 */
    stageCancel?: boolean
    limits?: { previewBodyBytes?: number, assetMaxBytes?: number }
  }
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
  | { kind: 'okr', record?: OkrViewRecord }
  | { kind: 'habit', record?: HabitViewRecord }
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
 * Markdown 统一走 shared/markdown-view.tsx（§3.3 同一安全 renderer，编辑/预览/详情同语义）；
 * 本地旧富文本解析器已删，不再维护第二套。
 */


export function PmPanel({ execute, executeRaw }: PmPanelApi) {
  const [restorePreview, setRestorePreview] = useState<
    { fileName: string, text: string } & ({ mode: 'content', content: string } | { mode: 'path', path: string })
    | null
  >(null)
  const [restorePath, setRestorePath] = useState('')
  const [data, setData] = useState<Snapshot>(empty)
  // empty 初值是未知，不是已确认空库；首读状态不能借用通用命令 busy。
  const [hasSnapshot, setHasSnapshot] = useState(false)
  const [snapshotPending, setSnapshotPending] = useState(true)
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
  // B1-B1：新版界面试用（pm-b1-pilot）仅 UI 偏好，localStorage 持久、默认 OFF；
  // off 保留旧 tasks 行为与样式、旧实现不删；壳根 data-pilot 门控试点视觉层，不污染 off 旧页。
  const [pilot, setPilotRaw] = useState<boolean>(() => {
    try { return localStorage.getItem('pm-b1-pilot') === 'on' } catch { return false }
  })
  const setPilot = (next: boolean) => {
    setPilotRaw(next)
    try { localStorage.setItem('pm-b1-pilot', next ? 'on' : 'off') } catch { /* ignore */ }
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
  // D-11：交付物视图反查到的任务直达；find 失败诚实反馈（不打开、不 task undefined）。
  const gotoTaskFromDeliverable = (taskId: string) => {
    const found = findRecord(data, 'task', taskId)
    if (!found) {
      setMessage(`未找到任务 ${taskId}：可能已删除或不在当前项目，未打开抽屉。`)
      return
    }
    openRecord(selected, 'task', taskId)
  }
  // D-07/D-08：甘特里程碑双击/Enter 详情；复用既有 setDrawer({kind:'milestone'}) 语义，
  // find 失败诚实反馈，绝不打开 undefined 抽屉。
  const openMilestoneFromGantt = (m: { id: string }) => {
    const found = findRecord(data, 'milestone', m.id)
    if (!found) {
      setMessage(`未找到里程碑 ${m.id}：可能已删除或不在当前项目，未打开抽屉。`)
      return
    }
    openRecord(selected, 'milestone', m.id)
  }
  const [drawer, setDrawer] = useState<Drawer>()
  const [reportCreateRequest, setReportCreateRequest] = useState(0)
  const [meetingCreateRequest, setMeetingCreateRequest] = useState(0)
  const [deliverableCreateRequest, setDeliverableCreateRequest] = useState(0)
  const [busy, setBusy] = useState(false)
  // E10：在途命令并发守卫。同一时刻只允许一条命令执行；第二次并发调用直接返回 false，
  // 不重复落库（双击 / 回车连发 / pending 期间二次点击都被挡）。
  const inflightRef = useRef(false)
  const [feedback, setFeedback] = useState<{ message: string, context?: FeedbackContext, generation: number }>({
    message: '', generation: 0,
  })
  const { message, context: feedbackContext, generation: messageGeneration } = feedback
  // 正文、类别与代际同次更新；普通通知和关闭默认清除 catch 类别。
  const setMessage = (next: string, context?: FeedbackContext) => {
    setFeedback(previous => ({ message: next, context, generation: previous.generation + 1 }))
  }
  // B1-C2：读取失败保留旧数据（不清空、不伪装最新），标陈旧并提供本地重试。
  const [stale, setStale] = useState(false)
  // O4：当前抽屉注册的关闭守卫（dirty 确认）；无注册时直接关闭。
  const closeGuardRef = useRef<(() => boolean) | null>(null)
  const [dashOpen, setDashOpen] = useState(false)
  const [topMenuOpen, setTopMenuOpen] = useState(false)
  // P1-7 副驾内嵌建议层（替代全屏抽屉）。R-S：改为 Portal fixed 浮层，不再作为 flex 兄弟挤压主列。
  const [copilotLayer, setCopilotLayer] = useState(false)
  // R-S2：最小化（40px 竖 tab，保留上下文）；R-S3：可调宽 420–560，默认 480，持久化到 localStorage。
  const [copilotMin, setCopilotMin] = useState(false)
  // P1004: yield only for a task opened from the sidecar, retaining its mounted context.
  const [copilotTaskHandoff, setCopilotTaskHandoff] = useState(false)
  const copilotYielding = copilotTaskHandoff && drawer != null
  const openCopilotRecord = (projectId: string, type: string, id: string) => {
    if (type === 'task' && findRecord(data, type, id)) setCopilotTaskHandoff(true)
    openRecord(projectId, type, id)
  }
  useEffect(() => {
    if (!drawer) setCopilotTaskHandoff(false)
  }, [drawer])
  const [copilotWidth, setCopilotWidth] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem('pm.sidecar.width'))
      return Number.isFinite(v) && v >= 420 && v <= 560 ? v : 480
    } catch { return 480 }
  })
  const copilotWidthRef = useRef(copilotWidth)
  const copilotOpenBtnRef = useRef<HTMLButtonElement | null>(null)
  // R-S5：ESC 关闭并把焦点归还开关按钮（非 modal，不做全局焦点陷阱）。
  const closeSidecar = () => {
    setCopilotLayer(false)
    setCopilotMin(false)
    copilotOpenBtnRef.current?.focus()
  }
  useEffect(() => {
    if (!copilotLayer || copilotYielding) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeSidecar() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copilotLayer, copilotYielding])
  // R-S3：右缘拖动手柄，clamp 420–560 并持久化。
  const startSidecarResize = (e: { clientX: number, preventDefault: () => void }) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = copilotWidthRef.current
    const track = (ev: globalThis.PointerEvent) => {
      const next = Math.max(420, Math.min(560, startW + (startX - ev.clientX)))
      copilotWidthRef.current = next
      setCopilotWidth(next)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', track)
      window.removeEventListener('pointerup', onUp)
      try { localStorage.setItem('pm.sidecar.width', String(copilotWidthRef.current)) } catch { /* ignore */ }
    }
    window.addEventListener('pointermove', track)
    window.addEventListener('pointerup', onUp)
  }
  // 右侧面板模式：只读诊断 / 草稿待确认。
  const [copilotMode, setCopilotMode] = useState<'diagnosis' | 'draft'>('diagnosis')
  // 已逐条关闭的诊断气泡 id（仅前端态，不写盘）。
  const [dismissedDiagnosis, setDismissedDiagnosis] = useState<ReadonlySet<string>>(new Set())
  const launchHandshakeRef = useRef<ReturnType<typeof createLaunchHandshakeRetrier> | null>(null)
  const launchMountRef = useRef({ active: false, generation: 0, snapshotReady: false })
  if (!launchHandshakeRef.current && typeof window !== 'undefined') {
    launchHandshakeRef.current = createLaunchHandshakeRetrier({
      getHash: () => window.location.hash,
      replaceState: (cleaned) => window.history.replaceState(
        null,
        '',
        buildLaunchHistoryUrl(window.location.pathname, window.location.search, cleaned),
      ),
    })
  }

  /** 重读 web snapshot；返回是否成功（失败仅置消息并返回 false，不抛，兼容既有 void 调用方）。 */
  const refresh = async (): Promise<boolean> => {
    const generation = launchMountRef.current.generation
    launchMountRef.current.snapshotReady = false
    setSnapshotPending(true)
    setBusy(true)
    try {
      const next = JSON.parse(await execute('web snapshot')) as Snapshot
      // 卸载或StrictMode重新挂载后的旧响应，不能替当前面板宣布数据就绪。
      if (!launchMountRef.current.active || launchMountRef.current.generation !== generation) return false
      const ids = next.projects.map(p => p.id)
      setData(next)
      setHasSnapshot(true)
      setStale(false)
      // OPT-03：刷新后回填记住的项目；已删除则回退到当前首个项目，不留脏值。
      let stored = ''
      try { stored = localStorage.getItem('pm-selected-project') ?? '' } catch { /* ignore */ }
      setSelected(resolveRememberedProject(stored, ids, selected && ids.includes(selected) ? selected : undefined))
      launchMountRef.current.snapshotReady = true
      // 首次失败可由后续成功刷新补试；成功仅属于本轮令牌。
      void launchHandshakeRef.current?.reportReady()
      return true
    } catch (error) {
      if (!launchMountRef.current.active || launchMountRef.current.generation !== generation) return false
      // B1-C2：失败不清空已有数据（保留旧内容），仅标陈旧；错误原文进 ResultCard，不静默合并。
      setStale(true)
      setMessage(error instanceof Error ? error.message : String(error))
      return false
    } finally {
      if (launchMountRef.current.active && launchMountRef.current.generation === generation) {
        setSnapshotPending(false)
        setBusy(false)
      }
    }
  }

  useEffect(() => {
    launchMountRef.current.active = true
    launchMountRef.current.generation += 1
    // 已就绪的同一PM面板可收到reopen新hash；只观察本面板的成功snapshot门。
    const onLaunchHash = () => {
      if (launchMountRef.current.snapshotReady && parseLaunchToken(window.location.hash)) {
        void launchHandshakeRef.current?.reportReady()
      }
    }
    window.addEventListener('hashchange', onLaunchHash)
    void refresh()
    return () => {
      launchMountRef.current.active = false
      launchMountRef.current.snapshotReady = false
      launchMountRef.current.generation += 1
      window.removeEventListener('hashchange', onLaunchHash)
    }
  }, [])

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
      // O3：业务拒绝（错误文本未 throw）不算成功，返回 false → 表单不 onSaved 关层，错误就近/全局可见。
      const accepted = commandAccepted(response)
      if (!options?.quiet) setMessage(response)
      return accepted
    } catch (error) {
      setMessage(prefixFeedbackOnce('执行失败', error), { kind: 'error' })
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
  // B6 策略A：records 视图回调走真实命令（成功刷新全量快照；run false 原样上抛，表单保输入不关层）。
  // onPreviewPeriod 仅在 snapshot.capabilities.httpAvailable && previewApi 时提供（HTTP JSON 权威预览）；
  // 否则 omit，表单显示 unavailable，绝不回退解析 CLI 文本。
  // memoize：按 project/capability 稳定回调实例，保留预览 AbortController 链，避免每次渲染重建丢 stale 中止。
  const previewAvailable = Boolean(data.capabilities?.httpAvailable && data.capabilities?.previewApi)
  const recordsDeps = useMemo(() => project
    ? {
      projectId: project.id,
      run,
      refresh: () => void refresh(),
      confirm: (o: { title: string, message?: string, confirmLabel?: string }) => confirmDanger(o),
      previewAvailable,
    }
    : null,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [project?.id, previewAvailable])
  const meetingRecords = useMemo(() => recordsDeps
    ? { projectId: recordsDeps.projectId, callbacks: createMeetingCallbacks(recordsDeps) }
    : undefined, [recordsDeps])
  const reportRecords = useMemo(() => recordsDeps
    ? { projectId: recordsDeps.projectId, callbacks: createReportCallbacks(recordsDeps) }
    : undefined, [recordsDeps])
  const deliverableRecords = useMemo(() => recordsDeps
    ? { projectId: recordsDeps.projectId, callbacks: createDeliverableCallbacks(recordsDeps) }
    : undefined, [recordsDeps])
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
    <ConfirmHost/>
    <main
      className="pm-shell"
      data-density={density}
      data-pilot={pilot ? 'on' : 'off'}
      aria-busy={busy || undefined}
      onPointerDownCapture={recordDrawerOpener}
      onClickCapture={recordDrawerOpener}
    >
      {busy && <div className="pm-busy-indicator" aria-hidden="true"/>}
      <FeedbackToast message={message} context={feedbackContext} messageGeneration={messageGeneration}/>

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
      {hasSnapshot && stale && !busy && (
        <div className="pm-stale-banner" role="status">
          <span className="pm-stale-banner__text">当前为上次读取的旧数据，最新内容暂未加载成功。</span>
          <button type="button" className="pm-stale-banner__retry" onClick={() => { void refresh() }}>重试</button>
        </div>
      )}
      {restorePreview && (
        <div className="pm-restore-preview">
          <div className="pm-restore-preview-warning">危险：恢复将用「{restorePreview.fileName}」替换当前七类实体（恢复前自动存安全快照）。</div>
          <pre className="pm-restore-preview-text">{restorePreview.text}</pre>
          <div className="pm-restore-preview-actions">
          <button
            className="pm-button pm-button-primary pm-restore-confirm"
            onClick={async () => {
              // 预览面板（已展示全文+危险说明）之上再走阻断式二次确认，防误触整体替换。
              const ok = await confirmDanger({
                title: '确认整体恢复？',
                objectType: '七类实体',
                objectTitle: restorePreview.fileName,
                impact: `将用「${restorePreview.fileName}」替换当前七类实体（恢复前自动存安全快照，现有数据会被覆盖）。`,
                confirmLabel: '确认恢复',
              })
              if (!ok) return
              try {
                const command = restorePreview.mode === 'path'
                  ? `restore "${restorePreview.path}" confirm`
                  : `restore-content ${JSON.stringify(restorePreview.content)} confirm`
                const r = await execute(command)
                // P1-1：本地成功走统一成功信封 → 3s toast，不再裸文本常驻大卡；错误仍由 catch 走 alert。
                setMessage(buildSuccessEnvelope([String(r ?? '已恢复（七类实体已替换）')]))
                setRestorePreview(null)
                void refresh()
              } catch (e) {
                setMessage(prefixFeedbackOnce('恢复失败', e))
              }
            }}
          >确认恢复</button>
          <button className="pm-tool-button pm-restore-cancel" onClick={() => setRestorePreview(null)}>取消</button>
          </div>
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
              : <strong>{hasSnapshot ? '暂无项目' : snapshotPending ? '正在读取项目' : '读取失败'}</strong>}
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
                cta = { label: '新增会议', action: () => setMeetingCreateRequest(n => n + 1) }
                break
              case 'reports':
                cta = { label: '生成快照', action: () => setReportCreateRequest(n => n + 1) }
                break
              case 'deliverables':
                cta = { label: '新增交付物', action: () => setDeliverableCreateRequest(n => n + 1) }
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
            ref={copilotOpenBtnRef}
            className="pm-button pm-top-secondary pm-copilot-open"
            data-active={copilotLayer || undefined}
            disabled={!project}
            aria-pressed={copilotLayer}
            title="PM 插件内副驾：Portal 浮层（非 modal），只读诊断气泡附着记录 + 操作草稿卡（确认才落库）；非宿主全局聊天"
            onClick={() => {
              // 副驾层挂在项目视图分支：总览看板下先退出全局看板回到当前项目，再切换副驾，避免点了无面板。
              if (dashOpen) setDashOpen(false)
              setCopilotLayer(v => !v)
              setCopilotMin(false)
            }}
          >
            <MessageSquare size={15}/>{copilotLayer ? 'AI 副驾 · 浮层' : 'AI 副驾'}
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
          <div className="pm-menu-caption">导航</div>
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
            <MessageSquare size={15}/>AI 副驾 · 侧边
          </button>
          <button
            className="pm-button pm-menu-item"
            disabled={!project}
            onClick={() => { setTopMenuOpen(false); setDrawer({ kind: 'settings' }) }}
          >
            <SlidersHorizontal size={15}/>口径设置
          </button>
          <div className="pm-menu-divider"/>
          <div className="pm-menu-caption">外观试验</div>
          <button
            type="button"
            className="pm-button pm-menu-item"
            role="menuitemcheckbox"
            aria-pressed={pilot}
            onClick={() => setPilot(!pilot)}
            title="仅本地 UI 偏好，默认关闭；开启后任务页试用新视觉，关闭立即回到旧版"
          >
            <span className="pm-view-menu-check">{pilot && <Check size={15}/>}</span>
            新版界面试用
          </button>
          <div className="pm-menu-divider"/>
          <div className="pm-menu-caption">数据管理</div>
          <button
            className="pm-button pm-backup-btn"
            disabled={busy}
            title="一键备份 pmtool 七类实体到内置 packages/backups/（恢复请用 /pm restore <文件> confirm）"
            onClick={async () => {
              const ok = await confirmDanger({
                neutral: true,
                title: '开始备份？',
                objectType: '七类实体',
                impact: '将把当前七类实体备份到内置 packages/backups/（带时间戳 JSON，成功后显示完整路径），不改动现有数据。',
                confirmLabel: '开始备份',
              })
              if (!ok) return
              const text = await execute('backup')
              // P1-1：备份成功走成功信封（摘要进 toast，原始输出含完整路径进 detail，
              // 由 extractBackupPath 抽取后常驻复制位，不丢路径）。
              setMessage(buildSuccessEnvelope(['备份完成'], String(text ?? '')))
              void refresh()
            }}
          >
            <Database size={15}/>备份
          </button>
          <div className="pm-menu-restore-path" style={{ padding: '8px 12px', maxWidth: '100%' }}>
            <label htmlFor="pm-restore-path">本机备份完整路径</label>
            <input id="pm-restore-path" value={restorePath} style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="粘贴备份成功提示中的完整路径"
              onChange={e => setRestorePath(e.currentTarget.value)}/>
            <p className="pm-muted" style={{ whiteSpace: 'normal' }}>含附件的备份须保留旁边的文件目录，预检会一起核对。</p>
            <button type="button" className="pm-button" disabled={busy || !restorePath.trim()}
              onClick={async () => {
                const path = restorePath.trim()
                // 路径是命令数据，不执行shell；拒引号/换行，防截断路径成为额外confirm参数。
                if (/["\r\n]/.test(path)) {
                  setMessage('备份路径不能包含双引号或换行，请输入完整本机路径。')
                  return
                }
                try {
                  const text = String(await execute(`restore "${path}"`))
                  if (!commandAccepted(text)) { setMessage(text); return }
                  setRestorePreview({ mode: 'path', fileName: path, path, text })
                  setTopMenuOpen(false)
                } catch (error) { setMessage(prefixFeedbackOnce('恢复失败', error)) }
              }}>预检本机备份</button>
          </div>
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
                      setRestorePreview({ mode: 'content', fileName: file.name, content, text })
                    })
                    .catch((e) => setMessage(prefixFeedbackOnce('恢复失败', e)))
                }
                reader.readAsText(file)
                e.currentTarget.value = ''
              }}
            />
          </label>
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
                // P1-1：导出成功走成功信封 → 3s toast，不常驻大卡。
                setMessage(buildSuccessEnvelope([`已导出 Markdown（约 ${tasks.length} 个任务）并开始下载。`]))
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
                setMessage(buildSuccessEnvelope([`已导出整库 JSON${count ? `（约 ${count} 条记录）` : ''}。`]))
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

      {!hasSnapshot
        ? snapshotPending
          ? <div className="pm-empty-workspace" role="status">
              <strong>正在读取项目数据…</strong>
              <p>首次读取成功后显示项目与任务。</p>
            </div>
          : <div className="pm-stale-banner" role="status">
              <span className="pm-stale-banner__text">首次读取失败，请重试。{message && ` ${message}`}</span>
              <button type="button" className="pm-stale-banner__retry" onClick={() => { void refresh() }}>重试</button>
            </div>
        : dashOpen
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
            {message && (
              <div className="pm-result-zone">
                <ResultCard
                  message={message}
                  context={feedbackContext}
                  messageGeneration={messageGeneration}
                  onClose={() => setMessage('')}
                  onAction={(command) => { void run(command) }}
                />
              </div>
            )}
            <div className="pm-suggest-split" data-open={copilotLayer || undefined}>
            {/* I6：此处无归属它的 tablist（导航为 rail 菜单），移除孤立 role=tabpanel，避免无主面板。 */}
            {/* §1 统一 bare 壳：12 视图共用单层 --pm-shell-pad-x，视图不再自加左右 padding（B 组已删自叠 padding，此处承接避免塌陷）。 */}
            <PageShell bare className="pm-view-shell">
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
                latestExport={data.latestExports?.[project.id] ?? null}
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
                tasks={tasks}
                riskIssues={riskIssues}
                onCreate={() => setDrawer({ kind: 'meeting' })}
                onEdit={meeting => setDrawer({ kind: 'meeting', meeting })}
                records={meetingRecords}
                createRequest={meetingCreateRequest}
              />}
              {view === 'reports' && <ProgressReportTable
                reports={reports}
                onCreate={() => setDrawer({ kind: 'report' })}
                onEdit={report => setDrawer({ kind: 'report', report })}
                records={reportRecords}
                createRequest={reportCreateRequest}
              />}
              {view === 'deliverables' && <DeliverableTable
                deliverables={deliverables}
                milestones={milestones}
                tasks={tasks}
                onCreate={() => setDrawer({ kind: 'deliverable' })}
                onEdit={deliverable => setDrawer({ kind: 'deliverable', deliverable })}
                records={deliverableRecords}
                createRequest={deliverableCreateRequest}
                onGotoTask={gotoTaskFromDeliverable}
              />}
              {view === 'overview' && (
                <>
                  <Overview project={project} tasks={tasks} milestones={milestones} riskIssues={riskIssues} meetingsCount={meetings.length} reportsCount={reports.length} deliverablesCount={deliverables.length} settings={settings} onEditProject={() => setDrawer({ kind: 'project-edit', project })}/>
                  <BoardBento
                    data={scopeSnapshot(data, project.id)}
                    projectId={project.id}
                    actions={{
                      openRecord,
                      pickProject: (id) => setSelected(id),
                      runCommand: (line) => run(line),
                      refreshBoard: () => refresh(),
                    }}
                    persistence={{
                      onSave: async (scope, layout) => {
                        await execute(`dashboard put ${scope} ${JSON.stringify(layout)}`)
                      },
                      onReset: async (scope) => {
                        await execute(`dashboard reset ${scope}`)
                      },
                    }}
                  />
                </>
              )}
              {view === 'gantt' && <GanttView tasks={tasks} milestones={milestones} run={run} onEdit={task => setDrawer({ kind: 'task', task })} onCreate={() => setDrawer({ kind: 'task' })} disabled={busy} onGotoView={changeView} onOpenMilestone={openMilestoneFromGantt}/>}
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
                onCreate={() => setDrawer({ kind: 'okr' })}
                onEdit={(record) => setDrawer({ kind: 'okr', record })}
              />}
              {view === 'habits' && <HabitsView
                projectId={project.id}
                habits={habits}
                inbox={habitInbox}
                okrs={okrs}
                run={run}
                onSaved={refresh}
                onCreate={() => setDrawer({ kind: 'habit' })}
                onEdit={(record) => setDrawer({ kind: 'habit', record })}
              />}
            </section>
            </PageShell>
            </div>
            {/* R-S：Portal fixed 浮层，脱离 flex 流；开关前后主列宽完全一致（非 modal，role=region）。 */}
            {copilotLayer && project && (
              <>
                {/* 最小化只隐藏同一子树，保留草稿、未发送输入及本轮撤销上下文。 */}
                <aside className="pm-sidecar" hidden={copilotMin || copilotYielding} role="region" aria-label="AI 副驾" style={{ width: `${copilotWidth}px` }}>
                  <div
                    className="pm-sidecar-handle"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="拖拽调整副驾宽度（420–560px）"
                    onPointerDown={startSidecarResize}
                  />
                  <div className="pm-sidecar-chrome">
                    <span className="pm-sidecar-title">AI 副驾</span>
                    <span className="pm-sidecar-actions">
                      <button type="button" className="pm-sidecar-iconbtn" onClick={() => setCopilotMin(true)} aria-label="最小化为侧边标签（保留上下文）">—</button>
                      <button type="button" className="pm-sidecar-iconbtn" onClick={closeSidecar} aria-label="关闭副驾（ESC）">×</button>
                    </span>
                  </div>
                  <div className="pm-sidecar-body">
                    <CopilotPanel
                      projectId={project.id}
                      tasks={tasks}
                      milestones={milestones}
                      riskIssues={riskIssues}
                      deliverables={deliverables}
                      meetings={meetings}
                      baselineMap={Object.fromEntries(
                        [...tasks, ...milestones, ...riskIssues, ...deliverables, ...meetings]
                          .map(record => [record.id, (record as { updatedAt?: string }).updatedAt ?? '']),
                      )}
                      execute={execute}
                      executeRaw={executeRaw}
                      disabled={busy}
                      onSaved={refresh}
                      onOpenRecord={openCopilotRecord}
                      embedded
                      diagnosis={diagnosis}
                      onDismissDiagnosis={dismissDiagnosis}
                      mode={copilotMode}
                      onModeChange={setCopilotMode}
                    />
                  </div>
                </aside>
                {copilotMin && !copilotYielding && (
                  <button type="button" className="pm-sidecar-tab" onClick={() => setCopilotMin(false)} aria-label="展开 AI 副驾，保留此前上下文">
                    <MessageSquare size={15}/><span>副驾</span>
                  </button>
                )}
              </>
            )}
          </>}
      </div>

      {drawer && <DrawerPanel
        title={drawerTitle(drawer)}
        onClose={() => { closeGuardRef.current = null; setDrawer(undefined) }}
        beforeClose={() => (closeGuardRef.current ? closeGuardRef.current() : true)}
      >
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
          stale={stale}
          run={run}
          onSaved={() => setDrawer(undefined)}
          onCancel={() => setDrawer(undefined)}
          registerGuard={fn => { closeGuardRef.current = fn }}
          onOpenMeeting={(meetingId, meetingProjectId) => openRecord(meetingProjectId ?? project.id, 'meeting', meetingId)}
          onOpenMilestone={milestoneId => openRecord(project.id, 'milestone', milestoneId)}
          deliverableOptions={deliverables.map(d => ({ id: d.id, name: d.name, version: d.version }))}
          stageEnabled={stageUploadGate(data.capabilities)}
          downloadEnabled={downloadGate(data.capabilities?.assetDownload)}
          onChanged={() => void refresh()}
          onError={setMessage}
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
        {drawer.kind === 'okr' && project && <OkrForm
          key={drawer.record ? `okr-${drawer.record.id}` : 'okr-new'}
          projectId={project.id}
          record={drawer.record}
          objectives={okrs}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
          onCancel={() => setDrawer(undefined)}
        />}
        {drawer.kind === 'habit' && project && <HabitForm
          key={drawer.record ? `habit-${drawer.record.id}` : 'habit-new'}
          projectId={project.id}
          record={drawer.record}
          okrs={okrs}
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
                  className={range === d ? 'is-on' : ''} onClick={() => setRange(d)}>{d} 天</button>,
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
  // R3：计数统一由 TaskTable 内同源互斥四桶呈现，壳层不再重复算总数（避免各算各的）。
  return <div className="pm-tasks-head">
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
  if (drawer.kind === 'okr') return drawer.record ? '编辑 OKR' : '新建 OKR'
  if (drawer.kind === 'habit') return drawer.record ? '编辑习惯' : '新建习惯'
  if (drawer.kind === 'ai') return 'AI 助手'
  if (drawer.kind === 'settings') return '口径设置'
  return drawer.deliverable ? '编辑交付物' : '新增交付物'
}

/**
 * AI 助手面板：完全复用斜杠命令的 core 草稿→confirm 逻辑。
 * “生成草稿”发一次预览命令（调一次模型），“确认入库”发对应 confirm 命令
 * （复用进程内草稿缓存，不再调模型）。AI 结果一律先预览、显式确认才落库。
 */
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

/**
 * §3.2 反馈分型（v2）：
 * - FeedbackToast：仅结构化成功摘要进瞬时 toast（≤2 行、role=status、3s 自动消逝）；
 *   error/warn/非结构化不进 toast。
 * - ResultCard：非瞬时持久卡。错误 role=alert 单处呈现；结构化成功短摘要常显 + 详情折叠；
 *   非结构化原样持久（不吞不改写）；[pm:action] 渲染独立确认按钮，命令不进保存正文。
 * 两层都从不 focus()，不抢焦点；表单输入在错误时保留（抽屉不卸载）。
 */
function FeedbackToast({ message, context, messageGeneration }: {
  message: string, context?: FeedbackContext, messageGeneration?: number
}) {
  const fb = classifyFeedback(message, context)
  const [visible, setVisible] = useState(true)
  const generation = useRef(0)
  useLayoutEffect(() => {
    generation.current += 1
    setVisible(true)
    return () => { generation.current += 1 }
  }, [message, context?.kind, messageGeneration])
  useEffect(() => {
    if (!fb.autoDismissMs) return
    const requestGeneration = generation.current
    const timer = setTimeout(() => {
      if (requestGeneration === generation.current) setVisible(false)
    }, fb.autoDismissMs)
    return () => clearTimeout(timer)
  }, [message, context?.kind, messageGeneration, fb.autoDismissMs])
  if (!visible || fb.isError || !fb.autoDismissMs || !fb.summary.length) return null
  return (
    <div className="pm-toast pm-toast--success" role="status" aria-live="polite">
      <Check size={15}/>
      <div className="pm-toast__msg">{fb.summary.slice(0, 2).join('\n')}</div>
    </div>
  )
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

function DrawerPanel({ title, onClose, beforeClose, children }: {
  title: string
  onClose: () => void
  /** O4：关闭前守卫；返回 false 中止关闭（如未保存草稿待确认），缺省直接关闭。 */
  beforeClose?: () => boolean
  children: ReactNode
}) {
  // O4：统一关闭入口，ESC/scrim/X 都先过守卫，避免任一路径绕过 dirty 确认。
  const requestClose = () => {
    // 确认层显示期间，关闭动作归确认；同次 keydown 不再重入底层 dirty 守卫。
    if (asideRef.current?.ownerDocument.querySelector('.pm-confirm-dialog')) return
    if (beforeClose && beforeClose() === false) return
    onClose()
  }
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
      if (ev.key === 'Escape') { ev.stopPropagation(); requestClose(); return }
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
  }, [requestClose])
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
    <button className="pm-drawer-scrim" aria-label="关闭编辑抽屉" onClick={requestClose}/>
    <aside ref={asideRef} className="pm-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <header>
        <div><span>项目记录</span><h2>{title}</h2></div>
        <button className="pm-icon-button" aria-label="关闭抽屉" onClick={requestClose}><X size={17}/></button>
      </header>
      <div className="pm-drawer-body">{children}</div>
    </aside>
  </div>
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
        onClick={async () => {
          const ok = await confirmDanger({
            title: '删除项目？',
            objectType: '项目',
            objectTitle: project.name,
            objectId: project.id,
            impact: '将删除该项目及其全部台账（任务/里程碑/风险/会议/汇报/交付物），此操作不可撤销。',
            confirmLabel: '确认删除项目',
          })
          if (ok) void run(`project delete ${project.id} confirm`).then(success => success && onSaved())
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
  stale,
  run,
  onSaved,
  onCancel,
  onOpenMeeting,
  onOpenMilestone,
  registerGuard,
  deliverableOptions,
  onChanged,
  onError,
  stageEnabled,
  downloadEnabled,
}: {
  projectId: string
  task?: Task
  tasks: Task[]
  milestones: Milestone[]
  meetings: Meeting[]
  /** T8：执行人候选（跨项目全量派生，仅建议；不限制/不改写输入值）。 */
  assigneeCandidates: string[]
  disabled: boolean
  /** O5：外层读取失败处于陈旧快照时，客观进度只读值附弱陈旧标注，不参与提交。 */
  stale?: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
  onCancel: () => void
  onOpenMeeting: (meetingId: string, projectId?: string) => void
  /** D-08：只读关联里程碑直达（关闭抽屉并切到里程碑视图）；可选，缺省只展示不可点。 */
  onOpenMilestone?: (milestoneId: string) => void
  /** O4：向抽屉注册关闭守卫（dirty 确认）；卸载注销。 */
  registerGuard?: (guard: (() => boolean) | null) => void
  /** B2：可选交付物选项（id/name/version），供关联交付物下拉。 */
  deliverableOptions?: { id: string, name: string, version?: string }[]
  /** B3：暂存路由已注册（capabilities.stageCancel），才显示文件暂存输入。 */
  stageEnabled?: boolean
  /** B3：capabilities.assetDownload 为真，已存文件才渲染下载链接。 */
  downloadEnabled?: boolean
  /** B2：单项写成功后刷新任务快照（不关抽屉）。 */
  onChanged?: () => void
  /** B2：命令失败就近/全局展示错误文本，保留输入。 */
  onError?: (text: string) => void
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
  // D-08/D-11：抽屉侧只读关联投影（零 schema、不回写）；当前已保存里程碑 + 已关联交付物。
  const linkedMilestone = task ? resolveLinkedMilestone(task.milestoneId, milestones) : null
  const linkedDeliverables = task ? resolveLinkedDeliverables(task, deliverableOptions ?? []) : []
  // O4：打开瞬间采集初始快照（含非控 description）；关闭前比对，dirty 才弹放弃确认，干净直接关。
  const formRef = useRef<HTMLFormElement>(null)
  const initialSnap = useRef<FormSnapshot | null>(null)
  const tryClose = (): boolean => {
    const form = formRef.current
    const mustConfirm = shouldConfirmDiscard(
      initialSnap.current,
      form ? collectFormSnapshot(form) : null,
      draftDirtyRef.current,
    )
    if (!mustConfirm) return true
    void confirmDanger({
      title: '放弃未保存修改？',
      message: '当前表单有未保存改动（含资料/进展草稿），关闭将丢弃这些内容。',
      confirmLabel: '放弃修改',
    }).then(ok => { if (ok) onCancel() })
    return false
  }
  useLayoutEffect(() => {
    if (formRef.current) initialSnap.current = collectFormSnapshot(formRef.current)
    registerGuard?.(tryClose)
    return () => registerGuard?.(null)
    // 仅注册一次（key 按 task 重挂载）；onCancel/registerGuard 稳定。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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
  const [checklistBusy, setChecklistBusy] = useState(false)
  const checklistBusyRef = useRef(false)
  const [checklistError, setChecklistError] = useState('')
  const checklistTask = task ? tasks.find(item => item.id === task.id) ?? task : undefined
  const checklistHasChildren = !!task && tasks.some(item => item.parentId === task.id)
  const toggleChecklist = async (itemId: string, expectedDone: boolean) => {
    if (!task || disabled || checklistHasChildren || checklistBusyRef.current) return
    checklistBusyRef.current = true
    setChecklistBusy(true)
    setChecklistError('')
    try {
      const ok = await run(`task checklist toggle ${task.id} ${itemId} ${expectedDone}`)
      if (ok) onChanged?.()
      else setChecklistError('清单更新失败，请重试；当前勾选仍以已保存内容为准。')
    } catch (error) {
      setChecklistError(prefixFeedbackOnce('清单更新失败', error))
    } finally {
      checklistBusyRef.current = false
      setChecklistBusy(false)
    }
  }
  // B2 ops 草稿信封：draft 面板本地追加 attachmentOps/progressOps，提交时随单条命令合并；
  // 无改动为 null（不发 draft 键）；draftErrors 非空则拦截提交、保留输入不关层。
  const [draftEnvelope, setDraftEnvelope] = useState<{ draft: TaskDraftOps } | null>(null)
  const [draftErrors, setDraftErrors] = useState<string[]>([])
  // dirty 守卫读 ref（tryClose 仅注册一次，避免闭包捕获旧 state）。
  const draftDirtyRef = useRef(false)
  // B3：命令成功同步置 true，供 draft 面板卸载决策跳过已消费暂存的 DELETE（后端已 finalize）。
  const submissionRef = useRef(false)
  const handleDraft = (envelope: { draft: TaskDraftOps } | null, errors: string[]) => {
    draftDirtyRef.current = envelope != null
    setDraftEnvelope(envelope)
    setDraftErrors(errors)
  }
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
    // B2 ops 草稿校验：存在非法项则拦截提交、保留输入不关层（零写）。
    if (draftErrors.length > 0) {
      onError?.(draftErrors.join('\n'))
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
    // PROD-11：完整受控集合整体替换，搜索只过滤视图；空数组即清空。
    const predecessorIds = Array.from(checkedIds)
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
      // B2：ops 信封随单条 task update 原子提交（无改动则无 draft 键）。
      ...(draftEnvelope?.draft ? { draft: draftEnvelope.draft } : {}),
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
      // B2：create 同样走 ops 信封（clientId 别名可被 progress refs 前向引用）。
      ...(draftEnvelope?.draft ? { draft: draftEnvelope.draft } : {}),
    }
    let success = false
    try {
      success = await run(task
        ? `task update ${task.id} ${JSON.stringify(payload)}`
        : `task add ${JSON.stringify(createPayload)}`)
    } finally {
      endSubmit()
    }
    if (success) {
      submissionRef.current = true
      onSaved()
    }
  }
  return <form ref={formRef} className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
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
            {stale && <span className="pm-muted pm-meta-stale">（数据陈旧，重试后更新）</span>}
          </span>
        </div>
        {task && (
          <div className="pm-task-checklist" aria-label="任务清单" aria-busy={checklistBusy || undefined}>
            <span className="pm-meta-label">清单检查点（勾选后即时保存）</span>
            {checklistHasChildren
              ? <p className="pm-muted">有子任务的任务不挂清单；客观进度由子任务汇总。</p>
              : checklistTask?.checklist?.length
                ? checklistTask.checklist.map(item => (
                  <label key={item.id} className="pm-task-checklist-item">
                    <input type="checkbox" aria-label={`清单：${item.text}`} checked={item.done}
                      disabled={disabled || checklistBusy}
                      onChange={event => toggleChecklist(item.id, event.currentTarget.checked)}/>
                    <span>{item.text}</span>
                  </label>
                ))
                : <p className="pm-muted">暂无清单检查点。</p>}
            {checklistError && <p className="pm-field-error" role="alert">{checklistError}</p>}
          </div>
        )}
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
      {/* D-08/D-11 当前已保存关联只读投影（不回写）；无关联诚实空态。 */}
      <div className="pm-rel-projection" aria-label="当前关联只读信息">
        <span className="pm-rel-projection__label">当前关联</span>
        {!linkedMilestone && linkedDeliverables.length === 0 && (
          <span className="pm-muted pm-rel-projection__empty">暂无已保存的里程碑或交付物关联。</span>
        )}
        {linkedMilestone && (
          <span className="pm-rel-chip" data-kind="milestone">
            <MilestoneIcon size={13} aria-hidden="true"/>
            {onOpenMilestone ? (
              <button type="button" className="pm-rel-chip__go" onClick={() => onOpenMilestone(linkedMilestone.id)}>
                {linkedMilestone.title} <span className="pm-rel-chip__id">{linkedMilestone.id}</span>
              </button>
            ) : (
              <span>{linkedMilestone.title} <span className="pm-rel-chip__id">{linkedMilestone.id}</span></span>
            )}
          </span>
        )}
        {linkedDeliverables.map(dv => (
          <span key={dv.deliverableId} className="pm-rel-chip" data-kind="deliverable">
            <Package size={13} aria-hidden="true"/>
            <span>{dv.name}{dv.version ? `（${dv.version}）` : ''} <span className="pm-rel-chip__id">{dv.deliverableId}</span></span>
          </span>
        ))}
      </div>
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
                  onChange={e => {
                    const checked = e.currentTarget.checked
                    setCheckedIds(prev => {
                      const next = new Set(prev)
                      if (checked) next.add(row.task.id); else next.delete(row.task.id)
                      return next
                    })
                  }}
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
    {/* B2：新建/编辑统一走本地 ops 草稿（attachmentOps/progressOps），提交随单条 task add/update 原子落库；
        面板只追加 op 不写盘，cancel 零写；既有条目只读 + 暂存徽标，未提及项后端原样保留。 */}
    <TaskDraftMaterials
      task={task as unknown as MirrorTask | undefined}
      deliverableOptions={deliverableOptions ?? []}
      stageEnabled={stageEnabled}
      taskId={task?.id}
      downloadEnabled={downloadEnabled}
      submissionRef={submissionRef}
      onDraft={handleDraft}
    />
    <div className="pm-drawer-actions">
      {task && <button
        className="pm-button pm-button-danger pm-actions-left"
        type="button"
        disabled={disabled}
        onClick={async () => {
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
            const cur = queue.shift()!
            for (const child of byParent.get(cur) ?? []) { subtree += 1; queue.push(child) }
          }
          const hasChildren = subtree > 1
          const ok = await confirmDanger({
            title: hasChildren ? '级联删除任务？' : '删除任务？',
            objectType: '任务',
            objectTitle: task.title,
            objectId: task.id,
            impact: hasChildren
              ? `将级联删除该任务及其全部 ${subtree - 1} 个子任务（共 ${subtree} 项；旁支任务保留），此操作不可撤销。`
              : '将删除该任务，此操作不可撤销。',
            confirmLabel: hasChildren ? '确认级联删除' : '确认删除',
          })
          if (!ok) return
          const line = hasChildren
            ? `task delete ${task.id} cascade confirm`
            : `task delete ${task.id} confirm`
          void run(line).then(success => success && onSaved())
        }}
      ><Trash2 size={15}/>删除</button>}
      <button className="pm-button" type="button" disabled={disabled} onClick={() => { if (tryClose()) onCancel() }}>取消</button>
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
        onClick={async () => {
          const ok = await confirmDanger({
            title: '删除里程碑？',
            objectType: '里程碑',
            objectTitle: milestone.title,
            objectId: milestone.id,
            impact: '将删除该里程碑；其下任务保留但将失去里程碑归属。此操作不可撤销。',
            confirmLabel: '确认删除里程碑',
          })
          if (ok) void run(`milestone delete ${milestone.id} confirm`).then(success => success && onSaved())
        }}
      ><Trash2 size={15}/>删除</button>}
      <button className="pm-button" type="button" disabled={disabled} onClick={onCancel}>取消</button>
      <button className="pm-button pm-button-primary" disabled={disabled || submitting} aria-busy={submitting || undefined}>
        {submitting ? '提交中…' : milestone ? '保存更改' : '添加里程碑'}
      </button>
    </div>
  </form>
}

/**
 * OKR 新建/编辑抽屉：接既有 `okr add <项目ID> <JSON>` / `okr update <okrID> <JSON>`。
 * 字段严格对齐 add/update schema：kind/title/owner/targetDate/primaryOkrId/relatedOkrIds/status/description；
 * 默认草稿（draft→confirmed 由人在表单显式选择，前端不自动定稿）。无删除/归档按钮。
 */
function OkrForm({
  projectId,
  record,
  objectives,
  disabled,
  run,
  onSaved,
  onCancel,
}: {
  projectId: string
  record?: OkrViewRecord
  objectives: OkrViewRecord[]
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
  onCancel: () => void
}) {
  // B7：UI 交给外部受控 ExtOkrForm；这里只保留命令通道（okr add/update）与提交守卫。
  const [submitting, beginSubmit, endSubmit] = useSubmitGuard()
  // D-12 软关联允许实体范围 = 本项目全部 OKR（objective + key-result，后端只校验存在/同项目/非自指，
  // 不限定 kind）；故已知集 objectiveIds 取全量，避免只取 objective 误把合法 KR 软关联判为未知。
  // 父主归属列表 primaryOptions 仍只列 objective（KR 不能作父），父选择 UX 不变。
  const objectiveIds = new Set(objectives.map(o => o.id))
  const primaryOptions = objectives
    .filter(o => o.kind === 'objective')
    .map(o => ({ value: o.id, label: `${o.title}（${o.id}）` }))
  // P1-2：软关联选项 = 本项目全量 OKR（objective + KR，后端不限 kind），标注类型便于区分；
  // 父主归属列表仍只列 objective（KR 不能作父），两条口径分开。
  const relatedOptions = objectives.map(o => ({
    value: o.id,
    label: `${o.title}（${o.kind === 'objective' ? '目标' : 'KR'} · ${o.id}）`,
  }))
  const handleSubmit = async (values: OkrFormValues) => {
    if (!beginSubmit()) return
    const related = parseIdList(values.relatedOkrIds)
    const owner = values.owner?.trim() || null
    const targetDate = values.targetDate?.trim() || null
    const description = values.description?.trim() || null
    let success = false
    try {
      if (record) {
        const patch: Record<string, unknown> = {
          title: values.title.trim(),
          kind: values.kind,
          owner,
          targetDate,
          description,
          status: values.status,
          primaryOkrId: values.kind === 'key-result' ? (values.primaryOkrId?.trim() || null) : null,
          relatedOkrIds: related,
        }
        success = await run(`okr update ${record.id} ${JSON.stringify(patch)}`)
      } else {
        const payload: Record<string, unknown> = {
          title: values.title.trim(),
          kind: values.kind,
          status: values.status,
          primaryOkrId: values.kind === 'key-result' ? (values.primaryOkrId?.trim() || null) : null,
          relatedOkrIds: related,
        }
        if (owner) payload.owner = owner
        if (targetDate) payload.targetDate = targetDate
        if (description) payload.description = description
        success = await run(`okr add ${projectId} ${JSON.stringify(payload)}`)
      }
    } finally {
      endSubmit()
    }
    if (success) onSaved()
  }
  return (
    <ExtOkrForm
      initial={record
        ? prefillOkrForm(record)
        : { title: '', kind: 'objective', owner: '', targetDate: '', primaryOkrId: '', relatedOkrIds: '', status: 'draft', description: '' }}
      objectiveIds={objectiveIds}
      primaryOptions={primaryOptions}
      relatedOptions={relatedOptions}
      busy={submitting}
      disabled={disabled}
      onCancel={onCancel}
      onSubmit={v => void handleSubmit(v)}
    />
  )
}

/**
 * 习惯新建/编辑抽屉：接既有 `habit add <项目ID> <JSON>` / `habit update <habitID> <JSON>`。
 * 字段对齐 habitCreateSchema/habitUpdateSchema：title/goal/frequency/notes/okrId；
 * update patch 中空文本传 null 清空、空 okrId 传 null 解绑；不改 status/checkIns/streak 等系统字段。
 */
function HabitForm({
  projectId,
  record,
  okrs,
  disabled,
  run,
  onSaved,
  onCancel,
}: {
  projectId: string
  record?: HabitViewRecord
  okrs: OkrViewRecord[]
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
  onCancel: () => void
}) {
  // B7：UI 交给外部受控 ExtHabitForm；这里只保留命令通道（habit add/update）与提交守卫。
  const [submitting, beginSubmit, endSubmit] = useSubmitGuard()
  const okrOptions = okrs.map(o => ({ value: o.id, label: `${o.title}（${o.id}）` }))
  const handleSubmit = async (values: HabitFormValues) => {
    if (!beginSubmit()) return
    const goal = values.goal?.trim() || null
    const frequency = values.frequency?.trim() || null
    const notes = values.notes?.trim() || null
    const okrId = values.okrId?.trim() || null
    let success = false
    try {
      if (record) {
        const patch: Record<string, unknown> = { title: values.title.trim() }
        patch.goal = goal
        patch.frequency = frequency
        patch.notes = notes
        patch.okrId = okrId
        success = await run(`habit update ${record.id} ${JSON.stringify(patch)}`)
      } else {
        const payload: Record<string, unknown> = { title: values.title.trim() }
        if (goal) payload.goal = goal
        if (frequency) payload.frequency = frequency
        if (notes) payload.notes = notes
        if (okrId) payload.okrId = okrId
        success = await run(`habit add ${projectId} ${JSON.stringify(payload)}`)
      }
    } finally {
      endSubmit()
    }
    if (success) onSaved()
  }
  return (
    <ExtHabitForm
      initial={record
        ? prefillHabitForm(record)
        : { title: '', goal: '', frequency: '', notes: '', okrId: '' }}
      okrOptions={okrOptions}
      busy={submitting}
      disabled={disabled}
      onCancel={onCancel}
      onSubmit={v => void handleSubmit(v)}
    />
  )
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
        onClick={async () => {
          const ok = await confirmDanger({
            title: '删除风险/问题？',
            objectType: riskIssueType[record.type],
            objectTitle: record.title,
            objectId: record.id,
            impact: '将删除该风险/问题记录，此操作不可撤销。',
            confirmLabel: '确认删除',
          })
          if (ok) void run(`risk-issue delete ${record.id} confirm`).then(success => success && onSaved())
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
          onClick={async () => {
            const ok = await confirmDanger({
              title: '删除会议？',
              objectType: '会议',
              objectTitle: meeting.title,
              objectId: meeting.id,
              impact: '将删除该会议及其行动项记录，此操作不可撤销。',
              confirmLabel: '确认删除会议',
            })
            if (ok) void run(`meeting delete ${meeting.id} confirm`).then(success => success && onSaved())
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
              onClick={async () => {
                const ok = await confirmDanger({
                  neutral: true,
                  title: '把行动项转为项目任务？',
                  objectType: '行动项',
                  objectTitle: action.title,
                  objectId: action.id,
                  impact: '负责人/截止日一并带入，转后此处显示「已转」，重复点击不会再建任务。',
                  confirmLabel: '确认转任务',
                })
                if (ok) void run(`meeting action promote ${meeting.id} ${action.id} confirm`).then(success => success && onSaved())
              }}
            >转任务</button>}
      <button
        className="pm-row-button"
        type="button"
        disabled={disabled}
        aria-label={`删除 ${action.title}`}
        onClick={async () => {
          const ok = await confirmDanger({
            title: '删除行动项？',
            objectType: '行动项',
            objectTitle: action.title,
            objectId: action.id,
            impact: '将删除该会议下的行动项，此操作不可撤销。',
            confirmLabel: '确认删除',
          })
          if (ok) void run(`meeting action delete ${meeting.id} ${action.id} confirm`).then(success => success && onSaved())
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
  // D-10：管理摘要统一走 SH-6 MarkdownEditor（源码/即时预览/格式辅助）；本地受控，
  // 定稿快照语义不变，保存时按记录 form 口径 sanitize，不双清源/预览。
  const [summary, setSummary] = useState(report?.executiveSummary ?? '')
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
      executiveSummary: sanitizeMarkdownDraft(summary),
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
        <Field label="管理摘要（Markdown：源码编辑 + 即时预览，支持标题/加粗/列表/链接）" wide>
          <MarkdownEditor
            value={summary}
            onChange={setSummary}
            minRows={6}
            ariaLabel="管理摘要 Markdown"
            density="compact"
          />
        </Field>
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
            onClick={async () => {
              const ok = await confirmDanger({
                title: '删除进度汇报？',
                objectType: '进度汇报',
                objectTitle: report.title,
                objectId: report.id,
                impact: '将删除该进度汇报记录，此操作不可撤销。',
                confirmLabel: '确认删除',
              })
              if (ok) void run(`report delete ${report.id} confirm`).then(success => success && onSaved())
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
          onClick={async () => {
            const ok = await confirmDanger({
              title: '删除交付物？',
              objectType: '交付物',
              objectTitle: deliverable.name,
              objectId: deliverable.id,
              impact: '将删除该交付物登记（不删除本地文件），此操作不可撤销。',
              confirmLabel: '确认删除',
            })
            if (ok) void run(`deliverable delete ${deliverable.id} confirm`).then(success => success && onSaved())
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

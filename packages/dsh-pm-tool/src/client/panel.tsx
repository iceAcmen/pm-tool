import { panelKeyboard, fromKeyboardEvent } from '../core/panel-kbd.js'
import { flattenVisible as flattenTaskTree } from '../core/task-tree.js'
import { resolveRecordLocation, findRecord } from '../core/record-location.js'
import { buildUpdate } from '../core/task-inline.js'
import { computeKPI, buildAgenda, groupRiskMatrix } from '../core/war-room.js'
import { dateRange, shiftDatesByDrag, barGeometry, todayOffset, daysFrom } from '../core/gantt.js'
import { parseCopilotActions, validateActions } from '../core/copilot.js'
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.mjs'
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
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import styles from './panel.css?raw'

type Project = {
  id: string
  name: string
  description: string
  owner: string
  status: string
  startDate: string
  targetDate: string
}

type Task = {
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
}

type Milestone = {
  id: string
  projectId: string
  title: string
  description: string
  targetDate: string
  status: string
  achievedDate: string | null
}

type RiskIssue = {
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
    tasks: { total: number, done: number, blocked: number, averageProgress: number }
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

type Deliverable = {
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
}

type Snapshot = {
  projects: Project[]
  tasks: Task[]
  milestones: Milestone[]
  riskIssues: RiskIssue[]
  meetings: Meeting[]
  reports: ProgressReport[]
  deliverables: Deliverable[]
}
type View = 'tasks' | 'milestones' | 'risk-issues' | 'meetings' | 'reports' | 'deliverables' | 'overview' | 'gantt'
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
      if (v === 'tasks' || v === 'milestones' || v === 'risk-issues' || v === 'meetings' || v === 'reports' || v === 'deliverables' || v === 'overview' || v === 'gantt') return v
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

  const run = async (line: string) => {
    setBusy(true)
    try {
      const response = await execute(line)
      await refresh()
      setMessage(response)
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

  return <>
    <style>{styles}</style>
    <main className="pm-shell">
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
              ? <label className="pm-project-select">
                  <select
                    value={project.id}
                    onChange={event => {
                      setSelected(event.currentTarget.value)
                      setDrawer(undefined)
                    }}
                    aria-label="切换项目"
                  >
                    {data.projects.map(item =>
                      <option key={item.id} value={item.id}>{item.name}</option>,
                    )}
                  </select>
                  <ChevronDown size={15}/>
                </label>
              : <strong>暂无项目</strong>}
          </div>
        </div>
        <div className="pm-top-actions">
          <button
            className="pm-button"
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
            className="pm-button"
            disabled={!project || dashOpen}
            title="AI 拆解 WBS / 生成汇报叙述 / 归纳会议纪要（结果为草稿，需确认才入库）"
            onClick={() => setDrawer({ kind: 'ai' })}
          >
            <Sparkles size={15}/>AI 助手
          </button>
          <button
            className="pm-button pm-copilot-open"
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
            className="pm-button pm-backup-btn"
            disabled={busy}
            title="一键备份 pmtool 七类实体到仓库 backups/（恢复请用 /pm restore <文件> confirm）"
            onClick={async () => {
              const text = await execute('backup')
              setMessage(`备份完成：${text}`)
              void refresh()
            }}
          >
            <Database size={15}/>备份
          </button>
          <label className="pm-button pm-restore-btn" title="选择本地备份 JSON 恢复（先演练，确认后才替换）">
            <Package size={15}/>从备份恢复
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
            onPickProject={(id) => { setSelected(id); setDashOpen(false) }}
            onOpenRecord={(pid, type, id) => { setDashOpen(false); openRecord(pid, type, id) }}
            onClose={() => setDashOpen(false)}
          />
        : !project
          ? <EmptyWorkspace onCreate={() => setDrawer({ kind: 'project-create' })}/>
          : <>
            <ProjectBar
              project={project}
              tasks={tasks}
              milestones={milestones}
              riskIssues={riskIssues}
              meetings={meetings}
              reports={reports}
              deliverables={deliverables}
              onEdit={() => setDrawer({ kind: 'project-edit', project })}
            />
            <ReminderStrip data={data} onPickProject={(id) => setSelected(id)} onOpenRecord={(pid, type, id) => openRecord(pid, type, id)}/>
            <nav className="pm-view-tabs" aria-label="项目视图" role="tablist">
              <ViewTab active={view === 'tasks'} icon={<ListTree size={15}/>} count={tasks.length} onClick={() => changeView('tasks')}>
                全部任务
              </ViewTab>
              <ViewTab active={view === 'milestones'} icon={<MilestoneIcon size={15}/>} count={milestones.length} onClick={() => changeView('milestones')}>
                里程碑
              </ViewTab>
              <ViewTab active={view === 'risk-issues'} icon={<ShieldAlert size={15}/>} count={riskIssues.length} onClick={() => changeView('risk-issues')}>
                风险与问题
              </ViewTab>
              <ViewTab active={view === 'meetings'} icon={<NotebookTabs size={15}/>} count={meetings.length} onClick={() => changeView('meetings')}>
                会议纪要
              </ViewTab>
              <ViewTab active={view === 'reports'} icon={<FileText size={15}/>} count={reports.length} onClick={() => changeView('reports')}>
                进度汇报
              </ViewTab>
              <ViewTab active={view === 'deliverables'} icon={<Package size={15}/>} count={deliverables.length} onClick={() => changeView('deliverables')}>
                交付物
              </ViewTab>
              <ViewTab active={view === 'overview'} icon={<LayoutDashboard size={15}/>} onClick={() => changeView('overview')}>
                项目概览
              </ViewTab>
              <ViewTab active={view === 'gantt'} icon={<CalendarDays size={15}/>} onClick={() => changeView('gantt')}>
                甘特排期
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
              />}
              {view === 'milestones' && <MilestoneTable
                milestones={milestones}
                disabled={busy}
                onCreate={() => setDrawer({ kind: 'milestone' })}
                onEdit={milestone => setDrawer({ kind: 'milestone', milestone })}
                run={run}
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
                onCreate={() => setDrawer({ kind: 'deliverable' })}
                onEdit={deliverable => setDrawer({ kind: 'deliverable', deliverable })}
              />}
              {view === 'overview' && <Overview project={project} tasks={tasks} milestones={milestones} riskIssues={riskIssues}/>}
              {view === 'gantt' && <GanttView tasks={tasks} milestones={milestones} run={run} onSaved={() => void refresh()}/>}
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
          projectId={project.id}
          task={drawer.task}
          tasks={tasks}
          milestones={milestones}
          disabled={busy}
          run={run}
          onSaved={() => setDrawer(undefined)}
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
          taskIds={tasks.map(t => t.id)}
          baselineMap={Object.fromEntries(tasks.map(t => [t.id, (t as { updatedAt?: string }).updatedAt ?? '']))}
          execute={execute}
          run={run}
          disabled={busy}
          onSaved={() => void refresh()}
        />}
      </DrawerPanel>}
    </main>
  </>
}

/** R16/OPT-01/02 提醒：客户端基于 snapshot 派生临期/逾期（纯展示，不入库、不调模型）。 */
function ReminderStrip({ data, onPickProject, onOpenRecord }: {
  data: Snapshot
  onPickProject?: (id: string) => void
  onOpenRecord?: (projectId: string, type: string, id: string) => void
}) {
  const today = useMemo(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
  }, [])
  const [range, setRange] = useState(7)
  const items = useMemo(() => {
    const projName = new Map(data.projects.map(p => [p.id, p.name]))
    const days = (date: string) => Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000)
    const out: { severity: 'overdue' | 'soon', type: string, projectId: string, refId: string, label: string }[] = []
    for (const t of data.tasks) {
      if (t.status === 'done' || t.progress >= 100 || !t.dueDate) continue
      const d = days(t.dueDate)
      if (d < 0) out.push({ severity: 'overdue', type: 'task', projectId: t.projectId, refId: t.id, label: `任务 ${t.title}（逾期 ${-d} 天）` })
      else if (d <= range) out.push({ severity: 'soon', type: 'task', projectId: t.projectId, refId: t.id, label: `任务 ${t.title}（还有 ${d} 天）` })
    }
    for (const m of data.milestones) {
      if (m.status === 'achieved') continue
      const d = days(m.targetDate)
      if (d < 0) out.push({ severity: 'overdue', type: 'milestone', projectId: m.projectId, refId: m.id, label: `里程碑 ${m.title}（逾期 ${-d} 天）` })
      else if (d <= range) out.push({ severity: 'soon', type: 'milestone', projectId: m.projectId, refId: m.id, label: `里程碑 ${m.title}（还有 ${d} 天）` })
    }
    out.sort((a, b) => (a.severity === 'overdue' ? -1 : 1) - (b.severity === 'overdue' ? -1 : 1))
    // 按项目分组。
    const groups = new Map<string, typeof out>()
    for (const it of out) {
      const g = groups.get(it.projectId) ?? []
      g.push(it); groups.set(it.projectId, g)
    }
    return { groups, projName }
  }, [data, today, range])

  const total = Array.from(items.groups.values()).reduce((n, g) => n + g.length, 0)
  if (!total) {
    return <section className="pm-reminders pm-reminders-empty" aria-label="临期与逾期提醒">
      <div className="pm-reminders-head">
        <span className="pm-reminders-title"><Bell size={14}/>提醒</span>
        <RangePicker range={range} setRange={setRange}/>
      </div>
      <p className="pm-reminders-none">未来 {range} 天内没有临期或逾期事项。</p>
    </section>
  }
  const overdue = Array.from(items.groups.values()).flat().filter(i => i.severity === 'overdue').length
  return <section className="pm-reminders" aria-label="临期与逾期提醒">
    <div className="pm-reminders-head">
      <span className="pm-reminders-title"><Bell size={14}/>提醒</span>
      <RangePicker range={range} setRange={setRange}/>
      {overdue > 0 && <span className="pm-reminders-count pm-reminders-overdue">逾期 {overdue}</span>}
      {total - overdue > 0 && <span className="pm-reminders-count pm-reminders-soon">临期 {total - overdue}</span>}
    </div>
    {Array.from(items.groups.entries()).map(([pid, list]) =>
      <div key={pid} className="pm-reminder-group" data-pid={pid}>
        <button
          type="button"
          className="pm-reminder-project"
          data-pick-project={pid}
          onClick={() => onPickProject?.(pid)}
          title={`切换到项目 ${items.projName.get(pid) ?? pid}`}
        >{items.projName.get(pid) ?? pid}</button>
        <ul>{list.map((it, idx) =>
          <li
            key={`${it.refId}-${idx}`}
            className={it.severity === 'overdue' ? 'pm-reminders-row pm-reminders-row-overdue' : 'pm-reminders-row pm-reminders-row-soon'}
            data-open-record
            data-open-type={it.type}
            data-open-id={it.refId}
            onClick={() => onOpenRecord?.(it.projectId, it.type, it.refId) ?? onPickProject?.(it.projectId)}
          >{it.label}</li>,
        )}</ul>
      </div>,
    )}
  </section>
}

function RangePicker({ range, setRange }: { range: number, setRange: (n: number) => void }) {
  return <span className="pm-reminder-ranges" role="group" aria-label="提醒范围">
    {[3, 7, 14, 30].map(d =>
      <button
        key={d}
        type="button"
        className={`pm-reminder-range${range === d ? ' pm-button-primary' : ''}`}
        aria-pressed={range === d}
        onClick={() => setRange(d)}
      >{d} 天</button>,
    )}
  </span>
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

  const switchMode = (next: 'wbs' | 'narrate' | 'summarize') => {
    if (working) return
    setMode(next); setText(''); setPreview('')
    try { localStorage.setItem('pm-ai-mode', next) } catch {}
  }

  const fillTemplate = (goal: string) => {
    if (working) return
    setText(goal); setPreview('')
    try { localStorage.setItem('pm-ai-goal', goal) } catch {}
  }

  const generate = async () => {
    if (!canGenerate) return
    setWorking(true); setPreview('')
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

  return <div className="pm-ai">
    <div className="pm-ai-tabs">
      {([
        ['wbs', 'AI 拆解 WBS'],
        ['narrate', 'AI 汇报叙述'],
        ['summarize', 'AI 会议纪要'],
      ] as const).map(([key, label]) =>
        <button
          key={key}
          type="button"
          className={`pm-button pm-ai-tab${mode === key ? ' pm-button-primary' : ''}`}
          aria-pressed={mode === key}
          disabled={working}
          onClick={() => switchMode(key)}
        >{label}</button>,
      )}
    </div>
    <div className="pm-model-lane" role="tablist" aria-label="模型车道">
      <button
        type="button"
        role="tab"
        aria-selected={lane === 'poc'}
        className={`pm-lane-poc pm-button${lane === 'poc' ? ' pm-button-primary' : ''}`}
        disabled={working}
        onClick={() => switchLane('poc')}
      >PoC 验证（免费网关）</button>
      <button
        type="button"
        role="tab"
        aria-selected={lane === 'prod'}
        className={`pm-lane-prod pm-button${lane === 'prod' ? ' pm-button-primary' : ''}`}
        disabled={working}
        onClick={() => switchLane('prod')}
      >生产开发（官方 API）</button>
    </div>
    {lane === 'poc' && (
      <p className="pm-lane-warning" role="note">⚠ 免费公共网关仅用于概念验证/界面原型，勿用于核心代码合并或生产提交；公共网关可能记录内容。</p>
    )}
    {lane === 'prod' && (
      <p className="pm-lane-note" role="note">生产车道使用官方 API + 自有 Key（DeepSeek 优先 / Kimi 次之）；未配置 Key 时会给出中文引导。</p>
    )}
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
        rows={mode === 'summarize' ? 6 : 2}
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
    <div className="pm-ai-actions">
      <button
        type="button"
        className="pm-button pm-button-primary"
        disabled={!canGenerate || disabled}
        onClick={() => void generate()}
      >{working ? '生成中…' : '生成草稿'}</button>
      <button
        type="button"
        className="pm-button pm-ai-confirm"
        disabled={working || !preview}
        onClick={() => void confirm()}
      >确认入库</button>
    </div>
    {mode === 'wbs' && preview && (
      <div className="pm-ai-preview-edit">
        <p className="pm-ai-note">可在下方修改清单（缩进代表父子层级，`- [ ]`/`- [x]` 代表未完成/已完成），点「确认入库」按编辑结果落盘，不再调用模型。</p>
        <textarea
          className="pm-ai-input pm-ai-markdown pm-ai-wbs-raw"
          rows={10}
          value={preview}
          disabled={working}
          onChange={event => setPreview(event.currentTarget.value)}
        />
      </div>
    )}
    {mode !== 'wbs' && preview && (
      <div className="pm-ai-preview-edit">
        <p className="pm-ai-note">可在下方修改{mode === 'narrate' ? '叙述段落' : '归纳内容'}，点「确认入库」按编辑结果落盘，不再调用模型。</p>
        <textarea
          className="pm-ai-input pm-ai-markdown pm-ai-raw"
          rows={8}
          value={preview}
          disabled={working}
          onChange={event => setPreview(event.currentTarget.value)}
        />
      </div>
    )}
    <p className="pm-ai-note">AI 结果为草稿，需点“确认入库”才写入项目；失败（如免费模型超时/限流）会显示中文提示，可重试或改用手工录入，核心台账不受影响。</p>
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
  return <div className="pm-notice" role="status">
    <Check size={15}/>
    <span>{message.split('\n')[0]}</span>
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

function ProjectBar({
  project,
  tasks,
  milestones,
  riskIssues,
  meetings,
  reports,
  deliverables,
  onEdit,
}: {
  project: Project
  tasks: Task[]
  milestones: Milestone[]
  riskIssues: RiskIssue[]
  meetings: Meeting[]
  reports: ProgressReport[]
  deliverables: Deliverable[]
  onEdit: () => void
}) {
  const completed = tasks.filter(task => task.status === 'done').length
  return <section className="pm-project-bar">
    <div className="pm-project-title">
      <h1>{project.name}</h1>
      <StatusTag kind="project" value={project.status}/>
      <button className="pm-plain-icon" title="编辑项目" aria-label="编辑项目" onClick={onEdit}>
        <Pencil size={14}/>
      </button>
    </div>
    <p>{project.description || '暂无项目描述'}</p>
    <div className="pm-project-facts">
      <span><UserRound size={14}/>{project.owner || '未指定负责人'}</span>
      <span><CalendarDays size={14}/>{project.startDate} 至 {project.targetDate}</span>
      <span><ListTree size={14}/>{completed}/{tasks.length} 任务完成</span>
      <span><MilestoneIcon size={14}/>{milestones.length} 个里程碑</span>
      <span><ShieldAlert size={14}/>{riskIssues.filter(item => item.status !== 'closed').length} 项待处理风险/问题</span>
      <span><NotebookTabs size={14}/>{meetings.length} 份会议纪要</span>
      <span><FileText size={14}/>{reports.length} 份进度汇报</span>
      <span><Package size={14}/>{deliverables.length} 项交付物</span>
    </div>
  </section>
}

function ViewTab({
  active,
  icon,
  count,
  children,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  count?: number
  children: ReactNode
  onClick: () => void
}) {
  return <button role="tab" aria-selected={active} className="pm-view-tab" onClick={onClick}>
    {icon}{children}{count !== undefined && <span>{count}</span>}
  </button>
}

function TaskTable({
  tasks,
  milestones,
  disabled,
  onCreate,
  onEdit,
  onGenWbs,
  onSaved,
  run,
  execute,
  projectId,
}: {
  tasks: Task[]
  milestones: Milestone[]
  disabled: boolean
  onCreate: () => void
  onEdit: (task: Task) => void
  onGenWbs?: () => void
  onSaved: () => void
  run: (line: string) => Promise<boolean>
  execute: (line: string) => Promise<string>
  projectId: string
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [grouped, setGrouped] = useState(false) // PROD-01：默认树视图，状态分组降为可选开关
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggleCollapse = (id: string) => setCollapsed(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const [sort, setSort] = useState<'code' | 'dueDate' | 'priority' | 'progress'>('code')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const priorityRank = (p: string) => ({ P0: 0, P1: 1, P2: 2 }[p] ?? 3)
  const sorted = [...tasks].sort((a, b) => {
    if (sort === 'dueDate') return String(a.dueDate ?? '9999').localeCompare(String(b.dueDate ?? '9999'))
    if (sort === 'priority') return priorityRank(a.priority) - priorityRank(b.priority)
    if (sort === 'progress') return (b.progress ?? 0) - (a.progress ?? 0)
    return a.code.localeCompare(b.code, 'en', { numeric: true })
  })
  const visible = sorted.filter(task => {
    const matchesText = `${task.code} ${task.title} ${task.assignee}`.toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase())
    return matchesText && (status === 'all' || task.status === status)
  })
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const batchIds = [...selected].join(',')
  // OPT-09：纯键盘导航（j/k 移动、空格勾选、Del 走批量删除确认）。
  const [activeIdx, setActiveIdx] = useState(0)
  // OPT-12：导入预览（dry-run 文本 + 确认落盘命令）。
  const [importPreview, setImportPreview] = useState<{ text: string, confirm: string } | null>(null)
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const action = panelKeyboard(fromKeyboardEvent(ev))
      if (!action) return
      ev.preventDefault()
      if (action.type === 'move') {
        setActiveIdx(i => Math.max(0, Math.min(visible.length - 1, i + action.delta)))
      } else if (action.type === 'toggleActive') {
        const row = visible[activeIdx]
        if (row) toggleSelect(row.id)
      } else if (action.type === 'deleteSelected') {
        confirmBatchDelete()
      } else if (action.type === 'openActive') {
        const row = visible[activeIdx]
        if (row) onEdit?.(row)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  const confirmBatchDelete = () => {
    if (!selected.size) return
    void run(`task batch delete ${batchIds}`).then(() => {
      if (window.confirm(`将级联删除所选 ${selected.size} 个任务及其全部后代（旁支保留），确定继续吗？`)) {
        void run(`task batch delete ${batchIds} confirm`).then(ok => { if (ok) { setSelected(new Set()); onSaved() } })
      }
    })
  }
  const groups = grouped
    ? Object.keys(taskStatus).map(value => ({
        key: value,
        label: taskStatus[value],
        rows: visible.filter(task => task.status === value),
      })).filter(group => group.rows.length)
    : [{ key: 'all', label: '全部任务', rows: visible }]

  return <>
    <TableToolbar
      query={query}
      setQuery={setQuery}
      primaryLabel="添加记录"
      onCreate={onCreate}
    >
      <label className="pm-toolbar-select">
        <Filter size={14}/>
        <select value={status} onChange={event => setStatus(event.currentTarget.value)} aria-label="筛选任务状态">
          <option value="all">全部状态</option>
          {Object.entries(taskStatus).map(([value, label]) =>
            <option key={value} value={value}>{label}</option>,
          )}
        </select>
      </label>
      <label className="pm-toolbar-select">
        <ArrowDownWideNarrow size={14}/>
        <select value={sort} onChange={event => setSort(event.currentTarget.value as typeof sort)} className="pm-sort-select" aria-label="任务排序">
          <option value="code">按 WBS 编号</option>
          <option value="dueDate">按截止日期</option>
          <option value="priority">按优先级</option>
          <option value="progress">按进度</option>
        </select>
      </label>
      <button className="pm-tool-button pm-group-toggle" aria-pressed={grouped} onClick={() => setGrouped(value => !value)}>
        <ListFilter size={14}/>{grouped ? '按状态分组（开）' : '按状态分组'}
      </button>
      {/* OPT-12：网页上传 csv/xlsx，前端读内容交 import-content（xlsx 仍 node 侧解析）。 */}
      <label className="pm-tool-button pm-import-dropzone" title="选择 .csv / .xlsx 任务表导入（先预览，再在确认中落盘）">
        <FileText size={14}/>导入文件
        <input
          type="file"
          accept=".csv,.xlsx"
          hidden
          className="pm-import-file"
          onChange={(e) => {
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
                setImportPreview({ text, confirm: `task import-content ${pid} ${file.name} ${enc} confirm` })
              } catch (err) {
                setImportPreview({ text: `解析失败：${err instanceof Error ? err.message : String(err)}`, confirm: '' })
              }
            }
            if (isCsv) reader.readAsText(file); else reader.readAsArrayBuffer(file)
          }}
        />
      </label>
    </TableToolbar>




    {importPreview && (
      <div className="pm-import-preview">
        <pre className="pm-import-preview-text">{importPreview.text}</pre>
        {importPreview.confirm && (
          <button
            className="pm-button pm-button-primary pm-import-confirm"
            disabled={disabled}
            onClick={() => {
              void run(importPreview.confirm).then(ok => { if (ok) { setImportPreview(null); onSaved() } })
            }}
          >确认落盘</button>
        )}
        <button className="pm-tool-button" onClick={() => setImportPreview(null)}>取消</button>
      </div>
    )}


    {selected.size > 0 && (
      <div className="pm-batch-bar">
        <span>已选 {selected.size} 项</span>
        <button className="pm-tool-button pm-batch-complete" disabled={disabled} onClick={() => { void run(`task batch update ${batchIds} {"status":"done"}`).then(ok => ok && onSaved()) }}>标为完成</button>
        {/* OPT-05：批量改负责人/优先级/截止，复用 task batch update。 */}
        <BatchField
          className="pm-batch-field pm-batch-assignee"
          placeholder="负责人"
          onApply={(json) => run(`task batch update ${batchIds} ${json}`).then(ok => ok && onSaved())}
        />
        <label className="pm-batch-field pm-batch-priority">
          <select defaultValue="" aria-label="批量优先级"
            onChange={(e) => {
              const v = e.currentTarget.value
              if (!v) return
              void run(`task batch update ${batchIds} ${JSON.stringify({ priority: v })}`).then(ok => ok && onSaved())
              e.currentTarget.value = ''
            }}>
            <option value="" disabled>批量优先级</option>
            {['low', 'medium', 'high'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <BatchField
          className="pm-batch-field pm-batch-due"
          type="date"
          placeholder="截止日"
          onApply={(json) => run(`task batch update ${batchIds} ${json}`).then(ok => ok && onSaved())}
        />
        <button className="pm-tool-button pm-batch-delete pm-danger" disabled={disabled} onClick={confirmBatchDelete}>批量删除</button>
        <button className="pm-tool-button" onClick={() => setSelected(new Set())}>取消选择</button>
      </div>
    )}

    <p className="pm-kbd-help" title="j/k 移动行 · 空格勾选 · Enter 打开 · Del 批量删除">⌨ j/k 移动 · 空格勾选 · Enter 打开 · Del 批量删除</p>

    <div className="pm-table-frame">
      <div className="pm-table-scroll">
        <table className="pm-data-table">
          <thead>
            <tr>
              <th className="pm-col-check"><span className="pm-checkbox"/></th>
              <th className="pm-col-code">WBS</th>
              <th className="pm-col-title">任务名称</th>
              <th>状态</th>
              <th>优先级</th>
              <th>执行人</th>
              <th>进度</th>
              <th>开始日期</th>
              <th>截止日期</th>
              <th>里程碑</th>
              <th className="pm-col-actions"/>
            </tr>
          </thead>
          <tbody>
            {grouped
              ? groups.map(group => <TaskGroup
                  key={group.key}
                  group={group}
                  milestones={milestones}
                  disabled={disabled}
                  onEdit={onEdit}
                  run={run}
                  selected={selected}
                  onToggle={toggleSelect}
                  onSaved={onSaved}
                />)
              : <TaskGroup
                  key="tree"
                  group={{ key: 'all', label: '全部任务', rows: visible }}
                  milestones={milestones}
                  disabled={disabled}
                  onEdit={onEdit}
                  run={run}
                  selected={selected}
                  onToggle={toggleSelect}
                  tree={flattenTaskTree(visible, collapsed)}
                  collapsed={collapsed}
                  onToggleCollapse={toggleCollapse}
                  onSaved={onSaved}
                />}
          </tbody>
        </table>
      </div>
      {!visible.length && <TableEmpty
        text={tasks.length ? '没有符合筛选条件的任务' : '暂无任务记录'}
        action={onGenWbs && <button className="pm-button pm-button-primary pm-empty-ai-cta" onClick={onGenWbs}>
          <Sparkles size={14}/>用 AI 一键生成 WBS
        </button>}
      />}
      <button className="pm-add-row" onClick={onCreate}><Plus size={14}/>添加记录</button>
    </div>
    <div className="pm-table-footer">{visible.length} 条记录</div>
  </>
}

function TaskGroup({
  group,
  milestones,
  disabled,
  onEdit,
  run,
  selected,
  onToggle,
  onSaved,
  tree,
  collapsed,
  onToggleCollapse,
}: {
  group: { key: string, label: string, rows: Task[] }
  milestones: Milestone[]
  disabled: boolean
  onEdit: (task: Task) => void
  run: (line: string) => Promise<boolean>
  selected: Set<string>
  onToggle: (id: string) => void
  onSaved: () => void
  tree?: { task: Task, depth: number, hasChildren: boolean, childIds: string[] }[]
  collapsed?: Set<string>
  onToggleCollapse?: (id: string) => void
}) {
  const rows = tree ?? group.rows.map(task => ({ task, depth: Math.max(0, task.code.split('.').length - 1), hasChildren: false, childIds: [] }))
  if (!tree) {
    return <>
    <tr className="pm-group-row">
      <td colSpan={11}><ChevronDown size={14}/><StatusTag kind="task" value={group.key}/><span>{group.rows.length} 条记录</span></td>
    </tr>
    {rows.map(({ task: task }) => <TaskRow
      key={task.id}
      task={task}
      depth={Math.max(0, task.code.split('.').length - 1)}
      milestones={milestones}
      disabled={disabled}
      onEdit={onEdit}
      run={run}
      selected={selected}
      onToggle={onToggle}
      onSaved={onSaved}
    />)}
  </>
  }
  return <>
    {rows.map(({ task, depth, hasChildren, childIds }) => {
      const isCollapsed = hasChildren && collapsed?.has(task.id)
      return <TaskRow
        key={task.id}
        task={task}
        depth={depth}
        hasChildren={hasChildren}
        collapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        milestones={milestones}
        disabled={disabled}
        onEdit={onEdit}
        run={run}
        selected={selected}
        onToggle={onToggle}
        onSaved={onSaved}
      />
    })}
  </>
}

function TaskRow({
  task, depth, milestones, disabled, onEdit, run, selected, onToggle,
  hasChildren, collapsed, onToggleCollapse, onSaved,
}: {
  task: Task
  depth: number
  milestones: Milestone[]
  disabled: boolean
  onEdit: (task: Task) => void
  run: (line: string) => Promise<boolean>
  selected: Set<string>
  onToggle: (id: string) => void
  hasChildren?: boolean
  collapsed?: boolean
  onToggleCollapse?: (id: string) => void
  onSaved: () => void
}) {
    {const milestone = milestones.find(item => item.id === task.milestoneId)
      return <tr className="pm-record-row pm-task-row">
        <td className="pm-col-check">
          <input
            type="checkbox"
            className="pm-row-select"
            aria-label={`选择 ${task.title}`}
            checked={selected.has(task.id)}
            onChange={() => onToggle(task.id)}
          />
          <button
            className="pm-check-button"
            data-checked={task.status === 'done'}
            disabled={disabled}
            aria-label={task.status === 'done' ? `重新打开 ${task.title}` : `完成 ${task.title}`}
            onClick={() => void run(`task update ${task.id} ${JSON.stringify({
              status: task.status === 'done' ? 'todo' : 'done',
              progress: task.status === 'done' ? 0 : 100,
            })}`)}
          ><Check size={13}/></button>
        </td>
        <td className="pm-col-code">{task.code}</td>
        <td className="pm-col-title">
          {hasChildren ? (
            <button
              className="pm-task-toggle"
              aria-label={collapsed ? `展开 ${task.title}` : `折叠 ${task.title}`}
              onClick={() => onToggleCollapse?.(task.id)}
            >{collapsed ? '▸' : '▾'}</button>
          ) : <span className="pm-task-toggle pm-task-toggle--leaf"/>}
          <button
            className="pm-title-cell"
            data-done={task.status === 'done'}
            style={{ paddingLeft: `${depth * 16}px` }}
            onClick={() => onEdit(task)}
          >{task.title}</button>
        </td>
        <td>
          <select
            className="pm-row-status"
            data-task-id={task.id}
            value={task.status}
            aria-label={`${task.title} 状态`}
            disabled={disabled}
            onChange={(e) => {
              const upd = buildUpdate({ status: e.currentTarget.value })
              void run(`task update ${task.id} ${JSON.stringify(upd)}`).then(ok => ok && onSaved())
            }}
          >
            <option value="todo">待办</option>
            <option value="doing">进行中</option>
            <option value="done">完成</option>
          </select>
        </td>
        <td><PriorityTag value={task.priority}/></td>
        <td>{task.assignee
          ? <span className="pm-person"><span>{task.assignee.slice(0, 1)}</span>{task.assignee}</span>
          : <span className="pm-cell-empty">未指定</span>}</td>
        <td>
          <input
            type="number"
            className="pm-row-progress"
            data-task-id={task.id}
            value={task.progress ?? 0}
            min={0} max={100} step={10}
            aria-label={`${task.title} 进度`}
            disabled={disabled}
            onChange={(e) => {
              const upd = buildUpdate({ progress: e.currentTarget.value })
              if (!Object.keys(upd).length) return
              void run(`task update ${task.id} ${JSON.stringify(upd)}`).then(ok => ok && onSaved())
            }}
          />
        </td>
        <td>{task.startDate || <span className="pm-cell-empty">-</span>}</td>
        <td>
          <input
            type="date"
            className="pm-row-due"
            data-task-id={task.id}
            value={task.dueDate ?? ''}
            aria-label={`${task.title} 截止日期`}
            disabled={disabled}
            onChange={(e) => {
              const upd = buildUpdate({ dueDate: e.currentTarget.value })
              if (!Object.keys(upd).length) return
              void run(`task update ${task.id} ${JSON.stringify(upd)}`).then(ok => ok && onSaved())
            }}
          />
        </td>
        <td>{milestone
          ? <span className="pm-reference">{milestone.title}</span>
          : <span className="pm-cell-empty">-</span>}</td>
        <td className="pm-col-actions">
          <button className="pm-row-button" aria-label={`编辑 ${task.title}`} onClick={() => onEdit(task)}>
            <Pencil size={14}/>
          </button>
        </td>
      </tr>
    }
}

function MilestoneTable({
  milestones,
  disabled,
  onCreate,
  onEdit,
  run,
}: {
  milestones: Milestone[]
  disabled: boolean
  onCreate: () => void
  onEdit: (milestone: Milestone) => void
  run: (line: string) => Promise<boolean>
}) {
  const [query, setQuery] = useState('')
  const visible = milestones.filter(item =>
    item.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  )
  return <>
    <TableToolbar query={query} setQuery={setQuery} primaryLabel="添加里程碑" onCreate={onCreate}/>
    <div className="pm-table-frame">
      <div className="pm-table-scroll">
        <table className="pm-data-table pm-milestone-table">
          <thead>
            <tr>
              <th className="pm-col-check"><span className="pm-checkbox"/></th>
              <th className="pm-col-title">里程碑名称</th>
              <th>状态</th>
              <th>目标日期</th>
              <th>实际达成日期</th>
              <th>说明 / 达成标准</th>
              <th className="pm-col-actions"/>
            </tr>
          </thead>
          <tbody>
            {visible.map(item => <tr className="pm-record-row" key={item.id}>
              <td className="pm-col-check">
                <button
                  className="pm-check-button"
                  data-checked={item.status === 'achieved'}
                  disabled={disabled || item.status === 'achieved'}
                  aria-label={`标记 ${item.title} 达成`}
                  onClick={() => void run(`milestone update ${item.id} ${JSON.stringify({
                    status: 'achieved',
                    achievedDate: new Date().toISOString().slice(0, 10),
                  })}`)}
                ><Check size={13}/></button>
              </td>
              <td className="pm-col-title"><button className="pm-title-cell" onClick={() => onEdit(item)}>{item.title}</button></td>
              <td><StatusTag kind="milestone" value={item.status}/></td>
              <td>{item.targetDate}</td>
              <td>{item.achievedDate || <span className="pm-cell-empty">-</span>}</td>
              <td className="pm-description-cell">{item.description || <span className="pm-cell-empty">暂无说明</span>}</td>
              <td className="pm-col-actions"><button className="pm-row-button" aria-label={`编辑 ${item.title}`} onClick={() => onEdit(item)}><Pencil size={14}/></button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {!visible.length && <TableEmpty text={milestones.length ? '没有匹配的里程碑' : '暂无里程碑记录'}/>}
      <button className="pm-add-row" onClick={onCreate}><Plus size={14}/>添加记录</button>
    </div>
    <div className="pm-table-footer">{visible.length} 条记录</div>
  </>
}

function RiskIssueTable({
  records,
  disabled,
  onCreate,
  onEdit,
}: {
  records: RiskIssue[]
  disabled: boolean
  onCreate: () => void
  onEdit: (record: RiskIssue) => void
}) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const visible = records.filter(record => {
    const text = `${record.title} ${record.owner} ${record.description} ${record.responsePlan} ${record.solution}`
      .toLocaleLowerCase()
    return text.includes(query.trim().toLocaleLowerCase())
      && (type === 'all' || record.type === type)
      && (status === 'all' || record.status === status)
  })
  return <>
    <TableToolbar query={query} setQuery={setQuery} primaryLabel="添加记录" onCreate={onCreate}>
      <label className="pm-toolbar-select">
        <ShieldAlert size={14}/>
        <select value={type} onChange={event => setType(event.currentTarget.value)} aria-label="筛选记录类型">
          <option value="all">全部类型</option>
          <option value="risk">风险</option>
          <option value="issue">问题</option>
        </select>
      </label>
      <label className="pm-toolbar-select">
        <Filter size={14}/>
        <select value={status} onChange={event => setStatus(event.currentTarget.value)} aria-label="筛选风险问题状态">
          <option value="all">全部状态</option>
          {Object.entries(riskIssueStatus).map(([value, label]) =>
            <option key={value} value={value}>{label}</option>,
          )}
        </select>
      </label>
    </TableToolbar>
    <div className="pm-table-frame">
      <div className="pm-table-scroll">
        <table className="pm-data-table pm-risk-table">
          <thead>
            <tr>
              <th>类型</th>
              <th className="pm-col-title">标题</th>
              <th>状态</th>
              <th>概率</th>
              <th>影响</th>
              <th>负责人</th>
              <th>截止日期</th>
              <th>应对 / 解决方案</th>
              <th className="pm-col-actions"/>
            </tr>
          </thead>
          <tbody>
            {visible.map(record => <tr className="pm-record-row" key={record.id}>
              <td><span className="pm-type-tag" data-value={record.type}>{riskIssueType[record.type]}</span></td>
              <td className="pm-col-title">
                <button className="pm-title-cell" onClick={() => onEdit(record)}>{record.title}</button>
              </td>
              <td><StatusTag kind="risk-issue" value={record.status}/></td>
              <td>{record.probability
                ? <span className="pm-cell-value">{probabilityLabels[record.probability]}</span>
                : <span className="pm-cell-empty">-</span>}</td>
              <td><span className="pm-impact-tag" data-value={record.impact}>{impactLabels[record.impact]}</span></td>
              <td>{record.owner
                ? <span className="pm-person"><span>{record.owner.slice(0, 1)}</span>{record.owner}</span>
                : <span className="pm-cell-empty">未指定</span>}</td>
              <td>{record.dueDate || <span className="pm-cell-empty">-</span>}</td>
              <td className="pm-description-cell">
                {record.type === 'risk'
                  ? record.responsePlan || <span className="pm-cell-empty">暂无应对措施</span>
                  : record.solution || <span className="pm-cell-empty">暂无解决方案</span>}
              </td>
              <td className="pm-col-actions">
                <button
                  className="pm-row-button"
                  disabled={disabled}
                  aria-label={`编辑 ${record.title}`}
                  onClick={() => onEdit(record)}
                ><Pencil size={14}/></button>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {!visible.length && <TableEmpty text={records.length ? '没有符合筛选条件的风险或问题' : '暂无风险或问题记录'}/>}
      <button className="pm-add-row" onClick={onCreate}><Plus size={14}/>添加记录</button>
    </div>
    <div className="pm-table-footer">{visible.length} 条记录</div>
  </>
}

function MeetingTable({
  meetings,
  onCreate,
  onEdit,
}: {
  meetings: Meeting[]
  onCreate: () => void
  onEdit: (meeting: Meeting) => void
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const visible = meetings.filter(meeting => {
    const text = `${meeting.title} ${meeting.summary} ${meeting.facilitator} ${meeting.participants.join(' ')}`
      .toLocaleLowerCase()
    return text.includes(query.trim().toLocaleLowerCase())
      && (status === 'all' || meeting.status === status)
  })
  return <>
    <TableToolbar query={query} setQuery={setQuery} primaryLabel="新增会议" onCreate={onCreate}>
      <label className="pm-toolbar-select">
        <Filter size={14}/>
        <select value={status} onChange={event => setStatus(event.currentTarget.value)} aria-label="筛选会议状态">
          <option value="all">全部状态</option>
          {Object.entries(meetingStatus).map(([value, label]) =>
            <option key={value} value={value}>{label}</option>,
          )}
        </select>
      </label>
    </TableToolbar>
    <div className="pm-table-frame">
      <div className="pm-table-scroll">
        <table className="pm-data-table pm-meeting-table">
          <thead><tr>
            <th>会议日期</th><th className="pm-col-title">标题</th><th>状态</th><th>主持人</th>
            <th>参会人数</th><th>行动项</th><th>摘要</th><th className="pm-col-actions"/>
          </tr></thead>
          <tbody>
            {visible.map(meeting => {
              const done = meeting.actions.filter(action => action.status === 'done').length
              const promoted = meeting.actions.filter(action => action.taskId).length
              return <tr
                className="pm-record-row pm-meeting-row"
                key={meeting.id}
                data-id={meeting.id}
                onClick={() => onEdit(meeting)}
              >
                <td>{meeting.meetingDate}{meeting.startTime ? ` ${meeting.startTime}` : ''}</td>
                <td className="pm-col-title"><button className="pm-title-cell" onClick={event => { event.stopPropagation(); onEdit(meeting) }}>{meeting.title}</button></td>
                <td><StatusTag kind="meeting" value={meeting.status}/></td>
                <td>{meeting.facilitator || <span className="pm-cell-empty">未指定</span>}</td>
                <td>{meeting.participants.length}</td>
                <td title={`已转任务 ${promoted} / 共 ${meeting.actions.length} 个行动项`}>{done}/{meeting.actions.length}</td>
                <td className="pm-description-cell">{meeting.summary || <span className="pm-cell-empty">暂无摘要</span>}</td>
                <td className="pm-col-actions">
                  <button className="pm-row-button" aria-label={`编辑 ${meeting.title}`} onClick={event => { event.stopPropagation(); onEdit(meeting) }}><Pencil size={14}/></button>
                  <button
                    className="pm-meeting-detail-btn pm-row-button"
                    data-id={meeting.id}
                    aria-label={`查看 ${meeting.title} 详情`}
                    title="查看详情/转任务"
                    onClick={event => { event.stopPropagation(); onEdit(meeting) }}
                  ><ChevronRight size={14}/></button>
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
      {!visible.length && <TableEmpty text={meetings.length ? '没有符合筛选条件的会议' : '暂无会议纪要'}/>}
      <button className="pm-add-row" onClick={onCreate}><Plus size={14}/>新增会议</button>
    </div>
    <div className="pm-table-footer">{visible.length} 条记录</div>
  </>
}

function ProgressReportTable({
  reports,
  onCreate,
  onEdit,
}: {
  reports: ProgressReport[]
  onCreate: () => void
  onEdit: (report: ProgressReport) => void
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const visible = reports.filter(report =>
    `${report.title} ${report.executiveSummary}`.toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase())
    && (status === 'all' || report.status === status))
  return <>
    <TableToolbar query={query} setQuery={setQuery} primaryLabel="生成快照" onCreate={onCreate}>
      <label className="pm-toolbar-select">
        <Filter size={14}/>
        <select value={status} onChange={event => setStatus(event.currentTarget.value)} aria-label="筛选汇报状态">
          <option value="all">全部状态</option>
          {Object.entries(progressReportStatus).map(([value, label]) =>
            <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
    </TableToolbar>
    <div className="pm-table-frame">
      <div className="pm-table-scroll">
        <table className="pm-data-table pm-report-table">
          <thead><tr>
            <th>汇报周期</th><th className="pm-col-title">标题</th><th>状态</th>
            <th>任务进度</th><th>里程碑</th><th>异常项</th><th>快照时间</th><th className="pm-col-actions"/>
          </tr></thead>
          <tbody>{visible.map(report => <tr className="pm-record-row" key={report.id}>
            <td>{report.periodStart} 至 {report.periodEnd}</td>
            <td className="pm-col-title"><button className="pm-title-cell" onClick={() => onEdit(report)}>{report.title}</button></td>
            <td><StatusTag kind="report" value={report.status}/></td>
            <td><Progress value={report.snapshot.tasks.averageProgress}/></td>
            <td>{report.snapshot.milestones.achieved}/{report.snapshot.milestones.total}</td>
            <td><span className="pm-exception-count" data-alert={report.snapshot.exceptions.length > 0}>{report.snapshot.exceptions.length}</span></td>
            <td>{report.snapshotAt.slice(0, 10)}</td>
            <td className="pm-col-actions"><button className="pm-row-button" aria-label={`编辑 ${report.title}`} onClick={() => onEdit(report)}><Pencil size={14}/></button></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!visible.length && <TableEmpty text={reports.length ? '没有符合筛选条件的进度汇报' : '暂无进度汇报'}/>}
      <button className="pm-add-row" onClick={onCreate}><Plus size={14}/>生成快照</button>
    </div>
    <div className="pm-table-footer">{visible.length} 条记录</div>
  </>
}

function DeliverableTable({
  deliverables,
  onCreate,
  onEdit,
}: {
  deliverables: Deliverable[]
  onCreate: () => void
  onEdit: (deliverable: Deliverable) => void
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const visible = deliverables.filter(item => {
    const text = `${item.name} ${item.version} ${item.owner} ${item.location} ${item.description}`
      .toLocaleLowerCase()
    return text.includes(query.trim().toLocaleLowerCase())
      && (status === 'all' || item.status === status)
  })
  return <>
    <TableToolbar query={query} setQuery={setQuery} primaryLabel="新增交付物" onCreate={onCreate}>
      <label className="pm-toolbar-select">
        <Filter size={14}/>
        <select value={status} onChange={event => setStatus(event.currentTarget.value)} aria-label="筛选交付物状态">
          <option value="all">全部状态</option>
          {Object.entries(deliverableStatus).map(([value, label]) =>
            <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
    </TableToolbar>
    <div className="pm-table-frame">
      <div className="pm-table-scroll">
        <table className="pm-data-table pm-deliverable-table">
          <thead><tr>
            <th className="pm-col-title">交付物名称</th><th>版本</th><th>状态</th>
            <th>负责人</th><th>计划交付日期</th><th>位置</th><th>变更次数</th><th className="pm-col-actions"/>
          </tr></thead>
          <tbody>{visible.map(item => <tr className="pm-record-row" key={item.id}>
            <td className="pm-col-title"><button className="pm-title-cell" onClick={() => onEdit(item)}>{item.name}</button></td>
            <td>{item.version
              ? <span className="pm-cell-value">{item.version}</span>
              : <span className="pm-cell-empty">-</span>}</td>
            <td><StatusTag kind="deliverable" value={item.status}/></td>
            <td>{item.owner
              ? <span className="pm-person"><span>{item.owner.slice(0, 1)}</span>{item.owner}</span>
              : <span className="pm-cell-empty">未指定</span>}</td>
            <td>{item.dueDate || <span className="pm-cell-empty">-</span>}</td>
            <td className="pm-description-cell">{item.location || <span className="pm-cell-empty">未登记位置</span>}</td>
            <td>{item.history.length}</td>
            <td className="pm-col-actions"><button className="pm-row-button" aria-label={`编辑 ${item.name}`} onClick={() => onEdit(item)}><Pencil size={14}/></button></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!visible.length && <TableEmpty text={deliverables.length ? '没有符合筛选条件的交付物' : '暂无交付物台账'}/>}
      <button className="pm-add-row" onClick={onCreate}><Plus size={14}/>新增交付物</button>
    </div>
    <div className="pm-table-footer">{visible.length} 条记录</div>
  </>
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

function PriorityTag({ value }: { value: string }) {
  return <span className="pm-priority-tag" data-value={value}><i/>{value}</span>
}

function Progress({ value }: { value: number }) {
  return <span className="pm-progress-cell">
    <span><i style={{ width: `${value}%` }}/></span>
    <b>{value}%</b>
  </span>
}

function TableEmpty({ text, action }: { text: string, action?: React.ReactNode }) {
  return <div className="pm-table-empty"><ListTree size={24}/><span>{text}</span>{action}</div>
}

function Overview({
  project,
  tasks,
  milestones,
  riskIssues,
}: {
  project: Project
  tasks: Task[]
  milestones: Milestone[]
  riskIssues: RiskIssue[]
}) {
  const complete = tasks.filter(task => task.status === 'done').length
  const overdue = tasks.filter(task => task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== 'done').length
  const active = tasks.filter(task => task.status === 'in_progress').length
  const achieved = milestones.filter(item => item.status === 'achieved').length
  const days = Math.ceil((new Date(`${project.targetDate}T00:00:00`).getTime() - Date.now()) / 86_400_000)
  const today = new Date().toISOString().slice(0, 10)
  const kpi = computeKPI(tasks, milestones, riskIssues, today)
  const agenda = buildAgenda(tasks, milestones, today)
  const matrix = groupRiskMatrix(riskIssues)
  return <div className="pm-overview pm-war-room">
    <div className="pm-summary-grid">
      <Summary label="总任务数" value={tasks.length} note={`${active} 项进行中`}/>
      <Summary label="已完成" value={complete} note={`${tasks.length ? Math.round(complete / tasks.length * 100) : 0}% 完成率`}/>
      <Summary label="已延期" value={overdue} note={overdue ? '需要优先处理' : '当前无延期'} tone={overdue ? 'danger' : undefined}/>
      <Summary label="里程碑" value={`${achieved}/${milestones.length}`} note={`${Math.max(days, 0)} 天后到期`}/>
    </div>
    <div className="pm-overview-section">
      <h2>任务状态分布</h2>
      <div className="pm-status-distribution">
        {Object.keys(taskStatus).map(value => {
          const count = tasks.filter(task => task.status === value).length
          const width = tasks.length ? Math.max(3, count / tasks.length * 100) : 0
          return <div key={value}>
            <span><StatusTag kind="task" value={value}/><b>{count}</b></span>
            <div><i data-status={value} style={{ width: `${width}%` }}/></div>
          </div>
        })}
      </div>
    </div>
    {/* PROD-05：关键指标条 */}
    <div className="pm-kpi-row">
      <span className="pm-kpi" data-kpi="total"><b>{kpi.total}</b>任务</span>
      <span className="pm-kpi" data-kpi="doneRate"><b>{kpi.doneRate}%</b>完成率</span>
      <span className="pm-kpi" data-kpi="inProgress"><b>{kpi.inProgress}</b>进行中</span>
      <span className="pm-kpi" data-kpi="overdue" data-tone="danger"><b>{kpi.overdueTasks}</b>逾期</span>
      <span className="pm-kpi" data-kpi="upcoming"><b>{kpi.upcomingMilestones}</b>近期里程碑</span>
      <span className="pm-kpi" data-kpi="openRisk"><b>{kpi.openRisks}</b>未闭环风险</span>
    </div>
    {/* PROD-05：近期议程时间线 */}
    <div className="pm-overview-section pm-agenda">
      <h2>接下来的日程</h2>
      {agenda.length
        ? <ol>{agenda.map(a =>
            <li key={`${a.kind}-${a.id}`} className={a.overdue ? 'pm-agenda-item pm-agenda-overdue' : 'pm-agenda-item'}>
              {a.overdue ? `逾期 ${-a.days} 天` : `${a.days} 天后`} · {a.label}
            </li>)}</ol>
        : <p className="pm-cell-empty">未来 7 天内无到期事项。</p>}
    </div>
    {/* PROD-05：风险矩阵（概率×影响） */}
    <div className="pm-overview-section pm-risk-matrix">
      <h2>风险矩阵（概率 × 影响）</h2>
      <div className="pm-matrix-grid">
        {(['high', 'medium', 'low'] as const).map(row =>
          (['high', 'medium', 'low'] as const).map(col => {
            const list = matrix[`${row}/${col}`] ?? []
            return <div key={`${row}-${col}`}
              className={`pm-risk-cell ${row === 'high' && col === 'high' ? 'pm-risk-cell-critical' : ''}`}
              data-risk-cell={`${row}/${col}`}>
              <span className="pm-risk-cell-head">{row}×{col}</span>
              {list.map(r => <span key={r.id} className="pm-risk-cell-tag" data-risk-id={r.id} title={r.title}>{r.title}</span>)}
              {!list.length && <span className="pm-cell-empty">0</span>}
            </div>
          }))}
      </div>
    </div>
  </div>
}

/** PROD-20 AI 项目副驾 MVP：提问→只读诊断；写动作渲染草稿卡，确认才落库。 */
function CopilotPanel({ projectId, taskIds, baselineMap, execute, run, disabled, onSaved }: {
  projectId: string
  taskIds: string[]
  baselineMap: Record<string, string>
  execute: (line: string) => Promise<string>
  run: (line: string) => Promise<boolean>
  disabled: boolean
  onSaved: () => void
}) {
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<{ role: string, text: string }[]>([{ role: 'sys', text: '向副驾提问（只读诊断）；若建议改动，会先给操作草稿卡，确认才落库。' }])
  const [draft, setDraft] = useState<{ accepted: ReturnType<typeof validateActions>['accepted'], rejected: ReturnType<typeof validateActions>['rejected'] } | null>(null)
  const send = async () => {
    const q = input.trim(); if (!q || disabled) return
    setInput(''); setMsgs(m => [...m, { role: 'me', text: q }])
    try {
      const isFixture = q === 'fixture' // 仅精确触发测试缝；普通用户 fixture 开头的原问题原样走真实 ask
      const text = await execute(`ask ${projectId} ${isFixture ? 'fixture' : ''} ${isFixture ? '' : JSON.stringify(q)}`.trim())
      setMsgs(m => [...m, { role: 'ai', text }])
      const acts = parseCopilotActions(text)
      const v = validateActions(acts, { taskIds })
      if (v.accepted.length || v.rejected.length) setDraft({ accepted: v.accepted, rejected: v.rejected })
    } catch (e) { setMsgs(m => [...m, { role: 'ai', text: `副驾暂不可用：${e instanceof Error ? e.message : String(e)}` }]) }
  }
  const [busy, setBusy] = useState(false)
  const confirm = async () => {
    if (!draft || busy) return
    setBusy(true)
    // 走后端 ask-apply：服务器重读当前项目、校验归属/字段/真实日期，按基线 updatedAt 做冲突比较，
    // 并对同一份草稿做服务端幂等；前端不再直接循环 task update。
    try {
      const line = `ask-apply ${projectId} ${JSON.stringify(draft.accepted)} --base ${JSON.stringify(baselineMap)}`
      const res = await execute(line)
      setMsgs(m => [...m, { role: 'sys', text: res }])
      setDraft(null); onSaved()
    } catch (e) {
      setMsgs(m => [...m, { role: 'ai', text: `执行失败：${e instanceof Error ? e.message : String(e)}` }])
    } finally { setBusy(false) }
  }
  return <div className="pm-copilot">
    <div className="pm-copilot-messages">
      {msgs.map((m, i) => <div key={i} className={`pm-copilot-msg pm-copilot-${m.role}`}>{m.text}</div>)}
    </div>
    {draft && (
      <div className="pm-copilot-draft">
        <strong>操作草稿（将影响 {draft.accepted.length} 条，需确认）</strong>
        {draft.accepted.map((a, i) => <div key={i}>· {a.op} {a.id} → {JSON.stringify(a.patch)}</div>)}
        {draft.rejected.map((r, i) => <div key={`r${i}`} className="pm-copilot-rejected">已拒绝：{r.reason}</div>)}
        <div className="pm-copilot-actions">
          <button className="pm-button pm-copilot-confirm" disabled={busy} onClick={() => void confirm()}>确认执行</button>
          <button className="pm-button pm-copilot-dismiss" onClick={() => setDraft(null)}>再聊聊/取消</button>
        </div>
      </div>
    )}
    <div className="pm-copilot-inputrow">
      <input className="pm-copilot-input" value={input} placeholder="例如：下周会不会延期？"
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') void send() }}/>
      <button className="pm-button pm-copilot-send" disabled={disabled || !input.trim()} onClick={() => void send()}>发送</button>
    </div>
  </div>
}

/** PROD-22 方案A：甘特排期（只读条 + 拖拽平移改期）。 */
function GanttView({ tasks, milestones, run, onSaved }: {
  tasks: Task[]
  milestones: Milestone[]
  run: (line: string) => Promise<boolean>
  onSaved: () => void
}) {
  const axis = dateRange([...tasks, ...milestones])
  const today = new Date().toISOString().slice(0, 10)
  if (!axis) return <p className="pm-cell-empty pm-gantt">暂无带起止日期的任务/里程碑，无法绘制时间轴。</p>
  const axisDays = Math.max(1, daysFrom(axis.end, axis.start) + 1)
  const PX = 16 // 每天像素
  const [dragOver, setDragOver] = useState('')
  const barRef = useRef<{ id: string, startX: number } | null>(null)
  const onPointerDownBar = (e: React.PointerEvent, task: Task) => {
    barRef.current = { id: task.id, startX: e.clientX }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerUpBar = async (e: React.PointerEvent, task: Task) => {
    const startX = barRef.current?.startX
    barRef.current = null
    if (startX === undefined || !task.startDate || !task.dueDate) return
    const deltaPx = e.clientX - startX
    if (Math.abs(deltaPx) < 4) return
    const next = shiftDatesByDrag(task.startDate, task.dueDate, deltaPx, PX)
    setDragOver(`${task.title} → ${next.startDate} ~ ${next.dueDate}`)
    const ok = await run(`task update ${task.id} ${JSON.stringify(next)}`)
    setDragOver(ok ? `已更新：${next.startDate} ~ ${next.dueDate}` : '更新失败，请重试')
    if (ok) onSaved()
  }
  return <div className="pm-gantt">
    <div className="pm-gantt-axis" style={{ width: `${axisDays * PX}px` }}>
      {Array.from({ length: axisDays }, (_, i) => {
        const d = new Date(Date.parse(axis.start) + i * 86_400_000).toISOString().slice(0, 10)
        return <span key={d} className="pm-gantt-tick" style={{ left: `${i * PX}px` }}>{d.slice(5)}</span>
      })}
      {(() => { const off = todayOffset(axis.start, today); return off >= 0 && off <= axisDays
        ? <div className="pm-gantt-today" style={{ left: `${off * PX + PX / 2}px` }}/> : null })()}
    </div>
    <div className="pm-gantt-rows">
      {tasks.filter(t => t.startDate && t.dueDate).map(t => {
        const g = barGeometry(t, axis.start, axisDays)
        if (!g) return null
        const done = t.status === 'done'
        return <div key={t.id} className="pm-gantt-row">
          <div
            className={`pm-gantt-bar ${done ? 'pm-gantt-bar-done' : ''}`}
            data-task-id={t.id}
            data-start={t.startDate}
            data-end={t.dueDate}
            style={{ left: `${g.leftDays * PX}px`, width: `${g.widthDays * PX}px` }}
            title={`${t.title}（${t.startDate} ~ ${t.dueDate}）拖动平移改期`}
            onPointerDown={(e) => onPointerDownBar(e, t)}
            onPointerUp={(e) => onPointerUpBar(e, t)}
          >{t.title}</div>
        </div>
      })}
      {milestones.filter(m => m.targetDate).map(m => {
        const off = daysFrom(m.targetDate!, axis.start)
        const done = m.status === 'achieved'
        return <div key={m.id} className="pm-gantt-row">
          <div className={`pm-gantt-milestone ${done ? 'pm-gantt-milestone-done' : ''}`}
            data-milestone-id={m.id} title={`里程碑 ${m.title}（${m.targetDate}）`}
            style={{ left: `${off * PX + PX / 2}px` }}/>
        </div>
      })}
    </div>
    <p className="pm-gantt-hint">{dragOver || '拖动任务条可整体平移起止日期（按天吸附）。'}</p>
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

function GlobalBoard({ data, onPickProject, onOpenRecord, onClose }: {
  data: Snapshot
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
      : <>
          <div className="pm-summary-grid">
            <Summary label="项目总数" value={data.projects.length} note={`${activeProjects} 个进行中`}/>
            <Summary label="任务完成率" value={`${completionRate}%`} note={`${doneTasks}/${totalTasks} 已完成`}/>
            <Summary label="逾期项" value={overdueTasks} note={overdueTasks ? '需要优先处理' : '当前无逾期任务'} tone={overdueTasks ? 'danger' : undefined}/>
            <Summary label="未关闭风险/问题" value={openRisks} note={`里程碑已达成 ${achieved}/${data.milestones.length}`}/>
          </div>
          <div className="pm-board-section">
            <h2>逐项目明细</h2>
            {data.projects.length
              ? <div className="pm-board-projects">
                  {data.projects.map(project => {
                    const tasks = data.tasks.filter(task => task.projectId === project.id)
                    const done = tasks.filter(task => task.status === 'done').length
                    const overdue = tasks.filter(task =>
                      task.dueDate && task.dueDate < today && task.status !== 'done').length
                    const milestones = data.milestones.filter(item => item.projectId === project.id)
                    const achievedCount = milestones.filter(item => item.status === 'achieved').length
                    const risks = data.riskIssues.filter(item =>
                      item.projectId === project.id && item.status !== 'closed').length
                    const deliverables = data.deliverables.filter(item => item.projectId === project.id)
                    return <button key={project.id} type="button" className="pm-board-project" onClick={() => onPickProject(project.id)}>
                      <span className="pm-board-project-name">{project.name}<StatusTag kind="project" value={project.status}/></span>
                      <span>任务 {done}/{tasks.length}</span>
                      <span>里程碑 {achievedCount}/{milestones.length}</span>
                      <span>未关闭风险 {risks}</span>
                      <span>交付物 {deliverables.length}</span>
                      {overdue > 0 && <span className="pm-board-overdue">⚠ 逾期 {overdue}</span>}
                    </button>
                  })}
                </div>
              : <p className="pm-board-note">暂无项目数据，先新建一个项目。</p>}
          </div>
        </>}
  </div>
}

function DrawerPanel({ title, onClose, children }: { title: string, onClose: () => void, children: ReactNode }) {
  const openerRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { ev.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])
  useEffect(() => () => {
    requestAnimationFrame(() => {
      const opener = openerRef.current
      const target = opener && document.contains(opener) ? opener : document.querySelector('.pm-row-active button, .pm-button-primary')
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

function Field({ label, children, wide }: { label: string, children: ReactNode, wide?: boolean }) {
  return <label className="pm-field" data-wide={wide || undefined}><span>{label}</span>{children}</label>
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
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = project
      ? {
          name: form.get('name'),
          description: form.get('description'),
          owner: form.get('owner'),
          status: form.get('status'),
          startDate: form.get('startDate'),
          targetDate: form.get('targetDate'),
        }
      : {
          name: form.get('name'),
          description: form.get('description'),
          owner: form.get('owner'),
          startDate: form.get('startDate'),
          targetDate: form.get('targetDate'),
        }
    const success = await run(project
      ? `project update ${project.id} ${JSON.stringify(payload)}`
      : `project add ${JSON.stringify(payload)}`)
    if (success) onSaved()
  }
  return <form className="pm-drawer-form" onSubmit={event => void submit(event)}>
    <Field label="项目名称" wide><input name="name" defaultValue={project?.name} required autoFocus/></Field>
    <Field label="项目描述" wide><textarea name="description" defaultValue={project?.description} rows={4}/></Field>
    <Field label="负责人"><input name="owner" defaultValue={project?.owner}/></Field>
    {project && <Field label="项目状态"><select name="status" defaultValue={project.status}>
      {Object.entries(projectStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></Field>}
    <Field label="开始日期"><input name="startDate" type="date" required defaultValue={project?.startDate}/></Field>
    <Field label="目标日期"><input name="targetDate" type="date" required defaultValue={project?.targetDate}/></Field>
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
  disabled,
  run,
  onSaved,
}: {
  projectId: string
  task?: Task
  tasks: Task[]
  milestones: Milestone[]
  disabled: boolean
  run: (line: string) => Promise<boolean>
  onSaved: () => void
}) {
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const parentId = String(form.get('parentId') ?? '')
    const milestoneId = String(form.get('milestoneId') ?? '')
    const startDate = String(form.get('startDate') ?? '')
    const dueDate = String(form.get('dueDate') ?? '')
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
    }
    const success = await run(task
      ? `task update ${task.id} ${JSON.stringify(payload)}`
      : `task add ${JSON.stringify(createPayload)}`)
    if (success) onSaved()
  }
  return <form className="pm-drawer-form" onSubmit={event => void submit(event)}>
    <Field label="任务名称" wide><input name="title" defaultValue={task?.title} required autoFocus/></Field>
    <Field label="任务说明" wide><textarea name="description" defaultValue={task?.description} rows={4}/></Field>
    {!task && <Field label="父任务"><select name="parentId" defaultValue="">
      <option value="">根任务</option>
      {tasks.map(item => <option key={item.id} value={item.id}>{item.code} {item.title}</option>)}
    </select></Field>}
    <Field label="状态"><select name="status" defaultValue={task?.status ?? 'todo'}>
      {Object.entries(taskStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></Field>
    <Field label="优先级"><select name="priority" defaultValue={task?.priority ?? 'P1'}>
      <option value="P0">P0 - 高优</option>
      <option value="P1">P1 - 一般</option>
      <option value="P2">P2 - 较低</option>
    </select></Field>
    <Field label="执行人"><input name="assignee" defaultValue={task?.assignee}/></Field>
    <Field label="开始日期"><input name="startDate" type="date" defaultValue={task?.startDate}/></Field>
    <Field label="截止日期"><input name="dueDate" type="date" defaultValue={task?.dueDate}/></Field>
    <Field label="完成进度"><input name="progress" type="number" min="0" max="100" defaultValue={task?.progress ?? 0}/></Field>
    <Field label="关联里程碑" wide><select name="milestoneId" defaultValue={task?.milestoneId ?? ''}>
      <option value="">不关联</option>
      {milestones.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
    </select></Field>
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
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const status = String(form.get('status'))
    const payload = {
      title: form.get('title'),
      description: form.get('description'),
      targetDate: form.get('targetDate'),
      status,
      achievedDate: status === 'achieved' ? form.get('achievedDate') || new Date().toISOString().slice(0, 10) : null,
    }
    const success = await run(milestone
      ? `milestone update ${milestone.id} ${JSON.stringify(payload)}`
      : `milestone add ${JSON.stringify({ projectId, ...payload })}`)
    if (success) onSaved()
  }
  return <form className="pm-drawer-form" onSubmit={event => void submit(event)}>
    <Field label="里程碑名称" wide><input name="title" defaultValue={milestone?.title} required autoFocus/></Field>
    <Field label="说明 / 达成标准" wide><textarea name="description" defaultValue={milestone?.description} rows={5}/></Field>
    <Field label="状态"><select name="status" defaultValue={milestone?.status ?? 'planned'}>
      {Object.entries(milestoneStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></Field>
    <Field label="目标日期"><input name="targetDate" type="date" required defaultValue={milestone?.targetDate}/></Field>
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
        : <button
            className="pm-action-promote pm-row-button"
            type="button"
            data-meeting={meeting.id}
            data-action={action.id}
            disabled={disabled}
            title="把行动项转为项目任务"
            aria-label={`转任务 ${action.title}`}
            onClick={() => {
              if (window.confirm(`把行动项「${action.title}」转为项目任务？（负责人/截止日一并带入）`)) {
                void run(`meeting action promote ${meeting.id} ${action.id} confirm`).then(success => success && onSaved())
              }
            }}
          ><ListTree size={14}/></button>}
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
        <div><dt>任务进度</dt><dd>{report.snapshot.tasks.averageProgress}%（{report.snapshot.tasks.done}/{report.snapshot.tasks.total} 完成）</dd></div>
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
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const dueDate = String(form.get('dueDate') ?? '')
    const changeNote = String(form.get('changeNote') ?? '').trim()
    const common = {
      name: form.get('name'),
      version: String(form.get('version') ?? '').trim(),
      owner: form.get('owner'),
      status: form.get('status'),
      location: form.get('location'),
      description: form.get('description'),
      dueDate: dueDate || null,
      ...(changeNote ? { changeNote } : {}),
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

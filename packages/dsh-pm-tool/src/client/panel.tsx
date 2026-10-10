import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.mjs'
import Check from 'lucide-react/dist/esm/icons/check.mjs'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.mjs'
import Filter from 'lucide-react/dist/esm/icons/filter.mjs'
import FolderKanban from 'lucide-react/dist/esm/icons/folder-kanban.mjs'
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard.mjs'
import ListFilter from 'lucide-react/dist/esm/icons/list-filter.mjs'
import ListTree from 'lucide-react/dist/esm/icons/list-tree.mjs'
import MilestoneIcon from 'lucide-react/dist/esm/icons/milestone.mjs'
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs'
import Plus from 'lucide-react/dist/esm/icons/plus.mjs'
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw.mjs'
import Search from 'lucide-react/dist/esm/icons/search.mjs'
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert.mjs'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs'
import UserRound from 'lucide-react/dist/esm/icons/user-round.mjs'
import X from 'lucide-react/dist/esm/icons/x.mjs'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
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

type Snapshot = {
  projects: Project[]
  tasks: Task[]
  milestones: Milestone[]
  riskIssues: RiskIssue[]
}
type View = 'tasks' | 'milestones' | 'risk-issues' | 'overview'
type Drawer =
  | { kind: 'project-create' }
  | { kind: 'project-edit', project: Project }
  | { kind: 'task', task?: Task }
  | { kind: 'milestone', milestone?: Milestone }
  | { kind: 'risk-issue', record?: RiskIssue }

export interface PmPanelApi {
  execute(line: string): Promise<string>
}

const empty: Snapshot = { projects: [], tasks: [], milestones: [], riskIssues: [] }
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

export function PmPanel({ execute }: PmPanelApi) {
  const [data, setData] = useState<Snapshot>(empty)
  const [selected, setSelected] = useState<string>()
  const [view, setView] = useState<View>('tasks')
  const [drawer, setDrawer] = useState<Drawer>()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = async () => {
    setBusy(true)
    try {
      const next = JSON.parse(await execute('web snapshot')) as Snapshot
      setData(next)
      setSelected(current =>
        current && next.projects.some(project => project.id === current)
          ? current
          : next.projects[0]?.id,
      )
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

  return <>
    <style>{styles}</style>
    <main className="pm-shell">
      {message && <Notice message={message} onClose={() => setMessage('')}/>}
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
          <button className="pm-button" onClick={() => setDrawer({ kind: 'project-create' })}>
            <Plus size={15}/>新建项目
          </button>
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

      {!project
        ? <EmptyWorkspace onCreate={() => setDrawer({ kind: 'project-create' })}/>
        : <>
            <ProjectBar
              project={project}
              tasks={tasks}
              milestones={milestones}
              riskIssues={riskIssues}
              onEdit={() => setDrawer({ kind: 'project-edit', project })}
            />
            <nav className="pm-view-tabs" aria-label="项目视图" role="tablist">
              <ViewTab active={view === 'tasks'} icon={<ListTree size={15}/>} count={tasks.length} onClick={() => setView('tasks')}>
                全部任务
              </ViewTab>
              <ViewTab active={view === 'milestones'} icon={<MilestoneIcon size={15}/>} count={milestones.length} onClick={() => setView('milestones')}>
                里程碑
              </ViewTab>
              <ViewTab active={view === 'risk-issues'} icon={<ShieldAlert size={15}/>} count={riskIssues.length} onClick={() => setView('risk-issues')}>
                风险与问题
              </ViewTab>
              <ViewTab active={view === 'overview'} icon={<LayoutDashboard size={15}/>} onClick={() => setView('overview')}>
                项目概览
              </ViewTab>
            </nav>
            <section className="pm-view" role="tabpanel">
              {view === 'tasks' && <TaskTable
                tasks={tasks}
                milestones={milestones}
                disabled={busy}
                onCreate={() => setDrawer({ kind: 'task' })}
                onEdit={task => setDrawer({ kind: 'task', task })}
                run={run}
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
              {view === 'overview' && <Overview project={project} tasks={tasks} milestones={milestones}/>}
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
      </DrawerPanel>}
    </main>
  </>
}

function drawerTitle(drawer: Drawer): string {
  if (drawer.kind === 'project-create') return '新建项目'
  if (drawer.kind === 'project-edit') return '编辑项目'
  if (drawer.kind === 'task') return drawer.task ? '编辑任务' : '新增任务'
  if (drawer.kind === 'milestone') return drawer.milestone ? '编辑里程碑' : '新增里程碑'
  return drawer.record ? '编辑风险或问题' : '新增风险或问题'
}

function Notice({ message, onClose }: { message: string, onClose: () => void }) {
  return <div className="pm-notice" role="status">
    <Check size={15}/>
    <span>{message.split('\n')[0]}</span>
    <button className="pm-plain-icon" aria-label="关闭通知" onClick={onClose}><X size={14}/></button>
  </div>
}

function EmptyWorkspace({ onCreate }: { onCreate: () => void }) {
  return <div className="pm-empty-workspace">
    <FolderKanban size={38} strokeWidth={1.4}/>
    <strong>建立第一个项目</strong>
    <p>创建项目后即可拆分任务与里程碑。</p>
    <button className="pm-button pm-button-primary" onClick={onCreate}><Plus size={15}/>新建项目</button>
  </div>
}

function ProjectBar({
  project,
  tasks,
  milestones,
  riskIssues,
  onEdit,
}: {
  project: Project
  tasks: Task[]
  milestones: Milestone[]
  riskIssues: RiskIssue[]
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
  run,
}: {
  tasks: Task[]
  milestones: Milestone[]
  disabled: boolean
  onCreate: () => void
  onEdit: (task: Task) => void
  run: (line: string) => Promise<boolean>
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [grouped, setGrouped] = useState(true)
  const visible = tasks.filter(task => {
    const matchesText = `${task.code} ${task.title} ${task.assignee}`.toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase())
    return matchesText && (status === 'all' || task.status === status)
  })
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
      <button className="pm-tool-button" aria-pressed={grouped} onClick={() => setGrouped(value => !value)}>
        <ListFilter size={14}/>按状态分组
      </button>
    </TableToolbar>

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
            {groups.map(group => <TaskGroup
              key={group.key}
              group={group}
              milestones={milestones}
              disabled={disabled}
              onEdit={onEdit}
              run={run}
            />)}
          </tbody>
        </table>
      </div>
      {!visible.length && <TableEmpty text={tasks.length ? '没有符合筛选条件的任务' : '暂无任务记录'}/>}
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
}: {
  group: { key: string, label: string, rows: Task[] }
  milestones: Milestone[]
  disabled: boolean
  onEdit: (task: Task) => void
  run: (line: string) => Promise<boolean>
}) {
  return <>
    <tr className="pm-group-row">
      <td colSpan={11}><ChevronDown size={14}/><StatusTag kind="task" value={group.key}/><span>{group.rows.length} 条记录</span></td>
    </tr>
    {group.rows.map(task => {
      const milestone = milestones.find(item => item.id === task.milestoneId)
      const depth = Math.max(0, task.code.split('.').length - 1)
      return <tr className="pm-record-row" key={task.id}>
        <td className="pm-col-check">
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
          <button
            className="pm-title-cell"
            data-done={task.status === 'done'}
            style={{ paddingLeft: `${depth * 16}px` }}
            onClick={() => onEdit(task)}
          >{task.title}</button>
        </td>
        <td><StatusTag kind="task" value={task.status}/></td>
        <td><PriorityTag value={task.priority}/></td>
        <td>{task.assignee
          ? <span className="pm-person"><span>{task.assignee.slice(0, 1)}</span>{task.assignee}</span>
          : <span className="pm-cell-empty">未指定</span>}</td>
        <td><Progress value={task.progress}/></td>
        <td>{task.startDate || <span className="pm-cell-empty">-</span>}</td>
        <td>{task.dueDate || <span className="pm-cell-empty">-</span>}</td>
        <td>{milestone
          ? <span className="pm-reference">{milestone.title}</span>
          : <span className="pm-cell-empty">-</span>}</td>
        <td className="pm-col-actions">
          <button className="pm-row-button" aria-label={`编辑 ${task.title}`} onClick={() => onEdit(task)}>
            <Pencil size={14}/>
          </button>
        </td>
      </tr>
    })}
  </>
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

function StatusTag({ kind, value }: { kind: 'project' | 'task' | 'milestone' | 'risk-issue', value: string }) {
  const labels = kind === 'project'
    ? projectStatus
    : kind === 'task'
      ? taskStatus
      : kind === 'milestone'
        ? milestoneStatus
        : riskIssueStatus
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

function TableEmpty({ text }: { text: string }) {
  return <div className="pm-table-empty"><ListTree size={24}/><span>{text}</span></div>
}

function Overview({
  project,
  tasks,
  milestones,
}: {
  project: Project
  tasks: Task[]
  milestones: Milestone[]
}) {
  const complete = tasks.filter(task => task.status === 'done').length
  const overdue = tasks.filter(task => task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== 'done').length
  const active = tasks.filter(task => task.status === 'in_progress').length
  const achieved = milestones.filter(item => item.status === 'achieved').length
  const days = Math.ceil((new Date(`${project.targetDate}T00:00:00`).getTime() - Date.now()) / 86_400_000)
  return <div className="pm-overview">
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
  </div>
}

function Summary({ label, value, note, tone }: { label: string, value: string | number, note: string, tone?: string }) {
  return <section className="pm-summary" data-tone={tone}>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
  </section>
}

function DrawerPanel({ title, onClose, children }: { title: string, onClose: () => void, children: ReactNode }) {
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
          if (window.confirm(`删除任务 ${task.title}？`)) {
            void run(`task delete ${task.id} confirm`).then(success => success && onSaved())
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

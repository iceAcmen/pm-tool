import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'

type Project = { id: string, name: string, description: string, owner: string, status: string, startDate: string, targetDate: string }
type Task = { id: string, projectId: string, parentId: string | null, code: string, title: string, assignee: string, status: string, priority: string, progress: number }
type Milestone = { id: string, projectId: string, title: string, targetDate: string, status: string, achievedDate: string | null }
type Snapshot = { projects: Project[], tasks: Task[], milestones: Milestone[] }

export interface PmPanelApi {
  execute(line: string): Promise<string>
}

const empty: Snapshot = { projects: [], tasks: [], milestones: [] }
const input: CSSProperties = { border: '1px solid #d6d9de', borderRadius: 6, padding: '8px 10px', background: '#fff', color: '#202124', font: 'inherit', minWidth: 0 }
const button: CSSProperties = { border: '1px solid #c9cdd4', borderRadius: 6, padding: '7px 11px', background: '#fff', color: '#202124', cursor: 'pointer', font: 'inherit' }
const primary: CSSProperties = { ...button, color: '#fff', background: '#1769e0', borderColor: '#1769e0' }

export function PmPanel({ execute }: PmPanelApi) {
  const [data, setData] = useState<Snapshot>(empty)
  const [selected, setSelected] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = async () => {
    setBusy(true)
    try {
      const next = JSON.parse(await execute('web snapshot')) as Snapshot
      setData(next)
      setSelected(current => current && next.projects.some(project => project.id === current) ? current : next.projects[0]?.id)
      setMessage('')
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
      setBusy(false)
    }
  }
  const project = data.projects.find(item => item.id === selected)
  const tasks = useMemo(() => data.tasks.filter(item => item.projectId === selected)
    .sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true })), [data.tasks, selected])
  const milestones = useMemo(() => data.milestones.filter(item => item.projectId === selected)
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate) || a.id.localeCompare(b.id)), [data.milestones, selected])

  return <main style={{ height: '100%', overflow: 'auto', background: '#f7f8fa', color: '#202124' }}>
    <header style={{ position: 'sticky', top: 0, zIndex: 2, padding: '18px 24px', borderBottom: '1px solid #e1e4e8', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>项目管理</h1>
      <span style={{ color: '#6b7280' }}>{data.projects.length} 个项目</span>
      <button style={{ ...button, marginLeft: 'auto' }} disabled={busy} onClick={() => void refresh()}>刷新</button>
    </header>
    {message && <div role="status" style={{ margin: '16px 24px 0', padding: 10, border: '1px solid #ccd7e5', borderRadius: 6, background: '#eef5ff', whiteSpace: 'pre-wrap' }}>{message}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))', gap: 20, padding: 24 }}>
      <aside>
        <ProjectCreate disabled={busy} run={run} />
        <div style={{ marginTop: 16, borderTop: '1px solid #ddd' }}>
          {data.projects.map(item => <button key={item.id} onClick={() => setSelected(item.id)}
            style={{ width: '100%', textAlign: 'left', padding: '12px 8px', border: 0, borderBottom: '1px solid #e5e7eb', background: item.id === selected ? '#eaf2ff' : 'transparent', color: '#202124', cursor: 'pointer' }}>
            <strong>{item.name}</strong><br/><small style={{ color: '#6b7280' }}>{item.id} · {item.owner || '未指定负责人'}</small>
          </button>)}
        </div>
      </aside>
      <section>
        {!project ? <div style={{ padding: 28, background: '#fff', border: '1px solid #e1e4e8', borderRadius: 8 }}>请先新建项目。</div>
          : <>
            <ProjectDetail key={project.id} project={project} disabled={busy} run={run} />
            <EntitySection title="WBS 任务" count={tasks.length}>
              <TaskCreate projectId={project.id} tasks={tasks} disabled={busy} run={run} />
              {tasks.map(task => <div key={task.id} style={{ marginLeft: `${Math.max(0, task.code.split('.').length - 1) * 22}px`, padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                <strong style={{ minWidth: 80 }}>{task.code} {task.title}</strong>
                <span style={{ color: '#6b7280' }}>{task.status} · {task.progress}%</span>
                <button style={{ ...button, marginLeft: 'auto' }} disabled={busy} onClick={() => void run(`task update ${task.id} ${JSON.stringify({ status: task.status === 'done' ? 'todo' : 'done', progress: task.status === 'done' ? 0 : 100 })}`)}>切换完成</button>
                <button style={button} disabled={busy} onClick={() => window.confirm(`删除任务 ${task.title}？`) && void run(`task delete ${task.id} confirm`)}>删除</button>
              </div>)}
            </EntitySection>
            <EntitySection title="里程碑" count={milestones.length}>
              <MilestoneCreate projectId={project.id} disabled={busy} run={run} />
              {milestones.map(item => <div key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                <time style={{ minWidth: 96 }}>{item.targetDate}</time><strong>{item.title}</strong><span style={{ color: '#6b7280' }}>{item.status}</span>
                <button style={{ ...button, marginLeft: 'auto' }} disabled={busy || item.status === 'achieved'} onClick={() => void run(`milestone update ${item.id} ${JSON.stringify({ status: 'achieved', achievedDate: new Date().toISOString().slice(0, 10) })}`)}>标记达成</button>
                <button style={button} disabled={busy} onClick={() => window.confirm(`删除里程碑 ${item.title}？`) && void run(`milestone delete ${item.id} confirm`)}>删除</button>
              </div>)}
            </EntitySection>
          </>}
      </section>
    </div>
  </main>
}

function ProjectCreate({ disabled, run }: { disabled: boolean, run: (line: string) => Promise<void> }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    void run(`project add ${JSON.stringify({ name: form.get('name'), startDate: form.get('startDate'), targetDate: form.get('targetDate') })}`)
    event.currentTarget.reset()
  }
  return <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
    <input style={input} name="name" required placeholder="项目名称"/>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><input style={input} name="startDate" required type="date"/><input style={input} name="targetDate" required type="date"/></div>
    <button style={primary} disabled={disabled}>新建项目</button>
  </form>
}

function ProjectDetail({ project, disabled, run }: { project: Project, disabled: boolean, run: (line: string) => Promise<void> }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    void run(`project update ${project.id} ${JSON.stringify({ owner: form.get('owner'), status: form.get('status'), targetDate: form.get('targetDate') })}`)
  }
  return <div style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 8, padding: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center' }}><div><h2 style={{ margin: 0 }}>{project.name}</h2><small>{project.id}</small></div>
      <button style={{ ...button, marginLeft: 'auto' }} disabled={disabled} onClick={() => window.confirm(`删除项目 ${project.name}？`) && void run(`project delete ${project.id} confirm`)}>删除项目</button></div>
    <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 16 }}>
      <input style={input} name="owner" defaultValue={project.owner} placeholder="负责人"/>
      <select style={input} name="status" defaultValue={project.status}><option value="planning">计划中</option><option value="active">进行中</option><option value="paused">已暂停</option><option value="done">已完成</option><option value="archived">已归档</option></select>
      <input style={input} name="targetDate" type="date" defaultValue={project.targetDate}/>
      <button style={primary} disabled={disabled}>保存</button>
    </form>
  </div>
}

function EntitySection({ title, count, children }: { title: string, count: number, children: ReactNode }) {
  return <section style={{ marginTop: 18, background: '#fff', border: '1px solid #e1e4e8', borderRadius: 8, padding: 18 }}>
    <h3 style={{ margin: '0 0 14px' }}>{title} <small style={{ color: '#6b7280' }}>{count}</small></h3>{children}
  </section>
}

function TaskCreate({ projectId, tasks, disabled, run }: { projectId: string, tasks: Task[], disabled: boolean, run: (line: string) => Promise<void> }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const parentId = String(form.get('parentId') ?? '')
    void run(`task add ${JSON.stringify({ projectId, title: form.get('title'), parentId: parentId || null })}`)
    event.currentTarget.reset()
  }
  return <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 8 }}>
    <input style={input} name="title" required placeholder="任务标题"/>
    <select style={input} name="parentId"><option value="">根任务</option>{tasks.map(task => <option key={task.id} value={task.id}>{task.code} {task.title}</option>)}</select>
    <button style={primary} disabled={disabled}>新增任务</button>
  </form>
}

function MilestoneCreate({ projectId, disabled, run }: { projectId: string, disabled: boolean, run: (line: string) => Promise<void> }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    void run(`milestone add ${JSON.stringify({ projectId, title: form.get('title'), targetDate: form.get('targetDate') })}`)
    event.currentTarget.reset()
  }
  return <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 8 }}>
    <input style={input} name="title" required placeholder="里程碑标题"/>
    <input style={input} name="targetDate" required type="date"/>
    <button style={primary} disabled={disabled}>新增里程碑</button>
  </form>
}

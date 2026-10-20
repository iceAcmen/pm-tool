/**
 * G-D AI 副驾 Portal 覆盖层（只读诊断 / 草稿待确认）：人确认才落库，非全局聊天。
 * 从 panel.tsx 按实体抽离，行为零变更：
 *  - 只读诊断：ask 提问，回答正文 + 相关任务只读投影（状态按最新快照现取）；
 *  - 草稿待确认：validatePlan 校验多步计划，勾选/行内编辑，整批 ask-apply 或逐步执行，非法行禁用确认；
 *  - 失败保输入、取消零写（clearPlan 只清本地步骤，不发命令）；撤销句柄进程内 10 分钟。
 */
import { Fragment, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.mjs'
import ListChecks from 'lucide-react/dist/esm/icons/list-checks.mjs'
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw.mjs'
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb.mjs'
import GitBranch from 'lucide-react/dist/esm/icons/git-branch.mjs'
import Check from 'lucide-react/dist/esm/icons/check.mjs'
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw.mjs'
import Send from 'lucide-react/dist/esm/icons/send.mjs'
import { MarkdownView } from '../markdown-view.js'
import { LaneSwitcher } from './model-lane.js'
import { validateActions, parseCopilotPlan, validatePlan, forStepwiseApply, type CopilotStep } from '../../../core/copilot.js'
import { extractReferencedTaskIds, planTaskIds, dueUrgency, latestAppliedBatches, refreshSucceeded, type AppliedBatch } from '../../../core/ask-projection.js'
import { parseActiveModelLane } from '../../../core/ui-feedback.js'
import { localTodayIso, isTaskOverdue } from '../../../core/derived.js'
import { clampProgress, isProgressOutOfRange } from '../../../core/progress-derivation.js'
import { taskStatusLabels } from '../../../core/labels.js'
import type { DiagnosisBubble } from '../../../core/suggestion-engine.js'
import type { Task } from '../../panel.js'

const taskStatus = taskStatusLabels as Record<string, string>

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

export function CopilotPanel({ projectId, tasks, milestones, riskIssues, deliverables, meetings, baselineMap, execute, executeRaw, disabled, onSaved, onOpenRecord, embedded = false, diagnosis = [], onDismissDiagnosis, mode = 'diagnosis', onModeChange }: {
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
  // P0-04 R-P1/R-P2：对话补档草稿卡——服务端 draftId 句柄 + 一键「确认落库」，免手抄 JSON/命令。
  const [captureDraft, setCaptureDraft] = useState<{ draftId: string; raw: string } | null>(null)
  const [captureResult, setCaptureResult] = useState<string | null>(null)
  const [captureBusy, setCaptureBusy] = useState(false)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [captureText, setCaptureText] = useState('')
  const [captureOpen, setCaptureOpen] = useState(false)

  /** R-P2：点「确认落库」等价 capture-apply <项目> <draftId>；失败保留草稿可重试（R-P4）。 */
  const runCapture = async () => {
    const text = captureText.trim()
    if (!text || captureBusy) return
    setCaptureBusy(true); setCaptureError(null)
    try {
      const res = await executeRaw(`capture ${projectId} ${JSON.stringify(text)}`)
      const m = /草稿编号：(draft-[A-Za-z0-9-]+)/.exec(res.text) ?? /capture-apply \S+ (draft-[A-Za-z0-9-]+)/.exec(res.text)
      setCaptureDraft(m ? { draftId: m[1], raw: res.text } : null)
      setCaptureResult(null)
      setMsgs(mm => [...mm, { role: 'sys', text: res.text }])
      if (!m) setCaptureError('未取得草稿编号，请重试或改用命令行。')
    } catch (e) {
      setCaptureError('生成草稿失败：' + (e instanceof Error ? e.message : String(e)))
    } finally { setCaptureBusy(false) }
  }
  const applyCaptureDraft = async () => {
    if (!captureDraft || captureBusy) return
    setCaptureBusy(true); setCaptureError(null)
    try {
      const res = await executeRaw(`capture-apply ${projectId} ${captureDraft.draftId}`)
      setMsgs(mm => [...mm, { role: 'sys', text: res.text }])
      if (res.kind === 'success') {
        setCaptureDraft(null); setCaptureText(''); setCaptureResult(res.text); onSaved()
      } else setCaptureError(res.text) // R-P4：失败保留草稿，不清除，可重试/放弃
    } catch (e) {
      setCaptureError('落库失败：' + (e instanceof Error ? e.message : String(e)))
    } finally { setCaptureBusy(false) }
  }
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

    {/* P0-04 R-P1/R-P2：对话补档草稿卡（仅内嵌副驾）——draftId 句柄 + 一键「确认落库」，免手抄 JSON。 */}
    {embedded && (
      <div className="pm-capture-card">
        <button type="button" className="pm-capture-toggle" aria-expanded={captureOpen} onClick={() => setCaptureOpen(o => !o)}>
          {captureOpen ? '收起 对话补档' : '＋ 对话补档（观察草稿，不落库）'}
        </button>
        {captureOpen && (
          <div className="pm-capture-body">
            <textarea
              className="pm-capture-text"
              value={captureText}
              rows={3}
              onChange={e => setCaptureText(e.target.value)}
              placeholder="口述/粘贴会话里提到的待办，例如：史冰冰 10/25 前补验收说明；研发跟进接口限流；材料 https://…"
            />
            <div className="pm-capture-actions">
              <button type="button" disabled={captureBusy || !captureText.trim()} onClick={() => void runCapture()}>
                {captureBusy ? '生成草稿…' : '生成草稿'}
              </button>
            </div>
            {captureDraft && (
              <div className="pm-capture-draft" role="region" aria-label="补档草稿（未写入，可一键确认落库）">
                <p className="pm-capture-draft-head">观察草稿（未写入）· 候选预览如下，确认后才落库</p>
                <MarkdownView text={captureDraft.raw}/>
                <div className="pm-capture-actions">
                  <button type="button" className="pm-button-primary" disabled={captureBusy} onClick={() => void applyCaptureDraft()}>
                    {captureBusy ? '落库中…' : '确认落库'}
                  </button>
                  <button type="button" disabled={captureBusy} onClick={() => { setCaptureDraft(null); setCaptureError(null) }}>放弃草稿</button>
                </div>
              </div>
            )}
            {captureResult && (
              <div className="pm-capture-result" role="status">
                <p className="pm-capture-draft-head">已确认落库（成功结果）</p>
                <MarkdownView text={captureResult}/>
                <p className="pm-capture-undo">如需撤回：按输出中的任务 ID 用 <code>/pm task delete &lt;id&gt;</code> 溯源删除（沿用既有撤销，不建第二套 undo）。</p>
              </div>
            )}
            {captureError && <div className="pm-capture-error" role="alert">{captureError}</div>}
          </div>
        )}
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

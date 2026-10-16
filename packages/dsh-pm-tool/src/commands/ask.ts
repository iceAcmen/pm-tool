import type { PmDomain } from '../core/storage.js'
import type { LlmGateway } from '../core/ai-client.js'
import { generateDraft, AiDraftError } from '../core/ai-client.js'
import { resolveModelRoute, getModelMode, PROD_KEY_MISSING_TEXT } from '../core/model-route.js'
import { buildAskContext, localToday, COPILOT_SYSTEM } from '../core/ask-copilot.js'

export function handleAskCommand(argument: string, domain: PmDomain | undefined, llm: LlmGateway | undefined) {
  // #22 实体演示缝：DSH_PM_E2E=1 且参数含 entities 时，不调模型，动态取本项目已有实体，
  // 产出里程碑/风险/交付物/会议四类 create/update 混合计划，供 GUI 确定性截图。
  if (process.env.DSH_PM_E2E === '1' && /entities/.test(argument)) {
    const projectId = argument.split(/\s+/)[0]
    if (!domain || !domain.table('projects').get(projectId ?? '')) {
      return { kind: 'error' as const, text: '未找到项目' }
    }
    const list = (name: string) => [...(domain.table(name as never) as { entries(): IterableIterator<[string, unknown]> }).entries()].map(([, v]) => v as { id: string, projectId?: string })
      .filter(x => x.projectId === projectId)
    const ms = list('milestones')[0]
    const ri = list('risk_issues')[0]
    const dlv = list('deliverables')[0]
    const mtg = list('meetings')[0]
    const plan = [
      { stepId: 's1', title: '创建里程碑', reason: '阶段收口需要一个目标节点', action: { op: 'milestone.create', patch: { title: '试运行里程碑', targetDate: '2026-11-30', status: 'planned', description: 'PoC 试运行验收节点' } }, needs: [] },
      { stepId: 's2', title: '更新里程碑', reason: '目标日期微调', ...(ms ? { action: { op: 'milestone.update', id: ms.id, patch: { targetDate: '2026-11-28' } } } : { action: { op: 'milestone.create', patch: { title: '占位里程碑', targetDate: '2026-12-01' } } }), needs: [] },
      { stepId: 's3', title: '登记新风险', reason: '第三方接口稳定性存疑', action: { op: 'risk.create', patch: { type: 'risk', title: '第三方接口限流风险', impact: 'high', probability: 'medium', status: 'open', responsePlan: '申请配额并准备降级方案' } }, needs: [] },
      { stepId: 's4', title: '更新风险状态', reason: '已转入跟进', ...(ri ? { action: { op: 'risk.update', id: ri.id, patch: { status: 'monitoring' } } } : { action: { op: 'risk.create', patch: { type: 'issue', title: '占位问题', impact: 'low' } } }), needs: [] },
      { stepId: 's5', title: '创建交付物', reason: '需归档验收材料', action: { op: 'deliverable.create', patch: { name: '试运行验收报告', status: 'planned', dueDate: '2026-12-10', description: '试运行阶段验收材料' } }, needs: [] },
      { stepId: 's6', title: '更新交付物', reason: '进入制作中', ...(dlv ? { action: { op: 'deliverable.update', id: dlv.id, patch: { status: 'in_progress' } } } : { action: { op: 'deliverable.create', patch: { name: '占位交付物' } } }), needs: [] },
      { stepId: 's7', title: '创建会议', reason: '安排阶段复盘', action: { op: 'meeting.create', patch: { title: '试运行复盘会', meetingDate: '2026-12-05', status: 'draft', participants: ['项目经理', '研发代表'], decisions: [] } }, needs: [] },
      { stepId: 's8', title: '更新会议', reason: '已定稿', ...(mtg ? { action: { op: 'meeting.update', id: mtg.id, patch: { status: 'final' } } } : { action: { op: 'meeting.create', patch: { title: '占位会议', meetingDate: '2026-12-06' } } }), needs: [] },
    ]
    return {
      kind: 'success' as const,
      text: `【E2E 实体固定诊断】今天是 ${localToday()}，建议补齐里程碑/风险/交付物/会议台账。
\`\`\`json
{"plan":${JSON.stringify(plan)}}
\`\`\``,
    }
  }
  // PROD-20 E2E 测试缝：仅当 DSH_PM_E2E=1 时可用，不调模型，返回固定"模拟模型原始输出"，
  // 后续 parseCopilotActions→validateActions→渲染→确认落盘与真实 ask 完全同路径；生产/所有者实例不注册。
  if (process.env.DSH_PM_E2E === '1' && /(^|\s)fixture(\s|$)/.test(argument)) {
    const projectId = argument.split(/\s+/).filter(t => t !== 'fixture')[0]
    if (!domain || !domain.table('projects').get(projectId ?? '')) {
      return { kind: 'error' as const, text: '未找到项目' }
    }
    // 动态取本项目前几个任务，避免硬编码 t-9001/9002 与隔离夹具不一致
    const tasks = [...domain.table('tasks').entries()].map(([, v]) => v as { id: string, projectId?: string })
      .filter(t => t.projectId === projectId).map(t => t.id)
    if (tasks.length < 1) return { kind: 'error' as const, text: '项目暂无任务，无法演示草稿' }
    const okId = tasks[0]
    const delId = tasks[1] ?? tasks[0]
    const cycleId = tasks[2] ?? delId
    // 多步计划：s1 收尾（合法）→ s2 同任务改派（合法链式）；s3 删除步（应被白名单拒）；s4/s5 环依赖（应被 DAG 拒）。
    const plan = [
      { stepId: 's1', title: '收尾任务', reason: '进度已完成、阻塞已解', action: { op: 'task.update', id: okId, patch: { status: 'done', progress: 100 } }, needs: [], riskNote: '改完同步周会' },
      { stepId: 's2', title: '改派负责人', reason: 's1 释放了人力', action: { op: 'task.update', id: okId, patch: { assignee: '赵六' } }, needs: ['s1'] },
      { stepId: 's3', title: '删除任务(应被拒)', reason: '演示白名单拒绝', action: { op: 'task.delete', id: delId }, needs: [] },
      { stepId: 's4', title: '环依赖a(应被拒)', reason: '演示环局部拒', action: { op: 'task.update', id: cycleId, patch: { progress: 10 } }, needs: ['s5'] },
      { stepId: 's5', title: '环依赖b(应被拒)', reason: '演示环局部拒', action: { op: 'task.update', id: cycleId, patch: { progress: 20 } }, needs: ['s4'] },
    ]
    return {
      kind: 'success' as const,
      text: `【E2E 固定诊断】今天是 ${localToday()}，该项目任务进度滞后，建议先收尾 ${okId} 再改派。
\`\`\`json
{"plan":${JSON.stringify(plan)}}
\`\`\``,
    }
  }
  if (!domain) return { kind: 'error' as const, text: '项目存储未就绪。' }
  const tokens = argument.split(/\s+/)
  const projectId = tokens[0]
  const question = tokens.slice(1).join(' ').trim()
  if (!projectId || !question) return { kind: 'error' as const, text: '请使用：/pm ask <项目ID> "<问题>"' }

  const project = domain.table('projects').get(projectId)
  if (!project) return { kind: 'error' as const, text: `未找到项目 ${projectId}` }

  const list = (name: string): any[] => [...(domain.table as any)(name).entries()].map(([, v]) => v).filter((x: any) => x.projectId === projectId)
  const tasks = list('tasks')
  const risks = list('risk_issues')
  const milestones = list('milestones')
  const meetings = list('meetings')
  const reports = list('reports')
  const deliverables = list('deliverables')

  const ctxText = buildAskContext({
    projectName: project.name ?? projectId,
    today: localToday(),
    tasks: tasks.map((t: any) => ({ id: t.id, title: t.title, status: t.status, progress: t.progress ?? 0, assignee: t.assignee, dueDate: t.dueDate, startDate: t.startDate })),
    risks: risks.map((r: any) => ({ id: r.id, title: r.title, status: r.status, severity: r.severity, probability: r.probability, impact: r.impact })),
    milestones: milestones.map((m: any) => ({ id: m.id, title: m.title, targetDate: m.targetDate, status: m.status })),
    meetings: meetings.map((m: any) => ({ id: m.id, title: m.title, date: m.meetingDate, actions: m.actions ?? [] })),
    reports: reports.map((r: any) => ({ id: r.id, title: r.title ?? r.kind ?? r.id, date: r.date })),
    deliverables: deliverables.map((d: any) => ({ id: d.id, title: d.title, status: d.status, dueDate: d.dueDate })),
  })

  const route = resolveModelRoute(getModelMode(domain), 'copilot')
  const call = generateDraft(llm, {
    system: COPILOT_SYSTEM,
    user: `【项目数据】\n${ctxText}\n\n【用户问题】${question}`,
    maxTokens: 4000,
    provider: route.provider,
    model: route.model,
    models: route.models ? [...route.models] : undefined,
  })
  return call.then(text => ({ kind: 'success' as const, text })).catch((error: unknown) => {
    if (error instanceof AiDraftError && (error.message === 'PROD_KEY_MISSING' || /Key|密钥/.test(error.message))) {
      return { kind: 'error' as const, text: PROD_KEY_MISSING_TEXT }
    }
    return { kind: 'error' as const, text: `副驾暂不可用：${error instanceof Error ? error.message : String(error)}` }
  })
}

// ===== PROD-20 后端应用守卫（加固） =====
// 前端确认不再直接循环 `task update`，而是把草稿动作交给后端：
// 服务器从 domain 重读、校验「目标属于当前项目 + 允许字段 + 真实日期」，
// 对有基线 updatedAt 的条目做冲突比较（他人已改则拒绝覆盖）。
// 写库一律走既有 updateTask 领域路径（enqueueDomainWrite 串行 + 起止/关系校验），
// 不再 table.put 绕过。同草稿并发：用 in-flight Promise 在 await 前原子占用，并发方共享同一结果，
// 杜绝双写；完成后写 TTL，失败清理 in-flight。不新增表、不把任何 token 当授权。
import { validateActions, type CopilotAction } from '../core/copilot.js'
import { updateTask } from '../core/tasks.js'
import { addMilestone, updateMilestone } from '../core/milestones.js'
import { addRiskIssue, updateRiskIssue } from '../core/risk-issues.js'
import { addDeliverable, updateDeliverable } from '../core/deliverables.js'
import { addMeeting, updateMeeting } from '../core/meetings.js'
import {
  createSettingsIdempotencyRegistry,
  hashScopeKey,
  askApplyScope,
  IDEMPOTENCY_TTL_MS,
  IDEMPOTENCY_ACTOR_SEGMENT_DEFAULT,
} from '../core/idempotency.js'

// 并发去重仍是纯内存（不落盘）：同一进程内 await 前原子占用，并发方共享同一结果，杜绝双写。
// 键用 keyHash（与持久化注册表一致），这里不存动作正文。
const inFlight = new Map<string, Promise<AskApplyResult>>()

// 幂等键分片 = projectId + actorSegment + JSON(actions) + JSON(baseline)，再取 SHA-256：
// 同一勾选集合 60s 内重复确认才拦截；不同 baseline（重新生成计划）/ 不同子集（逐步模式）/
// 不同 project / 不同 actor 互不误拦。落盘只存 hash 与最小标记，不存动作正文。
function applyKeyHash(projectId: string, actions: CopilotAction[], baseline: Record<string, string>, actorSegment: string): string {
  return hashScopeKey([projectId, actorSegment, JSON.stringify(actions), JSON.stringify(baseline)])
}

export interface AskApplyResult {
  kind: 'success' | 'error'
  text: string
  appliedCount?: number
  /** 落库成功后用于一键撤销的句柄（10 分钟内有效，进程内；dsh 重启后失效）。 */
  undoId?: string
}

/** 一条可撤销改动：update 记原始记录，create 标记为新建（撤销时删除）。 */
interface UndoChange {
  table: string
  id: string
  kind: 'update' | 'create'
  original?: unknown
}

/** 一次 ask-apply 的撤销快照。 */
interface UndoRecord {
  changes: UndoChange[]
  createdAt: number
  used: boolean
}

/** 撤销窗口：AI 落库后通常立即反悔，给 10 分钟。 */
const UNDO_TTL_MS = 10 * 60 * 1000
const undoStore = new Map<string, UndoRecord>()

/** 生成撤销句柄并清理过期项。 */
function stashUndo(changes: UndoChange[]): string {
  const now = Date.now()
  for (const [id, rec] of undoStore) {
    if (now - rec.createdAt > UNDO_TTL_MS) undoStore.delete(id)
  }
  const undoId = `undo-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  undoStore.set(undoId, { changes, createdAt: now, used: false })
  return undoId
}

/** 列出最近仍可撤销的句柄（按时间倒序），供前端在落库后查询。 */
function listRecentUndo(limit = 3): { id: string, at: number }[] {
  const now = Date.now()
  for (const [id, rec] of undoStore) {
    if (now - rec.createdAt > UNDO_TTL_MS) undoStore.delete(id)
  }
  return Array.from(undoStore.entries())
    .filter(([, rec]) => !rec.used)
    .sort((a, b) => b[1].createdAt - a[1].createdAt)
    .slice(0, limit)
    .map(([id, rec]) => ({ id, at: rec.createdAt }))
}

/**
 * 撤销一次 ask-apply：update 恢复原始记录、create 删除新建记录。
 * 回滚顺序与落库相反（先撤销后落库的），撤销一次后句柄失效。
 * 参数为 "list" 时返回最近可撤销句柄（JSON text，供前端解析，不直接展示）。
 */
export async function handleAskUndoCommand(argument: string, domain: PmDomain | undefined): Promise<{ kind: 'success' | 'error', text: string }> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  const undoId = argument.trim()
  if (undoId === 'list' || undoId === '') {
    return { kind: 'success', text: JSON.stringify({ undoIds: listRecentUndo() }) }
  }
  const record = undoStore.get(undoId)
  if (!record) return { kind: 'error', text: '撤销句柄不存在或已过期（重启 dsh 后无法撤销，可用 /pm restore 恢复备份）。' }
  if (record.used) return { kind: 'error', text: '该批改动已撤销过，不能重复撤销。' }
  const reverted: string[] = []
  const failed: string[] = []
  const changes = [...record.changes].reverse()
  for (const change of changes) {
    const table = domain.table(change.table as never) as unknown as {
      put(key: string, value: unknown): Promise<unknown>
      delete(key: string): Promise<unknown>
      get(key: string): unknown
    }
    try {
      if (change.kind === 'create') {
        // 仅当记录仍存在时删除，避免删掉用户在落库后又手工建立的同名记录。
        if (table.get(change.id)) await table.delete(change.id)
      } else {
        // 恢复原始快照（含原 updatedAt），让基线回到落库前。
        await table.put(change.id, change.original)
      }
      reverted.push(`${change.table}/${change.id}`)
    } catch (e) {
      failed.push(`${change.table}/${change.id}：${e instanceof Error ? e.message : String(e)}`)
    }
  }
  record.used = true
  const text = `已撤销 ${reverted.length} 项${reverted.length ? `（${reverted.join('；')}）` : ''}`
    + (failed.length ? `；${failed.length} 项撤销失败（${failed.join('；')}）` : '')
  return failed.length ? { kind: 'error', text } : { kind: 'success', text }
}

async function applyCore(projectId: string, actions: CopilotAction[], baseline: Record<string, string>, domain: PmDomain): Promise<AskApplyResult> {
  // 从 domain 重读当前项目各实体，后端校验归属/字段/日期（validateActions 已在前面复核）。
  const all = (table: string) => {
    const t = domain.table(table as never) as { entries(): IterableIterator<[string, unknown]> }
    return [...t.entries()].map(([, v]) => v as { id: string, projectId?: string, updatedAt?: string })
  }
  const tasks = all('tasks').filter(t => t.projectId === projectId)
  const liveTaskIds = new Set(tasks.map(t => t.id))
  const liveMilestoneIds = new Set(all('milestones').filter(m => m.projectId === projectId).map(m => m.id))
  const liveRiskIds = new Set(all('risk_issues').filter(r => r.projectId === projectId).map(r => r.id))
  const liveDeliverableIds = new Set(all('deliverables').filter(d => d.projectId === projectId).map(d => d.id))
  const liveMeetingIds = new Set(all('meetings').filter(m => m.projectId === projectId).map(m => m.id))
  const v = validateActions(actions, {
    taskIds: [...liveTaskIds],
    milestoneIds: [...liveMilestoneIds],
    riskIds: [...liveRiskIds],
    deliverableIds: [...liveDeliverableIds],
    meetingIds: [...liveMeetingIds],
  })

  // 计划步带 stepId/title/needs 元数据（旧扁平 action 无这些字段，行为不变）。
  const isPlan = actions.some(a => typeof a.stepId === 'string')
  const unit = isPlan ? '步' : '条'
  const label = (a: CopilotAction): string => {
    const sid = typeof a.stepId === 'string' ? a.stepId : ''
    const title = typeof a.title === 'string' ? a.title : ''
    const id = String(a.id ?? '(新建)')
    return sid ? `${sid} ${id}${title ? ` ${title}` : ''}` : id
  }

  const applied: string[] = []
  const blocked: string[] = []
  const appliedStepIds = new Set<string>()
  const undoChanges: UndoChange[] = []

  // 按 op 分发到各实体既有 repo（零 schema 改动）；create 注入 projectId，update 走基线冲突比较。
  const dispatch = async (a: CopilotAction): Promise<{ ok: boolean, nextUpdatedAt?: string, undo?: UndoChange }> => {
    const patch = (a.patch ?? {}) as Record<string, unknown>
    switch (a.op) {
      case 'task.update': {
        const rec = tasks.find(t => t.id === a.id)
        if (!rec || rec.projectId !== projectId) throw new DispatchSkip('不存在或不属于本项目')
        const base = baseline[a.id ?? '']
        if (base && rec.updatedAt && rec.updatedAt !== base) throw new DispatchSkip('内容已被他人更新，为避免覆盖未执行')
        // 落库前抓原始记录快照（供撤销恢复）。
        const original = structuredClone(rec)
        const next = await updateTask(domain, a.id!, patch)
        // 同步本地快照 updatedAt，供同目标后续步冲突比较（与链式 baseline 一致）。
        if (next?.updatedAt) rec.updatedAt = next.updatedAt
        return { ok: true, nextUpdatedAt: next?.updatedAt, undo: { table: 'tasks', id: a.id!, kind: 'update', original } }
      }
      case 'milestone.create': {
        const next = await addMilestone(domain, { projectId, ...patch })
        return { ok: true, nextUpdatedAt: next?.updatedAt, undo: { table: 'milestones', id: next.id, kind: 'create' } }
      }
      case 'milestone.update': {
        const rec = [...domain.table('milestones').entries()].map(([, x]) => x as { id: string, projectId?: string, updatedAt?: string }).find(x => x.id === a.id)
        if (!rec || rec.projectId !== projectId) throw new DispatchSkip('里程碑不存在或不属于本项目')
        const base = baseline[a.id ?? '']
        if (base && rec.updatedAt && rec.updatedAt !== base) throw new DispatchSkip('内容已被他人更新，为避免覆盖未执行')
        const original = structuredClone(rec)
        const next = await updateMilestone(domain, a.id!, patch)
        return { ok: true, nextUpdatedAt: next?.updatedAt, undo: { table: 'milestones', id: a.id!, kind: 'update', original } }
      }
      case 'risk.create': {
        const next = await addRiskIssue(domain, { projectId, ...patch })
        return { ok: true, nextUpdatedAt: next?.updatedAt, undo: { table: 'risk_issues', id: next.id, kind: 'create' } }
      }
      case 'risk.update': {
        const rec = [...domain.table('risk_issues').entries()].map(([, x]) => x as { id: string, projectId?: string, updatedAt?: string }).find(x => x.id === a.id)
        if (!rec || rec.projectId !== projectId) throw new DispatchSkip('风险/问题不存在或不属于本项目')
        const base = baseline[a.id ?? '']
        if (base && rec.updatedAt && rec.updatedAt !== base) throw new DispatchSkip('内容已被他人更新，为避免覆盖未执行')
        const original = structuredClone(rec)
        const next = await updateRiskIssue(domain, a.id!, patch)
        return { ok: true, nextUpdatedAt: next?.updatedAt, undo: { table: 'risk_issues', id: a.id!, kind: 'update', original } }
      }
      case 'deliverable.create': {
        const next = await addDeliverable(domain, { projectId, ...patch })
        return { ok: true, nextUpdatedAt: next?.updatedAt, undo: { table: 'deliverables', id: next.id, kind: 'create' } }
      }
      case 'deliverable.update': {
        const rec = [...domain.table('deliverables').entries()].map(([, x]) => x as { id: string, projectId?: string, updatedAt?: string }).find(x => x.id === a.id)
        if (!rec || rec.projectId !== projectId) throw new DispatchSkip('交付物不存在或不属于本项目')
        const base = baseline[a.id ?? '']
        if (base && rec.updatedAt && rec.updatedAt !== base) throw new DispatchSkip('内容已被他人更新，为避免覆盖未执行')
        const original = structuredClone(rec)
        const next = await updateDeliverable(domain, a.id!, patch)
        return { ok: true, nextUpdatedAt: next?.updatedAt, undo: { table: 'deliverables', id: a.id!, kind: 'update', original } }
      }
      case 'meeting.create': {
        const next = await addMeeting(domain, { projectId, ...patch })
        return { ok: true, nextUpdatedAt: next?.updatedAt, undo: { table: 'meetings', id: next.id, kind: 'create' } }
      }
      case 'meeting.update': {
        const rec = [...domain.table('meetings').entries()].map(([, x]) => x as { id: string, projectId?: string, updatedAt?: string }).find(x => x.id === a.id)
        if (!rec || rec.projectId !== projectId) throw new DispatchSkip('会议不存在或不属于本项目')
        const base = baseline[a.id ?? '']
        if (base && rec.updatedAt && rec.updatedAt !== base) throw new DispatchSkip('内容已被他人更新，为避免覆盖未执行')
        const original = structuredClone(rec)
        const next = await updateMeeting(domain, a.id!, patch)
        return { ok: true, nextUpdatedAt: next?.updatedAt, undo: { table: 'meetings', id: a.id!, kind: 'update', original } }
      }
      default:
        throw new DispatchSkip(`不允许的操作 ${a.op}`)
    }
  }

  for (const a of v.accepted) {
    // 依赖级联：本步 needs 指向的前置 stepId 未全部落库 -> 本步跳过（不自动补偿/重试）。
    const needs = Array.isArray(a.needs) ? a.needs.filter((n): n is string => typeof n === 'string') : []
    if (needs.some(n => !appliedStepIds.has(n))) { blocked.push(`${label(a)}：依赖步骤未执行，已跳过`); continue }
    try {
      const res = await dispatch(a)
      // 链式 baseline：同目标后续步用本次落库后的新 updatedAt 比较，不被误判「他人已改」；仅本次调用内存，不持久。
      if (res.nextUpdatedAt && a.id) baseline[a.id] = res.nextUpdatedAt
      if (res.undo) undoChanges.push(res.undo)
      if (typeof a.stepId === 'string') appliedStepIds.add(a.stepId)
      applied.push(label(a))
    } catch (e) {
      blocked.push(`${label(a)}：${e instanceof DispatchSkip ? e.message : `写库失败（${e instanceof Error ? e.message : String(e)}）`}`)
    }
  }
  const extra = v.rejected.map(r => `${r.action.id ?? '(无id)'}：${r.reason}`)
  const text = `已应用 ${applied.length} ${unit}${applied.length ? `（${applied.join('；')}）` : ''}`
    + (blocked.length ? `；未执行 ${blocked.length} ${unit}（${blocked.join('；')}）` : '')
    + (extra.length ? `；拒绝 ${extra.length} ${unit}（${extra.join('；')}）` : '')
  // 有真正落库的改动才生成撤销句柄（前端随后通过 ask-undo list 查询，因 dsh 命令结果只透传 kind/text）。
  const undoId = undoChanges.length ? stashUndo(undoChanges) : undefined
  return { kind: 'success', text, appliedCount: applied.length, undoId }
}

/** 分发内的「跳过/拒绝」信号（非异常），与真正写库失败区分。 */
class DispatchSkip extends Error {}

export async function handleAskApplyCommand(argument: string, domain: PmDomain | undefined): Promise<AskApplyResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  // 形如: <projectId> <jsonActions> [--base <jsonUpdatedAtMap>]
  const m = /^(\S+)\s+([\s\S]*)$/.exec(argument.trim())
  if (!m) return { kind: 'error', text: '用法：ask-apply <项目ID> <json动作数组>' }
  const projectId = m[1]
  const rest = m[2]
  const baseMatch = /--base\s+(\{[\s\S]*\})\s*$/.exec(rest)
  const actionsJson = baseMatch ? rest.slice(0, baseMatch.index).trim() : rest.trim()
  let actions: CopilotAction[]
  try {
    const obj = JSON.parse(actionsJson)
    actions = Array.isArray(obj) ? obj : (obj.actions ?? [])
    if (!Array.isArray(actions)) throw new Error('动作须为数组')
  } catch {
    return { kind: 'error', text: '动作 JSON 无法解析。' }
  }
  if (!domain.table('projects').get(projectId)) return { kind: 'error', text: `未找到项目 ${projectId}` }
  // 基线：若传了必须是合法对象映射；malformed 直接报错（不再静默 ignore）。
  let baseline: Record<string, string> = {}
  if (baseMatch) {
    try {
      const parsed = JSON.parse(baseMatch[1])
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('基线须为对象')
      baseline = parsed
    } catch {
      return { kind: 'error', text: '确认基线（--base）格式非法，已中止以防误覆盖。' }
    }
  }

  // actorSegment 预留：当前无账号体系，统一 local-anonymous；未来不同 actor 不互去重。
  const actorSegment = IDEMPOTENCY_ACTOR_SEGMENT_DEFAULT
  const keyHash = applyKeyHash(projectId, actions, baseline, actorSegment)
  const registry = createSettingsIdempotencyRegistry(domain)

  // 持久化幂等（60s 短 TTL）：成功标记落盘后的「顺序重放」（重启 / 新进程重开同一数据 root，
  // 按时间先后再次确认同一计划）直接返回「已执行」，避免因 updatedAt 已被本次确认推进、
  // 再比旧基线而误报「他人已改」冲突。注意：本标记只覆盖顺序重放，不提供跨进程并发互斥——
  // 跨进程同时双写仍由 updateTask 写队列 / 基线比较兜底，不在本幂等语义内。
  if (registry.check(keyHash)) {
    return { kind: 'success', text: '该计划已执行过（幂等拦截），为避免重复写库未再次执行。' }
  }
  // 并发去重（纯内存）：in-flight 中同一草稿直接共享结果，杜绝 await 前检查通过后双写。
  const flying = inFlight.get(keyHash)
  if (flying) return flying

  const promise = applyCore(projectId, actions, baseline, domain)
  inFlight.set(keyHash, promise)
  try {
    const res = await promise
    // 只有真正落库成功（appliedCount>0）才登记幂等标记；失败/全拒绝不登记。
    if ((res.appliedCount ?? 0) > 0) {
      try {
        await registry.record({
          keyHash,
          scope: askApplyScope(projectId, actorSegment),
          expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
        })
      } catch {
        // 幂等登记失败不影响已落库业务结果（最坏 60s 内可能重写一次，由 baseline/串行写兜底）。
      }
    }
    return res
  } finally {
    inFlight.delete(keyHash)
  }
}


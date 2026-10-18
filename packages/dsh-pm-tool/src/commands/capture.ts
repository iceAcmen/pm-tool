/**
 * P0 能力 K4 对话补档 / K3 证据闭环 的命令层。
 * 子词分发：
 *   - capture          观察模式：调 LLM 把会话整理成待办草稿（只展示，绝不落库）；
 *   - capture-apply   人确认：把草稿逐条经 addTask 落库、首条证据挂 evidenceUrl、记溯源；
 *   - attach-evidence 单条确认直挂证据链接到指定任务（不改状态/排期）。
 * 契约见 docs/design/deep-integration-v2-p0-dev.md §三 K4/K3。
 *
 * 能力边界：capture 是「整理成草稿 → 人确认（本命令即确认动作）→ 落库」，模型绝不自动建任务；
 * evidence 只挂 evidenceUrl，不自动改状态/进度/排期；撤销走既有 /pm task delete + 溯源留痕，
 * 不建第二套 undo 体系。
 */
import type { PmDomain } from '../core/storage.js'
import type { LlmGateway } from '../core/ai-client.js'
import { generateDraft, AiDraftError } from '../core/ai-client.js'
import { resolveModelRoute, getModelMode, PROD_KEY_MISSING_TEXT } from '../core/model-route.js'
import { addTask, updateTask, getTask } from '../core/tasks.js'
import { recordProvenance } from '../core/provenance-store.js'
import {
  buildSourceRefs,
  CURRENT_SNAPSHOT_VERSION,
  CURRENT_RULE_REVISION,
  type SourceRecord,
} from '../core/provenance.js'
import { localTodayIso } from '../core/derived.js'
import {
  CAPTURE_SYSTEM_PROMPT,
  buildCaptureUserPrompt,
  extractJsonBlock,
  normalizeCaptureDraft,
  validateCaptureDraft,
  CaptureDraftParseError,
  type CaptureCandidate,
} from '../core/capture.js'
import { normalizeEvidenceUrl, EvidenceUrlInvalidError } from '../core/evidence.js'

export const captureHelp = [
  '  /pm capture <项目ID> "<会话文本>"          将会话中的待办整理成草稿（观察模式，不落库）',
  '  /pm capture-apply <项目ID> "<json草稿>"     确认草稿后逐条落库（任务+证据链接）',
  '  /pm attach-evidence <任务ID> <url>          轻确认后补挂证据链接到任务（不改状态/排期）',
  'capture 只产出草稿，确认后才落库；撤销已建任务用 /pm task delete <id>（溯源账本留痕）。',
].join('\n')

interface CommandResult {
  kind: 'success' | 'error'
  text: string
}

/** 入口分发：capture-apply / attach-evidence / 默认 capture 观察模式。 */
export async function handleCaptureCommand(
  argument: string,
  domain: PmDomain | undefined,
  llm: LlmGateway | undefined,
): Promise<CommandResult> {
  const input = argument.trim()

  const applyMatch = /^capture-apply\s+([\s\S]+)$/i.exec(input)
  if (applyMatch) return handleCaptureApply(applyMatch[1].trim(), domain)

  const attachMatch = /^attach-evidence\s+(\S+)\s+(\S+)$/i.exec(input)
  if (attachMatch) return handleAttachEvidence(attachMatch[1], attachMatch[2], domain)
  if (/^attach-evidence\b/i.test(input)) {
    return { kind: 'error', text: '用法：/pm attach-evidence <任务ID> <url>' }
  }

  return handleCaptureDraft(input, domain, llm)
}

// ===== K4 capture：观察模式草稿（只展示，不落库）=====

async function handleCaptureDraft(
  input: string,
  domain: PmDomain | undefined,
  llm: LlmGateway | undefined,
): Promise<CommandResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  const tokens = input.split(/\s+/)
  const projectId = tokens[0]
  const dialogue = tokens.slice(1).join(' ').trim()
  if (!projectId || !dialogue) {
    return { kind: 'error', text: '请使用：/pm capture <项目ID> "<会话文本>"' }
  }
  const project = domain.table('projects').get(projectId) as { name?: string } | undefined
  if (!project) return { kind: 'error', text: `未找到项目 ${projectId}` }

  // PROD-20 E2E 缝：仅 DSH_PM_E2E=1 且含 capture-fixture 时返回固定候选，不调模型、不落库，
  // 供隔离环境确定性演示「草稿→确认落库」同一路径；生产/所有者实例不注册该行为。
  if (process.env.DSH_PM_E2E === '1' && /capture-fixture/.test(input)) {
    const fixture = {
      candidates: [
        { title: '整理验收材料清单', dueDate: '2026-11-30', assignee: 'Ice', description: '据会话承诺整理', evidence: ['https://example.com/acceptance'] },
        { title: '跟进第三方接口限流', description: '会话中提到的待跟进项' },
      ],
      note: '观察模式：仅展示未落库；确认后经 /pm capture-apply 落库',
    }
    return renderDraft(projectId, fixture.candidates, fixture.note)
  }

  let raw: string
  try {
    const route = resolveModelRoute(getModelMode(domain), 'title')
    raw = await generateDraft(llm, {
      system: CAPTURE_SYSTEM_PROMPT,
      user: buildCaptureUserPrompt(project.name ?? projectId, dialogue, localTodayIso()),
      maxTokens: 2000,
      provider: route.provider,
      model: route.model,
      models: route.models ? [...route.models] : undefined,
    })
  } catch (error) {
    if (error instanceof AiDraftError && (error.message === 'PROD_KEY_MISSING' || /Key|密钥/.test(error.message))) {
      return { kind: 'error', text: PROD_KEY_MISSING_TEXT }
    }
    return {
      kind: 'error',
      text: `对话补档暂不可用：${error instanceof Error ? error.message : String(error)}。可先手工 /pm task add 记录待办。`,
    }
  }

  let draft
  try {
    draft = normalizeCaptureDraft(extractJsonBlock(raw))
  } catch (error) {
    if (error instanceof CaptureDraftParseError) {
      return { kind: 'error', text: `模型草稿解析失败：${error.message} 可重试一次，或手工 /pm task add。` }
    }
    throw error
  }
  return renderDraft(projectId, draft.candidates, draft.note)
}

/** 观察模式渲染：人读清单 + 可直接复述给 capture-apply 的 JSON 草稿（全程不落库）。 */
function renderDraft(projectId: string, candidates: CaptureCandidate[], note?: string): CommandResult {
  const json = JSON.stringify(
    { candidates, note: note ?? '观察模式：仅展示未落库；确认后经 /pm capture-apply 落库' },
    null,
    2,
  )
  const lines = [
    '【对话补档草稿 · 观察模式（未写入）】',
    candidates.length
      ? candidates.map((c, i) => {
          const meta = [
            c.dueDate ? `截止 ${c.dueDate}` : '',
            c.assignee ? `负责人 ${c.assignee}` : '',
            c.evidence?.length ? `证据 ${c.evidence.length} 条` : '',
          ].filter(Boolean).join('｜')
          return `  ${i + 1}. ${c.title}${meta ? `（${meta}）` : ''}`
        }).join('\n')
      : '  （未从对话中提取到待办）',
    '',
    '确认落库：把下面整段 JSON 复述给 /pm capture-apply ' + projectId + ' "<json草稿>"',
    '```json',
    json,
    '```',
  ]
  return { kind: 'success', text: lines.join('\n') }
}

// ===== K4 capture-apply：人确认后逐条落库 =====

async function handleCaptureApply(projectIdArg: string, domain: PmDomain | undefined): Promise<CommandResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  const m = /^(\S+)\s+([\s\S]+)$/.exec(projectIdArg)
  if (!m) return { kind: 'error', text: '用法：/pm capture-apply <项目ID> "<json草稿>"' }
  const projectId = m[1]
  const body = m[2].trim()
  if (!domain.table('projects').get(projectId)) return { kind: 'error', text: `未找到项目 ${projectId}` }

  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return { kind: 'error', text: '草稿 JSON 无法解析，请复述 capture 输出的完整 JSON 块。' }
  }

  // 全量预校验：任一候选有问题即整批拒绝、零写入，避免半套落库。
  const { accepted, errors } = validateCaptureDraft(parsed)
  if (errors.length) {
    return { kind: 'error', text: `草稿校验未通过，未写入任何任务：\n  - ${errors.join('\n  - ')}` }
  }
  if (!accepted.length) {
    return { kind: 'error', text: '草稿里没有可落库的候选（candidates 为空）。' }
  }

  const created: { id: string, title: string }[] = []
  const evidenceAttached: string[] = []
  const extraEvidence: string[] = []
  const blocked: string[] = []

  for (const candidate of accepted) {
    try {
      const task = await addTask(domain, {
        projectId,
        title: candidate.title,
        ...(candidate.dueDate ? { dueDate: candidate.dueDate } : {}),
        ...(candidate.assignee ? { assignee: candidate.assignee } : {}),
        ...(candidate.description ? { description: candidate.description } : {}),
      })
      // K3：单条证据取第一个挂 evidenceUrl；其余证据本期不承载（留痕在返回文本，不丢弃不编造）。
      if (candidate.evidence?.length) {
        try {
          const first = normalizeEvidenceUrl(candidate.evidence[0])
          await updateTask(domain, task.id, { evidenceUrl: first })
          evidenceAttached.push(`${task.id} ← ${first}`)
          for (const extra of candidate.evidence.slice(1)) {
            extraEvidence.push(`${task.id}：额外证据未挂载（${extra}）`)
          }
        } catch (error) {
          blocked.push(`${task.id}：证据挂载失败（${error instanceof Error ? error.message : String(error)}），任务已创建`)
        }
      }
      created.push({ id: task.id, title: task.title })
    } catch (error) {
      blocked.push(`${candidate.title}：${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 有真正落库的任务才记溯源；账本写失败不回滚已落库业务（recordProvenance 内部 best-effort）。
  if (created.length) {
    const recMap = new Map<string, SourceRecord>()
    for (const [, rec] of (domain.table('tasks') as { entries(): IterableIterator<[string, unknown]> }).entries()) {
      const r = rec as SourceRecord
      if (r.projectId === projectId) recMap.set(`tasks:${r.id}`, r)
    }
    const refs = buildSourceRefs({
      actions: created.map(c => ({ op: 'task.create', id: c.id })),
      records: recMap,
      snapshotVersion: CURRENT_SNAPSHOT_VERSION,
      ruleRevision: CURRENT_RULE_REVISION,
    })
    void recordProvenance(domain, {
      projectId,
      kind: 'capture',
      summary: `对话补档落库 ${created.length} 个任务（人经 capture-apply 确认）`,
      refs,
    })
  }

  const text = [
    `已确认落库 ${created.length} 个任务：`,
    ...created.map(c => `  - ${c.id}｜${c.title}`),
    ...(evidenceAttached.length ? [`证据已挂载：`, ...evidenceAttached.map(x => `  - ${x}`)] : []),
    ...(extraEvidence.length ? [`额外证据留痕（本期未挂载到任务）：`, ...extraEvidence.map(x => `  - ${x}`)] : []),
    ...(blocked.length ? [`未完全处理：`, ...blocked.map(x => `  - ${x}`)] : []),
    '',
    '撤销/修正：删除已建任务用 /pm task delete <id>（操作经溯源账本留痕，不另建 undo）。',
  ].join('\n')
  return created.length
    ? { kind: 'success', text }
    : { kind: 'error', text: `没有任务成功落库：\n  - ${blocked.join('\n  - ')}` }
}

// ===== K3 attach-evidence：单条确认直挂证据（不改状态/排期）=====

async function handleAttachEvidence(taskId: string, urlRaw: string, domain: PmDomain | undefined): Promise<CommandResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  const task = getTask(domain, taskId)
  if (!task) return { kind: 'error', text: `未找到任务 ${taskId}` }

  let url: string
  try {
    url = normalizeEvidenceUrl(urlRaw)
  } catch (error) {
    if (error instanceof EvidenceUrlInvalidError) {
      return { kind: 'error', text: error.message }
    }
    throw error
  }

  const updated = await updateTask(domain, taskId, { evidenceUrl: url })
  if (!updated) return { kind: 'error', text: `任务 ${taskId} 更新失败，请重试。` }

  // 溯源：basis=被更新任务；projectId 从任务反查（attach-evidence 无独立项目参数）。
  const recMap = new Map<string, SourceRecord>()
  recMap.set(`tasks:${task.id}`, task as unknown as SourceRecord)
  const refs = buildSourceRefs({
    actions: [{ op: 'task.update', id: task.id }],
    records: recMap,
    snapshotVersion: CURRENT_SNAPSHOT_VERSION,
    ruleRevision: CURRENT_RULE_REVISION,
  })
  void recordProvenance(domain, {
    projectId: task.projectId,
    kind: 'capture',
    summary: `为任务 ${task.id} 补挂证据链接（attach-evidence，未改状态/排期）`,
    refs,
  })

  return {
    kind: 'success',
    text: [
      `已为任务 ${task.id}（${task.title}）挂载证据链接：${url}`,
      '仅更新 evidenceUrl，未改动状态/进度/排期；操作已记入溯源账本。',
      `如需替换证据：再次 /pm attach-evidence ${task.id} <新url> 覆盖即可（本期不提供清空证据的独立动作）。`,
    ].join('\n'),
  }
}

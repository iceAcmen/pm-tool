/**
 * B2 任务资料/进展「ops 信封」本地草稿会话（纯函数 + 会话，零写盘，不 import core）。
 *
 * 对齐 core/task-materials.ts AttachmentOp / ProgressOp / applyTaskDraftOps：
 * - create（task add）与 edit（task update）统一走 ops 信封，不使用 create-only raw 数组，
 *   以便 add* 的 clientId 别名被后续 progress.add.refs 前向引用（alias refs）。
 * - edit 仅追加 op journal，未提及的既有条目由后端原样保留（稳定 ID / revisions / deletedAt）。
 * - submit 单次命令：buildDraftOps 产出 { draft: { attachmentOps, progressOps } }，
 *   调用方与 basic 字段合并为一条 task add / task update；两区无改动返回 null（不发 draft 键）。
 *
 * 不做服务端完整重算（client 不重放 applyTaskDraftOps）；展示由表单呈现既有条目 + 暂存徽标。
 */

export interface AttachmentOp {
  op: 'addLink' | 'addDeliverable' | 'remove' | 'updateNote' | 'addFile'
  /** add* 临时别名（c-n），批内唯一，供 progress.add.refs 前向引用；禁止与 at-N 撞号。 */
  clientId?: string
  url?: string
  deliverableId?: string
  /** addFile：data 暂存 opaque stageId（32 hex），提交时由后端 prepareStage 提升为资产并挂接。 */
  stageId?: string
  /** remove / updateNote：目标既有资料项 at-N。 */
  id?: string
  title?: string
  note?: string
}

export interface ProgressOp {
  op: 'add' | 'edit' | 'delete' | 'restore'
  clientId?: string
  /** edit/delete/restore：目标既有进展 pl-N；add 忽略。 */
  id?: string
  author?: string
  content?: string
  /** add/edit：YYYY-MM-DD，缺省后端取当日。 */
  date?: string
  /** add：at-N 或前面 add* 的 clientId 别名；edit：精确替换本版 refs（不传不改）。 */
  refs?: string[]
}

export interface TaskDraftOps {
  attachmentOps?: AttachmentOp[]
  progressOps?: ProgressOp[]
}

export interface OpsValidation {
  ok: boolean
  errors: string[]
}

const HTTP_RE = /^https?:\/\//i
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export interface OpsSession {
  attachmentOps: AttachmentOp[]
  progressOps: ProgressOp[]
  addLink: (input: { url: string, title?: string, note?: string, clientId?: string }) => string
  addDeliverable: (input: { deliverableId: string, note?: string, clientId?: string }) => string
  addFile: (input: { stageId: string, note?: string, clientId?: string }) => string
  removeAttachment: (id: string) => void
  updateNote: (id: string, patch: { note?: string, title?: string }) => void
  /** 撤销某 clientId 别名对应的暂存 addFile（及同别名 add），用于移除已暂存文件。 */
  forgetClient: (clientId: string) => void
  addProgress: (input: { author: string, content: string, date?: string, refs?: string[] }) => void
  editProgress: (id: string, patch: { author?: string, content: string, date?: string, refs?: string[] }) => void
  deleteProgress: (id: string) => void
  restoreProgress: (id: string) => void
}

/** 新建空会话；clientId 别名自增 c-1、c-2…。 */
export function createOpsSession(): OpsSession {
  const attachmentOps: AttachmentOp[] = []
  const progressOps: ProgressOp[] = []
  let aliasSeq = 0
  const nextAlias = (explicit?: string): string => explicit ?? `c-${++aliasSeq}`

  return {
    attachmentOps,
    progressOps,
    addLink(input) {
      const clientId = nextAlias(input.clientId)
      const op: AttachmentOp = { op: 'addLink', url: input.url.trim(), clientId }
      if (input.title?.trim()) op.title = input.title.trim()
      if (input.note?.trim()) op.note = input.note.trim()
      attachmentOps.push(op)
      return clientId
    },
    addDeliverable(input) {
      const clientId = nextAlias(input.clientId)
      const op: AttachmentOp = { op: 'addDeliverable', deliverableId: input.deliverableId.trim(), clientId }
      if (input.note?.trim()) op.note = input.note.trim()
      attachmentOps.push(op)
      return clientId
    },
    addFile(input) {
      const clientId = nextAlias(input.clientId)
      const op: AttachmentOp = { op: 'addFile', stageId: input.stageId.trim(), clientId }
      if (input.note?.trim()) op.note = input.note.trim()
      attachmentOps.push(op)
      return clientId
    },
    forgetClient(clientId) {
      // 移除该别名的 add* 动作；同时级联剔除各 progress op refs 里对该别名的引用（不删进展本身）。
      for (let i = attachmentOps.length - 1; i >= 0; i--) {
        if (attachmentOps[i].clientId === clientId) attachmentOps.splice(i, 1)
      }
      for (let i = progressOps.length - 1; i >= 0; i--) {
        const op = progressOps[i]
        if (op.clientId === clientId) {
          progressOps.splice(i, 1)
          continue
        }
        if (Array.isArray(op.refs) && op.refs.includes(clientId)) {
          op.refs = op.refs.filter(r => r !== clientId)
        }
      }
    },
    removeAttachment(id) {
      attachmentOps.push({ op: 'remove', id })
    },
    updateNote(id, patch) {
      const op: AttachmentOp = { op: 'updateNote', id }
      if (patch.note !== undefined) op.note = patch.note.trim()
      if (patch.title !== undefined) op.title = patch.title.trim()
      attachmentOps.push(op)
    },
    addProgress(input) {
      const op: ProgressOp = { op: 'add', author: input.author.trim(), content: input.content.trim() }
      if (input.date?.trim()) op.date = input.date.trim()
      if (input.refs?.length) op.refs = [...input.refs]
      progressOps.push(op)
    },
    editProgress(id, patch) {
      const op: ProgressOp = { op: 'edit', id, content: patch.content.trim() }
      if (patch.author !== undefined) op.author = patch.author.trim()
      if (patch.date?.trim()) op.date = patch.date.trim()
      if (patch.refs !== undefined) op.refs = [...patch.refs]
      progressOps.push(op)
    },
    deleteProgress(id) {
      progressOps.push({ op: 'delete', id })
    },
    restoreProgress(id) {
      progressOps.push({ op: 'restore', id })
    },
  }
}

/** 逐条校验并收集全部错误；任一错误调用方整批零写、保留输入。 */
export function validateOps(attachmentOps: AttachmentOp[], progressOps: ProgressOp[]): OpsValidation {
  const errors: string[] = []
  attachmentOps.forEach((op, i) => {
    const at = `资料操作 ${i + 1}`
    if (op.op === 'addLink') {
      if (!HTTP_RE.test((op.url ?? '').trim())) errors.push(`${at}：链接须为 http(s) 地址`)
    } else if (op.op === 'addDeliverable') {
      if (!(op.deliverableId ?? '').trim()) errors.push(`${at}：缺少 deliverableId`)
    } else if (op.op === 'addFile') {
      if (!(op.stageId ?? '').trim()) errors.push(`${at}：addFile 缺少 stageId`)
    } else if (!op.id) {
      errors.push(`${at}：缺少目标条目 id（${op.op}）`)
    }
  })
  progressOps.forEach((op, i) => {
    const at = `进展操作 ${i + 1}`
    if (op.op === 'add') {
      if (!(op.author ?? '').trim()) errors.push(`${at}：作者不能为空`)
      if (!(op.content ?? '').trim()) errors.push(`${at}：正文不能为空`)
    } else if (op.op === 'edit') {
      if (!op.id) errors.push(`${at}：缺少目标进展 id`)
      if (!(op.content ?? '').trim()) errors.push(`${at}：正文不能为空`)
      if (op.author !== undefined && !op.author.trim()) errors.push(`${at}：作者不能为空`)
    } else {
      if (!op.id) errors.push(`${at}：缺少目标进展 id（${op.op}）`)
    }
    if (op.date && !ISO_DATE_RE.test(op.date.trim())) errors.push(`${at}：日期须为 YYYY-MM-DD`)
  })
  return { ok: errors.length === 0, errors }
}

/**
 * 组装 submit 的 draft 信封。两区 ops 全空返回 null（unchanged noops，不携带 draft 键）；
 * 只输出非空数组，省略空键。调用方合并 basic 字段后发单条命令。
 */
export function buildDraftOps(attachmentOps: AttachmentOp[], progressOps: ProgressOp[]): { draft: TaskDraftOps } | null {
  const draft: TaskDraftOps = {}
  if (attachmentOps.length > 0) draft.attachmentOps = attachmentOps
  if (progressOps.length > 0) draft.progressOps = progressOps
  if (!draft.attachmentOps && !draft.progressOps) return null
  return { draft }
}

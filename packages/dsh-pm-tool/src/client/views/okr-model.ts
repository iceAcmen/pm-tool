/**
 * P2 X7 愿景/OKR 层 · 前端只读展示纯模型（零 I/O、零写、零墙钟）。
 *
 * 仅做树形分组与软关联标注，不下裁决、不算权重归属；
 * 权重只按 primaryOkrId 单父归属（契约 §三.5），软关联行可见不计权重。
 * 本模块不读盘不写盘，快照数据由 panel 注入；收件区未携带时调用方仅显示命令提示。
 */
import { parseIdList } from '../form-validation.js'

/** 与 core/storage.ts okrRecordSchema 对齐的前端本地镜像（不 zod、不依赖存储层）。 */
export interface OkrViewRecord {
  id: string
  projectId: string
  title: string
  kind: 'objective' | 'key-result'
  /** 单父主归属：KR 的父 OKR；objective 为 null。 */
  primaryOkrId: string | null
  /** 软关联「关联目标」：可见不计权重。 */
  relatedOkrIds: string[]
  owner?: string
  targetDate?: string
  status: 'draft' | 'confirmed'
  /** 兼容补充描述（snapshot 全量下发；旧记录缺键时 undefined，编辑表单留空合法）。 */
  description?: string
}

/** 收件区建议（settings 条目 pmOkrInbox；未确认不自动生效）。 */
export interface OkrInboxSuggestion {
  id: string
  at: string
  projectId: string
  title: string
  kind: 'objective' | 'key-result'
  primaryOkrId?: string | null
  rationale?: string
  /** processed 态：confirmed=已采纳（保留在收件区，不再出待确认/不显示写按钮），ignored=已忽略；未处理为 undefined。 */
  state?: 'confirmed' | 'ignored'
}

export interface OkrTreeNode {
  record: OkrViewRecord
  /** 按 primaryOkrId 挂到本目标下的 KR（权重归属只认这一条）。 */
  children: OkrTreeNode[]
  /** 软关联行（related:true，可见不计权重），引用其他 OKR，不进入 children 权重组。 */
  related: OkrViewRecord[]
}

/** 未挂到任何 objective 的 KR（诚实单列，不强行挂父）。 */
export interface OrphanKrs {
  record: OkrViewRecord
  related: OkrViewRecord[]
}

export interface OkrTreeModel {
  roots: OkrTreeNode[]
  orphans: OrphanKrs[]
  /** 本项目 okr 记录总数（不含收件区建议）。 */
  total: number
}

/** 过滤本项目并构建树形：objective 为根，KR 按 primaryOkrId 挂父；软关联单独成列。 */
export function buildOkrTree(okrs: OkrViewRecord[], projectId: string): OkrTreeModel {
  const mine = okrs.filter(o => o.projectId === projectId)
  const byId = new Map(mine.map(o => [o.id, o]))
  const nodes = new Map<string, OkrTreeNode>()
  const getNode = (rec: OkrViewRecord): OkrTreeNode => {
    let n = nodes.get(rec.id)
    if (!n) {
      n = { record: rec, children: [], related: [] }
      nodes.set(rec.id, n)
    }
    return n
  }

  const roots: OkrTreeNode[] = []
  const orphans: OrphanKrs[] = []

  for (const rec of mine) {
    const node = getNode(rec)
    // 软关联行：引用存在的其他 OKR，仅标注，不进 children、不计权重。
    for (const relId of rec.relatedOkrIds ?? []) {
      const rel = byId.get(relId)
      if (rel) node.related.push(rel)
    }
    if (rec.kind === 'objective') {
      roots.push(node)
    } else if (rec.primaryOkrId && byId.has(rec.primaryOkrId)) {
      getNode(byId.get(rec.primaryOkrId)!).children.push(node)
    } else {
      // KR 无有效父目标：孤儿单列，不伪造归属。
      orphans.push({ record: rec, related: node.related })
    }
  }

  return { roots, orphans, total: mine.length }
}

/** 收件区待确认数：仅未处理（state===undefined）计入；confirmed 已采纳 / ignored 已忽略均不计。 */
export function countPendingInbox(inbox: OkrInboxSuggestion[] | undefined, projectId: string): number {
  if (!inbox) return 0
  return inbox.filter(s => s.projectId === projectId && s.state === undefined).length
}

/** 收件区建议按项目过滤；未携带（undefined）返回空数组，调用方据此只显示命令提示。 */
export function filterInbox(inbox: OkrInboxSuggestion[] | undefined, projectId: string): OkrInboxSuggestion[] {
  if (!inbox) return []
  return inbox.filter(s => s.projectId === projectId)
}

/** 状态徽章文案：draft=草稿（人触发定稿），confirmed=已定稿；前端不定稿、不下裁决。 */
export function okrStatusLabel(status: OkrViewRecord['status']): string {
  return status === 'confirmed' ? '已定稿' : '草稿'
}

// ===== D-12 / C-13 软关联保存前内联校验（格式拦截 + 未知 ID 就近说明，不落页面横幅） =====

/** 软关联 ID 合法格式：字母/数字/-/_（与后端 OKR ID 口径一致）。 */
const RELATED_ID_RE = /^[A-Za-z0-9_-]+$/

export interface RelatedIdsValidation {
  /** 无格式错（advisory 未知 ID 不阻塞，由后端复核）。 */
  ok: boolean
  /** 格式非法、必须修掉才能提交的 ID（阻塞提交）。 */
  blocking: string[]
  /** 格式合法但不在注入已知集内的 ID（就近说明，后端仍复核存在性）。 */
  advisory: string[]
  /** 单处呈现的内联错误文案（原因 + 影响声明 + 修复动作）；通过为空串。 */
  message: string
}

/**
 * 软关联 ID 保存前内联校验：逗号/中文逗号拆分去重；
 * - 格式非法 → blocking（拦截提交，不让错误落到页面横幅）；
 * - 不在注入已知集 → advisory（就近说明，前端不伪造存在性，后端仍复核）。
 * 说明口径固定：软关联仅展示引用、不计权重、不影响主归属。
 */
export function validateRelatedOkrIds(
  raw: string | undefined,
  knownIds: ReadonlySet<string>,
): RelatedIdsValidation {
  const tokens = parseIdList(raw)
  const blocking: string[] = []
  const advisory: string[] = []
  for (const token of tokens) {
    if (!RELATED_ID_RE.test(token)) blocking.push(token)
    else if (!knownIds.has(token)) advisory.push(token)
  }
  const parts: string[] = []
  if (blocking.length) parts.push(`格式非法：${blocking.join('、')}（ID 仅含字母/数字/-/_）`)
  if (advisory.length) parts.push(`未在本项目目标列表中找到：${advisory.join('、')}`)
  const message = parts.length
    ? `${parts.join('；')}。软关联仅展示引用、不计权重、不参与进度裁决，也不影响主归属；请从列表选择或移除该 ID，保存前后端仍会复核。`
    : ''
  return { ok: blocking.length === 0, blocking, advisory, message }
}

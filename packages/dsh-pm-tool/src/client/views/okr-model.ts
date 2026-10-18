/**
 * P2 X7 愿景/OKR 层 · 前端只读展示纯模型（零 I/O、零写、零墙钟）。
 *
 * 仅做树形分组与软关联标注，不下裁决、不算权重归属；
 * 权重只按 primaryOkrId 单父归属（契约 §三.5），软关联行可见不计权重。
 * 本模块不读盘不写盘，快照数据由 panel 注入；收件区未携带时调用方仅显示命令提示。
 */

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
  /** 已忽略（保留在收件区但标 ignored）；未处理为 undefined。 */
  state?: 'ignored'
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

/** 收件区待处理（未忽略）建议数；已忽略不计入待确认。 */
export function countPendingInbox(inbox: OkrInboxSuggestion[] | undefined, projectId: string): number {
  if (!inbox) return 0
  return inbox.filter(s => s.projectId === projectId && s.state !== 'ignored').length
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

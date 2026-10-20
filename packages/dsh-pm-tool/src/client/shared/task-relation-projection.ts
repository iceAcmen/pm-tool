/**
 * D-08/D-11 任务抽屉侧「关联概览」只读投影（C-10）。
 * 零 schema、只读、不回写：由现有 task.milestoneId / attachments 反查展示名称+短 ID，
 * 供抽屉只读展示与直达入口；无关联返回空，绝不伪造标题或创建记录。
 * 纯函数，不 import core，可离线单测。
 */

export interface RelationMilestone {
  id: string
  title: string
}

export interface RelationDeliverable {
  deliverableId: string
  name: string
  version?: string
}

/** 结构最小化的里程碑行（与 data.milestones 行兼容，不依赖全局类型）。 */
export interface ProjectionMilestoneRow {
  id: string
  title: string
}

/** 结构最小化的交付物选项行（与 deliverableOptions 兼容）。 */
export interface ProjectionDeliverableOption {
  id: string
  name: string
  version?: string
}

/** 结构最小化的任务附件（attachments 项兼容，含旧单键 deliverableId 兜底）。 */
export interface ProjectionAttachment {
  kind?: string
  deliverableId?: string | null
  frozenName?: string
  frozenVersion?: string
}

export interface ProjectionTaskLike {
  milestoneId?: string | null
  /** 旧单键关联（legacy），仍需兜底显示。 */
  deliverableId?: string | null
  attachments?: ProjectionAttachment[]
}

/**
 * 反查任务当前关联里程碑。命中返回 {id,title}；无关联/ID 缺失/清单查不到 → null。
 */
export function resolveLinkedMilestone(
  milestoneId: string | null | undefined,
  milestones: ProjectionMilestoneRow[],
): RelationMilestone | null {
  const id = (milestoneId ?? '').trim()
  if (!id) return null
  const hit = milestones.find(m => m.id === id)
  if (!hit) return null
  return { id: hit.id, title: hit.title }
}

/**
 * 反查任务关联交付物（冻结快照优先，缺失时回查选项台账补名称/版本）。
 * 仅 kind=deliverable；链接/文件不计入；无关联返回空数组。
 */
export function resolveLinkedDeliverables(
  task: ProjectionTaskLike,
  options: ProjectionDeliverableOption[],
): RelationDeliverable[] {
  const rows: Array<{ deliverableId: string; frozenName?: string; frozenVersion?: string }> = []
  for (const item of task.attachments ?? []) {
    if (item.kind !== 'deliverable') continue
    const deliverableId = (item.deliverableId ?? '').trim()
    if (!deliverableId) continue
    rows.push({
      deliverableId,
      frozenName: item.frozenName?.trim() || undefined,
      frozenVersion: item.frozenVersion?.trim() || undefined,
    })
  }
  // legacy 单键关联兜底（新数组已含则不重复）。
  const legacyId = (task.deliverableId ?? '').trim()
  if (legacyId && !rows.some(r => r.deliverableId === legacyId)) {
    rows.push({ deliverableId: legacyId })
  }

  const out: RelationDeliverable[] = []
  for (const row of rows) {
    const opt = options.find(o => o.id === row.deliverableId)
    const name = row.frozenName || opt?.name || ''
    if (!name) continue
    out.push({
      deliverableId: row.deliverableId,
      name,
      version: row.frozenVersion || opt?.version || undefined,
    })
  }
  return out
}

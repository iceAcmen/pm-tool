/**
 * R8 看板迁移反馈（纯函数，无 DOM / 无写盘副作用，便于单测）。
 *
 * 设计约束：
 * - 默认摘要只给 1–2 行白话（「已自动调整 N 张卡片，避免重叠或越界」），
 *   绝不把卡片 ID（w-*）/坐标塞进首屏；技术明细只进默认折叠的「详情」次级区。
 * - 不提供回滚/复原按钮：现有 history 仅保存后历史，不支持迁移前复原，放假按钮即误导。
 * - 已读/关闭态按「迁移签名」存 localStorage（调用方负责读写），同签名重进不复发，新签名重现。
 */

/** 详情默认折叠（组件初始态取此值；技术明细不默认占首屏）。 */
export const MIG_DETAIL_DEFAULT_OPEN = false

/** 白话摘要（不含 w-* / 坐标）。 */
export interface MigrationSummary {
  /** 首行白话：调整了几张卡、避免什么。 */
  title: string
  /** 第二行（可选）：未知/跳过卡片的白话说明。 */
  skippedNote?: string
}

/**
 * 由 sanitize 的 warnings（夹紧/下沉技术行）与 skipped（未知类型）生成白话摘要。
 * warnings 数量 = 被自动调整的卡片数；摘要不回显任何坐标或卡片 ID。
 */
export function buildMigrationSummary(warnings: string[], skipped: string[]): MigrationSummary {
  const adjusted = warnings.length
  const title = adjusted > 0
    ? `已自动调整 ${adjusted} 张卡片，避免重叠或越界`
    : '布局已安全校验，未改动卡片位置'
  const skippedNote = skipped.length > 0
    ? `已跳过 ${skipped.length} 个无法识别的卡片，其余卡片原样保留`
    : undefined
  return { title, skippedNote }
}

/** 稳定签名：内容（warnings + skipped）djb2 哈希，同输入恒定、不同输入可区分。 */
export function migrationSignature(warnings: string[], skipped: string[]): string {
  const raw = `${warnings.join('\n')}\n@@\n${skipped.join('\n')}`
  let h = 5381
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0
  }
  return 'mig-' + h.toString(36)
}

/** localStorage 已读表：{ [signature]: 1 }。 */
export type MigrationReadMap = Record<string, 1>

export function isMigrationRead(map: MigrationReadMap, sig: string): boolean {
  return map[sig] === 1
}

/** 返回新的已读表（不可变），把该签名标记为已读。 */
export function markMigrationRead(map: MigrationReadMap, sig: string): MigrationReadMap {
  return { ...map, [sig]: 1 }
}

/** 从 localStorage 安全解析已读表（损坏/非对象回退空表，绝不抛、不清整份）。 */
export function parseMigrationReadMap(raw: string | null): MigrationReadMap {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: MigrationReadMap = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof k === 'string' && v === 1) out[k] = 1
    }
    return out
  } catch {
    return {}
  }
}

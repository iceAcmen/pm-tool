/**
 * 短时幂等注册表（稳定性 S2）。
 *
 * 目标：把「ask-apply 一次成功确认」的幂等键以 60s 短 TTL 持久化到 pmtool settings 表，
 * 使跨重启 / 跨进程重复同一确认时直接返回「已执行」，而不是因任务 updatedAt 已被本
 * 次确认推进、再次比对基线而误报「他人已改」冲突。
 *
 * 安全与边界红线：
 *  - 只存最小标记：keyHash / scope / expiresAt / updatedAt / 可选 version；
 *    绝不存动作正文、patch、基线明文或任何可被当作授权的信息——本注册表不作授权。
 *  - 写盘与懒过期清理统一走 enqueueDomainWrite（与任务写同一条串行写队列）。
 *  - in-flight 并发去重仍是纯内存（不进本注册表、不落盘），由调用方自行维护。
 *  - settings 表是自由键值表（{ value, updatedAt } passthrough）；本注册表只占用
 *    一个固定行 id（askApplyIdempotency），与 aiModelMode 等其它 settings 键互不影响。
 */
import { createHash } from 'node:crypto'
import { enqueueDomainWrite } from './projects.js'
import type { PmDomain } from './storage.js'

/** 当前无账号体系时的默认 actor 段；未来不同 actor 不误去重。 */
export const IDEMPOTENCY_ACTOR_SEGMENT_DEFAULT = 'local-anonymous'

/** 成功幂等键短 TTL：60s。仅用于压住「刚确认完又重复点确认/重启重放」的窗口。 */
export const IDEMPOTENCY_TTL_MS = 60_000

/** settings 表内占用的行 id；与 aiModelMode 等并列，不新建表。 */
export const IDEMPOTENCY_SETTINGS_ROW = 'askApplyIdempotency'

/** 一条最小幂等标记（不含动作正文/敏感信息）。 */
export interface IdempotencyMarker {
  keyHash: string
  /** 作用域，例如 ask-apply:<projectId>:<actorSegment>。 */
  scope: string
  /** 过期时间戳（epoch ms）；过期即视为未登记。 */
  expiresAt: number
  /** 登记时间（ISO）。 */
  updatedAt: string
  /** 可选版本号，未来迭代用。 */
  version?: number
}

/** 幂等注册表抽象：调用方只依赖此接口，可替换为内存/其它后端。 */
export interface IdempotencyRegistry {
  /** 命中未过期标记则返回，否则 undefined（不作授权、不读动作正文）。 */
  check(keyHash: string, now?: number): IdempotencyMarker | undefined
  /** 登记/刷新一条成功标记；写盘与懒清理在串行写队列内完成。失败不抛出到业务主流程。 */
  record(input: IdempotencyRecordInput): Promise<void>
}

export interface IdempotencyRecordInput {
  keyHash: string
  scope: string
  expiresAt: number
  updatedAt?: string
  version?: number
}

/**
 * 由作用域分片计算稳定 keyHash。各分片以 \u0000 连接后取 SHA-256 hex。
 * 分片约定（调用方负责）：[projectId, actorSegment, canonicalActionsJson, canonicalBaselineJson]。
 * 只落盘这个 hash，不落分片原文（动作正文/基线）。
 */
export function hashScopeKey(parts: readonly string[]): string {
  return createHash('sha256').update(parts.join('\u0000')).digest('hex')
}

/** ask-apply 作用域字符串。 */
export function askApplyScope(projectId: string, actorSegment: string): string {
  return `ask-apply:${projectId}:${actorSegment}`
}

interface StoredMarker {
  scope?: unknown
  expiresAt?: unknown
  updatedAt?: unknown
  version?: unknown
}

interface StoredShape {
  markers?: Record<string, StoredMarker> | unknown
}

/** 安全读 settings 行内的 markers；任何畸形/缺失都退化为空表，绝不抛。 */
function readMarkers(domain: PmDomain): Record<string, StoredMarker> {
  const row = domain.table('settings').get(IDEMPOTENCY_SETTINGS_ROW) as { value?: unknown } | undefined
  const value = row?.value as StoredShape | undefined
  if (!value || typeof value !== 'object') return {}
  const markers = (value as StoredShape).markers
  if (!markers || typeof markers !== 'object') return {}
  return markers as Record<string, StoredMarker>
}

function toMarker(keyHash: string, m: StoredMarker): IdempotencyMarker {
  const marker: IdempotencyMarker = {
    keyHash,
    scope: typeof m.scope === 'string' ? m.scope : '',
    expiresAt: typeof m.expiresAt === 'number' ? m.expiresAt : 0,
    updatedAt: typeof m.updatedAt === 'string' ? m.updatedAt : '',
  }
  if (typeof m.version === 'number') marker.version = m.version
  return marker
}

/** 基于 pmtool settings 表的本地注册表实现。 */
export function createSettingsIdempotencyRegistry(domain: PmDomain): IdempotencyRegistry {
  return {
    check(keyHash, now = Date.now()) {
      const markers = readMarkers(domain)
      const m = markers[keyHash]
      if (!m) return undefined
      if (typeof m.expiresAt !== 'number' || m.expiresAt <= now) return undefined
      return toMarker(keyHash, m)
    },
    record(input) {
      return enqueueDomainWrite(domain, async () => {
        const markers = readMarkers(domain)
        const now = Date.now()
        // 懒清理：顺手淘汰已过期标记，避免 settings 行无限膨胀。
        for (const [k, m] of Object.entries(markers)) {
          if (typeof m?.expiresAt !== 'number' || m.expiresAt <= now) delete markers[k]
        }
        const next: StoredMarker = {
          scope: input.scope,
          expiresAt: input.expiresAt,
          updatedAt: input.updatedAt ?? new Date().toISOString(),
        }
        if (input.version !== undefined) next.version = input.version
        markers[input.keyHash] = next
        await domain.table('settings').put(IDEMPOTENCY_SETTINGS_ROW, {
          value: { markers },
          updatedAt: new Date().toISOString(),
        })
      })
    },
  }
}

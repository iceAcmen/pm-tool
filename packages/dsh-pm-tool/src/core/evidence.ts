/**
 * P0 K3 证据闭环：attach-evidence 纯逻辑（零网络、零随机、零墙钟，离线可测）。
 *
 * 边界：证据只挂任务的 evidenceUrl 字段，不自动改状态/进度/排期；
 * 不联网探测链接可达性，只做形状校验（http/https、长度上限）。
 * 落库由 commands/capture.ts 经既有 updateTask 领域路径完成，本模块不碰 domain。
 */

export class EvidenceUrlInvalidError extends Error {}

/** 证据链接长度上限，与 task.evidenceUrl（z.string().max(2048)）口径一致。 */
export const EVIDENCE_URL_MAX = 2048

/**
 * 归一化并校验证据 URL：trim、必须是 http/https、长度 ≤2048。
 * 合法返回 trim 后的字符串；非法抛 EvidenceUrlInvalidError（中文文案）。
 */
export function normalizeEvidenceUrl(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw new EvidenceUrlInvalidError('证据链接须为字符串。')
  }
  const url = raw.trim()
  if (!url) {
    throw new EvidenceUrlInvalidError('证据链接不能为空。')
  }
  if (url.length > EVIDENCE_URL_MAX) {
    throw new EvidenceUrlInvalidError(`证据链接过长（上限 ${EVIDENCE_URL_MAX} 字符）。`)
  }
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new EvidenceUrlInvalidError('证据链接不是合法 URL，请确认以 http:// 或 https:// 开头。')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new EvidenceUrlInvalidError('证据链接只支持 http/https 协议。')
  }
  return url
}

/** 纯谓词：是否为合法证据 URL（不抛错，供候选校验复用）。 */
export function isValidEvidenceUrl(raw: unknown): boolean {
  try {
    normalizeEvidenceUrl(raw)
    return true
  } catch {
    return false
  }
}

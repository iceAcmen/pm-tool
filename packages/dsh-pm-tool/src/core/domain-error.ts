/**
 * 把存储领域打开失败（invalid-record）格式化为面向用户的中文说明。
 * 只读取上游真实对象：DomainError.code/detail + zod(ZodError) cause.issues。
 * 只输出相对路径 pmtool/<table>/<key>.json，绝不暴露绝对路径或敏感目录。
 */

interface DomainErrorLike {
  code?: string
  detail?: { table?: string, key?: string }
  cause?: unknown
  message?: string
}

interface ZodIssueLike {
  path?: Array<string | number>
  message?: string
}

/** 在 cause 链上找到 invalid-record 的 DomainError。 */
function findInvalidRecord(err: unknown): DomainErrorLike | undefined {
  let cur = err as DomainErrorLike | undefined
  let depth = 0
  while (cur && depth < 6) {
    if (cur.code === 'invalid-record' && cur.detail) return cur
    cur = cur.cause as DomainErrorLike | undefined
    depth += 1
  }
  return undefined
}

function collectIssues(err: DomainErrorLike): ZodIssueLike[] {
  const cause = err.cause as { issues?: ZodIssueLike[] } | undefined
  return Array.isArray(cause?.issues) ? cause.issues : []
}

/**
 * 生成中文说明。坏记录原地保留、不自动修复；只指出位置与字段原因。
 */
export function formatDomainOpenError(error: unknown): string {
  const derr = findInvalidRecord(error)
  if (!derr) {
    const msg = error instanceof Error ? error.message : String(error)
    return `存储领域打开失败：${msg}（请检查 pm profile 的存储配置）。`
  }
  const table = derr.detail?.table || 'unknown'
  const key = derr.detail?.key || 'unknown'
  const rel = `pmtool/${table}/${key}.json`
  const issues = collectIssues(derr)
  const fieldLines = issues
    .slice(0, 5)
    .map(i => `字段 ${(i.path ?? []).join('.') || '(顶层)'}：${i.message || '未通过校验'}`)
    .join('；')
  const body = fieldLines ? `。原因：${fieldLines}` : ''
  return `记录 ${rel} 不符合当前 schema${body}。请人工修正后重开；本次不自动修复、不移动或隔离该记录。`
}

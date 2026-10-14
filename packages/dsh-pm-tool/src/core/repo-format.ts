/**
 * 仓库地址 / 分支名的纯格式口径（S3 单一真源）。
 *
 * 设计约束（稳定性矩阵 S3 / ADL）：
 * - 本模块**零依赖**：不 import zod、不 import Node 内置、不依赖 DOM；
 *   client/form-validation.ts 直接 import 本模块，正则/文案不抄第二份，
 *   且从结构上保证 zod/server 不被打进浏览器 bundle。
 * - project / task / deliverable 三级 + client 表单共用本模块；
 *   core/repo.ts 只在本模块之上包 zod schema（服务端专用，client 禁止直接 import）。
 * - 全程离线：只做格式白名单，绝不联网探测仓库可访问性。
 * - 未来协作（审计 scope/actor）仅在 schema 层预留 optional 位置，不改本模块口径。
 */

// 宽松 git/URL：http(s)://host/path、git://host/path、或 scp 形 git@host:org/repo.git。
export const repoUrlPattern = /^(https?:\/\/[^\s/$.?#].[^\s]*|git:\/\/[^\s/$.?#].[^\s]*|git@[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+(?:\/[^\s]*))$/
// branch：首字符字母/数字/点/下划线，后续可含字母数字点下划线斜杠连字符；≤64；禁空白与 git 危险符。
export const branchPattern = /^[A-Za-z0-9._][A-Za-z0-9._/-]{0,63}$/

/** 纯谓词（trim 后判定）：留空合法（可选字段）；填写即按白名单校验。 */
export function isValidRepoUrl(value: string | undefined): boolean {
  const v = (value ?? '').trim()
  return v === '' ? true : repoUrlPattern.test(v)
}

/** 纯谓词：同上，分支名白名单。 */
export function isValidBranch(value: string | undefined): boolean {
  const v = (value ?? '').trim()
  return v === '' ? true : branchPattern.test(v)
}

/** 共享中文错误文案：zod superRefine 与 client 表单逐字同源，三级复用、不得改写。 */
export const repoUrlInvalidMessage = '仓库地址需为 http(s)://、git:// 或 git@host:org/repo.git 形式'
export const branchInvalidMessage = '分支名需 ≤64 字符、不含空白与特殊符号（如 main、feature/x-1）'

/** describe*Validation 共享中文标签，避免 project / task / deliverable 三处各写一份。 */
export const repoFieldLabels: Record<string, string> = {
  repoUrl: '仓库地址（http(s)://、git:// 或 git@host:org/repo.git）',
  branch: '分支名（≤64 字符，不含空白与特殊符号）',
}

/** CLI help 共享句式：project/task/deliverable 复用，避免各写一份格式说明。 */
export const repoFieldHelpPhrase = 'repoUrl/branch 可选（http(s)://、git:// 或 git@host:org/repo.git；branch ≤64 字符），传空串即清除；全程离线不探测。'

/**
 * 浏览器安全纯校验：repoUrl/branch 一对可选字段。
 * 留空合法；任一填写即按白名单校验。通过返回 `{}`；键固定 'repoUrl' / 'branch'，
 * 便于 <input name> 与 aria-describedby 关联。zod 层 validateRepoRelation 同文案。
 */
export function repoFieldErrorsPure(
  repoUrl: string | undefined,
  branch: string | undefined,
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!isValidRepoUrl(repoUrl)) errors.repoUrl = repoUrlInvalidMessage
  if (!isValidBranch(branch)) errors.branch = branchInvalidMessage
  return errors
}

/** 落盘前归一：trim 后为空串的 repoUrl/branch 从记录删除该键，不写空串污染 v2 记录。 */
export function omitEmptyRepoKeys(input: Record<string, unknown>): void {
  if (input.repoUrl === '') delete input.repoUrl
  if (input.branch === '') delete input.branch
}

/**
 * 三级 CLI 共享渲染：repoUrl 有值时拼 `repoUrl[@branch]`（trim 后）；无 repoUrl 返回 ''。
 * 命令层再 `` `仓库：${formatRepoRef(value) || '未填写'}` ``，保证 project/task/deliverable 同形。
 */
export function formatRepoRef(value: { repoUrl?: string, branch?: string }): string {
  const url = (value.repoUrl ?? '').trim()
  if (!url) return ''
  const br = (value.branch ?? '').trim()
  return br ? `${url}@${br}` : url
}

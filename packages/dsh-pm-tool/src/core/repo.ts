/**
 * 仓库地址 / 分支名的共享校验口径（PROD-21 项目级口径，v0.7 扩到任务、交付物两级）。
 * project / task / deliverable 三级必须复用本模块，禁止各抄一份正则，避免口径漂移。
 * 全程离线：只做格式白名单，绝不联网探测仓库可访问性。
 */
import { z } from 'zod'

// 宽松 git/URL：http(s)://host/path、git://host/path、或 scp 形 git@host:org/repo.git。
export const repoUrlPattern = /^(https?:\/\/[^\s/$.?#].[^\s]*|git:\/\/[^\s/$.?#].[^\s]*|git@[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+(?:\/[^\s]*))$/
// branch：首字符字母/数字/点/下划线，后续可含字母数字点下划线斜杠连字符；≤64；禁空白与 git 危险符。
export const branchPattern = /^[A-Za-z0-9._][A-Za-z0-9._/-]{0,63}$/

/** 可选字段声明：trim 后缺省即空（v1 / 旧记录无此两键照常读取，不触发迁移重写）。 */
export const repoUrlFieldSchema = z.string().trim().optional()
export const branchFieldSchema = z.string().trim().optional()

/**
 * superRefine 校验：repoUrl / branch 任一非空即按共享白名单校验。
 * issue 路径与中文文案沿用项目级既有口径，三级一致、不得改写。
 */
export function validateRepoRelation(
  value: { repoUrl?: string, branch?: string },
  context: z.RefinementCtx,
): void {
  if (value.repoUrl && !repoUrlPattern.test(value.repoUrl)) {
    context.addIssue({ code: 'custom', path: ['repoUrl'], message: '仓库地址需为 http(s)://、git:// 或 git@host:org/repo.git 形式' })
  }
  if (value.branch && !branchPattern.test(value.branch)) {
    context.addIssue({ code: 'custom', path: ['branch'], message: '分支名需 ≤64 字符、不含空白与特殊符号（如 main、feature/x-1）' })
  }
}

/** 落盘前归一：trim 后为空串的 repoUrl/branch 从记录删除该键，不写空串污染 v2 记录。 */
export function omitEmptyRepoKeys(input: Record<string, unknown>): void {
  if (input.repoUrl === '') delete input.repoUrl
  if (input.branch === '') delete input.branch
}

/** describe*Validation 共享中文标签，避免 project / task / deliverable 三处各写一份。 */
export const repoFieldLabels: Record<string, string> = {
  repoUrl: '仓库地址（http(s)://、git:// 或 git@host:org/repo.git）',
  branch: '分支名（≤64 字符，不含空白与特殊符号）',
}

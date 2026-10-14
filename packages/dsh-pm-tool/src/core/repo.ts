/**
 * 仓库地址 / 分支名的 zod schema 层（服务端专用）。
 *
 * S3 拆分：正则 / 纯谓词 / 中文文案 / 标签 / 渲染 helper 全部在 ./repo-format.js
 * （零依赖、浏览器安全）；本文件只在其上包 zod optional schema 与 superRefine。
 * **client 禁止直接 import 本文件**（会把 zod 拉进浏览器 bundle）——
 * client/form-validation.ts 只能 import ./repo-format.js。
 */
import { z } from 'zod'
import {
  branchInvalidMessage,
  branchPattern,
  omitEmptyRepoKeys,
  repoFieldLabels,
  repoUrlInvalidMessage,
  repoUrlPattern,
} from './repo-format.js'

// 保持既有命名导出不变：core/project.ts、task.ts、deliverable.ts 从本文件取用。
export { branchPattern, omitEmptyRepoKeys, repoFieldLabels, repoUrlPattern }

/** 可选字段声明：trim 后缺省即空（v1 / 旧记录无此两键照常读取，不触发迁移重写）。 */
export const repoUrlFieldSchema = z.string().trim().optional()
export const branchFieldSchema = z.string().trim().optional()

/**
 * superRefine 校验：repoUrl / branch 任一非空即按共享白名单校验。
 * issue 文案直接引用 repo-format 真源中文，三级一致、不得改写。
 */
export function validateRepoRelation(
  value: { repoUrl?: string, branch?: string },
  context: z.RefinementCtx,
): void {
  if (value.repoUrl && !repoUrlPattern.test(value.repoUrl)) {
    context.addIssue({ code: 'custom', path: ['repoUrl'], message: repoUrlInvalidMessage })
  }
  if (value.branch && !branchPattern.test(value.branch)) {
    context.addIssue({ code: 'custom', path: ['branch'], message: branchInvalidMessage })
  }
}

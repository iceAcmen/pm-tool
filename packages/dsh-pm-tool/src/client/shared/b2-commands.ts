/**
 * B2 资料区 / 进展日志命令构造与校验（纯函数，无 React、不发命令）。
 *
 * 命令面（core commands/material.ts、commands/progress.ts，权威）：
 *   /pm material link      <taskId> {"url","title?","note?"}
 *   /pm material deliverable <taskId> {"deliverableId","note?"}
 *   /pm material remove    <taskId> <at-id>
 *   /pm progress add       <taskId> {"author","content","date?","refs?"}
 *   /pm progress edit      <taskId> <pl-id> {"content","author"}
 *   /pm progress delete    <taskId> <pl-id>      （软删，revision 全保留）
 *   /pm progress restore    <taskId> <pl-id>
 *
 * 边界：本模块只拼命令串与做前端前置校验；真正校验/零写/原子落库在 core，
 * 前端校验失败不调用 run()，命令返回 error 时由调用方保输入、不关抽屉。
 */
import { safeHref } from './markdown.js'

export interface B2LinkInput {
  url: string
  title?: string
  note?: string
}

export interface B2DeliverableInput {
  deliverableId: string
  note?: string
}

export interface B2ProgressAddInput {
  author: string
  content: string
  date?: string
  refs?: string[]
}

export interface B2ProgressEditInput {
  author: string
  content: string
}

/** 链接前置校验：仅 http/https、无控制字符/空白夹带（与 core evidence 口径一致）。 */
export function b2LinkValid(url: string): boolean {
  return safeHref(url) !== null
}

/** 进展作者非空（trim 后），不隐式填本人。 */
export function b2AuthorValid(author: string): boolean {
  return author.trim().length > 0
}

/** 进展正文非空（trim 后）。 */
export function b2ContentValid(content: string): boolean {
  return content.trim().length > 0
}

function compactJson(value: unknown): string {
  return JSON.stringify(value)
}

function cleanOptional(value: string | undefined): string | undefined {
  const v = value?.trim()
  return v ? v : undefined
}

export function b2LinkPayload(input: B2LinkInput): Record<string, unknown> {
  const payload: Record<string, unknown> = { url: input.url.trim() }
  const title = cleanOptional(input.title)
  const note = cleanOptional(input.note)
  if (title) payload.title = title
  if (note) payload.note = note
  return payload
}

export function b2DeliverablePayload(input: B2DeliverableInput): Record<string, unknown> {
  const payload: Record<string, unknown> = { deliverableId: input.deliverableId.trim() }
  const note = cleanOptional(input.note)
  if (note) payload.note = note
  return payload
}

export function b2ProgressAddPayload(input: B2ProgressAddInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    author: input.author.trim(),
    content: input.content.trim(),
  }
  const date = cleanOptional(input.date)
  if (date) payload.date = date
  if (input.refs && input.refs.length) payload.refs = input.refs.slice()
  return payload
}

export function b2ProgressEditPayload(input: B2ProgressEditInput): Record<string, unknown> {
  return { author: input.author.trim(), content: input.content.trim() }
}

/* ---------------- 命令串构造（供 panel run() 调用） ---------------- */

export function materialLinkCmd(taskId: string, input: B2LinkInput): string {
  return `material link ${taskId} ${compactJson(b2LinkPayload(input))}`
}

export function materialDeliverableCmd(taskId: string, input: B2DeliverableInput): string {
  return `material deliverable ${taskId} ${compactJson(b2DeliverablePayload(input))}`
}

export function materialRemoveCmd(taskId: string, attachmentId: string): string {
  return `material remove ${taskId} ${attachmentId.trim()}`
}

export function progressAddCmd(taskId: string, input: B2ProgressAddInput): string {
  return `progress add ${taskId} ${compactJson(b2ProgressAddPayload(input))}`
}

export function progressEditCmd(taskId: string, entryId: string, input: B2ProgressEditInput): string {
  return `progress edit ${taskId} ${entryId.trim()} ${compactJson(b2ProgressEditPayload(input))}`
}

export function progressDeleteCmd(taskId: string, entryId: string): string {
  return `progress delete ${taskId} ${entryId.trim()}`
}

export function progressRestoreCmd(taskId: string, entryId: string): string {
  return `progress restore ${taskId} ${entryId.trim()}`
}

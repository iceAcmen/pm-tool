/**
 * R12 Markdown 任务表离线导入：把 GitHub 风格缩进勾选清单（- [ ] / - [x]）
 * 还原为 WBS 父子树，复用既有 addTask 的编号、父级校验与落盘能力。
 *
 * 纯离线、确定性，不依赖 skill-office / LibreOffice。[x] 记为已完成（progress=100）。
 * 无 confirm 仅解析并预览将创建的任务（dry-run），不落盘；带 confirm 才写入。
 */
import { addTask } from './tasks.js'
import { getProject } from './projects.js'
import { projectIdSchema } from './project.js'
import type { PmDomain } from './storage.js'

export class TaskImportNoProjectError extends Error {}
export class TaskImportEmptyError extends Error {}

/** 解析后的一个勾选清单项。 */
export interface ImportItem {
  depth: number
  title: string
  done: boolean
}

const CHECKBOX_LINE = /^(\s*)- \[([ xX])\]\s+(\S.*?)\s*$/

/**
 * 解析 Markdown 文本为勾选清单项序列。
 * 缩进层级按观测到的最小缩进步长归一化（兼容 2 空格或 4 空格）；非勾选行忽略。
 */
export function parseTaskChecklist(markdown: string): ImportItem[] {
  const lines = markdown.split(/\r?\n/)
  const raw: { indent: number, done: boolean, title: string }[] = []
  for (const line of lines) {
    const match = CHECKBOX_LINE.exec(line)
    if (!match) continue
    const indent = match[1].length
    raw.push({ indent, done: match[2].toLowerCase() === 'x', title: match[3] })
  }
  if (!raw.length) return []

  // 以最小正缩进作为一个层级单位，避免 2/4 空格风格差异导致层级错位。
  const positiveIndents = raw.map(item => item.indent).filter(indent => indent > 0)
  const unit = positiveIndents.length ? Math.min(...positiveIndents) : 2
  return raw.map(item => ({
    depth: item.indent === 0 ? 0 : Math.max(1, Math.round(item.indent / unit)),
    done: item.done,
    title: item.title,
  }))
}

/** 为预览计算每个清单项的「投影 WBS 编号」（1、1.1、1.2 …），与既有任务无关。 */
function projectedOutline(items: ImportItem[]): { depth: number, code: string, title: string, done: boolean }[] {
  const counters: number[] = []
  return items.map(item => {
    counters.length = item.depth + 1
    counters[item.depth] = (counters[item.depth] ?? 0) + 1
    return {
      depth: item.depth,
      code: counters.slice(0, item.depth + 1).join('.'),
      title: item.title,
      done: item.done,
    }
  })
}

export interface TaskImportPlan {
  projectId: string
  total: number
  done: number
  outline: { depth: number, code: string, title: string, done: boolean }[]
}

function ensureProject(domain: PmDomain, projectId: string): void {
  projectIdSchema.parse(projectId)
  if (!getProject(domain, projectId)) {
    throw new TaskImportNoProjectError(`未找到项目：${projectId}`)
  }
}

/** 解析并预览将创建的任务树（dry-run，不写盘）。 */
export function planTaskImport(domain: PmDomain, projectId: string, markdown: string): TaskImportPlan {
  ensureProject(domain, projectId)
  const items = parseTaskChecklist(markdown)
  if (!items.length) {
    throw new TaskImportEmptyError('未在文件中找到 GitHub 风格勾选清单（形如 "- [ ] 任务标题" 或 "- [x] 已完成任务"）')
  }
  return {
    projectId,
    total: items.length,
    done: items.filter(item => item.done).length,
    outline: projectedOutline(items),
  }
}

/** 真正导入：按文档顺序用缩进栈还原父子关系，逐项复用 addTask 建任务。 */
export async function importTasksFromMarkdown(
  domain: PmDomain,
  projectId: string,
  markdown: string,
): Promise<{ id: string, code: string, title: string, done: boolean }[]> {
  ensureProject(domain, projectId)
  const items = parseTaskChecklist(markdown)
  if (!items.length) {
    throw new TaskImportEmptyError('未在文件中找到 GitHub 风格勾选清单（形如 "- [ ] 任务标题" 或 "- [x] 已完成任务"）')
  }

  const created: { id: string, code: string, title: string, done: boolean }[] = []
  // 缩进栈：栈顶是当前最近的父任务；新项深度更浅时弹出对应层级。
  const stack: { depth: number, id: string }[] = []
  for (const item of items) {
    while (stack.length && stack[stack.length - 1].depth >= item.depth) stack.pop()
    const parentId = stack.length ? stack[stack.length - 1].id : null
    const task = await addTask(domain, {
      projectId,
      parentId,
      title: item.title,
      status: item.done ? 'done' : 'todo',
      progress: item.done ? 100 : 0,
    })
    stack.push({ depth: item.depth, id: task.id })
    created.push({ id: task.id, code: task.code, title: task.title, done: item.done })
  }
  return created
}

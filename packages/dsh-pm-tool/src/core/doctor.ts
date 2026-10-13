/**
 * PROD-崩溃恢复 · /pm doctor：只读体检。只报告、不自动修复、不移动坏记录。
 *
 * 扫描加载后的领域表做确定性引用一致性检查：
 *   - 孤儿 parentId（指向不存在的父任务）
 *   - parent 跨项目
 *   - 悬空 milestoneId
 *   - 悬空 / 自指 / 成环 predecessorIds
 *   - 悬空 projectId（任务/里程碑/风险/会议/汇报/交付物指向不存在项目）
 * 外加 strayTmpFiles：扫描表目录残留的 `.*.tmp` 临时文件（崩溃尾巴）。
 *
 * 本模块绝不写盘、绝不删除、绝不改写任何记录；修复必须由用户显式确认。
 */
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { PmDomain } from './storage.js'

export type DoctorKind =
  | 'dangling-parent'
  | 'parent-cross-project'
  | 'dangling-milestone'
  | 'dangling-predecessor'
  | 'self-predecessor'
  | 'predecessor-cycle'
  | 'dangling-project'
  | 'stray-tmp'

export interface DoctorFinding {
  severity: 'error' | 'warning'
  kind: DoctorKind
  table: string
  id: string
  field: string
  message: string
}

export function runDoctor(domain: PmDomain): DoctorFinding[] {
  const findings: DoctorFinding[] = []
  const tasks = [...domain.table('tasks').entries()].map(([, t]) => t)
  const byId = new Map(tasks.map(t => [t.id, t]))
  const projects = new Set([...domain.table('projects').keys()])
  const milestones = new Set([...domain.table('milestones').keys()])

  const checkProjectRef = (table: string, rows: { id: string, projectId: string }[]): void => {
    for (const row of rows) {
      if (!projects.has(row.projectId)) {
        findings.push({ severity: 'error', kind: 'dangling-project', table, id: row.id, field: 'projectId',
          message: `${table} ${row.id} 指向不存在的项目 ${row.projectId}` })
      }
    }
  }
  checkProjectRef('milestones', [...domain.table('milestones').entries()].map(([, m]) => m as { id: string, projectId: string }))
  checkProjectRef('risk_issues', [...domain.table('risk_issues').entries()].map(([, r]) => r as { id: string, projectId: string }))
  checkProjectRef('meetings', [...domain.table('meetings').entries()].map(([, r]) => r as { id: string, projectId: string }))
  checkProjectRef('reports', [...domain.table('reports').entries()].map(([, r]) => r as { id: string, projectId: string }))
  checkProjectRef('deliverables', [...domain.table('deliverables').entries()].map(([, r]) => r as { id: string, projectId: string }))
  checkProjectRef('tasks', tasks as { id: string, projectId: string }[])

  // predecessor 成环检测（对每条任务沿其 predecessorIds 判环）。
  const hasCycle = (start: string): boolean => {
    const seen = new Set<string>()
    const queue = [...(byId.get(start)?.predecessorIds ?? [])]
    while (queue.length) {
      const cur = queue.shift()!
      if (cur === start) return true
      if (seen.has(cur)) continue
      seen.add(cur)
      for (const next of byId.get(cur)?.predecessorIds ?? []) queue.push(next)
    }
    return false
  }

  for (const task of tasks) {
    if (task.parentId) {
      const parent = byId.get(task.parentId)
      if (!parent) {
        findings.push({ severity: 'error', kind: 'dangling-parent', table: 'tasks', id: task.id, field: 'parentId',
          message: `任务 ${task.id} 的父任务 ${task.parentId} 不存在` })
      } else if (parent.projectId !== task.projectId) {
        findings.push({ severity: 'error', kind: 'parent-cross-project', table: 'tasks', id: task.id, field: 'parentId',
          message: `任务 ${task.id} 的父任务 ${task.parentId} 与当前项目不一致` })
      }
    }
    if (task.milestoneId && !milestones.has(task.milestoneId)) {
      findings.push({ severity: 'error', kind: 'dangling-milestone', table: 'tasks', id: task.id, field: 'milestoneId',
        message: `任务 ${task.id} 关联的里程碑 ${task.milestoneId} 不存在` })
    }
    for (const pid of task.predecessorIds ?? []) {
      if (pid === task.id) {
        findings.push({ severity: 'error', kind: 'self-predecessor', table: 'tasks', id: task.id, field: 'predecessorIds',
          message: `任务 ${task.id} 把自己列为前置依赖` })
        continue
      }
      const pre = byId.get(pid)
      if (!pre) {
        findings.push({ severity: 'error', kind: 'dangling-predecessor', table: 'tasks', id: task.id, field: 'predecessorIds',
          message: `任务 ${task.id} 的前置依赖 ${pid} 不存在` })
      } else if (pre.projectId !== task.projectId) {
        findings.push({ severity: 'warning', kind: 'dangling-predecessor', table: 'tasks', id: task.id, field: 'predecessorIds',
          message: `任务 ${task.id} 的前置依赖 ${pid} 与当前项目不一致` })
      }
    }
    if ((task.predecessorIds ?? []).length && hasCycle(task.id)) {
      findings.push({ severity: 'error', kind: 'predecessor-cycle', table: 'tasks', id: task.id, field: 'predecessorIds',
        message: `任务 ${task.id} 的前置依赖存在循环` })
    }
  }

  // 确定性排序，避免遍历顺序影响输出。
  findings.sort((a, b) =>
    a.kind.localeCompare(b.kind) || a.table.localeCompare(b.table) || a.id.localeCompare(b.id) || a.field.localeCompare(b.field))
  return findings
}

/**
 * 扫描 pmtool 数据根下残留的 `.*.tmp` 临时文件（per-record 原子写的崩溃尾巴）。
 * 只读列举，不删除。root 为 JsonStorageBackend 的根（其下 pmtool/ 为领域目录）。
 */
export async function strayTmpFiles(root: string): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string): Promise<void> {
    let entries: import('node:fs').Dirent[]
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) await walk(full)
      else if (entry.name.startsWith('.') && entry.name.endsWith('.tmp')) out.push(full)
    }
  }
  await walk(join(root, 'pmtool'))
  return out.sort()
}

/** 渲染为中文文本（命令输出用）。 */
export function renderDoctor(findings: DoctorFinding[], strayTmp: string[]): string {
  const lines: string[] = []
  if (!findings.length && !strayTmp.length) {
    return '体检通过：未发现悬空引用或不一致。'
  }
  if (findings.length) {
    lines.push(`发现 ${findings.length} 条引用一致性问题（仅报告，未自动修改）：`)
    for (const f of findings) lines.push(`  [${f.severity === 'error' ? '错误' : '警告'}] ${f.message}`)
  }
  if (strayTmp.length) {
    lines.push(`发现 ${strayTmp.length} 个残留临时文件（未自动清理）：`)
    for (const p of strayTmp) lines.push(`  ${p}`)
  }
  lines.push('如需修复，请在对应任务/项目中显式解除引用后重跑。')
  return lines.join('\n')
}

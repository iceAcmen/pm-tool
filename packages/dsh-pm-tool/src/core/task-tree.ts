/**
 * PROD-01：任务树构建（纯函数，无 React/无 DOM，可离线单测）。
 *
 * 输入扁平任务列表（含 id/parentId/code/order），输出按 WBS 父子树缩进、
 * 同层按 code 排序的可见行序列；支持折叠某父任务后其后代隐藏。
 * 孤立任务（parentId 指向不存在、或无父）作为根任务顶格展示。
 */

export interface TreeTask {
  id: string
  parentId?: string | null
  code?: string
  order?: number
}

export interface TreeRow<T = TreeTask> {
  task: T
  depth: number
  hasChildren: boolean
  childIds: string[]
}

const codeRank = (a: TreeTask, b: TreeTask) =>
  String(a.code ?? '').localeCompare(String(b.code ?? ''), 'en', { numeric: true })

/** 建树：返回按 (parentId|根) 分组的 children id 列表。 */
export function indexChildren<T extends TreeTask>(tasks: T[]): Map<string, string[]> {
  const byId = new Map(tasks.map(t => [t.id, t]))
  const children = new Map<string, string[]>()
  const roots: string[] = []
  for (const t of tasks) {
    const pid = t.parentId && byId.has(t.parentId) ? t.parentId : null
    if (pid) {
      if (!children.has(pid)) children.set(pid, [])
      children.get(pid)!.push(t.id)
    } else {
      roots.push(t.id)
    }
  }
  // 每个分组按 code 排序
  const idOf = (id: string) => byId.get(id)!
  for (const [pid, list] of children) list.sort((a, b) => codeRank(idOf(a), idOf(b)))
  roots.sort((a, b) => codeRank(idOf(a), idOf(b)))
  children.set('__root__', roots)
  return children
}

/**
 * 输出可见行序列（前序遍历）。collapsed 为折叠的父任务 id 集合，
 * 其直接/间接后代不出现在结果中。
 */
export function flattenVisible<T extends TreeTask>(tasks: T[], collapsed: Set<string> = new Set()): TreeRow<T>[] {
  const byId = new Map<string, T>(tasks.map(t => [t.id, t]))
  const children = indexChildren(tasks)
  const rows: TreeRow<T>[] = []
  const walk = (id: string, depth: number) => {
    const task = byId.get(id)
    if (!task) return
    const kids = children.get(id) ?? []
    rows.push({ task, depth, hasChildren: kids.length > 0, childIds: kids })
    if (!collapsed.has(id)) {
      for (const kid of kids) walk(kid, depth + 1)
    }
  }
  for (const root of children.get('__root__') ?? []) walk(root, 0)
  return rows
}

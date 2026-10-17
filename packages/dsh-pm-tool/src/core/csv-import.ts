/**
 * T2-C 纯 JS 离线 CSV 任务导入（替代被裁的 LibreOffice Excel 方案）。
 * 约定表头（中文，列顺序任意，按表头名匹配）：层级 / 标题 / 负责人 / 优先级 / 开始 / 截止 / 进度。
 * 纯离线、确定性，复用 addTask 的编号、父子校验与落盘。无 confirm 只预览不落盘。
 */
import { readFileSync } from 'node:fs'
import { addTask } from './tasks.js'
import { getProject } from './projects.js'
import { projectIdSchema } from './project.js'
import { parseProgressInput } from './task-inline.js'
import type { PmDomain } from './storage.js'

export class CsvImportError extends Error {}

export interface CsvRow {
  depth: number
  title: string
  assignee?: string
  priority?: string
  startDate?: string
  dueDate?: string
  progress?: number
}

/** 轻量 CSV 解析：支持引号包裹、转义双引号、逗号内逗号、CRLF。 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  const chars = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (inQuotes) {
      if (ch === '"') {
        if (chars[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') { inQuotes = true; continue }
    if (ch === ',') { row.push(field); field = ''; continue }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && chars[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

const HEADER_MAP: Record<string, keyof CsvRow> = {
  '层级': 'depth', '深度': 'depth', 'level': 'depth',
  '标题': 'title', '任务': 'title', '任务标题': 'title', 'title': 'title',
  '负责人': 'assignee', '指派': 'assignee', 'assignee': 'assignee', 'owner': 'assignee',
  '优先级': 'priority', 'priority': 'priority',
  '开始': 'startDate', '开始日期': 'startDate', 'start': 'startDate',
  '截止': 'dueDate', '截止日期': 'dueDate', 'due': 'dueDate', 'end': 'dueDate',
  '进度': 'progress', '完成度': 'progress', 'progress': 'progress',
}

/** 把 CSV 文本解析为结构化行序列。表头必须含「标题」。 */
export function parseCsvTasks(text: string): CsvRow[] {
  const grid = parseCsv(text)
  if (grid.length < 2) throw new CsvImportError('CSV 至少需要一行表头和一行数据')
  const header = grid[0].map(h => h.trim())
  const colIndex = new Map<keyof CsvRow, number>()
  header.forEach((h, idx) => {
    const key = HEADER_MAP[h] || HEADER_MAP[h.toLowerCase?.()]
    if (key && !colIndex.has(key)) colIndex.set(key, idx)
  })
  if (!colIndex.has('title')) {
    throw new CsvImportError('CSV 表头缺少「标题」列；约定表头：层级/标题/负责人/优先级/开始/截止/进度')
  }
  const rows: CsvRow[] = []
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r]
    const title = (cells[colIndex.get('title')!] ?? '').trim()
    if (!title) continue
    const depthRaw = colIndex.has('depth') ? (cells[colIndex.get('depth')!] ?? '').trim() : ''
    const progressRaw = colIndex.has('progress') ? (cells[colIndex.get('progress')!] ?? '').trim() : ''
    rows.push({
      depth: depthRaw ? Math.max(0, parseInt(depthRaw, 10) - 1) : 0,
      title,
      assignee: cell(cells, colIndex.get('assignee')),
      priority: cell(cells, colIndex.get('priority')),
      startDate: cell(cells, colIndex.get('startDate')),
      dueDate: cell(cells, colIndex.get('dueDate')),
      // CSV 专属 "80%" 写法：先去尾百分号，再交共享的 parseProgressInput（纯数值语义）。
      progress: progressRaw ? parseProgressInput(progressRaw.replace(/%$/, '')) : undefined,
    })
  }
  if (!rows.length) throw new CsvImportError('CSV 中没有可导入的数据行')
  return rows
}

function cell(cells: string[], idx: number | undefined): string | undefined {
  if (idx == null) return undefined
  const v = (cells[idx] ?? '').trim()
  return v || undefined
}

function ensureProject(domain: PmDomain, projectId: string): void {
  projectIdSchema.parse(projectId)
  if (!getProject(domain, projectId)) throw new CsvImportError(`未找到项目：${projectId}`)
}

/** 预览：计算投影 WBS 编号（与既有任务无关）。 */
export function planCsvImport(domain: PmDomain, projectId: string, csv: string): { total: number, outline: { depth: number, code: string, title: string }[] } {
  return planGridCsvImport(domain, projectId, parseCsv(csv))
}

/** 真正导入：缩进栈还原父子，逐项 addTask（带负责人/截止/进度）。 */
export async function importTasksFromCsv(
  domain: PmDomain,
  projectId: string,
  csv: string,
): Promise<{ id: string, code: string, title: string }[]> {
  return importTasksFromGrid(domain, projectId, parseCsv(csv))
}

export function readCsvFile(path: string): string {
  return readFileSync(path, 'utf8')
}

/** 用 SheetJS（命令侧/node，不进 client bundle）读取 .xlsx 首个工作表为二维字符串数组。 */
export async function readXlsxGrid(path: string): Promise<string[][]> {
  let mod: typeof import('xlsx')
  try {
    mod = (await import('xlsx')) as typeof import('xlsx')
  } catch (error) {
    throw new CsvImportError(`未能加载 xlsx 解析库：${error instanceof Error ? error.message : String(error)}`)
  }
  const XLSX = (mod as unknown as { readFile?: unknown }).readFile ? mod : (mod as unknown as { default: typeof import('xlsx') }).default
  const wb = XLSX.readFile(path, { type: 'file' })
  const first = wb.SheetNames[0]
  if (!first) throw new CsvImportError('xlsx 文件中没有工作表')
  const sheet = wb.Sheets[first]
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' })
  return grid.map(row => row.map(cell => (cell == null ? '' : String(cell)).trim()))
}

/** OPT-12：直接从 buffer/array 解析 xlsx 首表（供网页上传，不经服务端路径）。 */
export async function readXlsxGridFromBuffer(data: ArrayBuffer | Uint8Array): Promise<string[][]> {
  let mod: typeof import('xlsx')
  try {
    mod = (await import('xlsx')) as typeof import('xlsx')
  } catch (error) {
    throw new CsvImportError(`未能加载 xlsx 解析库：${error instanceof Error ? error.message : String(error)}`)
  }
  const XLSX = (mod as unknown as { readFile?: unknown }).readFile ? mod : (mod as unknown as { default: typeof import('xlsx') }).default
  const wb = XLSX.read(data, { type: 'buffer' })
  const first = wb.SheetNames[0]
  if (!first) throw new CsvImportError('xlsx 文件中没有工作表')
  const sheet = wb.Sheets[first]
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' })
  return grid.map(row => row.map(cell => (cell == null ? '' : String(cell)).trim()))
}

/** 已用二维数组（来自 CSV 或 XLSX）解析为任务计划。 */
export function planGridCsvImport(domain: PmDomain, projectId: string, grid: string[][]): { total: number, outline: { depth: number, code: string, title: string }[] } {
  ensureProject(domain, projectId)
  const rows = parseGridTasks(grid)
  const counters: number[] = []
  const outline = rows.map(row => {
    counters.length = row.depth + 1
    counters[row.depth] = (counters[row.depth] ?? 0) + 1
    return { depth: row.depth, code: counters.slice(0, row.depth + 1).join('.'), title: row.title }
  })
  return { total: rows.length, outline }
}

export async function importTasksFromGrid(domain: PmDomain, projectId: string, grid: string[][]): Promise<{ id: string, code: string, title: string }[]> {
  ensureProject(domain, projectId)
  const rows = parseGridTasks(grid)
  const stack: { depth: number, id: string }[] = []
  const created: { id: string, code: string, title: string }[] = []
  for (const row of rows) {
    while (stack.length && stack[stack.length - 1].depth >= row.depth) stack.pop()
    const parentId = stack.length ? stack[stack.length - 1].id : null
    const done = row.progress === 100
    const priority = row.priority && /^P[012]$/i.test(row.priority) ? row.priority.toUpperCase() : undefined
    const task = await addTask(domain, {
      projectId,
      parentId,
      title: row.title,
      assignee: row.assignee ?? '',
      dueDate: row.dueDate,
      startDate: row.startDate,
      ...(priority ? { priority } : {}),
      progress: row.progress ?? 0,
      status: done ? 'done' : (row.progress && row.progress > 0 ? 'in_progress' : 'todo'),
    })
    stack.push({ depth: row.depth, id: task.id })
    created.push({ id: task.id, code: task.code, title: task.title })
  }
  return created
}

/** 把已解析的文本（CSV 字符串）当网格。 */
function parseGridTasks(grid: string[][]): CsvRow[] {
  if (grid.length < 2) throw new CsvImportError('至少需要一行表头和一行数据')
  const header = grid[0].map(h => h.trim())
  const colIndex = new Map<keyof CsvRow, number>()
  header.forEach((h, idx) => {
    const key = HEADER_MAP[h] || HEADER_MAP[h.toLowerCase?.()]
    if (key && !colIndex.has(key)) colIndex.set(key, idx)
  })
  if (!colIndex.has('title')) {
    throw new CsvImportError('表头缺少「标题」列；约定表头：层级/标题/负责人/优先级/开始/截止/进度')
  }
  const rows: CsvRow[] = []
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r]
    const title = (cells[colIndex.get('title')!] ?? '').trim()
    if (!title) continue
    const depthRaw = colIndex.has('depth') ? (cells[colIndex.get('depth')!] ?? '').trim() : ''
    const progressRaw = colIndex.has('progress') ? (cells[colIndex.get('progress')!] ?? '').trim() : ''
    rows.push({
      depth: depthRaw ? Math.max(0, parseInt(depthRaw, 10) - 1) : 0,
      title,
      assignee: cell(cells, colIndex.get('assignee')),
      priority: cell(cells, colIndex.get('priority')),
      startDate: cell(cells, colIndex.get('startDate')),
      dueDate: cell(cells, colIndex.get('dueDate')),
      // CSV 专属 "80%" 写法：先去尾百分号，再交共享的 parseProgressInput（纯数值语义）。
      progress: progressRaw ? parseProgressInput(progressRaw.replace(/%$/, '')) : undefined,
    })
  }
  if (!rows.length) throw new CsvImportError('没有可导入的数据行')
  return rows
}

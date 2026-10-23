import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as XLSX from 'xlsx'
import { CsvImportError, importTasksFromGrid, parseCsv, parseCsvTasks, planGridCsvImport } from './csv-import.js'
import { addProject } from './projects.js'
import * as tasks from './tasks.js'
import { pmDomainSpec, type PmDomain } from './storage.js'
import { handleTaskCommand } from '../commands/task.js'

const header = ['层级', '标题', '负责人', '优先级', '开始', '截止', '进度']
const goodRows = [
  ['1', '父,带逗号', '张三', 'P1', '2026-10-21', '2026-11-10', '20'],
  ['2', '子任务', '李四', 'P2', '2026-10-22', '2026-11-09', '30'],
]
const csvText = (grid: string[][]) => grid.map(row => row.map(value =>
  /[,"\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value).join(',')).join('\n')
function xlsxBytes(grid: string[][]): Buffer {
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(grid), '中文任务')
  return XLSX.write(book, { bookType: 'xlsx', type: 'buffer' }) as Buffer
}
async function disk(root: string, prefix = ''): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    const key = prefix + entry.name
    if (entry.isDirectory()) Object.assign(out, await disk(path, key + '/'))
    else if (entry.isFile()) out[key] = await readFile(path, 'utf8')
  }
  return out
}

describe('A9-F02 网格导入全行预检（真实任务领域/JSON）', () => {
  let root: string
  let domain: PmDomain
  let facility: DomainFacility
  let projectId: string

  async function open() {
    const ctx = new Context()
    await ctx.plugin(Storage)
    ctx.storage.backend.register('json', new JsonStorageBackend(join(root, 'data')))
    facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
    domain = await facility.open(pmDomainSpec)
  }
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'csv-preflight-'))
    await open()
    projectId = (await addProject(domain, {
      name: '导入预检', startDate: '2026-01-01', targetDate: '2026-12-31',
    })).id
  })
  afterEach(async () => {
    vi.restoreAllMocks()
    await facility.closeAll()
  })
  const snapshot = async () => ({
    records: structuredClone([...domain.table('tasks').entries()]),
    disk: await disk(join(root, 'data')),
  })

  it.each(['preview', 'confirm'] as const)('%s 后行真实坏日期在任何 addTask 前拒绝，含行/字段且零写', async mode => {
    const rows = structuredClone(goodRows)
    rows[1][5] = '2026-02-30'
    const grid = [header, ...rows]
    const before = await snapshot()
    // 仅观察真实 addTask，不替换实现；不能把首行已写后的 Zod 拒绝当预检。
    const add = vi.spyOn(tasks, 'addTask')
    let error: unknown
    try {
      if (mode === 'preview') planGridCsvImport(domain, projectId, grid)
      else await importTasksFromGrid(domain, projectId, grid)
    } catch (caught) { error = caught }
    expect(error).toBeInstanceOf(CsvImportError)
    expect((error as Error).message).toMatch(/第 3 行.*dueDate/)
    expect((error as Error).message).toContain('日期须为有效的 YYYY-MM-DD')
    expect(add).not.toHaveBeenCalled()
    expect(await snapshot()).toEqual(before)
  })

  it.each([
    ['开始日期', 0, 4, '2026-13-01', 2, 'startDate'],
    ['后行开始日期', 1, 4, 'not-a-date', 3, 'startDate'],
    ['首行截止日期', 0, 5, '2026-02-30', 2, 'dueDate'],
    ['后行日期倒置', 1, 5, '2026-10-20', 3, 'dueDate'],
  ] as const)('%s preview/confirm 拒绝同一 schema 字段且零写', async (_name, index, column, value, line, field) => {
    const rows = structuredClone(goodRows)
    rows[index][column] = value
    const grid = [header, ...rows]
    const before = await snapshot()
    const pattern = new RegExp(`第 ${line} 行.*${field}`)
    expect(() => planGridCsvImport(domain, projectId, grid)).toThrow(pattern)
    await expect(importTasksFromGrid(domain, projectId, grid)).rejects.toThrow(pattern)
    expect(await snapshot()).toEqual(before)
  })

  it('跳过无标题记录后仍按原网格行定位，列出同一行的两个坏日期字段', async () => {
    const rows = structuredClone(goodRows)
    rows[1][4] = 'bad-start'
    rows[1][5] = 'bad-due'
    const grid = [header, rows[0], ['1', '', '', '', '', '', ''], rows[1]]
    expect(() => planGridCsvImport(domain, projectId, grid)).toThrow(/第 4 行.*startDate.*dueDate/)
    await expect(importTasksFromGrid(domain, projectId, grid)).rejects.toThrow(/第 4 行.*startDate.*dueDate/)
    expect(tasks.listTasks(domain, projectId)).toEqual([])
  })

  it.each(['csv', 'xlsx'] as const)('%s 路径/网页内容入口 preview、两次 confirm 均拒绝后行且 JSON 重开零写', async format => {
    const rows = structuredClone(goodRows)
    rows[1][5] = '2026-02-30'
    const grid = [header, ...rows]
    const path = join(root, `independent.${format}`)
    const bytes = format === 'csv' ? csvText(grid) : xlsxBytes(grid)
    await writeFile(path, bytes)
    const content = format === 'csv' ? bytes : (bytes as Buffer).toString('base64')
    const commands = [
      `import ${projectId} ${path}`,
      `import-content ${projectId} independent.${format} ${JSON.stringify(content)}`,
    ]
    const before = await snapshot()
    for (const command of commands) {
      for (const suffix of ['', ' confirm', ' confirm']) {
        const result = await handleTaskCommand(command + suffix, domain)
        expect(result.kind, result.text).toBe('error')
        expect(result.text).toMatch(/第 3 行.*dueDate/)
        expect(await snapshot()).toEqual(before)
      }
    }
    await facility.closeAll()
    await open()
    expect(await snapshot()).toEqual(before)
  })

  it.each(['csv', 'xlsx'] as const)('%s 合法已有项目/树：预览零写、真实 addTask 续号/层级/默认/百分号/重开', async format => {
    const other = await addProject(domain, {
      name: '旁路项目', startDate: '2026-01-01', targetDate: '2026-12-31',
    })
    const outside = await tasks.addTask(domain, { projectId: other.id, title: '旁路' })
    const old = await tasks.addTask(domain, { projectId, title: '原根' })
    const oldChild = await tasks.addTask(domain, { projectId, parentId: old.id, title: '原子' })
    const before = await snapshot()
    const grid = [header,
      ['1', '父,带逗号', '张三', 'p0', '2026-02-28', '2026-03-01', '80%'],
      ['2', '子任务', '李四', 'P2', '', '', '100%'],
      ['3', '孙任务', '', '', '', '', '0'],
      ['1', '缺省任务', '', '不支持的优先级', '', '', ''],
    ]
    const path = join(root, `legal.${format}`)
    const bytes = format === 'csv' ? csvText(grid) : xlsxBytes(grid)
    await writeFile(path, bytes)
    const content = format === 'csv' ? bytes : (bytes as Buffer).toString('base64')
    const commands = [
      `import ${projectId} ${path}`,
      `import-content ${projectId} legal.${format} ${JSON.stringify(content)}`,
    ]
    for (const command of commands) {
      expect((await handleTaskCommand(command, domain)).kind).toBe('success')
      expect(await snapshot()).toEqual(before)
    }
    // CSV 解析公共接口保留原百分号/引号/默认语义。
    expect(parseCsvTasks(csvText(grid))[0]).toMatchObject({ title: '父,带逗号', progress: 80 })
    expect(parseCsv(csvText(grid))).toEqual(grid)
    expect(planGridCsvImport(domain, projectId, grid).total).toBe(4)
    const result = await handleTaskCommand(commands[format === 'csv' ? 0 : 1] + ' confirm', domain)
    expect(result.kind, result.text).toBe('success')
    const all = tasks.listTasks(domain, projectId)
    const created = all.filter(task => ![old.id, oldChild.id].includes(task.id))
    expect(created.map(task => task.code)).toEqual(['2', '2.1', '2.1.1', '3'])
    expect(created.map(task => task.id)).toEqual(['t-0004', 't-0005', 't-0006', 't-0007'])
    expect(created[0]).toMatchObject({ parentId: null, assignee: '张三', priority: 'P0',
      progress: 80, status: 'in_progress', startDate: '2026-02-28', dueDate: '2026-03-01' })
    expect(created[1]).toMatchObject({ parentId: created[0].id, progress: 100, status: 'done', priority: 'P2' })
    expect(created[2]).toMatchObject({ parentId: created[1].id, progress: 0, status: 'todo', priority: 'P1' })
    expect(created[3]).toMatchObject({ parentId: null, assignee: '', description: '',
      milestoneId: null, progress: 0, status: 'todo', priority: 'P1' })
    expect(tasks.getTask(domain, old.id)).toEqual(old)
    expect(tasks.getTask(domain, oldChild.id)).toEqual(oldChild)
    expect(tasks.getTask(domain, outside.id)).toEqual(outside)
    const saved = await snapshot()
    await facility.closeAll()
    await open()
    expect(await snapshot()).toEqual(saved)
  })
})

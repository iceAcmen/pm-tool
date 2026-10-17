import { describe, it, expect } from 'vitest'
import {
  tasksToCsv,
  tasksToMarkdown,
  tasksToJson,
  TASK_EXPORT_VERSION,
  type ExportTaskRow,
  type TaskExportCtx,
} from './task-export.js'

// P2-5：按当前可见视图导出（前端序列化，零 I/O、零墙钟，today/generatedAt 注入）。

const today = '2026-10-17'
const ctx: TaskExportCtx = {
  projectName: '官网改版',
  viewName: '全部任务',
  filterSummary: '全部 · 按编号',
  generatedAt: '2026-10-17 14:32',
  today,
  milestoneTitle: (id) => (id === 'm-1' ? '首页改版里程碑' : undefined),
}

const rows: ExportTaskRow[] = [
  { id: 't-1', code: '1', title: '首页 Hero 改版', assignee: '陈昊', status: 'done', priority: 'P1', startDate: '2026-10-01', dueDate: '2026-10-14', progress: 100, milestoneId: 'm-1' },
  { id: 't-2', code: '1.1', title: '多语言方案, 含"引号"与换行\n第二行', assignee: '史冰冰', status: 'blocked', priority: 'P1', dueDate: '2026-10-21', progress: 30, milestoneId: null },
  { id: 't-3', code: '1.2', title: '性能预算验收', assignee: '史冰冰', status: 'in_progress', priority: 'P0', dueDate: '2026-10-15', progress: 60 },
  { id: 't-4', code: '2', title: '落地页 A/B 测试', assignee: '孙一', status: 'todo', priority: 'P2', dueDate: '2026-10-28', progress: 0 },
]

describe('tasksToCsv：BOM / 列序 / 转义 / 空值', () => {
  it('首行带 UTF-8 BOM，表头列序固定', () => {
    const csv = tasksToCsv(rows, ctx)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    const firstLine = csv.replace('\uFEFF', '').split('\r\n')[0]
    expect(firstLine).toBe('WBS编号,标题,状态,负责人,开始,截止,优先级,进度,里程碑')
  })

  it('含逗号/双引号/换行的单元格用双引号包裹、内部引号翻倍，行尾 \\r\\n', () => {
    const csv = tasksToCsv(rows, ctx)
    expect(csv).toContain('"多语言方案, 含""引号""与换行\n第二行"')
    expect(csv).toContain('\r\n')
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('进度为整数百分比，里程碑名解析，空值落空串', () => {
    const csv = tasksToCsv(rows, ctx)
    expect(csv).toContain('100%')
    expect(csv).toContain('首页改版里程碑')
    // t-2 无里程碑：标题行尾连续两个逗号（里程碑空）
    expect(csv).toMatch(/受阻,史冰冰,[^\r]*,30%,\r?\n/)
  })

  it('空数组仅输出表头', () => {
    const csv = tasksToCsv([], ctx)
    expect(csv.replace('\uFEFF', '').trim()).toBe('WBS编号,标题,状态,负责人,开始,截止,优先级,进度,里程碑')
  })
})

describe('tasksToMarkdown：元信息 / 分区 / 小计 / 逾期口径', () => {
  const md = tasksToMarkdown(rows, ctx)

  it('头部写入项目名、生成时间、视图名、过滤摘要与任务数小计', () => {
    expect(md).toContain('官网改版 · 任务周报')
    expect(md).toContain('2026-10-17 14:32')
    expect(md).toContain('全部任务')
    expect(md).toContain('全部 · 按编号')
    expect(md).toContain('任务数：4（已完成 1 · 进行中 1 · 受阻 1 · 逾期 1）')
  })

  it('按 逾期 / 受阻 / 未完成 / 已完成 分区，逾期由注入 today 判定', () => {
    expect(md).toContain('## 逾期 / 受阻（2）')
    expect(md).toContain('### 已逾期（1）')
    expect(md).toContain('### 受阻（1）')
    expect(md).toContain('## 未完成（1）')
    expect(md).toContain('## 已完成（1）')
    // t-3 截止 2026-10-15 < today → 进逾期；t-2 blocked → 受阻；t-4 todo → 未完成；t-1 done → 已完成
    expect(md.indexOf('性能预算验收')).toBeLessThan(md.indexOf('落地页 A/B 测试'))
    expect(md).toContain('已完成')
    expect(md).toContain('受阻')
  })
})

describe('tasksToJson：meta 结构 / version / records 全字段 / 里程碑解析', () => {
  const payload = tasksToJson(rows, ctx)

  it('meta 含 project/view/filterSummary/generatedAt/version/count', () => {
    expect(payload.meta.project).toBe('官网改版')
    expect(payload.meta.view).toBe('全部任务')
    expect(payload.meta.filterSummary).toBe('全部 · 按编号')
    expect(payload.meta.generatedAt).toBe('2026-10-17 14:32')
    expect(payload.meta.version).toBe(TASK_EXPORT_VERSION)
    expect(payload.meta.count).toBe(4)
  })

  it('records 数量一致，含全字段与解析后的里程碑名 / 状态中文标签', () => {
    expect(payload.records).toHaveLength(4)
    const done = payload.records.find(r => r.id === 't-1')!
    expect(done.milestone).toBe('首页改版里程碑')
    expect(done.statusLabel).toBe('已完成')
    expect(done.progress).toBe(100)
    expect(done.predecessorIds).toEqual([])
    const blocked = payload.records.find(r => r.id === 't-2')!
    expect(blocked.milestone).toBe('')
    expect(blocked.statusLabel).toBe('受阻')
  })
})

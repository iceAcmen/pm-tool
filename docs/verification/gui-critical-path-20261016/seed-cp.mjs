/**
 * 关键路径 GUI 验收种子（隔离 .tmp/cp-20261016，绝不写正式 data/）。
 * 结构：关键链 t-0001→t-0002→t-0003（全排期，应全高亮）；
 *       时差分支 t-0004（前置 t-0001，正时差，非关键）；
 *       成环 t-0005↔t-0006（循环不可计算，降级不高亮）；
 *       缺日期 t-0007（仅 startDate，缺日期段跳过）。
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = '/Users/bytedance/Projects/dsh-pm/pm-tool/.tmp/cp-20261016/data/pmtool'
const TS = '2026-10-16T00:00:00.000Z'
mkdirSync(join(ROOT, 'projects'), { recursive: true })
mkdirSync(join(ROOT, 'tasks'), { recursive: true })
mkdirSync(join(ROOT, 'milestones'), { recursive: true })

const env = (record) => ({ version: 2, record })
const put = (sub, id, record) => writeFileSync(join(ROOT, sub, id + '.json'), JSON.stringify(env(record), null, 2) + '\n')

put('projects', 'p-0001', {
  id: 'p-0001', name: '关键路径验收', description: '', owner: '', status: 'planning',
  startDate: '2026-10-01', targetDate: '2026-11-15', createdAt: TS, updatedAt: TS,
})

const task = (id, code, order, title, assignee, startDate, dueDate, predecessorIds) => put('tasks', id, {
  id, projectId: 'p-0001', parentId: null, title, description: '', assignee,
  status: 'todo', priority: 'P1', startDate, dueDate, progress: 0,
  milestoneId: null, code, order, createdAt: TS, updatedAt: TS,
  ...(predecessorIds && predecessorIds.length ? { predecessorIds } : {}),
})

// 关键链（应全在关键路径、关键边高亮）
task('t-0001', '1', 1, '需求分析', '甲', '2026-10-01', '2026-10-03', [])
task('t-0002', '2', 2, '方案设计', '乙', '2026-10-05', '2026-10-08', ['t-0001'])
task('t-0003', '3', 3, '开发实现', '丙', '2026-10-10', '2026-10-14', ['t-0002'])
// 时差分支（前置 t-0001，短，正时差，非关键、非关键边）
task('t-0004', '4', 4, '文档编写', '丁', '2026-10-01', '2026-10-02', ['t-0001'])
// 成环 t-0005 ↔ t-0006（循环不可计算，两者不高亮、不打断）
task('t-0005', '5', 5, '互审甲', '戊', '2026-10-16', '2026-10-17', ['t-0006'])
task('t-0006', '6', 6, '互审乙', '己', '2026-10-18', '2026-10-19', ['t-0005'])
// 缺日期：仅 startDate，缺 dueDate（缺日期段跳过，不补日期）
task('t-0007', '7', 7, '待补排期任务', '庚', '2026-10-20', undefined, ['t-0003'])

put('milestones', 'm-0001', {
  id: 'm-0001', projectId: 'p-0001', title: '发布里程碑', targetDate: '2026-10-28',
  status: 'planned', achievedDate: null, description: '', createdAt: TS, updatedAt: TS,
})

console.log('seed written to', ROOT)

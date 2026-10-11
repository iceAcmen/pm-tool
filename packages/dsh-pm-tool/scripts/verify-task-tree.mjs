import assert from 'node:assert'
import { flattenVisible, indexChildren } from '../lib/core/task-tree.js'

// 多层级
const tasks = [
  { id: 't1', parentId: null, code: '1' },
  { id: 't2', parentId: 't1', code: '1.1' },
  { id: 't3', parentId: 't1', code: '1.2' },
  { id: 't4', parentId: 't3', code: '1.2.1' },
  { id: 't5', parentId: null, code: '2' },
  // 孤立任务（parentId 指向不存在）
  { id: 't6', parentId: 'ghost', code: '3' },
]
const rows = flattenVisible(tasks)
assert.deepEqual(rows.map(r => r.task.id), ['t1', 't2', 't3', 't4', 't5', 't6'])
assert.deepEqual(rows.map(r => r.depth), [0, 1, 1, 2, 0, 0])
assert.equal(rows[0].hasChildren, true)
assert.equal(rows[1].hasChildren, false)

// 排序：同层按 code numeric
const shuffled = [tasks[4], tasks[1], tasks[0], tasks[3], tasks[2], tasks[5]]
assert.deepEqual(flattenVisible(shuffled).map(r => r.task.id), ['t1','t2','t3','t4','t5','t6'])

// 折叠：折叠 t1 后其所有后代隐藏
const collapsed = flattenVisible(tasks, new Set(['t1']))
assert.deepEqual(collapsed.map(r => r.task.id), ['t1', 't5', 't6'])

// 折叠非根 t3：隐藏 t4 但保留 t2
const c3 = flattenVisible(tasks, new Set(['t3']))
assert.deepEqual(c3.map(r => r.task.id), ['t1', 't2', 't3', 't5', 't6'])

console.log('verify-task-tree OK')

/**
 * R11 安全公式求值器验证（阶段③）。覆盖：正确表达式、聚合、today；恶意/非法输入全部拒绝。
 */
import assert from 'node:assert/strict'
// P0 浏览态拆分：真实 expr-eval 实现已移到异步块 formula-expr.ts（主包 formula.ts 仅惰性加载器）。
import { evaluateFormula } from '../lib/client/board/formula-expr.js'

const rows = [
  { id: 't1', title: 'a', status: 'done', estimate: 3, assignee: '张三' },
  { id: 't2', title: 'b', status: 'doing', estimate: 2, assignee: '李四' },
  { id: 't3', title: 'c', status: 'blocked', estimate: 1, assignee: '王五' },
  { id: 't4', title: 'd', status: 'todo', estimate: 4, assignee: '张三' },
]
const ctx = { rows, today: '2026-10-16' }

// 1. 正确：完成率百分比
{
  const r = evaluateFormula(`pct(countIf(rows,'status','done'),count(rows))`, ctx)
  assert.equal(r.ok, true, `应成功: ${JSON.stringify(r)}`)
  assert.equal(r.value, 25, `done=1/4=25%, got ${r.value}`)
}
// 2. sum/avg/min/max
{
  assert.equal(evaluateFormula('sum(rows,"estimate")', ctx).value, 10)
  assert.equal(evaluateFormula('avg(rows,"estimate")', ctx).value, 2.5)
  assert.equal(evaluateFormula('rowMin(rows,"estimate")', ctx).value, 1)
  assert.equal(evaluateFormula('rowMax(rows,"estimate")', ctx).value, 4)
}
// 3. countIf + count
{
  assert.equal(evaluateFormula(`countIf(rows,'assignee','张三')`, ctx).value, 2)
  assert.equal(evaluateFormula('count(rows)', ctx).value, 4)
}
// 4. today 变量
{
  const r = evaluateFormula('today', ctx)
  assert.equal(r.ok, true)
  assert.equal(r.value, '2026-10-16')
}
// 5. 恶意：constructor 访问
{
  const r = evaluateFormula('rows.constructor.constructor("return process")()', ctx)
  assert.equal(r.ok, false, 'constructor 应被拒绝')
}
// 6. 超长
{
  const r = evaluateFormula('1+' + '1+'.repeat(200), ctx)
  assert.equal(r.ok, false)
  assert.equal(r.error.kind, 'too_long')
}
// 7. 未登记函数
{
  const r = evaluateFormula('hack(rows)', ctx)
  assert.equal(r.ok, false, '未登记函数应拒绝')
}
// 8. 超 5000 行
{
  const big = { rows: Array.from({ length: 5001 }, () => ({ a: 1 })), today: '2026-10-16' }
  const r = evaluateFormula('count(rows)', big)
  assert.equal(r.ok, false)
  assert.equal(r.error.kind, 'too_many_rows')
}
// 9. 非白名单字段
{
  const r = evaluateFormula('sum(rows,"secret")', ctx)
  assert.equal(r.ok, false)
  assert.equal(r.error.kind, 'bad_field')
}
// 10. lambda/箭头表达式（expr-eval 不支持，应语法失败）
{
  const r = evaluateFormula('x => x', ctx)
  assert.equal(r.ok, false)
}

console.log('✔ verify-formula: 全部用例通过')

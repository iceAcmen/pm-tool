import { describe, it, expect } from 'vitest'
import { evaluateChecks, type CheckableTask } from './check.js'

// K6 交付检查：纯函数规则，today 固定注入，零墙钟/零网络。
// 五类规则：a 逾期未动 / b 临期未动(≤2天 todo) / c 完成有未完成清单 / d 完成缺材料 / e 进度100状态不符。

const TODAY = '2026-10-18'

function task(over: Partial<CheckableTask> & { id: string, title: string }): CheckableTask {
  return { status: 'todo', progress: 0, evidenceUrl: null, deliverableId: null, checklist: null, ...over }
}

describe('K6 交付检查五类规则', () => {
  it('a 逾期未动：dueDate < today 且 status != done → 命中', () => {
    const findings = evaluateChecks([
      task({ id: 't-0001', title: '逾期任务', status: 'in_progress', dueDate: '2026-10-10', progress: 30 }),
    ], TODAY)
    expect(findings.map(f => f.rule)).toEqual(['overdue-untouched'])
  })

  it('a 已完成（done）即使截止日在过去 → 不命中逾期', () => {
    const findings = evaluateChecks([
      task({ id: 't-0001', title: '已完成', status: 'done', dueDate: '2026-10-10', progress: 100, evidenceUrl: 'https://example.com/done' }),
    ], TODAY)
    expect(findings).toHaveLength(0)
  })

  it('b 临期未动：todo 且截止日在 [今天, 今天+2天] → 命中；更远未来不命中', () => {
    const findings = evaluateChecks([
      task({ id: 't-0001', title: '两天后到期', status: 'todo', dueDate: '2026-10-20' }),
      task({ id: 't-0002', title: '今天到期', status: 'todo', dueDate: TODAY }),
      task({ id: 't-0003', title: '七天后到期', status: 'todo', dueDate: '2026-10-25' }),
    ], TODAY)
    const rules = findings.map(f => f.rule)
    expect(rules).toContain('due-soon-untouched')
    expect(findings.filter(f => f.taskId === 't-0003')).toHaveLength(0)
  })

  it('b 临期规则只认 todo：in_progress 两天内到期不命中 b', () => {
    const findings = evaluateChecks([
      task({ id: 't-0001', title: '进行中临期', status: 'in_progress', dueDate: '2026-10-19', progress: 10 }),
    ], TODAY)
    expect(findings.map(f => f.rule)).toEqual([])
  })

  it('c 完成却有未完成清单项：done 且任一 checklist done=false → 命中', () => {
    const findings = evaluateChecks([
      task({
        id: 't-0001', title: '清单未勾完', status: 'done', progress: 100,
        checklist: [{ done: true }, { done: false }],
      }),
    ], TODAY)
    expect(findings.map(f => f.rule)).toEqual(['done-open-checklist'])
  })

  it('c 清单全部完成 → 不命中', () => {
    const findings = evaluateChecks([
      task({
        id: 't-0001', title: '清单全勾', status: 'done', progress: 100,
        checklist: [{ done: true }, { done: true }],
      }),
    ], TODAY)
    expect(findings).toHaveLength(0)
  })

  it('d 完成但缺材料：done 且无 evidenceUrl/无清单/无 deliverableId → 命中，措辞含「未覆盖≠未完成」', () => {
    const findings = evaluateChecks([
      task({ id: 't-0001', title: '裸完成', status: 'done', progress: 100 }),
    ], TODAY)
    expect(findings.map(f => f.rule)).toEqual(['done-missing-materials'])
    expect(findings[0].suggestion).toContain('未覆盖≠未完成')
    expect(findings[0].suggestion).toContain('最终验收由人判断')
  })

  it('d 已登记证据链接 / 关联交付物 / 有清单 → 均不命中缺材料', () => {
    const findings = evaluateChecks([
      task({ id: 't-0001', title: '有证据', status: 'done', progress: 100, evidenceUrl: 'https://example.com/a' }),
      task({ id: 't-0002', title: '有交付物', status: 'done', progress: 100, deliverableId: 'dlv-0001' }),
      task({ id: 't-0003', title: '有清单', status: 'done', progress: 100, checklist: [{ done: true }] }),
    ], TODAY)
    expect(findings.filter(f => f.rule === 'done-missing-materials')).toHaveLength(0)
  })

  it('e 进度100但状态非 done → 命中；done 不命中', () => {
    const findings = evaluateChecks([
      task({ id: 't-0001', title: '满进度未收尾', status: 'in_progress', progress: 100, dueDate: '2026-11-01' }),
      task({ id: 't-0002', title: '已完成', status: 'done', progress: 100, deliverableId: 'dlv-0001' }),
    ], TODAY)
    expect(findings.map(f => f.rule)).toEqual(['progress-100-not-done'])
  })

  it('同一任务可命中多条（逾期未动 + 进度100未done），互不替代', () => {
    const findings = evaluateChecks([
      task({ id: 't-0001', title: '双重提示', status: 'blocked', progress: 100, dueDate: '2026-10-01' }),
    ], TODAY)
    const rules = findings.map(f => f.rule).sort()
    expect(rules).toEqual(['overdue-untouched', 'progress-100-not-done'])
  })

  it('输出稳定排序（rule → taskId），纯函数不修改入参', () => {
    const input = [
      task({ id: 't-0009', title: 'x', status: 'done', progress: 100 }),
      task({ id: 't-0001', title: 'y', status: 'in_progress', progress: 100 }),
    ]
    const snapshot = JSON.stringify(input)
    const findings = evaluateChecks(input, TODAY)
    expect(findings.map(f => f.rule)).toEqual(['done-missing-materials', 'progress-100-not-done'])
    expect(JSON.stringify(input)).toEqual(snapshot)
  })
})

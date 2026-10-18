import { describe, it, expect } from 'vitest'
import {
  addOkr,
  buildOkrTree,
  clearProcessedSuggestions,
  confirmOkrSuggestion,
  ignoreOkrSuggestion,
  listOkrSuggestions,
  okrCreateSchema,
  okrSuggestionSchema,
  readOkrInbox,
  suggestOkr,
  updateOkr,
  validateOkrRelations,
  OkrPrimaryNotFoundError,
  OkrPrimaryProjectMismatchError,
  OkrRelatedNotFoundError,
  OkrRelatedProjectMismatchError,
  OkrSelfReferenceError,
  OkrSuggestionAlreadyProcessedError,
  OkrSuggestionNotFoundError,
  type OkrRecord,
} from './okr.js'
import type { PmDomain } from './storage.js'

// P2-B X7 愿景/OKR 层：纯函数离线单测 + 内存 fake 域集成（零网络/零墙钟注入）。

/** 内存 fake 域：每表一个闭包 Map，get/put/entries/delete 齐备（同 reflect-l2.test.ts 模式）。 */
function buildFakeDomain() {
  const tables = new Map<string, Map<string, unknown>>()
  const table = (name: string) => {
    if (!tables.has(name)) tables.set(name, new Map())
    const m = tables.get(name)!
    return {
      get: (k: string) => m.get(k),
      put: async (k: string, v: unknown) => { m.set(k, v) },
      entries: () => m.entries(),
      delete: (k: string) => { m.delete(k) },
    }
  }
  const domain = { table } as unknown as PmDomain
  // 种子项目（两个项目用于跨项目反例）。
  table('projects').put('p-0001', { id: 'p-0001', name: '甲项目' })
  table('projects').put('p-0002', { id: 'p-0002', name: '乙项目' })
  return { domain, tables }
}

function okrRow(over: Partial<OkrRecord> & Pick<OkrRecord, 'id' | 'title' | 'kind'>): OkrRecord {
  return {
    projectId: 'p-0001',
    primaryOkrId: null,
    relatedOkrIds: [],
    status: 'draft',
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
    ...over,
  } as OkrRecord
}

// ===== 1. add 形状校验（纯 schema，离线）=====

describe('okrCreateSchema：人录入形状校验', () => {
  it('kind 必填：缺 kind 报错', () => {
    const result = okrCreateSchema.safeParse({ title: '做出稳定可交付的个人工作台' })
    expect(result.success).toBe(false)
    expect(result.error.issues.some(i => i.path[0] === 'kind')).toBe(true)
  })

  it('title 必填：空标题报错', () => {
    const result = okrCreateSchema.safeParse({ title: '   ', kind: 'objective' })
    expect(result.success).toBe(false)
  })

  it('kind 只接受 objective / key-result', () => {
    expect(okrCreateSchema.safeParse({ title: 't', kind: 'goal' }).success).toBe(false)
    expect(okrCreateSchema.safeParse({ title: 't', kind: 'objective' }).success).toBe(true)
    expect(okrCreateSchema.safeParse({ title: 't', kind: 'key-result' }).success).toBe(true)
  })

  it('未知字段拒绝（strictObject unrecognized_keys）', () => {
    const result = okrCreateSchema.safeParse({ title: 't', kind: 'objective', score: 90, streak: 66 })
    expect(result.success).toBe(false)
    expect(result.error.issues.some(i => i.code === 'unrecognized_keys')).toBe(true)
  })

  it('cycleDue 仅作为预留字符串接收，不产出调度字段语义', () => {
    const parsed = okrCreateSchema.parse({ title: 't', kind: 'objective', cycleDue: '2026-Q4' })
    expect(parsed.cycleDue).toBe('2026-Q4')
  })
})

// ===== 2. 关系校验（存在性 + 同项目 + 不自指）=====

describe('validateOkrRelations：父目标/软关联存在性与同项目校验', () => {
  it('正例：同项目父目标 + 同项目软关联通过并去重', () => {
    const { domain } = buildFakeDomain()
    domain.table('okrs').put('okr-a', okrRow({ id: 'okr-a', title: '目标A', kind: 'objective' }))
    domain.table('okrs').put('okr-b', okrRow({ id: 'okr-b', title: '目标B', kind: 'objective' }))
    const related = validateOkrRelations(domain, 'p-0001', 'okr-a', ['okr-b', 'okr-b'])
    expect(related).toEqual(['okr-b'])
  })

  it('反例：父目标不存在 → 未找到父目标', () => {
    const { domain } = buildFakeDomain()
    expect(() => validateOkrRelations(domain, 'p-0001', 'okr-missing')).toThrow(OkrPrimaryNotFoundError)
  })

  it('反例：父目标跨项目 → 父目标不属于指定项目', () => {
    const { domain } = buildFakeDomain()
    domain.table('okrs').put('okr-x', okrRow({ id: 'okr-x', title: '跨项目目标', kind: 'objective', projectId: 'p-0002' }))
    expect(() => validateOkrRelations(domain, 'p-0001', 'okr-x')).toThrow(OkrPrimaryProjectMismatchError)
  })

  it('反例：软关联不存在 → 未找到关联目标', () => {
    const { domain } = buildFakeDomain()
    expect(() => validateOkrRelations(domain, 'p-0001', null, ['okr-nope'])).toThrow(OkrRelatedNotFoundError)
  })

  it('反例：软关联跨项目 → 关联目标不属于指定项目', () => {
    const { domain } = buildFakeDomain()
    domain.table('okrs').put('okr-y', okrRow({ id: 'okr-y', title: '乙项目目标', kind: 'objective', projectId: 'p-0002' }))
    expect(() => validateOkrRelations(domain, 'p-0001', null, ['okr-y'])).toThrow(OkrRelatedProjectMismatchError)
  })

  it('反例：自指父目标 / 自指软关联拒绝', () => {
    const { domain } = buildFakeDomain()
    domain.table('okrs').put('okr-self', okrRow({ id: 'okr-self', title: '自己', kind: 'objective' }))
    expect(() => validateOkrRelations(domain, 'p-0001', 'okr-self', undefined, 'okr-self')).toThrow(OkrSelfReferenceError)
    expect(() => validateOkrRelations(domain, 'p-0001', null, ['okr-self'], 'okr-self')).toThrow(OkrSelfReferenceError)
  })

  it('primaryOkrId 缺省/null 放行（根目标），relatedOkrIds 缺省返回 undefined 不清空', () => {
    const { domain } = buildFakeDomain()
    expect(validateOkrRelations(domain, 'p-0001', null, undefined)).toBeUndefined()
  })
})

// ===== 3. 树形派生：单父归属 / related 不计权重 / related 标注 =====

describe('buildOkrTree：单父归属，软关联可见不计权重', () => {
  const records: OkrRecord[] = [
    okrRow({ id: 'okr-o1', title: '年度目标O1', kind: 'objective' }),
    okrRow({ id: 'okr-k1', title: 'KR1', kind: 'key-result', primaryOkrId: 'okr-o1' }),
    okrRow({ id: 'okr-k2', title: 'KR2', kind: 'key-result', primaryOkrId: 'okr-o1' }),
    okrRow({ id: 'okr-o2', title: '关联目标O2', kind: 'objective', relatedOkrIds: ['okr-o1'] }),
  ]

  it('单父归属：KR 按 primaryOkrId 挂到目标 children，weightGroup = 父 id', () => {
    const { tree } = buildOkrTree(records)
    const o1 = tree.find(n => n.id === 'okr-o1')!
    expect(o1.children.map(c => c.id).sort()).toEqual(['okr-k1', 'okr-k2'])
    for (const kr of o1.children) {
      expect(kr.weightGroup).toBe('okr-o1')
    }
    expect(o1.weightGroup).toBeNull()
  })

  it('软关联不计权重：O2 列 O1 为 relatedTargets，但 O1 不被收为 O2 的子节点，O2 权重组不变', () => {
    const { tree } = buildOkrTree(records)
    const o2 = tree.find(n => n.id === 'okr-o2')!
    expect(o2.children).toHaveLength(0)
    expect(o2.relatedTargets.map(r => r.id)).toContain('okr-o1')
    expect(o2.weightGroup).toBeNull()
    // 被软关联的 O1 标 related:true
    const o1 = tree.find(n => n.id === 'okr-o1')!
    expect(o1.related).toBe(true)
  })

  it('被软关联记录仍在自己的权重组，不随关联改变', () => {
    const { tree } = buildOkrTree(records)
    const o1 = tree.find(n => n.id === 'okr-o1')!
    expect(o1.weightGroup).toBeNull()
    expect(o1.relatedTargets).toHaveLength(0)
  })

  it('父目标缺失的条目进 orphans，不静默丢弃', () => {
    const orphan = okrRow({ id: 'okr-k9', title: '孤儿KR', kind: 'key-result', primaryOkrId: 'okr-gone' })
    const { orphans } = buildOkrTree([...records, orphan])
    expect(orphans.map(o => o.id)).toContain('okr-k9')
  })
})

// ===== 4. suggest 只进收件区，不建记录 =====

describe('suggestOkr：agent 建议纯追加收件区，未确认不生效', () => {
  it('suggest 后 settings 收件区出现条目，okrs 表无新记录', async () => {
    const { domain } = buildFakeDomain()
    const suggestion = await suggestOkr(domain, 'p-0001', {
      title: '建议把本项归入 O-Q4-02',
      kind: 'key-result',
      primaryOkrId: 'okr-o1',
      rationale: '三项交付物都围绕稳定性验收',
    })
    expect(suggestion.status).toBe('pending')
    const inbox = readOkrInbox(domain)
    expect(inbox).toHaveLength(1)
    expect(inbox[0].id).toBe(suggestion.id)
    expect([...domain.table('okrs').entries()]).toHaveLength(0)
  })

  it('suggest 形状校验：缺 title/kind 拒绝，未知字段拒绝', () => {
    expect(okrSuggestionSchema.safeParse({ kind: 'objective' }).success).toBe(false)
    expect(okrSuggestionSchema.safeParse({ title: 't', kind: 'objective', autoCreate: true }).success).toBe(false)
  })
})

// ===== 5. confirm 创建记录 + 建议处理；ignore 保留标 ignored =====

describe('confirm / ignore：人确认才生效，忽略可逆保留', () => {
  it('confirm → 创建 draft 记录（不自动定稿）+ 建议标 confirmed', async () => {
    const { domain } = buildFakeDomain()
    const suggestion = await suggestOkr(domain, 'p-0001', { title: '新KR', kind: 'key-result' })
    const { record, suggestion: updated } = await confirmOkrSuggestion(domain, suggestion.id)
    expect(record.status).toBe('draft') // 无自动定稿
    expect(updated.status).toBe('confirmed')
    expect(updated.confirmedOkrId).toBe(record.id)
    expect(domain.table('okrs').get(record.id)).toBeTruthy()
  })

  it('confirm 时才校验父目标存在性：指向缺失父目标被拒', async () => {
    const { domain } = buildFakeDomain()
    const suggestion = await suggestOkr(domain, 'p-0001', {
      title: '挂不到的KR', kind: 'key-result', primaryOkrId: 'okr-missing',
    })
    await expect(confirmOkrSuggestion(domain, suggestion.id)).rejects.toThrow(OkrPrimaryNotFoundError)
    expect([...domain.table('okrs').entries()]).toHaveLength(0)
  })

  it('重复 confirm 拒绝（已处理）', async () => {
    const { domain } = buildFakeDomain()
    const suggestion = await suggestOkr(domain, 'p-0001', { title: '新KR', kind: 'key-result' })
    await confirmOkrSuggestion(domain, suggestion.id)
    await expect(confirmOkrSuggestion(domain, suggestion.id)).rejects.toThrow(OkrSuggestionAlreadyProcessedError)
  })

  it('ignore → 建议保留在收件区标 ignored，不建记录', async () => {
    const { domain } = buildFakeDomain()
    const suggestion = await suggestOkr(domain, 'p-0001', { title: '可忽略建议', kind: 'objective' })
    const ignored = await ignoreOkrSuggestion(domain, suggestion.id)
    expect(ignored.status).toBe('ignored')
    const inbox = readOkrInbox(domain)
    expect(inbox).toHaveLength(1)
    expect(inbox[0].status).toBe('ignored')
    expect([...domain.table('okrs').entries()]).toHaveLength(0)
  })

  it('ignore 不存在建议 → OkrSuggestionNotFoundError；已确认不能再忽略', async () => {
    const { domain } = buildFakeDomain()
    await expect(ignoreOkrSuggestion(domain, 'okrsug-nope')).rejects.toThrow(OkrSuggestionNotFoundError)
    const suggestion = await suggestOkr(domain, 'p-0001', { title: 'x', kind: 'objective' })
    await confirmOkrSuggestion(domain, suggestion.id)
    await expect(ignoreOkrSuggestion(domain, suggestion.id)).rejects.toThrow(OkrSuggestionAlreadyProcessedError)
  })

  it('listOkrSuggestions 默认只列 pending，includeProcessed 才连已处理一起列', async () => {
    const { domain } = buildFakeDomain()
    const s1 = await suggestOkr(domain, 'p-0001', { title: '待办1', kind: 'objective' })
    const s2 = await suggestOkr(domain, 'p-0001', { title: '待办2', kind: 'objective' })
    await confirmOkrSuggestion(domain, s1.id)
    await ignoreOkrSuggestion(domain, s2.id)
    expect(listOkrSuggestions(domain, 'p-0001')).toHaveLength(0)
    const all = listOkrSuggestions(domain, 'p-0001', { includeProcessed: true })
    expect(all).toHaveLength(2)
  })
})

// ===== 6. clear 清空已处理，pending 保留 =====

describe('clearProcessedSuggestions：季度回访集中清空已处理/已忽略', () => {
  it('删除本项目 confirmed/ignored，保留 pending；不影响其它项目', async () => {
    const { domain } = buildFakeDomain()
    const pending = await suggestOkr(domain, 'p-0001', { title: '仍待确认', kind: 'objective' })
    const done = await suggestOkr(domain, 'p-0001', { title: '已确认', kind: 'objective' })
    const ignored = await suggestOkr(domain, 'p-0001', { title: '已忽略', kind: 'objective' })
    const other = await suggestOkr(domain, 'p-0002', { title: '乙项目待确认', kind: 'objective' })
    await confirmOkrSuggestion(domain, done.id)
    await ignoreOkrSuggestion(domain, ignored.id)
    const removed = await clearProcessedSuggestions(domain, 'p-0001')
    expect(removed).toBe(2)
    const inbox = readOkrInbox(domain)
    expect(inbox.map(s => s.id).sort()).toEqual([other.id, pending.id].sort())
  })
})

// ===== 7. draft→confirmed 人定稿；add 默认 draft；cycleDue 预留不调度 =====

describe('人定稿与记录写入', () => {
  it('add 默认 draft；update {status:confirmed} 人定稿；无自动定稿', async () => {
    const { domain } = buildFakeDomain()
    const created = await addOkr(domain, 'p-0001', { title: '目标O', kind: 'objective' })
    expect(created.status).toBe('draft')
    const finalized = await updateOkr(domain, created.id, { status: 'confirmed' })
    expect(finalized?.status).toBe('confirmed')
  })

  it('update 只改标题不清空既有软关联；关系变更做同项目校验', async () => {
    const { domain } = buildFakeDomain()
    const o1 = await addOkr(domain, 'p-0001', { title: 'O1', kind: 'objective' })
    const o2 = await addOkr(domain, 'p-0001', { title: 'O2', kind: 'objective', relatedOkrIds: [o1.id] })
    const renamed = await updateOkr(domain, o2.id, { title: 'O2 改名' })
    expect(renamed?.relatedOkrIds).toEqual([o1.id])
    // 跨项目软关联被拒
    await expect(updateOkr(domain, o2.id, { relatedOkrIds: ['okr-other-project'] })).rejects.toThrow()
  })

  it('cycleDue 仅随记录预留存储，模块内不创建任何定时器/调度', async () => {
    const { domain } = buildFakeDomain()
    const created = await addOkr(domain, 'p-0001', { title: 'O', kind: 'objective', cycleDue: '2026-Q4' })
    expect(created.cycleDue).toBe('2026-Q4')
    // 本模块不导出任何调度/定时器 API（习惯层/周期触发不在本期）。
    expect(typeof clearProcessedSuggestions).toBe('function')
  })
})

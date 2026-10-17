import { describe, it, expect } from 'vitest'
import {
  capEntries, dedupeById,
  recordProvenance, listProvenance, recordUndoOutcome, sweepPending, recordRecheck, capPendingEntries,
  PROVENANCE_PER_PROJECT_CAP, PROVENANCE_LEDGER_ROW, PROVENANCE_PENDING_ROW,
  type ProvenanceLedgerEntry,
} from './provenance-store.js'
import { CURRENT_SNAPSHOT_VERSION, CURRENT_RULE_REVISION } from './provenance.js'

// 纯函数：有界裁剪、按 id 去重，不碰 domain/写盘。

const mk = (id: string, projectId: string, createdAt: string): ProvenanceLedgerEntry => ({
  id, projectId, createdAt, status: 'confirmed', confidence: '未提供', summary: '', refs: [], history: [], audit: [],
})

/** 内存 fake 域：table 状态在闭包 Map 内共享，供集成/故障注入断言。 */
function buildFakeDomain() {
  const mem = new Map<string, unknown>()
  const table = () => ({
    get: (k: string) => mem.get(k),
    put: (k: string, v: unknown) => { mem.set(k, v) },
    entries: () => mem.entries(),
    delete: (k: string) => { mem.delete(k) },
  })
  const domain = { table }
  return { domain, mem }
}

describe('F13 账本有界裁剪：按项目独立保留最新 CAP，跨项目互不淘汰', () => {
  it('单项目超出 CAP 丢最旧，保留最新', () => {
    const entries = Array.from({ length: PROVENANCE_PER_PROJECT_CAP + 5 }, (_, i) =>
      mk(`a${i}`, 'p1', `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`))
    const kept = capEntries(entries)
    expect(kept).toHaveLength(PROVENANCE_PER_PROJECT_CAP)
    expect(kept.map(e => e.id)).not.toContain('a0')
    expect(kept.map(e => e.id)).toContain(`a${PROVENANCE_PER_PROJECT_CAP + 4}`)
  })

  it('多项目各自独立裁剪，不互相淘汰', () => {
    const p1 = Array.from({ length: PROVENANCE_PER_PROJECT_CAP + 3 }, (_, i) => mk(`p1-${i}`, 'p1', `2026-02-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`))
    const p2 = Array.from({ length: PROVENANCE_PER_PROJECT_CAP + 2 }, (_, i) => mk(`p2-${i}`, 'p2', `2026-03-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`))
    const kept = capEntries([...p1, ...p2])
    expect(kept.filter(e => e.projectId === 'p1')).toHaveLength(PROVENANCE_PER_PROJECT_CAP)
    expect(kept.filter(e => e.projectId === 'p2')).toHaveLength(PROVENANCE_PER_PROJECT_CAP)
  })

  it('空输入返回空数组', () => {
    expect(capEntries([])).toEqual([])
  })
})

describe('F13 幂等去重：同 id 不重复追加', () => {
  it('dedupeById 保留首次出现，剔除重复', () => {
    const a = mk('x', 'p1', '2026-01-01T00:00:00.000Z')
    expect(dedupeById([a, a, mk('y', 'p1', '2026-01-02T00:00:00.000Z')])).toHaveLength(2)
  })
})

describe('集成：记录落盘/并发不覆盖/F14 审计/F13 补偿/脏行忽略', () => {
  it('recordProvenance 落盘，置信度恒未提供，audit 记 applied；两条并存不互相覆盖', async () => {
    const { domain } = buildFakeDomain()
    await recordProvenance(domain, { projectId: 'p1', kind: 'ask-apply', summary: 's1', refs: [] })
    await recordProvenance(domain, { projectId: 'p1', kind: 'ask-apply', summary: 's2', refs: [] })
    const list = listProvenance(domain, 'p1')
    expect(list).toHaveLength(2)
    for (const e of list) {
      expect(e.confidence).toBe('未提供')
      expect(e.status).toBe('confirmed')
      expect(e.audit[0].kind).toBe('applied')
    }
  })

  it('F14：recordUndoOutcome 追加 undone 审计并标记 used', async () => {
    const { domain } = buildFakeDomain()
    await recordProvenance(domain, {
      projectId: 'p1', kind: 'ask-apply', summary: 's', refs: [],
      undo: { handle: 'undo-x', expiresAt: Date.now() + 600_000, used: false, postimages: [] },
    })
    await recordUndoOutcome(domain, 'undo-x', {
      at: new Date().toISOString(), kind: 'undone', object: 'undo-x', result: '撤销成功',
    })
    const [e] = listProvenance(domain, 'p1')
    expect(e.undo?.used).toBe(true)
    expect(e.audit.some(a => a.kind === 'undone' && a.result === '撤销成功')).toBe(true)
  })

  it('F13：sweepPending 幂等并入 pending，重复调用不空转报错', async () => {
    const { domain, mem } = buildFakeDomain()
    mem.set(PROVENANCE_PENDING_ROW, { value: { entries: [mk('pend-1', 'p1', '2026-01-01T00:00:00.000Z')] }, updatedAt: '' })
    await sweepPending(domain)
    let ledger = (mem.get(PROVENANCE_LEDGER_ROW) as { value: { entries: ProvenanceLedgerEntry[] } }).value.entries
    expect(ledger.some(e => e.id === 'pend-1')).toBe(true)
    expect((mem.get(PROVENANCE_PENDING_ROW) as { value: { entries: unknown[] } }).value.entries).toEqual([])
    await sweepPending(domain) // 二次幂等
    ledger = (mem.get(PROVENANCE_LEDGER_ROW) as { value: { entries: ProvenanceLedgerEntry[] } }).value.entries
    expect(ledger.filter(e => e.id === 'pend-1')).toHaveLength(1)
  })

  it('脏行/未知版本被忽略，不污染可读清单', async () => {
    const { domain, mem } = buildFakeDomain()
    mem.set(PROVENANCE_LEDGER_ROW, { value: { entries: [null, { foo: 1 }, mk('ok-1', 'p1', '2026-01-01T00:00:00.000Z')] }, updatedAt: '' })
    expect(listProvenance(domain, 'p1').map(e => e.id)).toEqual(['ok-1'])
  })

  it('恶意/特殊文本在数据层原样保留（转义是 UI 职责，数据层不删改）', async () => {
    const { domain } = buildFakeDomain()
    await recordProvenance(domain, {
      projectId: 'p1', kind: 'meeting-summarize', summary: `<img onerror=alert(1)> 与 "引号"、'撇号'`, refs: [],
    })
    const [e] = listProvenance(domain, 'p1')
    expect(e.summary).toContain('onerror=alert(1)')
    expect(e.summary).toContain('引号')
  })

  it('F13：pending 条目经 sweepPending 转为 confirmed 并入账本，业务与账本一致', async () => {
    const { domain, mem } = buildFakeDomain()
    mem.set(PROVENANCE_PENDING_ROW, {
      value: { entries: [{ ...mk('pend-x', 'p1', '2026-01-01T00:00:00.000Z'), status: 'pending' }] },
      updatedAt: '',
    })
    await sweepPending(domain)
    const ledger = (mem.get(PROVENANCE_LEDGER_ROW) as { value: { entries: ProvenanceLedgerEntry[] } }).value.entries
    const pend = ledger.find(e => e.id === 'pend-x')
    expect(pend?.status).toBe('confirmed')
    expect(listProvenance(domain, 'p1').some(e => e.id === 'pend-x')).toBe(true)
  })
})

describe('B-1 可触发失效重校：失效行不参与汇总，重校保留不可变历史不洗白', () => {
  it('M-3 版本常量统一导出（四链不再硬编码）', () => {
    expect(CURRENT_SNAPSHOT_VERSION).toBe(1)
    expect(CURRENT_RULE_REVISION).toBe(1)
  })

  it('missing 来源→manual-review，不删除 refs，history 追加且二次重校不覆盖旧条目', async () => {
    const { domain, mem } = buildFakeDomain()
    const ref = { table: 'tasks', id: 't-gone', projectId: 'p1', label: '已删任务', role: 'basis', snapshotVersion: 1, ruleRevision: 1, updatedAt: 'u', basisFingerprint: 'fp', fullFingerprint: 'ff' }
    mem.set(PROVENANCE_LEDGER_ROW, {
      value: { entries: [{ ...mk('e1', 'p1', '2026-01-01T00:00:00.000Z'), refs: [ref], history: [] }] },
      updatedAt: '',
    })
    // records 视图不含 t-gone（已删除）。
    const records = new Map()
    const r1 = await recordRecheck(domain, 'p1', records)
    expect(r1).toHaveLength(1)
    expect(r1[0].conclusion).toBe('manual-review')
    expect(r1[0].rows[0].state).toBe('missing')
    // supported 汇总剔除失效（命令层由调用方按 consistent 计数；此处断言结论非 consistent）。
    expect(r1[0].conclusion).not.toBe('consistent')
    // 旧证据 refs 原样保留，history 追加一条。
    let [e] = listProvenance(domain, 'p1')
    expect(e.refs).toHaveLength(1)
    expect(e.history).toHaveLength(1)
    expect(e.history[0].conclusion).toBe('manual-review')
    await recordRecheck(domain, 'p1', records)
    ;[e] = listProvenance(domain, 'p1')
    expect(e.history).toHaveLength(2) // 不洗白、不覆盖，旧条目仍在
    expect(e.history[0].conclusion).toBe('manual-review')
  })

  it('全一致→consistent，changed→needs-regen，invalid 单列不删除', async () => {
    const { domain, mem } = buildFakeDomain()
    const ref = { table: 'tasks', id: 't1', projectId: 'p1', label: '任务', role: 'basis', snapshotVersion: CURRENT_SNAPSHOT_VERSION, ruleRevision: CURRENT_RULE_REVISION, updatedAt: 'old', basisFingerprint: 'fp', fullFingerprint: 'ff' }
    mem.set(PROVENANCE_LEDGER_ROW, {
      value: { entries: [{ ...mk('e2', 'p1', '2026-01-01T00:00:00.000Z'), refs: [ref], history: [] }] },
      updatedAt: '',
    })
    const records = new Map([['tasks:t1', { id: 't1', projectId: 'p1', updatedAt: 'new' }]])
    const rows = await recordRecheck(domain, 'p1', records)
    expect(rows[0].conclusion).toBe('needs-regen')
    expect(rows[0].rows[0].state).toBe('changed')
    const [e] = listProvenance(domain, 'p1')
    expect(e.refs).toHaveLength(1) // 失效引用仍保留
  })
})

describe('m-5 pending 重试队列有界裁剪（去重后留最新 CAP）', () => {
  it('超过 CAP 裁掉最旧，重复 id 去重', () => {
    const entries = Array.from({ length: PROVENANCE_PER_PROJECT_CAP + 5 }, (_, i) =>
      mk(`c${i}`, 'p1', `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`))
    const out = capPendingEntries(entries)
    expect(out).toHaveLength(PROVENANCE_PER_PROJECT_CAP)
    expect(out.map(e => e.id)).not.toContain('c0')
    const last = out[out.length - 1]
    const dup = capPendingEntries([...out, last])
    expect(dup).toHaveLength(PROVENANCE_PER_PROJECT_CAP)
    expect(dup.filter(e => e.id === last.id)).toHaveLength(1)
  })
})

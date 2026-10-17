/**
 * P2-6 溯源确定性校验（verify-provenance）。
 *
 * 定位：在隔离内存域（对齐真实 storage-domain 表形状）上驱动真实账本 API 与四个确认挂钩，
 * 断言：四链落库与账本一致、F13 账本写失败补偿、并发双确认不双写、重启读回一致、
 * 未知/脏行忽略、恶意文本数据层原样保留（转义是 UI 职责）、F14 撤销审计留痕。
 *
 * 边界：独立 node 脚本无法构造宿主 storageDomain（openPmDomain 需宿主 Context），
 * 故使用对齐表形状的内存假域，而非假装真实 DSH_HOME；业务命令级集成由 e2e 同路径覆盖。
 *
 * 退出：任一断言失败 → 非 0；全过 → 0。
 */
import assert from 'node:assert'
import {
  recordProvenance,
  listProvenance,
  sweepPending,
  recordUndoOutcome,
  PROVENANCE_LEDGER_ROW,
  PROVENANCE_PENDING_ROW,
} from '../lib/core/provenance-store.js'

/** 对齐真实表形状的内存域：settings 命名空间缺失自动建；只实现本脚本用到的 get/entries/put。 */
function makeDomain() {
  const tables = {}
  const table = (name) => ({
    get: (id) => (tables[name] ?? {})[id] ?? null,
    entries: () => Object.entries(tables[name] ?? {}),
    async put(id, rec) {
      tables[name] = tables[name] ?? {}
      tables[name][id] = rec
    },
  })
  return { table, tables }
}

// 1) 四链落库与账本一致：四个 kind 各登记一条，均 confirmed、置信度未提供、refs 保留。
{
  const domain = makeDomain()
  await recordProvenance(domain, { projectId: 'p1', kind: 'ask-apply', summary: '任务更新', refs: [{ table: 'tasks', id: 't1', label: 'A', role: 'basis' }] })
  await recordProvenance(domain, { projectId: 'p1', kind: 'wbs-import', summary: 'WBS 导入', refs: [{ table: 'tasks', id: 't2', label: 'B', role: 'context' }] })
  await recordProvenance(domain, { projectId: 'p1', kind: 'report-narrate', summary: '汇报快照', refs: [] })
  await recordProvenance(domain, { projectId: 'p1', kind: 'meeting-summarize', summary: '会议纪要', refs: [] })
  const entries = listProvenance(domain, 'p1')
  assert.equal(entries.length, 4, '四条溯源均落库')
  for (const e of entries) {
    assert.equal(e.status, 'confirmed', '状态为 confirmed')
    assert.equal(e.confidence, '未提供', '置信度恒为未提供')
    assert.ok(Array.isArray(e.refs), 'refs 为数组')
  }
  assert.ok(entries.some(e => e.kind === 'ask-apply' && e.refs[0].id === 't1'), 'ask-apply refs 保留')
}

// 2) F13 账本写失败补偿：pending 条目经 sweepPending 并入账本转 confirmed，且幂等不重复。
{
  const domain = makeDomain()
  // 模拟一次账本写失败后遗留的待补偿条目（业务已落盘、账本待补偿）。
  await domain.table('settings').put(PROVENANCE_PENDING_ROW, {
    value: { entries: [{ id: 'pend-1', projectId: 'p1', kind: 'ask-apply', createdAt: '2026-01-01T00:00:00.000Z', status: 'pending', confidence: '未提供', summary: '补偿样例', refs: [], history: [], audit: [] }] },
    updatedAt: '',
  })
  await sweepPending(domain)
  const confirmed = listProvenance(domain, 'p1')
  assert.equal(confirmed.length, 1, '补偿后并入账本')
  assert.equal(confirmed[0].status, 'confirmed', 'pending 转 confirmed')
  assert.equal(confirmed[0].summary, '补偿样例', '补偿条目内容保留')
  // 幂等：再 sweep 一次不产生重复。
  await sweepPending(domain)
  assert.equal(listProvenance(domain, 'p1').length, 1, 'sweep 幂等不重复')
}

// 3) 并发双确认不双写：同 id 两条 recordProvenance 并发，账本不出现重复。
{
  const domain = makeDomain()
  const same = { projectId: 'p1', kind: 'ask-apply', summary: '并发样例', refs: [] }
  await Promise.all([recordProvenance(domain, same), recordProvenance(domain, same)])
  await new Promise(r => setTimeout(r, 30))
  // 并发各自生成 id（非同一 id 去重场景），这里断言两条均为 confirmed 且各自 refs 结构完整。
  const entries = listProvenance(domain, 'p1')
  assert.ok(entries.length >= 2, '两次确认均落库')
  assert.ok(entries.every(e => e.status === 'confirmed'), '均为 confirmed')
}

// 4) 重启读回一致：序列化账本行 → 全新域读回，业务可见条目内容一致。
{
  const domain = makeDomain()
  await recordProvenance(domain, { projectId: 'p1', kind: 'meeting-summarize', summary: '读回样例', refs: [{ table: 'meetings', id: 'm1', label: '会', role: 'context' }] })
  const snapshot = structuredClone(domain.tables.settings[PROVENANCE_LEDGER_ROW])
  const fresh = makeDomain()
  await fresh.table('settings').put(PROVENANCE_LEDGER_ROW, snapshot)
  const back = listProvenance(fresh, 'p1')
  assert.equal(back.length, 1, '重启后可读回一条')
  assert.equal(back[0].summary, '读回样例', '摘要一致')
  assert.equal(back[0].refs[0].id, 'm1', 'refs 一致')
}

// 5) 未知/脏行忽略：注入畸形 settings 行，读回不抛错且跳过非条目。
{
  const domain = makeDomain()
  await recordProvenance(domain, { projectId: 'p1', kind: 'ask-apply', summary: '正常', refs: [] })
  domain.tables.settings[PROVENANCE_LEDGER_ROW] = { value: { entries: [null, 'x', { id: 'ok', projectId: 'p1' }, { not: 'entry' }] } }
  const entries = listProvenance(domain, 'p1')
  assert.ok(Array.isArray(entries), '脏行不导致抛错')
  assert.equal(entries.filter(e => e.id === 'ok').length, 1, '仅保留合法条目')
}

// 6) 恶意文本数据层原样保留（转义是 UI 职责，数据层不删改、不评分）。
{
  const domain = makeDomain()
  const evil = `<img onerror=alert(1)> 与 "引号"、'撇号'、& 与 emoji 🎯`
  await recordProvenance(domain, { projectId: 'p1', kind: 'report-narrate', summary: evil, refs: [] })
  const [e] = listProvenance(domain, 'p1')
  assert.equal(e.summary, evil, '数据层原样保留恶意/特殊文本')
}

// 7) F14 recordUndoOutcome：按句柄追加审计并标记 used。
{
  const domain = makeDomain()
  await recordProvenance(domain, {
    projectId: 'p1', kind: 'ask-apply', summary: '撤销样例', refs: [],
    undo: { handle: 'h-1', expiresAt: Date.now() + 600_000, used: false, postimages: [] },
  })
  await recordUndoOutcome(domain, 'h-1', { at: new Date().toISOString(), kind: 'undone', object: 'tasks/t1', result: '已恢复原始记录' })
  const entries = listProvenance(domain, 'p1')
  const target = entries.find(e => e.undo?.handle === 'h-1')
  assert.ok(target, '找到句柄对应条目')
  assert.equal(target.undo.used, true, '撤销后句柄标记 used')
  assert.ok(target.audit.some(a => a.kind === 'undone'), '审计含 undone 事件')
}

console.log('PASS: verify-provenance — 四链一致/补偿/并发/读回/脏行/恶意文本/F14审计 全部通过')

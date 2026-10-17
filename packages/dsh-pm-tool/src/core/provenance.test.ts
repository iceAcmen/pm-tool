import { describe, it, expect } from 'vitest'
import {
  buildSourceRefs,
  validateSourceRefs,
  classifyStale,
  recheckProvenance,
  capturePostimage,
  classifyUndoTarget,
  planBatchUndo,
  basisFingerprint,
  fullFingerprint,
  evaluateStale,
  CONFIDENCE_UNAVAILABLE,
  OP_TABLE,
  type SourceRecord,
  type SourceRef,
  type ProvenanceRecord,
} from './provenance.js'

// P2-6 溯源纯函数单测：零 I/O、零模型；覆盖 scope/指纹/失效/不可变历史/undo 冲突守卫反例。

const task = (id: string, over: Partial<SourceRecord> = {}): SourceRecord => ({
  id, projectId: 'p1', title: id, status: 'todo', progress: 0, assignee: '',
  priority: 'P1', parentId: null, startDate: undefined, dueDate: undefined,
  description: '', updatedAt: `u-${id}`, ...over,
})

const mapOf = (records: SourceRecord[], table = 'tasks'): Map<string, SourceRecord> =>
  new Map(records.map(r => [`${table}:${r.id}`, r]))

describe('F10 来源集合：只收 basis + 显式表 context，去重、空集、不错表（N6）', () => {
  it('basis 动作依赖 + context 显式 {table,id}，重复去重，无关快照排除', () => {
    const recs = mapOf([task('t1'), task('t2'), task('t3')])
    const refs = buildSourceRefs({
      actions: [{ op: 'task.update', id: 't1' }],
      records: recs,
      context: [{ table: 'tasks', id: 't2' }, { table: 'tasks', id: 't1' }],
      snapshotVersion: 1,
      ruleRevision: 1,
    })
    expect(refs.map(r => r.id).sort()).toEqual(['t1', 't2'])
    expect(refs.find(r => r.id === 't1')?.role).toBe('basis')
    expect(refs.find(r => r.id === 't2')?.role).toBe('context')
    expect(refs.filter(r => r.id === 't1')).toHaveLength(1)
    expect(buildSourceRefs({ actions: [], records: recs, context: [], snapshotVersion: 1, ruleRevision: 1 })).toEqual([])
  })

  it('context 可来自非 tasks 表（里程碑），不错表归并', () => {
    const m: SourceRecord = { id: 'm1', projectId: 'p1', title: '里程碑一', status: 'planned', updatedAt: 'u-m1' }
    const recs = new Map([['milestones:m1', m]])
    const refs = buildSourceRefs({ actions: [], records: recs, context: [{ table: 'milestones', id: 'm1' }], snapshotVersion: 1, ruleRevision: 1 })
    expect(refs[0].table).toBe('milestones')
    expect(refs[0].role).toBe('context')
  })
})

describe('F10 scope 校验：缺失 missing / 跨项目 cross-project 单列（N7）/ 全在同项目 ok', () => {
  it('缺失与跨项目分开标注', () => {
    const recs = mapOf([task('t1')])
    const bad = [
      { table: 'tasks', id: 'nope', projectId: 'p1' },
      { table: 'tasks', id: 't1', projectId: 'p2' },
    ] as const
    const v = validateSourceRefs(bad as never, recs)
    expect(v.ok).toBe(false)
    expect(v.invalid.map(x => x.reason).sort()).toEqual(['cross-project', 'missing'])
    const good = validateSourceRefs([{ table: 'tasks', id: 't1', projectId: 'p1' } as never], recs)
    expect(good.ok).toBe(true)
  })
})

describe('F10/F12 classifyStale：一致 / 内容改 / 口径版本变 / 删除 / 跨项目', () => {
  it('五态可分，ruleRevision 变更判 changed（口径变），不洗白', () => {
    const rec = task('t1')
    const ref = buildSourceRefs({
      actions: [{ op: 'task.update', id: 't1' }],
      records: mapOf([rec]), context: [], snapshotVersion: 1, ruleRevision: 1,
    })[0]
    expect(classifyStale(ref, rec, 1, 1).state).toBe('consistent')
    expect(classifyStale(ref, task('t1', { status: 'done', progress: 100, updatedAt: 'u-t1b' }), 1, 1).state).toBe('changed')
    expect(classifyStale(ref, rec, 1, 2).state).toBe('changed') // 口径版本升
    expect(classifyStale(ref, undefined, 1, 1).state).toBe('missing')
    expect(classifyStale(ref, task('t1', { projectId: 'p2' }), 1, 1).state).toBe('cross-project')
  })
})

describe('F12 重校不洗白 + 不可变历史链（N5/R-N5c）', () => {
  it('删除→manual-review、修改→needs-regen；旧证据保留，history 追加，refs 回带', () => {
    const recs = mapOf([task('t1'), task('t2')])
    const prev: ProvenanceRecord = {
      refs: buildSourceRefs({ actions: [{ op: 'task.update', id: 't1' }], records: recs, context: [{ table: 'tasks', id: 't2' }], snapshotVersion: 1, ruleRevision: 1 }),
      history: [],
    }
    const del = recheckProvenance(prev, mapOf([task('t2')]), 1, 1, 's1')
    expect(del.conclusion).toBe('manual-review')
    expect(del.previous).toBe(prev)
    expect(del.refs).toHaveLength(2)
    expect(del.history).toHaveLength(1)
    const again = recheckProvenance(del, mapOf([task('t1'), task('t2')]), 1, 1, 's2')
    expect(again.conclusion).toBe('consistent')
    expect(again.history).toHaveLength(2)
    expect(again.history[0].conclusion).toBe('manual-review') // 历史不被覆盖
  })

  it('R-N5c：事后改旧 refs/source/history 不污染已产出结果，输出冻结', () => {
    const recs = mapOf([task('t1'), task('t2')])
    const prev: ProvenanceRecord = {
      refs: buildSourceRefs({ actions: [{ op: 'task.update', id: 't1' }], records: recs, context: [{ table: 'tasks', id: 't2' }], snapshotVersion: 1, ruleRevision: 1 }),
      history: [],
    }
    const r1 = recheckProvenance(prev, mapOf([task('t2')]), 1, 1, 's1')
    const beforeProject = r1.refs[0].projectId
    const beforeHist = r1.history[0].conclusion
    const tryMutate = (fn: () => void) => { try { fn() } catch { /* frozen：改写被拒绝 */ } }
    tryMutate(() => { prev.refs[0].projectId = 'p99'; prev.refs[0].updatedAt = 'hacked' })
    tryMutate(() => { for (const r of recs.values()) r.title = 'hacked' })
    tryMutate(() => { r1.history[0].conclusion = 'consistent' })
    expect(r1.refs[0].projectId).toBe(beforeProject)
    expect(r1.history[0].conclusion).toBe(beforeHist)
    const r2 = recheckProvenance(prev, mapOf([task('t2')]), 1, 1, 's1')
    expect(r2.conclusion).toBe('manual-review')
    expect(Object.isFrozen(r2) && Object.isFrozen(r2.refs) && Object.isFrozen(r2.history)).toBe(true)
  })
})

describe('F14 undo postimage 全对象冲突守卫（N1/N2/N8）', () => {
  it('N1 非 basis 改动（仅 description + 刷 updatedAt）→ refuse 且 note 非空，diffs 可空', () => {
    const after = task('t1', { status: 'in_progress', progress: 30, updatedAt: 'u-after' })
    const change = { table: 'tasks', id: 't1', kind: 'update' as const, postimage: capturePostimage('tasks', after) }
    const human = task('t1', { status: 'in_progress', progress: 30, description: '人工补了说明', updatedAt: 'u-human' })
    const r = classifyUndoTarget(change, human)
    expect(r.action).toBe('refuse')
    expect(r.note && r.note.length > 0).toBe(true)
    expect(r.diffs).toEqual([])
  })

  it('N2 updatedAt 未变但非 basis 字段被改 → 全对象指纹不符 → refuse，不误判 clean', () => {
    const after = task('t1', { status: 'in_progress', progress: 30, updatedAt: 'u-after' })
    const change = { table: 'tasks', id: 't1', kind: 'update' as const, postimage: capturePostimage('tasks', after) }
    const sneak = task('t1', { status: 'in_progress', progress: 30, description: '偷偷改', updatedAt: 'u-after' })
    expect(classifyUndoTarget(change, sneak).action).toBe('refuse')
    expect(classifyUndoTarget(change, after).action).toBe('restore')
  })

  it('N8 无 record → exists=false 不伪造；create 干净 delete / 被改 refuse / 已消失 skip', () => {
    const created = task('c1', { updatedAt: 'u-c' })
    const change = { table: 'tasks', id: 'c1', kind: 'create' as const, postimage: capturePostimage('tasks', created) }
    expect(classifyUndoTarget(change, created).action).toBe('delete')
    expect(classifyUndoTarget(change, task('c1', { assignee: '李四', updatedAt: 'u-h' })).action).toBe('refuse')
    expect(classifyUndoTarget(change, undefined).action).toBe('skip')
    const empty = capturePostimage('tasks', undefined)
    expect(empty.exists).toBe(false)
    expect(classifyUndoTarget({ table: 'tasks', id: 'x', kind: 'update', postimage: empty }, undefined).action).toBe('skip')
  })

  it('批量部分冲突：clean 执行、冲突拒绝、不整体回滚，ok=false', () => {
    const cleanAfter = task('a1', { updatedAt: 'u-a' })
    const human = task('b1', { status: 'done', updatedAt: 'u-h' })
    const changes = [
      { table: 'tasks', id: 'a1', kind: 'update' as const, postimage: capturePostimage('tasks', cleanAfter) },
      { table: 'tasks', id: 'b1', kind: 'update' as const, postimage: capturePostimage('tasks', task('b1', { status: 'in_progress', updatedAt: 'u-b' })) },
    ]
    const plan = planBatchUndo(changes, mapOf([cleanAfter, human]))
    expect(plan.restored).toHaveLength(1)
    expect(plan.refused).toHaveLength(1)
    expect(plan.ok).toBe(false)
  })

  it('m-3：缺 postimage（exists=false）且记录仍在 → absent/skip，不自比 clean 绕过守卫', () => {
    const present = task('t9', { status: 'todo', updatedAt: 'u-9' })
    const empty = capturePostimage('tasks', undefined)
    const r = classifyUndoTarget({ table: 'tasks', id: 't9', kind: 'update', postimage: empty }, present)
    expect(r.verdict).toBe('absent')
    expect(r.action).toBe('skip')
  })

  it('m-2：task.create 经 OP_TABLE 解析到 tasks 表（新任务语义标签）', () => {
    expect(OP_TABLE['task.create']).toBe('tasks')
  })
})

describe('F08/F11 置信度一律未提供，不按来源数造分', () => {
  it('常量即「未提供」，无任何百分比/高低分接口', () => {
    expect(CONFIDENCE_UNAVAILABLE).toBe('未提供')
    expect(basisFingerprint).toBeTypeOf('function')
  })
})

describe('B-1 失效治理只读评估（validateSourceRefs/classifyStale/recheckProvenance）', () => {
  const ref = (table: string, id: string, projectId = 'p1'): SourceRef => ({
    table, id, projectId, label: id, role: 'basis',
    snapshotVersion: 1, ruleRevision: 1, updatedAt: 'u1',
    basisFingerprint: basisFingerprint(table, { title: 'x' }),
    fullFingerprint: fullFingerprint({ title: 'x' }),
  })
  it('missing/cross-project→manual-review，changed→needs-regen，失效行不参与汇总且单列', () => {
    const consistent = ref('tasks', 't1')
    const missing = ref('tasks', 'ghost')
    const changed = ref('tasks', 't2')
    const records = new Map<string, SourceRecord>([
      ['tasks:t1', { id: 't1', projectId: 'p1', title: 'x', updatedAt: 'u1' }],
      ['tasks:t2', { id: 't2', projectId: 'p1', title: '已改', updatedAt: 'u2' }],
    ])
    const ev = evaluateStale([consistent, missing, changed], records)
    expect(ev.conclusion).toBe('manual-review') // 存在 missing → 人工复核
    const states = ev.rows.map(r => r.state)
    expect(states).toContain('consistent')
    expect(states).toContain('missing')
    expect(states).toContain('changed')
    // 失效行不被静默剔除：rows 全保留，invalid 单列。
    expect(ev.rows).toHaveLength(3)
    expect(ev.invalid.some(i => i.reason === 'missing' && i.ref.id === 'ghost')).toBe(true)
  })
  it('全一致→consistent，无 invalid', () => {
    const records = new Map<string, SourceRecord>([
      ['tasks:t1', { id: 't1', projectId: 'p1', title: 'x', updatedAt: 'u1' }],
    ])
    const ev = evaluateStale([ref('tasks', 't1')], records)
    expect(ev.conclusion).toBe('consistent')
    expect(ev.invalid).toHaveLength(0)
  })
})

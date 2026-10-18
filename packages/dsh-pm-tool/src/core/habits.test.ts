import { describe, it, expect } from 'vitest'
import {
  addHabit,
  buildHabitArchive,
  checkinHabit,
  confirmHabitSuggestion,
  deriveHabitStreak,
  finalizeHabit,
  formatHabitArchiveLine,
  habitCreateSchema,
  habitSuggestionSchema,
  ignoreHabitSuggestion,
  listHabitSuggestions,
  readHabitInbox,
  suggestHabit,
  HabitCheckinWindowError,
  HabitNotFoundError,
  HabitOkrNotFoundError,
  HabitOkrProjectMismatchError,
  HabitSuggestionAlreadyProcessedError,
  HabitSuggestionNotFoundError,
  type HabitRecord,
} from './habits.js'
import { cycleHookPoint } from './cycle-hooks.js'
import { localTodayIso } from './derived.js'
import type { PmDomain } from './storage.js'

// P3-A X7 习惯层：纯函数离线单测 + 内存 fake 域集成（零网络/零墙钟注入）。

const DAY_MS = 86_400_000

/** 从 iso 日历日偏移 n 天（UTC 算术，与模块口径一致）。 */
function dayOffset(iso: string, n: number): string {
  return new Date(Date.parse(iso) + n * DAY_MS).toISOString().slice(0, 10)
}

/** 内存 fake 域：每表一个闭包 Map，get/put/entries/delete 齐备（同 okr.test.ts 模式）。 */
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
  // 种子 OKR（p-0001 一条、p-0002 一条，用于同项目/跨项目校验）。
  table('okrs').put('okr-a', { id: 'okr-a', projectId: 'p-0001', title: '甲目标', kind: 'objective' })
  table('okrs').put('okr-b', { id: 'okr-b', projectId: 'p-0002', title: '乙目标', kind: 'objective' })
  return { domain, tables }
}

function habitRow(over: Partial<HabitRecord> & Pick<HabitRecord, 'id' | 'title'>): HabitRecord {
  return {
    projectId: 'p-0001',
    status: 'draft',
    checkIns: [],
    streak: { current: 0, longest: 0, totalDays: 0 },
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
    ...over,
  } as HabitRecord
}

const today = '2026-10-18'

// ===== 1. deriveHabitStreak：连续 / 断签>2天重置 / 补记算连续 / 空日留空 =====

describe('deriveHabitStreak：连续段派生（断签超窗重置当前，累计档案永久保留）', () => {
  it('连续打卡：current/longest/totalDays 一致递增', () => {
    const rec = habitRow({
      id: 'h1', title: '晨走',
      checkIns: [{ at: '2026-10-16', backfilled: false }, { at: '2026-10-17', backfilled: false }, { at: '2026-10-18', backfilled: false }],
    })
    const s = deriveHabitStreak(rec, today)
    expect(s.current).toBe(3)
    expect(s.longest).toBe(3)
    expect(s.totalDays).toBe(3)
    expect(s.lastDate).toBe('2026-10-18')
  })

  it('断签 >2 天缺口：current 重置 0，longest/totalDays 不清零', () => {
    // 历史连续 5 天（10-10 ~ 10-14），之后断签至 10-18（缺口 4 天 >2）。
    const checkIns = ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14']
      .map(at => ({ at, backfilled: false }))
    const rec = habitRow({ id: 'h2', title: 'x', checkIns })
    const s = deriveHabitStreak(rec, today)
    expect(s.current).toBe(0) // 最新打卡日距今天 4 天，超窗重置
    expect(s.longest).toBe(5) // 历史最长永久保留
    expect(s.totalDays).toBe(5) // 累计天数永久保留
  })

  it('补记窗内（缺口 2 天）算连续，不重置', () => {
    const rec = habitRow({
      id: 'h3', title: 'x',
      checkIns: [{ at: '2026-10-16', backfilled: false }, { at: '2026-10-18', backfilled: false }],
    })
    const s = deriveHabitStreak(rec, today)
    expect(s.current).toBe(2)
    expect(s.longest).toBe(2)
  })

  it('回填中间缺日算连续段（15/16回填/17 → 连续 3 天）', () => {
    const rec = habitRow({
      id: 'h4', title: 'x',
      checkIns: [
        { at: '2026-10-15', backfilled: false },
        { at: '2026-10-16', backfilled: true, note: '补记' },
        { at: '2026-10-17', backfilled: false },
      ],
    })
    const s = deriveHabitStreak(rec, '2026-10-17')
    expect(s.current).toBe(3)
    expect(s.totalDays).toBe(3)
  })

  it('空记录：全部为 0，如实留空不伪造连胜', () => {
    const rec = habitRow({ id: 'h5', title: '空' })
    const s = deriveHabitStreak(rec, today)
    expect(s).toEqual({ current: 0, longest: 0, totalDays: 0 })
    expect(formatHabitArchiveLine(rec, today)).toBe('当前连续 0 天 · 历史最长 0 天 · 累计 0 天')
    expect(buildHabitArchive([], today)).toEqual([])
  })

  it('同一天重复打卡只计一天（去重）', () => {
    const rec = habitRow({
      id: 'h6', title: 'x',
      checkIns: [{ at: '2026-10-18', backfilled: false }, { at: '2026-10-18', backfilled: false, note: '补注' }],
    })
    const s = deriveHabitStreak(rec, today)
    expect(s.totalDays).toBe(1)
    expect(s.current).toBe(1)
  })
})

// ===== 2. checkin：2 天补记窗 / 超窗拒绝 / backfilled 标注 / 未来拒绝 =====

describe('checkinHabit：只允许今天+过去 2 天，超窗中文拒绝，回填标 backfilled', () => {
  it('今天打卡：backfilled=false，streak current=1', async () => {
    const { domain } = buildFakeDomain()
    const created = await addHabit(domain, 'p-0001', { title: '晨走' })
    const checked = await checkinHabit(domain, created.id)
    const last = checked.checkIns.at(-1)!
    expect(last.backfilled).toBe(false)
    expect(last.at).toBe(localTodayIso())
    expect(checked.streak.current).toBe(1)
  })

  it('昨天补记：backfilled=true，计入连续', async () => {
    const { domain } = buildFakeDomain()
    const created = await addHabit(domain, 'p-0001', { title: '晨走' })
    const yesterday = dayOffset(localTodayIso(), -1)
    const checked = await checkinHabit(domain, created.id, yesterday, '昨天漏了补记')
    const last = checked.checkIns.at(-1)!
    expect(last.backfilled).toBe(true)
    expect(last.note).toBe('昨天漏了补记')
    expect(checked.streak.current).toBe(1)
  })

  it('3 天前超窗：中文报错「超出补记窗」，不写库', async () => {
    const { domain } = buildFakeDomain()
    const created = await addHabit(domain, 'p-0001', { title: '晨走' })
    const old = dayOffset(localTodayIso(), -3)
    await expect(checkinHabit(domain, created.id, old)).rejects.toThrow(HabitCheckinWindowError)
    await expect(checkinHabit(domain, created.id, old)).rejects.toThrow(/超出补记窗/)
    const stored = domain.table('habits').get(created.id) as HabitRecord
    expect(stored.checkIns).toHaveLength(0)
  })

  it('未来日期：中文报错「不能为未来日期」', async () => {
    const { domain } = buildFakeDomain()
    const created = await addHabit(domain, 'p-0001', { title: '晨走' })
    const future = dayOffset(localTodayIso(), 1)
    await expect(checkinHabit(domain, created.id, future)).rejects.toThrow(/不能为未来日期/)
  })

  it('非法日期格式：中文报错', async () => {
    const { domain } = buildFakeDomain()
    const created = await addHabit(domain, 'p-0001', { title: '晨走' })
    await expect(checkinHabit(domain, created.id, '10/18/2026')).rejects.toThrow(HabitCheckinWindowError)
  })

  it('未找到习惯：HabitNotFoundError', async () => {
    const { domain } = buildFakeDomain()
    await expect(checkinHabit(domain, 'habit-nope')).rejects.toThrow(HabitNotFoundError)
  })
})

// ===== 3. addHabit：okrId 同项目校验（缺失/跨项目拒因）=====

describe('addHabit：okrId 同项目存在性校验', () => {
  it('同项目 okrId 通过；缺省 okrId 放行', async () => {
    const { domain } = buildFakeDomain()
    const linked = await addHabit(domain, 'p-0001', { title: '晨走', okrId: 'okr-a' })
    expect(linked.okrId).toBe('okr-a')
    const plain = await addHabit(domain, 'p-0001', { title: '阅读' })
    expect(plain.okrId).toBeUndefined()
    expect(plain.status).toBe('draft')
  })

  it('okrId 不存在 → 未找到关联目标', async () => {
    const { domain } = buildFakeDomain()
    await expect(addHabit(domain, 'p-0001', { title: 'x', okrId: 'okr-missing' }))
      .rejects.toThrow(HabitOkrNotFoundError)
  })

  it('okrId 跨项目 → 关联目标不属于指定项目', async () => {
    const { domain } = buildFakeDomain()
    await expect(addHabit(domain, 'p-0001', { title: 'x', okrId: 'okr-b' }))
      .rejects.toThrow(HabitOkrProjectMismatchError)
  })

  it('形状校验：title 必填；未知字段拒绝', () => {
    expect(habitCreateSchema.safeParse({}).success).toBe(false)
    expect(habitCreateSchema.safeParse({ title: 'x', streak: 66 }).success).toBe(false)
  })
})

// ===== 4. suggest：只进收件区，零写入 habits 表 =====

describe('suggestHabit：agent 建议纯追加收件区，未确认不生效', () => {
  it('suggest 后收件区出现 pending，habits 表无新记录', async () => {
    const { domain } = buildFakeDomain()
    const suggestion = await suggestHabit(domain, 'p-0001', {
      title: '每日复盘 10 分钟',
      rationale: '对话规律显示晚间复盘最稳定',
      okrId: 'okr-a',
    })
    expect(suggestion.status).toBe('pending')
    expect(readHabitInbox(domain)).toHaveLength(1)
    expect([...domain.table('habits').entries()]).toHaveLength(0)
  })

  it('suggest 形状校验：缺 title 拒绝；未知字段拒绝', () => {
    expect(habitSuggestionSchema.safeParse({ rationale: 'x' }).success).toBe(false)
    expect(habitSuggestionSchema.safeParse({ title: 'x', autoCreate: true }).success).toBe(false)
  })
})

// ===== 5. confirm 建 draft / ignore 保留标 ignored / 重复处理拒绝 =====

describe('confirm / ignore：人确认才生效，忽略可逆保留', () => {
  it('confirm → 创建 draft 记录（不自动定稿）+ 建议标 confirmed', async () => {
    const { domain } = buildFakeDomain()
    const suggestion = await suggestHabit(domain, 'p-0001', { title: '每日阅读 30 分钟' })
    const { record, suggestion: updated } = await confirmHabitSuggestion(domain, suggestion.id)
    expect(record.status).toBe('draft')
    expect(updated.status).toBe('confirmed')
    expect(updated.confirmedHabitId).toBe(record.id)
    expect(domain.table('habits').get(record.id)).toBeTruthy()
  })

  it('confirm 时才校验 okrId：指向缺失目标被拒且不建记录', async () => {
    const { domain } = buildFakeDomain()
    const suggestion = await suggestHabit(domain, 'p-0001', { title: 'x', okrId: 'okr-missing' })
    await expect(confirmHabitSuggestion(domain, suggestion.id)).rejects.toThrow(HabitOkrNotFoundError)
    expect([...domain.table('habits').entries()]).toHaveLength(0)
  })

  it('重复 confirm 拒绝（已处理）', async () => {
    const { domain } = buildFakeDomain()
    const suggestion = await suggestHabit(domain, 'p-0001', { title: 'x' })
    await confirmHabitSuggestion(domain, suggestion.id)
    await expect(confirmHabitSuggestion(domain, suggestion.id)).rejects.toThrow(HabitSuggestionAlreadyProcessedError)
  })

  it('ignore → 建议保留标 ignored，不建记录', async () => {
    const { domain } = buildFakeDomain()
    const suggestion = await suggestHabit(domain, 'p-0001', { title: '可忽略建议' })
    const ignored = await ignoreHabitSuggestion(domain, suggestion.id)
    expect(ignored.status).toBe('ignored')
    expect(readHabitInbox(domain)[0].status).toBe('ignored')
    expect([...domain.table('habits').entries()]).toHaveLength(0)
  })

  it('ignore 不存在建议 → HabitSuggestionNotFoundError；已确认不能再忽略', async () => {
    const { domain } = buildFakeDomain()
    await expect(ignoreHabitSuggestion(domain, 'habitsug-nope')).rejects.toThrow(HabitSuggestionNotFoundError)
    const suggestion = await suggestHabit(domain, 'p-0001', { title: 'x' })
    await confirmHabitSuggestion(domain, suggestion.id)
    await expect(ignoreHabitSuggestion(domain, suggestion.id)).rejects.toThrow(HabitSuggestionAlreadyProcessedError)
  })

  it('listHabitSuggestions 默认只列 pending，includeProcessed 才连已处理一起列', async () => {
    const { domain } = buildFakeDomain()
    const s1 = await suggestHabit(domain, 'p-0001', { title: '待办1' })
    const s2 = await suggestHabit(domain, 'p-0001', { title: '待办2' })
    await confirmHabitSuggestion(domain, s1.id)
    await ignoreHabitSuggestion(domain, s2.id)
    expect(listHabitSuggestions(domain, 'p-0001')).toHaveLength(0)
    expect(listHabitSuggestions(domain, 'p-0001', { includeProcessed: true })).toHaveLength(2)
  })
})

// ===== 6. finalizeHabit：draft/confirmed → final，幂等 =====

describe('finalizeHabit：人定稿，幂等，无自动定稿', () => {
  it('draft → final；重复 finalize 状态不变（幂等）', async () => {
    const { domain } = buildFakeDomain()
    const created = await addHabit(domain, 'p-0001', { title: '晨走' })
    const first = await finalizeHabit(domain, created.id)
    expect(first?.status).toBe('final')
    const second = await finalizeHabit(domain, created.id)
    expect(second?.status).toBe('final')
    expect(second?.updatedAt).toBe(first?.updatedAt) // 已是 final 直接返回，不刷新
  })

  it('未找到习惯 → HabitNotFoundError', async () => {
    const { domain } = buildFakeDomain()
    await expect(finalizeHabit(domain, 'habit-nope')).rejects.toThrow(HabitNotFoundError)
  })
})

// ===== 7. K11 cycle-hooks 占位：一律 enabled:false，不注册调度 =====

describe('cycle-hooks：K11 周期触发接线占位（未启用）', () => {
  it('daily-archive / quarterly-review 均返回 enabled:false', () => {
    for (const hook of ['daily-archive', 'quarterly-review'] as const) {
      const result = cycleHookPoint(hook, undefined, today)
      expect(result.enabled).toBe(false)
      expect(result.reason).toContain('H6')
    }
  })

  it('占位不产生副作用：domain/today 不被读取，无定时器', () => {
    const result = cycleHookPoint('daily-archive', undefined, today)
    expect(result).toEqual({ hook: 'daily-archive', enabled: false, reason: 'H6 宿主通知能力未实现前不启用' })
  })
})

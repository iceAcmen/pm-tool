  it('独立 GG02 三步同目标 clean undo 完整首态和 updatedAt，重复拒绝且无重写', async () => {
    const t = await addTask(domain, { projectId, title: '独立三步富历史', draft: {
      attachmentOps: [{ op: 'addLink', url: 'https://example.com/independent', clientId: 'c-independent' }],
      progressOps: [{ op: 'add', author: '独立专家', content: '第一版', refs: ['c-independent'] },
        { op: 'edit', id: 'pl-1', content: '第二版' }],
    } })
    const original = currentTask(t.id)!
    const handle = await confirm([
      { op: 'task.update', id: t.id, patch: { assignee: '三步甲' }, stepId: 's1', needs: [] },
      { op: 'task.update', id: t.id, patch: { progress: 71 }, stepId: 's2', needs: ['s1'] },
      { op: 'task.update', id: t.id, patch: { description: '第三步' }, stepId: 's3', needs: ['s2'] },
    ], { [t.id]: original.updatedAt })
    const result = await run(`ask-undo ${handle}`)
    expect(result.kind).toBe('success')
    expect(result.text).toMatch(/已撤销 3 项/)
    expect(currentTask(t.id)).toEqual(original)
    await assertDiskTask(t.id, original)
    const disk = await readFile(join(root, 'data/pmtool/tasks', t.id + '.json'), 'utf8')
    const ledger = await entry(handle)
    expect(ledger.undo.used).toBe(true)
    expect((await run(`ask-undo ${handle}`)).kind).toBe('error')
    expect(await readFile(join(root, 'data/pmtool/tasks', t.id + '.json'), 'utf8')).toBe(disk)
    expect((await entry(handle)).audit).toEqual(ledger.audit)
  })

  it('独立 GG02 仅 updatedAt 外改拦三步整链，独立 clean 可撤且 mixed 审计可重试', async () => {
    const a = await task('三步时间戳外改')
    const b = await task('独立合法撤销', 17)
    const originalB = currentTask(b.id)
    const handle = await confirm([
      { op: 'task.update', id: a.id, patch: { assignee: '甲' }, stepId: 's1', needs: [] },
      { op: 'task.update', id: a.id, patch: { progress: 60 }, stepId: 's2', needs: ['s1'] },
      { op: 'task.update', id: a.id, patch: { description: '链末态' }, stepId: 's3', needs: ['s2'] },
      { op: 'task.update', id: b.id, patch: { progress: 81 }, stepId: 's4', needs: [] },
    ])
    const post = currentTask(a.id)!
    await domain.table('tasks').put(a.id, { ...post,
      updatedAt: new Date(Date.parse(post.updatedAt) + 1000).toISOString() })
    const human = currentTask(a.id)
    const writes: string[] = []
    const put = unit.putRecord.bind(unit)
    unit.putRecord = async (name, key, value) => {
      if (name === 'tasks') writes.push(key)
      return put(name, key, value)
    }
    const first = await run(`ask-undo ${handle}`)
    expect(first.text).toMatch(/已撤销 1 项/)
    expect(currentTask(a.id)).toEqual(human)
    expect(currentTask(b.id)).toEqual(originalB)
    expect(writes).toEqual([b.id])
    const partial = await entry(handle)
    expect(partial.undo.used).toBe(false)
    writes.length = 0
    const second = await run(`ask-undo ${handle}`)
    expect(second.text).toMatch(/已撤销 0 项/)
    expect(second.text).not.toMatch(/不存在|过期|已使用/)
    expect(writes).toEqual([])
    expect(currentTask(a.id)).toEqual(human)
    const again = await entry(handle)
    expect(again.undo.used).toBe(false)
    expect(again.audit.slice(0, partial.audit.length)).toEqual(partial.audit)
    expect(again.audit.length).toBeGreaterThan(partial.audit.length)
  })

  it('独立 GG01 四 create 拒绝与依赖跳过不造 refs，只记录真实独立成功目标', async () => {
    const t = await task('独立成功标量')
    const handle = await confirm([
      { op: 'milestone.create', patch: { title: '坏日期', targetDate: '2026-02-30' }, stepId: 's1', needs: [] },
      { op: 'risk.create', patch: { type: 'risk', title: '错误影响', impact: 'invalid', probability: 'low' }, stepId: 's2', needs: [] },
      { op: 'deliverable.create', patch: { name: '非法字段', unknown: true }, stepId: 's3', needs: [] },
      { op: 'meeting.create', patch: { title: '依赖未执行', meetingDate: '2026-10-21' }, stepId: 's4', needs: ['s1'] },
      { op: 'task.update', id: t.id, patch: { progress: 26 }, stepId: 's5', needs: [] },
    ])
    for (const table of ['milestones', 'risk_issues', 'deliverables', 'meetings'] as const) {
      expect([...domain.table(table).keys()]).toEqual([])
    }
    expect((await entry(handle)).refs.map((r: { table: string, id: string }) => [r.table, r.id]))
      .toEqual([['tasks', t.id]])
  })

  it('独立 GG03 逆序末段写失败阻止同目标前段，另目标可撤并完整 retry', async () => {
    const a = await task('末段单次写失败')
    const b = await task('故障不影响独立目标', 19)
    const originalA = currentTask(a.id)
    const originalB = currentTask(b.id)
    const handle = await confirm([
      { op: 'task.update', id: a.id, patch: { assignee: '甲' }, stepId: 's1', needs: [] },
      { op: 'task.update', id: a.id, patch: { progress: 65 }, stepId: 's2', needs: ['s1'] },
      { op: 'task.update', id: b.id, patch: { progress: 87 }, stepId: 's3', needs: [] },
    ])
    const appliedA = currentTask(a.id)
    const put = unit.putRecord.bind(unit)
    const attempted: string[] = []
    let fail = true
    unit.putRecord = async (name, key, value) => {
      if (name === 'tasks') attempted.push(key)
      if (name === 'tasks' && key === a.id && fail) {
        fail = false
        throw new Error('QA 独立末段单次 JSON 写失败')
      }
      return put(name, key, value)
    }
    expect((await run(`ask-undo ${handle}`)).kind).toBe('error')
    expect(currentTask(a.id)).toEqual(appliedA)
    expect(currentTask(b.id)).toEqual(originalB)
    expect(attempted).toEqual([b.id, a.id])
    const partial = await entry(handle)
    expect(partial.undo.used).toBe(false)
    attempted.length = 0
    const retry = await run(`ask-undo ${handle}`)
    expect(retry.kind).toBe('success')
    expect(retry.text).toMatch(/已撤销 2 项/)
    expect(attempted).toEqual([a.id, a.id])
    expect(currentTask(a.id)).toEqual(originalA)
    expect(currentTask(b.id)).toEqual(originalB)
    await assertDiskTask(a.id, originalA)
    await assertDiskTask(b.id, originalB)
    const final = await entry(handle)
    expect(final.undo.used).toBe(true)
    expect(final.audit.slice(0, partial.audit.length)).toEqual(partial.audit)
  })

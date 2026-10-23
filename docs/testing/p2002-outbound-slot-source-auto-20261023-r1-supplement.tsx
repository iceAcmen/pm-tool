// Composed after the unchanged eight-case test in an owned /tmp input only.
describe('独立补测：真实来源与实际 DOM 差异', () => {
  const cLatest = '2026-10-19T04:05:06.000Z'
  beforeEach(async () => {
    // Extend legal fixtures before the read-only observation boundary.
    vi.restoreAllMocks()
    await domain.table('tasks').put('t-0006', taskWriteSchema.parse({
      ...domain.table('tasks').get('t-0003'),
      id: 't-0006', code: '1.1.1', parentId: 't-0003', order: 1,
      title: '独立孙层任务', status: 'blocked',
    }))
    await domain.table('tasks').put('t-0007', taskWriteSchema.parse({
      ...domain.table('tasks').get('t-0005'),
      id: 't-0007', projectId: 'p-0003', title: 'C不同导出时刻',
    }))
    await domain.table('settings').put('pmExportAudit', { value: [
      ...audit,
      { at: '2026-10-23T15:00:00+08:00', projectId: 'p-0001', format: 'plain',
        targetPath: '/fixture/offset-is-older.txt', itemCount: 5 },
      { at: cLatest, projectId: 'p-0003', format: 'markdown',
        targetPath: '/fixture/c-only.md', itemCount: 1 },
      { at: '2099-01-01T00:00:00.000Z', projectId: 'p-0002', format: 'web',
        targetPath: '/fixture/nonfinite.txt', itemCount: NaN },
      { at: 1792742950000, projectId: 'p-0002', format: 'plain',
        targetPath: '/fixture/numeric-time.txt', itemCount: 1 },
      { at: latest, projectId: 'p-0002', format: 'plain', targetPath: 123, itemCount: 1 },
    ], updatedAt: at })
    writes = []
    for (const name of Object.keys(pmDomainSpec.tables)) {
      const table = domain.table(name as any) as any
      for (const method of ['put', 'delete']) if (typeof table[method] === 'function') {
        vi.spyOn(table, method).mockImplementation((...args: any[]) => {
          writes.push({ table: name, method, args })
          throw new Error('独立只读阶段禁止业务写')
        })
      }
    }
    initial = rawTree(join(caseRoot, 'database'))
    frames.push({ label: 'supplement-legal-schema-fixture', auditRead: readExportAudit(domain), initial })
  })

  it('T01 ISO偏移按真实时间取最大，C真源不同，非法B记录拒绝且仅窄字段', async () => {
    const snap = JSON.parse(await execute('web snapshot'))
    expect(snap.latestExports).toEqual({
      'p-0001': { at: latest, format: 'web' }, 'p-0002': null,
      'p-0003': { at: cLatest, format: 'markdown' },
    })
    expect(Object.keys(snap.latestExports)).toEqual(snap.projects.map((p: any) => p.id))
    for (const value of Object.values(snap.latestExports)) if (value) {
      expect(Object.keys(value as object).sort()).toEqual(['at', 'format'])
    }
    expect(snap.tasks).toHaveLength(7)
    expect(snap.settings).not.toHaveProperty('pmExportAudit')
    expect(JSON.stringify(snap)).not.toContain('/fixture/')
    assertZeroWrite()
  })

  it('T02 真嵌套父/孙层与折叠展开slot，72px操作格仅编辑，编号清单源不变', async () => {
    await mount()
    const ids = ['t-0002', 't-0003', 't-0006', 't-0001', 't-0004']
    assertSlots(ids, true)
    expect(observe('independent-deep-tree').map(r => r.handle)).toEqual(['1', '1.1', '1.1.1', '2', '3'])
    for (const row of container.querySelectorAll<HTMLElement>('[data-pm-row]')) {
      expect(row.querySelectorAll('.pm-export-slot')).toHaveLength(1)
      expect(row.style.gridTemplateColumns.endsWith('72px')).toBe(true)
      const actions = row.querySelector('.pt-acts')!
      expect(actions.children).toHaveLength(1)
      expect(actions.firstElementChild?.tagName).toBe('BUTTON')
      expect(row.querySelector('.pm-export-slot')?.closest('.pt-acts')).toBeNull()
      expect(row.querySelector<HTMLElement>('.pm-export-slot')?.style.flexBasis).toBe('100%')
    }
    await click('[data-pm-row="t-0003"] .pm-task-toggle')
    assertSlots(['t-0002', 't-0003', 't-0001', 't-0004'], true)
    await click('[data-pm-row="t-0003"] .pm-task-toggle')
    assertSlots(ids, true)
    const snap = JSON.parse(await execute('web snapshot'))
    expect(snap.tasks.find((t: any) => t.id === 't-0006')).toMatchObject({
      code: '1.1.1', parentId: 't-0003', status: 'blocked',
      checklist: [{ id: 'check-1', text: '原清单', done: false }],
    })
    assertZeroWrite()
  })

  it('T03 真选中C不同时间再B持久重进，refresh不借A时刻，无写无业务按钮', async () => {
    await mount()
    await pick('项目C')
    expect(observe('C-selected').map(r => r.id)).toEqual(['t-0007'])
    expect(container.querySelector('time')?.getAttribute('datetime')).toBe(cLatest)
    expect(container.querySelector('.pm-export-slot')?.textContent).toContain('04:05')
    expect(container.querySelector('.pm-export-slot')?.textContent).not.toContain('08:09')
    expect(container.querySelector('.pm-export-slot button')).toBeNull()
    await click('button[aria-label="刷新数据"]')
    expect(container.querySelector('time')?.getAttribute('datetime')).toBe(cLatest)
    await pick('项目B')
    assertSlots(['t-0005'], false)
    expect(dom.window.localStorage.getItem('pm-selected-project')).toBe('p-0002')
    await unmount()
    await mount()
    assertSlots(['t-0005'], false)
    expect(container.querySelectorAll('.pm-export-slot')).toHaveLength(1)
    assertZeroWrite()
  })

  it('T04 状态分组实际深层叶与blocked/wrapped同在，分组头不伪充slot', async () => {
    seedView(true)
    await mount()
    const rows = observe('independent-status-groups')
    expect(rows.map(r => r.id).sort()).toEqual(['t-0001', 't-0002', 't-0003', 't-0004', 't-0006'])
    assertSlots(rows.map(r => r.id) as string[], true)
    expect(container.querySelectorAll('.pm-export-slot')).toHaveLength(5)
    expect(rows.find(r => r.id === 't-0006')?.text).toContain('受阻')
    expect(rows.find(r => r.id === 't-0004')?.text).toContain('已收尾')
    expect(container.querySelectorAll('.pt-grouprow .pm-export-slot')).toHaveLength(0)
    assertZeroWrite()
  })
})

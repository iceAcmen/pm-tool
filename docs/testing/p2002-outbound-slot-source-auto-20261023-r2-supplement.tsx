describe('独立补测：审计 MAX 与原时区口径', () => {
  it('T05 最高绝对at非末项，sent/archive不是来源，ISO完整且HHMM不随TZ转换', async () => {
    vi.restoreAllMocks()
    const winning = '2026-10-23T03:10:11-05:00'
    await domain.table('settings').put('pmExportAudit', { value: [
      { at: winning, projectId: 'p-0001', format: 'plain',
        targetPath: '/fixture/max-valid.txt', itemCount: Number.MAX_VALUE },
      ...audit,
      { at: '+275760-09-13T00:00:00.001Z', projectId: 'p-0001', format: 'web',
        targetPath: '/fixture/outside-date-range.html', itemCount: 5 },
      { at: '2099-01-01T00:00:00.000Z', projectId: 'p-0001', format: 'web',
        targetPath: '/fixture/infinite-count.html', itemCount: Infinity },
      { at: '2026-10-21T12:00:00.000Z', projectId: 'p-0001', format: 'markdown',
        targetPath: '/fixture/last-is-not-max.md', itemCount: 5 },
    ], updatedAt: at })
    for (const key of ['pmExportSent', 'pmExportSentArchive']) {
      await domain.table('settings').put(key, { value: [{
        at: '2099-01-01T00:00:00.000Z', projectId: 'p-0002',
        format: 'web', targetPath: '/fixture/sent-not-source.html',
      }, {
        at: '2099-01-01T00:00:00.000Z', projectId: 'p-0001',
        format: 'web', targetPath: '/fixture/sent-not-max.html',
      }], updatedAt: at })
    }
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
    frames.push({ label: 'supplement-max-fixture', tz: process.env.TZ,
      auditRead: readExportAudit(domain), initial })
    const snap = JSON.parse(await execute('web snapshot'))
    expect(snap.latestExports).toEqual({
      'p-0001': { at: winning, format: 'plain' }, 'p-0002': null, 'p-0003': null,
    })
    expect(JSON.stringify(snap)).not.toContain('/fixture/')
    await mount()
    const rows = observe('independent-max-timezone')
    expect(rows.map(row => row.id)).toEqual(['t-0002', 't-0003', 't-0001', 't-0004'])
    for (const row of container.querySelectorAll<HTMLElement>('[data-pm-row]')) {
      expect(row.querySelectorAll('.pm-export-slot')).toHaveLength(1)
      const time = row.querySelector('time')!
      expect(time.getAttribute('datetime')).toBe(winning)
      expect(time.getAttribute('title')).toBe(winning)
      expect(time.textContent).toBe('03:10')
      expect(row.querySelector('.pm-export-slot')?.textContent).toContain('外部为唯一事实源')
    }
    await pick('项目B')
    assertSlots(['t-0005'], false)
    assertZeroWrite()
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appendFileSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { handleProgressReportCommand } from '../commands/progress-report.js'
import { parseMarkdownBlocks } from '../client/shared/markdown.js'
import { ISOLATED_ROOT_ENV } from './export.js'
import { renderProgressReportMarkdown } from './progress-report-markdown.js'
import { normalizeProgressReportRecord, progressReportRecordSchema, type ProgressReport } from './progress-report.js'
import { getProgressReport } from './progress-reports.js'
import { addProject } from './projects.js'
import { pmDomainSpec, type PmDomain } from './storage.js'
import { progressAppend, progressEditRevision, progressSoftDelete } from './task-materials.js'
import { addTask, getTask } from './tasks.js'

// MRR-R05-EXPORT-EXCERPTS: oracle is the approved frozen fields, never the current MD.
const AT = '2026-10-22T08:00:00.000Z'
const FROZEN = [
  { taskId: 't-0001', entryId: 'pl-3', revisionId: 'rv-1',
    author: '测试乙', date: '2026-10-19', contentSnapshot: 'E3 rv1同日异ID' },
  { taskId: 't-0001', entryId: 'pl-1', revisionId: 'rv-3',
    author: '测试甲', date: '2026-10-21', contentSnapshot: 'E1 rv3正文' },
] as const
const SAFE_BODY = [
  'SAFE_EXCERPT_START',
  '| 栏目 | TABLE_VALUE |',
  '| --- | --- |',
  '| 内容 | 管道与反斜线 \\ |',
  '',
  '```json',
  '{"frozen":"CODE_VALUE"}',
  '```',
  '<script>SAFE_SCRIPT_TEXT</script>',
  '[SAFE_DANGER_LINK](javascript:alert(1))',
  '[SAFE_DATA_LINK](data:text/html,unsafe)',
  '[SAFE_FILE_LINK](file:///not-a-real-file)',
  'SAFE_EXCERPT_END',
].join('\n')

let root: string
let active: { ctx: Context; domain: PmDomain } | undefined

beforeEach(() => {
  const owned = process.env.REPORT_EXPORT_RED_TMP
  root = mkdtempSync(join(owned ?? tmpdir(), 'report-export-excerpts-'))
  vi.stubEnv(ISOLATED_ROOT_ENV, root)
})

afterEach(async () => {
  const current = active
  active = undefined
  try {
    await current?.domain.close()
  } finally {
    vi.unstubAllEnvs()
  }
})

function report(sourceType: 'manual' | 'session' = 'manual'): ProgressReport {
  return progressReportRecordSchema.parse({
    id: 'rpt-0002', projectId: 'p-0001', title: '固定汇报摘录回归',
    periodStart: '2026-10-01', periodEnd: '2026-10-31', status: 'draft',
    executiveSummary: '固定管理摘要', completedWork: [], nextPlans: [], blockers: [],
    snapshotAt: AT,
    snapshot: {
      project: { name: '摘录回归项目', owner: '', status: 'active', targetDate: '2026-12-31' },
      tasks: { total: 2, todo: 2, inProgress: 0, blocked: 0, done: 0, averageProgress: null },
      milestones: { total: 0, achieved: 0, atRisk: 0, missed: 0 },
      meetings: { inPeriod: 0, decisions: 0 }, periodMilestones: [], periodMeetings: [], exceptions: [],
    },
    excerpts: FROZEN.map((item, i) => ({
      ...item, id: `ex-${i + 1}`, sourceKind: 'progress', capturedAt: AT,
    })),
    sourceType, sourceSessionId: sourceType === 'session' ? 'session-export-red-01' : null,
    createdAt: AT, updatedAt: AT,
  })
}

function fieldsMissing(md: string, excerpts: NonNullable<ProgressReport['excerpts']>) {
  return excerpts.flatMap(item =>
    (['taskId', 'entryId', 'revisionId', 'author', 'date', 'contentSnapshot'] as const)
      .filter(field => !md.includes(item[field]))
      .map(field => `${item.taskId}/${item.entryId}/${item.revisionId}: ${field}=${item[field]}`))
}

function assertFrozen(md: string, excerpts = report().excerpts!) {
  expect(fieldsMissing(md, excerpts), '导出须含每条冻结 task/entry/rev、作者、日期、正文').toEqual([])
  for (const item of excerpts) {
    expect(md.split(item.contentSnapshot).length - 1, '每条冻结正文只导出一次').toBe(1)
  }
  for (const forbidden of ['源已改正文', '源已改作者', 'rv-4', '未选E2正文', 'OTHER_TASK_BODY']) {
    expect(md, '不重新读取当前源或带入未选进展').not.toContain(forbidden)
  }
}

function rawReportPath(id = 'rpt-0002') {
  return join(root, 'data', 'pmtool', 'reports', `${id}.json`)
}

function save(name: string, value: unknown) {
  writeFileSync(join(root, name), JSON.stringify(value, null, 2), { flag: 'wx' })
}

function storedBytes(dir = join(root, 'data')): Record<string, string> {
  return Object.fromEntries(readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = join(dir, entry.name)
    return entry.isDirectory()
      ? Object.entries(storedBytes(file))
      : [[file, readFileSync(file).toString('base64')]]
  }))
}

async function command(domain: PmDomain, input: string, expected = 'success') {
  const response = await handleProgressReportCommand(input, domain)
  appendFileSync(join(root, 'commands.jsonl'), JSON.stringify({ input, response }) + '\n')
  expect(response.kind, `${input}: ${response.text}`).toBe(expected)
  return response
}

async function fixture(sourceType: 'manual' | 'session' = 'manual', body = FROZEN[0].contentSnapshot as string) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(join(root, 'data')))
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  const domain = await facility.open(pmDomainSpec)
  active = { ctx, domain }
  const project = await addProject(domain, {
    name: '摘录回归项目', startDate: '2026-01-01', targetDate: '2026-12-31', status: 'active',
  })
  const task = await addTask(domain, { projectId: project.id, title: '源任务' })
  expect(task.id).toBe('t-0001')
  await progressAppend(domain, task.id, { author: '初版作者', date: '2026-10-18', content: 'E1 rv1正文' }, AT)
  await progressEditRevision(domain, task.id, 'pl-1', {
    author: '第二版作者', date: '2026-10-20', content: 'E1 rv2正文',
  }, AT)
  await progressEditRevision(domain, task.id, 'pl-1', {
    author: FROZEN[1].author, date: FROZEN[1].date, content: FROZEN[1].contentSnapshot,
  }, AT)
  await progressAppend(domain, task.id, { author: '未选作者', date: '2026-10-19', content: '未选E2正文' }, AT)
  await progressSoftDelete(domain, task.id, 'pl-2', AT)
  await progressAppend(domain, task.id, { author: FROZEN[0].author, date: FROZEN[0].date, content: body }, AT)
  const otherTask = await addTask(domain, { projectId: project.id, title: '同项目撞号任务' })
  await progressAppend(domain, otherTask.id, { author: '其他任务作者', date: '2026-10-19', content: 'OTHER_TASK_BODY' }, AT)
  await command(domain, `generate ${project.id} 2026-10-19 2026-10-22 {"title":"无摘录报告种子"}`)
  await command(domain, `generate ${project.id} 2026-10-19 2026-10-22 ${JSON.stringify({
    title: '固定汇报摘录回归', executiveSummary: '固定管理摘要', sourceType,
    ...(sourceType === 'session' ? { sourceSessionId: 'session-export-red-01' } : {}),
    selectedRefs: FROZEN.map(({ taskId, entryId, revisionId }) => ({ taskId, entryId, revisionId })),
  })}`)
  const fixed = getProgressReport(domain, 'rpt-0002')!
  expect(fixed.excerpts?.map(({ taskId, entryId, revisionId, author, date, contentSnapshot }) =>
    ({ taskId, entryId, revisionId, author, date, contentSnapshot })))
    .toEqual([{ ...FROZEN[0], contentSnapshot: body }, FROZEN[1]])
  const raw = readFileSync(rawReportPath())
  const initialRevisions = getTask(domain, task.id)!.progressLog!.map(e => ({
    id: e.id, revisions: structuredClone(e.revisions),
  }))
  save('frozen-before.json', { fixed, raw: raw.toString(), initialRevisions })
  return { domain, fixed, raw, task, initialRevisions }
}

async function changeSources(s: Awaited<ReturnType<typeof fixture>>) {
  for (const entryId of ['pl-1', 'pl-3']) {
    await progressEditRevision(s.domain, s.task.id, entryId, {
      author: '源已改作者', date: '2026-10-22', content: `源已改正文-${entryId}`,
    }, AT)
    await progressSoftDelete(s.domain, s.task.id, entryId, AT)
  }
  const changed = getTask(s.domain, s.task.id)!
  for (const old of s.initialRevisions) {
    const entry = changed.progressLog!.find(e => e.id === old.id)!
    expect(entry.revisions.slice(0, old.revisions.length)).toEqual(old.revisions)
    expect(entry.deletedAt).toBeTruthy()
  }
  expect(changed.progressLog!.find(e => e.id === 'pl-1')!.revisions.at(-1))
    .toMatchObject({ id: 'rv-4', author: '源已改作者', date: '2026-10-22', content: '源已改正文-pl-1' })
  expect(getProgressReport(s.domain, 'rpt-0002')).toEqual(s.fixed)
  expect(readFileSync(rawReportPath()).equals(s.raw)).toBe(true)
  save('source-after.json', { changed, fixed: getProgressReport(s.domain, 'rpt-0002') })
}

async function exportFile(domain: PmDomain, suffix = '', directory = 'excerpts') {
  const before = storedBytes()
  await command(domain, `export rpt-0002 ${directory}${suffix}`)
  const path = join(root, 'exports', directory, 'rpt-0002-progress.md')
  const md = readFileSync(path, 'utf8')
  save(`export-observation-${directory}${suffix ? '-confirm' : ''}.json`, {
    path, bytes: Buffer.byteLength(md),
    missing: fieldsMissing(md, getProgressReport(domain, 'rpt-0002')!.excerpts!),
  })
  expect(storedBytes(), '实际 export 不改任何领域 JSON，包括源任务与旧报告').toEqual(before)
  return { path, md }
}

function assertSafeBody(md: string) {
  const markers = ['SAFE_EXCERPT_START', 'TABLE_VALUE', '管道与反斜线', 'CODE_VALUE',
    'SAFE_SCRIPT_TEXT', 'SAFE_DANGER_LINK', 'SAFE_DATA_LINK', 'SAFE_FILE_LINK', 'SAFE_EXCERPT_END']
  expect.soft(markers.filter(text => !md.includes(text)), '安全降级不得把整条复杂摘录丢弃').toEqual([])
  // Consume the real production AST; no browser, eval or synthetic HTML oracle.
  const ast = parseMarkdownBlocks(md)
  const hrefs: string[] = []
  function walk(value: unknown): void {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) { value.forEach(walk); return }
    const node = value as Record<string, unknown>
    if (typeof node.href === 'string') hrefs.push(node.href)
    Object.values(node).forEach(walk)
  }
  walk(ast)
  expect(hrefs.filter(href => !/^https?:\/\//i.test(href))).toEqual([])
  expect(ast.every(block => ['heading', 'paragraph', 'ul', 'ol', 'task', 'quote', 'code', 'table', 'hr'].includes(block.type)))
    .toBe(true)
}

describe('EXPORT-EXCERPTS CONTROL：合法冻结、既有来源/兼容/文件保护', () => {
  it('C01 真实 JSON 固定两条 current，源两条改作者/日期/正文并软删后报告全字节不变', async () => {
    const s = await fixture()
    await changeSources(s)
    expect(s.fixed.excerpts).toHaveLength(2)
    expect(getProgressReport(s.domain, 'rpt-0001')!.excerpts).toBeUndefined()
  })

  it.each(['manual', 'session'] as const)('C02 %s 来源在 render 中保留且输入不变', sourceType => {
    const fixed = report(sourceType), before = JSON.stringify(fixed)
    const md = renderProgressReportMarkdown(fixed)
    expect(md).toContain(sourceType === 'manual' ? '来源：手工录入' : '来源：会话派生')
    if (sourceType === 'session') expect(md).toContain('session-export-red-01')
    else expect(md).not.toContain('session-export-red-01')
    expect(JSON.stringify(fixed)).toBe(before)
    expect(renderProgressReportMarkdown(fixed)).toBe(md)
  })

  it.each(['missing', 'empty'] as const)('C03 旧报告 excerpts=%s 可导出且不回填来源/快照/摘录', async shape => {
    const legacy: Record<string, unknown> = structuredClone(report())
    delete legacy.sourceType
    delete legacy.sourceSessionId
    if (shape === 'missing') delete legacy.excerpts
    else legacy.excerpts = []
    const before = JSON.stringify(legacy)
    const fixed = normalizeProgressReportRecord(legacy)
    const md = renderProgressReportMarkdown(fixed)
    expect(md).toContain('# 固定汇报摘录回归')
    expect(md).toContain('固定管理摘要')
    expect(md).toContain('来源：手工录入')
    expect(md).toContain('平均进度 证据不足')
    expect(md).not.toMatch(/undefined|null%|E1 rv3正文|E3 rv1同日异ID/)
    expect(JSON.stringify(legacy)).toBe(before)
    expect('calcVersion' in fixed.snapshot.tasks).toBe(false)
    const s = await fixture()
    if (shape === 'empty') {
      await s.domain.table('reports').put('rpt-0001', {
        ...getProgressReport(s.domain, 'rpt-0001')!, excerpts: [],
      })
    }
    const persistedBefore = storedBytes()
    await command(s.domain, 'export rpt-0001 legacy')
    const exported = readFileSync(join(root, 'exports', 'legacy', 'rpt-0001-progress.md'), 'utf8')
    expect(exported).toContain('# 无摘录报告种子')
    expect(exported).toContain('来源：手工录入')
    expect(exported).toContain('平均进度 证据不足')
    expect(exported).not.toMatch(/undefined|null%|E1 rv3正文|E3 rv1同日异ID/)
    expect(storedBytes()).toEqual(persistedBefore)
  })

  it('C04 真实 export 默认拒覆盖、confirm 覆盖同字节/权限，领域记录零改写', async () => {
    const s = await fixture('session')
    await changeSources(s)
    const first = await exportFile(s.domain)
    const denied = await command(s.domain, 'export rpt-0002 excerpts', 'error')
    expect(denied.text).toMatch(/已存在[\s\S]*confirm/)
    expect(readFileSync(first.path, 'utf8')).toBe(first.md)
    const repeated = await exportFile(s.domain, ' confirm')
    expect(repeated.md).toBe(first.md)
    expect(statSync(first.path).mode & 0o777).toBe(0o600)
    expect(readdirSync(resolve(first.path, '..'))).toEqual(['rpt-0002-progress.md'])
    expect(readFileSync(rawReportPath()).equals(s.raw)).toBe(true)
    expect(s.fixed.sourceType).toBe('session')
    expect(s.fixed.sourceSessionId).toBe('session-export-red-01')
  })

  it('C05 真实命令拒绝绝对/~ /越界目录，不创建 exports，不改报告 JSON', async () => {
    const s = await fixture()
    for (const directory of ['/not-an-allowed-export', '~/not-an-allowed-export', '../outside']) {
      await command(s.domain, `export rpt-0002 "${directory}"`, 'error')
    }
    expect(readdirSync(root)).not.toContain('exports')
    expect(readFileSync(rawReportPath()).equals(s.raw)).toBe(true)
  })
})

describe('EXPORT-EXCERPTS RED：生产 render / 真实 export 不得遗漏冻结正文和来源', () => {
  it.each([0, 1])('R01 render 第 %i 条冻结 task/entry/rev、作者/日期/正文必须完整', index => {
    const fixed = report()
    const other = fixed.excerpts![1 - index]
    fixed.excerpts = [fixed.excerpts![index]]
    const md = renderProgressReportMarkdown(fixed)
    save(`render-${index}.json`, { md, missing: fieldsMissing(md, fixed.excerpts) })
    assertFrozen(md, fixed.excerpts)
    for (const value of [other.entryId, other.revisionId, other.author, other.date, other.contentSnapshot]) {
      expect(md, '单条输入不得错配另一条来源/作者/日期/正文').not.toContain(value)
    }
  })

  it.each(['manual', 'session'] as const)('R02 %s 真实 export：源修改/软删后两条旧冻结摘录均完整', async sourceType => {
    const s = await fixture(sourceType)
    const before = await exportFile(s.domain, '', 'before-source-change')
    await changeSources(s)
    const { md } = await exportFile(s.domain)
    expect(md, '前后导出稳定只是控制；后面的冻结字段完整性才是内容 oracle').toBe(before.md)
    expect(readFileSync(rawReportPath()).equals(s.raw)).toBe(true)
    expect(md).toContain(sourceType === 'manual' ? '来源：手工录入' : '来源：会话派生')
    if (sourceType === 'session') expect(md).toContain('session-export-red-01')
    assertFrozen(md, s.fixed.excerpts!)
  })

  it.each(['render', 'command'] as const)('R03 %s 复杂冻结 Markdown 保正文且安全 AST 不生成危险协议链接', async mode => {
    let md: string
    if (mode === 'render') {
      const fixed = report()
      fixed.excerpts![0].contentSnapshot = SAFE_BODY
      const validated = progressReportRecordSchema.parse(fixed)
      md = renderProgressReportMarkdown(validated)
      save('safe-render.json', { md, fixed: validated })
    } else {
      const s = await fixture('session', SAFE_BODY)
      await changeSources(s)
      md = (await exportFile(s.domain)).md
      expect(readFileSync(rawReportPath()).equals(s.raw)).toBe(true)
    }
    assertSafeBody(md)
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ExportFileExistsError,
  exportProjectMarkdown,
  partitionSentEntries,
  readExportAudit,
  readExportSent,
  readExportSentArchive,
  recordExportOutbound,
  renderProjectPlain,
  renderProjectWebHtml,
  SENT_TTL_DAYS,
  writeExportFile,
  type ExportAuditEntry,
} from './export.js'
import type { PmDomain } from './storage.js'

// K18 单向出站（分片A）：三档渲染形状 + 审计只增流 + 已发日志 TTL 归档 + confirm 覆盖。
// 契约见 docs/design/deep-integration-v2-p2-dev.md §二。today/nowIso 全部注入，零墙钟。

/** 内存 fake 域：每表一个闭包 Map，get/put/entries/delete 齐备。 */
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
  const seed = (name: string, key: string, value: unknown) => {
    if (!tables.has(name)) tables.set(name, new Map())
    tables.get(name)!.set(key, value)
  }
  return { domain: { table } as unknown as PmDomain, seed }
}

const NOW = '2026-10-18T08:00:00.000Z'

function emptyBundle() {
  return {
    project: {
      id: 'p-0001', name: '演示项目', status: 'active', owner: '张三',
      startDate: '2026-10-01', targetDate: '2026-12-31', description: '', tags: [],
    },
    tasks: [],
    milestones: [],
    deliverables: [],
    reflections: [],
    deliverableById: new Map(),
    reflectionByTask: new Map(),
  }
}

describe('web 非技术增强档渲染形状', () => {
  it('含「只读快照 · 非实时数据」声明位、生成时间、浅深双态 token、空数据占位，无外链/脚本', () => {
    const html = renderProjectWebHtml(emptyBundle() as never, NOW)
    expect(html).toContain('只读快照 · 非实时数据')
    expect(html).toContain(NOW)
    expect(html).toContain('prefers-color-scheme')
    // 深色 token 块存在（--bg/--panel 深色色值）
    expect(html).toContain('#0f1115')
    // 空数据占位，不伪造
    expect(html).toContain('暂无数据')
    // 自包含：无脚本、无外部资源（src/link/img）、无可点链接（href）；纯文本 URL 允许
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/\bsrc=/i)
    expect(html).not.toMatch(/href=/i)
    expect(html).not.toMatch(/<link/i)
    expect(html).not.toMatch(/<img/i)
  })

  it('任务/里程碑/交付物/复盘分组渲染，状态中文标签', () => {
    const bundle = {
      ...emptyBundle(),
      tasks: [
        { id: 't-0001', code: '1', title: '需求梳理', status: 'in_progress', assignee: '张三', startDate: '2026-10-01', dueDate: '2026-10-20', progress: 60, evidenceUrl: 'https://example.com/evidence' },
        { id: 't-0002', code: '1.1', title: '已完成项', status: 'done', assignee: '李四', startDate: null, dueDate: null, progress: 100 },
      ],
      milestones: [{ id: 'm-0001', title: '正式发布', status: 'achieved', targetDate: '2026-12-31', achievedDate: '2026-12-30', description: '完成验收' }],
      deliverables: [{ id: 'dlv-1', name: '发布包', status: 'accepted', version: 'v1.0', owner: '王五', location: '服务器 /release' }],
      reflections: [{ id: 'ref-1', status: 'final', createdAt: '2026-10-18T00:00:00.000Z', draft: { title: '完成复盘', at: NOW, lines: [{ text: '已核', mark: 'known' }], gaps: [] } }],
    }
    const html = renderProjectWebHtml(bundle as never, NOW)
    expect(html).toContain('进行中')
    expect(html).toContain('已完成')
    expect(html).toContain('需求梳理')
    expect(html).toContain('正式发布')
    expect(html).toContain('发布包')
    expect(html).toContain('完成复盘')
    // 佐证链接以纯文本展示，不渲染为可点击链接
    expect(html).not.toMatch(/href=/i)
  })
})

describe('plain 纯文本兜底渲染形状', () => {
  it('无 markdown 符号，含生成时间戳与空数据占位', () => {
    const text = renderProjectPlain(emptyBundle() as never, NOW)
    expect(text).toContain(`生成时间：${NOW}`)
    expect(text).toContain('暂无数据')
    // 无 markdown 符号：井号标题 / 星号强调 / 竖线表格 / 反引号 / 行首短横列表
    expect(text).not.toMatch(/^#/m)
    expect(text).not.toContain('**')
    expect(text).not.toContain('|')
    expect(text).not.toContain('`')
    expect(text).not.toMatch(/^\s*-\s/m)
  })

  it('任务/里程碑/交付物/复盘以纯文本分组列出', () => {
    const bundle = {
      ...emptyBundle(),
      tasks: [{ id: 't-0001', code: '1', title: '需求梳理', status: 'in_progress', assignee: '张三', startDate: '2026-10-01', dueDate: '2026-10-20', progress: 60, evidenceUrl: 'https://example.com/evidence' }],
      milestones: [{ id: 'm-0001', title: '正式发布', status: 'achieved', targetDate: '2026-12-31', achievedDate: '2026-12-30', description: '完成验收' }],
    }
    const text = renderProjectPlain(bundle as never, NOW)
    expect(text).toContain('【任务 · 进行中】')
    expect(text).toContain('需求梳理')
    expect(text).toContain('【里程碑时间线】')
    expect(text).toContain('正式发布')
    expect(text).not.toMatch(/<[^>]+>/)
  })
})

describe('审计只增流 pmExportAudit（append-only，永不清理）', () => {
  it('每次导出追加一条，两次后两条都在且顺序保留，不删不改', async () => {
    const { domain } = buildFakeDomain()
    const entry1: ExportAuditEntry = { at: NOW, projectId: 'p-0001', format: 'markdown', targetPath: '/tmp/a-report.md', itemCount: 2 }
    const entry2: ExportAuditEntry = { at: '2026-10-18T09:00:00.000Z', projectId: 'p-0001', format: 'web', targetPath: '/tmp/a-snapshot.html', itemCount: 2 }
    await recordExportOutbound(domain, entry1, NOW)
    await recordExportOutbound(domain, entry2, NOW)
    const audit = readExportAudit(domain)
    expect(audit).toHaveLength(2)
    expect(audit[0]).toEqual(entry1)
    expect(audit[1]).toEqual(entry2)
    // 再次读取仍为两条（只增不删）
    expect(readExportAudit(domain)).toHaveLength(2)
  })
})

describe('已发日志 pmExportSent TTL=30 天，过期下次导出归档', () => {
  it('超过 30 天的活跃条目归档到 pmExportSentArchive，活跃日志移除；新条目保留', async () => {
    const { domain, seed } = buildFakeDomain()
    const oldAt = '2026-09-01T00:00:00.000Z' // 距 NOW 47 天，过期
    seed('settings', 'pmExportSent', {
      value: [{ at: oldAt, projectId: 'p-0001', format: 'markdown', targetPath: '/tmp/old.md' }],
      updatedAt: oldAt,
    })
    const fresh: ExportAuditEntry = { at: NOW, projectId: 'p-0001', format: 'web', targetPath: '/tmp/new.html', itemCount: 1 }
    const summary = await recordExportOutbound(domain, fresh, NOW)

    const active = readExportSent(domain)
    expect(active).toHaveLength(1)
    expect(active[0].targetPath).toBe('/tmp/new.html')

    const archive = readExportSentArchive(domain)
    expect(archive).toHaveLength(1)
    expect(archive[0].targetPath).toBe('/tmp/old.md')
    expect(archive[0].at).toBe(oldAt)

    expect(summary.activeSentCount).toBe(1)
    expect(summary.archivedCount).toBe(1)
  })

  it('30 天内条目留在活跃日志，不归档', async () => {
    const { domain, seed } = buildFakeDomain()
    const recentAt = '2026-10-10T00:00:00.000Z'
    seed('settings', 'pmExportSent', {
      value: [{ at: recentAt, projectId: 'p-0001', format: 'plain', targetPath: '/tmp/recent.txt' }],
      updatedAt: recentAt,
    })
    await recordExportOutbound(domain, { at: NOW, projectId: 'p-0001', format: 'web', targetPath: '/tmp/new.html', itemCount: 1 }, NOW)
    expect(readExportSent(domain).map(e => e.targetPath)).toEqual(['/tmp/recent.txt', '/tmp/new.html'])
    expect(readExportSentArchive(domain)).toHaveLength(0)
  })

  it('partitionSentEntries 纯函数：活跃/过期切分，边界恰为 30 天按过期计', () => {
    const at = (daysAgo: number) => new Date(Date.parse(NOW) - daysAgo * 86_400_000).toISOString()
    const entries = [
      { at: at(29), projectId: 'p-1', format: 'web' as const, targetPath: '/a' },
      { at: at(30), projectId: 'p-1', format: 'web' as const, targetPath: '/b' },
      { at: at(31), projectId: 'p-1', format: 'web' as const, targetPath: '/c' },
    ]
    const { active, expired } = partitionSentEntries(entries, NOW)
    expect(active.map(e => e.targetPath)).toEqual(['/a'])
    expect(expired.map(e => e.targetPath)).toEqual(['/b', '/c'])
    expect(SENT_TTL_DAYS).toBe(30)
  })
})

describe('confirm 覆盖保护（writeExportFile）', () => {
  let dir: string
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'p2a-export-')) })
  afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

  it('默认拒绝覆盖并抛 ExportFileExistsError；confirm 覆盖且内容替换', async () => {
    const target = join(dir, 'report.md')
    await writeExportFile(target, '第一版', false)
    await expect(writeExportFile(target, '第二版', false)).rejects.toBeInstanceOf(ExportFileExistsError)
    expect(readFileSync(target, 'utf8')).toBe('第一版')
    await writeExportFile(target, '第二版', true)
    expect(readFileSync(target, 'utf8')).toBe('第二版')
    expect(existsSync(target)).toBe(true)
  })
})

describe('markdown 技术档补 evidence/deliverable/reflection 引用行', () => {
  it('任务佐证/关联交付物/复盘引用进入附录，footer 唯一数据源声明保留', async () => {
    const { domain, seed } = buildFakeDomain()
    seed('projects', 'p-0001', {
      id: 'p-0001', name: '发布项目', status: 'active', owner: 'Ice',
      startDate: '2026-10-01', targetDate: '2026-12-31', description: '目标', tags: [],
      createdAt: NOW, updatedAt: NOW,
    })
    seed('tasks', 't-0001', {
      id: 't-0001', projectId: 'p-0001', parentId: null, code: '1', order: 1,
      title: '原型评审', description: '', assignee: 'Ice', status: 'done', priority: 'P1',
      startDate: '2026-10-01', dueDate: '2026-10-10', progress: 100, milestoneId: null,
      deliverableId: 'dlv-1', evidenceUrl: 'https://example.com/ev',
      createdAt: NOW, updatedAt: NOW,
    })
    seed('milestones', 'm-0001', {
      id: 'm-0001', projectId: 'p-0001', title: '正式发布', status: 'achieved',
      targetDate: '2026-12-31', achievedDate: '2026-12-30', description: '验收', createdAt: NOW, updatedAt: NOW,
    })
    seed('deliverables', 'dlv-1', {
      id: 'dlv-1', projectId: 'p-0001', name: '发布包', version: 'v1.0', owner: 'Ice',
      status: 'accepted', location: '/release', description: '', dueDate: null,
      history: [], createdAt: NOW, updatedAt: NOW,
    })
    seed('reflections', 'ref-1', {
      id: 'ref-1', projectId: 'p-0001', taskId: 't-0001', status: 'final',
      sourceEvent: 'task-done', createdAt: NOW, updatedAt: NOW,
      draft: { title: '原型评审 · 完成即时复盘（草稿）', at: NOW, lines: [{ text: '完成时刻', mark: 'known' }], gaps: [] },
    })

    const dir = mkdtempSync(join(tmpdir(), 'p2a-md-'))
    try {
      const outcome = await exportProjectMarkdown(domain, 'p-0001', dir, false)
      const content = readFileSync(outcome.path, 'utf8')
      expect(content).toContain('证据 · 交付物 · 复盘引用')
      expect(content).toContain('客观佐证：https://example.com/ev')
      expect(content).toContain('关联交付物：`dlv-1`「发布包」（已验收）')
      expect(content).toContain('复盘：`ref-1`（定稿）')
      expect(content).toMatch(/JSON 是唯一数据源/)
      // 出站日志已写：审计一条
      expect(readExportAudit(domain)).toHaveLength(1)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

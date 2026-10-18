/**
 * P2 分片A（K18 单向出站）真实链路验证：
 * 真实 Context + JsonStorageBackend 临时根 + 真实命令 handler + 真实文件落盘。
 * 不触碰 3172 / 正式 data/；不调模型。覆盖：
 *  1. 三档（markdown/web/plain）真实落盘；web 含「只读快照 · 非实时数据」声明与生成时间、浅深双态 token；
 *     plain 为纯文本（无 markdown 符号）含时间戳；
 *  2. 审计只增流 pmExportAudit 落盘，第二次导出追加不删，两条都在；
 *  3. 已发日志 pmExportSent TTL=30 天：过期条目下次导出归档到 pmExportSentArchive，活跃日志移除；
 *  4. 默认拒覆盖（ExportFileExistsError），confirm 覆盖成功；
 *  5. export audit / export sent 只读列出。
 */
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addMilestone } from '../lib/core/milestones.js'
import { addProject } from '../lib/core/projects.js'
import { addTask } from '../lib/core/tasks.js'
import { addDeliverable } from '../lib/core/deliverables.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-p2a-export-data-'))
const outputRoot = mkdtempSync(join(tmpdir(), 'pm-tool-p2a-export-out-'))
const outdir = join(outputRoot, 'exports with spaces')
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', {
  register(definition) {
    command = definition
    return () => {}
  },
})

const results = []
const check = (k, ok, detail = '') => {
  results.push({ k, ok: !!ok, detail: String(detail) })
  console.log(`[${ok ? 'OK' : 'XX'}] ${k} :: ${detail}`)
}

async function run(rawInput, expected = 'success') {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}

function settingsValue(domain, key) {
  const row = domain.table('settings').get(key)
  return row?.value
}

const DAY = 86_400_000

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)

  // ===== 种子 =====
  const project = await addProject(domain, {
    name: 'P2A 出站验证项目',
    description: '三档导出验证',
    owner: 'Ice',
    status: 'active',
    startDate: '2026-10-10',
    targetDate: '2026-12-31',
    tags: ['MVP'],
  })
  const pid = project.id
  const ms = await addMilestone(domain, {
    projectId: pid, title: '正式发布', targetDate: '2026-12-31', status: 'achieved',
    achievedDate: '2026-12-30', description: '完成验收',
  })
  const dlv = await addDeliverable(domain, {
    projectId: pid, name: '发布包', version: 'v1.0', status: 'accepted', location: '/release',
  })
  await addTask(domain, {
    projectId: pid, title: '需求梳理', assignee: '张三', status: 'in_progress',
    priority: 'P0', startDate: '2026-10-10', dueDate: '2026-11-30', progress: 60,
    milestoneId: ms.id, deliverableId: dlv.id, evidenceUrl: 'https://example.com/evidence',
  })

  // ===== 1. markdown 落盘 + 引用行 =====
  const mdPath = join(outdir, `${pid}-report.md`)
  const mdText = await run(`export markdown ${pid} "${outdir}"`)
  check('markdown 落盘', existsSync(mdPath), mdPath)
  const md = readFileSync(mdPath, 'utf8')
  check('markdown 含证据/交付物/复盘引用段', md.includes('证据 · 交付物 · 复盘引用') && md.includes('客观佐证') && md.includes('关联交付物'), 'appendix present')
  check('markdown 保留唯一数据源 footer', md.includes('JSON 是唯一数据源'))
  check('markdown 0600 / 目录 0700', (statSync(mdPath).mode & 0o777) === 0o600 && (statSync(outdir).mode & 0o777) === 0o700)

  // ===== 2. web 落盘：只读快照声明 + 生成时间 + 浅深 token，无外链/脚本 =====
  const webPath = join(outdir, `${pid}-snapshot.html`)
  await run(`export web ${pid} "${outdir}"`)
  check('web 落盘', existsSync(webPath), webPath)
  const web = readFileSync(webPath, 'utf8')
  check('web 含「只读快照 · 非实时数据」声明', web.includes('只读快照 · 非实时数据'))
  check('web 含生成时间(ISO)', /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(web))
  check('web 浅深双态 token(prefers-color-scheme + 深色值)', web.includes('prefers-color-scheme') && web.includes('#0f1115'))
  // 纯文本 URL（佐证链接）允许出现；禁的是外部资源/脚本/可点链接：无 script/src/href/link/img。
  check('web 无脚本/无外部资源/无可点链接', !/<script/i.test(web) && !/\bsrc=/i.test(web) && !/href=/i.test(web) && !/<link/i.test(web) && !/<img/i.test(web))
  check('web 含外部唯一事实源声明', web.includes('唯一事实源'))

  // ===== 3. plain 落盘：纯文本无 markdown 符号 + 时间戳 =====
  const plainPath = join(outdir, `${pid}-report.txt`)
  await run(`export plain ${pid} "${outdir}"`)
  check('plain 落盘', existsSync(plainPath), plainPath)
  const plain = readFileSync(plainPath, 'utf8')
  check('plain 含生成时间戳', plain.includes('生成时间：'))
  const noMd = !/^#/m.test(plain) && !plain.includes('**') && !plain.includes('|') && !plain.includes('`') && !/^\s*-\s/m.test(plain)
  check('plain 无 markdown 符号（井号/星号/竖线/反引号/短横列表）', noMd)

  // ===== 4. 审计只增流：第二次 markdown 导出追加不删 =====
  const auditBefore = settingsValue(domain, 'pmExportAudit') ?? []
  await run(`project update ${pid} {"owner":"覆盖后负责人"}`)
  await run(`export markdown ${pid} "${outdir}" confirm`)
  const auditAfter = settingsValue(domain, 'pmExportAudit') ?? []
  check('审计流追加（长度 +1）', auditAfter.length === auditBefore.length + 1, `${auditBefore.length} → ${auditAfter.length}`)
  check('审计流只增：两条 markdown 记录都在', auditAfter.filter(e => e.format === 'markdown' && e.projectId === pid).length === 2)
  check('审计流旧记录保留（不删不改）', auditAfter.some(e => e.targetPath === mdPath && e.itemCount === 1))
  const overwritten = readFileSync(mdPath, 'utf8')
  check('confirm 覆盖成功（内容替换为新负责人）', overwritten.includes('覆盖后负责人') && overwritten !== md)

  // ===== 5. 默认拒覆盖 =====
  const reject = await run(`export web ${pid} "${outdir}"`, 'error')
  check('默认拒覆盖（已存在报错）', /已存在/.test(reject), reject.split('\n')[0])

  // ===== 6. 已发日志 TTL：旧条目过期归档，活跃移除 =====
  const oldAt = new Date(Date.now() - 40 * DAY).toISOString()
  await domain.table('settings').put('pmExportSent', {
    value: [{ at: oldAt, projectId: pid, format: 'markdown', targetPath: '/tmp/old.md' }],
    updatedAt: oldAt,
  })
  await run(`export web ${pid} "${outdir}" confirm`)
  const sentActive = settingsValue(domain, 'pmExportSent') ?? []
  const sentArchive = settingsValue(domain, 'pmExportSentArchive') ?? []
  check('过期条目归档到 pmExportSentArchive', sentArchive.some(e => e.at === oldAt && e.targetPath === '/tmp/old.md'), `archive=${sentArchive.length}`)
  check('活跃日志移除过期条目', !sentActive.some(e => e.at === oldAt), `active=${sentActive.length}`)
  check('新导出条目在活跃日志', sentActive.some(e => e.format === 'web' && e.targetPath === webPath))

  // ===== 7. 只读列出 =====
  const auditList = await run('export audit')
  check('export audit 只读列出（含累计条数）', /审计只增流/.test(auditList) && auditList.includes(pid))
  const sentList = await run('export sent')
  check('export sent 只读列出活跃日志', /活跃已发日志/.test(sentList) && sentList.includes(pid))
  const auditFiltered = await run(`export audit ${pid}`)
  check('export audit <项目ID> 过滤', auditFiltered.includes(pid) && !auditFiltered.includes('p-other'))

  // ===== 只读台账未被改写 =====
  check('台账任务数未因导出改变', domain.table('tasks').size === 1)
  check('台账项目数未因导出改变', domain.table('projects').size === 1)

  const failed = results.filter(r => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} 项通过`)
  if (failed.length) {
    console.error('失败项：', failed.map(f => f.k).join('；'))
    process.exitCode = 1
  }
  console.log(`临时根：${root}\n输出目录：${outdir}`)
} finally {
  await facility.closeAll()
}

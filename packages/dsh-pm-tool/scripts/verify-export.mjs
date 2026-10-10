/**
 * R4 Markdown 导出确定性验证。业务库和导出目录均使用系统临时目录。
 */
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addMilestone } from '../lib/core/milestones.js'
import { addProject } from '../lib/core/projects.js'
import { addTask } from '../lib/core/tasks.js'
import { defaultExportDirectory } from '../lib/core/export.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-export-data-'))
const outputRoot = mkdtempSync(join(tmpdir(), 'pm-tool export output-'))
const outputDirectory = join(outputRoot, 'reports with spaces')
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

async function run(rawInput, expected = 'success') {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)
  assert.match(defaultExportDirectory, /\/pm-tool\/exports\/?$/)

  const project = await addProject(domain, {
    name: 'Alpha | 发布报告',
    description: '第一行\n第二行 | 需转义',
    owner: 'Ice | PM',
    status: 'active',
    startDate: '2026-10-10',
    targetDate: '2026-12-31',
    tags: ['MVP', '客户 | A'],
  })
  const late = await addMilestone(domain, {
    projectId: project.id,
    title: '正式 | 发布',
    targetDate: '2026-12-31',
    status: 'planned',
    description: '完成验收',
  })
  const early = await addMilestone(domain, {
    projectId: project.id,
    title: '需求冻结',
    targetDate: '2026-11-30',
    status: 'achieved',
    achievedDate: '2026-11-29',
  })
  const rootTask = await addTask(domain, {
    projectId: project.id,
    title: '阶段 | 一',
    assignee: '张三',
    status: 'in_progress',
    priority: 'P0',
    startDate: '2026-10-10',
    dueDate: '2026-11-30',
    progress: 50,
    milestoneId: early.id,
  })
  await addTask(domain, {
    projectId: project.id,
    parentId: rootTask.id,
    title: '子任务',
    description: '说明\n第二行',
  })

  const commandText = `export markdown ${project.id} "${outputDirectory}"`
  const result = await run(commandText)
  const reportPath = join(outputDirectory, `${project.id}-report.md`)
  assert.match(result, new RegExp(reportPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.equal(existsSync(reportPath), true)
  assert.equal(statSync(outputDirectory).mode & 0o777, 0o700)
  assert.equal(statSync(reportPath).mode & 0o777, 0o600)

  const content = readFileSync(reportPath, 'utf8')
  assert.match(content, /^# Alpha \\\| 发布报告/m)
  assert.match(content, /第一行<br>第二行 \\\| 需转义/)
  assert.match(content, /Ice \\\| PM/)
  assert.match(content, /- \*\*1 阶段 \\\| 一\*\*/)
  assert.match(content, /  - \*\*1\.1 子任务\*\*/)
  assert.match(content, /里程碑：`m-0002`/)
  assert.ok(
    content.indexOf(`2026-11-30 | \`${early.id}\``)
    < content.indexOf(`2026-12-31 | \`${late.id}\``),
  )
  assert.match(content, /JSON 是唯一数据源/)

  const original = content
  assert.match(await run(commandText, 'error'), /已存在/)
  assert.equal(readFileSync(reportPath, 'utf8'), original)

  await run(`project update ${project.id} {"owner":"覆盖后负责人"}`)
  assert.match(await run(`${commandText} confirm`), /已生成或覆盖/)
  const overwritten = readFileSync(reportPath, 'utf8')
  assert.match(overwritten, /覆盖后负责人/)
  assert.notEqual(overwritten, original)
  assert.equal(readdirSync(outputDirectory).some(name => name.endsWith('.tmp')), false)

  const emptyProject = await addProject(domain, {
    name: '空项目',
    startDate: '2026-10-10',
    targetDate: '2026-10-31',
  })
  await run(`export markdown ${emptyProject.id} "${outputDirectory}"`)
  const emptyReport = readFileSync(join(outputDirectory, `${emptyProject.id}-report.md`), 'utf8')
  assert.match(emptyReport, /## WBS 任务[\s\S]*暂无任务。/)
  assert.match(emptyReport, /## 里程碑时间线[\s\S]*暂无里程碑。/)

  const jsonCommand = `export json "${outputDirectory}"`
  assert.match(await run(jsonCommand), /JSON 数据包已生成/)
  const backupPath = join(outputDirectory, 'pmtool-backup.json')
  const backupText = readFileSync(backupPath, 'utf8')
  const backup = JSON.parse(backupText)
  assert.equal(backup.format, 'pm-tool-backup')
  assert.equal(backup.formatVersion, 1)
  assert.match(backup.exportedAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.deepEqual(backup.projects.map(item => item.id), ['p-0001', 'p-0002'])
  assert.deepEqual(backup.tasks.map(item => item.id), ['t-0001', 't-0002'])
  assert.deepEqual(backup.milestones.map(item => item.id), ['m-0001', 'm-0002'])
  assert.equal('checks' in backup, false)
  assert.match(backupText, /\n  "projects": \[/)
  assert.match(await run(jsonCommand, 'error'), /已存在/)
  await run(`project update ${project.id} {"owner":"JSON 覆盖后"}`)
  assert.match(await run(`${jsonCommand} confirm`), /JSON 数据包已生成或覆盖/)
  assert.equal(JSON.parse(readFileSync(backupPath, 'utf8')).projects[0].owner, 'JSON 覆盖后')
  assert.equal(statSync(backupPath).mode & 0o777, 0o600)

  assert.match(await run('export'), /导出命令/)
  for (const input of [
    'export zip', 'export markdown', 'export markdown p-9999',
  ]) await run(input, 'error')

  const notDirectory = join(outputRoot, 'not-a-directory')
  writeFileSync(notDirectory, 'x')
  await run(`export markdown ${project.id} "${notDirectory}" confirm`, 'error')

  assert.equal(domain.table('projects').size, 2)
  assert.equal(domain.table('tasks').size, 2)
  assert.equal(domain.table('milestones').size, 2)
  console.log('通过：Markdown 与整库 JSON 内容/排序、默认路径、0700/0600、覆盖保护、confirm 覆盖与失败清理。')
  console.log(`全部导出校验通过。临时导出目录：${outputRoot}`)
} finally {
  await facility.closeAll()
}

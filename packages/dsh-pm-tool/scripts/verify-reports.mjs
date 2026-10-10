/** R9 固定快照进度汇报确定性验证。 */
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject, deleteProject } from '../lib/core/projects.js'
import { addTask, updateTask } from '../lib/core/tasks.js'
import { addMilestone } from '../lib/core/milestones.js'
import { addRiskIssue } from '../lib/core/risk-issues.js'
import { addMeeting, addMeetingAction } from '../lib/core/meetings.js'
import { getProgressReport, listProgressReports } from '../lib/core/progress-reports.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-reports-'))
const output = reopening ? process.argv[4] : mkdtempSync(join(tmpdir(), 'pm-tool-report-output-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(definition) { command = definition; return () => {} } })

async function run(rawInput, expected = 'success') {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)
  if (reopening) {
    assert.equal(listProgressReports(domain, 'p-0001').length, 5)
    assert.equal(getProgressReport(domain, 'rpt-0001').snapshot.tasks.blocked, 1)
    assert.equal(getProgressReport(domain, 'rpt-0001').status, 'final')
    assert.match(await run('report list p-0001 final'), /rpt-0001/)
    assert.match(await run('report generate p-0001 2026-12-01 2026-12-31'), /汇报 ID：rpt-0007/)
    console.log('通过：全新进程读回固定快照，筛选及编号续增正确。')
  } else {
    const project = await addProject(domain, {
      name: '进度汇报验证项目', owner: 'Ice', status: 'active',
      startDate: '2026-01-01', targetDate: '2026-12-31',
    })
    const other = await addProject(domain, {
      name: '空项目', startDate: '2026-01-01', targetDate: '2026-12-31',
    })
    const blocked = await addTask(domain, {
      projectId: project.id, title: '受阻任务', assignee: '张三',
      status: 'blocked', progress: 40, dueDate: '2026-01-31',
    })
    await addTask(domain, { projectId: project.id, title: '完成任务', status: 'done', progress: 100 })
    await addMilestone(domain, {
      projectId: project.id, title: '风险里程碑', targetDate: '2026-10-20', status: 'at_risk',
    })
    await addRiskIssue(domain, {
      projectId: project.id, type: 'issue', title: '严重问题', impact: 'critical', solution: '处理中',
    })
    const meeting = await addMeeting(domain, {
      projectId: project.id, title: '十月周会', meetingDate: '2026-10-10', decisions: ['冻结范围'],
    })
    await addMeetingAction(domain, meeting.id, {
      title: '逾期行动项', owner: '李四', dueDate: '2026-01-31',
    })

    assert.match(await run(`report generate ${project.id} 2026-10-01 2026-10-31 ${JSON.stringify({
      title: '十月进度汇报',
      projectId: other.id,
      periodStart: '2020-01-01',
      periodEnd: '2020-01-02',
      executiveSummary: '整体可控',
      completedWork: ['完成方案评审'],
      nextPlans: ['完成验收'],
      blockers: ['等待外部接口'],
    })}`), /汇报 ID：rpt-0001/)
    const first = getProgressReport(domain, 'rpt-0001')
    assert.equal(first.projectId, project.id)
    assert.equal(first.periodStart, '2026-10-01')
    assert.equal(first.snapshot.tasks.total, 2)
    assert.equal(first.snapshot.tasks.blocked, 1)
    assert.equal(first.snapshot.milestones.atRisk, 1)
    assert.equal(first.snapshot.meetings.inPeriod, 1)
    assert.equal(first.snapshot.meetings.decisions, 1)
    assert.deepEqual(first.snapshot.exceptions.map(item => item.kind).sort(), [
      'blocked_task', 'milestone', 'overdue_action', 'overdue_task', 'risk_issue',
    ])

    await updateTask(domain, blocked.id, { status: 'done', progress: 100 })
    assert.equal(getProgressReport(domain, 'rpt-0001').snapshot.tasks.blocked, 1)
    assert.match(await run(`report generate ${project.id} 2026-11-01 2026-11-30`), /汇报 ID：rpt-0002/)
    assert.equal(getProgressReport(domain, 'rpt-0002').snapshot.tasks.blocked, 0)

    assert.match(await run('report update rpt-0001 {"status":"final","executiveSummary":"最终摘要"}'), /固定快照未改变/)
    assert.equal(getProgressReport(domain, 'rpt-0001').executiveSummary, '最终摘要')
    assert.equal(getProgressReport(domain, 'rpt-0001').snapshot.tasks.blocked, 1)
    for (const input of [
      'report generate p-9999 2026-10-01 2026-10-31',
      `report generate ${project.id} 2026-10-31 2026-10-01`,
      `report generate ${project.id} 2026-02-30 2026-10-01`,
      'report update rpt-0001 {"snapshotAt":"2020-01-01T00:00:00.000Z"}',
      'report update rpt-0001 {"periodStart":"2026-01-01"}',
      'report update rpt-0001 {}',
      'report get rpt-9999',
      'report list p-9999',
    ]) await run(input, 'error')

    assert.match(await run(`report export rpt-0001 "${output}"`), /Markdown 已生成/)
    const markdownPath = join(output, 'rpt-0001-progress.md')
    const markdown = readFileSync(markdownPath, 'utf8')
    assert.match(markdown, /## 管理摘要[\s\S]*最终摘要/)
    assert.match(markdown, /## 异常项/)
    assert.match(markdown, /受阻任务/)
    assert.doesNotMatch(markdown, /完成任务/, '默认 Markdown 不应输出完整任务明细')
    assert.equal(statSync(markdownPath).mode & 0o777, 0o600)
    await run(`report export rpt-0001 "${output}"`, 'error')
    await run(`report export rpt-0001 "${output}" confirm`)

    const table = domain.table('reports')
    const originalPut = table.put
    table.put = async () => { throw new Error('验证用汇报写入失败') }
    try {
      await run(`report generate ${project.id} 2026-09-01 2026-09-30`, 'error')
    } finally {
      table.put = originalPut
    }
    await Promise.all(Array.from({ length: 4 }, (_, index) =>
      run(`report generate ${project.id} 2026-0${index + 1}-01 2026-0${index + 1}-28`)))
    assert.deepEqual([...table.keys()].sort(), [
      'rpt-0001', 'rpt-0002', 'rpt-0003', 'rpt-0004', 'rpt-0005', 'rpt-0006',
    ])
    assert.match(await run('report delete rpt-0002'), /当前未执行删除/)
    assert.match(await run('report delete rpt-0002 confirm'), /已删除/)
    assert.equal(existsSync(join(root, 'pmtool', 'reports', 'rpt-0002.json')), false)
    await assert.rejects(() => deleteProject(domain, project.id), /仍有/)
    assert.equal((await deleteProject(domain, other.id)).id, other.id)
    const file = join(root, 'pmtool', 'reports', 'rpt-0001.json')
    assert.equal(statSync(join(root, 'pmtool', 'reports')).mode & 0o777, 0o700)
    assert.equal(statSync(file).mode & 0o777, 0o600)

    console.log('通过：固定快照、异常汇总、人工字段更新、Markdown、并发、失败恢复、删除保护与权限。')
    await facility.closeAll()
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root, output], {
      encoding: 'utf8', env: process.env, timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
    console.log(`全部进度汇报校验通过。临时数据：${root}`)
  }
} finally {
  await facility.closeAll()
}

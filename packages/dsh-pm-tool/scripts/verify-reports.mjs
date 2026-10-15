/** R9 固定快照进度汇报确定性验证。 */
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
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
import { addTaskChecklistItem, setTaskChecklistItemDone } from '../lib/core/task-checklist.js'
import { addMilestone } from '../lib/core/milestones.js'
import { addRiskIssue } from '../lib/core/risk-issues.js'
import { addMeeting, addMeetingAction } from '../lib/core/meetings.js'
import { getProgressReport, listProgressReports } from '../lib/core/progress-reports.js'
import { progressSnapshotSchema, snapshotCalcVersion } from '../lib/core/progress-report.js'
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
    assert.equal(listProgressReports(domain, 'p-0001').length, 6) // 原 5 份 + 旧格式 rpt-0009
    assert.equal(getProgressReport(domain, 'rpt-0001').snapshot.tasks.blocked, 1)
    assert.equal(getProgressReport(domain, 'rpt-0001').status, 'final')
    assert.match(await run('report list p-0001 final'), /rpt-0001/)
    // 续号基于全表 max：旧格式 rpt-0009 存在 → 下一号 rpt-0010。
    assert.match(await run('report generate p-0001 2026-12-01 2026-12-31'), /汇报 ID：rpt-0010/)
    // OP-SRC-04：旧格式汇报 update 后不回填 calcVersion 键、averageProgress 原值不变。
    const legacy = getProgressReport(domain, 'rpt-0009')
    assert.equal(legacy.snapshot.tasks.calcVersion, undefined)
    assert.equal(legacy.snapshot.tasks.averageProgress, 40)
    await run('report update rpt-0009 {"executiveSummary":"改摘要"}')
    const after = getProgressReport(domain, 'rpt-0009')
    assert.equal('calcVersion' in after.snapshot.tasks, false, '历史快照不得回填 calcVersion 键')
    assert.equal(after.snapshot.tasks.averageProgress, 40, 'averageProgress 原值不变')
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
    // v0.8：主项目无清单覆盖叶子 → 平均进度诚实显示「证据不足」，绝不渲染 null%/伪 0
    assert.match(markdown, /平均进度 证据不足/, '无清单覆盖时 Markdown 应显示证据不足')
    assert.doesNotMatch(markdown, /null%/, '不得渲染 null%')
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

    // ---- v0.8 客观进度快照（OP-SRC-02/04） ----
    // 新快照口径：主项目无清单覆盖叶子 → averageProgress=null（证据不足，不是 0）；calcVersion=1。
    assert.equal(first.snapshot.tasks.calcVersion, 1)
    assert.equal(first.snapshot.tasks.averageProgress, null)
    // 旧记录兼容：缺 calcVersion 键的历史快照 parse 后仍缺键（缺键进、缺键出，不回填注入）；
    // 消费侧经 snapshotCalcVersion 归一为 0；averageProgress 原值保留、不重算。
    const legacySnapshot = progressSnapshotSchema.parse({
      project: { name: '旧项目', owner: '', status: 'planning', targetDate: '2026-12-31' },
      tasks: { total: 3, todo: 1, inProgress: 1, blocked: 0, done: 1, averageProgress: 50 },
      milestones: { total: 0, achieved: 0, atRisk: 0, missed: 0 },
      meetings: { inPeriod: 0, decisions: 0 },
      periodMilestones: [], periodMeetings: [], exceptions: [],
    })
    assert.equal(legacySnapshot.tasks.calcVersion, undefined, '旧快照缺 calcVersion 键应保持缺键')
    assert.equal(snapshotCalcVersion(legacySnapshot), 0, '消费侧归一缺省按 0')
    assert.equal(legacySnapshot.tasks.averageProgress, 50, '旧快照原值保留，不回填重算')
    // 项目平均走真源：有清单叶子等权（1/2=50）；legacy 手填 80 与无清单叶子均不入分母。
    const proj2 = await addProject(domain, { name: '客观进度验证项目', startDate: '2026-01-01', targetDate: '2026-12-31' })
    const leaf = await addTask(domain, { projectId: proj2.id, title: '清单叶子', progress: 80 })
    const afterAdd1 = await addTaskChecklistItem(domain, leaf.id, '第一步')
    await addTaskChecklistItem(domain, leaf.id, '第二步')
    await setTaskChecklistItemDone(domain, leaf.id, afterAdd1.checklist[0].id, true)
    await addTask(domain, { projectId: proj2.id, title: '无清单叶子' })
    await run(`report generate ${proj2.id} 2026-10-01 2026-10-31`)
    const src = getProgressReport(domain, 'rpt-0007')
    assert.equal(src.snapshot.tasks.calcVersion, 1)
    assert.equal(src.snapshot.tasks.averageProgress, 50)
    const srcText = await run(`report get rpt-0007`)
    assert.match(srcText, /平均进度 50%/, '命令输出应显示真源平均进度')

    await assert.rejects(() => deleteProject(domain, project.id), /仍有/)
    assert.equal((await deleteProject(domain, other.id)).id, other.id)
    const file = join(root, 'pmtool', 'reports', 'rpt-0001.json')
    assert.equal(statSync(join(root, 'pmtool', 'reports')).mode & 0o777, 0o700)
    assert.equal(statSync(file).mode & 0o777, 0o600)

    console.log('通过：固定快照、异常汇总、人工字段更新、Markdown、并发、失败恢复、删除保护与权限。')
    await facility.closeAll()
    // OP-SRC-04：投放磁盘旧格式汇报（snapshot.tasks 无 calcVersion 键），供 reopen 验证 update 不回填。
    writeFileSync(join(root, 'pmtool', 'reports', 'rpt-0009.json'), JSON.stringify({
      version: 2,
      record: {
        id: 'rpt-0009', projectId: project.id, periodStart: '2026-09-01', periodEnd: '2026-09-30',
        title: '旧格式汇报', status: 'final', executiveSummary: '旧摘要',
        completedWork: [], nextPlans: [], blockers: [],
        snapshotAt: '2026-09-30T00:00:00.000Z',
        snapshot: {
          project: { name: project.name, owner: project.owner, status: project.status, targetDate: project.targetDate },
          tasks: { total: 2, todo: 1, inProgress: 0, blocked: 0, done: 1, averageProgress: 40 },
          milestones: { total: 0, achieved: 0, atRisk: 0, missed: 0 },
          meetings: { inPeriod: 0, decisions: 0 },
          periodMilestones: [], periodMeetings: [], exceptions: [],
        },
        sourceType: 'manual', sourceSessionId: null,
        createdAt: '2026-09-30T00:00:00.000Z', updatedAt: '2026-09-30T00:00:00.000Z',
      },
    }, null, 2))
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

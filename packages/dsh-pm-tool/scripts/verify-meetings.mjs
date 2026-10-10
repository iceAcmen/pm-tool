/** R8 会议纪要确定性验证，使用独立临时目录。 */
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
import { addTask, deleteTask } from '../lib/core/tasks.js'
import { addRiskIssue, deleteRiskIssue } from '../lib/core/risk-issues.js'
import { getMeeting, listMeetings } from '../lib/core/meetings.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-meetings-'))
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
const json = value => JSON.stringify(value)

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)

  if (reopening) {
    assert.equal(listMeetings(domain, 'p-0001').length, 5)
    const meeting = getMeeting(domain, 'mtg-0001')
    assert.equal(meeting.status, 'final')
    assert.deepEqual(meeting.actions.map(item => item.id), ['ai-002'])
    assert.equal(meeting.actions[0].status, 'done')
    assert.match(await run(`meeting add ${json({
      projectId: 'p-0001', title: '重启后会议', meetingDate: '2026-12-31',
    })}`), /会议 ID：mtg-0007/)
    console.log('通过：全新进程读回会议与行动项，编号继续递增。')
  } else {
    const project = await addProject(domain, {
      name: '会议验证项目', startDate: '2026-10-01', targetDate: '2026-12-31',
    })
    const other = await addProject(domain, {
      name: '其他项目', startDate: '2026-10-01', targetDate: '2026-12-31',
    })
    const task = await addTask(domain, { projectId: project.id, title: '完成验收' })
    const otherTask = await addTask(domain, { projectId: other.id, title: '其他任务' })
    const issue = await addRiskIssue(domain, {
      projectId: project.id, type: 'issue', title: '环境问题', impact: 'high', solution: '修复',
    })
    const risk = await addRiskIssue(domain, {
      projectId: project.id, type: 'risk', title: '延期风险', impact: 'medium', probability: 'low',
    })

    assert.match(await run(`meeting add ${json({
      projectId: project.id,
      title: '项目周会',
      meetingDate: '2026-10-10',
      startTime: '09:30',
      durationMinutes: 60,
      facilitator: 'Ice',
      recorder: '记录人',
      participants: [' Ice ', '测试', 'Ice'],
      topics: ['进度', '风险'],
      decisions: ['按期发布'],
    })}`), /会议 ID：mtg-0001/)
    const first = getMeeting(domain, 'mtg-0001')
    assert.deepEqual(first.participants, ['Ice', '测试'])
    assert.equal(first.sourceType, 'manual')
    assert.equal(first.sourceSessionId, null)
    assert.deepEqual(first.actions, [])

    assert.match(await run(`meeting action add mtg-0001 ${json({
      title: '完成验收', owner: 'Ice', dueDate: '2026-10-20', taskId: task.id,
    })}`), /ai-001/)
    assert.match(await run(`meeting action add mtg-0001 ${json({
      title: '解决环境问题', owner: '测试', riskIssueId: issue.id,
    })}`), /ai-002/)
    assert.match(await run('meeting action update mtg-0001 ai-002 {"status":"done"}'), /已完成/)
    assert.equal(getMeeting(domain, 'mtg-0001').actions[1].status, 'done')

    for (const input of [
      'meeting add',
      `meeting add ${json({ projectId: 'p-9999', title: '不存在项目', meetingDate: '2026-10-10' })}`,
      `meeting add ${json({ projectId: project.id, title: '', meetingDate: '2026-10-10' })}`,
      `meeting add ${json({ projectId: project.id, title: '坏日期', meetingDate: '2026-02-30' })}`,
      `meeting add ${json({ projectId: project.id, title: '坏时间', meetingDate: '2026-10-10', startTime: '25:00' })}`,
      'meeting update mtg-0001 {"actions":[]}',
      `meeting action add mtg-0001 ${json({ title: '跨项目', taskId: otherTask.id })}`,
      `meeting action add mtg-0001 ${json({ title: '关联风险', riskIssueId: risk.id })}`,
      'meeting action update mtg-0001 ai-999 {"status":"done"}',
    ]) await run(input, 'error')

    await assert.rejects(() => deleteTask(domain, task.id), /仍被会议/)
    await assert.rejects(() => deleteRiskIssue(domain, issue.id), /仍被会议/)
    await assert.rejects(() => deleteProject(domain, project.id), /仍有/)

    const table = domain.table('meetings')
    const originalPut = table.put
    table.put = async () => { throw new Error('验证用会议写入失败') }
    try {
      await run(`meeting add ${json({
        projectId: project.id, title: '写入失败', meetingDate: '2026-10-11',
      })}`, 'error')
    } finally {
      table.put = originalPut
    }

    await Promise.all(Array.from({ length: 5 }, (_, index) => run(`meeting add ${json({
      projectId: project.id,
      title: `并发会议 ${index + 1}`,
      meetingDate: `2026-11-${String(index + 1).padStart(2, '0')}`,
    })}`)))
    assert.deepEqual([...table.keys()].sort(), [
      'mtg-0001', 'mtg-0002', 'mtg-0003', 'mtg-0004', 'mtg-0005', 'mtg-0006',
    ])
    assert.deepEqual(listMeetings(domain, project.id).map(item => item.id), [
      'mtg-0006', 'mtg-0005', 'mtg-0004', 'mtg-0003', 'mtg-0002', 'mtg-0001',
    ])

    assert.match(await run('meeting update mtg-0001 {"status":"final","summary":"确认发布范围"}'), /已定稿/)
    assert.match(await run('meeting list p-0001 final'), /mtg-0001/)
    assert.match(await run('meeting action delete mtg-0001 ai-001'), /当前未执行删除/)
    assert.match(await run('meeting action delete mtg-0001 ai-001 confirm'), /已删除/)
    assert.equal(getMeeting(domain, 'mtg-0001').actions[0].id, 'ai-002')

    assert.match(await run('meeting delete mtg-0002'), /当前未执行删除/)
    assert.match(await run('meeting delete mtg-0002 confirm'), /已删除/)
    assert.equal(existsSync(join(root, 'pmtool', 'meetings', 'mtg-0002.json')), false)

    const file = join(root, 'pmtool', 'meetings', 'mtg-0001.json')
    assert.equal(statSync(join(root, 'pmtool', 'meetings')).mode & 0o777, 0o700)
    assert.equal(statSync(file).mode & 0o777, 0o600)
    assert.match(readFileSync(file, 'utf8'), /"actions"/)

    console.log('通过：会议/行动项 CRUD、关联保护、排序、并发、失败恢复、可读 JSON 与权限。')
    await facility.closeAll()
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8', env: process.env, timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
    console.log(`全部会议纪要校验通过。临时数据保留于：${root}`)
  }
} finally {
  await facility.closeAll()
}

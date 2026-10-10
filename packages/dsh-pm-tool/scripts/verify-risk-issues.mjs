/**
 * R7 风险与问题确定性验证。使用独立临时目录，不污染真实业务数据。
 */
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
import { getRiskIssue, listRiskIssues } from '../lib/core/risk-issues.js'
import { riskIssueRecordSchema } from '../lib/core/risk-issue.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-risk-issues-'))
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

const create = value => `risk-issue add ${JSON.stringify(value)}`
const readRecord = id => JSON.parse(readFileSync(join(root, 'pmtool', 'risk_issues', `${id}.json`), 'utf8'))

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)

  if (reopening) {
    assert.equal(listRiskIssues(domain, 'p-0001').length, 6)
    assert.equal(getRiskIssue(domain, 'ri-0001').status, 'closed')
    assert.equal(getRiskIssue(domain, 'ri-0002'), undefined)
    assert.match(await run('risk-issue list p-0001 risk closed'), /供应商延期/)
    assert.match(await run(create({
      projectId: 'p-0001',
      type: 'issue',
      title: '重启后问题',
      impact: 'low',
      solution: '继续处理',
    })), /记录 ID：ri-0008/)
    console.log('通过：全新进程读回风险与问题，筛选正确且新增编号继续递增。')
  } else {
    const project = await addProject(domain, {
      name: '风险问题验证项目', startDate: '2026-10-10', targetDate: '2027-01-31',
    })
    const other = await addProject(domain, {
      name: '无记录项目', startDate: '2026-10-10', targetDate: '2027-01-31',
    })
    assert.match(await run('risk-issue list p-0001'), /暂无符合条件/)

    assert.match(await run(create({
      projectId: project.id,
      type: 'risk',
      title: '供应商延期',
      description: '关键设备交付可能延后',
      owner: 'Ice',
      dueDate: '2026-11-30',
      probability: 'medium',
      impact: 'high',
      responsePlan: '准备备选供应商',
    })), /记录 ID：ri-0001[\s\S]*类型：风险/)
    assert.match(await run(create({
      projectId: project.id,
      type: 'issue',
      title: '测试环境不可用',
      impact: 'critical',
      solution: '联系运维修复',
      status: 'monitoring',
    })), /记录 ID：ri-0002[\s\S]*类型：问题/)

    const risk = riskIssueRecordSchema.parse(readRecord('ri-0001').record)
    assert.equal(risk.status, 'open')
    assert.equal(risk.solution, '')
    const issue = riskIssueRecordSchema.parse(readRecord('ri-0002').record)
    assert.equal(issue.probability, null)
    assert.equal(issue.responsePlan, '')
    assert.equal(issue.owner, '')
    assert.equal(issue.dueDate, null)
    assert.deepEqual(listRiskIssues(domain, project.id, 'risk').map(item => item.id), ['ri-0001'])
    assert.deepEqual(listRiskIssues(domain, project.id, undefined, 'monitoring').map(item => item.id), ['ri-0002'])
    assert.match(await run('risk-issue list p-0001 issue monitoring'), /ri-0002｜问题/)
    assert.match(await run('risk-issue get ri-0001'), /应对措施：准备备选供应商/)

    const invalid = [
      'risk-issue add', 'risk-issue add {', 'risk-issue add null',
      create({ projectId: 'p-9999', type: 'risk', title: '项目不存在', impact: 'high', probability: 'high' }),
      create({ projectId: project.id, type: 'risk', title: '缺概率', impact: 'high' }),
      create({ projectId: project.id, type: 'risk', title: '风险误填方案', impact: 'high', probability: 'low', solution: '不适用' }),
      create({ projectId: project.id, type: 'issue', title: '问题误填概率', impact: 'high', probability: 'high' }),
      create({ projectId: project.id, type: 'issue', title: '问题误填应对', impact: 'high', responsePlan: '不适用' }),
      create({ projectId: project.id, type: 'issue', title: '影响错误', impact: 'urgent' }),
      create({ projectId: project.id, type: 'issue', title: '日期错误', impact: 'low', dueDate: '2026-02-30' }),
      create({ projectId: project.id, type: 'issue', title: '系统字段', impact: 'low', id: 'ri-custom' }),
      'risk-issue list', 'risk-issue list p-9999', 'risk-issue list p-0001 invalid',
      'risk-issue list p-0001 all invalid', 'risk-issue get', 'risk-issue get ri-9999',
      'risk-issue update ri-0001 {}',
    ]
    for (const input of invalid) await run(input, 'error')
    assert.equal(domain.table('risk_issues').size, 2)

    const table = domain.table('risk_issues')
    const originalPut = table.put
    table.put = async () => { throw new Error('验证用风险问题写入失败') }
    try {
      await run(create({
        projectId: project.id,
        type: 'issue',
        title: '写入失败',
        impact: 'low',
      }), 'error')
      assert.equal(table.size, 2)
    } finally {
      table.put = originalPut
    }

    await Promise.all(Array.from({ length: 5 }, (_, index) =>
      run(create({
        projectId: project.id,
        type: index % 2 ? 'issue' : 'risk',
        title: `并发记录 ${index + 1}`,
        impact: index === 4 ? 'critical' : 'medium',
        ...(index % 2
          ? { solution: `解决 ${index + 1}` }
          : { probability: 'low', responsePlan: `应对 ${index + 1}` }),
      })),
    ))
    assert.deepEqual([...table.keys()].sort(), [
      'ri-0001', 'ri-0002', 'ri-0003', 'ri-0004', 'ri-0005', 'ri-0006', 'ri-0007',
    ])

    const createdAt = getRiskIssue(domain, 'ri-0001').createdAt
    await new Promise(resolve => setTimeout(resolve, 2))
    assert.match(await run('risk-issue update ri-0001 {"status":"closed","owner":"更新负责人","dueDate":null}'), /已更新并保存/)
    assert.equal(getRiskIssue(domain, 'ri-0001').createdAt, createdAt)
    assert.notEqual(getRiskIssue(domain, 'ri-0001').updatedAt, createdAt)
    assert.equal(getRiskIssue(domain, 'ri-0001').dueDate, null)
    for (const input of [
      'risk-issue update', 'risk-issue update ri-0001', 'risk-issue update ri-0001 {',
      'risk-issue update ri-9999 {"status":"closed"}',
      'risk-issue update ri-0001 {"type":"issue"}',
      'risk-issue update ri-0001 {"solution":"风险不可填写"}',
      'risk-issue update ri-0002 {"probability":"high"}',
      'risk-issue update ri-0002 {"responsePlan":"问题不可填写"}',
    ]) await run(input, 'error')

    assert.match(await run('risk-issue delete ri-0002'), /当前未执行删除/)
    assert.ok(getRiskIssue(domain, 'ri-0002'))
    assert.match(await run('risk-issue delete ri-0002 confirm'), /问题已删除/)
    assert.equal(getRiskIssue(domain, 'ri-0002'), undefined)
    assert.equal(existsSync(join(root, 'pmtool', 'risk_issues', 'ri-0002.json')), false)
    for (const input of [
      'risk-issue delete', 'risk-issue delete ri-9999 confirm', 'risk-issue delete ri-0001 extra',
    ]) await run(input, 'error')

    getRiskIssue(domain, 'ri-0001').title = '不能写入'
    listRiskIssues(domain, project.id)[0].title = '不能写入'
    assert.equal(getRiskIssue(domain, 'ri-0001').title, '供应商延期')

    await assert.rejects(() => deleteProject(domain, project.id), /仍有风险或问题/)
    assert.ok(domain.table('projects').get(project.id))
    assert.equal((await deleteProject(domain, other.id)).id, other.id)

    const file = join(root, 'pmtool', 'risk_issues', 'ri-0001.json')
    assert.equal(statSync(join(root, 'pmtool', 'risk_issues')).mode & 0o777, 0o700)
    assert.equal(statSync(file).mode & 0o777, 0o600)
    assert.match(readFileSync(file, 'utf8'), /\n  "version": 1,/)

    console.log('通过：风险/问题 CRUD、类型字段、筛选、并发编号、失败恢复、项目删除保护、可读 JSON 与权限。')
    await facility.closeAll()
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8',
      env: process.env,
      timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
    console.log(`全部风险与问题校验通过。临时数据保留于：${root}`)
  }
} finally {
  await facility.closeAll()
}

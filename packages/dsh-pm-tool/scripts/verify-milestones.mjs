/**
 * 里程碑确定性验证。使用独立系统临时目录，不污染真实业务数据。
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
import { getMilestone, listMilestones } from '../lib/core/milestones.js'
import { milestoneRecordSchema } from '../lib/core/milestone.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-milestones-'))
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

const create = value => `milestone add ${JSON.stringify(value)}`
const readMilestone = id => JSON.parse(readFileSync(join(root, 'pmtool', 'milestones', `${id}.json`), 'utf8'))

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)

  if (reopening) {
    const milestones = listMilestones(domain, 'p-0001')
    assert.equal(milestones.length, 8)
    assert.deepEqual(milestones.slice(0, 2).map(item => item.id), ['m-0002', 'm-0003'])
    assert.equal(getMilestone(domain, 'm-0001'), undefined)
    assert.equal(getMilestone(domain, 'm-0002').title, '需求冻结（更新）')
    assert.match(await run('milestone list p-0001'), /里程碑时间线/)
    assert.match(await run(create({
      projectId: 'p-0001', title: '重启后里程碑', targetDate: '2027-01-01',
    })), /里程碑 ID：m-0010/)
    console.log('通过：全新进程读回里程碑时间线，新增编号继续递增。')
  } else {
    const project = await addProject(domain, {
      name: '里程碑验证项目', startDate: '2026-10-10', targetDate: '2027-01-31',
    })
    const other = await addProject(domain, {
      name: '另一项目', startDate: '2026-10-10', targetDate: '2027-01-31',
    })
    assert.equal(project.id, 'p-0001')
    assert.match(await run('milestone list p-0001'), /暂无里程碑/)

    assert.match(await run(create({
      projectId: project.id,
      title: '正式发布',
      targetDate: '2026-12-31',
    })), /里程碑 ID：m-0001/)
    assert.match(await run(create({
      projectId: project.id,
      title: '需求冻结',
      targetDate: '2026-11-30',
      status: 'at_risk',
      description: '需求清单评审通过',
    })), /状态：有风险/)
    assert.match(await run(create({
      projectId: project.id,
      title: '设计完成',
      targetDate: '2026-11-30',
      status: 'achieved',
      achievedDate: '2026-11-29',
    })), /实际达成日期：2026-11-29/)

    const first = milestoneRecordSchema.parse(readMilestone('m-0001').record)
    assert.equal(first.status, 'planned')
    assert.equal(first.achievedDate, null)
    assert.equal(first.description, '')
    assert.deepEqual(listMilestones(domain, project.id).map(item => item.id), ['m-0002', 'm-0003', 'm-0001'])
    assert.match(await run('milestone list p-0001'), /2026-11-30｜m-0002[\s\S]*2026-11-30｜m-0003[\s\S]*2026-12-31｜m-0001/)
    assert.match(await run('milestone get m-0002'), /说明\/达成标准：需求清单评审通过/)

    const invalid = [
      'milestone add', 'milestone add {', 'milestone add null',
      create({ projectId: 'p-9999', title: '不存在项目', targetDate: '2026-12-01' }),
      create({ projectId: project.id, title: '  ', targetDate: '2026-12-01' }),
      create({ projectId: project.id, title: '无日期' }),
      create({ projectId: project.id, title: '错误日期', targetDate: '2026-02-30' }),
      create({ projectId: project.id, title: '错误状态', targetDate: '2026-12-01', status: 'done' }),
      create({ projectId: project.id, title: '错误达成日', targetDate: '2026-12-01', achievedDate: '2026-02-30' }),
      create({ projectId: project.id, title: '状态不一致', targetDate: '2026-12-01', status: 'planned', achievedDate: '2026-11-30' }),
      create({ projectId: project.id, title: '缺达成日', targetDate: '2026-12-01', status: 'achieved' }),
      create({ projectId: project.id, title: '系统字段', targetDate: '2026-12-01', id: 'm-custom' }),
      'milestone list', 'milestone list p-9999', 'milestone list p-0001 extra',
      'milestone get', 'milestone get m-9999', 'milestone get ../escape',
      'milestone update m-0001 {}',
    ]
    for (const input of invalid) await run(input, 'error')
    assert.equal(domain.table('milestones').size, 3)

    const table = domain.table('milestones')
    const originalPut = table.put
    table.put = async () => { throw new Error('验证用里程碑写入失败') }
    try {
      await run(create({
        projectId: project.id, title: '写入失败', targetDate: '2026-12-15',
      }), 'error')
      assert.equal(table.size, 3)
    } finally {
      table.put = originalPut
    }

    await Promise.all(Array.from({ length: 6 }, (_, index) =>
      run(create({
        projectId: project.id,
        title: `并发里程碑 ${index + 1}`,
        targetDate: `2026-12-${String(index + 10).padStart(2, '0')}`,
        status: index % 2 ? 'missed' : 'planned',
      })),
    ))
    assert.equal(table.size, 9)
    assert.deepEqual([...table.keys()].sort(), [
      'm-0001', 'm-0002', 'm-0003', 'm-0004', 'm-0005',
      'm-0006', 'm-0007', 'm-0008', 'm-0009',
    ])

    const milestoneCreatedAt = getMilestone(domain, 'm-0002').createdAt
    await new Promise(resolve => setTimeout(resolve, 2))
    assert.match(await run('milestone update m-0002 {"title":"需求冻结（更新）","status":"achieved","achievedDate":"2026-11-28"}'), /里程碑已更新并保存/)
    assert.equal(getMilestone(domain, 'm-0002').createdAt, milestoneCreatedAt)
    assert.notEqual(getMilestone(domain, 'm-0002').updatedAt, milestoneCreatedAt)
    assert.match(await run('milestone get m-0002'), /状态：已达成[\s\S]*实际达成日期：2026-11-28/)
    for (const input of [
      'milestone update', 'milestone update m-0002', 'milestone update m-0002 {',
      'milestone update m-9999 {"title":"不存在"}',
      'milestone update m-0002 {}',
      'milestone update m-0002 {"projectId":"p-0002"}',
      'milestone update m-0002 {"status":"planned"}',
      'milestone update m-0002 {"achievedDate":null}',
      'milestone update m-0001 {"achievedDate":"2026-11-29"}',
    ]) await run(input, 'error')

    assert.match(await run('milestone delete m-0001'), /当前未执行删除/)
    assert.ok(getMilestone(domain, 'm-0001'))
    assert.match(await run('task add {"projectId":"p-0001","title":"关联任务","milestoneId":"m-0001"}'), /里程碑：m-0001/)
    assert.match(await run('milestone delete m-0001 confirm', 'error'), /仍有关联任务/)
    assert.match(await run('task update t-0001 {"milestoneId":null}'), /里程碑：无/)
    assert.match(await run('milestone delete m-0001 confirm'), /里程碑已删除/)
    assert.equal(getMilestone(domain, 'm-0001'), undefined)
    assert.match(await run('task delete t-0001 confirm'), /任务已删除/)
    for (const input of [
      'milestone delete', 'milestone delete m-9999 confirm', 'milestone delete m-0002 extra',
    ]) await run(input, 'error')

    getMilestone(domain, 'm-0002').title = '不能写入'
    listMilestones(domain, project.id)[0].title = '不能写入'
    assert.equal(getMilestone(domain, 'm-0002').title, '需求冻结（更新）')

    await assert.rejects(() => deleteProject(domain, project.id), /仍有里程碑/)
    assert.ok(domain.table('projects').get(project.id))
    const deletedOther = await deleteProject(domain, other.id)
    assert.equal(deletedOther.id, other.id)

    const file = join(root, 'pmtool', 'milestones', 'm-0002.json')
    assert.equal(existsSync(file), true)
    assert.equal(statSync(join(root, 'pmtool', 'milestones')).mode & 0o777, 0o700)
    assert.equal(statSync(file).mode & 0o777, 0o600)
    assert.match(readFileSync(file, 'utf8'), /\n  "version": 2,/g)

    console.log('通过：里程碑增查改删、状态一致性、任务关联保护、时间线排序、并发编号、项目删除保护、可读 JSON 与权限。')
    await facility.closeAll()
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8', env: process.env, timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
    console.log(`全部里程碑校验通过。临时数据保留于：${root}`)
  }
} finally {
  await facility.closeAll()
}

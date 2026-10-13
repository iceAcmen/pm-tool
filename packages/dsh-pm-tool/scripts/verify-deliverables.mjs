/**
 * R10 交付物台账确定性验证。使用独立临时目录，不污染真实业务数据。
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
import { getDeliverable, listDeliverables } from '../lib/core/deliverables.js'
import { deliverableRecordSchema } from '../lib/core/deliverable.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-deliverables-'))
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

const create = value => `deliverable add ${JSON.stringify(value)}`
const readRecord = id => JSON.parse(readFileSync(join(root, 'pmtool', 'deliverables', `${id}.json`), 'utf8'))

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)

  if (reopening) {
    assert.equal(listDeliverables(domain, 'p-0001').length, 6)
    assert.equal(getDeliverable(domain, 'dlv-0001').history.length, 3)
    assert.equal(getDeliverable(domain, 'dlv-0001').status, 'submitted')
    assert.equal(getDeliverable(domain, 'dlv-0002'), undefined)
    assert.match(await run('deliverable list p-0001 submitted'), /需求说明书/)
    assert.match(await run(create({
      projectId: 'p-0001',
      name: '重启后交付物',
      status: 'planned',
    })), /交付物 ID：dlv-0008/)
    console.log('通过：全新进程读回交付物台账与变更留痕，筛选正确且新增编号继续递增。')
  } else {
    const project = await addProject(domain, {
      name: '交付物验证项目', startDate: '2026-10-10', targetDate: '2027-01-31',
    })
    const other = await addProject(domain, {
      name: '无交付物项目', startDate: '2026-10-10', targetDate: '2027-01-31',
    })
    assert.match(await run('deliverable list p-0001'), /暂无符合条件/)

    assert.match(await run(create({
      projectId: project.id,
      name: '需求说明书',
      version: 'v0.9',
      owner: 'Ice',
      status: 'in_progress',
      location: 'exports/需求说明书.md',
      dueDate: '2026-11-15',
    })), /交付物 ID：dlv-0001[\s\S]*状态：制作中/)
    assert.match(await run(create({
      projectId: project.id,
      name: '原型稿',
    })), /交付物 ID：dlv-0002[\s\S]*状态：计划中/)

    const first = deliverableRecordSchema.parse(readRecord('dlv-0001').record)
    assert.equal(first.status, 'in_progress')
    assert.equal(first.history.length, 1)
    assert.equal(first.history[0].field, 'created')
    const second = deliverableRecordSchema.parse(readRecord('dlv-0002').record)
    assert.equal(second.version, '')
    assert.equal(second.status, 'planned')
    assert.equal(second.location, '')
    assert.equal(second.dueDate, null)

    assert.deepEqual(listDeliverables(domain, project.id, 'submitted').map(item => item.id), [])
    assert.deepEqual(listDeliverables(domain, project.id, 'planned').map(item => item.id), ['dlv-0002'])
    assert.match(await run('deliverable list p-0001 in_progress'), /dlv-0001｜需求说明书｜v0.9｜制作中/)
    assert.match(await run('deliverable get dlv-0001'), /位置：exports\/需求说明书\.md/)

    const invalid = [
      'deliverable add', 'deliverable add {', 'deliverable add null',
      create({ projectId: 'p-9999', name: '项目不存在' }),
      create({ projectId: project.id, name: '' }),
      create({ projectId: project.id, name: '状态错误', status: 'done' }),
      create({ projectId: project.id, name: '日期错误', dueDate: '2026-02-30' }),
      create({ projectId: project.id, name: '系统字段', id: 'dlv-custom' }),
      create({ projectId: project.id, name: '历史字段', history: [] }),
      'deliverable list', 'deliverable list p-9999', 'deliverable list p-0001 invalid',
      'deliverable get', 'deliverable get dlv-9999',
      'deliverable update dlv-0001 {}',
      'deliverable update dlv-0001 {"operator":"Ice"}',
    ]
    for (const input of invalid) await run(input, 'error')
    assert.equal(domain.table('deliverables').size, 2)

    const table = domain.table('deliverables')
    const originalPut = table.put
    table.put = async () => { throw new Error('验证用交付物写入失败') }
    try {
      await run(create({ projectId: project.id, name: '写入失败' }), 'error')
      assert.equal(table.size, 2)
    } finally {
      table.put = originalPut
    }

    await Promise.all(Array.from({ length: 5 }, (_, index) =>
      run(create({ projectId: project.id, name: `并发交付物 ${index + 1}` }))),
    )
    assert.deepEqual([...table.keys()].sort(), [
      'dlv-0001', 'dlv-0002', 'dlv-0003', 'dlv-0004', 'dlv-0005', 'dlv-0006', 'dlv-0007',
    ])

    const createdAt = getDeliverable(domain, 'dlv-0001').createdAt
    await new Promise(resolve => setTimeout(resolve, 2))
    // 同时改状态与版本：应按状态、版本顺序各追加一条留痕。
    assert.match(
      await run('deliverable update dlv-0001 {"status":"submitted","version":"v1.0","changeNote":"提交评审","operator":"Ice"}'),
      /已更新并保存[\s\S]*版本 v0.9 → v1.0[\s\S]*状态 制作中 → 已提交/,
    )
    const afterBoth = getDeliverable(domain, 'dlv-0001')
    assert.equal(afterBoth.history.length, 3)
    assert.equal(afterBoth.history[1].field, 'status')
    assert.equal(afterBoth.history[1].to, 'submitted')
    assert.equal(afterBoth.history[1].by, 'Ice')
    assert.equal(afterBoth.history[1].note, '提交评审')
    assert.equal(afterBoth.history[2].field, 'version')
    assert.equal(afterBoth.history[2].to, 'v1.0')
    assert.equal(afterBoth.createdAt, createdAt)
    assert.notEqual(afterBoth.updatedAt, createdAt)
    // 仅改非留痕字段（负责人）不应追加历史；改成相同状态也不追加。
    const historyCount = afterBoth.history.length
    await run('deliverable update dlv-0001 {"owner":"新负责人"}')
    await run('deliverable update dlv-0001 {"status":"submitted"}')
    assert.equal(getDeliverable(domain, 'dlv-0001').history.length, historyCount)
    assert.equal(getDeliverable(domain, 'dlv-0001').owner, '新负责人')
    for (const input of [
      'deliverable update', 'deliverable update dlv-0001', 'deliverable update dlv-0001 {',
      'deliverable update dlv-9999 {"status":"accepted"}',
      'deliverable update dlv-0001 {"status":"unknown"}',
    ]) await run(input, 'error')

    assert.match(await run('deliverable delete dlv-0002'), /当前未执行删除/)
    assert.ok(getDeliverable(domain, 'dlv-0002'))
    assert.match(await run('deliverable delete dlv-0002 confirm'), /交付物已删除/)
    assert.equal(getDeliverable(domain, 'dlv-0002'), undefined)
    assert.equal(existsSync(join(root, 'pmtool', 'deliverables', 'dlv-0002.json')), false)
    for (const input of [
      'deliverable delete', 'deliverable delete dlv-9999 confirm', 'deliverable delete dlv-0001 extra',
    ]) await run(input, 'error')

    getDeliverable(domain, 'dlv-0001').name = '不能写入'
    listDeliverables(domain, project.id)[0].name = '不能写入'
    assert.equal(getDeliverable(domain, 'dlv-0001').name, '需求说明书')

    await assert.rejects(() => deleteProject(domain, project.id), /仍有交付物/)
    assert.ok(domain.table('projects').get(project.id))
    assert.equal((await deleteProject(domain, other.id)).id, other.id)

    const file = join(root, 'pmtool', 'deliverables', 'dlv-0001.json')
    assert.equal(statSync(join(root, 'pmtool', 'deliverables')).mode & 0o777, 0o700)
    assert.equal(statSync(file).mode & 0o777, 0o600)
    assert.match(readFileSync(file, 'utf8'), /\n  "version": 2,/g)

    console.log('通过：交付物 CRUD、状态筛选、版本/状态变更留痕、并发编号、失败恢复、项目删除保护、可读 JSON 与权限。')
    await facility.closeAll()
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8',
      env: process.env,
      timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
    console.log(`全部交付物台账校验通过。临时数据保留于：${root}`)
  }
} finally {
  await facility.closeAll()
}

/**
 * WBS 任务确定性验证。使用独立系统临时目录，不污染真实业务数据。
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
import { getTask, listTasks } from '../lib/core/tasks.js'
import { taskRecordSchema } from '../lib/core/task.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-tasks-'))
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

const create = value => `task add ${JSON.stringify(value)}`
const readTask = id => JSON.parse(readFileSync(join(root, 'pmtool', 'tasks', `${id}.json`), 'utf8'))

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)

  if (reopening) {
    const tasks = listTasks(domain, 'p-0001')
    assert.equal(tasks.length, 8)
    assert.equal(getTask(domain, 't-0002').parentId, 't-0004')
    assert.equal(getTask(domain, 't-0002').code, '2.1')
    assert.equal(getTask(domain, 't-0005'), undefined)
    assert.match(await run('task list p-0001'), /  2\.1｜t-0002/)
    assert.match(await run(create({ projectId: 'p-0001', parentId: 't-0001', title: '重启后子任务' })), /WBS：1\.7/)
    console.log('通过：全新进程读回更新、移动、重新编号与删除结果，并继续同级编号。')
  } else {
    const project = await addProject(domain, {
      name: 'WBS 验证项目', startDate: '2026-10-10', targetDate: '2026-12-31',
    })
    const other = await addProject(domain, {
      name: '另一项目', startDate: '2026-10-10', targetDate: '2026-12-31',
    })
    assert.equal(project.id, 'p-0001')
    assert.match(await run('task list p-0001'), /暂无任务/)

    assert.match(await run(create({ projectId: project.id, title: '阶段一' })), /WBS：1/)
    assert.match(await run(create({ projectId: project.id, parentId: 't-0001', title: '需求分析' })), /WBS：1\.1/)
    assert.match(await run(create({ projectId: project.id, parentId: 't-0002', title: '用户访谈' })), /WBS：1\.1\.1/)
    assert.match(await run(create({
      projectId: project.id,
      title: '阶段二',
      assignee: 'Ice',
      status: 'in_progress',
      priority: 'P0',
      startDate: '2026-11-01',
      dueDate: '2026-11-30',
      progress: 20,
    })), /WBS：2/)

    const first = taskRecordSchema.parse(readTask('t-0001').record)
    assert.equal(first.parentId, null)
    assert.equal(first.order, 1)
    assert.equal(first.status, 'todo')
    assert.equal(first.priority, 'P1')
    assert.equal(first.progress, 0)
    assert.equal(first.milestoneId, null)

    const invalid = [
      'task add', 'task add {', 'task add null',
      create({ projectId: 'p-9999', title: '不存在项目' }),
      create({ projectId: project.id, parentId: 't-9999', title: '不存在父任务' }),
      create({ projectId: other.id, parentId: 't-0001', title: '跨项目父任务' }),
      create({ projectId: project.id, title: '  ' }),
      create({ projectId: project.id, title: '错误进度', progress: 101 }),
      create({ projectId: project.id, title: '错误日期', startDate: '2026-12-01', dueDate: '2026-11-01' }),
      create({ projectId: project.id, title: '暂不关联里程碑', milestoneId: 'm-0001' }),
      create({ projectId: project.id, title: '系统字段', code: '9' }),
      'task list', 'task list p-9999', 'task list p-0001 extra',
      'task get', 'task get t-9999', 'task get ../escape',
    ]
    for (const input of invalid) await run(input, 'error')
    assert.equal(domain.table('tasks').size, 4)

    const taskTable = domain.table('tasks')
    const originalPut = taskTable.put
    taskTable.put = async () => { throw new Error('验证用任务写入失败') }
    try {
      await run(create({ projectId: project.id, title: '写入失败任务' }), 'error')
      assert.equal(taskTable.size, 4)
    } finally {
      taskTable.put = originalPut
    }

    // 同一父任务并发新增，WBS 与 order 必须唯一且连续。
    await Promise.all(Array.from({ length: 6 }, (_, index) =>
      run(create({ projectId: project.id, parentId: 't-0001', title: `并发子任务 ${index + 1}` })),
    ))
    const tasks = listTasks(domain, project.id)
    assert.equal(tasks.length, 10)
    assert.deepEqual(
      tasks.filter(task => task.parentId === 't-0001').map(task => task.code),
      ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7'],
    )
    assert.match(await run('task list p-0001'), /1\.1\.1/)
    assert.match(await run('task get t-0004'), /负责人：Ice/)

    const createdAt = getTask(domain, 't-0004').createdAt
    await new Promise(resolve => setTimeout(resolve, 2))
    assert.match(await run('task update t-0004 {"title":"阶段二（更新）","status":"done","progress":100}'), /任务已更新并保存/)
    assert.match(await run('task get t-0004'), /标题：阶段二（更新）[\s\S]*状态：已完成[\s\S]*进度：100%/)
    assert.equal(getTask(domain, 't-0004').createdAt, createdAt)
    assert.notEqual(getTask(domain, 't-0004').updatedAt, createdAt)
    for (const input of [
      'task update', 'task update t-0004', 'task update t-0004 {',
      'task update t-9999 {"title":"不存在"}',
      'task update t-0004 {}',
      'task update t-0004 {"projectId":"p-0002"}',
      'task update t-0004 {"parentId":"t-0001"}',
      'task update t-0004 {"dueDate":"2026-10-01"}',
      'task update t-0004 {"progress":101}',
    ]) await run(input, 'error')
    assert.equal(getTask(domain, 't-0004').dueDate, '2026-11-30')
    assert.match(await run('task update t-0004 {"startDate":null,"dueDate":null}'), /开始日期：未填写[\s\S]*截止日期：未填写/)

    // 删除和移动均先预览；父任务、跨项目和循环关系受到保护。
    assert.match(await run('task delete t-0003'), /当前未执行删除/)
    assert.ok(getTask(domain, 't-0003'))
    assert.match(await run('task delete t-0002 confirm', 'error'), /仍有子任务/)
    assert.match(await run('task delete t-0003 confirm'), /任务已删除/)
    assert.equal(getTask(domain, 't-0003'), undefined)
    assert.equal(domain.table('tasks').size, 9)

    assert.match(await run(create({ projectId: other.id, title: '其他项目任务' })), /项目 ID：p-0002/)
    assert.match(await run('task move t-0002 root'), /当前未执行移动/)
    assert.equal(getTask(domain, 't-0002').parentId, 't-0001')
    assert.match(await run('task move t-0002 root confirm'), /根层级/)
    assert.equal(getTask(domain, 't-0002').parentId, null)
    assert.equal(getTask(domain, 't-0002').code, '1.1')
    assert.match(await run('task move t-0002 t-0004'), /当前未执行移动/)
    assert.match(await run('task move t-0002 t-0004 confirm'), /父任务 t-0004/)
    assert.equal(getTask(domain, 't-0002').parentId, 't-0004')
    assert.equal(getTask(domain, 't-0002').code, '1.1')
    assert.match(await run('task list p-0001'), /2｜t-0004[\s\S]*  1\.1｜t-0002/)
    for (const input of [
      'task move', 'task move t-0002', 'task move t-9999 root confirm',
      'task move t-0004 t-0002 confirm',
      'task move t-0002 t-0002 confirm',
      'task move t-0002 t-0011 confirm',
      'task move t-0002 t-9999 confirm',
    ]) await run(input, 'error')

    assert.match(await run('task renumber p-0001'), /当前未执行重新编号/)
    assert.equal(getTask(domain, 't-0002').code, '1.1')
    const beforeFailedRenumber = listTasks(domain, project.id).map(task => [task.id, task.code, task.order])
    let renumberWrites = 0
    taskTable.put = async (...args) => {
      renumberWrites += 1
      if (renumberWrites === 2) throw new Error('验证用重新编号写入失败')
      return originalPut.apply(taskTable, args)
    }
    try {
      await run('task renumber p-0001 confirm', 'error')
      assert.deepEqual(
        listTasks(domain, project.id).map(task => [task.id, task.code, task.order]),
        beforeFailedRenumber,
      )
    } finally {
      taskTable.put = originalPut
    }
    assert.match(await run('task renumber p-0001 confirm'), /9 个任务已重新编号/)
    assert.equal(getTask(domain, 't-0002').code, '2.1')
    assert.deepEqual(
      listTasks(domain, project.id).map(task => task.code),
      ['1', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '2', '2.1'],
    )
    assert.match(await run('task renumber p-9999 confirm', 'error'), /未找到项目/)
    assert.match(await run('task renumber p-0002 confirm'), /1 个任务已重新编号/)

    // 删除非末尾兄弟后不自动重排，显式留下 1.1 空洞。
    assert.match(await run('task delete t-0005 confirm'), /WBS 编号未自动调整/)
    assert.equal(getTask(domain, 't-0005'), undefined)
    assert.deepEqual(
      listTasks(domain, project.id).map(task => task.code),
      ['1', '1.2', '1.3', '1.4', '1.5', '1.6', '2', '2.1'],
    )
    for (const input of [
      'task delete', 'task delete t-9999 confirm', 'task delete t-0001 extra',
      'task renumber', 'task renumber p-0001 extra',
    ]) await run(input, 'error')

    getTask(domain, 't-0001').title = '不能写入'
    listTasks(domain, project.id)[0].title = '不能写入'
    assert.equal(getTask(domain, 't-0001').title, '阶段一')

    await assert.rejects(() => deleteProject(domain, project.id), /仍有任务/)
    assert.ok(domain.table('projects').get(project.id))

    const file = join(root, 'pmtool', 'tasks', 't-0001.json')
    assert.equal(existsSync(file), true)
    assert.equal(statSync(join(root, 'pmtool', 'tasks')).mode & 0o777, 0o700)
    assert.equal(statSync(file).mode & 0o777, 0o600)
    assert.match(readFileSync(file, 'utf8'), /\n  "version": 1,/)

    console.log('通过：任务增查改删、移动/循环保护、显式重编号、并发编号、项目删除保护、可读 JSON 与权限。')
    await facility.closeAll()
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8', env: process.env, timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
    console.log(`全部任务校验通过。临时数据保留于：${root}`)
  }
} finally {
  await facility.closeAll()
}

/**
 * v0.8 客观进度 · 任务清单（checklist）专项验证（TDD）。
 *
 * 覆盖已冻结验收矩阵 docs/testing/objective-progress-acceptance.md 的 CK / Q / BD 层：
 *   OP-CK-01 schema 仅 {id,text,done}、旧记录无键可读；
 *   OP-CK-02 内部节点禁挂清单（中文文案「有子任务的任务不挂清单」）；
 *   OP-CK-03 有非空清单的叶子禁收子任务（拒绝、不删除清单）；
 *   OP-CK-04 独立 add/rename/remove 单项修改，不整段替换数组；
 *   OP-CK-05 toggle 带明确目标布尔 expectedDone，重试不反向翻转（幂等）；
 *   OP-CK-06 / OP-BD-01 单项写盘读回一致 + 全新进程重启读回；
 *   OP-Q-01 普通 task update 不能夹带 checklist（strictObject 未知键拒绝）；
 *   OP-Q-02 重复 toggle 幂等；
 *   OP-Q-04 写盘失败不半写（status/progress/updatedAt 不变）；
 *   父子双向守卫：addTask(parentId) / move / move+--renumber 三条路径对「有清单叶子收子任务」拒绝。
 *
 * 全程独立系统临时目录，不触碰正式 data/backups/exports。
 * 运行：node scripts/verify-task-checklist.mjs            （建库 + 断言 + 自重启读回）
 *       node scripts/verify-task-checklist.mjs --reopen <root>   （第二阶段：全新进程读回）
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import { getTask } from '../lib/core/tasks.js'
import { taskRecordSchema } from '../lib/core/task.js'
import {
  addTaskChecklistItem,
  removeTaskChecklistItem,
  renameTaskChecklistItem,
  setTaskChecklistItemDone,
} from '../lib/core/task-checklist.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-checklist-'))
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
const readTaskFile = id => JSON.parse(readFileSync(join(root, 'pmtool', 'tasks', `${id}.json`), 'utf8'))

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)

  if (reopening) {
    // ===== 第二阶段：全新进程重启读回（OP-BD-01）=====
    const leaf = getTask(domain, 't-0008')
    assert.ok(leaf, '重启后叶子任务 t-0008 仍在')
    assert.ok(Array.isArray(leaf.checklist), '重启后清单仍为数组')
    assert.equal(leaf.checklist.length, 2, '重启后清单保留 2 项')
    for (const item of leaf.checklist) {
      // OP-CK-01：每项恰好 id/text/done 三键，无 doneAt/weight/title 等
      assert.deepEqual(Object.keys(item).sort(), ['done', 'id', 'text'])
      assert.equal(typeof item.id, 'string')
      assert.ok(item.id.length > 0)
      assert.equal(typeof item.text, 'string')
      assert.ok(item.text.length > 0)
      assert.equal(typeof item.done, 'boolean')
    }
    assert.equal(leaf.checklist[0].done, true, '重启后第一项 done=true 保持')
    assert.equal(leaf.checklist[1].done, false, '重启后第二项 done=false 保持')
    assert.equal(leaf.status, 'todo', '重启后 status 未被清单操作改写')
    assert.equal(leaf.progress, 0, '重启后 progress 未被清单操作改写')
    // 旧记录无 checklist 键照常读（OP-CK-01 旧记录零写）
    const parent = getTask(domain, 't-0001')
    assert.ok(parent)
    assert.equal(parent.checklist, undefined, '内部节点重启后仍无 checklist 键')
    assert.match(await run('task get t-0008'), /清单项：2 项（已勾 1）/)
    console.log('通过：全新进程读回 {id,text,done} 形状、status/progress 不被改写、旧记录无键零写。')
  } else {
    // ===== 第一阶段：建库 + 全部写断言 =====
    const project = await addProject(domain, {
      name: '清单验证项目', startDate: '2026-10-15', targetDate: '2026-12-31',
    })
    assert.equal(project.id, 'p-0001')
    await run(create({ projectId: project.id, title: '阶段一（父）' }))       // t-0001 内部节点
    await run(create({ projectId: project.id, parentId: 't-0001', title: '子任务甲' })) // t-0002
    await run(create({ projectId: project.id, title: '独立叶子' }))          // t-0003 挂清单
    await run(create({ projectId: project.id, title: '另一叶子' }))          // t-0004

    // ---- OP-CK-01：schema 仅三键；旧记录无键可写读 ----
    const legacyRecord = {
      id: 't-0009', projectId: 'p-0001', parentId: null, title: '旧记录', description: '',
      assignee: '', status: 'todo', priority: 'P1', progress: 0, milestoneId: null,
      code: '9', order: 9, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
    }
    const parsed = taskRecordSchema.parse(legacyRecord)
    assert.equal(parsed.checklist, undefined, '无 checklist 键的旧记录照常通过 schema')
    // 带额外键（doneAt/weight/progressMode）的记录必须被 strictObject 拒绝
    assert.throws(() => taskRecordSchema.parse({ ...legacyRecord, checklist: [{ id: 'c-1', text: 'x', done: false, doneAt: '2026-10-01' }] }), /Unrecognized keys|unrecognized/i)

    // ---- OP-CK-04：add 单项追加；文本 trim、非空 ----
    const addOut = await run('task checklist add t-0003  写立项书  ')
    assert.match(addOut, /清单已追加 1 项/)
    let leaf = getTask(domain, 't-0003')
    assert.equal(leaf.checklist.length, 1)
    const item1 = leaf.checklist[0]
    assert.equal(item1.text, '写立项书', '首尾空白被 trim')
    assert.equal(item1.done, false)
    assert.equal(typeof item1.id, 'string')
    assert.ok(item1.id.length >= 16, 'itemId 为稳定 UUID 长 id')
    // add 不触碰 status/progress
    assert.equal(leaf.status, 'todo')
    assert.equal(leaf.progress, 0)

    await run('task checklist add t-0003  ', 'error')
    await run('task checklist add t-0003   ', 'error')
    await run('task checklist add t-9999 不存在任务', 'error')
    await run('task checklist add t-0003', 'error')

    // 第二项
    await run(`task checklist add t-0003 访谈用户`)
    leaf = getTask(domain, 't-0003')
    assert.equal(leaf.checklist.length, 2)
    const item2 = leaf.checklist[1]
    assert.notEqual(item2.id, item1.id, '每项 id 不同（同任务内唯一）')

    // ---- OP-CK-05 / OP-Q-02：toggle 带明确目标布尔，重试幂等不反向 ----
    const beforeToggle = getTask(domain, 't-0003').updatedAt
    await new Promise(r => setTimeout(r, 5))
    await run(`task checklist toggle t-0003 ${item1.id} true`)
    leaf = getTask(domain, 't-0003')
    assert.equal(leaf.checklist[0].done, true, '第一次 toggle true → done=true')
    assert.notEqual(leaf.updatedAt, beforeToggle, '首次翻转确实落盘')
    const afterFirst = leaf.updatedAt
    await new Promise(r => setTimeout(r, 5))
    // 相同 expectedDone 重试：必须幂等停在 true，绝不翻回 false，且不再写库
    await run(`task checklist toggle t-0003 ${item1.id} true`)
    leaf = getTask(domain, 't-0003')
    assert.equal(leaf.checklist[0].done, true, '重试相同 expectedDone 不反向翻回 false')
    assert.equal(leaf.updatedAt, afterFirst, '幂等命中不重复写库')
    // 目标布尔为 false 才会翻回去
    await run(`task checklist toggle t-0003 ${item1.id} false`)
    assert.equal(getTask(domain, 't-0003').checklist[0].done, false)
    // 非法参数
    await run(`task checklist toggle t-0003 ${item1.id} 是`, 'error')
    await run(`task checklist toggle t-0003 ${item1.id}`, 'error')
    await run(`task checklist toggle t-0003 no-such-item true`, 'error')
    await run(`task checklist toggle t-9999 ${item1.id} true`, 'error')
    // 领域直调同样幂等
    await setTaskChecklistItemDone(domain, 't-0003', item1.id, true)
    await setTaskChecklistItemDone(domain, 't-0003', item1.id, true)
    assert.equal(getTask(domain, 't-0003').checklist[0].done, true)

    // ---- OP-CK-04：rename 只改 text，其余逐字段不变 ----
    await run(`task checklist rename t-0003 ${item2.id} 访谈 10 位目标用户`)
    leaf = getTask(domain, 't-0003')
    assert.equal(leaf.checklist[1].text, '访谈 10 位目标用户')
    assert.equal(leaf.checklist[1].id, item2.id, 'rename 不改 id')
    assert.equal(leaf.checklist[1].done, false, 'rename 不改 done')
    assert.equal(leaf.checklist[0].text, '写立项书', 'rename 不影响兄弟项')
    await run(`task checklist rename t-0003 ${item2.id}   `, 'error')
    await run(`task checklist rename t-0003 no-such-item 新文本`, 'error')

    // ---- OP-CK-04：remove 单项删除；删空后键归一为缺键 ----
    await run(`task checklist remove t-0003 ${item2.id}`)
    leaf = getTask(domain, 't-0003')
    assert.equal(leaf.checklist.length, 1)
    assert.equal(leaf.checklist[0].id, item1.id, 'remove 不影响其余项')
    await run(`task checklist remove t-0003 no-such-item`, 'error')
    await run(`task checklist remove t-0003 ${item1.id}`)
    leaf = getTask(domain, 't-0003')
    assert.equal(leaf.checklist, undefined, '删空后 checklist 键归一为缺键（不污染 v2 记录）')

    // 再加两项供重启读回与守卫测试使用
    await addTaskChecklistItem(domain, 't-0003', '重启读回项甲')
    await addTaskChecklistItem(domain, 't-0003', '重启读回项乙')
    leaf = getTask(domain, 't-0003')
    await setTaskChecklistItemDone(domain, 't-0003', leaf.checklist[0].id, true)
    assert.equal(leaf.checklist.length, 2)
    const keepItem = leaf.checklist[0]

    // ---- OP-CK-02：内部节点禁挂清单 ----
    const beforeParentChecklist = readTaskFile('t-0001')
    assert.match(await run('task checklist add t-0001 不该挂在父上', 'error'), /有子任务的任务不挂清单/)
    assert.equal(readTaskFile('t-0001').record.checklist, undefined, '被拒后内部节点仍无 checklist')
    assert.deepEqual(readTaskFile('t-0001').record, beforeParentChecklist.record, '被拒后父任务记录零变化')

    // ---- OP-CK-03：有非空清单的叶子禁收子任务（拒绝，不删除清单）----
    await run(create({ projectId: project.id, parentId: 't-0003', title: '想挂到清单叶子下' }), 'error')
    leaf = getTask(domain, 't-0003')
    assert.equal(leaf.checklist.length, 2, 'addTask 被拒后清单一项不丢')
    assert.deepEqual(leaf.checklist.map(i => i.id), [keepItem.id, leaf.checklist[1].id])

    // move 路径（不带 renumber）
    await run('task move t-0002 t-0003') // dry-run 预览不应写
    assert.match(await run('task move t-0002 t-0003 confirm', 'error'), /清单/)
    assert.equal(getTask(domain, 't-0002').parentId, 't-0001', 'move 被拒后父子关系不变')
    assert.equal(getTask(domain, 't-0003').checklist.length, 2, 'move 被拒后清单不删')
    // move+--renumber 复合路径同样拒绝
    await run('task move t-0004 t-0003 --renumber confirm', 'error')
    assert.equal(getTask(domain, 't-0004').parentId, null, 'move+renumber 被拒后父子关系不变')
    assert.equal(getTask(domain, 't-0003').checklist.length, 2, 'move+renumber 被拒后清单不删')

    // 清空清单后叶子可正常收子任务（证明守卫是「拒绝」而非「永久禁止」）
    await removeTaskChecklistItem(domain, 't-0003', getTask(domain, 't-0003').checklist[1].id)
    await removeTaskChecklistItem(domain, 't-0003', keepItem.id)
    assert.equal(getTask(domain, 't-0003').checklist, undefined)
    await run(create({ projectId: project.id, parentId: 't-0003', title: '清空清单后可挂子任务' }))
    assert.equal(getTask(domain, 't-0005').parentId, 't-0003')
    // 此时 t-0003 成了内部节点，再挂清单必须被拒
    await run('task checklist add t-0003 再次挂清单', 'error')

    // ---- 上限 50 项 ----
    await run(create({ projectId: project.id, title: '上限探测叶子' })) // t-0006
    for (let i = 1; i <= 50; i += 1) {
      await addTaskChecklistItem(domain, 't-0006', `第 ${i} 项`)
    }
    assert.equal(getTask(domain, 't-0006').checklist.length, 50)
    await run('task checklist add t-0006 第 51 项', 'error')

    // ---- OP-Q-01：普通 task update 不得夹带/整段替换 checklist ----
    await run('task update t-0006 {"title":"改名","checklist":[]}', 'error')
    assert.equal(getTask(domain, 't-0006').checklist.length, 50, 'update 被拒后清单原样')

    // ---- OP-Q-04：写盘失败不半写 ----
    await run(create({ projectId: project.id, title: '失败注入叶子' })) // t-0007
    await addTaskChecklistItem(domain, 't-0007', '会失败的一项')
    // addTaskChecklistItem 返回整个落盘 Task（.id 是任务 id），需重新读取清单取新建项的真实 id
    const fiItem = getTask(domain, 't-0007').checklist.at(-1)
    const beforeFail = structuredClone(getTask(domain, 't-0007'))
    const table = domain.table('tasks')
    const originalPut = table.put
    table.put = async () => { throw new Error('验证用落盘失败') }
    try {
      await run(`task checklist toggle t-0007 ${fiItem.id} true`, 'error')
    } finally {
      table.put = originalPut
    }
    const afterFail = getTask(domain, 't-0007')
    assert.equal(afterFail.checklist[0].done, beforeFail.checklist[0].done, '落盘失败后 done 未被半写')
    assert.equal(afterFail.updatedAt, beforeFail.updatedAt, '落盘失败后 updatedAt 未被改写')
    assert.equal(afterFail.status, beforeFail.status, '落盘失败后 status 未被改写')
    assert.equal(afterFail.progress, beforeFail.progress, '落盘失败后 progress 未被改写')

    // ---- task get 渲染清单 ----
    const getOut = await run('task get t-0007')
    assert.match(getOut, /清单项：1 项（已勾 0）/)

    // ---- OP-Q-03：连续写串行无丢失（toggle + rename 交错）----
    // 同前：add 返回整 Task，逐项 add 后重新读取清单取最后一项真实 id
    await addTaskChecklistItem(domain, 't-0007', '序列项一')
    const seqLeaf = getTask(domain, 't-0007').checklist.at(-1)
    await addTaskChecklistItem(domain, 't-0007', '序列项二')
    const seqLeaf2 = getTask(domain, 't-0007').checklist.at(-1)
    await Promise.all([
      setTaskChecklistItemDone(domain, 't-0007', seqLeaf.id, true),
      renameTaskChecklistItem(domain, 't-0007', seqLeaf2.id, '序列项二（改名）'),
      setTaskChecklistItemDone(domain, 't-0007', seqLeaf2.id, true),
    ])
    const seq = getTask(domain, 't-0007').checklist
    assert.equal(seq.length, 3)
    assert.equal(seq.find(i => i.id === seqLeaf.id).done, true)
    const s2 = seq.find(i => i.id === seqLeaf2.id)
    assert.equal(s2.done, true)
    assert.equal(s2.text, '序列项二（改名）')

    // ---- OP-BD-01 专用：独立、稳定的 2 项清单叶子，供全新进程重启读回 ----
    // （t-0003 在上文已被清空并转为内部节点，跨进程持久化校验改由 t-0008 承担）
    await run(create({ projectId: project.id, title: '重启读回专用叶子' })) // t-0008
    await addTaskChecklistItem(domain, 't-0008', '重启读回项一')
    await addTaskChecklistItem(domain, 't-0008', '重启读回项二')
    await setTaskChecklistItemDone(
      domain, 't-0008', getTask(domain, 't-0008').checklist[0].id, true,
    )

    console.log('通过：schema 三键/旧记录兼容、add/rename/remove 单项、toggle 幂等、双向守卫、50 上限、失败不半写、连续写无丢失。')
    await facility.closeAll()
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8', env: process.env, timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
    console.log(`全部清单校验通过。临时数据保留于：${root}`)
  }
} finally {
  await facility.closeAll()
}

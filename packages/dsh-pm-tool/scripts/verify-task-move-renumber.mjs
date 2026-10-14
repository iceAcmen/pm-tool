/**
 * PROD-04：move + renumber 复合原子动作专项。独立系统临时目录，不污染正式数据。
 * 校验：--renumber 移动后 code 立即连续（非旧编号）；循环保护；失败整体回滚；
 *       新进程重开 domain 读回 parent/order/code 一致。
 */
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import { getTask, listTasks } from '../lib/core/tasks.js'
import { apply } from '../lib/index.js'

const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-moverenumber-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', {
  register(definition) { command = definition; return () => {} },
})

async function run(rawInput, expected = 'success') {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}
const add = value => `task add ${JSON.stringify(value)}`
const codes = pid => listTasks(facility.get('pmtool'), pid).map(t => t.code)

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  if (reopening) {
    // 新进程重开：按 id 读回上一轮落盘结果，校验 parent/order/code 一致。
    assert.equal(getTask(domain, 't-0001').parentId, null)
    assert.equal(getTask(domain, 't-0001').code, '1')
    assert.equal(getTask(domain, 't-0002').parentId, null)
    assert.equal(getTask(domain, 't-0002').code, '2')
    assert.equal(getTask(domain, 't-0003').parentId, 't-0001')
    assert.equal(getTask(domain, 't-0003').code, '2.1')
    assert.equal(getTask(domain, 't-0003').order, 1)
    console.log('通过：新进程重开 domain，读回 parent/order/code 与落盘一致。')
  } else {
    const project = await addProject(domain, { name: '移动重编号项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
    const pid = project.id

    // 树：t-0001 根一(1) / t-0003 子一(1.1)挂在 t-0001 下 / t-0002 根二(2)
    await run(add({ projectId: pid, title: '根一' }))
    await run(add({ projectId: pid, title: '根二' }))
    await run(add({ projectId: pid, parentId: 't-0001', title: '子一' }))
    assert.deepEqual(codes(pid), ['1', '1.1', '2'])

    // 1) 复合动作：把 子一(t-0003) 挂到 根二(t-0002) 下，移动后立即重编号。
    assert.match(await run('task move t-0003 t-0002 --renumber'), /当前未执行移动/) // 预览不落盘
    await run('task move t-0003 t-0002 --renumber confirm')
    assert.equal(getTask(domain, 't-0003').parentId, 't-0002')
    assert.equal(getTask(domain, 't-0003').code, '2.1', '复合动作后 code 应立即连续，而非旧 1.1')
    assert.deepEqual(codes(pid), ['1', '2', '2.1'])

    // 2) 旧 move 兼容：不带 --renumber，移动后保留旧编号。
    await run('task move t-0003 t-0001 confirm')
    assert.equal(getTask(domain, 't-0003').parentId, 't-0001')
    assert.equal(getTask(domain, 't-0003').code, '2.1', '旧 move 不重编号，保留移动时编号')

    // 3) 循环保护（复合动作）：把根一(t-0001)移到其子任务(t-0003)下 → 报错且状态不变。
    const snapshotBefore = listTasks(domain, pid).map(t => [t.id, t.code, t.parentId])
    const loopText = await run('task move t-0001 t-0003 --renumber confirm', 'error')
    // S1-G2 回归锁：领域错误（TaskMoveCycleError）仍应原样返回 error.message，不得被包装成通用/Aggregate 文案。
    assert.equal(loopText, '不能把任务移动到其子孙任务下', '领域错误应原样返回 message，不被命令层改写')
    assert.equal(getTask(domain, 't-0001').parentId, null)
    assert.deepEqual(
      listTasks(domain, pid).map(t => [t.id, t.code, t.parentId]),
      snapshotBefore,
      '循环拒绝后任务树应保持不变（无半套状态）',
    )

    // 4) 失败原子性：重编号阶段人为写失败 → 本项目任务整体回滚到移动前。
    const table = domain.table('tasks')
    const originalPut = table.put
    let writes = 0
    table.put = async (...args) => {
      writes += 1
      if (writes === 3) throw new Error('验证用复合写入失败')
      return originalPut.apply(table, args)
    }
    const beforeRollback = listTasks(domain, pid).map(t => [t.id, t.code, t.parentId, t.order])
    try {
      await run('task move t-0002 root --renumber confirm', 'error')
    } finally {
      table.put = originalPut
    }
    assert.deepEqual(
      listTasks(domain, pid).map(t => [t.id, t.code, t.parentId, t.order]),
      beforeRollback,
      '复合动作失败后本项目任务应整体回滚',
    )

    // 5) S1 故障注入（直连 core，断言错误形状）：
    //    A：重编号中途写失败、内层+外层回滚全部成功 → 抛原始错误（非 AggregateError）且干净回滚。
    //    B：重编号中途写失败 + 外层 before 快照回滚也失败 → AggregateError 聚合原始错在前、回滚错在后，不再空 catch 吞掉。
    const { moveTaskAndRenumber } = await import('../lib/core/tasks.js')
    const s1Project = await addProject(domain, { name: 'S1故障项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
    await run(add({ projectId: s1Project.id, title: 'S1根一' })) // t-0004
    await run(add({ projectId: s1Project.id, title: 'S1根二' })) // t-0005
    const s1Table = domain.table('tasks')
    const s1OriginalPut = s1Table.put
    let s1Puts = 0
    let s1OuterFault = false
    s1Table.put = async (...args) => {
      s1Puts += 1
      if (s1Puts === 3) throw new Error('注入：重编号中途写失败')
      if (s1OuterFault && s1Puts === 6) throw new Error('注入：外层快照回滚写失败')
      return s1OriginalPut.apply(s1Table, args)
    }
    try {
      // A：只有重编号失败，回滚全部成功 → 原始错误、不聚合、干净回滚
      const s1BeforeA = listTasks(domain, s1Project.id).map(t => [t.id, t.parentId, t.code])
      let caughtA
      try {
        await moveTaskAndRenumber(domain, 't-0005', 't-0004')
      } catch (e) { caughtA = e }
      assert.ok(caughtA, 'A 应抛出重编号错误')
      assert.ok(!(caughtA instanceof AggregateError), 'A 回滚全成功时应抛原始错误，不聚合')
      assert.match(String(caughtA.message), /重编号中途写失败/)
      assert.deepEqual(
        listTasks(domain, s1Project.id).map(t => [t.id, t.parentId, t.code]),
        s1BeforeA,
        'A 干净回滚后应与失败前快照逐字段一致',
      )

      // B：外层快照回滚也失败 → AggregateError（原始错在前、回滚错在后）
      s1Puts = 0
      s1OuterFault = true
      let caughtB
      try {
        await moveTaskAndRenumber(domain, 't-0005', 't-0004')
      } catch (e) { caughtB = e }
      assert.ok(caughtB instanceof AggregateError, 'B 回滚不完整必须聚合为 AggregateError，不得空 catch 静默吞掉')
      assert.equal(caughtB.errors[0].message, '注入：重编号中途写失败', 'B errors[0] 须为原始业务错误')
      assert.equal(caughtB.errors[1].message, '注入：外层快照回滚写失败', 'B errors[1] 须为外层回滚错误')
      assert.match(caughtB.message, /恢复失败/, 'B message 须含恢复失败语义')
      console.log('通过：S1 复合失败+回滚失败 AggregateError 聚合原始错与回滚错，不吞错。')
    } finally {
      s1Table.put = s1OriginalPut
    }

    // 6) S1-A2 拍平路径（Case C）：renumber put 失败 → 内层逆序回滚某 put 也失败（先产内层 AggregateError），
    //    随后外层 before 快照回滚另一 put 也失败。断言最终 errors 拍平为
    //    [最原始 putErr, innerRollbackErr, outerRollbackErr]，errors[0] 身份=原始错，且 before 两条均被尝试回滚。
    const s2Project = await addProject(domain, { name: 'S1拍平项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
    await run(add({ projectId: s2Project.id, title: 'S2根一' })) // t-0006
    await run(add({ projectId: s2Project.id, title: 'S2根二' })) // t-0007
    const s2Table = domain.table('tasks')
    const s2OriginalPut = s2Table.put
    let cPuts = 0
    const cAttempts = []
    let cPutErr, cInnerErr, cOuterErr
    s2Table.put = async (...args) => {
      cPuts += 1
      cAttempts.push(args[0])
      if (cPuts === 3) { cPutErr = new Error('C：原始重编号写失败'); throw cPutErr }
      if (cPuts === 4) { cInnerErr = new Error('C：内层逆序回滚写失败'); throw cInnerErr }
      if (cPuts === 6) { cOuterErr = new Error('C：外层快照回滚写失败'); throw cOuterErr }
      return s2OriginalPut.apply(s2Table, args)
    }
    let caughtC
    try {
      await moveTaskAndRenumber(domain, 't-0007', 't-0006')
    } catch (e) { caughtC = e } finally { s2Table.put = s2OriginalPut }
    assert.ok(caughtC instanceof AggregateError, 'C 最终须为 AggregateError')
    assert.equal(caughtC.errors[0], cPutErr, 'errors[0] 身份须为最原始业务写失败对象')
    assert.equal(caughtC.errors[1], cInnerErr, 'errors[1] 须为内层逆序回滚错')
    assert.equal(caughtC.errors[2], cOuterErr, 'errors[2] 须为外层快照回滚错')
    assert.ok(caughtC.errors.length >= 3, '可聚合更多回滚错，但前三定位须清晰')
    assert.match(caughtC.message, /恢复失败/, 'C message 须含恢复失败语义')
    assert.deepEqual(cAttempts.slice(-2), ['t-0006', 't-0007'], '外层 before 快照两条记录均应被尝试回滚')
    console.log('通过：S1-A2 内层 AggregateError 拍平后再聚合外层回滚错，errors 顺序与身份可定位。')

    // 7) S1-G2 命令级故障注入：走 handleTaskCommand（而非直连 core）触发 AggregateError，
    //    断言返回 kind=error 且 text 是安全中文多行摘要——顶层「移动并重新编号失败/恢复失败」、
    //    原始错误 message、各回滚错误 message；无堆栈帧、无 Error 类名泄漏、无对象 dump。
    const s3Project = await addProject(domain, { name: 'S1-G2命令级项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
    await run(add({ projectId: s3Project.id, title: 'G2根一' })) // t-0008
    await run(add({ projectId: s3Project.id, title: 'G2根二' })) // t-0009
    const s3Table = domain.table('tasks')
    const s3OriginalPut = s3Table.put
    let g2Puts = 0
    s3Table.put = async (...args) => {
      g2Puts += 1
      if (g2Puts === 3) throw new Error('G2：原始重编号写失败')
      if (g2Puts === 4) throw new Error('G2：内层逆序回滚写失败')
      if (g2Puts === 6) throw new Error('G2：外层快照回滚写失败')
      return s3OriginalPut.apply(s3Table, args)
    }
    let g2Text
    try {
      g2Text = await run('task move t-0009 t-0008 --renumber confirm', 'error')
    } finally {
      s3Table.put = s3OriginalPut
    }
    assert.ok(g2Text.includes('\n'), '命令层错误摘要须多行（可被 Notice 换行展示）')
    assert.match(g2Text, /移动并重新编号失败/, '摘要顶层须含「移动并重新编号失败」')
    assert.match(g2Text, /恢复失败/, '摘要须含「恢复失败」语义')
    assert.match(g2Text, /原始错误：G2：原始重编号写失败/, '摘要须点名最原始业务错误')
    assert.match(g2Text, /G2：内层逆序回滚写失败/, '摘要须列出内层回滚错误')
    assert.match(g2Text, /G2：外层快照回滚写失败/, '摘要须列外层快照回滚错误')
    assert.doesNotMatch(g2Text, /^\s+at\s/m, '摘要不得包含堆栈帧（at ...）')
    assert.doesNotMatch(g2Text, /\bAggregateError\b/, '摘要不得泄漏 Error 类名')
    assert.doesNotMatch(g2Text, /\{\s*errors\s*:/, '摘要不得 dump 错误对象')
    assert.ok(!g2Text.includes('任务操作失败，未返回成功结果'), 'AggregateError 不得再落到泛化操作失败文案')
    console.log('通过：S1-G2 命令层 AggregateError → 多行安全中文摘要，无堆栈/类名/对象泄漏。')

    console.log('通过：PROD-04 复合 move+renumber 原子性、循环保护、旧 move 兼容与失败回滚。')
    // 新进程重开读回，验证落盘持久性。
    await facility.closeAll()
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8', env: process.env, timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
  }
} finally {
  await facility.closeAll()
}

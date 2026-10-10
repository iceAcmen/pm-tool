/**
 * R12 专项验证：关键字检索 / 统计看板 / Markdown 任务表离线导入。
 * 使用独立临时目录，不污染真实业务数据；含全新子进程重启读回。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import { listTasks } from '../lib/core/tasks.js'
import { collectStats } from '../lib/core/stats.js'

delete process.env.DEEPSEEK_API_KEY
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-r12-'))
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

  if (reopening) {
    // 重启读回：导入的任务树仍在，编号连续，且新增继续递增。
    const tasks = listTasks(domain, 'p-0001')
    assert.equal(tasks.length, 6, '重启后应仍有 6 个任务（2 既有 + 4 导入）')
    const byCode = new Map(tasks.map(task => [task.code, task]))
    assert.ok(byCode.has('3'), '导入的根任务「总体方案」应为 WBS 3')
    assert.ok(byCode.has('3.1'), '子任务「调研竞品」应为 WBS 3.1')
    assert.equal(byCode.get('3.1').status, 'done', '[x] 导入的任务应为已完成')
    assert.equal(byCode.get('3.1').progress, 100)
    assert.ok(byCode.has('3.2'))
    assert.ok(byCode.has('4'), '导入的根任务「排期计划」应为 WBS 4')
    assert.equal(byCode.get('3.1').parentId, byCode.get('3').id)
    assert.match(await run('task list p-0001'), /3\.1｜t-0004｜调研竞品/)
    console.log('通过：全新进程读回导入任务树，父子关系、WBS 编号与 [x] 已完成状态正确。')
  } else {
    // 种子数据
    await run('project add {"name":"R12 验证项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
    await run('project add {"name":"另一个项目","startDate":"2026-01-01","targetDate":"2026-06-30"}')
    await run('task add {"projectId":"p-0001","title":"需求确认","dueDate":"2026-01-05","status":"done"}')
    await run('task add {"projectId":"p-0001","title":"原型设计","dueDate":"2026-01-20"}')
    await run('milestone add {"projectId":"p-0001","title":"立项评审","targetDate":"2026-01-10"}')
    await run('risk-issue add {"projectId":"p-0001","type":"risk","title":"进度风险","impact":"high","probability":"medium"}')

    // ---- 关键字检索 ----
    assert.match(await run('search 需求'), /需求确认/, '跨类检索应命中任务标题')
    assert.match(await run('search 需求'), /【任务】/)
    assert.match(await run('search R12'), /R12 验证项目/, '应命中项目名称')
    // 类型过滤：R12 只出现在项目名里，限定 task 应无结果，限定 project 应命中。
    assert.match(await run('search R12 --type task'), /未检索到/)
    assert.match(await run('search R12 --type project'), /R12 验证项目/)
    assert.match(await run('search 进度风险 --type risk'), /进度风险/)
    assert.match(await run('search 立项评审 --type milestone'), /立项评审/)
    assert.match(await run('search 不存在的词zzz'), /未检索到/)
    // 负例：缺关键字、非法类型（search 单独使用应返回帮助，不算错误）。
    assert.match(await run('search'), /关键字检索命令/)
    for (const input of ['search --type task', 'search x --type bogus']) {
      await run(input, 'error')
    }
    console.log('通过：检索跨类命中、--type 过滤、空关键字与非法类型负例。')

    // ---- 统计看板（用注入 today 保证逾期口径确定）----
    const all = collectStats(domain)
    assert.equal(all.scope, 'all')
    assert.equal(all.projectCount, 2)
    assert.equal(all.totals.taskTotal, 2)
    assert.equal(all.projectStatusCount.planning, 2)

    const one = collectStats(domain, 'p-0001', '2026-02-01')
    assert.equal(one.scope, 'project')
    const stat = one.projects[0]
    assert.equal(stat.taskTotal, 2)
    assert.equal(stat.taskDone, 1)
    assert.equal(stat.completionRate, 50)
    // 原型设计 dueDate 2026-01-20 < 2026-02-01 且未完成 → 逾期 1；需求确认已完成不计逾期。
    assert.equal(stat.overdueTasks, 1)
    assert.equal(stat.openRiskCount, 1)
    assert.equal(stat.openRiskByImpact.high, 1)
    assert.equal(stat.milestoneTotal, 1)

    assert.match(await run('stats'), /全项目统计看板/)
    assert.match(await run('stats p-0001'), /项目统计：R12 验证项目/)
    assert.match(await run('stats p-0001'), /⚠ 已逾期未完成任务 1 个/)
    for (const input of ['stats p-9999', 'stats p-0001 extra']) {
      await run(input, 'error')
    }
    console.log('通过：统计全量/单项目口径、完成率、逾期与未关闭风险按严重度聚合。')

    // ---- Markdown 任务表导入 ----
    const checklist = [
      '- [ ] 总体方案',
      '  - [x] 调研竞品',
      '  - [ ] 输出文档',
      '- [ ] 排期计划',
      '',
      '这一行不是清单项，应被忽略。',
    ].join('\n')
    const file = join(root, 'checklist.md')
    writeFileSync(file, checklist, 'utf8')

    const before = domain.table('tasks').size
    assert.equal(before, 2)
    // dry-run：不写盘，只预览。
    assert.match(await run(`task import p-0001 ${file}`), /将为项目 p-0001 创建 4 个任务/)
    assert.match(await run(`task import p-0001 ${file}`), /当前未写入/)
    // dry-run 的投影编号基于清单自身（1、1.1…），与既有任务无关。
    assert.match(await run(`task import p-0001 ${file}`), /1\.1｜\[x\] 调研竞品/)
    assert.equal(domain.table('tasks').size, before, 'dry-run 不得写盘')
    // confirm：真正导入。
    assert.match(await run(`task import p-0001 ${file} confirm`), /已导入 4 个任务到项目 p-0001/)
    assert.equal(domain.table('tasks').size, 6)
    // 既有两个根任务已占用 WBS 1、2，导入的新根应为 3、4，其子任务为 3.1、3.2。
    const after = listTasks(domain, 'p-0001')
    const codeOf = new Map(after.map(task => [task.code, task]))
    assert.ok(codeOf.has('3') && codeOf.has('3.1') && codeOf.has('3.2') && codeOf.has('4'))
    assert.equal(codeOf.get('3.1').status, 'done')
    assert.equal(codeOf.get('3.1').parentId, codeOf.get('3').id)

    // 负例
    const emptyFile = join(root, 'empty.md')
    writeFileSync(emptyFile, '# 没有勾选框\n普通文字\n', 'utf8')
    await run(`task import p-0001 ${emptyFile} confirm`, 'error')
    await run(`task import p-9999 ${file} confirm`, 'error')
    await run(`task import p-0001 /no/such/file.md confirm`, 'error')
    await run('task import p-0001', 'error')
    console.log('通过：导入 dry-run 不写盘、confirm 落盘、缩进→WBS、[x] 已完成，及空清单/坏项目/坏路径负例。')

    await facility.closeAll()
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8',
      env: process.env,
      timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
    console.log(`全部 R12 校验通过。临时数据保留于：${root}`)
  }
} finally {
  await facility.closeAll()
}

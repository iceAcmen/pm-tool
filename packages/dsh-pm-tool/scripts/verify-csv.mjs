/**
 * T2-C 纯 JS CSV 导入专项：CSV 解析为父子树、dry-run 不落盘、confirm 落盘层级/字段正确、
 * 坏表头/坏文件中文报错、重启读回。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-csv-'))
const csvFile = join(root, 'tasks.csv')

const CSV = [
  '层级,标题,负责人,优先级,开始,截止,进度',
  '1,需求梳理,,,2026-01-01,2026-01-10,100',
  '2,需求访谈,张三,,2026-01-01,2026-01-05,100',
  '1,视觉设计,李四,P1,,2026-01-20,0',
].join('\n')

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })

async function run(raw) {
  const r = await command.handler({ rawInput: raw, attachments: [] })
  return r
}

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  if (reopening) {
    const tasks = [...domain.table('tasks').entries()].map(([, t]) => t)
    assert.equal(tasks.length, 3, '读回应为 3 个任务')
    const rootTask = tasks.find(t => !t.parentId)
    const child = tasks.find(t => t.parentId === rootTask.id)
    assert.equal(rootTask.title, '需求梳理')
    assert.equal(child.title, '需求访谈')
    assert.equal(child.assignee, '张三')
    assert.equal(rootTask.progress, 100)
    console.log('通过：CSV 导入重启读回，父子树与字段正确。')
    process.exit(0)
  }

  writeFileSync(csvFile, CSV, 'utf8')
  await run('project add {"name":"CSV 测试项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')

  // 坏表头报错
  await run('project add {"name":"坏表头","startDate":"2026-01-01","targetDate":"2026-12-31"}')
  const bad = join(root, 'bad.csv')
  writeFileSync(bad, 'foo,bar\n1,x\n', 'utf8')
  const badRes = await run(`task import p-0002 ${bad}`)
  assert.equal(badRes.kind, 'error', '缺「标题」表头应报错')

  // dry-run 不落盘
  const before = [...domain.table('tasks').entries()].length
  const dry = await run(`task import p-0001 ${csvFile}`)
  assert.match(dry.text, /已解析 CSV/)
  assert.equal([...domain.table('tasks').entries()].length, before, 'dry-run 不得落盘')

  // confirm 落盘
  await run(`task import p-0001 ${csvFile} confirm`)
  const tasks = [...domain.table('tasks').entries()].map(([, t]) => t)
  assert.equal(tasks.length, 3)
  const rootTask = tasks.find(t => !t.parentId)
  assert.ok(rootTask && rootTask.title === '需求梳理')

  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], { stdio: 'inherit' })
  assert.equal(child.status, 0, '重启读回应通过')
  console.log('verify-csv 全部通过。')
} finally {
  await facility.closeAll()
}

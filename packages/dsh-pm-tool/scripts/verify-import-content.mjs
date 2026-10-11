/**
 * OPT-12：按文件内容导入专项（区别于服务端路径）。
 *  - csv 内容：JSON 编码的 CSV 原文
 *  - xlsx 内容：JSON 编码的 base64（仍在 node 侧 SheetJS 解析）
 * 断言：dry-run 不落盘、confirm 父子树/字段、坏内容报错、重启读回。
 */
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import * as XLSX from 'xlsx'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-import-content-'))

const csvText = [
  '层级,标题,负责人,优先级,截止',
  '1,需求梳理,,,2026-01-10',
  '2,需求访谈,张三,,',
  '1,视觉设计,李四,P1,2026-01-20',
].join('\n')

// xlsx 内容（base64，JSON 编码）。
const rows = [
  ['层级', '标题', '负责人', '优先级', '截止'],
  [1, '接口设计', '王五', '', '2026-02-01'],
]
const ws = XLSX.utils.aoa_to_sheet(rows)
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'tasks')
const xlsxBase64 = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })).toString('base64')

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })
const run = async (raw) => command.handler({ rawInput: raw, attachments: [] })

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  await run('project add {"name":"内容导入测试","startDate":"2026-01-01","targetDate":"2026-12-31"}')

  if (reopening) {
    const tasks = [...domain.table('tasks').entries()].map(([, t]) => t)
    assert.ok(tasks.length >= 4, `应含 csv 3 条 + xlsx 1 条，实际 ${tasks.length}`)
    assert.ok(tasks.some(t => t.title === '需求梳理' && !t.parentId))
    assert.ok(tasks.some(t => t.title === '需求访谈' && t.assignee === '张三'))
    assert.ok(tasks.some(t => t.title === '接口设计'))
    console.log('通过：OPT-12 内容导入重启读回，父子树与字段正确。')
    process.exit(0)
  }

  // 坏内容报错（非 JSON）。
  const bad = await run('task import-content p-0001 sheet.csv not-json')
  assert.equal(bad.kind, 'error', '非法 CSV 内容应报错')

  // 不支持扩展名报错。
  const ext = await run(`task import-content p-0001 sheet.txt ${JSON.stringify('a,b')}`)
  assert.equal(ext.kind, 'error')

  // csv dry-run 不落盘。
  const before = [...domain.table('tasks').entries()].length
  const dryCsv = await run(`task import-content p-0001 sheet.csv ${JSON.stringify(csvText)}`)
  assert.match(dryCsv.text, /将为项目 p-0001 创建 3 个任务/)
  assert.equal([...domain.table('tasks').entries()].length, before, 'dry-run 不得落盘')

  // csv confirm 落盘。
  await run(`task import-content p-0001 sheet.csv ${JSON.stringify(csvText)} confirm`)

  // xlsx(base64) confirm 落盘。
  await run(`task import-content p-0001 tasks.xlsx ${JSON.stringify(xlsxBase64)} confirm`)

  const tasks = [...domain.table('tasks').entries()].map(([, t]) => t)
  assert.equal(tasks.length, 4, `csv3+xlsx1=4，实际 ${tasks.length}`)

  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], { stdio: 'inherit' })
  assert.equal(child.status, 0)
  console.log('verify-import-content 全部通过。')
} finally {
  await facility.closeAll()
}

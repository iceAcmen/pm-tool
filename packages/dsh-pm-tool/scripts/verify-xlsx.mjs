/**
 * T2-C XLSX 导入专项：用 SheetJS 生成临时 .xlsx fixture → 导入断言父子树/字段、
 * dry-run 不落盘、confirm 落盘、重启读回、坏文件报错。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
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
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-xlsx-'))
const xlsxFile = join(root, 'tasks.xlsx')

const rows = [
  ['层级', '标题', '负责人', '优先级', '开始', '截止', '进度'],
  [1, '需求梳理', '', '', '2026-01-01', '2026-01-10', 100],
  [2, '需求访谈', '张三', '', '2026-01-01', '2026-01-05', 100],
  [1, '视觉设计', '李四', 'P1', '', '2026-01-20', 0],
]

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })

async function run(raw) {
  return command.handler({ rawInput: raw, attachments: [] })
}

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  if (reopening) {
    const tasks = [...domain.table('tasks').entries()].map(([, t]) => t)
    assert.equal(tasks.length, 3)
    const rootTask = tasks.find(t => !t.parentId)
    const child = tasks.find(t => t.parentId === rootTask.id)
    assert.equal(rootTask.title, '需求梳理')
    assert.equal(child.title, '需求访谈')
    assert.equal(child.assignee, '张三')
    console.log('通过：XLSX 导入重启读回，父子树与字段正确。')
    process.exit(0)
  }

  // 生成 xlsx fixture
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'tasks')
  XLSX.writeFile(wb, xlsxFile)

  await run('project add {"name":"XLSX 测试","startDate":"2026-01-01","targetDate":"2026-12-31"}')

  // 坏文件报错
  const bad = join(root, 'bad.xlsx')
  writeFileSync(bad, 'not a real xlsx')
  const badRes = await run(`task import p-0001 ${bad}`)
  assert.equal(badRes.kind, 'error', '损坏 xlsx 应报错')

  // dry-run 不落盘
  const before = [...domain.table('tasks').entries()].length
  const dry = await run(`task import p-0001 ${xlsxFile}`)
  assert.match(dry.text, /已解析 XLSX/)
  assert.equal([...domain.table('tasks').entries()].length, before, 'dry-run 不得落盘')

  // confirm 落盘
  await run(`task import p-0001 ${xlsxFile} confirm`)
  const tasks = [...domain.table('tasks').entries()].map(([, t]) => t)
  assert.equal(tasks.length, 3)

  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], { stdio: 'inherit' })
  assert.equal(child.status, 0)
  console.log('verify-xlsx 全部通过。')
} finally {
  await facility.closeAll()
}

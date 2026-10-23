import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { afterEach, expect, it } from 'vitest'
import { handleTaskCommand } from './task.js'
import { addProject } from '../core/projects.js'
import { listTasks } from '../core/tasks.js'
import { openPmDomain } from '../core/storage.js'

const facilities: DomainFacility[] = []
const csv = '层级,标题,负责人,优先级,开始,截止,进度\n'
  + '1,"QA  连续空白\t原样 ""引号"" \\n confirm",测试甲,P1,2026-10-22,2026-11-01,0\n'
  + '2,QA子,测试乙,P2,2026-10-22,2026-10-30,10'
const encoded = JSON.stringify(csv)

function disk(root: string): Record<string, string> {
  const files: Record<string, string> = {}
  function walk(dir: string, prefix = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name), `${prefix}${entry.name}/`)
      else if (entry.isFile()) files[`${prefix}${entry.name}`] = createHash('sha256')
        .update(readFileSync(join(dir, entry.name))).digest('hex')
    }
  }
  walk(root)
  return files
}

async function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'a13-handler-json-'))
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(root))
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  ctx.provide('storageDomain', facility)
  facilities.push(facility)
  const domain = await openPmDomain(ctx)
  const project = await addProject(domain, {
    name: 'A13解析', startDate: '2026-10-21', targetDate: '2026-12-31',
  })
  return { root, domain, project, command: (suffix: string) =>
    handleTaskCommand(`import-content ${project.id} ${suffix}`, domain) }
}

afterEach(async () => {
  for (const facility of facilities.splice(0)) await facility.closeAll()
})

it.each([
  JSON.stringify('QA 原生"引号\'\\反斜杠.CSV'),
  '"QA \\u539f\\u751f\\t\\"引号\\"\\\\导入.csv"',
  'qa.csv',
])('A13 严格JSON文件名/旧ASCII %s，preview零写，内容空白和字面转义不双解码', async filename => {
  const f = await fixture()
  const before = disk(f.root)
  const preview = await f.command(`${filename} ${encoded}`)
  expect(preview.kind, preview.text).toBe('success')
  expect(preview.text).toContain(`已解析上传文件 ${filename.startsWith('"') ? JSON.parse(filename) : filename}：`)
  expect(disk(f.root)).toEqual(before)
  const confirmed = await f.command(`${filename} ${encoded} confirm`)
  expect(confirmed.kind, confirmed.text).toBe('success')
  const tasks = listTasks(f.domain, f.project.id)
  expect(tasks).toHaveLength(2)
  expect(tasks[0].title).toBe('QA  连续空白\t原样 "引号" \\n confirm')
  expect(tasks[1].parentId).toBe(tasks[0].id)
})

it.each([
  ['未闭合filename', `"QA 原生.csv ${encoded} confirm`],
  ['filename非法escape', `"QA\\q.csv" ${encoded} confirm`],
  ['filename非法unicode', `"QA\\u123Z.csv" ${encoded} confirm`],
  ['filename原生换行', `"QA\n原生.csv" ${encoded} confirm`],
  ['filename非字符串', `42 ${encoded} confirm`],
  ['旧裸中文须JSONquote', `原生.csv ${encoded} confirm`],
  ['单引号不是JSONquote', `'QA 原生.csv' ${encoded} confirm`],
  ['content未闭合', '"QA 原生.csv" "层级,标题 confirm'],
  ['content非法escape', '"QA 原生.csv" "\\q" confirm'],
  ['content非法unicode', '"QA 原生.csv" "\\u12XZ" confirm'],
  ['content原生tab', '"QA 原生.csv" "层级\t标题" confirm'],
  ['content对象', '"QA 原生.csv" {} confirm'],
  ['content数组', '"QA 原生.csv" [] confirm'],
  ['content数字', '"QA 原生.csv" 42 confirm'],
  ['content null', '"QA 原生.csv" null confirm'],
  ['额外尾部', `"QA 原生.csv" ${encoded} confirm extra`],
  ['重复confirm', `"QA 原生.csv" ${encoded} confirm confirm`],
  ['confirm前多余参数', `"QA 原生.csv" ${encoded} extra confirm`],
  ['JSON字符串尾部', `"QA 原生.csv" ${encoded} "confirm"`],
  ['JSON相邻无分隔', `"QA 原生.csv"${encoded} confirm`],
  ['旧ASCII额外尾部', `qa.csv ${encoded} confirm extra`],
])('A13 %s：中文拒绝，原命令重复零write', async (_label, suffix) => {
  const f = await fixture()
  const before = disk(f.root)
  for (let retry = 0; retry < 2; retry++) {
    const result = await f.command(suffix)
    expect(result.kind, result.text).toBe('error')
    expect(result.text).toMatch(/[使用内容文件导入类型]/)
    expect(listTasks(f.domain, f.project.id)).toEqual([])
    expect(disk(f.root)).toEqual(before)
  }
})

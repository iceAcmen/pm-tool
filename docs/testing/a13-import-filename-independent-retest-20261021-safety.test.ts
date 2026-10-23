import { appendFileSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { parseCommand } from '@deepseek-ai/dsh-commands'
import { afterEach, expect, it, vi } from 'vitest'
import ts from 'typescript'
import { apply as applyHost } from '../../packages/dsh-pm-tool/src/index.js'
import { openPmDomain } from '../../packages/dsh-pm-tool/src/core/storage.js'
import { listTasks } from '../../packages/dsh-pm-tool/src/core/tasks.js'

const facilities: DomainFacility[] = []
const title = 'QA  中间空白\t"双引号" \'单引号\' \\n \\t \\u4e2d \\\\ confirm'
const csv = '层级,标题,负责人,优先级,开始,截止,进度\n'
  + `1,"${title.replaceAll('"', '""')}",测试甲,P1,2026-10-22,2026-11-01,0\n`
  + '2,子任务,测试乙,P2,2026-10-22,2026-10-30,10'
const encoded = JSON.stringify(csv)
const sha = (value: Buffer | string) => createHash('sha256').update(value).digest('hex')
const record = (data: unknown) => appendFileSync(process.env.A13_OBSERVATIONS!,
  `${JSON.stringify({ id: 'independent-safety', at: new Date().toISOString(), data })}\n`)

function disk(root: string): Record<string, string> {
  const files: Record<string, string> = {}
  function walk(dir: string, prefix = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name), `${prefix}${entry.name}/`)
      else if (entry.isFile()) files[`${prefix}${entry.name}`] = sha(readFileSync(join(dir, entry.name)))
    }
  }
  walk(root)
  return files
}
async function open(root: string) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(root))
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  ctx.provide('storageDomain', facility)
  facilities.push(facility)
  return { facility, domain: await openPmDomain(ctx) }
}
async function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'a13-independent-safety-'))
  const storage = await open(root)
  let descriptor: any
  await applyHost({
    storageDomain: { open: async () => storage.domain },
    effect: (fn: () => unknown) => fn(), reflect: { get: () => undefined },
    commands: { register: (value: unknown) => { descriptor = value } },
    webServer: undefined, connection: undefined,
  } as any)
  const command = async (line: string) => {
    const full = `/pm ${line}`
    const parsed = parseCommand(full)
    expect(parsed?.name).toBe('pm')
    expect(parsed?.rawInput).toBe(full.slice(3))
    const result = await descriptor.handler({ rawInput: parsed!.rawInput })
    record({ root, full, rawInput: parsed!.rawInput, result, disk: disk(root) })
    return result
  }
  const add = await command('project add {"name":"独立解析复验","startDate":"2026-10-21","targetDate":"2026-12-31"}')
  expect(add.kind, add.text).toBe('success')
  const project = [...storage.domain.table('projects').entries()][0][1]
  return { ...storage, root, project, command,
    import: (suffix: string) => command(`task import-content ${project.id} ${suffix}`) }
}
afterEach(async () => {
  for (const facility of facilities.splice(0)) await facility.closeAll()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it.each([
  ['文件名confirm字面', JSON.stringify('QA confirm "引号" \'单引号\' \\n.csv'), encoded],
  ['严格Unicode转义文件名', '"QA \\u539f\\u751f\\t\\"引号\\"\\\\导入.CSV"', encoded],
  ['内容Unicode转义只解一次', JSON.stringify('QA confirm.csv'),
    encoded.replaceAll('QA', '\\u0051\\u0041').replaceAll('中', '\\u4e2d')],
  ['旧ASCII原入口', 'confirm.csv', encoded],
])('SAFETY-PRESERVE %s：preview不把字面confirm当提交，原样字段/重开', async (_label, filename, content) => {
  const f = await fixture()
  const before = disk(f.root)
  const line = `${filename} ${content}`
  const preview = await f.import(line)
  expect(preview.kind, preview.text).toBe('success')
  expect(preview.text).toContain(`已解析上传文件 ${filename.startsWith('"') ? JSON.parse(filename) : filename}：`)
  expect(preview.text).toContain(title)
  expect(disk(f.root)).toEqual(before)
  const evalSpy = vi.spyOn(globalThis, 'eval').mockImplementation(() => { throw new Error('不得eval输入') })
  const confirmed = await f.import(`${line} CoNfIrM`)
  expect(confirmed.kind, confirmed.text).toBe('success')
  expect(evalSpy).not.toHaveBeenCalled()
  const tasks = listTasks(f.domain, f.project.id)
  expect(tasks).toHaveLength(2)
  expect(tasks[0].title).toBe(title)
  expect(tasks[1].parentId).toBe(tasks[0].id)
  const saved = disk(f.root)
  await f.facility.closeAll()
  const reopened = await open(f.root)
  expect(listTasks(reopened.domain, f.project.id)).toEqual(tasks)
  expect(disk(f.root)).toEqual(saved)
  record({ label: _label, filename, expectedTitle: title, tasks, reopened: true })
})

const bad = [
  ['多尾部', `"QA confirm.csv" ${encoded} confirm extra`],
  ['重复confirm', `"QA confirm.csv" ${encoded} confirm confirm`],
  ['带引号confirm尾', `"QA confirm.csv" ${encoded} "confirm"`],
  ['尾部分号', `"QA confirm.csv" ${encoded} confirm;`],
  ['尾部JS表达式', `"QA confirm.csv" ${encoded} confirm; globalThis.A13_EXECUTED = true`],
  ['内容JS表达式', '"QA.csv" (globalThis.A13_EXECUTED = true) confirm'],
  ['内容JS模板', '"QA.csv" `层级,标题\\n1,任务` confirm'],
  ['文件名JS表达式', `(globalThis.A13_EXECUTED = true) ${encoded} confirm`],
  ['文件名非法escape', `"QA\\q.csv" ${encoded} confirm`],
  ['文件名非法Unicode', `"QA\\u00XY.csv" ${encoded} confirm`],
  ['文件名原生Tab', `"QA\t.csv" ${encoded} confirm`],
  ['文件名少闭合', `"QA.csv ${encoded} confirm`],
  ['文件名JSON对象', `{"name":"qa.csv"} ${encoded} confirm`],
  ['文件名JSON数组', `["qa.csv"] ${encoded} confirm`],
  ['内容非法escape', '"QA.csv" "\\x41" confirm'],
  ['内容非法Unicode', '"QA.csv" "\\uXYZ1" confirm'],
  ['内容原生换行', '"QA.csv" "层级,标题\n1,任务" confirm'],
  ['内容少闭合', '"QA.csv" "层级,标题 confirm'],
  ['内容JSON对象', '"QA.csv" {} confirm'],
  ['内容JSON数组', '"QA.csv" [] confirm'],
  ['内容JSON布尔', '"QA.csv" true confirm'],
  ['内容JSONnull', '"QA.csv" null confirm'],
  ['内容数字', '"QA.csv" 42 confirm'],
  ['参数间无分隔', `"QA.csv"${encoded} confirm`],
  ['内容后无分隔', `"QA.csv" ${encoded}confirm`],
  ['旧ASCII坏尾', `qa.csv ${encoded} extra confirm`],
]
it.each(bad)('SAFETY-REJECT %s：实际handler重复拒绝，全部JSON零写不eval', async (_label, suffix) => {
  const f = await fixture()
  const before = disk(f.root)
  vi.stubGlobal('A13_EXECUTED', false)
  const evalSpy = vi.spyOn(globalThis, 'eval').mockImplementation(() => { throw new Error('不得eval输入') })
  for (let retry = 0; retry < 2; retry++) {
    const result = await f.import(suffix)
    expect(result.kind, result.text).toBe('error')
    expect(result.text).toMatch(/[\u4e00-\u9fff]/)
    expect(listTasks(f.domain, f.project.id)).toEqual([])
    expect(disk(f.root)).toEqual(before)
  }
  expect((globalThis as any).A13_EXECUTED).toBe(false)
  expect(evalSpy).not.toHaveBeenCalled()
  await f.facility.closeAll()
  const reopened = await open(f.root)
  expect(listTasks(reopened.domain, f.project.id)).toEqual([])
  expect(disk(f.root)).toEqual(before)
})

it.each(['csv', 'xlsx'])('SAFETY-SCHEMA %s：原非法后行JSON名/旧ASCII同级拒绝', async format => {
  const f = await fixture()
  const bytes = readFileSync(join(process.env.A13_NATIVE_ROOT!, `QA 非法日期.${format}`))
  const content = JSON.stringify(bytes.toString(format === 'csv' ? 'utf8' : 'base64'))
  const before = disk(f.root)
  for (const filename of [JSON.stringify(`QA confirm "引号"\\文件.${format}`), `qa.${format}`]) {
    const line = `${filename} ${content}`
    for (const suffix of [line, `${line} confirm`, `${line} confirm`]) {
      const result = await f.import(suffix)
      expect(result.kind).toBe('error')
      expect(result.text).toMatch(/第 3 行.*dueDate/)
      expect(disk(f.root)).toEqual(before)
      expect(listTasks(f.domain, f.project.id)).toEqual([])
    }
  }
  await f.facility.closeAll()
  await open(f.root)
  expect(disk(f.root)).toEqual(before)
})

it('SAFETY-AST 生产import-content接缝无eval/Function/空白splitjoin，客户端仅两模板', () => {
  const commandFile = join(process.cwd(), 'packages/dsh-pm-tool/src/commands/task.ts')
  const source = readFileSync(commandFile, 'utf8')
  const ast = ts.createSourceFile(commandFile, source, ts.ScriptTarget.Latest, true)
  const branches: ts.IfStatement[] = []
  function find(node: ts.Node) {
    if (ts.isIfStatement(node) && ts.isBinaryExpression(node.expression)
      && ts.isIdentifier(node.expression.left) && node.expression.left.text === 'action'
      && ts.isStringLiteral(node.expression.right) && node.expression.right.text === 'import-content') branches.push(node)
    ts.forEachChild(node, find)
  }
  find(ast)
  expect(branches).toHaveLength(1)
  const forbidden: string[] = []
  function inspect(node: ts.Node) {
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const expression = node.expression
      if (ts.isIdentifier(expression) && ['eval', 'Function', 'decodeURI', 'decodeURIComponent'].includes(expression.text)) {
        forbidden.push(node.getText(ast))
      }
      if (ts.isPropertyAccessExpression(expression)) {
        const method = expression.name.text
        // 输出行数组拼为提示文本不接触输入；仅豁免这个明确的 AST 形态。
        const outputLines = method === 'join' && ts.isArrayLiteralExpression(expression.expression)
        if (['eval', 'Function', 'split', 'join', 'decodeURI', 'decodeURIComponent'].includes(method) && !outputLines) {
          forbidden.push(node.getText(ast))
        }
      }
    }
    ts.forEachChild(node, inspect)
  }
  inspect(branches[0].thenStatement)
  expect(forbidden).toEqual([])
  const client = readFileSync(join(process.cwd(), 'packages/dsh-pm-tool/src/client/views/tasks.tsx'), 'utf8')
  const templates = client.split('\n').filter(line => line.includes('`task import-content'))
  expect(templates).toHaveLength(2)
  expect(templates.every(line => line.includes('${JSON.stringify(file.name)}'))).toBe(true)
  record({ sourceSha256: sha(source), templateLines: templates, forbidden, staticOnly: true })
})

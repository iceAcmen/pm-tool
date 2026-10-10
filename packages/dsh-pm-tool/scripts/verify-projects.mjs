/**
 * 项目增查确定性验证（macOS + nvm Node v22.23.3 + pnpm 11.28.5）。
 * 在包目录执行 pnpm run build && node scripts/verify-projects.mjs。
 * 真实插件 + Cordis + JSON 后端；只替代命令注册入口，不启动模型。
 * 每次新建系统临时目录，不写真实业务项目；保留路径供人工查看，不删除文件。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility, defineDomain } from '@deepseek-ai/dsh-storage-domain'
import { pmDomainSpec } from '../lib/core/storage.js'
import { projectRecordSchema } from '../lib/core/project.js'
import { addProject, getProject, listProjects } from '../lib/core/projects.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-projects-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', {
  register(definition) {
    assert.equal(command, undefined, '只能注册一条 /pm 命令')
    command = definition
    return () => {}
  },
})
async function run(rawInput, expected = 'success') {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}

const fields = {
  name: 'PM Alpha 上线计划',
  description: '保留大小写、空格和 "引号"\n第二行',
  owner: 'Ice',
  status: 'active',
  startDate: '2026-10-10',
  targetDate: '2026-10-31',
  tags: ['MVP', '客户 A'],
}
const create = (value) => `project add ${JSON.stringify(value)}`
const readProject = id => JSON.parse(readFileSync(join(root, 'pmtool', 'projects', `${id}.json`), 'utf8'))

try {
  if (!reopening) {
    // 先用旧声明写第 0 步记录，再验证扩展表后能完整读回旧记录。
    const legacy = await facility.open(defineDomain({
      name: 'pmtool', version: 1, layout: 'per-record',
      tables: { checks: pmDomainSpec.tables.checks },
    }))
    await legacy.table('checks').put('legacy', { ok: true, at: 'legacy', note: '兼容旧自检记录' })
    await legacy.close()
  }
  await apply(ctx)
  assert.equal(command.name, 'pm')
  const domain = facility.get('pmtool')
  assert.ok(domain)
  assert.equal(domain.table('checks').get('legacy').note, '兼容旧自检记录')

  if (reopening) {
    assert.equal(listProjects(domain).length, Number(process.argv[4]))
    assert.deepEqual(getProject(domain, 'p-0001'), readProject('p-0001').record)
    assert.match(await run('project get p-0001'), /PM Alpha 上线计划/)
    assert.match(await run(create(fields)), /项目 ID：p-0014/)
    assert.equal(listProjects(domain).length, 14)
    console.log('通过：全新进程读回全部项目，新增编号继续递增。')
  } else {
    assert.match(await run('project list'), /暂无项目/)
    assert.match(await run('project'), /project add/)
    assert.match(await run('ping'), /pong：/)
    assert.match(await run('selftest'), /存储自检通过/)
    assert.match(await run(create(fields)), /项目 ID：p-0001/)
    const saved = readProject('p-0001')
    assert.equal(saved.version, 1)
    const record = projectRecordSchema.parse(saved.record)
    assert.deepEqual(record, { ...fields, id: 'p-0001', createdAt: record.createdAt, updatedAt: record.createdAt })
    assert.match(readFileSync(join(root, 'pmtool', 'projects', 'p-0001.json'), 'utf8'), /\n  "version": 1,/)
    console.log(await run('project get p-0001'))
    assert.match(await run('PROJECT GET p-0001'), /Ice/)
    assert.match(await run('project list'), /共 1 个/)

    // 每个失败输入都须保持已有文件不变，且不产生新项目。
    const before = readFileSync(join(root, 'pmtool', 'projects', 'p-0001.json'), 'utf8')
    const invalidInputs = [
      'project add', 'project add {', 'project add null', 'project add []',
      create({ ...fields, name: '  ' }),
      create({ ...fields, startDate: '2026-02-30' }),
      create({ ...fields, targetDate: '2026-2-01' }),
      create({ ...fields, status: 'UNKNOWN' }),
      create({ ...fields, owner: 123 }),
      create({ ...fields, tags: 'MVP' }),
      create({ ...fields, id: 'p-0001' }),
      create({ ...fields, id: '../escape' }),
      create({ ...fields, createdAt: '2026-10-10' }),
      create({ ...fields, extra: true }),
      create({ name: '缺少日期' }),
      'project get', 'project get ../escape', 'project get p-9999',
      'project get p-0001 extra', 'project list extra', 'project remove p-0001', 'unknown',
    ]
    for (const input of invalidInputs) await run(input, 'error')
    assert.equal(domain.table('projects').size, 1)
    assert.deepEqual(readdirSync(join(root, 'pmtool', 'projects')), ['p-0001.json'])
    assert.equal(readFileSync(join(root, 'pmtool', 'projects', 'p-0001.json'), 'utf8'), before)

    await run(create({ name: '默认字段', startDate: '2024-02-29', targetDate: '2024-03-01' }))
    assert.equal(readProject('p-0002').record.status, 'planning')
    assert.equal(readProject('p-0002').record.owner, '')
    assert.equal(readProject('p-0002').record.description, '')
    // 模拟两个会话同时新增：每条命令都走真实业务队列和后端。
    await Promise.all(Array.from({ length: 10 }, () => run(create(fields))))
    assert.equal(domain.table('projects').size, 12)
    assert.equal(readFileSync(join(root, 'pmtool', 'projects', 'p-0001.json'), 'utf8'), before)
    for (const [id, value] of domain.table('projects').entries()) {
      assert.deepEqual(readProject(id).record, value)
    }

    // 返回值不得允许调用方偷偷修改持久状态。
    getProject(domain, 'p-0001').name = '不能写入'
    listProjects(domain)[0].tags.push('不能写入')
    assert.deepEqual(getProject(domain, 'p-0001'), record)

    // 注入一次写盘拒绝，验证命令返回失败、新增队列可恢复。
    const table = domain.table('projects')
    const originalPut = table.put
    table.put = async () => { throw new Error('验证用写入失败') }
    try {
      await run(create(fields), 'error')
      assert.equal(table.size, 12)
    } finally {
      table.put = originalPut
    }
    const added = await addProject(domain, fields)
    assert.equal(added.id, 'p-0013')
    added.tags.push('副本修改')
    assert.deepEqual(getProject(domain, 'p-0013').tags, fields.tags)

    for (const directory of [root, join(root, 'pmtool'), join(root, 'pmtool', 'projects')]) {
      assert.equal(statSync(directory).mode & 0o777, 0o700)
    }
    console.log('通过：项目增查、中文输出、字段校验、默认值、旧表兼容、并发新增不覆盖、写入失败恢复、可读 JSON、0700 权限。')
    await facility.closeAll()
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root, '13'], {
      encoding: 'utf8', env: process.env, timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
    console.log(`全部项目校验通过。临时数据保留于：${root}`)
  }
} finally {
  await facility.closeAll()
}

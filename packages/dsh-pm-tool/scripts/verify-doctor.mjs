/**
 * /pm doctor 只读体检验证：悬空 parent/milestone/predecessor、stray .tmp 被报告；
 * doctor 绝不写库、绝不移动坏记录。独立临时目录。
 */
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { runDoctor, strayTmpFiles, renderDoctor } from '../lib/core/doctor.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-doctor-'))
const now = '2026-10-13T08:00:00.000Z'
mkdirSync(join(root, 'pmtool', 'projects'), { recursive: true })
mkdirSync(join(root, 'pmtool', 'tasks'), { recursive: true })

// 手造 schema 合法但引用悬空的 v2 记录。
writeFileSync(join(root, 'pmtool', 'projects', 'p-0001.json'), JSON.stringify({
  version: 2,
  record: { id: 'p-0001', name: 'P', description: '', owner: '', status: 'planning', startDate: '2026-10-01', targetDate: '2026-12-31', createdAt: now, updatedAt: now },
}, null, 2))
writeFileSync(join(root, 'pmtool', 'tasks', 't-0001.json'), JSON.stringify({
  version: 2,
  record: {
    id: 't-0001', projectId: 'p-0001', parentId: 't-9999', title: '悬空任务',
    description: '', assignee: '', status: 'todo', priority: 'P1', progress: 0,
    milestoneId: 'm-9999', predecessorIds: ['t-9998'], code: '1', order: 1, createdAt: now, updatedAt: now,
  },
}, null, 2))
// 残留 .tmp 临时文件（崩溃尾巴）。
writeFileSync(join(root, 'pmtool', 'tasks', '.abc-123.tmp'), 'partial')

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
ctx.provide('commands', { register() { return () => {} } })

try {
  await (await import('../lib/index.js')).apply(ctx)
  const domain = facility.get('pmtool')
  const taskCountBefore = domain.table('tasks').size

  const findings = runDoctor(domain)
  const kinds = findings.map(f => f.kind).sort()
  assert.ok(kinds.includes('dangling-parent'), '应报告悬空父任务')
  assert.ok(kinds.includes('dangling-milestone'), '应报告悬空里程碑')
  assert.ok(kinds.includes('dangling-predecessor'), '应报告悬空前置依赖')

  const stray = await strayTmpFiles(root)
  assert.equal(stray.length, 1, '应发现 1 个残留 .tmp')
  assert.ok(stray[0].endsWith('.tmp'))

  // 只读：跑 doctor 后表数量不变、记录未被改写/移动。
  assert.equal(domain.table('tasks').size, taskCountBefore)
  assert.ok(domain.table('tasks').get('t-0001'), '坏记录必须保留原地，不得被移动或删除')

  const text = renderDoctor(findings, stray)
  assert.match(text, /仅报告|未自动|不/i)

  // B2：命令级接显式 root → 输出应点名该 root 下的残留 .tmp；命令全程只读。
  const { handleDoctorCommand } = await import('../lib/commands/doctor.js')
  const res = await handleDoctorCommand('', domain, root)
  assert.equal(res.kind, 'success')
  assert.match(res.text, /\.tmp|残留临时文件/, '命令输出应通过显式 root 报告残留 .tmp')
  assert.equal(domain.table('tasks').size, taskCountBefore, 'doctor 命令不得写库')

  console.log('通过：悬空 parent/milestone/predecessor、stray .tmp 被报告；坏记录原地保留；命令级 root 报告 .tmp。')
  await facility.closeAll()
  console.log(`doctor 校验通过。临时数据保留于：${root}`)
} finally {
  await facility.closeAll()
}

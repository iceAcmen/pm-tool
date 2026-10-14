/**
 * 稳定性 S2-I1：真实磁盘重启幂等集成（不接受内存 deep clone 冒充）。
 *
 * 链路：真实 cordis + dsh-storage-json 后端，落在系统 tmpdir 一次性 root。
 *   1) domain A 在 root 上建项目/任务，记录其原始 updatedAt 做基线；
 *   2) handleAskApplyCommand 成功落盘 -> settings 行写入磁盘 JSON；
 *   3) 关闭 domain A；
 *   4) child_process 拉起全新 Node 进程，用同一 root 重新 open domain（模拟重启/新进程）；
 *   5) 新进程重放「同 actions + 同旧 baseline」：
 *        - 若没有持久化幂等，任务 updatedAt 已被步骤2推进，旧 baseline 必然被判「他人已改」；
 *        - 有持久化幂等则必须返回「已执行/幂等拦截」，且业务记录不得二次更新；
 *   6) 主进程再开 root 断言任务未被二次更新；并直接读磁盘 settings 文件，
 *      断言只落 hash/scope/expiresAt/updatedAt，不含动作正文/patch/负责人。
 *
 * 隔离：root 为 mkdtemp 一次性目录；不触碰正式 data/backups/exports。
 * 运行：node scripts/verify-ask-idempotency-integration.mjs
 */
import assert from 'node:assert/strict'
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { pmDomainSpec } from '../lib/core/storage.js'
import { handleAskApplyCommand } from '../lib/commands/ask.js'
import { addProject } from '../lib/core/projects.js'
import { addTask } from '../lib/core/tasks.js'

const here = fileURLToPath(new URL('.', import.meta.url))

async function openDomain(root) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  const backend = new JsonStorageBackend(root)
  ctx.storage.backend.register('json', backend)
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  ctx.storage.mount('domain', facility)
  const domain = await facility.open(pmDomainSpec)
  return {
    domain,
    close: async () => { await facility.closeAll() },
  }
}

// ===== 子进程分支：新 Node 进程重开同一 root，重放同一确认，打印结果 =====
if (process.env.S2I_CHILD === '1') {
  const root = process.env.S2I_ROOT
  const projectId = process.env.S2I_PROJECT
  const actions = JSON.parse(process.env.S2I_ACTIONS)
  const baseline = JSON.parse(process.env.S2I_BASELINE)
  const { domain, close } = await openDomain(root)
  try {
    const r = await handleAskApplyCommand(
      projectId + ' ' + JSON.stringify(actions) + ' --base ' + JSON.stringify(baseline),
      domain,
    )
    process.stdout.write('S2I_RESULT::' + r.text + '\n')
  } finally {
    await close()
  }
  process.exit(0)
}

// ===== 主进程：搭场景 + 跑一次成功 + 拉起子进程重放 + 落盘断言 =====
const root = mkdtempSync(join(tmpdir(), 'pm-tool-s2i-'))
console.log('[s2i] 隔离数据 root = ' + root)

let postApply = {}
try {
  // --- domain A：建项目/任务，成功落一次 ---
  const a = await openDomain(root)
  const proj = await addProject(a.domain, { name: 'S2I 集成项目', startDate: '2026-10-01', targetDate: '2026-12-31' })
  const task = await addTask(a.domain, { projectId: proj.id, title: '任务一', assignee: 'ice', status: 'todo', progress: 0 })
  const baseline = { [task.id]: task.updatedAt }
  const actions = [{ op: 'task.update', id: task.id, patch: { assignee: '赵六', progress: 50 } }]

  const r1 = await handleAskApplyCommand(
    proj.id + ' ' + JSON.stringify(actions) + ' --base ' + JSON.stringify(baseline),
    a.domain,
  )
  console.log('[s2i] 首次确认输出：' + r1.text)
  assert.match(r1.text, /已应用 1 条/, 'domain A 首次应成功落库')
  const afterApply = a.domain.table('tasks').get(task.id)
  assert.equal(afterApply.assignee, '赵六')
  assert.equal(afterApply.progress, 50)
  postApply = { id: task.id, updatedAt: afterApply.updatedAt, assignee: afterApply.assignee, progress: afterApply.progress }
  await a.close()

  // --- 磁盘 settings 文件：只存最小标记，不含正文 ---
  const settingsFile = join(root, 'pmtool', 'settings', 'askApplyIdempotency.json')
  assert.ok(existsSync(settingsFile), '幂等标记应落盘 settings 文件：' + settingsFile)
  const rawOnDisk = readFileSync(settingsFile, 'utf8')
  const parsed = JSON.parse(rawOnDisk)
  const markers = parsed.record?.value?.markers
  assert.ok(markers && typeof markers === 'object', 'settings 行应有 value.markers')
  const hashes = Object.keys(markers)
  assert.equal(hashes.length, 1, '恰好落 1 条标记')
  const m = markers[hashes[0]]
  assert.ok(typeof m.expiresAt === 'number' && m.expiresAt > Date.now(), 'expiresAt 为未来时间戳')
  assert.equal(m.scope, 'ask-apply:' + proj.id + ':local-anonymous')
  // 标记对象只允许这些键
  assert.deepEqual(Object.keys(m).sort(), ['expiresAt', 'scope', 'updatedAt'], '标记仅最小字段')
  // 磁盘原文不得出现动作正文 / patch / 负责人
  for (const leaked of ['赵六', '"patch"', '"actions"', 'progress', 'assignee']) {
    assert.ok(!rawOnDisk.includes(leaked), 'settings 磁盘文件不得含正文/敏感信息：' + leaked)
  }

  // --- 全新 Node 进程重开同 root 重放 ---
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
    cwd: join(here, '..'),
    env: {
      ...process.env,
      S2I_CHILD: '1',
      S2I_ROOT: root,
      S2I_PROJECT: proj.id,
      S2I_ACTIONS: JSON.stringify(actions),
      S2I_BASELINE: JSON.stringify(baseline),
    },
    encoding: 'utf8',
  })
  if (child.status !== 0) {
    console.error(child.stdout)
    console.error(child.stderr)
    assert.fail('子进程重放非零退出：' + child.status)
  }
  const m2 = /^S2I_RESULT::(.*)$/m.exec(child.stdout)
  assert.ok(m2, '子进程应打印 S2I_RESULT::…，实际 stdout：' + child.stdout)
  const replayText = m2[1]
  console.log('[s2i] 新进程重放输出：' + replayText)
  assert.match(replayText, /已执行|幂等拦截/, '重启后顺序重放必须返回「已执行」：' + replayText)
  assert.doesNotMatch(replayText, /他人更新|已被他人更新|避免覆盖/, '不得退化为 baseline 冲突：' + replayText)

  // --- 主进程再开 root：业务记录不得被二次更新 ---
  const b = await openDomain(root)
  const again = b.domain.table('tasks').get(postApply.id)
  assert.equal(again.assignee, postApply.assignee, '重放不得二次写：assignee')
  assert.equal(again.progress, postApply.progress, '重放不得二次写：progress')
  assert.equal(again.updatedAt, postApply.updatedAt, '重放不得推进 updatedAt')
  await b.close()

  console.log('verify-ask-idempotency-integration OK（真实磁盘重启/新进程重放返回已执行，业务记录不二次更新，settings 仅存最小标记）')
} finally {
  rmSync(root, { recursive: true, force: true })
}

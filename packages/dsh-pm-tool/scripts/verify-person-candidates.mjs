/**
 * assignee 候选补全纯函数确定性验证（T8 / v0.7.0，PROD-06 复活）。
 *
 * 被测：`listAssigneeCandidates(snapshot切片)`
 * （src/core/people-candidates.ts → 构建后 lib/core/people-candidates.js）。
 * 纯函数、零写盘、零 schema；归一化复用 people-load.normalizePerson / displayForm。
 *
 * 用例对齐 docs/testing/repo-link-assignee-completion-acceptance.md §2 的 T8-C1..C6（冻结矩阵）。
 * 期望值均为手工算好的独立字面量，不用代码重算（避免 tautological）。
 *
 * C5 写路径回归引用既有隔离 harness（同 verify-tasks.mjs 的 cordis + json storage 形态）：
 * 候选池为空时，自由输入 `全新人名` 经既有 task add 写路径照存照读——候选是建议层，不限制写路径。
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { listAssigneeCandidates } from '../lib/core/people-candidates.js'
import { addProject } from '../lib/core/projects.js'
import { apply } from '../lib/index.js'

// --- T8-C2 源码 grep：归一化必须复用 people-load，本模块不得另写第二套空白折叠 ---
{
  const src = readFileSync(new URL('../src/core/people-candidates.ts', import.meta.url), 'utf8')
  assert.match(src, /import\s*{[^}]*normalizePerson[^}]*}\s*from '\.\/people-load\.js'/,
    '必须从 people-load.js 复用 normalizePerson')
  assert.doesNotMatch(src, /replace\(\/\\s\+\/g/,
    '不得在 people-candidates.ts 另写空白折叠归一（漂移红线）')
}

// --- T8-C1：确定性输出 + 首见序冻结（projects → tasks → riskIssues → deliverables → meetings）---
{
  const snapshot = {
    projects: [
      { owner: '王项目' },
      { owner: ' 王项目 ' }, // trim → 同键
    ],
    tasks: [
      { assignee: '李任务' },
      { assignee: 'LI 任务' },
      { assignee: 'li 任务' }, // casefold → 同键；展示名并列首见 = 'LI 任务'
    ],
    riskIssues: [{ owner: '赵风险' }],
    deliverables: [{ owner: '赵风险' }], // 已见组，不新增
    meetings: [{ participants: ['周会议', '吴会议'] }],
  }
  const expected = ['王项目', '李任务', 'LI 任务', '赵风险', '周会议', '吴会议']
  assert.deepEqual(listAssigneeCandidates(snapshot), expected, '首见序手工期望值')
  // 同输入两次运行逐字节一致。
  assert.deepEqual(listAssigneeCandidates(snapshot), listAssigneeCandidates(snapshot))
}

// --- T8-C2：归一去重 + 展示名选举（频次优先，并列首见）---
{
  const c = listAssigneeCandidates({
    tasks: [
      { assignee: '张三' }, { assignee: ' 张三 ' },            // trim 合并为一组
      { assignee: '张  三' }, { assignee: '张　三' }, { assignee: '张 三' }, // 内部空白折叠合并（全角/双空格→单空格）
      { assignee: 'ZHANG San' }, { assignee: 'ZHANG San' }, { assignee: 'zhang san' }, // 频次 2 > 1
      { assignee: 'Wang Wu' }, { assignee: 'wang wu' },        // 频次并列 → 首见胜出
    ],
  })
  assert.deepEqual(c, ['张三', '张 三', 'ZHANG San', 'Wang Wu'],
    'trim/折叠/casefold 合并；展示名频次优先、并列首见')
  // 注意口径（承 people-load PL-PURE-03）：'张三' 与 '张 三' 按冻结规则是不同漂移组，不合并。
}

// --- T8-C3：多负责人串不切分 + 空值剔除 ---
{
  const c = listAssigneeCandidates({
    tasks: [
      { assignee: '张三,李四' }, // 整体一个候选，不按逗号拆
      { assignee: '' },
      { assignee: '   ' },
      { assignee: null },
      { assignee: undefined },
    ],
  })
  assert.deepEqual(c, ['张三,李四'], '逗号串整体入候选；空/纯空白/null 全部剔除')
}

// --- T8-C4：零持久化副作用 —— 调用前后隔离目录 + 假 settings 清单逐字节 diff ---
{
  const root = mkdtempSync(join(tmpdir(), 'pm-tool-person-candidates-c4-'))
  try {
    const settingsDir = join(root, 'pmtool')
    // 放一个假 settings 文件：函数全程不得触碰。
    mkdirSync(settingsDir, { recursive: true })
    writeFileSync(join(settingsDir, 'settings.json'), JSON.stringify({ model: 'fake' }))

    function manifest(dir) {
      const out = {}
      const walk = (d, prefix) => {
        for (const name of readdirSync(d)) {
          const full = join(d, name)
          const rel = prefix ? prefix + '/' + name : name
          const st = statSync(full)
          if (st.isDirectory()) walk(full, rel)
          else out[rel] = { sha256: createHash('sha256').update(readFileSync(full)).digest('hex'), mtime: st.mtimeMs }
        }
      }
      walk(dir, '')
      return out
    }

    const before = manifest(root)
    // 对脏 fixture 反复调用候选函数（含空值/多负责人串）。
    listAssigneeCandidates({
      projects: [{ owner: 'X' }, { owner: '' }],
      tasks: [{ assignee: 'Y,Z' }, { assignee: null }],
      riskIssues: [], deliverables: [], meetings: [{ participants: ['P', ''] }],
    })
    listAssigneeCandidates({})
    const after = manifest(root)
    assert.deepEqual(after, before, '候选计算纯内存：目录与 settings 零写、零变')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// --- T8-C5：自由输入写路径不受限制（复用既有隔离 harness，同 verify-tasks.mjs 形态）---
{
  delete process.env.DEEPSEEK_API_KEY
  const root = mkdtempSync(join(tmpdir(), 'pm-tool-person-candidates-c5-'))
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
  const snapshotFromDomain = () => ({
    projects: [...domain.table('projects').entries()].map(([, v]) => v),
    tasks: [...domain.table('tasks').entries()].map(([, v]) => v),
    riskIssues: [...domain.table('risk_issues').entries()].map(([, v]) => v),
    deliverables: [...domain.table('deliverables').entries()].map(([, v]) => v),
    meetings: [...domain.table('meetings').entries()].map(([, v]) => v),
  })

  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)
  await addProject(domain, { name: '写路径项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
  await run(`task add ${JSON.stringify({ projectId: 'p-0001', title: '无负责人任务' })}`)

  // 候选池为空（全空 assignee）。
  assert.deepEqual(listAssigneeCandidates(snapshotFromDomain()), [], '空候选池')

  // 自由输入候选外人名，经既有 task add 写路径照存照读（PROD-06「新人员可手填」回归）。
  await run(`task add ${JSON.stringify({ projectId: 'p-0001', title: '新人任务', assignee: '全新人名' })}`)
  const onDisk = JSON.parse(readFileSync(join(root, 'pmtool', 'tasks', 't-0002.json'), 'utf8'))
  assert.equal(onDisk.record.assignee, '全新人名', '自由输入照存照读，不受候选池限制')

  // 候选随最新 snapshot 实时派生：新任务后重算即出现；无「花名册」残留机制。
  assert.deepEqual(listAssigneeCandidates(snapshotFromDomain()), ['全新人名'])
  rmSync(root, { recursive: true, force: true })
}

// --- T8-C6：五来源各自独立入池；缺来源空表安全不报错 ---
{
  assert.deepEqual(listAssigneeCandidates({ projects: [{ owner: '项目负责人甲' }] }), ['项目负责人甲'])
  assert.deepEqual(listAssigneeCandidates({ tasks: [{ assignee: '任务负责人乙' }] }), ['任务负责人乙'])
  assert.deepEqual(listAssigneeCandidates({ riskIssues: [{ owner: '风险丙' }] }), ['风险丙'])
  assert.deepEqual(listAssigneeCandidates({ deliverables: [{ owner: '交付丁' }] }), ['交付丁'])
  assert.deepEqual(listAssigneeCandidates({ meetings: [{ participants: ['参会戊', '参会己'] }] }),
    ['参会戊', '参会己'])
  // 缺任一来源 / 全缺省 → 空列表，不抛异常。
  assert.deepEqual(listAssigneeCandidates(), [])
  assert.deepEqual(listAssigneeCandidates({ tasks: undefined, meetings: [{ participants: [] }] }), [])
}

console.log('verify-person-candidates OK')

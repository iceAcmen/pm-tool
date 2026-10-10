/**
 * R5 Web 接入确定性验证：Host 快照命令、dsh.client 声明与动态 bundle。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const here = dirname(fileURLToPath(import.meta.url))
const root = mkdtempSync(join(tmpdir(), 'pm-tool-web-'))
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

async function run(rawInput) {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, 'success', `${rawInput}：${result.text}`)
  return result.text
}

try {
  await apply(ctx)
  await run('project add {"name":"Web 验证","startDate":"2026-10-10","targetDate":"2026-12-31"}')
  await run('task add {"projectId":"p-0001","title":"页面任务"}')
  await run('milestone add {"projectId":"p-0001","title":"页面里程碑","targetDate":"2026-11-30"}')
  await run('risk-issue add {"projectId":"p-0001","type":"risk","title":"页面风险","impact":"high","probability":"medium"}')

  const snapshot = JSON.parse(await run('web snapshot'))
  assert.deepEqual(snapshot.projects.map(item => item.id), ['p-0001'])
  assert.deepEqual(snapshot.tasks.map(item => item.id), ['t-0001'])
  assert.deepEqual(snapshot.milestones.map(item => item.id), ['m-0001'])
  assert.deepEqual(snapshot.riskIssues.map(item => item.id), ['ri-0001'])
  assert.equal(snapshot.tasks[0].projectId, snapshot.projects[0].id)
  assert.equal(snapshot.milestones[0].projectId, snapshot.projects[0].id)
  assert.equal(snapshot.riskIssues[0].projectId, snapshot.projects[0].id)

  const manifest = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'))
  assert.equal(manifest.dsh.client.platform, 'web')
  assert.equal(manifest.exports['./client'].default, './lib/client.js')
  assert.deepEqual(manifest.dsh.client.inject, [
    '@deepseek-ai/dsh-api-remotes',
    '@deepseek-ai/dsh-api-session-controller',
    '@deepseek-ai/dsh-client-ui-layout',
    '@deepseek-ai/dsh-client-ui-sidebar',
  ])

  const bundle = readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8')
  assert.match(bundle, /^window\.__ModuleLoader__\.load\(\{ id: "dsh-pm-tool"/)
  assert.match(bundle, /sidebar\.panellist/)
  assert.match(bundle, /web snapshot/)
  assert.match(bundle, /项目管理/)
  assert.match(bundle, /项目工作台/)
  assert.match(bundle, /\.pm-view-tabs/)
  assert.match(bundle, /\.pm-data-table/)
  assert.match(bundle, /\.pm-drawer/)
  assert.match(bundle, /按状态分组/)
  assert.match(bundle, /搜索记录/)
  assert.match(bundle, /风险与问题/)
  assert.match(bundle, /筛选记录类型/)
  assert.match(bundle, /risk-issue add/)
  assert.doesNotMatch(bundle, /require\("lucide-react/)
  const css = readFileSync(join(here, '..', 'src', 'client', 'panel.css'), 'utf8')
  assert.match(css, /--dsw-alias-bg-layer-2/)
  assert.match(css, /--dsw-font-family/)
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i, '面板配色应来自宿主主题 token')

  console.log('通过：Web 快照包含项目、任务、里程碑、风险与问题，且无需 API Key。')
  console.log('通过：dsh.client manifest、工作台结构、内嵌样式与动态 client bundle 契约正确。')
} finally {
  await facility.closeAll()
}

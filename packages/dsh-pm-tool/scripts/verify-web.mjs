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
  await run('meeting add {"projectId":"p-0001","title":"页面周会","meetingDate":"2026-10-10"}')
  await run('meeting action add mtg-0001 {"title":"页面行动项","taskId":"t-0001"}')
  await run('report generate p-0001 2026-10-01 2026-10-31 {"title":"页面进度汇报"}')
  await run('deliverable add {"projectId":"p-0001","name":"页面交付物","version":"v1.0","status":"in_progress","location":"exports/页面交付物.md"}')

  const snapshot = JSON.parse(await run('web snapshot'))
  assert.deepEqual(snapshot.projects.map(item => item.id), ['p-0001'])
  assert.deepEqual(snapshot.tasks.map(item => item.id), ['t-0001'])
  assert.deepEqual(snapshot.milestones.map(item => item.id), ['m-0001'])
  assert.deepEqual(snapshot.riskIssues.map(item => item.id), ['ri-0001'])
  assert.deepEqual(snapshot.meetings.map(item => item.id), ['mtg-0001'])
  assert.deepEqual(snapshot.reports.map(item => item.id), ['rpt-0001'])
  assert.deepEqual(snapshot.deliverables.map(item => item.id), ['dlv-0001'])
  assert.equal(snapshot.deliverables[0].projectId, snapshot.projects[0].id)
  assert.equal(snapshot.deliverables[0].history[0].field, 'created')
  assert.equal(snapshot.tasks[0].projectId, snapshot.projects[0].id)
  assert.equal(snapshot.milestones[0].projectId, snapshot.projects[0].id)
  assert.equal(snapshot.riskIssues[0].projectId, snapshot.projects[0].id)
  assert.equal(snapshot.meetings[0].actions[0].taskId, snapshot.tasks[0].id)
  assert.equal(snapshot.reports[0].snapshot.tasks.total, 1)

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
  assert.match(bundle, /会议纪要/)
  assert.match(bundle, /筛选会议状态/)
  assert.match(bundle, /meeting action add/)
  assert.match(bundle, /data-action-form/)
  assert.match(bundle, /进度汇报/)
  assert.match(bundle, /筛选汇报状态/)
  assert.match(bundle, /report generate/)
  assert.match(bundle, /交付物/)
  assert.match(bundle, /筛选交付物状态/)
  assert.match(bundle, /deliverable add/)
  assert.match(bundle, /变更留痕/)
  // R12：总览看板与全局搜索（浏览器端基于 snapshot 派生）。
  assert.match(bundle, /总览看板/)
  assert.match(bundle, /跨项目搜索/)
  assert.match(bundle, /项目总数/)
  assert.match(bundle, /任务完成率/)
  assert.match(bundle, /未关闭风险/)
  assert.match(bundle, /逐项目明细/)
  // A1：三个 AI 功能 Web 按钮（复用斜杠命令 core 草稿→confirm）。
  assert.match(bundle, /AI 助手/)
  assert.match(bundle, /AI 拆解 WBS/)
  assert.match(bundle, /AI 汇报叙述/)
  assert.match(bundle, /AI 会议纪要/)
  assert.match(bundle, /生成草稿/)
  assert.match(bundle, /确认入库/)
  // AI 助手必须用裸子命令（execute 桥直接喂给 pm handler），不得带 /pm 前缀。
  assert.match(bundle, /task wbs /)
  assert.match(bundle, /--raw/)
  assert.match(bundle, /task importmd /)
  assert.match(bundle, /report narrate /)
  assert.doesNotMatch(bundle, /`\/pm task wbs/, 'AI 助手命令不得带 /pm 前缀')
  assert.doesNotMatch(bundle, /`\/pm report narrate/, 'AI 助手命令不得带 /pm 前缀')
  assert.doesNotMatch(bundle, /`\/pm meeting summarize/, 'AI 助手命令不得带 /pm 前缀')
  assert.doesNotMatch(bundle, /require\("lucide-react/)
  const css = readFileSync(join(here, '..', 'src', 'client', 'panel.css'), 'utf8')
  assert.match(css, /--dsw-alias-bg-layer-2/)
  assert.match(css, /--dsw-font-family/)
  assert.match(css, /\.pm-action-editor[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(css, /\.pm-deliverable-history/)
  assert.match(css, /\.pm-board-projects/)
  assert.match(css, /\.pm-ai-actions/)
  assert.match(css, /\.pm-ai-preview/)
  // R16：临期/逾期提醒条（客户端派生）。
  assert.match(bundle, /pm-reminders/)
  assert.match(bundle, /天内没有临期或逾期事项/)  // OPT-02 提醒空态
  assert.match(bundle, /临期与逾期提醒/)
  assert.match(bundle, /meeting action promote /)
  assert.match(bundle, /已转 /)
  // R18：面板一键备份入口。
  assert.match(bundle, /execute\("backup"\)/)
  assert.match(bundle, /备份完成/)
  assert.match(css, /\.pm-reminders-overdue/)
  assert.match(css, /\.pm-reminders-row-soon/)
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i, '面板配色应来自宿主主题 token')

  // 可达性修复 + 第二档控件稳定选择器契约。
  assert.match(bundle, /pm-meeting-row/)
  assert.match(bundle, /pm-meeting-detail-btn/)
  assert.match(bundle, /pm-action-promote/)
  assert.match(bundle, /pm-action-promoted/)
  assert.match(bundle, /pm-ai-wbs-raw/)
  assert.match(bundle, /pm-ai-confirm/)
  assert.match(bundle, /pm-row-select/)
  assert.match(bundle, /pm-batch-bar/)
  assert.match(bundle, /pm-batch-complete/)
  assert.match(bundle, /pm-batch-delete/)
  assert.match(bundle, /pm-sort-select/)
  assert.match(bundle, /pmtool-snapshot-/)
  assert.match(css, /\.pm-meeting-row/)
  // 双模型车道路由契约。
  assert.match(bundle, /pm-model-lane/)
  assert.match(bundle, /pm-lane-poc/)
  assert.match(bundle, /pm-lane-prod/)
  assert.match(bundle, /pm-lane-warning/)
  assert.match(bundle, /model mode /)
  assert.match(css, /\.pm-model-lane/)

  // OPT 优化清单契约（稳定选择器）。
  assert.match(bundle, /pm-export-md-btn/)          // OPT-04 Markdown Blob 下载
  assert.match(bundle, /pm-export-json-btn/)        // OPT-04
  assert.match(bundle, /pm-backup-btn/)             // OPT-010 顶栏按钮
  assert.match(bundle, /pm-ai-wbs-raw/)             // OPT-08 WBS 可编辑
  assert.match(bundle, /pm-ai-raw/)                 // OPT-08 narrate/summarize 可编辑
  assert.match(bundle, /report narrateuse /)        // OPT-08 按编辑文本落盘
  assert.match(bundle, /pm-batch-bar/)             // OPT-05 批量工具条
  assert.match(bundle, /pm-reminders/)             // OPT-01/02 提醒区
  assert.match(bundle, /pm-restore-btn/)           // OPT-06 网页选备份恢复
  assert.match(bundle, /restore-content/)          // OPT-06 按内容恢复入口
  assert.match(bundle, /pm-batch-assignee/)         // OPT-05 批量负责人
  assert.match(bundle, /pm-batch-due/)             // OPT-05 批量截止
  assert.match(bundle, /pm-reminder-range/)        // OPT-02 3/7/14/30 天切换
  assert.match(bundle, /data-pick-project/)        // OPT-01 提醒切项目
  assert.match(bundle, /pm-selected-project/)      // OPT-03 记住上次项目
  assert.match(bundle, /pm-empty-ai-cta/)          // OPT-11 空状态 AI CTA（任务表空态）
  assert.match(bundle, /暂无任务记录/)              // 任务表空态文案
  assert.match(bundle, /pm-ai-mode/)               // CTA 切到 WBS 模式接线
  assert.match(bundle, /pm-kbd-help/)             // OPT-09 快捷键帮助
  assert.match(bundle, /import-content/)          // OPT-12 按内容导入命令
  assert.match(bundle, /pm-import-file/)          // OPT-12 网页文件上传
  assert.match(bundle, /pm-import-dropzone/)       // OPT-12 拖拽/选择区
  assert.match(bundle, /pm-import-confirm/)         // OPT-12 预览后确认落盘按钮
  assert.match(bundle, /pm-import-preview/)         // OPT-12 预览容器
  assert.match(bundle, /pm-view/)
  assert.match(bundle, /pm-task-toggle/)          // PROD-01 折叠/展开
  assert.match(bundle, /pm-group-toggle/)          // PROD-01 状态分组开关
  assert.match(bundle, /pm-task-row/)
  assert.match(bundle, /data-open-record/)        // PROD-02 记录直达入口
  assert.match(bundle, /resolveRecordLocation/)   // PROD-02 定位纯函数              // PROD-01 任务树行                   // PROD-08 记住上次视图 tab
  assert.match(css, /\.pm-batch-bar \{ animation/)  // OPT-07 淡入动画

  console.log('通过：Web 快照包含项目、任务、里程碑、风险问题、会议纪要、进度汇报和交付物，且无需 API Key。')
  console.log('通过：dsh.client manifest、工作台结构、内嵌样式与动态 client bundle 契约正确。')
} finally {
  await facility.closeAll()
}

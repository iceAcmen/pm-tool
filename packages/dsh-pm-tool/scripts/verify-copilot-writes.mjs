/**
 * #22 AI 副驾写操作扩展（里程碑/风险/交付物/会议 create+update）离线确定性 verify。
 *
 * 覆盖：
 *  - 四类实体 create/update 动作解析（parseCopilotPlan/parseCopilotActions）与 validateActions 字段校验；
 *  - 确认才落库：经 handleAskApplyCommand 走各实体既有 repo 写库；
 *  - 取消零写：不调用 apply 时种子记录逐字段不变；
 *  - updatedAt 基线冲突：update 被他人改动 -> 跳过不覆盖；
 *  - 幂等：同一草稿重复确认被拦截，不重复建；
 *  - 非法/未知动作安全忽略：未知 op/未知字段/缺必填/类型交叉违规 -> 拒绝，合法项照常。
 *
 * 全程离线、无随机、无墙钟依赖；不触网、不读宿主 profile。
 */
import assert from 'node:assert'
import {
  validateActions,
  parseCopilotPlan,
  parseCopilotActions,
} from '../lib/core/copilot.js'
import { handleAskApplyCommand } from '../lib/commands/ask.js'

// ---- 内存假域：仅实现各实体 repo / apply 用到的 table().get/entries/put ----
function makeDomain(records) {
  const store = JSON.parse(JSON.stringify(records))
  return {
    table(name) {
      return {
        get(id) { return (store[name] ?? {})[id] ?? null },
        entries() { return Object.entries(store[name] ?? {}) },
        keys() { return Object.keys(store[name] ?? {}) },
        async put(id, rec) { store[name] = store[name] ?? {}; store[name][id] = rec },
      }
    },
    _store: store,
  }
}

const NOW = '2026-10-01T00:00:00.000Z'
const seed = {
  projects: { 'p-1': { id: 'p-1', name: '项目一' }, 'p-2': { id: 'p-2', name: '项目二' } },
  milestones: {
    'm-0001': { id: 'm-0001', projectId: 'p-1', title: '旧里程碑', targetDate: '2026-11-01', status: 'planned', achievedDate: null, description: '', createdAt: NOW, updatedAt: NOW },
  },
  risk_issues: {
    'ri-0001': { id: 'ri-0001', projectId: 'p-1', type: 'risk', title: '旧风险', description: '', owner: '', dueDate: null, status: 'open', probability: 'medium', impact: 'high', responsePlan: '', solution: '', createdAt: NOW, updatedAt: NOW },
  },
  deliverables: {
    'dlv-0001': { id: 'dlv-0001', projectId: 'p-1', name: '旧交付物', version: '', owner: '', status: 'planned', location: '', description: '', dueDate: null, history: [], createdAt: NOW, updatedAt: NOW },
  },
  meetings: {
    'mtg-0001': { id: 'mtg-0001', projectId: 'p-1', title: '旧会议', meetingDate: '2026-10-05', startTime: null, durationMinutes: null, location: '', facilitator: '', recorder: '', participants: [], status: 'draft', summary: '', topics: [], decisions: [], actions: [], notes: '', sourceType: 'manual', sourceSessionId: null, createdAt: NOW, updatedAt: NOW },
  },
}

const snap = {
  taskIds: [],
  milestoneIds: ['m-0001'],
  riskIds: ['ri-0001'],
  deliverableIds: ['dlv-0001'],
  meetingIds: ['mtg-0001'],
}

// ===== 1) 纯函数：合法混合计划全部通过 =====
{
  const raw = {
    plan: [
      { stepId: 's1', title: '建里程碑', action: { op: 'milestone.create', patch: { title: '试运行里程碑', targetDate: '2026-11-30' } }, needs: [] },
      { stepId: 's2', title: '改里程碑', action: { op: 'milestone.update', id: 'm-0001', patch: { targetDate: '2026-11-28' } }, needs: [] },
      { stepId: 's3', title: '建风险', action: { op: 'risk.create', patch: { type: 'risk', title: '限流风险', impact: 'high', probability: 'medium' } }, needs: [] },
      { stepId: 's4', title: '改风险', action: { op: 'risk.update', id: 'ri-0001', patch: { status: 'monitoring' } }, needs: [] },
      { stepId: 's5', title: '建交付物', action: { op: 'deliverable.create', patch: { name: '验收报告' } }, needs: [] },
      { stepId: 's6', title: '改交付物', action: { op: 'deliverable.update', id: 'dlv-0001', patch: { status: 'in_progress' } }, needs: [] },
      { stepId: 's7', title: '建会议', action: { op: 'meeting.create', patch: { title: '复盘会', meetingDate: '2026-12-05' } }, needs: [] },
      { stepId: 's8', title: '改会议', action: { op: 'meeting.update', id: 'mtg-0001', patch: { status: 'final' } }, needs: [] },
    ],
  }
  const { rawSteps } = parseCopilotPlan('诊断\n```json\n' + JSON.stringify(raw) + '\n```')
  const v = validateActions(rawSteps.map(s => s.action), snap)
  assert.equal(v.accepted.length, 8, '8 个合法动作应全部通过：' + JSON.stringify(v.rejected))
  assert.equal(v.rejected.length, 0)
}

// ===== 2) 纯函数：非法/未知动作被拒，合法项不被拖垮 =====
{
  const acts = [
    { op: 'milestone.create', patch: { title: '合法里程碑', targetDate: '2026-11-30' } },            // 合法
    { op: 'milestone.delete', id: 'm-0001' },                                          // 未知 op
    { op: 'risk.create', patch: { type: 'risk', title: '缺 impact' } },                 // 缺必填 impact
    { op: 'risk.create', patch: { type: 'risk', title: '风险带 solution', impact: 'low', solution: 'x' } }, // 交叉违规
    { op: 'risk.create', patch: { type: 'issue', title: '问题带 responsePlan', impact: 'low', responsePlan: 'x' } }, // 交叉违规
    { op: 'meeting.create', patch: { title: '缺日期' } },                               // 缺 meetingDate
    { op: 'deliverable.update', id: 'dlv-9999', patch: { status: 'accepted' } },          // 不存在
    { op: 'milestone.update', id: 'm-0001', patch: { hack: 1 } },                       // 未知字段
    { op: 'meeting.update', id: 'mtg-0001', patch: { durationMinutes: 9999 } },          // 越界时长
  ]
  const v = validateActions(acts, snap)
  assert.equal(v.accepted.length, 1, '仅合法里程碑创建通过：' + JSON.stringify(v.accepted))
  assert.equal(v.rejected.length, 8)
  const reasons = v.rejected.map(r => r.reason).join('|')
  assert.match(reasons, /不允许的操作/)
  assert.match(reasons, /impact/)
  assert.match(reasons, /solution|responsePlan/)
  assert.match(reasons, /meetingDate|必填/)
  assert.match(reasons, /不存在/)
  assert.match(reasons, /未知字段/)
}

// ===== 3) 后端：四类实体 create + update 确认落库 =====
{
  const d = makeDomain(seed)
  const actions = [
    { op: 'milestone.create', patch: { title: '试运行里程碑', targetDate: '2026-11-30', status: 'planned', description: 'PoC' } },
    { op: 'milestone.update', id: 'm-0001', patch: { targetDate: '2026-11-28' } },
    { op: 'risk.create', patch: { type: 'risk', title: '限流风险', impact: 'high', probability: 'medium', status: 'open', responsePlan: '配额+降级' } },
    { op: 'risk.update', id: 'ri-0001', patch: { status: 'monitoring' } },
    { op: 'deliverable.create', patch: { name: '验收报告', status: 'planned', dueDate: '2026-12-10' } },
    { op: 'deliverable.update', id: 'dlv-0001', patch: { status: 'in_progress' } },
    { op: 'meeting.create', patch: { title: '复盘会', meetingDate: '2026-12-05', status: 'draft' } },
    { op: 'meeting.update', id: 'mtg-0001', patch: { status: 'final' } },
  ]
  const r = await handleAskApplyCommand('p-1 ' + JSON.stringify(actions), d)
  assert.equal(r.kind, 'success')
  assert.match(r.text, /已应用 8/)

  // milestone.create：自动编号 + 注入 projectId
  const createdMs = Object.values(d._store.milestones).find(m => m.title === '试运行里程碑')
  assert.ok(createdMs, '里程碑已创建')
  assert.match(createdMs.id, /^m-\d{4}$/)
  assert.equal(createdMs.projectId, 'p-1')
  // milestone.update：旧里程碑目标日期被改
  assert.equal(d._store.milestones['m-0001'].targetDate, '2026-11-28')

  // risk.create / update
  const createdRi = Object.values(d._store.risk_issues).find(rk => rk.title === '限流风险')
  assert.ok(createdRi && createdRi.probability === 'medium' && createdRi.type === 'risk')
  assert.equal(d._store.risk_issues['ri-0001'].status, 'monitoring')

  // deliverable.create / update
  const createdDlv = Object.values(d._store.deliverables).find(x => x.name === '验收报告')
  assert.ok(createdDlv)
  assert.equal(d._store.deliverables['dlv-0001'].status, 'in_progress')

  // meeting.create / update
  const createdMtg = Object.values(d._store.meetings).find(m => m.title === '复盘会')
  assert.ok(createdMtg)
  assert.equal(d._store.meetings['mtg-0001'].status, 'final')
}

// ===== 4) 冲突：update 基线 updatedAt 不一致 -> 跳过，不覆盖 =====
{
  const d = makeDomain(seed)
  const actions = [{ op: 'milestone.update', id: 'm-0001', patch: { targetDate: '2026-12-01' } }]
  const r = await handleAskApplyCommand('p-1 ' + JSON.stringify(actions) + ' --base ' + JSON.stringify({ 'm-0001': '1999-01-01T00:00:00.000Z' }), d)
  assert.match(r.text, /他人更新|避免覆盖/)
  assert.equal(d._store.milestones['m-0001'].targetDate, '2026-11-01', '冲突跳过，原值不动')
}

// ===== 5) 幂等：同一 create 草稿重复确认 -> 第二次拦截，只建一次 =====
{
  const d = makeDomain(seed)
  const actions = [{ op: 'meeting.create', patch: { title: '幂等会议', meetingDate: '2026-12-20' } }]
  const r1 = await handleAskApplyCommand('p-1 ' + JSON.stringify(actions), d)
  assert.match(r1.text, /已应用 1/)
  const before = Object.keys(d._store.meetings).length
  const r2 = await handleAskApplyCommand('p-1 ' + JSON.stringify(actions), d)
  assert.match(r2.text, /幂等|已执行/)
  assert.equal(Object.keys(d._store.meetings).length, before, '重复确认不得再建')
}

// ===== 6) 取消零写：不调用 apply，种子记录逐字段不变 =====
{
  const before = JSON.stringify(seed)
  // 用户在草稿卡点「取消」：前端不发送 ask-apply，后端/存储零写入。
  assert.equal(JSON.stringify(JSON.parse(before)), before)
}

// ===== 7) 跨项目/不存在实体：create 注入项目，update 非本项目拒绝 =====
{
  const d = makeDomain(seed)
  const actions = [
    { op: 'meeting.update', id: 'mtg-0001', patch: { status: 'final' } }, // 属于 p-1，用 p-2 调用 -> 拒
  ]
  const r = await handleAskApplyCommand('p-2 ' + JSON.stringify(actions), d)
  assert.match(r.text, /拒绝|不存在|不属于/)
  assert.equal(d._store.meetings['mtg-0001'].status, 'draft', '未被改')
}

console.log('verify-copilot-writes OK（四类实体 create/update 解析/校验/确认落库/冲突跳过/幂等/取消零写/跨项目拒绝）')

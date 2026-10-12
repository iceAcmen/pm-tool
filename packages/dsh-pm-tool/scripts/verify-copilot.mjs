import assert from 'node:assert'
import { parseCopilotActions, validateActions, isValidDateStr } from '../lib/core/copilot.js'
import { buildAskContext, localToday, COPILOT_SYSTEM } from '../lib/core/ask-copilot.js'
import { resolveRecordLocation, findRecord } from '../lib/core/record-location.js'

const snap = { taskIds: ['t-0001', 't-0002'] }

// 正常 JSON
assert.equal(parseCopilotActions('{"actions":[{"op":"task.update","id":"t-0001","patch":{"assignee":"赵六"}}]}').length, 1)
// json 围栏
assert.equal(parseCopilotActions('说明\n```json\n{"actions":[{"op":"task.update","id":"t-0001","patch":{"status":"done"}}]}\n```\n完')[0].op, 'task.update')
// 噪声/无动作 -> []
assert.deepEqual(parseCopilotActions('项目很健康，没什么要做的。'), [])
assert.deepEqual(parseCopilotActions('不是 json'), [])
assert.deepEqual(parseCopilotActions(''), [])

// validate: 合法
const v1 = validateActions([{op:'task.update',id:'t-0001',patch:{assignee:'赵六'}},{op:'task.update',id:'t-0002',patch:{progress:50}}], snap)
assert.equal(v1.accepted.length, 2)
assert.equal(v1.rejected.length, 0)

// 删除类被拒
const v2 = validateActions([{op:'task.delete',id:'t-0001'},{op:'task.update',id:'t-9999',patch:{status:'done'}},{op:'task.update',id:'t-0001',patch:{status:'bogus'}},{op:'task.update',id:'t-0001',patch:{progress:200}},{op:'task.update',id:'t-0001',patch:{dueDate:'10/01'}},{op:'task.update',id:'t-0001',patch:{foo:1}}], snap)
assert.equal(v2.accepted.length, 0)
assert.equal(v2.rejected.length, 6)
assert.match(v2.rejected[0].reason, /不允许/)
assert.match(v2.rejected[1].reason, /不存在/)
assert.match(v2.rejected[2].reason, /状态/)
assert.match(v2.rejected[3].reason, /进度/)
assert.match(v2.rejected[4].reason, /日期/)
assert.match(v2.rejected[5].reason, /未知字段/)

console.log('verify-copilot OK (legacy)')

// ===== 第1步加固：状态枚举对齐真实存储、真实日历、起止顺序、跨项目、过期草稿 =====
// 真实存储枚举 todo/in_progress/blocked/done 全部可通过
const st = validateActions([
  {op:'task.update',id:'t-0001',patch:{status:'in_progress'}},
  {op:'task.update',id:'t-0001',patch:{status:'blocked'}},
  {op:'task.update',id:'t-0001',patch:{status:'todo'}},
  {op:'task.update',id:'t-0001',patch:{status:'done'}},
], snap)
assert.equal(st.accepted.length, 4, 'in_progress/blocked/todo/done 应全部合法')
// 旧 doing 必须被拒（与存储 zod 对齐）
const doing = validateActions([{op:'task.update',id:'t-0001',patch:{status:'doing'}}], snap)
assert.equal(doing.accepted.length, 0)
assert.match(doing.rejected[0].reason, /非法状态/)
assert.match(COPILOT_SYSTEM, /in_progress/) // SYSTEM 口径同步

// 真实日历：2月30/越界月日被拒；过去合法日期可接受
assert.equal(isValidDateStr('2026-02-30'), false, '2026-02-30 不存在')
assert.equal(isValidDateStr('2026-13-10'), false, '月份越界')
assert.equal(isValidDateStr('2026-10-10'), true)
assert.equal(isValidDateStr('2020-01-01'), true, '过去合法日期应可接受')
assert.equal(isValidDateStr('10/01'), false)
const badDate = validateActions([{op:'task.update',id:'t-0001',patch:{dueDate:'2026-02-30'}}], snap)
assert.equal(badDate.accepted.length, 0)
assert.match(badDate.rejected[0].reason, /日期/)

// 起止顺序：start 晚于 due 被拒；正常区间通过
const orderBad = validateActions([{op:'task.update',id:'t-0001',patch:{startDate:'2026-12-01',dueDate:'2026-10-01'}}], snap)
assert.equal(orderBad.accepted.length, 0)
assert.match(orderBad.rejected[0].reason, /开始日期不得晚于/)
const orderOk = validateActions([{op:'task.update',id:'t-0001',patch:{startDate:'2026-10-01',dueDate:'2026-12-01'}}], snap)
assert.equal(orderOk.accepted.length, 1)

// 跨项目：t-0009 不在当前项目 taskIds -> 拒
const cross = validateActions([{op:'task.update',id:'t-0009',patch:{assignee:'x'}}], snap)
assert.equal(cross.accepted.length, 0)

// 过期草稿：渲染时 t-0002 存在 -> 可过；确认时最新集合只剩 t-0001（t-0002 被删），重验应把它剔除
const renderOk = validateActions([{op:'task.update',id:'t-0002',patch:{status:'done'}}], {taskIds:['t-0001','t-0002']})
assert.equal(renderOk.accepted.length, 1)
const confirmLive = validateActions(renderOk.accepted, {taskIds:['t-0001']})
assert.equal(confirmLive.accepted.length, 0, '确认时目标已被删 -> 应剔除')
assert.match(confirmLive.rejected[0].reason, /不存在/)

// record-location 映射：6 类全映射、未知类型回退 null、findRecord 跨项目找不到
assert.equal(resolveRecordLocation('task').view, 'tasks')
assert.equal(resolveRecordLocation('meeting').view, 'meetings')
assert.equal(resolveRecordLocation('bogus'), null)
assert.equal(findRecord({tasks:[{id:'t-1',projectId:'p-1'}]},'task','t-1').projectId, 'p-1')
assert.equal(findRecord({tasks:[]},'task','t-x'), null)

// buildAskContext：含今天锚点、会议行动项、空实体显式"暂无"
const ctx = buildAskContext({
  projectName:'测试', today:'2026-10-12',
  tasks:[{id:'t-1',title:'官网',status:'in_progress',progress:40,dueDate:'2026-10-10'}],
  risks:[{id:'r-1',title:'延期',status:'open',probability:'高',impact:'高'}],
  milestones:[{id:'m-1',title:'上线',targetDate:'2026-11-01',status:'planned'}],
  meetings:[{id:'mt-1',title:'周会',date:'2026-10-11',actions:[{id:'a-1',text:'出原型',status:'todo'}]}],
})
assert.match(ctx, /今天（本地日期）：2026-10-12/)
assert.match(ctx, /已逾期|10-10/) // 截止在今天之前 -> 数据可见
assert.match(ctx, /mt-1/, /出原型/)
assert.match(ctx, /交付物：暂无/) // 缺交付物显式暂无，不推断
assert.match(localToday(new Date(2026,0,5)), /^2026-01-05$/)

console.log('verify-copilot OK（含第1步加固）')

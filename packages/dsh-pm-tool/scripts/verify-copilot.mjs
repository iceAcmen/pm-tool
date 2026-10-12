import assert from 'node:assert'
import { parseCopilotActions, validateActions } from '../lib/core/copilot.js'

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

console.log('verify-copilot OK')

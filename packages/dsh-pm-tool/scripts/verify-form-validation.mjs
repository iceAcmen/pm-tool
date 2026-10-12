/**
 * R3-UX-001 行为测试：项目 / 里程碑表单「受控内联校验」纯函数。
 *
 * 这是**真实行为测试**：直接 import 编译后的纯函数并喂入真实输入、断言真实输出，
 * 不是对源码文本做正则猜测。被测模块 src/client/form-validation.ts 不依赖 React/DOM。
 *
 * 诚实边界（AGENTS ADL-045 / ADL-046）：
 * - 本脚本只覆盖纯逻辑：缺值、无效日历日期、目标早于开始、以及「纠正后错误清空」。
 * - 浏览器侧的 ARIA 接线（aria-required / aria-invalid / aria-describedby）、
 *   内联错误渲染、提交后焦点定位、Enter 与按钮是否同路径，需真实浏览器 GUI 验收，
 *   本 Node 脚本不替代（ADL-045 第 7 条 GUI 实测硬门槛）。
 *
 * 运行：先 `pnpm run build` 生成 lib/，再 `node scripts/verify-form-validation.mjs`。
 */
import assert from 'node:assert/strict'
import {
  isRealIsoDate,
  validateProjectForm,
  validateMilestoneForm,
  firstInvalidField,
} from '../lib/client/form-validation.js'

// ---- isRealIsoDate：真实日历日期，对齐 zod z.iso.date ----
assert.equal(isRealIsoDate('2026-10-13'), true, '正常日期应通过')
assert.equal(isRealIsoDate('2024-02-29'), true, '闰年 2/29 应通过')
assert.equal(isRealIsoDate('2026-02-30'), false, '2/30 不存在，必须拒绝')
assert.equal(isRealIsoDate('2026-13-01'), false, '月份越界，必须拒绝')
assert.equal(isRealIsoDate('2026-1-5'), false, '未补零，必须拒绝')
assert.equal(isRealIsoDate(''), false, '空串不算日期（交给必填规则）')

// ---- 项目表单：缺值要逐字段报错 ----
const emptyProject = validateProjectForm({ name: '', startDate: '', targetDate: '' })
assert.equal(emptyProject.name, '项目名称不能为空')
assert.equal(emptyProject.startDate, '请选择开始日期')
assert.equal(emptyProject.targetDate, '请选择目标日期')

// 全空白也能定位到首个字段：name 先于 startDate 先于 targetDate
assert.equal(firstInvalidField(['name', 'startDate', 'targetDate'], emptyProject), 'name')

// ---- 项目表单：合法输入通过，纠正后错误清空 ----
const good = validateProjectForm({ name: '  官网改版  ', startDate: '2026-10-01', targetDate: '2026-12-31' })
assert.deepEqual(good, {}, '合法项目应无错误（name 允许两端空白）')

// ---- 项目表单：target < start 定位到 targetDate，文案与服务端一致 ----
const reversed = validateProjectForm({ name: '官网改版', startDate: '2026-12-31', targetDate: '2026-10-01' })
assert.equal(reversed.name, undefined)
assert.equal(reversed.startDate, undefined)
assert.equal(reversed.targetDate, '完成日期不得早于开始日期')
assert.equal(firstInvalidField(['name', 'startDate', 'targetDate'], reversed), 'targetDate')

// ---- 项目表单：无效日期报错 ----
const badDate = validateProjectForm({ name: '官网改版', startDate: '2026-02-30', targetDate: '2026-12-31' })
assert.equal(badDate.startDate, '日期须为有效的 YYYY-MM-DD')
assert.equal(badDate.targetDate, undefined, 'target 合法就不背锅')

// 输入纠正：startDate 从不合法改成合法 → 该字段错误消失
const fixed = validateProjectForm({ name: '官网改版', startDate: '2026-10-01', targetDate: '2026-12-31' })
assert.equal(fixed.startDate, undefined, '纠正后开始日期错误应清除')
assert.deepEqual(fixed, {}, '全部纠正后应回到无错误')

// ---- 里程碑表单：title / targetDate 必填 ----
const emptyMilestone = validateMilestoneForm({ title: '', targetDate: '' })
assert.equal(emptyMilestone.title, '里程碑标题不能为空')
assert.equal(emptyMilestone.targetDate, '请选择目标日期')
assert.equal(firstInvalidField(['title', 'targetDate'], emptyMilestone), 'title')

const goodMilestone = validateMilestoneForm({ title: 'Alpha 发布', targetDate: '2026-11-30' })
assert.deepEqual(goodMilestone, {}, '合法里程碑应无错误')

const badMilestoneDate = validateMilestoneForm({ title: 'Alpha', targetDate: '2026-13-01' })
assert.equal(badMilestoneDate.targetDate, '日期须为有效的 YYYY-MM-DD')

console.log('通过：isRealIsoDate 接受真实日历日、拒绝 2/30 与越界/未补零。')
console.log('通过：项目表单缺值逐字段报错、target<start 定位 targetDate、纠正后错误清空。')
console.log('通过：里程碑表单 title/targetDate 必填校验。')
console.log('边界提示：ARIA 接线、内联渲染与焦点定位需真实浏览器 GUI 验收（见 ADL-046）。')

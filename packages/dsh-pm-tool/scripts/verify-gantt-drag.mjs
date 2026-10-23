/**
 * 甘特拖拽手感/成功提示冻结回归（GI-WRITE-06/07、GI-WEB-16~20 的可自动化部分）。
 *
 * v2 落地后：run 仍在 panel.tsx；GanttView 组件与样式搬到 src/client/views/gantt.tsx / gantt.css。
 * 覆盖（全部静态源契约 + 纯函数复核，无需浏览器；真实浏览器 GUI 项由测试专家另判）：
 *  A. 外壳稳定契约：.pm-gantt 为 flex 容器（nowrap），labels 固定 250px，scroll flex:1+min-width:0；
 *     状态行(hint)独立于 .pm-gantt 之外（不再用 flex-basis:100% 挤入，故无「挤没画布」问题）。
 *  B. 成功 quiet：拖拽走 run(..., { quiet: true })；run 签名支持 options；quiet 成功分支
 *     不 setMessage 全字段大 Notice；run 内 refresh 恰好一次；GanttView 无 onSaved 二次刷新。
 *  C. 失败可见：run catch 仍 setMessage；GanttView 失败分支内联『更新失败，请重试』，失败不 refresh。
 *  D. inflight 并发保护：保存中 onPointerDownBar 直接 return；setSaving(true/false) 成对（finally）；
 *     unmount 清理 statusTimer。
 *  E. aria-live 轻量确认：状态行 role=status/aria-live=polite，成功文案『已更新：起 ~ 止』。
 *  F. 拖拽 payload 白名单：shiftDatesByDrag 输出仅 startDate/dueDate 两键（纯函数复核）。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { shiftDatesByDrag } from '../lib/core/gantt.js'
import { verifyCatchFeedback } from './feedback-context-contract.mjs'

const here = import.meta.dirname
const panel = readFileSync(join(here, '..', 'src/client/panel.tsx'), 'utf8')
const ganttSrc = readFileSync(join(here, '..', 'src/client/views/gantt.tsx'), 'utf8')
const ganttCss = readFileSync(join(here, '..', 'src/client/views/gantt.css'), 'utf8')

// ---------- 工具：从标记开始，按花括号抽出一个函数体 ----------
// braceFrom：在标记行内定位函数体开括号的位置（默认取该行最后一个 '{'，规避类型字面量 { quiet?: boolean }）。
function extractBlock(src, startMarker, braceFrom) {
  const start = src.indexOf(startMarker)
  assert.ok(start >= 0, `源码缺少标记：${startMarker}`)
  const lineEnd = src.indexOf('\n', start)
  const line = src.slice(start, lineEnd)
  let braceOpen
  if (braceFrom) braceOpen = start + braceFrom(line)
  else {
    const idx = line.lastIndexOf('{')
    assert.ok(idx >= 0, `标记行内缺少 '{'：${startMarker}`)
    braceOpen = start + idx
  }
  let depth = 0
  for (let i = braceOpen; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0) return src.slice(start, i + 1)
    }
  }
  throw new Error(`花括号未闭合：${startMarker}`)
}

// ---------- A. 外壳稳定契约 ----------
const ganttRoot = extractBlock(ganttCss, '.pm-gantt-root .pm-gantt {')
assert.match(ganttRoot, /display:\s*flex/, '.pm-gantt 为 flex 容器')
assert.match(ganttRoot, /flex-wrap:\s*nowrap/,
  '.pm-gantt 为 nowrap——标签列与画布始终同行；状态行已独立到容器之外，不再需要 wrap')

const labelsBlock = extractBlock(ganttCss, '.pm-gantt-root .pm-gantt-labels {')
// 非 P0 返修：身份列由 220px 加宽到 250px，容纳「标题 + 负责人·状态·进度」两行不截断。
assert.match(labelsBlock, /width:\s*250px/, '.pm-gantt-labels 固定 250px（加宽以容纳副行）')

const scrollBlock = extractBlock(ganttCss, '.pm-gantt-root .pm-gantt-scroll {')
assert.match(scrollBlock, /flex:\s*1/, '.pm-gantt-scroll flex:1 吃满剩余宽')
assert.match(scrollBlock, /min-width:\s*0/, '.pm-gantt-scroll min-width:0（窄窗可压缩、横滚不撑破）')

// 状态行独立于 .pm-gantt 之外（在根容器内、gantt 之后），仅静态断言存在
assert.match(ganttSrc, /<p className="pm-gantt-hint" role="status" aria-live="polite">/,
  '状态行(hint)独立于 .pm-gantt 之外，带 role=status/aria-live')

// ---------- B. 成功 quiet + 单 refresh ----------
assert.match(panel, /const run = async \(line: string, options\?: \{ quiet\?: boolean \}\): Promise<boolean> => \{/,
  'run 必须带 options 形参（quiet 专用执行）')
const runBlock = extractBlock(panel, 'const run = async (line: string, options?: { quiet?: boolean }): Promise<boolean> => {')
assert.match(runBlock, /await execute\(line\)/, 'run 仍执行命令本体')
assert.match(runBlock, /await refresh\(\)/, 'quiet 成功仍 refresh 一次（就地更新，无需 F5）')
assert.match(runBlock, /if \(!options\?\.quiet\) setMessage\(response\)/,
  'quiet 成功分支不得 setMessage 全字段大 Notice；非 quiet 语义不变')
assert.equal((runBlock.match(/await refresh\(\)/g) ?? []).length, 1,
  'run 体内 refresh() 恰好一次（避免 run + onSaved 双刷新）')
// O3：成功与否由 commandAccepted(response) 判定并返回 accepted 布尔；
// 旧的「成功即字面返回 true」假设已失效（业务拒绝走 accepted=false），这里按行为契约断言，不绑定字面量。
assert.match(runBlock, /const accepted = commandAccepted\(response\)/,
  'run 成功判定走 commandAccepted(response)（业务拒绝/错误文本未 throw 不算成功）')
assert.match(runBlock, /return accepted/, 'run 返回 accepted 布尔（被接受=true，被拒=false）')
assert.match(runBlock, /catch \(error\)[\s\S]*return false/,
  'run catch 必须 return false——失败不得冒充成功（配合 setMessage 就近/全局可见）')

// 当前落库契约：统一走 commitDates(id, payload, okText) → run(`task update ${id} ${JSON.stringify(payload)}`, { quiet: true })
const commitBlock = extractBlock(ganttSrc, 'const commitDates = async (id: string, payload: { startDate?: string, dueDate?: string }, okText: string) => {')
assert.match(commitBlock, /await run\(`task update \$\{id\} \$\{JSON\.stringify\(payload\)\}`, \{ quiet: true \}\)/,
  'commitDates 必须走 quiet 执行（不弹全字段 Notice），并经既有 task update 通道')
// payload 白名单：commitDates 形参仅声明 startDate/dueDate，不得携带 progress/predecessorIds/status/assignee
assert.match(commitBlock, /payload: \{ startDate\?: string, dueDate\?: string \}/,
  'commitDates payload 类型仅允许 startDate/dueDate（白名单）')
// 拖拽成功后不再 onSaved()
assert.doesNotMatch(ganttSrc, /if \(ok\) onSaved\(\)/,
  '拖拽成功后不得再 onSaved()（run-quiet 已 refresh 一次）')
// GanttView 不声明 onSaved prop
const ganttFnStart = ganttSrc.indexOf('export function GanttView(')
assert.ok(ganttFnStart >= 0, '应存在 GanttView')
const ganttSigEnd = ganttSrc.indexOf('}) {', ganttFnStart)
const ganttSignature = ganttSrc.slice(ganttFnStart, ganttSigEnd)
assert.doesNotMatch(ganttSignature, /onSaved/, 'GanttView 不应声明 onSaved prop（单 refresh 闭环）')

// ---------- C. 失败可见（不吞错误 + 内联错误态） ----------
verifyCatchFeedback(panel, join(here, '..'))
assert.match(ganttSrc, /更新失败，请重试/,
  '拖拽失败必须有内联错误态文案（不得静默成功、不得假装已更新）')
const onUpBlock = extractBlock(ganttSrc, 'const onPointerUpBar = async')
assert.doesNotMatch(onUpBlock, /refresh\(\)/, '失败分支不得 refresh（条体保持原坐标，快照不变）')

// ---------- D. inflight 并发保护 + timer 清理 ----------
// saving 状态在统一落库封装 commitDates 内翻转（拖拽/缩放/键盘微调共用），不在 onPointerUpBar。
assert.match(commitBlock, /setSaving\(true\)/, '保存开始必须置 saving（commitDates 内）')
assert.match(commitBlock, /finally[\s\S]*setSaving\(false\)/,
  '保存结束（无论成败）必须 setSaving(false) 解锁；finally 防漏（commitDates 内）')
const onDownBlock = extractBlock(ganttSrc, 'const onPointerDownBar =')
assert.match(onDownBlock, /if \(saving \|\| disabled\) return/,
  '保存中/禁用态必须拒绝新 pointerdown——阻止并发连拖覆盖同一任务')
assert.match(ganttSrc, /useEffect\(\(\) => \(\) => \{[\s\S]*clearTimeout/,
  'GanttView unmount 必须 clearTimeout——快速连续操作不得有陈旧定时器覆盖状态')
assert.match(ganttSrc, /statusTimer/, '应使用 statusTimer ref 管理自动清除定时器')

// ---------- E. aria-live 轻量确认 ----------
assert.match(ganttSrc, /已更新：\$\{next\.startDate\} ~ \$\{next\.dueDate\}/,
  '成功文案应为轻量「已更新：起 ~ 止」（状态行，非全屏大卡）')
assert.match(ganttSrc, /role="status"/, '甘特状态行应带 role="status"')
assert.match(ganttSrc, /aria-live="polite"/, '甘特状态行应带 aria-live="polite"')

// ---------- F. 拖拽 payload 白名单（纯函数复核） ----------
const shifted = shiftDatesByDrag('2026-10-01', '2026-10-03', 32, 16)
assert.deepEqual(Object.keys(shifted).sort(), ['dueDate', 'startDate'],
  '拖拽 payload 必须仅 startDate/dueDate 两键（不动 progress/predecessorIds/status/assignee）')
assert.deepEqual(shifted, { startDate: '2026-10-03', dueDate: '2026-10-05' })

console.log('verify-gantt-drag OK：外壳稳定契约 / quiet 成功 / 失败可见 / 单 refresh / inflight 禁拖 / timer 清理 / aria-live / 白名单齐备。')

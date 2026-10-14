/**
 * v0.7.2 拖拽手感/成功提示冻结回归（GI-WRITE-06/07、GI-WEB-16~20 的可自动化部分）。
 *
 * 覆盖（全部静态源契约 + 纯函数复核，无需浏览器；真实浏览器 GUI 项由测试专家另判）：
 *  A. CSS 首行宽度契约：.pm-gantt 必须 flex-wrap:wrap，使 .pm-gantt-hint(flex-basis:100%)
 *     独占下一行；labels 固定 230px、scroll flex:1+min-width:0，hint 出现/消失时首行宽度
 *     稳定（根因：nowrap 时 hint basis100% 把 scroll 挤为 0，画布宽消失）。
 *  B. 成功 quiet：拖拽走 run(..., { quiet: true })；run 签名支持 options；quiet 成功分支
 *     不 setMessage 全字段大 Notice；拖拽成功后不再 onSaved() 二次 refresh（单 refresh）。
 *  C. 失败可见：run catch 仍 setMessage（全局错误不被 quiet 吞掉）；GanttView 失败分支
 *     内联『更新失败，请重试』，条体从未本地改动（清 preview 后保持原坐标）。
 *  D. inflight 并发保护：保存中 onPointerDownBar 直接 return（禁拖），setSaving(true/false)
 *     成对；unmount useEffect 清理 statusTimer，快速连续操作无陈旧定时器覆盖。
 *  E. aria-live 轻量确认：hint 行带 role=status/aria-live=polite，成功文案『已更新：起 ~ 止』。
 *  F. 拖拽 payload 白名单：shiftDatesByDrag 输出仅 startDate/dueDate 两键（纯函数复核）。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { shiftDatesByDrag } from '../lib/core/gantt.js'

const here = import.meta.dirname
const panel = readFileSync(join(here, '..', 'src/client/panel.tsx'), 'utf8')
const css = readFileSync(join(here, '..', 'src/client/panel.css'), 'utf8')

// ---------- 工具：按花括号抽出一个顶层函数/方法体 ----------
function extractBlock(src, startMarker) {
  const start = src.indexOf(startMarker)
  assert.ok(start >= 0, `源码缺少标记：${startMarker}`)
  const braceOpen = src.indexOf('{', start)
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

// ---------- A. CSS 首行宽度契约 ----------
const ganttRoot = extractBlock(css, '.pm-gantt {')
assert.match(ganttRoot, /display:\s*flex/, '.pm-gantt 仍为 flex 容器')
assert.match(ganttRoot, /flex-wrap:\s*wrap/,
  '.pm-gantt 必须 flex-wrap:wrap——否则 hint(flex-basis:100%) 与 labels/scroll 同行，把 scroll 挤为 0、画布宽消失')

const labelsBlock = extractBlock(css, '.pm-gantt-labels {')
assert.match(labelsBlock, /flex:\s*0 0 230px/, '.pm-gantt-labels 必须固定 230px basis（首行左侧宽度稳定）')

const scrollBlock = extractBlock(css, '.pm-gantt-scroll {')
assert.match(scrollBlock, /flex:\s*1/, '.pm-gantt-scroll 必须 flex:1 吃满首行剩余宽')
assert.match(scrollBlock, /min-width:\s*0/, '.pm-gantt-scroll 必须 min-width:0（窄窗可压缩、横滚不撑破）')

const hintBlock = extractBlock(css, '.pm-gantt-hint {')
assert.match(hintBlock, /flex-basis:\s*100%/, '.pm-gantt-hint 保持 flex-basis:100%（配合 wrap 独占下一行）')

// ---------- B. 成功 quiet + 单 refresh ----------
// run 签名支持 options（quiet）
assert.match(panel, /const run = async \(line: string, options/, 'run 必须增加 options 形参（quiet 专用执行）')
// 抽取起点必须落到函数体开括号（=> {），避免把类型注解 { quiet?: boolean } 误当函数体
const runBlock = extractBlock(panel, '): Promise<boolean> => {')
assert.match(runBlock, /await execute\(line\)/, 'run 仍执行命令本体')
assert.match(runBlock, /await refresh\(\)/, 'quiet 成功仍 refresh 一次（GI-WEB-16 就地更新，无需 F5）')
assert.match(runBlock, /if \(!options\?\.quiet\)\s*setMessage\(response\)/,
  'quiet 成功分支不得 setMessage 全字段大 Notice；非 quiet 语义不变')
// 单 refresh：run 体内 refresh() 恰好一次（拖拽后 onSaved 不得再刷）
assert.equal((runBlock.match(/await refresh\(\)/g) ?? []).length, 1,
  'run 体内 refresh() 必须恰好一次（避免 run + onSaved 双刷新）')
assert.match(runBlock, /return true/, 'run 成功返回 true')

// 拖拽调用带 quiet
assert.match(panel, /run\(`task update \$\{task\.id\} \$\{JSON\.stringify\(next\)\}`, \{ quiet: true \}\)/,
  '甘特拖拽落库必须走 quiet 执行（不弹全字段 Notice）')
// 旧的二次刷新已移除：拖拽成功后不得再 onSaved()
assert.doesNotMatch(panel, /if \(ok\) onSaved\(\)/,
  '拖拽成功后不得再 onSaved()（run-quiet 已 refresh 一次，双刷必须消除）')
// GanttView 不再接收/依赖 onSaved prop（整段签名，含类型注解）
const ganttFnStart = panel.indexOf('function GanttView(')
assert.ok(ganttFnStart >= 0, '应存在 GanttView')
const ganttSigEnd = panel.indexOf('}) {', ganttFnStart)
const ganttSignature = panel.slice(ganttFnStart, ganttSigEnd)
assert.doesNotMatch(ganttSignature, /onSaved/, 'GanttView 不应再声明 onSaved prop（单 refresh 闭环）')

// ---------- C. 失败可见（不吞错误 + 内联错误态） ----------
assert.match(runBlock, /catch \(error\)[\s\S]*setMessage\(error/,
  'run catch 必须仍 setMessage——quiet 不得吞掉全局错误提示')
// 从函数体开括号抽取（标记末尾即 `{`，避开解构参数/类型注解的花括号）
const ganttViewBlock = extractBlock(panel, 'onEdit?: (task: Task) => void\n}) {')
assert.match(ganttViewBlock, /更新失败，请重试/,
  '拖拽失败必须有内联错误态文案（不得静默成功、不得假装已更新）')
// 失败分支不调用 refresh：onPointerUpBar 的 else 分支无 refresh/onSaved
const onUpBlock = extractBlock(ganttViewBlock, 'const onPointerUpBar = async')
assert.doesNotMatch(onUpBlock, /refresh\(\)/, '失败分支不得 refresh（条体保持原坐标，快照不变）')

// ---------- D. inflight 并发保护 + timer 清理 ----------
assert.match(onUpBlock, /setSaving\(true\)/, '保存开始必须置 saving')
assert.match(onUpBlock, /finally[\s\S]*setSaving\(false\)/,
  '保存结束（无论成败）必须 setSaving(false) 解锁；finally 防漏')
const onDownBlock = extractBlock(ganttViewBlock, 'const onPointerDownBar =')
assert.match(onDownBlock, /if \(saving\) return/,
  '保存中必须拒绝新 pointerdown——阻止并发连拖覆盖同一任务')
// unmount 清理定时器
assert.match(ganttViewBlock, /useEffect\(\(\) => \(\) => \{[\s\S]*clearTimeout/,
  'GanttView unmount 必须 clearTimeout——快速连续操作不得有陈旧定时器覆盖状态')
assert.match(ganttViewBlock, /statusTimer/, '应使用 statusTimer ref 管理自动清除定时器')

// ---------- E. aria-live 轻量确认 ----------
assert.match(ganttViewBlock, /已更新：\$\{next\.startDate\} ~ \$\{next\.dueDate\}/,
  '成功文案应为轻量「已更新：起 ~ 止」（条下/状态行，非全屏大卡）')
assert.match(ganttViewBlock, /role="status"/, '甘特状态行应带 role="status"')
assert.match(ganttViewBlock, /aria-live="polite"/, '甘特状态行应带 aria-live="polite"')

// ---------- F. 拖拽 payload 白名单（纯函数复核） ----------
const shifted = shiftDatesByDrag('2026-10-01', '2026-10-03', 32, 16)
assert.deepEqual(Object.keys(shifted).sort(), ['dueDate', 'startDate'],
  '拖拽 payload 必须仅 startDate/dueDate 两键（不动 progress/predecessorIds/status/assignee）')
assert.deepEqual(shifted, { startDate: '2026-10-03', dueDate: '2026-10-05' })

console.log('verify-gantt-drag OK：CSS 首行宽度契约 / quiet 成功 / 失败可见 / 单 refresh / inflight 禁拖 / timer 清理 / aria-live / 白名单齐备。')

/**
 * GUI 静态契约（无需浏览器）：断言面板与命令入口源码含 v2 业务所需钩子。
 * 覆盖 V2-B5/E5/F7 的静态部分（真实浏览器渲染仍走人工用例）。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const panel = readFileSync(join(import.meta.dirname, '..', 'src/client/panel.tsx'), 'utf8')
const index = readFileSync(join(import.meta.dirname, '..', 'src/index.ts'), 'utf8')
const formValidation = readFileSync(join(import.meta.dirname, '..', 'src/client/form-validation.ts'), 'utf8')

// TaskForm：前置多选（同项目、排除自指）
assert.match(panel, /name="predecessorIds"/, 'TaskForm 应提供前置依赖多选')
// B1：锁定真实 TaskRow 行内 chip 选择器（data-waiting-predecessor），而非表单 label 假命中。
assert.match(panel, /data-waiting-predecessor/, 'TaskRow 行内应渲染 data-waiting-predecessor 等待前置 chip')
assert.match(panel, /blockingPredecessors\(task, tasksById\)/, 'TaskRow 应经 blockingPredecessors 纯派生等待前置')
// ProjectForm：repo/branch 输入
assert.match(panel, /name="repoUrl"/, 'ProjectForm 应提供仓库地址输入')
assert.match(panel, /name="branch"/, 'ProjectForm 应提供分支输入')
// Overview：健康灯卡 + repo 外链
assert.match(panel, /pm-health-card/, 'Overview 应渲染健康卡')
assert.match(panel, /data-lamp/, 'Overview 健康卡应带 data-lamp 灯号属性')
assert.match(panel, /data-repo-link/, 'Overview 应渲染 repo 链接行')
assert.match(panel, /target="_blank"/, 'repo 外链应新标签打开')
// form-validation：repo/branch 内联校验
assert.match(formValidation, /repoUrlPattern|repoUrl/, 'form-validation 应校验仓库地址')
assert.match(formValidation, /branchPattern|branch/, 'form-validation 应校验分支')
// 命令注册：/pm doctor 与 /pm health
assert.match(index, /health/i, 'index 应分发 /pm health')
assert.match(index, /doctor/i, 'index 应分发 /pm doctor')

// ---------- 甘特信息增强静态契约（GI-WEB/GI-COLLAB 的非 GUI 部分） ----------
const ganttCore = readFileSync(join(import.meta.dirname, '..', 'src/core/gantt.ts'), 'utf8')
const ganttCss = readFileSync(join(import.meta.dirname, '..', 'src/client/panel.css'), 'utf8')

// GI-WEB-07：任务条为可聚焦控件（tabIndex + role + aria-label），键盘 Enter 开抽屉
assert.match(panel, /tabIndex=\{0\}/, '甘特条应可聚焦 tabIndex=0')
assert.match(panel, /aria-label=\{aria\}/, '甘特条应带描述性 aria-label（名称/起止/工期/进度/前置）')
assert.match(panel, /e\.key === 'Enter' \|\| e\.key === ' '/, '甘特条键盘 Enter/Space 应打开详情抽屉')
// GI-WEB-01：起止日期直显（条内/外置双形态）
assert.match(panel, /pm-gantt-bar-dates/, '甘特条应直显起止日期（条内形态）')
assert.match(panel, /pm-gantt-bar-side/, '窄条日期应外置到条右侧（不溢出）')
// GI-WEB-02：进度双层填充 + 可读百分比
assert.match(panel, /pm-gantt-bar-progress/, '甘特条应有进度填充层')
assert.match(panel, /pm-gantt-bar-pct/, '甘特条应有可读百分比文本')
// GI-WEB-03：FS 依赖 SVG 箭头层
assert.match(panel, /pm-gantt-links/, '甘特画布应渲染 SVG 依赖线层')
assert.match(panel, /pm-gantt-link-arrow/, '依赖线应带箭头（前置→后继方向）')
// GI-WEB-10/本地时区：今日线用本地日期 localTodayIso
assert.match(panel, /localTodayIso\(\)/, '甘特今日线应使用本地日期 localTodayIso（避免 UTC 偏移）')
// GI-WRITE：拖拽落库走既有 task update 通道（payload 白名单在 verify-gantt.mjs 纯函数层断言）
assert.match(panel, /task update \$\{task\.id\} \$\{JSON\.stringify\(next\)\}/, '拖拽落库应走既有 task update 通道')
// GI-COLLAB-01：派生模块零写命令
assert.doesNotMatch(ganttCore, /\brun\s*\(/, 'core/gantt.ts 纯派生不得含 run( 写命令')
assert.doesNotMatch(ganttCore, /\bexecute\s*\(/, 'core/gantt.ts 纯派生不得含 execute( 写命令')
// GI-WEB-13 / §0.8：甘特色值只走宿主语义变量，不硬编码 hex
const ganttBlock = ganttCss.slice(ganttCss.indexOf('.pm-gantt'))
assert.doesNotMatch(ganttBlock, /#[0-9a-fA-F]{3,6}\b/, '甘特 CSS 块不得出现硬编码 hex 色值')
assert.match(ganttCss, /--pm-accent:\s*var\(--dsw-alias-state-business-primary\)/, '应定义 --pm-accent 语义变量别名')
// 0% 进度条可读：条必须有 1px 语义边框且 border-box 保几何（浅/深主题均不隐形）
assert.match(ganttBlock, /\.pm-gantt-bar\s*\{[^}]*border:\s*1px/, '甘特条应有 1px 语义 accent 边框（0% track 可辨）')
assert.match(ganttBlock, /\.pm-gantt-bar\s*\{[^}]*box-sizing:\s*border-box/, '甘特条应 box-sizing: border-box（边框不撑变几何）')
// 父任务日期口径统一：左标签/画布条/ARIA 同走 effectiveRange（父=子 min~max 只读派生）
assert.match(panel, /const effectiveRange = \(t: Task\)/, 'GanttView 应定义 effectiveRange 统一口径 helper')
assert.match(panel, /const er = effectiveRange\(t\)/, '左标签日期应取 effectiveRange（与派生父条一致）')
assert.match(panel, /renderBar\(t, range\)/, '画布条应取 effectiveRange（父=子 min~max 派生，不读自身存储日期）')

console.log('通过：面板前置多选、repo/branch 表单、Overview 健康灯与 repo 链接、/pm doctor 与 /pm health 静态钩子齐备；甘特可聚焦/直显/进度层/依赖箭头/本地今日线/零写契约齐备。')

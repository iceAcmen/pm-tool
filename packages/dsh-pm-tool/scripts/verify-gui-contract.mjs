/**
 * GUI 静态契约（无需浏览器）：断言面板、重设计视图与命令入口源码含 v2 业务所需钩子。
 * 覆盖 V2-B5/E5/F7 的静态部分（真实浏览器渲染仍走人工用例）。
 *
 * v2 落地后：
 *  - 表单/run 仍在 panel.tsx；
 *  - 等待前置 chip 在 views/tasks.tsx；
 *  - 健康环/repo 链接在 views/overview.tsx；
 *  - 甘特组件与样式在 views/gantt.tsx / gantt.css。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(import.meta.dirname, '..')
const panel = readFileSync(join(dir, 'src/client/panel.tsx'), 'utf8')
const tasksView = readFileSync(join(dir, 'src/client/views/tasks.tsx'), 'utf8')
const overviewView = readFileSync(join(dir, 'src/client/views/overview.tsx'), 'utf8')
const ganttView = readFileSync(join(dir, 'src/client/views/gantt.tsx'), 'utf8')
const ganttCss = readFileSync(join(dir, 'src/client/views/gantt.css'), 'utf8')
const panelCss = readFileSync(join(dir, 'src/client/panel.css'), 'utf8')
const index = readFileSync(join(dir, 'src/index.ts'), 'utf8')
const formValidation = readFileSync(join(dir, 'src/client/form-validation.ts'), 'utf8')
const ganttCore = readFileSync(join(dir, 'src/core/gantt.ts'), 'utf8')

// TaskForm：前置多选（同项目、排除自指）
assert.match(panel, /name="predecessorIds"/, 'TaskForm 应提供前置依赖多选')
// B1：行内等待前置 chip（data-waiting-predecessor），在重设计任务页
assert.match(tasksView, /data-waiting-predecessor/, '任务行内应渲染 data-waiting-predecessor 等待前置 chip')
assert.match(tasksView, /blockingPredecessors\(\w+, \w+\)/, '任务行应经 blockingPredecessors 纯派生等待前置')
// ProjectForm：repo/branch 输入
assert.match(panel, /name="repoUrl"/, 'ProjectForm 应提供仓库地址输入')
assert.match(panel, /name="branch"/, 'ProjectForm 应提供分支输入')
// Overview：健康环（hero 内，根节点 data-lamp）+ repo 外链
assert.match(overviewView, /ov-ring-svg/, 'Overview 应渲染健康环（hero 内）')
assert.match(overviewView, /data-lamp/, 'Overview 根节点应带 data-lamp 灯号属性')
assert.match(overviewView, /data-repo-link/, 'Overview 应渲染 repo 链接卡')
assert.match(overviewView, /target="_blank"/, 'repo 外链应新标签打开')
// form-validation：repo/branch 内联校验
assert.match(formValidation, /repoUrlPattern|repoUrl/, 'form-validation 应校验仓库地址')
assert.match(formValidation, /branchPattern|branch/, 'form-validation 应校验分支')
// 命令注册：/pm doctor 与 /pm health
assert.match(index, /health/i, 'index 应分发 /pm health')
assert.match(index, /doctor/i, 'index 应分发 /pm doctor')

// ---------- 甘特信息增强静态契约（GI-WEB/GI-COLLAB 的非 GUI 部分） ----------
// GI-WEB-07：任务条为可聚焦控件（tabIndex + role + aria-label），键盘 Enter 开抽屉
assert.match(ganttView, /tabIndex=\{0\}/, '甘特条应可聚焦 tabIndex=0')
assert.match(ganttView, /aria-label=\{aria\}/, '甘特条应带描述性 aria-label（名称/起止/工期/进度/前置）')
assert.match(ganttView, /e\.key === 'Enter' \|\| e\.key === ' '/, '甘特条键盘 Enter/Space 应打开详情抽屉')
// GI-WEB-01：起止日期直显（条内/外置双形态）
assert.match(ganttView, /pm-gantt-bar-dates/, '甘特条应直显起止日期（条内形态）')
assert.match(ganttView, /pm-gantt-bar-side/, '窄条日期应外置到条右侧（不溢出）')
// GI-WEB-02：进度双层填充 + 可读百分比
assert.match(ganttView, /pm-gantt-bar-progress/, '甘特条应有进度填充层')
assert.match(ganttView, /pm-gantt-bar-pct/, '甘特条应有可读百分比文本')
// GI-WEB-03：FS 依赖 SVG 箭头层
assert.match(ganttView, /pm-gantt-links/, '甘特画布应渲染 SVG 依赖线层')
assert.match(ganttView, /pm-gantt-link-arrow/, '依赖线应带箭头（前置→后继方向）')
// GI-WEB-10/本地时区：今日线用本地日期 localTodayIso
assert.match(ganttView, /localTodayIso\(\)/, '甘特今日线应使用本地日期 localTodayIso（避免 UTC 偏移）')
// GI-WRITE：拖拽落库走既有 task update 通道（payload 白名单在 verify-gantt.mjs 纯函数层断言）
assert.match(ganttView, /task update \$\{task\.id\} \$\{JSON\.stringify\(next\)\}/, '拖拽落库应走既有 task update 通道')
// GI-COLLAB-01：core/gantt.ts 纯派生零写命令
assert.doesNotMatch(ganttCore, /\brun\s*\(/, 'core/gantt.ts 纯派生不得含 run( 写命令')
assert.doesNotMatch(ganttCore, /\bexecute\s*\(/, 'core/gantt.ts 纯派生不得含 execute( 写命令')
// GI-WEB-13 / §0.8：甘特 CSS 不得硬编码 hex 色值
assert.doesNotMatch(ganttCss, /#[0-9a-fA-F]{3,6}\b/, '甘特 CSS 不得出现硬编码 hex 色值')
// 宿主仍定义 --pm-accent 语义变量别名
assert.match(panelCss, /--pm-accent:\s*var\(--dsw-alias-state-business-primary\)/, '应定义 --pm-accent 语义变量别名')
// 0% 进度条可读：条有 1px 语义边框且 border-box 保几何（浅/深主题均不隐形）
assert.match(ganttCss, /\.pm-gantt-bar\s*\{[^}]*border:\s*1px/, '甘特条应有 1px 语义边框（0% track 可辨）')
assert.match(ganttCss, /\.pm-gantt-bar\s*\{[^}]*box-sizing:\s*border-box/, '甘特条应 box-sizing: border-box（边框不撑变几何）')
// 父任务日期口径统一：左标签/画布条/ARIA 同走 effectiveRange（父=子 min~max 只读派生）
assert.match(ganttView, /const effectiveRange = \(t: Task\)/, 'GanttView 应定义 effectiveRange 统一口径 helper')
assert.match(ganttView, /const er = effectiveRange\(t\)/, '左标签日期应取 effectiveRange（与派生父条一致）')
assert.match(ganttView, /renderBar\(t, range\)/, '画布条应取 effectiveRange（父=子 min~max 派生，不读自身存储日期）')

// ---------- GI-CP-01 关键路径只读高亮静态钩子 ----------
assert.match(ganttView, /criticalPath\(tasks\)/, '甘特应调用 core criticalPath 纯派生计算关键路径')
assert.match(ganttView, /pm-gantt-bar--critical/, '关键任务条应带 pm-gantt-bar--critical 高亮 class')
assert.match(ganttView, /pm-gantt-link-path--critical/, '关键依赖边应带 pm-gantt-link-path--critical 描边 class')
assert.match(ganttView, /pm-gantt-legend/, '甘特应渲染关键路径图例说明')
assert.match(ganttView, /循环不可计算|成环/, '成环降级应有「循环不可计算」诚实提示')
assert.match(ganttView, /缺日期/, '缺日期降级应有诚实提示（不自动补日期）')

// ---------- #21 口径配置化静态契约 ----------
const settingsCore = readFileSync(join(dir, 'src/core/settings.ts'), 'utf8')
const overviewView2 = overviewView
const peopleView = readFileSync(join(dir, 'src/client/views/people.tsx'), 'utf8')
assert.match(index, /settings:\s*readProjectSettings\(domain\)/, 'web snapshot 应透传归一化 settings')
assert.match(panel, /kind: 'settings'/, 'panel 应注册口径设置 drawer')
assert.match(panel, /function SettingsPanel/, 'panel 应定义 SettingsPanel 组件')
assert.match(panel, /settings put /, 'SettingsPanel 应经 settings put 保存口径')
assert.match(panel, /settings reset/, 'SettingsPanel 应提供 settings reset 恢复默认')
assert.match(panel, /口径设置/, '应有「口径设置」入口文案')
assert.match(overviewView2, /settings\?: ProjectSettings/, 'Overview 应接收 settings prop')
assert.match(peopleView, /settings\?: ProjectSettings/, 'PeopleView 应接收 settings prop')
// 口径 core 零写：不得含 run/execute/fs 写命令
assert.doesNotMatch(settingsCore, /\brun\s*\(/, 'core/settings.ts 纯模型不得含 run(')
assert.doesNotMatch(settingsCore, /\bexecute\s*\(/, 'core/settings.ts 纯模型不得含 execute(')
assert.doesNotMatch(settingsCore, /writeFile|node:fs/, 'core/settings.ts 纯模型不得含 fs 写')
// 设置面板样式只走宿主 token 别名（--pm-* 由 panel.css 从 --dsw-* 重映射），不写死 hex
const settingsStart = panelCss.indexOf('.pm-settings-root')
assert.ok(settingsStart >= 0, 'panel.css 应定义 .pm-settings-root')
const settingsCss = panelCss.slice(settingsStart, settingsStart + 1600)
assert.ok(settingsCss.includes('var(--pm-'), '设置面板 CSS 应使用 --pm-* 宿主别名 token')
assert.doesNotMatch(settingsCss, /#[0-9a-fA-F]{3,6}\b/, '设置面板 CSS 不得硬编码 hex')
// 默认值常量必须来自配置化前硬编码（健康分 3/4/6/10/8、封顶 15/12/20/16、灯线 80/60、窗口 7、过载 5）
for (const [k, v] of [['healthOverduePer', 3], ['healthBlockedPer', 4], ['healthHighRiskPer', 6], ['healthCriticalRiskPer', 10], ['healthOverdueMilestonePer', 8], ['healthCapOverdueTasks', 15], ['healthCapBlockedTasks', 12], ['healthCapOpenRisk', 20], ['healthCapOverdueMilestones', 16], ['healthGreenAt', 80], ['healthYellowAt', 60], ['reminderWithinDays', 7], ['loadOverloadThreshold', 5]]) {
  assert.match(settingsCore, new RegExp(`${k}:\\s*${v}\\b`), `默认值 ${k}=${v} 应锁定在 settings.ts`)
}

console.log('通过：表单前置多选/repo/branch、任务页等待前置、概览健康环与 repo 链接、/pm doctor 与 /pm health 静态钩子齐备；甘特可聚焦/直显/进度层/依赖箭头/本地今日线/零写契约齐备。')

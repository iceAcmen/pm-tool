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

console.log('通过：面板前置多选、repo/branch 表单、Overview 健康灯与 repo 链接、/pm doctor 与 /pm health 静态钩子齐备。')

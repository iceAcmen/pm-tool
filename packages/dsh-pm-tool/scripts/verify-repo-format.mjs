/**
 * S3 专项：repoUrl/branch 单一真源（core/repo-format 纯模块）三端同 fixture 同判同文案。
 *
 * 验收口径（S3-A1 / S3-I1）：
 *  - 真源在 core/repo-format.ts：无 zod、无 DOM、可进浏览器 bundle；core/repo.ts 只在其上包 zod。
 *  - 同一组合法/非法 fixture：client 表单 repoFieldErrors 与 core 纯谓词 repoFieldErrorsPure
 *    接受集合一致、拒绝集合一致、中文错误逐字同源；zod superRefine 收集的 issue 文案也是同一串。
 *  - 静态防漂移：src/client/form-validation.ts 不得再自抄 repoUrlPattern/branchPattern 正则；
 *    编译产物 lib/client/form-validation.js 不得引用 zod 或 core/repo.js（schema 层），
 *    只能引用 core/repo-format.js——从结构上杜绝 zod/server 被打进 client bundle。
 *  - formatRepoRef / omitEmptyRepoKeys 渲染与空值归一三级共用。
 *
 * 运行：先 `pnpm run build` 生成 lib/，再 `node scripts/verify-repo-format.mjs`。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const readSrc = (rel) => readFileSync(join(here, '..', rel), 'utf8')

// ---- 被测纯模块（S3 新增；尚未实现时本 import 即红灯）----
import {
  repoUrlPattern,
  branchPattern,
  isValidRepoUrl,
  isValidBranch,
  repoUrlInvalidMessage,
  branchInvalidMessage,
  repoFieldLabels,
  repoFieldErrorsPure,
  omitEmptyRepoKeys,
  formatRepoRef,
  repoFieldHelpPhrase,
} from '../lib/core/repo-format.js'

// client 表单层（必须委托同一真源，行为不得漂移）。
import { repoFieldErrors } from '../lib/client/form-validation.js'
// zod schema 层（服务端）。
import { validateRepoRelation, repoUrlFieldSchema, branchFieldSchema } from '../lib/core/repo.js'

// ---- 同一组 fixture：合法三形 + 常见非法 ----
const validUrls = ['https://github.com/org/repo.git', 'git://gitlab.com/org/repo', 'git@github.com:org/repo.git']
const invalidUrls = ['not a url', '中文仓库', 'ftp://host/r.git', 'https://', 'https:// example.com/r.git']
const validBranches = ['main', 'develop', 'feature/x-1', 'release/1.0']
const invalidBranches = ['bad~branch', 'x y', 'x'.repeat(65), '-leading', 'a b']

// 1) 纯谓词接受/拒绝集合与正则字面量一致。
for (const u of validUrls) assert.equal(isValidRepoUrl(u), true, `合法 repoUrl 应通过：${u}`)
for (const u of invalidUrls) assert.equal(isValidRepoUrl(u), false, `非法 repoUrl 必须拒绝：${u}`)
for (const b of validBranches) assert.equal(isValidBranch(b), true, `合法 branch 应通过：${b}`)
for (const b of invalidBranches) assert.equal(isValidBranch(b), false, `非法 branch 必须拒绝：${b}`)
// 留空合法（可选字段）。
for (const empty of ['', '   ', undefined]) {
  assert.equal(isValidRepoUrl(empty), true, '空 repoUrl 应通过（可选）')
  assert.equal(isValidBranch(empty), true, '空 branch 应通过（可选）')
}
// 正则字面量本身就是真源（纯模块导出）。
assert.equal(repoUrlPattern.source, /^(https?:\/\/[^\s/$.?#].[^\s]*|git:\/\/[^\s/$.?#].[^\s]*|git@[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+(?:\/[^\s]*))$/.source)
assert.equal(branchPattern.source, /^[A-Za-z0-9._][A-Za-z0-9._/-]{0,63}$/.source)

// 2) 三端同 fixture 同判同文案：client 表单 vs core 纯函数 vs zod superRefine。
const cases = []
for (const u of [...validUrls, ...invalidUrls, '', '   ']) {
  for (const b of [...validBranches, ...invalidBranches, '', '   ']) {
    cases.push([u, b])
  }
}
for (const [u, b] of cases) {
  const clientErrors = repoFieldErrors(u, b)
  const pureErrors = repoFieldErrorsPure(u, b)
  assert.deepEqual(clientErrors, pureErrors,
    `client 表单与 core 纯函数判定必须一致：${JSON.stringify({ u, b })} -> client=${JSON.stringify(clientErrors)} pure=${JSON.stringify(pureErrors)}`)
  // zod 层：字段级 .trim() 先于对象 superRefine 运行，故这里传 trim 后值（镜像真实 parse 顺序）。
  const issues = []
  validateRepoRelation({ repoUrl: (u ?? '').trim(), branch: (b ?? '').trim() }, { addIssue: (i) => issues.push(i) })
  for (const issue of issues) {
    if (issue.path[0] === 'repoUrl') assert.equal(issue.message, repoUrlInvalidMessage, 'zod repoUrl 文案必须等于真源中文')
    if (issue.path[0] === 'branch') assert.equal(issue.message, branchInvalidMessage, 'zod branch 文案必须等于真源中文')
  }
  const zodMessages = issues.map(i => i.message).sort().join('|')
  const pureMessages = Object.values(pureErrors).sort().join('|')
  assert.equal(zodMessages, pureMessages,
    `zod 与纯函数错误集合必须同源：${JSON.stringify({ u, b })} zod=${zodMessages} pure=${pureMessages}`)
}

// 3) 中文文案常量就是三级 describe*Validation 用的标签来源。
assert.equal(repoFieldLabels.repoUrl, '仓库地址（http(s)://、git:// 或 git@host:org/repo.git）')
assert.equal(repoFieldLabels.branch, '分支名（≤64 字符，不含空白与特殊符号）')
assert.ok(repoFieldHelpPhrase.includes('repoUrl/branch'), 'help 共享句式应提及 repoUrl/branch')
assert.ok(repoUrlFieldSchema && branchFieldSchema, 'zod schema 层应导出两字段 optional schema')

// 4) formatRepoRef 三级 CLI 同形渲染。
assert.equal(formatRepoRef({}), '', '无 repoUrl 应返回空串（命令层显「未填写」）')
assert.equal(formatRepoRef({ repoUrl: '   ', branch: 'main' }), '', '纯空白 repoUrl 视同未填写')
assert.equal(formatRepoRef({ repoUrl: 'https://github.com/org/r.git' }), 'https://github.com/org/r.git', '仅 repoUrl 原值')
assert.equal(formatRepoRef({ repoUrl: 'https://github.com/org/r.git', branch: 'main' }), 'https://github.com/org/r.git@main', 'repoUrl@branch 同 task/deliverable 形')
assert.equal(formatRepoRef({ repoUrl: 'https://github.com/org/r.git', branch: '  ' }), 'https://github.com/org/r.git', '空白 branch 不拼 @')

// 5) omitEmptyRepoKeys 落盘空串删键（v2 记录不留空串污染）。
{
  const input = { repoUrl: '', branch: 'keep', name: 'x' }
  omitEmptyRepoKeys(input)
  assert.deepEqual(input, { branch: 'keep', name: 'x' }, 'repoUrl 空串应删键')
  const input2 = { repoUrl: 'keep', branch: '' }
  omitEmptyRepoKeys(input2)
  assert.deepEqual(input2, { repoUrl: 'keep' }, 'branch 空串应删键')
  const input3 = { name: 'x' }
  omitEmptyRepoKeys(input3)
  assert.deepEqual(input3, { name: 'x' }, '缺键时不报错、不补键')
}

// 6) 静态防漂移（S3-A1）：client 源码不得自抄第二份正则；编译产物不得拉入 zod。
{
  const formSrc = readSrc('src/client/form-validation.ts')
  assert.doesNotMatch(formSrc, /repoUrlPattern\s*=\s*\//, 'form-validation 不得自抄 repoUrlPattern 正则')
  assert.doesNotMatch(formSrc, /branchPattern\s*=\s*\//, 'form-validation 不得自抄 branchPattern 正则')
  assert.match(formSrc, /core\/repo-format\.js/, 'form-validation 必须从 core/repo-format 真源导入')
  assert.doesNotMatch(formSrc, /from ['"]zod['"]/, 'form-validation 不得直接依赖 zod')

  const pureSrc = readSrc('src/core/repo-format.ts')
  assert.doesNotMatch(pureSrc, /from ['"]zod['"]/, 'repo-format 纯模块不得依赖 zod（browser-safe）')

  const repoSrc = readSrc('src/core/repo.ts')
  assert.match(repoSrc, /from ['"]\.\/repo-format\.js['"]/, 'core/repo.ts 应委托 repo-format 真源')

  // 编译产物：client/form-validation.js 只能 import repo-format，禁止 zod 与 schema 层 repo.js。
  const compiled = readSrc('lib/client/form-validation.js')
  assert.doesNotMatch(compiled, /from ['"]zod['"]/, '编译后 client/form-validation.js 不得引用 zod')
  assert.doesNotMatch(compiled, /from ['"]\.\.\/core\/repo\.js['"]/, '编译后 client/form-validation.js 不得引用 zod schema 层 core/repo.js')
  assert.match(compiled, /from ['"]\.\.\/core\/repo-format\.js['"]/, '编译后应引用纯模块 repo-format.js')
}

// 7) 三级 commands 静态防漂移：project/task/deliverable 都必须从 repo-format 导入 helper、
//    render 用 formatRepoRef、help 复用 repoFieldHelpPhrase，不得内嵌第二份 URL/git 文案。
{
  for (const name of ['project.ts', 'task.ts', 'deliverable.ts']) {
    const src = readSrc(`src/commands/${name}`)
    assert.match(src, /from ['"]\.\.\/core\/repo-format\.js['"]/, `${name} 必须从 core/repo-format 导入 helper`)
    assert.match(src, /formatRepoRef\(/, `${name} 必须用 formatRepoRef 渲染仓库行`)
    assert.match(src, /repoFieldHelpPhrase/, `${name} help 必须复用共享句式`)
    assert.doesNotMatch(src, /git@host:org\/repo\.git/, `${name} 不得内嵌第二份 URL/git 文案`)
    assert.doesNotMatch(src, /repoUrl\s*\?\s*`\$\{[^`]*branch\s*\?/, `${name} 不得内联拼 url@branch，须用 formatRepoRef`)
  }
}

console.log('通过：S3 repo-format 纯模块三端同 fixture 同判同文案；client 编译产物零 zod 依赖。')

/**
 * verify-external-skill-router.mjs — Vendored Skill 自动路由纯函数的行为测试（ADL-049）。
 *
 * 权威依据（只读引用，不修改它们）：
 *   - docs/external-skills.md  §6.1 自动路由规则 / §4 manifest 契约
 *   - docs/decision-log.md     ADL-049（路由映射与边界）
 *   - docs/testing/external-skills-acceptance.md  域 K（ES-K1～K6）
 *
 * 本脚本做什么（纯 Node 内置、只读、离线、确定性、幂等）：
 *   - 对编译产物 lib/core/external-skill-router.js 的纯函数 routeExternalSkill 做行为断言；
 *   - 覆盖 K1～K6、K3 安全门拦截/放行、组合/冲突、简单任务、精确白名单、冻结去重、
 *     理由留痕、阻塞理由唯一、testableFix 冲突、确定性；
 *   - **只读 parse** vendor/agent-skills/mattpocock/manifest.json，做严格 shape 校验
 *     （缺字段即 clean fail），并断言路由白名单与 manifest.entrySkillIds 精确一致。
 *
 * 前置：本脚本 import 编译产物 lib/，须先 `pnpm run build`（已接入 package.json verify：
 *       先 build 再 guard）。若 lib 缺失，本脚本会在 import 处直接抛错退出 1。
 *
 * 本脚本绝不做什么：
 *   - 不 import / 不 read / 不 eval / 不执行任何 vendored SKILL.md 或脚本（无 child_process、无 eval）；
 *   - 不改 vendor / docs / 产品代码；不读环境凭据；
 *   - 真正的 sha256 逐文件校验仍归 verify-external-skills.mjs；本脚本只约束
 *     「路由返回的 entry 必落在 manifest 白名单内」与「安全门未过不得返回 skill」。
 *
 * 用法：node scripts/verify-external-skill-router.mjs   全部通过退出 0，任一失败抛错退出 1。
 */
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'
import {
  routeExternalSkill,
  VENDORED_ENTRY_IDS,
  isVendoredEntryId,
} from '../lib/core/external-skill-router.js'

const here = dirname(fileURLToPath(import.meta.url))
const REPO = join(here, '..', '..', '..') // packages/dsh-pm-tool/scripts -> pm-tool 仓库根
const MANIFEST_PATH = join(REPO, 'vendor', 'agent-skills', 'mattpocock', 'manifest.json')

// 全信号基线（默认安全门已通过 vendorIntegrityVerified=true）。
function baseSignals(over = {}) {
  return {
    taskKind: 'other',
    hasMaterialAmbiguity: false,
    isNewFeature: false,
    isTestableFix: false,
    isRootCauseUnknown: false,
    isDeliveryBoundary: false,
    isTrivial: false,
    needsBlockingUserInput: false,
    vendorIntegrityVerified: true,
    ...over,
  }
}

let checked = 0
function check(name, fn) {
  fn()
  checked++
  console.log(`  ✓ ${name}`)
}

// ---------------------------------------------------------------------------
// 0. 精确白名单（K1 入口集合契约）
// ---------------------------------------------------------------------------
console.log('【0】精确白名单')
check('白名单恰好 4 个且顺序固定', () => {
  assert.deepEqual([...VENDORED_ENTRY_IDS], ['grill-me', 'tdd', 'code-review', 'diagnosing-bugs'])
})
check('白名单不含 grilling / interaction', () => {
  assert.ok(!VENDORED_ENTRY_IDS.includes('grilling'))
  assert.ok(!VENDORED_ENTRY_IDS.includes('interaction'))
})
check('isVendoredEntryId 类型守卫边界', () => {
  assert.equal(isVendoredEntryId('tdd'), true)
  assert.equal(isVendoredEntryId('grilling'), false)
  assert.equal(isVendoredEntryId('interaction'), false)
})

// ---------------------------------------------------------------------------
// 1. manifest 严格 shape 校验（缺字段即 clean fail）+ 白名单一致性
// ---------------------------------------------------------------------------
console.log('【1】manifest shape（缺字段 clean fail）与白名单一致性')

/** 严格校验 manifest 形状；缺必填字段抛带定位信息的错（clean fail）。 */
function assertManifestShape(m) {
  assert.equal(typeof m, 'object')
  assert.notEqual(m, null)
  for (const field of ['entrySkillIds', 'skills', 'declaredDependencies']) {
    assert.ok(Array.isArray(m[field]), `manifest 缺字段或非数组: ${field}`)
  }
  for (const s of m.skills) {
    assert.ok(typeof s.id === 'string' && s.id.length, 'manifest.skills 项缺 id')
    assert.ok(['entry', 'dependency'].includes(s.kind), `manifest skill ${s.id} kind 非法: ${s.kind}`)
  }
}

let manifest
check('manifest.json 可读', () => {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
  assertManifestShape(manifest)
})
check('shape 校验对畸形对象 clean fail（抛错而非静默）', () => {
  assert.throws(() => assertManifestShape({ entrySkillIds: 'nope' }), /entrySkillIds/)
  assert.throws(() => assertManifestShape({ entrySkillIds: [], skills: [{ kind: 'entry' }], declaredDependencies: [] }), /缺 id/)
  assert.throws(() => assertManifestShape({ entrySkillIds: [], skills: [{ id: 'x', kind: 'bogus' }], declaredDependencies: [] }), /kind 非法/)
})
check('manifest.entrySkillIds 与路由白名单逐集合相等', () => {
  assert.deepEqual([...manifest.entrySkillIds].sort(), [...VENDORED_ENTRY_IDS].sort())
})
check('每个白名单 id 在 manifest 中 kind=entry', () => {
  for (const id of VENDORED_ENTRY_IDS) {
    const s = manifest.skills.find(x => x.id === id)
    assert.ok(s, `manifest.skills 缺少 entry=${id}`)
    assert.equal(s.kind, 'entry')
  }
})
check('grilling 是 exposed:false 依赖，不是公开入口', () => {
  const g = manifest.skills.find(s => s.id === 'grilling')
  assert.ok(g)
  assert.equal(g.kind, 'dependency')
  const dep = manifest.declaredDependencies.find(d => d.dependencySkillId === 'grilling')
  assert.ok(dep)
  assert.equal(dep.exposed, false)
  assert.equal(dep.pureDocumentation, true)
  assert.ok(!VENDORED_ENTRY_IDS.includes('grilling'))
})

// ---------------------------------------------------------------------------
// 2. K3：vendorIntegrityVerified 安全门（false 拦截 / true 放行）
// ---------------------------------------------------------------------------
console.log('【2】K3 — vendor 安全门：false 拦截 / true 放行')
check('安全门 false：即便命中 tdd 也不返回任何 skill，理由=安全门未通过', () => {
  const d = routeExternalSkill(baseSignals({ isNewFeature: true, vendorIntegrityVerified: false }))
  assert.equal(d.route, 'none')
  assert.deepEqual([...d.entrySkillIds], [])
  assert.equal(d.reasons.length, 1)
  assert.equal(d.reasons[0].code, 'vendor-integrity-unverified')
})
check('安全门 false：命中多信号（歧义+交付）仍全拦', () => {
  const d = routeExternalSkill(baseSignals({
    hasMaterialAmbiguity: true, isDeliveryBoundary: true, vendorIntegrityVerified: false,
  }))
  assert.equal(d.route, 'none')
  assert.deepEqual([...d.entrySkillIds], [])
})
check('安全门 true：命中 tdd 正常放行', () => {
  const d = routeExternalSkill(baseSignals({ isNewFeature: true }))
  assert.deepEqual([...d.entrySkillIds], ['tdd'])
  assert.equal(d.route, 'skills')
})

// ---------------------------------------------------------------------------
// 3. K1：四类场景正确匹配（安全门已过）
// ---------------------------------------------------------------------------
console.log('【3】K1 — 四类场景正确匹配')
check('需求歧义 → grill-me', () => {
  const d = routeExternalSkill(baseSignals({ taskKind: 'new-feature', hasMaterialAmbiguity: true }))
  assert.deepEqual([...d.entrySkillIds], ['grill-me'])
})
check('新功能实现 → tdd', () => {
  const d = routeExternalSkill(baseSignals({ taskKind: 'new-feature', isNewFeature: true }))
  assert.deepEqual([...d.entrySkillIds], ['tdd'])
})
check('可测修复实现 → tdd', () => {
  const d = routeExternalSkill(baseSignals({ taskKind: 'bug-fix', isTestableFix: true }))
  assert.deepEqual([...d.entrySkillIds], ['tdd'])
})
check('根因未知 → diagnosing-bugs', () => {
  const d = routeExternalSkill(baseSignals({ taskKind: 'bug-investigation', isRootCauseUnknown: true }))
  assert.deepEqual([...d.entrySkillIds], ['diagnosing-bugs'])
})
check('交付边界 → code-review', () => {
  const d = routeExternalSkill(baseSignals({ taskKind: 'delivery-self-check', isDeliveryBoundary: true }))
  assert.deepEqual([...d.entrySkillIds], ['code-review'])
})

// ---------------------------------------------------------------------------
// 4. K2：简单任务不滥用
// ---------------------------------------------------------------------------
console.log('【4】K2 — 简单任务不加载')
check('trivial 文档改写 → none', () => {
  const d = routeExternalSkill(baseSignals({ taskKind: 'docs', isTrivial: true }))
  assert.equal(d.route, 'none')
  assert.deepEqual([...d.entrySkillIds], [])
  assert.equal(d.interactionFirst, false)
})
check('纯问答 → none', () => {
  const d = routeExternalSkill(baseSignals({ taskKind: 'query' }))
  assert.equal(d.route, 'none')
})

// ---------------------------------------------------------------------------
// 5. 信号语义修正（REQUEST CHANGES #4）
// ---------------------------------------------------------------------------
console.log('【5】信号语义：trivial 抑制 grill/tdd；rootCause 不交付；blocking 全拦')
check('trivial + 歧义：抑制 grill → none', () => {
  const d = routeExternalSkill(baseSignals({ hasMaterialAmbiguity: true, isTrivial: true }))
  assert.deepEqual([...d.entrySkillIds], [])
  assert.equal(d.route, 'none')
})
check('trivial + 新功能：抑制 tdd → none', () => {
  const d = routeExternalSkill(baseSignals({ isNewFeature: true, isTrivial: true }))
  assert.deepEqual([...d.entrySkillIds], [])
})
check('trivial + 交付边界：grill/tdd 抑制，仍追加 code-review', () => {
  const d = routeExternalSkill(baseSignals({ isTrivial: true, isDeliveryBoundary: true }))
  assert.deepEqual([...d.entrySkillIds], ['code-review'])
})
check('rootCause + 交付边界：仅 diagnosing-bugs，**不追加** code-review（根因未明不可交付）', () => {
  const d = routeExternalSkill(baseSignals({ isRootCauseUnknown: true, isDeliveryBoundary: true }))
  assert.deepEqual([...d.entrySkillIds], ['diagnosing-bugs'])
  assert.ok(!d.entrySkillIds.includes('code-review'))
})
check('rootCause + 歧义：先定位，不先 grill', () => {
  const d = routeExternalSkill(baseSignals({ isRootCauseUnknown: true, hasMaterialAmbiguity: true }))
  assert.deepEqual([...d.entrySkillIds], ['diagnosing-bugs'])
})
check('rootCause + 新功能：根因优先，抑制 tdd', () => {
  const d = routeExternalSkill(baseSignals({ isRootCauseUnknown: true, isNewFeature: true }))
  assert.deepEqual([...d.entrySkillIds], ['diagnosing-bugs'])
})
check('blocking + 歧义：先走 interaction，不套 grill', () => {
  const d = routeExternalSkill(baseSignals({ hasMaterialAmbiguity: true, needsBlockingUserInput: true }))
  assert.equal(d.interactionFirst, true)
  assert.equal(d.route, 'none')
  assert.deepEqual([...d.entrySkillIds], [])
})
check('blocking + 交付边界：全拦（连 code-review 也不追加）', () => {
  const d = routeExternalSkill(baseSignals({ isDeliveryBoundary: true, needsBlockingUserInput: true }))
  assert.equal(d.interactionFirst, true)
  assert.equal(d.route, 'none')
  assert.deepEqual([...d.entrySkillIds], [])
})

// ---------------------------------------------------------------------------
// 6. 组合规则（多信号命中的顺序与追加）
// ---------------------------------------------------------------------------
console.log('【6】组合：多信号顺序/追加')
check('歧义 + 新功能 → [grill-me, tdd]', () => {
  const d = routeExternalSkill(baseSignals({ hasMaterialAmbiguity: true, isNewFeature: true }))
  assert.deepEqual([...d.entrySkillIds], ['grill-me', 'tdd'])
})
check('新功能 + 交付 → [tdd, code-review]（追加在末位）', () => {
  const d = routeExternalSkill(baseSignals({ isNewFeature: true, isDeliveryBoundary: true }))
  assert.deepEqual([...d.entrySkillIds], ['tdd', 'code-review'])
})
check('歧义 + 新功能 + 交付 → [grill-me, tdd, code-review]', () => {
  const d = routeExternalSkill(baseSignals({ hasMaterialAmbiguity: true, isNewFeature: true, isDeliveryBoundary: true }))
  assert.deepEqual([...d.entrySkillIds], ['grill-me', 'tdd', 'code-review'])
})
check('testableFix + 交付 → [tdd, code-review]', () => {
  const d = routeExternalSkill(baseSignals({ isTestableFix: true, isDeliveryBoundary: true }))
  assert.deepEqual([...d.entrySkillIds], ['tdd', 'code-review'])
})

// ---------------------------------------------------------------------------
// 7. testableFix 冲突专项（REQUEST CHANGES #7）
// ---------------------------------------------------------------------------
console.log('【7】testableFix 冲突')
check('testableFix + rootCause：根因未明先诊断，不红绿 → [diagnosing-bugs]', () => {
  const d = routeExternalSkill(baseSignals({ isTestableFix: true, isRootCauseUnknown: true }))
  assert.deepEqual([...d.entrySkillIds], ['diagnosing-bugs'])
  assert.ok(!d.entrySkillIds.includes('tdd'))
})
check('testableFix + trivial：tdd 被抑制 → none', () => {
  const d = routeExternalSkill(baseSignals({ isTestableFix: true, isTrivial: true }))
  assert.deepEqual([...d.entrySkillIds], [])
})
check('testableFix + trivial + 交付：tdd 抑制，仍 code-review → [code-review]', () => {
  const d = routeExternalSkill(baseSignals({ isTestableFix: true, isTrivial: true, isDeliveryBoundary: true }))
  assert.deepEqual([...d.entrySkillIds], ['code-review'])
})

// ---------------------------------------------------------------------------
// 8. K6：理由留痕 + 阻塞理由唯一 + taskKind 回带
// ---------------------------------------------------------------------------
console.log('【8】K6 — 理由留痕 / 阻塞理由唯一 / taskKind 回带')
check('每个返回 entry 都有对应理由', () => {
  const d = routeExternalSkill(baseSignals({ hasMaterialAmbiguity: true, isNewFeature: true, isDeliveryBoundary: true }))
  for (const id of d.entrySkillIds) {
    assert.ok(d.reasons.find(r => r.entry === id), `entry=${id} 缺理由`)
  }
})
check('tdd 理由声明自测≠专家 PASS；code-review 理由声明不 push', () => {
  const d = routeExternalSkill(baseSignals({ isNewFeature: true, isDeliveryBoundary: true }))
  assert.match(d.reasons.find(r => r.entry === 'tdd').message, /PASS|独立测试|回归/)
  assert.match(d.reasons.find(r => r.entry === 'code-review').message, /push|自动批准|≠验收/)
})
check('阻塞路径（blocking / 安全门未过）理由恰为单条', () => {
  const b = routeExternalSkill(baseSignals({ hasMaterialAmbiguity: true, needsBlockingUserInput: true }))
  assert.equal(b.reasons.length, 1)
  const g = routeExternalSkill(baseSignals({ isNewFeature: true, vendorIntegrityVerified: false }))
  assert.equal(g.reasons.length, 1)
})
check('taskKind 原样回带进 decision', () => {
  const d = routeExternalSkill(baseSignals({ taskKind: 'bug-investigation', isRootCauseUnknown: true }))
  assert.equal(d.taskKind, 'bug-investigation')
})

// ---------------------------------------------------------------------------
// 9. K4：不索取口令/凭据
// ---------------------------------------------------------------------------
console.log('【9】K4 — 无口令/凭据字段')
check('决策对象不含敏感字段；entry 全部落在白名单内', () => {
  const d = routeExternalSkill(baseSignals({ isNewFeature: true, isDeliveryBoundary: true }))
  for (const key of Object.keys(d)) {
    assert.ok(!/password|token|secret|credential|apiKey/i.test(key), `出现敏感字段: ${key}`)
  }
  for (const id of d.entrySkillIds) assert.ok(isVendoredEntryId(id))
})

// ---------------------------------------------------------------------------
// 10. 不可变（冻结 + 去重）+ 确定性
// ---------------------------------------------------------------------------
console.log('【10】不可变冻结去重 / 确定性')
check('返回数组已冻结（push 被拒）', () => {
  const d = routeExternalSkill(baseSignals({ hasMaterialAmbiguity: true, isNewFeature: true }))
  assert.ok(Object.isFrozen(d.entrySkillIds))
  assert.ok(Object.isFrozen(d.reasons))
  assert.throws(() => d.entrySkillIds.push('grill-me'))
})
check('entrySkillIds 无重复', () => {
  const d = routeExternalSkill(baseSignals({ hasMaterialAmbiguity: true, isNewFeature: true, isDeliveryBoundary: true }))
  assert.equal(new Set(d.entrySkillIds).size, d.entrySkillIds.length)
})
check('同输入两次调用深度相等（确定性）', () => {
  const sig = baseSignals({ hasMaterialAmbiguity: true, isNewFeature: true, isDeliveryBoundary: true })
  assert.deepEqual(routeExternalSkill(sig), routeExternalSkill({ ...sig }))
  const sig2 = baseSignals({ needsBlockingUserInput: true, vendorIntegrityVerified: false })
  assert.deepEqual(routeExternalSkill(sig2), routeExternalSkill({ ...sig2 }))
})

console.log(`\nverify-external-skill-router 通过：共 ${checked} 组断言，覆盖 K1–K6、K3 安全门 false拦截/true放行、组合/冲突、testableFix 冲突、阻塞理由唯一、taskKind 留痕、冻结去重、确定性；manifest 严格 shape（缺字段 clean fail）且白名单与 entrySkillIds 只读比对一致。`)

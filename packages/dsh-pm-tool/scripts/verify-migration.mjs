/**
 * P1-③ 版本迁移链验证：
 *  - v1 老配置经 parseLayout 到最新且内容等价；
 *  - 伪造跳级（version > LAYOUT_VERSION）被拒绝；
 *  - stepMigrations 必须逐级经过（注入合成链 v1->v2->v3，断言每步都执行）；
 *  - 链不连续（缺级）抛错。
 */
import assert from 'node:assert/strict'
import { parseLayout, stepMigrations, LAYOUT_VERSION } from '../lib/client/board/persist.js'

// 1. v1 老配置（含一个旧结构 widget）能解析且内容保留
const v1 = {
  version: 1, scope: 'user',
  widgets: [
    { i: 'a', type: 'textNote', config: { title: 't', body: 'b' }, layout: { i: 'a', x: 0, y: 0, w: 4, h: 3 } },
  ],
}
const parsed = parseLayout(v1)
assert.ok(parsed, 'v1 应解析成功')
assert.equal(parsed.version, LAYOUT_VERSION)
assert.equal(parsed.widgets.length, 1)
assert.equal(parsed.widgets[0].config.title, 't')
console.log('1 OK: v1 老配置解析并保留内容')

// 2. 跳级（version 远大于支持）被拒绝
assert.equal(parseLayout({ version: 99, widgets: [] }), null, 'version>支持 应拒绝')
assert.equal(parseLayout({ version: 0, widgets: [] }), null, 'version<1 应拒绝')
console.log('2 OK: 跳级/过低版本被拒绝')

// 3. stepMigrations 逐级经过：合成链 v1->v2->v3，记录每步
const seen = []
const chain = [
  { from: 1, to: 2, apply: l => { seen.push(1); return { ...l, version: 2, widgets: l.widgets.map(w => ({ ...w, config: { ...w.config, v2: true } })) } } },
  { from: 2, to: 3, apply: l => { seen.push(2); return { ...l, version: 3 } } },
]
const base = { version: 1, scope: 'user', widgets: [{ i: 'a', type: 'textNote', config: {}, layout: { i: 'a', x: 0, y: 0, w: 4, h: 3 } }] }
const out = stepMigrations(base, chain, 3)
assert.deepEqual(seen, [1, 2], '必须依次经过 v1->v2->v3')
assert.equal(out.version, 3)
assert.equal(out.widgets[0].config.v2, true, 'v2 步骤的字段规整应保留')
console.log('3 OK: 逐级迁移经过 v1->v2->v3，v2 字段规整保留')

// 4. 链不连续抛错
assert.throws(() => stepMigrations(base, [{ from: 1, to: 3, apply: l => ({ ...l, version: 3 }) }], 3), /迁移/)
console.log('4 OK: 链不连续/跳步被抛错')

console.log('✔ verify-migration: 迁移链全部用例通过')

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

// Checks this document delivery only; never loads products or runs tests.
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const prefix = 'docs/testing/b8-existing-evidence-mapping-20261022-r1'
const target = `${prefix}-selfcheck.json`
assert.equal(fs.existsSync(path.join(root, target)), false)
const paths = [`${prefix}.md`, `${prefix}.json`, `${prefix}.mjs`, `${prefix}-selfcheck.mjs`]
const bytes = new Map(paths.map(p => [p, fs.readFileSync(path.join(root, p))]))
const mapping = JSON.parse(bytes.get(`${prefix}.json`).toString('utf8'))
const rows = [...mapping.matrix, ...mapping.layers, ...mapping.widgets, ...mapping.specials]
assert.equal(rows.length, 1284)
assert.equal(new Set(rows.map(r => r.id)).size, 1284)
assert.equal(mapping.matrix.filter(r => r.segmentRefs.length).length, 14)
assert.equal(mapping.matrix.some(r => r.entireCellPass || r.currentCandidatePass), false)
assert.equal(mapping.layers.some(r => r.fullLayerPass), false)
assert.equal(mapping.widgets.some(r => r.fullWidgetPass), false)
assert.equal(mapping.matrix.filter(r => r.dimensions.state === 'stale' || r.dimensions.state === 'noresult').length, 32)
assert.ok(mapping.layers.every(r => r.minimumRemaining && r.sourceLocatorOnly.trigger))
assert.ok(mapping.widgets.every(r => r.minimumRemaining && r.kindSpecificOriginalRemaining))
const checkedLinks = []
for (const match of bytes.get(`${prefix}.md`).toString('utf8').matchAll(/\]\(([^)]+)\)/g)) {
  const href = match[1].split('#')[0]
  if (!href || /^[a-z]+:/i.test(href)) continue
  const resolved = path.resolve(root, 'docs/testing', href)
  assert.ok(resolved.startsWith(`${root}/`))
  const relative = path.relative(root, resolved)
  const selfReference = relative === target
  assert.ok(selfReference || fs.existsSync(resolved), relative)
  checkedLinks.push({ path: relative, selfReferenceGeneratedByThisCommand: selfReference })
}
assert.equal(/[ \t]+$/m.test(bytes.get(`${prefix}.md`).toString('utf8')), false)
assert.equal(bytes.get(`${prefix}.md`).at(-1), 10)
const evidencePaths = mapping.evidenceCatalog.flatMap(e => [e.report, e.rawRoot].filter(Boolean))
for (const p of evidencePaths) assert.ok(fs.existsSync(path.join(root, p)), p)
const sourceDrift = []
for (const input of mapping.sourceDocuments) {
  const actual = fs.readFileSync(path.join(root, input.path))
  if (crypto.createHash('sha256').update(actual).digest('hex') !== input.sha256) sourceDrift.push(input.path)
}
assert.deepEqual(sourceDrift, [])
const result = {
  kind: '自有文档交付自检，非产品test/verify/GUI',
  at: new Date().toISOString(), os: process.platform, node: process.version,
  command: `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node ${prefix}-selfcheck.mjs`,
  completed: true, counts: mapping.counts, uniqueIds: rows.length,
  linksChecked: checkedLinks, missingLinks: [], sourceDrift,
  ownFiles: [...bytes].map(([p, b]) => ({ path: p, bytes: b.length, sha256: crypto.createHash('sha256').update(b).digest('hex') })),
  evidencePointerChecks: evidencePaths.length,
  checkBoundary: '只读取列明docs/reports与自有文件；证据根仅存在性检查，没有递归读/审原包。自检记录自身不纳自身SHA，避免递归自签',
  productOrGuiExecuted: false, network: false, subprocess: false, gitReadOrWrite: false,
  output: target, released: true,
}
fs.writeFileSync(path.join(root, target), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
assert.ok(fs.existsSync(path.join(root, target)))
console.log(JSON.stringify({ output: target, completed: true, uniqueIds: rows.length,
  linksChecked: checkedLinks.length, sourceDrift: sourceDrift.length,
  productOrGuiExecuted: false, released: true }))

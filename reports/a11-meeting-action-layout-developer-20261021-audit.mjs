/**
 * 只读核限定修前/修后源码与控制属性；索引只写 A11 报告前缀。
 * 不构建、不连接服务、不执行 GUI，不替独立专家判定。
 */
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const own = join(root, 'reports/a11-meeting-action-layout-developer-20261021-selftmp')
const frozen = join(own, 'privatecopy-r3')
const live = join(root, 'packages/dsh-pm-tool')
const require = createRequire('/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/package.json')
const ts = require('typescript')
const viteRequire = createRequire(createRequire(require.resolve('vitest/package.json')).resolve('vite'))
const postcss = viteRequire('postcss')
const hash = value => createHash('sha256').update(value).digest('hex')
const fingerprint = path => ({ bytes: statSync(path).size, sha256: hash(readFileSync(path)) })
const form = 'src/client/views/records/records-meeting-form.tsx'
const css = 'src/client/views/records.css'
const test = 'src/client/views/records/records-meeting-layout.test.tsx'
const before = readFileSync(join(own, 'before', form), 'utf8')
const after = readFileSync(join(frozen, form), 'utf8')
const renderStart = '  return (\n    <form'
assert.equal(before.slice(0, before.indexOf(renderStart)), after.slice(0, after.indexOf(renderStart)))
const printer = ts.createPrinter()
function controls(source) {
  const ast = ts.createSourceFile('meeting.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const entries = []
  const tags = new Set(['input', 'select', 'option', 'RecordsListbox', 'button'])
  function visit(node) {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && tags.has(node.tagName.getText(ast))) {
      entries.push({
        tag: node.tagName.getText(ast),
        attributes: node.attributes.properties.map(attribute =>
          printer.printNode(ts.EmitHint.Unspecified, attribute, ast)),
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return entries
}
assert.deepEqual(controls(after), controls(before))
function unrelatedCss(path) {
  const tree = postcss.parse(readFileSync(path, 'utf8'))
  return tree.nodes.filter(node => {
    if (node.type === 'rule') return !node.selector.includes('.rb-action') && !node.selector.includes('.rb-meeting-actions')
    if (node.type === 'atrule') return !(node.nodes ?? []).some(child =>
      child.selector?.includes('.rb-action') || child.selector?.includes('.rb-meeting-actions'))
    return node.type !== 'comment'
  }).map(node => node.toString())
}
assert.deepEqual(unrelatedCss(join(own, 'before', css)), unrelatedCss(join(frozen, css)))
const scoped = Object.fromEntries([form, css, test].map(file => {
  const current = fingerprint(join(live, file))
  const tested = fingerprint(join(frozen, file))
  assert.deepEqual(current, tested, `限定源码漂移 ${file}`)
  return [file, current]
}))
const red = JSON.parse(readFileSync(join(own, 'red-r3.json'), 'utf8'))
const green = JSON.parse(readFileSync(join(own, 'green-r2.json'), 'utf8'))
assert.equal(red.sourceHashes[test], green.sourceHashes[test], '有效红绿必须用同一版测试')
assert.equal(red.commands[0].exit, 1)
assert(green.commands.every(command => command.exit === 0))
function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(join(path, entry.name)) : [join(path, entry.name)])
}
const sourceIndex = Object.fromEntries(walk(join(frozen, 'src')).map(path => [relative(frozen, path), fingerprint(path)]))
writeFileSync(join(own, 'frozen-source-fingerprints.json'), JSON.stringify(sourceIndex, null, 2) + '\n')
const evidenceFiles = [
  'reports/all-pending-evidence-20261021/A10/meeting/actions-r2/first-draft.png',
  'reports/all-pending-evidence-20261021/A10/meeting/actions-r2/second-draft.png',
  'reports/all-pending-evidence-20261021/A10/meeting/clear-cancel/cancel-draft.png',
  'reports/all-pending-evidence-20261021/A10/meeting/actions-r2/frames/000017.jpg',
]
const result = {
  scope: 'A10-MGUI-F01 developer SOURCE/AUTO only',
  scoped, frozenSourceCount: Object.keys(sourceIndex).length,
  preservedFormLogic: true, preservedControlAttributes: controls(after).length,
  unrelatedRecordsCssUnchanged: true, sameRedGreenTest: true,
  originalImagesReadOnly: Object.fromEntries(evidenceFiles.map(path => [path, fingerprint(join(root, path))])),
  patches: Object.fromEntries(['meeting-form-developer.patch', 'records-css-developer.patch']
    .map(file => [file, fingerprint(join(own, file))])),
  commands: { red: red.commands, green: green.commands },
  limits: ['no build', 'no GUI', 'no service', 'no independent PASS', 'no commit/push',
    'no install', 'read-only worktree dependencies', 'private cache only; no whole-machine pollution claim'],
}
writeFileSync(join(own, 'audit.json'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ scopeFiles: scoped, frozenSourceCount: result.frozenSourceCount,
  preservedControlAttributes: result.preservedControlAttributes, exit: 0 }, null, 2))

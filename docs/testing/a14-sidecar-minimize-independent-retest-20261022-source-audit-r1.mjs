import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a14-sidecar-minimize-independent-retest-20261022'
const round = process.argv[2]
assert.match(round, /^r[1-9]\d*$/)
const root = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
const pkg = label => join(root, label, 'frozen/packages/dsh-pm-tool')
const deps = '/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool/node_modules'
const require = createRequire(join(realpathSync(join(deps, 'vitest')), 'package.json'))
const ts = createRequire(join(realpathSync(join(deps, 'typescript')), 'package.json'))('./lib/typescript.js')
const viteRequire = createRequire(require.resolve('vite'))
const postcss = viteRequire('postcss')
const hash = x => createHash('sha256').update(x).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const read = p => readFileSync(p, 'utf8')
const oldText = read(join(pkg('old'), 'src/client/panel.tsx'))
const newText = read(join(pkg('new'), 'src/client/panel.tsx'))
const parse = s => ts.createSourceFile('panel.tsx', s, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const oldAst = parse(oldText)
const newAst = parse(newText)
const checks = []
const check = (id, value) => { assert(value, id); checks.push({ id, ok: true }) }
const collect = (ast, filter) => {
  const found = []
  const visit = n => { if (filter(n)) found.push(n); ts.forEachChild(n, visit) }
  visit(ast)
  return found
}
for (const name of ['closeSidecar', 'setSelected', 'startSidecarResize', 'refresh']) {
  const decl = ast => collect(ast, n => ts.isVariableDeclaration(n) && n.name.getText(ast) === name)
  check(`${name}-unchanged`, decl(oldAst).length === 1 && decl(newAst).length === 1
    && decl(oldAst)[0].getText(oldAst) === decl(newAst)[0].getText(newAst))
}
const jsx = (ast, tag) => collect(ast, n => ts.isJsxSelfClosingElement(n) && n.tagName.getText(ast) === tag)
check('single-CopilotPanel-exact-props-no-new-key', jsx(oldAst, 'CopilotPanel').length === 1
  && jsx(newAst, 'CopilotPanel').length === 1
  && jsx(oldAst, 'CopilotPanel')[0].getText(oldAst) === jsx(newAst, 'CopilotPanel')[0].getText(newAst))
const aside = collect(newAst, n => ts.isJsxElement(n) && n.openingElement.tagName.getText(newAst) === 'aside'
  && n.openingElement.attributes.properties.some(p => p.name?.getText(newAst) === 'className'
    && p.initializer?.text === 'pm-sidecar'))
check('stable-first-aside-in-fragment-hidden-copilotMin', aside.length === 1 && ts.isJsxFragment(aside[0].parent)
  && aside[0].parent.children.filter(n => ts.isJsxElement(n))[0] === aside[0]
  && aside[0].openingElement.attributes.properties.some(p => p.name?.getText(newAst) === 'hidden'
    && p.initializer?.expression?.getText(newAst) === 'copilotMin'))
check('unchanged-sidecar-source', hash(readFileSync(join(pkg('old'), 'src/client/shared/drawers/sidecar-portal.tsx')))
  === hash(readFileSync(join(pkg('new'), 'src/client/shared/drawers/sidecar-portal.tsx'))))

const css = postcss.parse(read(join(pkg('new'), 'src/client/panel.css')))
const hidden = []
const sidecarRules = []
css.walkRules(rule => {
  if (rule.selector === '.pm-sidecar[hidden]') hidden.push(rule)
  if (rule.selector === '.pm-sidecar') sidecarRules.push(rule)
})
const decl = (rule, prop) => rule.nodes.filter(n => n.type === 'decl' && n.prop === prop)
check('CSS-hidden-display-none-single', hidden.length === 1 && decl(hidden[0], 'display').length === 1
  && decl(hidden[0], 'display')[0].value === 'none')
check('CSS-fixed-nonflow-base', sidecarRules.some(r => decl(r, 'position').some(d => d.value === 'fixed')))
check('CSS-display-flex-lower-specificity-no-important-override',
  sidecarRules.some(r => decl(r, 'display').some(d => d.value === 'flex'))
  && sidecarRules.every(r => decl(r, 'display').every(d => !d.important)))
const displayRules = []
css.walkRules(rule => {
  if (rule.selector.includes('pm-sidecar') && decl(rule, 'display').length)
    displayRules.push({ selector: rule.selector, declarations: decl(rule, 'display').map(d => ({
      value: d.value, important: !!d.important })), line: rule.source.start.line })
})
check('CSS-no-other-sidecar-display-override', displayRules.every(r =>
  ['.pm-sidecar', '.pm-sidecar[hidden]', '.pm-sidecar-handle'].includes(r.selector)))

const gateway = join(repo, 'reports/all-pending-evidence-20261021/A13/gateway/loaded-r1')
const loaded = json(join(gateway, 'result.json'))
const source = readFileSync('/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool/lib/client.js')
const normalized = source.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
  .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
const response = readFileSync(join(gateway, 'combo-1.txt'))
const event = loaded.events[0]
const match = event.matches[0]
const first = response.indexOf(segment)
const applied = json(join(repo, 'reports/all-pending-evidence-20261021/A14/governance/mixed-r4/applied.json'))
check('original-before-mixed-unique-complete-uncached-client-binding', loaded.events.length === 1
  && event.status === 200 && event.fromDiskCache === false
  && hash(response) === event.responseSha && response.length === event.bytes
  && first === match.first && first >= 0 && response.indexOf(segment, first + 1) === -1
  && segment.length === match.segmentBytes && hash(segment) === match.segmentSha
  && hash(source) === match.sourceSha && match.uniqueComplete
  && loaded.browserContextKind === 'default' && loaded.targetId === event.frameId
  && loaded.state.origin === applied.origin && loaded.state.timeOrigin === applied.timeOrigin
  && Date.parse(loaded.at) < Date.parse(applied.at))
const result = { at: new Date().toISOString(), checks, displayRules,
  dependencies: { typescript: ts.version, postcss: viteRequire.resolve('postcss'), vite: require.resolve('vite') },
  source: Object.fromEntries(['old', 'new', 'current'].map(n => [n, json(join(root, n, 'candidate.json'))])),
  originalBinding: { responseSha256: hash(response), clientSha256: hash(source),
    loadedAt: loaded.at, timeOrigin: loaded.state.timeOrigin },
  argv: process.argv, cwd: process.cwd(), exitOnSuccessfulWrite: 0,
  boundary: 'SOURCE静态合同及原字节下发审证；无GUI、布局引擎、指针命中、真实Tab/屏幕阅读器；不签新bundle/实例' }
writeFileSync(join(root, 'source-audit.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ checks: checks.length, result: join(root, 'source-audit.json'), originalExit: 0 }))

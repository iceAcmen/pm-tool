import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const testing = dirname(fileURLToPath(import.meta.url)), repo = resolve(testing, '../..')
const prefix = 'cycle-feedback-independent-retest-20261022-r1'
const out = join(testing, `${prefix}-selftmp/r1`), frozen = join(out, 'frozen')
const pkg = 'packages/dsh-pm-tool', source = '/private/tmp/pmtool-u4-closure-20261022-r2'
const sha = b => createHash('sha256').update(b).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const ts = createRequire(import.meta.url)(join(frozen, pkg, 'node_modules/typescript/lib/typescript.js'))
const relative = p => p.slice(`${repo}/`.length)
function parse(path, root) {
  const text = readFileSync(join(root, pkg, path), 'utf8')
  const ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  assert.equal(ast.parseDiagnostics.length, 0)
  const nodes = []
  function walk(node) { nodes.push(node); ts.forEachChild(node, walk) }
  walk(ast)
  return { text, ast, nodes }
}
function reverted(text, spans) {
  let result = text
  for (const [start, end, value] of spans.sort((a, b) => b[0] - a[0])) {
    result = result.slice(0, start) + value + result.slice(end)
  }
  return result
}
const task = parse('src/core/tasks.ts', frozen), oldTask = parse('src/core/tasks.ts', source)
const classes = task.nodes.filter(n => ts.isClassDeclaration(n) && n.name?.text === 'PredecessorRelationError')
assert.equal(classes.length, 1)
assert.equal(classes[0].members.length, 0)
assert.equal(classes[0].heritageClauses[0].types[0].expression.getText(task.ast), 'Error')
const throws = task.nodes.filter(n => ts.isNewExpression(n) && n.expression.getText(task.ast) === 'PredecessorRelationError')
assert.equal(throws.length, 4)
const reasons = throws.map(n => n.arguments[0].getText(task.ast))
assert.equal(reverted(task.text, [
  [classes[0].getFullStart(), classes[0].end, ''],
  ...throws.map(n => [n.expression.getStart(task.ast), n.expression.end, 'Error']),
]), oldTask.text, '四关系窄类型以外不得有 tasks 字节增量')

const command = parse('src/commands/task.ts', frozen), oldCommand = parse('src/commands/task.ts', source)
const imports = command.nodes.filter(n => ts.isImportSpecifier(n) && n.name.text === 'PredecessorRelationError')
const branches = command.nodes.filter(n => ts.isBinaryExpression(n)
  && n.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword && n.right.getText(command.ast) === 'PredecessorRelationError')
assert.equal(imports.length, 1)
assert.equal(branches.length, 1)
assert.equal(command.text[imports[0].end], ',')
const parent = branches[0].parent
assert.equal(parent.operatorToken.kind, ts.SyntaxKind.BarBarToken)
assert.equal(parent.right, branches[0])
assert.equal(reverted(command.text, [
  [imports[0].getFullStart(), imports[0].end + 1, ''],
  [parent.left.end, parent.end, ''],
]), oldCommand.text, 'handler 窄类以外不得有 command 字节增量')

const card = parse('src/client/result-card.tsx', frozen), oldCard = parse('src/client/result-card.tsx', source)
const helper = card.nodes.filter(n => ts.isFunctionDeclaration(n) && n.name?.text === 'hasPermissionDenialReason')
const variable = data => data.nodes.find(n => ts.isVariableDeclaration(n) && n.name.getText(data.ast) === 'isPermissionDenied')
assert.equal(helper.length, 1)
const currentVariable = variable(card), oldVariable = variable(oldCard)
assert.equal(reverted(card.text, [
  [helper[0].getFullStart(), helper[0].end, ''],
  [currentVariable.initializer.getStart(card.ast), currentVariable.initializer.end,
    oldVariable.initializer.getText(oldCard.ast)],
]), oldCard.text, '权限 helper 与调用以外不得有 ResultCard 字节增量')

const results = [['original', 10, 1], ['new', 29, 2], ['affected', 134, 10]].map(([suite, tests, files]) => {
  const command = json(join(out, `${suite}.command.json`)), summary = json(join(out, `${suite}.summary.json`))
  const reporterPath = join(out, `${suite}.result.json`), reporter = json(reporterPath)
  assert.equal(command.originalExit, 0)
  assert.equal(command.signal, null)
  assert.equal(command.error, null)
  assert(summary.protectionBefore.ok && summary.protectionAfter.ok)
  assert.equal(reporter.numPassedTests, tests)
  assert.equal(reporter.numFailedTests, 0)
  assert.equal(reporter.numPendingTests, 0)
  assert.equal(reporter.testResults.length, files)
  assert(reporter.testResults.every(f => f.assertionResults.every(t => t.status === 'passed')))
  return { suite, tests, files, command, reporter: relative(reporterPath),
    reporterSha256: sha(readFileSync(reporterPath)), fileCases: reporter.testResults.map(f => ({
      file: f.name.slice(`${frozen}/`.length), tests: f.assertionResults.length,
      cases: f.assertionResults.map(t => ({ name: t.fullName, status: t.status })),
    })) }
})
const testPaths = results.flatMap(r => r.fileCases.map(f => f.file))
assert.equal(new Set(testPaths).size, testPaths.length)
const noemit = json(join(out, 'noemit.command.json')), noemitSummary = json(join(out, 'noemit.summary.json'))
assert.equal(noemit.originalExit, 0)
assert.equal(noemit.signal, null)
assert.equal(noemit.error, null)
assert(noemitSummary.protectionBefore.ok && noemitSummary.protectionAfter.ok)
const close = json(join(out, 'close.json'))
assert(close.released && close.stop && close.protection.ok)
for (const [name, metadata] of Object.entries(json(join(out, 'sealed-inventory.json')))) {
  if (metadata.sha256) assert.equal(sha(readFileSync(join(out, name))), metadata.sha256, name)
}
const evidence = ['candidate.json', 'binding.json', 'complete-input-files.json', 'dependencies.json',
  'protected-before.json', 'main-inputs.json', 'frozen-inputs.json', 'tracked-product.diff',
  'untracked-product-files.txt', 'increment.patch', 'freeze-check.json', 'close.json', 'sealed-inventory.json',
  ...['original', 'new', 'affected', 'noemit'].flatMap(s => [
    `${s}.command.json`, `${s}.summary.json`, `${s}.stdout.log`, `${s}.stderr.log`,
  ]), ...['original', 'new', 'affected'].map(s => `${s}.result.json`),
  'original.observations.jsonl',
].map(name => ({ path: relative(join(out, name)), bytes: readFileSync(join(out, name)).length,
  sha256: sha(readFileSync(join(out, name))) }))
const audit = { at: new Date().toISOString(), sourceReview: { narrowFourRelationTypesOnly: true,
  reasons, knownHandlerOnly: true, permissionHelperAndCallOnly: true,
  remainingProductBytesIdenticalToOldCandidate: true, unknownAndAggregateHandlerUnchanged: true,
  resultContextCopyGenerationAndSuccessHandlingUnchanged: true },
  candidate: json(join(out, 'candidate.json')), results, noemit, close, evidence,
  sourceAutoVerdict: 'PASS', gui: 'BLOCKED', wholeFeedbackGateSigned: false,
  wholeParentGateSigned: false, commitSigned: false, released: true, stop: true }
writeFileSync(join(testing, `${prefix}-audit.json`), `${JSON.stringify(audit, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ sourceReview: audit.sourceReview, results: results.map(r => ({
  suite: r.suite, tests: r.tests, files: r.files, exit: r.command.originalExit, reporterSha256: r.reporterSha256,
})), noemitExit: noemit.originalExit, protectedObjects: close.protection.protectedObjects,
  sourceAutoVerdict: 'PASS', gui: 'BLOCKED', released: true, stop: true }))

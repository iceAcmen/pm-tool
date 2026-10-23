import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

function parser(pkgRoot, source) {
  const ts = createRequire(join(pkgRoot, 'package.json'))('typescript')
  const file = ts.createSourceFile('panel.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  assert.equal(file.parseDiagnostics.length, 0, 'feedback contract: source must parse')
  const nodes = []
  function visit(node) { nodes.push(node); ts.forEachChild(node, visit) }
  visit(file)
  const id = (node, name) => !!node && ts.isIdentifier(node) && node.text === name
  const calls = (root, name) => nodes.filter(n => ts.isCallExpression(n) && id(n.expression, name) &&
    n.pos >= root.pos && n.end <= root.end)
  const variable = name => {
    const matches = nodes.filter(n => ts.isVariableDeclaration(n) && id(n.name, name))
    assert.equal(matches.length, 1, `feedback contract: unique ${name}`)
    return matches[0]
  }
  const prop = (object, name) => {
    assert(ts.isObjectLiteralExpression(object), `feedback contract: ${name} must be object property`)
    const matches = object.properties.filter(p =>
      (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && id(p.name, name))
    assert.equal(matches.length, 1, `feedback contract: unique property ${name}`)
    return ts.isShorthandPropertyAssignment(matches[0]) ? matches[0].name : matches[0].initializer
  }
  return { ts, file, nodes, id, calls, variable, prop }
}

function verifyPanelState(p) {
  const { ts, id, variable, calls, prop, nodes } = p
  const setter = variable('setMessage').initializer
  assert(ts.isArrowFunction(setter), 'feedback contract: setMessage must be state publisher')
  assert.deepEqual(setter.parameters.map(n => n.name.text), ['next', 'context'])
  const updates = calls(setter, 'setFeedback')
  assert.equal(updates.length, 1, 'feedback contract: one atomic feedback update')
  const update = updates[0].arguments[0]
  assert(ts.isArrowFunction(update))
  let object = update.body
  while (ts.isParenthesizedExpression(object)) object = object.expression
  assert(id(prop(object, 'message'), 'next'), 'feedback contract: full message goes to state')
  assert(id(prop(object, 'context'), 'context'), 'feedback contract: actual context goes to state')
  const bindings = nodes.filter(n => ts.isVariableDeclaration(n) && id(n.initializer, 'feedback'))
  assert.equal(bindings.length, 1)
  assert(ts.isObjectBindingPattern(bindings[0].name))
  const aliases = Object.fromEntries(bindings[0].name.elements.map(e =>
    [e.propertyName?.text ?? e.name.text, e.name.text]))
  assert.equal(aliases.message, 'message')
  assert.equal(aliases.context, 'feedbackContext')
  for (const name of ['ResultCard', 'FeedbackToast']) {
    const elements = nodes.filter(n => (ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) && id(n.tagName, name))
    assert(elements.length > 0, `feedback contract: actual ${name} wired`)
    for (const element of elements) {
      for (const [key, value] of [['message', 'message'], ['context', 'feedbackContext']]) {
        const attrs = element.attributes.properties.filter(a => ts.isJsxAttribute(a) && id(a.name, key))
        assert.equal(attrs.length, 1, `feedback contract: ${name} ${key} present`)
        assert(ts.isJsxExpression(attrs[0].initializer) && id(attrs[0].initializer.expression, value),
          `feedback contract: ${name} receives actual ${key}`)
      }
    }
  }
}

export function verifyCatchFeedback(panelSource, pkgRoot) {
  const p = parser(pkgRoot, panelSource)
  const { ts, id, variable, calls, prop } = p
  const run = variable('run').initializer
  assert(ts.isArrowFunction(run) && ts.isBlock(run.body))
  const tries = run.body.statements.filter(ts.isTryStatement)
  assert.equal(tries.length, 1)
  const catcher = tries[0].catchClause
  assert(catcher && id(catcher.variableDeclaration.name, 'error'))
  // A direct catch statement excludes quiet guards, nested branches and unreachable tail calls.
  const statements = catcher.block.statements
  assert(ts.isExpressionStatement(statements[0]) && ts.isCallExpression(statements[0].expression))
  const publish = statements[0].expression
  assert(id(publish.expression, 'setMessage'), 'feedback contract: unconditional global catch publisher')
  assert.equal(publish.arguments.length, 2, 'feedback contract: catch must publish explicit context')
  const reason = publish.arguments[0]
  assert(ts.isCallExpression(reason) && id(reason.expression, 'prefixFeedbackOnce'))
  assert.equal(reason.arguments.length, 2)
  assert(ts.isStringLiteral(reason.arguments[0]) && reason.arguments[0].text === '执行失败')
  assert(id(reason.arguments[1], 'error'), 'feedback contract: preserve complete caught reason')
  const kind = prop(publish.arguments[1], 'kind')
  assert(ts.isStringLiteral(kind) && kind.text === 'error', 'feedback contract: explicit error kind')
  assert.equal(calls(catcher.block, 'refresh').length, 0, 'feedback contract: catch never refreshes')
  assert(statements.some(n => ts.isReturnStatement(n) && n.expression?.kind === ts.SyntaxKind.FalseKeyword),
    'feedback contract: catch returns false')
  verifyPanelState(p)
}

export function verifyNoticeContext(panelSource, pkgRoot) {
  const p = parser(pkgRoot, panelSource)
  verifyPanelState(p)
  for (const [source, name] of [
    [panelSource, 'FeedbackToast'],
    [readFileSync(join(pkgRoot, 'src/client/result-card.tsx'), 'utf8'), 'ResultCard'],
  ]) {
    const q = parser(pkgRoot, source), { ts, nodes, id, calls } = q
    const functions = nodes.filter(n => ts.isFunctionDeclaration(n) && id(n.name, name))
    assert.equal(functions.length, 1)
    const fn = functions[0], binding = fn.parameters[0]?.name
    assert(binding && ts.isObjectBindingPattern(binding))
    for (const key of ['message', 'context']) {
      assert(binding.elements.some(e => id(e.name, key) && (!e.propertyName || id(e.propertyName, key))),
        `feedback contract: ${name} consumes actual ${key} prop`)
    }
    const classifications = calls(fn, 'classifyFeedback')
    assert.equal(classifications.length, 1, `feedback contract: ${name} production classifier`)
    assert.equal(classifications[0].arguments.length, 2)
    assert(id(classifications[0].arguments[0], 'message') && id(classifications[0].arguments[1], 'context'),
      `feedback contract: ${name} classifies actual message and context`)
  }
}

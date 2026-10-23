// Independent evidence/production-ops diagnosis. No browser, service, or product writes.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative } from 'node:path'
import { runInNewContext } from 'node:vm'
import { execFileSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const req = createRequire(resolve(repo, 'packages/dsh-pm-tool/package.json'))
const ts = req('typescript')
const React = req('react')
const RGL = req('react-grid-layout')
const utils = req('react-grid-layout/build/utils.js')
const calc = req('react-grid-layout/build/calculateUtils.js')
const sha = b => createHash('sha256').update(b).digest('hex')
const evidence = new Map()
const read = p => {
  const path = resolve(repo, p)
  const bytes = readFileSync(path)
  evidence.set(relative(repo, path), { sha256: sha(bytes), bytes: bytes.length })
  return bytes
}
const json = p => JSON.parse(read(p).toString())
const board = 'packages/dsh-pm-tool/src/client/board/'
const cache = new Map()
// Type erasure occurs in memory only; no emitted files or product build.
function sourceModule(name) {
  if (cache.has(name)) return cache.get(name)
  assert(['editor-ops.ts', 'projection.ts', 'persist.ts', 'types.ts'].includes(name))
  const path = resolve(repo, board, name)
  const source = read(board + name).toString()
  const output = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  const module = { exports: {} }
  cache.set(name, module.exports)
  runInNewContext(output, {
    module, exports: module.exports, structuredClone,
    require: p => {
      assert.equal(p, './types.js')
      return sourceModule('types.ts')
    },
  }, { filename: path })
  return module.exports
}
const plain = value => JSON.parse(JSON.stringify(value))
const ops = sourceModule('editor-ops.ts')
const projection = sourceModule('projection.ts')
const persist = sourceModule('persist.ts')
const { GRID } = sourceModule('types.ts')
const fixturePath = 'docs/testing/board-fixture-clarification-20261021-fixture.json'
const fixture = json(fixturePath)
const prefix = 'reports/all-pending-evidence-20261021/A5/board/'
const records = json(prefix + 'original-drag-states.json')
const imported = json(prefix + 'fixture-import.json')
assert.deepEqual(records.map(s => s.label), ['drag0', 'drag1-drop', 'drag1'])
for (const n of ['original-drag0.png', 'original-drag1-drop.png', 'original-drag1.png', 'fixture.png']) read(prefix + n)
for (const n of ['editor.tsx', 'BoardBento.tsx', 'board.css', 'widgets.tsx',
  'editor-compact.test.ts', 'editor-ops.test.ts', 'editor-geometry.test.ts']) read(board + n)
const scriptPath = '/tmp/pmtool-board-original-drag-20261021.mjs'
const script = readFileSync(scriptPath)
const candidate = json('reports/all-pending-evidence-20261021/A0/candidate.json')
const artifacts = json('reports/all-pending-evidence-20261021/A0/all-built-files.json')
const artifactCount = Object.keys(artifacts).length
const proof = json('reports/all-pending-evidence-20261021/A0/final-build-proof.json')
assert.deepEqual(proof.before.sources, proof.after.sources)
assert.deepEqual(proof.before.built, proof.after.built)
assert.equal(Object.keys(proof.before.built).length, 453)
const proofSourceMatches = [...evidence].filter(([p]) => p.startsWith(board)).map(([p, info]) => {
  const key = p.slice('packages/dsh-pm-tool/'.length)
  assert.equal(info.sha256, proof.after.sources[key])
  return key
})
const catalog = new Map()
const widgetAst = ts.createSourceFile('widgets.tsx', read(board + 'widgets.tsx').toString(),
  ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
    const props = new Map(node.initializer.properties
      .filter(ts.isPropertyAssignment).map(p => [p.name.getText(widgetAst), p.initializer]))
    const type = props.get('type')
    if (type && ts.isStringLiteral(type) && props.has('minW') && props.has('minH')) {
      catalog.set(type.text, { minW: Number(props.get('minW').getText(widgetAst)),
        minH: Number(props.get('minH').getText(widgetAst)),
        emptyDefault: props.get('defaultConfig')?.getText(widgetAst) === '{}' })
    }
  }
  ts.forEachChild(node, visit)
}
visit(widgetAst)
for (const w of fixture.widgets) {
  const desc = catalog.get(w.type)
  assert(desc)
  assert.equal(w.layout.minW, desc.minW)
  assert.equal(w.layout.minH, desc.minH)
  assert.equal(desc.emptyDefault, true)
  assert.deepEqual(w.config, {})
}
const known = new Set(catalog.keys())
const parsed = persist.parseLayout(fixture)
assert(parsed)
const safe = persist.sanitizeLayout(parsed, GRID.cols, known)
assert.deepEqual(plain(safe.widgets), fixture.widgets)
assert.equal(safe.warnings.length, 0)
assert.equal(safe.skipped.length, 0)
const ids = fixture.widgets.map(w => w.i)
const heights = fixture.widgets.map(w => w.layout.h)
const rows = layout => Array.from(layout, l => l.y)
const initial = fixture.widgets.map(w => ({ ...w.layout, static: false }))
const params = { cols: 12, rowHeight: 36, margin: [12, 12],
  containerPadding: [12, 12], containerWidth: 960, maxRows: Infinity }
const geometry = records.map(record => {
  assert.deepEqual(record.current.cards.map(c => c.id), ids)
  const layouts = record.current.cards.map((card, index) => {
    const m = /^matrix\(([^)]+)\)$/.exec(card.transform)
    assert(m)
    const values = m[1].split(',').map(Number)
    const y = (values[5] - 12) / 48
    assert(Number.isInteger(y))
    assert.equal(values[4], 12)
    assert.equal(card.bbox.width, 936)
    assert.equal(card.bbox.height, heights[index] * 48 - 12)
    assert.equal(card.bbox.top - record.current.grid.bbox.top, 12 + 48 * y)
    return { ...fixture.widgets[index].layout, y }
  })
  const maxBottomRow = Math.max(...layouts.map(l => l.y + l.h))
  const collisions = persist.findCollisions(layouts.map((l, i) => ({ ...fixture.widgets[i], layout: l })))
  assert.equal(collisions.length, 0)
  assert.equal(record.current.grid.scrollHeight, maxBottomRow * 48 + 12)
  return {
    label: record.label, at: record.current.at, rows: rows(layouts), layouts,
    topHole: [0, Math.min(...rows(layouts))], maxBottomRow, collisions: plain(collisions),
    gridHeight: record.current.grid.bbox.height,
    gridScrollHeight: record.current.grid.scrollHeight,
    stageHeight: record.current.stage.bbox.height,
    stageScrollHeight: record.current.stage.scrollHeight,
    shellScrollTop: record.current.shell.scrollTop,
    shellScrollHeight: record.current.shell.scrollHeight,
    undoDisabled: record.current.undo,
  }
})
assert.deepEqual(geometry[0].rows, [0, 6, 8, 10, 12, 14])
assert.deepEqual(geometry[1].rows, [12, 18, 20, 22, 24, 26])
assert.deepEqual(geometry[2].rows, geometry[1].rows)
assert.equal(geometry[0].undoDisabled, true)
assert.equal(geometry[2].undoDisabled, false)
const drop = records[1]
const a = drop.current.cards.find(c => c.id === 'w-hero')
const d = drop.current.cards.find(c => c.id === 'w-obj')
assert(a.bbox.top < d.bbox.bottom)
assert(drop.current.placeholder.top < d.bbox.bottom)
assert.equal(drop.pointer.destination.y - drop.pointer.start.y, 576)
assert.equal(records[2].current.placeholder, undefined)
assert.equal(drop.pointer.destination.y >= 0 && drop.pointer.destination.y < 900, true)
const manifestDiff = {
  added: Object.keys(imported.after).filter(k => !(k in imported.before)),
  removed: Object.keys(imported.before).filter(k => !(k in imported.after)),
  changed: Object.keys(imported.before).filter(k => k in imported.after && imported.before[k] !== imported.after[k]),
}
assert.deepEqual(manifestDiff, { added: [], removed: [], changed: ['/pmtool/settings/dashboard_user.json'] })

// Production dependency replay at the observed rounded rows, not a GUI execution.
function replay(compactType) {
  let layout = structuredClone(initial)
  const frames = []
  for (let y = 1; y <= 12; y++) {
    layout = utils.moveElement(layout, utils.getLayoutItem(layout, 'w-hero'),
      0, y, true, false, compactType, 12, false)
    layout = utils.compact(layout, compactType, 12)
    frames.push({ requestedRow: y, rows: rows(layout) })
  }
  return { layout, frames }
}
const replayNull = replay(null)
assert.deepEqual(rows(replayNull.layout), geometry[2].rows)
const observedNext = geometry[2].layouts
const reversed = projection.reverseFromBreakpoint(fixture.widgets, observedNext, 12)
const compacted = ops.compactVertical(reversed, 12)
assert.deepEqual(plain(compacted), fixture.widgets)
assert.deepEqual(rows(replayNull.layout), geometry[2].rows)
assert.deepEqual(rows(initial), [0, 6, 8, 10, 12, 14])
const savedRoundtrip = persist.loadDashboard({ ...fixture, widgets: compacted }, known)
assert.deepEqual(plain(savedRoundtrip.layout.widgets), fixture.widgets)
const sanitizeRaw = persist.sanitizeLayout({ ...fixture, widgets: reversed }, 12, known)
assert.deepEqual(rows(sanitizeRaw.widgets.map(w => w.layout)), geometry[2].rows)

const children = ids.map(id => React.createElement('div', { key: id }))
const toRGL = widgets => widgets.map(w => ({
  i: w.layout.i, x: w.layout.x, y: w.layout.y, w: w.layout.w, h: w.layout.h,
  minW: w.layout.minW, minH: w.layout.minH, static: false,
}))
const initialProps = toRGL(fixture.widgets)
const compactProps = toRGL(compacted)
const prevState = {
  activeDrag: null, layout: replayNull.layout, propsLayout: initialProps,
  children, compactType: null, mounted: true,
}
const nextProps = { ...RGL.defaultProps, cols: 12, compactType: null,
  layout: compactProps, children, allowOverlap: false }
const derived = RGL.getDerivedStateFromProps(nextProps, prevState)
assert.equal(derived, null)
// Discriminate value equality from object identity and activeDrag timing.
assert.equal(RGL.getDerivedStateFromProps({ ...nextProps, layout: structuredClone(compactProps) }, prevState), null)
const changedProps = structuredClone(compactProps)
changedProps.find(l => l.i === 'w-risk').y = 15
const derivedChanged = RGL.getDerivedStateFromProps({ ...nextProps, layout: changedProps }, prevState)
assert(derivedChanged)
assert.deepEqual(rows(derivedChanged.layout), [0, 6, 8, 10, 12, 15])
const fresh = utils.synchronizeLayoutWithChildren(compactProps, children, 12, null, false)
assert.deepEqual(rows(fresh), rows(initial))
const replayVertical = replay('vertical')
const verticalA = utils.getLayoutItem(replayVertical.layout, 'w-hero')
const verticalD = utils.getLayoutItem(replayVertical.layout, 'w-obj')
let minimized = [
  { i: 'a', x: 0, y: 0, w: 12, h: 6 },
  { i: 'b', x: 0, y: 6, w: 12, h: 2 },
]
for (let y = 1; y <= 12; y++) {
  minimized = utils.moveElement(minimized, minimized[0], 0, y, true, false, null, 12, false)
  minimized = utils.compact(minimized, null, 12)
}
assert.deepEqual(rows(minimized), [12, 18])
const minWidgets = minimized.map(l => ({ i: l.i, type: 'textNote', config: {}, layout: l }))
assert.deepEqual(rows(ops.compactVertical(minWidgets, 12).map(w => w.layout)), [0, 6])
const singleStep = utils.compact([
  { i: 'a', x: 0, y: 12, w: 12, h: 6 },
  { i: 'b', x: 0, y: 6, w: 12, h: 2 },
], null, 12)
assert.deepEqual(rows(singleStep), [12, 6])
assert.equal(calc.calcGridItemPosition(params, 0, 12, 12, 6).top, 588)

const depFiles = ['package.json', 'build/utils.js', 'build/ReactGridLayout.js',
  'build/GridItem.js', 'build/calculateUtils.js']
const dependencyHashes = Object.fromEntries(depFiles.map(n => {
  const path = req.resolve('react-grid-layout/' + n)
  const bytes = readFileSync(path)
  return [n, { sha256: sha(bytes), bytes: bytes.length }]
}))
assert.equal(req('react-grid-layout/package.json').version, '1.4.4')
const sourceStable = [...evidence].every(([p, old]) => sha(readFileSync(resolve(repo, p))) === old.sha256)
assert(sourceStable)
const result = {
  at: new Date().toISOString(), scope: 'independent evidence + production pure/dependency ops; NOT GUI or fix acceptance',
  environment: { platform: process.platform, arch: process.arch, node: process.version, typescript: ts.version,
    rgl: '1.4.4', head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim() },
  candidateReference: { baselineCommit: candidate.baselineCommit, productBase: candidate.productBase,
    bundles: candidate.bundles, artifactManifestEntries: artifactCount, proofTopLevelKeys: Object.keys(proof),
    proofSourceMatches, archivedSourceEntries: Object.keys(proof.before.sources).length,
    archivedSourceAndArtifactBeforeAfterEqual: true,
    liveServingBytesVerified: false, privateRuntimeRead: false },
  evidence: Object.fromEntries(evidence), dependencyHashes,
  mainScript: { readPath: scriptPath, sha256: sha(script), bytes: script.length, executed: false,
    sourceText: script.toString(),
    secondDragGuardBeforeMove: script.toString().includes('destination out of viewport'),
    interruptedBoundaryExists: existsSync(resolve(repo, prefix + 'original-drag-boundary.json')) },
  fixture: { initialLegal: true, knownTypesSource: 'production widgets.tsx descriptor AST',
    catalogMinimums: Object.fromEntries(fixture.widgets.map(w => [w.type, catalog.get(w.type)])),
    initializationManifestEntries: Object.keys(imported.before).length, manifestDiff,
    transientImportDraftGeometryNotUsedAsStableInitial: true },
  geometry, target: { actualATop: a.bbox.top, actualDBottom: d.bbox.bottom,
    placeholderTop: drop.current.placeholder.top, placeholderRoundedRow: (drop.current.placeholder.top - drop.current.grid.bbox.top - 12) / 48,
    actualADRelationReached: false, pointer: drop.pointer, threeDragsExecuted: false },
  productionOps: {
    replayNullFrames: replayNull.frames, replayNullRows: rows(replayNull.layout),
    reverseAndCompactRows: rows(compacted.map(w => w.layout)), compactEqualsInitial: true,
    persistedParseSanitizeCompactedRows: rows(savedRoundtrip.layout.widgets.map(w => w.layout)),
    sanitizeRawRows: rows(sanitizeRaw.widgets.map(w => w.layout)),
    unchangedPropsDerivedResult: derived, freshObjectSameValuesDerivedResult: null,
    changedValuesDerivedRows: rows(derivedChanged.layout), freshSynchronizationRows: rows(fresh),
    verticalCounterfactualFrames: replayVertical.frames,
    verticalCounterfactualRows: rows(replayVertical.layout),
    verticalCounterfactualADRelation: verticalA.y >= verticalD.y + verticalD.h,
    minimalTwoCardRawRows: rows(minimized),
    singleStepTwoCardRows: rows(singleStep),
    renderedStateRows: rows(derived?.layout ?? prevState.layout),
  },
  sourceStable, disposition: {
    observation: 'LIMITED_FAIL: post-release visible top hole and cascading push',
    callSiteMechanism: 'reproduced dependency null compaction + equal-props resynchronization gap; live draft/export not collected',
    completeGate: 'BLOCKED; no full original three-drag journey, video, save/cancel, or live candidate binding',
  },
}
if (process.argv.includes('--output')) {
  writeFileSync(resolve(repo, 'docs/testing/board-fullwidth-drag-diagnosis-20261021-result.json'), JSON.stringify(result, null, 2) + '\n')
}
console.log(JSON.stringify({
  sourceStable, evidenceCount: evidence.size, observedRows: geometry.map(g => g.rows),
  reverseAndCompactRows: result.productionOps.reverseAndCompactRows,
  unchangedPropsDerivedResult: derived,
  verticalCounterfactualRows: result.productionOps.verticalCounterfactualRows,
  artifactManifestEntries: artifactCount, disposition: result.disposition,
}, null, 2))
if (process.argv.includes('--red')) {
  assert.deepEqual(rows(derived?.layout ?? prevState.layout), rows(compactProps),
    'Production RGL retained pushed rows instead of the compact canonical props (non-GUI seam)')
}

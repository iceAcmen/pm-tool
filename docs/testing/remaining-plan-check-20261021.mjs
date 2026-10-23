import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Only validates the expert's plan. It does not build, start services or run product tests.
const root = dirname(fileURLToPath(import.meta.url))
const names = [
  'remaining-acceptance-register-20261021.md',
  'remaining-journey-cases-20261021.md',
  'remaining-objective-cases-20261021.md',
  'remaining-governance-cases-20261021.md',
  'remaining-layer-map-20261021.md',
]
const docs = new Map(names.map(name => [name, readFileSync(resolve(root, name), 'utf8')]))
for (const [name, text] of docs) {
  assert.equal(text.split('```').length % 2, 1, `${name}: unbalanced fences`)
  assert.ok(!text.split('\n').some(line => /[ \t]+$/.test(line)), `${name}: trailing whitespace`)
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0]
    if (!target || /^[a-z]+:\/\//i.test(target)) continue
    assert.ok(existsSync(resolve(root, target)), `${name}: missing link ${target}`)
  }
}

function tableIds(text, prefix) {
  return [...text.matchAll(new RegExp(`^\\| (${prefix}[A-Za-z0-9-]+)(?= [|/])`, 'gm'))]
    .map(match => match[1])
}
const oldOp = tableIds(readFileSync(resolve(root, 'objective-progress-acceptance.md'), 'utf8'), 'OP-')
const mappedOp = tableIds(docs.get(names[2]), 'OP-')
assert.deepEqual([...mappedOp].sort(), [...oldOp].sort(), 'Original OP IDs must be retained exactly once')
const ids = names.slice(1).flatMap(name => tableIds(docs.get(name), 'RA-'))
assert.equal(new Set(ids).size, ids.length, 'Duplicate primary RA IDs')
const families = {
  'RA-D': ['02', '03', '06', '07', '10', '11', '12'],
  'RA-J': 6, 'RA-M': 7, 'RA-F': 8, 'RA-R': 5,
  'RA-OP': 6, 'RA-AI': 6, 'RA-P00': 8, 'RA-P10': 6,
  'RA-P20': 7, 'RA-P30': 5, 'RA-CI': 2, 'RA-TOOL': 4,
  'RA-B4': 4, 'RA-N': 1, 'RA-IM': 1,
  'RA-DR-': 42, 'RA-MENU-': 39,
}
for (const [prefix, expected] of Object.entries(families)) {
  const suffixes = Array.isArray(expected)
    ? expected
    : Array.from({ length: expected }, (_, i) => String(i + 1).padStart(2, '0'))
  for (const suffix of suffixes) assert.ok(ids.includes(`${prefix}${suffix}`), `Missing ${prefix}${suffix}`)
}
for (const name of ['remaining-journey-cases-20261021.md', 'remaining-governance-cases-20261021.md']) {
  assert.match(docs.get(name), /NOT_RUN/, `${name}: missing initial status`)
}

const widgets = [
  'completionHero', 'completionTrend', 'divider', 'formulaCard', 'kpiMetric',
  'milestoneDeliverable', 'objectiveProgress', 'overdueSoon', 'peopleLoad',
  'projectScale', 'queueCard', 'recordList', 'riskMatrix', 'statusRing', 'textNote', 'weeklyPlan',
]
const routes = [
  'dash', 'overview', 'tasks', 'gantt', 'milestones', 'risk-issues',
  'people', 'meetings', 'reports', 'deliverables', 'okrs', 'habits',
]
const fixtures = {
  empty: 'F0', typical: '按旅程单路由表F1/F3/F5/F7', dense: 'FD',
  long: 'FL', loading: 'FE', error: 'FB', stale: 'FS', noresult: 'F0不命中搜索',
}
const matrix = []
for (const route of routes) {
  for (const width of [1440, 1024, 768, 390]) {
    for (const theme of ['light', 'dark']) {
      for (const zoom of [100, 200]) {
        const states = ['empty', 'typical', 'dense', 'long', 'loading', 'error']
        if (route === 'tasks') states.push('stale', 'noresult')
        for (const state of states) {
          matrix.push({
            id: `RA-V-${route}-${width}-${theme}-${zoom}-${state}`,
            route, widthBeforeZoom: width, heightBeforeZoom: 900, theme, nativeZoomPercent: zoom,
            state, fixture: fixtures[state], gate: 'GUI', status: 'NOT_RUN',
            steps: 'remaining-journey-cases-20261021.md#61-页面矩阵',
            evidence: null,
          })
        }
      }
    }
  }
}
assert.equal(matrix.length, 1184)
assert.equal(new Set(matrix.map(row => row.id)).size, matrix.length)
for (const widget of widgets) assert.ok(docs.get(names[1]).includes(widget), `Missing widget ${widget}`)

const summary = {
  kind: 'expert-plan-integrity-only',
  productTestRun: false,
  originalOpMapped: oldOp.length,
  explicitRaRows: ids.length,
  pageMatrixRows: matrix.length,
  drawerRows: 42,
  menuRows: 39,
  widgetRows: widgets.length,
  filesChecked: names,
}
if (process.argv.includes('--matrix')) {
  console.log(JSON.stringify({ summary, cases: matrix }, null, 2))
} else {
  console.log(JSON.stringify(summary, null, 2))
}

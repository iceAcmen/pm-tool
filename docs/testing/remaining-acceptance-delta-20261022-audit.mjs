import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// This audit reads documents only; it never loads product or evidence executors.
const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')
const prefix = 'remaining-acceptance-delta-20261022'
const revision = process.argv[2] ?? ''
if (revision && !/^r[2-9][0-9]*$/.test(revision)) throw new Error('Invalid revision')
const output = resolve(here, `${prefix}-index${revision ? `-${revision}` : ''}.json`)
if (existsSync(output)) throw new Error(`Refusing to overwrite: ${output}`)
const sourceFiles = new Map()
const issues = []
const load = (path) => {
  const full = resolve(root, path)
  if (!full.startsWith(`${root}/`)) throw new Error('Read outside repository')
  const bytes = readFileSync(full)
  const entry = {
    path: relative(root, full),
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
  sourceFiles.set(full, entry)
  return bytes.toString('utf8')
}
const mainPath = `docs/testing/${prefix}.md`
const ledgerPath = `docs/testing/${prefix}-ledger.md`
const main = load(mainPath)
const ledger = load(ledgerPath)
const contracts = [
  'docs/testing/remaining-journey-cases-20261021.md',
  'docs/testing/remaining-objective-cases-20261021.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/remaining-layer-map-20261021.md',
  'docs/testing/independent-acceptance-batch1-closure-plan-20261021.md',
  'docs/testing/a8-board-feedback-contract-20261021.md',
  'docs/testing/b1-b8-coverage-mapping-20261020.md',
]
const originals = new Map()
const contractTexts = new Map()
const idPattern = /\b(?:RA|OP|B1|BA|BF|PC)-(?:[A-Za-z0-9]+-)*[A-Za-z0-9]+\b/g
for (const path of contracts) {
  const text = load(path)
  contractTexts.set(path, text)
  for (const [number, line] of text.split('\n').entries()) {
    if (!line.startsWith('|')) continue
    const first = line.split('|')[1]
    const batch = first.match(/\*\*(B[1-8])\*\*/)?.[1]
    for (const id of [...(first.match(idPattern) ?? []), ...(batch ? [batch] : [])]) {
      const pointers = originals.get(id) ?? []
      pointers.push({ path, line: number + 1, originalCell: first.trim() })
      originals.set(id, pointers)
    }
  }
}
load('AGENTS.md')
load('docs/collaboration.md')
load('docs/testing/remaining-acceptance-register-20261021.md')
const executionPath = 'reports/all-pending-acceptance-execution-20261021.md'
const execution = load(executionPath)
const linkedReports = [...new Set(
  [...execution.matchAll(/\.\.\/docs\/testing\/([^\s)]+\.md)/g)]
    .map((match) => `docs/testing/${match[1]}`),
)]
const reportObservations = []
for (const path of linkedReports) {
  if (!existsSync(resolve(root, path))) {
    issues.push({ type: 'missingReferencedReport', path })
    continue
  }
  const text = load(path)
  reportObservations.push({
    path,
    mode: '全文读取；只摘原判定语句，不重跑、不独立重签',
    originalConclusionExcerpts: text.split('\n')
      .filter((line) => /^\|.*(PASS|FAIL|BLOCKED|关闭)/.test(line)
        || /\*\*.*(PASS|FAIL|BLOCKED|NOT_RUN)/.test(line))
      .slice(0, 3),
  })
}
const evidence = new Map()
for (const line of main.split('\n')) {
  if (!/^\| E\d{2} \|/.test(line)) continue
  const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
  const refs = [...cells[1].matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => relative(root, resolve(here, match[1].split('#')[0])))
  evidence.set(cells[0], {
    sourceDescription: cells[1],
    reports: refs,
    originalEvidencePointersAndSignedScope: cells[2],
  })
}
const rows = []
const seen = new Set()
for (const [number, line] of ledger.split('\n').entries()) {
  if (!line.startsWith('|')) continue
  const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
  if (cells.length !== 5 || !/^[A-Z][A-Za-z0-9-]+$/.test(cells[0])
      || cells[0] === 'ID') continue
  const [id, signedScope, source, remaining, affectedDomain] = cells
  if (seen.has(id)) issues.push({ type: 'duplicateLedgerId', id })
  seen.add(id)
  const evidenceCodes = [...new Set(source.match(/E\d{2}/g) ?? [])]
  for (const code of evidenceCodes) {
    if (!evidence.has(code)) issues.push({ type: 'missingEvidenceCode', id, code })
  }
  rows.push({
    id,
    ledger: { path: ledgerPath, line: number + 1 },
    originalContracts: originals.get(id) ?? [],
    signedSubscopeQuotedFromReports: signedScope,
    sourceAndCandidateBoundary: source,
    evidence: evidenceCodes.map((code) => ({ code, ...evidence.get(code) })),
    remainingRequiredByExistingContract: remaining,
    affectedDomain,
    judgmentByThisAudit: '无产品判定；只引用独立报告与逐ID台账',
  })
}
// The source snapshot is explicit: report edits after this audit are not silently inherited.
for (const [id, pointers] of originals) {
  if (!seen.has(id)) issues.push({ type: 'missingContractId', id, pointers })
}
const journeyPath = contracts[0]
const journey = contractTexts.get(journeyPath)
const routes = [
  'dash', 'overview', 'tasks', 'gantt', 'milestones', 'risk-issues',
  'people', 'meetings', 'reports', 'deliverables', 'okrs', 'habits',
]
const widths = [1440, 1024, 768, 390]
const themes = ['light', 'dark']
const zooms = [100, 200]
const states = ['empty', 'typical', 'dense', 'long', 'loading', 'error']
const pageLines = new Map()
for (const [number, line] of journey.split('\n').entries()) {
  if (!line.startsWith('|')) continue
  const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
  if (routes.includes(cells[0])) {
    pageLines.set(cells[0], { line: number + 1, cells })
  }
}
const samplesByRoute = {
  dash: ['E03', 'E21'],
  overview: ['E09'],
  tasks: ['E09', 'E15', 'E16', 'E17', 'E19', 'E22'],
  gantt: ['E07', 'E09'],
  milestones: ['E14'],
  'risk-issues': ['E14'],
  people: ['E12'],
  meetings: ['E10', 'E14'],
  reports: ['E08', 'E09'],
  deliverables: ['E03', 'E14'],
  okrs: ['E04', 'E12'],
  habits: ['E04', 'E16', 'E20'],
}
const widgetKinds = [
  'completionHero', 'completionTrend', 'divider', 'formulaCard', 'kpiMetric',
  'milestoneDeliverable', 'objectiveProgress', 'overdueSoon', 'peopleLoad',
  'projectScale', 'queueCard', 'recordList', 'riskMatrix', 'statusRing',
  'textNote', 'weeklyPlan',
]
for (const kind of widgetKinds) {
  if (!journey.includes(kind)) issues.push({ type: 'widgetNotInOriginal', kind })
  if (!seen.has(`RA-W-${kind}`)) issues.push({ type: 'missingWidgetId', kind })
}
const matrix = []
for (const route of routes) {
  const original = pageLines.get(route)
  if (!original) {
    issues.push({ type: 'missingOriginalPageRow', route })
    continue
  }
  for (const width of widths) {
    for (const theme of themes) {
      for (const zoom of zooms) {
        const routeStates = route === 'tasks' ? [...states, 'stale', 'noresult'] : states
        for (const state of routeStates) {
          const id = `RA-V-${route}-${width}-${theme}-${zoom}-${state}`
          const action = state === 'typical' ? original.cells[1]
            : ['empty', 'dense', 'long'].includes(state) ? original.cells[2]
              : ['loading', 'error'].includes(state) ? original.cells[3]
                : state === 'stale'
                  ? 'FS先成功snapshot，再真实拒读；旧数据/陈旧原因可辨，retry后恢复当前值'
                  : 'F0合法不命中搜索词；实际noresult、保搜索输入且零业务写'
          matrix.push({
            id,
            originalContract: { path: journeyPath, line: original.line },
            route,
            widthBeforeNativeZoom: width,
            heightBeforeNativeZoom: 900,
            theme,
            nativeZoomPercent: zoom,
            state,
            independentlySignedFullCell: null,
            historicalBoundary: '原格NOT_RUN；旧映射缺证BLOCKED保留，局部签署不能自动升整格',
            priorSubscopeEvidenceToMapFirst: samplesByRoute[route]
              .map((code) => ({ code, ...evidence.get(code) })),
            existingContractActionAndFixture: action,
            remainingRequiredByExistingContract:
              '先按同候选/原生菜单/实际宽高主题状态/真实ID/动作时间段映射既有签署；'
              + '仅缺的本状态动作、主要控件键盘/滚动、持久或取消/错误恢复与目视补采。'
              + '缺能力/fixture写具体BLOCKED，不判产品FAIL，不默认转本人。',
            affectedDomain: `${route}/shared-shell/navigation/styles`,
            modelOrOwnerCondition:
              'Main可执行GUI，不因专家分工转MANUAL_PENDING；只有真实认证/OS本人授权必需时另列条件。',
          })
        }
      }
    }
  }
}
if (matrix.length !== 1184) issues.push({ type: 'matrixCount', actual: matrix.length })
if (new Set(matrix.map((row) => row.id)).size !== matrix.length) {
  issues.push({ type: 'duplicateMatrixId' })
}
const linksChecked = []
for (const [path, text] of [[mainPath, main], [ledgerPath, ledger]]) {
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0]
    if (/^[a-z]+:/i.test(target) || !target) continue
    const full = resolve(dirname(resolve(root, path)), target)
    linksChecked.push({ from: path, target: relative(root, full), exists: existsSync(full) })
    if (!existsSync(full)) issues.push({ type: 'missingLink', from: path, target })
    else if (full.endsWith('.md')) load(relative(root, full))
  }
  if (!text.endsWith('\n') || text.split('\n').some((line) => /[ \t]+$/.test(line))) {
    issues.push({ type: 'documentWhitespace', path })
  }
}
const result = {
  type: '有限纯文档证据对账索引；非产品测试/GUI验收/整体PASS',
  generatedAt: new Date().toISOString(),
  executionReportCutoff: '2026-10-22 09:25 +0800',
  baselineCommit: '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd',
  candidateBoundary: 'A18冻结/private/tmp/pmtool-a18-closure-20261022；A19主树开发另归属；HEAD不代dirty',
  productTestExecution: 'NOT_RUN，明确禁止',
  auditOnly: {
    node: process.version,
    os: process.platform,
    cwd: process.cwd(),
    command: `${process.execPath} ${relative(root, fileURLToPath(import.meta.url))}${revision ? ` ${revision}` : ''}`,
    expectedExitCode: issues.length ? 1 : 0,
    writes: [relative(root, output)],
    networkOrProductImportsOrSubprocesses: false,
    untouchedByConstruction: '仅readFileSync读取明列仓库文档，唯一writeFileSync为本前缀新index；不作全盘零漂移承诺',
  },
  counts: {
    ledgerIds: rows.length,
    originalOrdinaryContractIds: originals.size,
    matrixIds: matrix.length,
    allIndexedIds: rows.length + matrix.length,
    evidenceCodes: evidence.size,
    executionLinkedReportsRead: linkedReports.length,
    sourceDocuments: sourceFiles.size,
    linksChecked: linksChecked.length,
    issues: issues.length,
  },
  sourceDocuments: [...sourceFiles.values()],
  executionLinkedReportObservations: reportObservations,
  ledger: rows,
  matrix,
  issues,
  releasedResources: '无builder/GUI/服务/子测试资源；同步文件审计完成即退出',
}
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ counts: result.counts, issues, output: relative(root, output) }, null, 2))
process.exitCode = issues.length ? 1 : 0

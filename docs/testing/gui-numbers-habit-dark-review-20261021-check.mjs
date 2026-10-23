import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { resolve, relative, dirname } from 'node:path'
import { isDeepStrictEqual } from 'node:util'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'docs/testing/gui-numbers-habit-dark-review-20261021'
const evidenceRoot = 'reports/all-pending-evidence-20261021/'
const evidenceFiles = [
  'A0/candidate.json', 'A0/all-built-files.json', 'A0/habit/fixture.json',
  'A2/loaded/native-menu-100.json', 'A2/loaded/native-menu-100.png',
  'A2/loaded/combo-exact-response.json', 'A2/loaded/combo-exact-1.txt',
  'A3/candidate.json', 'A3/tracked.patch',
  'A3/execution-scripts/pmtool-number-closure-20261021.mjs',
  ...['numbers', 'numbers-r2'].flatMap(dir => [
    'initial.json', 'steps.json', 'initial.png', 'focus-0.png', 'focus-1.png',
    'copied-0.png', 'copied-1.png', 'denied.png',
  ].map(file => `A3/${dir}/${file}`)),
  ...['empty.json', 'empty.png', 'precheck.png', 'danger-confirm.png',
    'restore-continued.json', 'history-observations.json', 'restored-history-page.png',
    'month-1.png', 'month-2.png', 'month-3.png', 'history-390.png',
  ].map(file => `A3/habit/${file}`),
  'A5/candidate.json', 'A5/tracked.patch',
  'A5/dark/okr-inline-error.json', 'A5/dark/okr-inline-error.png',
  'A5/execution-scripts/index.json',
  ...['pmtool-habit-target-setup-20261021.py', 'pmtool-habit-restore-20261021.mjs',
    'pmtool-habit-continue-20261021.mjs', 'pmtool-habit-history-20261021.mjs',
    'pmtool-okr-dark-error-20261021.mjs',
  ].map(file => `A5/execution-scripts/${file}`),
]
const sourceFiles = [
  'packages/dsh-pm-tool/src/client/views/tasks.tsx',
  'packages/dsh-pm-tool/src/client/views/tasks.css',
  'packages/dsh-pm-tool/src/client/views/tasks-clipboard.ts',
  'packages/dsh-pm-tool/src/client/views/okr-form.tsx',
  'packages/dsh-pm-tool/src/core/habits.ts',
  'packages/dsh-pm-tool/src/client/views/habit-model.ts',
  'packages/dsh-pm-tool/src/client/views/habits.tsx',
]
const allowed = new Set([...evidenceFiles.map(file => evidenceRoot + file), ...sourceFiles])
const hashes = {}
const failures = []
function read(file) {
  if (!allowed.has(file)) throw new Error(`Not in delivered evidence/source allowlist: ${file}`)
  const data = readFileSync(resolve(repo, file))
  hashes[file] = { bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') }
  return data
}
function json(file) {
  return JSON.parse(read(evidenceRoot + file))
}
function check(condition, label) {
  if (!condition) failures.push(label)
}
function compare(a, b) {
  const added = Object.keys(b).filter(key => !(key in a))
  const deleted = Object.keys(a).filter(key => !(key in b))
  const changed = Object.keys(a).filter(key => key in b && a[key] !== b[key])
  return { before: Object.keys(a).length, after: Object.keys(b).length, added, deleted, changed }
}
for (const file of evidenceFiles) read(evidenceRoot + file)
for (const file of sourceFiles) read(file)
const images = {}
for (const file of evidenceFiles.filter(file => file.endsWith('.png'))) {
  const data = read(evidenceRoot + file)
  check(data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${file}: PNG header`)
  images[file] = { width: data.readUInt32BE(16), height: data.readUInt32BE(20) }
}
const numbers = json('A3/numbers-r2/steps.json')
const initial = json('A3/numbers-r2/initial.json')
const numberComparison = compare(numbers.before, numbers.after)
check(isDeepStrictEqual(initial.before, numbers.before), 'numbers: initial.before differs')
check(isDeepStrictEqual(numberComparison, { before: 7, after: 7, added: [], deleted: [], changed: [] }), 'numbers: seven-file comparison')
check(isDeepStrictEqual(initial.cells.map(cell => cell.text), ['1', '2']), 'numbers: initial codes')
for (const [i, row] of numbers.results.entries()) {
  check(row.expected === String(i + 1) && row.clipboard === row.expected && row.matches === true, `numbers row${i}: clipboard`)
  check(row.focus.tag === 'BUTTON' && row.focus.text === row.expected && row.focus.outline.endsWith('solid 2px'), `numbers row${i}: focus`)
  check(isDeepStrictEqual(row.copied, i === 0 ? ['已复制', '2'] : ['1', '已复制']), `numbers row${i}: independent feedback`)
}
check(isDeepStrictEqual(numbers.denied.cells, ['复制失败', '2']), 'numbers: denied feedback')
const okr = json('A5/dark/okr-inline-error.json')
const okrComparison = compare(okr.before, okr.after)
check(isDeepStrictEqual(okrComparison, { before: 5, after: 5, added: [], deleted: [], changed: [] }), 'OKR: five-domain-file comparison')
check(okr.observed.dark && okr.observed.input === 'okr-zzz-notexist' && okr.observed.error.length === 1, 'OKR: dark/input/error')
check(okr.observed.drawer.includes('编辑 OKR'), 'OKR: drawer retained')
const fixture = json('A0/habit/fixture.json')
const continued = json('A3/habit/restore-continued.json')
const history = json('A3/habit/history-observations.json')
const executionIndex = json('A5/execution-scripts/index.json')
for (const file of evidenceFiles.filter(file => file.startsWith('A5/execution-scripts/') && !file.endsWith('index.json'))) {
  check(hashes[evidenceRoot + file].sha256 === executionIndex[file.split('/').at(-1)], `${file}: archived execution script hash`)
}
check(isDeepStrictEqual(fixture.habit, continued.restoredRecord), 'habit: fixture/restoredRecord semantic equality')
const recentStart = '2026-10-08'
const recent = fixture.habit.checkIns.filter(item => item.at >= recentStart && item.at <= fixture.today).map(item => item.at).reverse()
const monthEntries = {}
for (const item of [...fixture.habit.checkIns].reverse()) {
  if (item.at < recentStart) (monthEntries[item.at.slice(0, 7)] ??= []).push(item)
}
check(isDeepStrictEqual(recent, ['2026-10-21', '2026-10-20', '2026-10-18', '2026-10-12', '2026-10-08']), 'habit: D-13 inclusive')
check(isDeepStrictEqual(Object.fromEntries(Object.entries(monthEntries).map(([key, value]) => [key, value.length])), {
  '2026-10': 1, '2026-09': 4, '2026-08': 4,
}), 'habit: monthly counts')
for (const [i, observation] of history.observations.entries()) {
  check(isDeepStrictEqual(observation.state.archives.map(item => item.open), [0, 1, 2].map(j => j <= i ? 'true' : 'false')), `habit month${i}: expanded states`)
  const entries = Object.values(monthEntries)[i]
  let cursor = -1
  for (const entry of entries) {
    const at = observation.state.text.indexOf(entry.at, cursor + 1)
    check(at > cursor, `habit month${i}: descending date ${entry.at}`)
    cursor = at
    check(observation.state.text.includes(entry.note), `habit month${i}: note ${entry.at}`)
  }
}
check(history.narrow.viewport.width === 390 && history.narrow.htmlWidth === 390 && history.narrow.pmWidth === 329, 'habit: delivered narrow geometry')
// Claims without their original byte manifests remain explicitly unverified.
const habitProtection = {
  producerRecordUnchanged: history.recordUnchanged,
  rawBeforeAfterHabitDelivered: false,
  producerByteComparisonInArchivedScript: read(evidenceRoot + 'A5/execution-scripts/pmtool-habit-history-20261021.mjs').toString().includes('recordUnchanged: before.equals(readFileSync('),
  rawBackupBytesDelivered: false,
  cancelBeforeAfterDelivered: false,
  fixtureRecordSemanticallyEqual: isDeepStrictEqual(fixture.habit, continued.restoredRecord),
  deliveredRestoredFileHash: Object.entries(continued.files).find(([key]) => key.includes('/habits/'))?.[1],
}
const a3 = json('A3/candidate.json')
const a5 = json('A5/candidate.json')
const candidateChanges = compare(
  Object.fromEntries(Object.entries(a3.source).map(([key, value]) => [key, value.sha256])),
  Object.fromEntries(Object.entries(a5.source).map(([key, value]) => [key, value.sha256])),
)
const currentPluginRecognition = {}
for (const [file, value] of Object.entries(a5.source).filter(([file]) => file.startsWith('packages/dsh-pm-tool/'))) {
  allowed.add(file)
  const data = read(file)
  currentPluginRecognition[file] = createHash('sha256').update(data).digest('hex') === value.sha256
  check(currentPluginRecognition[file], `current plugin recognition: ${file}`)
}
check(isDeepStrictEqual(candidateChanges.changed, [
  'launcher/src/launcher-app.mjs', 'launcher/src/launcher-core.mjs', 'launcher/test/browser-open.test.mjs',
]), 'A3/A5: claimed three-source change')
const built = json('A0/all-built-files.json')
check(Object.keys(built).length === 453, 'delivered build list: 453 entries')
check(isDeepStrictEqual(a3.bundles, a5.bundles), 'A3/A5: identical declared bundles')
const combo = json('A2/loaded/combo-exact-response.json')
const body = read(evidenceRoot + 'A2/loaded/combo-exact-1.txt')
const event = combo.events[0]
check(createHash('sha256').update(body).digest('hex') === event.responseSha256, 'combo: response bytes')
check(event.sourceSha256 === built['packages/dsh-pm-tool/lib/client.js'], 'combo: source hash binding')
check(createHash('sha256').update(body.subarray(event.firstOffset, event.firstOffset + event.segmentBytes)).digest('hex') === event.segmentSha256, 'combo: submitted segment')
const menu = json('A2/loaded/native-menu-100.json')
check(hashes[evidenceRoot + 'A2/loaded/native-menu-100.png'].sha256 === menu.sha256, 'menu: screenshot hash')
const result = {
  at: new Date().toISOString(), environment: { os: process.platform, node: process.version },
  role: '独立原证审查；不执行产品或GUI，不自动判完整门',
  candidate: { baseline: a5.baselineCommit, productBase: a5.productBase, version: a5.version, candidateChanges,
    currentPluginRecognition, declaredBundleEquality: isDeepStrictEqual(a3.bundles, a5.bundles),
    deliveredBuildListCount: Object.keys(built).length,
    actual453FilesRead: false, inheritance: '453字节核验仅引用已有独立报告；本工具不访问Main隔离树或runtime' },
  numbers: { comparison: numberComparison, initialCells: initial.cells, results: numbers.results, deniedCells: numbers.denied.cells },
  okr: { comparison: okrComparison, observed: okr.observed },
  habit: { recent, monthEntries, habitProtection, streak: continued.restoredRecord.streak,
    narrow: { viewport: history.narrow.viewport, htmlWidth: history.narrow.htmlWidth, pmWidth: history.narrow.pmWidth },
    actualMonthlyStates: history.observations.map(item => ({ month: item.month, at: item.state.at, archives: item.state.archives })) },
  zoom: { submittedMenuAt: menu.at, origin: menu.url, currentFrameOnly: true,
    historicalAllFramesInherited: false, habit3213Inherited: false },
  images, hashes, integrityFailures: failures,
  limitations: ['未持久交件录像不审完整动作', 'OKR实际主题选择/合法新建前置索引缺件',
    'F7生成exit/标准备份字节/恢复安全快照/取消保护尚缺原件',
    '无原始habit前后manifest，不把recordUnchanged布尔值当独立比较',
    '反馈文字裁切由专家实际目视裁决，JSON完整字符串不能替代视觉'],
}
const changedDuringCheck = Object.keys(hashes).filter(file => {
  const data = readFileSync(resolve(repo, file))
  return createHash('sha256').update(data).digest('hex') !== hashes[file].sha256
})
result.changedDuringCheck = changedDuringCheck
check(changedDuringCheck.length === 0, 'allowlisted input changed during check')
if (process.argv.includes('--output')) {
  const output = resolve(repo, `${prefix}-result.json`)
  if (!relative(repo, output).startsWith(prefix)) throw new Error('Output outside owned prefix')
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
}
console.log(JSON.stringify({
  at: result.at, evidenceFiles: evidenceFiles.length, numberComparison, okrComparison,
  recentCount: recent.length, archiveCounts: Object.values(monthEntries).map(entries => entries.length),
  habitProtection, candidateChanges, integrityFailures: failures,
}, null, 2))
process.exitCode = failures.length ? 1 : 0

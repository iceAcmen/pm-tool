// 独立证据核对与逐原ID索引。没有证据的原步骤不从测试总数推断通过。
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const base = path.join(repo, 'docs/testing/objective-number-independent-retest-20261021')
const latest = JSON.parse(fs.readFileSync(base + '-latest.json', 'utf8'))
const archive = latest.archive
assert.ok(archive.startsWith(base + '-evidence/'))
const read = name => JSON.parse(fs.readFileSync(path.join(archive, name), 'utf8'))
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const save = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
const execution = read('execution.json')
const commands = read('commands.json')
const before = read('inputs-before.json')
const after = read('inputs-after.json')
const candidate = read('candidate.json')
const dependencyAfter = read('dependencies-after.json')
const currentDependencyChanges = []
const dependencyNames = new Set()
function walkDependency(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    const rel = path.relative(candidate.dependencyRoot, file)
    if (entry.isDirectory()) { walkDependency(file); continue }
    dependencyNames.add(rel)
    const expected = dependencyAfter[rel]
    if (!expected) { currentDependencyChanges.push(rel); continue }
    if (entry.isSymbolicLink()) {
      if (fs.readlinkSync(file) !== expected.link || fs.realpathSync(file) !== expected.realpath)
        currentDependencyChanges.push(rel)
    } else if (entry.isFile() && sha(file) !== expected.sha256) currentDependencyChanges.push(rel)
  }
}
walkDependency(candidate.dependencyRoot)
for (const name of Object.keys(dependencyAfter)) {
  if (!dependencyNames.has(name)) currentDependencyChanges.push(name)
}
const compileOutputs = {}
function walkCompile(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walkCompile(file)
    else if (entry.isFile()) compileOutputs[path.relative(execution.own, file)] = sha(file)
  }
}
walkCompile(path.join(execution.own, 'compile'))
save(path.join(archive, 'compile-manifest.json'), compileOutputs)
for (const [file, identity] of Object.entries(before)) {
  const root = path.join(repo, 'packages/dsh-pm-tool/')
  if (file.startsWith(root)) {
    assert.equal(sha(path.join(execution.own, 'current/packages/dsh-pm-tool', path.relative(root, file))),
      identity.sha256, `冻结相关源/测试/配置副本 ${file}`)
  }
}
const currentInputChanges = []
for (const [file, identity] of Object.entries(after)) {
  if (sha(file) !== identity.sha256) currentInputChanges.push(file)
}
for (const command of commands) {
  assert.equal(sha(path.join(archive, command.id + '.stdout.txt')), command.stdoutSha256)
  assert.equal(sha(path.join(archive, command.id + '.stderr.txt')), command.stderrSha256)
  assert.equal(command.env.QA_OWN, execution.own)
  assert.ok(command.env.NODE_OPTIONS.includes('guard.mjs'))
  assert.equal(command.signal, null)
  assert.equal(command.error, null)
}
const results = {}
const assertions = []
for (const id of ['current-developer-15', 'old-same-new-tests', 'current-independent-boundary']) {
  const result = read(id + '.vitest.json')
  results[id] = { passed: result.numPassedTests, failed: result.numFailedTests,
    pending: result.numPendingTests, total: result.numTotalTests, success: result.success }
  for (const suite of result.testResults) suite.assertionResults.forEach((a, i) =>
    assertions.push({ command: id, file: suite.name, assertionIndex: i,
      name: a.fullName, status: a.status, duration: a.duration, failureMessages: a.failureMessages }))
}
assert.deepEqual(results['current-developer-15'], { passed: 114, failed: 0, pending: 0, total: 114, success: true })
assert.deepEqual(results['old-same-new-tests'], { passed: 6, failed: 24, pending: 0, total: 30, success: false })
assert.deepEqual(results['current-independent-boundary'], { passed: 17, failed: 0, pending: 0, total: 17, success: true })
const compileExit = commands.find(c => c.id === 'related-production-compile').exit
assert.ok([0, 2].includes(compileExit))
assert.equal(commands.find(c => c.id === 'old-same-new-tests').exit, 1)
for (const [rel, identity] of Object.entries({ ...candidate.products, ...candidate.newTests })) {
  assert.equal(read('frozen-copy-eight.json')[rel], identity.sha256)
  assert.equal(sha(path.join(execution.own, 'current/packages/dsh-pm-tool', rel)), identity.sha256)
}
assert.equal(sha(path.join(archive, 'five-products.patch')), candidate.patchSha256)
assert.deepEqual(read('dependencies-before.json'), read('dependencies-after.json'))
assert.equal(execution.rejectedOutsideOwn.length, 0)
const audit = fs.readFileSync(path.join(archive, 'write-audit.ndjson'), 'utf8')
  .trim().split('\n').map(s => JSON.parse(s))
assert.ok(audit.every(row => row.allowed && row.actual.startsWith(execution.own + '/')))
const events = fs.readFileSync(path.join(archive, 'current-independent-boundary.events.ndjson'), 'utf8')
  .trim().split('\n').map(s => JSON.parse(s))
assert.equal(events.filter(e => e.id === 'RA-OP04/invalid-write').length, 8)
for (const e of events.filter(e => e.id === 'RA-OP04/invalid-write' || e.id === 'OP-LEG-04/AUTO-render-only'))
  assert.deepEqual(e.data.before, e.data.after)
const dateOnly = events.find(e => e.id === 'OP-SRC-05/date-only')
assert.deepEqual(dateOnly.data.fields.filter(k => k !== 'updatedAt').sort(), ['dueDate', 'startDate'])
const oldByFile = Object.fromEntries([...new Set(assertions.filter(a => a.command === 'old-same-new-tests').map(a => a.file))]
  .map(file => [path.basename(file), assertions.filter(a => a.command === 'old-same-new-tests' && a.file === file)
    .reduce((acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc }, {})]))

const counts = { CK: 6, LEG: 4, DV: 7, RU: 7, EX: 5, EV: 3, SRC: 6, Q: 4, BD: 6, GUI: 3, DEFER: 6 }
const cases = Object.entries(counts).flatMap(([group, count]) =>
  Array.from({ length: count }, (_, i) => ({
    id: `OP-${group}-${String(i + 1).padStart(2, '0')}`,
    sourceAuto: 'NOT_RUN', gui: 'NOT_RUN',
    coverage: '本次未重复原步骤；原52局部PASS不自动升级为当前候选结果',
    evidence: [],
  })))
for (let i = 1; i <= 6; i++) cases.push({ id: `RA-OP${String(i).padStart(2, '0')}`,
  sourceAuto: 'NOT_RUN', gui: 'NOT_RUN', coverage: '本次未重复原步骤；原结果不可替代当前复验', evidence: [] })
cases.push({ id: 'GNHD-01', sourceAuto: 'NOT_RUN', gui: 'FAIL_OPEN',
  coverage: '历史视觉FAIL仍待新bundle真实MainGUI审证；结构/AUTO不关闭视觉门', evidence: [] })
function mark(id, coverage, selectors) {
  const c = cases.find(c => c.id === id)
  assert.ok(c, id)
  c.sourceAuto = 'PASS_LIMITED'
  c.coverage = coverage
  for (const needle of selectors) {
    const matched = assertions.filter(a => a.command !== 'old-same-new-tests' && a.name.includes(needle))
    assert.ok(matched.length, `无原断言 ${id} ${needle}`)
    assert.ok(matched.every(a => a.status === 'passed'))
    c.evidence.push(...matched.map(a => ({ command: a.command, file: path.basename(a.file),
      assertionIndex: a.assertionIndex, name: a.name })))
  }
}
const f2Table = 'F2 列表和树都显示'
const f2Overview = 'F2 总览阶段 P63'
const oldRead = '真实旧JSON恢复后'
mark('OP-CK-01', '仅原F2完整taskRecordSchema及缺新可选键parse；item额外键/重复ID负例本轮未重跑', ['原F2合法且常量'])
mark('OP-LEG-01', 'L3无清单legacy40只旁注、客观null；生产组件渲染，非真实GUI', [f2Table])
mark('OP-LEG-02', 'L6 done无清单legacy80仍证据不足/旁注；非真实GUI', [f2Overview])
mark('OP-LEG-04', '当前标准F2含旧非法协议记录恢复后mount/unmount与零文件变化；未验旧版本GUI', [oldRead])
mark('OP-DV-02', '全勾todo在真实组件显示pending，不自动done；未重新真实toggle动作', ['全勾todo只显示待验收'])
mark('OP-DV-03', 'done清单2/5客观40、不因done强填100；原软告警完整GUI未验', [f2Overview])
mark('OP-DV-04', 'done无清单null/无objective，不因done100；非GUI', [f2Overview])
mark('OP-DV-06', '空数组/缺清单null，不等于非空零勾0；真实组件标签和bar结构', [f2Table, '列表非空零勾显示0'])
mark('OP-RU-01', '原P63、M后代不重复、Plegacy100不进入；expected来自原F2报告', [f2Table, '原F2合法且常量'])
mark('OP-RU-03', '原F2覆盖2/3时文案已覆盖任务清单完成度；原1/3变体及boardGUI未重跑', [f2Table, f2Overview])
mark('OP-RU-06', '原F2 P→M→leaf聚合63可复算；本次无遍历复杂度/10000深树重测', ['原F2合法且常量'])
mark('OP-EV-01', '无信号null与非空零勾0文本/bar可辨；非浏览器视觉', ['列表非空零勾显示0'])
mark('OP-EV-02', '真实JSON只读四消费点mount/unmount前后记录/文件hash-size-mtime一致；不是整data保护', [oldRead])
mark('OP-SRC-01', 'TaskTable/树/Overview/Gantt生产组件同客观派生与人工模式；reports未在本轮重跑', [f2Table, f2Overview, '甘特人工70填70保客观40'])
mark('OP-SRC-05', '真实Gantt组件40/null/manual70/manual0填充及mode，objective保真；键盘真实命令日期唯一写，未pointerGUI', ['三fixture及人工0', '甘特人工70填70保客观40'])
mark('OP-SRC-06', '仅四消费点组件SOURCE/AUTO值/口径；原跨页即时真实GUI/reports未执行', [f2Table, f2Overview, '三fixture及人工0'])
mark('OP-BD-02', '当前JSON标准备份/precheck/restore/collect保旧字段与task对象；无Markdown往返或GUI', ['旧非法协议record仍可读'])
mark('OP-BD-03', '原F2当前标准备份及旧协议字段兼容；原旧formatVersion包本次未重复', ['旧非法协议record仍可读', oldRead])
mark('OP-DEFER-01', 'ADL055人工30/0/clear双轨不污染objective；非完整GUI', ['真实命令人工', '无清单人工0'])
mark('OP-DEFER-02', 'effort3.5读写/负数拒绝，客观不掺工时；未新增权重', ['合法http(s)trim及工时3.5'])
mark('OP-DEFER-03', '新写仅合法http(s)、旧读保留、零非法写；未新增Git自动裁决', ['RA-OP04 非法新写', '合法http(s)trim及工时3.5'])
mark('OP-DEFER-04', '复用completedDate真实完成/显式纠正/反转，清单不变；非表单只读GUI', ['RA-OP05 真实完成'])
for (const id of ['OP-DEFER-05', 'OP-DEFER-06']) {
  cases.find(c => c.id === id).sourceAuto = 'N/A'
  cases.find(c => c.id === id).coverage = '合同范围不新增多人同步/war-room热修，不是执行PASS'
}
mark('RA-OP01', '真实domain父人工30/0与组件叶人工30/0；objective50/P63/项目66不变；无表单GUI', ['真实命令人工', '人工%s可见'.replace('%s', '30'), '人工0可见'])
mark('RA-OP02', '真实命令clear/组件更新回落客观；无清单回落null/证据不足；未GUI取消draft', ['真实命令人工', '无清单人工0', '总览阶段人工'])
mark('RA-OP03', '仅组件wrapped自身100、无pending、父63覆盖2/3，改todo后75覆盖3/4；queue/stats/check未重跑', ['全勾todo只显示待验收'])
mark('RA-OP04', '生产schema+真实命令add/update非法协议/空/超长、混合draft/其他字段零写；http(s)/trim/3.5与旧备份保值；非GUI', ['RA-OP04 非法新写', '合法http(s)trim及工时3.5', '真实JSON domain命令'])
mark('RA-OP05', '真实done本地当天/显式日期/revert，旧done不补值，清单与legacy不变；无表单GUI', ['RA-OP05 真实完成'])
mark('GNHD-01', '常驻原code、同62px编号格独立role=status/全文字串/CSS可换行、不进任务cell；模拟clipboard和fake1599/1600ms有限AUTO。真实视觉FAIL仍开放', ['GNHD-01 编号复制真实组件结构', 'GNHD-01 合法原F2两code'])
assert.equal(cases.length, 64)
save(path.join(archive, 'case-disposition.json'), { candidate: candidate.products,
  at: new Date().toISOString(), cases, boundary: 'PASS_LIMITED不等原ID整项PASS；GUI NOT_RUN/BLOCKED按Main补件；GNHD视觉FAIL_OPEN' })
const table = '# 原 OP/RA/GNHD ID 有限复验索引\n\n> 57原OP + 6 RA + GNHD-01；不是64整项通过。断言索引见同级JSON。\n\n' +
  '| 原ID | SOURCE/AUTO | GUI | 本次覆盖及未验边界 |\n| --- | --- | --- | --- |\n' +
  cases.map(c => `| ${c.id} | ${c.sourceAuto} | ${c.gui} | ${c.coverage} |`).join('\n') + '\n'
fs.writeFileSync(path.join(archive, 'case-disposition.md'), table)
const sourceCurrent = currentInputChanges.filter(f => f.includes('/packages/dsh-pm-tool/'))
const result = { at: new Date().toISOString(), candidate, results, oldByFile,
  sourceInputCount: Object.keys(before).filter(f => f.startsWith(path.join(repo, 'packages/dsh-pm-tool/') )).length,
  frozenChanges: execution.changes, currentInputChanges, sourceCurrent,
  driftIdentities: Object.fromEntries(currentInputChanges.map(file => [file, {
    frozenBefore: before[file], frozenAfter: after[file], currentSha256: sha(file),
  }])),
  dependencyEntries: candidate.dependencyEntries, currentDependencyChanges,
  compileExit, compileOutputs: Object.keys(compileOutputs).length,
  writeOperations: audit.length, rejectedOutsideOwn: 0,
  assertions: assertions.length, caseRows: cases.length,
  verdict: compileExit !== 0
    ? '冻结SOURCE/AUTO有限PASS；相关生产入口compile FAIL，整体候选BLOCKED；GNHD视觉FAIL_OPEN'
    : sourceCurrent.length || currentDependencyChanges.length || execution.changes.some(f => f.includes('/packages/dsh-pm-tool/'))
    ? '冻结SOURCE/AUTO有限通过；当前依赖漂移，受影响当前适用性BLOCKED'
    : '当前冻结SOURCE/AUTO有限PASS；GNHD视觉FAIL_OPEN，原GUI缺证，不签整门' }
save(base + '-result.json', result)
save(path.join(archive, 'audit-result.json'), result)
save(path.join(archive, 'sha256-index.json'), Object.fromEntries(fs.readdirSync(archive)
  .filter(name => fs.statSync(path.join(archive, name)).isFile() && name !== 'sha256-index.json')
  .map(name => [name, sha(path.join(archive, name))])))
console.log(JSON.stringify(result, null, 2))
process.exitCode = compileExit !== 0 || sourceCurrent.length || currentDependencyChanges.length ||
  execution.changes.some(f => f.includes('/packages/dsh-pm-tool/')) ? 1 : 0

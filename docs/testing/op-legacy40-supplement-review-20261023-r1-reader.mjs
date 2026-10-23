import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const root = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const parent = `${root}/reports/all-pending-evidence-20261021/OpLegacyBrowseR1`
const supplement = `${parent}/legacy40-supplement`
const testing = `${root}/docs/testing`
const prefix = 'op-legacy40-supplement-review-20261023-r1'
const previous = `${testing}/op-legacy-browse-gui-review-20261022-r1`
const outputs = Object.fromEntries(['reader.mjs', 'audit.json', 'report.md', 'seal.json']
  .map(n => [n, `${testing}/${prefix}-${n}`]))
const receiptRoot = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
const expectedSupplement = [
  '40-visible-r2.json', '40-visible-r2.png', 'after-mtime-r2.json',
  'captured-execution.json', 'captured-output.log', 'failed-execution.json',
  'failed-output.log', 'observations.json', 'pmtool-legacy-40-round01.mjs',
  'pmtool-legacy-40-round02.mjs', 'pmtool-legacy-40-round03.mjs',
  'pmtool-legacy40-seal-r1.mjs',
].sort()
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const metadata = s => ({
  bytes: Number(s.size), mtimeNs: String(s.mtimeNs),
  ctimeNs: String(s.ctimeNs), ino: String(s.ino),
})
const inputs = {}
const checks = []
function check(name, operation) {
  operation()
  checks.push({ name, result: '符合审证预期' })
}
function fingerprint(file) {
  const before = fs.statSync(file, { bigint: true })
  assert.ok(before.isFile(), `Not a regular file: ${file}`)
  const b = fs.readFileSync(file)
  const after = fs.statSync(file, { bigint: true })
  assert.deepEqual(metadata(after), metadata(before), `Read drift: ${file}`)
  return { ...metadata(after), sha256: sha(b) }
}
function read(file) {
  const allowed = file.startsWith(`${parent}/`) ||
    [previous + '-reader.mjs', previous + '-audit.json', previous + '-report.md',
      previous + '-seal.json', `${root}/AGENTS.md`, `${root}/docs/collaboration.md`].includes(file) ||
    ['de773c380cdf1333e43401c4e0e63525', 'd1f3248add09faa4d12615be2f9e283d']
      .some(id => ['execution.json', 'output.log'].some(n => file === `${receiptRoot}/${id}/${n}`))
  assert.ok(allowed, `Out of read scope: ${file}`)
  const first = fingerprint(file)
  const b = fs.readFileSync(file)
  assert.equal(sha(b), first.sha256)
  assert.deepEqual(fingerprint(file), first)
  inputs[file] = first
  return b
}
const json = file => JSON.parse(read(file).toString('utf8'))
function indexedFile(base, name, expected) {
  assert.ok(!path.isAbsolute(name) && !name.split('/').includes('..'))
  const file = `${base}/${name}`
  read(file)
  check(`索引 byte/SHA: ${file}`, () => {
    assert.equal(inputs[file].bytes, expected.bytes)
    assert.equal(inputs[file].sha256, expected.sha256)
  })
  return { name, ...inputs[file] }
}
function writeOwned(key, value) {
  assert.ok(['audit.json', 'seal.json'].includes(key))
  fs.writeFileSync(outputs[key], JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function capture() {
  const ownedAtStart = fs.readdirSync(testing).filter(n => n.startsWith(prefix)).sort()
  check('唯一新增前缀未被占用', () => assert.deepEqual(ownedAtStart, [`${prefix}-reader.mjs`]))
  const killedPrefix = 'op-legacy40-supplement-review-20261022-r1'
  check('被中断上一补审没有同前缀产物', () =>
    assert.deepEqual(fs.readdirSync(testing).filter(n => n.startsWith(killedPrefix)), []))
  read(`${root}/AGENTS.md`)
  read(`${root}/docs/collaboration.md`)
  const previousReport = read(previous + '-report.md').toString('utf8')
  const previousSeal = json(previous + '-seal.json')
  const previousAudit = json(previous + '-audit.json')
  read(previous + '-reader.mjs')
  for (const [file, expected] of Object.entries(previousSeal.ownedFingerprints)) {
    check(`原独立签字 byte/SHA: ${path.basename(file)}`, () => {
      assert.ok(inputs[file])
      assert.equal(inputs[file].bytes, expected.bytes)
      assert.equal(inputs[file].sha256, expected.sha256)
    })
  }
  check('原报告限定 PASS 与40视觉 BLOCKED分离', () => {
    assert.ok(previousReport.includes('限定 PASS'))
    assert.equal(previousSeal.remaining.length, 1)
    assert.equal(previousSeal.remaining[0].status, 'BLOCKED')
    assert.ok(previousSeal.remaining[0].assertion.includes('40%'))
    assert.deepEqual(previousSeal.drift, [])
    assert.equal(previousSeal.counts.source, 114)
  })
  const parentIndex = json(`${parent}/index-r1.json`)
  check('原127索引指纹未覆盖', () => {
    assert.equal(Object.keys(parentIndex).length, 127)
    assert.equal(inputs[`${parent}/index-r1.json`].bytes, 20048)
    assert.equal(inputs[`${parent}/index-r1.json`].sha256,
      '478e107080540bb25a32f250f5662c61399d0c9c166d858cd167becacf897ac2')
  })
  const parentRows = Object.entries(parentIndex).map(([n, e]) => indexedFile(parent, n, e))
  const index = json(`${supplement}/index-r1.json`)
  check('补证索引exact12，目录无漏项', () => {
    assert.deepEqual(Object.keys(index).sort(), expectedSupplement)
    assert.deepEqual(fs.readdirSync(supplement).sort(), [...expectedSupplement, 'index-r1.json'].sort())
  })
  const supplementRows = Object.entries(index).map(([n, e]) => indexedFile(supplement, n, e))
  const before = json(`${parent}/03-browse-before-mtime.json`)
  const after = json(`${supplement}/after-mtime-r2.json`)
  check('原03before与补证11文件全部字段exact', () => {
    assert.equal(Object.keys(before).length, 11)
    assert.deepEqual(after, before)
    assert.deepEqual(before, previousAudit.businessBefore)
    assert.deepEqual(before, previousAudit.businessAfter)
    assert.equal(inputs[`${supplement}/after-mtime-r2.json`].sha256,
      '7ea828ba63fca9a80002fef8bd9fe8c8f6ad73e90f6fea4b8c33e05c4972e8f4')
  })
  const host = json(`${parent}/host-start.json`)
  const binding = json(`${parent}/source-binding.json`)
  const fixtureBinding = json(`${parent}/fixture-binding.json`)
  const fixture = json(`${parent}/legacy-f2.json`)
  const helper = read(`${parent}/helper-source.mjs`).toString('utf8')
  check('source/runtime只沿原签字归档继承', () => {
    assert.deepEqual(host, previousAudit.candidate.host)
    assert.equal(binding.source.count, 114)
    assert.equal(Object.keys(binding.source.source).length, 114)
    assert.equal(binding.sourceCount, 3)
    assert.equal(binding.completeCount, 521)
    assert.equal(binding.baseline, '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd')
    assert.equal(host.pid, 16671)
    assert.equal(host.port, 3265)
    assert.equal(binding.pid, host.pid)
    assert.equal(binding.port, host.port)
    assert.equal(binding.runtime, '/private/tmp/pmtool-op-legacy-runtime-20261022-r1')
    assert.equal(binding.profileTarget, host.bundle)
    assert.equal(fixtureBinding.runtime, binding.runtime)
    assert.equal(fixtureBinding.port, host.port)
    assert.ok(helper.includes(`export const runtime = '${binding.runtime}'`))
    assert.equal(inputs[`${parent}/source-binding.json`].sha256,
      previousAudit.candidate.sourceBindingSha256)
    assert.equal(inputs[`${parent}/legacy-f2.json`].sha256, fixtureBinding.sha256)
    assert.equal(fixtureBinding.sha256, 'abb086772fde51f0e96dff4d5a7e9d444b887e1acdca0180cce11631ba1473ee')
  })
  const businessRows = []
  for (const [rel, expected] of Object.entries(before)) {
    const file = `${parent}/03-legacy-restored-raw/${rel}`
    const record = json(file)
    check(`原落盘副本与原03before byte/SHA: ${rel}`, () => {
      assert.equal(inputs[file].bytes, expected.bytes)
      assert.equal(inputs[file].sha256, expected.sha256)
      assert.equal(record.version, 2)
      assert.ok(record.record)
    })
    businessRows.push({ rel, archivedRecord: record.record, before: expected, after: after[rel] })
  }
  for (const [id, title, progress] of [
    ['t-0003', 'F2-L1', 40], ['t-0005', 'F2-L3', 40], ['t-0008', 'F2-L6', 80],
  ]) {
    const row = businessRows.find(r => r.rel === `data/pmtool/tasks/${id}.json`)
    check(`旧旁注原字段身份: ${id}/${title}/${progress}`, () => {
      assert.equal(row.archivedRecord.id, id)
      assert.equal(row.archivedRecord.title, title)
      assert.equal(row.archivedRecord.progress, progress)
      assert.ok(!Object.hasOwn(row.archivedRecord, 'checklist'))
    })
  }
  const visible = json(`${supplement}/40-visible-r2.json`)
  const png = read(`${supplement}/40-visible-r2.png`)
  check('PNG真实尺寸与DOM视口一致，不代替目视', () => {
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.equal(png.readUInt32BE(16), 1440)
    assert.equal(png.readUInt32BE(20), 900)
    assert.equal(visible.origin, `http://127.0.0.1:${host.port}`)
    assert.deepEqual(visible.viewport, { innerWidth: 1440, innerHeight: 900, dpr: 1 })
    assert.ok(visible.row.includes('F2-L1'))
    assert.ok(visible.row.includes('原手填 40%'))
    assert.ok(visible.row.includes('客观 证据不足'))
    assert.ok(visible.row.includes('覆盖 0/1'))
    for (const text of ['F2-L1', '原手填 40%', '客观 证据不足', '覆盖 0/1']) {
      const leaf = visible.leaves.find(n => n.text === text)
      assert.ok(leaf)
      assert.ok(leaf.bbox.width > 0 && leaf.bbox.height > 0)
      assert.ok(leaf.bbox.left >= 0 && leaf.bbox.right <= 1440)
      assert.ok(leaf.bbox.top >= 0 && leaf.bbox.bottom <= 900)
    }
  })
  const scripts = Object.fromEntries(expectedSupplement.filter(n => n.endsWith('.mjs'))
    .map(n => [n, read(`${supplement}/${n}`).toString('utf8')]))
  check('只读审查focus+Tab，无click/fill/保存动作', () => {
    const first = scripts['pmtool-legacy-40-round01.mjs']
    const third = scripts['pmtool-legacy-40-round03.mjs']
    assert.ok(first.includes(`await page.focus('button[aria-label="编辑 F2-L1"]')`))
    assert.ok(first.includes(`await page.keyboard.press('Tab')`))
    assert.ok(first.includes("closest('tr')"))
    assert.ok(third.includes("closest('.pm-task-row')"))
    for (const n of ['pmtool-legacy-40-round01.mjs', 'pmtool-legacy-40-round02.mjs', 'pmtool-legacy-40-round03.mjs']) {
      assert.ok(!/page\.(?:click|fill)\s*\(/.test(scripts[n]))
      assert.ok(!scripts[n].includes('commands/execute'))
    }
  })
  const receipts = []
  for (const [name, id, exitCode, pid] of [
    ['failed', 'de773c380cdf1333e43401c4e0e63525', 1, 18924],
    ['captured', 'd1f3248add09faa4d12615be2f9e283d', 0, 19293],
  ]) {
    const archivedExecution = read(`${supplement}/${name}-execution.json`)
    const archivedOutput = read(`${supplement}/${name}-output.log`)
    const privateExecution = read(`${receiptRoot}/${id}/execution.json`)
    const privateOutput = read(`${receiptRoot}/${id}/output.log`)
    const execution = JSON.parse(archivedExecution.toString('utf8'))
    const output = archivedOutput.toString('utf8')
    check(`真实执行收据exact: ${name}/${id}`, () => {
      assert.ok(archivedExecution.equals(privateExecution))
      assert.ok(archivedOutput.equals(privateOutput))
      assert.equal(execution.executionId, id)
      assert.equal(execution.pid, pid)
      assert.equal(execution.status, 'exited')
      assert.equal(execution.exitCode, exitCode)
      assert.equal(execution.outputComplete, true)
      assert.equal(execution.cwd, root)
      assert.ok(execution.finishedAtMs >= execution.startedAtMs)
      if (name === 'failed') {
        assert.ok(output.includes("Cannot read properties of null (reading 'getBoundingClientRect')"))
      } else {
        assert.ok(output.includes('F2-L1') && output.includes('原手填 40%'))
        assert.ok(output.includes(`y: ${visible.bbox.y}`))
      }
    })
    receipts.push({ name, execution, output, privateExecution: `${receiptRoot}/${id}/execution.json`,
      privateOutput: `${receiptRoot}/${id}/output.log`,
      startedAt: new Date(execution.startedAtMs).toISOString(),
      finishedAt: new Date(execution.finishedAtMs).toISOString(),
      limit: 'metadata未含完整stdin；收据是执行事实，不等GUI PASS' })
  }
  const observations = json(`${supplement}/observations.json`)
  check('Main没有自判GUI PASS', () => assert.equal(observations.verdict, 'NOT_A_GUI_PASS'))
  for (const [file, current] of Object.entries(inputs)) {
    if (!previousAudit.inputs[file]) continue
    check(`继承原件内容身份: ${path.basename(file)}`, () => {
      assert.equal(current.bytes, previousAudit.inputs[file].bytes)
      assert.equal(current.sha256, previousAudit.inputs[file].sha256)
    })
  }
  const audit = {
    kind: '独立替补审证；只有本旧包40旁注视觉补签，不是产品执行',
    at: new Date().toISOString(),
    environment: { platform: process.platform, node: process.version, cwd: process.cwd() },
    reviewer: { role: 'trae替补独立审证', GUIExecutor: false, developer: false,
      replacedTask: 'op_legacy40_supplement_review/arun_6ada32077cfef4f845ad48a5',
      replacedTaskState: '用户告知killed；只核旧前缀无文件，不重跑或探任务活性' },
    parentIndex: inputs[`${parent}/index-r1.json`],
    supplementIndex: inputs[`${supplement}/index-r1.json`],
    parentRows, supplementRows, inputs, checks,
    counts: { inheritedArchiveChecked: parentRows.length, supplement: supplementRows.length,
      business: businessRows.length, receipts: receipts.length, checks: checks.length, failed: 0 },
    inheritance: {
      previousReport: previous + '-report.md', previousSeal: previous + '-seal.json',
      originalRemaining: previousSeal.remaining, host, source: binding,
      sourceFiles: 114, completeInputs: 521, fixtureBinding,
      policy: '原127原件与原签字内容未变，补证仅视口/focus/Tab/只读row/PNG；继承原restore/browse限定PASS，不重哈希冻结源码、不读runtime或探活',
    },
    businessRows, originalBefore: before, supplementAfter: after,
    visible, receipts, observations,
    scriptReview: { importedOrExecuted: false, focusAndTabNotClick: true,
      originalFailurePreserved: true, failedTRNotProductFailure: true,
      successfulSelector: '.pm-task-row', writesObservedBySnapshot: 0,
      limit: '归档11业务文件exact，不宣称全机或全部runtime零写；没有新增RPC事件全量日志' },
    visualReview: {
      method: '替补审证者实际functions.view_image，detail=original；不是自动bbox裁决',
      image: `${supplement}/40-visible-r2.png`, imageFingerprint: inputs[`${supplement}/40-visible-r2.png`],
      dimensions: '1440x900', theme: '深色',
      observed: [
        'L1位于y约422-479，L3位于y约627-683，两者原手填40%与客观证据不足/覆盖0/1逐行分离可读',
        'L6位于y约798-854，原手填80%与证据不足并列；无客观40%或80%完成度签字',
        '任务列表真实界面，无编辑保存弹窗；顶部内容及最底L7部分出框，不签整页矩阵',
      ],
      DOMLimit: '40-visible-r2.json只覆盖L1；L3/L6可见由实际PNG目视证实',
      reviewExecution: '只目视归档，不是第二次GUI采证',
    },
    result: { status: '限定 PASS', assertion: '本旧包列表F2-L1/L3原手填40%实际可见且与客观证据不足分离',
      inheritedRestoreBrowse: '沿原限定PASS', remainingInThisSupplement: [] },
    exclusions: ['客观40%', '旧OP112R2', 'native', 'P0–P3', 'B8', '父ordinarycommit', '发布准入'],
    executionNotes: [
      '首次exec的login=false不受支持，未执行；移除参数后只读成功',
      '声明的memory绝对路径不存在；未使用私有记忆作依据',
      'research-guide仅用于原件优先/交叉核对，不为满足通用来源数量扩本单或生成GUI',
    ],
    writable: Object.values(outputs), released: false,
  }
  writeOwned('audit.json', audit)
  console.log(JSON.stringify({ kind: audit.kind, ...audit.counts, inputCount: Object.keys(inputs).length }))
}
function seal() {
  const audit = JSON.parse(fs.readFileSync(outputs['audit.json'], 'utf8'))
  const drift = []
  for (const [file, expected] of Object.entries(audit.inputs)) {
    try {
      const current = fingerprint(file)
      if (JSON.stringify(current) !== JSON.stringify(expected)) drift.push({ file, expected, current })
    } catch (error) { drift.push({ file, error: String(error) }) }
  }
  const currentSet = fs.readdirSync(supplement).sort()
  if (JSON.stringify(currentSet) !== JSON.stringify([...expectedSupplement, 'index-r1.json'].sort())) {
    drift.push({ file: supplement, reason: '补证目录集合变化', currentSet })
  }
  const owned = ['reader.mjs', 'audit.json', 'report.md']
  const badWhitespace = []
  const brokenLinks = []
  const ownedFingerprints = {}
  for (const key of owned) {
    const file = outputs[key]
    ownedFingerprints[file] = fingerprint(file)
    const text = fs.readFileSync(file, 'utf8')
    text.split('\n').forEach((line, i) => {
      if (/\s+$/.test(line)) badWhitespace.push({ file, line: i + 1 })
    })
    if (key !== 'report.md') continue
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0]
      if (!target || /^https?:/.test(target)) continue
      const resolved = path.resolve(path.dirname(file), target)
      if (resolved === outputs['seal.json']) continue
      if (!fs.existsSync(resolved)) brokenLinks.push({ target, resolved })
    }
  }
  const ownedSet = fs.readdirSync(testing).filter(n => n.startsWith(prefix)).sort()
  assert.deepEqual(ownedSet, owned.map(k => path.basename(outputs[k])).sort())
  assert.deepEqual(drift, [], '输入漂移')
  assert.deepEqual(badWhitespace, [], '尾空白')
  assert.deepEqual(brokenLinks, [], '坏链接')
  const sealResult = {
    kind: '本旧包40旁注补审封存；不是产品测试/发布签字',
    at: new Date().toISOString(),
    environment: { platform: process.platform, node: process.version, cwd: process.cwd() },
    readerCaptureExit: 0, readerSealChecksPassed: true,
    inputCount: Object.keys(audit.inputs).length,
    counts: audit.counts, drift, badWhitespace, brokenLinks, ownedFingerprints,
    supplementIndex: audit.supplementIndex, original127Index: audit.parentIndex,
    result: audit.result, inherited: '原restore/browse限定PASS，source/runtime归档继承',
    scope: { productExecuted: false, MainScriptExecuted: false, GitUsed: false,
      browserUsed: false, viewImageUsed: true, serviceProbed: false,
      runtimeBusinessRead: false, installBuildTestsRun: false,
      writable: Object.values(outputs), otherTestingOrLivingdocsWritten: false },
    remaining: [], outsideScope: audit.exclusions,
    parentStatus: '不裁父门；Main继续P0；native EGO错误窗口BLOCKED沿父报告待证',
    released: true, stop: true, serviceStopped: false,
    selfHashPolicy: 'seal不自哈希；read/capture/seal仅为自有审证检查，不等产品回归',
  }
  writeOwned('seal.json', sealResult)
  console.log(JSON.stringify({ inputCount: sealResult.inputCount, drift: 0,
    badWhitespace: 0, brokenLinks: 0, result: audit.result.status, released: true, stop: true }))
}
assert.equal(process.cwd(), root, 'Run from repository root')
if (process.argv[2] === 'capture') capture()
else if (process.argv[2] === 'seal') seal()
else throw new Error('Usage: node <owned-reader.mjs> capture|seal')

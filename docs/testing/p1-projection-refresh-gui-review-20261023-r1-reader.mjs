import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '../..')
const prefix = 'p1-projection-refresh-gui-review-20261023-r1'
const evidence = 'reports/all-pending-evidence-20261021/P1ProjectionRefreshR1'
const successor = 'reports/all-pending-evidence-20261021/Successor114GuiR1'
const combined = 'reports/all-pending-evidence-20261021/CombinedSuccessor114R1'
const mode = process.argv[2]
assert.ok(['audit', 'seal'].includes(mode))
const inputs = {}
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
function read(relative) {
  const absolute = path.resolve(repo, relative)
  assert.ok(absolute.startsWith(repo + path.sep))
  assert.equal(fs.lstatSync(absolute).isSymbolicLink(), false)
  const bytes = fs.readFileSync(absolute)
  inputs[relative] = { bytes: bytes.length, sha256: sha(bytes) }
  return bytes
}
const json = relative => JSON.parse(read(relative).toString('utf8'))
const item = relative => json(`${evidence}/${relative}`)
const index = item('index-r1.json')
assert.equal(Object.keys(index).length, 379)
for (const [relative, expected] of Object.entries(index)) {
  read(`${evidence}/${relative}`)
  assert.deepEqual(inputs[`${evidence}/${relative}`], expected)
}
const documents = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/plans/2026-10-23-p0-p1-sealed-review-dispatch.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/op-growth-final-inheritance-20261022-r1.md',
  'docs/testing/gui-b8-expanded-checklist-20261020.md',
  'docs/testing/b1-b8-coverage-mapping-20261020.md',
  'docs/testing/remaining-layer-map-20261021.md',
  'docs/testing/b8-existing-evidence-mapping-20261022-r1.md',
]
for (const relative of documents) read(relative)
const sourceClose = item('source-binding-close.json')
const source = json(`${combined}/source-files.json`)
const candidate = json(`${combined}/candidate.json`)
const complete = json(`${combined}/complete-inputs.json`)
const artifacts = json(`${combined}/built-artifacts.json`)
const host = json(`${successor}/host-start.json`)
const gateway = json(`${successor}/gateway-binding.json`)
const setup = json(`${successor}/setup-provenance.json`)
// Check sealed metadata against its original index, never dereference private paths.
for (const [root, names] of [
  [combined, ['source-files.json', 'candidate.json', 'complete-inputs.json', 'built-artifacts.json']],
  [successor, ['host-start.json', 'gateway-binding.json', 'setup-provenance.json']],
]) {
  const parentIndex = json(`${root}/index-r1.json`)
  for (const name of names) assert.deepEqual(inputs[`${root}/${name}`], parentIndex.files[name])
}
assert.deepEqual(sourceClose.source, source)
assert.equal(source.count, 114)
assert.equal(Object.keys(source.source).length, 114)
assert.equal(Object.keys(complete).length, 521)
assert.equal(sourceClose.completeInputCount, 521)
assert.equal(candidate.sourceCount, 114)
assert.equal(candidate.completeInputCount, 521)
assert.equal(candidate.baseline, source.baseline)
assert.equal(candidate.freeze, sourceClose.freeze)
assert.equal(host.candidateSha256, inputs[`${combined}/candidate.json`].sha256)
assert.equal(host.sourceSha256, inputs[`${combined}/source-files.json`].sha256)
assert.equal(host.bundleSha256, artifacts['client.js'].sha256)
assert.equal(setup.sourceCount, 114)
const binding = item('binding.json')
assert.equal(binding.port, host.port)
assert.equal(binding.pid, host.pid)
assert.equal(binding.freeze, candidate.freeze)
assert.equal(host.port, 3264)
assert.equal(host.pid, 10975)
assert.equal(gateway.port, 3261)
assert.equal(gateway.pid, 60386)
assert.equal(gateway.realExternalModel, false)

const states = [
  'old-projection-visible', 'normal-task-edit', 'normal-edited-before-save',
  'old-answer-after-human-update', 'projection-refreshed', 'projection-target-open',
  'target-fields-visible', 'cancel-target-current', 'target-uncovered-fields',
  'return-old-answer-card',
]
const taskPath = 'data/pmtool/tasks/t-0006.json'
const roots = {}
const dom = {}
for (const name of states) {
  roots[name] = item(`${name}-roots.json`)
  const dbPaths = Object.keys(roots[name]).filter(k => k.startsWith('data/pmtool/'))
  assert.equal(dbPaths.length, 26)
  assert.equal(Object.keys(roots[name]).length, 32)
  for (const relative of dbPaths) {
    read(`${evidence}/${name}-raw/${relative}`)
    assert.deepEqual(inputs[`${evidence}/${name}-raw/${relative}`], roots[name][relative])
  }
  const state = item(`${name}.json`)
  assert.equal(state.origin, 'http://127.0.0.1:3264')
  assert.equal(state.timeOrigin, 1792701362376)
  assert.equal(state.dark, true)
  assert.equal(state.viewport.innerWidth, 1440)
  assert.equal(state.viewport.innerHeight, 718)
  dom[name] = {
    at: state.at, viewport: state.viewport, focus: state.focus,
    dialogs: state.dialogs.map(d => ({ label: d.label, bbox: d.bbox })),
    taskFields: state.fields.filter(f => ['title', 'assignee', 'progress'].includes(f.name)),
  }
}
const differences = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const initialRoots = roots['old-projection-visible']
for (const name of ['normal-task-edit', 'normal-edited-before-save'])
  assert.deepEqual(differences(initialRoots, roots[name]), [])
for (const name of states.slice(3))
  assert.deepEqual(differences(initialRoots, roots[name]), [taskPath])
for (const name of states.slice(4))
  assert.deepEqual(differences(roots['old-answer-after-human-update'], roots[name]), [])
const oldStored = item(`old-projection-visible-raw/${taskPath}`)
const newStored = item(`return-old-answer-card-raw/${taskPath}`)
assert.equal(oldStored.version, 2)
assert.equal(newStored.version, 2)
const oldTask = oldStored.record
const newTask = newStored.record
assert.equal(oldTask.id, 't-0006')
assert.equal(oldTask.projectId, 'p-0001')
assert.equal(oldTask.assignee, '')
assert.equal(oldTask.progress, 0)
assert.equal(newTask.assignee, 'P1004刷新负责人')
assert.equal(newTask.progress, 47)
const changedFields = differences(oldTask, newTask)
assert.deepEqual(changedFields.sort(), ['assignee', 'manualProgress', 'progress', 'updatedAt'])
assert.equal(Object.hasOwn(oldTask, 'manualProgress'), false)
assert.equal(newTask.manualProgress, null)

const eventNames = [
  'old-projection-events.json', 'normal-save-refresh-events.json',
  'target-return-events.json', 'target-visible-return-events.json',
]
const requests = []
const responses = new Map()
const frames = []
for (const name of eventNames) {
  const events = item(name)
  for (const row of events.rows) {
    if (row.type === 'request') requests.push({
      eventFile: name, at: row.at, rpcId: row.body.rpcId,
      method: row.body.method, line: row.body.payload.args.line,
    })
    if (row.type === 'response') {
      assert.equal(row.status, 200)
      assert.equal(row.body.result.ok, true)
      responses.set(row.body.rpcId, { eventFile: name, at: row.at, body: row.body })
    }
  }
  for (const frame of events.frames) {
    assert.equal(index[frame.file].sha256, frame.sha256)
    frames.push({ eventFile: name, at: frame.at, file: frame.file, sha256: frame.sha256 })
  }
}
for (const request of requests) assert.ok(responses.has(request.rpcId))
const asks = requests.filter(r => r.line.startsWith('/pm ask '))
const writes = requests.filter(r => r.line.startsWith('/pm task update '))
assert.equal(asks.length, 1)
assert.equal(writes.length, 1)
assert.ok(requests.every(r => [
  '/pm model status', '/pm ask-provenance p-0001', '/pm web snapshot',
].includes(r.line) || r === asks[0] || r === writes[0]))
const oldAnswer = item('old-ask-response.json')
const saved = item('normal-save-response.json')
const refreshed = item('projection-refresh-response.json')
assert.equal(oldAnswer.body.rpcId, asks[0].rpcId)
assert.equal(saved.body.rpcId, writes[0].rpcId)
assert.equal(requests.find(r => r.rpcId === refreshed.body.rpcId).line, '/pm web snapshot')
const snapshot = JSON.parse(refreshed.body.result.value.result.text)
assert.deepEqual(snapshot.tasks.find(t => t.id === 't-0006'), newTask)
const modelRequest = item('gateway-real-request.json')
assert.equal(modelRequest.path, '/v1/messages')
assert.equal(modelRequest.sequence, 19)
assert.deepEqual(modelRequest.fixture, item('gateway-old-projection.json'))
assert.equal(modelRequest.fixture.text, oldAnswer.body.result.value.result.text)
const oldText = oldAnswer.body.result.value.result.text
for (const name of [
  'old-projection-visible', 'old-answer-after-human-update', 'projection-refreshed',
  'projection-target-open', 'cancel-target-current', 'return-old-answer-card',
]) assert.ok(item(`${name}.json`).text.includes(oldText))
const oldDom = item('old-projection-visible.json')
const refreshDom = item('projection-refreshed.json')
assert.ok(oldDom.text.includes('数据截至 04:38:45'))
assert.ok(refreshDom.text.includes('数据截至 04:39:08'))
assert.ok(refreshDom.text.includes('回答后该任务又有更新，已按最新状态显示'))
assert.ok(refreshDom.text.includes('负责人：P1004刷新负责人'))
assert.ok(refreshDom.text.includes('进度：47%'))
assert.equal(dom['projection-target-open'].focus.name, 'title')
assert.equal(dom['return-old-answer-card'].dialogs.length, 0)

const audit = {
  at: new Date().toISOString(), environment: { platform: process.platform, node: process.version },
  mode, inputCount: Object.keys(inputs).length, inputs,
  integrity: { indexedFiles: 379, mismatches: [], indexedBytes: Object.values(index).reduce((n, v) => n + v.bytes, 0) },
  binding: {
    baseline: candidate.baseline, sourceDeclarations: 114, completeInputDeclarations: 521,
    sourceDeclarationMatch: true, host: { port: host.port, pid: host.pid },
    gateway: { port: gateway.port, pid: gateway.pid, realExternalModel: false },
    privatePathsDereferenced: false, liveSourceCompared: false,
    scope: '仅核封存元数据及部署继承，不重验521份运行字节或当前服务',
  },
  roots: {
    states: states.length, declaredPathsPerState: 32, rawDatabaseFilesPerState: 26,
    rawDatabaseFilesChecked: 260, draftChangedPaths: [], humanSaveChangedPaths: [taskPath],
    taskChangedFields: changedFields, refreshOpenReturnChangedPaths: [],
    initialTask: oldTask, latestTask: newTask,
    scope: '26份DB有原始字节；其余6份files/backups仅核roots声明不变，不声称原始字节或全盘保护',
  },
  rpc: { requests, responsesPaired: responses.size, askCount: asks.length, taskUpdateCount: writes.length,
    gatewayRequestSequence: modelRequest.sequence, snapshotMatchesRawTask: true,
    scope: '单模型请求限四份封存事件与一份gateway请求；不是完整外部模型或全局请求计数',
  },
  dom, frames, oldAnswerRetained: true, refreshTimeAndWarning: true,
  timeout: {
    executorObservation: item('executor-observations.json').overlayObservation,
    rawExceptionOrPointerTracePresent: false,
    scope: 'timeout只在原观察文字记载；截图/帧独立证明持续遮层，不能证明异常栈/精确指针坐标或等待时长',
  },
  verdictAuthority: '数据核验不是GUI裁决；独立目视和有限裁决见同前缀报告',
}
if (mode === 'seal') {
  const previous = JSON.parse(fs.readFileSync(path.join(here, `${prefix}-audit.json`)))
  assert.deepEqual(inputs, previous.inputs)
  const report = fs.readFileSync(path.join(here, `${prefix}.md`), 'utf8')
  const links = [...report.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1])
  for (const link of links) {
    if (/^[a-z]+:/i.test(link) || link.startsWith('#')) continue
    if (link === `${prefix}-seal.json`) continue
    assert.ok(fs.existsSync(path.resolve(here, link.split('#')[0])), link)
  }
  assert.ok(!report.split('\n').some(line => /[ \t]+$/.test(line)))
  audit.protection = { comparedTo: `${prefix}-audit.json`, drift: [], checkedInputs: Object.keys(inputs).length }
  audit.reportCheck = { links: links.length, missingLinks: [], trailingWhitespace: false }
}
const output = path.join(here, `${prefix}-${mode === 'audit' ? 'audit' : 'seal'}.json`)
fs.writeFileSync(output, JSON.stringify(audit, null, 2) + '\n', { flag: 'wx' })
assert.ok(fs.existsSync(output))
console.log(JSON.stringify({
  mode, output: path.relative(repo, output), inputCount: audit.inputCount,
  indexedFiles: 379, rawDatabaseFilesChecked: 260, requests: requests.length,
  askCount: asks.length, taskUpdateCount: writes.length, frames: frames.length,
  inputDrift: mode === 'seal' ? [] : '待seal',
}))

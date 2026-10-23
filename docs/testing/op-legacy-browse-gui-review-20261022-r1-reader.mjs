import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

// This reader consumes archived bytes only; it never imports or runs product code.
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = path.join(repo, 'docs/testing/op-legacy-browse-gui-review-20261022-r1')
const evidence = path.join(repo, 'reports/all-pending-evidence-20261021/OpLegacyBrowseR1')
const candidateRoot = path.join(repo, 'reports/all-pending-evidence-20261021/CombinedSuccessor114R1')
const freeze = '/private/tmp/pmtool-combined-successor114-20261022-r1'
const privateReceipts = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
const originalF2 = path.join(repo, 'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json')
const removedRootKeys = ['extra', 'fileBundleId']
const removedTaskKeys = ['checklist', 'manualProgress', 'manualProgressNote', 'effortHours', 'evidenceUrl', 'attachments', 'progressLog']
const stages = ['03-legacy-restored', '03-legacy-task-list', '04-legacy-project-browse', '04-legacy-task-browse', '04-legacy-list-reentry']
const eventStages = ['02-legacy-precheck', '02-legacy-first-confirm', '03-legacy-restored', '04-browse-only']
const pngStages = ['02-legacy-precheck', '02-legacy-first-confirm', ...stages]
const inputs = {}
const checks = []
const digest = b => crypto.createHash('sha256').update(b).digest('hex')
const sorted = value => {
  if (Array.isArray(value)) return value.map(sorted)
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, sorted(value[k])]))
  return value
}
const same = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b))
function fingerprint(file) {
  const a = fs.lstatSync(file, { bigint: true })
  assert(a.isFile(), 'Expected regular file: ' + file)
  const b = fs.readFileSync(file)
  const z = fs.lstatSync(file, { bigint: true })
  assert.equal(a.size, z.size)
  assert.equal(a.mtimeNs, z.mtimeNs)
  assert.equal(a.ctimeNs, z.ctimeNs)
  assert.equal(a.ino, z.ino)
  return { bytes: b.length, sha256: digest(b), mtimeNs: String(z.mtimeNs), ctimeNs: String(z.ctimeNs), ino: String(z.ino) }
}
function bytes(file) {
  const first = fingerprint(file)
  if (inputs[file]) assert.deepEqual(first, inputs[file], 'Input drift during reader: ' + file)
  inputs[file] = first
  const b = fs.readFileSync(file)
  assert.equal(digest(b), first.sha256)
  return b
}
const json = file => JSON.parse(bytes(file).toString('utf8'))
const ev = rel => path.join(evidence, rel)
function check(name, actual, expected = true) {
  const ok = same(actual, expected)
  checks.push({ name, ok, actual, expected })
  assert(ok, name)
}
function enumerate(dir) {
  const files = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, e.name)
    if (e.isDirectory()) files.push(...enumerate(file))
    else { assert(e.isFile()); files.push(file) }
  }
  return files.sort()
}
function archiveIndex(index, root) {
  const rows = []
  for (const [rel, expected] of Object.entries(index)) {
    assert(!path.isAbsolute(rel) && !rel.split('/').includes('..'))
    const file = path.join(root, rel)
    bytes(file)
    const actual = inputs[file]
    check('index:' + rel, { bytes: actual.bytes, sha256: actual.sha256 }, expected)
    rows.push({ rel, ...actual })
  }
  return rows
}
function rpc(stage) {
  const events = json(ev(stage + '-events.json'))
  const requests = events.filter(e => e.method === 'Network.requestWillBeSent')
  const responses = events.filter(e => e.method === 'Network.responseReceived')
  check('runtime exceptions:' + stage, events.filter(e => e.method === 'Runtime.exceptionThrown').length, 0)
  const rows = requests.map(request => {
    check('request path:' + request.requestId, request.path, '/api/commands/execute')
    const matches = responses.filter(r => r.requestId === request.requestId)
    check('unique response:' + request.requestId, matches.length, 1)
    const response = matches[0]
    check('RPC encoding:' + request.requestId, response.body.base64Encoded, false)
    const body = JSON.parse(response.body.body)
    check('RPC id:' + request.requestId, body.rpcId, request.body.rpcId)
    check('RPC outer success:' + request.requestId, body.result.ok)
    const result = body.result.value.result
    check('RPC command success:' + request.requestId, result.kind, 'success')
    return { stage, requestId: request.requestId, rpcId: body.rpcId,
      requestAt: request.at, responseAt: response.at, httpStatus: response.status,
      agentId: request.body.payload.args.agentId, line: request.body.payload.args.line,
      commandId: body.result.value.commandId, result }
  })
  check('no unmatched response:' + stage, responses.length, rows.length)
  for (const frame of events.filter(e => e.method === 'Page.screencastFrame')) {
    check('frame digest:' + frame.file, digest(bytes(ev(frame.file))), frame.sha256)
  }
  return rows
}
function capture() {
  const index = json(ev('index-r1.json'))
  check('sealed entry count', Object.keys(index).length, 127)
  check('evidence tree matches index',
    enumerate(evidence).map(f => path.relative(evidence, f)).filter(f => f !== 'index-r1.json'),
    Object.keys(index).sort())
  const archived = archiveIndex(index, evidence)
  for (const doc of ['AGENTS.md', 'docs/collaboration.md',
    'docs/testing/remaining-objective-cases-20261021.md',
    'docs/testing/op-growth-final-inheritance-20261022-r1.md']) bytes(path.join(repo, doc))

  const sourceBinding = json(ev('source-binding.json'))
  const source = json(path.join(candidateRoot, 'source-files.json'))
  const candidate = json(path.join(candidateRoot, 'candidate.json'))
  const complete = json(path.join(candidateRoot, 'complete-inputs.json'))
  const host = json(ev('host-start.json'))
  const ready = json(ev('host-ready.json'))
  check('unmodified structured source declaration', sourceBinding.source, source)
  check('source declared count', source.count, 114)
  check('source nested map count', Object.keys(source.source).length, 114)
  check('source outer field count is not file count', Object.keys(source).length, 3)
  check('Main outer count literal', sourceBinding.sourceCount, 3)
  check('complete manifest count', Object.keys(complete).length, 521)
  check('candidate count', [candidate.sourceCount, candidate.completeInputCount], [114, 521])
  check('candidate baseline', candidate.baseline, sourceBinding.baseline)
  check('nested baseline', source.baseline, candidate.baseline)
  check('source declaration digest', inputs[path.join(candidateRoot, 'source-files.json')].sha256, host.sourceSha256)
  check('candidate declaration digest', inputs[path.join(candidateRoot, 'candidate.json')].sha256, host.candidateSha256)
  const sourceRows = []
  for (const [rel, sha256] of Object.entries(source.source)) {
    const file = path.join(freeze, rel)
    bytes(file)
    check('frozen source:' + rel, inputs[file].sha256, sha256)
    sourceRows.push({ rel, ...inputs[file] })
  }
  const completeRows = archiveIndex(complete, path.join(freeze, 'packages/dsh-pm-tool'))
  const bundleFile = path.join(freeze, 'packages/dsh-pm-tool/lib/client.js')
  check('frozen client bundle digest', digest(bytes(bundleFile)), host.bundleSha256)
  check('runtime metadata pid/port', [host.pid, host.port, ready.pid, ready.port, sourceBinding.pid, sourceBinding.port],
    [16671, 3265, 16671, 3265, 16671, 3265])
  check('profile target declaration', sourceBinding.profileTarget, host.bundle)
  check('bundle path declaration', host.bundle, path.join(freeze, 'packages/dsh-pm-tool'))
  check('isolation flag', host.flags.DSH_PM_E2E, '0')

  const binding = json(ev('fixture-binding.json'))
  check('original fixture path', binding.source, originalF2)
  const originalBytes = bytes(originalF2)
  check('original fixture bytes/hash',
    { bytes: originalBytes.length, sha256: digest(originalBytes) },
    { bytes: binding.sourceBytes, sha256: binding.sourceSha256 })
  check('original fixture size', originalBytes.length, 6961)
  const transformed = JSON.parse(originalBytes)
  for (const k of removedRootKeys) delete transformed[k]
  transformed.tasks = transformed.tasks.map(t => {
    const copy = { ...t }
    for (const k of removedTaskKeys) delete copy[k]
    return copy
  })
  const transformedBytes = Buffer.from(JSON.stringify(transformed, null, 2) + '\n')
  check('fixture exact independent reconstruction', bytes(ev('legacy-f2.json')).equals(transformedBytes))
  check('fixture size', transformedBytes.length, 4502)
  check('fixture hash', digest(transformedBytes), binding.sha256)
  check('fixture root schema', [transformed.format, transformed.formatVersion], ['pm-tool-backup', 1])
  check('fixture shape', [transformed.projects.length, transformed.tasks.length], [1, 10])
  check('fixture declared removals', [binding.removedRootKeys, binding.removedTaskKeys], [removedRootKeys, removedTaskKeys])
  const projectIds = new Set(transformed.projects.map(p => p.id))
  const taskIds = new Set(transformed.tasks.map(t => t.id))
  check('unique task identities', taskIds.size, 10)
  for (const t of transformed.tasks) {
    check('fixture task project:' + t.id, projectIds.has(t.projectId))
    check('fixture task parent:' + t.id, t.parentId === null || taskIds.has(t.parentId))
    check('fixture absent optional keys:' + t.id, removedTaskKeys.some(k => Object.hasOwn(t, k)), false)
  }

  const before = json(ev('03-browse-before-mtime.json'))
  const after = json(ev('04-browse-after-mtime.json'))
  check('business file count', Object.keys(before).length, 11)
  check('business byte/hash/mtime/ctime/inode exact', after, before)
  const rawRows = []
  for (const stage of stages) {
    const roots = json(ev(stage + '-roots.json'))
    const business = Object.keys(roots).filter(k => k.startsWith('data/pmtool/')).sort()
    check('business set:' + stage, business, Object.keys(before).sort())
    for (const rel of business) {
      const b = bytes(ev(stage + '-raw/' + rel))
      check('raw fingerprint:' + stage + '/' + rel,
        { bytes: b.length, sha256: digest(b) }, { bytes: before[rel].bytes, sha256: before[rel].sha256 })
      check('root fingerprint:' + stage + '/' + rel, roots[rel], { bytes: b.length, sha256: digest(b) })
      const wrapper = JSON.parse(b)
      check('storage wrapper version:' + stage + '/' + rel, wrapper.version, 2)
      const record = wrapper.record
      const original = (rel.includes('/tasks/') ? transformed.tasks : transformed.projects).find(r => r.id === record.id)
      check('restored record exact:' + stage + '/' + rel, record, original)
      rawRows.push({ stage, rel, record, ...before[rel] })
    }
  }
  for (const stage of ['02-legacy-precheck', '02-legacy-first-confirm']) {
    const roots = json(ev(stage + '-roots.json'))
    check('before confirmation no business seed:' + stage,
      Object.keys(roots).filter(k => k.startsWith('data/pmtool/')).length, 0)
    check('backup retained:' + stage, roots['backups/legacy-f2.json'].sha256, binding.sha256)
  }
  const rpcRows = eventStages.flatMap(rpc)
  const restoreLine = '/pm restore "/private/tmp/pmtool-op-legacy-runtime-20261022-r1/backups/legacy-f2.json"'
  check('exact recorded request chain', rpcRows.map(r => r.line),
    [restoreLine, restoreLine + ' confirm', '/pm web snapshot', '/pm web snapshot'])
  check('first confirm has no server write', rpcRows.filter(r => r.stage === '02-legacy-first-confirm').length, 0)
  check('precheck is rehearsal', rpcRows[0].result.text.includes('演练，尚未恢复'))
  check('restore succeeded without snapshot for empty initial library',
    rpcRows[1].result.text.includes('已恢复备份。') && rpcRows[1].result.text.includes('当前库为空，未生成安全快照。'))
  const snapshots = rpcRows.filter(r => r.line === '/pm web snapshot').map(r => ({ ...r, snapshot: JSON.parse(r.result.text) }))
  for (const r of snapshots) {
    check('snapshot exact projects:' + r.requestId, r.snapshot.projects, transformed.projects)
    check('snapshot exact tasks:' + r.requestId, r.snapshot.tasks, transformed.tasks)
    check('queue read without open:' + r.requestId, r.snapshot.queue['p-0001'].openedAt, null)
  }
  check('reentry different session', snapshots[0].agentId !== snapshots[1].agentId)
  const uiRows = pngStages.map(stage => {
    const ui = json(ev(stage + '.json'))
    const png = bytes(ev(stage + '.png'))
    check('PNG signature:' + stage, png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    check('same origin:' + stage, ui.origin, 'http://127.0.0.1:3265')
    check('same document timeOrigin:' + stage, ui.timeOrigin, 1792683670304.5)
    return { stage, png: stage + '.png', width: png.readUInt32BE(16), height: png.readUInt32BE(20),
      at: ui.at, viewport: ui.viewport, dark: ui.dark, pilot: ui.pilot, text: ui.text,
      dialogs: ui.dialogs, fields: ui.fields }
  })
  for (const stage of stages.filter(s => s !== '04-legacy-project-browse')) {
    const text = uiRows.find(r => r.stage === stage).text
    check('DOM legacy40 label:' + stage, /F2-L3[\s\S]*原手填 40%/.test(text))
    check('DOM legacy80 label:' + stage, /F2-L6[\s\S]*原手填 80%/.test(text))
    check('DOM insufficient evidence:' + stage, text.includes('客观 证据不足'))
  }
  check('confirmation dialog title', uiRows.find(r => r.stage === '02-legacy-first-confirm').dialogs[0].text.includes('确认整体恢复？'))

  const receipts = json(ev('execution-receipts.json')).map(row => {
    const archivedMeta = json(ev('execution-receipts/' + row.executionId + '/execution.json'))
    const privateMetaFile = path.join(privateReceipts, row.executionId, 'execution.json')
    const privateMeta = json(privateMetaFile)
    check('actual receipt exact:' + row.executionId, privateMeta, archivedMeta)
    check('actual receipt exited/all0:' + row.executionId,
      [privateMeta.status, privateMeta.exitCode, privateMeta.outputComplete, privateMeta.pid],
      ['exited', 0, true, row.pid])
    const outputFile = path.join(privateReceipts, row.executionId, 'output.log')
    const output = bytes(outputFile)
    check('actual output exact:' + row.executionId,
      output.equals(bytes(ev('execution-receipts/' + row.executionId + '/output.log'))))
    return { ...row, metadata: privateMeta, metadataFile: privateMetaFile, outputFile, outputFingerprint: inputs[outputFile] }
  })
  check('five actual Main receipts', receipts.length, 5)
  const sealId = '969ee28667643f6b15073c7a9e35fdce'
  const sealMetaFile = path.join(privateReceipts, sealId, 'execution.json')
  const sealOutputFile = path.join(privateReceipts, sealId, 'output.log')
  const sealMeta = json(sealMetaFile)
  const sealOutput = bytes(sealOutputFile).toString('utf8')
  check('actual seal exited/all0', [sealMeta.status, sealMeta.exitCode, sealMeta.outputComplete, sealMeta.pid], ['exited', 0, true, 17844])
  check('actual seal output', sealOutput.trim(), '{ sealed: 127, businessFileCount: 11, exactBytesMtime: true }')
  const rootsBefore = json(ev('03-legacy-task-list-roots.json'))
  const rootsAfter = json(ev('04-legacy-list-reentry-roots.json'))
  const rootDelta = [...new Set([...Object.keys(rootsBefore), ...Object.keys(rootsAfter)])]
    .filter(k => !same(rootsBefore[k], rootsAfter[k])).map(rel => ({ rel, before: rootsBefore[rel] ?? null, after: rootsAfter[rel] ?? null }))

  return { kind: '独立封存原件 selfreader，不是产品测试或 Main 自判', at: new Date().toISOString(),
    environment: { platform: process.platform, node: process.version, cwd: process.cwd(), runtimeAccess: false },
    sourceCountCorrection: { actualFormat: ['baseline', 'count', 'source'], outerKeys: 3, nestedFileCount: 114,
      unmodified: true, treatment: '纠正计数，不新增产品缺陷或门' },
    candidate: { candidate, host, ready, sourceBindingSha256: inputs[ev('source-binding.json')].sha256 },
    originalFixture: { path: originalF2, fingerprint: inputs[originalF2], binding, reconstructionExact: true,
      originLimit: '现有独立 F2 的显式兼容转换，不称历史 v0.7.4 原始导出或新生成来源' },
    archived, sourceRows, completeRows, businessBefore: before, businessAfter: after, rawRows,
    rpcRows, snapshots, uiRows, receipts,
    mainSealReceipt: { executionId: sealId, metadata: sealMeta, metadataFile: sealMetaFile, outputFile: sealOutputFile,
      output: sealOutput, metadataFingerprint: inputs[sealMetaFile], outputFingerprint: inputs[sealOutputFile],
      limit: '真实 metadata 与同期唯一封存输出；metadata 未提供完整 stdin/命令参数，不声称重放了封存器' },
    nonBusinessRootDelta: rootDelta, checks, inputs,
    visualScope: { pngViewedByReviewer: pngStages.map(s => s + '.png'), legacy80: '概览 PNG 实际可见',
      legacy40: '有 DOM/RPC/rows 保真；本包七 PNG 未入镜，不得由 reader 代签视觉',
      executionByReviewer: false },
    remaining: [{ assertion: '本旧包 F2-L1/L3 原手填40%在列表可见且与客观证据不足分离',
      status: 'BLOCKED', reason: '既有 PNG 未覆盖该行；非产品 FAIL、非 MANUAL_PENDING，不派额外旅程' }],
    excluded: ['OP112R2', 'native', 'P0-P3', 'B8', '父 ordinary commit', '发布', '整个 OP 域'],
  }
}
function save(suffix, value) {
  assert(['-audit.json', '-seal.json'].includes(suffix))
  fs.writeFileSync(prefix + suffix, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
const mode = process.argv[2]
if (mode === 'capture') {
  const result = capture()
  save('-audit.json', result)
  console.log(JSON.stringify({ kind: '审证自检', archived: result.archived.length, source: result.sourceRows.length,
    complete: result.completeRows.length, raw: result.rawRows.length, rpc: result.rpcRows.length,
    checks: result.checks.length, failed: result.checks.filter(r => !r.ok).length,
    receipts: result.receipts.length, mainSealExit: result.mainSealReceipt.metadata.exitCode,
    visualRemaining: result.remaining, inputCount: Object.keys(result.inputs).length }))
} else if (mode === 'seal') {
  const auditFile = prefix + '-audit.json'
  const audit = JSON.parse(fs.readFileSync(auditFile, 'utf8'))
  const drift = Object.entries(audit.inputs).filter(([file, expected]) => !same(fingerprint(file), expected))
    .map(([file, expected]) => ({ file, expected, actual: fingerprint(file) }))
  const owned = [prefix + '-reader.mjs', auditFile, prefix + '-report.md']
  const ownedFingerprints = Object.fromEntries(owned.map(file => [file, fingerprint(file)]))
  const report = fs.readFileSync(prefix + '-report.md', 'utf8')
  const badWhitespace = report.split('\n').map((line, i) => /[ \t]+$/.test(line) ? i + 1 : null).filter(Boolean)
  const brokenLinks = []
  for (const match of report.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^[a-z]+:/i.test(match[1]) || match[1].startsWith('#')) continue
    const target = path.resolve(path.dirname(prefix), match[1].split('#')[0])
    // The sole self-output link becomes valid upon this exclusive write.
    if (target === prefix + '-seal.json') continue
    if (!fs.existsSync(target)) brokenLinks.push(match[1])
  }
  const result = { kind: '独立审证封存，不是产品 PASS', at: new Date().toISOString(),
    environment: { platform: process.platform, node: process.version },
    inputCount: Object.keys(audit.inputs).length, drift, badWhitespace, brokenLinks, ownedFingerprints,
    scope: { writable: '仅本前缀自有四文件', productExecuted: false, MainScriptExecuted: false,
      browserUsed: false, serviceProbed: false, runtimeBusinessRead: false, GitUsed: false },
    counts: { archived: audit.archived.length, source: audit.sourceRows.length, complete: audit.completeRows.length,
      businessFiles: Object.keys(audit.businessBefore).length, rawCopies: audit.rawRows.length,
      receipts: audit.receipts.length, mainSealExit: audit.mainSealReceipt.metadata.exitCode },
    remaining: audit.remaining, released: true, stop: true }
  assert.equal(drift.length, 0, 'Archived input byte/mtime/ctime/inode drift')
  assert.equal(badWhitespace.length, 0)
  assert.equal(brokenLinks.length, 0)
  save('-seal.json', result)
  console.log(JSON.stringify({ inputCount: result.inputCount, drift: 0, badWhitespace: 0, brokenLinks: 0,
    counts: result.counts, released: true, STOP: true }))
} else {
  throw new Error('Use capture or seal; no product/test modes exist')
}

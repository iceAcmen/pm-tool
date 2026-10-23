import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/p1-rest-visible-gui-review-20261023-r2'
const evidence = 'reports/all-pending-evidence-20261021/P1RestVisibleR2'
const oldEvidence = 'reports/all-pending-evidence-20261021/P1HistoryRemainingR1'
const oldPrefix = 'docs/testing/p1-history-remaining-gui-review-20261023-r1'
const expectedIndex = 'ccc98a2c691e9a299fd2106fce43afc34de5aa9bfbdb3a6a21aa8a8d5010e7b5'
const mode = process.argv[2]
assert(['capture', 'seal', 'readback'].includes(mode))
const inputs = {}
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const fingerprint = bytes => ({ bytes: bytes.length, sha256: sha(bytes) })

function regular(rel) {
  assert(!path.isAbsolute(rel))
  const full = path.resolve(repo, rel)
  assert(full.startsWith(repo + '/'))
  let current = repo
  for (const part of path.relative(repo, full).split(path.sep)) {
    current = path.join(current, part)
    assert(!fs.lstatSync(current).isSymbolicLink(), `symlink: ${rel}`)
  }
  assert(fs.lstatSync(full).isFile(), `not ordinary file: ${rel}`)
  return full
}

function read(rel) {
  const bytes = fs.readFileSync(regular(rel))
  inputs[rel] = fingerprint(bytes)
  return bytes
}

const json = rel => JSON.parse(read(rel).toString('utf8'))
function emit(suffix, value) {
  const rel = prefix + suffix
  assert(!suffix.includes('/') && !suffix.includes('..'))
  fs.writeFileSync(path.join(repo, rel), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
  return rel
}

function drift(records) {
  return Object.entries(records).flatMap(([rel, expected]) => {
    const actual = fingerprint(read(rel))
    return actual.bytes === expected.bytes && actual.sha256 === expected.sha256
      ? [] : [{ file: rel, expected, actual }]
  })
}

function capture() {
  const indexBytes = read(evidence + '/index-r1.json')
  assert.equal(sha(indexBytes), expectedIndex)
  const index = JSON.parse(indexBytes)
  const seal = json(evidence + '/seal-r1.json')
  assert.equal(seal.indexSha256, expectedIndex)
  assert.equal(Object.keys(index.files).length, 710)
  assert.equal(seal.members, 710)
  assert.deepEqual(seal.rootChanges, [])
  for (const [rel, expected] of Object.entries(index.files)) {
    assert.deepEqual(fingerprint(read(evidence + '/' + rel)), expected, rel)
  }
  const excluded = ['index-r1.json', 'seal-r1.json', 'seal-outer-receipt.json']
  assert.deepEqual(seal.excludes, excluded)
  const listed = []
  function walk(dir, base = '') {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      assert(!item.isSymbolicLink())
      const rel = base + item.name
      if (item.isDirectory()) walk(path.join(dir, item.name), rel + '/')
      else {
        assert(item.isFile())
        listed.push(rel)
      }
    }
  }
  walk(path.join(repo, evidence))
  assert.deepEqual(listed.sort(), [...Object.keys(index.files), ...excluded].sort())

  const originalSeal = json(oldPrefix + '-seal.json')
  for (const rel of [oldPrefix + '.md', oldPrefix + '-audit.json', oldPrefix + '-verdict.json']) {
    assert.deepEqual(fingerprint(read(rel)), originalSeal.outputs[rel], rel)
  }
  assert.deepEqual(originalSeal.drift, [])
  const oldAudit = json(oldPrefix + '-audit.json')
  const oldVerdict = json(oldPrefix + '-verdict.json')
  assert.equal(oldVerdict.evidence.indexSha256, oldAudit.integrity.indexSha256)
  assert.equal(oldAudit.integrity.indexCount, 2122)
  assert.equal(oldAudit.integrity.indexSha256, originalSeal.originalIndexSha256)
  assert.deepEqual(oldAudit.integrity.mismatches, [])
  for (const rel of [
    'docs/testing/op-growth-final-inheritance-20261022-r1.md',
    'docs/testing/remaining-governance-cases-20261021.md'
  ]) assert.deepEqual(fingerprint(read(rel)), oldAudit.inputs[rel])
  const bindings = [
    ['original-candidate-source-binding.json', 'candidate-source-binding.json'],
    ['original-browser-script-binding.json', 'browser-script-binding.json'],
    ['original-host-ready.json', 'host-ready.json'],
    ['original-round16-final-roots.json', 'round16-final-roots.json']
  ]
  for (const [copy, original] of bindings) {
    const rel = oldEvidence + '/' + original
    assert.deepEqual(fingerprint(read(rel)), oldAudit.inputs[rel], rel)
    assert.deepEqual(read(evidence + '/' + copy), read(rel), copy)
  }
  const binding = json(evidence + '/original-candidate-source-binding.json')
  assert.deepEqual(binding, oldAudit.candidate)
  assert.equal(binding.sourceCount, 114)
  assert.equal(binding.completeInputCount, 521)
  assert.equal(binding.port, 3267)
  assert.equal(binding.pid, 3133)
  assert.deepEqual(binding.flags, { e2e: '0', pilot: 'OFF' })
  const aggregate = binding.binding.find(row => row.source === 'src/client/board/queue-aggregate.ts')
  assert.deepEqual(fingerprint(read(evidence + '/' + aggregate.file)),
    { bytes: aggregate.bytes, sha256: aggregate.sha256 })
  const originalRoots = json(evidence + '/original-round16-final-roots.json')
  const rootFiles = Object.keys(index.files).filter(f => /^round.*-roots\.json$/.test(f))
  assert.equal(rootFiles.length, seal.rootStates)
  assert.equal(rootFiles.length, 9)
  const rawFiles = Object.keys(index.files).filter(f => f.includes('-raw/'))
  const rootResults = rootFiles.map(file => {
    const roots = json(evidence + '/' + file)
    assert.deepEqual(roots, originalRoots, file)
    const state = file.slice(0, -'-roots.json'.length)
    const currentRaw = rawFiles.filter(f => f.startsWith(state + '-raw/'))
    const dataNames = Object.keys(roots).filter(f => f.startsWith('data/pmtool/'))
    assert.deepEqual(currentRaw.map(f => f.slice((state + '-raw/').length)).sort(), dataNames.sort())
    for (const rawFile of currentRaw) {
      const rel = rawFile.slice((state + '-raw/').length)
      assert.deepEqual(index.files[rawFile], roots[rel], rawFile)
    }
    const ui = json(evidence + '/' + state + '.json')
    return { file, roots: Object.keys(roots).length, rawFiles: currentRaw.length,
      origin: ui.origin, timeOrigin: ui.timeOrigin, viewport: ui.viewport, changes: [] }
  })
  assert.equal(rawFiles.length, rootResults.reduce((sum, r) => sum + r.rawFiles, 0))
  const protectedNew = json(evidence + '/round04-new-candidate-protected.json')
  const newFinalRel = 'reports/all-pending-evidence-20261021/' + protectedNew.baseline
  assert.equal(newFinalRel, 'reports/all-pending-evidence-20261021/P2DisplayRepairGuiR2/round10-final-a-roots.json')
  assert.deepEqual(protectedNew.current, json(newFinalRel))
  assert.deepEqual(protectedNew.changes, [])
  assert.equal(Object.keys(protectedNew.current).length, 44)
  const returned = json(evidence + '/round04-returned-new-candidate.json')
  assert.equal(returned.origin, 'http://127.0.0.1:3269')
  const entry = json(evidence + '/round01-history-current.json')
  assert.equal(entry.origin, 'http://127.0.0.1:3267')

  const eventNames = ['round01-entry', 'round02-rest-scroll', 'round03-rest-follow', 'round04-return']
  const eventResults = []
  const frameNames = []
  let entrySnapshot
  for (const name of eventNames) {
    const events = json(evidence + '/' + name + '-events.json')
    assert(!events.rows.some(row => ['exception', 'unavailable-response'].includes(row.type)))
    const requests = events.rows.filter(row => row.type === 'request')
    const responses = events.rows.filter(row => row.type === 'response')
    assert.equal(requests.length, responses.length)
    for (const request of requests) {
      assert.equal(request.body.method, 'commands/execute')
      assert.equal(request.body.payload.args.line, '/pm web snapshot')
      const response = responses.find(row => row.body.rpcId === request.body.rpcId)
      assert(response)
      assert.equal(response.status, 200)
      assert.equal(response.body.result.ok, true)
      assert.equal(response.body.result.value.result.kind, 'success')
      if (name === 'round01-entry') entrySnapshot = JSON.parse(response.body.result.value.result.text)
    }
    for (const frame of events.frames) {
      assert.equal(index.files[frame.file].sha256, frame.sha256)
      frameNames.push(frame.file)
    }
    eventResults.push({ name, requests: requests.map(r => ({
      rpcId: r.body.rpcId, line: r.body.payload.args.line
    })), responses: responses.length, frames: events.frames.length })
  }
  const indexedFrames = Object.keys(index.files).filter(f => f.startsWith('frames/'))
  assert.deepEqual(frameNames.sort(), indexedFrames.sort())
  assert.equal(new Set(frameNames).size, 93)
  assert.equal(frameNames.length, seal.frames)
  assert.deepEqual(entrySnapshot.queue, oldAudit.queues.afterFollowup)
  assert.equal(entrySnapshot.queue['p-0005'].top, null)
  assert.deepEqual(entrySnapshot.queue['p-0005'].rest.map(r => r.taskId), ['t-0022'])
  assert.equal(entrySnapshot.queue['p-0005'].rest[0].absent, true)
  assert(!Object.values(entrySnapshot.queue).flatMap(q => [q.top, ...q.rest]).filter(Boolean)
    .some(row => row.taskId === 't-0021'))
  const expired = entrySnapshot.queue['p-0004'].rest.find(row => row.taskId === 't-0018')
  assert.equal(expired.title, '导出后改名')
  assert.equal(expired.muted, false)
  const rows = json(evidence + '/round03-rest-rows.json')
  assert.equal(rows.length, 8)
  assert(!rows.some(row => row.title === '未跟进会话'))
  const absence = rows.find(row => row.title === '仅缺席任务')
  assert.equal(absence.project, 'QA-G 仅缺席')
  assert.equal(absence.absent, '会话有结存 · 未跟进')
  assert.equal(rows.find(row => row.title === '导出后改名').muted, undefined)

  const outerResults = ['entry', 'scroll', 'scrollfollow', 'return', 'seal'].map(action => {
    const receipt = json(evidence + '/' + action + '-outer-receipt.json')
    const start = json(evidence + '/' + action + '-outer-start.json')
    assert.deepEqual(receipt.argv, start.argv)
    assert.equal(receipt.start, start.start)
    assert.equal(receipt.parentPid, start.parentPid)
    assert.equal(receipt.status, action === 'scroll' ? 1 : 0)
    assert.equal(receipt.signal, null)
    assert(Number.isInteger(receipt.childPid) && receipt.childPid > 0)
    assert(Date.parse(receipt.end) >= Date.parse(receipt.start))
    return { action, ...receipt }
  })
  const error = json(evidence + '/round02-error.json')
  assert(error.error.includes('assert(last)'))
  emit('-audit.json', {
    at: new Date().toISOString(), role: '独立审证专家，非开发/GUI执行端',
    environment: { os: process.platform, node: process.version, cwd: process.cwd(),
      pid: process.pid, parentPid: process.ppid, argv: process.argv },
    integrity: { members: 710, indexSha256: expectedIndex, ordinaryFiles: listed.length,
      frames: indexedFrames.length, rawFiles: rawFiles.length, states: rootResults.length,
      differences: [], excluded },
    candidate: binding, inheritedOriginal: { indexCount: 2122,
      indexSha256: oldAudit.integrity.indexSha256, rehashedWholeOldPackage: false,
      signedAuditSha256: inputs[oldPrefix + '-audit.json'].sha256,
      originalRootSha256: inputs[oldEvidence + '/round16-final-roots.json'].sha256 },
    roots: rootResults, events: eventResults, outer: outerResults,
    rest: { rows, queue: entrySnapshot.queue, expired,
      oldFollowup: oldAudit.followup, oldRowsRefreshed: oldAudit.queues.rowsRefreshed,
      oldRowsReloaded: oldAudit.queues.rowsReloaded,
      guiVerdictByReader: false, partialScreenshotDoesNotProveAbsence: true },
    newCandidateProtection: { count: 44, finalFile: newFinalRel,
      finalSha256: inputs[newFinalRel].sha256, changes: [], returnedOrigin: returned.origin,
      noNewCandidateFunctionalPass: true },
    retainedError: error, inputs,
    limits: { productExecution: 'NOT_RUN', guiExecution: 'NOT_RUN',
      imports: ['node:fs', 'node:path', 'node:crypto', 'node:assert/strict'],
      archivedScriptsExecuted: false, runtimeAccessed: false, oldTestingWritten: false }
  })
  console.log(JSON.stringify({ mode, members: 710, frames: indexedFrames.length,
    rawFiles: rawFiles.length, states: rootResults.length, rootsPerState: Object.keys(originalRoots).length,
    protectedNewRoots: 44, differences: 0, GUIVerdict: '由独立目视裁决，reader不签GUI' }))
}

function seal() {
  const audit = json(prefix + '-audit.json')
  const differences = drift(audit.inputs)
  assert.deepEqual(differences, [])
  const verdict = json(prefix + '-verdict.json')
  assert.equal(verdict.wholeP1Pass, false)
  assert.equal(verdict.parentCommitPass, false)
  assert.equal(verdict.wholeIdPass, false)
  const outputs = {}
  for (const suffix of ['.md', '-reader.mjs', '-audit.json', '-verdict.json', '-tool-receipts.json']) {
    const rel = prefix + suffix
    outputs[rel] = fingerprint(read(rel))
  }
  emit('-seal.json', { at: new Date().toISOString(), environment: {
    node: process.version, os: process.platform, pid: process.pid, parentPid: process.ppid,
    argv: process.argv }, inputCount: Object.keys(audit.inputs).length, drift: differences,
    outputs, indexSha256: expectedIndex, decision: verdict.decision,
    wholeIdPass: false, wholeP1Pass: false, parentCommitPass: false,
    excludedOuter: prefix + '-seal-outer-receipt.json', stopped: true, released: true })
  console.log(JSON.stringify({ mode, inputCount: Object.keys(audit.inputs).length,
    drift: differences.length, outputCount: Object.keys(outputs).length, stopped: true, released: true }))
}

function readback() {
  const sealDoc = json(prefix + '-seal.json')
  const audit = json(prefix + '-audit.json')
  assert.deepEqual(drift(audit.inputs), [])
  assert.deepEqual(drift(sealDoc.outputs), [])
  const receipt = json(prefix + '-seal-outer-receipt.json')
  assert.equal(receipt.exitCode, 0)
  assert.deepEqual(receipt.seal, fingerprint(read(prefix + '-seal.json')))
  assert.equal(receipt.tool, 'functions.exec_command')
  const result = { at: new Date().toISOString(), inputCount: Object.keys(audit.inputs).length,
    outputs: Object.keys(sealDoc.outputs).length, inputDrift: [], outputDrift: [],
    seal: fingerprint(read(prefix + '-seal.json')),
    actualSealToolReceipt: fingerprint(read(prefix + '-seal-outer-receipt.json')),
    stopped: true, released: true, noProductOrGuiExecution: true }
  emit('-readback.json', result)
  console.log(JSON.stringify({ mode, inputCount: result.inputCount, outputs: result.outputs,
    inputDrift: 0, outputDrift: 0, stopped: true, released: true }))
}

if (mode === 'capture') capture()
if (mode === 'seal') seal()
if (mode === 'readback') readback()

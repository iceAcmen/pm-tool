import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'p2007-archive-repair-gui-review-20261023-r2'
const own = '/tmp/' + prefix
const rootRel = 'reports/all-pending-evidence-20261021/P2007ArchiveRepairGuiR2'
const root = path.join(repo, rootRel)
const expectedIndex = 'fbeee5ee6fd51ed4957fd16bb16021c1d1d51ba7671f22dfb299fea00922d9c8'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const fp = b => ({ bytes: b.length, sha256: sha(b) })
const checks = []
function readAbs(file) {
  const rel = path.relative(repo, file)
  assert(rel && !rel.startsWith('..') && !path.isAbsolute(rel), 'read outside repository')
  let current = repo
  for (const part of rel.split(path.sep)) {
    current = path.join(current, part)
    assert(!fs.lstatSync(current).isSymbolicLink(), 'symlink read rejected: ' + current)
  }
  assert(fs.lstatSync(file).isFile(), 'not regular file: ' + file)
  return fs.readFileSync(file)
}
const read = rel => readAbs(path.join(root, rel))
const json = rel => JSON.parse(read(rel))
function memberNames(dir = root, rel = '') {
  const result = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const sub = path.join(dir, e.name)
    const name = rel ? rel + '/' + e.name : e.name
    const st = fs.lstatSync(sub)
    assert(!st.isSymbolicLink(), 'member symlink: ' + name)
    if (st.isDirectory()) result.push(...memberNames(sub, name))
    else {
      assert(st.isFile(), 'non-file member')
      result.push(name)
    }
  }
  return result.sort()
}
function check(label, run) {
  const detail = run()
  checks.push({ label, result: 'VERIFIED', detail })
  return detail
}
function write(name, value) {
  fs.mkdirSync(own, { recursive: true })
  fs.writeFileSync(path.join(own, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function indexCheck() {
  const indexBytes = read('index-r1.json')
  assert.equal(sha(indexBytes), expectedIndex)
  const index = JSON.parse(indexBytes)
  assert.equal(Object.keys(index.files).length, 717)
  const actual = memberNames().filter(n => !['index-r1.json', 'seal-r1.json', 'seal-outer-receipt.json'].includes(n))
  assert.deepEqual(actual, Object.keys(index.files).sort())
  const files = {}
  for (const [rel, info] of Object.entries(index.files)) {
    assert.equal(path.posix.normalize(rel), rel)
    assert(!rel.startsWith('../') && !path.isAbsolute(rel))
    files[rootRel + '/' + rel] = fp(read(rel))
    assert.deepEqual(files[rootRel + '/' + rel], info, rel)
  }
  for (const name of ['index-r1.json', 'seal-r1.json', 'seal-outer-receipt.json']) files[rootRel + '/' + name] = fp(read(name))
  return { index: fp(indexBytes), members: actual.length, physicalMembers: memberNames().length, files }
}
const references = [
  'AGENTS.md',
  'docs/collaboration.md',
  'docs/testing/p2007-archive-known-gaps-red-20261023-r1.md',
  'docs/testing/p2007-archive-projection-source-auto-20261023-r1-report.md',
  'docs/testing/p2007-archive-projection-source-auto-20261023-r1-seal.json',
  'docs/testing/f02-combined-regression-review-20261023-r2-report.md',
  'docs/testing/f02-combined-regression-review-20261023-r2-seal-tool-receipt.json',
  'docs/plans/2026-10-23-p2007-archive-gui-r2-plan.md',
  'reports/all-pending-evidence-20261021/F02RepairGuiR2/browser-script-binding.json',
  'reports/all-pending-evidence-20261021/F02RepairGuiR2/browser-script-2.js',
]
function manifest() {
  const bound = indexCheck()
  for (const rel of references) bound.files[rel] = fp(readAbs(path.join(repo, rel)))
  return bound
}
function audit() {
  const bound = check('717 members and index actual bytes/SHA/membership', manifest)
  const source = json('combined-source-files.json')
  const complete = json('combined-complete-inputs.json')
  const candidate = json('combined-candidate.json')
  const built = json('combined-built-artifacts.json')
  const activation = json('activation-binding.json')
  check('declared candidate and six frozen necessary sources', () => {
    assert.equal(source.count, 124)
    assert.equal(Object.keys(source.source).length, 124)
    assert.equal(Object.keys(complete).length, 525)
    assert.equal(candidate.sourceCount, 124)
    assert.equal(candidate.completeInputCount, 525)
    assert.equal(candidate.baseline, source.baseline)
    assert.equal(candidate.baseline, '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd')
    assert.equal(candidate.version, '0.7.4')
    const sources = {}
    for (const rel of ['src/core/archive.ts', 'src/core/archive.test.ts', 'src/core/storage.ts', 'src/core/review-materials.ts', 'src/commands/archive.ts', 'src/commands/review.ts']) {
      const info = fp(read('frozen-source/' + rel))
      assert.deepEqual(info, complete[rel], rel)
      const changedSourceSha = source.source['packages/dsh-pm-tool/' + rel]
      if (changedSourceSha !== undefined) assert.equal(info.sha256, changedSourceSha, rel)
      sources[rel] = info
    }
    const signed = JSON.parse(readAbs(path.join(repo, references[4])))
    for (const s of signed.boundSources) assert.deepEqual(sources[s.path], { bytes: s.bytes, sha256: s.sha256 })
    return { sources, baseline: candidate.baseline, source: 124, complete: 525, version: '0.7.4', currentSourceRead: false }
  })
  check('actual downloaded browser bundle binding without executing it', () => {
    const bindings = JSON.parse(readAbs(path.join(repo, references[8])))
    const script = readAbs(path.join(repo, references[9]))
    const binding = bindings.find(x => x.file === 'browser-script-2.js')
    assert.deepEqual(fp(script), { bytes: binding.bytes, sha256: binding.sha256 })
    assert.equal(activation.pid, 22463)
    assert.equal(activation.port, 3269)
    assert.equal(activation.flags.DSH_PM_E2E, '0')
    assert.equal(activation.completeInputs, 525)
    assert.equal(activation.builtSha256, '3be9d4a0bbc595bb0038e50787d33d38d47120237f7ab93fba40d1dc624f8159')
    const m = activation.matches.find(x => x.file === 'browser-script-2.js')
    const segment = script.subarray(m.offset, m.offset + m.bytes)
    assert.equal(segment.length, m.bytes)
    assert.equal(sha(segment), m.sha256)
    const restored = Buffer.concat([segment, Buffer.from('//# sourceMappingURL=client.js.map')])
    assert.equal(restored.length, activation.builtBytes)
    assert.equal(sha(restored), activation.builtSha256)
    const items = built.files ?? built
    const artifact = items['client.js'] ?? items['lib/client.js']
    assert(artifact, 'client artifact declaration')
    assert.deepEqual({ bytes: activation.builtBytes, sha256: activation.builtSha256 }, artifact)
    return { script: fp(script), segment: fp(segment), restored: fp(restored), pid: 22463, port: 3269, flags: activation.flags, liveAccess: false }
  })
  const eventNames = Object.keys(JSON.parse(read('index-r1.json')).files).filter(n => n.endsWith('-events.json'))
  const allRows = []
  check('156 recorded frames and actual RPC rows', () => {
    const frames = new Set()
    const groups = []
    for (const name of eventNames) {
      const e = json(name)
      for (const f of e.frames) {
        assert.equal(sha(read(f.file)), f.sha256)
        assert(!frames.has(f.file))
        frames.add(f.file)
      }
      assert(!e.rows.some(r => r.type === 'exception' || r.type === 'unavailable-response'), name)
      allRows.push(...e.rows.map(row => ({ ...row, evidence: name })))
      groups.push({ file: name, frames: e.frames.length, rows: e.rows.length })
    }
    assert.equal(frames.size, 156)
    assert.deepEqual([...frames].sort(), Object.keys(JSON.parse(read('index-r1.json')).files).filter(n => n.startsWith('frames/')).sort())
    return { groups, frameCount: 156, rows: allRows }
  })
  const archiveLine = '/pm archive p-0001 p2007-archive-repair-gui-r2'
  const reviewLine = '/pm review p-0001 2026-10-16 2026-10-23'
  const requests = allRows.filter(r => r.type === 'request')
  assert.equal(requests.length, 3)
  assert.equal(requests.filter(r => r.body.payload.args.line === archiveLine).length, 1)
  assert.equal(requests.filter(r => r.body.payload.args.line === reviewLine).length, 2)
  const commands = {}
  check('composer commands -> unique RPC request/response -> original output', () => {
    for (const [key, file] of Object.entries({ archive: 'round02-archive-command.json', review: 'round02-review-command.json', reread: 'round06-review-reread-command.json' })) {
      const c = json(file)
      const matchingRequests = requests.filter(r => r.body.rpcId === c.body.rpcId)
      const matchingResponses = allRows.filter(r => r.type === 'response' && r.body.rpcId === c.body.rpcId)
      assert.equal(matchingRequests.length, 1)
      assert.equal(matchingResponses.length, 1)
      const req = matchingRequests[0], res = matchingResponses[0]
      assert.equal(req.body.method, 'commands/execute')
      assert.equal(req.body.payload.args.line, c.line)
      assert.deepEqual(req.body.payload.args.submittedAttachments, [])
      assert.deepEqual(res.body, c.body)
      assert.equal(res.status, c.status)
      assert.equal(c.body.result.ok, true)
      assert.equal(c.body.result.value.result.kind, 'success')
      commands[key] = { file, request: req, response: res, command: c }
    }
    assert.equal(commands.archive.request.body.payload.args.agentId, commands.review.request.body.payload.args.agentId)
    assert.equal(commands.archive.request.body.payload.args.agentId, commands.reread.request.body.payload.args.agentId)
    assert.equal(commands.archive.command.line, archiveLine)
    assert.equal(commands.review.command.line, reviewLine)
    assert.equal(commands.reread.command.line, reviewLine)
    return commands
  })
  const packageBytes = read('exported-originals/package.json')
  const snapshot = JSON.parse(packageBytes)
  const reviewText = commands.review.command.body.result.value.result.text
  const fenceStart = reviewText.indexOf('```json\n')
  assert(fenceStart >= 0)
  const fenceEnd = reviewText.indexOf('\n```', fenceStart)
  assert(fenceEnd > fenceStart)
  const review = JSON.parse(reviewText.slice(fenceStart + 8, fenceEnd))
  const expectedIds = ['ref-mvi5z85j-yk04ji', 'ref-mvk0iiij-42f7xa', 'ref-mvk0n0me-25tmos', 'ref-mvk1iw2k-wd8ueq']
  const expectedCounts = [[4, 0, 'draft'], [1, 1, 'final'], [1, 1, 'final'], [3, 0, 'draft']]
  check('four legal current source records -> archive/review exact UTF8 known/gaps', () => {
    assert.equal(snapshot.projectId, 'p-0001')
    assert.equal(snapshot.project.id, 'p-0001')
    assert.equal(snapshot.origin, 'pm-tool')
    assert.equal(snapshot.kind, 'pm-tool-archive')
    assert.equal(snapshot.archivedAt, snapshot.exportedAt)
    assert(snapshot.exportedAt >= commands.archive.request.at && snapshot.exportedAt <= commands.archive.response.at)
    assert.deepEqual(snapshot.reflections.map(r => r.id), expectedIds)
    assert.deepEqual(review.reflections.map(r => r.id), expectedIds)
    assert.deepEqual(review.period, { start: '2026-10-16', end: '2026-10-23' })
    const rows = []
    for (const [i, id] of expectedIds.entries()) {
      const envelope = json('round02-before-archive-raw/data/pmtool/reflections/' + id + '.json')
      assert.equal(envelope.version, 2)
      const sourceRecord = envelope.record
      assert.equal(sourceRecord.projectId, 'p-0001')
      assert.equal(sourceRecord.id, id)
      const archived = snapshot.reflections[i]
      const reviewed = review.reflections[i]
      const known = sourceRecord.draft.lines.filter(l => l.mark === 'known').map(l => l.text)
      const excluded = sourceRecord.draft.lines.filter(l => l.mark !== 'known')
      assert.deepEqual([known.length, sourceRecord.draft.gaps.length, sourceRecord.status], expectedCounts[i])
      assert.deepEqual(archived.knownLines, known)
      assert.deepEqual(archived.gaps, sourceRecord.draft.gaps)
      assert.deepEqual(reviewed.knownLines, known)
      assert.equal(reviewed.title, sourceRecord.draft.title)
      assert.equal(reviewed.sourceEvent, sourceRecord.sourceEvent)
      for (const k of ['id', 'sourceEvent', 'status', 'createdAt', 'updatedAt']) assert.equal(archived[k], sourceRecord[k])
      for (const k of ['taskId', 'milestoneId', 'deliverableId']) assert.equal(archived[k], sourceRecord[k] ?? null)
      for (const line of known) {
        assert(reviewText.slice(0, fenceStart).includes(line))
        assert(Buffer.from(line).equals(Buffer.from(archived.knownLines[known.indexOf(line)])))
      }
      for (const line of excluded) assert(!archived.knownLines.includes(line.text) && !reviewed.knownLines.includes(line.text))
      rows.push({ source: sourceRecord, archive: archived, review: reviewed, excluded, knownUtf8Hex: known.map(x => Buffer.from(x).toString('hex')), gapUtf8Hex: sourceRecord.draft.gaps.map(x => Buffer.from(x).toString('hex')) })
    }
    assert.equal(rows.reduce((n, r) => n + r.archive.knownLines.length, 0), 9)
    assert.equal(rows.reduce((n, r) => n + r.archive.gaps.length, 0), 2)
    assert.notEqual(rows[1].archive.gaps[0], rows[2].archive.gaps[0])
    assert.equal(review.counts.reflectionKnownLines, 9)
    return { rows, known: 9, gaps: 2, markdownAndStructured: true }
  })
  check('existing done100 / wrapped65 positive cases only', () => {
    assert.deepEqual(review.tasks.map(t => t.id), ['t-0007', 't-0008'])
    const rows = []
    for (const [id, status, progress, done] of [['t-0007', 'done', 100, true], ['t-0008', 'wrapped', 65, false]]) {
      const sourceRecord = json('round02-before-archive-raw/data/pmtool/tasks/' + id + '.json').record
      const archived = snapshot.tasks.find(t => t.id === id)
      const reviewed = review.tasks.find(t => t.id === id)
      assert.equal(sourceRecord.projectId, 'p-0001')
      assert.equal(sourceRecord.status, status)
      assert.equal(sourceRecord.progress, progress)
      assert.equal(archived.status, status)
      assert.equal(archived.progress, progress)
      assert.equal(reviewed.kind, status)
      assert.equal(reviewed.done, done)
      assert.equal(reviewed.progress, progress)
      assert.equal(reviewed.title, sourceRecord.title)
      assert.equal(archived.title, sourceRecord.title)
      assert.equal(archived.completedDate, sourceRecord.completedDate ?? null)
      const date = status === 'done' ? sourceRecord.completedDate : sourceRecord.updatedAt.slice(0, 10)
      assert(date >= review.period.start && date <= review.period.end)
      rows.push({ source: sourceRecord, archive: archived, review: reviewed, inThisWindow: true })
    }
    assert.equal(review.counts.doneTasks, 1)
    assert.equal(review.counts.wrappedTasks, 1)
    assert.equal(review.counts.avgDoneProgress, 100)
    assert(reviewText.includes('已收尾（非正式完成，不计入完成数）'))
    assert(reviewText.includes('正式完成任务：1 项'))
    return { rows, counts: review.counts, boundary: 'existing two positive cases, not cycle boundary/full P2007' }
  })
  check('actual original file bodies and reread match exported bytes', () => {
    const originals = json('round03-export-originals.json')
    assert.deepEqual(originals.map(x => x.name), ['package.json', 'README-字段说明.md'])
    const views = []
    for (const [file, originalName] of [['round03-file-0.json', 'package.json'], ['round04-file-1.json', 'README-字段说明.md'], ['round06-archive-file-reread.json', 'package.json']]) {
      const v = json(file), row = originals.find(x => x.name === originalName)
      const b = read('exported-originals/' + originalName)
      assert.deepEqual(fp(b), { bytes: row.bytes, sha256: row.sha256 })
      assert(Buffer.from(v.text, 'utf8').equals(b), file)
      const url = new URL(v.url)
      assert.equal(url.protocol, 'file:')
      assert.equal(decodeURIComponent(url.pathname), row.originalPath)
      views.push({ file, url: v.url, at: v.at, timeOrigin: v.timeOrigin, body: fp(Buffer.from(v.text)), original: fp(b) })
    }
    assert.equal(memberNames(path.join(root, 'exported-originals')).length, 2)
    return { originals, views, onlyTwoSealedOriginals: true, liveFileAccess: false }
  })
  check('original reload plus normal readonly review reread without archive rewrite', () => {
    const before = json('round05-before-reentry.json')
    const failed = json('round05-error-state.json')
    const after = json('round06-after-original-reload.json')
    const host = json('round06-reentered-host-before-reread.json')
    const final = json('round06-final-readonly-state.json')
    assert.notEqual(before.timeOrigin, after.timeOrigin)
    assert.equal(failed.timeOrigin, after.timeOrigin)
    assert.equal(host.timeOrigin, after.timeOrigin)
    assert.equal(final.timeOrigin, after.timeOrigin)
    assert.equal(host.origin, 'http://127.0.0.1:3269')
    assert.equal(host.pathname, '/')
    assert(host.editables.some(x => x.visible))
    assert(!host.text.includes('复盘已核（known）句：9 条'))
    assert(Buffer.from(reviewText).equals(Buffer.from(commands.reread.command.body.result.value.result.text)))
    assert.equal(requests.filter(r => r.body.payload.args.line === archiveLine).length, 1)
    return { beforeTimeOrigin: before.timeOrigin, afterTimeOrigin: after.timeOrigin, errorAfterReloadTimeOrigin: failed.timeOrigin, fullText: fp(Buffer.from(reviewText)), rereadText: fp(Buffer.from(commands.reread.command.body.result.value.result.text)), originalEphemeralOutputSurvived: false, noSecondArchiveInRecordedChain: true }
  })
  check('12 states x38 copied raw business files / 44 root fingerprints', () => {
    const states = Object.keys(JSON.parse(read('index-r1.json')).files).filter(n => n.endsWith('-roots.json')).sort()
    assert.equal(states.length, 12)
    const baseline = json('round00-before-entry-roots.json')
    assert.equal(Object.keys(baseline).length, 44)
    const business = Object.keys(baseline).filter(n => n.startsWith('data/pmtool/')).sort()
    assert.equal(business.length, 38)
    const rows = []
    for (const file of states) {
      const stateName = file.slice(0, -11)
      const roots = json(file)
      assert.deepEqual(roots, baseline, file)
      const rawNames = memberNames(path.join(root, stateName + '-raw')).sort()
      assert.deepEqual(rawNames, business)
      for (const rel of business) assert.deepEqual(fp(read(stateName + '-raw/' + rel)), roots[rel], file + ':' + rel)
      rows.push({ file, roots: 44, copiedRaw: 38, difference: [] })
    }
    return { states: rows, rawCopies: 456, copiedBusinessFingerprintComparison: 'all 38 at every state', remainingSix: 'files/backups fingerprints only, not independently read original runtime bytes', exportsOutsideRootManifest: true }
  })
  check('actual Main command receipts and two original facility failures preserved', () => {
    const rows = []
    for (const name of ['inspect', 'entry', 'export', 'files', 'filesfollow', 'reentry', 'reentryfollow', 'seal']) {
      const r = json(name + '-outer-receipt.json')
      const s = json(name + '-outer-start.json')
      assert.equal(r.parentPid, s.parentPid)
      assert.deepEqual(r.argv, s.argv)
      assert.equal(r.status, ['files', 'reentry'].includes(name) ? 1 : 0)
      assert.equal(r.signal, null)
      rows.push({ name, ...r })
    }
    assert(json('round03-error.json').error.includes('Unknown key: "Control+End"'))
    assert(json('round05-error.json').error.includes('10000ms exceeded'))
    const mainSeal = json('seal-r1.json')
    assert.equal(mainSeal.members, 717)
    assert.equal(mainSeal.indexSha256, expectedIndex)
    assert.equal(mainSeal.frameCount, 156)
    assert.equal(mainSeal.GUIVerdict, 'PENDING independent review')
    assert.equal(rows.at(-1).status, 0)
    const priorReceipt = JSON.parse(readAbs(path.join(repo, references[6])))
    assert.equal(priorReceipt.actualToolExitCode, 0)
    return { commands: rows, mainSeal, combinedActualSealToolExit: 0, failedFacilityLayers: ['files key syntax unsupported after body read', 'reentry waited for ephemeral command output after successful reload'] }
  })
  write('capture.json', { at: new Date().toISOString(), bound })
  write('audit.json', { at: new Date().toISOString(), role: 'independent K16 archive GUI evidence reviewer; no product/GUI execution', checks, errors: [], productJudgment: 'NOT_YET_JUDGED_BY_READER', limitations: ['not entire P2007', 'not whole cycle gate', 'not parent ordinarycommit', 'no live source/runtime access'] })
  console.log(JSON.stringify({ checks: checks.length, members: bound.members, protected: Object.keys(bound.files).length, index: bound.index, errors: [] }))
}
function seal() {
  const captured = JSON.parse(fs.readFileSync(path.join(own, 'capture.json')))
  const current = manifest()
  assert.deepEqual(current, captured.bound)
  const names = fs.readdirSync(path.join(repo, 'docs/testing')).filter(n => n.startsWith(prefix + '-') && !n.endsWith('-seal.json') && !n.endsWith('-seal-tool-receipt.json')).sort()
  const outputs = {}
  for (const n of names) outputs['docs/testing/' + n] = fp(readAbs(path.join(repo, 'docs/testing', n)))
  assert(names.includes(prefix + '-report.md'))
  const report = readAbs(path.join(repo, 'docs/testing', prefix + '-report.md')).toString('utf8')
  assert(report.endsWith('**released / STOP。**\n'))
  const result = { at: new Date().toISOString(), protectedCount: Object.keys(current.files).length, protectedDrift: [], packageMembers: current.members, physicalMembers: current.physicalMembers, index: current.index, outputs, protection: 'explicit sealed 717 members + index/seal/actual receipt and 10 references only; no recursive docs/testing, no live/source/runtime/root accesses', state: 'released', stop: true, productExecutions: 0, guiExecutions: 0, gitExecutions: 0, sealToolResult: 'actual tool exit must be recorded after return, not self-certified' }
  write('seal.json', result)
  fs.copyFileSync(path.join(own, 'seal.json'), path.join(repo, 'docs/testing', prefix + '-seal.json'), fs.constants.COPYFILE_EXCL)
  console.log(JSON.stringify({ protected: result.protectedCount, drift: [], outputs: Object.keys(outputs).length, seal: fp(fs.readFileSync(path.join(own, 'seal.json'))) }))
}
function publish() {
  const targets = {
    'audit.json': prefix + '-audit.json',
    'capture.json': prefix + '-inputs.json',
  }
  for (const n of fs.readdirSync(own).filter(n => n.startsWith('reader-error-'))) targets[n] = prefix + '-' + n
  for (const [from, to] of Object.entries(targets)) fs.copyFileSync(path.join(own, from), path.join(repo, 'docs/testing', to), fs.constants.COPYFILE_EXCL)
  for (const suffix of ['reader.mjs', 'first-reader-error.log', 'second-reader-error.log']) {
    fs.copyFileSync('/tmp/' + prefix + '-' + suffix, path.join(repo, 'docs/testing', prefix + '-' + suffix), fs.constants.COPYFILE_EXCL)
  }
  console.log(JSON.stringify({ published: [...Object.values(targets), ...['reader.mjs', 'first-reader-error.log', 'second-reader-error.log'].map(n => prefix + '-' + n)], originalBytesCopied: true }))
}
function readback() {
  const current = manifest()
  const captured = JSON.parse(fs.readFileSync(path.join(own, 'capture.json')))
  assert.deepEqual(current, captured.bound)
  const sealRel = 'docs/testing/' + prefix + '-seal.json'
  const sealBytes = readAbs(path.join(repo, sealRel))
  assert(sealBytes.equals(fs.readFileSync(path.join(own, 'seal.json'))))
  const sealed = JSON.parse(sealBytes)
  for (const [rel, info] of Object.entries(sealed.outputs)) assert.deepEqual(fp(readAbs(path.join(repo, rel))), info, rel)
  const receipt = JSON.parse(readAbs(path.join(repo, 'docs/testing/' + prefix + '-seal-tool-receipt.json')))
  assert.equal(receipt.actualToolExitCode, 0)
  assert.deepEqual(receipt.seal, { file: sealRel, ...fp(sealBytes) })
  const result = { at: new Date().toISOString(), seal: { file: sealRel, ...fp(sealBytes) }, toolReceiptObservedExit: receipt.actualToolExitCode, allSealedOutputsEqual: true, protectedCount: Object.keys(current.files).length, protectedDrift: [], packageMembers: current.members, physicalMembers: current.physicalMembers, index: current.index, ownSealAndRepositoryCopySame: true, state: 'released', stop: true, actualReadbackToolExit: 'recorded only after this command returns' }
  write('readback.json', result)
  fs.copyFileSync(path.join(own, 'readback.json'), path.join(repo, 'docs/testing', prefix + '-readback.json'), fs.constants.COPYFILE_EXCL)
  console.log(JSON.stringify({ protected: result.protectedCount, drift: [], sealToolExitReadBack: 0, readback: fp(fs.readFileSync(path.join(own, 'readback.json'))) }))
}
const mode = process.argv[2]
try {
  if (mode === 'audit') audit()
  else if (mode === 'seal') seal()
  else if (mode === 'publish') publish()
  else if (mode === 'readback') readback()
  else throw new Error('expected audit, publish, seal or readback')
} catch (error) {
  write('reader-error-' + Date.now() + '.json', { error: String(error), stack: error.stack, completedChecks: checks, actualExitPending: true })
  throw error
}

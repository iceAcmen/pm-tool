// Evidence-only reader. No product imports, runtime data reads, Git or services.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const self = fileURLToPath(import.meta.url)
const prefix = self.slice(0, -'-audit.mjs'.length)
const repo = path.resolve(path.dirname(self), '../..')
const evidence = path.join(repo, 'reports/all-pending-evidence-20261021')
const root = path.join(evidence, 'F07RemainingR1')
const combined = path.join(evidence, 'CombinedGuiR1')
const frozen = '/private/tmp/pmtool-combined-repair-20261022-r2'
const firstSealId = 'fd92fb1bb5d27a28426411cf1ed32551'
const firstSealRoot = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution/' + firstSealId
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const read = file => fs.readFileSync(file)
const json = file => JSON.parse(read(file))
const atRoot = name => path.join(root, name)
const fingerprint = file => {
  assert(fs.lstatSync(file).isFile(), file)
  const bytes = read(file)
  return { bytes: bytes.length, sha256: sha(bytes) }
}
const sortedEntries = entries => [...entries].sort(([a], [b]) => a.localeCompare(b))
const core = {
  projects: 'projects', tasks: 'tasks', milestones: 'milestones',
  risk_issues: 'riskIssues', meetings: 'meetings', reports: 'reports',
  deliverables: 'deliverables',
}
const extra = ['settings', 'reflections', 'okrs', 'lessons', 'habits', 'file_assets']
const tables = [...Object.keys(core), ...extra]
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(key => !equal(a[key], b[key]))
const equal = (a, b) => {
  try { assert.deepStrictEqual(a, b); return true } catch { return false }
}
function rawTables(dir) {
  const base = path.join(dir, 'data/pmtool')
  assert.deepEqual(fs.readdirSync(base).sort(), [...tables].sort())
  return Object.fromEntries(tables.map(table => [table, sortedEntries(
    fs.readdirSync(path.join(base, table)).map(name => {
      const envelope = json(path.join(base, table, name))
      assert.equal(envelope.version, 2)
      return [decodeURIComponent(name.slice(0, -5)), envelope.record]
    }),
  )]))
}
function backupTables(backup) {
  assert.equal(backup.format, 'pm-tool-backup')
  assert.equal(backup.formatVersion, 1)
  assert.deepEqual(Object.keys(backup.extra).sort(), [...extra].sort())
  return Object.fromEntries(tables.map(table => [table, sortedEntries(
    core[table] ? backup[core[table]].map(row => [row.id, row]) : backup.extra[table],
  )]))
}
function verifyIndex(file, count, expectedHash) {
  const binding = fingerprint(file)
  assert.equal(binding.sha256, expectedHash)
  const index = json(file)
  assert.equal(index.count, count)
  assert.equal(Object.keys(index.files).length, count)
  for (const [rel, expected] of Object.entries(index.files)) {
    assert(!path.isAbsolute(rel) && !rel.split('/').includes('..'))
    assert.deepEqual(fingerprint(path.join(path.dirname(file), rel)), expected, rel)
  }
  return { file: path.relative(repo, file), ...binding, count, at: index.at, verified: count }
}
const protectedIndexes = () => [
  verifyIndex(atRoot('index.json'), 573, 'b18c77445de3f1d281d0a51ec9627c6e5551b60f328bc1f4afb594700eb61168'),
  verifyIndex(path.join(combined, 'j03-index.json'), 468, 'e4833192fa8429b89d6a121eb9de1a1b1621f4b67e3b645c2ad77c3e5f455535'),
  verifyIndex(path.join(combined, 'continuation-index.json'), 1537, '2c1dd6628834258893c4ae8a36e656f71006cda455b29f6ab933746fd602ceb9'),
  verifyIndex(path.join(combined, 'shared-index.json'), 1799, 'cba4e79542cf50ada54a0dad5749e56cc5432aff010f30a8dc0253d762407c40'),
]
function verifyPackage(dir, name, expectedAssets, expectedHash) {
  const file = path.join(dir, name)
  const binding = fingerprint(file)
  assert.equal(binding.sha256, expectedHash)
  const backup = json(file)
  const sidecar = file + '.files.' + backup.fileBundleId
  const manifestFile = path.join(sidecar, 'manifest.json')
  const manifest = json(manifestFile)
  assert.equal(manifest.format, 'pm-tool-backup-files')
  assert.equal(manifest.bundleId, backup.fileBundleId)
  assert.equal(manifest.jsonSha256, binding.sha256)
  assert.equal(manifest.count, expectedAssets)
  const rows = backup.extra.file_assets
  assert.equal(rows.length, expectedAssets)
  const bytes = rows.map(([id, asset]) => {
    const entry = manifest.files.find(row => row.relPath === asset.relPath)
    assert.deepEqual(entry, { relPath: asset.relPath, sha256: asset.sha256, size: asset.size })
    assert(!path.isAbsolute(asset.relPath) && !asset.relPath.split('/').includes('..'))
    const file = path.join(sidecar, asset.relPath)
    const binding = fingerprint(file)
    assert.equal(binding.bytes, asset.size)
    assert.equal(binding.sha256, asset.sha256)
    assert(asset.relPath.startsWith(asset.sha256.slice(0, 2) + '/'))
    return { id, relPath: asset.relPath, ...binding }
  })
  assert.equal(manifest.files.length, expectedAssets)
  return { name, ...binding, fileBundleId: backup.fileBundleId,
    manifest: fingerprint(manifestFile), ordinaryFiles: expectedAssets + 2, bytes,
    rows: backupTables(backup), sidecar }
}

const mode = process.argv[2]
assert(['audit', 'check', 'close'].includes(mode), 'Use audit, check or close')
const indexes = protectedIndexes()
if (mode === 'close') {
  const audit = json(prefix + '-audit.json')
  assert.deepEqual(indexes, audit.indexes)
  const ownFiles = [self, prefix + '-audit.json', prefix + '.md']
  const report = fs.readFileSync(prefix + '.md', 'utf8')
  const links = [...report.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1])
  for (const link of links.filter(link => !/^[a-z]+:/i.test(link))) {
    assert(fs.existsSync(path.resolve(path.dirname(self), link.split('#')[0])), link)
  }
  fs.writeFileSync(prefix + '-close.json', JSON.stringify({
    at: new Date().toISOString(), indexes,
    ownFiles: Object.fromEntries(ownFiles.map(file => [path.relative(repo, file), fingerprint(file)])),
    relativeLinksChecked: links.length,
    boundary: '仅终核本有限报告及原声明；不签父门，不改原件，release STOP。',
  }, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify({ mode, declared573Unchanged: true, priorIndexesUnchanged: true, relativeLinks: links.length }))
} else {
  const index = json(atRoot('index.json'))
  const source = json(atRoot('source-binding.json'))
  const final = json(atRoot('final-observation.json'))
  const rollback = json(atRoot('12-rollback-observation.json'))
  const before = rawTables(atRoot('01-target-before-fault-raw'))
  const before0 = rawTables(atRoot('00-target-before0-raw'))
  const shared80 = rawTables(path.join(combined, '80-shared-gc-empty-applied-raw'))
  assert.deepEqual(before, before0)
  assert.deepEqual(before0, shared80)
  const rawStates = [...new Set(Object.keys(index.files).filter(name => name.includes('-raw/'))
    .map(name => name.split('/')[0]))].sort()
  assert.equal(rawStates.length, 21)
  const states = rawStates.map(name => {
    const rows = rawTables(atRoot(name))
    assert.deepEqual(rows, before, name)
    const roots = json(atRoot(name.slice(0, -4) + '-roots.json'))
    for (const [rel, record] of Object.entries(roots.files).filter(([rel]) => rel.startsWith('data/pmtool/'))) {
      const binding = fingerprint(atRoot(name + '/' + rel))
      assert.equal(binding.bytes, record.bytes)
      assert.equal(binding.sha256, record.sha256)
    }
    const ui = json(atRoot(name.slice(0, -4) + '.json'))
    assert.equal(ui.origin, 'http://127.0.0.1:3260')
    return { name, counts: Object.fromEntries(tables.map(table => [table, rows[table].length])),
      timeOrigin: ui.timeOrigin, viewport: ui.viewport, allRowsAndRawHashesEqual: true }
  })
  const original = verifyPackage(path.join(combined, 'backup-packages'),
    'pmtool-backup-2026-10-22T12-41-19-715Z.json', 2,
    'bf685cd0eec617a8d6f01c1de1b5fd69bb83fbd921c062915b8b8effe672a489')
  const sourcePackage = verifyPackage(atRoot('source-package'),
    'pmtool-backup-2026-10-22T13-20-09-542Z.json', 4,
    'd8b1348e690a8ea5d906d5c70bba545310d425cc647524938cdcf6de488403f2')
  const safety = verifyPackage(atRoot('safety-package'),
    'pmtool-backup-2026-10-22T13-23-44-808Z.json', 2,
    '80e7b92042d09c30eccf769f6672e6aa12825f2df4548fb796d3afc59c5a952f')
  assert.deepEqual(safety.rows, before)
  assert.deepEqual(sourcePackage.rows, Object.fromEntries(
    Object.entries(source.tables).map(([name, rows]) => [name, sortedEntries(rows)]),
  ))
  const expectedSource = structuredClone(original.rows)
  const project = expectedSource.projects.find(([id]) => id === 'p-0001')[1]
  project.name = 'RA-F07-source-midpromotion'
  project.updatedAt = '2026-10-22T13:20:09.406Z'
  expectedSource.file_assets.push(...['A', 'B'].map(label => {
    const { alreadyExisted, ...asset } = source['asset' + label]
    assert.equal(alreadyExisted, false)
    return [asset.id, asset]
  }))
  assert.deepEqual(sourcePackage.rows, expectedSource)
  assert.deepEqual(source.order, ['fa-0001', 'fa-0002', 'fa-0003', 'fa-0004'])
  for (const label of ['A', 'B']) {
    const asset = source['asset' + label]
    assert.equal(asset.mediaType, 'text/plain')
    const input = fingerprint(atRoot('input-' + label + '.txt'))
    assert.equal(input.bytes, 21)
    assert.equal(input.sha256, asset.sha256)
    assert(!read(atRoot('input-' + label + '.txt')).includes(0))
    assert.deepEqual(read(path.join(sourcePackage.sidecar, asset.relPath)), read(atRoot('input-' + label + '.txt')))
  }
  assert.equal(source.assetA.sha256.slice(0, 2), '37')
  assert.equal(source.assetB.sha256.slice(0, 2), 'ae')
  const roots = name => json(atRoot(name + '-roots.json'))
  const r0 = roots('00-target-before0'), rf = roots('01-target-before-fault')
  const ra = roots('04-failure-after'), rn = roots('20-newhost-okrs')
  assert(!r0.directories.includes('files/37') && !r0.directories.includes('files/ae'))
  assert(!r0.files['files/37'] && !r0.files['files/ae'])
  const business = records => Object.fromEntries(Object.entries(records)
    .filter(([key]) => key.startsWith('data/pmtool/') || key.startsWith('files/')))
  assert.deepEqual(diff(business(r0.files), business(rf.files)), ['files/ae'])
  const blocker = json(atRoot('blocker.json'))
  assert.deepEqual(rf.files['files/ae'], { bytes: blocker.bytes, sha256: blocker.sha256, type: 'file' })
  assert.equal(blocker.type, 'ordinary-file')
  for (const state of states) {
    const current = roots(state.name.slice(0, -4))
    assert.deepEqual(business(current.files), business(state.name.startsWith('00-') ? r0.files : rf.files))
    assert(!current.files['files/' + source.assetA.relPath])
    assert(!current.files['files/' + source.assetB.relPath])
  }
  const precheckChanges = Object.fromEntries(['02-source-prechecked', '03-danger-confirm'].map(name => {
    const current = roots(name)
    const changed = diff(rf.files, current.files)
    assert.deepEqual(changed, [
      'data/session_projcache/sessions/session-ed2499c1-b497-4378-b393-f7f2e0298657.json',
    ])
    assert.deepEqual(current.directories, rf.directories)
    return [name, changed.map(file => ({ file, before: rf.files[file], after: current.files[file] }))]
  }))
  assert.deepEqual(diff(rf.files, ra.files), rollback.changed)
  assert.deepEqual(diff(rf.files, rn.files), final.changed)
  assert.deepEqual(ra.directories.filter(name => !rf.directories.includes(name)), rollback.directoriesAdded)
  assert.deepEqual(rn.directories.filter(name => !rf.directories.includes(name)), final.directoriesAdded)
  for (const current of [ra, rn]) {
    const safetyFiles = Object.keys(current.files).filter(name => name.startsWith('backups/' + safety.name))
    assert.equal(safetyFiles.length, 4)
    for (const rel of safetyFiles) {
      const binding = fingerprint(atRoot('safety-package/' + rel.slice('backups/'.length)))
      assert.equal(binding.sha256, current.files[rel].sha256)
      assert.equal(binding.bytes, current.files[rel].bytes)
    }
    assert(!Object.keys(current.files).some(name => name.startsWith('files/37/')))
    assert(!Object.keys(current.files).some(name => name.startsWith('backups/.staging-2026-10-22T13-23-44-808Z-')))
  }
  for (const asset of safety.bytes) {
    assert.deepEqual(read(path.join(safety.sidecar, asset.relPath)), read(path.join(original.sidecar, asset.relPath)))
    assert.deepEqual(read(path.join(sourcePackage.sidecar, asset.relPath)), read(path.join(original.sidecar, asset.relPath)))
    for (const current of [r0, rf, ra, rn]) {
      assert.equal(current.files['files/' + asset.relPath].sha256, asset.sha256)
      assert.equal(current.files['files/' + asset.relPath].bytes, asset.bytes)
    }
  }
  const watch = fs.readFileSync(atRoot('watch-events.ndjson'), 'utf8').trim().split('\n').map(line => JSON.parse(line))
  assert.deepEqual(watch, rollback.watch)
  const projectEvents = watch.filter(row => row.key === 'project' && row.exists)
  assert.deepEqual(projectEvents.map(row => row.name),
    ['QA-A-fixture-F5', 'RA-F07-source-midpromotion', 'QA-A-fixture-F5'])
  const aEvents = watch.filter(row => row.key === 'A')
  assert.deepEqual(aEvents.map(row => row.exists), [false, true, false])
  const observedA = fingerprint(atRoot('observed-A-bytes.txt'))
  assert.equal(observedA.bytes, 21)
  assert.equal(observedA.sha256, source.assetA.sha256)
  assert.deepEqual(read(atRoot('observed-A-bytes.txt')), read(atRoot('input-A.txt')))
  assert(aEvents[1].at > projectEvents[1].at && aEvents[1].at < projectEvents[2].at)
  assert(aEvents[2].at > projectEvents[2].at)
  assert(watch.filter(row => row.key === 'B').every(row => !row.exists && row.code === 'ENOTDIR'))
  const events = Object.keys(index.files).filter(name => name.endsWith('-events.json')).sort()
    .flatMap(name => json(atRoot(name)).map(row => ({ file: name, ...row })))
  const requests = events.filter(row => row.method === 'Network.requestWillBeSent')
  assert.equal(requests.length, 2)
  assert.equal(requests.filter(row => row.body.payload.args.line.endsWith(' confirm')).length, 1)
  const rpc = requests.map(request => {
    const response = events.find(row => row.method === 'Network.responseReceived' && row.requestId === request.requestId)
    assert(response)
    const body = JSON.parse(response.body.body)
    assert.equal(body.rpcId, request.body.rpcId)
    assert.equal(body.result.ok, true)
    return { requestFile: request.file, responseFile: response.file, requestId: request.requestId,
      rpcId: body.rpcId, line: request.body.payload.args.line, status: response.status,
      business: body.result.value.result }
  })
  assert.equal(rpc[0].business.kind, 'success')
  assert.equal(rpc[1].business.kind, 'error')
  assert(rpc[1].business.text.includes('恢复中途失败，但已自动回滚到恢复前状态'))
  assert(rpc[1].business.text.includes('ENOTDIR') && rpc[1].business.text.includes(source.assetB.relPath))
  const firstDownload = fingerprint(atRoot('15-newhost-fa2.md'))
  assert.equal(firstDownload.bytes, 0)
  const download = fingerprint(atRoot('22-newhost-fa2-redownload.md'))
  const fa2 = safety.bytes.find(row => row.id === 'fa-0002')
  assert.equal(download.bytes, 22)
  assert.equal(download.sha256, fa2.sha256)
  assert.deepEqual(read(atRoot('22-newhost-fa2-redownload.md')), read(path.join(safety.sidecar, fa2.relPath)))
  const receipt = json(atRoot('22-download-receipt.json'))
  assert.equal(receipt.failure, null)
  assert.equal(receipt.bytes, 22)
  assert.equal(receipt.url, 'http://127.0.0.1:3260/api/pm/v1/assets/fa-0002?taskId=t-0001')
  assert.deepEqual(json(atRoot('22-download-network.json')), [])
  const refsFa1 = before.tasks.flatMap(([id, task]) =>
    (task.attachments ?? []).filter(row => row.assetId === 'fa-0001').map(row => ({ id, attachment: row.id })))
  assert.deepEqual(refsFa1, [])
  assert(before.tasks.find(([id]) => id === 't-0001')[1].attachments
    .some(row => row.id === 'at-4' && row.assetId === 'fa-0002'))
  const executions = Object.keys(index.files).filter(name => /^executions\/.*\.json$/.test(name)).sort().map(name => {
    const metadata = json(atRoot(name))
    assert.equal(metadata.status, 'exited')
    assert.equal(metadata.outputComplete, true)
    assert.equal(metadata.exitCode, 0)
    return { id: metadata.executionId, metadata, metadataBinding: fingerprint(atRoot(name)),
      logBinding: fingerprint(atRoot(name.replace(/\.json$/, '.log'))) }
  })
  assert.equal(executions.length, 9)
  assert.deepEqual(executions.map(row => row.id).sort(), final.executions.map(row => row.id).sort())
  const firstSealMeta = json(path.join(firstSealRoot, 'execution.json'))
  const firstSealLog = fs.readFileSync(path.join(firstSealRoot, 'output.log'), 'utf8')
  assert.equal(firstSealMeta.exitCode, 1)
  assert.equal(firstSealMeta.status, 'exited')
  assert(firstSealLog.includes(firstDownload.sha256) && firstSealLog.includes(fa2.sha256))
  assert(!executions.some(row => row.id === firstSealId))
  const candidate = json(path.join(evidence, 'CombinedRepairR1/r2/source-files.json'))
  const finalSource = json(atRoot('final-source-binding.json'))
  assert.equal(candidate.count, 107)
  assert.deepEqual(candidate.source, finalSource.source)
  assert.deepEqual(finalSource.differences, [])
  const frozenPackage = Object.entries(candidate.source).filter(([rel]) => rel.startsWith('packages/'))
    .map(([rel, expected]) => {
      const binding = fingerprint(path.join(frozen, rel))
      assert.equal(binding.sha256, expected, rel)
      return { file: rel, ...binding }
    })
  const client = fingerprint(path.join(frozen, 'packages/dsh-pm-tool/lib/client.js'))
  assert.equal(client.sha256, '09219cf81820294161dbdbdced09e73094b000a7d7e1d2e5b8c42f399fabb0db')
  const hostStop = json(atRoot('host-exact-stop.json'))
  const gone = json(atRoot('host-listener-gone.json'))
  const host = json(atRoot('host-reentry-start.json'))
  const ready = json(atRoot('host-reentry-ready.json'))
  assert.equal(hostStop.pid, 71922)
  assert.equal(hostStop.port, 3260)
  assert.equal(hostStop.signal, 'SIGTERM')
  assert.equal(gone.listenerGone, true)
  assert.equal(gone.pid, 71922)
  assert.equal(host.pid, 87385)
  assert.equal(host.port, 3260)
  assert.equal(ready.pid, host.pid)
  assert(hostStop.at < gone.at && gone.at < host.at && host.at < ready.at)
  assert.equal(host.bundleSha256, client.sha256)
  assert.equal(finalSource.baseline, candidate.baseline)
  assert.equal(finalSource.newHost.pid, host.pid)
  const pictures = Object.keys(index.files).filter(name => /\.(png|jpg)$/.test(name)).sort()
  assert.equal(pictures.filter(name => name.endsWith('.png')).length, 21)
  assert.equal(pictures.filter(name => name.endsWith('.jpg')).length, 9)
  const result = {
    at: new Date().toISOString(), role: 'trae 独立 GUI 审证，非开发、非执行',
    environment: { os: process.platform, node: process.version, pnpm: '11.28.5 原执行口径，审证未调用' },
    indexes, baseline: candidate.baseline, sourceCount: 107, frozenPackage,
    launcherDeclarationOnly: 107 - frozenPackage.length, client,
    sourceBinding: fingerprint(atRoot('source-binding.json')),
    finalSourceBinding: fingerprint(atRoot('final-source-binding.json')),
    original: { ...original, sidecar: path.relative(repo, original.sidecar) },
    sourcePackage: { ...sourcePackage, sidecar: path.relative(repo, sourcePackage.sidecar) },
    safety: { ...safety, sidecar: path.relative(repo, safety.sidecar) },
    beforeFaultRows: before, states, roots: {
      before0ToFault: diff(r0.files, rf.files),
      faultToFailure: diff(rf.files, ra.files), faultToNewHost: diff(rf.files, rn.files),
      directoriesAdded: final.directoriesAdded, blocker, precheckChanges,
      businessAndOriginalBytesExact: true,
      boundary: '仅 data/files/backups 原清单与封存业务正文，不读活业务库、不签全机零写。',
    },
    watch, observedA, rpc, exceptionsCaptured: events.filter(row => row.method === 'Runtime.exceptionThrown'),
    consolesCaptured: events.filter(row => row.method === 'Runtime.consoleAPICalled'),
    executions, firstSeal: { id: firstSealId, metadata: firstSealMeta,
      metadataBinding: fingerprint(path.join(firstSealRoot, 'execution.json')),
      logBinding: fingerprint(path.join(firstSealRoot, 'output.log')), log: firstSealLog,
      boundary: '原封存外层失败，不在九份执行内；自有 audit 保存原日志与元数据，不改旧 index。',
    },
    downloads: { firstDownload, download, receipt, assetHttpCaptured: false, refsFa1 },
    host: { stop: hostStop, gone, start: host, ready },
    pictures: pictures.map(file => ({ file, ...fingerprint(atRoot(file)), actuallyViewed: true })),
    pictureBoundary: '全部21PNG及9JPEG逐图目视；JPEG仅预检/确认/首次下载片段，非P06-P12连续全程录屏。',
    rawObservations: { rollbackBinding: fingerprint(atRoot('12-rollback-observation.json')),
      finalBinding: fingerprint(atRoot('final-observation.json')), reportBinding: fingerprint(atRoot('raw-report.md')) },
    reviewerReaderFirstFailure: {
      exitCode: 1, lineAtFailure: 199,
      cause: '自有reader误将宿主session缓存纳入预检零写；实际仅同一session SHA变，业务/files/backups均不变。',
      actualSessionSha: 'ab98a8f1bc5b8aaf581c023a68f7d9fb0e253b3e66a483bdf63aa28c4690846d',
      beforeSessionSha: 'e43398d27575f63fb9557b736929d17f661abca9f2593068e7392595af4c2d5d',
      correction: '只修本reader按原合同单列宿主变化，不改原件/产品/用例；首次未写出audit.json。',
    },
    boundary: '证据一致性不自成产品PASS；有限裁决见同前缀独立报告，不签整F07/F06/J06/父总门/commit，release STOP。',
  }
  if (mode === 'check') {
    const saved = json(prefix + '-audit.json')
    result.at = saved.at
    assert.deepEqual(result, saved)
  } else {
    fs.writeFileSync(prefix + '-audit.json', JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  }
  console.log(JSON.stringify({ mode, declared: 573, states: states.length, tables: tables.length,
    sourceAssets: 4, safetyAssets: 2, frozenPackage: frozenPackage.length,
    pngViewed: 21, jpgViewed: 9, executionsExit0: 9, firstSealExit: 1, fa2Bytes: download.bytes }))
}

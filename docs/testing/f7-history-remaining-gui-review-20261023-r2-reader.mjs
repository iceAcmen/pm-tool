import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/f7-history-remaining-gui-review-20261023-r2'
const evidence = 'reports/all-pending-evidence-20261021/F7RemainderR1'
const inputs = {}
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
function read(rel) {
  assert(!path.isAbsolute(rel) && !rel.split('/').includes('..'))
  const file = path.join(repo, rel)
  assert(!fs.lstatSync(file).isSymbolicLink(), `No linked input: ${rel}`)
  assert(fs.realpathSync(file).startsWith(repo + '/'), `Outside repo: ${rel}`)
  const bytes = fs.readFileSync(file)
  inputs[rel] = { bytes: bytes.length, sha256: sha(bytes) }
  return bytes
}
const json = rel => JSON.parse(read(rel))
const get = name => json(`${evidence}/${name}`)
const write = (suffix, value) => fs.writeFileSync(
  path.join(repo, prefix + suffix), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' }
)

if (['capture', 'capture-r2'].includes(process.argv[2])) {
  const corrected = process.argv[2] === 'capture-r2'
  if (corrected) read(prefix + '-audit.json')
  for (const rel of [
    'AGENTS.md', 'docs/collaboration.md',
    'docs/testing/op-growth-final-inheritance-20261022-r1.md',
    'docs/testing/independent-acceptance-batch1-closure-plan-20261021.md',
    'docs/testing/remaining-governance-cases-20261021.md',
    'docs/testing/remaining-acceptance-register-20261021.md',
    'docs/testing/a0-gui-raw-review-20261021.md',
    'docs/testing/gui-numbers-habit-dark-review-20261021.md',
    'docs/plans/2026-10-23-0611-continuation.md',
  ]) read(rel)
  const index = get('index-r1.json')
  const seal = get('seal-r1.json')
  const indexRows = Object.entries(index).map(([name, expected]) => {
    read(`${evidence}/${name}`)
    const actual = inputs[`${evidence}/${name}`]
    return { name, expected, actual, equal: isDeepStrictEqual(expected, actual) }
  })
  assert.equal(indexRows.length, 231)
  assert(indexRows.every(r => r.equal))
  assert.equal(seal.files, 231)
  assert.equal(seal.indexSha256, inputs[`${evidence}/index-r1.json`].sha256)

  const originalIndex = json('reports/all-pending-evidence-20261021/A0/evidence-sha256.json')
  const originalFixtureRel = 'reports/all-pending-evidence-20261021/A0/habit/fixture.json'
  const originalFixture = json(originalFixtureRel)
  const oldReview = json('docs/testing/gui-numbers-habit-dark-review-20261021-result.json')
  const fixtureIndexEntry = originalIndex['habit/fixture.json']
    ?? originalIndex[originalFixtureRel]
    ?? oldReview.hashes[originalFixtureRel]
  assert(fixtureIndexEntry, 'Original fixture absent from explicit review inputs')
  const fixtureActual = inputs[originalFixtureRel]
  assert.equal(typeof fixtureIndexEntry === 'string'
    ? fixtureIndexEntry : fixtureIndexEntry.sha256, fixtureActual.sha256)
  const backup = get('original-F7-backup.json')
  assert.equal(inputs[`${evidence}/original-F7-backup.json`].sha256, originalFixture.sha256)
  const binding = get('fixture-binding.json')
  assert(isDeepStrictEqual(binding.history, originalFixture.habit))
  assert(isDeepStrictEqual(backup.extra.habits[0], [binding.habitId, originalFixture.habit]))
  assert(isDeepStrictEqual(backup.projects[0], originalFixture.project))

  const candidate = get('original114-candidate.json')
  const complete = get('original114-complete-inputs.json')
  const source = get('original114-source-files.json')
  const built = get('original114-built-artifacts.json')
  const copiedMetadata = []
  for (const name of ['candidate.json', 'complete-inputs.json', 'source-files.json', 'built-artifacts.json']) {
    const original = read(`reports/all-pending-evidence-20261021/CombinedSuccessor114R1/${name}`)
    const copied = read(`${evidence}/original114-${name}`)
    copiedMetadata.push({ name, equal: original.equals(copied), sha256: sha(copied) })
  }
  assert(copiedMetadata.every(row => row.equal))
  assert.equal(Object.keys(complete).length, 521)
  assert.equal(Object.keys(source.source).length, 114)
  const sourceBinding = get('candidate-source-binding.json')
  const sixSources = Object.entries(sourceBinding.sourceBinding).map(([file, claim]) => {
    const copied = read(`${evidence}/frozen-source/${file}`)
    const actual = { bytes: copied.length, sha256: sha(copied) }
    const dirtySourceHash = source.source[`packages/dsh-pm-tool/${file}`] ?? null
    return { file, actual, complete: complete[file], declared: claim.declared,
      dirtySourceHash, equal: isDeepStrictEqual(actual, complete[file])
        && isDeepStrictEqual(actual, claim.declared)
        && isDeepStrictEqual(actual, { bytes: claim.bytes, sha256: claim.sha256 })
        && (dirtySourceHash === null || dirtySourceHash === actual.sha256) }
  })
  assert.equal(sixSources.length, 6)
  assert(sixSources.every(row => row.equal))
  const host = get('host-start.json')
  assert.equal(host.pid, 98161)
  assert.equal(host.port, 3266)
  assert.equal(host.candidateSha256, inputs[`${evidence}/original114-candidate.json`].sha256)
  assert.equal(host.sourceSha256, inputs[`${evidence}/original114-source-files.json`].sha256)
  assert.equal(host.bundleSha256, built['client.js'].sha256)
  assert.equal(host.flags.DSH_PM_E2E, '0')

  // The host concatenation strips each local map comment and adds a separator.
  const script = read(`${evidence}/browser-script-3.js`).toString('utf8')
  const matches = [...script.matchAll(/window\.__ModuleLoader__\.load\(\{\s*id: "dsh-pm-tool"/g)]
  assert.equal(matches.length, 1)
  const start = matches[0].index
  const end = script.indexOf('window.__ModuleLoader__.load', start + 1)
  assert(end > start && script.slice(end - 2, end) === ';\n')
  const segment = script.slice(start, end - 2)
  const reconstructed = Buffer.from(segment + '//# sourceMappingURL=client.js.map')
  const reconstructedBinding = { bytes: reconstructed.length, sha256: sha(reconstructed) }
  assert(isDeepStrictEqual(reconstructedBinding, built['client.js']))
  const browserBinding = {
    script: 'browser-script-3.js', startCharacter: start, endCharacter: end,
    excludedHostSeparator: ';\\n', restoredNonExecutableComment: '//# sourceMappingURL=client.js.map',
    reconstructedBinding, builtClient: built['client.js'],
    sourceMapMetadata: built['client.js.map'], sourceMapBytesProvided: false,
    scope: 'Exact reconstructed client.js bytes; not all five host scripts or full build inputs',
  }
  const rawNames = Object.keys(index).filter(n => n.endsWith(
    '-raw/data/pmtool/habits/habit-qa-history-20261021.json'
  ))
  const raw = rawNames.map(name => {
    const bytes = read(`${evidence}/${name}`)
    const record = JSON.parse(bytes).record
    return { name, bytes: bytes.length, sha256: sha(bytes),
      recordEqualOriginal: isDeepStrictEqual(record, originalFixture.habit),
      checkInCount: record.checkIns.length }
  })
  assert(raw.every(row => row.recordEqualOriginal && row.checkInCount === 14))
  assert.equal(raw.length, 11)
  assert.equal(new Set(raw.map(row => row.sha256)).size, 1)
  const roots = Object.keys(index).filter(n => n.endsWith('-roots.json'))
    .map(name => ({ name, values: get(name) }))
  const historyRoots = roots.filter(row => Object.keys(row.values).length === 3)
  assert.equal(historyRoots.length, 11)
  assert(historyRoots.every(row => isDeepStrictEqual(row.values, historyRoots[0].values)))
  const protectedBefore = read(`${evidence}/protected-F5-before.json`)
  const protectedAfter = read(`${evidence}/protected-F5-after.json`)
  assert(protectedBefore.equals(protectedAfter))
  const stateNames = [
    'round11-before', 'round11-all-expanded', 'round11-august-visible',
    'round11-all-collapsed', 'round11-after-refresh', 'round12-reload-history',
    'round12-left-history', 'round12-reentry-history',
  ]
  const states = stateNames.map(name => {
    const value = get(name + '.json')
    return { name, at: value.at, origin: value.origin, timeOrigin: value.timeOrigin,
      viewport: value.viewport, monthButtons: value.buttons.filter(b => /2026 年 \d+ 月/.test(b.text)),
      historyPresent: value.text.includes('QA 合法历史档案') }
  })
  assert(states.every(s => s.origin === 'http://127.0.0.1:3266'))
  assert.notEqual(states[0].timeOrigin, states[5].timeOrigin)
  const monthStates = [11, 12].map(round => get(`round${round}-month-states.json`))
  assert(monthStates.every(rows => rows.length === 3 && rows.every(r => r.expanded === 'false')))
  const eventSummaries = [11, 12].map(round => {
    const name = `round${round}-events.json`
    const value = get(name)
    for (const frame of value.frames) assert.equal(index[frame.file].sha256, frame.sha256)
    const response = value.rows.find(row => row.type === 'response')
    const snapshot = JSON.parse(response.body.result.value.result.text)
    assert(isDeepStrictEqual(snapshot.habits[0], originalFixture.habit))
    return { name, frames: value.frames, rows: value.rows.map(row => ({
      type: row.type, at: row.at, rpcId: row.body?.rpcId,
      line: row.body?.payload?.args?.line, status: row.status,
    })), snapshotHabitEqualOriginal: true }
  })
  write(corrected ? '-audit-r2.json' : '-audit.json', {
    at: new Date().toISOString(), role: '独立只读 GUI 审证，非执行/开发',
    environment: { platform: process.platform, node: process.version, pnpmExecuted: false },
    indexCount: indexRows.length, seal, indexRows, fixtureIndexEntry,
    originalFixtureFingerprint: fixtureActual,
    candidate, copiedMetadata, inputCount: Object.keys(complete).length,
    sourceCount: Object.keys(source.source).length, builtMetadataCount: Object.keys(built).length,
    sixSources, browserBinding, raw, historyRoots,
    f5Protection: { bytes: protectedBefore.length, sha256: sha(protectedBefore), differences: 0 },
    states, monthStates, eventSummaries, receipts: get('execution-receipts.json'),
    coverageLimits: [
      '仅六份源码副本实核；114/521/455余项仅封存清单，不跟读privatefreeze',
      '未提供sourceMap字节，不把map元数据或五script存在视为全链一致',
      '记录/封存截图审证，不执行GUI；DOM只作辅助，目视由独立专家另记',
      '不签旧10/21日期窗、组合、原完整F7、父commit或发布',
    ],
    inputs,
  })
  console.log(JSON.stringify({ capture: '一致性核对完成，非自动GUI判定',
    sealedFiles: indexRows.length, sixSources: sixSources.length,
    rawHistoryCopies: raw.length, reconstructedClientSha256: reconstructedBinding.sha256 }))
} else if (process.argv[2] === 'seal') {
  const audit = json(prefix + '-audit-r2.json')
  const drift = []
  for (const [rel, expected] of Object.entries(audit.inputs)) {
    read(rel)
    if (!isDeepStrictEqual(inputs[rel], expected)) drift.push(rel)
  }
  const ownedNames = ['-reader.mjs', '-audit.json', '-audit-r2.json', '-report.md', '-verdict.json']
  const formatProblems = []
  for (const suffix of ownedNames) {
    const rel = prefix + suffix
    const text = read(rel).toString('utf8')
    if (!text.endsWith('\n') || /[ \t]+\r?$/m.test(text)) formatProblems.push(rel)
  }
  assert.equal(drift.length, 0)
  assert.equal(formatProblems.length, 0)
  write('-seal.json', { at: new Date().toISOString(), status: 'SEALED_STOP',
    declaredInputCount: Object.keys(audit.inputs).length, drift, formatProblems,
    owned: Object.fromEntries(ownedNames.map(suffix => [prefix + suffix, inputs[prefix + suffix]])),
    verdictAuthority: '独立专家verdict；seal仅签输入未漂移及自有输出',
    commands: ['node --check 本reader: exit0',
      '首次capture: exit1，错用旧A0索引；第二次capture: exit0，root零项核对无效，原audit保留',
      'node 本reader capture-r2: exit0，11份三项root逐值全等',
      'Swift原帧联系表初次终码未收，repeat: exit0，不覆盖首输出',
      'node 本reader seal: exit0'],
    resources: { guiOwned: false, builderOwned: false, serviceOwned: false,
      childProcessesPending: false, stop: true } })
  console.log(JSON.stringify({ seal: 'SEALED_STOP', drift: 0, files: ownedNames.length }))
} else {
  throw new Error('Use capture or seal; no product imports or GUI actions permitted')
}

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a14-sidecar-minimize-contract-20261022'
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const output = join(repo, 'docs/testing', `${prefix}-final-${round}.json`)
assert(!existsSync(output), '禁止覆盖；选新rN')
const root = join(repo, 'docs/testing', `${prefix}-selftmp/r3`)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const candidate = json(join(root, 'candidate.json'))
const summary = json(join(root, 'summary.json'))
const evidence = join(repo, 'reports/all-pending-evidence-20261021/A14/governance/mixed-r4')
const a12 = '/private/tmp/pmtool-a12-closure-20261021'
const checks = []
function check(name, ok, details) {
  checks.push({ name, ok, details })
}
const declaredDrift = Object.entries(candidate.declaredA12).filter(([path, expected]) =>
  !existsSync(join(a12, path)) || hash(readFileSync(join(a12, path))) !== expected).map(([path]) => path)
check('A12-512-source-453-artifact-unchanged', declaredDrift.length === 0, declaredDrift)
const inputDrift = Object.entries(candidate.inputsBefore).filter(([path, expected]) =>
  !existsSync(path) || hash(readFileSync(path)) !== expected).map(([path]) => path)
check('r3-inputs-unchanged', inputDrift.length === 0, inputDrift)
const mainRelevant = candidate.mainRelevant.map(row => ({
  ...row, current: hash(readFileSync(join(repo, row.path))),
}))
check('main-relevant-source-still-matches-A12', mainRelevant.every(row => row.current === row.a12), mainRelevant)
const currentEvidenceFiles = []
function walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)
    const st = lstatSync(path)
    if (st.isDirectory()) walk(path)
    else if (st.isFile()) currentEvidenceFiles.push(relative(evidence, path))
  }
}
walk(evidence)
const evidenceDrift = Object.entries(candidate.evidenceBefore).filter(([path, entry]) =>
  !existsSync(join(evidence, path)) || hash(readFileSync(join(evidence, path))) !== entry.sha256).map(([path]) => path)
const addedEvidence = currentEvidenceFiles.filter(path => !(path in candidate.evidenceBefore))
check('original-198-files-unchanged-no-additions', evidenceDrift.length === 0 && addedEvidence.length === 0,
  { evidenceDrift, addedEvidence, files: currentEvidenceFiles.length })
check('r3-all-nine-watched-drift-lists-empty',
  Object.entries(summary.audit).filter(([key]) => key !== 'boundary').every(([, value]) => value.length === 0), summary.audit)
const exits = Object.fromEntries(summary.executions.map(x => [x.label, x.originalExit]))
check('base-green-three-contract-red-original-exits', JSON.stringify(exits) === JSON.stringify({
  base: 0, 'undo-red': 1, 'form-red': 1, 'draft-red': 1,
}), exits)
const observations = readFileSync(join(root, 'observations.jsonl'), 'utf8').trim().split('\n').map(JSON.parse)
const formPayload = observations.find(row => row.id === 'task-form-payload').data.payload
const originalRun = json(join(evidence, 'finish/command-events.json')).find(row => row.event.seq === 29).event
const originalPayload = JSON.parse(originalRun.data.args.trim().slice('task update t-0001 '.length))
check('real-TaskForm-payload-equals-original-GUI-payload',
  JSON.stringify(formPayload) === JSON.stringify(originalPayload), formPayload)
const forbiddenUndo = observations.filter(row => row.id === 'transport'
  && row.data.line.startsWith('ask-undo') && row.data.line !== 'ask-undo list')
check('self-tests-never-executed-undo', forbiddenUndo.length === 0, forbiddenUndo)

const gateway = join(repo, 'reports/all-pending-evidence-20261021/A13/gateway')
const loaded = json(join(gateway, 'loaded-r1/result.json'))
const source = readFileSync(join(a12, 'packages/dsh-pm-tool/lib/client.js'))
const normalized = source.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
  .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
const response = readFileSync(join(gateway, 'loaded-r1/combo-1.txt'))
const event = loaded.events[0]
const match = event.matches[0]
const first = response.indexOf(segment)
const appliedObservation = json(join(evidence, 'applied.json'))
check('before-mixed-uncached-full-unique-client-binding', loaded.events.length === 1
  && event.status === 200 && event.fromDiskCache === false
  && hash(response) === event.responseSha && response.length === event.bytes
  && first === match.first && first >= 0 && response.indexOf(segment, first + 1) === -1
  && segment.length === match.segmentBytes && hash(segment) === match.segmentSha
  && hash(source) === match.sourceSha && match.uniqueComplete
  && loaded.browserContextKind === 'default' && loaded.targetId === event.frameId
  && loaded.state.origin === appliedObservation.origin && loaded.state.timeOrigin === appliedObservation.timeOrigin
  && Date.parse(loaded.at) < Date.parse(appliedObservation.at), {
    loadedAt: loaded.at, responseSha256: hash(response), responseBytes: response.length,
    clientSha256: hash(source), segmentSha256: hash(segment), segmentBytes: segment.length,
    target: loaded.targetId, timeOrigin: loaded.state.timeOrigin,
    boundary: '只认领本轮mixed前原下发；不倒推更早clean首页面或长期存活',
  })
const docs = [join(repo, 'docs/testing', `${prefix}-plan.md`), join(repo, 'docs/testing', `${prefix}.md`)]
for (const path of docs) {
  const text = readFileSync(path, 'utf8')
  const links = [...text.matchAll(/\]\(([^)]+)\)/g)].map(x => x[1]).filter(x => !x.startsWith('http'))
  const missing = links.filter(link => {
    const target = resolve(dirname(path), link.split('#')[0])
    return target !== output && !existsSync(target)
  })
  const trailing = text.split('\n').map((s, i) => ({ s, line: i + 1 })).filter(x => /[ \t]+$/.test(x.s))
  check(`markdown-${relative(repo, path)}`, missing.length === 0 && trailing.length === 0 && text.endsWith('\n'),
    { links: links.length, missing, trailingLines: trailing.map(x => x.line) })
}
const files = [`${prefix}-plan.md`, `${prefix}-cases.test.tsx`, `${prefix}-run.mjs`, `${prefix}.md`, `${prefix}-finalize.mjs`]
const ownHashes = Object.fromEntries(files.map(path => [path, hash(readFileSync(join(repo, 'docs/testing', path)))]))
const result = {
  at: new Date().toISOString(), role: '独立限定审证', checks, ownHashes,
  originalExits: json(join(root, 'evidence-audit.json')).originalExits,
  candidate: { baseline: candidate.baseline, trackedPatchSha: candidate.trackedPatchSha,
    manifestSha256: candidate.manifestSha256 },
  released: true, noGuiBuildInstallServiceCredentialsUndoCommit: true,
  completeRAAI04Signed: false, productDefect: 'SM-01 FAIL', originalRunnerExit: 1,
  finalAuditExit: checks.every(x => x.ok) ? 0 : 1,
}
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ output: relative(repo, output), checks: checks.length,
  failed: checks.filter(x => !x.ok), finalAuditExit: result.finalAuditExit }))
process.exitCode = result.finalAuditExit

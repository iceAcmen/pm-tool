import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a15-file-fault-gui-review-20261022')
const reports = join(repo, 'reports/all-pending-evidence-20261021')
const root = join(reports, 'A15/file-fault')
const loadedRoot = join(reports, 'A14/fresh-file-supplement/loaded')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const read = name => json(join(root, name))
const lines = name => readFileSync(join(root, name), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
const fingerprint = path => {
  const stat = lstatSync(path)
  if (!stat.isFile()) throw new Error(`Not a regular input: ${path}`)
  const bytes = readFileSync(path)
  return { bytes: bytes.length, sha256: sha(bytes), mtimeMs: stat.mtimeMs }
}
const scan = (path, result = {}) => {
  const stat = lstatSync(path)
  if (stat.isDirectory()) {
    for (const name of readdirSync(path).sort()) scan(join(path, name), result)
  } else result[path] = fingerprint(path)
  return result
}
const diff = (before, after) => ({
  added: Object.keys(after).filter(k => !(k in before)).sort(),
  removed: Object.keys(before).filter(k => !(k in after)).sort(),
  changed: Object.keys(before).filter(k => k in after && JSON.stringify(before[k]) !== JSON.stringify(after[k])).sort(),
})
const rootDiff = (before, after) => Object.fromEntries(
  ['data', 'files', 'backups'].map(k => [k, diff(before[k], after[k])]),
)
const empty = d => Object.values(d).every(x => Object.values(x).every(a => a.length === 0))
const candidates = {
  A13: json(join(reports, 'A13/candidate-final.json')),
  A14: json(join(reports, 'A14/candidate.json')),
}
const inputRoots = [
  root, loadedRoot, join(reports, 'A13/final/main/fresh-files'),
  join(reports, 'A14/fresh-file-supplement/download'),
  join(reports, 'A14/fresh-file-supplement/headers'),
]
const fixedInputs = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/testing/remaining-journey-cases-20261021.md',
  'docs/testing/a14-fresh-file-gui-review-20261022.md',
  'docs/testing/a14-fresh-file-gui-review-20261022-audit.mjs',
  'docs/testing/a14-three-supplements-gui-review-20261022.md',
  'docs/testing/a14-three-supplements-gui-review-20261022-plan.md',
  'reports/all-pending-evidence-20261021/A13/candidate-final.json',
  'reports/all-pending-evidence-20261021/A13/product-tracked.patch',
  'reports/all-pending-evidence-20261021/A13/environment-final.json',
  'reports/all-pending-evidence-20261021/A14/candidate.json',
  'reports/all-pending-evidence-20261021/A14/product-tracked.patch',
].map(p => join(repo, p))
fixedInputs.push('/private/tmp/pmtool-a11-native-files/QA 文件 原件.md')
fixedInputs.push('/private/tmp/pmtool-a13-final-gui-20261022.mjs')
const auditPath = `${prefix}-audit${process.argv.includes('r2') ? '-r2' : ''}.json`
const capture = () => {
  const result = {}
  for (const path of inputRoots) scan(path, result)
  for (const path of fixedInputs) result[path] = fingerprint(path)
  for (const c of Object.values(candidates)) {
    for (const name of new Set([...Object.keys(c.sourceHashes), ...Object.keys(c.artifacts)])) {
      result[join(c.tree, name)] = fingerprint(join(c.tree, name))
    }
  }
  return result
}
const beforeProtection = capture()
const verify = (c, expected) => {
  const records = Object.fromEntries(Object.entries(expected).map(([name, expectedSha]) => {
    const actual = beforeProtection[join(c.tree, name)]
    return [name, { expectedSha, ...actual, match: actual?.sha256 === expectedSha }]
  }))
  return { count: Object.keys(records).length, mismatches: Object.keys(records).filter(k => !records[k].match), records }
}
const candidateChecks = Object.fromEntries(Object.entries(candidates).map(([name, c]) => [name, {
  tree: c.tree, baseline: c.baseline, hostGitHead: c.hostGitHead,
  source: verify(c, c.sourceHashes), artifacts: verify(c, c.artifacts),
}]))
const client = readFileSync(join(candidates.A13.tree, 'packages/dsh-pm-tool/lib/client.js'))
const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
  .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
const loaded = json(join(loadedRoot, 'result.json'))
const response = readFileSync(join(loadedRoot, loaded.events[0].file))
const offset = response.indexOf(segment)
const loader = {
  loaded, client: { bytes: client.length, sha256: sha(client) },
  response: { bytes: response.length, sha256: sha(response) },
  segment: { bytes: segment.length, sha256: sha(segment), first: offset,
    second: offset < 0 ? -1 : response.indexOf(segment, offset + 1) },
}
const evidence = Object.fromEntries(Object.entries(scan(root)).map(([p, v]) => [p.slice(root.length + 1), v]))
const index = read('index.json')
const indexMismatches = Object.entries(index).filter(([p, v]) =>
  evidence[p]?.sha256 !== v.sha256 || evidence[p]?.bytes !== v.bytes).map(([p]) => p)
const indexUnlisted = Object.keys(evidence).filter(p => p !== 'index.json' && !(p in index))
const frames = read('frames/frames.json').frames.map(f => ({
  ...f, actual: evidence[`frames/${f.file}`],
  match: evidence[`frames/${f.file}`]?.sha256 === f.sha256,
}))
const states = Object.fromEntries(Object.keys(evidence).filter(n =>
  n.endsWith('.json') && !n.includes('/') && !n.endsWith('-roots.json'))
  .map(n => [n, read(n)]).filter(([, x]) => x.timeOrigin !== undefined)
  .map(([n, x]) => [n, {
    at: x.at, origin: x.origin, timeOrigin: x.timeOrigin, viewport: x.viewport, dark: x.dark,
    pmBox: Object.fromEntries(Object.entries(x.pm).filter(([k]) => k !== 'text')),
    title: x.fields.find(f => f.name === 'title')?.value,
    fileInputs: x.fields.filter(f => f.type === 'file'), alerts: x.alerts,
    buttons: x.buttons.filter(b => /上传|添加任务|保存更改|取消|放弃/.test(b.text)),
    focus: x.focus, tail: x.pm.text.slice(-1400),
  }]))
const lifecycle = {
  abort: rootDiff(read('before-abort.json'), read('abort-closed-roots.json')),
  abortRelease: rootDiff(read('before-abort.json'), read('abort-release-roots.json')),
  failure: rootDiff(read('before-retry.json'), read('failed-input-retained-roots.json')),
  staged: rootDiff(read('before-retry.json'), read('retry-staged-roots.json')),
  saved: rootDiff(read('before-retry.json'), read('retry-after-submit-roots.json')),
  stagedToSaved: rootDiff(read('retry-staged-roots.json'), read('retry-after-submit-roots.json')),
  savedToReopen: rootDiff(read('retry-after-submit-roots.json'), read('retry-reopened-corrected-roots.json')),
  savedToEnd: rootDiff(read('retry-after-submit-roots.json'), read('end.json').roots),
}
const observations = read('observations.json')
const observationPairs = {
  abortBeforeToClosed: 'abort', retryBeforeToFailure: 'failure', retryBeforeToStaged: 'staged',
  retryBeforeToSaved: 'saved', savedToActualReopened: 'savedToReopen',
}
const observationMatches = Object.fromEntries(Object.entries(observationPairs).map(([name, key]) =>
  [name, ['data', 'files', 'backups'].every(k => ['added', 'removed', 'changed'].every(t =>
    JSON.stringify(observations[name][k][t].map(x => '/' + x)) === JSON.stringify(lifecycle[key][k][t])))]))
const commands = lines('commands.ndjson')
const taskRuns = commands.filter(x => x.event.type === 'command/run' && x.event.data.args.startsWith(' task add '))
  .map(x => ({ ...x, payload: JSON.parse(x.event.data.args.slice(' task add '.length)) }))
const task = read('raw/tasks/t-0002.json').record
const asset = read('raw/file_assets/fa-0001.json').record
const rawMatchesEnd = Object.fromEntries(['tasks/t-0001.json', 'tasks/t-0002.json', 'projects/p-0001.json', 'file_assets/fa-0001.json']
  .map(p => [p, evidence[`raw/${p}`].sha256 === read('end.json').roots.data[`/pmtool/${p}`]]))
const faults = lines('faults.ndjson')
const responses = lines('responses.ndjson')
const consoleRows = lines('console.ndjson')
const actualSourceFile = fingerprint('/private/tmp/pmtool-a11-native-files/QA 文件 原件.md')
const archivedDownload = fingerprint(join(reports, 'A13/final/main/fresh-files/finish/QA 文件 原件.md'))
const inspected = [
  'held-busy.png', 'failed-input-retained.png', 'retry-staged.png', 'retry-reopened-corrected.png',
  'abort-picker/chooser.png', 'abort-picker/chooser-corrected.png',
  'failure-picker/chooser.png', 'retry-picker/chooser.png',
  'retry-reopened.png', 'retry-main-saved.png', 'abort-closed.png', 'new-1792623296611.png',
  ...['000071', '000074', '000075', '000119', '000127', '000141', '000159', '000160'].map(n => `frames/${n}.jpg`),
].map(path => ({ path, ...evidence[path] }))
const assertions = {
  frozenA13: candidateChecks.A13.source.mismatches.length === 0 && candidateChecks.A13.artifacts.mismatches.length === 0,
  protectedA14: candidateChecks.A14.source.mismatches.length === 0 && candidateChecks.A14.artifacts.mismatches.length === 0,
  completeUniqueLoader: offset >= 0 && loader.segment.second === -1
    && sha(response) === loaded.events[0].responseSha && sha(client) === loaded.events[0].matches[0].sourceSha
    && loaded.events[0].status === 200 && loaded.events[0].fromDiskCache === false,
  sameNewPage: Object.values(states).every(s => s.timeOrigin === loaded.state.timeOrigin && s.origin === loaded.state.origin)
    && read('ready.json').target === loaded.targetId,
  index: indexMismatches.length === 0 && indexUnlisted.length === 0,
  frames: frames.every(f => f.match),
  observations: Object.values(observationMatches).every(Boolean),
  abortZero: empty(lifecycle.abort) && empty(lifecycle.abortRelease),
  failureZero: empty(lifecycle.failure),
  stagedOnly: lifecycle.staged.files.added.length === 2 && lifecycle.staged.files.added.every(p => p.includes('/staging/'))
    && empty({ data: lifecycle.staged.data, backups: lifecycle.staged.backups }),
  saveOneTask: lifecycle.saved.data.added.length === 1 && lifecycle.saved.data.added[0] === '/pmtool/tasks/t-0002.json'
    && lifecycle.saved.data.changed.length === 1 && lifecycle.saved.data.changed[0].startsWith('/session_projcache/')
    && lifecycle.saved.data.removed.length === 0 && empty({ files: lifecycle.saved.files, backups: lifecycle.saved.backups }),
  stageRemoved: lifecycle.stagedToSaved.files.removed.length === 2
    && lifecycle.stagedToSaved.files.added.length === 0 && lifecycle.stagedToSaved.files.changed.length === 0,
  taskCommand: taskRuns.length === 1 && taskRuns[0].payload.draft.attachmentOps.length === 1
    && commands.some(x => x.event.type === 'command/done' && x.event.data.commandId === taskRuns[0].event.data.commandId
      && x.event.data.kind === 'success'),
  oneSharedAsset: task.attachments.length === 1 && task.attachments[0].assetId === asset.id && asset.id === 'fa-0001',
  raw: Object.values(rawMatchesEnd).every(Boolean) && JSON.stringify(task) === JSON.stringify(read('saved-task.json')),
  sourceBytes: actualSourceFile.bytes === 22 && actualSourceFile.sha256 === asset.sha256
    && archivedDownload.bytes === 22 && archivedDownload.sha256 === asset.sha256
    && read('end.json').roots.files['/' + asset.relPath] === asset.sha256,
  realUploadOnlyOnRetry: responses.length === 1 && responses[0].status === 201
    && faults.filter(x => x.mode).map(x => x.mode).join(',') === 'hold,fail,pass',
  cancelledNotLate201: faults.some(x => x.releaseAfterMs === 31528)
    && faults.some(x => x.releaseError?.includes('Invalid InterceptionId')),
  genuineReentry: states['retry-reopened-corrected.json'].title === task.title
    && states['retry-reopened-corrected.json'].tail.includes('文件 fa-0001')
    && !states['retry-reopened.json'].title && empty(lifecycle.savedToReopen),
  limitedConsole: consoleRows.length === 1 && consoleRows[0].text.includes('ERR_CONNECTION_FAILED'),
}
const afterProtection = capture()
const protectionDiff = diff(beforeProtection, afterProtection)
assertions.protection = Object.values(protectionDiff).every(a => a.length === 0)
const result = {
  at: new Date().toISOString(), environment: { os: process.platform, arch: process.arch, node: process.version, cwd: process.cwd() },
  boundary: 'Independent read-only evidence audit; no product import/test/build/install/GUI/services/credentials/commit. Assertions are evidence checks, not whole-gate GUI PASS.',
  candidateChecks, loader, evidence, indexMismatches, indexUnlisted,
  frames: { count: frames.length, mismatches: frames.filter(f => !f.match), records: frames },
  states, lifecycle, observations, observationMatches, commands: { rows: commands, taskRuns },
  faults, responses, console: consoleRows, task, asset, actualSourceFile, archivedDownload, rawMatchesEnd,
  visual: { boundary: 'Only listed original paths inspected with view_image; no live GUI or all-frame visual claim.', inspected,
    pngCount: inspected.filter(x => x.path.endsWith('.png')).length,
    jpgCount: inspected.filter(x => x.path.endsWith('.jpg')).length,
    uniquePng: new Set(inspected.filter(x => x.path.endsWith('.png')).map(x => x.sha256)).size,
    uniqueJpg: new Set(inspected.filter(x => x.path.endsWith('.jpg')).map(x => x.sha256)).size },
  collector: { ready: read('ready.json'), end: read('end.json'), exit: read('collector-exit.json') },
  failures: [read('failure-1792623408600.json'), read('failure-1792623466564.json')],
  protection: { inputRoots, fixedInputs, before: beforeProtection, after: afterProtection, diff: protectionDiff },
  assertions,
}
if (process.argv[2] === 'seal') {
  const previous = json(auditPath)
  const sealDiff = diff(previous.protection.before, afterProtection)
  const initial = json(`${prefix}-audit.json`).protection.before
  const initialOverlapDiff = diff(initial, Object.fromEntries(Object.keys(initial).map(p => [p, afterProtection[p]])))
  const ownFiles = Object.fromEntries(readdirSync(dirname(prefix)).filter(n => n.startsWith('a15-file-fault-gui-review-20261022'))
    .map(n => [n, fingerprint(join(dirname(prefix), n))]))
  const seal = { at: result.at, assertions, protectedCount: Object.keys(afterProtection).length,
    drift: sealDiff, initialOverlapDiff, ownFiles, evidenceCount: Object.keys(evidence).length }
  writeFileSync(`${prefix}-seal.json`, JSON.stringify(seal, null, 2) + '\n')
  console.log(JSON.stringify(seal, null, 2))
  if (Object.values(sealDiff).some(a => a.length) || Object.values(initialOverlapDiff).some(a => a.length)
    || Object.values(assertions).some(x => !x)) process.exitCode = 1
} else {
  writeFileSync(auditPath, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify({
    assertions, protectedCount: Object.keys(beforeProtection).length, evidenceCount: Object.keys(evidence).length,
    indexCount: Object.keys(index).length, frames: frames.length,
    sourceCounts: Object.fromEntries(Object.entries(candidateChecks).map(([n, c]) => [n, [c.source.count, c.artifacts.count]])),
    lifecycle, loader: { ...loader, loaded: undefined }, protectionDiff,
  }, null, 2))
  if (Object.values(assertions).some(x => !x)) process.exitCode = 1
}

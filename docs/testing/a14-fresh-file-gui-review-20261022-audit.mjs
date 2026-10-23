import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a14-fresh-file-gui-review-20261022')
const a13 = join(repo, 'reports/all-pending-evidence-20261021/A13')
const fresh = join(a13, 'final/main/fresh-files')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const lines = path => readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
const file = path => {
  const stat = lstatSync(path)
  if (!stat.isFile()) throw new Error(`Not a regular file: ${path}`)
  const bytes = readFileSync(path)
  return { bytes: bytes.length, sha256: sha(bytes) }
}
const scan = (root, relative = '') => {
  const result = {}
  for (const name of readdirSync(join(root, relative)).sort()) {
    const rel = relative ? `${relative}/${name}` : name
    const stat = lstatSync(join(root, rel))
    if (stat.isDirectory()) Object.assign(result, scan(root, rel))
    else result[rel] = file(join(root, rel))
  }
  return result
}
const diff = (before, after) => ({
  added: Object.keys(after).filter(k => !(k in before)).sort(),
  removed: Object.keys(before).filter(k => !(k in after)).sort(),
  changed: Object.keys(before).filter(k => k in after && before[k] !== after[k]).sort(),
})
const rootDiff = (before, after) => Object.fromEntries(
  ['data', 'files', 'backups'].map(k => [k, diff(before[k], after[k])]),
)
const verify = (root, expected) => {
  const records = Object.fromEntries(Object.entries(expected).map(([name, hash]) => {
    const path = join(root, name)
    const actual = existsSync(path) ? file(path) : null
    return [name, { expected: hash, ...actual, match: actual?.sha256 === hash }]
  }))
  return { count: Object.keys(records).length, mismatches: Object.keys(records).filter(k => !records[k].match), records }
}
const candidate = json(join(a13, 'candidate-final.json'))
const source = verify(candidate.tree, candidate.sourceHashes)
const artifacts = verify(candidate.tree, candidate.artifacts)
const currentMain = verify(repo, candidate.sourceHashes)
const originalEvidence = scan(fresh)
const before = json(join(fresh, 'before-cancel-stage.roots.json'))
const staged = json(join(fresh, 'staged-cancel.roots.json'))
const cancelled = json(join(fresh, 'after-cancel.roots.json'))
const preSave = json(join(fresh, 'save/before.roots.json'))
const saved = json(join(fresh, 'save/saved.roots.json'))
const finish = json(join(fresh, 'finish/result.json'))
const end = json(join(fresh, 'collector/end.json'))
const commandRows = lines(join(fresh, 'collector/commands.ndjson'))
const taskRuns = commandRows.filter(x => x.event.type === 'command/run' && x.event.data.args.startsWith(' task add '))
const runs = taskRuns.map(x => ({ ...x, payload: JSON.parse(x.event.data.args.slice(' task add '.length)) }))
const saveTask = json(join(fresh, 'save/saved-task.json'))
const finishTask = json(join(fresh, 'finish/saved-task.json'))
const asset = json(join(fresh, 'finish/fa-0001.json'))
const stages = ['3c26d4815d87165255d8fa2e63bbc6c0', 'f3d060ff48ed66c8316080f4099948c6']
  .map(id => ({ id, ...json(join(fresh, `save/stage-${id}.json`)) }))
const sourceFiles = Object.fromEntries(['QA 文件 原件.md', 'QA 文件 同字节.md'].map(name => {
  const path = join('/private/tmp/pmtool-a11-native-files', name)
  return [path, file(path)]
}))
const downloaded = file(join(fresh, 'finish', finish.download.file))
const frames = Object.fromEntries(['collector', 'save'].map(name => {
  const manifest = json(join(fresh, `${name}/frames/frames.json`))
  const verified = manifest.frames.map(frame => {
    const actual = file(join(fresh, name, 'frames', frame.file))
    return { file: frame.file, timestamp: frame.metadata.timestamp, recordedAt: frame.at,
      expected: frame.sha256, ...actual, match: actual.sha256 === frame.sha256 }
  })
  const times = name === 'collector'
    ? [1792620801, 1792620822, 1792620858, 1792620888, 1792620894, 1792620913, 1792620993, 1792621036, 1792621064, 1792621116]
    : [1792621063.5, 1792621063.85, 1792621064.1]
  return [name, {
    count: verified.length,
    mismatches: verified.filter(x => !x.match),
    first: verified[0], last: verified.at(-1),
    nearest: times.map(t => ({ requested: t, ...verified.reduce((best, x) =>
      Math.abs(x.timestamp - t) < Math.abs(best.timestamp - t) ? x : best) })),
    records: verified,
  }]
}))
const result = {
  at: new Date().toISOString(), environment: { os: process.platform, arch: process.arch, node: process.version, cwd: process.cwd() },
  boundary: 'Read-only source/artifact/original-evidence/owned-fixture audit; no product tests, build, install, GUI, services, credentials or commit.',
  candidate: { baseline: candidate.baseline, hostGitHead: candidate.hostGitHead, tree: candidate.tree,
    trackedPatchSha: candidate.trackedPatchSha, source, artifacts, currentMain,
    candidateFile: file(join(a13, 'candidate-final.json')),
    productPatchFile: file(join(a13, 'product-tracked.patch')),
    environment: json(join(a13, 'environment-final.json')) },
  evidenceFiles: originalEvidence,
  frames,
  lifecycle: { cancelled: rootDiff(before, cancelled), staged: rootDiff(before, staged),
    saved: rootDiff(preSave, saved), saveToFinish: rootDiff(saved, finish.roots),
    finishToEnd: rootDiff(finish.roots, end.roots) },
  requests: lines(join(fresh, 'collector/requests.ndjson')),
  responses: lines(join(fresh, 'collector/responses.ndjson')),
  bodyErrors: lines(join(fresh, 'collector/errors.ndjson')),
  commands: { rows: commandRows.length, taskRuns: runs, taskDone: commandRows.filter(x =>
    x.event.type === 'command/done' && taskRuns.some(r => r.event.data.commandId === x.event.data.commandId)) },
  saved: { taskIdentical: JSON.stringify(saveTask) === JSON.stringify(finishTask),
    snapshotIdentical: JSON.stringify(finishTask) === JSON.stringify(finish.task),
    task: finishTask, asset, stages },
  sourceFiles, downloaded, anonymous: finish.anonymous, downloadResponses: finish.responses,
  infrastructure: { saveExit: json(join(fresh, 'save/exit.json')), finishExit: finish.exit,
    ready: json(join(fresh, 'collector/ready.json')), end },
}
if (process.argv[2] === 'seal') {
  const previous = json(`${prefix}-audit.json`)
  const now = scan(fresh)
  const evidenceDiff = diff(
    Object.fromEntries(Object.entries(previous.evidenceFiles).map(([k, v]) => [k, v.sha256])),
    Object.fromEntries(Object.entries(now).map(([k, v]) => [k, v.sha256])),
  )
  const output = { at: result.at, sourceMismatches: source.mismatches, artifactMismatches: artifacts.mismatches,
    evidenceDiff, auditSha: file(`${prefix}-audit.json`), reportSha: file(`${prefix}.md`),
    scriptSha: file(fileURLToPath(import.meta.url)) }
  writeFileSync(`${prefix}-seal.json`, `${JSON.stringify(output, null, 2)}\n`)
  console.log(JSON.stringify(output, null, 2))
} else {
  writeFileSync(`${prefix}-audit.json`, `${JSON.stringify(result, null, 2)}\n`)
  console.log(JSON.stringify({
    sourceCount: source.count, sourceMismatches: source.mismatches,
    artifactCount: artifacts.count, artifactMismatches: artifacts.mismatches,
    currentMainMismatches: currentMain.mismatches,
    evidenceCount: Object.keys(originalEvidence).length,
    frames: Object.fromEntries(Object.entries(frames).map(([k, v]) => [k, { count: v.count, mismatches: v.mismatches, nearest: v.nearest }])),
    lifecycle: result.lifecycle, sourceFiles, downloaded,
    taskRuns: runs.length, taskIdentical: result.saved.taskIdentical,
    downloadResponses: finish.responses, anonymous: finish.anonymous,
  }, null, 2))
}

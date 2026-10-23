import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, lstatSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual as eq } from 'node:util'

// Supplement audit reads immutable archives only; it never replays the collector.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const old = join(repo, 'docs/testing/a18-material-composition-gui-review-20261022')
const prefix = old + '-visible'
const a18 = join(repo, 'reports/all-pending-evidence-20261021/A18')
const root = join(a18, 'material-visible')
const step = join(root, 'reopen-1792634594109')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const fp = p => {
  if (!lstatSync(p).isFile()) throw Error(`Not a regular file: ${p}`)
  const b = readFileSync(p)
  return { bytes: b.length, sha256: sha(b) }
}
const scan = (p, out = {}) => {
  if (lstatSync(p).isDirectory()) for (const n of readdirSync(p).sort()) scan(join(p, n), out)
  else out[p] = fp(p)
  return out
}
const original = json(old + '-before.json')
const oldSeal = json(old + '-seal.json')
const capture = () => {
  const out = scan(root)
  for (const p of Object.keys(original.files)) out[p] = fp(p)
  for (const n of Object.keys(oldSeal.own)) out[join(dirname(old), n)] = fp(join(dirname(old), n))
  out[old + '-seal.json'] = fp(old + '-seal.json')
  return out
}
const delta = (a, b) => ({
  added: Object.keys(b).filter(k => !(k in a)).sort(),
  removed: Object.keys(a).filter(k => !(k in b)).sort(),
  changed: Object.keys(a).filter(k => k in b && !eq(a[k], b[k])).sort(),
})
const zero = d => Object.values(d).every(v => v.length === 0)
const output = (suffix, value) => writeFileSync(prefix + suffix,
  JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const mode = process.argv[2]
if (mode === 'freeze') {
  const files = capture()
  output('-before.json', { at: new Date().toISOString(), files,
    boundary: 'New visibility supplement, old sealed reports and old bounded inputs only; earlier actions read-only. No live data, A19 outputs, credentials or services.' })
  console.log(JSON.stringify({ mode, protectedFiles: Object.keys(files).length }))
} else if (mode === 'audit') {
  const checks = {}
  const check = (n, v) => { checks[n] = !!v }
  const index = json(join(root, 'index.json'))
  const listed = index.files.map(f => f.path).sort()
  const paths = Object.keys(scan(root)).map(p => p.slice(root.length + 1)).filter(p => p !== 'index.json').sort()
  const mismatches = index.files.filter(f => !eq(fp(join(root, f.path)), { bytes: f.bytes, sha256: f.sha256 }))
    .map(f => f.path)
  check('new43ExactSetSizeAndHashes', listed.length === 43 && new Set(listed).size === 43
    && eq(listed, paths) && !mismatches.length)
  check('oldReportAndFirstFailureAllSealedFilesUntouched', Object.entries(oldSeal.own).every(([n, f]) =>
    eq(fp(join(dirname(old), n)), f)) && json(old + '-audit.json').ok === false)
  const candidate = json(join(a18, 'candidate.json'))
  const current = capture()
  check('old1285ProtectedFilesStillMatch', Object.entries(original.files).every(([p, f]) => eq(f, current[p])))
  const sourceMismatch = Object.entries(candidate.sourceHashes)
    .filter(([p, h]) => fp(join(candidate.tree, p)).sha256 !== h).map(([p]) => p)
  const artifactMismatch = Object.entries(candidate.artifacts)
    .filter(([p, h]) => fp(join(candidate.tree, p)).sha256 !== h).map(([p]) => p)
  check('A18Frozen520Source453ArtifactsNoDrift', Object.keys(candidate.sourceHashes).length === 520
    && Object.keys(candidate.artifacts).length === 453 && !sourceMismatch.length && !artifactMismatch.length)
  const oldAudit = json(old + '-audit-r2.json')
  check('A18CandidateSameBinding', fp(join(a18, 'candidate.json')).sha256 === oldAudit.candidate.sourceSHA)
  const names = ['material-visible', 'progress-visible', 'history-open',
    'revision-1', 'revision-2', 'revision-3', 'revision-4', 'closed']
  const states = names.map(n => ({ name: n, ...json(join(step, n + '.json')) }))
  check('allEightStatesSameOriginTimeOriginViewport', states.every(s => s.origin === 'http://127.0.0.1:3248'
    && s.timeOrigin === 1792629512672.7 && s.viewport.width === 1440 && s.viewport.height === 718 && s.dark))
  check('sameSavedTaskBytes', fp(join(step, 'task.json')).sha256 === oldAudit.savedTaskSHA)
  const task = json(join(step, 'task.json')).record
  const before = json(join(step, 'before-roots.json')), after = json(join(step, 'after-roots.json'))
  const rootDiff = Object.fromEntries(Object.keys(before).map(k => [k, delta(before[k], after[k])]))
  check('fourRootsBeforeAfterEqual', eq(Object.keys(before).sort(), ['backups', 'data', 'exports', 'files'])
    && Object.values(rootDiff).every(zero))
  check('beforeAndAfterMatchOldCancelEndpoint', eq(before, json(join(a18, 'material-composition/cancel-1792633889539/after-roots.json')))
    && before.data['/pmtool/tasks/t-0001.json'] === fp(join(step, 'task.json')).sha256)
  const fields = json(join(step, 'fields.json'))
  check('fieldsSameContextAndSavedMaterialText', fields.origin === states[0].origin
    && fields.timeOrigin === states[0].timeOrigin
    && fields.materials.includes('QA规范\nQA 组合保存原链接备注\n改注\n移除')
    && fields.progress.some(p => p.includes(task.progressLog[0].revisions[3].content)))
  const progress = states[1].pm.text, history = states[2].pm.text
  check('persistedCurrentRv4AndFourVersionLabel', progress.includes('历史（4 版）')
    && progress.includes('2026-10-21\n测试甲组合') && progress.includes(task.progressLog[0].revisions[3].content))
  check('allFourHistoryContentsAndAuthorsPresent', task.progressLog[0].revisions.every((r, i) =>
    history.includes(`v${i + 1}`) && history.includes(r.author) && history.includes(r.content))
    && history.includes('收起历史'))
  const historyPngHashes = ['history-open', 'revision-1', 'revision-2', 'revision-3', 'revision-4']
    .map(n => fp(join(step, n + '.png')).sha256)
  check('identicalRevisionPNGsRecordedNotSeparateStates', new Set(historyPngHashes).size === 1)
  const frameIndex = json(join(step, 'frames/frames.json'))
  let last = -Infinity
  const reorders = []
  const frameErrors = frameIndex.frames.filter(f => {
    if (f.metadata.timestamp < last) reorders.push({ file: f.file, previous: last, timestamp: f.metadata.timestamp })
    last = f.metadata.timestamp
    return fp(join(step, 'frames', f.file)).sha256 !== f.sha256 || !Number.isFinite(last)
      || f.metadata.deviceWidth !== 1440 || f.metadata.deviceHeight !== 718
  }).map(f => f.file)
  check('twentyRealCompositorFramesEightPNGs', frameIndex.source === 'CDP Page.screencastFrame; actual browser compositor'
    && frameIndex.frames.length === 20 && !frameErrors.length
    && listed.filter(n => n.endsWith('.png')).length === 8)
  check('cleanClosedTitleInputAndDrawerAbsent', !states[7].fields.some(f => f.name === 'title')
    && !states[7].buttons.some(b => b.aria === '关闭编辑抽屉') && json(join(step, 'exit.json')).exit === 0)
  const collector = readFileSync(join(root, 'execution/pmtool-a18-material-visible-20261022.mjs'), 'utf8')
  check('collectorOnlyOpenScrollHistoryThenCancelNoSave', collector.includes("await history.click()")
    && collector.includes("n.innerText==='取消'") && !/commands\/execute|task update|clickText|保存更改/.test(collector))
  const drift = delta(json(prefix + '-before.json').files, capture())
  check('boundedInputsNoReviewDrift', zero(drift))
  const ok = Object.values(checks).every(Boolean)
  output('-audit.json', { at: new Date().toISOString(), runtime: process.version, platform: process.platform,
    ok, checks, newIndex: { files: 43, sha256: fp(join(root, 'index.json')).sha256, mismatches },
    candidateSHA: oldAudit.candidate.sourceSHA, sourceMismatch, artifactMismatch, rootDiff, drift,
    states: states.map(s => ({ name: s.name, at: s.at, origin: s.origin, timeOrigin: s.timeOrigin, viewport: s.viewport })),
    taskSHA: fp(join(step, 'task.json')).sha256, historyPngHashes, reorders, frameErrors,
    historicalRevisions: task.progressLog[0].revisions,
    boundary: 'Mechanical bounded archive review only. Supplement lacks POST/run-done/console recordings; zero persistent writes supported by equal full captured roots and old endpoint, not asserted zero network activity.' })
  console.log(JSON.stringify({ mode, ok, checks: Object.keys(checks).length,
    failed: Object.keys(checks).filter(k => !checks[k]), files: 43, frames: 20 }))
  process.exitCode = ok ? 0 : 1
} else if (mode === 'seal') {
  const drift = delta(json(prefix + '-before.json').files, capture())
  const audit = json(prefix + '-audit.json')
  const own = Object.fromEntries(readdirSync(dirname(prefix))
    .filter(n => n.startsWith(prefix.split('/').at(-1)) && !n.endsWith('-seal.json'))
    .map(n => [n, fp(join(dirname(prefix), n))]))
  const ok = zero(drift) && audit.ok
  output('-seal.json', { at: new Date().toISOString(), ok, drift, own,
    protectedFiles: Object.keys(json(prefix + '-before.json').files).length, released: ok,
    boundary: 'Old sealed review untouched; release of independent review role only, no service/browser/process control.' })
  console.log(JSON.stringify({ mode, ok, released: ok, drift }))
  process.exitCode = ok ? 0 : 1
} else throw Error('Use freeze, audit, or seal')

import { readFileSync, readdirSync, lstatSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, resolve, relative } from 'node:path'
import { isDeepStrictEqual } from 'node:util'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a19-number-visual-retest-review-20261022'
const root = 'reports/all-pending-evidence-20261021/A19/number-visual'
const a19 = 'reports/all-pending-evidence-20261021/A19'
const r1 = 'r1-1792635710458'
const r2 = 'manual-r2-1792635879774'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const read = path => readFileSync(resolve(repo, path))
const json = path => JSON.parse(read(path))
const output = (suffix, data) => writeFileSync(resolve(repo, `${prefix}-${suffix}.json`), JSON.stringify(data, null, 2) + '\n')

function discover(path) {
  return readdirSync(resolve(repo, path)).sort().flatMap(name => {
    const child = `${path}/${name}`
    const stat = lstatSync(resolve(repo, child))
    if (stat.isSymbolicLink()) throw Error(`Refuse symlink: ${child}`)
    return stat.isDirectory() ? discover(child) : [child]
  })
}

function snapshot(path) {
  const stat = lstatSync(resolve(repo, path), { bigint: true })
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error(`Not a regular file: ${path}`)
  return { sha256: sha(read(path)), bytes: Number(stat.size), mtimeNs: String(stat.mtimeNs), inode: String(stat.ino) }
}

const fixed = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/gui-numbers-habit-dark-review-20261021.md',
  'docs/testing/objective-number-independent-retest-20261021.md',
  'docs/testing/independent-acceptance-batch1-closure-plan-20261021.md',
  'docs/testing/a19-full-regression-evidence-review-20261022.md',
  `${a19}/candidate.json`, `${a19}/candidate-scope-correction.md`,
  `${a19}/final/host-start.json`, `${a19}/final/host-ready.json`,
  `${a19}/final/r2-runtime-binding.json`, `${a19}/final/environment.json`,
  `${a19}/final/loaded/result.json`, `${a19}/final/loaded/combo-1.txt`,
  `${a19}/build-fixture-supplement/coverage.stdout.txt`,
  `${a19}/build-fixture-supplement/coverage.exit.json`,
  `${a19}/build-fixture-supplement/guard.stdout.txt`,
  `${a19}/build-fixture-supplement/guard.exit.json`,
  'packages/dsh-pm-tool/src/client/views/tasks.tsx',
  'packages/dsh-pm-tool/src/client/views/tasks.css',
  'packages/dsh-pm-tool/src/client/views/tasks-number-feedback.test.tsx',
  'packages/dsh-pm-tool/src/client/views/tasks-clipboard.test.ts',
]

function capture() {
  const paths = [...discover(root), ...fixed]
  const files = Object.fromEntries([...new Set(paths)].sort().map(path => [path, snapshot(path)]))
  output('before', {
    at: new Date().toISOString(), node: process.version, platform: process.platform, arch: process.arch,
    files, boundary: 'Exact public evidence and static source only. No runtime/profile/credentials/service access. Protection starts at this capture, not before earlier reading.',
  })
  console.log(JSON.stringify({ mode: 'capture', paths: Object.keys(files).length }))
}

function audit() {
  const checks = []
  const check = (name, ok, detail) => checks.push({ name, ok, detail })
  const index = json(`${root}/index.json`)
  const actual = discover(root).map(path => path.slice(root.length + 1)).filter(path => path !== 'index.json')
  check('inventory-87', actual.length === 87 && isDeepStrictEqual(actual.sort(), Object.keys(index.files).sort()), { indexed: Object.keys(index.files).length, actual: actual.length })
  const mismatches = Object.entries(index.files).filter(([path, item]) => {
    const current = snapshot(`${root}/${path}`)
    return current.sha256 !== item.sha256 || current.bytes !== item.bytes
  }).map(([path]) => path)
  check('all-original-sha-bytes', mismatches.length === 0, mismatches)
  const candidate = json(`${a19}/candidate.json`)
  const binding = json(`${root}/${r1}/binding.json`)
  const loaded = json(`${a19}/final/loaded/result.json`)
  const native = json(`${root}/native/receipt.json`)
  const initial = json(`${root}/${r1}/initial-cells.json`)
  const copies = json(`${root}/${r1}/copied-results.json`)
  const denied = json(`${root}/${r1}/denied.json`)
  const manual1 = json(`${root}/${r1}/manual-selection.json`)
  const manual2 = json(`${root}/${r2}/result.json`)
  const response = read(`${a19}/final/loaded/combo-1.txt`)
  const event = loaded.events[0]
  const match = event.matches[0]
  const segment = response.subarray(match.first, match.first + match.segmentBytes)
  check('candidate-hash-binding', binding.candidateSha === sha(read(`${a19}/candidate.json`)), binding)
  check('response-and-recorded-core-sha', sha(response) === event.responseSha && sha(segment) === match.segmentSha, {
    responseSha: sha(response), segmentSha: sha(segment), segmentBytes: segment.length,
    boundary: 'Recomputed archived response and recorded segment. Does not independently read candidate lib or reprove executor uniqueComplete.',
  })
  const artifact = Object.entries(candidate.artifacts).find(([path]) => path.endsWith('/lib/client.js'))
  check('loaded-source-artifact-declaration', artifact?.[1] === match.sourceSha, { artifact, loadedSourceSha: match.sourceSha })
  check('same-tab-origin-timeOrigin', [
    [loaded.targetId, binding.targetId], [native.targetId, binding.targetId],
    [loaded.state.origin, binding.origin], [native.origin, binding.origin],
    [loaded.state.timeOrigin, binding.timeOrigin], [native.timeOrigin, binding.timeOrigin],
    [initial.timeOrigin, binding.timeOrigin], [manual2.failed.timeOrigin, binding.timeOrigin],
  ].every(([left, right]) => left === right), { targetId: binding.targetId, origin: binding.origin, timeOrigin: binding.timeOrigin })
  check('css-viewport-and-values', initial.viewport.width === 1440 && initial.viewport.height === 900 && initial.dark === true && initial.bodyWidth === 1440 && isDeepStrictEqual(initial.cells.map(cell => cell.value), ['1', '2']), initial.viewport)
  check('two-native-copy-values-and-restore', copies.length === 2 && copies.every((row, i) => row.expected === String(i + 1) && row.clipboard === row.expected && row.copied.cells[i].feedback === '已复制' && row.copied.cells[i].value === row.expected && row.copied.cells[1 - i].feedback === undefined && row.copied.focus.outline.endsWith('solid 2px') && row.restored.cells.every(cell => cell.feedback === undefined) && isDeepStrictEqual(row.restored.cells.map(cell => cell.value), ['1', '2'])), copies.map(row => ({ i: row.i, value: row.expected, clipboard: row.clipboard, elapsedObserved: row.elapsedObserved })))
  check('denied-honest-fulltext-original-value', denied.cells[0].feedback === '复制失败' && denied.cells[0].value === '1' && denied.cells[1].feedback === undefined && denied.cells[0].button.title.includes('手动'), denied.cells[0])
  check('feedback-stays-within-62px-column', [...copies.map(row => row.copied.cells[row.i]), denied.cells[0]].every(cell => cell.feedbackBBox.left >= cell.bbox.left && cell.feedbackBBox.right <= cell.bbox.right && cell.feedbackStyle.overflow === 'visible' && cell.feedbackStyle.whiteSpace === 'normal'), 'Only feedback versus code-cell bbox; taskBBox was omitted by original collector, not manufactured here.')
  check('manual-failure-preserved', manual1.selected.selection === '' && manual1.manualClipboard === '2' && manual2.selected.selection === '' && manual2.clipboard === '2' && manual2.expected === '1' && manual2.matches === false && manual2.failed.cells[0].userSelect === 'text' && manual2.selected.cells[0].userSelect === 'text', {
    r1: { selection: manual1.selected.selection, clipboard: manual1.manualClipboard, feedback: manual1.selected.cells[0].feedback ?? null },
    r2: { selection: manual2.selected.selection, clipboard: manual2.clipboard, expected: manual2.expected, matches: manual2.matches, beforeAt: manual2.failed.at, selectedAt: manual2.selected.at },
  })
  const rootChecks = {}
  for (const round of [r1, r2]) {
    const before = json(`${root}/${round}/before-roots.json`)
    const after = json(`${root}/${round}/after-roots.json`)
    rootChecks[round] = Object.fromEntries(Object.entries(before).map(([name, files]) => [name, {
      beforeFiles: Object.keys(files).length, afterFiles: Object.keys(after[name]).length, equal: isDeepStrictEqual(files, after[name]),
    }]))
  }
  check('four-root-content-manifests', Object.values(rootChecks).every(round => Object.values(round).every(root => root.equal)), rootChecks)
  const meta = json(`${root}/${r1}/before-metadata.json`)
  check('r1-size-mtime-metadata', isDeepStrictEqual(meta, json(`${root}/${r1}/after-metadata.json`)), Object.fromEntries(Object.entries(meta).map(([name, entries]) => [name, { files: Object.values(entries).filter(item => item.kind === 'file').length, directories: Object.values(entries).filter(item => item.kind === 'directory').length }])))
  check('r1-no-collected-business-requests', json(`${root}/${r1}/requests.json`).length === 0 && json(`${root}/${r1}/commands.json`).length === 0, 'Collected execute endpoint and websocket command events only, not every possible network channel.')
  const sourceChecks = {}
  for (const path of fixed.filter(path => path.startsWith('packages/'))) {
    sourceChecks[path] = { current: sha(read(path)), candidate: candidate.sourceHashes[path], equal: sha(read(path)) === candidate.sourceHashes[path] }
  }
  check('static-four-inputs-match-A19', Object.values(sourceChecks).every(item => item.equal), sourceChecks)
  const coverage = read(`${a19}/build-fixture-supplement/coverage.stdout.txt`).toString().replace(/\u001b\[[0-9;]*m/g, '')
  check('old-contract-logs-not-rerun', coverage.includes('d04-d05-d11-contract.test.ts') && coverage.includes('tasks-number-feedback.test.tsx') && coverage.includes('tasks-clipboard.test.ts') && json(`${a19}/build-fixture-supplement/coverage.exit.json`).exit === 0, coverage.split('\n').filter(line => /d04-d05-d11-contract|tasks-number-feedback|tasks-clipboard/.test(line)))
  const frameChecks = {}
  for (const round of [r1, r2]) {
    const frames = json(`${root}/${round}/frames/frames.json`).frames
    frameChecks[round] = {
      count: frames.length,
      matching: frames.every(frame => sha(read(`${root}/${round}/frames/${frame.file}`)) === frame.sha256),
      firstAt: frames[0].at, lastAt: frames.at(-1).at,
      sizes: [...new Set(frames.map(frame => `${frame.metadata.deviceWidth}x${frame.metadata.deviceHeight}`))],
    }
  }
  check('original-compositor-frames', Object.values(frameChecks).every(round => round.matching), frameChecks)
  output('result', {
    at: new Date().toISOString(), checks, auditConsistent: checks.every(item => item.ok),
    indexedOriginals: index.files, originalIndexSha: sha(read(`${root}/index.json`)),
    verdictBoundary: 'Integrity audit completion is not GUI PASS. Visual judgement belongs to the independent Chinese report. Manual selection failed; product-versus-facility attribution unresolved.',
  })
  console.log(JSON.stringify({ mode: 'audit', checks: checks.length, failures: checks.filter(item => !item.ok) }))
  if (checks.some(item => !item.ok)) process.exitCode = 1
}

function seal() {
  const before = json(`${prefix}-before.json`)
  const drift = Object.entries(before.files).flatMap(([path, item]) => {
    try { return isDeepStrictEqual(item, snapshot(path)) ? [] : [{ path, before: item, after: snapshot(path) }] }
    catch (error) { return [{ path, error: String(error) }] }
  })
  const originalSet = discover(root)
  const beforeSet = Object.keys(before.files).filter(path => path.startsWith(root + '/'))
  const setEqual = isDeepStrictEqual(originalSet.sort(), beforeSet.sort())
  const ownFiles = readdirSync(resolve(repo, dirname(prefix))).filter(name => name.startsWith('a19-number-visual-retest-review-20261022') && !name.endsWith('-seal.json')).map(name => `${dirname(prefix)}/${name}`)
  const formatting = ownFiles.filter(path => path.endsWith('.md') || path.endsWith('.mjs')).flatMap(path => {
    const text = read(path).toString()
    const errors = []
    if (!text.endsWith('\n')) errors.push({ path, problem: 'missing final newline' })
    if (/[ \t]+$/m.test(text)) errors.push({ path, problem: 'trailing whitespace' })
    if (path.endsWith('.md')) {
      for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
        const link = match[1].split('#')[0]
        if (/^(https?:|file:)/.test(link) || !link) continue
        const destination = resolve(repo, dirname(path), link)
        if (!relative(repo, destination).startsWith('..')) {
          try { lstatSync(destination) } catch { errors.push({ path, problem: `missing link: ${link}` }) }
        }
      }
    }
    return errors
  })
  output('seal', {
    at: new Date().toISOString(), protectedSince: before.at, protectedPaths: Object.keys(before.files).length,
    drift, originalSetEqual: setEqual, formatting,
    ownFiles: Object.fromEntries(ownFiles.map(path => [path, snapshot(path)])),
    resourceRelease: 'No product tests/build/install/GUI/servers launched. All audit commands synchronous and finished. No Main process/tab/session touched. No commit.',
  })
  console.log(JSON.stringify({ mode: 'seal', drift: drift.length, originalSetEqual: setEqual, formatting }))
  if (drift.length || !setEqual || formatting.length) process.exitCode = 1
}

const mode = process.argv[2]
if (mode === 'capture') capture()
else if (mode === 'audit') audit()
else if (mode === 'seal') seal()
else throw Error('Use capture, audit or seal; never imports product or GUI collectors.')

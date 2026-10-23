import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const root = path.join(repo, 'reports/all-pending-evidence-20261021/A0')
const wt = '/private/tmp/pmtool-all-closure-20261021'
const pkg = path.join(wt, 'packages/dsh-pm-tool')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const hash = file => sha(fs.readFileSync(file))
const json = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'))
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const failures = []
const requireCheck = (condition, label) => { if (!condition) failures.push(label) }
const changes = (a, b) => ({
  added: Object.keys(b).filter(k => !(k in a)).sort(),
  removed: Object.keys(a).filter(k => !(k in b)).sort(),
  changed: Object.keys(a).filter(k => k in b && !same(a[k], b[k])).sort(),
})
function listFiles(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const key = path.posix.join(prefix, d.name)
    return d.isDirectory() ? listFiles(path.join(dir, d.name), key) : [key]
  }).sort()
}
const candidate = json('candidate.json')
requireCheck(Object.keys(candidate.source).length === 14, 'candidate source count')
const sources = Object.entries(candidate.source).map(([file, entry]) => {
  requireCheck(file.startsWith('launcher/') || file.startsWith('packages/dsh-pm-tool/'), 'source boundary')
  const main = hash(path.join(repo, file)), isolated = hash(path.join(wt, file))
  requireCheck(main === entry.sha256 && isolated === entry.isolatedSha256 && main === isolated, `source ${file}`)
  return { file, sha256: main, equal: main === isolated && main === entry.sha256 }
})
const patch = fs.readFileSync(path.join(root, 'tracked.patch'))
const currentAccounting = []
for (const dir of [repo, wt]) {
  const actual = execFileSync('git', ['diff', candidate.baselineCommit, '--', 'launcher', 'packages'], { cwd: dir })
  requireCheck(sha(actual) === sha(patch), `patch ${dir}`)
  const tracked = execFileSync('git', ['diff', '--name-only', candidate.baselineCommit, '--', 'launcher', 'packages'], { cwd: dir, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'launcher', 'packages'], { cwd: dir, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  const extraTracked = tracked.filter(f => !(f in candidate.source))
  const extraUntracked = untracked.filter(f => !(f in candidate.source))
  requireCheck(extraTracked.length === 0 && extraUntracked.length === 0, `candidate extra files ${dir}`)
  currentAccounting.push({ tree: dir, patchSha256: sha(actual), extraTracked, extraUntracked })
}
requireCheck(sha(patch) === candidate.trackedPatchSha256, 'candidate patch hash')
const proof = json('final-build-proof.json')
const sourceDiff = changes(proof.before.sources, proof.after.sources)
const builtDiff = changes(proof.before.built, proof.after.built)
for (const [label, diff] of [['source', sourceDiff], ['built', builtDiff]]) {
  requireCheck(Object.values(diff).every(v => v.length === 0), `build ${label} changed`)
}
requireCheck(proof.exit === 0, 'build exit')
requireCheck(same(proof.argv, ['pnpm', 'run', 'build']) && proof.cwd === pkg, 'build invocation')
for (const [key, prefix] of [['sources', 'src/'], ['built', 'lib/']]) {
  const manifest = proof.after[key]
  requireCheck(same(Object.keys(manifest).sort(), listFiles(path.join(pkg, prefix)).map(f => prefix + f)), `${key} complete`)
  for (const [file, expected] of Object.entries(manifest)) {
    requireCheck(file.startsWith(prefix) && !file.includes('..'), `${key} boundary`)
    requireCheck(hash(path.join(pkg, file)) === expected, `build current ${file}`)
    if (key === 'sources') requireCheck(hash(path.join(repo, 'packages/dsh-pm-tool', file)) === expected, `main source ${file}`)
  }
}
const allBuilt = json('all-built-files.json')
requireCheck(same(Object.keys(allBuilt).sort(), Object.keys(proof.after.built).map(f => `packages/dsh-pm-tool/${f}`).sort()), 'all-built completeness')
for (const [file, value] of Object.entries(allBuilt)) {
  requireCheck(value === proof.after.built[file.replace('packages/dsh-pm-tool/', '')], `all-built ${file}`)
}
for (const [file, expected] of Object.entries(candidate.bundles)) {
  requireCheck(hash(path.join(wt, file)) === expected, `bundle ${file}`)
}
const archives = json('archive-and-protection-index.json').archives.map(a => {
  requireCheck(!a.original.includes('/') && !a.archive.includes('/'), 'archive boundary')
  const original = hash(path.join(root, a.original)), archive = hash(path.join(root, a.archive))
  const ignored = spawnSync('git', ['check-ignore', '--no-index', '--non-matching', '-v', path.join(root, a.archive)], { cwd: repo, encoding: 'utf8' })
  requireCheck(ignored.status === 1 && ignored.stdout.startsWith('::\t'), `archive not ignored ${a.archive}`)
  requireCheck(original === archive && original === a.sha256, `archive ${a.archive}`)
  return { ...a, actualSha256: archive, ignoreCheck: ignored.stdout.trim(), ignoreExit: ignored.status }
})
requireCheck(archives.length === 7, 'archive count')
const before = json('formal-before.json'), after = json('formal-after.json')
const formalDiff = changes(before, after), reported = json('formal-comparison.json')
for (const k of Object.keys(formalDiff)) requireCheck(same(formalDiff[k], [...reported[k]].sort()), `formal ${k}`)
function group(dir) {
  const a = Object.fromEntries(Object.entries(before).filter(([k]) => k.startsWith(dir)))
  const b = Object.fromEntries(Object.entries(after).filter(([k]) => k.startsWith(dir)))
  return { before: Object.keys(a).length, after: Object.keys(b).length, diff: changes(a, b) }
}
const formalGroups = Object.fromEntries(['data/pmtool/', 'data/wechat-pilot/', 'data/', 'packages/backups/', 'exports/'].map(d => [d, group(path.join(repo, d).replace(/\/$/, '') + '/')]))

const labels = ['drag0', 'drag1', 'drag2', 'drag3', 'undo1', 'undo2', 'undo3', 'save-draft', 'reloaded', 'cancel-draft', 'cancel-reloaded']
const states = json('gui/board-drag-r3-states.json')
requireCheck(same(states.map(s => s.label), labels), 'board labels')
const canonical = layout => Object.fromEntries(layout.widgets.map(w => [w.i, { type: w.type, config: w.config, layout: w.layout }]).sort(([a], [b]) => a.localeCompare(b)))
const layouts = Object.fromEntries(labels.map(l => [l, canonical(json(`gui/layout-r3-${l}.json`))]))
const initialIDs = Object.keys(layouts.drag0)
const board = states.map(s => {
  const layout = layouts[s.label]
  requireCheck(same(Object.keys(layout), initialIDs), `board IDs ${s.label}`)
  requireCheck(same(s.cards.map(c => c.id).sort(), [...initialIDs].sort()), `board DOM IDs ${s.label}`)
  const overlaps = []
  for (let i = 0; i < s.cards.length; i++) for (let j = i + 1; j < s.cards.length; j++) {
    const a = s.cards[i], b = s.cards[j]
    if (Math.min(a.bbox.right, b.bbox.right) > Math.max(a.bbox.left, b.bbox.left) &&
        Math.min(a.bbox.bottom, b.bbox.bottom) > Math.max(a.bbox.top, b.bbox.top)) overlaps.push([a.id, b.id])
  }
  requireCheck(overlaps.length === 0, `board overlap ${s.label}`)
  const geometry = s.cards.map(c => ({ id: c.id, style: c.style, bbox: c.bbox, canonical: layout[c.id].layout }))
  for (const c of geometry) {
    const match = /translate\(([\d.]+)px, ([\d.]+)px\)/.exec(c.style)
    requireCheck(match && Math.abs(Number(match[1]) - (12 + c.canonical.x * 79)) < 0.1 &&
      Math.abs(Number(match[2]) - (12 + c.canonical.y * 48)) < 0.1, `board transform ${s.label}/${c.id}`)
  }
  return { label: s.label, time: s.time, undoDisabled: s.undo, overlaps, geometry, maxRow: Math.max(...Object.values(layout).map(w => w.layout.y + w.layout.h)) }
})
const relations = [
  ['undo1', 'drag2'], ['undo2', 'drag1'], ['undo3', 'drag0'],
  ['save-draft', 'drag2'], ['reloaded', 'save-draft'], ['cancel-reloaded', 'reloaded'],
].map(([a, b]) => ({ a, b, equal: same(layouts[a], layouts[b]) }))
for (const r of relations) requireCheck(r.equal, `board relation ${r.a}/${r.b}`)
const distinct = ['drag1', 'drag2', 'drag3', 'cancel-draft'].map((l, i) => ({ label: l, changed: !same(layouts[l], layouts[['drag0', 'drag1', 'drag2', 'reloaded'][i]]) }))
for (const r of distinct) requireCheck(r.changed, `board distinct ${r.label}`)
const scroll = json('gui/board-right-edge-scroll.json')
const e = scroll.after.elements.find(v => v.cls === 'pm-bento-stage')
requireCheck(e.scrollLeft === e.scrollWidth - e.clientWidth && e.scrollLeft === 89, 'stage scroll')
requireCheck(scroll.before.card.right - scroll.after.card.right === 89 && scroll.after.card.right <= e.bbox.right, 'right card reached')
for (const cls of ['', 'pm-shell']) {
  const a = scroll.before.elements.find(v => v.cls === cls), b = scroll.after.elements.find(v => v.cls === cls)
  requireCheck(a.scrollWidth === a.clientWidth && b.scrollWidth === b.clientWidth && a.scrollLeft === 0 && b.scrollLeft === 0 && same(a.bbox, b.bbox), `shell ${cls}`)
}
const copy = json('gui/copy-A-B-steps.json'), boundary = json('gui/copy-A-B-boundary.json')
requireCheck(same(copy.map(v => v.label), ['A-copied', 'B-not-copied', 'B-copied', 'B-denied']), 'copy labels')
requireCheck(copy.every(v => v.dark === true && v.alerts.length === 1), 'copy dark/single alert')
for (const i of [0, 2]) {
  const c = copy[i]
  requireCheck(c.clipboard.actual === c.alerts[0].raw && Buffer.byteLength(c.clipboard.actual) === c.clipboard.bytes && c.copyState === '已复制', `copy raw ${i}`)
}
requireCheck(!('copyState' in copy[1]) && !copy[1].alerts[0].text.includes('已复制'), 'copy B cleared')
requireCheck(copy[3].copyState === '复制失败，请手动复制' && !copy[3].alerts[0].text.includes('已复制'), 'copy denied')
requireCheck(boundary.exit === 0 && Object.values(changes(boundary.before, boundary.after)).every(v => v.length === 0), 'copy data/exit')
const videos = json('desktop-video-index.json').map(v => {
  requireCheck(v.path.startsWith('/private/tmp/pmtool-closure-runtime-20261021/artifacts/') &&
    path.basename(v.path).endsWith('.mov') && !v.path.includes('/../'), 'video boundary')
  const actual = hash(v.path), bytes = fs.statSync(v.path).size
  requireCheck(actual === v.sha256 && bytes === v.bytes, `video ${path.basename(v.path)}`)
  return { name: path.basename(v.path), bytes, sha256: actual, equal: actual === v.sha256 }
})
const evidence = [
  'candidate.json', 'tracked.patch', 'final-build-proof.json', 'all-built-files.json',
  'final-build-stdout.txt', 'final-build-stderr.txt', 'archive-and-protection-index.json',
  'formal-before.json', 'formal-after.json', 'formal-comparison.json', 'desktop-video-index.json',
  'gui/board-drag-r3-states.json', 'gui/board-right-edge-scroll.json', 'gui/board-right-edge.png',
  'gui/copy-A-B-steps.json', 'gui/copy-A-B-boundary.json',
  'execution-scripts/pmtool-build-proof-20261021.py', 'execution-scripts/pmtool-board-drag-r3-20261021.mjs',
  'execution-scripts/pmtool-copy-gui-20261021.mjs', 'execution-scripts/pmtool-copy-boundary-20261021.mjs',
  ...labels.flatMap(l => [`gui/layout-r3-${l}.json`, `gui/board-r3-${l}.json`, `gui/board-r3-${l}.png`]),
  ...copy.map(v => `gui/copy-${v.label}.png`),
].map(file => ({ file, bytes: fs.statSync(path.join(root, file)).size, sha256: hash(path.join(root, file)) }))
const submittedIndex = json('evidence-sha256.json')
for (const e of evidence) requireCheck(submittedIndex[e.file] === e.sha256, `submitted index ${e.file}`)
const changedDuringReview = sources.filter(s =>
  hash(path.join(repo, s.file)) !== s.sha256 || hash(path.join(wt, s.file)) !== s.sha256,
).map(s => s.file)
for (const [file, expected] of Object.entries(proof.after.built)) {
  if (hash(path.join(pkg, file)) !== expected) changedDuringReview.push(file)
}
requireCheck(changedDuringReview.length === 0, 'candidate changed during review')
const result = {
  at: new Date().toISOString(), node: process.version, platform: process.platform,
  candidate: { baselineCommit: candidate.baselineCommit, productBase: candidate.productBase, sha256: hash(path.join(root, 'candidate.json')), patchSha256: sha(patch), sources, currentAccounting },
  build: { argv: proof.argv, cwd: proof.cwd, exit: proof.exit, beforeAt: proof.before.at, afterAt: proof.after.at, sources: Object.keys(proof.after.sources).length, artifacts: Object.keys(proof.after.built).length, sourceDiff, builtDiff },
  archives, formal: { beforeCount: Object.keys(before).length, afterCount: Object.keys(after).length, diff: formalDiff, groups: formalGroups },
  board, relations, distinct, scroll, copy, copyBoundary: { started: boundary.started, ended: boundary.ended, exit: boundary.exit, fileCount: Object.keys(boundary.before).length, diff: changes(boundary.before, boundary.after) },
  videos, evidence, changedDuringReview, submittedIndexCount: Object.keys(submittedIndex).length, failures,
  boundary: '仅只读审证一致性，不运行产品测试，不自动给GUI/全门PASS；只按索引读取授权mov，不读runtime/private。',
}
if (process.argv.includes('--output')) {
  fs.writeFileSync(path.join(repo, 'docs/testing/a0-gui-raw-review-20261021-result.json'), JSON.stringify(result, null, 2) + '\n')
}
console.log(JSON.stringify({ at: result.at, candidate14: sources.every(v => v.equal), build: result.build, archives: archives.length, formal: result.formal, boardRelations: relations, distinct, copyBoundary: result.copyBoundary, videoHashes: videos, failures }, null, 2))
process.exitCode = failures.length ? 1 : 0

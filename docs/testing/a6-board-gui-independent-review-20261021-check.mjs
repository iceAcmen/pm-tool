import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = process.cwd()
const prefix = 'docs/testing/a6-board-gui-independent-review-20261021'
const out = `${prefix}-selftmp${process.argv[2] ? '/' + process.argv[2] : ''}`
const base = 'reports/all-pending-evidence-20261021/A6'
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const read = p => fs.readFileSync(path.join(repo, p))
const json = p => JSON.parse(read(p))
const write = (p, value) => {
  assert(p.startsWith(prefix), 'restricted write path')
  assert(!fs.existsSync(p), `refuse overwrite: ${p}`)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n')
}
const walk = p => fs.readdirSync(p, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(p, e.name)) : [path.join(p, e.name)])
const inventory = []
const include = p => {
  const stat = fs.statSync(p)
  inventory.push({ path: p, bytes: stat.size, sha256: sha(read(p)), mtimeMs: stat.mtimeMs })
}
const dirs = ['board/original-three-r5', 'board/save-cancel-r1',
  'board/fixture-import-frames', 'build', 'loaded', 'environment', 'execution-scripts']
for (const dir of dirs) for (const p of walk(`${base}/${dir}`)) include(p)
for (const p of ['board/fixture-import.json', 'board/initial-relative.json',
  'board/six-fixture-reentered.json', 'board/six-fixture-reentered.png',
  'main-entry/native-menu-100.json', 'main-entry/native-menu-100.png']) include(`${base}/${p}`)
for (const p of ['AGENTS.md', 'docs/collaboration.md',
  'reports/all-pending-acceptance-execution-20261021.md',
  'docs/testing/board-fullwidth-drag-diagnosis-20261021.md',
  'docs/testing/board-fullwidth-independent-retest-20261021.md',
  'docs/testing/board-drag-relative-target-clarification-20261021.md',
  'docs/testing/board-fixture-clarification-20261021-fixture.json']) include(p)
write(`${out}/freeze.json`, { at: new Date().toISOString(), inventory,
  boundary: 'Archived A6 only; no current lib, runtime, credential or browser access.' })

const fixture = json('docs/testing/board-fixture-clarification-20261021-fixture.json')
const sync = json(`${base}/build/sync.json`)
const artifacts = json(`${base}/build/artifacts.json`)
const combo = json(`${base}/loaded/combo.json`)
const response = read(`${base}/loaded/combo-1.txt`)
const event = combo.events[0]
assert.equal(sha(response), event.responseSha)
assert.equal(response.length, event.bytes)
const segment = response.subarray(event.first, event.first + event.segmentBytes)
assert.equal(sha(segment), event.segmentSha)
assert.equal(response.indexOf(segment), event.first)
assert.equal(response.indexOf(segment, event.first + 1), -1)
assert.equal(event.sourceSha, artifacts.files['packages/dsh-pm-tool/lib/client.js'])
assert.equal(sync.sourceHashes['packages/dsh-pm-tool/src/client/board/editor.tsx'],
  'ba1bf91211c87c068fe0bb4cb887249f1c321e2eecb20885d6745b2cd3086761')
assert.deepEqual(sync.copyDrift, [])
assert.equal(event.fromDiskCache, false)
assert.equal(event.fromServiceWorker, false)

// ISO BMFF boxes: inspect the archived movie, not a live application.
function boxes(buffer, start = 0, end = buffer.length) {
  const result = []
  for (let p = start; p + 8 <= end;) {
    let size = buffer.readUInt32BE(p)
    let header = 8
    if (size === 1) { size = Number(buffer.readBigUInt64BE(p + 8)); header = 16 }
    if (size === 0) size = end - p
    assert(size >= header && p + size <= end, 'invalid MP4 box')
    result.push({ type: buffer.toString('ascii', p + 4, p + 8), start: p + header, end: p + size })
    p += size
  }
  return result
}
function movie(p) {
  const b = read(p)
  const child = (parent, name) => {
    const box = boxes(b, parent.start, parent.end).find(x => x.type === name)
    assert(box, `missing MP4 ${name}`)
    return box
  }
  const moov = boxes(b).find(x => x.type === 'moov')
  const mvhd = child(moov, 'mvhd')
  const movieVersion = b[mvhd.start]
  const movieTimescale = b.readUInt32BE(mvhd.start + (movieVersion === 1 ? 20 : 12))
  const movieDuration = movieVersion === 1 ? Number(b.readBigUInt64BE(mvhd.start + 24)) :
    b.readUInt32BE(mvhd.start + 16)
  const trak = child(moov, 'trak')
  const tkhd = child(trak, 'tkhd')
  const mdia = child(trak, 'mdia')
  const mdhd = child(mdia, 'mdhd')
  const version = b[mdhd.start]
  const timescale = b.readUInt32BE(mdhd.start + (version === 1 ? 20 : 12))
  const duration = version === 1 ? Number(b.readBigUInt64BE(mdhd.start + 24)) :
    b.readUInt32BE(mdhd.start + 16)
  const stbl = child(child(mdia, 'minf'), 'stbl')
  const stsz = child(stbl, 'stsz')
  const stts = child(stbl, 'stts')
  const entries = b.readUInt32BE(stts.start + 4)
  const times = []
  let t = 0
  for (let i = 0; i < entries; i++) {
    const n = b.readUInt32BE(stts.start + 8 + i * 8)
    const delta = b.readUInt32BE(stts.start + 12 + i * 8)
    for (let k = 0; k < n; k++) { times.push(t / timescale); t += delta }
  }
  return { path: p, sha256: sha(b), samples: b.readUInt32BE(stsz.start + 8),
    width: b.readUInt32BE(tkhd.end - 8) / 65536,
    height: b.readUInt32BE(tkhd.end - 4) / 65536,
    timescale, duration: movieDuration / movieTimescale, mediaDuration: duration / timescale,
    decodeTimes: times }
}
const same = (a, b) => assert.deepEqual(a, b)
const geometries = []
const frameReviews = []
for (const dir of ['board/original-three-r5', 'board/save-cancel-r1']) {
  const p = `${base}/${dir}`
  const states = json(`${p}/states.json`)
  const layouts = Object.fromEntries(states.filter(s => fs.existsSync(`${p}/layout-${s.label}.json`))
    .map(s => [s.label, json(`${p}/layout-${s.label}.json`)]))
  const initial = layouts.S0
  const originalWidgets = Array.isArray(fixture) ? fixture : fixture.widgets
  same(initial.widgets, originalWidgets)
  for (const [label, layout] of Object.entries(layouts)) {
    const s = states.find(s => s.label === label).result
    assert.equal(s.viewport.width, 1440)
    assert.equal(s.viewport.height, 900)
    assert.equal(s.dark, false)
    assert.equal(s.origin, combo.state.origin)
    const collisions = []
    for (let i = 0; i < layout.widgets.length; i++) {
      const w = layout.widgets[i]
      const original = initial.widgets.find(x => x.i === w.i)
      const withoutY = widget => ({ ...widget, layout: { ...widget.layout, y: 0 } })
      same(withoutY(w), withoutY(original))
      const card = s.cards.find(c => c.id === w.i).bbox
      assert.equal(card.top - s.grid.bbox.top, 12 + w.layout.y * 48)
      assert.equal(card.height, w.layout.h * 48 - 12)
      assert.equal(card.width, 936)
      for (let k = i + 1; k < layout.widgets.length; k++) {
        const a = w.layout, b = layout.widgets[k].layout
        if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y)
          collisions.push([w.i, layout.widgets[k].i])
      }
    }
    same(collisions, [])
    assert.equal(s.grid.bbox.height, 828)
    assert.equal(s.stage.bbox.height, 861)
    assert.equal(s.stage.scrollHeight, 856)
    assert.equal(s.shell.scrollWidth, s.shell.clientWidth)
    geometries.push({ dir, label, y: layout.widgets.map(w => w.layout.y),
      stageBBoxHeight: s.stage.bbox.height, stageScrollHeight: s.stage.scrollHeight,
      gridHeight: s.grid.bbox.height, collisions })
  }
  if (dir.endsWith('r5')) {
    same(read(`${p}/layout-undo1.json`), read(`${p}/layout-S2.json`))
    same(read(`${p}/layout-undo2.json`), read(`${p}/layout-S1.json`))
    same(read(`${p}/layout-undo3.json`), read(`${p}/layout-S0.json`))
    assert.equal(states.at(-1).result.undoDisabled, true)
    assert.notDeepEqual(layouts.S0, layouts.S1)
    assert.notDeepEqual(layouts.S1, layouts.S2)
    assert.notDeepEqual(layouts.S2, layouts.S3)
  } else {
    same(read(`${p}/layout-save-draft.json`), read(`${p}/layout-saved-reentered.json`))
    same(read(`${p}/layout-save-draft.json`), read(`${p}/layout-cancel-reentered.json`))
    assert.notDeepEqual(layouts['cancel-draft'], layouts['save-draft'])
    assert.notEqual(states.find(s => s.label === 'saved-reentered').result.timeOrigin,
      states[0].result.timeOrigin)
    assert.notEqual(states.at(-1).result.timeOrigin,
      states.find(s => s.label === 'saved-reentered').result.timeOrigin)
  }
  const frameIndex = json(`${p}/frames/frames.json`)
  for (const [i, f] of frameIndex.frames.entries()) {
    assert.equal(sha(read(`${p}/frames/${f.file}`)), f.sha256)
    if (i) assert(f.metadata.timestamp > frameIndex.frames[i - 1].metadata.timestamp)
  }
  const movieProof = movie(`${p}/${dir.endsWith('r5') ? 'three-undo.mp4' : 'save-cancel.mp4'}`)
  assert.equal(movieProof.samples, frameIndex.frames.length)
  assert.equal(movieProof.width, 1440)
  assert.equal(movieProof.height, 900)
  const first = frameIndex.frames[0].metadata.timestamp
  const timeErrors = movieProof.decodeTimes.map((t, i) =>
    Math.abs(t - (frameIndex.frames[i].metadata.timestamp - first)))
  assert(Math.max(...timeErrors) <= 0.003, 'movie timestamps differ')
  const boundary = json(`${p}/boundary.json`)
  if (dir.endsWith('r5')) same(boundary.before, boundary.after)
  else {
    same(boundary.cancelBefore, boundary.after)
    const changed = Object.keys(boundary.before.data).filter(k =>
      boundary.before.data[k] !== boundary.savedRoots.data[k])
    same(changed, ['/pmtool/settings/dashboard_user.json'])
    same(Object.keys(boundary.before.data), Object.keys(boundary.savedRoots.data))
    same(boundary.before.files, boundary.after.files)
    same(boundary.before.backups, boundary.after.backups)
  }
  const manifestPath = `${p}/manifest.json`
  let manifestCount = null
  if (fs.existsSync(manifestPath)) {
    const m = json(manifestPath)
    for (const [file, hash] of Object.entries(m)) assert.equal(sha(read(`${p}/${file}`)), hash)
    manifestCount = Object.keys(m).length
  }
  frameReviews.push({ dir, rawFrames: frameIndex.frames.length, movieProof,
    maxTimestampError: Math.max(...timeErrors), manifestCount,
    rawDimensions: [...new Set(frameIndex.frames.map(f =>
      `${f.metadata.deviceWidth}x${f.metadata.deviceHeight}`))], boundary })
}
const preflight = Object.fromEntries(['noemit', 'build', 'tests', 'tests-r2', 'verify'].map(x => {
  const result = json(`${base}/build/${x}.exit.json`)
  return [x, result]
}))
assert.equal(preflight.build.exit, 0)
assert.equal(preflight['tests-r2'].exit, 0)
assert.equal(preflight.verify.exit, 0)
assert.equal(preflight.noemit.exit, 0)
const verifyText = read(`${base}/build/verify.stdout.txt`).toString()
const verifyCommands = [...verifyText.matchAll(/\[guard\] >> (scripts\/verify-[^\s]+)/g)].map(x => x[1])
assert.equal(verifyCommands.length, 95)
const result = { at: new Date().toISOString(), scope: 'A6 archived board evidence audit; not GUI execution',
  baseline: sync.baseline, sourceManifestCount: Object.keys(sync.sourceHashes).length,
  artifactManifestCount: Object.keys(artifacts.files).length,
  loaded: { ...event, independentlyVerifiedSegment: true,
    sourceBytesNotReadFromCurrentLib: true }, preflight, verifyCommands,
  geometries, frameReviews,
  gaps: ['mtime not recorded in operation boundaries', 'files/backups empty inventory does not record directory metadata',
    'export/attachment resolved roots and formal protection not captured for these GUI windows',
    'full saved dashboard disk content not archived', 'localStorage history not captured',
    'A6 host git SHA not captured in main-setup/start', 'no post-reload uncached combo/100% native menu snapshot',
    'GUI runner exact outer exit missing; stdout and final boundary are not exit records'] }
write(`${out}/audit.json`, result)
for (const entry of inventory) assert.equal(sha(read(entry.path)), entry.sha256)
write(`${out}/drift.json`, { at: new Date().toISOString(), checked: inventory.length,
  archiveByteDrift: [], boundary: 'Only enumerated archived A6 inputs; no inference about A7 or other owners.' })
console.log(JSON.stringify({ exit: 0, geometries: geometries.length,
  frames: frameReviews.map(x => x.rawFrames), movies: frameReviews.map(x => ({
    duration: x.movieProof.duration, samples: x.movieProof.samples, maxTimestampError: x.maxTimestampError })),
  verifiedArchiveInputs: inventory.length }))

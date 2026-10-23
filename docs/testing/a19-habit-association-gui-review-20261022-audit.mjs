// File-only evidence audit. No product import, network, collector or build.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { stripVTControlCharacters } from 'node:util'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = path.join(repo, 'docs/testing/a19-habit-association-gui-review-20261022')
const base = path.join(repo, 'reports/all-pending-evidence-20261021/A19')
const root = path.join(base, 'habit-association')
const read = p => fs.readFileSync(p)
const json = p => JSON.parse(read(p))
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const save = (s, value) => fs.writeFileSync(prefix + s, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const walk = p => fs.readdirSync(p, { withFileTypes: true }).flatMap(e => {
  const f = path.join(p, e.name)
  assert(!e.isSymbolicLink(), `unexpected link ${f}`)
  return e.isDirectory() ? walk(f) : [f]
}).sort()
const evidenceWalk = p => fs.readdirSync(p, { withFileTypes: true }).flatMap(e => {
  if (['dependencies', 'frozen', 'cache', 'home', 'tmp', 'runtime'].includes(e.name)) return []
  const f = path.join(p, e.name)
  assert(!e.isSymbolicLink(), `unexpected evidence link ${f}`)
  return e.isDirectory() ? evidenceWalk(f) : [f]
}).sort()
const fingerprint = p => {
  const s = fs.statSync(p, { bigint: true })
  return { path: p, bytes: Number(s.size), sha256: sha(read(p)), mtimeNs: String(s.mtimeNs), ino: String(s.ino) }
}
const candidate = json(path.join(base, 'candidate.json'))
const observations = json(path.join(root, 'observations.json'))
const references = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/a18-growth-more-gui-review-20261022.md',
  'docs/testing/a19-habit-suggestion-okr-contract-20261022-plan.md',
  'docs/testing/a19-habit-suggestion-okr-contract-20261022.md',
  'docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-plan.md',
  'docs/testing/a19-habit-suggestion-okr-independent-retest-20261022.md',
]
const sourceAutoRoot = path.join(repo, 'docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-selftmp/r3')
const originalRedRoot = path.join(repo, 'docs/testing/a19-habit-suggestion-okr-contract-20261022-selftmp/r1')
const oldBase = path.join(repo, 'reports/all-pending-evidence-20261021/A18')
const oldCandidate = json(path.join(oldBase, 'candidate.json'))
const originalGui = path.join(oldBase, 'growth-more')
const fixture = json(path.join(base, 'final/seed/exit.json')).file
const protectedFiles = () => [...new Set([
  ...walk(root), ...walk(path.join(base, 'final')),
  ...['build', 'build-r2', 'build-final', 'build-fixture-supplement'].flatMap(n => walk(path.join(base, n))),
  ...['candidate.json', 'product-tracked.patch', 'new-inputs.json', 'source-auto-handoff.json'].map(n => path.join(base, n)),
  ...references.map(p => path.join(repo, p)),
  ...evidenceWalk(originalRedRoot), ...evidenceWalk(sourceAutoRoot), ...walk(originalGui),
  ...Object.keys(candidate.sourceHashes).map(p => path.join(candidate.tree, p)),
  ...Object.keys(candidate.artifacts).map(p => path.join(candidate.tree, p)),
  ...Object.keys(candidate.fixtureInputs).flatMap(p => [path.join(repo, p), path.join(candidate.tree, p)]),
  ...Object.entries(candidate.inheritedLauncherProbeInputs).flatMap(([p, v]) => [path.join(candidate.tree, p), v.origin]),
  ...Object.keys(oldCandidate.sourceHashes).map(p => path.join(oldCandidate.tree, p)),
  ...Object.keys(oldCandidate.artifacts).map(p => path.join(oldCandidate.tree, p)),
  fixture,
])].sort()
const frozen = () => protectedFiles().map(fingerprint)
const checks = []
const check = (name, fn) => { fn(); checks.push({ name, verified: true }) }
const sj = (s, n) => json(path.join(root, s, n + '.json'))
const raw = (s, table) => Object.fromEntries(fs.readdirSync(path.join(root, s, 'raw', table)).sort()
  .map(n => [n.slice(0, -5), json(path.join(root, s, 'raw', table, n)).record]))
const inbox = s => raw(s, 'settings').pmHabitInbox?.value.entries ?? []
const diff = (a, b) => Object.fromEntries(Object.keys(a).map(r => [r, {
  added: Object.keys(b[r]).filter(n => !(n in a[r])).sort(),
  removed: Object.keys(a[r]).filter(n => !(n in b[r])).sort(),
  changed: Object.keys(a[r]).filter(n => n in b[r] && a[r][n] !== b[r][n]).sort(),
}]))
const empty = () => ({ added: [], removed: [], changed: [] })
const steps = observations.steps.map(s => s.step).sort((a, b) => Number(a.split('-').at(-1)) - Number(b.split('-').at(-1)))
const good = steps.filter(s => sj(s, 'exit').exit === 0)
const first = 'host-open-1792634770204'
const pending = 'nav-1792634874169'
const confirm = 'confirm-1792634886688'
const ignore = 'ignore-1792634894762'
const reenter = 'reenter-1792634905223'
const update = 'command-1792634928532'
const parentId = 'okr-mvi5z847-33y3xk'
const newHabitId = 'habit-mviwizum-xt2ji6'
const ids = ['habitsug-mviwgthg-lmdjlu', 'habitsug-mviwh2or-orovb8', 'habitsug-mviwhbc8-a95d2k', 'habitsug-mviwhikk-v0e83e']
const missingId = 'okr-qa-missing-original-reference'
const suggestions = s => sj(s, 'view').suggestions
const item = (s, id) => suggestions(s).find(n => n.id === id)
const action = process.argv[2]

try {
if (action === 'freeze') {
  save('-before.json', { at: new Date().toISOString(), pid: process.pid, files: frozen(),
    excluded: 'Main dynamic source/livingdocs, other in-flight evidence, live data, services, credentials, dependencies and caches' })
  console.log(JSON.stringify({ action, files: protectedFiles().length, pid: process.pid }))
} else if (action === 'audit') {
  check('limited protected files unchanged at audit start', () => assert.deepEqual(frozen(), json(prefix + '-before.json').files))
  const index = json(path.join(root, 'index.json'))
  let frameCount = 0, rawFiles = 0, snapshotCount = 0
  check('699 original files: exact list, SHA, bytes; all JSON parses', () => {
    assert.equal(index.files.length, 699)
    assert.deepEqual(walk(root).filter(p => p !== path.join(root, 'index.json')).map(p => path.relative(root, p)), index.files.map(n => n.path).sort())
    for (const row of index.files) {
      const p = path.join(root, row.path)
      assert.equal(read(p).length, row.bytes)
      assert.equal(sha(read(p)), row.sha256)
      if (p.endsWith('.json')) json(p)
      if (p.endsWith('.jpg')) frameCount++
    }
  })
  check('candidate 531 source inputs, 453 artifacts, patch, new-inputs, explicit 5 inherited probes', () => {
    assert.equal(Object.keys(candidate.sourceHashes).length, 531)
    assert.equal(Object.keys(candidate.artifacts).length, 453)
    for (const group of [candidate.sourceHashes, candidate.artifacts]) {
      for (const [p, h] of Object.entries(group)) assert.equal(sha(read(path.join(candidate.tree, p))), h, p)
    }
    assert.equal(sha(read(path.join(base, 'product-tracked.patch'))), candidate.trackedPatchSHA)
    assert.equal(sha(read(path.join(base, 'new-inputs.json'))), candidate.newInputsSHA)
    assert.equal(Object.keys(candidate.inheritedLauncherProbeInputs).length, 5)
    for (const [p, v] of Object.entries(candidate.inheritedLauncherProbeInputs)) {
      assert.equal(sha(read(path.join(candidate.tree, p))), v.sha256)
      assert.equal(sha(read(v.origin)), v.sha256)
      assert(!fs.existsSync(path.join(repo, p)), `do not misattribute inherited probe to Main: ${p}`)
    }
  })
  check('SOURCE/AUTO signed source exactly matches actual candidate', () => {
    const approval = json(path.join(base, 'source-auto-handoff.json'))
    assert.equal(sha(read(path.join(repo, approval.independentReport))), approval.independentReportSHA)
    assert.equal(approval.limitedSourceAuto, 'PASS')
    assert.equal(candidate.sourceHashes['packages/dsh-pm-tool/src/client/views/habits.tsx'], approval.habitsSourceSHA)
    assert.equal(candidate.sourceHashes['packages/dsh-pm-tool/src/client/views/habits-suggestion-okr.test.tsx'], approval.authorTestSHA)
  })
  check('build and regression receipts retain failed first coverage and final successful rounds', () => {
    assert.equal(json(path.join(base, 'build-r2/coverage.exit.json')).exit, 1)
    for (const row of candidate.rows) assert.equal(row.exit, 0, row.label)
    for (const [name, pattern] of [
      ['coverage', /Test Files\s+150 passed[\s\S]*Tests\s+1563 passed/],
      ['guard', /脚本：共 95，通过 95，失败 0[\s\S]*污染 0/],
      ['launcher-test', /# tests 56[\s\S]*# pass 56[\s\S]*# fail 0/],
    ]) assert.match(stripVTControlCharacters(read(path.join(base, 'build-fixture-supplement', name + '.stdout.txt')).toString()), pattern)
    assert.equal(json(path.join(base, 'build/preparation-interrupted.json')).buildStarted, false)
    const proof = json(path.join(base, 'build-final/proof.json'))
    assert.equal(proof.oldStandaloneProbeCount, 5)
    assert.match(proof.originalFinalizerError, /FileNotFoundError/)
  })
  check('531-input candidate identity and complete loaded client bound to new 3249 host', () => {
    const loaded = json(path.join(base, 'final/loaded/result.json'))
    const event = loaded.events[0], match = event.matches[0]
    assert.equal(sha(read(path.join(base, 'candidate.json'))), observations.candidateSHA)
    assert.equal(sha(read(path.join(base, 'final/loaded/result.json'))), observations.loadedSHA)
    assert.equal(loaded.targetId, observations.targetId)
    assert.equal(loaded.state.timeOrigin, observations.timeOrigin)
    assert.equal(loaded.state.origin, observations.origin)
    const combo = read(path.join(base, 'final/loaded/combo-1.txt'))
    assert.equal(combo.length, 2579410)
    assert.equal(sha(combo), event.responseSha)
    const client = read(path.join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js')).toString()
    const normalized = client.replace(/(?:\r?\n)?\/\/# sourceURL=[^\r\n]+(?:\r?\n)?$/, '')
      .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '') + '\n;\n'
    assert.equal(sha(Buffer.from(normalized)), match.segmentSha)
    assert.equal(Buffer.byteLength(normalized), match.segmentBytes)
    const offset = combo.indexOf(Buffer.from(normalized))
    assert.equal(offset, match.first)
    assert.equal(combo.indexOf(Buffer.from(normalized), offset + 1), -1)
    assert.equal(match.uniqueComplete, true)
    assert.equal(match.sourceSha, candidate.artifacts['packages/dsh-pm-tool/lib/client.js'])
    const host = json(path.join(base, 'final/host-start.json'))
    assert.equal(host.pid, 86987)
    assert.equal(host.plugin, path.join(candidate.tree, 'packages/dsh-pm-tool'))
    assert.equal(json(path.join(base, 'final/host-ready.json')).pid, host.pid)
  })
  const rows = []
  check('19 steps, 18 successful, 1 original nav timeout; actual pages share origin/timeOrigin', () => {
    assert.equal(steps.length, 19)
    assert.equal(good.length, 18)
    assert.equal(sj('nav-1792634827620', 'exit').exit, 1)
    assert.match(sj('nav-1792634827620', 'exit').error, /30000ms/)
    assert(!fs.existsSync(path.join(root, 'nav-1792634827620/after-roots.json')))
    for (const s of good) {
      const actual = sj(s, 'actual'), view = sj(s, 'view')
      assert.equal(actual.origin, observations.origin)
      assert.equal(actual.timeOrigin, observations.timeOrigin)
      assert.equal(view.origin, observations.origin)
      assert.equal(view.timeOrigin, observations.timeOrigin)
      const recomputed = diff(sj(s, 'before-roots'), sj(s, 'after-roots'))
      assert.deepEqual(recomputed, observations.steps.find(n => n.step === s).rootDiff)
      rows.push({ step: s, exit: 0, rootDiff: recomputed, width: view.layout.innerWidth })
    }
  })
  let requests = 0, events = 0
  const commands = []
  check('complete requests correspond one-to-one to user run/done, snapshots to raw', () => {
    for (const s of steps) {
      const ev = sj(s, 'commands').map(n => n.event), req = sj(s, 'requests')
      const runs = ev.filter(e => e.type === 'command/run'), dones = ev.filter(e => e.type === 'command/done')
      assert.equal(ev.length, runs.length * 2)
      assert.equal(req.length, runs.length)
      events += ev.length; requests += req.length
      for (let i = 0; i < runs.length; i++) {
        const r = runs[i], d = dones.find(e => e.data.commandId === r.data.commandId)
        assert(d)
        assert.equal(r.data.source.kind, 'user')
        assert.equal(req[i].path, '/api/commands/execute')
        assert.equal(req[i].body.payload.args.line, '/pm' + r.data.args)
        assert.deepEqual(req[i].body.payload.args.submittedAttachments, [])
        assert.equal(req[i].body.payload.args.agentId, 'session-9d713d48-47cb-4993-b794-3f1f5a085317')
        assert.equal(d.data.kind, 'success')
        commands.push({ step: s, seq: [r.seq, d.seq], line: req[i].body.payload.args.line, kind: d.data.kind })
        if (r.data.args === ' web snapshot') {
          const snap = JSON.parse(d.data.text), rawStep = good.includes(s) ? s : 'command-1792634817411'
          assert.deepEqual(snap.habitInbox, inbox(rawStep))
          assert.deepEqual(snap.habits, Object.values(raw(rawStep, 'habits')))
          assert.deepEqual(snap.okrs, Object.values(raw(rawStep, 'okrs')))
          snapshotCount++
        }
      }
    }
    assert.equal(requests, 13); assert.equal(events, 26); assert.equal(snapshotCount, 6)
  })
  check('all successful raw tables match after-root exact hashes', () => {
    for (const s of good) {
      const roots = sj(s, 'after-roots')
      for (const table of ['habits', 'okrs', 'settings', 'projects']) {
        for (const p of walk(path.join(root, s, 'raw', table))) {
          assert.equal(sha(read(p)), roots.data[`/pmtool/${table}/${path.basename(p)}`]); rawFiles++
        }
      }
    }
  })
  check('standard F5 backup: exact old habit and OKR; no fabricated missing target', () => {
    const backup = json(fixture)
    assert.deepEqual(raw(first, 'habits'), Object.fromEntries(backup.extra.habits))
    assert.deepEqual(raw(first, 'okrs'), Object.fromEntries(backup.extra.okrs))
    assert(!raw(first, 'okrs')[missingId])
    assert.equal(inbox(first).length, 0)
    assert.equal(json(path.join(base, 'final/seed/exit.json')).exit, 0)
  })
  check('4 real suggest writes: only inbox, unchanged old habit/OKR, stable initial fields', () => {
    for (const [i, s] of ['command-1792634784038', 'command-1792634795946', 'command-1792634807916', 'command-1792634817411'].entries()) {
      assert.equal(inbox(s).length, i + 1)
      assert.deepEqual(inbox(s).map(n => n.id), ids.slice(0, i + 1))
      assert.deepEqual(raw(s, 'habits'), raw(first, 'habits'))
      assert.deepEqual(raw(s, 'okrs'), raw(first, 'okrs'))
      assert.equal(inbox(s)[i].status, 'pending')
      assert.equal(inbox(s)[i].projectId, 'p-0001')
    }
    assert.equal(inbox(pending)[0].okrId, parentId)
    assert.equal(inbox(pending)[1].okrId, parentId)
    assert.equal(inbox(pending)[2].okrId, missingId)
    assert(!('okrId' in inbox(pending)[3]))
  })
  check('own-item pending/confirmed/ignored exact title+ID, rationale, state, no borrowed targets', () => {
    for (const s of [pending, confirm, ignore, reenter]) {
      for (const [i, id] of ids.entries()) {
        const n = item(s, id), record = inbox(s).find(n => n.id === id)
        assert(n); assert.equal(n.title, record.title); assert.equal(n.state, record.status)
        assert(n.text.includes(record.rationale))
        if (i < 2) assert(n.text.includes(`关联 OKR：F5目标（${parentId}）`))
        if (i === 2) {
          assert(n.text.includes(`关联 OKR：${missingId}`))
          assert(!n.text.includes('F5目标')); assert(!n.text.includes(parentId))
        }
        if (i === 3) assert(!n.text.includes('关联 OKR'))
        if (n.state !== 'pending') {
          assert(!n.text.includes('采纳并建习惯草稿')); assert(!n.text.includes('忽略\n'))
        }
      }
    }
  })
  check('confirm creates exactly one linked draft, ignore no creation, immutable original fields', () => {
    const baseline = inbox(pending)
    assert.deepEqual(Object.keys(raw(confirm, 'habits')).filter(id => !(id in raw(first, 'habits'))), [newHabitId])
    const created = raw(confirm, 'habits')[newHabitId]
    assert.equal(created.status, 'draft'); assert.equal(created.okrId, parentId)
    assert.equal(created.projectId, 'p-0001'); assert.deepEqual(created.checkIns, [])
    assert.equal(created.streak.current, 0)
    assert.deepEqual(raw(ignore, 'habits'), raw(confirm, 'habits'))
    for (const s of [confirm, ignore, reenter]) {
      for (const original of baseline) {
        const n = inbox(s).find(n => n.id === original.id)
        for (const k of ['id', 'at', 'projectId', 'title', 'rationale', 'okrId']) assert.deepEqual(n[k], original[k])
      }
      for (const [id, old] of Object.entries(raw(first, 'habits'))) assert.deepEqual(raw(s, 'habits')[id], old)
    }
    assert.equal(inbox(reenter)[0].confirmedHabitId, newHabitId)
    assert.equal(inbox(reenter)[0].status, 'confirmed')
    assert.equal(inbox(reenter)[1].status, 'ignored')
    assert.deepEqual(inbox(reenter), inbox(ignore))
  })
  const wide = 'suggestion-visible-1792634962691', narrow = 'suggestion-visible-1792634986861'
  check('real OKR update: only title/updatedAt changed, current title refresh on each own suggestion', () => {
    const before = raw(reenter, 'okrs')[parentId], after = raw(update, 'okrs')[parentId]
    for (const k of Object.keys(before).filter(k => !['title', 'updatedAt'].includes(k))) assert.deepEqual(after[k], before[k])
    assert(after.title.includes('<strong>仅供人阅读</strong>'))
    assert(after.title.includes('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.repeat(2)))
    assert.deepEqual(inbox(update), inbox(reenter))
    assert.deepEqual(raw(update, 'habits'), raw(reenter, 'habits'))
    for (const s of [wide, narrow, 'suggestion-visible-1792634996320', 'suggestion-visible-1792635005070']) {
      assert.deepEqual(inbox(s), inbox(update))
      for (const id of ids.slice(0, 2)) {
        assert(item(s, id).text.includes(`关联 OKR：${after.title}（${parentId}）`))
        assert(!item(s, id).text.includes('关联 OKR：F5目标'))
      }
    }
  })
  check('local 1440/390 layout only: body width, association row shrink/wrap, missing and no-ref unchanged', () => {
    for (const [s, width] of [[wide, 1440], [narrow, 390]]) {
      const v = sj(s, 'view')
      assert.equal(v.layout.innerWidth, width)
      assert.equal(v.layout.body.scrollWidth, width)
      assert.equal(v.layout.body.clientWidth, width)
      for (const row of v.associationRows) {
        assert.equal(row.scrollWidth, row.clientWidth)
        assert.equal(row.overflowWrap, 'anywhere')
      }
      if (width === 390) assert.equal(v.associationRows[0].clientWidth, 243)
    }
    assert(item('suggestion-visible-1792634996320', ids[2]).text.includes(`关联 OKR：${missingId}`))
    assert(!item('suggestion-visible-1792635005070', ids[3]).text.includes('关联 OKR'))
  })
  check('7 expected business writes / 11 read-only successful steps; files/backups/exports unchanged', () => {
    const writes = rows.filter(r => JSON.stringify(r.rootDiff.data) !== JSON.stringify(empty()))
    assert.equal(writes.length, 7)
    assert.equal(rows.length - writes.length, 11)
    for (const r of rows) for (const k of ['files', 'backups', 'exports']) assert.deepEqual(r.rootDiff[k], empty())
    for (const r of writes) {
      const changed = [...r.rootDiff.data.added, ...r.rootDiff.data.changed]
      assert(changed.every(p => ['/pmtool/settings/pmHabitInbox.json', `/pmtool/habits/${newHabitId}.json`, `/pmtool/okrs/${parentId}.json`].includes(p)))
    }
  })
  const gaps = []
  for (let i = 1; i < good.length; i++) {
    const delta = diff(sj(good[i - 1], 'after-roots'), sj(good[i], 'before-roots'))
    if (Object.values(delta).some(n => n.added.length + n.removed.length + n.changed.length)) gaps.push({ from: good[i - 1], to: good[i], delta })
  }
  check('inter-step changes do not mutate business tables/files/backups/exports', () => {
    for (const g of gaps) {
      for (const k of ['files', 'backups', 'exports']) assert.deepEqual(g.delta[k], empty())
      assert.deepEqual(g.delta.data.added, []); assert.deepEqual(g.delta.data.removed, [])
      assert(g.delta.data.changed.every(p => p.includes('/session_projcache/')))
    }
  })
  check('protected files unchanged after audit', () => assert.deepEqual(frozen(), json(prefix + '-before.json').files))
  save('-audit.json', { at: new Date().toISOString(), pid: process.pid, checks, rows, commands, gaps,
    counts: { indexed: index.files.length, frames: frameCount, steps: steps.length, successes: good.length, originalFailures: 1, requests, events, snapshots: snapshotCount, rawFiles },
    candidate: fingerprint(path.join(base, 'candidate.json')), loaded: fingerprint(path.join(base, 'final/loaded/result.json')),
    bounded: 'File-consistency checks support independent visual judgment; not GUI or whole-product PASS by themselves.' })
  console.log(JSON.stringify({ action, checks: checks.length, frameCount, rawFiles, requests, events, snapshotCount, gaps: gaps.length }))
} else if (action === 'supplement') {
  const prior = json(prefix + '-audit.json')
  let frames = 0
  const inversions = []
  check('all 19 compositor manifests: exact frame files/SHA, original 2 timestamp inversions retained, pageScale=1', () => {
    for (const s of steps) {
      const dir = path.join(root, s, 'frames'), manifest = json(path.join(dir, 'frames.json'))
      assert.equal(manifest.source, 'CDP Page.screencastFrame; actual browser compositor')
      assert.deepEqual(walk(dir).filter(p => p.endsWith('.jpg')).map(p => path.basename(p)), manifest.frames.map(n => n.file).sort())
      let previous
      for (const f of manifest.frames) {
        assert.equal(sha(read(path.join(dir, f.file))), f.sha256)
        if (previous && f.metadata.timestamp < previous.metadata.timestamp) {
          inversions.push({ step: s, previous, current: f, deltaSeconds: f.metadata.timestamp - previous.metadata.timestamp })
        }
        assert.equal(f.metadata.pageScaleFactor, 1)
        previous = f; frames++
      }
    }
    assert.equal(frames, prior.counts.frames)
    assert.deepEqual(inversions.map(n => [n.step, n.previous.file, n.current.file]), [
      ['command-1792634807916', '000003.jpg', '000004.jpg'],
      ['ignore-1792634894762', '000000.jpg', '000001.jpg'],
    ])
    assert.equal(inversions[1].previous.sha256, inversions[1].current.sha256)
  })
  check('each actual build/noEmit/coverage/guard/Launcher final receipt matches candidate row', () => {
    for (const row of candidate.rows) {
      const dir = ['coverage', 'guard', 'guard-selftest', 'launcher-test', 'launcher-verify'].includes(row.label)
        ? 'build-fixture-supplement' : 'build-r2'
      const receipt = json(path.join(base, dir, row.label + '.exit.json'))
      for (const k of ['label', 'argv', 'cwd', 'pid', 'exit', 'start', 'end']) assert.deepEqual(receipt[k], row[k], row.label + ':' + k)
      assert.equal(receipt.exit, 0)
    }
  })
  check('confirmed/ignored changes only permitted processing fields, original entries fully preserved', () => {
    const omit = (n, keys) => Object.fromEntries(Object.entries(n).filter(([k]) => !keys.includes(k)))
    const before = inbox(pending)
    for (const s of [confirm, ignore, reenter]) {
      for (const [i, n] of inbox(s).entries()) {
        assert.deepEqual(omit(n, ['status', 'processedAt', 'confirmedHabitId', 'ignoredAt']), omit(before[i], ['status', 'processedAt', 'confirmedHabitId', 'ignoredAt']))
      }
    }
    assert.deepEqual(inbox(confirm).slice(1), before.slice(1))
    assert.deepEqual(inbox(ignore)[0], inbox(confirm)[0])
    assert.deepEqual(inbox(ignore).slice(2), inbox(confirm).slice(2))
    assert.deepEqual(raw(ignore, 'habits'), raw(reenter, 'habits'))
  })
  check('old habit-card renderer/CSS unchanged from original A18; missing suggest is legal before confirm', () => {
    const css = 'packages/dsh-pm-tool/src/client/panel.css'
    assert.equal(candidate.sourceHashes[css], oldCandidate.sourceHashes[css])
    const source = read(path.join(candidate.tree, 'packages/dsh-pm-tool/src/client/views/habits.tsx')).toString()
    const old = read(path.join(oldCandidate.tree, 'packages/dsh-pm-tool/src/client/views/habits.tsx')).toString()
    const card = text => text.slice(text.indexOf('<section className="pm-habit-list"'), text.indexOf('{/* 收件区入口'))
    assert(card(source).length > 0)
    assert.equal(card(source), card(old))
    const core = read(path.join(candidate.tree, 'packages/dsh-pm-tool/src/core/habits.ts')).toString()
    assert(core.includes('okrId 存在性留到 confirm 时校验'))
    assert(core.includes('validateHabitOkr(domain, suggestion.projectId, suggestion.okrId)'))
  })
  check('bounded originals/candidates remain intact at supplement', () => assert.deepEqual(frozen(), json(prefix + '-before.json').files))
  save('-supplement.json', { at: new Date().toISOString(), pid: process.pid, checks, frames, inversions,
    boundary: 'Extra file checks only, no new GUI cases or old A18 review' })
  console.log(JSON.stringify({ action, checks: checks.length, frames }))
} else if (action === 'visual') {
  const selected = json(prefix + '-visual-selection.json')
  const files = selected.files.map(n => ({ ...n, ...fingerprint(path.join(base, n.path)) }))
  save('-visual.json', { at: new Date().toISOString(), pid: process.pid, files,
    counts: { png: files.filter(n => n.path.endsWith('.png')).length, jpg: files.filter(n => n.path.endsWith('.jpg')).length },
    boundary: 'Selected originals were independently viewed with view_image; fingerprinting itself is not visual review.' })
  console.log(JSON.stringify({ action, files: files.length }))
} else if (action === 'seal') {
  assert.deepEqual(frozen(), json(prefix + '-before.json').files)
  const owned = fs.readdirSync(path.dirname(prefix)).filter(n => n.startsWith(path.basename(prefix)) && !n.endsWith('-seal.json'))
    .map(n => fingerprint(path.join(path.dirname(prefix), n)))
  save('-seal.json', { at: new Date().toISOString(), pid: process.pid, files: protectedFiles().length,
    drift: [], owned, released: true, childrenStarted: 0, guiConnections: 0, buildActions: 0, serviceActions: 0,
    boundary: 'Bounded independent evidence review finished. No Main/source/GUI/service lock, no commit, no global matrix sign-off.' })
  console.log(JSON.stringify({ action, files: protectedFiles().length, drift: 0, released: true }))
} else {
  throw Error('expected freeze, audit, supplement, visual or seal')
}
} catch (error) {
  save(`-failure-${action}-${Date.now()}.json`, { at: new Date().toISOString(), pid: process.pid,
    originalExit: 1, error: String(error), stack: error.stack, checks,
    scriptSHA: sha(read(prefix + '-audit.mjs')), boundary: 'Own file audit failure, original evidence untouched' })
  throw error
}

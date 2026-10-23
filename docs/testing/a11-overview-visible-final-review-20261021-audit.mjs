import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { isDeepStrictEqual as equal } from 'node:util'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a11-overview-visible-final-review-20261021'
const own = `${prefix}-selftmp`
const old = 'docs/testing/a11-overview-done-gui-review-20261021'
const a11 = 'reports/all-pending-evidence-20261021/A11'
const obj = `${a11}/objective`
const tree = '/private/tmp/pmtool-all-closure-20261021'
const fixture = 'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5'
const target = '/pmtool/tasks/t-0003.json'
const abs = p => path.resolve(repo, p)
const bytes = p => fs.readFileSync(abs(p))
const json = p => JSON.parse(bytes(p))
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const facts = p => {
  const s = fs.lstatSync(abs(p))
  assert(s.isFile() && !s.isSymbolicLink(), `Not regular original: ${p}`)
  const b = bytes(p)
  return { sha256: sha(b), bytes: b.length, mtimeMs: s.mtimeMs }
}
const scan = (p, out) => {
  const s = fs.lstatSync(abs(p))
  assert(!s.isSymbolicLink(), `No symlink traversal: ${p}`)
  if (s.isDirectory()) for (const n of fs.readdirSync(abs(p)).sort()) scan(path.join(p, n), out)
  else out[p] = facts(p)
}
const put = (label, data) => {
  assert(/^[a-z0-9-]+$/.test(label))
  const dest = abs(`${own}/${label}.json`)
  assert(dest.startsWith(abs(`${own}/`)))
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
}
const delta = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(p => !equal(a[p], b[p])).map(p => ({ path: p, before: a[p] ?? null, after: b[p] ?? null }))
const env = () => ({ at: new Date().toISOString(), localAt: new Date().toString(),
  node: process.version, executable: process.execPath, argv: process.argv,
  os: process.platform, arch: process.arch, cwd: process.cwd() })
const mainMismatch = candidate => Object.entries(candidate.sourceHashes).flatMap(([p, expected]) => {
  const actual = fs.existsSync(abs(p)) ? facts(p).sha256 : null
  return actual === expected ? [] : [{ path: p, expected, actual }]
})
const [mode, label] = process.argv.slice(2)
assert(label && /^[a-z0-9-]+$/.test(label))

try {
  if (mode === 'freeze') {
    const inputs = {}
    const roots = ['AGENTS.md', 'docs/collaboration.md', a11,
      `${fixture}/f2.json`, `${fixture}/f2-backup.json`,
      'docs/testing/a10-objective-gui-independent-review-20261021.md',
      'docs/testing/a11-overview-done-independent-retest-20261021.md',
      'docs/testing/a11-overview-done-independent-retest-20261021-plan.md',
      'docs/testing/remaining-objective-cases-20261021.md',
      ...fs.readdirSync(abs('docs/testing')).filter(n => n.startsWith(path.basename(old)))
        .map(n => `docs/testing/${n}`)]
    for (const p of roots) scan(p, inputs)
    const candidate = json(`${a11}/candidate.json`)
    const staticFiles = {}
    for (const [p, expected] of Object.entries({ ...candidate.sourceHashes, ...candidate.artifacts })) {
      const original = path.join(tree, p)
      staticFiles[original] = facts(original)
      assert.equal(staticFiles[original].sha256, expected, `A11 identity mismatch: ${p}`)
    }
    const oldInputs = json(`${old}-selftmp/inputs.json`)
    const historicalDrift = Object.entries(oldInputs.inputs).flatMap(([p, expected]) =>
      equal(facts(p), expected) ? [] : [{ path: p, expected, actual: facts(p) }])
    assert.deepEqual(historicalDrift, [])
    const originalStaticDrift = Object.entries(oldInputs.staticFiles).flatMap(([p, expected]) =>
      equal(facts(p), expected) ? [] : [{ path: p, expected, actual: facts(p) }])
    assert.deepEqual(originalStaticDrift, [])
    const mainFiles = Object.fromEntries(Object.keys(candidate.sourceHashes).map(p => [p, facts(p)]))
    put(label, { ...env(), inputs, staticFiles, mainFiles, roots,
      sourceCount: Object.keys(candidate.sourceHashes).length,
      artifactCount: Object.keys(candidate.artifacts).length,
      mainMismatch: mainMismatch(candidate), historicalDrift, originalStaticDrift,
      groups: Object.fromEntries(['manual-visible-r3', 'checklist-visible-r3'].map(g =>
        [g, Object.keys(inputs).filter(p => p.startsWith(`${obj}/${g}/`)).length])),
      boundary: 'Static originals only; no product/helper import, GUI, build, service, credentials or private runtime reads.' })
    console.log(JSON.stringify({ mode, label, inputs: Object.keys(inputs).length,
      staticFiles: Object.keys(staticFiles).length, mainMismatch: mainMismatch(candidate), ...env() }, null, 2))
  } else {
    const frozen = json(`${own}/inputs-r1.json`)
    const locked = p => {
      assert(frozen.inputs[p], `Not frozen: ${p}`)
      assert.deepEqual(facts(p), frozen.inputs[p], `Evidence drift: ${p}`)
      return bytes(p)
    }
    const j = p => JSON.parse(locked(p))
    const candidate = j(`${a11}/candidate.json`)
    if (mode === 'finish') {
      const check = map => Object.entries(map).flatMap(([p, expected]) =>
        !fs.existsSync(abs(p)) ? [{ path: p, missing: true }] :
          equal(facts(p), expected) ? [] : [{ path: p, expected, actual: facts(p) }])
      const evidenceDrift = check(frozen.inputs), staticDrift = check(frozen.staticFiles)
      const originalFreeze = j(`${old}-selftmp/inputs.json`)
      const historicalInputDrift = check(originalFreeze.inputs)
      const historicalStaticDrift = check(originalFreeze.staticFiles)
      const currentInputs = {}
      for (const p of frozen.roots) scan(p, currentInputs)
      const additions = Object.keys(currentInputs).filter(p => !frozen.inputs[p])
      const unrelatedAdditions = additions.filter(p =>
        p.startsWith(`${a11}/finder/`) || p.startsWith(`${a11}/materials/`))
      const scopedAdditions = additions.filter(p => !unrelatedAdditions.includes(p))
      const mainDrift = check(frozen.mainFiles)
      const ownFiles = {}
      for (const n of fs.readdirSync(abs('docs/testing')).filter(n => n.startsWith(path.basename(prefix))))
        scan(`docs/testing/${n}`, ownFiles)
      const brokenLinks = [], trailingWhitespace = []
      for (const p of Object.keys(ownFiles).filter(p => /\.(md|mjs|swift)$/.test(p))) {
        const text = bytes(p).toString()
        text.split('\n').forEach((line, i) => {
          if (/[ \t]+$/.test(line)) trailingWhitespace.push({ path: p, line: i + 1 })
        })
        assert(text.endsWith('\n'), `Missing final newline: ${p}`)
        if (p.endsWith('.md')) for (const m of text.matchAll(/\]\(([^)]+)\)/g)) {
          if (/^(?:https?:|#)/.test(m[1])) continue
          const linked = path.resolve(path.dirname(abs(p)), m[1].split('#')[0])
          // The report may link to this check's own JSON, created immediately below.
          if (!fs.existsSync(linked) && linked !== abs(`${own}/${label}.json`))
            brokenLinks.push({ path: p, link: m[1] })
        }
      }
      for (const p of Object.keys(ownFiles).filter(p => p.endsWith('.json'))) json(p)
      put(label, { ...env(), evidenceCount: Object.keys(frozen.inputs).length,
        staticCount: Object.keys(frozen.staticFiles).length, evidenceDrift, staticDrift, additions,
        scopedAdditions, unrelatedAdditions,
        historicalInputCount: Object.keys(originalFreeze.inputs).length,
        historicalStaticCount: Object.keys(originalFreeze.staticFiles).length,
        historicalInputDrift, historicalStaticDrift,
        mainDrift, mainMismatch: mainMismatch(candidate), ownFiles, brokenLinks, trailingWhitespace,
        boundary: 'Only registered originals/static tree and current declared source; not live service health or whole-system zero-write.' })
      assert(fs.existsSync(abs(`${own}/${label}.json`)))
      assert.deepEqual(evidenceDrift, [])
      assert.deepEqual(staticDrift, [])
      assert.deepEqual(historicalInputDrift, [])
      assert.deepEqual(historicalStaticDrift, [])
      assert.deepEqual(scopedAdditions, [])
      assert.deepEqual(mainDrift, [])
      assert.deepEqual(brokenLinks, [])
      assert.deepEqual(trailingWhitespace, [])
      console.log(JSON.stringify({ mode, label, evidenceCount: Object.keys(frozen.inputs).length,
        staticCount: Object.keys(frozen.staticFiles).length, evidenceDrift, staticDrift,
        scopedAdditions, unrelatedAdditionCount: unrelatedAdditions.length,
        mainDrift, mainMismatch: mainMismatch(candidate), brokenLinks, trailingWhitespace }))
    } else {
      assert.equal(mode, 'review')
      assert.deepEqual(candidate.artifacts, j(`${a11}/build/artifacts.json`))
      const sync = j(`${a11}/build/sync.json`)
      assert.deepEqual(candidate.sourceHashes, sync.sourceHashes)
      assert.deepEqual(sync.drift, [])
      assert.deepEqual(candidate.postDrift, [])
      assert.equal(sha(locked(`${a11}/product-tracked.patch`)), candidate.trackedPatchSha)
      const loaded = j(`${obj}/loaded-r2/result.json`)
      assert.equal(loaded.events.length, 1)
      const event = loaded.events[0], match = event.matches[0]
      const response = locked(`${obj}/loaded-r2/${event.file}`)
      const clientPath = path.join(tree, 'packages/dsh-pm-tool/lib/client.js')
      assert.deepEqual(facts(clientPath), frozen.staticFiles[clientPath])
      const client = bytes(clientPath)
      const normalized = client.toString()
        .replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
        .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
      const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
      const first = response.indexOf(segment), second = response.indexOf(segment, first + 1)
      assert.equal(event.status, 200)
      assert.equal(event.fromDiskCache, false)
      assert.equal(response.length, event.bytes)
      assert.equal(sha(response), event.responseSha)
      assert.equal(sha(client), candidate.artifacts['packages/dsh-pm-tool/lib/client.js'])
      assert.equal(sha(client), match.sourceSha)
      assert.equal(first, match.first)
      assert.equal(second, -1)
      assert.equal(segment.length, match.segmentBytes)
      assert.equal(sha(segment), match.segmentSha)
      assert.equal(match.uniqueComplete, true)
      assert.equal(loaded.state.origin, 'http://127.0.0.1:3225')
      assert.equal(loaded.state.pmMounted, true)
      assert.equal(loaded.state.pilot, 'off')
      const runtime = j(`${old}-selftmp/snapshot/objective-start.json`)
      const setup = j(`${a11}/environment.json`).setups.find(s => s.label === 'objective')
      assert.equal(runtime.pid, 32660)
      assert.equal(runtime.port, 3225)
      assert.equal(runtime.hostGitHead, candidate.hostGitHead)
      for (const k of ['label', 'port', 'root', 'plugin', 'patchSha'])
        assert.deepEqual(runtime[k], setup[k])
      const initial = j(`${fixture}/f2-backup.json`), oracle = j(`${fixture}/f2.json`)
      assert.equal(oracle.today, '2026-10-21')
      assert.deepEqual(initial.tasks, oracle.tasks)
      assert.equal(sha(locked(`${fixture}/f2-backup.json`)),
        '451ce27c0b84c61419a6770dee27bf70795fef24b081e6be73c551bd9e7a1d8b')
      assert.deepEqual(initial.tasks.filter(t => t.status === 'done').map(t => t.id), ['t-0007', 't-0008'])
      assert.deepEqual(initial.tasks.filter(t => t.status === 'wrapped').map(t => t.id), ['t-0010'])
      const seed = j(`${obj}/seed/boundary.json`)
      const encodedFixture = [...initial.projects.map(record => ({ table: 'projects', record })),
        ...initial.tasks.map(record => ({ table: 'tasks', record }))].map(({ table, record }) => {
        const key = `/pmtool/${table}/${record.id}.json`
        const hash = sha(Buffer.from(JSON.stringify({ version: 2, record }, null, 2) + '\n'))
        assert.equal(hash, seed.after.data[key])
        return { key, sha256: hash, record }
      })
      const groups = {}, states = [], frames = []
      for (const [g, file, count] of [['manual-visible-r3', 'observations', 15], ['checklist-visible-r3', 'records', 9]]) {
        const root = `${obj}/${g}`, rows = j(`${root}/${file}.json`)
        assert.equal(rows.length, count)
        const boundary = j(`${root}/boundary.json`), outer = j(`${root}/outer-exit.json`)
        assert.equal(outer.exit, 0)
        const changes = delta(boundary.before, boundary.after)
        assert.deepEqual(changes.filter(d => d.path.startsWith('/pmtool/')).map(d => d.path), [target])
        assert(changes.every(d => d.path === target || d.path.startsWith('/session_projcache/')))
        for (const e of encodedFixture.filter(e => e.key !== target))
          assert.equal(boundary.before[e.key], e.sha256, `Non-target original fixture: ${e.key}`)
        const base = initial.tasks.find(t => t.id === 't-0003')
        for (const row of rows) {
          const rawPath = `${root}/${row.label}-original-task.json`, raw = j(rawPath)
          assert.deepEqual(raw, row.task)
          assert.equal(raw.version, 2)
          const r = raw.record, checked = g.startsWith('checklist') && row.label.startsWith('checked')
          const stable = v => Object.fromEntries(Object.entries(v).filter(([k]) =>
            !['updatedAt', 'manualProgress', 'manualProgressNote', 'checklist'].includes(k)))
          assert.deepEqual(stable(r), stable(base))
          assert.deepEqual(r.checklist, base.checklist.map((item, i) => i === 1 ? { ...item, done: checked } : item))
          const s = j(`${root}/${row.label}.json`)
          assert.deepEqual(s.pm, row.pm)
          if (row.fields) assert.deepEqual(s.fields, row.fields)
          assert(Date.parse(r.updatedAt) <= Date.parse(s.at))
          row.rawPath = rawPath
          row.rawSha = sha(locked(rawPath))
          row.stateAt = s.at
          if (row.root) {
            assert.equal(row.root[target], row.rawSha)
            assert.deepEqual(Object.keys(row.root).sort(), Object.keys(boundary.before).sort())
            assert(delta(boundary.before, row.root).every(d => d.path === target || d.path.startsWith('/session_projcache/')))
            assert.equal(r.manualProgress, null)
            assert(!Object.hasOwn(r, 'manualProgressNote'))
          }
          for (const name of [row.label, ...(row.label.endsWith('-overview') ? [`${row.label}-lower`] : [])]) {
            const state = j(`${root}/${name}.json`), png = locked(`${root}/${name}.png`)
            assert.equal(state.origin, loaded.state.origin)
            assert.equal(state.timeOrigin, loaded.state.timeOrigin)
            assert.equal(state.pathname, '/')
            assert.equal(state.dark, false)
            assert.equal(state.viewport.width, 1440)
            assert.equal(state.viewport.height, 900)
            assert.equal(png.subarray(1, 4).toString(), 'PNG')
            assert.equal(png.readUInt32BE(16), 1440)
            assert.equal(png.readUInt32BE(20), 900)
            if (name.includes('-overview')) {
              assert(state.pm.text.includes('任务完成\n2/10\n20% 已完成'))
              assert(state.pm.text.includes('任务完成率\n20%\n2 / 10\n完成\n2\n进行\n0\n待办\n7\n受阻\n0\n收尾\n1'))
              assert(state.pm.text.includes(`F2-P\n${checked ? 88 : 63}%`))
            }
            states.push({ group: g, label: name, ...state, pngSha: sha(png) })
          }
        }
        const fm = j(`${root}/frames/frames.json`)
        let last = 0
        for (const f of fm.frames) {
          assert.equal(sha(locked(`${root}/frames/${f.file}`)), f.sha256)
          assert(Date.parse(f.at) >= last)
          last = Date.parse(f.at)
          frames.push({ group: g, ...f })
        }
        groups[g] = { rows, boundary, outer, changes, frameMeta: fm }
      }
      const manual = groups['manual-visible-r3'], checklist = groups['checklist-visible-r3']
      assert.deepEqual(manual.rows.map(r => r.label), ['manual30', 'manual0', 'clear']
        .flatMap(v => ['draft', 'tasks', 'overview', 'gantt', 'reopened'].map(s => `${v}-${s}`)))
      assert.equal(manual.rows[0].rawSha, manual.boundary.before[target])
      const oldFinal = j(`${obj}/checklist-r2/unchecked-reopened-original-task.json`)
      assert.deepEqual(manual.rows[0].task, oldFinal)
      const interStageChanges = delta(j(`${obj}/checklist-r2/boundary.json`).after, manual.boundary.before)
      assert(interStageChanges.every(d => d.path.startsWith('/session_projcache/')))
      let prior = manual.rows[0].task
      for (const [i, value] of [[0, 30], [5, 0], [10, null]]) {
        assert.deepEqual(manual.rows[i].task, prior)
        const saved = manual.rows[i + 1].task
        assert.equal(saved.record.manualProgress, value)
        if (value === null) assert(!Object.hasOwn(saved.record, 'manualProgressNote'))
        else assert.equal(saved.record.manualProgressNote, 'QA人工口径来源')
        assert(Date.parse(saved.record.updatedAt) > Date.parse(prior.record.updatedAt))
        for (const row of manual.rows.slice(i + 1, i + 5)) assert.deepEqual(row.task, saved)
        for (const row of [manual.rows[i], manual.rows[i + 4]]) {
          const fields = j(`${obj}/manual-visible-r3/${row.label}.json`).fields
          assert.equal(fields.find(f => f.placeholder === '留空即回落客观进度').value, value === null ? '' : String(value))
          assert.equal(fields.find(f => f.placeholder === '记录为何人工设定，便于追溯口径').value,
            value === null ? '' : 'QA人工口径来源')
        }
        prior = saved
      }
      assert.equal(manual.rows.at(-1).rawSha, manual.boundary.after[target])
      const betweenJourneys = delta(manual.boundary.after, checklist.boundary.before)
      assert(betweenJourneys.every(d => d.path.startsWith('/session_projcache/')))
      assert.deepEqual(checklist.rows.map(r => r.label), ['initial', 'checked', 'checked-overview',
        'checked-gantt', 'checked-reopened', 'unchecked', 'unchecked-overview', 'unchecked-gantt', 'unchecked-reopened'])
      assert.deepEqual(checklist.rows[0].task, manual.rows.at(-1).task)
      for (const [from, to] of [[1, 5], [5, 9]]) {
        assert(Date.parse(checklist.rows[from].task.record.updatedAt) >
          Date.parse(checklist.rows[from - 1].task.record.updatedAt))
        for (const row of checklist.rows.slice(from, to)) assert.deepEqual(row.task, checklist.rows[from].task)
      }
      assert.equal(checklist.rows.at(-1).rawSha, checklist.boundary.after[target])
      const stripTime = r => Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'updatedAt'))
      assert.deepEqual(stripTime(checklist.rows[0].task.record), stripTime(checklist.rows.at(-1).task.record))
      const zoom = j(`${obj}/native-zoom/execution.json`)
      assert.equal(zoom.browserPID, 29351)
      assert.equal(zoom.window, 23677)
      assert.equal(zoom.origin, loaded.state.origin)
      put(label, { ...env(), candidate: { baseline: candidate.baseline, hostGitHead: candidate.hostGitHead,
        trackedPatchSha: candidate.trackedPatchSha, sourceCount: frozen.sourceCount, artifactCount: frozen.artifactCount,
        mainMismatch: mainMismatch(candidate) },
      loading: { responseBytes: response.length, responseSha: sha(response), clientBytes: client.length,
        clientSha: sha(client), segmentBytes: segment.length, segmentSha: sha(segment), first, second, state: loaded.state },
      runtime,
      fixture: { today: oracle.today, encodedFixture, doneRate: 20 }, zoom, interStageChanges, betweenJourneys, groups, states, frames,
      boundary: 'Static assertions only. Visual decisions separate; no whole OP/B8/A12/release, new native zoom or fresh-fixture claim.' })
      console.log(JSON.stringify({ mode, label, rows: 24, states: states.length, frames: frames.length,
        groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, { changes: v.changes, outer: v.outer }])),
        loading: { sha: sha(response), first, second }, ...env() }, null, 2))
    }
  }
} catch (error) {
  put(`${label}-failure`, { ...env(), mode, scriptSha: sha(bytes(`${prefix}-audit.mjs`)), error: error.stack })
  throw error
}

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { isDeepStrictEqual as equal } from 'node:util'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a11-overview-done-gui-review-20261021'
const own = `${prefix}-selftmp`
const a11 = 'reports/all-pending-evidence-20261021/A11'
const objective = `${a11}/objective`
const fixture = 'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5'
const target = '/pmtool/tasks/t-0003.json'
const abs = p => path.resolve(repo, p)
const read = p => fs.readFileSync(abs(p))
const json = p => JSON.parse(read(p).toString())
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const facts = p => {
  const stat = fs.lstatSync(abs(p))
  assert(stat.isFile() && !stat.isSymbolicLink(), `Not regular original: ${p}`)
  const b = read(p)
  return { sha256: sha(b), bytes: b.length, mtimeMs: stat.mtimeMs }
}
const scan = (p, out) => {
  const stat = fs.lstatSync(abs(p))
  assert(!stat.isSymbolicLink(), `No symlink traversal: ${p}`)
  if (stat.isDirectory()) {
    for (const n of fs.readdirSync(abs(p)).sort()) scan(path.join(p, n), out)
  } else {
    assert(stat.isFile(), `Unexpected evidence type: ${p}`)
    out[p] = facts(p)
  }
}
const output = (name, body) => {
  const p = abs(`${own}/${name}.json`)
  assert(p.startsWith(abs(prefix)), 'Write boundary')
  fs.writeFileSync(p, `${JSON.stringify(body, null, 2)}\n`, { flag: 'wx' })
}
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(p => !equal(a[p], b[p])).map(p => ({ path: p, before: a[p] ?? null, after: b[p] ?? null }))
const mode = process.argv[2]
const label = process.argv[3]
assert(label && /^[a-z0-9-]+$/.test(label), 'Unique output label required')

try {
  if (mode === 'freeze') {
    const old = json(`${own}/inputs.json`)
    const inputs = {}
    scan(objective, inputs)
    const preservedPaths = [
      `${prefix}-audit.mjs`, `${own}/inputs.json`, `${own}/observations.json`,
      `${prefix}-resume-audit.mjs`, `${own}/resume-observations-r2.json`,
      `${own}/resume-failure-r1.json`,
    ]
    const preserved = Object.fromEntries(preservedPaths.map(p => [p, facts(p)]))
    const oldInputDrift = Object.entries(old.inputs).flatMap(([p, expected]) =>
      equal(facts(p), expected) ? [] : [{ path: p, expected, actual: facts(p) }])
    assert.deepEqual(oldInputDrift, [])
    const newInputs = Object.keys(inputs).filter(p => !old.inputs[p])
    output(label, {
      at: new Date().toISOString(), node: process.version, os: process.platform, arch: process.arch,
      inputs, newInputs, preserved, oldInputDrift,
      groups: Object.fromEntries(['manual-r2', 'checklist-r2'].map(d =>
        [d, Object.keys(inputs).filter(p => p.startsWith(`${objective}/${d}/`)).length])),
      boundary: 'Original byte registration only. No execution/import of GUI helpers, product, browser, services, private paths or credentials.',
    })
    console.log(JSON.stringify({ originals: Object.keys(inputs).length, additions: newInputs.length,
      oldInputDrift, output: label }, null, 2))
  } else {
    const frozen = json(`${own}/supplement-inputs-r1.json`)
    const locked = p => {
      assert(frozen.inputs[p], `Unregistered original: ${p}`)
      assert.deepEqual(facts(p), frozen.inputs[p], `Original drift: ${p}`)
      return read(p)
    }
    const j = p => JSON.parse(locked(p).toString())
    if (mode === 'finish') {
      const current = {}
      scan(objective, current)
      const drift = diff(frozen.inputs, current)
      const partialDrift = Object.entries(frozen.preserved).flatMap(([p, expected]) =>
        equal(facts(p), expected) ? [] : [{ path: p, expected, actual: facts(p) }])
      output(label, { at: new Date().toISOString(), registered: Object.keys(frozen.inputs).length,
        drift, partialDrift, boundary: 'Full registered original size/SHA/mtime and preserved partial; no live-system claim.' })
      assert.deepEqual(drift, [])
      assert.deepEqual(partialDrift, [])
      console.log(JSON.stringify({ originals: Object.keys(current).length, drift, partialDrift }))
    } else {
      assert.equal(mode, 'review')
      const initial = json(`${fixture}/f2-backup.json`)
      const oracle = json(`${fixture}/f2.json`)
      const old = json(`${own}/inputs.json`)
      assert.equal(sha(read(`${fixture}/f2-backup.json`)), old.inputs[`${fixture}/f2-backup.json`].sha256)
      assert.equal(oracle.today, '2026-10-21')
      assert.deepEqual(initial.tasks, oracle.tasks)
      const seed = j(`${objective}/seed/boundary.json`)
      const browse = j(`${objective}/overview/native100/boundary.json`)
      const loaded = j(`${objective}/loaded-r2/result.json`)
      const fixtureEncoding = [...initial.projects.map(record => ({ table: 'projects', record })),
        ...initial.tasks.map(record => ({ table: 'tasks', record }))].map(({ table, record }) => {
        const key = `/pmtool/${table}/${record.id}.json`
        const expected = seed.after.data[key]
        const matches = [1, 2].flatMap(version => [false, true].flatMap(newline => {
          const encoded = JSON.stringify({ version, record }, null, 2) + (newline ? '\n' : '')
          return sha(encoded) === expected ? [{ version, newline, bytes: Buffer.byteLength(encoded),
            sha256: sha(encoded), wrapper: { version, record } }] : []
        }))
        assert.equal(browse.before[key], expected)
        assert.equal(matches.length, 1, `Exact fixture encoding not unique: ${key}`)
        return { key, expected, matches, boundary: 'Reconstructed exact bytes from original fixture; not a runtime read.' }
      })
      const stateChecks = [], frameChecks = [], rowsOut = {}, boundaries = {}
      for (const [group, file, count] of [['manual-r2', 'observations', 15], ['checklist-r2', 'records', 9]]) {
        const root = `${objective}/${group}`
        const rows = j(`${root}/${file}.json`)
        assert.equal(rows.length, count)
        assert.equal(new Set(rows.map(r => r.label)).size, count)
        const boundary = j(`${root}/boundary.json`)
        const outer = j(`${root}/outer-exit.json`)
        assert.equal(outer.exit, 0)
        const dataDelta = diff(boundary.before, boundary.after)
        assert.deepEqual(dataDelta.filter(v => v.path.startsWith('/pmtool/')).map(v => v.path), [target])
        assert(dataDelta.every(v => v.path === target || v.path.startsWith('/session_projcache/')))
        boundaries[group] = { ...boundary, outer, dataDelta }
        rowsOut[group] = rows.map(row => {
          const rawPath = `${root}/${row.label}-original-task.json`
          const raw = j(rawPath)
          assert.deepEqual(raw, row.task)
          assert.equal(raw.version, 2)
          const r = raw.record
          assert.equal(r.id, 't-0003')
          assert.equal(r.projectId, 'p-0001')
          assert.equal(r.parentId, 't-0002')
          assert.equal(r.status, 'todo')
          assert.equal(r.progress, 40)
          assert.equal(r.checklist[0].id, 'c98ca278-c928-4938-a4e0-65c9b8e5105c')
          assert.equal(r.checklist[1].id, 'df643bbe-707e-4556-a4d3-3f879c6d4773')
          const base = initial.tasks.find(t => t.id === r.id)
          const ignored = ['updatedAt', 'manualProgress', 'manualProgressNote', 'checklist']
          const retained = obj => Object.fromEntries(Object.entries(obj).filter(([k]) => !ignored.includes(k)))
          assert.deepEqual(retained(r), retained(base))
          const isChecklist = group === 'checklist-r2'
          const checked = isChecklist && row.label.startsWith('checked')
          assert.deepEqual(r.checklist, base.checklist.map((item, i) =>
            i === 1 ? { ...item, done: checked } : item))
          const statePath = `${root}/${row.label}.json`
          const state = j(statePath)
          assert.deepEqual(state.pm, row.pm)
          if (row.fields) assert.deepEqual(state.fields, row.fields)
          const labels = [row.label, ...(row.label.endsWith('-overview') ?
            [`${row.label}-upper`, `${row.label}-lower`] : [])]
          for (const name of labels) {
            const s = j(`${root}/${name}.json`)
            assert.equal(s.origin, loaded.state.origin)
            assert.equal(s.timeOrigin, loaded.state.timeOrigin)
            assert.equal(s.pathname, '/')
            assert.equal(s.dark, false)
            assert.equal(s.viewport.width, 1440)
            assert.equal(s.viewport.height, 900)
            const png = locked(`${root}/${name}.png`)
            assert.equal(png.subarray(1, 4).toString(), 'PNG')
            assert.equal(png.readUInt32BE(16), 1440)
            assert.equal(png.readUInt32BE(20), 900)
            const overview = name.includes('-overview')
            const text = s.pm.text
            assert(text.includes(overview ? '任务完成\n2/10\n20% 已完成' : '· 完成 2（20%）') ||
              name.endsWith('-gantt'), `State count text absent: ${name}`)
            if (overview) {
              assert(text.includes('任务完成率\n20%\n2 / 10\n完成\n2\n进行\n0\n待办\n7\n受阻\n0\n收尾\n1'))
              assert(text.includes(`F2-P\n${checked ? 88 : 63}%`))
            }
            stateChecks.push({ group, label: name, path: `${root}/${name}.json`, at: s.at,
              origin: s.origin, timeOrigin: s.timeOrigin, viewport: s.viewport, dark: s.dark,
              pngSha: sha(png), originalText: text })
          }
          if (isChecklist) {
            assert.deepEqual(Object.keys(row.root).sort(), Object.keys(boundary.before).sort())
            assert.equal(row.root[target], sha(locked(rawPath)))
            assert.deepEqual(diff(boundary.before, row.root).filter(v =>
              v.path.startsWith('/pmtool/') && v.path !== target), [])
            assert(diff(boundary.before, row.root).every(v =>
              v.path === target || v.path.startsWith('/session_projcache/')))
            assert.equal(r.manualProgress, null)
            assert(!Object.hasOwn(r, 'manualProgressNote'))
          }
          assert(Date.parse(r.updatedAt) <= Date.parse(state.at))
          return { ...row, rawPath, rawSha: sha(locked(rawPath)), stateAt: state.at }
        })
        const frames = j(`${root}/frames/frames.json`)
        let lastAt = 0
        for (const f of frames.frames) {
          assert.equal(sha(locked(`${root}/frames/${f.file}`)), f.sha256)
          assert(Date.parse(f.at) >= lastAt)
          lastAt = Date.parse(f.at)
          frameChecks.push({ group, ...f })
        }
      }
      const manual = rowsOut['manual-r2']
      assert.deepEqual(manual.map(r => r.label), ['manual30', 'manual0', 'clear']
        .flatMap(v => ['draft', 'tasks', 'overview', 'gantt', 'reopened'].map(stage => `${v}-${stage}`)))
      assert.deepEqual(boundaries['manual-r2'].before, browse.after)
      assert.equal(manual[0].rawSha, boundaries['manual-r2'].before[target])
      let prior = manual[0].task
      for (const [index, value] of [[0, 30], [5, 0], [10, null]]) {
        assert.deepEqual(manual[index].task, prior, 'Draft target disk must remain prior state')
        const saved = manual[index + 1].task
        assert.equal(saved.record.manualProgress, value)
        if (value === null) assert(!Object.hasOwn(saved.record, 'manualProgressNote'))
        else assert.equal(saved.record.manualProgressNote, 'QA人工口径来源')
        assert(Date.parse(saved.record.updatedAt) > Date.parse(prior.record.updatedAt))
        for (const row of manual.slice(index + 1, index + 5)) {
          assert.deepEqual(row.task, saved)
          assert.equal(row.rawSha, manual[index + 1].rawSha)
        }
        const draftState = j(`${objective}/manual-r2/${manual[index].label}.json`)
        assert.equal(draftState.fields.find(f => f.placeholder === '留空即回落客观进度').value,
          value === null ? '' : String(value))
        const reopened = j(`${objective}/manual-r2/${manual[index + 4].label}.json`)
        assert.equal(reopened.fields.find(f => f.placeholder === '留空即回落客观进度').value,
          value === null ? '' : String(value))
        assert.equal(reopened.fields.find(f => f.placeholder === '记录为何人工设定，便于追溯口径').value,
          value === null ? '' : 'QA人工口径来源')
        prior = saved
      }
      assert.equal(manual.at(-1).rawSha, boundaries['manual-r2'].after[target])
      const checklist = rowsOut['checklist-r2']
      assert.deepEqual(checklist.map(r => r.label), ['initial', 'checked', 'checked-overview',
        'checked-gantt', 'checked-reopened', 'unchecked', 'unchecked-overview',
        'unchecked-gantt', 'unchecked-reopened'])
      assert.deepEqual(boundaries['checklist-r2'].before, boundaries['manual-r2'].after)
      assert.deepEqual(checklist[0].task, manual.at(-1).task)
      for (const [from, to] of [[1, 5], [5, 9]]) {
        assert(Date.parse(checklist[from].task.record.updatedAt) >
          Date.parse(checklist[from - 1].task.record.updatedAt))
        for (const row of checklist.slice(from, to)) {
          assert.deepEqual(row.task, checklist[from].task)
          assert.equal(row.rawSha, checklist[from].rawSha)
        }
      }
      assert.equal(checklist.at(-1).rawSha, boundaries['checklist-r2'].after[target])
      const stripTime = wrapper => ({ ...wrapper, record: Object.fromEntries(
        Object.entries(wrapper.record).filter(([k]) => k !== 'updatedAt')) })
      assert.deepEqual(stripTime(checklist[0].task), stripTime(checklist.at(-1).task))
      output(label, { at: new Date().toISOString(), environment: { node: process.version,
        os: process.platform, arch: process.arch }, fixtureEncoding, rows: rowsOut,
        boundaries, stateChecks, frameChecks,
        boundariesNotProven: [
          'Manual draft proves target unchanged, not full per-state root: original manual observations have no root.',
          'Frames hashed here; independent visual review is separately recorded, never inferred from exit0.',
          'Same timeOrigin binds loaded client document; no new menu screenshot, pilot observation, lazy module or full runtime health claim.',
          'No report snapshot, wrapped migration/todo journey, full OP/B8 or release signoff.',
        ] })
      console.log(JSON.stringify({ rows: 24, states: stateChecks.length, frames: frameChecks.length,
        exactFixtureWrappers: fixtureEncoding.filter(v => v.matches.length === 1).length,
        changes: Object.fromEntries(Object.entries(boundaries).map(([k, v]) => [k, v.dataDelta])),
        output: label }, null, 2))
    }
  }
} catch (error) {
  output(`${label}-failure`, { at: new Date().toISOString(), mode,
    scriptSha: sha(read(`${prefix}-supplement-audit.mjs`)), error: error.stack })
  throw error
}

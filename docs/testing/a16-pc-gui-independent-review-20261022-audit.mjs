import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a16-pc-gui-independent-review-20261022'
const evidence = path.join(repo, 'reports/all-pending-evidence-20261021/A16')
const output = path.join(repo, `${prefix}-selftmp`)
const mode = process.argv[2]
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const read = p => fs.readFileSync(p)
const json = p => JSON.parse(read(p))
const write = (name, x) => {
  const p = path.join(output, name)
  assert(!fs.existsSync(p), `refuse overwrite ${p}`)
  fs.mkdirSync(output, { recursive: true })
  fs.writeFileSync(p, `${JSON.stringify(x, null, 2)}\n`, { flag: 'wx' })
}
const files = root => {
  if (!fs.existsSync(root)) return []
  if (fs.lstatSync(root).isFile()) return [root]
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? files(path.join(root, e.name)) : e.isFile() ? [path.join(root, e.name)] : []
  ).sort()
}
const stamp = p => {
  const stat = fs.statSync(p, { bigint: true })
  return { bytes: Number(stat.size), sha256: sha(read(p)), mtimeNs: String(stat.mtimeNs) }
}
const index = json(path.join(evidence, 'pc-index/inputs.json'))
const candidate = json(path.join(evidence, 'candidate.json'))
const branches = ['normalize', 'normalize-clean', 'conflict', 'clean', 'clean-r2', 'stepwise-conflict']
const appendFiles = ['final/gateway/requests.ndjson', 'final/gateway/events.ndjson']
const tables = ['tasks', 'milestones', 'risk_issues', 'deliverables', 'meetings']
const record = (b, s, table, id) => json(path.join(evidence, 'final', b, `${s}-raw`, table, `${id}.json`)).record
const rawFile = (b, s, table, id) => path.join(evidence, 'final', b, `${s}-raw`, table, `${id}.json`)
const ledger = (b, s) => record(b, s, 'settings', 'pmProvenanceLedger').value.entries
const changes = (a, b) => Object.keys({ ...a, ...b }).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const root = (b, s) => json(path.join(evidence, 'final', b, `${s}-roots.json`))
const baseAt = (b, s) => Object.fromEntries(tables.flatMap(t =>
  files(path.join(evidence, 'final', b, `${s}-raw`, t)).map(p => json(p).record)
    .filter(r => r.projectId === 'p-0001').map(r => [r.id, r.updatedAt])
))
const ordered = x => Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)))
const commandPairs = b => {
  const events = json(path.join(evidence, 'final', b, 'command-events.json')).map(r => r.event)
  const runs = events.filter(e => e.type === 'command/run')
  assert.equal(new Set(runs.map(e => e.data.commandId)).size, runs.length)
  return runs.map(run => {
    const done = events.filter(e => e.type === 'command/done' && e.data.commandId === run.data.commandId)
    assert.equal(done.length, 1)
    assert(done[0].seq > run.seq)
    return { runSeq: run.seq, doneSeq: done[0].seq, runAt: run.time, doneAt: done[0].time, args: run.data.args, kind: done[0].data.kind, text: done[0].data.text }
  })
}
const applyShape = cmd => {
  const match = cmd.args.match(/^\s*ask-apply p-0001 (\[.*\]) --base (\{.*\})$/s)
  assert(match, `bad apply shape ${cmd.runSeq}`)
  return { ...cmd, actions: JSON.parse(match[1]), base: JSON.parse(match[2]) }
}
const businessEqual = (b, s1, s2, except = []) => {
  const a = root(b, s1), c = root(b, s2)
  const diff = changes(a.data, c.data)
  const business = diff.filter(k => k.startsWith('/pmtool/') && !k.startsWith('/pmtool/settings/'))
  assert.deepEqual(business.sort(), except.sort())
  assert.deepEqual(a.files, c.files)
  assert.deepEqual(a.backups, c.backups)
  return { allDataChanges: diff, businessChanges: business, filesUnchanged: true, backupsUnchanged: true }
}

if (mode === 'before') {
  const protectedFiles = new Set(Object.keys(index).filter(p => !appendFiles.includes(p)).map(p => path.join(evidence, p)))
  for (const p of files(path.join(evidence, 'pc-index'))) protectedFiles.add(p)
  for (const p of [...Object.keys(candidate.sourceHashes), ...Object.keys(candidate.artifacts)]) protectedFiles.add(path.join(candidate.tree, p))
  const roots = [
    path.join(repo, 'packages/dsh-pm-tool/lib'),
    '/private/tmp/pmtool-a11-closure-20261022/packages/dsh-pm-tool/lib',
    '/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool/lib',
    '/private/tmp/pmtool-a13-closure-20261022/packages/dsh-pm-tool/lib',
    '/private/tmp/pmtool-a14-closure-20261022/packages/dsh-pm-tool/lib',
    path.join(repo, 'reports/all-pending-evidence-20261021/A14'),
  ]
  for (const r of roots) for (const p of files(r)) protectedFiles.add(p)
  const tests = fs.readdirSync(path.join(repo, 'docs/testing')).filter(n =>
    /^(a14-preconfirm-conflict-contract|a15-preconfirm-independent-retest|a16-extension-base-independent-retest)-20261022/.test(n)
  )
  for (const n of tests) for (const p of files(path.join(repo, 'docs/testing', n))) protectedFiles.add(p)
  for (const p of ['AGENTS.md', 'docs/collaboration.md', 'docs/testing/remaining-governance-cases-20261021.md'])
    protectedFiles.add(path.join(repo, p))
  const manifest = Object.fromEntries([...protectedFiles].sort().map(p => [p, stamp(p)]))
  const append = Object.fromEntries(appendFiles.map(p => [p, stamp(path.join(evidence, p))]))
  write('before.json', { at: new Date().toISOString(), manifest, append, roots: roots.map(p => ({ path: p, exists: fs.existsSync(p) })), boundary: 'Named sealed inputs only; no runtime/profile/credentials or later branches. Append files protected by existing prefix, not immutable full-file hash.' })
  console.log({ protectedFiles: protectedFiles.size, append, roots })
} else if (mode === 'audit') {
  const result = { at: new Date().toISOString(), index: {}, candidate: {}, loaded: {}, branches: {}, boundaries: [] }
  const sealedDrift = []
  for (const [p, expected] of Object.entries(index)) {
    const bytes = read(path.join(evidence, p))
    const part = appendFiles.includes(p) ? bytes.subarray(0, expected.bytes) : bytes
    if (part.length !== expected.bytes || sha(part) !== expected.sha256) sealedDrift.push(p)
  }
  assert.deepEqual(sealedDrift, [])
  result.index = { count: Object.keys(index).length, sha256: sha(read(path.join(evidence, 'pc-index/inputs.json'))), sealedDrift }
  for (const kind of ['sourceHashes', 'artifacts']) {
    const drift = Object.entries(candidate[kind]).filter(([p, hash]) => sha(read(path.join(candidate.tree, p))) !== hash).map(([p]) => p)
    assert.deepEqual(drift, [])
    result.candidate[kind] = { count: Object.keys(candidate[kind]).length, drift }
  }
  assert.equal(sha(read(path.join(evidence, 'product-tracked.patch'))), candidate.trackedPatchSha)
  result.candidate.identity = { baseline: candidate.baseline, hostGitHead: candidate.hostGitHead, tree: candidate.tree, manifestSha: sha(read(path.join(evidence, 'candidate.json'))), trackedPatchSha: candidate.trackedPatchSha }
  const independent = path.join(repo, 'docs/testing/a16-extension-base-independent-retest-20261022-selftmp/r1/new/src')
  if (fs.existsSync(independent)) {
    const inputs = files(path.join(candidate.tree, 'packages/dsh-pm-tool/src'))
    const diff = inputs.filter(p => sha(read(p)) !== sha(read(path.join(independent, path.relative(path.join(candidate.tree, 'packages/dsh-pm-tool/src'), p)))))
    assert.deepEqual(diff, [])
    result.candidate.independentSourceMatch = { files: inputs.length, diff }
  }
  const loaded = json(path.join(evidence, 'final/loaded/result.json'))
  const actual = json(path.join(evidence, 'final/loaded/actual.json'))
  assert.deepEqual(loaded.state, actual)
  const event = loaded.events.find(e => e.matches.some(m => m.name === 'client.js'))
  const combo = read(path.join(evidence, 'final/loaded', event.file))
  const client = read(path.join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '').replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const first = combo.indexOf(segment), second = combo.indexOf(segment, first + 1)
  const match = event.matches.find(m => m.name === 'client.js')
  assert.equal(combo.length, event.bytes)
  assert.equal(sha(combo), event.responseSha)
  assert.equal(sha(client), match.sourceSha)
  assert.equal(sha(segment), match.segmentSha)
  assert.equal(segment.length, match.segmentBytes)
  assert.equal(first, match.first)
  assert.equal(second, -1)
  assert.equal(event.fromDiskCache, false)
  assert.equal(event.frameId, loaded.targetId)
  result.loaded = { comboBytes: combo.length, comboSha: sha(combo), clientSha: sha(client), segmentBytes: segment.length, segmentSha: sha(segment), first, second, target: loaded.targetId, requestId: event.requestId, status: event.status, fromDiskCache: event.fromDiskCache, context: loaded.context, actualAt: actual.at, origin: actual.origin, timeOrigin: actual.timeOrigin, viewport: actual.viewport, dark: actual.dark, pilotFields: Object.keys(actual).filter(k => /pilot/i.test(k)) }
  for (const b of branches) {
    const dir = path.join(evidence, 'final', b)
    const pairs = commandPairs(b)
    const actions = fs.existsSync(path.join(dir, 'actions.json')) ? json(path.join(dir, 'actions.json')) : []
    const frames = json(path.join(dir, 'frames/frames.json'))
    const frameDrift = frames.frames.filter(f => sha(read(path.join(dir, 'frames', f.file))) !== f.sha256).map(f => f.file)
    assert.deepEqual(frameDrift, [])
    const states = files(dir).filter(p => path.dirname(p) === dir && p.endsWith('.json')).map(p => ({ file: path.basename(p), value: json(p) })).filter(r => r.value.timeOrigin)
    assert(states.every(s => s.value.timeOrigin === actual.timeOrigin && s.value.origin === actual.origin))
    const entry = {
      rawExit: json(path.join(dir, 'exit.json')),
      commandPairs: pairs,
      actions,
      console: json(path.join(dir, 'console.json')),
      frames: { count: frames.frames.length, frameDrift, source: frames.source, first: frames.frames[0], last: frames.frames.at(-1) },
      states: states.map(s => ({ file: s.file, at: s.value.at, viewport: s.value.viewport, dark: s.value.dark })),
    }
    result.branches[b] = entry
    if (b === 'clean') {
      assert.equal(entry.rawExit.exit, 1)
      assert.equal(pairs.length, 0)
      entry.boundary = 'selector infrastructure failure before new ask/apply; not product PASS/FAIL; original exit1 retained'
      continue
    }
    assert.equal(entry.rawExit.exit, 0)
    if (b.startsWith('normalize')) {
      const updates = pairs.filter(c => /^\s*task update /.test(c.args))
      assert.equal(updates.length, 2)
      entry.normalization = updates.map(c => ({ runSeq: c.runSeq, doneSeq: c.doneSeq, args: c.args }))
      assert.equal(record(b, 'normalize-t1-saved', 'tasks', 't-0001').progress, 11)
      assert.equal(record(b, 'normalize-t1-saved', 'tasks', 't-0001').assignee, 'A16 原始执行人')
      assert.equal(record(b, 'normalize-t2-saved', 'tasks', 't-0002').progress, 35)
      entry.draftNoWrites = [
        businessEqual(b, 'initial', 'normalize-t1-draft'),
        businessEqual(b, 'normalize-t1-saved', 'normalize-t2-draft'),
      ]
      continue
    }
    const asks = pairs.filter(c => /^\s*ask p-0001 /.test(c.args))
    assert.equal(asks.length, 1)
    assert(Date.parse(actual.at) < asks[0].runAt)
    const plan = JSON.parse(asks[0].text.match(/```json\s*([\s\S]*?)```/)[1]).plan
    assert.deepEqual(plan.map(s => s.stepId), ['s1', 's2', 's3'])
    assert.deepEqual(plan.map(s => s.needs), [[], ['s1'], []])
    entry.generated = { seq: asks[0].runSeq, doneSeq: asks[0].doneSeq, plan }
    const applies = pairs.filter(c => /^\s*ask-apply /.test(c.args)).map(applyShape)
    const generationBase = baseAt(b, 'draft')
    assert.equal(Object.keys(generationBase).length, 10)
    for (const a of applies) assert.deepEqual(ordered(a.base), ordered(generationBase))
    assert(pairs.filter(c => /^\s*ask-apply /.test(c.args)).every(c => c.runAt > asks[0].doneAt))
    entry.generationBase = generationBase
    entry.applies = applies
    entry.draftNoBusinessWrites = businessEqual(b, 'initial', 'draft')
    const oldEntries = ledger(b, 'draft')
    const newEntries = ledger(b, 'result')
    const added = newEntries.filter(e => !oldEntries.some(o => o.id === e.id))
    assert.deepEqual(newEntries.filter(e => oldEntries.some(o => o.id === e.id)), oldEntries)
    assert.equal(added.length, 1)
    entry.newLedger = added
    const initial1 = record(b, 'draft', 'tasks', 't-0001'), initial2 = record(b, 'draft', 'tasks', 't-0002')
    const end1 = record(b, 'result', 'tasks', 't-0001'), end2 = record(b, 'result', 'tasks', 't-0002')
    assert.equal(initial1.progress, 11)
    assert.equal(initial2.progress, 35)
    assert.equal(end2.progress, 44)
    assert(Date.parse(end2.updatedAt) > Date.parse(initial2.updatedAt))
    assert.deepEqual(changes(initial2, end2).sort(), ['progress', 'updatedAt'])
    assert.equal(added[0].refs.find(r => r.id === 't-0002').updatedAt, end2.updatedAt)
    entry.tasks = { initial1, initial2, end1, end2 }
    if (b.includes('conflict')) {
      const saved1 = record(b, 'external-saved', 'tasks', 't-0001')
      const external = pairs.filter(c => /^\s*task update t-0001 /.test(c.args))
      assert.equal(external.length, 1)
      assert.deepEqual(changes(initial1, saved1).sort(), ['assignee', 'updatedAt'])
      assert.equal(saved1.assignee, 'A16 确认前人工改派保留')
      assert(Date.parse(saved1.updatedAt) > Date.parse(initial1.updatedAt))
      assert.deepEqual(read(rawFile(b, 'external-saved', 'tasks', 't-0001')), read(rawFile(b, 'result', 'tasks', 't-0001')))
      assert(sha(read(rawFile(b, 'external-saved', 'tasks', 't-0001'))) === sha(read(rawFile(b, 'expanded-stale', 'tasks', 't-0001'))))
      assert(json(path.join(dir, 'expanded-stale.json')).pm.text.includes('台账有变化'))
      assert.equal(added[0].refs.length, 1)
      assert.equal(added[0].refs[0].id, 't-0002')
      assert.equal(added[0].undo.postimages.length, 1)
      entry.externalPreserved = { rawSha: sha(read(rawFile(b, 'result', 'tasks', 't-0001'))), generatedAt: initial1.updatedAt, externalAt: saved1.updatedAt, finalAt: end1.updatedAt, entireRawEqual: true, changedFields: changes(initial1, saved1), revisions: saved1.progressLog.map(l => ({ id: l.id, revisions: l.revisions.length, deletedAt: l.deletedAt })) }
      entry.rootResult = businessEqual(b, 'external-saved', 'result', ['/pmtool/tasks/t-0002.json'])
      businessEqual(b, 'draft', 'external-draft')
      businessEqual(b, 'external-saved', 'expanded-stale')
      if (b === 'conflict') {
        assert.equal(applies.length, 1)
        assert.deepEqual(applies[0].actions.map(a => a.stepId), ['s1', 's2', 's3'])
        assert.deepEqual(applies[0].actions.map(a => a.needs), [[], ['s1'], []])
        assert(applies[0].text.includes('已应用 1 步') && applies[0].text.includes('未执行 2 步'))
        assert(applies[0].text.includes('内容已被他人更新') && applies[0].text.includes('依赖步骤未执行'))
      } else {
        assert.equal(applies.length, 2)
        assert.deepEqual(applies.flatMap(a => a.actions.map(s => s.stepId)), ['s1', 's3'])
        assert.equal(applies[0].kind, 'success')
        assert(applies[0].text.includes('已应用 0 步'))
        assert(applies[1].text.includes('已应用 1 步'))
        assert(json(path.join(dir, 'result.json')).pm.text.includes('s2'))
      }
    } else {
      assert.equal(applies.length, 1)
      assert.deepEqual(applies[0].actions.map(a => a.stepId), ['s1', 's2', 's3'])
      assert.deepEqual(applies[0].actions.map(a => a.needs), [[], ['s1'], []])
      assert(applies[0].text.includes('已应用 3 步'))
      assert.equal(end1.progress, 73)
      assert.equal(end1.status, 'in_progress')
      assert.equal(end1.assignee, '确认守卫建议甲')
      assert.deepEqual(changes(initial1, end1).sort(), ['assignee', 'progress', 'status', 'updatedAt'])
      assert.deepEqual(added[0].undo.postimages.map(p => p.id), ['t-0001', 't-0001', 't-0002'])
      assert(Date.parse(added[0].undo.postimages[1].postimage.updatedAt) > Date.parse(added[0].undo.postimages[0].postimage.updatedAt))
      const undo = pairs.filter(c => /^\s*ask-undo undo-/.test(c.args))
      assert.equal(undo.length, 1)
      assert.equal(undo[0].args.trim(), `ask-undo ${added[0].undo.handle}`)
      assert(undo[0].text.includes('已撤销 3 项'))
      for (const id of ['t-0001', 't-0002'])
        assert.deepEqual(read(rawFile(b, 'draft', 'tasks', id)), read(rawFile(b, 'undone', 'tasks', id)))
      businessEqual(b, 'result', 'applied-hidden')
      businessEqual(b, 'applied-hidden', 'retained-undo')
      const retained = json(path.join(dir, 'retained-undo.json'))
      assert(retained.buttons.some(c => c.text.startsWith('撤销 · 整批 3 步') && !c.disabled))
      const undoneEntry = ledger(b, 'undone').find(e => e.id === added[0].id)
      assert.equal(undoneEntry.undo.used, true)
      entry.undo = { command: undo[0], handle: added[0].undo.handle, retainedButton: true, used: undoneEntry.undo.used, status: undoneEntry.status, history: undoneEntry.history, audit: undoneEntry.audit, exactRawRestored: ['t-0001', 't-0002'] }
      entry.rootRestored = businessEqual(b, 'draft', 'undone')
    }
  }
  const gatewayPrefix = read(path.join(evidence, 'final/gateway/requests.ndjson')).subarray(0, index['final/gateway/requests.ndjson'].bytes).toString()
  const requests = gatewayPrefix.trim().split('\n').map(line => JSON.parse(line))
  result.gateway = { sealedRequests: requests.length, fields: requests.map(r => Object.keys(r)), requests }
  result.originalCommands = {
    build: ['build', 'noemit', 'coverage'].map(n => json(path.join(evidence, 'build', `${n}.exit.json`))),
    fullVerify: json(path.join(evidence, 'full-verify/summary.json')).rows,
    guardRows: read(path.join(evidence, 'full-verify/guard.stdout.txt')).toString().split('\n').filter(l => /\[guard\]\s+ok\s+scripts\//.test(l)),
  }
  assert.equal(result.originalCommands.guardRows.length, 95)
  assert(result.originalCommands.build.every(c => c.exit === 0))
  assert(result.originalCommands.fullVerify.every(c => c.exit === 0))
  result.boundaries = ['No browser/service/credential access. Raw Main exit codes are not Main verdicts.', 'No inferred parent tool final exit; only persisted child/branch exit records.', 'No G04 selection/edit/cancel/regeneration or extension-update GUI signoff.', 'No full AI04/AI05, changed/mixed undo, other viewports/themes/text zoom/restart signoff.']
  write('audit.json', result)
  console.log({ index: result.index, candidate: result.candidate, loaded: result.loaded, frames: Object.fromEntries(Object.entries(result.branches).map(([b, r]) => [b, r.frames.count])), branches: Object.fromEntries(Object.entries(result.branches).map(([b, r]) => [b, r.rawExit.exit])) })
} else if (mode === 'final') {
  const before = json(path.join(output, 'before.json'))
  const drift = []
  for (const [p, original] of Object.entries(before.manifest)) {
    if (!fs.existsSync(p)) drift.push({ path: p, reason: 'missing' })
    else {
      const now = stamp(p)
      if (JSON.stringify(now) !== JSON.stringify(original)) drift.push({ path: p, before: original, after: now })
    }
  }
  const append = Object.entries(before.append).map(([p, original]) => {
    const bytes = read(path.join(evidence, p))
    return { path: p, startBytes: original.bytes, finalBytes: bytes.length, prefixUnchanged: bytes.length >= original.bytes && sha(bytes.subarray(0, original.bytes)) === original.sha256 }
  })
  assert.deepEqual(drift, [])
  assert(append.every(r => r.prefixUnchanged))
  const own = files(path.join(repo, 'docs/testing')).filter(p => p.startsWith(path.join(repo, prefix)))
  write('final.json', { at: new Date().toISOString(), protectedCount: Object.keys(before.manifest).length, drift, append, ownFiles: Object.fromEntries(own.map(p => [path.relative(repo, p), stamp(p)])), released: true, boundary: 'Release independent review only; no builder/GUI/runtime lock ever held; Main services not stopped. Only named files protected, not full machine or future branches.' })
  console.log({ protectedCount: Object.keys(before.manifest).length, drift: 0, append, released: true })
} else {
  throw Error('Use before, audit, or final; each output is append-only.')
}

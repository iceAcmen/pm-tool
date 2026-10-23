import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a16-extension-selection-gui-review-20261022'
const ev = path.join(repo, 'reports/all-pending-evidence-20261021/A16')
const out = path.join(repo, `${prefix}-selftmp`)
const mode = process.argv[2]
const read = p => fs.readFileSync(p)
const json = p => JSON.parse(read(p))
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const walk = p => !fs.existsSync(p) ? [] : fs.lstatSync(p).isFile() ? [p] :
  fs.readdirSync(p, { withFileTypes: true }).flatMap(e => e.isDirectory() ?
    walk(path.join(p, e.name)) : e.isFile() ? [path.join(p, e.name)] : []).sort()
const write = (n, x) => {
  fs.mkdirSync(out, { recursive: true })
  fs.writeFileSync(path.join(out, n), `${JSON.stringify(x, null, 2)}\n`, { flag: 'wx' })
}
const stamp = p => {
  const s = fs.statSync(p, { bigint: true })
  return { bytes: Number(s.size), sha256: sha(read(p)), mtimeNs: String(s.mtimeNs) }
}
const index = json(path.join(ev, 'extension-index/inputs.json'))
const pcIndex = json(path.join(ev, 'pc-index/inputs.json'))
const candidate = json(path.join(ev, 'candidate.json'))
const append = ['final/gateway/requests.ndjson', 'final/gateway/events.ndjson',
  'extensions/gateway/requests.ndjson', 'extensions/gateway/events.ndjson']
const ext = walk(path.join(ev, 'extensions')).filter(p => p.endsWith('/exit.json'))
  .map(p => path.relative(ev, path.dirname(p))).sort()
const branches = ['final/selection-cancel', ...ext]
const full = (b, s, rel) => path.join(ev, b, `${s}-raw`, rel)
const rec = (b, s, rel) => json(full(b, s, rel)).record
const roots = (b, s) => json(path.join(ev, b, `${s}-roots.json`))
const ledger = (b, s) => rec(b, s, 'settings/pmProvenanceLedger.json').value.entries
const delta = (a, b) => Object.keys({ ...a, ...b }).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).sort()
const eqRaw = (b1, s1, b2, s2, rel) => assert.deepEqual(read(full(b1, s1, rel)), read(full(b2, s2, rel)), rel)
const business = (b1, s1, b2, s2, expected = []) => {
  const a = roots(b1, s1), b = roots(b2, s2), d = delta(a.data, b.data)
  const biz = d.filter(k => k.startsWith('/pmtool/') && !k.startsWith('/pmtool/settings/'))
  assert.deepEqual(biz, expected.sort())
  assert.deepEqual(a.files, b.files)
  assert.deepEqual(a.backups, b.backups)
  return { allDataChanges: d, businessChanges: biz, filesUnchanged: true, backupsUnchanged: true }
}
const base = (b, s) => Object.fromEntries(walk(path.join(ev, b, `${s}-raw`))
  .filter(p => /\/(tasks|milestones|risk_issues|deliverables|meetings)\//.test(p))
  .map(p => json(p).record).filter(r => r.projectId === 'p-0001').map(r => [r.id, r.updatedAt]))
const pairs = b => {
  const p = path.join(ev, b, b === 'final/selection-cancel' ? 'command-events.json' : 'commands.json')
  const events = json(p).map(r => r.event), runs = events.filter(e => e.type === 'command/run')
  assert.equal(new Set(runs.map(e => e.data.commandId)).size, runs.length)
  return runs.map(r => {
    const done = events.filter(e => e.type === 'command/done' && e.data.commandId === r.data.commandId)
    assert.equal(done.length, 1)
    assert(done[0].seq > r.seq)
    return { runSeq: r.seq, doneSeq: done[0].seq, runAt: r.time, doneAt: done[0].time,
      commandId: r.data.commandId, args: r.data.args, kind: done[0].data.kind, text: done[0].data.text }
  })
}
const apply = b => {
  const a = pairs(b).filter(c => /^\s*ask-apply /.test(c.args))
  assert.equal(a.length, 1)
  const m = a[0].args.match(/^\s*ask-apply p-0001 (\[.*\]) --base (\{.*\})$/s)
  assert(m)
  return { ...a[0], actions: JSON.parse(m[1]), base: JSON.parse(m[2]) }
}
const targets = [
  ['milestone', 'milestones/m-0001.json', 'description', 'A16 建议里程碑说明', 'A16 人工里程碑说明保留'],
  ['risk', 'risk_issues/ri-0001.json', 'responsePlan', 'A16 建议风险响应', 'A16 人工风险响应保留'],
  ['deliverable', 'deliverables/dlv-0001.json', 'description', 'A16 建议交付说明', 'A16 人工交付说明保留'],
  ['meeting', 'meetings/mtg-0001.json', 'summary', 'A16 建议会议摘要', 'A16 人工会议摘要保留'],
]

if (mode === 'before') {
  const immutable = new Set()
  for (const idx of [index, pcIndex]) for (const p of Object.keys(idx)) if (!append.includes(p)) immutable.add(path.join(ev, p))
  for (const n of ['extension-index', 'pc-index', 'build', 'full-verify'])
    for (const p of walk(path.join(ev, n))) immutable.add(p)
  for (const p of [...Object.keys(candidate.sourceHashes), ...Object.keys(candidate.artifacts)])
    immutable.add(path.join(candidate.tree, p))
  const rootsToWatch = [
    path.join(repo, 'packages/dsh-pm-tool/lib'),
    '/private/tmp/pmtool-a11-closure-20261021/packages/dsh-pm-tool/lib',
    '/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool/lib',
    '/private/tmp/pmtool-a13-closure-20261022/packages/dsh-pm-tool/lib',
    '/private/tmp/pmtool-a14-closure-20261022/packages/dsh-pm-tool/lib',
    path.join(repo, 'reports/all-pending-evidence-20261021/A14'),
  ]
  for (const p of rootsToWatch) for (const f of walk(p)) immutable.add(f)
  for (const n of fs.readdirSync(path.join(repo, 'docs/testing')).filter(n =>
    /^(a14-preconfirm-conflict-contract|a15-preconfirm-independent-retest|a16-extension-base-independent-retest|a16-pc-gui-independent-review)-20261022/.test(n)))
    for (const p of walk(path.join(repo, 'docs/testing', n))) immutable.add(p)
  for (const p of ['AGENTS.md', 'docs/collaboration.md', 'docs/testing/remaining-governance-cases-20261021.md'])
    immutable.add(path.join(repo, p))
  write('before.json', { at: new Date().toISOString(),
    manifest: Object.fromEntries([...immutable].sort().map(p => [p, stamp(p)])),
    append: Object.fromEntries(append.map(p => [p, stamp(path.join(ev, p))])),
    roots: rootsToWatch.map(p => ({ path: p, exists: fs.existsSync(p) })),
    boundary: 'Only named frozen/read-only roots; live Main A17 source not frozen by this reviewer; no runtime/profile/credential access.' })
  console.log({ protectedFiles: immutable.size, appendFiles: append.length })
} else if (mode === 'audit') {
  const r = { at: new Date().toISOString(), index: {}, candidate: {}, loaded: {}, branches: {}, rawSnapshots: [], checks: {} }
  for (const [name, idx] of [['extension', index], ['pc', pcIndex]]) {
    const drift = Object.entries(idx).filter(([p, ex]) => {
      const b = read(path.join(ev, p)), part = append.includes(p) ? b.subarray(0, ex.bytes) : b
      return part.length !== ex.bytes || sha(part) !== ex.sha256
    }).map(([p]) => p)
    assert.deepEqual(drift, [])
    r.index[name] = { count: Object.keys(idx).length, drift,
      sha256: sha(read(path.join(ev, `${name === 'pc' ? 'pc-index' : 'extension-index'}/inputs.json`))) }
  }
  assert.equal(r.index.extension.count, 1008)
  for (const k of ['sourceHashes', 'artifacts']) {
    const d = Object.entries(candidate[k]).filter(([p, hash]) => sha(read(path.join(candidate.tree, p))) !== hash)
    assert.deepEqual(d, [])
    r.candidate[k] = { count: Object.keys(candidate[k]).length, drift: d }
  }
  const expert = json(path.join(repo, 'docs/testing/a16-extension-base-independent-retest-20261022-selftmp/r1/candidate.json'))
  const src = walk(path.join(candidate.tree, 'packages/dsh-pm-tool/src'))
  const frozenSrc = walk(path.join(expert.freezeRoots.new, 'packages/dsh-pm-tool/src'))
  const relative = (root, xs) => xs.map(p => path.relative(path.join(root, 'packages/dsh-pm-tool/src'), p))
  assert.deepEqual(relative(candidate.tree, src), relative(expert.freezeRoots.new, frozenSrc))
  const inputs = Object.entries(candidate.sourceHashes).filter(([p]) => p.startsWith('packages/dsh-pm-tool/'))
  assert(inputs.every(([p, h]) => sha(read(path.join(expert.freezeRoots.new, p))) === h))
  assert.equal(sha(read(path.join(ev, 'product-tracked.patch'))), candidate.trackedPatchSha)
  r.candidate.identity = { ...candidate, sourceHashes: undefined, artifacts: undefined,
    manifestSha: sha(read(path.join(ev, 'candidate.json'))), independentInputFiles: inputs.length, srcFiles: src.length,
    independentRoot: expert.freezeRoots.new }
  const loaded = json(path.join(ev, 'final/loaded/result.json')), actual = json(path.join(ev, 'final/loaded/actual.json'))
  assert.deepEqual(loaded.state, actual)
  const event = loaded.events.find(e => e.matches.some(m => m.name === 'client.js'))
  const combo = read(path.join(ev, 'final/loaded', event.file))
  const client = read(path.join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const match = event.matches.find(m => m.name === 'client.js'), first = combo.indexOf(segment)
  assert.equal(sha(combo), event.responseSha)
  assert.equal(combo.length, event.bytes)
  assert.equal(sha(client), match.sourceSha)
  assert.equal(sha(segment), match.segmentSha)
  assert.equal(segment.length, match.segmentBytes)
  assert.equal(first, match.first)
  assert.equal(combo.indexOf(segment, first + 1), -1)
  assert.equal(event.fromDiskCache, false)
  assert.equal(event.frameId, loaded.targetId)
  r.loaded = { actual, target: loaded.targetId, context: loaded.context, requestId: event.requestId,
    comboBytes: combo.length, comboSha: sha(combo), clientSha: sha(client), segmentBytes: segment.length,
    segmentSha: sha(segment), first, second: -1, fromDiskCache: false }
  for (const b of branches) {
    const dir = path.join(ev, b), f = json(path.join(dir, 'frames/frames.json'))
    assert(f.frames.every(x => sha(read(path.join(dir, 'frames', x.file))) === x.sha256))
    const states = walk(dir).filter(p => path.dirname(p) === dir && p.endsWith('.json'))
      .map(p => ({ file: path.basename(p), state: json(p) })).filter(x => x.state.timeOrigin)
    assert(states.every(x => x.state.origin === actual.origin && x.state.timeOrigin === actual.timeOrigin))
    const commands = pairs(b)
    assert(commands.filter(c => /^\s*ask p-0001 /.test(c.args)).every(c => c.runAt > Date.parse(actual.at)))
    r.branches[b] = { exit: json(path.join(dir, 'exit.json')), pairs: commands,
      states: states.map(x => ({ file: x.file, at: x.state.at, viewport: x.state.viewport, dark: x.state.dark })),
      frames: { count: f.frames.length, source: f.source, first: f.frames[0], last: f.frames.at(-1), drift: [] },
      console: fs.existsSync(path.join(dir, 'console.json')) ? json(path.join(dir, 'console.json')) : 'NOT_CAPTURED',
      actions: fs.existsSync(path.join(dir, 'actions.json')) ? json(path.join(dir, 'actions.json')) : 'NOT_CAPTURED' }
    for (const n of fs.readdirSync(dir).filter(n => n.endsWith('-raw'))) {
      const s = n.slice(0, -4), root = roots(b, s), files = walk(path.join(dir, n))
      assert(files.every(p => sha(read(p)) === root.data[`/pmtool/${path.relative(path.join(dir, n), p)}`]))
      r.rawSnapshots.push({ branch: b, state: s, count: files.length, drift: [] })
    }
  }
  const s = 'final/selection-cancel', cmd = pairs(s)
  assert.equal(r.branches[s].exit.exit, 0)
  assert.equal(cmd.filter(c => /^\s*ask p-0001 /.test(c.args)).length, 2)
  assert(!cmd.some(c => /^\s*ask-(apply|undo)/.test(c.args)))
  const checks = ['selection-edit', 'selection-hidden', 'selection-retained', 'cancelled', 'regenerate-external-draft']
    .map(n => business(s, 'initial', s, n))
  for (const n of ['selection-edit', 'selection-retained']) {
    const state = json(path.join(ev, s, `${n}.json`))
    assert(state.buttons.some(b => b.text === '整批执行（2）'))
    assert.equal(state.fields.filter(f => f.placeholder === '进度').at(-1).value, '55')
  }
  const t = 'tasks/t-0001.json', oldT = rec(s, 'initial', t), newT = rec(s, 'regenerate-external-saved', t)
  assert.deepEqual(delta(oldT, newT), ['assignee', 'updatedAt'])
  assert.equal(newT.assignee, 'A16 再生成前人工值')
  for (const n of ['draft', 'regenerated', 'regenerated-cancelled']) business(s, 'regenerate-external-saved', s, n)
  assert.deepEqual(ledger(s, 'initial'), ledger(s, 'regenerated-cancelled'))
  const oldAsk = cmd.filter(c => /^\s*ask p-0001 /.test(c.args))[0]
  const newAsk = cmd.filter(c => /^\s*ask p-0001 /.test(c.args))[1]
  const save = cmd.find(c => /^\s*task update t-0001 /.test(c.args))
  assert(oldAsk.doneAt < save.runAt && save.doneAt < newAsk.runAt)
  r.checks.selection = { checks, oldAsk, save, newAsk, oldTask: oldT, newTask: newT,
    firstBaseFromInitial: base(s, 'initial'), regeneratedBaseFromRaw: base(s, 'regenerated'),
    hiddenOpenedAt: 'NOT_CAPTURED', checkboxCheckedInJSON: 'NOT_CAPTURED',
    rawDraftNaming: 'ask() records draft twice; final draft is regenerated. First generation uses initial/selection-* plus original frames/ask81, not final draft as first snapshot.' }
  const clean = 'extensions/apply-clean', askClean = 'extensions/ask-clean', conflict = 'extensions/apply-conflict'
  const askConflict = 'extensions/ask-conflict', undo = 'extensions/undo-clean'
  const a = apply(clean), c = apply(conflict)
  assert.deepEqual(a.base, base(askClean, 'draft'))
  assert.deepEqual(c.base, base(askConflict, 'draft'))
  assert.equal(Object.keys(a.base).length, 10)
  assert.deepEqual(a.actions, c.actions)
  const plan = json(path.join(ev, 'extensions/gateway/plan.json')).plan
  assert.deepEqual(a.actions, plan.map(s => ({ ...s.action, stepId: s.stepId, title: s.title, needs: s.needs })))
  for (const branch of [askClean, askConflict]) {
    const asks = pairs(branch).filter(c => /^\s*ask p-0001 /.test(c.args))
    assert.equal(asks.length, 1)
    assert.deepEqual(JSON.parse(asks[0].text.match(/```json\s*([\s\S]*?)```/)[1]).plan, plan)
    business(branch, 'initial', branch, 'draft')
  }
  assert(a.text.includes('已应用 4 步'))
  assert(c.text.includes('已应用 0 步') && c.text.includes('未执行 4 步'))
  assert.equal(c.text.split('内容已被他人更新').length - 1, 4)
  business(clean, 'initial', clean, 'applied', targets.map(t => `/pmtool/${t[1]}`))
  business(askClean, 'draft', undo, 'undone')
  business(askConflict, 'draft', 'extensions/min', 'hidden')
  business('extensions/expand', 'initial', 'extensions/expand', 'expanded')
  business(conflict, 'initial', conflict, 'applied')
  const previous = ledger(clean, 'initial'), after = ledger(clean, 'applied')
  const added = after.filter(e => !previous.some(p => p.id === e.id))
  assert.equal(added.length, 1)
  assert.deepEqual(after.filter(e => previous.some(p => p.id === e.id)), previous)
  const entry = added[0], undoCmd = pairs(undo).filter(c => /^\s*ask-undo undo-/.test(c.args))
  assert.equal(undoCmd.length, 1)
  assert.equal(undoCmd[0].args.trim(), `ask-undo ${entry.undo.handle}`)
  assert(undoCmd[0].text.includes('已撤销 4 项'))
  const undone = ledger(undo, 'undone').find(e => e.id === entry.id)
  assert.equal(undone.undo.used, true)
  assert.deepEqual(ledger(undo, 'undone').filter(e => previous.some(p => p.id === e.id)), previous)
  assert.deepEqual(ledger(conflict, 'initial'), ledger(conflict, 'applied'))
  assert.deepEqual(ledger(askConflict, 'draft'), ledger(conflict, 'applied'))
  r.checks.extensions = { cleanApply: a, conflictApply: c, newLedger: entry, undoneLedger: undone, undoCommand: undoCmd[0], records: [] }
  assert.deepEqual(entry.refs.map(x => `${x.table}/${x.id}.json`), targets.map(t => t[1]))
  assert.deepEqual(entry.undo.postimages.map(x => `${x.table}/${x.id}.json`), targets.map(t => t[1]))
  for (const [kind, rel, field, aiValue, humanValue] of targets) {
    const initial = rec(clean, 'initial', rel), applied = rec(clean, 'applied', rel)
    assert.deepEqual(delta(initial, applied), [field, 'updatedAt'].sort())
    assert.equal(applied[field], aiValue)
    assert(Date.parse(applied.updatedAt) > Date.parse(initial.updatedAt))
    assert.equal(entry.refs.find(x => `${x.table}/${x.id}.json` === rel).updatedAt, applied.updatedAt)
    assert.equal(entry.undo.postimages.find(x => `${x.table}/${x.id}.json` === rel).postimage.updatedAt, applied.updatedAt)
    eqRaw(askClean, 'draft', undo, 'undone', rel)
    const external = `extensions/external-${kind}-save`
    const before = rec(external, 'initial', rel), saved = rec(external, 'saved', rel)
    business(external, 'initial', external, 'draft')
    business(external, 'draft', external, 'saved', [`/pmtool/${rel}`])
    assert.deepEqual(delta(before, saved), [field, 'updatedAt'].sort())
    assert.equal(saved[field], humanValue)
    assert(Date.parse(saved.updatedAt) > Date.parse(before.updatedAt))
    eqRaw(external, 'saved', conflict, 'initial', rel)
    eqRaw(external, 'saved', conflict, 'applied', rel)
    assert.equal(c.base[saved.id], rec(askConflict, 'draft', rel).updatedAt)
    assert.notEqual(c.base[saved.id], saved.updatedAt)
    const updates = pairs(external).filter(x => /^\s*(milestone|risk-issue|deliverable|meeting) update /.test(x.args))
    assert.equal(updates.length, 1)
    assert(updates[0].args.includes(saved.id) && updates[0].args.includes(humanValue))
    r.checks.extensions.records.push({ kind, rel, field, initial, applied, saved,
      changes: delta(before, saved), undoRestoredRawSha: sha(read(full(undo, 'undone', rel))),
      savedFinalRawSha: sha(read(full(conflict, 'applied', rel))), externalCommand: updates[0] })
  }
  for (const kind of ['risk', 'deliverable', 'meeting'])
    assert.equal(r.branches[`extensions/external-${kind}-open`].exit.exit, 1)
  const sealedLines = (p, idx) => read(path.join(ev, p)).subarray(0, idx[p].bytes).toString().trim().split('\n').map(JSON.parse)
  const reviewerPrefix = json(path.join(out, 'before.json')).append
  for (const [p, expected] of Object.entries(reviewerPrefix)) {
    const bytes = read(path.join(ev, p)).subarray(0, expected.bytes)
    assert.equal(bytes.length, expected.bytes)
    assert.equal(sha(bytes), expected.sha256)
  }
  const oldGateway = sealedLines('final/gateway/requests.ndjson', reviewerPrefix)
  const newGateway = sealedLines('extensions/gateway/requests.ndjson', index)
  assert.equal(oldGateway.length, 5)
  assert.equal(newGateway.length, 2)
  assert(newGateway.every(x => x.behavior === 'success' && x.body.model === 'deepseek-v4-1-flash-260910' && x.body.stream))
  for (const [name, rows] of [['A16 selection-cancel', oldGateway], ['A16 明确重新生成三步', oldGateway],
    ['A16 四扩展 ask-clean', newGateway], ['A16 四扩展 ask-conflict', newGateway]])
    assert.equal(rows.filter(x => JSON.stringify(x.body.messages).includes(name)).length, 1)
  r.gateway = { ready: json(path.join(ev, 'extensions/gateway/ready.json')), oldGateway, newGateway,
    events: sealedLines('extensions/gateway/events.ndjson', index), oldStopShell: 'NOT_CAPTURED',
    selectionRequestBinding: { mainPcSealedBytes: pcIndex['final/gateway/requests.ndjson'].bytes,
      reviewerStartPrefix: reviewerPrefix['final/gateway/requests.ndjson'],
      boundary: 'Selection requests are appended after the PC seal; bound to reviewer-start existing prefix, not falsely included in Main extension1008 seal.' } }
  r.originalCommands = {
    build: ['noemit', 'build', 'coverage'].map(n => json(path.join(ev, 'build', `${n}.exit.json`))),
    fullVerify: json(path.join(ev, 'full-verify/summary.json')),
    guardRows: read(path.join(ev, 'full-verify/guard.stdout.txt')).toString().split('\n').filter(l => /\[guard\]\s+ok\s+scripts\//.test(l)),
    collectorToolParents: 'NOT_CAPTURED',
  }
  assert(r.originalCommands.build.every(c => c.exit === 0))
  assert.equal(r.originalCommands.guardRows.length, 95)
  write('audit.json', r)
  console.log({ sealed: r.index, source: r.candidate.sourceHashes.count, artifacts: r.candidate.artifacts.count,
    sourceInheritance: inputs.length, src: src.length, loaded: { ...r.loaded, actual: undefined },
    branches: Object.fromEntries(Object.entries(r.branches).map(([b, x]) => [b, { exit: x.exit.exit, frames: x.frames.count }])),
    rawSnapshots: r.rawSnapshots.length, rawFiles: r.rawSnapshots.reduce((a, x) => a + x.count, 0), assertions: 'complete' })
} else if (mode === 'final') {
  const before = json(path.join(out, 'before.json')), drift = []
  for (const [p, old] of Object.entries(before.manifest))
    if (!fs.existsSync(p) || JSON.stringify(stamp(p)) !== JSON.stringify(old)) drift.push(p)
  assert.deepEqual(drift, [])
  const checked = Object.entries(before.append).map(([p, old]) => {
    const b = read(path.join(ev, p))
    return { path: p, initialBytes: old.bytes, finalBytes: b.length,
      prefixUnchanged: b.length >= old.bytes && sha(b.subarray(0, old.bytes)) === old.sha256 }
  })
  assert(checked.every(x => x.prefixUnchanged))
  write('final.json', { at: new Date().toISOString(), protectedFiles: Object.keys(before.manifest).length,
    drift, append: checked, released: true,
    ownFiles: Object.fromEntries(walk(path.join(repo, 'docs/testing')).filter(p => p.startsWith(path.join(repo, prefix)))
      .map(p => [path.relative(repo, p), stamp(p)])),
    boundary: 'Only this review released; no product/GUI/builder/runtime/service lock or access; Main A17 continues separately.' })
  console.log({ protectedFiles: Object.keys(before.manifest).length, drift, append: checked, released: true })
} else throw Error('Use before, audit, final; each output refuses overwrite.')

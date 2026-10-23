import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

// Archive-only review. No product imports, subprocesses, network or private roots.
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const evidence = 'reports/all-pending-evidence-20261021/'
const pack = evidence + 'P0ContextMetricR1/'
const prior = evidence + 'Successor114GuiR1/'
const prefix = 'docs/testing/p0-context-metric-gui-review-20261023-r1'
const protectedInputs = {}
const errors = []
const groups = {}
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const fingerprint = b => ({ bytes: b.length, sha256: sha(b) })
const read = rel => {
  assert(!path.isAbsolute(rel) && !rel.split('/').includes('..'))
  const b = fs.readFileSync(path.join(repo, rel))
  protectedInputs[rel] ??= fingerprint(b)
  return b
}
const json = rel => JSON.parse(read(rel).toString())
const local = name => json(pack + name)
const equal = (a, b) => assert.deepEqual(a, b)
const check = (name, run) => {
  try { groups[name] = { verified: true, result: run() } }
  catch (e) {
    errors.push({ group: name, message: e.message })
    groups[name] = { verified: false }
  }
}
const writeNew = (suffix, value) => {
  assert(['-audit.json', '-audit-r2.json', '-audit-r3.json',
    '-seal.json', '-seal-r2.json'].includes(suffix))
  fs.writeFileSync(path.join(repo, prefix + suffix),
    JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
const inventory = root => {
  const result = []
  const walk = rel => {
    for (const entry of fs.readdirSync(path.join(repo, rel), { withFileTypes: true })) {
      const f = rel + entry.name
      if (entry.isDirectory()) walk(f + '/')
      else {
        assert(entry.isFile(), 'Unexpected non-file: ' + f)
        result.push(f.slice(root.length))
      }
    }
  }
  walk(root)
  return result.sort()
}
const verifyIndex = (root, wrapper = false) => {
  const parsed = json(root + 'index-r1.json')
  const files = wrapper ? parsed.files : parsed
  for (const [f, expected] of Object.entries(files)) equal(fingerprint(read(root + f)), expected)
  return {
    count: Object.keys(files).length,
    index: protectedInputs[root + 'index-r1.json'],
    additions: inventory(root).filter(f => f !== 'index-r1.json' && !Object.hasOwn(files, f)),
  }
}
const roots = state => local(state + '-roots.json')
const record = (state, rel) => local(state + '-raw/data/pmtool/' + rel).record
const changed = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).sort()
const resultText = response => response.body.result.value.result.text
const structuredResult = response => JSON.parse(resultText(response))
const events = () => Object.keys(local('index-r1.json')).filter(f => f.endsWith('-events.json'))
const gatewayLog = evidence + 'CombinedGuiR1/gateway-requests.ndjson'
const gatewayRows = () => fs.readFileSync(path.join(repo, gatewayLog), 'utf8')
  .split('\n').filter(Boolean).map(line => ({ line, value: JSON.parse(line) }))

if (['seal', 'seal-r2'].includes(process.argv[2])) {
  const outputSuffix = '-' + process.argv[2] + '.json'
  const audit = json(prefix + '-audit-r3.json')
  for (const [f, expected] of Object.entries(audit.protectedInputs)) {
    try { equal(fingerprint(read(f)), expected) }
    catch (e) { errors.push({ file: f, message: e.message }) }
  }
  const log = gatewayRows()
  for (const x of audit.groups.rpc_gateway_frames.result.gatewayRows) {
    const matching = log.filter(y => y.value.sequence === x.sequence)
    if (matching.length !== 1 || sha(Buffer.from(matching[0].line)) !== x.lineSha256)
      errors.push({ gatewaySequence: x.sequence, message: 'Original gateway row changed/missing' })
  }
  const selfFiles = [prefix + '-reader.mjs', prefix + '-audit.json',
    prefix + '-audit-r2.json', prefix + '-audit-r3.json', prefix + '-report.md']
  if (process.argv[2] === 'seal-r2') selfFiles.push(prefix + '-seal.json')
  const self = Object.fromEntries(selfFiles.map(f => [f, fingerprint(read(f))]))
  const report = read(prefix + '-report.md').toString()
  const links = [...report.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1])
  const missingLinks = links.filter(link => !link.includes('://') && !link.startsWith('#'))
    .filter(link => link !== path.basename(prefix + outputSuffix))
    .filter(link => !fs.existsSync(path.resolve(repo, 'docs/testing', link.split('#')[0])))
  if (missingLinks.length) errors.push({ missingLinks })
  const whitespace = report.split('\n').flatMap((line, i) =>
    /[ \t]+$/.test(line) ? [i + 1] : [])
  if (whitespace.length) errors.push({ trailingWhitespaceLines: whitespace })
  writeNew(outputSuffix, {
    at: new Date().toISOString(), runtime: process.version, platform: process.platform,
    protectedCount: Object.keys(audit.protectedInputs).length,
    drift: errors, self, missingLinks, whitespace,
    productExecution: 'NOT_RUN', guiExecution: 'NOT_RUN',
    sourcePrivateRootsRead: false, gitOperations: 0,
    lifecycle: 'released/STOP',
  })
  console.log(JSON.stringify({ sealErrors: errors, lifecycle: 'released/STOP' }))
  process.exitCode = errors.length ? 1 : 0
} else {
  assert(['audit', 'audit-r2', 'audit-r3'].includes(process.argv[2]))
  for (const f of [
    'AGENTS.md', 'docs/collaboration.md',
    'docs/plans/2026-10-23-p0-p1-sealed-review-dispatch.md',
    'docs/testing/remaining-governance-cases-20261021.md',
    'docs/testing/op-growth-final-inheritance-20261022-r1.md',
    'docs/testing/p0-capture-remaining-gui-review-20261023-r1-report.md',
    'docs/testing/copilot-prefix114-gui-retest-20261022-r1-report.md',
    'docs/testing/combined-successor114-regression-review-20261022-r1-report.md',
  ]) read(f)

  check('archive_integrity', () => {
    const current = verifyIndex(pack)
    const inherited = verifyIndex(prior, true)
    assert.equal(current.count, 695)
    assert.equal(inherited.count, 166)
    return { current, inherited }
  })
  check('candidate_inheritance', () => {
    const binding = local('binding.json'), close = local('source-binding-close.json')
    const source = json(evidence + 'CombinedSuccessor114R1/source-files.json')
    const complete = json(evidence + 'CombinedSuccessor114R1/complete-inputs.json')
    equal(binding.source, source)
    equal(close.source, source)
    assert.equal(Object.keys(source.source).length, 114)
    assert.equal(Object.keys(complete).length, 521)
    assert.equal(close.completeInputCount, 521)
    for (const [f, expected] of Object.entries(source.source))
      if (f.startsWith('packages/dsh-pm-tool/'))
        assert.equal(complete[f.slice('packages/dsh-pm-tool/'.length)].sha256, expected)
    const host = json(prior + 'host-start.json')
    const gateway = json(prior + 'gateway-binding.json')
    assert.equal(binding.host.pid, host.pid)
    assert.equal(binding.host.port, host.port)
    assert.equal(close.pid, host.pid)
    assert.equal(close.port, host.port)
    assert.equal(binding.gateway.pid, gateway.pid)
    assert.equal(binding.gateway.port, gateway.port)
    assert.equal(host.flags.DSH_PM_E2E, '0')
    equal(binding.host.freeze + '/packages/dsh-pm-tool', host.bundle)
    const mode = record('context-before', 'settings/aiModelMode.json')
    assert.equal(mode.value, 'prod')
    return { baseline: source.baseline, sourceCount: 114, completeCount: 521,
      host, gateway, mode, frozenBytes: 'Inherited original independent review, not re-read private roots',
      bindingScopeCorrection: 'binding.scope includes P1004; dispatch section 2 and this pack exclude P1004' }
  })
  check('rpc_gateway_frames', () => {
    const requests = [], responses = [], frames = [], exceptions = []
    for (const f of events()) {
      const e = local(f)
      for (const x of e.rows) {
        if (x.type === 'request') requests.push({ file: f, ...x })
        else if (x.type === 'response') responses.push({ file: f, ...x })
        else exceptions.push({ file: f, ...x })
      }
      for (const x of e.frames) {
        assert.equal(sha(read(pack + x.file)), x.sha256)
        frames.push({ eventFile: f, ...x })
      }
    }
    assert.equal(new Set(requests.map(x => x.body.rpcId)).size, requests.length)
    for (const req of requests) {
      const matches = responses.filter(x => x.body.rpcId === req.body.rpcId)
      assert.equal(matches.length, 1)
      assert(Date.parse(req.at) <= Date.parse(matches[0].at))
      assert.equal(matches[0].body.result.ok, true)
      assert.equal(matches[0].body.result.value.result.kind, 'success')
    }
    assert.equal(responses.length, requests.length)
    const ask = requests.filter(x => x.body.payload.args.line.startsWith('/pm ask '))
    const apply = requests.filter(x => x.body.payload.args.line.startsWith('/pm ask-apply '))
    const undo = requests.filter(x => x.body.payload.args.line.startsWith('/pm ask-undo undo-'))
    assert.equal(ask.length, 3)
    assert.equal(apply.length, 1)
    assert.equal(undo.length, 1)
    const archived = local('gateway-real-requests.json')
    assert.equal(archived.length, 3)
    const liveRows = gatewayRows()
    const matchedGatewayRows = archived.map(g => {
      const matches = liveRows.filter(x => x.value.sequence === g.sequence)
      assert.equal(matches.length, 1)
      equal(matches[0].value, g)
      const prompt = g.body.messages[0].content[0].text
      const matchingRequests = ask.filter(req =>
        prompt.endsWith(req.body.payload.args.line.slice('/pm ask p-0001  '.length)))
      assert.equal(matchingRequests.length, 1)
      const req = matchingRequests[0]
      const response = responses.find(x => x.body.rpcId === req.body.rpcId)
      assert(Date.parse(req.at) <= Date.parse(g.at) && Date.parse(g.at) <= Date.parse(response.at))
      assert.equal(g.fixture.text, response.body.result.value.result.text)
      return { sequence: g.sequence, at: g.at, rpcId: req.body.rpcId,
        path: g.path, lineSha256: sha(Buffer.from(matches[0].line)) }
    })
    return { requests: requests.map(x => ({ file: x.file, at: x.at, ...x.body })),
      responses: responses.map(x => ({ file: x.file, at: x.at, ...x.body })),
      frames, exceptions, askCount: ask.length, applyCount: apply.length, undoCount: undo.length,
      gatewayRows: matchedGatewayRows }
  })
  check('raw_roots_and_write_boundaries', () => {
    const states = Object.keys(local('index-r1.json')).filter(f => f.endsWith('-roots.json'))
      .map(f => f.slice(0, -'-roots.json'.length))
    let rawCount = 0
    const baseline = roots('context-before'), result = []
    for (const state of states) {
      const map = roots(state)
      for (const [f, expected] of Object.entries(map)) {
        if (f.startsWith('data/pmtool/')) {
          equal(fingerprint(read(pack + state + '-raw/' + f)), expected)
          rawCount++
        } else {
          // Files/backups have archived digest lists, not payload copies in this pack.
          equal(expected, baseline[f])
        }
      }
      result.push({ state, rootCount: Object.keys(map).length,
        changedFromBefore: changed(baseline, map) })
    }
    const noapply = ['context-material-visible', 'context-material-projection',
      'context-material-exit-noapply', 'context-empty-visible', 'context-empty-exit-noapply',
      'narrow-before', 'narrow-after-timeout', 'narrow-tab-visible', 'narrow-before-confirm']
    for (const state of noapply) equal(roots(state), baseline)
    const applied = roots('narrow-applied-before-undo'), undone = roots('narrow-undone')
    equal(changed(baseline, applied), [
      'data/pmtool/settings/askApplyIdempotency.json',
      'data/pmtool/settings/pmProvenanceLedger.json',
      'data/pmtool/settings/pmProvenancePending.json',
      'data/pmtool/tasks/t-0006.json',
    ])
    equal(roots('narrow-confirm-after-timeout'), applied)
    equal(changed(applied, undone), [
      'data/pmtool/settings/pmProvenanceLedger.json', 'data/pmtool/tasks/t-0006.json',
    ])
    for (const state of ['metric-after-undo-visible', 'provenance-after-undo-visible',
      'metric-other-project-visible', 'metric-reentry-visible']) equal(roots(state), undone)
    return { states: result, rawCount, noapply,
      filesBackups: 'Six digest entries invariant; payload not copied into current pack',
      excludedRoots: ['host sessions', 'private entry/profile', 'cache', 'formal services', 'whole disk'] }
  })
  check('context_material_empty', () => {
    const task = record('context-before', 'tasks/t-0001.json')
    const empty = record('context-before', 'tasks/t-0006.json')
    const gateway = local('gateway-real-requests.json')
    const prompt = gateway[0].body.messages[0].content[0].text
    const answer = resultText(local('material-response.json'))
    const emptyAnswer = resultText(local('empty-response.json'))
    assert.equal(task.description, '')
    assert(task.evidenceUrl.startsWith('https://'))
    assert.equal(task.deliverableId, 'dlv-0001')
    assert.equal(task.attachments.length, 4)
    const attachmentTitles = task.attachments.map(a => a.kind === 'link' ? a.title :
      a.kind === 'deliverable' ? a.frozenName :
        record('context-before', 'file_assets/' + a.assetId + '.json').fileName)
    for (const title of attachmentTitles) {
      assert(prompt.includes(title))
      assert(answer.includes(title))
    }
    const log = task.progressLog.filter(x => !x.deletedAt)
      .map(x => x.revisions.at(-1).content)
    for (const content of log) { assert(prompt.includes(content)); assert(answer.includes(content)) }
    for (const stale of ['E1 rv1正文', 'E1 rv2正文', 'E2 rv1已删除', 'E2 rv2已删除'])
      assert(!prompt.includes(stale))
    assert(!prompt.includes('relPath') && !prompt.includes('files/87/'))
    assert(!prompt.includes('t-0002 '))
    assert.equal(empty.description, '来自会话待办，保持默认未开始')
    for (const f of ['evidenceUrl', 'deliverableId', 'attachments', 'progressLog'])
      assert(!empty[f] || (Array.isArray(empty[f]) && empty[f].length === 0))
    assert.equal(task.status, 'todo')
    assert.equal(empty.status, 'todo')
    for (const text of [answer, emptyAnswer]) assert(!text.includes('```json'))
    assert(local('context-material-projection.json').text.includes('证据：有'))
    assert(local('context-empty-visible.json').text.includes('证据：无'))
    assert(local('context-material-visible.json').text.includes(answer))
    assert(local('context-empty-visible.json').text.includes(emptyAnswer))
    return { taskId: task.id, emptyTaskId: empty.id, attachmentTitles, latestLiveLog: log,
      answer, emptyAnswer, prompt, scene: 'Finite fixture, no adversarial context expansion' }
  })
  check('narrow_apply_clean_undo', () => {
    const raw = resultText(local('narrow-response.json'))
    const plan = JSON.parse(raw.match(/```json\n([\s\S]+?)\n```/)[1]).plan
    const legal = plan[0].action.patch
    const before = record('narrow-before-confirm', 'tasks/t-0006.json')
    const after = record('narrow-applied-before-undo', 'tasks/t-0006.json')
    const undone = record('narrow-undone', 'tasks/t-0006.json')
    equal(Object.keys(legal).sort(), ['branch', 'description', 'evidenceUrl', 'repoUrl'])
    for (const [f, value] of Object.entries(legal)) assert.equal(after[f], value)
    for (const f of ['assignee', 'status', 'progress', 'startDate', 'dueDate'])
      equal({ own: Object.hasOwn(after, f), value: after[f] },
        { own: Object.hasOwn(before, f), value: before[f] })
    assert.equal(after.title, before.title)
    equal(changed(before, after), ['branch', 'description', 'evidenceUrl', 'repoUrl', 'updatedAt'])
    equal(undone, before)
    equal(read(pack + 'narrow-before-confirm-raw/data/pmtool/tasks/t-0006.json'),
      read(pack + 'narrow-undone-raw/data/pmtool/tasks/t-0006.json'))
    const req = groups.rpc_gateway_frames.result.requests
      .find(x => x.payload.args.line.startsWith('/pm ask-apply '))
    const line = req.payload.args.line
    const steps = JSON.parse(line.slice('/pm ask-apply p-0001 '.length, line.indexOf(' --base ')))
    assert.equal(steps.length, 1)
    equal(steps[0].patch, legal)
    assert(!Object.hasOwn(steps[0].patch, 'title'))
    assert(local('narrow-before-confirm.json').text.includes('已拒绝：s2 t-0006：未知字段 title'))
    assert(local('narrow-confirm-after-timeout.json').text.includes('撤销 · 整批 1 步'))
    assert(!local('narrow-undone.json').buttons.some(b => b.text === '撤销 · 整批 1 步'))
    return { legal, rejectedPlanStep: plan[1], actualApplyRequest: req,
      oldFiveScalars: ['assignee', 'status', 'progress', 'startDate', 'dueDate']
        .map(f => ({ field: f, value: before[f] ?? null, own: Object.hasOwn(before, f) })),
      beforeBytes: roots('narrow-before-confirm')['data/pmtool/tasks/t-0006.json'],
      appliedBytes: roots('narrow-applied-before-undo')['data/pmtool/tasks/t-0006.json'],
      undoneBytes: roots('narrow-undone')['data/pmtool/tasks/t-0006.json'],
      fieldVisibility: 'Four legal values proven in RPC/raw, not all displayed in draft controls' }
  })
  check('metric_ledger_reload', () => {
    const entries = record('narrow-undone', 'settings/pmProvenanceLedger.json').value.entries
    const beforeEntries = record('context-before', 'settings/pmProvenanceLedger.json').value.entries
    assert.equal(entries.length, 2)
    equal(entries[0], beforeEntries[0])
    const applied = record('narrow-applied-before-undo', 'settings/pmProvenanceLedger.json').value.entries
    assert.equal(applied[1].undo.used, false)
    assert.equal(entries[1].undo.used, true)
    equal(entries[1].audit.slice(0, 1), applied[1].audit)
    equal(entries[1].audit.map(x => x.kind), ['applied', 'undone'])
    const byKind = {}, outcomes = { undone: 0, conflict: 0, failed: 0 }
    let basisCount = 0
    for (const e of entries) {
      byKind[e.kind] = (byKind[e.kind] ?? 0) + 1
      basisCount += e.refs.filter(ref => ref.role === 'basis').length
      for (const a of e.audit) if (Object.hasOwn(outcomes, a.kind)) outcomes[a.kind]++
    }
    const pending = record('narrow-undone', 'settings/pmProvenancePending.json').value.entries.length
    const metric = structuredResult(local('metric-after-undo-command.json'))
    const again = structuredResult(local('metric-reentry-command.json'))
    const empty = structuredResult(local('metric-other-project-command.json'))
    equal(metric, again)
    equal(metric.byKind, byKind)
    equal(metric.undoOutcomes, outcomes)
    assert.equal(metric.appliedSteps, basisCount)
    assert.equal(metric.pendingCount, pending)
    assert.equal(metric.total, entries.length)
    assert.equal(metric.last, entries.map(e => e.createdAt).sort().at(-1))
    equal(empty.byKind, {})
    equal(empty.undoOutcomes, { undone: 0, conflict: 0, failed: 0 })
    for (const f of ['total', 'appliedSteps', 'pendingCount']) assert.equal(empty[f], 0)
    assert.equal(empty.last, null)
    assert(!Object.hasOwn(metric, 'rejected') && !Object.hasOwn(empty, 'rejected'))
    const provenance = structuredResult(local('provenance-after-undo-command.json'))
    equal(provenance.entries.map(({ recheck, ...e }) => e)
      .sort((a, b) => a.id.localeCompare(b.id)),
      [...entries].sort((a, b) => a.id.localeCompare(b.id)))
    const first = local('metric-after-undo-visible.json')
    const reload = local('metric-reentry-visible.json')
    assert.equal(first.origin, reload.origin)
    assert.notEqual(first.timeOrigin, reload.timeOrigin)
    return { entries, metric, again, empty, pending,
      reload: { first: first.timeOrigin, second: reload.timeOrigin, origin: first.origin },
      provenanceStates: provenance.entries.map(e => ({ id: e.id, recheck: e.recheck })),
      conflictFailed: 'Zero sample counts only; inherited AUTO not re-signed as two GUI fault journeys',
      rejected: 'Absent in actual metric schema, not zero/fabricated' }
  })
  check('timeout_observations', () => {
    const before = local('narrow-after-timeout.json')
    const tab = local('narrow-tab-visible.json')
    assert(before.text.includes('只读诊断'))
    assert(!before.text.includes('操作计划'))
    assert(tab.text.includes('操作计划') && tab.text.includes('整批执行（1）'))
    equal(local('narrow-tab-events.json').rows, [])
    equal(roots('narrow-after-timeout'), roots('narrow-tab-visible'))
    const r3 = read(pack + 'execution-scripts/pmtool-p0-context-round03-20261023.mjs').toString()
    const r4 = read(pack + 'execution-scripts/pmtool-p0-context-round04-20261023.mjs').toString()
    assert(r3.includes("innerText.includes('补充合法备注')"))
    assert(r4.includes("innerText.includes('已应用')"))
    return { round03: 'Response saved; diagnosis tab observation timed out; selected draft shown later',
      round04: 'Apply response saved; ephemeral applied text wait timed out; later undo affordance observed',
      beforeAt: before.at, selectedDraftAt: tab.at,
      confirmedObservationAt: local('narrow-confirm-after-timeout.json').at,
      clickTimestamp: 'Not separately logged; state/frame comparison, no invented click trace',
      outerExecutionReceipts: 'Not present in current 695-item index; no all-zero exit claim' }
  })
  for (const [f, expected] of Object.entries(protectedInputs))
    equal(fingerprint(fs.readFileSync(path.join(repo, f))), expected)
  if (process.argv[2] !== 'audit') {
    for (const suffix of process.argv[2] === 'audit-r3'
      ? ['-audit.json', '-audit-r2.json'] : ['-audit.json']) {
      const previous = json(prefix + suffix)
      for (const [f, expected] of Object.entries(previous.protectedInputs))
        equal(fingerprint(read(f)), expected)
    }
  }
  writeNew('-' + process.argv[2] + '.json',
    { at: new Date().toISOString(), runtime: process.version,
    platform: process.platform, groups, errors, protectedInputs,
    productExecution: 'NOT_RUN', guiExecution: 'NOT_RUN',
    note: 'Reader verifies bytes/structure only; visual verdict separately authored after view_image' })
  console.log(JSON.stringify({ groups: Object.fromEntries(Object.entries(groups)
    .map(([k, v]) => [k, v.verified])), errors,
    protectedCount: Object.keys(protectedInputs).length }, null, 2))
  process.exitCode = errors.length ? 1 : 0
}

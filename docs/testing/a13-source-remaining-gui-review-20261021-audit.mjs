import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { isDeepStrictEqual as equal } from 'node:util'

// Only hash named archives and declared candidate bytes; never execute collectors.
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a13-source-remaining-gui-review-20261021'
const a12 = 'reports/all-pending-evidence-20261021/A12'
const gateway = 'reports/all-pending-evidence-20261021/A13/gateway'
const green = 'docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected'
const planPath = '/private/tmp/pmtool-a13-gateway-runtime-20261021/artifacts/plan.json'
const collectorPaths = [
  '/private/tmp/pmtool-a12-consumer-read-20261021.mjs',
  '/private/tmp/pmtool-a13-same-name-prepare-20261021.mjs',
  '/private/tmp/pmtool-a13-same-name-apply-jump-20261021.mjs',
]
const roots = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/a12-governance-source-gui-retest-20261021.md',
  'docs/testing/a12-governance-source-gui-retest-20261021-inputs-r2.json',
  'docs/testing/a12-governance-source-gui-retest-20261021-observations-r2.json',
  'docs/testing/a12-provenance-id-independent-retest-20261021.md',
  'docs/testing/a13-governance-consumer-contract-clarify-20261021.md',
  'docs/testing/a13-governance-consumer-contract-clarify-20261021-inputs.json',
  'reports/a13-governance-gateway-entry-exploration-20261021.md',
  'reports/all-pending-acceptance-execution-20261021.md',
  a12, gateway, green, planPath,
]
const absolute = p => path.isAbsolute(p) ? p : path.join(repo, p)
const hash = b => crypto.createHash('sha256').update(b).digest('hex')
const raw = p => fs.readFileSync(absolute(p))
const read = p => JSON.parse(raw(p))
const excluded = p => /(?:^|\/)(?:private|credentials)(?:\/|$)/.test(p.replace(/^\/private\/tmp\//, ''))
  || /^(?:url|private-url|token|secret|cookie|credentials)(?:[.-]|$)/i.test(path.basename(p))
function scan(p, files, missing) {
  if (excluded(p)) return
  if (!fs.existsSync(absolute(p))) { missing.push(p); return }
  const stat = fs.lstatSync(absolute(p))
  if (stat.isSymbolicLink()) throw new Error(`Unexpected symlink: ${p}`)
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(absolute(p)).sort()) scan(path.join(p, name), files, missing)
  } else if (stat.isFile()) {
    const b = raw(p)
    files[p] = { bytes: b.length, sha256: hash(b) }
  }
}
function output(suffix, data) {
  fs.writeFileSync(absolute(`${prefix}-${suffix}.json`), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
}
const delta = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => a[k] !== b[k]).map(k => ({ path: k, before: a[k] ?? null, after: b[k] ?? null }))
const mode = process.argv[2]
if (mode === 'freeze') {
  const files = {}, missing = []
  for (const p of roots) scan(p, files, missing)
  const candidate = read(`${a12}/candidate.json`)
  const sourceComparison = [], artifactComparison = []
  for (const [p, expected] of Object.entries(candidate.sourceHashes)) {
    for (const tree of [repo, candidate.tree]) {
      const full = path.join(tree, p)
      scan(full, files, missing)
      sourceComparison.push({ tree, path: p, expected, actual: files[full]?.sha256 ?? null })
    }
  }
  for (const [p, expected] of Object.entries(candidate.artifacts)) {
    const full = path.join(candidate.tree, p)
    scan(full, files, missing)
    artifactComparison.push({ path: p, expected, actual: files[full]?.sha256 ?? null })
  }
  const result = { at: new Date().toISOString(), node: process.version, platform: process.platform,
    roots, files, missing, baseline: candidate.baseline, sourceComparison, artifactComparison,
    boundary: 'Independent archived RA-AI01..03 remaining evidence review; no GUI, product imports/tests, network, build/install, services, credentials or commit.' }
  output('inputs', result)
  console.log(JSON.stringify({ at: result.at, files: Object.keys(files).length, missing,
    candidateSourceMismatch: sourceComparison.filter(x => x.tree === candidate.tree && x.actual !== x.expected),
    mainSourceMismatch: sourceComparison.filter(x => x.tree === repo && x.actual !== x.expected).map(x => x.path),
    artifactMismatch: artifactComparison.filter(x => x.actual !== x.expected) }, null, 2))
} else if (mode === 'supplement') {
  const files = {}, missing = []
  for (const p of collectorPaths) scan(p, files, missing)
  const result = { at: new Date().toISOString(), files, missing,
    boundary: 'Named original nonprivate collector source only; not executed, no helper/private URL/log/config reads.' }
  output('inputs-supplement', result)
  console.log(JSON.stringify(result, null, 2))
} else if (mode === 'inspect') {
  const frozen = read(`${prefix}-inputs.json`)
  const paths = Object.keys(frozen.files).filter(p =>
    p.startsWith(`${a12}/governance/consumer-read/`) && p.endsWith('.json') && !p.includes('/frames/')
    || p.startsWith(`${gateway}/same-name/`) && p.endsWith('.json') && !p.includes('-frames/'))
  for (const p of paths) {
    if (hash(raw(p)) !== frozen.files[p].sha256) throw new Error(`Drift: ${p}`)
    const o = read(p)
    console.log(JSON.stringify({ path: p, keys: Object.keys(o),
      origin: o.origin, timeOrigin: o.timeOrigin, mode: o.mode,
      text: o.pm?.text, fields: o.fields,
      steps: o.steps, delta: o.before && o.after ? delta(o.before, o.after) : undefined }, null, 2))
  }
} else if (mode === 'review') {
  const frozen = read(`${prefix}-inputs.json`)
  Object.assign(frozen.files, read(`${prefix}-inputs-supplement.json`).files)
  const bytes = p => {
    const b = raw(p)
    if (!frozen.files[p] || hash(b) !== frozen.files[p].sha256) throw new Error(`Unfrozen or drifted input: ${p}`)
    return b
  }
  const get = p => JSON.parse(bytes(p))
  const g = p => `${a12}/governance/${p}`
  const s = p => `${gateway}/same-name/${p}`
  const checks = []
  const check = (name, observed, evidence) => checks.push({ name, observed: Boolean(observed), evidence })
  const entries = p => get(p).record.value.entries
  const candidate = get(`${a12}/candidate.json`)
  check('A12-512-source-and-453-artifacts-match', frozen.sourceComparison.filter(x => x.tree === candidate.tree)
    .every(x => x.actual === x.expected) && frozen.artifactComparison.every(x => x.actual === x.expected),
  `${prefix}-inputs.json`)
  check('tracked-patch-matches', hash(bytes(`${a12}/product-tracked.patch`)) === candidate.trackedPatchSha,
    `${a12}/product-tracked.patch`)
  const oldInputs = get('docs/testing/a12-governance-source-gui-retest-20261021-inputs-r2.json')
  const inherited = Object.keys(oldInputs.files).filter(p => p.startsWith(`${a12}/governance/`))
    .map(p => ({ path: p, matches: equal(oldInputs.files[p], frozen.files[p]) }))
  check('original-A12-GUI-evidence-unchanged', inherited.every(x => x.matches),
    'docs/testing/a12-governance-source-gui-retest-20261021-inputs-r2.json')
  const clarify = get('docs/testing/a13-governance-consumer-contract-clarify-20261021-inputs.json')
  const clarifySource = clarify.files.filter(f => f.path.startsWith('packages/'))
    .map(f => ({ path: f.path, expected: f.sha256, actual: candidate.sourceHashes[f.path] }))
  check('clarification-source-binds-to-A12', clarifySource.every(x => x.expected === x.actual),
    'docs/testing/a13-governance-consumer-contract-clarify-20261021-inputs.json')

  const client = bytes(path.join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const text = client.toString().replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(text + (text.endsWith('\n') ? '' : '\n') + ';\n')
  const loadedBindings = []
  for (const [resultPath, comboPath, origin] of [
    [g('loaded-r4/result.json'), g('loaded-r4/combo-1.txt'), 'http://127.0.0.1:3229'],
    [`${gateway}/loaded-r1/result.json`, `${gateway}/loaded-r1/combo-1.txt`, 'http://127.0.0.1:3241'],
  ]) {
    const loaded = get(resultPath), combo = bytes(comboPath), event = loaded.events[0]
    const first = combo.indexOf(segment), match = event.matches[0]
    check(`${origin}-uncached-complete-client-context-binding`, event.status === 200 && event.fromDiskCache === false
      && event.requestId && Number.isFinite(event.requestTimestamp) && Number.isFinite(event.wallTime)
      && loaded.browserContextKind === 'default' && loaded.targetId === event.frameId
      && loaded.state.origin === origin && loaded.state.pmMounted && loaded.state.pilot === 'off'
      && hash(combo) === event.responseSha && combo.length === event.bytes
      && first >= 0 && first === match.first && combo.indexOf(segment, first + 1) === -1
      && hash(segment) === match.segmentSha && segment.length === match.segmentBytes
      && hash(client) === match.sourceSha && match.uniqueComplete, resultPath)
    loadedBindings.push({ resultPath, at: loaded.at, event, context: loaded.browserContextKind,
      targetId: loaded.targetId, timeOrigin: loaded.state.timeOrigin, clientSha: hash(client),
      fullSegmentSha: hash(segment), first, second: combo.indexOf(segment, first + 1) })
  }
  const resolver = get(g('resolver/actual-resolver.json'))
  const setup = get(`${a12}/environment.json`).setups.find(x => x.label === 'governance')
  check('new-PID-actual-resolver-package-patch-binding', resolver.pid === 79214 && resolver.port === 3229
    && resolver.isSymlink && resolver.literalTarget === path.join(candidate.tree, 'packages/dsh-pm-tool')
    && resolver.resolved === resolver.literalTarget && resolver.packageVersion === '0.7.4'
    && resolver.packageSHA === hash(bytes(path.join(candidate.tree, 'packages/dsh-pm-tool/package.json')))
    && resolver.cordisPatchSHA === setup.patchSha
    && bytes(g('resolver/process.txt')).toString().includes('79214 ')
    && bytes(g('resolver/process.txt')).toString().includes('--port 3229')
    && bytes(g('resolver/listener.txt')).toString().includes('127.0.0.1:3229 (LISTEN)')
    && bytes(g('resolver/cwd.txt')).toString().includes('n/Users/bytedance/Projects/dsh-pm/deepseek-harness')
    && ['process', 'listener', 'cwd'].every(n => get(g(`resolver/${n}.exit.json`)).exit === 0),
  g('resolver'))
  check('r3-facility-error-and-r4-success-preserved', get(g('loaded-r3/outer-exit.json')).exit === 1
    && get(g('loaded-r3/outer-exit.json')).error.includes('isIncognito is not a function')
    && get(g('loaded-r4/outer-exit.json')).exit === 0, g('loaded-r3/outer-exit.json'))
  const timeline = p => {
    const events = get(p)
    const runs = events.filter(x => x.event.type === 'command/run')
    return runs.map(x => {
      const done = events.find(y => y.event.type === 'command/done' && y.event.data.commandId === x.event.data.commandId)
      return { seq: x.event.seq, at: x.at, id: x.event.data.commandId, args: x.event.data.args.trim(),
        doneAt: done?.at, doneSeq: done?.event.seq, kind: done?.event.data.kind, text: done?.event.data.text }
    })
  }
  const consumer = get(g('consumer-read/boundary.json'))
  const oldLedger = get(g('source-stale/missing-recheck-2-after-ledger.json'))
  const consumerLedger = get(g('consumer-read/ledger-after.json'))
  const consumerRuns = timeline(g('consumer-read/command-events.json'))
  check('consumer-full-registered-data-and-ledger-zero-change', equal(consumer.before, consumer.after)
    && equal(consumerLedger, oldLedger)
    && consumer.before['/pmtool/settings/pmProvenanceLedger.json'] === hash(bytes(g('consumer-read/ledger-after.json'))),
  g('consumer-read/boundary.json'))
  check('consumer-four-real-read-pairs-no-generation', consumerRuns.length === 4
    && get(g('consumer-read/command-events.json')).length === 8
    && consumerRuns.every(x => x.args === 'ask-provenance p-0001' && x.kind === 'success' && x.doneSeq > x.seq)
    && consumer.requests.length === 4 && consumer.requests.every(x => x.origin === 'http://127.0.0.1:3229'
      && x.path === '/api/commands/execute' && x.method === 'POST'),
  g('consumer-read/command-events.json'))
  check('consumer-results-old-refs-history-and-current-stale', consumerRuns.every(x => {
    const result = JSON.parse(x.text), e = result.entries[0]
    const { recheck, ...stored } = e
    return result.entries.length === 1 && result.pendingCount === 0
      && equal(stored, oldLedger.record.value.entries[0])
      && recheck.conclusion === 'manual-review'
      && equal(recheck.rows.map(r => r.state), ['changed', 'missing', ...Array(8).fill('consistent')])
  }), g('consumer-read/command-events.json'))
  const consumerStates = []
  for (const cap of ['WBS 任务拆解', '进度汇报叙述', '会议纪要归纳']) {
    for (const stage of ['ledger', 'refreshed']) {
      const p = g(`consumer-read/${cap}-${stage}.json`), o = get(p)
      check(`${cap}-${stage}-same-page-mode-ledger-history`, o.origin === 'http://127.0.0.1:3229'
        && o.timeOrigin === loadedBindings[0].timeOrigin && o.pm.text.includes(cap)
        && o.pm.text.includes('prv-mvi6srwe-mwn8sn') && o.pm.text.includes('需人工复核')
        && o.pm.text.includes('重校历史（4 次') && o.pm.text.includes('失效 2')
        && oldLedger.record.value.entries[0].refs.every(r => o.pm.text.includes(r.id)), p)
      consumerStates.push({ cap, stage, at: o.at, origin: o.origin, timeOrigin: o.timeOrigin,
        selectedCapabilityWords: o.pm.text.match(/WBS 任务拆解|进度汇报叙述|会议纪要归纳/g) })
    }
  }
  const collector = bytes(collectorPaths[0]).toString()
  check('consumer-original-collector-only-capability-read-refresh', collector.includes("document.querySelectorAll('.pm-ai-cap')")
    && collector.includes("n.innerText.trim()==='刷新'") && collector.includes('返回能力选择')
    && !collector.includes('await clickText(page,\'生成'), collectorPaths[0])

  const environment = get(`${gateway}/environment.json`), binding = get(`${gateway}/source-binding.json`)
  const host = get(`${gateway}/host-start-r2.json`), provider = get(`${gateway}/gateway-start.json`)
  check('A13-label-only-A12-plugin-host90027-gateway89884', binding.candidate === 'A12'
    && binding.runtimePackage === path.join(candidate.tree, 'packages/dsh-pm-tool')
    && environment.package === binding.runtimePackage && host.pid === 90027 && provider.pid === 89884
    && host.argv.includes('3241') && provider.argv.includes('3240'), `${gateway}/source-binding.json`)
  const successText = provider.argv[provider.argv.indexOf('--success-text') + 1]
  const plan = JSON.parse(successText.match(/```json\s*([\s\S]*?)```/)[1]).plan
  check('original-plan-hash-same-t1-chain-independent-t2', hash(bytes(planPath)) === environment.planSHA
    && equal(get(planPath).plan, plan) && equal(plan.map(x => x.action.id), ['t-0001', 't-0001', 't-0002'])
    && equal(plan.map(x => x.needs), [[], ['s1'], []]), planPath)
  const providerEvents = bytes(`${gateway}/gateway.stdout.ndjson`).toString().trim().split('\n').map(x => JSON.parse(x))
  check('three-archived-real-HTTP-success-attempts', [1, 2, 3].every(n =>
    providerEvents.some(x => x.type === 'request' && x.attempt === n && x.path === '/v1/messages' && x.behavior === 'success')
    && providerEvents.some(x => x.type === 'result' && x.attempt === n && x.outcome === 'completed')), `${gateway}/gateway.stdout.ndjson`)
  const titles = get(s('title-boundary.json')), jumps = get(s('jump-boundary.json'))
  const renamed = ['t-0001', 't-0002'].map(id => get(s(`${id}-after-normal-title.json`)).record)
  const titleDeltas = delta(titles.before, titles.after)
  check('normal-title-writes-only-two-stable-tasks', equal(titleDeltas.map(x => x.path),
    ['/pmtool/tasks/t-0001.json', '/pmtool/tasks/t-0002.json'])
    && renamed.every((t, i) => t.id === `t-000${i + 1}` && t.projectId === 'p-0001' && t.title === '同名来源核验'),
  s('title-boundary.json'))
  check('normal-title-original-forms-before-new-ask-source', bytes(collectorPaths[1]).toString().includes('button[aria-label="编辑 ${title}"]')
    && bytes(collectorPaths[1]).toString().includes("await clickText(page,'保存更改')")
    && bytes(collectorPaths[1]).toString().indexOf("await fill(page,'input[name=title]'")
      < bytes(collectorPaths[1]).toString().indexOf("button[aria-label=\"发送\"]"), collectorPaths[1])
  const sameRuns = timeline(s('command-events.json'))
  const apply = sameRuns.find(x => x.args.startsWith('ask-apply p-0001 '))
  const [actionsText, baseText] = apply.args.slice('ask-apply p-0001 '.length).split(' --base ')
  const actions = JSON.parse(actionsText), base = JSON.parse(baseText)
  check('explicit-apply-matches-original-production-plan-and-current-base',
    equal(actions, plan.map(x => ({ ...x.action, stepId: x.stepId, title: x.title, needs: x.needs })))
    && equal(base, Object.fromEntries(renamed.map(t => [t.id, t.updatedAt])))
    && apply.kind === 'success' && apply.text.startsWith('已应用 3 步')
    && sameRuns.length === 7 && get(s('command-events.json')).length === 14
    && sameRuns.every(x => x.kind === 'success' && x.doneSeq > x.seq), s('command-events.json'))
  const snapshot = JSON.parse(sameRuns.find(x => x.args === 'web snapshot').text)
  const currentTasks = ['t-0001', 't-0002'].map(id => snapshot.tasks.find(t => t.id === id))
  const beforeEntries = entries(s('before-apply-ledger.json')), afterEntries = entries(s('after-apply-ledger.json'))
  const newEntries = afterEntries.filter(e => !beforeEntries.some(old => old.id === e.id))
  const newEntry = newEntries[0]
  check('new-production-two-same-label-ref-identities-match-real-postimages', newEntries.length === 1
    && newEntry.kind === 'ask-apply' && newEntry.status === 'confirmed' && newEntry.projectId === 'p-0001'
    && equal(newEntry.refs.map(r => [r.table, r.id, r.label]), [
      ['tasks', 't-0001', '同名来源核验'], ['tasks', 't-0002', '同名来源核验']])
    && newEntry.refs.every((r, i) => r.updatedAt === currentTasks[i].updatedAt && r.role === 'basis'
      && r.projectId === currentTasks[i].projectId && r.snapshotVersion === 1 && r.ruleRevision === 1
      && Boolean(r.basisFingerprint && r.fullFingerprint))
    && equal(newEntry.undo.postimages.map(x => x.id), ['t-0001', 't-0001', 't-0002']),
  s('after-apply-ledger.json'))
  check('old-entries-and-navigation-raw-ledger-unchanged', beforeEntries.every(e => equal(e, afterEntries.find(x => x.id === e.id)))
    && bytes(s('after-apply-ledger.json')).equals(bytes(s('after-jump-ledger.json')))
    && equal(jumps.beforeJump, jumps.afterJump), s('jump-boundary.json'))
  check('title-and-apply-ledger-manifest-linked', titles.after['/pmtool/settings/pmProvenanceLedger.json']
    === hash(bytes(s('before-apply-ledger.json')))
    && jumps.beforeJump['/pmtool/settings/pmProvenanceLedger.json'] === hash(bytes(s('after-apply-ledger.json'))),
  s('title-boundary.json'))
  const sameTargets = []
  for (const [i, id] of ['t-0001', 't-0002'].entries()) {
    const ref = get(s(`${id}-ref.json`)), target = get(s(`${id}-target.json`)), returned = get(s(`${id}-returned.json`))
    const fields = Object.fromEntries(target.fields.filter(f => f.name).map(f => [f.name, f.value]))
    check(`${id}-visible-ref-correct-target-and-return`, [ref, target, returned].every(o =>
      o.origin === 'http://127.0.0.1:3241' && o.timeOrigin === loadedBindings[1].timeOrigin)
      && ref.pm.text.includes(newEntry.id) && ref.pm.text.includes(`${id} · 任务`)
      && fields.title === currentTasks[i].title && fields.assignee === currentTasks[i].assignee
      && fields.description === currentTasks[i].description && Number(fields.progress) === currentTasks[i].progress
      && target.pm.text.includes('当前项目 · QA-G A') && returned.pm.text.includes(newEntry.id)
      && returned.pm.text.includes('AI 溯源台账')
      && equal(jumps.targets[i].fields, target.fields), s(`${id}-target.json`))
    sameTargets.push({ id, refAt: ref.at, targetAt: target.at, returnAt: returned.at,
      fields: { title: fields.title, assignee: fields.assignee, description: fields.description,
        progress: fields.progress, status: fields.status }, snapshotTask: currentTasks[i] })
  }
  check('same-label-clicks-selected-by-visible-ID-not-title', bytes(collectorPaths[2]).toString()
    .includes("n.innerText.includes(id)&&n.innerText.includes('同名来源核验')"), collectorPaths[2])
  check('early-empty-and-container-timeout-retained-not-same-name-verdict',
    get(`${gateway}/ask-three/plan.json`).pm.text.includes('暂无草稿')
    && get(`${gateway}/cancel-apply-undo/outer-exit.json`).exit === 1
    && get(s('outer-exit.json')).exit === 0, `${gateway}/ask-three/plan.json`)
  const frameSummary = []
  for (const directory of [g('consumer-read/frames'), `${gateway}/same-name/prepare-frames`,
    `${gateway}/same-name/apply-jump-frames`]) {
    const meta = get(`${directory}/frames.json`)
    const mismatches = meta.frames.filter(f => hash(bytes(`${directory}/${f.file}`)) !== f.sha256).map(f => f.file)
    check(`${directory}-original-frame-hashes`, mismatches.length === 0, `${directory}/frames.json`)
    frameSummary.push({ directory, count: meta.frames.length, firstAt: meta.frames[0]?.at,
      lastAt: meta.frames.at(-1)?.at, mismatches })
  }
  const result = { at: new Date().toISOString(), checks, inherited, clarifySource, loadedBindings,
    resolver, consumerStates, consumerTimeline: consumerRuns, sameTimeline: sameRuns,
    titleDeltas, jumpDelta: delta(jumps.beforeJump, jumps.afterJump), newEntry, sameTargets, frameSummary,
    providerEvents, count: checks.length, matches: checks.filter(x => x.observed).length,
    mismatches: checks.filter(x => !x.observed),
    boundaries: [
      'Mechanical checks are not themselves an independent GUI PASS.',
      'Gateway logs only bound this local generation stage; no global-network-zero claim.',
      'Original TERM/port-free outputs were not archived; no historical reconstruction.',
      'Early same-name plan capture may retain an existing same deterministic draft; no independent third-response body/time attribution.',
    ] }
  output(process.argv[3] || 'observations', result)
  console.log(JSON.stringify({ at: result.at, count: result.count, matches: result.matches,
    mismatches: result.mismatches, inheritedCount: inherited.length, newEntryId: newEntry.id,
    jumpDelta: result.jumpDelta, frames: frameSummary }, null, 2))
  if (result.mismatches.length) process.exitCode = 1
} else if (mode === 'finish') {
  const frozen = read(`${prefix}-inputs.json`)
  Object.assign(frozen.files, read(`${prefix}-inputs-supplement.json`).files)
  const files = {}, missing = []
  for (const p of roots) scan(p, files, missing)
  for (const p of Object.keys(frozen.files)) if (!files[p]) scan(p, files, missing)
  const differences = delta(
    Object.fromEntries(Object.entries(frozen.files).map(([p, v]) => [p, v.sha256])),
    Object.fromEntries(Object.entries(files).map(([p, v]) => [p, v.sha256])))
  const result = { at: new Date().toISOString(), freezeAt: frozen.at,
    before: Object.keys(frozen.files).length, after: Object.keys(files).length, differences, missing,
    boundary: 'Only declared input roots; not whole-machine drift, process shutdown or product regression.' }
  output(process.argv[3] || 'drift-final', result)
  console.log(JSON.stringify(result, null, 2))
} else if (mode === 'documents') {
  const directory = absolute(path.dirname(prefix))
  const files = fs.readdirSync(directory).filter(n => n.startsWith(path.basename(prefix)))
  const errors = []
  for (const name of files) {
    const p = path.join(directory, name), text = fs.readFileSync(p, 'utf8')
    if (/\S[^\S\n]+$/m.test(text)) errors.push({ path: p, error: 'trailing whitespace' })
    if (!text.endsWith('\n')) errors.push({ path: p, error: 'missing final newline' })
    if (name.endsWith('.json')) JSON.parse(text)
    if (name.endsWith('.md')) for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const destination = match[1].split('#')[0]
      if (destination && !/^https?:/.test(destination) && !fs.existsSync(path.resolve(directory, destination))) {
        errors.push({ path: p, missingLink: destination })
      }
    }
  }
  console.log(JSON.stringify({ checked: files.length, errors }))
  if (errors.length) process.exitCode = 1
} else {
  throw new Error('Use freeze, supplement, inspect, review, finish [suffix] or documents')
}

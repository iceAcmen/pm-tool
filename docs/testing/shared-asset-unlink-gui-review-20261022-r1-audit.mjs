import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

// 仅审已有原件；输出严格限于本角色前缀，不执行产品或原采证脚本。
const prefix = fileURLToPath(import.meta.url).replace(/-audit\.mjs$/, '')
const repo = path.resolve(path.dirname(prefix), '../..')
const root = path.join(repo, 'reports/all-pending-evidence-20261021/CombinedGuiR1')
const frozen = '/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const fingerprint = file => {
  assert(fs.lstatSync(file).isFile(), file)
  const b = fs.readFileSync(file)
  return { bytes: b.length, sha256: sha(b) }
}
const read = rel => fs.readFileSync(path.join(root, rel))
const json = rel => JSON.parse(read(rel))
const output = (suffix, value) => fs.writeFileSync(prefix + suffix,
  JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const states = [
  '70-shared-before-unlink', '72-shared-other-reference',
  '74-shared-before-second-unlink', '75-shared-t3-unlinked',
  '76-shared-last-unlinked', '77-shared-gc-dryrun',
  '78-shared-after-dryrun', '79-shared-empty-task-reopen',
  '80-shared-gc-empty-applied',
]
const commandCases = [
  ['71-shared-t4-unlink', '/pm material remove t-0004 at-3', 't-0004', 'at-3'],
  ['75-shared-t3-unlink', '/pm material remove t-0003 at-1', 't-0003', 'at-1'],
  ['76-shared-last-unlink', '/pm material remove t-0001 at-3', 't-0001', 'at-3'],
  ['77-shared-gc-dryrun', '/pm material gc'],
  ['80-shared-gc-apply-empty', '/pm material gc --apply'],
]
const viewedFrames = [
  'frames/71-shared-t4-unlink-drain-0-1-1792674278126.jpg',
  'frames/71-shared-t4-unlink-drain-1-1-1792674278355.jpg',
  'frames/75-shared-t3-unlink-drain-0-1-1792674320778.jpg',
  'frames/76-shared-last-unlink-drain-1-2-1792674322298.jpg',
  'frames/77-shared-gc-dryrun-drain-1-3-1792674324119.jpg',
  'frames/80-shared-gc-apply-empty-drain-0-1-1792674522778.jpg',
]
const relevant = k => /^(data\/pmtool\/|files\/|backups\/)/.test(k)
const delta = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).sort()
const roots = name => json(name + '-roots.json')
const record = (name, table, id) => {
  const r = json(`${name}-raw/data/pmtool/${table}/${id}.json`)
  assert.equal(r.version, 2)
  assert(r.record)
  return r.record
}
function integrity() {
  const declared = json('shared-index.json')
  const prior = json('continuation-index.json')
  const j03 = json('j03-index.json')
  assert.equal(declared.count, 1799)
  assert.equal(prior.count, 1537)
  assert.equal(j03.count, 468)
  assert.equal(Object.keys(declared.files).length, declared.count)
  for (const [rel, fp] of Object.entries(declared.files)) {
    assert(!path.isAbsolute(rel) && !rel.split('/').includes('..'), rel)
    assert.deepEqual(fingerprint(path.join(root, rel)), fp, rel)
  }
  for (const old of [prior, j03]) {
    for (const [rel, fp] of Object.entries(old.files)) {
      assert.deepEqual(declared.files[rel], fp, '旧声明继承: ' + rel)
    }
  }
  assert.deepEqual(declared.files['continuation-index.json'],
    fingerprint(path.join(root, 'continuation-index.json')))
  assert.equal(fingerprint(path.join(root, 'continuation-index.json')).sha256,
    '2c1dd6628834258893c4ae8a36e656f71006cda455b29f6ab933746fd602ceb9')
  return {
    shared: fingerprint(path.join(root, 'shared-index.json')),
    sharedCount: declared.count, priorCount: prior.count, j03Count: j03.count,
    prior: fingerprint(path.join(root, 'continuation-index.json')),
    inheritedUnchanged: true,
    added: Object.keys(declared.files).filter(k => !prior.files[k]),
    scope: '仅保护声明原件；未来新增不纳签、不报污染；不重审1537/J03产品结论。',
  }
}
const mode = process.argv[2]
assert(['audit', 'close'].includes(mode), '使用 audit 或 close')
const protectedInputs = integrity()
if (mode === 'close') {
  const owned = ['-audit.mjs', '-audit.json', '.md'].map(suffix => ({
    file: path.basename(prefix + suffix), ...fingerprint(prefix + suffix),
  }))
  const report = fs.readFileSync(prefix + '.md', 'utf8')
  const links = [...report.matchAll(/\]\(([^)]+)\)/g)]
    .map(m => m[1]).filter(x => !/^(https?:|file:)/.test(x))
  for (const link of links) {
    const target = path.resolve(path.dirname(prefix), link.split('#')[0])
    // 报告对本次终核输出的引用，在成功排他创建后检查。
    if (target !== prefix + '-close.json') assert(fs.existsSync(target), link)
  }
  output('-close.json', { at: new Date().toISOString(), protectedInputs, owned,
    linksChecked: links.length, release: 'STOP', productTotalNotSigned: true })
  assert(fs.existsSync(prefix + '-close.json'))
  console.log(JSON.stringify({ mode, declared: 1799, prior: 1537, j03: 468,
    links: links.length, release: 'STOP' }))
} else {
  const binding = json('j03-source-binding.json')
  const host = json('host-r3-start.json')
  assert.equal(host.pid, 71922)
  assert.equal(host.port, 3260)
  assert.equal(host.bundle, frozen)
  const compiled = fingerprint(path.join(frozen, 'lib/client.js'))
  assert.equal(compiled.sha256, host.bundleSha256)
  assert.equal(compiled.sha256, '09219cf81820294161dbdbdced09e73094b000a7d7e1d2e5b8c42f399fabb0db')
  const loaded = fingerprint(path.join(root, 'loaded-complete.js'))
  assert.equal(loaded.sha256, '14414cd388b1c638a4c75863ea1f26972eab88d48f696b3d330d6b48785516f1')
  const uiStates = states.map(name => {
    const ui = json(name + '.json')
    assert.equal(ui.origin, 'http://127.0.0.1:3260')
    assert.equal(ui.timeOrigin, 1792673515397.8)
    assert.equal(ui.dark, true)
    assert.deepEqual(ui.pilot, {})
    assert.deepEqual(ui.viewport, {
      innerWidth: 1458, innerHeight: 734, outerWidth: 1470, outerHeight: 857, dpr: 2,
    })
    const rawPaths = Object.keys(roots(name)).filter(k => k.startsWith('data/pmtool/'))
    for (const rel of rawPaths) {
      assert.deepEqual(fingerprint(path.join(root, name + '-raw', rel)), roots(name)[rel], rel)
      const r = json(name + '-raw/' + rel)
      assert.equal(r.version, 2)
      assert(r.record)
    }
    const taskIds = fs.readdirSync(path.join(root, name + '-raw/data/pmtool/tasks'))
      .map(x => x.replace(/\.json$/, '')).sort()
    const references = taskIds.flatMap(id => (record(name, 'tasks', id).attachments ?? [])
      .filter(a => a.assetId === 'fa-0001').map(a => ({ task: id, attachment: a.id })))
    return { name, at: ui.at, timeOrigin: ui.timeOrigin, rawCount: rawPaths.length,
      references, asset: record(name, 'file_assets', 'fa-0001') }
  })
  const expectedRefs = [
    [{ task: 't-0001', attachment: 'at-3' }, { task: 't-0003', attachment: 'at-1' },
      { task: 't-0004', attachment: 'at-3' }],
    [{ task: 't-0001', attachment: 'at-3' }, { task: 't-0003', attachment: 'at-1' }],
    [{ task: 't-0001', attachment: 'at-3' }, { task: 't-0003', attachment: 'at-1' }],
    [{ task: 't-0001', attachment: 'at-3' }], [], [], [], [], [],
  ]
  uiStates.forEach((s, i) => {
    assert.deepEqual(s.references, expectedRefs[i], s.name)
    assert.deepEqual(s.asset, uiStates[0].asset, s.name + ':asset不变')
  })
  const transitions = [
    [states[0], states[1], 't-0004', 'at-3'],
    [states[1], states[2]],
    [states[2], states[3], 't-0003', 'at-1'],
    [states[3], states[4], 't-0001', 'at-3'],
    [states[4], states[5]], [states[4], states[6]],
    [states[4], states[7]], [states[4], states[8]],
  ].map(([a, b, task, attachment]) => {
    const changed = delta(roots(a), roots(b))
    assert.deepEqual(changed.filter(relevant), task ? [`data/pmtool/tasks/${task}.json`] : [],
      a + '→' + b)
    if (task) {
      const before = record(a, 'tasks', task)
      const after = record(b, 'tasks', task)
      const expected = { ...before, attachments: before.attachments.filter(x => x.id !== attachment),
        updatedAt: after.updatedAt }
      assert.deepEqual(after, expected, task + ':仅移除目标资料与updatedAt')
    }
    assert(changed.filter(k => !relevant(k)).every(k =>
      k === 'data/workspace.json' || k.startsWith('data/session_projcache/sessions/')), changed)
    return { a, b, task, attachment, changed }
  })
  const rpc = commandCases.map(([name, line, task, attachment]) => {
    const c = json(name + '-command.json')
    assert.equal(c.line, line)
    const requests = c.rows.filter(r => r.method === 'Network.requestWillBeSent')
    const responses = c.rows.filter(r => r.method === 'Network.responseReceived')
    assert.equal(requests.length, 1)
    assert.equal(responses.length, 1)
    const request = requests[0], response = responses[0]
    assert.equal(request.body.payload.args.line, line)
    assert.equal(response.requestId, request.requestId)
    assert.equal(response.body.base64Encoded, false)
    const decoded = JSON.parse(response.body.body)
    assert.equal(decoded.rpcId, request.body.rpcId)
    assert.equal(decoded.result.ok, true)
    const result = decoded.result.value.result
    assert.equal(result.kind, 'success')
    if (task) {
      assert(result.text.includes(task) && result.text.includes(attachment))
    } else {
      assert(result.text.includes('0 '))
    }
    return { name, line, requestId: request.requestId, rpcId: decoded.rpcId,
      httpStatus: response.status, ok: decoded.result.ok, ...result,
      exceptionsCaptured: c.rows.filter(r => r.method === 'Runtime.exceptionThrown'),
      frames: c.rows.filter(r => r.method === 'Page.screencastFrame') }
  })
  const asset = uiStates[0].asset
  const download = read('73-shared-still-downloadable.md')
  const originalFile = path.join(repo, 'reports/all-pending-evidence-20261021/MaterialRemainingR1/qa-j03-note.md')
  assert.deepEqual(download, fs.readFileSync(originalFile))
  assert.equal(download.length, 22)
  assert.equal(sha(download), asset.sha256)
  const assetRootKey = 'files/' + asset.relPath
  for (const name of states) {
    assert.deepEqual(roots(name)[assetRootKey], { bytes: 22, sha256: asset.sha256 })
  }
  const visuals = [...states.map(n => n + '.png'), ...viewedFrames].map(rel => ({
    rel, ...fingerprint(path.join(root, rel)), viewedDirectly: true,
  }))
  const executions = json('shared-observation.json').execution.map(e => {
    const m = json('shared-executions/' + e.id + '.json')
    assert.equal(m.status, 'exited')
    assert.equal(m.outputComplete, true)
    assert.equal(m.exitCode, 0)
    assert.equal(m.exitCode, e.exitCode)
    return { id: e.id, exitCode: m.exitCode, outputComplete: m.outputComplete,
      log: fingerprint(path.join(root, 'shared-executions/' + e.id + '.log')) }
  })
  assert.equal(executions.length, 5)
  const observation = json('shared-observation.json')
  assert.deepEqual(observation.references, [])
  assert.deepEqual(observation.asset, asset)
  assert.deepEqual(observation.bytes, { size: download.length, sha256: sha(download) })
  const priorReaders = [
    'docs/testing/ui-backup-nonempty-reentry-gui-review-20261022-r1.md',
    'docs/testing/atf-combined-runtime-gui-review-20261022-r1.md',
    'docs/testing/j03-combined-gui-review-20261022-r1.md',
  ].map(rel => ({ rel, ...fingerprint(path.join(repo, rel)), scope: '只继承/不重签' }))
  output('-audit.json', { at: new Date().toISOString(), protectedInputs,
    runtime: { binding, host, compiled, loaded, actualPageTimeOrigin: 1792673515397.8 },
    priorReaders, uiStates, transitions, rpc,
    download: { original: originalFile, bytes: download.length, sha256: sha(download),
      copy: '73-shared-still-downloadable.md',
      boundary: '原生下载副本与GUI剩余链接有限；未归档下载wire/headers/完整native调用回执。' },
    visuals, executions, rawCount: uiStates.reduce((n, s) => n + s.rawCount, 0),
    gcBoundary: 'task引用0不等metadata引用0；不重跑非空孤儿AUTO、不删metadata、不补apply。',
    release: 'STOP', productTotalNotSigned: true })
  console.log(JSON.stringify({ mode, declared: 1799, prior: 1537, j03: 468,
    states: uiStates.length, raw: uiStates.reduce((n, s) => n + s.rawCount, 0),
    rpc: rpc.length, executions: executions.length, references: uiStates.map(s => s.references.length),
    pngViewed: states.length, jpegViewed: viewedFrames.length, downloadBytes: download.length,
    downloadSha: sha(download), release: 'STOP' }))
}

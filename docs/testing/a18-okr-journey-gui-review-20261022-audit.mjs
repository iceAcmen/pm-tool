// 独立文件审证；不 import 产品、不联网、不执行采集脚本。
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = path.join(repo, 'docs/testing/a18-okr-journey-gui-review-20261022')
const base = path.join(repo, 'reports/all-pending-evidence-20261021/A18')
const root = path.join(base, 'okr-journey')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const read = p => fs.readFileSync(p)
const json = p => JSON.parse(read(p))
const save = (suffix, value) => fs.writeFileSync(prefix + suffix, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const walk = p => fs.readdirSync(p, { withFileTypes: true }).flatMap(e => {
  const n = path.join(p, e.name)
  assert(!e.isSymbolicLink(), `unexpected link: ${n}`)
  return e.isDirectory() ? walk(n) : [n]
}).sort()
const fingerprint = p => {
  const s = fs.statSync(p)
  return { path: p, bytes: s.size, sha256: sha(read(p)), mtimeMs: s.mtimeMs, ino: s.ino }
}
const candidate = json(path.join(base, 'candidate.json'))
const observations = json(path.join(root, 'observations.json'))
const index = json(path.join(root, 'index.json'))
const references = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/governance-growth-independent-auto-20261021-gui-handoff.md',
  'docs/testing/governance-fix-independent-retest-20261021-gui-handoff.md',
  'docs/testing/a18-feedback-context-independent-retest-20261022.md',
  'docs/testing/a18-interface-full-regression-review-20261022.md',
]
const protectedFiles = () => [...new Set([
  ...walk(root), ...walk(path.join(base, 'final')),
  path.join(base, 'candidate.json'), path.join(base, 'product-tracked.patch'),
  path.join(base, 'source-auto-handoff.json'),
  ...references.map(p => path.join(repo, p)),
  ...Object.keys(candidate.sourceHashes).map(p => path.join(candidate.tree, p)),
  ...Object.keys(candidate.artifacts).map(p => path.join(candidate.tree, p)),
])].sort()
const frozen = () => protectedFiles().map(fingerprint)
const checks = []
const check = (name, fn) => { fn(); checks.push({ name, verified: true }) }
const stepDirs = observations.steps.map(s => s.step).sort((a, b) => Number(a.split('-').at(-1)) - Number(b.split('-').at(-1)))
const sj = (s, n) => json(path.join(root, s, n + '.json'))
const raw = (s, table) => Object.fromEntries(fs.readdirSync(path.join(root, s, 'raw', table)).sort()
  .map(n => [n.slice(0, -5), json(path.join(root, s, 'raw', table, n)).record]))
const inbox = s => raw(s, 'settings').pmOkrInbox.value.entries
const diff = (a, b) => Object.fromEntries(Object.keys(a).map(r => [r, {
  added: Object.keys(b[r]).filter(n => !(n in a[r])).sort(),
  removed: Object.keys(a[r]).filter(n => !(n in b[r])).sort(),
  changed: Object.keys(a[r]).filter(n => n in b[r] && a[r][n] !== b[r][n]).sort(),
}]))
const empty = () => ({ added: [], removed: [], changed: [] })
const ids = ['okrsug-mvivdffc-rd040g', 'okrsug-mvivevtw-58ry3u', 'okrsug-mvivfgj1-oef5vd']
const parentId = 'okr-mvi5z847-33y3xk', newId = 'okr-mvivhbaq-sonewn'
const first = 'host-open-1792632915974', third = 'command-1792633036545'
const confirm = 'confirm-1792633127005', ignore = 'ignore-1792633142753'
const repeat = 'command-1792633199812', clear = 'command-1792633237373'
const reenter = 'reenter-1792633159657', final = 'reenter-1792633271342'
const failed = 'nav-1792633053707', corrected = 'nav-1792633111064'

if (process.argv[2] === 'freeze') {
  save('-before.json', { at: new Date().toISOString(), pid: process.pid, scope: '原A18限定文件；不冻结Main/A19、活跃runtime、凭据或其他在途testing', files: frozen() })
  console.log(JSON.stringify({ action: 'freeze', pid: process.pid, files: protectedFiles().length }))
} else if (process.argv[2] === 'supplement') {
  const before = json(prefix + '-before.json'), audit = json(prefix + '-audit.json')
  assert.deepEqual(frozen(), before.files)
  const fixture = json(path.join(base, 'final/seed/exit.json')).file
  const fixtureBefore = fingerprint(fixture)
  check('原F5目标与标准备份原记录完整同值', () => {
    assert.deepEqual(Object.fromEntries(json(fixture).extra.okrs)[parentId], raw(first, 'okrs')[parentId])
  })
  let rawFiles = 0, snapshots = 0
  check('全部成功动作raw四表逐件绑定after-roots SHA', () => {
    for (const s of stepDirs.filter(s => sj(s, 'exit').exit === 0)) {
      const roots = sj(s, 'after-roots')
      for (const table of ['okrs', 'settings', 'habits', 'projects']) {
        for (const p of walk(path.join(root, s, 'raw', table))) {
          assert.equal(sha(read(p)), roots.data[`/pmtool/${table}/${path.basename(p)}`])
          rawFiles++
        }
      }
    }
  })
  check('六snapshot实际OKR和inbox与对应raw完全相等', () => {
    for (const s of [confirm, ignore, failed, 'nav-1792633257090']) {
      const events = sj(s, 'commands').map(x => x.event)
      for (const run of events.filter(e => e.type === 'command/run' && e.data.args === ' web snapshot')) {
        const done = events.find(e => e.type === 'command/done' && e.data.commandId === run.data.commandId)
        const snapshot = JSON.parse(done.data.text)
        const rawStep = s === failed ? third : s
        assert.deepEqual(snapshot.okrs, Object.values(raw(rawStep, 'okrs')))
        assert.deepEqual(snapshot.okrInbox, inbox(rawStep))
        snapshots++
      }
    }
    assert.equal(snapshots, 6)
  })
  check('补核前后限定保护、fixture及五额外测试指纹不变', () => {
    assert.deepEqual(frozen(), before.files)
    assert.deepEqual(fingerprint(fixture), fixtureBefore)
    assert.deepEqual(audit.launcherAdditionalFiles.map(f => fingerprint(f.path)), audit.launcherAdditionalFiles)
  })
  save('-supplement.json', { at: new Date().toISOString(), pid: process.pid, checks, rawFiles, snapshots,
    fixture: fixtureBefore, protectedFiles: before.files.length, drift: [], boundary: '补充文件一致性，不重跑采集、不扩用例' })
  console.log(JSON.stringify({ action: 'supplement', pid: process.pid, checks: checks.length, rawFiles, snapshots, drift: 0 }))
} else if (process.argv[2] === 'seal') {
  const before = json(prefix + '-before.json')
  assert.deepEqual(frozen(), before.files)
  const supplement = json(prefix + '-supplement.json')
  assert.deepEqual(fingerprint(supplement.fixture.path), supplement.fixture)
  const extras = json(prefix + '-audit.json').launcherAdditionalFiles
  assert.deepEqual(extras.map(f => fingerprint(f.path)), extras)
  save('-seal.json', { at: new Date().toISOString(), pid: process.pid, protectedFiles: before.files.length,
    drift: [], owned: ['-audit.mjs', '-audit.json', '-supplement.json', '-before.json', '.md'].map(s => fingerprint(prefix + s)),
    released: true, childrenStarted: 0, guiConnections: 0, serviceActions: 0,
    boundary: '独立有限P2003审证结束；无build/GUI/服务/依赖/Main写锁，禁止扩大为整门或commit' })
  console.log(JSON.stringify({ action: 'seal', pid: process.pid, drift: 0, released: true }))
} else if (process.argv[2] === 'audit') {
  const before = json(prefix + '-before.json')
  let launcherAdditionalFiles = []
  check('审计前限定保护未漂移', () => assert.deepEqual(frozen(), before.files))
  check('原797索引完整名单、bytes与SHA', () => {
    assert.equal(index.files.length, 797)
    assert.deepEqual(walk(root).filter(p => p !== path.join(root, 'index.json')).map(p => path.relative(root, p)), index.files.map(x => x.path).sort())
    for (const row of index.files) { const p = path.join(root, row.path); assert.equal(read(p).length, row.bytes); assert.equal(sha(read(p)), row.sha256) }
  })
  check('原520输入453产物与patch实际字节', () => {
    assert.equal(Object.keys(candidate.sourceHashes).length, 520)
    assert.equal(Object.keys(candidate.artifacts).length, 453)
    for (const hashes of [candidate.sourceHashes, candidate.artifacts]) {
      for (const [p, h] of Object.entries(hashes)) assert.equal(sha(read(path.join(candidate.tree, p))), h, p)
    }
    assert.equal(sha(read(path.join(base, 'product-tracked.patch'))), candidate.trackedPatchSha)
    const packageRoot = path.join(candidate.tree, 'packages/dsh-pm-tool')
    const launcherRoot = path.join(candidate.tree, 'launcher')
    const discovered = [...walk(path.join(packageRoot, 'src')), ...walk(path.join(packageRoot, 'scripts')),
      ...['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts'].map(p => path.join(packageRoot, p)),
      ...['bin', 'src', 'scripts', 'test'].flatMap(p => walk(path.join(launcherRoot, p))),
      path.join(launcherRoot, 'package.json')]
      .map(p => path.relative(candidate.tree, p)).sort()
    const extras = discovered.filter(p => !(p in candidate.sourceHashes))
    assert.deepEqual(extras, ['fc-a2-additional', 'fc-a2-followup', 'fc-a3-probes', 'fc-a4-probes', 'fc-independent-probes']
      .map(n => `launcher/test/${n}.test.mjs`))
    launcherAdditionalFiles = extras.map(p => fingerprint(path.join(candidate.tree, p)))
    assert.deepEqual(discovered.filter(p => !extras.includes(p)), Object.keys(candidate.sourceHashes).sort())
    assert.deepEqual(walk(path.join(packageRoot, 'lib')).map(p => path.relative(candidate.tree, p)), Object.keys(candidate.artifacts).sort())
  })
  const loaded = json(path.join(base, 'final/loaded/result.json'))
  const client = read(path.join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const response = read(path.join(base, 'final/loaded/combo-1.txt'))
  check('uncached完整client段唯一匹配与BA817上下文', () => {
    assert.equal(loaded.targetId, 'BA817F66FCE81BD58357C4B50BFFDF2C')
    assert.equal(loaded.context, 'default')
    assert.equal(loaded.state.origin, observations.origin)
    assert.equal(loaded.state.timeOrigin, 1792629512672.7)
    assert.equal(loaded.events.length, 1)
    const e = loaded.events[0], m = e.matches[0]
    assert.equal(e.frameId, loaded.targetId); assert.equal(e.status, 200); assert.equal(e.fromDiskCache, false)
    assert.equal(response.length, e.bytes); assert.equal(sha(response), e.responseSha)
    assert.equal(m.sourceSha, sha(client)); assert.equal(m.segmentSha, sha(segment)); assert.equal(segment.length, m.segmentBytes)
    assert.equal(response.indexOf(segment), m.first); assert.equal(response.indexOf(segment, m.first + 1), -1)
    assert.equal(m.uniqueComplete, true); assert.equal(m.second, -1)
  })
  check('原SOURCE签字指纹与有限继承', () => {
    const h = json(path.join(base, 'source-auto-handoff.json'))
    assert.equal(sha(read(path.join(repo, h.independentReport))), h.independentReportSHA)
    assert.equal(h.limitedSourceAuto, 'PASS')
    assert.equal(sha(read(observations.candidate)), observations.candidateSHA)
    assert.equal(sha(read(observations.loaded)), observations.loadedSHA)
  })
  const steps = []
  let frameCount = 0
  check('14动作、原exit与全部真实帧索引', () => {
    assert.equal(stepDirs.length, 14)
    for (const s of stepDirs) {
      const declared = observations.steps.find(x => x.step === s)
      const exit = sj(s, 'exit'), events = sj(s, 'commands'), requests = sj(s, 'requests')
      assert.deepEqual(exit, declared.exit); assert.equal(events.length, declared.events); assert.equal(requests.length, declared.requests)
      const frames = sj(s, 'frames/frames')
      assert.equal(frames.source, 'CDP Page.screencastFrame; actual browser compositor')
      for (const f of frames.frames) assert.equal(sha(read(path.join(root, s, 'frames', f.file))), f.sha256)
      frameCount += frames.frames.length
      for (const n of ['before', ...(exit.exit === 0 ? ['actual', 'view'] : [])]) {
        const state = sj(s, n); assert.equal(state.origin, observations.origin); assert.equal(state.timeOrigin, observations.timeOrigin)
      }
      const actualDiff = exit.exit === 0 ? diff(sj(s, 'before-roots'), sj(s, 'after-roots')) : null
      if (actualDiff) assert.deepEqual(actualDiff, declared.rootDiff)
      steps.push({ step: s, exit, frames: frames.frames.length, rootDiff: actualDiff,
        requests: requests.map(x => ({ at: x.at, line: x.body.payload.args.line, agentId: x.body.payload.args.agentId })),
        commands: events.map(x => x.event) })
    }
    assert.equal(steps.filter(s => s.exit.exit === 1).length, 1)
    assert.equal(sj(failed, 'exit').exit, 1)
  })
  check('真实POST/run/done一一对应且snapshot不算重复confirm', () => {
    for (const s of steps) {
      const runs = s.commands.filter(x => x.type === 'command/run'), dones = s.commands.filter(x => x.type === 'command/done')
      assert.equal(s.requests.length, runs.length); assert.equal(runs.length, dones.length)
      s.requests.forEach((r, i) => {
        assert.equal(r.agentId, 'session-04548dcf-b6ba-4259-a7ad-e7957eb0593f')
        assert.equal(r.line, '/' + runs[i].data.name + runs[i].data.args)
        assert.equal(runs[i].data.source.kind, 'user')
        assert.equal(dones[i].data.commandId, runs[i].data.commandId)
      })
    }
    for (const s of [confirm, ignore]) {
      const requests = steps.find(x => x.step === s).requests
      assert.equal(requests.length, 3)
      assert.equal(requests.filter(r => r.line === '/pm web snapshot').length, 2)
      assert.equal(requests.filter(r => /\/pm okr (confirm|ignore) /.test(r.line)).length, 1)
    }
  })
  check('三建议ID理由状态、pending仅settings写', () => {
    const entries = inbox(third)
    assert.deepEqual(entries.map(e => e.id), ids)
    assert.deepEqual(entries.map(e => e.status), ['pending', 'pending', 'pending'])
    assert(entries.every(e => e.projectId === 'p-0001' && e.rationale))
    assert.equal(entries[0].primaryOkrId, parentId)
    for (const s of ['command-1792632937978', 'command-1792633009125', third]) {
      assert.deepEqual(raw(s, 'okrs'), raw(first, 'okrs'))
      const d = steps.find(x => x.step === s).rootDiff.data
      assert.deepEqual([...d.added, ...d.removed, ...d.changed], ['/pmtool/settings/pmOkrInbox.json'])
    }
  })
  check('真UIconfirm单次建draftKR主归属原F5并保其他建议', () => {
    const previous = inbox(third), entries = inbox(confirm), records = raw(confirm, 'okrs'), initial = raw(first, 'okrs')
    assert.deepEqual(Object.keys(records).sort(), [...Object.keys(initial), newId].sort())
    for (const [id, value] of Object.entries(initial)) assert.deepEqual(records[id], value)
    assert.equal(initial[parentId].title, 'F5目标'); assert.equal(initial[parentId].kind, 'objective')
    const r = records[newId]
    assert.equal(r.kind, 'key-result'); assert.equal(r.projectId, 'p-0001'); assert.equal(r.primaryOkrId, parentId)
    assert.equal(r.status, 'draft'); assert.equal(r.title, previous[0].title)
    assert.deepEqual(r.relatedOkrIds, [])
    assert.deepEqual(entries[0], { ...previous[0], status: 'confirmed', confirmedOkrId: newId, processedAt: r.createdAt })
    assert.deepEqual(entries.slice(1), previous.slice(1))
    assert.equal(sj(confirm, 'view').suggestions[0].state, 'confirmed')
    assert(sj(confirm, 'view').okr.includes('主归属：F5目标'))
  })
  check('真UIignore零建档、原理由与confirmed指针保留', () => {
    const previous = inbox(confirm), entries = inbox(ignore)
    assert.deepEqual(raw(ignore, 'okrs'), raw(confirm, 'okrs'))
    assert.deepEqual(entries[0], previous[0]); assert.deepEqual(entries[2], previous[2])
    assert.deepEqual(entries[1], { ...previous[1], status: 'ignored', ignoredAt: entries[1].ignoredAt })
    assert(entries[1].ignoredAt)
    assert.deepEqual(sj(ignore, 'view').suggestions.map(e => e.state), ['confirmed', 'ignored', 'pending'])
  })
  check('第一次重进完整历史与业务记录保留', () => {
    for (const t of ['okrs', 'settings', 'habits', 'projects']) assert.deepEqual(raw(reenter, t), raw(ignore, t))
    assert.deepEqual(sj(reenter, 'view').suggestions, sj(ignore, 'view').suggestions)
  })
  check('重复confirm真实error、所有四根零写', () => {
    const done = sj(repeat, 'commands').find(x => x.event.type === 'command/done').event.data
    assert.equal(done.kind, 'error'); assert.equal(done.text, '该建议已确认过')
    for (const d of Object.values(steps.find(x => x.step === repeat).rootDiff)) assert.deepEqual(d, empty())
    for (const t of ['okrs', 'settings', 'habits', 'projects']) assert.deepEqual(raw(repeat, t), raw(ignore, t))
    assert.deepEqual(sj(repeat, 'view').commandCards, [])
  })
  check('clear仅本项目processed保第三pending、记录和历史原件', () => {
    const previous = inbox(repeat)
    assert.deepEqual(inbox(clear), previous.filter(e => !(e.projectId === 'p-0001' && e.status !== 'pending')))
    assert.equal(previous.length - inbox(clear).length, 2)
    assert.deepEqual(inbox(clear), [previous[2]])
    assert.deepEqual(raw(clear, 'okrs'), raw(confirm, 'okrs'))
    const done = sj(clear, 'commands').find(x => x.event.type === 'command/done').event.data
    assert.equal(done.kind, 'success'); assert(done.text.includes('2 条')); assert(done.text.includes('待确认建议保留'))
  })
  check('最终nav/reenter仍draftKR和pending，无自动定稿', () => {
    for (const s of ['nav-1792633257090', final]) {
      for (const t of ['okrs', 'settings', 'habits', 'projects']) assert.deepEqual(raw(s, t), raw(clear, t))
      assert.equal(raw(s, 'okrs')[newId].status, 'draft')
      assert.deepEqual(sj(s, 'view').suggestions.map(x => ({ id: x.id, state: x.state })), [{ id: ids[2], state: 'pending' }])
      assert(sj(s, 'view').okr.includes('主归属：F5目标'))
    }
  })
  const bridges = []
  check('全部本步及相邻采样无额外业务/files/backups/exports写', () => {
    const allowed = new Set(['/pmtool/settings/pmOkrInbox.json', `/pmtool/okrs/${newId}.json`])
    for (const s of steps.filter(s => s.rootDiff)) {
      for (const r of ['files', 'backups', 'exports']) assert.deepEqual(s.rootDiff[r], empty())
      for (const n of Object.values(s.rootDiff.data).flat()) assert(allowed.has(n) || n.startsWith('/session_projcache/'), n)
    }
    for (let i = 1; i < steps.length; i++) {
      const prior = steps[i - 1], next = steps[i]
      const d = diff(sj(prior.step, prior.exit.exit === 0 ? 'after-roots' : 'before-roots'), sj(next.step, 'before-roots'))
      for (const r of ['files', 'backups', 'exports']) assert.deepEqual(d[r], empty())
      for (const n of Object.values(d.data).flat()) assert(n.startsWith('/session_projcache/'), n)
      bridges.push({ from: prior.step, to: next.step, rootDiff: d, failedAfterNotCaptured: prior.exit.exit !== 0 })
    }
  })
  check('原导航失败保留，纠正非业务步骤非伪造0', () => {
    assert.equal(sj(failed, 'exit').error, 'Error: visible target missing: 目标（OKR）')
    assert.equal(fs.existsSync(path.join(root, failed, 'after-roots.json')), false)
    assert.equal(sj(corrected, 'exit').exit, 0)
    assert(sj(corrected, 'before').buttons.some(b => b.text === '目标（OKR）\n3'))
    assert(read(path.join(root, 'execution/pmtool-a18-okr-journey-20261022.mjs')).toString().includes("innerText.trim().split('\\n')[0]"))
    assert.deepEqual(steps.find(s => s.step === failed).requests.map(r => r.line), ['/pm web snapshot'])
  })
  check('审计后限定保护未漂移', () => assert.deepEqual(frozen(), before.files))
  check('未纳520的五个Launcher测试仅本次审计期间指纹稳定', () => {
    assert.deepEqual(launcherAdditionalFiles.map(f => fingerprint(f.path)), launcherAdditionalFiles)
  })
  const visual = [
    `${corrected}/actual.png`, `${confirm}/actual.png`, `${ignore}/actual.png`, `${final}/actual.png`,
    `${confirm}/frames/000000.jpg`, `${confirm}/frames/000020.jpg`, `${ignore}/frames/000025.jpg`,
    `${repeat}/before-submit.png`, `${repeat}/actual.png`, `${final}/frames/000004.jpg`,
    `${failed}/frames/000017.jpg`,
  ].map(p => fingerprint(path.join(root, p)))
  save('-audit.json', { at: new Date().toISOString(), pid: process.pid, environment: { platform: process.platform, arch: process.arch, node: process.version, cwd: process.cwd() },
    checks, indexedFiles: index.files.length, protectedFiles: before.files.length, frameCount,
    identities: { candidate: fingerprint(path.join(base, 'candidate.json')), index: fingerprint(path.join(root, 'index.json')),
      observations: fingerprint(path.join(root, 'observations.json')), baseline: candidate.baseline, hostGitHead: candidate.hostGitHead,
      tree: candidate.tree, sourceCount: 520, artifactCount: 453, clientSha: sha(client), loaded: fingerprint(path.join(base, 'final/loaded/result.json')),
      targetId: loaded.targetId, origin: observations.origin, timeOrigin: observations.timeOrigin, responseSha: sha(response), segmentSha: sha(segment) },
    steps, bridges, visual, launcherAdditionalFiles, limitedVerdict: 'PASS：原RA-P2003建议处理有限切片；独立PNG与选定真实帧目视另见报告',
    excluded: ['跨项目建议/clear他项目动态反例', 'P2004/selfcross', 'error visual空hero', '全矩阵/整目标/全门/A19/commit'],
    sourceAutoInheritance: '原签字仅原范围引用，520/453字节相同；不重跑、不替GUI或扩大旧PASS',
    actions: { productImports: 0, childrenStarted: 0, guiConnections: 0, buildInstall: 0, serviceActions: 0, credentialReads: 0, commit: false } })
  console.log(JSON.stringify({ action: 'audit', pid: process.pid, checks: checks.length, indexedFiles: index.files.length, frameCount, protectedFiles: before.files.length, drift: 0 }))
} else {
  throw new Error('only freeze / audit / supplement / seal')
}

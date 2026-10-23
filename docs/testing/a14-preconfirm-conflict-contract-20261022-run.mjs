import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a14-preconfirm-conflict-contract-20261022'
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const self = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
assert(!existsSync(self), 'use fresh rN; never overwrite prior evidence')
const a14 = '/private/tmp/pmtool-a14-closure-20261022'
const root = join(repo, 'reports/all-pending-evidence-20261021/A14')
const pkgRelative = 'packages/dsh-pm-tool'
const frozen = join(self, 'frozen')
const pkg = join(frozen, pkgRelative)
const deps = join(a14, pkgRelative, 'node_modules')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const read = path => JSON.parse(readFileSync(path, 'utf8'))
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(path) {
    const st = lstatSync(path)
    if (st.isSymbolicLink()) result[relative(root, path) || '.'] = { link: realpathSync(path), mtimeMs: st.mtimeMs }
    else if (st.isDirectory()) for (const n of readdirSync(path).sort()) walk(join(path, n))
    else result[relative(root, path) || '.'] = { sha256: sha(readFileSync(path)), bytes: st.size, mtimeMs: st.mtimeMs }
  }
  walk(root)
  return result
}
const changes = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const save = (name, data) => {
  const path = resolve(self, name)
  assert(path.startsWith(`${self}/`))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' })
}
const git = args => {
  const r = spawnSync('/usr/bin/git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  assert.equal(r.status, 0, r.stderr)
  return r.stdout.trim()
}
const manifest = read(join(root, 'candidate.json'))
assert.equal(manifest.tree, a14)
const declared = { ...manifest.sourceHashes, ...manifest.artifacts }
const verifyDeclared = () => Object.entries(declared).filter(([p, hash]) =>
  !existsSync(join(a14, p)) || sha(readFileSync(join(a14, p))) !== hash).map(([p]) => p)
assert.deepEqual(verifyDeclared(), [], 'A14 declared bytes changed')
assert.equal(sha(readFileSync(join(root, 'product-tracked.patch'))), manifest.trackedPatchSha)
const depNames = ['react', 'react-test-renderer', 'vitest', 'vite', 'lucide-react', 'zod']
const depRoots = Object.fromEntries(depNames.map(n => {
  const path = n === 'vite' ? join(dirname(realpathSync(join(deps, 'vitest'))), 'vite') : join(deps, n)
  assert(existsSync(join(path, 'package.json')), `missing dependency ${n}; no installation allowed`)
  return [n, realpathSync(path)]
}))
const protectedRoots = [
  join(repo, pkgRelative, 'src'), join(repo, pkgRelative, 'lib'),
  ...['a11-closure-20261021', 'a12-closure-20261021', 'a13-closure-20261022', 'a14-closure-20261022']
    .map(n => join('/private/tmp', `pmtool-${n}`, pkgRelative, 'lib')),
  join(a14, pkgRelative, 'src'),
  ...['loaded', 'conflict', 'stepwise', 'gateway'].map(n => join(root, 'final', n)),
  ...Object.values(depRoots),
  ...[deps, join(repo, pkgRelative, 'node_modules')].flatMap(p =>
    ['.vite', '.cache', '.vite-temp'].map(n => join(p, n))),
]
const before = Object.fromEntries(protectedRoots.map(p => [p, inventory(p)]))
const contractInputs = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/decision-log.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/copilot-multistep-acceptance.md', 'docs/product/08-copilot-multistep-design.md',
  ...['plan.md', 'cases.test.tsx', 'run.mjs'].map(n => `docs/testing/${prefix}-${n}`),
  'reports/all-pending-evidence-20261021/A14/candidate.json',
  'reports/all-pending-evidence-20261021/A14/product-tracked.patch',
]
const inputBefore = Object.fromEntries(contractInputs.map(p => [p, inventory(join(repo, p))]))
mkdirSync(self, { recursive: true, mode: 0o700 })
cpSync(join(a14, pkgRelative, 'src'), join(pkg, 'src'), { recursive: true, preserveTimestamps: true })
for (const n of ['package.json', 'tsconfig.json']) cpSync(join(a14, pkgRelative, n), join(pkg, n))
const frozenTests = join(frozen, 'docs/testing')
mkdirSync(frozenTests, { recursive: true })
for (const n of ['plan.md', 'cases.test.tsx']) cpSync(join(repo, 'docs/testing', `${prefix}-${n}`), join(frozenTests, `${prefix}-${n}`))
symlinkSync(deps, join(pkg, 'node_modules'), 'dir')
symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
const frozenBefore = inventory(join(pkg, 'src'))
const originalSource = before[join(a14, pkgRelative, 'src')]
assert.deepEqual(Object.fromEntries(Object.entries(frozenBefore).map(([p, v]) => [p, v.sha256])),
  Object.fromEntries(Object.entries(originalSource).map(([p, v]) => [p, v.sha256])))

const conflict = join(root, 'final/conflict')
const events = read(join(conflict, 'command-events.json')).map(x => x.event)
const done = (seq, e = events) => {
  const event = e.find(x => x.seq === seq && x.type === 'command/done')
  assert(event, `missing done ${seq}`)
  return event.data.text
}
const rawTask = (name, n) => read(join(conflict, `${name}-${n}.json`)).record
const external = JSON.parse(done(80))
const initial = structuredClone(external)
const initialTaskById = new Map(['t1', 't2'].map(n => {
  const task = rawTask('initial', n)
  return [task.id, task]
}))
initial.tasks = initial.tasks.map(t => initialTaskById.get(t.id) ?? t)
assert.equal(rawTask('draft', 't1').updatedAt, rawTask('initial', 't1').updatedAt)
assert.equal(rawTask('draft', 't1').updatedAt, '2026-10-21T22:29:06.929Z')
assert.equal(rawTask('external-saved', 't1').updatedAt, '2026-10-21T22:29:16.692Z')
const sentLine = events.find(x => x.seq === 81).data.args
const sentBase = JSON.parse(sentLine.split(' --base ')[1])
assert.equal(sentBase['t-0001'], rawTask('external-saved', 't1').updatedAt)
assert.notEqual(sentBase['t-0001'], rawTask('draft', 't1').updatedAt)
assert.equal(rawTask('external-saved', 't1').assignee, '确认前外部改派保留')
assert.equal(rawTask('result-visible', 't1').assignee, '新句柄撤销甲')
assert.match(done(82), /^已应用 3 步/)
assert.deepEqual(JSON.parse(done(86)).tasks.find(t => t.id === 't-0001'), rawTask('result-visible', 't1'))
const ledger = read(join(conflict, 'result-visible-ledger.json')).record.value.entries
const newEntry = ledger.find(e => e.createdAt === '2026-10-21T22:29:17.088Z')
assert(newEntry)
assert.equal(newEntry.undo.postimages.length, 3)
assert.equal(newEntry.undo.postimages[0].postimage.fields.assignee, '确认前外部改派保留')
assert.equal(newEntry.undo.postimages[1].postimage.fields.assignee, '新句柄撤销甲')
let checkedFrames = 0
for (const folder of ['conflict', 'stepwise']) {
  const frames = read(join(root, 'final', folder, 'frames/frames.json'))
  for (const frame of frames.frames) {
    assert.equal(sha(readFileSync(join(root, 'final', folder, 'frames', frame.file))), frame.sha256)
    checkedFrames++
  }
}
const loaded = read(join(root, 'final/loaded/result.json'))
for (const e of loaded.events) {
  const combo = readFileSync(join(root, 'final/loaded', e.file))
  assert.equal(sha(combo), e.responseSha)
  assert.equal(e.fromDiskCache, false)
  for (const m of e.matches) {
    const bytes = readFileSync(join(a14, pkgRelative, 'lib', m.name))
    assert.equal(sha(bytes), m.sourceSha)
    const normalized = bytes.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
      .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
    const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
    assert.equal(sha(segment), m.segmentSha)
    assert.equal(combo.indexOf(segment), m.first)
    assert.equal(combo.indexOf(segment, m.first + 1), -1)
  }
}
const stepEvents = read(join(root, 'final/stepwise/command-events.json')).map(x => x.event)
const stepSnapshots = Object.fromEntries([['s1', 58], ['s2', 64], ['s3', 70]].map(([s, seq]) => [s, JSON.parse(done(seq, stepEvents))]))
const requests = readFileSync(join(root, 'final/gateway/requests.ndjson'), 'utf8').trim().split('\n').map(JSON.parse)
const request = requests.find(x => JSON.stringify(x.body).includes('确认前外部改动冲突三步'))
assert(request)
assert.equal(request.behavior, 'success')
save('original-audit.json', { originalExit: read(join(conflict, 'exit.json')), loaded, checkedFrames,
  request: { at: request.at, path: request.path, behavior: request.behavior },
  sourceCandidate: { baseline: manifest.baseline, trackedPatchSha: manifest.trackedPatchSha,
    sources: Object.keys(manifest.sourceHashes).length, artifacts: Object.keys(manifest.artifacts).length },
  draftBase: rawTask('draft', 't1').updatedAt, sentBase, command: sentLine, result: done(82),
  externalT1: rawTask('external-saved', 't1'), resultT1: rawTask('result-visible', 't1'),
  newLedger: newEntry, boundary: 'read-only original evidence review, not new GUI execution' })
save('replay-input.json', { initial, external, stepSnapshots, askText: done(76), updateText: done(78), applyText: done(82) })
save('candidate.json', {
  at: new Date().toISOString(), baseline: manifest.baseline, currentHead: git(['rev-parse', 'HEAD']),
  sourceTree: a14, sourceManifest: originalSource, sourceManifestSha: sha(JSON.stringify(originalSource)),
  manifestSha: sha(readFileSync(join(root, 'candidate.json'))), trackedPatchSha: manifest.trackedPatchSha,
  environment: { os: os.release(), arch: os.arch(), node: process.version, exec: process.execPath },
  dependencies: Object.fromEntries(depNames.map(n => [n, { root: depRoots[n], version: read(join(depRoots[n], 'package.json')).version }])),
  writesOnly: self, frozenProductUnmodified: true,
})
save('main-tracked.patch', git(['diff', '--binary', 'HEAD', '--', pkgRelative]))
save('main-new-sources.json', git(['ls-files', '--others', '--exclude-standard', '--', `${pkgRelative}/src`])
  .split('\n').filter(Boolean).map(p => ({ path: p, sha256: sha(readFileSync(join(repo, p))) })))
for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(self, n))
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`, HOME: join(self, 'home'),
  TMPDIR: join(self, 'tmp'), XDG_CACHE_HOME: join(self, 'cache'), DSH_HOME: join(self, 'runtime'),
  CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1',
  PC_INPUT: join(self, 'replay-input.json'), PC_OBSERVATIONS: join(self, 'observations.jsonl'),
}
save('vitest.config.mjs', `export default ${JSON.stringify({
  root: frozen, cacheDir: join(self, 'cache/vite'), test: { environment: 'node', cache: false,
    include: [`docs/testing/${prefix}-cases.test.tsx`], pool: 'forks', minWorkers: 1, maxWorkers: 1, testTimeout: 15000 },
}, null, 2)}\n`)
const commands = []
function test(id) {
  const argv = [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', '--config', join(self, 'vitest.config.mjs'),
    '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(self, `${id}.result.json`),
    '--testNamePattern', `^${id} `]
  const start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd: frozen, env, encoding: 'utf8', timeout: 90000, maxBuffer: 32 * 1024 * 1024 })
  save(`${id}.stdout.log`, r.stdout ?? '')
  save(`${id}.stderr.log`, r.stderr ?? '')
  const c = { id, argv, cwd: frozen, env, start, end: new Date().toISOString(), originalExit: r.status,
    signal: r.signal, error: r.error?.message ?? null }
  commands.push(c)
  save(`${id}.command.json`, c)
  console.log(JSON.stringify({ id, originalExit: r.status, signal: r.signal }))
}
test('PC-C01')
test('PC-C02')
if (commands.every(c => c.originalExit === 0)) {
  test('PC-A01')
  test('PC-A02')
}
const after = Object.fromEntries(protectedRoots.map(p => [p, inventory(p)]))
const drift = Object.fromEntries(protectedRoots.map(p => [p, changes(before[p], after[p])]))
const contractDrift = Object.fromEntries(contractInputs.map(p => [p, changes(inputBefore[p], inventory(join(repo, p)))]))
save('protected-manifests.json', { before, after })
save('commands.json', commands)
const audit = { drift, contractDrift, declaredDrift: verifyDeclared(),
  frozenDrift: changes(frozenBefore, inventory(join(pkg, 'src'))),
  boundary: 'only listed roots; no global zero-pollution claim' }
save('audit.json', audit)
const mainSrc = join(repo, pkgRelative, 'src')
const immutableDrift = Object.entries(drift).filter(([p, changed]) => p !== mainSrc && changed.length)
const expected = commands.length === 4 && commands.every(c => c.originalExit === (c.id.startsWith('PC-C') ? 0 : 1))
save('summary.json', { commands, audit, controlsGreenRedsReproduced: expected,
  finishedAt: new Date().toISOString(), guiExecuted: false, productFixed: false, overallRAAI04Pass: false })
console.log(JSON.stringify({ expected, immutableDrift, declaredDrift: audit.declaredDrift,
  frozenDrift: audit.frozenDrift, mainConcurrentDrift: drift[mainSrc] }))
process.exitCode = expected && immutableDrift.length === 0 && audit.declaredDrift.length === 0 &&
  audit.frozenDrift.length === 0 && Object.values(contractDrift).every(v => v.length === 0) ? 0 : 1

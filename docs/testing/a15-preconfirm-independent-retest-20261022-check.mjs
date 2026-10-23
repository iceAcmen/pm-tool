import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a15-preconfirm-independent-retest-20261022'
const original = 'a14-preconfirm-conflict-contract-20261022'
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const self = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
const out = join(self, process.argv[3] ?? 'delivery-r1')
assert.match(relative(self, out), /^delivery-r[1-9]\d*$/)
assert(!existsSync(out), 'fresh check directory only')
mkdirSync(out, { recursive: true, mode: 0o700 })
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const save = (n, x) => writeFileSync(join(out, n), typeof x === 'string' ? x : `${JSON.stringify(x, null, 2)}\n`, { flag: 'wx' })
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(self, 'home'), TMPDIR: join(self, 'tmp'), XDG_CACHE_HOME: join(self, 'cache'),
  DSH_HOME: join(self, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1' }
const checkCommands = []
function run(id, executable, args, expectedExit = 0) {
  const start = new Date().toISOString()
  const r = spawnSync(executable, args, { cwd: repo, env, encoding: 'utf8', timeout: 60000, maxBuffer: 16 * 1024 * 1024 })
  save(`${id}.stdout.log`, r.stdout ?? '')
  save(`${id}.stderr.log`, r.stderr ?? '')
  checkCommands.push({ id, argv: [executable, ...args], env, cwd: repo, start,
    end: new Date().toISOString(), originalExit: r.status, signal: r.signal })
  assert.equal(r.status, expectedExit, r.stderr)
  return r
}
function inventory(root) {
  const out = {}
  if (!existsSync(root)) return out
  function walk(p) {
    const s = lstatSync(p), k = relative(root, p) || '.'
    if (s.isSymbolicLink()) out[k] = { link: realpathSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else out[k] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(root)
  return out
}
const delta = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const content = x => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
const candidate = read(join(self, 'candidate.json'))
const commands = read(join(self, 'commands.json'))
assert.equal(commands.length, 11)
const actual = commands.map(c => {
  const expectedExit = c.id === 'old-PC-A01' || c.id === 'old-PC-A02' ? 1 : 0
  assert.equal(c.originalExit, expectedExit, c.id)
  assert.equal(c.signal, null)
  assert.equal(c.error, null)
  assert(c.cwd.startsWith(self))
  for (const n of ['HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'DSH_HOME']) assert(c.env[n].startsWith(self))
  assert(Object.keys(c.env).every(k => ['PATH', 'HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'DSH_HOME', 'CI', 'LANG',
    'TZ', 'NODE_DISABLE_COMPILE_CACHE', 'PC_INPUT', 'PC_OBSERVATIONS'].includes(k)))
  if (c.id === 'new-noemit') return { id: c.id, originalExit: c.originalExit, reporter: null }
  assert(c.argv.includes('--no-cache'))
  const reporter = read(join(self, `${c.id}.result.json`))
  const assertions = reporter.testResults.flatMap(r => r.assertionResults)
  const executed = assertions.filter(a => ['passed', 'failed'].includes(a.status))
  const n = c.id === 'new-independent' ? 23 : c.id === 'new-regression' ? 87 : 1
  assert.equal(executed.length, n, c.id)
  assert.equal(reporter.numFailedTests, expectedExit === 1 ? 1 : 0)
  assert.equal(reporter.numPassedTests, expectedExit === 1 ? 0 : n)
  if (n === 1) assert.equal(assertions.filter(a => a.status === 'skipped').length, 3)
  return { id: c.id, originalExit: c.originalExit, executed: n, passed: reporter.numPassedTests,
    failed: reporter.numFailedTests, skipped: assertions.filter(a => a.status === 'skipped').length,
    reporterSha256: sha(readFileSync(join(self, `${c.id}.result.json`))),
    failures: executed.filter(a => a.status === 'failed').map(a => ({ name: a.fullName, messages: a.failureMessages })) }
})
const protectedData = read(join(self, 'protected-manifests.json'))
const extended = Object.fromEntries(Object.entries(protectedData.after).map(([p, x]) => [p, delta(x, inventory(p))]))
const frozenInputs = read(join(self, 'frozen-inputs.json'))
const frozenDrift = Object.fromEntries(Object.entries(candidate.frozenRoots).map(([phase, root]) => [phase,
  Object.fromEntries(Object.keys(frozenInputs[phase]).map(n => [n,
    delta(frozenInputs[phase][n], inventory(join(root, 'packages/dsh-pm-tool', n)))]))]))
const rootSrc = join(repo, 'packages/dsh-pm-tool/src')
const currentCandidateDelta = delta(content(candidate.inputs.src), content(inventory(rootSrc)))
const testHashes = Object.fromEntries(['old', 'new'].map(phase => {
  const p = join(candidate.frozenRoots[phase], 'docs/testing', `${original}-cases.test.tsx`)
  assert.equal(sha(readFileSync(p)), sha(readFileSync(join(repo, 'docs/testing', `${original}-cases.test.tsx`))))
  return [phase, sha(readFileSync(p))]
}))
const a14 = '/private/tmp/pmtool-a14-closure-20261022'
const oldEvidence = join(repo, 'reports/all-pending-evidence-20261021/A14')
const oldCandidate = read(join(oldEvidence, 'candidate.json'))
let declaredChecked = 0
for (const [p, hash] of Object.entries({ ...oldCandidate.sourceHashes, ...oldCandidate.artifacts })) {
  assert.equal(sha(readFileSync(join(a14, p))), hash)
  declaredChecked++
}
const loaded = read(join(oldEvidence, 'final/loaded/result.json'))
let loadedChecked = 0
for (const e of loaded.events) {
  const combo = readFileSync(join(oldEvidence, 'final/loaded', e.file))
  assert.equal(sha(combo), e.responseSha)
  assert.equal(e.fromDiskCache, false)
  for (const m of e.matches) {
    const bytes = readFileSync(join(a14, 'packages/dsh-pm-tool/lib', m.name))
    assert.equal(sha(bytes), m.sourceSha)
    const normalized = bytes.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
      .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
    const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
    assert.equal(sha(segment), m.segmentSha)
    assert.equal(combo.indexOf(segment), m.first)
    assert.equal(combo.indexOf(segment, m.first + 1), -1)
    loadedChecked++
  }
}
const events = read(join(oldEvidence, 'final/conflict/command-events.json')).map(e => e.event)
const external = read(join(oldEvidence, 'final/conflict/external-saved-t1.json')).record
const initial = read(join(oldEvidence, 'final/conflict/draft-t1.json')).record
const applied = read(join(oldEvidence, 'final/conflict/result-visible-t1.json')).record
const sentBase = JSON.parse(events.find(e => e.seq === 81).data.args.split(' --base ')[1])
assert.equal(sentBase['t-0001'], external.updatedAt)
assert.notEqual(sentBase['t-0001'], initial.updatedAt)
assert.notEqual(applied.assignee, external.assignee)
assert.match(events.find(e => e.seq === 82).data.text, /^已应用 3 步/)
save('original-a14-audit.json', { declaredChecked, loadedChecked,
  originalConflictExit: read(join(oldEvidence, 'final/conflict/exit.json')), initial, external, applied, sentBase,
  originalPC01GUI: 'FAIL retained; this is old evidence audit, not new GUI',
  originalPC02FailureGUI: 'NOT_RUN retained' })
for (const n of ['run.mjs', 'check.mjs']) run(`syntax-${n}`, process.execPath,
  ['--check', join(repo, 'docs/testing', `${prefix}-${n}`)])
run('diff-whitespace', '/usr/bin/git', ['diff', '--check', '--', 'packages/dsh-pm-tool'])
// 精确只保存本前缀的进程匹配；不记录其他服务 argv 或凭据，不停任何进程。
const ps = spawnSync('/bin/ps', ['-axo', 'pid=,ppid=,command='], { env, encoding: 'utf8' })
assert.equal(ps.status, 0)
const processes = ps.stdout.split('\n').filter(line => {
  const command = line.replace(/^\s*\d+\s+\d+\s+/, '')
  return command.startsWith(process.execPath) && (command.includes(`${prefix}-run.mjs`) ||
    command.includes(self) && (command.includes('vitest') || command.includes('/tsc')))
})
assert.deepEqual(processes, [])
const audit = read(join(self, 'audit.json'))
const ok = Object.values(extended).flat().length === 0 && Object.values(audit.drift).flat().length === 0 &&
  Object.values(frozenDrift).flatMap(x => Object.values(x).flat()).length === 0 && currentCandidateDelta.length === 0
save('commands.json', checkCommands)
save('delivery.json', { at: new Date().toISOString(), actual, extended, frozenDrift, currentCandidateDelta,
  originalTestHashes: testHashes, processes, oldDeclaredChecked: declaredChecked, loadedChecked,
  sourceDeltaFromAuthor: candidate.sourceDeltaFromAuthor,
  files: Object.fromEntries(['plan.md', 'cases.test.tsx', 'run.mjs', 'check.mjs'].map(n => {
    const p = join(repo, 'docs/testing', `${prefix}-${n}`)
    return [p, sha(readFileSync(p))]
  })), ok, limitedSourceAutoOnly: true, guiExecuted: false, built: false, overallRAAI04Pass: false })
console.log(JSON.stringify({ ok, results: actual.map(c => ({ id: c.id, originalExit: c.originalExit, passed: c.passed })),
  extendedDrift: Object.entries(extended).filter(([, x]) => x.length), frozenDrift, processes }))
process.exitCode = ok ? 0 : 1

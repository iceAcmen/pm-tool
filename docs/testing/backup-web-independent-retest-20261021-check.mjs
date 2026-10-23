import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '../..')
const prefix = 'backup-web-independent-retest-20261021'
const evidence = path.join(here, prefix + '-evidence')
const own = path.join(here, prefix + '-selftmp')
const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const read = f => JSON.parse(fs.readFileSync(path.join(evidence, f), 'utf8'))
const checks = []
const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail })
const candidate = read('candidate.json')
const final = read('followup-integrity.json')
const first = read('final-integrity.json')
check('no initial source drift', first.sourceDrift.length === 0, first.sourceDrift)
check('all final source matches candidate', JSON.stringify(final.sourceAfter) === JSON.stringify(candidate.sourceBefore))
check('all frozen source matches candidate', JSON.stringify(final.before) === JSON.stringify(final.after)
  && Object.entries(candidate.frozenSource).every(([f, identity]) =>
    final.after[f]?.sha256 === identity.sha256 && final.after[f]?.bytes === identity.bytes),
  { harnessAdded: Object.keys(final.after).filter(f => !candidate.frozenSource[f]) })
check('F5 fixtures unchanged', JSON.stringify(candidate.fixtureOriginal) === JSON.stringify(final.fixtureAfter)
  && JSON.stringify(candidate.fixtureOriginal) === JSON.stringify(candidate.fixtureCopied))
check('shared cache unchanged both runs', first.cacheBefore === first.cacheAfter && final.cacheBefore === final.cacheAfter)
for (const [file, sha] of Object.entries(candidate.declarations)) check('declaration ' + file, final.declarationsAfter[file] === sha)
const liveDrift = Object.entries(candidate.sourceBefore).filter(([file, identity]) => {
  const current = path.join(repo, 'packages/dsh-pm-tool/src', file)
  return !fs.existsSync(current) || hash(current) !== identity.sha256
}).map(([file]) => file)
check('live original candidate source unchanged', liveDrift.length === 0, liveDrift)
for (const [file, sha] of Object.entries(candidate.declarations)) check('live declaration ' + file,
  hash(path.join(repo, 'packages/dsh-pm-tool', file)) === sha)
const commands = [...read('commands.json'), ...read('followup-commands.json')]
const expected = {
  'current-backend': [0, 43, 43, 0], 'current-panel-bridge': [0, 47, 47, 0],
  'current-seam': [1, 9, 8, 1], 'current-stability': [1, 99, 98, 1],
  'legacy-backend': [1, 43, 17, 26], 'legacy-panel': [1, 10, 5, 5],
  'current-r2': [0, 99, 99, 0], 'current-r3': [0, 99, 99, 0],
}
const cases = []
for (const [label, counts] of Object.entries(expected)) {
  const execution = commands.find(c => c.label === label)
  const result = read(label + '.vitest.json')
  check(label + ' exact counts/exit/no pending', execution.exit === counts[0] && execution.signal === null &&
    result.numTotalTests === counts[1] && result.numPassedTests === counts[2] &&
    result.numFailedTests === counts[3] && result.numPendingTests === 0)
  for (const suite of result.testResults) for (const t of suite.assertionResults) cases.push({
    label, file: path.basename(suite.name), name: t.fullName, status: t.status, failure: t.failureMessages,
  })
}
for (const label of ['current-compile', 'current-reopen', 'current-r3-reopen']) {
  const c = commands.find(c => c.label === label)
  check(label + ' exit0', c.exit === 0 && c.signal === null)
}
for (const c of commands) {
  check(c.label + ' stdout hash', hash(path.join(evidence, c.label + '.stdout.txt')) === c.stdoutSha)
  check(c.label + ' stderr hash', hash(path.join(evidence, c.label + '.stderr.txt')) === c.stderrSha)
}
const reopen = JSON.parse(fs.readFileSync(path.join(evidence, 'current-r3-reopen.stdout.txt'), 'utf8'))
check('new Node read only', reopen.pid !== reopen.parentPid && reopen.readOnly && JSON.stringify(reopen.before) === JSON.stringify(reopen.after))
check('all thirteen business tables', Object.keys(reopen.tables).filter(k => !['checks', 'sessions'].includes(k)).length === 13)
check('bytes two x22', Object.values(reopen.bytes).length === 2 && Object.values(reopen.bytes).every(f => f.size === 22))
const auditFiles = fs.readdirSync(evidence).filter(f => f.endsWith('.audit.ndjson'))
const audit = auditFiles.flatMap(f => fs.readFileSync(path.join(evidence, f), 'utf8').split('\n').filter(Boolean)
  .map(line => ({ file: f, ...JSON.parse(line) })))
check('Node write audit no denied', audit.every(x => x.allowed), { total: audit.length, denied: audit.filter(x => !x.allowed) })
for (const archive of read('external-original-archives.json')) check('archive ' + path.basename(archive.destination),
  hash(archive.source) === archive.sha256 && hash(archive.destination) === archive.archiveSha && archive.sha256 === archive.archiveSha)
for (const [file, identity] of Object.entries(read('evidence-sha256-r3.json'))) check('evidence hash ' + file,
  hash(path.join(evidence, file)) === identity.sha256)
const mainRed = read('Main-A7-pmtool-panel-restore-red-20261021-exit.json')
const mainGreen = read('Main-A7-pmtool-panel-restore-green-20261021-exit.json')
check('Main actual red/green exits only', mainRed.exit === 1 && mainGreen.exit === 0)
const report = path.join(here, prefix + '.md')
if (fs.existsSync(report)) {
  const text = fs.readFileSync(report, 'utf8')
  check('paired report fences', (text.match(/^```/gm) ?? []).length % 2 === 0)
  for (const [, link] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (!/^(https?:|file:)/.test(link)) check('report link ' + link, fs.existsSync(path.resolve(here, link.split('#')[0])))
  }
}
const syntax = []
for (const name of ['run.mjs', 'followup.mjs', 'reopen.mjs', 'check.mjs']) {
  const argv = [process.execPath, '--check', path.join(here, `${prefix}-${name}`)]
  const r = spawnSync(argv[0], argv.slice(1), { cwd: repo, encoding: 'utf8' })
  syntax.push({ argv, exit: r.status, signal: r.signal, stdout: r.stdout, stderr: r.stderr })
  check('syntax ' + name, r.status === 0 && r.signal === null)
}
const vendorArgs = [process.execPath, 'packages/dsh-pm-tool/scripts/verify-external-skills.mjs']
const vendor = spawnSync(vendorArgs[0], vendorArgs.slice(1), { cwd: repo, encoding: 'utf8' })
check('vendor static verifier', vendor.status === 0 && vendor.signal === null)
check('code-review locked hash', hash(path.join(repo, 'vendor/agent-skills/mattpocock/skills/code-review/SKILL.md'))
  === '09eb147f793e4647949edd32dbad278f0554dfb56e0d46b699cd4c2c55bf0357')
const runLabel = process.argv[2] || 'pre-report'
const result = {
  time: new Date().toISOString(), checks, syntax, cases,
  vendor: { argv: vendorArgs, cwd: repo, exit: vendor.status, signal: vendor.signal, stdout: vendor.stdout, stderr: vendor.stderr },
  passed: checks.filter(x => x.ok).length, failed: checks.filter(x => !x.ok).length,
  commandExits: commands.map(c => ({ label: c.label, exit: c.exit, signal: c.signal })),
}
fs.writeFileSync(path.join(evidence, `evidence-check-${runLabel}.json`), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ passed: result.passed, failed: result.failed, failures: checks.filter(x => !x.ok),
  operations: audit.length, commandExits: result.commandExits }, null, 2))
process.exitCode = result.failed ? 1 : 0

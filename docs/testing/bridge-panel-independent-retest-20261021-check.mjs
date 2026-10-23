import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const prefix = 'bridge-panel-independent-retest-20261021'
const repo = path.resolve(here, '../..')
const label = process.argv[2] || 'final'
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const frozen = JSON.parse(fs.readFileSync(path.join(here, `${prefix}-freeze.json`)))
const checks = []
const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail })
const archive = (source, destination) => {
  if (!fs.existsSync(destination)) fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL)
  check(`archive ${path.basename(destination)}`, hash(source) === hash(destination), { source, destination, sha256: hash(destination) })
  return { source, destination, sha256: hash(destination) }
}

const mainDir = path.join(repo, 'reports/all-pending-evidence-20261021/A6/bridge')
const mainFiles = fs.readdirSync(mainDir).filter(name => name.endsWith('.txt') || name.endsWith('.json'))
const mainArchives = mainFiles.map(name => archive(
  path.join(mainDir, name), path.join(here, `${prefix}-A6-${name}`),
))
const mainManifest = JSON.parse(fs.readFileSync(path.join(mainDir, 'source-fingerprints.json')))
for (const [filename, fingerprint] of Object.entries(mainManifest)) {
  const relative = filename.replace(/^packages\/dsh-pm-tool\//, '')
  check(`Main fingerprint ${relative}`, frozen.copied[relative] === fingerprint, { frozen: frozen.copied[relative], main: fingerprint })
}
const redExit = JSON.parse(fs.readFileSync(path.join(mainDir, 'pmtool-handshake-red-frozen-20261021-exit.json')))
const greenExit = JSON.parse(fs.readFileSync(path.join(mainDir, 'pmtool-handshake-green-20261021-r2-exit.json')))
check('Main actual spawn exits', redExit.exit === 1 && greenExit.exit === 0, { redExit, greenExit })
for (const [file, fingerprint] of Object.entries(redExit.sources)) {
  check(`Main legacy ${file}`, hash(path.join('/tmp/pmtool-handshake-red-frozen-20261021', file)) === fingerprint, fingerprint)
}

const sourceArchives = [
  'src/client/launch-handshake.ts', 'src/client/panel.tsx', 'src/client/index.tsx',
  'src/client/launch-handshake.test.ts', 'src/client/panel-launch-handshake.test.tsx',
  'vitest.config.ts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json',
].map(file => archive(
  path.join(frozen.frozen, file),
  path.join(here, `${prefix}-frozen-${file.replaceAll('/', '_')}.txt`),
))
const expected = {
  'current-r1': { exit: 1, passed: 41, failed: 1 },
  'current-r2': { exit: 0, passed: 42, failed: 0 },
  'current-r3': { exit: 0, passed: 42, failed: 0 },
  'legacy-r1': { exit: 1, passed: 25, failed: 17 },
  'ready-negative': { exit: 1, passed: 37, failed: 5 },
  'unmount-negative': { exit: 1, passed: 40, failed: 2 },
  'finally-negative': { exit: 1, passed: 40, failed: 2 },
}
const executions = []
for (const [label, totals] of Object.entries(expected)) {
  const filename = path.join(here, `${prefix}-${label}-execution.json`)
  const data = JSON.parse(fs.readFileSync(filename))
  check(`${label} exit/count`, data.exit === totals.exit && data.signal === null
    && data.totals.total === 42 && data.totals.passed === totals.passed && data.totals.failed === totals.failed
    && data.totals.pending === 0, { totals: data.totals, exit: data.exit, signal: data.signal })
  check(`${label} no run source drift`, data.sourceDrift.length === 0, data.sourceDrift)
  for (const kind of ['stdout', 'stderr', 'result', 'config']) {
    check(`${label} ${kind} hash`, hash(data[kind].file) === data[kind].sha256, data[kind])
  }
  const executedTest = path.join(data.cwd, 'src/client', `${prefix}-additional.test.tsx`)
  archive(executedTest, path.join(here, `${prefix}-${label}-executed-test.txt`))
  check(`${label} executed test fingerprint`, hash(executedTest) === data.additional.sha256, data.additional.sha256)
  if (label.startsWith('current')) {
    for (const [file, fingerprint] of Object.entries(frozen.copied)) {
      check(`${label} frozen ${file}`, data.before[file] === fingerprint && data.after[file] === fingerprint, fingerprint)
    }
  }
  const tests = data.tests.map(test => ({ file: path.basename(test.file), name: test.name, status: test.status }))
  executions.push({ label, started: data.started, ended: data.ended, exit: data.exit, totals: data.totals, tests, sha256: hash(filename) })
}

const legacy = executions.find(run => run.label === 'legacy-r1')
const failedAuthorTests = legacy.tests.filter(test => test.status === 'failed' && !test.file.startsWith(prefix))
check('Independent legacy original 28 = 20 green/8 red', failedAuthorTests.length === 8,
  failedAuthorTests)
check('R05/R06/R07/R08 all red on legacy', failedAuthorTests.filter(test => test.name.includes('R0')).length === 4)
check('No-current-run-pending', executions.filter(run => run.label === 'current-r2' || run.label === 'current-r3')
  .every(run => run.tests.every(test => test.status === 'passed')))
const keyDrift = Object.entries(frozen.copied).filter(([file, fingerprint]) =>
  hash(path.join(repo, 'packages/dsh-pm-tool', file)) !== fingerprint).map(([file]) => file)
const graphDrift = Object.entries(frozen.sourceCopied).filter(([file, fingerprint]) =>
  !fs.existsSync(path.join(repo, 'packages/dsh-pm-tool', file))
  || hash(path.join(repo, 'packages/dsh-pm-tool', file)) !== fingerprint).map(([file]) => file)
const frozenDrift = Object.entries(frozen.sourceCopied).filter(([file, fingerprint]) =>
  hash(path.join(frozen.frozen, file)) !== fingerprint).map(([file]) => file)
check('Frozen source graph unchanged', frozenDrift.length === 0, frozenDrift)
// Main parallel edits are facts, not failures of archived runs; do not upgrade latest tree.
const owned = fs.readdirSync(here).filter(name => name.startsWith(prefix))
const reportFile = path.join(here, `${prefix}.md`)
if (fs.existsSync(reportFile)) {
  const report = fs.readFileSync(reportFile, 'utf8')
  check('Report fences paired', (report.match(/^```/gm) || []).length % 2 === 0)
  const links = [...report.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1])
  const missing = links.filter(link => !/^(https?:|file:)/.test(link) && !fs.existsSync(path.resolve(here, link.split('#')[0])))
  check('Report relative links exist', missing.length === 0, missing)
}
const auxiliary = []
for (const name of ['run.mjs', 'check.mjs', 'config.mjs']) {
  const args = ['--check', path.join(here, `${prefix}-${name}`)]
  const command = spawnSync(process.execPath, args, { cwd: repo, encoding: 'utf8' })
  auxiliary.push({ command: [process.execPath, ...args], exit: command.status, signal: command.signal, stdout: command.stdout, stderr: command.stderr })
  check(`syntax ${name}`, command.status === 0 && command.signal === null)
}
const verifier = spawnSync(process.execPath, ['packages/dsh-pm-tool/scripts/verify-external-skills.mjs'], { cwd: repo, encoding: 'utf8' })
auxiliary.push({
  command: [process.execPath, 'packages/dsh-pm-tool/scripts/verify-external-skills.mjs'],
  exit: verifier.status, signal: verifier.signal, stdout: verifier.stdout, stderr: verifier.stderr,
})
check('vendor static verifier', verifier.status === 0 && verifier.signal === null)
check('code-review body integrity', hash(path.join(repo, 'vendor/agent-skills/mattpocock/skills/code-review/SKILL.md'))
  === '09eb147f793e4647949edd32dbad278f0554dfb56e0d46b699cd4c2c55bf0357')
const result = {
  at: new Date().toISOString(), scope: 'archived source/AUTO evidence only',
  mainArchives, sourceArchives, executions, keyDrift, graphDrift, frozenDrift,
  checks, passed: checks.filter(item => item.ok).length, failed: checks.filter(item => !item.ok).length,
  owned, auxiliary,
  completedCommands: executions.map(run => ({ label: run.label, exit: run.exit })),
}
fs.writeFileSync(path.join(here, `${prefix}-evidence-check-${label}.json`), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({
  passed: result.passed, failed: result.failed, keyDrift, graphDrift, frozenDrift,
  currentRuns: executions.filter(run => run.label.startsWith('current')).map(run => ({ label: run.label, exit: run.exit, totals: run.totals })),
  completedCommands: result.completedCommands,
}, null, 2))
process.exitCode = result.failed ? 1 : 0

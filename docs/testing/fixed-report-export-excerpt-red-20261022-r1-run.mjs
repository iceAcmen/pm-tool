import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const pkg = path.join(repo, 'packages/dsh-pm-tool')
const owned = path.join(repo, 'reports/all-pending-evidence-20261021/ReportExportRedR1')
fs.mkdirSync(owned, { recursive: true })
const run = fs.mkdtempSync(path.join(owned, 'run-'))
const save = (name, value) => fs.writeFileSync(path.join(run, name), JSON.stringify(value, null, 2), { flag: 'wx' })
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const fingerprint = file => {
  const bytes = fs.readFileSync(file)
  return { bytes: bytes.length, sha256: sha(bytes) }
}
const parentRoot = path.join(repo, 'reports/all-pending-evidence-20261021/CombinedRepairR1/r2')
const parent = JSON.parse(fs.readFileSync(path.join(parentRoot, 'candidate.json')))
const declarations = JSON.parse(fs.readFileSync(path.join(parentRoot, 'source-files.json')))
const inputs = JSON.parse(fs.readFileSync(path.join(parentRoot, 'complete-inputs.json')))
const test = 'packages/dsh-pm-tool/src/core/report-export-excerpts.test.ts'
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' })
save('git-head.command.json', { argv: ['git', 'rev-parse', 'HEAD'], exit: head.status, stdout: head.stdout, stderr: head.stderr })
assert.equal(head.status, 0)
assert.equal(head.stdout.trim(), '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd')
assert.equal(parent.baseline, head.stdout.trim())
assert.equal(declarations.count, 107)
assert.equal(Object.keys(inputs).length, 515)

function snapshot() {
  const source = {}
  for (const file of Object.keys(inputs)) source[`packages/dsh-pm-tool/${file}`] = fingerprint(path.join(pkg, file))
  for (const file of Object.keys(declarations.source)) source[file] = fingerprint(path.join(repo, file))
  source[test] = fingerprint(path.join(repo, test))
  const lib = {}
  function walk(dir, rel = '') {
    if (!fs.existsSync(dir)) { lib[rel || '.'] = { absent: true }; return }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name), name = path.join(rel, entry.name)
      const stat = fs.lstatSync(file)
      if (stat.isSymbolicLink()) lib[name] = { symlink: fs.readlinkSync(file) }
      else if (stat.isDirectory()) walk(file, name)
      else lib[name] = fingerprint(file)
    }
  }
  walk(path.join(pkg, 'lib'))
  return { at: new Date().toISOString(), source, lib }
}

const before = snapshot()
save('protected-before.json', before)
const differences = []
for (const [file, expected] of Object.entries(inputs)) {
  if (before.source[`packages/dsh-pm-tool/${file}`].sha256 !== expected.sha256) differences.push(file)
}
for (const [file, expected] of Object.entries(declarations.source)) {
  if (before.source[file].sha256 !== expected) differences.push(file)
}
save('binding.json', {
  baseline: parent.baseline, parent, sourceDeclarations: declarations.count,
  completeInputs: Object.keys(inputs).length, differences,
  testClaim: { path: test, ...before.source[test], separateFrom107: true },
  producer: 'Main', role: 'trae independent test-first expert; no business edits or GUI',
  sourceMode: 'main TypeScript, checked byte-equal to frozen CombinedRepairR1/r2 inputs',
  parentArtifacts: ['candidate.json', 'source-files.json', 'complete-inputs.json'].map(name =>
    ({ name, ...fingerprint(path.join(parentRoot, name)) })),
  originalEvidence: [
    'docs/testing/material-meeting-report-gui-review-20261022-r1.md',
    'docs/testing/remaining-journey-cases-20261021.md',
    'reports/all-pending-evidence-20261021/MaterialRemainingR1/50-report-fixed-saved-raw/data/pmtool/reports/rpt-0002.json',
    'reports/all-pending-evidence-20261021/MaterialRemainingR1/57-fixed-export.md',
  ].map(name => ({ name, ...fingerprint(path.join(repo, name)) })),
  originalMdIsOracle: false, runningServicesTouched: false,
})
assert.deepEqual(differences, [], '生产源若漂移，先交回 Main，不冻结/覆盖在途成果')

for (const [name, args] of [
  ['tracked-product.diff', ['diff', '--', 'packages/dsh-pm-tool', 'launcher']],
  ['new-product-files.txt', ['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool/src', 'packages/dsh-pm-tool/scripts', 'launcher']],
]) {
  const cmd = spawnSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  fs.writeFileSync(path.join(run, name), cmd.stdout, { flag: 'wx' })
  save(`${name}.command.json`, { argv: ['git', ...args], exit: cmd.status, stderr: cmd.stderr })
  assert.equal(cmd.status, 0)
}
for (const dir of ['tmp', 'cache']) fs.mkdirSync(path.join(run, dir))
const config = path.join(repo, 'docs/testing/fixed-report-export-excerpt-red-20261022-r1-config.mjs')
const argv = [
  path.join(pkg, 'node_modules/vitest/vitest.mjs'), 'run', '--config', config,
]
for (const [name, source] of [
  ['test-source.ts.txt', path.join(repo, test)],
  ['config-source.mjs.txt', config],
  ['runner-source.mjs.txt', fileURLToPath(import.meta.url)],
]) {
  fs.writeFileSync(path.join(run, name), fs.readFileSync(source), { flag: 'wx' })
}
const start = new Date().toISOString()
const child = spawnSync(process.execPath, argv, {
  cwd: pkg,
  env: {
    ...process.env,
    REPORT_EXPORT_RED_TMP: path.join(run, 'tmp'),
    REPORT_EXPORT_RED_CACHE: path.join(run, 'cache'),
    REPORT_EXPORT_RED_RESULT: path.join(run, 'vitest.result.json'),
  },
  encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024,
})
fs.writeFileSync(path.join(run, 'vitest.stdout.txt'), child.stdout ?? '', { flag: 'wx' })
fs.writeFileSync(path.join(run, 'vitest.stderr.txt'), child.stderr ?? '', { flag: 'wx' })
save('vitest.command.json', {
  executable: process.execPath, argv, cwd: pkg, node: process.version,
  start, end: new Date().toISOString(), exit: child.status, signal: child.signal,
  error: child.error ? String(child.error) : null,
  config: fingerprint(config), onlyTest: test, coverage: false,
  writeRoots: [run], noBuildInstallNoEmit: true, noGUI: true,
})
const after = snapshot()
save('protected-after.json', after)
const drift = []
for (const area of ['source', 'lib']) {
  for (const file of new Set([...Object.keys(before[area]), ...Object.keys(after[area])])) {
    if (JSON.stringify(before[area][file]) !== JSON.stringify(after[area][file])) drift.push({ area, file })
  }
}
let cases = []
if (fs.existsSync(path.join(run, 'vitest.result.json'))) {
  const result = JSON.parse(fs.readFileSync(path.join(run, 'vitest.result.json')))
  cases = result.testResults.flatMap(file => file.assertionResults ?? [])
}
const controls = cases.filter(item => item.fullName.includes('CONTROL'))
const reds = cases.filter(item => item.fullName.includes(' RED'))
const meaningfulRed = child.status === 1 && !child.error && drift.length === 0
  && controls.length === 7 && controls.every(item => item.status === 'passed')
  && reds.length === 6 && reds.every(item => item.status === 'failed');
save('summary.json', {
  at: new Date().toISOString(), baseline: parent.baseline, parent107: true,
  node: process.version, vitestExit: child.status, controls: controls.length, reds: reds.length,
  passed: cases.filter(item => item.status === 'passed').length,
  failed: cases.filter(item => item.status === 'failed').length,
  skippedOrPending: cases.filter(item => !['passed', 'failed'].includes(item.status)).length,
  meaningfulRed, drift,
  verdict: meaningfulRed ? '有限 RED：MRR-R05-EXPORT-EXCERPTS' : '未得到计划 RED；原始结果保留，须区分设施/产品',
  cases: cases.map(({ fullName, status, failureMessages }) => ({ fullName, status, failureMessages })),
  protectionScope: '515 package inputs + 107 declarations (deduplicated) + owned test + main lib; no formal data/profile/vendor/key reads',
  noDomainOrCommitVerdict: true, release: 'STOP',
})
function inventory(dir, rel = '') {
  const files = {}
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name), name = path.join(rel, entry.name)
    if (entry.isDirectory()) Object.assign(files, inventory(file, name))
    else if (entry.isSymbolicLink()) files[name] = { symlink: fs.readlinkSync(file) }
    else files[name] = fingerprint(file)
  }
  return files
}
save('artifact-index.json', { at: new Date().toISOString(), files: inventory(run) })
console.log(JSON.stringify({
  run: path.relative(repo, run), vitestExit: child.status,
  passed: cases.filter(item => item.status === 'passed').length,
  failed: cases.filter(item => item.status === 'failed').length, meaningfulRed, drift,
}, null, 2))
process.exitCode = meaningfulRed ? 1 : 2

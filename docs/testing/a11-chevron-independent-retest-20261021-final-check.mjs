import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a11-chevron-independent-retest-20261021'
const root = path.join(repo, 'docs/testing', `${prefix}-selftmp`)
const round = process.argv[2] ?? 'r3'
if (!/^r[2-9]$/.test(round)) throw new Error('Explicit round required')
const dir = path.join(root, round)
const out = path.join(root, `${round}-final-check.json`)
if (fs.existsSync(out)) throw new Error('Never overwrite final evidence')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))
const candidate = read('candidate.json')
const summary = read('summary.json')
const observations = read('independent-observations.json')
const manifest = read('source-manifest.json')
const resources = fs.readFileSync(path.join(dir, 'resources.ndjson'), 'utf8').trim().split('\n').map(JSON.parse)
const checks = []
const check = (name, ok, details) => checks.push({ name, ok, details })
const counts = {}
for (const [label, expected] of [['launcher56', 56], ['dom8', 8], ['independent-dom', 5]]) {
  const stdout = fs.readFileSync(path.join(dir, `${label}.stdout.txt`), 'utf8')
  const record = read(`${label}.exit.json`)
  const count = name => Number(stdout.match(new RegExp(`^# ${name} (\\d+)$`, 'm'))?.[1] ?? -1)
  counts[label] = { tests: count('tests'), pass: count('pass'), fail: count('fail'),
    cancelled: count('cancelled'), skipped: count('skipped'), exit: record.exit }
  check(`${label}: all applicable cases`, record.exit === 0 && count('tests') === expected &&
    count('pass') === expected && count('fail') === 0 && count('cancelled') === 0 && count('skipped') === 0, counts[label])
  check(`${label}: raw log hashes`, hash(fs.readFileSync(path.join(dir, `${label}.stdout.txt`))) === record.stdoutSha256 &&
    hash(fs.readFileSync(path.join(dir, `${label}.stderr.txt`))) === record.stderrSha256)
}
check('candidate hash matches summary', hash(fs.readFileSync(path.join(dir, 'candidate.json'))) === summary.candidateSha256)
const sourceAfter = manifest.map(item => ({
  path: item.path, frozen: item.sha256,
  frozenAfter: hash(fs.readFileSync(path.join(dir, 'frozen', item.path))),
  liveAfter: fs.existsSync(path.join(repo, item.path)) ? hash(fs.readFileSync(path.join(repo, item.path))) : 'MISSING',
}))
check('frozen source identity unchanged', sourceAfter.every(item => item.frozen === item.frozenAfter), { files: sourceAfter.length })
const originalLogChecks = Object.entries(candidate.originalLogs).map(([name, expected]) => ({
  name, same: hash(fs.readFileSync(path.join(repo, 'reports/all-pending-evidence-20261021/A11/chevron', name))) === expected.sha256,
}))
check('original red/green logs unchanged', originalLogChecks.every(item => item.same), originalLogChecks)
check('exact one-rule source and unchanged inline scripts', candidate.sourceExactMinusOneCss &&
  candidate.templates.every(item => item.inlineUnchanged))
const dom = observations.filter(item => item.type === 'dom' && item.icon && !item.label.startsWith('A10'))
check('all new chooser observations 18x18/no shrink', dom.every(item => item.icon.width === 18 &&
  item.icon.height === 18 && item.icon.flexShrink === '0' && item.trigger.height === 48), { observations: dom.length })
const states = observations.filter(item => item.type === 'dom' && item.label.startsWith('S4-'))
check('S4 no chevron, original check 25x25', states.length === 8 && states.every(item =>
  item.icon === null && item.stateIcon.width === 25 && item.stateIcon.height === 25))
for (const width of [1440, 390]) {
  for (const theme of ['light', 'dark']) {
    const group = observations.filter(item => item.type === 'dom' && item.width === width && item.theme === theme)
    check(`matrix ${width}/${theme}`, ['S0-initial', 'S0-menu', 'Chrome-selected', 'Escape-focus', 'S1-sync',
      'S1-same-state-menu', 'S4-sync', 'S4-after-fixture-reopen', 'S1-after-switch'].every(label => group.some(item => item.label === label)))
  }
}
const old = observations.find(item => item.label === 'A10-old-comparison')
check('old bug independently reproduced', old?.icon.width === 239.78125 && old?.trigger.height === 241.78125, old)
const other = observations.find(item => item.type === 'other-svg-comparison')
check('unrelated selected-menu SVG unchanged', JSON.stringify(other?.oldSelected) === JSON.stringify(other?.newSelected) && !!other, other)
const launched = resources.filter(item => item.type === 'spawn')
const processStatus = launched.map(item => {
  let alive = false
  try { process.kill(item.pid, 0); alive = true } catch (error) { if (error.code !== 'ESRCH') throw error }
  return { pid: item.pid, executable: item.executable, alive,
    recordedExit: resources.find(exit => exit.type === 'child-exit' && exit.pid === item.pid) }
})
check('all recorded owned subprocesses released', processStatus.every(item => !item.alive && item.recordedExit), processStatus)
const chrome = launched.filter(item => item.executable === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
check('only new private headless Chrome contexts', chrome.length === 2 && chrome.every(item =>
  item.argv.includes('--headless=new') && item.argv.some(arg => arg.startsWith(`--user-data-dir=${dir}/tmp/`))), chrome)
const ports = resources.filter(item => item.type === 'fixture-listen').map(item => item.address.port)
check('all controlled fixture servers closed', resources.filter(item => item.type === 'fixture-close').length === ports.length)
check('no existing control60787 listen', !ports.includes(60787), ports)
const listening = ports.map(port => {
  try {
    return { port, listener: execFileSync('/usr/sbin/lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' }) }
  } catch (e) {
    if (e.status !== 1) throw e
    return { port, listener: '' }
  }
})
check('owned HTTP fixture ports no longer listening', listening.every(item => !item.listener), listening)
const links = []
const walkLinks = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isSymbolicLink()) links.push({ path: p, target: fs.realpathSync(p) })
    else if (entry.isDirectory()) walkLinks(p)
  }
}
walkLinks(path.join(dir, 'dependencies'))
walkLinks(path.join(dir, 'frozen/packages'))
check('dependency links all private, no sharedcache', links.every(item => item.target.startsWith(`${dir}/`)), { links: links.length })
const evidence = {
  checkedAt: new Date().toISOString(), round, counts, checks,
  sourceAfter, candidateSha256: summary.candidateSha256,
  caseSha256: hash(fs.readFileSync(path.join(repo, 'docs/testing', `${prefix}-cases.test.mjs`))),
  verdict: checks.every(item => item.ok) ? 'SOURCE_AUTO_LIMITED_PASS_NOT_GUI' : 'CHECK_FAILURE',
  boundary: 'No actual new Finder GUI/PM mount/nonce/credentials/service/publication evidence; no global filesystem watch',
}
fs.writeFileSync(out, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify({ verdict: evidence.verdict, checks: checks.length, failed: checks.filter(item => !item.ok), counts,
  sourceManifestFiles: sourceAfter.length, liveChanged: sourceAfter.filter(item => item.frozen !== item.liveAfter).map(item => item.path), out }, null, 2))
process.exitCode = checks.every(item => item.ok) ? 0 : 1

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a10-finder-reopen-gui-independent-review-20261021'
const evidence = 'reports/all-pending-evidence-20261021/A10'
const isolated = '/private/tmp/pmtool-all-closure-20261021'
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const read = name => fs.readFileSync(path.join(repo, name))
const json = name => JSON.parse(read(name))
const label = process.argv[2]
if (!/^[a-z0-9-]+$/.test(label ?? '')) throw new Error('Supply a new audit label')
const output = path.join(repo, `${prefix}-${label}.json`)
if (fs.existsSync(output)) throw new Error('Refusing to overwrite prior evidence')

function files(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(root, entry.name)
    return entry.isDirectory() ? files(target) : entry.isFile() ? [target] : []
  })
}
function compare(root, expected) {
  const mismatches = []
  for (const [name, value] of Object.entries(expected)) {
    try {
      const actual = hash(fs.readFileSync(path.join(root, name)))
      if (actual !== value) mismatches.push({ name, expected: value, actual })
    } catch (error) {
      mismatches.push({ name, expected: value, error: error.code })
    }
  }
  return { checked: Object.keys(expected).length, mismatches }
}

const candidate = json(`${evidence}/candidate.json`)
const artifacts = json(`${evidence}/build/artifacts.json`)
const sync = json(`${evidence}/build/sync.json`)
const environment = json(`${evidence}/environment.json`)
const app = json(`${evidence}/finder/app.json`)
const a5 = json('reports/all-pending-evidence-20261021/A5/candidate.json')
const oldBridge = json('docs/testing/bridge-panel-independent-retest-20261021-freeze.json')
const checks = []
const check = (id, ok, detail) => checks.push({ id, ok, detail })
check('candidate-artifact-manifests', JSON.stringify(candidate.artifacts) === JSON.stringify(artifacts), {
  count: Object.keys(artifacts).length,
})
check('candidate-sync-source', JSON.stringify(candidate.sourceHashes) === JSON.stringify(sync.sourceHashes), {
  sourceCount: Object.keys(candidate.sourceHashes).length, syncDrift: sync.drift, postDrift: candidate.postDrift,
})
const finderEnvironment = environment.setups.find(setup => setup.label === 'finder')
check('finder-skeleton-not-loaded-proof', finderEnvironment.port === app.port &&
  finderEnvironment.root === app.root, { finderEnvironment, appPort: app.port })
const publicFixtures = Object.fromEntries(Object.entries(app.paths)
  .filter(([name]) => /^\/private\/tmp\/pmtool-a10-finder-(?:entry|passive)-20261021\.mjs$/.test(name))
  .map(([name, expected]) => {
    const archive = `${evidence}/finder/${path.basename(name)}`
    const actual = hash(read(archive))
    check(`fixture-${path.basename(name)}`, expected === actual, { archive, expected, actual })
    return [archive, actual]
  }))
check('app-production-bin', app.paths[`${isolated}/launcher/bin/pm-launcher.mjs`] ===
  candidate.sourceHashes['launcher/bin/pm-launcher.mjs'], {
  expected: candidate.sourceHashes['launcher/bin/pm-launcher.mjs'],
})

const sourceMain = compare(repo, candidate.sourceHashes)
const sourceIsolated = compare(isolated, candidate.sourceHashes)
const builtIsolated = compare(isolated, artifacts)
check('source-main-current', sourceMain.mismatches.length === 0, sourceMain)
check('source-isolated-current', sourceIsolated.mismatches.length === 0, sourceIsolated)
check('built-isolated-current-not-network', builtIsolated.mismatches.length === 0, builtIsolated)
check('tracked-patch', hash(read(`${evidence}/product-tracked.patch`)) === candidate.trackedPatchSha, {
  actual: hash(read(`${evidence}/product-tracked.patch`)), expected: candidate.trackedPatchSha,
})
const launcherInheritance = Object.fromEntries(Object.entries(candidate.sourceHashes)
  .filter(([name]) => /^launcher\/(?:src|bin)\//.test(name))
  .map(([name, actual]) => {
    const previous = a5.source[name]?.sha256
    return [name, { current: actual, a5: previous, unchanged: previous === actual }]
  }))
const panelGate = text => {
  const start = text.indexOf('  const launchHandshakeRef = useRef<')
  const end = text.indexOf('\n  // ', text.indexOf('  }, [])', start))
  if (start < 0 || end < 0) throw new Error('Cannot identify the original handshake block')
  return text.slice(start, end)
}
const currentPanelGate = panelGate(read('packages/dsh-pm-tool/src/client/panel.tsx').toString('utf8'))
const oldPanelGate = panelGate(read(
  'docs/testing/bridge-panel-independent-retest-20261021-frozen-src_client_panel.tsx.txt',
).toString('utf8'))
check('panel-handshake-block-only-inheritance', currentPanelGate === oldPanelGate, {
  previous: hash(oldPanelGate), current: hash(currentPanelGate),
  boundary: 'exact handshake refs/refresh/mount/cleanup block only; not complete panel or import graph',
})
const bridgeInheritance = Object.fromEntries(Object.entries(oldBridge.before)
  .filter(([name]) => /launch-handshake|panel\.tsx|client\/index\.tsx/.test(name))
  .map(([name, previous]) => {
    const current = candidate.sourceHashes[`packages/dsh-pm-tool/${name}`]
    return [name, { previous, current, unchanged: previous === current }]
  }))

const observations = []
for (const directory of ['control-open-frames', 'control-open-r2-frames']) {
  const manifest = json(`${evidence}/finder/${directory}/frames.json`)
  for (const frame of manifest.frames) {
    const name = `${evidence}/finder/${directory}/${frame.file}`
    const actual = hash(read(name))
    check(`frame-${directory}-${frame.file}`, actual === frame.sha256, {
      name, expected: frame.sha256, actual,
    })
    observations.push({ name, ...frame })
  }
}
const events = read(`${evidence}/finder/passive.ndjson`).toString('utf8').trim()
  .split('\n').map(line => JSON.parse(line))
const roundTrips = ['N1', 'N2'].map(alias => {
  const opened = events.find(event => event.event === 'open-start' &&
    event.argv.some(value => value.includes(`60787.${alias}`)))
  const exit = events.find(event => event.event === 'open-exit' && event.pid === opened?.pid)
  const request = events.filter(event => event.event === 'entered-request' && event.alias === alias)
  const response = events.filter(event => event.event === 'entered-response' && event.alias === alias)
  check(`observed-${alias}`, opened?.argv[2] === 'Google Chrome' && exit?.code === 0 &&
    request.length === 1 && request[0].origin === 'http://127.0.0.1:3217' &&
    response.length === 1 && response[0].status === 200 && response[0].controlPort === 60787, {
    opened, exit, request, response,
  })
  return { alias, opened, exit, request, response,
    mintToResponseMs: Date.parse(response[0].at) - Date.parse(opened.at),
    boundary: 'method/headers/body and personal Chrome loaded bytes not captured' }
})
check('reopen-clean-url', roundTrips[1].opened.argv[3] ===
  'http://127.0.0.1:3217/#pm-launch=60787.N2', { argv: roundTrips[1].opened.argv })
const finalState = json(`${evidence}/finder/state-after-reopen.json`)
const state = finalState.state.state
check('final-state', state.status === 'S4' && state.confirmed === true &&
  state.port === 3217 && state.browser === 'Chrome', finalState)
check('final-state-no-auth-fields', !Object.keys(state).some(key =>
  /token|nonce|cookie|credential|url/i.test(key)), { keys: Object.keys(state) })

const evidencePaths = [
  ...files(path.join(repo, evidence, 'finder')).map(name => path.relative(repo, name)),
  `${evidence}/candidate.json`, `${evidence}/environment.json`, `${evidence}/product-tracked.patch`,
  ...files(path.join(repo, evidence, 'build')).map(name => path.relative(repo, name)),
  'AGENTS.md', 'docs/collaboration.md',
  'reports/all-pending-acceptance-execution-20261021.md',
  'docs/testing/fc-a5-independent-retest-20261021.md',
  'docs/testing/bridge-panel-independent-retest-20261021.md',
  'docs/testing/reopen-handshake-diagnosis-20261021.md',
  'docs/testing/a0-paths-board-review-20261021.md',
]
const fingerprints = Object.fromEntries(evidencePaths.map(name => [name, hash(read(name))]))
const syntax = Object.keys(publicFixtures).map(name => {
  execFileSync(process.execPath, ['--check', path.join(repo, name)], { encoding: 'utf8' })
  return { argv: [process.execPath, '--check', name], exit: 0, boundary: 'syntax only; not executed' }
})
const result = {
  at: new Date().toISOString(),
  reviewer: 'trae independent finite evidence review',
  auditSourceSha256: hash(read(`${prefix}-audit.mjs`)),
  environment: { platform: process.platform, arch: process.arch, node: process.version, cwd: repo },
  command: [process.execPath, `${prefix}-audit.mjs`, label],
  candidate: { baseline: candidate.baseline, hostGitHead: candidate.hostGitHead,
    sha256: fingerprints[`${evidence}/candidate.json`],
    trackedPatchSha: candidate.trackedPatchSha, clientSha: artifacts['packages/dsh-pm-tool/lib/client.js'] },
  checks, sourceMain, sourceIsolated, builtIsolated, launcherInheritance, bridgeInheritance,
  publicFixtures, syntax, frames: observations, roundTrips,
  separateUnaliased204: events.filter(event => event.event === 'entered-response' && event.status === 204),
  fingerprints,
  boundary: 'Only repository evidence and declared public candidate files read. No runtime root, credentials, GUI, network, service, installation, build, product write or commit. Audit consistency is not GUI PASS.',
}
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ output, checks: checks.length, failed: checks.filter(item => !item.ok),
  sourceCount: sourceMain.checked, artifactCount: builtIsolated.checked,
  launcherUnchanged: Object.values(launcherInheritance).filter(item => item.unchanged).length,
  launcherCompared: Object.keys(launcherInheritance).length, bridgeInheritance,
  roundTrips: roundTrips.map(item => ({ alias: item.alias, mintToResponseMs: item.mintToResponseMs })) }, null, 2))
if (checks.some(item => !item.ok)) process.exitCode = 1

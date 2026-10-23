import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

// Only archived evidence and the declared A11 production source/lib are read.
const prefix = fileURLToPath(import.meta.url).replace(/-audit\.mjs$/, '')
const root = path.resolve(path.dirname(prefix), '../..')
const evidence = 'reports/all-pending-evidence-20261021/A11'
const oldTree = '/private/tmp/pmtool-all-closure-20261021'
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
const read = (relative) => fs.readFileSync(path.resolve(root, relative))
const json = (relative) => JSON.parse(read(relative))
const files = (directory) => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory()
    ? files(path.join(directory, entry.name))
    : entry.isFile() ? [path.join(directory, entry.name)] : [])
  .sort()
const candidate = json(`${evidence}/candidate.json`)
const sync = json(`${evidence}/build/sync.json`)
const artifacts = json(`${evidence}/build/artifacts.json`)
const finderFiles = files(path.join(root, evidence, 'finder'))
const contracts = [
  'AGENTS.md',
  'docs/collaboration.md',
  'docs/testing/a10-finder-reopen-gui-independent-review-20261021.md',
  'docs/testing/a11-chevron-independent-retest-20261021.md',
  'docs/plans/2026-10-21-launcher-chevron-closure.md',
  'reports/all-pending-acceptance-execution-20261021.md',
  `${evidence}/candidate.json`,
  `${evidence}/product-tracked.patch`,
  `${evidence}/environment.json`,
  'docs/testing/a11-chevron-independent-retest-20261021-selftmp/r3/candidate.json',
  'docs/testing/a11-chevron-independent-retest-20261021-selftmp/r3/a10-to-a11.diff',
  'docs/testing/a11-chevron-independent-retest-20261021-selftmp/r3-final-check.json',
]
const proofFiles = files(path.join(root, evidence, 'build'))
  .concat(files(path.join(root, evidence, 'regression')))
const inputs = [...new Set([
  ...contracts.map((file) => path.join(root, file)),
  ...finderFiles,
  ...proofFiles,
  ...Object.keys(candidate.sourceHashes).map((file) => path.join(oldTree, file)),
  ...Object.keys(candidate.artifacts).map((file) => path.join(oldTree, file)),
])].sort()
function inventory() {
  return Object.fromEntries(inputs.map((file) => {
    const bytes = fs.readFileSync(file)
    return [file, { bytes: bytes.length, sha256: sha(bytes) }]
  }))
}
function write(suffix, value) {
  fs.writeFileSync(`${prefix}-${suffix}.json`, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const mode = process.argv[2] ?? 'freeze'
if (mode === 'freeze') {
  write('inputs', { at: new Date().toISOString(), files: inventory(),
    boundary: 'Archived originals and declared A11 old-tree production source/lib only; no runtime private, HTTP body, GUI or service access.' })
  console.log(JSON.stringify({ mode, inputFiles: inputs.length, finderFiles: finderFiles.length }))
} else if (mode === 'review') {
  const checks = []
  const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail })
  function matchEntries(expected, tree) {
    const mismatches = []
    for (const [file, expectedSha] of Object.entries(expected)) {
      const actual = sha(fs.readFileSync(path.join(tree, file)))
      if (actual !== expectedSha) mismatches.push({ file, expectedSha, actual })
    }
    return { count: Object.keys(expected).length, mismatches }
  }
  const source = matchEntries(candidate.sourceHashes, oldTree)
  const built = matchEntries(candidate.artifacts, oldTree)
  check('A11 declared source in old tree', source.mismatches.length === 0, source)
  check('A11 declared artifacts in old tree', built.mismatches.length === 0, built)
  const canonical = (value) => JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
  check('candidate versus sync source manifest', canonical(candidate.sourceHashes) === canonical(sync.sourceHashes), sync.copied)
  check('candidate versus artifact manifest', canonical(candidate.artifacts) === canonical(artifacts), Object.keys(artifacts).length)
  check('A11 tracked patch', sha(read(`${evidence}/product-tracked.patch`)) === candidate.trackedPatchSha, candidate.trackedPatchSha)
  const controlSource = fs.readFileSync(path.join(oldTree, 'launcher/src/control-html.mjs'), 'utf8')
  const css = '.browser-select>svg{width:18px;height:18px;flex:0 0 18px;color:var(--muted)}'
  const sourceReport = json('docs/testing/a11-chevron-independent-retest-20261021-selftmp/r3/candidate.json')
  check('local CSS present exactly once', controlSource.split(css).length === 2, css)
  check('GUI candidate matches independent SOURCE template', candidate.sourceHashes['launcher/src/control-html.mjs'] === '6994cdd109d7258f14b0283a8e2f0b1d55e6cacc34b80ed5d39736c6dd90a205',
    { gui: candidate.sourceHashes['launcher/src/control-html.mjs'], sourceCandidateSha: sha(Buffer.from(JSON.stringify(sourceReport))) })
  const boundary = json(`${evidence}/finder/control/boundary.json`)
  const states = []
  for (const width of [1440, 390]) for (const theme of ['light', 'dark']) {
    const triplet = ['closed', 'menu', 'esc'].map((state) =>
      json(`${evidence}/finder/control/${width}-${theme}-${state}.json`))
    const result = {
      width, theme, times: triplet.map((state) => state.at),
      svg: triplet.map((state) => state.svg),
      scroll: triplet.map((state) => [state.scroll, state.client]),
      options: triplet.map((state) => state.buttons.filter((button) => button.role === 'option').map((button) => button.text)),
      expanded: triplet.map((state) => state.buttons.find((button) => button.id === 'browser-toggle')?.expanded),
      escFocus: triplet[2].focus,
      origins: triplet.map((state) => state.origin),
      timeOrigins: triplet.map((state) => state.timeOrigin),
    }
    states.push(result)
    check(`${width}/${theme} chooser18 and no outer horizontal overflow`, triplet.every((state) =>
      state.width === width && state.height === 900 && state.dark === theme &&
      state.svg.width === 18 && state.svg.height === 18 && state.scroll === state.client), result)
    check(`${width}/${theme} menu three options and ESC focus return`,
      JSON.stringify(result.expanded) === JSON.stringify(['false', 'true', 'false']) &&
      JSON.stringify(result.options.map((options) => options.length)) === '[0,3,0]' &&
      triplet[2].focus.id === 'browser-toggle' && triplet[2].focus.outline === 'solid', result.escFocus)
    check(`${width}/${theme} boundary duplicate agrees`, triplet.every((state) =>
      boundary.states.some((original) => JSON.stringify(state) === JSON.stringify(original))), null)
  }
  const selection = json(`${evidence}/finder/control/selected-chrome.json`)
  const openSnapshot = json(`${evidence}/finder/control/open-delivered.json`)
  check('selected Chrome chooser remains18 and closes menu', selection.svg.width === 18 && selection.svg.height === 18 &&
    selection.buttons.some((button) => button.id === 'browser-toggle' && button.text === 'C\nChrome' && button.expanded === 'false'), selection.focus)
  check('early open snapshot is still S0, not delivery proof', openSnapshot.text.includes('工作台尚未启动'), openSnapshot.at)
  const frames = []
  for (const group of ['control', 'reopen']) {
    const index = json(`${evidence}/finder/${group}/frames/frames.json`)
    for (const frame of index.frames) {
      const file = `${evidence}/finder/${group}/frames/${frame.file}`
      const actual = sha(read(file))
      frames.push({ group, file, metadata: frame.metadata, at: frame.at, sha256: actual, matches: actual === frame.sha256 })
    }
  }
  check('18 compositor frames match original SHA', frames.length === 18 && frames.every((frame) => frame.matches), frames.length)
  const passive = read(`${evidence}/finder/reopen/passive.ndjson`).toString().trim().split('\n').map((line) => JSON.parse(line))
  const deliveries = ['N1', 'N2'].map((alias) => {
    const start = passive.find((event) => event.event === 'open-start' && event.argv.some((arg) => arg.endsWith(`50722.${alias}`)))
    const exit = passive.find((event) => event.event === 'open-exit' && event.pid === start?.pid)
    const request = passive.filter((event) => event.event === 'entered-request' && event.alias === alias)
    const response = passive.filter((event) => event.event === 'entered-response' && event.alias === alias)
    return { alias, start, exit, request, response,
      openStartTo200ms: start && response[0] ? Date.parse(response[0].at) - Date.parse(start.at) : null }
  })
  for (const delivery of deliveries) check(`${delivery.alias} Google Chrome exit0 and alias200`, delivery.start?.argv[2] === 'Google Chrome' &&
    delivery.exit?.code === 0 && delivery.request.length === 1 && delivery.request[0].origin === 'http://127.0.0.1:3228' &&
    delivery.request[0].controlPort === 50722 && delivery.response.length === 1 &&
    delivery.response[0].status === 200 && delivery.response[0].controlPort === 50722, delivery)
  check('N2 delivery clean origin, no query token', deliveries[1].start?.argv[3] === 'http://127.0.0.1:3228/#pm-launch=50722.N2', null)
  const before = json(`${evidence}/finder/reopen/s4-before.json`)
  const namedS3 = json(`${evidence}/finder/reopen/s3-reopen.json`)
  const after = json(`${evidence}/finder/reopen/s4-after.json`)
  check('before and after display same-control S4', [before, after].every((state) =>
    state.origin === 'http://127.0.0.1:50722' && state.text.includes('工作台已打开') && state.text.includes('（Chrome）')), { before, after })
  check('misnamed S3 preserved as pre-delivery S4, not actual S3', namedS3.text.includes('工作台已打开') &&
    Date.parse(namedS3.at) < Date.parse(deliveries[1].start.at), namedS3)
  check('control document timeOrigin preserved', boundary.states.every((state) =>
    state.timeOrigin === after.timeOrigin && state.origin === after.origin), after.timeOrigin)
  const body = json(`${evidence}/finder/reopen/control-body-sha.json`)
  check('archived actual-body limited metadata only', body.status === 200 && body.bytes === 19012 &&
    body.localCSS === true && /^[a-f0-9]{64}$/.test(body.sha) &&
    Object.keys(body).every((key) => ['at', 'status', 'bytes', 'sha', 'localCSS', 'boundary'].includes(key)), body)
  const app = json(`${evidence}/finder/app.json`)
  const onlySha = json(`${evidence}/finder/environment-only-sha.json`)
  check('app production launcher matches A11 source', app.paths[path.join(oldTree, 'launcher/bin/pm-launcher.mjs')] ===
    candidate.sourceHashes['launcher/bin/pm-launcher.mjs'], null)
  check('app/onlySHA wrapper declarations agree, not source-body review', Object.entries(onlySha)
    .filter(([file]) => file.endsWith('entry-20261021.mjs') || file.endsWith('passive-20261021.mjs'))
    .every(([file, hash]) => app.paths[file] === hash), onlySha)
  const observations = { at: new Date().toISOString(), checks, states, frames, deliveries,
    nonAliasEvents: passive.filter((event) => event.event.startsWith('entered-') && !event.alias),
    counts: { checks: checks.length, passed: checks.filter((item) => item.ok).length,
      png: finderFiles.filter((file) => file.endsWith('.png')).length, jpg: frames.length },
    limitations: ['No browser action packet/video for Finder or personal PM target.', 'No HTTP method/body/full loaded bytes archived for personal PM.', 'body SHA cannot be independently regenerated without prohibited nonce body; localCSS is an archived boolean probe.',
      'S3-named snapshot is actually pre-delivery S4.', 'No same-mounted PM hash-only GUI branch.', 'Wrapper bodies exist only as hash declarations in reviewed evidence.'],
    boundary: 'Consistency checks only; GUI visual judgment is separately recorded in the expert report.' }
  write('observations', observations)
  console.log(JSON.stringify(observations.counts))
  process.exitCode = checks.some((item) => !item.ok) ? 1 : 0
} else if (mode === 'final') {
  const before = JSON.parse(fs.readFileSync(`${prefix}-inputs.json`))
  const after = inventory()
  const differences = [...new Set([...Object.keys(before.files), ...Object.keys(after)])]
    .filter((file) => JSON.stringify(before.files[file]) !== JSON.stringify(after[file]))
    .map((file) => ({ file, before: before.files[file], after: after[file] }))
  const artifactsNow = files(path.join(root, evidence, 'finder'))
  const addedFinderFiles = artifactsNow.filter((file) => !finderFiles.includes(file) || !before.files[file])
  const removedFinderFiles = Object.keys(before.files).filter((file) =>
    file.startsWith(path.join(root, evidence, 'finder') + path.sep) && !artifactsNow.includes(file))
  const result = { at: new Date().toISOString(), checked: Object.keys(after).length, differences,
    addedFinderFiles, removedFinderFiles,
    status: differences.length || addedFinderFiles.length || removedFinderFiles.length ? 'DRIFT_REQUIRES_REVIEW' : 'FROZEN_INPUTS_UNCHANGED',
    auditSha256: sha(fs.readFileSync(fileURLToPath(import.meta.url))),
    boundary: 'No new GUI run, build, request, nonce access, runtime-private read, service or Git operation.' }
  write('final-check', result)
  console.log(JSON.stringify({ checked: result.checked, differences: differences.length,
    addedFinderFiles: addedFinderFiles.length, removedFinderFiles: removedFinderFiles.length, status: result.status }))
  process.exitCode = result.status === 'FROZEN_INPUTS_UNCHANGED' ? 0 : 1
} else throw new Error(`Unknown audit mode: ${mode}`)

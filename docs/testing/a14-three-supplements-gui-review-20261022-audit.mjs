import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a14-three-supplements-gui-review-20261022')
const evidence = join(repo, 'reports/all-pending-evidence-20261021')
const a13 = join(evidence, 'A13'), a14 = join(evidence, 'A14')
const fresh = join(a14, 'fresh-file-supplement'), imports = join(a14, 'import-supplement')
const visible = join(a14, 'final/clean/visible-supplement')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const info = p => {
  const s = lstatSync(p)
  if (!s.isFile()) throw Error(`Not a regular file: ${p}`)
  const b = readFileSync(p)
  return { bytes: b.length, sha256: sha(b), mtimeMs: s.mtimeMs }
}
const scan = (p, rel = '') => Object.fromEntries(readdirSync(join(p, rel)).sort().flatMap(n => {
  const r = rel ? `${rel}/${n}` : n, s = lstatSync(join(p, r))
  return s.isDirectory() ? Object.entries(scan(p, r)) : [[join(p, r), info(join(p, r))]]
}))
const diff = (a, b) => ({
  added: Object.keys(b).filter(k => !(k in a)).sort(),
  removed: Object.keys(a).filter(k => !(k in b)).sort(),
  changed: Object.keys(a).filter(k => k in b && !isDeepStrictEqual(a[k], b[k])).sort(),
})
const rootsDiff = (a, b) => Object.fromEntries(['data', 'files', 'backups'].map(n => [n, diff(a[n], b[n])]))
const verified = (tree, hashes) => {
  const records = Object.fromEntries(Object.entries(hashes).map(([n, expected]) => {
    const p = join(tree, n), actual = existsSync(p) ? info(p) : null
    return [p, { expected, actual, match: actual?.sha256 === expected }]
  }))
  return { count: Object.keys(records).length, records, mismatches: Object.keys(records).filter(p => !records[p].match) }
}
const supplementRoots = [fresh, imports, visible]
const originalRoots = [
  join(a13, 'final/main/fresh-files'), join(a13, 'final/materials/native-import'),
  join(a13, 'final/materials/loaded'), join(a13, 'build-final'), join(a13, 'full-verify'),
  join(a14, 'build'), join(a14, 'full-verify'), join(a14, 'final/loaded'),
  join(a14, 'final/clean'), join(a14, 'final/mixed'), join(a14, 'final/mixed-r2'),
]
const oldPrefixes = ['a14-fresh-file-gui-review-20261022', 'a13-native-import-gui-review-20261022',
  'a14-sm01-clean-mixed-gui-review-20261022']
const testing = join(repo, 'docs/testing')
const protectedDocs = readdirSync(testing).filter(n => oldPrefixes.some(p => n.startsWith(p)))
  .map(n => join(testing, n)).filter(p => lstatSync(p).isFile())
protectedDocs.push(...['AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-journey-cases-20261021.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/a14-preconfirm-conflict-contract-20261022.md'].map(p => join(repo, p)))
const executionPaths = [
  '/private/tmp/pmtool-a14-fresh-loaded-supplement-20261022.mjs',
  '/private/tmp/pmtool-a14-fresh-download-supplement-20261022.mjs',
  '/private/tmp/pmtool-a14-download-headers-20261022.mjs',
  '/private/tmp/pmtool-a14-import-observer-20261022.mjs',
  '/private/tmp/pmtool-a14-import-supplement-20261022.mjs',
  '/private/tmp/pmtool-a14-import-bad-header-20261022.mjs',
]
const captureInputs = () => Object.assign({}, ...[...supplementRoots, ...originalRoots].map(p => scan(p)),
  Object.fromEntries([...protectedDocs, ...executionPaths,
    join(a13, 'candidate-final.json'), join(a13, 'product-tracked.patch'), join(a13, 'environment-final.json'),
    join(a14, 'candidate.json'), join(a14, 'product-tracked.patch'), join(a14, 'final/environment.json'),
    join(a14, 'final/host-start-r2.json')].map(p => [p, info(p)])))

if (process.argv[2] === 'seal') {
  const prior = json(`${prefix}-audit-r2.json`)
  const current = captureInputs()
  for (const p of Object.keys(prior.inputs)) if (!(p in current) && existsSync(p)) current[p] = info(p)
  const inputChanges = diff(prior.inputs, current)
  const candidateChanges = Object.fromEntries(Object.entries(prior.candidates).map(([label, v]) => [label,
    Object.fromEntries(['source', 'artifacts'].map(k => [k, Object.entries(v[k].records).filter(([p, x]) =>
      !existsSync(p) || !isDeepStrictEqual(info(p), x.actual)).map(([p]) => p)]))]))
  const result = { at: new Date().toISOString(), inputChanges, candidateChanges,
    documents: Object.fromEntries(['.md', '-plan.md', '-audit.mjs', '-audit-r1.json', '-audit-r2.json'].map(s => [s, info(prefix + s)])),
    boundary: 'Only listed inputs and candidate files; no live services, credentials or whole-disk claim.' }
  writeFileSync(`${prefix}-seal-${process.argv[3] || 'r1'}.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify(result, null, 2))
  if (Object.values(inputChanges).some(v => v.length) ||
    Object.values(candidateChanges).some(v => Object.values(v).some(a => a.length))) process.exitCode = 1
} else {
  const inputs = captureInputs()
  const candidates = Object.fromEntries([['A13', a13, 'candidate-final.json'], ['A14', a14, 'candidate.json']]
    .map(([label, root, name]) => {
      const c = json(join(root, name))
      return [label, { baseline: c.baseline, hostGitHead: c.hostGitHead, tree: c.tree,
        manifest: info(join(root, name)), patch: info(join(root, 'product-tracked.patch')),
        expectedPatch: c.trackedPatchSha, source: verified(c.tree, c.sourceHashes), artifacts: verified(c.tree, c.artifacts) }]
    }))
  const loader = (root, label) => {
    const loaded = json(join(root, 'result.json')), row = loaded.events[0]
    const client = readFileSync(join(candidates[label].tree, 'packages/dsh-pm-tool/lib/client.js'))
    const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
      .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
    const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
    const combo = readFileSync(join(root, row.file)), first = combo.indexOf(segment)
    const second = first < 0 ? -1 : combo.indexOf(segment, first + 1)
    return { loaded, client: { bytes: client.length, sha256: sha(client) },
      combo: info(join(root, row.file)), segment: { bytes: segment.length, sha256: sha(segment), first, second },
      valid: first >= 0 && second === -1 && sha(segment) === row.matches[0].segmentSha &&
        sha(client) === row.matches[0].sourceSha && sha(combo) === row.responseSha && combo.length === row.bytes &&
        row.status === 200 && row.fromDiskCache === false }
  }
  const loaders = {
    freshA13: loader(join(fresh, 'loaded'), 'A13'),
    materialsA13: loader(join(a13, 'final/materials/loaded'), 'A13'),
    cleanA14: loader(join(a14, 'final/loaded'), 'A14'),
  }
  const download = json(join(fresh, 'download/result.json')), headers = json(join(fresh, 'headers/result.json'))
  const anonymousBytes = readFileSync(join(fresh, 'download/anonymous-body.txt'))
  const anonymous = { ...info(join(fresh, 'download/anonymous-body.txt')), body: JSON.parse(anonymousBytes) }
  const downloadFiles = Object.fromEntries([
    '/private/tmp/pmtool-a11-native-files/QA 文件 原件.md',
    '/private/tmp/pmtool-a11-native-files/QA 文件 同字节.md',
    join(a13, 'final/main/fresh-files/finish/QA 文件 原件.md'),
    join(fresh, 'download', download.download.file), join(fresh, 'headers', headers.download.file),
  ].map(p => [p, info(p)]))
  const reopen = ['reopened-after-reload', 'after-unmount-reentry'].map(n =>
    json(join(fresh, 'download', `${n}.json`)))
  const headerRows = json(join(fresh, 'headers/responses.json'))
  const headerMap = Object.fromEntries(headerRows[0].headers.map(h => [h.name.toLowerCase(), h.value]))
  const dispositionName = decodeURIComponent(headerMap['content-disposition'].split("UTF-8''")[1])
  const freshChanges = {
    duringDownloadUnmount: rootsDiff(download.before, download.after),
    oldFinishToReloadedBefore: rootsDiff(json(join(a13, 'final/main/fresh-files/finish/result.json')).roots, download.before),
  }
  const names = ['csv-trace', 'xlsx-trace', 'csv-invalid-trace', 'xlsx-invalid-trace', 'csv-header', 'xlsx-header']
  const fixturePaths = [
    '/private/tmp/pmtool-a11-native-import/QA 原生导入.csv',
    '/private/tmp/pmtool-a11-native-import/QA 原生导入.xlsx',
    '/private/tmp/pmtool-a11-native-import/QA 非法日期.csv',
    '/private/tmp/pmtool-a11-native-import/QA 非法日期.xlsx',
    '/private/tmp/pmtool-a14-native-import/QA 缺标题列.csv',
    '/private/tmp/pmtool-a14-native-import/QA 缺标题列.xlsx',
  ]
  const require = createRequire(join(candidates.A13.tree, 'packages/dsh-pm-tool/package.json'))
  const XLSX = require('xlsx')
  const xlsxModule = info(require.resolve('xlsx'))
  const grids = fixturePaths.map(p => {
    const csv = p.endsWith('.csv')
    const book = XLSX.read(readFileSync(p, csv ? 'utf8' : undefined), { type: csv ? 'string' : 'buffer', raw: true })
    return XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1, raw: true, defval: '' })
  })
  const commands = readFileSync(join(imports, 'observer/commands.ndjson'), 'utf8').trim().split('\n').map(JSON.parse)
  const importCases = names.map((name, i) => {
    const before = json(join(imports, name, 'before-roots.json')), after = json(join(imports, name, 'after-roots.json'))
    const state = json(join(imports, name, 'current.json')), run = commands[i * 2], done = commands[i * 2 + 1]
    const args = run.event.data.args
    const match = /^ task import-content p-0001 ("(?:\\.|[^"\\])*") ("(?:\\.|[^"\\])*")$/.exec(args)
    if (!match) throw Error(`Unexpected original command shape: ${name}`)
    const fileName = JSON.parse(match[1]), content = JSON.parse(match[2]), path = fixturePaths[i]
    const submitted = path.endsWith('.xlsx') ? Buffer.from(content, 'base64') : Buffer.from(content)
    const original = readFileSync(path), expected = path.endsWith('.xlsx') ? original : Buffer.from(original.toString().trim())
    const ax = Object.fromEntries(['path-action.txt', 'path.txt', 'selected.txt', 'sheet-before.txt']
      .map(n => [n, readFileSync(join(imports, name, 'chooser', n), 'utf8')]))
    return { name, state: { at: state.at, origin: state.origin, timeOrigin: state.timeOrigin,
      viewport: state.viewport, dark: state.dark, text: state.pm.text, alerts: state.alerts,
      importButtons: state.buttons.filter(b => ['确认落盘', '取消'].includes(b.text)) },
      run: { at: run.at, seq: run.event.seq, commandId: run.event.data.commandId,
        fileName, submittedBytes: submitted.length, submittedSha256: sha(submitted), noConfirm: !!match },
      done, paired: run.event.data.commandId === done.event.data.commandId,
      fixture: { path, ...info(path), grid: grids[i] },
      payloadMatches: submitted.equals(expected), submittedEqualsUntrimmed: submitted.equals(original),
      axPathExact: ax['path-action.txt'].includes(`set 0 value ${path}`),
      axSelectedName: ax['selected.txt'].includes(fileName),
      changes: rootsDiff(before, after), beforeCounts: Object.fromEntries(Object.entries(before).map(([k, v]) => [k, Object.keys(v).length])) }
  })
  const observer = { ready: json(join(imports, 'observer/ready.json')), end: json(join(imports, 'observer/end.json')),
    commandCount: commands.length, consoleFileExists: existsSync(join(imports, 'observer/console.ndjson')) }
  observer.changes = rootsDiff(observer.ready.roots, observer.end.roots)
  const fixture = json(join(imports, 'header-fixture.json'))
  const headerGridValid = [4, 5].every((index, i) =>
    isDeepStrictEqual(grids[index].slice(1), grids[i].slice(1)) &&
    grids[index][0][1] === '未知字段' && grids[i][0][1] === '标题' &&
    isDeepStrictEqual(grids[index][0].filter((_, j) => j !== 1), grids[i][0].filter((_, j) => j !== 1)))
  const frameAudit = root => {
    const manifest = json(join(root, 'frames/frames.json'))
    const rows = manifest.frames.map(v => ({ ...v, actual: info(join(root, 'frames', v.file)) }))
    return { count: rows.length, rows, mismatches: rows.filter(v => v.sha256 !== v.actual.sha256) }
  }
  const frames = { import: frameAudit(join(imports, 'observer')), cleanVisible: frameAudit(visible) }
  const cleanResult = json(join(visible, 'result.json')), cleanState = json(join(visible, 'clean-message-visible.json'))
  const originalClean = json(join(a14, 'final/clean/supplement/result.json'))
  const cleanEvents = json(join(a14, 'final/clean/command-events.json'))
  const originalDone = cleanEvents.find(v => v.event.seq === 48)
  const clean = { result: cleanResult, state: { at: cleanState.at, origin: cleanState.origin, timeOrigin: cleanState.timeOrigin,
    viewport: cleanState.viewport, dark: cleanState.dark, text: cleanState.pm.text },
    originalDone, changes: diff(cleanResult.before, cleanResult.after),
    originalEndToVisible: diff(originalClean.roots, cleanResult.before),
    bboxInside: cleanResult.box.x >= 0 && cleanResult.box.y >= 0 &&
      cleanResult.box.x + cleanResult.box.width <= cleanState.viewport.width &&
      cleanResult.box.y + cleanResult.box.height <= cleanState.viewport.height,
    originalMessagePresent: cleanState.pm.text.includes(originalDone.event.data.text) }
  const exits = Object.fromEntries([
    ['fresh-save', join(a13, 'final/main/fresh-files/save/exit.json')],
    ['fresh-finish', join(a13, 'final/main/fresh-files/finish/result.json')],
    ['csv-confirm', join(a13, 'final/materials/native-import/csv-confirm/exit.json')],
    ['xlsx-confirm', join(a13, 'final/materials/native-import/xlsx-confirm/exit.json')],
    ['mixed-first', join(a14, 'final/mixed/exit.json')],
    ['mixed-r2', join(a14, 'final/mixed-r2/exit.json')],
    ['clean-original', join(a14, 'final/clean/exit.json')],
  ].map(([label, p]) => {
    const j = json(p)
    return [label, { file: p, ...info(p), exit: j.exit ?? j.code, error: j.error, at: j.at }]
  }))
  const buildOriginal = Object.fromEntries([['A13', a13, 'build-final'], ['A14', a14, 'build']].map(([label, root, dir]) =>
    [label, { build: Object.fromEntries(['build', 'noemit', 'coverage'].map(n => [n, json(join(root, dir, `${n}.exit.json`))])),
      verify: json(join(root, 'full-verify/summary.json')),
      guardRows: [...readFileSync(join(root, 'full-verify/guard.stdout.txt'), 'utf8')
        .matchAll(/\[guard\]\s+ok\s+(scripts\/verify-[\w-]+\.mjs) \(退出码=(\d+)/g)]
        .map(m => ({ script: m[1], exit: Number(m[2]) })) }]))
  const assertions = {
    sourceArtifacts: Object.values(candidates).every(c => !c.source.mismatches.length && !c.artifacts.mismatches.length),
    patches: Object.values(candidates).every(c => c.patch.sha256 === c.expectedPatch),
    loaders: Object.values(loaders).every(v => v.valid),
    freshSameNewPage: reopen.every(s => s.origin === loaders.freshA13.loaded.state.origin &&
      s.timeOrigin === loaders.freshA13.loaded.state.timeOrigin && s.pm.text.includes('文件 fa-0001')),
    downloadHashes: Object.values(downloadFiles).every(v => v.bytes === 22 && v.sha256 === download.download.sha256),
    authenticatedHeaders: isDeepStrictEqual(headers.rows, headerRows) && headerRows[0].status === 200 &&
      headerMap['content-type'] === 'text/markdown' && headerMap['content-length'] === '22' &&
      headerMap['cache-control'] === 'no-store' && headerMap['x-content-type-options'] === 'nosniff' &&
      dispositionName === download.download.file,
    anonymousDenied: download.anonymous.status === 401 && anonymous.bytes === 73 &&
      anonymous.body.error.code === 'unauthorized' && anonymous.sha256 !== download.download.sha256,
    freshNoBusinessFilesWrite: Object.values(freshChanges).every(d =>
      !d.files.added.length && !d.files.removed.length && !d.files.changed.length &&
      !d.backups.added.length && !d.backups.removed.length && !d.backups.changed.length &&
      !d.data.added.length && !d.data.removed.length &&
      d.data.changed.every(p => p.includes('session_projcache/sessions/'))),
    sixNewPreviewPairs: commands.length === 12 && importCases.every(c => c.paired && c.payloadMatches &&
      c.run.noConfirm && c.axPathExact && c.axSelectedName),
    importSamePage: importCases.every(c => c.state.origin === 'http://127.0.0.1:3242' &&
      c.state.timeOrigin === loaders.materialsA13.loaded.state.timeOrigin),
    importZeroWrites: importCases.every(c => Object.values(c.changes).every(d => !d.added.length && !d.removed.length) &&
      !c.changes.files.changed.length && !c.changes.backups.changed.length &&
      c.changes.data.changed.every(p => p.includes('session_projcache/sessions/'))),
    headerFixture: headerGridValid && fixture.rows.every((v, i) =>
      v.bytes === importCases[i + 4].fixture.bytes && v.sha256 === importCases[i + 4].fixture.sha256),
    cleanSamePage: cleanState.origin === loaders.cleanA14.loaded.state.origin &&
      cleanState.timeOrigin === loaders.cleanA14.loaded.state.timeOrigin,
    cleanMessageGeometry: clean.bboxInside && clean.originalMessagePresent &&
      originalDone.event.data.kind === 'success',
    cleanOnlyRead: Object.values(clean.changes).every(v => !v.length),
    frames: Object.values(frames).every(v => !v.mismatches.length),
  }
  const result = { at: new Date().toISOString(),
    environment: { os: process.platform, arch: process.arch, node: process.version, cwd: process.cwd() },
    boundary: 'Read-only archive/candidate/fixture audit; XLSX library parses bytes only. No product modules, tests/build/GUI/network/services/credentials/git mutation.',
    inputs, candidates, loaders, fresh: { download, headers, anonymous, downloadFiles, reopen,
      headerMap, dispositionName, changes: freshChanges },
    import: { observer, cases: importCases, fixture, headerGridValid, xlsxModule },
    frames, clean, originalExits: exits, buildOriginal, assertions,
    failedAssertions: Object.keys(assertions).filter(k => !assertions[k]),
    protectedDrift: diff(inputs, captureInputs()) }
  const fixtureRecords = Object.fromEntries([...fixturePaths, ...Object.keys(downloadFiles)]
    .map(p => [p, info(p)]))
  Object.assign(result.inputs, fixtureRecords, { [require.resolve('xlsx')]: xlsxModule })
  // The seal re-reads these explicit fixture/library paths without scanning any runtime root.
  writeFileSync(`${prefix}-audit-${process.argv[2] || 'r1'}.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify({ inputCount: Object.keys(result.inputs).length,
    candidates: Object.fromEntries(Object.entries(candidates).map(([k, c]) => [k, {
      sources: c.source.count, sourceDrift: c.source.mismatches, artifacts: c.artifacts.count, artifactDrift: c.artifacts.mismatches }])),
    failedAssertions: result.failedAssertions, protectedDrift: result.protectedDrift,
    frames: Object.fromEntries(Object.entries(frames).map(([k, v]) => [k, v.count])),
    freshChanges, importChanges: importCases.map(c => ({ name: c.name, changes: c.changes, payloadMatches: c.payloadMatches })),
    observer, cleanChanges: clean.changes, oldCleanToVisible: clean.originalEndToVisible,
    originalExits: exits }, null, 2))
  if (result.failedAssertions.length || Object.values(result.protectedDrift).some(v => v.length)) process.exitCode = 1
}

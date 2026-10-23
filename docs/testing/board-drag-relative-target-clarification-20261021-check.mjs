import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, copyFileSync, symlinkSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/board-drag-relative-target-clarification-20261021'
const dependencies = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const pkg = 'packages/dsh-pm-tool'
const editor = `${pkg}/src/client/board/editor.tsx`
const fixture = 'docs/testing/board-fixture-clarification-20261021-fixture.json'
const sourceFiles = ['editor.tsx', 'editor-ops.ts', 'history.ts', 'projection.ts', 'persist.ts', 'types.ts']
  .map(name => `${pkg}/src/client/board/${name}`)
const references = [
  fixture, 'docs/testing/board-fixture-clarification-20261021.md',
  'docs/testing/board-fullwidth-drag-diagnosis-20261021.md',
  'docs/testing/board-fullwidth-independent-retest-20261021.md',
  'docs/testing/board-fullwidth-independent-retest-20261021-result.json',
  'docs/testing/independent-acceptance-batch1-closure-plan-20261021.md',
  'reports/all-pending-evidence-20261021/A6/board/initial-relative.json',
]
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
const fingerprints = files => Object.fromEntries(files.map(path => {
  const bytes = readFileSync(join(root, path))
  return [path, { sha256: sha(bytes), bytes: bytes.length }]
}))
const require = createRequire(join(dependencies, '../package.json'))
const dependencyFiles = ['react', 'react-test-renderer', 'react-grid-layout', 'vitest', 'zod']
  .map(name => require.resolve(`${name}/package.json`))
dependencyFiles.push(...['ReactGridLayout.js', 'utils.js', 'GridItem.js', 'calculateUtils.js']
  .map(name => join(dependencies, 'react-grid-layout/build', name)))
const dependencyHashes = () => Object.fromEntries(dependencyFiles.map(path => [path, sha(readFileSync(path))]))

if (process.argv[2] === '--freeze') {
  assert(!existsSync(join(root, `${prefix}-freeze.json`)), 'Do not replace an existing freeze')
  const before = fingerprints([...sourceFiles, ...references])
  const retest = json(join(root, 'docs/testing/board-fullwidth-independent-retest-20261021-result.json'))
  assert.equal(before[editor].sha256, retest.sourceSha256)
  const initial = json(join(root, references.at(-1)))
  const layout = json(join(root, fixture))
  assert.deepEqual(initial.cards.map(card => card.id), layout.widgets.map(widget => widget.i))
  for (const card of initial.cards) {
    const widget = layout.widgets.find(widget => widget.i === card.id)
    assert.equal((card.bbox.top - initial.grid.top - 12) / 48, widget.layout.y)
    assert.equal(card.bbox.height, widget.layout.h * 48 - 12)
  }
  const tmp = mkdtempSync('/private/tmp/pmtool-board-relative-target-20261021-')
  for (const path of [...sourceFiles, fixture]) {
    const target = join(tmp, path)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(join(root, path), target)
    assert.equal(sha(readFileSync(target)), before[path].sha256)
  }
  symlinkSync(dependencies, join(tmp, pkg, 'node_modules'))
  assert.deepEqual(fingerprints([...sourceFiles, ...references]), before)
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
  assert.equal(head.status, 0)
  save(join(root, `${prefix}-freeze.json`), {
    at: new Date().toISOString(), baseline: head.stdout.trim(), tmp, dependencies,
    fingerprints: before, dependencyHashes: dependencyHashes(),
    environment: { platform: process.platform, arch: process.arch, node: process.version, executable: process.execPath },
    scope: 'Original action feasibility only; real component callbacks, not pointer GUI or a new acceptance gate',
  })
  console.log(JSON.stringify({ tmp, sourceSha256: before[editor].sha256, initialRelativeSha256: before[references.at(-1)].sha256 }, null, 2))
} else if (process.argv[2] === '--run') {
  const frozen = json(join(root, `${prefix}-freeze.json`))
  const label = process.argv[3] ?? 'run'
  assert(/^[a-z0-9-]+$/.test(label))
  const logPath = join(frozen.tmp, `${label}.txt`)
  assert(!existsSync(logPath), 'Preserve previous execution output')
  const args = [join(dependencies, 'vitest/vitest.mjs'), 'run', '--config', join(frozen.tmp, 'vitest.config.mjs'), '--reporter', 'verbose']
  const start = new Date().toISOString()
  const result = spawnSync(process.execPath, args, {
    cwd: join(frozen.tmp, pkg), encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  })
  const output = (result.stdout ?? '') + (result.stderr ?? '')
  writeFileSync(logPath, output)
  const copies = Object.fromEntries([...sourceFiles, fixture].map(path => [path, sha(readFileSync(join(frozen.tmp, path)))]))
  const changed = Object.keys(frozen.fingerprints).filter(path => fingerprints([path])[path].sha256 !== frozen.fingerprints[path].sha256)
  const dependencyDrift = JSON.stringify(dependencyHashes()) !== JSON.stringify(frozen.dependencyHashes)
  for (const [path, hash] of Object.entries(copies)) assert.equal(hash, frozen.fingerprints[path].sha256)
  const record = {
    at: new Date().toISOString(), startedAt: start, executable: process.execPath, args,
    cwd: join(frozen.tmp, pkg), exit: result.status, signal: result.signal, error: result.error?.message ?? null,
    outputPath: logPath, outputSha256: sha(output), sourceSha256: frozen.fingerprints[editor].sha256,
    testSha256: sha(readFileSync(join(frozen.tmp, pkg, 'src/client/board/relative-target.test.tsx'))),
    configSha256: sha(readFileSync(join(frozen.tmp, 'vitest.config.mjs'))),
    changed, dependencyDrift, copies,
    observations: existsSync(join(frozen.tmp, 'observations.json')) ? json(join(frozen.tmp, 'observations.json')) : null,
    boundary: 'Observed production component/RGL method outcomes; no native input, browser bbox, service, persistence or GUI verdict',
  }
  save(join(frozen.tmp, `${label}-exit.json`), record)
  save(join(root, `${prefix}-result.json`), record)
  console.log(output)
  console.log(JSON.stringify({ exit: result.status, changed, dependencyDrift, observationKeys: Object.keys(record.observations ?? {}) }, null, 2))
  process.exitCode = result.status !== 0 || changed.length || dependencyDrift ? 1 : 0
} else if (process.argv[2] === '--archive') {
  const frozen = json(join(root, `${prefix}-freeze.json`))
  const evidence = join(root, `${prefix}-evidence`)
  assert(!existsSync(evidence), 'Do not replace archived evidence')
  const files = [
    ...sourceFiles, fixture, `${pkg}/src/client/board/relative-target.test.tsx`,
    'vitest.config.mjs', 'observations.json', 'r1.txt', 'r1-exit.json', 'r2.txt', 'r2-exit.json',
  ]
  const records = {}
  for (const path of files) {
    const target = join(evidence, path)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(join(frozen.tmp, path), target)
    records[path] = { sha256: sha(readFileSync(target)), bytes: readFileSync(target).length }
    if (frozen.fingerprints[path]) assert.equal(records[path].sha256, frozen.fingerprints[path].sha256)
  }
  save(join(root, `${prefix}-archive.json`), { at: new Date().toISOString(), records })
  console.log(JSON.stringify({ archived: files.length, evidence }, null, 2))
} else if (process.argv[2] === '--audit') {
  const frozen = json(join(root, `${prefix}-freeze.json`))
  const archive = json(join(root, `${prefix}-archive.json`))
  const result = json(join(root, `${prefix}-result.json`))
  const errors = []
  for (const [path, record] of Object.entries(archive.records)) {
    if (sha(readFileSync(join(root, `${prefix}-evidence`, path))) !== record.sha256) errors.push(`archive:${path}`)
  }
  for (const [path, record] of Object.entries(frozen.fingerprints)) {
    if (sha(readFileSync(join(root, path))) !== record.sha256) errors.push(`source:${path}`)
  }
  if (JSON.stringify(dependencyHashes()) !== JSON.stringify(frozen.dependencyHashes)) errors.push('dependency drift')
  for (const label of ['r1', 'r2']) {
    const exit = json(join(root, `${prefix}-evidence/${label}-exit.json`))
    assert.equal(exit.exit, 0)
    assert.equal(exit.signal, null)
    assert.equal(sha(readFileSync(join(root, `${prefix}-evidence/${label}.txt`))), exit.outputSha256)
  }
  assert.equal(result.testSha256, archive.records[`${pkg}/src/client/board/relative-target.test.tsx`].sha256)
  assert.equal(result.outputSha256, archive.records['r2.txt'].sha256)
  const files = readdirSync(join(root, 'docs/testing'))
    .filter(name => name.startsWith('board-drag-relative-target-clarification-20261021') && /\.(md|mjs|json)$/.test(name))
  for (const name of files) {
    const path = join(root, 'docs/testing', name)
    const text = readFileSync(path, 'utf8')
    if (!text.endsWith('\n')) errors.push(`${name}:final newline`)
    text.split('\n').forEach((line, index) => { if (/[\t ]+$/.test(line)) errors.push(`${name}:${index + 1}:trailing whitespace`) })
    if (name.endsWith('.md')) for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0]
      if (target && !/^[a-z]+:/i.test(target) && !existsSync(resolve(dirname(path), target))) errors.push(`${name}:link:${target}`)
    }
  }
  const state = {
    at: new Date().toISOString(), errors,
    archiveFiles: Object.keys(archive.records).length, frozenFiles: Object.keys(frozen.fingerprints).length,
    sourceDrift: errors.some(error => error.startsWith('source:')),
    dependenciesDrift: errors.includes('dependency drift'),
  }
  save(join(root, `${prefix}-audit.json`), state)
  console.log(JSON.stringify(state, null, 2))
  process.exitCode = errors.length ? 1 : 0
} else {
  throw new Error('Use --freeze, --run [unique-label], --archive, or --audit')
}

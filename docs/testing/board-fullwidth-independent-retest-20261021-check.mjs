import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import {
  readFileSync, writeFileSync, mkdirSync, mkdtempSync, copyFileSync,
  symlinkSync, existsSync, readdirSync, realpathSync,
} from 'node:fs'
import { spawnSync } from 'node:child_process'

const main = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/board-fullwidth-independent-retest-20261021'
const evidence = join(main, `${prefix}-evidence`)
const dependencies = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const packagePath = 'packages/dsh-pm-tool'
const editor = `${packagePath}/src/client/board/editor.tsx`
const test = `${packagePath}/src/client/board/editor-drag-stop.test.tsx`
const fixture = 'docs/testing/board-fixture-clarification-20261021-fixture.json'
const sha = value => createHash('sha256').update(value).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const save = (path, value) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}
const commands = []
function command(label, executable, args, cwd = main) {
  const startedAt = new Date().toISOString()
  const result = spawnSync(executable, args, {
    cwd, encoding: 'utf8', timeout: 180000, maxBuffer: 12 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  })
  const output = (result.stdout ?? '') + (result.stderr ?? '')
  mkdirSync(evidence, { recursive: true })
  writeFileSync(join(evidence, `${label}.txt`), output)
  const record = {
    label, executable, args, cwd, startedAt, endedAt: new Date().toISOString(),
    exit: result.status, signal: result.signal, error: result.error?.message ?? null,
    output: `${prefix}-evidence/${label}.txt`, outputSha256: sha(output),
  }
  commands.push(record)
  save(join(evidence, `${label}-exit.json`), record)
  return { ...record, stdout: result.stdout, outputText: output }
}
function git(label, args) {
  const result = command(label, 'git', args)
  assert.equal(result.exit, 0, `${label}: ${result.outputText}`)
  return result.stdout
}
const sources = [
  'editor.tsx', 'editor-drag-stop.test.tsx', 'editor-ops.ts',
  'editor-ops.test.ts', 'editor-compact.test.ts', 'editor-geometry.test.ts',
  'projection.ts', 'persist.ts', 'history.ts', 'types.ts', 'widgets.tsx',
].map(name => `${packagePath}/src/client/board/${name}`)
const files = [
  ...sources, `${packagePath}/package.json`, `${packagePath}/vitest.config.ts`,
  `${packagePath}/tsconfig.json`, `${packagePath}/pnpm-lock.yaml`, fixture,
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/board-fullwidth-drag-diagnosis-20261021.md',
  'docs/testing/board-fixture-clarification-20261021.md',
  'docs/plans/2026-10-21-bridge-board-objective-closure.md',
  'reports/all-pending-acceptance-execution-20261021.md',
  'reports/board-fullwidth-developer-20261021.md',
  ...['red-green.json', 'red.txt', 'green.txt', 'vitest.config.mjs', 'recheck.mjs']
    .map(name => `reports/all-pending-evidence-20261021/A6/board/${name}`),
]
function fingerprints() {
  return Object.fromEntries(files.map(path => {
    const bytes = readFileSync(join(main, path))
    return [path, { sha256: sha(bytes), bytes: bytes.length }]
  }))
}
function dependencyState() {
  const require = createRequire(join(dependencies, '../package.json'))
  const packages = ['react', 'react-test-renderer', 'react-grid-layout', 'vitest', 'typescript', 'zod']
  const result = Object.fromEntries(packages.map(name => {
    const path = require.resolve(`${name}/package.json`)
    return [name, { version: json(path).version, path: realpathSync(path), sha256: sha(readFileSync(path)) }]
  }))
  const rglRequire = createRequire(require.resolve('react-grid-layout'))
  const dom = rglRequire.resolve('react-dom/package.json')
  result['react-dom-from-rgl'] = { version: json(dom).version, path: realpathSync(dom), sha256: sha(readFileSync(dom)) }
  const rgl = require.resolve('react-grid-layout')
  result.rglFiles = Object.fromEntries([
    rgl, ...['ReactGridLayout.js', 'utils.js', 'GridItem.js', 'calculateUtils.js',
      'ReactGridLayoutPropTypes.js'].map(name => join(dependencies, 'react-grid-layout/build', name)),
  ].map(path => [realpathSync(path), sha(readFileSync(path))]))
  return result
}

const mode = process.argv[2]
if (mode === '--freeze') {
  assert(!existsSync(join(evidence, 'freeze.json')), 'Do not overwrite an existing freeze')
  const before = fingerprints()
  const head = git('freeze-head', ['rev-parse', 'HEAD']).trim()
  const editorDiff = git('freeze-editor-diff', ['diff', '--', editor])
  git('freeze-board-status', ['status', '--short', '--', `${packagePath}/src/client/board`, `${packagePath}/vitest.config.ts`])
  git('freeze-board-diff-stat', ['diff', '--stat', '--', `${packagePath}/src/client/board`])
  const old = git('freeze-old-editor', ['show', `${head}:${editor}`])
  const tmp = mkdtempSync('/private/tmp/pmtool-fw-independent-retest-20261021-')
  for (const path of [...sources, fixture, `${packagePath}/package.json`, `${packagePath}/vitest.config.ts`, `${packagePath}/tsconfig.json`]) {
    const target = join(tmp, path)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(join(main, path), target)
    assert.equal(sha(readFileSync(target)), before[path].sha256)
  }
  symlinkSync(dependencies, join(tmp, packagePath, 'node_modules'))
  copyFileSync(join(main, editor), join(tmp, 'fixed-editor.tsx'))
  copyFileSync(join(evidence, 'freeze-old-editor.txt'), join(tmp, 'old-editor.tsx'))
  assert.deepEqual(fingerprints(), before, 'Source changed during freeze')
  const state = {
    at: new Date().toISOString(), candidate: 'board-FW-independent-source-20261021',
    baseline: head, tmp, packageRoot: join(tmp, packagePath), dependencies,
    fingerprints: before, editorDiffSha256: sha(editorDiff), oldEditorSha256: sha(old),
    dependencyState: dependencyState(),
    environment: { platform: process.platform, arch: process.arch, node: process.version, executable: process.execPath },
    commands, scope: 'SOURCE/AUTO only; no build, lib, runtime, GUI or whole-dirty-tree acceptance',
  }
  save(join(evidence, 'freeze.json'), state)
  console.log(JSON.stringify(state, null, 2))
} else if (mode === '--run') {
  const frozen = json(join(evidence, 'freeze.json'))
  const config = join(frozen.tmp, 'vitest.config.mjs')
  assert(existsSync(config), 'Create the owned config with apply_patch before running')
  const args = [
    join(frozen.packageRoot, 'node_modules/vitest/vitest.mjs'), 'run',
    '--config', config, '--reporter', 'verbose',
  ]
  const outcomes = {}
  try {
    for (const [label, source, fail, pass] of [
      ['independent-old-final-tests', 'old-editor.tsx', 5, 31],
      ['independent-new-final-tests', 'fixed-editor.tsx', 0, 36],
    ]) {
      copyFileSync(join(frozen.tmp, source), join(frozen.tmp, editor))
      assert.equal(sha(readFileSync(join(frozen.tmp, test))), frozen.fingerprints[test].sha256)
      const result = command(label, process.execPath, args, frozen.packageRoot)
      const summary = result.outputText.match(/Tests\s+(.+?)\s+\(36\)/)?.[1] ?? ''
      outcomes[label] = { exit: result.exit, summary, editorSha256: sha(readFileSync(join(frozen.tmp, editor))), outputSha256: result.outputSha256 }
      assert.equal(result.exit, fail ? 1 : 0, label)
      assert(summary.includes(`${pass} passed`), `${label}: missing ${pass} passed`)
      if (fail) assert(summary.includes(`${fail} failed`), `${label}: missing ${fail} failed`)
      console.log(`${label}: exit=${result.exit}; ${summary}`)
    }
  } finally {
    copyFileSync(join(frozen.tmp, 'fixed-editor.tsx'), join(frozen.tmp, editor))
    save(join(evidence, 'independent-red-green.json'), { at: new Date().toISOString(), outcomes, commands, testSha256: frozen.fingerprints[test].sha256, configSha256: sha(readFileSync(config)) })
  }
} else if (mode === '--additional') {
  const frozen = json(join(evidence, 'freeze.json'))
  const config = join(frozen.tmp, 'vitest.additional.config.mjs')
  const label = process.argv[3] ?? 'independent-additional'
  assert(/^independent-additional(?:-[a-z0-9]+)?$/.test(label), 'Invalid evidence label')
  const result = command(label, process.execPath, [
    join(frozen.packageRoot, 'node_modules/vitest/vitest.mjs'), 'run', '--config', config, '--reporter', 'verbose',
  ], frozen.packageRoot)
  console.log(result.outputText)
  process.exitCode = result.exit ?? 1
} else if (mode === '--archive') {
  const frozen = json(join(evidence, 'freeze.json'))
  const snapshots = [
    ...sources, fixture, `${packagePath}/package.json`, `${packagePath}/vitest.config.ts`,
    `${packagePath}/tsconfig.json`,
    `${packagePath}/src/client/board/independent-fw-boundaries.test.tsx`,
    'vitest.config.mjs', 'vitest.additional.config.mjs', 'additional-observations.json',
  ]
  const artifacts = {}
  for (const path of snapshots) {
    const from = join(frozen.tmp, path)
    const to = join(evidence, 'source', path)
    mkdirSync(dirname(to), { recursive: true })
    copyFileSync(from, to)
    const bytes = readFileSync(to)
    artifacts[`source/${path}`] = { sha256: sha(bytes), bytes: bytes.length }
    if (frozen.fingerprints[path]) assert.equal(sha(bytes), frozen.fingerprints[path].sha256)
  }
  for (const name of readdirSync(evidence).filter(name => name.endsWith('.txt') || name.endsWith('-exit.json'))) {
    const bytes = readFileSync(join(evidence, name))
    artifacts[name] = { sha256: sha(bytes), bytes: bytes.length }
  }
  save(join(evidence, 'archive.json'), { at: new Date().toISOString(), artifacts })
  console.log(JSON.stringify({ files: Object.keys(artifacts).length, sourceCopiesMatchFreeze: true }, null, 2))
} else if (mode === '--vendor') {
  const result = command('readonly-vendor-integrity', process.execPath, [`${packagePath}/scripts/verify-external-skills.mjs`])
  console.log(result.outputText)
  process.exitCode = result.exit ?? 1
} else if (mode === '--drift') {
  const frozen = json(join(evidence, 'freeze.json'))
  const after = fingerprints()
  const changed = files.filter(path => after[path].sha256 !== frozen.fingerprints[path].sha256)
  const dependencyAfter = dependencyState()
  const dependencyDrift = JSON.stringify(dependencyAfter) !== JSON.stringify(frozen.dependencyState)
  const copies = [...sources, fixture, `${packagePath}/package.json`, `${packagePath}/vitest.config.ts`, `${packagePath}/tsconfig.json`]
    .filter(path => sha(readFileSync(join(frozen.tmp, path))) !== frozen.fingerprints[path].sha256)
  const head = git('final-head', ['rev-parse', 'HEAD']).trim()
  const editorDiff = git('final-editor-diff', ['diff', '--', editor])
  const diffDrift = sha(editorDiff) !== frozen.editorDiffSha256
  const state = { at: new Date().toISOString(), changed, dependencyDrift, copies, head, headDrift: head !== frozen.baseline, diffDrift, after, commands }
  save(join(evidence, 'drift.json'), state)
  console.log(JSON.stringify({ ...state, after: undefined }, null, 2))
  process.exitCode = changed.length || dependencyDrift || copies.length || diffDrift || state.headDrift ? 1 : 0
} else if (mode === '--audit') {
  const own = readdirSync(join(main, 'docs/testing')).filter(name => name.startsWith('board-fullwidth-independent-retest-20261021'))
  const errors = []
  for (const name of own.filter(name => /\.(md|mjs)$/.test(name))) {
    const path = join(main, 'docs/testing', name)
    const text = readFileSync(path, 'utf8')
    if (!text.endsWith('\n')) errors.push(`${name}: missing final newline`)
    text.split('\n').forEach((line, i) => {
      if (/[\t ]+$/.test(line)) errors.push(`${name}:${i + 1}: trailing whitespace`)
    })
    if (name.endsWith('.md')) for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0]
      if (target && !/^[a-z]+:/i.test(target) && !existsSync(resolve(dirname(path), target))) errors.push(`${name}: missing ${target}`)
    }
  }
  const diff = command('final-own-diff-check', 'git', ['diff', '--check', '--', `${prefix}*`])
  console.log(JSON.stringify({ own, errors, diffExit: diff.exit }, null, 2))
  save(join(evidence, 'audit.json'), { at: new Date().toISOString(), own, errors, commands })
  process.exitCode = errors.length || diff.exit !== 0 ? 1 : 0
} else if (mode === '--result') {
  const frozen = json(join(evidence, 'freeze.json'))
  const redGreen = json(join(evidence, 'independent-red-green.json'))
  const drift = json(join(evidence, 'drift.json'))
  const audit = json(join(evidence, 'audit.json'))
  const archive = json(join(evidence, 'archive.json'))
  const exits = readdirSync(evidence).filter(name => name.endsWith('-exit.json'))
    .map(name => json(join(evidence, name)))
  for (const record of exits) {
    assert.equal(sha(readFileSync(join(main, record.output))), record.outputSha256, record.label)
    assert.equal(record.signal, null, record.label)
    assert.equal(record.error, null, record.label)
  }
  for (const [path, record] of Object.entries(archive.artifacts)) {
    assert.equal(sha(readFileSync(join(evidence, path))), record.sha256, path)
  }
  assert.equal(redGreen.outcomes['independent-old-final-tests'].exit, 1)
  assert.equal(redGreen.outcomes['independent-old-final-tests'].summary, '5 failed | 31 passed')
  assert.equal(redGreen.outcomes['independent-new-final-tests'].exit, 0)
  assert.equal(redGreen.outcomes['independent-new-final-tests'].summary, '36 passed')
  assert.equal(json(join(evidence, 'independent-additional-r2-exit.json')).exit, 0)
  assert.match(readFileSync(join(evidence, 'independent-additional-r2.txt'), 'utf8'), /Tests\s+9 passed \(9\)/)
  assert.equal(drift.changed.length, 0)
  assert.equal(drift.copies.length, 0)
  assert(!drift.headDrift && !drift.diffDrift && !drift.dependencyDrift)
  assert.equal(audit.errors.length, 0)
  assert.equal(audit.commands[0].exit, 0)
  const result = {
    at: new Date().toISOString(), role: 'independent-testing-expert', candidate: frozen.candidate,
    baseline: frozen.baseline, sourceSha256: frozen.fingerprints[editor].sha256,
    testSha256: frozen.fingerprints[test].sha256,
    conclusions: {
      SOURCE: 'LIMITED_PASS', 'FW-T01': 'AUTO_PASS', 'FW-T02': 'AUTO_PASS', 'FW-T03': 'AUTO_PASS',
      'FW-T04': 'NOT_RUN', 'FW-T05': 'NOT_RUN', wholeGate: 'NOT_SIGNED_PASS', wholeDirtyTree: 'NOT_ASSESSED',
    },
    mainActions: 'New build/loaded identity and original GUI/persistence/protection evidence still required',
    oldFinalTests: redGreen.outcomes['independent-old-final-tests'],
    newFinalTests: redGreen.outcomes['independent-new-final-tests'],
    additional: { tests: 9, exit: 0, fixtureFailurePreserved: 'independent-additional.txt' },
    driftAt: drift.at, drift: false, commands: exits,
    outerFreezeExit: 'NOT_CAPTURED; five inner git exits recorded; freeze revalidated by drift',
    archiveFilesVerified: Object.keys(archive.artifacts).length,
    writeRoots: [evidence, frozen.tmp, join(main, `${prefix}.md`), join(main, `${prefix}-check.mjs`), join(main, `${prefix}-result.json`)],
    artifacts: {
      report: { path: `${prefix}.md`, sha256: sha(readFileSync(join(main, `${prefix}.md`))) },
      checker: { path: `${prefix}-check.mjs`, sha256: sha(readFileSync(join(main, `${prefix}-check.mjs`))) },
      freeze: { path: `${prefix}-evidence/freeze.json`, sha256: sha(readFileSync(join(evidence, 'freeze.json'))) },
      archive: { path: `${prefix}-evidence/archive.json`, sha256: sha(readFileSync(join(evidence, 'archive.json'))) },
    },
  }
  save(join(main, `${prefix}-result.json`), result)
  console.log(JSON.stringify({ conclusions: result.conclusions, archiveFilesVerified: result.archiveFilesVerified, driftAt: result.driftAt, commands: exits.map(({ label, exit }) => ({ label, exit })) }, null, 2))
} else {
  throw new Error('Use --freeze, --run, --additional, --archive, --vendor, --drift, --audit or --result')
}

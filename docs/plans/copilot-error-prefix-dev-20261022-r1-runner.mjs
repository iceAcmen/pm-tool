import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const out = path.join(repo, 'reports/all-pending-evidence-20261021/CopilotPrefixDevR1')
const parent = path.join(repo, 'reports/all-pending-evidence-20261021/CombinedSuccessor112R1')
const old = '/private/tmp/pmtool-combined-successor112-20261022-r1/packages/dsh-pm-tool'
const tmp = '/private/tmp/pmtool-copilot-prefix-dev-20261022-r1'
const pkg = path.join(tmp, 'packages/dsh-pm-tool')
const main = path.join(repo, 'packages/dsh-pm-tool')
const prefix = 'docs/testing/successor112-auth-gui-prefix-20261022-r1'
const sidecar = 'src/client/shared/drawers/sidecar-portal.tsx'
const test = 'src/client/copilot-error-prefix.test.tsx'
const fixture = 'src/client/copilot-error-prefix-fixture.json'
const additions = [test, fixture]
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const json = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const stamp = f => { const b = fs.readFileSync(f); return { bytes: b.length, sha256: sha(b) } }
const save = (name, value) => {
  const f = path.join(out, name)
  fs.mkdirSync(path.dirname(f), { recursive: true })
  fs.writeFileSync(f, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function scan(base) {
  const rows = {}
  const walk = (d, rel = '') => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const f = path.join(d, e.name), name = rel ? rel + '/' + e.name : e.name
      const st = fs.lstatSync(f)
      if (st.isDirectory()) walk(f, name)
      else if (st.isSymbolicLink()) rows[name] = { link: fs.readlinkSync(f), real: fs.realpathSync(f) }
      else {
        assert(st.isFile(), `Not ordinary file: ${f}`)
        rows[name] = { ...stamp(f), dev: st.dev, ino: st.ino }
      }
    }
  }
  walk(base)
  return rows
}
const content = rows => Object.fromEntries(Object.entries(rows).map(([k, r]) =>
  [k, 'link' in r ? { link: r.link } : { bytes: r.bytes, sha256: r.sha256 }]))
const digest = rows => sha(Buffer.from(JSON.stringify(rows)))
function inputs(base) {
  const rows = {}
  for (const name of fs.readdirSync(base).sort()) {
    const f = path.join(base, name)
    if (['src', 'scripts', 'locale'].includes(name)) {
      for (const [rel, r] of Object.entries(content(scan(f)))) {
        assert(!('link' in r), `Input link: ${name}/${rel}`)
        rows[name + '/' + rel] = r
      }
    } else if (fs.lstatSync(f).isFile()) rows[name] = stamp(f)
  }
  return rows
}
function differences(a, b) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort().filter(k =>
    JSON.stringify(a[k]) !== JSON.stringify(b[k]))
}
function migratedTest() {
  const original = fs.readFileSync(path.join(repo, prefix + '-r2-component.fixture.tsx'), 'utf8')
  const from = "fs.readFileSync(process.env.PREFIX_TRANSCRIPT!, 'utf8')"
  const to = "fs.readFileSync(new URL('./copilot-error-prefix-fixture.json', import.meta.url), 'utf8')"
  assert.equal(original.split(from).length, 2)
  assert.equal(original.split('  fs.appendFileSync(process.env.PREFIX_OBSERVATIONS!').length, 2)
  return original.replace(from, to).replace('  fs.appendFileSync(process.env.PREFIX_OBSERVATIONS!',
    '  if (process.env.PREFIX_OBSERVATIONS) fs.appendFileSync(process.env.PREFIX_OBSERVATIONS!')
}
function patchedSidecar() {
  const original = fs.readFileSync(path.join(old, sidecar), 'utf8')
  const fromImport = "import { parseActiveModelLane } from '../../../core/ui-feedback.js'"
  const fromCatch = "text: `副驾暂不可用：${e instanceof Error ? e.message : String(e)}`"
  assert.equal(original.split(fromImport).length, 2)
  assert.equal(original.split(fromCatch).length, 2)
  return original.replace(fromImport, "import { parseActiveModelLane, prefixFeedbackOnce } from '../../../core/ui-feedback.js'")
    .replace(fromCatch, "text: prefixFeedbackOnce('副驾暂不可用', e)")
}
function guard() {
  const before = json(path.join(out, 'before.json'))
  assert.deepEqual(inputs(old), before.oldInputs, 'Original112 complete inputs drift')
  assert.equal(digest(content(scan(path.join(old, 'node_modules')))), before.oldDepsDigest)
  assert.deepEqual(content(scan(path.join(main, 'lib'))), before.mainLib, 'Shared lib drift')
  assert.deepEqual(content(scan(path.join(old, 'lib'))), before.oldLib, 'Old112 lib drift')
  for (const [f, s] of Object.entries(before.protectedOriginals)) assert.deepEqual(stamp(path.join(repo, f)), s, f)
  return before
}
function ensureSource() {
  const before = guard()
  const now = inputs(main)
  assert.deepEqual(differences(before.mainInputs, now).sort(), [sidecar, ...additions].sort())
  assert.equal(Object.keys(now).length, 521)
  assert.equal(fs.readFileSync(path.join(main, sidecar), 'utf8'), patchedSidecar())
  assert.equal(fs.readFileSync(path.join(main, test), 'utf8'), migratedTest())
  assert.deepEqual(fs.readFileSync(path.join(main, fixture)), fs.readFileSync(path.join(repo, prefix + '-transcript.json')))
  return now
}
const affected = [
  'src/client/copilot-extension-baseline.test.tsx',
  'src/client/shared/drawers/copilot-preconfirm.test.tsx',
  'src/client/sidecar-minimize-retention.test.tsx',
  'src/client/shared/drawers/gd-overlay-contract.test.ts',
  'src/client/index-command-feedback.test.tsx',
  'src/client/panel-transport-error-feedback.test.tsx',
  'src/client/provenance-panel.test.tsx',
  'src/client/shared/markdown.test.ts',
  'src/core/ui-feedback.test.ts',
  'src/core/copilot-validate.test.ts',
  'src/core/copilot-task-fields.test.ts',
  'src/core/ask-copilot-b7.test.ts',
  'src/core/ask-projection.test.ts',
  'src/core/ask-context.test.ts',
  'src/core/stale-placeholder.test.ts',
  'src/core/derived.test.ts',
  'src/core/progress-clamp.test.ts',
]
const mode = process.argv[2]
if (mode === 'before') {
  assert(!fs.existsSync(out), 'Never overwrite owned round')
  assert(!fs.existsSync(tmp), 'Never overwrite tmp')
  const oldInputs = inputs(old), mainInputs = inputs(main)
  const declared = json(path.join(parent, 'complete-inputs.json'))
  const oldProductInputs = Object.fromEntries(Object.keys(declared).map(f => [f, oldInputs[f]]))
  const oldFacilityExtras = Object.fromEntries(Object.entries(oldInputs).filter(([f]) => !(f in declared)))
  assert.equal(Object.keys(declared).length, 519)
  assert.deepEqual(Object.keys(oldFacilityExtras).sort(),
    ['retest-probes.test.ts', 'retest-stress.test.ts', 'src/core/retest-legacy-renderer.ts'].sort())
  assert.deepEqual(mainInputs, oldProductInputs)
  assert.deepEqual(mainInputs, json(path.join(parent, 'complete-inputs.json')))
  for (const f of additions) assert(!fs.existsSync(path.join(main, f)))
  const protectedOriginals = {}
  for (const name of fs.readdirSync(path.join(repo, 'docs/testing'))) {
    if (name.startsWith(path.basename(prefix))) {
      const f = 'docs/testing/' + name
      if (fs.lstatSync(path.join(repo, f)).isFile()) protectedOriginals[f] = stamp(path.join(repo, f))
    }
  }
  for (const f of ['candidate.json', 'source-files.json', 'complete-inputs.json', 'tracked-product.diff',
    'new-product-files.txt', 'package-dependencies.json', 'built-artifacts.json']) {
    const rel = path.relative(repo, path.join(parent, f))
    protectedOriginals[rel] = stamp(path.join(repo, rel))
  }
  for (const [f] of Object.entries(json(path.join(parent, 'source-files.json')).source)) {
    if (f.startsWith('launcher/')) protectedOriginals[f] = stamp(path.join(repo, f))
  }
  const vendor = json(path.join(repo, 'vendor/agent-skills/mattpocock/manifest.json'))
  for (const row of [...vendor.rootFiles, ...vendor.skills.flatMap(s => s.files)]) {
    const f = 'vendor/agent-skills/mattpocock/' + row.path
    assert.deepEqual(stamp(path.join(repo, f)), { bytes: row.bytes, sha256: row.sha256 })
    protectedOriginals[f] = stamp(path.join(repo, f))
  }
  save('before.json', {
    at: new Date().toISOString(), node: process.version, platform: process.platform, runnerPid: process.pid,
    mainInputs, oldInputs, oldProductInputs, oldFacilityExtras,
    oldDepsDigest: digest(content(scan(path.join(old, 'node_modules')))),
    mainLib: content(scan(path.join(main, 'lib'))), oldLib: content(scan(path.join(old, 'lib'))),
    protectedOriginals, vendorIntegrityVerified: true, vendorCommit: vendor.source.commit,
  })
  console.log('BEFORE 519 main/old exact; protected originals saved; pid=' + process.pid)
} else if (mode === 'freeze') {
  const now = ensureSource()
  assert(!fs.existsSync(tmp), 'Never overwrite tmp')
  fs.mkdirSync(pkg, { recursive: true })
  for (const [f, s] of Object.entries(now)) {
    const to = path.join(pkg, f)
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.copyFileSync(path.join(main, f), to, fs.constants.COPYFILE_EXCL)
    assert.deepEqual(stamp(to), s)
  }
  assert.deepEqual(inputs(pkg), now)
  save('complete-inputs.json', now)
  const sourceParent = json(path.join(parent, 'source-files.json'))
  const source = { ...sourceParent.source }
  source['packages/dsh-pm-tool/' + sidecar] = now[sidecar].sha256
  for (const f of additions) source['packages/dsh-pm-tool/' + f] = now[f].sha256
  for (const [f, h] of Object.entries(source)) assert.equal(stamp(path.join(repo, f)).sha256, h, f)
  assert.equal(Object.keys(source).length, 114)
  save('source-files.json', { baseline: sourceParent.baseline, count: 114, source })
  save('source-files.sha256', Object.entries(source).sort().map(([f, h]) => h + '  ' + f).join('\n') + '\n')
  save('parent-tracked-product.diff', fs.readFileSync(path.join(parent, 'tracked-product.diff'), 'utf8'))
  save('parent-new-product-files.txt', fs.readFileSync(path.join(parent, 'new-product-files.txt'), 'utf8'))
  const patch = spawnSync('/usr/bin/diff', ['-u', '--label', 'a/packages/dsh-pm-tool/' + sidecar,
    '--label', 'b/packages/dsh-pm-tool/' + sidecar, path.join(old, sidecar), path.join(main, sidecar)], { encoding: 'utf8' })
  assert.equal(patch.status, 1)
  let fullPatch = patch.stdout
  for (const f of additions) {
    const added = spawnSync('/usr/bin/diff', ['-u', '--label', '/dev/null', '--label',
      'b/packages/dsh-pm-tool/' + f, '/dev/null', path.join(main, f)], { encoding: 'utf8' })
    assert.equal(added.status, 1)
    fullPatch += added.stdout
  }
  save('round-exact.patch', fullPatch)
  save('round-diff-command.json', { tool: '/usr/bin/diff', status: 1, meaning: 'Expected differences; no Git command', sidecarArgs: patch.args })
  const from = path.join(old, 'node_modules'), to = path.join(pkg, 'node_modules')
  const beforeDeps = scan(from)
  for (const [f, r] of Object.entries(beforeDeps)) if ('link' in r) assert(r.real.startsWith(from + '/'), f)
  fs.cpSync(from, to, { recursive: true, dereference: false, verbatimSymlinks: true, errorOnExist: true, force: false })
  const rewritten = []
  for (const [f, r] of Object.entries(beforeDeps)) if ('link' in r && path.isAbsolute(r.link)) {
    assert(r.link.startsWith(from + '/'), f)
    fs.unlinkSync(path.join(to, f))
    fs.symlinkSync(path.join(to, path.relative(from, r.link)), path.join(to, f))
    rewritten.push(f)
  }
  const copiedDeps = scan(to), shared = [], external = [], changed = []
  assert.deepEqual(Object.keys(beforeDeps), Object.keys(copiedDeps))
  for (const [f, r] of Object.entries(beforeDeps)) {
    const copy = copiedDeps[f]
    if ('link' in r) {
      if (!copy.real.startsWith(to + '/')) external.push(f)
    } else {
      if (r.bytes !== copy.bytes || r.sha256 !== copy.sha256) changed.push(f)
      if (r.dev === copy.dev && r.ino === copy.ino) shared.push(f)
    }
  }
  save('dependency-files.json', { from, to, original: beforeDeps, copied: copiedDeps, rewritten, shared, external, changed })
  assert.deepEqual(shared, []); assert.deepEqual(external, []); assert.deepEqual(changed, [])
  for (const dir of ['home', 'cache', 'tmp', 'config', 'state']) fs.mkdirSync(path.join(tmp, dir))
  const config = {
    root: pkg, cacheDir: path.join(tmp, 'cache'), esbuild: { jsx: 'automatic' },
    test: {
      include: [test, ...affected], environment: 'node', pool: 'forks', poolOptions: { forks: { singleFork: true } },
      maxWorkers: 1, minWorkers: 1, fileParallelism: false, testTimeout: 15000, hookTimeout: 15000,
      server: { deps: { inline: ['lucide-react'] } },
    },
  }
  fs.writeFileSync(path.join(tmp, 'vitest.config.mjs'), 'export default ' + JSON.stringify(config, null, 2) + ';\n', { flag: 'wx' })
  save('candidate.json', {
    at: new Date().toISOString(), baseline: sourceParent.baseline, version: json(path.join(pkg, 'package.json')).version,
    role: 'different developer; self-test only', runnerPid: process.pid, tmp, pkg,
    parentInputCount: 519, completeInputCount: 521, parentSourceCount: 112, sourceCount: 114,
    changed: [sidecar], added: additions, affected, runtimeLoaded: false, build: 'NOT_RUN', gui: 'NOT_RUN',
    dependencies: { files: Object.values(copiedDeps).filter(r => !('link' in r)).length,
      links: Object.values(copiedDeps).filter(r => 'link' in r).length, sharedInodes: 0, externalLinks: 0,
      originalDigest: digest(content(beforeDeps)), copiedDigest: digest(content(copiedDeps)) },
    config: stamp(path.join(tmp, 'vitest.config.mjs')),
    testMigration: { original: stamp(path.join(repo, prefix + '-r2-component.fixture.tsx')),
      migrated: now[test], allowed: ['transcript relative fixture', 'observations optional'], assertionsUnchanged: true },
    fixtureExact: now[fixture], independentVerdict: 'NOT_SIGNED', ordinaryCommit: 'MAIN_ONLY; NOT_RUN',
  })
  ensureSource()
  console.log('FROZEN 521 inputs; 114 declared source; dependencies exact/different inode/internal links; pid=' + process.pid)
} else if (mode === 'test') {
  const candidate = json(path.join(out, 'candidate.json'))
  assert.deepEqual(ensureSource(), json(path.join(out, 'complete-inputs.json')))
  assert.deepEqual(inputs(pkg), json(path.join(out, 'complete-inputs.json')))
  assert.deepEqual(stamp(path.join(tmp, 'vitest.config.mjs')), candidate.config)
  const env = {
    PATH: path.dirname(process.execPath) + ':/usr/bin:/bin:/usr/sbin:/sbin',
    HOME: path.join(tmp, 'home'), TMPDIR: path.join(tmp, 'tmp'), TMP: path.join(tmp, 'tmp'), TEMP: path.join(tmp, 'tmp'),
    XDG_CACHE_HOME: path.join(tmp, 'cache'), XDG_CONFIG_HOME: path.join(tmp, 'config'), XDG_DATA_HOME: path.join(tmp, 'state'),
    NODE_DISABLE_COMPILE_CACHE: '1', CI: 'true', LANG: 'zh_CN.UTF-8', TZ: 'UTC',
    PREFIX_OBSERVATIONS: path.join(out, 'observations.ndjson'),
  }
  fs.writeFileSync(env.PREFIX_OBSERVATIONS, '', { flag: 'wx' })
  const commands = [
    ['prefix-five', [path.join(pkg, 'node_modules/vitest/vitest.mjs'), 'run', test]],
    ['affected', [path.join(pkg, 'node_modules/vitest/vitest.mjs'), 'run', ...affected]],
    ['noemit', [path.join(pkg, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json', '--noEmit', '--incremental', 'false']],
  ]
  let failed = false
  for (const [name, args] of commands) {
    if (name !== 'noemit') args.push('--config', path.join(tmp, 'vitest.config.mjs'), '--no-cache',
      '--reporter=verbose', '--reporter=json', '--outputFile=' + path.join(out, name + '.result.json'))
    const started = new Date().toISOString()
    console.log('START ' + name + ' runnerPid=' + process.pid)
    const result = spawnSync(process.execPath, args, { cwd: pkg, env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 180000 })
    save(name + '.command.json', { argv: [process.execPath, ...args], cwd: pkg, env, runnerPid: process.pid,
      pid: result.pid, started, ended: new Date().toISOString(), exitCode: result.status, signal: result.signal,
      error: result.error?.message ?? null })
    save(name + '.stdout.txt', result.stdout ?? '')
    save(name + '.stderr.txt', result.stderr ?? '')
    console.log('END ' + name + ' pid=' + result.pid + ' exit=' + result.status)
    failed ||= result.status !== 0 || result.signal !== null
  }
  process.exitCode = failed ? 1 : 0
} else if (mode === 'close') {
  const candidate = json(path.join(out, 'candidate.json'))
  const now = ensureSource()
  assert.deepEqual(inputs(pkg), now)
  assert.equal(digest(content(scan(path.join(pkg, 'node_modules')))), candidate.dependencies.copiedDigest)
  assert.deepEqual(stamp(path.join(tmp, 'vitest.config.mjs')), candidate.config)
  const commands = ['prefix-five', 'affected', 'noemit'].map(name => ({ name, ...json(path.join(out, name + '.command.json')) }))
  for (const command of commands) {
    let alive = true
    try { process.kill(command.pid, 0) } catch (e) { if (e.code === 'ESRCH') alive = false; else throw e }
    assert.equal(alive, false, `Owned PID alive: ${command.pid}`)
  }
  const results = Object.fromEntries(['prefix-five', 'affected'].map(name => {
    const rows = json(path.join(out, name + '.result.json')).testResults.flatMap(r => r.assertionResults)
    return [name, { count: rows.length, passed: rows.filter(r => r.status === 'passed').length,
      failed: rows.filter(r => r.status === 'failed').length,
      other: rows.filter(r => !['passed', 'failed'].includes(r.status)).length,
      cases: rows.map(r => ({ title: r.fullName, status: r.status })) }]
  }))
  const observations = fs.readFileSync(path.join(out, 'observations.ndjson'), 'utf8').trim().split('\n').map(s => JSON.parse(s))
  assert.equal(observations.length, 5)
  save('close.json', {
    at: new Date().toISOString(), runnerPid: process.pid, released: true, stop: true, results, commands,
    observations, original112InputsAndDepsUnchanged: true, mainAndOldSharedLibUnchanged: true,
    protectedOriginalsUnchanged: true, mainOnlyAllowedThreeInputDifferences: true, ownFrozenInputsAndDepsUnchanged: true,
    sourceCount: 114, completeInputCount: 521, ownedPidsExited: true,
    mainAndOtherBusinessDataRoots: 'NOT_SCANNED; no business data/key access performed',
    independentVerdict: 'NOT_SIGNED; developer self-test only', runtimeLoaded: false,
    buildInstallServiceGuiGit: 'NOT_RUN', parentGoal: 'CONTINUES; Main separate independent retest required',
  })
  const inventory = content(scan(out))
  save('evidence-files.json', inventory)
  console.log(JSON.stringify({ released: true, stop: true, results, ownedPidsExited: true }))
} else if (mode === 'receipts') {
  const base = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
  const newest = fs.readdirSync(base).map(n => ({ n, time: fs.statSync(path.join(base, n)).mtimeMs }))
    .sort((a, b) => b.time - a.time).slice(0, 150)
  const records = []
  for (const { n } of newest) {
    const dir = path.join(base, n), log = path.join(dir, 'output.log'), receipt = path.join(dir, 'execution.json')
    if (!fs.existsSync(log) || !fs.existsSync(receipt)) continue
    const text = fs.readFileSync(log, 'utf8')
    let action
    if (text.startsWith('BEFORE 519 main/old exact; protected originals saved; pid=5462')) action = 'before'
    else if (n === 'ea8981daffffa92bf1deb1590d7431bb') action = 'freeze'
    else if (n === '2d149e44ac6ae184b8479cbbb41e4f21') action = 'test'
    else if (text.includes('522 !== 519') && text.includes('copilot-error-prefix-dev-20261022-r1-runner.mjs:126:10')) action = 'initial-before-facility-failure'
    else if (text.startsWith('{"released":true,"stop":true,"results"') && text.includes('copilot-error-prefix.test.tsx') === false) action = 'close'
    if (!action) continue
    const value = json(receipt)
    assert.equal(value.status, 'exited')
    assert.equal(value.outputComplete, true)
    save('executions/' + action + '-' + n + '.json', value)
    save('executions/' + action + '-' + n + '.stdout.txt', text)
    const stderr = path.join(dir, 'stderr.log')
    if (fs.existsSync(stderr)) save('executions/' + action + '-' + n + '.stderr.txt', fs.readFileSync(stderr, 'utf8'))
    records.push({ action, executionId: n, toolPid: value.pid, exitCode: value.exitCode,
      sourceReceipt: receipt, sourceStdout: log })
  }
  for (const required of ['before', 'freeze', 'test', 'initial-before-facility-failure', 'close'])
    assert(records.some(r => r.action === required), 'Missing original receipt: ' + required)
  save('execution-receipts.json', records)
  const closed = json(path.join(out, 'close.json'))
  assert.equal(closed.ownedPidsExited, true)
  const ownDocs = {}
  for (const f of fs.readdirSync(path.join(repo, 'docs/plans'))) if (f.startsWith('copilot-error-prefix-dev-20261022-r1'))
    ownDocs['docs/plans/' + f] = stamp(path.join(repo, 'docs/plans', f))
  save('handoff-seal.json', { at: new Date().toISOString(), source114: stamp(path.join(out, 'source-files.json')),
    complete521: stamp(path.join(out, 'complete-inputs.json')), exactPatch: stamp(path.join(out, 'round-exact.patch')),
    ownDocs, evidence: content(scan(out)), released: true, stop: true, independentVerdict: 'NOT_SIGNED',
    parentGoal: 'CONTINUES', builtOrRuntimeLoaded: false })
  console.log('Original tool receipts and handoff SHA sealed; developer STOP')
} else throw new Error('Use before | freeze | test | close | receipts')

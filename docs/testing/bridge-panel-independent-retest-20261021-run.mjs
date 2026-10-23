import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '../..')
const prefix = 'bridge-panel-independent-retest-20261021'
const pkg = path.join(repo, 'packages/dsh-pm-tool')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const red = '/tmp/pmtool-handshake-red-frozen-20261021'
const statePath = path.join(here, `${prefix}-freeze.json`)
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(dir, entry.name)
  if (entry.isSymbolicLink()) throw new Error(`Refusing source symlink: ${full}`)
  return entry.isDirectory() ? files(full) : [full]
})
const key = [
  'src/client/launch-handshake.ts', 'src/client/panel.tsx', 'src/client/index.tsx',
  'src/client/launch-handshake.test.ts', 'src/client/panel-launch-handshake.test.tsx',
  'vitest.config.ts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json',
]
const snapshot = root => Object.fromEntries(key.map(file => [file, hash(path.join(root, file))]))
const graph = root => Object.fromEntries(files(path.join(root, 'src')).map(file => [
  path.relative(root, file), hash(file),
]))
const capture = file => fs.existsSync(file) ? { file, sha256: hash(file) } : { file, missing: true }
const command = process.argv[2]
const vitestRequire = createRequire(fs.realpathSync(path.join(deps, 'vitest/package.json')))
const archiveEqual = (file, content) => {
  if (fs.existsSync(file)) {
    if (!fs.readFileSync(file).equals(Buffer.from(content))) throw new Error(`Existing archive differs: ${file}`)
  } else fs.writeFileSync(file, content, { flag: 'wx' })
}

if (command === 'freeze') {
  const root = fs.mkdtempSync('/tmp/pmtool-bridge-panel-independent-retest-20261021.')
  const frozen = path.join(root, 'frozen')
  fs.mkdirSync(frozen)
  const before = snapshot(pkg)
  const sourceBefore = graph(pkg)
  fs.cpSync(path.join(pkg, 'src'), path.join(frozen, 'src'), { recursive: true, errorOnExist: true, force: false })
  for (const name of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']) {
    fs.copyFileSync(path.join(pkg, name), path.join(frozen, name), fs.constants.COPYFILE_EXCL)
  }
  const copied = snapshot(frozen)
  const after = snapshot(pkg)
  const sourceAfter = graph(pkg)
  const sourceCopied = graph(frozen)
  const drift = Object.keys(sourceBefore).filter(file =>
    sourceBefore[file] !== sourceCopied[file] || sourceBefore[file] !== sourceAfter[file])
  const keyDrift = key.filter(file => before[file] !== copied[file] || before[file] !== after[file])
  const tracked = spawnSync('git', ['diff', '2a7603023bc54ef13d788e50069ee3fde4671bf3', '--', ...key.map(f => `packages/dsh-pm-tool/${f}`)], { cwd: repo, encoding: 'utf8' })
  archiveEqual(path.join(here, `${prefix}-tracked.patch`), tracked.stdout)
  const originalFiles = [
    '/tmp/pmtool-handshake-red-frozen-20261021.txt',
    '/tmp/pmtool-handshake-red-frozen-20261021-exit.json',
    '/tmp/pmtool-handshake-green-20261021-r2.txt',
    '/tmp/pmtool-handshake-green-20261021-r2-exit.json',
  ]
  const originals = originalFiles.map((file, i) => {
    const item = capture(file)
    if (!item.missing) {
      const archive = path.join(here, `${prefix}-main-${i}${path.extname(file)}`)
      archiveEqual(archive, fs.readFileSync(file))
      item.archive = archive
    }
    return item
  })
  const state = {
    at: new Date().toISOString(), root, frozen, repo, deps,
    head: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout.trim(),
    productBase: '2a7603023bc54ef13d788e50069ee3fde4671bf3',
    scope: key, before, copied, after, sourceBefore, sourceCopied, sourceAfter, drift, keyDrift,
    depsRealpath: fs.realpathSync(deps),
    dependencyIdentity: Object.fromEntries(['vitest', 'react', 'react-test-renderer', 'vite'].map(name => {
      const filename = name === 'vite' ? vitestRequire.resolve('vite/package.json') : path.join(deps, name, 'package.json')
      const data = JSON.parse(fs.readFileSync(filename))
      return [name, { version: data.version, realpath: fs.realpathSync(filename), sha256: hash(filename) }]
    })),
    originals, trackedExit: tracked.status,
  }
  writeJson(statePath, state)
  console.log(JSON.stringify({ root, keyDrift, drift }, null, 2))
  if (keyDrift.length || drift.length) process.exitCode = 1
} else {
  const state = JSON.parse(fs.readFileSync(statePath))
  if (state.keyDrift.length || state.drift.length) throw new Error('Initial freeze drift; no execution allowed')
  if (command === 'check') {
    const current = snapshot(pkg)
    const currentGraph = graph(pkg)
    const frozenGraph = graph(state.frozen)
    const result = {
      at: new Date().toISOString(), current,
      keyDrift: key.filter(file => current[file] !== state.copied[file]),
      importedSourceDrift: Object.keys(state.sourceCopied).filter(file => currentGraph[file] !== state.sourceCopied[file]),
      frozenDrift: Object.keys(state.sourceCopied).filter(file => frozenGraph[file] !== state.sourceCopied[file]),
    }
    const label = process.argv[3] || 'final'
    writeJson(path.join(here, `${prefix}-drift-${label}.json`), result)
    console.log(JSON.stringify(result, null, 2))
    if (result.frozenDrift.length) process.exitCode = 1
  } else if (command === 'run') {
    const label = process.argv[3]
    const kind = process.argv[4] || 'current'
    const target = path.join(state.root, label)
    if (!label || !/^[a-z0-9-]+$/.test(label)) throw new Error('Use unique simple label')
    fs.cpSync(state.frozen, target, { recursive: true, errorOnExist: true, force: false })
    fs.symlinkSync(deps, path.join(target, 'node_modules'))
    const changes = []
    const replace = (file, oldText, newText) => {
      const filename = path.join(target, file)
      const text = fs.readFileSync(filename, 'utf8')
      if (!text.includes(oldText)) throw new Error(`Mutation anchor missing: ${file}`)
      fs.writeFileSync(filename, text.replaceAll(oldText, newText))
      changes.push({ file, oldText, newText, sha256: hash(filename) })
    }
    if (kind === 'legacy') {
      for (const file of ['src/client/launch-handshake.ts', 'src/client/panel.tsx']) {
        fs.copyFileSync(path.join(red, file), path.join(target, file))
        changes.push({ file, source: path.join(red, file), sha256: hash(path.join(target, file)) })
      }
    } else if (kind === 'no-ready') {
      replace('src/client/panel.tsx', 'launchMountRef.current.snapshotReady && parseLaunchToken(window.location.hash)', 'parseLaunchToken(window.location.hash)')
    } else if (kind === 'no-unmount-guard') {
      replace('src/client/panel.tsx', 'if (!launchMountRef.current.active || launchMountRef.current.generation !== generation) return false', 'if (false) return false')
    } else if (kind === 'wrong-finally') {
      replace('src/client/launch-handshake.ts', 'inflight.delete(key)', 'inflight.clear()')
    } else if (kind !== 'current') throw new Error(`Unknown kind ${kind}`)
    const additional = path.join(here, `${prefix}-additional.test.tsx`)
    fs.copyFileSync(additional, path.join(target, 'src/client', path.basename(additional)))
    const config = path.join(target, 'independent.vitest.config.mjs')
    fs.copyFileSync(path.join(here, `${prefix}-config.mjs`), config)
    const before = snapshot(target)
    const beforeGraph = graph(target)
    // Explicit config disables dependency optimization/results caches; all writes stay under this run.
    const args = [
      path.join(deps, 'vitest/vitest.mjs'), 'run',
      'src/client/launch-handshake.test.ts', 'src/client/panel-launch-handshake.test.tsx',
      `src/client/${path.basename(additional)}`, '--config', config,
      '--maxWorkers=1', '--minWorkers=1', '--no-file-parallelism',
      '--reporter=verbose', '--reporter=json', '--outputFile', path.join(target, 'vitest-result.json'),
    ]
    const started = new Date().toISOString()
    const env = {
      PATH: path.dirname(process.execPath) + ':/usr/bin:/bin:/usr/sbin:/sbin',
      HOME: path.join(target, 'home'), TMPDIR: path.join(target, 'tmp'),
      NO_COLOR: '1', FORCE_COLOR: '0', CI: '1',
    }
    fs.mkdirSync(env.HOME)
    fs.mkdirSync(env.TMPDIR)
    const output = spawnSync(process.execPath, args, { cwd: target, env, encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024 })
    const stdout = path.join(here, `${prefix}-${label}-stdout.txt`)
    const stderr = path.join(here, `${prefix}-${label}-stderr.txt`)
    fs.writeFileSync(stdout, output.stdout || '', { flag: 'wx' })
    fs.writeFileSync(stderr, output.stderr || '', { flag: 'wx' })
    const results = path.join(target, 'vitest-result.json')
    let parsed
    if (fs.existsSync(results)) {
      parsed = JSON.parse(fs.readFileSync(results))
      fs.copyFileSync(results, path.join(here, `${prefix}-${label}-vitest.json`), fs.constants.COPYFILE_EXCL)
    }
    const after = snapshot(target)
    const afterGraph = graph(target)
    const record = {
      kind, label, started, ended: new Date().toISOString(), command: [process.execPath, ...args], cwd: target,
      runtime: { node: process.version, platform: process.platform, arch: process.arch, os: os.release() },
      env, exit: output.status, signal: output.signal, error: output.error?.message,
      stdout: capture(stdout), stderr: capture(stderr), config: capture(config), additional: capture(additional),
      before, after, changes,
      sourceDrift: Object.keys(beforeGraph).filter(file => beforeGraph[file] !== afterGraph[file]),
      totals: parsed ? { total: parsed.numTotalTests, passed: parsed.numPassedTests, failed: parsed.numFailedTests, pending: parsed.numPendingTests } : null,
      tests: parsed?.testResults.flatMap(suite => suite.assertionResults.map(test => ({
        file: suite.name, name: test.fullName, status: test.status, failureMessages: test.failureMessages,
      }))),
      result: capture(results),
    }
    writeJson(path.join(here, `${prefix}-${label}-execution.json`), record)
    console.log(JSON.stringify({ label, exit: record.exit, totals: record.totals, sourceDrift: record.sourceDrift }, null, 2))
    process.exitCode = output.status === null ? 2 : output.status
  } else throw new Error('Use freeze, run <label> [kind], check <label>')
}

// 原包tsconfig完整noEmit对照，限定类型检查设施，不认领整dirty产品验收。
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const base = path.join(repo, 'docs/testing/objective-number-independent-retest-20261021')
const latest = JSON.parse(fs.readFileSync(base + '-latest.json', 'utf8'))
const previous = JSON.parse(fs.readFileSync(path.join(latest.archive, 'execution.json'), 'utf8'))
const pkg = path.join(repo, 'packages/dsh-pm-tool')
const own = fs.mkdtempSync(path.join(base + '-selftmp', 'typecheck-'))
const archive = path.join(base + '-evidence', path.basename(own))
fs.mkdirSync(archive)
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const save = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
const files = []
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, e.name)
    if (e.isDirectory()) walk(file)
    else if (e.isFile()) files.push(file)
  }
}
walk(path.join(pkg, 'src'))
for (const name of ['tsconfig.json', 'package.json']) files.push(path.join(pkg, name))
const inputs = Object.fromEntries(files.map(file => [path.relative(pkg, file), {
  sha256: sha(file), bytes: fs.readFileSync(file),
}]))
for (const label of ['current-package', 'frozen-related-package']) {
  const copy = path.join(own, label)
  fs.mkdirSync(copy)
  for (const [rel, identity] of Object.entries(inputs)) {
    const file = path.join(copy, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, identity.bytes)
  }
  fs.symlinkSync(previous.candidate.dependencyRoot, path.join(copy, 'node_modules'), 'dir')
  if (label === 'frozen-related-package') {
    const frozen = JSON.parse(fs.readFileSync(path.join(latest.archive, 'inputs-before.json'), 'utf8'))
    for (const file of Object.keys(frozen).filter(file => file.startsWith(pkg + '/'))) {
      const rel = path.relative(pkg, file)
      if (!inputs[rel]) continue
      const from = path.join(previous.own, 'current/packages/dsh-pm-tool', rel)
      fs.copyFileSync(from, path.join(copy, rel))
      assert.equal(sha(path.join(copy, rel)), frozen[file].sha256)
    }
  }
}
save(path.join(archive, 'inputs-before.json'), Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, v.sha256])))
const runtime = path.join(own, 'runtime')
fs.mkdirSync(runtime)
const guard = path.join(own, 'guard.mjs')
fs.copyFileSync(base + '-guard.mjs', guard)
const env = { PATH: path.dirname(process.execPath) + ':/usr/bin:/bin',
  HOME: runtime, TMPDIR: runtime, DSH_HOME: runtime, DSH_PM_ISOLATED_ROOT: runtime,
  DSH_PM_FILE_ROOT: path.join(runtime, 'files'), DSH_PM_BACKUP_DIR: path.join(runtime, 'backups'),
  PM_STORAGE_ROOT: path.join(runtime, 'storage'), NODE_ENV: 'test',
  QA_OWN: own, QA_AUDIT: path.join(own, 'write-audit.ndjson'), NODE_OPTIONS: `--import=${guard}` }
const commands = []
function execute(id, cwd, args) {
  const at = new Date().toISOString()
  const result = spawnSync(process.execPath, args, { cwd, env, encoding: 'utf8', timeout: 120000,
    maxBuffer: 20 * 1024 * 1024 })
  fs.writeFileSync(path.join(archive, id + '.stdout.txt'), result.stdout ?? '')
  fs.writeFileSync(path.join(archive, id + '.stderr.txt'), result.stderr ?? '')
  commands.push({ id, cwd, executable: process.execPath, argv: args, env, at,
    ended: new Date().toISOString(), exit: result.status, signal: result.signal,
    error: result.error ? String(result.error) : null,
    stdoutSha256: sha(path.join(archive, id + '.stdout.txt')), stderrSha256: sha(path.join(archive, id + '.stderr.txt')) })
  save(path.join(archive, 'commands.json'), commands)
  console.log(`${id} exit=${result.status}\n${result.stdout}${result.stderr}`)
}
for (const label of ['current-package', 'frozen-related-package']) {
  execute(label + '-noEmit', path.join(own, label), ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json', '--noEmit'])
  execute(label + '-showConfig', path.join(own, label), ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json', '--showConfig'])
}
const after = Object.fromEntries(files.map(file => [path.relative(pkg, file), sha(file)]))
save(path.join(archive, 'inputs-after.json'), after)
const changes = Object.keys(inputs).filter(rel => inputs[rel].sha256 !== after[rel])
const original = fs.readFileSync(path.join(archive, 'current-package-showConfig.stdout.txt'), 'utf8')
const frozen = fs.readFileSync(path.join(archive, 'frozen-related-package-showConfig.stdout.txt'), 'utf8')
assert.deepEqual(JSON.parse(original).compilerOptions, JSON.parse(frozen).compilerOptions)
const result = { at: new Date().toISOString(), own, archive, referenceArchive: latest.archive,
  sourceSnapshotCount: files.length, changes, commands,
  compilerOptionsEqual: true, scope: '原package tsconfig完整noEmit对照，不运行实际package build、不签整包/GUI',
  currentFileAssets: after['src/core/file-assets.ts'],
  frozenFileAssets: sha(path.join(own, 'frozen-related-package/src/core/file-assets.ts')) }
save(path.join(archive, 'result.json'), result)
save(base + '-typecheck-result.json', result)
fs.copyFileSync(path.join(own, 'write-audit.ndjson'), path.join(archive, 'write-audit.ndjson'))
console.log(JSON.stringify({ archive, changes, exits: commands.map(c => [c.id, c.exit]) }, null, 2))
process.exitCode = changes.length || commands.some(c => c.exit !== 0) ? 1 : 0

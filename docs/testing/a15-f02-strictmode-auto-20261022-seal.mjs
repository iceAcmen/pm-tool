import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a15-f02-strictmode-auto-20261022')
const r3 = `${prefix}-selftmp/r3`
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const fingerprint = path => {
  const stat = lstatSync(path)
  const bytes = readFileSync(path)
  return { sha256: sha(bytes), bytes: bytes.length, mtimeMs: stat.mtimeMs }
}
function scan(base, follow = true) {
  const result = {}
  const visited = new Set()
  function walk(path) {
    if (!existsSync(path)) return
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) {
      const actual = realpathSync(path)
      result[path] = { realpath: actual }
      if (follow) walk(actual)
    } else if (stat.isDirectory()) {
      const actual = realpathSync(path)
      if (visited.has(actual)) return
      visited.add(actual)
      for (const name of readdirSync(path).sort()) walk(join(path, name))
    } else if (stat.isFile()) result[path] = fingerprint(path)
  }
  walk(base)
  return result
}
const drift = (a, b) => ({
  added: Object.keys(b).filter(k => !(k in a)),
  removed: Object.keys(a).filter(k => !(k in b)),
  changed: Object.keys(a).filter(k => k in b && JSON.stringify(a[k]) !== JSON.stringify(b[k])),
})
const result = {}
const protectedBefore = json(`${r3}/protected-before.json`)
const mutablePlan = `${prefix}-plan.md`
const filtered = Object.fromEntries(Object.entries(protectedBefore).filter(([path]) => path !== mutablePlan))
result.protected = drift(filtered, Object.fromEntries(Object.keys(filtered).map(p => [p, fingerprint(p)])))
const dependency = json(`${r3}/candidate.json`).dependency
result.dependency = drift(json(`${r3}/dependencies-before.json`), scan(dependency))
const shared = json(`${r3}/shared-before.json`)
result.mainLib = drift(shared.mainLibBefore, scan(join(repo, 'packages/dsh-pm-tool/lib')))
result.mainCache = drift(shared.mainCacheBefore, scan(join(repo, 'packages/dsh-pm-tool/node_modules/.vite')))
result.frozen = drift(json(`${r3}/frozen-source-before.json`), scan(`${r3}/frozen/packages/dsh-pm-tool/src`))
for (const [name, value] of Object.entries(result)) {
  assert(Object.values(value).every(a => a.length === 0), `终核保护差异 ${name}`)
}
const reports = {}
for (const round of ['r1', 'r2', 'r3']) {
  reports[round] = {}
  for (const name of ['existing-four', 'independent-supplement']) {
    const base = `${prefix}-selftmp/${round}/${name}`
    const report = json(`${base}.result.json`)
    const command = json(`${base}.command.json`)
    reports[round][name] = { exit: command.exit, passed: report.numPassedTests,
      failed: report.numFailedTests, total: report.numTotalTests, signal: command.signal }
    assert.equal(command.exit, round === 'r1' && name === 'independent-supplement' ? 1 : 0)
    assert.equal(report.numTotalTests, 4)
    assert.equal(report.numPassedTests, round === 'r1' && name === 'independent-supplement' ? 2 : 4)
  }
}
const capability = json(`${r3}/case-evidence/case-1/evidence.json`)
const counts = capability.events.find(e => e.label === 'strict-renderer-capability')
assert.deepEqual(counts.mounted, { renders: 1, effects: ['setup'] })
assert.equal(counts.automaticStrictEffectsObserved, false)
const cases = ['case-2', 'case-3', 'case-4'].map(name => json(`${r3}/case-evidence/${name}/evidence.json`))
for (const c of cases) {
  assert.equal(c.state, 'pass')
  assert.deepEqual(c.consoles, [])
}
const remount = cases[0]
assert.deepEqual(remount.effects, ['setup', 'cleanup', 'setup', 'cleanup'])
assert.equal(remount.events.filter(e => e.label === 'publish').length, 1)
assert.equal(remount.events.find(e => e.label === 'publish').owner, 'new')
const deleteCommand = remount.commands.find(c => c.method === 'DELETE')
assert.deepEqual(deleteCommand.response, { ok: true, removed: true })
assert.equal(remount.commands[0].signalAbortedAtEnd, true)
for (const c of [cases[0], cases[2]]) {
  const saved = c.events.find(e => e.label === 'raw-saved-before-unmount')
  const after = c.events.find(e => e.label === 'saved-after-unmount')
  assert.equal(saved.tables.tasks.length, 1)
  assert.equal(saved.tables.file_assets.length, 1)
  assert.deepEqual(saved.data, after.data)
  assert.deepEqual(saved.files, after.files)
  assert.equal(Object.keys(saved.files).length, 1)
}
const processCheck = spawnSync('/usr/bin/pgrep', ['-fl', 'a15-f02-strictmode-auto-20261022-run.mjs'], {
  cwd: repo, encoding: 'utf8',
})
assert.equal(processCheck.status, 1, '测试runner仍存活；不释放')
const evidenceIndex = scan(`${prefix}-selftmp`, false)
const payload = {
  sealedAt: new Date().toISOString(), node: process.version, platform: process.platform, arch: process.arch,
  protection: result, reports, counts, strictEffects: 'BLOCKED',
  processCheck: { argv: ['/usr/bin/pgrep', '-fl', 'a15-f02-strictmode-auto-20261022-run.mjs'],
    exit: processCheck.status, stdout: processCheck.stdout, stderr: processCheck.stderr },
  evidenceIndex: Object.fromEntries(Object.entries(evidenceIndex).map(([p, value]) => [relative(repo, p), value])),
  currentOwnedInputs: Object.fromEntries(['.md', '-plan.md', '-run.mjs', '-cases.test.tsx', '-seal.mjs']
    .map(suffix => [`${prefix}${suffix}`, fingerprint(`${prefix}${suffix}`)])),
  scope: '有限 SOURCE/AUTO，非自动strict effects/GUI/浏览器input真实属性/RA-F02整门；仅计划完成状态为允许文档差异',
}
const suffix = process.argv[2] ?? ''
assert(['', 'final'].includes(suffix), '仅允许追加 final 封存')
const output = `${prefix}-seal${suffix ? `-${suffix}` : ''}.json`
assert(!existsSync(output), '封存不可覆盖')
writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`)
console.log(JSON.stringify({ protection: result, reports, counts, processExit: processCheck.status,
  evidenceEntries: Object.keys(evidenceIndex).length, result: '有限SOURCE/AUTO证据成立；strictEffects BLOCKED' }))

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, readdirSync, readlinkSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a19-habit-suggestion-okr-independent-retest-20261022'
const out = join(repo, `docs/testing/${prefix}-selftmp/r3`)
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const fields = ['sha256', 'bytes', 'link', 'mtimeMs', 'inode', 'dev']
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(path) {
    const st = lstatSync(path), key = relative(root, path) || '.'
    const meta = { bytes: st.size, mtimeMs: st.mtimeMs, inode: st.ino, dev: st.dev }
    if (st.isSymbolicLink()) result[key] = { ...meta, link: readlinkSync(path) }
    else if (st.isDirectory()) readdirSync(path).sort().forEach(n => walk(join(path, n)))
    else result[key] = { ...meta, sha256: sha(readFileSync(path)) }
  }
  walk(root)
  return result
}
function diff(a, b) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k =>
    !a[k] || !b[k] || fields.some(f => a[k][f] !== b[k][f]))
}
const roots = read(join(out, 'protection-after.json'))
const changes = Object.entries(roots).flatMap(([root, before]) =>
  diff(before, inventory(root)).map(path => ({ root, path })))
const owned = '/private/tmp/pmtool-a19-independent-retest-20261022-r3'
const ownDependencyChanges = diff(read(join(out, 'dependencies/copy-after.json')),
  inventory(join(owned, 'dependencies/node_modules')))
const candidate = read(join(out, 'candidate.json'))
const actualFrozen = Object.fromEntries(candidate.inputs.flatMap(name =>
  Object.entries(inventory(join(candidate.frozen, 'packages/dsh-pm-tool', name))).map(([key, value]) =>
    [`packages/dsh-pm-tool/${name}${key === '.' ? '' : `/${key}`}`, value])))
const frozenChanges = diff(read(join(out, 'frozen-manifest.json')), actualFrozen)
const ps = spawnSync('/bin/ps', ['-p', read(join(out, 'seal.json')).ownPids.join(','),
  '-o', 'pid=,ppid=,command='], { env: { PATH: '/usr/bin:/bin' }, encoding: 'utf8' })
const result = {
  at: new Date().toISOString(), changes, ownDependencyChanges, frozenChanges,
  resourcesReleased: ps.status === 1 && !ps.stdout.trim(),
  processCheck: { argv: ['/bin/ps', '-p', read(join(out, 'seal.json')).ownPids.join(','),
    '-o', 'pid=,ppid=,command='], originalExit: ps.status, stdout: ps.stdout, stderr: ps.stderr },
  reportSha256: sha(readFileSync(join(repo, `docs/testing/${prefix}.md`))),
  previousSealSha256: sha(readFileSync(join(out, 'seal.json'))),
  ownDeliverables: ['.md', '-plan.md', '-cases.test.tsx', '-run.mjs', '-close.mjs', '-check.mjs']
    .map(suffix => {
      const path = `docs/testing/${prefix}${suffix}`
      return { path, sha256: sha(readFileSync(join(repo, path))), bytes: lstatSync(join(repo, path)).size }
    }),
  onlyStaticNamedRootsChecked: true,
}
writeFileSync(join(out, 'final-check.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
assert.deepEqual(changes, [])
assert.deepEqual(ownDependencyChanges, [])
assert.deepEqual(frozenChanges, [])
assert(result.resourcesReleased)
console.log(JSON.stringify({ finalProtectionDrift: 0, ownDependencyDrift: 0,
  frozenDrift: 0, resourcesReleased: true, reportSha256: result.reportSha256 }))

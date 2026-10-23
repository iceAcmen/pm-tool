import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a14-sm01-clean-mixed-gui-review-20261022')
const out = `${prefix}-final-${process.argv[2] || 'r1'}.json`
if (existsSync(out)) throw new Error(`Refuse overwrite: ${out}`)
const sha = b => createHash('sha256').update(b).digest('hex')
const file = p => ({ sha256: sha(readFileSync(p)), mtimeMs: lstatSync(p).mtimeMs })
const audit = JSON.parse(readFileSync(`${prefix}-audit-r1.json`))
const root = join(repo, 'reports/all-pending-evidence-20261021/A14')
const drift = []
for (const [dir, items] of Object.entries(audit.evidenceBefore)) {
  for (const [name, expected] of Object.entries(items)) {
    const p = join(root, dir, name)
    const actual = existsSync(p) ? file(p) : null
    if (!actual || actual.sha256 !== expected.sha256 || actual.mtimeMs !== expected.mtimeMs) {
      drift.push({ path: p, expected, actual })
    }
  }
}
const candidate = JSON.parse(readFileSync(join(root, 'candidate.json')))
for (const [name, hash] of Object.entries({ ...candidate.sourceHashes, ...candidate.artifacts })) {
  const p = join(candidate.tree, name)
  if (!existsSync(p) || file(p).sha256 !== hash) drift.push({ path: p, expected: hash })
}
for (const [name, expected] of [['candidate.json', audit.candidate.manifest], ['product-tracked.patch', audit.candidate.patch]]) {
  const actual = file(join(root, name))
  if (actual.sha256 !== expected.sha256 || actual.mtimeMs !== expected.mtimeMs) drift.push({ path: name, expected, actual })
}
const docs = [`${prefix}.md`, `${prefix}-plan.md`]
const missingLinks = []
for (const p of docs) {
  const text = readFileSync(p, 'utf8')
  for (const m of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (!m[1].includes('://') && !existsSync(resolve(dirname(p), m[1].split('#')[0]))) missingLinks.push({ p, link: m[1] })
  }
}
const syntax = ['audit', 'finalize'].map(n => {
  const argv = ['--check', `${prefix}-${n}.mjs`]
  const result = spawnSync(process.execPath, argv, { cwd: repo, encoding: 'utf8' })
  return { argv: [process.execPath, ...argv], cwd: repo, exit: result.status,
    signal: result.signal, stdout: result.stdout, stderr: result.stderr }
})
const result = { at: new Date().toISOString(), boundary: 'Read-only archived hash/mtime, source/artifact and Markdown link checks; owned script syntax only.',
  protectedOriginalFiles: Object.values(audit.evidenceBefore).reduce((n, v) => n + Object.keys(v).length, 0),
  drift, missingLinks, syntax, ownFiles: Object.fromEntries(
    [...docs, `${prefix}-audit.mjs`, `${prefix}-finalize.mjs`, `${prefix}-audit-r1.json`].map(p => [p, file(p)])) }
writeFileSync(out, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ out, drift, missingLinks, syntax: syntax.map(v => v.exit) }))
if (drift.length || missingLinks.length || syntax.some(v => v.exit !== 0)) process.exitCode = 1

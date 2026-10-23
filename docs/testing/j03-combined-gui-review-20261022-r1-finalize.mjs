import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const own = fileURLToPath(import.meta.url).replace(/-finalize\.mjs$/, '')
const repo = path.resolve(path.dirname(own), '../..')
const root = path.join(repo, 'reports/all-pending-evidence-20261021/CombinedGuiR1')
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const metadata = b => ({ bytes: b.length, sha256: sha(b) })
const read = f => fs.readFileSync(f)
const index = JSON.parse(read(path.join(root, 'j03-index.json')))
const close = JSON.parse(read(own + '-close.json'))
assert.deepEqual(metadata(read(path.join(root, 'j03-index.json'))), close.index)
assert.equal(index.count, 468)
for (const [rel, expected] of Object.entries(index.files)) {
  assert.deepEqual(metadata(read(path.join(root, rel))), expected, rel)
}
const report = read(own + '.md').toString()
const links = [...report.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1])
const missing = links.filter(link => !fs.existsSync(
  path.resolve(path.dirname(own), link.split('#')[0])))
assert.deepEqual(missing, [])
assert.equal((report.match(/^```/gm) || []).length % 2, 0)
assert.equal(report.split('\n').filter(line => /\s+$/.test(line)).length, 0)
const files = {}
for (const suffix of ['.md', '-audit.mjs', '-audit.json', '-close.json', '-finalize.mjs']) {
  files[path.basename(own + suffix)] = metadata(read(own + suffix))
}
const result = {
  at: new Date().toISOString(), mode: 'EVIDENCE_ONLY_FINAL_CHECK',
  index: close.index, declaredFilesUnchanged: 468, files,
  links: { count: links.length, missing }, exitCode: 0,
  historicalCloseReport: close['own.md'],
  boundary: 'Final report includes later link-race disclosure; historical close kept unchanged. No product tests, browser, Git, service or network calls.'
}
fs.writeFileSync(own + '-finalcheck.json', JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ declaredFilesUnchanged: 468, files: Object.keys(files).length,
  links: links.length, missing, report: files[path.basename(own + '.md')], exitCode: 0 }, null, 2))

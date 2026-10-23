import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/a11-overview-done-gui-review-20261021'
const own = `${prefix}-selftmp`
const abs = p => path.resolve(repo, p)
const read = p => fs.readFileSync(abs(p))
const json = p => JSON.parse(read(p).toString())
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const label = process.argv[2]
assert(label && /^[a-z0-9-]+$/.test(label))
const result = { at: new Date().toISOString(), argv: process.argv, cwd: process.cwd(),
  node: process.version, os: process.platform, arch: process.arch, scriptSha: sha(read(`${prefix}-final-check.mjs`)) }
const start = performance.now()
const out = `${own}/${label}.json`
try {
  const supplements = json(`${own}/supplement-inputs-r1.json`)
  for (const [p, expected] of Object.entries(supplements.preserved)) {
    const b = read(p), stat = fs.statSync(abs(p))
    assert.equal(sha(b), expected.sha256, `Partial SHA drift: ${p}`)
    assert.equal(b.length, expected.bytes)
    assert.equal(stat.mtimeMs, expected.mtimeMs)
  }
  const files = fs.readdirSync(abs('docs/testing')).filter(n =>
    n.startsWith(path.basename(prefix)) && /\.(md|mjs|swift)$/.test(n)).map(n => `docs/testing/${n}`)
  const links = [], whitespace = [], fileHashes = {}
  for (const p of files) {
    const b = read(p), text = b.toString()
    fileHashes[p] = sha(b)
    assert(text.endsWith('\n'), `No final newline: ${p}`)
    text.split('\n').forEach((line, i) => {
      if (/[ \t]+$/.test(line)) whitespace.push({ path: p, line: i + 1 })
    })
    if (!p.endsWith('.md')) continue
    for (const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = m[1]
      if (/^(https?:|mailto:|#)/.test(target)) continue
      const local = target.startsWith('file://') ? new URL(target).pathname :
        path.resolve(path.dirname(abs(p)), target.split('#')[0])
      assert(fs.existsSync(local), `Missing link: ${p} -> ${target}`)
      links.push({ from: p, target })
    }
  }
  assert.deepEqual(whitespace, [])
  const jsonFiles = fs.readdirSync(abs(own)).filter(n => n.endsWith('.json')).map(n => `${own}/${n}`)
  for (const p of jsonFiles) json(p)
  const observations = json(`${own}/supplement-observations-r2.json`)
  const visual = json(`${own}/supplement-visual-review.json`)
  const frozen = json(`${own}/supplement-inputs-r1.json`)
  assert.equal(Object.keys(frozen.inputs).length, 557)
  assert.deepEqual(frozen.groups, { 'manual-r2': 259, 'checklist-r2': 131 })
  assert.equal(observations.fixtureEncoding.length, 11)
  assert(observations.fixtureEncoding.every(v => v.matches.length === 1))
  assert.equal(observations.stateChecks.length, 34)
  assert.equal(observations.frameChecks.length, 288)
  const contactHashes = {}
  for (const group of ['manual-r2', 'checklist-r2']) {
    const frames = observations.frameChecks.filter(f => f.group === group)
    assert.equal(frames.length, visual.reviewedFrames[group].count)
    assert.equal(new Set(frames.map(f => f.sha256)).size, visual.reviewedFrames[group].uniqueContentHashes)
    const pages = Array.from({ length: Math.ceil(frames.length / 16) }, (_, i) => i)
    assert.deepEqual(pages, visual.reviewedContactPages[group])
    for (const page of pages) {
      const p = `${own}/contact/${group}-${page}.png`
      contactHashes[p] = sha(read(p))
    }
  }
  assert.equal(Object.keys(contactHashes).length, 19)
  assert.equal(visual.overviewPairs.length, 5)
  for (const pair of visual.overviewPairs) {
    for (const suffix of ['upper', 'lower']) {
      const p = `reports/all-pending-evidence-20261021/A11/objective/${pair.group}/${pair.label}-${suffix}.png`
      assert.equal(sha(read(p)), frozen.inputs[p].sha256)
    }
    assert.equal(pair.upperCardVisibleInBranchFrames, false)
  }
  assert.equal(visual.decision.closeA10OPG01, false)
  result.exit = 0
  result.fileHashes = fileHashes
  result.links = { count: links.length, missing: [], entries: links }
  result.whitespace = whitespace
  result.jsonFiles = jsonFiles
  result.contactHashes = contactHashes
  result.preservedPartial = Object.keys(supplements.preserved)
  result.scope = 'Document/byte/manifest consistency only. Does not infer GUI PASS or run product, browser, build, service or private helpers.'
} catch (error) {
  result.exit = 1
  result.error = error.stack
}
result.finishedAt = new Date().toISOString()
result.elapsedMs = performance.now() - start
fs.writeFileSync(abs(out), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ output: out, exit: result.exit, files: Object.keys(result.fileHashes ?? {}).length,
  links: result.links?.count, json: result.jsonFiles?.length, contact: Object.keys(result.contactHashes ?? {}).length,
  error: result.error }))
process.exitCode = result.exit

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

const prefix = 'docs/testing/a10-finder-reopen-gui-independent-review-20261021'
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const output = `${prefix}-final-check.json`
if (fs.existsSync(output)) throw new Error('Refusing to overwrite prior evidence')
const report = fs.readFileSync(`${prefix}.md`, 'utf8')
const audit = JSON.parse(fs.readFileSync(`${prefix}-r2.json`, 'utf8'))
const links = [...report.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1])
const missingLinks = links.filter(link =>
  !fs.existsSync(path.resolve(path.dirname(prefix), link.split('#')[0])))
const fences = (report.match(/^```/gm) ?? []).length
const drift = Object.entries(audit.fingerprints).flatMap(([name, expected]) => {
  const actual = hash(fs.readFileSync(name))
  return actual === expected ? [] : [{ name, expected, actual }]
})
const evidenceDrift = drift.filter(item => item.name.startsWith(
  'reports/all-pending-evidence-20261021/A10/',
))
const syntax = [`${prefix}-audit.mjs`, `${prefix}-check.mjs`].map(name => {
  const result = spawnSync(process.execPath, ['--check', name], { encoding: 'utf8' })
  return { argv: [process.execPath, '--check', name], exit: result.status,
    signal: result.signal, stdout: result.stdout, stderr: result.stderr }
})
const ok = missingLinks.length === 0 && fences % 2 === 0 &&
  evidenceDrift.length === 0 && syntax.every(result => result.exit === 0)
const result = { at: new Date().toISOString(), node: process.version,
  argv: [process.execPath, `${prefix}-check.mjs`], ok, exit: ok ? 0 : 1,
  reportSha256: hash(report), auditSha256: hash(fs.readFileSync(`${prefix}-r2.json`)),
  checkSourceSha256: hash(fs.readFileSync(`${prefix}-check.mjs`)),
  links: links.length, missingLinks, fences, checkedInputs: Object.keys(audit.fingerprints).length,
  evidenceDrift, otherReferenceDrift: drift.filter(item => !evidenceDrift.includes(item)),
  syntax, boundary: 'Evidence consistency and document checks only; not product or GUI PASS.' }
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify(result, null, 2))
if (!ok) process.exitCode = 1

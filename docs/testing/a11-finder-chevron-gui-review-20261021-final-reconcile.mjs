import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const prefix = fileURLToPath(import.meta.url).replace(/-final-reconcile\.mjs$/, '')
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
const frozen = JSON.parse(fs.readFileSync(`${prefix}-inputs.json`))
const root = path.resolve(path.dirname(prefix), '../..')
const parent = path.join(root, 'reports/all-pending-acceptance-execution-20261021.md')
const current = {}
const differences = []
let parentAppend = null
for (const [file, before] of Object.entries(frozen.files)) {
  const bytes = fs.readFileSync(file)
  const after = { bytes: bytes.length, sha256: sha(bytes) }
  current[file] = after
  if (after.bytes !== before.bytes || after.sha256 !== before.sha256) {
    differences.push({ file, before, after })
    if (file === parent) {
      parentAppend = {
        prefixMatches: sha(bytes.subarray(0, before.bytes)) === before.sha256,
        appendedBytes: bytes.length - before.bytes,
        text: bytes.subarray(before.bytes).toString('utf8'),
        review: 'Expert read the 04:39 appended source/materials/report progress; no change to this A11 Finder authorization, candidate or observations.',
      }
    }
  }
}
const finderRoot = path.join(root, 'reports/all-pending-evidence-20261021/A11/finder')
function list(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? list(path.join(directory, entry.name))
      : entry.isFile() ? [path.join(directory, entry.name)] : [])
}
const finderNow = list(finderRoot)
const added = finderNow.filter((file) => !frozen.files[file])
const removed = Object.keys(frozen.files).filter((file) =>
  file.startsWith(`${finderRoot}${path.sep}`) && !finderNow.includes(file))
const onlyReviewedAppend = differences.length === 1 && differences[0].file === parent &&
  parentAppend?.prefixMatches && parentAppend.appendedBytes > 0 &&
  parentAppend.text.includes('04:39来源重启与资料/固定汇报补采')
const ok = (differences.length === 0 || onlyReviewedAppend) && added.length === 0 && removed.length === 0
const result = {
  at: new Date().toISOString(),
  checked: Object.keys(current).length,
  unchanged: Object.keys(current).length - differences.length,
  differences,
  parentAppend,
  addedFinderFiles: added,
  removedFinderFiles: removed,
  current,
  status: ok ? 'FROZEN_EVIDENCE_UNCHANGED_PARENT_APPEND_REVIEWED' : 'UNRESOLVED_DRIFT',
  previousFinalExit: 1,
  boundary: 'Original exit1 is preserved. Only a byte-proven, expert-read documentary append is reconciled; no candidate or evidence drift is waived.',
}
fs.writeFileSync(`${prefix}-final-check-r2.json`, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ checked: result.checked, unchanged: result.unchanged,
  differences: differences.length, parentAppendOnly: Boolean(onlyReviewedAppend), status: result.status }))
process.exitCode = ok ? 0 : 1

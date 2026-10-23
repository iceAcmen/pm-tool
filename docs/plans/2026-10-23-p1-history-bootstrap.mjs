import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const out = repo + '/reports/all-pending-evidence-20261021/P1HistoryRemainingR1'
const runtime = '/private/tmp/pmtool-p1-history-runtime-20261023-r1'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
await fs.mkdir(out + '/execution-scripts', { recursive: true })
assert(!(await fs.stat(runtime).catch(() => null)), 'Fresh isolated runtime required')
const originalPath = 'reports/all-pending-evidence-20261021/Successor114GuiR1/host-setup-source.mjs'
const original = await fs.readFile(repo + '/' + originalPath, 'utf8')
const adapted = original.replaceAll('/private/tmp/pmtool-successor114-gui-runtime-20261022-r1', runtime)
  .replaceAll('/Successor114GuiR1', '/P1HistoryRemainingR1').replaceAll('3264', '3267')
const executable = '/private/tmp/pmtool-p1-history-host-setup-20261023-r1.mjs'
await fs.writeFile(executable, adapted, { flag: 'wx' })
await fs.writeFile(out + '/host-setup-source.mjs', adapted, { flag: 'wx' })
await fs.writeFile(out + '/setup-provenance.json', JSON.stringify({
  at: new Date().toISOString(), originalPath, originalSha256: sha(original),
  executableSha256: sha(adapted), runtime, port: 3267,
  transformation: 'Only output/runtime/port literals; existing frozen114 unchanged; no build',
}, null, 2), { flag: 'wx' })
const source = 'docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected/F7-backup/pmtool-backup-2026-10-21T14-08-11-424Z.json'
const bytes = await fs.readFile(repo + '/' + source)
assert.equal(sha(bytes), '6de364e671f87c661833110034f1bdf48eefe12b13a75dafda1658835f19c63e')
const fixture = JSON.parse(bytes)
const metadata = 'docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected/F7-fixture.json'
const ids = JSON.parse(await fs.readFile(repo + '/' + metadata)).ids
await fs.writeFile(out + '/original-history-backup.json', bytes, { flag: 'wx' })
await fs.writeFile(out + '/fixture-binding.json', JSON.stringify({
  source, metadata, sha256: sha(bytes), bytes: bytes.length, ids,
  use: ['RA-P1001 absence-only and follow-up refresh', 'RA-P1002 expired historical mute', 'RA-P1006 historical low progress and unassigned read slices'],
  limitations: '23 tasks in six projects, maximum title length 11; not F1 flat24 or FL MAX; no native sessions in standard backup',
  historicalMute: fixture.extra.settings.find(([k]) => k === 'pmQueueMute'),
  historicalTask: fixture.tasks.find(t => t.id === ids['长时低进度']),
  productPrecheckRequired: true,
}, null, 2), { flag: 'wx' })
const originalHarness = await fs.readFile('/private/tmp/pmtool-gui-capture-harness-20261023.mjs', 'utf8')
const helper = originalHarness.replace(
  "import {connect,runtime,textButton} from './pmtool-p0-context-metric-helper-20261023.mjs'",
  "import {connect,textButton} from './pmtool-p0-context-metric-helper-20261023.mjs'\nconst runtime = '" + runtime + "'",
)
await fs.writeFile('/private/tmp/pmtool-p1-history-harness-20261023-r1.mjs', helper, { flag: 'wx' })
await fs.writeFile(out + '/harness-source.mjs', helper, { flag: 'wx' })
await fs.copyFile(repo + '/docs/plans/2026-10-23-p1-history-bootstrap.mjs', out + '/execution-scripts/bootstrap.mjs', fs.constants.COPYFILE_EXCL)
await import(executable)
await fs.writeFile(runtime + '/backups/original-history-backup.json', bytes, { flag: 'wx' })
console.log({ prepared: true, port: 3267, backupSha256: sha(bytes), existingFrozen114: true })

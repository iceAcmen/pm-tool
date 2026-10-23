import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Only read named inputs; only write this clarification's own evidence prefix.
const own = fileURLToPath(import.meta.url).replace(/-audit\.mjs$/, '')
const root = resolve(dirname(own), '../..')
const source = 'packages/dsh-pm-tool/src/'
const fixture = 'docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected/'
const paths = [
  'AGENTS.md',
  'docs/collaboration.md',
  'docs/requirements.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/remaining-acceptance-register-20261021.md',
  'docs/testing/remaining-objective-cases-20261021.md',
  'docs/testing/objective-progress-acceptance.md',
  'docs/testing/p2-6-independent-verification-20261017.md',
  'docs/testing/p2-6-implementation-test-plan-20261017.md',
  'docs/testing/p2-6-deterministic-test-spec-20261017.md',
  'docs/testing/a11-governance-source-gui-review-20261021.md',
  'docs/testing/a12-governance-source-gui-retest-20261021.md',
  'docs/testing/governance-growth-independent-auto-20261021-gui-handoff.md',
  'docs/testing/governance-fix-independent-retest-20261021-gui-handoff.md',
  'docs/testing/governance-growth-independent-auto-20261021-worker.mjs',
  'docs/design/p2-6-storage-decision-20261017.md',
  'reports/all-pending-acceptance-execution-20261021.md',
  `${source}index.ts`,
  `${source}commands/ask.ts`,
  `${source}commands/task.ts`,
  `${source}commands/progress-report.ts`,
  `${source}commands/meeting.ts`,
  `${source}core/provenance.ts`,
  `${source}core/provenance-store.ts`,
  `${source}core/provenance-view.ts`,
  `${source}core/meeting-summarize.ts`,
  `${source}core/wbs-ai.ts`,
  `${source}core/copilot.ts`,
  `${source}core/record-location.ts`,
  `${source}core/ask-projection.ts`,
  `${source}client/panel.tsx`,
  `${source}client/provenance-panel.tsx`,
  `${source}client/shared/drawers/ai-assistant.tsx`,
  `${source}client/shared/drawers/sidecar-portal.tsx`,
  `${fixture}F6-ui-ids.json`,
  `${fixture}F6-ui-expected.json`,
  `${fixture}F6-ui-standard/pmtool-backup-2026-10-21T14-08-30-668Z.json`,
]

function fingerprint(path) {
  const bytes = readFileSync(resolve(root, path))
  return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}

const mode = process.argv[2]
if (mode === 'freeze') {
  if (existsSync(`${own}-inputs.json`)) throw new Error('Refuse to overwrite the initial input snapshot')
  const snapshot = {
    at: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    scope: 'Read-only contract clarification; no product imports, tests, GUI, services or credentials',
    files: paths.map(fingerprint),
  }
  writeFileSync(`${own}-inputs.json`, `${JSON.stringify(snapshot, null, 2)}\n`)
  console.log(JSON.stringify({ at: snapshot.at, inputCount: snapshot.files.length }))
} else if (mode === 'finish') {
  if (existsSync(`${own}-drift-final.json`)) throw new Error('Refuse to overwrite the final drift record')
  const snapshot = JSON.parse(readFileSync(`${own}-inputs.json`, 'utf8'))
  const differences = []
  for (const before of snapshot.files) {
    if (!existsSync(resolve(root, before.path))) {
      differences.push({ path: before.path, state: 'missing' })
      continue
    }
    const after = fingerprint(before.path)
    if (before.sha256 !== after.sha256) differences.push({ path: before.path, before, after })
  }
  const result = { at: new Date().toISOString(), inputCount: snapshot.files.length, differences }
  writeFileSync(`${own}-drift-final.json`, `${JSON.stringify(result, null, 2)}\n`)
  console.log(JSON.stringify(result))
  if (differences.length) process.exitCode = 1
} else {
  throw new Error('Use freeze or finish')
}

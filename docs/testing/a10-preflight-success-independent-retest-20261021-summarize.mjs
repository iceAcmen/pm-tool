import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'

const repo = process.cwd()
const prefix = 'a10-preflight-success-independent-retest-20261021'
const self = join(repo, 'docs/testing', `${prefix}-selftmp`)
const freeze = JSON.parse(readFileSync(join(self, 'freeze.json')))
const sha = value => createHash('sha256').update(value).digest('hex')
const file = path => ({ path: relative(repo, path), sha256: sha(readFileSync(path)), bytes: lstatSync(path).size })
const rounds = ['original-r1', 'independent-r1', 'independent-r2', 'regression-r1',
  'noemit-r1', 'verify-csv', 'verify-import-content', 'verify-r12', 'verify-importmd']
const results = rounds.filter(name => existsSync(join(self, name, 'execution.json'))).map(name => {
  const root = join(self, name)
  const execution = JSON.parse(readFileSync(join(root, 'execution.json')))
  const vitest = existsSync(join(root, 'vitest.json')) ? JSON.parse(readFileSync(join(root, 'vitest.json'))) : null
  const observations = existsSync(join(root, 'observations.jsonl'))
    ? readFileSync(join(root, 'observations.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : []
  return {
    name, originalExit: execution.originalExit, signal: execution.signal, argv: execution.argv,
    cwd: execution.cwd, started: execution.started, ended: execution.ended,
    frozenSourceDrift: execution.frozenSourceDrift, mainSourceDrift: execution.mainSourceDrift,
    watchedUnchanged: execution.watchedUnchanged, originalProbeUnchanged: execution.originalProbeUnchanged,
    ...(vitest ? { files: vitest.testResults.length, passed: vitest.numPassedTests,
      failed: vitest.numFailedTests, pending: vitest.numPendingTests,
      assertions: vitest.testResults.map(test => ({ path: test.name, status: test.status,
        assertions: test.assertionResults.map(item => ({ name: item.fullName, status: item.status, failures: item.failureMessages })) })) } : {}),
    productionHandlerCalls: observations.filter(item => ['command', 'production-command'].includes(item.id)).length,
    i03Closed: observations.filter(item => item.id === 'A10-I03-closed'),
    i10: observations.filter(item => item.id === 'A9-I10'),
    artifacts: ['execution.json', 'stdout.txt', 'stderr.txt', 'vitest.json', 'observations.jsonl',
      'author-import-observations.jsonl', 'vitest.config.mjs', 'a9-original.test.tsx', 'a10-adapted.test.tsx', 'a10-extra.test.ts']
      .filter(name => existsSync(join(root, name))).map(name => file(join(root, name))),
  }
})
function inventory(root) {
  const files = {}
  function visit(path) {
    const st = lstatSync(path)
    if (st.isSymbolicLink()) return
    if (st.isDirectory()) for (const name of readdirSync(path).sort()) visit(join(path, name))
    else files[relative(root, path)] = { sha256: sha(readFileSync(path)), size: st.size }
  }
  visit(root)
  return { exists: true, files }
}
const main = inventory(join(repo, 'packages/dsh-pm-tool/src'))
const currentFrozen = inventory(join(freeze.runRoot, 'src'))
const drift = other => [...new Set([...Object.keys(freeze.source.files), ...Object.keys(other.files)])]
  .filter(path => freeze.source.files[path]?.sha256 !== other.files[path]?.sha256)
const keys = [
  'core/csv-import.ts', 'core/csv-import.test.ts', 'core/ui-feedback.ts', 'core/ui-feedback.test.ts',
  'core/task.ts', 'commands/task.ts', 'client/panel.tsx', 'client/views/tasks.tsx', 'client/views/tasks.css',
  'client/views/tasks-import-confirm.test.tsx', 'client/views/records/records-meeting-form.tsx',
  'client/views/records/records-meeting-entry.test.tsx',
]
const index = {
  role: 'independent-test-expert-A10', at: new Date().toISOString(),
  headBaselineOnly: freeze.head, sourceTreeSha256: freeze.sourceTreeSha256,
  freeze: file(join(self, 'freeze.json')), trackedPatch: file(join(self, 'tracked.patch')),
  newFiles: file(join(self, 'new-files.json')), sourceLoader: file(join(self, 'source-loader.mjs')),
  node: freeze.node, pnpm: freeze.pnpm, dependencies: freeze.dependencies,
  keySourceHashes: Object.fromEntries(keys.map(path => [path, freeze.source.files[path].sha256])),
  frozenSourceDriftAtSummary: drift(currentFrozen), mainSourceDriftAtSummary: drift(main),
  originalContracts: freeze.contracts.map(item => ({
    ...item, currentSha256: sha(readFileSync(join(repo, item.path))),
    unchanged: item.sha256 === sha(readFileSync(join(repo, item.path))),
  })),
  results, GUI: 'NOT_RUN', builds: 'NOT_RUN', release: 'NOT_RUN',
}
writeFileSync(join(self, 'evidence-index.json'), JSON.stringify(index, null, 2))
console.log(JSON.stringify({ sourceTreeSha256: index.sourceTreeSha256, hashes: index.keySourceHashes,
  rounds: results.map(({ name, originalExit, files, passed, failed, pending, watchedUnchanged, productionHandlerCalls }) =>
    ({ name, originalExit, files, passed, failed, pending, watchedUnchanged, productionHandlerCalls })),
  mainDrift: index.mainSourceDriftAtSummary, frozenDrift: index.frozenSourceDriftAtSummary,
  contractDrift: index.originalContracts.filter(item => !item.unchanged).map(item => item.path) }, null, 2))

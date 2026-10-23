import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a13-import-filename-contract-20261021'
const self = join(repo, 'docs/testing', `${prefix}-selftmp`)
const output = join(self, 'evidence-index.json')
assert(!existsSync(output), '禁止覆盖已归档索引')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
function inventory(root) {
  const files = {}
  function walk(path) {
    const st = lstatSync(path)
    if (st.isSymbolicLink()) return
    if (st.isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name))
    else files[relative(root, path)] = { sha256: sha(readFileSync(path)), bytes: st.size }
  }
  walk(root)
  return files
}
const latest = join(self, 'r3')
const candidate = json(join(latest, 'candidate.json'))
const source = inventory(join(repo, 'packages/dsh-pm-tool/src'))
const liveSourceDrift = [...new Set([...Object.keys(source), ...Object.keys(candidate.source.files)])]
  .filter(path => source[path]?.sha256 !== candidate.source.files[path]?.sha256)
const rounds = ['r2', 'r3'].map(round => {
  const root = join(self, round)
  const summary = json(join(root, 'summary.json'))
  return {
    round, candidate: json(join(root, 'candidate.json')), audit: json(join(root, 'audit.json')),
    executions: summary.executions,
    tests: ['fixture', 'base', 'red'].map(label => {
      const results = json(join(root, `${label}.result.json`))
      return { label, passed: results.numPassedTests, failed: results.numFailedTests,
        filteredOut: results.numPendingTests,
        assertions: results.testResults.flatMap(file => file.assertionResults
          .filter(test => ['passed', 'failed'].includes(test.status))
          .map(test => ({ name: test.fullName, status: test.status, messages: test.failureMessages }))) }
    }),
  }
})
const observations = readFileSync(join(latest, 'observations.jsonl'), 'utf8').trim().split('\n')
  .filter(Boolean).map(line => JSON.parse(line))
const focused = observations.filter(item =>
  ['filename-preview', 'json-quote-protocol', 'both-template-capture', 'fixture-validity'].includes(item.id))
  .map(item => {
    const data = item.data
    return { id: item.id, at: item.at, format: data.format, name: data.name,
      size: data.size, sourceHash: data.sourceHash ?? data.hash,
      lineSha256: data.line ? sha(data.line) : undefined,
      result: data.result, preview: data.preview, confirmed: data.confirmed,
      captures: data.captures?.map(line => ({ sha256: sha(line),
        prefix: line.slice(0, 130), endsWithConfirm: line.endsWith(' confirm') })),
      productionAcceptance: data.productionAcceptance }
  })
const processCheck = spawnSync('/bin/ps', ['-axo', 'pid,ppid,command'], { encoding: 'utf8' })
const remainingOwnProcesses = (processCheck.stdout ?? '').split('\n')
  .filter(line => line.includes(`${prefix}-run.mjs`) || line.includes(`${prefix}-selftmp/r3/vitest.config.mjs`))
const index = {
  role: '独立先行合同/red，非修复PASS', at: new Date().toISOString(), prefix,
  setupFailure: { round: 'r1', originalExit: 1, productTestsRun: false,
    reason: '发布包无src/index.ts，自有runner参考路径修正，原件保留' },
  rounds, focusedObservations: focused, allRawObservations: 'r3/observations.jsonl',
  sourceDriftAtHandoff: liveSourceDrift,
  documentationChangesAfterExecution: 'plan勾选状态与red报告属于自有收尾文档；不修改运行时冻结输入/原日志',
  evidenceFiles: inventory(self),
  topLevelDeliverables: Object.fromEntries(readdirSync(join(repo, 'docs/testing'))
    .filter(name => name.startsWith(prefix) && lstatSync(join(repo, 'docs/testing', name)).isFile())
    .map(name => [name, sha(readFileSync(join(repo, 'docs/testing', name)))])),
  remainingOwnProcesses, gui: 'NOT_RUN', services: '未访问/未启停',
  productFilesEdited: false, u4Edited: false, commit: false, released: remainingOwnProcesses.length === 0,
}
writeFileSync(output, `${JSON.stringify(index, null, 2)}\n`)
console.log(JSON.stringify({ index: output, liveSourceDrift, remainingOwnProcesses,
  results: rounds.map(round => ({ round: round.round, tests: round.tests.map(test =>
    ({ label: test.label, passed: test.passed, failed: test.failed, filteredOut: test.filteredOut })) })) }, null, 2))
process.exitCode = liveSourceDrift.length || remainingOwnProcesses.length ? 1 : 0

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const repo = process.cwd()
const self = join(repo, 'reports/a10-import-preflight-developer-20261021-selftmp')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const red = read(join(self, 'red/freeze.json'))
const green = read(join(self, 'green/freeze.json'))
const changes = Object.keys(green.source).filter(path => green.source[path].sha256 !== red.source[path]?.sha256)
const rounds = readdirSync(self).filter(name => existsSync(join(self, name, 'execution.json'))).map(name => {
  const execution = read(join(self, name, 'execution.json'))
  const json = join(self, name, 'vitest.json')
  const tests = existsSync(json) ? read(json) : null
  const evidence = ['execution.json', 'stdout.txt', 'stderr.txt', 'vitest.json', 'observations.jsonl']
    .filter(file => existsSync(join(self, name, file))).map(file => ({
      path: `${name}/${file}`, sha256: sha(readFileSync(join(self, name, file))),
    }))
  return { name, argv: execution.argv, cwd: execution.cwd, exit: execution.exit, signal: execution.signal,
    sourceHash: execution.sourceHash, testHash: execution.testHash, probeHash: execution.probeHash,
    frozenUnchanged: execution.frozenUnchanged, watchedUnchanged: execution.watchedUnchanged,
    tests: tests ? { passed: tests.numPassedTests, failed: tests.numFailedTests, pending: tests.numPendingTests,
      assertions: tests.testResults.flatMap(file => file.assertionResults.map(test => ({
        name: test.fullName, status: test.status,
      }))) } : null, evidence }
})
const claimed = ['packages/dsh-pm-tool/src/core/csv-import.ts', 'packages/dsh-pm-tool/src/core/csv-import.test.ts']
const result = {
  role: 'developer-A9-F02', independentSignoff: '未作判定', at: new Date().toISOString(), baseline: green.head,
  redSourceHash: red.sourceHash, greenSourceHash: green.sourceHash, redToGreenChanges: changes,
  claimed: claimed.map(path => ({ path, currentSha256: sha(readFileSync(join(repo, path))),
    frozenSha256: sha(readFileSync(join(green.runRoot, path.replace('packages/dsh-pm-tool/', '')))) })),
  rounds,
  originalI10: '预览现已正确拒绝，既有页面清空 confirm；原测试仍点击确认按钮而失败。原件与日期 oracle 未修改，待专家核定适配。',
  gui: 'NOT_RUN', build: 'NOT_RUN', fullVerify: 'NOT_RUN', commit: '未执行', push: '未执行',
}
writeFileSync(join(self, 'evidence-index.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify({ changes, claimed: result.claimed,
  rounds: rounds.map(({ name, exit, tests, frozenUnchanged, watchedUnchanged }) => ({
    name, exit, passed: tests?.passed, failed: tests?.failed, pending: tests?.pending, frozenUnchanged, watchedUnchanged,
  })) }, null, 2))

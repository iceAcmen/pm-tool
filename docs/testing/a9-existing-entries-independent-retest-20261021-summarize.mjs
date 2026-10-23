import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const prefix = 'a9-existing-entries-independent-retest-20261021'
const base = join(process.cwd(), 'docs/testing', `${prefix}-selftmp`)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const readJson = path => JSON.parse(readFileSync(path, 'utf8'))
const freeze = readJson(join(base, 'freeze.json'))
const rounds = readdirSync(base).filter(name => existsSync(join(base, name, 'execution.json'))).sort().map(name => {
  const root = join(base, name)
  const execution = readJson(join(root, 'execution.json'))
  const vitest = existsSync(join(root, 'vitest.json')) ? readJson(join(root, 'vitest.json')) : undefined
  return { round: name, command: execution.command, cwd: execution.cwd, originalExit: execution.originalExit,
    signal: execution.signal, passed: vitest?.numPassedTests, failed: vitest?.numFailedTests,
    skipped: vitest?.numPendingTests, frozenSourceDrift: execution.frozenSourceDrift,
    mainSourceDrift: execution.mainSourceDrift, watchedUnchanged: execution.watchedUnchanged,
    originalProbeUnchanged: execution.originalProbeUnchanged,
    tests: vitest?.testResults.flatMap(result => result.assertionResults.map(test => ({
      file: result.name, name: test.fullName, status: test.status, failureMessages: test.failureMessages,
    }))),
    artifacts: Object.fromEntries(['execution.json', 'stdout.txt', 'stderr.txt', 'vitest.json',
      'observations.jsonl', 'author-import-observations.jsonl', 'probe.test.tsx', 'original-probe-copy.test.tsx']
      .filter(file => existsSync(join(root, file))).map(file => [file, {
        path: join(root, file), sha256: sha(readFileSync(join(root, file))),
      }])),
  }
})
const observations = readFileSync(join(base, 'independent-r4/observations.jsonl'), 'utf8')
  .trim().split('\n').map(JSON.parse)
const sourceNow = Object.fromEntries(Object.entries(freeze.source.files).map(([path, info]) => {
  const file = join(freeze.repo, 'packages/dsh-pm-tool/src', path)
  return [path, { frozen: info.sha256, current: existsSync(file) ? sha(readFileSync(file)) : null }]
}))
const summary = {
  role: 'independent-test-expert', createdAt: new Date().toISOString(), frozenAt: freeze.frozenAt,
  baselineHead: freeze.head, sourceTreeSha256: freeze.sourceTreeSha256,
  freezeSha256: sha(readFileSync(join(base, 'freeze.json'))), dependencies: freeze.dependencies,
  sourceNowDrift: Object.entries(sourceNow).filter(([, value]) => value.frozen !== value.current),
  currentHead: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
  driftInterpretation: 'Main三行只改备份/恢复prefixFeedbackOnce；commandAccepted/五指定LG产品文件未变。原冻结LG证据有效，不重跑全LG；prefix不是本任务。A9/build早于prefix，不冒称A10或新bundle。',
  rounds, observations: observations.filter(row => row.id !== 'command'),
  productionCommandCalls: observations.filter(row => row.id === 'command').length,
  freeze: join(base, 'freeze.json'),
  forbiddenActionsNotRun: ['fetch/pull', 'install', 'build', 'GUI', 'service', 'credentials', 'commit/push'],
  conclusions: { lg01: '入口有限PASS；主保存错误词组合FAIL', lg01b: 'FAIL（错误词组合）',
    lg04: 'SOURCE/AUTO PASS', lg05Confirm: '合法确认/取消/busy/未执行失败重试有限PASS',
    lg05Invalid: 'FAIL（非法日期preview/后行非法半写）', gui: 'NOT_RUN', wholeA9: 'FAIL' },
}
const out = join(process.cwd(), 'docs/testing', `${prefix}-evidence-index.json`)
writeFileSync(out, JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify({ out, sha256: sha(readFileSync(out)), calls: summary.productionCommandCalls,
  sourceNowDrift: summary.sourceNowDrift, rounds: rounds.map(r => ({
    round: r.round, exit: r.originalExit, passed: r.passed, failed: r.failed, skipped: r.skipped,
  })) }))

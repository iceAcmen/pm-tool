// Main唯一builder：原六修已验证执行器的有限派生；独立源门审结后才运行。
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const priorOut = repo + '/reports/all-pending-evidence-20261021/CombinedSixRepairsR1'
const priorFreeze = '/private/tmp/pmtool-combined-six-repairs-20261023-r1'
const out = repo + '/reports/all-pending-evidence-20261021/CombinedF02RepairR2'
const freeze = '/private/tmp/pmtool-combined-f02-repair-20261023-r2'
const node = '/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const mode = process.argv[2]
assert(['freeze', 'tsc', 'bundle', 'noemit', 'full', 'dom', 'special', 'verify', 'guard', 'close'].includes(mode))
const reportName = 'f02-option-default-source-auto-20261023-r2-report.md'
const report = fs.readFileSync(repo + '/docs/testing/' + reportName)
const supplementalName = 'f02-related28-infrastructure-retest-20261023-r3-report.md'
const supplemental = fs.readFileSync(repo + '/docs/testing/' + supplementalName)
if (mode === 'freeze') {
  assert(!fs.existsSync(out), '新候选证据根不可覆盖')
  assert(!fs.existsSync(freeze), '新freeze不可覆盖')
}
fs.mkdirSync(out, { recursive: true })
const save = (name, value) => fs.writeFileSync(out + '/' + name,
  typeof value === 'string' ? value : JSON.stringify(value, null, 2), { flag: 'wx' })
const original = fs.readFileSync(priorOut + '/executor-source.mjs', 'utf8')
let code = original
const changes = []
function replaceOnce(from, to) {
  assert.equal(code.split(from).length, 2, '派生必须唯一匹配：' + from)
  code = code.replace(from, to); changes.push({ from, to })
}
replaceOnce('const out = "' + priorOut + '"', 'const out = ' + JSON.stringify(out))
replaceOnce('const freeze = "' + priorFreeze + '"', 'const freeze = ' + JSON.stringify(freeze))
replaceOnce('const old = "/private/tmp/pmtool-combined-successor114-20261022-r1"', 'const old = ' + JSON.stringify(priorFreeze))
replaceOnce('"/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedSuccessor114R1/source-files.json"',
  JSON.stringify(priorOut + '/source-files.json'))
replaceOnce('"/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedSuccessor114R1/complete-inputs.json"',
  JSON.stringify(priorOut + '/complete-inputs.json'))
replaceOnce('"p2004-kr-related-source-auto-20261023-r2-report.md"];',
  '"p2004-kr-related-source-auto-20261023-r2-report.md",' + JSON.stringify(reportName) + ',' + JSON.stringify(supplementalName) + '];')
replaceOnce("save('parent114-source-files.json',parent)", "save('parent-six-source-files.json',parent)")
replaceOnce("save('parent114-to-current-inputs.json'", "save('parent-six-to-current-inputs.json'")
replaceOnce("  save('parent-six-source-files.json',parent);save('complete-inputs.json',before);", `
  assert.equal(Object.keys(priorInputs).length,525);
  assert.deepEqual(delta.map(x=>x.name).sort(),[
    'src/client/views/records/records-deliverable-pointer-dom.test.tsx',
    'src/client/views/records/records-listbox.tsx']);
  save('parent-six-source-files.json',parent);save('complete-inputs.json',before);`)
const executor = out + '/executor-source.mjs'
if (!fs.existsSync(executor)) {
  assert.equal(mode, 'freeze')
  save('derivation.json', { at: new Date().toISOString(), priorExecutor: priorOut + '/executor-source.mjs',
    priorSha256: sha(original), executorSha256: sha(code), changes,
    independentSourceReport: { name: reportName, bytes: report.length, sha256: sha(report) },
    independentRelated28Report: { name: supplementalName, bytes: supplemental.length, sha256: sha(supplemental) },
    gate: 'Main必须先实读R2 SOURCE/DOM9与R3 related28有限结论；文件存在本身不构成PASS。',
    sequencing: 'full成功产合法fixture后才special，原用例/设施不改。' })
  save('executor-source.mjs', code)
} else assert.equal(fs.readFileSync(executor, 'utf8'), code, '封存执行器不可变')
const startedAt = new Date().toISOString()
const r = spawnSync(node, [executor, mode], { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  env: { PATH: path.dirname(node) + ':/usr/bin:/bin:/usr/sbin:/sbin', LANG: 'zh_CN.UTF-8' } })
save(mode + '-outer-receipt.json', { argv: [node, executor, mode], cwd: repo, startedAt, endedAt: new Date().toISOString(),
  pid: r.pid, exitCode: r.status, signal: r.signal, error: r.error?.message ?? null, executorSha256: sha(code) })
save(mode + '-outer-stdout.txt', r.stdout ?? '')
save(mode + '-outer-stderr.txt', r.stderr ?? '')
console.log({ mode, exitCode: r.status, signal: r.signal, stdoutTail: r.stdout?.slice(-2000), stderrTail: r.stderr?.slice(-2000) })
process.exitCode = r.status ?? 2

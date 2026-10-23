import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const own = join(here, 'material-progress-ref-independent-retest-20261022-r1-selftmp/r1')
const read = name => JSON.parse(readFileSync(join(own, name)))
const sha = b => createHash('sha256').update(b).digest('hex')
const target = 'src/client/shared/task-draft-materials.tsx'
const test = 'src/client/shared/task-draft-materials-refs-dom.test.tsx'
const frozen = join(own, 'frozen/packages/dsh-pm-tool')
const candidate = read('candidate.json')
const red = read('history/developer/red/candidate.json')
const a = red.inputs, b = candidate.inputs
const delta = { added: Object.keys(b).filter(k => !(k in a)), removed: Object.keys(a).filter(k => !(k in b)),
  changed: Object.keys(a).filter(k => k in b && JSON.stringify(a[k]) !== JSON.stringify(b[k])) }
assert.deepEqual(delta, { added: [test], removed: [], changed: [target] })
const sourceRed = join(candidate.source, '../../../../red/frozen/packages/dsh-pm-tool')
let patch = ''
const commands = []
for (const n of [test, target]) {
  const argv = ['-u', '--label', `a/packages/dsh-pm-tool/${n}`, '--label', `b/packages/dsh-pm-tool/${n}`,
    n === test ? '/dev/null' : join(sourceRed, n), join(frozen, n)]
  const r = spawnSync('/usr/bin/diff', argv, { encoding: 'utf8', env: { PATH: '/usr/bin:/bin', LANG: 'C' } })
  assert.equal(r.status, 1, r.stderr)
  patch += r.stdout
  commands.push({ argv: ['/usr/bin/diff', ...argv], pid: r.pid, exit: r.status,
    meaning: 'diff exit1表示预期两文件差异，不是产品测试失败' })
}
assert.equal(sha(patch), candidate.patchSha256)
assert.equal(patch, readFileSync(join(own, 'history/developer/increment.patch'), 'utf8'))
const original = 'material-progress-ref-crash-20261022-r1-cases.test.tsx'
const tests = [original, test, ...read('affected-list.json')].map(path => {
  const actual = sha(readFileSync(join(frozen, path)))
  assert.equal(actual, b[path].sha256)
  return { path, sha256: actual }
})
writeFileSync(join(own, 'source-increment.patch'), patch, { flag: 'wx' })
const out = { delta, patchSha256: sha(patch), exactDeveloperIncrement: true, commands,
  baselineCommit: candidate.baselineCommit, frozenInputCount: candidate.inputCount,
  ownedFiles: [target, test].map(path => ({ path, ...b[path] })), allExecutedTestOriginals: tests,
  originalSevenUnchangedFromRed: a[original].sha256 === b[original].sha256,
  review: {
    standards: '本独立专家窄审：局部变量/同步checked/既有会话边界，无新增依赖或全局状态；无阻断发现',
    spec: '本独立专家窄审：原地journal每次render重算；updater仅读布尔快照，原保存/清理无改；无阻断发现',
    sourceRanges: ['task-draft-materials.tsx:186-199', 'task-draft-materials.tsx:429-432'],
    nonClaim: '双轴方法由同一角色执行，不冒称两个并行review专家；不替代GUI/整域门',
    vendor: read('vendor-integrity.json'),
    skippedByAuthorization: ['Git', 'setup', '另派角色/写他人路径', '产品修改', 'build/GUI'],
  },
  node: process.version, pid: process.pid, argv: process.argv, exitOnSuccess: 0,
}
writeFileSync(join(own, 'source-audit.json'), `${JSON.stringify(out, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ delta, exactDeveloperIncrement: true, patchSha256: out.patchSha256,
  executedTestFiles: tests.length, originalSevenUnchanged: out.originalSevenUnchangedFromRed }))

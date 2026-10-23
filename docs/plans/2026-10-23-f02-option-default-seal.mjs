import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const pkg = path.join(repo, 'packages/dsh-pm-tool')
const root = path.join(repo, 'reports/all-pending-evidence-20261021/F02OptionDefaultDevelopmentR2')
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const info = p => { const b = fs.readFileSync(p); return { bytes: b.length, sha256: sha(b) } }
const put = (rel, value) => fs.writeFileSync(path.join(root, rel), JSON.stringify(value, null, 2), { flag: 'wx' })
const json = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const complete = json(path.join(root, 'baseline-complete-inputs.json'))
const delta = []
for (const [rel, before] of Object.entries(complete)) {
  const after = info(path.join(pkg, rel))
  if (before.sha256 !== after.sha256) delta.push({ path: rel, before, after })
}
assert.deepEqual(delta.map(x => x.path).sort(), ['src/client/views/records/records-deliverable-pointer-dom.test.tsx', 'src/client/views/records/records-listbox.tsx'])
const test = 'src/client/views/records/records-deliverable-pointer-dom.test.tsx'
const beforeTest = fs.readFileSync(path.join(root, 'baseline-source', test), 'utf8')
const afterTest = fs.readFileSync(path.join(pkg, test), 'utf8')
assert(afterTest.startsWith(beforeTest.slice(0, beforeTest.lastIndexOf('\n})'))), '原D01–D07不得改')
const commands = []
for (const rel of ['docs/plans/2026-10-23-f02-option-default-run.mjs', 'docs/plans/2026-10-23-f02-option-default-seal.mjs']) {
  const argv = [process.execPath, '--check', path.join(repo, rel)]
  const r = spawnSync(argv[0], argv.slice(1), { cwd: repo, encoding: 'utf8' })
  commands.push({ argv, exit: r.status, signal: r.signal, stdout: r.stdout, stderr: r.stderr })
  assert.equal(r.status, 0)
}
const git = spawnSync('git', ['diff', '--check'], { cwd: repo, encoding: 'utf8' })
assert.equal(git.status, 0, git.stdout + git.stderr)
commands.push({ argv: ['git', 'diff', '--check'], exit: git.status, signal: git.signal, stdout: git.stdout, stderr: git.stderr })
const protectedReferences = ['docs/plans/2026-10-23-f02-option-default-repair.md', 'docs/plans/2026-10-23-f02-option-default-development.md',
  'docs/plans/2026-10-23-f02-option-default-run.mjs', 'docs/plans/2026-10-23-f02-option-default-seal.mjs',
  'docs/testing/six-repairs-pointer-gui-review-20261023-r1-report.md',
  'reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/index-r1.json',
  'reports/all-pending-evidence-20261021/P3004NegativeGuiR1/index-r1.json',
  'reports/all-pending-evidence-20261021/SixRepairsL2GuiR1/index-r1.json',
  'reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/index-r1.json']
// 原L2目录名以真实现有目录核，不猜造替代。
const references = protectedReferences.map(rel => ({ path: rel, ...info(path.join(repo, rel)) }))
put('development-check.json', { at: new Date().toISOString(), baselineInputs: 525, unchangedInputs: 523,
  delta, originalSevenUnchanged: true, references, commands, exit: 0, independentSourceAutoGui: 'PENDING' })
const files = {}
function walk(dir, prefix = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.posix.join(prefix, e.name), p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, rel)
    else { assert(e.isFile(), rel); files[rel] = info(p) }
  }
}
walk(root)
put('index-r2.json', { at: new Date().toISOString(), files, count: Object.keys(files).length,
  baselineCommit: '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd', boundary: 'Main开发自测封件；非独立PASS。' })
put('seal-r2.json', { at: new Date().toISOString(), index: info(path.join(root, 'index-r2.json')), members: Object.keys(files).length,
  commands, productBuildGui: 'NOT_RUN', independent: 'PENDING' })
console.log({ members: Object.keys(files).length, delta: delta.map(x => x.path), syntax: 2, gitDiffCheck: git.status, exit: 0 })

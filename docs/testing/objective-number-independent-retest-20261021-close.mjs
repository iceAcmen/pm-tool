// 只读产品及已有原证，写本前缀封存证明；不运行产品或修改共享内容。
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const base = path.join(repo, 'docs/testing/objective-number-independent-retest-20261021')
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const old = read(base + '-evidence/run-BgYW1S/execution.json')
const current = read(base + '-result.json')
const latest = read(base + '-latest.json')
const typecheck = read(base + '-typecheck-result.json')
const ts = createRequire(path.join(old.candidate.dependencyRoot, 'typescript/package.json'))('typescript')
const relative = 'packages/dsh-pm-tool/src/core/file-assets.ts'
const oldFile = path.join(old.own, 'current', relative)
const newFile = path.join(latest.own, 'current', relative)
const before = fs.readFileSync(oldFile, 'utf8')
const after = fs.readFileSync(newFile, 'utf8')
assert.equal(before.replace('let ancestor = sep', 'let ancestor: string = sep'), after)
const options = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
const oldJs = ts.transpileModule(before, { compilerOptions: options }).outputText
const newJs = ts.transpileModule(after, { compilerOptions: options }).outputText
assert.equal(oldJs, newJs, '仅类型声明不改变JS行为')
assert.equal(current.compileExit, 0)
assert.equal(typecheck.commands.find(c => c.id === 'current-package-noEmit').exit, 0)
assert.equal(typecheck.commands.find(c => c.id === 'current-package-noEmit').signal, null)
assert.equal(typecheck.commands.find(c => c.id === 'current-package-noEmit').error, null)
const issues = []
for (const c of typecheck.commands) {
  assert.equal(sha(path.join(typecheck.archive, c.id + '.stdout.txt')), c.stdoutSha256)
  assert.equal(sha(path.join(typecheck.archive, c.id + '.stderr.txt')), c.stderrSha256)
}
assert.equal(fs.readFileSync(path.join(typecheck.archive, 'current-package-noEmit.stdout.txt'), 'utf8'), '')
assert.equal(fs.readFileSync(path.join(typecheck.archive, 'current-package-noEmit.stderr.txt'), 'utf8'), '')
for (const [rel, identity] of Object.entries({ ...current.candidate.products, ...current.candidate.newTests })) {
  assert.deepEqual(identity, { ...old.candidate.products, ...old.candidate.newTests }[rel])
  assert.equal(sha(path.join(repo, 'packages/dsh-pm-tool', rel)), identity.sha256)
}
assert.equal(sha(path.join(repo, relative)), sha(newFile))
assert.equal(current.candidate.patchSha256, old.candidate.patchSha256)
const index = read(path.join(latest.archive, 'sha256-index.json'))
for (const [name, expected] of Object.entries(index)) assert.equal(sha(path.join(latest.archive, name)), expected)
const mainDoc = base + '.md'
const text = fs.readFileSync(mainDoc, 'utf8')
assert.ok(text.endsWith('\n'))
for (const [i, line] of text.split('\n').entries()) if (/[ \t]+$/.test(line)) issues.push(`行尾空白:${i + 1}`)
for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
  if (/^(https?:|file:)/.test(match[1])) continue
  const file = path.resolve(path.dirname(mainDoc), match[1].split('#')[0])
  if (!fs.existsSync(file)) issues.push(`本地链接缺失:${match[1]}`)
}
assert.deepEqual(issues, [])
const result = { at: new Date().toISOString(), oldArchive: path.basename(old.archive),
  newArchive: path.basename(latest.archive), oldFileAssetsSha256: sha(oldFile),
  newFileAssetsSha256: sha(newFile),
  diff: { before: 'let ancestor = sep', after: 'let ancestor: string = sep', owner: 'Main' },
  emittedJsIdentical: true, emittedJsSha256: createHash('sha256').update(newJs).digest('hex'),
  opEightUnchanged: true, compileExit: current.compileExit,
  fullPackageConfigNoEmitExit: 0, typecheckSourceChanges: typecheck.changes,
  typecheckArchive: path.basename(typecheck.archive),
  noEmitConfig: '原package tsconfig.json完整自有副本；非package build',
  mixedOldDiagnostic: '旧闭包叠新全包额外ask TS2554，不作当前产品/旧整包判定',
  reportIssues: issues, checkedArchiveFiles: Object.keys(index).length,
  verdict: 'OP三缺陷SOURCE/AUTO有限PASS；GNHD结构有限PASS/视觉FAIL_OPEN；类型失败仅依赖历史，修后编译复验关闭；整门未放行' }
fs.writeFileSync(base + '-closure.json', JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))

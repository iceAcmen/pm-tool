import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = '2026-10-23-p1005-deliverable-pointer-'
const directory = join(repo, 'docs/plans')
const digest = file => createHash('sha256').update(readFileSync(file)).digest('hex')
const round = process.argv[2]
if (round && round !== 'r2') throw new Error('未知检查轮')
const sealPath = join(directory, prefix + (round ? 'seal-r2.json' : 'seal.json'))
const outputPath = join(directory, prefix + (round ? 'final-check-r2.json' : 'final-check.json'))
const seal = JSON.parse(readFileSync(sealPath, 'utf8'))
const failures = []
for (const file of [...seal.outputs, ...seal.tmpOutputs, seal.newTest]) {
  const path = join(repo, file.path)
  if (!existsSync(path) || readFileSync(path).length !== file.bytes || digest(path) !== file.sha256) {
    failures.push({ type: 'output-drift', path: file.path })
  }
}
const documents = ['plan.md', 'report.md', 'pilot.md']
let linksChecked = 0
for (const name of documents) {
  const path = join(directory, prefix + name)
  const text = readFileSync(path, 'utf8')
  if (!text.endsWith('\n') || /[ \t]+$/m.test(text)) failures.push({ type: 'format', path })
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0]
    if (!target || /^[a-z]+:\/\//i.test(target)) continue
    linksChecked++
    const resolved = resolve(dirname(path), target)
    if (resolved !== outputPath && !existsSync(resolved)) failures.push({ type: 'broken-link', path, target })
  }
}
const baseline = JSON.parse(readFileSync(join(directory, prefix + 'baseline.json'), 'utf8'))
for (const file of baseline.inputs) {
  const expected = seal.productDelta.find(d => d.before.path === file.path)?.after ?? file
  if (digest(join(repo, file.path)) !== expected.sha256) failures.push({ type: 'input-drift', path: file.path })
}
if (seal.unexpectedDrift.length || !seal.testMatchesGreen) failures.push({ type: 'seal-failed' })
const result = { command: [process.execPath, fileURLToPath(import.meta.url), ...(round ? [round] : [])], cwd: repo,
  sealSha256: digest(sealPath), outputsChecked: seal.outputs.length + seal.tmpOutputs.length + 1,
  inputsChecked: baseline.inputs.length, linksChecked, failures, exit: failures.length ? 1 : 0,
  boundary: '自有字节/链接/格式校验，不是GUI/专家/总门。同步测试子进程已退出，无本单服务锁。' }
writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
if (!existsSync(outputPath)) throw new Error('本轮自引用输出未实际生成')
console.log(JSON.stringify(result, null, 2))
process.exitCode = result.exit

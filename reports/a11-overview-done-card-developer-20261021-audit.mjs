/**
 * 本限定交接的只读回核与证据输出，不构建、不运行 GUI、不签独立 PASS。
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'reports/a11-overview-done-card-developer-20261021'
const evidence = `${prefix}-evidence`
const json = path => JSON.parse(readFileSync(join(repo, path), 'utf8'))
const hash = path => {
  const bytes = readFileSync(join(repo, path))
  return { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length }
}
const commands = []
function run(executable, argv) {
  const start = new Date().toISOString()
  const result = spawnSync(executable, argv, { cwd: repo, encoding: 'utf8' })
  commands.push({ executable, argv, cwd: repo, start, end: new Date().toISOString(),
    exit: result.status, signal: result.signal, stdout: result.stdout, stderr: result.stderr })
  assert.equal(result.status, 0)
  return result.stdout
}

const current = json(`${evidence}/regression/sourcehash.json`)
const sourceReadback = {}
for (const path of [
  'src/client/views/overview.tsx', 'src/client/views/overview-done-card.test.tsx',
  'src/core/war-room.ts',
]) {
  sourceReadback[path] = hash(`packages/dsh-pm-tool/${path}`)
  assert.equal(sourceReadback[path].sha256, current[path].sha256)
}
const baseline = json(`${evidence}/red/sourcehash.json`)
assert.equal(baseline['src/core/war-room.ts'].sha256, current['src/core/war-room.ts'].sha256)
assert.equal(baseline['src/client/views/overview.tsx'].sha256,
  '17391f8a308926b0d559a1a346b9e4946f7c2054ba251458ffeb0c44b5c4c67e')
for (const [stage, passed, failed, pending, exit] of [
  ['red', 0, 1, 9, 1], ['green', 27, 0, 0, 0], ['regression', 45, 0, 0, 0],
]) {
  const result = json(`${evidence}/${stage}/vitest-result.json`)
  assert.equal(result.numPassedTests, passed)
  assert.equal(result.numFailedTests, failed)
  assert.equal(result.numPendingTests, pending)
  assert.equal(json(`${evidence}/${stage}/command.json`).exit, exit)
  assert.deepEqual(json(`${evidence}/${stage}/source-after.json`).drift, [])
}
run(process.execPath, ['--check', `${prefix}-run.mjs`])
run(process.execPath, ['--check', `${prefix}-audit.mjs`])
run('git', ['diff', '--check', '--', 'packages/dsh-pm-tool/src/client/views/overview.tsx', `${prefix}*`])
run(process.execPath, ['packages/dsh-pm-tool/scripts/verify-external-skills.mjs'])
const paths = run('git', ['ls-files', '--others', '--exclude-standard', '-z', '--',
  'packages/dsh-pm-tool/src/client/views/overview-done-card.test.tsx', `${prefix}*`])
  .split('\0').filter(Boolean)
const newFiles = {}
for (const path of paths) {
  assert(path === 'packages/dsh-pm-tool/src/client/views/overview-done-card.test.tsx' || path.startsWith(prefix))
  newFiles[path] = hash(path)
  if (/\.(?:md|mjs|mts|tsx)$/.test(path)) {
    const text = readFileSync(join(repo, path), 'utf8')
    assert(text.endsWith('\n'), `缺末尾换行：${path}`)
    assert(!/[ \t]+$/m.test(text), `行尾空白：${path}`)
  }
}
const output = {
  generatedAt: new Date().toISOString(), developerOnly: true, gui: 'NOT_RUN',
  independentConclusion: '未给出，原 A10 FAIL 保持开放',
  sourceReadback, commands, newFiles,
}
writeFileSync(join(repo, `${evidence}/audit.json`), `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify({ checks: commands.length, exit: 0, newFiles: paths.length, sourceReadback }))

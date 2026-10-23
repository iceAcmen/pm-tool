import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const prefix = 'fc-a2-independent-retest-20261021'
const output = join(here, `${prefix}-integrity-check.json`)
if (existsSync(output)) throw new Error('禁止覆盖旧原证')
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const candidatePath = join(repo, 'reports/all-pending-evidence-20261021/A2/candidate.json')
const candidate = json(candidatePath)
const initial = json(join(here, `${prefix}-initial-result.json`))
const sources = Object.entries(candidate.source).map(([path, e]) => ({
  path, expected: e.sha256, main: sha(join(repo, path)),
  isolated: sha(join(candidate.worktree, path)), copy: sha(join(initial.root, path)),
}))
const artifacts = Object.entries(json(join(repo, 'reports/all-pending-evidence-20261021/A0/all-built-files.json')))
  .map(([path, expected]) => ({ path, expected, actual: sha(join(candidate.worktree, path)) }))
const probePath = join(repo, 'reports/all-pending-evidence-20261021/A2/finder/open-chrome-clean-probe.json')
const probe = json(probePath)
if (JSON.stringify(probe.argv) !== JSON.stringify(['open', '-a', 'Chrome', '--args', '--app=http://127.0.0.1:3211/'])
  || probe.exit !== 1 || probe.stderr !== "Unable to find application named 'Chrome'\n") throw new Error('新干净probe字段不符')
const files = readdirSync(here).filter(name => name.startsWith(prefix) && name !== `${prefix}-integrity-check.json`)
const syntax = files.filter(name => name.endsWith('.mjs')).map(name => {
  const child = spawnSync(process.execPath, ['--check', join(here, name)], { encoding: 'utf8' })
  return { path: `docs/testing/${name}`, exit: child.status, stdout: child.stdout, stderr: child.stderr }
})
const links = files.filter(name => name.endsWith('.md')).flatMap(name => {
  const text = readFileSync(join(here, name), 'utf8')
  return [...text.matchAll(/\]\(([^)]+)\)/g)].map(([, target]) => ({
    from: name, target, exists: /^(https?:|file:|#)/.test(target) || existsSync(resolve(here, target.split('#')[0])),
  }))
})
const ownPids = [99789, 99912, 706].map(pid => {
  try { process.kill(pid, 0); return { pid, exists: true } }
  catch (e) { return { pid, exists: e.code === 'ESRCH' ? false : e.code } }
})
const result = {
  at: new Date().toISOString(), node: process.version, platform: process.platform,
  checkerSha256: sha(fileURLToPath(import.meta.url)),
  candidateSha256: sha(candidatePath), initialCandidateSha256: initial.candidateSha256,
  patchSha256: sha(join(repo, 'reports/all-pending-evidence-20261021/A2/tracked.patch')),
  sourceCount: sources.length, artifactCount: artifacts.length,
  sourceFailures: sources.filter(x => x.main !== x.expected || x.isolated !== x.expected || x.copy !== x.expected),
  artifactFailures: artifacts.filter(x => x.expected !== x.actual),
  sources, artifacts,
  cleanProbe: { path: probePath.slice(repo.length + 1), sha256: sha(probePath), exit: probe.exit, stderr: probe.stderr },
  syntax, brokenLinks: links.filter(x => !x.exists), ownPids,
  files: files.map(name => ({ path: `docs/testing/${name}`, sha256: sha(join(here, name)) })),
  boundary: '语法/身份/文档检查成功不覆盖产品FAIL；仅自有明确PID existence探针，未读进程argv或运行目录',
}
writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({
  output, at: result.at, sourceCount: result.sourceCount, artifactCount: result.artifactCount,
  sourceFailures: result.sourceFailures, artifactFailures: result.artifactFailures,
  candidateStable: result.candidateSha256 === result.initialCandidateSha256,
  syntax: syntax.map(x => ({ path: x.path, exit: x.exit })), brokenLinks: result.brokenLinks,
  ownPids, cleanProbe: result.cleanProbe,
}, null, 2))
if (result.sourceFailures.length || result.artifactFailures.length || syntax.some(x => x.exit !== 0) || result.brokenLinks.length) process.exitCode = 1

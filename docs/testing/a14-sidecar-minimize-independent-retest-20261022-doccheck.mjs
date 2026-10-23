import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a14-sidecar-minimize-independent-retest-20261022'
const round = process.argv[2]
assert.match(round, /^r[1-9]\d*$/)
const self = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const paths = ['.md', '-plan.md', '-infrastructure.md'].map(s => join(repo, 'docs/testing', `${prefix}${s}`))
const documents = paths.map(p => {
  const text = readFileSync(p, 'utf8')
  const links = [...text.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1]).filter(s => !/^https?:/.test(s))
  assert(links.every(s => existsSync(resolve(dirname(p), s.split('#')[0]))), `失效链接 ${p}`)
  assert(text.endsWith('\n') && !text.split('\n').some(s => /[ \t]+$/.test(s)), `文档格式 ${p}`)
  return { path: p, sha256: hash(p), links: links.length }
})
const originalInputs = json(join(self, 'start.json')).inputs
assert(Object.entries(originalInputs).every(([p, sha]) => hash(join(repo, p)) === sha), '输入漂移')
const candidate = json(join(self, 'new/candidate.json'))
const mainMatches = Object.entries(candidate.filesOfInterest).every(([p, sha]) =>
  hash(join(repo, 'packages/dsh-pm-tool', p)) === sha)
const protectedManifests = json(join(self, 'protected-manifests.json'))
const clients = ['mainLib', 'a11Lib', 'a12Lib', 'a13Lib'].map(id => {
  const p = join(protectedManifests[id].root, 'client.js')
  const expected = protectedManifests[id].deliveryClient
  assert.equal(hash(p), expected.sha256)
  assert.equal(statSync(p).mtimeMs, expected.mtimeMs)
  return { id, path: p, sha256: hash(p), mtimeMs: statSync(p).mtimeMs }
})
const result = { at: new Date().toISOString(), argv: process.argv, cwd: process.cwd(),
  documents, originalInputDrift: [], mainReleasedThreeMatches: mainMatches, clients,
  signedScope: candidate.sourceSha256, originalExit: 0, gui: 'NOT_RUN',
  boundary: '收尾文档/原输入/释放三文件/client字节mtime；全部根保护时点仍见delivery-check' }
writeFileSync(join(self, 'final-doccheck.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify(result))

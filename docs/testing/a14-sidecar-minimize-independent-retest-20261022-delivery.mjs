import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a14-sidecar-minimize-independent-retest-20261022'
const round = process.argv[2]
assert.match(round, /^r[1-9]\d*$/)
const root = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const hash = b => createHash('sha256').update(b).digest('hex')
const save = (n, v) => writeFileSync(join(root, n), typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n', { flag: 'wx' })
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1' }
const extra = []
function execute(label, args) {
  const start = new Date().toISOString()
  const r = spawnSync(process.execPath, args, { cwd: repo, env, encoding: 'utf8', timeout: 30000 })
  const record = { label, argv: [process.execPath, ...args], cwd: repo, env, start,
    end: new Date().toISOString(), originalExit: r.status, signal: r.signal, error: r.error?.message }
  save(`${label}.command.json`, record); save(`${label}.stdout.log`, r.stdout ?? ''); save(`${label}.stderr.log`, r.stderr ?? '')
  extra.push(record)
  return r.status
}
assert.equal(execute('source-audit-first-failure-reproduced',
  [join(repo, 'docs/testing', `${prefix}-source-audit-r1.mjs`), round]), 1)
for (const n of ['run', 'exec', 'source-audit-r1', 'source-audit-r2', 'source-audit-r2-subject', 'delivery'])
  assert.equal(execute(`syntax-${n}`, ['--check', join(repo, 'docs/testing', `${prefix}-${n}.mjs`)]), 0)
const runs = json(join(root, 'runs.json'))
const parent = ['run', 'finalize'].map(n => ({ label: `parent-${n}`,
  ...json(join(repo, 'docs/testing', `${prefix}-selftmp`, `${round}-parent-executions`, `${n}.command.json`)) }))
const sourceAudit = { label: 'source-audit-r2', ...json(join(root, 'source-audit-r2.command.json')) }
const prepare = { label: 'parent-prepare', argv: [process.execPath,
  join(repo, 'docs/testing', `${prefix}-run.mjs`), round, 'prepare'], cwd: repo,
  originalExit: 'NOT_CAPTURED', note: '工具异步execution ID，不以完整产物编造原父退出码；finalize0已核全部冻结/原证' }
const observed = [
  { label: 'source-audit-original-terminal-failure', file: 'source-audit', exit: 1 },
  { label: 'source-audit-adapter-terminal-ENOENT', file: 'source-audit-r2', exit: 1 },
  { label: 'source-audit-adapter-terminal-final', file: 'source-audit-r2', exit: 0 },
].map(x => ({ label: x.label, argv: [process.execPath, join(repo, 'docs/testing', `${prefix}-${x.file}.mjs`), round],
  cwd: repo, originalExit: x.exit, recordedFrom: '实际exec_command工具末态；非再次执行，原错误见设施记录' }))
const commands = [...runs, ...parent, sourceAudit, ...extra, ...observed, prepare]
save('commands.json', commands)
const quote = x => `'${x.replace(/'/g, "'\\''")}'`
save('commands.md', '# SM01 独立复验完整命令\n\n每条均为实际 executable + 完整 argv；退出码不折叠。cwd/白名单环境/时间/信号见 commands.json；pattern排除项不算通过。\n\n'
  + commands.map(c => `## ${c.label}\n\n原退出码：\`${c.originalExit}\`；cwd：\`${c.cwd}\`。\n\n\`\`\`sh\n${c.argv.map(quote).join(' ')}\n\`\`\`\n`).join('\n'))
function inventory(base) {
  const result = {}
  if (!existsSync(base)) return result
  function walk(p) {
    const s = lstatSync(p), key = relative(base, p) || '.'
    if (s.isSymbolicLink()) result[key] = { link: readlinkSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else result[key] = { sha256: hash(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(base); return result
}
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(p => JSON.stringify(a[p]) !== JSON.stringify(b[p]))
const start = json(join(root, 'start.json')), finish = json(join(root, 'finish.json'))
const latest = Object.fromEntries(Object.entries(finish.protect).map(([id, x]) => [id, {
  root: x.root, inventory: inventory(x.root) }]))
const changes = Object.fromEntries(Object.keys(latest).map(id => [id,
  diff(finish.protect[id].inventory, latest[id].inventory)]))
const hardDrift = Object.entries(changes).filter(([id, entries]) =>
  !['concurrentA13Evidence', 'mainSource'].includes(id) && entries.length)
save('protected-manifests.json', Object.fromEntries(Object.keys(latest).map(id => [id, {
  root: latest[id].root, entries: Object.keys(latest[id].inventory).length,
  startSha256IncludingMtime: hash(JSON.stringify(start.protect[id].inventory)),
  finishSha256IncludingMtime: hash(JSON.stringify(finish.protect[id].inventory)),
  deliverySha256IncludingMtime: hash(JSON.stringify(latest[id].inventory)),
  originalClient: start.protect[id].inventory['client.js'],
  deliveryClient: latest[id].inventory['client.js'],
  finishDrift: finish.drift[id], postFinishDrift: changes[id],
}])))
const inputDrift = Object.entries(start.inputs).filter(([p, expected]) => hash(readFileSync(join(repo, p))) !== expected)
const docs = ['.md', '-plan.md', '-infrastructure.md'].map(suffix => join(repo, 'docs/testing', `${prefix}${suffix}`))
const documentChecks = docs.map(p => {
  const text = readFileSync(p, 'utf8')
  const links = [...text.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1]).filter(s => !/^https?:/.test(s))
  const missing = links.filter(s => {
    const target = resolve(dirname(p), s.split('#')[0])
    return !existsSync(target) && target !== join(root, 'delivery-check.json')
  })
  return { path: relative(repo, p), missing, trailingWhitespace: text.split('\n').flatMap((s, i) =>
    /[ \t]+$/.test(s) ? [i + 1] : []), newline: text.endsWith('\n') }
})
const ownFiles = readdirSync(join(repo, 'docs/testing')).filter(n => n.startsWith(prefix)
  && lstatSync(join(repo, 'docs/testing', n)).isFile())
save('delivery-check.json', { at: new Date().toISOString(), argv: process.argv, cwd: process.cwd(),
  postFinishDrift: changes, hardDrift, inputDrift, documentChecks,
  ownFiles: Object.fromEntries(ownFiles.map(n => [n, hash(readFileSync(join(repo, 'docs/testing', n)))])),
  sourceScopeIfMainChanged: changes.mainSource.length ? '本签字仍只new/current冻结，最新主树需另验' : '主src与被测冻结仍相同',
  sourceAutoSignatureScope: json(join(root, 'new/candidate.json')).sourceSha256,
  gui: 'NOT_RUN', noProductBuildInstallGuiServicesCredentialsCommit: true })
assert.deepEqual(hardDrift, [])
assert.deepEqual(inputDrift, [])
assert(documentChecks.every(x => !x.missing.length && !x.trailingWhitespace.length && x.newline))
console.log(JSON.stringify({ output: root, commands: commands.length, childTestsAndNoEmit: runs.length,
  sourceAutoScope: json(join(root, 'new/candidate.json')).sourceSha256,
  postFinishDriftCounts: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.length])),
  documentChecks, originalExit: 0 }))

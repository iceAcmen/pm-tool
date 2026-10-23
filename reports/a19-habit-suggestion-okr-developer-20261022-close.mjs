import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a19-habit-suggestion-okr-developer-20261022'
const out = join(repo, 'reports', `${prefix}-evidence`)
const owned = '/private/tmp/pmtool-a19-habit-suggestion-okr-developer-20261022'
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const hash = value => createHash('sha256').update(value).digest('hex')
function save(name, value) {
  const file = resolve(out, name)
  assert(file.startsWith(`${out}/`))
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 })
  writeFileSync(file, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(owned, 'home'), TMPDIR: join(owned, 'tmp'), XDG_CACHE_HOME: join(owned, 'cache'),
  DSH_HOME: join(owned, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1', GIT_OPTIONAL_LOCKS: '0' }
function run(id, argv) {
  const start = new Date().toISOString()
  const result = spawnSync(argv[0], argv.slice(1), { cwd: repo, env, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
  save(`close/${id}.stdout.log`, result.stdout ?? '')
  save(`close/${id}.stderr.log`, result.stderr ?? '')
  save(`close/${id}.command.json`, { argv, cwd: repo, env, pid: result.pid, start,
    end: new Date().toISOString(), originalExit: result.status, signal: result.signal })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}
assert(read(join(out, 'seal.json')).resourcesReleased)
const red = read(join(out, 'red/necessary.result.json'))
assert.equal(red.numFailedTests, 13)
assert(red.testResults.flatMap(item => item.assertionResults).filter(item => item.status === 'failed')
  .every(item => item.failureMessages[0].includes('自身关联标签')))
for (const [path, count] of [
  ['red/controls', 10], ['red/model', 10], ['green/necessary', 13], ['green/controls', 10],
  ['green/model', 10], ['green/author', 11], ['supplement/affected', 131],
]) {
  const result = read(join(out, `${path}.result.json`))
  assert.equal(result.numPassedTests, count)
  assert.equal(result.numFailedTests, 0)
  assert.equal(read(join(out, `${path}.command.json`)).originalExit, 0)
}
const patch = run('owned-patch', ['/usr/bin/git', 'diff', '--binary', '--',
  'packages/dsh-pm-tool/src/client/views/habits.tsx'])
save('close/owned.patch', patch)
const testPath = 'packages/dsh-pm-tool/src/client/views/habits-suggestion-okr.test.tsx'
save('close/new-author-test.tsx', readFileSync(join(repo, testPath), 'utf8'))
run('diff-check', ['/usr/bin/git', 'diff', '--check', '--',
  'packages/dsh-pm-tool/src/client/views/habits.tsx', testPath, `reports/${prefix}*`])
run('runner-syntax', [process.execPath, '--check', join(repo, `reports/${prefix}-run.mjs`)])
run('closer-syntax', [process.execPath, '--check', fileURLToPath(import.meta.url)])
run('vendor-static', [process.execPath, join(repo, 'packages/dsh-pm-tool/scripts/verify-external-skills.mjs')])
const profile = read(join(out, 'formal-profile-before.json'))
assert.equal(readlinkSync(profile.path), profile.link)
assert.equal(realpathSync(profile.path), profile.realpath)
const executions = [
  ['freeze', 'd9f315ccbfe7121f9bb07bc35235fef0', 0],
  ['red', '2df9f5e5b0710cb70b88fd385fbc35b2', 1],
  ['green-first', '7bd051a882b79d2c26f1951a29992428', 1],
  ['supplement', 'e6f21b6b15c04708733f4f6b816a112c', 0],
  ['seal', '45e73bd1c5e2b5c400be547a697c186d', 0],
]
for (const [name, id, exit] of executions) {
  const root = `/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution/${id}`
  const execution = read(join(root, 'execution.json'))
  assert.equal(execution.status, 'exited')
  assert.equal(execution.exitCode, exit)
  save(`close/outer-${name}.execution.json`, execution)
  save(`close/outer-${name}.stdout.log`, readFileSync(join(root, 'output.log'), 'utf8'))
}
const habitsPath = 'packages/dsh-pm-tool/src/client/views/habits.tsx'
const original = readFileSync(join(owned, 'red', habitsPath), 'utf8')
const current = readFileSync(join(repo, habitsPath), 'utf8')
const habitSection = source => source.slice(source.indexOf('mine.map(h => {'), source.indexOf('      {/* 收件区入口'))
assert.equal(habitSection(current), habitSection(original))
const actionSection = source => source.slice(source.indexOf('<div className="pm-habit-suggestion-actions">'),
  source.indexOf('              </li>', source.indexOf('<div className="pm-habit-suggestion-actions">')))
assert.equal(actionSection(current), actionSection(original))
save('close/self-review.json', {
  at: new Date().toISOString(), original13RedValidated: true, sameExpertOriginalTestsUnedited: true,
  originalHabitCardByteIdentical: true, originalSuggestionActionsByteIdentical: true,
  inputs: [habitsPath, testPath].map(path => ({ path, sha256: hash(readFileSync(join(repo, path))),
    bytes: lstatSync(join(repo, path)).size })),
  vendor: { lockedCommit: '49dd158d1076134a641b33efb035946536778336',
    integrityStaticExit: 0, route: 'none', skillsLoaded: [],
    reason: 'Trivial existing resolver/render pattern; external-skills policy 6.1 blocks skill execution while original independent FAIL remains. No vendor setup/installer/global write; local self-review not independent PASS.' },
  built: false, gui: false, committed: false, passSigned: false, resourcesReleased: true, stop: true,
})
const entries = {}
function walk(file) {
  const stat = lstatSync(file)
  if (stat.isDirectory()) for (const name of readdirSync(file).sort()) walk(join(file, name))
  else {
    assert(stat.isFile())
    entries[relative(out, file)] = { sha256: hash(readFileSync(file)), bytes: stat.size }
  }
}
walk(out)
save('close/index.json', { at: new Date().toISOString(), files: entries,
  count: Object.keys(entries).length, selfNotIncluded: true, passSigned: false })
console.log(JSON.stringify({ evidenceFiles: Object.keys(entries).length, closed: true,
  originalRedPreserved: true, resourcesReleased: true, passSigned: false }))

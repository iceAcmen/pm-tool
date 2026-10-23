import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync,
  realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a15-f02-strict-effects-dom-retest-20261022'
const testing = join(repo, 'docs/testing')
const selftmp = join(testing, `${prefix}-selftmp`)
assert(process.argv[2] === undefined || process.argv[2] === 'final')
const output = join(testing, `${prefix}-seal${process.argv[2] === 'final' ? '-final' : ''}.json`)
assert(!existsSync(output), '原封存不得覆盖')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const record = path => {
  const s = lstatSync(path)
  if (s.isSymbolicLink()) return { link: readlinkSync(path),
    ...(existsSync(path) ? { realpath: realpathSync(path) } : {}) }
  if (s.isDirectory()) return { directory: true }
  const bytes = readFileSync(path)
  return { sha256: sha(bytes), bytes: bytes.length, mtimeMs: s.mtimeMs }
}
const currentChecks = []
const rounds = []
for (const round of ['r1', 'r2']) {
  const root = join(selftmp, round)
  const summary = json(join(root, 'summary.json'))
  assert(!summary.setupError)
  assert.equal(summary.records.length, 3)
  const totals = []
  for (const [label, count] of [['original-four', 4], ['previous-four', 4], ['strict-dom', 6]]) {
    const result = json(join(root, `${label}.result.json`))
    assert.equal(result.numPassedTests, count)
    assert.equal(result.numFailedTests, 0)
    assert.equal(result.numPendingTests, 0)
    assert.equal(result.numTodoTests, 0)
    assert.equal(result.success, true)
    assert.equal(summary.records.find(r => r.label === label).exit, 0)
    totals.push({ label, count, exit: 0 })
  }
  for (const value of Object.values(summary.audit)) {
    assert.deepEqual(value, { added: [], removed: [], changed: [] })
  }
  for (const name of ['protected', 'dependencies', 'shared']) {
    const before = json(join(root, `${name}-before.json`))
    const after = json(join(root, `${name}-after.json`))
    assert.deepEqual(after, before)
  }
  const original = 'packages/dsh-pm-tool/src/client/shared/task-draft-materials-stage.test.tsx'
  assert.equal(sha(readFileSync(join(root, 'frozen', original))),
    '95992aef68f8a97f92137a5574b215fcad760246495317c2f383c52907b7b7a8')
  const caseResults = []
  for (let n = 1; n <= 6; n++) {
    const caseRoot = join(root, 'case-evidence/strict-dom', `case-${n}`)
    const e = json(join(caseRoot, 'evidence.json'))
    assert.equal(e.reactVersion, '18.3.1')
    assert.equal(e.reactDomVersion, '18.3.1')
    assert.deepEqual(e.consoles, [])
    if (n === 1) {
      assert.deepEqual(e.effects.strict, ['setup', 'cleanup', 'setup', 'cleanup'])
      assert.deepEqual(e.effects['non-strict'], ['setup', 'cleanup'])
      assert.deepEqual(e.events.find(v => v.label === 'mounted-strict').effects.strict,
        ['setup', 'cleanup', 'setup'])
    }
    if (n >= 3) {
      assert(e.controls.capabilityReady && e.controls.eventReady)
      for (const [owner, values] of Object.entries(e.effects)) {
        assert.deepEqual(values, ['setup', 'cleanup', 'setup', 'cleanup'])
        assert.deepEqual(e.events.find(v => v.label === `mounted-${owner}`).effects[owner],
          ['setup', 'cleanup', 'setup'])
      }
    }
    const final = e.events.at(-1)
    const posts = e.commands.filter(c => c.method === 'POST')
    const deletes = e.commands.filter(c => c.method === 'DELETE')
    for (const post of posts) {
      assert.equal(post.status, 201)
      const stageId = post.response.stageId
      if (round === 'r2') {
        const raw = join(caseRoot, 'raw-stages', stageId)
        const bytes = readFileSync(join(raw, 'stage.bin'))
        const sidecar = json(join(raw, 'stage.json'))
        assert.equal(bytes.length, 28)
        assert.equal(sha(bytes), sidecar.sha256)
        assert.equal(sidecar.sha256, post.response.sha256)
      }
      assert(!existsSync(join(caseRoot, 'files/staging', `${stageId}.bin`)))
      assert(!existsSync(join(caseRoot, 'files/staging', `${stageId}.json`)))
    }
    if ([4, 6].includes(n)) {
      assert.deepEqual(final.tables.tasks, [])
      assert.deepEqual(final.tables.file_assets, [])
      assert.deepEqual(final.files, {})
      assert.deepEqual(final.data, e.events[0].data)
      assert.equal(deletes.length, 1)
      assert.deepEqual(deletes[0].response, { ok: true, removed: true })
    }
    if ([3, 5].includes(n)) {
      assert.equal(final.tables.tasks.length, 1)
      assert.equal(final.tables.file_assets.length, 1)
      const task = final.tables.tasks[0][1]
      const asset = final.tables.file_assets[0][1]
      assert.equal(task.attachments.length, 1)
      assert.equal(task.attachments[0].assetId, asset.id)
      assert.equal(sha(readFileSync(join(caseRoot, 'files', asset.relPath))), asset.sha256)
      assert.equal(e.events.filter(v => v.label === 'real-domain-addTask').length, 1)
      const saved = e.events.find(v => v.label === 'saved-before-unmount')
      assert.deepEqual(saved.data, final.data)
      assert.deepEqual(saved.files, final.files)
    }
    if (n === 4) assert.equal(e.published?.length ?? e.events.filter(v => v.label === 'publish').length, 0)
    if (n === 5) assert.deepEqual(e.events.filter(v => v.label === 'publish').map(v => v.owner), ['new'])
    caseResults.push({ n, name: e.caseName, effects: e.effects, posts: posts.map(p => p.response.stageId),
      deletes: deletes.map(d => d.url), tasks: final.tables.tasks.length,
      assets: final.tables.file_assets.length, consoles: e.consoles })
  }
  rounds.push({ round, totals, caseResults, audit: summary.audit,
    frozenCasesSha: sha(readFileSync(join(root, 'frozen/docs/testing', `${prefix}-cases.test.tsx`))) })
}
const parent = json(join(selftmp, 'r2-parent/command.json'))
assert.equal(parent.exit, 0)
assert.equal(parent.signal, null)
const currentBase = join(selftmp, 'r2')
const allowed = join(testing, `${prefix}-plan.md`)
for (const name of ['protected', 'dependencies', 'shared']) {
  const baseline = json(join(currentBase, `${name}-after.json`))
  const changed = []
  for (const [path, expected] of Object.entries(baseline)) {
    if (path === allowed) continue
    assert.deepEqual(record(path), expected, `终核保护变化 ${path}`)
  }
  currentChecks.push({ name, checked: Object.keys(baseline).length, changed,
    allowedOwnPlanStatusChange: name === 'protected' ? allowed : null })
}
const index = {}
function indexFiles(path) {
  const s = lstatSync(path)
  if (s.isSymbolicLink()) {
    index[relative(repo, path)] = { link: readlinkSync(path), notCopiedDependency: true }
  } else if (s.isDirectory()) {
    for (const name of readdirSync(path).sort()) indexFiles(join(path, name))
  } else index[relative(repo, path)] = record(path)
}
for (const name of readdirSync(testing).filter(n => n.startsWith(prefix))) indexFiles(join(testing, name))
const diff = spawnSync('/usr/bin/git', ['diff', '--check', '--', `docs/testing/${prefix}*`],
  { cwd: repo, encoding: 'utf8', env: { PATH: '/usr/bin:/bin', HOME: join(currentBase, 'home') } })
assert.equal(diff.status, 0)
const processCheck = spawnSync('/usr/bin/pgrep', ['-fl', `${prefix}-(run|collect)\\.mjs`],
  { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } })
assert.equal(processCheck.status, 1, '本角色runner/collector必须已退出')
const seal = {
  at: new Date().toISOString(), role: 'trae独立 F02 SOURCE/AUTO DOM',
  conclusion: 'LIMITED_SOURCE_AUTO_PASS_NOT_GUI_A16_OR_WHOLE_GATE',
  rounds, parentRunnerObservedExit: parent.exit, currentChecks,
  diff: { exit: diff.status, stdout: diff.stdout, stderr: diff.stderr,
    boundary: 'untracked diff检查不等文件内容验证；内容另经本脚本回读' },
  processCheck: { exit: processCheck.status, stdout: processCheck.stdout, stderr: processCheck.stderr },
  index,
}
writeFileSync(output, `${JSON.stringify(seal, null, 2)}\n`)
console.log(JSON.stringify({ output, indexCount: Object.keys(index).length, currentChecks,
  parentRunnerObservedExit: parent.exit, diffExit: diff.status, processCheckExit: processCheck.status }))

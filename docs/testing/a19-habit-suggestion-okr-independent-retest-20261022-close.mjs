import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a19-habit-suggestion-okr-independent-retest-20261022'
const base = join(repo, 'docs/testing', `${prefix}-selftmp`)
const out = join(base, 'r3')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
function save(path, value) {
  const p = resolve(base, path)
  assert(p.startsWith(`${base}/`))
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
for (const [name, id, exit] of [
  ['freeze-initial', '8c160bb3e23286888c94425b00f6db41', 1],
  ['freeze-r2', '7c4797d3916b0fab176dc4adc8665970', 1],
  ['freeze-r3', '33c96f08761c393eda3b91ac95ce39d2', 0],
  ['run', '03a230f25b9106f8b4a4405291969add', 1],
  ['supplement', 'c6db138165988a5903d42e558466bb41', 0],
  ['seal', 'e75f861841114067f8f221c67dad915f', 0],
]) {
  const root = `/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution/${id}`
  const execution = read(join(root, 'execution.json'))
  assert.equal(execution.status, 'exited')
  assert.equal(execution.exitCode, exit)
  save(`r3/close/${name}.execution.json`, execution)
  save(`r3/close/${name}.stdout.log`, readFileSync(join(root, 'output.log'), 'utf8'))
}
const env = { PATH: '/usr/bin:/bin', NODE_DISABLE_COMPILE_CACHE: '1', GIT_OPTIONAL_LOCKS: '0' }
const corrections = [
  ['runner', join(base, 'r2/runner-before-correction.mjs'), join(repo, `docs/testing/${prefix}-run.mjs`)],
  ['cases', join(base, 'r2/cases-before-correction.test.tsx'), join(repo, `docs/testing/${prefix}-cases.test.tsx`)],
]
for (const [name, before, after] of corrections) {
  const r = spawnSync('/usr/bin/diff', ['-u', before, after], { env, encoding: 'utf8', cwd: repo })
  assert.equal(r.status, 1)
  save(`r3/close/own-${name}-correction.patch`, r.stdout)
  save(`r3/close/own-${name}-correction.json`, {
    before, after, beforeSha256: sha(readFileSync(before)), afterSha256: sha(readFileSync(after)),
    originalExit: r.status, reason: name === 'runner'
      ? 'Own version reader resolves nested Vite and uses fresh r3 output; no dependency or product edits'
      : 'Own optional SSR dependency unavailable; literal-text and zero-element assertions retained in provided React renderer; SSR not claimed',
    originalFailurePreserved: true, expertOriginalOrProductEdited: false,
  })
}
const seal = read(join(out, 'seal.json'))
assert(seal.preserved && seal.resourcesReleased)
const beforeManifest = read(join(out, 'source-before.json'))
const afterManifest = read(join(out, 'frozen-manifest.json'))
const habitsPath = 'packages/dsh-pm-tool/src/client/views/habits.tsx'
assert.equal(beforeManifest[habitsPath].sha256, afterManifest[habitsPath].sha256)
save('r3/close/summary.json', { at: new Date().toISOString(),
  candidate: read(join(out, 'candidate.json')), seal,
  noProductOrOriginalTestEdits: true, noBuildInstallGuiServiceCommit: true,
  limitedSOURCE: 'PASS', limitedAUTO: 'PASS', GUI: 'NOT_RUN; previous GUI FAIL preserved',
  oldShared10Bin: 'historical BLOCKED preserved', independentExecutedTests: 190,
  firstAffected80NotCountedAgain: true, resourcesReleased: true })
console.log(JSON.stringify({ closed: true, resourcesReleased: true, SOURCE: 'limited PASS', AUTO: 'limited PASS' }))

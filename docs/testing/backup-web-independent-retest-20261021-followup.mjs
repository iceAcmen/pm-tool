import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const prefix = 'backup-web-independent-retest-20261021'
const repo = path.resolve(here, '../..')
const own = path.join(here, `${prefix}-selftmp`)
const evidence = path.join(here, `${prefix}-evidence`)
const frozen = path.join(own, 'frozen')
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const list = dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  .flatMap(e => e.isSymbolicLink() ? [] : e.isDirectory() ?
    list(path.join(dir, e.name)).map(f => path.join(e.name, f)) : [e.name]) : []
const manifest = dir => Object.fromEntries(list(dir).map(f => [f, { sha256: sha(path.join(dir, f)), bytes: fs.statSync(path.join(dir, f)).size }]))
const write = (f, data) => fs.writeFileSync(f, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
const before = manifest(path.join(frozen, 'src'))
const testBefore = sha(path.join(frozen, `${prefix}-seam.test.tsx`))
fs.copyFileSync(path.join(frozen, `${prefix}-seam.test.tsx`), path.join(evidence, 'r1-executed-seam.test.tsx.txt'))
fs.copyFileSync(path.join(here, `${prefix}-seam.test.tsx`), path.join(frozen, `${prefix}-seam.test.tsx`))
write(path.join(evidence, 'oracle-fixture-correction.json'), {
  reason: '预检成功会关闭更多菜单，取消后应真实重开菜单再核输入；只修设施动作，不改产品/预期',
  previous: testBefore, current: sha(path.join(frozen, `${prefix}-seam.test.tsx`)),
})
const cache = path.join(frozen, 'node_modules/.vite/vitest/results.json')
const cacheBefore = fs.existsSync(cache) ? sha(cache) : null
const commands = []
function run(label, args, extra = {}) {
  const env = {
    ...process.env, TMPDIR: own, QA_OWN: own, QA_AUDIT: path.join(evidence, label + '.audit.ndjson'),
    DSH_PM_FILE_ROOT: path.join(own, 'default-files'), DSH_PM_BACKUP_DIR: path.join(own, 'default-backups'),
    PM_BACKUP_WEB_TMP: path.join(own, label + '-cases'), PM_BACKUP_FIXTURE_DIR: path.join(own, 'fixtures/F5'),
    NODE_OPTIONS: `--import=${path.join(own, 'guard.mjs')}`, ...extra,
  }
  fs.mkdirSync(env.PM_BACKUP_WEB_TMP)
  const started = new Date().toISOString()
  const result = spawnSync(process.execPath, args, { cwd: frozen, env, encoding: 'utf8', timeout: 180000, maxBuffer: 20 * 1024 * 1024 })
  fs.writeFileSync(path.join(evidence, label + '.stdout.txt'), result.stdout ?? '')
  fs.writeFileSync(path.join(evidence, label + '.stderr.txt'), result.stderr ?? '')
  commands.push({
    label, argv: [process.execPath, ...args], cwd: frozen,
    env: Object.fromEntries(Object.keys(env).filter(k => /^(TMPDIR|QA_|DSH_PM_|PM_BACKUP_|NODE_OPTIONS)/.test(k)).map(k => [k, env[k]])),
    started, ended: new Date().toISOString(), exit: result.status, signal: result.signal, error: result.error?.message,
    stdoutSha: sha(path.join(evidence, label + '.stdout.txt')), stderrSha: sha(path.join(evidence, label + '.stderr.txt')),
  })
  fs.writeFileSync(path.join(evidence, 'followup-commands.json'), JSON.stringify(commands, null, 2) + '\n')
  console.log(JSON.stringify({ label, exit: result.status, signal: result.signal, last: (result.stdout ?? '').slice(-700) }))
}
const files = ['src/commands/backup-web.test.ts', 'src/core/backup-precheck.test.ts', 'src/core/backup-mid-rollback.test.ts',
  'src/core/file-backup.test.ts', 'src/client/panel-restore-path.test.ts', 'src/client/panel-launch-handshake.test.tsx',
  'src/client/launch-handshake.test.ts', 'src/client/bridge-panel-independent-retest-20261021-additional.test.tsx',
  `${prefix}-seam.test.tsx`]
for (const label of ['current-r2', 'current-r3']) {
  const resultFile = path.join(own, label + '.vitest.json')
  run(label, ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.qa.config.mjs', '--no-cache',
    '--maxWorkers=1', '--minWorkers=1', '--reporter=default', '--reporter=json', `--outputFile=${resultFile}`, ...files])
  if (fs.existsSync(resultFile)) fs.copyFileSync(resultFile, path.join(evidence, label + '.vitest.json'))
}
run('current-r3-reopen', ['reopen.mjs'], { QA_REOPEN_TARGET: path.join(own, 'current-r3-cases/reopen-target.json') })
const original = path.join(here, 'materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr')
const archives = []
const archive = (source, filename) => {
  const destination = path.join(evidence, filename)
  fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL)
  archives.push({ source, destination, sha256: sha(source), archiveSha: sha(destination) })
}
for (const file of ['commands.json', 'candidate.json', 'results.json', 'content-precheck-observation.json', 'content-restore-observation.json']) {
  archive(path.join(original, file), 'MFR-fiKpOr-' + file)
}
const main = path.join(repo, 'reports/all-pending-evidence-20261021/A7/backup')
for (const file of fs.readdirSync(main).filter(f => f.endsWith('.json') || f.endsWith('.txt'))) archive(path.join(main, file), 'Main-A7-' + file)
const dev = path.join(repo, 'reports/backup-web-developer-20261021-tmp/evidence')
for (const file of ['candidate.json', 'final-8/commands.json', 'final-8/reopen.stdout.txt', 'final-8/reopen.stderr.txt']) {
  archive(path.join(dev, file), 'developer-' + file.replaceAll('/', '-'))
}
write(path.join(evidence, 'external-original-archives.json'), archives)
const sourceAfter = manifest(path.join(repo, 'packages/dsh-pm-tool/src'))
write(path.join(evidence, 'followup-integrity.json'), {
  before, after: manifest(path.join(frozen, 'src')), sourceAfter,
  cacheBefore, cacheAfter: fs.existsSync(cache) ? sha(cache) : null,
  declarationsAfter: Object.fromEntries(['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
    .map(f => [f, sha(path.join(repo, 'packages/dsh-pm-tool', f))])),
  fixtureAfter: manifest(path.join(original, 'fixtures')),
})
write(path.join(evidence, 'evidence-sha256-r3.json'), manifest(evidence))
process.exitCode = commands.some(c => c.exit !== 0) ? 1 : 0

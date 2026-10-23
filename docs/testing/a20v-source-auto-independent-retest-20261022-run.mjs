import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const frozen = '/private/tmp/pmtool-a20v-closure-20261022-r1'
const pkg = path.join(frozen, 'packages/dsh-pm-tool')
const evidence = path.join(repo, 'docs/testing/a20v-source-auto-independent-retest-20261022-evidence')
const testFile = path.join(repo, 'docs/testing/a20v-source-auto-independent-retest-20261022-cases.test.tsx')
const config = path.join(repo, 'docs/testing/a20v-source-auto-independent-retest-20261022-vitest.config.mts')
const vitest = path.join(pkg, 'node_modules/vitest/vitest.mjs')
const reporter = path.join(evidence, 'vitest.json')
const protectedFiles = [
  'src/client/index.tsx',
  'src/client/index-command-feedback.test.tsx',
  'package.json',
  'lib/client.js',
  'lib/core/reflect.js',
].map(relative => path.join(pkg, relative))

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex')
}

async function fingerprints() {
  return Object.fromEntries(await Promise.all(protectedFiles.map(async file => [file, await sha256(file)])))
}

await rm(evidence, { recursive: true, force: true })
await mkdir(evidence, { recursive: true })
const before = await fingerprints()
const args = [
  vitest,
  'run',
  testFile,
  '--config',
  config,
  '--no-cache',
  '--reporter=verbose',
  '--reporter=json',
  `--outputFile.json=${reporter}`,
]
const startedAt = new Date().toISOString()
const result = spawnSync(process.execPath, args, {
  cwd: pkg,
  encoding: 'utf8',
  env: {
    ...process.env,
    HOME: path.join(evidence, 'home'),
    TMPDIR: path.join(evidence, 'tmp'),
    NO_COLOR: '1',
  },
})
const endedAt = new Date().toISOString()
const after = await fingerprints()
await writeFile(path.join(evidence, 'stdout.txt'), result.stdout ?? '')
await writeFile(path.join(evidence, 'stderr.txt'), result.stderr ?? '')
await writeFile(path.join(evidence, 'execution.json'), `${JSON.stringify({
  startedAt,
  endedAt,
  cwd: pkg,
  command: [process.execPath, ...args],
  exitCode: result.status,
  signal: result.signal,
  error: result.error === undefined ? null : String(result.error),
  candidate: frozen,
  testFile,
  config,
  before,
  after,
  sourceDrift: Object.keys(before).filter(file => before[file] !== after[file]),
}, null, 2)}\n`)

process.stdout.write(result.stdout ?? '')
process.stderr.write(result.stderr ?? '')
process.exitCode = result.status ?? 1

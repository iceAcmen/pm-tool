import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const frozen = '/private/tmp/pmtool-a20v2-closure-20261022-r1'
const previousFrozen = '/private/tmp/pmtool-a20v-closure-20261022-r1'
const pkg = path.join(frozen, 'packages/dsh-pm-tool')
const evidence = path.join(repo, 'docs/testing/a20v2-source-auto-independent-retest-20261022-evidence')
const previousTest = path.join(repo, 'docs/testing/a20v-source-auto-independent-retest-20261022-cases.test.tsx')
const generatedTest = path.join(evidence, 'independent-cases.test.tsx')
const config = path.join(repo, 'docs/testing/a20v2-source-auto-independent-retest-20261022-vitest.config.mts')
const vitest = path.join(pkg, 'node_modules/vitest/vitest.mjs')
const tsc = path.join(pkg, 'node_modules/typescript/bin/tsc')
const candidateTest = path.join(pkg, 'src/client/index-command-feedback.test.tsx')
const protectedRelative = [
  'src/client/index.tsx',
  'src/client/index-command-feedback.test.tsx',
  'package.json',
  'lib/client.js',
  'lib/core/reflect.js',
]

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex')
}

async function fingerprints() {
  return Object.fromEntries(await Promise.all(protectedRelative.map(async relative => {
    const file = path.join(pkg, relative)
    return [relative, await sha256(file)]
  })))
}

function execute(label, args, cwd, extraEnv = {}) {
  const startedAt = new Date().toISOString()
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: path.join(evidence, 'home'),
      TMPDIR: path.join(evidence, 'tmp'),
      NO_COLOR: '1',
      ...extraEnv,
    },
  })
  return {
    label,
    startedAt,
    endedAt: new Date().toISOString(),
    cwd,
    command: [process.execPath, ...args],
    exitCode: result.status,
    signal: result.signal,
    error: result.error === undefined ? null : String(result.error),
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

async function persistExecution(result) {
  await writeFile(path.join(evidence, `${result.label}-stdout.txt`), result.stdout)
  await writeFile(path.join(evidence, `${result.label}-stderr.txt`), result.stderr)
  await writeFile(path.join(evidence, `${result.label}-execution.json`), `${JSON.stringify({
    ...result,
    stdout: undefined,
    stderr: undefined,
  }, null, 2)}\n`)
}

await rm(evidence, { recursive: true, force: true })
await mkdir(path.join(evidence, 'home'), { recursive: true })
await mkdir(path.join(evidence, 'tmp'), { recursive: true })

const previousSource = await readFile(previousTest, 'utf8')
if (!previousSource.includes(previousFrozen)) {
  throw new Error('上一轮独立用例未包含预期 A20V 冻结树路径，停止生成等价复验用例')
}
const generatedSource = previousSource.replaceAll(previousFrozen, frozen)
await writeFile(generatedTest, generatedSource)
await writeFile(path.join(evidence, 'test-derivation.json'), `${JSON.stringify({
  source: previousTest,
  sourceSha256: createHash('sha256').update(previousSource).digest('hex'),
  generated: generatedTest,
  generatedSha256: createHash('sha256').update(generatedSource).digest('hex'),
  onlyTransformation: {
    from: previousFrozen,
    to: frozen,
    replacements: previousSource.split(previousFrozen).length - 1,
  },
}, null, 2)}\n`)

const before = await fingerprints()
const independent = execute('independent-13', [
  vitest,
  'run',
  generatedTest,
  '--config',
  config,
  '--no-cache',
  '--reporter=verbose',
  '--reporter=json',
  `--outputFile.json=${path.join(evidence, 'independent-13-vitest.json')}`,
], pkg)
await persistExecution(independent)

const candidate = execute('candidate-9', [
  vitest,
  'run',
  candidateTest,
  '--config',
  path.join(pkg, 'vitest.config.ts'),
  '--no-cache',
  '--reporter=verbose',
  '--reporter=json',
  `--outputFile.json=${path.join(evidence, 'candidate-9-vitest.json')}`,
], pkg)
await persistExecution(candidate)

const typecheck = execute('tsc-noemit', [
  tsc,
  '-p',
  path.join(pkg, 'tsconfig.json'),
  '--noEmit',
], pkg)
await persistExecution(typecheck)

const after = await fingerprints()
const sourceDrift = Object.keys(before).filter(file => before[file] !== after[file])
const summary = {
  at: new Date().toISOString(),
  candidate: frozen,
  before,
  after,
  sourceDrift,
  executions: {
    independent13: independent.exitCode,
    candidate9: candidate.exitCode,
    tscNoEmit: typecheck.exitCode,
  },
}
await writeFile(path.join(evidence, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)

process.stdout.write(independent.stdout)
process.stderr.write(independent.stderr)
process.stdout.write(candidate.stdout)
process.stderr.write(candidate.stderr)
process.stdout.write(typecheck.stdout)
process.stderr.write(typecheck.stderr)
process.exitCode = [
  independent.exitCode,
  candidate.exitCode,
  typecheck.exitCode,
].every(code => code === 0) && sourceDrift.length === 0 ? 0 : 1

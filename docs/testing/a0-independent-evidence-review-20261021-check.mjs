/**
 * A0 独立审证的只读复核入口：不运行产品测试、不构建、不读认证根、不写文件。
 * stdout 仅输出候选指纹、原证计数和缺口；原测试执行 Main，审签见同名 Markdown。
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const wt = '/private/tmp/pmtool-all-closure-20261021'
const evidence = path.join(repo, 'reports/all-pending-evidence-20261021/A0')
const candidate = JSON.parse(fs.readFileSync(path.join(evidence, 'candidate.json'), 'utf8'))
if (candidate.worktree !== wt) throw new Error('候选隔离树已变化，停止本轮身份继承。')

const sourceFiles = [
  'launcher/package.json',
  'launcher/src/launcher-app.mjs',
  'launcher/src/local-app.mjs',
  'launcher/test/app.loopback.test.mjs',
  'launcher/test/journey-race.test.mjs',
  'launcher/test/local-app.test.mjs',
  'packages/dsh-pm-tool/package.json',
  'packages/dsh-pm-tool/pnpm-lock.yaml',
  'packages/dsh-pm-tool/scripts/verify-ui-feedback.mjs',
  'packages/dsh-pm-tool/src/client/panel.tsx',
  'packages/dsh-pm-tool/src/client/result-card.test.ts',
  'packages/dsh-pm-tool/src/client/result-card.tsx',
  'packages/dsh-pm-tool/src/client/shared/contract-pilot.test.ts',
  'packages/dsh-pm-tool/src/core/file-root.test.ts',
]
const bundleFiles = [
  'packages/dsh-pm-tool/lib/client.editor.js',
  'packages/dsh-pm-tool/lib/client.formula-expr.js',
  'packages/dsh-pm-tool/lib/client.js',
]
const pinnedLogs = {
  'pmtool-all-closure-20261021-build-fixed.log': '08931746cda61599cfa0b7fa180e479d3b9a53cd105a0b80faf8b11e9d8f5563',
  'pmtool-closure-launcher-green.log': '62cc1f2e5eeeaca3d3cc90f891b2b61ec41c49e6615fe6a375d24d96e7e4ab2c',
  'pmtool-closure-launcher-red.log': '7a7c4e8a9c76185f146a64aa328e61b76db7313b48a445f3148511d1b9a26c48',
  'pmtool-closure-launcher-tests-r2.log': '1baf36913bebd94a74f994ae09c7ad9e1f97ba1fcc824f3949a87cba94258519',
  'pmtool-closure-plugin-tests-r3.log': '257ed58a6bc70cfa0d1b14828343ad102225ae6295ae02fb4720dbd2635b0b47',
  'pmtool-closure-verify-r3.log': '6972ed4dedd8cd8e0746a9fc321f1f544f34c65257ebe1118c054327a931bf80',
  'pmtool-closure-verify.log': 'd13cf224c5183f562b56ffa1cf872d64678369c9ebbe51fb73623e1eee3339dd',
}
const digest = data => crypto.createHash('sha256').update(data).digest('hex')
const hash = file => digest(fs.readFileSync(file))
const gitBytes = (cwd, args) => execFileSync('git', args, { cwd })
const git = (cwd, args) => gitBytes(cwd, args).toString('utf8').trim()
const lines = s => s ? s.split('\n') : []
const failures = []
const note = (ok, text) => { if (!ok) failures.push(text) }

note(hash(path.join(evidence, 'candidate.json')) === '2b6265bd1953c186f553d4092fa98ff87f2a14480a82e04383cc63255e0de071', 'candidate.json 已不同于本轮审签字节。')
note(Object.keys(candidate.source).sort().join('\n') === sourceFiles.slice().sort().join('\n'), 'source 清单不是本轮 14 项。')
note(Object.keys(candidate.bundles).sort().join('\n') === bundleFiles.slice().sort().join('\n'), 'bundle 清单不是本轮 3 项。')

const source = sourceFiles.map(file => {
  const main = hash(path.join(repo, file))
  const isolated = hash(path.join(wt, file))
  const claim = candidate.source[file]
  const matches = main === isolated && main === claim?.sha256 && isolated === claim?.isolatedSha256
  note(matches, `source 身份变化：${file}`)
  return { file, sha256: main, isolatedSha256: isolated, matches, tracked: git(repo, ['ls-files', '--', file]) !== '' }
})
const scoped = cwd => {
  const patch = gitBytes(cwd, ['diff', candidate.baselineCommit, '--', 'launcher', 'packages'])
  return {
    head: git(cwd, ['rev-parse', 'HEAD']),
    trackedPatchSha256: digest(patch),
    trackedFiles: lines(git(cwd, ['diff', '--name-only', candidate.baselineCommit, '--', 'launcher', 'packages'])),
    newFiles: lines(git(cwd, ['ls-files', '--others', '--exclude-standard', '--', 'launcher', 'packages'])),
  }
}
const main = scoped(repo)
const isolated = scoped(wt)
const patchSha256 = hash(path.join(evidence, 'tracked.patch'))
note(main.head === candidate.baselineCommit && isolated.head === candidate.baselineCommit, 'HEAD 已变化。')
note([main.trackedPatchSha256, isolated.trackedPatchSha256, candidate.trackedPatchSha256].every(h => h === patchSha256), 'tracked patch 不一致。')
note(JSON.stringify(main.trackedFiles) === JSON.stringify(isolated.trackedFiles), '两树 tracked 文件集不一致。')
note(JSON.stringify(main.newFiles) === JSON.stringify(isolated.newFiles), '两树新文件集不一致。')
note([...main.trackedFiles, ...main.newFiles].sort().join('\n') === sourceFiles.slice().sort().join('\n'), '产品差异超出 14 文件认领。')
const baseProductDiff = git(repo, ['diff', '--name-only', candidate.productBase, candidate.baselineCommit, '--', 'packages', 'launcher'])
note(baseProductDiff === '', '产品基线至文档 HEAD 存在未认领差异。')

const bundles = bundleFiles.map(file => {
  const actual = hash(path.join(wt, file))
  const matches = actual === candidate.bundles[file]
  note(matches, `bundle 身份变化：${file}`)
  return { file, sha256: actual, matches, mtime: fs.statSync(path.join(wt, file)).mtime.toISOString() }
})
const scriptsRoot = path.join(wt, 'packages/dsh-pm-tool/scripts')
const expectedTargets = fs.readdirSync(scriptsRoot)
  .filter(f => /^verify-.*\.mjs$/.test(f) && !['verify-isolation.mjs', 'verify-real-model.mjs'].includes(f))
  .sort().map(f => `scripts/${f}`)
const logs = Object.entries(pinnedLogs).map(([file, pinnedSha256]) => {
  const archived = path.join(evidence, file)
  const raw = '/private/tmp/' + file
  const bytes = fs.readFileSync(archived)
  const sha256 = digest(bytes)
  note(sha256 === pinnedSha256, `已审原证变化：${file}`)
  const text = bytes.toString('utf8').replace(/\x1b\[[0-9;]*m/g, '')
  const record = {
    file, bytes: bytes.length, sha256, matchesReviewedBytes: sha256 === pinnedSha256,
    originalExists: fs.existsSync(raw),
    matchesMainOriginal: fs.existsSync(raw) ? hash(raw) === sha256 : null,
    finalNewline: text.endsWith('\n'),
    ignoredByGit: spawnSync('git', ['check-ignore', '--', archived], { cwd: repo }).status === 0,
  }
  if (/plugin-tests/.test(file)) {
    const rows = [...text.matchAll(/^\s*✓\s+(\S+)\s+\((\d+) tests?\)/gm)]
    record.tests = {
      files: rows.length, count: rows.reduce((n, row) => n + Number(row[2]), 0),
      finalSummary1134: /Tests\s+1134 passed\s+\(1134\)/.test(text),
    }
    note(record.tests.files === 125 && record.tests.count === 1134 && record.tests.finalSummary1134, 'Vitest 逐项计数与 125/1134 不一致。')
  }
  if (/launcher/.test(file)) {
    record.tap = {
      ok: [...text.matchAll(/^ok \d+ -/gm)].length,
      fail: [...text.matchAll(/^not ok \d+ -/gm)].length,
      summary: text.split('\n').filter(s => /^1\.\.|^# (tests|pass|fail|cancelled|skipped|todo) /.test(s)),
    }
    if (/tests-r2/.test(file)) note(record.tap.ok === 49 && record.tap.fail === 0 && /^# pass 49$/m.test(text), 'Launcher 49/49 不一致。')
  }
  if (/verify/.test(file)) {
    const starts = [...text.matchAll(/^\[guard\] >> (.+)$/gm)].map(m => m[1])
    const commands = [...text.matchAll(/^\[guard\]\s+ok\s+(\S+) \(退出码=0（(\d+)ms）\)/gm)]
      .map(m => ({ command: `node ${m[1]}`, cwd: path.join(wt, 'packages/dsh-pm-tool'), exit: 0, durationMs: Number(m[2]) }))
    const missing = expectedTargets.filter(t => !starts.includes(t))
    const unexpected = starts.filter(t => !expectedTargets.includes(t))
    record.guard = {
      expectedTargets: expectedTargets.length, starts: starts.length,
      uniqueStarts: new Set(starts).size, exit0: commands.length,
      missing, unexpected, commands,
      pollutionSummary: text.split('\n').find(s => /^\[guard\] 资产：/.test(s)),
    }
    note(starts.length === 95 && commands.length === 95 && missing.length === 0 && unexpected.length === 0, `guard 脚本全集不一致：${file}`)
    if (/r3/.test(file)) note(record.guard.pollutionSummary === '[guard] 资产：before=5 after=5，污染 0', 'r3 五根污染断言变化。')
    else note(record.guard.pollutionSummary === '[guard] 资产：before=5 after=4，污染 1', '首次污染历史被改变。')
  }
  return record
})

const watchedRoots = ['data', 'packages/backups', 'packages/backup', 'exports', 'assets']
  .map(root => ({ path: path.join(wt, root), existsNow: fs.existsSync(path.join(wt, root)) }))
const formalBefore = JSON.parse(fs.readFileSync(path.join(evidence, 'formal-before.json'), 'utf8'))
const formalPaths = Object.keys(formalBefore)
const formal = {
  beforeSha256: hash(path.join(evidence, 'formal-before.json')),
  beforeEntries: formalPaths.length,
  beforeData: formalPaths.filter(p => p.includes('/pm-tool/data/')).length,
  beforeBackups: formalPaths.filter(p => p.includes('/pm-tool/packages/backups/')).length,
  beforeExports: formalPaths.filter(p => p.includes('/pm-tool/exports/')).length,
  afterDelivered: fs.readdirSync(evidence).some(f => /^formal.*after.*\.json$/i.test(f)),
}
const r5 = JSON.parse(fs.readFileSync(path.join(repo, 'docs/testing/batcha-independent-retest-result-20261021-r5.json'), 'utf8'))
const inherited = sourceFiles.map(file => ({
  file, beforeMatches: r5.sourceHashes[file] === candidate.source[file].sha256,
  afterMatches: r5.afterSourceHashes[file] === candidate.source[file].sha256,
}))
note(inherited.every(r => r.beforeMatches && r.afterMatches), '第五轮独立复验与当前14文件身份不一致。')
const payload = {
  reviewedAt: new Date().toISOString(),
  reviewerRuntime: { node: process.version, platform: process.platform },
  executor: 'Main（原产品测试）',
  judge: 'trae 独立审证测试专家（本轮不重跑产品测试）',
  main, isolated, source, patchSha256, baseProductDiff, bundles, logs, watchedRoots, formal,
  r5: { startedAt: r5.startedAt, finishedAt: r5.finishedAt, inherited },
  missingEvidence: [
    'Main 逐命令 cwd/argv/时间/外层 exit/stdout-stderr 归属与执行前后候选清单',
    '最终源码到构建产物及运行装载的绑定；server-side产物清单',
    '正式资产同范围 after 与差异，非隔离五根 MISSING 哨兵',
    '原 .log 非忽略交接副本；GUI/Finder/真实TTL按既定用例原证',
  ],
  integrityFailures: failures,
  verdictBoundary: 'exit0仅表示只读身份/日志复核无矛盾，不是A0整门或GUI PASS',
}
if (process.argv.includes('--summary')) {
  payload.source = { count: source.length, allMatch: source.every(s => s.matches) }
  payload.r5.inherited = { count: inherited.length, allMatch: inherited.every(s => s.beforeMatches && s.afterMatches) }
  payload.logs = logs.map(r => {
    if (!r.guard) return r
    const { commands, ...guard } = r.guard
    return { ...r, guard: { ...guard, commandsCount: commands.length, commandsSha256: digest(JSON.stringify(commands)) } }
  })
}
console.log(JSON.stringify(payload, null, 2))
process.exitCode = failures.length ? 1 : 0

/**
 * 本轮只读审证：仅读取已交原证、四格复制树及认领源码，不运行产品。
 * 不访问正式资产内容、runtime/private、认证根；不安装、构建、监听或写文件。
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const wt = '/private/tmp/pmtool-all-closure-20261021'
const evidence = path.join(repo, 'reports/all-pending-evidence-20261021/A0')
const pathsRoot = path.join(evidence, 'paths')
const hashBytes = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const hash = file => hashBytes(fs.readFileSync(file))
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const failures = []
const check = (ok, message) => { if (!ok) failures.push(message) }
const safeRelative = rel => {
  if (path.isAbsolute(rel) || rel.split('/').some(p => ['..', 'runtime', 'private', 'node_modules'].includes(p))) {
    throw new Error(`拒绝未授权路径：${rel}`)
  }
  return rel
}
const sourceFiles = [
  'launcher/package.json', 'launcher/src/launcher-app.mjs', 'launcher/src/local-app.mjs',
  'launcher/test/app.loopback.test.mjs', 'launcher/test/journey-race.test.mjs',
  'launcher/test/local-app.test.mjs', 'packages/dsh-pm-tool/package.json',
  'packages/dsh-pm-tool/pnpm-lock.yaml', 'packages/dsh-pm-tool/scripts/verify-ui-feedback.mjs',
  'packages/dsh-pm-tool/src/client/panel.tsx', 'packages/dsh-pm-tool/src/client/result-card.test.ts',
  'packages/dsh-pm-tool/src/client/result-card.tsx',
  'packages/dsh-pm-tool/src/client/shared/contract-pilot.test.ts',
  'packages/dsh-pm-tool/src/core/file-root.test.ts',
]
const candidate = json(path.join(evidence, 'candidate.json'))
check(candidate.worktree === wt, '候选隔离树变化')
check(Object.keys(candidate.source).sort().join('\n') === sourceFiles.slice().sort().join('\n'), '非冻结14源文件')
const frozen = sourceFiles.map(rel => {
  const claim = candidate.source[rel]
  const main = hash(path.join(repo, rel))
  const isolated = hash(path.join(wt, rel))
  const matches = main === isolated && main === claim.sha256 && isolated === claim.isolatedSha256
  check(matches, `冻结源文件变化：${rel}`)
  return { file: rel, sha256: main, matches }
})
const matrix = json(path.join(pathsRoot, 'matrix.json'))
const expectedTrees = [
  '/private/tmp/pmtool-path-matrix-20261021/plain/pm-tool',
  '/private/tmp/pmtool-path-matrix-20261021/with space/pm-tool',
  '/private/tmp/pmtool-path-matrix-20261021/plain/wt-candidate',
  '/private/tmp/pmtool-path-matrix-20261021/with space/wt candidate',
]
check(matrix.rows.length === 4, '非四格矩阵')
const sourceSets = []
const rows = matrix.rows.map((row, i) => {
  check(row.label === `P${i}` && row.tree === expectedTrees[i], `路径格变化：${row.label}`)
  check(row.package === path.join(expectedTrees[i], 'packages/dsh-pm-tool'), `包路径变化：${row.label}`)
  const realLib = fs.realpathSync(path.join(row.package, 'lib'))
  const expectedLib = path.join(fs.realpathSync(row.package), 'lib')
  check(realLib === expectedLib, `lib不是该格自有目录：${row.label}`)
  sourceSets.push(Object.entries(row.source).sort(([a], [b]) => a.localeCompare(b)))
  let sourceMatches = 0
  let sourceMatchesMain = 0
  let sourceMatchesA0 = 0
  const copiedArtifacts = []
  for (const [rel, claimed] of Object.entries(row.source)) {
    safeRelative(rel)
    const actual = hash(path.join(row.package, rel))
    if (rel.startsWith('.tmp/') || rel.startsWith('backup/')) {
      copiedArtifacts.push({ file: rel, matches: actual === claimed })
      check(actual === claimed, `复制的历史测试产物变化：${row.label}/${rel}`)
      continue
    }
    const main = hash(path.join(repo, 'packages/dsh-pm-tool', rel))
    const isolated = hash(path.join(wt, 'packages/dsh-pm-tool', rel))
    if (actual === claimed) sourceMatches += 1
    if (actual === main) sourceMatchesMain += 1
    if (actual === isolated) sourceMatchesA0 += 1
    check(actual === claimed && actual === main && actual === isolated, `source不一致：${row.label}/${rel}`)
  }
  let bundleMatches = 0
  for (const [rel, claimed] of Object.entries(row.bundles)) {
    safeRelative(rel)
    check(rel.startsWith('lib/'), `非lib产物：${row.label}/${rel}`)
    const matches = hash(path.join(row.package, rel)) === claimed
    if (matches) bundleMatches += 1
    check(matches, `产物字节变化：${row.label}/${rel}`)
  }
  const logs = []
  const assertions = {}
  for (const [index, kind] of ['build', 'verify-export', 'verify-settings'].entries()) {
    const command = row.commands[index]
    const expectedArgv = kind === 'build'
      ? ['pnpm', 'run', 'build']
      : ['/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node', `scripts/${kind}.mjs`]
    check(JSON.stringify(command.argv) === JSON.stringify(expectedArgv) && command.exit === 0, `命令/退出异常：${row.label}/${kind}`)
    for (const stream of ['stdout', 'stderr']) {
      const file = `${row.label}-${kind}-${stream}.txt`
      const bytes = fs.readFileSync(path.join(pathsRoot, file))
      logs.push({ file, bytes: bytes.length, sha256: hashBytes(bytes) })
    }
    const text = fs.readFileSync(path.join(pathsRoot, `${row.label}-${kind}-stdout.txt`), 'utf8')
    if (kind === 'build') {
      assertions.buildComplete = /Build complete/.test(text)
      assertions.pnpmVersion = text.match(/using pnpm (v[\d.]+)/)?.[1] ?? null
      check(assertions.buildComplete, `构建成功尾行缺失：${row.label}`)
    }
    if (kind === 'verify-export') {
      assertions.exportSummary = text.includes('全部导出校验通过。')
      assertions.exportDetails = text.includes('0700/0600、覆盖保护、confirm 覆盖与失败清理')
      check(assertions.exportSummary && assertions.exportDetails, `导出断言缺失：${row.label}`)
    }
    if (kind === 'verify-settings') {
      assertions.settingsSections = [...text.matchAll(/^([A-F]) 通过：/gm)].map(m => m[1])
      assertions.reopenObserved = text.includes('D 通过：全新进程读回自定义口径')
      check(assertions.settingsSections.length === 12 && assertions.reopenObserved, `设置/新进程断言缺失：${row.label}`)
    }
  }
  return {
    label: row.label, tree: row.tree, package: row.package, realLib,
    commands: row.commands,
    manifestSourceEntries: Object.keys(row.source).length,
    sourceCount: Object.keys(row.source).length - copiedArtifacts.length,
    sourceMatches, sourceMatchesMain, sourceMatchesA0,
    copiedArtifactCount: copiedArtifacts.length, copiedArtifactsMatch: copiedArtifacts.every(r => r.matches),
    bundleCount: Object.keys(row.bundles).length, bundleMatches,
    criticalBundles: Object.fromEntries(['lib/index.js', 'lib/core/export.js'].map(rel => [rel, row.bundles[rel]])),
    tempManifestCount: Object.keys(row.tempManifest).length,
    assertions, logs,
  }
})
check(new Set(rows.map(r => r.realLib)).size === 4, '四格共用lib')
check(sourceSets.every(s => JSON.stringify(s) === JSON.stringify(sourceSets[0])), '四格source清单或hash不一致')
const protectedBefore = json(path.join(pathsRoot, 'protected-before.json'))
const protectedAfter = json(path.join(pathsRoot, 'protected-after.json'))
const protectionResult = json(path.join(pathsRoot, 'protection-result.json'))
const protection = Object.keys(protectedBefore).map(root => {
  const before = protectedBefore[root]
  const after = protectedAfter[root]
  const equal = JSON.stringify(before) === JSON.stringify(after)
  check(equal, `保护清单变化：${root}`)
  return {
    root, keys: Object.keys(before), existsBefore: before.exists, existsAfter: after?.exists,
    entries: Object.keys(before.items ?? {}).length,
    hashedFiles: Object.values(before.items ?? {}).filter(v => v.sha256 !== null).length,
    directoryEntries: Object.values(before.items ?? {}).filter(v => v.sha256 === null).length,
    equal,
  }
})
check(JSON.stringify(Object.keys(protectedBefore).sort()) === JSON.stringify(Object.keys(protectedAfter).sort()), '保护根集合变化')
check(protectionResult.changed === false, '作者保护比较非零')
const timing = json(path.join(evidence, 'ttl/real-timing.json'))
const ttlResults = ['BA-TTL-01', 'BA-TTL-02'].map((label, i) => {
  const initial = timing.results.find(r => r.label === label && r.scheduledMs !== undefined)
  const final = timing.results.find(r => r.label === label && r.elapsedMs !== undefined)
  const minimum = i === 0 ? 130000 : 601000
  const matches = initial?.state === 'S3' && final?.elapsedMs >= minimum
    && final?.response.status === (i === 0 ? 200 : 403)
    && final?.state === (i === 0 ? 'S4' : 'S3')
    && (i === 0 || final?.response.body.error === 'invalid-nonce')
  check(matches, `TTL原证不符：${label}`)
  return { label, initial, final, matches }
})
const boardFiles = [
  'packages/dsh-pm-tool/src/client/board/editor.tsx',
  'packages/dsh-pm-tool/src/client/board/board.css',
  'packages/dsh-pm-tool/src/client/panel.css',
  'packages/dsh-pm-tool/src/client/board/BoardBento.tsx',
]
const boardSource = boardFiles.map(rel => {
  const main = hash(path.join(repo, rel))
  const isolated = hash(path.join(wt, rel))
  check(main === isolated, `布局源码两树不同：${rel}`)
  return { file: rel, sha256: main, matches: main === isolated }
})
const boardState = json(path.join(evidence, 'gui/board-edit-ready.json'))
const dragStates = json(path.join(evidence, 'gui/board-drag-states.json'))
const dragInitial = dragStates.find(r => r.label === 'drag0')
const evidenceFiles = [
  'candidate.json', 'tracked.patch',
  'paths/matrix.json', 'paths/protected-before.json', 'paths/protected-after.json', 'paths/protection-result.json',
  'ttl/real-timing.json', 'gui/board-edit-ready.json', 'gui/board-edit-ready.png',
  'gui/board-drag-states.json',
]
console.log(JSON.stringify({
  reviewedAt: new Date().toISOString(),
  reviewerRuntime: { node: process.version, platform: process.platform },
  executor: 'Main，原构建/测试/HTTP/GUI执行',
  reviewer: '独立审证，只读核查',
  frozen: { count: frozen.length, matches: frozen.filter(r => r.matches).length },
  rows, protection, protectionResult, ttlResults, boardSource,
  board: {
    at: boardState.at, viewport: boardState.viewport, pmBBox: boardState.pm.bbox,
    removeCardButtons: boardState.buttons.filter(b => /^移除.*卡片$/.test(b.aria ?? '')).length,
    hasPerCardGeometry: Object.keys(boardState).some(k => /card|widget|stage|grid|scroll/i.test(k)),
    laterInitialGeometry: {
      time: dragInitial.time, cards: dragInitial.cards.map(c => ({ id: c.id, bbox: c.bbox })),
      stage: dragInitial.stage,
    },
  },
  evidenceHashes: evidenceFiles.map(rel => ({ file: rel, sha256: hash(path.join(evidence, rel)) })),
  ttlRunner: { file: '/private/tmp/pmtool-ttl-real-20261021.mjs', sha256: hash('/private/tmp/pmtool-ttl-real-20261021.mjs') },
  integrityFailures: failures,
  boundary: 'exit0仅为已交原证一致；内部横滚实际可达、GUI桥、整门均不能据此PASS',
}, null, 2))
process.exitCode = failures.length ? 1 : 0

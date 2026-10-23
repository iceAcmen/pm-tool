/**
 * 独立审证只读检查：固定候选、源码与脱敏原证，不执行产品模块/用例。
 * 不连接端口、不读凭据、不生成 app、不构建，不写任何文件。
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const isolated = '/private/tmp/pmtool-all-closure-20261021'
const evidenceRoot = path.join(root, 'reports/all-pending-evidence-20261021/A0')
const bundle = '/private/tmp/pmtool-closure-runtime-20261021/app/PM工作台-全部积压验收.app'
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const candidate = readJson(path.join(evidenceRoot, 'candidate.json'))
const sourcePaths = [
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
const reviewPaths = [
  'launcher/src/control-html.mjs',
  'launcher/src/loopback.mjs',
  'launcher/bin/pm-launcher.mjs',
  'launcher/src/panel-model.mjs',
  'launcher/test/control-html.test.mjs',
  'packages/dsh-pm-tool/src/client/launch-handshake.ts',
]
const failures = []
if (candidate.productBase !== '2a7603023bc54ef13d788e50069ee3fde4671bf3') {
  throw new Error('产品基线变化，须重新认领')
}
if (JSON.stringify(Object.keys(candidate.source).sort()) !== JSON.stringify([...sourcePaths].sort())) {
  throw new Error('A0 冻结14文件范围变化，须重新认领')
}
const sources = sourcePaths.map((file) => {
  const main = sha(fs.readFileSync(path.join(root, file)))
  const copy = sha(fs.readFileSync(path.join(isolated, file)))
  const expected = candidate.source[file].sha256
  const matches = main === copy && main === expected && copy === candidate.source[file].isolatedSha256
  if (!matches) failures.push(file)
  return { file, main, isolated: copy, expected, matches }
})
const reviewSources = reviewPaths.map((file) => {
  const main = sha(fs.readFileSync(path.join(root, file)))
  const copy = sha(fs.readFileSync(path.join(isolated, file)))
  const baseline = sha(execFileSync('git', ['show', `${candidate.productBase}:${file}`], { cwd: root }))
  if (main !== copy) failures.push(file)
  return { file, main, isolated: copy, baseline, matches: main === copy, unchangedFromProductBase: main === baseline }
})
const source = fs.readFileSync(path.join(root, 'launcher/src/control-html.mjs'), 'utf8')
const toggleLine = source.split('\n').find((line) => line.includes('id="browser-toggle"'))
const renderLine = source.split('\n').find((line) => line.includes("querySelectorAll('[data-act]')"))
const facts = {
  toggleHasId: Boolean(toggleLine),
  toggleHasDataAct: Boolean(toggleLine?.includes('data-act=')),
  toggleBranchInsideDataActBinding: Boolean(renderLine?.includes("id==='browser-toggle'")),
  menuInitiallyClosed: source.includes('let menuOpen=false'),
  refreshReferences: [...source.matchAll(/\brefresh\s*\(/g)].length,
  initialRefreshOnly: source.includes('render(); refresh();'),
  automaticSyncSymbols: ['setInterval', 'setTimeout', 'EventSource', 'WebSocket', 'postMessage', 'visibilitychange']
    .filter((symbol) => source.includes(symbol)),
}
const evidencePaths = [
  'finder/safe-app.json',
  'finder/browser-toggle-after.json',
  'finder/browser-toggle-after.png',
  'finder/control-after-open.json',
  'finder/control-after-open.png',
  'finder/control-settled-open.json',
  'gui/finder-control-initial.json',
  'gui/finder-control-initial.png',
]
const evidence = evidencePaths.map((file) => {
  const absolute = path.join(evidenceRoot, file)
  if (!fs.existsSync(absolute)) return { file, present: false }
  const bytes = fs.readFileSync(absolute)
  const item = { file, present: true, bytes: bytes.length, sha256: sha(bytes) }
  if (file.endsWith('.json')) {
    const value = JSON.parse(bytes)
    item.at = value.at ?? null
    if (file.includes('browser-toggle-after')) {
      item.expanded = value.expanded
      item.options = value.options
    }
    if (file.includes('control-after-open') || file.includes('control-settled-open')) {
      item.observedS1Text = value.text?.includes('工作台已在运行') ?? false
      item.observedS3Text = value.text?.includes('已在浏览器投递，等待已进入回告') ?? false
      item.observedS4Text = value.text?.includes('工作台已打开') ?? false
    }
  }
  return item
})
const safe = readJson(path.join(evidenceRoot, 'finder/safe-app.json'))
if (safe.bundle !== bundle) throw new Error('safe app 路径变化，拒绝读取其他 runtime 文件')
const artifact = ['Contents/MacOS/launch', 'Contents/Info.plist'].map((file) => {
  const bytes = fs.readFileSync(path.join(bundle, file))
  const actual = sha(bytes)
  const matches = actual === safe.files[file]
  if (!matches) failures.push(`safe-app/${file}`)
  return { file, actual, expected: safe.files[file], matches }
})
const shell = fs.readFileSync(path.join(bundle, 'Contents/MacOS/launch'), 'utf8')
const shellBinding = {
  isolatedLauncher: shell.includes(`LAUNCHER_BIN='${isolated}/launcher/bin/pm-launcher.mjs'`),
  node22: shell.includes("BAKED_NODE='/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'"),
  target3205: shell.includes("export PM_PORT='3205'"),
  isolatedHome: shell.includes("export DSH_HOME='/private/tmp/pmtool-closure-runtime-20261021/home'"),
}
if (Object.values(shellBinding).some((value) => !value)) failures.push('safe-app/shell-binding')
const result = {
  at: new Date().toISOString(),
  environment: { platform: process.platform, node: process.version, cwd: root },
  head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  productBase: candidate.productBase,
  candidateSha256: sha(fs.readFileSync(path.join(evidenceRoot, 'candidate.json'))),
  trackedPatchSha256: sha(fs.readFileSync(path.join(evidenceRoot, 'tracked.patch'))),
  sources, reviewSources, facts, evidence, artifact, shellBinding,
  integrityFailures: failures,
  boundary: 'exit0仅为只读审证检查无身份矛盾；不执行产品、GUI或服务测试，不判整体PASS',
}
console.log(JSON.stringify(result, null, 2))
process.exitCode = failures.length ? 1 : 0

// 独立审查探针：仅复制冻结模块到 tmp，解析生成壳及调用内存编排，不启动服务。
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const candidate = '2a7603023bc54ef13d788e50069ee3fde4671bf3'
const scratch = mkdtempSync(join(tmpdir(), 'pm-qa-batcha-'))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const sources = {}
for (const name of ['local-app.mjs', 'launcher-app.mjs', 'launcher-core.mjs', 'panel-model.mjs']) {
  const path = `launcher/src/${name}`
  const bytes = execFileSync('git', ['show', `${candidate}:${path}`], { cwd: root })
  if (sha(bytes) !== sha(readFileSync(join(root, path)))) throw new Error(`候选字节不一致：${path}`)
  sources[path] = sha(bytes)
  writeFileSync(join(scratch, name), bytes)
}
const { buildLocalAppBundle } = await import(pathToFileURL(join(scratch, 'local-app.mjs')).href)
const { createLauncherApp } = await import(pathToFileURL(join(scratch, 'launcher-app.mjs')).href)
const paths = []
for (const [label, launcherBin, nodePath] of [
  ['plain', '/tmp/pm-qa/bin/main.mjs', '/tmp/pm-qa/node'],
  ['space', '/tmp/pm qa/bin/main.mjs', '/tmp/pm qa/node'],
  ['quote-launcher', "/tmp/pm'qa/bin/main.mjs", '/tmp/pm-qa/node'],
  ['quote-node', '/tmp/pm-qa/bin/main.mjs', "/tmp/pm'qa/node"],
  // 只解析、不执行；静态路径展示闭合单引号后出现独立命令的风险。
  ['injection-syntax-only', "/tmp/qa'; :; #/main.mjs", '/tmp/pm-qa/node'],
]) {
  const bundle = buildLocalAppBundle({ outDir: join(scratch, label), name: 'QA', launcherBin, nodePath })
  const shell = join(bundle, 'Contents/MacOS/launch')
  const syntax = spawnSync('/bin/sh', ['-n', shell], { encoding: 'utf8' })
  paths.push({
    label, syntaxExit: syntax.status, stderr: syntax.stderr.trim(),
    assignment: readFileSync(shell, 'utf8').split('\n').slice(2, 4),
    scriptSha256: sha(readFileSync(shell)),
  })
}
const journeys = []
for (const action of ['reopen', 'switch-browser', 'select-browser', 'cancel', 'back', 'report-auth-error', 'open', 'retry']) {
  const opened = []
  const app = createLauncherApp({
    port: 34999, browsers: ['Chrome', 'Safari'],
    probeService: async () => ({ tcpOpen: true, httpStatus: 401, authRequiredBody: 'dsh web authentication required' }),
    openBrowser: argv => opened.push(argv),
    controller: { cancelStartup() {} },
  })
  app.setLoopbackPort(34998) // 只是句柄数值；没有监听。
  await app.handleAction({ type: 'select-browser', browser: 'Chrome' })
  await app.handleAction({ type: 'open' })
  const oldNonce = opened[0].join(' ').match(/pm-launch=\d+\.([a-f0-9]+)/)?.[1]
  if (!oldNonce) throw new Error('没有内存回告句柄')
  await app.handleAction({ type: action, browser: 'Safari' })
  const before = app.getState()
  const accepted = app.verifyEntered(oldNonce)
  if (accepted) app.onEntered(oldNonce)
  const after = app.getState()
  journeys.push({
    action, beforeStatus: before.status, beforeBrowser: before.browser,
    selectedBrowser: before.selectedBrowser, oldAccepted: accepted,
    afterStatus: after.status, afterBrowser: after.browser,
    subtitle: app.view().subtitle, replayAccepted: app.verifyEntered(oldNonce),
  })
}
const result = {
  candidate, capturedAt: new Date().toISOString(), runtime: process.version,
  platform: process.platform, scratch, sources, paths, journeys,
  boundaries: ['未启动服务', '未执行生成壳', '无浏览器或HTTP采证', '未改时钟', 'nonce仅内存且不输出'],
}
const output = resolve(root, 'docs/testing/batcha-review-probe-result-20261021.json')
writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))

#!/usr/bin/env node
/**
 * 启动器隔离自检（假监听者；不真实 spawn dsh、不碰 3172、不读 cookie、不读凭证）。
 * 验证：401 鉴权墙身份匹配仍 running、200 复用、关闭端口→start、conflict 安全失败、
 * 正式参数镜像、token 脱敏、控制器内存捕获/即弃/拒绝 stop/cancel 仅放弃。
 * 退出码非 0 即失败。
 */
import { createServer } from 'node:http'
import assert from 'node:assert/strict'

import {
  classifyProbe,
  decideAction,
  dshSpawnArgs,
  parseDshWebLine,
  redactUrl,
  openBrowserArgs,
} from '../src/launcher-core.mjs'
import { createDshController } from '../src/dsh-controller.mjs'

const AUTH_WALL = 'dsh web authentication required; reopen the URL printed by dsh web.'

function listenFake(status, body = '') {
  return new Promise((resolve) => {
    const server = createServer((_req, res) => {
      res.writeHead(status)
      res.end(body)
    })
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

async function main() {
  // 1) 401 鉴权墙（身份匹配）→ running，不误判 S5/冲突。
  const a = await listenFake(401, AUTH_WALL)
  const p401 = classifyProbe({ tcpOpen: true, httpStatus: 401, authRequiredBody: AUTH_WALL })
  assert.equal(p401, 'running')
  const d401 = decideAction(p401, { browser: 'Chrome' })
  assert.equal(d401.action, 'open-existing')
  assert.equal(d401.reuse, true)
  assert.equal(d401.token, undefined)
  a.server.close()

  // 2) 200 → running 尽力复用，非 success、不 spawn、不带 token。
  const b = await listenFake(200)
  const p200 = classifyProbe({ tcpOpen: true, httpStatus: 200, authRequiredBody: '' })
  assert.equal(p200, 'running')
  const d200 = decideAction(p200, { browser: '系统默认浏览器' })
  assert.equal(d200.action, 'open-existing')
  b.server.close()

  // 3) 关闭端口 → not-running → start。
  const pClosed = classifyProbe({ tcpOpen: false, httpStatus: undefined, authRequiredBody: '' })
  assert.equal(pClosed, 'not-running')
  const dStart = decideAction(pClosed, { browser: 'Safari' })
  assert.equal(dStart.action, 'start')
  assert.equal(dStart.needStart, true)

  // 4) 可达但身份不匹配 → conflict 安全失败，无 kill/spawn/争端口，可重试。
  const pConflict = classifyProbe({ tcpOpen: true, httpStatus: 503, authRequiredBody: 'upstream other' })
  assert.equal(pConflict, 'conflict')
  const dConflict = decideAction(pConflict, { browser: '系统默认浏览器' })
  assert.equal(dConflict.action, 'safe-failure')
  assert.equal(dConflict.reason, 'port-conflict')
  assert.equal(dConflict.retryable, true)
  assert.equal(dConflict.killPid, undefined)
  assert.equal(dConflict.spawn, undefined)
  assert.equal(dConflict.contendPort, undefined)

  // 5) 正式参数镜像。
  const args = dshSpawnArgs(3172)
  for (const flag of ['--profile', 'pm', '--host', '127.0.0.1', '--port', '3172', '--no-open']) {
    assert.ok(args.includes(flag), `缺少正式参数 ${flag}`)
  }
  assert.ok(args.some((x) => x.includes('apps/cli/src/bin.ts')))

  // 6) 解析完整首投 URL（含 token）+ 干净 baseUrl；日志脱敏不回显 token。
  const parsed = parseDshWebLine('dsh web: http://127.0.0.1:3172/?token=OneShot')
  assert.equal(parsed.token, 'OneShot')
  assert.ok(parsed.url.includes('token=OneShot'))
  assert.ok(!parsed.baseUrl.includes('token='))
  assert.ok(!redactUrl('http://127.0.0.1:3172/?token=OneShot').includes('OneShot'))
  assert.match(redactUrl('http://127.0.0.1:3172/?token=OneShot'), /token=REDACTED/)
  assert.deepEqual(openBrowserArgs('Safari', 'http://x/').argv, ['open', '-a', 'Safari', 'http://x/'])

  // 7) 控制器：fake spawn 内存捕获、打开后即弃；cancel 仅回收尚未就绪的 owned 子进程，
  //    已就绪/现网/未知 PID 一律不杀；stop 拒绝。
  const fakeChild = {
    pid: 8888,
    stdout: { on(_e, fn) { queueMicrotask(() => fn('dsh web: http://127.0.0.1:0/?token=MemToken\n')) } },
    stderr: { on() {} },
  }
  const controller = createDshController({ spawn: () => fakeChild, isReady: async () => true, sleep: async () => {} })
  const entry = await controller.start({ cwd: '/tmp/x', nodePath: '/usr/bin/node', port: 0, env: {} })
  assert.equal(entry.pid, 8888)
  assert.equal(entry.token, 'MemToken')
  assert.ok(entry.authenticatedUrl.includes('token=MemToken'))
  assert.deepEqual(controller.listOwnedPids(), [8888])
  controller.forgetAuthenticatedUrl(8888)
  assert.deepEqual(controller.listOwnedPids(), [])
  controller.cancelStartup() // 仅放弃在途，不抛、不杀
  assert.throws(() => controller.stop(), /不提供停止|停止\/杀死/)

  console.log('verify-launcher: PASS（隔离假监听者；未碰 3172、未读 cookie、未读凭证）')
}

main().catch((error) => {
  console.error('verify-launcher: FAIL', error)
  process.exit(1)
})

/**
 * 七态合同（S0–S6）：S4 仅由受认证工作台权威回告到达，非用户按钮。
 * 安全：S3 不得当 success；401→S5；不重放进程启动令牌；不读/注入 cookie；不 kill；不争端口。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  classifyProbe,
  decideAction,
  parseDshWebLine,
  redactUrl,
  openBrowserArgs,
  dshSpawnArgs,
  createLauncherState,
} from '../src/launcher-core.mjs'
import { buildPanelViewModel } from '../src/panel-model.mjs'

const AUTH_WALL = 'dsh web authentication required; reopen the URL printed by dsh web.'

// ---------------- 探测与决策 ----------------
test('探测：端口拒绝 → not-running → 决策 start（S0）', () => {
  const p = classifyProbe({ tcpOpen: false, httpStatus: undefined, authRequiredBody: '' })
  assert.equal(p, 'not-running')
  const d = decideAction(p, { browser: '系统默认浏览器' })
  assert.equal(d.action, 'start')
  assert.equal(d.needStart, true)
  assert.equal(d.reuse, undefined)
})

test('探测：无 cookie 的 200 不可能是 dsh（dsh 无 cookie 恒 401 墙）→ conflict → 安全失败，不误开未知服务', () => {
  const p = classifyProbe({ tcpOpen: true, httpStatus: 200, authRequiredBody: '' })
  assert.equal(p, 'conflict')
  const d = decideAction(p, { browser: 'Chrome' })
  assert.equal(d.action, 'safe-failure')
  assert.equal(d.reuse, undefined)
  assert.equal(d.spawn, undefined)
  assert.equal(d.token, undefined)
})

test('探测：识别出的 401 鉴权墙（身份匹配）→ 仍 running(S1)，不误判为 S5/失败', () => {
  const p = classifyProbe({ tcpOpen: true, httpStatus: 401, authRequiredBody: AUTH_WALL })
  assert.equal(p, 'running')
  const d = decideAction(p, { browser: 'Safari' })
  assert.equal(d.action, 'open-existing')
  assert.equal(d.reuse, true)
})

test('探测：可达但身份不匹配 → conflict → 安全失败，无 kill/spawn/争端口，可重试', () => {
  const p = classifyProbe({ tcpOpen: true, httpStatus: 503, authRequiredBody: 'upstream something else' })
  assert.equal(p, 'conflict')
  const d = decideAction(p, { browser: '系统默认浏览器' })
  assert.equal(d.action, 'safe-failure')
  assert.equal(d.reason, 'port-conflict')
  assert.equal(d.retryable, true)
  assert.equal(d.killPid, undefined)
  assert.equal(d.spawn, undefined)
  assert.equal(d.contendPort, undefined)
  assert.match(d.guidance, /占用|未停止|现有|重试/i)
})

// ---------------- 状态机 S0–S6 ----------------
test('状态机：S1 直接投递 → S3（待鉴权），未经确认不得到 S4', () => {
  const m = createLauncherState()
  m.transition({ type: 'detect', probe: 'running' })
  assert.equal(m.snapshot().status, 'S1')
  m.transition({ type: 'delivered', browser: 'Chrome' })
  assert.equal(m.snapshot().status, 'S3')
  assert.notEqual(m.snapshot().status, 'S4')
})

test('状态机：S0 需启动 → S2 → 完成 → S3；权威 entered 回告 → S4（非按钮）', () => {
  const m = createLauncherState()
  m.transition({ type: 'detect', probe: 'not-running' })
  assert.equal(m.snapshot().status, 'S0')
  m.transition({ type: 'open', needStart: true })
  assert.equal(m.snapshot().status, 'S2')
  m.transition({ type: 'step', index: 1 })
  m.transition({ type: 'delivered', browser: 'Chrome' })
  assert.equal(m.snapshot().status, 'S3')
  m.transition({ type: 'entered' })
  assert.equal(m.snapshot().status, 'S4')
  assert.equal(m.snapshot().browser, 'Chrome')
})

test('状态机：S3 用户反馈登录错误 → S5（非探测推断）；S5 重试/换浏览器 → S3（不直接 S4）', () => {
  const m = createLauncherState()
  m.transition({ type: 'detect', probe: 'running' })
  m.transition({ type: 'delivered', browser: 'Firefox' })
  m.transition({ type: 'report-auth-error', detail: { code: 401, reason: '跨 profile 无 cookie' } })
  assert.equal(m.snapshot().status, 'S5')
  m.transition({ type: 'retry' })
  assert.equal(m.snapshot().status, 'S3')
  m.transition({ type: 'report-auth-error', detail: { code: 401 } })
  m.transition({ type: 'switch-browser', browser: 'Safari' })
  assert.equal(m.snapshot().status, 'S3')
})

test('状态机：S2 取消 → S0；S6 返回 → S0；关闭 → closed（均不停服务）', () => {
  const m2 = createLauncherState()
  m2.transition({ type: 'open', needStart: true })
  m2.transition({ type: 'cancel' })
  assert.equal(m2.snapshot().status, 'S0')

  const m3 = createLauncherState()
  m3.transition({ type: 'failure', detail: { detection: '占用', outcome: '未停止任何程序', suggestion: '重试' } })
  assert.equal(m3.snapshot().status, 'S6')
  m3.transition({ type: 'back' })
  assert.equal(m3.snapshot().status, 'S0')

  const m4 = createLauncherState()
  m4.transition({ type: 'close' })
  assert.equal(m4.snapshot().status, 'closed')
})

// ---------------- 面板视图（路径B） ----------------
test('S3 面板：等待已进入回告；无「我已进入」假成功按钮；仅「看到登录/认证错误」+更换浏览器；禁止已打开/成功措辞', () => {
  const vm = buildPanelViewModel({ status: 'S3', browser: 'Chrome', step: 0 }, {})
  assert.equal(vm.view, 'S3')
  assert.match(vm.subtitle, /回告|登录/i)
  const labels = vm.actions.map((a) => a.label).join(' ')
  assert.ok(!/我已进入|用户确认/.test(labels))
  assert.ok(vm.actions.some((a) => /看到登录 \/ 认证错误|认证错误/.test(a.label)))
  assert.ok(!/已打开|成功/.test(vm.title))
})

test('S5 面板：已打开但未登录；在标签页完成登录 / 换用已登录浏览器；折叠诊断含 401/跨profile（用户反馈触发）', () => {
  const detail = { code: 401, detection: '该浏览器无本机服务签发的签名 cookie，新浏览器无登录态', outcome: '未注入会话、未重放进程启动令牌', suggestion: '在已登录浏览器打开' }
  const vm = buildPanelViewModel({ status: 'S5', detail, step: 0 }, {})
  assert.equal(vm.view, 'S5')
  assert.match(vm.title, /未登录/)
  assert.ok(vm.actions.some((a) => /完成登录/.test(a.label)))
  assert.ok(vm.actions.some((a) => /已登录的浏览器/.test(a.label)))
  assert.equal(vm.detail.code, 401)
})

test('S6 面板：白话原因 +「没有停止任何程序」+ 重新尝试/查看详情折叠/返回', () => {
  const detail = { detection: '本地端口被其他程序占用', outcome: '没有停止任何程序，项目数据和现有服务保持不变', suggestion: '确认占用程序后重试' }
  const vm = buildPanelViewModel({ status: 'S6', detail, step: 0 }, {})
  assert.equal(vm.view, 'S6')
  assert.match(vm.detail.outcome, /没有停止任何程序/)
  assert.deepEqual(vm.actions.map((a) => a.id), ['retry', 'toggle-detail', 'back'])
})

test('S4 面板：权威回告后显示「工作台已打开」+ 再次打开/更换浏览器', () => {
  const vm = buildPanelViewModel({ status: 'S4', browser: 'Chrome', step: 0 }, {})
  assert.equal(vm.view, 'S4')
  assert.match(vm.title, /工作台已打开/)
  assert.deepEqual(vm.actions.map((a) => a.id), ['reopen', 'switch-browser'])
})

// ---------------- 安全缝（保留） ----------------
test('安全缝：正式参数镜像；token 解析仅内存；日志脱敏；open 参数；不重放', () => {
  const args = dshSpawnArgs(3172)
  for (const f of ['--profile', 'pm', '--host', '127.0.0.1', '--port', '3172', '--no-open']) {
    assert.ok(args.includes(f))
  }
  const parsed = parseDshWebLine('dsh web: http://127.0.0.1:3172/?token=OneShot')
  assert.equal(parsed.token, 'OneShot')
  assert.ok(!redactUrl('http://127.0.0.1:3172/?token=OneShot').includes('OneShot'))
  assert.deepEqual(openBrowserArgs('Safari', 'http://x/').argv, ['open', '-a', 'Safari', 'http://x/'])
})

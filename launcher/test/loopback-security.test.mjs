/**
 * F-M1 loopback 安全红测试（真实 loopback IO，临时端口；不碰 3172、不读 cookie）。
 *  - Host 白名单：仅 127.0.0.1:<boundPort> / localhost:<boundPort>；foreign Host → 403。
 *  - POST /api/action：须 same Origin + application/json；evil/null Origin、text/plain 拒绝。
 *  - 无 Origin（CLI）不默默放行：须带受控内存 nonce；不开 CORS；GET 只读。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { request as httpRequest } from 'node:http'

import { createControlServer } from '../src/loopback.mjs'

/** 原始 http 请求（可自由覆盖 Host），返回 {status}。 */
function rawRequest(port, { method = 'GET', path = '/', headers = {} }) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: '127.0.0.1', port, method, path, headers }, (res) => {
      res.resume()
      res.on('end', () => resolve({ status: res.statusCode }))
    })
    req.on('error', reject)
    req.end()
  })
}

async function boot() {
  const calls = []
  const server = createControlServer({
    getState: () => ({ status: 'S0', step: 0 }),
    handleAction: (p) => { calls.push(p); return { status: 'S0' } },
    renderHtml: () => '<html><body>control</body></html>',
  })
  const { port, close, nonce } = await server.listen()
  return { port, close, calls, nonce }
}

const post = (port, body, headers = {}) =>
  fetch(`http://127.0.0.1:${port}/api/action`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body ?? { type: 'open' }),
  })

test('foreign Host（evil.com）→ 403，GET/POST 都拒绝，不触发动作', async () => {
  const { port, close, calls } = await boot()
  try {
    const g = await rawRequest(port, { headers: { Host: 'evil.com' } })
    const p = await rawRequest(port, { method: 'POST', path: '/api/action', headers: { Host: 'evil.com', 'content-type': 'application/json' } })
    assert.equal(g.status, 403)
    assert.equal(p.status, 403)
    assert.deepEqual(calls, [])
  } finally {
    await close()
  }
})

test('evil Origin（https://evil.com）+ 合法 JSON → 403，handleAction 不被调用', async () => {
  const { port, close, calls } = await boot()
  try {
    const res = await post(port, { type: 'open' }, { Origin: 'https://evil.com' })
    assert.equal(res.status, 403)
    assert.deepEqual(calls, [])
  } finally {
    await close()
  }
})

test('null Origin（Origin: null）无 nonce → 403，不触发动作', async () => {
  const { port, close, calls } = await boot()
  try {
    const res = await post(port, { type: 'open' }, { Origin: 'null' })
    assert.equal(res.status, 403)
    assert.deepEqual(calls, [])
  } finally {
    await close()
  }
})

test('text/plain（跨站简单请求）same Origin → 拒绝（非 JSON），不触发动作', async () => {
  const { port, close, calls } = await boot()
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/action`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain', Origin: `http://127.0.0.1:${port}` },
      body: 'type=open',
    })
    assert.ok(res.status === 415 || res.status === 403)
    assert.deepEqual(calls, [])
  } finally {
    await close()
  }
})

test('合法 same Origin + application/json → 200，动作被调用；响应不发 CORS 头', async () => {
  const { port, close, calls } = await boot()
  try {
    const res = await post(port, { type: 'open' }, { Origin: `http://127.0.0.1:${port}` })
    assert.equal(res.status, 200)
    assert.equal(calls.length, 1)
    assert.equal(res.headers.get('access-control-allow-origin'), null)
  } finally {
    await close()
  }
})

test('无 Origin（CLI）无 nonce → 403；带正确内存 nonce → 200', async () => {
  const { port, close, calls, nonce } = await boot()
  try {
    const denied = await post(port, { type: 'open' })
    assert.equal(denied.status, 403)
    assert.deepEqual(calls, [])
    const ok = await post(port, { type: 'open' }, { 'x-csrf-nonce': nonce })
    assert.equal(ok.status, 200)
    assert.equal(calls.length, 1)
  } finally {
    await close()
  }
})

test('GET /api/state 只读，不触发任何动作；不含 token 字段', async () => {
  const { port, close, calls } = await boot()
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/state`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(calls.length, 0)
    assert.ok(!('token' in body.state))
  } finally {
    await close()
  }
})

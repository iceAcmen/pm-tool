/**
 * 本地 control 页 loopback 服务：只绑定 127.0.0.1 临时端口（F-M1 加固）。
 *
 * 安全：
 *  - Host 白名单：仅 127.0.0.1:<boundPort> / localhost:<boundPort>，防 DNS rebinding；拒绝未知 Host。
 *  - POST /api/action：须 same Origin + application/json；无 Origin（CLI）须带受控内存 nonce；不发通配 CORS。
 *  - POST /api/entered：仅配置的 expected workbench Origin 可确认，响应最小 CORS 与 preflight；其余 Origin 拒绝。
 *  - GET / 与 /api/state 只读，不触达动作；不回显 token、不读 cookie、不做鉴权中转；关页不停服务。
 *  - nonce 仅内存（每实例随机），与 DSH token 完全分离，不落盘、不写日志。
 */
import { createServer } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * @param {{getState:()=>object, handleAction:(payload:object)=>object, renderHtml:(state:object,ctx:{nonce:string})=>string, nonce?:string, expectedOrigin?:string, verifyEntered?:(nonce:string)=>boolean, onEntered?:(nonce:string)=>object}} deps
 *
 * expectedOrigin：受认证工作台的预期 origin（如 http://127.0.0.1:3172），用于 /api/entered
 * 跨端口 CORS 白名单；除 control 自身 origin 外仅此一个精确 origin，不用通配。
 * verifyEntered/onEntered：nonce 由 app 内存管理（single-use、短 TTL、过期/重复/错误全否）。
 */
export function createControlServer(deps) {
  const nonce = deps.nonce ?? randomBytes(16).toString('hex')
  const expectedOrigin = deps.expectedOrigin ?? null
  let boundPort = 0

  function hostAllowed(hostHeader) {
    if (!hostHeader) return false
    const idx = hostHeader.lastIndexOf(':')
    const host = idx >= 0 ? hostHeader.slice(0, idx) : hostHeader
    const portStr = idx >= 0 ? hostHeader.slice(idx + 1) : ''
    if (Number(portStr) !== boundPort) return false
    return host === '127.0.0.1' || host === 'localhost'
  }

  function controlOrigin() {
    return `http://127.0.0.1:${boundPort}`
  }

  /** 精确白名单：control 自身 origin + 唯一 expectedOrigin；其余一律拒绝。 */
  function originAllowed(origin) {
    if (!origin) return false
    return origin === controlOrigin() || origin === expectedOrigin
  }

  /** 跨端口回告所需的最小 CORS 头（不发通配 ACAO）。 */
  function corsHeaders(res, origin) {
    if (originAllowed(origin)) {
      res.setHeader('access-control-allow-origin', origin)
      res.setHeader('vary', 'Origin')
      res.setHeader('access-control-allow-headers', 'content-type')
      res.setHeader('access-control-allow-methods', 'POST')
      res.setHeader('access-control-max-age', '60')
    }
  }

  function validNonce(given) {
    if (typeof given !== 'string' || !given) return false
    const a = Buffer.from(given)
    const b = Buffer.from(nonce)
    return a.length === b.length && timingSafeEqual(a, b)
  }

  function reject(res, code = 403, message = 'forbidden') {
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff' })
    res.end(JSON.stringify({ error: message }))
  }

  const server = createServer((req, res) => {
    res.setHeader('x-content-type-options', 'nosniff')
    res.setHeader('referrer-policy', 'no-referrer')

    // Host 白名单（含 DNS rebinding：攻击者域名解析到 127.0.0.1 但 Host 非白名单）。
    if (!hostAllowed(req.headers.host)) return reject(res)

    const url = new URL(req.url ?? '/', `http://127.0.0.1:${boundPort}`)

    if (req.method === 'GET' && url.pathname === '/') {
      const html = deps.renderHtml(deps.getState(), { nonce })
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff' })
      res.end(html)
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/state') {
      // 只读：只回必要状态字段（getState 已不含 token），不触达动作。
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ state: deps.getState() }))
      return
    }

    // 不开 CORS 通配：仅对白名单 origin 响应 preflight，其余 405。
    if (req.method === 'OPTIONS') {
      const origin = req.headers.origin
      if (originAllowed(origin)) {
        corsHeaders(res, origin)
        res.writeHead(204, { 'x-content-type-options': 'nosniff' })
        res.end()
      } else {
        res.writeHead(405, { 'content-type': 'text/plain' })
        res.end('method not allowed')
      }
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/entered') {
      // 受认证工作台跨端口回告已进入。仅「配置的 expectedOrigin（workbench）」可确认；
      // 无 Origin（持 CSRF nonce 不等于已认证）与 control 自身 Origin 一律拒绝，不兜底。
      const origin = req.headers.origin
      if (origin !== expectedOrigin) return reject(res, 403, 'origin-not-allowed')
      const contentType = String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
      if (contentType !== 'application/json') return reject(res, 415, 'unsupported-media-type')

      let raw = ''
      req.on('data', (c) => {
        raw += c
        if (raw.length > 1024) req.destroy()
      })
      req.on('end', () => {
        let payload = {}
        try {
          payload = raw ? JSON.parse(raw) : {}
        } catch {
          return reject(res, 400, 'bad-request')
        }
        const given = payload && typeof payload === 'object' ? payload.nonce : undefined
        if (typeof given !== 'string' || !given || typeof deps.verifyEntered !== 'function' || !deps.verifyEntered(given)) {
          return reject(res, 403, 'invalid-nonce')
        }
        corsHeaders(res, origin)
        const next = typeof deps.onEntered === 'function' ? deps.onEntered(given) : deps.getState()
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff' })
        res.end(JSON.stringify({ state: next }))
      })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/action') {
      const contentType = String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
      if (contentType !== 'application/json') return reject(res, 415, 'unsupported-media-type')

      const origin = req.headers.origin
      if (origin !== undefined && origin !== '') {
        // 浏览器：仅 control 自身 origin（工作台 origin 不允许触发 control 动作）。
        if (origin !== controlOrigin()) return reject(res)
      } else {
        // 无 Origin（CLI/curl 等非浏览器）：不默默放行，须带受控内存 nonce。
        if (!validNonce(req.headers['x-csrf-nonce'])) return reject(res)
      }

      let raw = ''
      req.on('data', (c) => {
        raw += c
        if (raw.length > 4096) req.destroy()
      })
      req.on('end', async () => {
        let payload = {}
        try {
          payload = raw ? JSON.parse(raw) : {}
        } catch {
          return reject(res, 400, 'bad-request')
        }
        const next = await deps.handleAction(payload)
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ state: next }))
      })
      return
    }

    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('not found')
  })

  return {
    listen() {
      return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
          boundPort = server.address().port
          resolve({
            port: boundPort,
            nonce,
            close: () => new Promise((r) => server.close(() => r())),
          })
        })
      })
    },
    server,
  }
}

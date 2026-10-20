/**
 * 本地 control 页 loopback 服务：只绑定 127.0.0.1 临时端口（F-M1 加固）。
 *
 * 安全：
 *  - Host 白名单：仅 127.0.0.1:<boundPort> / localhost:<boundPort>，防 DNS rebinding；拒绝未知 Host。
 *  - POST /api/action：须 same Origin + application/json；无 Origin（CLI）须带受控内存 nonce；不开 CORS、不响应 preflight。
 *  - GET / 与 /api/state 只读，不触达动作；不回显 token、不读 cookie、不做鉴权中转；关页不停服务。
 *  - nonce 仅内存（每实例随机），与 DSH token 完全分离，不落盘、不写日志。
 */
import { createServer } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * @param {{getState:()=>object, handleAction:(payload:object)=>object, renderHtml:(state:object,ctx:{nonce:string})=>string, nonce?:string}} deps
 */
export function createControlServer(deps) {
  const nonce = deps.nonce ?? randomBytes(16).toString('hex')
  let boundPort = 0

  function hostAllowed(hostHeader) {
    if (!hostHeader) return false
    const idx = hostHeader.lastIndexOf(':')
    const host = idx >= 0 ? hostHeader.slice(0, idx) : hostHeader
    const portStr = idx >= 0 ? hostHeader.slice(idx + 1) : ''
    if (Number(portStr) !== boundPort) return false
    return host === '127.0.0.1' || host === 'localhost'
  }

  function originAllowed(origin) {
    return origin === `http://127.0.0.1:${boundPort}` || origin === `http://localhost:${boundPort}`
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

    // 不开 CORS：不发 Access-Control-Allow-*，不放行 preflight。
    if (req.method === 'OPTIONS') {
      res.writeHead(405, { 'content-type': 'text/plain' })
      res.end('method not allowed')
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/action') {
      const contentType = String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
      if (contentType !== 'application/json') return reject(res, 415, 'unsupported-media-type')

      const origin = req.headers.origin
      if (origin !== undefined && origin !== '') {
        // 浏览器：必须 same Origin。
        if (!originAllowed(origin)) return reject(res)
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

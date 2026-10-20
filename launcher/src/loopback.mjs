/**
 * 本地 control 页 loopback 服务：只绑定 127.0.0.1 临时端口。
 * - GET / ：渲染 control HTML；GET /api/state：状态 JSON；POST /api/action：执行动作。
 * - 不回显 token、不读 cookie、不做鉴权中转；关闭浏览器页不停止后端服务。
 */
import { createServer } from 'node:http'

/**
 * @param {{getState:()=>object, handleAction:(payload:object)=>object, renderHtml:(state:object)=>string}} deps
 */
export function createControlServer(deps) {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')

    if (req.method === 'GET' && url.pathname === '/') {
      const html = deps.renderHtml(deps.getState())
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff' })
      res.end(html)
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/state') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ state: deps.getState() }))
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/action') {
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
          res.writeHead(400, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ error: 'bad-request' }))
          return
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
          const { port } = server.address()
          resolve({ port, close: () => new Promise((r) => server.close(() => r())) })
        })
      })
    },
    server,
  }
}

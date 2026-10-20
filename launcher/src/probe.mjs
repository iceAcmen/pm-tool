/**
 * 本地服务探测（只读、无凭证）。
 * - TCP 连通 + 一次无 cookie 的 GET（不带 Authorization、不读浏览器 cookie）。
 * - 只取状态码与鉴权墙正文用于身份匹配；探测的 401 不代表某浏览器未登录（S5 由用户反馈触发）。
 * - connect/fetch 可注入，便于测试与隔离，绝不连接正式端口做任何写操作。
 */

const DEFAULT_TIMEOUT_MS = 800

/**
 * @param {{port:number, host?:string, connect?:Function, fetch?:Function, timeoutMs?:number}} opts
 * @returns {Promise<{tcpOpen:boolean, httpStatus:number|undefined, authRequiredBody:string}>}
 */
export async function probeService({ port, host = '127.0.0.1', connect, fetch: fetchLike, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const tcpOpen = await (connect ? connect({ host, port, timeoutMs }) : defaultConnect({ host, port, timeoutMs }))
  if (!tcpOpen) return { tcpOpen: false, httpStatus: undefined, authRequiredBody: '' }

  const doFetch = fetchLike ?? globalThis.fetch
  try {
    const res = await doFetch(`http://${host}:${port}/`, {
      redirect: 'manual',
      // 显式不带任何凭证；不携带/不读取 cookie。
      credentials: 'omit',
      headers: { accept: 'text/plain, text/html' },
    })
    const text = await safeText(res)
    return { tcpOpen: true, httpStatus: res.status, authRequiredBody: text.slice(0, 500) }
  } catch {
    // 可连但读不到响应：按可达但身份不明交给分类（conflict）。
    return { tcpOpen: true, httpStatus: undefined, authRequiredBody: '' }
  }
}

async function defaultConnect({ host, port, timeoutMs }) {
  const net = await import('node:net')
  return new Promise((resolve) => {
    const sock = net.createConnection({ host, port, timeout: timeoutMs })
    const done = (open) => {
      sock.destroy()
      resolve(open)
    }
    sock.once('connect', () => done(true))
    sock.once('timeout', () => done(false))
    sock.once('error', () => done(false))
  })
}

async function safeText(res) {
  try {
    return await res.text()
  } catch {
    return ''
  }
}

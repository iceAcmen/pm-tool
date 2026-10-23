/**
 * 启动器「已进入」最小回告桥接（client 侧，纯逻辑 + 单次内存 nonce，零写盘、零 cookie/token）。
 *
 * 契约（launcher 执行者 s_000ElkeZ2Sb 提供）：
 * - 上游 303 会 location './' 剥 query，启动器改写 hash：`#pm-launch=<loopbackPort>.<nonce>`；
 *   nonce 在启动器侧内存单次、TTL 120s，client 不缓存、不复用。
 * - 仅当「PM 面板实际挂载」且「web snapshot 读取成功」同时满足后才回告；
 *   index apply 的全局注册不是成功，不得在那里触发。
 * - 解析 hash 校验 port+nonce；history.replaceState 清除本参数（保留原有业务 hash，不无脑清路由）；
 *   POST http://127.0.0.1:<port>/api/entered JSON {nonce}，credentials: 'omit'，200 即止；
 *   无参数不发；网络失败/非 2xx 一律 false，不假成功。
 */

export interface LaunchToken {
  /** loopback 端口（1..65535）。 */
  port: number
  /** 启动器内存单次 nonce（原样回传，client 不解释、不落盘）。 */
  nonce: string
}

// 令牌后须接 &/#/结束；拒绝 port 后夹带额外点号（如 12.5.abc）的畸形串。
const TOKEN_RE = /pm-launch=(\d{1,5})\.([A-Za-z0-9_-]+)(?=[&#]|$)/

/** 从 location.hash 解析启动令牌；格式/端口非法或无参数返回 null。 */
export function parseLaunchToken(hash: string): LaunchToken | null {
  const m = TOKEN_RE.exec(hash)
  if (!m) return null
  const port = Number(m[1])
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null
  const nonce = m[2]
  if (!nonce) return null
  return { port, nonce }
}

/**
 * 从 hash 中移除 `pm-launch=port.nonce` 参数，保留其余业务 hash 片段；
 * 无令牌时原样返回。不在此处清空整条路由。
 */
export function stripLaunchHash(hash: string): string {
  return hash
    .replace(/[#&]?pm-launch=\d{1,5}\.[A-Za-z0-9_-]+/, '')
    .replace(/^#&/, '#')
}

/**
 * 向 loopback 启动器回告已进入。仅 2xx 视为成功；
 * 网络异常/非 2xx 返回 false，不抛成功、不重试、不带 cookie/token。
 */
export async function reportEntered(
  token: LaunchToken,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const res = await fetchImpl(`http://127.0.0.1:${token.port}/api/entered`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nonce: token.nonce }),
      credentials: 'omit',
    })
    return res.ok
  } catch {
    return false
  }
}

export interface ArmDeps {
  /** 取当前 location.hash。 */
  getHash: () => string
  /** replaceState 清除本参数（保留业务 hash）。 */
  replaceState: (cleanedHash: string) => void
  fetchImpl?: typeof fetch
}

/**
 * 就绪后调用一次：解析 → 清参数 → POST。无令牌不发请求；失败返回 false（不假成功）。
 */
export async function armLaunchHandshake(deps: ArmDeps): Promise<boolean> {
  const token = parseLaunchToken(deps.getHash())
  if (!token) return false
  deps.replaceState(stripLaunchHash(deps.getHash()))
  return reportEntered(token, deps.fetchImpl)
}

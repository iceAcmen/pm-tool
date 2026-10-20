/**
 * PM 工作台本地启动器 · 核心纯逻辑与 IO 缝（路径 B）。
 *
 * 安全合同：
 *  - 不伪造/不复刻 dsh HMAC 签名，不关闭 auth，不读取/共享/注入浏览器 cookie，不代填令牌。
 *  - 服务探测 GET 无 browser cookie，其 401 属「身份匹配的鉴权墙」，不得据此判定某浏览器未登录；
 *    S5（未登录）只由用户在标签页看到登录/认证错误后主动反馈触发。
 *  - S4 authenticated 只由用户自确认「我已进入工作台」到达，启动器不做程序化已认证自判。
 *  - owned 实例 authenticatedURL（含一次性令牌）仅存内存、投递一次，不跨 profile/新浏览器重放，
 *    不落盘、不写日志、不入仓；对非本启动器拉起的现网实例不得宣称 owned。
 *  - 不 kill 占用进程、不争 3172；取消只放弃尚未完成的 owned 启动流程，不误杀已启动 PM。
 */

/** 探测结果（不含 S5；S5 由用户反馈触发）。 */
export const Probe = Object.freeze({
  NotRunning: 'not-running',
  Running: 'running',
  Conflict: 'conflict',
})

/** 七态 + closed。 */
export const Status = Object.freeze({
  S0: 'S0', // idle / 未启动
  S1: 'S1', // running / 端口可达（≠成功）
  S2: 'S2', // starting / 启动中
  S3: 'S3', // opened / 已投递待鉴权
  S4: 'S4', // authenticated / 用户确认已进入
  S5: 'S5', // auth-required / 用户反馈未登录
  S6: 'S6', // failure / 启动失败
  Closed: 'closed',
})

/** 识别 dsh 鉴权墙正文（无 cookie 的探测也能据此确认身份匹配，而非冲突）。 */
const AUTH_WALL_RE = /dsh web authentication required/i

/**
 * 分类本地服务探测。
 * @param {{tcpOpen:boolean, httpStatus:number|undefined, authRequiredBody?:string}} probe
 * @returns {keyof typeof Probe}
 */
export function classifyProbe({ tcpOpen, httpStatus, authRequiredBody = '' }) {
  if (!tcpOpen) return Probe.NotRunning
  if (httpStatus === 200) return Probe.Running
  if (httpStatus === 401 && AUTH_WALL_RE.test(authRequiredBody)) return Probe.Running
  return Probe.Conflict
}

/**
 * 探测 → 动作决策。
 * @param {keyof typeof Probe} probe
 * @param {{browser?:string}} [preferences]
 */
export function decideAction(probe, preferences = {}) {
  const browser = preferences.browser ?? '系统默认浏览器'
  switch (probe) {
    case Probe.Running:
      return {
        action: 'open-existing',
        reuse: true,
        targetKind: 'clean-url',
        browser,
        notice: '已在运行：将尽力在所选浏览器打开现有服务（复用依赖该浏览器既有登录态），不重复启动。',
        spawn: undefined,
        token: undefined,
      }
    case Probe.Conflict:
      return {
        action: 'safe-failure',
        reason: 'port-conflict',
        browser,
        retryable: true,
        token: undefined,
        spawn: undefined,
        killPid: undefined,
        contendPort: undefined,
        guidance:
          '端口被其他程序占用且身份不匹配：未启动新服务、未停止现有进程；确认占用程序后可重新尝试。',
      }
    case Probe.NotRunning:
    default:
      return { action: 'start', needStart: true, browser, spawn: true, token: undefined }
  }
}

/**
 * 解析 `dsh web: <base>/?token=<t>`；url 为含一次性令牌的完整首投 URL（仅内存），
 * baseUrl 为去令牌干净 URL，token 单独保留。均不持久化。
 * @param {string} line
 * @returns {{url:string, baseUrl:string, token:string}|null}
 */
export function parseDshWebLine(line) {
  if (typeof line !== 'string') return null
  const match = line.match(/^dsh web:\s+(\S+)\s*$/u)
  if (!match) return null
  let url
  try {
    url = new URL(match[1])
  } catch {
    return null
  }
  const token = url.searchParams.get('token')
  if (!token) return null
  const fullUrl = match[1]
  url.searchParams.delete('token')
  return { url: fullUrl, baseUrl: url.href, token }
}

/** 日志/诊断脱敏：剥离 token，绝不回显。 */
export function redactUrl(url) {
  if (typeof url !== 'string') return '[REDACTED]'
  return url.replace(/([?&]token=)[^&]*/g, '$1REDACTED')
}

/**
 * 构造浏览器打开命令参数（macOS open / open -a）。
 * @param {string} choice
 * @param {string} url
 */
export function openBrowserArgs(choice, url) {
  if (choice === '系统默认浏览器') return { argv: ['open', url], fallback: false }
  return { argv: ['open', '-a', choice, url], fallback: false }
}

/**
 * 正式 dsh 启动参数镜像（node 可执行路径由调用方解析；cwd=上游 deepseek-harness）。
 * @param {number|string} port
 */
export function dshSpawnArgs(port) {
  return [
    '--import',
    'tsx/esm',
    'apps/cli/src/bin.ts',
    '--profile',
    'pm',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--no-open',
  ]
}

/**
 * 七态状态机（纯）。转移规则见合同 §3。
 */
export function createLauncherState() {
  const s = { status: Status.S0, step: 0, browser: undefined, detail: undefined, confirmed: false }

  function snapshot() {
    return {
      status: s.status,
      step: s.step,
      browser: s.browser,
      detail: s.detail,
      confirmed: s.confirmed,
    }
  }

  function transition(event) {
    if (!event || typeof event !== 'object') return snapshot()
    switch (event.type) {
      case 'detect': {
        // 探测结果直接落 S0/S1/S6；401 身份匹配走 S1，不在这里判 S5。
        if (event.probe === Probe.Running) s.status = Status.S1
        else if (event.probe === Probe.Conflict) {
          s.status = Status.S6
          s.detail = event.detail ?? { detection: '端口可达但服务身份不匹配', outcome: '未启动新服务，未停止现有进程', suggestion: '确认占用程序后重新尝试。' }
        } else s.status = Status.S0
        break
      }
      case 'open':
        // needStart → S2；running 直接投递 → S3。
        s.status = event.needStart ? Status.S2 : Status.S3
        s.step = 0
        s.browser = event.browser ?? s.browser
        break
      case 'step':
        s.step = Number.isSafeInteger(event.index) ? event.index : s.step
        break
      case 'delivered':
        s.status = Status.S3
        s.browser = event.browser ?? s.browser
        break
      case 'confirm-entered':
        // 用户自确认才到 S4；启动器不做程序化已认证自判。
        s.status = Status.S4
        s.confirmed = true
        break
      case 'report-auth-error':
        // 用户在标签页看到登录/认证错误 → S5（非探测推断）。
        s.status = Status.S5
        s.detail = event.detail ?? { code: 401, detection: '用户反馈当前浏览器需要登录/认证', outcome: '未注入会话、未重放令牌', suggestion: '在该标签页完成登录，或换用已登录的浏览器。' }
        break
      case 'retry':
        s.status = event.needStart ? Status.S2 : Status.S3
        s.step = 0
        break
      case 'switch-browser':
        s.status = Status.S3
        s.browser = event.browser ?? s.browser
        break
      case 'cancel':
        // 仅放弃尚未完成的 owned 启动流程；不杀任何已启动进程。
        s.status = Status.S0
        s.step = 0
        break
      case 'failure':
        s.status = Status.S6
        s.detail = event.detail
        break
      case 'back':
        s.status = Status.S0
        s.step = 0
        break
      case 'close':
        s.status = Status.Closed
        break
      default:
        break
    }
    return snapshot()
  }

  return { snapshot, transition }
}

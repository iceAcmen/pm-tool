/**
 * 启动器编排层：状态机 + 探测 + 控制器 + 浏览器打开缝。
 * token 只存在于控制器内存，绝不进入 getState / HTML / 日志；不跨 profile 重放进程启动令牌。
 */
import { randomBytes } from 'node:crypto'
import {
  classifyProbe,
  decideAction,
  openBrowserArgs,
  createLauncherState,
} from './launcher-core.mjs'
import { buildPanelViewModel } from './panel-model.mjs'

/**
 * 回告 nonce 存活期：10 分钟覆盖首次鉴权/API 配置等真实人工步骤；
 * 仍为 single-use、仅内存，并受 loopback 精确 Origin 校验保护。
 */
const ENTERED_TTL_MS = 10 * 60_000

/**
 * @param {object} deps
 * @param {number} deps.port 目标服务端口（默认 3172，只读探测，不争用）
 * @param {Function} deps.probeService 探测缝
 * @param {Function} deps.openBrowser open 命令执行缝 (argv)=>void
 * @param {object} deps.controller dsh 控制器（owned）
 * @param {string[]} deps.browsers 已发现浏览器列表
 * @param {object} [dps.dsh] owned 启动配置 {cwd,nodePath,env}
 */
export function createLauncherApp({ port = 3172, host = '127.0.0.1', probeService, openBrowser, controller, browsers = [], dsh } = {}) {
  const state = createLauncherState()
  let selectedBrowser = '系统默认浏览器'
  let theme = 'light'
  let probeCache = null
  let loopbackPort = null
  /** nonce → {expiresAt, used}；仅内存，single-use，短 TTL。 */
  const pendingEntered = new Map()

  function setLoopbackPort(p) {
    loopbackPort = Number(p)
  }

  /** 生成一次性 nonce 并登记；返回 nonce 字符串。 */
  function mintEnteredNonce() {
    const nonce = randomBytes(12).toString('hex')
    pendingEntered.set(nonce, { expiresAt: Date.now() + ENTERED_TTL_MS, used: false })
    return nonce
  }

  /** 校验 nonce：不存在/过期/已用/重复一律 false；命中即标记 single-use。 */
  function verifyEntered(nonce) {
    const rec = pendingEntered.get(nonce)
    if (!rec || rec.used || rec.expiresAt < Date.now()) return false
    rec.used = true
    return true
  }

  /** 权威回告 → S4；清理该 nonce。 */
  function onEntered(nonce) {
    pendingEntered.delete(nonce)
    state.transition({ type: 'entered' })
    return getState()
  }

  /**
   * 给打开 URL 附加 hash 回告句柄 `#pm-launch=<loopbackPort>.<nonce>`。
   * 不用 query（上游 303 会剥 query）；fragment 不经服务端、不带 token/cookie。
   */
  function withEnteredHandle(url) {
    if (!loopbackPort) return url
    const nonce = mintEnteredNonce()
    const sep = url.includes('#') ? '&' : '#'
    return `${url}${sep}pm-launch=${loopbackPort}.${nonce}`
  }

  function view() {
    return buildPanelViewModel(state.snapshot(), {
      browsers: ['系统默认浏览器', ...browsers.filter((b) => b !== '系统默认浏览器')],
      selectedBrowser,
      theme,
    })
  }

  function getState() {
    const snap = state.snapshot()
    // 绝不把 token/URL 放进可序列化状态；host/port 仅用于诚实展示目标地址。
    return { ...snap, view: snap.status, host, port, browsers: view().browsers, selectedBrowser, theme }
  }

  async function detect() {
    probeCache = await probeService({ port, host })
    const probe = classifyProbe(probeCache)
    state.transition({ type: 'detect', probe })
    return probe
  }

  /** 取原始探测并分类；无缓存时先探测。 */
  async function resolveProbe() {
    if (!probeCache) probeCache = await probeService({ port, host })
    return classifyProbe(probeCache)
  }

  function targetUrl() {
    return `http://${host}:${port}/`
  }

  function launchExisting(decision) {
    // 已运行：只开干净 URL（不带 token），附 hash 回告句柄；S3 等待权威回告，不自动成功。
    const cleanUrl = withEnteredHandle(targetUrl())
    openBrowser(openBrowserArgs(selectedBrowser, cleanUrl).argv)
    state.transition({ type: 'delivered', browser: selectedBrowser })
    return decision
  }

  async function launchOwned() {
    // 未运行：owned 启动，内存捕获 token URL，投递一次后即弃。
    state.transition({ type: 'open', needStart: true, browser: selectedBrowser })
    state.transition({ type: 'step', index: 0 })
    try {
      const entry = await controller.start({ cwd: dsh?.cwd, nodePath: dsh?.nodePath, port, env: dsh?.env })
      state.transition({ type: 'step', index: 2 })
      const { argv } = openBrowserArgs(selectedBrowser, withEnteredHandle(entry.authenticatedUrl))
      openBrowser(argv)
      controller.forgetAuthenticatedUrl(entry.pid) // 投递后即弃内存 token
      state.transition({ type: 'delivered', browser: selectedBrowser })
    } catch (err) {
      if (err?.code === 'STARTUP_ABORTED') {
        // 取消已由 cancel action 把状态置回 S0；不得异步转 S6 覆盖取消。
        return
      }
      state.transition({
        type: 'failure',
        detail: {
          detection: '本地服务启动失败：' + (err?.message ?? '未知错误'),
          outcome: '没有停止任何程序，项目数据和现有服务保持不变。',
          suggestion: '确认环境后点击“重新尝试”。',
        },
      })
    }
  }

  async function handleAction(payload = {}) {
    switch (payload.type) {
      case 'select-browser':
        selectedBrowser = payload.browser ?? selectedBrowser
        break
      case 'open': {
        probeCache = null // 每次打开前重新探测真实状态，不用启动时缓存
        const probe = await resolveProbe()
        const decision = decideAction(probe, { browser: selectedBrowser })
        if (decision.action === 'open-existing') launchExisting(decision)
        else if (decision.action === 'start') await launchOwned()
        else state.transition({ type: 'failure', detail: { detection: decision.guidance, outcome: '没有停止任何程序，项目数据和现有服务保持不变。', suggestion: '确认占用程序后重新尝试。' } })
        break
      }
      case 'cancel':
        controller?.cancelStartup?.()
        state.transition({ type: 'cancel' })
        break
      case 'report-auth-error':
        state.transition({ type: 'report-auth-error', detail: { code: 401, detection: '用户反馈当前浏览器需要登录/认证', outcome: '未注入会话、未重放令牌', suggestion: '在该标签页完成登录，或换用已登录的浏览器。' } })
        break
      case 'finish-login':
        // 用户回到标签页自行登录；本器不代填、不注入。保持 S5。
        break
      case 'switch-browser':
        selectedBrowser = payload.browser ?? selectedBrowser
        state.transition({ type: 'switch-browser', browser: selectedBrowser })
        break
      case 'reopen':
        // 再次打开：只开干净 URL（附 hash 回告句柄），不重放进程启动令牌。
        openBrowser(openBrowserArgs(selectedBrowser, withEnteredHandle(targetUrl())).argv)
        state.transition({ type: 'switch-browser', browser: selectedBrowser })
        break
      case 'retry': {
        probeCache = null // 重试前重新探测真实状态
        const probe = await resolveProbe()
        const decision = decideAction(probe, { browser: selectedBrowser })
        if (decision.action === 'start') await launchOwned()
        else if (decision.action === 'open-existing') launchExisting(decision)
        else state.transition({ type: 'failure', detail: { detection: decision.guidance, outcome: '没有停止任何程序，项目数据和现有服务保持不变。', suggestion: '确认占用程序后重新尝试。' } })
        break
      }
      case 'back':
        state.transition({ type: 'back' })
        break
      case 'toggle-detail':
        break
      default:
        break
    }
    return getState()
  }

  return { detect, handleAction, getState, view, setLoopbackPort, verifyEntered, onEntered }
}

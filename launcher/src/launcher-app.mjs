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
 * @param {Function} deps.openBrowser open命令接缝 (argv)=>void | Promise<void>
 * @param {object} deps.controller dsh 控制器（owned）
 * @param {string[]} deps.browsers 已发现浏览器列表
 * @param {object} [dps.dsh] owned 启动配置 {cwd,nodePath,env}
 */
export function createLauncherApp({ port = 3172, host = '127.0.0.1', probeService, openBrowser, controller, browsers = [], dsh } = {}) {
  const state = createLauncherState()
  let selectedBrowser = '系统默认浏览器'
  let journeyBrowser = selectedBrowser
  let theme = 'light'
  let probeCache = null
  let loopbackPort = null
  let journey = 0
  /** nonce → {expiresAt, used}；仅内存，single-use，短 TTL。 */
  const pendingEntered = new Map()

  /** 每次替换/取消旅程都撤销旧句柄；迟到回告不能替当前浏览器确认成功。 */
  function invalidateEntered() {
    journey += 1
    journeyBrowser = selectedBrowser
    pendingEntered.clear()
    probeCache = null
    state.transition({ type: 'begin-journey', browser: journeyBrowser })
    controller?.cancelStartup?.()
  }

  function setLoopbackPort(p) {
    loopbackPort = Number(p)
  }

  /** 生成一次性 nonce 并登记；返回 nonce 字符串。 */
  function mintEnteredNonce() {
    const nonce = randomBytes(12).toString('hex')
    pendingEntered.clear()
    pendingEntered.set(nonce, { expiresAt: Date.now() + ENTERED_TTL_MS, used: false, journey, browser: journeyBrowser })
    return nonce
  }

  /** 校验 nonce：不存在/过期/已用/重复一律 false；命中即标记 single-use。 */
  function verifyEntered(nonce) {
    const rec = pendingEntered.get(nonce)
    if (!rec || rec.used || rec.journey !== journey || rec.browser !== journeyBrowser || rec.expiresAt < Date.now()) return false
    rec.used = true
    return true
  }

  /** 权威回告 → S4；清理该 nonce。 */
  function onEntered(nonce) {
    const rec = pendingEntered.get(nonce)
    if (!rec?.used || rec.journey !== journey || rec.browser !== journeyBrowser) return getState()
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
    const requestJourney = journey
    const result = await probeService({ port, host })
    const probe = classifyProbe(result)
    if (requestJourney === journey) {
      probeCache = result
      state.transition({ type: 'detect', probe })
    }
    return probe
  }

  /** 探测返回后先核请求代际；旧结果不得写缓存或产生动作。 */
  async function resolveProbe(requestJourney) {
    const result = await probeService({ port, host })
    if (requestJourney !== journey) return null
    probeCache = result
    return classifyProbe(result)
  }

  function targetUrl() {
    return `http://${host}:${port}/`
  }

  async function launchExisting(decision, requestJourney) {
    // 已运行：只开干净 URL（不带 token），附 hash 回告句柄；S3 等待权威回告，不自动成功。
    const cleanUrl = withEnteredHandle(targetUrl())
    const browser = journeyBrowser
    await openBrowser(openBrowserArgs(browser, cleanUrl).argv)
    if (requestJourney === journey && state.snapshot().status !== 'S4') {
      state.transition({ type: 'delivered', browser })
    }
    return decision
  }

  async function launchOwned(launchJourney) {
    if (launchJourney !== journey) return
    // 未运行：owned 启动，内存捕获 token URL，投递一次后即弃。
    const browser = journeyBrowser
    state.transition({ type: 'open', needStart: true, browser })
    state.transition({ type: 'step', index: 0 })
    try {
      const entry = await controller.start({ cwd: dsh?.cwd, nodePath: dsh?.nodePath, port, env: dsh?.env })
      // 在途启动被取消/替换后即弃认证URL；不投递旧旅程、不停止已经就绪的自有服务。
      if (launchJourney !== journey) {
        controller.forgetAuthenticatedUrl(entry.pid)
        return
      }
      state.transition({ type: 'step', index: 2 })
      const { argv } = openBrowserArgs(browser, withEnteredHandle(entry.authenticatedUrl))
      try {
        await openBrowser(argv)
      } finally {
        controller.forgetAuthenticatedUrl(entry.pid) // 首投无论成功失败均弃内存 token
      }
      if (launchJourney !== journey) return
      if (state.snapshot().status !== 'S4') state.transition({ type: 'delivered', browser })
    } catch (err) {
      if (launchJourney !== journey || err?.code === 'STARTUP_ABORTED') {
        // 取消已由 cancel action 把状态置回 S0；不得异步转 S6 覆盖取消。
        return
      }
      if (state.snapshot().status === 'S4' && state.snapshot().confirmed) return
      pendingEntered.clear()
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

  async function openCurrentJourney() {
    invalidateEntered()
    const requestJourney = journey
    try {
      const probe = await resolveProbe(requestJourney)
      if (requestJourney !== journey) return
      const decision = decideAction(probe, { browser: journeyBrowser })
      if (decision.action === 'open-existing') await launchExisting(decision, requestJourney)
      else if (decision.action === 'start') await launchOwned(requestJourney)
      else state.transition({ type: 'failure', detail: {
        detection: decision.guidance,
        outcome: '没有停止任何程序，项目数据和现有服务保持不变。',
        suggestion: '确认占用程序后重新尝试。',
      } })
    } catch (err) {
      if (requestJourney !== journey) return
      if (state.snapshot().status === 'S4' && state.snapshot().confirmed) return
      pendingEntered.clear()
      state.transition({ type: 'failure', detail: {
        detection: '本地服务探测或浏览器打开失败：' + (err?.message ?? '未知错误'),
        outcome: '没有停止任何程序，项目数据和现有服务保持不变。',
        suggestion: '确认环境后点击“重新尝试”。',
      } })
    }
  }

  async function handleAction(payload = {}) {
    switch (payload.type) {
      case 'select-browser':
        selectedBrowser = payload.browser ?? selectedBrowser
        break
      case 'open': {
        await openCurrentJourney()
        break
      }
      case 'cancel':
        invalidateEntered()
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
        invalidateEntered()
        state.transition({ type: 'switch-browser', browser: journeyBrowser })
        break
      case 'reopen':
        invalidateEntered()
        // 再次打开：只开干净 URL（附 hash 回告句柄），不重放进程启动令牌。
        {
          const requestJourney = journey
          const browser = journeyBrowser
          try {
            await openBrowser(openBrowserArgs(browser, withEnteredHandle(targetUrl())).argv)
            if (requestJourney === journey && state.snapshot().status !== 'S4') state.transition({ type: 'switch-browser', browser })
          } catch (error) {
            if (requestJourney === journey && !(state.snapshot().status === 'S4' && state.snapshot().confirmed)) {
              pendingEntered.clear()
              state.transition({ type: 'failure', detail: {
                detection: error?.message ?? '浏览器打开失败',
                outcome: '没有停止现有服务，也没有重放启动令牌。',
                suggestion: '选择可用浏览器后重试。',
              } })
            }
          }
        }
        break
      case 'retry': {
        await openCurrentJourney()
        break
      }
      case 'back':
        invalidateEntered()
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

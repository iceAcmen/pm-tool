/**
 * 启动器编排层：状态机 + 探测 + 控制器 + 浏览器打开缝。
 * token 只存在于控制器内存，绝不进入 getState / HTML / 日志；不跨 profile 重放一次性令牌。
 */
import {
  classifyProbe,
  decideAction,
  openBrowserArgs,
  createLauncherState,
} from './launcher-core.mjs'
import { buildPanelViewModel } from './panel-model.mjs'

/**
 * @param {object} deps
 * @param {number} deps.port 目标服务端口（默认 3172，只读探测，不争用）
 * @param {Function} deps.probeService 探测缝
 * @param {Function} deps.openBrowser open 命令执行缝 (argv)=>void
 * @param {object} deps.controller dsh 控制器（owned）
 * @param {string[]} deps.browsers 已发现浏览器列表
 * @param {object} [dps.dsh] owned 启动配置 {cwd,nodePath,env}
 */
export function createLauncherApp({ port = 3172, probeService, openBrowser, controller, browsers = [], dsh } = {}) {
  const state = createLauncherState()
  let selectedBrowser = '系统默认浏览器'
  let theme = 'light'
  let probeCache = null

  function view() {
    return buildPanelViewModel(state.snapshot(), {
      browsers: ['系统默认浏览器', ...browsers.filter((b) => b !== '系统默认浏览器')],
      selectedBrowser,
      theme,
    })
  }

  function getState() {
    const snap = state.snapshot()
    // 绝不把 token/URL 放进可序列化状态。
    return { ...snap, view: snap.status, browsers: view().browsers, selectedBrowser, theme }
  }

  async function detect() {
    probeCache = await probeService({ port })
    const probe = classifyProbe(probeCache)
    state.transition({ type: 'detect', probe })
    return probe
  }

  /** 取原始探测并分类；无缓存时先探测。 */
  async function resolveProbe() {
    if (!probeCache) probeCache = await probeService({ port })
    return classifyProbe(probeCache)
  }

  function launchExisting(decision) {
    // 已运行：只开干净 URL（不带 token），尽力复用，进入 S3 待确认。
    const cleanUrl = 'http://127.0.0.1:' + port + '/'
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
      const { argv } = openBrowserArgs(selectedBrowser, entry.authenticatedUrl)
      openBrowser(argv)
      controller.forgetAuthenticatedUrl(entry.pid) // 投递后即弃内存 token
      state.transition({ type: 'delivered', browser: selectedBrowser })
    } catch (err) {
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
      case 'confirm-entered':
        state.transition({ type: 'confirm-entered' })
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
        // 再次打开：只开干净 URL，不重放一次性令牌。
        openBrowser(openBrowserArgs(selectedBrowser, 'http://127.0.0.1:' + port + '/').argv)
        state.transition({ type: 'switch-browser', browser: selectedBrowser })
        break
      case 'retry': {
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

  return { detect, handleAction, getState, view }
}

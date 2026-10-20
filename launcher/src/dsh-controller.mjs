/**
 * dsh 进程控制器（仅启动器自拉起的 owned 实例；现网非 owned 实例不归本器管理）。
 *
 * 安全合同：
 *  - 只按正式参数拉起；绝不提供 kill/stop，不停止任何现有进程（含现网 3172）。
 *  - cancelStartup 只放弃「尚未完成就绪」的在途启动；一旦已就绪/已绑定，绝不杀已启动 PM。
 *  - owned authenticatedURL（含一次性令牌）仅内存：投递所选浏览器后即弃，不落盘、不写日志、不入仓；
 *    不跨 profile/新浏览器重放。
 *  - 不读取浏览器 cookie，不读取/请求任何凭证。
 */
import { spawn } from 'node:child_process'
import { dshSpawnArgs, parseDshWebLine } from './launcher-core.mjs'

/**
 * @param {object} seams spawn(exec,args,opts)、isReady(port)=>Promise<boolean>、sleep(ms)。
 */
export function createDshController(seams = {}) {
  const owned = new Map()
  const inFlight = new Set()
  let aborted = false

  /**
   * 按正式参数拉起 dsh，内存捕获 authenticatedURL，等待就绪。
   * @param {{cwd:string, nodePath:string, port:number, env?:NodeJS.ProcessEnv}} opts
   * @returns {Promise<{pid:number, authenticatedUrl:string, token:string}>}
   */
  async function start({ cwd, nodePath, port, env }) {
    aborted = false
    const spawnFn = seams.spawn ?? defaultSpawn
    const child = spawnFn(nodePath, dshSpawnArgs(port), {
      cwd,
      env: env ?? process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    })

    let captured = null
    child.stdout?.on('data', (chunk) => {
      for (const l of String(chunk).split(/\r?\n/u)) {
        const parsed = parseDshWebLine(l)
        if (parsed) captured = parsed
      }
    })
    // stderr 不在此处打印 token；token 只来自 stdout 行。

    inFlight.add(child.pid)
    await waitForReady(seams.isReady, port, seams.sleep)
    if (aborted) {
      // 在途被取消：仅放弃等待；不杀已创建子进程（交给用户/官方管理）。
      inFlight.delete(child.pid)
      throw Object.assign(new Error('启动已取消（未停止任何进程）'), { code: 'STARTUP_ABORTED' })
    }
    inFlight.delete(child.pid)
    if (!captured) {
      throw new Error('dsh: 就绪但未在启动输出中捕获到受支持的 authenticated URL')
    }
    const entry = { pid: child.pid, authenticatedUrl: captured.url, token: captured.token }
    owned.set(child.pid, entry)
    return entry
  }

  /** 仅放弃尚未完成的在途启动；已就绪实例保留，不杀。 */
  function cancelStartup() {
    aborted = true
    inFlight.clear()
  }

  /** 仅返回 owned pid（不含 URL/token），供诊断。 */
  function listOwnedPids() {
    return [...owned.keys()]
  }

  /** 投递浏览器后：丢弃内存 authenticatedURL（含 token）。 */
  function forgetAuthenticatedUrl(pid) {
    owned.delete(pid)
  }

  // 明确不提供停止/杀死能力。
  function stop() {
    throw new Error('启动器不提供停止/杀死进程能力；请通过官方终端命令管理服务。')
  }

  return { start, cancelStartup, listOwnedPids, forgetAuthenticatedUrl, stop }
}

async function waitForReady(isReady, port, sleepFn, timeoutMs = 30000, intervalMs = 250) {
  if (typeof isReady !== 'function') return
  const sleep = sleepFn ?? ((ms) => new Promise((r) => setTimeout(r, ms)))
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await isReady(port)) return
    await sleep(intervalMs)
  }
  throw new Error(`dsh: 等待 ${port} 就绪超时`)
}

function defaultSpawn(exec, args, opts) {
  return spawn(exec, args, opts)
}

/**
 * dsh 进程控制器（仅启动器自拉起的 owned 实例；现网/非 owned 实例不归本器管理）。
 *
 * 安全合同：
 *  - 只按正式参数拉起；绝不提供 kill/stop，不停止任何现有进程（含现网 3172）。
 *  - cancelStartup 仅回收「自己拉起、且尚未就绪(ready)」的在途 owned 子进程：
 *    SIGTERM + 有界等待；就绪前失败（等待超时 / 未捕获 URL）同样回收未就绪子进程；
 *    一旦已就绪/已绑定，或对象非 owned，绝不终止。
 *  - owned authenticatedURL（含每进程 launch token）仅内存：投递所选浏览器后即弃，不落盘、不写日志、不入仓；
 *    不跨 profile/新浏览器重放。
 *  - 不读取浏览器 cookie，不读取/请求任何凭证。
 */
import { spawn } from 'node:child_process'
import { dshSpawnArgs, parseDshWebLine } from './launcher-core.mjs'

/**
 * @param {object} seams
 * @param {Function} [seams.spawn] spawn(exec,args,opts)
 * @param {Function} [seams.isReady] (port)=>Promise<boolean>
 * @param {Function} [seams.sleep] (ms)=>Promise
 * @param {number} [seams.readyTimeoutMs] 就绪等待上限（默认 30000）
 * @param {number} [seams.readyIntervalMs] 就绪轮询间隔（默认 250）
 * @param {Function} [seams.terminate] (child, signal)=>void 注入终止缝（测试用）
 * @param {Function} [seams.waitExit] (child, ms)=>Promise<boolean> 注入有界等待缝（测试用）
 */
export function createDshController(seams = {}) {
  const owned = new Map()
  let flight = null // 当前在途 owned {child, pid, ready, aborted, captured}

  /** 仅当「自己拉起 && 尚未就绪」时回收；已就绪/非本器一律不动。 */
  function reclaim(f) {
    if (!f || f.ready) return
    const child = f.child
    const terminate = seams.terminate ?? defaultTerminate
    const waitExit = seams.waitExit ?? defaultWaitExit
    try {
      terminate(child, 'SIGTERM')
      waitExit(child, 1500).catch(() => {})
    } catch {
      /* 终止失败不抛出：绝不因此误杀或升级信号 */
    }
  }

  /** 取消在途启动：置 aborted；仅回收尚未就绪的 owned 子进程；幂等。 */
  function cancelStartup() {
    if (!flight) return
    const f = flight
    flight = null
    f.aborted = true
    reclaim(f)
  }

  /**
   * 按正式参数拉起 dsh，内存捕获 authenticatedURL，等待就绪。
   * @param {{cwd:string, nodePath:string, port:number, env?:NodeJS.ProcessEnv}} opts
   * @returns {Promise<{pid:number, authenticatedUrl:string, token:string}>}
   */
  async function start({ cwd, nodePath, port, env }) {
    const spawnFn = seams.spawn ?? defaultSpawn
    const child = spawnFn(nodePath, dshSpawnArgs(port), {
      cwd,
      env: env ?? process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    })

    const f = { child, pid: child.pid, ready: false, aborted: false, captured: null }
    flight = f
    child.stdout?.on('data', (chunk) => {
      for (const l of String(chunk).split(/\r?\n/u)) {
        const parsed = parseDshWebLine(l)
        if (parsed) f.captured = parsed
      }
    })
    // stderr 不在此处打印 token；token 只来自 stdout 行。

    try {
      await waitForReady({
        isReady: seams.isReady,
        port,
        sleep: seams.sleep,
        readyTimeoutMs: seams.readyTimeoutMs ?? 30000,
        readyIntervalMs: seams.readyIntervalMs ?? 250,
        isAborted: () => f.aborted,
        markReady: () => { f.ready = true },
      })
      // 就绪守卫：已就绪即便竞态收到取消，也不报错、不杀，正常返回。
      if (f.aborted && !f.ready) {
        throw abortedError()
      }
      if (!f.captured) {
        throw new Error('dsh: 就绪但未在启动输出中捕获到受支持的 authenticated URL')
      }
      const entry = { pid: f.pid, authenticatedUrl: f.captured.url, token: f.captured.token }
      owned.set(f.pid, entry)
      return entry
    } catch (err) {
      // 就绪前失败（等待超时 / 未捕获 URL）：回收自己尚未就绪的 owned 子进程，
      // 避免孤儿 dsh 占用端口；已就绪不杀；已取消由 cancelStartup 回收，不重复终止。
      if (!f.ready && !f.aborted) reclaim(f)
      throw err
    } finally {
      if (flight === f) flight = null
    }
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

function abortedError() {
  return Object.assign(new Error('启动已取消（仅回收尚未就绪的自拉起子进程，未停止任何已启动/现网进程）'), {
    code: 'STARTUP_ABORTED',
  })
}

async function waitForReady({ isReady, port, readyTimeoutMs, readyIntervalMs, isAborted, markReady }) {
  if (typeof isReady !== 'function') return
  // 节拍固定走 macrotask（setTimeout），避免注入的微任务 sleep 饥饿外部 cancel。
  const beat = (ms) => new Promise((r) => setTimeout(r, ms))
  const deadline = Date.now() + readyTimeoutMs
  while (Date.now() < deadline) {
    // 每轮先看取消：未就绪即退出等待，交由控制器回收。
    if (isAborted()) return
    if (await isReady(port)) {
      // 竞态：就绪判定与取消并发，已取消则按未就绪回收，不置 ready。
      if (isAborted()) return
      markReady()
      return
    }
    await beat(readyIntervalMs)
  }
  throw new Error(`dsh: 等待 ${port} 就绪超时`)
}

function defaultTerminate(child, signal) {
  try {
    child.kill(signal)
  } catch {
    /* 子进程可能已退出 */
  }
}

function defaultWaitExit(child, timeoutMs) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.killed) return resolve(true)
    const timer = setTimeout(() => resolve(false), timeoutMs)
    child.once('exit', () => { clearTimeout(timer); resolve(true) })
  })
}

function defaultSpawn(exec, args, opts) {
  return spawn(exec, args, opts)
}

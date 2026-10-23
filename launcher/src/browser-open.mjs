import { spawn } from 'node:child_process'

/** 只等待LaunchServices命令；不读输出、不等浏览器退出、不重投认证URL。 */
export function openBrowser(argv, seams = {}) {
  return new Promise((resolve, reject) => {
    let settled = false
    let child
    const finish = error => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      child?.removeListener('error', onError)
      child?.removeListener('exit', onExit)
      child?.once('error', () => {}) // 超时后迟到spawn error仍被吸收，不重抛潜在敏感内容。
      error ? reject(error) : resolve()
    }
    const onError = () => finish(new Error('浏览器打开命令无法执行，请检查所选浏览器是否可用。'))
    const onExit = code => finish(code === 0 ? null : new Error('浏览器打开命令未成功，请选择可用浏览器后重试。'))
    const timer = setTimeout(() => {
      // 不对浏览器或dsh发信号；只终止本次等待，迟到结果不得升级成功。
      child?.unref?.()
      finish(new Error('浏览器打开命令等待超时，请检查浏览器后重试。'))
    }, seams.timeoutMs ?? 5000)
    try {
      child = (seams.spawn ?? spawn)(argv[0], argv.slice(1), { stdio: 'ignore', detached: false })
      child.once('error', onError)
      child.once('exit', onExit)
    } catch {
      onError()
    }
  })
}

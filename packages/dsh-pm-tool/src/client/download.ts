/**
 * 前端共享下载：字符串 → Blob → URL.createObjectURL → a.click 触发浏览器下载。
 * 离线优先、不写服务器文件；try/catch 兜底在受限环境提示用户。
 */
export function downloadText(filename: string, text: string, mime: string): void {
  try {
    const blob = new Blob([text], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    // 触发下载后释放对象 URL（延迟到 click 完成后再 revoke）。
    setTimeout(() => URL.revokeObjectURL(url), 0)
  } catch {
    try {
      window.alert(`当前环境无法直接下载，请改用命令行导出。内容已生成：\n${text.slice(0, 200)}`)
    } catch {
      /* 连 alert 都不可用时静默放弃，不阻断页面 */
    }
  }
}

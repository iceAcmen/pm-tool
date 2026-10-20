/**
 * D-05 Minor 返修：句柄复制的纯逻辑。
 * 仅在 writeText resolve 后返回 true（允许报「已复制」）；reject / clipboard 缺失返回 false，
 * 不抛错、不假成功；不触碰 DOM、不写库。
 */
export async function copyHandleToClipboard(value: string): Promise<boolean> {
  const write = (navigator as Navigator & { clipboard?: { writeText: (s: string) => Promise<void> } })
    ?.clipboard?.writeText
  if (typeof write !== 'function') return false
  try {
    await write.call(navigator.clipboard, value)
    return true
  } catch {
    return false
  }
}

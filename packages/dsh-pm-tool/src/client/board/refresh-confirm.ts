/**
 * 看板落盘后的快照刷新确认（纯函数）。
 * 契约：refreshBoard 必须透传返回的 Promise/boolean；返回 false = 刷新失败；
 * 缺失即失败，调用方不得给成功态。禁止用 `() => { void refreshBoard() }` 包裹吞掉返回。
 */
export async function refreshAndConfirm(
  refreshBoard?: (() => Promise<boolean> | boolean | void) | null,
): Promise<void> {
  // 缺失 / undefined / null / 非函数 一律抛错：不得放行，不给成功态。
  if (typeof refreshBoard !== 'function') throw new Error('缺少看板快照刷新通道')
  const result = await refreshBoard()
  if (result === false) throw new Error('看板快照刷新失败')
}

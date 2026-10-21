export type ClipboardWriter = ((value: string) => Promise<void>) | null | undefined

/** 只有 writeText 真正 resolve 才返回成功；权限拒绝或 API 不可用均不假成功。 */
export async function copyResultText(value: string, writeText?: ClipboardWriter): Promise<boolean> {
  const writer = writeText === undefined
    ? (typeof navigator !== 'undefined' ? navigator.clipboard?.writeText?.bind(navigator.clipboard) : null)
    : writeText
  if (!writer) return false
  try {
    await writer(value)
    return true
  } catch {
    return false
  }
}

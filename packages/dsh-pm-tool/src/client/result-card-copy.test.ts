import { describe, expect, it, vi } from 'vitest'
import { copyResultText } from './result-card-copy.js'

describe('copyResultText：结果卡复制原文可核验且不假成功', () => {
  it('writeText resolve → 写入完整原文并返回 true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    await expect(copyResultText('恢复失败：原始原因', writeText)).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('恢复失败：原始原因')
  })

  it('writeText reject → 返回 false，不抛出', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Denied'))
    await expect(copyResultText('原文', writeText)).resolves.toBe(false)
  })

  it('clipboard 不可用 → 返回 false，不假成功', async () => {
    await expect(copyResultText('原文', null)).resolves.toBe(false)
  })
})

/**
 * D-05 Minor 返修：copyHandle 不得在 writeText reject/不可用时仍报「已复制」（禁止假成功）。
 * 真实 failedPromise：stub resolve / reject / clipboard 缺失三态。
 */
import { describe, expect, it, vi, afterEach } from 'vitest'
import { copyHandleToClipboard } from './tasks-clipboard.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('copyHandleToClipboard 真实成功/失败三态', () => {
  it('writeText resolve → 返回 true（允许报已复制）', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await expect(copyHandleToClipboard('T-1')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('T-1')
  })

  it('writeText reject（权限/非安全上下文）→ 返回 false，不抛、不假成功', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await expect(copyHandleToClipboard('T-1')).resolves.toBe(false)
    expect(writeText).toHaveBeenCalledWith('T-1')
  })

  it('navigator.clipboard 缺失 → 返回 false，不抛', async () => {
    vi.stubGlobal('navigator', {})
    await expect(copyHandleToClipboard('T-1')).resolves.toBe(false)
  })
})

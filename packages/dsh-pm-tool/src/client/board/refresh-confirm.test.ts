import { describe, it, expect } from 'vitest'
import { refreshAndConfirm } from './refresh-confirm.js'

// 落盘后快照刷新闸门：true 放行；false/缺失抛错。

describe('refreshAndConfirm', () => {
  it('refreshBoard 解析 true → 放行', async () => {
    await expect(refreshAndConfirm(async () => true)).resolves.toBeUndefined()
    await expect(refreshAndConfirm(() => true)).resolves.toBeUndefined()
  })

  it('refreshBoard 返回 false → 抛错（刷新失败，不得给成功态）', async () => {
    await expect(refreshAndConfirm(() => false)).rejects.toThrow('刷新失败')
    await expect(refreshAndConfirm(async () => false)).rejects.toThrow('刷新失败')
  })

  it('refreshBoard 缺失（无参）→ 抛错（真实 GlobalBoard 必须接入）', async () => {
    await expect(refreshAndConfirm()).rejects.toThrow('刷新通道')
  })

  it('refreshBoard 显式传 undefined → 抛错，不得放行/不给成功态', async () => {
    await expect(refreshAndConfirm(undefined)).rejects.toThrow('刷新通道')
  })

  it('refreshBoard 为非函数（null/数字）→ 抛错，防御非函数注入', async () => {
    await expect(refreshAndConfirm(null as unknown as undefined)).rejects.toThrow('刷新通道')
    await expect(refreshAndConfirm(42 as unknown as undefined)).rejects.toThrow('刷新通道')
  })

  it('回归：void 包裹会吞掉 boolean/Promise，接缝不得这样写', async () => {
    // 真实 refresh() 返回 false；错误接缝 `() => { void refresh() }` 立即返回 undefined，
    // 既不传播失败也不等待刷新 —— 这正是本闸门要挡住的假成功。
    const real = () => false
    const badWrapper = () => {
      void real()
    }
    expect(badWrapper()).toBeUndefined()
    // 正确接缝必须直接透传返回值，闸门才能判 false。
    const goodSeam = () => real()
    await expect(refreshAndConfirm(goodSeam)).rejects.toThrow('刷新失败')
  })
})

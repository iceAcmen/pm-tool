import { describe, it, expect, vi } from 'vitest'
import {
  parseLaunchToken,
  stripLaunchHash,
  buildLaunchHistoryUrl,
  reportEntered,
  armLaunchHandshake,
  createLaunchHandshakeRetrier,
} from './launch-handshake.js'

// 启动器就绪回告桥接：纯逻辑单测；网络用注入 fetch 替身，不打真实 loopback。

describe('parseLaunchToken：hash 令牌解析与校验', () => {
  it('合法 port.nonce 解析成功', () => {
    expect(parseLaunchToken('#pm-launch=18345.ab9_-Z')).toEqual({ port: 18345, nonce: 'ab9_-Z' })
  })

  it('无参数 → null（不发请求）', () => {
    expect(parseLaunchToken('#/projects')).toBeNull()
    expect(parseLaunchToken('')).toBeNull()
  })

  it('端口越界/非整数 → null', () => {
    expect(parseLaunchToken('#pm-launch=0.abc')).toBeNull()
    expect(parseLaunchToken('#pm-launch=70000.abc')).toBeNull()
    expect(parseLaunchToken('#pm-launch=12.5.abc')).toBeNull()
  })

  it('缺 nonce → null', () => {
    expect(parseLaunchToken('#pm-launch=18345.')).toBeNull()
  })
})

describe('stripLaunchHash：清参数但保留业务 hash', () => {
  it('独立令牌 hash 清成空', () => {
    expect(stripLaunchHash('#pm-launch=18345.abc')).toBe('')
  })

  it('业务路由在前、令牌在后（& 拼接）→ 保留路由', () => {
    expect(stripLaunchHash('#/projects?x=1&pm-launch=18345.abc')).toBe('#/projects?x=1')
  })

  it('业务路由在前、# 拼接令牌 → 保留路由', () => {
    expect(stripLaunchHash('#/projects#pm-launch=18345.abc')).toBe('#/projects')
  })

  it('无令牌原样返回', () => {
    expect(stripLaunchHash('#/projects')).toBe('#/projects')
  })
})

describe('buildLaunchHistoryUrl：空 hash 也真正改写当前 URL', () => {
  it('独立令牌被清除后回到当前 pathname/search，不把空串当“不改 URL”', () => {
    expect(buildLaunchHistoryUrl('/workbench', '?view=pm', '')).toBe('/workbench?view=pm')
    expect(buildLaunchHistoryUrl('/', '', '')).toBe('/')
  })

  it('保留清理后的业务 hash', () => {
    expect(buildLaunchHistoryUrl('/', '', '#/projects')).toBe('/#/projects')
  })
})

describe('reportEntered：仅 2xx 成功，失败不假成功', () => {
  it('200 → true；credentials omit、body 仅 nonce', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }) as Response)
    const ok = await reportEntered({ port: 18345, nonce: 'abc' }, fetchImpl)
    expect(ok).toBe(true)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('http://127.0.0.1:18345/api/entered')
    expect(init.credentials).toBe('omit')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ nonce: 'abc' })
  })

  it('非 2xx（403/500）→ false', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 403 }) as Response)
    expect(await reportEntered({ port: 1, nonce: 'n' }, fetchImpl)).toBe(false)
  })

  it('网络异常 reject → false，不抛出', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('network down') })
    expect(await reportEntered({ port: 1, nonce: 'n' }, fetchImpl)).toBe(false)
  })
})

describe('armLaunchHandshake：解析→清参数→POST，无令牌不发', () => {
  it('有令牌：replaceState 清参数并 POST 一次', async () => {
    const replaceState = vi.fn()
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }) as Response)
    const ok = await armLaunchHandshake({
      getHash: () => '#/projects?x=1&pm-launch=18345.abc',
      replaceState,
      fetchImpl,
    })
    expect(ok).toBe(true)
    expect(replaceState).toHaveBeenCalledWith('#/projects?x=1')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('无令牌：不 replaceState、不发请求', async () => {
    const replaceState = vi.fn()
    const fetchImpl = vi.fn()
    const ok = await armLaunchHandshake({ getHash: () => '#/projects', replaceState, fetchImpl })
    expect(ok).toBe(false)
    expect(replaceState).not.toHaveBeenCalled()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('POST 失败 → false，不假成功且保留 hash 供后续成功刷新重试', async () => {
    const replaceState = vi.fn()
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500 }) as Response)
    const ok = await armLaunchHandshake({
      getHash: () => '#pm-launch=18345.abc',
      replaceState,
      fetchImpl,
    })
    expect(ok).toBe(false)
    expect(replaceState).not.toHaveBeenCalled()
  })
})

describe('createLaunchHandshakeRetrier：首次就绪失败不永久错过 S4', () => {
  it('第一次 POST 失败、下一次工作台刷新成功 → 重试并仅在成功后清 hash', async () => {
    let hash = '#pm-launch=18345.abc'
    const replaceState = vi.fn((cleaned: string) => { hash = cleaned })
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response)
    const retrier = createLaunchHandshakeRetrier({
      getHash: () => hash,
      replaceState,
      fetchImpl,
    })

    await expect(retrier.reportReady()).resolves.toBe(false)
    expect(hash).toBe('#pm-launch=18345.abc')
    await expect(retrier.reportReady()).resolves.toBe(true)
    expect(hash).toBe('')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(replaceState).toHaveBeenCalledTimes(1)
  })

  it('成功后重复刷新不重复 POST', async () => {
    let hash = '#pm-launch=18345.abc'
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }) as Response)
    const retrier = createLaunchHandshakeRetrier({
      getHash: () => hash,
      replaceState: (cleaned) => { hash = cleaned },
      fetchImpl,
    })

    await expect(retrier.reportReady()).resolves.toBe(true)
    await expect(retrier.reportReady()).resolves.toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})

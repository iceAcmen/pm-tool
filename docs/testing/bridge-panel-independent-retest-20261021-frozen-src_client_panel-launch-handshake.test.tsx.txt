import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PmPanel, type Snapshot } from './panel.js'

// 真实PmPanel/refresh接线；只替代浏览器环境和宿主传输，不mock握手或面板。
const snapshot: Snapshot = {
  projects: [], tasks: [], milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [],
}
let mounted: ReactTestRenderer | undefined
let events: EventTarget
let location: { hash: string; pathname: string; search: string }
let fetchImpl: ReturnType<typeof vi.fn>
let replaceState: ReturnType<typeof vi.fn>
const pending = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((ok, bad) => { resolve = ok; reject = bad })
  return { promise, resolve, reject }
}

beforeEach(() => {
  events = new EventTarget()
  location = { hash: '#pm-launch=18345.N1', pathname: '/', search: '' }
  fetchImpl = vi.fn().mockResolvedValue({ ok: true } as Response)
  replaceState = vi.fn((_state, _title, url: string) => {
    location.hash = url.includes('#') ? url.slice(url.indexOf('#')) : ''
  })
  vi.stubGlobal('window', {
    location, history: { replaceState },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    matchMedia: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  })
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() })
  vi.stubGlobal('document', { activeElement: null })
  vi.stubGlobal('fetch', fetchImpl)
})

afterEach(() => {
  if (mounted) act(() => mounted!.unmount())
  mounted = undefined
  vi.unstubAllGlobals()
})

async function mount(execute = vi.fn().mockResolvedValue(JSON.stringify(snapshot))) {
  await act(async () => { mounted = create(createElement(PmPanel, { execute })) })
  return execute
}
async function changeHash(hash: string) {
  await act(async () => {
    location.hash = hash
    events.dispatchEvent(new Event('hashchange'))
  })
}
function sent() {
  return fetchImpl.mock.calls.map(([, init]) => JSON.parse(String(init.body)).nonce)
}

describe('真实PmPanel就绪与hashchange回告门', () => {
  it('成功snapshot后同一挂载收到N2，直接回告新旅程；业务hash不发', async () => {
    const execute = await mount()
    expect(sent()).toEqual(['N1'])
    await changeHash('#/tasks&pm-launch=18345.N2')
    expect(sent()).toEqual(['N1', 'N2'])
    expect(location.hash).toBe('#/tasks')
    await changeHash('#/tasks')
    expect(sent()).toEqual(['N1', 'N2'])
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('未成功snapshot不回告，失败后真实重试成功才处理当前N2', async () => {
    const request = pending<string>()
    const execute = vi.fn().mockReturnValueOnce(request.promise).mockResolvedValue(JSON.stringify(snapshot))
    await mount(execute)
    await changeHash('#pm-launch=18345.N2')
    expect(sent()).toEqual([])
    await act(async () => { request.reject(new Error('snapshot failed')) })
    expect(sent()).toEqual([])
    const retry = mounted!.root.findAllByType('button').find(node => node.children.includes('重试'))!
    await act(async () => { retry.props.onClick() })
    expect(sent()).toEqual(['N2'])
  })

  it('成功读取后若刷新失败，新hash仍保留到后续成功重读', async () => {
    const execute = vi.fn().mockResolvedValueOnce(JSON.stringify(snapshot))
      .mockRejectedValueOnce(new Error('snapshot failed')).mockResolvedValue(JSON.stringify(snapshot))
    await mount(execute)
    const refresh = mounted!.root.findAllByType('button').find(node => node.props.title === '刷新数据')!
    await act(async () => { refresh.props.onClick() })
    await changeHash('#pm-launch=18345.N2')
    expect(sent()).toEqual(['N1'])
    const retry = mounted!.root.findAllByType('button').find(node => node.children.includes('重试'))!
    await act(async () => { retry.props.onClick() })
    expect(sent()).toEqual(['N1', 'N2'])
  })

  it('旧N1在途换N2不吞新请求，旧成功不清新hash，重复事件合并', async () => {
    const n1 = pending<Response>()
    const n2 = pending<Response>()
    fetchImpl.mockReset().mockReturnValueOnce(n1.promise).mockReturnValueOnce(n2.promise)
    await mount()
    await changeHash('#/tasks&pm-launch=18345.N2')
    await changeHash('#/tasks&pm-launch=18345.N2')
    expect(sent()).toEqual(['N1', 'N2'])
    await act(async () => { n1.resolve({ ok: true } as Response) })
    expect(location.hash).toContain('N2')
    await act(async () => { n2.resolve({ ok: true } as Response) })
    expect(location.hash).toBe('#/tasks')
  })

  it('卸载移除监听；卸载后迟到snapshot也不回告，重新真实挂载可处理N2', async () => {
    const request = pending<string>()
    await mount(vi.fn().mockReturnValue(request.promise))
    act(() => mounted!.unmount())
    mounted = undefined
    await changeHash('#pm-launch=18345.N2')
    await act(async () => { request.resolve(JSON.stringify(snapshot)) })
    expect(sent()).toEqual([])
    await mount()
    expect(sent()).toEqual(['N2'])
    act(() => mounted!.unmount())
    mounted = undefined
    await changeHash('#pm-launch=18345.N3')
    expect(sent()).toEqual(['N2'])
  })
})

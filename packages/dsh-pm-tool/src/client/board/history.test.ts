import { describe, it, expect } from 'vitest'
import {
  HISTORY_LIMIT,
  historyKey,
  pushHistoryEntry,
  readHistory,
  recordSnapshot,
  snapshotForPreview,
} from './history.js'
import { parseLayout } from './persist.js'
import type { DashboardLayout, WidgetInstance, WidgetScope } from './types.js'
const parse = parseLayout

const w = (i: string, x: number, y: number, w: number, h: number, type = 'recordList'): WidgetInstance => ({
  i, type, config: {}, layout: { i, x, y, w, h, minW: 2, minH: 2 },
})
const layout = (widgets: WidgetInstance[], scope: WidgetScope = 'user'): DashboardLayout => ({
  version: 1, scope, widgets,
})

/** 内存 Storage 桩，模拟 localStorage 跨「reload」（同一实例持久，换实例即清空）。 */
class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() { return this.map.size }
  key(i: number) { return [...this.map.keys()][i] ?? null }
  getItem(k: string) { return this.map.has(k) ? (this.map.get(k) as string) : null }
  setItem(k: string, v: string) { this.map.set(k, String(v)) }
  removeItem(k: string) { this.map.delete(k) }
  clear() { this.map.clear() }
}

describe('pushHistoryEntry（纯函数，非破坏）', () => {
  it('新快照前置且裁剪到 limit，不修改入参数组', () => {
    const prev = [{ ts: 2, layout: layout([w('a', 0, 0, 4, 3)]) }]
    const next = pushHistoryEntry(prev, { ts: 1, layout: layout([w('b', 0, 0, 4, 3)]) }, 5)
    expect(next.map(e => e.ts)).toEqual([1, 2])
    expect(prev.length).toBe(1) // 原数组未被改写
  })
})

describe('recordSnapshot（bounded ≤5 / 去重 / 跨 reload 序列化）', () => {
  it('连续记录 6 版只保留最新 5 版，新在前', () => {
    const storage = new MemoryStorage()
    for (let n = 1; n <= 6; n++) {
      recordSnapshot(storage, 'user', layout([w(`c${n}`, 0, n, 4, 3)]), n * 1000, undefined, parse)
    }
    const hist = readHistory(storage, 'user', parse)
    expect(hist.length).toBe(HISTORY_LIMIT)
    expect(hist[0].ts).toBe(6000)
    expect(hist[4].ts).toBe(2000)
    expect(hist.map(e => e.layout.widgets[0].type)).not.toContain('c1') // 最旧被裁剪
  })

  it('同签名连续保存不重复入列（去重）', () => {
    const storage = new MemoryStorage()
    const l = layout([w('a', 0, 0, 4, 3)])
    recordSnapshot(storage, 'user', l, 1000, undefined, parse)
    recordSnapshot(storage, 'user', l, 2000, undefined, parse)
    expect(readHistory(storage, 'user', parse).length).toBe(1)
  })

  it('写入后重新读取可还原（序列化/恢复跨 reload 存活）', () => {
    const storage = new MemoryStorage()
    recordSnapshot(storage, 'user', layout([w('a', 0, 0, 4, 3), w('b', 4, 0, 4, 3, 'completionHero')]), 1700000000000, undefined, parse)
    // 模拟 reload：从持久层重新读回（同一持久存储，新的读取调用）。
    const hist = readHistory(storage, 'user', parse)
    expect(hist.length).toBe(1)
    expect(hist[0].ts).toBe(1700000000000)
    expect(hist[0].layout.widgets.map(x => x.layout.i)).toEqual(['a', 'b'])
    expect(hist[0].layout.scope).toBe('user')
  })

  it('作用域隔离：user 历史不串到 project/global', () => {
    const storage = new MemoryStorage()
    recordSnapshot(storage, 'user', layout([w('a', 0, 0, 4, 3)], 'user'), 1000, undefined, parse)
    expect(readHistory(storage, 'project', parse).length).toBe(0)
    expect(readHistory(storage, 'global', parse).length).toBe(0)
    expect(historyKey('user')).not.toBe(historyKey('project'))
  })
})

describe('readHistory（防御收窄，损坏不抛、不清空）', () => {
  it('非数组 / 非法 JSON / 坏条目全部丢弃返回 [] 或合法子集', () => {
    const storage = new MemoryStorage()
    storage.setItem(historyKey('user'), 'not-json{')
    expect(readHistory(storage, 'user', parse)).toEqual([])
    storage.setItem(historyKey('user'), '{"x":1}')
    expect(readHistory(storage, 'user', parse)).toEqual([])
    storage.setItem(historyKey('user'), JSON.stringify([
      { ts: 1, layout: { version: 1, scope: 'user', widgets: [{ type: 'x', layout: { i: 'a' } }] } },
      { ts: 2, layout: layout([w('ok', 0, 0, 4, 3)]) },
      'garbage',
    ]))
    const hist = readHistory(storage, 'user', parse)
    expect(hist.length).toBe(1)
    expect(hist[0].layout.widgets[0].layout.i).toBe('ok')
  })
})

describe('snapshotForPreview（显式预览，独立克隆，不自动落盘）', () => {
  it('返回深拷贝：改预览结果不影响原快照', () => {
    const storage = new MemoryStorage()
    recordSnapshot(storage, 'user', layout([w('a', 0, 0, 4, 3)]), 1000, undefined, parse)
    const entry = readHistory(storage, 'user', parse)[0]
    const preview = snapshotForPreview(entry)
    preview.widgets[0].layout.x = 9
    expect(entry.layout.widgets[0].layout.x).toBe(0)
  })
})

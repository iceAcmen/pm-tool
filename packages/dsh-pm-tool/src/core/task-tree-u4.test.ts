import { describe, expect, it } from 'vitest'
import { flattenVisible } from './task-tree.js'

type Item = {
  id: string
  parentId: string | null
  code: string
  priority: number
}

const items: Item[] = [
  { id: 'root-1', parentId: null, code: '1', priority: 1 },
  { id: 'child-1', parentId: 'root-1', code: '1.1', priority: 2 },
  { id: 'child-2', parentId: 'root-1', code: '1.2', priority: 0 },
  { id: 'root-2', parentId: null, code: '2', priority: 0 },
]

describe('U4 任务树同层排序', () => {
  it('只重排根与同父兄弟，保父子前序与折叠', () => {
    const compare = (a: Item, b: Item) => a.priority - b.priority
    expect(flattenVisible(items, new Set(), compare).map(row => row.task.id)).toEqual([
      'root-2', 'root-1', 'child-2', 'child-1',
    ])
    expect(flattenVisible(items, new Set(['root-1']), compare).map(row => row.task.id)).toEqual([
      'root-2', 'root-1',
    ])
  })

  it('规则并列回落 numeric WBS code，旧无 comparator 行为不变', () => {
    const tied = () => 0
    const expected = ['root-1', 'child-1', 'child-2', 'root-2']
    expect(flattenVisible([...items].reverse(), new Set(), tied).map(row => row.task.id)).toEqual(expected)
    expect(flattenVisible([...items].reverse()).map(row => row.task.id)).toEqual(expected)
  })
})

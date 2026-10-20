/**
 * D-08/D-11 任务抽屉侧只读投影（C-10，零 schema、不回写）。
 * 纯函数离线单测：里程碑名称+ID、交付物名称+版本；无关联诚实返回空，不伪造。
 */
import { describe, it, expect } from 'vitest'
import {
  resolveLinkedMilestone,
  resolveLinkedDeliverables,
} from './task-relation-projection.js'

const milestones = [
  { id: 'm-0001', title: 'MVP 封板' },
  { id: 'm-0002', title: '123' },
]

describe('D-08 关联里程碑只读投影', () => {
  it('命中：返回名称 + 短 ID，供抽屉只读展示与直达', () => {
    const p = resolveLinkedMilestone('m-0002', milestones)
    expect(p).toEqual({ id: 'm-0002', title: '123' })
  })

  it('无关联（null/空串）→ null（诚实空态，不伪造）', () => {
    expect(resolveLinkedMilestone(null, milestones)).toBeNull()
    expect(resolveLinkedMilestone('', milestones)).toBeNull()
  })

  it('关联 ID 在里程碑清单缺失 → null（不编造标题）', () => {
    expect(resolveLinkedMilestone('m-9999', milestones)).toBeNull()
  })
})

describe('D-11 关联交付物只读投影（名称 + 冻结版本）', () => {
  const options = [
    { id: 'dv-0001', name: '交付物一', version: 'v1.0' },
    { id: 'dv-0002', name: '说明书', version: 'v2.0' },
  ]

  it('附件带冻结快照名/版本 → 直接采用，不回查台账', () => {
    const task = {
      attachments: [
        { kind: 'deliverable', deliverableId: 'dv-0001', frozenName: '交付物一', frozenVersion: 'v1.0' },
      ],
    }
    expect(resolveLinkedDeliverables(task, options)).toEqual([
      { deliverableId: 'dv-0001', name: '交付物一', version: 'v1.0' },
    ])
  })

  it('无冻结快照 → 回查交付物选项补名称/版本', () => {
    const task = { attachments: [{ kind: 'deliverable', deliverableId: 'dv-0002' }] }
    expect(resolveLinkedDeliverables(task, options)).toEqual([
      { deliverableId: 'dv-0002', name: '说明书', version: 'v2.0' },
    ])
  })

  it('仅链接/文件附件、无交付物 → 空数组（诚实空态）', () => {
    const task = {
      attachments: [
        { kind: 'link', url: 'https://example.com', title: '规范' },
        { kind: 'file', fileId: 'fa-1', fileName: 'a.pdf' },
      ],
    }
    expect(resolveLinkedDeliverables(task, options)).toEqual([])
  })

  it('无 attachments → 空数组，不抛错', () => {
    expect(resolveLinkedDeliverables({}, options)).toEqual([])
  })
})

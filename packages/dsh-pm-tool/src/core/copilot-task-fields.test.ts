import { describe, it, expect } from 'vitest'
import { validateActions, type ActionSnapshot, type CopilotAction } from './copilot.js'

// P0 K2：task.update 受限直写窄集新增四字段（description/evidenceUrl/repoUrl/branch）前置闸。
// 纯函数、零 I/O；既有 status/progress/dueDate/startDate/assignee 口径不动，其余字段仍拒。
const snapshot: ActionSnapshot = { taskIds: ['t-1'] }

const update = (patch: Record<string, unknown>): CopilotAction => ({ op: 'task.update', id: 't-1', patch })

describe('P0 K2 task.update 新增直写字段', () => {
  it('description 合法文本被接受，非字符串/超长(>2000)拒绝', () => {
    const long = '字'.repeat(2001)
    const { accepted, rejected } = validateActions([
      update({ description: '客观备注：已完成接口联调' }),
      update({ description: 123 }),
      update({ description: long }),
    ], snapshot)
    expect(accepted).toHaveLength(1)
    expect(accepted[0]!.patch).toEqual({ description: '客观备注：已完成接口联调' })
    expect(rejected).toHaveLength(2)
    expect(rejected[0]!.reason).toContain('description：须为字符串')
    expect(rejected[1]!.reason).toContain('description：长度不得超过 2000 字')
  })

  it('evidenceUrl：http(s) 链接与相对路径接受，裸词/非字符串/超长(>2048)拒绝', () => {
    const long = 'a'.repeat(2049)
    const { accepted, rejected } = validateActions([
      update({ evidenceUrl: 'https://example.com/report.pdf' }),
      update({ evidenceUrl: 'http://example.com/a?b=1' }),
      update({ evidenceUrl: './docs/验收材料.md' }),
      update({ evidenceUrl: 'docs/evidence/截图.png' }),
      update({ evidenceUrl: '/abs/path/log.txt' }),
      update({ evidenceUrl: 'abc' }),
      update({ evidenceUrl: 42 }),
      update({ evidenceUrl: long }),
    ], snapshot)
    expect(accepted).toHaveLength(5)
    expect(rejected).toHaveLength(3)
    expect(rejected.map(r => r.reason)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('evidenceUrl：须为 http(s):// 链接或相对路径'),
        expect.stringContaining('evidenceUrl：须为字符串'),
        expect.stringContaining('evidenceUrl：长度不得超过 2048 字符'),
      ]),
    )
  })

  it('repoUrl 同 evidenceUrl 形状闸：合法接受，"abc" 拒绝', () => {
    const { accepted, rejected } = validateActions([
      update({ repoUrl: 'https://git.example.com/org/repo' }),
      update({ repoUrl: 'src/utils' }),
      update({ repoUrl: 'abc' }),
    ], snapshot)
    expect(accepted).toHaveLength(2)
    expect(rejected).toHaveLength(1)
    expect(rejected[0]!.reason).toContain('repoUrl：须为 http(s):// 链接或相对路径')
  })

  it('branch：字符串接受，非字符串/超长(>128)拒绝', () => {
    const { accepted, rejected } = validateActions([
      update({ branch: 'main' }),
      update({ branch: 'feature/p0-a' }),
      update({ branch: 'x'.repeat(129) }),
      update({ branch: 7 }),
    ], snapshot)
    expect(accepted).toHaveLength(2)
    expect(rejected).toHaveLength(2)
    expect(rejected.map(r => r.reason)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('branch：长度不得超过 128 字符'),
        expect.stringContaining('branch：须为字符串'),
      ]),
    )
  })

  it('新字段可与既有白名单字段同 patch 合并通过', () => {
    const { accepted, rejected } = validateActions([
      update({ status: 'in_progress', progress: 40, assignee: '张三', description: '联调中', evidenceUrl: './a.md' }),
    ], snapshot)
    expect(accepted).toHaveLength(1)
    expect(rejected).toHaveLength(0)
  })

  it('title/priority/effortHours/manualProgress/checklist 等仍以未知字段拒绝', () => {
    const { accepted, rejected } = validateActions([
      update({ title: '改名' }),
      update({ priority: 'P0' }),
      update({ effortHours: 3 }),
      update({ manualProgress: 50 }),
      update({ checklist: [{ id: 'c1', text: 'x', done: false }] }),
    ], snapshot)
    expect(accepted).toHaveLength(0)
    expect(rejected).toHaveLength(5)
    expect(rejected.every(r => r.reason.startsWith('未知字段'))).toBe(true)
  })
})

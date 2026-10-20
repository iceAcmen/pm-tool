import { describe, it, expect } from 'vitest'
import {
  stageUploadGate,
  downloadGate,
  reconcileStagedCleanup,
} from './staged-lifecycle.js'

describe('A20 stageUploadGate 双 flag 门控', () => {
  it('assetUpload && stageCancel 同时为真才开放', () => {
    expect(stageUploadGate({ assetUpload: true, stageCancel: true })).toBe(true)
  })

  it('缺任一 flag 关闭：仅 assetUpload / 仅 stageCancel / 都缺 / undefined', () => {
    expect(stageUploadGate({ assetUpload: true, stageCancel: false })).toBe(false)
    expect(stageUploadGate({ assetUpload: false, stageCancel: true })).toBe(false)
    expect(stageUploadGate({ assetUpload: false, stageCancel: false })).toBe(false)
    expect(stageUploadGate(undefined)).toBe(false)
    expect(stageUploadGate({})).toBe(false)
  })
})

describe('B3 downloadGate 单 flag', () => {
  it('assetDownload 真才给下载链接，假/缺关闭', () => {
    expect(downloadGate(true)).toBe(true)
    expect(downloadGate(false)).toBe(false)
    expect(downloadGate(undefined)).toBe(false)
  })
})

describe('A21 reconcileStagedCleanup 关闭回收决策', () => {
  const stages = [
    { stageId: 'a'.repeat(32), clientId: 'c-1' },
    { stageId: 'b'.repeat(32), clientId: 'c-2' },
  ]

  it('已提交（submitted=true）后端已消费，不再 DELETE → cancel 为空', () => {
    expect(reconcileStagedCleanup(stages, true)).toEqual({ cancel: [] })
  })

  it('未提交（submitted=false）未消费暂存全部进入 cancel（best-effort，TTL 兜底）', () => {
    const plan = reconcileStagedCleanup(stages, false)
    expect(plan.cancel).toEqual([stages[0].stageId, stages[1].stageId])
  })

  it('空列表 / 缺省返回空计划，不抛', () => {
    expect(reconcileStagedCleanup([], false)).toEqual({ cancel: [] })
    expect(reconcileStagedCleanup([], true)).toEqual({ cancel: [] })
  })

  it('父级成功标记 ref.current=true 时卸载计划为空（不 DELETE 已消费暂存）', () => {
    const successRef = { current: true }
    expect(reconcileStagedCleanup(stages, successRef.current)).toEqual({ cancel: [] })
    const failRef = { current: false }
    expect(reconcileStagedCleanup(stages, failRef.current).cancel).toHaveLength(2)
  })

  it('过滤空 stageId，不发无效回收', () => {
    const plan = reconcileStagedCleanup([{ stageId: '' }, { stageId: 'c'.repeat(32) }], false)
    expect(plan.cancel).toEqual(['c'.repeat(32)])
  })
})

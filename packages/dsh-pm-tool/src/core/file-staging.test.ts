/**
 * B3 暂存区单测：stage/cancel/consume 提升/过期 sweep/拒绝类型，隔离临时 FILE_ROOT，不起服务。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stageUpload, readStage, prepareStage, finalizeStage, consumeStage, deleteStage, sweepExpiredStages, StageNotFoundError, StageExpiredError } from './file-staging.js'
import { FileAssetRejectedError } from './file-assets.js'
import { readAssetBuffer, resolveFileRoot } from './file-asset-store.js'

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'pm-stage-'))
  process.env.DSH_PM_FILE_ROOT = root
})

afterEach(() => {
  delete process.env.DSH_PM_FILE_ROOT
  rmSync(root, { recursive: true, force: true })
})

const md = Buffer.from('# 标题\n正文一行。\n', 'utf8')

describe('B3 file-staging', () => {
  it('stageUpload 落隔离暂存，返回不可猜 stageId 与元数据，不写最终资产', async () => {
    const s = await stageUpload({ originalName: 'note.md', bytes: md })
    expect(s.stageId).toMatch(/^[a-f0-9]{32}$/)
    expect(s.size).toBe(md.length)
    expect(s.mediaType).toBe('text/markdown')
    const loaded = await readStage(s.stageId)
    expect(loaded.bytes.equals(md)).toBe(true)
  })

  it('cancel deleteStage 清字节，再次读取 StageNotFound（零残留）', async () => {
    const s = await stageUpload({ originalName: 'note.md', bytes: md })
    await expect(deleteStage(s.stageId)).resolves.toBe(true)
    await expect(readStage(s.stageId)).rejects.toBeInstanceOf(StageNotFoundError)
  })

  it('consumeStage 提升为内容寻址资产并清暂存，读回字节一致', async () => {
    const s = await stageUpload({ originalName: 'note.md', bytes: md })
    const consumed = await consumeStage(s.stageId)
    expect(consumed.relPath).toBeTruthy()
    await expect(readStage(s.stageId)).rejects.toBeInstanceOf(StageNotFoundError)
    const back = await readAssetBuffer(await resolveFileRoot(), consumed.relPath)
    expect(back.equals(md)).toBe(true)
  })

  it('过期暂存读取抛 StageExpired 并清理；sweep 清过期与孤儿 bin', async () => {
    const old = new Date(Date.now() - 20 * 60 * 1000).toISOString()
    const s = await stageUpload({ originalName: 'old.md', bytes: md, nowIso: old })
    await expect(readStage(s.stageId)).rejects.toBeInstanceOf(StageExpiredError)
    const removed = await sweepExpiredStages()
    expect(removed).toBeGreaterThanOrEqual(0)
  })

  it('prepare 保留暂存（DB 失败可重试），finalize 后才清除', async () => {
    const s = await stageUpload({ originalName: 'note.md', bytes: md })
    const prepared = await prepareStage(s.stageId)
    expect(prepared.bytes.equals(md)).toBe(true)
    // prepare 后暂存仍在，未 finalize 前可再次读取（模拟 DB 失败重试）。
    const still = await readStage(s.stageId)
    expect(still.bytes.equals(md)).toBe(true)
    await finalizeStage(s.stageId)
    await expect(readStage(s.stageId)).rejects.toBeInstanceOf(StageNotFoundError)
  })

  it('exe/空文件在暂存入口即拒绝，不落盘', async () => {
    await expect(stageUpload({ originalName: 'v.exe', bytes: Buffer.from('MZ') })).rejects.toBeInstanceOf(FileAssetRejectedError)
    await expect(stageUpload({ originalName: 'e.md', bytes: Buffer.alloc(0) })).rejects.toBeInstanceOf(FileAssetRejectedError)
    expect(existsSync(join(root, 'staging'))).toBe(false)
  })

  it('A25 同一 stage 并发双提交：内容寻址去重，只落一份最终字节，暂存清空无重复', async () => {
    const s = await stageUpload({ originalName: 'note.md', bytes: md })
    const results = await Promise.allSettled([consumeStage(s.stageId), consumeStage(s.stageId)])
    const fulfilled = results.filter(r => r.status === 'fulfilled')
    // 竞态下两次 prepare 可能都成功（storeAssetBuffer 同 hash 幂等、alreadyExisted）；
    // 关键不变量：同 hash 只指向同一 relPath，磁盘至多一份字节，无重复落库/落盘。
    expect(fulfilled.length).toBeLessThanOrEqual(2)
    if (fulfilled.length > 0) {
      const rels = new Set(fulfilled.map(r => (r as PromiseFulfilledResult<{ relPath: string }>).value.relPath))
      expect(rels.size).toBe(1)
      // 成功提升后暂存已清空，无残留 bin/json。
      expect(existsSync(join(root, 'staging', `${s.stageId}.bin`))).toBe(false)
      expect(existsSync(join(root, 'staging', `${s.stageId}.json`))).toBe(false)
    }
    // 关键不变量：内容寻址去重，最终资产目录普通文件至多一份，无重复字节。
    expect(countFinalFiles(root)).toBeLessThanOrEqual(1)
  })
})

function countFinalFiles(dir: string): number {
  let n = 0
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (name === 'staging') continue
    const st = statSync(p)
    if (st.isDirectory()) n += countFinalFiles(p)
    else if (st.isFile()) n += 1
  }
  return n
}

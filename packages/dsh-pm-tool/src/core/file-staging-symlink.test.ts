// A13 开发回归：所有根/链接目标均为自有tmp，不复跑正式路径、不签独立门。
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, mkdirSync, renameSync, symlinkSync, unlinkSync, writeFileSync, readFileSync, readdirSync, lstatSync, readlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import {
  stageUpload, readStage, prepareStage, consumeStage, deleteStage, finalizeStage,
  sweepExpiredStages, STAGE_TTL_MS, StageExpiredError, StageNotFoundError,
} from './file-staging.js'
import { FileAssetRejectedError, storeAssetBuffer, validateUploadedFile } from './file-assets.js'

let own: string
let files: string
const bytes = Buffer.from('# A13 staging\n')
const at = '2026-10-21T12:00:00.000Z'
const expired = new Date(new Date(at).getTime() + STAGE_TTL_MS).toISOString()
function manifest(root: string) {
  const result: Record<string, string> = {}
  function walk(path: string, key: string) {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) result[key] = 'link:' + readlinkSync(path)
    else if (stat.isDirectory()) {
      result[key + '/'] = 'dir'
      for (const n of readdirSync(path).sort()) walk(join(path, n), key + '/' + n)
    } else result[key] = createHash('sha256').update(readFileSync(path)).digest('hex')
  }
  walk(root, '.')
  return result
}
beforeEach(() => {
  own = mkdtempSync(join(tmpdir(), 'a13-stage-symlink-'))
  files = join(own, 'files')
  mkdirSync(files)
  vi.stubEnv('DSH_PM_FILE_ROOT', files)
})
afterEach(context => {
  // 保留开发原证；不follow链接清理外部资产。
  writeFileSync(join(own, 'record.json'), JSON.stringify({ case: context.task.name, final: manifest(own) }, null, 2))
  vi.unstubAllEnvs()
})
const operations = [
  ['read', (id: string) => readStage(id, at)],
  ['prepare', (id: string) => prepareStage(id, at)],
  ['consume', (id: string) => consumeStage(id, at)],
  ['cancel', (id: string) => deleteStage(id)],
  ['finalize', (id: string) => finalizeStage(id)],
  ['sweep', () => sweepExpiredStages(expired)],
  ['expired-read', (id: string) => readStage(id, expired)],
] as const

describe('A13 暂存链接拒绝与共享字节保护', () => {
  it.each(['explicit', 'isolated', 'profile'])('上传 %s 根的链接祖先后仍缺子目录，必须在根mkdir前零写拒绝', async source => {
    const outside = join(own, 'outside')
    mkdirSync(outside)
    const alias = join(own, 'alias')
    symlinkSync(outside, alias, 'dir')
    vi.stubEnv('DSH_PM_FILE_ROOT', source === 'explicit' ? join(alias, 'missing') : '')
    vi.stubEnv('DSH_PM_ISOLATED_ROOT', source === 'isolated' ? alias : '')
    vi.stubEnv('DSH_HOME', source === 'profile' ? alias : '')
    const before = manifest(own)
    await expect(stageUpload({ originalName: '文件.md', bytes })).rejects.toBeInstanceOf(FileAssetRejectedError)
    expect(manifest(own)).toEqual(before)
  })

  for (const variant of ['root', 'ancestor', 'staging', 'bin', 'json']) {
    it.each(operations)(`${variant} 链接后 %s 必须拒绝且不读/消费/删除共享或外部资产`, async (_name, op) => {
      const stage = await stageUpload({ originalName: '文件.md', bytes, nowIso: at })
      const shared = await storeAssetBuffer(files, validateUploadedFile({ originalName: 'shared.md', bytes }))
      if (variant === 'root') {
        const moved = join(own, 'outside')
        renameSync(files, moved)
        symlinkSync(moved, files, 'dir')
      } else if (variant === 'ancestor') {
        symlinkSync(own, join(own, 'alias'), 'dir')
        vi.stubEnv('DSH_PM_FILE_ROOT', join(own, 'alias/files'))
      } else if (variant === 'staging') {
        const moved = join(own, 'outside')
        renameSync(join(files, 'staging'), moved)
        symlinkSync(moved, join(files, 'staging'), 'dir')
      } else {
        const path = join(files, 'staging', stage.stageId + '.' + variant)
        unlinkSync(path)
        symlinkSync(join(files, shared.relPath), path, 'file')
      }
      const before = manifest(own)
      await expect(op(stage.stageId)).rejects.toBeInstanceOf(FileAssetRejectedError)
      expect(manifest(own)).toEqual(before)
    })
  }

  it('正常Unicode/opaqueID/prepare重试/消费一次/取消/finalize保持，共享hash不被删', async () => {
    const shared = await storeAssetBuffer(files, validateUploadedFile({ originalName: 'shared.md', bytes }))
    const s = await stageUpload({ originalName: '文件.md', bytes, nowIso: at })
    expect(s.stageId).toMatch(/^[a-f0-9]{32}$/)
    expect(s.fileName).toBe('文件.md')
    expect((await readStage(s.stageId, at)).bytes).toEqual(bytes)
    expect((await prepareStage(s.stageId, at)).bytes).toEqual(bytes)
    expect((await prepareStage(s.stageId, at)).bytes).toEqual(bytes)
    const consumed = await consumeStage(s.stageId, at)
    expect(consumed.alreadyExisted).toBe(true)
    await expect(consumeStage(s.stageId, at)).rejects.toBeInstanceOf(StageNotFoundError)
    await finalizeStage(s.stageId)
    expect(await deleteStage(s.stageId)).toBe(false)
    expect(readFileSync(join(files, shared.relPath))).toEqual(bytes)
    const cancel = await stageUpload({ originalName: '文件.md', bytes, nowIso: at })
    expect(await deleteStage(cancel.stageId)).toBe(true)
    expect(await deleteStage(cancel.stageId)).toBe(false)
    expect(readFileSync(join(files, shared.relPath))).toEqual(bytes)
  })

  it('正常TTL精确到期/损坏sidecar/孤儿bin清理仍只清staging', async () => {
    const shared = await storeAssetBuffer(files, validateUploadedFile({ originalName: 'shared.md', bytes }))
    const s = await stageUpload({ originalName: '文件.md', bytes, nowIso: at })
    await expect(readStage(s.stageId, expired)).rejects.toBeInstanceOf(StageExpiredError)
    const damaged = await stageUpload({ originalName: '文件.md', bytes, nowIso: at })
    writeFileSync(join(files, 'staging', damaged.stageId + '.json'), '{')
    writeFileSync(join(files, 'staging', 'a'.repeat(32) + '.bin'), bytes)
    expect(await sweepExpiredStages(at)).toBe(2)
    expect(readdirSync(join(files, 'staging'))).toEqual([])
    expect(readFileSync(join(files, shared.relPath))).toEqual(bytes)
  })
})

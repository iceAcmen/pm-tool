import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { access, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stageUpload } from './file-staging.js'
import { applyTaskOpsWithFiles, prepareFilePromotion } from './file-asset-store.js'
import type { PmDomain } from './storage.js'

function buildDomain(seedTask = false): { domain: PmDomain; tables: Map<string, Map<string, unknown>> } {
  const tables = new Map<string, Map<string, unknown>>()
  const table = (name: string) => {
    if (!tables.has(name)) tables.set(name, new Map())
    const m = tables.get(name)!
    return {
      get: (k: string) => m.get(k),
      put: async (k: string, v: unknown) => { m.set(k, v) },
      entries: () => m.entries(),
      delete: async (k: string) => { m.delete(k) },
    }
  }
  if (seedTask) {
    table('tasks').put('t-0001', {
      id: 't-0001', projectId: 'p-0001', parentId: null, title: '同内容附件回归',
      description: '', assignee: 'QA', status: 'todo', priority: 'P1', progress: 0,
      milestoneId: null, manualProgress: null, attachments: [], progressLog: [],
      code: '1', order: 1, createdAt: '2026-10-20T00:00:00.000Z', updatedAt: '2026-10-20T00:00:00.000Z',
    })
  }
  return { domain: { table } as unknown as PmDomain, tables }
}

function emptyDomain(): PmDomain {
  return buildDomain().domain
}

describe('prepareFilePromotion same-hash dedup', () => {
  let root: string
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'pm-promote-'))
    process.env.DSH_PM_FILE_ROOT = root
  })
  afterEach(async () => {
    delete process.env.DSH_PM_FILE_ROOT
    await rm(root, { recursive: true, force: true })
  })

  it('two staged copies of identical bytes reuse one new asset row and assetId', async () => {
    const bytes = Buffer.from('# same content\n', 'utf8')
    const first = await stageUpload({ originalName: 'a.md', bytes })
    const second = await stageUpload({ originalName: 'b.md', bytes })
    const result = await prepareFilePromotion(emptyDomain(), 'p-0001', [
      { op: 'addFile', stageId: first.stageId },
      { op: 'addFile', stageId: second.stageId },
    ], '2026-10-20T00:00:00.000Z')
    expect(result.newRows).toHaveLength(1)
    expect(result.prepared.map(p => p.assetId)).toEqual([result.newRows[0].id, result.newRows[0].id])
  })

  it('production task transaction deduplicates same-hash stages and finalizes both', async () => {
    const { domain, tables } = buildDomain(true)
    const bytes = Buffer.from('# identical production content\n', 'utf8')
    const first = await stageUpload({ originalName: 'first.md', bytes })
    const second = await stageUpload({ originalName: 'second.md', bytes })

    const saved = await applyTaskOpsWithFiles(domain, 't-0001', {
      attachmentOps: [
        { op: 'addFile', stageId: first.stageId, clientId: 'c-first' },
        { op: 'addFile', stageId: second.stageId, clientId: 'c-second' },
      ],
      progressOps: [],
    }, '2026-10-20T01:00:00.000Z')

    expect([...tables.get('file_assets')!.values()]).toHaveLength(1)
    expect(saved.attachments).toEqual([
      expect.objectContaining({ kind: 'file', assetId: 'fa-0001' }),
    ])
    await expect(access(join(root, 'staging', `${first.stageId}.json`))).rejects.toThrow()
    await expect(access(join(root, 'staging', `${second.stageId}.json`))).rejects.toThrow()
  })
})

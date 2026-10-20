import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile, readFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { applyBackup } from './backup.js'
import { writeBundleDir, backupJsonSha } from './file-backup.js'
import { storeAssetBuffer, validateUploadedFile } from './file-assets.js'
import { readAssetBuffer } from './file-asset-store.js'

const now = '2026-10-20T00:00:00.000Z'

function validProject(name: string) {
  return {
    id: 'p-0001',
    name,
    description: '',
    owner: 'Ice',
    status: 'active',
    startDate: '2026-10-01',
    targetDate: '2026-10-31',
    createdAt: now,
    updatedAt: now,
  }
}

function wrapTable(rows: Map<string, unknown>) {
  return {
    entries: () => rows.entries(),
    get: (key: string) => rows.get(key),
    put: async (key: string, value: unknown) => { rows.set(key, value) },
    delete: async (key: string) => { rows.delete(key) },
  }
}

function memoryDomain(rows: Record<string, Map<string, unknown>>) {
  return {
    table: (name: string) => {
      rows[name] ??= new Map()
      return wrapTable(rows[name])
    },
  } as never
}

describe('backup mid-promotion failure', () => {
  let source: string
  let target: string
  let backupDir: string
  let jsonPath: string

  beforeEach(async () => {
    source = await mkdtemp(join(tmpdir(), 'pm-rollback-src-'))
    target = await mkdtemp(join(tmpdir(), 'pm-rollback-tgt-'))
    backupDir = await mkdtemp(join(tmpdir(), 'pm-rollback-bak-'))
    process.env.DSH_PM_FILE_ROOT = source
  })

  afterEach(async () => {
    delete process.env.DSH_PM_FILE_ROOT
    await rm(source, { recursive: true, force: true })
    await rm(target, { recursive: true, force: true })
    await rm(backupDir, { recursive: true, force: true })
  })

  it('DB replace succeeds, second new byte promotion fails: DB rolls back, only new byte removed, shared byte kept', async () => {
    const aValid = validateUploadedFile({ originalName: 'a.md', declaredMediaType: 'text/markdown', bytes: Buffer.from('shared-alpha', 'utf8') })
    const bValid = validateUploadedFile({ originalName: 'b.md', declaredMediaType: 'text/markdown', bytes: Buffer.from('new-beta', 'utf8') })
    const a = await storeAssetBuffer(source, aValid)
    const b = await storeAssetBuffer(source, bValid)
    // 目标根预置共享 A；B 是本次恢复新写字节。
    await mkdir(join(target, dirname(a.relPath)), { recursive: true })
    await writeFile(join(target, a.relPath), 'shared-alpha')

    const rowA = { id: 'fa-0001', projectId: 'p-0001', fileName: 'a.md', mediaType: 'text/markdown', size: a.size, sha256: a.sha256, relPath: a.relPath, addedAt: now }
    const rowB = { id: 'fa-0002', projectId: 'p-0001', fileName: 'b.md', mediaType: 'text/markdown', size: b.size, sha256: b.sha256, relPath: b.relPath, addedAt: now }
    const targetBackup = {
      format: 'pm-tool-backup' as const,
      formatVersion: 1,
      exportedAt: now,
      projects: [validProject('TARGET')],
      tasks: [],
      milestones: [],
      riskIssues: [],
      meetings: [],
      reports: [],
      deliverables: [],
      fileBundleId: 'b1',
      extra: { file_assets: [['fa-0001', rowA], ['fa-0002', rowB]] },
    }
    const jsonText = JSON.stringify(targetBackup)
    jsonPath = join(backupDir, 'target.json')
    await writeFile(jsonPath, jsonText)
    await writeBundleDir(targetBackup, `${jsonPath}.files.b1`, 'b1', backupJsonSha(jsonText))

    const beforeRows: Record<string, Map<string, unknown>> = {
      projects: new Map([['p-0001', validProject('BEFORE')]]),
      tasks: new Map(),
      milestones: new Map(),
      risk_issues: new Map(),
      meetings: new Map(),
      reports: new Map(),
      deliverables: new Map(),
      settings: new Map(),
      reflections: new Map(),
      okrs: new Map(),
      lessons: new Map(),
      habits: new Map(),
      file_assets: new Map([['fa-0001', rowA]]),
    }
    const domain = memoryDomain(beforeRows)

    process.env.DSH_PM_FILE_ROOT = target
    let promoted = ''
    await expect(applyBackup(domain, targetBackup, backupDir, {
      onPromoteBytes: rel => {
        promoted = rel
        throw new Error('injected promotion fault')
      },
    }, jsonPath, backupJsonSha(jsonText))).rejects.toThrow(/已自动回滚/)

    expect(promoted).toBe(b.relPath)
    expect(beforeRows.projects.get('p-0001')).toMatchObject({ name: 'BEFORE' })
    expect(beforeRows.file_assets.size).toBe(1)
    await expect(readFile(join(target, b.relPath), 'utf8')).rejects.toThrow(/ENOENT/)
    const shared = await readAssetBuffer(target, a.relPath)
    expect(shared.toString('utf8')).toBe('shared-alpha')
  })
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { createHash } from 'node:crypto'
import { cp, mkdtemp, mkdir, readdir, readFile, writeFile, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { pmDomainSpec, type PmDomain } from '../core/storage.js'
import { applyBackup, collectBackup, readBackupFile, BACKUP_TABLES, EXTRA_BACKUP_TABLES, type PmBackup } from '../core/backup.js'
import { backupJsonSha } from '../core/file-backup.js'
import { handleBackupCommand, quoteBackupPath } from './backup.js'

async function manifest(root: string): Promise<Record<string, unknown>> {
  let entries
  try { entries = await readdir(root, { withFileTypes: true }) } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw error
  }
  const out: Record<string, unknown> = {}
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(root, entry.name)
    out[entry.name] = entry.isDirectory() ? await manifest(path) : {
      sha256: createHash('sha256').update(await readFile(path)).digest('hex'),
    }
  }
  return out
}

describe('备份网页接缝（真实 handler/schema/JSON domain）', () => {
  let root: string
  let domain: PmDomain
  let facility: DomainFacility
  let backup: PmBackup
  let env: Record<string, string | undefined>
  let evidence: unknown[]
  const fixturePath = () => process.env.PM_BACKUP_FIXTURE_DIR
    ? join(process.env.PM_BACKUP_FIXTURE_DIR, 'backup.json')
    : fileURLToPath(new URL('../../../../docs/testing/materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr/fixtures/F5/backup.json', import.meta.url))

  beforeEach(async () => {
    root = await mkdtemp(join(process.env.PM_BACKUP_WEB_TMP ?? tmpdir(), 'pm-backup-web-case-'))
    env = Object.fromEntries(['DSH_PM_FILE_ROOT', 'DSH_PM_BACKUP_DIR'].map(key => [key, process.env[key]]))
    process.env.DSH_PM_FILE_ROOT = join(root, 'files')
    process.env.DSH_PM_BACKUP_DIR = join(root, 'backups')
    const ctx = new Context()
    await ctx.plugin(Storage)
    ctx.storage.backend.register('json', new JsonStorageBackend(join(root, 'data')))
    facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
    domain = await facility.open(pmDomainSpec)
    backup = JSON.parse(await readFile(fixturePath(), 'utf8'))
    evidence = []
  })

  const snapshot = async () => ({
    tables: JSON.parse(JSON.stringify(Object.fromEntries(
      ([...BACKUP_TABLES, ...EXTRA_BACKUP_TABLES, 'sessions', 'checks'] as const).map(name =>
        [name, [...domain.table(name).entries()]]),
    ))),
    disk: await manifest(root),
  })
  const readOnly = async (argument: string) => {
    const before = await snapshot()
    const result = await handleBackupCommand(argument, domain)
    const after = await snapshot()
    evidence.push({ argument, result, before, after })
    expect(after).toEqual(before)
    return result
  }
  const copyFixture = async (label = '标准 F5 备份.json') => {
    const path = join(root, label)
    await cp(fixturePath(), path)
    await cp(`${fixturePath()}.files.${backup.fileBundleId}`, `${path}.files.${backup.fileBundleId}`, { recursive: true })
    return path
  }

  afterEach(async context => {
    if (!root) return
    await writeFile(join(root, 'observations.json'), JSON.stringify({
      case: context.task.name, pid: process.pid, evidence, final: await snapshot(),
    }, null, 2))
    await facility?.closeAll()
    for (const [key, value] of Object.entries(env ?? {})) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  it('MFR-B02：content 演练先拒绝可识别的越界 relPath，不能宣称预检成功', async () => {
    const asset = backup.extra!.file_assets[0][1] as { relPath: string }
    asset.relPath = '../outside'
    const result = await readOnly(`restore-content ${JSON.stringify(JSON.stringify(backup))}`)
    expect(result.kind).toBe('error')
    expect(result.text).toMatch(/路径.*(越界|不合法)/)
  })

  it('MFR-B01：标准 F5 content-only 演练和确认均诚实说明未检字节且零写', async () => {
    const content = JSON.stringify(await readFile(fixturePath(), 'utf8'))
    for (const suffix of ['', ' confirm']) {
      const result = await readOnly(`restore-content ${content}${suffix}`)
      expect(result.kind).toBe('error')
      expect(result.text).toMatch(/未检验.*字节/)
      expect(result.text).toMatch(/本机.*完整路径/)
    }
  })

  it('含 file 引用却缺 file_assets 的不完整包不能冒充无附件 content/path 成功', async () => {
    delete backup.extra!.file_assets
    const path = await copyFixture()
    const text = JSON.stringify(backup)
    await writeFile(path, text)
    for (const argument of [
      `restore-content ${JSON.stringify(text)}`, `restore-content ${JSON.stringify(text)} confirm`,
      `restore ${quoteBackupPath(path)}`, `restore ${quoteBackupPath(path)} confirm`,
    ]) {
      const result = await readOnly(argument)
      expect(result.kind).toBe('error')
      expect(result.text).toMatch(/文件资产|file_assets/)
    }
  })

  it('路径演练与确认同级：缺少标准侧车时先拒绝，原库与字节零写', async () => {
    const path = join(root, '只有 JSON.json')
    await cp(fixturePath(), path)
    for (const suffix of ['', ' confirm']) {
      const result = await readOnly(`restore "${path}"${suffix}`)
      expect(result.kind).toBe('error')
      expect(result.text).toMatch(/缺少.*bundle/)
    }
  })

  it.each(['hash', 'missing'])('路径演练与确认同级：%s 字节损坏先拒绝且零写', async mode => {
    const path = await copyFixture()
    const asset = backup.extra!.file_assets[0][1] as { relPath: string }
    const bytes = join(`${path}.files.${backup.fileBundleId}`, asset.relPath)
    if (mode === 'hash') await writeFile(bytes, 'tampered')
    else await unlink(bytes)
    for (const suffix of ['', ' confirm']) {
      const result = await readOnly(`restore "${path}"${suffix}`)
      expect(result.kind).toBe('error')
      expect(result.text).toMatch(mode === 'hash' ? /sha256/ : /字节缺失/)
    }
  })

  it('完整 F5 路径演练只读；确认按 expected 恢复全部十三表/共享/历史/字节', async () => {
    const expected = JSON.parse(await readFile(join(dirname(fixturePath()), 'expected.json'), 'utf8'))
    const path = await copyFixture()
    const sourceBefore = await manifest(`${path}.files.${backup.fileBundleId}`)
    const preview = await readOnly(`restore "${path}"`)
    expect(preview.kind).toBe('success')
    const result = await handleBackupCommand(`restore "${path}" confirm`, domain)
    evidence.push({ path, result })
    expect(result.kind).toBe('success')
    expect((await snapshot()).tables).toMatchObject(expected.tables)
    for (const [rel, entry] of Object.entries(expected.manifest)) {
      const bytes = await readFile(join(root, 'files', rel))
      expect({ size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }).toEqual(entry)
    }
    expect(await manifest(`${path}.files.${backup.fileBundleId}`)).toEqual(sourceBefore)
    expect((await snapshot()).tables.sessions).toEqual([])
    expect((await snapshot()).tables.checks).toEqual([])
  })

  it('有空格的真实本机路径预检回显可直接安全复制的 confirm 命令', async () => {
    const path = await copyFixture("确认 目录's 标准 F5.json")
    const result = await readOnly(`restore "${path}"`)
    expect(result.kind).toBe('success')
    expect(result.text).toContain(`/pm restore "${path}" confirm`)
  })

  it.each(['garbage', 'confirm garbage', 'confirm confirm', '"confirm"ignored'])(
    '错误尾参 %s 不能注入确认或写库', async suffix => {
      const path = await copyFixture()
      const result = await readOnly(`restore "${path}" ${suffix}`)
      expect(result.kind).toBe('error')
      expect(result.text).toMatch(/参数|格式|confirm/)
    },
  )

  it.each([
    ['任务项目悬空', (b: PmBackup) => { b.tasks[0].projectId = 'p-missing' }, /projectId/],
    ['任务父级跨项目', (b: PmBackup) => { b.tasks[0].parentId = 't-0002' }, /parentId/],
    ['任务父级循环', (b: PmBackup) => { b.tasks[0].parentId = 't-0003'; b.tasks[2].parentId = 't-0001' }, /parentId/],
    ['交付物里程碑悬空', (b: PmBackup) => { b.deliverables[0].milestoneId = 'm-missing' }, /milestoneId/],
    ['文件引用跨项目', (b: PmBackup) => { (b.extra!.file_assets[0][1] as { projectId: string }).projectId = 'p-0002' }, /文件资产/],
    ['文件 hash 缺失', (b: PmBackup) => { delete (b.extra!.file_assets[0][1] as { sha256?: string }).sha256 }, /sha256/],
    ['文件 relPath 越界', (b: PmBackup) => { (b.extra!.file_assets[0][1] as { relPath: string }).relPath = '../outside' }, /路径越界/],
    ['项目 schema 错误', (b: PmBackup) => { b.projects[0].name = '' }, /name|名称/],
    ['extra 表结构错误', (b: PmBackup) => { b.extra!.habits = {} as never }, /extra|habits/],
  ] as const)('%s 在 content/path 演练及确认之前拒绝且零写', async (_name, mutate, reason) => {
    mutate(backup)
    const path = await copyFixture()
    const text = JSON.stringify(backup)
    await writeFile(path, text)
    for (const argument of [
      `restore-content ${JSON.stringify(text)}`, `restore-content ${JSON.stringify(text)} confirm`,
      `restore ${quoteBackupPath(path)}`, `restore ${quoteBackupPath(path)} confirm`,
    ]) {
      const result = await readOnly(argument)
      expect(result.kind).toBe('error')
      expect(result.text).toMatch(reason)
    }
  })

  it('无 file 的原 F3 content 演练/确认兼容，不借删 F5 元数据造成功', async () => {
    const f3 = await readFile(join(dirname(fixturePath()), '../F3/backup.json'), 'utf8')
    const preview = await readOnly(`restore-content ${JSON.stringify(f3)}`)
    expect(preview.kind).toBe('success')
    const result = await handleBackupCommand(`restore-content ${JSON.stringify(f3)} confirm`, domain)
    expect(result.kind).toBe('success')
    expect(domain.table('tasks').get('t-0001')!.progressLog![0].revisions).toHaveLength(3)
    expect(domain.table('file_assets').entries().next().done).toBe(true)
  })

  it('已有全表与字节恢复前生成可预检的安全快照；legacy 七表包保留 extra+file_assets', async () => {
    const path = await copyFixture()
    expect((await handleBackupCommand(`restore ${quoteBackupPath(path)} confirm`, domain)).kind).toBe('success')
    const project = domain.table('projects').get('p-0001')!
    await domain.table('projects').put(project.id, { ...project, name: '恢复前名称' })
    const before = collectBackup(domain)
    const restored = await handleBackupCommand(`restore ${quoteBackupPath(path)} confirm`, domain)
    expect(restored.kind).toBe('success')
    const safetyPath = restored.text!.match(/恢复前自动安全快照：([^\n]+)/)![1]
    const safety = await readBackupFile(safetyPath)
    expect(safety.projects).toEqual(before.projects)
    expect(safety.tasks).toEqual(before.tasks)
    expect(safety.extra).toEqual(before.extra)
    expect((await readOnly(`restore ${quoteBackupPath(safetyPath)}`)).kind).toBe('success')
    const legacy: PmBackup = {
      format: 'pm-tool-backup', formatVersion: 1, exportedAt: '2026-10-21T00:00:00.000Z',
      projects: [], tasks: [], milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [],
    }
    const extra = collectBackup(domain).extra
    const fileBytes = await manifest(join(root, 'files'))
    expect((await readOnly(`restore-content ${JSON.stringify(JSON.stringify(legacy))}`)).kind).toBe('success')
    expect((await handleBackupCommand(`restore-content ${JSON.stringify(JSON.stringify(legacy))} confirm`, domain)).kind).toBe('success')
    expect(collectBackup(domain).extra).toEqual(extra)
    expect(await manifest(join(root, 'files'))).toEqual(fileBytes)
    evidence.push({ safetyPath, safety, before, legacyExtra: collectBackup(domain).extra })
  })

  it.each(['table', 'bytes'])('真实 JSON 事务 %s 中途失败：全表回滚、仅删新字节，安全快照可恢复', async mode => {
    const path = await copyFixture()
    const asset = backup.extra!.file_assets[0][1] as { relPath: string }
    await mkdir(join(root, 'files', dirname(asset.relPath)), { recursive: true })
    await cp(join(`${path}.files.${backup.fileBundleId}`, asset.relPath), join(root, 'files', asset.relPath))
    // 合法前态含完整十三表/历史/共享 A；B 仅在目标 F5 中，确保真有新字节需要回滚。
    const expected = JSON.parse(await readFile(join(dirname(fixturePath()), 'expected.json'), 'utf8'))
    for (const [name, rows] of Object.entries(expected.tables) as [string, [string, Record<string, unknown>][]][]) {
      for (const [key, row] of rows) {
        if (name === 'file_assets' && key === 'fa-0002') continue
        const value = structuredClone(row)
        if (name === 'tasks' && Array.isArray(value.attachments)) {
          value.attachments = value.attachments.filter(a => a.kind !== 'file' || a.assetId !== 'fa-0002')
        }
        await domain.table(name as never).put(key, value as never)
      }
    }
    await domain.table('projects').put(backup.projects[0].id, { ...backup.projects[0], name: '回滚前项目' })
    await domain.table('settings').put('before', { value: '回滚前设置', updatedAt: backup.exportedAt })
    const before = {
      tables: (await snapshot()).tables, data: await manifest(join(root, 'data')), files: await manifest(join(root, 'files')),
    }
    let fault = false
    const hooks = mode === 'table' ? {
      onWrite(table: string, op: string) {
        if (!fault && table === 'file_assets' && op === 'put') { fault = true; throw new Error('一次真实表写后故障') }
      },
    } : { onPromoteBytes() { fault = true; throw new Error('一次真实字节提升后故障') } }
    await expect(applyBackup(domain, backup, undefined, hooks, path, backupJsonSha(await readFile(path, 'utf8')))).rejects.toThrow(/已自动回滚/)
    expect(fault).toBe(true)
    const after = {
      tables: (await snapshot()).tables, data: await manifest(join(root, 'data')), files: await manifest(join(root, 'files')),
    }
    expect(after).toEqual(before)
    const [safety] = (await readdir(join(root, 'backups'))).filter(name => name.endsWith('.json'))
    const safetyResult = await readOnly(`restore ${quoteBackupPath(join(root, 'backups', safety))}`)
    expect(safetyResult.kind).toBe('success')
    evidence.push({ mode, before, after, safetyResult })
  })

  it.each(['size', 'mime', 'relPath'])('JSON/manifest 摘要匹配但 %s 与实际字节不符时，路径演练先拒绝', async mode => {
    const path = await copyFixture()
    const sidecar = `${path}.files.${backup.fileBundleId}`
    const asset = backup.extra!.file_assets[0][1] as { size: number; mediaType: string; relPath: string }
    const manifestPath = join(sidecar, 'manifest.json')
    const sidecarManifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    if (mode === 'size') {
      asset.size++
      sidecarManifest.files[0].size++
    } else if (mode === 'mime') {
      asset.mediaType = 'image/png'
    } else {
      const oldRel = asset.relPath
      asset.relPath = asset.relPath.replace(/\.md$/, '-other.md')
      sidecarManifest.files[0].relPath = asset.relPath
      await cp(join(sidecar, oldRel), join(sidecar, asset.relPath))
      await unlink(join(sidecar, oldRel))
    }
    const text = JSON.stringify(backup)
    await writeFile(path, text)
    sidecarManifest.jsonSha256 = backupJsonSha(text)
    await writeFile(manifestPath, JSON.stringify(sidecarManifest))
    for (const suffix of ['', ' confirm']) {
      const result = await readOnly(`restore ${quoteBackupPath(path)}${suffix}`)
      expect(result.kind).toBe('error')
    }
  })
})

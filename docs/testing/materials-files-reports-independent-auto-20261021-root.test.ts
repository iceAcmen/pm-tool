// 生产TS经Vitest正常转译；真实JSON领域和自有文件，不以类型转译替代tsc门。
import { describe, it, beforeEach, afterEach, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { pmDomainSpec } from './src/core/storage.js'
import { addProject } from './src/core/projects.js'
import { storeAssetBuffer, validateUploadedFile, readAssetBuffer, FileAssetRejectedError } from './src/core/file-assets.js'

let own: string, facility: DomainFacility, domain: any
const observations: unknown[] = []
function manifest(dir: string, prefix = ''): Record<string, unknown> {
  if (!fs.existsSync(dir)) return {}
  return Object.fromEntries(fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const f = path.join(dir, e.name), rel = prefix + e.name
    if (e.isDirectory()) return Object.entries(manifest(f, rel + '/'))
    return [[rel, e.isFile() ? { bytes: fs.statSync(f).size,
      sha256: createHash('sha256').update(fs.readFileSync(f)).digest('hex') } : { symlink: fs.readlinkSync(f) }]]
  }))
}
beforeEach(async () => {
  own = fs.mkdtempSync(path.join(process.env.QA_OWN!, 'root-ts-'))
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(path.join(own, 'data')))
  facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  domain = await facility.open(pmDomainSpec)
  await addProject(domain, { name: 'root负例真实库', startDate: '2026-01-01', targetDate: '2026-12-31' })
})
afterEach(async () => {
  await facility.closeAll()
  fs.writeFileSync(path.join(process.env.QA_OWN!, 'root-observations.json'), JSON.stringify(observations, null, 2))
})
describe('RA-F03独立根上层生产TS反证', () => {
  for (const mode of ['existing', 'missing']) it('RA-F03/root-parent-' + mode + ':配置root上层link拒绝，DB/外部零写', async () => {
    const outside = path.join(own, 'outside'), linked = path.join(own, 'link')
    fs.mkdirSync(outside)
    if (mode === 'existing') fs.mkdirSync(path.join(outside, 'files'))
    fs.symlinkSync(outside, linked)
    const before = { data: manifest(path.join(own, 'data')), outside: manifest(outside),
      projects: [...domain.table('projects').entries()] }
    const validated = validateUploadedFile({ originalName: 'parent.md', bytes: Buffer.from('root parent ' + mode) })
    let error: unknown
    try { await storeAssetBuffer(path.join(linked, 'files'), validated) } catch (e) { error = e }
    const after = { data: manifest(path.join(own, 'data')), outside: manifest(outside),
      projects: [...domain.table('projects').entries()] }
    observations.push({ mode, before, after, error: String(error) })
    expect(error).toBeInstanceOf(FileAssetRejectedError)
    expect(after).toEqual(before)
  })
  for (const mode of ['existing', 'missing']) it('RA-F03/old-parent-counterexample-' + mode + ':旧340c真实函数接受并穿root外，不是当前绿', async () => {
    const old = await import(process.env.QA_PREVIOUS_ASSET!)
    const outside = path.join(own, 'old-outside'), linked = path.join(own, 'old-link')
    fs.mkdirSync(outside)
    if (mode === 'existing') fs.mkdirSync(path.join(outside, 'files'))
    fs.symlinkSync(outside, linked)
    const before = manifest(outside)
    const v = old.validateUploadedFile({ originalName: 'old.md', bytes: Buffer.from('old parent ' + mode) })
    const observed = await old.storeAssetBuffer(path.join(linked, 'files'), v)
    const after = manifest(outside)
    observations.push({ oldSource: '340c6c1bce59baf5513fce21d1d00fe3b440ea48b9cffb0ceb7da63279f747f2', mode, before, after, observed })
    expect(before).not.toEqual(after)
    expect(fs.readFileSync(path.join(outside, 'files', observed.relPath)).equals(v.bytes)).toBe(true)
  })
  it('RA-F03/platform-tmp-alias:仅macOS固定tmp父alias和真实private对应可写', async () => {
    expect(process.platform).toBe('darwin')
    expect(fs.realpathSync('/tmp')).toBe('/private/tmp')
    const root = path.join(own.replace('/private/tmp/', '/tmp/'), 'files')
    const v = validateUploadedFile({ originalName: 'alias.md', bytes: Buffer.from('allowed platform alias') })
    const stored = await storeAssetBuffer(root, v)
    expect((await readAssetBuffer(root, stored.relPath)).equals(v.bytes)).toBe(true)
    observations.push({ root, stored, files: manifest(root) })
  })
})

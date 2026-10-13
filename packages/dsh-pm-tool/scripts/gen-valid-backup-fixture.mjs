#!/usr/bin/env node
// R3-TDEF-001：用产品 core/backup 的 createBackup 生成合法 schema fixture，禁止手写旧格式。
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const out = process.argv[2]
if (!out) throw new Error('用法: node scripts/gen-valid-backup-fixture.mjs <输出路径>')
const { Context } = await import('@deepseek-ai/cordis')
const Storage = (await import('@deepseek-ai/dsh-storage')).default
const { JsonStorageBackend } = await import('@deepseek-ai/dsh-storage-json')
const { DomainFacility } = (await import('@deepseek-ai/dsh-storage-domain'))
const { apply } = await import('../lib/index.js')

const root = mkdtempSync(join(tmpdir(), 'pm-fixture-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const f = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', f)
let cmd
ctx.provide('commands', { register(d) { cmd = d; return () => {} } })
await apply(ctx)
const run = async r => cmd.handler({ rawInput: r, attachments: [] })
await run('project add {"name":"夹具备份源","startDate":"2026-10-01","targetDate":"2026-12-31"}')
await run('task add {"projectId":"p-0001","title":"fixture任务","startDate":"2026-10-01","dueDate":"2026-10-10"}')
await run(`backup "${out}"`)
rmSync(root, { recursive: true, force: true })
console.log('fixture written:', out)

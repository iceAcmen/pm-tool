/**
 * P2-B X7 愿景/OKR 层真实链路自验（独立临时根，不触碰 3172 / 正式 data/）。
 * 机制同 verify-p0-integration.mjs：真实 Context + JsonStorageBackend 临时根 + 真实命令 handler。
 * 覆盖：
 *  1. okr add 真实落库（objective + KR 单父归属 + 软关联）
 *  2. okr list 树形 JSON（单父归属 / related 标注 / weightGroup）
 *  3. okr tree 人类可读缩进（软关联行标「关联」）
 *  4. okr suggest → 收件区出现且 okrs 表无新记录（未确认不生效）
 *  5. okr inbox 列待确认；okr confirm → okrs 表出现 draft 记录 + 建议已处理
 *  6. okr ignore → 建议保留标 ignored，不建记录
 *  7. okr inbox clear → 清空已处理/已忽略，pending 保留
 *  8. 负例：跨项目/缺失父目标被拒（中文文案）、未知字段拒绝、kind 必填
 *  9. 落盘核验：okrs/*.json 与 settings/pmOkrInbox.json 真实 JSON 文件
 *
 * 运行：pnpm 预编译后 `node scripts/verify-p2b-okr.mjs`（从 lib 构建产物导入）。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import { handleOkrCommand } from '../lib/commands/okr.js'
import { pmDomainSpec } from '../lib/core/storage.js'

const root = mkdtempSync(join(tmpdir(), 'pm-tool-p2b-okr-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)

const results = []
const check = (k, ok, detail = '') => {
  results.push({ k, ok: !!ok, detail: String(detail) })
  console.log(`[${ok ? 'OK' : 'XX'}] ${k} :: ${detail}`)
}

async function run(rawInput, expected = 'success') {
  const result = await handleOkrCommand(rawInput, domain)
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}

let domain
try {
  // 直接打开领域（复刻 apply() 内 openPmDomain），不经过 index.js，避免依赖其它分片在制品。
  domain = await ctx.storageDomain.open(pmDomainSpec)
  assert.ok(domain)
  const project = await addProject(domain, { name: 'P2-B OKR 验证项目', startDate: '2026-10-01', targetDate: '2026-12-31' })
  const pid = project.id

  // ===== 1) add 真实落库：目标 O1 =====
  const o1 = await run(`add ${pid} ${JSON.stringify({ title: '做出稳定可交付的个人工作台', kind: 'objective', owner: 'Ice', targetDate: '2026-12-31' })}`)
  check('add.objective', /okr-/.test(o1), o1.split('\n')[0])
  const o1Id = /(okr-[a-zA-Z0-9_-]+)/.exec(o1)[1]

  // ===== 1b) add KR：单父归属 O1 + 软关联 O2 =====
  await run(`add ${pid} ${JSON.stringify({ title: '提升交付稳定性', kind: 'key-result', primaryOkrId: o1Id })}`)
  const o2 = await run(`add ${pid} ${JSON.stringify({ title: '完善知识库沉淀', kind: 'objective', relatedOkrIds: [o1Id] })}`)
  const o2Id = /(okr-[a-zA-Z0-9_-]+)/.exec(o2)[1]
  const rows = [...domain.table('okrs').entries()].filter(([, r]) => r.projectId === pid)
  check('add.threeRows', rows.length === 3, `okrs rows=${rows.length}`)

  // ===== 2) list 树形 JSON：单父归属 / related 标注 / weightGroup =====
  const listText = await run(`list ${pid}`)
  const listJson = JSON.parse(listText)
  const rootNodes = listJson.tree
  const o1Node = rootNodes.find(n => n.id === o1Id)
  check('list.singleParent', o1Node && o1Node.children.some(c => c.kind === 'key-result' && c.weightGroup === o1Id),
    `KR weightGroup=${o1Node?.children.map(c => c.weightGroup).join(',')}`)
  const o2Node = rootNodes.find(n => n.id === o2Id)
  check('list.relatedFlag', o1Node.related === true && o2Node.children.length === 0,
    `o1.related=${o1Node?.related}, o2.children=${o2Node?.children.length}`)
  check('list.weightGroupRoot', o1Node.weightGroup === null && o2Node.weightGroup === null, '根目标 weightGroup=null')

  // ===== 3) tree 人类可读：软关联行标「关联」 =====
  const treeText = await run(`tree ${pid}`)
  check('tree.relatedMark', /关联：/.test(treeText) && /软关联，可见不计权重/.test(treeText), treeText.split('\n').slice(0, 6).join(' / '))

  // ===== 4) suggest：只进收件区，okrs 表无新记录（未确认不生效）=====
  const beforeSuggest = [...domain.table('okrs').entries()].length
  const sug = await run(`suggest ${pid} ${JSON.stringify({ title: '建议补一条稳定性验收 KR', kind: 'key-result', primaryOkrId: o1Id, rationale: '三项交付物都围绕稳定性验收' })}`)
  const sugId = /(okrsug-[a-zA-Z0-9_-]+)/.exec(sug)[1]
  const afterSuggest = [...domain.table('okrs').entries()].length
  check('suggest.noRecord', afterSuggest === beforeSuggest, `okrs rows ${beforeSuggest}→${afterSuggest}（未确认不生效）`)
  const inboxRows = [...(domain.table('settings').get('pmOkrInbox')?.value?.entries ?? [])]
  check('suggest.inbox', inboxRows.length === 1 && inboxRows[0].status === 'pending', `inbox=${inboxRows.length}`)

  // ===== 5) inbox 列待确认 → confirm 创建 draft 记录 + 建议已处理 =====
  const inboxText = await run(`inbox ${pid}`)
  check('inbox.pending', inboxText.includes(sugId) && /待确认/.test(inboxText), inboxText.split('\n')[1] ?? '')
  const confirmText = await run(`confirm ${sugId}`)
  check('confirm.record', /创建草稿 OKR 记录 okr-/.test(confirmText), confirmText.split('\n')[0])
  const afterConfirm = [...domain.table('okrs').entries()].length
  check('confirm.rowAdded', afterConfirm === beforeSuggest + 1, `okrs rows ${beforeSuggest}→${afterConfirm}`)
  const confirmedSug = inboxRows.length && domain.table('settings').get('pmOkrInbox').value.entries.find(e => e.id === sugId)
  check('confirm.marked', confirmedSug.status === 'confirmed' && !!confirmedSug.confirmedOkrId, `status=${confirmedSug.status}`)
  // confirm 产出的是 draft，不自动定稿
  const newRec = domain.table('okrs').get(confirmedSug.confirmedOkrId)
  check('confirm.draftNoAutoFinal', newRec.status === 'draft', `新记录 status=${newRec.status}`)

  // ===== 6) ignore：建议保留标 ignored，不建记录 =====
  const sug2 = await run(`suggest ${pid} ${JSON.stringify({ title: '可忽略的备选建议', kind: 'objective' })}`)
  const sug2Id = /(okrsug-[a-zA-Z0-9_-]+)/.exec(sug2)[1]
  const beforeIgnore = [...domain.table('okrs').entries()].length
  await run(`ignore ${sug2Id}`)
  const afterIgnore = [...domain.table('okrs').entries()].length
  check('ignore.noRecord', afterIgnore === beforeIgnore, `okrs rows ${beforeIgnore}→${afterIgnore}`)
  const ignoredSug = domain.table('settings').get('pmOkrInbox').value.entries.find(e => e.id === sug2Id)
  check('ignore.retainedMarked', ignoredSug.status === 'ignored', `status=${ignoredSug.status}（保留在收件区）`)

  // ===== 7) inbox clear：清空已处理/已忽略，pending 保留 =====
  // 再造一条 pending，验证 clear 不动它
  const sug3 = await run(`suggest ${pid} ${JSON.stringify({ title: '仍待确认的建议', kind: 'objective' })}`)
  const sug3Id = /(okrsug-[a-zA-Z0-9_-]+)/.exec(sug3)[1]
  const clearText = await run(`inbox ${pid} clear`)
  check('cleared.count', /2 条/.test(clearText), clearText)
  const remaining = domain.table('settings').get('pmOkrInbox').value.entries
  check('clear.pendingKept', remaining.length === 1 && remaining[0].id === sug3Id, `remaining=${remaining.map(e => e.id).join(',')}`)

  // ===== 8) 负例：跨项目/缺失父目标拒绝、未知字段、kind 必填 =====
  // 8a 缺失父目标
  const neg1 = await run(`add ${pid} ${JSON.stringify({ title: '挂不到的KR', kind: 'key-result', primaryOkrId: 'okr-missing' })}`, 'error')
  check('neg.missingParent', /未找到父目标：okr-missing/.test(neg1), neg1)
  // 8b 未知字段拒绝
  const neg2 = await run(`add ${pid} ${JSON.stringify({ title: 't', kind: 'objective', streak: 66, score: 90 })}`, 'error')
  check('neg.unknownField', /不支持的字段/.test(neg2), neg2)
  // 8c kind 必填
  const neg3 = await run(`add ${pid} ${JSON.stringify({ title: '缺类型' })}`, 'error')
  check('neg.kindRequired', /kind|类型/.test(neg3), neg3)
  // 8d 跨项目父目标：先在 p-0002 建目标（本脚本只建了一个项目，用不存在 ID 模拟缺失即可；
  //     同项目存在性正例已在 1b 覆盖，跨项目反例由单测 validateOkrRelations 覆盖）
  const neg4 = await run(`update ${o1Id} ${JSON.stringify({ primaryOkrId: 'okr-cross' })}`, 'error')
  check('neg.updateMissingParent', /未找到父目标：okr-cross/.test(neg4), neg4)

  // ===== 草稿→定稿人定稿：update status=confirmed =====
  const finalText = await run(`update ${o1Id} ${JSON.stringify({ status: 'confirmed' })}`)
  check('humanFinalize', /定稿/.test(finalText), finalText.split('\n')[0])
  const finalized = domain.table('okrs').get(o1Id)
  check('humanFinalize.status', finalized.status === 'confirmed', `status=${finalized.status}`)

  // ===== 9) 落盘核验：真实 JSON 文件 =====
  const okrsDir = join(root, 'pmtool', 'okrs')
  check('disk.okrsDir', existsSync(okrsDir) && readdirSync(okrsDir).length >= 3, `files=${readdirSync(okrsDir).length}`)
  const inboxFile = join(root, 'pmtool', 'settings', 'pmOkrInbox.json')
  check('disk.inbox', existsSync(inboxFile) && readFileSync(inboxFile, 'utf8').includes('仍待确认'), 'pmOkrInbox.json 落盘')
  const sample = readFileSync(join(okrsDir, `${o1Id}.json`), 'utf8')
  check('disk.recordFields', sample.includes('稳定可交付') && sample.includes('"status"'), 'okrs 记录含标题与状态')
} catch (e) {
  check('FATAL', false, e instanceof Error ? e.stack ?? e.message : String(e))
}

const failed = results.filter(r => !r.ok)
console.log(failed.length ? `\nP2B-OKR FAIL (${failed.length}/${results.length})` : `\nP2B-OKR PASS (${results.length}/${results.length})`)
process.exit(failed.length ? 1 : 0)

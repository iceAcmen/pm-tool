// 审签数据完整性与证据指纹；不执行产品、不更新原计划。
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const round = process.argv[2] ?? 'objective-independent-auto-20261021-9dg1J5'
const root = path.join(here, 'objective-independent-auto-20261021-evidence', round)
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'))
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const execution = read('execution.json')
const domain = read('domain-results.json')
const reopen = read('reopen-results.json')
const audit = fs.readFileSync(path.join(root, 'write-audit.ndjson'), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
assert.deepEqual(execution.changes, [])
assert.deepEqual(execution.copyChanges, [])
assert.equal(execution.builtCount, 453)
assert.equal(execution.a3SourceCount, 23)
assert.equal(domain.rows.filter(r => r.status === 'PASS').length, 51)
assert.deepEqual(domain.rows.filter(r => r.status === 'FAIL').map(r => r.id),
  ['OP-SRC-01/SOURCE', 'OP-SRC-05/SOURCE-manual', 'RA-OP04/AUTO-protocol'])
assert.equal(reopen.rows[0].status, 'PASS')
assert.deepEqual(execution.commands.map(c => c.exit), [1, 0, 0])
assert.ok(audit.length > 0)
assert.equal(audit.filter(x => !x.allowed).length, 0)
for (const c of execution.commands) {
  assert.equal(sha(path.join(root, c.id + '.stdout.txt')), c.stdoutSha256)
  assert.equal(sha(path.join(root, c.id + '.stderr.txt')), c.stderrSha256)
}
const before = read('inputs-before.json'), after = read('inputs-after.json')
assert.deepEqual(after, before)
for (const [file, data] of Object.entries(after)) {
  assert.equal(sha(file), data.sha256, `审签时输入仍一致 ${file}`)
}
const fixture = read('f2.json')
const backup = read('f2-backup.json')
assert.deepEqual(backup.tasks, fixture.tasks)
assert.equal(backup.extra.file_assets.length, 0)
const allRows = [...domain.rows, ...reopen.rows]
const original = fs.readFileSync(path.join(here, 'objective-progress-acceptance.md'), 'utf8')
const ids = [...new Set([...original.matchAll(/\|\s*(OP-[A-Z]+-\d{2})\s*\|/g)].map(m => m[1]))]
const replacements = {
  'OP-DEFER-01': ['RA-OP01', 'RA-OP02'],
  'OP-DEFER-02': ['RA-OP04/AUTO-fields', 'OP-RU-01'],
  'OP-DEFER-03': ['RA-OP04'],
  'OP-DEFER-04': ['OP-CK-01', 'RA-OP05'],
}
const missing = {
  'OP-SRC-06': '四页真实GUI原证待Main',
  'OP-BD-05': '正式根本轮禁止读取；只签自有写根防护，不替Main正式保护manifest',
  'OP-BD-06': '本轮禁止build/full guard；Main唯一builder另交',
  'OP-GUI-01': '抽屉真勾选、显式提交、四消费点即时回读待Main',
  'OP-GUI-02': '合法旧包真实GUI只浏览/退出零写待Main',
  'OP-GUI-03': '390真实GUI待Main，不自动转MANUAL_PENDING',
}
function matches(id) {
  return allRows.filter(r => r.id === id || r.id.startsWith(id + '/'))
}
const disposition = [...ids, ...Array.from({ length: 6 }, (_, i) => 'RA-OP0' + (i + 1))].map(id => {
  const matched = replacements[id]
    ? replacements[id].flatMap(matches)
    : matches(id)
  const status = matched.some(r => r.status === 'FAIL') ? 'FAIL' :
    matched.length ? 'PASS（仅所列AUTO/源码子项）' :
      ['OP-DEFER-05', 'OP-DEFER-06'].includes(id) ? 'N/A（不新增该域功能）' : 'NOT_RUN'
  return { id, status, evidenceRows: matched.map(r => ({ id: r.id, file: r.id.startsWith('OP-BD-01/')
    ? 'reopen-results.json' : 'domain-results.json', start: r.start, end: r.end,
    actionStart: r.actionStart, actionEnd: r.actionEnd })),
    remaining: missing[id] ?? (id === 'OP-BD-01' ? 'Node进程重开已测；真实dsh宿主停起原PID链待Main' :
      /^RA-OP0[1-5]$/.test(id) ? 'GUI表单/取消/四消费点尚未审签；AUTO FAIL仍阻塞对应项' :
        '仅覆盖证据行的断言；任何GUI/布局/浏览器认证不在本签字范围') }
})
fs.writeFileSync(path.join(root, 'case-disposition.json'), JSON.stringify(disposition, null, 2) + '\n')
fs.writeFileSync(path.join(root, 'case-disposition.md'),
  '# OP 原 ID 独立子项签字索引\n\n> 只签本轮执行的断言；不回填原计划、不扩大GUI或整域通过。详见同级 JSON 的时间段/动作索引。\n\n'
  + '| 原精确 ID | 有限结果 | 实际证据行 | 最小边界 |\n| --- | --- | --- | --- |\n'
  + disposition.map(r => `| ${r.id} | ${r.status} | ${r.evidenceRows.map(e => e.id).join('；') || '无'} | ${r.remaining} |`).join('\n') + '\n')
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? files(path.join(dir, e.name)) : e.isFile() ? [path.join(dir, e.name)] : [])
}
const index = Object.fromEntries(files(root).filter(f => !f.endsWith('/sha256-index.json'))
  .map(f => [path.relative(root, f), { sha256: sha(f), size: fs.statSync(f).size }]))
const result = { round, independentPassSubitems: 52, independentFailSubitems: 3,
  originalIds: ids.length, supplementalIds: 6, inputCount: Object.keys(before).length,
  unchangedInputs: true, writeAuditOperations: audit.length, outsideOwnWrites: 0,
  fixture: fixture.expected, evidenceFileCount: Object.keys(index).length + (index['audit-result.json'] ? 0 : 1),
  scope: 'AUTO/领域及源码有限审签；非OP整门PASS' }
fs.writeFileSync(path.join(root, 'audit-result.json'), JSON.stringify(result, null, 2) + '\n')
index['audit-result.json'] = { sha256: sha(path.join(root, 'audit-result.json')),
  size: fs.statSync(path.join(root, 'audit-result.json')).size }
fs.writeFileSync(path.join(root, 'sha256-index.json'), JSON.stringify(index, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))

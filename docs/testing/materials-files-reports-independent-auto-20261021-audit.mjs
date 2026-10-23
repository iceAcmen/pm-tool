// 只汇总已执行原始断言/源指纹；不从verify计数推导逐ID通过。
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'materials-files-reports-independent-auto-20261021'
const archive = path.resolve(process.argv[2])
const read = name => JSON.parse(fs.readFileSync(path.join(archive, name), 'utf8'))
const sha = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const source = read('candidate.json')
const rows = [...read('results.json'), ...read('reopen-results.json')]
const components = read('component-results.json').testResults.flatMap(f => f.assertionResults).map(r => ({
  id: r.fullName.match(/RA-[FMR]\d{2}\/[^\s:]+/)?.[0]
    ?? r.fullName.match(/RA-[FMR]\d{2}/)?.[0] + '/component-safe-render',
  name: r.fullName, status: r.status === 'passed' ? 'PASS' : 'FAIL', failureMessages: r.failureMessages,
}))
const rootRows = fs.existsSync(path.join(archive, 'root-results.json'))
  ? read('root-results.json').testResults.flatMap(f => f.assertionResults).filter(r => /RA-F03\//.test(r.fullName)).map(r => ({
    id: r.fullName.match(/RA-F03\/[^\s:]+/)?.[0], name: r.fullName,
    status: r.status === 'passed' ? 'PASS' : 'FAIL', failureMessages: r.failureMessages,
    sourceKind: r.fullName.includes('old-parent-counterexample') ? '旧冻结函数反例，非当前安全PASS' : '当前生产TS直接调用',
  })) : []
const domainInputs = ['core/tasks.ts', 'core/task.ts', 'core/task-materials.ts', 'core/storage.ts',
  'core/projects.ts', 'core/project.ts', 'core/deliverables.ts', 'core/deliverable.ts']
const groups = {
  M: [...domainInputs, 'commands/task.ts', 'commands/material.ts', 'commands/progress.ts',
    'core/check.ts', 'core/archive.ts', 'core/review-materials.ts', 'core/export.ts'],
  F: [...domainInputs, 'core/file-assets.ts', 'core/file-staging.ts', 'core/file-asset-store.ts',
    'core/file-backup.ts', 'core/backup.ts', 'core/http/asset-route.ts',
    'client/shared/task-draft-materials.tsx', 'client/shared/b2-ops.ts',
    'client/shared/stage-client.ts', 'client/shared/staged-lifecycle.ts'],
  R: [...domainInputs, 'core/progress-report.ts', 'core/progress-reports.ts', 'core/progress-report-markdown.ts',
    'commands/progress-report.ts', 'core/export.ts'],
  J: [...domainInputs, 'core/file-assets.ts', 'core/file-staging.ts', 'core/file-asset-store.ts',
    'core/backup.ts', 'commands/backup.ts', 'core/progress-reports.ts'],
}
const extra = {
  'RA-M04': ['人工更新最新未自动执行，保留GUI精确动作，不以源升级不变替代'],
  'RA-F02': ['react-test-renderer StrictMode包装不执行浏览器严格双effect；真实DOM双effect未验'],
  'RA-F08': ['历史tag源码自有core输出+当前依赖，不是原发布二进制；pilot为localStorage，未实际GUI开关'],
  'RA-R05': ['Web/plain为项目出口，非固定report出口；原单三出口同report语义待Main核有效合同'],
  'RA-J03': ['完整GUI取消/保留/放弃与一次主保存旅程未验'],
  'RA-J04': ['完整GUI历史revision选择/编辑/导出旅程未验'],
  'RA-J06': ['GUI危险二次确认与重进未验；含files的restore-content单独先红'],
}
const ids = [...Array.from({ length: 7 }, (_, i) => 'RA-M' + String(i + 1).padStart(2, '0')),
  ...Array.from({ length: 8 }, (_, i) => 'RA-F' + String(i + 1).padStart(2, '0')),
  ...Array.from({ length: 5 }, (_, i) => 'RA-R' + String(i + 1).padStart(2, '0')), 'RA-J03', 'RA-J04', 'RA-J06']
const current = {}
for (const names of Object.values(groups)) for (const f of names) {
  const file = path.join(repo, 'packages/dsh-pm-tool/src', f)
  current[f] = fs.existsSync(file) ? sha(file) : null
}
const map = ids.map(id => {
  const direct = [...rows, ...components, ...rootRows].filter(r => r.id?.startsWith(id + '/'))
  const linked = id === 'RA-J03' ? ['RA-M01', 'RA-M02', 'RA-M06', 'RA-F01', 'RA-F02']
    : id === 'RA-J04' ? ['RA-M01', 'RA-M03', 'RA-R01', 'RA-R02', 'RA-R03', 'RA-R04', 'RA-R05']
      : id === 'RA-J06' ? ['RA-F06', 'RA-F07'] : []
  const affected = groups[id[3]].filter(f => source.source[f] !== current[f]).map(f => ({
    file: f, frozen: source.source[f] ?? null, current: current[f],
  }))
  return { id, auto: { status: direct.some(r => r.status === 'FAIL') ? 'FAIL' : direct.length ? 'PASS' : 'NOT_RUN',
    scope: '仅列出的独立已执行断言', assertions: direct, linkedNotSubstitutedForWholeJourney: linked },
  gui: { status: ['RA-M05', 'RA-F03', 'RA-F08'].includes(id) ? 'NOT_APPLICABLE' : 'NOT_RUN',
    owner: 'Main', scope: '本专家未操作GUI，须原候选/实际动作证据' },
  unexecutedOrContractBoundary: extra[id] ?? [],
  candidateStatus: affected.length ? '受影响漂移，不签当前候选；只保冻结事实' : '所列domain依赖未漂移，仅签冻结AUTO断言',
  changedDependencies: affected, wholeId: 'NOT_RUN/FAIL，非整项PASS' }
})
const audit = fs.existsSync(path.join(archive, 'write-audit.ndjson'))
  ? fs.readFileSync(path.join(archive, 'write-audit.ndjson'), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : []
const output = {
  at: new Date().toISOString(), archive, baselineCommit: source.baselineCommit, head: source.head,
  candidateSha256: sha(path.join(archive, 'candidate.json')), commands: read('commands.json'),
  results: { domain: rows.reduce((o, r) => ({ ...o, [r.status]: (o[r.status] ?? 0) + 1 }), {}),
    component: components.reduce((o, r) => ({ ...o, [r.status]: (o[r.status] ?? 0) + 1 }), {}),
    rootSource: rootRows.reduce((o, r) => ({ ...o, [r.status]: (o[r.status] ?? 0) + 1 }), {}) },
  ids: map, sourceFingerprint: { frozen: source.source, currentSelected: current,
    beforeAfterDrift: read('execution.json').sourceDrift, ownFacilities: source.ownFacilities },
  writeGuard: { observedOperations: audit.length, denied: audit.filter(r => !r.allowed),
    scope: 'Node preload函数审计，非OS sandbox/全盘；Vitest fork覆盖不得无依据扩大' },
}
const out = path.join(repo, 'docs/testing', prefix + '-id-map.json')
fs.writeFileSync(out, JSON.stringify(output, null, 2) + '\n')
console.log(JSON.stringify({ out, counts: output.results, ids: map.map(m => ({ id: m.id, AUTO: m.auto.status,
  GUI: m.gui.status, changed: m.changedDependencies.map(d => d.file) })), guard: output.writeGuard }, null, 2))

/**
 * verify-isolation guard 的纯 fixture 测试（不匹配 verify-*.mjs 自动发现，不会被 guard 当子进程跑）。
 *
 * 目的：用临时目录证明「当被守护 root（模拟仓库 exports/）发生 新增/内容变化/删除、
 * 或一个原本缺失的 root 突然出现/消失」时，guard 复用的同一套 buildManifest+diff 必然
 * 判定 FAIL（diff 非空）；而零变化时必然 PASS（diff 为空）。
 *
 * 硬性约束：
 *   - 全程只在 os.tmpdir() 下 mkdtemp() 里造 fixture，finally 里 rmSync 清掉；
 *   - 绝不读写真实仓库 data/ / packages/backups/ / exports/ 下任何现有文件；
 *   - 只对 verify-isolation.mjs 导出的纯函数做断言，不 spawn 任何 verify 子进程；
 *   - 不把真实 exports/ 是否存在当硬断言——干净克隆下它可能缺失，缺目录兼容由
 *     tmp fixture 的 MISSING 用例独立证明，真实磁盘存在与否只作只读提示。
 *
 * 运行：node scripts/test-isolation-guard.mjs   （退出码 0 = 全部断言通过）
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync,
} from 'node:fs'
import { tmpdir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const PKG = join(here, '..')
const REPO = join(PKG, '..', '..')

const guard = await import('./verify-isolation.mjs')
const { WATCH, buildManifest, diff } = guard

let failures = 0
function check(cond, label) {
  if (cond) {
    console.log('  ok  - ' + label)
  } else {
    failures++
    console.error('  FAIL - ' + label)
  }
}

// ---- 0) 结构性断言：WATCH 确实把「仓库 exports/ 默认输出根」纳入守护 ----
// 注意：只断言「WATCH 配置包含哪些 root」，绝不断言这些 root 在磁盘上一定存在——
//   干净克隆下 exports/ / packages/backup/ 可能尚未生成，缺目录本就是兼容态，
//   其存在性由下面 tmp fixture 的 MISSING 用例独立证明，不在这里硬卡真实磁盘。
console.log('[test] 0) WATCH 结构断言：')
const expectedExports = join(REPO, 'exports')
check(WATCH.includes(expectedExports), `WATCH 包含仓库 exports 默认输出根：${expectedExports}`)
check(WATCH.some(r => r.endsWith('/data')), 'WATCH 仍包含仓库 data/')
check(WATCH.some(r => r.endsWith('/packages/backups')), 'WATCH 仍包含 packages/backups/')
check(WATCH.some(r => r.endsWith('/packages/backup')), 'WATCH 仍包含兼容历史 packages/backup/')
check(WATCH.some(r => r.endsWith('/assets')), 'WATCH 守护 F2 builtin-dev 仓库 assets/ 根')
// 真实 exports 的存在与否仅作提示，不作为断言（存在/缺失都不影响 PASS/FAIL）。
const realExportsExists = existsSync(expectedExports)
console.log(`  note - 真实 exports/ 当前${realExportsExists ? '存在' : '不存在（缺目录视为空，兼容态）'}：${expectedExports}（只读提示，不参与断言）`)

// ---- 1) 搭一个临时 fixture，完整复刻 WATCH 的四种 root 形态 ----
const fixture = mkdtempSync(join(tmpdir(), 'isolation-guard-fixture-'))
try {
  const fData = join(fixture, 'data')
  const fBackups = join(fixture, 'packages', 'backups')
  const fMissing = join(fixture, 'packages', 'backup') // 故意不创建 → 模拟「缺失视为空」
  const fExports = join(fixture, 'exports')
  mkdirSync(fData, { recursive: true })
  mkdirSync(fBackups, { recursive: true })
  mkdirSync(fExports, { recursive: true })

  writeFileSync(join(fData, 'workspace.json'), '{"v":1}')
  writeFileSync(join(fBackups, 'b-0001.tar'), 'backup-bytes')
  writeFileSync(join(fExports, 'p-0001-report.md'), '# 初始报告 v1\n')

  const roots = [fData, fBackups, fMissing, fExports]

  console.log('\n[test] 1) 零变化应 PASS（diff 为空）：')
  {
    const before = buildManifest(roots)
    const after = buildManifest(roots)
    const changes = diff(before, after)
    check(changes.length === 0, '连续两次 manifest 无文件变动时 diff 为空')
    check(before.has(fMissing + '|!!MISSING'), '缺失 root 被记为 <root>|!!MISSING')
  }

  console.log('\n[test] 2) exports 新增文件应被检测为「新增」：')
  {
    const before = buildManifest(roots)
    writeFileSync(join(fExports, 'p-0002-report.md'), '# 新报告\n')
    const after = buildManifest(roots)
    const changes = diff(before, after)
    check(changes.some(c => c.startsWith('新增') && c.includes('p-0002-report.md')),
      'exports 新增 p-0002-report.md 被判定为「新增」')
    check(changes.some(c => c.includes(fExports)), '变化 key 挂在 exports root 下')
  }

  console.log('\n[test] 3) exports 已存在文件被改写（hash+mtime 变）应被检测为「内容变化」：')
  {
    const before = buildManifest(roots)
    writeFileSync(join(fExports, 'p-0001-report.md'), '# 被污染的报告 v2\n')
    const after = buildManifest(roots)
    const changes = diff(before, after)
    check(changes.some(c => c.startsWith('内容变化') && c.includes('p-0001-report.md')),
      'exports/p-0001-report.md 内容被改写后判定为「内容变化」（hash/mtime 任一变都漏不掉）')
  }

  console.log('\n[test] 4) exports 删除文件应被检测为「删除」：')
  {
    const before = buildManifest(roots)
    rmSync(join(fExports, 'p-0002-report.md'))
    const after = buildManifest(roots)
    const changes = diff(before, after)
    check(changes.some(c => c.startsWith('删除') && c.includes('p-0002-report.md')),
      'exports/p-0002-report.md 被删除后判定为「删除」')
  }

  console.log('\n[test] 5) 原本缺失的 root 从「不存在」变成「出现文件」必须被检测：')
  {
    const before = buildManifest(roots)
    check(before.has(fMissing + '|!!MISSING'), '变化前 fMissing 记为 MISSING')
    mkdirSync(fMissing, { recursive: true })
    writeFileSync(join(fMissing, 'legacy.tar'), 'legacy-bytes')
    const after = buildManifest(roots)
    const changes = diff(before, after)
    check(!after.has(fMissing + '|!!MISSING'), '变化后 fMissing 不再是 MISSING')
    check(changes.some(c => c.startsWith('新增') && c.includes('legacy.tar')),
      '原本缺失 root 突然出现文件被判定为「新增」（缺目录兼容不会漏报后续污染）')
  }

  console.log('\n[test] 6) 反向：一个有文件的 root 被整体删掉 → 应检测出全部文件「删除」：')
  {
    const before = buildManifest(roots)
    rmSync(fBackups, { recursive: true, force: true })
    const after = buildManifest(roots)
    const changes = diff(before, after)
    check(after.has(fBackups + '|!!MISSING'), 'fBackups 被删后记为 MISSING')
    check(changes.some(c => c.startsWith('删除') && c.includes('b-0001.tar')),
      'fBackups 整体消失后其历史文件被判定为「删除」')
  }
} finally {
  rmSync(fixture, { recursive: true, force: true })
}

console.log('\n[test] fixture 已清理：' + (failures === 0 ? 'PASS（guard 对 exports/ 的增改删及缺目录语义均能正确判定）' : 'FAIL'))
if (failures) {
  console.error(`\n[test] 共 ${failures} 条断言失败`)
  process.exit(1)
}

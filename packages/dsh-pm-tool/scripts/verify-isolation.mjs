/**
 * 外层防污染 guard（ADL-verify-isolation）。
 *
 * 目的：证明「跑一批 verify-*.mjs 写脚本」前后，以下正式资产的 hash+mtime 清单
 *   零变化——绝不把测试隔离缺陷漏到正式数据 / 共享备份 / 用户 home / 正式导出：
 *     - 产品仓库 data/                  （正式业务 JSON，0700）
 *     - 仓库 packages/backups/         （defaultBackupDirectory() 真实落点，历史 ~81 个备份）
 *     - 仓库 packages/backup/            （兼容历史目录；缺失视为空）
 *     - 仓库 exports/                    （defaultExportDirectory() 默认输出根，报告导出落点）
 *
 * 做法（不复制正式内容、不依赖各脚本自觉）：
 *   1) 运行前对上述正式 root 逐文件算 sha256 + mtimeMs，得到 before manifest；
 *   2) 逐个 spawn `node <target>`，子进程 env 被显式 scrub：
 *        - 删除 PM_DATA_ROOT / DSH_PM_BACKUP_DIR（防止误指到正式目录）
 *        - 其余继承 PATH/HOME 等系统环境，脚本默认落系统 os.tmpdir() 一次性目录；
 *   3) 任一子进程非零退出 -> 立即报告并以非零退出（不继续跑后面的）；
 *   4) 全部跑完后再算一次 after manifest，与 before 做集合 diff：
 *        - 新增 / 删除 / hash 变 / mtime 变 任一出现 -> 退出 1 并打印 diff；
 *        - 完全一致 -> 打印「正式清单零变化」并退出 0。
 *
 * 用法：
 *   node scripts/verify-isolation.mjs                          # 默认跑全部 verify-*.mjs
 *   node scripts/verify-isolation.mjs scripts/verify-command.mjs scripts/verify-storage.mjs
 *   PM_TOOL_ISOLATION_KEEP=1                                   # 保留子进程产出的临时目录（调试用）
 *
 * 导出：walk / buildManifest / diff / WATCH 被本模块导出，供纯 fixture 测试
 *   scripts/test-isolation-guard.mjs 复用同一套 hash+mtime 语义，避免另写一份不一致的判定。
 *
 * 边界诚实声明：本 guard 只守护仓库内正式 data/backups/exports；它不启动 dsh、不加载
 * 宿主 profile，因此不会写 ~/.dsh。若未来某个 verify 脚本开始隐式读宿主 profile，需在本
 * guard 的 WATCH 集合里追加相应路径。
 */

import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const PKG = join(here, '..')                 // packages/dsh-pm-tool
const REPO = join(PKG, '..', '..')          // pm-tool 仓库根

// --- 正式受守护资产清单（只增不改；缺目录视为空，不算污染）---
// 注意1：产品 BUILTIN_DEFAULT = new URL('../../../backups/', lib/core/backup.js)
// 从 lib/core 上三级解析到「仓库 packages/backups/」（非包内 dsh-pm-tool/backups），
// 这才是 defaultBackupDirectory() 真实落点（历史 ~81 个备份）。
// 注意2：defaultExportDirectory = new URL('../../../../exports/', lib/core/export.ts)
// 从 lib/core 上四级解析到「仓库 exports/」，这是报告导出的默认输出根。
export const WATCH = [
  join(REPO, 'data'),
  join(REPO, 'packages', 'backups'),
  join(REPO, 'packages', 'backup'),
  join(REPO, 'exports'),
]

// --- 子进程 env scrub：禁止任何「正式目录覆盖」变量穿透到被守护脚本 ---
// 安全：只打印被剔除的变量名，绝不打印其值（可能含 secret 路径 / token）。
function scrubbedEnv() {
  const env = { ...process.env }
  for (const k of ['PM_DATA_ROOT', 'DSH_PM_BACKUP_DIR']) {
    if (k in env) {
      console.log(`[guard] 子进程 env 已剔除 ${k}（防止误指正式目录；不打印其值）`)
      delete env[k]
    }
  }
  return env
}

// --- manifest：逐文件 sha256 + mtimeMs，缺 root 记为 MISSING ---
export function walk(dir, out, prefix) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    const full = join(dir, e.name)
    const rel = prefix ? prefix + '/' + e.name : e.name
    if (e.isDirectory()) walk(full, out, rel)
    else if (e.isFile()) {
      let st
      try { st = statSync(full) } catch { continue }
      let h = ''
      try { h = createHash('sha256').update(readFileSync(full)).digest('hex') } catch {}
      out.push(rel + '\t' + h + '\t' + st.mtimeMs)
    }
  }
}

// 对给定 roots 集合算 manifest；root 不存在时记为 '<root>|!!MISSING'，
// 这样「缺目录」与「从未变化但始终缺失」语义稳定，既兼容历史 backup 兼容目录，
// 也兼容 exports 尚未生成任何报告的初始状态。
export function buildManifest(roots) {
  const map = new Map()   // key = rootAbs + '|' + rel  ->  "hash\tmtime"
  for (const root of roots) {
    if (!existsSync(root)) { map.set(root + '|!!MISSING', ''); continue }
    const out = []
    walk(root, out, '')
    for (const line of out) {
      const tab = line.indexOf('\t')
      const rel = line.slice(0, tab)
      map.set(root + '|' + rel, line.slice(tab + 1))
    }
  }
  return map
}

// 默认受正式 WATCH 的 manifest（guard 主流程用）。
function manifest() { return buildManifest(WATCH) }

export function diff(before, after) {
  const changes = []
  for (const [k, v] of after) {
    if (!before.has(k)) changes.push('新增    ' + k)
    else if (before.get(k) !== v) changes.push('内容变化 ' + k + '\n        before=' + before.get(k) + '\n        after =' + v)
  }
  for (const [k] of before) {
    if (!after.has(k)) changes.push('删除    ' + k)
  }
  return changes
}

// --- 目标脚本清单：默认全部 verify-*.mjs；否则用 argv 显式指定 ---
function pickTargets() {
  let targets = process.argv.slice(2)
  if (targets.length === 0) {
    const all = readdirSync(here).filter(f => f.startsWith('verify-') && f.endsWith('.mjs'))
    // 跳过 guard 自身，避免递归
    .filter(f => f !== 'verify-isolation.mjs')
    .sort()
    targets = all.map(f => join('scripts', f))
  }
  return targets
}

async function main() {
  const targets = pickTargets()
  const os = await import('node:os')

  console.log('[guard] 受守护正式资产：')
  for (const r of WATCH) console.log('  - ' + r + (existsSync(r) ? '' : '  (缺失，视为空)'))
  console.log('[guard] 待跑脚本数 = ' + targets.length)
  console.log('[guard] 系统临时目录 os.tmpdir() = ' + os.tmpdir())

  const before = manifest()
  console.log('[guard] before manifest 文件数 = ' + before.size)

  const failures = []
  for (const t of targets) {
    const abs = join(here, '..', t)
    console.log('\n[guard] >> ' + t)
    const r = spawnSync(process.execPath, [abs], {
      cwd: PKG,
      env: scrubbedEnv(),
      encoding: 'utf8',
    })
    if (r.stdout) process.stdout.write(r.stdout)
    if (r.stderr) process.stderr.write(r.stderr)
    if (r.status !== 0) {
      failures.push(t + ' 退出码=' + r.status)
      console.error('[guard] !! ' + t + ' 非零退出，立即中止后续脚本')
      break
    }
  }

  const after = manifest()
  console.log('\n[guard] after manifest 文件数 = ' + after.size)
  const changes = diff(before, after)

  if (failures.length) {
    console.error('\n[guard] FAIL：子进程非零退出：\n  ' + failures.join('\n  '))
    process.exit(1)
  }
  if (changes.length) {
    console.error('\n[guard] FAIL：正式资产在 verify 运行前后发生变化（hash/mtime/增删）：')
    for (const c of changes) console.error('  ' + c)
    process.exit(1)
  }
  console.log('\n[guard] PASS：正式 data/共享 backups/exports hash+mtime 清单零变化，共 ' + after.size + ' 个文件未被污染。')
}

// 仅当本文件被 `node scripts/verify-isolation.mjs` 直接执行时才跑 guard；
// 被测试脚本 import 时只导出纯函数，不 spawn 任何 verify 子进程。
const invokedDirectly = (() => {
  if (!process.argv[1]) return false
  try { return import.meta.url === pathToFileURL(process.argv[1]).href }
  catch { return false }
})()
if (invokedDirectly) await main()

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
 * 做法（不复制正式内容、不依赖各脚本自觉；S4-A3 起改为「全部跑完 + 聚合报告」）：
 *   1) 运行前对上述正式 root 逐文件算 sha256 + mtimeMs，得到 before manifest；
 *   2) 逐个 spawn `node <target>`，子进程 env 被显式 scrub：
 *        - 删除 PM_DATA_ROOT / DSH_PM_BACKUP_DIR（防止误指到正式目录）
 *        - 其余继承 PATH/HOME 等系统环境，脚本默认落系统 os.tmpdir() 一次性目录；
 *   3) **任一子进程失败也立即记录、但不中止后续目标**——所有目标跑完后聚合汇总；
 *      每条目标收集：exit status / signal / spawn 异常 / 耗时(ms)；
 *      超时（默认 10min/个，PM_TOOL_ISOLATION_TARGET_TIMEOUT_MS 可调）与 spawn 异常同样计失败；
 *   4) 无论中间是否失败，after manifest 都**无条件**再算一次，与 before 做集合 diff：
 *        - 新增 / 删除 / hash 变 / mtime 变 任一出现 → 资产污染单独计失败；
 *   5) 末尾打印「脚本：共 N，通过 P，失败 F」+ 失败清单 + 资产污染清单；
 *      只要有任一脚本失败 *或* 任一资产污染，进程退出 1；全绿时退出 0 并保留
 *      既有 PASS 行（输出兼容）。
 *
 * 用法：
 *   node scripts/verify-isolation.mjs                          # 默认跑全部 verify-*.mjs
 *   node scripts/verify-isolation.mjs scripts/verify-command.mjs scripts/verify-storage.mjs
 *   PM_TOOL_ISOLATION_KEEP=1                                   # 保留子进程产出的临时目录（调试用）
 *   PM_TOOL_ISOLATION_TARGET_TIMEOUT_MS=120000                 # 单目标超时（默认 600000）
 *
 * 导出：walk / buildManifest / diff / WATCH / runOne / runGuard 被本模块导出，
 *   供纯 fixture 测试 scripts/test-isolation-guard.mjs 与
 *   scripts/test-verify-runner-aggregate.mjs 复用同一套判定，避免另写一份不一致的逻辑。
 *
 * 边界诚实声明：本 guard 只守护仓库内正式 data/backups/exports；它不启动 dsh、不加载
 * 宿主 profile，因此不会写 ~/.dsh。若未来某个 verify 脚本开始隐式读宿主 profile，需在本
 * guard 的 WATCH 集合里追加相应路径。
 */

import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, isAbsolute } from 'node:path'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const PKG = join(here, '..')                 // packages/dsh-pm-tool
const REPO = join(PKG, '..', '..')          // pm-tool 仓库根

// 单目标默认超时：10 分钟。个别 GUI/e2e 脚本可能较慢，给足预算；
// 但卡死/死循环必须被这顶帽子兜住并记为失败，不再无限挂起。
const DEFAULT_TIMEOUT_MS = Number(process.env.PM_TOOL_ISOLATION_TARGET_TIMEOUT_MS) || 10 * 60 * 1000

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
  // F2 builtin-dev 回退根（仅 test/dev 信号可达）；测试不得把内容寻址字节落进仓库。
  join(REPO, 'assets'),
]

// --- 子进程 env scrub：禁止任何「正式目录覆盖」变量穿透到被守护脚本 ---
// 安全：只打印被剔除的变量名，绝不打印其值（可能含 secret 路径 / token）。
function scrubbedEnv() {
  const env = { ...process.env }
  for (const k of [
    'PM_DATA_ROOT',
    'DSH_PM_BACKUP_DIR',
    'DSH_PM_FILE_ROOT',
    'DSH_PM_ISOLATED_ROOT',
    'DSH_HOME',
    'DSH_DEV',
  ]) {
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
    // 真实网络 smoke（非 mock：真实出网 + 外部免费网关 + 依赖模型当次输出，天然非确定性，
    // 实测 POC 链路偶发不吐约定 JSON/清单）不纳入「离线、确定性」隔离门，否则门会无规律变红。
    // 离线确定性逻辑已由 verify-model-route.mjs / verify-ai-client.mjs 覆盖。
    // 该 smoke 仍可手动运行：node scripts/verify-real-model.mjs，
    // 或经显式 argv 纳入：node scripts/verify-isolation.mjs scripts/verify-real-model.mjs。
    .filter(f => f !== 'verify-real-model.mjs')
    .sort()
    targets = all.map(f => join('scripts', f))
  }
  return targets
}

// 目标路径解析：argv 给相对路径就相对包根解析；给绝对路径（测试/调试用）原样采用。
function resolveTarget(t) {
  return isAbsolute(t) ? t : join(here, '..', t)
}

// 把单条失败原因翻成一行人类可读串。
// 分类顺序（S4 审查补丁，重要）：
//   spawnSync 超时在本 Node 上同时给 error.code='ETIMEDOUT'、error.killed=undefined、signal='SIGTERM'，
//   因此必须先认 ETIMEDOUT / killed 这个「超时」元数据，再退到其它 spawn 异常，最后才是裸 signal。
//   否则超时会被 signal 分支抢标成「被信号终止」，或被 error 分支误标「spawn 异常」。
export function describeFailure(r) {
  const ms = `${(r.durationMs || 0).toFixed(0)}ms`
  const timedOut = r.error && (r.error.code === 'ETIMEDOUT' || r.error.killed === true)
  if (timedOut) {
    const cap = r.timeoutMs ? `上限 ${r.timeoutMs}ms，实际 ${ms}` : `实际 ${ms}`
    return `超时（${cap}）`
  }
  if (r.error) return `spawn 异常（${r.error.code || r.error.message}，${ms}）`
  if (r.signal) return `被信号终止（signal=${r.signal}，${ms}）`
  return `退出码=${r.status}（${ms}）`
}

// --- 跑单个子目标，收集 exit/signal/异常/耗时；任何坏结果都不抛、只记在记录里 ---
export function runOne(abs, { cwd, env, timeoutMs }) {
  const started = process.hrtime.bigint()
  let r
  try {
    r = spawnSync(process.execPath, [abs], {
      cwd, env, encoding: 'utf8',
      timeout: timeoutMs,
      maxBuffer: 16 * 1024 * 1024,
    })
  } catch (e) {
    // spawn 本身抛错（极罕见，如 execPath 不存在）——按「进程异常=失败」兜住。
    r = { status: null, signal: null, error: e, stdout: '', stderr: '' }
  }
  const durationMs = Number(process.hrtime.bigint() - started) / 1e6
  const rec = {
    abs,
    status: r.status == null ? null : r.status,
    signal: r.signal || null,
    error: r.error || null,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
    durationMs,
    timeoutMs,
  }
  rec.ok = rec.status === 0 && rec.signal == null && !rec.error
  return rec
}

/**
 * 可注入的子 runner：跑完全部 targets，**不因首个失败而中断**，最后与 after manifest 一起返回。
 * 不做任何 process.exit、不直接写终端（日志交给 onStart/onResult 钩子），方便测试注入假 root/假脚本。
 *
 * @param {object}   opts
 * @param {string[]} opts.targets   脚本路径（相对包根或绝对均可）
 * @param {string[]} [opts.roots]  受守护 root 集合，默认正式 WATCH
 * @param {string}   [opts.cwd]    子进程 cwd，默认包根
 * @param {number}   [opts.timeoutMs] 单目标超时，默认 DEFAULT_TIMEOUT_MS
 * @param {object}   [opts.env]    子进程 env，默认 scrubbedEnv()
 * @param {(t:string,abs:string)=>void} [opts.onStart]
 * @param {(rec:object)=>void}          [opts.onResult]
 */
export function runGuard({
  targets, roots = WATCH, cwd = PKG,
  timeoutMs = DEFAULT_TIMEOUT_MS, env = scrubbedEnv(),
  onStart = () => {}, onResult = () => {},
}) {
  const before = buildManifest(roots)
  const results = []
  for (const t of targets) {
    const abs = resolveTarget(t)
    onStart(t, abs)
    const rec = runOne(abs, { cwd, env, timeoutMs })
    rec.name = t
    onResult(rec)
    results.push(rec)   // 关键：失败也 push 后继续循环，绝不 break
  }
  const after = buildManifest(roots)   // 无条件再算一次（即使全部目标都失败）
  const changes = diff(before, after)
  return { results, changes, beforeSize: before.size, afterSize: after.size }
}

async function main() {
  const targets = pickTargets()
  const os = await import('node:os')

  console.log('[guard] 受守护正式资产：')
  for (const r of WATCH) console.log('  - ' + r + (existsSync(r) ? '' : '  (缺失，视为空)'))
  console.log('[guard] 待跑脚本数 = ' + targets.length)
  console.log('[guard] 系统临时目录 os.tmpdir() = ' + os.tmpdir())

  const { results, changes, beforeSize, afterSize } = runGuard({
    targets,
    roots: WATCH,
    cwd: PKG,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    env: scrubbedEnv(),
    onStart: (t) => console.log('\n[guard] >> ' + t),
    onResult: (rec) => {
      if (rec.stdout) process.stdout.write(rec.stdout)
      if (rec.stderr) process.stderr.write(rec.stderr)
      console.log(`[guard]   ${rec.ok ? 'ok  ' : 'FAIL'} ${rec.name} (${describeFailure(rec)})`)
    },
  })

  console.log('\n[guard] after manifest 文件数 = ' + afterSize)

  const failed = results.filter(r => !r.ok)
  const passed = results.length - failed.length
  console.log('[guard] ========== 汇总 ==========')
  console.log(`[guard] 脚本：共 ${results.length}，通过 ${passed}，失败 ${failed.length}`)
  console.log(`[guard] 资产：before=${beforeSize} after=${afterSize}，污染 ${changes.length}`)

  if (failed.length) {
    console.error('[guard] 失败清单：')
    for (const r of failed) console.error('  - ' + r.name + '  ' + describeFailure(r))
  }
  if (changes.length) {
    console.error('[guard] FAIL：正式资产在 verify 运行前后发生变化（hash/mtime/增删）：')
    for (const c of changes) console.error('  ' + c)
  }
  if (failed.length || changes.length) {
    process.exit(1)
  }
  console.log('\n[guard] PASS：正式 data/共享 backups/exports hash+mtime 清单零变化，共 ' + afterSize + ' 个文件未被污染。')
}

// 仅当本文件被 `node scripts/verify-isolation.mjs` 直接执行时才跑 guard；
// 被测试脚本 import 时只导出纯函数，不 spawn 任何 verify 子进程。
const invokedDirectly = (() => {
  if (!process.argv[1]) return false
  try { return import.meta.url === pathToFileURL(process.argv[1]).href }
  catch { return false }
})()
if (invokedDirectly) await main()

/**
 * verify-isolation runner 聚合报告的可注入 / 子 runner 测试（TDD, S4-A3）。
 *
 * 目的：在 os.tmpdir() 下造「假子脚本 + 假受守护 root」，证明 runner 重写后的四条铁律：
 *   A) 第一个子脚本失败后，后续目标**仍然跑完**（不再 break 中止）；
 *   B) 多个失败被**汇总**，且按 退出码 / 信号 / 超时 / spawn异常 正确分类；
 *   C) 子脚本全部 exit 0 但污染了受守护资产 → **资产污染单独计为失败**（与退出码无关）；
 *   D) 真实 CLI（node scripts/verify-isolation.mjs <假目标...>）：
 *        - 有失败时最终 exit 非零，且 stdout/stderr 打出 N过/M失败 + 失败清单；
 *        - 全成功时 exit 0，且保留既有 PASS 行（输出兼容）。
 *
 * 硬性约束：
 *   - 全程只在 tmpdir 下 mkdtemp() 里造 fixture；假子脚本也写在 tmp；
 *   - 唯一一次触碰真实 WATCH 是 D 的 CLI 端到端（before/after manifest 只读 diff，
 *     假子脚本绝不写真实 data/backups/exports）；
 *   - 不 import 任何业务代码，不 spawn 真实 verify-*.mjs；
 *   - 文件名以 test- 开头，不会被 guard 的 verify-*.mjs 自动发现递归跑。
 *
 * 运行：node scripts/test-verify-runner-aggregate.mjs   （退出码 0 = 全部断言通过）
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  mkdtempSync, mkdirSync, writeFileSync, rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const PKG = join(here, '..')

const guard = await import('./verify-isolation.mjs')
const { runGuard, buildManifest, diff, describeFailure } = guard

let failures = 0
function check(cond, label) {
  if (cond) console.log('  ok  - ' + label)
  else { failures++; console.error('  FAIL - ' + label) }
}

// ---- 搭临时 fixture：假受守护 root + 假子脚本目录 ----
const root = mkdtempSync(join(tmpdir(), 'verify-runner-agg-'))
const fData = join(root, 'data')
const fBackups = join(root, 'packages', 'backups')
const fExports = join(root, 'exports')
mkdirSync(fData, { recursive: true })
mkdirSync(fBackups, { recursive: true })
mkdirSync(fExports, { recursive: true })
writeFileSync(join(fData, 'workspace.json'), '{"v":1}')
writeFileSync(join(fBackups, 'b-1.tar'), 'bak')
const watched = [fData, fBackups, fExports]

const kids = join(root, 'kids')
mkdirSync(kids, { recursive: true })
function kid(name, body) {
  const p = join(kids, name)
  writeFileSync(p, body)
  return p
}
const ok1 = kid('ok1.mjs', `console.log('ok1-stdout'); console.error('ok1-stderr')\n`)
const ok2 = kid('ok2.mjs', `console.log('ok2')\n`)
const failExit = kid('fail-exit.mjs', `console.error('boom-exit'); process.exit(3)\n`)
const failExit2 = kid('fail-exit-2.mjs', `process.exit(7)\n`)
const bySignal = kid('sig.mjs', `process.kill(process.pid, 'SIGKILL')\n`)
const hang = kid('hang.mjs', `setTimeout(()=>{ console.log('never'); }, 60000)\n`)
const pollute = kid('pollute.mjs', `
import { writeFileSync, mkdirSync } from 'node:fs'
const r = process.env.POLLUTE_ROOT
mkdirSync(r, { recursive: true })
writeFileSync(r + '/evil-' + process.pid + '.txt', 'polluted')
console.log('pollute-wrote-to', r)
`)

const quietEnv = { PATH: process.env.PATH, HOME: process.env.HOME, POLLUTE_ROOT: fExports }

try {
  // ============ A) 首个失败后后续仍运行 ============
  console.log('\n[test] A) 首个失败后后续目标仍运行（不 break）：')
  {
    const r = runGuard({
      targets: [ok1, failExit, ok2],
      roots: watched, cwd: PKG, timeoutMs: 5000, env: quietEnv,
    })
    check(r.results.length === 3, `三个目标全部跑完（results.length=${r.results.length}，而非在第一个失败处中断）`)
    check(r.results[0].ok === true, '第 1 个（ok1）通过')
    check(r.results[1].ok === false && r.results[1].status === 3, '第 2 个（fail-exit）以退出码 3 失败被记录')
    check(r.results[2].ok === true, '第 3 个（ok2）在失败之后仍被执行且通过')
  }

  // ============ B) 多个失败汇总 + 分类 ============
  console.log('\n[test] B) 多个失败被汇总并按 exit/signal/超时 分类：')
  {
    const r = runGuard({
      targets: [failExit, failExit2, bySignal, hang],
      roots: watched, cwd: PKG, timeoutMs: 300, env: quietEnv,
    })
    check(r.results.length === 4, '四个失败目标全部跑完')
    const [e1, e2, sig, to] = r.results
    check(e1.ok === false && e1.status === 3 && e1.signal == null, `fail-exit 归类为退出码（status=${e1.status}）`)
    check(e2.ok === false && e2.status === 7, `fail-exit-2 归类为退出码（status=${e2.status}）`)
    check(sig.ok === false && sig.status === null && sig.signal === 'SIGKILL',
      `sig 归类为信号（signal=${sig.signal}, status=${sig.status}）`)
    check(to.ok === false && (to.error?.killed === true || to.signal === 'SIGTERM'),
      `hang 被 300ms 超时杀掉并归类为超时/信号（killed=${!!to.error?.killed}, signal=${to.signal}）`)
    check(r.results.every(x => typeof x.durationMs === 'number' && x.durationMs >= 0),
      '每条结果都收集了耗时 durationMs（>=0 的数值）')
    const failed = r.results.filter(x => !x.ok)
    check(failed.length === 4, `失败计数汇总正确（failed=${failed.length}/4）`)

    // --- 文案精确分类（S4 审查补丁：超时不得被误标为 spawn 异常）---
    console.log('\n[test] B.2) describeFailure 文案精确分类：')
    const toText = describeFailure(to)
    const sigText = describeFailure(sig)
    const e1Text = describeFailure(e1)
    check(toText.includes('超时'), `超时目标文案标为「超时」（实际: ${toText}）`)
    check(!toText.includes('spawn 异常'), '超时文案不得出现「spawn 异常」（实际: ' + toText + '）')
    check(!toText.includes('被信号终止'), '超时文案不得退化为裸「被信号终止」（实际: ' + toText + '）')
    check(sigText.includes('信号'), `SIGKILL 真杀仍标「信号」（实际: ${sigText}）`)
    check(!sigText.includes('超时'), 'SIGKILL 真杀不得误标「超时」（实际: ' + sigText + '）')
    check(e1Text.includes('退出码=3'), `正常失败退出码文案保持（实际: ${e1Text}）`)
  }

  // ============ C) 资产污染单独失败（子脚本全 exit 0） ============
  console.log('\n[test] C) 子脚本全部 exit 0，但污染受守护 root → 单独判失败：')
  {
    const before = buildManifest(watched)
    check(before.size >= 2, '污染前 manifest 非空（' + before.size + ' 项）')
    const r = runGuard({
      targets: [ok1, pollute],
      roots: watched, cwd: PKG, timeoutMs: 5000, env: quietEnv,
    })
    check(r.results.every(x => x.ok === true),
      '两个子脚本自身都 exit 0（pollute 写文件后正常退出）')
    check(r.changes.length > 0, '但 after-vs-before manifest diff 非空（污染被独立检出）')
    check(r.changes.some(c => c.startsWith('新增') && c.includes('evil-')),
      '污染 diff 明确列出 evil-*.txt 为「新增」')
  }

  // ============ D) 真实 CLI 端到端：非零退出 + 成功输出兼容 ============
  console.log('\n[test] D) 真实 CLI 端到端：')
  {
    // D1: 一个失败目标 → 进程 exit 非零，且打印 N过/M失败 与失败清单
    const d1 = spawnSync(process.execPath, [join(here, 'verify-isolation.mjs'), ok1, failExit], {
      cwd: PKG, encoding: 'utf8', timeout: 60000,
    })
    const out1 = (d1.stdout || '') + '\n' + (d1.stderr || '')
    check(d1.status !== 0, `含失败目标时 CLI 最终 exit 非零（实际 exit=${d1.status}）`)
    check(/脚本：共 2，通过 1，失败 1/.test(out1), 'stdout 打印聚合行「脚本：共 2，通过 1，失败 1」')
    check(out1.includes('失败清单'), 'stdout 打印「失败清单」')
    check(out1.includes('fail-exit.mjs'), '失败清单里点名 fail-exit.mjs')

    // D2: 全成功 → exit 0，且既有 PASS 行原样保留
    const d2 = spawnSync(process.execPath, [join(here, 'verify-isolation.mjs'), ok1], {
      cwd: PKG, encoding: 'utf8', timeout: 60000,
    })
    const out2 = (d2.stdout || '') + '\n' + (d2.stderr || '')
    check(d2.status === 0, `全成功时 CLI exit 0（实际 exit=${d2.status}）`)
    check(out2.includes('[guard] PASS：正式 data/共享 backups/exports hash+mtime 清单零变化'),
      '全成功时保留既有 PASS 行（输出兼容）')
  }
} finally {
  rmSync(root, { recursive: true, force: true })
}

console.log('\n[test] fixture 已清理：' + (failures === 0 ? 'PASS（runner 聚合报告四条铁律全部成立）' : 'FAIL'))
if (failures) {
  console.error(`\n[test] 共 ${failures} 条断言失败`)
  process.exit(1)
}

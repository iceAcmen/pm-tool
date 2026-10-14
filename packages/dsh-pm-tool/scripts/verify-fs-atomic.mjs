/**
 * S4-A1 fs-atomic 契约专项（TDD / 契约镜像，零 schema）。
 *
 * 被测对象：本包镜像实现 `atomicWriteFile`（src/core/fs-atomic.ts，构建产物
 *   ../lib/core/fs-atomic.js），它是上游 `@deepseek-ai/dsh-storage-json` 的
 *   `writeAtomic` 发布协议同形镜像，被 src/core/backup.ts 用于备份落盘。
 *
 * 本脚本要钉死的契约（全部在 os.tmpdir() 一次性 mkdtemp 内断言，不碰正式资产）：
 *   A. 临时文件：与目标「同目录」、uuid 唯一、以 `.tmp` 结尾（POSIX 同盘 rename 才原子）。
 *   B. 成功路径：原子替换为新内容；结束后目录里无任何残留 `.tmp`。
 *   C. 调用顺序（POSIX）：写临时文件 → 文件 fsync → rename → 目录 fsync。
 *      通过给 FileHandle.prototype 打探针，在「文件 fsync 时刻」与「目录 fsync 时刻」
 *      各读一次目录快照，证明 rename 恰好发生在这两者之间。
 *   D. rename 之前任何一步失败（write / 文件 fsync / rename 本身）：已有目标内容
 *      与 mtime 纹丝不动，且临时文件被清理、不留残留。
 *   E. rename 成功之后目录 fsync 失败：错误如实向上抛（不假装成功），但最终文件
 *      已是完整新内容（rename 已落定，目录项是否 fsync 不影响文件数据完整性）。
 *   F. mode：产物对 group/other 无任何位（0o600 语义，与 umask 无关）。
 *
 * 可测试性说明（零行为重构）：node:fs/promises 的具名导出（open/rename/rm）在 ESM
 *   下不可重写，但 `FileHandle.prototype` 的 writeFile/sync/close 可打补丁。本脚本
 *   仅替换「探针」，真实实现一行未改：失败注入只在指定的一次 sync/writeFile 上抛错，
 *   rename 失败通过「目标是非空目录 → rename(2) 返回 EISDIR」在真实文件系统上触发。
 *
 * 上游对照（读 node_modules 本地副本，避免网络）：writeAtomic(path,data) 的发布协议为
 *   tmp = dir + '/.' + uuid + '.tmp'；open(tmp,'wx',0o600)；writeFile(utf8)；handle.sync()；
 *   close；rename(tmp,path)；再 open(dir,'r').sync().close()（win32 跳过目录 fsync）；
 *   catch 任意错误 → rm(tmp,{force}) → rethrow。
 *   本包镜像的有意差异（均不破坏契约）：
 *     - tmp 名额外嵌入 basename（'.{basename}.{uuid}.tmp'），便于排障；仍是同目录/唯一/.tmp。
 *     - mode 可经 options 覆盖，默认仍 0o600；上游硬编码 0o600(=384)。
 *     - 清理用 renamed 标志：rename 成功后不再尝试 rm；上游在 catch 里无条件 rm(force)
 *       （rename 后 tmp 已不存在，等价 no-op）。语义等价。
 *
 * 运行：node scripts/verify-fs-atomic.mjs   （退出码 0 = 全部契约断言通过）
 * 兼容：macOS（POSIX，目录可 O_RDONLY open + fsync）。
 */

import assert from 'node:assert/strict'
import {
  mkdtempSync, readdirSync, readFileSync, writeFileSync, mkdirSync,
  statSync, rmSync, existsSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, basename } from 'node:path'
import * as fsp from 'node:fs/promises'
import { atomicWriteFile } from '../lib/core/fs-atomic.js'

// ---- 取到 FileHandle.prototype（node:fs/promises 不导出该类，用一个真实句柄扒原型）----
const probeDir = mkdtempSync(join(tmpdir(), 'fs-atomic-proto-'))
const probeH = await fsp.open(join(probeDir, 'probe'), 'w')
const FHProto = Object.getPrototypeOf(probeH)
await probeH.close()
rmSync(probeDir, { recursive: true, force: true })

const origWriteFile = FHProto.writeFile
const origSync = FHProto.sync

// ---- 探针状态（每个用例前重置）----
let observedDir = ''        // 当前用例目标所在目录（探针据此读目录快照）
let injectMode = 'none'     // 'none' | 'write' | 'fileSync' | 'dirSync'
let syncCount = 0
let events = []             // 有序标记：writeFile / file-sync / dir-sync
let tmpSnapshotAtWrite = [] // writeFile 时刻目录里看到的 .tmp 文件
let seenAtFileSync = null   // 文件 fsync 时刻的 { files, target }
let seenAtDirSync = null    // 目录 fsync 时刻的 { files, target }

function safeRead(p) { try { return readFileSync(p, 'utf8') } catch { return null } }
function dotTmpFiles(dir) { return readdirSync(dir).filter(n => n.endsWith('.tmp')) }

FHProto.writeFile = async function (data, enc) {
  if (injectMode === 'write') {
    const e = new Error('injected write EIO')
    e.code = 'EIO'
    throw e
  }
  tmpSnapshotAtWrite = dotTmpFiles(observedDir)
  events.push('writeFile')
  return origWriteFile.call(this, data, enc)
}

FHProto.sync = async function () {
  syncCount++
  if (syncCount === 1) {
    // 文件 fsync：rename 尚未发生，tmp 应仍在盘上、目标应仍是旧内容。
    seenAtFileSync = { files: readdirSync(observedDir).slice(), target: safeRead(observedTargetPath) }
    events.push('file-sync')
    if (injectMode === 'fileSync') {
      const e = new Error('injected file fsync EIO')
      e.code = 'EIO'
      throw e
    }
  } else if (syncCount === 2) {
    // 目录 fsync：rename 已落定，tmp 应已消失、目标应已是新内容。
    seenAtDirSync = { files: readdirSync(observedDir).slice(), target: safeRead(observedTargetPath) }
    events.push('dir-sync')
    if (injectMode === 'dirSync') {
      const e = new Error('injected dir fsync EIO')
      e.code = 'EIO'
      throw e
    }
  }
  return origSync.call(this)
}

let observedTargetPath = ''

function resetCase(dir, target) {
  observedDir = dir
  observedTargetPath = target
  injectMode = 'none'
  syncCount = 0
  events = []
  tmpSnapshotAtWrite = []
  seenAtFileSync = null
  seenAtDirSync = null
}

let failures = 0
function check(cond, label) {
  if (cond) console.log('  ok  - ' + label)
  else { failures++; console.error('  FAIL - ' + label) }
}

const ROOT = mkdtempSync(join(tmpdir(), 'pm-tool-fs-atomic-'))
try {
  // ============ A/B/C/F：成功路径 ============
  console.log('[case A/B/C/F] 成功原子替换 + tmp 同目录唯一后缀 + 调用顺序 + mode')
  {
    const dir = join(ROOT, 'ok')
    mkdirSync(dir, { recursive: true })
    const target = join(dir, 'data.json')
    writeFileSync(target, 'OLD-V1', { mode: 0o600 })
    resetCase(dir, target)

    await atomicWriteFile(target, 'NEW-V2')

    // A. tmp 同目录 / uuid 唯一 / .tmp 后缀
    check(tmpSnapshotAtWrite.length === 1, `writeFile 时刻目录里恰好出现 1 个临时文件（实见 ${tmpSnapshotAtWrite.length} 个）`)
    const tmpName = tmpSnapshotAtWrite[0]
    check(!!tmpName && tmpName.startsWith('.'), `临时文件为隐藏文件（. 开头）：${tmpName}`)
    check(!!tmpName && tmpName.endsWith('.tmp'), `临时文件以 .tmp 结尾：${tmpName}`)
    check(dirname(join(dir, tmpName)) === dir, '临时文件与目标同目录（同盘 rename 才原子）')

    // C. 调用顺序：writeFile → file-sync → dir-sync
    check(JSON.stringify(events) === JSON.stringify(['writeFile', 'file-sync', 'dir-sync']),
      `POSIX 调用顺序 = writeFile→文件fsync→目录fsync（实见 ${events.join('→')}）`)
    // rename 恰好夹在文件 fsync 与目录 fsync 之间
    check(!!seenAtFileSync && seenAtFileSync.files.includes(tmpName) && seenAtFileSync.target === 'OLD-V1',
      '文件 fsync 时刻：tmp 仍在盘上、目标仍是旧内容（rename 尚未发生）')
    check(!!seenAtDirSync && !seenAtDirSync.files.includes(tmpName) && seenAtDirSync.target === 'NEW-V2',
      '目录 fsync 时刻：tmp 已消失、目标已是新内容（rename 已落定）')

    // B. 成功后目标新内容、无残留 tmp
    check(readFileSync(target, 'utf8') === 'NEW-V2', '成功后目标内容已替换为 NEW-V2')
    check(dotTmpFiles(dir).length === 0, '成功后目录无任何残留 .tmp')

    // F. mode：group/other 零位
    const mode = statSync(target).mode & 0o777
    check((mode & 0o077) === 0, `产物对 group/other 无任何权限位（mode=${mode.toString(8)}）`)

    // A. 唯一性：第二次写的 tmp 名必须不同
    resetCase(dir, target)
    await atomicWriteFile(target, 'NEW-V3')
    const tmpName2 = tmpSnapshotAtWrite[0]
    check(!!tmpName2 && tmpName2 !== tmpName, `两次写的临时文件 uuid 唯一（${tmpName} ≠ ${tmpName2}）`)
    check(dotTmpFiles(dir).length === 0, '第二次成功后仍无残留 .tmp')
  }

  // ============ D1：write 失败 → 目标内容+mtime 不变 ============
  console.log('[case D1] write 阶段失败：目标内容 + mtime 纹丝不动，tmp 被清理')
  {
    const dir = join(ROOT, 'fail-write')
    mkdirSync(dir, { recursive: true })
    const target = join(dir, 'data.json')
    writeFileSync(target, 'OLD-V1', { mode: 0o600 })
    const oldStat = statSync(target)
    resetCase(dir, target)
    injectMode = 'write'

    await assert.rejects(atomicWriteFile(target, 'NEW-V2'), /injected write EIO/)
    check(readFileSync(target, 'utf8') === 'OLD-V1', 'write 失败后目标内容仍为 OLD-V1')
    check(statSync(target).mtimeMs === oldStat.mtimeMs, 'write 失败后目标 mtime 不变')
    check(dotTmpFiles(dir).length === 0, 'write 失败后临时文件已清理、无残留')
  }

  // ============ D2：文件 fsync 失败 → 目标内容+mtime 不变 ============
  console.log('[case D2] 文件 fsync 阶段失败：目标内容 + mtime 纹丝不动，tmp 被清理')
  {
    const dir = join(ROOT, 'fail-fsync')
    mkdirSync(dir, { recursive: true })
    const target = join(dir, 'data.json')
    writeFileSync(target, 'OLD-V1', { mode: 0o600 })
    const oldStat = statSync(target)
    resetCase(dir, target)
    injectMode = 'fileSync'

    await assert.rejects(atomicWriteFile(target, 'NEW-V2'), /injected file fsync EIO/)
    check(readFileSync(target, 'utf8') === 'OLD-V1', '文件 fsync 失败后目标内容仍为 OLD-V1')
    check(statSync(target).mtimeMs === oldStat.mtimeMs, '文件 fsync 失败后目标 mtime 不变')
    check(events.join('→') === 'writeFile→file-sync', '失败点确在文件 fsync（尚未到 rename/目录fsync）')
    check(dotTmpFiles(dir).length === 0, '文件 fsync 失败后临时文件已清理、无残留')
  }

  // ============ D3：rename 失败（目标为非空目录 → EISDIR）→ 目标目录完好 ============
  console.log('[case D3] rename 阶段失败（目标是非空目录）：目标目录内容完好，tmp 被清理')
  {
    const dir = join(ROOT, 'fail-rename')
    mkdirSync(dir, { recursive: true })
    const target = join(dir, 'targetdir') // 目标是一个目录
    mkdirSync(target, { recursive: true })
    writeFileSync(join(target, 'keep.txt'), 'KEEP-ME', { mode: 0o600 })
    resetCase(dir, target)

    await assert.rejects(atomicWriteFile(target, 'NEW-V2'))
    check(readFileSync(join(target, 'keep.txt'), 'utf8') === 'KEEP-ME',
      'rename 失败后目标目录内既有文件原样保留（未被覆盖/清空）')
    check(dotTmpFiles(dir).length === 0, 'rename 失败后临时文件已清理、无残留')
  }

  // ============ E：rename 后目录 fsync 失败 → 错误如实抛 + 最终文件完整 ============
  console.log('[case E] rename 成功后目录 fsync 失败：错误如实向上抛，最终文件已是完整新内容')
  {
    const dir = join(ROOT, 'fail-dirfsync')
    mkdirSync(dir, { recursive: true })
    const target = join(dir, 'data.json')
    writeFileSync(target, 'OLD-V1', { mode: 0o600 })
    resetCase(dir, target)
    injectMode = 'dirSync'

    await assert.rejects(atomicWriteFile(target, 'NEW-V2'), /injected dir fsync EIO/)
    check(readFileSync(target, 'utf8') === 'NEW-V2',
      '目录 fsync 失败后目标文件已是完整新内容（rename 已落定，文件数据完整）')
    check(events.join('→') === 'writeFile→file-sync→dir-sync',
      '失败点确在目录 fsync（rename 已完成：writeFile→文件fsync→目录fsync）')
    check(dotTmpFiles(dir).length === 0, '目录 fsync 失败后无残留 tmp（rename 后 tmp 本就不存在）')
  }

  // ============ A1-02：open(tmp,'wx') 排他创建真实行为闭环 ============
  // 通过 tmpNameFactory 把 tmp 名预测为固定值，预先在同目录放一个同名 tmp，
  // 证明 open(..., 'wx') 在目标已存在时拒绝（EEXIST），而不是截断/覆盖它。
  console.log('[case A1-02] open(tmp,"wx") 排他创建：同名 tmp 预置 → EEXIST、目标不变、按上游契约清理')
  {
    const dir = join(ROOT, 'wx-excl')
    mkdirSync(dir, { recursive: true })
    const target = join(dir, 'data.json')
    writeFileSync(target, 'OLD-V1', { mode: 0o600 })
    const oldStat = statSync(target)

    // 预测 tmp 名并预置一个「别人的」同名 tmp（内容不是我们要写的 NEW-V2）。
    const PRED = '.data.json.deadbeef-0000-4000-8000-000000000000.tmp'
    writeFileSync(join(dir, PRED), 'PRE-PLACED-BYTES', { mode: 0o600 })
    resetCase(dir, target)

    let err
    try {
      await atomicWriteFile(target, 'NEW-V2', { tmpNameFactory: () => PRED })
    } catch (e) { err = e }
    check(!!err && err.code === 'EEXIST', `open(tmp,'wx') 在同名 tmp 已存在时抛 EEXIST（排他创建生效，实见 code=${err?.code}）`)
    check(events.length === 0, 'EEXIST 发生在 open 阶段：writeFile/sync 探针均未触发（未对预置 tmp 做任何写入）')
    check(readFileSync(target, 'utf8') === 'OLD-V1', 'wx 拒绝后目标内容仍为 OLD-V1（未被覆盖）')
    check(statSync(target).mtimeMs === oldStat.mtimeMs, 'wx 拒绝后目标 mtime 不变')
    // 诚实记录：EEXIST 后实现按上游 catch→rm(force) 契约清理该 tmp 路径。
    // 这不是误删目标——目标字节/mtime 纹丝不动；且 uuid 命名下该路径只可能是本方案
    // 的陈旧 tmp，跨进程真实占位概率可忽略。此处如实断言「清理已发生」以钉死契约。
    check(!existsSync(join(dir, PRED)), 'EEXIST 后该 tmp 路径按上游契约被清理（rm force），目录无残留')
    check(readdirSync(dir).join(',') === 'data.json', '目录最终只剩目标文件（无预置 tmp、无新 tmp 残留）')
  }
} finally {
  // 还原原型补丁，避免污染同进程后续用例
  FHProto.writeFile = origWriteFile
  FHProto.sync = origSync
  rmSync(ROOT, { recursive: true, force: true })
}

console.log('\n[upstream 对照] 本包 atomicWriteFile 与上游 writeAtomic 契约一致：')
console.log('  - 同目录隐藏 .tmp（uuid 唯一）→ wx 0o600 → writeFile utf8 → 文件 fsync → close → rename → 目录 fsync')
console.log('  - rename 前失败只清 tmp、绝不碰目标；rename 后目录 fsync 失败如实抛错且文件完整')
console.log('  - A1-02：wx 排他创建真实闭环——同名 tmp 预置时 open 抛 EEXIST、目标字节/mtime 不动，该 tmp 路径按上游契约清理')
console.log('  - 有意差异：tmp 名内嵌 basename（排障）、mode 可覆盖（默认 0o600）、renamed 标志清理（语义等价）')

console.log('\n[fs-atomic] fixture 已清理：' + (failures === 0 ? 'PASS（fs-atomic 发布协议契约全部成立）' : 'FAIL'))
if (failures) {
  console.error(`\n[fs-atomic] 共 ${failures} 条断言失败`)
  process.exit(1)
}

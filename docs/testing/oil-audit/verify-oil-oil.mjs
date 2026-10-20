/**
 * verify-oil-oil.mjs — QA 独立 OilOil vendor 安全/完整性门（只读、离线、确定性、幂等）。
 *
 * 定位：现有 packages/dsh-pm-tool/scripts/verify-external-skills.mjs 硬编码 mattpocock
 * （MIT、仅 .md/.yaml/LICENSE，不扫 oil）。导入方将扩 validator；本脚本是 QA 独立第二门，
 * 不修改产品 validator、不放宽旧 mattpocock PASS、不执行任何 vendored JS、不联网。
 *
 * 校验（oil 显式注册白名单 = 23 个上游文件：22 skill + 1 LICENSE.txt）：
 *   1. manifest schemaVersion=3；source.commit 精确 40-hex 且等于锁定 f32bc2b…；
 *      license.spdx=Apache-2.0；policy 三 true；entrySkillIds=[oiloil-ui-ux-guide]；declaredDependencies=[]。
 *   2. 白名单逐文件对齐：无缺失 / 无额外 / 无路径穿越（..、绝对路径、反斜杠）/ 无 symlink。
 *   3. 每文件 sha256 + bytes 与 manifest 逐位相等；权限 0644、无 +x。
 *   4. 文件类型白名单：.md / .json(仅 evals) / .html(仅预览模板) / LICENSE.txt / manifest.json；
 *      禁 .sh/.py/.js/.mjs/.bin/.exe 等可执行、shebang、eval/new Function/require/远程 fetch 等危险汇。
 *   5. evals.json 为合法 JSON；预览 html 无自动出网（无 fetch/XHR/WebSocket/sendBeacon/document.write）。
 *
 * 用法：
 *   node docs/testing/oil-audit/verify-oil-oil.mjs            # 真实 vendor，PASS=0 / FAIL=1
 *   node docs/testing/oil-audit/verify-oil-oil.mjs --selftest # 临时负例夹具，验证本门能正确拒绝
 */
import { fileURLToPath } from 'node:url'
import {
  existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, lstatSync,
  writeFileSync, symlinkSync, chmodSync,
} from 'node:fs'
import { dirname, join, relative, resolve, normalize, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const REPO = join(here, '..', '..', '..')
const OIL_ROOT = join(REPO, 'vendor', 'agent-skills', 'oil-oil')

const LOCKED_COMMIT = 'f32bc2bd210a6693f86841816a531ab511b258b4'
const EXPECTED_ENTRY = 'oiloil-ui-ux-guide'
const EXPECTED_VENDORED_COUNT = 23 // 22 skill files + 1 LICENSE.txt（manifest.json 不计）
const COMMIT_RE = /^[0-9a-f]{40}$/
const ALLOWED_EXT = new Set(['.md', '.json', '.html'])
const FORBIDDEN_EXT = new Set(['.sh', '.py', '.js', '.mjs', '.ts', '.bin', '.exe', '.cmd', '.bat', '.com', '.so', '.dylib'])
// 非 html 文本里禁止出现的危险代码汇（html 单独用网络汇规则）
const DANGER_IN_TEXT = [
  { id: 'shebang', re: /^#!/m },
  { id: 'eval', re: /\beval\s*\(/ },
  { id: 'new-Function', re: /\bnew\s+Function\s*\(/ },
  { id: 'require', re: /\brequire\s*\(/ },
  { id: 'child-process', re: /\bchild_process\b/ },
]
// 预览 html 禁止的自动出网 / 危险 DOM 汇（静态扫描，绝不执行）
const DANGER_NET = [
  { id: 'fetch', re: /\bfetch\s*\(/ },
  { id: 'XHR', re: /XMLHttpRequest/ },
  { id: 'WebSocket', re: /\bWebSocket\b/ },
  { id: 'sendBeacon', re: /sendBeacon/ },
  { id: 'document-write', re: /document\.write/ },
  { id: 'remote-script-src', re: /<script[^>]+src\s*=\s*["']https?:\/\//i },
]

function sha256(buf) { return createHash('sha256').update(buf).digest('hex') }

function walkFiles(root) {
  const out = []
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name)
      const st = lstatSync(abs)
      if (st.isSymbolicLink()) throw new Error(`SYMLINK_FORBIDDEN: ${relative(root, abs)}`)
      if (st.isDirectory()) walk(abs)
      else out.push({ abs, rel: relative(root, abs) })
    }
  }
  walk(root)
  return out
}

function checkVendor(root) {
  const errors = []
  const notes = []
  const manifestPath = join(root, 'manifest.json')
  if (!existsSync(manifestPath)) return { ok: false, errors: ['MANIFEST_MISSING: manifest.json 不存在'], notes }
  let manifest
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) }
  catch (e) { return { ok: false, errors: [`MANIFEST_JSON: 非法 JSON: ${e.message}`], notes } }

  // 1. 顶层契约
  if (manifest.schemaVersion !== 3) errors.push(`SCHEMA_VERSION: 期望 3，实际=${manifest.schemaVersion}`)
  const src = manifest.source || {}
  if (!COMMIT_RE.test(src.commit || '')) errors.push('SOURCE_COMMIT: commit 非 40-hex')
  else if (src.commit !== LOCKED_COMMIT) errors.push(`SOURCE_COMMIT: 未锁定 f32bc2b…，实际=${src.commit}`)
  const lic = manifest.license || {}
  if (lic.spdx !== 'Apache-2.0') errors.push(`LICENSE_SPDX: 期望 Apache-2.0，实际=${lic.spdx}`)
  const pol = manifest.policy || {}
  for (const k of ['projectRulesPrecedence', 'noInstallerRun', 'noHomeOrGlobalWrites']) {
    if (pol[k] !== true) errors.push(`POLICY_${k}: 必须为 true`)
  }
  const entries = manifest.entrySkillIds || []
  if (entries.length !== 1 || entries[0] !== EXPECTED_ENTRY)
    errors.push(`ENTRY: 期望 [${EXPECTED_ENTRY}]，实际=${JSON.stringify(entries)}`)
  if (Array.isArray(manifest.declaredDependencies) && manifest.declaredDependencies.length !== 0)
    errors.push(`DEPS: 期望 []，实际=${JSON.stringify(manifest.declaredDependencies)}`)

  // 2. 收集声明文件（skills[].files + rootFiles）
  const declared = new Map()
  for (const s of manifest.skills || []) {
    for (const f of s.files || []) declared.set(f.path, f)
  }
  for (const f of manifest.rootFiles || []) declared.set(f.path, f)

  // 路径穿越 / 非法字符
  for (const p of declared.keys()) {
    if (p.includes('..') || p.startsWith('/') || p.includes('\\') || normalize(p) !== p)
      errors.push(`TRAVERSAL: 非法路径 ${p}`)
    const abs = resolve(root, p)
    if (!abs.startsWith(resolve(root) + sep) && abs !== resolve(root, p)) errors.push(`TRAVERSAL: ${p} 越出 root`)
  }

  // 3. 磁盘对齐：无缺失 / 无额外（manifest.json 是注册表本体，不计）
  const disk = walkFiles(root).filter(x => x.rel !== 'manifest.json')
  const diskRels = new Set(disk.map(x => x.rel))
  for (const p of declared.keys()) if (!diskRels.has(p)) errors.push(`MISSING: ${p}`)
  for (const { rel } of disk) if (!declared.has(rel)) errors.push(`EXTRA: 未声明文件 ${rel}`)
  if (declared.size !== EXPECTED_VENDORED_COUNT)
    errors.push(`COUNT: 期望 ${EXPECTED_VENDORED_COUNT} 上游文件，实际声明 ${declared.size}`)

  // 4/5. 逐文件指纹、权限、类型、危险扫描
  for (const { abs, rel } of disk) {
    const st = lstatSync(abs)
    const mode = st.mode & 0o777
    if (mode !== 0o644) errors.push(`PERM: ${rel} 权限 ${oct(mode)}，期望 0644`)
    if (mode & 0o111) errors.push(`EXEC_BIT: ${rel} 带可执行位`)
    const buf = readFileSync(abs)
    const decl = declared.get(rel)
    if (decl) {
      if (sha256(buf) !== decl.sha256) errors.push(`HASH: ${rel} sha256 不匹配`)
      if (buf.length !== decl.bytes) errors.push(`BYTES: ${rel} 声明 ${decl.bytes} 实际 ${buf.length}`)
    }
    const ext = (rel.match(/\.[^.]+$/) || [''])[0].toLowerCase()
    const base = rel.split('/').pop()
    if (FORBIDDEN_EXT.has(ext)) errors.push(`FORBIDDEN_TYPE: ${rel} 可执行/二进制类型 ${ext}`)
    const isLic = base === 'LICENSE.txt'
    if (!ALLOWED_EXT.has(ext) && !isLic && rel !== 'manifest.json')
      errors.push(`FORBIDDEN_TYPE: ${rel} 类型不在白名单`)
    const text = buf.toString('utf8')
    if (ext === '.html') {
      for (const r of DANGER_NET) if (r.re.test(text)) errors.push(`NET_SINK[${r.id}]: ${rel}`)
    } else if (!isLic && rel !== 'manifest.json') {
      for (const r of DANGER_IN_TEXT) if (r.re.test(text)) errors.push(`CODE_SINK[${r.id}]: ${rel}`)
    }
    if (ext === '.json') {
      try { JSON.parse(text) } catch (e) { errors.push(`BAD_JSON: ${rel} ${e.message}`) }
    }
  }

  return { ok: errors.length === 0, errors, notes }
}

function oct(n) { return '0o' + n.toString(8) }

// ---------- 负例 self-test：合成夹具，要求每例都被本门拒绝 ----------
function selfTest() {
  const tmp = mkdtempSync(join(tmpdir(), 'oil-audit-st-'))
  const mk = (tree) => {
    const root = join(tmp, Math.random().toString(36).slice(2))
    mkdirSync(root, { recursive: true })
    for (const [p, content, mode] of Object.entries(tree)) {
      const abs = join(root, p)
      mkdirSync(dirname(abs), { recursive: true })
      writeFileSync(abs, content)
      if (mode !== undefined) chmodSync(abs, mode)
    }
    return root
  }
  const goodManifest = (files) => ({
    schemaVersion: 3,
    source: { commit: LOCKED_COMMIT },
    license: { spdx: 'Apache-2.0' },
    policy: { projectRulesPrecedence: true, noInstallerRun: true, noHomeOrGlobalWrites: true },
    entrySkillIds: [EXPECTED_ENTRY],
    declaredDependencies: [],
    skills: [{ id: EXPECTED_ENTRY, files }],
    rootFiles: [],
  })
  const h = (s) => sha256(Buffer.from(s))
  const cases = []

  // (a) tamper：哈希不符必须 FAIL
  {
    const body = '# doc\n'
    const root = mk({
      'manifest.json': JSON.stringify(goodManifest([{ path: `skills/${EXPECTED_ENTRY}/SKILL.md`, sha256: '0'.repeat(64), bytes: 1 }])),
      [`skills/${EXPECTED_ENTRY}/SKILL.md`]: body,
    })
    cases.push(['tamper-hash', !checkVendor(root).ok])
  }
  // (b) extra file 必须 FAIL
  {
    const body = '# doc\n'
    const root = mk({
      'manifest.json': JSON.stringify(goodManifest([{ path: `skills/${EXPECTED_ENTRY}/SKILL.md`, sha256: h(body), bytes: body.length }])),
      [`skills/${EXPECTED_ENTRY}/SKILL.md`]: body,
      'skills/extra-secret.md': 'x',
    })
    cases.push(['extra-file', !checkVendor(root).ok])
  }
  // (c) path traversal 声明必须 FAIL
  {
    const root = mk({
      'manifest.json': JSON.stringify(goodManifest([{ path: `../../etc/passwd`, sha256: '0'.repeat(64), bytes: 0 }])),
    })
    cases.push(['traversal', !checkVendor(root).ok])
  }
  // (d) exec-bit / 可执行脚本必须 FAIL
  {
    const body = '#!/bin/sh\necho hi\n'
    const root = mk({
      'manifest.json': JSON.stringify(goodManifest([{ path: 'run.sh', sha256: h(body), bytes: body.length }])),
      'run.sh': body,
    })
    cases.push(['exec-shebang', !checkVendor(root).ok])
  }
  // (e) policy=false 必须 FAIL
  {
    const body = '# doc\n'
    const m = goodManifest([{ path: `skills/${EXPECTED_ENTRY}/SKILL.md`, sha256: h(body), bytes: body.length }])
    m.policy.noInstallerRun = false
    const root = mk({
      'manifest.json': JSON.stringify(m),
      [`skills/${EXPECTED_ENTRY}/SKILL.md`]: body,
    })
    cases.push(['policy-false', !checkVendor(root).ok])
  }
  // (f) html 含 fetch 自动出网必须 FAIL
  {
    const body = '<script>fetch("https://x")</script>'
    const root = mk({
      'manifest.json': JSON.stringify(goodManifest([{ path: 'refs/t.html', sha256: h(body), bytes: body.length }])),
      'refs/t.html': body,
    })
    cases.push(['html-fetch', !checkVendor(root).ok])
  }

  let all = true
  for (const [name, rejected] of cases) {
    const ok = rejected
    if (!ok) all = false
    console.log(`  [selftest] ${ok ? 'PASS' : 'FAIL'} ${name}`)
  }
  return all
}

const isSelftest = process.argv.includes('--selftest')
if (isSelftest) {
  const passed = selfTest()
  console.log(passed ? '\n[selftest] ALL NEGATIVE CASES REJECTED' : '\n[selftest] FAILURE: 某负例未被拒绝')
  process.exit(passed ? 0 : 1)
}

const res = checkVendor(OIL_ROOT)
console.log('[verify-oil-oil] 只读/离线/确定性；不执行 vendored JS、不联网、不改写文件')
if (res.ok) {
  console.log('[verify-oil-oil] PASS  oil 白名单 23 文件，哈希/bytes/权限/类型/政策全一致，无越界/出网/可执行')
  process.exit(0)
} else {
  console.log('[verify-oil-oil] FAIL')
  for (const e of res.errors) console.log('  - ' + e)
  process.exit(1)
}

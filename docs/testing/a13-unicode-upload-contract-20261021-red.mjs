// 独立白盒：执行生产 stageAsset，只构造原生 Headers/Request，绝不调用网络 fetch。
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')
const prefix = 'a13-unicode-upload-contract-20261021'
const clientPath = 'packages/dsh-pm-tool/src/client/shared/stage-client.ts'
const sourcePaths = [
  clientPath,
  'packages/dsh-pm-tool/src/client/shared/stage-client.test.ts',
  'packages/dsh-pm-tool/src/core/http/asset-route.ts',
  'packages/dsh-pm-tool/src/core/http/asset-route.test.ts',
  'packages/dsh-pm-tool/src/core/file-assets.ts',
  'packages/dsh-pm-tool/src/core/http/limits.ts',
]
const evidenceRoot = 'reports/all-pending-evidence-20261021/A11'
const originalPaths = [
  `${evidenceRoot}/candidate.json`,
  `${evidenceRoot}/product-tracked.patch`,
  `${evidenceRoot}/environment.json`,
  ...['chooser-selected.png', 'unicode-upload-failure.json', 'unicode-upload-failure.png',
    'before-open.json', 'failure-boundary.json'].map(p => `${evidenceRoot}/materials/native-files/${p}`),
]
function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}
function manifest(paths) {
  return Object.fromEntries(paths.map(p => [p, hash(readFileSync(resolve(root, p)))]))
}
function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}
const before = manifest(sourcePaths)
const originals = manifest(originalPaths)
const originalName = 'QA \u6587\u4ef6 \u539f\u4ef6.md'
const sourceFile = `/private/tmp/pmtool-a11-native-files/${originalName}`
const bytes = readFileSync(sourceFile)
assert.equal(bytes.length, 22)
assert.equal(hash(bytes), '87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a')
const beforeOpen = JSON.parse(readFileSync(resolve(root, `${evidenceRoot}/materials/native-files/before-open.json`)))
const failureBoundary = JSON.parse(readFileSync(resolve(root, `${evidenceRoot}/materials/native-files/failure-boundary.json`)))
const normalizeRoot = entries => Object.fromEntries(Object.entries(entries).map(([k, v]) => [k.replace(/^\/+/, ''), v]))
for (const name of ['data', 'files', 'backups']) {
  assert.deepEqual(normalizeRoot(beforeOpen.roots[name]), normalizeRoot(failureBoundary.roots[name]))
}
const body = new Blob([bytes], { type: 'text/markdown' })
const results = []
function check(id, expected, fn) {
  try {
    fn()
    results.push({ id, expected, result: 'PASS', scope: 'native-constructor-only' })
  } catch (error) {
    results.push({ id, expected, result: 'FAIL', scope: 'native-constructor-only',
      error: { name: error.name, message: error.message } })
  }
}
check('A13-RED-H', '中文 raw header 应可构造 Headers（当前必红）', () => {
  new Headers({ 'x-pm-file-name': originalName })
})
check('A13-RED-R', '中文 raw header 应可构造 Request（当前必红）', () => {
  new Request('https://a13-no-network.invalid/api/pm/v1/assets/upload', {
    method: 'POST', headers: { 'x-pm-file-name': originalName }, body,
  })
})
check('A13-CONTROL-ASCII', '旧 ASCII header 原生 Headers/Request 构造成功', () => {
  const headers = new Headers({ 'x-pm-file-name': 'qa-note.md' })
  const request = new Request('https://a13-no-network.invalid/upload', { method: 'POST', headers, body })
  assert.equal(request.headers.get('x-pm-file-name'), 'qa-note.md')
})
check('A13-PROTOCOL-FEASIBILITY', '仅协议可行性，不是产品修复 PASS', () => {
  for (const name of [originalName, '100% + #?.md', 'literal%2Fname.md', 'qa-note.md']) {
    const wire = encodeURIComponent(name)
    assert.match(wire, /^[\x20-\x7e]*$/)
    const headers = new Headers({ 'x-pm-file-name': wire, 'x-pm-file-name-encoding': 'uri-component' })
    new Request('https://a13-no-network.invalid/upload', { method: 'POST', headers, body })
    assert.equal(decodeURIComponent(wire), name)
  }
})
const { stageAsset } = await import(pathToFileURL(resolve(root, clientPath)).href)
const nativeFetch = globalThis.fetch
const calls = []
try {
  globalThis.fetch = async (url, init) => {
    const call = { route: url, method: init.method, credentials: init.credentials, cache: init.cache,
      headers: { ...init.headers }, bodyUnchanged: init.body === body, constructorCompleted: false }
    calls.push(call)
    const headers = new Headers(init.headers)
    new Request(new URL(url, 'https://a13-no-network.invalid'), { ...init, headers })
    call.constructorCompleted = true
    // 此信封仅支持客户端映射对照，不代表存在真实 stage 或发过 HTTP。
    return new Response(JSON.stringify({ stageId: 'a'.repeat(32), fileName: originalName,
      mediaType: 'text/markdown', size: bytes.length, sha256: hash(bytes),
      expiresAt: '2026-10-22T00:00:00Z' }), { status: 201 })
  }
  for (const [id, name] of [['A13-RED-PRODUCTION', originalName], ['A13-CONTROL-PRODUCTION-ASCII', 'qa-note.md']]) {
    try {
      await stageAsset({ body, fileName: name, mediaType: 'text/markdown' })
      results.push({ id, expected: '生产 stageAsset 经原生 Headers/Request 构造成功',
        result: 'PASS', scope: 'production-client-with-native-constructor-interceptor' })
    } catch (error) {
      results.push({ id, expected: '生产 stageAsset 经原生 Headers/Request 构造成功',
        result: 'FAIL', scope: 'production-client-with-native-constructor-interceptor',
        error: { name: error.name, reason: error.reason, message: error.message } })
    }
  }
} finally {
  globalThis.fetch = nativeFetch
}
const after = manifest(sourcePaths)
const originalsAfter = manifest(originalPaths)
assert.deepEqual(after, before, '本轮相关源码漂移，结果不得按原候选引用')
assert.deepEqual(originalsAfter, originals, 'A11 原证漂移')
const output = {
  at: new Date().toISOString(), role: 'trae / 独立测试专家 A13',
  environment: { platform: process.platform, arch: process.arch, node: process.version,
    execution: 'Node 原生 TS 源码执行，无输出编译/依赖安装/服务/GUI',
    command: '/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --experimental-transform-types docs/testing/a13-unicode-upload-contract-20261021-red.mjs' },
  candidate: { head: git('rev-parse', 'HEAD'), originMainLocalRef: git('rev-parse', 'origin/main'),
    scope: sourcePaths, trackedDiff: git('diff', 'HEAD', '--', ...sourcePaths),
    scopedUntrackedFiles: git('ls-files', '--others', '--exclude-standard', '--', ...sourcePaths),
    sourceSha256Before: before, sourceSha256After: after,
    a11OriginalSha256Before: originals, a11OriginalSha256After: originalsAfter,
    note: 'HEAD 不代表 dirty 候选；本结果仅绑定所列源码字节及 A11 原证，不认领新 bundle/service。' },
  fixture: { sourceFile, fileName: originalName, size: bytes.length, sha256: hash(bytes),
    a11RecordedRootsEqualAfterLeadingSlashNormalization: true },
  safety: { nativeFetchInvocations: 0, httpSent: false, serversStarted: 0,
    productWrites: 0, guiOperations: 0, fetchRestored: globalThis.fetch === nativeFetch,
    watchScope: '仅相关源码、A11原证指纹；不声称全盘零污染' },
  results, interceptedProductionCalls: calls,
  notRun: ['服务端标记/解码/非法编码测试', '真实 stage/主保存/下载', '新 GUI/宿主认证',
    '构建/全部 verify/修复后独立复验'],
}
writeFileSync(resolve(here, `${prefix}-red.json`), `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify({ results, safety: output.safety,
  evidence: `docs/testing/${prefix}-red.json` }, null, 2))
process.exitCode = results.some(r => r.result === 'FAIL') ? 1 : 0

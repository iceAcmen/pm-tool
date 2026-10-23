import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const name = 'a11-meeting-layout-independent-retest-20261021'
const own = join(root, 'docs/testing', `${name}-selftmp`)
const live = join(root, 'packages/dsh-pm-tool')
const frozen = join(own, 'frozen')
const old = join(own, 'a10-control')
const dep = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool'
const dev = join(root, 'reports/a11-meeting-action-layout-developer-20261021-selftmp')
const require = createRequire(join(dep, 'package.json'))
const vitestRequire = createRequire(require.resolve('vitest/package.json'))
const phase = process.argv[2]
const hash = value => createHash('sha256').update(value).digest('hex')
const fp = path => ({ bytes: statSync(path).size, sha256: hash(readFileSync(path)) })
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
function files(path) {
  return readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry =>
    entry.isDirectory() ? files(join(path, entry.name)) : entry.isFile() ? [join(path, entry.name)] : [])
}
const index = path => Object.fromEntries(files(join(path, 'src')).map(file => [relative(path, file), fp(file)]))
const form = 'src/client/views/records/records-meeting-form.tsx'
const css = 'src/client/views/records.css'
const test = 'src/client/views/records/records-meeting-layout.test.tsx'
const released = {
  [form]: 'd88c9bee1d2571f7ada3551bc8b7b5f1e7c98d7c2417f78a80a06f4766bb9388',
  [css]: '9cc498a0771c109a779b0b2eb073c675ba7f27c46c75a3b4efb9e45f8a984ce6',
  [test]: '6c7a15bc744675af0fda91dcb289366a41491e0f8107bef8c4f7d0ffd6f00344',
}
const original = [
  test, 'src/client/views/records/records-meeting-entry.test.tsx',
  'src/client/shared/records-callbacks.test.ts', 'src/client/views/records/records-payloads.test.ts',
  'src/client/views/records/records-options.test.ts', 'src/client/views/records-entry-guard.test.ts',
  'src/client/form-validation.test.ts',
]
const extra = [
  'src/client/views/records/records-period.test.ts', 'src/client/views/records/records-history.test.ts',
  'src/client/views/records/records-preview.test.ts', 'src/client/views/records/records-preview-authoritative.test.ts',
  'src/client/views/reports-entry-guard.test.ts', 'src/client/shared/report-preview-client.test.ts',
  'src/client/views/visible-layer-contract.test.ts', 'src/client/shared/form-dirty.test.ts',
]
const added = 'src/client/views/records/a11-independent.test.tsx'
function git(args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  return r.stdout
}
function cacheIndex() {
  const roots = [join(dep, 'node_modules/.vite'), join(dep, 'node_modules/.vitest')]
  const entries = {}
  for (const dir of roots) {
    if (!existsSync(dir)) { entries[dir] = null; continue }
    for (const path of files(dir)) entries[path] = { ...fp(path), mtimeMs: statSync(path).mtimeMs }
  }
  return entries
}

if (phase === 'freeze') {
  assert(!existsSync(own), '不覆盖自有既有证据')
  const a10 = json(join(root, 'reports/all-pending-evidence-20261021/A10/candidate.json'))
  for (const [file, sha] of Object.entries(released)) assert.equal(fp(join(live, file)).sha256, sha, file)
  mkdirSync(own, { recursive: true })
  const before = index(live)
  mkdirSync(frozen)
  cpSync(join(live, 'src'), join(frozen, 'src'), { recursive: true })
  for (const file of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']) cpSync(join(live, file), join(frozen, file))
  const copied = index(frozen)
  assert.deepEqual(copied, before, 'freeze期间源漂移')
  assert.deepEqual(index(live), before, 'freeze完成源漂移')
  cpSync(frozen, old, { recursive: true })
  for (const file of [form, css]) {
    const source = join(dev, 'before', file)
    assert.equal(fp(source).sha256, a10.sourceHashes[`packages/dsh-pm-tool/${file}`], '旧源须匹配A10')
    cpSync(source, join(old, file))
  }
  for (const dir of [frozen, old]) {
    symlinkSync(join(dep, 'node_modules'), join(dir, 'node_modules'), 'dir')
    cpSync(join(root, 'docs/testing', `${name}-cases.test.tsx`), join(dir, added))
  }
  const dependencies = {}
  for (const id of ['react', 'react-test-renderer', 'vitest', 'vite', 'typescript']) {
    const path = (id === 'vite' ? vitestRequire : require).resolve(`${id}/package.json`)
    dependencies[id] = { path: realpathSync(path), version: json(path).version, ...fp(path) }
  }
  const baseline = git(['rev-parse', 'HEAD']).trim()
  writeFileSync(join(own, 'scoped-tracked.patch'), git(['diff', '--', ...Object.keys(released).map(f => `packages/dsh-pm-tool/${f}`)]))
  writeJson(join(own, 'source-manifest.json'), copied)
  writeJson(join(own, 'source-live-before.json'), before)
  writeJson(join(own, 'shared-cache-before.json'), cacheIndex())
  writeJson(join(own, 'freeze.json'), {
    time: new Date().toISOString(), baseline, runtime: { node: process.version, platform: process.platform, arch: process.arch },
    frozen, old, dependencies, released: Object.fromEntries(Object.keys(released).map(f => [f, fp(join(frozen, f))])),
    scopedTrackedPatch: fp(join(own, 'scoped-tracked.patch')),
    scopedGitStatus: git(['status', '--short', '--', ...Object.keys(released).map(f => `packages/dsh-pm-tool/${f}`)]),
    oldSource: Object.fromEntries([form, css].map(f => [f, fp(join(old, f))])),
    originalTestIdentical: fp(join(old, test)).sha256 === fp(join(frozen, test)).sha256,
    independentTest: fp(join(frozen, added)),
  })
  console.log(`freeze exit0: ${Object.keys(copied).length} source files; baseline=${baseline}`)
} else if (phase === 'audit') {
  const ts = require('typescript')
  const viteRequire = createRequire(vitestRequire.resolve('vite'))
  const postcss = viteRequire('postcss')
  const before = readFileSync(join(old, form), 'utf8')
  const after = readFileSync(join(frozen, form), 'utf8')
  const marker = '  return (\n    <form'
  assert(before.includes(marker) && after.includes(marker))
  assert.equal(before.slice(0, before.indexOf(marker)), after.slice(0, after.indexOf(marker)), '业务处理增量')
  const tags = new Set(['form', 'fieldset', 'input', 'textarea', 'select', 'option', 'RecordsListbox', 'button'])
  function controls(source) {
    const ast = ts.createSourceFile('form.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const printer = ts.createPrinter({ removeComments: true })
    const result = []
    function visit(node) {
      if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && tags.has(node.tagName.getText(ast))) {
        result.push({ tag: node.tagName.getText(ast), attributes: node.attributes.properties.map(a =>
          printer.printNode(ts.EmitHint.Unspecified, a, ast)) })
      }
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === 'option') {
        result.push({ optionChildren: node.children.map(child => printer.printNode(ts.EmitHint.Unspecified, child, ast).trim()) })
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
    return result
  }
  const priorControls = controls(before)
  assert.deepEqual(controls(after), priorControls, '控件属性/handler/option内容增量')
  function tree(path) { return postcss.parse(readFileSync(path, 'utf8')) }
  const localSelector = s => s.includes('.rb-action') || s.includes('.rb-meeting-actions')
  function unrelated(nodes) {
    return nodes.filter(n => n.type !== 'comment' && !(n.type === 'rule' && localSelector(n.selector))).flatMap(n => {
      if (n.type === 'atrule') {
        const children = unrelated(n.nodes ?? [])
        return children.length ? [{ at: n.name, params: n.params, children }] : []
      }
      if (n.type === 'rule') return [{ selector: n.selector, declarations: n.nodes.filter(d => d.type === 'decl').map(d => [d.prop, d.value, !!d.important]) }]
      return [{ type: n.type, text: n.toString() }]
    })
  }
  assert.deepEqual(unrelated(tree(join(old, css)).nodes), unrelated(tree(join(frozen, css)).nodes), '非action CSS变化')
  const stylesheet = tree(join(frozen, css))
  let scopedRuleCount = 0
  stylesheet.walkRules(rule => {
    if (!localSelector(rule.selector)) return
    scopedRuleCount++
    assert(rule.selector.split(',').every(s => /^\s*\.rb-(action-|meeting-actions)/.test(s)), `越界选择器 ${rule.selector}`)
    rule.walkDecls(d => {
      assert(!(d.prop.startsWith('overflow') && /^(hidden|clip)$/.test(d.value)), '隐藏溢出')
      assert(!(d.prop === 'display' && d.value === 'none'), '隐藏控件')
      assert(!(d.prop === 'visibility' && d.value !== 'visible'), '不可见标签')
      assert(!(d.prop === 'text-overflow' && d.value === 'ellipsis'), '新增截断')
    })
  })
  const containerQueries = []
  stylesheet.walkAtRules('container', rule => {
    assert(/^rb-meeting-actions \(min-width: (24|30)rem\)$/.test(rule.params))
    containerQueries.push(rule.params)
  })
  for (const [file, sha] of Object.entries(released)) assert.equal(fp(join(frozen, file)).sha256, sha)
  const a10 = json(join(root, 'reports/all-pending-evidence-20261021/A10/candidate.json'))
  const source = json(join(own, 'source-manifest.json'))
  const changedFromA10 = Object.entries(source).filter(([f, v]) =>
    a10.sourceHashes[`packages/dsh-pm-tool/${f}`] !== v.sha256).map(([f]) => f)
  writeJson(join(own, 'source-audit.json'), {
    time: new Date().toISOString(), businessPrefixBytes: Buffer.byteLength(after.slice(0, after.indexOf(marker))),
    controlsAndOptionEntries: priorControls.length, controlAstEqual: true, businessPrefixEqual: true,
    unrelatedRecordsCssEqual: true, scopedRuleCount, containerQueries, noNewHiding: true,
    changedFromA10, controlledAttributes: priorControls,
    limits: ['AST/规则存在不等实际GUI布局', '未签原生长菜单/bbox/200%', '其他dirty源码变动不归本缺陷'],
  })
  console.log(`audit exit0: ${priorControls.length} AST entries equal; ${scopedRuleCount} local rules`)
} else if (['old-layout', 'original-r1', 'original-r2', 'extra', 'independent-r1', 'independent-r2', 'finish'].includes(phase)) {
  if (phase === 'finish') {
    const manifest = json(join(own, 'source-manifest.json'))
    const tested = index(frozen)
    delete tested[added]
    assert.deepEqual(tested, manifest, '被测源码漂移')
    const current = index(live)
    const liveDrift = [...new Set([...Object.keys(manifest), ...Object.keys(current)])].filter(f =>
      JSON.stringify(manifest[f]) !== JSON.stringify(current[f]))
    const caches = cacheIndex()
    assert.deepEqual(caches, json(join(own, 'shared-cache-before.json')), '共享依赖缓存变更')
    for (const [file, sha] of Object.entries(released)) assert.equal(fp(join(live, file)).sha256, sha, '限定源变化')
    const commands = ['old-layout', 'original-r1', 'original-r2', 'extra', 'independent-r1', 'independent-r2'].map(p => json(join(own, `${p}.json`)))
    assert(commands.every(c => c.exit === (c.phase === 'old-layout' ? 1 : 0)), '复验退出码')
    writeJson(join(own, 'final-audit.json'), { time: new Date().toISOString(), frozenSourceDrift: [],
      liveDrift, sharedCacheDrift: [], releasedUnchanged: true, commands,
      sourceAudit: fp(join(own, 'source-audit.json')), limitations: ['只watch两个依赖缓存根，不声称全机零污染', '未产品build/GUI/服务/commit'] })
    console.log(`finish exit0: frozen drift0; live drift${liveDrift.length}; shared cache drift0`)
  } else {
    assert(!existsSync(join(own, `${phase}.json`)), '不覆盖原证')
    const cwd = phase === 'old-layout' ? old : frozen
    const selected = phase === 'old-layout' ? [test] : phase.startsWith('original') ? original :
      phase === 'extra' ? extra : [added]
    const runtime = join(own, phase)
    mkdirSync(join(runtime, 'tmp'), { recursive: true })
    mkdirSync(join(runtime, 'home'))
    const config = join(runtime, 'vitest.config.mjs')
    writeFileSync(config, `export default ${JSON.stringify({ cacheDir: join(runtime, 'vite'), test: {
      environment: 'node', include: ['src/**/*.test.ts', 'src/**/*.test.tsx'], cache: false, coverage: { enabled: false },
    } })}\n`)
    const argv = [require.resolve('vitest/vitest.mjs'), 'run', ...selected, '--config', config,
      '--maxWorkers=1', '--minWorkers=1', '--no-cache', '--reporter=default', '--reporter=json', '--outputFile', join(runtime, 'vitest.json')]
    const env = { PATH: process.env.PATH, HOME: join(runtime, 'home'), TMPDIR: join(runtime, 'tmp'),
      TMP: join(runtime, 'tmp'), TEMP: join(runtime, 'tmp'), XDG_CACHE_HOME: join(runtime, 'xdg'),
      NODE_DISABLE_COMPILE_CACHE: '1', CI: 'true', TZ: 'UTC' }
    const start = new Date().toISOString()
    const result = spawnSync(process.execPath, argv, { cwd, env, encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024 })
    writeFileSync(join(runtime, 'stdout.log'), result.stdout ?? '')
    writeFileSync(join(runtime, 'stderr.log'), result.stderr ?? '')
    const report = existsSync(join(runtime, 'vitest.json')) ? json(join(runtime, 'vitest.json')) : null
    writeJson(join(own, `${phase}.json`), { phase, start, end: new Date().toISOString(), command: process.execPath,
      argv, cwd, env, exit: result.status, signal: result.signal, error: result.error?.message ?? null,
      tests: report ? { total: report.numTotalTests, passed: report.numPassedTests, failed: report.numFailedTests,
        pending: report.numPendingTests } : null, source: Object.fromEntries([form, css, test, added].map(f => [f, fp(join(cwd, f))])),
      logs: { stdout: fp(join(runtime, 'stdout.log')), stderr: fp(join(runtime, 'stderr.log')) } })
    process.stdout.write(`${phase}: exit=${result.status}\n${result.stdout ?? ''}${result.stderr ?? ''}`)
    process.exitCode = result.status ?? 2
  }
} else throw new Error('phase: freeze|audit|old-layout|original-r1|original-r2|extra|independent-r1|independent-r2|finish')

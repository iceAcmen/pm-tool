import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

// Independent diagnosis only. Transpile in memory; never load a product entry/server.
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const owned = '/tmp/pmtool-reopen-handshake-diagnosis-20261021.uOtK7e'
const round = process.argv[2]
assert.match(round ?? '', /^r[1-9]\d*$/)
const root = join(owned, round)
mkdirSync(root, { recursive: false })
process.env.TMPDIR = process.env.TMP = process.env.TEMP = root
const require = createRequire(join(repo, 'packages/dsh-pm-tool/package.json'))
const ts = require('typescript')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const sources = [
  'packages/dsh-pm-tool/src/client/launch-handshake.ts',
  'packages/dsh-pm-tool/src/client/panel.tsx',
  'packages/dsh-pm-tool/src/client/index.tsx',
  'packages/dsh-pm-tool/src/client/launch-handshake.test.ts',
]
const before = Object.fromEntries(sources.map(path => [path, sha(readFileSync(join(repo, path)))]))
for (const path of sources) copyFileSync(join(repo, path), join(root, path.split('/').at(-1)))
const bridge = readFileSync(join(root, 'launch-handshake.ts'), 'utf8')
const emit = module => ts.transpileModule(bridge, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module },
}).outputText
const production = await import(`data:text/javascript;base64,${Buffer.from(emit(ts.ModuleKind.ES2022)).toString('base64')}`)
const { createLaunchHandshakeRetrier, armLaunchHandshake } = production
const startedAt = new Date().toISOString()
const tests = []

function fixture(initial = '#pm-launch=18345.N1', respond = async () => ({ ok: true })) {
  let hash = initial
  const calls = []
  const clears = []
  const deps = {
    getHash: () => hash,
    replaceState: cleaned => { clears.push(cleaned); hash = cleaned },
    fetchImpl: async (url, init) => {
      calls.push({ url, method: init.method, credentials: init.credentials, body: JSON.parse(init.body) })
      return respond()
    },
  }
  return { deps, calls, clears, get hash() { return hash }, set hash(next) { hash = next } }
}
function deferred() {
  let resolve
  const promise = new Promise(r => { resolve = r })
  return { promise, resolve }
}
async function check(id, contract, fn) {
  let actual
  try {
    actual = await fn()
    tests.push({ id, contract, status: 'PASS', actual })
  } catch (error) {
    tests.push({
      id, contract, status: 'FAIL',
      actual: error.actual,
      expected: error.expected,
      message: error.message,
    })
  }
}

await check('R01', '首次N1回告且只在成功后清hash，omit且body仅nonce', async () => {
  const f = fixture()
  assert.equal(await createLaunchHandshakeRetrier(f.deps).reportReady(), true)
  assert.equal(f.hash, '')
  assert.deepEqual(f.calls, [{
    url: 'http://127.0.0.1:18345/api/entered', method: 'POST',
    credentials: 'omit', body: { nonce: 'N1' },
  }])
  return { calls: f.calls, hash: f.hash }
})
await check('R02', '同token在途合并，成功后重复ready不重复发', async () => {
  const d = deferred()
  const f = fixture(undefined, () => d.promise)
  const r = createLaunchHandshakeRetrier(f.deps)
  const a = r.reportReady()
  const b = r.reportReady()
  assert.equal(a, b)
  d.resolve({ ok: true })
  await a
  await r.reportReady()
  assert.equal(f.calls.length, 1)
  return { count: f.calls.length }
})
await check('R03', '失败保hash，下次成功ready可重试', async () => {
  let count = 0
  const f = fixture(undefined, async () => ({ ok: ++count > 1 }))
  const r = createLaunchHandshakeRetrier(f.deps)
  assert.equal(await r.reportReady(), false)
  assert.equal(f.hash, '#pm-launch=18345.N1')
  assert.equal(await r.reportReady(), true)
  assert.equal(f.calls.length, 2)
  assert.equal(f.hash, '')
  return { count: f.calls.length }
})
await check('R04', '无token不发，后续新token正常发', async () => {
  const f = fixture('#/projects')
  const r = createLaunchHandshakeRetrier(f.deps)
  assert.equal(await r.reportReady(), false)
  assert.equal(f.calls.length, 0)
  f.hash = '#/projects&pm-launch=18345.N1'
  assert.equal(await r.reportReady(), true)
  assert.equal(f.hash, '#/projects')
  return { count: f.calls.length, hash: f.hash }
})
await check('R05', '同实例N1成功后换N2，ready必须发N2而非借N1成功', async () => {
  const f = fixture()
  const r = createLaunchHandshakeRetrier(f.deps)
  await r.reportReady()
  f.hash = '#pm-launch=18345.N2'
  const returned = await r.reportReady()
  assert.deepEqual({ returned, nonces: f.calls.map(c => c.body.nonce), hash: f.hash },
    { returned: true, nonces: ['N1', 'N2'], hash: '' })
})
await check('R06', 'token身份包含port，相同合成nonce换port仍需发', async () => {
  const f = fixture()
  const r = createLaunchHandshakeRetrier(f.deps)
  await r.reportReady()
  f.hash = '#pm-launch=18346.N1'
  await r.reportReady()
  assert.deepEqual(f.calls.map(c => c.url), [
    'http://127.0.0.1:18345/api/entered', 'http://127.0.0.1:18346/api/entered',
  ])
})
await check('R07', '旧N1在途后URL变N2，旧成功不得清N2', async () => {
  const d = deferred()
  const f = fixture(undefined, () => d.promise)
  const p = armLaunchHandshake(f.deps)
  f.hash = '#/projects&pm-launch=18345.N2'
  d.resolve({ ok: true })
  await p
  assert.deepEqual({ hash: f.hash, clears: f.clears, nonces: f.calls.map(c => c.body.nonce) },
    { hash: '#/projects&pm-launch=18345.N2', clears: [], nonces: ['N1'] })
})
await check('R08', '跨token在途ready不能借旧Promise成功，最终必须发N2', async () => {
  const d = deferred()
  const f = fixture(undefined, () => d.promise)
  const r = createLaunchHandshakeRetrier(f.deps)
  const n1 = r.reportReady()
  f.hash = '#pm-launch=18345.N2'
  const n2 = r.reportReady()
  const samePromise = n1 === n2
  d.resolve({ ok: true })
  await n1
  await n2
  await r.reportReady()
  assert.deepEqual({ samePromise, nonces: f.calls.map(c => c.body.nonce) },
    { samePromise: false, nonces: ['N1', 'N2'] })
})
await check('R09', '新实例在N2的反证：能够发送而非终身记忆N1', async () => {
  const f = fixture()
  await createLaunchHandshakeRetrier(f.deps).reportReady()
  f.hash = '#pm-launch=18345.N2'
  await createLaunchHandshakeRetrier(f.deps).reportReady()
  assert.deepEqual(f.calls.map(c => c.body.nonce), ['N1', 'N2'])
  assert.equal(f.hash, '')
  return { nonces: f.calls.map(c => c.body.nonce) }
})
await check('R10', '旧在途失败不清新N2，后续成功ready发新N2', async () => {
  const d = deferred()
  let first = true
  const f = fixture(undefined, () => {
    if (first) { first = false; return d.promise }
    return Promise.resolve({ ok: true })
  })
  const r = createLaunchHandshakeRetrier(f.deps)
  const n1 = r.reportReady()
  f.hash = '#pm-launch=18345.N2'
  d.resolve({ ok: false })
  assert.equal(await n1, false)
  assert.equal(f.hash, '#pm-launch=18345.N2')
  assert.equal(await r.reportReady(), true)
  assert.deepEqual(f.calls.map(c => c.body.nonce), ['N1', 'N2'])
  return { nonces: f.calls.map(c => c.body.nonce) }
})

const panel = readFileSync(join(root, 'panel.tsx'), 'utf8')
const ast = ts.createSourceFile('panel.tsx', panel, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const facts = { statements: [], hashListeners: [] }
function walk(node) {
  const text = node.getText(ast)
  if (
    ts.isVariableDeclaration(node) && ['launchHandshakeRef', 'refresh'].includes(node.name.getText(ast)) ||
    ts.isIfStatement(node) && text.startsWith("if (!launchHandshakeRef.current") ||
    ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect' && text.includes('void refresh()')
  ) {
    facts.statements.push({
      line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, text,
    })
  }
  if (ts.isCallExpression(node) && node.expression.getText(ast).endsWith('.addEventListener') &&
      node.arguments[0]?.getText(ast).includes('hashchange')) {
    facts.hashListeners.push(text)
  }
  ts.forEachChild(node, walk)
}
walk(ast)
writeFileSync(join(root, 'panel-ast.json'), JSON.stringify(facts, null, 2) + '\n')

let dom
let browser
if (process.argv.includes('--pure')) {
  dom = { status: 'NOT_RUN', reason: '--pure runs correct-behavior repair tests without the old-symptom DOM diagnostic.' }
} else {
try {
  const puppeteer = require('puppeteer-core')
  const fixturePath = join(root, 'fixture.html')
  const script = `const exports = {};\n${emit(ts.ModuleKind.CommonJS)}
    window.calls = [];
    window.instanceStarted = performance.timeOrigin;
    window.hashEvents = 0;
    window.addEventListener('hashchange', () => { window.hashEvents++ });
    const r = exports.createLaunchHandshakeRetrier({
      getHash: () => location.hash,
      replaceState: h => history.replaceState(null, '', exports.buildLaunchHistoryUrl(location.pathname, location.search, h)),
      fetchImpl: async (url, init) => {
        window.calls.push({url, ...JSON.parse(init.body)});
        return {ok: true};
      }
    });
    window.report = () => r.reportReady();
    document.querySelector('button').onclick = async () => {
      const result = await window.report();
      document.querySelector('output').textContent = JSON.stringify({result, calls: window.calls, hash: location.hash});
    };`
  writeFileSync(fixturePath, `<!doctype html><meta charset="utf-8"><title>Owned bridge fixture</title>
    <button>Ready</button><output></output><script>${script}</script>`)
  browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, userDataDir: join(root, 'chrome-profile'),
    env: { ...process.env, TMPDIR: root, TMP: root, TEMP: root },
    args: ['--disable-background-networking', '--disable-component-update', '--no-first-run', '--no-default-browser-check'],
  })
  const pid = browser.process().pid
  writeFileSync(join(root, 'chrome-pid.json'), JSON.stringify({ pid, at: new Date().toISOString() }) + '\n')
  const page = await browser.newPage()
  const errors = []
  const blockedRequests = []
  page.on('pageerror', e => errors.push(e.message))
  await page.setRequestInterception(true)
  page.on('request', request => {
    if (request.url().startsWith(pathToFileURL(root).href + '/')) void request.continue()
    else { blockedRequests.push(request.url().split('#')[0]); void request.abort() }
  })
  const url = pathToFileURL(fixturePath).href
  const snapshot = label => page.evaluate(label => ({
    label, timeOrigin: window.instanceStarted, hash: location.hash,
    hashEvents: window.hashEvents, calls: window.calls,
  }), label)
  await page.goto(`${url}#pm-launch=18345.N1`, { waitUntil: 'load' })
  await page.click('button')
  await page.waitForFunction(() => document.querySelector('output').textContent !== '')
  const first = await snapshot('N1-ready')
  await page.goto(`${url}#pm-launch=18345.N2`)
  await page.waitForFunction(() => location.hash.endsWith('.N2') && window.hashEvents >= 1)
  const hashOnly = await snapshot('N2-hash-only')
  await page.click('button')
  await page.waitForFunction(() => document.querySelector('output').textContent.includes('.N2'))
  const refreshed = await snapshot('N2-ready-same-document')
  await page.reload({ waitUntil: 'load' })
  await page.click('button')
  await page.waitForFunction(() => document.querySelector('output').textContent !== '')
  const reloaded = await snapshot('N2-ready-full-reload')
  assert.equal(first.timeOrigin, hashOnly.timeOrigin)
  assert.equal(hashOnly.timeOrigin, refreshed.timeOrigin)
  assert.notEqual(reloaded.timeOrigin, refreshed.timeOrigin)
  assert.deepEqual(refreshed.calls.map(c => c.nonce), ['N1'])
  assert.equal(refreshed.hash, '#pm-launch=18345.N2')
  assert.deepEqual(reloaded.calls.map(c => c.nonce), ['N2'])
  assert.equal(reloaded.hash, '')
  assert.deepEqual(errors, [])
  dom = { status: 'DIAGNOSIS_REPRODUCED', version: await browser.version(), pid,
    first, hashOnly, refreshed, reloaded, errors, blockedRequests,
    boundary: 'Production bridge + fixture button, not React PmPanel or authenticated host; no HTTP server/fetch.' }
} catch (error) {
  dom = { status: 'BLOCKED', message: error.message }
} finally {
  if (browser) await browser.close()
}
}
if (dom.pid) {
  try {
    execFileSync('/bin/ps', ['-p', String(dom.pid), '-o', 'pid='], { stdio: 'pipe' })
    dom.pidStillPresent = true
  } catch {
    dom.pidStillPresent = false
  }
}
writeFileSync(join(root, 'dom.json'), JSON.stringify(dom, null, 2) + '\n')
const after = Object.fromEntries(sources.map(path => [path, sha(readFileSync(join(repo, path)))]))
assert.deepEqual(before, after, 'source changed during diagnosis')
const result = {
  startedAt, finishedAt: new Date().toISOString(), round, root,
  mode: process.argv.includes('--pure') ? 'correct-behavior-pure-contract' : 'diagnosis-with-old-symptom-dom',
  environment: { platform: process.platform, node: process.version, executable: process.execPath },
  baseline: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
  before, after, sourceBytesUnchanged: true,
  tests, summary: { passed: tests.filter(t => t.status === 'PASS').length, failed: tests.filter(t => t.status === 'FAIL').length },
  panelAst: { file: join(root, 'panel-ast.json'), sha256: sha(readFileSync(join(root, 'panel-ast.json'))) },
  dom, boundary: 'Limited diagnosis; no product fix/build/install/server, Main browser, real credentials or whole-product verdict.',
}
const resultPath = join(repo, `docs/testing/reopen-handshake-diagnosis-20261021-${round}.json`)
writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ resultPath, summary: result.summary, dom: dom.status, pidStillPresent: dom.pidStillPresent }))
process.exitCode = result.summary.failed || dom.status === 'BLOCKED' || dom.pidStillPresent ? 1 : 0

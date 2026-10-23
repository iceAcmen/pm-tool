import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const out = "/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedL8RepairR3"
const freeze = "/private/tmp/pmtool-combined-l8-repair-20261023-r3"
const pkg = freeze + '/packages/dsh-pm-tool'
const old = "/private/tmp/pmtool-combined-f02-repair-20261023-r2"
const taskRoot = repo + '/reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1'
const reportRoot = repo + '/reports/all-pending-evidence-20261021/ReportExportFenceRetestR2'
const node = '/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
function save(name, value) {
  const file = out + '/' + name
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2), { flag: 'wx' })
}
function scan(root) {
  const rows = {}
  if (!fs.existsSync(root)) return rows
  function walk(dir, rel = '') {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = dir + '/' + e.name, name = rel ? rel + '/' + e.name : e.name
      const st = fs.lstatSync(file)
      if (st.isSymbolicLink()) rows[name] = { link: fs.readlinkSync(file), real: fs.realpathSync(file) }
      else if (st.isDirectory()) walk(file, name)
      else { const b = fs.readFileSync(file); rows[name] = { bytes: b.length, sha256: sha(b), dev: st.dev, ino: st.ino } }
    }
  }
  walk(root)
  return rows
}
const content = rows => Object.fromEntries(Object.entries(rows).map(([k, r]) =>
  [k, r.link ? { link: r.link } : { bytes: r.bytes, sha256: r.sha256 }]))
function inputs(root) {
  const result = {}
  for (const name of fs.readdirSync(root)) {
    const file = root + '/' + name
    if (['src', 'scripts', 'locale'].includes(name)) {
      for (const [rel, row] of Object.entries(content(scan(file)))) result[name + '/' + rel] = row
    } else if (fs.lstatSync(file).isFile()) {
      const b = fs.readFileSync(file); result[name] = { bytes: b.length, sha256: sha(b) }
    }
  }
  return result
}
function copyDeps(from, to, label) {
  fs.cpSync(from, to, { recursive: true, dereference: false, verbatimSymlinks: true })
  const before = scan(from)
  for (const [rel, r] of Object.entries(before)) if (r.link) {
    assert(r.real.startsWith(from + '/'), 'external source link: ' + rel)
    if (path.isAbsolute(r.link)) {
      fs.unlinkSync(to + '/' + rel)
      fs.symlinkSync(to + r.link.slice(from.length), to + '/' + rel)
    }
  }
  const after = scan(to), shared = [], external = [], changed = []
  for (const [rel, r] of Object.entries(before)) {
    const a = after[rel]
    if (!a) changed.push(rel)
    else if (r.link) { if (!a.real.startsWith(to + '/')) external.push(rel) }
    else {
      if (r.bytes !== a.bytes || r.sha256 !== a.sha256) changed.push(rel)
      if (r.dev === a.dev && r.ino === a.ino) shared.push(rel)
    }
  }
  save(label + '-dependencies.json', { from, to, files: Object.values(after).filter(r => !r.link).length,
    links: Object.values(after).filter(r => r.link).length, shared, external, changed })
  assert.deepEqual(shared, []); assert.deepEqual(external, []); assert.deepEqual(changed, [])
}
const runRoot = out + '/runtime'
const env = {
  PATH: path.dirname(node) + ':/usr/bin:/bin:/usr/sbin:/sbin', HOME: runRoot + '/home',
  TMPDIR: runRoot + '/tmp', TMP: runRoot + '/tmp', TEMP: runRoot + '/tmp',
  XDG_CACHE_HOME: runRoot + '/cache', XDG_CONFIG_HOME: runRoot + '/config',
  XDG_DATA_HOME: runRoot + '/data', npm_config_cache: runRoot + '/cache/npm',
  NODE_DISABLE_COMPILE_CACHE: '1', PM_GOVERNANCE_TMP: runRoot + '/tmp/governance',
  PM_FILE_ATOMIC_TMP: runRoot + '/tmp/atomic', PM_BACKUP_WEB_TMP: runRoot + '/tmp/backup',
  ASK_AUTH_PI_STREAM: freeze + '/upstream/pi-src/stream.ts',
  ASK_AUTH_OBSERVATIONS: out + '/ask-auth-observations.ndjson',
  QA_EVIDENCE_ROOT: out + '/dom-observations',
  QA_POINTER_EVIDENCE_ROOT: out + '/pointer-observations',
  P2004_DOM_EVIDENCE: out + '/okr-observations',
  P1004_OBSERVATIONS: out + '/handoff-observations.json',
  P1005_JSON_ROOT: runRoot + '/tmp/reflect', CI: '1', LANG: 'zh_CN.UTF-8', TZ: 'UTC',
  REPORT_EXPORT_RED_TMP: runRoot + '/tmp/report-export',
  R1_RAW_TMP: runRoot + '/tmp/report-export', R1_PROBE_OUTPUT: runRoot + '/report-probes',
}
function execute(name, args) {
  for (const value of Object.values(env)) if (value.startsWith(runRoot + '/')) fs.mkdirSync(value, { recursive: true })
  for(const key of ['QA_EVIDENCE_ROOT','QA_POINTER_EVIDENCE_ROOT','P2004_DOM_EVIDENCE']) fs.mkdirSync(env[key], { recursive: true })
  const started = new Date().toISOString()
  console.log('START ' + name + ' ' + started)
  const child = spawnSync(node, args, { cwd: pkg, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  save(name + '.command.json', { argv: [node, ...args], cwd: pkg, env, pid: child.pid,
    started, ended: new Date().toISOString(), exitCode: child.status, signal: child.signal, error: child.error?.message })
  save(name + '.stdout.txt', child.stdout ?? ''); save(name + '.stderr.txt', child.stderr ?? '')
  console.log('END ' + name + ' exit=' + child.status + ' ' + new Date().toISOString())
  process.exitCode = child.status ?? 2
}
const mode = process.argv[2]
if (mode === 'freeze' || mode === 'facility') {
  if (mode === 'freeze') {
  assert(!fs.existsSync(freeze), 'Never overwrite a frozen round')
  fs.mkdirSync(pkg, { recursive: true })
  const main = repo + '/packages/dsh-pm-tool', before = inputs(main)
  assert(Object.keys(before).length > 0, 'Actual complete inputs required')
  for (const name of fs.readdirSync(main)) {
    const file = main + '/' + name
    if (['src', 'scripts', 'locale'].includes(name) || fs.lstatSync(file).isFile())
      fs.cpSync(file, pkg + '/' + name, { recursive: true, verbatimSymlinks: true })
  }
  assert.deepEqual(inputs(pkg), before)
  for (const name of ['docs', 'vendor']) fs.cpSync(old + '/' + name, freeze + '/' + name, { recursive: true })
  if (fs.existsSync(old + '/packages/dsh-pm-tool/docs'))
    fs.cpSync(old + '/packages/dsh-pm-tool/docs', pkg + '/docs', { recursive: true })
  fs.cpSync(repo + '/launcher', freeze + '/launcher', { recursive: true,
    filter: src => !['node_modules', 'lib', 'data', '.cache'].includes(path.basename(src)) })
  copyDeps(old + '/packages/dsh-pm-tool/node_modules', pkg + '/node_modules', 'package')
  copyDeps(old + '/dom-deps/node_modules', freeze + '/dom-deps/node_modules', 'dom')
  const upstreamFrom = old + '/upstream'
  fs.cpSync(upstreamFrom, freeze + '/upstream', { recursive: true, verbatimSymlinks: true })
  assert.deepEqual(content(scan(upstreamFrom)), content(scan(freeze + '/upstream')))
  assert(fs.existsSync(env.ASK_AUTH_PI_STREAM))
  save('upstream-inputs.json', content(scan(freeze + '/upstream')))
  const supplementalFrom = old + '/upstream-deps/node_modules'
  const supplementalTo = freeze + '/upstream-deps/node_modules'
  copyDeps(supplementalFrom, supplementalTo, 'upstream')
  fs.mkdirSync(freeze + '/node_modules/@deepseek-ai', { recursive: true })
  fs.mkdirSync(freeze + '/node_modules/@earendil-works', { recursive: true })
  const upstreamMappings = {
    '@deepseek-ai/dsh-brand': supplementalTo + '/@deepseek-ai/dsh-brand',
    '@deepseek-ai/dsh-llm': pkg + '/node_modules/@deepseek-ai/dsh-llm',
    '@earendil-works/pi-ai': supplementalTo + '/@earendil-works/pi-ai',
  }
  for (const [name, dest] of Object.entries(upstreamMappings))
    fs.symlinkSync(path.relative(path.dirname(freeze + '/node_modules/' + name), dest), freeze + '/node_modules/' + name)
  save('upstream-mappings.json', upstreamMappings)

  const parent = JSON.parse(fs.readFileSync("/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedF02RepairR2/source-files.json"));
  const baselineResult = spawnSync('/usr/bin/git', ['rev-parse','HEAD'], {cwd:repo,encoding:'utf8'});
  assert.equal(baselineResult.status,0); const baseline = baselineResult.stdout.trim();
  assert.equal(baseline,parent.baseline,'No unnoticed baseline change');
  const gitResults = {};
  for (const [name,args] of [
    ['tracked-product.diff',['diff','--binary','--','packages/dsh-pm-tool','launcher']],
    ['changed-product-files.txt',['diff','--name-only','--','packages/dsh-pm-tool','launcher']],
    ['new-product-files.txt',['ls-files','--others','--exclude-standard','--','packages/dsh-pm-tool/src','packages/dsh-pm-tool/scripts','launcher']],
  ]) {
    const r=spawnSync('/usr/bin/git',args,{cwd:repo,encoding:'utf8',maxBuffer:24*1024*1024});
    assert.equal(r.status,0); save(name,r.stdout); gitResults[name]={argv:['/usr/bin/git',...args],exitCode:r.status};
  }
  const names = [...new Set([...Object.keys(parent.source),
    ...fs.readFileSync(out+'/changed-product-files.txt','utf8').trim().split('\n'),
    ...fs.readFileSync(out+'/new-product-files.txt','utf8').trim().split('\n')])].filter(Boolean).sort();
  const all = {};
  for(const name of names) {
    assert(fs.existsSync(freeze+'/'+name),'Complete candidate omitted '+name);
    const b=fs.readFileSync(freeze+'/'+name);
    assert.equal(sha(b),sha(fs.readFileSync(repo+'/'+name)),name);
    all[name]=sha(b);
  }
  const priorInputs=JSON.parse(fs.readFileSync("/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedF02RepairR2/complete-inputs.json"));
  const delta=[];
  for(const name of [...new Set([...Object.keys(priorInputs),...Object.keys(before)])].sort())
    if(JSON.stringify(priorInputs[name])!==JSON.stringify(before[name]))
      delta.push({name,before:priorInputs[name]??null,after:before[name]??null});
  const reviews=["p1004-handoff-source-auto-20261023-r1-report.md","p1005-reflect-entry-source-auto-20261023-r1-report.md","p1005-listbox-backdrop-source-auto-20261023-r1.md","p2007-archive-projection-source-auto-20261023-r1-report.md","p2002-outbound-slot-source-auto-20261023-r2-report.md","p2004-kr-related-source-auto-20261023-r2-report.md","f02-option-default-source-auto-20261023-r2-report.md","f02-related28-infrastructure-retest-20261023-r3-report.md","l8-gantt-source-auto-review-20261023-r3-report.md"];

  assert.equal(Object.keys(priorInputs).length,525);
  assert.deepEqual(delta.map(x=>x.name).sort(),[
    'src/client/views/gantt-status.test.tsx',
    'src/client/views/gantt.tsx']);
  save('parent-f02-source-files.json',parent);save('complete-inputs.json',before);
  save('parent-f02-to-current-inputs.json',{priorCount:Object.keys(priorInputs).length,currentCount:Object.keys(before).length,delta});
  save('independent-source-reports.json',Object.fromEntries(reviews.map(name=>{
    const b=fs.readFileSync(repo+'/docs/testing/'+name);return [name,{bytes:b.length,sha256:sha(b)}]})));
  save('source-files.json',{baseline,count:names.length,source:all});
  save('source-files.sha256',Object.entries(all).map(([name,h])=>h+'  '+name).join('\n')+'\n');
  save('candidate.json',{at:new Date().toISOString(),baseline,freeze,pkg,sourceCount:names.length,
    completeInputCount:Object.keys(before).length,version:JSON.parse(fs.readFileSync(pkg+'/package.json')).version,
    builder:'Main',runtimeLoaded:false,authorization:'All existing pending acceptance to ordinary commit; no push/release/formal switch',
    independent:reviews,gitResults});
  save('dependency-protected-before.json',{
    package:content(scan(pkg+'/node_modules')),dom:content(scan(freeze+'/dom-deps/node_modules')),
    upstream:content(scan(freeze+'/upstream-deps/node_modules'))});
  save('protected-before.json', { mainInputs: before, mainLib: content(scan(main + '/lib')),
    oldLib: content(scan(old + '/packages/dsh-pm-tool/lib')), launcher: content(scan(freeze + '/launcher')) })
  } else {
    const before = JSON.parse(fs.readFileSync(out + '/complete-inputs.json'))
    assert.deepEqual(inputs(pkg), before)
    assert.deepEqual(inputs(repo + '/packages/dsh-pm-tool'), before)
    save('facility-resume.json', { reason: 'Initial preflight comparison used wrong document fixture text; no product tests ran',
      originalExecutionId: '8f3e39de2a169f7b3e00f9a7d677e5ed', originalExit: 1, frozenInputUnchanged: true })
  }
  const setupOriginal = fs.readFileSync(taskRoot + '/r3-facility/browser-scheduler-setup.mjs', 'utf8')
  const setup = setupOriginal.replaceAll(taskRoot + '/r1/frozen/packages/dsh-pm-tool', pkg)
    .replaceAll(taskRoot + '/r1/dom-deps', freeze + '/dom-deps')
  if (mode === 'freeze') save('browser-scheduler-setup.mjs', setup)
  else assert.equal(fs.readFileSync(out + '/browser-scheduler-setup.mjs', 'utf8'), setup)
  const checklistOriginal = fs.readFileSync(pkg + '/src/client/panel-checklist-toggle.test.tsx', 'utf8')
  const checklistAdapted = fs.readFileSync(taskRoot + '/r3-facility/checklist-document-fixture.test.tsx', 'utf8')
  assert.equal(checklistAdapted.replace("vi.stubGlobal('document', globalThis.__qaSchedulerDocument)",
    "vi.stubGlobal('document', { activeElement: null })"), checklistOriginal)
  save('checklist-fixture.test.tsx', checklistAdapted)
  const { adaptC02 } = await import(repo + '/docs/testing/task-predecessor-selection-independent-retest-20261022-r1-adapter.mjs')
  const c02 = adaptC02(fs.readFileSync(pkg + '/src/client/task-predecessor-refs-dom.test.tsx', 'utf8'))
  save('c02-adapter.json', { ...c02, before: undefined, after: undefined, adapted: undefined })
  save('c02-adapted.test.tsx', c02.adapted)
  save('facilities.json', { schedulerOriginalSha: sha(setupOriginal), schedulerSha: sha(setup),
    checklistOriginalSha: sha(checklistOriginal), checklistAdaptedSha: sha(checklistAdapted),
    onlyChecklistDocumentPrerequisiteChanged: true, productTransform: 'export TaskForm only',
    c02Scope: c02.scope, oldTestsWritten: false })
  const exclusions = ['src/client/panel-sidecar-task-handoff.test.tsx', 'src/client/views/okrs-related.test.tsx', 'src/client/views/records/records-deliverable-pointer-dom.test.tsx', 'src/client/shared/task-draft-materials-refs-dom.test.tsx',
    'src/client/task-predecessor-refs-dom.test.tsx', 'src/client/task-predecessor-hidden-submit-dom.test.tsx']
  const serial = { environment: 'node', pool: 'forks', poolOptions: { forks: { singleFork: true } },
    minWorkers: 1, maxWorkers: 1, fileParallelism: false, testTimeout: 15000, hookTimeout: 15000 }
  save('vitest-full.config.mjs', `import fs from 'node:fs';\nimport base from ${JSON.stringify(pkg + '/vitest.config.ts')};\nexport default {...base, root:${JSON.stringify(pkg)},cacheDir:${JSON.stringify(runRoot + '/cache/full')},
test:{...base.test,...${JSON.stringify(serial)},exclude:${JSON.stringify(exclusions)},setupFiles:[${JSON.stringify(out + '/browser-scheduler-setup.mjs')}]},
plugins:[{name:'document-fixture-only',enforce:'pre',transform(code,id){if(id!==${JSON.stringify(pkg + '/src/client/panel-checklist-toggle.test.tsx')})return null;return {code:fs.readFileSync(${JSON.stringify(out + '/checklist-fixture.test.tsx')},'utf8'),map:null}}}]};\n`)
  const domDeps = freeze + '/dom-deps/node_modules'
  const aliases = ['react/jsx-dev-runtime', 'react/jsx-runtime', 'react-dom/test-utils', 'react-dom/client', 'react-dom', 'react', 'jsdom']
    .map(find => ({ find, replacement: domDeps + '/' + (find === 'jsdom' ? 'jsdom/lib/api.js' :
      ['react', 'react-dom'].includes(find) ? find + '/index.js' : find + '.js') }))
  save('vitest-dom.config.mjs', `import fs from 'node:fs';\nconst config=${JSON.stringify({
    root: pkg, cacheDir: runRoot + '/cache/dom', esbuild: { jsx: 'automatic' },
    resolve: { alias: aliases }, test: { ...serial, include: exclusions } })};
config.test.server={deps:{inline:[/lucide-react/]}};
config.plugins=[{name:'private-export-only',enforce:'pre',transform(code,id){
if(id===${JSON.stringify(pkg + '/src/client/panel.tsx')})return {code:code+'\\nexport { TaskForm }\\n',map:null};
if(id===${JSON.stringify(pkg + '/src/client/task-predecessor-refs-dom.test.tsx')})return {code:fs.readFileSync(${JSON.stringify(out + '/c02-adapted.test.tsx')},'utf8'),map:null};return null}}];\nexport default config;\n`)
  for (const name of ['retest-stress.test.ts', 'retest-probes.test.ts', 'src/core/retest-legacy-renderer.ts'])
    fs.cpSync(reportRoot + '/frozen/packages/dsh-pm-tool/' + name, pkg + '/' + name)
  save('report-special-inputs.json', Object.fromEntries(['retest-stress.test.ts', 'retest-probes.test.ts', 'src/core/retest-legacy-renderer.ts']
    .map(name => [name, sha(fs.readFileSync(pkg + '/' + name))])))
  save('vitest-special.config.mjs', 'export default ' + JSON.stringify({ root: pkg,
    cacheDir: runRoot + '/cache/special', test: { ...serial, include: ['retest-stress.test.ts', 'retest-probes.test.ts'] } }) + '\n')
  console.log(JSON.parse(fs.readFileSync(out + '/candidate.json')))
} else if (mode === 'tsc') execute('tsc', [pkg + '/node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'])
else if (mode === 'bundle') {
  fs.cpSync(pkg + '/src/client/panel.css', pkg + '/lib/client/panel.css')
  for (const dir of ['views', 'board']) {
    fs.mkdirSync(pkg + '/lib/client/' + dir, { recursive: true })
    for (const name of fs.readdirSync(pkg + '/src/client/' + dir)) if (name.endsWith('.css'))
      fs.cpSync(pkg + '/src/client/' + dir + '/' + name, pkg + '/lib/client/' + dir + '/' + name)
  }
  execute('bundle', [pkg + '/node_modules/tsdown/dist/run.mjs', '--config', 'tsdown.config.ts'])
} else if (mode === 'noemit') execute('noemit', [pkg + '/node_modules/typescript/bin/tsc', '-p', 'tsconfig.json', '--noEmit', '--incremental', 'false'])
else if (['full', 'dom', 'special'].includes(mode)) execute(mode, [pkg + '/node_modules/vitest/vitest.mjs',
  'run', '--config', out + '/vitest-' + mode + '.config.mjs', '--no-cache',
  ...(mode === 'full' ? ['--coverage'] : []), '--reporter=default', '--reporter=json', '--outputFile=' + out + '/' + mode + '.result.json'])
else if (mode === 'full-r2') execute(mode, [pkg + '/node_modules/vitest/vitest.mjs',
  'run', '--config', out + '/vitest-full-r2.config.mjs', '--no-cache', '--coverage',
  '--reporter=default', '--reporter=json', '--outputFile=' + out + '/full-r2.result.json'])
else if (mode === 'verify') execute('verify', ['scripts/verify-isolation.mjs'])
else if (mode === 'guard') execute('guard', ['scripts/test-isolation-guard.mjs'])
else if (mode === 'close') {
  const before = JSON.parse(fs.readFileSync(out + '/protected-before.json'))
  assert.deepEqual(inputs(repo + '/packages/dsh-pm-tool'), before.mainInputs)
  assert.deepEqual(content(scan(repo + '/packages/dsh-pm-tool/lib')), before.mainLib)
  assert.deepEqual(content(scan(old + '/packages/dsh-pm-tool/lib')), before.oldLib)
  for (const [name, row] of Object.entries(before.mainInputs))
    assert.equal(sha(fs.readFileSync(pkg + '/' + name)), row.sha256, name)
  assert.deepEqual(content(scan(freeze + '/launcher')), before.launcher)
  const commands = {}
  for (const name of ['tsc', 'bundle', 'noemit', 'full', 'dom', 'special', 'verify', 'guard']) {
    commands[name] = JSON.parse(fs.readFileSync(out + '/' + name + '.command.json'))
    assert.equal(commands[name].exitCode, 0, name)
    assert.equal(commands[name].signal, null, name)
  }

  const dependencyBefore=JSON.parse(fs.readFileSync(out+'/dependency-protected-before.json'));
  for(const [label,root] of Object.entries({package:pkg+'/node_modules',dom:freeze+'/dom-deps/node_modules',upstream:freeze+'/upstream-deps/node_modules'}))
    assert.deepEqual(content(scan(root)),dependencyBefore[label],'Dependency drift: '+label);
  const specialBefore=JSON.parse(fs.readFileSync(out+'/report-special-inputs.json'));
  for(const [name,h] of Object.entries(specialBefore)) assert.equal(sha(fs.readFileSync(pkg+'/'+name)),h,name);
  save('built-artifacts.json', content(scan(pkg + '/lib')))
  save('close.json', { at: new Date().toISOString(), sourceUnchanged: true, oldMainLibUnchanged: true,
    ownOutputOnly: true, commands, independentVerdict: 'NOT_SIGNED_BY_EXECUTOR' })
  console.log('CLOSE exit=0')
} else throw new Error('Unknown mode ' + mode)

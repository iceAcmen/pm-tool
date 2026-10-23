import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const priorOut = repo + '/reports/all-pending-evidence-20261021/CombinedSuccessor114R1'
const priorFreeze = '/private/tmp/pmtool-combined-successor114-20261022-r1'
const out = repo + '/reports/all-pending-evidence-20261021/CombinedSixRepairsR1'
const freeze = '/private/tmp/pmtool-combined-six-repairs-20261023-r1'
const node = '/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const hash = b => crypto.createHash('sha256').update(b).digest('hex')
const mode = process.argv[2]
assert(['freeze', 'tsc', 'bundle', 'noemit', 'full', 'dom', 'special', 'verify', 'guard', 'close'].includes(mode))
fs.mkdirSync(out, { recursive: true })
function save(name, value) {
  fs.writeFileSync(out + '/' + name, typeof value === 'string' ? value : JSON.stringify(value, null, 2), { flag: 'wx' })
}
const original = fs.readFileSync(priorOut + '/executor-source.mjs', 'utf8')
let code = original
function replaceOnce(from, to) {
  assert.equal(code.split(from).length, 2, 'Unique predecessor text required: ' + from.slice(0, 80))
  code = code.replace(from, to)
}
replaceOnce("const out = repo + '/reports/all-pending-evidence-20261021/CombinedSuccessor114R1'", `const out = ${JSON.stringify(out)}`)
replaceOnce("const freeze = '/private/tmp/pmtool-combined-successor114-20261022-r1'", `const freeze = ${JSON.stringify(freeze)}`)
replaceOnce("const old = '/private/tmp/pmtool-combined-repair-20261022-r2'", `const old = ${JSON.stringify(priorFreeze)}`)
replaceOnce("assert.equal(Object.keys(before).length, 521)", "assert(Object.keys(before).length > 0, 'Actual complete inputs required')")
replaceOnce("copyDeps(taskRoot + '/r1/dom-deps/node_modules', freeze + '/dom-deps/node_modules', 'dom')",
  "copyDeps(old + '/dom-deps/node_modules', freeze + '/dom-deps/node_modules', 'dom')")
replaceOnce("const upstreamFrom = repo + '/reports/all-pending-evidence-20261021/AskAuthRetestR1/frozen/upstream'",
  "const upstreamFrom = old + '/upstream'")
replaceOnce("const supplementalFrom = '/private/tmp/pmtool-combined-successor112-20261022-r1/upstream-deps/node_modules'",
  "const supplementalFrom = old + '/upstream-deps/node_modules'")

const declarationStart = code.indexOf("  const parent = JSON.parse(fs.readFileSync(repo + '/reports/all-pending-evidence-20261021/CopilotPrefixDevR1/source-files.json'))")
const declarationEnd = code.indexOf("  save('protected-before.json'", declarationStart)
assert(declarationStart > 0 && declarationEnd > declarationStart)
code = code.slice(0, declarationStart) + `
  const parent = JSON.parse(fs.readFileSync(${JSON.stringify(priorOut + '/source-files.json')}));
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
    ...fs.readFileSync(out+'/changed-product-files.txt','utf8').trim().split('\\n'),
    ...fs.readFileSync(out+'/new-product-files.txt','utf8').trim().split('\\n')])].filter(Boolean).sort();
  const all = {};
  for(const name of names) {
    assert(fs.existsSync(freeze+'/'+name),'Complete candidate omitted '+name);
    const b=fs.readFileSync(freeze+'/'+name);
    assert.equal(sha(b),sha(fs.readFileSync(repo+'/'+name)),name);
    all[name]=sha(b);
  }
  const priorInputs=JSON.parse(fs.readFileSync(${JSON.stringify(priorOut + '/complete-inputs.json')}));
  const delta=[];
  for(const name of [...new Set([...Object.keys(priorInputs),...Object.keys(before)])].sort())
    if(JSON.stringify(priorInputs[name])!==JSON.stringify(before[name]))
      delta.push({name,before:priorInputs[name]??null,after:before[name]??null});
  const reviews=${JSON.stringify([
    'p1004-handoff-source-auto-20261023-r1-report.md',
    'p1005-reflect-entry-source-auto-20261023-r1-report.md',
    'p1005-listbox-backdrop-source-auto-20261023-r1.md',
    'p2007-archive-projection-source-auto-20261023-r1-report.md',
    'p2002-outbound-slot-source-auto-20261023-r2-report.md',
    'p2004-kr-related-source-auto-20261023-r2-report.md',
  ])};
  save('parent114-source-files.json',parent);save('complete-inputs.json',before);
  save('parent114-to-current-inputs.json',{priorCount:Object.keys(priorInputs).length,currentCount:Object.keys(before).length,delta});
  save('independent-source-reports.json',Object.fromEntries(reviews.map(name=>{
    const b=fs.readFileSync(repo+'/docs/testing/'+name);return [name,{bytes:b.length,sha256:sha(b)}]})));
  save('source-files.json',{baseline,count:names.length,source:all});
  save('source-files.sha256',Object.entries(all).map(([name,h])=>h+'  '+name).join('\\n')+'\\n');
  save('candidate.json',{at:new Date().toISOString(),baseline,freeze,pkg,sourceCount:names.length,
    completeInputCount:Object.keys(before).length,version:JSON.parse(fs.readFileSync(pkg+'/package.json')).version,
    builder:'Main',runtimeLoaded:false,authorization:'All existing pending acceptance to ordinary commit; no push/release/formal switch',
    independent:reviews,gitResults});
  save('dependency-protected-before.json',{
    package:content(scan(pkg+'/node_modules')),dom:content(scan(freeze+'/dom-deps/node_modules')),
    upstream:content(scan(freeze+'/upstream-deps/node_modules'))});
` + code.slice(declarationEnd)
replaceOnce("QA_EVIDENCE_ROOT: out + '/dom-observations', CI:", `QA_EVIDENCE_ROOT: out + '/dom-observations',
  QA_POINTER_EVIDENCE_ROOT: out + '/pointer-observations',
  P2004_DOM_EVIDENCE: out + '/okr-observations',
  P1004_OBSERVATIONS: out + '/handoff-observations.json',
  P1005_JSON_ROOT: runRoot + '/tmp/reflect', CI:`)
replaceOnce("fs.mkdirSync(env.QA_EVIDENCE_ROOT, { recursive: true })",
  "for(const key of ['QA_EVIDENCE_ROOT','QA_POINTER_EVIDENCE_ROOT','P2004_DOM_EVIDENCE']) fs.mkdirSync(env[key], { recursive: true })")
replaceOnce("const exclusions = ['src/client/shared/task-draft-materials-refs-dom.test.tsx',",
  "const exclusions = ['src/client/panel-sidecar-task-handoff.test.tsx', 'src/client/views/okrs-related.test.tsx', 'src/client/views/records/records-deliverable-pointer-dom.test.tsx', 'src/client/shared/task-draft-materials-refs-dom.test.tsx',")
replaceOnce("console.log({ frozen: freeze, inputs: 521, declarations: 114 })",
  "console.log(JSON.parse(fs.readFileSync(out + '/candidate.json')))")
replaceOnce("  save('built-artifacts.json', content(scan(pkg + '/lib')))", `
  const dependencyBefore=JSON.parse(fs.readFileSync(out+'/dependency-protected-before.json'));
  for(const [label,root] of Object.entries({package:pkg+'/node_modules',dom:freeze+'/dom-deps/node_modules',upstream:freeze+'/upstream-deps/node_modules'}))
    assert.deepEqual(content(scan(root)),dependencyBefore[label],'Dependency drift: '+label);
  const specialBefore=JSON.parse(fs.readFileSync(out+'/report-special-inputs.json'));
  for(const [name,h] of Object.entries(specialBefore)) assert.equal(sha(fs.readFileSync(pkg+'/'+name)),h,name);
  save('built-artifacts.json', content(scan(pkg + '/lib')))`)

const executor = out + '/executor-source.mjs'
if (!fs.existsSync(executor)) {
  assert.equal(mode, 'freeze', 'First round must freeze')
  save('derivation.json', { priorExecutor: priorOut + '/executor-source.mjs', priorSha256: hash(original),
    executorSha256: hash(code), purpose: 'New complete identity, current six repairs, expanded actual DOM cohort, isolated observations and dependency close protection' })
  save('executor-source.mjs', code)
} else assert.equal(fs.readFileSync(executor, 'utf8'), code, 'Never mutate sealed executor')
const started = new Date().toISOString()
const child = spawnSync(node, [executor, mode], { cwd: repo, encoding: 'utf8',
  env: { PATH: path.dirname(node) + ':/usr/bin:/bin:/usr/sbin:/sbin', LANG: 'zh_CN.UTF-8' },
  maxBuffer: 64 * 1024 * 1024 })
save(mode + '-outer-receipt.json', { argv: [node, executor, mode], cwd: repo, started,
  ended: new Date().toISOString(), pid: child.pid, exitCode: child.status, signal: child.signal,
  error: child.error?.message, executorSha256: hash(code) })
save(mode + '-outer-stdout.txt', child.stdout ?? '')
save(mode + '-outer-stderr.txt', child.stderr ?? '')
console.log(JSON.stringify({ mode, exitCode: child.status, signal: child.signal, error: child.error?.message,
  stdoutTail: child.stdout?.slice(-2200), stderrTail: child.stderr?.slice(-2200) }))
process.exitCode = child.status ?? 2

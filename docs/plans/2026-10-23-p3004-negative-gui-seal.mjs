import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {spawnSync} from 'node:child_process'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const source=repo+'/reports/all-pending-evidence-20261021/SixRepairsGuiR1'
const out=repo+'/reports/all-pending-evidence-20261021/P3004NegativeGuiR1'
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
if(process.argv[2]!=='inner') {
  const argv=['/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node',process.argv[1],'inner']
  const start=new Date().toISOString()
  const r=spawnSync(argv[0],argv.slice(1),{cwd:repo,encoding:'utf8'})
  await fs.writeFile(out+'/seal-outer-receipt.json',JSON.stringify({argv,start,end:new Date().toISOString(),exit:r.status,signal:r.signal,stdout:r.stdout,stderr:r.stderr},null,2),{flag:'wx'})
  console.log({exit:r.status,stdout:r.stdout,stderr:r.stderr});process.exitCode=r.status??1
} else {
  assert(!await fs.stat(out).catch(()=>null));await fs.mkdir(out)
  const files={}
  async function store(rel,b) {
    const dest=out+'/'+rel
    await fs.mkdir(dest.slice(0,dest.lastIndexOf('/')),{recursive:true})
    await fs.writeFile(dest,b,{flag:'wx'})
    files[rel]={bytes:b.length,sha256:sha(b)}
  }
  const include=rel=>/^round(20|21|22|23|24|25)([-.]|$)/.test(rel)||/^frames\/round(20|21|22|23|24|25)-/.test(rel)||/^(activation-binding-r2|combined-|browser-script-3|host-start|host-ready|host-setup-outer-receipt|harness-source|isolated-profile|gateway-binding)/.test(rel)
  async function walk(dir) {
    for(const e of await fs.readdir(dir,{withFileTypes:true})) {
      const p=dir+'/'+e.name,rel=p.slice(source.length+1)
      if(e.isDirectory())await walk(p)
      else if(include(rel))await store(rel,await fs.readFile(p))
    }
  }
  await walk(source)
  const complete=JSON.parse(await fs.readFile(out+'/combined-complete-inputs.json','utf8'))
  for(const rel of ['src/client/views/habit-form.tsx','src/client/views/growth-form-props.ts','src/client/form-validation.ts','src/core/habits.ts','src/commands/habit.ts','src/client/panel.tsx','src/client/views/records/records-listbox.tsx']) {
    const b=await fs.readFile(repo+'/packages/dsh-pm-tool/'+rel)
    assert.deepEqual({bytes:b.length,sha256:sha(b)},complete[rel])
    await store('frozen-source/'+rel,b)
  }
  const states=['round21-after-fixture-preparation','round23-E-habit-list','round23-original-H-edit-text-fallback','round24-before-negative-draft','round24-missing-before-save','round24-missing-after-rejection','round24-cross-before-save','round24-cross-after-rejection','round25-before-normal-habit-cancel','round25-after-normal-habit-cancel','round25-final-after-readonly-snapshot']
  const baseline=JSON.parse(await fs.readFile(out+'/'+states[0]+'-roots.json','utf8'))
  const transitions=[]
  for(const state of states) {
    const roots=JSON.parse(await fs.readFile(out+'/'+state+'-roots.json','utf8'))
    assert.deepEqual(roots,baseline)
    transitions.push({state,rootCount:Object.keys(roots).length,differences:[]})
  }
  const identity=JSON.parse(await fs.readFile(out+'/round21-fixture-identity.json','utf8'))
  const original=JSON.parse(await fs.readFile(out+'/round21-before-live-snapshot.json','utf8'))
  const prepared=JSON.parse(await fs.readFile(out+'/round21-after-preparation-live-snapshot.json','utf8'))
  const final=JSON.parse(await fs.readFile(out+'/round25-final-live-snapshot.json','utf8'))
  assert.deepEqual(prepared.habits,final.habits)
  assert.deepEqual(prepared.okrs,final.okrs)
  for(const key of ['tasks','reflections','okrs','milestones','deliverables','fileAssets']) {
    if(original[key])assert.deepEqual(original[key],final[key])
  }
  const summary={
    scope:'原RA-P3004 §6 空OKR E/未关联H负例夹具澄清，只采关系错误、同稿保留与零写；Main不签GUI/PASS。',
    fixture:identity,
    preparationWrites:'正常composer project add/habit add；负例零写基线从准备结束之后起算。',
    transitions,
    observations:'missing/B真实habit update返回kind=error，错误原文可见，同一编辑抽屉与5字段保留；连续roots一致。',
    visibilityBoundary:'missing错误摘要右端位于抽屉后方，PNG如实保；精确missing ID在表单和原RPC中，不由Main签可读性或豁免。',
    rounds:[20,21,22,23,24,25],independentVerdict:'PENDING',
  }
  await store('execution-summary.json',Buffer.from(JSON.stringify(summary,null,2)))
  await store('main-seal-source.mjs',await fs.readFile(process.argv[1]))
  const index=Buffer.from(JSON.stringify({files},null,2));await fs.writeFile(out+'/index-r1.json',index,{flag:'wx'})
  for(const [rel,info] of Object.entries(files)) {
    const b=await fs.readFile(out+'/'+rel);assert.equal(b.length,info.bytes);assert.equal(sha(b),info.sha256)
  }
  await fs.writeFile(out+'/seal-r1.json',JSON.stringify({at:new Date().toISOString(),files:Object.keys(files).length,indexSha256:sha(index),exit:0,independentVerdict:'PENDING'},null,2),{flag:'wx'})
  console.log({files:Object.keys(files).length,states:states.length,rootCount:Object.keys(baseline).length,rootDifferences:[],exit:0})
}

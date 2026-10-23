import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2002TreeR3'),{browser,page}=await h.connect()
let stop
const ids={}
async function taskRows(){
  const rows=[]
  for(const f of await fs.readdir(h.runtime+'/data/pmtool/tasks'))rows.push(JSON.parse(await fs.readFile(h.runtime+'/data/pmtool/tasks/'+f,'utf8')).record)
  return rows
}
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  const first=JSON.parse(await fs.readFile(h.out+'/round01-create-parent-command.json','utf8'))
  assert.equal(first.body.result.value.result.kind,'success')
  const parents=(await taskRows()).filter(t=>t.title==='P2002-R3出站父任务')
  assert.equal(parents.length,1)
  ids.parent=parents[0]
  stop=await h.record(page,'round02-remaining-task-create')
  await h.state(page,'round02-parent-already-created')
  for(const [alias,title]of [['child_a','P2002-R3出站子任务甲'],['child_b','P2002-R3出站子任务乙']]){
    assert.equal((await taskRows()).filter(t=>t.title===title).length,0)
    const body=await h.command(page,'/pm task add '+JSON.stringify({projectId:ids.parent.projectId,parentId:ids.parent.id,title}),'round02-create-'+alias)
    assert.equal(body.result.ok,true)
    assert.equal(body.result.value.result.kind,'success')
    const found=(await taskRows()).filter(t=>t.title===title)
    assert.equal(found.length,1)
    ids[alias]=found[0]
    await h.save('follow-ids-after-'+alias+'.json',ids)
  }
  await h.save('ids.json',ids)
  await page.click('button[aria-label="项目管理"]')
  await page.waitForSelector('.pm-shell',{visible:true,timeout:10000})
  const response=page.waitForResponse(r=>{
    if(new URL(r.url()).pathname!=='/api/commands/execute')return false
    try{return JSON.parse(r.request().postData()).payload.args.line==='/pm web snapshot'}catch{return false}
  },{timeout:15000})
  await page.click('button[aria-label="刷新数据"]')
  const res=await response
  await h.save('round02-prepared-snapshot.json',{status:res.status(),body:await res.json()})
  const s=await h.state(page,'round02-prepared-pm')
  const before=JSON.parse(await fs.readFile(h.out+'/round00-before-preparation-roots.json','utf8'))
  const after=JSON.parse(await fs.readFile(h.out+'/round02-prepared-pm-roots.json','utf8'))
  const diff=Object.keys({...before,...after}).filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]))
  const expected=Object.values(ids).map(t=>'data/pmtool/tasks/'+t.id+'.json').sort()
  assert.deepEqual(diff.sort(),expected)
  await h.save('preparation-delta.json',{actual:diff,expectedNewTasks:expected,old44Unchanged:true,firstPrepareFailure:'response wrapper assertion only; first parent already created; not replayed'})
  console.log(JSON.stringify({ids:Object.fromEntries(Object.entries(ids).map(([k,t])=>[k,{id:t.id,code:t.code,parentId:t.parentId}])),origin:s.origin,controls:s.buttons.filter(n=>/P2002-R3/.test(n.aria||n.text))}))
}catch(e){await h.save('round02-preparation-error.json',{error:String(e),stack:e.stack,ids});throw e}
finally{if(stop)await stop();await browser.disconnect()}

import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2002TreeR3'),repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const {browser,page}=await h.connect()
let stop
const ids={}
async function tasks(){
  const result=[]
  for(const f of await fs.readdir(h.runtime+'/data/pmtool/tasks')){
    const j=JSON.parse(await fs.readFile(h.runtime+'/data/pmtool/tasks/'+f,'utf8'))
    result.push(j.record)
  }
  return result
}
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  await h.state(page,'round00-before-preparation')
  const before=JSON.parse(await fs.readFile(h.out+'/round00-before-preparation-roots.json','utf8'))
  const old=JSON.parse(await fs.readFile(repo+'/reports/all-pending-evidence-20261021/P2DisplayRepairGuiR2/round10-final-a-roots.json','utf8'))
  assert.deepEqual(before,old)
  stop=await h.record(page,'round01-real-task-create')
  await page.click('button[aria-label="新建会话"]')
  await page.waitForSelector('[contenteditable=true]',{visible:true,timeout:5000})
  for(const [alias,title,parentId]of [
    ['parent','P2002-R3出站父任务',null],
    ['child_a','P2002-R3出站子任务甲','parent'],
    ['child_b','P2002-R3出站子任务乙','parent'],
  ]){
    const fields={projectId:'p-0001',title,...(parentId?{parentId:ids[parentId].id}:{})}
    const response=await h.command(page,'/pm task add '+JSON.stringify(fields),'round01-create-'+alias)
    assert.equal(response.kind,'success')
    const found=(await tasks()).filter(t=>t.title===title)
    assert.equal(found.length,1)
    ids[alias]=found[0]
    await h.save('ids-after-'+alias+'.json',ids)
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
  await h.save('round01-after-preparation-snapshot.json',{status:res.status(),body:await res.json()})
  const s=await h.state(page,'round01-prepared-pm')
  console.log(JSON.stringify({ids:Object.fromEntries(Object.entries(ids).map(([k,t])=>[k,{id:t.id,code:t.code,parentId:t.parentId}])),origin:s.origin,controls:s.buttons.filter(n=>/P2002-R3/.test(n.aria||n.text))}))
}catch(e){await h.save('round01-preparation-error.json',{error:String(e),stack:e.stack,ids});throw e}
finally{if(stop)await stop();await browser.disconnect()}

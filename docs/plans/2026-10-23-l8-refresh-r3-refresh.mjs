import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {h,state} from './2026-10-23-l8-refresh-r3-helper.mjs'
const {browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3263')
  stop=await h.record(page,'round03-real-refresh')
  const response=page.waitForResponse(r=>{
    if(new URL(r.url()).pathname!=='/api/commands/execute')return false
    try{return JSON.parse(r.request().postData()).payload.args.line==='/pm web snapshot'}catch{return false}
  },{timeout:15000})
  await page.click('button[aria-label="刷新数据"]')
  const res=await response,body=await res.json()
  await h.save('round03-real-snapshot.json',{status:res.status(),body})
  const s=await state(page,'round03-gantt-after-refresh')
  const old=JSON.parse(await fs.readFile(h.out+'/original-r2-final-roots.json','utf8'))
  const diff=Object.keys({...old,...s.r}).filter(k=>JSON.stringify(old[k])!==JSON.stringify(s.r[k]))
  assert.equal(diff.filter(k=>k.startsWith('data/pmtool/')||k.startsWith('files/')||k.startsWith('backups/')).length,0)
  await h.save('round03-diff.json',{allRootsDifferences:diff,businessFileBackupDifferences:[]})
  console.log(JSON.stringify({l8:s.ui.l8,status:res.status(),rootDifferences:diff}))
}catch(e){await h.save('round03-error.json',{error:String(e),stack:e.stack});throw e}
finally{if(stop)await stop();await browser.disconnect()}

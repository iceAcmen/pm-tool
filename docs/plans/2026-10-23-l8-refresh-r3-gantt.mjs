import assert from 'node:assert/strict'
import {h,state,sameOriginal} from './2026-10-23-l8-refresh-r3-helper.mjs'
const {browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3263')
  stop=await h.record(page,'round02-original-gantt')
  await h.textButton(page,'甘特排期')
  await page.waitForSelector('.pm-gantt',{visible:true,timeout:5000})
  const s=await state(page,'round02-gantt-before-refresh')
  await sameOriginal(s.r)
  console.log(JSON.stringify({origin:s.ui.origin,l8:s.ui.l8,controls:s.ui.controls.filter(n=>n.aria==='刷新数据')}))
}catch(e){await h.save('round02-error.json',{error:String(e),stack:e.stack});throw e}
finally{if(stop)await stop();await browser.disconnect()}

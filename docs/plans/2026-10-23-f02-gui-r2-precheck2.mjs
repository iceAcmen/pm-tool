import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('F02RepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'r2precheck2')
  await h.state(page,'r2precheck2-current-before')
  const button=await page.$('[aria-label="项目管理"]')
  assert(button)
  const target=await button.evaluate(n=>{
    const b=n.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)
    return {bbox:b.toJSON(),hit:{tag:hit?.tagName,text:hit?.innerText,cls:hit?.className},hitIsButton:hit===n||n.contains(hit),hash:location.hash}
  })
  await h.save('r2precheck2-actual-pm-pointer-target.json',target)
  assert(target.hitIsButton)
  await page.mouse.click(target.bbox.x+target.bbox.width/2,target.bbox.y+target.bbox.height/2)
  await page.waitForSelector('.pm-shell',{timeout:8000})
  await h.state(page,'r2precheck2-new-empty')
  await h.textButton(page,'更多')
  await h.state(page,'r2precheck2-more')
  const selector='input[placeholder="粘贴备份成功提示中的完整路径"]'
  await page.waitForSelector(selector,{visible:true,timeout:5000})
  assert.equal(await page.$eval(selector,n=>n.value),'')
  await page.click(selector)
  await page.keyboard.type(h.runtime+'/backups/current-f5-backup.json')
  await h.textButton(page,'预检本机备份')
  await page.waitForSelector('.pm-restore-confirm',{visible:true,timeout:10000})
  const ui=await h.state(page,'r2precheck2-valid-f5')
  console.log({text:ui.text?.slice(-2500),buttons:ui.buttons.slice(-14),dialogs:ui.dialogs})
}catch(e){
  await h.save('r2precheck2-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'r2precheck2-error-state')
  throw e
}finally{if(stop)await stop();await browser.disconnect()}

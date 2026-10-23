import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('F02RepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'r2precheck')
  await h.state(page,'r2precheck-current-after-navigation-timeout')
  const later=await page.evaluateHandle(()=>[...document.querySelectorAll('button')].find(n=>n.getClientRects().length&&n.innerText.trim()==='稍后再说'))
  if(later.asElement())await later.asElement().click()
  await page.click('[aria-label="项目管理"]')
  await page.waitForSelector('.pm-shell',{timeout:8000})
  await h.state(page,'r2precheck-new-empty')
  await h.textButton(page,'更多')
  await h.state(page,'r2precheck-more')
  const selector='input[placeholder="粘贴备份成功提示中的完整路径"]'
  await page.waitForSelector(selector,{visible:true,timeout:5000})
  assert.equal(await page.$eval(selector,n=>n.value),'')
  await page.click(selector)
  await page.keyboard.type(h.runtime+'/backups/current-f5-backup.json')
  await h.textButton(page,'预检本机备份')
  await page.waitForSelector('.pm-restore-confirm',{visible:true,timeout:10000})
  const ui=await h.state(page,'r2precheck-valid-f5')
  console.log({text:ui.text?.slice(-2500),buttons:ui.buttons.slice(-14),dialogs:ui.dialogs})
}catch(e){
  await h.save('r2precheck-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'r2precheck-error-state')
  throw e
}finally{if(stop)await stop();await browser.disconnect()}

import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2DisplayRepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'round05-a-tasks')
  await h.state(page,'round05-a-tree-before')
  async function rows(){
    return page.evaluate(()=>[...document.querySelectorAll('[data-pm-row]')].map(n=>({
      id:n.getAttribute('data-pm-row'),className:n.className,text:n.innerText,bbox:n.getBoundingClientRect().toJSON(),
      slot:[...n.querySelectorAll('.pm-export-slot')].map(s=>({text:s.innerText,title:s.title,bbox:s.getBoundingClientRect().toJSON(),time:s.querySelector('time')?{at:s.querySelector('time').dateTime,title:s.querySelector('time').title,text:s.querySelector('time').innerText}:null})),
      edit:[...n.querySelectorAll('.pt-acts button')].map(b=>({aria:b.getAttribute('aria-label'),bbox:b.getBoundingClientRect().toJSON()})),
      title:n.querySelector('.pt-gname,.pt-task')?.innerText
    })))
  }
  await h.save('round05-a-tree-rows.json',await rows())
  const target=await page.$('[data-pm-row="t-0007"]')
  assert(target)
  await target.scrollIntoView()
  await h.state(page,'round05-a-long-row-visible')
  await h.save('round05-a-long-row-layout.json',await rows())
  await page.click('[data-pm-row="t-0007"] .pt-acts button')
  await page.waitForSelector('[role="dialog"] input[name="title"]',{visible:true,timeout:10000})
  await h.state(page,'round05-a-long-title-edit-visible')
  assert.equal(await page.$eval('[role="dialog"] input[name="title"]',n=>n.value),'P2正式完成出站 <img src=x onerror=alert(20261023)>')
  await page.keyboard.press('Escape')
  await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'),{timeout:10000})
  await h.state(page,'round05-a-edit-cancel-zero-write')
  await page.click('button[aria-label="刷新数据"]')
  await h.state(page,'round05-a-refreshed')
  await h.save('round05-a-refreshed-rows.json',await rows())
  console.log(JSON.stringify({rows:(await rows()).map(n=>({id:n.id,slot:n.slot})),dialogs:await page.$$eval('[role=dialog]',n=>n.length)}))
}catch(e){await h.save('round05-error.json',{error:String(e),stack:e.stack});await h.state(page,'round05-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}

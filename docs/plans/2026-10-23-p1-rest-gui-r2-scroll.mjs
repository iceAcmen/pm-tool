import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-p1-history-harness-20261023-r1.mjs'
const h=createHarness('P1RestVisibleR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3267')
  stop=await h.record(page,'round02-rest-scroll')
  await h.state(page,'round02-before')
  await page.click('.pm-queue-toggle')
  const row=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-queue-row')].find(n=>n.querySelector('.pm-queue-title')?.innerText==='仅缺席不入评分'))
  const initial=await page.$$eval('.pm-queue-row',nodes=>nodes.map(n=>({text:n.innerText,title:n.querySelector('.pm-queue-title')?.innerText})))
  await h.save('round02-expanded-rows.json',initial)
  if(row.asElement())await row.asElement().scrollIntoView()
  else{
    const last=await page.$('.pm-queue-row:last-child')
    assert(last);await last.scrollIntoView()
  }
  await h.state(page,'round02-rest-lower-visible')
  const rows=await page.$$eval('.pm-queue-row',nodes=>nodes.map(n=>({
    text:n.innerText,title:n.querySelector('.pm-queue-title')?.innerText,project:n.querySelector('.pm-queue-code')?.innerText,
    absent:n.querySelector('.pm-queue-tag-absent')?.innerText,muted:n.querySelector('.pm-queue-tag-muted')?.innerText,bbox:n.getBoundingClientRect().toJSON()
  })))
  await h.save('round02-rest-visible-rows.json',rows)
  const expired=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-queue-row')].find(n=>n.querySelector('.pm-queue-title')?.innerText==='导出后改名'))
  if(expired.asElement()){
    await expired.asElement().scrollIntoView()
    await h.state(page,'round02-expired-row-visible')
  }
  console.log(JSON.stringify({rows}))
}catch(e){await h.save('round02-error.json',{error:String(e),stack:e.stack});await h.state(page,'round02-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}

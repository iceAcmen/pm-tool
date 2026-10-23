import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-p1-history-harness-20261023-r1.mjs'
const h=createHarness('P1RestVisibleR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3267')
  stop=await h.record(page,'round03-rest-follow')
  const visible=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-queue-row')].find(n=>n.querySelector('.pm-queue-title')?.innerText==='仅缺席任务'))
  assert(visible.asElement())
  await visible.asElement().scrollIntoView()
  await h.state(page,'round03-absence-rest-visible')
  const expired=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-queue-row')].find(n=>n.querySelector('.pm-queue-title')?.innerText==='导出后改名'))
  assert(expired.asElement());await expired.asElement().scrollIntoView()
  await h.state(page,'round03-expired-rest-visible')
  const rows=await page.$$eval('.pm-queue-row',nodes=>nodes.map(n=>({
    text:n.innerText,title:n.querySelector('.pm-queue-title')?.innerText,project:n.querySelector('.pm-queue-code')?.innerText,
    absent:n.querySelector('.pm-queue-tag-absent')?.innerText,muted:n.querySelector('.pm-queue-tag-muted')?.innerText,bbox:n.getBoundingClientRect().toJSON()
  })))
  await h.save('round03-rest-rows.json',rows)
  console.log(JSON.stringify({rows}))
}catch(e){await h.save('round03-error.json',{error:String(e),stack:e.stack});await h.state(page,'round03-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}

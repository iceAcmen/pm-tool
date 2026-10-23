import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2DisplayRepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'round09-okr-related')
  const nav=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-shell button')].find(n=>n.innerText.startsWith('目标（OKR）')))
  assert(nav.asElement());await nav.asElement().click()
  await page.waitForSelector('.pm-okr-kr',{visible:true,timeout:10000})
  await h.state(page,'round09-related-tree')
  async function tree(){
    return page.evaluate(()=>[...document.querySelectorAll('.pm-okr-node')].map(n=>({
      title:n.querySelector('.pm-okr-title')?.innerText,text:n.innerText,
      krs:[...n.querySelectorAll('.pm-okr-kr')].map(k=>({title:k.querySelector('.pm-okr-kr-title')?.innerText,primary:k.querySelector('.pm-okr-own-note')?.innerText,status:k.querySelector('.pm-okr-status')?.innerText,related:[...k.querySelectorAll('.pm-okr-related-row')].map(r=>({text:r.innerText,bbox:r.getBoundingClientRect().toJSON()}))}))
    })))
  }
  const a=await tree();await h.save('round09-related-adjacency.json',a)
  const kr=a.flatMap(n=>n.krs).find(n=>n.title==='P2主归属软关联KR20261023')
  assert(kr);assert.equal(kr.related.length,1);assert(kr.related[0].text.includes('okr-mvk2hl7d-refwvh'));assert(kr.related[0].text.includes('只展示，不参与权重'))
  await(await page.$('.pm-okr-kr')).scrollIntoView()
  await h.state(page,'round09-related-neighbor-visible')
  const tasks=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-shell button')].find(n=>n.innerText.startsWith('全部任务')))
  assert(tasks.asElement());await tasks.asElement().click()
  await page.waitForSelector('[data-pm-row="t-0007"]',{timeout:10000})
  await h.state(page,'round09-away-to-tasks')
  const back=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-shell button')].find(n=>n.innerText.startsWith('目标（OKR）')))
  await back.asElement().click()
  await page.waitForSelector('.pm-okr-related-row',{visible:true,timeout:10000})
  await h.state(page,'round09-related-reentry')
  await h.save('round09-reentry-adjacency.json',await tree())
  console.log(JSON.stringify({a,reentry:await tree()}))
}catch(e){await h.save('round09-error.json',{error:String(e),stack:e.stack});await h.state(page,'round09-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
